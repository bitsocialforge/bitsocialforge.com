import test from "node:test";
import assert from "node:assert/strict";
import { access, copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { runBrowserPlan, validatePlan } from "../browser-plan.mts";
import { createPlaywrightDriver } from "../browser-playwright.mts";
import { createFakePlaywright, fixturePlan, repoRoot, start } from "./fake-playwright.mts";
import { record } from "./helpers.mts";

test("a close during an open's setup stops that open before it starts a browser or leaves its directory", async () => {
  const previous = process.env.TMPDIR;
  const temp = await mkdtemp(path.join(tmpdir(), "jev-open-setup-"));
  const commands: string[][] = [];
  try {
    process.env.TMPDIR = temp;
    const driver = createPlaywrightDriver({
      execute: async (_file, args) => {
        commands.push(args);
        return { stdout: "", stderr: "" };
      },
    });
    const opening = driver.open(validatePlan(fixturePlan()));
    // A signal can close the driver while open() still awaits its CLI lookup and temp directory.
    await driver.close();
    await assert.rejects(opening, { code: "interrupted" });
    assert.deepEqual(commands, []);
    assert.deepEqual(await readdir(temp), []);
  } finally {
    if (previous === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = previous;
    await rm(temp, { recursive: true, force: true });
  }
});

test("an open that times out stops its launch before the slot is released", async () => {
  const fake = await createFakePlaywright();
  const launch = fake.gate("launch");
  const names = [
    "PLAYWRIGHT_CLI_BIN",
    "PLAYWRIGHT_RESOURCE_LOCK_DIR",
    "FAKE_PW_STATE",
    "FAKE_PW_OPEN_GATE",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    const env = fake.env({ FAKE_PW_OPEN_GATE: launch });
    for (const name of names) process.env[name] = env[name];
    const report = await runBrowserPlan(
      { ...fixturePlan(), limits: { deadlineMs: 1000 } },
      { driver: createPlaywrightDriver(), baseline: true },
    );
    assert.equal(report.reason, "browser_command_timeout");
    // A launch that outlived the timed-out wrapper would bring its browser up now.
    await fake.release(launch);
    await fake.launchesSettled();
    assert.deepEqual(await fake.openBrowsers(), []);
    await assert.rejects(access(fake.lock));
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
    await fake.release(launch);
    await fake.cleanup();
  }
});

const browserCli = path.join(repoRoot, "scripts/jev/browser.mts");
const benchmarkCli = path.join(repoRoot, "scripts/jev/browser-benchmark.mts");

for (const [signal, phase] of [
  ["SIGINT", "observing"],
  ["SIGTERM", "observing"],
  ["SIGTERM", "launching"],
] as const)
  test(`${signal} while the browser is ${phase} closes it and releases the slot before the CLI exits`, async () => {
    const fake = await createFakePlaywright();
    const launch = fake.gate("launch");
    try {
      const plan = path.join(fake.root, "plan.json");
      await writeFile(plan, JSON.stringify(fixturePlan()));
      const run = start(
        process.execPath,
        ["--experimental-strip-types", browserCli, "--plan", plan, "--live", "--baseline"],
        {
          cwd: fake.root,
          env: fake.env(
            phase === "observing" ? { FAKE_PW_BLOCK_OBSERVE: "1" } : { FAKE_PW_OPEN_GATE: launch },
          ),
        },
      );
      await fake.waitFor(
        phase === "observing" ? path.join(fake.state, "observe-blocked") : `${launch}.entered`,
      );
      run.child.kill(signal);
      const result = await run.exit;
      assert.equal(result.signal, null, "the CLI must not die from the signal's default action");
      assert.equal(result.code, 2, result.stderr);
      assert.equal(record(JSON.parse(result.stdout)).reason, "interrupted");
      // A launch that outlived the interrupted CLI would bring its browser up now.
      await fake.release(launch);
      await fake.launchesSettled();
      assert.deepEqual(await fake.openBrowsers(), []);
      await assert.rejects(access(fake.lock));
    } finally {
      await fake.release(launch);
      await fake.cleanup();
    }
  });

test("SIGTERM during a live benchmark closes the active browser and reports the interruption", async () => {
  const fake = await createFakePlaywright();
  try {
    const plan = path.join(fake.root, "plan.json");
    await writeFile(plan, JSON.stringify(fixturePlan()));
    const run = start(
      process.execPath,
      [
        "--experimental-strip-types",
        benchmarkCli,
        "--plan",
        plan,
        "--baseline-root",
        repoRoot,
        "--live",
        "--samples",
        "1",
        "--warmups",
        "0",
      ],
      { cwd: fake.root, env: fake.env({ FAKE_PW_BLOCK_OBSERVE: "1" }) },
    );
    await fake.waitFor(path.join(fake.state, "observe-blocked"));
    run.child.kill("SIGTERM");
    const result = await run.exit;
    assert.equal(
      result.signal,
      null,
      "the benchmark must not die from the signal's default action",
    );
    assert.equal(result.code, 2, result.stderr);
    assert.equal(record(JSON.parse(result.stdout)).interrupted, "SIGTERM");
    assert.deepEqual(await fake.openBrowsers(), []);
    await assert.rejects(access(fake.lock));
  } finally {
    await fake.cleanup();
  }
});

// The slot wrapper a retained baseline tree may ship: its launch runs as a plain child that a
// signal to the wrapper does not stop, and its close releases the slot even mid-launch.
const baselineWrapper = String.raw`#!/bin/bash
set -u
lock="${"$"}{PLAYWRIGHT_RESOURCE_LOCK_DIR:?}"
cli="${"$"}{PLAYWRIGHT_CLI_BIN:?}"
case "$1" in
  open)
    session="$2"
    shift 2
    mkdir "$lock" 2>/dev/null || exit 75
    printf '%s\n' "$session" >"$lock/owner"
    "$cli" -s="$session" open "$@" || { rm -rf "$lock"; exit 1; }
    ;;
  close)
    "$cli" -s="$2" close
    if [ "$(cat "$lock/owner" 2>/dev/null)" = "$2" ]; then rm -rf "$lock"; fi
    ;;
esac
`;

test("SIGTERM while the baseline transport is launching closes its browser once the launch settles", async () => {
  const fake = await createFakePlaywright();
  const launch = fake.gate("launch");
  try {
    const baseline = path.join(fake.root, "baseline");
    await mkdir(path.join(baseline, "scripts/jev"), { recursive: true });
    for (const file of await readdir(path.join(repoRoot, "scripts/jev")))
      if (file.endsWith(".mts"))
        await copyFile(
          path.join(repoRoot, "scripts/jev", file),
          path.join(baseline, "scripts/jev", file),
        );
    await writeFile(path.join(baseline, "scripts/pw-session.sh"), baselineWrapper, {
      mode: 0o755,
    });
    const plan = path.join(fake.root, "plan.json");
    await writeFile(plan, JSON.stringify(fixturePlan()));
    // With no warmup, the first run uses the baseline ("old") transport.
    const run = start(
      process.execPath,
      [
        "--experimental-strip-types",
        benchmarkCli,
        "--plan",
        plan,
        "--baseline-root",
        baseline,
        "--live",
        "--samples",
        "1",
        "--warmups",
        "0",
      ],
      { cwd: fake.root, env: fake.env({ FAKE_PW_OPEN_GATE: launch }) },
    );
    await fake.waitFor(`${launch}.entered`);
    run.child.kill("SIGTERM");
    // Give the benchmark time to act on the signal before the slow launch finishes.
    await Promise.race([run.exit, delay(1000)]);
    await fake.release(launch);
    const result = await run.exit;
    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.code, 2, result.stderr);
    assert.equal(record(JSON.parse(result.stdout)).interrupted, "SIGTERM");
    await fake.launchesSettled();
    assert.deepEqual(await fake.openBrowsers(), []);
    await assert.rejects(access(fake.lock));
  } finally {
    await fake.release(launch);
    await fake.cleanup();
  }
});

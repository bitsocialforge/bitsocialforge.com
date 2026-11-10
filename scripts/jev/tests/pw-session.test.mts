import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createFakePlaywright } from "./fake-playwright.mts";

const holder = async (lock: string) => (await readFile(path.join(lock, "owner"), "utf8")).trim();

// The wrappers sharing a slot may run with different time zones, or without a working `ps`.
const otherCallers = async (root: string): Promise<[string, Record<string, string>][]> => {
  const brokenPs = path.join(root, "broken-ps");
  await mkdir(brokenPs, { recursive: true });
  await writeFile(path.join(brokenPs, "ps"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  return [
    ["same time zone", { TZ: "JST-9" }],
    ["other time zone", { TZ: "UTC0" }],
    ["no working ps", { PATH: `${brokenPs}:${process.env.PATH ?? ""}` }],
  ];
};

test("a holder still launching its browser keeps the slot from a second opener", async () => {
  const fake = await createFakePlaywright();
  const launch = fake.gate("launch");
  try {
    const first = fake.session(["open", "first", "about:blank"], {
      env: fake.env({ FAKE_PW_OPEN_GATE: launch, TZ: "JST-9" }),
    });
    await fake.waitFor(`${launch}.entered`);
    for (const [caller, env] of await otherCallers(fake.root)) {
      const second = await fake.session(["open", "second", "about:blank"], {
        env: fake.env(env),
      }).exit;
      assert.equal(second.code, 75, `${caller}: ${second.stderr}`);
      assert.match(second.stderr, /starting or stopping/);
    }
    await fake.release(launch);
    assert.equal((await first.exit).code, 0);
    assert.deepEqual(await fake.openBrowsers(), ["first"]);
    assert.equal(await holder(fake.lock), "first");
  } finally {
    await fake.release(launch);
    await fake.cleanup();
  }
});

test("a holder closing its browser keeps the slot until it has released it", async () => {
  const fake = await createFakePlaywright();
  const stop = fake.gate("close");
  try {
    assert.equal((await fake.session(["open", "first", "about:blank"]).exit).code, 0);
    const closing = fake.session(["close", "first"], {
      env: fake.env({ FAKE_PW_CLOSE_GATE: stop, TZ: "JST-9" }),
    });
    await fake.waitFor(`${stop}.entered`);
    for (const [caller, env] of await otherCallers(fake.root)) {
      const second = await fake.session(["open", "second", "about:blank"], {
        env: fake.env(env),
      }).exit;
      assert.equal(second.code, 75, `${caller}: ${second.stderr}`);
    }
    await fake.release(stop);
    const closed = await closing.exit;
    assert.equal(closed.code, 0, closed.stderr);
    assert.match(closed.stdout, /released browser slot for 'first'/);
    assert.equal((await fake.session(["open", "second", "about:blank"]).exit).code, 0);
  } finally {
    await fake.release(stop);
    await fake.cleanup();
  }
});

test("a close from another time zone waits for a launch of the same session", async () => {
  const fake = await createFakePlaywright();
  const launch = fake.gate("launch");
  try {
    const first = fake.session(["open", "first", "about:blank"], {
      env: fake.env({ FAKE_PW_OPEN_GATE: launch, TZ: "JST-9" }),
    });
    await fake.waitFor(`${launch}.entered`);
    const closing = fake.session(["close", "first"], { env: fake.env({ TZ: "UTC0" }) });
    const early = await Promise.race([closing.exit.then(() => true), delay(2000, false)]);
    assert.equal(early, false, "close returned while the launch was still running");
    await fake.release(launch);
    assert.equal((await first.exit).code, 0);
    const closed = await closing.exit;
    assert.equal(closed.code, 0, closed.stderr);
    assert.deepEqual(await fake.openBrowsers(), []);
    await assert.rejects(access(fake.lock));
  } finally {
    await fake.release(launch);
    await fake.cleanup();
  }
});

test("a lock its creator abandoned before recording anything is still reclaimed", async () => {
  const fake = await createFakePlaywright();
  try {
    await mkdir(fake.lock);
    const opened = await fake.session(["open", "next", "about:blank"]).exit;
    assert.equal(opened.code, 0, opened.stderr);
    assert.deepEqual(await fake.openBrowsers(), ["next"]);
    assert.equal(await holder(fake.lock), "next");
  } finally {
    await fake.cleanup();
  }
});

test("a late stale-lock reclaim never removes a lock that was re-acquired meanwhile", async () => {
  const fake = await createFakePlaywright();
  const query = fake.gate("list");
  try {
    // A holder whose browser is gone left its lock behind.
    await mkdir(fake.lock);
    await writeFile(path.join(fake.lock, "owner"), "gone\n");
    await writeFile(path.join(fake.lock, "started-at"), "2026-01-01T00:00:00Z\n");
    await writeFile(path.join(fake.lock, "workspace"), `${fake.root}\n`);
    const late = fake.session(["open", "late", "about:blank"], {
      env: fake.env({ FAKE_PW_LIST_GATE: query }),
    });
    await fake.waitFor(`${query}.entered`);
    const fast = await fake.session(["open", "fast", "about:blank"]).exit;
    assert.equal(fast.code, 0, fast.stderr);
    assert.match(fast.stderr, /reclaimed stale slot from 'gone'/);
    await fake.release(query);
    const result = await late.exit;
    assert.equal(result.code, 75, result.stderr);
    assert.deepEqual(await fake.openBrowsers(), ["fast"]);
    assert.equal(await holder(fake.lock), "fast");
  } finally {
    await fake.release(query);
    await fake.cleanup();
  }
});

test("a reclaimer killed mid-reclaim blocks neither the holder's close nor a later reclaim", async () => {
  const fake = await createFakePlaywright();
  const marker = path.join(fake.lock, "reclaiming");
  try {
    // Killed inside a live lock after recording its PID.
    assert.equal((await fake.session(["open", "first", "about:blank"]).exit).code, 0);
    await mkdir(marker);
    await writeFile(path.join(marker, "pid"), `${spawnSync("true").pid}\n`);
    const closed = await fake.session(["close", "first"]).exit;
    assert.equal(closed.code, 0, closed.stderr);
    await assert.rejects(access(fake.lock));
    // Killed inside a stale lock before it could record its PID.
    await mkdir(marker, { recursive: true });
    await writeFile(path.join(fake.lock, "owner"), "gone\n");
    const opened = await fake.session(["open", "next", "about:blank"]).exit;
    assert.equal(opened.code, 0, opened.stderr);
    assert.deepEqual(await fake.openBrowsers(), ["next"]);
    assert.equal(await holder(fake.lock), "next");
  } finally {
    await fake.cleanup();
  }
});

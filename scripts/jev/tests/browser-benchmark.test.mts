import test from "node:test";
import assert from "node:assert/strict";
import { summarizePairs, main, readBenchmarkPlan } from "../browser-benchmark.mts";
import type { BenchmarkPairRun } from "../browser-benchmark.mts";
import { record, required } from "./helpers.mts";
import { createFakePlaywright, fixturePlan, repoRoot } from "./fake-playwright.mts";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("paired timing excludes warmups, failures and different action histories, and separates model runs", () => {
  const make = (sample: number, transport: BenchmarkPairRun['transport'], extra: Partial<BenchmarkPairRun> = {}): BenchmarkPairRun => ({
    case: "a",
    sample,
    transport,
    mode: "deterministic",
    status: "completed",
    actions: ["click"],
    assertions: [true],
    lifecycleMs: transport === "old" ? 200 : 100,
    controlCalls: transport === "old" ? 12 : 7,
    adapterMode: transport === "old" ? "legacy-separate" : "combined-aria",
    ...extra,
  });
  const runs = [
    make(0, "old"),
    make(0, "combined"),
    make(1, "old", { status: "incomplete" }),
    make(1, "combined"),
    make(2, "old"),
    make(2, "combined", { actions: ["different"] }),
    make(3, "old", { warmup: true }),
    make(3, "combined", { warmup: true }),
    make(0, "old", { mode: "jev" }),
    make(0, "combined", { mode: "jev", lifecycleMs: 300, adapterMode: "snapshot-command" }),
  ];
  const result = summarizePairs(runs);
  assert.equal(required(result[0]).pairs, 3);
  assert.equal(required(result[0]).comparablePairs, 1);
  assert.equal(required(result[0]).medianPairedReductionFraction, 0.5);
  assert.equal(required(result[1]).medianPairedReductionFraction, -0.5);
  assert.deepEqual(required(result[1]).combinedAdapterModes, ["snapshot-command"]);
});

test("benchmark rejects empty scopes and excessive samples or model budgets before launching anything", async () => {
  await assert.rejects(main([]), /invalid_benchmark_options/);
  for (const args of [
    ["--samples", "0"],
    ["--warmups", "3"],
    ["--max-cost-usd", "0.03"],
  ]) {
    await assert.rejects(
      main(["--plan", "absent.json", "--baseline-root", "/absent", ...args]),
      /invalid_benchmark_options/,
    );
  }
});

test("plan reader is bounded and refuses non-files and symlinks before browser execution", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "jev-benchmark-input-"));
  try {
    const file = path.join(directory, "plan.json");
    await fs.writeFile(file, '{"version":1}');
    assert.deepEqual(await readBenchmarkPlan(file), { version: 1 });
    await fs.symlink(file, path.join(directory, "link.json"));
    await assert.rejects(readBenchmarkPlan(path.join(directory, "link.json")));
    await assert.rejects(readBenchmarkPlan(directory));
    await fs.writeFile(file, "x".repeat(100001));
    await assert.rejects(readBenchmarkPlan(file), /invalid_benchmark_plan/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("live Jev benchmark stops launching browsers once its shared client can no longer answer", async () => {
  const fake = await createFakePlaywright();
  const names = [
    "PLAYWRIGHT_CLI_BIN",
    "PLAYWRIGHT_RESOURCE_LOCK_DIR",
    "FAKE_PW_STATE",
    "TYPESAFE_API_KEY",
    "JEV_MODEL",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const { fetch } = globalThis;
  const { log, error } = console;
  const output: string[] = [];
  try {
    const env = fake.env({ TYPESAFE_API_KEY: "fixture-key", JEV_MODEL: "jev-1.13.0" });
    for (const name of names) process.env[name] = env[name];
    globalThis.fetch = async () => {
      throw new Error("the exhausted budget must stop requests before the provider");
    };
    console.log = (line: unknown) => output.push(String(line));
    console.error = () => {};
    const plan = path.join(fake.root, "plan.json");
    await fs.writeFile(plan, JSON.stringify(fixturePlan()));
    // The first model request already exceeds this budget, so every later run would fail too.
    const code = await main([
      "--plan",
      plan,
      "--baseline-root",
      repoRoot,
      "--live",
      "--jev",
      "--samples",
      "2",
      "--warmups",
      "0",
      "--max-cost-usd",
      "0.0000001",
    ]);
    assert.equal(code, 2);
    const report = record(JSON.parse(output.join("\n")));
    assert.equal(report.interrupted, "budget_exhausted");
    assert.ok(Array.isArray(report.runs));
    assert.equal(report.runs.length, 1);
    assert.equal(record(report.runs[0]).reason, "budget_exhausted");
    assert.equal(await fake.commands("open"), 1);
    assert.deepEqual(await fake.openBrowsers(), []);
  } finally {
    globalThis.fetch = fetch;
    Object.assign(console, { log, error });
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
    await fake.cleanup();
  }
});

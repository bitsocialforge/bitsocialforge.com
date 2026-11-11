import test from "node:test";
import assert from "node:assert/strict";
import { summarizePairs, main, readBenchmarkPlan } from "../browser-benchmark.mts";
import type { BenchmarkPairRun } from "../browser-benchmark.mts";
import { record, required } from "./helpers.mts";
import { INPUT_USD_PER_MILLION } from "../client.mts";
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

// main() against the fake CLI, with a fixture model configuration and a provider that counts
// requests and fails every one of them, so each run ends at its first request that is sent.
async function liveJevBenchmark() {
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
  let output: string[] = [];
  let requests = 0;
  const env = fake.env({ TYPESAFE_API_KEY: "fixture-key", JEV_MODEL: "jev-1.13.0" });
  for (const name of names) process.env[name] = env[name];
  globalThis.fetch = async () => {
    requests++;
    throw new Error("the provider is unavailable in tests");
  };
  console.log = (line: unknown) => output.push(String(line));
  console.error = () => {};
  return {
    fake,
    requests: () => requests,
    async run(plans: string[], options: string[]) {
      output = [];
      const code = await main([
        ...plans.flatMap((plan) => ["--plan", plan]),
        "--baseline-root",
        repoRoot,
        "--live",
        "--jev",
        "--warmups",
        "0",
        ...options,
      ]);
      return { code, report: record(JSON.parse(output.join("\n"))) };
    },
    async restore() {
      globalThis.fetch = fetch;
      Object.assign(console, { log, error });
      for (const name of names) {
        if (previous[name] === undefined) delete process.env[name];
        else process.env[name] = previous[name];
      }
      await fake.cleanup();
    },
  };
}

test("live Jev benchmark stops launching browsers once its shared client can no longer answer", async () => {
  const live = await liveJevBenchmark();
  try {
    const plan = path.join(live.fake.root, "plan.json");
    await fs.writeFile(plan, JSON.stringify(fixturePlan()));
    // The first run uses the only request this budget allows, so every later run would fail.
    const { code, report } = await live.run([plan], ["--samples", "2", "--max-requests", "1"]);
    assert.equal(code, 2);
    assert.equal(report.interrupted, "budget_exhausted");
    assert.ok(Array.isArray(report.runs));
    assert.equal(report.runs.length, 1);
    assert.equal(live.requests(), 1);
    assert.equal(await live.fake.commands("open"), 1);
    assert.deepEqual(await live.fake.openBrowsers(), []);
  } finally {
    await live.restore();
  }
});

test("live Jev benchmark stops launching browsers when its first model request already exceeds the budget", async () => {
  const live = await liveJevBenchmark();
  try {
    const plan = path.join(live.fake.root, "plan.json");
    await fs.writeFile(plan, JSON.stringify(fixturePlan()));
    // No request fits this budget, so the client refuses the first run's request without sending
    // it, and every later run would fail the same way.
    const { code, report } = await live.run(
      [plan],
      ["--samples", "2", "--max-cost-usd", "0.0000001"],
    );
    assert.equal(code, 2);
    assert.equal(report.interrupted, "budget_exhausted");
    assert.ok(Array.isArray(report.runs));
    assert.deepEqual(
      report.runs.map((run) => record(run).reason),
      ["budget_exhausted"],
    );
    assert.equal(live.requests(), 0);
    assert.equal(await live.fake.commands("open"), 1);
    assert.deepEqual(await live.fake.openBrowsers(), []);
  } finally {
    await live.restore();
  }
});

// The input tokens one run of this plan reserves for its first, and in these tests only, request.
async function requestReserve(live: Awaited<ReturnType<typeof liveJevBenchmark>>, plan: string) {
  const { report } = await live.run([plan], ["--samples", "1"]);
  assert.ok(Array.isArray(report.runs));
  const reserves = report.runs.map((run) => Number(record(record(run).usage).reservedInputTokens));
  assert.equal(reserves.length, 2);
  assert.equal(reserves[0], reserves[1]);
  assert.ok(reserves[0]! > 0);
  return reserves[0]!;
}
const costBudget = (tokens: number) => String((tokens * INPUT_USD_PER_MILLION) / 1e6);

test("live Jev benchmark stops launching browsers once no further request fits its cost budget", async () => {
  const live = await liveJevBenchmark();
  try {
    const plan = path.join(live.fake.root, "plan.json");
    await fs.writeFile(plan, JSON.stringify(fixturePlan()));
    const reserve = await requestReserve(live, plan);
    const requests = live.requests();
    const opens = await live.fake.commands("open");
    // Room for one and a half requests: after the first run, no further request of this plan fits.
    const { code, report } = await live.run(
      [plan],
      ["--samples", "3", "--max-cost-usd", costBudget(reserve * 1.5)],
    );
    assert.equal(code, 2);
    assert.equal(report.interrupted, "budget_exhausted");
    assert.ok(Array.isArray(report.runs));
    assert.deepEqual(
      report.runs.map((run) => record(run).reason),
      ["provider_unavailable"],
    );
    assert.equal(live.requests() - requests, 1);
    assert.equal((await live.fake.commands("open")) - opens, 1);
    assert.deepEqual(await live.fake.openBrowsers(), []);
  } finally {
    await live.restore();
  }
});

test("a request too large for the remaining model budget does not stop later, smaller runs", async () => {
  const live = await liveJevBenchmark();
  try {
    const small = path.join(live.fake.root, "small.json");
    const large = path.join(live.fake.root, "large.json");
    const later = path.join(live.fake.root, "later.json");
    await fs.writeFile(small, JSON.stringify(fixturePlan()));
    await fs.writeFile(later, JSON.stringify(fixturePlan()));
    await fs.writeFile(
      large,
      JSON.stringify({ ...fixturePlan(), goal: fixturePlan().goal.padEnd(2000, ".") }),
    );
    const reserve = await requestReserve(live, small);
    const requests = live.requests();
    const opens = await live.fake.commands("open");
    // After the small plan's two requests, room for one more small request, but not for the
    // large plan's ~2000 extra bytes. The third small request leaves room for none.
    const { code, report } = await live.run(
      [small, large, later],
      ["--samples", "1", "--max-cost-usd", costBudget(3 * reserve + 1000)],
    );
    assert.equal(code, 2);
    assert.equal(report.interrupted, "budget_exhausted");
    assert.ok(Array.isArray(report.runs));
    assert.deepEqual(
      report.runs.map((run) => [record(run).plan, record(run).reason]),
      [
        ["small.json", "provider_unavailable"],
        ["small.json", "provider_unavailable"],
        ["large.json", "budget_exhausted"],
        ["large.json", "budget_exhausted"],
        ["later.json", "provider_unavailable"],
      ],
    );
    assert.equal(live.requests() - requests, 3);
    assert.equal((await live.fake.commands("open")) - opens, 5);
    assert.deepEqual(await live.fake.openBrowsers(), []);
  } finally {
    await live.restore();
  }
});

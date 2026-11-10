import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { runBrowserPlan } from "../browser-plan.mts";
import { createPlaywrightDriver } from "../browser-playwright.mts";
import { createFakePlaywright, fixturePlan } from "./fake-playwright.mts";

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

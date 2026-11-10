import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { getPortlessPublicUrl } from "./local-server-utils.mts";

const localServerUtilsUrl = new URL("./local-server-utils.mts", import.meta.url).href;

// Stands in for start-dev.mts: spawns a long-running child, hands it to
// forwardChildExit and prints the child's pid once the forwarding is set up.
const launcherSource = `
import { spawn } from "node:child_process";
import { forwardChildExit } from ${JSON.stringify(localServerUtilsUrl)};

const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
forwardChildExit(child);
process.stdout.write(\`\${child.pid}\\n\`);
`;

function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid: number, timeoutMs: number) {
  const startedAt = Date.now();
  while (isRunning(pid) && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return !isRunning(pid);
}

// portless only stops its detached app on SIGINT and SIGTERM, so a hangup must
// reach the child as SIGTERM. The plain child here dies of whatever signal it
// gets and the launcher re-raises it, so the launcher's exit signal shows it.
for (const [signal, forwardedSignal] of [
  ["SIGINT", "SIGINT"],
  ["SIGTERM", "SIGTERM"],
  ["SIGHUP", "SIGTERM"],
] as const) {
  test(
    `forwardChildExit stops the child when only the launcher receives ${signal}`,
    { timeout: 15_000 },
    async (t) => {
      const launcher = spawn(
        process.execPath,
        [
          "--experimental-strip-types",
          "--no-warnings",
          "--input-type=module",
          "-e",
          launcherSource,
        ],
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      const launcherExit = once(launcher, "exit");
      let childPid: number | undefined;
      t.after(() => {
        if (childPid !== undefined && isRunning(childPid)) {
          process.kill(childPid, "SIGKILL");
        }
        if (launcher.exitCode === null && launcher.signalCode === null) {
          launcher.kill("SIGKILL");
        }
      });

      let output = "";
      launcher.stdout.setEncoding("utf8");
      for await (const chunk of launcher.stdout) {
        output += chunk;
        if (output.includes("\n")) break;
      }
      childPid = Number(output.trim());
      assert.ok(
        Number.isInteger(childPid) && childPid > 0,
        `launcher printed no child pid: ${output}`,
      );

      launcher.kill(signal);
      const [, launcherSignal] = await launcherExit;

      assert.equal(
        await waitForExit(childPid, 3_000),
        true,
        `child ${childPid} kept running after the launcher got ${signal}`,
      );
      assert.equal(launcherSignal, forwardedSignal);
    },
  );
}

test("getPortlessPublicUrl keeps a non-default proxy port in the URL", () => {
  assert.equal(
    getPortlessPublicUrl("bitsocialforge", "1355"),
    "https://bitsocialforge.localhost:1355",
  );
  assert.equal(
    getPortlessPublicUrl("feature.bitsocialforge", "443"),
    "https://feature.bitsocialforge.localhost",
  );
});

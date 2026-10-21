import { spawn } from "node:child_process";
import { resolvePort } from "./dev-server-utils.mts";
import {
  ensurePortlessProxy,
  fallbackHost,
  fallbackUrlHost,
  forwardChildExit,
  getLocalServerCommand,
  getPortlessAppName,
  openInBrowser,
  portlessBin,
  portlessEnv,
  waitForUrlReady,
} from "./local-server-utils.mts";

const fallbackRequestedPort = Number(process.env.PORT) || 4173;
const portlessBaseName = "bitsocialforge";

const command = getLocalServerCommand();
let args: string[];
let publicUrl: string | null = null;

if (command === portlessBin) {
  ensurePortlessProxy();
  const appName = getPortlessAppName();

  publicUrl = `https://${appName}.localhost`;
  args = [appName, "vite"];

  if (appName !== portlessBaseName) {
    console.log(`Starting Portless dev server at ${publicUrl}`);
  }
} else {
  const port = await resolvePort(fallbackRequestedPort);
  const fallbackUrl = `http://${fallbackUrlHost}:${port}`;

  args = ["--host", fallbackHost, "--port", String(port), "--strictPort"];

  if (command !== portlessBin && process.env.PORTLESS !== "0") {
    console.warn(`portless unavailable on this platform, using vite directly on ${fallbackUrl}`);
  } else {
    console.log(`Starting Vite directly at ${fallbackUrl}`);
  }

  if (port !== fallbackRequestedPort) {
    console.log(
      `Preferred port ${fallbackRequestedPort} is busy, so this run will use ${fallbackUrl}.`,
    );
  }
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: command === portlessBin ? portlessEnv : process.env,
});

const readyUrl = publicUrl;
if (readyUrl && process.env.BROWSER !== "none") {
  waitForUrlReady(readyUrl, 30_000)
    .then(() => {
      console.log(`Opening ${publicUrl} in browser...`);
      openInBrowser(readyUrl);
    })
    .catch((error) => {
      console.warn(`Could not auto-open ${publicUrl}: ${error.message}`);
    });
}

forwardChildExit(child);

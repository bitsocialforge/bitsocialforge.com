import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";
import { resolvePort } from "./dev-server-utils.mts";

const loopbackHost = "127.0.0.1";

// Listens on a free port below 65535, so the next port exists. Without a host
// Node listens on the dual-stack wildcard address (or 0.0.0.0 without IPv6).
async function listenOnFreePort(host?: string) {
  for (;;) {
    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, host, resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    if (address.port < 65_535) {
      return { server, port: address.port };
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

async function assertResolvePortSkipsPortHeldOn(host: string | undefined, t: test.TestContext) {
  const { server, port: busyPort } = await listenOnFreePort(host);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const port = await resolvePort(busyPort, loopbackHost);

  assert.ok(port > busyPort, `expected a port after ${busyPort}, got ${port}`);
}

test("resolvePort skips a port that is already held on the host the dev server binds", async (t) => {
  await assertResolvePortSkipsPortHeldOn(loopbackHost, t);
});

test("resolvePort skips a port that is already held on the wildcard address", async (t) => {
  await assertResolvePortSkipsPortHeldOn(undefined, t);
});

test("resolvePort skips a port that is already held on ::1, where localhost URLs can land", async (t) => {
  const ipv6Loopback = "::1";
  const probe = net.createServer();
  const ipv6LoopbackError = await new Promise<NodeJS.ErrnoException | null>((resolve) => {
    probe.once("error", resolve);
    probe.listen(0, ipv6Loopback, () => probe.close(() => resolve(null)));
  });
  if (ipv6LoopbackError) {
    t.skip(`::1 is not available here (${ipv6LoopbackError.code})`);
    return;
  }

  await assertResolvePortSkipsPortHeldOn(ipv6Loopback, t);
});

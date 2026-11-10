import net from "node:net";

const ipv6Loopback = "::1";
// The address does not exist on this machine (for example IPv6 is off), so
// nothing can be listening on it.
const missingAddressCodes = new Set(["EADDRNOTAVAIL", "EAFNOSUPPORT"]);

function checkPort(port: number, host?: string, missingAddressIsFree = false) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      resolve(missingAddressIsFree && missingAddressCodes.has(error.code ?? ""));
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

// On macOS a listen succeeds on one of these addresses while another server
// holds the same port on a different one, so each probe catches its own case:
// `host` is what the dev server binds, a hostless listen covers the wildcard
// address (dual-stack where IPv6 exists), and ::1 is where `localhost` URLs
// land first on macOS.
async function isPortFree(port: number, host: string) {
  return (
    (await checkPort(port, host)) &&
    (await checkPort(port)) &&
    (await checkPort(port, ipv6Loopback, true))
  );
}

export async function resolvePort(requestedPort: number, host: string) {
  let port = requestedPort;

  while (!(await isPortFree(port, host))) {
    port += 1;
  }

  return port;
}

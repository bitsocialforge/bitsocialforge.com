import net from "node:net";

function checkPort(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

export async function resolvePort(requestedPort: number) {
  let port = requestedPort;

  while (!(await checkPort(port))) {
    port += 1;
  }

  return port;
}

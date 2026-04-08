import { spawn } from "node:child_process";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startTestServer({ mongoUri, port }) {
  // Start the actual backend entry file so integration tests exercise the same routing stack as normal runtime.
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      MONGO_URI: mongoUri,
      JWT_SECRET: process.env.JWT_SECRET,
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${port}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return { child, baseUrl };
      }
    } catch {
      // Keep polling until the server is ready to accept requests.
    }

    await wait(250);
  }

  child.kill();
  throw new Error("Test server failed to start in time");
}

export async function stopTestServer(child) {
  if (!child || child.killed) {
    return;
  }

  // Stop the spawned backend once the integration suite is finished.
  child.kill();
  await wait(250);
}

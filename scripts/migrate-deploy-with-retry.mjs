import { spawn } from "node:child_process";

if (!process.env.DIRECT_URL) {
  console.error("DIRECT_URL is required for Prisma migrations. No migration was started.");
  process.exit(1);
}

// Prisma's PostgreSQL advisory-lock wait is fixed at 10 seconds. Concurrent
// Vercel builds can therefore fail even when another deployment is applying
// valid migrations and will release the lock shortly. Retry only that case;
// schema, connection, and migration errors still fail the build immediately.
const retryDelaysMs = [10_000, 20_000, 30_000, 45_000, 60_000];
const command = process.platform === "win32" ? "npx.cmd" : "npx";

function runMigrateDeploy() {
  return new Promise((resolve) => {
    let output = "";
    let settled = false;
    const child = spawn(command, ["prisma", "migrate", "deploy"], {
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    const collect = (chunk, write) => {
      const text = chunk.toString();
      output = `${output}${text}`.slice(-20_000);
      write.write(text);
    };

    child.stdout.on("data", (chunk) => collect(chunk, process.stdout));
    child.stderr.on("data", (chunk) => collect(chunk, process.stderr));
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      console.error("Could not start Prisma migration command:", error);
      resolve({ code: 1, output });
    });
    child.once("close", (code) => {
      if (settled) return;
      settled = true;
      resolve({ code: code ?? 1, output });
    });
  });
}

const isAdvisoryLockTimeout = (output) =>
  /P1002/i.test(output) && /advisory lock/i.test(output);

for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
  const result = await runMigrateDeploy();
  if (result.code === 0) process.exit(0);

  const delay = retryDelaysMs[attempt];
  if (!isAdvisoryLockTimeout(result.output) || delay === undefined) {
    process.exit(result.code);
  }

  const waitMs = delay + Math.floor(Math.random() * 5_000);
  console.warn(
    `Prisma migration advisory lock is busy. Retrying in ${(waitMs / 1000).toFixed(1)}s ` +
      `(attempt ${attempt + 2} of ${retryDelaysMs.length + 1}).`,
  );
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}

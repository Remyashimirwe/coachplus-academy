import { spawnSync } from "node:child_process";

function run(command, args) {
  const executable =
    process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function getMigrationUrl() {
  const directUrl =
    process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED;
  if (directUrl) return directUrl;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Production Vercel builds need DIRECT_URL (or DATABASE_URL_UNPOOLED) to apply Prisma migrations.",
    );
  }

  let hostname;
  try {
    hostname = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }

  if (/pooler|pgbouncer|pooled/.test(hostname)) {
    throw new Error(
      "DATABASE_URL uses a connection pool. Set DIRECT_URL to the database's direct connection for production migrations.",
    );
  }

  return databaseUrl;
}

const isVercelProduction =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

if (isVercelProduction) {
  process.env.DIRECT_URL ||= getMigrationUrl();
  run("npm", ["run", "db:migrate:deploy"]);
}

run("npx", ["prisma", "generate"]);
run("npx", ["next", "build"]);

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  // Neon's pooled endpoint (PgBouncer) silently drops idle connections on its
  // own schedule (typically ~5s). If a client sits idle in our pool longer than
  // that, the next query on it fails with "Connection terminated unexpectedly"
  // after a long OS-level hang. Recycling idle clients quickly on our side
  // (and enabling TCP keepalive) avoids handing out stale connections.
  idleTimeoutMillis: 4_000,
  // Limit pool size to avoid overwhelming the serverless endpoint
  max: 10,
  // Neon's serverless compute can take several seconds to resume from
  // suspend on the first request after being idle, so give new connection
  // attempts more room than the default before giving up.
  connectionTimeoutMillis: 20_000,
  keepAlive: true,
  // Allow the pool to drain when the process exits
  allowExitOnIdle: true,
});

// Without a listener, errors emitted by idle clients in the pool (e.g. the
// database closing a stale connection) become unhandled 'error' events and
// can crash the process instead of just letting the pool discard the client.
pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = prisma;

export async function getPrograms() {
  return prisma.program.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subjects: {
        orderBy: { sortOrder: "asc" },
        include: {
          topics: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function getProgramById(id: number) {
  return prisma.program.findUnique({
    where: { id },
    include: {
      subjects: {
        orderBy: { sortOrder: "asc" },
        include: {
          topics: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getSetting(key: string, defaultValue: string = "") {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

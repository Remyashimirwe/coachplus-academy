import "server-only";

import { createRealtime, rawSql } from "@neon/realtime/server";
import { prisma } from "@/app/lib/db";
import type { RealtimeDemoRow } from "@/app/lib/realtime-demo-types";

const liveQuery = rawSql<RealtimeDemoRow>(
  'SELECT "id", "message" FROM public.realtime_demo ORDER BY "id" DESC LIMIT 20',
);

function getRealtimeServer() {
  const secret = process.env.NEON_REALTIME_SECRET;
  const databaseUrl = process.env.DATABASE_URL;

  if (!secret || !databaseUrl) {
    throw new Error("Neon Realtime is not configured for this environment.");
  }

  const database = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\/+/, ""));
  if (!database) {
    throw new Error("The Neon database name is missing from DATABASE_URL.");
  }

  return createRealtime({ secret, db: database });
}

export async function loadRealtimeDemo() {
  const realtime = getRealtimeServer();
  const [initialData, sealedQuery] = await Promise.all([
    prisma.$queryRaw<RealtimeDemoRow[]>`
      SELECT "id", "message"
      FROM public.realtime_demo
      ORDER BY "id" DESC
      LIMIT 20
    `,
    realtime.seal({ query: liveQuery }),
  ]);

  return { initialData, sealedQuery };
}

export async function renewRealtimeDemoQuery() {
  return getRealtimeServer().seal({ query: liveQuery });
}

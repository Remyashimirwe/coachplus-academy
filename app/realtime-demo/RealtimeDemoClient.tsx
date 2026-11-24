"use client";

import { useCallback, useState } from "react";
import { createRealtimeClient, type SealedLiveQuery } from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import type { RealtimeDemoRow } from "@/app/lib/realtime-demo-types";

function LiveRows({
  initialData,
  sealedQuery,
}: {
  initialData: RealtimeDemoRow[];
  sealedQuery: SealedLiveQuery<RealtimeDemoRow>;
}) {
  const refreshQuery = useCallback(async () => {
    const response = await fetch("/api/realtime-demo/sealed", {
      method: "POST",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Could not renew the live query.");
    }
    return (await response.json()) as SealedLiveQuery<RealtimeDemoRow>;
  }, []);

  const { data, status, error } = useLiveQuery(sealedQuery, {
    initialData,
    refreshQuery,
  });

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Latest rows</h2>
        <p className="text-sm text-slate-600" role="status" data-testid="realtime-status">
          {status === "live" ? "Live" : status === "stale" ? "Reconnecting..." : status === "error" ? "Stopped" : "Connecting..."}
        </p>
      </div>

      {status === "error" ? (
        <p className="mt-4 text-sm text-red-700" role="alert">Live updates stopped: {error.message}</p>
      ) : null}

      {data === undefined ? (
        <p className="mt-4 text-sm text-slate-600">Loading rows...</p>
      ) : data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No rows yet. Insert one in the database to see it arrive live.</p>
      ) : (
        <ol className="mt-4 space-y-3" data-testid="realtime-rows">
          {data.map((row) => (
            <li key={row.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <span className="mr-3 font-mono text-xs text-slate-500">#{row.id}</span>
              {row.message}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function RealtimeDemoClient({
  initialData,
  sealedQuery,
  realtimeUrl,
}: {
  initialData: RealtimeDemoRow[];
  sealedQuery: SealedLiveQuery<RealtimeDemoRow>;
  realtimeUrl: string;
}) {
  const [client] = useState(() => createRealtimeClient({ url: realtimeUrl }));

  return (
    <RealtimeProvider client={client}>
      <LiveRows initialData={initialData} sealedQuery={sealedQuery} />
    </RealtimeProvider>
  );
}

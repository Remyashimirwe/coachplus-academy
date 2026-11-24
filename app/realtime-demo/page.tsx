import { loadRealtimeDemo } from "@/app/lib/realtime-demo";
import RealtimeDemoClient from "./RealtimeDemoClient";

export const dynamic = "force-dynamic";

export default async function RealtimeDemoPage() {
  const { initialData, sealedQuery } = await loadRealtimeDemo();
  const realtimeUrl = process.env.NEON_REALTIME_URL;
  if (!realtimeUrl) {
    throw new Error("NEON_REALTIME_URL is not configured for this environment.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-16 pt-32 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#7B1FA2] p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Neon Realtime beta</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Live query demo</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
          This page subscribes to a server-sealed query. New rows appear here as soon as they commit.
        </p>
      </div>

      <RealtimeDemoClient
        initialData={initialData}
        sealedQuery={sealedQuery}
        realtimeUrl={realtimeUrl}
      />
    </main>
  );
}

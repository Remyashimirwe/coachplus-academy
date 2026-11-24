import { withApiObservability } from "@/app/lib/api-observability";
import { renewRealtimeDemoQuery } from "@/app/lib/realtime-demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST() {
  const sealedQuery = await renewRealtimeDemoQuery();
  return Response.json(sealedQuery, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const POST = withApiObservability("POST /api/realtime-demo/sealed", handlePOST);

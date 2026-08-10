import { Request } from "@prisma/client";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import RequestsView from "../components/RequestsView";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  await requireAdmin();

  const requests = await db.request.findMany({
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <RequestsView 
      requests={requests.map((r: Request) => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString()
      }))} 
    />
  );
}

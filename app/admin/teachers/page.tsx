import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import TeachersView from "../components/TeachersView";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  await requireAdmin();

  const teacherApplications = await db.teacherApplication.findMany({
    where: { status: { not: "rejected" } },
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        select: { id: true, kind: true, fileName: true, mimeType: true, createdAt: true },
      },
    },
  });

  return (
    <TeachersView 
      teacherApplications={teacherApplications.map((t) => ({
        ...t,
        created_at: t.createdAt.toISOString()
      }))}
    />
  );
}

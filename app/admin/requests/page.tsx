import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import RequestsView from "../components/RequestsView";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  await requireAdmin();

  const [requests, teachers] = await Promise.all([
    db.request.findMany({
      include: { student: { include: { user: true, teacher: { include: { user: true } } } } },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    }),
    db.teacher.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <RequestsView
      requests={requests.map((r) => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString(),
        assignedTeacher: r.student?.teacher ?? null,
      }))}
      teachers={teachers.map((t) => ({
        id: t.id,
        name: t.user.name,
        email: t.user.email,
        phone: t.phone,
        branch: t.branch,
        subjects: t.subjects,
      }))}
    />
  );
}

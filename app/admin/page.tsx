import { requireAdmin } from "@/app/lib/dal";
import { db, getPrograms } from "@/app/lib/db";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const programs = await getPrograms();
  const requests = await db.request.findMany({
    orderBy: [
      { status: "asc" }, // This might not work exactly like SQLite CASE but "new" comes before others alphabetically
      { createdAt: "desc" },
    ],
  });
  
  const teacherApplications = await db.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminDashboard 
      programs={programs} 
      requests={requests.map(r => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString()
      }))} 
      teacherApplications={teacherApplications.map(t => ({
        ...t,
        created_at: t.createdAt.toISOString()
      }))}
    />
  );
}

import { Request, TeacherApplication } from "@prisma/client";
import { requireAdmin } from "@/app/lib/dal";
import { db, getPrograms } from "@/app/lib/db";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const programs = await getPrograms();
  const requests = await db.request.findMany({
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });
  
  const teacherApplications = await db.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminDashboard 
      programs={programs} 
      requests={requests.map((r: Request) => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString()
      }))} 
      teacherApplications={teacherApplications.map((t: TeacherApplication) => ({
        ...t,
        created_at: t.createdAt.toISOString()
      }))}
    />
  );
}

import { TeacherApplication } from "@prisma/client";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import TeachersView from "../components/TeachersView";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  await requireAdmin();

  const teacherApplications = await db.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <TeachersView 
      teacherApplications={teacherApplications.map((t: TeacherApplication) => ({
        ...t,
        created_at: t.createdAt.toISOString()
      }))}
    />
  );
}

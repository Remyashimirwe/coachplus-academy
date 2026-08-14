import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import OverviewView from "./components/OverviewView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const programs = await db.program.findMany({
    include: {
      subjects: {
        include: {
          topics: true,
        },
      },
    },
  });

  const requests = await db.request.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const teacherApplications = await db.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingApplications = await db.teacherApplication.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <OverviewView
      programs={programs}
      requests={requests.map((r) => ({
        ...r,
        parent_name: r.parentName,
        created_at: r.createdAt.toISOString(),
      }))}
      teacherApplications={teacherApplications.map((t) => ({
        ...t,
        created_at: t.createdAt.toISOString(),
      }))}
      pendingApplications={pendingApplications.map((t) => ({
        ...t,
        created_at: t.createdAt.toISOString(),
      }))}
    />
  );
}

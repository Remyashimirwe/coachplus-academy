import { requireAdmin } from "@/app/lib/dal";
import { getSetting, db } from "@/app/lib/db";
import SettingsView from "../components/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();

  const teacherApplicationsOpen = await getSetting("teacher_applications_open", "true") === "true";

  const teacherApplications = await db.teacherApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      subjects: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <SettingsView
      initialSettings={{ teacherApplicationsOpen }}
      teacherApplications={teacherApplications.map((t) => ({
        ...t,
        created_at: t.createdAt.toISOString(),
      }))}
    />
  );
}
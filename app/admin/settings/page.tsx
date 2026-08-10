import { requireAdmin } from "@/app/lib/dal";
import { getSetting } from "@/app/lib/db";
import SettingsView from "../components/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();

  const teacherApplicationsOpen = await getSetting("teacher_applications_open", "true") === "true";

  return <SettingsView initialSettings={{ teacherApplicationsOpen }} />;
}

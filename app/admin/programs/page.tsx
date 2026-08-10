import { requireAdmin } from "@/app/lib/dal";
import { getPrograms } from "@/app/lib/db";
import ProgramsView from "../components/ProgramsView";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  await requireAdmin();
  const programs = await getPrograms();

  return <ProgramsView programs={programs} />;
}

import { getCachedPrograms } from "@/app/lib/db";
import ProgramsView from "./ProgramsView";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const programs = await getCachedPrograms();
  return <ProgramsView programs={programs} />;
}

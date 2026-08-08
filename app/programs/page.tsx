import { getPrograms } from "@/app/lib/db";
import ProgramsView from "./ProgramsView";

export const dynamic = "force-dynamic";

export default function ProgramsPage() {
  const programs = getPrograms();
  return <ProgramsView programs={programs} />;
}

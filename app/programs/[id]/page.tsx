import { getProgramById } from "@/app/lib/db";
import { notFound } from "next/navigation";
import ProgramDetailView from "../ProgramDetailView";

export const dynamic = "force-dynamic";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programId = parseInt(id);

  if (isNaN(programId)) {
    notFound();
  }

  const program = await getProgramById(programId);

  if (!program) {
    notFound();
  }

  return <ProgramDetailView program={program} />;
}

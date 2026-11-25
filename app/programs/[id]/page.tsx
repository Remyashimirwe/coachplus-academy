import { getCachedProgramById } from "@/app/lib/db";
import { notFound } from "next/navigation";
import ProgramDetailView from "../ProgramDetailView";
import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const programId = Number.parseInt(id, 10);
  if (!Number.isInteger(programId)) return { robots: { index: false, follow: false } };

  const program = await getCachedProgramById(programId).catch(() => null);
  if (!program) return { robots: { index: false, follow: false } };

  const description = program.text.replace(/\s+/g, " ").trim().slice(0, 160);
  return pageMetadata({
    title: program.title,
    description,
    path: `/programs/${program.id}`,
  });
}

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

  const program = await getCachedProgramById(programId);

  if (!program) {
    notFound();
  }

  return <ProgramDetailView program={program} />;
}

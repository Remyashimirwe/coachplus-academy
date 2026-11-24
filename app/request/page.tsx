import { getCachedPrograms } from "@/app/lib/db";
import RequestForm from "./RequestForm";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const programs = await getCachedPrograms({ onlyForTeacherForm: true });
  
  // Transform data to ensure it matches the expected interface
  const formattedPrograms = programs.map(p => ({
    id: p.id,
    title: p.title,
    level: p.level,
    subjects: p.subjects.map(s => ({
      id: s.id,
      name: s.name,
      image: s.image,
      topics: s.topics.map(t => ({ id: t.id, name: t.name }))
    }))
  }));

  return <RequestForm programs={formattedPrograms} />;
}

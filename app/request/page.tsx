import { getCachedPrograms } from "@/app/lib/db";
import RequestForm from "./RequestForm";
import { pageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Request a Teacher",
  description:
    "Tell CoachPlus Academy your learning goals and get matched with a trusted teacher for home or online coaching in Rwanda.",
  path: "/request",
});

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

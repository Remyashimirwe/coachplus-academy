import { getCachedPrograms } from "@/app/lib/db";
import ProgramsView from "./ProgramsView";
import { pageMetadata } from "@/app/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Tutoring Programs and Subjects",
  description:
    "Explore CoachPlus Academy tutoring programs in Rwanda, from national curriculum and Cambridge support to languages, exam preparation, and practical skills.",
  path: "/programs",
});

export default async function ProgramsPage() {
  const programs = await getCachedPrograms();
  return <ProgramsView programs={programs} />;
}

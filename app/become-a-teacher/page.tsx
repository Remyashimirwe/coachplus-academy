import { getSetting, getCachedPrograms } from "@/app/lib/db";
import { getTeacherTerms } from "@/app/lib/teacherTermsServer";
import BecomeTeacherForm from "./BecomeTeacherForm";
import Footer from "../components/Footer";
import BecomeTeacherIntro from "./BecomeTeacherIntro";

export const dynamic = "force-dynamic";

export default async function BecomeTeacherPage() {
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";
  const terms = await getTeacherTerms();
  const rawPrograms = await getCachedPrograms({ onlyForTeacherForm: true });
  const programs = rawPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    titleFr: p.titleFr,
    subjects: p.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      nameFr: s.nameFr,
      topics: s.topics.map((t) => ({ id: t.id, name: t.name, nameFr: t.nameFr })),
    })),
  }));

  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <BecomeTeacherIntro />

      <BecomeTeacherForm isOpen={isOpen} programs={programs} terms={terms} />
      <Footer />
    </main>
  );
}

import { getSetting, getPrograms } from "@/app/lib/db";
import BecomeTeacherForm from "./BecomeTeacherForm";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function BecomeTeacherPage() {
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";
  const rawPrograms = await getPrograms();
  const programs = rawPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    subjects: p.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
    })),
  }));

  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <div className="relative overflow-hidden bg-[#0f172a] pt-40 pb-24 text-white">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20" />
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex justify-center mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-[#E91E63] backdrop-blur-md border border-white/10 shadow-2xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E91E63] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E91E63]"></span>
                </span>
                Hiring Now
              </span>
            </div>
            <h1 className="text-2xl font-medium leading-[1.1] sm:text-3xl tracking-tight">
              Inspire the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5733] to-[#E91E63]">Next Generation</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 font-medium">
              Join CoachPlus Academy&apos;s elite educator network. We connect exceptional teachers with students who are passionate about learning.
            </p>
          </div>
        </div>
        
        {/* Bottom non-straight transition */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block h-[40px] w-full fill-white"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.43,243.93,70.9,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      <BecomeTeacherForm isOpen={isOpen} programs={programs} />
      <Footer />
    </main>
  );
}

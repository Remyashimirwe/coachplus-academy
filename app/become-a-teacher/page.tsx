import { getSetting } from "@/app/lib/db";
import BecomeTeacherForm from "./BecomeTeacherForm";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function BecomeTeacherPage() {
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";

  return (
    <main className="min-h-screen bg-slate-50 text-[#121826]">
      <div className="relative overflow-hidden bg-[#0f172a] pt-40 pb-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20" />
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md border border-white/20 mb-6 uppercase tracking-widest">
              Join Our Network
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Become a <span className="text-[#E91E63]">Wecoach Academy Teacher</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300">
              Share your expertise and inspire the next generation. We match elite educators with students who value quality learning.
            </p>
          </div>
        </div>
      </div>

      <BecomeTeacherForm isOpen={isOpen} />
      <Footer />
    </main>
  );
}

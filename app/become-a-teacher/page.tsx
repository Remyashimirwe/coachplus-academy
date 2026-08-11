import { getSetting } from "@/app/lib/db";
import BecomeTeacherForm from "./BecomeTeacherForm";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function BecomeTeacherPage() {
  const isOpen = await getSetting("teacher_applications_open", "true") === "true";

  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <div className="relative overflow-hidden bg-[#0f172a] pt-48 pb-32 text-white">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#FF5733]/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#E91E63]/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.05]" />
        
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
            <h1 className="text-5xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl tracking-tight">
              Inspire the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5733] to-[#E91E63]">Next Generation</span>
            </h1>
            <p className="mt-10 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300 font-medium sm:text-lg">
              Join Wecoach Academy's elite educator network. We connect exceptional teachers with students who are passionate about learning.
            </p>
          </div>
        </div>
        
        {/* Bottom straight line transition */}
        <div className="absolute -bottom-px left-0 w-full h-12 bg-white" />
      </div>

      <BecomeTeacherForm isOpen={isOpen} />
      <Footer />
    </main>
  );
}

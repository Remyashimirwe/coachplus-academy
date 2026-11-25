import ApplicationStatusLookup from "./ApplicationStatusLookup";
import Footer from "../components/Footer";
import { pageMetadata } from "@/app/lib/seo";

export const metadata = pageMetadata({
  title: "Application Status",
  description:
    "Track your CoachPlus Academy teacher application from receipt through shortlisting, assessment and your first student match.",
  path: "/application-status",
});

export default function ApplicationStatusPage() {
  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <section className="relative overflow-hidden bg-[#0f172a] pt-36 pb-32 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20" />
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-[#E91E63]" />
            Teacher pipeline
          </span>
          <h1 className="text-2xl font-medium leading-tight sm:text-3xl lg:text-4xl">
            Track your <span className="text-[#E91E63]">application</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Follow every stage from receipt to your first student match. Each step
            is confirmed by email, so you always know what happens next.
          </p>
        </div>
      </section>

      <section className="relative mx-auto -mt-16 max-w-3xl px-5 pb-24 sm:px-6 lg:px-8">
        <ApplicationStatusLookup />
      </section>

      <Footer />
    </main>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiChevronLeft,
} from "react-icons/fi";

type Topic = {
  id: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
  image: string | null;
  topics: Topic[];
};

type Program = {
  id: number;
  title: string;
  level: string;
  text: string;
  subjects: Subject[];
  image: string | null;
};

export default function ProgramDetailView({ program }: { program: Program }) {
  return (
    <main className="min-h-screen bg-white text-[#21121f]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-24 pb-14 text-white">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/45 blur-3xl" />
        
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link 
              href="/programs"
              className="inline-flex items-center gap-2 mb-5 text-white/80 hover:text-white transition-colors font-medium"
            >
              <FiChevronLeft className="size-5" />
              Back to Programs
            </Link>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
                <FiBookOpen className="size-3.5" />
                {program.level}
              </p>
              <h1 className="mt-3 text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">
                {program.title}{" "}
                <span className="text-white/80">({program.level})</span>
              </h1>
              <p className="mt-2.5 max-w-2xl text-xs text-white/90 leading-relaxed sm:text-sm">
                {program.text}
              </p>
              
              <div className="mt-5">
                <Link
                  href={`/request?programId=${program.id}`}
                  className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#E91E63] shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
                >
                  Request a Teacher
                  <FiArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-video overflow-hidden rounded-[28px] border-4 border-white/10 shadow-2xl">
                <img 
                  src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80"} 
                  alt={program.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom non-straight transition */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block h-[60px] w-full fill-white"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.43,243.93,70.9,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Courses Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#E91E63] mb-3">
              Available programs
            </h2>
            <h2 className="text-lg font-extrabold tracking-tight text-[#21121f] sm:text-xl">
              Available <span className="text-[#E91E63]">Programs</span>
            </h2>
            <p className="mt-2.5 text-xs font-medium text-slate-600 sm:text-sm">
              Choose a specialized path within {program.title} to find the perfect tutor.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {program.subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group flex flex-col rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:ring-[#E91E63]/20"
              >
                <div className="relative h-48 -mx-8 -mt-8 mb-6 overflow-hidden rounded-t-[32px]">
                  <img 
                    src={subject.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"} 
                    alt={subject.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6 flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white">
                    <FiCheck className="size-5" />
                  </div>
                </div>
              <h3 className="text-xs font-bold text-slate-900 mb-4">{subject.name}</h3>
                
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Included Subjects:</p>
                  <ul className="space-y-2 mb-8">
                    {subject.topics.map((topic) => (
                      <li key={topic.id} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <div className="size-1.5 rounded-full bg-[#E91E63]/40" />
                        {topic.name}
                      </li>
                    ))}
                    {subject.topics.length === 0 && (
                      <li className="text-slate-400 italic text-sm">General study topics</li>
                    )}
                  </ul>
                </div>

                <Link
                  href={`/request?programId=${program.id}&subjectId=${subject.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] py-2.5 text-xs font-bold text-white transition-all hover:bg-[#7B1FA2] active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  Request a Teacher
                  <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>

          {program.subjects.length === 0 && (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
              <p className="text-slate-500 font-medium">No courses have been added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[48px] bg-[#0f172a] p-12 lg:p-20">
            <div className="absolute -right-24 top-0 size-72 rounded-full bg-[#E91E63]/25 blur-3xl" />
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-lg font-extrabold text-white sm:text-xl">
                Ready to Find the Right Teacher for You?
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Connect with qualified and trusted teachers who match your learning needs, goals, location, and preferred learning style. Whether you’re learning a new subject, developing a skill, preparing for an exam, or pursuing professional growth, CoachPlus Academy helps you find the right teacher for your journey.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/request"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-5 text-xs font-bold text-white shadow-xl shadow-rose-500/25 transition-all hover:-translate-y-1 hover:bg-[#7B1FA2]"
                >
                  Get Started Now
                  <FiArrowRight className="size-4" />
                </Link>
                <Link
                  href="/become-a-teacher"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/20 px-5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Join as a Teacher
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

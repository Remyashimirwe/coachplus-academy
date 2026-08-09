"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiClipboard,
  FiGrid,
  FiCheckCircle,
} from "react-icons/fi";

type Program = {
  id: number;
  title: string;
  level: string;
  text: string;
  points: string[];
  image: string | null;
};

export default function ProgramsPage({
  programs,
}: {
  programs: Program[];
}) {
  return (
    <main className="min-h-screen bg-white text-[#21121f]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-32 pb-20 text-white">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/45 blur-3xl" />
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20">
              <FiBookOpen className="size-4" />
              Explore WeCoach Programs
            </p>
            <h1 className="mt-6 text-5xl font-medium leading-[1.05] sm:text-6xl">
              Choose the right learning path for your child
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
              Explore tutoring programs designed for academic support, exam
              readiness, STEM growth, language confidence, and flexible home
              learning.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-50 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {programs.map((program, index) => (
            <motion.article
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
              className="group flex flex-col overflow-hidden rounded-[32px] bg-white shadow-xl shadow-slate-200 ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300"
            >
              <div className="aspect-[16/9] w-full overflow-hidden relative">
                <img 
                  src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"} 
                  alt={program.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E91E63] shadow-lg backdrop-blur-sm">
                  {program.level}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-8">
                <h2 className="text-2xl font-bold text-[#0f172a] transition-colors group-hover:text-[#E91E63]">
                  {program.title}
                </h2>
                <p className="mt-4 flex-1 text-base leading-relaxed text-slate-600">
                  {program.text}
                </p>
                
                <div className="mt-8 space-y-3">
                  {program.points.map((point) => (
                    <div
                      key={point}
                      className="flex items-center gap-3 text-sm font-medium text-slate-700"
                    >
                      <FiCheckCircle className="size-4 shrink-0 text-green-500" />
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50">
                  <Link
                    href="/request"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] py-4 text-sm font-bold text-white transition-all hover:bg-[#E91E63] active:scale-95 shadow-lg shadow-slate-200"
                  >
                    Select Program
                    <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0f172a] py-20 text-white">
        <div className="absolute -right-24 top-0 size-72 rounded-full bg-[#E91E63]/25 blur-3xl" />
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-6 md:flex-row md:items-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/15">
              <FiClipboard className="size-4" />
              Not sure where to start?
            </p>
            <h2 className="mt-5 text-4xl font-medium">Need help choosing?</h2>
            <p className="mt-4 max-w-2xl leading-8 text-white/68">
              Tell WeCoach your child&apos;s goals and we&apos;ll recommend the
              best program and tutor match.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/request"
              className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-[#E91E63] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            >
              Request a Teacher
              <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

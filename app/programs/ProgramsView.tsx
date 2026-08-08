"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiClipboard,
  FiGrid,
  FiSend,
  FiCheckCircle,
} from "react-icons/fi";
import Navbar from "@/app/components/Navbar";

type Program = {
  id: number;
  title: string;
  level: string;
  text: string;
  points: string[];
};

export default function ProgramsPage({
  programs,
}: {
  programs: Program[];
}) {
  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1266f1] via-[#1a6ff3] to-[#4f8cff] pt-32 pb-16 text-white">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#0b52d0]/40 blur-3xl" />
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20">
              <FiBookOpen className="size-4" />
              WeCoach Programs
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

      <section className="bg-[#f6f8fb] py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {programs.map((program, index) => (
            <motion.article
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
              className="group flex flex-col rounded-[24px] bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(18,102,241,0.12)] hover:ring-[#1266f1]/20"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf2ff] text-[#1266f1] shadow-sm transition-transform duration-300 group-hover:scale-110">
                <FiGrid className="size-5" />
              </span>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-[#1266f1]">
                {program.level}
              </p>
              <h2 className="mt-2 text-2xl font-medium transition-colors group-hover:text-[#1266f1]">
                {program.title}
              </h2>
              <p className="mt-3 flex-1 leading-7 text-slate-500">
                {program.text}
              </p>
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6">
                {program.points.map((point) => (
                  <p
                    key={point}
                    className="flex items-center gap-2.5 text-sm font-normal text-slate-700"
                  >
                    <FiCheckCircle className="size-4 shrink-0 text-[#1266f1]" />
                    {point}
                  </p>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0f172a] py-20 text-white">
        <div className="absolute -right-24 top-0 size-72 rounded-full bg-[#1266f1]/20 blur-3xl" />
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
              className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-[#1266f1] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
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

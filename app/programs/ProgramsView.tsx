"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiClipboard,
} from "react-icons/fi";
import { useState } from "react";
import ProgramModal from "../components/ProgramModal";

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

export default function ProgramsPage({
  programs,
}: {
  programs: Program[];
}) {
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-[#21121f]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-24 pb-12 text-white">
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
              Our Categories
            </p>
            <h1 className="mt-6 text-sm font-medium leading-[1.05] sm:text-sm">
              Learning paths for every goal
            </h1>
          </motion.div>
        </div>

        {/* Bottom zigzag transition */}
        <div className="absolute -bottom-px left-0 w-full overflow-hidden leading-[0] transform rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[40px] md:h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>
      </section>

      <section className="bg-white py-12 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[40px] bg-white py-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
              <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <FiBookOpen className="size-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No Programs Available</h3>
              <p className="mt-2 text-slate-600 max-w-md px-6">
                We're currently expanding our offerings. Please check back later or contact us for custom tutoring needs.
              </p>
              <Link
                href="/request"
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#E91E63] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#7B1FA2] active:scale-95 shadow-lg shadow-rose-500/20"
              >
                Request a Custom Category
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program, index) => (
                <motion.article
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                  className="group flex h-full flex-col overflow-hidden rounded-4xl bg-white shadow-xl shadow-slate-200 ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300"
                >
                  <div className="aspect-video w-full overflow-hidden relative shrink-0">
                    <img 
                      src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"} 
                      alt={program.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                    <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E91E63] shadow-lg backdrop-blur-sm">
                      {program.level}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-base font-medium text-[#0f172a] transition-colors group-hover:text-[#E91E63]">
                      {program.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                      {program.text}
                    </p>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setSelectedProgram(program);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0f172a] py-3 text-sm font-bold text-[#0f172a] transition-all hover:bg-[#0f172a] hover:text-white active:scale-95 shadow-sm"
                      >
                        Show Details
                      </button>
                      <Link
                        href={`/request?programId=${program.id}`}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#E91E63] py-3 text-sm font-bold text-white transition-all hover:bg-[#7B1FA2] active:scale-95 shadow-lg shadow-rose-500/20"
                      >
                        Request a Teacher
                        <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
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
            <h2 className="mt-5 text-sm font-medium">Need help choosing?</h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-8 text-white/68">
              Tell Wecoach Academy your goals and we&apos;ll recommend the
              best category and tutor match.
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
      <ProgramModal 
        program={selectedProgram} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}

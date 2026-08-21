"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { useState } from "react";
import ProgramModal from "./ProgramModal";

const MAX_LENGTH = 200;

type Subject = {
  id: number;
  name: string;
};

type Program = {
  id: number;
  title: string;
  level: string;
  text: string;
  subjects: Subject[];
  image: string | null;
};

export default function ProgramsSection({ programs }: { programs: Program[] }) {
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openDetails = (program: Program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const displayPrograms = programs.slice(0, 6);

  if (programs.length === 0) {
    return (
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center rounded-[40px] bg-slate-50 py-20 text-center border-2 border-dashed border-slate-200">
            <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <FiArrowRight className="size-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No Programs Available</h3>
            <p className="mt-2 text-slate-600 max-w-md">
              We're currently updating our curriculum. Please check back soon for our new learning paths.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="programs" className="py-12 md:py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex flex-col items-center text-center px-4">
          <div className="relative inline-flex items-center justify-center px-10 py-4">
            <div className="absolute inset-0 bg-[#E91E63]/10 rounded-full blur-md" />
            <div className="absolute inset-0 bg-white shadow-sm rounded-full border border-[#E91E63]/10" />
            <h2 className="relative text-lg font-bold uppercase tracking-widest text-[#E91E63]">
              Our Categories
            </h2>
          </div>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayPrograms.map((program, index) => {
            const isLong = program.text.length > MAX_LENGTH;
            const description = isLong
              ? `${program.text.slice(0, MAX_LENGTH).trimEnd()}…`
              : program.text;

            return (
              <motion.article
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex h-full flex-col overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200 ring-1 ring-slate-100 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-white/50"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative shrink-0">
                  <img 
                    src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop"} 
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E91E63] shadow-lg backdrop-blur-sm">
                    {program.level}
                  </div>
                </div>
                
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-base font-medium text-[#21121f] transition-colors group-hover:text-[#E91E63]">
                    {program.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                    {description}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => openDetails(program)}
                      className="mt-2 self-start text-sm font-bold text-[#E91E63] transition-colors hover:text-[#7B1FA2]"
                    >
                      Show more
                    </button>
                  )}
                  
                  <div className="mt-6 flex flex-col gap-3">
                    <button 
                      onClick={() => openDetails(program)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border-2 border-[#E91E63] text-sm font-bold text-[#E91E63] transition-all hover:bg-[#E91E63] hover:text-white active:scale-95"
                    >
                      Show Details
                    </button>
                    <Link 
                      href={`/request?programId=${program.id}`} 
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#21121f] text-sm font-bold text-white transition-all hover:bg-[#E91E63] active:scale-95 shadow-md"
                    >
                      Request a Teacher
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
          {programs.length > 6 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: displayPrograms.length * 0.1 }}
              className="flex items-center justify-center"
            >
              <Link
                href="/programs"
                className="group flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 p-8 transition-all duration-500 hover:scale-[1.02] hover:bg-slate-100 hover:border-[#E91E63]/30"
              >
                <div className="size-20 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <FiArrowRight className="size-10 text-[#E91E63] transition-transform group-hover:translate-x-1" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-[#21121f]">
                    Explore All Categories
                  </h3>
                  <p className="mt-2 text-slate-600">
                    Discover our full range of learning programs
                  </p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
      <ProgramModal 
        program={selectedProgram} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { useState } from "react";
import ProgramModal from "./ProgramModal";

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

  const displayPrograms = programs.slice(0, 3);

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
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#E91E63] mb-4">
              Our Categories
            </h2>
            <h2 className="text-4xl font-bold tracking-tight text-[#21121f] sm:text-5xl">
              Learning paths for <span className="text-[#E91E63]">every goal</span>
            </h2>
          </div>
          <Link
            href="/programs"
            className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-8 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#7B1FA2] hover:shadow-xl active:scale-95"
          >
            Explore All Categories
            <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayPrograms.map((program, index) => {
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
                
                <div className="flex flex-1 flex-col p-8">
                  <h3 className="text-2xl font-bold text-[#21121f] transition-colors group-hover:text-[#E91E63]">
                    {program.title}
                  </h3>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700">
                    {program.text}
                  </p>
                  
                  <div className="mt-8 flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setSelectedProgram(program);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#E91E63] text-sm font-bold text-[#E91E63] transition-all hover:bg-[#E91E63] hover:text-white active:scale-95"
                    >
                      Show Details
                    </button>
                    <Link 
                      href={`/request?programId=${program.id}`} 
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#21121f] text-sm font-bold text-white transition-all hover:bg-[#E91E63] active:scale-95 shadow-md"
                    >
                      Request a Teacher
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
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

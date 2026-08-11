"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiArrowRight, FiCheck } from "react-icons/fi";
import Link from "next/link";
import { useEffect } from "react";

type Topic = {
  id: number;
  name: string;
  image: string | null;
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

interface ProgramModalProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProgramModal({ program, isOpen, onClose }: ProgramModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!program) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-full overflow-hidden rounded-[40px] bg-white shadow-2xl border border-white/20"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 size-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-[#E91E63] hover:text-white transition-all active:scale-95"
            >
              <FiX className="size-6" />
            </button>

            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Left Sidebar - Program Info (Hidden on small screens) */}
              <div className="hidden md:flex w-1/4 bg-slate-50 p-8 flex-col shrink-0">
                <div className="relative aspect-square w-full rounded-3xl overflow-hidden mb-6 shadow-lg ring-4 ring-white">
                  <img 
                    src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80"} 
                    alt={program.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E91E63] shadow-lg">
                    {program.level}
                  </div>
                </div>
                <h2 className="text-lg font-medium text-[#0f172a] mb-4">{program.title}</h2>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {program.text}
                </p>
              </div>

              {/* Right Content - Sub-categories List */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white">
                <div className="md:hidden mb-8">
                   <span className="text-xs font-bold text-[#E91E63] uppercase tracking-widest">{program.level}</span>
                   <h2 className="text-xl font-medium text-[#0f172a] mt-1">{program.title}</h2>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Available Programs</h3>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {program.subjects.map((subject) => (
                    <motion.div
                      key={subject.id}
                      className="group flex flex-col rounded-3xl bg-slate-50 border border-slate-100 p-6 transition-all hover:bg-white hover:border-[#E91E63]/30 hover:shadow-xl hover:shadow-slate-200"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                          <img 
                            src={subject.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80"} 
                            alt={subject.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-slate-800 text-base">{subject.name}</h4>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-6">
                          {subject.topics.map((topic) => (
                            <div 
                              key={topic.id} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 group/topic hover:border-[#E91E63]/30 transition-all shadow-sm"
                            >
                              <div className="size-2 rounded-full bg-[#E91E63]/30 group-hover/topic:bg-[#E91E63] transition-colors" />
                              <span className="text-[10px] font-bold text-slate-600">
                                {topic.name}
                              </span>
                            </div>
                          ))}
                          {subject.topics.length === 0 && (
                            <div className="col-span-2">
                              <span className="text-[10px] text-slate-400 italic">Core curriculum covered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/request?programId=${program.id}&subjectId=${subject.id}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-2.5 text-[10px] font-bold text-[#E91E63] transition-all hover:bg-[#E91E63] hover:text-white hover:border-[#E91E63] active:scale-95"
                      >
                        Request Teacher
                        <FiArrowRight className="size-3" />
                      </Link>
                    </motion.div>
                  ))}
                  
                  {program.subjects.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium italic">No programs added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

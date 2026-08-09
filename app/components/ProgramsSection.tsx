"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiBookOpen, FiEdit, FiCpu } from "react-icons/fi";

const programs = [
  {
    title: "Primary School Support",
    text: "Core literacy, numeracy, homework help, and confidence building for younger learners.",
    color: "from-pink-50 to-rose-50",
    icon: FiBookOpen,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
  },
  {
    title: "Exam Preparation",
    text: "Focused coaching for national exams, term tests, revision plans, and study discipline.",
    color: "from-blue-50 to-indigo-50",
    icon: FiEdit,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop",
  },
  {
    title: "STEM and Coding",
    text: "Math, science, computer basics, robotics foundations, and beginner-friendly coding.",
    color: "from-purple-50 to-fuchsia-50",
    icon: FiCpu,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
  },
];

export default function ProgramsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#E91E63] mb-4">
              Our Programs
            </h2>
            <h2 className="text-4xl font-bold tracking-tight text-[#21121f] sm:text-5xl">
              Learning paths for <span className="text-[#E91E63]">every goal</span>
            </h2>
            <p className="mt-6 text-lg font-normal leading-8 text-slate-600">
              Choose a focused program, then get matched with a teacher who
              can personalize it for your child.
            </p>
          </div>
          <Link
            href="/programs"
            className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-8 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#7B1FA2] hover:shadow-xl active:scale-95"
          >
            Explore All Programs
            <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <motion.article
                key={program.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group overflow-hidden rounded-[32px] bg-gradient-to-br ${program.color} border border-slate-100 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-white/50`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img 
                    src={program.image} 
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 flex size-12 items-center justify-center rounded-2xl bg-white/90 text-[#E91E63] shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="size-6" />
                  </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-[#21121f] transition-colors group-hover:text-[#E91E63]">
                    {program.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-slate-700">
                    {program.text}
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <Link href="/request" className="text-sm font-bold text-[#E91E63] inline-flex items-center gap-1 group-hover:gap-2 transition-all link-modern">
                      Request Program <FiArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

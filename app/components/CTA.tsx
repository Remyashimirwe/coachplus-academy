"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

export default function CTA() {
  return (
    <section id="teachers" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[#0f172a]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#E91E63]/20 via-transparent to-[#7B1FA2]/20" />
      
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[40px] bg-white/5 p-8 md:p-16 backdrop-blur-sm border border-white/10 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#E91E63]/20 blur-3xl" />
          
          <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_auto] items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-white sm:text-5xl leading-tight">
                Ready to help your <br /><span className="text-[#E91E63]">child grow?</span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg font-normal leading-relaxed text-slate-400">
                Start with a teacher match built around your specific goals, schedule, and preferred learning style. Our experts are ready to assist.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                href="/request"
                className="group inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-white px-10 text-lg font-bold text-[#0f172a] shadow-2xl transition-all hover:-translate-y-1 hover:bg-[#E91E63] hover:text-white active:scale-95"
              >
                Request a Teacher Now
                <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

export default function PageHero({
  badge = "Join CoachPlus Academy",
  title,
  subtitle,
}: {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#0f172a] pt-40 pb-24 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/20 via-[#E91E63]/20 to-[#7B1FA2]/20" />
      <div className="absolute -left-32 top-24 size-96 rounded-full bg-[#E91E63]/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md border border-white/20 mb-6 uppercase tracking-widest">
            {badge}
          </span>
          <h1 className="text-2xl font-medium leading-tight sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-8 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
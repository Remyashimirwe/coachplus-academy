"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import PlayStoreButton from "./PlayStoreButton";
import { t, useSiteLocale } from "../lib/site-i18n";

export default function CTA() {
  const locale = useSiteLocale();
  return (
    <section id="teachers" className="relative py-12 overflow-hidden">
      <div className="absolute inset-0 bg-[#0f172a]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#E91E63]/20 via-transparent to-[#7B1FA2]/20" />
      
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[40px] bg-white/5 p-6 md:p-10 backdrop-blur-sm border border-white/10 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#E91E63]/20 blur-3xl" />
          
          <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_auto] items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-white sm:text-3xl leading-tight">
                {t(locale, "Ready to start ")}<br /><span className="text-[#E91E63]">{t(locale, "learning?")}</span>
              </h2>
              <p className="mt-6 max-w-2xl text-sm font-normal leading-relaxed text-slate-400">
                {t(locale, "Get matched today with a certified teacher tailored precisely to your learning goals.")}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-start gap-4 sm:items-center"
            >
              <Link
                href="/request"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-base font-semibold text-[#0f172a] shadow-2xl transition-all hover:-translate-y-1 hover:bg-[#E91E63] hover:text-white active:scale-95"
              >
                {t(locale, "Request a Teacher")}
                <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <PlayStoreButton variant="outline" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { FiMessageSquare, FiUsers, FiAward } from "react-icons/fi";
import { t, useSiteLocale } from "../lib/site-i18n";

const steps = [
  {
    icon: FiMessageSquare,
    title: "Tell us what you need",
    text: "Choose the learning category, course of interest, schedule, goals, and whether lessons should happen online or at home.",
  },
  {
    icon: FiUsers,
    title: "Meet matched teachers",
    text: "We find the great educators by specialty, availability, reviews, and the teaching style that fits you.",
  },
  {
    icon: FiAward,
    title: "Start learning with confidence",
    text: "Book recurring sessions and keep every lesson centered around measurable growth.",
  },
];

export default function HowItWorks() {
  const locale = useSiteLocale();
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[#fffaf8] py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="mb-8 flex size-20 items-center justify-center rounded-3xl bg-[#fff0f3] text-[#E91E63] shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="size-10" />
                </div>
                <h3 className="text-lg font-semibold text-[#21121f]">{t(locale, step.title)}</h3>
                <p className="mt-4 text-base font-normal leading-relaxed text-slate-600">
                  {t(locale, step.text)}
                </p>
                {index < steps.length - 1 && (
                  <div className="absolute top-10 left-full hidden h-px w-full bg-gradient-to-r from-[#E91E63]/20 to-transparent md:block -ml-4 -z-10" />
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

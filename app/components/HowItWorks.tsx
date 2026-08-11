"use client";

import { motion } from "framer-motion";
import { FiMessageSquare, FiUsers, FiAward } from "react-icons/fi";

const steps = [
  {
    icon: FiMessageSquare,
    title: "Tell us what you need",
    text: "Choose the learning category, course of interest, schedule, goals, and whether lessons should happen online or at home.",
  },
  {
    icon: FiUsers,
    title: "Meet matched teachers",
    text: "We find the great educators by specialty, availability, reviews, and the teaching style that fits your child.",
  },
  {
    icon: FiAward,
    title: "Start learning with confidence",
    text: "Book recurring sessions and keep every lesson centered around measurable growth.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#fffaf8] py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[#21121f] sm:text-4xl">
            How It <span className="text-[#E91E63]">Works</span>
          </h2>
          <p className="mt-6 text-base font-normal leading-8 text-slate-600">
            Three simple steps to find the perfect tutor and start growing.
          </p>
        </motion.div>
        
        <div className="mt-20 grid gap-12 md:grid-cols-3">
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
                <h3 className="text-2xl font-bold text-[#21121f]">{step.title}</h3>
                <p className="mt-4 text-base font-normal leading-relaxed text-slate-600">
                  {step.text}
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

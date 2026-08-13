"use client";

import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiShield,
} from "react-icons/fi";

const features = [
  {
    icon: FiCheckCircle,
    title: "Verified Teachers",
    text: "Every teacher profile is thoroughly vetted for qualifications, experience, and trust.",
  },
  {
    icon: FiClock,
    title: "Flexible Scheduling",
    text: "Choose online or home coaching on weekdays or weekends that fit your daily schedule.",
  },
  {
    icon: FiUser,
    title: "Personalized Plans",
    text: "Lessons are tailored specifically to your learning goals, current pace, and target confidence.",
  },
  {
    icon: FiShield,
    title: "Safe & Trusted Learning",
    text: "A transparent, fully managed experience delivering top-quality coaching without stress or guesswork.",
  },
];

export default function Features() {
  return (
    <section id="why-choose-us" className="bg-[#f8fafc] py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#21121f] sm:text-4xl">
            Why Choose <span className="text-[#E91E63]">Coach Plus</span>
          </h2>
          <p className="mt-6 text-base font-normal leading-8 text-slate-600">
            Premium features built around safety, comfort, and better learning outcomes for your children.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ring-1 ring-slate-100"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#E91E63] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="size-7" />
                </div>
                <h3 className="mt-8 text-xl font-bold text-[#21121f]">{feature.title}</h3>
                <p className="mt-4 text-sm font-normal leading-relaxed text-slate-500">
                  {feature.text}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

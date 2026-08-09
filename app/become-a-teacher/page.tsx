"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAward,
  FiBriefcase,
  FiStar,
} from "react-icons/fi";
import { saveTeacherApplication } from "@/app/actions/teacher";
import Footer from "../components/Footer";

const subjects = [
  "Mathematics",
  "English",
  "Science",
  "Coding",
  "Exam Prep",
  "Languages",
  "Art & Music",
  "Special Needs",
];

const benefits = [
  {
    icon: FiBriefcase,
    title: "Flexible Schedule",
    text: "Teach when you want, from anywhere in the world.",
  },
  {
    icon: FiAward,
    title: "Competitive Pay",
    text: "Set your own rates and earn what your expertise deserves.",
  },
  {
    icon: FiStar,
    title: "Professional Growth",
    text: "Access resources and a community of elite educators.",
  },
];

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <span className="text-[#E91E63]">{icon}</span>
        {label}
      </label>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

const inputClasses =
  "w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-base outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-4 focus:ring-[#E91E63]/10";

export default function BecomeTeacherPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-[#121826]">
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
              Join Our Network
            </span>
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Become a <span className="text-[#E91E63]">WeCoach Teacher</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300">
              Share your expertise and inspire the next generation. We match elite educators with students who value quality learning.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Left Side: Value Proposition */}
            <div>
              <h2 className="text-4xl font-bold text-[#0f172a]">Why teach with us?</h2>
              <p className="mt-6 text-lg text-slate-600">
                We're more than just a platform; we're a community dedicated to educational excellence.
              </p>
              
              <div className="mt-12 space-y-10">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex gap-6">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f3] text-[#E91E63]">
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#0f172a]">{benefit.title}</h3>
                        <p className="mt-2 text-slate-600 leading-relaxed">{benefit.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 rounded-[32px] bg-[#0f172a] p-10 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 size-40 bg-[#E91E63]/20 blur-3xl -mr-20 -mt-20" />
                <h3 className="text-2xl font-bold relative z-10">Elite Network</h3>
                <p className="mt-4 text-slate-300 relative z-10">
                  95% of our teachers report higher satisfaction compared to traditional tutoring agencies.
                </p>
              </div>
            </div>

            {/* Right Side: Application Form */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-[#E91E63]/10 to-transparent blur-2xl" />
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100"
                  >
                    <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500 mb-8">
                      <FiCheckCircle className="size-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#0f172a]">Application Received!</h2>
                    <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-500">
                      Thank you for applying to join WeCoach. Our academic team will review your profile and get back to you within 3-5 business days.
                    </p>
                    <Link
                      href="/"
                      className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#0f172a] px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                    >
                      Return Home
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-[40px] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100"
                  >
                    <h2 className="mb-10 text-3xl font-bold text-[#0f172a]">Apply to Teach</h2>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        selectedSubjects.forEach(s => formData.append('subjects', s));
                        await saveTeacherApplication(formData);
                        setSubmitted(true);
                      }}
                      className="space-y-8"
                    >
                      <Field icon={<FiUser />} label="Full Name" htmlFor="name">
                        <input id="name" name="name" required placeholder="e.g. Jane Smith" className={inputClasses} />
                      </Field>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Field icon={<FiMail />} label="Email Address" htmlFor="email">
                          <input id="email" name="email" type="email" required placeholder="jane@example.com" className={inputClasses} />
                        </Field>

                        <Field icon={<FiPhone />} label="Phone Number" htmlFor="phone">
                          <input id="phone" name="phone" type="tel" required placeholder="+1 234 567 890" className={inputClasses} />
                        </Field>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <FiBookOpen className="text-[#E91E63]" />
                          Subjects You Can Teach
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {subjects.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSubject(s)}
                              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all border-2 ${
                                selectedSubjects.includes(s)
                                  ? "bg-[#E91E63] border-[#E91E63] text-white shadow-md shadow-rose-200"
                                  : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Field icon={<FiBriefcase />} label="Years of Experience" htmlFor="experience">
                        <select id="experience" name="experience" required className={`${inputClasses} appearance-none cursor-pointer`}>
                          <option value="" disabled selected>Select experience</option>
                          <option value="1-3">1-3 Years</option>
                          <option value="4-7">4-7 Years</option>
                          <option value="8+">8+ Years</option>
                        </select>
                      </Field>

                      <Field icon={<FiMessageSquare />} label="Brief Bio / Motivation" htmlFor="bio">
                        <textarea
                          id="bio"
                          name="bio"
                          rows={3}
                          placeholder="Tell us about your teaching style..."
                          className={`${inputClasses} resize-none`}
                        />
                      </Field>

                      <button
                        type="submit"
                        className="group relative w-full overflow-hidden rounded-2xl bg-[#0f172a] p-5 text-lg font-bold text-white shadow-xl transition-all hover:bg-[#E91E63] active:scale-[0.99]"
                      >
                        <span className="relative flex items-center justify-center gap-3">
                          Submit Application
                          <FiSend className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

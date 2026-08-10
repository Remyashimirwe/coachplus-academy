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
  FiXCircle,
  FiAlertCircle,
  FiArrowRight,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import { saveTeacherApplication } from "@/app/actions/teacher";

const subjectsList = [
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

export default function BecomeTeacherForm({ isOpen }: { isOpen: boolean }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left Side: Value Proposition */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h2 className="text-4xl font-bold text-[#0f172a]">Why teach with us?</h2>
            <p className="mt-6 text-lg text-slate-600">
              We're more than just a platform; we're a community dedicated to educational excellence.
            </p>
            
            <div className="mt-12 space-y-10">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div 
                    key={benefit.title} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl shadow-slate-200 border border-slate-100 text-[#E91E63] group-hover:bg-[#E91E63] group-hover:text-white transition-all duration-300">
                      <Icon className="size-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0f172a]">{benefit.title}</h3>
                      <p className="mt-2 text-slate-600 leading-relaxed">{benefit.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-16 rounded-[40px] bg-[#0f172a] p-10 text-white overflow-hidden relative shadow-2xl"
            >
              <div className="absolute top-0 right-0 size-64 bg-[#E91E63]/20 blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(i => <FiStar key={i} className="fill-amber-400 text-amber-400" />)}
                </div>
                <h3 className="text-2xl font-bold">Elite Educator Network</h3>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  Join a community where 95% of our teachers report higher satisfaction and better work-life balance compared to traditional tutoring agencies.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Application Form or Status */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-[#E91E63]/10 to-transparent blur-2xl" />
            
            <AnimatePresence mode="wait">
              {!isOpen ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="size-24 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-8">
                    <FiAlertCircle className="size-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0f172a]">Applications are Closed</h2>
                  <p className="mt-6 text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We are currently not accepting new teacher applications. Please check back later or follow us for updates on future recruitment cycles.
                  </p>
                  <Link
                    href="/"
                    className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#0f172a] px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                  >
                    Return Home
                  </Link>
                </motion.div>
              ) : status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="size-24 rounded-3xl bg-green-50 text-green-500 flex items-center justify-center mb-8">
                    <FiCheckCircle className="size-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0f172a]">Application Received!</h2>
                  <p className="mt-6 text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Thank you for applying to join Wecoach Academy. Our academic team will review your profile and get back to you within 3-5 business days.
                  </p>
                  <Link
                    href="/"
                    className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#0f172a] px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63]"
                  >
                    Return Home
                  </Link>
                </motion.div>
              ) : status === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="size-24 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-8">
                    <FiXCircle className="size-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#0f172a]">Submission Failed</h2>
                  <p className="mt-6 text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Something went wrong while sending your application. Please try again later.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-10 inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#E91E63] px-10 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#0f172a]"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-[40px] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100"
                >
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-[#0f172a]">Apply to Teach</h2>
                    <p className="text-slate-500 mt-2">Complete the form below to start your journey.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (selectedSubjects.length === 0) {
                        setSelectionError(true);
                        return;
                      }
                      setSelectionError(false);
                      setStatus("submitting");

                      const formData = new FormData(e.currentTarget);
                      selectedSubjects.forEach(s => formData.append('subjects', s));
                      
                      const result = await saveTeacherApplication(formData);
                      if (result && result.success) {
                        setStatus("success");
                      } else {
                        setStatus("error");
                      }
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
                        <input id="phone" name="phone" type="tel" required placeholder="+250 790 000 000" className={inputClasses} />
                      </Field>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className={`text-sm font-bold flex items-center gap-2 transition-colors ${selectionError ? 'text-red-500' : 'text-slate-700'}`}>
                          <FiBookOpen className={selectionError ? 'text-red-500' : 'text-[#E91E63]'} />
                          Subjects You Can Teach *
                        </label>
                        {selectionError && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Select at least one</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subjectsList.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubject(s)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all border-2 ${
                              selectedSubjects.includes(s)
                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field icon={<FiBriefcase />} label="Years of Experience" htmlFor="experience">
                      <div className="relative group">
                        <select 
                          id="experience" 
                          name="experience" 
                          required 
                          defaultValue=""
                          className={`${inputClasses} appearance-none cursor-pointer pr-12`}
                        >
                          <option value="" disabled>Select your experience</option>
                          <option value="1-3">1-3 Years</option>
                          <option value="4-7">4-7 Years</option>
                          <option value="8+">8+ Years</option>
                        </select>
                        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#E91E63] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </Field>

                    <div className="grid gap-6 md:grid-cols-2">
                      <Field icon={<FiFileText />} label="ID / Passport (Upload)" htmlFor="id-passport">
                        <input id="id-passport" name="idPassport" type="file" accept="image/*,.pdf" className={`${inputClasses} py-3`} />
                      </Field>

                      <Field icon={<FiImage />} label="Professional Photo (Upload)" htmlFor="photo">
                        <input id="photo" name="photo" type="file" accept="image/*" className={`${inputClasses} py-3`} />
                      </Field>
                    </div>

                    <Field icon={<FiMessageSquare />} label="Brief Bio / Motivation" htmlFor="bio">
                      <textarea
                        id="bio"
                        name="bio"
                        required
                        rows={3}
                        placeholder="Tell us about your teaching style and why you want to join Wecoach Academy..."
                        className={`${inputClasses} resize-none`}
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="group relative w-full overflow-hidden rounded-2xl bg-[#0f172a] p-5 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#E91E63] active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      <span className="relative flex items-center justify-center gap-3">
                        {status === "submitting" ? "Sending Application..." : "Submit Application"}
                        {status !== "submitting" && <FiArrowRight className="transition-transform group-hover:translate-x-1" />}
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
  );
}

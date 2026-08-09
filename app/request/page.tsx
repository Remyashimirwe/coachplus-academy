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
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import { saveRequest } from "@/app/actions/request";
import Footer from "../components/Footer";

const subjects = [
  "Mathematics",
  "English",
  "Science",
  "Coding",
  "Exam Prep",
  "Languages",
  "Art & Music",
];

const grades = [
  "Primary (P1-P6)",
  "Middle School (S1-S3)",
  "High School (S4-S6)",
  "Short Courses",
];

const learningModes = ["Online", "At Home", "Physical Center"];

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

export default function RequestPage() {
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
              Start Your Journey
            </span>
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Request a <span className="text-[#E91E63]">Teacher</span>
            </h1>
            <p className="mt-8 mx-auto max-w-2xl text-xl leading-relaxed text-slate-300">
              Tell us your learning goals and we'll find the perfect match from our network of verified elite educators.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="relative -mt-12 pb-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[40px] bg-white p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100"
              >
                <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-green-50 text-green-500 mb-8">
                  <FiCheckCircle className="size-12" />
                </div>
                <h2 className="text-4xl font-bold text-[#0f172a]">Request Sent Successfully!</h2>
                <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-slate-500">
                  Our team is already working on finding the best teacher for you. Expect an update within 24 hours.
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[40px] bg-white p-8 md:p-14 shadow-2xl shadow-slate-200 border border-slate-100"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    selectedSubjects.forEach(s => formData.append('subjects', s));
                    await saveRequest(formData);
                    setSubmitted(true);
                  }}
                  className="space-y-10"
                >
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field icon={<FiUser />} label="Parent Full Name" htmlFor="parent-name">
                      <input id="parent-name" name="parentName" required placeholder="e.g. we coach" className={inputClasses} />
                    </Field>

                    <Field icon={<FiMail />} label="Email Address" htmlFor="email">
                      <input id="email" name="email" type="email" required placeholder="wecoach@example.com" className={inputClasses} />
                    </Field>

                    <Field icon={<FiPhone />} label="Phone Number" htmlFor="phone">
                      <input id="phone" name="phone" type="tel" required placeholder="+250 790 000 000" className={inputClasses} />
                    </Field>

                    <Field icon={<FiAward />} label="Child's Grade Level" htmlFor="grade">
                      <select id="grade" name="grade" defaultValue="" required className={`${inputClasses} appearance-none cursor-pointer`}>
                        <option value="" disabled>Choose a grade</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FiBookOpen className="text-[#E91E63]" />
                      Subjects of Interest
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {subjects.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`rounded-2xl px-6 py-3 text-sm font-bold transition-all border-2 ${
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

                  <div className="grid gap-8 md:grid-cols-2">
                    <Field icon={<FiMapPin />} label="Learning Mode" htmlFor="mode">
                      <select id="mode" name="mode" defaultValue="" required className={`${inputClasses} appearance-none cursor-pointer`}>
                        <option value="" disabled>Preferred mode</option>
                        {learningModes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>

                    <Field icon={<FiCalendar />} label="Preferred Start Date" htmlFor="start-date">
                      <input id="start-date" name="startDate" type="date" required className={inputClasses} />
                    </Field>
                  </div>

                  <Field icon={<FiMessageSquare />} label="Anything else we should know?" htmlFor="details">
                    <textarea
                      id="details"
                      name="details"
                      rows={4}
                      placeholder="Share specific goals, challenges, or schedule preferences..."
                      className={`${inputClasses} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-2xl bg-[#E91E63] p-6 text-xl font-bold text-white shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative flex items-center justify-center gap-3">
                      Send My Request
                      <FiSend className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <Footer />
    </main>
  );
}

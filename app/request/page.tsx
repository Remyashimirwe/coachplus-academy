"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAward,
} from "react-icons/fi";
import Navbar from "@/app/components/Navbar";
import { saveRequest } from "@/app/actions/request";

const subjects = [
  "Mathematics",
  "English",
  "Science",
  "Coding",
  "Exam Prep",
  "Languages",
];

const grades = [
  "Primary (Grades 1-6)",
  "Middle School (Grades 7-8)",
  "High School (Grades 9-12)",
  "University",
];

const inputClasses =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20";

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
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function RequestPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1266f1] via-[#1a6ff3] to-[#4f8cff] pt-32 pb-16 text-white">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#0b52d0]/40 blur-3xl" />
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20">
              <FiAward className="size-4" />
              Request a Teacher
            </p>
            <h1 className="mt-6 text-5xl font-medium leading-[1.05] sm:text-6xl">
              Tell us what your child needs
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/85">
              Fill in the details below and we&apos;ll match you with a verified
              teacher who fits your child&apos;s goals, schedule, and learning
              style.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f6f8fb] py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-[28px] bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-14"
            >
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#eaf2ff] text-[#1266f1]">
                <FiCheckCircle className="size-10" />
              </div>
              <h2 className="mt-8 text-3xl font-medium">Request received!</h2>
              <p className="mx-auto mt-4 max-w-md leading-7 text-slate-500">
                Thank you for your request. WeCoach will review your details and
                get back to you shortly with matched teachers.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-8 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)] transition hover:-translate-y-0.5"
              >
                Back to Home
              </Link>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              onSubmit={async (e) => {
                e.preventDefault();
                await saveRequest(new FormData(e.currentTarget));
                setSubmitted(true);
              }}
              className="rounded-[28px] bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-10"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  icon={<FiUser className="size-4" />}
                  label="Parent's name"
                  htmlFor="parent-name"
                >
                  <input
                    id="parent-name"
                    required
                    placeholder="e.g. Sarah Johnson"
                    className={inputClasses}
                  />
                </Field>

                <Field
                  icon={<FiMail className="size-4" />}
                  label="Email address"
                  htmlFor="email"
                >
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className={inputClasses}
                  />
                </Field>

                <Field
                  icon={<FiPhone className="size-4" />}
                  label="Phone number"
                  htmlFor="phone"
                >
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    className={inputClasses}
                  />
                </Field>

                <Field
                  icon={<FiAward className="size-4" />}
                  label="Child's grade"
                  htmlFor="grade"
                >
                  <select
                    id="grade"
                    required
                    defaultValue=""
                    className={`${inputClasses} appearance-none ${
                      "text-slate-600"
                    }`}
                  >
                    <option value="" disabled>
                      Select grade
                    </option>
                    {grades.map((grade) => (
                      <option key={grade}>{grade}</option>
                    ))}
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FiBookOpen className="size-4" />
                    Subject needed
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <label key={subject} className="cursor-pointer">
                        <input
                          type="checkbox"
                          name="subject"
                          value={subject}
                          className="peer sr-only"
                        />
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition peer-checked:border-[#1266f1] peer-checked:bg-[#eaf2ff] peer-checked:text-[#1266f1] hover:border-[#1266f1]/50">
                          {subject}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="details"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <FiMessageSquare className="size-4" />
                    Tell us more
                  </label>
                  <textarea
                    id="details"
                    rows={4}
                    placeholder="Goals, current challenges, preferred schedule, online or at home..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="group mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-8 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(18,102,241,0.5)]"
              >
                Submit Request
                <FiSend className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.form>
          )}
        </div>
      </section>
    </main>
  );
}

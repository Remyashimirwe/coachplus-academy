"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiClock,
  FiUser,
  FiShield,
  FiArrowRight,
  FiMenu,
  FiX,
  FiSend,
} from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Tell us what your child needs",
    text: "Choose the subject, grade, schedule, learning goals, and whether lessons should happen online or at home.",
  },
  {
    number: "02",
    title: "Meet matched teachers",
    text: "Compare verified educators by specialty, availability, reviews, and the teaching style that fits your child.",
  },
  {
    number: "03",
    title: "Start learning with confidence",
    text: "Book recurring sessions, track progress, and keep every lesson centered around measurable growth.",
  },
];

const features = [
  {
    icon: FiCheckCircle,
    title: "Verified Teachers",
    text: "Every teacher profile is reviewed for qualifications, background, teaching experience, and trust.",
  },
  {
    icon: FiClock,
    title: "Flexible Scheduling",
    text: "Find educators who fit your family routine with online, home, weekday, and weekend options.",
  },
  {
    icon: FiUser,
    title: "Personalized Plans",
    text: "Teachers adapt lessons to your child's pace, school curriculum, strengths, and confidence gaps.",
  },
  {
    icon: FiShield,
    title: "Safe Learning",
    text: "A guided, transparent experience for parents who want excellent learning without guesswork.",
  },
];

const programs = [
  {
    title: "Primary School Support",
    text: "Core literacy, numeracy, homework help, and confidence building for younger learners.",
  },
  {
    title: "Exam Preparation",
    text: "Focused coaching for national exams, term tests, revision plans, and study discipline.",
  },
  {
    title: "STEM and Coding",
    text: "Math, science, computer basics, robotics foundations, and beginner-friendly coding.",
  },
];

const footerGroups = ["Platform", "Community", "Legal"];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3 font-medium">
      <img
        src="/logo.png"
        alt="WeCoach"
        className="size-11 rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105"
      />
      <span
        className={`text-2xl font-medium tracking-tight ${
          light ? "text-white" : "text-[#0b1638]"
        }`}
      >
        WeCoach
      </span>
    </Link>
  );
}

function ArrowIcon() {
  return <FiArrowRight className="size-4" aria-hidden="true" />;
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Programs", href: "/programs" },
    { label: "Become a Teacher", href: "#teachers" },
  ];

  return (
    <main className="min-h-screen bg-white text-[#121826]">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "border-slate-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.1)]"
            : "border-slate-200/60 shadow-sm"
        }`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Brand />
          <div className="hidden items-center gap-9 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group relative text-sm font-medium text-slate-600 transition-colors hover:text-[#1266f1]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <Link
              href="/request"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-7 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(18,102,241,0.5)]"
            >
              <FiSend className="size-4" />
              Request a Teacher
            </Link>
          </div>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-[#0b1638] shadow-sm transition hover:border-[#1266f1] md:hidden"
          >
            {menuOpen ? <FiX className="size-5" /> : <FiMenu className="size-5" />}
          </button>
        </nav>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl md:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-6">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-[#eaf2ff] hover:text-[#1266f1]"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/request"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-7 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)]"
                >
                  <FiSend className="size-4" />
                  Request a Teacher
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1266f1] via-[#1a6ff3] to-[#4f8cff] pt-20">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#0b52d0]/40 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0))]" />
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl text-5xl font-medium leading-[1.02] text-white sm:text-6xl lg:text-7xl"
            >
              Find the perfect teacher for your child
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-7 max-w-xl text-lg font-normal leading-8 text-white/85"
            >
              WeCoach connects parents with carefully verified educators for
              personal, high-performance learning at home or online.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              id="find"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/request"
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-[#1266f1] shadow-[0_20px_45px_rgba(4,24,74,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(4,24,74,0.28)]"
              >
                Request a Teacher
                <span className="transition-transform group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </motion.div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="overflow-hidden rounded-[26px] shadow-[0_32px_80px_rgba(3,24,69,0.28)]"
            >
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&h=680&fit=crop"
                alt="Teacher working online with student"
                className="aspect-[4/3] w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f6f8fb] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-4xl font-medium tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-lg font-normal leading-8 text-slate-500">
              Three simple steps to unlock your child&apos;s learning potential.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-[22px] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#1266f1]/30 hover:shadow-[0_24px_60px_rgba(18,102,241,0.12)]"
              >
                <p className="text-5xl font-medium text-[#1266f1]">
                  {step.number}
                </p>
                <h3 className="mt-6 text-xl font-medium">{step.title}</h3>
                <p className="mt-4 font-normal leading-7 text-slate-500">{step.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
          >
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#1266f1]">
                Programs
              </p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight">
                Learning paths for every goal
              </h2>
              <p className="mt-4 text-lg font-normal leading-8 text-slate-500">
                Choose a focused program, then get matched with a teacher who
                can personalize it for your child.
              </p>
            </div>
            <Link
              href="/programs"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1266f1] px-7 text-sm font-medium text-white transition hover:bg-[#0d55ce]"
            >
              View Programs
              <span className="transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {programs.map((program, index) => (
              <motion.article
                key={program.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group rounded-[22px] bg-[#f7faff] p-7 ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_24px_60px_rgba(18,102,241,0.12)] hover:ring-[#1266f1]/20"
              >
                <h3 className="text-xl font-medium transition-colors group-hover:text-[#1266f1]">{program.title}</h3>
                <p className="mt-4 font-normal leading-7 text-slate-500">{program.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f6f8fb] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-medium tracking-tight">
              Why Choose WeCoach
            </h2>
            <p className="mt-4 text-lg font-normal leading-8 text-slate-500">
              Premium features built around safety, comfort, and better
              learning outcomes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group rounded-[22px] bg-white p-7 ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.1)] hover:ring-[#1266f1]/20"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf2ff] text-[#1266f1] shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium">{feature.title}</h3>
                  <p className="mt-4 font-normal leading-7 text-slate-500">{feature.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="teachers" className="bg-[#0f172a] py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-medium">
              Ready to help your child grow?
            </h2>
            <p className="mt-4 max-w-2xl font-normal leading-8 text-white/68">
              Start with a teacher match built around your goals, schedule, and
              preferred learning style.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/request"
              className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-[#1266f1] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
            >
              Request a Teacher
              <span className="transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-[#1266f1] py-14 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div>
              <Brand light />
              <p className="mt-6 max-w-sm leading-7 text-white/72">
                Connecting parents and qualified private tutors for home and
                online learning excellence.
              </p>
            </div>
            {footerGroups.map((group) => (
              <div key={group}>
                <h3 className="font-medium">{group}</h3>
                <div className="mt-4 flex flex-col gap-3 text-sm text-white/72">
                  <a className="transition hover:text-white" href="#">
                    About Us
                  </a>
                  <a className="transition hover:text-white" href="#">
                    Careers
                  </a>
                  <a className="transition hover:text-white" href="#">
                    Privacy Policy
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-white/20 pt-10 text-center text-sm text-white/70">
            &copy; 2026 WeCoach Education Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

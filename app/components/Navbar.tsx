"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMenu, FiX } from "react-icons/fi";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Programs", href: "/programs" },
  { label: "Request a Teacher", href: "/request" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-xl transition-all duration-500 ${
        scrolled
          ? "border-slate-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.1)]"
          : "border-slate-200/60 shadow-sm"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 font-normal">
          <img
            src="/logo.png"
            alt="WeCoach"
            className="size-11 rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105"
          />
          <span className="text-2xl font-medium tracking-tight text-[#0b1638]">
            WeCoach
          </span>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative text-sm font-medium text-slate-600 transition-colors hover:text-[#1266f1]"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] transition-all duration-300 group-hover:w-full" />
            </Link>
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
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-[#eaf2ff] hover:text-[#1266f1]"
                >
                  {link.label}
                </Link>
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
  );
}

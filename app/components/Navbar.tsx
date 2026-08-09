"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMenu, FiX } from "react-icons/fi";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories", href: "/programs" },
  { label: "Become a Teacher", href: "/become-a-teacher" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      if (pathname === "/") {
        const sections = navLinks
          .filter(link => link.href.startsWith("/#"))
          .map(link => link.href.substring(2));
        
        let currentSection = sections[0]; // Default to first section (home)
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 200) {
              currentSection = section;
            }
          }
        }
        
        setActiveSection(currentSection);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return pathname === "/" && activeSection === href.substring(2);
    }
    if (href === "/become-a-teacher") {
      return pathname === "/become-a-teacher";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ${
        scrolled
          ? "bg-white/80 border-b border-slate-200 shadow-lg backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 font-normal">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-0 blur transition duration-300 group-hover:opacity-100" />
            <img
              src="/logo.png"
              alt="WeCoach"
              className="relative size-12 rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105"
            />
          </div>
          <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-[#21121f]" : "text-white"}`}>
            We<span className="text-[#E91E63]">Coach</span>
          </span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`group relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                scrolled 
                  ? (isActive(link.href) ? "text-[#E91E63] bg-[#fff0f3]" : "text-slate-600 hover:text-[#E91E63] hover:bg-[#fff0f3]") 
                  : (isActive(link.href) ? "text-white bg-white/20" : "text-white/80 hover:text-white hover:bg-white/10")
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/request"
            className={`group inline-flex min-h-[50px] items-center gap-2 rounded-2xl px-7 text-sm font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 ${
              scrolled
                ? "bg-[#E91E63] text-white hover:bg-[#7B1FA2] hover:shadow-rose-500/25"
                : "bg-white text-[#E91E63] hover:bg-white/90 hover:shadow-white/10"
            }`}
          >
            <FiSend className="size-4" />
            Request a Teacher
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className={`grid size-11 place-items-center rounded-2xl border transition-all md:hidden ${
            scrolled
              ? "border-slate-200 bg-white text-[#21121f] hover:border-[#E91E63]"
              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {menuOpen ? <FiX className="size-6" /> : <FiMenu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-x-0 z-[70] px-5 md:hidden transition-all duration-500 ${scrolled ? "top-[72px]" : "top-[88px]"}`}
          >
            <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-2xl px-6 py-4 text-base font-bold transition-all w-fit ${
                      isActive(link.href)
                        ? "bg-[#fff0f3] text-[#E91E63]"
                        : "text-slate-600 hover:bg-[#fff0f3] hover:text-[#E91E63]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/request"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 inline-flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-7 text-lg font-bold text-white shadow-lg shadow-rose-500/25"
                >
                  <FiSend className="size-5" />
                  Request a Teacher
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import { getSession, logout } from "@/app/lib/auth";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/programs" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Why Choose Us", href: "/why-choose-us" },
  { label: "Become a Teacher", href: "/become-a-teacher" },
];

const menuVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session) setUser(session.user);
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      if (pathname === "/") {
        const sections = ["home", "how-it-works", "why-choose-us"];
        
        let currentSection = sections[0];
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

  useEffect(() => {
    if (!menuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const hiddenRoutes = ["/admin", "/teacher", "/student", "/login", "/setup-password"];
  const shouldHide = hiddenRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (shouldHide) return null;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" ;
    }
    if (href.startsWith("/#")) {
      return pathname === "/" && activeSection === href.substring(2);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isHomePage = pathname === "/";

  const filteredNavLinks = user 
    ? navLinks.filter(link => link.label !== "How It Works" && link.label !== "Why Choose Us")
    : navLinks;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ${
        scrolled || !isHomePage
          ? "bg-white/80 shadow-lg backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 font-normal">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-0 blur transition duration-300 group-hover:opacity-100" />
            <img
              src="/logo.png"
              alt="CoachPlus Academy"
              className="relative h-10 w-auto rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105 sm:h-12"
            />
          </div>
          <span className={`text-lg sm:text-xl font-bold tracking-tight transition-colors duration-300 ${scrolled || !isHomePage ? "text-slate-900" : "text-white"}`}>
            CoachPlus <span className="text-[#E91E63]">Academy</span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`group relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                scrolled || !isHomePage
                  ? (isActive(link.href) ? "text-[#E91E63] bg-[#fff0f3]" : "text-slate-600 hover:text-[#E91E63] hover:bg-[#fff0f3]") 
                  : (isActive(link.href) ? "text-white bg-white/20" : "text-white/80 hover:text-white hover:bg-white/10")
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={user.role === "TEACHER" ? "/teacher" : user.role === "ADMIN" ? "/admin" : "/student"}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  scrolled || !isHomePage
                    ? "text-slate-900 bg-slate-100 hover:bg-slate-200"
                    : "text-white bg-white/20 hover:bg-white/30"
                }`}
              >
                <FiUser className="size-5" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className={`flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
                  scrolled || !isHomePage
                    ? "text-slate-600 hover:text-red-600 hover:bg-red-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="Logout"
              >
                <FiLogOut className="size-5" />
              </button>
            </div>
          ) : null}
          <Link
            href="/request"
            className={`group inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-6 text-sm font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 ${
              scrolled || !isHomePage
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
          aria-expanded={menuOpen}
          className={`grid size-11 place-items-center rounded-2xl border transition-all duration-300 active:scale-90 md:hidden ${
            scrolled || !isHomePage
              ? "border-slate-200 bg-white text-slate-900 hover:border-[#E91E63]"
              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid place-items-center"
            >
              {menuOpen ? <FiX className="size-6" /> : <FiMenu className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[65] bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-panel"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed inset-x-0 z-[70] px-5 md:hidden transition-all duration-500 ${scrolled ? "top-[72px]" : "top-[88px]"}`}
          >
            <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-2">
                {filteredNavLinks.map((link) => (
                  <motion.div key={link.label} variants={menuItemVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-200 w-fit hover:translate-x-1 ${
                        isActive(link.href)
                          ? "bg-[#fff0f3] text-[#E91E63]"
                          : "text-slate-600 hover:bg-[#fff0f3] hover:text-[#E91E63]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {user ? (
                  <motion.div variants={menuItemVariants} className="mt-2 flex flex-col gap-2">
                    <Link
                      href={user.role === "TEACHER" ? "/teacher" : user.role === "ADMIN" ? "/admin" : "/student"}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[#E91E63]/40"
                    >
                      <FiUser className="size-5 text-[#E91E63]" />
                      <span className="truncate">{user.name}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 text-base font-semibold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-100"
                    >
                      <FiLogOut className="size-5" />
                      Logout
                    </button>
                  </motion.div>
                ) : null}
                <motion.div variants={menuItemVariants}>
                  <Link
                    href="/request"
                    onClick={() => setMenuOpen(false)}
                    className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-7 text-base font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7B1FA2] active:scale-95"
                  >
                    <FiSend className="size-5" />
                    Request a Teacher
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

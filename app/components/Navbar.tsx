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
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Why Choose Us", href: "/why-choose-us" },
  { label: "Become a Teacher", href: "/become-a-teacher" },
];

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
              alt="Coach Plus"
              className="relative h-10 w-auto rounded-xl object-contain shadow-sm transition-transform group-hover:scale-105 sm:h-12"
            />
          </div>
          <span className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${scrolled || !isHomePage ? "text-slate-900" : "text-white"}`}>
            Coach <span className="text-[#E91E63]">Plus</span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {filteredNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`group relative rounded-xl px-4 py-2 text-base font-semibold transition-all duration-300 ${
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
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition-all duration-300 ${
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
            className={`group inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-6 text-base font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 ${
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
          className={`grid size-11 place-items-center rounded-2xl border transition-all md:hidden ${
            scrolled || !isHomePage
              ? "border-slate-200 bg-white text-slate-900 hover:border-[#E91E63]"
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
                {filteredNavLinks.map((link) => (
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
                {user ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <Link
                      href={user.role === "TEACHER" ? "/teacher" : user.role === "ADMIN" ? "/admin" : "/student"}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-lg font-bold text-slate-700 shadow-sm"
                    >
                      <FiUser className="size-5 text-[#E91E63]" />
                      <span className="truncate">{user.name}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 text-lg font-bold text-red-600 shadow-sm"
                    >
                      <FiLogOut className="size-5" />
                      Logout
                    </button>
                  </div>
                ) : null}
                <Link
                  href="/request"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#E91E63] px-7 text-lg font-bold text-white shadow-lg shadow-rose-500/25"
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

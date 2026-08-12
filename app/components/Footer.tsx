"use client";

import Link from "next/link";

import { useState, useEffect } from "react";
import { getSession } from "@/app/lib/auth";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Categories", href: "/programs" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why Choose Us", href: "/why-choose-us" },
      { label: "Become a Teacher", href: "/become-a-teacher" },
      { label: "Request a Teacher", href: "/request" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
];

export default function Footer() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session) setUser(session.user);
    };
    fetchSession();
  }, []);

  return (
    <footer className="bg-[#0f172a] pt-12 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(2,1fr)]">
          <div>
            <Link href="/" className="group flex items-center gap-3 font-normal w-fit">
              <img
                src="/logo.png"
                alt="Wecoach Academy"
                className="size-12 rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="text-3xl font-bold tracking-tight text-white">
                Wecoach <span className="text-[#E91E63]">Academy</span>
              </span>
            </Link>
            <p className="mt-8 max-w-sm text-base leading-relaxed text-slate-400">
              Your Success Starts with the Right Coach.
            </p>
          </div>
          
          {footerGroups.map((group) => {
            const filteredLinks = user && group.title === "Platform"
              ? group.links.filter(link => link.label !== "How It Works" && link.label !== "Why Choose Us")
              : group.links;

            return (
              <div key={group.title}>
                <h3 className="text-base font-bold text-white mb-6">{group.title}</h3>
                <ul className="flex flex-col gap-4">
                  {filteredLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-base text-slate-400 transition hover:text-[#E91E63]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          <p>&copy; 2026 Wecoach Academy</p>
        </div>
      </div>
    </footer>
  );
}

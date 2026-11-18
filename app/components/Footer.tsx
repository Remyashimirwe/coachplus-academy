"use client";

import Link from "next/link";

import { useState, useEffect } from "react";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { getSession } from "@/app/lib/auth-actions";
import PlayStoreButton from "./PlayStoreButton";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Categories", href: "/programs" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why Choose Us", href: "/why-choose-us" },
      { label: "Become a Teacher", href: "/become-a-teacher" },
      { label: "Application Status", href: "/application-status" },
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
                alt="CoachPlus Academy"
                className="size-10 rounded-2xl object-contain shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="text-2xl font-semibold tracking-tight text-white">
                CoachPlus <span className="text-[#E91E63]">Academy</span>
              </span>
            </Link>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-slate-400">
              Your Success Starts with the Right Coach.
            </p>
            <div className="mt-6">
              <p className="mb-3 text-sm text-slate-400">
                Learn on the go — get the CoachPlus app.
              </p>
              <PlayStoreButton variant="outline" className="min-h-[46px] px-5" />
            </div>
          </div>
          
          {footerGroups.map((group) => {
            const filteredLinks = user && group.title === "Platform"
              ? group.links.filter(link => link.label !== "How It Works" && link.label !== "Why Choose Us")
              : group.links;

            return (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-white mb-6">{group.title}</h3>
                <ul className="flex flex-col gap-4">
                  {filteredLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 transition hover:text-[#E91E63]"
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
        
        <div className="mt-10 border-t border-white/10 pt-8 pb-8">
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-4">
            <a
              href="tel:+250780000000"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <FaPhoneAlt className="size-4" />
              <span>+250 780 000 000</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="https://wa.me/250780000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-300 hover:text-[#25D366] transition-colors"
            >
              <FaWhatsapp className="size-4" />
              <span>WhatsApp</span>
            </a>
          </div>
          <p className="text-slate-500">&copy; 2026 CoachPlus Academy</p>
        </div>
      </div>
    </footer>
  );
}

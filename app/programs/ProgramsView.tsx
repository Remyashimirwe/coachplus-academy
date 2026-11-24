"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiClipboard,
} from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgramModal from "../components/ProgramModal";
import PageHero from "../components/PageHero";
import { localizedContent, localizedDatabaseText, t, useSiteLocale } from "../lib/site-i18n";

type Topic = {
  id: number;
  name: string;
  nameFr?: string | null;
  image: string | null;
};

type Subject = {
  id: number;
  name: string;
  nameFr?: string | null;
  image: string | null;
  topics: Topic[];
};

type Program = {
  id: number;
  title: string;
  titleFr?: string | null;
  level: string;
  levelFr?: string | null;
  text: string;
  textFr?: string | null;
  subjects: Subject[];
  image: string | null;
};

export default function ProgramsPage({
  programs,
}: {
  programs: Program[];
}) {
  const locale = useSiteLocale();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openDetails = (program: Program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleRequestTeacher = (e: React.MouseEvent, programId: number) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/request?programId=${programId}`);
  };

  const MAX_LENGTH = 200;

  return (
    <main className="min-h-screen bg-white text-[#21121f]">
      <PageHero
        badge={t(locale, "Our Categories")}
        title={<>{t(locale, "Learning paths for every goal")}</>}
        subtitle={t(locale, "Explore our learning categories and find the perfect fit for you.")}
      />

      <section className="bg-white py-12 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[40px] bg-white py-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
              <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <FiBookOpen className="size-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{t(locale, "No Programs Available")}</h3>
              <p className="mt-2 text-slate-600 max-w-md px-6">
                {t(locale, "We're currently expanding our offerings. Please check back later or contact us for custom tutoring needs.")}
              </p>
              <Link
                href="/request"
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#E91E63] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#7B1FA2] active:scale-95 shadow-lg shadow-rose-500/20"
              >
                {t(locale, "Request a Custom Category")}
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program, index) => {
                const isLong = program.text.length > MAX_LENGTH;
                const description = isLong
                  ? `${program.text.slice(0, MAX_LENGTH).trimEnd()}…`
                  : program.text;
                const title = localizedContent(locale, program.title, program.titleFr);
                const level = localizedContent(locale, program.level, program.levelFr);
                const translatedDescription = localizedDatabaseText(locale, description, program.textFr);

                return (
                <Link
                  key={program.id}
                  href={`/programs/${program.id}`}
                  className="block"
                >
                  <motion.article
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                    className="group flex h-full flex-col overflow-hidden rounded-4xl bg-white shadow-xl shadow-slate-200 ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300"
                  >
                    <div className="aspect-video w-full overflow-hidden relative shrink-0">
                      <img 
                        src={program.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"} 
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                      <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#E91E63] shadow-lg backdrop-blur-sm">
                        {level}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-base font-medium text-[#0f172a] transition-colors group-hover:text-[#E91E63]">
                        {title}
                      </h2>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                        {translatedDescription}
                      </p>
                      {isLong && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDetails(program);
                          }}
                          className="mt-2 self-start text-sm font-bold text-[#E91E63] transition-colors hover:text-[#7B1FA2]"
                        >
                          {t(locale, "Show more")}
                        </button>
                      )}
                      
                      <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDetails(program);
                          }}
                          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#E91E63] py-3 text-sm font-bold text-[#E91E63] transition-all hover:bg-[#E91E63] hover:text-white active:scale-95 shadow-sm"
                        >
                          {t(locale, "Read more")}
                          <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <button
                          onClick={(e) => handleRequestTeacher(e, program.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#E91E63] py-3 text-sm font-bold text-white transition-all hover:bg-[#7B1FA2] active:scale-95 shadow-lg shadow-rose-500/20"
                        >
                          {t(locale, "Request a Teacher")}
                          <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0f172a] py-20 text-white">
        <div className="absolute -right-24 top-0 size-72 rounded-full bg-[#E91E63]/25 blur-3xl" />
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-6 md:flex-row md:items-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/15">
              <FiClipboard className="size-4" />
              Not sure where to start?
            </p>
            <h2 className="mt-5 text-2xl font-semibold text-white">Need help choosing?</h2>
            <p className="mt-6 max-w-2xl text-base text-white/90 leading-relaxed">
              Tell CoachPlus Academy your goals and we&apos;ll recommend the
              best category and tutor match.
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
              className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-[#E91E63] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            >
              Request a Teacher
              <FiArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
      <ProgramModal 
        program={selectedProgram} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}

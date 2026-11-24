"use client";

import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiImage } from "react-icons/fi";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PlayStoreButton from "./PlayStoreButton";
import { localizedContent, t, useSiteLocale } from "../lib/site-i18n";

type HeroProgram = {
  id: number;
  title: string;
  titleFr?: string | null;
  level: string;
  text: string;
  image: string | null;
};

const AUTOPLAY_DELAY = 5000;

/** Modern auto-advancing slideshow of the Categories an admin has marked as "Show in Homepage Slideshow" (Admin > Manage Learning), showing each program's image and name. */
function ProgramsSlideshow({ programs }: { programs: HeroProgram[] }) {
  const locale = useSiteLocale();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (programs.length < 2) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % programs.length);
    }, AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [programs.length]);

  const goTo = (nextIndex: number) => {
    setDirection(nextIndex > index ? 1 : -1);
    setIndex((nextIndex + programs.length) % programs.length);
  };

  if (programs.length === 0) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden rounded-[40px] border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl aspect-square">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#E91E63]/30 via-transparent to-[#FF5733]/20" />
        <FiImage className="relative size-16 text-white/50" />
      </div>
    );
  }

  const active = programs[index];

  return (
    <div className="relative overflow-hidden rounded-[40px] border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl aspect-square">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={active.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60, scale: 1.03 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -direction * 60, scale: 0.97 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Link href={`/programs?programId=${active.id}`} className="absolute inset-0 block">
            <img
              src={active.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=800&fit=crop"}
              alt={localizedContent(locale, active.title, active.titleFr)}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#21121f]/90 via-[#21121f]/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E91E63]/20 via-transparent to-[#FF5733]/10" />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-x-0 bottom-0 p-6 sm:p-8"
            >
              <h3 className="text-2xl font-bold text-white drop-shadow-md">{localizedContent(locale, active.title, active.titleFr)}</h3>
            </motion.div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {programs.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous program"
            className="absolute left-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/40"
          >
            <FiChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next program"
            className="absolute right-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/40"
          >
            <FiChevronRight className="size-5" />
          </button>

          <div className="absolute top-5 right-5 z-10 flex gap-1.5">
            {programs.map((program, i) => (
              <button
                key={program.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${program.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Hero({ programs = [] }: { programs?: HeroProgram[] }) {
  const locale = useSiteLocale();
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-20 pb-16 text-white md:pt-24 md:pb-20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/30 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
      
      <div className="mx-auto mt-1 grid min-h-[440px] max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8">
        <div className="relative z-10 order-2 max-w-2xl lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              {t(locale, "Forum for certified professional teachers")}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/90 leading-relaxed sm:text-base">
              {t(locale, "Trusted educators providing personalized home and online coaching")}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-8"
            >
              <PlayStoreButton />
            </motion.div>
          </motion.div>
        </div>

        <div className="relative z-10 order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <ProgramsSlideshow programs={programs} />
          </motion.div>
        </div>
      </div>

      {/* Bottom non-straight transition */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block h-[60px] w-full fill-white"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.43,243.93,70.9,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
}

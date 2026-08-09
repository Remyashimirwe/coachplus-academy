"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiMapPin } from "react-icons/fi";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-28 pb-20">
      {/* Decorative background elements */}
      <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/45 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0))]" />
      
      <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Unlock Your Child's <span className="text-orange-200">Full Potential</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg font-normal leading-relaxed text-white/90">
              WeCoach connects parents with elite, hand-picked educators for personalized learning experiences that inspire confidence and academic excellence.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/request"
                className="group inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[#E91E63] shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
              >
                Find Your Perfect Teacher
                <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-white/30 px-8 text-base font-medium text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
              >
                How it Works
              </a>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {/* Rwanda Map Visual */}
            <div className="relative overflow-hidden rounded-[40px] border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#E91E63]/30 via-transparent to-[#FF5733]/20" />
              
              {/* Rwanda Visual - Minimalist Style */}
              <div className="relative flex h-full w-full items-center justify-center p-8">
                <svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 h-full w-full drop-shadow-2xl"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Kigali / Rwanda Center Pin */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring", stiffness: 100 }}
                  >
                    {/* Pulsing indicator */}
                    <circle cx="100" cy="95" r="5" fill="#FF5733" className="animate-pulse" />
                    <circle cx="100" cy="95" r="14" stroke="#FF5733" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow" />
                    
                    {/* Location Label */}
                    <foreignObject x="110" y="78" width="100" height="40">
                      <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold text-[#E91E63] shadow-lg backdrop-blur-sm border border-[#E91E63]/20">
                        <FiMapPin className="size-2.5" />
                        <span>KIGALI, RWANDA</span>
                      </div>
                    </foreignObject>
                  </motion.g>
                </svg>

                {/* Abstract Geometric Elements instead of images */}
                <div className="relative size-48 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { FiArrowRight, FiMapPin, FiSend, FiUser } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] pt-32 pb-24 md:pt-40 md:pb-36">
      {/* Decorative background elements */}
      <div className="absolute -left-32 top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/45 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0))]" />
      
      <div className="mx-auto grid min-h-[400px] max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Forum for certified professional teachers
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/90 leading-relaxed sm:text-base">
              Trusted educators providing personalized home and online coaching
            </p>
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
                  {/* Kigali  / Rwanda Center Pin */}
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

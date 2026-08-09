"use client";

import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import ProgramsSection from "./components/ProgramsSection";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <HowItWorks />
      <ProgramsSection />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}

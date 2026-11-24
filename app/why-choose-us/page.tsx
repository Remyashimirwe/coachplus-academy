"use client";

import Features from "../components/Features";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { t, useSiteLocale } from "../lib/site-i18n";

export default function WhyChooseUsPage() {
  const locale = useSiteLocale();
  return (
    <main className="min-h-screen">
      <PageHero
        title={<>{t(locale, "Why Choose ")}<span className="text-[#E91E63]">CoachPlus Academy</span></>}
        subtitle={t(locale, "Premium features built around safety, comfort, and better learning outcomes for you.")}
      />
      <Features />
      <Footer />
    </main>
  );
}

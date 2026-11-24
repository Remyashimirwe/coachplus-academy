"use client";

import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { t, useSiteLocale } from "../lib/site-i18n";

export default function HowItWorksPage() {
  const locale = useSiteLocale();
  return (
    <main className="min-h-screen">
      <PageHero
        title={<>{t(locale, "How It ")}<span className="text-[#E91E63]">{t(locale, "Works")}</span></>}
        subtitle={t(locale, "Three simple steps to find the perfect tutor and start growing.")}
      />
      <HowItWorks />
      <Footer />
    </main>
  );
}

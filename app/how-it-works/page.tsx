import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        title={<>How It <span className="text-[#E91E63]">Works</span></>}
        subtitle="Three simple steps to find the perfect tutor and start growing."
      />
      <HowItWorks />
      <Footer />
    </main>
  );
}
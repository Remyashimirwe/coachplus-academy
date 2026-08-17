import Features from "../components/Features";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";

export default function WhyChooseUsPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        title={<>Why Choose <span className="text-[#E91E63]">CoachPlus Academy</span></>}
        subtitle="Premium features built around safety, comfort, and better learning outcomes for your children."
      />
      <Features />
      <Footer />
    </main>
  );
}
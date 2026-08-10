import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import ProgramsSection from "./components/ProgramsSection";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import {getPrograms} from "./lib/db";

export default async function Home() {
    const programs = await getPrograms();

    return (
        <main className="min-h-screen bg-white">
            <Hero/>
            <ProgramsSection programs={programs}/>
            <CTA/>
            <Footer/>
        </main>
    );
}

import Hero from "./components/Hero";
import ProgramsSection from "./components/ProgramsSection";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import {getCachedPrograms} from "./lib/db";
import { pageMetadata } from "./lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
    title: "Find Trusted Teachers for Home and Online Coaching",
    description: "Connect with trusted teachers for personalized home and online coaching in Rwanda. Find support for school subjects, Cambridge programs, languages, exam preparation, and practical skills.",
    path: "/",
});



export default async function Home() {
    const programs = await getCachedPrograms();
    const featuredPrograms = programs.filter((program) => program.featuredInHero);
    const heroPrograms = featuredPrograms.length > 0 ? featuredPrograms : programs;

    return (
        <main className="min-h-screen bg-white">
            <Hero programs={heroPrograms}/>
            <ProgramsSection programs={programs}/>
            <CTA/>
            <Footer/>
            
        </main>
    );
}

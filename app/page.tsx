import Hero from "./components/Hero";
import ProgramsSection from "./components/ProgramsSection";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import {getPrograms} from "./lib/db";

export const dynamic = "force-dynamic";



export default async function Home() {
    const programs = await getPrograms();
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

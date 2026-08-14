"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-[#21121f] sm:text-4xl mb-8">
              Terms of <span className="text-[#E91E63]">Service</span>
            </h1>
            
            <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">1. Agreement to Terms</h2>
                <p>
                  By accessing or using CoachPlus Academy&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">2. Description of Service</h2>
                <p>
                  CoachPlus Academy is a platform that matches students with qualified teachers for online and home-based coaching. We facilitate the discovery, booking, and management of educational sessions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">3. User Responsibilities</h2>
                <p>
                  Users of our platform (students, parents, and teachers) agree to:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of their account</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Treat other users with respect and professionalism</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">4. Teacher Partner Program</h2>
                <p>
                  Teachers applying to join our platform are subject to additional terms as outlined in the Teacher Partner Agreement, which includes background checks, conduct standards, and payment terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">5. Payments and Refunds</h2>
                <p>
                  Payments for coaching sessions are managed through our platform. Payouts to teachers are conducted according to our standard schedule. Refund policies are determined on a case-by-case basis in accordance with our satisfaction guarantee.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">6. Limitation of Liability</h2>
                <p>
                  CoachPlus Academy acts as a matching platform. While we vet our teacher partners, we are not liable for the actions, omissions, or conduct of any user, nor for any damages resulting from lessons conducted through our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">7. Termination</h2>
                <p>
                  We reserve the right to terminate or suspend access to our services immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users or our academy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">8. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the bottom of this page.
                </p>
              </section>

              <p className="text-sm text-slate-500 pt-8 border-t border-slate-100">
                Last Updated: August 12, 2026
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

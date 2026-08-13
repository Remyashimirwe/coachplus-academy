"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
              Privacy <span className="text-[#E91E63]">Policy</span>
            </h1>
            
            <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">1. Introduction</h2>
                <p>
                  At Coach Plus, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">2. Information We Collect</h2>
                <p>
                  We collect information that you provide directly to us when you request a teacher, apply to become a teacher, or communicate with us. This may include:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Contact information (name, email address, phone number, physical address)</li>
                  <li>Educational background and qualifications (for teacher applicants)</li>
                  <li>Learning goals and preferences (for student/parent requests)</li>
                  <li>Payment information (processed through secure third-party providers)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">3. How We Use Your Information</h2>
                <p>
                  We use the information we collect to:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Match students with appropriate teachers</li>
                  <li>Process applications for our teacher partner program</li>
                  <li>Communicate with you about our services, updates, and support</li>
                  <li>Ensure the safety and security of our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">4. Sharing of Information</h2>
                <p>
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Teachers or students for the purpose of matching and facilitating lessons</li>
                  <li>Service providers who perform services on our behalf</li>
                  <li>Legal authorities when required by law or to protect our rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">5. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">6. Your Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">7. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at privacy@coachplusacademy.com.
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

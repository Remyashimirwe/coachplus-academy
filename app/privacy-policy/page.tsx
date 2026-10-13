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
                  At CoachPlus Academy, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and when you use the CoachPlus Academy mobile app (together, the &ldquo;Service&rdquo;), operated by CoachPlus Academy.
                </p>
                <p>
                  This policy applies to personal information we handle through the website and the mobile app, including account details, learning and attendance records, and device information used for push notifications.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">2. Information We Collect</h2>
                <p>
                  We collect information that you provide directly to us, and a limited amount of technical information needed to run the Service.
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong className="text-slate-900">Account information:</strong> your name, email address, a hashed password, and your role (student, teacher, or admin).</li>
                  <li><strong className="text-slate-900">Profile information:</strong> an optional profile photo and phone number.</li>
                  <li><strong className="text-slate-900">Learning and service data:</strong> program and subject enrollment, attendance records, progress and development reports, and teacher ratings.</li>
                  <li><strong className="text-slate-900">Website request data:</strong> when you request a teacher or apply to become a teacher, we collect contact details, educational background and qualifications (for teacher applicants), and learning goals or preferences.</li>
                  <li><strong className="text-slate-900">Device tokens for push notifications:</strong> a token issued by Firebase Cloud Messaging so we can send you lesson, attendance, and account notifications. This token is not used for advertising and is not linked to a persistent device identifier.</li>
                </ul>
                <p className="text-sm text-slate-500">
                  We do not use advertising SDKs and we do not collect your precise location, contacts, or the Google advertising ID.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Create and manage your account and authenticate you securely (including a one-time emailed sign-in code).</li>
                  <li>Provide, maintain, and improve the Service.</li>
                  <li>Match students with appropriate teachers and facilitate lessons.</li>
                  <li>Track attendance, progress, and reports.</li>
                  <li>Send transactional communications such as sign-in codes, notifications, service updates, and support replies.</li>
                  <li>Ensure the safety and security of our platform.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">4. Push Notifications</h2>
                <p>
                  The app uses Firebase Cloud Messaging (provided by Google) to deliver push notifications, such as reminders about lessons, attendance, and account activity. You can turn off notifications at any time from your device settings. Disabling notifications does not affect your ability to use the app.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">5. Sharing of Information</h2>
                <p>
                  We do not sell your personal information. We share your information only with the service providers that help us operate the Service, and with other users as needed to match students and teachers:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong className="text-slate-900">Firebase (Google)</strong> — push notifications and secure authentication.</li>
                  <li><strong className="text-slate-900">Cloudinary</strong> — hosting of profile images.</li>
                  <li><strong className="text-slate-900">Resend</strong> — sending transactional emails such as sign-in and password-reset codes.</li>
                  <li><strong className="text-slate-900">Neon</strong> — secure database hosting.</li>
                  <li>Teachers or students, for the purpose of matching and facilitating lessons.</li>
                  <li>Legal authorities, when required by law or to protect our rights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">6. Data Security</h2>
                <p>
                  We protect your information using appropriate technical and organizational measures. All traffic between the app and our servers is encrypted in transit using HTTPS (TLS), passwords are stored only as salted hashes, and access to production data is restricted. No method of transmission over the Internet is 100% secure, but we work to keep your data protected.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">7. Data Retention</h2>
                <p>
                  We keep your personal information for as long as your account is active in order to provide the Service. When you delete your account, we permanently delete your personal data and the learning records tied to your account (such as attendance, reports, and ratings), as described in section 8. We may retain limited records where required for security, fraud prevention, or to comply with legal obligations, and we will tell you if that applies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">8. Account Deletion</h2>
                <p>
                  You can delete your account at any time. Deletion is permanent and removes your personal data and associated learning records &mdash; it is not a temporary deactivation.
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong className="text-slate-900">In the app:</strong> go to your profile, tap <em>Edit Profile</em>, then <em>Delete Account</em> and confirm.</li>
                  <li><strong className="text-slate-900">On the web:</strong> visit the <a href="/delete-account" className="text-[#E91E63] hover:underline">Delete Account</a> page, sign in, and confirm.</li>
                </ul>
                <p>
                  If you have any trouble deleting your account, contact us at privacy@coachplusacademy.com and we will help you.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">9. Your Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, export, or delete your data. You can review and edit most of your information from your profile in the app, or contact us at privacy@coachplusacademy.com to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">10. Children&rsquo;s Privacy</h2>
                <p>
                  The Service is not directed to children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us and we will delete it.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we do, we will update the &ldquo;Last Updated&rdquo; date below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">12. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or your data, please contact us at privacy@coachplusacademy.com.
                </p>
              </section>

              <p className="text-sm text-slate-500 pt-8 border-t border-slate-100">
                Last Updated: October 12, 2026
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

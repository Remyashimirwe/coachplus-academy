"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function CookiePolicy() {
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
              Cookie <span className="text-[#E91E63]">Policy</span>
            </h1>
            
            <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">1. What Are Cookies</h2>
                <p>
                  Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work or work more efficiently, as well as to provide information to the owners of the site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">2. How We Use Cookies</h2>
                <p>
                  Coach Plus uses cookies for several reasons:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong className="text-slate-900">Essential Cookies:</strong> These are necessary for the website to function properly. They include, for example, cookies that enable you to log into secure areas of our website.</li>
                  <li><strong className="text-slate-900">Analytical/Performance Cookies:</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
                  <li><strong className="text-slate-900">Functionality Cookies:</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">3. Third-Party Cookies</h2>
                <p>
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">4. Managing Cookies</h2>
                <p>
                  Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" className="text-[#E91E63] hover:underline" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" className="text-[#E91E63] hover:underline" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">5. Updates to This Policy</h2>
                <p>
                  We may update our Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#21121f] mb-4">6. Contact Us</h2>
                <p>
                  If you have any questions about our use of cookies or other technologies, please email us at privacy@coachplusacademy.com.
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

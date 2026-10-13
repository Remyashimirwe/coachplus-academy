"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OtpStep from "../components/OtpStep";
import { motion } from "framer-motion";

/**
 * External account-deletion page.
 *
 * Google Play requires that an app which allows account creation also lets a
 * user delete their account from an external web resource, not only in-app.
 * This page reuses the exact same sign-in the website already uses (password +
 * emailed 6-digit code, which sets the httpOnly `session` cookie) and then
 * calls the same `DELETE /api/account` endpoint the app uses, so web and app
 * deletion behave identically and remove all associated personal data.
 */
export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"credentials" | "otp" | "done">("credentials");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      if (data.requiresVerification) {
        setStage("otp");
        return;
      }

      // Anti-lockout path: no code was required, the session cookie is set.
      await performDelete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const performDelete = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || "We couldn't delete your account. Please contact support.");
        setBusy(false);
        return;
      }
      setStage("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onVerified = async () => {
    // The OTP step just set the session cookie, so deletion is authorized.
    setBusy(true);
    await performDelete();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-2xl px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-[#21121f] sm:text-4xl mb-4">
              Delete Your <span className="text-[#E91E63]">Account</span>
            </h1>

            <p className="text-slate-600 mb-6">
              Deleting your account is <strong className="text-slate-900">permanent</strong>. It removes your
              personal information and the learning records tied to your account. This is not a temporary
              deactivation and it cannot be undone.
            </p>

            {/* Google Play requires the delete-account page to state what is
                deleted, what is kept, and any retention period. */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-700 mb-3">
                  What is deleted
                </h2>
                <ul className="list-disc ml-5 space-y-1.5 text-sm text-slate-700">
                  <li>Your account: name, email address, hashed password, and profile photo</li>
                  <li>Your profile (student or teacher), including phone number and preferences</li>
                  <li>Attendance records and progress/development reports tied to you</li>
                  <li>Teacher ratings you submitted or received</li>
                  <li>Notifications and push-notification device tokens</li>
                  <li>Any parent/teacher requests you submitted</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-3">
                  What is kept
                </h2>
                <ul className="list-disc ml-5 space-y-1.5 text-sm text-slate-700">
                  <li>Programs, subjects, and topics (shared content — never personal)</li>
                  <li>Other users&rsquo; accounts and records (for example, students assigned to a
                    deleting teacher are kept and simply unassigned)</li>
                </ul>
                <p className="text-sm text-slate-600 mt-4">
                  <strong className="text-slate-900">Retention period:</strong> deletion is immediate and
                  permanent — there is no grace period or deferred retention. We may keep limited records
                  only where required for security, fraud prevention, or to comply with a legal
                  obligation, and only for as long as that purpose requires.
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[#21121f] mb-3">How to delete your account</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Follow the steps below. You can also delete from inside the CoachPlus Academy app:
              <em> Profile &rarr; Edit Profile &rarr; Delete Account</em>.
            </p>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              {stage === "credentials" && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <p className="text-sm text-slate-600">
                    Sign in with the email and password you use in the CoachPlus Academy app to confirm it
                    is really you before we delete anything.
                  </p>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#E91E63] text-white rounded-2xl py-4 font-bold shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </button>
                </form>
              )}

              {stage === "otp" && (
                <OtpStep email={email} purpose="login" onVerified={onVerified} onBack={() => setStage("credentials")} />
              )}

              {busy && stage !== "credentials" && (
                <div className="flex items-center justify-center gap-3 py-6 text-slate-600">
                  <div className="size-5 border-2 border-[#E91E63]/30 border-t-[#E91E63] rounded-full animate-spin" />
                  <span className="text-sm font-medium">Deleting your account…</span>
                </div>
              )}

              {stage === "done" && (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-2xl">
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-[#21121f] mb-2">Your account has been deleted</h2>
                  <p className="text-slate-600 text-sm">
                    Your personal data and associated learning records have been permanently removed. Thank
                    you for being part of CoachPlus Academy.
                  </p>
                </div>
              )}

              {error && stage === "otp" && !busy && (
                <div className="mt-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Having trouble? Contact us at{" "}
              <a href="mailto:privacy@coachplusacademy.com" className="text-[#E91E63] hover:underline">
                privacy@coachplusacademy.com
              </a>{" "}
              or read our{" "}
              <Link href="/privacy-policy" className="text-[#E91E63] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

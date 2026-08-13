"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock, FiCheck, FiArrowRight, FiArrowLeft } from "react-icons/fi";

import Link from "next/link";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This invitation link is invalid.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        const role = data.role;
        router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student");
        router.refresh();
      } else {
        setError(data.message || "Failed to accept invitation. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#E91E63]/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[450px]"
      >
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-10">
              <Link
                href="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
              >
                <FiArrowLeft className="size-4" />
                Back Home
              </Link>
              <div className="relative group mb-6">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                <img
                  src="/logo.png"
                  alt="Coach Plus"
                  className="relative size-16 rounded-2xl object-contain shadow-sm"
                />
              </div>
              <h1 className="text-3xl font-bold text-[#21121f]">Accept Your Invitation</h1>
              <p className="text-slate-500 mt-2">
                Welcome to Coach Plus! Create a password to activate your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiCheck className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E91E63] text-white rounded-2xl py-4 font-bold shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] hover:shadow-[#E91E63]/35 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Activate Account
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

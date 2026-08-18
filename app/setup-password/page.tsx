"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock, FiCheck, FiArrowRight, FiArrowLeft, FiEye, FiEyeOff, FiShield, FiCheckCircle } from "react-icons/fi";

import Link from "next/link";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      const res = await fetch("/api/setup-password", {
        method: "POST",
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const role = data.role;
        router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student");
        router.refresh();
      } else {
        setError("Failed to set password. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0F172A] flex items-center justify-center p-4 sm:p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] size-[550px] rounded-full bg-[#E91E63]/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[500px] rounded-full bg-[#7B1FA2]/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/5 via-transparent to-[#E91E63]/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white rounded-[40px] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8 sm:p-12">
            <Link
              href="/"
              className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
            >
              <FiArrowLeft className="size-4" />
              Back Home
            </Link>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="relative group mb-6">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                <img
                  src="/logo.png"
                  alt="CoachPlus Academy"
                  className="relative size-16 rounded-2xl object-contain shadow-sm"
                />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E91E63]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#E91E63]">
                <FiShield className="size-3" />
                First Time Login
              </span>
              <h1 className="text-3xl font-bold text-[#21121f] tracking-tight mt-4">Secure Your Account</h1>
              <p className="text-slate-500 mt-2">
                Since this is your first time logging in, please create a new secure password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#E91E63] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiCheck className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#E91E63] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirm ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
                  </button>
                </div>
              </div>

              {password && (
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${password.length >= 6 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <FiCheckCircle className="size-3" /> 6+ characters
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${password === confirmPassword && confirmPassword ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <FiCheckCircle className="size-3" /> Passwords match
                  </span>
                </div>
              )}

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
                className="group w-full bg-[#E91E63] text-white rounded-2xl py-4 font-bold shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] hover:shadow-[#E91E63]/35 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Save & Continue
                    <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
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
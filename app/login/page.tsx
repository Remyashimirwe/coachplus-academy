"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

const roles = [
  { id: "STUDENT", label: "Student", icon: FiUser, color: "bg-blue-500" },
  { id: "TEACHER", label: "Teacher", icon: FiUser, color: "bg-purple-500" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFirstLogin) {
          router.push("/setup-password");
        } else {
          router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student");
        }
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Invalid credentials");
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
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
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                <img
                  src="/logo.png"
                  alt="Coach Plus"
                  className="relative size-16 rounded-2xl object-contain shadow-sm mb-6"
                />
              </div>
              <h1 className="text-3xl font-bold text-[#21121f]">Welcome Back</h1>
              <p className="text-slate-500 mt-2">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 ${
                      role === r.id
                        ? "bg-white text-[#E91E63] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <r.icon className={`size-4 ${role === r.id ? "text-[#E91E63]" : ""}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-slate-700">Password</label>
                  </div>
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
                    Sign In
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50/50 p-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              {role === "ADMIN" 
                ? "Restricted access area. Unauthorized access is prohibited."
                : "Need an account? Contact your administrator."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

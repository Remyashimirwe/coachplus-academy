"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";
import Link from "next/link";
import OtpStep from "@/app/components/OtpStep";

const roles = [
  { id: "STUDENT", label: "Student", icon: FiBookOpen, activeBg: "bg-blue-600", glow: "shadow-blue-500/30" },
  { id: "TEACHER", label: "Teacher", icon: FiAward, activeBg: "bg-[#7B1FA2]", glow: "shadow-[#7B1FA2]/30" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // After a correct password the server demands a 6-digit code on every
  // sign-in, so the form hands over to an OTP step rather than redirecting.
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const router = useRouter();

  const destination = () =>
    role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student";

  const finishLogin = ({ isFirstLogin }: { isFirstLogin: boolean }) => {
    router.push(isFirstLogin ? "/setup-password" : destination());
    router.refresh();
  };

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
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      if (data.requiresVerification) {
        setPendingEmail(data.email || email);
        setStage("otp");
        return;
      }

      // No code was required (the anti-lockout path: the email could not be
      // sent), so the session is already established.
      finishLogin({ isFirstLogin: data.isFirstLogin === true });
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#FF5733]/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/5 via-transparent to-[#E91E63]/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-[36px] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8 sm:p-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
            >
              <FiArrowLeft className="size-4" />
              Back Home
            </Link>

            {stage === "credentials" && (
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative group mb-5">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                  <img
                    src="/logo.png"
                    alt="CoachPlus Academy"
                    className="relative size-16 rounded-2xl object-contain shadow-sm"
                  />
                </div>
                <h1 className="text-2xl font-bold text-[#21121f] tracking-tight">Welcome back</h1>
                <p className="text-slate-500 mt-1 text-sm">Sign in to continue your learning journey</p>
              </div>
            )}

            {stage === "otp" ? (
              <OtpStep
                email={pendingEmail}
                role={role}
                onVerified={finishLogin}
                onBack={() => {
                  setStage("credentials");
                  setError("");
                }}
              />
            ) : (
              <>
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              {roles.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3.5 transition-all duration-300 ${
                      isActive
                        ? "border-[#E91E63] bg-rose-50/60 shadow-md shadow-rose-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-all ${
                        isActive ? r.activeBg : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <r.icon className="size-4" />
                    </div>
                    <span className={`text-sm font-bold ${isActive ? "text-[#21121f]" : "text-slate-600"}`}>
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
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

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
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
                    Sign In
                    <FiArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
              </>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
              <p className="text-xs text-slate-500">
                {role === "ADMIN"
                  ? "Restricted access area. Unauthorized access is prohibited."
                  : "Need an account? Contact your administrator to get invited."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
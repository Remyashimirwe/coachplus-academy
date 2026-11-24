"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import OtpStep from "@/app/components/OtpStep";

/**
 * Password reset, in three steps:
 *
 *   1. ask for the address and email a code,
 *   2. confirm the code (this only proves control of the inbox — no session
 *      is created here),
 *   3. choose the new password.
 *
 * Steps 2 and 3 are separate on purpose. Resetting a password must never sign
 * someone in, and the code is only consumed by step 3, so abandoning the flow
 * at the password screen leaves the account exactly as it was.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [stage, setStage] = useState<"email" | "otp" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "We couldn't send the reset code. Please try again.");
        return;
      }
      setStage("otp");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "We couldn't reset your password. Please try again.");
        return;
      }
      setStage("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-5 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] size-[550px] rounded-full bg-[#E91E63]/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[500px] rounded-full bg-[#7B1FA2]/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/5 via-transparent to-[#E91E63]/5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[36px] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8 sm:p-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
            >
              <FiArrowLeft className="size-4" />
              Back to sign in
            </Link>

            {stage === "done" ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FiCheckCircle className="size-7" />
                </div>
                <h1 className="text-2xl font-bold text-[#21121f] tracking-tight">
                  Password updated
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Your password has been changed. Sign in with your new password to continue.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#E91E63] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] transition-all"
                >
                  Go to sign in
                  <FiArrowRight className="size-4" />
                </button>
              </div>
            ) : stage === "otp" ? (
              <OtpStep
                email={email}
                purpose="password_reset"
                onVerified={(info) => {
                  setCode(info.code);
                  setStage("password");
                }}
                onBack={() => setStage("email")}
              />
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative group mb-5">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                    <Image
                      src="/logo.png"
                      alt="CoachPlus Academy"
                      width={64}
                      height={64}
                      sizes="64px"
                      className="relative size-16 rounded-2xl object-contain shadow-sm"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-[#21121f] tracking-tight">
                    {stage === "email" ? "Reset your password" : "Choose a new password"}
                  </h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    {stage === "email"
                      ? "We'll email you a 6-digit code to confirm it's you"
                      : `Enter a new password for ${email}`}
                  </p>
                </div>

                {stage === "email" ? (
                  <form onSubmit={requestCode} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
                      >
                        Email
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FiMail className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                          placeholder="you@example.com"
                        />
                      </div>
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
                        <>
                          Send reset code
                          <FiArrowRight className="size-5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={savePassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="new-password"
                        className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
                      >
                        New password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FiLock className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                        </div>
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#E91E63] transition-colors"
                        >
                          {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="confirm-password"
                        className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
                      >
                        Confirm new password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FiLock className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                        </div>
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                        />
                      </div>
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
                        <>
                          Save new password
                          <FiArrowRight className="size-5" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStage("email");
                        setPassword("");
                        setConfirm("");
                      }}
                      className="w-full text-center text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
                    >
                      Use a different email
                    </button>
                  </form>
                )}

                <p className="mt-6 text-center text-sm text-slate-500">
                  Remembered it?{" "}
                  <Link href="/login" className="font-semibold text-[#E91E63]">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

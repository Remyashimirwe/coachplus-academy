"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiArrowLeft, FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import { login, type LoginState } from "@/app/actions/auth";
import OtpStep from "@/app/components/OtpStep";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // The server action answers `requiresVerification` instead of creating a
  // session, so the form hands over to the OTP step. Kept in local state so
  // "Change email" can return to the form without a full page reload.
  const [showOtp, setShowOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  useEffect(() => {
    if (state?.requiresVerification && state.email) {
      setOtpEmail(state.email);
      setShowOtp(true);
    }
  }, [state]);

  const finishLogin = ({ isFirstLogin }: { isFirstLogin: boolean }) => {
    router.push(isFirstLogin ? "/setup-password" : "/admin");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F172A] px-5 py-10">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] size-[550px] rounded-full bg-[#E91E63]/15 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] size-[500px] rounded-full bg-[#7B1FA2]/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#FF5733]/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5733]/5 via-transparent to-[#E91E63]/5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative bg-white rounded-[36px] shadow-2xl shadow-black/40 overflow-hidden">
            <div className="p-8 sm:p-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
              >
                <FiArrowLeft className="size-4" />
                Back Home
              </Link>

              {!showOtp && (
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative group mb-5">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                    <Image
                      src="/logo.svg"
                      alt="CoachPlus Academy"
                      width={64}
                      height={64}
                      unoptimized
                      sizes="64px"
                      className="relative size-16 rounded-2xl object-contain shadow-sm"
                    />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#21121f] tracking-tight">Admin Portal</h2>
                  <p className="text-slate-500 mt-1 text-sm">Secure access to the management dashboard</p>
                </div>
              )}

              {showOtp ? (
                <OtpStep
                  email={otpEmail}
                  role="ADMIN"
                  onVerified={finishLogin}
                  onBack={() => setShowOtp(false)}
                />
              ) : (
                <>
              {state?.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100"
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">!</span>
                  {state.error}
                </motion.div>
              )}

              <form action={formAction} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="admin@coachplusacademy.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
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
                  <p className="ml-1 text-[11px] leading-5 text-slate-500">
                    First time here? Leave this blank. We’ll send a code so you can set your password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF5733] via-[#E91E63] to-[#D81B60] py-4 font-semibold text-white shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/40 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                >
                  {pending ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue
                      <FiArrowLeft className="size-5 rotate-180 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

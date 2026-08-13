"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiLock, FiMail, FiLogIn, FiArrowLeft } from "react-icons/fi";
import { motion } from "framer-motion";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#E91E63]/5 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-[450px]">
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
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
              <p className="text-slate-500 mt-2">Secure access to management dashboard</p>
            </div>

            {state?.error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100"
              >
                {state.error}
              </motion.div>
            )}

            <form action={formAction}>
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-bold text-slate-700 ml-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-slate-700 ml-1"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-8 bg-[#E91E63] text-white rounded-2xl py-4 font-bold shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] hover:shadow-[#E91E63]/35 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pending ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiLogIn className="size-5" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>
          </div>
          <div className="bg-slate-50/50 p-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Restricted access area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

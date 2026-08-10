"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiLock, FiMail, FiLogIn } from "react-icons/fi";
import { motion } from "framer-motion";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF5733] via-[#E91E63] to-[#7B1FA2] px-5">
      <div className="absolute -left-32 top-20 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#7B1FA2]/30 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-xl border border-white/20">
            <img
              src="/logo.png"
              alt="Wecoach Academy"
              className="size-10 object-contain"
            />
            <span className="pr-2 text-xl font-bold tracking-tight text-white">Wecoach Academy</span>
          </div>
        </Link>

        <div className="rounded-[32px] border border-white/20 bg-white/95 p-8 shadow-[0_32px_80px_rgba(233,30,99,0.2)] backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Admin Access
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-slate-500">
            Securely sign in to your dashboard.
          </p>

          {state?.error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100"
            >
              {state.error}
            </motion.p>
          )}

          <form action={formAction} className="mt-8 flex flex-col gap-6">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Email Address
              </label>
              <div className="relative mt-2">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@wecouch.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-widest text-slate-400"
                >
                  Password
                </label>
              </div>
              <div className="relative mt-2">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="group relative mt-2 inline-flex min-h-[56px] items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-0 transition-opacity group-hover:opacity-100" />
              <FiLogIn className="relative z-10 size-5" />
              <span className="relative z-10">{pending ? "Authenticating..." : "Sign In to Dashboard"}</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

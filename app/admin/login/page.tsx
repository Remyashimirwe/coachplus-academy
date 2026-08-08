"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiLock, FiMail, FiLogIn } from "react-icons/fi";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#1266f1] via-[#1a6ff3] to-[#4f8cff] px-5">
      <div className="absolute -left-32 top-20 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#0b52d0]/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <img
            src="/logo.png"
            alt="WeCoach"
            className="size-12 rounded-2xl object-contain shadow-lg"
          />
        </Link>

        <div className="rounded-[24px] bg-white p-8 shadow-[0_32px_80px_rgba(3,24,69,0.28)] sm:p-10">
          <h1 className="text-center text-3xl font-medium tracking-tight">
            Admin Login
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-slate-500">
            Sign in to manage programs and teacher requests.
          </p>

          {state?.error && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
              {state.error}
            </p>
          )}

          <form action={formAction} className="mt-6 flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="relative mt-2">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@wecouch.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-2">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-8 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiLogIn className="size-4" />
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Default credentials: admin@wecouch.com / admin123
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBookOpen,
  FiAward,
  FiMail,
  FiLock,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";
import OtpStep from "@/app/components/OtpStep";
import { t, useSiteLocale } from "@/app/lib/site-i18n";

const ROLES = [
  { id: "STUDENT", label: "Student", icon: FiBookOpen },
  { id: "TEACHER", label: "Teacher", icon: FiAward },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export default function RegisterPage() {
  const locale = useSiteLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<RoleId>("STUDENT");
  const [agreed, setAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // `form` → `otp` for students (verify the address they signed up with);
  // `form` → `submitted` for teachers, who get no account until an admin
  // approves the application.
  const [stage, setStage] = useState<"form" | "otp" | "submitted">("form");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t(locale, "Passwords do not match."));
      return;
    }
    if (password.length < 8) {
      setError(t(locale, "Password must be at least 8 characters."));
      return;
    }
    if (!agreed) {
      setError(t(locale, "Please accept the terms to continue."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, agreedToTerms: agreed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(t(locale, data.error || "Couldn't create your account. Please try again."));
        return;
      }

      if (data.requiresApproval) {
        setStage("submitted");
        return;
      }

      // An account exists and a code is on its way — verify it to sign in.
      setStage("otp");
    } catch {
      setError(t(locale, "Couldn't reach the server. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }

  function finishLogin() {
    router.push(role === "TEACHER" ? "/teacher" : "/student");
    router.refresh();
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
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
            >
              <FiArrowLeft className="size-4" />
              {t(locale, "Back Home")}
            </Link>

            {stage === "submitted" ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FiCheckCircle className="size-7" />
                </div>
                <h1 className="text-2xl font-bold text-[#21121f] tracking-tight">
                  {t(locale, "Application received")}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {t(locale, "Thanks ")}{name.split(" ")[0] || t(locale, "there")}{t(locale, " — our team will review your teaching application and email you once a decision is made. There is no account to sign into yet.")}
                </p>
                <Link
                  href="/"
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#E91E63] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] transition-all"
                >
                  {t(locale, "Back Home")}
                  <FiArrowRight className="size-4" />
                </Link>
              </div>
            ) : stage === "otp" ? (
              <OtpStep
                email={email}
                purpose="register"
                role={role}
                onVerified={finishLogin}
                onBack={() => setStage("form")}
              />
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative group mb-5">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] opacity-20 blur transition duration-300 group-hover:opacity-40" />
                    <img
                      src="/logo.png"
                      alt="CoachPlus Academy"
                      className="relative size-16 rounded-2xl object-contain shadow-sm"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-[#21121f] tracking-tight">
                    {t(locale, "Create your account")}
                  </h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    {t(locale, "Join CoachPlus Academy in a couple of minutes")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => {
                      const isActive = role === r.id;
                      const Icon = r.icon;
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
                          <Icon
                            className={`size-4 ${isActive ? "text-[#E91E63]" : "text-slate-400"}`}
                          />
                          <span
                            className={`text-sm font-semibold ${
                              isActive ? "text-[#E91E63]" : "text-slate-600"
                            }`}
                          >
                            {t(locale, r.label)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {role === "TEACHER" && (
                    <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
                      {t(locale, "Teaching applications are reviewed by our team before an account is created, so you will receive an email once you are approved.")}
                    </p>
                  )}

                  <Input
                    id="name"
                    label="Full name"
                    icon={FiUser}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    id="email"
                    label="Email"
                    icon={FiMail}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    id="password"
                    label="Password"
                    icon={FiLock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={t(locale, showPassword ? "Hide password" : "Show password")}
                        className="text-slate-400 hover:text-[#E91E63] transition-colors"
                      >
                        {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                      </button>
                    }
                  />
                  <Input
                    id="confirm"
                    label="Confirm password"
                    icon={FiLock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />

                  <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-500">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-[#E91E63]"
                    />
                    <span>
                      {t(locale, "I agree to the ")}{" "}
                      <Link href="/terms-of-service" className="font-semibold text-[#E91E63]">
                        {t(locale, "Terms of Service")}
                      </Link>{" "}
                      {t(locale, " and ")}{" "}
                      <Link href="/privacy-policy" className="font-semibold text-[#E91E63]">
                        {t(locale, "Privacy Policy")}
                      </Link>
                      .
                    </span>
                  </label>

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
                        {t(locale, "Create account")}
                        <FiArrowRight className="size-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  {t(locale, "Already have an account?")}{" "}
                  <Link href="/login" className="font-semibold text-[#E91E63]">
                    {t(locale, "Sign in")}
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

function Input({
  id,
  label,
  icon: Icon,
  trailing,
  ...props
}: {
  id: string;
  label: string;
  icon: typeof FiMail;
  trailing?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
        {t(useSiteLocale(), label)}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
        </div>
        <input
          id={id}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{trailing}</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiMail, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";
import { VERIFICATION_RESEND_COOLDOWN_SECONDS } from "@/app/lib/verification-constants";
import { t, useSiteLocale } from "@/app/lib/site-i18n";

type Props = {
  /** The address the code was sent to — shown so the user knows where to look. */
  email: string;
  /** Portal the user is signing into; re-checked server-side when supplied. */
  role?: string;
  /**
   * Which flow this code belongs to.
   *
   * `login` and `register` both end with a session; `password_reset` only
   * proves control of the inbox and hands off to the new-password step, so no
   * cookie is created for it.
   */
  purpose?: "login" | "register" | "password_reset";
  /** Called once the code is accepted. The code itself is echoed back because
   *  the password-reset flow redeems it on the following screen. */
  onVerified: (info: { isFirstLogin: boolean; code: string }) => void;
  /** Lets the user go back and correct their email or password. */
  onBack: () => void;
};

/**
 * The 6-digit code step shared by the student/teacher sign-in page, the admin
 * sign-in page, self sign-up and password reset.
 *
 * Every flow that emails a code lands here instead of growing a second, subtly
 * different copy of the same screen. The countdown before "Resend" is mirrored
 * by a server-side cooldown, so the link cannot be used to flood an inbox even
 * if the UI is bypassed.
 */
export default function OtpStep({ email, role, purpose = "login", onVerified, onBack }: Props) {
  const locale = useSiteLocale();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(VERIFICATION_RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the box as soon as the step appears so the user can just type.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = code.trim();
      if (trimmed.length !== 6) {
        setError(t(locale, "Enter the full 6-digit code."));
        return;
      }
      setError("");
      setVerifying(true);
      try {
        const res = await fetch("/api/auth/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: trimmed, role, type: purpose }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(t(locale, data.error || "That code didn't work. Please try again."));
          setVerifying(false);
          return;
        }
        onVerified({ isFirstLogin: data.isFirstLogin === true, code: trimmed });
      } catch {
        setError(t(locale, "Something went wrong. Please try again."));
        setVerifying(false);
      }
    },
    [code, email, role, purpose, onVerified]
  );

  const resend = useCallback(async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: purpose }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(t(locale, data.error || "We couldn't resend the code. Please try again in a moment."));
      } else {
        setInfo(t(locale, "A new code is on its way."));
        setCooldown(VERIFICATION_RESEND_COOLDOWN_SECONDS);
        setCode("");
        inputRef.current?.focus();
      }
    } catch {
      setError(t(locale, "Something went wrong. Please try again."));
    } finally {
      setResending(false);
    }
  }, [cooldown, resending, email, purpose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center text-center mb-7">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#E91E63]/10 text-[#E91E63]">
          <FiShield className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-[#21121f] tracking-tight">{t(locale, "Enter your code")}</h2>
        <p className="text-slate-500 mt-1.5 text-sm">
          {t(locale, "We sent a 6-digit code to")}
          <br />
          <span className="font-semibold text-slate-700 break-all">{email}</span>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="otp"
            className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1"
          >
            {t(locale, "Verification Code")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiMail className="size-4 text-slate-400 group-focus-within:text-[#E91E63] transition-colors" />
            </div>
            <input
              id="otp"
              ref={inputRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-center text-slate-900 tracking-[0.5em] font-bold text-lg placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
              placeholder="000000"
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100"
          >
            {error}
          </motion.div>
        )}

        {info && (
          <div className="text-sm text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="group w-full bg-[#E91E63] text-white rounded-2xl py-4 font-bold shadow-lg shadow-[#E91E63]/25 hover:bg-[#D81B60] hover:shadow-[#E91E63]/35 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {verifying ? (
            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : purpose === "password_reset" ? (
            t(locale, "Verify code")
          ) : (
            t(locale, "Verify & Sign In")
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-[#E91E63] transition-colors"
        >
          <FiArrowLeft className="size-4" />
          {t(locale, "Change email")}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="font-semibold text-[#E91E63] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {resending
            ? t(locale, "Sending…")
            : cooldown > 0
            ? `${t(locale, "Resend code in ")}${cooldown}${t(locale, "s")}`
            : t(locale, "Resend code")}
        </button>
      </div>
    </motion.div>
  );
}

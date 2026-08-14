"use client";

import { useState } from "react";
import {
  FiUserPlus,
  FiMail,
  FiUser,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiCopy,
  FiCheck,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";

export default function AddUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string; inviteUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, role }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          text:
            data.message ||
            "Invitation sent successfully. They'll receive an email to set up their own password.",
          inviteUrl: data.inviteUrl,
        });
        setName("");
        setEmail("");
      } else {
        setResult({ success: false, text: data.message || "Failed to invite user" });
      }
    } catch (err) {
      setResult({ success: false, text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  function copyLink() {
    if (!result?.inviteUrl) return;
    navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invite New Teacher or Student</h1>
        <p className="text-slate-500">
          Send a direct invitation so they can log in and set up their own password to access their dashboard.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[28px] bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Invite as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                    role === "STUDENT"
                      ? "border-[#E91E63] bg-rose-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                      role === "STUDENT" ? "bg-[#E91E63] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <FiBookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Student</p>
                    <p className="text-xs text-slate-500">Access their learning dashboard</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                    role === "TEACHER"
                      ? "border-indigo-500 bg-indigo-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                      role === "TEACHER" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <FiAward className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Teacher</p>
                    <p className="text-xs text-slate-500">Access their teaching dashboard</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                  />
                </div>
              </div>
            </div>

            {result && (
              <div
                className={`rounded-2xl p-4 border space-y-3 ${
                  result.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-rose-50 border-rose-100 text-rose-600"
                }`}
              >
                <p className="text-sm font-bold flex items-start gap-2">
                  {result.success ? (
                    <FiCheckCircle className="mt-0.5 shrink-0" />
                  ) : (
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                  )}
                  {result.text}
                </p>
                {result.inviteUrl && (
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 p-2 pl-3">
                    <span className="text-xs text-slate-500 truncate flex-1">{result.inviteUrl}</span>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all"
                    >
                      {copied ? <FiCheck className="size-3.5" /> : <FiCopy className="size-3.5" />}
                      {copied ? "Copied" : "Copy Link"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <FiLoader className="size-4 animate-spin" /> : <FiSend className="size-4" />}
              {loading ? "Sending Invitation..." : "Send Invitation"}
            </button>
          </form>
        </div>

        <div className="rounded-[28px] bg-[#0f172a] text-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <FiUserPlus className="size-6 text-[#E91E63]" />
          </div>
          <h3 className="text-lg font-bold">How invitations work</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">1</span>
              <span>The invitee receives an email with a secure activation link.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">2</span>
              <span>Since they're new, they'll choose their own new password the first time they sign in.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">3</span>
              <span>Once activated, they land straight on their own Teacher or Student dashboard.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">4</span>
              <span>The link expires after 7 days &mdash; simply resend it here if needed.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

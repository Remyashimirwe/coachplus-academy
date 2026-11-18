"use client";

import { FormEvent, useState } from "react";
import {
  FiAward,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
  FiFlag,
  FiMail,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

type StageState = "done" | "current" | "action" | "upcoming" | "failed";

type LookupResult = {
  found: boolean;
  firstName: string;
  fullName: string;
  subjects: string;
  status: string;
  appliedAt: string;
  matched: boolean;
};

const STATUS_META: Record<
  string,
  { label: string; className: string; message: string }
> = {
  pending: {
    label: "In review",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    message:
      "Our academic and compliance team is reviewing your application and documents.",
  },
  documents_needed: {
    label: "Action needed",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    message:
      "We need a clearer copy of one of your documents. Check your inbox for the upload link.",
  },
  shortlisted: {
    label: "Shortlisted",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    message:
      "You passed the document review. We will confirm your exam and demo lesson date.",
  },
  assessment_scheduled: {
    label: "Assessment scheduled",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    message:
      "Your subject exam and 10-minute demo lesson date has been confirmed by email.",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    message:
      "Welcome aboard! Your teacher profile is live and ready for student matches.",
  },
  rejected: {
    label: "Not selected",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    message:
      "We could not move forward this time. Thank you for applying to CoachPlus Academy.",
  },
};

const STAGES = [
  {
    title: "Application received",
    description: "Your details, credentials and documents are with us.",
    icon: FiFileText,
  },
  {
    title: "Document review",
    description: "We verify your ID, certificates and references.",
    icon: FiSearch,
  },
  {
    title: "Shortlisted",
    description: "You pass the review and move to the assessment stage.",
    icon: FiFlag,
  },
  {
    title: "Exam & demo lesson",
    description: "A short subject exam plus a 10-minute demo lesson.",
    icon: FiCalendar,
  },
  {
    title: "Final decision",
    description: "Approved to teach, or a polite not-selected notice.",
    icon: FiAward,
  },
  {
    title: "First student match",
    description: "We match you with a student and email the class details.",
    icon: FiUsers,
  },
];

function stageStates(status: string, matched: boolean): StageState[] {
  switch (status) {
    case "documents_needed":
      return ["done", "action", "upcoming", "upcoming", "upcoming", "upcoming"];
    case "shortlisted":
      return ["done", "done", "done", "current", "upcoming", "upcoming"];
    case "assessment_scheduled":
      return ["done", "done", "done", "current", "upcoming", "upcoming"];
    case "approved":
      return ["done", "done", "done", "done", "done", matched ? "done" : "current"];
    case "rejected":
      return ["done", "done", "upcoming", "upcoming", "failed", "upcoming"];
    case "pending":
    default:
      return ["done", "current", "upcoming", "upcoming", "upcoming", "upcoming"];
  }
}

const CIRCLE_STYLES: Record<StageState, string> = {
  done: "border-emerald-400 bg-emerald-500 text-white shadow-emerald-200",
  current:
    "border-transparent bg-gradient-to-br from-[#E91E63] to-[#7B1FA2] text-white shadow-pink-200",
  action: "border-orange-300 bg-orange-100 text-orange-600 shadow-orange-100",
  failed: "border-rose-300 bg-rose-100 text-rose-600 shadow-rose-100",
  upcoming: "border-slate-200 bg-slate-50 text-slate-400",
};

const LINE_STYLES: Record<StageState, string> = {
  done: "bg-emerald-200",
  current: "bg-gradient-to-b from-[#E91E63]/40 to-slate-200",
  action: "bg-orange-200",
  failed: "bg-rose-200",
  upcoming: "bg-slate-200",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationStatusLookup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email address you used on your application.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/teacher-applications/status?email=${encodeURIComponent(trimmed)}`,
      );
      const data = await response.json();

      if (response.status === 404) {
        setError(
          "We could not find an application for that email. Check the spelling, or apply at /become-a-teacher.",
        );
        return;
      }
      if (!response.ok) {
        setError(data.message || "We could not check your status. Please try again.");
        return;
      }
      setResult(data as LookupResult);
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? STATUS_META[result.status] ?? STATUS_META.pending : null;
  const states = result ? stageStates(result.status, result.matched) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#7B1FA2] text-white shadow-lg shadow-pink-200">
            <FiMail className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Check your application
            </h2>
            <p className="text-xs text-slate-500">
              Use the email address you entered on the teacher application.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiMail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#E91E63] focus:ring-4 focus:ring-[#E91E63]/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#7B1FA2] px-7 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiSearch className="size-4" />
            {loading ? "Checking..." : "Check status"}
          </button>
        </form>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <FiX className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && meta && (
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#7B1FA2] text-lg font-bold text-white">
                {result.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {result.fullName}
                </p>
                <p className="text-xs text-slate-500">{result.subjects}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.className}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {meta.label}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {meta.message}
          </p>

          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <FiClock className="size-3.5" />
            Applied on {formatDate(result.appliedAt)}
          </p>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Your journey
            </h3>

            <div className="mt-6">
              {STAGES.map((stage, index) => {
                const state = states[index];
                const Icon = stage.icon;
                const isLast = index === STAGES.length - 1;
                return (
                  <div key={stage.title} className="relative pb-8 pl-14 last:pb-0">
                    {!isLast && (
                      <span
                        className={`absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px ${LINE_STYLES[state]}`}
                      />
                    )}
                    <span
                      className={`absolute left-0 top-0 flex size-10 items-center justify-center rounded-2xl border shadow-lg shadow-slate-100 transition-transform ${
                        state === "current" ? "scale-105" : ""
                      } ${CIRCLE_STYLES[state]}`}
                    >
                      {state === "done" ? (
                        <FiCheck className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            state === "upcoming" ? "text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {stage.title}
                        </p>
                        {state === "action" && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                            Action needed
                          </span>
                        )}
                        {state === "current" && (
                          <span className="rounded-full bg-[#E91E63]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#E91E63]">
                            In progress
                          </span>
                        )}
                        {state === "failed" && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                            Closed
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          state === "upcoming" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-8 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Every stage also lands in your inbox. If a step looks stuck for more
            than 5 business days, reply to any CoachPlus email or message us on
            WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}

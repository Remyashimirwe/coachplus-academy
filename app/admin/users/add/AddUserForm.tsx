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
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiMonitor,
} from "react-icons/fi";

const learningModes = ["Home Coaching", "Online Coaching", "Coaching Center"];
const daysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Program {
  id: number;
  title: string;
  subjects: { id: number; name: string }[];
}

export default function AddUserForm({ programs }: { programs: Program[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [programTitle, setProgramTitle] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [learningMode, setLearningMode] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, { from: string; to: string }>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string; inviteUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const availableSubjects =
    programTitle === "" ? [] : programs.find((p) => p.title === programTitle)?.subjects || [];

  const toggleSubject = (s: string) => {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        setDayTimes((dt) => {
          const copy = { ...dt };
          delete copy[day];
          return copy;
        });
        return prev.filter((d) => d !== day);
      }
      setDayTimes((dt) => ({ ...dt, [day]: dt[day] || { from: "", to: "" } }));
      return [...prev, day];
    });
  };

  const updateDayTime = (day: string, field: "from" | "to", value: string) => {
    setDayTimes((prev) => ({ ...prev, [day]: { ...(prev[day] || { from: "", to: "" }), [field]: value } }));
  };

  const preferredDays = selectedDays.join(", ");
  const preferredTime = selectedDays
    .map((d) => `${d}: ${dayTimes[d]?.from || ""} - ${dayTimes[d]?.to || ""}`)
    .join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          role,
          ...(role === "STUDENT"
            ? { branch, phone, programTitle, subjects: subjects.join(", "), learningMode, preferredDays, preferredTime }
            : {}),
        }),
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
        setBranch("");
        setPhone("");
        setProgramTitle("");
        setSubjects([]);
        setLearningMode("");
        setSelectedDays([]);
        setDayTimes({});
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

            {role === "STUDENT" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Location / Branch</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Kigali-Remera"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +250 788 000 000"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Program / Category</label>
                  <select
                    value={programTitle}
                    onChange={(e) => {
                      setProgramTitle(e.target.value);
                      setSubjects([]);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                  >
                    <option value="">Select a program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {programTitle && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSubjects.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSubject(s.name)}
                          className={`rounded-xl px-4 py-2 text-xs font-medium transition-all border-2 ${
                            subjects.includes(s.name)
                              ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                              : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Learning Mode</label>
                  <div className="flex flex-wrap gap-2">
                    {learningModes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setLearningMode(m)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all border-2 ${
                          learningMode === m
                            ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                            : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                        }`}
                      >
                        <FiMonitor className="size-3.5" />
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Preferred Days &amp; Time</label>
                  <div className="flex flex-wrap gap-2">
                    {daysList.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded-xl px-4 py-2 text-xs font-medium transition-all border-2 ${
                          selectedDays.includes(d)
                            ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-200"
                            : "bg-white border-slate-100 text-slate-600 hover:border-[#E91E63]/30"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {selectedDays.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedDays.map((d) => (
                        <div key={d} className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
                          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                            <FiCalendar className="text-[#E91E63]" />
                            {d}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">From</label>
                              <input
                                type="time"
                                value={dayTimes[d]?.from || ""}
                                onChange={(e) => updateDayTime(d, "from", e.target.value)}
                                className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">To</label>
                              <input
                                type="time"
                                value={dayTimes[d]?.to || ""}
                                onChange={(e) => updateDayTime(d, "to", e.target.value)}
                                className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

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
            <li className="flex gap-3">
              <span className="shrink-0 size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">5</span>
              <span>For students, the preferences you enter here (program, subjects, location, learning mode, preferred days &amp; time) appear on the assigned teacher's "My Students" profile.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
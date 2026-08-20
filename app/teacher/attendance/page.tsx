"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiLoader,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiUser,
  FiBriefcase,
  FiLock,
  FiX,
  FiSearch,
  FiMail,
  FiBookOpen,
  FiClock,
  FiMapPin,
  FiMonitor,
} from "react-icons/fi";
import {
  dayNameFromDate,
  isPreferredDay,
  parseLocalISODate,
  timeSlotForDay,
  toISODate,
  weekRange,
} from "@/app/lib/schedule";

interface StudentRow {
  id: number;
  user: { name: string; email: string };
  program?: string;
  subjects?: string;
  preferredDays?: string;
  preferredTime?: string;
  learningMode?: string;
  branch?: string;
}

interface AttendanceRow {
  id: number;
  status: string;
  remarks: string | null;
  timeUsed: string | null;
  date: string;
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: FiCheckCircle, activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25" },
  { value: "ABSENT", label: "Absent", icon: FiXCircle, activeClass: "bg-rose-500 text-white border-rose-500 shadow-rose-500/25" },
] as const;

function todayISO() {
  return toISODate(new Date());
}

function parseTimeUsed(value?: string | null): { from: string; to: string } {
  if (!value) return { from: "", to: "" };
  const match = value.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (match) return { from: match[1], to: match[2] };
  return { from: value, to: "" };
}

function combineTime(from: string, to: string): string {
  const f = from.trim();
  const t = to.trim();
  return f && t ? `${f} - ${t}` : "";
}

interface DaySchedule {
  iso: string;
  date: Date;
  expected: { time: string; names: string[] }[];
}

function deviates(day: DaySchedule, status: string): boolean {
  const expected = day.expected.length > 0;
  return (expected && status === "ABSENT") || (!expected && status === "PRESENT");
}

function DayCard({
  day,
  mark,
  isToday,
  isPast,
  cellError,
  timeError,
  isSaving,
  isSaved,
  reasonDrafts,
  timeUsedDrafts,
  cellErrors,
  timeErrors,
  setReasonDrafts,
  setTimeUsedDrafts,
  setCellErrors,
  setTimeErrors,
  handleMark,
  focusedStudent,
}: {
  day: DaySchedule;
  mark?: AttendanceRow;
  isToday: boolean;
  isPast: boolean;
  cellError?: string;
  timeError?: string;
  isSaving: boolean;
  isSaved: boolean;
  reasonDrafts: Record<string, string>;
  timeUsedDrafts: Record<string, { from: string; to: string }>;
  cellErrors: Record<string, string | undefined>;
  timeErrors: Record<string, string | undefined>;
  setReasonDrafts: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  setTimeUsedDrafts: (updater: (prev: Record<string, { from: string; to: string }>) => Record<string, { from: string; to: string }>) => void;
  setCellErrors: (updater: (prev: Record<string, string | undefined>) => Record<string, string | undefined>) => void;
  setTimeErrors: (updater: (prev: Record<string, string | undefined>) => Record<string, string | undefined>) => void;
  handleMark: (day: DaySchedule, status: string) => void;
  focusedStudent?: { name: string; preferredDays?: string; preferredTime?: string };
}) {
  const key = day.iso;
  const expectedList = focusedStudent
    ? (() => {
        if (!isPreferredDay(focusedStudent.preferredDays, day.date)) {
          return [] as { time: string; names: string[] }[];
        }
        const time = timeSlotForDay(focusedStudent.preferredTime, dayNameFromDate(day.date)) || "Scheduled";
        return [{ time, names: [focusedStudent.name] }];
      })()
    : day.expected;
  const expected = expectedList.length > 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isPast
          ? "border-slate-100 bg-slate-50/60 opacity-80"
          : expected
            ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm shadow-emerald-100/50"
            : "border-slate-100 bg-white shadow-sm shadow-slate-100/50"
      } ${isToday ? "ring-2 ring-[#E91E63]/30" : ""}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className={`text-[13px] font-bold ${isToday ? "text-[#E91E63]" : "text-slate-800"}`}>
            {day.date.toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-[11px] text-slate-500">
            {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {isToday && <span className="font-semibold text-[#E91E63]"> • Today</span>}
          </p>
        </div>
        {isPast ? (
          <span className="rounded-full bg-slate-200/70 text-slate-500 text-[9px] font-semibold uppercase px-2 py-0.5 tracking-tighter flex items-center gap-1">
            <FiLock className="size-2.5" /> Finished
          </span>
        ) : expected ? (
          <span className="rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-semibold uppercase px-2 py-0.5 tracking-tighter">
            Scheduled
          </span>
        ) : null}
      </div>

      <div className="mb-3">
        {expected ? (
          <ul className="space-y-1">
            {expectedList.map((slot) => (
              <li
                key={slot.time}
                className="rounded-xl bg-white border border-emerald-100 px-2.5 py-1.5 text-[10px] shadow-sm"
              >
                <span className="font-bold text-emerald-700">{slot.time}</span>
                <span className="text-slate-300 mx-1">•</span>
                <span className="text-slate-600 font-medium">{slot.names.join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
            <FiBriefcase className="size-3" /> No student sessions scheduled
          </p>
        )}
      </div>

      {isPast ? (
        mark ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold ${
              mark.status === "PRESENT"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {mark.status === "PRESENT" ? (
              <FiCheckCircle className="size-3" />
            ) : (
              <FiXCircle className="size-3" />
            )}
            {mark.status}
            {mark.timeUsed && <span className="ml-1 font-bold">• {mark.timeUsed}</span>}
          </span>
        ) : (
          <p className="text-[10px] text-slate-400 italic">Not marked</p>
        )
      ) : (
        <>
          <div className="flex gap-2 mb-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = mark?.status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleMark(day, opt.value)}
                  disabled={isSaving}
                  title={opt.label}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-[10px] font-semibold transition-all duration-150 active:scale-95 disabled:opacity-60 ${
                    active
                      ? `${opt.activeClass} shadow-lg`
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 bg-white"
                  }`}
                >
                  {isSaving && active ? (
                    <FiLoader className="size-3.5 animate-spin" />
                  ) : isSaved && active ? (
                    <FiCheck className="size-3.5" />
                  ) : (
                    <opt.icon className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {(timeError || mark?.status === "PRESENT") && (
            <div className="mb-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">From</label>
                  <input
                    type="time"
                    value={timeUsedDrafts[key]?.from ?? parseTimeUsed(mark?.timeUsed).from}
                    onChange={(e) => {
                      setTimeUsedDrafts((prev) => ({
                        ...prev,
                        [key]: { from: e.target.value, to: timeUsedDrafts[key]?.to ?? parseTimeUsed(mark?.timeUsed).to },
                      }));
                      if (timeError) setTimeErrors((prev) => ({ ...prev, [key]: undefined }));
                    }}
                    onBlur={() => {
                      const from = timeUsedDrafts[key]?.from ?? parseTimeUsed(mark?.timeUsed).from;
                      const to = timeUsedDrafts[key]?.to ?? parseTimeUsed(mark?.timeUsed).to;
                      const used = combineTime(from, to);
                      if (mark && mark.status === "PRESENT" && used && used !== (mark.timeUsed ?? "")) {
                        handleMark(day, mark.status);
                      }
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-[10px] outline-none transition-all ${
                      timeError
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">To</label>
                  <input
                    type="time"
                    value={timeUsedDrafts[key]?.to ?? parseTimeUsed(mark?.timeUsed).to}
                    onChange={(e) => {
                      setTimeUsedDrafts((prev) => ({
                        ...prev,
                        [key]: { from: timeUsedDrafts[key]?.from ?? parseTimeUsed(mark?.timeUsed).from, to: e.target.value },
                      }));
                      if (timeError) setTimeErrors((prev) => ({ ...prev, [key]: undefined }));
                    }}
                    onBlur={() => {
                      const from = timeUsedDrafts[key]?.from ?? parseTimeUsed(mark?.timeUsed).from;
                      const to = timeUsedDrafts[key]?.to ?? parseTimeUsed(mark?.timeUsed).to;
                      const used = combineTime(from, to);
                      if (mark && mark.status === "PRESENT" && used && used !== (mark.timeUsed ?? "")) {
                        handleMark(day, mark.status);
                      }
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-[10px] outline-none transition-all ${
                      timeError
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {(cellError || (mark && deviates(day, mark.status))) && (
            <input
              type="text"
              value={reasonDrafts[key] ?? mark?.remarks ?? ""}
              onChange={(e) => {
                setReasonDrafts((prev) => ({ ...prev, [key]: e.target.value }));
                if (cellError) setCellErrors((prev) => ({ ...prev, [key]: undefined }));
              }}
              onBlur={() => {
                const reason = (reasonDrafts[key] ?? "").trim();
                if (mark && reason && reason !== (mark.remarks ?? "")) {
                  handleMark(day, mark.status);
                }
              }}
              placeholder="Reason (required)"
              className={`w-full rounded-xl border px-3 py-2 text-[10px] outline-none transition-all ${
                cellError
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
              }`}
            />
          )}

          {mark?.remarks && !deviates(day, mark.status) && (
            <p className="text-[9px] text-slate-400 italic truncate" title={mark.remarks}>
              {mark.remarks}
            </p>
          )}

          {mark?.timeUsed && mark.status !== "PRESENT" && (
            <p className="text-[9px] text-slate-400 italic truncate">
              Time used: {mark.timeUsed}
            </p>
          )}

          {timeError && (
            <p className="mt-1.5 text-[9px] font-semibold text-rose-600 flex items-center gap-1">
              <FiAlertCircle className="size-3 shrink-0" /> {timeError}
            </p>
          )}

          {cellError && (
            <p className="mt-1.5 text-[9px] font-semibold text-rose-600 flex items-center gap-1">
              <FiAlertCircle className="size-3 shrink-0" /> {cellError}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceRow>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [timeUsedDrafts, setTimeUsedDrafts] = useState<Record<string, { from: string; to: string }>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string | undefined>>({});
  const [timeErrors, setTimeErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [weekStart, setWeekStart] = useState<string>(toISODate(weekRange(new Date()).start));
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [search, setSearch] = useState("");

  const { start, end, days } = useMemo(() => weekRange(parseLocalISODate(weekStart)), [weekStart]);
  const today = todayISO();

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/teacher/students");
    const data = await res.json();
    if (Array.isArray(data)) setStudents(data);
  }, []);

  const loadMarks = useCallback(async (from: string, to: string) => {
    const res = await fetch(`/api/teacher/my-attendance?from=${from}&to=${to}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Record<string, AttendanceRow> = {};
      data.forEach((a: AttendanceRow) => {
        map[toISODate(new Date(a.date))] = a;
      });
      setMarks(map);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([loadStudents(), loadMarks(toISODate(start), toISODate(end))]);
      if (!cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.user.name.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        (s.program || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const detailRows = (s: StudentRow) => [
    { icon: FiBookOpen, label: "Program & Subjects", value: [s.program, s.subjects].filter(Boolean).join(" · ") || "Not specified", color: "text-indigo-600 bg-indigo-50" },
    { icon: FiClock, label: "Preferred Time", value: s.preferredTime || "Not specified", color: "text-rose-600 bg-rose-50" },
    { icon: FiCalendar, label: "Preferred Days", value: s.preferredDays || "Not specified", color: "text-emerald-600 bg-emerald-50" },
    { icon: FiMapPin, label: "Location", value: s.branch || "Not specified", color: "text-amber-600 bg-amber-50" },
    { icon: FiMonitor, label: "Learning Mode", value: s.learningMode || "Not specified", color: "text-violet-600 bg-violet-50" },
  ];

  const weekSchedule: DaySchedule[] = useMemo(() => {
    return days.map((day) => {
      const dayName = dayNameFromDate(day);
      const slots = new Map<string, string[]>();
      students.forEach((s) => {
        if (!isPreferredDay(s.preferredDays, day)) return;
        const time = timeSlotForDay(s.preferredTime, dayName) || "Scheduled";
        const names = slots.get(time) ?? [];
        names.push(s.user.name);
        slots.set(time, names);
      });
      return {
        iso: toISODate(day),
        date: day,
        expected: Array.from(slots.entries()).map(([time, names]) => ({ time, names })),
      };
    });
  }, [days, students]);

  const handleMark = async (day: DaySchedule, status: string) => {
    const key = day.iso;
    const reason = (reasonDrafts[key] ?? "").trim();
    const draft = timeUsedDrafts[key];
    const timeUsed = combineTime(draft?.from ?? "", draft?.to ?? "");
    const existing = marks[key];

    if (deviates(day, status) && !reason && !existing?.remarks) {
      setCellErrors((prev) => ({
        ...prev,
        [key]: day.expected.length > 0
          ? "You have student sessions scheduled this day. Please enter a reason for this mark."
          : "You have no student sessions scheduled this day. Please enter a reason for marking present.",
      }));
      return;
    }

    if (status === "PRESENT" && !timeUsed && !existing?.timeUsed) {
      setTimeErrors((prev) => ({
        ...prev,
        [key]: "Please enter the time you used before marking yourself present.",
      }));
      return;
    }

    setSaving((prev) => ({ ...prev, [key]: true }));
    setCellErrors((prev) => ({ ...prev, [key]: undefined }));
    setTimeErrors((prev) => ({ ...prev, [key]: undefined }));

    const remarks = reason || existing?.remarks || "";
    const used = timeUsed || existing?.timeUsed || "";

    try {
      const res = await fetch("/api/teacher/my-attendance", {
        method: "POST",
        body: JSON.stringify({ status, remarks, timeUsed: used, date: key }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setMarks((prev) => ({ ...prev, [key]: data.attendance }));
        setReasonDrafts((prev) => ({ ...prev, [key]: "" }));
        setTimeUsedDrafts((prev) => ({ ...prev, [key]: { from: "", to: "" } }));
        setSaved((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 1500);
      } else {
        setCellErrors((prev) => ({ ...prev, [key]: data.message || "Failed to save attendance" }));
      }
    } catch {
      setCellErrors((prev) => ({ ...prev, [key]: "Failed to save attendance" }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const weekLabel = days[0] && days[6]
    ? `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  function shiftWeek(delta: number) {
    const next = new Date(start);
    next.setDate(start.getDate() + delta * 7);
    setWeekStart(toISODate(next));
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#4a044e] p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute -top-24 -right-24 size-64 rounded-full bg-[#E91E63]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-72 rounded-full bg-[#FF5733]/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 ring-1 ring-white/15 backdrop-blur">
                <FiUser className="size-3" /> Teacher Dashboard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Student Attendance
            </h1>
            <p className="text-xs text-white/70 mt-1.5 max-w-xl">
              View each student&apos;s profile and mark their weekly attendance. Pick a student below to open their schedule for the selected week.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftWeek(-1)}
              className="p-2.5 rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20"
              title="Previous week"
            >
              <FiChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur">
              <FiCalendar className="size-4 text-[#FF8FB3]" />
              <span className="text-xs font-medium text-white whitespace-nowrap">{weekLabel}</span>
            </div>
            <button
              onClick={() => shiftWeek(1)}
              className="p-2.5 rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20"
              title="Next week"
            >
              <FiChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setWeekStart(toISODate(weekRange(new Date()).start))}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5733] to-[#E91E63] text-white text-[11px] font-semibold shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50 hover:brightness-110"
            >
              This week
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2.5">
              <span className="size-8 rounded-xl bg-gradient-to-br from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <FiUser className="size-4" />
              </span>
              My Students
            </h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Click a student to view their profile and attendance for the week.
            </p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-[#FF5733]/10 to-[#E91E63]/10 text-[#E91E63] text-[10px] font-semibold px-3.5 py-1.5 w-fit ring-1 ring-[#E91E63]/20">
            {students.length} {students.length === 1 ? "student" : "students"} assigned
          </span>
        </div>
        <div className="p-4 sm:p-6 pt-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name, email or program..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-4 focus:ring-[#E91E63]/10"
            />
          </div>
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FiSearch className="size-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">No students match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="py-3 pr-3">Student</th>
                    <th className="py-3 pr-3">Program / Subjects</th>
                    <th className="py-3 pr-3">Preferred Time</th>
                    <th className="py-3 pr-3">Days</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => {
                    const isActive = selectedStudent?.id === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`group cursor-pointer transition-all duration-200 ${
                          isActive ? "bg-gradient-to-r from-rose-50/80 to-transparent" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className="size-9 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-rose-500/20">
                                {s.user.name.charAt(0)}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-[#E91E63] transition-colors">
                                {s.user.name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{s.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-[11px] text-slate-600 max-w-[12rem] truncate" title={[s.program, s.subjects].filter(Boolean).join(" · ")}>
                            {[s.program, s.subjects].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          {s.preferredTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2.5 py-1">
                              <FiClock className="size-3" />
                              {s.preferredTime}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-[11px] text-slate-600 max-w-[10rem] truncate" title={s.preferredDays}>
                            {s.preferredDays || "—"}
                          </p>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(s);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-[11px] font-semibold transition-all active:scale-95 ${
                              isActive
                                ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-rose-500/25"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[#E91E63] hover:text-[#E91E63] hover:shadow-md hover:shadow-rose-500/10"
                            }`}
                          >
                            <FiCalendar className="size-3.5" />
                            View Attendance
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setSelectedStudent(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/30 flex flex-col ring-1 ring-white/10">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute right-4 top-4 z-20 rounded-2xl bg-white/80 backdrop-blur p-2.5 text-slate-500 shadow-lg ring-1 ring-slate-200/60 transition-all hover:bg-rose-50 hover:text-[#E91E63] hover:rotate-90 duration-200"
              title="Close"
            >
              <FiX className="size-4" />
            </button>

            <div className="flex-1 min-w-0 overflow-y-auto">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#4a044e] p-6 sm:p-7 text-white">
                <div className="absolute -top-20 -right-16 size-56 rounded-full bg-[#E91E63]/25 blur-3xl" />
                <div className="absolute -bottom-24 -left-10 size-48 rounded-full bg-[#FF5733]/20 blur-3xl" />
                <div className="relative flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-lg shadow-rose-500/30 ring-2 ring-white/15">
                    {selectedStudent.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold truncate">{selectedStudent.user.name}</h2>
                    <p className="text-[11px] text-white/70 truncate flex items-center gap-1.5">
                      <FiMail className="size-3 shrink-0" /> {selectedStudent.user.email}
                    </p>
                  </div>
                  <div className="ml-auto hidden sm:flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-white/80 ring-1 ring-white/15 backdrop-blur">
                      {weekLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/40">
                {detailRows(selectedStudent).map((row) => (
                  <div key={row.label} className="flex items-start gap-3 rounded-2xl bg-white border border-slate-100 p-3.5 shadow-sm">
                    <div className={`size-8 rounded-xl ${row.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <row.icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">{row.label}</p>
                      <p className="text-[11px] font-normal text-slate-800 break-words">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FiCalendar className="size-4 text-[#E91E63]" /> Weekly Attendance
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {days.map((day) => {
                    const iso = toISODate(day);
                    const mark = marks[iso];
                    const isToday = iso === today;
                    const isPast = iso < today;
                    const cellError = cellErrors[iso];
                    const timeError = timeErrors[iso];
                    const isSaving = saving[iso];
                    const isSaved = saved[iso];
                    const sched = weekSchedule.find((w) => w.iso === iso);
                    if (!sched) return null;
                    return (
                      <DayCard
                        key={iso}
                        day={sched}
                        mark={mark}
                        isToday={isToday}
                        isPast={isPast}
                        cellError={cellError}
                        timeError={timeError}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        reasonDrafts={reasonDrafts}
                        timeUsedDrafts={timeUsedDrafts}
                        cellErrors={cellErrors}
                        timeErrors={timeErrors}
                        setReasonDrafts={setReasonDrafts}
                        setTimeUsedDrafts={setTimeUsedDrafts}
                        setCellErrors={setCellErrors}
                        setTimeErrors={setTimeErrors}
                        handleMark={handleMark}
                        focusedStudent={{
                          name: selectedStudent.user.name,
                          preferredDays: selectedStudent.preferredDays,
                          preferredTime: selectedStudent.preferredTime,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
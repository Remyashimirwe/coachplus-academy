"use client";

import { useEffect, useMemo, useState, useCallback, type FC } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiUsers,
  FiLoader,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiBookOpen,
  FiAlertCircle,
} from "react-icons/fi";
import { DAYS_OF_WEEK, dayNameFromDate, isPreferredDay, parseLocalISODate, timeSlotForDay, toISODate, weekRange } from "@/app/lib/schedule";

interface StudentRow {
  id: number;
  user: { name: string; email: string };
  program?: string;
  subjects?: string;
  preferredDays?: string;
  preferredTime?: string;
}

interface AttendanceRow {
  id: number;
  studentId: number;
  status: string;
  remarks: string | null;
  date: string;
}

type StatusIcon = FC<{ className?: string }>;

const STATUS_OPTIONS: { value: string; label: string; short: string; icon: StatusIcon; activeClass: string }[] = [
  { value: "PRESENT", label: "Present", short: "P", icon: FiCheckCircle, activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25" },
  { value: "LATE", label: "Late", short: "L", icon: FiClock, activeClass: "bg-amber-500 text-white border-amber-500 shadow-amber-500/25" },
  { value: "ABSENT", label: "Absent", short: "A", icon: FiXCircle, activeClass: "bg-rose-500 text-white border-rose-500 shadow-rose-500/25" },
];

function todayISO() {
  return toISODate(new Date());
}

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceRow>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<string>(toISODate(weekRange(new Date()).start));
  const [error, setError] = useState("");

  const { start, end, days } = useMemo(() => weekRange(parseLocalISODate(weekStart)), [weekStart]);
  const today = todayISO();

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/teacher/students");
    const data = await res.json();
    if (Array.isArray(data)) setStudents(data);
  }, []);

  const loadMarks = useCallback(async (from: string, to: string) => {
    const res = await fetch(`/api/teacher/attendance?from=${from}&to=${to}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Record<string, AttendanceRow> = {};
      data.forEach((a: AttendanceRow) => {
        map[`${a.studentId}:${toISODate(new Date(a.date))}`] = a;
      });
      setMarks(map);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadMarks(toISODate(start), toISODate(end))]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const handleMark = async (student: StudentRow, dayDate: Date, status: string) => {
    const key = `${student.id}:${toISODate(dayDate)}`;
    const preferred = isPreferredDay(student.preferredDays, dayDate);
    const reason = (reasonDrafts[key] ?? "").trim();
    const existing = marks[key];

    if (!preferred && !reason && !existing?.remarks) {
      setCellErrors((prev) => ({
        ...prev,
        [key]: "A reason is required because this is not a preferred day.",
      }));
      return;
    }

    setSaving((prev) => ({ ...prev, [key]: true }));
    setCellErrors((prev) => ({ ...prev, [key]: undefined }));
    setError("");

    const remarks = reason || existing?.remarks || "";

    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        body: JSON.stringify({ studentId: student.id, status, remarks, date: toISODate(dayDate) }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setMarks((prev) => ({ ...prev, [key]: data.attendance }));
        setReasonDrafts((prev) => ({ ...prev, [key]: "" }));
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

  const stats = useMemo(() => {
    const values = Object.values(marks);
    return {
      total: students.length,
      marked: values.length,
      present: values.filter((v) => v.status === "PRESENT").length,
      absent: values.filter((v) => v.status === "ABSENT").length,
      late: values.filter((v) => v.status === "LATE").length,
    };
  }, [marks, students.length]);

  const weekLabel = days[0] && days[6]
    ? `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  function shiftWeek(delta: number) {
    const next = new Date(start);
    next.setDate(start.getDate() + delta * 7);
    setWeekStart(toISODate(next));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Attendance runs Monday – Sunday. Preferred days are highlighted — a reason is required on days that are not preferred.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all"
            title="Previous week"
          >
            <FiChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <FiCalendar className="size-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{weekLabel}</span>
          </div>
          <button
            onClick={() => shiftWeek(1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all"
            title="Next week"
          >
            <FiChevronRight className="size-4" />
          </button>
          <button
            onClick={() => setWeekStart(toISODate(weekRange(new Date()).start))}
            className="px-3 py-2.5 rounded-xl bg-[#0f172a] text-white text-xs font-bold hover:bg-[#E91E63] transition-all"
          >
            This week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Students</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 shadow-sm p-4">
          <p className="text-xl font-black text-amber-700">{stats.late}</p>
          <p className="text-xs font-semibold text-amber-600 mt-0.5">Late</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-4">
          <p className="text-xl font-black text-rose-700">{stats.absent}</p>
          <p className="text-xs font-semibold text-rose-600 mt-0.5">Absent</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold p-4">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <FiLoader className="size-6 animate-spin text-slate-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center">
            <FiUsers className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold">No students assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[980px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 w-64 min-w-64 align-top">Student</th>
                  {days.map((day, i) => {
                    const iso = toISODate(day);
                    const isToday = iso === today;
                    return (
                      <th key={iso} className="px-3 py-4 text-center min-w-[92px]">
                        <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-[#E91E63]" : "text-slate-400"}`}>
                          {DAYS_OF_WEEK[i].slice(0, 3)}
                        </div>
                        <div className={`text-sm font-bold mt-0.5 ${isToday ? "text-slate-900" : "text-slate-600"}`}>
                          {day.getDate()}
                        </div>
                        {isToday && (
                          <span className="inline-block mt-1 rounded-full bg-[#E91E63]/10 text-[#E91E63] text-[9px] font-black px-1.5 py-0.5 uppercase tracking-tighter">
                            Today
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const preferredSet = new Set((student.preferredDays || "").split(",").map((d) => d.trim()).filter(Boolean));
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                            {student.user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{student.user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{student.user.email}</p>
                            {(student.program || student.subjects) && (
                              <p className="mt-1 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                                <FiBookOpen className="size-3 shrink-0" />
                                <span className="truncate">{[student.program, student.subjects].filter(Boolean).join(" · ")}</span>
                              </p>
                            )}
                            {student.preferredDays && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {DAYS_OF_WEEK.map((day) => {
                                  const preferred = preferredSet.has(day);
                                  const slot = preferred ? timeSlotForDay(student.preferredTime, day) : null;
                                  return (
                                    <span
                                      key={day}
                                      title={slot ? `${day}: ${slot}` : `${day} (not preferred)`}
                                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                        preferred
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-100 text-slate-400 line-through"
                                      }`}
                                    >
                                      {day.slice(0, 3)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {days.map((day) => {
                        const iso = toISODate(day);
                        const key = `${student.id}:${iso}`;
                        const mark = marks[key];
                        const preferred = isPreferredDay(student.preferredDays, day);
                        const slot = preferred ? timeSlotForDay(student.preferredTime, dayNameFromDate(day)) : null;
                        const cellError = cellErrors[key];
                        const isSaving = saving[key];
                        const isSaved = saved[key];
                        return (
                          <td key={iso} className="px-3 py-4 align-top">
                            <div className={`rounded-xl p-2 border-2 ${preferred ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-slate-50/60"}`}>
                              {slot && (
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-1.5 text-center">
                                  {slot}
                                </p>
                              )}
                              <div className="flex flex-col gap-1">
                                {STATUS_OPTIONS.map((opt) => {
                                  const active = mark?.status === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleMark(student, day, opt.value)}
                                      disabled={isSaving}
                                      title={active ? `${opt.label} (click again to keep)` : `${opt.label} — ${preferred ? "" : "reason required (not a preferred day)"}`}
                                      className={`inline-flex items-center justify-center gap-1 rounded-lg border-2 px-2 py-1 text-[10px] font-bold transition-all disabled:opacity-60 ${
                                        active
                                          ? `${opt.activeClass} shadow-sm`
                                          : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                                      }`}
                                    >
                                      {isSaving && active ? (
                                        <FiLoader className="size-3 animate-spin" />
                                      ) : isSaved && active ? (
                                        <FiCheck className="size-3" />
                                      ) : (
                                        <opt.icon className="size-3" />
                                      )}
                                      {opt.short}
                                    </button>
                                  );
                                })}
                              </div>
                              {!preferred && (
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
                                      handleMark(student, day, mark.status);
                                    }
                                  }}
                                  placeholder={mark ? "Reason (editable)" : "Reason (required)"}
                                  className={`w-full mt-1.5 rounded-lg border px-2 py-1.5 text-[10px] outline-none transition-all ${
                                    cellError
                                      ? "border-rose-300 bg-rose-50 text-rose-700"
                                      : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                                  }`}
                                />
                              )}
                              {cellError && (
                                <p className="mt-1 text-[9px] font-bold text-rose-600 flex items-center gap-1">
                                  <FiAlertCircle className="size-3 shrink-0" /> {cellError}
                                </p>
                              )}
                              {mark?.remarks && preferred && (
                                <p className="mt-1 text-[9px] text-slate-400 italic truncate" title={mark.remarks}>
                                  {mark.remarks}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
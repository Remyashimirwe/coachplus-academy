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
  preferredDays?: string;
  preferredTime?: string;
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

interface DaySchedule {
  iso: string;
  date: Date;
  expected: { time: string; names: string[] }[];
}

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceRow>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [timeUsedDrafts, setTimeUsedDrafts] = useState<Record<string, string>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string | undefined>>({});
  const [timeErrors, setTimeErrors] = useState<Record<string, string | undefined>>({});
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
      setLoading(true);
      await Promise.all([loadStudents(), loadMarks(toISODate(start), toISODate(end))]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

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

  function deviates(day: DaySchedule, status: string): boolean {
    const expected = day.expected.length > 0;
    return (expected && status === "ABSENT") || (!expected && status === "PRESENT");
  }

  const handleMark = async (day: DaySchedule, status: string) => {
    const key = day.iso;
    const reason = (reasonDrafts[key] ?? "").trim();
    const timeUsed = (timeUsedDrafts[key] ?? "").trim();
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
    setError("");

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
        setTimeUsedDrafts((prev) => ({ ...prev, [key]: "" }));
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
    const expectedDays = weekSchedule.filter((d) => d.expected.length > 0).length;
    const values = Object.values(marks);
    return {
      expectedDays,
      marked: values.length,
      present: values.filter((v) => v.status === "PRESENT").length,
      absent: values.filter((v) => v.status === "ABSENT").length,
    };
  }, [marks, weekSchedule]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Mark your own attendance for the week. Finished days are locked. When marking yourself present you must enter the time you used, and a reason is required whenever your mark differs from the scheduled students&apos; preferred times.
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
          <p className="text-xl font-black text-slate-900">{stats.expectedDays}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Scheduled Days</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.marked}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Marked</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Present</p>
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
            <FiUser className="size-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold">No students assigned to you yet, so there is no expected schedule.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-5">
            {weekSchedule.map((day) => {
              const key = day.iso;
              const mark = marks[key];
              const expected = day.expected.length > 0;
              const isToday = key === today;
              const isPast = key < today;
              const cellError = cellErrors[key];
              const timeError = timeErrors[key];
              const isSaving = saving[key];
              const isSaved = saved[key];
              return (
                <div
                  key={key}
                  className={`rounded-2xl border-2 p-4 ${isPast ? "border-slate-100 bg-slate-100/40 opacity-80" : expected ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-slate-50/40"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className={`text-sm font-black ${isToday ? "text-[#E91E63]" : "text-slate-800"}`}>
                        {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {isToday && " • Today"}
                      </p>
                    </div>
                    {isPast ? (
                      <span className="rounded-full bg-slate-200 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter flex items-center gap-1">
                        <FiLock className="size-2.5" /> Finished
                      </span>
                    ) : expected ? (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter">
                        Scheduled
                      </span>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    {expected ? (
                      <ul className="space-y-1">
                        {day.expected.map((slot) => (
                          <li
                            key={slot.time}
                            className="rounded-lg bg-white border border-emerald-100 px-2.5 py-1.5 text-[11px]"
                          >
                            <span className="font-black text-emerald-700">{slot.time}</span>
                            <span className="text-slate-400 mx-1">•</span>
                            <span className="text-slate-600 font-semibold">{slot.names.join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <FiBriefcase className="size-3" /> No student sessions scheduled
                      </p>
                    )}
                  </div>

                  {isPast ? (
                    mark ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold ${
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
                        {mark.timeUsed && <span className="ml-1 font-black">• {mark.timeUsed}</span>}
                      </span>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Not marked</p>
                    )
                  ) : (
                    <>
                      <div className="flex gap-1.5 mb-2">
                        {STATUS_OPTIONS.map((opt) => {
                          const active = mark?.status === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleMark(day, opt.value)}
                              disabled={isSaving}
                              title={opt.label}
                              className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg border-2 px-2 py-1.5 text-[10px] font-bold transition-all disabled:opacity-60 ${
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
                              <span className="hidden sm:inline">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {(timeError || mark?.status === "PRESENT") && (
                        <input
                          type="text"
                          value={timeUsedDrafts[key] ?? mark?.timeUsed ?? ""}
                          onChange={(e) => {
                            setTimeUsedDrafts((prev) => ({ ...prev, [key]: e.target.value }));
                            if (timeError) setTimeErrors((prev) => ({ ...prev, [key]: undefined }));
                          }}
                          onBlur={() => {
                            const used = (timeUsedDrafts[key] ?? "").trim();
                            if (mark && mark.status === "PRESENT" && used && used !== (mark.timeUsed ?? "")) {
                              handleMark(day, mark.status);
                            }
                          }}
                          placeholder="Time used (e.g. 08:00 - 10:00)"
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none transition-all mb-1.5 ${
                            timeError
                              ? "border-rose-300 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                          }`}
                        />
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
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none transition-all ${
                            cellError
                              ? "border-rose-300 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-white text-slate-700 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                          }`}
                        />
                      )}

                      {mark?.remarks && !deviates(day, mark.status) && (
                        <p className="text-[10px] text-slate-400 italic truncate" title={mark.remarks}>
                          {mark.remarks}
                        </p>
                      )}

                      {mark?.timeUsed && mark.status !== "PRESENT" && (
                        <p className="text-[10px] text-slate-400 italic truncate">
                          Time used: {mark.timeUsed}
                        </p>
                      )}

                      {timeError && (
                        <p className="mt-1.5 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <FiAlertCircle className="size-3 shrink-0" /> {timeError}
                        </p>
                      )}

                      {cellError && (
                        <p className="mt-1.5 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <FiAlertCircle className="size-3 shrink-0" /> {cellError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
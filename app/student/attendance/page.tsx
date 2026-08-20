"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiClock,
  FiEdit,
} from "react-icons/fi";
import {
  DAYS_OF_WEEK,
  dayNameFromDate,
  isDayLocked,
  parseLocalISODate,
  parsePreferredDays,
  timeSlotForDay,
  toISODate,
  weekRange,
} from "@/app/lib/schedule";

interface SelfMark {
  id: number;
  status: string;
  remarks: string | null;
  timeUsed: string | null;
  date: string;
}

interface TeacherRecord {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
  timeUsed?: string | null;
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: FiCheckCircle, activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/25" },
  { value: "ABSENT", label: "Absent", icon: FiXCircle, activeClass: "bg-rose-500 text-white border-rose-500 shadow-rose-500/25" },
] as const;

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
  expected: string | null;
  preferred: boolean;
}

export default function StudentAttendancePage() {
  const [preferredDays, setPreferredDays] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [marks, setMarks] = useState<Record<string, SelfMark>>({});
  const [teacherRecords, setTeacherRecords] = useState<TeacherRecord[]>([]);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [timeUsedDrafts, setTimeUsedDrafts] = useState<Record<string, { from: string; to: string }>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string | undefined>>({});
  const [timeErrors, setTimeErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<string>(toISODate(weekRange(new Date()).start));

  const { start, end, days } = useMemo(() => weekRange(parseLocalISODate(weekStart)), [weekStart]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const settingsRes = await fetch("/api/student/settings");
      const settingsData = await settingsRes.json();
      if (!cancelled) {
        setPreferredDays(settingsData?.preferredDays ?? "");
        setPreferredTime(settingsData?.preferredTime ?? "");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWeek() {
      const from = toISODate(start);
      const to = toISODate(end);
      const [marksRes, recordsRes] = await Promise.all([
        fetch(`/api/student/my-attendance?from=${from}&to=${to}`),
        fetch("/api/student/attendance"),
      ]);
      const marksData = await marksRes.json();
      const recordsData = await recordsRes.json();
      if (!cancelled) {
        const map: Record<string, SelfMark> = {};
        (Array.isArray(marksData) ? marksData : []).forEach((m: SelfMark) => {
          map[toISODate(new Date(m.date))] = m;
        });
        setMarks(map);
        setTeacherRecords(Array.isArray(recordsData) ? recordsData : []);
        setLoading(false);
      }
    }
    loadWeek();
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const preferredDayList = useMemo(() => parsePreferredDays(preferredDays), [preferredDays]);
  const scheduledDays = preferredDayList.filter((d) => DAYS_OF_WEEK.includes(d)).length;

  const weekSchedule: DaySchedule[] = useMemo(
    () =>
      days.map((date) => {
        const dayName = dayNameFromDate(date);
        return {
          iso: toISODate(date),
          date,
          expected: timeSlotForDay(preferredTime, dayName),
          preferred: preferredDayList.includes(dayName),
        };
      }),
    [days, preferredTime, preferredDayList]
  );

  const stats = useMemo(() => {
    const values = Object.values(marks);
    return {
      scheduled: scheduledDays,
      marked: values.length,
      present: values.filter((v) => v.status === "PRESENT").length,
      absent: values.filter((v) => v.status === "ABSENT").length,
    };
  }, [marks, scheduledDays]);

  const weekLabel = weekSchedule[0] && weekSchedule[6]
    ? `${weekSchedule[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekSchedule[6].date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";

  const todayISO = toISODate(new Date());

  function shiftWeek(delta: number) {
    const next = new Date(start);
    next.setDate(start.getDate() + delta * 7);
    setWeekStart(toISODate(next));
  }

  const getMark = (iso: string) => marks[iso];

  async function submitMark(day: DaySchedule, status: string) {
    if (saving[day.iso]) return;
    const current = getMark(day.iso);

    const isPast = isDayLocked(day.iso);
    if (isPast && current?.status !== status) {
      setCellErrors((prev) => ({ ...prev, [day.iso]: "You can no longer edit attendance for this day." }));
      return;
    }
    if (isPast) return;

    const deviates = (day.preferred && status === "ABSENT") || (!day.preferred && status === "PRESENT");
    const reason = (reasonDrafts[day.iso] ?? "").trim();
    const draft = timeUsedDrafts[day.iso];
    const timeUsed = combineTime(draft?.from ?? "", draft?.to ?? "");

    if (status === "PRESENT" && !timeUsed) {
      setTimeErrors((prev) => ({ ...prev, [day.iso]: "Please enter the time you used." }));
      return;
    }
    if (deviates && !reason) {
      setCellErrors((prev) => ({
        ...prev,
        [day.iso]: day.preferred
          ? `Please enter a reason before marking yourself ${status.toLowerCase()}.`
          : `You have no session scheduled this day. Please enter a reason before marking yourself present.`,
      }));
      return;
    }

    setSaving((prev) => ({ ...prev, [day.iso]: true }));
    setCellErrors((prev) => ({ ...prev, [day.iso]: undefined }));
    setTimeErrors((prev) => ({ ...prev, [day.iso]: undefined }));
    setSaved((prev) => ({ ...prev, [day.iso]: false }));
    try {
      const res = await fetch("/api/student/my-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: reason || null, date: day.iso, timeUsed: status === "PRESENT" ? timeUsed : null }),
      });
      const data = await res.json();
      if (res.ok) {
        setMarks((prev) => ({ ...prev, [day.iso]: data.attendance }));
        setSaved((prev) => ({ ...prev, [day.iso]: true }));
        setEditing((prev) => ({ ...prev, [day.iso]: false }));
      } else {
        setCellErrors((prev) => ({ ...prev, [day.iso]: data.message || "Failed to save." }));
      }
    } catch {
      setCellErrors((prev) => ({ ...prev, [day.iso]: "Failed to save. Please try again." }));
    } finally {
      setSaving((prev) => ({ ...prev, [day.iso]: false }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [day.iso]: false })), 2000);
    }
  }

  const records = useMemo(() => teacherRecords.slice(0, 20), [teacherRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">Mark yourself present or absent for each day of the week.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all"
            aria-label="Previous week"
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
            aria-label="Next week"
          >
            <FiChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.scheduled}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Scheduled Days / Week</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-black text-slate-900">{stats.marked}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Marked This Week</p>
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

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 flex justify-center">
          <FiLoader className="size-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weekSchedule.map((day) => {
            const isPast = isDayLocked(day.iso);
            const isToday = day.iso === todayISO;
            const mark = getMark(day.iso);
            const deviates = !!mark?.remarks;
            const cellError = cellErrors[day.iso];
            const timeError = timeErrors[day.iso];
            const isSaving = saving[day.iso];
            const isSaved = saved[day.iso];
            return (
              <div
                key={day.iso}
                className={`rounded-2xl border-2 p-4 ${isPast ? "border-slate-100 bg-slate-100/40 opacity-80" : day.preferred ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-slate-50/40"}`}
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
                  {isPast && mark ? (
                    <span className="rounded-full bg-slate-200 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter">
                      Finished
                    </span>
                  ) : isPast && !mark ? (
                    <span className="rounded-full bg-slate-200 text-slate-400 text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter">
                      Not marked
                    </span>
                  ) : null}
                </div>

                {day.expected ? (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mb-1">
                    <FiClock className="size-3" /> Expected {day.expected}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-1">No preferred session</p>
                )}

                {!isPast && mark && !editing[day.iso] ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          mark.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {mark.status === "PRESENT" ? <FiCheckCircle className="size-3.5" /> : <FiXCircle className="size-3.5" />}
                        {mark.status}
                        {mark.timeUsed && <span className="ml-1 font-bold">• {mark.timeUsed}</span>}
                      </span>
                      <button
                        onClick={() => setEditing((prev) => ({ ...prev, [day.iso]: true }))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-[#E91E63] hover:text-[#E91E63] transition-all"
                      >
                        <FiEdit className="size-3" /> Edit
                      </button>
                    </div>
                    {mark.remarks && (
                      <p className="text-[10px] text-amber-600 font-medium truncate" title={mark.remarks}>
                        {mark.remarks}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                {!isPast && (
                  <div className="flex gap-2 mt-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = mark?.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => submitMark(day, opt.value)}
                          disabled={isSaving}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-xs font-bold transition-all ${
                            active
                              ? opt.activeClass
                              : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                          } disabled:opacity-50`}
                        >
                          {isSaving && active ? <FiLoader className="size-3.5 animate-spin" /> : <opt.icon className="size-3.5" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {isPast && mark && (
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        mark.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {mark.status}
                    </span>
                  </div>
                )}

                {!isPast && (timeError || mark?.status === "PRESENT") && (
                  <div className="mt-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
                        <input
                          type="time"
                          value={timeUsedDrafts[day.iso]?.from ?? parseTimeUsed(mark?.timeUsed).from}
                          onChange={(e) => {
                            setTimeUsedDrafts((prev) => ({
                              ...prev,
                              [day.iso]: { from: e.target.value, to: timeUsedDrafts[day.iso]?.to ?? parseTimeUsed(mark?.timeUsed).to },
                            }));
                            if (timeError) setTimeErrors((prev) => ({ ...prev, [day.iso]: undefined }));
                          }}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                            timeError ? "border-rose-400 ring-2 ring-rose-500/10" : "border-slate-200 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                          } bg-white text-slate-700`}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                        <input
                          type="time"
                          value={timeUsedDrafts[day.iso]?.to ?? parseTimeUsed(mark?.timeUsed).to}
                          onChange={(e) => {
                            setTimeUsedDrafts((prev) => ({
                              ...prev,
                              [day.iso]: { from: timeUsedDrafts[day.iso]?.from ?? parseTimeUsed(mark?.timeUsed).from, to: e.target.value },
                            }));
                            if (timeError) setTimeErrors((prev) => ({ ...prev, [day.iso]: undefined }));
                          }}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                            timeError ? "border-rose-400 ring-2 ring-rose-500/10" : "border-slate-200 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                          } bg-white text-slate-700`}
                        />
                      </div>
                    </div>
                    {timeError && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">{timeError}</p>
                    )}
                  </div>
                )}

                {!isPast && (cellError || (mark && deviates)) && (
                  <div className="mt-2.5">
                    <textarea
                      value={reasonDrafts[day.iso] ?? mark?.remarks ?? ""}
                      onChange={(e) => {
                        setReasonDrafts((prev) => ({ ...prev, [day.iso]: e.target.value }));
                        if (cellError) setCellErrors((prev) => ({ ...prev, [day.iso]: undefined }));
                      }}
                      placeholder="Reason for the change..."
                      rows={2}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                        cellError ? "border-rose-400 ring-2 ring-rose-500/10" : "border-slate-200 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                      } bg-white text-slate-700`}
                    />
                    {cellError && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <FiAlertCircle className="size-3 shrink-0" /> {cellError}
                      </p>
                    )}
                  </div>
                )}
                  </>
                )}

                {isSaved && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                    <FiCheckCircle className="size-3" /> Saved
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Teacher&apos;s Records</h2>
            <p className="text-xs text-slate-500 mt-0.5">Attendance your teacher recorded for you.</p>
          </div>
          <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1">
            {teacherRecords.length} {teacherRecords.length === 1 ? "record" : "records"}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {records.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">No records yet.</p>
          ) : (
            records.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  {r.remarks ? (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                      <FiAlertCircle className="size-3" /> {r.remarks}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">No schedule changes reported.</p>
                  )}
                  {r.timeUsed && r.status === "PRESENT" && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <FiClock className="size-3 text-slate-300" /> Time: {r.timeUsed}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    r.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">My Self-Reported Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">Attendance you marked yourself.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {Object.values(marks).length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">You haven&apos;t marked any attendance yet.</p>
          ) : (
            Object.values(marks)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(m.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    {m.remarks && (
                      <p className="text-xs text-amber-600 font-semibold mt-0.5 truncate flex items-center gap-1">
                        <FiAlertCircle className="size-3" /> {m.remarks}
                      </p>
                    )}
                    {m.timeUsed && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Time used: {m.timeUsed}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      m.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
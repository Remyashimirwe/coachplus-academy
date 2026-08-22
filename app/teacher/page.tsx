"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiCheckSquare,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiBookOpen,
  FiEdit2,
  FiX,
  FiCalendar,
  FiLoader,
  FiChevronLeft,
  FiMail,
  FiPhone,
  FiUser,
  FiCamera,
} from "react-icons/fi";
import { DAYS_OF_WEEK, parsePreferredDays, toISODate, weekRange } from "@/app/lib/schedule";
import { resizeImage } from "@/app/lib/image";

interface TeacherProfile {
  name: string;
  email: string;
  image?: string | null;
  phone?: string;
  country?: string;
  city?: string;
  village?: string;
  cell?: string;
  subjects?: string;
  studentCount?: number;
}

interface StudentRow {
  id: number;
  user: { name: string; email: string; phone?: string };
  program?: string;
  subjects?: string;
  preferredTime?: string;
  preferredDays?: string;
  learningMode?: string;
  phone?: string;
}

interface AttendanceRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
  timeUsed?: string | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status, timeUsed }: { status: string; timeUsed?: string | null }) {
  const present = status === "PRESENT";
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
        present ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {present ? <FiCheckCircle className="size-3.5" /> : <FiXCircle className="size-3.5" />}
      {status}
      {timeUsed && present && <span className="font-black">• {timeUsed}</span>}
    </span>
  );
}

export default function TeacherPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRow[]>([]);
  const [selfRecords, setSelfRecords] = useState<AttendanceRow[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState({ country: "", city: "", village: "", cell: "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ success: boolean; text: string } | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationLine = [profile?.country, profile?.city, profile?.village, profile?.cell]
    .filter(Boolean)
    .join(" · ");

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || savingImage) return;
    setSavingImage(true);
    try {
      const dataUrl = await resizeImage(file);
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, image: dataUrl } : prev));
        window.dispatchEvent(new Event("account:updated"));
      }
    } catch {
      // ignore, keep current picture
    } finally {
      setSavingImage(false);
      e.target.value = "";
    }
  }

  function startEditLocation() {
    setLocationDraft({
      country: profile?.country || "",
      city: profile?.city || "",
      village: profile?.village || "",
      cell: profile?.cell || "",
    });
    setLocationStatus(null);
    setEditingLocation(true);
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setSavingLocation(true);
    setLocationStatus(null);
    try {
      const res = await fetch("/api/teacher/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationDraft),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ...locationDraft } : prev));
        setLocationStatus({ success: true, text: data.message || "Location updated." });
        setTimeout(() => setEditingLocation(false), 800);
      } else {
        setLocationStatus({ success: false, text: data.message || "Failed to update location." });
      }
    } catch {
      setLocationStatus({ success: false, text: "Something went wrong. Please try again." });
    } finally {
      setSavingLocation(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profileRes, studentsRes, attendanceRes] = await Promise.all([
          fetch("/api/teacher/settings"),
          fetch("/api/teacher/students"),
          fetch("/api/teacher/my-attendance"),
        ]);
        const [profileData, studentsData, attendanceData] = await Promise.all([
          profileRes.json(),
          studentsRes.json(),
          attendanceRes.json(),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          setStudents(Array.isArray(studentsData) ? studentsData : []);
          setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setStudentRecords([]);
      setSelfRecords([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setStudentLoading(true);
      setStudentError("");
      try {
        const res = await fetch(`/api/teacher/students/${selected.id}/attendance`);
        const data = await res.json();
        if (!cancelled) {
          if (res.ok) {
            setStudentRecords(Array.isArray(data.records) ? data.records : []);
            setSelfRecords(Array.isArray(data.selfRecords) ? data.selfRecords : []);
          } else {
            setStudentError(data.message || "Failed to load attendance");
          }
        }
      } catch {
        if (!cancelled) setStudentError("Failed to load attendance");
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const { start, end, days } = useMemo(() => weekRange(new Date()), []);
  const weekMarks = useMemo(
    () =>
      attendance.filter((a) => {
        const iso = toISODate(new Date(a.date));
        return iso >= toISODate(start) && iso <= toISODate(end);
      }),
    [attendance, start, end]
  );

  const stats = useMemo(() => {
    const expectedDays = new Set<string>();
    students.forEach((s) => {
      parsePreferredDays(s.preferredDays).forEach((d) => expectedDays.add(d));
    });
    const present = weekMarks.filter((m) => m.status === "PRESENT").length;
    const absent = weekMarks.filter((m) => m.status === "ABSENT").length;
    const rate = weekMarks.length > 0 ? Math.round((present / weekMarks.length) * 100) : 0;
    return { expectedDays: expectedDays.size, marked: weekMarks.length, present, absent, rate };
  }, [students, weekMarks]);

  const weekMap = useMemo(() => {
    const map = new Map<string, AttendanceRow>();
    weekMarks.forEach((m) => map.set(toISODate(new Date(m.date)), m));
    return map;
  }, [weekMarks]);

  const detailRows = (s: StudentRow) => [
    { icon: FiBookOpen, label: "Program & Subjects", value: [s.program, s.subjects].filter(Boolean).join(" · ") || "Not specified", color: "text-indigo-600 bg-indigo-50" },
    { icon: FiClock, label: "Preferred Time", value: s.preferredTime || "Not specified", color: "text-rose-600 bg-rose-50" },
    { icon: FiCalendar, label: "Preferred Days", value: s.preferredDays || "Not specified", color: "text-emerald-600 bg-emerald-50" },
    { icon: FiMonitor, label: "Learning Mode", value: s.learningMode || "Not specified", color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#E91E63]/10 via-[#FF5733]/10 to-[#7B1FA2]/10 border border-[#E91E63]/20 p-4 sm:p-5 flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center shadow-lg shadow-rose-200">
          <FiMapPin className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="bg-gradient-to-tr from-[#FF5733] to-[#E91E63] bg-clip-text text-sm font-bold text-transparent">We match you with nearby students</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Keep your location updated so you never miss opportunities!
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-white overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative size-16 shrink-0">
              <div className="size-16 overflow-hidden rounded-2xl bg-gradient-to-tr from-[#FF5733] to-[#E91E63] flex items-center justify-center text-2xl font-black">
                {profile?.image ? (
                  <img src={profile.image} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || "T"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingImage}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 size-7 rounded-full bg-[#E91E63] text-white border-2 border-white shadow-md flex items-center justify-center transition-colors hover:bg-[#7B1FA2] disabled:opacity-60"
              >
                {savingImage ? <FiLoader className="size-3 animate-spin" /> : <FiCamera className="size-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black truncate">{profile?.name || "Teacher Dashboard"}</h1>
              <p className="text-sm text-slate-300 truncate flex items-center gap-1.5">
                <FiMail className="size-3.5 shrink-0" /> {profile?.email || ""}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-semibold">
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <FiPhone className="size-3" /> {profile.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                  <FiUsers className="size-3" /> {students.length} {students.length === 1 ? "Student" : "Students"}
                </span>
              </div>
              {/* Location line on small screens */}
              {locationLine && (
                <p className="mt-2 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 md:hidden">
                  <FiMapPin className="size-3 shrink-0 text-[#E91E63]" /> {locationLine}
                </p>
              )}
            </div>

            {/* Location block on the right (desktop) */}
            <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</p>
              {locationLine ? (
                <p className="text-sm font-semibold flex items-center gap-1.5 max-w-[240px]">
                  <FiMapPin className="size-4 shrink-0 text-[#E91E63]" />
                  <span className="truncate" title={locationLine}>{locationLine}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No location set yet</p>
              )}
              <button
                type="button"
                onClick={startEditLocation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[#E91E63]"
              >
                <FiEdit2 className="size-3" /> Edit
              </button>
            </div>
          </div>

          {/* Mobile edit entry */}
          {!editingLocation && (
            <button
              type="button"
              onClick={startEditLocation}
              className="md:hidden mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[#E91E63]"
            >
              <FiEdit2 className="size-3" /> Update location
            </button>
          )}

          {editingLocation && (
            <form onSubmit={saveLocation} className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4 grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={locationDraft.country}
                  onChange={(e) => setLocationDraft((d) => ({ ...d, country: e.target.value }))}
                  placeholder="Country (e.g. Rwanda)"
                  aria-label="Country"
                  className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30"
                />
                <input
                  value={locationDraft.city}
                  onChange={(e) => setLocationDraft((d) => ({ ...d, city: e.target.value }))}
                  placeholder="City / District (e.g. Kigali)"
                  aria-label="City"
                  className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30"
                />
                <input
                  value={locationDraft.village}
                  onChange={(e) => setLocationDraft((d) => ({ ...d, village: e.target.value }))}
                  placeholder="Village (e.g. Kibenga)"
                  aria-label="Village"
                  className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30"
                />
                <input
                  value={locationDraft.cell}
                  onChange={(e) => setLocationDraft((d) => ({ ...d, cell: e.target.value }))}
                  placeholder="Cell (e.g. Nyamweru)"
                  aria-label="Cell"
                  className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E91E63] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-[#c81854] disabled:opacity-50"
                >
                  {savingLocation ? "Saving..." : "Save Location"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLocation(false);
                    setLocationStatus(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20"
                >
                  Cancel
                </button>
                {locationStatus && (
                  <span className={`text-[11px] font-semibold ${locationStatus.success ? "text-emerald-400" : "text-rose-400"}`}>
                    {locationStatus.text}
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B1FA2] to-[#6A1B9A] text-white flex items-center justify-center mb-3">
            <FiUsers className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.expectedDays}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Scheduled Days / Week</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mb-3">
            <FiCheckSquare className="size-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{loading ? "-" : stats.marked}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Marked This Week</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3">
            <FiCheckCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{loading ? "-" : stats.present}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-1">Present</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-5">
          <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-3">
            <FiXCircle className="size-5" />
          </div>
          <p className="text-2xl font-black text-rose-700">{loading ? "-" : stats.absent}</p>
          <p className="text-xs font-semibold text-rose-600 mt-1">Absent</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">This Week</h2>
          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E91E63] hover:text-[#7B1FA2] transition-colors"
          >
            Mark Attendance <FiArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-slate-100">
          {days.map((day, i) => {
            const iso = toISODate(day);
            const mark = weekMap.get(iso);
            const isToday = iso === toISODate(new Date());
            return (
              <Link
                key={iso}
                href={`/teacher/attendance?date=${iso}`}
                title="Click to record attendance for this day"
                className={`group p-4 text-center transition-colors hover:bg-slate-50 ${isToday ? "bg-rose-50/40" : ""}`}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-[#E91E63]" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {DAYS_OF_WEEK[i].slice(0, 3)}
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{day.getDate()}</p>
                {loading ? (
                  <span className="text-[10px] text-slate-300">…</span>
                ) : mark ? (
                  <>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
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
                  </span>
                  {mark.status === "PRESENT" && mark.timeUsed && (
                    <span className="mt-1 block text-[9px] font-semibold text-emerald-600">{mark.timeUsed}</span>
                  )}
                  </>
                ) : (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-400 px-2 py-0.5 text-[9px] font-bold group-hover:text-[#E91E63] transition-colors">
                    <FiArrowRight className="size-2.5" />
                    Mark
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">My Students</h2>
            <Link href="/teacher/students" className="text-xs font-semibold text-[#E91E63] hover:text-[#7B1FA2]">
              Manage
            </Link>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center">
              <FiLoader className="size-6 animate-spin text-slate-400" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <FiUser className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold">No students assigned to you yet.</p>
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                    selected?.id === s.id ? "bg-rose-50/40" : ""
                  }`}
                >
                  <div className="size-10 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center font-semibold shrink-0">
                    {s.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{s.user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {(s.program || s.subjects) && [s.program, s.subjects].filter(Boolean).join(" · ")}
                      {s.preferredTime && ` • ${s.preferredTime}`}
                    </p>
                  </div>
                  <FiChevronLeft className="size-4 rotate-180 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-tr from-slate-50 to-white">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center text-lg font-black shrink-0">
                  {selected.user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate">{selected.user.name}</h2>
                  <p className="text-sm text-slate-500 truncate">{selected.user.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 border-b border-slate-100">
              {detailRows(selected).map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className={`size-9 rounded-xl ${row.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <row.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                    <p className="text-sm font-semibold text-slate-800 break-words">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">Attendance</h3>
                {studentLoading && <FiLoader className="size-4 animate-spin text-slate-400" />}
              </div>
              {studentError ? (
                <p className="text-sm text-rose-600 font-semibold">{studentError}</p>
              ) : studentRecords.length === 0 && selfRecords.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">No attendance records yet.</p>
              ) : (
                <div className="space-y-4">
                  {studentRecords.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Recorded by you</p>
                      <div className="space-y-2">
                        {studentRecords.map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">{formatDate(r.date)}</p>
                              {r.remarks && (
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <FiAlertCircle className="size-3 text-amber-500 shrink-0" /> {r.remarks}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={r.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selfRecords.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Self-reported by student</p>
                      <div className="space-y-2">
                        {selfRecords.map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">{formatDate(r.date)}</p>
                              {r.remarks && (
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <FiAlertCircle className="size-3 text-amber-500 shrink-0" /> {r.remarks}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={r.status} timeUsed={r.timeUsed} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <FiUser className="size-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold">Select a student to view their profile and attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}
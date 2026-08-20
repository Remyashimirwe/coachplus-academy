"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiSearch,
  FiUsers,
  FiClock,
  FiMail,
  FiMapPin,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiPhone,
} from "react-icons/fi";
import { toISODate } from "@/app/lib/schedule";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-rose-100 text-rose-700",
};

type Tab = "student" | "self" | "teacher";

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "student", label: "Student Records", description: "Attendance teachers recorded for students" },
  { id: "self", label: "Student Self-Reported", description: "Attendance students marked for themselves" },
  { id: "teacher", label: "Teacher Attendance", description: "Attendance teachers marked for themselves" },
];

interface BaseRow {
  id: number;
  status: string;
  date: string;
  remarks: string | null;
  timeUsed?: string | null;
  student?: { id: number; user: { name: string; email: string }; branch?: string; phone?: string };
  teacher?: { id: number; user: { name: string; email: string }; branch?: string; phone?: string };
}

interface Person {
  id: number;
  name: string;
  email: string;
  branch?: string;
  phone?: string;
  records: BaseRow[];
  present: number;
  absent: number;
}

function StatusBadge({ status }: { status: string }) {
  const present = status === "PRESENT";
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        present ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {present ? <FiCheckCircle className="size-3.5" /> : <FiXCircle className="size-3.5" />}
      {status}
    </span>
  );
}

// Month calendar that colour-codes each day: green = studied/present, red = absent.
function AttendanceCalendar({ records }: { records: BaseRow[] }) {
  const [cursor, setCursor] = useState(() => {
    const ref = records.length ? new Date(records[0].date) : new Date();
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });

  const marks = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => map.set(toISODate(new Date(r.date)), r.status));
    return map;
  }, [records]);

  const first = new Date(cursor.year, cursor.month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.year, cursor.month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayIso = toISODate(new Date());

  function shift(delta: number) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
          <FiCalendar className="size-4 text-[#E91E63]" /> {monthLabel}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => shift(-1)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Previous month"
          >
            <FiChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={() => shift(1)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            aria-label="Next month"
          >
            <FiChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d} className="text-center text-[9px] font-semibold uppercase text-slate-400">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />;
            const iso = toISODate(cell);
            const status = marks.get(iso);
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                title={status ? `${cell.toDateString()} — ${status}` : cell.toDateString()}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] transition-colors ${
                  status === "PRESENT"
                    ? "bg-emerald-500 text-white font-bold"
                    : status === "ABSENT"
                      ? "bg-rose-500 text-white font-bold"
                      : isToday
                        ? "bg-slate-200/70 text-slate-700 font-semibold"
                        : "bg-slate-50 text-slate-500"
                }`}
              >
                <span>{cell.getDate()}</span>
                {isToday && <span className="text-[7px] font-semibold uppercase">today</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Studied / Present
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" /> Absent
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-100" /> No record
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminAttendancePage() {
  const [tab, setTab] = useState<Tab>("student");
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/attendance?type=${tab}`);
        const data = await res.json();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const activeTab = TABS.find((t) => t.id === tab);

  const stats = useMemo(() => {
    const total = rows.length;
    const present = rows.filter((r) => r.status === "PRESENT").length;
    const absent = rows.filter((r) => r.status === "ABSENT").length;
    return { total, present, absent };
  }, [rows]);

  // Group the flat attendance records by person (student or teacher) for the current tab.
  const people = useMemo(() => {
    const map = new Map<number, Person>();
    for (const r of rows) {
      const p = tab === "teacher" ? r.teacher : r.student;
      if (!p) continue;
      let person = map.get(p.id);
      if (!person) {
        person = {
          id: p.id,
          name: p.user.name,
          email: p.user.email,
          branch: p.branch,
          phone: p.phone,
          records: [],
          present: 0,
          absent: 0,
        };
        map.set(p.id, person);
      }
      person.records.push(r);
      if (r.status === "PRESENT") person.present++;
      else if (r.status === "ABSENT") person.absent++;
    }
    return Array.from(map.values()).sort((a, b) => b.records.length - a.records.length || a.name.localeCompare(b.name));
  }, [rows, tab]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [people, search]);

  const selected = useMemo(() => people.find((p) => p.id === selectedId) || null, [people, selectedId]);

  function handleTabChange(next: Tab) {
    setTab(next);
    setSelectedId(null);
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Attendance Records</h1>
        <p className="text-slate-500 mt-1 text-sm">Select a student or teacher to view their attendance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              tab === t.id
                ? "border-[#E91E63] bg-rose-50/50 shadow-md shadow-rose-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className={`text-[13px] font-semibold ${tab === t.id ? "text-[#E91E63]" : "text-slate-700"}`}>{t.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <p className="text-base font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Total Records</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm p-4">
          <p className="text-base font-bold text-emerald-700">{stats.present}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 shadow-sm p-4">
          <p className="text-base font-bold text-rose-700">{stats.absent}</p>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Absent</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <FiUsers className="size-8 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* People list */}
          <div className="lg:col-span-2 rounded-[28px] bg-white p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-semibold text-[#E91E63] uppercase tracking-widest flex items-center gap-2">
                <FiUsers /> {tab === "teacher" ? "Teachers" : "Students"}
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">{filteredPeople.length}</span>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tab === "teacher" ? "teachers" : "students"}...`}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
              />
            </div>
            <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-1">
              {filteredPeople.map((p) => {
                const isActive = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(isActive ? null : p.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      isActive ? "border-[#E91E63] bg-[#fff0f3] shadow-sm" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center font-semibold shrink-0 ${
                        isActive ? "bg-[#E91E63] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <FiMail className="size-3 shrink-0" /> {p.email}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                          <FiCalendar className="size-2.5" /> {p.records.length}
                        </span>
                        {p.present > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">
                            <FiCheckCircle className="size-2.5" /> {p.present}
                          </span>
                        )}
                        {p.absent > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                            <FiXCircle className="size-2.5" /> {p.absent}
                          </span>
                        )}
                      </p>
                    </div>
                    <FiChevronLeft className="size-4 rotate-180 text-slate-300 shrink-0" />
                  </button>
                );
              })}
              {filteredPeople.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  No {tab === "teacher" ? "teachers" : "students"} found.
                </p>
              )}
            </div>
          </div>

          {/* Detail */}
          {selected ? (
            <div className="lg:col-span-3 rounded-[28px] bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-tr from-slate-50 to-white">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#FF5733] to-[#E91E63] text-white flex items-center justify-center text-lg font-black shrink-0">
                    {selected.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{selected.name}</h2>
                    <p className="text-xs text-slate-500 truncate">{selected.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      {selected.branch && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-slate-600">
                          <FiMapPin className="size-2.5" /> {selected.branch}
                        </span>
                      )}
                      {selected.phone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-slate-600">
                          <FiPhone className="size-2.5" /> {selected.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                      <FiCheckCircle className="size-3.5" /> {selected.present} Present
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5 text-[11px] font-semibold text-rose-700">
                      <FiXCircle className="size-3.5" /> {selected.absent} Absent
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <FiCheckCircle className="size-3.5" /> {selected.present} days studied
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-1.5 text-[11px] font-semibold text-rose-700">
                    <FiXCircle className="size-3.5" /> {selected.absent} absent
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                    <FiCalendar className="size-3.5" /> {selected.records.length} total
                  </span>
                </div>

                <AttendanceCalendar records={selected.records} />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    {tab === "student" ? "Recorded by teachers" : tab === "self" ? "Self-reported by student" : "Self-marked by teacher"}
                  </p>
                  {selected.records.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl border border-slate-100 bg-slate-50/40">
                      <FiUser className="size-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 italic text-sm">No attendance records yet.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Date</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Day</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Status</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Time Used</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selected.records.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">
                                {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-500">
                                {new Date(r.date).toLocaleDateString("en-US", { weekday: "long" })}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={r.status} />
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-600 whitespace-nowrap">
                                {r.timeUsed ? (
                                  <span className="inline-flex items-center gap-1">
                                    <FiClock className="size-3 text-slate-300" /> {r.timeUsed}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[220px] truncate">
                                {r.remarks || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 rounded-[28px] bg-white border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <FiUsers className="size-8 text-slate-300" />
              </div>
              <p className="text-[13px] font-semibold text-slate-600">Select a {tab === "teacher" ? "teacher" : "student"} to view their attendance</p>
              <p className="text-xs text-slate-400 mt-1">
                Click a name on the left to see their records, time used and remarks.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
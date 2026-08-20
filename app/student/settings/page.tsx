"use client";

import { useEffect, useMemo, useState } from "react";
import { FiLoader, FiCheckCircle, FiAlertCircle, FiSave, FiCalendar, FiClock, FiUser, FiMail, FiBookOpen } from "react-icons/fi";
import { DAYS_OF_WEEK, buildPreferredTime, parseTimeSlots } from "@/app/lib/schedule";
import AccountSettings from "@/app/components/AccountSettings";
import NotificationSettings from "@/app/components/NotificationSettings";

interface SlotState {
  from: string;
  to: string;
}

const DEFAULT_FROM = "08:00";
const DEFAULT_TO = "10:00";

export default function StudentSettingsPage() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    preferredDays: string;
    preferredTime: string;
    program?: string;
    subjects?: string;
    teacherName?: string | null;
  } | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/student/settings");
      const data = await res.json();
      if (!cancelled) {
        if (data && data.preferredDays !== undefined) {
          setProfile(data);
          const parsed = parseTimeSlots(data.preferredTime);
          const dayList = (data.preferredDays || "")
            .split(",")
            .map((d: string) => d.trim())
            .filter(Boolean);
          setDays(dayList);
          const slotMap: Record<string, SlotState> = {};
          parsed.forEach((p) => {
            slotMap[p.day] = { from: p.from, to: p.to };
          });
          dayList.forEach((d: string) => {
            if (!slotMap[d]) slotMap[d] = { from: DEFAULT_FROM, to: DEFAULT_TO };
          });
          setSlots(slotMap);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDay = (day: string) => {
    setDays((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((d) => d !== day);
        setSlots((s) => {
          const copy = { ...s };
          delete copy[day];
          return copy;
        });
        return next;
      }
      setSlots((s) => ({ ...s, [day]: { from: DEFAULT_FROM, to: DEFAULT_TO } }));
      return [...prev, day];
    });
  };

  const setSlot = (day: string, key: keyof SlotState, value: string) => {
    setSlots((prev) => ({ ...prev, [day]: { ...prev[day], [key]: value } }));
  };

  const summary = useMemo(() => {
    return DAYS_OF_WEEK.filter((d) => days.includes(d)).map((d) => {
      const slot = slots[d];
      return { day: d, from: slot?.from ?? "", to: slot?.to ?? "" };
    });
  }, [days, slots]);

  const handleSave = async () => {
    if (saving) return;
    const timeSlots = summary.map((s) => ({ day: s.day, from: s.from, to: s.to }));
    const preferredTime = buildPreferredTime(timeSlots);
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/student/settings", {
        method: "PUT",
        body: JSON.stringify({ preferredDays: days.join(", "), preferredTime }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ success: true, text: data.message || "Schedule saved!" });
        setProfile((p) => (p ? { ...p, preferredDays: data.preferredDays, preferredTime: data.preferredTime } : p));
      } else {
        setStatus({ success: false, text: data.message || "Failed to save schedule" });
      }
    } catch {
      setStatus({ success: false, text: "Failed to save schedule" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Update your preferred days and time slots. Your teacher uses this schedule for attendance.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 flex justify-center">
          <FiLoader className="size-6 animate-spin text-slate-400" />
        </div>
      ) : !profile ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-500 font-semibold">Could not load your profile.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Account</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <FiUser className="size-4 text-slate-400" />
                  <span className="font-semibold">{profile.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <FiMail className="size-4 text-slate-400" />
                  {profile.email}
                </div>
                {(profile.program || profile.subjects) && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <FiBookOpen className="size-4 text-slate-400" />
                    {[profile.program, profile.subjects].filter(Boolean).join(" · ")}
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <FiUser className="size-4 text-slate-400" />
                  {profile.teacherName ? `Assigned to ${profile.teacherName}` : "No teacher assigned yet"}
                </div>
              </div>
            </div>

            <AccountSettings />

            <NotificationSettings />

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Preferred Schedule</h2>
                <p className="text-xs text-slate-500 mt-0.5">Pick the days you study and the time you prefer each day.</p>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                    <FiCalendar className="size-3.5" /> Preferred Days
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const active = days.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                            active
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {days.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                      <FiClock className="size-3.5" /> Preferred Times
                    </p>
                    <div className="space-y-2.5">
                      {DAYS_OF_WEEK.filter((d) => days.includes(d)).map((day) => (
                        <div
                          key={day}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                        >
                          <span className="text-sm font-bold text-slate-700 w-28">{day}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slots[day]?.from ?? DEFAULT_FROM}
                              onChange={(e) => setSlot(day, "from", e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="time"
                              value={slots[day]?.to ?? DEFAULT_TO}
                              onChange={(e) => setSlot(day, "to", e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/10"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No days selected yet. Save with no days to clear your schedule.</p>
                )}

                {status && (
                  <p
                    className={`text-xs font-bold flex items-center gap-1.5 ${status.success ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {status.success ? <FiCheckCircle /> : <FiAlertCircle />}
                    {status.text}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E91E63] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#7B1FA2] transition-all disabled:opacity-50"
                >
                  {saving ? <FiLoader className="size-4 animate-spin" /> : <FiSave className="size-4" />}
                  Save Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Your Weekly Plan</h2>
              </div>
              <div className="p-5">
                {summary.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No sessions planned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.map((s) => (
                      <div
                        key={s.day}
                        className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5"
                      >
                        <span className="text-sm font-bold text-slate-800">{s.day}</span>
                        <span className="text-xs font-black text-emerald-700">{s.from} - {s.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
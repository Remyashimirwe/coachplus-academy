"use client";

import { useEffect, useState } from "react";
import { FiLoader, FiUser, FiMail, FiPhone, FiBookOpen, FiUsers } from "react-icons/fi";
import AccountSettings from "@/app/components/AccountSettings";
import NotificationSettings from "@/app/components/NotificationSettings";

interface TeacherProfile {
  name: string;
  email: string;
  image: string | null;
  phone: string;
  subjects: string;
  studentCount: number;
}

export default function TeacherSettingsPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/settings");
        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch {
        // leave profile null
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your profile picture, password, and account details.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 flex justify-center">
          <FiLoader className="size-6 animate-spin text-slate-400" />
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
                  <span className="font-semibold">{profile?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <FiMail className="size-4 text-slate-400" />
                  {profile?.email}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <FiPhone className="size-4 text-slate-400" />
                    {profile.phone}
                  </div>
                )}
                {profile?.subjects && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <FiBookOpen className="size-4 text-slate-400" />
                    {profile.subjects}
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <FiUsers className="size-4 text-slate-400" />
                  {profile ? `${profile.studentCount} assigned student${profile.studentCount === 1 ? "" : "s"}` : "..."}
                </div>
              </div>
            </div>

            <AccountSettings />

            <NotificationSettings />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Tip</h2>
              </div>
              <div className="p-5 text-sm text-slate-500 leading-relaxed">
                Use a clear photo so your students can easily recognize you. Mark your attendance from the{" "}
                <span className="font-bold text-slate-700">My Attendance</span> page.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

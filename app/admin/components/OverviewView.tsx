"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiBook,
  FiMessageSquare,
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
  FiLoader,
  FiAlertCircle,
  FiArrowRight,
  FiUserPlus,
} from "react-icons/fi";
import { useToast } from "@/app/components/ToastProvider";

export default function OverviewView({ programs, requests, teacherApplications, pendingApplications }: any) {
  const [isMounted, setIsMounted] = useState(false);
  const [pending, setPending] = useState<any[]>(pendingApplications || []);
  const [decisionId, setDecisionId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const toast = useToast();

  useEffect(() => setIsMounted(true), []);

  async function handleQuickDecision(id: number, action: "approve" | "deny") {
    setDecisionId(id);
    setRowError((prev) => ({ ...prev, [id]: "" }));
    const applicant = pending.find((a: any) => a.id === id);
    const name = applicant?.fullName || "This applicant";
    try {
      const res = await fetch(`/api/admin/teacher-applications/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== id));
        toast.success(data.message || `${name} ${action === "approve" ? "was approved" : "was denied"}.`);
      } else {
        const message = data.message || `Failed to ${action}`;
        setRowError((prev) => ({ ...prev, [id]: message }));
        toast.error(message);
      }
    } catch {
      setRowError((prev) => ({ ...prev, [id]: `Failed to ${action}` }));
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setDecisionId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin! Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Categories", value: programs.length, icon: FiBook, color: "bg-blue-500" },
          { label: "Teacher Requests", value: requests.length, icon: FiMessageSquare, color: "bg-rose-500" },
          { label: "Applications", value: teacherApplications.length, icon: FiUsers, color: "bg-indigo-500" },
          { label: "Active Sub-categories", value: programs.reduce((acc: any, p: any) => acc + p.subjects.length, 0), icon: FiActivity, color: "bg-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-inherit/20`}>
                <stat.icon className="size-6" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <FiTrendingUp className="size-3" />
                +12%
              </span>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</h3>
              <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users/add"
          className="flex items-center gap-4 rounded-3xl bg-[#0f172a] text-white p-6 shadow-sm hover:shadow-lg transition-all group"
        >
          <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#E91E63] transition-all">
            <FiUserPlus className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Invite a Teacher or Student</p>
            <p className="text-[11px] text-slate-400">They'll set their own password to sign in</p>
          </div>
          <FiArrowRight className="shrink-0 opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/admin/users/assign"
          className="flex items-center gap-4 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all group"
        >
          <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <FiUserCheck className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">Assign Students to Teachers</p>
            <p className="text-[11px] text-slate-500">Click-to-assign in seconds</p>
          </div>
          <FiArrowRight className="shrink-0 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Pending Teacher Approvals */}
      {pending.length > 0 && (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-amber-200">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              Pending Teacher Approvals
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{pending.length}</span>
            </h2>
            <Link href="/admin/teachers" className="text-[13px] font-semibold text-[#E91E63] hover:underline flex items-center gap-1">
              View All <FiArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {pending.map((app) => {
              const isBusy = decisionId === app.id;
              return (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="size-11 rounded-xl bg-white flex items-center justify-center font-semibold text-indigo-500 shadow-sm shrink-0">
                    {app.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{app.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {app.subjects} • {isMounted ? new Date(app.created_at).toLocaleDateString() : "..."}
                    </p>
                    {rowError[app.id] && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <FiAlertCircle className="size-3" /> {rowError[app.id]}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickDecision(app.id, "deny")}
                      disabled={isBusy}
                      title="Deny"
                      className="p-2.5 rounded-xl bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? <FiLoader className="size-4 animate-spin" /> : <FiUserX className="size-4" />}
                    </button>
                    <button
                      onClick={() => handleQuickDecision(app.id, "approve")}
                      disabled={isBusy}
                      title="Approve & Invite"
                      className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? <FiLoader className="size-4 animate-spin" /> : <FiUserCheck className="size-4" />}
                    </button>
                    <Link
                      href="/admin/teachers"
                      className="px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-all flex items-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-6">Recent Teacher Requests</h2>
          <div className="space-y-4">
            {requests.slice(0, 5).map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white flex items-center justify-center font-semibold text-rose-500 shadow-sm">
                    {req.parent_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{req.parent_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {req.grade} • {isMounted ? new Date(req.created_at).toLocaleDateString() : '...'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">
                  {req.status}
                </span>
              </div>
            ))}
            {requests.length === 0 && <p className="text-[13px] text-slate-400 italic">No recent requests.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-6">System Activity</h2>
          <div className="space-y-6">
            {[
              { label: "New Program Added", time: "2 hours ago", icon: FiActivity, color: "text-blue-500" },
              { label: "Teacher Application Received", time: "5 hours ago", icon: FiUsers, color: "text-indigo-500" },
              { label: "Database Backup Completed", time: "Yesterday", icon: FiActivity, color: "text-emerald-500" },
              { label: "New Parent Request", time: "2 days ago", icon: FiMessageSquare, color: "text-rose-500" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative">
                  <div className={`size-10 rounded-xl bg-slate-50 ${activity.color} flex items-center justify-center z-10 relative`}>
                    <activity.icon className="size-5" />
                  </div>
                  {i !== 3 && <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-100" />}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{activity.label}</p>
                  <p className="text-[11px] text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

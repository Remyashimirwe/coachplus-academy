"use client";

import { useEffect, useState } from "react";
import {
  FiBook,
  FiMessageSquare,
  FiUsers,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";

export default function OverviewView({ programs, requests, teacherApplications }: any) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
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
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <FiTrendingUp className="size-3" />
                +12%
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Teacher Requests</h2>
          <div className="space-y-4">
            {requests.slice(0, 5).map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white flex items-center justify-center font-bold text-rose-500 shadow-sm">
                    {req.parent_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{req.parent_name}</p>
                    <p className="text-xs text-slate-500">
                      {req.grade} • {isMounted ? new Date(req.created_at).toLocaleDateString() : '...'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">
                  {req.status}
                </span>
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm text-slate-400 italic">No recent requests.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">System Activity</h2>
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
                  <p className="text-sm font-bold text-slate-900">{activity.label}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiLoader,
  FiAlertCircle,
  FiUsers,
  FiInbox,
  FiCheckCircle,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import TeacherApplicationModal from "./TeacherApplicationModal";

function documentUrl(docId: number) {
  return `/api/admin/teacher-applications/documents/${docId}`;
}

export default function TeachersView({ teacherApplications }: any) {
  const [applications, setApplications] = useState<any[]>(teacherApplications);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rowDecision, setRowDecision] = useState<Record<number, "approve" | "deny" | null>>({});
  const [rowError, setRowError] = useState<Record<number, string | undefined>>({});

  const selectedApp = applications.find((a) => a.id === selectedId) || null;

  const stats = useMemo(() => {
    const pending = applications.filter((a) => a.status === "pending").length;
    const approved = applications.filter((a) => a.status === "approved").length;
    return [
      { label: "Total Applications", value: applications.length, icon: FiUsers, color: "bg-indigo-500" },
      { label: "Pending Review", value: pending, icon: FiInbox, color: "bg-amber-500" },
      { label: "Approved Teachers", value: approved, icon: FiCheckCircle, color: "bg-emerald-500" },
    ];
  }, [applications]);

  function handleApproved(id: number) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
  }

  function handleDenied(id: number) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  async function handleQuickApprove(appId: number) {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    if (!confirm(`Approve ${app.fullName} as an official teacher? An account will be created and an activation email will be sent.`)) return;

    setRowDecision((prev) => ({ ...prev, [appId]: "approve" }));
    setRowError((prev) => ({ ...prev, [appId]: undefined }));
    try {
      const res = await fetch(`/api/admin/teacher-applications/${appId}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        handleApproved(appId);
      } else {
        setRowError((prev) => ({ ...prev, [appId]: data.message || "Failed to approve application" }));
      }
    } catch {
      setRowError((prev) => ({ ...prev, [appId]: "Failed to approve application" }));
    } finally {
      setRowDecision((prev) => ({ ...prev, [appId]: null }));
    }
  }

  async function handleQuickDeny(appId: number) {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    if (!confirm(`Deny ${app.fullName}'s application? This will permanently remove it from the database.`)) return;

    setRowDecision((prev) => ({ ...prev, [appId]: "deny" }));
    setRowError((prev) => ({ ...prev, [appId]: undefined }));
    try {
      const res = await fetch(`/api/admin/teacher-applications/${appId}/deny`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        handleDenied(appId);
      } else {
        setRowError((prev) => ({ ...prev, [appId]: data.message || "Failed to deny application" }));
      }
    } catch {
      setRowError((prev) => ({ ...prev, [appId]: "Failed to deny application" }));
    } finally {
      setRowDecision((prev) => ({ ...prev, [appId]: null }));
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Applications</h1>
        <p className="text-slate-500">Review, message, and decide on incoming teacher applications.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shrink-0 shadow-lg shadow-inherit/20`}>
                <stat.icon className="size-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{stat.label}</h3>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {applications.map((app: any) => {
          const isPending = app.status === "pending";
          const decision = rowDecision[app.id];
          return (
            <div
              key={app.id}
              className="flex flex-col gap-5 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                  {app.documents?.find((d: any) => d.kind === "photo") ? (
                    <img
                      src={documentUrl(app.documents.find((d: any) => d.kind === "photo").id)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    app.fullName.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{app.fullName}</h3>
                    <span
                      className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                        app.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{app.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FiClock className="text-indigo-500 shrink-0" /> {app.experienceYears} Years
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <FiMapPin className="text-rose-500 shrink-0" />
                  <span className="truncate">
                    {app.city}, {app.country} {app.location ? `(${app.location})` : ""}
                  </span>
                </span>
              </div>

              {rowError[app.id] && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <FiAlertCircle className="shrink-0" /> {rowError[app.id]}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                <a
                  href={`mailto:${app.email}`}
                  title="Email"
                  className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all"
                >
                  <FiMail className="size-4" />
                </a>
                <a
                  href={`tel:${app.phone}`}
                  title="Call"
                  className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all"
                >
                  <FiPhone className="size-4" />
                </a>
                {isPending && (
                  <>
                    <button
                      onClick={() => handleQuickDeny(app.id)}
                      disabled={decision != null}
                      title="Deny"
                      className="p-2.5 rounded-xl bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {decision === "deny" ? <FiLoader className="size-4 animate-spin" /> : <FiUserX className="size-4" />}
                    </button>
                    <button
                      onClick={() => handleQuickApprove(app.id)}
                      disabled={decision != null}
                      title="Approve & Invite"
                      className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {decision === "approve" ? <FiLoader className="size-4 animate-spin" /> : <FiUserCheck className="size-4" />}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedId(app.id)}
                  className="ml-auto px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
        {applications.length === 0 && (
          <div className="md:col-span-2 2xl:col-span-3 bg-white rounded-[40px] p-16 sm:p-20 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium italic">No applications found.</p>
          </div>
        )}
      </div>

      {selectedApp && (
        <TeacherApplicationModal
          app={selectedApp}
          onClose={() => setSelectedId(null)}
          onApproved={handleApproved}
          onDenied={handleDenied}
        />
      )}
    </div>
  );
}

"use client";

import { FiMail, FiPhone, FiMapPin, FiClock, FiUserCheck, FiUserX, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useState } from "react";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Teacher Applications</h1>
      <div className="grid gap-6">
        {applications.map((app: any) => {
          const isPending = app.status === "pending";
          const decision = rowDecision[app.id];
          return (
            <div key={app.id} className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="size-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
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
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{app.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <FiClock className="text-indigo-500" /> {app.experienceYears} Years
                      </p>
                      <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <FiMapPin className="text-rose-500" /> {app.city}, {app.country} {app.location ? `(${app.location})` : ""}
                      </p>
                      <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <FiMail className="text-slate-400" /> {app.email}
                      </p>
                    </div>
                    {rowError[app.id] && (
                      <p className="mt-1.5 text-xs font-bold text-rose-600 flex items-center gap-1.5">
                        <FiAlertCircle /> {rowError[app.id]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
                      app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a href={`mailto:${app.email}`} title="Email" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                      <FiMail className="size-5" />
                    </a>
                    <a href={`tel:${app.phone}`} title="Call" className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all">
                      <FiPhone className="size-5" />
                    </a>
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleQuickDeny(app.id)}
                          disabled={decision != null}
                          title="Deny"
                          className="p-3 rounded-2xl bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {decision === "deny" ? <FiLoader className="size-5 animate-spin" /> : <FiUserX className="size-5" />}
                        </button>
                        <button
                          onClick={() => handleQuickApprove(app.id)}
                          disabled={decision != null}
                          title="Approve & Invite"
                          className="p-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {decision === "approve" ? <FiLoader className="size-5 animate-spin" /> : <FiUserCheck className="size-5" />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedId(app.id)}
                      className="px-5 py-3 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {applications.length === 0 && (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
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

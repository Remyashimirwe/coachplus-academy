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
  FiSearch,
  FiBookOpen,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import TeacherApplicationModal from "./TeacherApplicationModal";

function documentUrl(docId: number) {
  return `/api/admin/teacher-applications/documents/${docId}`;
}

type GroupedSubject = { name: string; topics: string[] };
type GroupedCategory = { category: string; subjects: GroupedSubject[] };

function groupSubjects(raw: string): GroupedCategory[] {
  const categoryMap = new Map<string, Map<string, string[]>>();

  (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return;
      const category = entry.slice(0, idx).trim();
      const rest = entry.slice(idx + 1).trim();
      const dashIdx = rest.indexOf(" - ");
      let subject: string;
      let topic: string | null = null;
      if (dashIdx !== -1) {
        subject = rest.slice(0, dashIdx).trim();
        topic = rest.slice(dashIdx + 3).trim();
      } else {
        subject = rest;
      }
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const subjMap = categoryMap.get(category)!;
      if (!subjMap.has(subject)) subjMap.set(subject, []);
      if (topic) subjMap.get(subject)!.push(topic);
    });

  return Array.from(categoryMap.entries()).map(([category, subjMap]) => ({
    category,
    subjects: Array.from(subjMap.entries()).map(([name, topics]) => ({ name, topics })),
  }));
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "status", label: "By status" },
  { id: "name", label: "By name" },
];

export default function TeachersView({ teacherApplications }: any) {
  const [applications, setApplications] = useState<any[]>(teacherApplications);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rowDecision, setRowDecision] = useState<Record<number, "approve" | "deny" | null>>({});
  const [rowError, setRowError] = useState<Record<number, string | undefined>>({});
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState<"cards" | "table">("table");

  const selectedApp = applications.find((a) => a.id === selectedId) || null;

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) =>
      String(a.subjects || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .forEach((s: string) => set.add(s))
    );
    return Array.from(set).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = applications.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSearch =
        !q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchesSubject =
        !subjectFilter || String(a.subjects || "").toLowerCase().includes(subjectFilter.toLowerCase());
      return matchesStatus && matchesSearch && matchesSubject;
    });

    const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
    return list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "status":
          return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [applications, search, subjectFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const pending = applications.filter((a) => a.status === "pending").length;
    const approved = applications.filter((a) => a.status === "approved").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    return [
      { label: "Total Applications", value: applications.length, icon: FiUsers, color: "bg-indigo-500" },
      { label: "Pending Review", value: pending, icon: FiInbox, color: "bg-amber-500" },
      { label: "Accepted Teachers", value: approved, icon: FiCheckCircle, color: "bg-emerald-500" },
      { label: "Rejected", value: rejected, icon: FiUserX, color: "bg-rose-500" },
    ];
  }, [applications]);

  function handleApproved(id: number) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
  }

  function handleDenied(id: number) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));
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
    if (!confirm(`Deny ${app.fullName}'s application?`)) return;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Teacher Applications</h1>
          <p className="text-slate-500">Review, message, and decide on incoming teacher applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("cards")}
            className={`p-2.5 rounded-xl transition-all ${view === "cards" ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            title="Card view"
          >
            <FiGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2.5 rounded-xl transition-all ${view === "table" ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            title="Table view"
          >
            <FiList className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative w-full lg:w-72">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-tight transition-all ${
                statusFilter === f.id
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
        >
          <option value="">All subjects</option>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shrink-0 shadow-lg shadow-inherit/20`}>
                <stat.icon className="size-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest truncate">{stat.label}</h3>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {view === "table" ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-slate-400 font-medium italic">No applications found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500">Applicant</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500">Contact</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500">Subjects</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500">Experience</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500">Status</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app: any) => {
                    const isPending = app.status === "pending";
                    const decision = rowDecision[app.id];
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
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
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 truncate">{app.fullName}</p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[200px]">{app.email}</p>
                          {app.phone && <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{app.phone}</p>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 max-w-[260px]">
                          {groupSubjects(app.subjects).length > 0 ? (
                            <div className="space-y-2">
                              {groupSubjects(app.subjects).map((cat) => (
                                <div key={cat.category}>
                                  
                                  <p className="text-[11px] font-bold text-slate-700">{cat.category}</p>
                                  <ul className="ml-3 list-disc space-y-0.5 text-[10px] text-slate-500 marker:text-slate-300">
                                    {cat.subjects.map((sub) => (
                                      <li key={sub.name}>
                                        {sub.name}
                                        {sub.topics.length > 0 && (
                                          <span className="text-slate-400"> ({sub.topics.join(", ")})</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-slate-600">{app.experienceYears} yrs</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tighter ${
                              STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {app.status === "approved" ? <FiCheckCircle className="size-3" /> : app.status === "rejected" ? <FiUserX className="size-3" /> : <FiClock className="size-3" />}
                            {app.status === "approved" ? "Accepted" : app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {rowError[app.id] && (
                              <FiAlertCircle className="size-4 text-rose-500" title={rowError[app.id]} />
                            )}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleQuickDeny(app.id)}
                                  disabled={decision != null}
                                  title="Deny"
                                  className="p-2 rounded-lg bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {decision === "deny" ? <FiLoader className="size-3.5 animate-spin" /> : <FiUserX className="size-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleQuickApprove(app.id)}
                                  disabled={decision != null}
                                  title="Approve & Invite"
                                  className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {decision === "approve" ? <FiLoader className="size-3.5 animate-spin" /> : <FiUserCheck className="size-3.5" />}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedId(app.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-all"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filteredApplications.map((app: any) => {
            const isPending = app.status === "pending";
            const decision = rowDecision[app.id];
            return (
              <div
                key={app.id}
                className="flex flex-col gap-5 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-xl shrink-0 overflow-hidden">
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
                      <h3 className="text-base font-semibold text-slate-900 truncate">{app.fullName}</h3>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                          STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {app.status === "approved" ? "Accepted" : app.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5">
                      <FiMail className="size-3 shrink-0" /> {app.email}
                    </p>
                    {app.phone && (
                      <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5">
                        <FiPhone className="size-3 shrink-0" /> {app.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FiClock className="text-indigo-500 shrink-0" /> {app.experienceYears} Years
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FiMapPin className="text-rose-500 shrink-0" />
                    <span className="truncate">
                      {[app.district, app.province, app.country].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </div>

                {app.subjects && (
                  <div className="flex items-start gap-1.5 text-[11px] font-semibold text-slate-500">
                    <FiBookOpen className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{app.subjects}</span>
                  </div>
                )}

                {rowError[app.id] && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
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
                    className="ml-auto px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-[13px] font-semibold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
          {filteredApplications.length === 0 && (
            <div className="md:col-span-2 2xl:col-span-3 bg-white rounded-[40px] p-16 sm:p-20 text-center border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-medium italic">No applications found.</p>
            </div>
          )}
        </div>
      )}

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

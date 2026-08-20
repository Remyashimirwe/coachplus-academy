"use client";

import {
  FiMail,
  FiPhone,
  FiClock,
  FiSearch,
  FiInbox,
  FiSend,
  FiCheckCircle,
  FiAward,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import RequestDetailModal from "./RequestDetailModal";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-indigo-100 text-indigo-700",
  approved: "bg-sky-100 text-sky-700",
  assigned: "bg-violet-100 text-violet-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "approved", label: "Approved" },
  { id: "assigned", label: "Assigned" },
  { id: "resolved", label: "Resolved" },
];

export default function RequestsView({ requests, teachers }: any) {
  const [items, setItems] = useState<any[]>(requests);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const selectedRequest = items.find((r) => r.id === selectedId) || null;

  const stats = useMemo(() => {
    const newCount = items.filter((r) => r.status === "new").length;
    const contacted = items.filter((r) => r.status === "contacted").length;
    const assigned = items.filter((r) => r.status === "assigned").length;
    const resolved = items.filter((r) => r.status === "resolved").length;
    return [
      { label: "Total Requests", value: items.length, icon: FiInbox, color: "bg-indigo-500" },
      { label: "New", value: newCount, icon: FiClock, color: "bg-amber-500" },
      { label: "Contacted", value: contacted, icon: FiSend, color: "bg-indigo-500" },
      { label: "Assigned", value: assigned, icon: FiAward, color: "bg-violet-500" },
      { label: "Resolved", value: resolved, icon: FiCheckCircle, color: "bg-emerald-500" },
    ];
  }, [items]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    (teachers || []).forEach((t: any) =>
      String(t.subjects || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .forEach((s: string) => set.add(s))
    );
    return Array.from(set).sort();
  }, [teachers]);

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter || (filter === "new" && !r.status);
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.parent_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.subjects?.toLowerCase().includes(q);
      const matchesSubject = !subjectFilter || r.subjects?.toLowerCase().includes(subjectFilter.toLowerCase());
      return matchesFilter && matchesSearch && matchesSubject;
    });
  }, [items, filter, search, subjectFilter]);

  function handleUpdated(id: number, changes: any) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Teacher Requests</h1>
        <p className="text-slate-500">Review parent requests and reply straight from CoachPlus Academy by email.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`size-11 rounded-2xl ${stat.color} text-white flex items-center justify-center shrink-0 shadow-lg shadow-inherit/20`}>
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest truncate">{stat.label}</h3>
                <p className="text-base font-semibold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-tight transition-all ${
                filter === f.id
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, subject..."
              className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
          >
            <option value="">All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Student / Parent</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Grade</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Learning Mode</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Preferred Schedule</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Courses &amp; Topics</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((request: any) => (
                <tr key={request.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                        {request.parent_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{request.parent_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{request.email}</p>
                        {request.phone && <p className="text-[11px] text-slate-400 truncate">{request.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">{request.grade || "—"}</td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-600 whitespace-nowrap">{request.learningMode || "—"}</td>
                  <td className="px-5 py-3.5 text-[11px] text-slate-500 max-w-[220px] truncate">
                    {request.preferredTime || request.preferredDays || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-slate-600 max-w-[240px] truncate">
                    {request.subjects || "Not specified"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-tight whitespace-nowrap ${
                        STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {request.status || "new"}
                    </span>
                    {request.assignedTeacher && (
                      <p className="text-[10px] text-violet-600 mt-1 truncate">to {request.assignedTeacher.user.name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`mailto:${request.email}`}
                        title="Email client"
                        className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:text-[#E91E63] hover:bg-rose-50 border border-slate-100 transition-all"
                      >
                        <FiMail className="size-3.5" />
                      </a>
                      {request.phone && (
                        <a
                          href={`tel:${request.phone}`}
                          title="Call"
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:text-[#E91E63] hover:bg-rose-50 border border-slate-100 transition-all"
                        >
                          <FiPhone className="size-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedId(request.id)}
                        className="ml-1 px-3.5 py-2 rounded-lg bg-[#0f172a] text-white text-[11px] font-medium hover:bg-[#E91E63] transition-all whitespace-nowrap"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-slate-400 text-sm italic">No requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          teachers={teachers || []}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
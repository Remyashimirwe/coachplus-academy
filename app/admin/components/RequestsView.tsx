"use client";

import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSearch,
  FiInbox,
  FiSend,
  FiCheckCircle,
  FiUserCheck,
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

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter || (filter === "new" && !r.status);
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.parent_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.subjects?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, filter, search]);

  function handleUpdated(id: number, changes: any) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Requests</h1>
        <p className="text-slate-500">Review parent requests and reply straight from Coach Plus by email.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all ${
                filter === f.id
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((request: any) => (
          <div
            key={request.id}
            className="flex flex-col gap-5 rounded-[28px] bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl bg-rose-50 text-[#E91E63] flex items-center justify-center font-bold text-xl shrink-0">
                {request.parent_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{request.parent_name}</h3>
                  <span
                    className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                      STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {request.status || "new"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">{request.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
              {request.grade && (
                <span className="flex items-center gap-1.5 min-w-0">
                  <FiClock className="text-indigo-500 shrink-0" />
                  <span className="truncate">{request.grade}</span>
                </span>
              )}
              {(request.country || request.location) && (
                <span className="flex items-center gap-1.5 min-w-0">
                  <FiMapPin className="text-rose-500 shrink-0" />
                  <span className="truncate">
                    {[request.location, request.country].filter(Boolean).join(", ")}
                  </span>
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Courses & Topics</p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2">{request.subjects || "Not specified"}</p>
            </div>

            {request.assignedTeacher && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-violet-50 border border-violet-100">
                <FiUserCheck className="text-violet-500 shrink-0" />
                <p className="text-xs font-bold text-violet-700 truncate">
                  Assigned to {request.assignedTeacher.user.name}
                </p>
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
              <a
                href={`mailto:${request.email}`}
                title="Email client"
                className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all"
              >
                <FiMail className="size-4" />
              </a>
              {request.phone && (
                <a
                  href={`tel:${request.phone}`}
                  title="Call"
                  className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-[#E91E63] border border-slate-100 transition-all"
                >
                  <FiPhone className="size-4" />
                </a>
              )}
              <button
                onClick={() => setSelectedId(request.id)}
                className="ml-auto px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
              >
                View & Manage
              </button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-white rounded-[40px] p-16 sm:p-20 text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-medium italic">No requests found.</p>
          </div>
        )}
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

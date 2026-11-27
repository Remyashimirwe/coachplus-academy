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
  FiLoader,
  FiUserCheck,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";
import Link from "next/link";
import { useMemo, useState } from "react";
import BulkEmailModal from "./BulkEmailModal";
import { useToast } from "@/app/components/ToastProvider";
import {
  getCells,
  getDistricts,
  getProvinces,
  getSectors,
  getVillages,
} from "rwanda-locations";

type LocationField = "country" | "province" | "district" | "sector" | "cell" | "village";
type LocationFilters = Record<LocationField, string>;

const LOCATION_FIELDS: { id: LocationField; label: string }[] = [
  { id: "country", label: "Country" },
  { id: "province", label: "Province" },
  { id: "district", label: "District" },
  { id: "sector", label: "Sector" },
  { id: "cell", label: "Cell" },
  { id: "village", label: "Village" },
];

const EMPTY_LOCATION_FILTERS: LocationFilters = {
  country: "",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

function normalizeLocation(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function rwandaLocationOptions(field: LocationField, filters: LocationFilters): string[] {
  if (field === "country") return ["Rwanda"];
  if (filters.country && normalizeLocation(filters.country) !== "rwanda") return [];
  try {
    switch (field) {
      case "province": return getProvinces();
      case "district": return filters.province ? getDistricts(filters.province) : [];
      case "sector": return filters.province && filters.district ? getSectors(filters.province, filters.district) : [];
      case "cell": return filters.province && filters.district && filters.sector
        ? getCells(filters.province, filters.district, filters.sector)
        : [];
      case "village": return filters.province && filters.district && filters.sector && filters.cell
        ? getVillages(filters.province, filters.district, filters.sector, filters.cell)
        : [];
      default: return [];
    }
  } catch {
    return [];
  }
}

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

type RequestsViewProps = {
  requests: Array<{
    id: number;
    parent_name?: string;
    email?: string;
    phone?: string;
    status?: string;
    grade?: string;
    learningMode?: string;
    programTitle?: string;
    subjects?: string;
    [key: string]: unknown;
  }>;
  teachers?: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    subjects?: string;
  }>;
};

export default function RequestsView({ requests, teachers }: RequestsViewProps) {
  const [items, setItems] = useState<any[]>(requests);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [locationFilters, setLocationFilters] = useState<LocationFilters>(EMPTY_LOCATION_FILTERS);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [rowAction, setRowAction] = useState<Record<number, string | null>>({});
  const [rowError, setRowError] = useState<Record<number, string | undefined>>({});
  const toast = useToast();

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

  const locationOptions = useMemo(() => {
    return Object.fromEntries(LOCATION_FIELDS.map(({ id }) => {
      const existingValues = items
        .filter((request) => LOCATION_FIELDS.every(({ id: otherField }) =>
          otherField === id || !locationFilters[otherField] ||
          normalizeLocation(request[otherField]) === normalizeLocation(locationFilters[otherField]),
        ))
        .map((request) => String(request[id] ?? "").trim())
        .filter(Boolean);
      const unique = new Map<string, string>();
      [...rwandaLocationOptions(id, locationFilters), ...existingValues].forEach((value) => {
        if (!unique.has(normalizeLocation(value))) unique.set(normalizeLocation(value), value);
      });
      return [id, Array.from(unique.values()).sort((a, b) => a.localeCompare(b))];
    })) as Record<LocationField, string[]>;
  }, [items, locationFilters]);

  function updateLocationFilter(field: LocationField, value: string) {
    const fieldIndex = LOCATION_FIELDS.findIndex(({ id }) => id === field);
    setLocationFilters((current) => {
      const next = { ...current, [field]: value };
      LOCATION_FIELDS.slice(fieldIndex + 1).forEach(({ id }) => { next[id] = ""; });
      return next;
    });
  }

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
      const matchesLocation = LOCATION_FIELDS.every(({ id }) =>
        !locationFilters[id] || normalizeLocation(r[id]) === normalizeLocation(locationFilters[id]),
      );
      return matchesFilter && matchesSearch && matchesSubject && matchesLocation;
    });
  }, [items, filter, search, subjectFilter, locationFilters]);

  function handleUpdated(id: number, changes: any) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  async function handleQuickStatus(id: number, status: "contacted" | "resolved") {
    if (rowAction[id]) return;
    setRowAction((prev) => ({ ...prev, [id]: status }));
    setRowError((prev) => ({ ...prev, [id]: undefined }));
    try {
      const res = await fetch(`/api/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        handleUpdated(id, { status: data.status || status });
        toast.success(data.message || `Request marked ${status}.`);
      } else {
        const message = data.message || "Couldn't update the request status.";
        setRowError((prev) => ({ ...prev, [id]: message }));
        toast.error(message);
      }
    } catch {
      const message = "Couldn't reach the server. Check your connection and try again.";
      setRowError((prev) => ({ ...prev, [id]: message }));
      toast.error(message);
    } finally {
      setRowAction((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function handleQuickApprove(request: { id: number; parent_name?: string; studentId?: number | null; status?: string }) {
    if (rowAction[request.id]) return;
    if (!confirm(`Approve ${request.parent_name}'s request? A student account will be created and an activation email will be sent.`)) return;

    setRowAction((prev) => ({ ...prev, [request.id]: "approve" }));
    setRowError((prev) => ({ ...prev, [request.id]: undefined }));
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        handleUpdated(request.id, {
          status: data.status || "approved",
          studentId: data.student?.id,
          student: data.student,
        });
        if (data.inviteUrl) {
          try {
            await navigator.clipboard.writeText(data.inviteUrl);
            toast.success("Request approved. The activation email couldn't be sent, so the invite link was copied to your clipboard.");
          } catch {
            toast.success(`Request approved. Share this invite link manually: ${data.inviteUrl}`);
          }
        } else {
          toast.success(data.message || "Request approved!");
        }
      } else {
        const message = data.message || "Failed to approve request.";
        setRowError((prev) => ({ ...prev, [request.id]: message }));
        toast.error(message);
      }
    } catch {
      const message = "Couldn't reach the server. Check your connection and try again.";
      setRowError((prev) => ({ ...prev, [request.id]: message }));
      toast.error(message);
    } finally {
      setRowAction((prev) => ({ ...prev, [request.id]: null }));
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Teacher Requests</h1>
          <p className="text-xs text-slate-500">Review families looking for a teacher and narrow requests by location.</p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm sm:p-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Request status</p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-xl px-3.5 py-2 text-[11px] font-semibold transition-all ${
                  filter === f.id
                    ? "bg-[#0f172a] text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {f.label}
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${filter === f.id ? "bg-white/15" : "bg-white text-slate-500"}`}>
                  {f.id === "all" ? items.length : items.filter((request) => (f.id === "new" ? !request.status || request.status === "new" : request.status === f.id)).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or subject"
              aria-label="Search teacher requests"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
            />
          </label>
          <label>
            <span className="sr-only">Filter by subject</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by subject"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Location</p>
            {LOCATION_FIELDS.some(({ id }) => locationFilters[id]) && (
              <button type="button" onClick={() => setLocationFilters(EMPTY_LOCATION_FILTERS)} className="text-[11px] font-semibold text-[#E91E63] hover:underline">
                Clear location filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {LOCATION_FIELDS.map(({ id, label }) => (
              <label key={id} className="min-w-0">
                <span className="sr-only">Filter by {label}</span>
                <select
                  value={locationFilters[id]}
                  onChange={(event) => updateLocationFilter(id, event.target.value)}
                  aria-label={`Filter by ${label}`}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
                >
                  <option value="">All {id === "country" ? "countries" : `${label.toLowerCase()}s`}</option>
                  {locationOptions[id].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Choose any level or combine locations to narrow the requests.</p>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">Showing <span className="font-semibold text-slate-800">{filteredItems.length}</span> of {items.length} requests</p>
          <button
            type="button"
            onClick={() => setBulkEmailOpen(true)}
            disabled={!filteredItems.length || filteredItems.length > 250}
            title={filteredItems.length > 250 ? "Filter the list to 250 or fewer recipients" : "Compose an email to all filtered requests"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E91E63] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#d31655] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiMail className="size-4" /> Email {filteredItems.length} requests
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.color} text-white`}><stat.icon className="size-4" /></div>
              <div className="min-w-0">
                <h3 className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</h3>
                <p className="mt-0.5 text-base font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="w-[28%] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Applicant</th>
                <th className="w-[24%] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Contact</th>
                <th className="w-[13%] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</th>
                <th className="w-[35%] px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((request: any) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                        {String(request.parent_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-xs font-semibold text-slate-900" title={request.parent_name}>{request.parent_name}</p>
                        <p className="mt-0.5 max-w-[320px] truncate text-[11px] text-slate-500" title={[request.programTitle, request.grade, request.learningMode].filter(Boolean).join(" · ") || "Tutoring request"}>
                          {[request.programTitle || request.grade, request.learningMode].filter(Boolean).join(" · ") || "Tutoring request"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">Submitted {new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[260px] truncate text-[12px] font-semibold text-slate-700">{request.email}</p>
                    {request.phone && <p className="mt-1 text-[11px] text-slate-400">{request.phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tighter whitespace-nowrap ${
                        STATUS_STYLES[request.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {request.status || "new"}
                    </span>
                    {request.assignedTeacher && (
                      <p className="text-[10px] text-violet-600 mt-1 truncate">to {request.assignedTeacher.user.name}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {rowError[request.id] && (
                        <FiAlertCircle className="size-4 shrink-0 text-rose-500" title={rowError[request.id]} />
                      )}
                      <a
                        href={`mailto:${request.email}`}
                        title="Email family"
                        aria-label={`Email ${request.parent_name}`}
                        className="p-2 rounded-lg bg-white text-slate-600 hover:text-[#E91E63] hover:bg-rose-50 border border-slate-200 transition-all"
                      >
                        <FiMail className="size-3.5" />
                      </a>
                      {request.phone && (
                        <a
                          href={`tel:${request.phone}`}
                          title="Call"
                          aria-label={`Call ${request.parent_name}`}
                          className="p-2 rounded-lg bg-white text-slate-600 hover:text-[#E91E63] hover:bg-rose-50 border border-slate-200 transition-all"
                        >
                          <FiPhone className="size-3.5" />
                        </a>
                      )}
                      {(request.status === "new" || !request.status) && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(request.id, "contacted")}
                          disabled={rowAction[request.id] != null}
                          title="Mark as contacted"
                          aria-label={`Mark ${request.parent_name} as contacted`}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rowAction[request.id] === "contacted" ? <FiLoader className="size-3.5 animate-spin" /> : <FiSend className="size-3.5" />}
                        </button>
                      )}
                      {!request.studentId && request.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(request)}
                          disabled={rowAction[request.id] != null}
                          title="Approve & invite"
                          aria-label={`Approve ${request.parent_name}'s request`}
                          className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rowAction[request.id] === "approve" ? <FiLoader className="size-3.5 animate-spin" /> : <FiUserCheck className="size-3.5" />}
                        </button>
                      )}
                      {request.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(request.id, "resolved")}
                          disabled={rowAction[request.id] != null}
                          title="Mark as resolved"
                          aria-label={`Mark ${request.parent_name}'s request as resolved`}
                          className="p-2 rounded-lg bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rowAction[request.id] === "resolved" ? <FiLoader className="size-3.5 animate-spin" /> : <FiCheckCircle className="size-3.5" />}
                        </button>
                      )}
                      <Link
                        href={`/admin/requests/${request.id}`}
                        title="View all details"
                        className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[#E91E63] whitespace-nowrap"
                      >
                        <FiEye className="size-3.5" />
                        View all details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <p className="text-slate-400 text-sm italic">No requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bulkEmailOpen && (
        <BulkEmailModal
          recipientType="requests"
          recipientIds={filteredItems.map((request) => request.id)}
          onClose={() => setBulkEmailOpen(false)}
        />
      )}
    </div>
  );
}

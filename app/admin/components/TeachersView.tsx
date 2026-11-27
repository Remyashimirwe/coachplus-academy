"use client";

import {
  FiClock,
  FiUserCheck,
  FiUserX,
  FiLoader,
  FiAlertCircle,
  FiUsers,
  FiInbox,
  FiCheckCircle,
  FiSearch,
  FiMail,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import Link from "next/link";
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
    // Keep application-entered locations available if older values do not
    // match a name in the current Rwanda administrative data.
    return [];
  }
}

function documentUrl(docId: number) {
  return `/api/admin/teacher-applications/documents/${docId}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  documents_needed: "bg-orange-100 text-orange-700",
  shortlisted: "bg-indigo-100 text-indigo-700",
  assessment_scheduled: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  documents_needed: "Documents needed",
  shortlisted: "Shortlisted",
  assessment_scheduled: "Assessment scheduled",
  approved: "Accepted",
  rejected: "Rejected",
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "documents_needed", label: "Documents" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "assessment_scheduled", label: "Assessment" },
  { id: "approved", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "status", label: "By status" },
  { id: "name", label: "By name" },
  { id: "country", label: "By country" },
  { id: "province", label: "By province" },
  { id: "district", label: "By district" },
  { id: "sector", label: "By sector" },
  { id: "cell", label: "By cell" },
  { id: "village", label: "By village" },
];

export default function TeachersView({ teacherApplications }: any) {
  const [applications, setApplications] = useState<any[]>(teacherApplications);
  const [rowDecision, setRowDecision] = useState<Record<number, "approve" | "deny" | null>>({});
  const [rowError, setRowError] = useState<Record<number, string | undefined>>({});
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [locationFilters, setLocationFilters] = useState<LocationFilters>(EMPTY_LOCATION_FILTERS);
  const toast = useToast();


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

  const locationOptions = useMemo(() => {
    return Object.fromEntries(LOCATION_FIELDS.map(({ id }) => {
      const existingValues = applications
        .filter((application) => LOCATION_FIELDS.every(({ id: otherField }) =>
          otherField === id || !locationFilters[otherField] ||
          normalizeLocation(application[otherField]) === normalizeLocation(locationFilters[otherField]),
        ))
        .map((application) => String(application[id] ?? "").trim())
        .filter(Boolean);
      const canonicalValues = rwandaLocationOptions(id, locationFilters);
      const unique = new Map<string, string>();
      [...canonicalValues, ...existingValues].forEach((value) => {
        if (!unique.has(normalizeLocation(value))) unique.set(normalizeLocation(value), value);
      });
      return [id, Array.from(unique.values()).sort((a, b) => a.localeCompare(b))];
    })) as Record<LocationField, string[]>;
  }, [applications, locationFilters]);

  function updateLocationFilter(field: LocationField, value: string) {
    const fieldIndex = LOCATION_FIELDS.findIndex(({ id }) => id === field);
    setLocationFilters((current) => {
      const next = { ...current, [field]: value };
      LOCATION_FIELDS.slice(fieldIndex + 1).forEach(({ id }) => { next[id] = ""; });
      return next;
    });
  }

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = applications.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSearch =
        !q || String(a.fullName ?? "").toLowerCase().includes(q) || String(a.email ?? "").toLowerCase().includes(q);
      const matchesSubject =
        !subjectFilter || String(a.subjects || "").toLowerCase().includes(subjectFilter.toLowerCase());
      const matchesLocation = LOCATION_FIELDS.every(({ id }) =>
        !locationFilters[id] || normalizeLocation(a[id]) === normalizeLocation(locationFilters[id]),
      );
      return matchesStatus && matchesSearch && matchesSubject && matchesLocation;
    });

    const statusOrder: Record<string, number> = {
      pending: 0,
      documents_needed: 1,
      shortlisted: 2,
      assessment_scheduled: 3,
      approved: 4,
      rejected: 5,
    };
    return list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "status":
          return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "country":
        case "province":
        case "district":
        case "sector":
        case "cell":
        case "village":
          return String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), undefined, { sensitivity: "base" });
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [applications, search, subjectFilter, statusFilter, sortBy, locationFilters]);

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
        toast.success(data.message || `${app.fullName} was approved.`);
      } else {
        const message = data.message || "Failed to approve application";
        setRowError((prev) => ({ ...prev, [appId]: message }));
        toast.error(message);
      }
    } catch {
      setRowError((prev) => ({ ...prev, [appId]: "Failed to approve application" }));
      toast.error("Couldn't reach the server. Check your connection and try again.");
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
        toast.success(data.message || `${app.fullName}'s application was denied.`);
      } else {
        const message = data.message || "Failed to deny application";
        setRowError((prev) => ({ ...prev, [appId]: message }));
        toast.error(message);
      }
    } catch {
      setRowError((prev) => ({ ...prev, [appId]: "Failed to deny application" }));
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setRowDecision((prev) => ({ ...prev, [appId]: null }));
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Teacher Applications</h1>
          <p className="text-xs text-slate-500">Review applications and update each candidate.</p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
        <div className="relative w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants by name or email address"
            aria-label="Search teacher applications by name or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
          />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Filter by application status</p>
          <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${statusFilter === f.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                {f.id === "all" ? applications.length : applications.filter((app) => app.status === f.id).length}
              </span>
            </button>
          ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Filter by location</p>
            {LOCATION_FIELDS.some(({ id }) => locationFilters[id]) && (
              <button
                type="button"
                onClick={() => setLocationFilters(EMPTY_LOCATION_FILTERS)}
                className="text-[11px] font-semibold text-[#E91E63] hover:underline"
              >
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
                  {locationOptions[id].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">Choose any location level, or combine levels to narrow the list.</p>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">Showing <span className="font-semibold text-slate-800">{filteredApplications.length}</span> of {applications.length} applications</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              Sort
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort applications"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              Subject
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                aria-label="Filter by subject"
                className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20"
              >
                <option value="">All subjects</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-xl ${stat.color} text-white flex items-center justify-center shrink-0`}>
                <stat.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</h3>
                <p className="mt-0.5 text-base font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Applicant</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app: any) => {
                    const isPending = app.status === "pending";
                    const decision = rowDecision[app.id];
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[200px]">{app.email}</p>
                          {app.phone && <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{app.phone}</p>}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tighter ${
                              STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {app.status === "approved" ? <FiCheckCircle className="size-3" /> : app.status === "rejected" ? <FiUserX className="size-3" /> : <FiClock className="size-3" />}
                            {STATUS_LABELS[app.status] || app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {rowError[app.id] && (
                              <FiAlertCircle className="size-4 text-rose-500" title={rowError[app.id]} />
                            )}
                            <a
                              href={`mailto:${app.email}`}
                              title={`Email ${app.fullName}`}
                              aria-label={`Email ${app.fullName}`}
                              className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-[#E91E63] transition-all"
                            >
                              <FiMail className="size-3.5" />
                            </a>
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
                            <Link href={`/admin/teachers/${app.id}`} className="px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-all">View</Link>
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

    </div>
  );
}


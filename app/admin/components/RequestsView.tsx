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

export default function RequestsView({ requests, teachers }: any) {
  const [items, setItems] = useState<any[]>(requests);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [locationFilters, setLocationFilters] = useState<LocationFilters>(EMPTY_LOCATION_FILTERS);

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

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Teacher Requests</h1>
          <p className="text-xs text-slate-500">Review families looking for a teacher and narrow requests by location.</p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredItems.length}</span> of {items.length} requests
        </p>
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

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or subject"
              aria-label="Search teacher requests"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#E91E63] focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20"
            />
          </label>
          <label>
            <span className="sr-only">Filter by subject</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter by subject"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="border-t border-slate-100 pt-4">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-[#E91E63] focus:bg-white focus:ring-2 focus:ring-[#E91E63]/20"
                >
                  <option value="">All {id === "country" ? "countries" : `${label.toLowerCase()}s`}</option>
                  {locationOptions[id].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Choose any level or combine locations to narrow the requests.</p>
        </div>
      </section>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Family</th>
                <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Learning request</th>
                <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Schedule &amp; location</th>
                <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-right text-[9px] font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((request: any) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                        {String(request.parent_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{request.parent_name}</p>
                        <p className="max-w-[190px] truncate text-[11px] font-medium text-slate-600">{request.email}</p>
                        <p className="text-[10px] text-slate-400">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[260px] truncate text-[12px] font-semibold text-slate-700">{request.subjects || "Subjects not specified"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{[request.grade, request.learningMode].filter(Boolean).join(" · ") || "Grade or mode not specified"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[240px] truncate text-[11px] font-medium text-slate-600">{[request.preferredDays, request.preferredTime].filter(Boolean).join(" · ") || "Schedule not specified"}</p>
                    <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-slate-400" title={[request.village, request.cell, request.sector, request.district, request.province, request.country].filter(Boolean).join(", ") || request.location || "Location not provided"}>
                      {[request.village, request.cell, request.sector, request.district, request.province, request.country].filter(Boolean).join(", ") || request.location || "Location not provided"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
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
                          className="p-2 rounded-lg bg-white text-slate-600 hover:text-[#E91E63] hover:bg-rose-50 border border-slate-200 transition-all"
                        >
                          <FiPhone className="size-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedId(request.id)}
                        className="ml-1 px-3 py-1.5 rounded-lg bg-[#0f172a] text-white text-[11px] font-semibold hover:bg-[#E91E63] transition-all whitespace-nowrap"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
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

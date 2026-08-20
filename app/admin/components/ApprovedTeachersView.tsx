"use client";

import { useMemo, useState } from "react";
import {
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBookOpen,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";

export default function ApprovedTeachersView({ teachers }: any) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t: any) =>
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q) ||
        String(t.subjects || "").toLowerCase().includes(q) ||
        String(t.branch || "").toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const stats = useMemo(() => {
    const active = teachers.filter((t: any) => !t.user.isFirstLogin).length;
    const pending = teachers.filter((t: any) => t.user.isFirstLogin).length;
    const withStudents = teachers.filter((t: any) => t._count.students > 0).length;
    return { total: teachers.length, active, pending, withStudents };
  }, [teachers]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Teachers</h1>
          <p className="text-slate-500 mt-1">
            Teachers whose applications were accepted and accounts created. {stats.total} total.
          </p>
        </div>
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:bg-[#E91E63] transition-all shadow-lg shadow-slate-200"
        >
          Teacher Applications <FiArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
              <FiUsers className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Teachers</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <FiCheckCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Activated</p>
              <p className="text-2xl font-black text-emerald-700">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <FiClock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Activation</p>
              <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <FiUsers className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">With Students</p>
              <p className="text-2xl font-black text-slate-900">{stats.withStudents}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-96">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, subject or branch..."
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
        />
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FiUsers className="size-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium italic">No approved teachers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Teacher</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Contact</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Branch</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Subjects</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Students</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Joined</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t: any) => {
                  const activated = !t.user.isFirstLogin;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                            {t.user.image ? (
                              <img src={t.user.image} alt="" className="size-full object-cover" />
                            ) : (
                              t.user.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{t.user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{t.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {t.phone ? (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <FiPhone className="size-3 text-slate-300 shrink-0" /> {t.phone}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <FiMapPin className="size-3 text-slate-300 shrink-0" /> {t.branch || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate">{t.subjects || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1">
                          <FiUsers className="size-3" /> {t._count.students}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(t.user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter ${
                            activated ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {activated ? <FiCheckCircle className="size-3" /> : <FiClock className="size-3" />}
                          {activated ? "Activated" : "Pending"}
                        </span>
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
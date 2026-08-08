"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiHome,
  FiMail,
  FiPhone,
  FiGrid,
} from "react-icons/fi";
import { logout } from "@/app/actions/auth";
import {
  addProgram,
  deleteProgram,
  updateRequestStatus,
} from "@/app/actions/admin";

export default function AdminDashboard({
  programs,
  requests,
}: {
  programs: { id: number; title: string; level: string; text: string; points: string[] }[];
  requests: {
    id: number;
    parent_name: string;
    email: string;
    phone: string;
    grade: string;
    subjects: string;
    details: string;
    status: string;
    created_at: string;
  }[];
}) {
  const [addState, addAction, addPending] = useActionState(
    addProgram,
    undefined as undefined | { error?: string; success?: boolean }
  );

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-medium">
            <img
              src="/logo.png"
              alt="WeCoach"
              className="size-10 rounded-xl object-contain shadow-sm"
            />
            <span className="text-xl tracking-tight text-[#0b1638]">
              WeCoach Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:border-[#1266f1] hover:text-[#1266f1]"
            >
              <FiHome className="size-4" />
              View Site
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0f172a] px-5 text-sm font-medium text-white transition hover:bg-[#1e293b]"
              >
                <FiLogOut className="size-4" />
                Logout
              </button>
            </form>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1266f1] to-[#4f8cff] text-white shadow-sm">
            <FiGrid className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-medium tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage programs and review teacher requests.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[24px] bg-white p-7 ring-1 ring-slate-100">
            <h2 className="text-xl font-medium">Add a Program</h2>

            {addState?.error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
                {addState.error}
              </p>
            )}
            {addState?.success && (
              <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 ring-1 ring-green-100">
                Program added successfully.
              </p>
            )}

            <form action={addAction} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="action" value="add" />
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Math Booster"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="level"
                  className="text-sm font-medium text-slate-700"
                >
                  Level
                </label>
                <input
                  id="level"
                  name="level"
                  required
                  placeholder="e.g. Grades 1-6"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="text"
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="text"
                  name="text"
                  rows={3}
                  required
                  placeholder="Short description of the program..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="points"
                  className="text-sm font-medium text-slate-700"
                >
                  Highlights (comma separated)
                </label>
                <input
                  id="points"
                  name="points"
                  required
                  placeholder="Homework coaching, Foundation skills"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1266f1] focus:ring-2 focus:ring-[#1266f1]/20"
                />
              </div>
              <button
                type="submit"
                disabled={addPending}
                className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1266f1] to-[#4f8cff] px-6 text-sm font-medium text-white shadow-[0_10px_24px_rgba(18,102,241,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <FiPlus className="size-4" />
                {addPending ? "Adding..." : "Add Program"}
              </button>
            </form>
          </section>

          <section className="rounded-[24px] bg-white p-7 ring-1 ring-slate-100">
            <h2 className="text-xl font-medium">Existing Programs</h2>
            <div className="mt-5 flex flex-col gap-3">
              {programs.map((program) => (
                <form
                  key={program.id}
                  action={deleteProgram}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <input type="hidden" name="id" value={program.id} />
                  <div>
                    <p className="text-sm font-medium">{program.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {program.level}
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${program.title}`}
                  >
                    <FiTrash2 className="size-4" />
                  </button>
                </form>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[24px] bg-white p-7 ring-1 ring-slate-100">
          <h2 className="text-xl font-medium">Teacher Requests</h2>
          <div className="mt-5 flex flex-col gap-3">
            {requests.length === 0 && (
              <p className="text-sm text-slate-400">
                No requests yet. Requests submitted through the website will
                appear here.
              </p>
            )}
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#eaf2ff] text-[#1266f1]">
                      {request.parent_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {request.parent_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {request.grade} • {request.subjects}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      request.status === "new"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {request.details}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FiMail className="size-3.5" />
                    {request.email}
                  </span>
                  {request.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <FiPhone className="size-3.5" />
                      {request.phone}
                    </span>
                  )}
                  <span className="text-slate-400">
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
                {request.status === "new" && (
                  <form action={updateRequestStatus} className="mt-4">
                    <input type="hidden" name="id" value={request.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center rounded-full bg-[#1266f1] px-4 text-xs font-medium text-white transition hover:bg-[#0d55ce]"
                    >
                      Mark as reviewed
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

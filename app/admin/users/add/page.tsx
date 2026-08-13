"use client";

import { useState } from "react";

export default function AddUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, role }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(
          data.message ||
            "Invitation sent successfully. They'll receive an email to set up their own password."
        );
        setName("");
        setEmail("");
      } else {
        const data = await res.json();
        setMessage(data.message || "Failed to invite user");
      }
    } catch (err) {
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold">Invite New Teacher or Student</h1>
      <p className="mb-6 text-sm text-slate-500">
        They'll receive an email invitation with a link to set up their own password.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-[#E91E63] focus:ring-[#E91E63]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-[#E91E63] focus:ring-[#E91E63]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-[#E91E63] focus:ring-[#E91E63]"
          >
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
        {message && <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#E91E63] py-2 font-bold text-white hover:bg-[#D81B60]"
        >
          Send Invitation
        </button>
      </form>
    </div>
  );
}

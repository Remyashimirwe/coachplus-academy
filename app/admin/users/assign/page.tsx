"use client";

import { useState, useEffect } from "react";

export default function AssignPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/teachers").then(res => res.json()).then(setTeachers);
    fetch("/api/admin/students").then(res => res.json()).then(setStudents);
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/users/assign", {
        method: "POST",
        body: JSON.stringify({ teacherId: parseInt(selectedTeacher), studentId: parseInt(selectedStudent) }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setMessage("Student assigned successfully");
      } else {
        const data = await res.json();
        setMessage(data.message || "Failed to assign");
      }
    } catch (err) {
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Assign Student to Teacher</h1>
      <form onSubmit={handleAssign} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Select Teacher</label>
          <select
            required
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="">Choose a teacher</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Select Student</label>
          <select
            required
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="">Choose a student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.user.name}</option>
            ))}
          </select>
        </div>
        {message && <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#E91E63] py-2 font-bold text-white hover:bg-[#D81B60]"
        >
          Assign
        </button>
      </form>
    </div>
  );
}

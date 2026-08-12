"use client";

import { useState, useEffect } from "react";

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/teacher/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setLoading(false);
      });
  }, []);

  const handleAttendance = async (studentId: number, status: string) => {
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        body: JSON.stringify({ studentId, status }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setMessage("Attendance marked successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Failed to mark attendance");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Mark Attendance</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Student Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 text-sm text-slate-700">{student.user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{student.user.email}</td>
                <td className="flex gap-2 px-6 py-4">
                  <button
                    onClick={() => handleAttendance(student.id, "PRESENT")}
                    className="rounded-lg bg-green-100 px-3 py-1 text-xs font-bold text-green-700 hover:bg-green-200"
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendance(student.id, "ABSENT")}
                    className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-200"
                  >
                    Absent
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="p-6 text-center text-slate-500">No students assigned to you.</p>}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/attendance")
      .then((res) => res.json())
      .then((data) => {
        setAttendances(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Attendance Records</h1>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Student</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Teacher</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {attendances.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{record.student.user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{record.teacher.user.name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                    record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendances.length === 0 && <p className="p-6 text-center text-slate-500">No attendance records found.</p>}
      </div>
    </div>
  );
}

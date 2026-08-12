"use client";

import Link from "next/link";
import { logout } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { FiHome, FiCalendar, FiLogOut } from "react-icons/fi";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#E91E63]">Student Panel</h2>
        </div>
        <nav className="mt-6 space-y-1 px-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors mb-6 border-b border-slate-100 pb-4"
          >
            <FiHome className="size-5" />
            <span className="font-medium">Back Home</span>
          </Link>
          <Link
            href="/student"
            className="flex items-center gap-3 rounded-xl px-4 py-2 text-slate-700 hover:bg-[#fff0f3] hover:text-[#E91E63]"
          >
            <FiCalendar className="size-5" />
            My Attendance
          </Link>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-slate-700 hover:bg-red-50 hover:text-red-600"
          >
            <FiLogOut className="size-5" />
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

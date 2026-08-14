"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiSettings,
  FiUserPlus,
  FiUserCheck,
  FiCalendar,
} from "react-icons/fi";
import DashboardLayout from "@/app/components/DashboardLayout";

const baseNavItems = [
  { id: "overview", label: "Overview", icon: FiGrid, href: "/admin" },
  { id: "users-add", label: "Invite User", icon: FiUserPlus, href: "/admin/users/add" },
  { id: "users-assign", label: "Assign Student", icon: FiUserCheck, href: "/admin/users/assign" },
  { id: "attendance", label: "View Attendance", icon: FiCalendar, href: "/admin/attendance" },
  { id: "programs", label: "Manage Learning", icon: FiBook, href: "/admin/programs" },
  { id: "requests", label: "Teacher Requests", icon: FiMessageSquare, href: "/admin/requests" },
  { id: "teachers", label: "Teacher Applications", icon: FiUsers, href: "/admin/teachers" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    async function loadPendingCount() {
      try {
        const res = await fetch("/api/admin/teacher-applications/pending-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPendingCount(data.count || 0);
      } catch {
        // ignore, badge is a non-critical enhancement
      }
    }
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoginPage, pathname]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main>
          {children}
        </main>
      </div>
    );
  }

  const navItems = baseNavItems.map((item) =>
    item.id === "teachers" && pendingCount > 0 ? { ...item, badge: pendingCount } : item
  );

  const currentNavItem = navItems.find(item => item.href === pathname);
  const title = currentNavItem ? currentNavItem.label : "Admin Dashboard";

  return (
    <DashboardLayout
      navItems={navItems}
      user={user}
      title={title}
    >
      {children}
    </DashboardLayout>
  );
}

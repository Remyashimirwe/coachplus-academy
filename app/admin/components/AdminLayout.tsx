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
  FiFlag,
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
  { id: "approved-teachers", label: "Approved Teachers", icon: FiUserCheck, href: "/admin/approved-teachers" },
  { id: "reports", label: "Student Reports", icon: FiFlag, href: "/admin/reports" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    async function loadPendingCounts() {
      try {
        const [appsRes, reportsRes, requestsRes] = await Promise.all([
          fetch("/api/admin/teacher-applications/pending-count"),
          fetch("/api/admin/reports/pending-count"),
          fetch("/api/admin/requests/new-count"),
        ]);
        if (appsRes.ok) {
          const data = await appsRes.json();
          if (!cancelled) setPendingCount(data.count || 0);
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          if (!cancelled) setPendingReports(data.count || 0);
        }
        if (requestsRes.ok) {
          const data = await requestsRes.json();
          if (!cancelled) setNewRequestsCount(data.count || 0);
        }
      } catch {
        // ignore, badge is a non-critical enhancement
      }
    }
    loadPendingCounts();
    const interval = setInterval(loadPendingCounts, 30000);
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

  const navItems = baseNavItems.map((item) => {
    if (item.id === "teachers" && pendingCount > 0) return { ...item, badge: pendingCount };
    if (item.id === "reports" && pendingReports > 0) return { ...item, badge: pendingReports };
    if (item.id === "requests" && newRequestsCount > 0) return { ...item, badge: newRequestsCount };
    return item;
  });

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

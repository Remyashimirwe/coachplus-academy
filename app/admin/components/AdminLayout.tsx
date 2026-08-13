"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiBook,
  FiUsers,
  FiMessageSquare,
  FiSettings,
  FiUserPlus,
  FiCalendar,
} from "react-icons/fi";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "overview", label: "Overview", icon: FiGrid, href: "/admin" },
  { id: "users-add", label: "Invite User", icon: FiUserPlus, href: "/admin/users/add" },
  { id: "users-assign", label: "Assign Student", icon: FiUserPlus, href: "/admin/users/assign" },
  { id: "attendance", label: "View Attendance", icon: FiCalendar, href: "/admin/attendance" },
  { id: "programs", label: "Manage Learning", icon: FiBook, href: "/admin/programs" },
  { id: "requests", label: "Teacher Requests", icon: FiMessageSquare, href: "/admin/requests" },
  { id: "teachers", label: "Teacher Applications", icon: FiUsers, href: "/admin/teachers" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main>
          {children}
        </main>
      </div>
    );
  }

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

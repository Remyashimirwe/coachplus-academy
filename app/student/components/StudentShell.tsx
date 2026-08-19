"use client";

import { ReactNode } from "react";
import { FiCalendar, FiGrid, FiFlag, FiSettings } from "react-icons/fi";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid, href: "/student", section: "Main" },
  { id: "attendance", label: "My Attendance", icon: FiCalendar, href: "/student/attendance", section: "Main" },
  { id: "report", label: "Report a Teacher", icon: FiFlag, href: "/student/report", section: "Main" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/student/settings", section: "Account" },
];

export default function StudentShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; role: string; email: string };
}) {
  return (
    <DashboardLayout navItems={navItems} user={user} fallbackTitle="Student Dashboard">
      {children}
    </DashboardLayout>
  );
}

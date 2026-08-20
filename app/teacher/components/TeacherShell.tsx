"use client";

import { ReactNode } from "react";
import { FiLayout, FiCheckSquare, FiUsers, FiSettings } from "react-icons/fi";
import DashboardLayout from "@/app/components/DashboardLayout";
import TeacherFiredBanner from "./TeacherFiredBanner";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiLayout, href: "/teacher", section: "Main" },
  { id: "students", label: "My Students", icon: FiUsers, href: "/teacher/students", section: "Main" },
  { id: "attendance", label: "My Attendance", icon: FiCheckSquare, href: "/teacher/attendance", section: "Main" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/teacher/settings", section: "Account" },
];

export default function TeacherShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; role: string; email: string };
}) {
  return (
    <DashboardLayout navItems={navItems} user={user} fallbackTitle="Teacher Dashboard">
      <TeacherFiredBanner />
      {children}
    </DashboardLayout>
  );
}

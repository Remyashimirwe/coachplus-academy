"use client";

import { ReactNode } from "react";
import { FiLayout, FiCheckSquare } from "react-icons/fi";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiLayout, href: "/teacher" },
  { id: "attendance", label: "Mark Attendance", icon: FiCheckSquare, href: "/teacher/attendance" },
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
      {children}
    </DashboardLayout>
  );
}

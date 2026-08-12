"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiLayout, FiCheckSquare } from "react-icons/fi";
import { getSession } from "@/app/lib/auth";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiLayout, href: "/teacher" },
  { id: "attendance", label: "Mark Attendance", icon: FiCheckSquare, href: "/teacher/attendance" },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    getSession().then((session) => {
      if (session) setUser(session.user);
    });
  }, []);

  if (!user) return null;

  const currentNavItem = navItems.find(item => item.href === pathname);
  const title = currentNavItem ? currentNavItem.label : "Teacher Dashboard";

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

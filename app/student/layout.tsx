"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiCalendar, FiGrid } from "react-icons/fi";
import { getSession } from "@/app/lib/auth";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid, href: "/student" },
  { id: "attendance", label: "My Attendance", icon: FiCalendar, href: "/student/attendance" },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    getSession().then((session) => {
      if (session) setUser(session.user);
    });
  }, []);

  if (!user) return null;

  const currentNavItem = navItems.find(item => item.href === pathname);
  const title = currentNavItem ? currentNavItem.label : "Student Dashboard";

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

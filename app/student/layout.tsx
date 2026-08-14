import { ReactNode } from "react";
import { FiCalendar, FiGrid, FiFlag } from "react-icons/fi";
import { requireStudent } from "@/app/lib/dal";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid, href: "/student" },
  { id: "attendance", label: "My Attendance", icon: FiCalendar, href: "/student/attendance" },
  { id: "report", label: "Report a Teacher", icon: FiFlag, href: "/student/report" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireStudent();

  return (
    <DashboardLayout navItems={navItems} user={user} fallbackTitle="Student Dashboard">
      {children}
    </DashboardLayout>
  );
}

import { ReactNode } from "react";
import { FiLayout, FiCheckSquare } from "react-icons/fi";
import { requireTeacher } from "@/app/lib/dal";
import DashboardLayout from "@/app/components/DashboardLayout";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: FiLayout, href: "/teacher" },
  { id: "attendance", label: "Mark Attendance", icon: FiCheckSquare, href: "/teacher/attendance" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireTeacher();

  return (
    <DashboardLayout navItems={navItems} user={user} fallbackTitle="Teacher Dashboard">
      {children}
    </DashboardLayout>
  );
}

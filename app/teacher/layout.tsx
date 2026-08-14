import { ReactNode } from "react";
import { requireTeacher } from "@/app/lib/dal";
import TeacherShell from "./components/TeacherShell";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireTeacher();

  return <TeacherShell user={user}>{children}</TeacherShell>;
}

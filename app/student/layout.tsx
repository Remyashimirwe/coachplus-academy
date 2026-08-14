import { ReactNode } from "react";
import { requireStudent } from "@/app/lib/dal";
import StudentShell from "./components/StudentShell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireStudent();

  return <StudentShell user={user}>{children}</StudentShell>;
}

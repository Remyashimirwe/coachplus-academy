import { requireAdmin } from "@/app/lib/dal";
import { db, getPrograms } from "@/app/lib/db";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const programs = getPrograms();
  const requests = db
    .prepare(
      "SELECT * FROM requests ORDER BY CASE status WHEN 'new' THEN 0 ELSE 1 END, created_at DESC"
    )
    .all() as {
    id: number;
    parent_name: string;
    email: string;
    phone: string;
    grade: string;
    subjects: string;
    details: string;
    status: string;
    created_at: string;
  }[];

  return <AdminDashboard programs={programs} requests={requests} />;
}

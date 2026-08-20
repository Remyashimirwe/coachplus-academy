import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import ApprovedTeachersView from "../components/ApprovedTeachersView";

export const dynamic = "force-dynamic";

export default async function ApprovedTeachersPage() {
  await requireAdmin();

  const teachers = await db.teacher.findMany({
    orderBy: { userId: "asc" },
    include: {
      user: true,
      _count: { select: { students: true } },
    },
  });

  return <ApprovedTeachersView teachers={teachers} />;
}
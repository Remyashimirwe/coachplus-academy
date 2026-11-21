import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import TeacherApplicationDetail from "../../components/TeacherApplicationDetail";

export const dynamic = "force-dynamic";

export default async function TeacherApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId < 1) notFound();

  const application = await db.teacherApplication.findUnique({
    where: { id: applicationId },
    include: { documents: true },
  });
  if (!application) notFound();

  return <TeacherApplicationDetail application={JSON.parse(JSON.stringify(application))} />;
}

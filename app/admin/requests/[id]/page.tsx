import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/dal";
import { db } from "@/app/lib/db";
import RequestDetailPageView from "../../components/RequestDetailPageView";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId < 1) notFound();

  const [request, teachers] = await Promise.all([
    db.request.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            user: true,
            teacher: { include: { user: true } },
          },
        },
      },
    }),
    db.teacher.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  if (!request) notFound();

  return (
    <RequestDetailPageView
      request={{
        ...request,
        parent_name: request.parentName,
        created_at: request.createdAt.toISOString(),
        assignedTeacher: request.student?.teacher ?? null,
      }}
      teachers={teachers.map((t) => ({
        id: t.id,
        name: t.user.name,
        email: t.user.email,
        phone: t.phone,
        subjects: t.subjects,
      }))}
    />
  );
}

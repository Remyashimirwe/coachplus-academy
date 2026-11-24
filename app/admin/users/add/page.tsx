import { getPrograms } from "@/app/lib/db";
import AddUserForm from "./AddUserForm";

export const dynamic = "force-dynamic";

export default async function AddUserPage() {
  const rawPrograms = await getPrograms();
  const programs = rawPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    subjects: p.subjects.map((s) => ({ id: s.id, name: s.name })),
  }));

  return <AddUserForm programs={programs} />;
}

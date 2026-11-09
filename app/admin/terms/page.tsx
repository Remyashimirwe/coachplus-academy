import { requireAdmin } from "@/app/lib/dal";
import { getTeacherTerms } from "@/app/lib/teacherTermsServer";
import TermsEditor from "../components/TermsEditor";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  await requireAdmin();
  const terms = await getTeacherTerms();

  return <TermsEditor initialTerms={terms} />;
}

import DocumentReuploadForm from "./DocumentReuploadForm";

export default async function ReuploadDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <DocumentReuploadForm token={token} />;
}

import { CaseDetailView } from "@/features/cases/CaseDetailView";

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <CaseDetailView id={caseId} />;
}

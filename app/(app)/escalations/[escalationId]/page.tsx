import { EscalationDetail } from "@/features/escalations/Escalations";

export default async function Page({ params }: { params: Promise<{ escalationId: string }> }) {
  const { escalationId } = await params;
  return <EscalationDetail id={escalationId} />;
}

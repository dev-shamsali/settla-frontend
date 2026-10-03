import { TraceDetail } from "@/features/governance/Governance";

export default async function Page({ params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;
  return <TraceDetail id={traceId} />;
}

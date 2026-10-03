import { PolicyDetail } from "@/features/governance/Governance";

export default async function Page({ params }: { params: Promise<{ policyId: string }> }) {
  const { policyId } = await params;
  return <PolicyDetail id={policyId} />;
}

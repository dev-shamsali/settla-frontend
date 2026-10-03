import { CustomerDetail } from "@/features/records/Records";

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return <CustomerDetail id={customerId} />;
}

import { PaymentDetail } from "@/features/records/Records";

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return <PaymentDetail id={paymentId} />;
}

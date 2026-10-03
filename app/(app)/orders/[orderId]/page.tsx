import { OrderDetail } from "@/features/records/Records";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetail id={orderId} />;
}

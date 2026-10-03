import type { Metadata } from "next";
import { PaymentsList } from "@/features/records/Records";

export const metadata: Metadata = { title: "Payments" };
export default function Page() { return <PaymentsList />; }

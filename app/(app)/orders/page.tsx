import type { Metadata } from "next";
import { OrdersList } from "@/features/records/Records";

export const metadata: Metadata = { title: "Orders" };
export default function Page() { return <OrdersList />; }

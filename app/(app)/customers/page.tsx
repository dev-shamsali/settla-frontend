import type { Metadata } from "next";
import { CustomersList } from "@/features/records/Records";

export const metadata: Metadata = { title: "Customers" };
export default function Page() { return <CustomersList />; }

import type { Metadata } from "next";
import { Billing } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Billing" };
export default function Page() { return <Billing />; }

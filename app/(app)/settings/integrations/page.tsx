import type { Metadata } from "next";
import { Integrations } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Integration settings" };
export default function Page() { return <Integrations />; }

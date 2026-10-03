import type { Metadata } from "next";
import { Integrations } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Integrations" };
export default function Page() { return <Integrations />; }

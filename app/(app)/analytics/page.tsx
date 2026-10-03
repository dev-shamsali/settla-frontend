import type { Metadata } from "next";
import { Analytics } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Analytics" };
export default function Page() { return <Analytics />; }

import type { Metadata } from "next";
import { ActivityLog } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Audit" };
export default function Page() { return <ActivityLog />; }

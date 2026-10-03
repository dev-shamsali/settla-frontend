import type { Metadata } from "next";
import { ActivityLog } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Activity & audit" };
export default function Page() { return <ActivityLog />; }

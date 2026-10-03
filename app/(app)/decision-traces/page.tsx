import type { Metadata } from "next";
import { TracesList } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Decision traces" };
export default function Page() { return <TracesList />; }

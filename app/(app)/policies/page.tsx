import type { Metadata } from "next";
import { PoliciesList } from "@/features/governance/Governance";

export const metadata: Metadata = { title: "Policies" };
export default function Page() { return <PoliciesList />; }

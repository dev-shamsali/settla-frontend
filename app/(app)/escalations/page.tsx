import type { Metadata } from "next";
import { EscalationsList } from "@/features/escalations/Escalations";

export const metadata: Metadata = { title: "Escalations" };
export default function Page() { return <EscalationsList />; }

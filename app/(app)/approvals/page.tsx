import type { Metadata } from "next";
import { Approvals } from "@/features/approvals/Approvals";

export const metadata: Metadata = { title: "Approvals" };
export default function Page() { return <Approvals />; }

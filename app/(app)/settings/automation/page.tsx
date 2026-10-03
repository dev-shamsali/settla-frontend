import type { Metadata } from "next";
import { Automation } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Automation" };
export default function Page() { return <Automation />; }

import type { Metadata } from "next";
import { AdminSystem } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "System" };
export default function Page() { return <AdminSystem />; }

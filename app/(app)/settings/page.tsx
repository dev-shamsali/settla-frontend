import type { Metadata } from "next";
import { SettingsHome } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Settings" };
export default function Page() { return <SettingsHome />; }

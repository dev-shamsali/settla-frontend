import type { Metadata } from "next";
import { Team } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Users" };
export default function Page() { return <Team />; }

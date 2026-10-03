import type { Metadata } from "next";
import { Security } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Security" };
export default function Page() { return <Security />; }

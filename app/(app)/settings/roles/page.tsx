import type { Metadata } from "next";
import { Roles } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Roles" };
export default function Page() { return <Roles />; }

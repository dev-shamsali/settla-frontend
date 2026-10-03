import type { Metadata } from "next";
import { AdminHome } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Admin" };
export default function Page() { return <AdminHome />; }

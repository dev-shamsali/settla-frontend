import type { Metadata } from "next";
import { AdminTenants } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Tenants" };
export default function Page() { return <AdminTenants />; }

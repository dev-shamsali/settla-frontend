import type { Metadata } from "next";
import { CasesList } from "@/features/cases/CasesList";

export const metadata: Metadata = { title: "Cases" };
export default async function Page({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  return <CasesList initialNew={sp.new === "1"} />;
}

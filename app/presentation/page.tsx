import type { Metadata } from "next";
import { Presentation } from "@/features/presentation/Presentation";

export const metadata: Metadata = { title: "Presentation" };
export default function Page() { return <Presentation />; }

import type { Metadata } from "next";
import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  title: { absolute: "Settla — AI-Powered Payment Resolution" },
  description: "Settla uses AI to investigate, resolve, verify, and escalate payment issues automatically.",
  openGraph: {
    title: "Settla — AI-Powered Payment Resolution",
    description: "Settla uses AI to investigate, resolve, verify, and escalate payment issues automatically.",
    type: "website",
    siteName: "Settla",
  },
  twitter: { card: "summary", title: "Settla — AI-Powered Payment Resolution", description: "Investigate, resolve, verify, and escalate payment issues automatically." },
};

export default function Home() {
  return <Landing />;
}

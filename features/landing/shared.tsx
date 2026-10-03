import { Logo } from "@/components/ui/Logo";

// Shared by the client Navbar and the server Footer (so it must NOT be a "use client" module).
export const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#contact", label: "Contact" },
];

export { Logo };

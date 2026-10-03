import Link from "next/link";

// Shared by the client Navbar and the server Footer (so it must NOT be a "use client" module).
export const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#contact", label: "Contact" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Settla home">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="24" height="24" rx="7" stroke="white" strokeOpacity="0.5" />
        <path d="M7 17.5h7.5a3 3 0 0 0 0-6H11.5a3 3 0 0 1 0-6H19" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="19" cy="5.5" r="1.4" fill="white" />
      </svg>
      <span className="text-[17px] font-medium tracking-tight">Settla</span>
    </Link>
  );
}

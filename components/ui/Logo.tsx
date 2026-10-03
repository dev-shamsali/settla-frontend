import Link from "next/link";

/**
 * The Settla mark: dark rounded square, thin white border, white squared "S".
 * Vector redraw of the supplied 33px logo so it stays sharp at every size.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 33 33" fill="none" role="img" aria-label="Settla" className={className}>
      <rect x="0.75" y="0.75" width="31.5" height="31.5" rx="9" fill="#0a0a0a" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M22.5 11H13.2a2.2 2.2 0 0 0-2.2 2.2v.6a2.2 2.2 0 0 0 2.2 2.2h6.6a2.2 2.2 0 0 1 2.2 2.2v.6a2.2 2.2 0 0 1-2.2 2.2H10.5" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + wordmark, linking home. */
export function Logo({ size = 30, href = "/", className = "" }: { size?: number; href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Settla home">
      <LogoMark size={size} />
      <span className="text-[17px] font-medium tracking-tight text-white">Settla</span>
    </Link>
  );
}

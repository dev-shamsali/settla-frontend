import { LayoutDashboard, FolderKanban, CreditCard, ShoppingBag, Users, Siren, CheckSquare, GitBranch, Activity, Plug, ScrollText, BookOpen, BarChart3, Settings, Shield, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; perm?: string; group: "Operate" | "Records" | "Govern" | "System" }
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Operate" },
  { href: "/cases", label: "Cases", icon: FolderKanban, perm: "cases:read", group: "Operate" },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, perm: "approvals:read", group: "Operate" },
  { href: "/escalations", label: "Escalations", icon: Siren, perm: "escalations:read", group: "Operate" },
  { href: "/payments", label: "Payments", icon: CreditCard, perm: "payments:read", group: "Records" },
  { href: "/orders", label: "Orders", icon: ShoppingBag, perm: "orders:read", group: "Records" },
  { href: "/customers", label: "Customers", icon: Users, perm: "customers:read", group: "Records" },
  { href: "/decision-traces", label: "Decision traces", icon: GitBranch, perm: "cases:read", group: "Govern" },
  { href: "/policies", label: "Policies", icon: ScrollText, perm: "policies:read", group: "Govern" },
  { href: "/knowledge-base", label: "Knowledge base", icon: BookOpen, perm: "knowledge:read", group: "Govern" },
  { href: "/activity", label: "Activity & audit", icon: Activity, perm: "audit:read", group: "Govern" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, perm: "analytics:read", group: "System" },
  { href: "/integrations", label: "Integrations", icon: Plug, perm: "integrations:read", group: "System" },
  { href: "/settings", label: "Settings", icon: Settings, group: "System" },
  { href: "/admin", label: "Admin", icon: Shield, perm: "admin:system", group: "System" },
];

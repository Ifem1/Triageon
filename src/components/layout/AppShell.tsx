"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, FolderOpen, FileText,
  Terminal, Settings, ChevronRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isContractConfigured } from "@/lib/genlayer/config";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { ChainHydrator } from "@/components/layout/ChainHydrator";

const NAV = [
  { href: "/app",            label: "Desk",     icon: LayoutDashboard, exact: true },
  { href: "/app/cases",      label: "Cases",    icon: FolderOpen },
  { href: "/app/policies",   label: "Policies", icon: FileText },
  { href: "/app/console",    label: "Console",  icon: Terminal },
  { href: "/app/settings",   label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { cases } = useStore();

  const openCount     = cases.filter(c => ["CASE_OPENED","POLICY_ATTACHED","READY_FOR_TRIAGE_REVIEW"].includes(c.status)).length;
  const reviewingCount= cases.filter(c => c.status === "REVIEW_IN_PROGRESS").length;
  const slaRisk       = cases.filter(c => c.sla_state === "AT_RISK" || c.sla_state === "BREACHED").length;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-shell)" }}>
      <ChainHydrator />

      {/* Top command strip */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-3"
        style={{ background: "var(--bg-shell)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo size={28} showWordmark={true} />
          </Link>

          <div className="flex items-center gap-4 text-xs font-dm-mono">
            {openCount > 0 && (
              <span style={{ color: "var(--alert-apricot)" }}>{openCount} open</span>
            )}
            {reviewingCount > 0 && (
              <span className="animate-pulse" style={{ color: "var(--signal-teal)" }}>{reviewingCount} in consensus</span>
            )}
            {slaRisk > 0 && (
              <span className="flex items-center gap-1" style={{ color: "var(--critical-rose)" }}>
                <AlertCircle className="w-3 h-3" />{slaRisk} SLA risk
              </span>
            )}
            {!isContractConfigured() && (
              <span style={{ color: "var(--copper-wire)" }}>contract not configured</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <WalletConnect />
          <Link
            href="/app/cases/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium btn-clip transition-colors"
            style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
          >
            <ChevronRight className="w-3 h-3" />
            New Escalation
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav spine */}
        <nav
          className="flex-shrink-0 w-14 flex flex-col items-center py-4 gap-2"
          style={{ background: "var(--bg-shell)", borderRight: "1px solid var(--border)" }}
        >
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex flex-col items-center justify-center w-10 h-10 rounded-sm transition-colors"
                style={{
                  background: active ? "rgba(79,183,168,0.12)" : "transparent",
                  color: active ? "var(--signal-teal)" : "var(--text-faint)",
                }}
              >
                <item.icon className="w-4 h-4" />
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto" style={{ background: "var(--bg-canvas)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

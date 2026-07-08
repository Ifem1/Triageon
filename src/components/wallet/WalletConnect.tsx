"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Copy, Check, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function WalletConnect() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { setWalletAddress, setWalletProvider } = useStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeWallet = wallets[0];
  const address = activeWallet?.address ?? "";

  useEffect(() => {
    setWalletAddress(address);
    let cancelled = false;

    async function loadProvider() {
      if (!activeWallet) {
        setWalletProvider(null);
        return;
      }

      try {
        const provider = await activeWallet.getEthereumProvider();
        if (!cancelled) setWalletProvider(provider);
      } catch {
        if (!cancelled) setWalletProvider(null);
      }
    }

    loadProvider();

    return () => {
      cancelled = true;
    };
  }, [activeWallet, address, setWalletAddress, setWalletProvider]);

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  const displayName =
    user?.email?.address ??
    user?.google?.email ??
    short ??
    null;

  if (!ready) {
    return (
      <div
        className="px-3 py-1.5 text-xs font-dm-mono rounded-sm animate-pulse"
        style={{ background: "var(--bg-muted)", color: "var(--text-faint)" }}
      >
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium btn-clip transition-colors"
        style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
      >
        <LogIn className="w-3 h-3" />
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-dm-mono btn-clip transition-colors"
        style={{ background: "var(--bg-muted)", border: "1px solid rgba(79,183,168,0.3)", color: "var(--signal-teal)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal-teal)" }} />
        {displayName}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-64 rounded-sm shadow-xl z-50"
            style={{ background: "var(--bg-canvas)", border: "1px solid var(--border)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[10px] font-dm-mono mb-1" style={{ color: "var(--text-faint)" }}>Signed in</p>
              {displayName !== short && (
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-body)" }}>{displayName}</p>
              )}
              {address && (
                <p className="text-[11px] font-dm-mono break-all" style={{ color: "var(--text-faint)" }}>{address}</p>
              )}
            </div>
            <div className="p-2 space-y-1">
              {address && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-colors"
                  style={{ color: "var(--text-faint)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-muted)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5" style={{ color: "var(--queue-sage)" }} />
                    : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Address"}
                </button>
              )}
              <button
                onClick={() => { logout(); setWalletProvider(null); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-colors"
                style={{ color: "var(--critical-rose)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,85,109,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

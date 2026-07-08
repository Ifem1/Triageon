"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import {
  CONTRACT_OWNER_ADDRESS,
  GENLAYER_STUDIONET,
  isContractConfigured,
  isContractOwner,
} from "@/lib/genlayer/config";
import { ContractNotice } from "@/components/ui/ContractNotice";
import { callContractWrite, emitLog } from "@/lib/genlayer/client";
import { useState } from "react";
import { Settings, Shield, Zap, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { walletAddress, walletProvider, setWalletAddress, pushLog } = useStore();
  const [addr, setAddr] = useState(walletAddress);
  const [reviewerAddr, setReviewerAddr] = useState("");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const canManageReviewers = isContractOwner(walletAddress);

  function saveWallet() {
    setWalletAddress(addr.trim());
    setMsg("Wallet address saved.");
    setTimeout(() => setMsg(""), 2000);
  }

  async function addReviewer() {
    if (!reviewerAddr.trim()) return;
    setAdding(true);
    setMsg("");
    try {
      if (isContractConfigured() && walletAddress) {
        await callContractWrite("add_reviewer", [reviewerAddr.trim()], walletAddress, walletProvider);
        pushLog(emitLog("ADMIN", `Reviewer added: ${reviewerAddr}`));
        setMsg("Reviewer added on-chain.");
      } else {
        setMsg("Contract not configured. Cannot add reviewer on-chain.");
      }
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed to add reviewer.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5" style={{ color: "var(--copper-wire)" }} />
        <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </div>

      {!isContractConfigured() && <div className="mb-6"><ContractNotice /></div>}

      <div className="space-y-5">
        {/* Wallet */}
        <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-syne text-sm font-semibold mb-4" style={{ color: "var(--copper-wire)" }}>Wallet / Sender Address</h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
            Used to sign transactions on GenLayer Studionet. This is stored locally only.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="0x… your GenLayer address"
              className="triageon-input flex-1 text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors font-dm-mono"
            />
            <Button variant="secondary" onClick={saveWallet}>Save</Button>
          </div>
        </div>

        {/* Reviewers */}
        {canManageReviewers && (
        <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4" style={{ color: "var(--soft-plum)" }} />
            <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Manage Reviewers</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
            Only reviewers and the contract owner can trigger START CONSENSUS REVIEW.
            Add authorised reviewer addresses here.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={reviewerAddr}
              onChange={(e) => setReviewerAddr(e.target.value)}
              placeholder="0x… reviewer address"
              className="triageon-input flex-1 text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors font-dm-mono"
            />
            <Button variant="primary" loading={adding} onClick={addReviewer}>
              Add Reviewer
            </Button>
          </div>
        </div>
        )}

        {!canManageReviewers && (
          <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" style={{ color: "var(--soft-plum)" }} />
              <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Reviewer Access</h2>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
              Reviewer management is owner-only. This wallet can request consensus reviews only after the owner authorises it.
            </p>
            {!CONTRACT_OWNER_ADDRESS && (
              <p className="text-xs mt-3" style={{ color: "var(--alert-apricot)" }}>
                Set NEXT_PUBLIC_GENLAYER_OWNER_ADDRESS in Vercel to enable owner-only reviewer controls.
              </p>
            )}
          </div>
        )}

        {/* GenLayer config */}
        <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4" style={{ color: "var(--signal-teal)" }} />
            <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>GenLayer Studionet</h2>
          </div>
          <div className="space-y-3 text-xs font-dm-mono">
            <Row label="RPC URL" value={GENLAYER_STUDIONET.rpcUrl} />
            <Row label="Chain ID" value={String(GENLAYER_STUDIONET.chainId)} />
            <Row label="Currency" value={GENLAYER_STUDIONET.currency} />
            <Row
              label="Contract Address"
              value={process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "NOT CONFIGURED"}
              highlight={!isContractConfigured()}
            />
          </div>
          <a
            href={GENLAYER_STUDIONET.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs mt-4 transition-colors font-dm-mono"
            style={{ color: "var(--route-blue)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Studionet Explorer
          </a>
        </div>

        {/* Contract deployment note */}
        <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-syne text-sm font-semibold mb-3" style={{ color: "var(--text-body)" }}>Deploy TriageonJudge</h2>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-faint)" }}>
            The contract <span className="font-dm-mono" style={{ color: "var(--text-muted)" }}>TriageonJudge.py</span> is located in{" "}
            <span className="font-dm-mono" style={{ color: "var(--text-muted)" }}>contracts/TriageonJudge.py</span>. Deploy it on GenLayer
            Studionet using the GenLayer Studio and set the contract address in your{" "}
            <span className="font-dm-mono" style={{ color: "var(--text-muted)" }}>.env.local</span>.
          </p>
          <a
            href="https://studio.genlayer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs transition-colors font-dm-mono"
            style={{ color: "var(--route-blue)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open GenLayer Studio
          </a>
        </div>

        {/* Safety notice */}
        <div className="rounded-sm p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Triageon provides consensus-based support routing recommendations. It does not replace
            human judgement, legal review, or regulated customer-service obligations.
          </p>
        </div>

        {msg && (
          <p className="text-sm font-dm-mono" style={{ color: "var(--signal-teal)" }}>{msg}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className="truncate max-w-xs text-right" style={{ color: highlight ? "var(--critical-rose)" : "var(--text-faint)" }}>
        {value}
      </span>
    </div>
  );
}

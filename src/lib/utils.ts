import { format, formatDistanceToNow } from "date-fns";
import type { RiskLevel, RecommendedRoute, CaseStatus } from "./genlayer/types";

export function formatDate(iso: string): string {
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "text-[#8DAA91]";
    case "MEDIUM": return "text-[#F4A261]";
    case "HIGH": return "text-[#C8556D]";
    case "CRITICAL": return "text-[#C8556D] font-bold";
    default: return "text-[#D8D3C8]";
  }
}

export function riskBg(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "bg-[#8DAA91]/20 text-[#8DAA91]";
    case "MEDIUM": return "bg-[#F4A261]/20 text-[#F4A261]";
    case "HIGH": return "bg-[#C8556D]/20 text-[#C8556D]";
    case "CRITICAL": return "bg-[#C8556D]/30 text-[#C8556D]";
    default: return "bg-[#D8D3C8]/20 text-[#D8D3C8]";
  }
}

export function routeColor(route: RecommendedRoute): string {
  switch (route) {
    case "ESCALATE": return "bg-[#C8556D]/20 text-[#C8556D]";
    case "REFUND": return "bg-[#8DAA91]/20 text-[#8DAA91]";
    case "PARTIAL_REFUND": return "bg-[#8DAA91]/10 text-[#8DAA91]";
    case "CLOSE": return "bg-[#D8D3C8]/20 text-[#2C3443]";
    case "REQUEST_MORE_INFO": return "bg-[#5E81AC]/20 text-[#5E81AC]";
    case "HOLD_FOR_HUMAN": return "bg-[#F4A261]/20 text-[#F4A261]";
    case "POLICY_EXCEPTION": return "bg-[#75658A]/20 text-[#75658A]";
  }
}

export function statusLabel(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    CASE_OPENED: "Opened",
    POLICY_ATTACHED: "Policy Attached",
    READY_FOR_TRIAGE_REVIEW: "Ready for Review",
    REVIEW_IN_PROGRESS: "Review Running",
    REVIEW_COMPLETE: "Review Complete",
    FINALIZED: "Finalized",
  };
  return map[status] ?? status;
}

export function statusColor(status: CaseStatus): string {
  switch (status) {
    case "CASE_OPENED": return "bg-[#5E81AC]/20 text-[#5E81AC]";
    case "POLICY_ATTACHED": return "bg-[#75658A]/20 text-[#75658A]";
    case "READY_FOR_TRIAGE_REVIEW": return "bg-[#F4A261]/20 text-[#F4A261]";
    case "REVIEW_IN_PROGRESS": return "bg-[#4FB7A8]/20 text-[#4FB7A8]";
    case "REVIEW_COMPLETE": return "bg-[#8DAA91]/20 text-[#8DAA91]";
    case "FINALIZED": return "bg-[#D8D3C8]/20 text-[#2C3443]";
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

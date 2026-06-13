"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, CheckCircle2, XCircle, Zap, Shield, Clock, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NodeGraph } from "@/components/ui/NodeGraph";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import dynamic from "next/dynamic";

const WalletConnectClient = dynamic(() => Promise.resolve(WalletConnect), { ssr: false });

const FLOW_STEPS = [
  { label: "INCOMING TICKET",  icon: "📥", gold: true },
  { label: "THREAD SLAB",      icon: "🧵", gold: false },
  { label: "POLICY LENS",      icon: "📋", gold: false },
  { label: "CONSENSUS PLATE",  icon: "⚡", gold: false },
  { label: "ACTION ROUTE",     icon: "✅", gold: true },
];

const STATS = [
  { label: "AI Validators",  value: "5",   suffix: "/review", icon: Shield },
  { label: "Avg Decision",   value: "<3",  suffix: "s",       icon: Clock },
  { label: "Routes Covered", value: "7",   suffix: " total",  icon: TrendingUp },
  { label: "On-chain Proof", value: "100", suffix: "%",       icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-shell)" }}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Animated node graph */}
        <div className="absolute inset-0 z-0">
          <NodeGraph className="w-full h-full" nodeColor="0,223,129" />
        </div>

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 z-0 mesh-hero opacity-85" />

        {/* Dark center spot — makes white text pop in both modes */}
        <div className="absolute inset-0 z-0 hero-dark-spot" />

        {/* Radial vignette — class allows light mode CSS override */}
        <div
          className="absolute inset-0 z-0 hero-vignette"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, var(--bg-shell) 100%)" }}
        />

        {/* ── Nav ── */}
        <header
          className="relative z-10 flex items-center justify-between px-8 py-5"
          style={{ borderBottom: "1px solid rgba(0,223,129,0.12)" }}
        >
          <Logo size={34} showWordmark={true} />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <WalletConnectClient />
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-clip transition-all"
              style={{ background: "#00DF81", color: "#032221" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Open Desk
            </Link>
          </div>
        </header>

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(0,223,129,0.1)", border: "1px solid rgba(0,223,129,0.3)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: "#00DF81" }} />
            <span className="text-xs font-dm-mono tracking-widest uppercase" style={{ color: "#00DF81" }}>
              GenLayer-native · Studionet · Live consensus
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-syne font-bold leading-tight tracking-tight mb-6"
            style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", maxWidth: "900px" }}
          >
            <span style={{ color: "#FFFFFF" }}>Hard support cases need</span>
            <br />
            <span style={{ color: "#FFC71F" }}>better judgement.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg mb-10 leading-relaxed max-w-2xl"
            style={{ color: "#FFFFFF" }}
          >
            Triageon uses GenLayer's distributed validators to interpret ticket context,
            chat history, and policy rules. Routing hard escalations with structured
            on-chain reasoning.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-syne font-semibold text-base btn-clip transition-all hover:brightness-110"
              style={{ background: "#00DF81", color: "#032221" }}
            >
              <ArrowRight className="w-4 h-4" />
              Open Escalation Desk
            </Link>
            <Link
              href="/app/cases/new"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-syne font-semibold text-base btn-clip transition-all"
              style={{ border: "1px solid rgba(0,179,104,0.5)", color: "var(--text-primary)", background: "rgba(0,223,129,0.06)" }}
            >
              <ChevronRight className="w-4 h-4" />
              File First Case
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 w-full max-w-2xl"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-sm p-4 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}
              >
                <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: "#00DF81" }} />
                <p className="font-syne font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
                  {s.value}<span className="text-sm font-normal" style={{ color: "var(--text-faint)" }}>{s.suffix}</span>
                </p>
                <p className="text-[10px] font-dm-mono uppercase tracking-widest mt-1" style={{ color: "var(--text-faint)" }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Animated flow strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-2 flex-wrap text-xs font-dm-mono"
          >
            {FLOW_STEPS.map((step, i) => (
              <span key={step.label} className="flex items-center gap-2">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.12 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${step.gold ? "rgba(0,179,104,0.4)" : "rgba(0,223,129,0.25)"}`,
                    color: step.gold ? "var(--text-primary)" : "#00DF81",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span>{step.icon}</span>
                  {step.label}
                </motion.span>
                {i < FLOW_STEPS.length - 1 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.12 }}
                    style={{ color: "#00DF81" }}
                  >
                    →
                  </motion.span>
                )}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-10 hero-bottom-fade"
          style={{ background: "linear-gradient(to bottom, transparent, var(--bg-shell))" }}
        />
      </section>

      {/* ── VERDICT CARD DEMO ── */}
      <section className="relative py-24 px-6" style={{ background: "var(--bg-shell)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-dm-mono uppercase tracking-widest mb-3" style={{ color: "#00DF81" }}>What it produces</p>
            <h2 className="font-syne text-3xl md:text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
              A structured verdict, on-chain.
            </h2>
            <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
              Every review produces a signed, reproducible decision — not a chatbot reply.
            </p>
          </motion.div>

          {/* Mock consensus plate */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-3xl mx-auto rounded-sm overflow-hidden"
            style={{ border: "1px solid rgba(0,223,129,0.3)", boxShadow: "0 0 60px rgba(0,223,129,0.08)" }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-3.5"
              style={{ background: "rgba(0,223,129,0.08)", borderBottom: "1px solid rgba(0,223,129,0.2)" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#00DF81" }} />
                <span className="font-syne text-sm font-semibold" style={{ color: "#00DF81" }}>Consensus Plate</span>
              </div>
              <span className="font-dm-mono text-[10px]" style={{ color: "var(--text-faint)" }}>
                TX: 0x3f8a…d447 ↗
              </span>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6" style={{ background: "var(--bg-card)" }}>
              {/* Left */}
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Recommended Route</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm" style={{ background: "rgba(0,179,104,0.12)", border: "1px solid rgba(0,179,104,0.3)" }}>
                    <ArrowRight className="w-4 h-4" style={{ color: "#00b368" }} />
                    <span className="font-syne font-bold text-lg" style={{ color: "#00b368" }}>REFUND</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                        <div className="h-full rounded-full" style={{ width: "87%", background: "#00DF81" }} />
                      </div>
                      <span className="font-dm-mono text-xs font-bold" style={{ color: "#00DF81" }}>87%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Risk Level</p>
                    <span className="text-xs px-2 py-0.5 rounded-sm font-dm-mono font-bold" style={{ background: "rgba(244,162,97,0.15)", color: "#F4A261", border: "1px solid rgba(244,162,97,0.25)" }}>MEDIUM</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Policy Match</p>
                  <p className="text-xs font-dm-mono" style={{ color: "var(--text-muted)" }}>STRONG MATCH</p>
                </div>
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Escalation Level</p>
                  <p className="text-xs font-dm-mono" style={{ color: "var(--text-muted)" }}>L2 SUPPORT</p>
                </div>
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Refund Recommendation</p>
                  <p className="text-xs font-dm-mono" style={{ color: "var(--text-muted)" }}>FULL REFUND</p>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Reasoning Summary</p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)", fontStyle: "italic", borderLeft: "2px solid rgba(0,223,129,0.3)", paddingLeft: "12px" }}
                  >
                    The customer's complaint aligns semantically with the 30-day refund clause despite being filed on day 31. Prior agent responses created a reasonable expectation of eligibility. Policy exception is warranted.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Recommended Actions</p>
                  <ul className="space-y-1.5">
                    {["Process full refund within 24h", "Log policy exception with case reference", "Update agent training on day-31 edge cases"].map((a, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="font-dm-mono font-bold flex-shrink-0" style={{ color: "#00DF81" }}>{i + 1}.</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Validator bar */}
            <div className="flex items-center justify-between px-6 py-3" style={{ background: "var(--bg-canvas)", borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Validators</span>
                <div className="flex gap-1 ml-2">
                  {[1,2,3,4,5].map(v => (
                    <div key={v} className="w-2 h-2 rounded-full" style={{ background: "#00DF81" }} />
                  ))}
                </div>
                <span className="text-[10px] font-dm-mono" style={{ color: "#00DF81" }}>5/5 consensus</span>
              </div>
              <span className="text-[10px] font-dm-mono" style={{ color: "var(--text-faint)" }}>GenLayer Studionet · Chain 61999</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── WHY GENLAYER ── */}
      <section className="py-24 px-6" style={{ background: "var(--bg-canvas)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-dm-mono uppercase tracking-widest mb-3" style={{ color: "#00DF81" }}>The reasoning gap</p>
            <h2 className="font-syne text-3xl md:text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
              Rules see the ticket.<br />GenLayer reads the situation.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-sm p-6"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(0,179,104,0.2)" }}
            >
              <p className="font-dm-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#00b368" }}>
                ✓ Rules can detect
              </p>
              <ul className="space-y-3">
                {[
                  "Ticket age and SLA breach",
                  "Customer tier from a database field",
                  "Keyword tags in subject lines",
                  "Whether a policy document exists",
                  "Refund window (days since purchase)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00b368" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-sm p-6"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(200,85,109,0.2)" }}
            >
              <p className="font-dm-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#C8556D" }}>
                ✗ Rules cannot reliably judge
              </p>
              <ul className="space-y-3">
                {[
                  "Whether the complaint matches a refund exception semantically",
                  "Whether the agent created a reasonable expectation",
                  "Whether the policy should be read narrowly or broadly",
                  "Whether the chat history justifies an exception",
                  "Whether the customer is confused, abusive, or genuinely harmed",
                  "Whether prior support actions created a fairness issue",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#C8556D" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 px-6 overflow-hidden" style={{ background: "var(--bg-shell)" }}>
        <div className="absolute inset-0 z-0 opacity-30">
          <NodeGraph className="w-full h-full" nodeColor="0,223,129" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-dm-mono uppercase tracking-widest mb-4" style={{ color: "#00DF81" }}>Ready to route better</p>
            <h2 className="font-syne text-3xl md:text-4xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Start judging hard cases the right way.
            </h2>
            <p className="mb-10 text-base" style={{ color: "var(--text-muted)" }}>
              Open your first escalation, attach a policy, and let GenLayer validators
              reach consensus on the route.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-8 py-4 font-syne font-bold text-lg btn-clip transition-all hover:brightness-110"
                style={{ background: "#00DF81", color: "#032221" }}
              >
                <ArrowRight className="w-5 h-5" />
                Open Escalation Desk
              </Link>
              <Link
                href="/app/console"
                className="inline-flex items-center gap-2 px-8 py-4 font-syne font-semibold text-lg btn-clip transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}
              >
                View Console
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-6 text-center"
        style={{ background: "var(--bg-canvas)", borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo size={22} showWordmark={true} />
        </div>
        <p className="text-xs font-dm-mono" style={{ color: "var(--text-faint)" }}>
          Consensus support for hard cases · GenLayer Studionet · Human teams remain responsible for final handling
        </p>
      </footer>
    </div>
  );
}

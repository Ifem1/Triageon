"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(
  async () => {
    const { AppShell } = await import("@/components/layout/AppShell");
    return AppShell;
  },
  { ssr: false }
);

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

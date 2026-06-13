import type { Metadata } from "next";
import { Syne, Instrument_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProviderWrapper } from "@/components/providers/PrivyProviderWrapper";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Triageon — Support Escalation Judge",
  description: "Hard support cases routed by policy, context, and GenLayer consensus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrumentSans.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full">
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}

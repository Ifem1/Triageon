"use client";

import { PrivyProvider } from "@privy-io/react-auth";

const studionetChain = {
  id: 61999,
  name: "GenLayer Studionet",
  network: "genlayer-studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
    public:  { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://studio.genlayer.com" },
  },
  testnet: true,
} as const;

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#4FB7A8",
          walletList: ["metamask", "coinbase_wallet", "rainbow", "wallet_connect"],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultChain: studionetChain as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supportedChains: [studionetChain as any],
        externalWallets: {
          coinbaseWallet: { config: {} },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

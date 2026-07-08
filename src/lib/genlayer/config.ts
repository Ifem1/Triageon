export const GENLAYER_STUDIONET = {
  name: "GenLayer Studionet",
  chainId: 61999,
  rpcUrl: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
};

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";
export const CONTRACT_OWNER_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_OWNER_ADDRESS || "";

export const isContractConfigured = () => CONTRACT_ADDRESS.length > 0;

export const isContractOwner = (address: string) =>
  CONTRACT_OWNER_ADDRESS.length > 0 &&
  address.toLowerCase() === CONTRACT_OWNER_ADDRESS.toLowerCase();

import { create } from "zustand";

export type Exchange = "binance" | "bybit" | "okx" | "kraken" | "coinbase";
export type Network = "ethereum" | "solana" | "bsc" | "arbitrum" | "optimism" | "base";

interface ArbitrageStore {
  exchange: Exchange;
  network: Network;
  setExchange: (exchange: Exchange) => void;
  setNetwork: (network: Network) => void;
  refreshRateMs: number;
  setRefreshRateMs: (refreshRateMs: number) => void;
}

const defaultExchange: Exchange = "binance";
const defaultNetwork: Network = "ethereum";

export const useArbitrageStore = create<ArbitrageStore>((set) => ({
  exchange: defaultExchange,
  network: defaultNetwork,
  refreshRateMs: 1500,
  setExchange: (exchange) => set({ exchange }),
  setNetwork: (network) => set({ network }),
  setRefreshRateMs: (refreshRateMs) => set({ refreshRateMs })
}));

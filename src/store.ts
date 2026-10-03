import { create } from "zustand";
import type { ArbitrageMessage, FeedSource, FeedSnapshot, FeedStatus, Quote } from "./api/types";

export type Exchange = "binance" | "bybit" | "okx" | "kraken" | "coinbase";
export type Network = "ethereum" | "solana" | "bsc" | "arbitrum" | "optimism" | "base";

interface ArbitrageStore {
  exchange: Exchange;
  network: Network;
  setExchange: (exchange: Exchange) => void;
  setNetwork: (network: Network) => void;
  refreshRateMs: number;
  setRefreshRateMs: (refreshRateMs: number) => void;

  /** Live feed state, updated by the API client's snapshots. */
  feedStatus: FeedStatus;
  feedSource: FeedSource | null;
  connectedExchanges: string[];
  routes: ArbitrageMessage[];
  quotes: Quote[];
  feedUpdatedAt: number;
  setFeedSnapshot: (snapshot: FeedSnapshot) => void;

  /** Bumped to tear down and re-create the feed connection (Reconnect). */
  feedEpoch: number;
  bumpFeedEpoch: () => void;
}

// Bybit is reachable from most regions (Binance blocks some), so it is the
// default selection; the Exchange card cycles through connected exchanges.
const defaultExchange: Exchange = "bybit";
const defaultNetwork: Network = "ethereum";

export const useArbitrageStore = create<ArbitrageStore>((set) => ({
  exchange: defaultExchange,
  network: defaultNetwork,
  refreshRateMs: 1500,
  setExchange: (exchange) => set({ exchange }),
  setNetwork: (network) => set({ network }),
  setRefreshRateMs: (refreshRateMs) => set({ refreshRateMs }),

  feedStatus: "idle",
  feedSource: null,
  connectedExchanges: [],
  routes: [],
  quotes: [],
  feedUpdatedAt: 0,
  setFeedSnapshot: (snapshot) =>
    set({
      feedStatus: snapshot.status,
      feedSource: snapshot.source,
      connectedExchanges: snapshot.connectedExchanges,
      routes: snapshot.routes,
      quotes: snapshot.quotes,
      feedUpdatedAt: snapshot.updatedAt
    }),

  feedEpoch: 0,
  bumpFeedEpoch: () => set((state) => ({ feedEpoch: state.feedEpoch + 1 }))
}));

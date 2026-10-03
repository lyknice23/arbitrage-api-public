/**
 * Contract shared with the arbitrage backend WebSocket server
 * (see README "WebSocket API" -> ArbitrageMessage).
 *
 * Every consumer in the app receives data in this shape regardless of
 * which transport produced it (deployed backend or built-in market feed).
 */
export interface ArbitrageMessage {
  exchangeFrom: string;
  exchangeTo: string;
  symbol: string;
  network: string;
  spread: number;
  buyPrice: number;
  sellPrice: number;
  totalAmount: number;
  totalBuyUSD: number;
  totalSellUSD: number;
  format: "hedge" | "transfer" | "delayed";
  withdrawFee: number;
  depositFee: number;
  isWithdrawEnabled: number;
  isDepositEnabled: number;
}

export type FeedSource = "backend" | "market";

export type FeedStatus = "idle" | "connecting" | "live" | "offline";

/** Top-of-book quote for one symbol on one exchange. */
export interface Quote {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  ts: number;
}

/** One immutable snapshot emitted by a feed transport. */
export interface FeedSnapshot {
  status: FeedStatus;
  source: FeedSource;
  connectedExchanges: string[];
  routes: ArbitrageMessage[];
  quotes: Quote[];
  updatedAt: number;
}

export interface ArbitrageFeedOptions {
  /** Snapshot cadence in ms (caller-controlled, e.g. the Refresh slider). */
  getIntervalMs: () => number;
  /** Transfer network id to stamp on outgoing routes (caller-controlled). */
  getNetwork: () => string;
  /** Receives every snapshot produced by the active transport. */
  onSnapshot: (snapshot: FeedSnapshot) => void;
}

export interface ArbitrageFeedHandle {
  source: FeedSource;
  close: () => void;
}

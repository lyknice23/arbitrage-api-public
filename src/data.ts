import type { Exchange, Network } from "./store";

export const exchangeOptions = [
  { value: "binance" as Exchange, label: "Binance" },
  { value: "bybit" as Exchange, label: "Bybit" },
  { value: "okx" as Exchange, label: "OKX" },
  { value: "kraken" as Exchange, label: "Kraken" },
  { value: "coinbase" as Exchange, label: "Coinbase" }
];

export const networkOptions = [
  { value: "ethereum" as Network, label: "Ethereum" },
  { value: "solana" as Network, label: "Solana" },
  { value: "bsc" as Network, label: "BSC" },
  { value: "arbitrum" as Network, label: "Arbitrum" },
  { value: "optimism" as Network, label: "Optimism" }
];

export const mockDeposits = [
  { wallet: "0x7F5...2C41", symbol: "SOL", amount: "24.85" },
  { wallet: "0x2A1...9F87", symbol: "SOL", amount: "11.30" },
  { wallet: "0x088...B6C3", symbol: "SOL", amount: "6.12" }
];

export const exchangeMetrics = [
  { exchange: "Binance", spot: "421.50", futures: "1,842.20" },
  { exchange: "Bybit", spot: "421.18", futures: "1,839.75" },
  { exchange: "OKX", spot: "420.95", futures: "1,841.05" },
  { exchange: "Kraken", spot: "420.60", futures: "1,839.10" },
  { exchange: "Coinbase", spot: "420.42", futures: "1,838.60" }
];

export const opportunityMap = [
  {
    pair: "NEAR/USDT",
    type: "spot-to-futures",
    url: "https://www.binance.com/en/buiness/dex?ref=...".replace(/\.\.\./g, ""),
    bars: [
      { index: "NASDAQ", value: 5267.05, change: 0.25 },
      { index: "NYSE", value: 29126.25, change: -0.12 },
      { index: "TSX", value: 25301.37, change: 0.08 }
    ]
  },
  {
    pair: "RNDR/USDT",
    type: "futures-USDT",
    url: "https://www.binance.com/en/buiness/dex?ref=...".replace(/\.\.\./g, ""),
    bars: [
      { index: "NASDAQ", value: 6267.05, change: 0.25 },
      { index: "NYSE", value: 29126.25, change: -0.12 },
      { index: "TSX", value: 25301.37, change: 0.08 }
    ]
  },
  {
    pair: "TAO/USDT",
    type: "spot-futures",
    url: "https://www.binance.com/en/buiness/dex?ref=...".replace(/\.\.\./g, ""),
    bars: [
      { index: "NASDAQ", value: 6894.47, change: 0.03 },
      { index: "NYSE", value: 29126.25, change: -0.12 },
      { index: "TSX", value: 25301.37, change: 0.08 }
    ]
  },
  {
    pair: "GALA/USDT",
    type: "futures-USDT",
    url: "https://www.binance.com/en/buiness/dex?ref=...".replace(/\.\.\./g, ""),
    bars: [
      { index: "NASDAQ", value: 6267.05, change: 0.25 },
      { index: "NYSE", value: 29126.25, change: -0.12 },
      { index: "TSX", value: 25301.37, change: 0.08 }
    ]
  }
];

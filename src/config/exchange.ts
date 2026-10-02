import type { Exchange, Network } from "../store";

export type ExchangeId = Exchange;
export type NetworkId = Network;

export interface ExchangeConfig {
  id: ExchangeId;
  label: string;
  color: string;
  spot: string;
  futures: string;
  baseUrl: string;
  wsUrl: string;
  markets: string[];
  networks: NetworkId[];
}

export const exchangeConfig: ExchangeConfig[] = [
  {
    id: "binance",
    label: "Binance",
    color: "#F0B90B",
    spot: "421.50",
    futures: "1,842.20",
    baseUrl: "https://www.binance.com",
    wsUrl: "wss://stream.binance.com:9443/ws",
    markets: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    networks: ["ethereum", "solana", "arbitrum", "bsc", "optimism"]
  },
  {
    id: "bybit",
    label: "Bybit",
    color: "#00B1E7",
    spot: "421.35",
    futures: "1,839.90",
    baseUrl: "https://bybit.com",
    wsUrl: "wss://stream.bybit.com/v5/public/linear",
    markets: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    networks: ["ethereum", "solana", "arbitrum", "bsc"]
  },
  {
    id: "okx",
    label: "OKX",
    color: "#23BE9B",
    spot: "421.20",
    futures: "1,838.75",
    baseUrl: "https://www.okx.com",
    wsUrl: "wss://ws.okx.com:8443/ws/v5/public",
    markets: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    networks: ["ethereum", "solana", "bsc", "arbitrum"]
  },
  {
    id: "kraken",
    label: "Kraken",
    color: "#1F1F1F",
    spot: "421.10",
    futures: "1,837.60",
    baseUrl: "https://www.kraken.com",
    wsUrl: "wss://ws.kraken.com",
    markets: ["BTC/USD", "ETH/USD", "SOL/USD"],
    networks: ["ethereum"]
  },
  {
    id: "coinbase",
    label: "Coinbase",
    color: "#0052FF",
    spot: "421.00",
    futures: "1,836.10",
    baseUrl: "https://www.coinbase.com",
    wsUrl: "wss://ws-feed.exchange.coinbase.com",
    markets: ["BTC-USD", "ETH-USD", "SOL-USD"],
    networks: ["ethereum", "base"]
  }
];

export const networkConfig: { id: NetworkId; label: string; color: string }[] = [
  { id: "ethereum", label: "Ethereum", color: "#627EEA" },
  { id: "bsc", label: "BSC", color: "#F0B90B" },
  { id: "solana", label: "Solana", color: "#9945FF" },
  { id: "arbitrum", label: "Arbitrum", color: "#28A0F0" },
  { id: "optimism", label: "Optimism", color: "#FF Moreno" },
  { id: "base", label: "Base", color: "#0052FF" }
];

export const defaultExchange: Exchange = "binance";
export const defaultNetwork: Network = "ethereum";

export function getExchangeConfig(id: ExchangeId): ExchangeConfig | undefined {
  return exchangeConfig.find((ex) => ex.id === id);
}

export function getNetworkConfig(id: NetworkId): (typeof networkConfig)[number] | undefined {
  return networkConfig.find((n) => n.id === id);
}

export function isSupportedNetwork(exchangeId: ExchangeId, networkId: NetworkId): boolean {
  const config = getExchangeConfig(exchangeId);
  if (!config) return false;
  return config.networks.includes(networkId);
}

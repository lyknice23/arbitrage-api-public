import { createBackendClient } from "./backend";
import { createMarketFeed } from "./marketFeed";
import type { ArbitrageFeedHandle, ArbitrageFeedOptions } from "./types";

/**
 * Feed factory.
 *
 * Transport selection:
 *  - `VITE_ARB_API_URL` set  -> deployed arbitrage backend WebSocket
 *    (README contract, e.g. wss://api.example.com or ws://host:3000).
 *  - otherwise               -> built-in live market feed wired straight
 *    to public exchange streams, so the app shows real-time data with no
 *    backend deployed yet.
 *
 * Set the key in the project's Keys/API keys tab (`VITE_ARB_API_URL`)
 * once the backend is reachable; the UI switches over automatically.
 */
export function readBackendUrl(): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const url = env?.VITE_ARB_API_URL?.trim();
  return url ? url : undefined;
}

export function createArbitrageFeed(options: ArbitrageFeedOptions): ArbitrageFeedHandle {
  const backendUrl = readBackendUrl();
  if (backendUrl) return createBackendClient({ ...options, url: backendUrl });
  return createMarketFeed(options);
}

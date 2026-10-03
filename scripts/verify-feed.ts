/**
 * End-to-end verification for the live arbitrage feed.
 *
 * Runs the exact `createArbitrageFeed` entry point the app uses (in market
 * mode), waits for real exchange data, then asserts that:
 *   - at least two exchange streams connected,
 *   - live quotes arrived,
 *   - arbitrage routes were derived from those quotes.
 *
 * Usage: bun scripts/verify-feed.ts
 */
import { createArbitrageFeed } from "../src/api/feed";
import type { FeedSnapshot } from "../src/api/types";

const RUN_MS = 9000;

let latest: FeedSnapshot | null = null;
let emissions = 0;

const feed = createArbitrageFeed({
  getIntervalMs: () => 500,
  getNetwork: () => "ethereum",
  onSnapshot: (snapshot) => {
    latest = snapshot;
    emissions += 1;
  }
});

await new Promise((resolve) => setTimeout(resolve, RUN_MS));
feed.close();

const s = latest;
console.log("---- feed verification ----");
console.log(`emissions: ${emissions}`);
if (!s) {
  console.log("FAIL: no snapshot was emitted");
  process.exit(1);
}
console.log(`status: ${s.status} | source: ${s.source} | connected: [${s.connectedExchanges.join(", ")}]`);
console.log(`quotes: ${s.quotes.length} | routes: ${s.routes.length} | updated: ${new Date(s.updatedAt).toISOString()}`);

for (const q of s.quotes.slice(0, 6)) {
  console.log(`  quote ${q.exchange} ${q.symbol}: bid=${q.bid} ask=${q.ask} (bidSize=${q.bidSize}, askSize=${q.askSize})`);
}
for (const r of s.routes.slice(0, 6)) {
  console.log(
    `  route ${r.exchangeFrom} -> ${r.exchangeTo} ${r.symbol} net=${r.network} spread=${r.spread}% buy=${r.buyPrice} sell=${r.sellPrice} vol=$${r.totalBuyUSD.toFixed(2)} fmt=${r.format}`
  );
}

const ok =
  s.status === "live" &&
  s.connectedExchanges.length >= 2 &&
  s.quotes.length >= 2 &&
  s.routes.length >= 1 &&
  s.routes.every((r) => Number.isFinite(r.spread) && r.symbol.length > 0);

console.log(ok ? "VERIFY OK" : "VERIFY FAILED");
process.exit(ok ? 0 : 1);

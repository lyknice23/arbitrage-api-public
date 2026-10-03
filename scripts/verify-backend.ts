/** Dev-only checks for the backend transport: payload normalization + offline handling. */
import { normalizeBackendPayload, createBackendClient } from "../src/api/backend";

// 1) Payload shapes from the README contract
const msg = {
  exchangeFrom: "binance", exchangeTo: "okx", symbol: "BTCUSDT", network: "ethereum",
  spread: 1.2, buyPrice: 100, sellPrice: 101.2, totalAmount: 1, totalBuyUSD: 100,
  totalSellUSD: 101.2, format: "transfer", withdrawFee: 0, depositFee: 0,
  isWithdrawEnabled: 1, isDepositEnabled: 1
};
const cases: [string, unknown, number][] = [
  ["single message", msg, 1],
  ["bare array", [msg, { ...msg, exchangeFrom: "kraken", exchangeTo: "bybit" }], 2],
  ["envelope routes", { routes: [msg] }, 1],
  ["envelope data", { data: [msg] }, 1],
  ["garbage", { foo: "bar" }, 0],
  ["array with junk", [msg, { nope: true }, "str"], 1]
];
let ok = true;
for (const [name, input, expected] of cases) {
  const got = normalizeBackendPayload(input).length;
  const passed = got === expected;
  console.log(`${passed ? "PASS" : "FAIL"}: normalize ${name} -> ${got} (want ${expected})`);
  if (!passed) ok = false;
}

// 2) Client against an unreachable backend: must emit, go offline, not crash.
const statuses: string[] = [];
const client = createBackendClient({
  url: "ws://127.0.0.1:39999",
  getIntervalMs: () => 300,
  getNetwork: () => "ethereum",
  onSnapshot: (s) => statuses.push(s.status)
});
await new Promise((r) => setTimeout(r, 2500));
client.close();
const sawConnectAttempt = statuses.includes("connecting");
const sawOffline = statuses.includes("offline");
console.log(`${sawConnectAttempt ? "PASS" : "FAIL"}: backend client emitted connecting (${statuses[0]})`);
console.log(`${sawOffline ? "PASS" : "FAIL"}: backend client reported offline after refused connection`);
if (!sawConnectAttempt || !sawOffline) ok = false;

console.log(ok ? "BACKEND CHECK OK" : "BACKEND CHECK FAILED");
process.exit(ok ? 0 : 1);

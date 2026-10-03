/**
 * Render smoke test: server-renders the full App tree (Monitor view by
 * default) to prove the component graph renders without throwing.
 * Usage: bun scripts/ssr-smoke.tsx
 */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "../src/App";

const html = renderToString(createElement(App));

const expectations: [string, boolean][] = [
  ["brand header", html.includes("Cryptoscan Arbitrage")],
  ["monitor view", html.includes("Arbitrage Monitor")],
  ["feed status chip", html.includes("Connecting feed")],
  ["routes empty state", html.includes("Waiting for the feed to connect")],
  ["exchange selector", html.includes("Bybit")],
  ["sample badge", html.includes("sample")]
];

let ok = true;
for (const [name, passed] of expectations) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
  if (!passed) ok = false;
}
console.log(ok ? "SSR SMOKE OK" : "SSR SMOKE FAILED");
process.exit(ok ? 0 : 1);

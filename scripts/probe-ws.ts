/** Dev-only connectivity probe for public exchange WebSocket feeds. */
const targets: { name: string; url: string; sub: string }[] = [
  {
    name: "bybit",
    url: "wss://stream.bybit.com/v5/public/spot",
    sub: JSON.stringify({ op: "subscribe", args: ["tickers.BTCUSDT"] })
  },
  {
    name: "okx",
    url: "wss://ws.okx.com:8443/ws/v5/public",
    sub: JSON.stringify({ op: "subscribe", args: [{ channel: "tickers", instId: "BTC-USDT" }] })
  },
  {
    name: "kraken",
    url: "wss://ws.kraken.com",
    sub: JSON.stringify({ method: "subscribe", params: { ticker: ["BTC/USDT"] } })
  },
  {
    name: "binance",
    url: "wss://stream.binance.com:9443/ws/btcusdt@bookTicker",
    sub: ""
  }
];

async function probe(t: (typeof targets)[number]): Promise<void> {
  await new Promise<void>((resolve) => {
    let got = false;
    const ws = new WebSocket(t.url);
    const done = (note: string) => {
      if (got) return;
      got = true;
      console.log(`${t.name}: ${note}`);
      try { ws.close(); } catch { /* ignore */ }
      resolve();
    };
    ws.onopen = () => { if (t.sub) ws.send(t.sub); };
    ws.onmessage = (ev) => done(`OK first message: ${String(ev.data).slice(0, 220)}`);
    ws.onerror = () => done("ERROR (connection failed)");
    ws.onclose = (ev) => done(`CLOSED code=${ev.code} reason=${ev.reason || "-"}`);
    setTimeout(() => done("TIMEOUT after 7s (no message)"), 7000);
  });
}

for (const t of targets) await probe(t);

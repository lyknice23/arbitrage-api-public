import type {
  ArbitrageFeedHandle,
  ArbitrageFeedOptions,
  ArbitrageMessage,
  FeedSnapshot,
  FeedStatus,
  Quote
} from "./types";

/**
 * Built-in live market feed.
 *
 * Connects directly to public exchange WebSocket streams (no API keys),
 * keeps a top-of-book quote table and derives cross-exchange arbitrage
 * routes in the exact `ArbitrageMessage` shape the arbitrage backend uses,
 * so the UI can consume either transport interchangeably.
 */

/** Symbols tracked by default — the liquid pairs common to all sources. */
export const DEFAULT_SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];

interface RawTick {
  /** Symbol as sent by the exchange (e.g. "BTCUSDT", "BTC-USDT"). */
  rawSymbol: string;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

type AdapterUrl = string | ((symbols: string[]) => string);

interface ExchangeAdapter {
  id: string;
  url: AdapterUrl;
  subscribe: (symbols: string[]) => string | null;
  parse: (msg: unknown) => RawTick[];
  ping?: { payload: string; everyMs: number };
}

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const compact = (symbol: string): string => symbol.replace(/[-/]/g, "").toUpperCase();

const parseJson = (data: unknown): unknown => {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const ADAPTERS: ExchangeAdapter[] = [
  {
    id: "bybit",
    url: "wss://stream.bybit.com/v5/public/spot",
    subscribe: (symbols) =>
      JSON.stringify({ op: "subscribe", args: symbols.map((s) => `orderbook.1.${compact(s)}`) }),
    ping: { payload: JSON.stringify({ op: "ping" }), everyMs: 20_000 },
    parse: (msg) => {
      const m = msg as { topic?: string; data?: Record<string, unknown> } | null;
      if (!m || typeof m.topic !== "string" || !m.topic.startsWith("orderbook.")) return [];
      const d = m.data;
      if (!d || typeof d.s !== "string") return [];
      const best = (levels: unknown, side: "bid" | "ask") => {
        if (!Array.isArray(levels)) return {};
        const top = levels.find(
          (e): e is [string, string] => Array.isArray(e) && typeof e[0] === "string" && e[0] !== ""
        );
        if (!top) return {};
        const price = toNum(top[0]);
        const size = toNum(top[1]);
        return side === "bid"
          ? { bid: price, bidSize: size }
          : { ask: price, askSize: size };
      };
      return [{ rawSymbol: d.s, ...best(d.b, "bid"), ...best(d.a, "ask") }];
    }
  },
  {
    id: "okx",
    url: "wss://ws.okx.com:8443/ws/v5/public",
    subscribe: (symbols) =>
      JSON.stringify({
        op: "subscribe",
        args: symbols.map((s) => ({
          channel: "tickers",
          instId: s.replace("/", "-").toUpperCase()
        }))
      }),
    parse: (msg) => {
      const m = msg as { arg?: { channel?: string }; data?: unknown } | null;
      if (!m || m.arg?.channel !== "tickers" || !Array.isArray(m.data)) return [];
      return m.data.flatMap((row) => {
        const r = row as Record<string, unknown>;
        if (typeof r?.instId !== "string") return [];
        return [
          {
            rawSymbol: r.instId,
            bid: toNum(r.bidPx),
            ask: toNum(r.askPx),
            bidSize: toNum(r.bidSz),
            askSize: toNum(r.askSz)
          }
        ];
      });
    }
  },
  {
    id: "kraken",
    url: "wss://ws.kraken.com/v2",
    subscribe: (symbols) =>
      JSON.stringify({
        method: "subscribe",
        params: { channel: "ticker", symbol: symbols.map((s) => s.toUpperCase()) }
      }),
    parse: (msg) => {
      const m = msg as { channel?: string; data?: unknown } | null;
      if (!m || m.channel !== "ticker" || !Array.isArray(m.data)) return [];
      return m.data.flatMap((row) => {
        const r = row as Record<string, unknown>;
        if (typeof r?.symbol !== "string") return [];
        return [
          {
            rawSymbol: r.symbol,
            bid: toNum(r.bid),
            ask: toNum(r.ask),
            bidSize: toNum(r.bid_qty),
            askSize: toNum(r.ask_qty)
          }
        ];
      });
    }
  },
  {
    id: "binance",
    url: (symbols: string[]) =>
      `wss://stream.binance.com:9443/stream?streams=${symbols
        .map((s) => `${compact(s).toLowerCase()}@bookTicker`)
        .join("/")}`,
    subscribe: () => null, // subscription happens in the URL
    parse: (msg) => {
      const m = msg as { data?: Record<string, unknown> } | null;
      const d = m?.data;
      if (!d || typeof d.s !== "string") return [];
      return [
        {
          rawSymbol: d.s,
          bid: toNum(d.b),
          ask: toNum(d.a),
          bidSize: toNum(d.B),
          askSize: toNum(d.A)
        }
      ];
    }
  }
];

const quoteKey = (exchange: string, symbol: string) => `${exchange}:${symbol}`;

interface Connection {
  adapter: ExchangeAdapter;
  ws: WebSocket | null;
  status: "connecting" | "live" | "down";
  attempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  pingTimer: ReturnType<typeof setInterval> | null;
}

export function createMarketFeed(options: ArbitrageFeedOptions): ArbitrageFeedHandle {
  const symbols = DEFAULT_SYMBOLS;
  const byRawSymbol = new Map<string, string>();
  for (const s of symbols) byRawSymbol.set(compact(s), s);

  const quotes = new Map<string, Quote>();
  const connections: Connection[] = ADAPTERS.map((adapter) => ({
    adapter,
    ws: null,
    status: "connecting",
    attempts: 0,
    reconnectTimer: null,
    pingTimer: null
  }));

  let closed = false;
  let dirty = true;
  let hadStatus = false;

  const computeStatus = (): FeedStatus => {
    if (connections.some((c) => c.status === "live")) return "live";
    if (connections.some((c) => c.status === "connecting")) return "connecting";
    return hadStatus ? "offline" : "connecting";
  };

  const buildRoutes = (): ArbitrageMessage[] => {
    const network = options.getNetwork();
    const routes: ArbitrageMessage[] = [];
    const live = connections.filter((c) => c.status === "live").map((c) => c.adapter.id);

    for (const symbol of symbols) {
      const book = live
        .map((exchange) => quotes.get(quoteKey(exchange, symbol)))
        .filter((q): q is Quote => !!q && q.bid > 0 && q.ask > 0);

      for (let i = 0; i < book.length; i++) {
        for (let j = i + 1; j < book.length; j++) {
          const a = book[i];
          const b = book[j];
          const buyA = { exchange: a.exchange, price: a.ask, size: a.askSize };
          const sellB = { exchange: b.exchange, price: b.bid, size: b.bidSize };
          const buyB = { exchange: b.exchange, price: b.ask, size: b.askSize };
          const sellA = { exchange: a.exchange, price: a.bid, size: a.bidSize };

          const dirAB = (sellB.price - buyA.price) / buyA.price;
          const dirBA = (sellA.price - buyB.price) / buyB.price;
          const [buy, sell, ratio] =
            dirAB >= dirBA ? [buyA, sellB, dirAB] : [buyB, sellA, dirBA];

          const amount = Math.min(buy.size, sell.size);
          routes.push({
            exchangeFrom: buy.exchange,
            exchangeTo: sell.exchange,
            symbol,
            network,
            spread: Math.round(ratio * 1_000_000) / 10_000, // percent, 4 dp
            buyPrice: buy.price,
            sellPrice: sell.price,
            totalAmount: amount,
            totalBuyUSD: amount * buy.price,
            totalSellUSD: amount * sell.price,
            format: "transfer",
            withdrawFee: 0,
            depositFee: 0,
            isWithdrawEnabled: 1,
            isDepositEnabled: 1
          });
        }
      }
    }
    return routes.sort((x, y) => y.spread - x.spread);
  };

  const emit = () => {
    hadStatus = true;
    const snapshot: FeedSnapshot = {
      status: computeStatus(),
      source: "market",
      connectedExchanges: connections
        .filter((c) => c.status === "live")
        .map((c) => c.adapter.id),
      routes: buildRoutes(),
      quotes: [...quotes.values()],
      updatedAt: Date.now()
    };
    dirty = false;
    options.onSnapshot(snapshot);
  };

  const applyTick = (exchange: string, tick: RawTick) => {
    const symbol = byRawSymbol.get(compact(tick.rawSymbol));
    if (!symbol) return;
    const key = quoteKey(exchange, symbol);
    const prev = quotes.get(key);
    const next: Quote = {
      exchange,
      symbol,
      bid: tick.bid ?? prev?.bid ?? 0,
      ask: tick.ask ?? prev?.ask ?? 0,
      bidSize: tick.bidSize ?? prev?.bidSize ?? 0,
      askSize: tick.askSize ?? prev?.askSize ?? 0,
      ts: Date.now()
    };
    quotes.set(key, next);
    dirty = true;
  };

  const disconnect = (conn: Connection) => {
    if (conn.pingTimer) clearInterval(conn.pingTimer);
    conn.pingTimer = null;
    if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
    conn.reconnectTimer = null;
    const ws = conn.ws;
    conn.ws = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    }
  };

  const connect = (conn: Connection) => {
    if (closed) return;
    disconnect(conn);
    conn.status = "connecting";
    emit();

    const { adapter } = conn;
    const url = typeof adapter.url === "function" ? adapter.url(symbols) : adapter.url;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect(conn);
      return;
    }
    conn.ws = ws;

    ws.onopen = () => {
      if (closed || conn.ws !== ws) return;
      conn.status = "live";
      conn.attempts = 0;
      const payload = adapter.subscribe(symbols);
      if (payload) ws.send(payload);
      if (adapter.ping) {
        conn.pingTimer = setInterval(() => {
          if (conn.ws === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(adapter.ping!.payload);
          }
        }, adapter.ping.everyMs);
      }
      emit();
    };
    ws.onmessage = (ev) => {
      if (closed || conn.ws !== ws) return;
      const msg = parseJson(ev.data);
      if (!msg || typeof msg !== "object") return;
      for (const tick of adapter.parse(msg)) applyTick(conn.adapter.id, tick);
    };
    ws.onerror = () => {
      /* handled by onclose */
    };
    ws.onclose = () => {
      if (closed || conn.ws !== ws) return;
      conn.status = "down";
      emit();
      scheduleReconnect(conn);
    };
  };

  const scheduleReconnect = (conn: Connection) => {
    if (closed) return;
    conn.status = "down";
    conn.attempts += 1;
    dirty = true; // surface the status change on the next flush
    const delay = Math.min(1000 * 2 ** Math.min(conn.attempts, 4), 15_000);
    conn.reconnectTimer = setTimeout(() => connect(conn), delay);
  };

  for (const conn of connections) connect(conn);

  const flushTimer = setInterval(() => {
    if (dirty) emit();
  }, Math.max(250, options.getIntervalMs()));

  return {
    source: "market",
    close: () => {
      closed = true;
      clearInterval(flushTimer);
      for (const conn of connections) disconnect(conn);
    }
  };
}

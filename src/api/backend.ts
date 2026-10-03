import type {
  ArbitrageFeedHandle,
  ArbitrageFeedOptions,
  ArbitrageMessage,
  FeedSnapshot,
  FeedStatus
} from "./types";

/**
 * Client for the arbitrage backend WebSocket server documented in the
 * README (`ws://<host>:3000`, message shape `ArbitrageMessage`).
 *
 * Tolerant of the payload being a single message, an array of messages,
 * or an object envelope carrying an array under a common key.
 */

const isArbitrageMessage = (v: unknown): v is ArbitrageMessage => {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.exchangeFrom === "string" &&
    typeof m.exchangeTo === "string" &&
    typeof m.spread === "number"
  );
};

const LIST_KEYS = ["opportunities", "routes", "items", "data", "messages"];

/** Extract ArbitrageMessage items from any accepted server payload shape. */
export function normalizeBackendPayload(payload: unknown): ArbitrageMessage[] {
  if (Array.isArray(payload)) return payload.filter(isArbitrageMessage);
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of LIST_KEYS) {
      const value = obj[key];
      if (Array.isArray(value)) return value.filter(isArbitrageMessage);
    }
    if (isArbitrageMessage(obj)) return [obj];
  }
  return [];
}

const routeKey = (m: ArbitrageMessage) =>
  `${m.exchangeFrom}:${m.exchangeTo}:${m.symbol}:${m.network}`;

export interface BackendClientOptions extends ArbitrageFeedOptions {
  url: string;
}

export function createBackendClient(options: BackendClientOptions): ArbitrageFeedHandle {
  let ws: WebSocket | null = null;
  let status: FeedStatus = "connecting";
  let routes: ArbitrageMessage[] = [];
  let attempts = 0;
  let closed = false;
  let dirty = true;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const computeStatus = (): FeedStatus => {
    if (ws && ws.readyState === WebSocket.OPEN) return "live";
    return status;
  };

  const emit = () => {
    const snapshot: FeedSnapshot = {
      status: computeStatus(),
      source: "backend",
      connectedExchanges: [...new Set(routes.flatMap((r) => [r.exchangeFrom, r.exchangeTo]))],
      routes: [...routes],
      quotes: [],
      updatedAt: Date.now()
    };
    dirty = false;
    options.onSnapshot(snapshot);
  };

  const scheduleReconnect = () => {
    if (closed) return;
    status = "offline";
    dirty = true;
    attempts += 1;
    const delay = Math.min(1000 * 2 ** Math.min(attempts, 4), 15_000);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, delay);
  };

  const connect = () => {
    if (closed) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    status = "connecting";
    dirty = true;
    emit();

    let socket: WebSocket;
    try {
      socket = new WebSocket(options.url);
    } catch {
      scheduleReconnect();
      return;
    }
    ws = socket;

    socket.onopen = () => {
      if (closed || ws !== socket) return;
      attempts = 0;
      status = "live";
      emit();
    };
    socket.onmessage = (ev) => {
      if (closed || ws !== socket) return;
      let payload: unknown;
      try {
        payload = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data));
      } catch {
        return;
      }
      const incoming = normalizeBackendPayload(payload);
      if (incoming.length === 0) return;
      if (Array.isArray(payload)) {
        // Full list: replace the previous snapshot wholesale.
        routes = incoming;
      } else {
        // Streamed message(s): upsert by route identity.
        const byKey = new Map(routes.map((r) => [routeKey(r), r]));
        for (const r of incoming) byKey.set(routeKey(r), r);
        routes = [...byKey.values()].sort((a, b) => b.spread - a.spread);
      }
      dirty = true;
      emit();
    };
    socket.onerror = () => {
      /* handled by onclose */
    };
    socket.onclose = () => {
      if (closed || ws !== socket) return;
      ws = null;
      scheduleReconnect();
    };
  };

  connect();

  const flushTimer = setInterval(() => {
    if (dirty) emit();
  }, Math.max(250, options.getIntervalMs()));

  return {
    source: "backend",
    close: () => {
      closed = true;
      clearInterval(flushTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const socket = ws;
      ws = null;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        try {
          socket.close();
        } catch {
          /* already closed */
        }
      }
    }
  };
}

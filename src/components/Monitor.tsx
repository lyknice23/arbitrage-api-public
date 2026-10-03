import { useMemo, useState } from "react";
import { useArbitrageStore } from "../store";
import type { Exchange, Network } from "../store";
import { mockDeposits } from "../data";
import { getExchangeConfig, getNetworkConfig } from "../config";
import SamplePill from "./SamplePill";

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);

const fmtPrice = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 2 : n >= 1 ? 4 : 6 });

const fmtTime = (ts: number) => (ts ? new Date(ts).toLocaleTimeString() : "—");

const exchangeLabel = (id: string) => getExchangeConfig(id as Exchange)?.label ?? id;
const networkLabel = (id: string) => getNetworkConfig(id as Network)?.label ?? id;

export default function Monitor() {
  const exchange = useArbitrageStore((s) => s.exchange);
  const network = useArbitrageStore((s) => s.network);
  const refreshRateMs = useArbitrageStore((s) => s.refreshRateMs);
  const setRefreshRateMs = useArbitrageStore((s) => s.setRefreshRateMs);
  const setExchange = useArbitrageStore((s) => s.setExchange);
  const feedStatus = useArbitrageStore((s) => s.feedStatus);
  const feedSource = useArbitrageStore((s) => s.feedSource);
  const connectedExchanges = useArbitrageStore((s) => s.connectedExchanges);
  const routes = useArbitrageStore((s) => s.routes);
  const quotes = useArbitrageStore((s) => s.quotes);
  const feedUpdatedAt = useArbitrageStore((s) => s.feedUpdatedAt);
  const bumpFeedEpoch = useArbitrageStore((s) => s.bumpFeedEpoch);

  const [minSpread, setMinSpread] = useState(0);
  const [token, setToken] = useState("SOL");
  const [depositAmount] = useState("24.85");
  const [depositBtn, setDepositBtn] = useState("Modify");

  const filteredDeposits = useMemo(() => {
    return mockDeposits.filter((d) => d.symbol.toLowerCase().includes(token.toLowerCase()));
  }, [token]);

  const visibleRoutes = useMemo(
    () => routes.filter((r) => r.spread >= minSpread).slice(0, 8),
    [routes, minSpread]
  );

  const spreads = visibleRoutes.map((r) => r.spread);
  const maxSpread = spreads.length ? Math.max(...spreads) : 0;
  const minSpreadSeen = spreads.length ? Math.min(...spreads) : 0;
  const spreadRange = maxSpread - minSpreadSeen || 1;

  // Only ever show the selected exchange's own quote — never another one's.
  const selectedQuote = quotes.find((q) => q.exchange === exchange);

  const cycleExchange = () => {
    const order = (
      connectedExchanges.length ? connectedExchanges : ["binance", "bybit"]
    ) as Exchange[];
    const idx = order.indexOf(exchange);
    setExchange(order[(idx + 1) % order.length]);
  };

  const feedStatusDot =
    feedStatus === "live"
      ? "bg-emerald-400"
      : feedStatus === "offline"
        ? "bg-rose-400"
        : "bg-amber-400 animate-pulse";

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">Live pool</p>
          <h2 className="text-2xl font-bold tracking-tight">Arbitrage Monitor</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Refresh </span>
            <input
              type="range"
              min={500}
              max={5000}
              step={500}
              value={refreshRateMs}
              onChange={(e) => setRefreshRateMs(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
            <span className="w-10 text-right tabular-nums text-xs text-white/70">{refreshRateMs}ms</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Min spread </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={minSpread}
              onChange={(e) => setMinSpread(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
            <span className="w-10 text-right tabular-nums text-xs text-white/70">{minSpread.toFixed(2)}%</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Network</h3>
            <div className="flex items-center gap-2">
              <SamplePill />
              <span className="text-xs text-white/40">{networkLabel(network)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-white/80">Healthy</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-white/40">Deposit</p>
              <p className="text-xl font-semibold tabular-nums">{depositAmount} SOL</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Withdraw</p>
              <p className="text-xl font-semibold tabular-nums">{depositAmount} SOL</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => setDepositBtn(depositBtn === "Modify" ? "Reset" : "Modify")}
            >
              {depositBtn}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Exchange</h3>
            <span className="text-xs text-white/40">{exchangeLabel(exchange)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-white/40">
                Bid {selectedQuote ? `(${selectedQuote.symbol})` : ""}
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {selectedQuote ? fmtPrice(selectedQuote.bid) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">
                Ask {selectedQuote ? `(${selectedQuote.symbol})` : ""}
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {selectedQuote ? fmtPrice(selectedQuote.ask) : "—"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            {selectedQuote
              ? "Futures: awaiting backend feed"
              : "Not connected — toggle to a live exchange"}
          </p>
          <div className="mt-4">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-2 text-sm font-semibold text-white transition hover:from-brand-500 hover:to-brand-400"
              onClick={cycleExchange}
            >
              Toggle exchange
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Feed</h3>
            <span className="text-xs text-white/40">
              {feedSource === "backend" ? "backend ws" : feedSource === "market" ? "market ws" : "—"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
            <span className={`h-2 w-2 rounded-full ${feedStatusDot}`} />
            {feedStatus === "live"
              ? `Live · ${connectedExchanges.length} exchange${connectedExchanges.length === 1 ? "" : "s"}`
              : feedStatus === "offline"
                ? "Offline — retrying"
                : "Connecting…"}
          </div>
          <p className="mt-2 truncate text-xs text-white/50" title={connectedExchanges.join(", ")}>
            {connectedExchanges.length ? connectedExchanges.map(exchangeLabel).join(" · ") : "no streams yet"}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Updated {fmtTime(feedUpdatedAt)} · every {refreshRateMs}ms
          </p>
          <div className="mt-4">
            <button
              className="w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => bumpFeedEpoch()}
            >
              Reconnect
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/70">Deposits</h3>
            <SamplePill />
          </div>
          <div className="flex gap-2">
            <input
              className="rounded-lg border-0 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none"
              placeholder="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => setToken("")}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredDeposits.map((dep) => (
            <div key={dep.wallet} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <div>
                <p className="font-semibold text-white">{dep.symbol}</p>
                <p className="text-xs text-white/40">{dep.wallet}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-white">{dep.amount}</span>
            </div>
          ))}
          {filteredDeposits.length === 0 && (
            <p className="text-sm text-white/40">No sample deposits match “{token}”.</p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/70">Arbitrage Routes</h3>
            <span
              className={`h-2 w-2 rounded-full ${feedStatus === "live" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
            />
          </div>
          <span className="text-xs text-white/40">
            {visibleRoutes.length} of {routes.length} live routes · {fmtTime(feedUpdatedAt)}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {visibleRoutes.map((r) => {
            const barWidth = 12 + 84 * ((r.spread - minSpreadSeen) / spreadRange);
            return (
              <div
                key={`${r.exchangeFrom}-${r.exchangeTo}-${r.symbol}-${r.network}`}
                className="flex items-center gap-4 rounded-xl bg-white/5 p-4"
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full ${r.spread >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {exchangeLabel(r.exchangeFrom)} <span className="text-white/40">→</span>{" "}
                      {exchangeLabel(r.exchangeTo)}
                      <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/60">
                        {r.symbol}
                      </span>
                    </p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        r.spread >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {r.spread >= 0 ? "+" : ""}
                      {r.spread.toFixed(4)}%
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                      style={{ width: `${Math.max(6, Math.min(100, barWidth))}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-4 text-xs tabular-nums text-white/40">
                    <span>Buy {fmtPrice(r.buyPrice)}</span>
                    <span>Sell {fmtPrice(r.sellPrice)}</span>
                    <span>Vol {formatUsd(r.totalBuyUSD)}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-white">
                  <p className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/60">
                    {r.format}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{networkLabel(r.network)}</p>
                </div>
              </div>
            );
          })}

          {visibleRoutes.length === 0 && (
            <div className="rounded-xl bg-white/5 p-6 text-center text-sm text-white/50">
              {routes.length === 0
                ? feedStatus === "live"
                  ? "Connected — waiting for quotes from at least two exchanges…"
                  : "Waiting for the feed to connect…"
                : `No routes at or above ${minSpread.toFixed(2)}% right now.`}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

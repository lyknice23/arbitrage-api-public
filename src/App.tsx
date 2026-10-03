import { useEffect, useState } from "react";
import { createArbitrageFeed } from "./api";
import { useArbitrageStore } from "./store";
import { exchangeConfig, networkConfig, defaultExchange, defaultNetwork } from "./config";
import type { Exchange, Network } from "./store";
import Monitor from "./components/Monitor";
import Explorer from "./components/Explorer";

export default function App() {
  const [view, setView] = useState<"monitor" | "explorer">("monitor");
  const exchange = useArbitrageStore((s) => s.exchange);
  const network = useArbitrageStore((s) => s.network);
  const setExchange = useArbitrageStore((s) => s.setExchange);
  const setNetwork = useArbitrageStore((s) => s.setNetwork);
  const feedStatus = useArbitrageStore((s) => s.feedStatus);
  const feedSource = useArbitrageStore((s) => s.feedSource);
  const connectedExchanges = useArbitrageStore((s) => s.connectedExchanges);
  const feedEpoch = useArbitrageStore((s) => s.feedEpoch);
  const bumpFeedEpoch = useArbitrageStore((s) => s.bumpFeedEpoch);

  useEffect(() => {
    const feed = createArbitrageFeed({
      getIntervalMs: () => useArbitrageStore.getState().refreshRateMs,
      getNetwork: () => useArbitrageStore.getState().network,
      onSnapshot: (snapshot) => useArbitrageStore.getState().setFeedSnapshot(snapshot)
    });
    return () => feed.close();
  }, [feedEpoch]);

  const statusDot =
    feedStatus === "live"
      ? "bg-emerald-400"
      : feedStatus === "connecting" || feedStatus === "idle"
        ? "bg-amber-400 animate-pulse"
        : "bg-rose-400";
  const statusText =
    feedStatus === "live"
      ? `Live · ${feedSource === "backend" ? "backend" : "market data"} (${connectedExchanges.length})`
      : feedStatus === "offline"
        ? "Feed offline — retrying"
        : "Connecting feed…";

  return (
    <div className="min-h-screen bg-[#0a0912] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-500/20">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Cryptoscan Arbitrage</h1>
              <p className="text-xs text-white/50">Real-time opportunity feed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 sm:inline-flex"
              title={connectedExchanges.length ? `Connected: ${connectedExchanges.join(", ")}` : "No feeds connected yet"}
            >
              <span className={`h-2 w-2 rounded-full ${statusDot}`} />
              {statusText}
            </span>
            <nav className="flex gap-2">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === "monitor"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setView("monitor")}
            >
              Monitor
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === "explorer"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setView("explorer")}
            >
              Explorer
            </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-white/70" htmlFor="exchange">Exchange</label>
          <select
            id="exchange"
            className="rounded-xl border-0 bg-white/10 px-4 py-2.5 font-semibold text-white outline-none backdrop-blur-sm outline-ring/40 focus:outline-2 focus:outline-brand-400/40"
            value={exchange}
            onChange={(e) => setExchange(e.target.value as Exchange)}
          >
            {exchangeConfig.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.label}</option>
            ))}
          </select>

          <label className="text-sm font-medium text-white/70" htmlFor="network">Network</label>
          <select
            id="network"
            className="rounded-xl border-0 bg-white/10 px-4 py-2.5 font-semibold text-white outline-none backdrop-blur-sm outline-ring/40 focus:outline-2 focus:outline-brand-400/40"
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
          >
            {networkConfig.map((net) => (
              <option key={net.id} value={net.id}>{net.label}</option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() => {
              bumpFeedEpoch();
              setView("monitor");
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Start Live Feed
          </button>
        </div>

        {view === "monitor" ? <Monitor /> : <Explorer />}
      </main>
    </div>
  );
}

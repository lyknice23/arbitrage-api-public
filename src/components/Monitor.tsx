import { useEffect, useMemo, useState } from "react";
import { useArbitrageStore } from "../store";
import { mockDeposits, exchangeMetrics } from "../data";

const useStore = useArbitrageStore;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);

export default function Monitor() {
  const exchange = useArbitrageStore((s) => s.exchange);
  const network = useArbitrageStore((s) => s.network);
  const refreshRateMs = useArbitrageStore((s) => s.refreshRateMs);
  const setRefreshRateMs = useArbitrageStore((s) => s.setRefreshRateMs);
  const setExchange = useStore((s) => s.setExchange);
  const setNetwork = useStore((s) => s.setNetwork);

  const [havels, setHavels] = useState<{ exchange: string; value: number; change: number }[]>([
    { exchange: "Binance", value: 1842.2, change: 0.00 },
    { exchange: "Bybit", value: 1839.75, change: 0.00 },
    { exchange: "OKX", value: 1841.05, change: 0.00 }
  ]);
  const [swapRate, setSwapRate] = useState(0.18);
  const [spreadWidth, setSpreadWidth] = useState(30);
  const [wallet, setWallet] = useState("0x7F5...2C41");
  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("1000");
  const [depositAmount, setDepositAmount] = useState("24.85");
  const [depositAction, setDepositAction] = useState<"modified" | "enabled" | "pending">("enabled");
  const [depositBtn, setDepositBtn] = useState("Modify");

  useEffect(() => {
    const id = setInterval(() => {
      setHavels((prev) =>
        prev.map((h) => ({
          ...h,
          value: h.value + (Math.random() - 0.5) * 4,
          change: Math.max(-2.5, Math.min(2.5, (Math.random() - 0.5) * 0.6))
        }))
      );
      setSwapRate((r) => Math.min(1, Math.max(0, r + (Math.random() - 0.5) * 0.04)));
      setSpreadWidth((w) => Math.min(92, Math.max(8, w + (Math.random() - 0.5) * 8)));
    }, refreshRateMs);
    return () => clearInterval(id);
  }, [refreshRateMs]);

  const filteredDeposits = useMemo(() => {
    return mockDeposits.filter((d) => {
      const tokenOk = d.symbol.toLowerCase().includes(token.toLowerCase());
      return tokenOk;
    });
  }, [token]);

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
            <span>Swap </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={swapRate}
              onChange={(e) => setSwapRate(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
            <span className="w-12 text-right tabular-nums text-xs text-white/70">{((swapRate * 100).toFixed(0)) + "%"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Spread </span>
            <input
              type="range"
              min={0}
              max={92}
              value={spreadWidth}
              onChange={(e) => setSpreadWidth(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/20 outline-none"
            />
            <span className="w-10 text-right tabular-nums text-xs text-white/70">{spreadWidth}%</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Network</h3>
            <span className="text-xs text-white/40">{network}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-white/80">Healthy</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-white/40">Deposit</p>
              <p className="text-xl font-semibold tabular-nums">{depositAmount} {token}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Withdraw</p>
              <p className="text-xl font-semibold tabular-nums">{depositAmount} {token}</p>
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
          <h3 className="text-sm font-semibold text-white/70">Exchange</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-white/40">Spot</p>
              <p className="text-xl font-semibold tabular-nums">{exchangeMetrics.find((m) => m.exchange === "Binance")?.spot}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Futures</p>
              <p className="text-xl font-semibold tabular-nums">{exchangeMetrics.find((m) => m.exchange === "Binance")?.futures}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-2 text-sm font-semibold text-white transition hover:from-brand-500 hover:to-brand-400"
              onClick={() => setExchange(exchange === "binance" ? "bybit" : "binance")}
            >
              Toggle exchange
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white/70">Live Mode</h3>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Real-time updates active
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Auto reconnect
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => setDepositAction(depositAction === "enabled" ? "modified" : "enabled")}
            >
              {depositAction === "enabled" ? "Already enabled" : "Enable"}
            </button>
            <button
              className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => setDepositAction(depositAction === "modified" ? "pending" : "modified")}
            >
              {depositAction === "modified" ? "Modify" : "Reconfirm"}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Deposits</h3>
          <div className="flex gap-2">
            <input
              className="rounded-lg border-0 bg-white/5 px-3 py-1.5 text-sm font-medium text-white outline-none"
              placeholder="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => setDepositAction("pending")}
            >
              Add
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
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Arbitrage Routes</h3>
          <span className="text-xs text-white/40">Auto-detected</span>
        </div>

        <div className="mt-4 space-y-3">
          {havels.map((deal, i) => (
            <div key={deal.exchange} className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{deal.exchange}</p>
                  <p className={`text-xs font-semibold tabular-nums ${deal.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {deal.change >= 0 ? "+" : ""}{deal.change.toFixed(2)}%
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                    style={{ width: `${20 + (deal.value / 2000) * 75}%` }}
                  />
                </div>
              </div>
              <div className="text-right text-sm tabular-nums text-white">
                <p>Format: {i % 2 === 0 ? "hedge" : "transfer"}</p>
                <p className="text-xs text-white/40">{deal.value.toFixed(2)} BTC</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

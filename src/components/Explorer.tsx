import { useArbitrageStore } from "../store";
import { opportunityMap } from "../data";
import { exchangeConfig } from "../config";
import SamplePill from "./SamplePill";

export default function Explorer() {
  const exchange = useArbitrageStore((s) => s.exchange);
  const network = useArbitrageStore((s) => s.network);
  const quotes = useArbitrageStore((s) => s.quotes);

  // Live top-of-book per configured exchange (real feed data).
  const metricRows = exchangeConfig.map((ex) => {
    const quote =
      quotes.find((q) => q.exchange === ex.id && q.symbol === "BTC/USDT") ??
      quotes.find((q) => q.exchange === ex.id);
    const spreadBps =
      quote && quote.bid > 0 && quote.ask > 0
        ? ((quote.ask - quote.bid) / quote.bid) * 10_000
        : null;
    return { id: ex.id, label: ex.label, quote, spreadBps };
  });

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/70">Pair Explorer</h3>
            <SamplePill />
          </div>
          <span className="text-xs text-white/40">{exchange} · {network}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {opportunityMap.map((item) => (
            <div key={item.pair} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">{item.pair}</h4>
                <span className="text-xs text-white/40">Spot→Futures</span>
              </div>
              <div className="mt-3">
                <svg className="h-16 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`grad-${item.pair}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5c4bff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#5c4bff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect fill={`url(#grad-${item.pair})`} x="4" y="2" width="92" height="36" rx="2" />
                  <polyline
                    fill="none"
                    stroke="#5c4bff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="12,34 38,22 56,29 78,14 88,16"
                  />
                </svg>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-white/70">{item.type}</span>
                <span className="text-white font-semibold">~1.42%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Exchange Metrics</h3>
          <span className="text-xs text-white/40">live top-of-book</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="pb-2 font-medium">Exchange</th>
                <th className="pb-2 font-medium">Symbol</th>
                <th className="pb-2 font-medium">Bid</th>
                <th className="pb-2 font-medium">Ask</th>
                <th className="pb-2 font-medium">Spread (bps)</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="py-2 font-medium text-white">{row.label}</td>
                  <td className="py-2 text-white/60">{row.quote?.symbol ?? "—"}</td>
                  <td className="py-2 text-white/80 tabular-nums">
                    {row.quote
                      ? row.quote.bid.toLocaleString("en-US", {
                          maximumFractionDigits: row.quote.bid >= 100 ? 2 : 6
                        })
                      : "—"}
                  </td>
                  <td className="py-2 text-white/80 tabular-nums">
                    {row.quote
                      ? row.quote.ask.toLocaleString("en-US", {
                          maximumFractionDigits: row.quote.ask >= 100 ? 2 : 6
                        })
                      : "—"}
                  </td>
                  <td className="py-2 text-white/80 tabular-nums">
                    {row.spreadBps !== null ? row.spreadBps.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-white/40">
          Rows populate as each exchange stream connects; futures metrics arrive with the
          backend feed.
        </p>
      </section>
    </div>
  );
}

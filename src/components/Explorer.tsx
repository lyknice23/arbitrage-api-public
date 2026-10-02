import { useArbitrageStore } from "../store";
import { opportunityMap, exchangeMetrics } from "../data";

export default function Explorer() {
  const exchange = useArbitrageStore((s) => s.exchange);
  const network = useArbitrageStore((s) => s.network);

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Pair Explorer</h3>
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
        <h3 className="text-sm font-semibold text-white/70">Exchange Metrics</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-white/40">
                <th className="pb-2 font-medium">Exchange</th>
                <th className="pb-2 font-medium">Spot</th>
                <th className="pb-2 font-medium">Futures</th>
              </tr>
            </thead>
            <tbody>
              {exchangeMetrics.map((m) => (
                <tr key={m.exchange} className="border-b border-white/5">
                  <td className="py-2 font-medium text-white">{m.exchange}</td>
                  <td className="py-2 text-white/80 tabular-nums">{m.spot}</td>
                  <td className="py-2 text-white/80 tabular-nums">{m.futures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

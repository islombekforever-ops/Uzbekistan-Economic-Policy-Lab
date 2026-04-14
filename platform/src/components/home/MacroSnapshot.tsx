"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Nowcast, Indicator } from "@/lib/types";

const SNAPSHOT_IDS = [
  "ip_uzs", "retail_trade_grwth", "const_grwth", "exp",
  "cpi_goods", "m2", "bank_trans", "uzs_usd",
];

const LABELS: Record<string, { name: string; icon: string }> = {
  ip_uzs:             { name: "Industrial Output",    icon: "🏭" },
  retail_trade_grwth: { name: "Retail Trade",         icon: "🛒" },
  const_grwth:        { name: "Construction",         icon: "🏗️" },
  exp:                { name: "Exports",               icon: "🚢" },
  cpi_goods:          { name: "CPI — Goods",          icon: "🛍️" },
  m2:                 { name: "Broad Money (M2)",     icon: "💰" },
  bank_trans:         { name: "Bank Transactions",    icon: "🏦" },
  uzs_usd:            { name: "UZS / USD Rate",       icon: "💱" },
};

export function MacroSnapshot({
  nowcast, indicators,
}: {
  nowcast: Nowcast;
  indicators: Indicator[];
}) {
  const map = Object.fromEntries(indicators.map((i) => [i.id, i]));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* GDP Nowcast — featured card */}
      <div
        className="col-span-2 md:col-span-1 rounded-2xl p-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 50%, #0d9488 150%)",
          boxShadow: "0 4px 24px rgba(13,31,60,0.35)",
        }}
      >
        {/* Glow orb */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-15"
             style={{ background: "radial-gradient(circle, #0d9488, transparent 70%)" }} />
        <div className="text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">
          GDP Nowcast · {nowcast.current_quarter}
        </div>
        <div className="text-4xl font-black mt-2 tabular-nums">
          +{nowcast.yoy_growth.toFixed(1)}%
        </div>
        <div className="text-sm text-slate-300 mt-0.5">Year-on-Year</div>
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400">
          QoQ: <span className="text-white font-bold">+{nowcast.qoq_growth.toFixed(2)}%</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          CI: {nowcast.uncertainty.yoy_lower.toFixed(1)}–{nowcast.uncertainty.yoy_upper.toFixed(1)}%
        </div>
      </div>

      {/* Indicator cards */}
      {SNAPSHOT_IDS.map((id, idx) => {
        const ind = map[id];
        if (!ind) return null;
        const val = ind.latest_yoy;
        const mom = ind.latest_mom;
        const positive = val > 0.1;
        const negative = val < -0.1;
        const info = LABELS[id] ?? { name: id, icon: "📈" };

        return (
          <div key={id} className="metric-card animate-slide-up"
               style={{ animationDelay: `${idx * 0.05}s` }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{info.icon}</span>
                <span className="text-xs text-slate-500 font-medium leading-tight">{info.name}</span>
              </div>
              <div className={`p-1.5 rounded-lg ${
                negative ? "bg-red-50 text-red-500" :
                positive  ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-100 text-slate-500"
              }`}>
                {negative ? <TrendingDown size={13} /> :
                 positive  ? <TrendingUp  size={13} /> :
                             <Minus       size={13} />}
              </div>
            </div>

            {/* YoY value */}
            <div className={`text-2xl font-black tabular-nums ${
              negative ? "text-red-500" : positive ? "text-emerald-600" : "text-slate-700"
            }`}>
              {positive ? "+" : ""}{val.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Year-on-Year</div>

            {/* MoM mini bar */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">MoM</span>
              <span className={`text-xs font-bold tabular-nums ${
                mom > 0 ? "text-emerald-600" : mom < 0 ? "text-red-500" : "text-slate-500"
              }`}>
                {mom >= 0 ? "+" : ""}{mom.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Nowcast, Indicator } from "@/lib/types";

const SNAPSHOT_IDS = [
  "ip_uzs", "retail_trade_grwth", "const_grwth", "exp",
  "cpi_goods", "m2", "bank_trans", "uzs_usd",
];

const LABELS: Record<string, string> = {
  ip_uzs: "Industrial Production",
  retail_trade_grwth: "Retail Trade",
  const_grwth: "Construction",
  exp: "Exports",
  cpi_goods: "CPI Goods",
  m2: "Broad Money (M2)",
  bank_trans: "Bank Transactions",
  uzs_usd: "UZS/USD Rate",
};

export function MacroSnapshot({
  nowcast, indicators,
}: {
  nowcast: Nowcast;
  indicators: Indicator[];
}) {
  const map = Object.fromEntries(indicators.map((i) => [i.id, i]));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* GDP Nowcast card — highlighted */}
      <div
        className="col-span-2 md:col-span-1 rounded-xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)" }}
      >
        <div className="text-xs font-semibold text-teal-300 mb-1 uppercase tracking-wide">
          GDP Nowcast · {nowcast.current_quarter}
        </div>
        <div className="text-3xl font-black mb-1">
          +{nowcast.yoy_growth.toFixed(1)}%
        </div>
        <div className="text-sm text-slate-300">Year-on-Year</div>
        <div className="mt-2 text-xs text-slate-400">
          QoQ: +{nowcast.qoq_growth.toFixed(2)}%
        </div>
        <div
          className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20"
          style={{ background: "#0d9488" }}
        />
      </div>

      {/* Indicator cards */}
      {SNAPSHOT_IDS.map((id) => {
        const ind = map[id];
        if (!ind) return null;
        const val = ind.latest_yoy;
        const positive = val >= 0;
        const neutral = Math.abs(val) < 0.1;

        return (
          <div key={id} className="metric-card">
            <div className="text-xs text-slate-500 mb-2 font-medium">{LABELS[id]}</div>
            <div className="flex items-end justify-between">
              <div>
                <span
                  className={`text-2xl font-bold ${
                    neutral ? "text-slate-700" : positive ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {positive && !neutral ? "+" : ""}
                  {val.toFixed(1)}%
                </span>
                <div className="text-xs text-slate-400 mt-0.5">Year-on-Year</div>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  neutral
                    ? "bg-slate-100 text-slate-500"
                    : positive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {neutral ? (
                  <Minus size={16} />
                ) : positive ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              MoM: {ind.latest_mom >= 0 ? "+" : ""}
              {ind.latest_mom.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, TooltipProps,
} from "recharts";
import { CGEResult, ShockType } from "@/lib/cgeSolver";
import { SCENARIOS } from "./ScenarioPanel";

interface Props {
  result: CGEResult;
  shockType: ShockType;
  shockSize: number;
}

const KPI_DEFS = [
  { key: "gdp_real",     label: "Real GDP",         icon: "📈", color: "#0d9488" },
  { key: "consumption",  label: "Consumption",      icon: "🛒", color: "#3b82f6" },
  { key: "exports",      label: "Export Volume",    icon: "🚢", color: "#f59e0b" },
  { key: "imports",      label: "Import Volume",    icon: "📥", color: "#ef4444" },
  { key: "price_level",  label: "CPI",              icon: "💰", color: "#8b5cf6" },
  { key: "exchange_rate",label: "Exchange Rate",    icon: "💱", color: "#ec4899" },
  { key: "welfare",      label: "Consumer Welfare", icon: "😊", color: "#06b6d4" },
  { key: "trade_balance",label: "Trade Balance",    icon: "⚖️", color: "#64748b" },
] as const;

export function ResultsDisplay({ result, shockType, shockSize }: Props) {
  const scenario = SCENARIOS.find((s) => s.id === shockType)!;
  const sign = (v: number) => (v > 0 ? "+" : "");
  const isPos = (v: number) => v >= 0;

  // Insight logic
  const gdp = result.gdp_real;
  const welf = result.welfare;
  const insightClass =
    gdp > 0.5 && welf > 0 ? "insight-positive" :
    gdp < -0.5 || welf < -0.5 ? "insight-negative" :
    Math.abs(result.price_level) > 1 ? "insight-warning" : "insight-neutral";
  const insightText = buildInsight(shockType, shockSize, result);

  // Chart data
  const chartData = result.decomp.map((d) => ({
    name: d.label, value: d.value, color: d.color,
  }));

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Scenario banner ────────────────────────────────────────── */}
      <div className="rounded-2xl px-5 py-4 border flex items-start gap-3"
        style={{ background: scenario.color + "0e", borderColor: scenario.color + "35" }}>
        <span className="text-2xl">{scenario.icon}</span>
        <div>
          <div className="font-bold text-slate-800 text-sm">
            {scenario.label}:{" "}
            <span style={{ color: scenario.color }}>
              {shockSize > 0 ? "+" : ""}{shockSize} {scenario.unit}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Johansen first-order CGE response. All values are % changes from baseline (Uzbekistan 2022 SAM).
          </p>
        </div>
      </div>

      {/* ── Insight box ────────────────────────────────────────────── */}
      <div className={`animate-slide-up ${insightClass}`}>
        <div className="flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">CGE Insight</div>
            <p className="leading-relaxed">{insightText}</p>
          </div>
        </div>
      </div>

      {/* ── KPI grid 4×2 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DEFS.map((k, i) => {
          const val = result[k.key as keyof CGEResult] as number;
          return (
            <div key={k.key} className="kpi-card animate-slide-up"
              style={{ "--kpi-accent": k.color, animationDelay: `${i * 0.06}s` } as React.CSSProperties}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{k.icon}</span>
                <span className="text-xs text-slate-500 font-medium leading-tight">{k.label}</span>
              </div>
              <div className="text-2xl font-black tabular-nums"
                style={{ color: isPos(val) ? k.color : "#ef4444" }}>
                {sign(val)}{val.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-400 mt-0.5">% change</div>
            </div>
          );
        })}
      </div>

      {/* ── Bar chart ──────────────────────────────────────────────── */}
      <div className="surface p-6 animate-slide-up delay-200">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Impact Decomposition (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 44, left: 10 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false}
              angle={-30} textAnchor="end" interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Tooltip content={<BarTooltip />} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}
              isAnimationActive animationDuration={600} animationEasing="ease-out">
              {chartData.map((entry, i) => (
                <Cell key={i}
                  fill={entry.value >= 0 ? entry.color : "#ef4444"}
                  fillOpacity={entry.value >= 0 ? 0.85 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sensitivity table ──────────────────────────────────────── */}
      <SensitivityTable result={result} shockType={shockType} shockSize={shockSize} />

      {/* ── Disclaimer ─────────────────────────────────────────────── */}
      <div className="insight-warning flex gap-2 items-start">
        <span className="text-base flex-shrink-0">⚠️</span>
        <span className="text-xs">
          Results are <strong>first-order (Johansen) approximations</strong> valid for shocks ≤10% from
          base. For large shocks or full welfare decomposition, run the non-linear Excel CGE model.
          Calibration: Uzbekistan 2022 SAM (GDP ≈ $80bn, X=M ≈ 27%, gold ≈ 20%).
        </span>
      </div>
    </div>
  );
}

/* ─── Custom bar tooltip ──────────────────────────────────────────── */
function BarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const color = (payload[0]?.payload as { color: string })?.color ?? "#0d9488";
  return (
    <div className="bg-white/95 rounded-xl border border-slate-200 px-3 py-2.5 shadow-xl text-xs">
      <div className="font-bold text-slate-500 mb-1">{label}</div>
      <div className="font-black text-sm tabular-nums" style={{ color: val >= 0 ? color : "#ef4444" }}>
        {val >= 0 ? "+" : ""}{val.toFixed(3)}%
      </div>
    </div>
  );
}

/* ─── Sensitivity table ───────────────────────────────────────────── */
function SensitivityTable({ result, shockType, shockSize }: Props) {
  if (shockSize === 0) return null;
  const scales = [0.5, 1, 2, 3];
  const unit = SCENARIOS.find((s) => s.id === shockType)?.unit ?? "";
  const rows = scales.map((s) => ({
    magnitude: shockSize * s,
    gdp:    +(result.gdp_real    * s).toFixed(2),
    cons:   +(result.consumption * s).toFixed(2),
    exp:    +(result.exports     * s).toFixed(2),
    imp:    +(result.imports     * s).toFixed(2),
    welf:   +(result.welfare     * s).toFixed(2),
  }));

  const sign = (v: number) => (v > 0 ? "+" : "");

  return (
    <div className="surface overflow-hidden animate-slide-up delay-300">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Sensitivity Analysis</h3>
        <p className="text-xs text-slate-400 mt-0.5">Linearly scaled — first-order approximation</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase tracking-wider">
                Shock ({unit})
              </th>
              {["Real GDP", "Consumption", "Exports", "Imports", "Welfare"].map((h) => (
                <th key={h} className="text-right px-3 py-3 text-slate-400 font-bold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-t border-slate-50 ${i === 1 ? "bg-teal-50/50" : "hover:bg-slate-50"}`}>
                <td className="px-4 py-2.5 font-bold text-slate-700">
                  {r.magnitude > 0 ? "+" : ""}{r.magnitude.toFixed(1)} {unit}
                  {i === 1 && <span className="ml-1.5 text-teal-600 text-xs font-semibold">← selected</span>}
                </td>
                {[r.gdp, r.cons, r.exp, r.imp, r.welf].map((v, j) => (
                  <td key={j} className={`px-3 py-2.5 text-right font-mono font-bold ${v >= 0 ? "text-teal-700" : "text-red-600"}`}>
                    {sign(v)}{v.toFixed(2)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Insight text generator ──────────────────────────────────────── */
function buildInsight(shockType: ShockType, shockSize: number, r: CGEResult): string {
  const s = shockSize > 0 ? "+" : "";
  switch (shockType) {
    case "tariff":
      return `A ${s}${shockSize}pp tariff change ${r.gdp_real > 0 ? "slightly boosts" : "reduces"} real GDP by ${Math.abs(r.gdp_real).toFixed(2)}%. Imports ${r.imports < 0 ? "fall" : "rise"} by ${Math.abs(r.imports).toFixed(2)}% — the exchange rate ${r.exchange_rate < 0 ? "appreciates (UZS strengthens)" : "depreciates"} to restore trade balance. Consumer welfare ${r.welfare < 0 ? "declines" : "improves"} by ${Math.abs(r.welfare).toFixed(2)}% due to ${r.price_level > 0 ? "higher import prices" : "lower prices"}.`;
    case "export_price":
      return `A ${s}${shockSize}% commodity price shock generates a real income windfall of ~${(r.gdp_real).toFixed(2)}% GDP. Export revenues surge, causing UZS to ${r.exchange_rate < 0 ? "appreciate" : "depreciate"} by ${Math.abs(r.exchange_rate).toFixed(2)}% (Dutch disease effect). Consumer welfare ${r.welfare >= 0 ? "improves" : "falls"} by ${Math.abs(r.welfare).toFixed(2)}% — ${r.price_level < 0 ? "cheaper imports offset spending gains" : "spending power increases"}.`;
    case "investment":
      return `A ${s}${shockSize}pp investment surge expands real GDP by ${r.gdp_real.toFixed(2)}% via the Keynesian multiplier (K=${(1/(1-0.58+0.27)).toFixed(2)}). Private consumption rises ${r.consumption.toFixed(2)}% as incomes grow. Import demand increases ${r.imports.toFixed(2)}% — the external balance ${r.trade_balance < 0 ? "worsens slightly" : "improves"}.`;
    case "government":
      return `A ${s}${shockSize}pp fiscal expansion raises GDP by ${r.gdp_real.toFixed(2)}%. The multiplier effect drives consumption ${r.consumption.toFixed(2)}% higher. Mild inflationary pressure (CPI: ${r.price_level > 0 ? "+" : ""}${r.price_level.toFixed(2)}%) may partially offset real welfare gains of ${r.welfare.toFixed(2)}%.`;
    case "devaluation":
      return `A ${s}${shockSize}% UZS devaluation boosts export competitiveness — export volumes rise ${r.exports.toFixed(2)}% while imports fall ${Math.abs(r.imports).toFixed(2)}%. However, import prices rise ${r.price_level.toFixed(2)}%, eroding real consumer purchasing power by ${Math.abs(r.welfare).toFixed(2)}%. Net GDP effect: ${r.gdp_real >= 0 ? "+" : ""}${r.gdp_real.toFixed(2)}%.`;
  }
}

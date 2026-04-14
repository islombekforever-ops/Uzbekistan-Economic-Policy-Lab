"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { CGEResult, ShockType } from "@/lib/cgeSolver";
import { SCENARIOS } from "./ScenarioPanel";

interface Props {
  result: CGEResult;
  shockType: ShockType;
  shockSize: number;
}

export function ResultsDisplay({ result, shockType, shockSize }: Props) {
  const scenario = SCENARIOS.find((s) => s.id === shockType)!;

  // KPI cards
  const kpis = [
    {
      label: "Real GDP",
      value: result.gdp_real,
      color: "#0d9488",
      icon: "📈",
      description: "Change in real output",
    },
    {
      label: "Private Consumption",
      value: result.consumption,
      color: "#3b82f6",
      icon: "🛒",
      description: "Change in real household spending",
    },
    {
      label: "Export Volume",
      value: result.exports,
      color: "#f59e0b",
      icon: "🚢",
      description: "Change in export quantities",
    },
    {
      label: "Import Volume",
      value: result.imports,
      color: "#ef4444",
      icon: "📥",
      description: "Change in import quantities",
    },
    {
      label: "CPI Inflation",
      value: result.price_level,
      color: "#8b5cf6",
      icon: "💰",
      description: "Change in consumer price level",
    },
    {
      label: "Exchange Rate",
      value: result.exchange_rate,
      color: "#ec4899",
      icon: "💱",
      description: "+ = depreciation (UZS/USD)",
    },
    {
      label: "Consumer Welfare",
      value: result.welfare,
      color: "#06b6d4",
      icon: "😊",
      description: "Real welfare change (income − CPI)",
    },
    {
      label: "Trade Balance",
      value: result.trade_balance,
      color: "#64748b",
      icon: "⚖️",
      description: "Change in NX (% of GDP)",
    },
  ];

  // Chart data
  const chartData = result.decomp.map((d) => ({
    name: d.label,
    value: d.value,
    color: d.value >= 0 ? d.color : "#94a3b8",
    colorFull: d.color,
  }));

  const sign = (v: number) => (v > 0 ? "+" : "");
  const isPos = (v: number) => v >= 0;

  return (
    <div className="space-y-5">
      {/* Scenario summary banner */}
      <div
        className="rounded-xl px-5 py-4 border flex items-start gap-3"
        style={{ background: scenario.color + "10", borderColor: scenario.color + "40" }}
      >
        <span className="text-2xl">{scenario.icon}</span>
        <div>
          <div className="font-bold text-slate-800 text-sm">
            {scenario.label}:{" "}
            <span style={{ color: scenario.color }}>
              {shockSize > 0 ? "+" : ""}{shockSize} {
                SCENARIOS.find((s) => s.id === shockType)?.unit
              }
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-2xl">
            Johansen first-order CGE response. All values are percentage changes from
            the baseline equilibrium (Uzbekistan 2022 SAM).
          </p>
        </div>
      </div>

      {/* KPI cards — 4 per row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.slice(0, 8).map((k) => (
          <div key={k.label}
               className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{k.icon}</span>
              <span className="text-xs text-slate-500 font-medium">{k.label}</span>
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: isPos(k.value) ? k.color : "#ef4444" }}
            >
              {sign(k.value)}{k.value.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">{k.description}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Impact Decomposition (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 40, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Tooltip
              formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(3)}%`, "Change"]}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? entry.colorFull : "#ef444480"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sensitivity table */}
      <SensitivityTable result={result} shockType={shockType} shockSize={shockSize} />

      {/* Model note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex gap-2">
        <span className="text-base">⚠️</span>
        <span>
          Results are <strong>first-order (linearised) approximations</strong> from the Johansen
          CGE system. Suitable for small shocks (≤10% from base). For large shocks or
          welfare analysis, run the full non-linear Excel CGE model. Parameters are calibrated
          to the Uzbekistan 2022 SAM (GDP≈$80b, X=M≈27% of GDP, gold≈20%).
        </span>
      </div>
    </div>
  );
}

function SensitivityTable({
  result, shockType, shockSize,
}: {
  result: CGEResult;
  shockType: ShockType;
  shockSize: number;
}) {
  if (shockSize === 0) return null;

  // Scale results to different magnitudes for sensitivity
  const scales = [0.5, 1, 2, 3];
  const rows = scales.map((s) => ({
    magnitude: shockSize * s,
    gdp:       parseFloat((result.gdp_real * s).toFixed(2)),
    cons:      parseFloat((result.consumption * s).toFixed(2)),
    exports:   parseFloat((result.exports * s).toFixed(2)),
    imports:   parseFloat((result.imports * s).toFixed(2)),
    welfare:   parseFloat((result.welfare * s).toFixed(2)),
  }));

  const unit = SCENARIOS.find((s) => s.id === shockType)?.unit ?? "";
  const sign = (v: number) => (v > 0 ? "+" : "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Sensitivity Analysis</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Linearly scaled impact at different shock magnitudes
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">
                Shock ({unit})
              </th>
              <th className="text-right px-3 py-2.5 text-slate-500 font-semibold">Real GDP</th>
              <th className="text-right px-3 py-2.5 text-slate-500 font-semibold">Consumption</th>
              <th className="text-right px-3 py-2.5 text-slate-500 font-semibold">Exports</th>
              <th className="text-right px-3 py-2.5 text-slate-500 font-semibold">Imports</th>
              <th className="text-right px-3 py-2.5 text-slate-500 font-semibold">Welfare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-slate-50 ${i === 1 ? "bg-teal-50/60" : "hover:bg-slate-50"}`}
              >
                <td className="px-4 py-2.5 font-bold text-slate-700">
                  {r.magnitude > 0 ? "+" : ""}{r.magnitude.toFixed(1)} {unit}
                  {i === 1 && (
                    <span className="ml-1.5 text-teal-600 text-xs font-semibold">(selected)</span>
                  )}
                </td>
                <Td v={r.gdp}      sign={sign} />
                <Td v={r.cons}     sign={sign} />
                <Td v={r.exports}  sign={sign} />
                <Td v={r.imports}  sign={sign} />
                <Td v={r.welfare}  sign={sign} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ v, sign }: { v: number; sign: (n: number) => string }) {
  const pos = v >= 0;
  return (
    <td className={`px-3 py-2.5 text-right font-mono font-bold ${pos ? "text-teal-700" : "text-red-600"}`}>
      {sign(v)}{v.toFixed(2)}%
    </td>
  );
}

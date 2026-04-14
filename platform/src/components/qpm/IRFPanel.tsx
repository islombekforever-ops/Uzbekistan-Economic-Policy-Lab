"use client";
import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { IRFResult, ShockType, QPMParams, solveIRF } from "@/lib/qpmSolver";

const SHOCKS: { id: ShockType; label: string; desc: string; color: string; icon: string }[] = [
  { id: "demand",    label: "Aggregate Demand",    desc: "+1 pp positive demand shock (e.g. fiscal stimulus)", color: "#3b82f6", icon: "📈" },
  { id: "inflation", label: "Cost-Push Inflation", desc: "+1 pp supply-side inflation shock (e.g. commodity price spike)", color: "#ef4444", icon: "🔥" },
  { id: "exchange",  label: "FX Depreciation",     desc: "+1 pp UZS depreciation shock (e.g. capital outflow)", color: "#f59e0b", icon: "💱" },
  { id: "monetary",  label: "Monetary Tightening", desc: "+1 pp unexpected policy rate hike", color: "#0d9488", icon: "🏦" },
];

const CHART_VARS = [
  { key: "pi4",     label: "YoY Inflation",         unit: "pp",  color: "#ef4444" },
  { key: "gap",     label: "Output Gap",             unit: "pp",  color: "#3b82f6" },
  { key: "rs",      label: "Policy Rate (RS)",       unit: "pp",  color: "#0d1f3c" },
  { key: "d4l_s",   label: "NER Depreciation (YoY)", unit: "pp",  color: "#f59e0b" },
  { key: "l_z_gap", label: "Real Exchange Rate Gap", unit: "pp",  color: "#10b981" },
  { key: "mci",     label: "Monetary Conditions",    unit: "pp",  color: "#8b5cf6" },
];

interface Props {
  shockType:  ShockType;
  shockSize:  number;
  horizon:    number;
  params:     QPMParams;
  onShock:    (s: ShockType) => void;
  onSize:     (v: number) => void;
  onHorizon:  (h: number) => void;
}

export function IRFPanel({ shockType, shockSize, horizon, params, onShock, onSize, onHorizon }: Props) {
  const irf: IRFResult = useMemo(
    () => solveIRF(shockType, shockSize, horizon, params),
    [shockType, shockSize, horizon, params]
  );

  // Chart data
  const chartData = irf.quarters.map((q, i) => ({
    q: `Q${q}`,
    pi4:     irf.pi4[i]     ?? 0,
    gap:     irf.gap[i]     ?? 0,
    rs:      irf.rs[i]      ?? 0,
    d4l_s:   irf.d4l_s[i]   ?? 0,
    l_z_gap: irf.l_z_gap[i] ?? 0,
    mci:     irf.mci[i]     ?? 0,
  }));

  // KPI: peak absolute deviation (with sign)
  const peak = (arr: number[]) => arr.reduce((m, v) => Math.abs(v) > Math.abs(m) ? v : m, 0);
  const kpis = [
    { label: "Peak Inflation",    value: peak(irf.pi4),   unit: "pp", color: "#ef4444" },
    { label: "Peak Output Gap",   value: peak(irf.gap),   unit: "pp", color: "#3b82f6" },
    { label: "Peak Policy Rate",  value: peak(irf.rs),    unit: "pp", color: "#0d1f3c" },
    { label: "Peak NER Deprec.",  value: peak(irf.d4l_s), unit: "pp", color: "#f59e0b" },
  ];

  const activeShock = SHOCKS.find(s => s.id === shockType)!;

  return (
    <div className="space-y-5">
      {/* Shock type selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Select Shock Type
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {SHOCKS.map((s) => (
            <button
              key={s.id}
              onClick={() => onShock(s.id)}
              className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                shockType === s.id
                  ? "border-current shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              style={shockType === s.id
                ? { borderColor: s.color, background: s.color + "10" }
                : {}}
            >
              <span className="text-lg mb-1">{s.icon}</span>
              <span
                className="text-xs font-bold leading-tight"
                style={{ color: shockType === s.id ? s.color : "#475569" }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 italic">{activeShock.desc}</p>
      </div>

      {/* Size + Horizon controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">Shock Size</span>
            <span className="text-lg font-black" style={{ color: activeShock.color }}>
              {shockSize.toFixed(2)} pp
            </span>
          </div>
          <input
            type="range" min={0.25} max={5} step={0.25}
            value={shockSize}
            onChange={(e) => onSize(+e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: activeShock.color }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0.25 pp</span><span>5 pp</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600">Forecast Horizon</span>
            <span className="text-lg font-black text-slate-800">{horizon}Q ({Math.round(horizon / 4)}Y)</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[8, 12, 16, 20].map((h) => (
              <button
                key={h}
                onClick={() => onHorizon(h)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  horizon === h
                    ? "text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={horizon === h ? { background: activeShock.color } : {}}
              >
                {h}Q
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {k.value >= 0 ? "+" : ""}{k.value.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">{k.unit} deviation</div>
          </div>
        ))}
      </div>

      {/* Solver status */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span
          className={`inline-block w-2 h-2 rounded-full ${irf.converged ? "bg-teal-500" : "bg-amber-500"}`}
        />
        {irf.converged ? `Converged in ${irf.iters} iterations` : `Max iterations reached (${irf.iters})`}
        <span>· Gauss-Seidel · tol = 1e-10</span>
      </div>

      {/* 6 IRF charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CHART_VARS.map((v) => (
          <IRFChart
            key={v.key}
            data={chartData}
            varKey={v.key}
            label={v.label}
            unit={v.unit}
            color={v.color}
            shockColor={activeShock.color}
          />
        ))}
      </div>
    </div>
  );
}

function IRFChart({
  data, varKey, label, unit, color, shockColor,
}: {
  data: Record<string, number | string>[];
  varKey: string;
  label: string;
  unit: string;
  color: string;
  shockColor: string;
}) {
  const vals = data.map((d) => d[varKey] as number);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + "15", color }}>
          {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="q"
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toFixed(2)}
            domain={[-maxAbs * 1.2, maxAbs * 1.2]}
          />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(4)} ${unit}`, label]}
            labelFormatter={(l) => `Horizon: ${l}`}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey={varKey}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, TooltipProps,
} from "recharts";
import { solveBaseline, QPMParams, BaselineInit } from "@/lib/qpmSolver";

const CHARTS = [
  { key: "pi",  label: "YoY Inflation",       unit: "%", color: "#ef4444", refKey: "tar",  icon: "🌡️" },
  { key: "rs",  label: "Policy Rate",          unit: "%", color: "#0d1f3c", refKey: null,   icon: "🏦" },
  { key: "gap", label: "Output Gap",           unit: "%", color: "#3b82f6", refKey: "zero", icon: "📊" },
  { key: "dep", label: "NER Depreciation",     unit: "%", color: "#f59e0b", refKey: null,   icon: "💱" },
];

/* ── Preset scenarios ─────────────────────────────────────────────── */
const SCENARIOS = [
  {
    label: "Current 2025", icon: "📍", color: "#0d9488",
    init: { pi0: 11.0, rs0: 13.5, gap0: -1.5, dep0: 8.0 },
  },
  {
    label: "Tight Policy", icon: "🦅", color: "#ef4444",
    init: { pi0: 14.0, rs0: 16.0, gap0: -3.0, dep0: 12.0 },
  },
  {
    label: "Easing Cycle", icon: "🕊️", color: "#3b82f6",
    init: { pi0: 8.5, rs0: 11.0, gap0: 0.5, dep0: 5.0 },
  },
  {
    label: "Boom", icon: "🚀", color: "#f59e0b",
    init: { pi0: 9.0, rs0: 12.0, gap0: 2.5, dep0: 6.0 },
  },
];

export function BaselinePanel({ params }: { params: QPMParams }) {
  const [init, setInit] = useState<BaselineInit>({
    pi0: 11.0, rs0: 13.5, gap0: -1.5, dep0: 8.0,
  });
  const [activeScenario, setActiveScenario] = useState(0);

  const result = useMemo(() => solveBaseline(init, params, 16), [init, params]);

  const chartData = result.quarters.map((_, i) => ({
    q: `Q${i + 1}`,
    pi:  result.pi[i],
    rs:  result.rs[i],
    gap: result.gap[i],
    dep: result.dep[i],
  }));

  const avg = (arr: number[], from: number, to: number) =>
    arr.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);

  const kpis = [
    { label: "Avg Inflation (Yr 2)", value: avg(result.pi, 4, 8).toFixed(1) + "%",  color: "#ef4444", icon: "🌡️" },
    { label: "Policy Rate (Q8)",     value: (result.rs[7]  ?? 0).toFixed(1) + "%",  color: "#0d1f3c", icon: "🏦" },
    { label: "Output Gap (Q8)",      value: (result.gap[7] ?? 0).toFixed(2) + "%",  color: "#3b82f6", icon: "📊" },
    { label: "NER Deprec. (Q8)",     value: (result.dep[7] ?? 0).toFixed(1) + "%",  color: "#f59e0b", icon: "💱" },
  ];

  const applyScenario = (i: number) => {
    setActiveScenario(i);
    setInit(SCENARIOS[i].init);
  };

  // Insight: is inflation converging?
  const piEnd = result.pi[result.pi.length - 1] ?? init.pi0;
  const converging = piEnd < init.pi0;
  const insightClass = converging ? "insight-positive" : "insight-warning";
  const insightText = converging
    ? `Inflation converges from ${init.pi0.toFixed(1)}% → ${piEnd.toFixed(1)}% over 16 quarters, approaching the ${params.tar}% target. The CBU rate path shows ${result.rs[0] > result.rs[result.rs.length - 1] ? "easing" : "tightening"} over the horizon.`
    : `With current initial conditions, inflation may not converge to target (${params.tar}%). Consider tightening the policy rate or adjusting parameters to achieve disinflation.`;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Scenario presets ─────────────────────────────────────── */}
      <div className="control-panel">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Preset Scenarios
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SCENARIOS.map((s, i) => (
            <button key={s.label} onClick={() => applyScenario(i)}
              className="shock-btn"
              style={activeScenario === i
                ? { borderColor: s.color, background: s.color + "12" }
                : { borderColor: "#e2e8f0", background: "#fafafa" }
              }
            >
              <span className="text-xl mb-1">{s.icon}</span>
              <span className="text-xs font-bold leading-tight block"
                style={{ color: activeScenario === i ? s.color : "#475569" }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Initial conditions ───────────────────────────────────── */}
      <div className="control-panel">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Initial Conditions — Uzbekistan Economy
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumInput label="YoY Inflation π₀" value={init.pi0}
            onChange={(v) => setInit({ ...init, pi0: v })}
            min={0} max={30} step={0.5} color="#ef4444" hint="CPI YoY %" />
          <PremiumInput label="Policy Rate RS₀" value={init.rs0}
            onChange={(v) => setInit({ ...init, rs0: v })}
            min={0} max={30} step={0.5} color="#0d1f3c" hint="CBU repo rate %" />
          <PremiumInput label="Output Gap" value={init.gap0}
            onChange={(v) => setInit({ ...init, gap0: v })}
            min={-10} max={10} step={0.5} color="#3b82f6" hint="negative = below potential" />
          <PremiumInput label="NER Depreciation" value={init.dep0}
            onChange={(v) => setInit({ ...init, dep0: v })}
            min={0} max={40} step={1} color="#f59e0b" hint="UZS/USD YoY %" />
        </div>
      </div>

      {/* ── Insight ──────────────────────────────────────────────── */}
      <div className={`animate-slide-up ${insightClass}`}>
        <div className="flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Projection Insight</div>
            <p className="leading-relaxed">{insightText}</p>
          </div>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="kpi-card animate-slide-up"
            style={{ "--kpi-accent": k.color, animationDelay: `${i * 0.07}s` } as React.CSSProperties}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{k.icon}</span>
              <span className="text-xs text-slate-500 font-medium leading-tight">{k.label}</span>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Target info ──────────────────────────────────────────── */}
      <div className="insight-neutral flex gap-2 items-start">
        <span className="text-base">ℹ️</span>
        <span className="text-sm">
          Dashed lines show steady-state targets:
          inflation target <strong>π* = {params.tar.toFixed(1)}%</strong>,
          neutral real rate <strong>r̄ = {params.rrbar.toFixed(1)}%</strong>.
          Adjust initial conditions or use Parameters panel to explore alternative paths.
        </span>
      </div>

      {/* ── 4 charts 2×2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHARTS.map((c, i) => {
          const refVal = c.refKey === "tar" ? params.tar : c.refKey === "zero" ? 0 : null;
          return (
            <BaselineChart key={c.key} data={chartData}
              varKey={c.key} label={c.label} unit={c.unit}
              color={c.color} icon={c.icon}
              refVal={refVal} animDelay={i * 0.08}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Gradient area chart ─────────────────────────────────────────── */
function BaselineChart({ data, varKey, label, unit, color, icon, refVal, animDelay }: {
  data: Record<string, number | string>[];
  varKey: string; label: string; unit: string; color: string; icon: string;
  refVal: number | null; animDelay: number;
}) {
  const gradId = `bl-grad-${varKey}`;
  return (
    <div className="surface p-5 animate-slide-up" style={{ animationDelay: `${animDelay}s` }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">{icon}</span>
        <h4 className="text-sm font-bold text-slate-700">{label}</h4>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 15, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="q"
            tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}%`} width={40}
          />
          <Tooltip content={<BaselineTooltip label={label} unit={unit} color={color} />} />
          {refVal !== null && (
            <ReferenceLine y={refVal} stroke={color} strokeDasharray="6 4" strokeOpacity={0.55}
              label={{ value: `Target: ${refVal}%`, fill: color, fontSize: 10, position: "insideTopRight" }}
            />
          )}
          <Area type="monotone" dataKey={varKey}
            stroke={color} strokeWidth={2.5}
            fill={`url(#${gradId})`} dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            isAnimationActive animationDuration={500} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function BaselineTooltip({ active, payload, label: xLabel, label: _l, unit, color }: TooltipProps<number, string> & { label: string; unit: string; color: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-white/95 rounded-xl border border-slate-200 px-3 py-2.5 shadow-xl text-xs">
      <div className="font-bold text-slate-400 mb-1">{xLabel}</div>
      <div className="font-black text-sm tabular-nums" style={{ color }}>
        {val.toFixed(2)}{unit}
      </div>
    </div>
  );
}

/* ─── Premium Input Field ─────────────────────────────────────────── */
function PremiumInput({ label, value, onChange, min, max, step, color, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; color: string; hint: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-sm font-black tabular-nums px-2 py-0.5 rounded-lg"
          style={{ color, background: color + "14" }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold
                   focus:outline-none focus:ring-2 focus:border-current mb-2"
        style={{ color }}
      />
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="premium-slider"
        style={{ "--sl-color": color, "--sl-progress": `${pct}%` } as React.CSSProperties}
      />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

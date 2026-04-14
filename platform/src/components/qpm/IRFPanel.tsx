"use client";
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, TooltipProps,
} from "recharts";
import { IRFResult, ShockType, QPMParams, solveIRF } from "@/lib/qpmSolver";

/* ─── Shock definitions ────────────────────────────────────────── */
const SHOCKS: {
  id: ShockType; label: string; sub: string;
  color: string; bg: string; icon: string;
  insight: (sz: number, irf: IRFResult) => string;
}[] = [
  {
    id: "demand", label: "Demand Shock", sub: "Fiscal stimulus / boom",
    color: "#3b82f6", bg: "#eff6ff", icon: "📈",
    insight: (sz, r) => {
      const pk = peakVal(r.pi4), gk = peakVal(r.gap), rk = peakVal(r.rs);
      return `A +${sz}pp demand shock opens a +${Math.abs(gk).toFixed(2)}pp output gap, pushing inflation ${Math.abs(pk).toFixed(2)}pp above target. The CBU reacts with a ${Math.abs(rk).toFixed(2)}pp rate hike. Disinflation takes effect over ~${Math.round(r.quarters.length * 0.6)} quarters as monetary transmission bites.`;
    },
  },
  {
    id: "inflation", label: "Cost-Push Shock", sub: "Supply / commodity prices",
    color: "#ef4444", bg: "#fff1f2", icon: "🔥",
    insight: (sz, r) => {
      const pk = peakVal(r.pi4), gk = peakVal(r.gap), rk = peakVal(r.rs);
      return `A +${sz}pp supply shock drives inflation ${Math.abs(pk).toFixed(2)}pp above target. The CBU tightens by ${Math.abs(rk).toFixed(2)}pp, creating a ${Math.abs(gk).toFixed(2)}pp output gap. Classic stagflation trade-off: the model shows inflation overshooting before stabilising.`;
    },
  },
  {
    id: "exchange", label: "FX Depreciation", sub: "Capital outflow / UZS pressure",
    color: "#f59e0b", bg: "#fffbeb", icon: "💱",
    insight: (sz, r) => {
      const pk = peakVal(r.pi4), zk = Math.max(...r.l_z_gap.map(Math.abs));
      return `A +${sz}pp UZS depreciation passes through to imported inflation (+${Math.abs(pk).toFixed(2)}pp peak). The real exchange rate gap widens to ${zk.toFixed(2)}pp. Monetary tightening gradually closes the gap — the degree depends on the UIP backward-looking weight (e₁).`;
    },
  },
  {
    id: "monetary", label: "Rate Hike", sub: "CBU tightening surprise",
    color: "#0d9488", bg: "#f0fdf4", icon: "🏦",
    insight: (sz, r) => {
      const pk = peakVal(r.pi4), gk = peakVal(r.gap);
      return `An unexpected +${sz}pp rate hike compresses the output gap by ${Math.abs(gk).toFixed(2)}pp and cools inflation ${Math.abs(pk).toFixed(2)}pp below target. The exchange rate appreciates on impact (UIP). Convergence takes ~${Math.round(r.quarters.length * 0.55)} quarters.`;
    },
  },
];

const CHART_VARS = [
  { key: "pi4",     label: "YoY Inflation",          color: "#ef4444", unit: "pp" },
  { key: "gap",     label: "Output Gap",              color: "#3b82f6", unit: "pp" },
  { key: "rs",      label: "Policy Rate",             color: "#0d1f3c", unit: "pp" },
  { key: "d4l_s",   label: "NER Depreciation (YoY)", color: "#f59e0b", unit: "pp" },
  { key: "l_z_gap", label: "Real Exchange Rate Gap",  color: "#10b981", unit: "pp" },
  { key: "mci",     label: "Monetary Conditions",     color: "#8b5cf6", unit: "pp" },
];

const SHOCK_PRESETS = [
  { label: "Mild",     value: 0.5, color: "#10b981" },
  { label: "Standard", value: 1.0, color: "#3b82f6" },
  { label: "Strong",   value: 2.5, color: "#f59e0b" },
  { label: "Severe",   value: 5.0, color: "#ef4444" },
];

const HORIZON_OPTIONS = [8, 12, 16, 20];

const peakVal = (arr: number[]) =>
  arr.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);

interface Props {
  shockType: ShockType; shockSize: number; horizon: number;
  params: QPMParams;
  onShock: (s: ShockType) => void;
  onSize:  (v: number) => void;
  onHorizon: (h: number) => void;
}

/* ══════════════════════════════════════════════════════════════════ */
export function IRFPanel({ shockType, shockSize, horizon, params, onShock, onSize, onHorizon }: Props) {
  const irf: IRFResult = useMemo(
    () => solveIRF(shockType, shockSize, horizon, params),
    [shockType, shockSize, horizon, params],
  );

  const chartData = irf.quarters.map((_, i) => ({
    q:       `Q${i + 1}`,
    pi4:     irf.pi4[i]     ?? 0,
    gap:     irf.gap[i]     ?? 0,
    rs:      irf.rs[i]      ?? 0,
    d4l_s:   irf.d4l_s[i]   ?? 0,
    l_z_gap: irf.l_z_gap[i] ?? 0,
    mci:     irf.mci[i]     ?? 0,
  }));

  const active = SHOCKS.find((s) => s.id === shockType)!;
  const pkInflation = peakVal(irf.pi4);
  const insightClass =
    pkInflation > 0.4 ? "insight-negative" :
    pkInflation < -0.4 ? "insight-positive" : "insight-neutral";

  const kpis = [
    { label: "Peak Inflation",   value: peakVal(irf.pi4),   color: "#ef4444", icon: "🌡️" },
    { label: "Peak Output Gap",  value: peakVal(irf.gap),   color: "#3b82f6", icon: "📊" },
    { label: "Peak Policy Rate", value: peakVal(irf.rs),    color: "#0d1f3c", icon: "🏦" },
    { label: "Peak NER Depr.",   value: peakVal(irf.d4l_s), color: "#f59e0b", icon: "💱" },
  ];

  const sliderPct = ((shockSize - 0.25) / (5 - 0.25)) * 100;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Shock selector ────────────────────────────────────────── */}
      <div className="control-panel">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Policy Shock
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SHOCKS.map((s) => (
            <button
              key={s.id}
              onClick={() => onShock(s.id)}
              className={`shock-btn ${shockType === s.id ? "active" : ""}`}
              style={
                shockType === s.id
                  ? { borderColor: s.color, background: s.bg }
                  : { borderColor: "#e2e8f0", background: "#fafafa" }
              }
            >
              <span className="text-xl mb-1.5">{s.icon}</span>
              <span className="text-xs font-bold leading-tight block"
                style={{ color: shockType === s.id ? s.color : "#475569" }}>
                {s.label}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 leading-tight">{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Size + Horizon ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="control-panel">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Shock Size
            </span>
            <span
              className="text-xl font-black tabular-nums px-3 py-1 rounded-xl"
              style={{ color: active.color, background: active.bg }}
            >
              +{shockSize.toFixed(2)}<span className="text-sm font-medium ml-1">pp</span>
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {SHOCK_PRESETS.map((p) => (
              <button key={p.label} onClick={() => onSize(p.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150"
                style={shockSize === p.value
                  ? { background: p.color, color: "#fff", borderColor: "transparent", boxShadow: `0 2px 8px ${p.color}55` }
                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <input type="range" min={0.25} max={5} step={0.25} value={shockSize}
            onChange={(e) => onSize(+e.target.value)}
            className="premium-slider"
            style={{ "--sl-color": active.color, "--sl-progress": `${sliderPct}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>0.25 pp</span><span>5 pp</span>
          </div>
        </div>

        <div className="control-panel">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Horizon
            </span>
            <span className="text-xl font-black text-slate-800">
              {horizon}Q
              <span className="text-sm font-medium text-slate-400 ml-1">/ {Math.round(horizon / 4)}Y</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {HORIZON_OPTIONS.map((h) => (
              <button key={h} onClick={() => onHorizon(h)}
                className="py-2.5 text-xs font-bold rounded-xl border-2 transition-all duration-150"
                style={horizon === h
                  ? { background: active.color, color: "#fff", borderColor: "transparent", boxShadow: `0 2px 8px ${active.color}44` }
                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                }
              >
                {h}Q
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${irf.converged ? "bg-emerald-400" : "bg-amber-400"}`} />
            {irf.converged ? `Converged · ${irf.iters} iters` : `Max iters (${irf.iters})`}
            <span className="text-slate-300">· Gauss-Seidel</span>
          </div>
        </div>
      </div>

      {/* ── Insight box ───────────────────────────────────────────── */}
      <div className={`animate-slide-up ${insightClass}`}>
        <div className="flex gap-3 items-start">
          <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">
              Model Insight
            </div>
            <p className="leading-relaxed">{active.insight(shockSize, irf)}</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="kpi-card animate-slide-up"
            style={{ "--kpi-accent": k.color, animationDelay: `${i * 0.07}s` } as React.CSSProperties}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{k.icon}</span>
              <span className="text-xs text-slate-500 font-medium leading-tight">{k.label}</span>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: k.color }}>
              {k.value >= 0 ? "+" : ""}{k.value.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">pp deviation</div>
          </div>
        ))}
      </div>

      {/* ── 6 IRF charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CHART_VARS.map((v, i) => (
          <IRFChart key={v.key} data={chartData}
            varKey={v.key} label={v.label} unit={v.unit}
            color={v.color} animDelay={i * 0.06}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Gradient area chart ─────────────────────────────────────────── */
function IRFChart({ data, varKey, label, unit, color, animDelay }: {
  data: Record<string, number | string>[];
  varKey: string; label: string; unit: string; color: string; animDelay: number;
}) {
  const vals = data.map((d) => d[varKey] as number);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const dom = maxAbs * 1.4;
  const gradId = `irf-grad-${varKey}`;

  return (
    <div className="surface p-4 animate-slide-up" style={{ animationDelay: `${animDelay}s` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + "18", color }}>
          {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="q"
            tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false}
            interval={Math.max(Math.floor(data.length / 5) - 1, 1)}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => (v >= 0 ? "+" : "") + v.toFixed(1)}
            domain={[-dom, dom]} width={38}
          />
          <Tooltip content={<IRFTooltip label={label} unit={unit} color={color} />} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />
          <Area type="monotone" dataKey={varKey}
            stroke={color} strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            isAnimationActive animationDuration={500} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Custom tooltip ──────────────────────────────────────────────── */
function IRFTooltip({
  active, payload, label: xLabel, label: _l, unit, color,
}: TooltipProps<number, string> & { label: string; unit: string; color: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-slate-200 px-3 py-2.5 shadow-xl text-xs">
      <div className="font-bold text-slate-400 mb-1">Horizon: {xLabel}</div>
      <div className="font-black text-sm tabular-nums" style={{ color }}>
        {val >= 0 ? "+" : ""}{val.toFixed(4)} {unit}
      </div>
    </div>
  );
}

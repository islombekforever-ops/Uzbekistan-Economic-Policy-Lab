"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { QPMParams, DEFAULT_PARAMS } from "@/lib/qpmSolver";

interface Props {
  params: QPMParams;
  onChange: (p: QPMParams) => void;
}

interface SliderDef {
  key: keyof QPMParams;
  label: string;
  min: number; max: number; step: number;
  desc: string;
}

const SECTIONS: { title: string; color: string; icon: string; sliders: SliderDef[] }[] = [
  {
    title: "IS Curve", icon: "📊", color: "#3b82f6",
    sliders: [
      { key: "b1", label: "b₁ — Gap persistence",        min: 0, max: 0.99, step: 0.01, desc: "How much of last quarter's output gap carries forward" },
      { key: "b2", label: "b₂ — MCI elasticity",         min: 0, max: 0.8,  step: 0.01, desc: "Sensitivity of output to monetary conditions index" },
      { key: "b3", label: "b₃ — External demand",        min: 0, max: 0.8,  step: 0.01, desc: "Weight of foreign output gap in domestic demand" },
      { key: "b4", label: "b₄ — Interest rate in MCI",   min: 0, max: 1,    step: 0.01, desc: "Share of real interest rate vs real exchange rate in MCI" },
    ],
  },
  {
    title: "Phillips Curve", icon: "🌡️", color: "#ef4444",
    sliders: [
      { key: "a1", label: "a₁ — Inflation persistence",  min: 0, max: 0.99, step: 0.01, desc: "Backward-looking weight; high = de-anchored expectations" },
      { key: "a2", label: "a₂ — Cost pass-through",      min: 0, max: 0.8,  step: 0.01, desc: "How much marginal cost feeds into inflation" },
      { key: "a3", label: "a₃ — Domestic cost share",    min: 0, max: 1,    step: 0.01, desc: "Output gap vs import costs in real marginal cost" },
    ],
  },
  {
    title: "Taylor Rule", icon: "🏦", color: "#0d9488",
    sliders: [
      { key: "g1", label: "g₁ — Rate smoothing",         min: 0, max: 0.99, step: 0.01, desc: "Interest rate inertia — prevents excessive volatility" },
      { key: "g2", label: "g₂ — Inflation response",     min: 1, max: 3,    step: 0.05, desc: "Must be >1 (Taylor principle) for determinacy" },
      { key: "g3", label: "g₃ — Output gap response",    min: 0, max: 1.5,  step: 0.05, desc: "How aggressively the CBU reacts to output deviations" },
    ],
  },
  {
    title: "Exchange Rate (UIP)", icon: "💱", color: "#f59e0b",
    sliders: [
      { key: "e1", label: "e₁ — Backward-looking weight", min: 0, max: 0.99, step: 0.01, desc: "Exchange rate inertia vs UIP arbitrage — high = sticky FX" },
    ],
  },
  {
    title: "Steady-State", icon: "⚖️", color: "#8b5cf6",
    sliders: [
      { key: "tar",    label: "π* — Inflation target",    min: 2, max: 10, step: 0.5, desc: "CBU medium-term CPI target" },
      { key: "rrbar",  label: "r̄ — Neutral real rate",   min: 0, max: 8,  step: 0.5, desc: "Long-run real rate at which economy is at potential" },
      { key: "gdpbar", label: "ȳ — Potential growth",    min: 2, max: 10, step: 0.5, desc: "Structural GDP growth trend (Balassa-Samuelson adjusted)" },
    ],
  },
];

/* ─── Policy presets ────────────────────────────────────────────── */
const PRESETS: { label: string; icon: string; color: string; desc: string; params: Partial<QPMParams> }[] = [
  {
    label: "CBU Baseline", icon: "📊", color: "#0d9488",
    desc: "Default CEER calibration",
    params: {},  // = DEFAULT_PARAMS
  },
  {
    label: "Dovish CBU", icon: "🕊️", color: "#3b82f6",
    desc: "Weaker inflation response, more smoothing",
    params: { g1: 0.87, g2: 1.3, g3: 0.1 },
  },
  {
    label: "Hawkish CBU", icon: "🦅", color: "#ef4444",
    desc: "Aggressive tightening, less smoothing",
    params: { g1: 0.70, g2: 2.1, g3: 0.55 },
  },
  {
    label: "High Pass-Through", icon: "🔗", color: "#f59e0b",
    desc: "Strong FX & inflation pass-through",
    params: { a1: 0.45, a2: 0.30, e1: 0.5 },
  },
];

/* ══════════════════════════════════════════════════════════════════ */
export function ParameterSidebar({ params, onChange }: Props) {
  const anyChanged = (Object.keys(DEFAULT_PARAMS) as (keyof QPMParams)[]).some(
    (k) => Math.abs((params[k] as number) - (DEFAULT_PARAMS[k] as number)) > 0.001,
  );

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({ ...DEFAULT_PARAMS, ...preset.params });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">Model Parameters</span>
        {anyChanged && (
          <button onClick={() => onChange({ ...DEFAULT_PARAMS })}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                       bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-semibold">
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      {/* Preset buttons */}
      <div className="space-y-1.5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          Quick Presets
        </div>
        {PRESETS.map((pr) => {
          const isActive = !anyChanged && pr.label === "CBU Baseline"
            || (anyChanged && Object.entries(pr.params).every(
                ([k, v]) => Math.abs((params[k as keyof QPMParams] as number) - (v as number)) < 0.001
              ));
          return (
            <button key={pr.label} onClick={() => applyPreset(pr)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left
                         transition-all duration-150"
              style={isActive
                ? { background: pr.color + "14", borderColor: pr.color + "60", color: pr.color }
                : { background: "#fafafa", borderColor: "#e2e8f0", color: "#475569" }
              }
            >
              <span className="text-base">{pr.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{pr.label}</div>
                <div className="text-xs text-slate-400 truncate">{pr.desc}</div>
              </div>
              {isActive && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: pr.color }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Parameter sections */}
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <Section key={s.title} s={s} params={params} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

/* ─── Collapsible section ─────────────────────────────────────────── */
function Section({
  s, params, onChange,
}: {
  s: typeof SECTIONS[0];
  params: QPMParams;
  onChange: (p: QPMParams) => void;
}) {
  const [open, setOpen] = useState(true);
  const changed = s.sliders.some(
    (sl) => Math.abs((params[sl.key] as number) - (DEFAULT_PARAMS[sl.key] as number)) > 0.001,
  );

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden"
         style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm">{s.icon}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{s.title}</span>
          {changed && <span className="text-xs font-bold text-amber-500">★</span>}
        </span>
        {open
          ? <ChevronDown size={13} className="text-slate-400" />
          : <ChevronRight size={13} className="text-slate-400" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-white space-y-4">
          {s.sliders.map((sl) => {
            const val = params[sl.key] as number;
            const def = DEFAULT_PARAMS[sl.key] as number;
            const isChanged = Math.abs(val - def) > 0.001;
            const pct = ((val - sl.min) / (sl.max - sl.min)) * 100;
            const fmt = sl.step < 0.1 ? 2 : 1;

            return (
              <div key={sl.key as string}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {sl.label}
                    {isChanged && <span className="ml-1 text-amber-400 text-xs">★</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {isChanged && (
                      <span className="text-xs text-slate-300 line-through tabular-nums">
                        {(def as number).toFixed(fmt)}
                      </span>
                    )}
                    <span
                      className="text-sm font-black tabular-nums px-2 py-0.5 rounded-lg"
                      style={{ color: s.color, background: s.color + "14" }}
                    >
                      {val.toFixed(fmt)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={sl.min} max={sl.max} step={sl.step}
                  value={val}
                  onChange={(e) => onChange({ ...params, [sl.key]: +e.target.value })}
                  className="premium-slider"
                  style={{
                    "--sl-color": s.color,
                    "--sl-progress": `${pct}%`,
                  } as React.CSSProperties}
                />
                <p className="text-xs text-slate-400 mt-1 leading-snug">{sl.desc}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  min: number;
  max: number;
  step: number;
  desc: string;
}

const SECTIONS: { title: string; color: string; sliders: SliderDef[] }[] = [
  {
    title: "IS Curve (Aggregate Demand)",
    color: "#3b82f6",
    sliders: [
      { key: "b1", label: "b₁ — Gap persistence",        min: 0, max: 0.99, step: 0.01, desc: "How much of last quarter's output gap carries forward" },
      { key: "b2", label: "b₂ — MCI elasticity",         min: 0, max: 0.8,  step: 0.01, desc: "Sensitivity of output to monetary conditions" },
      { key: "b3", label: "b₃ — External demand",        min: 0, max: 0.8,  step: 0.01, desc: "Weight of foreign output gap in domestic demand" },
      { key: "b4", label: "b₄ — Interest rate in MCI",   min: 0, max: 1,    step: 0.01, desc: "Share of real interest rate vs real exchange rate in MCI" },
    ],
  },
  {
    title: "Phillips Curve (Inflation)",
    color: "#ef4444",
    sliders: [
      { key: "a1", label: "a₁ — Inflation persistence",  min: 0, max: 0.99, step: 0.01, desc: "Backward-looking weight; high = de-anchored expectations" },
      { key: "a2", label: "a₂ — Cost pass-through",      min: 0, max: 0.8,  step: 0.01, desc: "How much marginal cost feeds into inflation" },
      { key: "a3", label: "a₃ — Domestic cost share",    min: 0, max: 1,    step: 0.01, desc: "Output gap vs import costs in real marginal cost" },
    ],
  },
  {
    title: "Taylor Rule (Monetary Policy)",
    color: "#0d9488",
    sliders: [
      { key: "g1", label: "g₁ — Rate smoothing",         min: 0, max: 0.99, step: 0.01, desc: "Interest rate inertia (leaning against volatility)" },
      { key: "g2", label: "g₂ — Inflation response",     min: 1, max: 3,    step: 0.05, desc: "Must be >1 to satisfy Taylor principle (determinacy)" },
      { key: "g3", label: "g₃ — Output gap response",    min: 0, max: 1.5,  step: 0.05, desc: "How aggressively the CBU reacts to output deviations" },
    ],
  },
  {
    title: "Exchange Rate (UIP)",
    color: "#f59e0b",
    sliders: [
      { key: "e1", label: "e₁ — Backward-looking weight", min: 0, max: 0.99, step: 0.01, desc: "Exchange rate inertia vs forward-looking UIP arbitrage" },
    ],
  },
  {
    title: "Steady-State",
    color: "#8b5cf6",
    sliders: [
      { key: "tar",    label: "π* — Inflation target (%)",   min: 2, max: 10, step: 0.5, desc: "CBU medium-term CPI target" },
      { key: "rrbar",  label: "r̄ — Neutral real rate (%)",  min: 0, max: 8,  step: 0.5, desc: "Long-run real rate at which economy is at potential" },
      { key: "gdpbar", label: "ȳ — Potential growth (%)",   min: 2, max: 10, step: 0.5, desc: "Structural GDP growth trend (Balassa-Samuelson adjusted)" },
    ],
  },
];

function Section({
  s, params, onChange,
}: {
  s: (typeof SECTIONS)[0];
  params: QPMParams;
  onChange: (p: QPMParams) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
          {s.title}
        </span>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="p-4 space-y-4 bg-white">
          {s.sliders.map((sl) => {
            const val = params[sl.key] as number;
            const def = DEFAULT_PARAMS[sl.key] as number;
            const changed = Math.abs(val - def) > 0.001;
            return (
              <div key={sl.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    {sl.label}
                    {changed && <span className="ml-1 text-amber-500">★</span>}
                  </span>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: s.color }}
                  >
                    {val.toFixed(sl.step < 0.1 ? 2 : 1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={sl.min}
                  max={sl.max}
                  step={sl.step}
                  value={val}
                  onChange={(e) =>
                    onChange({ ...params, [sl.key]: +e.target.value })
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: s.color }}
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

export function ParameterSidebar({ params, onChange }: Props) {
  const reset = () => onChange({ ...DEFAULT_PARAMS });
  const anyChanged = (Object.keys(DEFAULT_PARAMS) as (keyof QPMParams)[]).some(
    (k) => Math.abs((params[k] as number) - (DEFAULT_PARAMS[k] as number)) > 0.001
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">Model Parameters</span>
        {anyChanged && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>
      {SECTIONS.map((s) => (
        <Section key={s.title} s={s} params={params} onChange={onChange} />
      ))}
    </div>
  );
}

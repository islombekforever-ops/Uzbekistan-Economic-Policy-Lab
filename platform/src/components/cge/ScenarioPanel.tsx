"use client";
import { CGEParams, DEFAULT_CGE_PARAMS, ShockType } from "@/lib/cgeSolver";

interface ScenarioDef {
  id: ShockType;
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  unit: string;
  default: number;
  min: number;
  max: number;
  step: number;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "tariff",
    label: "Import Tariff",
    icon: "📦",
    color: "#f59e0b", bg: "#fffbeb",
    description: "Change in average import tariff rate (percentage points). Positive = tariff rise.",
    unit: "pp", default: 2, min: -10, max: 20, step: 0.5,
  },
  {
    id: "export_price",
    label: "Gold / Commodity Price",
    icon: "🪙",
    color: "#eab308", bg: "#fefce8",
    description: "Change in USD export commodity (gold) price. Uzbekistan gold ≈ 20% of GDP.",
    unit: "%", default: 6, min: -30, max: 50, step: 1,
  },
  {
    id: "investment",
    label: "Investment Surge",
    icon: "🏗️",
    color: "#3b82f6", bg: "#eff6ff",
    description: "Increase in investment share of GDP (pp). FDI inflow or public investment.",
    unit: "pp of GDP", default: 3, min: -10, max: 15, step: 0.5,
  },
  {
    id: "government",
    label: "Gov. Spending",
    icon: "🏛️",
    color: "#8b5cf6", bg: "#f5f3ff",
    description: "Change in government spending share of GDP (pp). Fiscal expansion or austerity.",
    unit: "pp of GDP", default: 2, min: -5, max: 10, step: 0.5,
  },
  {
    id: "devaluation",
    label: "FX Devaluation",
    icon: "💱",
    color: "#ec4899", bg: "#fdf2f8",
    description: "UZS depreciation (%). Positive = UZS weakens vs USD.",
    unit: "%", default: 10, min: -20, max: 50, step: 1,
  },
];

function getPresets(s: ScenarioDef): { label: string; value: number }[] {
  switch (s.id) {
    case "tariff":       return [{ label: "+1pp", value: 1 }, { label: "+3pp", value: 3 }, { label: "+5pp", value: 5 }, { label: "−3pp", value: -3 }];
    case "export_price": return [{ label: "+3%", value: 3 }, { label: "+6%", value: 6 }, { label: "+10%", value: 10 }, { label: "−10%", value: -10 }];
    case "investment":   return [{ label: "+1pp", value: 1 }, { label: "+3pp", value: 3 }, { label: "+5pp", value: 5 }];
    case "government":   return [{ label: "+1pp", value: 1 }, { label: "+2pp", value: 2 }, { label: "+4pp", value: 4 }];
    case "devaluation":  return [{ label: "+5%", value: 5 }, { label: "+10%", value: 10 }, { label: "+20%", value: 20 }, { label: "−5%", value: -5 }];
    default:             return [];
  }
}

interface Props {
  shockType: ShockType;
  shockSize: number;
  params: CGEParams;
  onShock: (t: ShockType) => void;
  onSize: (v: number) => void;
  onParams: (p: CGEParams) => void;
}

export function ScenarioPanel({ shockType, shockSize, params, onShock, onSize, onParams }: Props) {
  const active = SCENARIOS.find((s) => s.id === shockType)!;
  const pct = ((shockSize - active.min) / (active.max - active.min)) * 100;

  return (
    <div className="space-y-5">

      {/* ── Shock type selector ───────────────────────────────────── */}
      <div className="control-panel">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Policy Shock</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SCENARIOS.map((s) => (
            <button key={s.id}
              onClick={() => { onShock(s.id); onSize(s.default); }}
              className={`shock-btn ${shockType === s.id ? "active" : ""}`}
              style={shockType === s.id
                ? { borderColor: s.color, background: s.bg }
                : { borderColor: "#e2e8f0", background: "#fafafa" }
              }
            >
              <span className="text-xl mb-1.5">{s.icon}</span>
              <span className="text-xs font-bold leading-tight block"
                style={{ color: shockType === s.id ? s.color : "#475569" }}>
                {s.label}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">{s.unit}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Magnitude + parameters ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Magnitude */}
        <div className="control-panel">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {active.icon} {active.label}
            </span>
            <span className="text-xl font-black tabular-nums px-3 py-1 rounded-xl"
              style={{ color: active.color, background: active.bg }}>
              {shockSize > 0 ? "+" : ""}{shockSize} {active.unit}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">{active.description}</p>

          {/* Quick presets */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {getPresets(active).map((p) => (
              <button key={p.label} onClick={() => onSize(p.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-150"
                style={shockSize === p.value
                  ? { background: active.color, color: "#fff", borderColor: "transparent", boxShadow: `0 2px 8px ${active.color}55` }
                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <input type="range" min={active.min} max={active.max} step={active.step} value={shockSize}
            onChange={(e) => onSize(+e.target.value)}
            className="premium-slider"
            style={{ "--sl-color": active.color, "--sl-progress": `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{active.min} {active.unit}</span>
            <span>{active.max} {active.unit}</span>
          </div>
        </div>

        {/* Parameters */}
        <div className="control-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Structural Parameters
            </span>
            <button onClick={() => onParams(DEFAULT_CGE_PARAMS)}
              className="text-xs text-slate-400 hover:text-amber-500 font-semibold transition-colors">
              ↺ Reset
            </button>
          </div>
          <div className="space-y-4">
            <CGESlider label="Armington σ" value={params.sigma}
              min={0.5} max={5} step={0.1} color="#f59e0b"
              hint="Import-domestic substitution elasticity"
              onChange={(v) => onParams({ ...params, sigma: v })}
            />
            <CGESlider label="CET η" value={params.eta}
              min={0.5} max={5} step={0.1} color="#0d9488"
              hint="Export-domestic transformation elasticity"
              onChange={(v) => onParams({ ...params, eta: v })}
            />
            <CGESlider label="Gold exports / GDP" value={params.sx_gold}
              min={0.05} max={0.40} step={0.01} color="#eab308"
              hint="Commodity export share of GDP"
              fmt={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => onParams({ ...params, sx_gold: v })}
            />
            <CGESlider label="Total exports / GDP" value={params.sx}
              min={0.10} max={0.50} step={0.01} color="#3b82f6"
              hint="Trade openness"
              fmt={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => onParams({ ...params, sx: v, sm: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CGESlider({ label, value, min, max, step, color, hint, fmt, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  color: string; hint: string; fmt?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = fmt ? fmt(value) : value.toFixed(1);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-black tabular-nums px-2 py-0.5 rounded-lg"
          style={{ color, background: color + "18" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="premium-slider"
        style={{ "--sl-color": color, "--sl-progress": `${pct}%` } as React.CSSProperties}
      />
      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}

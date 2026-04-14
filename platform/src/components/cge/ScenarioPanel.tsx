"use client";
import { CGEParams, DEFAULT_CGE_PARAMS, ShockType } from "@/lib/cgeSolver";

interface ScenarioDef {
  id: ShockType;
  label: string;
  icon: string;
  color: string;
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
    label: "Import Tariff Change",
    icon: "📦",
    color: "#f59e0b",
    description: "Change in average import tariff rate (percentage points). Positive = tariff rise.",
    unit: "pp",
    default: 2,
    min: -10,
    max: 20,
    step: 0.5,
  },
  {
    id: "export_price",
    label: "Gold / Commodity Price",
    icon: "🪙",
    color: "#eab308",
    description: "Change in USD export commodity price (mainly gold). Uzbekistan gold = ~20% of GDP.",
    unit: "%",
    default: 6,
    min: -30,
    max: 50,
    step: 1,
  },
  {
    id: "investment",
    label: "Investment Demand",
    icon: "🏗️",
    color: "#3b82f6",
    description: "Increase in investment share of GDP (percentage points). Captures FDI or public investment surge.",
    unit: "pp of GDP",
    default: 3,
    min: -10,
    max: 15,
    step: 0.5,
  },
  {
    id: "government",
    label: "Government Spending",
    icon: "🏛️",
    color: "#8b5cf6",
    description: "Change in government spending share of GDP (pp). Positive = fiscal expansion.",
    unit: "pp of GDP",
    default: 2,
    min: -5,
    max: 10,
    step: 0.5,
  },
  {
    id: "devaluation",
    label: "Exchange Rate Devaluation",
    icon: "💱",
    color: "#ec4899",
    description: "Percentage depreciation of UZS vs USD. Positive = UZS weakens.",
    unit: "%",
    default: 10,
    min: -20,
    max: 50,
    step: 1,
  },
];

interface Props {
  shockType: ShockType;
  shockSize: number;
  params: CGEParams;
  onShock: (t: ShockType) => void;
  onSize: (v: number) => void;
  onParams: (p: CGEParams) => void;
}

export function ScenarioPanel({
  shockType, shockSize, params, onShock, onSize, onParams,
}: Props) {
  const active = SCENARIOS.find((s) => s.id === shockType)!;

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Select Policy Shock</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => { onShock(s.id); onSize(s.default); }}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                shockType === s.id
                  ? "border-current shadow-md scale-[1.01]"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
              style={shockType === s.id ? {
                background: s.color + "12",
                borderColor: s.color,
              } : {}}
            >
              <span className="text-xl mt-0.5">{s.icon}</span>
              <div>
                <div
                  className="text-xs font-bold leading-tight"
                  style={{ color: shockType === s.id ? s.color : "#334155" }}
                >
                  {s.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{s.unit}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shock magnitude */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-slate-700">
            {active.icon} {active.label}
          </span>
          <span
            className="text-lg font-black"
            style={{ color: active.color }}
          >
            {shockSize > 0 ? "+" : ""}{shockSize} {active.unit}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">{active.description}</p>
        <input
          type="range"
          min={active.min}
          max={active.max}
          step={active.step}
          value={shockSize}
          onChange={(e) => onSize(+e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: active.color }}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{active.min} {active.unit}</span>
          <span>{active.max} {active.unit}</span>
        </div>
        {/* Quick presets */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {getPresets(active).map((p) => (
            <button
              key={p.label}
              onClick={() => onSize(p.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                shockSize === p.value
                  ? "text-white border-transparent"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              style={shockSize === p.value ? { background: active.color } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structural parameters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Structural Parameters</h3>
          <button
            onClick={() => onParams(DEFAULT_CGE_PARAMS)}
            className="text-xs text-slate-400 hover:text-teal-600 font-medium"
          >
            ↺ Reset
          </button>
        </div>
        <div className="space-y-4">
          <ParamSlider
            label="Armington σ (import subst.)"
            value={params.sigma}
            min={0.5} max={5} step={0.1}
            color="#f59e0b"
            hint="Substitution between domestic & imported goods"
            onChange={(v) => onParams({ ...params, sigma: v })}
          />
          <ParamSlider
            label="CET η (export transform.)"
            value={params.eta}
            min={0.5} max={5} step={0.1}
            color="#0d9488"
            hint="Ease of shifting production domestic ↔ exports"
            onChange={(v) => onParams({ ...params, eta: v })}
          />
          <ParamSlider
            label="Gold exports / GDP"
            value={params.sx_gold}
            min={0.05} max={0.40} step={0.01}
            color="#eab308"
            hint="Share of gold/commodity exports in GDP"
            onChange={(v) => onParams({ ...params, sx_gold: v })}
            fmt={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <ParamSlider
            label="Total exports / GDP"
            value={params.sx}
            min={0.10} max={0.50} step={0.01}
            color="#3b82f6"
            hint="Openness — export share of GDP"
            onChange={(v) => onParams({ ...params, sx: v, sm: v })}
            fmt={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <ParamSlider
            label="Base tariff rate"
            value={params.tm}
            min={0} max={0.30} step={0.005}
            color="#8b5cf6"
            hint="Average import tariff in base equilibrium"
            onChange={(v) => onParams({ ...params, tm: v })}
            fmt={(v) => `${(v * 100).toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}

function getPresets(s: ScenarioDef): { label: string; value: number }[] {
  switch (s.id) {
    case "tariff":         return [{ label: "+1pp", value: 1 }, { label: "+3pp", value: 3 }, { label: "+5pp", value: 5 }, { label: "−3pp", value: -3 }];
    case "export_price":   return [{ label: "+3%", value: 3 }, { label: "+6%", value: 6 }, { label: "+10%", value: 10 }, { label: "−10%", value: -10 }];
    case "investment":     return [{ label: "+1pp", value: 1 }, { label: "+3pp", value: 3 }, { label: "+5pp", value: 5 }];
    case "government":     return [{ label: "+1pp", value: 1 }, { label: "+2pp", value: 2 }, { label: "+4pp", value: 4 }];
    case "devaluation":    return [{ label: "+5%", value: 5 }, { label: "+10%", value: 10 }, { label: "+20%", value: 20 }, { label: "−5%", value: -5 }];
    default:               return [];
  }
}

function ParamSlider({
  label, value, min, max, step, color, hint, onChange, fmt,
}: {
  label: string; value: number; min: number; max: number; step: number;
  color: string; hint: string; onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  const display = fmt ? fmt(value) : value.toFixed(1);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-black font-mono" style={{ color }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}

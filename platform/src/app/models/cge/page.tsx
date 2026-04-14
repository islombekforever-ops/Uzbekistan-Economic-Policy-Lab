"use client";
import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { CGEHeader } from "@/components/cge/CGEHeader";
import { ScenarioPanel } from "@/components/cge/ScenarioPanel";
import { ResultsDisplay } from "@/components/cge/ResultsDisplay";
import { MethodologyCGE } from "@/components/cge/MethodologyCGE";
import { DEFAULT_CGE_PARAMS, CGEParams, ShockType, solveCGE } from "@/lib/cgeSolver";
import { SlidersHorizontal, X } from "lucide-react";

const TABS = [
  { id: "simulator",   label: "Policy Simulator" },
  { id: "method",      label: "Methodology" },
];

export default function CGEPage() {
  const [tab, setTab]               = useState("simulator");
  const [params, setParams]         = useState<CGEParams>({ ...DEFAULT_CGE_PARAMS });
  const [shockType, setShockType]   = useState<ShockType>("export_price");
  const [shockSize, setShockSize]   = useState(6);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const result = useMemo(
    () => solveCGE(shockType, shockSize, params),
    [shockType, shockSize, params],
  );

  return (
    <PageShell>
      {/* Page header */}
      <div
        className="px-6 lg:px-10 py-8 border-b border-slate-200"
        style={{ background: "linear-gradient(135deg, #1c1400 0%, #3d2a00 40%, #1a1f0a 100%)" }}
      >
        <CGEHeader params={params} />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "simulator" && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              sidebarOpen
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {sidebarOpen ? <X size={14} /> : <SlidersHorizontal size={14} />}
            {sidebarOpen ? "Close" : "Parameters"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex animate-fade-in">

        {/* Main content */}
        <div className={`flex-1 min-w-0 px-6 lg:px-10 py-8 ${sidebarOpen ? "lg:pr-6" : ""}`}>

          {tab === "simulator" && (
            <div className="space-y-6">
              {/* Scenario selector + shock size */}
              <ScenarioPanel
                shockType={shockType}
                shockSize={shockSize}
                params={params}
                onShock={setShockType}
                onSize={setShockSize}
                onParams={setParams}
              />
              {/* Results */}
              <ResultsDisplay
                result={result}
                shockType={shockType}
                shockSize={shockSize}
              />
            </div>
          )}

          {tab === "method" && <MethodologyCGE params={params} />}
        </div>

        {/* Desktop parameter sidebar (re-uses ScenarioPanel params section) */}
        {sidebarOpen && tab === "simulator" && (
          <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-slate-200
                            px-5 py-8 overflow-y-auto bg-slate-50/50 max-h-screen sticky top-[57px]">
            <ParameterSidebarInner params={params} onParams={setParams} />
          </aside>
        )}

        {/* Mobile parameter drawer */}
        {sidebarOpen && tab === "simulator" && (
          <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-80 bg-white h-full overflow-y-auto px-5 py-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-800">Model Parameters</span>
                <button onClick={() => setSidebarOpen(false)}>
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <ParameterSidebarInner params={params} onParams={setParams} />
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Inline parameter sidebar ──────────────────────────────────────────────────
function ParameterSidebarInner({
  params, onParams,
}: {
  params: CGEParams;
  onParams: (p: CGEParams) => void;
}) {
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Elasticities</h3>
        <button
          className="text-xs text-slate-400 hover:text-amber-500 font-medium"
          onClick={() => onParams(DEFAULT_CGE_PARAMS)}
        >
          ↺ Reset
        </button>
      </div>

      <SliderField
        label="Armington σ" value={params.sigma}
        min={0.5} max={5} step={0.1} color="#f59e0b" desc="Import substitution"
        onChange={(v) => onParams({ ...params, sigma: v })}
      />
      <SliderField
        label="CET η" value={params.eta}
        min={0.5} max={5} step={0.1} color="#f59e0b" desc="Export transformation"
        onChange={(v) => onParams({ ...params, eta: v })}
      />

      <h3 className="text-sm font-bold text-slate-800 pt-2">SAM Shares</h3>

      <SliderField
        label="Consumption / GDP" value={params.sc}
        min={0.3} max={0.8} step={0.01} color="#0d9488" desc="Private consumption share"
        fmt={pct} onChange={(v) => onParams({ ...params, sc: v })}
      />
      <SliderField
        label="Exports / GDP" value={params.sx}
        min={0.1} max={0.5} step={0.01} color="#0d9488" desc="Export openness"
        fmt={pct} onChange={(v) => onParams({ ...params, sx: v, sm: v })}
      />
      <SliderField
        label="Gold exports / GDP" value={params.sx_gold}
        min={0.05} max={0.4} step={0.01} color="#0d9488" desc="Commodity export share"
        fmt={pct} onChange={(v) => onParams({ ...params, sx_gold: v })}
      />
      <SliderField
        label="Base tariff rate" value={params.tm}
        min={0} max={0.3} step={0.005} color="#0d9488" desc="Avg import tariff"
        fmt={pct1} onChange={(v) => onParams({ ...params, tm: v })}
      />
    </div>
  );
}

function SliderField({
  label, value, min, max, step, color, desc, fmt, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  color: string; desc: string; fmt?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = fmt ? fmt(value) : value.toFixed(1);
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs font-black font-mono" style={{ color }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

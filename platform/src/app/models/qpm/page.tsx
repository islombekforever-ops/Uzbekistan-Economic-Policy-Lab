"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { QPMHeader } from "@/components/qpm/QPMHeader";
import { IRFPanel } from "@/components/qpm/IRFPanel";
import { BaselinePanel } from "@/components/qpm/BaselinePanel";
import { ParameterSidebar } from "@/components/qpm/ParameterSidebar";
import { MethodologyQPM } from "@/components/qpm/MethodologyQPM";
import { DEFAULT_PARAMS, QPMParams, ShockType } from "@/lib/qpmSolver";
import { SlidersHorizontal, X } from "lucide-react";

const TABS = [
  { id: "irf",      label: "Shock Analysis (IRF)" },
  { id: "baseline", label: "Baseline Forecast" },
  { id: "method",   label: "Methodology" },
];

export default function QPMPage() {
  const [tab, setTab] = useState("irf");
  const [params, setParams] = useState<QPMParams>({ ...DEFAULT_PARAMS });
  const [shockType, setShockType] = useState<ShockType>("demand");
  const [shockSize, setShockSize] = useState(1.0);
  const [horizon, setHorizon] = useState(12);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PageShell>
      {/* Page header */}
      <div
        className="px-6 lg:px-10 py-8 border-b border-slate-200"
        style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1a3560 100%)" }}
      >
        <QPMHeader params={params} />
      </div>

      {/* Tab bar + params toggle */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Parameter toggle — visible on IRF/Baseline tabs */}
        {tab !== "method" && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              sidebarOpen
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {sidebarOpen ? <X size={14} /> : <SlidersHorizontal size={14} />}
            {sidebarOpen ? "Close" : "Parameters"}
          </button>
        )}
      </div>

      {/* Content area — two-column when params open */}
      <div className="flex animate-fade-in">
        {/* Main content */}
        <div className={`flex-1 min-w-0 px-6 lg:px-10 py-8 ${sidebarOpen ? "lg:pr-6" : ""}`}>
          {tab === "irf" && (
            <IRFPanel
              shockType={shockType}
              shockSize={shockSize}
              horizon={horizon}
              params={params}
              onShock={setShockType}
              onSize={setShockSize}
              onHorizon={setHorizon}
            />
          )}
          {tab === "baseline" && <BaselinePanel params={params} />}
          {tab === "method"   && <MethodologyQPM params={params} />}
        </div>

        {/* Parameter sidebar — right panel */}
        {sidebarOpen && tab !== "method" && (
          <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-slate-200 px-5 py-8 overflow-y-auto bg-slate-50/50 max-h-screen sticky top-[57px]">
            <ParameterSidebar params={params} onChange={setParams} />
          </aside>
        )}

        {/* Mobile parameter drawer */}
        {sidebarOpen && tab !== "method" && (
          <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-80 bg-white h-full overflow-y-auto px-5 py-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-800">Model Parameters</span>
                <button onClick={() => setSidebarOpen(false)}>
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <ParameterSidebar params={params} onChange={setParams} />
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}

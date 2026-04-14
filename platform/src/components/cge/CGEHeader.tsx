"use client";
import { Globe } from "lucide-react";
import { CGEParams } from "@/lib/cgeSolver";

export function CGEHeader({ params }: { params: CGEParams }) {
  const metrics = [
    { label: "Export Share",   value: `${(params.sx * 100).toFixed(0)}%`,    sub: "of GDP" },
    { label: "Import Share",   value: `${(params.sm * 100).toFixed(0)}%`,    sub: "of GDP" },
    { label: "Armington σ",    value: params.sigma.toFixed(1),                sub: "D-M elasticity" },
    { label: "CET η",          value: params.eta.toFixed(1),                  sub: "D-X elasticity" },
    { label: "Base Tariff",    value: `${(params.tm * 100).toFixed(1)}%`,    sub: "avg import rate" },
    { label: "Gold Exports",   value: `${(params.sx_gold * 100).toFixed(0)}%`, sub: "of GDP" },
  ];

  return (
    <div>
      {/* Title row */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Globe size={24} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-white font-black text-2xl">CGE Model (1-2-3)</h1>
            <span className="badge-live text-xs">Live</span>
          </div>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed max-w-2xl">
            Computable General Equilibrium — Devarajan-Lewis-Robinson framework. Simulates
            economy-wide effects of trade, fiscal and exchange-rate policies in Uzbekistan.
            Johansen linearised first-order solution calibrated to the 2022 SAM.
          </p>
        </div>
      </div>

      {/* Metric badges */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label}
               className="bg-white/5 rounded-xl px-3 py-2.5 text-center border border-white/10">
            <div className="text-amber-400 font-black text-lg leading-tight">{m.value}</div>
            <div className="text-slate-200 text-xs font-semibold mt-0.5 leading-tight">{m.label}</div>
            <div className="text-slate-500 text-xs mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

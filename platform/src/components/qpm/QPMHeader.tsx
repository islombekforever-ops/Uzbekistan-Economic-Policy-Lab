"use client";
import { Activity, CheckCircle } from "lucide-react";
import { QPMParams } from "@/lib/qpmSolver";

export function QPMHeader({ params }: { params: QPMParams }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-3">
        Overview › Models › <span className="text-teal-400">Quarterly Projection Model (QPM)</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Activity className="text-blue-400" size={24} />
            Quarterly Projection Model
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            New Keynesian DSGE · IS curve · Phillips curve · Taylor rule · UIP ·
            Calibrated for Uzbekistan
          </p>
        </div>

        {/* Calibration summary */}
        <div className="flex flex-wrap gap-3">
          <ParamBadge label="Inflation Target π*" value={`${params.tar.toFixed(1)}%`} />
          <ParamBadge label="Neutral Real Rate r̄" value={`${params.rrbar.toFixed(1)}%`} />
          <ParamBadge label="Potential Growth ȳ"  value={`${params.gdpbar.toFixed(1)}%`} />
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle size={12} className="text-teal-400" />
          IRIS Toolbox (MATLAB) · Client-side JS solver
        </span>
        <span>·</span>
        <span>Data: 2016Q1–2025Q4 · 35 variables · 12 shocks</span>
        <span>·</span>
        <span>Calibrated by CEER Uzbekistan</span>
      </div>
    </div>
  );
}

function ParamBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3 bg-white/10 border border-white/10">
      <div className="text-xs text-slate-300 mb-1">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  );
}

"use client";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Nowcast, Metadata, Forecast } from "@/lib/types";

export function NowcastHeader({
  nowcast, metadata, forecast,
}: {
  nowcast: Nowcast;
  metadata: Metadata;
  forecast: Forecast[];
}) {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 mb-3">
        Overview &rsaquo; Models &rsaquo;{" "}
        <span className="text-teal-400">GDP Nowcasting (DFM)</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-6">
        {/* Left: title */}
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="text-teal-400" size={24} />
            GDP Nowcasting
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Mixed-Frequency Dynamic Factor Model · {metadata.indicators_count} indicators ·{" "}
            {metadata.factors_count} latent factor
          </p>
        </div>

        {/* Right: key numbers */}
        <div className="flex flex-wrap gap-4">
          {/* Current nowcast */}
          <NowcastBadge
            label={`Nowcast · ${nowcast.current_quarter}`}
            qoq={nowcast.qoq_growth}
            yoy={nowcast.yoy_growth}
            ci={`${nowcast.uncertainty.yoy_lower.toFixed(1)}–${nowcast.uncertainty.yoy_upper.toFixed(1)}%`}
            highlight
          />
          {/* Forecasts */}
          {forecast.map((f) => (
            <NowcastBadge
              key={f.quarter}
              label={`Forecast · ${f.quarter}`}
              qoq={f.qoq_growth}
              yoy={f.yoy_growth}
            />
          ))}
        </div>
      </div>

      {/* Model status bar */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          {metadata.converged ? (
            <CheckCircle size={12} className="text-teal-400" />
          ) : (
            <AlertCircle size={12} className="text-amber-400" />
          )}
          EM {metadata.converged ? "Converged" : "Not converged"} ({metadata.em_iterations} iters)
        </span>
        <span>·</span>
        <span>Log-likelihood: {metadata.log_likelihood.toFixed(2)}</span>
        <span>·</span>
        <span>Data vintage: {metadata.data_vintage}</span>
        <span>·</span>
        <span>Updated: {metadata.last_updated}</span>
      </div>
    </div>
  );
}

function NowcastBadge({
  label, qoq, yoy, ci, highlight = false,
}: {
  label: string; qoq: number; yoy: number; ci?: string; highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ${
        highlight
          ? "bg-teal-600/30 border border-teal-500/40"
          : "bg-white/10 border border-white/10"
      }`}
    >
      <div className="text-xs text-slate-300 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">
          +{yoy.toFixed(1)}%
        </span>
        <span className="text-slate-400 text-xs">YoY</span>
      </div>
      <div className="text-xs text-slate-400 mt-0.5">
        QoQ: +{qoq.toFixed(2)}%
        {ci && <span className="ml-2 text-teal-300">95% CI: {ci}</span>}
      </div>
    </div>
  );
}

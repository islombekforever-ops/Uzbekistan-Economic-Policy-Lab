"use client";
import Link from "next/link";
import { TrendingUp, ArrowUpRight, Clock, Cpu } from "lucide-react";
import { Nowcast, Metadata } from "@/lib/types";

export function HeroSection({ nowcast, metadata }: { nowcast: Nowcast; metadata: Metadata }) {
  const sign = nowcast.yoy_growth >= 0 ? "+" : "";

  return (
    <div
      className="relative overflow-hidden px-6 lg:px-10 py-12"
      style={{
        background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 50%, #0d9488 100%)",
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v1H0zM0 0v40h1V0z' fill='%23fff'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-5xl">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                        bg-white/10 text-teal-300 border border-teal-400/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          LIVE — {metadata.data_vintage}
        </div>

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
          Uzbekistan Economic
          <br />
          <span className="text-teal-300">Policy Lab</span>
        </h1>
        <p className="text-slate-300 text-base max-w-xl mb-10">
          Real-time quantitative models for economic analysis and policy design.
          From nowcasting to general equilibrium — all in one platform.
        </p>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <MetricBadge
            label="GDP Growth (YoY)"
            value={`${sign}${nowcast.yoy_growth.toFixed(1)}%`}
            sub={nowcast.current_quarter}
            color="teal"
          />
          <MetricBadge
            label="GDP Growth (QoQ)"
            value={`${sign}${nowcast.qoq_growth.toFixed(2)}%`}
            sub="Quarter-on-Quarter"
            color="blue"
          />
          <MetricBadge
            label="95% CI (YoY)"
            value={`${nowcast.uncertainty.yoy_lower.toFixed(1)}–${nowcast.uncertainty.yoy_upper.toFixed(1)}%`}
            sub="Confidence Interval"
            color="purple"
          />
          <MetricBadge
            label="Model Indicators"
            value={`${metadata.indicators_count}`}
            sub="Monthly & Quarterly"
            color="amber"
          />
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/models/nowcasting"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
                       bg-teal-500 text-white hover:bg-teal-400 transition-colors shadow-lg shadow-teal-900/30"
          >
            <TrendingUp size={16} />
            Open DFM Nowcasting
            <ArrowUpRight size={14} />
          </Link>
          <a
            href="https://github.com/islombekforever-ops/Uzbekistan-Economic-Policy-Lab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
                       bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            <Cpu size={16} />
            GitHub Repository
          </a>
        </div>

        {/* Timestamp */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <Clock size={12} />
          Last updated: {metadata.last_updated} · Model: {metadata.model_type}
        </div>
      </div>
    </div>
  );
}

function MetricBadge({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color: string;
}) {
  const accent: Record<string, string> = {
    teal: "#0d9488",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    amber: "#f59e0b",
  };
  return (
    <div
      className="rounded-xl p-4 bg-white/10 backdrop-blur-sm border border-white/10"
      style={{ borderLeftColor: accent[color], borderLeftWidth: 3 }}
    >
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

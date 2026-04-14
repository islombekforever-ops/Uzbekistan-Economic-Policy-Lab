"use client";
import Link from "next/link";
import { TrendingUp, ArrowUpRight, Cpu, BarChart2, Globe } from "lucide-react";
import { Nowcast, Metadata } from "@/lib/types";

export function HeroSection({ nowcast, metadata }: { nowcast: Nowcast; metadata: Metadata }) {
  const sign = nowcast.yoy_growth >= 0 ? "+" : "";

  const metrics = [
    {
      label: "GDP Growth (YoY)",
      value: `${sign}${nowcast.yoy_growth.toFixed(1)}%`,
      sub: nowcast.current_quarter,
      color: "#0d9488",
      glow: "rgba(13,148,136,0.3)",
    },
    {
      label: "GDP Growth (QoQ)",
      value: `${sign}${nowcast.qoq_growth.toFixed(2)}%`,
      sub: "Quarter-on-quarter",
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.3)",
    },
    {
      label: "95% Confidence",
      value: `${nowcast.uncertainty.yoy_lower.toFixed(1)}–${nowcast.uncertainty.yoy_upper.toFixed(1)}%`,
      sub: "Uncertainty band",
      color: "#8b5cf6",
      glow: "rgba(139,92,246,0.3)",
    },
    {
      label: "DFM Indicators",
      value: `${metadata.indicators_count}`,
      sub: "Monthly & quarterly",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.3)",
    },
  ];

  return (
    <div
      className="relative overflow-hidden px-6 lg:px-10 py-14"
      style={{
        background: "linear-gradient(135deg, #080f1e 0%, #0d1f3c 40%, #1a3560 70%, #0d9488 100%)",
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h48v1H0zM0 0v48h1V0z' fill='%23fff'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 animate-float"
           style={{ background: "radial-gradient(circle, #0d9488, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-5"
           style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />

      <div className="relative max-w-5xl">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold
                        bg-white/10 text-teal-300 border border-teal-500/30 mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400" style={{ animation: "blink 2s infinite" }} />
          LIVE · {metadata.data_vintage}
        </div>

        {/* Title */}
        <h1 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4 animate-slide-up">
          Uzbekistan
          <br />
          <span style={{
            background: "linear-gradient(90deg, #2dd4bf, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Economic Policy Lab
          </span>
        </h1>

        <p className="text-slate-300 text-base lg:text-lg max-w-xl mb-10 leading-relaxed animate-slide-up delay-100">
          Real-time quantitative models for economic analysis and policy design.
          GDP nowcasting, DSGE projections, and CGE simulations — all in one platform.
        </p>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 animate-slide-up delay-200">
          {metrics.map((m) => (
            <div key={m.label}
              className="rounded-2xl p-4 border border-white/10 backdrop-blur-sm relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
                   style={{ background: `radial-gradient(circle at 50% 0%, ${m.glow}, transparent 60%)` }} />
              <div className="text-xs text-slate-400 mb-1 font-medium">{m.label}</div>
              <div className="text-xl lg:text-2xl font-black text-white tabular-nums" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{m.sub}</div>
              <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl"
                   style={{ background: m.color + "80" }} />
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 animate-slide-up delay-300">
          <Link href="/models/nowcasting"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm
                       text-white transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", boxShadow: "0 4px 20px rgba(13,148,136,0.4)" }}
          >
            <TrendingUp size={16} />
            GDP Nowcasting
            <ArrowUpRight size={14} />
          </Link>
          <Link href="/models/qpm"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm
                       text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}
          >
            <BarChart2 size={16} />
            QPM Model
          </Link>
          <Link href="/models/cge"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm
                       text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}
          >
            <Globe size={16} />
            CGE Model
          </Link>
          <a href="https://github.com/islombekforever-ops/Uzbekistan-Economic-Policy-Lab"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm
                       bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-200"
          >
            <Cpu size={16} />
            GitHub
          </a>
        </div>

        {/* Footer meta */}
        <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500 animate-fade-in delay-400">
          <span>🕐 Updated: {metadata.last_updated}</span>
          <span>·</span>
          <span>⚙️ {metadata.model_type}</span>
          <span>·</span>
          <span>📊 3 Live Models</span>
          <span>·</span>
          <span>🇺🇿 CEER Uzbekistan</span>
        </div>
      </div>
    </div>
  );
}

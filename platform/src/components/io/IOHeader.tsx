"use client";
import { IOData } from "@/lib/ioData";
import { Network, BarChart3, TrendingUp, Database } from "lucide-react";

export function IOHeader({ data }: { data: IOData }) {
  const totalOutputUSD = (data.metadata.total_output_trn_uzs / 11).toFixed(0); // ~11k UZS/USD

  const stats = [
    { label: "Sectors", value: `${data.metadata.n_sectors}`, sub: "NACE Rev.2 industries", icon: <Database size={15} />, color: "#8b5cf6" },
    { label: "Max Multiplier", value: Math.max(...data.output_multipliers).toFixed(2), sub: "Total output effect", icon: <TrendingUp size={15} />, color: "#0d9488" },
    { label: "Key Sectors", value: `${data.sectors.filter(s => s.bl >= 1 && s.fl >= 1).length}`, sub: "BL > 1 & FL > 1", icon: <Network size={15} />, color: "#f59e0b" },
    { label: "Source Year", value: `${data.metadata.year}`, sub: "StatCom TZV table", icon: <BarChart3 size={15} />, color: "#3b82f6" },
  ];

  return (
    <div>
      {/* Title row */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
          <Network size={22} className="text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1">
            Leontief Input-Output Model · Uzbekistan {data.metadata.year}
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight">
            Input-Output Analysis
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-xl leading-relaxed">
            136-sector inter-industry linkage analysis. Identify key sectors, measure
            backward &amp; forward linkages, and simulate demand shocks.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label}
            className="rounded-xl p-4 border border-white/10 backdrop-blur-sm relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div className="absolute top-0 left-0 w-full h-0.5"
                 style={{ background: s.color + "99" }} />
            <div className="flex items-center gap-1.5 mb-2 text-slate-400"
                 style={{ color: s.color }}>
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <div className="text-xl font-black text-white tabular-nums">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

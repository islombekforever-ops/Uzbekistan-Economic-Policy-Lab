"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { Indicator } from "@/lib/types";

const CATEGORIES = ["All", "Production", "Trade", "Services", "Prices", "Money", "Financial", "Surveys", "High-Freq", "External"];

const CATEGORY_COLORS: Record<string, string> = {
  Production: "#0d9488",
  Trade: "#3b82f6",
  Services: "#8b5cf6",
  Prices: "#f59e0b",
  Money: "#ec4899",
  Financial: "#06b6d4",
  Surveys: "#10b981",
  "High-Freq": "#f97316",
  External: "#64748b",
};

export function IndicatorsGrid({ indicators }: { indicators: Indicator[] }) {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "yoy" | "mom">("yoy");

  const filtered = indicators
    .filter((i) => cat === "All" || i.category === cat)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "yoy") return Math.abs(b.latest_yoy) - Math.abs(a.latest_yoy);
      return Math.abs(b.latest_mom) - Math.abs(a.latest_mom);
    });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search indicators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "yoy" | "mom")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white
                     focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="yoy">Sort by YoY</option>
          <option value="mom">Sort by MoM</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              cat === c
                ? "bg-navy-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
            style={cat === c ? { background: "#0d1f3c" } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-sm text-slate-500">
        Showing {filtered.length} of {indicators.length} indicators
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ind) => (
          <IndicatorCard key={ind.id} indicator={ind} />
        ))}
      </div>
    </div>
  );
}

function IndicatorCard({ indicator: ind }: { indicator: Indicator }) {
  const color = CATEGORY_COLORS[ind.category] || "#64748b";
  const yoyPos = ind.latest_yoy >= 0;
  const momPos = ind.latest_mom >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-sm font-semibold text-slate-800 leading-snug truncate">{ind.name}</div>
          <div
            className="inline-block text-xs font-medium mt-1 px-2 py-0.5 rounded-full"
            style={{ background: color + "18", color }}
          >
            {ind.category}
          </div>
        </div>
        <div className={`p-1.5 rounded-lg ${yoyPos ? "bg-emerald-50" : "bg-red-50"}`}>
          {yoyPos ? (
            <TrendingUp size={14} className="text-emerald-600" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-400 mb-0.5">Year-on-Year</div>
          <div className={`text-lg font-bold ${yoyPos ? "text-emerald-600" : "text-red-500"}`}>
            {yoyPos ? "+" : ""}{ind.latest_yoy.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <div className="text-xs text-slate-400 mb-0.5">Month-on-Month</div>
          <div className={`text-lg font-bold ${momPos ? "text-blue-600" : "text-red-500"}`}>
            {momPos ? "+" : ""}{ind.latest_mom.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Mini sparkline bar */}
      <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(Math.abs(ind.latest_yoy) * 5, 100)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

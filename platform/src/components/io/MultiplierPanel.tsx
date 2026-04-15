"use client";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { IOData, IOSector } from "@/lib/ioData";

const GROUP_ORDER = [
  "Agriculture","Mining","Manufacturing","Energy","Water/Waste",
  "Construction","Trade","Transport","Hospitality","ICT",
  "Finance","Real Estate","Professional","Admin",
  "Public Admin","Education","Health","Arts","Other Services",
];

interface Props { data: IOData; onSelectSector: (id: number) => void; selectedId: number | null; }

type SortKey = "mult" | "bl" | "fl" | "output_bn";
const SORT_OPTIONS: { key: SortKey; label: string; color: string }[] = [
  { key: "mult",      label: "Output Multiplier", color: "#8b5cf6" },
  { key: "bl",        label: "Backward Linkage",  color: "#0d9488" },
  { key: "fl",        label: "Forward Linkage",   color: "#f59e0b" },
  { key: "output_bn", label: "Gross Output",      color: "#3b82f6" },
];

export function MultiplierPanel({ data, onSelectSector, selectedId }: Props) {
  const [sortKey, setSortKey]       = useState<SortKey>("mult");
  const [topN, setTopN]             = useState(30);
  const [groupFilter, setGroupFilter] = useState<string>("All");

  const activeSort = SORT_OPTIONS.find(o => o.key === sortKey)!;

  const chartData = useMemo(() => {
    let sectors = [...data.sectors];
    if (groupFilter !== "All") sectors = sectors.filter(s => s.group === groupFilter);
    sectors.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
    return sectors.slice(0, topN).map(s => ({
      id:    s.id,
      code:  s.code.length > 10 ? s.code.slice(0, 10) : s.code,
      name:  s.name,
      value: +(s[sortKey] as number).toFixed(4),
      color: s.color,
      group: s.group,
      mult:  s.mult,
      bl:    s.bl,
      fl:    s.fl,
      output_bn: s.output_bn,
    }));
  }, [data, sortKey, topN, groupFilter]);

  const groups = ["All", ...GROUP_ORDER.filter(g => data.sectors.some(s => s.group === g))];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="surface p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setSortKey(o.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={sortKey === o.key
                ? { background: o.color, color: "#fff", borderColor: "transparent", boxShadow: `0 2px 8px ${o.color}55` }
                : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Top</span>
          {[20, 30, 50, 136].map(n => (
            <button key={n} onClick={() => setTopN(n)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                topN === n ? "bg-slate-800 text-white border-transparent" : "bg-white text-slate-500 border-slate-200"
              }`}
            >{n === 136 ? "All" : n}</button>
          ))}
        </div>
      </div>

      {/* Group filter */}
      <div className="flex gap-1.5 flex-wrap px-1">
        {groups.map(g => (
          <button key={g} onClick={() => setGroupFilter(g)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
            style={groupFilter === g
              ? { background: "#0d1f3c", color: "#fff", borderColor: "transparent" }
              : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
            }
          >{g}</button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="surface p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          {activeSort.label} — Top {Math.min(topN, chartData.length)} Sectors
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {sortKey === "mult" && "Total output multiplier = sum of Leontief inverse column. Shows economy-wide production induced per unit of final demand."}
          {sortKey === "bl"   && "Backward linkage (Rasmussen-Hirschman) > 1 = above-average demand for upstream inputs."}
          {sortKey === "fl"   && "Forward linkage > 1 = above-average supply to downstream sectors."}
          {sortKey === "output_bn" && "Gross output in billion UZS (2022). Measures sector size."}
        </p>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 22)}>
          <BarChart data={chartData} layout="vertical"
            margin={{ top: 0, right: 60, bottom: 0, left: 100 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false} axisLine={false}
              tickFormatter={v => sortKey === "output_bn" ? `${v.toFixed(0)}bn` : v.toFixed(2)}
            />
            <YAxis type="category" dataKey="code" width={95}
              tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
            {(sortKey === "bl" || sortKey === "fl") && (
              <ReferenceLine x={1} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            <Tooltip content={<MultTooltip sortKey={sortKey} />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}
              isAnimationActive animationDuration={500}
              onClick={(d: { id: number }) => onSelectSector(d.id)}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry) => (
                <Cell key={entry.id}
                  fill={entry.id === selectedId ? "#0d1f3c" : entry.color}
                  fillOpacity={entry.id === selectedId ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <SummaryStats data={data} sortKey={sortKey} color={activeSort.color} />
    </div>
  );
}

function MultTooltip({ active, payload, sortKey }: { active?: boolean; payload?: { payload: { name: string; mult: number; bl: number; fl: number; output_bn: number; group: string } }[]; sortKey: SortKey; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/98 rounded-xl border border-slate-200 px-4 py-3 shadow-xl text-xs max-w-xs">
      <div className="font-bold text-slate-800 mb-2 leading-tight">{d.name}</div>
      <div className="text-slate-500 mb-2">{d.group}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Output Multiplier</span><span className="font-black text-purple-600">{d.mult.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Backward Linkage</span><span className={`font-black ${d.bl >= 1 ? "text-teal-600" : "text-slate-500"}`}>{d.bl.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Forward Linkage</span><span className={`font-black ${d.fl >= 1 ? "text-amber-600" : "text-slate-500"}`}>{d.fl.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Gross Output</span><span className="font-black text-blue-600">{d.output_bn.toFixed(1)} bn UZS</span></div>
      </div>
    </div>
  );
}

function SummaryStats({ data, sortKey, color }: { data: IOData; sortKey: SortKey; color: string }) {
  const vals = data.sectors.map(s => s[sortKey] as number);
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
  const above = vals.filter(v => v > avg).length;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Average", val: avg.toFixed(3) },
        { label: "Above average", val: `${above} / ${vals.length}` },
        { label: "Max", val: Math.max(...vals).toFixed(3) },
      ].map(s => (
        <div key={s.label} className="surface p-4 text-center">
          <div className="text-lg font-black tabular-nums" style={{ color }}>{s.val}</div>
          <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

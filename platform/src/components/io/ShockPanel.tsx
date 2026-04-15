"use client";
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { IOData, simulateShock } from "@/lib/ioData";
import { Zap } from "lucide-react";

interface Props { data: IOData; selectedId: number | null; onSelectSector: (id: number) => void; }

/** Encode name + code for the custom Y-axis tick */
const SEP = "\u0001";
const encodeLabel = (name: string, code: string) => `${name}${SEP}${code}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomYTick({ x, y, payload }: any) {
  const raw: string = payload?.value ?? "";
  const sepIdx = raw.indexOf(SEP);
  const rawName = sepIdx >= 0 ? raw.slice(0, sepIdx) : raw;
  const code    = sepIdx >= 0 ? raw.slice(sepIdx + 1) : "";
  const name    = rawName.length > 28 ? rawName.slice(0, 27).trimEnd() + "…" : rawName;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={-3} textAnchor="end" fill="#374151"
            fontSize={9} fontWeight={500} fontFamily="inherit">
        {name}
      </text>
      <text x={-8} y={8} textAnchor="end" fill="#8b5cf6"
            fontSize={8} fontFamily="monospace" fontWeight={700}>
        ({code})
      </text>
    </g>
  );
}

export function ShockPanel({ data, selectedId, onSelectSector }: Props) {
  const [searchTerm, setSearchTerm]   = useState("");
  const [shockAmount, setShockAmount] = useState(1000);
  const [topN, setTopN]               = useState(20);

  const sector = selectedId !== null ? data.sectors[selectedId] : null;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return data.sectors.slice(0, 50);
    const t = searchTerm.toLowerCase();
    return data.sectors.filter(s =>
      s.name.toLowerCase().includes(t) ||
      s.code.toLowerCase().includes(t) ||
      s.group.toLowerCase().includes(t)
    ).slice(0, 80);
  }, [data, searchTerm]);

  const shockResult = useMemo(() => {
    if (selectedId === null) return null;
    const deltaX = simulateShock(data.L_matrix, selectedId, shockAmount);
    return deltaX
      .map((val, id) => ({
        id,
        val,
        label: encodeLabel(data.sectors[id].name, data.sectors[id].code),
        name:  data.sectors[id].name,
        code:  data.sectors[id].code,
        color: data.sectors[id].color,
        group: data.sectors[id].group,
      }))
      .filter(d => Math.abs(d.val) > 0.01)
      .sort((a, b) => b.val - a.val)
      .slice(0, topN);
  }, [data, selectedId, shockAmount, topN]);

  const totalImpact    = shockResult ? shockResult.reduce((s, d) => s + d.val, 0) : 0;
  const multiplierEst  = sector ? totalImpact / shockAmount : 0;
  const rowH           = 28;
  const chartH         = Math.max(300, (shockResult?.length ?? 10) * rowH);

  return (
    <div className="space-y-4">
      {/* Intro insight */}
      <div className="insight-neutral flex gap-3 items-start">
        <Zap size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#8b5cf6" }} />
        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">How it works</div>
          <p className="text-sm leading-relaxed">
            Select a sector, set the demand shock size, and the Leontief model computes
            total production increases across all 136 sectors: <strong>Δx = L × Δf</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sector selector */}
        <div className="surface p-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Select Sector</div>
          <input
            type="text"
            placeholder="Search by name, code, or group..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {filtered.map(s => (
              <button key={s.id} onClick={() => onSelectSector(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all ${
                  s.id === selectedId
                    ? "bg-purple-600 text-white shadow-lg"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{ background: s.id === selectedId ? "#fff" : s.color }} />
                <span className="min-w-0">
                  <span className={`text-xs leading-tight block truncate font-medium ${s.id === selectedId ? "text-white" : "text-slate-700"}`}>
                    {s.name}
                  </span>
                  <span className={`font-mono text-xs mt-0.5 ${s.id === selectedId ? "text-purple-200" : "text-slate-400"}`}>
                    {s.code}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shock parameters + sector card */}
        <div className="space-y-4">
          <div className="surface p-5 space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Set Demand Shock</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Final demand increase</span>
              <span className="text-xl font-black tabular-nums text-purple-600">
                +{shockAmount.toLocaleString()} bn UZS
              </span>
            </div>
            <input type="range" min={100} max={20000} step={100} value={shockAmount}
              onChange={e => setShockAmount(+e.target.value)}
              className="premium-slider w-full"
              style={{ "--sl-color": "#8b5cf6", "--sl-progress": `${((shockAmount-100)/(20000-100)*100)}%` } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>100 bn</span><span>20,000 bn UZS</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 5000, 10000].map(v => (
                <button key={v} onClick={() => setShockAmount(v)}
                  className="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
                  style={shockAmount === v
                    ? { background: "#8b5cf6", color: "#fff", borderColor: "transparent" }
                    : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                  }
                >{v.toLocaleString()} bn</button>
              ))}
            </div>
          </div>

          {sector ? (
            <div className="surface p-5 border-l-4" style={{ borderLeftColor: sector.color }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Sector</div>
              <div className="font-bold text-slate-800 leading-tight mb-0.5">{sector.name}</div>
              <div className="text-xs font-mono text-purple-500 mb-3">{sector.code}</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Multiplier", val: sector.mult.toFixed(3), color: "#8b5cf6" },
                  { label: "BL",         val: sector.bl.toFixed(3),   color: "#0d9488" },
                  { label: "FL",         val: sector.fl.toFixed(3),   color: "#f59e0b" },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 rounded-lg bg-slate-50">
                    <div className="text-sm font-black tabular-nums" style={{ color: m.color }}>{m.val}</div>
                    <div className="text-xs text-slate-400">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="surface p-5 text-center text-slate-400">
              <Zap size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a sector to run the simulation</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {shockResult && sector && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Output Impact", val: `+${totalImpact.toFixed(0)} bn UZS`, color: "#8b5cf6" },
              { label: "Output Multiplier",   val: `×${multiplierEst.toFixed(3)}`,      color: "#0d9488" },
              { label: "Sectors Affected",    val: `${shockResult.length}`,              color: "#f59e0b" },
            ].map(m => (
              <div key={m.label} className="surface p-4 text-center">
                <div className="text-xl font-black tabular-nums" style={{ color: m.color }}>{m.val}</div>
                <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="insight-positive">
            <div className="flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">⚡</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Shock Result</div>
                <p className="leading-relaxed text-sm">
                  A <strong>+{shockAmount.toLocaleString()} bn UZS</strong> final-demand shock to{" "}
                  <strong>{sector.name} ({sector.code})</strong> generates{" "}
                  <strong>+{totalImpact.toFixed(0)} bn UZS</strong> of additional economy-wide output
                  (multiplier = {multiplierEst.toFixed(3)}). Top impacted sectors:{" "}
                  {shockResult.slice(0, 3).map(d => `${d.name.slice(0, 20)} (${d.code})`).join(", ")}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Show top</span>
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setTopN(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  topN === n ? "bg-slate-800 text-white border-transparent" : "bg-white text-slate-500 border-slate-200"
                }`}>{n}</button>
            ))}
          </div>

          <div className="surface p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Production Impact by Sector — Δx = L · Δf
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Billion UZS additional output induced. Top {shockResult.length} most-impacted sectors.
            </p>
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart data={shockResult} layout="vertical"
                margin={{ top: 4, right: 80, bottom: 4, left: 220 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => `${v.toFixed(0)}bn`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={216}
                  tickLine={false}
                  axisLine={false}
                  tick={<CustomYTick />}
                />
                <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                <Tooltip content={<ShockTooltip shockAmount={shockAmount} />} />
                <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={14}
                  isAnimationActive animationDuration={500} cursor="default">
                  {shockResult.map(entry => (
                    <Cell key={entry.id}
                      fill={entry.id === selectedId ? "#8b5cf6" : entry.color}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function ShockTooltip({ active, payload, shockAmount }: {
  active?: boolean;
  payload?: { payload: { name: string; code: string; val: number; group: string } }[];
  shockAmount: number;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const share = (d.val / shockAmount * 100).toFixed(1);
  return (
    <div className="bg-white/98 rounded-xl border border-slate-200 px-4 py-3 shadow-xl text-xs max-w-72">
      <div className="font-bold text-slate-800 mb-0.5 leading-tight">{d.name}</div>
      <div className="font-mono text-purple-500 text-xs mb-2">{d.code} · {d.group}</div>
      <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
        <span className="text-slate-400">Output impact</span>
        <span className="font-black text-purple-600">+{d.val.toFixed(1)} bn UZS</span>
      </div>
      <div className="flex justify-between gap-4 mt-1">
        <span className="text-slate-400">Share of total shock</span>
        <span className="font-bold text-slate-600">{share}%</span>
      </div>
    </div>
  );
}

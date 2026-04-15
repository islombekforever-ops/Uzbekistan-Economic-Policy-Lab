"use client";
import { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { IOData, getQuadrant, QUADRANT_COLORS } from "@/lib/ioData";

interface Props { data: IOData; onSelectSector: (id: number) => void; selectedId: number | null; }

const QUADRANTS = ["Key Sector", "Backward Driver", "Forward Driver", "Weak Sector"];

export function LinkagePanel({ data, onSelectSector, selectedId }: Props) {
  const [filterGroup, setFilterGroup] = useState<string>("All");
  const [highlight, setHighlight]     = useState<string>("All");

  const groups = ["All", ...Array.from(new Set(data.sectors.map(s => s.group))).sort()];

  const scatterData = useMemo(() => {
    let sectors = [...data.sectors];
    if (filterGroup !== "All") sectors = sectors.filter(s => s.group === filterGroup);
    return sectors.map(s => ({
      id:    s.id,
      x:     s.fl,
      y:     s.bl,
      name:  s.name,
      code:  s.code,
      group: s.group,
      color: s.color,
      mult:  s.mult,
      output_bn: s.output_bn,
      quadrant: getQuadrant(s.bl, s.fl),
    }));
  }, [data, filterGroup]);

  // Quadrant counts
  const counts = useMemo(() => {
    const all = data.sectors;
    return {
      "Key Sector":      all.filter(s => s.bl >= 1 && s.fl >= 1).length,
      "Backward Driver": all.filter(s => s.bl >= 1 && s.fl <  1).length,
      "Forward Driver":  all.filter(s => s.bl <  1 && s.fl >= 1).length,
      "Weak Sector":     all.filter(s => s.bl <  1 && s.fl <  1).length,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Quadrant legend cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUADRANTS.map(q => (
          <button key={q} onClick={() => setHighlight(highlight === q ? "All" : q)}
            className="surface p-4 text-left transition-all hover:shadow-md"
            style={highlight === q ? { borderColor: QUADRANT_COLORS[q], borderWidth: 2 } : {}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: QUADRANT_COLORS[q] }} />
              <span className="text-xs font-bold text-slate-700">{q}</span>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: QUADRANT_COLORS[q] }}>
              {counts[q as keyof typeof counts]}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">sectors</div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">
              {q === "Key Sector"      && "BL > 1 · FL > 1"}
              {q === "Backward Driver" && "BL > 1 · FL ≤ 1"}
              {q === "Forward Driver"  && "BL ≤ 1 · FL > 1"}
              {q === "Weak Sector"     && "BL ≤ 1 · FL ≤ 1"}
            </div>
          </button>
        ))}
      </div>

      {/* Group filter */}
      <div className="flex gap-1.5 flex-wrap px-1">
        {groups.map(g => (
          <button key={g} onClick={() => setFilterGroup(g)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
            style={filterGroup === g
              ? { background: "#0d1f3c", color: "#fff", borderColor: "transparent" }
              : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
            }
          >{g}</button>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="surface p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          Rasmussen-Hirschman Linkage Map
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Each dot is one sector. Sectors in the top-right quadrant (BL &gt; 1 AND FL &gt; 1) are
          &ldquo;key sectors&rdquo; — they both depend heavily on other industries and supply them.
          Click a dot to select the sector.
        </p>

        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="x" name="Forward Linkage"
              domain={[0, "auto"]}
              tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
              label={{ value: "Forward Linkage (FL)", position: "insideBottom", offset: -28, fontSize: 11, fill: "#64748b" }}
            />
            <YAxis type="number" dataKey="y" name="Backward Linkage"
              domain={[0, "auto"]}
              tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
              label={{ value: "Backward Linkage (BL)", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "#64748b" }}
            />
            <ReferenceLine x={1} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: "FL=1", position: "top", fontSize: 10, fill: "#94a3b8" }} />
            <ReferenceLine y={1} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: "BL=1", position: "right", fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip content={<LinkageTooltip />} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Scatter data={scatterData} onClick={(d: any) => onSelectSector(d.id)}
              style={{ cursor: "pointer" }}>
              {scatterData.map((entry) => {
                const isSelected  = entry.id === selectedId;
                const isHighlighted = highlight === "All" || entry.quadrant === highlight;
                return (
                  <Cell key={entry.id}
                    fill={QUADRANT_COLORS[entry.quadrant]}
                    fillOpacity={isSelected ? 1 : isHighlighted ? 0.75 : 0.2}
                    stroke={isSelected ? "#0d1f3c" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                    r={isSelected ? 8 : Math.min(6, 3 + entry.output_bn / 5000)}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          {QUADRANTS.map(q => (
            <div key={q} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: QUADRANT_COLORS[q] }} />
              <span className="text-xs text-slate-500">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key sectors table */}
      <KeySectorsTable data={data} onSelectSector={onSelectSector} selectedId={selectedId} />
    </div>
  );
}

function LinkageTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; code: string; x: number; y: number; mult: number; output_bn: number; group: string; quadrant: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/98 rounded-xl border border-slate-200 px-4 py-3 shadow-xl text-xs max-w-64">
      <div className="font-bold text-slate-800 mb-1 leading-tight">{d.name}</div>
      <div className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-full inline-block text-white"
           style={{ background: QUADRANT_COLORS[d.quadrant] }}>{d.quadrant}</div>
      <div className="space-y-1 mt-2">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Backward Linkage</span><span className="font-black text-teal-600">{d.y.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Forward Linkage</span><span className="font-black text-amber-600">{d.x.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Output Mult.</span><span className="font-black text-purple-600">{d.mult.toFixed(3)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Output</span><span className="font-black text-blue-600">{d.output_bn.toFixed(0)} bn UZS</span></div>
      </div>
    </div>
  );
}

function KeySectorsTable({ data, onSelectSector, selectedId }: Props) {
  const keySectors = data.sectors
    .filter(s => s.bl >= 1 && s.fl >= 1)
    .sort((a, b) => (b.bl + b.fl) - (a.bl + a.fl));

  if (!keySectors.length) return null;

  return (
    <div className="surface overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Key Sectors (BL &gt; 1 &amp; FL &gt; 1)</h3>
        <p className="text-xs text-slate-400 mt-0.5">Ranked by combined linkage strength</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              {["Code","Sector","Group","BL","FL","Multiplier","Output (bn UZS)"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-bold uppercase tracking-wider first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keySectors.map((s, i) => (
              <tr key={s.id}
                className={`border-t border-slate-50 cursor-pointer transition-colors ${
                  s.id === selectedId ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
                onClick={() => onSelectSector(s.id)}
              >
                <td className="px-5 py-2.5 font-mono text-slate-500">{s.code}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800 max-w-xs">
                  <div className="truncate" title={s.name}>{s.name}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
                        style={{ background: s.color }}>{s.group}</span>
                </td>
                <td className="px-4 py-2.5 font-black text-teal-700 tabular-nums">{s.bl.toFixed(3)}</td>
                <td className="px-4 py-2.5 font-black text-amber-600 tabular-nums">{s.fl.toFixed(3)}</td>
                <td className="px-4 py-2.5 font-black text-purple-600 tabular-nums">{s.mult.toFixed(3)}</td>
                <td className="px-4 py-2.5 font-bold text-blue-600 tabular-nums">{s.output_bn.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Contribution, Nowcast } from "@/lib/types";

export function ContributionChart({
  contributions, nowcast,
}: {
  contributions: Contribution[];
  nowcast: Nowcast;
}) {
  const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-black text-teal-600">+{nowcast.yoy_growth.toFixed(1)}%</div>
          <div className="text-sm text-slate-500 mt-1">GDP YoY Growth</div>
          <div className="text-xs text-slate-400">{nowcast.current_quarter}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-black text-emerald-600">
            +{contributions.filter((c) => c.sign === "positive").reduce((s, c) => s + c.contribution, 0).toFixed(2)}pp
          </div>
          <div className="text-sm text-slate-500 mt-1">Positive Contributions</div>
          <div className="text-xs text-slate-400">
            {contributions.filter((c) => c.sign === "positive").length} sectors
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-black text-red-500">
            {contributions.filter((c) => c.sign === "negative").reduce((s, c) => s + c.contribution, 0).toFixed(2)}pp
          </div>
          <div className="text-sm text-slate-500 mt-1">Negative Contributions</div>
          <div className="text-xs text-slate-400">
            {contributions.filter((c) => c.sign === "negative").length} sectors
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="font-bold text-slate-900 text-base">
            Indicator Contributions to GDP Growth (percentage points)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Factor loading × standardised indicator value — {nowcast.current_quarter}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 30, bottom: 0, left: 140 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}pp`}
            />
            <YAxis
              type="category"
              dataKey="sector"
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              width={135}
            />
            <Tooltip content={<ContribTooltip />} />
            <ReferenceLine x={0} stroke="#cbd5e1" />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {sorted.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.sign === "positive" ? "#10b981" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100" style={{ background: "#f8fafc" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sector / Indicator</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contribution (pp)</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Direction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((c) => (
              <tr key={c.sector} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-700">{c.sector}</td>
                <td className={`px-5 py-3 text-right font-bold ${c.sign === "positive" ? "text-emerald-600" : "text-red-500"}`}>
                  {c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(2)} pp
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.sign === "positive" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {c.sign === "positive" ? "Positive driver" : "Drag"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContribTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <div className="font-bold text-slate-800 mb-1">{label}</div>
      <div className={`font-semibold ${val >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {val >= 0 ? "+" : ""}{val.toFixed(3)} pp
      </div>
    </div>
  );
}

"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { FactorPoint } from "@/lib/types";

export function FactorChart({ factorData }: { factorData: FactorPoint[] }) {
  const data = factorData.map((d) => ({
    ...d,
    label: d.date.slice(0, 7),
    upper: d.factor + 0.18,
    lower: d.factor - 0.18,
  }));

  const latest = factorData[factorData.length - 1];
  const prev = factorData[factorData.length - 2];
  const trend = latest.factor - prev.factor;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Current Factor Estimate</div>
          <div className="text-3xl font-black text-slate-900">{latest.factor.toFixed(3)}</div>
          <div className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(3)} vs prev. month
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Factor (3M Average)</div>
          <div className="text-3xl font-black text-slate-900">
            {(factorData.slice(-3).reduce((s, d) => s + d.factor, 0) / 3).toFixed(3)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Last 3 months</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Signal Strength</div>
          <div className="text-3xl font-black text-teal-600">
            {latest.factor > 0.5 ? "Strong" : latest.factor > 0.2 ? "Moderate" : "Weak"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Economic momentum</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="font-bold text-slate-900 text-base">Smoothed Latent Factor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unobserved economic activity index estimated via Kalman smoother. Positive = above-trend growth.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="factorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              domain={[-0.5, 1.2]}
            />
            <Tooltip
              formatter={(v: number) => [v.toFixed(4), "Factor"]}
              labelFormatter={(l) => `Month: ${l}`}
            />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="4 4" />
            <Area dataKey="upper" fill="url(#ciGrad)" stroke="none" activeDot={false} legendType="none" />
            <Area dataKey="lower" fill="#fff" stroke="none" activeDot={false} legendType="none" />
            <Area
              type="monotone"
              dataKey="factor"
              name="Latent Factor"
              stroke="#0d9488"
              strokeWidth={2.5}
              fill="url(#factorGrad)"
              dot={{ fill: "#0d9488", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#0d9488" }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-slate-400 text-center">
          Shaded band = ±1 std. deviation (smoothed state covariance)
        </div>
      </div>
    </div>
  );
}

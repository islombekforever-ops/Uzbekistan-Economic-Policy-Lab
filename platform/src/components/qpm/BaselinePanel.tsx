"use client";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { solveBaseline, QPMParams, BaselineInit } from "@/lib/qpmSolver";

const CHARTS = [
  { key: "pi",  label: "YoY Inflation (%)",   color: "#ef4444", refKey: "tar"    },
  { key: "rs",  label: "Policy Rate (%)",      color: "#0d1f3c", refKey: null     },
  { key: "gap", label: "Output Gap (%)",        color: "#3b82f6", refKey: "zero"  },
  { key: "dep", label: "NER Depreciation (%)", color: "#f59e0b", refKey: null     },
];

export function BaselinePanel({ params }: { params: QPMParams }) {
  const [init, setInit] = useState<BaselineInit>({
    pi0:  11.0,
    rs0:  13.5,
    gap0: -1.5,
    dep0:  8.0,
  });

  const result = useMemo(
    () => solveBaseline(init, params, 16),
    [init, params]
  );

  const chartData = result.quarters.map((_, i) => ({
    q: `Q${i}`,
    pi:  result.pi[i],
    rs:  result.rs[i],
    gap: result.gap[i],
    dep: result.dep[i],
  }));

  // KPIs
  const avg = (arr: number[], from: number, to: number) =>
    arr.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);

  const kpis = [
    { label: "Avg Inflation (Yr 2)", value: avg(result.pi, 4, 8).toFixed(1) + "%",  color: "#ef4444" },
    { label: "Policy Rate (Q8)",     value: (result.rs[7] ?? 0).toFixed(1) + "%",   color: "#0d1f3c" },
    { label: "Output Gap (Q8)",      value: (result.gap[7] ?? 0).toFixed(2) + "%",  color: "#3b82f6" },
    { label: "NER Deprec. (Q8)",     value: (result.dep[7] ?? 0).toFixed(1) + "%",  color: "#f59e0b" },
  ];

  const inputCls = `w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold
                    focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500`;

  return (
    <div className="space-y-5">
      {/* Initial conditions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Initial Conditions — Current State of Uzbekistan Economy
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField
            label="YoY Inflation π₀ (%)"
            value={init.pi0}
            onChange={(v) => setInit({ ...init, pi0: v })}
            min={0} max={30} step={0.5}
            color="#ef4444"
            hint="e.g. current CPI YoY"
          />
          <InputField
            label="Policy Rate RS₀ (%)"
            value={init.rs0}
            onChange={(v) => setInit({ ...init, rs0: v })}
            min={0} max={30} step={0.5}
            color="#0d1f3c"
            hint="e.g. CBU repo rate"
          />
          <InputField
            label="Output Gap (%)"
            value={init.gap0}
            onChange={(v) => setInit({ ...init, gap0: v })}
            min={-10} max={10} step={0.5}
            color="#3b82f6"
            hint="negative = recession"
          />
          <InputField
            label="NER Depreciation (%)"
            value={init.dep0}
            onChange={(v) => setInit({ ...init, dep0: v })}
            min={0} max={40} step={1}
            color="#f59e0b"
            hint="UZS/USD YoY change"
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Target line info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex gap-2 items-start">
        <span className="text-base">ℹ️</span>
        <span>
          Dashed lines show steady-state targets: inflation target{" "}
          <strong>π* = {params.tar.toFixed(1)}%</strong>, neutral real rate{" "}
          <strong>r̄ = {params.rrbar.toFixed(1)}%</strong>. Adjust initial conditions or parameters
          to simulate different policy scenarios.
        </span>
      </div>

      {/* 4 charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHARTS.map((c) => {
          const refVal = c.refKey === "tar" ? params.tar : c.refKey === "zero" ? 0 : null;
          return (
            <div key={c.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-700 mb-4">{c.label}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="q"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(2)}%`, c.label]}
                    labelFormatter={(l) => `Horizon: ${l}`}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  {refVal !== null && (
                    <ReferenceLine
                      y={refVal}
                      stroke={c.color}
                      strokeDasharray="6 3"
                      strokeOpacity={0.5}
                      label={{ value: `Target: ${refVal}%`, fill: c.color, fontSize: 10, position: "right" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={c.key}
                    stroke={c.color}
                    strokeWidth={2.5}
                    dot={{ fill: c.color, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, min, max, step, color, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; color: string; hint: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={(e) => onChange(+e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold
                     focus:outline-none focus:ring-2 focus:border-current"
          style={{ color }}
        />
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1 mt-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

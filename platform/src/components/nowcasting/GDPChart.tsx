"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area,
} from "recharts";
import { HistoricalGDP, Forecast, Nowcast } from "@/lib/types";

interface ChartPoint {
  quarter: string;
  yoy: number | null;
  yoy_forecast: number | null;
  upper: number | null;
  lower: number | null;
  type: "historical" | "nowcast" | "forecast";
}

export function GDPChart({
  historical, forecast, nowcast,
}: {
  historical: HistoricalGDP[];
  forecast: Forecast[];
  nowcast: Nowcast;
}) {
  // Last 12 quarters of history + nowcast + forecasts
  const hist = historical.slice(-12);

  const data: ChartPoint[] = [
    ...hist.map((h, i) => ({
      quarter: h.quarter,
      yoy: h.yoy,
      yoy_forecast: null,
      upper: null,
      lower: null,
      type: "historical" as const,
    })),
    {
      quarter: nowcast.current_quarter,
      yoy: null,
      yoy_forecast: nowcast.yoy_growth,
      upper: nowcast.uncertainty.yoy_upper,
      lower: nowcast.uncertainty.yoy_lower,
      type: "nowcast",
    },
    ...forecast.map((f) => ({
      quarter: f.quarter,
      yoy: null,
      yoy_forecast: f.yoy_growth,
      upper: null,
      lower: null,
      type: "forecast" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* YoY chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Real GDP Growth — Year-on-Year (%)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Last 12 quarters · nowcast · 2-quarter forecast · 95% confidence band
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#0d9488" }} />
              Historical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#f97316" }} />
              Nowcast / Forecast
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 9]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#e2e8f0" />

            {/* Confidence area for nowcast */}
            <Area
              dataKey="upper"
              fill="#0d9488"
              fillOpacity={0.12}
              stroke="none"
              activeDot={false}
              legendType="none"
            />
            <Area
              dataKey="lower"
              fill="#fff"
              fillOpacity={1}
              stroke="none"
              activeDot={false}
              legendType="none"
            />

            {/* Historical bars */}
            <Bar
              dataKey="yoy"
              name="Historical YoY"
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />

            {/* Forecast bars */}
            <Bar
              dataKey="yoy_forecast"
              name="Nowcast / Forecast"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              opacity={0.85}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* QoQ chart */}
      <QoQChart historical={historical} forecast={forecast} nowcast={nowcast} />
    </div>
  );
}

function QoQChart({
  historical, forecast, nowcast,
}: {
  historical: HistoricalGDP[];
  forecast: Forecast[];
  nowcast: Nowcast;
}) {
  const hist = historical.slice(-12);
  const data = [
    ...hist.map((h) => ({ quarter: h.quarter, qoq: h.qoq, qoq_fc: null })),
    { quarter: nowcast.current_quarter, qoq: null, qoq_fc: nowcast.qoq_growth },
    ...forecast.map((f) => ({ quarter: f.quarter, qoq: null, qoq_fc: f.qoq_growth })),
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="font-bold text-slate-900 text-base">Real GDP Growth — Quarter-on-Quarter (%)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Seasonally adjusted</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="quarter"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[-2, 3]}
          />
          <Tooltip formatter={(v: number) => [`${v?.toFixed(2)}%`]} />
          <ReferenceLine y={0} stroke="#e2e8f0" />
          <Bar dataKey="qoq" name="Historical QoQ" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="qoq_fc" name="Forecast QoQ" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.85} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <div className="font-bold text-slate-800 mb-2">{label}</div>
      {payload.map((p: any) => (
        p.value !== null && (
          <div key={p.name} className="flex justify-between gap-4">
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-semibold" style={{ color: p.fill || p.color }}>
              {p.value?.toFixed(2)}%
            </span>
          </div>
        )
      ))}
    </div>
  );
}

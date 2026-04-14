"use client";
import { IntlForecast } from "@/lib/types";

export function ComparisonTable({ forecasts }: { forecasts: IntlForecast[] }) {
  const maxVal = Math.max(...forecasts.map((f) => f.forecast));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100" style={{ background: "#f8fafc" }}>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Organisation
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {forecasts[0].year} Forecast
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
              {forecasts[0].year2} Forecast
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
              Comparison
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {forecasts.map((f, i) => {
            const isOurs = f.org.includes("DFM");
            const barW = (f.forecast / maxVal) * 100;
            return (
              <tr
                key={f.org}
                className={`${isOurs ? "bg-teal-50" : "hover:bg-slate-50"} transition-colors`}
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    {isOurs && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    )}
                    <span className={`font-medium ${isOurs ? "text-teal-700" : "text-slate-700"}`}>
                      {f.org}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`text-base font-bold ${isOurs ? "text-teal-600" : "text-slate-800"}`}
                  >
                    {f.forecast.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center hidden md:table-cell">
                  {f.forecast2 !== null ? (
                    <span className="text-slate-600 font-medium">{f.forecast2.toFixed(1)}%</span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-3.5 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${barW}%`,
                          background: isOurs ? "#0d9488" : "#94a3b8",
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8">{f.forecast.toFixed(1)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

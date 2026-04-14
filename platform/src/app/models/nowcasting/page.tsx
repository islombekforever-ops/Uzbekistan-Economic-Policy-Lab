"use client";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { NowcastHeader } from "@/components/nowcasting/NowcastHeader";
import { GDPChart } from "@/components/nowcasting/GDPChart";
import { ContributionChart } from "@/components/nowcasting/ContributionChart";
import { FactorChart } from "@/components/nowcasting/FactorChart";
import { IndicatorsGrid } from "@/components/nowcasting/IndicatorsGrid";
import { DiagnosticsPanel } from "@/components/nowcasting/DiagnosticsPanel";
import { MethodologyNote } from "@/components/nowcasting/MethodologyNote";
import nowcastRaw from "../../../../public/data/nowcast.json";
import { NowcastData } from "@/lib/types";

const data = nowcastRaw as NowcastData;

const TABS = [
  { id: "overview",       label: "Overview" },
  { id: "decomposition",  label: "Growth Decomposition" },
  { id: "factor",         label: "Latent Factor" },
  { id: "indicators",     label: "Indicators" },
  { id: "diagnostics",    label: "Diagnostics" },
  { id: "methodology",    label: "Methodology" },
];

export default function NowcastingPage() {
  const [tab, setTab] = useState("overview");

  return (
    <PageShell>
      {/* Page header */}
      <div
        className="px-6 lg:px-10 py-8 border-b border-slate-200"
        style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)" }}
      >
        <NowcastHeader nowcast={data.nowcast} metadata={data.metadata} forecast={data.forecast} />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-10">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 lg:px-10 py-8 space-y-8 animate-fade-in">
        {tab === "overview" && (
          <>
            <GDPChart
              historical={data.historical_gdp}
              forecast={data.forecast}
              nowcast={data.nowcast}
            />
          </>
        )}

        {tab === "decomposition" && (
          <ContributionChart contributions={data.contributions} nowcast={data.nowcast} />
        )}

        {tab === "factor" && (
          <FactorChart factorData={data.factor_data} />
        )}

        {tab === "indicators" && (
          <IndicatorsGrid indicators={data.indicators} />
        )}

        {tab === "diagnostics" && (
          <DiagnosticsPanel metadata={data.metadata} />
        )}

        {tab === "methodology" && (
          <MethodologyNote metadata={data.metadata} />
        )}
      </div>
    </PageShell>
  );
}

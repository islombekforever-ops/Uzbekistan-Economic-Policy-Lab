"use client";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { IOHeader } from "@/components/io/IOHeader";
import { MultiplierPanel } from "@/components/io/MultiplierPanel";
import { LinkagePanel } from "@/components/io/LinkagePanel";
import { ShockPanel } from "@/components/io/ShockPanel";
import { MethodologyIO } from "@/components/io/MethodologyIO";
import { IOData } from "@/lib/ioData";

const TABS = [
  { id: "multipliers", label: "Multipliers & Rankings" },
  { id: "linkages",    label: "Linkage Map" },
  { id: "shock",       label: "Shock Simulator" },
  { id: "method",      label: "Methodology" },
];

export default function IOPage() {
  const [data, setData]           = useState<IOData | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [tab, setTab]             = useState("multipliers");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/io_data.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<IOData>;
      })
      .then(setData)
      .catch(e => setError(String(e)));
  }, []);

  if (error) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <p className="font-bold">Failed to load I-O data</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Run extract_io.py to generate io_data.json</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-slate-400">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading 136-sector I-O data…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const handleSelectSector = (id: number) => {
    setSelectedId(prev => prev === id ? null : id);
    // Auto-switch to shock tab if user clicks sector
    if (tab === "multipliers" || tab === "linkages") setTab("shock");
  };

  const handleSelectAndStay = (id: number) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <PageShell>
      {/* Header */}
      <div
        className="px-6 lg:px-10 py-8 border-b border-slate-200"
        style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 40%, #1e1b4b 100%)" }}
      >
        <IOHeader data={data} />
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-purple-500 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Selected sector badge */}
        {selectedId !== null && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400">Selected:</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                  style={{ background: data.sectors[selectedId].color }}>
              {data.sectors[selectedId].code}
            </span>
            <button onClick={() => setSelectedId(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5">✕</button>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="px-6 lg:px-10 py-6">
        {tab === "multipliers" && (
          <MultiplierPanel data={data} onSelectSector={handleSelectAndStay} selectedId={selectedId} />
        )}
        {tab === "linkages" && (
          <LinkagePanel data={data} onSelectSector={handleSelectAndStay} selectedId={selectedId} />
        )}
        {tab === "shock" && (
          <ShockPanel data={data} selectedId={selectedId} onSelectSector={setSelectedId} />
        )}
        {tab === "method" && (
          <MethodologyIO />
        )}
      </div>
    </PageShell>
  );
}

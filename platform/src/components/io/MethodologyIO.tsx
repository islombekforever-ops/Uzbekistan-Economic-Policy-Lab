"use client";

export function MethodologyIO() {
  return (
    <div className="space-y-6 max-w-3xl">

      <div className="surface p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Input-Output Framework</h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            The Leontief Input-Output model represents inter-industry flows in an economy.
            The <strong>transaction matrix Z</strong> (136×136) records monetary flows from each
            producing sector (row) to each using sector (column) in million UZS.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-700 space-y-2">
            <div><span className="text-purple-600 font-bold">A[i,j]</span> = Z[i,j] / x[j] &nbsp;&nbsp;(technical coefficients)</div>
            <div><span className="text-teal-600 font-bold">L</span> = (I − A)⁻¹ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Leontief inverse)</div>
            <div><span className="text-amber-600 font-bold">Δx</span> = L · Δf &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(shock simulation)</div>
          </div>
          <p>
            <strong>Technical coefficients A[i,j]</strong> represent the input from sector i
            needed per unit of output of sector j. The <strong>Leontief inverse L = (I−A)⁻¹</strong>
            captures both direct and all indirect supply-chain effects.
          </p>
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Rasmussen-Hirschman Linkages</h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
              <div className="font-bold text-teal-700 mb-2">Backward Linkage (BL)</div>
              <div className="font-mono text-xs text-teal-600 mb-2">BL[j] = (1/N · Σᵢ L[i,j]) / (1/N² · ΣΣ L)</div>
              <p className="text-xs text-teal-700">
                Measures how much sector j pulls demand from upstream suppliers.
                BL &gt; 1 = above-average backward demand.
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="font-bold text-amber-700 mb-2">Forward Linkage (FL)</div>
              <div className="font-mono text-xs text-amber-600 mb-2">FL[i] = (1/N · Σⱼ L[i,j]) / (1/N² · ΣΣ L)</div>
              <p className="text-xs text-amber-700">
                Measures how much sector i supplies to downstream users.
                FL &gt; 1 = above-average forward supply.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="font-bold text-slate-700 mb-3">Sector Classification (Quadrant Analysis)</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Key Sector", cond: "BL > 1 AND FL > 1", color: "#0d9488",
                  desc: "Strong upstream and downstream links. Strategic for economic development." },
                { label: "Backward Driver", cond: "BL > 1 AND FL ≤ 1", color: "#3b82f6",
                  desc: "Pulls strongly from suppliers but weak forward supply. E.g. construction." },
                { label: "Forward Driver", cond: "BL ≤ 1 AND FL > 1", color: "#f59e0b",
                  desc: "Strong supply to other sectors. E.g. energy, basic materials." },
                { label: "Weak Sector", cond: "BL ≤ 1 AND FL ≤ 1", color: "#94a3b8",
                  desc: "Below-average links in both directions. Relatively self-contained." },
              ].map(q => (
                <div key={q.label} className="rounded-lg p-3 border border-slate-200 bg-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                    <span className="font-bold text-slate-700">{q.label}</span>
                  </div>
                  <div className="font-mono text-slate-400 mb-1">{q.cond}</div>
                  <div className="text-slate-500">{q.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Data &amp; Calibration</h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Source", value: "Uzbekistan Statistical Committee" },
              { label: "Table", value: "TZV 2022 136×136 I-O table" },
              { label: "Classification", value: "NACE Rev.2 (136 activities)" },
              { label: "Units", value: "Million UZS (current prices 2022)" },
              { label: "Year", value: "2022" },
              { label: "Sectors", value: "136 (A01 agriculture to S96 services)" },
            ].map(r => (
              <div key={r.label} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 text-xs mb-0.5">{r.label}</span>
                <span className="font-semibold text-slate-700">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="insight-warning flex gap-2 items-start mt-4">
            <span className="text-base flex-shrink-0">⚠️</span>
            <span className="text-xs">
              Ten sectors with data quality issues (column sum of Z exceeding reported gross output)
              were corrected by setting minimum value added at 15% of intermediate inputs.
              This does not materially affect multipliers for the remaining 126 well-behaved sectors.
              Sector names are in Russian per the original StatCom publication.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

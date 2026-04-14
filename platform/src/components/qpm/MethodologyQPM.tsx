"use client";
import { QPMParams } from "@/lib/qpmSolver";

export function MethodologyQPM({ params }: { params: QPMParams }) {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Model Overview</h2>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            The <strong>Quarterly Projection Model (QPM)</strong> is a New Keynesian semi-structural
            DSGE model designed for monetary policy analysis at the Central Bank of Uzbekistan (CBU).
            It follows the IMF/IRFS Toolbox standard widely used by central banks in emerging markets.
          </p>
          <p>
            The model describes the joint dynamics of four core macroeconomic variables —
            <strong> output gap</strong>, <strong>inflation</strong>,
            <strong> policy interest rate</strong>, and <strong>exchange rate</strong> —
            linked through structural behavioural equations. All shocks drive temporary deviations
            from their steady-state paths.
          </p>
        </div>
      </div>

      {/* Equations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-5">Structural Equations</h2>
        <div className="space-y-5">
          <EqBlock
            title="IS Curve — Aggregate Demand"
            color="#3b82f6"
            eq="ỹₜ = b₁·ỹₜ₋₁ − b₂·MCIₜ + b₃·ỹ*ₜ + ε_gap"
            sub="MCIₜ = b₄·r̃ₜ − (1−b₄)·z̃ₜ"
            params={[
              { p: "b₁", v: params.b1.toFixed(2), desc: "Output gap persistence" },
              { p: "b₂", v: params.b2.toFixed(2), desc: "Monetary transmission elasticity" },
              { p: "b₃", v: params.b3.toFixed(2), desc: "External demand spillover" },
              { p: "b₄", v: params.b4.toFixed(2), desc: "Interest rate share in MCI" },
            ]}
            note="Weak monetary transmission (b₂=0.2) reflects shallow, partly dollarised Uzbek financial markets."
          />
          <EqBlock
            title="Phillips Curve — Hybrid Inflation"
            color="#ef4444"
            eq="πₜ = a₁·πₜ₋₁ + (1−a₁)·Eₜπₜ₊₁ + a₂·RMCₜ + ε_π"
            sub="RMCₜ = a₃·ỹₜ + (1−a₃)·z̃ₜ"
            params={[
              { p: "a₁", v: params.a1.toFixed(2), desc: "Backward-looking inflation weight" },
              { p: "a₂", v: params.a2.toFixed(2), desc: "Marginal cost pass-through" },
              { p: "a₃", v: params.a3.toFixed(2), desc: "Domestic vs import cost share" },
            ]}
            note="High a₁=0.6 indicates inflation expectations are only partially anchored — consistent with Uzbekistan's disinflation history."
          />
          <EqBlock
            title="Taylor Rule — Monetary Policy"
            color="#0d9488"
            eq="iₜ = g₁·iₜ₋₁ + (1−g₁)·[Eₜπₜ₊₁ + g₂·(π̄₄ₜ₊₄ − π*) + g₃·ỹₜ] + ε_i"
            sub="Taylor principle satisfied: g₂ = 1.5 > 1"
            params={[
              { p: "g₁", v: params.g1.toFixed(2), desc: "Rate smoothing (inertia)" },
              { p: "g₂", v: params.g2.toFixed(2), desc: "Inflation response coefficient" },
              { p: "g₃", v: params.g3.toFixed(2), desc: "Output gap response coefficient" },
            ]}
            note="The rule is forward-looking — targets 4Q-ahead inflation π̄₄. Rate smoothing g₁=0.8 prevents excessive volatility."
          />
          <EqBlock
            title="Uncovered Interest Parity (UIP) — Exchange Rate"
            color="#f59e0b"
            eq="sₜ = (1−e₁)·Eₜsₜ₊₁ + e₁·sₜ₋₁ − iₜ/4 + ε_s"
            sub="z̃ₜ = sₜ + p*ₜ − pₜ − z̄ₜ (real exchange rate gap)"
            params={[
              { p: "e₁", v: params.e1.toFixed(2), desc: "Backward-looking UIP weight" },
            ]}
            note="High e₁=0.7 captures exchange rate inertia — UZS adjusts gradually due to legacy capital controls and thin FX market."
          />
        </div>
      </div>

      {/* Steady-state */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Steady-State Values</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Inflation target π*", value: `${params.tar.toFixed(1)}%`, note: "CBU medium-term target" },
            { label: "Neutral real rate r̄", value: `${params.rrbar.toFixed(1)}%`, note: "Structural equilibrium rate" },
            { label: "Potential growth ȳ",  value: `${params.gdpbar.toFixed(1)}%`, note: "TFP + demographic trend" },
            { label: "Real appreciation",    value: "−1.0% pa", note: "Balassa-Samuelson effect" },
            { label: "Foreign inflation",    value: "2.5%",      note: "Trading-partner average" },
            { label: "Foreign real rate",    value: "1.0%",      note: "US/EU neutral rate" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Software */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Software & Estimation</h2>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            Model parameters were calibrated using the <strong>IRIS Toolbox</strong> (MATLAB),
            the standard toolkit for central bank projections (used by IMF, ECB, NBP, NBK, etc.).
            Unobservable variables (output gap, trend real rate, real exchange rate trend) are
            estimated via <strong>Kalman filter and fixed-interval smoother</strong>.
          </p>
          <p>
            The interactive platform re-implements the IRIS rational-expectations solver as a
            client-side <strong>Gauss-Seidel iterative algorithm</strong> in TypeScript.
            Convergence is confirmed when all endogenous variables change by less than 10⁻¹⁰
            between iterations. The solver typically converges in under 50 iterations.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Estimation", value: "Kalman Filter (IRIS)" },
            { label: "Solver",     value: "Gauss-Seidel (JS)" },
            { label: "Data",       value: "2016Q1–2025Q4" },
            { label: "Frequency",  value: "Quarterly" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 w-24 flex-shrink-0">{r.label}:</span>
              <span className="font-semibold text-slate-700">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EqBlock({
  title, color, eq, sub, params, note,
}: {
  title: string; color: string; eq: string; sub: string;
  params: { p: string; v: string; desc: string }[];
  note: string;
}) {
  return (
    <div className="border-l-4 pl-4" style={{ borderColor: color }}>
      <div className="text-sm font-bold mb-2" style={{ color }}>{title}</div>
      <div className="font-mono text-sm bg-slate-50 rounded-lg px-4 py-2.5 text-slate-800 mb-2">
        {eq}
      </div>
      {sub && (
        <div className="font-mono text-xs text-slate-500 px-4 mb-3">{sub}</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        {params.map((p) => (
          <div key={p.p} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2">
            <div className="font-mono font-bold" style={{ color }}>
              {p.p} = {p.v}
            </div>
            <div className="text-slate-400 mt-0.5 leading-snug">{p.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 italic">{note}</p>
    </div>
  );
}

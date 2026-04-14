"use client";
import { CGEParams } from "@/lib/cgeSolver";

export function MethodologyCGE({ params }: { params: CGEParams }) {
  return (
    <div className="max-w-3xl space-y-6">

      {/* Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Model Overview</h2>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            The <strong>1-2-3 CGE model</strong> (Devarajan, Lewis & Robinson, 1990) is a
            single-country, two-sector computable general equilibrium model widely used by
            the IMF and World Bank for trade and fiscal policy analysis in developing economies.
            It is calibrated to the <strong>Uzbekistan Social Accounting Matrix (SAM)</strong> for 2022.
          </p>
          <p>
            The model features <strong>one country</strong> (Uzbekistan),{" "}
            <strong>two goods</strong> (composite domestic/import good Q, and GDP Y),
            and <strong>three agents</strong> (households, firms, government). The "1-2-3"
            name reflects this structure. Trade is modelled using Armington import
            aggregation and CET export transformation.
          </p>
        </div>
      </div>

      {/* SAM calibration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">
          Social Accounting Matrix — Uzbekistan 2022
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            { label: "GDP (nominal)",     value: "~$80 bn",    note: "Current USD" },
            { label: "Private consumption", value: `${(params.sc * 100).toFixed(0)}% of GDP`, note: "SAM share" },
            { label: "Investment",         value: `${(params.si * 100).toFixed(0)}% of GDP`, note: "SAM share" },
            { label: "Government",         value: `${(params.sg * 100).toFixed(0)}% of GDP`, note: "SAM share" },
            { label: "Exports",            value: `${(params.sx * 100).toFixed(0)}% of GDP`, note: "SAM share" },
            { label: "Imports",            value: `${(params.sm * 100).toFixed(0)}% of GDP`, note: "SAM share" },
            { label: "Gold exports",       value: `${(params.sx_gold * 100).toFixed(0)}% of GDP`, note: "≈ $16bn" },
            { label: "Avg import tariff",  value: `${(params.tm * 100).toFixed(1)}%`, note: "Base tm" },
            { label: "Domestic good share", value: `${((1 - params.sx) * 100).toFixed(0)}%`, note: "1 − sx" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <div className="text-lg font-black text-slate-900">{s.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 italic">
          SAM calibrated from IMF Article IV data, State Statistics Committee of
          Uzbekistan, and CEER research. All accounts are in constant 2022 USD.
        </p>
      </div>

      {/* Core equations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-5">Structural Equations</h2>
        <div className="space-y-5">

          <EqBlock
            title="CES Armington Aggregation (Imports)"
            color="#f59e0b"
            eq={`Q = A_Q · [δ·D^{(σ−1)/σ} + (1−δ)·M^{(σ−1)/σ}]^{σ/(σ−1)}`}
            sub="Johansen form:  m̂ − d̂ = −σ·(p̂_M − p̂_D)"
            params={[
              { p: "σ", v: params.sigma.toFixed(1), desc: "Substitution elasticity" },
              { p: "β", v: (params.sm * 100).toFixed(0) + "%", desc: "Import share of Q" },
            ]}
            note={`High σ (${params.sigma}) = households can easily switch from imports to domestic goods when tariffs rise.`}
          />

          <EqBlock
            title="CET Transformation (Exports)"
            color="#0d9488"
            eq={`Y = A_Y · [φ·D^{(η+1)/η} + (1−φ)·X^{(η+1)/η}]^{η/(η+1)}`}
            sub="Johansen form:  x̂ − d̂ = η·(p̂_X − p̂_D)"
            params={[
              { p: "η", v: params.eta.toFixed(1), desc: "Transformation elasticity" },
              { p: "α", v: (params.sx * 100).toFixed(0) + "%", desc: "Export share of GDP" },
            ]}
            note={`CET allows producers to shift output between domestic and export markets. η=${params.eta} reflects moderate supply flexibility.`}
          />

          <EqBlock
            title="Trade Balance Closure"
            color="#3b82f6"
            eq="p̂_X* + x̂ + ê = p̂_M* + m̂ + τ̂"
            sub="(Balanced payments; τ̂ = d[log(1+tm)] is log-tariff change)"
            params={[
              { p: "ê", v: "endogenous", desc: "Exchange rate adj." },
              { p: "τ̂", v: "exogenous", desc: "Tariff log-change" },
            ]}
            note="The exchange rate ê is the equilibrating variable: it adjusts to restore trade balance after any shock."
          />

          <EqBlock
            title="Johansen Solution — Tariff Shock"
            color="#8b5cf6"
            eq="ê = (1−σ) / (η+σ+1) · τ̂"
            sub={`With σ=${params.sigma}, η=${params.eta}: ê ≈ ${((1 - params.sigma) / (params.eta + params.sigma + 1)).toFixed(3)} · τ̂`}
            params={[
              { p: "ê", v: `${((1 - params.sigma) / (params.eta + params.sigma + 1)).toFixed(3)}·τ̂`, desc: "Exchange rate" },
              { p: "x̂", v: `${((1 - params.sx) * params.eta * (1 - params.sigma) / (params.eta + params.sigma + 1)).toFixed(3)}·τ̂`, desc: "Export response" },
            ]}
            note={`With σ>${1}: tariff rise → imports fall sharply → trade surplus → exchange rate APPRECIATES (ê < 0). This compresses export competitiveness.`}
          />

          <EqBlock
            title="Keynesian Open-Economy Multiplier (Demand shocks)"
            color="#ec4899"
            eq="K = 1 / (1 − sc + sm)"
            sub={`K = 1/(1 − ${params.sc} + ${params.sm}) = ${(1 / (1 - params.sc + params.sm)).toFixed(2)}`}
            params={[
              { p: "K", v: (1 / (1 - params.sc + params.sm)).toFixed(2), desc: "Multiplier" },
              { p: "sc", v: params.sc.toFixed(2), desc: "Marginal propensity to consume" },
              { p: "sm", v: params.sm.toFixed(2), desc: "Import propensity" },
            ]}
            note="Investment and government spending shocks propagate through the Keynesian multiplier. Import leakage (sm) and saving (1−sc) reduce the multiplier below 1/(1−sc)."
          />
        </div>
      </div>

      {/* Solution method */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Solution Method</h2>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            The platform implements the <strong>Johansen (1960) percentage-change
            linearisation</strong> of the non-linear CGE system. This replaces
            the original equations with a linear system <strong>A·dz = B·dx</strong>
            where dz are endogenous % changes and dx are exogenous shocks. The
            solution is a closed-form matrix inverse valid for small perturbations (≤10%).
          </p>
          <p>
            Trade shocks (tariffs, export price) are solved under the
            <strong> full-employment assumption</strong> (ŷ_real = 0): production
            reallocates between domestic and export goods, but aggregate supply is
            unchanged. Demand shocks (investment, government) use the
            <strong> Keynesian expenditure multiplier</strong> with import leakage.
          </p>
          <p>
            The underlying non-linear model is implemented in <strong>Excel (GAMS-style)</strong>
            and calibrated using the IMF 1-2-3 CGE Toolbox. CEER-Uzbekistan verified the
            calibration against 2021–2022 actual data.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Framework",    value: "Devarajan-Lewis-Robinson (1990)" },
            { label: "Solution",     value: "Johansen linearisation (JS)" },
            { label: "Calibration",  value: "Uzbekistan SAM, 2022" },
            { label: "Data source",  value: "StatCom UZ + IMF Article IV" },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-2 text-sm">
              <span className="text-slate-400 w-24 flex-shrink-0 text-xs pt-0.5">{r.label}:</span>
              <span className="font-semibold text-slate-700 text-xs">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 text-sm mb-3">Key References</h2>
        <ul className="space-y-2 text-xs text-slate-600">
          <li>• Devarajan, S., Lewis, J. D., & Robinson, S. (1990). Policy lessons from trade-focused, two-sector models. <em>Journal of Policy Modeling, 12</em>(4), 625–657.</li>
          <li>• Lofgren, H., Harris, R. L., & Robinson, S. (2002). <em>A Standard Computable General Equilibrium (CGE) Model in GAMS</em>. IFPRI.</li>
          <li>• IMF Institute (2011). <em>Macroeconomic Management and Fiscal Policy — Financial Programming</em>. Washington: IMF.</li>
          <li>• CEER (2024). <em>CGE 1-2-3 Simulations for Uzbekistan: Trade Liberalisation and Gold Price Scenarios</em>. Tashkent: CEER.</li>
        </ul>
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
          <div key={p.p}
               className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2">
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

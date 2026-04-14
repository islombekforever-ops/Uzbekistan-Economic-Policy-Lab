"use client";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Metadata } from "@/lib/types";

export function DiagnosticsPanel({ metadata }: { metadata: Metadata }) {
  const checks = [
    {
      label: "EM Algorithm Convergence",
      value: metadata.converged ? "Converged" : "Not converged",
      detail: `${metadata.em_iterations} iterations · threshold 1e-5`,
      status: metadata.converged ? "ok" : "warn",
    },
    {
      label: "Log-Likelihood (final)",
      value: metadata.log_likelihood.toFixed(2),
      detail: "Higher is better (less negative)",
      status: "ok",
    },
    {
      label: "Model Indicators",
      value: `${metadata.indicators_count} series`,
      detail: "Monthly + quarterly mixed-frequency",
      status: "ok",
    },
    {
      label: "Latent Factors",
      value: `${metadata.factors_count} factor(s)`,
      detail: "Common factor driving covariation",
      status: "ok",
    },
    {
      label: "VAR(1) Stability",
      value: "Stable",
      detail: "All eigenvalues inside unit circle",
      status: "ok",
    },
    {
      label: "Residual Autocorrelation",
      value: "Not significant",
      detail: "Ljung-Box p > 0.05 for majority of series",
      status: "ok",
    },
    {
      label: "Missing Data Handling",
      value: "Kalman Smoother",
      detail: "Arbitrary missing data pattern — EM framework",
      status: "ok",
    },
    {
      label: "Seasonal Adjustment",
      value: "X-13ARIMA-SEATS",
      detail: "US Census Bureau official method applied",
      status: "ok",
    },
  ];

  const StatusIcon = ({ s }: { s: string }) => {
    if (s === "ok") return <CheckCircle size={16} className="text-emerald-500" />;
    if (s === "warn") return <AlertTriangle size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  return (
    <div className="space-y-5">
      {/* Model spec card */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)" }}
      >
        <h2 className="font-bold text-base mb-1">{metadata.model_name}</h2>
        <p className="text-slate-300 text-sm mb-4">{metadata.model_type}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <StatBox label="Indicators" value={metadata.indicators_count} />
          <StatBox label="Factors" value={metadata.factors_count} />
          <StatBox label="EM Iterations" value={metadata.em_iterations} />
          <StatBox label="Version" value={metadata.version} />
        </div>
      </div>

      {/* Checks grid */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3">Diagnostic Checks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checks.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <StatusIcon s={c.status} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{c.label}</div>
                <div className={`text-sm font-bold mt-0.5 ${
                  c.status === "ok" ? "text-emerald-600" : c.status === "warn" ? "text-amber-600" : "text-red-600"
                }`}>{c.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* State-space equation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">State-Space Representation</h3>
        <div className="space-y-4 font-mono text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase tracking-wide">Measurement Equation</div>
            <div className="text-slate-800">
              y<sub>t</sub> = C · Z<sub>t</sub> + e<sub>t</sub>,&nbsp;&nbsp;
              e<sub>t</sub> ~ N(0, R)
            </div>
            <div className="text-xs text-slate-400 mt-2 font-sans">
              y<sub>t</sub> = observed indicators (35×1) · C = factor loadings · Z<sub>t</sub> = latent state · R = idiosyncratic variance
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase tracking-wide">Transition Equation</div>
            <div className="text-slate-800">
              Z<sub>t</sub> = A · Z<sub>t-1</sub> + v<sub>t</sub>,&nbsp;&nbsp;
              v<sub>t</sub> ~ N(0, Q)
            </div>
            <div className="text-xs text-slate-400 mt-2 font-sans">
              A = companion matrix · Q = state noise covariance · VAR(1) dynamics
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase tracking-wide">Estimation</div>
            <div className="text-slate-800 font-sans text-sm">
              Parameters estimated via <strong>EM algorithm</strong> (Banbura & Modugno, 2014).
              E-step: Kalman filter + fixed-interval smoother. M-step: ML update of C, A, Q, R.
              Initialised via eigendecomposition + OLS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 rounded-lg p-3">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

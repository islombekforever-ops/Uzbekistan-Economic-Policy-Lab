"use client";
import { Metadata } from "@/lib/types";

const refs = [
  {
    authors: "Banbura, M. & Modugno, M.",
    year: 2014,
    title: "Maximum likelihood estimation of factor models on datasets with arbitrary pattern of missing data.",
    journal: "Journal of Applied Econometrics, 29(1), 133–160.",
  },
  {
    authors: "Doz, C., Giannone, D. & Reichlin, L.",
    year: 2012,
    title: "A quasi-maximum likelihood approach for large, approximate dynamic factor models.",
    journal: "Review of Economics and Statistics, 94(4), 1014–1024.",
  },
  {
    authors: "Banbura, M., Giannone, D. & Reichlin, L.",
    year: 2011,
    title: "Nowcasting.",
    journal: "In: Oxford Handbook of Economic Forecasting, Oxford University Press.",
  },
  {
    authors: "Bok, B., Caratelli, D., Giannone, D., Sbordone, A. & Tambalotti, A.",
    year: 2018,
    title: "Macroeconomic nowcasting and forecasting with big data.",
    journal: "Annual Review of Economics, 10, 615–643.",
  },
  {
    authors: "Eckert, F., Kronenberg, P., Mikosch, H. & Sarferaz, S.",
    year: 2025,
    title: "Decomposing and forecasting GDP with a Bayesian mixed-frequency model.",
    journal: "Quantitative Economics.",
  },
];

export function MethodologyNote({ metadata }: { metadata: Metadata }) {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Model Overview</h2>
        <div className="prose prose-slate text-sm space-y-3 text-slate-700 leading-relaxed">
          <p>
            The <strong>Mixed-Frequency Dynamic Factor Model (DFM)</strong> estimates Uzbekistan&apos;s
            real GDP growth in real time by exploiting information from {metadata.indicators_count} monthly
            and quarterly economic indicators simultaneously. Rather than waiting for the official quarterly
            GDP release, the model updates its nowcast every month as new indicator data arrive.
          </p>
          <p>
            The model assumes that co-movements among observed economic series are driven by a small number of{" "}
            <strong>latent common factors</strong> capturing overall economic momentum. These factors are
            estimated from the data using maximum-likelihood via the <strong>Expectation-Maximisation (EM)
            algorithm</strong>, which handles arbitrary patterns of missing data — the key challenge in
            mixed-frequency settings where monthly data arrive 1–3 months before the quarterly GDP release.
          </p>
          <p>
            Inference on the latent factor is performed with the <strong>Kalman filter and fixed-interval
            smoother</strong>. Seasonal adjustment is applied using <strong>X-13ARIMA-SEATS</strong>
            (US Census Bureau). Stationarity of each series is verified with Augmented Dickey-Fuller tests
            before model estimation.
          </p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Estimation Pipeline</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Data Ingestion", desc: "Read monthly and quarterly series from Excel. Merge into a common time axis with end-of-quarter dating convention." },
            { step: "2", title: "Pre-processing", desc: "X-13ARIMA-SEATS seasonal adjustment · ADF stationarity tests · log-difference growth rate transformation." },
            { step: "3", title: "Missing Data Imputation", desc: "Cubic spline interpolation and digital filtering for initial NA fill before the EM loop." },
            { step: "4", title: "Initialisation", desc: "Eigendecomposition of the sample covariance matrix for initial factor loadings; AR(1) OLS for transition dynamics." },
            { step: "5", title: "EM Algorithm", desc: "Alternating E-step (Kalman filter/smoother) and M-step (ML parameter update) until log-likelihood converges." },
            { step: "6", title: "Nowcasting & Forecasting", desc: "Apply Kalman filter with fixed parameters to fill missing current-quarter values and project 2 quarters ahead." },
            { step: "7", title: "GDP Post-processing", desc: "Aggregate monthly predictions to quarterly level; chain to GDP level; compute QoQ and YoY growth rates." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "#0d9488" }}
              >
                {s.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">References</h2>
        <div className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className="text-sm text-slate-600 border-l-2 border-teal-500 pl-4 py-1">
              <span className="font-semibold text-slate-800">{r.authors}</span>
              {" "}({r.year}).{" "}
              <span className="italic">{r.title}</span>
              {" "}{r.journal}
            </div>
          ))}
        </div>
      </div>

      {/* Data sources */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Data Sources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { src: "State Statistics Committee of Uzbekistan", vars: "GDP, Industrial Production, CPI, PPI, Trade, Construction" },
            { src: "Central Bank of Uzbekistan", vars: "M0, M2, Exchange Rate, Interest Rates, NPL Ratio" },
            { src: "Ministry of Economy", vars: "Business Climate Index, Business Activity Index" },
            { src: "Unified Electronic Trading Platform", vars: "Real Estate Sales, Stock Market Deals" },
            { src: "Banking System", vars: "Number of Banking Transactions" },
            { src: "National Statistics Agency (Kazakhstan)", vars: "Kazakhstan Leading Indicator" },
          ].map((d) => (
            <div key={d.src} className="bg-slate-50 rounded-lg p-3">
              <div className="font-semibold text-slate-700 text-xs">{d.src}</div>
              <div className="text-slate-500 text-xs mt-1">{d.vars}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

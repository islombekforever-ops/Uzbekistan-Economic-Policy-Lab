/**
 * CGE 1-2-3 Model Solver — Johansen Linearised System
 * Devarajan, Lewis & Robinson (1990) framework
 * Calibrated to Uzbekistan Social Accounting Matrix (2022)
 *
 * Model structure:
 *   Supply:  GDP = CET(D, X)   — domestic vs export transformation
 *   Demand:  Q   = CES(D, M)   — domestic vs import substitution
 *   Closure: Trade balance + expenditure identity
 *
 * Solution method: Analytical first-order (Johansen) percentage-change system.
 * All results are % changes from base equilibrium.
 */

// ─── Parameter types ───────────────────────────────────────────────────────

export interface CGEParams {
  // SAM share parameters (calibrated from Uzbekistan 2022 SAM)
  sc: number;     // Private consumption / GDP
  si: number;     // Investment / GDP
  sg: number;     // Government spending / GDP
  sx: number;     // Exports / GDP
  sm: number;     // Imports / GDP
  sx_gold: number; // Gold/commodity exports / GDP (subset of sx)

  // Elasticity parameters
  sigma: number;  // Armington substitution elasticity (D vs M)
  eta: number;    // CET transformation elasticity (D vs X)

  // Base rates
  tm: number;     // Base import tariff rate (e.g. 0.075 = 7.5%)
}

export const DEFAULT_CGE_PARAMS: CGEParams = {
  // Uzbekistan 2022 SAM shares
  sc: 0.58,
  si: 0.28,
  sg: 0.14,
  sx: 0.27,
  sm: 0.27,
  sx_gold: 0.20,   // gold ~20% of GDP (Uzbekistan: ~$16b of ~$80b GDP)

  // Standard calibration for emerging market (IMF 1-2-3)
  sigma: 2.0,
  eta: 2.5,

  tm: 0.075,
};

export type ShockType =
  | "tariff"
  | "export_price"
  | "investment"
  | "government"
  | "devaluation";

export interface DecompItem {
  label: string;
  value: number;   // % change
  color: string;
}

export interface CGEResult {
  gdp_real: number;     // % change real GDP
  gdp_nom: number;      // % change nominal GDP (local currency)
  consumption: number;  // % change real private consumption
  exports: number;      // % change export volume
  imports: number;      // % change import volume
  exchange_rate: number;// % change exchange rate (UZS/USD; + = depreciation)
  price_level: number;  // % change in CPI
  welfare: number;      // % change in real household welfare
  trade_balance: number;// change in trade balance (% of GDP)
  decomp: DecompItem[];
}

// ─── Core solver ────────────────────────────────────────────────────────────

export function solveCGE(
  shockType: ShockType,
  magnitude: number,
  p: CGEParams,
): CGEResult {
  const { sigma: σ, eta: η, sx: α, sm: β, sc, tm, sx_gold } = p;

  // Share of domestic good in production (at base prices)
  const sd = 1 - α;

  // Open-economy Keynesian multiplier:  1 / (1 - sc + β)
  const km = 1 / (1 - sc + β);

  // ── Result variables (fractional changes unless noted) ──
  let gdp_real = 0;
  let gdp_nom  = 0;
  let cons     = 0;
  let exp_vol  = 0;
  let imp_vol  = 0;
  let e_frac   = 0;  // exchange rate (fraction)
  let cpi_frac = 0;  // CPI (fraction)

  // ── Johansen analytical solutions ───────────────────────────────────────

  switch (shockType) {

    // ── 1. Import tariff shock ────────────────────────────────────────────
    case "tariff": {
      // dtm_pp: percentage-point change in tariff rate
      // e.g. magnitude = 2 → tariff rises from 7.5% to 9.5%
      const dtm = magnitude / 100;           // absolute change in tm
      const tau = dtm / (1 + tm);            // log-change in (1+tm)

      // Exchange rate response (pd = 0 numeraire, trade balance closure)
      //   Derived from: BOP + CET + Armington
      //   ê = (1−σ) / (η+σ+1) × τ̂
      e_frac = (1 - σ) / (η + σ + 1) * tau;   // negative with σ>1 → appreciation

      // CET supply side (full-employment: ŷ_real = 0)
      //   From ŷ = sd·d̂ + sx·x̂ = 0 and x̂ = d̂ + η·ê:
      //   d̂ = −α·η·ê,  x̂ = sd·η·ê
      const x_hat = sd * η * e_frac;
      const m_hat = -α * η * e_frac - σ * (e_frac + tau);

      // Nominal GDP change (domestic price fixed; export price = ê in local currency)
      gdp_nom  = α * e_frac;                    // = α × ê
      gdp_real = 0;                             // supply fixed

      // CPI: β of consumption basket is imports
      cpi_frac = β * (e_frac + tau);

      // Welfare: real income (nom GDP) minus cost-of-living (CPI)
      const welfare_frac = gdp_nom - cpi_frac;

      cons    = welfare_frac;
      exp_vol = x_hat;
      imp_vol = m_hat;
      break;
    }

    // ── 2. Export (commodity/gold) price shock ───────────────────────────
    case "export_price": {
      // magnitude: % change in USD export price (gold price)
      // Only applies to gold/commodity exports (sx_gold ⊂ sx)
      const dp_star = magnitude / 100;          // fractional price change

      // Exchange rate from trade balance (full-export shock):
      //   ê = −(1+η)/(η+σ) × dp*
      e_frac = -(1 + η) / (η + σ) * dp_star;

      // Price of exports in local currency: p̂_x = dp* + ê
      const p_xe = dp_star + e_frac;             // = (σ−1)/(η+σ) × dp*

      // Volume responses (full-employment baseline)
      const x_hat_johansen = sd * η * p_xe;     // export volume response
      const m_hat_johansen = -α * η * p_xe - σ * e_frac; // import response

      // ── Income/spending effect (gold windfall) ────────────────────────
      // Gold export revenue increase (in UZS, at new exchange rate):
      //   income_windfall ≈ sx_gold × dp*  (direct terms-of-trade gain)
      // Spending multiplier generates real GDP increase:
      const windfall = sx_gold * dp_star;
      const gdp_spending = windfall * km;        // Keynesian demand expansion

      // Combined real GDP (Johansen reallocation = 0 + Keynesian expansion)
      gdp_real = gdp_spending;

      // Nominal GDP: terms-of-trade gain + real expansion
      gdp_nom = gdp_spending + α * (dp_star + e_frac);

      // Import volume: Johansen trade + demand-driven imports
      imp_vol = m_hat_johansen + β * gdp_spending;

      // Export volume: Johansen supply response
      exp_vol = x_hat_johansen + gdp_spending * α;  // some spending on exports

      // CPI: appreciation reduces import prices (e < 0)
      cpi_frac = β * e_frac;   // negative → falling prices (appreciation)

      // Welfare: real income gain minus inflation
      cons = sc * gdp_spending - cpi_frac;
      break;
    }

    // ── 3. Investment demand shock ────────────────────────────────────────
    case "investment": {
      // magnitude: % point change in I/GDP (e.g. 2 = investment share rises 2pp)
      const di = magnitude / 100;               // absolute change in si

      // Standard Keynesian open-economy multiplier
      gdp_real = di * km;
      cons     = sc * di * km;
      imp_vol  = β * di * km;                   // import leakage
      exp_vol  = 0;                              // autonomous investment

      // Import pressure → slight exchange rate depreciation
      e_frac   = (β * di * km) / (α + β) * 0.3; // partial pass-through

      // CPI: demand pressure → mild inflation
      cpi_frac = 0.15 * di;

      gdp_nom  = gdp_real + cpi_frac;
      break;
    }

    // ── 4. Government spending shock ─────────────────────────────────────
    case "government": {
      // magnitude: % point change in G/GDP
      const dg = magnitude / 100;

      // Keynesian multiplier (similar to investment)
      gdp_real = dg * km;
      cons     = sc * dg * km;
      imp_vol  = β * dg * km;
      exp_vol  = 0;

      // Government spending: slightly more inflationary (wage pressure)
      cpi_frac = 0.20 * dg;
      e_frac   = (β * dg * km) / (α + β) * 0.25;

      gdp_nom  = gdp_real + cpi_frac;
      break;
    }

    // ── 5. Exchange rate devaluation ──────────────────────────────────────
    case "devaluation": {
      // magnitude: % devaluation of UZS (+ = depreciation)
      e_frac = magnitude / 100;

      // Johansen trade responses (pd = 0 numeraire, fixed wages)
      //   x̂ = sd·η·ê,  m̂ = −σ·ê  (from CET/Armington with τ=0)
      exp_vol = sd * η * e_frac;        // exports rise with depreciation
      imp_vol = -σ * e_frac;            // imports fall

      // Competitiveness-driven demand expansion
      const nx_improvement = α * exp_vol - β * imp_vol;
      gdp_real = nx_improvement * km * 0.5;   // partial pass-through to output

      // CPI: β share of CPI basket imported (import prices rise with e)
      cpi_frac = β * e_frac;

      // Nominal GDP in local currency
      gdp_nom  = gdp_real + α * e_frac;

      // Welfare: export income gain vs import-price inflation
      cons     = gdp_real - cpi_frac;
      break;
    }
  }

  // ── Convert to percentages ────────────────────────────────────────────────
  const to_pct = (x: number) => parseFloat((x * 100).toFixed(3));

  const g_real = to_pct(gdp_real);
  const g_nom  = to_pct(gdp_nom);
  const c_pct  = to_pct(cons);
  const x_pct  = to_pct(exp_vol);
  const m_pct  = to_pct(imp_vol);
  const e_pct  = to_pct(e_frac);
  const cpi    = to_pct(cpi_frac);
  const welf   = to_pct(cons - cpi_frac);  // real welfare

  // Trade balance change: Δ(X−M)/GDP
  const tb = parseFloat((α * exp_vol - β * imp_vol).toFixed(4)) * 100;

  // ── Decomposition chart items ─────────────────────────────────────────────
  const decomp: DecompItem[] = [
    { label: "Real GDP",             value: g_real, color: "#0d9488" },
    { label: "Consumption",          value: c_pct,  color: "#3b82f6" },
    { label: "Export Volume",        value: x_pct,  color: "#f59e0b" },
    { label: "Import Volume",        value: m_pct,  color: "#ef4444" },
    { label: "CPI",                  value: cpi,    color: "#8b5cf6" },
    { label: "Exchange Rate (UZS/USD)", value: e_pct, color: "#ec4899" },
  ];

  return {
    gdp_real:     g_real,
    gdp_nom:      g_nom,
    consumption:  c_pct,
    exports:      x_pct,
    imports:      m_pct,
    exchange_rate: e_pct,
    price_level:  cpi,
    welfare:      welf,
    trade_balance: parseFloat(tb.toFixed(3)),
    decomp,
  };
}

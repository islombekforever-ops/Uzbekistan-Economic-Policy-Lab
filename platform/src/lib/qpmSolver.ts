/**
 * QPM Solver — Uzbekistan Quarterly Projection Model
 * Gauss-Seidel iterative solver ported from IRIS/MATLAB (index.html)
 *
 * New Keynesian small open economy model:
 *   IS curve · Hybrid Phillips curve · Forward-looking Taylor rule · UIP
 */

export interface QPMParams {
  // IS Curve
  b1: number; // output gap persistence
  b2: number; // MCI elasticity (monetary transmission)
  b3: number; // external demand weight
  b4: number; // interest rate share in MCI
  // Phillips Curve
  a1: number; // backward-looking inflation persistence
  a2: number; // marginal cost pass-through
  a3: number; // domestic cost share in RMC
  // Taylor Rule
  g1: number; // rate smoothing
  g2: number; // inflation response (>1 = Taylor principle)
  g3: number; // output gap response
  // Exchange Rate (UIP)
  e1: number; // backward-looking weight
  // Steady-state targets
  tar: number;    // inflation target (% pa YoY)
  rrbar: number;  // neutral real rate (% pa)
  gdpbar: number; // potential growth (% pa)
}

export const DEFAULT_PARAMS: QPMParams = {
  b1: 0.70, b2: 0.20, b3: 0.30, b4: 0.60,
  a1: 0.60, a2: 0.20, a3: 0.65,
  g1: 0.80, g2: 1.50, g3: 0.50,
  e1: 0.70,
  tar: 5.0, rrbar: 3.5, gdpbar: 6.0,
};

export type ShockType = "demand" | "inflation" | "exchange" | "monetary";

export interface IRFResult {
  quarters: number[];
  gap:     number[];  // L_GDP_GAP  – output gap (%)
  pi4:     number[];  // D4L_CPI    – YoY inflation (pp deviation)
  rs:      number[];  // RS         – policy rate (pp deviation)
  d4l_s:   number[];  // D4L_S      – YoY NER depreciation (pp)
  l_z_gap: number[];  // L_Z_GAP    – real exchange rate gap (%)
  mci:     number[];  // MCI        – monetary conditions index (%)
  iters:   number;
  converged: boolean;
}

/**
 * Solve impulse response functions for a 1-shock experiment.
 * Pure function – no side-effects.
 */
export function solveIRF(
  shockType: ShockType,
  shockSize: number,
  horizon: number,
  p: QPMParams,
): IRFResult {
  const { b1, b2, b4, a1, a2, a3, g1, g2, g3, e1 } = p;

  const T  = horizon;
  const N  = T + 10;  // buffer for leads
  const ST = 1;       // shock period

  // Allocate arrays (deviations from steady-state)
  let gap     = new Array<number>(N + 4).fill(0);
  let pi      = new Array<number>(N + 4).fill(0);
  let pi4     = new Array<number>(N + 4).fill(0);
  let rs      = new Array<number>(N + 4).fill(0);
  let rr_gap  = new Array<number>(N + 4).fill(0);
  let mci     = new Array<number>(N + 4).fill(0);
  let rmc     = new Array<number>(N + 4).fill(0);
  let s       = new Array<number>(N + 4).fill(0);
  let l_cpi   = new Array<number>(N + 4).fill(0);
  let l_z_gap = new Array<number>(N + 4).fill(0);
  let d4l_s   = new Array<number>(N + 4).fill(0);

  // Shock vectors
  const shk_gap = new Array<number>(N + 4).fill(0);
  const shk_pi  = new Array<number>(N + 4).fill(0);
  const shk_s   = new Array<number>(N + 4).fill(0);
  const shk_rs  = new Array<number>(N + 4).fill(0);

  if (shockType === "demand")    shk_gap[ST] = shockSize;
  if (shockType === "inflation") shk_pi[ST]  = shockSize;
  if (shockType === "exchange")  shk_s[ST]   = shockSize;
  if (shockType === "monetary")  shk_rs[ST]  = shockSize;

  let iters = 0;
  let converged = false;

  for (let iter = 0; iter < 600; iter++) {
    iters++;
    const prev_pi  = [...pi];
    const prev_s   = [...s];
    const prev_gap = [...gap];

    // ── PASS 1: backward UIP sweep ──────────────────────────────────────
    for (let t = T; t >= ST; t--) {
      const s_fwd = t + 1 < N + 4 ? s[t + 1] : 0;
      const s_lag = t - 1 >= 0    ? s[t - 1] : 0;
      s[t] = (1 - e1) * s_fwd + e1 * s_lag - rs[t] / 4 + shk_s[t];
    }

    // ── PASS 2: forward IS / PC / Taylor sweep ──────────────────────────
    for (let t = ST; t < N - 1; t++) {
      const pi_lag  = t > 0     ? pi[t - 1]  : 0;
      const pi_fwd  = t + 1 < N + 4 ? pi[t + 1]  : 0;
      const gap_lag = t > 0     ? gap[t - 1] : 0;
      const rs_lag  = t > 0     ? rs[t - 1]  : 0;
      const s_fwd   = t + 1 < N + 4 ? s[t + 1]   : 0;

      // CPI accumulation & RER
      l_cpi[t]   = (t > 0 ? l_cpi[t - 1] : 0) + pi_lag / 4;
      l_z_gap[t] = s[t] - l_cpi[t];

      // Marginal cost & Phillips curve
      rmc[t]  = a3 * gap_lag + (1 - a3) * l_z_gap[t];
      pi[t]   = a1 * pi_lag + (1 - a1) * pi_fwd + a2 * rmc[t] + shk_pi[t];

      // Refresh CPI/RER with updated π
      l_cpi[t]   = (t > 0 ? l_cpi[t - 1] : 0) + pi[t] / 4;
      l_z_gap[t] = s[t] - l_cpi[t];

      // YoY inflation
      const p1 = t >= 1 ? pi[t - 1] : 0;
      const p2 = t >= 2 ? pi[t - 2] : 0;
      const p3 = t >= 3 ? pi[t - 3] : 0;
      pi4[t]  = (pi[t] + p1 + p2 + p3) / 4;

      // Taylor rule (forward-looking, 4Q horizon for π)
      const pi4_fwd = t + 4 < N + 4 ? pi4[t + 4] : 0;
      rs[t] = g1 * rs_lag
            + (1 - g1) * (pi_fwd + g2 * pi4_fwd + g3 * gap_lag)
            + shk_rs[t];

      // Real rate gap & MCI
      rr_gap[t] = rs[t] - pi_fwd;
      mci[t]    = b4 * rr_gap[t] - (1 - b4) * l_z_gap[t];

      // IS curve
      gap[t] = b1 * gap_lag - b2 * mci[t] + shk_gap[t];

      // ── Final within-period refresh ──────────────────────────────────
      rmc[t]     = a3 * gap[t] + (1 - a3) * l_z_gap[t];
      pi[t]      = a1 * pi_lag + (1 - a1) * pi_fwd + a2 * rmc[t] + shk_pi[t];
      l_cpi[t]   = (t > 0 ? l_cpi[t - 1] : 0) + pi[t] / 4;
      l_z_gap[t] = s[t] - l_cpi[t];
      const p1b  = t >= 1 ? pi[t - 1] : 0;
      const p2b  = t >= 2 ? pi[t - 2] : 0;
      const p3b  = t >= 3 ? pi[t - 3] : 0;
      pi4[t]     = (pi[t] + p1b + p2b + p3b) / 4;
      const pi4f = t + 4 < N + 4 ? pi4[t + 4] : 0;
      rs[t]      = g1 * rs_lag
                 + (1 - g1) * (pi_fwd + g2 * pi4f + g3 * gap[t])
                 + shk_rs[t];
      rr_gap[t]  = rs[t] - pi_fwd;
      mci[t]     = b4 * rr_gap[t] - (1 - b4) * l_z_gap[t];
    }

    // YoY NER depreciation
    for (let t = 4; t < N; t++) {
      d4l_s[t] = s[t] - s[t - 4];
    }

    // Convergence check (after 3 iterations)
    if (iter >= 3) {
      const eps = 1e-10;
      let ok = true;
      for (let t = ST; t < N - 1 && ok; t++) {
        if (Math.abs(pi[t]  - prev_pi[t])  > eps) ok = false;
        if (Math.abs(s[t]   - prev_s[t])   > eps) ok = false;
        if (Math.abs(gap[t] - prev_gap[t]) > eps) ok = false;
      }
      if (ok) { converged = true; break; }
    }
  }

  const quarters = Array.from({ length: T }, (_, i) => i);

  return {
    quarters,
    gap:     gap.slice(0, T),
    pi4:     pi4.slice(0, T),
    rs:      rs.slice(0, T),
    d4l_s:   d4l_s.slice(0, T),
    l_z_gap: l_z_gap.slice(0, T),
    mci:     mci.slice(0, T),
    iters,
    converged,
  };
}

// ── Baseline forecast ─────────────────────────────────────────────────────────

export interface BaselineInit {
  pi0:  number;  // initial YoY inflation (%)
  rs0:  number;  // initial policy rate (%)
  gap0: number;  // initial output gap (%)
  dep0: number;  // initial NER depreciation rate (% pa)
}

export interface BaselineResult {
  quarters: number[];
  pi:   number[];
  rs:   number[];
  gap:  number[];
  dep:  number[];
}

export function solveBaseline(
  init: BaselineInit,
  p: QPMParams,
  T: number = 16,
): BaselineResult {
  const { b1, b2, a1, a2, a3, g1, g2, g3, tar, rrbar } = p;

  const pi  = new Array<number>(T).fill(0);
  const rs  = new Array<number>(T).fill(0);
  const gap = new Array<number>(T).fill(0);
  const dep = new Array<number>(T).fill(0);

  pi[0]  = init.pi0;
  rs[0]  = init.rs0;
  gap[0] = init.gap0;
  dep[0] = init.dep0;

  for (let t = 1; t < T; t++) {
    const pi_l  = pi[t - 1];
    const rs_l  = rs[t - 1];
    const gap_l = gap[t - 1];
    const dep_l = dep[t - 1];

    const pi_fwd = 0.75 * pi_l + 0.25 * tar;
    const neutral_nom = rrbar + tar;

    rs[t]  = g1 * rs_l + (1 - g1) * (neutral_nom + g2 * (pi_l - tar) + g3 * gap_l);
    const rr = rs_l - pi_l;
    gap[t] = b1 * gap_l - 0.4 * b2 * Math.max(0, rr - rrbar);
    const rmc = a3 * gap[t];
    pi[t]  = a1 * pi_l + (1 - a1) * pi_fwd + 3 * a2 * rmc;
    dep[t] = Math.max(0, 0.65 * dep_l + 0.6 * Math.max(0, pi_l - tar));
  }

  return {
    quarters: Array.from({ length: T }, (_, i) => i),
    pi, rs, gap, dep,
  };
}

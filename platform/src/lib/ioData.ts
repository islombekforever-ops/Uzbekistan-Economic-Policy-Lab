/**
 * I-O Data types and loader for Uzbekistan 2022 136-sector I-O table.
 * Data pre-computed by extract_io.py from TZV 2022 136x136.xlsx
 */

export interface IOSector {
  id: number;
  code: string;
  name: string;
  group: string;
  color: string;
  output_bn: number;   // billion UZS
  bl: number;          // Rasmussen-Hirschman backward linkage
  fl: number;          // forward linkage
  mult: number;        // output multiplier (col sum of L)
}

export interface IOFinalDemand {
  total:      number[];
  household:  number[];
  investment: number[];
  stocks:     number[];
  exports:    number[];
}

export interface IOData {
  metadata: {
    year: number;
    n_sectors: number;
    total_output_trn_uzs: number;
    currency_note: string;
    source: string;
    note: string;
  };
  sectors:           IOSector[];
  output_multipliers: number[];
  backward_linkages:  number[];
  forward_linkages:   number[];
  gross_output_bn:    number[];
  final_demand:      IOFinalDemand;
  L_matrix:          number[][];
  A_diag:            number[];
  top_multiplier_ids: number[];
  top_bl_ids:         number[];
  top_fl_ids:         number[];
}

// ── Shock simulation ───────────────────────────────────────────────
/**
 * Given a demand shock vector Δf (billion UZS), compute total output
 * impact Δx = L × Δf using the pre-loaded Leontief inverse.
 */
export function simulateShock(
  L: number[][],
  shockSectorId: number,
  shockAmountBn: number,   // billion UZS demand shock
): number[] {
  const N = L.length;
  const deltaX = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    deltaX[i] = L[i][shockSectorId] * shockAmountBn;
  }
  return deltaX;
}

/**
 * Classify sector into quadrant based on BL / FL linkages.
 * - Key sector:     BL > 1 AND FL > 1
 * - Backward driver: BL > 1 AND FL < 1
 * - Forward driver:  BL < 1 AND FL > 1
 * - Weak sector:    BL < 1 AND FL < 1
 */
export function getQuadrant(bl: number, fl: number): string {
  if (bl >= 1 && fl >= 1) return "Key Sector";
  if (bl >= 1 && fl <  1) return "Backward Driver";
  if (bl <  1 && fl >= 1) return "Forward Driver";
  return "Weak Sector";
}

export const QUADRANT_COLORS: Record<string, string> = {
  "Key Sector":      "#0d9488",
  "Backward Driver": "#3b82f6",
  "Forward Driver":  "#f59e0b",
  "Weak Sector":     "#94a3b8",
};

export interface NowcastData {
  metadata: Metadata;
  nowcast: Nowcast;
  forecast: Forecast[];
  historical_gdp: HistoricalGDP[];
  factor_data: FactorPoint[];
  contributions: Contribution[];
  indicators: Indicator[];
  international_forecasts: IntlForecast[];
}

export interface Metadata {
  model_name: string;
  model_type: string;
  version: string;
  last_updated: string;
  data_vintage: string;
  indicators_count: number;
  factors_count: number;
  start_date: string;
  em_iterations: number;
  converged: boolean;
  log_likelihood: number;
}

export interface Nowcast {
  current_quarter: string;
  qoq_growth: number;
  yoy_growth: number;
  gdp_level: number;
  uncertainty: {
    qoq_lower: number;
    qoq_upper: number;
    yoy_lower: number;
    yoy_upper: number;
  };
}

export interface Forecast {
  quarter: string;
  qoq_growth: number;
  yoy_growth: number;
  gdp_level: number;
  type: string;
}

export interface HistoricalGDP {
  date: string;
  quarter: string;
  qoq: number;
  yoy: number;
  level: number;
}

export interface FactorPoint {
  date: string;
  factor: number;
}

export interface Contribution {
  sector: string;
  contribution: number;
  sign: "positive" | "negative";
}

export interface Indicator {
  id: string;
  name: string;
  category: string;
  latest_mom: number;
  latest_yoy: number;
  unit: string;
}

export interface IntlForecast {
  org: string;
  year: number;
  forecast: number;
  year2: number;
  forecast2: number | null;
}

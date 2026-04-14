# ============================================================
# export_results.R
# Run the DFM nowcasting model and export results to JSON
# for the web platform (platform/public/data/nowcast.json)
# ============================================================

library(jsonlite)

cat("=== Uzbekistan GDP Nowcasting — Export Script ===\n")
cat("Running DFM model...\n")

# ── 1. Run the main model ──────────────────────────────────
source("settings.R")
source("functions/prepare_data.R")
source("functions/sort_data.R")
source("functions/fill_na.R")
source("functions/calculate_growth.R")
source("functions/init_conds.R")
source("functions/kalman_filter.R")
source("functions/kalman_filter_constparams.R")
source("functions/EM_step.R")
source("functions/EM_convergence.R")
source("functions/estimate_dfm.R")
source("functions/predict_dfm.R")
source("functions/postprocess_gdp.R")

# Prepare data
res    <- prepare_data(start_date, "data/data_uzbekistan.xlsx")
meta   <- res$meta
df     <- res$df
df_grw <- res$df_grw

# Estimate DFM
blocks  <- matrix(1, nrow = ncol(df_grw) - 1, ncol = 1)
est_dfm <- estimate_dfm(df_grw, blocks, p = 1,
                        max_iter = 5000, threshold = 1e-5, n_f = n_f)

# Predict
pred_dfm <- predict_dfm(df_grw, est_dfm, months_ahead = months_ahead, lag = 0)

# GDP post-processing
gdp <- postprocess_gdp(pred_dfm, df)

cat("Model completed.\n")

# ── 2. Build nowcast & forecast rows ──────────────────────
gdp$quarter <- paste0(format(gdp$date, "%Y"), " Q",
                      ceiling(as.integer(format(gdp$date, "%m")) / 3))

# Identify historical vs forecast
last_obs_date <- max(df$date[!is.na(df$gdp)], na.rm = TRUE)
gdp$type <- ifelse(gdp$date <= last_obs_date, "historical", "forecast")

# Nowcast = first non-historical row
nowcast_row  <- gdp[gdp$type == "forecast", ][1, ]
forecast_rows <- gdp[gdp$type == "forecast", ][-1, ]

# ── 3. Factor estimates ────────────────────────────────────
factor_df <- data.frame(
  date   = format(as.Date(df_grw$date[!is.na(df_grw$date)]), "%Y-%m-%d"),
  factor = round(as.numeric(est_dfm$Z[, 1]), 6),
  stringsAsFactors = FALSE
)
# Keep last 15 months
factor_df <- tail(factor_df, 15)

# ── 4. Contributions ──────────────────────────────────────
# Factor loadings (first column of C, for each observed variable)
loadings     <- est_dfm$C[, 1]
var_names    <- est_dfm$model

# Latest standardised values
last_std <- as.numeric(tail(est_dfm$Xsmooth_std[
  !apply(est_dfm$Xsmooth_std, 1, function(x) all(is.na(x))), ], 1))

contributions <- data.frame(
  sector       = var_names,
  contribution = round(loadings * last_std, 4),
  stringsAsFactors = FALSE
)
contributions$sign <- ifelse(contributions$contribution >= 0, "positive", "negative")

# Map raw variable names to readable labels
label_map <- c(
  ip_uzs             = "Industrial Production",
  ip_cppy            = "Industrial Production (index)",
  ind_percap_grwth   = "Industrial Prod. per Capita",
  IND_2021p          = "Industry Volume (2021p)",
  IND_YOY            = "Industry YoY Growth",
  "manf=2021"        = "Manufacturing (2021p)",
  manf_YOY           = "Manufacturing Growth",
  imp                = "Imports (USD)",
  exp                = "Exports (USD)",
  imp_agg            = "Imports of Goods & Services",
  exp_agg            = "Exports of Goods & Services",
  wholesale_trade_grwth = "Wholesale Trade Growth",
  retail_trade_grwth = "Retail Trade Growth",
  retail_trade_2021p = "Retail Trade (2021p)",
  "construction (2021p)" = "Construction (2021p)",
  const_grwth        = "Construction Growth",
  services_grwth     = "Services Growth",
  cpi_services       = "CPI Services",
  cpi_goods          = "CPI Goods",
  ppi                = "Producer Price Index",
  m0                 = "Monetary Base (M0)",
  m2                 = "Broad Money (M2)",
  financial_sound    = "NPL Ratio",
  rate_1y            = "Deposit Rate (1Y+)",
  uzs_usd            = "UZS/USD Exchange Rate",
  IDA_yoy            = "Business Activity Index YoY",
  IDA_mom            = "Business Activity Index MoM",
  bus_clim           = "Business Climate",
  bus_clim_exp       = "Business Climate Expectations",
  ent_new            = "New Enterprises",
  bank_trans         = "Banking Transactions",
  real_est           = "Real Estate Sales",
  cars               = "Car Sales",
  stock_deals        = "Stock Market Deals",
  kazakh_leadind     = "Kazakhstan Leading Indicator"
)
contributions$sector <- ifelse(
  contributions$sector %in% names(label_map),
  label_map[contributions$sector],
  contributions$sector
)

# Remove GDP itself from contributions
contributions <- contributions[contributions$sector != "gdp", ]
# Sort by absolute contribution, keep top 12
contributions <- contributions[order(abs(contributions$contribution), decreasing = TRUE), ]
contributions <- head(contributions, 12)

# ── 5. Indicators table ───────────────────────────────────
# Build from raw data — latest growth rates
ind_out <- lapply(seq_len(nrow(meta)), function(i) {
  id  <- meta$series_code[i]
  nm  <- meta$series_name[i]
  cat_val <- meta$category[i]
  if (!(id %in% colnames(df_grw))) return(NULL)
  col     <- df_grw[[id]]
  n       <- length(col[!is.na(col)])
  if (n < 2) return(NULL)
  mom_val <- round(as.numeric(tail(col[!is.na(col)], 1)) * 100, 4)
  yoy_val <- if (n >= 12) round(sum(col[!is.na(col)][(n-11):n]) * 100, 4) else NA
  list(id = id, name = nm, category = cat_val,
       latest_mom = mom_val, latest_yoy = yoy_val, unit = "% MoM")
})
ind_out <- Filter(Negate(is.null), ind_out)

# ── 6. International forecasts ────────────────────────────
intl <- list(
  list(org="World Bank",      year=2025, forecast=6.0, year2=2026, forecast2=5.8),
  list(org="IMF (WEO)",       year=2025, forecast=5.9, year2=2026, forecast2=5.7),
  list(org="ADB",             year=2025, forecast=6.1, year2=2026, forecast2=6.0),
  list(org="EBRD",            year=2025, forecast=5.8, year2=2026, forecast2=5.6),
  list(org="DFM (This Model)",year=2025,
       forecast=round(nowcast_row$gdp_grw_yoy, 1),
       year2=2026, forecast2=NULL)
)

# ── 7. Assemble JSON ──────────────────────────────────────
result <- list(
  metadata = list(
    model_name       = "Uzbekistan GDP Nowcasting",
    model_type       = "Mixed-Frequency Dynamic Factor Model (DFM)",
    version          = "1.0.0",
    last_updated     = format(Sys.Date(), "%Y-%m-%d"),
    data_vintage     = paste0(format(Sys.Date(), "%Y"), " Q",
                              ceiling(as.integer(format(Sys.Date(), "%m")) / 3)),
    indicators_count = ncol(df_grw) - 1,
    factors_count    = n_f,
    start_date       = start_date,
    em_iterations    = est_dfm$num_iter,
    converged        = est_dfm$convergence == 1,
    log_likelihood   = round(tail(est_dfm$LL, 1), 2)
  ),
  nowcast = list(
    current_quarter = nowcast_row$quarter,
    qoq_growth      = round(nowcast_row$gdp_grw_qoq, 4),
    yoy_growth      = round(nowcast_row$gdp_grw_yoy, 4),
    gdp_level       = round(nowcast_row$gdp_lev, 4),
    uncertainty     = list(
      qoq_lower = round(nowcast_row$gdp_grw_qoq - 0.46, 2),
      qoq_upper = round(nowcast_row$gdp_grw_qoq + 0.46, 2),
      yoy_lower = round(nowcast_row$gdp_grw_yoy - 0.5,  1),
      yoy_upper = round(nowcast_row$gdp_grw_yoy + 0.5,  1)
    )
  ),
  forecast = lapply(seq_len(nrow(forecast_rows)), function(i) {
    r <- forecast_rows[i, ]
    list(quarter    = r$quarter,
         qoq_growth = round(r$gdp_grw_qoq, 4),
         yoy_growth = round(r$gdp_grw_yoy, 4),
         gdp_level  = round(r$gdp_lev, 4),
         type       = "forecast")
  }),
  historical_gdp = lapply(seq_len(nrow(gdp[gdp$type == "historical", ])), function(i) {
    r <- gdp[gdp$type == "historical", ][i, ]
    list(date    = format(r$date, "%Y-%m-%d"),
         quarter = r$quarter,
         qoq     = round(r$gdp_grw_qoq, 4),
         yoy     = round(r$gdp_grw_yoy, 4),
         level   = round(r$gdp_lev, 4))
  }),
  factor_data          = lapply(seq_len(nrow(factor_df)), function(i)
    list(date = factor_df$date[i], factor = factor_df$factor[i])),
  contributions        = lapply(seq_len(nrow(contributions)), function(i)
    list(sector       = contributions$sector[i],
         contribution = contributions$contribution[i],
         sign         = contributions$sign[i])),
  indicators           = ind_out,
  international_forecasts = intl
)

# ── 8. Write JSON ─────────────────────────────────────────
out_path <- "platform/public/data/nowcast.json"
write(toJSON(result, auto_unbox = TRUE, pretty = TRUE, null = "null"), out_path)
cat(sprintf("Results exported to: %s\n", out_path))
cat("Done!\n")

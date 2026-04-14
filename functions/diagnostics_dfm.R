diagnose_dfm <- function(est_dfm, n_f = 1, p = 1, lags_lb = 12, plot = TRUE) {
  # ------------------------------------------------------------
  # Purpose:
  #   Perform diagnostic checks for a 1-factor Dynamic Factor Model (DFM)
  # Inputs:
  #   est_dfm  – object returned by estimate_dfm()
  #   n_f      – number of factors (here = 1)
  #   p        – lag order of factor VAR(p)
  #   lags_lb  – lag order for Ljung–Box test
  #   plot     – whether to show diagnostic plots
  # Output:
  #   List with summary diagnostics, residuals, and test results
  # ------------------------------------------------------------
  
  message("Running DFM diagnostics (1-factor version)...")
  
  # --- 1. Compute fitted values safely ---
  Xsmooth <- as.matrix(est_dfm$Xsmooth[, 1:n_f, drop = FALSE])
  Cmat <- as.matrix(est_dfm$C[1:n_f, , drop = FALSE])
  fitted_values <- Xsmooth %*% Cmat
  
  # observed data (exclude date)
  observed <- as.matrix(est_dfm$data[, est_dfm$model])
  min_cols <- min(ncol(fitted_values), ncol(observed))
  fitted_values <- fitted_values[, 1:min_cols, drop = FALSE]
  observed <- observed[, 1:min_cols, drop = FALSE]
  
  residuals <- observed - fitted_values
  message("✔ Residuals computed successfully.")
  
  # --- 2. Ljung–Box serial correlation test ---
  lb_results <- data.frame(
    Variable = colnames(observed),
    p_value = NA_real_
  )
  
  for (i in seq_len(ncol(residuals))) {
    series <- residuals[, i]
    if (sum(is.finite(series)) > lags_lb) {
      lb <- Box.test(series, lag = lags_lb, type = "Ljung-Box")
      lb_results$p_value[i] <- lb$p.value
    }
  }
  
  lb_results$autocorr_flag <- ifelse(lb_results$p_value < 0.05, "❌", "✅")
  
  # --- 3. Cross-sectional residual correlation ---
  Rhat <- cov(residuals, use = "pairwise.complete.obs")
  corr_R <- cor(residuals, use = "pairwise.complete.obs")
  off_diag_mean <- mean(abs(Rhat[upper.tri(Rhat)]), na.rm = TRUE)
  diag_mean <- mean(diag(Rhat), na.rm = TRUE)
  cross_corr_ratio <- off_diag_mean / diag_mean
  
  # --- 4. VAR stability (for factor transition matrix A) ---
  if (!is.null(est_dfm$A)) {
    eigvals <- eigen(est_dfm$A)$values
    max_mod <- max(Mod(eigvals))
    stable <- max_mod < 1
  } else {
    eigvals <- NA
    max_mod <- NA
    stable <- NA
  }
  
  # --- 5. Optional plots ---
  if (plot) {
    op <- par(mfrow = c(1, 2))
    hist(lb_results$p_value,
         main = "Ljung–Box p-values",
         xlab = "p-value",
         col = "lightblue", border = "white")
    plot(Re(eigvals), Im(eigvals),
         xlab = "Real part", ylab = "Imag part",
         main = "VAR Eigenvalues (Factor Stability)",
         xlim = c(-1.5, 1.5), ylim = c(-1.5, 1.5),
         pch = 19, col = "blue")
    symbols(0, 0, circles = 1, inches = FALSE, add = TRUE, lwd = 2)
    par(op)
  }
  
  # --- 6. Summary table ---
  summary_df <- data.frame(
    Diagnostic = c("VAR Stability",
                   "Avg off-diag corr ratio",
                   "Residual autocorr (p < 0.05)"),
    Result = c(
      ifelse(stable, "✅ Stable (roots < 1)", "⚠️ Possibly unstable"),
      round(cross_corr_ratio, 3),
      paste(sum(lb_results$p_value < 0.05, na.rm = TRUE), "of",
            nrow(lb_results), "series show autocorrelation")
    )
  )
  
  print(summary_df)
  
  # --- 7. Return results ---
  return(list(
    summary = summary_df,
    lb_results = lb_results,
    residual_corr_ratio = cross_corr_ratio,
    var_stability = stable,
    eigvals = eigvals,
    residuals = residuals
  ))
}

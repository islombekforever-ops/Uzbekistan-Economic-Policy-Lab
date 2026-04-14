#' @title Post-process GDP Predictions
#' @name postprocess_gdp
#' @description
#' This function post-processes predicted GDP values from a dynamic factor model (DFM) 
#' and constructs both GDP levels and growth rates for analysis and reporting. 
#' The function performs the following steps:
#'   1. Extracts quarter-on-quarter (Q1, Q2, Q3, Q4) GDP growth rate history and predictions.
#'   2. Converts GDP growth rates to percentages.
#'   3. Extends the GDP level series using quarter-on-quarter growth rate predictions.
#'   4. Computes year-on-year (YoY) GDP growth rates from the level series.
#'   5. Merges historical and predicted quarter-on-quarter growth rates into a single dataframe.
#' @author Maurizio Daniele and Heiner Mikosch
#' @param pred_dfm Data frame containing predicted GDP values from the DFM. Must include:
#'   \itemize{
#'     \item{\code{date}}{Quarter-end dates (class Date).}
#'     \item{\code{gdp}}{Quarter-on-quarter GDP growth rates, including predictions (numeric).}
#'   }
#' @return A data frame containing:
#'   \itemize{
#'     \item{\code{date}}{Quarter-end dates.}
#'     \item{\code{gdp_lev}}{GDP levels including predictions.}
#'     \item{\code{gdp_grw_yoy}}{Non-cumulative year-on-year GDP growth rates in \%, including predictions.}
#'     \item{\code{gdp_grw_qoq}}{Non-cumulative quarter-on-quarter GDP growth rates in \%, including predictions.}
#'   }
#' @export
postprocess_gdp <- function(pred_dfm){
  
  ## Get quarter-on-quarter GDP growth rate history and predictions
  gdp_grw_qoq <- pred_dfm[format(pred_dfm$date, "%m") %in% c("03","06","09","12"), c("date","gdp")]
  
  # Convert GDP to percentage growth
  gdp_grw_qoq$gdp <- gdp_grw_qoq$gdp * 100
  
  ## Get GDP level history
  gdp <- df[format(df$date, "%m") %in% c("03","06","09","12"), c("date","gdp")]
  colnames(gdp)[colnames(gdp) == "gdp"] <- "gdp_lev" # Rename to distinguish growth rates.
  
  ## Find latest non-NA GDP level and filter
  last_gdp_lev <- gdp$gdp[max(which(!is.na(gdp$gdp)))]
  last_date <- gdp$date[max(which(!is.na(gdp$gdp)))]
  gdp <- subset(gdp, date <= last_date) # Exclude NA at end of series.
  gdp_hat <- subset(gdp_grw_qoq, date > last_date) # Keep only predictions.
  colnames(gdp_hat)[colnames(gdp_hat) == "gdp"] <- "gdp_growth" # Rename to distinguish from gdp_lev.
  
  ## Extend GDP level series using growth rate predictions
  gdp_hat$gdp_lev <- NA
  prev_gdp_lev <- last_gdp_lev
  for (i in 1:nrow(gdp_hat)) {
    prev_gdp_lev <- prev_gdp_lev * (1 + gdp_hat$gdp_growth[i] / 100)
    gdp_hat$gdp_lev[i] <- prev_gdp_lev
  }
  
  ## Combine GDP level history and GDP level predictions
  gdp <- rbind(
    gdp[, c("date", "gdp_lev")],
    data.frame(date = gdp_hat$date, gdp_lev = gdp_hat$gdp_lev)
  )
  
  ## Calculate year-on-year GDP growth (in %)
  gdp$gdp_grw_yoy <- NA
  for (i in 5:nrow(gdp)) {
    gdp$gdp_grw_yoy[i] <- (gdp$gdp_lev[i] / gdp$gdp_lev[i-4] - 1) * 100
  }
  
  ## Merge gdp_grw_qoq to gdp
  colnames(gdp_grw_qoq)[colnames(gdp_grw_qoq) == "gdp"] <- "gdp_grw_qoq"
  gdp <- merge(gdp, gdp_grw_qoq, by = "date", all = TRUE)
  
  ## Function return
  return(gdp)
  
}
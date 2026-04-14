#' @title Predictions from an Estimated Dynamic Factor Model
#' @name predict_dfm
#' @description This function turns a dataset through a previously estimated 
#' dynamic factor model (DFM) to obtain predictions for all missing values in the series.
#' @note This function is an adapted/further developed version of predict_dfm.R, 
#' as downloaded from https://github.com/dhopp1/nowcastDFM on 31/03/2025.
#' #' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch.
#' @param data Matrix of variables, size (n_obs, n_variables). Must include in 
#' 1st column a series of type date, called "date", all data already stationary.
#' @param output_dfm List, the output of the \code{estimate_dfm()} function
#' @param quarters_ahead Number of quarters ahead to forecast
#' @param lag Number of lags for the Kalman filter
#' @return Dataframe with all missing values filled + predictions.
#' 
#' @export
predict_dfm <- function(data, output_dfm, months_ahead=3, lag=0) {
  
  ## Collect original variable order in data
  orig_order <- colnames(data)

  ## Sort data: first monthly variables, then quarterly variables
  output_sort_data <- sort_data(data)
  data <- output_sort_data$data # Re-resorted data
  quarterly <- output_sort_data$quarterly # Quarterly variable identifier
  
  ## Helper function to add months (to be used in next step)
  add_month <- function (x) {
    month <- as.numeric(substr(x, 6, 7))
    year <- as.numeric(substr(x, 1, 4))
    if (month == 12) {
      return (as.Date(paste0(year+1, "-01-01")))
    } else {
      return (as.Date(paste0(year, "-", month+1, "-01")))
    }
  }
  
  ## Apply add_month-function in order to add prediction quarters
  output <- data
  for (i in 1:months_ahead) {
    output[nrow(output) + 1, "date"] <- add_month(output[nrow(output), "date"])
  }

  ## Separate dates and data ("output")
  dates <- output[,"date"]
  output <- output[,2:ncol(output)]
  
  ## Prediction with constant parameters
  preds <- kalman_filter_constparams(output, output_dfm, lag=lag)$X_smooth %>% 
    data.frame
  preds$date <- dates # Add date column
  preds <- preds[,c(ncol(preds), 1:(ncol(preds)-1))] # Bring date column to first column
  colnames(preds) <- colnames(data)

  ## Function output
  return(preds)

}

## Define global variables to suppress dplyr note from devtools::check()
utils::globalVariables(c(".", "beginning", "ending",  "na_row", "row_num", "row_num_inv"))
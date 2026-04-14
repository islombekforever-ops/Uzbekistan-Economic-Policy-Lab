#' @title Calculate Growth Rate
#' @name calculate_growth
#' @description This function calculates growth rates of each series in the input data frame.
#' Growth rates close to zero are adjusted to avoid numerical issues during estimation.
#' @author Maurizio Daniele and Heiner Mikosch
#' @param data Data frame with row length n_obs and column length n_variables
#' Must include in 1st column a series of type date, called "date", formatted yyyy-mm-dd
#' @return Data frame with growth rates
#'
#' @export
calculate_growth <- function(data) {

  for (v_idx in 2:length(data)) { # Skip the first column, which contains the date vector.
    
    ## Select variable v_idx and filter only non-na observations
    var <- data[[v_idx]]
    obs_indices <- which(!is.na(var))
    observations <- var[obs_indices]
    
    ## Compute log growth rates (log-difference)
    growth <- c(NA, diff(log(observations)))
    
    ## Insert growth back into original series length
    data_growth <- rep(NA, length(var))
    data_growth[obs_indices] <- growth
    
    data[[v_idx]] <- data_growth
    
  }
  
  ## Remove first three rows to ensure consistency with start_date in setttings.R
  data <- data[-c(1:3), ]
  
  # ## Set growth rates close to zero (i.e., smaller 1e-3 in absolute values) to a 
  # # small value (+/-1e-2) to avoid numerical issues in estimation
  # data[, -1] <- lapply(data[, -1], function(x) {
  # 
  #   sel_idx <- !is.na(x) & abs(x) < 1e-3
  #   x[sel_idx] <- ifelse(x[sel_idx] == 0, 1e-2, sign(x[sel_idx]) * 1e-2)
  # 
  #   return(x)
  # })
  
  ## Function output
  return(data)
  
}
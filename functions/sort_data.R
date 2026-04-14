#' @title Re-sort Data
#' @name sort_data
#' @description This function re-sorts the data with monthly series first and 
#' quarterly series afterwards.
#' @note The function is used in estimate_dfm.m and predict_dfm. It was newly 
#' added to the function collection in order to reduce code redundancy in the 
#' aforementioned functions.
#' @author Maurizio Daniele and Heiner Mikosch 
#' @param data Data frame with row length n_obs and column length n_variables. 
#' Must include in 1st column a series of type date, called "date", formatted yyyy-mm-dd.
#' @return A \code{list} containing the following elements:
#' 
#' \item{data}{reorganized data frame.}
#' \item{quarterly}{a vector that identifies quarterly time-series (= TRUE) as compared 
#' to monthly time-series (= FALSE).}
#' 
#' @export
sort_data <- function(data){
  
  ## Function to identify quarterly variables
  is_quarterly <- function(dates, series) {
    tmp <- data.frame(dates, series) %>% dplyr::filter(!is.na(series)) %>% 
      select(dates) %>% pull
    if (identical((sapply(tmp, function(x) substr(x, 6, 7)) %>% 
                   unique %>% sort), c("03", "06", "09", "12"))) {
      return (TRUE)
    } else {
      return (FALSE)
    }
  }

  ## Apply is_quarterly-function in order to identify quarterly variables
  quarterly <- c(FALSE)
  for (i in 2:ncol(data)) {
    quarterly <- append(quarterly, is_quarterly(data[, 1], data[, i]))
  }

  ## Re-sort data and quarterly identifier
  data_resorted <- cbind(data[which(quarterly == FALSE)], data[which(quarterly == TRUE)])
  quarterly_resorted <- c(quarterly[which(quarterly == FALSE)], quarterly[which(quarterly == TRUE)])
  
  ## Function output
  return(list(data = data_resorted, quarterly = quarterly_resorted))

}
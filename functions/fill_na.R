#' @title Fill Missing Values
#' @name fill_na
#' @description This function fills missing values in standardized data using 
#' cubic spline interpolation or intermediate values and a 1-D digital filter for 
#' leading/trailing missing values. Rows with more than 80% missing values at the 
#' tails are dropped.
#' @author Authors of the original function: Fernando Cantu and Daniel Hopp.
#' Function script updated by: Maurizio Daniele and Heiner Mikosch.
#' @param X Numeric matrix or data frame of standardized data with potential missing values
#' @return A list containing:
#' \describe{
#'   \item{data_full}{Data frame with missing values replaced via spline interpolation and filtering}
#'   \item{ind_na}{Logical matrix indicating positions of missing values in the original input}
#' }
#' @importFrom signal filter
#' @importFrom pracma cubicspline
#' 
#' @export
fill_na <- function(X) {
  
  k <- 3
  
  temp <- X %>%
    mutate(na_row = ifelse(rowSums(is.na(.)) > 0.8 * ncol(X), 1, 0)) %>%
    mutate(row_num = 1:nrow(.), row_num_inv = nrow(.):1) %>%
    mutate(beginning = ifelse(cumsum(na_row) == row_num, 1, 0)) %>%
    mutate(ending = ifelse(rev(cumsum(rev(na_row))) == row_num_inv, 1, 0)) %>%
    dplyr::filter(beginning != 1 & ending != 1) %>%
    select(-(na_row:ending))
  ind_na <- is.na(temp)
  
  for (i in 1:ncol(temp)) {
    
    tempi <- temp[, i]
    ind_na_i <- is.na(tempi)
    t1 <- min(which(!is.na(tempi)))
    t2 <- max(which(!is.na(tempi)))

    if (sum(!is.na(tempi[t1:t2])) > 2) {

      tempi[t1:t2] <- cubicspline(x = which(!is.na(tempi)), y = tempi[which(!is.na(tempi))], xi = t1:t2)
      tempi[ind_na_i] = median(tempi, na.rm = T)
      tempi_MA <- signal::filter(filt = ones(2 * k + 1, 1) / (2 * k + 1), 
                                 a = 1, 
                                 x = c(tempi[1] * ones(k, 1), tempi, tempi[length(tempi)] * ones(k, 1)))
      tempi_MA <- tempi_MA[(2 * k + 1):length(tempi_MA)]
      tempi[ind_na_i] <- tempi_MA[ind_na_i] 


    } else { # If there are not enough observations to fill the missing values 
             # using cubic spline, we fill them with the mean of the variable.
      
      tempi[ind_na_i] <- mean(tempi, na.rm = T)
    
    }

    temp[, i] <- tempi
    
  }
  
  return(list(data_full = temp, ind_na = ind_na))
  
}
#' @title Read and Prepare Data
#' @name prepare_data
#' @description 
#' This function reads and preprocesses time series data from an Excel file for use in 
#' time-series analysis and forecasting. It performs the following steps:
#'   1. Reads series metadata and monthly/quarterly data from the specified Excel file.
#'   2. Merges quarterly and monthly series, aligning dates appropriately.
#'   3. Converts non-date columns to numeric and ensures proper date formatting.
#'   4. Optionally applies X-13ARIMA-SEATS seasonal adjustment to series flagged for adjustment.
#'   5. Shifts temporarily negative series to allow month-on-month growth rate computation.
#'   6. Computes month-on-month growth rates for all series.
#'   7. Performs stationarity checks (Augmented Dickey-Fuller) on the growth rates 
#'      and issues warnings for non-stationary series.
#' @author Maurizio Daniele and Heiner Mikosch
#' @param file_path Character string specifying the path to the Excel file containing the data.
#' @param start_date Character string or Date specifying the sample start date (e.g., "1970-01-01").
#'   Data prior to start_date is trimmed. A 3-month buffer is applied for growth rate computation.
#' @return A list containing:
#'   \item{meta}{Data frame with series metadata from the Excel file.}
#'   \item{df}{Data frame with cleaned and optionally seasonally adjusted levels.}
#'   \item{df_grw}{Data frame with month-on-month growth rates of the series.}
#' @export
prepare_data <- function(file_path="data/data_usa.xlsx",start_date=start_date){
  
  # selection <-  c(1,8,16,17,20,21) # c(1,2,5,8,11,12,16,17,20,21,23,24,26,29,32,39,43,44) # Variable selection
  
  ## Read series information
  meta <- suppressMessages(read_excel(file_path, sheet = "Series Information"))
  # meta <- meta[selection,] # Note: Here, element 1 of selection is quarterly GDP.
  
  ## Read monthly, weekly, and daily data
  df_monthly <- suppressMessages(read_excel(file_path, sheet = "Request Monthly"))
  df_monthly <- df_monthly[-1, ] # Remove first row (headers)
  # df_monthly <- df_monthly[, selection] # Note: Here, element 1 of selection is the date.
  
  ## Read quarterly data
  df_quarterly <- suppressMessages(read_excel(file_path, sheet = "Request Quarterly"))
  df_quarterly[[1]] <- df_quarterly[[1]] %m+% months(2) # Shift quarter recording from 1st to 
                                                        # 3rd month of quarter. E.g., for XXXXQ1: 
                                                        # from XXXX-01-01 to XXXX-03-01.
  
  ## Merge
  df <- merge(df_quarterly, df_monthly, 
              by.x = names(df_quarterly)[1], by.y = names(df_monthly)[1], # Merge by first columns (date).
              all.y = TRUE # Keep all rows from df_monthly
  )
  
  ## Assign variable names
  colnames(df) <- c("date", meta$`Code key`)

  ## Format date column
  df[[1]] <- as.Date(df[[1]], format = "%Y-%m-%d")
  
  ## Format all non-date columns as numeric
  df[ , -1] <- lapply(df[ , -1], function(x) as.numeric(as.character(x)))
  
  ## Ensure that no NAs at end
  # # Helper function
  # trim_na_rows <- function(df) {
  #   vars <- df[ , -1, drop = FALSE] # All columns except the date
  #   keep_rows <- which(rowSums(!is.na(vars)) > 0) # Rows with at least one non-NA
  #   if (length(keep_rows) == 0) {
  #     return(df[0, ])  # return empty if no data rows
  #   }
  #   first <- min(keep_rows)
  #   last  <- max(keep_rows)
  #   df[first:last, ]
  # }
  # # Run helper function
  # df <- trim_na_rows(df)
  
  ## Cut data at start_date minus 3 month
  start_date_minus_3m <- seq(as.Date(start_date), length = 2, by = "-3 month")[2]
  df <- df[df$date >= start_date_minus_3m, ] # Why start_date_minus_3m? - In order for 
                                            # period-on-period growth rate estimation 
                                            # sample (= df_grw) to start at start_date.

  ## X-13ARIMA-SEATS seasonal adjustment
  # Loop over each column (excluding date)
  for (i in 2:ncol(df)) {
    if (!is.na(meta$`Seasonal adjustment`[i-1]) && meta$`Seasonal adjustment`[i-1] == "By code") {
      
      # Build time series object
      if (meta$Frequency[i-1] == "Quarterly") {
        
        series_ts <- ts(df[[i]][!is.na(df[[i]])], start = c(year(df$date[1]), quarter(df$date[1])), frequency = 4)

      } else {
        
        series_ts <- ts(df[[i]], start = c(year(df$date[1]), month(df$date[1])), frequency = 12)
        
      }
      
      # Apply seasonal adjustment
      sa_result <- try(seas(series_ts), silent = TRUE)
      if (!inherits(sa_result, "try-error")) {
        # Convert SA series to numeric
        sa_vals <- as.numeric(final(sa_result))
        # Build a vector of same length as original, filled with NAs
        sa_aligned <- rep(NA_real_, length(df[[i]]))
        # Find non-NA positions in the original series
        non_na_idx <- which(!is.na(df[[i]]))
        # Insert the adjusted values in the right places
        sa_aligned[non_na_idx] <- sa_vals
        # Replace column with aligned SA series
        df[[i]] <- sa_aligned
      } else {
        warning(paste("Seasonal adjustment failed for column:", colnames(df)[i]))
      }
    }
  }

  # ## Adjust temporarily negative series before calculating month-on-month growth rates
  if (file_path == "data/data_usa.xlsx") {
    # 3-month interest rate
    c <- abs(min(df$ir3m, na.rm=T)) + 0.01
    df$ir3m <- df$ir3m + c
    # Financial conditions index
    c <- abs(min(df$financialcond, na.rm=T)) + 0.01
    df$financialcond <- df$financialcond + c
    
  }

  ## Calculate month-on-month growth rates
  df_grw <- calculate_growth(df)
  
  ## Stationarity checks
  # Initalize
  is_stationary <- rep(FALSE, ncol(df_grw)-1)
  for (i in 2:ncol(df_grw)) {
    # Augmented Dickey-Fuller test
    adf_result <- ur.df(df_grw[i][!is.na(df_grw[i])], type = "drift", selectlags = "BIC")
    # Compare test statistic to 5% critical value for tau2 test
    is_stationary[i-1] <- adf_result@teststat[1,"tau2"] < adf_result@cval["tau2","5pct"]
  }
  # Print warning if variables not stationary
  if (any(!is_stationary)) {
    warning(paste0("The following variables are not stationary: ", paste(colnames(df_grw)[2:length(colnames(df_grw))][!is_stationary], collapse = ", ")))
  }
  
  ## Function return
  return(list(meta=meta, df=df, df_grw=df_grw))

}
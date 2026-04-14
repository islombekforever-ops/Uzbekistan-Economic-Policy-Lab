
rm(list = ls()) # Clear memory.
cat("\014")  # Clear console.
start_time <- proc.time() # Start runtime measurement.

# ==============================================================================
# DFM Code Template for Short-term Forecasting Model for Economic Activity 
# Maurizio Daniele and Heiner Mikosch
# This version: 9 October 2025
# ==============================================================================


# Notes ------------------------------------------------------------------------

# Ensure the working directory is set to the location of main.R (e.g., .../code).
# In RStudio, this can be done via "Session" > "Set Working Directory" > 
# "To Source File Location".


# Libraries and function sourcing ----------------------------------------------

## Load libraries
 # Note: Do not load nowcastDFM package! We use modified function versions, sourced below.
library(readxl)
library(dplyr) # For pull function in sort_data.r.  
library(pracma) # For cubicspline function in init_conds.R.
library(Matrix) # Used in estimate_dfm.R.
library(zoo)
library(purrr)
library(lubridate) # For quarter function in predict_dfm.R.
library(tidyr)
library(signal) # Used in fill_na function.
library(seasonal) # For X-13ARIMA-SEATS seasonal adjustment.
library(urca) # For ADF-Test
library(rmarkdown) # For PDF report
library(ggplot2)

## Source functions
list.files(path = "functions", pattern = "\\.R$", full.names = TRUE) %>%
  walk(source)


# Settings ---------------------------------------------------------------------

## Source settings
source("settings.R")


# Preparations -----------------------------------------------------------------

## Read and prepare data
res <- prepare_data(file_path="data/data_uzbekistan.xlsx",start_date=start_date) # file_path="data/data_usa.xlsx 
meta <- res$meta # Meta information
df <- res$df # Dataset in levels
df_grw <- res$df_grw # Dataset in growth rates

## Factor block loading structure
blocks <- matrix(1,nrow=ncol(df)-1,ncol=n_f)

    
# Estimate mixed-frequency DFM -------------------------------------------------

## Run estimation function
est_dfm <- estimate_dfm(df_grw, blocks = NA, p = 1, max_iter = 200, threshold = 1e-05) 
                                                 # Note: max_iter=10 is for testing only. 
                                                 # Use substantially more iterations for 
                                                 # serious nowcast runs (default: max_iter=5000).


# Create predictions -----------------------------------------------------------

## Run prediction function
pred_dfm <- predict_dfm(df_grw, est_dfm, months_ahead, lag = 0)


# Post-process -----------------------------------------------------------------

## Run GDP postprocessing function
gdp <- postprocess_gdp(pred_dfm)


# Create PDF report ------------------------------------------------------------

rmarkdown::render(
  input = "functions/report.Rmd",
  output_file = "../output/report.pdf",
  envir = globalenv() # Makes all objects in main.R available.
)

# Save results  ----------------------------------------------------------------

## Save estimation and prediction results to RData file
save(est_dfm, pred_dfm, file = "output/results.RData")

## End runtime measurement
end_time <- proc.time()
cat("Total runtime:", (end_time - start_time)[3], "seconds\n")

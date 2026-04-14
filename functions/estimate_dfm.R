#' @title Estimating a Dynamic Factor Model Using the EM Method
#' @name estimate_dfm
#' @description Runs a dynamic factor model (DFM) on the transformed data at a 
#' certain data vintage. Your data may not be able to be estimated on due to issues 
#' with invertible matrices, etc. If you get errors like "non-invertible" or 
#' "not a matrix", try reordering the columns in your dataframe, or adding or 
#' removing variables from it. It uses an implementation through the EM algorithm. 
#' It relies on several functions to determine initial values, calculate the 
#' nowcaKF, the sequence of steps of the EM algorithm and criteria to determine convergence.
#' @note This function is an adapted/further developed version of dfm.R, as downloaded 
#' from https://github.com/dhopp1/nowcastDFM on 31/03/2025.
#' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch. 
#' @param data Matrix of variables, size (n_obs, n_variables). Must include in 
#' 1st column a series of type date, called "date", all data already stationary.
#' @param blocks Dataframe, size (n_variables, n_blocks). Note: Do not include date 
#' column in n_variables. Matrix of 1s or 0s for block loadings, i.e., 1 = included 
#' in block. Default is one global block containing all variables.
#' @param p Number of lags in transition equation (AR element)
#' @param max_iter Maximum number of iterations for EM (if no convergence)
#' @param threshold Threshold for convergence of EM loop
#' @return A \code{list} containing the following elements:
#' 
#' \item{Xsmooth_std}{Standardized Kalman-smoothed data where missing values are 
#' replaced by their expectation.}
#' \item{Xsmooth}{Kalman-smoothed data where missing values are replaced by their 
#' expectation. In original input units.}
#' \item{Z}{Smoothed states, rows give time, and columns are organized according to matrix C.}
#' \item{C}{Measurement matrix, rows correspond to each series, and the columns 
#' are organized as follows: For example, columns 1-20 give the factor loadings. 
#' For example, columns 1-5 give loadings for the first, and are organized in 
#' reverse-chronological order (f^G_t, f^G_t-1, f^G_t-2, f^G_t-3, f^G_t-4), 
#' columns 6-10, 11-15, and 16-20 give loadings for the second, third, and fourth 
#' blocks respectively.}
#' \item{R}{Covariance for measurement matrix residuals.}
#' \item{A}{Transition matrix, a square matrix that follows the same organization 
#' scheme as matrix C's columns. Identity matrices are used to account for matching 
#' terms on the left- and right-hand side. For example, we place an I4 matrix to 
#' account for matching (f_t-1; f_t-2; f_t-3; f_t-4) terms.}
#' \item{Q}{Covariance for transition equation residuals.}
#' \item{means}{Means of each column.}
#' \item{sdevs}{Standard deviations of each column.}
#' \item{Z0}{Initial value of state.}
#' \item{V0}{Initial value of covariance matrix.}
#' \item{p}{Number of lags in transition equation (AR element).}
#' \item{model}{Names of features input to the model.}
#' \item{blocks}{Same as parameter passed in.}
#' \item{num_vars}{Number of features estimated in the model.}
#' \item{num_iter}{Number of iterations for log likelihood to converge or hit maximum.}
#' \item{convergence}{1 if algorithm converged successfully (given max_iter).}
#' \item{loglik}{Log likelihood of last iteration.}
#' \item{LL}{Sequence of log likelihoods per iteration.}
#' \item{data}{Data passed to the model.}
#' 
#' @export
estimate_dfm <- function(data, blocks=NA, p=1, max_iter=5000, threshold=1e-5) {

  ## Store original data
  orig_data <- data
  
  ## Default one global block
  if (is.na(blocks)[1]) {
    blocks <- matrix(1, ncol = 1, nrow = ncol(data) - 1)
  }
  
  # Sort data: first monthly variables, then quarterly variables
  output_sort_data <- sort_data(data)
  data <- output_sort_data$data
  quarterly <- output_sort_data$quarterly

  ## Drop date column
  data <- data[, 2:ncol(data)]
  quarterly <- quarterly[2:length(quarterly)]
  
  ## Identify monthly (= 1) and quarterly (= 0) variables
  index_freq <- as.integer(!quarterly)

  ## Obtain the characteristics of the model
  num_obs <- nrow(data)
  nM <- sum(!quarterly)
  nQ <- sum(quarterly)
  num_blocks <- ncol(blocks)

  ## Quarterly-monthly dis-aggregation scheme
  R_mat = matrix(c(2, 3, 2, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1), ncol = 5)
  q <- zeros(4, 1)

  ## Standardize data
  means <- as.data.frame(t(sapply(data, function(x)
    if (sum(!is.na(
      x
    )) > 1)
      mean(x, na.rm = T)
    else
      0))) # Calculate mean only if more than one non-NA value is available, otherwise set mean to 0.
  sdevs <- as.data.frame(t(sapply(data, function(x)
    if ((sum(!is.na(x)) > 1) && (length(unique(x)[!is.na(unique(x))]) > 1) && (sum(abs(x) <= 1e-4, na.rm = T) == 0)) 
      sd(x, na.rm = T)
    else
      1))) # Calculate sd only if more than one non-NA value is available, otherwise set sd to 1.
  data_std <- data %>% mutate_all( ~ {
    if ((sum(!is.na(.)) > 1) && (length(unique(.)[!is.na(unique(.))]) > 1)  && (sum(abs(.) <= 1e-4, na.rm = T) == 0))
      scale(.)
    else
      .
  }) # Scale variables only if more than one non-NA value is available.

  ## Calculate initial values
  init <- init_conds(data_std, p, blocks, R_mat, q, nM, nQ, index_freq)
  A <- init$A; C <- init$C; Q <- init$Q; R <- init$R; Z0 <- init$Z0; V0 <- init$V0
  
  ## Initialize EM loop values
  prev_loglik <- -1e6
  num_iter <- 0
  LL <- -1e6
  converged <- 0
  y <- t(data_std) # y for the estimation is WITH missing data.
  
  ## Prepare data for EM loop: remove the leading and ending NAs
  y_est <- data_std %>%
    mutate(na_row = ifelse(rowSums(is.na(.)) == ncol(.), 1, 0)) %>%
    mutate(row_num = 1:nrow(.), row_num_inv = nrow(.):1) %>%
    mutate(beginning = ifelse(cumsum(na_row) == row_num, 1, 0)) %>%
    mutate(ending = ifelse(rev(cumsum(rev(na_row))) == row_num_inv, 1, 0)) %>%
    dplyr::filter(beginning != 1 & ending != 1) %>%
    select(-(na_row:ending)) %>%
    t(.)
  
  ## Model in a nutshell
  # The model can be written as
  # y = C*Z + e;
  # Z = A*Z(-1) + v
  # where y is NxT, Z is (pr)xT, etc.
  
  ## EM loop
  while(!converged & num_iter <= max_iter) {
    em_output <- EM_step(y_est, A, C, Q, R, Z0, V0, p, blocks, R_mat, q, nM, nQ, index_freq)
    A <- em_output$A_new; C <- em_output$C_new; Q <- em_output$Q_new; R <- em_output$R_new
    Z0 <- em_output$Z0; V0 <- em_output$V0; loglik <- em_output$loglik
    
    em_conv <- EM_convergence(loglik, prev_loglik, threshold)
    converged <- em_conv$converged
    
    if ((mod(num_iter, 20) == 0) & (num_iter > 0)) { # Print a message every 20 iterations
      message("Now running iteration number ", num_iter, " out of a maximum of ", max_iter)
      message("Loglik: ", sprintf("%.4f", loglik), "; % change: ", 
              sprintf("%.4f", 100 * (loglik - prev_loglik)/prev_loglik), "%")
    }
    
    LL <- c(LL, loglik)
    prev_loglik <- loglik
    num_iter <- num_iter + 1
    
  }
  
  ## Final run of the Kalman filter
  kf_output <- kalman_filter(y, A, C, Q, R, Z0, V0)
  Zsmooth <- t(kf_output$Zsmooth)
  Xsmooth_std <- Zsmooth[2:nrow(Zsmooth), ] %*% t(C)
  
  ## Create list with the results
  nowcast <- list()
  nowcast$Xsmooth_std <- Xsmooth_std
  nowcast$Xsmooth <- repmat(as.numeric(sdevs), num_obs, 1) * Xsmooth_std + repmat(as.numeric(means), num_obs, 1)
  nowcast$Z <- Zsmooth[2:nrow(Zsmooth), ]
  nowcast$C <- C
  nowcast$R <- R
  nowcast$A <- A
  nowcast$Q <- Q
  nowcast$means <- means
  nowcast$sdevs <- sdevs
  nowcast$Z0 <- Z0
  nowcast$V0 <- V0
  nowcast$p <- p
  nowcast$model <- colnames(data)[1:length(colnames(data))]
  nowcast$blocks <- blocks
  nowcast$num_vars <- nM + nQ
  nowcast$num_iter <- num_iter
  nowcast$convergence <- converged
  nowcast$loglik <- loglik
  nowcast$LL <- LL[2:length(LL)]
  nowcast$data <- orig_data
  
  ## Return function output
  return(nowcast)
  
}

## Define global variables to suppress dplyr note from devtools::check()
utils::globalVariables(c(".", "beginning", "ending",  "na_row", "row_num", "row_num_inv")) 
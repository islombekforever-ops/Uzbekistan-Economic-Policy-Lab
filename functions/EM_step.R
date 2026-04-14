#' @title EM Algorithm Step for State-Space Model
#' @name EM_step
#' @description This function performs one iteration of the EM algorithm 
#' for estimating parameters in a dynamic factor model with missing data. It includes:
#' \itemize{
#' \item E-step: Computes the expected value of the log-likelihood given current parameter estimates.
#' \item M-step: Maximizes the expected log-likelihood with respect to the parameters.
#' }
#' @note The implementation is based on Marta Banbura and Michele Modugno (2010): 
#' Maximum Likelihood Estimation of Factor Models on Data Sets with Arbitrary Pattern 
#' of Missing Data, ECB Working Paper Series, No. 1189, European Central Bank. The
#' paper has been published in the Journal of Applied Econometrics, 29(1), 
#' pp. 133-160, 2014. It builds on previous work by Catherine Doz, Domenico Giannone, 
#' and Lucrezia Reichlin (2012): A Quasi-Maximum Likelihood Approach for Large, 
#' Approximate Dynamic Factor Models, Review of Economics and Statistics, 94(4), 
#' pp. 1014–1024. Versions of this model figure in, for example, Marta Banbura,
#' Domenico Giannone, and Lucrezia Reichlin (2011): Nowcasting, in: The Oxford 
#' Handbook on Economic Forecasting, edited by M. P. Clements, and D. F. Hendry, 
#' pp. 193–224. Oxford, UK: Oxford University Press and Brandyn Bok, Daniele Caratelli,
#' Domenico Giannone, Argia M. Sbordone, and Andrea Tambalotti (2018) Macroeconomic 
#' Nowcasting and Forecasting With Big Data, Annual Review of Economics 10, pp. 615–643.
#' The paper Banbura, Giannone, and Mudogno (2010) referenced in the below code
#' is the working paper version (ECARES Working Paper, 2010-021) of Banbura, 
#' Giannone, and Mudogno (2011).
#' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch. 
#' @param y Numeric matrix of standardized data
#' @param A Current estimate of the transition matrix
#' @param C Current estimate of the measurement matrix
#' @param Q Current estimate of the transition equation residual covariance matrix
#' @param R Current estimate of the measurement equation residual covariance matrix
#' @param Z0 Initial value of the state vector
#' @param V0 Initial value of the state covariance matrix
#' @param p Number of lags in the transition equation
#' @param blocks Structure defining the block configuration of the observed variables
#' @param R_mat Structure for imposing constraints on quarterly variables (e.g., aggregation "tent")
#' @param q Constraints on factor loadings
#' @param nM Number of monthly variables
#' @param nQ Number of quarterly variables
#' @param index_freq Vector indicating variable frequency (\code{1} for monthly, \code{0} for quarterly).
#' @return A list containing:
#' \describe{
#'   \item{A_new}{Updated transition matrix.}
#'   \item{C_new}{Updated measurement matrix.}
#'   \item{Q_new}{Updated covariance matrix for the transition equation residuals.}
#'   \item{R_new}{Updated covariance matrix for the measurement equation residuals.}
#'   \item{Z0}{Updated initial state vector.}
#'   \item{V0}{Updated initial state covariance matrix.}
#'   \item{loglik}{Log-likelihood value for the current iteration.}
#' }
#' @importFrom pracma inv kron blkdiag
#'
#' @export
EM_step <- function(y, A, C, Q, R, Z0, V0, p, blocks, R_mat, q, nM, nQ, index_freq) {
  
  ## Initialize preliminary values
  n <- dim(y)[1]
  nobs <- dim(y)[2]
  pC <- dim(R_mat)[2]
  ppC <- max(p, pC)
  num_blocks <- dim(blocks)[2]
  
  
  # ESTIMATION STEP: Compute the (expected) sufficient statistics for a single KF sequence -----
  
  ## Run the KF and smoother with current parameters
    # Note that log-liklihood is not re-estimated after the kalman_filter step. 
    # This effectively gives the previous iteration's log-likelihood
  output <- kalman_filter(y, A, C, Q, R, Z0, V0)
  Zsmooth <- output$Zsmooth; Vsmooth <- output$Vsmooth; VVsmooth <- output$VVsmooth; loglik <- output$loglik
  

  # MAXIMIZATION STEP (TRANSITION EQUATION) ------------------------------------
  
  # Note: See Banbura and Modugno (2010) for details.

  ## Initialize output
  A_new <- A
  Q_new <- Q
  V0_new <- V0
  
  ### 2A. Update factor parameters individually
  
  for (i in 1:num_blocks) {  # Loop for each block: factors are uncorrelated
    ## Setup indexing
    p1 <- (i - 1) * ppC
    b_subset <- (p1 + 1):(p1 + p)  # Subset blocks: Helps for subsetting Zsmooth, Vsmooth
    t_start <- p1 + 1              # Transition matrix factor idx start
    t_end <- p1 + ppC              # Transition matrix factor idx end
    
    ## Estimate factor portion of Q, A. Note: EZZ, EZZ_BB, EZZ_FB are parts of equations 6 and 8 in BM 2010
    # E[f_t * f_t' | Omega_T]
    EZZ <- Zsmooth[b_subset, 2:ncol(Zsmooth), drop = FALSE] %*% t(Zsmooth[b_subset, 2:ncol(Zsmooth), drop = FALSE]) +
      rowSums(Vsmooth[b_subset, b_subset, 2:dim(Vsmooth)[3], drop = FALSE], dims = 2)
    # E[f_{t-1} * f_{t-1}' | Omega_T]
    EZZ_BB <- Zsmooth[b_subset, 1:(ncol(Zsmooth)-1), drop = FALSE] %*% t(Zsmooth[b_subset, 1:(ncol(Zsmooth)-1), drop = FALSE]) +
      rowSums(Vsmooth[b_subset, b_subset, 1:(dim(Vsmooth)[3]-1), drop = FALSE], dims = 2)
    # E[f_t * f_{t-1}' | Omega_T]
    EZZ_FB <- Zsmooth[b_subset, 2:ncol(Zsmooth), drop = FALSE] %*% t(Zsmooth[b_subset, 1:(ncol(Zsmooth)-1), drop = FALSE]) +
      rowSums(VVsmooth[b_subset, b_subset, , drop = FALSE], dims = 2)
    # Select transition matrix/covariance matrix for block i
    Ai <- A[t_start:t_end, t_start:t_end]
    Qi <- Q[t_start:t_end, t_start:t_end]
    # Equation 6: Estimate VAR(p) for factor
    Ai[1, 1:p] <- EZZ_FB[1, 1:p] %*% inv(as.matrix(EZZ_BB[1:p, 1:p]))
    # Equation 8: Covariance matrix of residuals of VAR
    Qi[1, 1] <- (EZZ[1, 1] - Ai[1, 1:p] %*% EZZ_FB[1, 1:p]) / nobs
    # Place updated results in output matrix
    A_new[t_start:t_end, t_start:t_end] <- Ai
    Q_new[t_start:t_end, t_start:t_end] <- Qi
    V0_new[t_start:t_end, t_start:t_end] <- Vsmooth[t_start:t_end, t_start:t_end, 1]
  }
  
  ### 2B. Update parameters for idiosyncratic component
  
  rp1 <- num_blocks * ppC           # Col size of factor portion
  niM <- sum(index_freq[1:nM])      # Number of monthly values
  t_start <- rp1 + 1                # Start of idiosyncratic component index
  i_subset <- t_start:(rp1 + niM)   # Gives indices for monthly idiosyncratic component values
  
  ## The three equations below estimate the idiosyncratic component (for eqns 6, 8 BM 2010)
  # E[f_t * f_t' | \Omega_T]
  EZZ <- diag(diag(Zsmooth[t_start:nrow(Zsmooth), 2:ncol(Zsmooth)] %*% 
                     t(Zsmooth[t_start:nrow(Zsmooth), 2:ncol(Zsmooth)])) + 
                diag(rowSums(Vsmooth[t_start:dim(Vsmooth)[1], t_start:dim(Vsmooth)[2], 2:dim(Vsmooth)[3], 
                                     drop = FALSE], dims = 2)))
  # E[f_{t-1} * f_{t-1}' | \Omega_T]
  EZZ_BB <- diag(diag(Zsmooth[t_start:nrow(Zsmooth), 1:(ncol(Zsmooth)-1)] %*% 
                        t(Zsmooth[t_start:nrow(Zsmooth), 1:(ncol(Zsmooth)-1)])) + 
                   diag(rowSums(Vsmooth[t_start:dim(Vsmooth)[1], t_start:dim(Vsmooth)[2], 1:(dim(Vsmooth)[3]-1), 
                                        drop = FALSE], dims = 2)))
  # E[f_t * f_{t-1}' | \Omega_T]
  EZZ_FB <- diag(diag(Zsmooth[t_start:nrow(Zsmooth), 2:ncol(Zsmooth)] %*% 
                        t(Zsmooth[t_start:nrow(Zsmooth), 1:(ncol(Zsmooth)-1)])) + 
                   diag(rowSums(VVsmooth[t_start:dim(Vsmooth)[1], t_start:dim(Vsmooth)[2], , 
                                         drop = FALSE], dims = 2)))
  ## Equation 6
  Ai <- EZZ_FB %*% diag(1 / diag(EZZ_BB))  
  ## Equation 8
  Qi <- (EZZ - Ai %*% t(EZZ_FB)) / nobs   
  ## Place updated results in output matrix
  A_new[i_subset, i_subset] = Ai[1:niM, 1:niM]
  Q_new[i_subset, i_subset] = Qi[1:niM, 1:niM]
  V0_new[i_subset, i_subset] = diag(diag(Vsmooth[i_subset, i_subset, 1]))
  
  ### 3. Maximization step (measurement equation)
  
  ## Initialization and setup
  Z0 <- Zsmooth[, 1]
  ## Set missing data series values to 0
  na_y <- is.na(y)
  y[na_y] <- 0
  ## Loadings
  C_new <- C
  ## Blocks
  bl <- unique(blocks)    # Gives unique loadings
  n_bl <- dim(bl)[1]      # Number of unique loadings
  ## Initialize indices: these later help with subsetting
  bl_idxM <- list()   # Indicator for monthly factor loadings
  bl_idxQ <- list()   # Indicator for quarterly factor loadings
  R_con <- list()     # Block diagonal matrix giving monthly-quarterly aggreg scheme
  q_con <- list()
  ## Loop through each block
  for (i in 1:num_blocks) {
    bl_idxQ[[i]] <- repmat(as.matrix(bl[, i]), 1, ppC)
    bl_idxM[[i]] <- cbind(repmat(as.matrix(bl[, i]), 1, 1), zeros(n_bl, ppC - 1))
    R_con[[i]] <- R_mat
    q_con[[i]] <- zeros(dim(R_mat)[1], 1)
  }
  bl_idxQ <- do.call(cbind, bl_idxQ)
  bl_idxQ <- matrix(as.logical(bl_idxQ), nrow = n_bl)
  bl_idxM <- do.call(cbind, bl_idxM)
  bl_idxM <- matrix(as.logical(bl_idxM), nrow = n_bl)
  R_con <- do.call(blkdiag, R_con)
  q_con <- do.call(rbind, q_con)
  ## Indicator for monthly/quarterly blocks in measurement matrix
  index_freq_M <- index_freq[1:nM]       # Gives 1 for monthly series
  n_index_M <- length(index_freq_M)      # Number of monthly series
  c_index_freq <- cumsum(index_freq)     # Cumulative number of monthly series
  ## Loop through unique loadings
  for (i in 1:n_bl) {   
    bl_i <- bl[i, ]
    rs <- sum(bl_i)   # Total num of blocks loaded
    idx_i <- which(apply(blocks, 1, function(x) all(x == bl_i)))   # Indices for bl_i
    idx_iM <- idx_i[idx_i < nM + 1]  # Only monthly
    n_i <- length(idx_iM)  # Number of monthly series
    ## Initialize sums in equation 13 of Banbura, Gianonne, Reichlin (2010)
    denom <- zeros(n_i * rs, n_i * rs)
    nom <- zeros(n_i, rs)
    ## Store monthly indicies. These are done for input robustness
    index_freq_i <- index_freq_M[idx_iM]
    index_freq_ii <- c_index_freq[idx_iM]
    index_freq_ii <- index_freq_ii[as.logical(index_freq_i)]
    ## Update monthly variables: loop through each period
      # Note: Because of nonconfirming matricess in R (but OK in Octave), it is first 
      # done for t = 1, and the rest after.
    t <- 1  
    Wt <- diag(!na_y[idx_iM, t], nrow = length(idx_iM)) * 1  # Gives selection matrix (TRUE for nonmissing values)
      bl_idxM_ext <- c(bl_idxM[i, ], rep(FALSE, nrow(Zsmooth) - ncol(bl_idxM)))
      # E[f_t * t_t' | Omega_T]
      denom <- kron(Zsmooth[bl_idxM_ext, t + 1] %*% t(Zsmooth[bl_idxM_ext, t + 1]) +
                              Vsmooth[bl_idxM_ext, bl_idxM_ext, t + 1], Wt)
      # E[y_t * f_t' | Omega_T]
      nom <- y[idx_iM, t] %*% t(Zsmooth[bl_idxM_ext, t + 1]) -
        Wt[, as.logical(index_freq_i)] %*% (Zsmooth[rp1 + index_freq_ii, t + 1] %*% t(Zsmooth[bl_idxM_ext, t + 1]) +
                                              Vsmooth[rp1 + index_freq_ii, bl_idxM_ext, t + 1])
    for (t in 2:nobs) {
      Wt <- diag(!na_y[idx_iM, t], nrow = length(idx_iM)) * 1    # Gives selection matrix (TRUE for nonmissing values)
      bl_idxM_ext <- c(bl_idxM[i, ], rep(FALSE, nrow(Zsmooth) - ncol(bl_idxM)))
      # E[f_t * t_t' | Omega_T]
      denom <- denom + kron(Zsmooth[bl_idxM_ext, t + 1] %*% t(Zsmooth[bl_idxM_ext, t + 1]) +
                              Vsmooth[bl_idxM_ext, bl_idxM_ext, t + 1], Wt)
      # E[y_t * f_t' | Omega_T]
      nom <- nom + y[idx_iM, t] %*% t(Zsmooth[bl_idxM_ext, t + 1]) -
        Wt[, as.logical(index_freq_i)] %*% (Zsmooth[rp1 + index_freq_ii, t + 1] %*% t(Zsmooth[bl_idxM_ext, t + 1]) +
                                              Vsmooth[rp1 + index_freq_ii, bl_idxM_ext, t + 1])
    }
    vec_C <- inv(denom) %*% as.vector(nom)    # Banbura, Gianonne, Reichlin (2010), equation 13 
    ## Place updated monthly results in output matrix
    C_new[idx_iM, bl_idxM_ext] <- matrix(vec_C, nrow= n_i, ncol = rs)
    ## Update monthly variables
    idx_iQ <- idx_i[idx_i > nM]  # Index for monthly series
    rps <- rs * ppC
    ## Monthly-quarterly aggregation scheme
    R_con_i <- R_con[, bl_idxQ[i, ]]
    q_con_i <- q_con
    no_c <- apply(R_con_i, 1, function(x) any(x != 0))
    R_con_i <- R_con_i[no_c, ]
    q_con_i <- q_con_i[no_c, ]
    ## Loop through quarterly series in loading, this parallels monthly code
    for (j in idx_iQ) {
      ## Initialization
      denom <- zeros(rps, rps)
      nom <- zeros(1, rps)
      idx_jQ <- j - nM    # Ordinal position of monthly variable
      ## Location of factor structure corresponding to monthly variable residuals
      index_freq_jQ <- (rp1 + n_index_M + 5 * (idx_jQ - 1) + 1):(rp1 + n_index_M + 5 * idx_jQ)
      ## Place monthly values in output matrix
      V0_new[index_freq_jQ, index_freq_jQ] <- Vsmooth[index_freq_jQ, index_freq_jQ, 1]
      A_new[index_freq_jQ[1], index_freq_jQ[1]] <- Ai[index_freq_jQ[1] - rp1, index_freq_jQ[1] - rp1]
      Q_new[index_freq_jQ[1], index_freq_jQ[1]] <- Qi[index_freq_jQ[1] - rp1, index_freq_jQ[1] - rp1]
      ## Update quarterly variables: loop through each period
      for (t in 1:nobs) {
        Wt <- as.logical(!na_y[j, t]) * 1   # Selection matrix for quarterly values
        ## Intermediate steps in Banbura, Gianonne, Reichlin (2010), equation 13
        bl_idxQ_ext <- c(bl_idxQ[i, ], rep(FALSE, nrow(Zsmooth) - ncol(bl_idxQ)))
        denom <- denom + kron(Zsmooth[bl_idxQ_ext, t + 1] %*% t(Zsmooth[bl_idxQ_ext, t + 1]) + 
                                Vsmooth[bl_idxQ_ext, bl_idxQ_ext, t + 1], Wt)
        nom <- nom + y[j, t] %*% t(Zsmooth[bl_idxQ_ext, t + 1])
        nom <- nom - Wt %*% (c(1, 2, 3, 2, 1) %*% Zsmooth[index_freq_jQ, t + 1] %*% t(Zsmooth[bl_idxQ_ext, t + 1]) + 
                               c(1, 2, 3, 2, 1) %*% Vsmooth[index_freq_jQ, bl_idxQ_ext, t + 1])
      }
      C_i <- inv(denom) %*% t(nom)
      ## Banbura, Gianonne, Reichlin (2010), equation 13
      C_i_constr <- C_i - inv(denom) %*% t(R_con_i) %*% inv(R_con_i %*% inv(denom) %*% t(R_con_i)) %*% 
        (R_con_i %*% C_i - q_con_i)
      ## Place updated values in output structure
      C_new[j, bl_idxQ_ext] <- C_i_constr
    }
  }
  
  ### 3B. Update covariance of residuals for measurement equation
  
  ## Initialize covariance of residuals of observation equation
  R_new   <- matrix(0, n, n)
  Ct      <- t(C_new)
  for (t in 1:nobs) {
    ## Banbura, Gianonne, Reichlin (2010), equation 15
    obs_idx <- which(!na_y[, t])
    miss_idx <- which(na_y[, t])
    C_obs   <- C_new[obs_idx, , drop = FALSE]
    
    # residual
    res      <- numeric(n)
    res[obs_idx] <- y[obs_idx, t] - (C_obs %*% Zsmooth[, t + 1])
    R_new   <- R_new + tcrossprod(res)
    
    # state‐covariance term
    R_new[obs_idx, obs_idx] <- R_new[obs_idx, obs_idx] +
      C_obs %*% Vsmooth[, , t + 1] %*% Ct[ , obs_idx, drop = FALSE]
    
    # missing‐data adjustment
    if (length(miss_idx) > 0) {
      R_new[miss_idx, miss_idx] <-
        R_new[miss_idx, miss_idx] + R[miss_idx, miss_idx]
    }
  }
  
  R_new <- R_new / T
  RR <- diag(R_new)  # RR[RR < 1e-2] <- 1e-2
  RR[as.logical(index_freq)] <- 1e-04  # Ensure non-zero measurement error (see Doz, Giannone, Reichlin (2012) for reference).
  RR[(nM + 1):length(RR)] <- 1e-04
  R_new <- diag(RR)
  
  
  ## Return function output
  return(list(A_new = A_new, C_new = C_new, Q_new = Q_new, R_new = R_new, Z0 = Z0, V0 = V0, loglik = loglik))
  
}   
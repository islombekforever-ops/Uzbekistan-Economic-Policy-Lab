#' @title Kalman Filter with Constant Parameters
#' @name kalman_filter_constparams
#' @description This function applies the Kalman filter and smoother to a given 
#' data matrix using previously estimated model parameters. It is used in the
#' prediction step where parameters are fixed, and it focuses on out-of-sample
#' predicting and imputing missing historical data rather than estimation.
#' #' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch
#' @param data Numeric matrix of transformed (but not standardized) time series 
#' data, potentially with missing values
#' @param params List of model parameters from a previously estimated DFM.
#' @param lag Integer specifying the number of lags in the state-space model
#' @return A list containing:
#' \describe{
#'   \item{Plag}{smoothed lagged factor covariance matrices for the transition equation}
#'   \item{Vsmooth}{smoothed factor covariance matrices}
#'   \item{X_smooth}{data matrix reconstructed using the smoothed state estimates}
#'   \item{F}{smoothed latent factors.}
#' }
#' @importFrom pracma inv pinv
#'
#' @export
kalman_filter_constparams <- function(data, params, lag) {
  
  # Apply Kalman filter --------------------------------------------------------
  
  ## Initialise
  # Extract model parameters into matrices
  Z0 <- Matrix(params$Z0)
  V0 <- Matrix(params$V0)
  A <- Matrix(params$A)
  C <- Matrix(params$C)
  Q <- Matrix(params$Q)
  R <- Matrix(params$R)
  means <- params$means
  sdevs <- params$sdevs
  # Standardize data and transpose
  T <- dim(data)[1]
  y <- t((data - repmat(as.numeric(means), T, 1)) / repmat(as.numeric(sdevs), T, 1))
  m <- dim(C)[2]
  # Preallocate storage
  nobs <- dim(y)[2]
  Zm  <- Matrix(NA_real_, m, nobs)       # Z_t | t-1 (prior)
  Vm  <- vector("list", nobs)      # V_t | t-1 (prior)
  ZmU <- Matrix(NA_real_, m, nobs + 1)   # Z_t | t (posterior/updated)
  VmU <- vector("list", nobs+1)    # V_t | t (posterior/updated)
  ZmT <- Matrix(0, m, nobs+1)      # Z_t | T (smoothed states)
  VmT <- vector("list", nobs+1)    # V_t | T = Cov(Z_t|T) (smoothed factor covariance)
  VmT_lag <- vector("list", nobs)  # Cov(Z_t, Z_t-1|T) (smoothed lag 1 factor covariance)
  loglik <- 0
  
  # Precompute invariants
  At   <- t(A)
  I_m <- Diagonal(m)
  
  ## Initial values
  Zu <- Z0    # Z_0|0 (In loop, Zu gives Z_t | t)
  Vu <- V0    # V_0|0 (In loop, Vu gives V_t | t)
  ZmU[, 1, drop = FALSE] <- Zu
  VmU[[1]] <- Vu
  
  ### Kalman filter
  for (t in 1:nobs) {
    
    ## Prediction step: Calculate prior distribution
    # Use transition eqn to create prior estimate for factor, i.e. Z = Z_t|t-1
    Z <- A %*% Zu
    # Prior covariance matrix of Z (i.e. V = V_t|t-1):
    # Var(Z) = Var(A*Z + u_t) = Var(A*Z) + Var(\epsilon) = A*Vu*A' + Q
    V <- A %*% Vu %*% At + Q
    V <- 0.5 * (V + t(V))  # Trick to make symmetric
    
    ## Update step: Calculate posterior distribution
    # Remove missing series: These are removed from Y, C, and R
    obs_t <- !is.na(y[,t])
    if (!any(obs_t)) { # Keep prediction if there are no new data
      Zu <- Z
      Vu <- V
    } else {
      yt <- y[obs_t, t] # Insert observed data
      Ct <- C[obs_t, , drop=FALSE]
      Rt <- R[obs_t, obs_t, drop=FALSE]
      
      # Steps for variance and population regression coefficients
      # Var(c_t * Z_t + e_t) = c_t * Var(A) * c_t' + Var(u) = c_t * V * c_t' + R
      VC <- V %*% t(Ct)
      S <- Ct %*% VC + Rt
      iF   <- tryCatch(chol2inv(chol(S)), error = function(e) solve(S))
      # Kalman gain: Matrix of population regression coefficients (QuantEcon eqn #4)
      VCF <- VC %*% iF
      # Innovation: Gives difference between actual and predicted measurement matrix values
      innov <- yt - Ct %*% Z
      # Update estimate of factor values (posterior)
      Zu <- Z + VCF %*% innov
      # Update covariance matrix (posterior) for time t
      Vu <- V - VCF %*% t(VC)
      Vu <- 0.5 * (Vu + t(Vu))  # Trick to make symmetric
      # Update log likelihood
      loglik <- loglik + 0.5 * (determinant(iF, TRUE)$modulus - t(innov) %*% iF %*% innov)
    }
    
    ## Store output
    # Store covariance and observation values for t-1 (priors)
    Zm[, t] <- Z
    Vm[[t]] <- V
    # Store covariance and state values for t (posteriors), i.e. Zu = Z_t|t & Vu = V_t|t
    ZmU[, t + 1]  <- Zu
    VmU[[t + 1]] <- Vu
    
  }
  
  ## Store Kalman gain k_t
  k_t <- if (exists("VCF")) VCF %*% Ct else matrix(0, m, m)
  
  # Apply fixed interval smoother ----------------------------------------------
  
  # Fill the final period of ZmT & VmT with posterior values from KF
  ZmT[, nobs + 1] <- ZmU[, nobs + 1]
  VmT[[nobs + 1]] <- VmU[[nobs + 1]]
  # Initialize VmT_1 lag 1 covariance matrix for final period
  VmT_lag[[nobs]] <- (I_m - k_t) %*% A %*% VmU[[nobs]]
  # Used for recursion process, see companion file for details
  eps <- 1e-8
  priorV <- Vm[[nobs]]
  invP   <- tryCatch(solve(priorV), error = function(e) solve(priorV + eps * I_m))
  J_2 <- VmU[[nobs]] %*% At %*% invP
  
  ### Run smoothing algorithm
  ## Loop through time reverse-chronologically (starting at final period nobs)
  for (t in nobs:1) {
    # Store posterior and prior factor covariance values 
    VmUt <- VmU[[t]]
    # Store previous period smoothed factor covariance and lag-1 covariance
    Vt <- VmT[[t + 1]]
    Vt_lag <- VmT_lag[[t]]
    J_1 <- J_2
    # Update smoothed factor estimate
    ZmT[, t] <- ZmU[, t] + J_1 %*% (ZmT[, t + 1] - A %*% ZmU[, t]) 
    # Update smoothed factor covariance matrix
    VmT[[t]] <- VmUt +  J_1 %*% (Vt - Vm[[t]]) %*% t(J_1)
    
    if (t > 1) {
      # Update weight
      Vm_prior <- Vm[[t-1]]
      invPP <- tryCatch(solve(Vm_prior), error = function(e) solve(Vm_prior + eps * I_m))
      J_2  <- VmU[[t-1]] %*% At %*% invPP
      # Update lag 1 factor covariance matrix
      VmT_lag[[t - 1]] <- VmUt %*% t(J_2) + J_1 %*% (Vt_lag - A %*% VmUt) %*% t(J_2)
    }
    
  }
  
  
  # Prepare output -------------------------------------------------------------
  
  Vs <- VmT[-1]    # Smoothed factor covariance for transition matrix
  Vf <- VmU[-1]    # Filtered factor posterior covariance
  Zsmooth <- ZmT     # Smoothed factors
  Vsmooth <- VmT     # Smoothed covariance value
  Plag <- list()
  Plag[[1]] <- Vs
  
  if (lag > 0) {
    for (jk in 1:lag) {
      Plag[[jk + 1]] <- array(NA, dim = c(m, m, nobs)) 
      for (jt in dim(Plag[[1]])[3]:(lag + 1)) {
        S <- A %*% Vf[[jt - jk]] %*% At + Q
        invS <- tryCatch(solve(S), error = function(e) solve(S + eps*I_m))
        As <- Vf[[jt - jk]] %*% At %*% invS
        Plag[[jk + 1]][,  , jt] <- As %*% Plag[[jk]][,  , jt]
      }
    }
  }
  
  Zsmooth <- t(Zsmooth)
  x_sm <- Zsmooth[-1, ] %*% t(C)   # Factors to series representation
  X_smooth <- repmat(as.numeric(sdevs), T, 1) * x_sm + repmat(as.numeric(means), T, 1)   # Standardized to unstandardized.

  m <- nrow(Vsmooth[[1]])
  mat_list <- lapply(Vsmooth, as.matrix)
  Vsmooth_arr <- array(
    unlist(mat_list, use.names = FALSE),
    dim = c(m, m, length(mat_list))
  )

  return(list(Plag = Plag, Vsmooth = Vsmooth_arr, X_smooth = as.matrix(X_smooth), F = as.matrix(Zsmooth)[-1, ]))
  
}   
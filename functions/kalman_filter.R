#' @title Kalman Filter and Fixed-Interval Smoother
#' @name kalman_filter
#' @description This function implements a Kalman filter followed by a 
#' fixed-interval smoother for a state-space model. The model assumes the following structure:
#' \itemize{
#'  \item \code{y_t = C_t * Z_t + e_t}, with \code{e_t ~ N(0, R)}
#'  \item \code{Z_t = A * Z_{t-1} + μ_t}, with \code{μ_t ~ N(0, Q)}
#' }
#' The function produces smoothed state estimates and covariances, which are used 
#' for inference or further steps in EM estimation.
#' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch.
#' @param y A \code{k × nobs} numeric matrix of observed variables, where \code{k} 
#' is the number of variables and \code{nobs} the number of time points.
#' @param A A \code{m × m} numeric transition matrix for the state equation
#' @param C A \code{k × m} numeric measurement matrix linking states to observations
#' @param Q A \code{m × m} covariance matrix of the transition equation residuals
#' @param R A \code{k × k} covariance matrix of the measurement equation residuals
#' @param Z0 A length-\code{m} numeric vector representing the initial state
#' @param V0 A \code{m × m} covariance matrix for the initial state
#' @return A list containing:
#' \describe{
#'   \item{Zsmooth}{A \code{m × (nobs + 1)} matrix of smoothed state estimates (\eqn{Z_{t|T}})}
#'   \item{Vsmooth}{A \code{m × m × (nobs + 1)} array of smoothed state covariance matrices (\eqn{Cov(Z_t|T)})}
#'   \item{VVsmooth}{A \code{m × m × nobs} array of smoothed lag-1 covariances (\eqn{Cov(Z_t, Z_{t-1}|T)})}
#'   \item{loglik}{Log-likelihood evaluated at the current parameter estimates}
#' }
#' @importFrom pracma inv pinv
#'
#' @export
kalman_filter <- function(y, A, C, Q, R, Z0, V0) {
  
  # Apply Kalman filter --------------------------------------------------------

  ## Cast to Matrix
  A <- Matrix(A)
  C <- Matrix(C)
  Q <- Matrix(Q)
  R <- Matrix(R)
  Z0 <- Matrix(Z0)
  V0 <- Matrix(V0)
  
  ## Initialise
  m <- dim(C)[2]
  nobs <- dim(y)[2]
  At <- t(A)
  Ct <- t(C)
  I_m <- Diagonal(m)
  
  Zm  <- Matrix(NA_real_, m, nobs)         # Z_t | t-1 (prior)
  Vm <- vector("list", nobs)         # V_t | t-1 (prior)
  
  ZmU <- Matrix(NA_real_, m, nobs + 1)     # Z_t | t (posterior/updated)
  VmU <- vector("list", nobs+1)      # V_t | t (posterior/updated)
  ZmT <- Matrix(0, m, nobs+1)        # Z_t | T (smoothed states)
  VmT <- vector("list", nobs+1)      # V_t | T = Cov(Z_t|T) (smoothed factor covariance)
  VmT_lag <- vector("list", nobs)    # Cov(Z_t, Z_t-1|T) (smoothed lag 1 factor covariance)
  loglik <- 0
  
  ## Initial values
  Zu <- Z0  # Z_0|0 (In loop, Zu gives Z_t | t)
  Vu <- V0  # V_0|0 (In loop, Vu gives V_t | t)
  ZmU[, 1, drop = FALSE] <- Zu
  VmU[[1]] <- Vu
  
  ### Kalman filter
  for (t in 1:nobs) {
    
    ## Calculate prior distribution
    # Use transition eqn to create prior estimate for factor, i.e. Z = Z_t|t-1
    Z <- A %*% Zu
    # Prior covariance matrix of Z (i.e. V = V_t|t-1)
    # Var(Z) = Var(A*Z + u_t) = Var(A*Z) + Var(\epsilon) = A*Vu*A' + Q
    V <- A %*% Vu %*% At + Q
    V <- 0.5 * (V + t(V))  # Trick to make symmetric
    
    ## Calculate posterior distribution
    # Remove missing series: These are removed from Y, C, and R
    obs_t <- !is.na(y[,t])
    if (!any(obs_t)) {
      Zu <- Z
      Vu <- V
    } else {
      yt <- y[obs_t, t]
      Ct <- C[obs_t, , drop=FALSE]
      Rt <- R[obs_t, obs_t, drop=FALSE]
      
      # Steps for variance and population regression coefficients
      # Var(c_t * Z_t + e_t) = c_t * Var(A) * c_t' + Var(u) = c_t * V * c_t' + R
      VC <- V %*% t(Ct)
      S <- Ct %*% VC + Rt
      iF   <- tryCatch(chol2inv(chol(S)), error = function(e) solve(S))
      # Matrix of population regression coefficients (QuantEcon eqn #4)
      VCF <- VC %*% iF
      # Gives difference between actual and predicted measurement matrix values
      innov <- yt - Ct %*% Z
      # Update estimate of factor values (posterior)
      Zu  = Z  + VCF %*% innov
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
    Vmt <- Vm[[t]]
    # Store previous period smoothed factor covariance and lag-1 covariance
    Vt <- VmT[[t + 1]]
    Vt_lag <- VmT_lag[[t]]
    J_1 <- J_2
    # Update smoothed factor estimate
    ZmT[, t] <- ZmU[, t] + J_1 %*% (ZmT[, t + 1] - A %*% ZmU[, t]) 
    # Update smoothed factor covariance matrix
    VmT[[t]] <- VmUt + J_1 %*% (Vt - Vmt) %*% t(J_1)
    if (t > 1) {
      # Update weight
      Vm_prior <- Vm[[t-1]]
      invPP <- tryCatch(solve(Vm_prior), error = function(e) solve(Vm_prior + eps * I_m))
      J_2  <- VmU[[t-1]] %*% At %*% invPP
      # Update lag 1 factor covariance matrix
      VmT_lag[[t-1]] <- VmUt %*% t(J_2) + J_1 %*% (Vt_lag - A %*% VmUt) %*% t(J_2)
    }
    
  }
  
  ## Prepare output
  m <- nrow(VmT[[1]])
  mat_list <- lapply(VmT, as.matrix)
  VmT_arr <- array(
    unlist(mat_list, use.names = FALSE),
    dim = c(m, m, length(mat_list))
  )
  m <- nrow(VmT_lag[[1]])
  mat_list <- lapply(VmT_lag, as.matrix)
  VmT_lag_arr <- array(
    unlist(mat_list, use.names = FALSE),
    dim = c(m, m, length(mat_list))
  )
  
  return(list(Zsmooth = as.matrix(ZmT), Vsmooth = VmT_arr, VVsmooth = VmT_lag_arr, loglik = as.numeric(loglik)))
  
}   


#' @title EM Convergence Check
#' @name EM_convergence
#' @description This function checks whether the EM algorithm has converged. 
#' Convergence is determined if the relative slope 
#' \eqn{|f(t) - f(t-1)| / ((|f(t)| + |f(t-1)|)/2)} falls below the specified 
#' threshold. 
#' @author Authors of the original function: Fernando Cantu and Daniel Hopp. 
#' Function script updated by: Maurizio Daniele and Heiner Mikosch.
#' @param loglik Numeric value of the log-likelihood at the current EM iteration
#' @param prev_loglik Numeric value of the log-likelihood at the previous EM iteration
#' @param threshold Numeric convergence threshold; smaller values require stricter convergence
#' @return A list containing:
#' \describe{
#'   \item{converged}{Logical indicator: \code{1} if convergence criteria are satisfied, \code{0} otherwise.}
#'   \item{decrease}{Logical indicator: \code{1} if the log-likelihood has decreased, \code{0} otherwise.}
#' }
#' @importFrom pracma eps
#'
#' @export
EM_convergence <- function(loglik, prev_loglik, threshold) {
  
  ## Initialize output
  converged <- 0
  decrease <- 0
  
  ## Check if log-likelihood decreases
  if ((loglik - prev_loglik) < -1e-3) {  # Allows for a little imprecision
    decrease <- 1
  }
  
  ## Check convergence criteria
  delta <- abs(loglik - prev_loglik)
  avg_loglik = (abs(loglik) + abs(prev_loglik) + eps()) / 2
  if ((delta / avg_loglik) < threshold){
    converged <- 1
  }
  
  ## Function output
  return(list(converged = converged, decrease = decrease))
  
}
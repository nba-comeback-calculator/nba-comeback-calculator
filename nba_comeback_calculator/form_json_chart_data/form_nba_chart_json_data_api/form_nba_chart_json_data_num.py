# form_nba_chart_json_data_num.py
"""
Numerical operations module for NBA chart data analysis.

This module provides a wrapper around numpy and scipy functionality used for
statistical analysis of NBA game data. It includes methods for array operations,
regression, probability calculations, and various mathematical functions.
"""

import random as random_lib

# Third-party imports
import numpy as np
from scipy import optimize
from scipy.special import logit, expit
from scipy.stats import norm

np.seterr(all="raise")  # Make all numpy warnings raise errors


class Num:
    norm = norm()

    random = random_lib

    @staticmethod
    def array(x):
        """Convert input to numpy array."""
        return np.array(x)

    @staticmethod
    def ones_like(x):
        """Create array of ones with same shape as x."""
        return np.ones_like(x)

    @staticmethod
    def column_stack(arrays):
        """Stack 1-D arrays as columns."""
        return np.column_stack(arrays)

    @staticmethod
    def inv(matrix):
        """Compute matrix inverse."""
        return np.linalg.inv(matrix)

    @staticmethod
    def clip(x, min_val, max_val):
        """Clip values to range [min_val, max_val]."""
        return np.clip(x, min_val, max_val)

    @staticmethod
    def sum(x):
        """Sum array elements."""
        return np.sum(x)

    @staticmethod
    def log(x):
        """Natural logarithm."""
        return np.log(x)

    @staticmethod
    def linspace(start, stop, num):
        """Create evenly spaced numbers."""
        return np.linspace(start, stop, num)

    @staticmethod
    def arange(start, stop, step=1):
        """Create evenly spaced array."""
        return np.arange(start, stop, step)

    @staticmethod
    def dot(a, b):
        """Dot product of two arrays."""
        return np.dot(a, b)

    @staticmethod
    def min(x, axis=None):
        """Minimum value of array."""
        return np.min(x, axis=axis)

    @staticmethod
    def max(x, axis=None):
        """Maximum value of array."""
        return np.max(x, axis=axis)

    @staticmethod
    def ceil(x):
        """Ceiling of input."""
        return np.ceil(x)

    @staticmethod
    def floor(x):
        """Floor of input."""
        return np.floor(x)

    @staticmethod
    def minimize(fun, x0, args=()):
        """Minimize a function."""
        return optimize.minimize(fun, x0, args=args)

    @staticmethod
    def CDF(x):
        """Compute normal CDF."""
        return Num.norm.cdf(x)

    @staticmethod
    def PPF(x):
        """Compute normal PPF."""
        return Num.norm.ppf(x)

    @staticmethod
    def power(x, p):
        """Raise elements to a power."""
        return np.power(x, p)

    @staticmethod
    def absolute(x):
        """Calculate absolute value."""
        return np.absolute(x)

    @staticmethod
    def least_squares(x, y, slope_only=False):
        """
        Perform least squares regression using matrix algebra.

        Parameters:
        -----------
        x : array-like
            x values
        y : array-like
            y values
        slope_only : bool
            If True, only fit slope (no intercept)
            If False, fit both slope and intercept

        Returns:
        --------
        dict
            Dictionary containing 'm' (slope) and 'b' (intercept) values
        """
        x = Num.array(x)
        y = Num.array(y)

        if slope_only:
            # For slope-only fit: y = mx
            # Matrix form: y = Xm where X is just x values
            X = x.reshape(-1, 1)
        else:
            # For full fit: y = mx + b
            # Matrix form: y = Xβ where X is [x 1] and β is [m b]
            X = Num.column_stack([x, Num.ones_like(x)])

        # Solve normal equations: β = (X^T X)^(-1) X^T y
        XTX = X.T @ X
        XTX_inv = Num.inv(XTX)
        beta = XTX_inv @ X.T @ y

        if slope_only:
            return {"m": beta[0], "b": 0}
        else:
            return {"m": beta[0], "b": beta[1]}

    @staticmethod
    def fit_it_mle(X, Y, model, m_est, b_est):
        """
        Fit a probit regression using MLE to find optimal parameters including scale.

        Parameters:
        -----------
        X : array-like
            Predictor variable (point_margin at half time)
        Y : array-like
            Binary outcome variable (0=loss, 1=win)
        model : str
            Type of model to fit ('probit' or 'logit')
        m_est : float
            Initial estimate for slope parameter
        b_est : float
            Initial estimate for intercept parameter

        Returns:
        --------
        dict
            Dictionary containing model parameters and fit statistics
        """
        initial_params = Num.array([m_est, b_est])

        # Minimize negative log-likelihood using scipy.optimize.fmin
        result = Num.minimize(
            Num.probit_neg_log_likelihood, initial_params, args=(X, Y, model)
        )

        # Extract optimized parameters
        params_opt = result["x"]

        return {
            "m": params_opt[0],
            "b": params_opt[1],
        }

    @staticmethod
    def probit_neg_log_likelihood(params, X, Y, model):
        """
        Calculate negative log-likelihood for probit/logit regression.

        Parameters:
        -----------
        params : array-like
            Model parameters [m, b]
        X : array-like
            Predictor variable
        Y : array-like
            Binary outcome variable
        model : str
            Type of model ('probit' or 'logit')

        Returns:
        --------
        float
            Negative log-likelihood value
        """
        m, b = params

        # Linear predictor
        z = m * X + b

        # Calculate probabilities using normal CDF
        if model == "logit":
            prob = expit(z)
        elif model == "probit":
            prob = Num.norm.cdf(z)
        else:
            raise NotImplementedError

        # Clip probabilities to avoid log(0) or log(1) issues
        prob = Num.clip(prob, 1e-16, 1 - 1e-16)

        # Negative log-likelihood
        neg_loglik = -Num.sum(Y * Num.log(prob) + (1 - Y) * Num.log(1 - prob))

        return neg_loglik


# def get_normal_emp_cdf(x):
#     p = np.array([float(0.5 + index) / len(x) for index in range(len(x))])
#     return Num.PPF(p)


# def get_logit_emp_cdf(x):
#     p = np.array([float(0.5 + index) / len(x) for index in range(len(x))])
#     return logit(p)

/**
 * nbacc_calculator_num.js
 *
 * Mathematical utility functions equivalent to NumPy/SciPy operations.
 * This file provides JavaScript implementations of various numerical and
 * statistical functions needed for NBA chart calculations.
 */

// Ensure numeric.js is loaded since we depend on it
(function () {
    if (typeof numeric === "undefined") {
        console.log("Loading numeric.js dependency");
        const script = document.createElement("script");
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js";
        script.async = false; // We need this to load before continuing
        document.head.appendChild(script);
    }
})();

// Define the Num class that provides equivalents to numpy/scipy functions
class Num {
    // Add a helper method to access the Num class directly
    static random_sample(arr, n) {
        const result = [];
        const len = arr.length;
        const taken = new Array(len);

        if (n > len) {
            return arr.slice();
        }

        while (result.length < n) {
            const r = Math.floor(Math.random() * len);
            if (!taken[r]) {
                taken[r] = true;
                result.push(arr[r]);
            }
        }

        return result;
    }

    /**
     * Convert input to array
     * @param {Array|number} x - Input to convert
     * @returns {Array} Array representation of input
     */
    static array(x) {
        return Array.isArray(x) ? x : [x];
    }

    /**
     * Create array of ones with same shape as input
     * @param {Array} x - Input array
     * @returns {Array} Array of ones with same shape
     */
    static ones_like(x) {
        return Array.from({ length: x.length }, () => 1);
    }

    /**
     * Stack 1-D arrays as columns
     * @param {Array} arrays - Array of arrays to stack
     * @returns {Array} Stacked array
     */
    static column_stack(arrays) {
        const result = [];
        const rowCount = arrays[0].length;

        for (let i = 0; i < rowCount; i++) {
            const row = [];
            for (let j = 0; j < arrays.length; j++) {
                row.push(arrays[j][i]);
            }
            result.push(row);
        }

        return result;
    }

    /**
     * Compute matrix inverse (simplified for 2x2 matrices)
     * @param {Array} matrix - Matrix to invert
     * @returns {Array} Inverted matrix
     */
    static inv(matrix) {
        // Use math.js for matrix operations
        return math.inv(matrix);
    }

    /**
     * Clip values to range [min_val, max_val]
     * @param {number|Array} x - Values to clip
     * @param {number} min_val - Minimum value
     * @param {number} max_val - Maximum value
     * @returns {number|Array} Clipped values
     */
    static clip(x, min_val, max_val) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.max(min_val, Math.min(max_val, val)));
        }
        return Math.max(min_val, Math.min(max_val, x));
    }

    /**
     * Sum array elements
     * @param {Array} x - Array to sum
     * @returns {number} Sum of array elements
     */
    static sum(x) {
        if (!Array.isArray(x)) return x;
        return x.reduce((acc, val) => acc + val, 0);
    }

    /**
     * Natural logarithm
     * @param {number|Array} x - Input value(s)
     * @returns {number|Array} Natural logarithm of input
     */
    static log(x) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.log(val));
        }
        return Math.log(x);
    }

    /**
     * Create evenly spaced numbers
     * @param {number} start - Start value
     * @param {number} stop - End value
     * @param {number} num - Number of points
     * @returns {Array} Array of evenly spaced numbers
     */
    static linspace(start, stop, num) {
        const step = (stop - start) / (num - 1);
        return Array.from({ length: num }, (_, i) => start + i * step);
    }

    /**
     * Create evenly spaced array
     * @param {number} start - Start value
     * @param {number} stop - End value (exclusive)
     * @param {number} step - Step size
     * @returns {Array} Array of evenly spaced numbers
     */
    static arange(start, stop, step = 1) {
        const length = Math.floor((stop - start) / step);
        return Array.from({ length }, (_, i) => start + i * step);
    }

    /**
     * Dot product of two arrays
     * @param {Array} a - First array
     * @param {Array} b - Second array
     * @returns {number|Array} Dot product result
     */
    static dot(a, b) {
        // Use math.js for matrix operations
        return math.multiply(a, b);
    }

    /**
     * Find minimum value of array
     * @param {Array} x - Input array
     * @param {number|null} axis - Axis along which to find minimum
     * @returns {number} Minimum value
     */
    static min(x, axis = null) {
        if (!Array.isArray(x)) return x;
        return Math.min(...x);
    }

    /**
     * Find maximum value of array
     * @param {Array} x - Input array
     * @param {number|null} axis - Axis along which to find maximum
     * @returns {number} Maximum value
     */
    static max(x, axis = null) {
        if (!Array.isArray(x)) return x;
        return Math.max(...x);
    }

    /**
     * Ceiling of input
     * @param {number|Array} x - Input value(s)
     * @returns {number|Array} Ceiling of input
     */
    static ceil(x) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.ceil(val));
        }
        return Math.ceil(x);
    }

    /**
     * Floor of input
     * @param {number|Array} x - Input value(s)
     * @returns {number|Array} Floor of input
     */
    static floor(x) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.floor(val));
        }
        return Math.floor(x);
    }

    /**
     * Raise elements to a power
     * @param {number|Array} x - Base(s)
     * @param {number} p - Exponent
     * @returns {number|Array} Result of x^p
     */
    static power(x, p) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.pow(val, p));
        }
        return Math.pow(x, p);
    }

    /**
     * Calculate absolute value
     * @param {number|Array} x - Input value(s)
     * @returns {number|Array} Absolute value of input
     */
    static absolute(x) {
        if (Array.isArray(x)) {
            return x.map((val) => Math.abs(val));
        }
        return Math.abs(x);
    }

    /**
     * Compute standard normal CDF (cumulative distribution function)
     * @param {number} x - Input value
     * @returns {number} CDF value
     */
    static CDF(x) {
        // Standard normal CDF implementation
        return 0.5 * (1 + math.erf(x / Math.sqrt(2)));
    }

    /**
     * Compute standard normal PPF (percent point function / quantile function)
     * @param {number} p - Probability value (0 to 1)
     * @returns {number} PPF value
     */
    static PPF(p) {
        // Implementation of normal quantile function
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;

        // Rational approximation for normal quantile function
        if (p < 0.5) {
            return -Num._rational_approximation(Math.sqrt(-2.0 * Math.log(p)));
        } else {
            return Num._rational_approximation(Math.sqrt(-2.0 * Math.log(1 - p)));
        }
    }

    /**
     * Helper method for PPF calculation
     * @param {number} t - Input value
     * @returns {number} Approximation result
     * @private
     */
    static _rational_approximation(t) {
        // Abramowitz and Stegun formula 26.2.23
        // The absolute value of the error should be less than 4.5e-4
        const c = [2.515517, 0.802853, 0.010328];
        const d = [1.432788, 0.189269, 0.001308];

        return (
            t -
            ((c[2] * t + c[1]) * t + c[0]) / (((d[2] * t + d[1]) * t + d[0]) * t + 1.0)
        );
    }

    /**
     * Perform least squares regression
     * @param {Array} x - Independent variable values
     * @param {Array} y - Dependent variable values
     * @param {boolean} slope_only - If true, only fit slope (no intercept)
     * @returns {Object} Object with regression coefficients (m: slope, b: intercept)
     */
    static least_squares(x, y, slope_only = false) {
        x = Num.array(x);
        y = Num.array(y);

        if (slope_only) {
            // For slope-only fit: y = mx
            // Convert x to column matrix
            const X = x.map((val) => [val]);

            // Calculate X^T * X
            const XTX = math.multiply(math.transpose(X), X);

            // Calculate (X^T * X)^(-1)
            const XTX_inv = math.inv(XTX);

            // Calculate (X^T * X)^(-1) * X^T * y
            const XTy = math.multiply(math.transpose(X), y);
            const beta = math.multiply(XTX_inv, XTy);

            return { m: beta[0], b: 0 };
        } else {
            // For full fit: y = mx + b
            // Create design matrix [x 1]
            const X = x.map((val) => [val, 1]);

            // Calculate X^T * X
            const XTX = math.multiply(math.transpose(X), X);

            // Calculate (X^T * X)^(-1)
            const XTX_inv = math.inv(XTX);

            // Calculate (X^T * X)^(-1) * X^T * y
            const XTy = math.multiply(math.transpose(X), y);
            const beta = math.multiply(XTX_inv, XTy);

            return { m: beta[0], b: beta[1] };
        }
    }

    /**
     * Minimize a function (simplified version of scipy.optimize.minimize)
     * @param {Function} fun - Function to minimize
     * @param {Array} x0 - Initial parameter values
     * @param {Array} args - Additional arguments to pass to fun
     * @returns {Object} Optimization result with optimal parameters and function value
     */
    static minimize(fun, x0, args = []) {
        // This is the original implementation which we'll keep but comment out
        // Simple gradient descent implementation

        // const MAX_ITER = 100;
        // const TOLERANCE = 1e-4;
        // const ALPHA = 1e-7;

        // let x = Array.isArray(x0) ? [...x0] : [x0];
        // let prev_f = Infinity;

        // for (let i = 0; i < MAX_ITER; i++) {
        //     // Compute function value
        //     const f = fun(x, ...args);

        //     console.log(x, f);
        //     // Check convergence
        //     if (Math.abs(f - prev_f) < TOLERANCE) {
        //         break;
        //     }

        //     // Compute numerical gradient
        //     const gradient = x.map((val, idx) => {
        //         const h = Math.max(1e-6, Math.abs(val) * 1e-6);
        //         const x_plus_h = [...x];
        //         x_plus_h[idx] += h;

        //         const f_plus_h = fun(x_plus_h, ...args);
        //         return (f_plus_h - f) / h;
        //     });

        //     // Update parameters
        //     x = x.map((val, idx) => val - ALPHA * gradient[idx]);

        //     prev_f = f;
        // }

        // return {
        //     x: x,
        //     fun: fun(x, ...args),
        // };

        // Create a wrapper function that passes args to fun
        const wrapper = function (x) {
            // x[0] = Math.max(x[0], m_start * 0.1);
            // x[0] = Math.min(x[0], m_start * 10.0);
            // x[1] = Math.max(x[1], b_start * 0.1);
            // x[1] = Math.min(x[1], b_start * 10.0);
            return fun(x, ...args);
        };
        const result = fmin.nelderMead(wrapper, x0);
        return {
            x: result.x, // Optimal parameters
            fun: result.fx, // Function value at optimum
            success: true,
            message: "Optimization successful using fmin.js",
        };
    }

    /**
     * Calculate negative log-likelihood for probit/logit regression
     * @param {Array} params - Model parameters [m, b]
     * @param {Array} X - Predictor variable
     * @param {Array} Y - Binary outcome variable
     * @param {string} model - Type of model ('probit' or 'logit')
     * @returns {number} Negative log-likelihood
     */
    static probit_neg_log_likelihood(params, X, Y, model) {
        const [m, b] = params;

        // Linear predictor
        const z = X.map((x) => m * x + b);

        // Calculate probabilities
        let prob;
        if (model === "logit") {
            prob = z.map((val) => 1 / (1 + Math.exp(-val)));
        } else if (model === "probit") {
            prob = z.map((val) => Num.CDF(val));
        } else {
            throw new Error("Model type not implemented");
        }

        // Clip probabilities to avoid log(0) or log(1)
        prob = prob.map((p) => Num.clip(p, 1e-16, 1 - 1e-16));

        // Calculate negative log-likelihood
        let neg_loglik = 0;
        for (let i = 0; i < X.length; i++) {
            neg_loglik -= Y[i] * Math.log(prob[i]) + (1 - Y[i]) * Math.log(1 - prob[i]);
        }

        return neg_loglik;
    }

    /**
     * Fit a probit regression using MLE
     * @param {Array} X - Predictor variable
     * @param {Array} Y - Binary outcome variable
     * @param {string} model - Type of model ('probit' or 'logit')
     * @param {number} m_est - Initial estimate for slope
     * @param {number} b_est - Initial estimate for intercept
     * @returns {Object} Fitted model parameters
     */
    static fit_it_mle(X, Y, model, m_est, b_est) {
        const initial_params = [m_est, b_est];

        // Minimize negative log-likelihood
        const result = Num.minimize(Num.probit_neg_log_likelihood, initial_params, [
            X,
            Y,
            model,
        ]);

        // Extract optimized parameters
        const params_opt = result.x;
        return {
            m: params_opt[0],
            b: params_opt[1],
        };
    }
}

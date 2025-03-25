# Configuration Notes

- The `conf.py` file has been updated to include all CSS and JavaScript dependencies needed to match the `test_pages/test_calculator.html` configuration.
- CSS files now include additional files for calculator functionality and Bootstrap.
- JavaScript files are loaded in proper dependency order:
  1. External dependencies (Chart.js, Bootstrap, etc.)
  2. Base utilities (nbacc_utils.js, etc.)
  3. Numerical functions
  4. Core modules
  5. Calculator modules
  6. UI module
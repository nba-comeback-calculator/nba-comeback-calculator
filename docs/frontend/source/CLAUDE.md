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

# Claude Code Documentation Guide

## Purpose
Document the experience of using Claude Code to develop the NBA Comeback Calculator website. This will serve as a case study for AI-assisted development in a real-world project.

## Content in using_claude_code.rst
The documentation in `/docs/frontend/source/analysis/using_claude_code.rst` includes:

1. Introduction and choice of Claude Code vs other tools
   - Comparison with Cursor and other AI coding tools
   - Links to independent evaluations

2. Key Lessons Learned
   - Ask for small features, one at a time
   - Python-to-JavaScript translation strategy
   - Don't throw good money after bad (when to restart)
   - Rigorous testing is essential

3. Technical Implementation Challenges
   - Numeric optimization in JavaScript
   - Subtle logic bugs in translation
   - URL encoding and state management

4. Best Practices for AI-Assisted Development
   - Seven key recommendations based on experience

5. Links to relevant project resources
   - GitHub repository
   - Cross-references to other documentation pages

## Key Points Highlighted
1. Breaking development into small, well-defined tasks with commit-first approach
2. Using Python-to-JavaScript translation for complex calculations
3. Recognizing when to step back and restart rather than repeatedly asking for fixes
4. The importance of proper testing in the correct environment

## Python to JavaScript Translation
The documentation covers the translation of four key Python modules to JavaScript:
- form_nba_chart_json_data_api.py → nbacc_calculator_api.js
- form_nba_chart_json_data_num.py → nbacc_calculator_num.js
- form_nba_chart_json_data_plot_primitives.py → nbacc_calculator_plot_primitives.js
- form_nba_chart_json_data_season_game_loader.py → nbacc_calculator_season_game_loader.js

## Documentation Style Guidelines
1. Always use `.. list-table::` format for tables rather than other table formats
2. Follow the existing header style with over/under line patterns
3. Use `.. code::` for code blocks
4. Use `.. pull-quote::` for quotations
5. Use cross-references to other pages with `:doc:` directives
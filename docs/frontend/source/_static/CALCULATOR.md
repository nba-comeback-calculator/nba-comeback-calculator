# NBA Charts Frontend - The NBACC Calculator

## Overview

The NBA Charts Calculator extends the charting program to build charts on the fly from season data rather than loading pre-generated JSON files from the `/charts/` directory. This creates a dynamic calculation and visualization system.

## Activation

The calculator can be activated in two ways:

### Option 1: Using a dedicated calculator div (Original method)

```html
<div id="nbacc_calculator" class="nbacc-calculator"></div>
```

### Option 2: Adding calculator capability to existing chart divs (New method)

Add the `nbacc-calculator` class to any chart div to make it configurable:

```html
<div id="plots/all_time_v_modern/percent_plot_group_0" class="nbacc-chart nbacc-calculator"></div>
```

This will display a "Configure" button under the chart. When clicked, the calculator UI will appear, allowing you to generate custom chart data that will replace the original chart in the same div.

## Implementation

The calculator system consists of multiple JavaScript files:

-   `nbacc_calculator_plot_primitives.js` - Core processing and calculations ported from Python
-   `nbacc_calculator_num.js` - Mathematical utility functions equivalent to NumPy/SciPy
-   `nbacc_calculator_api.js` - Main API for data handling and chart generation
-   `nbacc_calculator_season_game_loader.js` - Loading and processing season/game data
-   `nbacc_calculator_ui.js` - UI elements for selecting options and running calculations

The calculator provides a full JavaScript implementation of the functions in `plot_nba_game_data_core.py`, specifically:

-   `plot_biggest_deficit` - Generates points down vs win percentage charts
-   `plot_percent_versus_time` - Generates time vs points down win percentage charts

## User Interface

-   Press 'c' to open the calculator interface in a lightbox
-   The interface allows selection of various options:
    -   Plot Type: Max Points Down Or More, Max Points Down, Points Down At Time, Percent Chance: Time Vs Points Down
    -   Time parameters for analysis
    -   Year groups (seasons) to include in analysis
    -   Game filters to apply (teams, rankings, home/away, etc.)
-   Press Enter or click "Calculate" to generate the chart
-   The chart is displayed in the container div

## Technical Architecture

-   The calculator uses the same chart rendering system as the main charting system
-   Season data is loaded from the `/json/seasons/` directory
-   Core math functions from Python are reimplemented in JavaScript:
    -   A `Num` class provides JavaScript equivalents to numpy and scipy functions
    -   Statistical functions including CDF, PPF, regression, and optimization
-   The `GameFilter` class filters games by various criteria
-   Chart data is generated in memory and passed directly to the charting system

## Key Differences from Python Implementation

- **In-Memory JSON Data**: Unlike the Python version that generates and writes JSON files to disk, the JavaScript implementation generates JSON structures directly in memory
- **No `json_name` Parameter**: The API functions don't require or use a filename parameter since no files are written
- **Direct Chart Rendering**: The generated JSON data is passed directly to Chart.js for immediate rendering
- **Asynchronous Loading**: Season data is loaded asynchronously with fetch() rather than synchronous file reads
- **UI Integration**: The calculator is fully integrated with the UI and responds to user inputs in real-time

## Math Implementation Notes

Several advanced mathematical functions had to be ported from Python to JavaScript:

-   Normal CDF and inverse PPF (quantile) functions
-   Linear regression with least squares estimation
-   Numerical optimization (simplified from scipy.optimize.minimize)
-   Game statistics calculation including:
    -   Win percentage calculation based on point differentials
    -   Time-based probability estimation

## Data Flow

1. User selects parameters in the UI
2. Season data is loaded from JSON files
3. Game data is filtered and analyzed using the calculator core functions
4. Chart data structure is generated in memory
5. The data is passed to the existing charting system for rendering
6. Chart is displayed in the container div

## Dependencies

-   Math.js library for advanced mathematical functions
-   Numeric.js library for optimization and numerical calculations (required for probit regression)
-   Bootstrap for UI elements
-   Chart.js for rendering the charts (same as main charting system)
-   Other dependencies shared with the main charting system

The test page for this calculator is `test_calculator.html`
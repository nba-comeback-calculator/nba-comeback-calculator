# NBA Charts Frontend - The NBACC Calculator

## Overview

The NBA Charts Calculator extends the charting program to build charts on the fly from season data rather than loading pre-generated JSON files from the `/charts/` directory. This creates a dynamic calculation and visualization system.

## New Features

### State Persistence and Sharing

The calculator now includes:

1. **State Persistence**: Calculator settings are saved to localStorage and restored when reopening
2. **URL Encoding**: Calculator state is encoded in the URL whenever the form is used
3. **State Initialization**: The calculator automatically initializes from URL parameters if present

These features make it easy to:
- Continue where you left off between sessions
- Share specific calculator configurations with others by sharing the URL
- Embed specific calculator views in documentation or social media

#### State Persistence Implementation

State persistence works through these mechanisms:

1. **localStorage Saving**: When you configure the calculator and click "Calculate" or "Cancel", the current state is automatically saved to localStorage using the key 'nbacc_calculator_state'
2. **Automatic Loading**: When the calculator is first opened, it checks for saved state in localStorage and applies it if found
3. **URL Parameter Priority**: If the page is loaded with URL parameters, they take precedence over localStorage state
4. **URL Automatic Updates**: The URL is automatically updated (without page reload) whenever you calculate a new chart

The saved state includes:
- Plot type and time settings
- Selected percent values
- Year groups (seasons)
- Game filters
- Guide settings

#### Testing State Persistence

You can test state persistence by:
1. Opening the calculator and configuring it
2. Clicking "Calculate" to generate a chart
3. Closing and reopening the browser
4. Pressing 'c' to open the calculator again - your previous settings should be restored

To clear saved state, you can use the browser's developer tools to clear localStorage.

### URL Encoding Scheme

The calculator uses a compact URL encoding scheme with the following parameters:

#### `p` parameter (Plot settings)
Format: `p=<plot_type_index>-<time>-<percent_one>_<percent_two>_...-<guide_flags>`

- `plot_type_index`:
  - 0: Percent Chance: Time Vs. Points Down
  - 1: Max Points Down Or More
  - 2: Max Points Down
  - 3: Points Down At Time
- `time`: Start time in minutes (e.g., 24 for halftime)
- `percent_one_percent_two_...`: Selected percentages separated by underscores (only used for plot type 0)
- `guide_flags`: Two-digit flags for guide lines (only used for plot type 0)
  - First digit: 1 for standard guides, 0 for none
  - Second digit: 1 for calculated guides, 0 for none

Example: `p=0-24-20_10_5_1-01` (Percent Chance plot at 24 min with 20%, 10%, 5%, 1% lines and calculated guides)

#### `s` parameter (Season settings)
Format: `s=<season_one>~<season_two>~...`

Where each season entry is: `<min_year>-<max_year>-<type>`
- `min_year`: Start year (e.g., 2010)
- `max_year`: End year (e.g., 2020)
- `type`: B for both regular season and playoffs, R for regular season only, P for playoffs only

Example: `s=2010-2020-B~2000-2010-R` (Two season ranges: 2010-2020 both regular and playoffs + 2000-2010 regular season only)

#### `g` parameter (Game filter settings)
Format: `g=<filter_one>~<filter_two>~...`

Where each filter entry is: `<home_status>-<for_team_or_rank>-<vs_team_or_rank>`
- `home_status`: H for home, A for away, N for either
- `for_team_or_rank`: either "any", "R:rank_name" (e.g., "R:top_5"), or "T:team_abbr" (e.g., "T:LAL")
- `vs_team_or_rank`: same format as for_team_or_rank

Examples:
- `g=H-R:top_5-R:bot_5` (Home team is top 5, visiting team is bottom 5)
- `g=A-T:LAL-any` (Lakers playing away against any team)
- `g=all` (No filter, all games)

#### Example URL Patterns

1. **Basic Example - Points Down At Time**: 
```
/calculator/?p=3-24&s=2017-2024-B
```
Creates a "Points Down At Time" chart for 24 minutes, using data from 2017-2024 (both regular season and playoffs).

2. **Percent Chance Plot with Guide Lines**:
```
/calculator/?p=0-24-20_10_5_1-01&s=2017-2024-B
```
Creates a "Percent Chance: Time Vs. Points Down" chart starting at 24 minutes, showing 20%, 10%, 5%, and 1% lines, with calculated guides enabled.

3. **Multiple Season Ranges**:
```
/calculator/?p=1-36&s=2000-2010-B~2018-2024-B
```
Creates a "Max Points Down Or More" chart for 36 minutes, using data from two separate era ranges: 2000-2010 and 2018-2024.

4. **Game Filters - Team Ranking**:
```
/calculator/?p=1-48&s=2017-2024-B&g=H-R:top_10-R:bot_10
```
Creates a "Max Points Down Or More" chart for full game (48 minutes), showing only games where a top 10 team at home played against a bottom 10 team.

5. **Game Filters - Specific Teams**:
```
/calculator/?p=2-36&s=2017-2024-B&g=N-T:LAL-T:BOS
```
Creates a "Max Points Down" chart for 36 minutes, showing only games between Lakers and Celtics regardless of home/away status.

6. **Complex Example - Multiple Filters and Seasons**:
```
/calculator/?p=0-24-20_10_5_1-01&s=2010-2015-R~2018-2024-B&g=H-R:top_10-R:bot_10~A-T:LAL-any
```
Creates a "Percent Chance" chart with two season ranges (2010-2015 regular season only and 2018-2024 both) and two game filters (top 10 teams at home vs bottom 10 teams, and Lakers playing away against any team).

7. **Mini Example - Default Game Filter**:
```
/calculator/?p=1-12&s=2020-2024-B&g=all
```
Creates a "Max Points Down Or More" chart for 12 minutes using recent seasons with no game filtering.

**Note:** This URL encoding scheme avoids using characters that would need to be URL encoded:
- Uses `~` instead of `+` to separate multiple items
- Uses `-` instead of `,` to separate components within an item
- Uses `_` to separate multiple values in a list

#### URL Testing and Debugging

If you encounter issues with URL parameters not loading correctly:

1. Check browser console for error messages
2. Verify URL encoding follows the format exactly
3. Test with the basic examples above first
4. Use the test page at `js/nbacc_calculator_test.html` for debugging
5. Remember that the calculator will fallback to default values for any invalid parameters

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
-   `nbacc_calculator_state.js` - State persistence and URL encoding/decoding
-   `nbacc_calculator_ui.js` - UI elements for selecting options and running calculations
-   `nbacc_calculator_init.js` - Initializes calculator with URL parameters if present

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
- **State Management**: The calculator maintains state between sessions and supports URL-based sharing

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
7. State is saved to localStorage and can be encoded in a URL for sharing

## Dependencies

-   Math.js library for advanced mathematical functions
-   Numeric.js library for optimization and numerical calculations (required for probit regression)
-   Bootstrap for UI elements
-   Chart.js for rendering the charts (same as main charting system)
-   Other dependencies shared with the main charting system

The test page for this calculator is `test_calculator.html`
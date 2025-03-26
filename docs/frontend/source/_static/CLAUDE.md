# NBA Charts Frontend - Project Guide

**NOTE**: For calculator-specific details and usage, refer to [CALCULATOR.md](CALCULATOR.md) which describes the in-memory JSON data handling approach and calculator implementation.

## Chart Loading Configuration

The chart loading behavior can be configured with a top-level variable:

- `nbacc_utils.__LOAD_CHART_ON_PAGE_LOAD__`: Controls how charts are loaded
  - When `true` (default): All charts load immediately on page load
  - When `false`: Charts load lazily when scrolled into viewport (better for pages with many charts)

This setting is defined in `nbacc_utils.js` and used by `nbacc_chart_loader.js`.

## Calculator State Management

The calculator now includes state management features:

1. **State Persistence**: Calculator settings are saved to localStorage and restored when reopening
2. **URL Encoding**: Calculator state can be shared via URL parameters
3. **State Initialization**: The calculator automatically initializes from URL parameters if present

These features are implemented in the following files:
- `nbacc_calculator_state.js`: Handles state persistence and URL encoding/decoding
- `nbacc_calculator_init.js`: Initializes calculator from URL parameters

## Development & Testing

- **Run Test Page**: Open `/test/nba_test.html` in browser
- **View Example Page**: Open `nba_charts_example.html` in browser
- **Debug in Console**: Use browser dev tools for debugging (no formal test framework)
- **Validate JSON**: Check chart data in `_static/json/charts/` directory

## Working Guidelines

- **Git Commits**: NEVER commit changes unless explicitly instructed with the phrase "commit changes"

## JavaScript Module Loading Order

JavaScript files must be loaded in the correct order to ensure proper dependencies:

1. **External dependencies**: Chart.js, Bootstrap, etc.
2. **Base utilities**: nbacc_utils.js, nbacc_saveas_image_dialog.js, nbacc_plotter_plugins.js
3. **Numerical functions**: nbacc_calculator_num.js
4. **Core modules**: nbacc_plotter_data.js, nbacc_plotter_core.js, nbacc_plotter_ui.js, nbacc_chart_loader.js
5. **Calculator modules**:
   - nbacc_calculator_season_game_loader.js
   - nbacc_calculator_plot_primitives.js
   - nbacc_calculator_api.js
   - nbacc_calculator_state.js
   - nbacc_calculator_ui.js
   - nbacc_calculator_init.js

This loading order is defined in the `conf.py` file and should be maintained when adding new modules.

## Code Style Guidelines

- **Formatting**: 4-space indentation, trailing semicolons
- **Naming**: camelCase for variables/functions, use `nbacc_` prefix for module names
- **Namespacing**: 
  - Create module namespaces directly without the window prefix (e.g., use `nbacc_utils = (() => {...})` instead of `window.nbacc_utils = (() => {...})`)
  - Access module functions with their namespace (e.g., use `nbacc_utils.isMobile()` instead of just `isMobile()`)
  - For standalone utility functions that are exposed globally (not part of a namespace), use the window prefix (e.g., `window.saveChart()` or `window.updateButtonPositions()`)
  - All modules should follow the same pattern:
    ```javascript
    nbacc_module_name = (() => {
      // Private variables and functions
      
      // Public functions
      function publicFunction1() {
        // Implementation
      }
      
      function publicFunction2() {
        // Implementation
      }
      
      // Export public interface
      return {
        publicFunction1: publicFunction1,
        publicFunction2: publicFunction2
      };
    })();
    ```
  - **IMPORTANT**: The `Num` class is a special case and should be exported as a top-level class, not wrapped in a namespace. Access it directly as `Num.PPF()`, `Num.CDF()`, etc., not through another namespace like `nbacc_calculator_num.Num`
  - Always access exported functions through their namespace (e.g., `nbacc_plotter_ui.exitFullScreen()` instead of `exitFullScreen()`)
  - For functions that need to be accessed from event handlers within the module, reference them using the namespace (e.g., `nbacc_plotter_ui.exitFullScreen` not just `exitFullScreen`)
- **Comments**: JSDoc for functions, inline comments for complex logic
- **Error Handling**: Assume required data exists in JSON (x_min, x_max, etc.)
- **JSON Data**: Never use fallback/default values (like `|| 0` or `|| "default"`) for missing JSON data - assume data is "correct by construction"
- **Error Checking**: Do not add unnecessary error checking or validation - the JSON data is "correct by construction" and the UI forms will only provide valid values
- **No Fallbacks for Missing Dependencies**: Do not implement fallback algorithms when dependencies like numeric.js are missing. If a dependency is required, throw an error and fail explicitly rather than silently degrading to an alternative implementation.
- **CSS**: Keep styles in `css/nbacc.css` with descriptive class names
- **HTML**: Use semantic elements, consistent ID naming with `nbacc_` prefix

## Game Filter Concepts

In the `nbacc_calculator_api.js` GameFilter class:
- **"for" team**: The team making the comeback (the team we're analyzing)
- **"vs" team**: The opponent team (against whom the comeback is made)
- **for_at_home**: If true, only include games where the "for" team is at home; if false, only include games where the "for" team is away
- **for_team_abbr**: Filter by team abbreviation for the "for" team
- **vs_team_abbr**: Filter by team abbreviation for the "vs" team
- **for_rank/vs_rank**: Filter by rank category ("top_5", "top_10", etc.)

The UI's "For Team At" select maps directly to for_at_home:
- "Either Home/Away" sets for_at_home to null (no filter)
- "Home" sets for_at_home to true (only home games)
- "Away" sets for_at_home to false (only away games)

## Chart Types

The system supports two types of plots, identified by the `plot_type` field in the JSON data:

- **point_margin_v_win_percent**: Shows win percentage vs point margin
- **time_v_point_margin**: Shows time remaining vs point margin with color-coded win percentages

Each plot type has specific visualization requirements handled by the plotter based on the `plot_type` value.



## Important Sections

When you see "Add the important comment X", it means to add a comment in the code and also add it to this section for future reference.

- **POINT_HOVER_BEHAVIOR**: Chart points grow in size on hover but tooltips only appear on click. This is controlled by:
  - Global chart options: `events: ['mousemove', 'click', 'mouseout']` in createChartJSConfig
  - Dataset options: Both scatter and trend line datasets have `events: ['mousemove', 'click']`
  - Point size changes: 
    - Scatter points: `pointRadius: isMobile() ? 5.6 : 8` growing to `pointHoverRadius: isMobile() ? 11 : 14` on hover
    - Trend line points: `pointRadius: isMobile() ? 3 : 4` growing to `pointHoverRadius: isMobile() ? 8 : 11` on hover
  - Hover detection areas: 
    - Scatter points: `hoverRadius: 8` in interaction settings
    - Trend line points: `hoverRadius: 6` in interaction settings
  - The external tooltip handler checks for click events and only shows tooltips on actual clicks

- **CHART_BACKGROUND_COLOR**: Chart plot area background color and opacity setting in plotBackgroundPlugin
- **FULL_SCREEN_FUNCTIONS**: Full screen and exit full screen functionality for all devices including mobile; disables page scrolling while in full screen mode; on mobile: enables zooming, disables normal page pinch-zooming to prevent interference with chart zoom functionality, adds reset zoom button, shows smaller win count numbers, and enables tooltip hover boxes during full screen mode only; automatically resets zoom when exiting full screen; uses global currentFullscreenChart variable to track active chart; implements ESC key handler to exit fullscreen mode when ESC key is pressed; properly restores chart to original dimensions when exiting fullscreen
- **CHART_BUTTON_VISIBILITY**: Chart control buttons (Full Screen, Reset Zoom, Save As PNG) require multiple layers of defensive programming to ensure visibility:
  - In `nbacc_plotter_ui.js`: Uses multiple timed checks via `ensureButtonsVisible()` function at 100ms, 500ms, and 1000ms after chart creation
  - In `nbacc_calculator_ui.js`: Implements parallel defensive strategy with fallback manual positioning
  - Provides a `manuallyPositionButtons()` function as backup when `updateButtonPositions` global is unavailable
  - Resolves button visibility issues in calculator-generated charts
  - Handles fullscreen mode through special positioning logic
  - Applies forced opacity=1 settings to ensure buttons are always visible
  - Uses multiple setTimeout calls to retry button positioning in case of timing issues
- **CHART_ICON_SIZE**: Control chart button icon size through several CSS properties:
  - Base size: `.chart-icon { transform: scale(1.0); }` in nbacc.css
  - Mobile size: `.chart-icon { transform: scale(0.9); }` in nbacc-media.css
  - Small screens: `.chart-icon { transform: scale(0.8); }` in media query
  - Button dimensions: Set through `.chart-btn { width: 24px; height: 24px; }` in nbacc.css
  - Mobile button size: Set in nbacc-media.css with width/height (22px)
  - A larger scale value creates larger icons (e.g., 2.0 = larger, 0.5 = smaller)
- **TOOLTIP_WIDTH_CONTROL**: Tooltip width is determined by content size:
  - Content-Based Width: In `nbacc.css`, `#chartjs-tooltip` uses `display: inline-block` to size based on content
  - No-Wrap Text: All content uses `white-space: nowrap` to prevent text wrapping and ensure tooltips are sized perfectly to fit content
  - Table Layout: `#chartjs-tooltip table` uses `width: max-content` to ensure the table sizes to fit its content
  - Positioning Logic: In `nbacc_utils.js`, the `calculateTooltipPosition()` function handles tooltip positioning to keep it visible on screen
  - If content appears cut off: Check that all text elements have `white-space: nowrap` property
  - For any future tooltip width issues: Adjust the CSS for tooltips in `nbacc.css` rather than using fixed widths
- **GAMES_OBJECT_ACCESS**: When accessing game objects by ID, always use `games.games[game_id]` instead of `games[game_id]`. This is a critical difference from the Python codebase where a `__getitem__` method allowed direct access. In JavaScript, game objects must be accessed through the `games` property of the Games class instance.

## Architecture

- Pure vanilla JavaScript without frameworks
- Chart.js handles visualization (version 4.4.1)
- Lazy loading via `nbacc_chart_loader.js`
- Data from JSON files in absolute URL paths: `{rootUrl}/_static/json/charts/`
- Regression lines plotted using x_min to x_max from chart data
- Custom tooltips with game data and links to NBA.com

## CDN Dependencies

### JavaScript
- Chart.js: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`
- Hammer.js: `https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js`
- Chart.js Zoom Plugin: `https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-zoom/2.2.0/chartjs-plugin-zoom.min.js`
- Pako: `https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js`
- BasicLightbox: `https://cdnjs.cloudflare.com/ajax/libs/basicLightbox/5.0.0/basicLightbox.min.js`
- Math.js: `https://cdn.jsdelivr.net/npm/mathjs@11.8.0/lib/browser/math.min.js`
- Numeric.js: `https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js` (required for calculator optimization, NOT numeral.js)

### CSS
- BasicLightbox: `https://cdnjs.cloudflare.com/ajax/libs/basicLightbox/5.0.0/basicLightbox.min.css`

## Chart Features

- **Zoom**: Drag to zoom into specific regions of the chart
- **Reset Zoom**: Return to the original chart view
- **Full Screen**: Open chart in a lightbox for better visibility (uses BasicLightbox library)
- **Save As PNG**: Download chart as a PNG image
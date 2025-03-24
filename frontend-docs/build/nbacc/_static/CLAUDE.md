# NBA Charts Frontend - Project Guide

## Development & Testing

- **Run Test Page**: Open `/test/nba_test.html` in browser
- **View Example Page**: Open `nba_charts_example.html` in browser
- **Debug in Console**: Use browser dev tools for debugging (no formal test framework)
- **Validate JSON**: Check chart data in `_static/json/charts/` directory

## Working Guidelines

- **Git Commits**: NEVER commit changes unless explicitly instructed with the phrase "commit changes"

## Code Style Guidelines

- **Formatting**: 4-space indentation, trailing semicolons
- **Naming**: camelCase for variables/functions, use `nbacc_` prefix for module names
- **Comments**: JSDoc for functions, inline comments for complex logic
- **Error Handling**: Assume required data exists in JSON (x_min, x_max, etc.)
- **JSON Data**: Never use fallback/default values (like `|| 0` or `|| "default"`) for missing JSON data - assume data is "correct by construction"
- **CSS**: Keep styles in `css/nbacc.css` with descriptive class names
- **HTML**: Use semantic elements, consistent ID naming with `nbacc_` prefix

## Chart Types

The system supports two types of plots, identified by the `plot_type` field in the JSON data:

- **point_margin_v_win_percent**: Shows win percentage vs point margin
- **time_v_point_margin**: Shows time remaining vs point margin with color-coded win percentages

Each plot type has specific visualization requirements handled by the plotter based on the `plot_type` value.



## Important Sections

When you see "Add the important comment X", it means to add a comment in the code and also add it to this section for future reference.

- **CHART_BACKGROUND_COLOR**: Chart plot area background color and opacity setting in plotBackgroundPlugin
- **FULL_SCREEN_FUNCTIONS**: Full screen and exit full screen functionality for all devices including mobile; disables page scrolling while in full screen mode; on mobile: enables zooming, disables normal page pinch-zooming to prevent interference with chart zoom functionality, adds reset zoom button, shows smaller win count numbers, and enables tooltip hover boxes during full screen mode only; automatically resets zoom when exiting full screen
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

### CSS
- BasicLightbox: `https://cdnjs.cloudflare.com/ajax/libs/basicLightbox/5.0.0/basicLightbox.min.css`

## Chart Features

- **Zoom**: Drag to zoom into specific regions of the chart
- **Reset Zoom**: Return to the original chart view
- **Full Screen**: Open chart in a lightbox for better visibility (uses BasicLightbox library)
- **Save As PNG**: Download chart as a PNG image
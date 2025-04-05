# NBA Data Processing Pipeline

## Project Structure
This working directory (`form_json_chart_data`) contains scripts that create JSON chart data files from preprocessed NBA game data:

- `form_nba_chart_json_data_api/`: Core library for chart JSON data generation
  - `form_nba_chart_json_data_api.py`: Main API that other scripts import
  - `form_nba_chart_json_data_num.py`: Contains scipy/numpy numerical operations
  - `form_nba_chart_json_data_season_game_loader.py`: Loads JSON season data and constructs game objects
  - `form_nba_chart_json_data_plot_primitives.py`: Contains PlotLine and FinalPlot objects used by the API

- `form_nba_chart_json_data_for_sphinx_pages/`: Scripts that call the API to create chart JSON files
  - `plot_nba_game_data_analysis_20_18.py`: Creates chart JSON files for 2020-2018 analysis
  - `plot_nba_game_data_analysis_create_plots_page.py`: Automates creation of all Sphinx pages
  - `plot_nba_game_data_analysis_thumb.py`: Creates thumbnail chart JSON files

## Recent Refactoring

The system was recently refactored to improve data handling and enable more granular time analysis:

1. **Time Resolution Enhancement**: Added support for sub-minute analysis with `GAME_MINUTES` array
   - Now tracks 5-second to 45-second intervals in the final minute of games
   - Uses a `TIME_TO_INDEX_MAP` for efficient lookups

2. **Season Data Format Change**: Modified how game point margins are stored and accessed
   - Replaced `ScoreStatsByMinute` class with a direct `point_margin_map` dictionary
   - Each time point maps to a dictionary containing current, min, and max point margins
   - New `get_point_margin_map_from_json` function parses the compact JSON format

3. **API Parameter Improvements**: 
   - Renamed `stop_time` parameter to `down_mode` for clarity
   - `down_mode` can be either "at" (point at specific time) or "max" (maximum deficit)
   - Added support for string-based time points (e.g., "45s", "30s")

4. **Enhanced Analysis Capabilities**:
   - Improved tracking of point margin extremes throughout game periods
   - Added or_less_point_margin and or_more_point_margin tracking
   - Enhanced regression fitting with better handling of edge cases

## Data Flow
1. `form_nba_game_sqlite_database.py` (outside this dir) downloads data from stats.nba.com and creates SQLite database
2. `form_nba_game_json_seasons.py` (outside this dir) extracts point_margin and other game data from SQLite and stores as JSON
3. Files in this directory process that JSON data to create chart-specific JSON files:
   - `form_nba_chart_json_data_api/` contains the library code
   - `form_nba_chart_json_data_for_sphinx_pages/` contains the scripts that use the library to generate chart JSON
4. JavaScript frontend consumes these JSON files for visualization with Chart.js

## Key Classes

### GameFilter
The `GameFilter` class allows filtering games based on team attributes:
- `for_at_home`: Boolean indicating if winning team is at home (True) or away (False)
- `for_rank`: Filter winning team by rank category ('top_5', 'top_10', 'mid_10', 'bot_10', 'bot_5')
- `for_team_abbr`: Filter winning team by abbreviation (single abbr or comma-separated list)
- `vs_rank`: Filter losing team by rank category
- `vs_team_abbr`: Filter losing team by abbreviation

Important constraints:
- Cannot specify both `for_rank` and `for_team_abbr` at the same time
- Cannot specify both `vs_rank` and `vs_team_abbr` at the same time

### Games and Season
- `Season` class loads data for a specific NBA season from JSON files
- `Games` class collects game data across multiple seasons with optional filtering

### PlotLine and FinalPlot 
- `PlotLine` is the base class for all chart lines, with concrete implementations:
  - `PointsDownLine`: For analyzing win probability based on point deficit
  - `PercentLine`: For analyzing win probability over time
- `FinalPlot` represents a complete chart with all its lines and metadata

## Main Functions

### plot_biggest_deficit
Analyzes win probability based on point deficit at different game times.
- Accepts a list of `game_filters` for filtering games
- Creates combinations of year groups and filters
- Adds filter descriptions to titles and legends for better clarity

### plot_percent_versus_time
Analyzes how win probability changes throughout the game.
- Accepts a list of `game_filters` for filtering games
- Can plot guide lines showing the square root of time relationship

## Guidelines
- Only analyze/modify files in the current working directory
- Do not edit any files in the 'old' directory (legacy code)
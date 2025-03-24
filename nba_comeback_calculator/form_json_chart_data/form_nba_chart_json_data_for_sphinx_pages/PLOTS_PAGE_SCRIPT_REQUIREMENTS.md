# Automated Generation of NBA Plot Documentation

This document outlines the requirements for automatically generating the Sphinx documentation files for NBA data plots.

## Project Structure

- We will update the script `plot_nba_game_data_analysis_create_plots_page.py`
- The target documentation directory is `../../docs/source/plots` relative to the script's working directory

## Implementation Requirements

The goal is to implement two key functions that generate all JSON data and RST files needed for the plots documentation page.

### 1. `create_index_rst_file` Function

This function should create an `index.rst` file in the target directory with the following header:

```
*****
Plots
*****
```

The file should also include a starting point for a Sphinx toctree with maxdepth set to 1:

```
.. toctree::
   :maxdepth: 1

```

### 2. `create_plot_page` Function

This function handles creating individual plot pages based on either:
- Two year groups for comparison
- A single year group with two different game filters

#### Required Plot Configurations

The function must generate the following plot configurations:

##### A. `plot_biggest_deficit` Configurations (12 different calls)

| Plot ID | Parameters |
|---------|------------|
| `max_down_or_more_48` | `start_time=48, stop_time=0, cumulate=True` |
| `max_down_or_more_24` | `start_time=24, stop_time=0, cumulate=True` |
| `max_down_or_more_12` | `start_time=12, stop_time=0, cumulate=True` |
| `max_down_48` | `start_time=48, stop_time=0, cumulate=False` |
| `max_down_24` | `start_time=24, stop_time=0, cumulate=False` |
| `max_down_12` | `start_time=12, stop_time=0, cumulate=False` |
| `down_at_24` | `start_time=48, stop_time=None, cumulate=False` |
| `down_at_12` | `start_time=44, stop_time=None, cumulate=False` |
| `down_at_6` | `start_time=12, stop_time=None, cumulate=False` |
| `occurs_down_or_more_48` | `start_time=48, stop_time=0, cumulate=True, calculate_occurrences=True` |
| `occurs_down_or_more_24` | `start_time=24, stop_time=0, cumulate=True, calculate_occurrences=True` |
| `occurs_down_or_more_12` | `start_time=12, stop_time=0, cumulate=True, calculate_occurrences=True` |

Example function call:
```python
title, game_years_strings, game_filter_strings = plot_biggest_deficit(
    json_name=json_name,
    year_groups=year_groups,
    game_filters=game_filters,
    start_time=48,
    stop_time=0,
    cumulate=True
)
```

The `json_name` should follow the pattern: `f"{chart_base_path}/plots/{page_name}/{plot_id}.json"`, but for the HTML div ID, only use `plots/{page_name}/{plot_id}.json`

##### B. `plot_percent_versus_time` Configurations (3 different calls)

The function should generate the following based on the input parameters:

1. If comparing two year groups:
   - `percent_plot_group_0` for the first year group
   - `percent_plot_group_1` for the second year group

2. If comparing two game filters with a single year group:
   - `percent_plot_group_0` for the first filter
   - `percent_plot_group_1` for the second filter

3. In both cases, also generate:
   - `percent_plot_group_compare` for the comparison view

Example function call:
```python
title, game_years_strings, game_filter_strings = plot_percent_versus_time(
    json_name=json_name,
    year_groups=[year_groups[0]],  # or full year_groups for compare
    game_filters=game_filters,     # or [game_filters[0]] for individual
    start_time=24,
    stop_time=0,
    percents=["20%", "10%", "5%", "1%", "Record"],  # or ["10%", "1%"] for compare
)
```

#### RST File Generation

For each plot page, generate an RST file with:
1. A top-level title based on the comparison type (surrounded with asterisks both above and below):
   ```
   ********************************************************
   Comeback Plots: 1996-97 to 2024-25 v. 2017-18 to 2024-25
   ********************************************************
   ```
   
   Use these formats for the title text:
   - For year comparisons: `"Comeback Plots: {game_years_strings[0]} v. {game_years_strings[1]}"`
   - For filter comparisons: `"Comeback Plots: {game_filter_strings[0]} v. {game_filter_strings[1]}"`
   
   **Important Note**: If there are 3 or more game filters and the first filter is an empty filter (`GameFilter()` with title "All Games"), ignore this filter when forming titles. Instead, use the second and third filters for comparison titles.

2. Organize the plots into sections by type with proper headers:
   
   a. Group the plots into these categories (in this order):
      - "Max Points Down or More" (for plots with `cumulate=True` and NOT "occurs" in the ID)
      - "Max Points Down" (for plots with `cumulate=False` and numeric `stop_time`)
      - "Points Down At Time" (for plots with `stop_time=None`)
      - "Occurrence of Max Points Down Or More" (for plots with "occurs_down_or_more" in the ID)
      - "Percent Chance of Winning: Time Remaining Versus Points Down" (for percent plots)
   
   b. For each category:
      - Add a level 1 header (with `====` underline)
      - For each plot in that category:
        - Add a level 2 header with the plot title (with `----` underline)
        - Add a Sphinx reference: `.. _{page_name}_{plot_id}:`
        - Add the chart div:
          ```
          .. raw:: html

              <div id="plots/{page_name}/{plot_id}" class="nbacc-chart"></div>
          ```
     
   Note: The div id should NOT include the .json extension, but the actual JSON data files do need to have the .json extension.

Once these functions are implemented, running `plot_nba_game_data_analysis_create_plots_page.py` will automatically generate all required Sphinx RST files and JSON data files.
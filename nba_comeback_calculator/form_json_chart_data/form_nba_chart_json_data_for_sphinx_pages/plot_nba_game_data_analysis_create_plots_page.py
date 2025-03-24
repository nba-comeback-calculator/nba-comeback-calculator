# plot_nba_game_data_analysis_create_plots_page.py
"""
Script for generating comprehensive NBA game analysis chart pages.

This script automates the creation of Sphinx documentation pages with NBA
game analysis charts. It generates both JSON data files and corresponding 
RST documentation files for various chart types.
"""

import sys
import os
import re

# Add the form_nba_chart_json_data directory to the path using relative path from script location
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
form_nba_chart_json_data_dir = os.path.join(parent_dir, 'form_nba_chart_json_data')
sys.path.append(form_nba_chart_json_data_dir)

# Import API functions
from form_nba_chart_json_data_api import (
    plot_biggest_deficit,
    plot_percent_versus_time,
    GameFilter
)

# Base paths for input and output files
json_base_path = (
    "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/_static/json/seasons"
)
chart_base_path = (
    "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/_static/json/charts"
)

# Clean up and recreate directories
import shutil

# Create plots directory if it doesn't exist
plots_dir = f"{chart_base_path}/plots"
if os.path.exists(plots_dir):
    print(f"Removing existing plots directory: {plots_dir}")
    shutil.rmtree(plots_dir)
os.makedirs(plots_dir, exist_ok=True)

# Clean up and recreate Sphinx directory
sphinx_dir = "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/plots"
if os.path.exists(sphinx_dir):
    print(f"Removing existing Sphinx directory: {sphinx_dir}")
    shutil.rmtree(sphinx_dir)
os.makedirs(sphinx_dir, exist_ok=True)


def remove_game_count(title):
    """
    Remove the game count '(XXXX Games)' from a title, including the preceding space.

    Parameters:
    -----------
    title : str
        The title with potential game count

    Returns:
    --------
    str
        The title with game count removed
    """
    return re.sub(r" \(\d+ Games\)", "", title)


def create_index_rst_file(plots_dir):
    """
    Create an index.rst file in the plots directory.
    """
    index_rst_path = f"{plots_dir}/index.rst"
    with open(index_rst_path, "w") as f:
        f.write("*****\nPlots\n*****\n\n")
        f.write(".. toctree::\n   :maxdepth: 1\n\n")


def create_plot_page(page_name, years_groups, game_filters=None):
    """
    Create a plot page for a given plot name and plot type.

    Parameters:
    -----------
    page_name : str
        The name of the page to create
    years_groups : list
        A list of tuples with (start_year, end_year)
    game_filters : list, optional
        A list of GameFilter objects for filtering the games
    """
    # Create plot directory for this page
    page_dir = f"{chart_base_path}/plots/{page_name}"
    os.makedirs(page_dir, exist_ok=True)

    # Initialize game_years_strings and game_filter_strings
    game_years_strings = []
    game_filter_strings = []

    # List to store all plot data for the RST file
    plot_data = []

    # 1. Call plot_biggest_deficit with different parameters

    # max_down_or_more_48
    json_name = f"{page_dir}/max_down_or_more_48.json"
    title, years_str, filters_str = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=48,
        stop_time=0,
        cumulate=True,
    )
    # Remove game count from title
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_or_more_48", clean_title, json_name))
    game_years_strings = years_str
    game_filter_strings = filters_str

    # max_down_or_more_24
    json_name = f"{page_dir}/max_down_or_more_24.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=0,
        cumulate=True,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_or_more_24", clean_title, json_name))

    # max_down_or_more_12
    json_name = f"{page_dir}/max_down_or_more_12.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=12,
        stop_time=0,
        cumulate=True,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_or_more_12", clean_title, json_name))

    # max_down_48
    json_name = f"{page_dir}/max_down_48.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=48,
        stop_time=0,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_48", clean_title, json_name))

    # max_down_24
    json_name = f"{page_dir}/max_down_24.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=0,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_24", clean_title, json_name))

    # max_down_12
    json_name = f"{page_dir}/max_down_12.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=12,
        stop_time=0,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("max_down_12", clean_title, json_name))

    # down_at_24
    json_name = f"{page_dir}/down_at_24.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=None,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("down_at_24", clean_title, json_name))

    # down_at_12
    json_name = f"{page_dir}/down_at_12.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=12,
        stop_time=None,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("down_at_12", clean_title, json_name))

    # down_at_6
    json_name = f"{page_dir}/down_at_6.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=6,
        stop_time=None,
        cumulate=False,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("down_at_6", clean_title, json_name))

    # occurs_down_or_more_48
    json_name = f"{page_dir}/occurs_down_or_more_48.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=48,
        stop_time=0,
        cumulate=True,
        calculate_occurrences=True,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("occurs_down_or_more_48", clean_title, json_name))

    # occurs_down_or_more_24
    json_name = f"{page_dir}/occurs_down_or_more_24.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=0,
        cumulate=True,
        calculate_occurrences=True,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("occurs_down_or_more_24", clean_title, json_name))

    # occurs_down_or_more_12
    json_name = f"{page_dir}/occurs_down_or_more_12.json"
    title, _, _ = plot_biggest_deficit(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=12,
        stop_time=0,
        cumulate=True,
        calculate_occurrences=True,
    )
    clean_title = remove_game_count(title)
    plot_data.append(("occurs_down_or_more_12", clean_title, json_name))

    # 2. Call plot_percent_versus_time
    # Handle different cases based on input parameters
    if len(years_groups) == 2 and game_filters is None:
        # If two year groups and no filters
        # percent_plot_group_0
        json_name = f"{page_dir}/percent_plot_group_0.json"
        title, _, _ = plot_percent_versus_time(
            json_name=json_name,
            year_groups=[years_groups[0]],
            game_filters=game_filters,
            start_time=24,
            stop_time=0,
            percents=["20%", "10%", "5%", "1%", "Record"],
        )
        clean_title = remove_game_count(title)
        plot_data.append(("percent_plot_group_0", clean_title, json_name))

        # percent_plot_group_1
        json_name = f"{page_dir}/percent_plot_group_1.json"
        title, _, _ = plot_percent_versus_time(
            json_name=json_name,
            year_groups=[years_groups[1]],
            game_filters=game_filters,
            start_time=24,
            stop_time=0,
            percents=["20%", "10%", "5%", "1%", "Record"],
        )
        clean_title = remove_game_count(title)
        plot_data.append(("percent_plot_group_1", clean_title, json_name))
    elif len(years_groups) == 1 and game_filters is not None:
        json_name = f"{page_dir}/percent_plot_group_0.json"
        title, _, _ = plot_percent_versus_time(
            json_name=json_name,
            year_groups=years_groups,
            game_filters=[game_filters[-2]],
            start_time=24,
            stop_time=0,
            percents=["20%", "10%", "5%", "1%", "Record"],
        )
        clean_title = remove_game_count(title)
        plot_data.append(("percent_plot_group_0", clean_title, json_name))

        # percent_plot_group_1
        json_name = f"{page_dir}/percent_plot_group_1.json"
        title, _, _ = plot_percent_versus_time(
            json_name=json_name,
            year_groups=years_groups,
            game_filters=[game_filters[-1]],
            start_time=24,
            stop_time=0,
            percents=["20%", "10%", "5%", "1%", "Record"],
        )
        clean_title = remove_game_count(title)
        plot_data.append(("percent_plot_group_1", clean_title, json_name))

    # 10% Chance comparison plot using all game filters
    json_name = f"{page_dir}/percent_plot_10_percent.json"

    # For the 10% plot
    years_str = " to ".join(
        [f"{year[0]}-{str(year[0]+1)[2:]}" for year in years_groups]
    )
    custom_title = f"10% Chance of Coming Back Deficit Versus Time | {years_str}"

    title, _, _ = plot_percent_versus_time(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=0,
        percents=["10%"],
    )
    # Already using custom_title which doesn't have game count, no need to apply remove_game_count
    plot_data.append(("percent_plot_10_percent", custom_title, json_name))

    # 1% Chance comparison plot using all game filters
    json_name = f"{page_dir}/percent_plot_1_percent.json"

    # For the 1% plot
    custom_title = f"1% Chance of Coming Back Deficit Versus Time | {years_str}"

    title, _, _ = plot_percent_versus_time(
        json_name=json_name,
        year_groups=years_groups,
        game_filters=game_filters,
        start_time=24,
        stop_time=0,
        percents=["1%"],
    )
    # Already using custom_title which doesn't have game count, no need to apply remove_game_count
    plot_data.append(("percent_plot_1_percent", custom_title, json_name))

    # 3. Create RST file
    if len(years_groups) > 1 and game_filters is None:
        # Year group comparison
        rst_title = (
            f"Comeback Plots: {game_years_strings[0]} v. {game_years_strings[1]}"
        )
    elif len(years_groups) == 1 and game_filters is not None:
        rst_title = f"Comebacks {game_filter_strings[-2]} v. Comebacks {game_filter_strings[-1]}"
    else:
        raise AssertionError

    # Create RST file
    rst_path = f"{sphinx_dir}/{page_name}.rst"
    with open(rst_path, "w") as f:
        # Write the page title with asterisks above and below
        f.write(f"{'*' * len(rst_title)}\n")
        f.write(f"{rst_title}\n")
        f.write(f"{'*' * len(rst_title)}\n\n")

        # Group plots by their section types
        max_down_or_more_plots = []
        max_down_plots = []
        down_at_time_plots = []
        occurs_down_or_more_plots = []
        percent_plots = []

        for plot_id, plot_title, plot_json in plot_data:
            if "occurs_down_or_more" in plot_id:
                occurs_down_or_more_plots.append((plot_id, plot_title, plot_json))
            elif "max_down_or_more" in plot_id:
                max_down_or_more_plots.append((plot_id, plot_title, plot_json))
            elif "max_down" in plot_id:
                max_down_plots.append((plot_id, plot_title, plot_json))
            elif "down_at" in plot_id:
                down_at_time_plots.append((plot_id, plot_title, plot_json))
            elif "percent" in plot_id:
                percent_plots.append((plot_id, plot_title, plot_json))

        # Write Max Points Down or More section if relevant plots exist
        if max_down_or_more_plots:
            section_title = "Max Points Down or More"
            f.write(f"{section_title}\n")
            f.write(f"{'=' * len(section_title)}\n\n")

            for plot_id, plot_title, plot_json in max_down_or_more_plots:
                # Write the subsection title and reference
                f.write(f"{plot_title}\n")
                f.write(f"{'-' * len(plot_title)}\n\n")
                f.write(f".. _{page_name}_{plot_id}:\n\n")

                # Add the chart div
                f.write(".. raw:: html\n\n")
                div_id = (
                    plot_json.split(chart_base_path)[-1]
                    .lstrip("/")
                    .replace(".json", "")
                )
                f.write(f'    <div id="{div_id}" class="nbacc-chart"></div>\n\n')

        # Write Max Points Down section if relevant plots exist
        if max_down_plots:
            section_title = "Max Points Down"
            f.write(f"{section_title}\n")
            f.write(f"{'=' * len(section_title)}\n\n")

            for plot_id, plot_title, plot_json in max_down_plots:
                # Write the subsection title and reference
                f.write(f"{plot_title}\n")
                f.write(f"{'-' * len(plot_title)}\n\n")
                f.write(f".. _{page_name}_{plot_id}:\n\n")

                # Add the chart div
                f.write(".. raw:: html\n\n")
                div_id = (
                    plot_json.split(chart_base_path)[-1]
                    .lstrip("/")
                    .replace(".json", "")
                )
                f.write(f'    <div id="{div_id}" class="nbacc-chart"></div>\n\n')

        # Write Points Down At Time section if relevant plots exist
        if down_at_time_plots:
            section_title = "Points Down At Time"
            f.write(f"{section_title}\n")
            f.write(f"{'=' * len(section_title)}\n\n")

            for plot_id, plot_title, plot_json in down_at_time_plots:
                # Write the subsection title and reference
                f.write(f"{plot_title}\n")
                f.write(f"{'-' * len(plot_title)}\n\n")
                f.write(f".. _{page_name}_{plot_id}:\n\n")

                # Add the chart div
                f.write(".. raw:: html\n\n")
                div_id = (
                    plot_json.split(chart_base_path)[-1]
                    .lstrip("/")
                    .replace(".json", "")
                )
                f.write(f'    <div id="{div_id}" class="nbacc-chart"></div>\n\n')

        # Write Occurrence of Max Points Down Or More section if relevant plots exist
        if occurs_down_or_more_plots:
            section_title = "Occurrence of Max Points Down Or More"
            f.write(f"{section_title}\n")
            f.write(f"{'=' * len(section_title)}\n\n")

            for plot_id, plot_title, plot_json in occurs_down_or_more_plots:
                # Write the subsection title and reference
                f.write(f"{plot_title}\n")
                f.write(f"{'-' * len(plot_title)}\n\n")
                f.write(f".. _{page_name}_{plot_id}:\n\n")

                # Add the chart div
                f.write(".. raw:: html\n\n")
                div_id = (
                    plot_json.split(chart_base_path)[-1]
                    .lstrip("/")
                    .replace(".json", "")
                )
                f.write(f'    <div id="{div_id}" class="nbacc-chart"></div>\n\n')

        # Write Percent Chance section if relevant plots exist
        if percent_plots:
            section_title = (
                "Percent Chance of Winning: Time Remaining Versus Points Down"
            )
            f.write(f"{section_title}\n")
            f.write(f"{'=' * len(section_title)}\n\n")

            for plot_id, plot_title, plot_json in percent_plots:
                # Write the subsection title and reference
                f.write(f"{plot_title}\n")
                f.write(f"{'-' * len(plot_title)}\n\n")
                f.write(f".. _{page_name}_{plot_id}:\n\n")

                # Add the chart div
                f.write(".. raw:: html\n\n")
                div_id = (
                    plot_json.split(chart_base_path)[-1]
                    .lstrip("/")
                    .replace(".json", "")
                )
                f.write(f'    <div id="{div_id}" class="nbacc-chart"></div>\n\n')

    # Update index.rst to include this page
    index_rst_path = f"{sphinx_dir}/index.rst"
    with open(index_rst_path, "a") as f:
        f.write(f"   {page_name}\n")


# Create index.rst file first
create_index_rst_file(sphinx_dir)

# Create all the plot pages
create_plot_page("all_time_v_modern", years_groups=[(1996, 2024), (2017, 2024)])
create_plot_page("old_school_v_modern", years_groups=[(1996, 2016), (2017, 2024)])
create_plot_page(
    "old_old_school_v_old_school", years_groups=[(1996, 2006), (2007, 2016)]
)
create_plot_page(
    "new_school_v_new_new_school", years_groups=[(2017, 2020), (2021, 2024)]
)

create_plot_page(
    "modern_top_5_v_bot_5",
    years_groups=[(2017, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_rank="top_5", vs_rank="bot_5"),
        GameFilter(for_rank="bot_5", vs_rank="top_5"),
    ],
)

create_plot_page(
    "modern_top_10_v_bot_10",
    years_groups=[(2017, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_rank="top_10", vs_rank="bot_10"),
        GameFilter(for_rank="bot_10", vs_rank="top_10"),
    ],
)

create_plot_page(
    "modern_top_10_v_mid_10",
    years_groups=[(2017, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_rank="top_10", vs_rank="mid_10"),
        GameFilter(for_rank="mid_10", vs_rank="top_10"),
    ],
)

create_plot_page(
    "modern_bot_10_v_mid_10",
    years_groups=[(2017, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_rank="bot_10", vs_rank="mid_10"),
        GameFilter(for_rank="mid_10", vs_rank="bot_10"),
    ],
)

create_plot_page(
    "modern_home_v_away",
    years_groups=[(2017, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_at_home=True),
        GameFilter(for_at_home=False),
    ],
)

create_plot_page(
    "recent_min_versus",
    years_groups=[(2021, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_team_abbr="MIN"),
        GameFilter(vs_team_abbr="MIN"),
    ],
)

create_plot_page(
    "recent_min_comes_back_at_home_versus_away",
    years_groups=[(2021, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(for_team_abbr="MIN", for_at_home=False),
        GameFilter(for_team_abbr="MIN", for_at_home=True),
    ],
)

create_plot_page(
    "recent_min_gives_away_leads_at_home_versus_away",
    years_groups=[(2021, 2024)],
    game_filters=[
        GameFilter(),
        GameFilter(vs_team_abbr="MIN", for_at_home=False),
        GameFilter(vs_team_abbr="MIN", for_at_home=True),
    ],
)


print("All plot pages and RST files have been created successfully!")

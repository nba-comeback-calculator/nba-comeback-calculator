# plot_nba_game_data_analysis_20_18.py
"""
Script for generating NBA game analysis charts for 2020-2018 seasons.

This script creates JSON chart data files for visualizing NBA game trends
and win probabilities, with a focus on the 2020-2018 seasons.
"""

import sys
import os

# Add the form_nba_chart_json_data directory to the path using relative path from script location
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
form_nba_chart_json_data_dir = os.path.join(parent_dir, "form_nba_chart_json_data")
sys.path.append(form_nba_chart_json_data_dir)

# Import API functions
from form_nba_chart_json_data_api import (
    plot_biggest_deficit,
    plot_percent_versus_time,
    GameFilter,
)

# Base paths for input and output files
json_base_path = (
    "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/_static/json/seasons"
)
chart_base_path = (
    "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/_static/json/charts"
)


# Control which plots to generate
plot_all = False

# Generate all the plots
if plot_all or True:
    eras_one = [
        # ERA ONE
        (1996, 2024),
        # (2017, 2024),
        # (2021, 2024),
        # ("R2017", 2024),d
    ]
    # game_filters = [
    #     GameFilter(),
    #     GameFilter(for_team_abbr="MIN", for_at_home=None),
    #     # GameFilter(vs_team_abbr="MIN", for_at_home=True),
    #     # GameFilter(vs_team_abbr="MIN", for_at_home=False),
    # ]

    game_filters = [
        GameFilter(),
        # GameFilter(vs_rank="bot_5", for_team_abbr="MIN,CLE"),
        # GameFilter(vs_rank="top_5", for_rank="bot_5", for_at_home=True),
        # GameFilter(vs_rank="bot_10", for_rank="top_10"),
        # GameFilter(vs_rank="top_10", for_rank="bot_10"),
        # GameFilter(for_team_abbr="MIN"),
        # GameFilter(vs_team_abbr="MIN"),
        # GameFilter(vs_team_abbr="MIN"),
        # GameFilter(for_team_abbr="MIN", for_at_home=False),
        # GameFilter(for_team_abbr="MIN", for_at_home=True),
        # GameFilter(for_rank="top_10", vs_rank="bot_10"),
        # GameFilter(vs_rank="top_10", for_rank="bot_10"),
        # GameFilter(for_at_home=False),
        # GameFilter(vs_team_abbr="MIN", for_at_home=False),
        GameFilter(),
        GameFilter(vs_team_abbr="MIN", for_at_home=False),
        GameFilter(vs_team_abbr="MIN", for_at_home=True),
    ]
    game_filters = None
    x = plot_biggest_deficit(
        json_name=f"{chart_base_path}/20_18/nbacc_max_or_more_48_eras_0.json",
        year_groups=eras_one,
        game_filters=game_filters,
        start_time=48,
        stop_time=0,
        cumulate=True,
        # min_point_margin=-28,
        # max_point_margin=2,
        # fit_min_win_game_count=4,
        # fit_max_points=-16,
        # calculate_occurrences=True,
    )
    # title, _, _ = plot_percent_versus_time(
    #     json_name=f"{chart_base_path}/20_18/nbacc_max_or_more_48_eras_0.json",
    #     year_groups=eras_one,
    #     game_filters=[game_filters[-1]],
    #     start_time=24,
    #     stop_time=0,
    #     percents=["20%", "10%", "5%", "1%", "Record"],
    # )
    exit()

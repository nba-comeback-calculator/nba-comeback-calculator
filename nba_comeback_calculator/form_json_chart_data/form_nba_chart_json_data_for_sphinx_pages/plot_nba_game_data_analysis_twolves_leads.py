"""
Script for generating NBA game analysis charts for 2020-2018 seasons.

This script creates JSON chart data files for visualizing NBA game trends
and win probabilities, with a focus on the 2020-2018 seasons.
"""

import sys
import os

# Add the API directory to the path using relative path from script location
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
form_nba_chart_json_data_api_dir = os.path.join(
    parent_dir, "form_nba_chart_json_data_api"
)
sys.path.append(form_nba_chart_json_data_api_dir)

# Import API functions
from form_nba_chart_json_data_api import (
    plot_biggest_deficit,
    plot_percent_versus_time,
    GameFilter,
)

# Calculate script directory from __file__
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")

# Change working directory to the script's location
os.chdir(script_dir)
print(f"Working directory changed to: {os.getcwd()}")
# Base paths for input and output files
json_base_path = (
    "/Users/ajcarter/workspace/GIT_NBACC_GITHUB_IO/docs/_static/json/seasons"
)
chart_base_path = (
    "/Users/ajcarter/workspace/GIT_NBACC/docs/frontend/source/_static/json/charts"
)

import form_nba_chart_json_data_season_game_loader as loader

# Convert relative json_base_path to an absolute path
json_base_path = os.path.abspath(os.path.join(script_dir, json_base_path))
loader.json_base_path = json_base_path


eras = [
    # ERA ONE
    (1996, 2024),
]


plot_biggest_deficit(
    json_name=f"{chart_base_path}/twolves_leads/max_10min_all_time.json.gz",
    year_groups=eras,
    start_time=10,
    down_mode="max",
    cumulate=False,
)

plot_biggest_deficit(
    json_name=f"{chart_base_path}/twolves_leads/at_10min_all_time.json.gz",
    year_groups=eras,
    start_time=10,
    down_mode="at",
    cumulate=False,
)


plot_biggest_deficit(
    json_name=f"{chart_base_path}/twolves_leads/max_4min_all_time.json.gz",
    year_groups=eras,
    start_time=4,
    down_mode="max",
    cumulate=False,
)


# eras = [
#     # ERA ONE
#     (1996, 2024),
# ]

# plot_biggest_deficit(
#     json_name=f"{chart_base_path}/twolves_leads/at_4min_all_time.json.gz",
#     year_groups=eras,
#     start_time="15s",
#     down_mode="max",
#     cumulate=False,
# )

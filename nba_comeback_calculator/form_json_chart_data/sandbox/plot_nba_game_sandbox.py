# plot_nba_game_data_analysis_thumb.py
"""
Script for generating thumbnail charts for NBA game analysis.

This script creates simplified JSON chart data files intended for thumbnail
or preview displays of NBA game analysis visualizations.
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
)

# Base paths for input and output files
# Base paths for input and output files
json_base_path = "../../../docs/frontend/source/_static/json/seasons"
chart_base_path = "../../../docs/frontend/source/_static/json/charts"

import form_nba_chart_json_data_season_game_loader as loader

# Convert relative json_base_path to an absolute path
json_base_path = os.path.abspath(os.path.join(script_dir, json_base_path))
loader.json_base_path = json_base_path

base_path = f"{chart_base_path}/thumb"
# Control which plots to generate
plot_all = True

eras_one = [
    # ERA ONE
    (1996, 2024),
    # (2017, 2024),
]

plot_biggest_deficit(
    json_name=None,
    year_groups=eras_one,
    start_time=24,
    stop_time=None,
    cumulate=True,
)

# form_nba_chart_json_data_season_game_loader.py
"""
Data loading module for NBA season and game data.

This module handles loading and processing NBA game data from JSON files.
It provides classes for representing seasons, games, and game collections,
along with utility functions for filtering and analyzing game data.

The module defines granular time intervals for game analysis, supporting
minute-by-minute analysis as well as sub-minute intervals (down to 5-second
increments) in the final minute of the game.
"""

# Standard library imports
import json
import os
import gzip


# Defines time intervals for analysis, from start of game (48 minutes)
# to end of game (0), with sub-minute intervals in the final minute
GAME_MINUTES = [
    48,  # Game start
    36,  # Start of 2nd half (3rd quarter)
    24,  # Halftime
    23,
    22,
    21,
    20,
    19,
    18,
    17,
    16,
    15,
    14,
    13,  # 3rd quarter and early 4th
    12,  # Start of 4th quarter
    11,
    10,
    9,
    8,
    7,
    6,
    5,
    4,
    3,
    2,
    1,  # Final minute (60 seconds)
    "45s",  # 45 seconds remaining
    "30s",  # 30 seconds remaining
    "15s",  # 15 seconds remaining
    "10s",  # 10 seconds remaining
    "5s",  # 5 seconds remaining
    0,  # Game end (buzzer)
]


# Mapping from time point to array index for efficient lookup
TIME_TO_INDEX_MAP = {key: index for index, key in enumerate(GAME_MINUTES)}


class Season:
    """Manages loading of season data from JSON files."""

    _seasons = {}  # Class-level cache of loaded seasons

    @classmethod
    def get_season(cls, year):
        """Get a season by year, loading it if necessary."""
        if year not in cls._seasons:
            cls._seasons[year] = Season(year)
        return cls._seasons[year]

    def __init__(self, year):
        """Initialize a season by loading its JSON data."""
        self.year = year
        self.filename = f"{json_base_path}/nba_season_{year}.json.gz"

        # Verify the file exists
        if not os.path.exists(self.filename):
            raise FileNotFoundError(f"Season data file not found: {self.filename}")

        # Load the season data
        if self.filename.endswith(".gz"):
            with gzip.open(self.filename, "rt") as f:  # 'rt' for text mode
                self.data = json.load(f)
        else:
            with open(self.filename, "r") as f:
                self.data = json.load(f)

        # Extract season metadata
        self.season_year = self.data["season_year"]
        self.team_count = self.data["team_count"]
        self.teams = self.data["teams"]
        self.team_stats = self.data["team_stats"]

        # The games are loaded on demand via the games property
        self._games = None

    @property
    def games(self):
        """Lazy load and cache the game objects."""
        if self._games is None:
            self._games = {}
            for game_id, game_data in self.data["games"].items():
                self._games[game_id] = Game(game_data, game_id, self)
        return self._games


class Games:
    """Collection of NBA games for specified seasons loaded from JSON files."""

    def __init__(self, start_year, stop_year, season_type="all"):
        """
        Initialize games collection for the given year range with optional filtering.

        Parameters:
        -----------
        start_year : int
            First season year to include
        stop_year : int
            Last season year to include
        game_filter : GameFilter or None
            Filter to apply to games. If None, all games in the date range are included.
        """
        self.games = {}
        self.start_year = start_year
        self.stop_year = stop_year

        self.season_type = season_type

        # Load all games from the date range
        for year in range(start_year, stop_year + 1):
            season = Season.get_season(year)

            for game_id, game in season.games.items():
                if season_type != "all" and game.season_type != season_type:
                    continue
                self.games[game_id] = game

    def __getitem__(self, game_id):
        return self.games[game_id]

    def __len__(self):
        return len(self.games)

    def __iter__(self):
        return self.games.values().__iter__()

    def keys(self):
        return self.games.keys()

    def get_years_string(self):
        """Format the years string for display."""

        def short(year):
            return str(year)[-2:]

        if self.season_type != "all":
            season_type = f" {self.season_type}"
        else:
            season_type = ""

        if self.start_year == self.stop_year:
            return f"{self.start_year}-{short(self.start_year+1)}{season_type}"
        else:
            return (
                f"{self.start_year}-{short(self.start_year+1)} to "
                f"{self.stop_year}-{short(self.stop_year+1)}{season_type}"
            )


class Game:
    """
    Represents a single NBA game with all related statistics.

    Each Game object contains metadata about the game (teams, date, etc.)
    and a structured mapping of point margins at different times throughout
    the game, enabling detailed analysis of game progression and comebacks.
    """

    index = 0  # Class variable to track game index

    def __init__(self, game_data, game_id, season):
        """
        Initialize game with data from JSON.

        Parameters:
        -----------
        game_data : dict
            Raw game data from JSON
        game_id : str
            Unique identifier for the game
        season : Season
            Reference to the Season object this game belongs to
        """
        self.index = Game.index
        Game.index += 1

        # Store the game ID and reference to season
        self.game_id = game_id
        self.season = season

        # Copy basic properties
        self.game_date = game_data["game_date"]
        self.season_type = game_data["season_type"]
        self.season_year = game_data["season_year"]
        self.home_team_abbr = game_data["home_team_abbr"]
        self.away_team_abbr = game_data["away_team_abbr"]
        self.score = game_data["score"]

        # Parse final score
        self.final_away_points, self.final_home_points = [
            int(x) for x in self.score.split(" - ")
        ]

        # Calculate point differential (positive means home team won)
        self.score_diff = int(self.final_home_points) - int(self.final_away_points)

        # Determine win/loss
        if self.score_diff > 0:
            self.wl_home = "W"
            self.wl_away = "L"
        elif self.score_diff < 0:
            self.wl_home = "L"
            self.wl_away = "W"
        else:
            raise AssertionError("NBA games can't end in a tie")

        # Process and store point margins at each time point
        # This creates a dictionary mapping time points (from GAME_MINUTES) to point margin data
        self.point_margin_map = get_point_margin_map_from_json(
            game_data["point_margins"]
        )

        # Set team win percentages and rankings from season data
        self.home_team_win_pct = season.team_stats[self.home_team_abbr]["win_pct"]
        self.away_team_win_pct = season.team_stats[self.away_team_abbr]["win_pct"]
        self.home_team_rank = season.team_stats[self.home_team_abbr]["rank"]
        self.away_team_rank = season.team_stats[self.away_team_abbr]["rank"]

    def get_game_summary_json_string(self):
        """Returns a formatted string summary of the game suitable for JSON display."""

        # Format the rank as ordinal (1st, 2nd, 3rd, etc.)
        def ordinal(n):
            if 10 <= n % 100 <= 20:
                suffix = "th"
            else:
                suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
            return f"{n}{suffix}"

        # Get team ranks from season data
        home_rank = self.home_team_rank
        away_rank = self.away_team_rank

        # Format the ranks as ordinals
        home_rank_str = ordinal(home_rank) if home_rank > 0 else "N/A"
        away_rank_str = ordinal(away_rank) if away_rank > 0 else "N/A"

        # Return the formatted string without W/L indicators
        return (
            f"{self.away_team_abbr}"
            f"({away_rank_str}/{self.away_team_win_pct:.3f}) @ "
            f"{self.home_team_abbr}"
            f"({home_rank_str}/{self.home_team_win_pct:.3f})"
            f": {self.final_away_points}-{self.final_home_points}"
        )


def get_point_margin_map_from_json(point_margins_data):
    """
    Process point margins from JSON data into a structured map.

    Converts the compact string representation of point margins from the JSON data
    into a structured dictionary mapping time points to point margin data.

    The input format is a list of strings with format "index=value" or
    "index=point_margin,min_point_margin,max_point_margin" where:
    - index corresponds to positions in the GAME_MINUTES array
    - point_margin is the current point margin at that time
    - min/max_point_margin track the extremes reached during intervals

    Parameters:
    -----------
    point_margins_data : list
        List of strings containing point margin data in compressed format

    Returns:
    --------
    dict
        A dictionary mapping time points (from GAME_MINUTES) to point margin data dictionaries
        containing 'point_margin', 'min_point_margin', and 'max_point_margin' keys
    """
    # Extract point margins from the JSON data
    raw_point_margin_map = {}
    for point_margin in point_margins_data:
        index, points_string = point_margin.split("=", 1)
        if "," in points_string:
            point_margin, min_point_margin, max_point_margin = [
                int(x) for x in points_string.split(",")
            ]
        else:
            point_margin = min_point_margin = max_point_margin = int(points_string)
        raw_point_margin_map[int(index)] = {
            "point_margin": point_margin,
            "min_point_margin": min_point_margin,
            "max_point_margin": max_point_margin,
        }

    # Create a complete mapping for all time points in GAME_MINUTES
    point_margin_map = {}
    last_point_margin = None
    for index in range(len(GAME_MINUTES)):
        key = GAME_MINUTES[index]
        try:
            point_margin_data = raw_point_margin_map[index]
        except KeyError:
            # If data is missing for this time point, use the last known point margin
            if last_point_margin is None:
                raise AssertionError
            point_margin_data = {
                "point_margin": last_point_margin,
                "min_point_margin": last_point_margin,
                "max_point_margin": last_point_margin,
            }
        point_margin_map[key] = point_margin_data
        last_point_margin = point_margin_data["point_margin"]
    return point_margin_map

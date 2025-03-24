# form_nba_chart_json_data_season_game_loader.py
"""
Data loading module for NBA season and game data.

This module handles loading and processing NBA game data from JSON files.
It provides classes for representing seasons, games, and game collections,
along with utility functions for filtering and analyzing game data.
"""

# Standard library imports
import json
import os

# Global variable for base path to JSON files
json_base_path = (
    "/Users/ajcarter/workspace/GIT_TOOLS/nba_data/docs/source/_static/json/seasons"
)


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
        self.filename = f"{json_base_path}/nba_season_{year}.json"

        # Verify the file exists
        if not os.path.exists(self.filename):
            raise FileNotFoundError(f"Season data file not found: {self.filename}")

        # Load the season data
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
                    print(game.__dict__)
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
    """Represents a single NBA game with all related statistics."""

    index = 0  # Class variable to track game index

    def __init__(self, game_data, game_id, season):
        """Initialize game with data from JSON."""
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

        # Parse the datetime
        # self.datetime = datetime.strptime(self.game_date, "%Y-%m-%d")

        # Parse final score
        self.final_away_points, self.final_home_points = [
            int(x) for x in self.score.split(" - ")
        ]

        # Calculate point differential
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

        # Create score stats by minute directly from point margins in the JSON
        self.score_stats_by_minute = ScoreStatsByMinute(
            self, game_data["point_margins"]
        )

        # Set team win percentages from season data
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


class ScoreStatsByMinute:
    """Score statistics tracked by minute throughout the game."""

    def __init__(self, game, point_margins_data):
        """Initialize from pre-calculated point margins in JSON."""
        # Extract point margins from the JSON data
        self.point_margins = point_margins_data["margins"]
        self.min_point_margins = point_margins_data["min_margins"]
        self.max_point_margins = point_margins_data["max_margins"]

        # Calculate home scores (if needed)
        # Note: In this refactoring we don't actually need this as only point_margins are used
        self.home_scores = []

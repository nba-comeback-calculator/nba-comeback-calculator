# Standard library imports
import json
import sqlite3
from collections import OrderedDict, defaultdict

# Third-party imports
from scipy.interpolate import interp1d


def dict_factory(cursor, row):
    """Convert database row objects to dictionaries."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


# Connect to the NBA games database
con = sqlite3.connect(
    "/Users/ajcarter/nbav0/nba_games_running_score_1983_2025_v4.sqlite"
)
con.row_factory = dict_factory
cursor = con.cursor()

GAME_MINUTES = [
    48,
    36,
    24,
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
    13,
    12,
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
    1.00000,  # 60 seconds
    0.75000,  # 45 seconds
    0.50000,  # 30 seconds
    0.25000,  # 15 seconds
    0.16666,  # 10 seconds
    0.08333,  # 05 seconds
    0.00000,  # BZZZT!
]


class Games:
    """Collection of NBA games for specified seasons."""

    def __init__(self, cursor, start_year, stop_year):
        """Initialize games collection for the given year range."""
        self.games = OrderedDict()
        self.start_year = start_year

        # Load all games from database
        cursor.execute(
            f"SELECT * FROM games WHERE season_year LIKE '{self.start_year}-%' ORDER BY game_date DESC"
        )
        for row in cursor.fetchall():
            game = Game(cursor, row)
            self.games[game.game_id] = game

        # Bulk fetch all play-by-play data for efficiency
        game_ids = ", ".join(sorted(f"'{game.game_id}'" for game in self))
        cursor.execute(f"SELECT * FROM scores WHERE game_id IN ({game_ids});")
        for row in cursor.fetchall():
            if not row["score"]:
                raise AssertionError("Found score entry with empty score value")
            game = self[row["game_id"]]
            play_by_play = PlayByPlay(game, row)
            game.play_by_plays.append(play_by_play)

        # Calculate score statistics for each game
        for game in self:
            game.score_stats_by_minute = ScoreStatsByMinute(game)

        # Calculate team stats and rankings
        self.team_stats = self.calculate_team_stats()

        # Count unique teams in this season
        self.team_count = self._count_teams()

    def _count_teams(self):
        """Count the number of unique teams in the season and store the team list."""
        teams = set()
        for game in self:
            teams.add(game.home_team_abbr)
            teams.add(game.away_team_abbr)

        # Store the team list for JSON output
        self.teams_list = sorted(list(teams))
        return len(teams)

    def calculate_team_stats(self):
        """Calculate team statistics and rankings based on win percentages."""
        # Initialize dictionary to store team stats
        team_stats = defaultdict(
            lambda: {
                "wins": 0,
                "losses": 0,
                "games": 0,
                "win_pct": 0.0,
                "rank": 0,
            }
        )

        # Count regular season wins and losses for each team
        for game in self:
            # Only consider regular season games
            if game.season_type != "Regular Season":
                continue

            home_team = game.home_team_abbr
            away_team = game.away_team_abbr

            # Update home team stats
            team_stats[home_team]["games"] += 1
            if game.wl_home == "W":
                team_stats[home_team]["wins"] += 1
            else:
                team_stats[home_team]["losses"] += 1

            # Update away team stats
            team_stats[away_team]["games"] += 1
            if game.wl_away == "W":
                team_stats[away_team]["wins"] += 1
            else:
                team_stats[away_team]["losses"] += 1

        # Calculate win percentages
        for team, stats in team_stats.items():
            if stats["games"] > 0:
                stats["win_pct"] = stats["wins"] / stats["games"]
            else:
                stats["win_pct"] = 0.0

        # Rank teams by win percentage
        self._rank_teams_by_win_pct(team_stats)

        return dict(team_stats)

    def _rank_teams_by_win_pct(self, team_stats):
        """Rank teams based on win percentage."""
        # Sort teams by win percentage in descending order
        sorted_teams = sorted(
            [(team, stats["win_pct"]) for team, stats in team_stats.items()],
            key=lambda x: x[1],
            reverse=True,
        )

        # Assign ranks (handling ties with the same rank)
        current_rank = 1
        previous_pct = None

        for team, pct in sorted_teams:
            # If percentage is the same as previous team, assign the same rank
            if pct != previous_pct:
                rank = current_rank
                previous_pct = pct
            else:
                rank = current_rank - 1  # Same rank as previous team

            team_stats[team]["rank"] = rank
            current_rank += 1

    def to_json(self, filename):
        """Export games data to a JSON file."""
        # Create the top-level dictionary structure
        season_data = {
            "season_year": self.start_year,
            "team_count": self.team_count,
            "teams": self.teams_list,
            "team_stats": {},
            "games": {},
        }

        # Format team stats for JSON output
        for team, stats in self.team_stats.items():
            season_data["team_stats"][team] = {
                "wins": stats["wins"],
                "losses": stats["losses"],
                "games": stats["games"],
                "win_pct": stats["win_pct"],
                "rank": stats["rank"],
            }

        # Add each game to the games dictionary with game_id as key
        for game in self:
            season_data["games"][game.game_id] = game.to_json()

        # Write the data to a JSON file, using gzip if filename ends with .gz
        # Make sure filename ends with .gz
        if not filename.endswith(".gz"):
            filename = filename + ".gz"
        if filename.endswith(".gz"):
            import gzip

            with gzip.open(filename, "wt") as f:
                json.dump(season_data, f, indent=2)
        else:
            with open(filename, "w") as f:
                json.dump(season_data, f, indent=2)

        print(f"Saved {len(season_data['games'])} games to {filename}")

    def __getitem__(self, game_id):
        return self.games[game_id]

    def __len__(self):
        return len(self.games)

    def __iter__(self):
        return self.games.values().__iter__()


class Game:
    """Represents a single NBA game with all related statistics."""

    index = 0  # Class variable to track game index

    def __init__(self, cursor, row):
        """Initialize game with data from database row."""
        self.index = Game.index
        Game.index += 1
        self.__dict__.update(row)
        self.play_by_plays = PlayByPlays(cursor, self)

        # Parse final score
        self.final_away_points, self.final_home_points = [
            int(x) for x in self.score.split(" - ")
        ]

        # Calculate point differential and determine win/loss
        self.score_diff = int(self.final_home_points) - int(self.final_away_points)
        if self.score_diff > 0:
            self.wl_home = "W"
            self.wl_away = "L"
        elif self.score_diff < 0:
            self.wl_home = "L"
            self.wl_away = "W"
        elif self.score_diff == 0:
            raise AssertionError("NBA games can't end in a tie")

    def to_json(self):
        """Convert game data to a JSON-serializable dictionary."""
        return {
            "game_date": self.game_date,
            "season_type": self.season_type,
            "season_year": self.season_year,
            "home_team_abbr": self.home_team_abbr,
            "away_team_abbr": self.away_team_abbr,
            "score": self.score,
            "point_margins": self.score_stats_by_minute.point_margins,
        }


class ScoreStat:
    """Statistics for score at a given point in the game."""

    def __init__(self, point_margin, min_point_margin, max_point_margin):
        self.point_margin = point_margin
        self.min_point_margin = min_point_margin
        self.max_point_margin = max_point_margin

    @property
    def away_score(self):
        return self.home_score - self.point_margin

    def values(self):
        return self.point_margin, self.min_point_margin, self.max_point_margin


class ScoreStatsByMinute:
    """Score statistics tracked by minute throughout the game."""

    inf = float("inf")
    neg_inf = -1.0 * float("inf")

    def __init__(self, game):
        """Calculate and store score statistics by minute for a game."""
        # Initialize with zeroes at the start (48-minute mark)
        self.scores_map = {
            0: ScoreStat(point_margin=0, min_point_margin=0, max_point_margin=0)
        }

        time_indicies = list(range(len(GAME_MINUTES)))
        time_to_index_fn = interp1d(
            [float(x) for x in GAME_MINUTES], time_indicies, kind="previous"
        )
        # Process each play to track score changes
        for play in game.play_by_plays:
            time = float(play.time)
            if time < 0:
                continue
            home_score = play.home_score
            away_score = play.away_score
            point_margin = home_score - away_score
            time_index = int(time_to_index_fn(time))
            try:
                score_stat = self.scores_map[time_index]
            except KeyError:
                score_stat = ScoreStat(
                    point_margin=point_margin,
                    min_point_margin=point_margin,
                    max_point_margin=point_margin,
                )
                self.scores_map[time_index] = score_stat
            else:
                score_stat.point_margin = point_margin
                score_stat.min_point_margin = min(
                    score_stat.min_point_margin, point_margin
                )
                score_stat.max_point_margin = max(
                    score_stat.max_point_margin, point_margin
                )

    @property
    def point_margins(self):
        margins = []
        for index, score_stat in sorted(self.scores_map.items()):
            points, min_points, max_points = score_stat.values()
            if points == min_points == max_points:
                margins.append(f"{index}={points}")
            else:
                margins.append(f"{index}={points},{min_points},{max_points}")
        return margins


class PlayByPlays:
    """Collection of play-by-play events for a game."""

    def __init__(self, cursor, game):
        self.game = game
        self.plays = []

    def __getitem__(self, index):
        return self.plays[index]

    def __iter__(self):
        return self.plays.__iter__()

    def __bool__(self):
        return bool(self.plays)

    def append(self, play):
        self.plays.append(play)


class PlayByPlay:
    """Individual play event in a game with time and score information."""

    def __init__(self, game, row):
        # Parse score
        away_score, home_score = (int(x) for x in row["score"].split(" - "))
        self.away_score = away_score
        self.home_score = home_score

        # Convert period and time string to minutes remaining in game
        period_min, period_second = (int(x) for x in row["pctimestring"].split(":"))
        self.time = (
            (4 - int(row["period"])) * 12.0 + period_min + (period_second / 60.0)
        )


# Define base path for output JSON files
base_path = "../../docs/frontend/source/_static/json/seasons"

# Process each NBA season and create corresponding JSON files
for year in range(2019, 2025, 1):
    print(f"Processing season {year}...")
    games = Games(cursor, start_year=year, stop_year=year)
    games.to_json(f"{base_path}/nba_season_{year}.json.gz")

# Close the database connection
con.close()

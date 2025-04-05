# import requests
# import pandas as pd
# import numpy as np
# import io
# from nba_api.stats.static import teams
# from nba_api.stats.endpoints import leaguegamefinder
# import matplotlib.pyplot as plt
# from joypy import joyplot
#
# from nba_api.stats.endpoints import LeagueDashPlayerStats, LeagueDashTeamStats
# from nba_api.stats.endpoints import scoreboardv2 as scoreboard
#
#
# def get_season_games(season="2024-25", season_type="Regular Season"):
#     """
#     Get NBA games for a specific season and season type.
#
#     Parameters:
#     season (str): Season in format "YYYY-YY" (e.g., "2024-25")
#     season_type (str): Either "Regular Season" or "Playoffs"
#
#     Returns:
#     dict: JSON response containing game data
#     """
#     try:
#         # You can use either player stats or team stats endpoint to get game data
#         # Here we'll use team stats as it's more efficient
#         games = LeagueDashTeamStats(season=season, season_type_all_star=season_type)
#
#         return games.get_normalized_dict()
#     except Exception as e:
#         return {"error": str(e)}
#
#
# def get_live_games():
#     """
#     Get currently live NBA games.
#
#     Returns:
#     dict: JSON response containing live game data
#     """
#     try:
#         live_games = scoreboard.ScoreBoard().games.get_dict()
#         return live_games
#     except Exception as e:
#         return {"error": str(e)}
#
#
# if __name__ == "__main__":
#     # Get regular season games
#     regular_season = get_season_games(season="2024-25", season_type="Regular Season")
#     print("Regular Season Games:")
#     print(regular_season)
#
#     # Get playoff games
#     playoffs = get_season_games(season="2024-25", season_type="Playoffs")
#     print("\nPlayoff Games:")
#     print(playoffs)
#     breakpoint()
#
#     # Get live games if any are currently being played
#     live = get_live_games()
#     print("\nLive Games:")
#     print(live)

headers = {
    "Connection": "keep-alive",
    "Accept": "application/json, text/plain, */*",
    "x-nba-stats-token": "true",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
    "x-nba-stats-origin": "stats",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Referer": "https://stats.nba.com/",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}

# play_by_play_url = (
#     "https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_0042000404.json"
# )
# response = requests.get(url=play_by_play_url, headers=headers).json()
# play_by_play = response["game"]["actions"]
# df = pd.DataFrame(play_by_play)
#
# print(df[0:3])

import datetime
import sqlite3
import os
import time

remove = False

if remove:
    try:
        os.unlink("/Users/ajcarter/nbav0/nba_games_running_score_1983_2025_v3.sqlite")
    except EnvironmentError:
        pass

con = sqlite3.connect(
    "/Users/ajcarter/nbav0/nba_games_running_score_1983_2025_v3.sqlite"
)

cursor = con.cursor()

# if True:
#     cursor.execute("""
#     ALTER TABLE games
#     RENAME COLUMN x TO season_type;
#     """)
#     cursor.execute("""
#     ALTER TABLE games
#     RENAME COLUMN y TO season_year;
#     """)
#     con.commit()
#     con.close()
#     exit()

cursor.execute(
    """CREATE TABLE IF NOT EXISTS games (
            game_id PRIMARY KEY,
            game_date,
            season_id,
            season_type,
            season_year,
            home_team_id,
            away_team_id,
            home_team_abbr,
            away_team_abbr,
            home_regular_season_win_pct,
            away_regular_season_win_pct,
            score
        );"""
)

cursor.execute(
    """CREATE TABLE IF NOT EXISTS scores (
            game_id,
            period,
            pctimestring,
            score
        );"""
)
cursor.execute(
    """CREATE INDEX IF NOT EXISTS score_game_id
        ON scores (game_id)
        ;"""
)
cursor.execute(
    """CREATE TABLE IF NOT EXISTS seasons (
            season_key PRIMARY KEY,
            season_id,
            season_year,
            season_type
        );"""
)


cursor.execute("select * from games")

games_column_names = list(map(lambda x: x[0], cursor.description))

cursor.execute("select * from scores")

scores_column_names = list(map(lambda x: x[0], cursor.description))

cursor.execute("select * from seasons")

season_column_names = list(map(lambda x: x[0], cursor.description))

cursor.execute("select season_key from seasons")
season_keys = set(x[0] for x in cursor.fetchall() if "2024-25" not in x[0])
cursor.execute("select game_id from games")
game_ids = set(x[0] for x in cursor.fetchall())


from nba_api.stats.endpoints import leaguegamefinder
from nba_api.stats.endpoints import playbyplay
from nba_api.stats.endpoints import playbyplayv3

from nba_api.stats.library.parameters import Season, SeasonType, SeasonTypePlayoffs


time_start = time.time()


def get_game_row(game_id, gate_data, season_year, season_type):
    row = {}
    matchup = [x["MATCHUP"] for x in game_data if "@" in x["MATCHUP"]][0]
    away_abbr, home_abbr = matchup.split(" @ ")
    away_data = [x for x in game_data if x["TEAM_ABBREVIATION"] == away_abbr][0]
    home_data = [x for x in game_data if x["TEAM_ABBREVIATION"] == home_abbr][0]
    row["game_id"] = home_data["GAME_ID"]
    row["game_date"] = home_data["GAME_DATE"]
    row["season_id"] = home_data["SEASON_ID"]
    row["season_year"] = season_year
    row["season_type"] = season_type
    row["home_team_id"] = home_data["TEAM_ID"]
    row["away_team_id"] = away_data["TEAM_ID"]
    row["home_team_abbr"] = home_abbr
    row["away_team_abbr"] = away_abbr
    row["score"] = score = f"{away_data['PTS']} - {home_data['PTS']}"

    home_score, away_score = score.split(" - ")

    if home_score == away_score:
        breakpoint()

    return row


game_count = 0
now = datetime.datetime(2025, 4, 10)
season_types = ["Regular Season", "Playoffs"]
# season_types = ["Playoffs"]
# season_types = ["Regular Season"]
for year in range(1996, 2025):
    season_year = f"{year}-{str(year+1)[-2:]}"
    for season_type in season_types:
        if season_type == "Regular Season":
            season_type_nullable = SeasonType.regular
        else:
            season_type_nullable = SeasonTypePlayoffs.playoffs

        season_key = f"{season_year}-{season_type[0].lower()}"

        season_key_r = f"{season_year}-r"
        season_key_p = f"{season_year}-p"

        if season_key_r.startswith("2024"):
            pass
        elif season_key_r in season_keys and season_key_p in season_keys:
            print(f"Skipping season {season_key} ...")
            continue

        season_id = None
        gamefinder = leaguegamefinder.LeagueGameFinder(
            season_nullable=season_year,
            season_type_nullable=season_type_nullable,
            league_id_nullable="00",
            headers=headers,
        )
        x = gamefinder.get_data_frames()
        games_df = x[0][
            [
                "SEASON_ID",
                "TEAM_ID",
                "TEAM_ABBREVIATION",
                "TEAM_NAME",
                "GAME_ID",
                "GAME_DATE",
                "MATCHUP",
                "WL",
                "PTS",
            ]
        ]
        games = {}
        for row in games_df.iterrows():
            game = dict(row[1])
            date = datetime.datetime.strptime(game["GAME_DATE"], "%Y-%m-%d")
            if date >= now:
                continue
            games.setdefault(game["GAME_ID"], []).append(game)

        for game_id, game_data in games.items():
            games[game_id] = game_row = get_game_row(
                game_id, game_data, season_year, season_type
            )
            if season_id is None:
                season_id = game_row["season_id"]
            elif season_id != game_row["season_id"]:
                raise AssertionError

            game_count += 1

        #     if game_count > 2:
        #         break
        #
        # games = {k: v for k, v in games.items() if isinstance(v, dict)}

        if season_type == "Regular Season":
            records = {}
            for game_row in games.values():
                away_score, home_score = [
                    int(x) for x in game_row["score"].split(" - ")
                ]
                away_team = game_row["away_team_abbr"]
                home_team = game_row["home_team_abbr"]
                away_win_loss = records.setdefault(away_team, [0, 0])
                home_win_loss = records.setdefault(home_team, [0, 0])
                if away_score > home_score:
                    away_win_loss[0] = away_win_loss[0] + 1
                    home_win_loss[1] = home_win_loss[1] + 1
                elif away_score < home_score:
                    away_win_loss[1] = away_win_loss[1] + 1
                    home_win_loss[0] = home_win_loss[0] + 1
                else:
                    pass

        for game_row in games.values():
            home_record = records[game_row["home_team_abbr"]]
            away_record = records[game_row["away_team_abbr"]]
            home_pct = float(home_record[0] / float(sum(home_record)))
            away_pct = float(away_record[0] / float(sum(away_record)))
            game_row["home_regular_season_win_pct"] = home_pct
            game_row["away_regular_season_win_pct"] = away_pct

        for game_row in sorted(games.values(), key=lambda x: x["game_date"]):
            if game_row["game_id"] in game_ids:
                continue

            for attempt in range(100):
                try:
                    pbp = playbyplay.PlayByPlay(
                        game_id=game_row["game_id"], headers=headers
                    )
                except Exception as excep:
                    print(f"Request error {str(excep)} ... trying aging ...")
                    time.sleep(10.0)
                else:
                    break

            df = pbp.get_data_frames()[0]
            df = df[["GAME_ID", "PERIOD", "PCTIMESTRING", "SCORE"]]
            df.dropna(subset=["SCORE"], inplace=True)

            play_by_play_scores = [tuple(x[1]) for x in df.iterrows()]

            if play_by_play_scores:
                play_by_play_score = play_by_play_scores[-1][-1]

                if game_row["score"] != play_by_play_score:
                    if game_row["game_id"] == "0029600070":
                        # error in name game db https://www.espn.com/nba/matchup/_/gameId/161110005
                        game_row["score"] = play_by_play_score
                    elif game_row["game_id"] == "0029600332":
                        # error, https://www.nba.com/game/gsw-vs-sea-0029600332
                        game_row["score"] = play_by_play_score
                    elif game_row["game_id"] == "0029600370":
                        # error, https://www.nba.com/game/dal-vs-sea-0029600370undefined
                        game_row["score"] = play_by_play_score
                    elif game_row["game_id"] == "0049600063":
                        scores = list(reversed([x[-1] for x in play_by_play_scores]))
                        play_by_play_scores = [list(x) for x in play_by_play_scores]
                        for index, score in enumerate(play_by_play_scores):
                            score[-1] = scores[index]
                        play_by_play_scores = [tuple(x) for x in play_by_play_scores]
                    elif game_row["game_id"] == "0049700045":
                        scores = list(reversed([x[-1] for x in play_by_play_scores]))
                        play_by_play_scores = [list(x) for x in play_by_play_scores]
                        for index, score in enumerate(play_by_play_scores):
                            score[-1] = scores[index]
                        play_by_play_scores = [tuple(x) for x in play_by_play_scores]
                    elif game_row["game_id"] == "0029800661":
                        # error, https://basketball.realgm.com/nba/boxscore/1999-04-28/New-Jersey-at-Detroit/80699
                        game_row["score"] = play_by_play_score
                    elif game_row["game_id"] == "0020300778":
                        # https://www.espn.com/nba/playbyplay/_/gameId/240218003
                        del play_by_play_scores[-2:]
                    elif game_row["game_id"] == "0021301006":
                        # https://www.espn.com/nba/game/_/gameId/400489879/wizards-kings
                        del play_by_play_scores[-1:]
                    elif game_row["game_id"] == "0021500916":
                        # https://www.nba.com/game/por-vs-tor-0021500916
                        del play_by_play_scores[-1:]
                    elif game_row["game_id"] == "0021700025":
                        # https://www.nba.com/game/gsw-vs-nop-0021700025/
                        # # MISSING GAME
                        continue
                    elif game_row["game_id"] == "0021700211":
                        del play_by_play_scores[-1:]
                    elif game_row["game_id"] == "0022100028":
                        # https://www.nba.com/game/0022100028
                        del play_by_play_scores[-1:]
                    elif game_row["game_id"] == "0022100298":
                        del play_by_play_scores[-1:]
                    elif game_row["game_id"] == "0022301202":
                        del play_by_play_scores[-2:]
                    else:
                        breakpoint()

                play_by_play_score = play_by_play_scores[-1][-1]

                if game_row["score"] != play_by_play_score:
                    raise AssertionError

                cols = ", ".join(scores_column_names)
                question_marks = ", ".join(["?"] * len(scores_column_names))
                insert_sql = f"INSERT INTO scores ({cols}) VALUES ({question_marks});"
                cursor.executemany(insert_sql, play_by_play_scores)

            cols = ", ".join(games_column_names)
            question_marks = ", ".join(["?"] * len(games_column_names))
            insert_sql = f"INSERT INTO games ({cols}) VALUES ({question_marks});"
            game_rows = []
            game_rows.append(tuple(game_row[key] for key in games_column_names))
            cursor.executemany(insert_sql, game_rows)
            con.commit()

            elapsed_time = time.time() - time_start
            print(
                f"Processed game {elapsed_time:0.2f} {season_year} "
                f"{game_row['game_id']} {game_row['game_date']} "
                f"{game_row['away_team_abbr']} @ {game_row['home_team_abbr']} "
                f"{game_row['score']}"
            )
            time.sleep(0.100)

        if season_key not in season_keys:
            cols = ", ".join(season_column_names)
            try:
                cursor.execute(
                    f"INSERT INTO seasons ({cols}) VALUES ('{season_key}', '{season_id}', "
                    f"'{season_year}', '{season_type}');"
                )
                con.commit()
            except sqlite3.IntegrityError:
                pass


con.close()
exit()

# gamesplaybyplay.PlayByPlay(headers=headers)
# games_dict = gamefinder.get_dict()
# games = games_dict["resultSets"][0]["rowSet"]
# headers = games_dict["resultSets"][0]["headers"]
# games_df = pd.DataFrame(games, columns=headers)
# breakpoint()

# Convert to DataFrame

from nba_api.stats.endpoints import playbyplayv2

# pbp = playbyplayv2.PlayByPlayV2(game_id="0042300405")
# df = pbp.get_data_frames()[0]
# df = df[["GAME_ID", "PERIOD", "PCTIMESTRING", "SCORE"]]
# df.dropna(subset=["SCORE"], inplace=True)

breakpoint()

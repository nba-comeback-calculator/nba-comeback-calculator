# form_nba_chart_json_data_plot_primitives.py
"""
Plot primitive classes for NBA chart data generation.

This module defines the core classes used to create the JSON data structure
for NBA visualization charts. It includes classes for representing lines,
points, and complete plots that can be serialized to JSON.
"""

# Standard library imports
import json
import os

# Local imports
from form_nba_chart_json_data_num import Num


# Define PointMarginPercent class here to avoid circular imports
class PointMarginPercent:
    def __repr__(self):
        odds, win_count, loss_count, game_count = self.odds
        return f"{int(100.0 * (odds or 0.0))}% {win_count}/{loss_count}"

    def __init__(self):
        self.wins = set()
        self.losses = set()

    @property
    def odds(self):
        try:
            odds = float(len(self.wins) / self.win_plus_loss_count)
        except ZeroDivisionError:
            odds = None
        return [odds, len(self.wins), len(self.losses), self.game_count]

    @property
    def game_count(self):
        return float(len(self.wins | self.losses))

    @property
    def win_plus_loss_count(self):
        return float(len(self.wins) + len(self.losses))

    def to_json(self, games, all_game_ids, calculate_occurrences):
        number_of_games = len(all_game_ids)
        if not calculate_occurrences:
            json_data = {
                "win_count": len(self.wins),
                "loss_count": len(self.losses),
                "win_plus_loss_count": self.win_plus_loss_count,
                "game_count": self.game_count,
                "point_margin_occurs_percent": float(self.game_count) / number_of_games,
            }
        else:
            json_data = {
                "win_plus_loss_count": self.win_plus_loss_count,
                "game_count": self.game_count,
                "point_margin_occurs_percent": float(self.game_count) / number_of_games,
            }

        if not calculate_occurrences:
            # Sample up to 10 random wins
            win_games = self.wins
            loss_games = self.losses
            mode_keys = ["win", "loss"]
        else:
            occurred_games = self.wins | self.losses
            not_occurred_games = all_game_ids - occurred_games
            mode_keys = ["occurred", "not_occurred"]

        for mode in mode_keys:
            game_ids = locals()[f"{mode}_games"]
            game_sample = Num.random.sample(list(game_ids), min(10, len(game_ids)))

            # Create Game objects for the samples
            sorted_games = [games[game_id] for game_id in game_sample]
            sorted_games.sort(key=lambda game: game.game_date)
            json_data[f"{mode}_games"] = [
                {
                    "game_id": game.game_id,
                    "game_date": game.game_date,
                    "game_summary": game.get_game_summary_json_string(),
                }
                for game in sorted_games
            ]

        return json_data


class PlotLine:
    def get_xy(self):
        raise NotImplementedError("Subclasses must implement the get_xy method")


class PointsDownLine(PlotLine):
    min_percent = 1 / 10000000000.0
    max_percent = 1.0 - min_percent

    def __init__(
        self,
        games,
        game_filter,
        start_time,
        stop_time=None,
        legend=None,
        cumulate=False,
        min_point_margin=None,
        max_point_margin=None,
        fit_min_win_game_count=None,
        fit_max_points=float("inf"),
        calculate_occurrences=False,
    ):
        self.plot_type = "percent_v_margin"
        self.games = games
        self.legend = legend

        self.start_time = start_time
        self.stop_time = stop_time
        self.point_margin_map = point_margin_map = self.setup_point_margin_map(
            games, game_filter, start_time, stop_time
        )
        x = [(x, y.odds[0])[0] for x, y in sorted(point_margin_map.items())]
        y = [(x, y.odds[0])[1] for x, y in sorted(point_margin_map.items())]

        all_game_ids = self.get_all_game_ids()
        self.number_of_games = len(all_game_ids)
        if self.legend:
            self.legend = f"{legend} ({self.number_of_games} Games)"

        if cumulate:
            self.cumulate_point_totals(point_margin_map)

        import form_nba_chart_json_data_season_game_loader as loader

        self.clean_point_margin_map_end_points(point_margin_map)

        self.point_margin_map = point_margin_map
        self.point_margins = sorted(point_margin_map)
        self.percents = [
            point_margin_map[minute].odds[0] for minute in self.point_margins
        ]
        self.occurs = [
            point_margin_map[minute].odds[-1] / self.number_of_games
            for minute in self.point_margins
        ]
        if calculate_occurrences:
            self.percents = self.occurs

        self.percents = [max(self.min_percent, percent) for percent in self.percents]
        self.percents = [min(self.max_percent, percent) for percent in self.percents]
        self.sigmas = [Num.PPF(percent) for percent in self.percents]

        fix_max_points = self.fit_regression_lines(
            fit_min_win_game_count,
            fit_max_points,
            calculate_occurrences=calculate_occurrences,
        )
        if max_point_margin == "auto":
            max_point_margin = fix_max_points + 6

        if min_point_margin is not None or max_point_margin is not None:
            self.filter_max_point_margin(min_point_margin, max_point_margin)

        self.max_point_margin = max_point_margin

    def get_all_game_ids(self):
        all_game_ids = set()
        for data in self.point_margin_map.values():
            all_game_ids.update(data.wins)
            all_game_ids.update(data.losses)
        return all_game_ids

    def setup_point_margin_map(self, games, game_filter, start_time, stop_time):
        point_margin_map = {}
        for game in games:
            if stop_time is None:
                sign = 1 if game.score_diff > 0 else -1
                point_margin = game.score_stats_by_minute.point_margins[
                    48 - start_time - 1
                ]
                win_point_margin = sign * point_margin
                lose_point_margin = -1 * win_point_margin
            elif start_time is not None and stop_time is not None:
                win_point_margin = float("inf")
                lose_point_margin = float("inf")
                for minute in range(start_time, stop_time - 1, -1):
                    min_point_margin = game.score_stats_by_minute.min_point_margins[
                        48 - minute
                    ]
                    max_point_margin = game.score_stats_by_minute.max_point_margins[
                        48 - minute
                    ]
                    if game.score_diff > 0:
                        win_point_margin = min(min_point_margin, win_point_margin)
                        lose_point_margin = min(
                            -1.0 * max_point_margin, lose_point_margin
                        )
                    elif game.score_diff < 0:
                        win_point_margin = min(
                            -1.0 * max_point_margin, win_point_margin
                        )
                        lose_point_margin = min(min_point_margin, lose_point_margin)
                    else:
                        raise AssertionError
            else:
                raise AssertionError

            if game_filter is None or game_filter.is_match(game, is_win=True):
                win_point_margin_percent = point_margin_map.setdefault(
                    win_point_margin, PointMarginPercent()
                )
                win_point_margin_percent.wins.add(game.game_id)
            if game_filter is None or game_filter.is_match(game, is_win=False):
                lose_point_margin_percent = point_margin_map.setdefault(
                    lose_point_margin, PointMarginPercent()
                )
                lose_point_margin_percent.losses.add(game.game_id)

        return point_margin_map

    def cumulate_point_totals(self, point_margin_map):
        point_margin_items = sorted(point_margin_map.items())
        for index, value in enumerate(point_margin_items):
            p0 = value[1]
            try:
                p1 = point_margin_items[index + 1][1]
            except IndexError:
                break
            else:
                p1.wins.update(p0.wins)
                p1.losses.update(p0.losses)

    def clean_point_margin_map_end_points(self, point_margin_map):
        first_minute = None
        for minute, point_margin_percent in sorted(point_margin_map.items()):
            if point_margin_percent.odds[0] > 0:
                if first_minute is None:
                    first_minute = minute
                break
            else:
                first_minute = minute

        last_minute = None
        for minute, point_margin_percent in sorted(
            point_margin_map.items(), reverse=True
        ):
            if point_margin_percent.odds[0] < 1.0:
                if last_minute is None:
                    last_minute = minute
                break
            else:
                last_minute = minute

        for minute, point_margin_percent in sorted(point_margin_map.items()):
            if minute < first_minute:
                wins = point_margin_percent.wins
                if wins:
                    raise AssertionError
                point_margin_map[first_minute].losses.update(
                    point_margin_percent.losses
                )
                point_margin_map.pop(minute)
            elif minute > last_minute:
                losses = point_margin_percent.losses
                if losses:
                    raise AssertionError
                point_margin_map[last_minute].wins.update(point_margin_percent.wins)
                point_margin_map.pop(minute)

    def fit_regression_lines(
        self, min_game_count, max_fit_point, calculate_occurrences
    ):
        if calculate_occurrences:
            self.m = None
            self.b = None
            return max_fit_point

        if str(max_fit_point).endswith("%"):
            amount = float(max_fit_point[:-1]) / 100.0
            for index, max_fit_point_amount in enumerate(self.point_margins):
                if self.percents[index] > amount:
                    break
            else:
                raise AssertionError(max_fit_point)
            max_fit_point = max_fit_point_amount

        # At least 10 points of fit data
        try:
            max_fit_point = max(max_fit_point, self.point_margins[10])
        except IndexError:
            max_fit_point = max(max_fit_point, self.point_margins[-1])
        min_game_count = min_game_count if min_game_count is not None else 0
        max_fit_point = max_fit_point if max_fit_point is not None else float("inf")
        fit_xy = [
            (point_margin, self.sigmas[index])
            for index, point_margin in enumerate(self.point_margins)
            if
            (
                # len(self.point_margin_map[point_margin].wins) >= min_game_count
                self.min_percent < self.percents[index] < self.max_percent
                and point_margin <= max_fit_point
            )
        ]
        fit_x = [p[0] for p in fit_xy]
        fit_y = [p[1] for p in fit_xy]
        try:
            result = Num.least_squares(fit_x, fit_y)
            m, b = result["m"], result["b"]
        except:
            raise

        self.m = m
        self.b = b

        X = []
        Y = []
        x = []
        y = []
        for point_margin, data in sorted(self.point_margin_map.items()):
            x.append(point_margin)
            y.append(data.odds[0])
            for game_id in data.wins:
                Y.append(1)
                X.append(point_margin)
            for game_id in data.losses:
                Y.append(0)
                X.append(point_margin)
            if point_margin >= max_fit_point:
                break

        X = Num.array(X)
        Y = Num.array(Y)
        x = Num.array(x)
        y = Num.array(y)

        model_probit = Num.fit_it_mle(X=X, Y=Y, model="probit", m_est=m, b_est=b)

        self.m = model_probit["m"]
        self.b = model_probit["b"]

        return max_fit_point

    @property
    def wins_count(self):
        return [
            len(self.point_margin_map[point_margin].wins)
            for point_margin in self.point_margins
        ]

    def margin_at_percent(self, percent):
        percent = percent * 0.01
        amount = Num.PPF(percent)
        margin = (amount - self.b) / self.m
        point_A = self.point_margin_map.get(int(Num.ceil(margin)), PointMarginPercent())
        point_B = self.point_margin_map.get(
            int(Num.floor(margin)), PointMarginPercent()
        )
        if Num.absolute(point_A.odds[0] or 0.0 - percent) < Num.absolute(
            point_B.odds[0] or 0.0 - percent
        ):
            return margin, int(Num.ceil(margin)), point_A
        else:
            return margin, int(Num.floor(margin)), point_B

    def margin_at_record(self):
        for point_margin, data in sorted(self.point_margin_map.items()):
            if data.wins:
                return point_margin, point_margin, data

    def filter_max_point_margin(self, min_point_margin, max_point_margin):
        if min_point_margin is not None:
            self.point_margin_map = {
                k: v for k, v in self.point_margin_map.items() if k >= min_point_margin
            }
            self.point_margins = sorted(self.point_margin_map)
            self.percents = self.percents[-len(self.point_margins) :]
            self.occurs = self.occurs[-len(self.point_margins) :]
            self.sigmas = self.sigmas[-len(self.point_margins) :]
        if max_point_margin is not None:
            self.point_margin_map = {
                k: v for k, v in self.point_margin_map.items() if k <= max_point_margin
            }
            self.point_margins = sorted(self.point_margin_map)
            self.percents = self.percents[: len(self.point_margins)]
            self.occurs = self.occurs[: len(self.point_margins)]
            self.sigmas = self.sigmas[: len(self.point_margins)]

    def get_xy(self):
        return self.point_margins, self.sigmas

    def to_json(self, calculate_occurrences=False):
        json_data = {
            "legend": self.legend,
            "m": self.m,
            "b": self.b,
            "number_of_games": self.number_of_games,
            # "r_value": self.r_value,
        }
        json_data["x_values"] = list(self.point_margins)
        json_data["y_values"] = y_values = []
        for index, point_margin in enumerate(self.point_margins):
            point_margin_json = self.point_margin_map[point_margin].to_json(
                self.games,
                self.get_all_game_ids(),
                calculate_occurrences,
            )
            point_margin_json["percent"] = self.percents[index]
            point_margin_json["sigma"] = self.sigma_final[index]
            point_margin_json["y_value"] = self.sigma_final[index]
            point_margin_json["x_value"] = self.point_margins[index]
            y_values.append(point_margin_json)
        return json_data

    def plot_point_raw_margins(self, games):
        # This method is not used in the production code and requires direct
        # plotting libraries. It is kept for reference purposes only.
        pass

    def set_sigma_final(self, min_y, max_y):
        y = self.percents
        y = [max(min_y, p) for p in y]
        y = [min(max_y, p) for p in y]
        y = [Num.PPF(p) for p in y]
        self.sigma_final = y


class PercentLine(PlotLine):
    def __init__(self, games, legend, x_values, line_data):
        self.games = games
        self.legend = legend
        self.x_values = x_values
        self.line_data = line_data
        # Store game count for matching PointsDownLine behavior
        self.number_of_games = len(games) if games else 0

    def get_xy(self):
        """Required implementation of PlotLine interface."""
        x_values = self.x_values
        y_values = [point[0] for point in self.line_data]
        return x_values, y_values

    def to_json(self, calculate_occurrences=False):
        """Convert line data to JSON format.

        This method matches the signature of PointsDownLine.to_json()
        by accepting a calculate_occurrences parameter, though it's not used.
        """
        json_data = {
            "legend": self.legend,
            "number_of_games": self.number_of_games,
        }

        if self.legend == "Record":
            adjust_y = 0.2
        else:
            adjust_y = 0.0

        json_data["x_values"] = self.x_values
        json_data["y_values"] = y_values = []

        for index, point in enumerate(self.line_data):
            if isinstance(point, float):
                point_json = {}
                y_value = y_fit_value = point
            else:
                point_margin_percent = point[-1]
                y_value = point[1]
                y_fit_value = point[0] - adjust_y

                if point_margin_percent is None:
                    point_json = {}
                else:
                    point_json = point_margin_percent.to_json(
                        self.games, set(self.games.keys()), calculate_occurrences=False
                    )
                    if self.legend != "Record":
                        if "win_games" in point_json:
                            point_json.pop("win_games")
                        if "loss_games" in point_json:
                            point_json.pop("loss_games")
                        if (
                            hasattr(point_margin_percent, "odds")
                            and point_margin_percent.odds
                        ):
                            point_json["percent"] = point_margin_percent.odds[0]

            point_json["x_value"] = self.x_values[index]
            point_json["y_value"] = y_value
            point_json["y_fit_value"] = y_fit_value
            y_values.append(point_json)

        return json_data


class FinalPlot:
    def __init__(
        self,
        plot_type,
        title,
        x_label,
        y_label,
        # x_ticks,
        y_ticks,
        y_tick_labels,
        min_x,
        max_x,
        lines,
        json_name,
        use_normal_labels=False,
        cumulate=False,
        calculate_occurrences=False,
    ):
        self.plot_type = plot_type
        self.title = title
        self.min_x = min_x
        self.max_x = max_x
        self.x_label = x_label
        self.y_label = ("Win " + "\u03c3") if use_normal_labels else y_label
        # self.x_ticks = x_ticks
        if use_normal_labels == "max_or_more":
            y_ticks = list(Num.arange(-4.0, 2.0, 0.5))
            y_tick_labels = [f"{p:0.2f}" for p in y_ticks]
        elif use_normal_labels == "at":
            y_ticks = list(Num.arange(-3.5, 4.0, 0.5))
            y_tick_labels = [f"{p:0.2f}" for p in y_ticks]
        elif use_normal_labels == "max":
            y_ticks = list(Num.arange(-4.0, 3.0, 0.5))
            y_tick_labels = [f"{p:0.2f}" for p in y_ticks]
        elif not use_normal_labels:
            pass
        else:
            raise NotImplementedError(use_normal_labels)

        self.calculate_occurrences = calculate_occurrences
        self.y_ticks = y_ticks
        self.y_tick_labels = y_tick_labels
        self.lines = lines
        self.json_name = json_name

    def to_json(self):
        json_data = dict(self.__dict__)
        json_data.pop("json_name")
        lines = json_data.pop("lines")

        json_data["lines"] = json_lines = []

        for line in lines:
            json_lines.append(line.to_json(self.calculate_occurrences))

        # Make sure the directory exists
        os.makedirs(os.path.dirname(self.json_name), exist_ok=True)
        if not self.json_name.endswith(".gz"):
            self.json_name = self.json_name + ".gz"
        if self.json_name.endswith(".gz"):
            import gzip

            with gzip.open(self.json_name, "wt") as fileobj:
                fileobj.write(json.dumps(json_data, indent=4))
        else:
            with open(self.json_name, "w") as fileobj:
                fileobj.write(json.dumps(json_data, indent=4))

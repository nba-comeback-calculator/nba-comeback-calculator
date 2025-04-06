/**
 * nbacc_calculator_plot_primitives.js
 *
 * Plot primitive classes for NBA chart data generation.
 *
 * This module defines the core classes used to create the JSON data structure
 * for NBA visualization charts. It includes classes for representing lines,
 * points, and complete plots that can be serialized to JSON.
 */

const nbacc_calculator_plot_primitives = (() => {
    // Import modules via their global objects

    /**
     * Class representing a point margin with percentage calculations
     */
    class PointMarginPercent {
        constructor() {
            this.wins = new Set();
            this.losses = new Set();
        }

        toString() {
            const [odds, win_count, loss_count, game_count] = this.odds;
            return `${Math.round(100.0 * (odds || 0.0))}% ${win_count}/${loss_count}`;
        }

        get odds() {
            let odds;
            try {
                odds = this.wins.size / this.win_plus_loss_count;
            } catch (error) {
                odds = null;
            }
            return [odds, this.wins.size, this.losses.size, this.game_count];
        }

        get game_count() {
            // Set union in JavaScript: combine sets and get unique count
            const unionSet = new Set([...this.wins, ...this.losses]);
            return unionSet.size;
        }

        get win_plus_loss_count() {
            return this.wins.size + this.losses.size;
        }

        to_json(games, all_game_ids, calculate_occurrences) {
            const number_of_games = all_game_ids.size;
            let json_data;

            if (!calculate_occurrences) {
                json_data = {
                    win_count: this.wins.size,
                    loss_count: this.losses.size,
                    win_plus_loss_count: this.win_plus_loss_count,
                    game_count: this.game_count,
                    point_margin_occurs_percent: this.game_count / number_of_games,
                };
            } else {
                json_data = {
                    win_plus_loss_count: this.win_plus_loss_count,
                    game_count: this.game_count,
                    point_margin_occurs_percent: this.game_count / number_of_games,
                };
            }

            if (!calculate_occurrences) {
                // Sample up to 10 random wins
                const win_games = this.wins;
                const loss_games = this.losses;
                const mode_keys = ["win", "loss"];

                for (const mode of mode_keys) {
                    const game_ids = mode === "win" ? win_games : loss_games;
                    let game_sample;
                    if (game_ids.size === 0) {
                        game_sample = [];
                    } else {
                        game_sample = Num.random_sample(
                            Array.from(game_ids),
                            Math.min(10, game_ids.size)
                        );
                    }
                    // Create Game objects for the samples
                    const sorted_games = game_sample.map(
                        (game_id) => games.games[game_id]
                    );

                    // Only sort and map if we have games
                    sorted_games.sort((a, b) => a.game_date.localeCompare(b.game_date));
                    json_data[`${mode}_games`] = sorted_games.map((game) => ({
                        game_id: game.game_id,
                        game_date: game.game_date,
                        game_summary: game.get_game_summary_json_string(),
                    }));
                }
            } else {
                const occurred_games = new Set([...this.wins, ...this.losses]);
                const not_occurred_games = new Set(
                    Array.from(all_game_ids).filter((id) => !occurred_games.has(id))
                );
                const mode_keys = ["occurred", "not_occurred"];

                for (const mode of mode_keys) {
                    const game_ids =
                        mode === "occurred" ? occurred_games : not_occurred_games;

                    // Safe sampling function in case Num.random.sample is undefined
                    let game_sample;
                    if (game_ids.size === 0) {
                        game_sample = [];
                    } else if (Num.random && typeof Num.random.sample === "function") {
                        game_sample = Num.random.sample(
                            Array.from(game_ids),
                            Math.min(10, game_ids.size)
                        );
                    } else {
                        // Fallback to basic sampling if Num.random.sample is not available
                        const idsArray = Array.from(game_ids);
                        const sampleSize = Math.min(10, idsArray.length);
                        game_sample = idsArray.slice(0, sampleSize);
                    }

                    // Create Game objects for the samples
                    const sorted_games = game_sample.map(
                        (game_id) => games.games[game_id]
                    );

                    if (sorted_games.length > 0) {
                        // Only sort and map if we have games
                        sorted_games.sort((a, b) =>
                            a.game_date.localeCompare(b.game_date)
                        );

                        json_data[`${mode}_games`] = sorted_games.map((game) => ({
                            game_id: game.game_id,
                            game_date: game.game_date,
                            game_summary: game.get_game_summary_json_string(),
                        }));
                    } else {
                        // Empty array for no games
                        json_data[`${mode}_games`] = [];
                    }
                }
            }

            return json_data;
        }
    }

    /**
     * Base class for plot lines
     */
    class PlotLine {
        get_xy() {
            throw new Error("Subclasses must implement the get_xy method");
        }
    }

    /**
     * Class representing a points-down line in a chart
     */
    class PointsDownLine extends PlotLine {
        // Constants for numerical stability
        static min_percent = 1 / 10000000000.0;
        static max_percent = 1.0 - 1 / 10000000000.0;

        constructor(
            games,
            game_filter,
            start_time,
            down_mode = "at",
            legend = null,
            cumulate = false,
            min_point_margin = null,
            max_point_margin = null,
            fit_min_win_game_count = null,
            fit_max_points = Infinity,
            calculate_occurrences = false
        ) {
            super();

            this.plot_type = "percent_v_margin";
            this.games = games;
            this.legend = legend;
            this.cumulate = cumulate; // Store cumulate as an instance variable

            this.start_time = start_time;
            this.down_mode = down_mode;
            this.point_margin_map = this.setup_point_margin_map(
                games,
                game_filter,
                start_time,
                down_mode
            );
            this.all_game_ids = this.get_all_game_ids();
            this.number_of_games = this.all_game_ids.size;
            if (this.legend) {
                this.legend = `${legend} (${this.number_of_games} Games)`;
            }

            if (cumulate) {
                this.cumulate_point_totals(this.point_margin_map);
            }

            // Store or_less_point_margin and or_more_point_margin from clean_point_margin_map_end_points
            const [or_less_point_margin, or_more_point_margin] = this.clean_point_margin_map_end_points(this.point_margin_map);
            
            // Store these values like the Python implementation
            this.or_less_point_margin = or_less_point_margin;
            this.or_more_point_margin = or_more_point_margin;

            this.point_margins = Object.keys(this.point_margin_map)
                .map(Number)
                .sort((a, b) => a - b);
            this.percents = this.point_margins.map(
                (margin) => this.point_margin_map[margin].odds[0]
            );
            this.occurs = this.point_margins.map(
                (margin) => this.point_margin_map[margin].odds[3] / this.number_of_games
            );

            if (calculate_occurrences) {
                this.percents = this.occurs;
            }

            // Ensure percentages are within bounds
            this.percents = this.percents.map((percent) =>
                Math.max(
                    PointsDownLine.min_percent,
                    Math.min(
                        PointsDownLine.max_percent,
                        percent || PointsDownLine.min_percent
                    )
                )
            );

            this.sigmas = this.percents.map((percent) => Num.PPF(percent));

            const fix_max_points = this.fit_regression_lines(
                fit_min_win_game_count,
                fit_max_points,
                calculate_occurrences
            );

            if (max_point_margin === "auto") {
                max_point_margin = fix_max_points + 6;
            }

            if (min_point_margin !== null || max_point_margin !== null) {
                this.filter_max_point_margin(min_point_margin, max_point_margin);
            }

            this.max_point_margin = max_point_margin;
        }

        get_all_game_ids() {
            const all_game_ids = new Set();
            for (const data of Object.values(this.point_margin_map)) {
                data.wins.forEach((id) => all_game_ids.add(id));
                data.losses.forEach((id) => all_game_ids.add(id));
            }
            return all_game_ids;
        }

        setup_point_margin_map(games, game_filter, start_time, down_mode) {
            const point_margin_map = {};

            for (const game of games) {
                let win_point_margin, lose_point_margin;

                if (down_mode === "at") {
                    // Points down at a specific time
                    const sign = game.score_diff > 0 ? 1 : -1;

                    // Get the index for this time point directly from the TIME_TO_INDEX_MAP
                    const index = nbacc_calculator_season_game_loader.TIME_TO_INDEX_MAP[start_time];
                    
                    // Get the point margin at this specific time
                    const point_margin = game.score_stats_by_minute.point_margins[index];
                    win_point_margin = sign * point_margin;
                    lose_point_margin = -1 * win_point_margin;
                } else if (down_mode === "max") {
                    // Max points down during a time period to the end of the game
                    win_point_margin = Infinity;
                    lose_point_margin = Infinity;

                    // Get the start index for the time (works with both number and string formats)
                    const startIndex = nbacc_calculator_season_game_loader.TIME_TO_INDEX_MAP[start_time];
                    // Define the end index (end of game is index of 0 minute)
                    const stopIndex =
                        nbacc_calculator_season_game_loader.TIME_TO_INDEX_MAP[0];

                    // Loop through all time points from start_time to the end of the game
                    // Using the Python's range(start_index, stop_index + 1) equivalent
                    for (let i = startIndex; i <= stopIndex; i++) {
                        const minute = nbacc_calculator_season_game_loader.GAME_MINUTES[i];
                        
                        let min_point_margin, max_point_margin;
                        
                        // For first time point, use the current margin
                        if (i === startIndex) {
                            min_point_margin = game.score_stats_by_minute.point_margins[i];
                            max_point_margin = game.score_stats_by_minute.point_margins[i];
                        } else {
                            // For subsequent time points, use min/max values
                            min_point_margin = game.score_stats_by_minute.min_point_margins[i];
                            max_point_margin = game.score_stats_by_minute.max_point_margins[i];
                        }

                        if (game.score_diff > 0) {
                            win_point_margin = Math.min(
                                min_point_margin,
                                win_point_margin
                            );
                            lose_point_margin = Math.min(
                                -1.0 * max_point_margin,
                                lose_point_margin
                            );
                        } else if (game.score_diff < 0) {
                            win_point_margin = Math.min(
                                -1.0 * max_point_margin,
                                win_point_margin
                            );
                            lose_point_margin = Math.min(
                                min_point_margin,
                                lose_point_margin
                            );
                        } else {
                            throw new Error("NBA games can't end in a tie");
                        }
                    }
                } else {
                    throw new Error(
                        `Invalid down_mode: ${down_mode}. Must be "at" or "max"`
                    );
                }

                // Add game to win/loss maps based on filter
                if (game_filter === null || game_filter.is_match(game, true)) {
                    if (!point_margin_map[win_point_margin]) {
                        point_margin_map[win_point_margin] = new PointMarginPercent();
                    }
                    point_margin_map[win_point_margin].wins.add(game.game_id);
                }

                if (game_filter === null || game_filter.is_match(game, false)) {
                    if (!point_margin_map[lose_point_margin]) {
                        point_margin_map[lose_point_margin] = new PointMarginPercent();
                    }
                    point_margin_map[lose_point_margin].losses.add(game.game_id);
                }
            }

            return point_margin_map;
        }

        cumulate_point_totals(point_margin_map) {
            const point_margin_items = Object.entries(point_margin_map)
                .map(([key, value]) => [Number(key), value])
                .sort((a, b) => a[0] - b[0]);

            for (let index = 0; index < point_margin_items.length - 1; index++) {
                const p0 = point_margin_items[index][1];
                const p1 = point_margin_items[index + 1][1];

                // Add p0's wins/losses to p1
                p0.wins.forEach((id) => p1.wins.add(id));
                p0.losses.forEach((id) => p1.losses.add(id));
            }
        }

        clean_point_margin_map_end_points(point_margin_map) {
            // Find first minute with win percentage > 0
            let first_point_margin = null;
            const sortedEntries = Object.entries(point_margin_map)
                .map(([key, value]) => [Number(key), value])
                .sort((a, b) => a[0] - b[0]);

            for (const [point_margin, data] of sortedEntries) {
                if (data.odds[0] > 0) {
                    if (first_point_margin === null) {
                        first_point_margin = point_margin;
                    }
                    break;
                } else {
                    first_point_margin = point_margin;
                }
            }

            // Find last minute with win percentage < 1.0
            let last_point_margin = null;
            const sortedEntriesReverse = [...sortedEntries].sort((a, b) => b[0] - a[0]);

            for (const [point_margin, data] of sortedEntriesReverse) {
                if (data.odds[0] < 1.0) {
                    if (last_point_margin === null) {
                        last_point_margin = point_margin;
                    }
                    break;
                } else {
                    last_point_margin = point_margin;
                }
            }

            // Move data from points below first_point_margin to first_point_margin
            for (const [point_margin, data] of sortedEntries) {
                if (point_margin < first_point_margin) {
                    // Should have no wins
                    if (data.wins.size > 0) {
                        throw new Error("Unexpected wins found in low point margin");
                    }

                    // Move losses to first_point_margin
                    if (!point_margin_map[first_point_margin]) {
                        point_margin_map[first_point_margin] = new PointMarginPercent();
                    }

                    data.losses.forEach((id) =>
                        point_margin_map[first_point_margin].losses.add(id)
                    );

                    delete point_margin_map[point_margin];
                } else if (point_margin > last_point_margin) {
                    // Should have no losses
                    if (data.losses.size > 0) {
                        throw new Error("Unexpected losses found in high point margin");
                    }

                    // Move wins to last_point_margin
                    if (!point_margin_map[last_point_margin]) {
                        point_margin_map[last_point_margin] = new PointMarginPercent();
                    }

                    data.wins.forEach((id) =>
                        point_margin_map[last_point_margin].wins.add(id)
                    );

                    delete point_margin_map[point_margin];
                }
            }
            
            // Return the first and last point margins, just like the Python version
            return [first_point_margin, last_point_margin];
        }

        fit_regression_lines(min_game_count, max_fit_point, calculate_occurrences) {
            if (calculate_occurrences) {
                this.m = null;
                this.b = null;
                return max_fit_point;
            }

            // Handle percentage-based max fit point
            if (typeof max_fit_point === "string" && max_fit_point.endsWith("%")) {
                const amount = parseFloat(max_fit_point) / 100.0;
                let max_fit_point_amount;
                
                // With very short time values (e.g., 5s, 10s), there might not be enough data points
                // Default to the highest available point margin if we can't find one matching the percentage
                if (this.point_margins.length > 0) {
                    // Find a margin where percentage exceeds target or use the highest available
                    for (let index = 0; index < this.point_margins.length; index++) {
                        if (this.percents[index] > amount) {
                            max_fit_point_amount = this.point_margins[index];
                            break;
                        }
                    }
                    
                    // If no margin exceeds the target, use the highest one
                    if (!max_fit_point_amount) {
                        max_fit_point_amount = this.point_margins[this.point_margins.length - 1];
                        console.log(`Using highest available point margin ${max_fit_point_amount} for ${max_fit_point} fit point`);
                    }
                } else {
                    // If no point margins are available, use a reasonable default
                    max_fit_point_amount = 0;
                    console.log(`No point margins available for ${max_fit_point} fit point, using 0 as default`);
                }

                max_fit_point = max_fit_point_amount;
            }

            // Ensure at least 10 points for fit
            try {
                max_fit_point = Math.max(max_fit_point, this.point_margins[10]);
            } catch (error) {
                max_fit_point = Math.max(
                    max_fit_point,
                    this.point_margins[this.point_margins.length - 1]
                );
            }

            min_game_count = min_game_count !== null ? min_game_count : 0;
            max_fit_point = max_fit_point !== null ? max_fit_point : Infinity;

            // Gather points for fitting
            const fit_xy = [];
            for (let i = 0; i < this.point_margins.length; i++) {
                const point_margin = this.point_margins[i];
                if (
                    PointsDownLine.min_percent < this.percents[i] &&
                    this.percents[i] < PointsDownLine.max_percent &&
                    point_margin <= max_fit_point
                ) {
                    fit_xy.push([point_margin, this.sigmas[i]]);
                }
            }

            const fit_x = fit_xy.map((p) => p[0]);
            const fit_y = fit_xy.map((p) => p[1]);

            try {
                // First do simple linear regression
                let result;
                try {
                    result = Num.least_squares(fit_x, fit_y);
                } catch (error) {
                    throw error;
                }

                this.m = result.m;
                this.b = result.b;

                // Prepare data for MLE probit regression
                const X = [];
                const Y = [];
                let x = [];
                let y = [];

                for (const [point_margin, data] of Object.entries(this.point_margin_map)
                    .map(([key, value]) => [Number(key), value])
                    .sort((a, b) => a[0] - b[0])) {
                    if (point_margin > max_fit_point) break;

                    x.push(point_margin);
                    y.push(data.odds[0] || 0);

                    // Add binary outcomes for each win/loss
                    data.wins.forEach(() => {
                        Y.push(1);
                        X.push(point_margin);
                    });

                    data.losses.forEach(() => {
                        Y.push(0);
                        X.push(point_margin);
                    });
                }

                // Do MLE probit regression
                const model_probit = Num.fit_it_mle(X, Y, "probit", this.m, this.b);

                this.m = model_probit.m;
                this.b = model_probit.b;

                return max_fit_point;
            } catch (error) {
                // This console logging is no longer needed because features are working fine
                // console.error("Error fitting regression:", error);
                this.m = null;
                this.b = null;
                return max_fit_point;
            }
        }

        get wins_count() {
            return this.point_margins.map(
                (margin) => this.point_margin_map[margin].wins.size
            );
        }

        margin_at_percent(percent) {
            percent = percent * 0.01;
            const amount = Num.PPF(percent);
            const margin = (amount - this.b) / this.m;

            const point_A =
                this.point_margin_map[Math.ceil(margin)] || new PointMarginPercent();
            const point_B =
                this.point_margin_map[Math.floor(margin)] || new PointMarginPercent();

            if (
                Math.abs((point_A.odds[0] || 0) - percent) <
                Math.abs((point_B.odds[0] || 0) - percent)
            ) {
                return [margin, Math.ceil(margin), point_A];
            } else {
                return [margin, Math.floor(margin), point_B];
            }
        }

        margin_at_record() {
            for (const [point_margin, data] of Object.entries(this.point_margin_map)
                .map(([key, value]) => [Number(key), value])
                .sort((a, b) => a[0] - b[0])) {
                if (data.wins.size > 0) {
                    return [point_margin, point_margin, data];
                }
            }
        }

        filter_max_point_margin(min_point_margin, max_point_margin) {
            if (min_point_margin !== null) {
                // Keep only margins >= min_point_margin
                for (const margin of Object.keys(this.point_margin_map).map(Number)) {
                    if (margin < min_point_margin) {
                        delete this.point_margin_map[margin];
                    }
                }

                // Update arrays
                this.point_margins = Object.keys(this.point_margin_map)
                    .map(Number)
                    .sort((a, b) => a - b);
                this.percents = this.point_margins.map(
                    (margin) => this.point_margin_map[margin].odds[0]
                );
                this.occurs = this.point_margins.map(
                    (margin) =>
                        this.point_margin_map[margin].odds[3] / this.number_of_games
                );
                this.sigmas = this.percents.map((percent) =>
                    Num.PPF(
                        Math.max(
                            PointsDownLine.min_percent,
                            Math.min(
                                PointsDownLine.max_percent,
                                percent || PointsDownLine.min_percent
                            )
                        )
                    )
                );
            }

            if (max_point_margin !== null) {
                // Keep only margins <= max_point_margin
                for (const margin of Object.keys(this.point_margin_map).map(Number)) {
                    if (margin > max_point_margin) {
                        delete this.point_margin_map[margin];
                    }
                }

                // Update arrays
                this.point_margins = Object.keys(this.point_margin_map)
                    .map(Number)
                    .sort((a, b) => a - b);
                this.percents = this.point_margins.map(
                    (margin) => this.point_margin_map[margin].odds[0]
                );
                this.occurs = this.point_margins.map(
                    (margin) =>
                        this.point_margin_map[margin].odds[3] / this.number_of_games
                );
                this.sigmas = this.percents.map((percent) =>
                    Num.PPF(
                        Math.max(
                            PointsDownLine.min_percent,
                            Math.min(
                                PointsDownLine.max_percent,
                                percent || PointsDownLine.min_percent
                            )
                        )
                    )
                );
            }
        }

        get_xy() {
            return [this.point_margins, this.sigmas];
        }

        to_json(calculate_occurrences = false) {
            const json_data = {
                legend: this.legend,
                m: this.m,
                b: this.b,
                number_of_games: this.number_of_games,
                or_less_point_margin: this.or_less_point_margin,
                or_more_point_margin: this.or_more_point_margin,
            };

            json_data.x_values = this.point_margins;
            json_data.y_values = [];

            for (let index = 0; index < this.point_margins.length; index++) {
                const point_margin = this.point_margins[index];
                const point_margin_json = this.point_margin_map[point_margin].to_json(
                    this.games,
                    this.all_game_ids,
                    calculate_occurrences
                );

                point_margin_json.percent = this.percents[index];
                point_margin_json.sigma = this.sigma_final[index];
                point_margin_json.y_value = this.sigma_final[index];
                point_margin_json.x_value = point_margin;

                json_data.y_values.push(point_margin_json);
            }

            return json_data;
        }

        set_sigma_final(min_y, max_y) {
            let y = this.percents;
            y = y.map((p) => Math.max(min_y, Math.min(max_y, p)));
            y = y.map((p) => Num.PPF(p));
            this.sigma_final = y;
        }
    }

    /**
     * Class representing a percent line in a time vs point margin chart
     */
    class PercentLine extends PlotLine {
        constructor(games, legend, x_values, line_data) {
            super();
            this.games = games;
            this.legend = legend;
            this.x_values = x_values;
            this.line_data = line_data;
            // Store game count for matching PointsDownLine behavior
            this.number_of_games = games ? Object.keys(games).length : 0;
        }

        get_xy() {
            const y_values = this.line_data.map((point) =>
                Array.isArray(point) ? point[0] : point
            );
            return [this.x_values, y_values];
        }

        to_json(calculate_occurrences = false) {
            const json_data = {
                legend: this.legend,
                number_of_games: this.number_of_games,
            };

            // Adjust y values based on legend
            const adjust_y = this.legend === "Record" ? 0.2 : 0.0;

            json_data.x_values = this.x_values;
            json_data.y_values = [];

            for (let index = 0; index < this.line_data.length; index++) {
                const point = this.line_data[index];
                let point_json = {};
                let y_value, y_fit_value;

                if (typeof point === "number") {
                    y_value = y_fit_value = point;
                } else {
                    const point_margin_percent = point[2];
                    y_value = point[1];
                    y_fit_value = point[0] - adjust_y;

                    if (point_margin_percent) {
                        point_json = point_margin_percent.to_json(
                            this.games,
                            new Set(this.games ? Object.keys(this.games) : []),
                            false
                        );

                        if (this.legend !== "Record") {
                            // Remove game examples for non-Record lines to save space
                            delete point_json.win_games;
                            delete point_json.loss_games;

                            if (
                                point_margin_percent.odds &&
                                point_margin_percent.odds[0] !== null
                            ) {
                                point_json.percent = point_margin_percent.odds[0];
                            }
                        }
                    }
                }

                point_json.x_value = this.x_values[index];
                point_json.y_value = y_value;
                point_json.y_fit_value = y_fit_value;

                json_data.y_values.push(point_json);
            }

            return json_data;
        }
    }

    /**
     * Class representing a complete plot with all data needed for rendering
     */
    class FinalPlot {
        constructor(
            plot_type,
            title,
            x_label,
            y_label,
            y_ticks,
            y_tick_labels,
            min_x,
            max_x,
            lines,
            use_normal_labels = false,
            cumulate = false,
            calculate_occurrences = false
        ) {
            this.plot_type = plot_type;
            this.title = title;
            this.min_x = min_x;
            this.max_x = max_x;
            this.x_label = x_label;
            this.y_label = use_normal_labels ? "Win \u03c3" : y_label;
            this.calculate_occurrences = calculate_occurrences;

            // Handle y-tick formatting based on plot type
            if (use_normal_labels === "max_or_more") {
                this.y_ticks = Num.arange(-4.0, 2.0, 0.5);
                this.y_tick_labels = this.y_ticks.map((p) => p.toFixed(2));
            } else if (use_normal_labels === "at") {
                this.y_ticks = Num.arange(-3.5, 4.0, 0.5);
                this.y_tick_labels = this.y_ticks.map((p) => p.toFixed(2));
            } else if (use_normal_labels === "max") {
                this.y_ticks = Num.arange(-4.0, 3.0, 0.5);
                this.y_tick_labels = this.y_ticks.map((p) => p.toFixed(2));
            } else if (!use_normal_labels) {
                this.y_ticks = y_ticks;
                this.y_tick_labels = y_tick_labels;
            } else {
                throw new Error(
                    `Unsupported use_normal_labels value: ${use_normal_labels}`
                );
            }

            this.lines = lines;
            this.cumulate = cumulate;
        }

        to_json() {
            const json_data = {
                plot_type: this.plot_type,
                title: this.title,
                min_x: this.min_x,
                max_x: this.max_x,
                x_label: this.x_label,
                y_label: this.y_label,
                y_ticks: this.y_ticks,
                y_tick_labels: this.y_tick_labels,
                calculate_occurrences: this.calculate_occurrences,
                lines: this.lines.map((line) =>
                    line.to_json(this.calculate_occurrences)
                ),
            };

            return json_data;
        }
    }

    // Return public API
    return {
        PointMarginPercent,
        PlotLine,
        PointsDownLine,
        PercentLine,
        FinalPlot,
    };
})();

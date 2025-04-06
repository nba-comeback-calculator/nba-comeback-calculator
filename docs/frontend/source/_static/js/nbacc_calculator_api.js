/**
 * nbacc_calculator_api.js
 *
 * Main API module for forming NBA chart JSON data.
 *
 * This module provides the primary interface for creating JSON data for NBA game analysis charts.
 * It contains the core functions for generating different types of analysis plots based on NBA game data.
 */

const nbacc_calculator_api = (() => {
    // Import modules via their global objects
    const { Season, Games, parseSeasonType } = nbacc_calculator_season_game_loader;
    const { PointsDownLine, PercentLine, FinalPlot } = nbacc_calculator_plot_primitives;

    // Define base path for JSON (used only for reference, not for writing)
    const json_base_path = "./json/seasons";

    /**
     * Class for filtering NBA games based on team attributes
     */
    class GameFilter {
        /**
         * Initialize a GameFilter with criteria for filtering NBA games.
         *
         * @param {Object} options - Filter options
         * @param {boolean|null} options.for_at_home - If true, only include games where the "for" team is at home
         *                                             If false, only include games where the "for" team is away
         *                                             If null, don't filter based on "for" team location
         * @param {string|null} options.for_rank - Filter "for" team (comeback team) by rank category
         * @param {string|Array|null} options.for_team_abbr - Filter "for" team (comeback team) by abbreviation
         * @param {string|null} options.vs_rank - Filter "vs" team (opponent team) by rank category
         * @param {string|Array|null} options.vs_team_abbr - Filter "vs" team (opponent team) by abbreviation
         *
         * Note: "for" team refers to the team making the comeback (the team we're analyzing)
         *       "vs" team refers to the opponent team (against whom the comeback is made)
         */
        constructor({
            for_at_home = null,
            for_rank = null,
            for_team_abbr = null,
            vs_rank = null,
            vs_team_abbr = null,
        } = {}) {
            // Check for invalid combinations
            if (for_rank !== null && for_team_abbr !== null) {
                throw new Error("Cannot specify both for_rank and for_team_abbr");
            }
            if (vs_rank !== null && vs_team_abbr !== null) {
                throw new Error("Cannot specify both vs_rank and vs_team_abbr");
            }

            this.for_at_home = for_at_home;
            this.for_rank = for_rank;
            this.for_team_abbr = for_team_abbr;
            this.vs_rank = vs_rank;
            this.vs_team_abbr = vs_team_abbr;

            // Parse team abbreviations into arrays if provided as strings
            if (typeof this.for_team_abbr === "string") {
                this.for_team_abbr = this.for_team_abbr
                    .split(",")
                    .map((abbr) => abbr.trim());
            }

            if (typeof this.vs_team_abbr === "string") {
                this.vs_team_abbr = this.vs_team_abbr
                    .split(",")
                    .map((abbr) => abbr.trim());
            }

            // vs_at_home is just the inverse of for_at_home
            this.vs_at_home = this.for_at_home === null ? null : !this.for_at_home;
        }

        /**
         * Check if a game matches the filter criteria
         * @param {Game} game - Game to check
         * @param {boolean} is_win - Whether checking win or loss scenario
         * @returns {boolean} True if game matches all filter criteria
         */
        is_match(game, is_win) {
            // Determine if the home team won
            let for_team_abbr,
                for_team_rank,
                vs_team_abbr,
                vs_team_rank,
                for_team_where;

            if ((game.score_diff > 0 && is_win) || (game.score_diff < 0 && !is_win)) {
                for_team_abbr = game.home_team_abbr;
                for_team_rank = game.home_team_rank;
                vs_team_abbr = game.away_team_abbr;
                vs_team_rank = game.away_team_rank;
                for_team_where = "home";
            } else if (
                (game.score_diff < 0 && is_win) ||
                (game.score_diff > 0 && !is_win)
            ) {
                for_team_abbr = game.away_team_abbr;
                for_team_rank = game.away_team_rank;
                vs_team_abbr = game.home_team_abbr;
                vs_team_rank = game.home_team_rank;
                for_team_where = "away";
            } else {
                throw new Error("NBA games can't end in a tie");
            }

            // Check for_at_home filter if it's specified
            if (this.for_at_home === true && for_team_where !== "home") {
                return false;
            } else if (this.for_at_home === false && for_team_where !== "away") {
                return false;
            }

            // Check for_team_abbr filter
            if (this.for_team_abbr && !this.for_team_abbr.includes(for_team_abbr)) {
                return false;
            }

            // Check vs_team_abbr filter
            if (this.vs_team_abbr && !this.vs_team_abbr.includes(vs_team_abbr)) {
                return false;
            }

            // Check for_rank filter
            if (this.for_rank) {
                if (
                    !this._check_rank(
                        for_team_rank,
                        this.for_rank,
                        game.season.team_count
                    )
                ) {
                    return false;
                }
            }

            // Check vs_rank filter
            if (this.vs_rank) {
                if (
                    !this._check_rank(
                        vs_team_rank,
                        this.vs_rank,
                        game.season.team_count
                    )
                ) {
                    return false;
                }
            }

            // If all filters passed, the game matches
            return true;
        }

        /**
         * Check if a team's rank matches the specified rank filter
         * @param {number} rank - Team rank
         * @param {string} rank_filter - Rank filter
         * @param {number} team_count - Total number of teams in the season
         * @returns {boolean} True if the rank matches the filter
         * @private
         */
        _check_rank(rank, rank_filter, team_count) {
            if (rank_filter === "top_5") {
                return 1 <= rank && rank <= 5;
            } else if (rank_filter === "top_10") {
                return 1 <= rank && rank <= 10;
            } else if (rank_filter === "mid_10") {
                const mid_start = Math.floor(team_count / 2) - 5;
                const mid_end = Math.floor(team_count / 2) + 4;
                return mid_start <= rank && rank <= mid_end;
            } else if (rank_filter === "bot_10") {
                return team_count - 9 <= rank && rank <= team_count;
            } else if (rank_filter === "bot_5") {
                return team_count - 4 <= rank && rank <= team_count;
            } else {
                return false;
            }
        }

        /**
         * Get a display name for a rank filter
         * @param {string} rank_filter - Rank filter
         * @returns {string} Display name
         * @private
         */
        _get_rank_display_name(rank_filter) {
            if (!rank_filter) {
                return "";
            }

            const display_names = {
                top_5: "Top 5",
                top_10: "Top 10",
                mid_10: "Mid 10",
                bot_10: "Bot 10",
                bot_5: "Bot 5",
            };

            return display_names[rank_filter] || rank_filter;
        }

        /**
         * Generate a human-readable description of the filter criteria
         * @returns {string} Filter description
         */
        get_filter_string() {
            const for_parts = [];
            const vs_parts = [];

            // Build for criteria string
            if (this.for_rank) {
                for_parts.push(this._get_rank_display_name(this.for_rank));
            } else if (this.for_team_abbr) {
                if (
                    Array.isArray(this.for_team_abbr) &&
                    this.for_team_abbr.length === 1
                ) {
                    for_parts.push(this.for_team_abbr[0]);
                } else if (Array.isArray(this.for_team_abbr)) {
                    for_parts.push(this.for_team_abbr.join(", "));
                } else {
                    for_parts.push(this.for_team_abbr);
                }
            }

            if (this.for_at_home !== null) {
                for_parts.push(this.for_at_home ? "@ Home" : "@ Away");
            }

            // Build vs criteria string
            if (this.vs_rank) {
                vs_parts.push(this._get_rank_display_name(this.vs_rank));
            } else if (this.vs_team_abbr) {
                if (
                    Array.isArray(this.vs_team_abbr) &&
                    this.vs_team_abbr.length === 1
                ) {
                    vs_parts.push(this.vs_team_abbr[0]);
                } else if (Array.isArray(this.vs_team_abbr)) {
                    vs_parts.push(this.vs_team_abbr.join(", "));
                } else {
                    vs_parts.push(this.vs_team_abbr);
                }
            }

            // Combine for and vs parts into a complete string
            const for_str = for_parts.length > 0 ? for_parts.join(" ") : "";
            const vs_str = vs_parts.length > 0 ? `Plays ${vs_parts.join(" ")}` : "";

            if (for_str && vs_str) {
                return `For ${for_str} ${vs_str}`;
            } else if (for_str) {
                return `For ${for_str}`;
            } else if (vs_str) {
                return `For ${vs_str}`;
            } else {
                return "For All Games";
            }
        }
    }

    /**
     * Generate plots and JSON data showing win probability based on point deficit
     *
     * @param {Array} year_groups - List of year group objects with start/end years
     * @param {number} start_time - Starting minute of analysis (e.g., 24 for halftime)
     * @param {string} down_mode - Analysis mode: 'at' for specific time, 'max' for max deficit
     * @param {boolean} cumulate - Whether to cumulate point totals
     * @param {number|null} min_point_margin - Min point margin to include in analysis
     * @param {number|null} max_point_margin - Max point margin to include in analysis
     * @param {number|null} fit_min_win_game_count - Min wins required for regression fit
     * @param {number|string|null} fit_max_points - Max points to include in regression fit
     * @param {Array|GameFilter|null} game_filters - Filters to apply to games
     * @param {boolean|string} use_normal_labels - Type of labels for y-axis
     * @param {boolean} calculate_occurrences - Whether to calculate occurrence percentages
     * @param {Object} seasonData - Loaded season data
     * @returns {Object} Chart data JSON object
     */
    function plot_biggest_deficit(
        year_groups,
        start_time,
        down_mode,
        cumulate = false,
        min_point_margin = null,
        max_point_margin = null,
        fit_min_win_game_count = null,
        fit_max_points = null,
        game_filters = null,
        use_normal_labels = false,
        calculate_occurrences = false,
        seasonData = {}
    ) {
        // Ensure game_filters is properly initialized
        // If game_filters is null, undefined, or empty array, create a list with a single null element
        if (
            game_filters === null ||
            game_filters === undefined ||
            (Array.isArray(game_filters) && game_filters.length === 0)
        ) {
            game_filters = [null];
        } else if (!Array.isArray(game_filters)) {
            game_filters = [game_filters];
        }

        // Format time description
        let time_desc;
        if (start_time === 48) {
            time_desc = "Entire Game";
        } else if (start_time === 36) {
            if (down_mode === "at") {
                time_desc = "3rd Quarter";
            } else {
                time_desc = "Final 3 Quarters";
            }
        } else if (start_time === 24) {
            time_desc = "2nd Half";
        } else if (start_time === 12) {
            time_desc = "4th Quarter";
        } else if (start_time === 1) {
            time_desc = "Final Minute";
        } else if (typeof start_time === "string" && start_time.endsWith("s")) {
            // Handle seconds format (e.g., "45s", "30s", etc.)
            const seconds = parseInt(start_time.slice(0, -1), 10);
            time_desc = `Final ${seconds} Seconds`;
        } else if (1 < start_time && start_time < 12) {
            time_desc = `Final ${start_time} Minutes`;
        } else if (start_time < 1) {
            // For other fractional values (shouldn't be used now that we're using string format)
            const seconds = Math.round(start_time * 60);
            time_desc = `Final ${seconds} Seconds`;
        } else {
            // Handle unexpected start_time values
            time_desc = `${start_time} Minutes`;
        }

        const or_more = cumulate ? " Or More" : "";

        // game_filters already initialized above
        fit_min_win_game_count =
            fit_min_win_game_count !== null ? fit_min_win_game_count : 3;

        let title;

        if (down_mode === "at") {
            title = `Points Down${or_more} At Start of ${time_desc}`;
            max_point_margin = max_point_margin === null ? -1 : max_point_margin;
            fit_max_points = fit_max_points === null ? -1 : fit_max_points;
        } else {
            title = `Max Points Down${or_more} During ${time_desc}`;
            max_point_margin = max_point_margin === null ? "auto" : max_point_margin;
            // Match Python behavior EXACTLY: set fit_max_points to "10%" if it's null OR undefined
            if (fit_max_points === null || fit_max_points === undefined) {
                fit_max_points = "10%";
            }
        }

        if (calculate_occurrences) {
            max_point_margin = 1;
        }

        // Prepare data for combinations of year groups and filters
        const points_down_lines = [];

        const number_of_year_groups = year_groups.length;
        const number_of_game_filters = game_filters.length;
        const game_years_strings = [];
        const game_filter_strings = [];

        // Create a reference to store the first games object for later use in title
        let firstGamesRef = null;

        // Create combinations of year groups and filters
        for (const yearGroup of year_groups) {
            const start_year = yearGroup.minYear;
            const stop_year = yearGroup.maxYear;

            for (
                let game_filter_index = 0;
                game_filter_index < game_filters.length;
                game_filter_index++
            ) {
                const game_filter = game_filters[game_filter_index];

                // Determine season type based on year group settings
                let season_type = "all";
                if (yearGroup.regularSeason && !yearGroup.playoffs) {
                    season_type = "Regular Season";
                } else if (!yearGroup.regularSeason && yearGroup.playoffs) {
                    season_type = "Playoffs";
                }

                // Create games collection
                const games = new Games(start_year, stop_year, season_type);
                games.initialize(seasonData);

                // Store reference to first games object
                if (firstGamesRef === null) {
                    firstGamesRef = games;
                }

                // Determine legend text
                let legend = "";
                if (number_of_year_groups > 1 || number_of_game_filters < 2) {
                    legend = games.get_years_string();
                }

                if (game_filter_index === 0) {
                    game_years_strings.push(games.get_years_string());
                }

                if (game_filter) {
                    game_filter_strings.push(game_filter.get_filter_string());
                }

                if (number_of_game_filters > 1) {
                    if (legend) {
                        legend = `${legend} | `;
                    }
                    legend = `${legend}${
                        game_filter ? game_filter.get_filter_string() : "All Games"
                    }`;
                }

                // Create the points down line
                const points_down_line = new PointsDownLine(
                    games,
                    game_filter,
                    start_time,
                    down_mode,
                    legend,
                    cumulate,
                    min_point_margin,
                    max_point_margin,
                    fit_min_win_game_count,
                    fit_max_points,
                    calculate_occurrences
                );

                points_down_lines.push(points_down_line);
            }
        }

        // Update title based on filter/year combinations
        if (number_of_year_groups === 1 && number_of_game_filters > 1) {
            // Use the stored reference to the first games object
            if (firstGamesRef) {
                title = `${title} | ${firstGamesRef.get_years_string()}`;
            }
        } else if (number_of_game_filters === 1 && game_filters[0] !== null) {
            title = `${title} | ${game_filters[0].get_filter_string()}`;
        }

        if (calculate_occurrences) {
            title = `Occurrences of ${title}`;
        }

        // Find bound for x-axis
        let bound_x = Infinity;
        for (const line of points_down_lines) {
            if (line.max_point_margin !== null && line.max_point_margin !== undefined) {
                bound_x = Math.min(bound_x, line.max_point_margin);
            }
        }

        // Generate y-ticks
        const [min_x, max_x, y_tick_values, y_tick_labels] =
            get_points_down_normally_spaced_y_ticks(points_down_lines, bound_x);

        // Set sigma values for all lines
        for (const points_down_line of points_down_lines) {
            const min_y = y_tick_values[0];
            const max_y = y_tick_values[y_tick_values.length - 1];
            points_down_line.set_sigma_final(min_y, max_y);
        }

        // Create x/y labels
        const x_label = "Point Margin";
        const y_label = calculate_occurrences ? "Occurence %" : "Win %";

        // Create final plot
        const final_plot = new FinalPlot(
            "point_margin_v_win_percent",
            title,
            x_label,
            y_label,
            y_tick_values.map((p) => Num.PPF(p)),
            y_tick_labels,
            min_x,
            max_x,
            points_down_lines,
            use_normal_labels,
            cumulate,
            calculate_occurrences
        );

        return final_plot.to_json();
    }

    /**
     * Generate plots and JSON data showing win probability versus time for NBA games
     *
     * @param {Array} year_groups - List of year group objects with start/end years
     * @param {number} start_time - Starting minute of analysis
     * @param {Array} percents - List of percentages to track (e.g., ["20%", "10%", "5%", "1%"])
     * @param {Array|GameFilter|null} game_filters - Filters to apply to games
     * @param {boolean} plot_2x_guide - Whether to plot 2√t guide line
     * @param {boolean} plot_4x_guide - Whether to plot 4√t guide line
     * @param {boolean} plot_6x_guide - Whether to plot 6√t guide line
     * @param {boolean} plot_2x_bad_guide - Whether to plot 2t guide line
     * @param {boolean} plot_3x_bad_guide - Whether to plot 3t guide line
     * @param {boolean} plot_calculated_guides - Whether to calculate and plot custom guide lines
     * @param {Object} seasonData - Loaded season data
     * @returns {Object} Chart data JSON object
     */
    function plot_percent_versus_time(
        year_groups,
        start_time,
        percents,
        game_filters = null,
        plot_2x_guide = false,
        plot_4x_guide = false,
        plot_6x_guide = false,
        plot_2x_bad_guide = false,
        plot_3x_bad_guide = false,
        plot_calculated_guides = false,
        seasonData = {}
    ) {
        // Ensure game_filters is properly initialized
        // If game_filters is null, undefined, or empty array, create a list with a single null element
        if (
            game_filters === null ||
            game_filters === undefined ||
            (Array.isArray(game_filters) && game_filters.length === 0)
        ) {
            game_filters = [null];
        } else if (!Array.isArray(game_filters)) {
            game_filters = [game_filters];
        }

        // Setup time range exactly as in Python
        const times = [];
        for (let t = start_time; t >= 1; t--) {
            times.push(t);
        }

        let min_point_margin = Infinity;
        let max_point_margin = -Infinity;

        const percent_lines = [];
        const game_years_strings = [];
        const game_filter_strings = [];

        const number_of_year_groups = year_groups.length;
        const number_of_game_filters = game_filters.length;

        // Generate the data for each year group and filter
        const all_percent_data = [];

        for (const yearGroup of year_groups) {
            const start_year = yearGroup.minYear;
            const stop_year = yearGroup.maxYear;

            for (
                let game_filter_index = 0;
                game_filter_index < game_filters.length;
                game_filter_index++
            ) {
                const game_filter = game_filters[game_filter_index];

                // Determine season type based on year group settings
                let season_type = "all";
                if (yearGroup.regularSeason && !yearGroup.playoffs) {
                    season_type = "Regular Season";
                } else if (!yearGroup.regularSeason && yearGroup.playoffs) {
                    season_type = "Playoffs";
                }

                // Create games collection
                const games = new Games(start_year, stop_year, season_type);
                games.initialize(seasonData);

                if (game_filter_index === 0) {
                    game_years_strings.push(games.get_years_string());
                }

                if (game_filter) {
                    game_filter_strings.push(game_filter.get_filter_string());
                }

                // Get points data for each time point
                const percent_data = {};
                for (const current_time of times) {
                    const points_down_line = new PointsDownLine(
                        games,
                        game_filter,
                        current_time,
                        "at", // Use 'at' mode for time points
                        null, // no legend needed
                        false, // cumulate
                        null, // min_point_margin
                        -1, // max_point_margin
                        null, // fit_min_win_game_count
                        -1 // fit_max_points
                    );

                    const game_count = points_down_line.number_of_games;

                    for (const percent of percents) {
                        if (!percent_data[percent]) {
                            percent_data[percent] = [];
                        }

                        let point_margin;
                        if (percent === "Record") {
                            point_margin = points_down_line.margin_at_record();
                        } else {
                            // Handle percentage strings with trailing %
                            const percentValue = percent.endsWith("%")
                                ? parseFloat(percent.slice(0, -1))
                                : parseFloat(percent);

                            point_margin =
                                points_down_line.margin_at_percent(percentValue);
                        }

                        percent_data[percent].push(point_margin);
                        min_point_margin = Math.min(min_point_margin, point_margin[0]);
                        max_point_margin = Math.max(max_point_margin, point_margin[0]);
                    }
                }

                all_percent_data.push({
                    games: games,
                    game_count: games.length,
                    game_filter: game_filter,
                    percent_data: percent_data,
                });
            }
        }

        // Create percent lines for each percent
        const percent_strings = Object.keys(all_percent_data[0].percent_data);

        for (const percent_string of percent_strings) {
            for (const {
                games,
                game_count,
                game_filter,
                percent_data,
            } of all_percent_data) {
                const percent_value = percent_data[percent_string];

                // Create legend
                let legend = `${percent_string}`;

                if (number_of_year_groups > 1) {
                    legend = `${legend} | ${games.get_years_string()} (${game_count} Games)`;
                }

                if (number_of_game_filters > 1) {
                    legend = `${legend} | ${
                        game_filter ? game_filter.get_filter_string() : "All Games"
                    }`;
                }

                percent_lines.push(
                    new PercentLine(games, legend, times, percent_value)
                );
            }
        }

        // Add guide lines if requested
        if (plot_calculated_guides) {
            for (const percent_line of Array.from(percent_lines)) {
                const legend = percent_line.legend;
                const x = percent_line.x_values.slice(-12).map((p) => Math.pow(p, 0.5));
                const y = percent_line.line_data.slice(-12).map((p) => p[0]);

                const result = Num.least_squares(x, y, true); // slope only
                const amount = result.m;

                percent_lines.push(
                    new PercentLine(
                        null,
                        `${legend}: ${-amount.toFixed(2)}√t`,
                        times,
                        times.map((x) => amount * Math.pow(x, 0.5))
                    )
                );
            }
        }

        // Add standard guide lines
        if (plot_2x_guide) {
            percent_lines.push(
                new PercentLine(
                    null,
                    "2√t",
                    times,
                    times.map((x) => -2 * Math.pow(x, 0.5))
                )
            );
        }

        if (plot_4x_guide) {
            percent_lines.push(
                new PercentLine(
                    null,
                    "4√t",
                    times,
                    times.map((x) => -4 * Math.pow(x, 0.5))
                )
            );
        }

        if (plot_6x_guide) {
            percent_lines.push(
                new PercentLine(
                    null,
                    "6√t",
                    times,
                    times.map((x) => -6 * Math.pow(x, 0.5))
                )
            );
        }

        if (plot_2x_bad_guide) {
            percent_lines.push(
                new PercentLine(
                    null,
                    "2t",
                    times,
                    times.map((x) => -2 * x)
                )
            );
        }

        if (plot_3x_bad_guide) {
            percent_lines.push(
                new PercentLine(
                    null,
                    "3t",
                    times,
                    times.map((x) => -3 * x)
                )
            );
        }

        // Create title
        let title = "% Chance of Coming Back Deficit Versus Time";

        if (number_of_year_groups === 1) {
            const firstData = all_percent_data[0];
            title = `${title} | ${firstData.games.get_years_string()} (${
                firstData.game_count
            } Games)`;
        }

        if (number_of_game_filters === 1 && game_filters[0] !== null) {
            title = `${title} | ${game_filters[0].get_filter_string()}`;
        }

        // Calculate y_ticks for the plot
        const x_label = "Minutes Remaining";
        const y_label = "Points Down";
        const y_min = Math.floor(min_point_margin) - 1;
        const y_max = Math.ceil(max_point_margin) + 2;
        const y_ticks = [];
        for (let i = y_min; i <= y_max; i += 2) {
            y_ticks.push(i);
        }

        // Create final plot
        const final_plot = new FinalPlot(
            "time_v_point_margin",
            title,
            x_label,
            y_label,
            y_ticks,
            y_ticks,
            Math.min(...times),
            Math.max(...times),
            percent_lines
        );

        return final_plot.to_json();
    }

    /**
     * Create y-tick spacing for points down charts
     * @param {Array} plot_lines - Array of plot lines
     * @param {number} bound_x - Upper bound for x values
     * @returns {Array} [min_x, max_x, y_tick_values, y_tick_labels]
     */
    function get_points_down_normally_spaced_y_ticks(plot_lines, bound_x = Infinity) {
        let min_y = Infinity;
        let next_min_y = Infinity;
        let max_y = -Infinity;
        let next_max_y = -Infinity;
        let min_x = Infinity;
        let max_x = -Infinity;

        for (const plot_line of plot_lines) {
            const x = plot_line.point_margins;
            const y = plot_line.percents;

            min_x = Math.min(min_x, Math.min(...x));
            max_x = Math.max(max_x, Math.min(Math.max(...x), bound_x));
            min_y = Math.min(min_y, Math.min(...y));
            max_y = Math.max(max_y, Math.max(...y));

            // Find next min/max y that is not at the extremes
            const filtered_min = Math.min(
                ...y.filter((p) => p > 1e-9).map((p) => p || Infinity)
            );
            next_min_y = Math.min(next_min_y, filtered_min);

            const filtered_max = Math.max(
                ...y.filter((p) => p < 1.0 - 1e-9).map((p) => p || -Infinity)
            );
            next_max_y = Math.max(next_max_y, filtered_max);

            // Include regression fit values
            if (plot_line.m !== null) {
                const y_fit = x.map((x_val) => plot_line.m * x_val + plot_line.b);
                const y_fit_min = Math.min(...y_fit);
                const y_fit_max = Math.max(...y_fit);

                min_y = Math.min(min_y, Num.CDF(y_fit_min));
                max_y = Math.max(max_y, Num.CDF(y_fit_max));
                next_min_y = Math.min(next_min_y, Num.CDF(y_fit_min));
                next_max_y = Math.max(next_max_y, Num.CDF(y_fit_max));
            }
        }

        // Define standard y-tick positions and labels
        const y_ticks = {
            0.00001: "1/100000",
            0.0001: "1/10000",
            0.001: "1/1000",
            0.002: "1/500",
            0.005: "1/200",
            0.01: "1%",
            0.025: "2.5%",
            0.05: "5%",
            0.1: "10%",
            0.2: "20%",
            0.3: "30%",
            0.4: "40%",
            0.5: "50%",
            0.6: "60%",
            0.7: "70%",
            0.8: "80%",
            0.9: "90%",
            0.95: "95%",
            0.975: "97.5%",
            0.99: "99.0%",
            0.995: "99.5%",
            0.998: "99.8%",
            0.999: "99.9%",
            0.9999: "99.99%",
            0.99999: "99.999%",
            0.999999: "99.9999%",
            0.9999999: "99.99999%",
        };

        // Get array of tick keys
        const y_tick_keys = Object.keys(y_ticks).map(Number);

        // Filter to ticks within the range
        const y_tick_indices = [];
        for (let i = 0; i < y_tick_keys.length; i++) {
            if (next_min_y <= y_tick_keys[i] && y_tick_keys[i] <= next_max_y) {
                y_tick_indices.push(i);
            }
        }

        // Get min/max indices with padding
        const y_min_index = Math.max(0, y_tick_indices[0] - 1);
        const y_max_index = Math.min(
            y_tick_keys.length - 1,
            y_tick_indices[y_tick_indices.length - 1] + 1
        );

        // Extract final tick values and labels
        const y_tick_values = y_tick_keys.slice(y_min_index, y_max_index + 1);
        const y_tick_labels = y_tick_values.map((key) => y_ticks[key]);

        // Special handling for extremes
        if (min_y < next_min_y) {
            y_tick_labels[0] = "Never";
        }
        if (max_y > next_max_y) {
            y_tick_labels[y_tick_labels.length - 1] = "100%";
        }

        return [min_x, max_x, y_tick_values, y_tick_labels];
    }

    // Return public API
    return {
        GameFilter,
        plot_biggest_deficit,
        plot_percent_versus_time,
        get_points_down_normally_spaced_y_ticks,
    };
})();

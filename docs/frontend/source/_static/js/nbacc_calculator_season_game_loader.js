/**
 * nbacc_calculator_season_game_loader.js
 *
 * This module handles loading and processing NBA game data from JSON files.
 * It provides classes for representing seasons, games, and game collections,
 * along with utility functions for filtering and analyzing game data.
 */

const nbacc_calculator_season_game_loader = (() => {
    // Global variable for base path to JSON files
    // Use the same path resolution approach as chart loader
    let json_base_path = `${nbacc_utils.staticDir}/json/seasons`; // Use staticDir from utils

    class Season {
        static _seasons = {}; // Class-level cache of loaded seasons
        static _loadingPromises = {}; // Track ongoing load operations

        /**
         * Get a Season instance for the specified year
         * This static method ensures we only create one instance per year
         * and handles loading the data if needed
         */
        static get_season(year) {
            if (!(year in this._seasons)) {
                this._seasons[year] = new Season(year);
            }
            return this._seasons[year];
        }

        /**
         * Load season data for a specific year
         * @param {number} year - The year to load
         * @returns {Promise<Season>} - A promise that resolves to the loaded Season
         */
        static async load_season(year) {
            const season = this.get_season(year);
            await season.load();
            return season;
        }

        constructor(year) {
            this.year = year;

            // Get the full URL to the season JSON file
            // Use the same approach as chart loader with protocol and host
            const rootUrl = window.location.protocol + "//" + window.location.host;
            this.filename = `${rootUrl}${json_base_path}/nba_season_${year}.json.gz`;
            //console.log(`Season ${year} file path: ${this.filename}`);

            this._games = null;
            this._loaded = false;
            this._loadPromise = null;
        }

        /**
         * Load the season data if not already loaded
         * @returns {Promise<void>} - A promise that resolves when loading is complete
         */
        async load() {
            // If already loaded, return immediately
            if (this._loaded) {
                return;
            }

            // If a load is already in progress, return that promise
            if (this._loadPromise) {
                return this._loadPromise;
            }

            // Start a new load operation
            this._loadPromise = this._loadData();

            try {
                await this._loadPromise;
                this._loaded = true;
            } catch (error) {
                // Clear the promise on error so future attempts can retry
                this._loadPromise = null;
                throw error;
            }
        }

        /**
         * Internal method to handle the actual data loading
         * @private
         */
        async _loadData() {
            try {
                //''console.log''(`Fetching season data from: ${this.filename}`);
                const response = await fetch(this.filename);

                if (!response.ok) {
                    throw new Error(
                        `Failed to load season data: ${response.status} ${response.statusText}`
                    );
                }

                // Check if we have gzipped JSON (based on filename)
                if (this.filename.endsWith('.gz')) {
                    // Use the readGzJson utility function for gzipped data
                    this.data = await nbacc_utils.readGzJson(response);
                } else {
                    // Regular JSON
                    this.data = await response.json();
                }

                // Debug the loaded JSON data structure
                // console.log(`Season ${this.year} data structure:`, {
                //     hasGames: Boolean(this.data.games),
                //     gameCount: this.data.games ? Object.keys(this.data.games).length : 0,
                //     hasTeamStats: Boolean(this.data.team_stats),
                //     sample: this.data.games ? Object.keys(this.data.games).slice(0, 3) : []
                // });

                // Extract season metadata
                this.season_year = this.data.season_year;
                this.team_count = this.data.team_count;
                this.teams = this.data.teams;
                this.team_stats = this.data.team_stats;

                // Initialize games here to ensure they're loaded
                this._games = {};
                if (this.data.games) {
                    for (const [game_id, game_data] of Object.entries(
                        this.data.games
                    )) {
                        this._games[game_id] = new Game(game_data, game_id, this);
                    }
                }

                // console.log(
                //     `Successfully loaded season data for ${this.year} with ${
                //         Object.keys(this._games).length
                //     } games`
                // );
            } catch (error) {
                console.error(`Error loading season ${this.year}:`, error);
                throw new Error(
                    `Failed to load data for season ${this.year}: ${error.message}`
                );
            }
        }

        get games() {
            // Games should already be loaded in _loadData, but add a safety check
            if (this._games === null) {
                this._games = {};
                if (this.data && this.data.games) {
                    for (const [game_id, game_data] of Object.entries(
                        this.data.games
                    )) {
                        this._games[game_id] = new Game(game_data, game_id, this);
                    }
                }
            }
            return this._games;
        }
    }

    class Games {
        constructor(start_year, stop_year, season_type = "all") {
            this.games = {};
            this.start_year = start_year;
            this.stop_year = stop_year;
            this.season_type = season_type;
        }

        /**
         * Initialize Games with pre-loaded season data
         * @param {Object} seasonData - Object containing loaded Season instances
         * @returns {Games} - This instance for chaining
         */
        initialize(seasonData) {
            this.games = {};

            // Load all games from the date range using provided seasonData
            for (let year = this.start_year; year <= this.stop_year; year++) {
                if (!seasonData[year]) {
                    console.warn(
                        `Season data for ${year} not found in provided seasonData`
                    );
                    continue;
                }

                const season = seasonData[year];

                // Verify season is loaded
                if (!season._loaded) {
                    console.warn(`Season ${year} exists but isn't fully loaded`);
                    continue;
                }

                for (const [game_id, game] of Object.entries(season.games)) {
                    if (
                        this.season_type !== "all" &&
                        game.season_type !== this.season_type
                    ) {
                        continue;
                    }
                    this.games[game_id] = game;
                }
            }

            // console.log(
            //     `Initialized Games collection with ${
            //         Object.keys(this.games).length
            //     } games`
            // );
            return this;
        }

        getItem(game_id) {
            return this.games[game_id];
        }

        get length() {
            return Object.keys(this.games).length;
        }

        [Symbol.iterator]() {
            return Object.values(this.games)[Symbol.iterator]();
        }

        keys() {
            return Object.keys(this.games);
        }

        get_years_string() {
            function short(year) {
                return String(year).slice(-2);
            }

            let season_type_str;
            if (this.season_type !== "all") {
                season_type_str = ` ${this.season_type}`;
            } else {
                season_type_str = "";
            }

            if (this.start_year === this.stop_year) {
                return `${this.start_year}-${short(
                    this.start_year + 1
                )}${season_type_str}`;
            } else {
                return `${this.start_year}-${short(this.start_year + 1)} to ${
                    this.stop_year
                }-${short(this.stop_year + 1)}${season_type_str}`;
            }
        }
    }

    class Game {
        static index = 0; // Class variable to track game index

        constructor(game_data, game_id, season) {
            this.index = Game.index;
            Game.index += 1;

            // Debug game creation
            if (!game_data) {
                console.error(`Error creating game ${game_id}: No game data provided`);
                return;
            }

            // Store the game ID and reference to season
            this.game_id = game_id;
            this.season = season;

            // Copy basic properties
            this.game_date = game_data.game_date;
            this.season_type = game_data.season_type;
            this.season_year = game_data.season_year;
            this.home_team_abbr = game_data.home_team_abbr;
            this.away_team_abbr = game_data.away_team_abbr;
            this.score = game_data.score;

            // Parse final score
            const [away_score, home_score] = this.score
                .split(" - ")
                .map((x) => parseInt(x));
            this.final_away_points = away_score;
            this.final_home_points = home_score;

            // Calculate point differential
            this.score_diff = this.final_home_points - this.final_away_points;

            // Determine win/loss
            if (this.score_diff > 0) {
                this.wl_home = "W";
                this.wl_away = "L";
            } else if (this.score_diff < 0) {
                this.wl_home = "L";
                this.wl_away = "W";
            } else {
                throw new Error("NBA games can't end in a tie");
            }

            // Create score stats by minute
            this.score_stats_by_minute = new ScoreStatsByMinute(
                this,
                game_data.point_margins
            );

            // Set team stats
            this.home_team_win_pct = season.team_stats[this.home_team_abbr].win_pct;
            this.away_team_win_pct = season.team_stats[this.away_team_abbr].win_pct;
            this.home_team_rank = season.team_stats[this.home_team_abbr].rank;
            this.away_team_rank = season.team_stats[this.away_team_abbr].rank;
        }

        get_game_summary_json_string() {
            // Format rank as ordinal
            function ordinal(n) {
                if (10 <= n % 100 && n % 100 <= 20) {
                    return `${n}th`;
                } else {
                    const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
                    return `${n}${suffix}`;
                }
            }

            // Get team ranks from season data
            const home_rank = this.home_team_rank;
            const away_rank = this.away_team_rank;

            // Format the ranks as ordinals
            const home_rank_str = home_rank > 0 ? ordinal(home_rank) : "N/A";
            const away_rank_str = away_rank > 0 ? ordinal(away_rank) : "N/A";

            // Return the formatted string without W/L indicators
            return `${
                this.away_team_abbr
            }(${away_rank_str}/${this.away_team_win_pct.toFixed(3)}) @ ${
                this.home_team_abbr
            }(${home_rank_str}/${this.home_team_win_pct.toFixed(3)}): ${
                this.final_away_points
            }-${this.final_home_points}`;
        }
    }

    class ScoreStatsByMinute {
        constructor(game, point_margins_data) {
            // Extract point margins from the JSON data
            this.point_margins = point_margins_data.margins;
            this.min_point_margins = point_margins_data.min_margins;
            this.max_point_margins = point_margins_data.max_margins;

            // Calculate home scores (if needed)
            this.home_scores = [];
        }
    }

    /**
     * Parse season type string from a label
     * @param {string} label - Season label (e.g., "2010-11", "R2010-11", "P2010-11")
     * @returns {string} Season type ("Regular Season", "Playoffs", or "all")
     */
    function parseSeasonType(label) {
        if (label.startsWith("R")) {
            return "Regular Season";
        } else if (label.startsWith("P")) {
            return "Playoffs";
        } else {
            return "all";
        }
    }

    // Return public API
    return {
        Season,
        Games,
        Game,
        ScoreStatsByMinute,
        parseSeasonType,
    };
})();

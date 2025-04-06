/**
 * nbacc_calculator_season_game_loader.js
 *
 * This module handles loading and processing NBA game data from JSON files.
 * It provides classes for representing seasons, games, and game collections,
 * along with utility functions for filtering and analyzing game data.
 * 
 * The module defines granular time intervals for game analysis, supporting
 * minute-by-minute analysis as well as sub-minute intervals (down to 5-second
 * increments) in the final minute of the game.
 */

const nbacc_calculator_season_game_loader = (() => {
    // Global variable for base path to JSON files
    // Use the same path resolution approach as chart loader
    let json_base_path = `${nbacc_utils.staticDir}/json/seasons`; // Use staticDir from utils

    // Defines time intervals for analysis, from start of game (48 minutes)
    // to end of game (0), with sub-minute intervals in the final minute
    const GAME_MINUTES = [
        48,  // Game start
        36,  // Start of 2nd half (3rd quarter)
        24,  // Halftime
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
        13,  // 3rd quarter and early 4th
        12,  // Start of 4th quarter
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
        1,  // Final minute (60 seconds)
        "45s",  // 45 seconds remaining
        "30s",  // 30 seconds remaining
        "15s",  // 15 seconds remaining
        "10s",  // 10 seconds remaining
        "5s",  // 5 seconds remaining
        0,  // Game end (buzzer)
    ];

    // Mapping from time point to array index for efficient lookup
    const TIME_TO_INDEX_MAP = {};
    GAME_MINUTES.forEach((key, index) => {
        TIME_TO_INDEX_MAP[key] = index;
    });

    class Season {
        static _seasons = {}; // Class-level cache of loaded seasons
        static _loadingPromises = {}; // Track ongoing load operations
        static _localStorage_prefix = 'nbacc_season_';

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

        /**
         * Get storage key for the season
         * @param {number} year - The year to get the key for
         * @returns {string} - The localStorage key for the season
         */
        static getStorageKey(year) {
            return `${this._localStorage_prefix}${year}`;
        }

        /**
         * Check if a season is cached in localStorage
         * @param {number} year - The year to check
         * @returns {boolean} - True if the season is cached
         */
        static isSeasonCached(year) {
            try {
                return localStorage.getItem(this.getStorageKey(year)) !== null;
            } catch (e) {
                return false;
            }
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
         * Uses localStorage cache if available, otherwise fetches from network
         * @private
         */
        async _loadData() {
            const storageKey = Season.getStorageKey(this.year);
            
            try {
                // Try to load from localStorage first using utility function
                let seasonData = null;
                if (nbacc_utils.__USE_LOCAL_STORAGE_CACHE__) {
                    seasonData = nbacc_utils.getLocalStorageWithTimestamp(storageKey);
                }

                // If we have valid cached data, use it
                if (seasonData) {
                    this.data = seasonData;
                } else {
                    // Fetch from network
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

                    // Cache the data in localStorage using utility function
                    if (nbacc_utils.__USE_LOCAL_STORAGE_CACHE__) {
                        nbacc_utils.setLocalStorageWithTimestamp(storageKey, this.data);
                    }
                }

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
            } catch (error) {
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
                    // This console logging is no longer needed because features are working fine
                    // console.warn(
                    //     `Season data for ${year} not found in provided seasonData`
                    // );
                    continue;
                }

                const season = seasonData[year];

                // Verify season is loaded
                if (!season._loaded) {
                    // This console logging is no longer needed because features are working fine
                    // console.warn(`Season ${year} exists but isn't fully loaded`);
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
                // This console logging is no longer needed because features are working fine
                // console.error(`Error creating game ${game_id}: No game data provided`);
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

            // Process and store point margins at each time point
            // This creates a dictionary mapping time points (from GAME_MINUTES) to point margin data
            this.point_margin_map = get_point_margin_map_from_json(
                game_data.point_margins
            );

            // Create score stats by minute for backwards compatibility
            this.score_stats_by_minute = new ScoreStatsByMinute(
                this,
                this.point_margin_map
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
        constructor(game, point_margin_map) {
            // Creates backwards-compatible point margins arrays from the point_margin_map
            this.point_margins = [];
            this.min_point_margins = [];
            this.max_point_margins = [];

            // Fill arrays from the point_margin_map
            GAME_MINUTES.forEach((time_point, index) => {
                if (point_margin_map[time_point]) {
                    const data = point_margin_map[time_point];
                    this.point_margins[index] = data.point_margin;
                    this.min_point_margins[index] = data.min_point_margin;
                    this.max_point_margins[index] = data.max_point_margin;
                }
            });

            // Calculate home scores (if needed)
            this.home_scores = [];
        }
    }

    /**
     * Process point margins from JSON data into a structured map.
     *
     * Converts the compact string representation of point margins from the JSON data
     * into a structured dictionary mapping time points to point margin data.
     *
     * The input format is a list of strings with format "index=value" or
     * "index=point_margin,min_point_margin,max_point_margin" where:
     * - index corresponds to positions in the GAME_MINUTES array
     * - point_margin is the current point margin at that time
     * - min/max_point_margin track the extremes reached during intervals
     *
     * @param {Array} point_margins_data - List of strings containing point margin data in compressed format
     * @returns {Object} A dictionary mapping time points (from GAME_MINUTES) to point margin data dictionaries
     */
    function get_point_margin_map_from_json(point_margins_data) {
        // Extract point margins from the JSON data
        const raw_point_margin_map = {};
        
        for (const point_margin of point_margins_data) {
            const [index_str, points_string] = point_margin.split("=", 2);
            const index = parseInt(index_str);
            
            let point_margin_val, min_point_margin, max_point_margin;
            
            if (points_string.includes(",")) {
                [point_margin_val, min_point_margin, max_point_margin] = points_string
                    .split(",")
                    .map(x => parseInt(x));
            } else {
                point_margin_val = min_point_margin = max_point_margin = parseInt(points_string);
            }
            
            raw_point_margin_map[index] = {
                point_margin: point_margin_val,
                min_point_margin: min_point_margin,
                max_point_margin: max_point_margin
            };
        }

        // Create a complete mapping for all time points in GAME_MINUTES
        const point_margin_map = {};
        let last_point_margin = null;
        
        for (let index = 0; index < GAME_MINUTES.length; index++) {
            const key = GAME_MINUTES[index];
            let point_margin_data;
            
            if (index in raw_point_margin_map) {
                point_margin_data = raw_point_margin_map[index];
            } else {
                // If data is missing for this time point, use the last known point margin
                if (last_point_margin === null) {
                    throw new Error("Missing point margin data at beginning of game");
                }
                point_margin_data = {
                    point_margin: last_point_margin,
                    min_point_margin: last_point_margin,
                    max_point_margin: last_point_margin
                };
            }
            
            point_margin_map[key] = point_margin_data;
            last_point_margin = point_margin_data.point_margin;
        }
        
        return point_margin_map;
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
        GAME_MINUTES,
        TIME_TO_INDEX_MAP,
        Season,
        Games,
        Game,
        ScoreStatsByMinute,
        get_point_margin_map_from_json,
        parseSeasonType,
    };
})();

/**
 * Core functionality for NBA Charts Calculator
 * Responsible for data processing and calculations
 */

const nbacc_calculator_core = (() => {
    // Class to replace Python's Num class
    class Num {
        constructor() {
            // Constants
            this.SQRT_2PI = Math.sqrt(2 * Math.PI);
        }

        // JavaScript equivalent of scipy.stats.norm.cdf
        normalCDF(x, mu = 0, sigma = 1) {
            return 0.5 * (1 + math.erf((x - mu) / (sigma * Math.sqrt(2))));
        }

        // JavaScript equivalent of scipy.stats.norm.ppf
        normalPPF(p, mu = 0, sigma = 1) {
            if (p <= 0) return -Infinity;
            if (p >= 1) return Infinity;
            
            // Approximation using Beasley-Springer-Moro algorithm
            const a = [
                2.50662823884, -18.61500062529, 41.39119773534,
                -25.44106049637
            ];
            const b = [
                -8.47351093090, 23.08336743743, -21.06224101826,
                3.13082909833
            ];
            const c = [
                0.3374754822726147, 0.9761690190917186,
                0.1607979714918209, 0.0276438810333863,
                0.0038405729373609, 0.0003951896511919,
                0.0000321767881768, 0.0000002888167364,
                0.0000003960315187
            ];
            
            let y, r;
            
            if (p < 0.02425 || p > 0.97575) {
                // Tail regions
                if (p < 0.5) {
                    // Left tail
                    y = Math.sqrt(-2 * Math.log(p));
                } else {
                    // Right tail
                    y = Math.sqrt(-2 * Math.log(1 - p));
                }
                
                r = ((((c[8] * y + c[7]) * y + c[6]) * y + c[5]) * y + c[4]) * y + c[3];
                r = ((((r * y + c[2]) * y + c[1]) * y + c[0]) * y);
                
                if (p < 0.5) {
                    return mu - sigma * (y + r);
                } else {
                    return mu + sigma * (y + r);
                }
            } else {
                // Central region
                y = p - 0.5;
                r = y * y;
                r = y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]);
                r = r / (((b[3] * r + b[2]) * r + b[1]) * r + b[0] + 1);
                return mu + sigma * r;
            }
        }

        // JavaScript equivalent of np.polyfit and np.poly1d combined
        linearRegression(x, y) {
            const n = x.length;
            let sumX = 0;
            let sumY = 0;
            let sumXY = 0;
            let sumXX = 0;

            for (let i = 0; i < n; i++) {
                sumX += x[i];
                sumY += y[i];
                sumXY += x[i] * y[i];
                sumXX += x[i] * x[i];
            }

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            return {
                slope: slope,
                intercept: intercept,
                // Return a function that can be used like the np.poly1d result
                predict: (x_val) => slope * x_val + intercept
            };
        }

        // JavaScript equivalent of scipy.optimize.minimize with 'BFGS' method
        // A simplified version for our specific use case
        minimize(func, x0, options = {}) {
            const maxiter = options.maxiter || 100;
            const tol = options.tol || 1e-6;
            
            let x = x0;
            let f = func(x);
            let gradApprox = 0.0001;
            
            for (let iter = 0; iter < maxiter; iter++) {
                // Approximate gradient
                const grad = (func(x + gradApprox) - f) / gradApprox;
                
                // Update x (simplified gradient descent)
                const step = 0.01 * grad;
                const newX = x - step;
                const newF = func(newX);
                
                if (Math.abs(newF - f) < tol) {
                    x = newX;
                    f = newF;
                    break;
                }
                
                x = newX;
                f = newF;
            }
            
            return {
                x: x,
                fun: f,
                success: true
            };
        }
    }

    // Game filter class (JavaScript equivalent of Python's GameFilter)
    class GameFilter {
        constructor(options = {}) {
            this.home_team = options.home_team || null;
            this.away_team = options.away_team || null;
            this.regular_season = options.regular_season === undefined ? true : options.regular_season;
            this.playoffs = options.playoffs === undefined ? false : options.playoffs;
            this.min_year = options.min_year || null;
            this.max_year = options.max_year || null;
            this.min_point_diff = options.min_point_diff || null;
            this.max_point_diff = options.max_point_diff || null;
            this.teams_in_top_n = options.teams_in_top_n || null;
            this.teams_in_bottom_n = options.teams_in_bottom_n || null;
            this.home_in_top_n = options.home_in_top_n || null;
            this.home_in_bottom_n = options.home_in_bottom_n || null;
            this.home_in_mid_n = options.home_in_mid_n || null;
            this.away_in_top_n = options.away_in_top_n || null;
            this.away_in_bottom_n = options.away_in_bottom_n || null;
            this.away_in_mid_n = options.away_in_mid_n || null;
            this.home_won = options.home_won === undefined ? null : options.home_won;
            this.team_location = options.team_location || null; // 'home', 'away', or null for either
        }

        matches(game, seasonData) {
            // If game is in playoffs but we only want regular season
            if (game.playoffs && !this.playoffs) return false;
            
            // If game is in regular season but we only want playoffs
            if (!game.playoffs && !this.regular_season) return false;
            
            // Check year range
            if (this.min_year !== null && game.year < this.min_year) return false;
            if (this.max_year !== null && game.year > this.max_year) return false;
            
            // Check teams
            if (this.home_team !== null && game.home_team !== this.home_team) return false;
            if (this.away_team !== null && game.away_team !== this.away_team) return false;
            
            // Check point difference at end of game
            const finalPointDiff = game.home_score - game.away_score;
            if (this.min_point_diff !== null && finalPointDiff < this.min_point_diff) return false;
            if (this.max_point_diff !== null && finalPointDiff > this.max_point_diff) return false;
            
            // Check if home team won
            if (this.home_won !== null) {
                const homeWon = finalPointDiff > 0;
                if (homeWon !== this.home_won) return false;
            }
            
            // Check team rankings (needs season data)
            if (seasonData && (this.teams_in_top_n !== null || this.teams_in_bottom_n !== null ||
                this.home_in_top_n !== null || this.home_in_bottom_n !== null || this.home_in_mid_n !== null ||
                this.away_in_top_n !== null || this.away_in_bottom_n !== null || this.away_in_mid_n !== null)) {
                
                const season = seasonData[game.year.toString()];
                if (!season) return false;
                
                // Get team rankings
                const homeRank = season.rankings[game.home_team] || 999;
                const awayRank = season.rankings[game.away_team] || 999;
                const totalTeams = Object.keys(season.rankings).length;
                
                // Check if both teams are in top N
                if (this.teams_in_top_n !== null) {
                    if (homeRank > this.teams_in_top_n || awayRank > this.teams_in_top_n) return false;
                }
                
                // Check if both teams are in bottom N
                if (this.teams_in_bottom_n !== null) {
                    const bottomThreshold = totalTeams - this.teams_in_bottom_n;
                    if (homeRank <= bottomThreshold || awayRank <= bottomThreshold) return false;
                }
                
                // Check if home team is in top N
                if (this.home_in_top_n !== null && homeRank > this.home_in_top_n) return false;
                
                // Check if home team is in middle N (ranks 11-20 typically)
                if (this.home_in_mid_n !== null) {
                    const topLimit = 10; // First 10 are top teams
                    const bottomLimit = totalTeams - 10; // Last 10 are bottom teams
                    if (homeRank <= topLimit || homeRank > bottomLimit) return false;
                }
                
                // Check if home team is in bottom N
                if (this.home_in_bottom_n !== null) {
                    const bottomThreshold = totalTeams - this.home_in_bottom_n;
                    if (homeRank <= bottomThreshold) return false;
                }
                
                // Check if away team is in top N
                if (this.away_in_top_n !== null && awayRank > this.away_in_top_n) return false;
                
                // Check if away team is in middle N (ranks 11-20 typically)
                if (this.away_in_mid_n !== null) {
                    const topLimit = 10; // First 10 are top teams
                    const bottomLimit = totalTeams - 10; // Last 10 are bottom teams
                    if (awayRank <= topLimit || awayRank > bottomLimit) return false;
                }
                
                // Check if away team is in bottom N
                if (this.away_in_bottom_n !== null) {
                    const bottomThreshold = totalTeams - this.away_in_bottom_n;
                    if (awayRank <= bottomThreshold) return false;
                }
            }
            
            return true;
        }

        getDescription() {
            const parts = [];
            
            if (this.home_team) parts.push(`Home: ${this.home_team}`);
            if (this.away_team) parts.push(`Away: ${this.away_team}`);
            
            if (this.regular_season && !this.playoffs) parts.push('Regular Season');
            else if (!this.regular_season && this.playoffs) parts.push('Playoffs');
            else if (this.regular_season && this.playoffs) parts.push('All Games');
            
            if (this.min_year !== null && this.max_year !== null) {
                if (this.min_year === this.max_year) {
                    parts.push(`Year: ${this.min_year}`);
                } else {
                    parts.push(`Years: ${this.min_year}-${this.max_year}`);
                }
            } else if (this.min_year !== null) {
                parts.push(`From: ${this.min_year}`);
            } else if (this.max_year !== null) {
                parts.push(`Until: ${this.max_year}`);
            }
            
            if (this.teams_in_top_n !== null) parts.push(`Both in Top ${this.teams_in_top_n}`);
            if (this.teams_in_bottom_n !== null) parts.push(`Both in Bottom ${this.teams_in_bottom_n}`);
            if (this.home_in_top_n !== null) parts.push(`Home in Top ${this.home_in_top_n}`);
            if (this.home_in_bottom_n !== null) parts.push(`Home in Bottom ${this.home_in_bottom_n}`);
            if (this.away_in_top_n !== null) parts.push(`Away in Top ${this.away_in_top_n}`);
            if (this.away_in_bottom_n !== null) parts.push(`Away in Bottom ${this.away_in_bottom_n}`);
            
            if (this.team_location === 'home') parts.push('Team At Home');
            if (this.team_location === 'away') parts.push('Team Away');
            
            if (this.home_won === true) parts.push('Home Won');
            if (this.home_won === false) parts.push('Away Won');
            
            if (parts.length === 0) return 'All Games';
            return parts.join(', ');
        }
    }

    // Main function to process game data and create chart data
    function processGameData(options) {
        const {
            plotType,
            yearGroups,
            seasonData,
            gameFilters,
            startTimeInSeconds = 2880, // 48 minutes = 2880 seconds default
            endTimeInSeconds = 0,     // 0 minutes default
            specificTimeInSeconds,    // For Points Down At Time
            pointMargin = 15          // Default point margin
        } = options;
        
        const num = new Num();
        const chartData = {
            plot_type: '',
            title: '',
            x_label: '',
            y_label: '',
            min_x: 0,
            max_x: 0,
            lines: []
        };
        
        // Determine plot type and set appropriate chart properties
        switch (plotType) {
            case 'Max Points Down Or More':
                chartData.plot_type = 'point_margin_v_win_percent';
                chartData.title = `Win % When Down ${pointMargin} Or More Points`;
                chartData.x_label = 'Point Margin';
                chartData.y_label = 'Win %';
                chartData.min_x = -36;
                chartData.max_x = -pointMargin;
                break;
                
            case 'Max Points Down':
                chartData.plot_type = 'point_margin_v_win_percent';
                chartData.title = `Win % When Max Down Is X Points`;
                chartData.x_label = 'Point Margin';
                chartData.y_label = 'Win %';
                chartData.min_x = -36;
                chartData.max_x = -1;
                break;
                
            case 'Points Down At Time':
                chartData.plot_type = 'point_margin_v_win_percent';
                chartData.title = `Win % When Down X Points with ${Math.floor(timeInSeconds / 60)}:${(timeInSeconds % 60).toString().padStart(2, '0')} Left`;
                chartData.x_label = 'Point Margin';
                chartData.y_label = 'Win %';
                chartData.min_x = -36;
                chartData.max_x = -1;
                break;
                
            case 'Percent Chance: Time Vs. Points Down':
                chartData.plot_type = 'time_v_point_margin';
                chartData.title = 'Win % By Score Differential And Time Remaining';
                chartData.x_label = 'Minutes Remaining';
                chartData.y_label = 'Point Margin';
                chartData.min_x = 0;
                chartData.max_x = 48;
                break;
                
            default:
                throw new Error(`Unknown plot type: ${plotType}`);
        }
        
        // Process each year group
        for (const yearGroup of yearGroups) {
            const {
                minYear,
                maxYear,
                regularSeason = true,
                playoffs = false,
                label = null
            } = yearGroup;
            
            // Fetch games data for this year range
            const gamesData = []; // This would be loaded from seasonData
            
            // TODO: Load actual game data from your season JSON files
            // We'll use a placeholder here for now
            
            // Create the line for this year group
            const line = {
                legend: label || `${minYear}-${maxYear}`,
                number_of_games: 0,
                x_values: [],
                y_values: []
            };
            
            // Process data based on plot type
            if (chartData.plot_type === 'point_margin_v_win_percent') {
                // TODO: Implement point margin vs win percent calculation
                // This is a placeholder
                line.m = 0.08;
                line.b = 0.35;
            } else {
                // TODO: Implement time vs point margin calculation
            }
            
            chartData.lines.push(line);
        }
        
        return chartData;
    }

    // Function to load season data
    async function loadSeasonData(minYear, maxYear) {
        const seasonData = {};
        const baseUrl = '/_static/json/seasons/';
        
        for (let year = minYear; year <= maxYear; year++) {
            try {
                const response = await fetch(`${baseUrl}nba_season_${year}.json`);
                if (response.ok) {
                    const data = await response.json();
                    seasonData[year] = data;
                }
            } catch (error) {
                console.error(`Failed to load season data for ${year}:`, error);
            }
        }
        
        return seasonData;
    }

    return {
        Num,
        GameFilter,
        processGameData,
        loadSeasonData
    };
})();

/**
 * NBA Charts Calculator UI
 * Handles the user interface for chart calculator
 */

const nbacc_calculator_ui = (() => {
    // State management
    let state = {
        plotType: 'Max Points Down Or More',
        yearGroups: [],
        gameFilters: [],
        startTimeInSeconds: 2880, // 48 minutes default
        endTimeInSeconds: 0,      // 0 minutes default
        specificTimeInSeconds: 720, // 12 minutes default (for Points Down At Time)
        pointMargin: 15           // Default point margin
    };
    
    // State to track if calculator lightbox is open
    let isCalculatorOpen = false;
    
    // Initialize UI components
    function initUI() {
        // Add keyboard listener for calculator toggle
        document.addEventListener('keydown', (e) => {
            // Only respond to 'c' key if calculator is not already open
            if (e.key === 'c' && !isCalculatorOpen) {
                showCalculatorUI();
            }
            
            // Handle Enter key when calculator is open
            if (e.key === 'Enter' && isCalculatorOpen) {
                const calculateBtn = document.getElementById('calculate-btn');
                if (calculateBtn) {
                    e.preventDefault(); // Prevent default form submission
                    calculateBtn.click();
                }
            }
        });
        
        // Initialize calculator container
        const calculatorDiv = document.getElementById('nbacc_calculator');
        if (calculatorDiv) {
            calculatorDiv.innerHTML = `
                <div class="nbacc-calculator-placeholder">
                    <p>Press 'c' to open Calculator</p>
                </div>
                <div id="nbacc_chart_container" class="chart-container" style="display: none;">
                    <canvas id="nbacc_calculator_chart"></canvas>
                </div>
            `;
        }
    }
    
    // Show calculator UI in a lightbox
    function showCalculatorUI() {
        // Set the flag that calculator is open
        isCalculatorOpen = true;
        
        // Generate options for dropdown selects
        const timeOptions = generateTimeOptions(48);
        
        const content = `
            <div class="calculator-ui">
                <div class="calculator-header">
                    <h2>NBA Comeback Calculator</h2>
                </div>
                <div class="calculator-form">
                    <div class="form-group">
                        <label for="plot-type">Plot Type:</label>
                        <select id="plot-type" class="form-control">
                            <option value="Max Points Down Or More">Max Points Down Or More</option>
                            <option value="Max Points Down">Max Points Down</option>
                            <option value="Points Down At Time">Points Down At Time</option>
                            <option value="Percent Chance: Time Vs. Points Down">Percent Chance: Time Vs. Points Down</option>
                        </select>
                    </div>
                    
                    <div class="form-group inline-form">
                        <label for="start-time-minutes">Time:</label>
                        <select id="start-time-minutes" class="form-control">
                            ${timeOptions}
                        </select>
                    </div>
                    
                    <div class="form-group" id="specific-time-selector" style="display: none;">
                        <label for="specific-time-input">Specific Time (for Points Down At Time):</label>
                        <div class="time-input-container">
                            <input type="number" id="specific-time-minutes" class="form-control time-input" min="0" max="48" value="12">
                            <span>:</span>
                            <input type="number" id="specific-time-seconds" class="form-control time-input" min="0" max="59" value="00">
                        </div>
                    </div>
                    
                    
                    <div class="year-groups-container">
                        <h3>Seasons</h3>
                        <div id="year-groups-list"></div>
                        <button id="add-year-group" class="btn btn-secondary">Add Season Range</button>
                    </div>
                    
                    <div class="game-filters-container">
                        <h3>Game Filters</h3>
                        <div id="game-filters-list"></div>
                        <button id="add-game-filter" class="btn btn-secondary">Add Game Filter</button>
                    </div>
                    
                    <div class="form-actions">
                        <button id="calculate-btn" class="btn btn-primary">Calculate</button>
                        <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Create lightbox
        const instance = basicLightbox.create(content, {
            onShow: (instance) => {
                // Add a slight delay to ensure DOM is ready
                setTimeout(() => {
                    setupFormHandlers(instance);
                }, 100);
                return true;
            },
            onClose: () => {
                // Reset the open flag when lightbox is closed
                isCalculatorOpen = false;
                return true;
            }
        });
        
        instance.show();
    }
    
    // Set up event handlers for the calculator form
    function setupFormHandlers(lightboxInstance) {
        // Plot type change handler
        const plotTypeSelect = document.getElementById('plot-type');
        plotTypeSelect.addEventListener('change', function() {
            const specificTimeSelector = document.getElementById('specific-time-selector');
            if (this.value === 'Points Down At Time') {
                specificTimeSelector.style.display = 'block';
            } else {
                specificTimeSelector.style.display = 'none';
            }
            state.plotType = this.value;
        });
        
        // Point margin is now fixed
        state.pointMargin = 15; // Default value
        
        // Time select handler
        const timeSelect = document.getElementById('start-time-minutes');
        timeSelect.addEventListener('change', function() {
            const minutes = parseInt(this.value, 10) || 0;
            state.startTimeInSeconds = minutes * 60;
        });
        
        // Specific time inputs handler (for Points Down At Time)
        const specificTimeMinutesInput = document.getElementById('specific-time-minutes');
        const specificTimeSecondsInput = document.getElementById('specific-time-seconds');
        
        specificTimeMinutesInput.addEventListener('change', updateSpecificTimeInSeconds);
        specificTimeSecondsInput.addEventListener('change', updateSpecificTimeInSeconds);
        
        function updateSpecificTimeInSeconds() {
            const minutes = parseInt(specificTimeMinutesInput.value, 10) || 0;
            const seconds = parseInt(specificTimeSecondsInput.value, 10) || 0;
            state.specificTimeInSeconds = (minutes * 60) + seconds;
        }
        
        // Add year group button
        const addYearGroupBtn = document.getElementById('add-year-group');
        addYearGroupBtn.addEventListener('click', function() {
            addYearGroup();
        });
        
        // Add game filter button
        const addGameFilterBtn = document.getElementById('add-game-filter');
        addGameFilterBtn.addEventListener('click', function() {
            addGameFilter();
        });
        
        // Initialize with an empty game filters list
        state.gameFilters = [];
        
        // Add at least one year group initially
        addYearGroup();
        
        // Calculate button
        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.addEventListener('click', function() {
            calculateAndRenderChart();
            lightboxInstance.close();
            isCalculatorOpen = false;
        });
        
        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        cancelBtn.addEventListener('click', function() {
            lightboxInstance.close();
            isCalculatorOpen = false;
        });
    }
    
    // Add a year group UI element
    function addYearGroup() {
        const yearGroupId = `year-group-${state.yearGroups.length}`;
        const yearGroupsList = document.getElementById('year-groups-list');
        
        const isFirstGroup = state.yearGroups.length === 0;
        const yearGroupHtml = `
            <div id="${yearGroupId}" class="year-group">
                <div class="form-row">
                    <div class="form-group col-md-4 inline-form">
                        <label for="${yearGroupId}-min-year">Min Year:</label>
                        <select id="${yearGroupId}-min-year" class="form-control min-year-select">
                            ${generateYearOptions(1996, 2024)}
                        </select>
                    </div>
                    <div class="form-group col-md-4 inline-form">
                        <label for="${yearGroupId}-max-year">Max Year:</label>
                        <select id="${yearGroupId}-max-year" class="form-control max-year-select">
                            ${generateYearOptions(1996, 2024, 2024)}
                        </select>
                    </div>
                    <div class="form-group col-md-4">
                        <div style="margin-top: 5px;">
                            <div class="form-check d-inline-block">
                                <input type="checkbox" id="${yearGroupId}-regular" class="form-check-input regular-season-check" checked>
                                <label for="${yearGroupId}-regular" class="form-check-label">Regular Season</label>
                            </div>
                            <div class="form-check d-inline-block">
                                <input type="checkbox" id="${yearGroupId}-playoffs" class="form-check-input playoffs-check" checked>
                                <label for="${yearGroupId}-playoffs" class="form-check-label">Playoffs</label>
                            </div>
                        </div>
                        ${!isFirstGroup ? '<button class="btn btn-sm btn-danger remove-year-group">Remove</button>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        yearGroupsList.insertAdjacentHTML('beforeend', yearGroupHtml);
        
        // Add event listeners to new elements
        const yearGroup = document.getElementById(yearGroupId);
        const removeButton = yearGroup.querySelector('.remove-year-group');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                yearGroup.remove();
                updateYearGroupsState();
            });
        }
        
        const inputs = yearGroup.querySelectorAll('select, input');
        inputs.forEach(input => {
            input.addEventListener('change', updateYearGroupsState);
        });
        
        updateYearGroupsState();
    }
    
    // Add a game filter UI element
    function addGameFilter() {
        const filterId = `game-filter-${state.gameFilters.length}`;
        const filtersList = document.getElementById('game-filters-list');
        
        const filterHtml = `
            <div id="${filterId}" class="game-filter">
                <div class="form-row single-line-filter">
                    <div class="form-group inline-form col-filter-team">
                        <label for="${filterId}-home-team">For Team</label>
                        <select id="${filterId}-home-team" class="form-control home-team-select">
                            <option value="">Any</option>
                            ${generateTeamOptions()}
                        </select>
                    </div>
                    <div class="form-group inline-form col-filter-team">
                        <label for="${filterId}-away-team">Vs Team</label>
                        <select id="${filterId}-away-team" class="form-control away-team-select">
                            <option value="">Any</option>
                            ${generateTeamOptions()}
                        </select>
                    </div>
                    <div class="form-group inline-form col-filter-rank">
                        <label for="${filterId}-team-rank">Team Rank</label>
                        <select id="${filterId}-team-rank" class="form-control team-rank-select">
                            <option value="">Any</option>
                            <option value="top5">Top 5</option>
                            <option value="top10">Top 10</option>
                            <option value="mid10">Mid 10</option>
                            <option value="bot10">Bot 10</option>
                            <option value="bot5">Bot 5</option>
                        </select>
                    </div>
                    <div class="form-group inline-form col-filter-rank">
                        <label for="${filterId}-opp-rank">Opp Rank</label>
                        <select id="${filterId}-opp-rank" class="form-control opp-rank-select">
                            <option value="">Any</option>
                            <option value="top5">Top 5</option>
                            <option value="top10">Top 10</option>
                            <option value="mid10">Mid 10</option>
                            <option value="bot10">Bot 10</option>
                            <option value="bot5">Bot 5</option>
                        </select>
                    </div>
                    <div class="form-group inline-form col-filter-location">
                        <label for="${filterId}-team-location">For Team At</label>
                        <select id="${filterId}-team-location" class="form-control team-location-select">
                            <option value="any">Either</option>
                            <option value="home">Home</option>
                            <option value="away">Away</option>
                        </select>
                    </div>
                    <div class="form-group col-filter-button">
                        <button class="btn btn-sm btn-danger remove-game-filter">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        filtersList.insertAdjacentHTML('beforeend', filterHtml);
        
        // Add event listeners to new elements
        const filter = document.getElementById(filterId);
        filter.querySelector('.remove-game-filter').addEventListener('click', function() {
            filter.remove();
            updateGameFiltersState();
        });
        
        const inputs = filter.querySelectorAll('select, input');
        inputs.forEach(input => {
            input.addEventListener('change', updateGameFiltersState);
        });
        
        updateGameFiltersState();
    }
    
    // Generate options for year selects
    function generateYearOptions(minYear, maxYear, selectedYear = minYear) {
        let options = '';
        for (let year = minYear; year <= maxYear; year++) {
            const selected = year === selectedYear ? 'selected' : '';
            options += `<option value="${year}" ${selected}>${year}</option>`;
        }
        return options;
    }
    
    // Generate options for time selects with specific values
    function generateTimeOptions(selectedTime = 48) {
        const timeValues = [48, 36, 24, 18, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        let options = '';
        
        for (const time of timeValues) {
            const selected = time === selectedTime ? 'selected' : '';
            options += `<option value="${time}" ${selected}>${time} minute${time !== 1 ? 's' : ''}</option>`;
        }
        
        return options;
    }
    
    // Generate options for team selects
    function generateTeamOptions() {
        const teams = [
            'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
            'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
            'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS',
            // Include historical teams too
            'NJN', 'NOH', 'NOK', 'SEA', 'VAN', 'CHH'
        ];
        
        return teams.map(team => `<option value="${team}">${team}</option>`).join('');
    }
    
    // Update year groups state from UI
    function updateYearGroupsState() {
        state.yearGroups = [];
        
        const yearGroups = document.querySelectorAll('.year-group');
        yearGroups.forEach(group => {
            const minYearSelect = group.querySelector('.min-year-select');
            const maxYearSelect = group.querySelector('.max-year-select');
            const regularSeasonCheck = group.querySelector('.regular-season-check');
            const playoffsCheck = group.querySelector('.playoffs-check');
            
            if (minYearSelect && maxYearSelect) {
                let minYear = parseInt(minYearSelect.value, 10);
                let maxYear = parseInt(maxYearSelect.value, 10);
                
                let label;
                if (regularSeasonCheck.checked && playoffsCheck.checked) {
                    // Both regular season and playoffs selected
                    label = `${minYear}-${maxYear}`;
                } else if (regularSeasonCheck.checked) {
                    // Only regular season
                    label = `R${minYear}-${maxYear}`;
                } else if (playoffsCheck.checked) {
                    // Only playoffs
                    label = `P${minYear}-${maxYear}`;
                } else {
                    // Neither selected - shouldn't happen but just in case
                    label = `${minYear}-${maxYear}`;
                }
                
                state.yearGroups.push({
                    minYear: minYear,
                    maxYear: maxYear,
                    label: label,
                    regularSeason: regularSeasonCheck.checked,
                    playoffs: playoffsCheck.checked
                });
            }
        });
    }
    
    // Update game filters state from UI
    function updateGameFiltersState() {
        state.gameFilters = [];
        
        const filters = document.querySelectorAll('.game-filter');
        filters.forEach(filter => {
            const homeTeamSelect = filter.querySelector('.home-team-select');
            const awayTeamSelect = filter.querySelector('.away-team-select');
            const teamRankSelect = filter.querySelector('.team-rank-select');
            const oppRankSelect = filter.querySelector('.opp-rank-select');
            const teamLocationSelect = filter.querySelector('.team-location-select');
            
            // Get the team location value (replaces the radio buttons)
            let homeWon = null;
            let teamLocation = null;
            
            if (teamLocationSelect && teamLocationSelect.value !== 'any') {
                teamLocation = teamLocationSelect.value;
                // Set homeWon based on team location
                if (teamLocation === 'home') {
                    homeWon = true;
                } else if (teamLocation === 'away') {
                    homeWon = false;
                }
            }
            
            let teamRankOption = null;
            let oppRankOption = null;
            
            // Convert rank selections to GameFilter options
            if (teamRankSelect.value) {
                if (teamRankSelect.value === 'top5') {
                    teamRankOption = { home_in_top_n: 5 };
                } else if (teamRankSelect.value === 'top10') {
                    teamRankOption = { home_in_top_n: 10 };
                } else if (teamRankSelect.value === 'mid10') {
                    // Mid 10 is ranks 11-20
                    teamRankOption = { home_in_mid_n: 10 };
                } else if (teamRankSelect.value === 'bot10') {
                    teamRankOption = { home_in_bottom_n: 10 };
                } else if (teamRankSelect.value === 'bot5') {
                    teamRankOption = { home_in_bottom_n: 5 };
                }
            }
            
            if (oppRankSelect.value) {
                if (oppRankSelect.value === 'top5') {
                    oppRankOption = { away_in_top_n: 5 };
                } else if (oppRankSelect.value === 'top10') {
                    oppRankOption = { away_in_top_n: 10 };
                } else if (oppRankSelect.value === 'mid10') {
                    // Mid 10 is ranks 11-20
                    oppRankOption = { away_in_mid_n: 10 };
                } else if (oppRankSelect.value === 'bot10') {
                    oppRankOption = { away_in_bottom_n: 10 };
                } else if (oppRankSelect.value === 'bot5') {
                    oppRankOption = { away_in_bottom_n: 5 };
                }
            }
            
            const gameFilter = new nbacc_calculator_core.GameFilter({
                home_team: homeTeamSelect.value || null,
                away_team: awayTeamSelect.value || null,
                ...(teamRankOption || {}),
                ...(oppRankOption || {}),
                home_won: homeWon,
                team_location: teamLocation
            });
            
            state.gameFilters.push(gameFilter);
        });
    }
    
    // Calculate and render chart based on current state
    async function calculateAndRenderChart() {
        const chartContainer = document.getElementById('nbacc_chart_container');
        chartContainer.style.display = 'block';
        
        // Show loading indicator
        chartContainer.innerHTML = '<div class="loading">Loading data and calculating...</div>';
        
        try {
            // Load all required season data
            const minYear = Math.min(...state.yearGroups.map(g => g.minYear));
            const maxYear = Math.max(...state.yearGroups.map(g => g.maxYear));
            const seasonData = await nbacc_calculator_core.loadSeasonData(minYear, maxYear);
            
            // Process the data using core calculator
            const chartData = nbacc_calculator_core.processGameData({
                plotType: state.plotType,
                yearGroups: state.yearGroups,
                seasonData: seasonData,
                gameFilters: state.gameFilters,
                startTimeInSeconds: state.startTimeInSeconds,
                endTimeInSeconds: state.plotType === 'Points Down At Time' ? null : 0,
                specificTimeInSeconds: state.plotType === 'Points Down At Time' ? state.specificTimeInSeconds : null,
                pointMargin: state.pointMargin
            });
            
            // Reset container
            chartContainer.innerHTML = '<canvas id="nbacc_calculator_chart"></canvas>';
            
            // Use the existing plotter to render the chart
            const chartConfig = nbacc_plotter_data.formatDataForChartJS(chartData);
            nbacc_plotter_core.createChartJSChart('nbacc_calculator_chart', chartConfig);
        } catch (error) {
            console.error('Error calculating chart:', error);
            chartContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }
    
    return {
        initUI,
        calculateAndRenderChart
    };
})();

// Initialize the calculator UI when the page loads
document.addEventListener('DOMContentLoaded', function() {
    nbacc_calculator_ui.initUI();
});

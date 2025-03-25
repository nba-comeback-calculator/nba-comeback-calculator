/**
 * nbacc_calculator_state.js
 *
 * Manages calculator state through URL parameters for the NBA Comeback Calculator.
 * This module provides functions to:
 * 1. Encode calculator state as URL parameters
 * 2. Parse URL parameters to restore calculator state
 */

const nbacc_calculator_state = (() => {
    // Variable to store the current URL state string
    let currentUrlString = '';
    
    /**
     * Gets the current URL state string
     * @returns {string} The current URL state string
     */
    function getCurrentUrlString() {
        return currentUrlString;
    }
    
    /**
     * Sets the current URL state string
     * @param {string} urlString - The URL state string to set
     */
    function setCurrentUrlString(urlString) {
        currentUrlString = urlString;
    }
    
    /**
     * Encodes the calculator state as URL parameters using the simplified scheme:
     * p=<plot_type_index>,<time>,<percent_one>_<percent_two>_...&s={season_one}+{season_two}&g={game_filter_one}+{game_filter_two}
     * 
     * @param {Object} state - The calculator state to encode
     * @returns {string} URL parameter string (without the leading '?')
     */
    function encodeStateToUrlParams(state) {
        try {
            // Plot type mapping to index
            const plotTypes = [
                "Percent Chance: Time Vs. Points Down", 
                "Max Points Down Or More", 
                "Max Points Down", 
                "Points Down At Time"
            ];
            
            const plotTypeIndex = plotTypes.indexOf(state.plotType);
            if (plotTypeIndex === -1) return '';  // Invalid plot type
            
            // Build p parameter (plot settings)
            let pParam = `${plotTypeIndex}-${state.startTime}`;
            
            // Add percent values for Percent Chance plot type
            if (plotTypeIndex === 0 && state.selectedPercents && state.selectedPercents.length > 0) {
                pParam += `-${state.selectedPercents.join('_')}`;
                
                // Add guide flags if set
                if (state.plotGuides || state.plotCalculatedGuides) {
                    pParam += `-${state.plotGuides ? '1' : '0'}${state.plotCalculatedGuides ? '1' : '0'}`;
                }
            }
            
            // Build s parameter (seasons)
            let sParam = '';
            if (state.yearGroups && state.yearGroups.length > 0) {
                sParam = state.yearGroups.map(group => {
                    // Season type: B=Both, R=Regular, P=Playoffs
                    let seasonType = 'B';
                    if (group.regularSeason && !group.playoffs) seasonType = 'R';
                    if (!group.regularSeason && group.playoffs) seasonType = 'P';
                    
                    return `${group.minYear}-${group.maxYear}-${seasonType}`;
                }).join('~');
            }
            
            // Build g parameter (game filters)
            let gParam = '';
            if (state.gameFilters && state.gameFilters.length > 0) {
                gParam = state.gameFilters.map(filter => {
                    // Handle null filter or empty filter object (ANY-e-ANY)
                    if (!filter || Object.keys(filter).length === 0) return 'ANY-e-ANY';
                    
                    // For team field (team abbreviation or rank)
                    let forTeamField = 'ANY';
                    if (filter.for_rank) {
                        forTeamField = filter.for_rank.toUpperCase();
                    } else if (filter.for_team_abbr) {
                        forTeamField = Array.isArray(filter.for_team_abbr) ? 
                            filter.for_team_abbr[0].toUpperCase() : filter.for_team_abbr.toUpperCase();
                    }
                    
                    // Home/Away field: e=either, h=home, a=away
                    let homeAwayField = 'e';
                    if (filter.for_at_home === true) homeAwayField = 'h';
                    if (filter.for_at_home === false) homeAwayField = 'a';
                    
                    // Vs team field
                    let vsTeamField = 'ANY';
                    if (filter.vs_rank) {
                        vsTeamField = filter.vs_rank.toUpperCase();
                    } else if (filter.vs_team_abbr) {
                        vsTeamField = Array.isArray(filter.vs_team_abbr) ? 
                            filter.vs_team_abbr[0].toUpperCase() : filter.vs_team_abbr.toUpperCase();
                    }
                    
                    return `${forTeamField}-${homeAwayField}-${vsTeamField}`;
                }).join('~');
            }
            
            // Combine all parameters
            let params = [`p=${pParam}`];
            if (sParam) params.push(`s=${sParam}`);
            if (gParam) params.push(`g=${gParam}`);
            
            return params.join('&');
            
        } catch (error) {
            console.error('Failed to encode state to URL:', error);
            return '';
        }
    }
    
    /**
     * Decodes URL parameters into calculator state
     * @param {string} urlParams - URL parameter string (without the leading '?')
     * @returns {Object|null} The decoded calculator state or null if parsing fails
     */
    function decodeUrlParamsToState(urlParams) {
        try {
            console.log('Decoding URL parameters:', urlParams);
            
            // Handle case where URL might include '?' prefix
            if (urlParams.startsWith('?')) {
                urlParams = urlParams.substring(1);
            }
            
            // Parse URL parameters
            const params = new URLSearchParams(urlParams);
            
            // Create a default state object
            const state = {
                plotType: "Percent Chance: Time Vs. Points Down",
                startTime: 24,
                endTime: 0,
                specificTime: 12,
                selectedPercents: ["20", "10", "5", "1"],
                plotGuides: false,
                plotCalculatedGuides: false,
                yearGroups: [],
                gameFilters: []
            };
            
            // Plot type mapping
            const plotTypes = [
                "Percent Chance: Time Vs. Points Down", 
                "Max Points Down Or More", 
                "Max Points Down", 
                "Points Down At Time"
            ];
            
            // Parse p parameter (plot settings)
            const pParam = params.get('p');
            console.log('Parsing plot parameter:', pParam);
            
            if (pParam) {
                const pParts = pParam.split('-');
                
                // Plot type
                const plotTypeIndex = parseInt(pParts[0]);
                if (!isNaN(plotTypeIndex) && plotTypeIndex >= 0 && plotTypeIndex < plotTypes.length) {
                    state.plotType = plotTypes[plotTypeIndex];
                    console.log('Set plot type to:', state.plotType);
                } else {
                    console.warn('Invalid plot type index:', plotTypeIndex, 'using default');
                }
                
                // Start time
                if (pParts.length > 1) {
                    const parsedTime = parseInt(pParts[1]);
                    if (!isNaN(parsedTime) && parsedTime > 0 && parsedTime <= 48) {
                        state.startTime = parsedTime;
                        console.log('Set start time to:', state.startTime);
                        
                        // For Points Down At Time, use startTime as specificTime
                        if (state.plotType === "Points Down At Time") {
                            state.specificTime = state.startTime;
                        }
                    } else {
                        console.warn('Invalid start time:', parsedTime, 'using default');
                    }
                }
                
                // Percents for Percent Chance plot type
                if (state.plotType === "Percent Chance: Time Vs. Points Down" && pParts.length > 2) {
                    // Handle empty percent strings
                    if (pParts[2] && pParts[2].length > 0) {
                        state.selectedPercents = pParts[2].split('_').filter(p => p.length > 0);
                        console.log('Set selected percents to:', state.selectedPercents);
                        
                        // If no valid percents were parsed, use defaults
                        if (state.selectedPercents.length === 0) {
                            state.selectedPercents = ["20", "10", "5", "1"];
                            console.warn('No valid percents found, using defaults');
                        }
                    }
                    
                    // Guide flags if provided
                    if (pParts.length > 3 && pParts[3] && pParts[3].length === 2) {
                        state.plotGuides = pParts[3][0] === '1';
                        state.plotCalculatedGuides = pParts[3][1] === '1';
                        console.log('Set guide flags to:', state.plotGuides, state.plotCalculatedGuides);
                    }
                }
            }
            
            // Parse s parameter (seasons)
            const sParam = params.get('s');
            console.log('Parsing seasons parameter:', sParam);
            
            if (sParam) {
                const seasonsArray = sParam.split('~').filter(s => s && s.length > 0);
                
                if (seasonsArray.length > 0) {
                    state.yearGroups = seasonsArray.map(seasonStr => {
                        const parts = seasonStr.split('-');
                        if (parts.length !== 3) {
                            console.warn('Invalid season format:', seasonStr);
                            return null;
                        }
                        
                        const minYear = parseInt(parts[0]);
                        const maxYear = parseInt(parts[1]);
                        const seasonType = parts[2];
                        
                        // Validate years
                        if (isNaN(minYear) || isNaN(maxYear) || minYear < 1996 || maxYear > 2030 || minYear > maxYear) {
                            console.warn('Invalid year range:', minYear, '-', maxYear);
                            return null;
                        }
                        
                        // Determine regular season and playoffs flags
                        let regularSeason = true;
                        let playoffs = true;
                        
                        if (seasonType === 'R') {
                            playoffs = false;
                        } else if (seasonType === 'P') {
                            regularSeason = false;
                        } else if (seasonType !== 'B') {
                            console.warn('Invalid season type:', seasonType, 'using default (both)');
                        }
                        
                        // Create label based on year range and season type
                        let label;
                        if (regularSeason && playoffs) {
                            label = `${minYear}-${maxYear}`;
                        } else if (regularSeason) {
                            label = `R${minYear}-${maxYear}`;
                        } else if (playoffs) {
                            label = `P${minYear}-${maxYear}`;
                        } else {
                            // Fall back to both if somehow neither is set
                            label = `${minYear}-${maxYear}`;
                            regularSeason = true;
                            playoffs = true;
                        }
                        
                        return {
                            minYear,
                            maxYear,
                            regularSeason,
                            playoffs,
                            label
                        };
                    }).filter(group => group !== null);
                    
                    console.log(`Set ${state.yearGroups.length} year groups from URL parameters:`, state.yearGroups);
                }
                
                // If no valid year groups were parsed, add a default one
                if (state.yearGroups.length === 0) {
                    state.yearGroups = [{
                        minYear: 2017,
                        maxYear: 2024,
                        regularSeason: true,
                        playoffs: true,
                        label: '2017-2024'
                    }];
                    console.warn('No valid year groups found, using default 2017-2024');
                }
            } else {
                // If no seasons parameter was provided, use the default
                state.yearGroups = [{
                    minYear: 2017,
                    maxYear: 2024,
                    regularSeason: true,
                    playoffs: true,
                    label: '2017-2024'
                }];
                console.log('No seasons parameter, using default 2017-2024');
            }
            
            // Parse g parameter (game filters)
            const gParam = params.get('g');
            console.log('Parsing game filters parameter:', gParam);
            
            if (gParam) {
                const filterArray = gParam.split('~').filter(f => f && f.length > 0);
                
                if (filterArray.length > 0) {
                    // We'll collect the game filter param objects first
                    const filterParams = filterArray.map(filterStr => {
                        const parts = filterStr.split('-');
                        if (parts.length !== 3) {
                            console.warn('Invalid filter format:', filterStr);
                            return null;
                        }
                        
                        const forTeamField = parts[0].toUpperCase();
                        const homeAwayField = parts[1].toLowerCase(); // e, h, or a
                        const vsTeamField = parts[2].toUpperCase();
                        
                        // Create filter parameters
                        const params = {};
                        
                        // Home/Away status: e=either, h=home, a=away
                        if (homeAwayField === 'h') {
                            params.for_at_home = true;
                        } else if (homeAwayField === 'a') {
                            params.for_at_home = false;
                        } // else keep as undefined for 'e' (either)
                        
                        // For team field
                        if (forTeamField && forTeamField !== 'ANY') {
                            // Check if it's a team rank
                            if (['TOP_5', 'TOP_10', 'MID_10', 'BOT_10', 'BOT_5'].includes(forTeamField)) {
                                params.for_rank = forTeamField.toLowerCase();
                            } else {
                                // It's a team abbreviation
                                params.for_team_abbr = forTeamField;
                            }
                        }
                        
                        // Vs team field
                        if (vsTeamField && vsTeamField !== 'ANY') {
                            // Check if it's a team rank
                            if (['TOP_5', 'TOP_10', 'MID_10', 'BOT_10', 'BOT_5'].includes(vsTeamField)) {
                                params.vs_rank = vsTeamField.toLowerCase();
                            } else {
                                // It's a team abbreviation
                                params.vs_team_abbr = vsTeamField;
                            }
                        }
                        
                        // If we have an ANY-e-ANY filter, still return it as an empty object, not null
                        // This allows the UI to create the right number of filter rows
                        if (forTeamField === 'ANY' && homeAwayField === 'e' && vsTeamField === 'ANY') {
                            console.log('ANY-e-ANY filter found, keeping as empty filter');
                            // Return an empty object to preserve the filter row
                            return params;
                        }
                        
                        // If all params are empty for other cases, return empty object to preserve the row
                        if (Object.keys(params).length === 0) {
                            console.log('Empty filter params, keeping as empty filter');
                            return params;
                        }
                        
                        return params;
                    }).filter(params => params !== null);
                    
                    console.log('Parsed filter parameters:', filterParams);
                    
                    // Store filter params in the state - may be an empty array
                    state.gameFilters = filterParams;
                    console.log(`Parsed ${state.gameFilters.length} game filters from URL parameters`);
                } else {
                    // No valid filters in parameter, use empty array
                    state.gameFilters = [];
                    console.log('No valid filters in parameter, using empty array');
                }
            } else {
                // No game filters parameter, use empty array
                state.gameFilters = [];
                console.log('No game filters parameter, using empty array');
            }
            
            console.log('Decoded state:', state);
            return state;
            
        } catch (error) {
            console.error('Failed to parse URL parameters:', error);
            return null;
        }
    }
    
    /**
     * Check if there are URL parameters related to the calculator
     * @returns {boolean} True if URL contains calculator parameters
     */
    function hasStateInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = urlParams.has('p') || urlParams.has('s') || urlParams.has('g');
        console.log('Checking URL parameters:', window.location.search, 'Has params:', hasParams);
        return hasParams;
    }
    
    /**
     * Extract state from URL parameters
     * @returns {Object|null} Extracted state or null if no parameters found or parsing fails
     */
    function getStateFromUrl() {
        if (!hasStateInUrl()) return null;
        
        const urlString = window.location.search.substring(1);
        console.log("Loading state from URL parameters:", urlString);
        setCurrentUrlString(urlString);
        
        const state = decodeUrlParamsToState(urlString);
        if (state) {
            console.log("Successfully loaded state with:", 
                state.yearGroups?.length || 0, "year groups and", 
                state.gameFilters?.length || 0, "game filters");
        }
        
        return state;
    }
    
    /**
     * Update the browser URL with the current calculator state without reloading the page
     * @param {Object} state - Current calculator state
     */
    function updateBrowserUrl(state) {
        if (!state) return;
        
        try {
            let params = encodeStateToUrlParams(state);
            if (!params) return;
            
            // Store the URL string for future reference
            setCurrentUrlString(params);
            
            // Update URL without triggering a page reload - don't include targetChartId
            const url = `${window.location.pathname}?${params}${window.location.hash}`;
            window.history.replaceState({}, '', url);
            
            console.log('URL state updated:', params);
            return params;
        } catch (error) {
            console.error('Failed to update browser URL:', error);
            return '';
        }
    }
    
    // Return public API
    return {
        getCurrentUrlString,
        setCurrentUrlString,
        encodeStateToUrlParams,
        decodeUrlParamsToState,
        hasStateInUrl,
        getStateFromUrl,
        updateBrowserUrl
    };
})();
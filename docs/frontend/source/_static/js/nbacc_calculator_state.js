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
     * Encodes the calculator state as URL parameters using separate parameters:
     * p=<plot_type_index>&t=<time>&pc=<percent_one>_<percent_two>_...&s={season_one}+{season_two}&g={game_filter_one}+{game_filter_two}
     * 
     * @param {Object} state - The calculator state to encode
     * @returns {string} URL parameter string (without the leading '?')
     */
    function encodeStateToUrlParams(state) {
        try {
            // Plot type mapping to index
            const plotTypes = [
                "Max Points Down Or More", 
                "Max Points Down", 
                "Points Down At Time",
                "Percent Chance: Time Vs. Points Down"
            ];
            
            const plotTypeIndex = plotTypes.indexOf(state.plotType);
            if (plotTypeIndex === -1) return '';  // Invalid plot type
            
            // Build p parameter (plot type index)
            const pParam = plotTypeIndex.toString();
            
            // Build t parameter (time)
            // Convert fractional times to seconds string format for encoding in URL
            let tParam;
            if (typeof state.startTime === 'number') {
                if (state.startTime === 0.75) tParam = "45s";
                else if (state.startTime === 0.5) tParam = "30s";
                else if (state.startTime === 0.25) tParam = "15s";
                else if (state.startTime === 1/6) tParam = "10s";
                else if (state.startTime === 1/12) tParam = "5s";
                else tParam = state.startTime.toString();
            } else {
                tParam = state.startTime;
            }
            
            // Build pc parameter (percents) for Percent Chance plot type
            let pcParam = '';
            if (plotTypeIndex === 0 && state.selectedPercents && state.selectedPercents.length > 0) {
                pcParam = state.selectedPercents.join('_');
                
                // Add guide flags if set
                if (state.plotGuides || state.plotCalculatedGuides) {
                    pcParam += `_${state.plotGuides ? '1' : '0'}${state.plotCalculatedGuides ? '1' : '0'}`;
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
            
            // Add m parameter for max point margin (for non-percent charts)
            let mParam = '';
            if (plotTypeIndex !== 0) {
                if (state.maxPointMargin === null) {
                    mParam = 'auto';
                } else if (state.maxPointMargin === 1000) {
                    mParam = 'all';
                } else {
                    mParam = state.maxPointMargin.toString();
                }
            }
            
            // Combine all parameters
            let params = [`p=${pParam}`, `t=${tParam}`];
            if (pcParam) params.push(`pc=${pcParam}`);
            if (sParam) params.push(`s=${sParam}`);
            if (gParam) params.push(`g=${gParam}`);
            if (mParam) params.push(`m=${mParam}`);
            
            return params.join('&');
            
        } catch (error) {
            // This console logging is no longer needed because features are working fine
            // console.error('Failed to encode state to URL:', error);
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
            // This console logging is no longer needed because features are working fine
            // console.log('Decoding URL parameters:', urlParams);
            
            // Handle case where URL might include '?' prefix
            if (urlParams.startsWith('?')) {
                urlParams = urlParams.substring(1);
            }
            
            // Parse URL parameters
            const params = new URLSearchParams(urlParams);
            
            // Create a default state object
            const state = {
                plotType: "Max Points Down Or More",
                startTime: 48,
                endTime: 0,
                specificTime: 12,
                selectedPercents: ["20", "10", "5", "1", "Record"],
                plotGuides: false,
                plotCalculatedGuides: false,
                maxPointMargin: null, // Auto by default
                yearGroups: [],
                gameFilters: []
            };
            
            // Check for max point margin parameter
            const mParam = params.get('m');
            if (mParam) {
                if (mParam === 'auto') {
                    state.maxPointMargin = null;
                } else if (mParam === 'all') {
                    state.maxPointMargin = 1000;
                } else {
                    state.maxPointMargin = parseInt(mParam, 10);
                    if (isNaN(state.maxPointMargin)) {
                        state.maxPointMargin = null; // Default to auto if invalid
                    }
                }
            }
            
            // Plot type mapping
            const plotTypes = [
                "Max Points Down Or More", 
                "Max Points Down", 
                "Points Down At Time",
                "Percent Chance: Time Vs. Points Down"
            ];
            
            // Handle different URL parameter formats:
            // 1. New style: separate p, t, and pc parameters
            // 2. Legacy style with t=plotType_time_percents 
            // 3. Oldest style with p=plotType-time-percents
            
            // Get all relevant parameters
            const pParam = params.get('p');
            const tParam = params.get('t');
            const pcParam = params.get('pc');
            
            // Try to parse the plot type parameter
            if (pParam !== null) {
                // Parse new-style plot type parameter
                const plotTypeIndex = parseInt(pParam, 10);
                if (!isNaN(plotTypeIndex) && plotTypeIndex >= 0 && plotTypeIndex < plotTypes.length) {
                    state.plotType = plotTypes[plotTypeIndex];
                }
                
                // Parse time parameter if it exists
                if (tParam !== null) {
                    parseTimeParameter(tParam, state);
                }
                
                // Parse percent parameter for Percent Chance plot type
                if (state.plotType === "Percent Chance: Time Vs. Points Down" && pcParam !== null) {
                    parsePercentParameter(pcParam, state);
                }
            } else if (tParam !== null && tParam.includes('_')) {
                // Legacy style with t=plotType_time_percents
                const paramParts = tParam.split('_');
                
                // Plot type
                const plotTypeIndex = parseInt(paramParts[0], 10);
                if (!isNaN(plotTypeIndex) && plotTypeIndex >= 0 && plotTypeIndex < plotTypes.length) {
                    state.plotType = plotTypes[plotTypeIndex];
                }
                
                // Parse time (second part)
                if (paramParts.length > 1) {
                    parseTimeParameter(paramParts[1], state);
                }
                
                // Parse percents (remaining parts) for Percent Chance plot type
                if (state.plotType === "Percent Chance: Time Vs. Points Down" && paramParts.length > 2) {
                    // Get remaining parts for percent values and guide flags
                    const percentParts = paramParts.slice(2);
                    parsePercentParameter(percentParts.join('_'), state);
                }
            } else if (tParam !== null) {
                // Just a simple time parameter
                parseTimeParameter(tParam, state);
            } else if (params.has('p') && pParam.includes('-')) {
                // Oldest style with p=plotType-time-percents
                const paramParts = pParam.split('-');
                
                // Plot type
                const plotTypeIndex = parseInt(paramParts[0], 10);
                if (!isNaN(plotTypeIndex) && plotTypeIndex >= 0 && plotTypeIndex < plotTypes.length) {
                    state.plotType = plotTypes[plotTypeIndex];
                }
                
                // Parse time (second part)
                if (paramParts.length > 1) {
                    parseTimeParameter(paramParts[1], state);
                }
                
                // Parse percents (remaining parts) for Percent Chance plot type
                if (state.plotType === "Percent Chance: Time Vs. Points Down" && paramParts.length > 2) {
                    // Get remaining parts for percent values and guide flags
                    const percentParts = paramParts.slice(2);
                    parsePercentParameter(percentParts.join('_'), state);
                }
            }
            
            // Helper function to parse time parameter
            function parseTimeParameter(timeStr, stateObj) {
                // Check if it's a seconds string like "45s", "30s", etc.
                if (typeof timeStr === 'string' && timeStr.endsWith('s')) {
                    const secondsMatch = timeStr.match(/^(\d+)s$/);
                    if (secondsMatch) {
                        const seconds = parseInt(secondsMatch[1], 10);
                        // Convert seconds to the appropriate fractional minute value for the UI
                        if (seconds === 45) stateObj.startTime = 0.75;
                        else if (seconds === 30) stateObj.startTime = 0.5;
                        else if (seconds === 15) stateObj.startTime = 0.25;
                        else if (seconds === 10) stateObj.startTime = 1/6;
                        else if (seconds === 5) stateObj.startTime = 1/12;
                        else stateObj.startTime = seconds / 60; // Generic conversion as fallback
                    }
                } else {
                    // Handle regular minute values
                    const parsedTime = parseFloat(timeStr);
                    if (!isNaN(parsedTime) && parsedTime > 0 && parsedTime <= 48) {
                        stateObj.startTime = parsedTime;
                    }
                }
                
                // For Points Down At Time, use startTime as specificTime
                if (stateObj.plotType === "Points Down At Time") {
                    stateObj.specificTime = stateObj.startTime;
                }
            }
            
            // Helper function to parse percent parameter
            function parsePercentParameter(percentStr, stateObj) {
                if (percentStr && percentStr.length > 0) {
                    // Split by underscore and filter out empty parts
                    const parts = percentStr.split('_').filter(p => p.length > 0);
                    
                    // Check if the last part contains guide flags (it would be a 2-character string with 0/1)
                    if (parts.length > 0 && parts[parts.length - 1].length === 2 && 
                        (parts[parts.length - 1][0] === '0' || parts[parts.length - 1][0] === '1') &&
                        (parts[parts.length - 1][1] === '0' || parts[parts.length - 1][1] === '1')) {
                        
                        // Extract guide flags
                        const guideFlags = parts.pop();
                        stateObj.plotGuides = guideFlags[0] === '1';
                        stateObj.plotCalculatedGuides = guideFlags[1] === '1';
                    }
                    
                    // Remaining parts are percent values
                    if (parts.length > 0) {
                        stateObj.selectedPercents = parts;
                    } else {
                        // If no valid percents were parsed, use defaults
                        stateObj.selectedPercents = ["20", "10", "5", "1"];
                    }
                }
            }
            
            // Parse s parameter (seasons)
            const sParam = params.get('s');
            // This console logging is no longer needed because features are working fine
            // console.log('Parsing seasons parameter:', sParam);
            
            if (sParam) {
                const seasonsArray = sParam.split('~').filter(s => s && s.length > 0);
                
                if (seasonsArray.length > 0) {
                    state.yearGroups = seasonsArray.map(seasonStr => {
                        const parts = seasonStr.split('-');
                        if (parts.length !== 3) {
                            // This console logging is no longer needed because features are working fine
                            // console.warn('Invalid season format:', seasonStr);
                            return null;
                        }
                        
                        const minYear = parseInt(parts[0]);
                        const maxYear = parseInt(parts[1]);
                        const seasonType = parts[2];
                        
                        // Validate years
                        if (isNaN(minYear) || isNaN(maxYear) || minYear < 1996 || maxYear > 2030 || minYear > maxYear) {
                            // This console logging is no longer needed because features are working fine
                            // console.warn('Invalid year range:', minYear, '-', maxYear);
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
                            // This console logging is no longer needed because features are working fine
                            // console.warn('Invalid season type:', seasonType, 'using default (both)');
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
                    
                    // This console logging is no longer needed because features are working fine
                    // console.log(`Set ${state.yearGroups.length} year groups from URL parameters:`, state.yearGroups);
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
                    // This console logging is no longer needed because features are working fine
                    // console.warn('No valid year groups found, using default 2017-2024');
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
                // This console logging is no longer needed because features are working fine
                // console.log('No seasons parameter, using default 2017-2024');
            }
            
            // Parse g parameter (game filters)
            const gParam = params.get('g');
            // This console logging is no longer needed because features are working fine
            // console.log('Parsing game filters parameter:', gParam);
            
            if (gParam) {
                const filterArray = gParam.split('~').filter(f => f && f.length > 0);
                
                if (filterArray.length > 0) {
                    // We'll collect the game filter param objects first
                    const filterParams = filterArray.map(filterStr => {
                        const parts = filterStr.split('-');
                        if (parts.length !== 3) {
                            // This console logging is no longer needed because features are working fine
                            // console.warn('Invalid filter format:', filterStr);
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
                            // This console logging is no longer needed because features are working fine
                            // console.log('ANY-e-ANY filter found, keeping as empty filter');
                            // Return an empty object to preserve the filter row
                            return params;
                        }
                        
                        // If all params are empty for other cases, return empty object to preserve the row
                        if (Object.keys(params).length === 0) {
                            // This console logging is no longer needed because features are working fine
                            // console.log('Empty filter params, keeping as empty filter');
                            return params;
                        }
                        
                        return params;
                    }).filter(params => params !== null);
                    
                    // This console logging is no longer needed because features are working fine
                    // console.log('Parsed filter parameters:', filterParams);
                    
                    // Convert filter params to GameFilter instances
                    if (typeof nbacc_calculator_api !== 'undefined') {
                        try {
                            // Create GameFilter instances for all the params
                            state.gameFilters = filterParams.map(params => {
                                try {
                                    // Create a GameFilter instance from the parameters
                                    return new nbacc_calculator_api.GameFilter(params);
                                } catch (error) {
                                    // This console logging is no longer needed because features are working fine
                                    // console.error("Error creating GameFilter from params:", error, params);
                                    // Try to create an empty filter as fallback
                                    try {
                                        return new nbacc_calculator_api.GameFilter({});
                                    } catch (err) {
                                        // This console logging is no longer needed because features are working fine
                                        // console.error("Failed to create fallback empty filter:", err);
                                        return null;
                                    }
                                }
                            }).filter(filter => filter !== null); // Remove any null filters
                        } catch (error) {
                            // This console logging is no longer needed because features are working fine
                            // console.error("Error creating GameFilter instances:", error);
                            state.gameFilters = [];
                        }
                    } else {
                        // Store filter params in the state to be processed later
                        state.gameFilters = filterParams;
                    }
                    // This console logging is no longer needed because features are working fine
                    // console.log(`Parsed ${state.gameFilters.length} game filters from URL parameters`);
                } else {
                    // No valid filters in parameter, use empty array
                    state.gameFilters = [];
                    // This console logging is no longer needed because features are working fine
                    // console.log('No valid filters in parameter, using empty array');
                }
            } else {
                // No game filters parameter, use empty array
                state.gameFilters = [];
                // This console logging is no longer needed because features are working fine
                // console.log('No game filters parameter, using empty array');
            }
            
            // This console logging is no longer needed because features are working fine
            // console.log('Decoded state:', state);
            return state;
            
        } catch (error) {
            // This console logging is no longer needed because features are working fine
            // console.error('Failed to parse URL parameters:', error);
            return null;
        }
    }
    
    /**
     * Check if there are URL parameters related to the calculator
     * @returns {boolean} True if URL contains calculator parameters
     */
    function hasStateInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = urlParams.has('p') || urlParams.has('t') || urlParams.has('pc') || urlParams.has('s') || urlParams.has('g') || urlParams.has('m');
        // This console logging is no longer needed because features are working fine
        // console.log('Checking URL parameters:', window.location.search, 'Has params:', hasParams);
        return hasParams;
    }
    
    /**
     * Extract state from URL parameters
     * @returns {Object|null} Extracted state or null if no parameters found or parsing fails
     */
    function getStateFromUrl() {
        if (!hasStateInUrl()) return null;
        
        const urlString = window.location.search.substring(1);
        // This console logging is no longer needed because features are working fine
        // console.log("Loading state from URL parameters:", urlString);
        setCurrentUrlString(urlString);
        
        const state = decodeUrlParamsToState(urlString);
        if (state) {
            // This console logging is no longer needed because features are working fine
            // console.log("Successfully loaded state with:", 
            //     state.yearGroups?.length || 0, "year groups and", 
            //     state.gameFilters?.length || 0, "game filters");
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
            
            // This console logging is no longer needed because features are working fine
        // console.log('URL state updated:', params);
            return params;
        } catch (error) {
            // This console logging is no longer needed because features are working fine
            // console.error('Failed to update browser URL:', error);
            return '';
        }
    }
    
    /**
     * Clear URL state parameters by removing them from the URL
     */
    function clearUrlState() {
        try {
            // Clear the stored URL string
            setCurrentUrlString('');
            
            // Update browser URL to remove parameters
            const url = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', url);
            
            // This console logging is no longer needed because features are working fine
            // console.log('URL state cleared');
            return true;
        } catch (error) {
            // This console logging is no longer needed because features are working fine
            // console.error('Failed to clear URL state:', error);
            return false;
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
        updateBrowserUrl,
        clearUrlState
    };
})();
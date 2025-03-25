/**
 * nbacc_calculator_state.js
 *
 * Manages calculator state persistence and URL encoding/decoding for the NBA Comeback Calculator.
 * This module provides functions to:
 * 1. Save calculator state to localStorage for persistence between sessions
 * 2. Load calculator state from localStorage
 * 3. Encode calculator state as URL parameters
 * 4. Parse URL parameters to restore calculator state
 */

const nbacc_calculator_state = (() => {
    // Constants
    const LOCAL_STORAGE_KEY = 'nbacc_calculator_state';
    
    /**
     * Saves the current calculator state to localStorage
     * @param {Object} state - The current calculator state
     */
    function saveStateToLocalStorage(state) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save calculator state to localStorage:', error);
        }
    }
    
    /**
     * Loads the calculator state from localStorage
     * @returns {Object|null} The saved calculator state, or null if no state is saved
     */
    function loadStateFromLocalStorage() {
        try {
            const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedState ? JSON.parse(savedState) : null;
        } catch (error) {
            console.error('Failed to load calculator state from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Encodes the calculator state as URL parameters
     * @param {Object} state - The calculator state to encode
     * @returns {string} URL parameter string (without the leading '?')
     */
    function encodeStateToUrlParams(state) {
        // Create a simplified version of the state for URL encoding
        const urlState = {
            pt: encodeValue(state.plotType), // plotType
            st: encodeValue(state.startTime), // startTime
            et: encodeValue(state.endTime), // endTime
            spt: encodeValue(state.specificTime), // specificTime
            sp: encodeValue(state.selectedPercents.join(',')), // selectedPercents
            pg: encodeValue(state.plotGuides ? 1 : 0), // plotGuides
            pcg: encodeValue(state.plotCalculatedGuides ? 1 : 0), // plotCalculatedGuides
            yg: encodeValue(encodeYearGroups(state.yearGroups)), // yearGroups
            gf: encodeValue(encodeGameFilters(state.gameFilters)) // gameFilters
        };
        
        // Convert to URL parameters
        return Object.entries(urlState)
            .filter(([_, value]) => value !== '') // Remove empty values
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
    }
    
    /**
     * Decodes URL parameters into calculator state
     * @param {string} urlParams - URL parameter string (without the leading '?')
     * @returns {Object} The decoded calculator state
     */
    function decodeUrlParamsToState(urlParams) {
        // Parse URL parameters
        const params = new URLSearchParams(urlParams);
        
        // Create a state object with default values
        const state = {
            plotType: decodeValue(params.get('pt')) || "Percent Chance: Time Vs. Points Down",
            startTime: parseInt(decodeValue(params.get('st'))) || 24,
            endTime: parseInt(decodeValue(params.get('et'))) || 0,
            specificTime: parseInt(decodeValue(params.get('spt'))) || 12,
            selectedPercents: decodeValue(params.get('sp')) ? decodeValue(params.get('sp')).split(',') : ["20", "10", "5", "1"],
            plotGuides: decodeValue(params.get('pg')) === '1',
            plotCalculatedGuides: decodeValue(params.get('pcg')) === '1',
            yearGroups: [],
            gameFilters: []
        };
        
        // Decode year groups and game filters
        if (params.get('yg')) {
            state.yearGroups = decodeYearGroups(decodeValue(params.get('yg')));
        }
        
        if (params.get('gf')) {
            state.gameFilters = decodeGameFilters(decodeValue(params.get('gf')));
        }
        
        return state;
    }
    
    // Helper functions for encoding/decoding
    
    /**
     * Encode a value for use in URL parameters
     * @param {*} value - The value to encode
     * @returns {string} The encoded value
     */
    function encodeValue(value) {
        return encodeURIComponent(value !== undefined && value !== null ? value : '');
    }
    
    /**
     * Decode a value from URL parameters
     * @param {string} value - The encoded value
     * @returns {*} The decoded value
     */
    function decodeValue(value) {
        return value ? decodeURIComponent(value) : null;
    }
    
    /**
     * Encode year groups for URL parameters
     * @param {Array} yearGroups - Array of year group objects
     * @returns {string} Encoded year groups
     */
    function encodeYearGroups(yearGroups) {
        if (!yearGroups || !yearGroups.length) return '';
        
        return yearGroups.map(group => {
            return `${group.minYear}-${group.maxYear}-${group.regularSeason ? 1 : 0}-${group.playoffs ? 1 : 0}`;
        }).join('|');
    }
    
    /**
     * Decode year groups from URL parameters
     * @param {string} encoded - Encoded year groups
     * @returns {Array} Array of year group objects
     */
    function decodeYearGroups(encoded) {
        if (!encoded) return [];
        
        return encoded.split('|').map(group => {
            const parts = group.split('-');
            return {
                minYear: parseInt(parts[0]),
                maxYear: parseInt(parts[1]),
                regularSeason: parts[2] === '1',
                playoffs: parts[3] === '1',
                label: `${parts[0]}-${parts[1]}` // Recreate label
            };
        });
    }
    
    /**
     * Encode game filters for URL parameters
     * @param {Array} gameFilters - Array of GameFilter objects
     * @returns {string} Encoded game filters
     */
    function encodeGameFilters(gameFilters) {
        if (!gameFilters || !gameFilters.length) return '';
        
        return gameFilters.map(filter => {
            if (!filter) return 'null';
            
            // Convert filter to a simple object for encoding
            const encoded = {
                h: filter.for_at_home, // home
                fr: filter.for_rank, // for_rank
                ft: filter.for_team_abbr, // for_team_abbr
                vr: filter.vs_rank, // vs_rank
                vt: filter.vs_team_abbr // vs_team_abbr
            };
            
            return JSON.stringify(encoded);
        }).join('|');
    }
    
    /**
     * Decode game filters from URL parameters
     * @param {string} encoded - Encoded game filters
     * @returns {Array} Array of GameFilter objects
     */
    function decodeGameFilters(encoded) {
        if (!encoded) return [];
        
        return encoded.split('|').map(filter => {
            if (filter === 'null') return null;
            
            try {
                const parsed = JSON.parse(filter);
                
                // Create filter params for GameFilter constructor
                const params = {
                    for_at_home: parsed.h,
                    for_rank: parsed.fr || null,
                    for_team_abbr: parsed.ft || null,
                    vs_rank: parsed.vr || null,
                    vs_team_abbr: parsed.vt || null
                };
                
                return new nbacc_calculator_api.GameFilter(params);
            } catch (error) {
                console.error('Failed to parse game filter:', error);
                return null;
            }
        });
    }
    
    /**
     * Check if there are URL parameters related to the calculator
     * @returns {boolean} True if URL contains calculator parameters
     */
    function hasStateInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('pt') || urlParams.has('yg') || urlParams.has('gf');
    }
    
    /**
     * Extract state from URL parameters
     * @returns {Object|null} Extracted state or null if no parameters found
     */
    function getStateFromUrl() {
        if (!hasStateInUrl()) return null;
        
        return decodeUrlParamsToState(window.location.search.substring(1));
    }
    
    /**
     * Create a URL with the current calculator state
     * @param {Object} state - Current calculator state
     * @returns {string} URL including parameters
     */
    function createShareableUrl(state) {
        const baseUrl = window.location.href.split('?')[0];
        const params = encodeStateToUrlParams(state);
        return `${baseUrl}?${params}`;
    }
    
    // Return public API
    return {
        saveStateToLocalStorage,
        loadStateFromLocalStorage,
        encodeStateToUrlParams,
        decodeUrlParamsToState,
        hasStateInUrl,
        getStateFromUrl,
        createShareableUrl
    };
})();
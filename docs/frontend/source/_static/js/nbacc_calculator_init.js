/**
 * nbacc_calculator_init.js
 * Initialization script for the NBA Comeback Calculator
 * This script is responsible for initializing the calculator with URL parameters if present
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if the calculator state module is loaded
    if (typeof nbacc_calculator_state !== 'undefined' && 
        typeof nbacc_calculator_ui !== 'undefined') {
        
        // Check if there are URL parameters for the calculator
        if (nbacc_calculator_state.hasStateInUrl()) {
            console.log('Calculator parameters detected in URL, initializing calculator with URL state');
            
            // Get state from URL
            const urlState = nbacc_calculator_state.getStateFromUrl();
            
            // Initialize calculator UI with the URL state
            // State will be loaded in the nbacc_calculator_ui.initUI() function
        }
    }
});

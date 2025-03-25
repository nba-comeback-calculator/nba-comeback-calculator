/**
 * nbacc_calculator_init.js
 * Initialization script for the NBA Comeback Calculator
 * This script is responsible for initializing the calculator with URL parameters if present
 */

/**
 * Find a suitable calculator div in the page
 * @returns {HTMLElement|null} The calculator div or null if not found
 */
function findCalculatorDiv() {
    // First try to find any div with the nbacc-calculator class
    const calculatorDivs = document.querySelectorAll('.nbacc-calculator');
    if (calculatorDivs.length > 0) {
        console.log(`Found calculator div with ID: ${calculatorDivs[0].id}`);
        return calculatorDivs[0];
    }
    
    // Then try the standard calculator div
    const standardDiv = document.getElementById("nbacc_calculator");
    if (standardDiv) {
        console.log("Found standard calculator div");
        return standardDiv;
    }
    
    console.error("No calculator div found in the page");
    return null;
}

/**
 * Initialize the calculator when the DOM is ready
 */
function initializeCalculator() {
    console.log('Initializing calculator...');
    
    // Check if required modules are loaded
    if (typeof nbacc_calculator_state === 'undefined' || 
        typeof nbacc_calculator_ui === 'undefined') {
        console.error("Required modules not loaded: nbacc_calculator_state or nbacc_calculator_ui");
        return;
    }
    
    try {
        // Check if there are URL parameters
        if (nbacc_calculator_state.hasStateInUrl()) {
            console.log('URL parameters detected, processing...');
            
            // Find a suitable calculator div
            const calculatorDiv = findCalculatorDiv();
            if (!calculatorDiv) return;
            
            // Get state from URL
            const urlState = nbacc_calculator_state.getStateFromUrl();
            
            if (urlState) {
                console.log('Successfully parsed URL state');
                
                // Wait for DOM to be ready
                setTimeout(function() {
                    try {
                        // Apply state to calculator
                        if (typeof nbacc_calculator_ui.applyState === 'function') {
                            nbacc_calculator_ui.applyState(urlState);
                        }
                        
                        // If this is a custom calculator div, set targetChartId
                        if (calculatorDiv.id !== "nbacc_calculator" && calculatorDiv.classList.contains("nbacc-calculator")) {
                            console.log(`Found nbacc-calculator div: ${calculatorDiv.id}`);
                            // If there's a getState/applyState method, use it
                            if (typeof nbacc_calculator_ui.getState === 'function' && 
                                typeof nbacc_calculator_ui.applyState === 'function') {
                                const state = nbacc_calculator_ui.getState();
                                state.targetChartId = calculatorDiv.id;
                                nbacc_calculator_ui.applyState(state);
                            }
                            
                            // Render in target div if method exists
                            if (typeof nbacc_calculator_ui.calculateAndRenderChartForTarget === 'function') {
                                nbacc_calculator_ui.calculateAndRenderChartForTarget(calculatorDiv.id);
                            }
                        } else {
                            // Render in standard calculator
                            console.log("Rendering in standard calculator");
                            nbacc_calculator_ui.calculateAndRenderChart();
                        }
                    } catch (error) {
                        console.error('Error rendering chart:', error);
                    }
                }, 500);
            } else {
                console.error('Failed to parse URL parameters');
            }
        } else {
            console.log('No calculator parameters in URL');
        }
    } catch (error) {
        console.error('Error initializing calculator:', error);
    }
}

// First try on DOM ready event
document.addEventListener('DOMContentLoaded', initializeCalculator);

// Also try after window.load as a backup
window.addEventListener('load', function() {
    // Only re-initialize if chart is not yet rendered
    const hasChart = document.getElementById("nbacc_calculator_chart");
    const hasTarget = document.querySelector('.nbacc-calculator canvas');
    if (!hasChart && !hasTarget && typeof nbacc_calculator_state !== 'undefined' && 
        nbacc_calculator_state.hasStateInUrl()) {
        console.log('Trying initialization again after window load');
        initializeCalculator();
    }
});

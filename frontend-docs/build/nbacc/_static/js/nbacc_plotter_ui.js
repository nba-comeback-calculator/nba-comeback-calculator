/**
 * nbacc_plotter_ui.js
 * 
 * UI controls and interactions for NBA charts. This file contains:
 * - Chart control buttons (full screen, reset zoom, save as PNG)
 * - Full screen mode handling with BasicLightbox integration
 * - Device-specific UI adjustments for mobile and desktop
 * - Button creation and positioning
 * 
 * This module manages all user interface elements and interactions for
 * the chart visualization system.
 */

const fullscreenContent =
    '<div id="lightbox-chart-container" class="lightbox-chart"></div>';
var lightboxInstance = basicLightbox.create(fullscreenContent, {
    closable: false,
    className: "nba-fullscreen-lightbox", // Add custom class for styling
});

/**
 * Creates a button container for chart controls
 * @returns {HTMLElement} The created button container
 */
function createChartButtonContainer() {
    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "chart-buttons";

    // Set initial styles
    buttonContainer.style.position = "absolute"; // Ensure absolute positioning
    buttonContainer.style.opacity = "0"; // Start invisible to avoid flashing
    buttonContainer.style.display = "flex"; // Ensure flex display
    buttonContainer.style.margin = "0"; // No margin
    buttonContainer.style.padding = "0"; // No padding

    return buttonContainer;
}

// Function to create and add controls to the chart area
function addControlsToChartArea(canvas, chart) {
    // Create button container
    const buttonContainer = createChartButtonContainer();

    // FULL_SCREEN_FUNCTIONS - Full screen and exit full screen functionality for all devices including mobile
    // Add Full Screen button for all devices
    const fullScreenButton = createChartButton(
        "full-screen-btn",
        "full-screen-icon",
        "Full Screen"
    );
    fullScreenButton.setAttribute("data-fullscreen", "false"); // Track state

    /**
     * Enters fullscreen mode for the chart
     * @param {Event} event - The triggering event
     */
    function fullscreen(event) {
        chartJsToolTipClearer(event);

        // Disable page scrolling
        document.body.style.overflow = "hidden";

        // Show lightbox
        lightboxInstance.show();

        // Prepare chart for fullscreen
        prepareChartForFullscreen(chart);

        // Apply fullscreen dimensions based on device
        const chartContainer = chart.canvas.parentElement;
        applyFullscreenDimensions(chart, chartContainer);

        // Configure mobile-specific settings
        if (isMobile()) {
            configureMobileFullscreen(chart);
        }

        // Resize chart to fit new container
        chart.resize();

        // Update button state
        updateFullscreenButton(fullScreenButton, exitFullScreen);

        // Reposition buttons
        repositionFullscreenButtons(chart);
    }

    /**
     * Prepares a chart for fullscreen mode
     * @param {Chart} chart - The Chart.js instance
     */
    function prepareChartForFullscreen(chart) {
        // Get the lightbox container
        const lightboxContent = document.getElementById("lightbox-chart-container");

        // Store original parent before moving
        var mainChartDiv = chart.canvas.parentElement.parentElement.parentElement;
        chart.mainChartDiv = mainChartDiv;

        // Store original dimensions to restore them later
        const chartContainer = chart.canvas.parentElement;
        chart.originalWidth = chartContainer.style.width;
        chart.originalHeight = chartContainer.style.height;
        chart.originalMaxWidth = chartContainer.style.maxWidth;
        chart.originalMaxHeight = chartContainer.style.maxHeight;

        // Move the canvas to lightbox
        var parentChartDiv = chart.canvas.parentElement.parentElement;
        chart.parentChartDiv = parentChartDiv;
        lightboxContent.appendChild(parentChartDiv);
    }

    /**
     * Applies fullscreen dimensions to the chart container
     * @param {Chart} chart - The Chart.js instance
     * @param {HTMLElement} chartContainer - The chart container element
     */
    function applyFullscreenDimensions(chart, chartContainer) {
        if (isMobile()) {
            // Mobile dimensions
            chartContainer.style.width = "98%";
            chartContainer.style.height = "85vh";
            chartContainer.style.maxWidth = "98%";
            chartContainer.style.maxHeight = "85vh";

            // Disable normal page pinch-zoom
            document.body.style.touchAction = "none";
            chartContainer.style.touchAction = "none";
        } else {
            // Desktop dimensions
            chartContainer.style.width = "95%";
            chartContainer.style.height = "90vh";
            chartContainer.style.maxWidth = "95%";
            chartContainer.style.maxHeight = "90vh";
        }
    }

    /**
     * Configures mobile-specific settings for fullscreen mode
     * @param {Chart} chart - The Chart.js instance
     */
    function configureMobileFullscreen(chart) {
        // Only proceed if we have zoom plugin options
        if (!chart.options.plugins || !chart.options.plugins.zoom) return;

        // Enable zoom and pan options
        chart.options.plugins.zoom.zoom.drag.enabled = true;
        chart.options.plugins.zoom.zoom.pinch.enabled = true;
        chart.options.plugins.zoom.pan.enabled = true;

        // Add reset zoom button if needed
        addMobileResetZoomButton(chart);

        // Enable win count display and tooltips
        chart.isFullscreen = true;

        // Clear any existing tooltip
        clearExistingTooltip();

        // Apply changes
        chart.update();
    }

    /**
     * Adds reset zoom button for mobile fullscreen mode
     * @param {Chart} chart - The Chart.js instance
     */
    function addMobileResetZoomButton(chart) {
        const buttonContainer = chart.parentChartDiv.querySelector(".chart-buttons");
        if (!buttonContainer || buttonContainer.querySelector(".reset-zoom-btn"))
            return;

        // Create reset zoom button
        const resetButton = createChartButton(
            "reset-zoom-btn",
            "zoom-reset-icon",
            "Reset Zoom",
            function (e) {
                chartJsToolTipClearer(e);
                chart.resetZoom();
                return false;
            }
        );

        // Insert before the save button
        const saveButton = buttonContainer.querySelector(".save-png-btn");
        if (saveButton) {
            buttonContainer.insertBefore(resetButton, saveButton);
        } else {
            buttonContainer.appendChild(resetButton);
        }
    }

    /**
     * Clears any existing tooltips
     */
    function clearExistingTooltip() {
        const tooltipEl = document.getElementById("chartjs-tooltip");
        if (tooltipEl) {
            tooltipEl.style.opacity = 0;
            tooltipEl.innerHTML = "<table></table>";
        }
    }

    /**
     * Updates fullscreen button appearance and behavior
     * @param {HTMLElement} button - The fullscreen button
     * @param {Function} exitHandler - The exit fullscreen handler function
     */
    function updateFullscreenButton(button, exitHandler) {
        button.innerHTML = '<i class="chart-icon exit-full-screen-icon"></i>';
        button.setAttribute("data-tooltip", "Exit Full Screen");
        button.setAttribute("data-fullscreen", "true");
        button.onclick = exitHandler;
    }

    /**
     * Repositions buttons in fullscreen mode
     * @param {Chart} chart - The Chart.js instance
     */
    function repositionFullscreenButtons(chart) {
        // Hide the buttons before repositioning
        const buttonContainer = chart.parentChartDiv.querySelector(".chart-buttons");
        if (buttonContainer) {
            buttonContainer.style.opacity = "0";
        }

        // Update button positions with a delay
        setTimeout(() => {
            updateButtonPositions(chart);
        }, 50);
    }

    /**
     * Exits fullscreen mode and restores the chart to its original state
     * @param {Event} event - The triggering event
     */
    function exitFullScreen(event) {
        chartJsToolTipClearer(event);

        // Re-enable page scrolling
        document.body.style.overflow = "";

        // Reset zoom and update chart
        chart.resetZoom();

        // Handle device-specific exit actions
        if (isMobile()) {
            exitMobileFullscreen(chart);
        } else {
            // For desktop, ensure the chart is updated after zoom reset
            if (chart.options.plugins && chart.options.plugins.zoom) {
                chart.update();
            }
        }

        // Restore chart to original state
        restoreChartFromFullscreen(chart, fullScreenButton);

        // Reposition buttons
        repositionFullscreenButtons(chart);
    }

    /**
     * Handles mobile-specific tasks when exiting fullscreen
     * @param {Chart} chart - The Chart.js instance
     */
    function exitMobileFullscreen(chart) {
        if (!chart.options.plugins || !chart.options.plugins.zoom) return;

        // Re-enable normal page pinch-zoom by resetting touch-action
        document.body.style.touchAction = "";
        const chartContainer = chart.canvas.parentElement;
        chartContainer.style.touchAction = "";

        // Disable zooming on mobile
        chart.options.plugins.zoom.zoom.drag.enabled = false;
        chart.options.plugins.zoom.zoom.pinch.enabled = false;
        chart.options.plugins.zoom.pan.enabled = false;

        // Remove reset zoom button if it exists
        removeMobileResetZoomButton(chart);

        // Remove the fullscreen flag to disable win count numbers and tooltips
        chart.isFullscreen = false;

        // Hide any visible tooltips
        clearExistingTooltip();

        // Update the chart to reflect these changes
        chart.update();
    }

    /**
     * Removes the reset zoom button added for mobile fullscreen
     * @param {Chart} chart - The Chart.js instance
     */
    function removeMobileResetZoomButton(chart) {
        const buttonContainer = chart.parentChartDiv.querySelector(".chart-buttons");
        if (buttonContainer) {
            const resetButton = buttonContainer.querySelector(".reset-zoom-btn");
            if (resetButton) {
                buttonContainer.removeChild(resetButton);
            }
        }
    }

    /**
     * Restores chart to its original state after exiting fullscreen
     * @param {Chart} chart - The Chart.js instance
     * @param {HTMLElement} fullScreenButton - The fullscreen toggle button
     */
    function restoreChartFromFullscreen(chart, fullScreenButton) {
        // Update button appearance
        fullScreenButton.innerHTML = '<i class="chart-icon full-screen-icon"></i>';
        fullScreenButton.setAttribute("data-tooltip", "Full Screen");
        fullScreenButton.setAttribute("data-fullscreen", "false");
        fullScreenButton.onclick = fullscreen;

        // Close lightbox
        lightboxInstance.close();

        // Restore chart to original parent
        chart.mainChartDiv.appendChild(chart.parentChartDiv);

        // Restore original dimensions
        const chartContainer = chart.canvas.parentElement;
        chartContainer.style.width = chart.originalWidth || "";
        chartContainer.style.height = chart.originalHeight || "";
        chartContainer.style.maxWidth = chart.originalMaxWidth || "";
        chartContainer.style.maxHeight = chart.originalMaxHeight || "";

        // Resize chart to fit original container
        chart.resize();
    }

    fullScreenButton.onclick = fullscreen;

    // Setup ESC key handler
    const handleEscKey = function (e) {
        if (e.key === "Escape" && lightboxInstance) {
            // Make sure we call exitFullScreen to properly restore scrolling
            exitFullScreen(e);
            document.removeEventListener("keydown", handleEscKey);
        }
    };

    document.addEventListener("keydown", handleEscKey);

    buttonContainer.appendChild(fullScreenButton);

    // Add Reset Zoom button with icon - only for non-mobile
    if (!isMobile()) {
        // Use our utility function to create the reset zoom button
        const resetButton = createChartButton(
            "reset-zoom-btn",
            "zoom-reset-icon",
            "Reset Zoom",
            function (event) {
                chartJsToolTipClearer(event);
                chart.resetZoom();
                return false;
            }
        );
        buttonContainer.appendChild(resetButton);
    }

    // Add Save As PNG button with icon
    const saveButton = createChartButton(
        "save-png-btn",
        "save-png-icon",
        "Save as PNG",
        function (event) {
            chartJsToolTipClearer(event);
            const chartId = canvas.id.replace("-canvas", "");
            saveChart(canvas);
            return false;
        }
    );
    buttonContainer.appendChild(saveButton);

    // Add the button container to the chart container
    const chartContainer = canvas.parentElement;
    chartContainer.appendChild(buttonContainer);

    // Set initial styles - positioning will be handled by updateButtonPositions
    buttonContainer.style.position = "absolute";
    buttonContainer.style.zIndex = "10"; // Ensure buttons are above chart
    buttonContainer.style.display = "flex"; // Always use flex display
    buttonContainer.style.alignItems = "center"; // Vertically center buttons
    buttonContainer.style.filter = "drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"; // Add shadow for visibility
    buttonContainer.style.opacity = "0"; // Start invisible and fade in with updateButtonPositions

    // Prevent text selection on buttons
    buttonContainer.style.userSelect = "none";

    // Wait for the chart to be fully rendered before positioning
    setTimeout(() => {
        updateButtonPositions(chart);
    }, 100);

    // Also update button positions whenever the window is resized
    window.addEventListener("resize", () => {
        updateButtonPositions(chart);
    });
}
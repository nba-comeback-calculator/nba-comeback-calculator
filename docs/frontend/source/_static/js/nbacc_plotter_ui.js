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

// Use the module pattern for proper namespacing
nbacc_plotter_ui = (() => {
    const fullscreenContent =
        '<div id="lightbox-chart-container" class="lightbox-chart"></div>';
    var lightboxInstance = basicLightbox.create(fullscreenContent, {
        closable: false,
        className: "nba-fullscreen-lightbox", // Add custom class for styling
    });

    // Global variable to track which chart is currently in fullscreen mode
    var currentFullscreenChart = null;

    /**
     * Clears any existing tooltips - local wrapper for nbacc_utils.clearTooltipContent
     */
    function clearTooltip() {
        nbacc_utils.clearTooltipContent();
    }

    // Forward declarations
    let fullscreen;

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

        // Clear any existing tooltip
        clearTooltip();

        // Apply changes
        chart.update();

        // Enable win count display and tooltips
        chart.isFullscreen = true;
        chart.isFullscreenTooltips = false;
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
        const resetButton = nbacc_utils.createChartButton(
            "reset-zoom-btn",
            "zoom-reset-icon",
            "Reset Zoom",
            function (e) {
                nbacc_utils.chartJsToolTipClearer(e);
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
        if (nbacc_utils.isMobile()) {
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
     * Enters fullscreen mode for the chart
     * This is a higher-order function that returns the actual fullscreen handler
     * to capture the chart and button context
     */
    fullscreen = function (chart, fullScreenButton) {
        return function (event) {
            nbacc_utils.chartJsToolTipClearer(event);

            // First, preemptively hide all configure buttons to prevent flashing
            const allConfigButtons = document.querySelectorAll(".configure-chart-btn");
            allConfigButtons.forEach((button) => {
                button.classList.add("configure-chart-btn-disabled");
                button.disabled = true;
                button.style.opacity = "0";
                button.style.visibility = "hidden";
                button.style.display = "none";
            });

            // Disable page scrolling
            document.body.style.overflow = "hidden";

            // Get the latest chart instance in case it's been recreated
            const chartId = chart.canvas.id;
            if (chartId) {
                const latestChart = Chart.getChart(chartId) || chart;
                chart = latestChart;
            }

            // Store the current chart in our global variable for access by ESC key handler
            currentFullscreenChart = chart;

            // Show lightbox
            lightboxInstance.show();

            // Prepare chart for fullscreen
            prepareChartForFullscreen(chart);

            // Apply fullscreen dimensions based on device
            const chartContainer = chart.canvas.parentElement;
            applyFullscreenDimensions(chart, chartContainer);

            // Configure mobile-specific settings
            if (nbacc_utils.isMobile()) {
                configureMobileFullscreen(chart);
            }

            // Resize chart to fit new container
            chart.resize();

            // Update button state
            updateFullscreenButton(fullScreenButton, nbacc_plotter_ui.exitFullScreen);

            // Reposition buttons
            repositionFullscreenButtons(chart);

            // Disable configure button when in fullscreen mode
            const configureButtons = document.querySelectorAll(".configure-chart-btn");
            configureButtons.forEach((button) => {
                button.classList.add("configure-chart-btn-disabled");
                button.disabled = true;
                // Explicitly set style properties to ensure it's hidden
                button.style.opacity = "0";
                button.style.visibility = "hidden";
                button.style.display = "none";
            });

            // Double check after a short delay to ensure configure buttons stay hidden
            setTimeout(() => {
                const configureButtonsCheck =
                    document.querySelectorAll(".configure-chart-btn");
                configureButtonsCheck.forEach((button) => {
                    button.classList.add("configure-chart-btn-disabled");
                    button.disabled = true;
                    button.style.opacity = "0";
                    button.style.visibility = "hidden";
                    button.style.display = "none";
                });
            }, 10);

            chart.isFullscreenTooltips = true;
        };
    };

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
        chart.isFullscreenTooltips = false;

        // Hide any visible tooltips
        clearTooltip();

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
        if (!chart || !fullScreenButton) {
            console.error(
                "Missing chart or fullScreenButton in restoreChartFromFullscreen"
            );
            return;
        }

        try {
            // Update button appearance
            fullScreenButton.innerHTML = '<i class="chart-icon full-screen-icon"></i>';
            fullScreenButton.setAttribute("data-tooltip", "Full Screen");
            fullScreenButton.setAttribute("data-fullscreen", "false");

            // Set button click handler back to fullscreen mode
            fullScreenButton.onclick = fullscreen(chart, fullScreenButton);

            // Close lightbox
            lightboxInstance.close();

            // Ensure we have mainChartDiv before attempting to restore
            if (chart.mainChartDiv && chart.parentChartDiv) {
                // Restore chart to original parent
                chart.mainChartDiv.appendChild(chart.parentChartDiv);
            } else {
                console.error("Missing parentChartDiv or mainChartDiv reference");
            }

            // Restore original dimensions if they exist
            const chartContainer = chart.canvas ? chart.canvas.parentElement : null;
            if (chartContainer) {
                chartContainer.style.width = chart.originalWidth || "";
                chartContainer.style.height = chart.originalHeight || "";
                chartContainer.style.maxWidth = chart.originalMaxWidth || "";
                chartContainer.style.maxHeight = chart.originalMaxHeight || "";

                // Resize chart to fit original container
                chart.resize();
            }
        } catch (error) {
            console.error("Error in restoreChartFromFullscreen:", error);
        }
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
            window.updateButtonPositions(chart); // Global function from nbacc_plotter_plugins.js
        }, 50);
    }

    /**
     * Exits fullscreen mode and restores the chart to its original state
     * @param {Event} event - The triggering event
     */
    function exitFullScreen(event) {
        if (event) {
            nbacc_utils.chartJsToolTipClearer(event);
        }

        // Re-enable page scrolling
        document.body.style.overflow = "";

        // Use our global tracking variable to get the current fullscreen chart
        if (!currentFullscreenChart) {
            console.error("No chart in fullscreen mode found");
            // Try to cleanly hide the lightbox anyway
            if (lightboxInstance && lightboxInstance.visible()) {
                lightboxInstance.close();
            }
            return;
        }

        // Get a reference to the current chart
        const chartToRestore = currentFullscreenChart;

        try {
            // Reset zoom and update chart if chart still exists
            if (
                chartToRestore.resetZoom &&
                typeof chartToRestore.resetZoom === "function"
            ) {
                chartToRestore.resetZoom();
            }

            // Handle device-specific exit actions
            if (nbacc_utils.isMobile()) {
                exitMobileFullscreen(chartToRestore);
            } else {
                // For desktop, ensure the chart is updated after zoom reset
                if (chartToRestore.options?.plugins?.zoom && chartToRestore.update) {
                    chartToRestore.update();
                }
            }

            // Check for full screen button, especially for calculator charts
            if (!chartToRestore.fullScreenButton) {
                // Try to find the button directly from canvas
                const buttonContainer =
                    chartToRestore.canvas?.parentElement?.querySelector(
                        ".chart-buttons"
                    );
                if (buttonContainer) {
                    chartToRestore.fullScreenButton =
                        buttonContainer.querySelector(".full-screen-btn");
                }
            }

            // Restore chart to original state
            restoreChartFromFullscreen(chartToRestore, chartToRestore.fullScreenButton);

            // Reposition buttons
            repositionFullscreenButtons(chartToRestore);

            // Re-enable configure button when exiting fullscreen mode
            const configureButtons = document.querySelectorAll(".configure-chart-btn");
            configureButtons.forEach((button) => {
                button.classList.remove("configure-chart-btn-disabled");
                button.disabled = false;
            });

            // Double-check after a short delay to ensure configure buttons are fully restored
            setTimeout(() => {
                const configureButtonsCheck =
                    document.querySelectorAll(".configure-chart-btn");
                configureButtonsCheck.forEach((button) => {
                    button.classList.remove("configure-chart-btn-disabled");
                    button.disabled = false;
                    button.style.opacity = "1";
                    button.style.visibility = "visible";
                    button.style.display = "flex";
                });
            }, 100);

            // For calculator charts, do extra validation of button state
            if (
                chartToRestore.canvas?.id === "nbacc_calculator_chart" ||
                chartToRestore.canvas?.id?.endsWith("-canvas")
            ) {
                // Find all full screen buttons for this chart and reset them
                const canvas = chartToRestore.canvas;
                const container = canvas?.parentElement;
                if (container) {
                    const allButtons = container.querySelectorAll(".full-screen-btn");
                    allButtons.forEach((button) => {
                        button.innerHTML =
                            '<i class="chart-icon full-screen-icon"></i>';
                        button.setAttribute("data-tooltip", "Full Screen");
                        button.setAttribute("data-fullscreen", "false");
                        button.onclick = fullscreen(chartToRestore, button);
                    });
                }
            }
        } catch (error) {
            console.error("Error during exit fullscreen:", error);
            // Try to clean up anyway
            if (lightboxInstance && lightboxInstance.visible()) {
                lightboxInstance.close();
            }
        } finally {
            // Always clear the global tracking variable
            currentFullscreenChart = null;
        }
    }

    // Setup global ESC key handler for non-mobile devices only
    document.addEventListener("keydown", function (e) {
        // Only handle ESC key in fullscreen mode on non-mobile devices
        if (
            e.key === "Escape" &&
            lightboxInstance &&
            lightboxInstance.visible() &&
            !nbacc_utils.isMobile()
        ) {
            // Use exitFullScreen function to properly exit fullscreen mode
            if (
                typeof nbacc_plotter_ui !== "undefined" &&
                typeof nbacc_plotter_ui.exitFullScreen === "function"
            ) {
                nbacc_plotter_ui.exitFullScreen(e);
            } else {
                // Fallback to just closing the lightbox if something goes wrong
                lightboxInstance.close();
                document.body.style.overflow = "";
                currentFullscreenChart = null;
            }
        }
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
        // First check if canvas and chart exist
        if (!canvas || !chart) {
            // This console logging is no longer needed because features are working fine
            // console.warn("Cannot add controls to chart area: canvas or chart is null");
            return; // Exit early if required parameters are missing
        }

        // Create button container
        const buttonContainer = createChartButtonContainer();

        // FULL_SCREEN_FUNCTIONS - Full screen and exit full screen functionality for all devices including mobile
        // Add Full Screen button for all devices
        const fullScreenButton = nbacc_utils.createChartButton(
            "full-screen-btn",
            "full-screen-icon",
            "Full Screen"
        );
        fullScreenButton.setAttribute("data-fullscreen", "false"); // Track state

        // Store a reference to the fullScreenButton on the chart object so we can find it later
        chart.fullScreenButton = fullScreenButton;

        // All fullscreen-related functions moved to top-level scope

        // All fullscreen-related functions moved to top-level scope

        // All fullscreen-related functions moved to top-level scope

        // All fullscreen-related functions moved to top-level scope

        // All fullscreen-related functions moved to top-level scope

        // restoreChartFromFullscreen function moved to top-level scope

        fullScreenButton.onclick = fullscreen(chart, fullScreenButton);

        buttonContainer.appendChild(fullScreenButton);

        // Add Reset Zoom button with icon - only for non-mobile
        if (!nbacc_utils.isMobile()) {
            // Use our utility function to create the reset zoom button
            const resetButton = nbacc_utils.createChartButton(
                "reset-zoom-btn",
                "zoom-reset-icon",
                "Reset Zoom",
                function (event) {
                    nbacc_utils.chartJsToolTipClearer(event);
                    chart.resetZoom();
                    return false;
                }
            );
            buttonContainer.appendChild(resetButton);
        }

        // Add Save As PNG button with icon
        const saveButton = nbacc_utils.createChartButton(
            "save-png-btn",
            "save-png-icon",
            "Save as PNG",
            function (event) {
                nbacc_utils.chartJsToolTipClearer(event);
                const chartId = canvas.id.replace("-canvas", "");
                window.saveChart(canvas); // Global function from nbacc_saveas_image_dialog.js
                return false;
            }
        );
        buttonContainer.appendChild(saveButton);

        // Add the button container to the chart container
        const chartContainer = canvas?.parentElement;

        // Check if chartContainer exists before appending
        if (!chartContainer) {
            // This console logging is no longer needed because features are working fine
            // console.warn("Cannot add controls to chart area: chart container not found");
            return; // Exit early if no container is found
        }

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

        // Initial positioning in case updateButtonPositions fails
        buttonContainer.style.right = "20px";
        buttonContainer.style.bottom = "10px";

        // Wait for the chart to be fully rendered before positioning
        setTimeout(() => {
            window.updateButtonPositions(chart); // Global function from nbacc_plotter_plugins.js
        }, 100);

        // Double-check positioning after a longer delay to ensure proper placement
        setTimeout(() => {
            window.updateButtonPositions(chart);
        }, 500);

        // Also update button positions whenever the window is resized
        window.addEventListener("resize", () => {
            window.updateButtonPositions(chart); // Global function from nbacc_plotter_plugins.js
        });
    }

    // Export public functions and variables
    return {
        addControlsToChartArea: addControlsToChartArea,
        exitFullScreen: exitFullScreen,
        // Make the current fullscreen chart accessible to other modules if needed
        getCurrentFullscreenChart: function () {
            return currentFullscreenChart;
        },
    };
})(); // End of module pattern

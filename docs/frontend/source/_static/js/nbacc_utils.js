/**
 * nbacc_utils.js
 *
 * Utility functions for NBA charts
 */

// Use a module pattern to avoid polluting the global namespace
// But also make it available globally for other modules
const nbacc_utils = (() => {
    /* SET THIS FIRST */
    // Get the static directory path from chart_loader
    var staticDir = "/_static";
    
    // Configuration for chart loading behavior
    // If true, all charts load immediately; if false, charts load when scrolled into viewport
    var __LOAD_CHART_ON_PAGE_LOAD__ = true;
    
    // Configuration for mobile tooltip behavior
    // If true, tooltips will show on click even when not in fullscreen mode on mobile
    // If false (default), tooltips on mobile only appear in fullscreen mode
    var __HOVER_PLOTS_ON_CLICK_ON_MOBILE_NOT_FULLSCREEN__ = false;
    
    // Controls whether to use localStorage for caching data
    // Set to false to disable caching (e.g., for development)
    var __USE_LOCAL_STORAGE_CACHE__ = true;
    
    // Controls whether to use server file timestamps for cache validation instead of fixed expiration
    var __USE_SERVER_TIMESTAMPS__ = true;
    
    // Maximum cache age in milliseconds (1 hour for now, will be increased to 1 day later)
    // 1 hour = 60 * 60 * 1000 = 3,600,000 ms
    // Only used if __USE_SERVER_TIMESTAMPS__ is false
    var __MAX_CACHE_AGE_MS__ = 1 * 60 * 60 * 1000;

    /**
     * Reads and decompresses a gzipped JSON file from a URL or Response object
     * @param {string|Response} urlOrResponse - The URL of the gzipped JSON file or a Response object
     * @returns {Promise<object>} - The decompressed and parsed JSON data
     */
    async function readGzJson(urlOrResponse) {
        try {
            let response;
            if (typeof urlOrResponse === 'string') {
                // If a URL string is provided, fetch it
                response = await fetch(urlOrResponse);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else if (urlOrResponse instanceof Response) {
                // If it's already a Response object, use it directly
                response = urlOrResponse;
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Check if the body has already been read
                if (response.bodyUsed) {
                    // If the body has been consumed, we need to fetch the URL again
                    const responseUrl = response.url;
                    if (!responseUrl) {
                        throw new Error('Response body has been consumed and URL is not available');
                    }
                    response = await fetch(responseUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                }
            } else {
                throw new Error('Invalid parameter: must be a URL string or Response object');
            }
            
            // Try the standard approach first
            try {
                const buffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(buffer);
                
                const decompressed = pako.inflate(uint8Array, { to: "string" });
                const jsonData = JSON.parse(decompressed);
                return jsonData;
            } catch (inflateError) {
                console.warn("Standard decompression failed, trying alternative approach:", inflateError);
                
                // Fallback: Try the base64 approach from StackOverflow
                try {
                    // Get the response as text (which might be base64)
                    const responseText = await response.text();
                    
                    // Convert base64 to binary string if it looks like base64
                    // (just a simple heuristic - check if it's mostly alphanumeric plus +/)
                    const isLikelyBase64 = /^[A-Za-z0-9+/=]+$/.test(responseText.substring(0, 100));
                    
                    let binaryString;
                    if (isLikelyBase64) {
                        try {
                            binaryString = atob(responseText);
                        } catch (e) {
                            // Not valid base64, use the original
                            binaryString = responseText;
                        }
                    } else {
                        binaryString = responseText;
                    }
                    
                    // Convert binary string to Uint8Array
                    const charData = new Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        charData[i] = binaryString.charCodeAt(i);
                    }
                    
                    const altUint8Array = new Uint8Array(charData);
                    
                    // Try to inflate
                    const altDecompressed = pako.inflate(altUint8Array, { to: "string" });
                    const altJsonData = JSON.parse(altDecompressed);
                    return altJsonData;
                } catch (altError) {
                    console.error("Alternative decompression approach also failed:", altError);
                    throw new Error(`Failed to decompress gzipped JSON: ${inflateError.message}; Alternative method also failed: ${altError.message}`);
                }
            }
        } catch (error) {
            console.error("Error reading or parsing gzipped JSON:", error);
            throw error;
        }
    }
    function normalPPF(sigma) {
        // Ensure sigma is within the valid range (0 to 1)
        sigma = Math.max(0, Math.min(sigma, 1));

        // Calculate the inverse of the error function
        function inverseErf(x) {
            const a = 0.147;
            return Math.sign(x) * Math.sqrt(Math.log(1 - x * x) / -2 + a * x * x);
        }

        // Calculate the PPF using the inverse error function
        const ppfValue = 0.5 * (1 + inverseErf(2 * sigma - 1));

        return ppfValue;
    }

    /**
     * Calculate the cumulative distribution function (CDF) of the normal distribution.
     * This gives the probability that a random variable with normal distribution
     * will be found at a value less than or equal to x.
     *
     * @param {number} x - The value to calculate the CDF at
     * @param {number} [mean=0] - The mean of the normal distribution (default: 0)
     * @param {number} [std=1.0] - The standard deviation of the normal distribution (default: 1.0)
     * @returns {number} - The probability (between 0 and 1)
     */
    function normalCDF(x, mean = 0, std = 1.0) {
        const z = (x - mean) / std;
        const t = 1 / (1 + 0.2315419 * Math.abs(z));
        const d = 0.3989423 * Math.exp((-z * z) / 2);
        let prob =
            d *
            t *
            (0.3193815 +
                t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if (z > 0) {
            prob = 1 - prob;
        }
        return prob;
    }

    // Function to completely clean up tooltip content and reset state
    function clearTooltipContent() {
        const tooltipEl = document.getElementById("chartjs-tooltip");
        if (tooltipEl) {
            tooltipEl.style.opacity = 0;
            tooltipEl.setAttribute("data-sticky", "false");

            // Completely replace the table to remove all event listeners
            const oldTable = tooltipEl.querySelector("table");
            if (oldTable) {
                tooltipEl.removeChild(oldTable);
                const newTable = document.createElement("table");
                tooltipEl.appendChild(newTable);
            }

            // Reset cursor
            document.body.style.cursor = "default";
        }
    }

    function chartJsToolTipClearer(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        // Force clear any lingering tooltip completely
        // Use our comprehensive cleanup function
        if (typeof clearTooltipContent === "function") {
            clearTooltipContent();
        } else {
            throw new Error("AssertionError");
        }
    }

    /**
     * Formats a date string from YYYY-MM-DD to MM/DD/YYYY format
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {string} Formatted date in MM/DD/YYYY format or the original string if invalid
     */
    function formatGameDate(dateString) {
        if (!dateString) return "";

        const dateParts = dateString.split("-");
        if (dateParts.length === 3) {
            return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]} `;
        }
        return `${dateString} `;
    }

    /**
     * Creates a game link element with proper handling for mobile/desktop
     * @param {Object} game - The game object containing game_id and other properties
     * @param {boolean} isMobileDevice - Whether the current device is mobile
     * @param {string} gameFontSize - The font size to use for the game link
     * @returns {string} HTML string for the game link
     */
    function createGameLink(game, isMobileDevice, gameFontSize) {
        const gameUrl = `http://www.nba.com/game/${game.game_id}`;
        const formattedDate = formatGameDate(game.game_date);

        if (isMobileDevice) {
            return `<tr><td class="game-link">
            <a href="javascript:void(0);" onclick="window.location.href='${gameUrl}'; return false;" data-nba-game="${game.game_id}">
            ${formattedDate}${game.game_summary}</a></td></tr>`;
        } else {
            return `<tr><td class="game-link">
            <a href="${gameUrl}">
            ${formattedDate}${game.game_summary}</a></td></tr>`;
        }
    }

    /**
     * Renders a list of game examples with proper formatting
     * @param {Array} games - Array of game objects to display
     * @param {string} headerText - Header text to display above the games (e.g., "Win examples:")
     * @param {number} limit - Maximum number of games to display
     * @param {boolean} isMobileDevice - Whether the current device is mobile
     * @param {string} gameFontSize - The font size to use for the game links
     * @param {number} totalCount - Total count of games (win_count or loss_count) for "more" text
     * @returns {string} HTML string for the game examples
     */
    function renderGameExamples(
        games,
        headerText,
        limit,
        isMobileDevice,
        gameFontSize,
        totalCount
    ) {
        if (!games || games.length === 0) return "";

        let html = `<tr><td class="header-text"><b>${headerText}</b></td></tr>`;

        // Use the appropriate limit based on the game type (wins vs losses)
        const actualLimit = headerText.toLowerCase().includes("loss") ? 4 : 10;
        const examples = games.slice(0, actualLimit);
        examples.forEach((game) => {
            html += createGameLink(game, isMobileDevice, gameFontSize);
        });

        // Show "more" text if there are more examples
        // Use totalCount if provided, otherwise fall back to games.length
        const total = totalCount !== undefined ? totalCount : games.length;
        if (total > actualLimit) {
            html += `<tr><td class="more-text">...and ${
                total - actualLimit
            } more</td></tr>`;
        }

        return html;
    }

    /**
     * Creates configuration for chart zoom options
     * @param {function} updateButtonPositionsCallback - Function to call when zoom state changes
     * @returns {object} Zoom configuration object for Chart.js
     */
    function createZoomOptions(updateButtonPositionsCallback) {
        // Default to global updateButtonPositions function if callback not provided
        updateButtonPositionsCallback = updateButtonPositionsCallback || 
            (typeof window.updateButtonPositions === 'function' ? window.updateButtonPositions : function() {});
            
        return {
            zoom: {
                drag: {
                    enabled: !isMobile(), // Disable drag zoom on mobile
                    backgroundColor: "rgba(109, 102, 102, 0.3)",
                    borderColor: "rgba(225,225,225,0.6)",
                    borderWidth: 1,
                    threshold: 10,
                },
                wheel: {
                    enabled: false,
                },
                pinch: {
                    enabled: !isMobile(), // Disable pinch zoom on mobile
                    backgroundColor: "rgba(109, 102, 102, 0.3)",
                    borderColor: "rgba(225,225,225,0.6)",
                    borderWidth: 1,
                    threshold: 10,
                },
                mode: "xy",
                onZoom: function ({ chart }) {
                    // Update buttons during zoom (not just after completion)
                    updateButtonPositionsCallback(chart);
                    
                    // Always try the global function too for better reliability
                    if (typeof window.updateButtonPositions === 'function') {
                        window.updateButtonPositions(chart);
                    }
                },
                onZoomComplete: function ({ chart }) {
                    // Update button positions after zoom
                    updateButtonPositionsCallback(chart);
                    
                    // Always try the global function too for better reliability
                    if (typeof window.updateButtonPositions === 'function') {
                        window.updateButtonPositions(chart);
                    }
                    
                    // Setup a continuous check to ensure buttons stay in position
                    setupContinuousButtonCheck(chart);
                },
            },
            pan: {
                enabled: !isMobile(), // Disable panning on mobile
                mode: "xy",
                threshold: 5, // Minimum distance required before pan is registered
                modifierKey: "shift", // Hold shift key to pan (optional, prevents accidental panning)
                onPan: function ({ chart }) {
                    // Update buttons during panning (not just after completion)
                    updateButtonPositionsCallback(chart);
                    
                    // Always try the global function too for better reliability
                    if (typeof window.updateButtonPositions === 'function') {
                        window.updateButtonPositions(chart);
                    }
                },
                onPanComplete: function ({ chart }) {
                    // Update button positions after panning completes
                    updateButtonPositionsCallback(chart);
                    
                    // Always try the global function too for better reliability
                    if (typeof window.updateButtonPositions === 'function') {
                        window.updateButtonPositions(chart);
                    }
                    
                    // Setup a continuous check to ensure buttons stay in position
                    setupContinuousButtonCheck(chart);
                },
            },
        };
        
        // Helper function to continuously check button position during zoom/pan interactions
        function setupContinuousButtonCheck(chart) {
            // Store the interval ID on the chart to avoid multiple intervals
            if (chart._buttonCheckInterval) {
                clearInterval(chart._buttonCheckInterval);
            }
            
            // Set up interval to continue updating button positions
            chart._buttonCheckInterval = setInterval(() => {
                if (typeof window.updateButtonPositions === 'function') {
                    window.updateButtonPositions(chart);
                }
            }, 100); // Check every 100ms
            
            // Clear the interval after 2 seconds (when user is likely done interacting)
            setTimeout(() => {
                if (chart._buttonCheckInterval) {
                    clearInterval(chart._buttonCheckInterval);
                    chart._buttonCheckInterval = null;
                }
            }, 2000);
        }
    }

    /**
     * Returns an array of colors with the specified opacity for data visualization
     * Each color is carefully chosen to be visually distinct and accessible
     *
     * @param {number} opacity - Opacity value from 0 to 1
     * @returns {Array} Array of RGBA color strings with the specified opacity
     */
    function getColorWheel(opacity) {
        const colorWheel = [
            "rgba(58, 129, 210, 0.5)", // Blue - used for primary datasets
            "rgba(254, 150, 45, 0.5)", // Orange - high contrast with blue
            "rgba(66, 165, 81, 0.5)", // Green - for showing positive trends
            "rgba(255, 99, 132, 0.5)", // Red - for highlighting important data
            "rgba(153, 102, 255, 0.5)", // Purple - complementary to other colors
            "rgba(255, 206, 86, 0.5)", // Yellow - high visibility
            "rgba(199, 199, 199, 0.5)", // Gray - for secondary or less important data
        ];

        // Replace the default opacity (0.5) with the requested opacity
        return colorWheel.map((color) => color.replace(/0\.5\)/, `${opacity})`));
    }

    /**
     * Creates a plot background plugin for Chart.js that adds a subtle background to the chart area
     * @returns {Object} Chart.js plugin object
     */
    function createPlotBackgroundPlugin() {
        return {
            id: "plotBackgroundPlugin",
            beforeDraw: (chart) => {
                const { ctx, chartArea } = chart;
                if (!chartArea) {
                    return;
                }
                // CHART_BACKGROUND_COLOR - Controls the background color and opacity of the plot area
                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.0)"; // Even lighter background - reduced opacity
                ctx.fillRect(
                    chartArea.left,
                    chartArea.top,
                    chartArea.width,
                    chartArea.height
                );

                // Add border around the rectangle
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(187, 187, 187, 0.68)";
                ctx.strokeRect(
                    chartArea.left,
                    chartArea.top,
                    chartArea.width,
                    chartArea.height
                );

                ctx.restore();
            },
        };
    }

    /**
     * Calculate and adjust tooltip position to ensure it's visible on screen
     * Handles dynamic tooltip sizing based on content type
     * @param {Object} tooltipEl - The tooltip DOM element
     * @param {Object} context - The Chart.js context object
     * @param {Object} tooltipModel - The tooltip model
     */
    function calculateTooltipPosition(tooltipEl, context, tooltipModel) {
        // Detect what type of tooltip this is based on content
        const isTrendline = tooltipEl.querySelector(".legend-text") !== null;
        const isScatter = tooltipEl.querySelector(".game-link") !== null;

        // Position and style the tooltip
        const position = context.chart.canvas.getBoundingClientRect();
        const isMobileDevice = isMobile();
        const isFullscreen = context.chart.isFullscreen;

        // Calculate initial position centered on data point
        let centerX = position.left + window.pageXOffset + tooltipModel.caretX;
        let top = position.top + window.pageYOffset + tooltipModel.caretY;

        // Get viewport dimensions
        const viewportWidth = Math.min(
            window.innerWidth,
            document.documentElement.clientWidth
        );
        const viewportHeight = Math.min(
            window.innerHeight,
            document.documentElement.clientHeight
        );

        // Screen padding based on device type
        const isAndroid = /Android/i.test(navigator.userAgent);
        const screenPadding = isAndroid ? 15 : isMobileDevice ? 10 : 5;

        // Make the tooltip visible to measure its content-based size
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = "absolute";
        tooltipEl.style.left = centerX + "px";
        tooltipEl.style.top = top + "px";

        // No need to set special classes anymore - tooltip will size to content

        // Force reflow for measurement
        window.getComputedStyle(tooltipEl).width;

        // Now we can measure the tooltip
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;

        // Calculate left position accounting for the transform: translate(-50%, 0)
        // This centers the tooltip on the data point horizontally
        let left = centerX;

        // Recalculate edges considering the -50% transform
        const leftEdgeAfterTransform = left - tooltipWidth / 2;
        const rightEdgeAfterTransform = left + tooltipWidth / 2;

        // Handle right edge overflow - move tooltip left if needed
        if (rightEdgeAfterTransform > viewportWidth - screenPadding) {
            left = viewportWidth - screenPadding - tooltipWidth / 2;
            // For game data tooltips that might need extra space, adjust further
            if (isScatter) {
                left -= 10; // Move a bit more to the left for game data
            }
        }

        // Handle left edge overflow - move tooltip right if needed
        if (leftEdgeAfterTransform < screenPadding) {
            left = screenPadding + tooltipWidth / 2;
            // For trendline tooltips, we can afford to move them more to the right
            if (isTrendline && !isScatter) {
                left += 15; // Move further right for trendlines
            }
        }

        // For very wide tooltips on narrow screens
        if (tooltipWidth > viewportWidth - 2 * screenPadding) {
            left = viewportWidth / 2; // Center horizontally
        }

        // Handle vertical position
        // Get the screen's total available vertical space, accounting for scrolling
        const totalScreenHeight = viewportHeight;

        // Additional padding for Android browsers
        const ANDROID_EXTRA_PADDING = isFullscreen ? 20 : 30;
        const androidAdjustment = isAndroid ? ANDROID_EXTRA_PADDING : 0;

        // Vertical adjustment - ONLY if the tooltip would extend beyond the screen
        const tooltipBottom = top + tooltipHeight + androidAdjustment;
        const screenBottom = window.pageYOffset + totalScreenHeight - screenPadding;

        if (tooltipBottom > screenBottom) {
            // Move up only enough to fit on screen
            const amountToMoveUp = tooltipBottom - screenBottom;
            top -= amountToMoveUp;
        } else if (top < window.pageYOffset + screenPadding) {
            // Keep tooltip from going above top of screen
            top = window.pageYOffset + screenPadding;
        }

        // Apply the adjusted position
        tooltipEl.classList.add("visible");
        tooltipEl.style.left = left + "px";
        tooltipEl.style.top = top + "px";
    }

    /**
     * Creates a win count plugin that displays win counts on scatter points
     * @param {Object} chartData - The chart data with lines and win counts
     * @returns {Object} Chart.js plugin object
     */
    function createWinCountPlugin(chartData) {
        return {
            id: "winCountPlugin",
            afterDatasetsDraw: (chart) => {
                // Skip drawing win counts in these cases:
                // 1. On mobile devices unless in fullscreen mode
                // 2. On occurrence plots (when calculate_occurrences is true)
                if ((isMobile() && !chart.isFullscreen) || chart.calculate_occurrences)
                    return;

                const ctx = chart.ctx;

                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    // Only process scatter datasets (the point datasets are at odd indices)
                    if (dataset.type !== "scatter") return;

                    const meta = chart.getDatasetMeta(datasetIndex);

                    // Find the corresponding line index
                    // In normal mode: each line has 2 datasets (line and scatter)
                    // In calculate_occurrences mode: each line has only 1 dataset (scatter)
                    const lineIndex = chartData.calculate_occurrences
                        ? datasetIndex
                        : Math.floor(datasetIndex / 2);

                    // Check if we have y_values available
                    if (
                        !chartData.lines[lineIndex] ||
                        !chartData.lines[lineIndex].y_values
                    )
                        return;

                    // Process each point
                    meta.data.forEach((element, index) => {
                        // Get the data point
                        const dataPoint = dataset.data[index];
                        if (!dataPoint) return;

                        // Find matching y_values
                        const pointData = chartData.lines[lineIndex].y_values.find(
                            (item) =>
                                item.x_value === dataPoint.x &&
                                item.y_value === dataPoint.y
                        );

                        // If we found matching data and win_count < 10, draw the number
                        if (pointData && pointData.win_count < 10) {
                            const position = {
                                x: element.x,
                                y: element.y,
                            };

                            // Draw the win_count as white text - larger and very bold
                            ctx.save();
                            ctx.fillStyle = "white";

                            // Use smaller font size on mobile in fullscreen mode
                            if (isMobile() && chart.isFullscreen) {
                                ctx.font = "900 10px Arial"; // 1px smaller on mobile in fullscreen
                            } else {
                                ctx.font = "900 11px Arial"; // Standard size for desktop
                            }

                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            ctx.fillText(
                                pointData.win_count.toString(),
                                position.x,
                                position.y
                            );
                            ctx.restore();
                        }
                    });
                });
            },
        };
    }

    /**
     * Creates tooltip content for regression lines
     * @param {Object} pointMarginData - Data for point margins
     * @param {string} xValue - X-value (point margin)
     * @param {boolean} showRSquared - Whether to show R-squared values
     * @param {string} plotType - The plot type ("time_v_point_margin" or "point_margin_v_win_percent")
     * @returns {string} HTML string for the tooltip content
     */
    function createRegressionTooltipContent(
        pointMarginData,
        xValue,
        showRSquared,
        plotType
    ) {
        if (!pointMarginData[xValue]) {
            return "";
        }

        let innerHtml = "";
        const colors = getColorWheel(0.8);

        // Loop through all lines and add their data
        Object.entries(pointMarginData[xValue]).forEach(([legend, data], i) => {
            // Remove the "(XXXX Total Games)" part from the legend text
            const cleanLegend = legend.replace(/\s+\(\d+\s+Total\s+Games\)$/, "");

            // Get the color for this line (more opaque for the box)
            const color = colors[i % colors.length];

            // Create two versions of the text - with and without R² value
            const isMobileDevice = isMobile();
            const legendFontSize = isMobileDevice ? "10.5px" : "14px"; // 25% smaller on mobile

            // Basic text without R² is always available
            let textWithoutR;
            if (plotType === "time_v_point_margin") {
                // For time_v_point_margin, show point values instead of win percentages
                textWithoutR = `<span class="color-indicator" style="background-color:${color};"></span>
            <span class="legend-text">${cleanLegend}:</span> <span class="legend-text">${data.pointValue.toFixed(
                    2
                )} Points</span>`;
            } else {
                // For point_margin_v_win_percent, show win percentages
                textWithoutR = `<span class="color-indicator" style="background-color:${color};"></span>
            <span class="legend-text">${cleanLegend}:</span> <span class="legend-text">Win %= ${data.winPercent}</span>`;
            }

            // Full text with R² only if data.rSquared exists (only for point_margin_v_win_percent plot type)
            let fullText = textWithoutR;
            let hasRSquared = false;

            if (data.rSquared !== null && plotType !== "time_v_point_margin") {
                fullText = `<span class="color-indicator" style="background-color:${color};"></span>
            <span class="legend-text">${cleanLegend}:</span> <span class="legend-text">Win %= ${data.winPercent} | R² Value= ${data.rSquared}</span>`;
                hasRSquared = true;
            }

            // Display according to showRSquared toggle (only if hasRSquared is true)
            innerHtml += `<tr><td
        data-has-r-squared="${hasRSquared}"
        data-text-without-r="${textWithoutR.replace(/"/g, "&quot;")}"
        data-full-text="${fullText.replace(/"/g, "&quot;")}">
        ${showRSquared && hasRSquared ? fullText : textWithoutR}
        </td></tr>`;
        });

        return innerHtml;
    }

    /**
     * Creates a button for chart controls
     * @param {string} className - CSS class for the button
     * @param {string} iconClass - CSS class for the icon
     * @param {string} title - Button title/tooltip text
     * @param {Function} onClick - Click handler function
     * @returns {HTMLElement} The created button
     */
    function createChartButton(className, iconClass, title, onClick) {
        const button = document.createElement("button");
        button.className = `chart-btn ${className}`;
        button.title = title;
        button.setAttribute("aria-label", title);
        button.setAttribute("data-tooltip", title);
        button.innerHTML = `<i class="chart-icon ${iconClass}"></i>`;

        if (onClick) {
            button.onclick = onClick;
        }

        return button;
    }

    /**
     * Utility function to detect if the user is on a mobile device
     * Uses a combination of screen size and user agent detection for better accuracy
     *
     * @returns {boolean} true if the user is on a mobile device, false otherwise
     */
    function isMobile() {
        // First check for touch capability - most reliable for iOS Safari
        const hasTouchScreen =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        // Check screen width - for responsive design
        const isNarrowScreen = window.innerWidth <= 768;
        const isVeryNarrowScreen = window.innerWidth <= 480;

        // Check user agent - provides additional context
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Regular expressions to match common mobile devices
        const mobileRegex =
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
        const tabletRegex = /android|ipad|playbook|silk/i;

        // Special case for iOS devices
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        // Consider a device mobile in any of these cases:
        // 1. It has a very narrow screen (width <= 480px)
        // 2. It has a narrow screen AND matches mobile/tablet user agent
        // 3. It has a touch screen AND matches iOS detection
        return (
            isVeryNarrowScreen ||
            (isNarrowScreen &&
                (mobileRegex.test(userAgent) || tabletRegex.test(userAgent))) ||
            (hasTouchScreen && isIOS)
        );
    }

    /**
     * Store data in localStorage with timestamp and server last-modified time
     * @param {string} key - The storage key
     * @param {any} data - The data to store (will be JSON stringified)
     * @param {string} [lastModified] - The Last-Modified header from the server
     * @returns {boolean} - True if storage was successful
     */
    function setLocalStorageWithTimestamp(key, data, lastModified) {
        if (!__USE_LOCAL_STORAGE_CACHE__) return false;
        
        try {
            // Store the data
            localStorage.setItem(key, JSON.stringify(data));
            
            // Store timestamp metadata
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
            
            // Store the server Last-Modified header if available
            if (lastModified && __USE_SERVER_TIMESTAMPS__) {
                localStorage.setItem(`${key}_lastModified`, lastModified);
            }
            
            return true;
        } catch (e) {
            console.error("Error storing in localStorage:", e);
            return false;
        }
    }
    
    /**
     * Get data from localStorage with validation
     * @param {string} key - The storage key
     * @returns {any|null} - The stored data or null if not found or expired
     */
    function getLocalStorageWithTimestamp(key) {
        if (!__USE_LOCAL_STORAGE_CACHE__) return null;
        
        try {
            // If using server timestamps, we don't check for expiration here
            // The timestamp validation will happen in checkIfCacheIsValid when fetching
            if (!__USE_SERVER_TIMESTAMPS__) {
                // Check timestamp first
                const timestampKey = `${key}_timestamp`;
                const timestamp = localStorage.getItem(timestampKey);
                
                if (timestamp) {
                    const cacheTime = parseInt(timestamp, 10);
                    const now = Date.now();
                    
                    // If cache is expired, clear it and return null
                    if (now - cacheTime > __MAX_CACHE_AGE_MS__) {
                        localStorage.removeItem(key);
                        localStorage.removeItem(timestampKey);
                        return null;
                    }
                }
            }
            
            // Get and parse the data
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Error retrieving from localStorage:", e);
            return null;
        }
    }
    
    /**
     * Checks if the cache is still valid by comparing with server file's Last-Modified
     * @param {string} key - The storage key
     * @param {string} url - The URL of the resource
     * @returns {Promise<boolean>} - True if cache is valid, false if it needs updating
     */
    async function checkIfCacheIsValid(key, url) {
        if (!__USE_LOCAL_STORAGE_CACHE__ || !__USE_SERVER_TIMESTAMPS__) {
            return false;
        }
        
        try {
            // Get the cached Last-Modified value
            const cachedLastModified = localStorage.getItem(`${key}_lastModified`);
            if (!cachedLastModified) {
                return false;
            }
            
            // Perform a HEAD request to check the Last-Modified header
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) {
                return true; // If HEAD request fails, assume cache is still valid
            }
            
            const serverLastModified = response.headers.get('Last-Modified');
            
            // If server doesn't provide Last-Modified, assume cache is invalid
            if (!serverLastModified) {
                return false;
            }
            
            // Compare timestamps
            return new Date(cachedLastModified).getTime() >= new Date(serverLastModified).getTime();
        } catch (e) {
            console.error("Error checking cache validity:", e);
            return true; // On error, assume cache is valid to prevent excessive requests
        }
    }
    
    /**
     * Initialize cache management by cleaning up expired items
     */
    function initCacheManagement() {
        if (!__USE_LOCAL_STORAGE_CACHE__) return;
        
        try {
            // If we're using server timestamps, we don't automatically remove entries based on age
            // Instead, we'll check against server timestamps when the data is requested
            if (!__USE_SERVER_TIMESTAMPS__) {
                // Clean up expired cache entries
                const now = Date.now();
                const keysToRemove = [];
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    
                    // Only process our cache data keys (not metadata keys)
                    if (key && key.startsWith('nbacc_') && !key.endsWith('_timestamp') && !key.endsWith('_lastModified')) {
                        try {
                            // Try to get timestamp metadata
                            const timestampKey = `${key}_timestamp`;
                            const timestamp = localStorage.getItem(timestampKey);
                            
                            if (timestamp) {
                                const cacheTime = parseInt(timestamp, 10);
                                if (now - cacheTime > __MAX_CACHE_AGE_MS__) {
                                    keysToRemove.push(key);
                                    keysToRemove.push(timestampKey);
                                    keysToRemove.push(`${key}_lastModified`); // Also remove lastModified if exists
                                }
                            }
                        } catch (e) {
                            // If we can't parse the timestamp, better to remove the item
                            keysToRemove.push(key);
                            keysToRemove.push(`${key}_timestamp`);
                            keysToRemove.push(`${key}_lastModified`);
                        }
                    }
                }
                
                // Remove expired items
                keysToRemove.forEach(key => {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        // Ignore removal errors
                    }
                });
            }
        } catch (e) {
            console.error("Error during cache initialization:", e);
        }
    }
    
    /**
     * Clears all NBACC-related cache entries from localStorage
     * @returns {number} Count of cleared cache entries
     */
    function clearAllCache() {
        if (!__USE_LOCAL_STORAGE_CACHE__) return 0;
        
        try {
            const keysToRemove = [];
            const processedCount = {value: 0};
            
            // Find all NBACC cache keys (both data and metadata)
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nbacc_')) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove all identified keys
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                    processedCount.value++;
                } catch (e) {
                    // Ignore removal errors
                }
            });
            
            return processedCount.value;
        } catch (e) {
            console.error("Error clearing cache:", e);
            return 0;
        }
    }
    
    // Check for cache clearing instruction in URL
    function checkUrlForCacheClear() {
        if (window.location.hash === '#clear') {
            const clearedCount = clearAllCache();
            console.log(`Cache cleared: ${clearedCount} items removed`);
            
            // Remove the #clear from the URL to prevent clearing on every page refresh
            // Replace current URL without the hash
            try {
                const url = window.location.href.split('#')[0];
                window.history.replaceState({}, document.title, url);
            } catch (e) {
                // Fallback for browsers not supporting history API
                window.location.hash = '';
            }
            
            // Show a brief message to the user
            const messageDiv = document.createElement('div');
            messageDiv.style.position = 'fixed';
            messageDiv.style.top = '10px';
            messageDiv.style.left = '50%';
            messageDiv.style.transform = 'translateX(-50%)';
            messageDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
            messageDiv.style.color = 'white';
            messageDiv.style.padding = '10px 20px';
            messageDiv.style.borderRadius = '5px';
            messageDiv.style.zIndex = '9999';
            messageDiv.style.fontFamily = 'Arial, sans-serif';
            messageDiv.textContent = `Cache cleared: ${clearedCount} items removed`;
            
            document.body.appendChild(messageDiv);
            
            // Remove the message after 3 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 3000);
            
            return true;
        }
        return false;
    }
    
    // Run cache initialization
    setTimeout(() => {
        // First check for cache clear instruction
        const cacheCleared = checkUrlForCacheClear();
        
        // Then run normal cache management if cache wasn't just cleared
        if (!cacheCleared) {
            initCacheManagement();
        }
    }, 500);

    // Export public API
    return {
        readGzJson,
        getColorWheel,
        calculateTooltipPosition,
        isMobile,
        staticDir,
        createZoomOptions,
        createPlotBackgroundPlugin,
        createChartButton,
        chartJsToolTipClearer,
        clearTooltipContent,
        renderGameExamples,
        createGameLink,
        formatGameDate,
        setLocalStorageWithTimestamp,
        getLocalStorageWithTimestamp,
        checkIfCacheIsValid,
        initCacheManagement,
        clearAllCache,
        checkUrlForCacheClear,
        __LOAD_CHART_ON_PAGE_LOAD__,
        __HOVER_PLOTS_ON_CLICK_ON_MOBILE_NOT_FULLSCREEN__,
        __USE_LOCAL_STORAGE_CACHE__,
        __USE_SERVER_TIMESTAMPS__,
        __MAX_CACHE_AGE_MS__
    };
})();

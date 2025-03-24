/**
 * nbacc_plotter_core.js
 *
 * Core functionality for NBA chart plotting. This file contains:
 * - Chart creation and initialization
 * - Main formatting function that delegates to other modules
 * - High-level dataset creation functions
 *
 * This module is responsible for the creation of Chart.js charts and coordinates
 * the use of formatting, plugins, and UI controls from other modules.
 */

// Set up the CSS for icons using the staticDir variable for consistent paths
function setupIconPaths() {
    // Create a style element
    const styleEl = document.createElement("style");

    // Define CSS with dynamic paths - this is a justified use of inline styles
    // because the paths depend on the staticDir which is only known at runtime
    styleEl.textContent = `
        .zoom-reset-icon {
            background-image: url("${staticDir}/reset_zoom_icon.svg");
        }
        .full-screen-icon {
            background-image: url("${staticDir}/full_screen_icon.svg");
        }
        .exit-full-screen-icon {
            background-image: url("${staticDir}/exit_full_screen_icon.svg");
        }
        .save-png-icon {
            background-image: url("${staticDir}/save_disk_drive_icon.svg");
        }
    `;

    // Add to document head
    document.head.appendChild(styleEl);
}

/**
 * Creates a Chart.js chart from JSON data
 * @param {string} canvasId - The ID of the canvas element where the chart will be rendered
 * @param {object} chartConfig - The chart configuration object
 * @returns {Chart} The created Chart.js instance
 */
function createChartJSChart(canvasId, chartConfig) {
    const canvas = document.getElementById(canvasId);

    // Create the chart
    const chart = new Chart(canvas, chartConfig);

    // Set the plot type as a property on the chart instance for easy access
    chart.plotType = chartConfig.plotType;

    // Store the calculate_occurrences flag on the chart for access in other functions
    chart.calculate_occurrences = chartConfig.calculate_occurrences;
    
    // Store the original chart data in the chart object for tooltip access
    chart.chartData = window.chartData;
    
    // Ensure the chartData is also available in chart options for another fallback path
    if (chartConfig && chartConfig.options) {
        chartConfig.options.chartData = window.chartData;
    }

    // Chart creation complete with all required properties set

    // Add buttons to chart area after initialization
    addControlsToChartArea(canvas, chart);

    return chart;
}

/**
 * Adds datasets to a Chart.js configuration object
 * @param {Object} chartConfig - The Chart.js configuration object
 * @param {Object} chartData - The chart data containing lines and plot options
 * @param {Array} colors - Array of colors to use for datasets
 * @param {string} plotType - The plot type (time_v_point_margin or point_margin_v_win_percent)
 */
function addDatasetsToChart(chartConfig, chartData, colors, plotType) {
    chartData.lines.forEach((line, index) => {
        const color = colors[index % colors.length];

        // Create two datasets for each line:
        // 1. A trend line dataset (unless calculating occurrences)
        if (!chartData.calculate_occurrences) {
            const trendlineData = createTrendlineData(line, chartData, plotType);
            chartConfig.data.datasets.push(
                createTrendlineDataset(
                    trendlineData,
                    color,
                    line,
                    chartData.calculate_occurrences
                )
            );
        }

        // 2. A scatter dataset for individual points
        const scatterPoints = createScatterPointsData(line, plotType);
        chartConfig.data.datasets.push(
            createScatterDataset(scatterPoints, color, line.legend)
        );
    });
}

/**
 * Creates trend line data points for a line
 * @param {Object} line - The line data
 * @param {Object} chartData - The chart data containing min_x, max_x, and y_ticks
 * @param {string} plotType - The plot type (time_v_point_margin or point_margin_v_win_percent)
 * @returns {Array} Array of {x, y} points for the trend line
 */
function createTrendlineData(line, chartData, plotType) {
    const trendlineData = [];

    if (plotType === "time_v_point_margin") {
        return createTimeVsPointMarginTrendData(line);
    } else {
        return createPointMarginVsWinPercentTrendData(line, chartData);
    }
}

/**
 * Creates trend line data points for time_v_point_margin plot type
 * @param {Object} line - The line data containing y_values with y_fit_value
 * @returns {Array} Array of {x, y} points for the trend line
 */
function createTimeVsPointMarginTrendData(line) {
    // For time_v_point_margin plot type, use the y_fit_value from each point
    // Sort the y_values by x_value to ensure the trend line is drawn correctly
    const sortedYValues = [...line.y_values].sort((a, b) => a.x_value - b.x_value);

    // Create trendline points from the sorted y_values with their y_fit_value
    return sortedYValues.map((point) => ({
        x: point.x_value,
        y: point.y_fit_value,
    }));
}

/**
 * Creates trend line data points for point_margin_v_win_percent plot type
 * @param {Object} line - The line data containing m and b coefficients
 * @param {Object} chartData - The chart data containing min_x, max_x, and y_ticks
 * @returns {Array} Array of {x, y} points for the trend line
 */
function createPointMarginVsWinPercentTrendData(line, chartData) {
    const trendlineData = [];

    // Calculate the minimum x value where the regression line won't go below min(y_ticks)
    // This prevents plotting the regression line in areas that would be off the visible chart
    const minYValue = Math.min(...chartData.y_ticks);
    // Solve for x using the line equation: minYValue = m*x + b => x = (minYValue - b) / m
    const minAllowedX = (minYValue - line.b) / line.m;

    // Adjust min_x to ensure we don't plot y values below min(y_ticks)
    const adjustedMinX = Math.max(chartData.min_x, Math.ceil(minAllowedX));
    const adjustedMaxX = chartData.max_x;

    // Create a point at every integer x-coordinate from adjustedMinX to adjustedMaxX
    for (let x = Math.ceil(adjustedMinX); x <= Math.floor(adjustedMaxX); x += 1) {
        trendlineData.push({
            x: x,
            y: line.m * x + line.b,
        });
    }

    // Always ensure the last point is exactly at max_x if it's not an integer
    if (adjustedMaxX % 1 !== 0) {
        trendlineData.push({
            x: adjustedMaxX,
            y: line.m * adjustedMaxX + line.b,
        });
    }

    // Always ensure the first point is exactly at min_x if it's not an integer
    if (adjustedMinX % 1 !== 0) {
        trendlineData.unshift({
            x: adjustedMinX,
            y: line.m * adjustedMinX + line.b,
        });
    }

    return trendlineData;
}

/**
 * Creates a trend line dataset configuration for Chart.js
 * @param {Array} trendlineData - Array of {x, y} points for the trend line
 * @param {string} color - Color to use for the trend line
 * @param {Object} line - The line data
 * @param {boolean} calculateOccurrences - Whether occurrences should be calculated
 * @returns {Object} Chart.js dataset configuration
 */
function createTrendlineDataset(trendlineData, color, line, calculateOccurrences) {
    return {
        data: trendlineData,
        type: "line", // Explicitly set type
        borderColor: color,
        backgroundColor: "transparent",
        borderWidth: isMobile() ? 4 : 5, // Thinner line on mobile
        pointRadius: isMobile() ? 3 : 4, // Smaller points on mobile
        pointHoverRadius: isMobile() ? 3 : 3, // Smaller hover radius on mobile
        pointStyle: "circle", // Round points
        pointBackgroundColor: color,
        pointBorderColor: color, // Same color as the point to remove white border
        pointBorderWidth: 0, // No border
        hoverBorderWidth: 2,
        label: "REMOVE!",
        // Make the line interactive but only on the points
        tension: 0, // Straight line
        spanGaps: false,
        // Additional interactive options
        hoverBackgroundColor: color,
        hoverBorderColor: color, // Match the line color for border
        // Hover behavior for regression lines
        interaction: {
            mode: "nearest",
            intersect: true, // Require direct intersection
            axis: "xy",
            hoverRadius: 3, // Smaller hover detection radius
        },
        hitRadius: 10, // Reduced by 50% to require closer hover
        // For occurrence plots we want to disable hover/tooltip on trend lines
        hoverEnabled: !calculateOccurrences,
    };
}

/**
 * Creates scatter points data for a line
 * @param {Object} line - The line data containing y_values
 * @param {string} plotType - The plot type (time_v_point_margin or point_margin_v_win_percent)
 * @returns {Array} Array of {x, y} points for the scatter plot
 */
function createScatterPointsData(line, plotType) {
    const scatterPoints = [];

    // For time_v_point_margin plot type, only add scatter points for the "Record" legend
    if (!(plotType === "time_v_point_margin" && line.legend !== "Record")) {
        line.y_values.forEach((scatterPoint) => {
            scatterPoints.push({
                x: scatterPoint.x_value,
                y: scatterPoint.y_value,
            });
        });
    }

    return scatterPoints;
}

/**
 * Creates a scatter dataset configuration for Chart.js
 * @param {Array} scatterPoints - Array of {x, y} points for the scatter plot
 * @param {string} color - Color to use for the scatter points
 * @param {string} legend - Legend text for the dataset
 * @returns {Object} Chart.js dataset configuration
 */
function createScatterDataset(scatterPoints, color, legend) {
    return {
        type: "scatter",
        data: scatterPoints,
        borderColor: color,
        backgroundColor: color.replace("0.5", "0.7"),
        pointStyle: "rectRounded",
        pointRadius: isMobile() ? 5.6 : 8, // Reduced size by ~30% on mobile
        pointHoverRadius: isMobile() ? 8 : 12, // Larger on hover to show interaction
        showLine: false, // Ensure no line is drawn
        label: legend,
        // Hover behavior for scatter points
        interaction: {
            mode: "nearest",
            intersect: true, // Require direct intersection
            axis: "xy",
            hoverRadius: 6, // Increased hover detection radius
        },
        hitRadius: 10, // Slightly larger hit area
        // Ensure hover styles don't have white borders
        hoverBorderColor: color.replace("0.5", "0.7"), // Same color as background
        hoverBackgroundColor: color.replace("0.5", "0.9"), // Slightly more opaque on hover
        hoverBorderWidth: 0, // No border on hover
    };
}

/**
 * Determines appropriate axis step size based on screen width
 * Smaller screens need larger steps to prevent overcrowding
 *
 * @returns {number} The step size (1, 2, or 5) based on screen size
 */
function getStepSizeForScreenWidth() {
    // Check if on mobile device first
    if (isMobile()) {
        return 5; // Larger steps for mobile devices (fewer ticks)
    }

    // For non-mobile, determine step size based on screen width
    const screenWidth =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

    // Define width thresholds for different step sizes
    const VERY_SMALL_SCREEN_WIDTH = 400;
    const MEDIUM_SCREEN_WIDTH = 700;

    // Return appropriate step size based on screen width
    if (screenWidth < VERY_SMALL_SCREEN_WIDTH) {
        return 5; // Larger steps for very small screens
    } else if (screenWidth < MEDIUM_SCREEN_WIDTH) {
        return 2; // Medium steps for medium-sized screens
    } else {
        return 1; // Small steps (more detail) for large screens
    }
}

// Initialize icon paths and add event handlers for mobile
document.addEventListener("DOMContentLoaded", function () {
    // Call the function to set up icon paths
    setupIconPaths();

    // For mobile, add special handling to clear any lingering effects when returning to the page
    if (isMobile()) {
        // This will be triggered when returning from NBA.com via back button
        window.addEventListener("pageshow", function (event) {
            // Clear any visible tooltips
            const tooltipEl = document.getElementById("chartjs-tooltip");
            if (tooltipEl) {
                tooltipEl.style.opacity = "0";

                // Empty the table contents
                const table = tooltipEl.querySelector("table");
                if (table) {
                    table.innerHTML = "";
                }
            }
        });

        // Add a click handler to the document to clear tooltips only when clicking outside the tooltip
        document.addEventListener("click", function (event) {
            // If click is outside tooltip and tooltip exists, hide it
            const tooltipEl = document.getElementById("chartjs-tooltip");
            if (
                tooltipEl &&
                tooltipEl.style.opacity !== "0" &&
                !tooltipEl.contains(event.target)
            ) {
                // Check that we're not clicking on a chart element (which would show a new tooltip)
                const chartElements = document.querySelectorAll(
                    "canvas.chartjs-render-monitor"
                );
                let clickedOnChart = false;

                chartElements.forEach((canvas) => {
                    if (canvas.contains(event.target)) {
                        clickedOnChart = true;
                    }
                });

                // Only hide if clicked outside both tooltip and chart
                if (!clickedOnChart) {
                    tooltipEl.style.opacity = "0";
                    setTimeout(function () {
                        const table = tooltipEl.querySelector("table");
                        if (table) {
                            table.innerHTML = "";
                        }
                    }, 300);
                }
            }
        });
    }
});

// Use the utility function to create zoom options
window.zoomOptions = createZoomOptions(updateButtonPositions);

// Use the utility function to create the plot background plugin
window.plotBackgroundPlugin = createPlotBackgroundPlugin();

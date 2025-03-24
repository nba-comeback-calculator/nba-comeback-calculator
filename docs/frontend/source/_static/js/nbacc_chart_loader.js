/**
 * nbacc_chart_loader.js
 * Handles finding and loading charts when they become visible in the viewport.
 */

// Keep track of which charts have already been loaded
const loadedCharts = new Set();
// Store chart instances for reference (needed for reset functionality)
const chartInstances = {};

// Expose these variables to the window for cross-module access
window.loadedCharts = loadedCharts;
window.chartInstances = chartInstances;

// Function to check if any part of an element is in the viewport
// Returns true if any portion of the element is visible on screen
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if any part of the element is visible
    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < windowWidth &&
        rect.top < windowHeight
    );
}

// Function to reset zoom on a chart
function resetChartZoom(chartId) {
    const chart = chartInstances[chartId];
    if (chart) {
        chart.resetZoom();
    }
}

// Function to load and plot chart data
async function loadAndPlotChart(chartDiv) {
    const divId = chartDiv.id;
    if (!divId) {
        console.error("Chart div must have an ID attribute");
        return;
    }

    // Mark this chart as loaded to avoid duplicate processing
    if (loadedCharts.has(divId)) {
        throw new AssertionError(`Chart with ID ${divId} has already been loaded`);
    }
    loadedCharts.add(divId);

    // Check if this is a calculator-enabled chart
    const isCalculatorChart =
        chartDiv.classList.contains("nbacc-calculator") &&
        chartDiv.id !== "nbacc_calculator"; // Skip the main calculator div

    // Create chart container structure first
    // First, clear the div completely
    chartDiv.innerHTML = "";

    // Calculate desired height based on chart data
    let chartHeight = 600;

    // Create a parent container for the chart container
    const chartContainerParent = document.createElement("div");
    chartContainerParent.className = "chart-container-parent";

    // Create a container for the chart specifically for Chart.js
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    chartContainer.id = `${divId}-container`;

    // Set custom height if needed, otherwise use default from CSS
    if (chartHeight !== 600) {
        chartContainer.style.height = `${chartHeight}px`;
    }

    // Append the chart container to the parent container
    chartContainerParent.appendChild(chartContainer);

    // Append the parent container to the chart div
    chartDiv.appendChild(chartContainerParent);

    // If this is a calculator-enabled chart, add the Configure button
    if (isCalculatorChart) {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "calculator-button-container";

        const configureButton = document.createElement("button");
        configureButton.className = "btn btn-primary calculator-configure-btn";
        configureButton.textContent = "Configure";
        configureButton.addEventListener("click", function () {
            // Show calculator UI for this specific chart
            if (typeof nbacc_calculator_ui !== "undefined") {
                nbacc_calculator_ui.showCalculatorUI(divId);
            } else {
                console.error("nbacc_calculator_ui module is not loaded");
            }
        });

        buttonContainer.appendChild(configureButton);
        // Append the button container to the chart-container-parent instead of the chart div
        // This ensures it's properly centered with the chart
        chartContainerParent.appendChild(buttonContainer);
    }

    // Show loading indicator within the chart container
    chartContainer.innerHTML = '<div class="chart-loading">Loading chart data...</div>';

    // Construct the URL for the chart data using absolute path from root
    const rootUrl = window.location.protocol + "//" + window.location.host;
    const jsonUrl = `${rootUrl}${nbacc_utils.staticDir}/json/charts/${
        divId.split("_copy")[0]
    }.json.gz`;

    // Fetch the JSON data
    let chartData;
    try {
        // Try the absolute path
        let response = await fetch(jsonUrl);

        // If absolute path fails, try an alternative path
        if (!response.ok) {
            throw new Error(`Error can't find ${divId}.json!`);
        }

        // Check if we have gzipped JSON (based on content type or extension)
        const contentType = response.headers.get("Content-Type");
        const isGzipped =
            jsonUrl.endsWith(".gz") || (contentType && contentType.includes("gzip"));
        if (isGzipped) {
            // Use the readGzJson utility function
            chartData = await nbacc_utils.readGzJson(response);
        } else {
            // Regular JSON
            chartData = await response.json();
        }

        // Validate the required attributes early
        validateChartData(chartData);
    } catch (error) {
        console.error(`Error loading or validating JSON: ${error.message}`);
        chartContainer.innerHTML = `Error can't find ${divId}.json!`;
        return;
    }

    // Clear the container again to remove loading message
    chartContainer.innerHTML = "";

    // Create canvas with proper size attributes
    const canvas = document.createElement("canvas");
    canvas.id = `${divId}-canvas`;
    canvas.className = "chart-canvas";

    // Set initial dimensions for the canvas - important!
    const containerWidth = chartContainer.clientWidth || 600;
    canvas.width = containerWidth;
    canvas.height = chartHeight;

    // Add canvas to container
    chartContainer.appendChild(canvas);

    // Process JSON data for Chart.js
    const formattedData = nbacc_plotter_data.formatDataForChartJS(chartData);

    // Create chart and store the instance
    const chartInstance = nbacc_plotter_core.createChartJSChart(
        canvas.id,
        formattedData
    );
    chartInstances[divId] = chartInstance;

    // Add plot type as a property on the chart instance for easy access
    chartInstance.plotType = formattedData.plotType;

    // Add double-click event listener to reset zoom
    canvas.addEventListener("dblclick", function () {
        resetChartZoom(divId);
    });

    // Create a global keyboard handler for this chart instead of focusing the canvas
    const chartKeyboardHandler = function (event) {
        if (event.key === "f" || event.key === "F") {
            // Check if the mouse is over this chart
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            // If mouse is over this chart or if this is the active chart
            if (
                (mouseX >= rect.left &&
                    mouseX <= rect.right &&
                    mouseY >= rect.top &&
                    mouseY <= rect.bottom) ||
                chartDiv.classList.contains("active-chart")
            ) {
                resetChartZoom(divId);
                event.preventDefault(); // Prevent default behavior
            }
        }
    };

    // Add global key event listener
    document.addEventListener("keydown", chartKeyboardHandler);

    // // Mark chart as active when mouse enters
    // canvas.addEventListener("mouseenter", function () {
    //     // Remove active class from all charts
    //     document.querySelectorAll(".nba-cc.chart").forEach((div) => {
    //         div.classList.remove("active-chart");
    //     });
    //     // Add active class to this chart
    //     chartDiv.classList.add("active-chart");
    // });

    // // Handle mouse leaving the canvas
    // canvas.addEventListener("mouseleave", function () {
    //     // Hide any tooltips when mouse leaves the chart
    //     const tooltipEl = document.getElementById("chartjs-tooltip");
    //     if (tooltipEl) {
    //         // Add a small delay to allow moving to the tooltip itself
    //         setTimeout(() => {
    //             if (!tooltipEl.matches(":hover")) {
    //                 tooltipEl.style.opacity = 0;
    //                 tooltipEl.setAttribute("data-sticky", "false");
    //             }
    //         }, 100);
    //     }
    // });
}

// Check all chart divs and load those in the viewport
function checkChartsInViewport() {
    const chartDivs = document.querySelectorAll("div.nbacc-chart");

    if (chartDivs.length === 0) {
        console.log("No chart divs found with class 'nbacc-chart'");
    }

    chartDivs.forEach((div) => {
        const divId = div.id;

        if (!divId) {
            console.warn("Found chart div without ID - skipping");
            return;
        }

        // Skip if this chart has already been loaded
        if (loadedCharts.has(divId)) return;

        // If the div is in the viewport, load and plot the chart
        if (isElementInViewport(div)) {
            loadAndPlotChart(div);
        }
    });
}

// Set up the scroll event listener
document.addEventListener("DOMContentLoaded", () => {
    // Initial check for charts in viewport
    checkChartsInViewport();

    // Check for charts when scrolling
    window.addEventListener("scroll", () => {
        // Debounce the scroll event to improve performance
        if (window.scrollTimeout) {
            clearTimeout(window.scrollTimeout);
        }
        window.scrollTimeout = setTimeout(checkChartsInViewport, 100);
    });

    // Also check when window is resized
    window.addEventListener("resize", () => {
        if (window.resizeTimeout) {
            clearTimeout(window.resizeTimeout);
        }
        window.resizeTimeout = setTimeout(checkChartsInViewport, 100);
    });
});

/**
 * Validates that the chart data has all required attributes
 * @param {object} chartData - The chart data object to validate
 * @throws {Error} If any required attributes are missing
 */
function validateChartData(chartData) {
    if (!chartData) {
        throw new Error("No chart data provided");
    }

    // Check plot_type is valid if provided (default is "point_margin_v_win_percent" if not provided)
    if (
        chartData.plot_type &&
        !["point_margin_v_win_percent", "time_v_point_margin"].includes(
            chartData.plot_type
        )
    ) {
        throw new Error(
            `Invalid plot_type: ${chartData.plot_type}. Must be "point_margin_v_win_percent" or "time_v_point_margin"`
        );
    }

    if (
        !chartData.lines ||
        !Array.isArray(chartData.lines) ||
        chartData.lines.length === 0
    ) {
        throw new Error("Chart data must contain at least one line");
    }

    chartData.lines.forEach((line, index) => {
        if (
            !line.x_values ||
            !Array.isArray(line.x_values) ||
            line.x_values.length === 0
        ) {
            throw new Error(`Line ${index}: Missing or invalid 'x_values' array`);
        }

        // Only check for slope (m) and y-intercept (b) for point_margin_v_win_percent plot type
        // For time_v_point_margin plot type, we use y_fit_value in each data point instead
        if (
            chartData.plot_type === "point_margin_v_win_percent" &&
            (line.m === undefined || line.b === undefined)
        ) {
            throw new Error(
                `Line ${index}: Missing slope (m) or y-intercept (b) for trend line`
            );
        }

        if (
            !line.y_values ||
            !Array.isArray(line.y_values) ||
            line.y_values.length === 0
        ) {
            throw new Error(`Line ${index}: Missing or invalid 'y_values' array`);
        }

        // For time_v_point_margin plot type, ensure each point has y_fit_value for the trend line
        if (chartData.plot_type === "time_v_point_margin") {
            // Check at least the first point to ensure y_fit_value is present
            if (line.y_values[0] && line.y_values[0].y_fit_value === undefined) {
                throw new Error(
                    `Line ${index}: Missing 'y_fit_value' in data points for time_v_point_margin plot type`
                );
            }
        }
    });
}

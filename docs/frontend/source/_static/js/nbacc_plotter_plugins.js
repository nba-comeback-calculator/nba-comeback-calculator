/**
 * nbacc_plotter_plugins.js
 * 
 * Chart.js plugin implementations for NBA charts. This file contains:
 * - Win count display plugin for scatter points
 * - External tooltip handler with custom positioning
 * - Button position update handling for zoom and pan operations
 * 
 * This module provides Chart.js extensions that enhance the core
 * Chart.js functionality with custom visualizations and interactions.
 */

/**
 * Creates a win count plugin that displays win counts on scatter points
 * @param {Object} chartData - The chart data with lines and win counts
 * @returns {Object} Chart.js plugin object
 */
function createWinCountPlugin(chartData) {
    return {
        id: "winCountPlugin",
        afterDatasetsDraw: (chart) => {
            // Skip drawing win counts if not appropriate
            if (shouldSkipWinCountDisplay(chart)) return;

            // Draw win counts for each point
            drawWinCountsOnPoints(chart, chartData);
        },
    };
}

/**
 * Determines if win count display should be skipped
 * @param {Object} chart - The Chart.js chart instance
 * @returns {boolean} True if win counts should be skipped
 */
function shouldSkipWinCountDisplay(chart) {
    // Skip on mobile unless in fullscreen mode
    // Skip on occurrence plots (when calculate_occurrences is true)
    return (nbacc_utils.isMobile() && !chart.isFullscreen) || chart.calculate_occurrences;
}

/**
 * Draws win count numbers on chart points
 * @param {Object} chart - The Chart.js chart instance
 * @param {Object} chartData - The chart data
 */
function drawWinCountsOnPoints(chart, chartData) {
    const ctx = chart.ctx;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
        // Only process scatter datasets
        if (dataset.type !== "scatter") return;

        // Get metadata for accessing element positions
        const meta = chart.getDatasetMeta(datasetIndex);

        // Find corresponding line index based on plot mode
        const lineIndex = determineLineIndex(chart, datasetIndex);

        // Skip if no y_values available for this line
        if (!chartData.lines[lineIndex] || !chartData.lines[lineIndex].y_values)
            return;

        // Process each scatter point
        meta.data.forEach((element, index) => {
            processScatterPoint(
                chart,
                ctx,
                dataset,
                element,
                index,
                chartData.lines[lineIndex].y_values
            );
        });
    });
}

/**
 * Determines the line index for a dataset
 * @param {Object} chart - The Chart.js chart instance
 * @param {number} datasetIndex - The dataset index
 * @returns {number} The line index
 */
function determineLineIndex(chart, datasetIndex) {
    // In normal mode: each line has 2 datasets (line and scatter)
    // In calculate_occurrences mode: each line has only 1 dataset (scatter)
    return chart.calculate_occurrences
        ? datasetIndex
        : Math.floor(datasetIndex / 2);
}

/**
 * Processes a single scatter point to draw its win count if needed
 * @param {Object} chart - The Chart.js chart instance
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} dataset - The dataset object
 * @param {Object} element - The point element
 * @param {number} index - The point index
 * @param {Array} yValues - The y_values array for this line
 */
function processScatterPoint(chart, ctx, dataset, element, index, yValues) {
    // Get the data point
    const dataPoint = dataset.data[index];
    if (!dataPoint) return;

    // Find matching y_values
    const pointData = yValues.find(
        (item) => item.x_value === dataPoint.x && item.y_value === dataPoint.y
    );

    // Only draw win count if it's less than 10
    if (pointData && pointData.win_count < 10) {
        drawWinCountOnPoint(chart, ctx, element, pointData.win_count);
    }
}

/**
 * Draws the win count text on a chart point
 * @param {Object} chart - The Chart.js chart instance
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} element - The point element
 * @param {number} winCount - The win count to display
 */
function drawWinCountOnPoint(chart, ctx, element, winCount) {
    const position = {
        x: element.x,
        y: element.y,
    };

    // Draw white text with appropriate font size
    ctx.save();
    ctx.fillStyle = "white";

    // Use smaller font on mobile in fullscreen mode
    ctx.font =
        nbacc_utils.isMobile() && chart.isFullscreen
            ? "900 10px Arial" // 1px smaller on mobile in fullscreen
            : "900 11px Arial"; // Standard size for desktop

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw the text
    ctx.fillText(winCount.toString(), position.x, position.y);
    ctx.restore();
}

/**
 * Updates the position of chart control buttons during zoom/pan operations
 * This ensures buttons stay positioned correctly relative to the chart area
 * @param {Object} chart - The Chart.js chart instance
 */
// Make updateButtonPositions available globally
window.updateButtonPositions = function(chart) {
    // First try to find the button container using the chart's canvas ID
    const chartId = chart.canvas.id.replace("-canvas", "");

    // Use CSS-escaped ID since chartId may contain characters that need escaping in CSS selectors
    const escapedChartId = CSS.escape(chartId);

    // Need to handle both regular chart containers and fullscreen containers
    let buttonContainer = document.querySelector(
        `#${escapedChartId} .chart-container .chart-buttons`
    );

    // If not found, check if we're in fullscreen mode
    if (!buttonContainer) {
        // Try to find button container in the lightbox
        buttonContainer = document.querySelector(
            `#lightbox-chart-container .chart-container .chart-buttons`
        );
    }

    if (buttonContainer && chart.chartArea) {
        // Ensure the buttons are visible
        buttonContainer.style.display = "flex";

        // Most important: position relative to the actual chart area
        const chartArea = chart.chartArea;

        // Calculate the button dimensions - force a reflow if needed
        let buttonContainerWidth = buttonContainer.offsetWidth;
        let buttonContainerHeight = buttonContainer.offsetHeight;

        // If dimensions are 0, make the container visible temporarily to measure
        const wasHidden = buttonContainer.style.opacity === "0";
        if (!buttonContainerWidth || !buttonContainerHeight) {
            const originalOpacity = buttonContainer.style.opacity;
            buttonContainer.style.opacity = "0.01"; // Barely visible for measurement
            buttonContainer.style.visibility = "visible";

            // Force reflow and remeasure
            setTimeout(() => {
                buttonContainerWidth = buttonContainer.offsetWidth || 120;
                buttonContainerHeight = buttonContainer.offsetHeight || 40;

                // Position after getting correct dimensions
                positionButtons();

                // Reveal buttons after they are positioned correctly
                setTimeout(() => {
                    buttonContainer.style.opacity = "0.9";
                }, 10);
            }, 0);
        } else {
            // We already have dimensions, position immediately
            positionButtons();
            // Reveal buttons after a brief delay to ensure they're positioned correctly
            setTimeout(() => {
                buttonContainer.style.opacity = "0.9";
            }, 10);
        }

        // Helper function to position the buttons now that we have dimensions
        function positionButtons() {
            // Adjust margins based on if we're in fullscreen mode
            const isFullscreen =
                chart.isFullscreen ||
                buttonContainer.closest(".nba-fullscreen-lightbox") !== null;

            // Adjust margins based on display mode and device
            const marginRight = isFullscreen
                ? nbacc_utils.isMobile()
                    ? 20
                    : 30
                : nbacc_utils.isMobile()
                ? 10
                : 20;
            const marginBottom = isFullscreen ? 20 : 10;

            // Always position the buttons inside the chart area, regardless of zoom/pan level
            buttonContainer.style.position = "absolute";

            // Position from the right edge of the chart area
            buttonContainer.style.left = `${
                chartArea.right - buttonContainerWidth - marginRight
            }px`;

            // Position from the bottom edge of the chart area
            buttonContainer.style.top = `${
                chartArea.bottom - buttonContainerHeight - marginBottom
            }px`;

            // Remove bottom and right positioning which could conflict
            buttonContainer.style.bottom = "auto";
            buttonContainer.style.right = "auto";

            // Ensure buttons remain above the chart
            buttonContainer.style.zIndex = "10";

            // Add subtle transition for smoother repositioning
            buttonContainer.style.transition = "all 0.15s ease-out";

            // Add drop shadow to make buttons more visible on various backgrounds
            buttonContainer.style.filter = "drop-shadow(0px 2px 3px rgba(0,0,0,0.3))";
        }
    }
}

// Custom external tooltip handler that supports HTML and sticky behavior
// Make it available globally
window.externalTooltipHandler = (context) => {
    try {
        // Basic safety check
        if (!context || !context.chart) {
            console.log("Missing context in externalTooltipHandler");
            return;
        }
        
        // Skip tooltips on mobile unless in fullscreen mode
        if (nbacc_utils.isMobile() && !context.chart.isFullscreen) {
            return;
        }

        // Get or create tooltip element and handle its lifecycle
        const tooltipEl = getOrCreateTooltipElement();
        if (!tooltipEl) {
            console.log("Failed to create tooltip element");
            return;
        }

        // Get tooltip model
        const tooltipModel = context.tooltip;
        if (!tooltipModel) {
            console.log("Missing tooltipModel in externalTooltipHandler");
            return;
        }
        
        // Handle tooltip visibility based on model state and stickiness
        if (!handleTooltipVisibility(tooltipEl, tooltipModel)) {
            return; // Exit if tooltip should be hidden
        }

        // Set tooltip orientation (above/below/etc)
        setTooltipOrientation(tooltipEl, tooltipModel);

        // Generate and set tooltip content
        if (tooltipModel.body && tooltipModel.dataPoints && tooltipModel.dataPoints.length > 0) {
            // Safely extract values with additional checks
            const dataPoint = tooltipModel.dataPoints[0];
            if (!dataPoint) return;
            
            const datasetIndex = dataPoint.datasetIndex;
            const index = dataPoint.dataIndex;
            
            if (context.chart && context.chart.data && 
                context.chart.data.datasets && 
                datasetIndex < context.chart.data.datasets.length) {
                const dataset = context.chart.data.datasets[datasetIndex];
                
                if (dataset) {
                    // Generate tooltip content based on dataset type
                    generateTooltipContent(
                        tooltipEl,
                        context,
                        tooltipModel,
                        datasetIndex,
                        index,
                        dataset
                    );
                }
            }
        }

        // Set tooltip border color and position
        try {
            const borderColor = determineTooltipBorderColor(context, tooltipModel);
            tooltipEl.style.borderColor = borderColor;
        } catch (error) {
            console.error("Error setting tooltip border color:", error);
            tooltipEl.style.borderColor = "rgba(0, 0, 0, 0.5)";
        }

        // Position the tooltip on screen
        try {
            nbacc_utils.calculateTooltipPosition(tooltipEl, context, tooltipModel);
        } catch (error) {
            console.error("Error positioning tooltip:", error);
            // Default positioning
            tooltipEl.style.left = "50%";
            tooltipEl.style.top = "50%";
            tooltipEl.style.transform = "translate(-50%, -50%)";
        }
    } catch (error) {
        console.error("Unhandled error in externalTooltipHandler:", error);
    }
};

/**
 * Gets existing tooltip element or creates a new one
 * @returns {HTMLElement} Tooltip element
 */
function getOrCreateTooltipElement() {
    let tooltipEl = document.getElementById("chartjs-tooltip");

    if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.id = "chartjs-tooltip";
        tooltipEl.innerHTML = "<table></table>";

        // On mobile, make tooltips sticky by default to improve usability
        tooltipEl.setAttribute("data-sticky", nbacc_utils.isMobile() ? "true" : "false");
        document.body.appendChild(tooltipEl);

        // Add device-specific event handlers
        if (!nbacc_utils.isMobile()) {
            setupDesktopTooltipBehavior(tooltipEl);
        }
    }

    return tooltipEl;
}

/**
 * Sets up desktop-specific tooltip behavior with hover interactions
 * @param {HTMLElement} tooltipEl - The tooltip element
 */
function setupDesktopTooltipBehavior(tooltipEl) {
    // Add mouse enter event - make tooltip sticky temporarily
    tooltipEl.addEventListener("mouseenter", () => {
        tooltipEl.setAttribute("data-sticky", "true");

        // Auto-hide after delay to prevent tooltips staying open indefinitely
        const TOOLTIP_AUTO_HIDE_DELAY = 4000; // ms
        if (tooltipEl.stickyTimeout) {
            clearTimeout(tooltipEl.stickyTimeout);
        }

        tooltipEl.stickyTimeout = setTimeout(() => {
            tooltipEl.setAttribute("data-sticky", "false");
            tooltipEl.style.opacity = 0;
        }, TOOLTIP_AUTO_HIDE_DELAY);
    });

    // Add mouse leave event - remove stickiness and hide
    tooltipEl.addEventListener("mouseleave", (event) => {
        tooltipEl.setAttribute("data-sticky", "false");

        // Clear any pending timeout
        if (tooltipEl.stickyTimeout) {
            clearTimeout(tooltipEl.stickyTimeout);
        }

        // Hide tooltip immediately
        tooltipEl.style.opacity = 0;

        // Clean up content after hiding
        setTimeout(() => {
            if (tooltipEl.style.opacity === "0") {
                const tableRoot = tooltipEl.querySelector("table");
                if (tableRoot) {
                    tableRoot.innerHTML = "";
                }
                document.body.style.cursor = "default";
            }
        }, 300);
    });
}

/**
 * Handles tooltip visibility based on model state and stickiness
 * @param {HTMLElement} tooltipEl - The tooltip element
 * @param {Object} tooltipModel - The tooltip model from Chart.js
 * @returns {boolean} True if tooltip should be shown, false otherwise
 */
function handleTooltipVisibility(tooltipEl, tooltipModel) {
    // Get current stickiness state
    const isSticky = tooltipEl.getAttribute("data-sticky") === "true";
    const isHovered = tooltipEl.matches(":hover");
    
    // Prevent hiding when hovering on tooltip (prevents flickering when moving between tooltip and point)
    if (isHovered) {
        return true;
    }
    
    // Add a small delay in hiding tooltips to prevent flickering
    if (tooltipModel.opacity === 0 && !isSticky) {
        // If not sticky and model says to hide, add a small delay before hiding
        if (!tooltipEl.hideTimer) {
            tooltipEl.hideTimer = setTimeout(() => {
                tooltipEl.style.opacity = 0;
                tooltipEl.hideTimer = null;
            }, 100); // 100ms delay before hiding tooltip
            return true; // Keep showing during delay
        }
    } else {
        // Cancel hide timer if we're showing the tooltip again
        if (tooltipEl.hideTimer) {
            clearTimeout(tooltipEl.hideTimer);
            tooltipEl.hideTimer = null;
        }
    }
    
    return true;
}

/**
 * Sets tooltip orientation classes
 * @param {HTMLElement} tooltipEl - The tooltip element
 * @param {Object} tooltipModel - The tooltip model from Chart.js
 */
function setTooltipOrientation(tooltipEl, tooltipModel) {
    tooltipEl.classList.remove("above", "below", "no-transform");
    if (tooltipModel.yAlign) {
        tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
        tooltipEl.classList.add("no-transform");
    }
}

/**
 * Generates and sets tooltip content based on dataset type
 * @param {HTMLElement} tooltipEl - The tooltip element
 * @param {Object} context - The Chart.js context
 * @param {Object} tooltipModel - The tooltip model
 * @param {number} datasetIndex - The index of the dataset
 * @param {number} index - The index within the dataset
 * @param {Object} dataset - The dataset object
 */
function generateTooltipContent(
    tooltipEl,
    context,
    tooltipModel,
    datasetIndex,
    index,
    dataset
) {
    // Safety checks
    if (!tooltipEl || !context || !tooltipModel || !dataset || 
        datasetIndex === undefined || index === undefined) {
        console.log("Missing parameters in generateTooltipContent");
        return;
    }

    try {
        const titleLines = tooltipModel.title || [];
        let innerHtml = createTooltipHeader(titleLines[0] || "");

        // Make sure context.chart exists before checking calculate_occurrences
        if (!context.chart) {
            console.log("Missing context.chart in generateTooltipContent");
            innerHtml += "</tbody>";
            tooltipEl.querySelector("table").innerHTML = innerHtml;
            return;
        }

        // Determine which content generator to use based on dataset type
        const isCalculateOccurrences = context.chart.calculate_occurrences || false;
        
        if (datasetIndex % 2 === 0 && !isCalculateOccurrences) {
            // This is a regression line - show all regression data for this x-value
            innerHtml += generateRegressionLineTooltipBody(
                context,
                dataset,
                index,
                pointMarginData || {}
            );
        } else if (dataset && dataset.type === "scatter") {
            // This is a scatter point - show game examples
            innerHtml += generateScatterPointTooltipBody(
                context,
                dataset,
                index,
                datasetIndex
            );
        }
        
        innerHtml += "</tbody>";

        // Update tooltip content
        const tableRoot = tooltipEl.querySelector("table");
        if (tableRoot) {
            tableRoot.innerHTML = innerHtml;
        }

        // Set up close button event handler
        setupTooltipCloseButton(tooltipEl);
    } catch (error) {
        console.error("Error in generateTooltipContent:", error);
        // Create minimal content in case of error
        const tableRoot = tooltipEl.querySelector("table");
        if (tableRoot) {
            tableRoot.innerHTML = "<thead><tr><th>Chart Data</th></tr></thead><tbody></tbody>";
        }
    }
}

/**
 * Creates the tooltip header HTML with title and close button
 * @param {string} title - The tooltip title text
 * @returns {string} Header HTML
 */
function createTooltipHeader(title) {
    const titleFontSize = nbacc_utils.isMobile() ? "11px" : "15px"; // 25% smaller on mobile

    return `<thead>
        <tr>
            <th class="title-text">
                ${title}
                <span class="tooltip-close">×</span>
            </th>
        </tr>
    </thead><tbody>`;
}

/**
 * Sets up the tooltip close button click handler
 * @param {HTMLElement} tooltipEl - The tooltip element
 */
function setupTooltipCloseButton(tooltipEl) {
    const closeBtn = tooltipEl.querySelector(".tooltip-close");
    if (closeBtn) {
        // Clone to remove any existing event listeners
        closeBtn.replaceWith(closeBtn.cloneNode(true));

        // Get new button and add event listener
        const newCloseBtn = tooltipEl.querySelector(".tooltip-close");
        newCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Hide tooltip
            tooltipEl.style.opacity = 0;
            tooltipEl.setAttribute("data-sticky", "false");

            // Clean up content after hiding
            setTimeout(() => {
                const tableRoot = tooltipEl.querySelector("table");
                if (tableRoot) {
                    tableRoot.innerHTML = "";
                }
                document.body.style.cursor = "default";
            }, 300);

            return false;
        });
    }
}

/**
 * Determines tooltip border color based on dataset type
 * @param {Object} context - The Chart.js context
 * @param {Object} tooltipModel - The tooltip model
 * @returns {string} Border color CSS value
 */
function determineTooltipBorderColor(context, tooltipModel) {
    let borderColor = "rgba(255, 255, 255, 0.6)"; // Default fallback color

    // Basic validation checks
    if (!context || !context.chart || !tooltipModel || 
        !tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) {
        return borderColor;
    }

    const dataPoint = tooltipModel.dataPoints[0];
    if (!dataPoint || dataPoint.datasetIndex === undefined) {
        return borderColor;
    }

    const datasetIndex = dataPoint.datasetIndex;
    
    // Verify the dataset exists
    if (!context.chart.data || !context.chart.data.datasets || 
        datasetIndex >= context.chart.data.datasets.length) {
        return borderColor;
    }
    
    const dataset = context.chart.data.datasets[datasetIndex];

    // Determine color based on dataset type
    if (!context.chart.calculate_occurrences && datasetIndex % 2 === 0) {
        // For regression lines, use a medium-dark gray
        borderColor = "rgba(80, 80, 80, 0.9)";
    } else {
        // For scatter points, use dataset color with consistent opacity
        const lineIndex = context.chart.calculate_occurrences
            ? datasetIndex
            : Math.floor(datasetIndex / 2);

        const colors = nbacc_utils.getColorWheel(0.5);
        const color = colors[lineIndex % colors.length];

        // Make border color more opaque for better visibility
        if (typeof color === "string" && color.includes("rgba")) {
            borderColor = color.replace(
                /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/,
                "rgba($1, $2, $3, 0.9)"
            );
        } else {
            borderColor = color;
        }
    }

    return borderColor;
}
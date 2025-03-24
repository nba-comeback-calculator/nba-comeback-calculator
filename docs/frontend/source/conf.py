# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "nba comeback calculator"
copyright = "2025, Andrew Carter"
author = "Andrew Carter"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    #     'ablog',
    "sphinx.ext.intersphinx"
]

templates_path = ["_templates"]
exclude_patterns = []


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

# html_theme = 'alabaster'
html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]
html_css_files = [
    "css/nbacc.css",
    "css/nbacc-media.css",
    "css/nbacc-calculator.css",
    "https://cdnjs.cloudflare.com/ajax/libs/basicLightbox/5.0.0/basicLightbox.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-select@1.14.0-beta3/dist/css/bootstrap-select.min.css",
]


# https://stackoverflow.com/questions/1517924/javascript-mapping-touch-events-to-mouse-events/1781750#1781750

html_js_files = [
    # External JS Dependencies
    "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js",
    "https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-zoom/2.2.0/chartjs-plugin-zoom.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/basicLightbox/5.0.0/basicLightbox.min.js",
    "https://cdn.jsdelivr.net/npm/mathjs@11.8.0/lib/browser/math.min.js",
    "https://cdn.jsdelivr.net/npm/fmin@0.0.4/build/fmin.min.js",
    "https://code.jquery.com/jquery-3.6.4.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap-select@1.14.0-beta3/dist/js/bootstrap-select.min.js",
    
    # Local JS in dependency order
    # 1. Base utilities
    "js/nbacc_utils.js",
    "js/nbacc_saveas_image_dialog.js",
    "js/nbacc_plotter_plugins.js",
    
    # 2. Numerical functions
    "js/nbacc_calculator_num.js",
    
    # 3. Core modules
    "js/nbacc_plotter_data.js",
    "js/nbacc_plotter_core.js",
    "js/nbacc_plotter_ui.js",
    "js/nbacc_chart_loader.js",
    
    # 4. Calculator modules
    "js/nbacc_calculator_season_game_loader.js",
    "js/nbacc_calculator_plot_primitives.js",
    "js/nbacc_calculator_api.js",
    
    # 5. UI module
    "js/nbacc_calculator_ui.js",
]

html_context = {
    "default_mode": "light",
}
html_theme_options = {
    # Note we have omitted `theme-switcher` below
    "navbar_start": ["navbar-logo"],
    # "navbar_center": [],
    "navbar_persistent": [],
    # "navbar_end": ["navbar-icon-links", "search-button"],
    "navbar_end": ["search-button"],
    "show_prev_next": False,
    "logo": {
        "text": "nba comeback calculator",
        # "image_light": "_static/logo-light.png",
    },
    "analytics": {
        "google_analytics_id": "G-6Q6K588YXL",
    },
}

html_show_sourcelink = False

html_sidebars = {
    "**": [],
}

# NBA Comeback Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**What lead is safe and what comeback is possible?** 

The NBA Comeback Calculator analyzes over 25 years of NBA play-by-play data (1996-2024) to scientifically answer this question. By analyzing thousands of games, we can determine the probability of a successful comeback based on point deficit, time remaining, team ranking, and home/away status.

## Website

Visit our site at [nba-comeback-calculator.github.io](https://nba-comeback-calculator.github.io) to explore:

- **Analysis**: Trends in NBA comebacks over time
- **Methodology**: How the data was compiled and analyzed
- **Plots**: Pre-generated charts for common scenarios
- **Interactive Calculator**: Create your own custom analyses

## Features

- **Statistical Analysis**: Win probabilities by point margin across different game situations
- **Historical Trends**: Compare comeback rates across different NBA eras
- **Team-specific Analysis**: Filter data by team, rank, or home/away status
- **Interactive Calculator**: Generate custom charts with your own parameters
- **Data Visualization**: Modern, interactive charts using Chart.js

## Technical Overview

This project consists of two main components:

1. **Python Backend**: Data acquisition and statistical analysis
   - Downloads play-by-play data from stats.nba.com
   - Processes data into SQLite database and JSON season files
   - Performs statistical analysis using probit regression
   - Generates chart data JSON files

2. **JavaScript Frontend**: Data visualization and interactive calculator
   - Renders interactive charts using Chart.js
   - Provides interactive calculator with filtering options
   - Implements statistical analysis in browser
   - Offers features like zooming, full-screen mode, and PNG export

## Project Structure

### Python Components
```
nba_comeback_calculator/
├── form_json_season_data/       # Data acquisition
│   ├── form_nba_game_sqlite_database.py  # Creates SQLite database
│   └── form_nba_game_json_seasons.py     # Generates season JSON files
└── form_json_chart_data/        # Chart data generation
    ├── form_nba_chart_json_data_api/     # Core analysis library
    └── form_nba_chart_json_data_for_sphinx_pages/  # Chart generation scripts
```

### JavaScript Frontend
```
docs/frontend/source/_static/
├── js/                 # JavaScript modules
├── css/                # Styling
└── json/               # Chart and season data
    ├── seasons/        # Season data files (1996-2024)
    └── charts/         # Generated chart data
```

## Key Findings

- The relationship between deficit and time follows approximately a square root curve (√t)
- Modern NBA (2014+) shows slightly higher comeback rates than previous eras
- Home teams have significantly better comeback rates than away teams
- Top-ranked teams making comebacks against bottom-ranked teams show the highest success rates

## Local Development

### Prerequisites

- Python 3.8+
- Sphinx (for documentation site)

### Installation

```bash
# Clone the repository
git clone https://github.com/nba-comeback-calculator/nba-comeback-calculator.git
cd nba-comeback-calculator

# Install Python dependencies
pip install -r requirements.txt

# Build documentation
cd docs/frontend
make html
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- NBA Stats API for the raw play-by-play data
- Chart.js for visualization
- Sphinx for documentation
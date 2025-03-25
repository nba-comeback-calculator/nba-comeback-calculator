***************************
How Trend Lines Were Formed
***************************

`transform <https://stattrek.com/regression/transformations-in-regression>`_

`transform2 <https://online.stat.psu.edu/stat501/book/export/html/956>`_

Normal Probability Plots
========================

As briefly as possible, when you collect statistical data, that data is often normally
distributed. This appears to be the case with the NBA data we've collected. This is
very helpful because it means that we can simply plot the data on a `normal probability
plot <https://en.wikipedia.org/wiki/Normal_probability_plot>`_ and the data will mostly
-- except for outliers -- fall on a straight line.

Then, a trend line through that data can be found using simple linear regression (this
is not as accurate as fitting the data using maximum likelihood estimation, but it's
more than good enough for our purposes). Having this trend line allows us to compare
probabilities of events more easily and cuts out the noise of the actual data. This of
course only works if the trend line is actually a good fit for the data, `and
thankfully we can use the R² value to tell us this
<https://statisticsbyjim.com/regression/interpret-r-squared-regression/>`_. Most of the
trend line R values used in this analysis are 0.95 with many in the large game data set
about 0.98 or higher. Of course, the smaller the number of games, the more outliers and
the worse the fit, driving us to consider larger periods of time to see the trends
(always making recent trend analysis more difficult).

So to tell if you have normal data, you convert the cumulative probabilities of the
event happening from percentages to how many normal standard deviations they are from
the mean (using `a unit normal's ppf function
<https://medium.com/@rathibala96/probability-distributions-a-comprehensive-guide-to-pmf-pdf-and-cdf-ppf-297fbb2f6803>`_
). Then you plot it and see if you can fit a straight line to it.

For the problem of "what is the chance of winning when down N points starting at X
time", the data is very normal, from large negative point margins to very high ones.
Take this plot here showing the win probability of a team down 24 points at the half on
all the data I have from 1996. The data is very normal, and the trend line is a very
good fit:

.. raw:: html

    <div id="nbacc_point_final_24_mirror_eras_all" class="nbacc-chart"></div>

Note, the mean is simply a tie at the half, and everything to the right is by
construction a mirror of everything to the left (the team that came back from 34 down
at the half beat the only team that gave up a 34 point lead at the half: 11/27/1996 DEN
@ UTA: 103-107).

Here, the actual y values are the number of standard deviations (or sigmas) from the
mean, both positive and negative. I've simply changed the y-axis labels to be the
standard probabilities that we are used to talking about.

If I didn't change the axis, the plot would look like this: where -1 is one standard
deviation to the left of the mean (or about a 16% chance of winning) and -2 is two
standard deviations to the left of the mean (or about a 2% chance of winning), etc.

.. raw:: html

    <div id="nbacc_point_final_24_mirror_normal_labels_eras_all" class="nbacc-chart"></div>

The data forms almost a perfectly straight line, making fitting a good trend line
possible. In fact, to check the R² value, you can simply press the 'R' key when
hovering over a trend line data point and it will show you the value. For this case, R²
is 0.98, meaning a very good fit.

Note, on all regression fits, I throw out all points with only 1 or 2 wins of data to
reduce the 'overfitting' of outliers. Again, this could have been mitigated by using
maximum likelihood estimation, something I may look into later (some technical details
about that as well). Overall, I'm happy with the trend lines and think they are a very
good representation of the data.


Down Max or More Points
=======================
.. raw:: html

    <div id="nbacc_max_or_more_48_full_eras_all" class="nbacc-chart"></div>


.. raw:: html
    
    <div id="nbacc_max_or_more_48_full_normal_labels_eras_all" class="nbacc-chart"></div>


Down Max Points
===============

.. raw:: html

    <div id="nbacc_max_48_full_eras_all" class="nbacc-chart"></div>


.. raw:: html
    
    <div id="nbacc_max_48_full_normal_labels_eras_all" class="nbacc-chart"></div>


Is This Data Normally Distributed?
==================================

.. code::
    
    # Imports ...
    import numpy as np
    import pylab
    from scipy.stats import norm

    # First, find all the point margins at halftime. Here the point margin
    # is defined by point_margin = home_score - away_score.
    point_margins = []
    for game in games:
        point_margins.append(game.score_stats_by_minute.point_margins[24])
    # Sort the point margins and find the empirical CDF
    point_margins = sorted(point_margins)
    emp_cdf = [(i + 0.5) / len(point_margins) for i in range(len(point_margins))]
    normal_emp_cdf = [unorm.ppf(x) for x in emp_cdf]
    # Fit data using a MLE estimator
    (mean, sigma) = norm.fit(point_margins)
    pylab.plot(point_margins, cdf, "ro", alpha=0.5, markersize=10)
    cdf_fit = (np.array(point_margins) - mean) / sigma
    pylab.grid()
    pylab.plot(point_margins, cdf_fit, "b-", alpha=0.75, linewidth=5)
    pylab.legend(["Empirical CDF", "MLE Normal Fit"])
    pylab.xlabel("Point Differential (Home - Away)")
    pylab.ylabel("Standard Deviations From Mean (\u03c3)")
    pylab.title(
        f"Point Differential (Home - Away) At Halftime "
        f"(\u03bc={mean:.2f}, \u03c3={sigma:.2f}) for 1996-2024 Season "
        f"({len(games)} Data Points)"
    )
    pylab.show()


.. image:: half_scores.png
   :scale: 33%
   :align: center

..
    .. pull-quote::

        Question: 

        I am trying to analyze some NBA data and having some trouble understanding what 
        statistical models to apply.

        First the easy problem: let's say you get the point margin at halftime for all NBA 
        games from 1996 to now where point margin is defined by point_margin = home_score - 
        away_score. This leads to roughly 32000 points. Then, you can form the empirical 
        cdf as defined here https://en.wikipedia.org/wiki/Empirical_distribution_function 
        and plot this on a normal probability plot. This is very linear, so you can use a 
        standard maximum likelihood estimator (MLE) for a normal distribution like the one 
        found in python package scipy.stats.norm. So now you have a model: the variable for 
        point_margin is normally distributed with a mean of about 0 and a sigma of 10.

        But I have a different problem. I want to define the set of all games at a given 
        point margin and find the winning probability, where winning_prob = 
        (number_of_games_won_at_point_margin)/(total_number_of_games_at_point_margin).

        This leads to a single binomial distribution at every point margin and we can get 
        the winning probability p from that distribution. Now if I ignore the points with no 
        wins or only wins, and plot these probabilities on a normal axis, it also appears 
        normal. That is the normal cdf function is a good model of these binomial 
        probabilities. What kind of statistical model is this? How should one think about 
        modeling data like this?

        Answer:

        Analyzing NBA Game Outcomes Based on Halftime Point Margins

        You're dealing with an interesting statistical modeling problem! Based on your 
        description, I can identify the model you're observing.

        What You're Describing
        You've created a relationship between:

        Input: Point margin at halftime (home_score - away_score)
        Output: Probability of winning the game
        
        And you've noticed that when you plot these winning probabilities against point 
        margins, the relationship follows what appears to be a normal cumulative 
        distribution function (CDF).

        The Statistical Model: Probit Regression
        What you're describing is best modeled as a probit regression. This is a type of 
        generalized linear model specifically designed for binary outcomes (win/loss) where:

        The relationship between your predictor (point margin) and the probability of 
        winning follows a normal CDF
        
        The model can be written as: P(win|point_margin) = Φ(β₀ + β₁ × point_margin)
        
        Where Φ is the CDF of the standard normal distribution
        
        Your empirical approach (calculating winning percentages at each margin) gives you 
        a non-parametric view of this relationship, but the probit model provides a 
        parametric way to express it.

        Implementation in Python
        Here's how you could implement this model:

        nba_probit_model.py
        import numpy as np
        import pandas as pd
        import matplotlib.pyplot as plt
        from scipy import stats
        from sklearn.linear_model import LogisticRegression
        
        Why This Model Makes Sense
        The probit model is particularly appropriate here because:

        Basketball score differentials often follow approximately normal distributions
        
        The impact of point margin on win probability is non-linear (each additional point 
        has diminishing returns)
        
        The relationship naturally bounds the probabilities between 0 and 1
        
        It accounts for the "S-shaped" relationship between margin and win probability
        
        Alternative: Logistic Regression
        A close alternative would be logistic regression, which uses the logistic function 
        instead of the normal CDF. In practice, probit and logistic regression often give 
        similar results, but since you specifically observed that the pattern follows a 
        normal CDF, probit is likely the better choice.

        Would you like me to elaborate on any aspect of this model or suggest ways to 
        extend it with additional variables beyond just the halftime margin?

        Code:

        import numpy as np
        import pandas as pd
        import matplotlib.pyplot as plt
        from scipy import stats
        from sklearn.linear_model import LogisticRegression
        from statsmodels.discrete.discrete_model import Probit
        import statsmodels.api as sm

        # Assume df is your DataFrame with columns:
        # - halftime_margin (home - away points at halftime)
        # - home_win (1 if home team won, 0 if lost)

        # 1. Empirical approach (what you've been doing)
        # Group by margin and calculate win probability
        margin_groups = df.groupby('halftime_margin')['home_win'].agg(
            ['mean', 'count']
        ).reset_index()
        margin_groups.rename(columns={'mean': 'win_probability'}, inplace=True)

        # Filter out margins with very few games (optional)
        margin_groups = margin_groups[margin_groups['count'] >= 10]

        # 2. Fit probit model
        # Add constant for intercept
        X = sm.add_constant(df['halftime_margin'])
        probit_model = Probit(df['home_win'], X)
        probit_results = probit_model.fit()

        # Print model summary
        print(probit_results.summary())

        # 3. Visualize results
        plt.figure(figsize=(10, 6))

        # Plot empirical probabilities
        plt.scatter(
            margin_groups['halftime_margin'], 
            margin_groups['win_probability'], 
            alpha=0.6, 
            label='Empirical Win Probability'
        )

        # Generate predictions from probit model
        margin_range = np.arange(
            df['halftime_margin'].min(), 
            df['halftime_margin'].max()+1
        )
        X_pred = sm.add_constant(margin_range)
        predicted_probs = probit_results.predict(X_pred)

        # Plot probit model curve
        plt.plot(
            margin_range, 
            predicted_probs, 
            'r-', 
            linewidth=2, 
            label='Probit Model'
        )

        # Normal CDF for comparison
        mu, std = stats.norm.fit(df['halftime_margin'])
        # Using approximate sigma=10
        norm_cdf = stats.norm.cdf(margin_range, loc=0, scale=10)
        plt.plot(
            margin_range, 
            norm_cdf, 
            'g--', 
            linewidth=1, 
            label='Normal CDF (μ=0, σ=10)'
        )

        plt.xlabel('Halftime Point Margin (Home - Away)')
        plt.ylabel('Probability of Home Team Winning')
        plt.title('Relationship Between Halftime Margin and Win Probability')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.show()

        # 4. Analyzing the model fit
        # Calculate margin needed for specific win probabilities
        def margin_for_probability(probability, beta0, beta1):
            """Calculate the margin needed for a specific win probability"""
            z_score = stats.norm.ppf(probability)  # inverse of normal CDF
            margin = (z_score - beta0) / beta1
            return margin

        # Examples
        beta0, beta1 = probit_results.params
        print(f"Margin for 50% win probability: {margin_for_probability(0.5, beta0, beta1):.2f}")
        print(f"Margin for 75% win probability: {margin_for_probability(0.75, beta0, beta1):.2f}")
        print(f"Margin for 90% win probability: {margin_for_probability(0.9, beta0, beta1):.2f}")
*****************************
Forming the Plot Trend Lines
*****************************


.. _trend-lines-help-reduce-statistical-noise:

Trend Lines Help Reduce Statistical Noise
=========================================

The purpose of the trend lines is to fit a statistically valid model to the data.  The
real data will have fluctuations, especially as you reduce the number of games in
whatever set you are looking at.  For example, look at the points down at half chart
for regular season and playoffs games for 2017-2024 (~10k games) versus just the
playoff games (~600 games).

.. raw:: html

    <div id="trend/nbacc_at_24_compare_eras" class="nbacc-chart"></div>

As you can see, the smaller data set is "noisier", but the trend lines help cut through
the noise so we can compare two datasets as best we can.

.. _how-to-form-the-trend-lines:

How To Form The Trend Lines
===========================

Usually, the best model is a line.  However, our data is not linear with respect to
probability.  For example, look at the points down at the half when plotted on a linear
y axis:

.. raw:: html

    <div id="trend/nbacc_at_24_linear_axis" class="nbacc-chart"></div>

As is, this is not very useful, as all the events we care about are smooshed down
together at the bottom of the y-axis.

What we can do, however, is find a function which will convert our non-linear data to a
linear domain.  For example, often people will use the :math:`ln` function `when
dealing with exponential data
<https://leancrew.com/all-this/2020/03/exponential-growth-and-log-scales/>`_.

With statistical data, the first go-to is the inverse of the unit normal (Gaussian)
cumulative distribution function (CDF), which is denoted Φ⁻¹.

Applying that function to our data, we get this chart:

.. raw:: html

    <div id="trend/nbacc_at_24_normal_labels" class="nbacc-chart"></div>


As you can see, now the data looks very linear. By applying this transformation, we
have created a `normal probability plot
<https://en.wikipedia.org/wiki/Normal_probability_plot>`_, which is often used to get a
sense of how normal your data is. This is what all of our 'Max Points Down' or 'Points
Down at Time' charts are: normal probability plots.

Usually, these plots are shown with the y-axis in standard deviations from the mean (or
sigmas). I've simply changed the y-axis labels to show the standard probabilities that
we are used to talking about: for example, -1 sigma maps to about 15.8%, -2 to 2.2%,
and -3 to 0.13%, etc.


.. _how-to-fit-the-line:

How to Fit The Line
===================

Now, the goal is simply to find the slope and y-intercept for our trend line in a way
that is statistically valid. This is a `standard logistic / probit regression problem
<https://en.wikipedia.org/wiki/Logistic_regression>`_  where our descriptor variable
(the point margin) determines the probability of an outcome (winning the game).

For probit regression, this means:

.. math::
        
    P(\text{win} \mid \text{point_margin}) = \Phi(\beta_0 + \beta_1 \times \text{point_margin})

For probit, the link function :math:`\Phi` is the normal cumulative distribution
function. For logit regression, we would use the logit as the link function.  To find
the :math:`\beta_0` and :math:`\beta_1` we use standard maximum likelihood estimation
(MLE), which gives us the most statistically sound way of finding our model (as opposed
to, say, linear regression) .

The major question is whether to use logit or probit.  And the answer is probit because
the inverse CDF function does a better job of linearizing our data, meaning it is more
likely to be the correct underlying model.  Looking at the tail using the two methods
we get:

.. image:: probit_v_logit.png
   :scale: 33%
   :align: center

As you can see, the inverse normal CDF does a better job at linearizing the data.

This bears out when using the two methods and comparing returned p values and fit lines
across various cases.  Using probit for our current set of conditions, we get:

.. raw:: html

    <div id="trend/nbacc_at_24_probit" class="nbacc-chart"></div>


And using logit logistical regression we get:

.. raw:: html

    <div id="trend/nbacc_at_24_logit" class="nbacc-chart"></div>

This produces a poor fit in the tail region, which is especially problematic because
the low probability events are the ones with which we are most concerned.

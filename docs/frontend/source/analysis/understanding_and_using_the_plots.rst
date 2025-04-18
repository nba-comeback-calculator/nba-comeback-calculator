*******************************************
Understanding and Using The Comeback Charts
*******************************************

What do we mean by "comeback" and what's the best way to view the "chances" of a
comeback? It seems like a simple question, but there's some nuance to it as there are
slightly different ways of defining it. Let's explore the four plot types used in this
project:

* `Max Points Down Or More`_
* `Max Points Down`_
* `Points Down At Time`_
* `Percent Chance of Winning: Time v. Points Down`_

.. green-box::

    Note, for the first three plot types, the percent chance of coming back versus
    point deficit is normally distributed.  So when plotted on a `normal probability
    plot <https://en.wikipedia.org/wiki/Normal_probability_plot>`_ and :doc:`we fit
    trend lines (e.g. fit a normal model) to the statistical data
    </analysis/methodology_forming_the_plot_trend_lines>` we can then better examine
    the lower probability events and also more easily compare different eras or
    situations.

    The final plot type uses these normal fits across many different conditions to
    create the time v. point down plots.

.. _max-points-down-or-more:

Max Points Down Or More
=======================

The first, maybe most common way people talk about comebacks is found in a line `taken
from this ESPN article
<https://www.espn.com/nba/story/_/id/39698420/no-lead-safe-nba-big-comebacks-blown-leads>`_:

.. pull-quote::

    The frequency of 10-point and 15-point comebacks has increased as well. In 1997-98,
    teams that fell behind by double digits had an .181 winning percentage. That
    climbed to .250 a season ago and is at .229 this season, meaning nearly one in
    every four games in which a team takes a double-digit lead ends with
    the-other-team-winning.

It's important to note here, that when it's said a team is down by 10, they mean *10
points or more* points or down by 15 points means *15 or more* points.  This leads to
this chart:

.. raw:: html

    <div id="understand/nbacc_max_or_more_48_espn_0" class="nbacc-chart"></div>

You can see the -10 point margin point lines up with these statistics exactly.

It's important to note here that every point contains all the wins and losses for the
previous point margins. As we move from left to right, we are accumulating all the
games. This means that a given point margin (say -10) is getting weighted down with all
of the previous (and lower chance) probabilities, because the -10 point also includes
the wins/losses from -11, -12, -13, ..., -20, ..., -30, and on and on.

.. _max-points-down:

Max Points Down
===============

Even though this is a common way of talking about comebacks, it's a little unfair in a
sense. For the -10 point deficit, the odds of coming back are weighted down by all the
other more unlikely comebacks.

A somewhat fairer way to look at it is: the maximum point deficit you face *at most* --
that leads to these types of plots:

.. raw:: html

    <div id="understand/nbacc_max_48_eras_1" class="nbacc-chart"></div>

So here we see the raw data for being 10 points down is 53% for the modern era and 48%
for the old school era. What this is saying is that, on average, the winning team goes
down by at most 10 points at some point in the game -- and comes back! So if your team
is down 10 points, don't sweat it too hard, it's totally average.

.. green-box::

    Overall, I usually feel this is the fairest way to examine comeback data. Unlike
    max or more, as you move from left to right the stats aren't weighed down by the
    larger point margin cases.
    
    And unlike :ref:`points down at time plots <points-down-at-time>`, it accounts for
    the fact that a team might not be down at that specific time, but they may fall
    behind later in the game and still come back. For example, if a team is down 24
    points starting the 10th minute and stages a comeback (like the :ref:`Bucks did to
    our Twolves on 04/09/2025 <twolves-tie-a-dubious-nba-record>`) you want to compare
    against other teams that fell behind by 24 points at an even later time and still
    came back.

.. _points-down-at-time:

Points Down At Time
===================

But what about when you're watching a game and don't have the benefit of hindsight to
know what your max point deficit is going to be? As a fan, the most natural way to
think of it is -- I am down this many points right now, what are the odds? In this
case, you pick a certain point in time and collect all the point margins at that time
and determine the chance of winning, leading to plots like this:

.. raw:: html

    <div id="understand/nbacc_down_at_24_eras_1" class="nbacc-chart"></div>

So that chart shows: if your team is down 20 points at halftime, they have a 5% chance
of winning on average. You can use the :doc:`calculator <../calculator/index>` to try
as many different game times as you want.



.. _percent-chance-of-winning-time-v-points-down:

Percent Chance of Winning: Time v. Points Down
==============================================

Now, it's a little inconvenient to have to look at a different chart for every point in
time. So what you can further do is, behind the scenes:

1. Pick a percent chance you want to focus on, say 20% or 1%.
2. Calculate a `Points Down At Time`_ for every minute. Then invert the :doc:`trend
   lines </analysis/methodology_forming_the_plot_trend_lines>` to determine what point
   deficit matches your percentage. By using the trend line, we filter out the
   statistical noise and get the most accurate point deficit for our given probability.

Then you can make plots like this:
   
.. raw:: html

    <div id="plots/all_time_v_modern/percent_plot_group_0" class="nbacc-chart"></div>

Here, we also find the "Record" game -- that is, the game that overcame the largest
deficit at that time and provide that point with game data.


.. _using-the-plot-controls:

Plot Controls
=============

For the plots, you can hover over and then click on either:

1. Actual data taken from NBA games. This comes up when you click on the scatter plot
   points. Here you can look at the # Wins / # Games, the calculated Win %, how often
   this point deficit occurs (win or lose), and a few of the games that make up this
   point. The reported games are also hyperlinks, so you can go to NBA.com and view the
   play-by-play report and media coverage if available.
   
2. The trend line data points -- this shows you the "best" Win % chance for this
   point deficit :doc:`since the trend line filters out much of the statistical noise
   </analysis/methodology_forming_the_plot_trend_lines>`.
   
You can also zoom in or even go full screen to make it easier to hover over a point of
interest and if you want, save your current plot as an image.

On the :doc:`calculator page</calculator/index>`, once you form a chart for the
specific conditions you're after, you'll notice that a unique URL is formed which you
can copy and paste and share it how you see fit.

.. _how-win-is-calculated:

How Win % Is Calculated
=======================

The Win % number in the plots is calculated as:

.. math::

    \text{Win %} = \frac{\text{# of Wins @ Point Deficit}}{\text{# of Wins @ Point Deficit} + \text{# of Losses @ Point Deficit}}

This is a little unintuitive, because you might think it should be:

.. math::

    \text{Win %} = \frac{\text{# of Wins @ Point Deficit}}{\text{# of Games @ Point Deficit}}


In many cases, this is the same thing. Consider, however, the Win % for the case where
the score is tied at halftime. Let's say there are 1,000 such games in your set. Well,
there are 1,000 wins and 1,000 losses in these cases, so if you used the second formula
you would get a Win % = 50%, which is correct.

The same thing happens with the Max Down Or More plots. Some of the same games are both
wins and losses, so we use the first formula which matches with how the statistic is
generally reported.

Just note that in the hover boxes, the "Wins X out of Y Games" is using the total
number of games for the Y. So if you divide X/Y you might get a different number than
the Win %. Normally, the numbers are almost the same.
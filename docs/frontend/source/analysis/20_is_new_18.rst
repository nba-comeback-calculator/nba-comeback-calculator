****************
20 is the New 18
****************

.. _are-big-leads-no-longer-safe:

Are Big Leads No Longer Safe?
=============================

There's a sense that, in recent times, teams are busting out of big holes more often
than ever. Just as `Kevin Pelton and Baxter Holmes noted in 2019
<https://www.espn.com/nba/story/_/id/26725776/this-season-massive-comeback-nba>`_ , in
`'20 is the old 12': Why no lead is safe in the NBA anymore
<https://www.espn.com/nba/story/_/id/39698420/no-lead-safe-nba-big-comebacks-blown-leads>`_
ESPN reporter Andrew Lopez explains that 2023-24 has already seen the most 20-point
victories in a single season since 1996-97 and continues with analysis by Steve Kerr:

.. pull-quote::

    "Way more early possession 3s now. It just feels like you are up 12 and the other
    team gets two quick stops on you and they race down, they throw it ahead and they
    hit two 3s. It's a six-point game now. So 20 is the old 12; 12 is the old seven. I
    mean, there's definitely an awareness from everybody that leads are not safe."


But is this true? In short ... not really.

:ref:`To frame this, I decided to break up the available play-by-play
data<deciding-on-eras-breakdown>`into:

* 1996-97 to 2016-17 (old-school) versus:
* 2017-18 to 2024-25 (modern)

So while there's about 1.8x times as many 20 points-or-more comebacks comparing the
eras, the *chance* of coming back from 20 points-or-more down (``5.31%``) is about the
same as coming back from 18 points-or-more down (``4.88%``) back in the day.

Meaning leads are *roughly* as safe as they have been, maybe at most needing an extra
bucket.

.. _win-percentages-when-max-deficit-is-n-or-more-points:

Win Percentages When Max Deficit is N *Or More* Points
======================================================

:ref:`A very common way of looking looking at comebacks<max-points-down-or-more>` is
calculating the % chance of coming back from down N point *or more* over an entire game
we get:

.. raw:: html

    <div id="plots/old_school_v_modern/max_down_or_more_48" class="nbacc-chart"></div>

You can :ref:`interact with this chart <using-the-plot-controls>` and compare at
different point margins, but to focus on a few we get:

.. list-table:: Win % Increases When Comparing Modern Versus Old School Eras
   :header-rows: 1

   * - Point Margin
     - 1996-2016 Win %
     - 2017-2024 Win %
     - Total Win % Increase
   * - -30
     -  0.15 %
     -  0.42 %
     - 2.8x (180% increase)
   * - -20
     - 2.89 %
     - 5.31 %
     - 1.83x (80% increase)
   * - -18
     - 4.88 %
     - 7.93 %
     - 1.59x (60% increase)
   * - -15
     -  9.22 %
     - 12.82 %
     - 1.39x (39% increase)

So while coming back from down 30 or more happens 2.8 times more than in the past, it's
still very unlikely. In fact, you need to move over a little less than one
three-pointer to get about the same chance: in the old school era, if you were down -27
or more there was about a 0.48% chance of winning.

.. green-box::

    Note, this uses the raw data points, which is a little more intuitive. You can also
    do this using the trend line in the chart, which cleans up the noise in the data
    and is statistically more accurate. Overall, either way draws the same conclusion.

As time dwindles, this shift is slightly smaller. Looking at biggest 4th quarter
comebacks we get:

.. raw:: html

    <div id="plots/old_school_v_modern/max_down_or_more_12" class="nbacc-chart"></div>

Now, the shift is about 1.5 points, an even smaller shift.

To me at least, looking at the point shift gives me a better feel for how dramatically
(or not) the game has changed. I can be convinced you could look at it both ways (Win %
Increase is more dramatic, point shift is more modest) but as a fan watching your team
sink into a 20 point hole, I don't think the data is telling you to say "20 points,
that's nothing anymore".


.. _win-percentages-when-teams-are-down-n-points-with-so-much-time-left:

Win Percentages When Teams Are Down N Points With So Much Time Left
===================================================================

:ref:`Another way to look at it and the more natural way to think about it while you
are watching a game live<points-down-at-time>` (as opposed to describing a game after
the fact) is to look at the win percentages when teams are down *exactly* N points with
so much time left. Here's a chart for the start of the 2nd half:

.. raw:: html

    <div id="plots/old_school_v_modern/down_at_24" class="nbacc-chart"></div>

The data is a bit noisier here, because we are not accumulating the games as we move
from left to right like we did when looking at points down *or more*. Here, for the old
school era, we have the case that there was one game (``11/27/1996 DEN @ UTA:
103-107``) where UTA was down -34 at the half and won. But no team in that era won when
down -33, -32, -31, -30 or -29 at the half.

Now, the divide here is a little larger: being down -20 in the modern era is about the
same as being done 16.5 points in the old school era (3.5 point shift).

But as time decreases it tigthens up -- looking at starting the 4th quarter we have
being 20 points down (``0.17%``) being about the same as 17.8 points down new to old:

.. raw:: html

    <div id="plots/old_school_v_modern/down_at_12" class="nbacc-chart"></div>


And entering the final 6 minutes it gets tigther still:

.. raw:: html

    <div id="plots/old_school_v_modern/down_at_6" class="nbacc-chart"></div>


.. _20-is-18-win-versus-time:

Win % Versus Time
=================

So, collecting this data for every minute, :ref:`we can focus on a single percentage
and plot the time v point deficit for that percentage
<percent-chance-of-winning-time-v-points-down>`.  Doing that for 10% while comparing
the eras we get:

.. raw:: html

    <div id="plots/old_school_v_modern/percent_plot_10_percent" class="nbacc-chart"></div>


And doing it for 1% we get:

.. raw:: html

    <div id="plots/old_school_v_modern/percent_plot_1_percent" class="nbacc-chart"></div>

The point spread changes over time, but between 2 - 3 points is a fairly good
charaterization.


.. _occurrence-frequencies:

Occurrence Frequencies
======================

.. raw:: html

    <div id="nbacc_max_or_more_48_occurs_eras_0" class="nbacc-chart"></div>

.. raw:: html

    <div id="nbacc_down_or_more_at_12_occurs_eras_0" class="nbacc-chart"></div>


.. _deciding-on-eras-breakdown:

Why I Chose My Years Breakdown
==============================

If you:

* :doc:`Break up the old school eras into two even decades from 1996-2006 v 2007-2016
  </plots/old_old_school_v_old_school>` you can see there is very little shift in the
  numbers.

* Similarly, if you :doc:`break up the modern era into the more fine grained 4 year
  chunks of 2017-2020 v 2021-2024 </plots/new_school_v_new_new_school>` you again see
  very little difference.

So -- always wanting as many games as possible to reduce the statisitical noise -- I
felt that was the fairest breakdown: :doc:`1996-2016 v
2017-2024</plots/old_school_v_modern>`.


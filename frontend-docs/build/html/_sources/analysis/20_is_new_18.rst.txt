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

    "Way more early possession 3s now. It just feels like you are up 12 and the
    other team gets two quick stops on you and they race down, they throw it ahead
    and they hit two 3s. It's a six-point game now. So 20 is the old 12; 12 is the
    old seven. I mean, there's definitely an awareness from everybody that leads are
    not safe."


But is this true? In short ... not really.

:doc:`Comparing the regular and playoff seasons <break_down_the_eras>` from:

* 1996-97 to 2016-17 (old-school) versus:
* 2017-18 to 2024-25 (modern)

:doc:`There's lots of ways to break this down <down_down_down>`, but roughly there's a 2
point shift on average, which :ref:`decreases as the time counts down
<point-percent-plots>`.  So while there's about 1.8x times as many 20 points-or-more
comebacks comparing the eras, the *chance* of coming back from 20 points-or-more down
(``5.31%``) is about the same as coming back from 18 points-or-more down (``4.88%``)
back in the day.

Meaning leads are *roughly* as safe as they have been, maybe at most needing an extra
bucket.

.. _win-percentages-when-max-deficit-is-n-or-more-points:

Win Percentages When Max Deficit is N *Or More* Points
======================================================

Looking at the % chance of coming back from down N point *or more* over an entire game
we get:

.. raw:: html

    <div id="nbacc_max_or_more_48_eras_0" class="nbacc-chart"></div>


You can :ref:`interact with this chart <understanding-the-points-down-charts>` and
compare at different point margins, but to focus on a few we get:

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
still very unlikely. In fact, you need to move over a little less than one three-pointer
to get about the same chance: in the old school era, if you were down -27 or more there
was about a 0.48% chance of winning.

.. topic:: Note

    This is using the raw data points, which is a little more intuitive. You can
    also do this using the trend line in the chart, which cleans up the noise in
    the data and is statistically more accurate. Overall, either way draws the same
    conclusion.

As time dwindles, this shift is slightly smaller. Looking at biggest 4th quarter
comebacks we get:

.. raw:: html

    <div id="nbacc_max_or_more_12_eras_0" class="nbacc-chart"></div>

Now, the shift is about 1.5 points, an even smaller shift.

To me at least, looking at the point shift gives me a better feel for how dramatically
(or not) the game has changed. I can be convinced you could look at it both ways (Win %
Increase is more dramatic, point shift is more modest) but as a fan watching your team
sink into a 20 point hole, I don't think the data is telling you to say "20 points,
that's nothing anymore".


.. _win-percentages-when-teams-are-down-n-points-with-so-much-time-left:

Win Percentages When Teams Are Down N Points With So Much Time Left
===================================================================

Another way to look at it and the more natural way to think about it while you are
watching a game live (as opposed to describing a game after the fact) is to look at the
win percentages when teams are down *exactly* N points with so much time left. Here's a
chart for the start of the 2nd half:

.. raw:: html

    <div id="nbacc_point_at_final_24_eras_0" class="nbacc-chart"></div>

The data is a bit noisier here, because we are not accumulating the games as we move
from left to right like we did when looking at points down *or more*. Here, for the old
school era, we have the case that there was one game (``11/27/1996 DEN @ UTA: 103-107``)
where UTA was down -34 at the half and won. But no team in that era won when down -33,
-32, -31, -30 or -29 at the half.

But overall, the same basic trends hold. Looking at starting the 4th quarter we have:

.. raw:: html

    <div id="nbacc_point_at_final_12_eras_0" class="nbacc-chart"></div>

And entering the final 6 minutes:

.. raw:: html

    <div id="nbacc_point_at_final_6_eras_0" class="nbacc-chart"></div>

As time marches on, the point shift between the eras lessens, but gives you a good feel
for the comebacks that are possible.


.. _20-is-18-win-versus-time:

Win % Versus Time
=================

.. raw:: html

    <div id="nbacc_max_or_more_48_eras_0_test" class="nbacc-chart"></div>


.. raw:: html

    <div id="nbacc_points_versus_time_all_eras" class="nbacc-chart"></div>






.. _occurrence-frequencies:

Occurrence Frequencies
======================

.. raw:: html

    <div id="nbacc_max_or_more_48_occurs_eras_0" class="nbacc-chart"></div>

.. raw:: html

    <div id="nbacc_down_or_more_at_12_occurs_eras_0" class="nbacc-chart"></div>




.. _tldr:

TLDR;
=====

.. _motivation:

Motivation
----------
For a while, I have been wanting to create a "comeback calculator" where, when
watching a game, you can input the current score and time left, and get a sense of how
likely a comeback for your team is (or how likely of a collapse, ahem Timberwolves).

I downloaded all the games since play-by-play has been recorded from stats.nba.com (for
some reason, the back of the 1998 season is missing). In doing so, I ran across these
articles and, while squaring my data, decided to also delve into this question of
whether - because of the rise of the 3-pointer and increased pace of play – there are
way more comebacks or not.


.. _understanding-the-points-down-charts:


Breaking Down The Eras
----------------------

.. ::

    :ref:`There are many ways to break up the eras <breaking-down-the-eras>`, but
    I've settled on:

    1. Old school era from 1996-2016 versus 
    2. Modern era 2017-2024.

    So, comparing these eras, while the odds of coming back may have increased by
    significant margins, being down 20 points in the modern era starting the 2nd
    half is just about as bad now as it always was.

    Overall, I find there's about a 2 point shift -- so 20 is the new 18. What I
    mean by that is the odds of coming back from 20 down is about the same as coming
    back from 18 down when comparing the modern era to the old school one. Notably,
    this two point shift roughly holds across different conditions: for example, for
    the last seven seasons being down 15 points starting the 2nd half has about the
    same win percentage (12.8%) as being down 13 points in the seasons 1996-2016
    before that.

    There is **a lot** of data to look at to come to this conclusion, so I'll try to
    break it down as simply as I can and link when possible to more detailed
    discussions.

    To start, there are several ways people commonly talk about comebacks: being
    down *max N points or more* over some time, being down *exactly* N points over
    some time, or being down *exactly* N points *starting* at some time. Each one
    has a slightly different flavor, so we will look at them all to get a complete
    sense.
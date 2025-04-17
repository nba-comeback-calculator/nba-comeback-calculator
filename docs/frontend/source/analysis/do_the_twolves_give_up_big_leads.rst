***********************************************
Do the Timberwolves Actually Give Up Big Leads?
***********************************************

There's a feeling among fans that the Timberwolves of the last few years don't
put teams away and frequently surrender big leads. I was personally at the `04/21/2022
MEM @ MIN playoff game where the Wolves blew a 26-point lead
<https://www.nba.com/game/0042100153>`_, so I was inclined to believe this narrative.

I originally wrote this analysis before the Timberwolves :ref:`tied a since-1996 NBA record for
surrendering the largest lead <twolves-tie-a-dubious-nba-record>` against the `Bucks on
04/09/2025 <https://www.nba.com/news/bucks-stun-timberwolves-4th-quarter-comeback>`_.
It would be remiss not to address this first.

But as difficult as this may be to believe, when examining the comeback data as
traditionally defined, the Timberwolves of the last few years are actually slightly better
at maintaining leads than the league average.

.. _twolves-tie-a-dubious-nba-record:

Twolves Tie a Dubious NBA Record For Giving Up 24 Point Lead With 10 Minutes Left
=================================================================================

But first, I must address very recent memory. Here's a look at comeback odds for maximum
point deficits in the last 10 minutes of games since 1996, when play-by-play data first
became available:

.. raw:: html

    <div id="twolves_leads/max_10min_all_time" class="nbacc-chart"></div>

Only two teams have ever lost a game after leading by 24 or more points in the last ten
minutes, and one of those games involves the Timberwolves against the Bucks on 04/09/2025 (the other
`being a LAC @ MEM playoff game back in 2012 <http://www.nba.com/game/0041100171>`_).
Out of the 752 games where a team's maximum lead was 24 points at some point in the last 10
minutes, we have the distinction of sharing the record for surrendering such a lead. And,
after averaging out the statistical noise, it appears the odds were about 1 in 1000.
As we say in Minnesota, "Oh Geez."

And, I'll just quickly note, that if you look at teams up 24 points *entering* the 10th
minute we actually hold the record:

.. raw:: html

    <div id="twolves_leads/at_10min_all_time" class="nbacc-chart"></div>

However, this isn't quite as fair a way of looking at it (LAC didn't fall behind by 24 points until
almost the 9th minute, which actually makes that comeback even more impressive). 


.. _but-what-about-on-the-level:

How Does This Shake Out In The Long Run?
========================================

As our excellent beat writer for the `MinnPost Britt Robson pointed out on Twitter
<https://x.com/brittrobson/status/1910151733734498510>`_:

.. pull-quote::
    Chris Finch deserves blame for last night's fiasco + some of the character issues
    w/this team this season--and was blamed on the pod with Dane today. But look at the
    overall body of work + don't mimic stupid kneejerk reactions in Memphis and Denver.

And when I take a cold look at a larger data set from the last 3 years, it doesn't
appear that the wolves are *on average* worse at holding leads:

.. raw:: html

    <div id="plots/recent_min_versus/max_down_or_more_48" class="nbacc-chart"></div>

Here, the 'For MIN' (yellow) shows the comebacks by the Timberwolves and 'For Plays MIN'
(green) shows the comebacks they surrendered. Both of these are compared against all games
in the same time range (the blue line).

In fact, they're better than the league average. Looking at just one point on this
chart: if you're down 20 points or more against the Wolves, your odds of coming back
(``4.90%``) are actually worse than the league average (``5.24%``). And the
Timberwolves are better than average at coming back from 20 points down (``7.46%``).
(Note: this analysis uses the :doc:`trend lines</analysis/forming_the_plot_trend_lines>`
rather than raw data points, which eliminates much of the statistical noise and provides
more accurate results.)

:doc:`There are many ways to analyze this </plots/recent_min_versus>` and they all tell
a slightly different but similar story: the recent Timberwolves are not much different
in giving up big leads than the league average.



.. _other-ways-to-cut-it:

Other Ways To Cut It
====================

But they are *exceptional* that is for sure. For example, check out the the biggest
comebacks ever at 4 minutes remaining from when play by play was recorded:

.. raw:: html

    <div id="twolves_leads/max_4min_all_time" class="nbacc-chart"></div>

Another one for the record books is a -17 point comeback given up by our 2020 Twolves.

But to bolster what I said before, if you look at the next dot over at -16, it's the
Twolves who came back against OKC on 2/24/2025.  Not to mention the recent comeback
from -13 down with 4 minutes left against Houston on 12/27/2024 (hover over the dots to
get the game details and links to nba.com).  So once again the recent Twolves come back
more than they let the lead slip away.

In the end, there's probably some other statistically significant stat (maybe size of
their runs versus runs they let opponents go on) that explain the frequency of these
outliers and why we are collectively chewing our nails to bloody stubs watching them
with a 20 point lead in the 4th.  Again on Twitter, `Britt noted
<https://x.com/brittrobson/status/1909794675004702866>`_:

.. pull-quote::

    What can you say? You are what you do repeatedly and Wolves lack poise and cohesion
    when it matters most--repeatedly.

But, with maybe a little bit of solace, at least on average they appear to get the job
done.


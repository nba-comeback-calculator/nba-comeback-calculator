
Down-Or-More Versus Down-At-Most Versus Down-At-Time
****************************************************


.. _down-or-more-versus-down-at-most:

Down-Or-More Versus Down-At-Most
================================


.. _a-win-percentages-when-max-deficit-is-n-or-more-points:

A Win Percentages When Max Deficit is N *Or More* Points
========================================================

The first, maybe most common way people talk about comebacks is like a line `taken from
that first ESPN article
<https://www.espn.com/nba/story/_/id/39698420/no-lead-safe-nba-big-comebacks-blown-leads>`_:

.. pull-quote::

    The frequency of 10-point and 15-point comebacks has increased as well. In
    1997-98, teams that fell behind by double digits had an .181 winning percentage.
    That climbed to .250 a season ago and is at .229 this season, meaning nearly one

    in every four games in which a team takes a double-digit lead ends with
    the-other-team-winning.

(Aside, I there is a `mistake in the ESPN article`_, but it's good enough for this
point). This defines a win percentage like this:

.. math::

    \text{Win Percentage} = \frac{\text{# of Comebacks From Down N Or More Points}}{\text{# of Games With N Or More Point Margin}}

So plotting this for the modern versus historical eras we get:

.. raw:: html

    <div id="nbacc_max_or_more_48_eras_0" class="nbacc-chart"></div>
    

Here, I always have to keep in mind, that for a given point margin, it includes all the
wins and losses of the previous point margins.  For example, the -20 point means -20 *or
more* so that win percentage includes all the -21 point wins and -21 point losses and on
and on.

.. raw:: html

    <div id="nbacc_max_or_more_48_eras_0" class="nbacc-chart"></div>


.. _mistake-in-the-espn-article:

Mistake in the ESPN Article
===========================

Again, in `this article <https://www.espn.com/nba/story/_/id/39698420/no-lead-safe-nba-
big-comebacks-blown- leads>`_ we have:

.. pull-quote::

    The frequency of 10-point and 15-point comebacks has increased as well. In
    1997-98, teams that fell behind by double digits had an .181 winning percentage.
    That climbed to .250 a season ago and is at .229 this season, meaning nearly one
    in every four games in which a team takes a double-digit lead ends with the
    other team winning.

However, there is a mistake in those numbers.

This is defining the win percentage as:

.. math::

    \text{Win Percentage} = \frac{\text{# of Wins From Down N Or More Points}}{\text{# of Wins With N Or More Point Margin} + \text{# of Losses With N Or More Point Margin}}

And looking at just the regular season games, this formula gives you this plot, which
matches the ESPN numbers exactly:

.. raw:: html

    <div id="nbacc_max_or_more_ESPN_0_eras_article_mistake" class="nbacc-
    chart"></div>

However, these numbers were double counting some games in the denominator: all the games
where the losing team was down by 10 or more points during some time in the game and
where the winning team was also down by 10 or more during some time in the game.

When corrected, and you do not double count those games you get:

.. raw:: html

    <div id="nbacc_max_or_more_ESPN_0_eras_article" class="nbacc-chart"></div>

With that fix in place, the quote should read:

.. pull-quote::

    The frequency of 10-point and 15-point comebacks has increased as well. In
    1997-98, teams that fell behind by double digits had an .197 winning percentage.
    That climbed to .291 a season ago and is at .265 this season, meaning more than
    one in every four games in which a team takes a double-digit lead ends with the
    other team winning.
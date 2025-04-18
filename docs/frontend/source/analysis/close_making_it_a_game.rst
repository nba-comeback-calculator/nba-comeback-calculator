***********************************************
So Close: What Are the Odds of Making it A Game
***********************************************


.. _what-are-the-odds-the-game-will-get-close:

What Are The Odds The Game Will Get Close?
==========================================

Somebody on reddit `posed this question
<https://www.reddit.com/r/nba/comments/u2sz31/how_often_does_a_20pt_lead_after_the_1st_quarter/>`_:

.. pull-quote::

    Was having a pointless debate with my brother after the 1st quarter of the Brooklyn
    v Cleveland play-in game. I told him that the game wasn’t over yet, but not because
    Brooklyn isn’t better than the Cavs. I said it wasn’t over because 20 point leads
    in the first quarter are a myth in the NBA. I suggested that more often than not
    (unless the matchup is extremely uneven), teams come back from 20 points down to
    make it a close game. What are your thoughts on this? I couldn’t necessarily find
    stats to back my claims up, so I figured reddit might have some strong opinions
    haha.

And I realized that a quick modification to what classifies as 'win' and I could more
fully answer this question:

.. raw:: html

    <div id="close/at_36_tie_game_all_time" class="nbacc-chart"></div>

So if you're down 20 after the first, historical game data suggests you have:

* An 8.8% chance of coming back and winning
* A 15.5% chance of tying the game at some point and
* A 34.5% chance of pulling within five.

So a third of the time, you get a pretty close game, but not "more often than not".

As time winds on, a similar pattern maintains.  At the half you get:

.. raw:: html

    <div id="close/at_24_tie_game_all_time" class="nbacc-chart"></div>

And at the start of the 4th quarter you get:

.. raw:: html

    <div id="close/at_12_tie_game_all_time" class="nbacc-chart"></div>



.. _modern-era:

Modern Era
==========

Above, I looked at this for all games since 1996, but it doesn't change much if you
limit it to the last 8 years and draws the same conclusions:

.. raw:: html

    <div id="close/at_36_tie_game_modern_era" class="nbacc-chart"></div>


.. _what-are-the-odds-a-beaten-down-team-will-repay-the-favor:

What Are The Odds A Beaten Down Team Will Repay The Favor?
==============================================================

And, just because it was easy, we can also look at some games with huge point swings:

.. raw:: html

    <div id="close/at_24_lead_game_all_time" class="nbacc-chart"></div>


Which points out that on `11/01/2015 Miami was down 19 to Houston at the half
<https://www.nba.com/game/hou-vs-mia-0021500041/play-by-play?period=Q4>`_, tied it up
by the 4th and went on a late 4th quarter rampage and went up 22 points and finally won
89-109.  Rare.

.. green-box::

    Note, I just did a quick local modification on a branch to the codebase to generate
    these plots.  So some UI elements might say ``Win %`` where it means ``Occurs %``.

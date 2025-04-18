***********************************************
So Close: What Are the Odds of Making it A Game
***********************************************


.. _what-are-the-odds-the-game-will-get-close:

What Are The Odds The Game Will Get Close?
==========================================

Somebody on reddit `posed this question
<https://www.reddit.com/r/nba/comments/u2sz31/how_often_does_a_20pt_lead_after_the_1st_quarter/>`_
and I realized that a quick modification to what classifies as 'win' and I could more
fully answer this question:

.. raw:: html

    <div id="close/at_36_tie_game_all_time" class="nbacc-chart"></div>

I looked at this for all games since 1996, but it doesn't change much if you limit it
to the last 8 years.  So if you're down 20 after the first, historical game data
suggests you have:

* A 8.8% of coming back and winning
* A 15.5% chance of tieing the game at some point and
* A 34.5% chance of pulling within five.

So a third of the time, you get a pretty close game.

As time winds on, a similar pattern maintains.  At the half you get:

.. raw:: html

    <div id="close/at_24_tie_game_all_time" class="nbacc-chart"></div>

And at the start of the 4th quarter you get:

.. raw:: html

    <div id="close/at_12_tie_game_all_time" class="nbacc-chart"></div>




.. _what-are-the-odds-a-beaten-down-team-will-get-repay-the-favor:

What Are The Odds A Beaten Down Team Will Get Repay The Favor?
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

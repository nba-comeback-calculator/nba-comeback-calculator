


*****************************************************************
A Rule Of Thumb That Actually Works If Your Thumb Is Good At Math
*****************************************************************


.. _a-rule-of-thumb:

A Rule Of Thumb
===============
:doc:`What started all of this </analysis/about>` is, I had this rule of thumb about
whether my team's lead was "safe":

* 2 times the number of minutes remaining = pretty safe
* 3 times the number of minutes remaining = very safe

And I wanted to see how well it held up against real data. So now, after some effort,
we can plot the :ref:`percent point plots
<percent-chance-of-winning-time-v-points-down>` like this one:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_all_eras" class="nbacc-chart"></div>
  
And then we can plot those 2x and 3x guides on top of it and we get:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_bad_guides_all_eras" class="nbacc-chart"></div>

So, in short, a very bad rule of thumb.

So -- in googling about to see if someone had a better one -- I was delighted `to have
stumbled on this explanation <https://messymatters.com/moneyball/>`_:

.. pull-quote::

    “An NBA team leading by twice the square root of minutes left in the game has an
    80% chance of winning.”


This turns out to be very close, no matter the era you look at.  In fact, leveraging
the :doc:`observation that win probabilities versus point deficit are normally
distributed </analysis/forming_the_plot_trend_lines>`, we can actually come up with the
multiplier for any given win probability:

.. math::
 
        \text{Points Down} \approx 2.49 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}


Where :math:`\Phi^{-1}` is the inverse of the standard normal cumulative distribution
function and the ``2.49`` constant is when you look at all data from 1996 to now (if
you change the conditions, that number changes, usually slightly :ref:`as explained
below<best-fit-guides>`).  This allows us to expand this rule for the (more
interesting) 5% and close to snowball's chance in hell of 1%:

.. list-table::
    :header-rows: 1 

    * - Percent Chance 
      - Rule of Thumb 
    * - 20% of coming back (or 80% chance of holding the lead)
      - :math:`\approx 2.0 \cdot \sqrt{t}` 
    * - 5% of coming back (or 95% chance of holding the lead)
      - :math:`\approx 4.0 \cdot \sqrt{t}`
    * - 1% of coming back (or 99% chance of holding the lead)
      - :math:`\approx 6.0 \cdot \sqrt{t}`


Looking at all the years from 1996 to 2024 we get:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_all_eras" class="nbacc-chart"></div>

Which you can see holds up very nicely. (In fact, even later on, I stumbled upon
`another example of the square root rule
<https://www.slate.com/articles/sports/sports_nut/2015/06/golden_state_warriors_championship_a_new_formula_for_predicting_lead_changes.html>`_
but for the 90% probability case).

For a lot of numbers, it's hard to take the square root in your head, but for 16, 9, 4
and 1 it's easy:

.. list-table::
    :header-rows: 1

    * - Time Left
      - 20% Chance of Coming Back
      - 5% Chance of Coming Back
      - 1% Chance of Coming Back
    * - 16 Minutes
      - 2 * √16 = 8 Points
      - 4 * √16 = 16 Points
      - 6 * √16 = 24 Points
    * - 9 Minutes
      - 2 * √9 = 6 Points
      - 4 * √9 = 12 Points
      - 6 * √9 = 18 Points
    * - 4 Minutes
      - 2 * √4 = 4 Points
      - 4 * √4 = 8 Points
      - 6 * √4 = 12 Points
    * - 1 Minute
      - 2 * √1 = 2 Points
      - 4 * √1 = 4 Points
      - 6 * √1 = 6 Points


.. _best-fit-guides:

Best Fit Guides
=============== 

Now, you can -- for any given situation -- calculate the best fit guides that fit a
little better than the 2, 4, 6 times the square root of minutes remaining. For example,
for all eras you get:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_calculated_guides_all_eras" class="nbacc-chart"></div>

Which is very close to the 2, 4, 6 times the square root of minutes remaining number,
but fits a little bit better.

As you change conditions, the constant changes, but usually just slightly.  For
example, if we look at just at the "old school" era (1996-2016), we get:

.. math::
    \text{Points Down} \approx 2.43 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}

Which is this plot:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_old_school_era" class="nbacc-chart"></div>

And if we look at just the "modern era" (2017-2024), we get:

.. math::
    \text{Points Down} \approx 2.66 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}

Which is this plot:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_modern_era" class="nbacc-chart"></div>

Showing there is a slight difference in the constants.  But the rule of thumb is still
very close to accurate.

You can use the :doc:`calculator page </calculator/index>` to see how it works for any
given situation and add the 'Calculated Guides' to your conditions. Normally, the 2, 4,
6 times the square root of minutes remaining guides are very close to optimal. But for
some conditions -- like a top 10 team playing a bottom 10 team -- this rule of thumb
does not hold up at all.
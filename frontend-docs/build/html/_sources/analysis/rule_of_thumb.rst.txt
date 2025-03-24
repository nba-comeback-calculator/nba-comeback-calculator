


*****************************************************************
A Rule Of Thumb That Actually Works If Your Thumb Is Good At Math
*****************************************************************

I was delighted `to have stumbled on this 
explanation <https://messymatters.com/moneyball/>`_:

.. pull-quote::

    “An NBA team leading by twice the square root of minutes left in the game has an
    80% chance of winning.”


This turns out to be very close, no matter the era you look at.  Looking at all the
years from 1996 to 2024 we get:

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_all_eras" class="nbacc-chart"></div>

Just spot checking a few, we see:


.. math::
 
        \text{Points Down} \approx 2.49 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}

Where :math:`\Phi^{-1}` is the inverse of the standard normal cumulative distribution
function.


.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_all_eras" class="nbacc-chart"></div>


.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_bad_guides_all_eras" class="nbacc-chart"></div>

Where now:

.. math::
    \text{Points Down} \approx 2.43 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_old_school_era" class="nbacc-chart"></div>

.. math::
    \text{Points Down} \approx 2.66 \cdot \Phi^{-1}(\text{% Win Chance}) \cdot \sqrt{\text{Minutes Remaining}}

.. raw:: html

    <div id="thumb/nbacc_points_versus_time_with_guides_modern_era" class="nbacc-chart"></div>
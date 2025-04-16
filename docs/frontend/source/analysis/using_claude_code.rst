***********************************************
Using Claude Code to AI Auto-Generate This Site
***********************************************

.. contents::
  :depth: 1
  :local:


.. _using-claude-code-for-development:

Using Claude Code to Write This Website
=======================================

.. green-box::

    You can explore the complete source code for this project at
    `github.com/nba-comeback-calculator/nba-comeback-calculator
    <https://github.com/nba-comeback-calculator/nba-comeback-calculator>`_, which
    includes all the Claude-assisted JavaScript implementation found in the site's
    `/_static/` directory.

    If you have any thoughts or advice or feedback, please feel free to `drop me a line
    <mailto:nba.comeback.calculator@gmail.com>`_.

I used the AI coding agent Claude Code to code major sections of this website. By no
means all of this website, and I `for sure didn't just give it a rough outline and let
it figure out the rest
<https://www.reddit.com/r/ClaudeAI/comments/1enle9c/can_someone_explain_how_to_actually_use_claude/>`_

Previously, I had never used AI for anything large scale. At work, we are not currently
allowed to use AI systems with our codebase or any company data -- so basically, not
much to work with. So when I got talking to another programmer friend about downloading
this NBA data and running some quick one-off Python scripts against it, he had the idea
of using AI to build out a front-end tool.

When I started at the beginning of March 2025, Claude Code was newly released and,
`like others
<https://waleedk.medium.com/claude-code-top-tips-lessons-from-the-first-20-hours-246032b943b4>`_,
it didn't take me long to settle on using it over Cursor or Copilot. Agentic/agent
based AI code systems are newly emerging and Claude Code seems to be the state of the
art of these approaches -- with a price tag of 10 to 100x over other options, you pay
for this extra power. To boot, I really like that it's a REPL as opposed to having it
integrated in an IDE.  (And recently, after I finished this project up, Open AI has
`released CodeX which takes a similar tact -- something I'm checking out next
<https://openai.com/index/openai-codex/>`_).

Overall, I settled on a hybrid project where I wrote most of the Python myself for the
data processing and `tried my hand at vibe coding
<https://zapier.com/blog/vibe-coding/>`_ the JavaScript front-end UI using Claude Code.

In broad strokes, I:

* Downloaded the games using `the nba_api.stats package
  <https://github.com/nba-comeback-calculator/nba-comeback-calculator/blob/main/nba_comeback_calculator/form_json_season_data/form_nba_game_sqlite_database.py>`_
  and stored that data in an SQLite database I could more quickly iterate upon. Then, I
  converted all the data I needed for each game into reduced data structures and stored
  them in JSON files, one for each season.

* Wrote the code that can read those season JSON files and process the NBA
  play-by-play game data in Python. This Python code would, based on various
  conditions, form the necessary data structures, run the statistical processing code,
  and then create structured chart JSON files that contained everything needed to make
  a plot (including titles, axis labels, hover point data, etc.).

* Used Claude to write a
  `chart.js <https://www.chartjs.org/>`_ front-end that could plot these JSON data
  files, add the hover boxes, add the custom full screen mode (using `basicLightbox
  <https://basiclightbox.electerious.com/>`_) and everything you see when you interact
  with a chart. I did jump in regularly to fix this and change basic code architecture,
  but :ref:`mostly I let Claude do the work via prompts <vibe-coding-the-front-end>`.

* Then, asked Claude Code :ref:`to convert my analysis Python
  code <creating-the-interactive-calculator>` so the game processing could happen in
  the browser to build the :doc:`calculator </calculator/index>`.

* Then, I again vibe coded the calculator bootstrap form UI that allows users to set up
  the conditions they want to analyze to run the calculator. And once I got all that
  working, used Claude to get it working as best I could on mobile devices.
  
.. _vibe-coding-the-front-end:

Vibe Coding the Front End
=========================

After I had my Python scripts churning out my chart JSON data files, I wanted to use
Claude to write a JavaScript front-end. To start, I did poke around on the internet and
figure out which packages I wanted to use. Once settled after a few very small
prototypes, I asked Claude to help me make a Chart.js chart and it took very little
time to be up and running. Claude, being one of the best `agentic agents
<https://blogs.nvidia.com/blog/what-is-agentic-ai/>`_, does things like use grep and
other shell commands to figure out what it's looking at. I very lightly sketched out
the JSON format to the tool and it figured the rest out on its own.

After I had a basic plot working, I then briefly described how I wanted to create hover
boxes that appear when the user presses on a datapoint on the line:

.. code::

    You'll notice in the JSON file that there are Point Margin, Win %, Win Game Count, 
    Game Count, Occurrence %, and also a list of win games and loss games along with some 
    data for each game. I want the hover box to look something like (and these are 
    example numbers):

    Point Margin: -23
    Wins: 81 out of 3028 Total Games
    Win %: 2.67
    Occurs %: 31.81
    Win examples:
      04/08/2022 HOU(30th/0.244) @ TOR(10th/0.585): 115-117

    Loss examples:
      12/22/2017 WAS(17th/0.524) @ BKN(23rd/0.341): 84-119

    Where the 30th is the rank and 0.244 is the team percentage; 115-117 is the score. 

    But there can be many wins and losses, so only show up to 10 wins and 4 losses. 
    Note, each game data point has a 'game_id' field. Use that to make the hyperlink 
    that when clicked brings you to www.nba.com/games/{game_id}

And it thought about it for a few minutes and created the hover boxes for the data
points pretty much on the very first try. After 3 or 4 more prompts, I had it styled,
with the outline of the hover box matching the line color and other fussy odds and
ends. Didn't even look at the HTML or CSS once.

Then, once I had the :ref:`main statistical fitting and data processing code translated
from Python to JavaScript <creating-the-interactive-calculator>`, I basically asked it
to create a Bootstrap UI form to match the fields in the main API function call and had
this working very quickly, again without looking much at the generated UI code.

There were many things in this project where I was surprised how well it performed with
minimal or even downright bad specification inputs, with some caveats. Once I had the
calculator form up and running, I wanted to persist it using a URL coding scheme to
create shareable links. I barely sketched out a spec like this:

.. code::
    
    We need to store the state of the form whether we press calculate or cancel, 
    the form values and URL always persist.
    
    p=<plot_type:values 0-4>,<time>,<percent_one>_<percent_two>_...
    &s={season_one}+{season_two}
    &g={game_filter_one}+{game_filter_two}

    where season_one is of the form {year0},{year1},{B|R|P} for both or regular season
    or playoff. The game filter is (Team|Rank|HomeStatus),(Team|Rank)

    Just g={for_team_field}-{home_away_field}-{vs_team_field}~{for_team_field}-
    {home_away_field}-{vs_team_field}
    
    That example shows two filters. Also, it should be 'e', 'h', or 'a' for the home
    away field. So for example, if we had BOS at home playing ANY, we would have
    BOS-H-ANY. That's one game filter.

I got this working fairly quickly without needing to look at how it was coded. However
(most likely because I started asking for multiple features at a time, something that
is not best practice) it introduced a very strange bug where it started plotting two
charts.

That got me back to the good URL encoding scheme. But the state of the form was still
not being stored correctly, and Claude had gone off and created a fairly complicated
storage mechanism. So I guided it with:

.. code::

    OK that worked very well. Now, we have a URL -- that will be the sole state of
    the system. Get rid of the other state mechanisms and simply store that string
    somewhere accessible once formed. Now, when we load the form, the form needs to
    parse the URL string and set up the form accordingly. It needs to add a row for
    every season range in the URL and the game filter, set up the plot types, minutes,
    set the percent box, etc. If there is a URL string (either created by us or the
    user gave us a URL string) we need to parse it and set the form up when we hit
    'Calculate' -- the sole state should be this URL string.

And that worked -- and it clearly updated the CLAUDE.md about the singularity of the
URL state.

But this led to a complex bug of the chart being duplicated. And now I was paying a
price for not understanding the code Claude was generating along the way. After some
trouble and having to revert the code more than once, I got it working, but this is for
sure a case where it would have been easier to get involved early and not try to prompt
my way to a solution.

.. _creating-the-interactive-calculator:

Creating the Interactive Calculator Via Python To JavaScript Translation
========================================================================

A major idea when I started this was to:

* First create Python files that could process all the NBA play-by-play game data, do
  all the statistical fitting, and make JSON chart files that could be read in by the
  chart.js codebase.

* Have Claude convert these files into JavaScript to implement the :doc:`interactive
  calculator </calculator/index>`.

The core idea being, I know Python much much better than JavaScript, know the NumPy/
SciPy libraries well and it will be much easier to work out all the bugs there, and
have that all worked out rather than trying to prompt Claude to do the same thing in
JavaScript without a reference. I think overall, this hunch was very correct.

Mostly this worked great and had it all working in a relatively short time frame. There
were bumps and many missteps though.

First Translation
-----------------

My first mistake was the majority of the Python code was in one rather largish file and
it really could have been cleaned up. So my first naive attempt at translating this
didn't look great, not to mention Claude didn't even want to read in the Python file as
a whole due to size.

So, instead, I broke up the file into four smaller files and had Claude cleanup the
files, rename bad variable names, add docstrings and comments as best it could. Then I
fed these four files into Claude and had it take a crack at it.

.. code::

    Let's try this Python to JavaScript translation again.

    Currently, we have working js/nbacc_chart_loader.js and js/nbacc_plotter_*.js files
    that can load the JSON data from _static/json/charts/* and plot the charts.

    Now we need to add a new 'calculator' feature that will provide a UI to select plot
    options. You have added the start of this bootstrap UI in the
    js/nbacc_calculator_ui.js file and it is a good start.

    Now we need to add the core logic that will process this form, create the JSON data
    and then feed this JSON data to the chart loader and plotter (instead of reading the
    JSON data from the _static/json/charts/* directory).

    The core Python files that need to be translated are located at
    ../../../nba_python_data/form_plots/form_nba_chart_json_data/

    We need to translate each file here to JavaScript and be named
    form_nba_chart_json_data_api.py -> js/nbacc_calculator_api.js
    form_nba_chart_json_data_num.py -> js/nbacc_calculator_num.js

    etc.

    The form_nba_chart_json_data_num.py uses scipy and numpy and we will need to use
    Math.js and replicate all the functionality of this Python file. You already tried
    once at ../../../nba_python_data/old/js/nbacc_calculator_core.js -- you can use this
    file as a reference.

    However, this time we need to translate all of the logic found in the four Python
    files in ../../../nba_python_data/form_plots/form_nba_chart_json_data/

    The key classes/functions to translate are:
    
    plot_biggest_down_or_more plot_percent_chance_time_vs_points_down GameFilter

Those results were better, but still not perfect, so I doubled down on the mission
again with these prompts. I found the results improved dramatically when I asked for an
*exact* translation:

.. code::

    We want an *exact* translation of the Python files in 
    ../../../nba_python_data/form_plots/form_nba_chart_json_data/. Re-read them and check 
    that your implementation works exactly like those files. We don't need to do any 
    checking for defaults or unnecessary error checking. The goal here is a 1 to 1 
    translation.

.. code::

    Your starting implementation of js/nbacc_calculator_season_game_loader.js is good. 
    However, we want a 1 to 1 direct translation of
    ../../../nba_python_data/form_plots/form_nba_chart_json_data/form_nba_chart_json_data_season_game_loader.py.
    Ensure that your translation is 1 to 1 and do not add any additional error checking or 
    setting defaults. Update the CLAUDE.md to note we don't want to add unnecessary error 
    checking and default settings. The code is correct by construction and we will ensure 
    the UI forms will only provide valid values.

.. code::

    First, rename js/nbacc_calculator_core.js to js/nbacc_calculator_plot_primitives.js 
    and make sure it matches form_nba_chart_json_data_plot_primitives.py 1 to 1 without 
    any unnecessary error checking. Then, do the same for js/nbacc_calculator_api.js and 
    make sure it matches the form_nba_chart_json_data_api.py API. Again, we are trying to 
    match the exact logic of the Python files, just making it work in JavaScript for our 
    webpage.

Now we were, in hindsight, 90% of the way there and, after a few spot checks, could
tell we were onto a solid translation.

The four key Python modules that were translated into equivalent JavaScript files are:

.. list-table::
    :header-rows: 1
    :widths: 60 40

    * - Python Module (in form_nba_chart_json_data_api/)
      - JavaScript Equivalent
    * - `form_nba_chart_json_data_api.py <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/nba_comeback_calculator/form_json_chart_data/form_nba_chart_json_data_api/form_nba_chart_json_data_api.py>`_
      - `nbacc_calculator_api.js <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/docs/frontend/source/_static/js/nbacc_calculator_api.js>`_
    * - `form_nba_chart_json_data_num.py <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/nba_comeback_calculator/form_json_chart_data/form_nba_chart_json_data_api/form_nba_chart_json_data_num.py>`_
      - `nbacc_calculator_num.js <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/docs/frontend/source/_static/js/nbacc_calculator_num.js>`_
    * - `form_nba_chart_json_data_plot_primitives.py <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/nba_comeback_calculator/form_json_chart_data/form_nba_chart_json_data_api/form_nba_chart_json_data_plot_primitives.py>`_
      - `nbacc_calculator_plot_primitives.js <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/docs/frontend/source/_static/js/nbacc_calculator_plot_primitives.js>`_
    * - `form_nba_chart_json_data_season_game_loader.py <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/nba_comeback_calculator/form_json_chart_data/form_nba_chart_json_data_api/form_nba_chart_json_data_season_game_loader.py>`_
      - `nbacc_calculator_season_game_loader.js <https://github.com/nba-comeback-calculator/nba-comeback-calculator/tree/main/docs/frontend/source/_static/js/nbacc_calculator_season_game_loader.js>`_

To be clear, this still did not work out of the box, *many* bugs (50?) to squash one by
one using the ``debugger;`` and a Javascript console.

For example it created this code:

.. code::

    const times = [];
    for (let t = start_time; t >= stop_time; t--) {
        times.push(t);
    }

when the equivalent Python code was ``range(start_time, stop_time, -1)``.  This is off
by 1, leading to t being 0 in the javascript case, creating a really hard to pin down
bug.

Also, for some reason, it made a bunch of JavaScript namespaces like this:

.. code::

  // Use a module pattern to avoid polluting the global namespace 
  // But also make it available globally for other modules 
  const nbacc_utils = (() => {

But then it didn't use the namespace in the calls in many random places, leading me to
have to figure out one by one which namespace I needed to call (I did also have some
success getting Claude to fix a few too, but it was a whack-a-mole experience).

Finally I knew the SciPy/NumPy parts were going to be tricky, so I spent some time
separating out those functions into their own Python file and rewriting some algorithms
using primitives I knew were available in Math.js. However, the scipy.optimize.minimize
proved a problem.

Initially, Claude created a custom fmin minimization algorithm, but it didn't work at
all. After trying the numeric.js libs and a few others, I finally stumbled across this
`absolute banger of a rant about JavaScript numerical optimization
<https://robertleeread.medium.com/a-brief-bad-ignorant-review-of-existing-numerical-optimization-software-in-javascript-further-c70f68641fda>`_
which got me onto the `fmin by Ben Frederickson <https://github.com/benfred/fmin>`_
library. Once I had that in place, plots finally started popping up on the page.

Major Refactor
--------------

After having this working, I decided to add the ability to do sub 1 minute charts. This
required a fairly larger refactor of the python code, and I was curious how well Claude
could handle *updating* this translation.  One thing I've read is AI projects are good
for starting project or small things but get less useful later on.  And, overall, it
seemed to do the update almost as good as the main translation with a few more problems.

Once again, I had to remind Claude a few times that we were doing a 1 to 1 translation,
and we need to match the python functions exactly.  Some examples:

.. code::

   > We are very close, but there is some bug -- the python API and javascript API 
   are not returning the same thing.  Can you show me where the python had a range 
   (itertator that you changed to a Javascript loop.  Often, we you do this translation 
   you are off by one.

.. code::

  The python defined in _primitives.py was this:                                                                                                       
                                                                                                                                                          
                    # Determine the range of time to analyze                                                                                             
                    start_index = TIME_TO_INDEX_MAP[start_time]                                                                                          
                    stop_index = TIME_TO_INDEX_MAP[0]  # End of game                                                                                     
                                                                                                                                                          
                    # Find the maximum deficit throughout the period                                                                                     
                    for index in range(start_index, stop_index + 1):                                                                                     
                        time = GAME_MINUTES[index]                                                                                                       
                        point_margin_data = game.point_margin_map[time]                                                                                  
                                                                                                                                                          
                        # For first time point, use the current margin                                                                                   
                        if index == start_index:                                                                                                         
                            min_point_margin = point_margin_data["point_margin"]                                                                         
                            max_point_margin = point_margin_data["point_margin"]                                                                         
                        else:                                                                                                                            
                            # For subsequent time points, use min/max values                                                                             
                            min_point_margin = point_margin_data["min_point_margin"]                                                                     
                            max_point_margin = point_margin_data["max_point_margin"]                                                                     
                                                                                                                                                          
    The javascript does not match this in js/nbacc_calculator_plot_primitives.js                                                                         
                                                                                                                                                          
    Why did you make this                         const array_index = i; // Use the index directly                                                       
                                                                                                                                                          
    That is not needed.  Read the original python and do a better translation.

.. code::

    > This is wrong translation:

                try {
                    safe_fit_point = this.point_margins[10];
                } catch (error) {
                    safe_fit_point = this.point_margins[this.point_margins.length - 1];
                }


    In python, if point_margins is not big enough, it will raise an error.  However, in JS it will just return undefined.  Therefore, we need to check
    that it is safe_fit_point = this.point_margins[10]; is undefined, then do the safe_fit_point = this.point_margins[this.point_margins.length - 1];

    ⏺ You're absolutely right. In JavaScript, accessing an array index that doesn't exist returns undefined rather than raising an exception like
      Python's IndexError. Let me fix that translation:


And then it did things like this in the translation:

.. code::

        const points_down_line = new PointsDownLine(
          games,
          game_filter,
          current_time,
          "at", // Use 'at' mode for time points
          null, // no legend needed
          false, // cumulate
          null, // min_point_margin
          -1, // max_point_margin
      );

Which was clearly missing two fields from the Python, so I just manually fixed a few
issues like this myself:

.. code::

        const points_down_line = new PointsDownLine(
          games,
          game_filter,
          current_time,
          "at", // Use 'at' mode for time points
          null, // no legend needed
          false, // cumulate
          null, // min_point_margin
          -1, // max_point_margin
          null, // fit_min_win_game_count
          -1 // fit_max_points
      );

But, lump sum, I think it mostly did a very good job of this process and saved me
considerable time doing a rather tedious translation.




.. _some-notes--thoughts:

Some Notes / Thoughts
=====================

Just some thoughts from this experience and, being a noob, these are more notes than
advice:

* **Claude's memory is fincky**:  Using the ``CLAUDE.md`` file and other .md files
  to instruct Claude on how I wanted to code (e.g. less error handling, do exact 1 to 1
  python to js translations, etc.) I was surprised how it would do this for a few
  prompts and then stop doing it, and I had to remind it again.  Similarly, in another
  project, I told it to record every prompt I gave it and write down the ``/cost`` in a
  running .rst file so I could track how I put it together and the total cost.  It did
  this for a while, and then stopped doing it, and over and over again I had to remind
  it, leading it to write more emphatic instructions in the ``CLAUDE.md`` file not to
  forget.

* **Watch out for needless error handling**: I found that Claude often wants to
  add unnecessary and counterproductive error handling / logging / fallback code that
  just causes more problems that are harder to debug and leads to bloated code.  Again
  touching on the memory issue, that's why `in the file
  <https://github.com/nba-comeback-calculator/nba-comeback-calculator/blob/main/docs/frontend/source/_static/CLAUDE.md>`_
  you'll see many notes about error handling, over and over.  It would then do this for
  a while, but usually revert back to adding it again, leading me to tell it again not
  to do this.

* **After a couple of tries, debug the error yourself**:  And this problem gets worse
  and worse as the you try to get Claude to solve a tough bug that's it is not able to
  solve.  Here, I found it's often better after a try or two to figure out what is
  going on and directly guiding the tool.

* **Make sure you're actually testing what you are asking Claude to fix**: A combo of
  the above points, I wasted more than few dollars asking Claude to repeatedly fix
  something it already had fixed.  Then, it can get into a real rabbit hole, of
  creating piles of unnecessary logging, fallback code, and other unnecessary attempts
  at trying to solve an unsolvable problem.  To my amazement, one time it even told me
  that most likely I wasn't looking at the code it was changing.

* **Commit, then ask for a single feature one at a time**:  I got into a flow where
  every time before I asked for a feature, I would commit, ask, test, then (maybe) diff
  the change using ``git difftool`` and if it was a mess, revert.  Many times I didn't
  follow this advice, asking for multiple features at a time or not committing changes
  and that's when I would get into the most trouble.  (Also, Claude Code can commit for
  you, something I didn't do much in an effort to save cost but something I'm revisting
  more in the future.)

* **Use Claude to help write your requirements**:  Since the whole point is save effort,
  you'll start to notice that typing all the .md files and prompts can take time, too.
  So I did get into a habit of writing bad specs and giving bad prompts, asking Claude
  to clean up and flesh out my requirements before writing code.  I had good success
  doing this more than few times.


.. _and-the-verdict-is-:

And the Verdict Is ...
======================

Pretty much very happy with it. I mean, it's not like you tell it "build me a website"
and you're done -- it's still a lot of work and takes a lot of iterations, debugging,
missteps, and backtracking just like any coding project.

And after a while I found (say, after the Calculator form was stable), I could ask for
updates and with the memory/context it had from the CLAUDE.md and code comments, it
would get the new features added with very little effort.

For a project not as limited as this one, I think the next major step would be to more
fully understand the code and use Claude to clean up unnecessary bloat, etc. To get a
firmer understanding of what you have before you start adding major new features.

Or maybe not! Maybe just fire and forget!



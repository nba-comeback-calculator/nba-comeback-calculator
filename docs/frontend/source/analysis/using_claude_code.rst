***********************************************
Using Claude Code to AI Auto-Generate This Site
***********************************************

.. _using-claude-code:

.. green-box::

    Having used Claude Code to put together this fairly complex website, I thought it
    might be useful to jot down some notes. Being a total AI coding novice, I thought
    the better of this a few times for fear of putting out bad info, but nevertheless I
    thought these notes might be useful, especially for someone in a similar starting
    place as myself.


.. _using-claude-code-for-development:

Using Claude Code for Development
=================================

Like most devs these days, I've been aware of AI for some time. Probably also like most
devs, I've never used it for anything large scale. We are allowed to use AI at work,
just not with any of our codebase or any company data -- so basically, not much to work
with. So I've had my time kicking Copilot around the block a bit, but always for fairly
small things, functions that do specific scientific or statistical functions that you
might find in the SciPy or scikit-learn library but are not there. File parsing
functions, etc.

But I've had this feeling that you couldn't really use AI for big things, for major
pieces of code. Surely, it couldn't work on codebases of the size *I* work on [adjusts
monocle].

So when I got talking to another programmer friend about downloading this NBA data and
running some quick one-off Python scripts against it, he had the idea of using AI to
build out a front end tool. Perfect. Here was a project that was fairly large and
involves both front end work and :doc:`number
crunching</analysis/forming_the_plot_trend_lines>` and is totally self-contained and
won't get me fired for doing it!



.. _choosing-claude-code-vs-other-tools:

Choosing Claude Code vs. Other Tools
====================================

Before settling on Claude Code, I experimented with several AI coding assistants,
including Cursor (with both Claude 3.5 and 3.7 models).

It didn't take me long to find posts like these:

- `Lessons from 20 hours with Claude Code
  <https://waleedk.medium.com/claude-code-top-tips-lessons-from-the-first-20-hours-246032b943b4>`_
- `Some good discussion on Claude Code versus Cursor
  <https://www.reddit.com/r/cursor/comments/1j21lo8/cursor_vs_claude_code/>`_
- `HaiHai.ai's detailed comparison <https://www.haihai.ai/cursor-vs-claude-code/>`_

Among many others.

To boot, I really like the decision they made to make the tool a REPL as opposed to
having it integrated in an IDE. I find that just suits me better, and I can more easily
separate my editing functions from "now I'm AI-ing" brain mode (even though I still use
VSCode with Copilot or Cursor to do my editing).

.. green-box::

  In the beginning of this project I did take the time to carefully commit my code, ask
  Claude to do a fairly complex edit on multiple files, check the results, revert back
  and ask Cursor to do the same thing. It didn't take long before I gave up on Cursor
  for complicated edits, even though on smaller things they can perform at a similar
  level.

  Often, the output was close or just as good. But many times it was not workable and I
  tended to just use Claude Code more and more often.


.. _basic-scope-of-work:

Basic Scope Of Work
===================

In broad strokes, I:

* Wrote the majority of the code that processes the NBA play-by-play game data in
  Python. This Python code would, based on various conditions, form the necessary data
  structures, run the statistical processing code, and then create structured JSON
  files that contained everything needed to make a plot (including titles, axis labels,
  hover point data, etc).

* Used Claude to 1. understand these JSON blobs and 2. write a
  `chart.js <https://www.chartjs.org/>`_ front end that could plot these JSON data
  files, add the hover boxes, add the custom full screen (using `basicLightbox
  <https://basiclightbox.electerious.com/>`_) and everything you see when you interact
  with a chart. I did jump in now and then to fix things, refactor, etc, but mostly I
  let Claude do the work via prompts.

* Then, asked Claude code :ref:`to convert my analysis Python
  code<using-the-devil-you-know>` so the game processing could happen in the browser to
  build the :doc:`calculator </calculator/index>`
  
You can explore the complete source code for this project at
`github.com/nba-comeback-calculator/nba-comeback-calculator
<https://github.com/nba-comeback-calculator/nba-comeback-calculator>`_, which includes
all the Claude-assisted JavaScript implementation found in the site's `/_static/`
directory.


.. _some-initial-thoughts-and-observations:

Some Initial Thoughts and Observations
======================================

* `The Moments of Wonder Are Often`_: I said "No Freaking Way" more than a few times.

* `Requirements Are Key, But It's OK to Be Lazy`_: Let Claude clarify your thinking.

* `Commit, Ask for Small Features, One at a Time, Diff, Test, and Then Commit a Few
  More Times for Good Measure`_: It's way easier to back out of small changes than big
  ones.

* `Don't Throw Good Money After Bad`_: After a few times trying to get it to fix an
  error, you're just going to have to roll up your sleeves and figure out what is
  actually wrong.

* `And Even Worse, Don't Tell It to Fix Things That Are Already Working`_: Screaming
  into the void is a very bad strategy.

* `Totally Starting Over Is Also a Good Strategy`_: Sometimes, the second time -- with
  the benefit of hindsight guiding your already on-disk CLAUDE.md requirements -- is
  the charm.

* `Watch Out for Needless Error Handling`_: Often, Claude inserts needless
  error handling / fallback implementation behavior that creates more subtle,
  harder-to-track-down bugs.

* `Using The Devil You Know`_: Writing code in your go-to language and having Claude
  translate your complex logic into other domains you don't know as well works well.

* `The More You Use It, The More Ways You See How You Can Use It`_: So many places
  to automate.



.. _the-moments-of-wonder-are-often:

The Moments of Wonder Are Often
===============================
After I had my Python scripts churning out my chart json data files, I told Claude to
help me make a chart.js chart and it took very little time to be up and running.
Claude, unlike other AI tools, does things like use grep and other shell commands to
figure out what it's looking at. I barely sketched out the JSON format to the tool and
it figured the rest out on its own.

Then after I had a basic plot working I then, briefly, described how I wanted to create
hover boxes that appear when the user pressed on a datapoint on the line:

.. code::

     > You'll notice in the JSON file that there are Point Margin, Win %, Win Game Count, 
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

    Where the 30th is the rank and 0.244 is the team percentage; 115-117 is 
    the score. 

    But there can be many wins and losses, so only show up to 10 wins and 
    4 losses. Note, each game data point has a 'game_id' field. Use that 
    to make the hyperlink that when clicked brings you to www.nba.com/games/{game_id}

And it thought about it for a few minutes and it mostly worked the very first time. No
freaking way.  After 3 or 4 more prompts, I had it styled, with the outline of the
hover box matching the line color and other odds and ends.  Didn't even look at the
html or css once.

There were many things in this project that I was surprised how well it did with
minimal or even down-right-bad specification inputs.

.. _requirements-are-key-but-its-ok-to-be-lazy:

Requirements Are Key, But It's OK to Be Lazy
============================================

As has been noted many times about using AI coding, the cleaner, the clearer, the just
plain better the requirements are, the better the results.  You need to feed in clearly
defined rules and goals; in the end it's not magic (but it's getting damn near).

For Claude, this is baked in with CLAUDE.md files, and you will see them littered about
in this project and other supplemental .md files (like the `CALCULATOR.md
<https://github.com/nba-comeback-calculator/nba-comeback-calculator/blob/main/docs/frontend/source/_static/CALCULATOR.md>`_).

But writing good specifications takes time and effort and, knowing that being `lazy is
one of the 3 virtues of being a good dev <https://thethreevirtues.com/>`_, I found
myself starting to use Claude more and more to write the CLAUDE.md file and other
requirements. I would just paste in text that I would be embarrassed for people to see
and ask it to clean it up, read the CLAUDE.md, ask it to tweak it again, mash my hand
against the keyboard a few more times, and then, voilà, a working spec it could then
use to write code against. (For example, :ref:`the spec I fed into it to do the form
URL encoding was barely English <url-mashup>`).

.. _commit-ask-for-small-features:

Commit, Ask for Small Features, One at a Time, Diff, Test, and Then Commit a Few More Times for Good Measure
============================================================================================================


.. green-box::

  Just a quick note, Claude Code also shines at doing your git commits for you, which I
  did from time to time.  But I found myself being a cheapskate and, this being sort of
  a toy project, did that myself most of the time.

The most effective workflow I discovered was to break development into small,
well-defined tasks. This approach produced much better results than requesting large
features or complex implementations all at once.

When I was my best self, my flow was:

1. Commit current working code to establish a clean baseline
2. Ask Claude for a specific, focused feature
3. Review the changes with a diff tool to verify functionality
4. Test the implementation before moving on
5. Commit working code before requesting the next feature

Then, if you get yourself into a bad state you don't want to debug (which happened many
times) you can easily revert.  For example, while futzing with the calculator form for
mobile devices, I often asked it do adjust something and often the result would be
totally screwed.  Rather than debug, I just did ``git reset --hard`` and tried a
different prompting strategy, a process I found very workable.

But over and over again, with my tendency to rush and get sloppy, I stopped doing this
and just kept talking to Claude like I've had a few, mixing feature requests, not
taking the time to incrementally commit and it caused me a lot of unnecessary pain, as
described below.

.. _dont-throw-good-money-after-bad:

Don't Throw Good Money After Bad
================================

One thing I found that once you ask Claude to fix something, if it doesn't fix it,
asking it to fix it over and over can lead to a bigger mess as it adds more debug
statements, error handling, fallback code, and other failing attempts at solving the
problem.  It's better, after one or maybe two failures (ok, maybe 3), to jump in with a
debugger and figure it out yourself.

You might not even need to totally fix it yourself, but rather find where the problem
is and guide it a bit.

On the :doc:`calculator page </calculator/index>`, the original versions of the
bootstrap form were not remembering the options when you closed the form and reopened
it. Related, I wanted a URL encoding scheme, so when you chose form options it encodes
in the URL so you can email it to someone, etc.

So I started by asking Claude:

.. code::

    > On the calculator page two related things:
    1. We need to remember the state of the form so that when we bring the form up again,
    the last values are there.
    2. We need to come up with an encoding scheme to encode the state of the form in the
    url so if you send someone that url, that exact plot comes up. We need to register if 
    there are additional arguments on the url, and, if so, set up the state object the form 
    sets up and call the same method as the "Calculate" button. If you need a third party 
    CDN, that's OK or you can code it yourself.

This is in stark violation of my :ref:`rule about asking for isolated, small things
one-at-a-time <commit-ask-for-small-features>` -- and also I forgot to commit.

So it came back with the multiple changes.  I noticed but the URL encoding scheme was
really ugly and second the form was still not storing state, and third, when you
entered in a URL it was not updating the chart. So I continued, gave it the most
slurred half-baked spec for a better URL encoding scheme, but mixed in about 3 or 4
different requests at the same time:

.. _url-mashup:

.. code::

    > This is not working right. The Season Ranges and the Game Filters are not persisting.
    If we add Season Ranges or Game Filters, they need to persist.

    Also, don't have a share button, just update the URL in the browser once the
    Calculate button or cancel button is pressed. We need to store the state of the
    form whether we press calculate or cancel, the form values and URL always persist.
    Finally, let's come up with a simpler URL encoding scheme. Let's do:

    p=<plot_type:values 0-4>,<time>,<percent_one>_<percent_two>_...
    &s={season_one}+{season_two}
    &g={game_filter_one}+{game_filter_two}

    where season_one is of the form {year0},{year1},{B|R|P} for both or regular season
    or playoff. The game filter is (Team|Rank|HomeStatus),(Team|Rank)

    Just g={for_team_field}-{home_away_field}-{vs_team_field}~{for_team_field}-{home_away_field}-{vs_team_field}
    That example shows two filters. Also, it should be 'e', 'h', or 'a' for the home 
    away field. So for example, if we had BOS at home playing ANY, we would have 
    BOS-H-ANY. That's one game filter.

    Clean up this logic and make a system that works. If our parser cannot parse the
    URL, we should use a blank URL as though there was no URL. Update the CALCULATOR.md with 
    the exact logic of the URL parsing so we can correct it if needed.

    Also, if we find parameters in the URL, we need to actually update the chart.

Amazingly, it took my ridiculous url encoding scheme and got it very close to right the
first time -- very close to the current one which is pretty solid and minimal and works
great.  (I also asked it to update the CLAUDE.md file as it increasingly cleaned up the
spec -- another good example of how you can have the tool write its own requirements.)

However, in the course of it doing the other tasks, it totally screwed what happens
when you enter a URL or hit the "Calculate" Button.  For that matter: it kept making a
new chart and putting it under the other one.

I tried, like five times, to tell it to fix it's problems.  But it just got worse.
Eventually, I had to copy the bad files over to _NOT_WORKING.js files, and then revert
the changes and then asked:

.. code::

    > OK, we had a major refactor of the calculator URL building and state of the form 
    that did not work. We are going to carefully try and get it back working. First, the 
    code is working OK right now, just we want some of the behavior of the old files. 
    
    First, there are three files that you created js/nbacc_calculator_init_NOT_WORKING.js 
    js/nbacc_calculator_UI_NOT_WORKING.js and js/nbacc_calculator_NOT_WORKING.js. This has 
    a new URL encoding scheme that we want to leverage. So our first task is, read the .md 
    files in this project, read the _NOT_WORKING.js files, and copy over the parts that 
    did the URL encoding scheme to the regular files. So copy what you need out of 
    js/nbacc_calculator_UI_NOT_WORKING.js to js/nbacc_calculator_ui.js etc.

That got me back to the good URL encoding scheme.  But the state of the form was still
not being stored correctly, and Claude had gone off and created a fairly complicated
storage mechanism. So I guided it with:

.. code::

    OK that worked very well. Now, we have a URL -- that will be the sole state of 
    the system. Get rid of the other state mechanisms and simply store  
    that string somewhere accessible once formed. Now, when we load the form, 
    the form needs to parse the URL string and set up the form accordingly. 
    It needs to add a row for every season range in the URL and the game filter, set up 
    the plot types, minutes, set the percent box, etc. If there is   
    a URL string (either created by us or the user gave us a URL string) we need to 
    parse it and set the form up when we hit 'Calculate' -- the sole     
    state should be this URL string.

And that worked perfect -- and it clearly updated the CLAUDE.md about the singularity
of the URL state.  Finally, I just had to solve the problem of the chart showing up in
the right spot (and not being duplicated) so I dug into the code and figured out the
logic I wanted, and more specifically guided the tool:

.. code::

  > OK, now a more complicated change. Find where in the code do you process the
  nbacc-chart and, after we've loaded the chart JSON data, pass it to the
  chart.js plotter code. Because we want to find the point where we've still made 
  the canvas, just locate where we finally call the chart.js code to render the chart.
  
  Then, we need to figure out where we are parsing the URL.
  
  Then we need to make sure we parse the URL before we process the nbacc-chart class
  div.
  
  Then, if we have URL data, don't load the chart JSON or pass it to the chart.js
  plotter code. Just skip reading that JSON file. However, we still want to make the
  canvas etc. Then we process the URL code and calculate the new chart.

After those prompts, everything was working great and we had a solid URL encoding
scheme, the form state was getting persisted, and when you entered in a URL, it came up
in the correct place.


.. _and-even-worse-dont-tell-it-to-fix-things-that-are-already-working:

And Even Worse, Don't Tell It to Fix Things That Are Already Working
====================================================================

Even worse than telling it to repeatedly fix actual bugs is to keep telling it to fix
things it has already fixed. More than once, I was looking at a site that didn't
reflect the recent code and -- over and over again --  saying "no, it's still not
working".  All the while it's adding more error checking and debug statements and
fallback behavior and digging a deeper and deeper hole.

It even told me once that I was out to lunch and the most likely thing going on was
that I was testing something else -- which was another "whoa"s moment.


.. _totally-starting-over-is-also-a-good-strategy:

Totally Starting Over Is Also a Good Strategy
=============================================
Similar in spirit to the :ref:`point made above<dont-throw-good-money-after-bad>`, one
thing I did a few times was take the CLAUDE.md file or other requirement files I was
making and just start again.

One side thing I did to help write this site was make a sphinx rst formatter in the
style of black or prettier (very minimal and just for the things I needed, mostly line
wrapping among other things).  My initial spec was pretty bad, but nevertheless it set
up a python project with a ``bin/``, ``docs/``, and ``tests/`` dir and had a runnable
prototype in no time.  Then, as time went on and I tested more and more cases against
it, but my thinking was not clear and fully thought out.  So Claude kept making unit
tests, and running them, but after a while it got buggy in some way I didn't want to
debug so I gave up.

Along the way I had it update the CLAUDE.md with the full spec, so I simply made a new
folder, and asked it to create the same tool again after cleaning up the CLAUDE.md with
all the rules and problems I had run into along the way.

This worked like a charm and I had a much smaller, cleaner codebase and it did not cost
much to get this new version running.


.. _watch-out-for-needless-error-handling:

Watch Out for Needless Error Handling
=====================================
One thing I noticed Claude do again and again was put in default values, create backup
implementation functions if it couldn't load certain JavaScript CDNs, and hosts of
other fallback / defaulting behavior. This usually just creates bugs that are much
harder to find -- or worse, weird-but-not-total-failure behavior that takes much more
time to diagnose.

This is not what I wanted -- this is a correct by construction architecture with little
input from the user -- I wanted it to just plain fail if data was missing in the JSON
or a CDN didn't load.

In fact, if you look at the main CLAUDE.md file for the JavaScript, I told it many many
times not to do this and told it to update the CLAUDE.md and it added these
instructions:

.. code:: 

  - **Error Handling**: Assume required data exists in JSON (x_min, x_max, etc.)
  - **JSON Data**: Never use fallback/default values (like `|| 0` or `|| "default"`) 
    for missing JSON data - assume data is "correct by construction"
  - **Error Checking**: Do not add unnecessary error checking or validation - 
    the JSON data is "correct by construction" and the UI forms will only provide valid values
  - **No Fallbacks for Missing Dependencies**: Do not implement fallback algorithms 
    when dependencies like numeric.js are missing. If a dependency is required, throw an error and fail explicitly rather than silently degrading to an alternative implementation.

Overall, telling it how you like to code and what patterns you want to use in the
CLAUDE.md file is good practice.  But something deep in the LLM was forcing it to keep
doing it over and over.  So I kept telling not to over and over.  It did seem that,
after a while, it seems to do it a lot less now.

.. _using-the-devil-you-know:

Using The Devil You Know
========================

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

Mostly this worked great and took less than a day to get it all working. There were
bumps and many missteps though.

My first mistake was the majority of the Python code was in one rather largish file and
it really could have been cleaned up. So my first naive attempt at translating this
didn't look great, not to mention Claude didn't even want to read in the Python file as
a whole due to size.

So, instead, I broke up the file into four smaller files and had Claude cleanup the
files, rename bad variable names, add docstrings and comments as best it could. Then I
fed these four files into Claude and had it take a crack at it.

.. code::

    > Let's try this Python to JavaScript translation again.

    Currently, we have working js/nbacc_chart_loader.js and js/nbacc_plotter_*.js
    files that can load the JSON data from _static/json/charts/* and plot the
    charts.

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

    The key classes / functions to translate are:
    
    plot_biggest_down_or_more plot_percent_chance_time_vs_points_down GameFilter

Those results were better, but still not perfect, so I doubled down on the mission
again with these prompts.  I found the results improved dramatically when I asked for
an *exact* translation:

.. code::

    > We want an *exact* translation of the Python files in 
    ../../../nba_python_data/form_plots/form_nba_chart_json_data/. Re-read them and check 
    that your implementation works exactly like those files. We don't need to do any 
    checking for defaults or unnecessary error checking. The goal here is a 1 to 1 
    translation.

.. code::

    > Your starting implementation of js/nbacc_calculator_season_game_loader.js is good. 
    However, we want a 1 to 1 direct translation of
    ../../../nba_python_data/form_plots/form_nba_chart_json_data/form_nba_chart_json_data_season_game_loader.py.
    Ensure that your translation is 1 to 1 and do not add any additional error checking or 
    setting defaults. Update the CLAUDE.md to note we don't want to add unnecessary error 
    checking and default settings. The code is correct by construction and we will ensure 
    the UI forms will only provide valid values.

.. code::

    > First, rename js/nbacc_calculator_core.js to js/nbacc_calculator_plot_primitives.js 
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


.. _the-more-you-use-it-the-more-ways-you-see-how-you-can-use-it:

The More You Use It, The More Ways You See How You Can Use It
==============================================================

One thing I noticed was, as I got more used to using Claude Code, I started to see how
I could use it in many different places.

For example, I had a test.html site to test my JavaScript front end and had set up
JavaScript and CSS CDN links. Pretty soon I was asking Claude to parse through this
document and auto-update my Sphinx conf.py file I needed to build the final site.

Also, I wanted a different Sphinx directive than the pylab ``.. note::`` was giving me,
so I asked Claude to write a ``.. green-box::`` directive and it did it first time,
made the Sphinx extension, cost me about 50 cents and I was on my way.

And when futzing with the Calculator form, I wanted a trash can icon and just asked it:

.. code::

    > On mobile, make the Regular be Reg. and then remove be a trash can icon svg. 
    Download a trash can icon and put it where we have our other svg icons.         
    
And it got it right first time, named it like the svg icons, and linked it correctly in
the code.

Finally, I had it help out writing the Sphinx RST pages quite a bit. This page in
particular I would use it to get me some starting headers and make a bunch of URL links
and other odds and ends that save a lot of time. Its prose style though is still, well,
generic and AI-y so I wrote all of the actual prose myself.

And also, for little things, in Cursor I was having it write the LaTeX in the RST
pages, add Unicode characters and on and on. Code completion on steroids in a sense.

.. _about-the-cost:

About the Cost
==============

Yes, Claude Code is *a lot* more expensive than, say, Cursor. I am into this well over
$100 USD right now. But still, it's cheap in the grand scheme when you think of what it
does for you and how much time you saved. Obviously, compared to dev costs, so cheap.
Plus, I learned a lot about many things along the way, more than I would have if not
using it.


.. _and-the-verdict-is-:

And the Verdict Is ...
======================

Pretty much wow. I mean, it's not like you tell it "build me a website" and you're done
-- it's still a lot of work and takes a lot of iterations, debugging, missteps, and
backtracking just like any coding project.

But it's way faster and most often the code is better code than I would have written
myself. It just takes care of all those dotting i's and crossing t's type stuff that as
a project winds on you find yourself skipping.

And after a while I found (say, after the Calculator form was stable), I could ask for
updates and with the context it had from the CLAUDE.md and code comments, it would get
the new features added with very little effort.

For a project not as limited as this one, I think the next major step would be to more
fully understand the code and use Claude to clean up unnecessary bloat, etc. To get a
firmer understanding of what you have before you start adding major new features.

Or maybe not! Maybe just fire and forget!

But one thing stood out: I found it required much less cognitive load than having to
type in everything yourself, check your curly braces, and a million other details, like
googling for the umpteenth time about some stupid CSS rule you never ever wanted to
know about, and on and on. When Claude runs, it can take time. But then your mind is
free to think about the next architecture steps or what you want the next feature to do.





# ShadeWindow: A Little Shade. A Better Walk.

<!-- DEV editor: use tags devchallenge, hf26challenge, opensource, ai.
Upload public/assets/shadewindow-cover.png as the cover image.
Complete docs/PUBLISHING.md before publishing this draft. -->

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## What I Built

A short walk sounds simple until you start deciding when to leave, how much sun you want, and whether there is somewhere to sit along the way.

I built **ShadeWindow**, a local-AI walking planner around one question:

> When should I leave, and which walk will keep me in the shade?

The idea is to make planning a small part of the experience. Describe your walk, compare a few options, save one card, and put the screen away.

The current prototype demonstrates that flow in a **simulated neighbourhood with synthetic weather**. It calculates real sun positions, but its buildings, trees, paths, and benches are fixtures. It does not route people through real streets or provide live forecasts.

The experience has three steps:

1. **Plan.** Choose a duration, departure window, pace, and preferences for shade, benches, and rain. You can also describe these to a local model.
2. **Compare.** Explore three routes, their departure times, moving shadows, and score breakdowns.
3. **Save & go.** Save a walk card in the browser, reopen it later, or print it.

The moving-shade map is the central idea: a route that looks appealing now may have a different shade pattern by the time you reach its later segments.

## Demo

The app runs locally at `http://localhost:3000` after:

```sh
npm install
npm start
```

Requires Node.js 20.11+ and npm. Start Ollama with an installed Llama model to use the natural-language planner. The structured walking controls work without AI.

Try this walkthrough:

- Ask for “A gentle 20-minute walk, mostly shaded, with a bench halfway. Avoid rain.”
- Compare the route cards and move the time slider to preview changing shadows.
- Switch to **Showers after 4 pm** and inspect how rain preferences affect departure choices.
- Try **Stormy day** to see the no-matching-window state.
- Save a card and reopen it from **Saved walks**.

Demo dates are October 10–16, 2026, in `Asia/Colombo`. These are reproducible scenarios, not current weather predictions.

<!-- Add a verified walkthrough video or actual app screenshots here before publishing. There is no public hosted demo recorded yet. -->

## Code

[ShadeWindow on GitHub](https://github.com/Nivin-Sithija/ShadeWindow)

The repository includes the application, geometry and scoring code, tests, local-model verification script, and build documentation. Application code is MIT licensed; SunCalc and model weights have their own licenses.

<!-- The repository is currently private. Resolve reader access before publishing this link. -->

## How I Built It

### Moving shade from solar geometry

The interface uses plain HTML, CSS, and JavaScript, with a small Node.js server. SunCalc supplies solar altitude and azimuth.

For each sampled route point, the planner checks whether a ray toward the sun intersects a synthetic building. Tree canopies are approximated as opaque disks projected onto the ground. Unknown building heights remain uncertain.

The calculation uses the time the walker reaches each part of the route. Benches are checked for shade at arrival, too.

### Local AI with a bounded job

The tested model is **Llama 3.1 8B through Ollama**. The app can be configured for an installed Gemma model, but the recorded verification uses Llama.

The model handles two tasks:

```text
Written request
  → validated preferences
  → calculated feasible routes and departures
  → model selects an existing candidate
  → checked walk card
```

It does not calculate shade, invent weather, or create new route IDs. The server validates its output and retries once when a response is invalid. If planning fails, the interface reports that failure.

### Transparent comparisons

Route fit combines shade, uninterrupted exposure, and rest-stop fit. Weather fit compares synthetic feels-like temperature, rain, and gusts. The interface exposes the factors behind the scores.

These scores are preference heuristics, not probabilities or medical safety assessments. Hard constraints apply before ranking; a high score cannot rescue an option that fails the requested conditions.

### Local storage and verification

Saved cards live in browser storage. A service worker caches the interface for reuse after its first successful load. AI still requires the running local server and Ollama; configuring a remote model endpoint changes where requests are processed.

The project has **20 passing deterministic tests** covering geometry, timezone conversion, weather summaries, route constraints, bench shade, and scoring.

Recorded local-model checks cover a shade-and-bench request, a short morning request, and an unsupported accessibility request. The two successful requests took about 11.1 and 7.9 seconds in that recorded run. Those are individual measurements, not general performance guarantees.

## Why Does Open Innovation Matter?

Walking preferences can reveal parts of a person's routine. Local inference lets the default setup process those preferences on the user's machine without a paid cloud inference API.

The prompts, validation rules, fixtures, and calculations are inspectable. A different compatible local model can be configured while the geometry and scoring rules stay reproducible.

That separation makes the prototype easier to question and improve. Someone can change the shade approximation, review a score formula, or test another model without treating the recommendation as a black box.

Open weights still come with model-specific licenses, and local inference still uses computing resources. Those boundaries belong alongside the benefits.

## What I Learned

The key design decision was to give the model a useful, limited role. Natural language helps express preferences; deterministic calculations provide the evidence for comparing walks.

Time also matters more than a static map suggests. Shade at departure and shade halfway through a walk can differ, so the planner needs to evaluate the journey as it unfolds.

The simulation makes those behaviours reproducible. The next step is to test whether the assumptions hold in an audited real neighbourhood. No outdoor prediction-accuracy claim is supported by this version.

## My Agent Session

I used Codex to prepare the repository documentation, generate the project cover, and organize this submission draft. The repository preserves the build plan, artwork prompts, and recorded model checks.

<!-- Optional: add an exported agent-session link if available. No public session link is recorded yet. -->

## Prize Categories

### Overall Winner

ShadeWindow explores the Touch Grass theme by helping someone choose a short walk and keep its plan on one saved card. The current submission demonstrates that idea through a local simulation.

## What's Next

- Import one real neighbourhood and audit its paths, buildings, and bench data.
- Add a clearly labelled live-weather provider.
- Compare predicted shade with timestamped outdoor observations.
- Test a Gemma configuration and report its actual results.

For this version, the goal is small: make the route and departure choice understandable, save the plan, and leave room for the walk.

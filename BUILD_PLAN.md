# ShadeWindow build plan

Status: local MVP implemented. See README.md for the actual stack, limitations, and commands. Real local Llama verification is recorded in evidence/local-ai.json.

Delivered UI: a single-viewport desktop dashboard, a separate planning dialog, three side-by-side route cards, Shade/Routes/Weather map views, rest-stop filters, a preview timeline, score breakdown dialogs, saved cards, and a generated sun mascot. Small screens use responsive scrolling rather than squeeze controls into unreadable sizes.

## Product promise

“When should I leave, and which nearby walk will keep me in the shade?”

ShadeWindow compares walking routes across departure times using calculated building and tree shade and a synthetic hourly weather forecast. A local open-weight model interprets a person's preferences, helps choose among calculated options, and explains the tradeoffs. The person receives one short walk card they can save and leave the screen behind.

The distinctive feature is that the same route can become better or worse as shadows move. This is a shade-planning tool, not a medical assessment of heat safety.

## Confirmed scope

- Use the user's existing Llama model through Ollama initially. Confirm the exact installed model tag before implementation; do not automatically download a model.
- Keep the model configurable so Gemma can be substituted later without changing the geometry or interface.
- Start with an explicitly labelled simulated neighbourhood. Buildings, paths, benches, and any weather scenarios are synthetic, not observations of a real location.
- Deliver a local browser application and a reproducible demo. Public hosting is a later decision.
- The submission must name the model actually tested. Do not claim Gemma integration until it has run successfully.

## First-version experience

1. Open a map labelled “Simulated neighbourhood.” Choose a date, local time window, walk duration, and a labelled synthetic weather scenario.
2. Enter a request such as “A gentle 20-minute loop, mostly shaded, with a bench halfway.” Structured controls are available too.
3. Llama converts the request into validated planning constraints. Show a compact, editable interpretation so users can correct it.
4. Compare a few walk loops and departure times. Show a transparent 0–100 preference-match score and factor breakdown, recommend one, explain its tradeoffs, and show one alternative.
5. Move a time slider to see shadows change. Route segments indicate predicted building and tree shade, exposure, and uncertainty.
6. Save a walk card containing the route, departure time, duration, landmarks, and exposed stretches. The card works without continued inference.
7. Optionally add a short comparison log linked to that exact prediction. Seeded entries in the simulation must be labelled “Demo observation”; real observations belong to a later outdoor extension.

Keep advanced reasoning details in an expandable explanation. The normal flow should take roughly a minute; measure this rather than claim it in advance.

## Simulation that demonstrates something real

Create a small, navigable district with a plaza, two contrasting street corridors, a park edge, public paths, and benches. Include buildings of known synthetic heights and one area with deliberately missing height data.

Provide three or four connected, curated walking loops with different shade patterns. These are pedestrian paths in the simulation, not arbitrary lines crossing buildings. Store path lengths and bench positions. Use a selectable walking pace to estimate travel time.

Use a declared latitude/longitude solely to calculate the sun, and display the simulation's timezone. Keep coordinates, geometry, heights, and a sample date in a versioned fixture so the demonstration can be reproduced. Choose a sample configuration after verifying that it actually produces a meaningful route/time tradeoff. Let users try other dates too.

Calculate potential building shade independently of weather, then use synthetic forecast conditions to compare departure windows. Forecasts are part of the initial scope, supplied by local fixtures rather than live requests. Cloud cover must not be presented as building shade.

## Synthetic forecast and factors affecting a walk

Commit a seven-day hourly fixture for each scenario, with source = synthetic, units, timezone, valid timestamps, scenario/version ID, and generated metadata. Forecast cards must say “Simulated forecast,” including in saved cards and screenshots. Offer a few coherent scenarios: hot/clear, warm/humid, showers later, and gusty/stormy. Keep values physically plausible and reproducible, not randomly regenerated on every request.

Use a small normalized weather-provider interface. The initial provider reads fixtures; a future Open-Meteo adapter can use the same contract. Do not call a live service in the synthetic demo. Selected dates must be within fixture coverage; otherwise say weather is unavailable or explicitly create a newly dated synthetic scenario. Never reuse an old fixture as if it were a current forecast.

| Factor | Effect on planning | Interpretation boundary |
| --- | --- | --- |
| Temperature and apparent temperature | Prefer windows nearer the user's preferred feels-like range; display both values | Apparent temperature is an explicitly supplied synthetic fixture variable initially, not a value guessed by the LLM |
| Relative humidity | Explain warm/humid conditions alongside apparent temperature | Do not penalise humidity again when the apparent-temperature factor already accounts for comfort |
| Rain probability and precipitation amount | Honour “avoid rain”; compare hourly probability and amount over the walk interval | Do not sum hourly probabilities or invent a probability for the whole walk; show the maximum hourly probability as such |
| Wind speed and gusts | Compare windows against declared wind preferences; use peak gusts to avoid hiding a brief gusty period | Neighbourhood-wide fixture values are not a street-level wind simulation; building wind shelter is not inferred |
| Cloud cover | Explain clear versus cloudy conditions and the context for shade | 80% cloud does not mean 80% of a path is shaded, nor does cloud coverage alone quantify reduced sunlight |
| UV index | Display the scenario's UV value separately as context | Building shade and clouds must not be described as complete UV protection; UV is not combined into a medical safety score |
| Thunderstorm scenario flag | Exclude overlapping windows from recommendations and explain why | This is a synthetic scenario flag, not lightning detection or a live alert service |
| Daylight | Require the full planned walk to fit the supported daylight window | A cloudy daytime walk is not nighttime; model text cannot override solar calculations |

Use the hours overlapping the entire walk, including any planned rest. Present source resolution honestly: changing the sun every few minutes does not make an hourly weather fixture a minute-by-minute forecast. Use time-weighted apparent-temperature summaries and maximum hourly rain probability, rainfall amount, and gusts for conservative preference comparison. Do not linearly interpolate event codes, rain probabilities, or categorical storm flags.

The simulation gives all nearby routes the same ambient weather at a given time; routes differ in shade, duration, exposure, and rest stops. Do not invent temperatures under individual trees, benches, or building shadows. Benches provide rest, not rain shelter.

### Weather-aware ranking

Retain the route match components below and add a separately visible weather-fit component W, on a 0–1 scale. Its implemented default weights are 50% feels-like preference fit, 35% dry-weather preference fit, and 15% wind preference fit. These are disclosed defaults; custom temperature and wind preference bands are not supported in the MVP.

Publish the deterministic component rules in a versioned configuration: temperature fit decreases linearly with distance outside the selected preferred band; rain fit uses declared bands for maximum hourly probability and precipitation; wind fit uses declared bands for peak gusts. Implemented rules: feels-like preference is 22–30°C, with linear falloff over 12°C outside that band. Dryness fit is 1 minus the larger of hourly rain probability as a fraction or maximum hourly precipitation / 5 mm, clamped to 0–1. Gust fit declines linearly from 15 to 50 km/h. Describe these as preference heuristics rather than evidence-based safety limits. The model cannot change these thresholds.

Provisional overall match = 0.75 × route match + 0.25 × (100W). Keep route match, weather fit, and their contributions individually visible. Supported presets may change these declared weights. Hard constraints and thunderstorm exclusions apply before scoring. Geometry or weather gaps suppress the combined score; a separately labelled shade-only comparison may remain available.

The planner may say “No matching window in this scenario.” It must not recommend the least-bad option as if it met the user's conditions. Include at least one demo where a shadier route loses overall because its departure window conflicts with rain preferences, and one where every window is excluded.

## Shade calculation

Work in local metric coordinates. Calculate sun altitude and azimuth for each sampled instant, with the units and azimuth convention verified against the pinned library version.

Treat buildings as vertical prisms on flat terrain. For each path sample, cast a ray toward the sun: intersect the ray with nearby building footprints and compare the ray's height at entry with building height. A known building blocking the ray yields predicted shade. Missing building heights yield uncertainty where they could affect the result; they are not silently treated as zero-height buildings.

Use the simple shadow-length relation h / tan(sun altitude) as an independent sanity check. Exclude nighttime from shade comparisons and handle near-horizon cases explicitly.

Score each route at the time the walker reaches each segment, not just at departure. For an initial implementation, sample the path approximately every 5–10 metres and candidate departures every 15 minutes; then check sensitivity to finer sampling.

For every option, return distance, duration, estimated shaded/exposed/unknown distance, longest continuous exposed stretch, bench availability, and assumptions. Unknown distance stays separate. In the simulation these are modelled estimates, not measured real-world shade percentages.

Model synthetic tree canopies as opaque horizontal disks at known heights, projected opposite the sun direction. Include this shade in path and bench calculations and show its footprint separately on the map. Disclose the approximation; real foliage can transmit light. Sloping terrain, heat stress, and sidewalk-level accuracy remain outside scope.

## Applicable lessons from the supplied ClearNight write-up

Adopt ranked options, deterministic scores with factor breakdowns, computed facts verified before display, reproducible offline fixtures, explicit mock-data labels, and a small prediction-versus-observation loop. The supplied write-up describes these patterns; its performance and accuracy claims have not been independently verified here.

Keep the existing local-model planning workflow: the model interprets preferences and selects among feasible computed options. It must not calculate or rewrite shade estimates, weather, or score components. Synthetic weather is now explicitly part of the user's requested scope. Sensor feeds, astronomy features, and the reference project's build orchestration are not dependencies for this application.

### Route scores that answer the walking question

Display two different concepts clearly:

- **Predicted shade:** shaded distance / total route distance, with exposed and unknown distance shown separately. This is a geometry output.
- **Preference match, 0–100:** a transparent product heuristic for comparing feasible route/departure pairs under the current preferences. It is not a probability, real-world accuracy percentage, or heat-safety score.

Enforce hard constraints such as departure interval, maximum duration, and a required rest stop before ranking. Do not allow a high score to rescue an infeasible route.

Provisional default components, to validate during the build:

- S = known shaded distance / total distance.
- C = 1 − min(longest uninterrupted non-shaded walking time / 5 minutes, 1). Unknown samples count conservatively as non-shaded for this heuristic, while remaining visibly unknown in the shade breakdown. The five-minute reference is a configurable preference, not a health threshold.
- R = best available bench suitability / 100, only when a rest stop is desired.
- Default match = 100 × (0.60S + 0.25C + 0.15R). When rest stops are irrelevant, omit R and renormalise the other weights. Publish the weights and component contributions; supported preference presets may change weights deterministically.

These terms deliberately capture both total shade and the distribution of exposure. Check that the chosen weights yield understandable comparisons rather than tune them to make one demo route win. The model maps supported qualitative preferences to these declared presets; it does not invent weights.

If unknown geometry affects more than a provisional 20% of route distance, show “Limited data” and withhold the aggregate match score. Document this configurable disclosure threshold and show coverage for every route. It is not calibrated statistical confidence. Calculate only with full precision and round for display.

Rank numerically under the declared preset. If the model recommends another feasible candidate for a supported qualitative reason, keep the numerical ranking intact and explain that difference; never alter scores to agree with model prose.

### Bench suitability, not invented bench quality

Store synthetic bench IDs and positions explicitly. For the MVP, evaluate only benches directly on the route; unsupported detours are excluded.

Show a **rest-stop fit** score for each bench, with two components:

- Up to 60 points for predicted building and tree shade at arrival: shaded = 60, exposed = 0, unknown = “Shade unknown” with no aggregate score.
- Up to 40 points for timing: let f be the fraction of the walk completed on arrival; points = 40 × max(0, 1 − 2 × abs(f − 0.5)). A bench halfway scores highest for the default mid-walk rest preference.

Bench labels describe supplied evidence: “Shaded at arrival,” “Exposed at arrival,” and “Near halfway.” Do not infer comfort, maintenance, availability, shelter, or accessibility. If a user explicitly requests a shaded rest stop, require a known shaded bench rather than merely award extra points.

Treat bench arrival as the time before a rest. If planned rest duration is supported, add that duration before calculating subsequent route segments. Otherwise state that duration estimates assume continuous walking and do not include a rest.

### A small accountability loop

Save a prediction snapshot with route geometry/version, date, departure time, pace, model tag, score version, shade breakdown, weather scenario/version and summaries, and identified rest stop. A comparison entry can record “Followed this plan?”, a checkpoint marked shaded/exposed/unclear, and an optional note. Preserve the original prediction when fixtures or scoring rules change.

Use clearly labelled demo entries to demonstrate this feature initially. Do not report real-world accuracy, automatic learning, or calibration from synthetic logs. For a future outdoor test, compare checkpoint predictions and observations at matching locations and timestamps; retain mismatches as evidence of limitations.

## Give the open model a consequential job

Use a small two-stage planning workflow rather than an unrestricted chatbot:

1. **Interpret preferences:** convert natural language into a strict schema: requested duration, departure interval, walking pace, shade preference, rest-stop preference, rain preference, and supported constraints. Custom temperature/wind thresholds and exact rest timings are outside the current schema. Distinguish explicit requests from defaults. Ask for clarification or show an unsupported-constraint message when necessary.
2. **Choose and explain:** provide only calculated, feasible route/time candidates and their evidence. Let the model select a candidate ID according to qualitative preferences and return concise reasons and tradeoffs referring to supplied evidence IDs.

The deterministic layer enforces hard constraints and validates candidate IDs, numerical claims, and evidence references. The model cannot invent paths, benches, weather, or shade measurements. Prefer structured reason categories with trusted values inserted into the final card; validate any free prose for unsupported claims. Retry once on an invalid response, then expose an honest failure state.

Changing a request from “maximum shade” to “shorter, with a place to rest” must change the parsed constraints and may change the recommendation. This is the key demonstration that the model influences the plan rather than merely decorating a result.

When Ollama is unavailable, structured controls still permit a deterministic comparison, but the interface must clearly report that AI planning is unavailable. Never substitute a canned answer while presenting it as live inference.

## Proposed implementation

- Implemented as plain JavaScript ES modules, HTML/CSS, and a small Node server. The simpler stack avoids framework overhead for this compact local app.
- A local SVG map for the simulated district: no map API key, tile server, or external map download required.
- SunCalc for solar position, pinned to a verified release with unit conventions covered by tests.
- A small geometry module for footprint intersections, sample classification, and route/time comparison.
- A fixture-backed hourly weather adapter and deterministic weather preference rules, with no external requests initially.
- Ollama on the local machine, called only by the server. Model tag and endpoint set through environment configuration.
- JSON-schema structured model responses, validated with Zod or equivalent.
- Local browser storage for saved walk cards. Bundle the simulation assets for offline reuse after initial loading; verify offline behaviour before advertising it.

Suggested modules: `simulation`, `solar`, `shade`, `routes`, `weather`, `scoring`, `planner`, `ollama`, `walk-card`, and a small `comparison-log`. Keep geometry, weather summaries, and scoring independent of the model so swapping Llama for Gemma cannot alter calculated facts or scores.

## Delivery order and completion gates

1. **Runtime check:** identify the installed Llama tag, verify one local inference call and structured output, and record model/runtime versions. The earlier `ollama list` command crashed in this execution environment; investigate the running service separately rather than assume the model is missing.
2. **Simulation and geometry:** render the district and moving shadows; verify a known building case and a shadow-free case. Confirm the sample neighbourhood produces useful time-dependent options.
3. **Walking and weather comparison:** compute route and bench arrival times, shade/exposure/unknown totals, hourly synthetic weather summaries, factor scores, departure comparisons, exclusions, and a deterministic baseline recommendation. Fix and verify score rules before adding AI explanations.
4. **Local AI planning:** implement constraint extraction, bounded candidate selection, validation, failure states, and model configuration.
5. **Usable interface:** finish the request flow, result card, time slider, ranked alternatives with factor breakdowns, bench labels, simulation labels, saved walk card, and minimal comparison log.
6. **Evidence and packaging:** run the checks below, record the actual demo, document local setup, and draft the submission from measured results.

Finish each gate before adding live weather services, city-wide routing, real-world maps, accounts, or vision features.

## Meaningful verification

- Geometry: at 45° sun altitude, a 10 m building should produce a 10 m shadow on flat ground; test directions, boundaries, overlapping buildings, unknown heights, and nighttime.
- Time: verify timezone conversion and that later route segments use later sun positions.
- Routing: ensure all loops follow the synthetic path graph and remain inside requested time limits.
- Scoring: under fixed preferences, increasing known shade cannot reduce its shade contribution; increasing uninterrupted exposure cannot improve its exposure contribution. Verify score bounds, rest-weight renormalisation, hard-constraint exclusions, and limited-data suppression using independently specified cases.
- Benches: verify halfway versus endpoint timing, arrival-time shade changes, unknown shade handling, required shaded-rest exclusions, and any rest-duration effect on later segments.
- Weather: verify hourly interval boundaries and timezone alignment, missing/stale coverage, scenario labels, storm exclusions, the no-matching-window state, rain/gust summaries, weight renormalisation, and that cloud changes never change geometric building shade.
- AI: evaluate a small curated set of requests, including conflicting preferences, ambiguous time phrases, unsupported accessibility claims, and attempts to request invented facts. Record extraction correctness, valid selections, and latency.
- Integrity: unavailable Ollama, invalid JSON, fabricated route IDs, and unsupported explanations must produce explicit states rather than apparent success.
- Interaction: save a card, reload it, and verify what works with internet access disabled. Local inference still requires the local Ollama service and downloaded weights.
- Comparison log: preserve the exact original prediction snapshot and distinguish seeded demo entries from user-entered observations.

Do not infer wheelchair accessibility from flat synthetic geometry. Only support attributes that the fixture explicitly contains.

## Build evidence for the submission template

| Template section | What implementation should provide | Evidence to capture |
| --- | --- | --- |
| What I Built | One clear question, moving shade, a personalised walk card, and who benefits | Screenshot of request → result; explain how the card shortens screen time |
| Demo | A reproducible local walkthrough and short video | Show a shadow/time change, score breakdown, shaded bench at arrival, a weather-driven departure change, a no-matching-window case, saved card, and labelled demo comparison |
| Code | Repository with runnable app, fixtures, prompts, geometry, and checks | Setup instructions, environment example, tested model tag, licence and attribution |
| How I Built It | Actual local Llama/Ollama workflow plus deterministic geometry and scoring | Architecture sketch, input/output example, published score formula, measured latency, assumptions and failures |
| Why Does Open Innovation Matter? | Local preference processing, editable planning prompts, replaceable model, inspectable simulation | Actual offline test and actual model/configuration changes; distinguish benefits from untested possibilities |
| My Agent Session | Optional account of the build process | Save/link a session only if available; do not invent a DevRelay link |
| Prize Categories | Only verified categories whose requirements the project meets | Check current challenge requirements before naming any category |

Suggested working title: “ShadeWindow: find your walk's window of shade with local AI.”

Submission story: problem → moving-shade insight → personal request → calculated options → local model decision → saved card → what testing revealed. Keep simulations visibly labelled in screenshots and prose. Do not claim an outdoor trial, prediction accuracy, or Gemma use that has not happened.

For a later outdoor extension, import one real neighbourhood, audit heights and paths, then compare predictions with timestamped observations at a few checkpoints. This is optional future work, not a prerequisite or completed result for the simulated MVP.

## Honest open-innovation claims

The initial app can process personal preferences locally with an open-weight Llama model and an open-source runtime. It needs no paid inference API, but local compute is not costless. Prompts, validation, and geometry are inspectable and editable. Confirm the exact model's licence before distribution; open weights and unrestricted open-source licensing are not interchangeable.

Full privacy depends on implementation: no analytics, external tiles, or remote inference in the bundled simulation. Verify network requests before making a “data stays local” claim. A future real-map or weather integration will introduce external data requests that must be disclosed.

## Technical references checked during planning

- Ollama structured outputs: https://docs.ollama.com/capabilities/structured-outputs
- SunCalc official repository: https://github.com/mourner/suncalc
- Future building-height data: https://wiki.openstreetmap.org/wiki/Key:height
- Weather variable definitions and future live adapter: https://open-meteo.com/en/docs
- Heat-index interpretation limits: https://www.weather.gov/safety/heat-index
- Thunderstorm/outdoor context: https://www.weather.gov/safety/lightning-outdoors
- Future tile integration: https://operations.osmfoundation.org/policies/tiles/ — standard OSM tiles cannot be bulk-prefetched for an offline feature; the synthetic SVG map avoids that dependency.

The preferences remain visible beside the map. Every control change recalculates the cards, chosen departure, map, and weather. Stale AI responses cannot overwrite newer preferences.

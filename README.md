# Behind the Walls

Willy Ko · CS331 Data Visualization midterm · **Undercurrents**

**Live website:** [behind-the-walls-nine.vercel.app](https://behind-the-walls-nine.vercel.app/) · **Code:** [willyko1/behindthewalls](https://github.com/willyko1/behindthewalls)

An interactive D3 exploration of NYC 311 heat and hot-water complaints created **October 1, 2025–May 31, 2026**. Designed for NYC renters, with tenant organizers and community-board housing committees as a secondary audience.

The project asks how reported problems change over time and boroughs, and how the interpretation changes when counting distinct reported addresses rather than complaints. It uses a frozen historical snapshot, not a live outage feed.

## Run locally

Requires Python 3 for the local server; Node.js 22+ for tests and packaging. There are no npm dependencies and no environment variables.

```sh
npm run dev
# Open http://127.0.0.1:4173/
npm test
npm run build
# dist/ contains the deployment files
```

Opening `index.html` as a `file://` URL will not work because browsers restrict fetching local JSON. Serve the folder over HTTP. D3 7.9.0, both data files, fonts (system fonts), and all visual assets are local. After loading the site, exploration does not make requests to NYC, Observable, or a CDN. Source links require an internet connection when followed.

## Explore

- Keep all eight monthly bars in view while selecting an individual month or the full season.
- Select a borough using the map, borough buttons, or comparison rows.
- Switch between complaints and distinct reported addresses; map, timeline, ranking, summary, and histogram update together.
- Follow October → January → addresses. Every step is deterministic, including if chosen out of order.
- Reset to full season / all NYC / complaints.
- Use **Copy view link** to share the current selection. A selected-text dialog provides a manual copy fallback if clipboard access is unavailable or denied.
- Use Tab and Enter/Space on controls and map regions. Left/Right, Home/End navigate the timeline; Escape on a map region clears the borough. Controls expose selected state, and an accessible exact-value table complements map color and hover tooltips.

Example query:

```text
?month=2026-01&borough=bronx&measure=addresses
```

Valid months are `2025-10` through `2026-05`, or `season`; boroughs are `all`, `bronx`, `brooklyn`, `manhattan`, `queens`, and `staten island`; measures are `reports` and `addresses`. Invalid or missing values fall back independently. Parameters restore on refresh, changes add browser history entries, and Back/Forward restores the view. Links preserve the hosting subdirectory.

## Data provenance

- [NYC 311 Service Requests](https://data.cityofnewyork.us/d/erm2-nwe9): complaint type `HEAT/HOT WATER`, source-local created timestamps `>= 2025-10-01` and `< 2026-06-01`.
- [DCP Borough Boundaries](https://data.cityofnewyork.us/d/gthc-hcne): simplified official borough geometry.
- Snapshot retrieval date: **October 7, 2026**.
- Immediate source: [Willy Ko’s public Observable prototype](https://observablehq.com/@willy-ko/behind-the-walls). Its complete visualization cell was recovered through the public source editor and preserved in `references/observable-cell.js`. The older classic Observable JS export exposed only the introductory Markdown; it was not used as the analytical source.
- `data/heat-summary.json` and `data/boroughs-simplified.geojson` are extracted from that recovered cell. No new 311 API results were substituted. See `scripts/extract-reference.py` for repeatable extraction and `data/provenance.json` for hashes.

The linked [published ChatGPT Site](https://behind-the-walls-nyc.jlko1114.chatgpt.site) was also inspected. It is a broader apartment-search implementation with saved places and individual address exploration. This repository implements the anonymous borough-level midterm brief using the frozen Observable aggregates; it does not implement the Site’s ChatGPT sign-in or saved-place backend. Its private Library HTML, methodology file, and presentation files were not available locally and their contents were not assumed.

## Counting method

`heat-summary.json` contains 63 precomputed records: 7 geographic scopes (citywide, five named boroughs, unspecified) × 9 periods (season plus eight months). A grouped record is **not** one request. Read its `reports` total.

An address key is **borough + incident address trimmed and converted to uppercase**. Each address is counted once within the selected period. The full-season row is independently deduplicated over all eight months; **never sum monthly distinct-address counts to calculate season addresses**. Apartment formatting and address inconsistencies affect these counts. This repository has the anonymous aggregates, not the underlying request-level snapshot, so it verifies aggregate consistency but cannot independently rerun the original address normalization or raw-data cleaning.

`repeated` counts addresses with more than one complaint in the selected period. `histogram` contains counts of addresses with 1, 2–5, 6–20, and 21+ complaints. `multipleMonths` is available for the season rows only.

Verified reference values:

| Scope | Complaints | Distinct reported addresses |
|---|---:|---:|
| Full season, all NYC | 341,824 | 41,102 |
| January, Bronx | 27,176 | 5,232 |
| January, Brooklyn | 21,945 | 5,884 |

One unspecified-borough request is included in citywide totals, including January, and omitted from the five-borough map. Seventeen requests lack coordinates; requests with known boroughs remain in borough totals. Those missing-coordinate facts come from the prototype and project handoff; they cannot be re-audited from the aggregates alone.

The map color domain is **0 to the largest of the five borough counts in the selected period and measure**. It rescales when the period or measure changes, as disclosed in its legend. Selecting a borough does not change that domain. The timeline scales to the maximum monthly value for the selected borough and measure. Read the exact values to compare across views; color alone is not a stable cross-view scale. GeoJSON is cloned and winding is corrected for D3 spherical rendering without altering the saved geometry.

## Interpretation and privacy

- Complaints are reported experiences, not confirmed violations, repair outcomes, or a measure of affected people or households.
- Several requests may describe the same building-wide problem, different problems, or different residents. The data cannot distinguish these situations.
- Access to 311 and willingness to report affect the visible pattern; unreported problems are absent.
- Borough totals have no housing-stock or population denominator and are not comparable risk rates.
- No weather data is joined. Seasonal peaks do not establish a causal temperature relationship.
- Address keys are imperfect building proxies. Public assets contain no individual address labels or service-request identifiers.
- The project has **not** been submitted to the City. No classmate testing or instructor feedback is claimed.

## Deployment: Vercel (primary)

The website is a static site. `vercel.json` specifies framework **Other**, build command `npm run build`, install command `npm install --ignore-scripts`, and output directory `dist`. No server, database, account login, or secret is required.

For continuous deployment, import `willyko1/behindthewalls` into the intended Vercel team (or connect this repository in the existing project’s Git settings), use the repository root, and retain those settings. Review the production branch and access settings in the dashboard. Deployment success and unauthenticated public access are separate checks: the team may apply Vercel Authentication to new deployments by default.

See `docs/verification.md` for the actual deployment status and browser checks; preparation alone does not mean a site is published. Existing ChatGPT Site hosting is not changed by this repository.

## Optional GitHub Pages compatibility

All asset paths are relative, so the site also works under `/behindthewalls/`. If Pages is wanted later, enable **Settings → Pages → Deploy from a branch**, choose `main`, `/ (root)`, and save. The root files run without a build, and `.nojekyll` disables Jekyll processing. Vercel is the requested deployment target; enabling Pages is not necessary.

## Project structure

- `index.html`, `styles.css`: semantic page structure, responsive layout, CSS apartment illustration.
- `app.js`: D3 map, linked controls, timeline, rankings, and summaries.
- `model.js`: URL state, aggregate lookup, label helpers, clipboard fallback.
- `data/`: anonymous frozen aggregates and recovered geometry.
- `vendor/`: pinned local D3 and its ISC license.
- `references/observable-cell.js`: unchanged source reference, not loaded by the app.
- `scripts/`: repeatable data extraction and static packaging.
- `tests/model.test.js`: substantive snapshot and URL/clipboard regression checks.
- `docs/`: verification evidence and assignment handoff checklist.

D3 is copyright Mike Bostock, under the ISC license in `vendor/D3-LICENSE`. Dataset reuse is subject to the NYC Open Data source terms. No new license is assigned to Willy Ko’s original project material here.

## Interactive map update

The homepage is now a Leaflet street-map explorer with address/ZIP search, borough and month filters, viewport-based results, clickable reported addresses, and monthly building histories. The earlier D3 experience is retained at `analysis.html`.

The map uses `data/buildings.json`, recovered from the existing public app’s `/data/season.json`, retrieved October 21, 2026. This is a separate snapshot from the October 7 aggregates. Public address labels are now intentionally shown following the revised map-explorer brief. No user reviews are implemented. OpenStreetMap street tiles require network access. At wide zoom levels, at most 4,000 highest-count locations are drawn per viewport; the sidebar shows the first 100. Zoom in to reveal additional addresses. Missing-coordinate addresses cannot be mapped.

Production browser checks confirmed street tiles, address search, borough filtering, selection, and a monthly history panel. The seven existing automated tests cover the retained aggregate analysis, not the new map UI.

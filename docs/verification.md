# Verification — October 28, 2026

## Local implementation

`npm test`: 7 tests passed. `npm run build`: passed. `node --check app.js`: passed.

Automated coverage includes full-season totals, every scope’s borough sums, January Bronx/Brooklyn values, season request sums, histogram consistency, the difference between monthly and season distinct addresses, all 108 URL state combinations, independent invalid-parameter defaults, subdirectory preservation, and successful/denied/missing clipboard behavior.

Browser flow checked using the Codex in-app browser:

- Frozen local JSON → D3 map and linked summary renders correctly.
- Season: 341,824 complaints and 41,102 distinct reported addresses.
- January Bronx: 27,176 complaints / 5,232 addresses.
- January Brooklyn: 21,945 complaints / 5,884 addresses.
- Map click, borough button, measure toggle, and guided January/addresses steps coordinate the views.
- Refresh preserves selection. Back/Forward restores prior selections.
- A direct invalid URL canonicalizes to the default view.
- Timeline click and ArrowRight select the expected month; keyboard Enter selects a map borough; reset restores the season.
- Copy button reports successful copy. The browser control’s clipboard reader returned a stale system clipboard, so byte-for-byte clipboard verification is limited to the automated helper tests; unavailable/denied fallbacks are tested there, not through forced browser permissions.
- 390px mobile layout inspected; 320px and 390px page widths checked for horizontal overflow (none).
- No captured browser warnings/errors during the checked flow.

The static app has no API route, database, authentication requirement, or runtime environment variable. All analytical requests are to local JSON files. The original request-level snapshot is unavailable, so these checks verify recovered aggregates, not the original raw-data cleaning process.

## Vercel

Project created: `behind-the-walls`, ID `prj_Wmx427SUZMhcwlfEeyUujRB3GvAZ`, connected team `Clef` (`clef5`). Production deployment completed with status **READY**.

- Live production alias: https://behind-the-walls-nine.vercel.app/
- Deployment URL: https://behind-the-walls-o2nt0ozl5-clef5.vercel.app/
- Deployment ID: `dpl_EEqTu4efkk4bxdFHzHzXRRVURYCv`
- Runtime source commit: `8019cb7` on `main`. Subsequent documentation-only commits do not change deployed runtime assets.
- Framework: static HTML / D3; build succeeded in approximately 3 seconds.
- Unauthenticated HTTP check returned **200** for the production alias. The deployed aggregate JSON equals the local frozen snapshot exactly.
- Production browser direct link restored January / Bronx / addresses with 27,176 complaints and 5,232 addresses. The address walkthrough ranked Brooklyn (5,884) above the Bronx (5,232), and reset restored 341,824 / 41,102. No browser warnings or errors were captured.
- Source pushed to https://github.com/willyko1/behindthewalls on `main`.
- `docs/preview.png` is a screenshot of the actual Vercel production page.

The project inherited team Vercel Authentication, which was preserved. The production alias above was independently verified as publicly readable. No existing ChatGPT Site was altered.

Deployment used the verified local source files through Vercel’s API; automatic Git deployments are not connected. For automatic deployments after future pushes, open the existing project’s **Settings → Git → Connect Git Repository** and select `willyko1/behindthewalls`, production branch `main`. No setting is required to view the already published production site.

This is a static site without server functions. Runtime function logs, log drains, and database checks are not applicable; production verification used HTTP responses, data equality, and browser console checks. Continuous error monitoring is not configured.

## Building research update — October 28, 2026

- Ten automated tests pass, including recurrence, tied peaks, empty histories, and shortlist validation; static build succeeds.
- Local browser: all 41,091 geocoded matching addresses enter clusters; viewport list renders.
- Comparison checked against monthly data: 2800 Creston Avenue totals 1,730; peak January 388 (22%); 225 Central Park North totals 1,194; peak December 236 (20%).
- Three-address limit shows feedback; shortlist restores after reload. January filter changes Creston profile count to 388 while preserving full-season history.
- 390×844 comparison dialog inspected with horizontal table scrolling; no browser console errors observed.

## Neighborhood and linked-chart update — October 28, 2026

- 13 tests pass; production build succeeds. Tests cover Bed-Stuy aliases, Kips Bay's combined geography, unknown names, selected-period aggregates, full-season timelines, and empty selections.
- Browser verified Kips Bay = Murray Hill-Kips Bay: 777 reports, 213 addresses. Bed-Stuy = East + West: 7,220 reports, 1,357 addresses. These match independent aggregation of the frozen JSON.
- Selecting January in the D3 timeline changes Bed-Stuy to 1,700 reports / 565 addresses. Keyboard activation of the neighborhood ranking drills down to Bedford-Stuyvesant (East).
- Unknown neighborhood displays explicit no-match state and zero statistics. Metric switch, polygon shading, and 390px mobile charts inspected; no console errors observed.
- Boundaries/names recovered from the existing application's 262-feature NTA collection; names resolve to the same NTA IDs already present in address records. Kips Bay's combined-area limitation is disclosed.

## Renter market context — October 28, 2026

- Public StreetEasy master archive imported into a dated 182-area snapshot; latest month September 2026, five bedroom groupings, 13 monthly observations. Source and archive hash recorded.
- 17 automated tests pass and static build succeeds. New checks cover neighborhood versus borough matching, no averaging of geographic medians, null preservation, and budget arithmetic.
- Browser: Bed-Stuy all-bedroom median $3,595; 1-bedroom median $3,245, 436 listings, 16.5% rent-cut share. $3,000 budget produces a $245 / 8.2% gap. Kips Bay explicitly shows Manhattan-only context. Address profile links to rent context and identifies it as an area benchmark, not building rent.
- Mobile renter overview inspected at 390×844; no console errors. HPD and StreetEasy public links verified; MTA link uses its current homepage after its former /tripplanner path returned 404.
- Midterm requirements checked directly in the Google Doc MIDTERM tab: 5–7 slides, PDF presentation, live demo and reflection; detailed checklist in docs/midterm-handoff.md.

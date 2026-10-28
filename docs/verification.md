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

Project created: `behind-the-walls`, ID `prj_Wmx427SUZMhcwlfEeyUujRB3GvAZ`, connected team `Clef` (`clef5`). Deployment pending at the time of this initial verification record. Final deployment evidence will be appended after the deployment completes.

The new project inherited team Vercel Authentication. Deployment readiness and anonymous public access must be verified separately. No existing ChatGPT Site was altered.

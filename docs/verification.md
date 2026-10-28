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

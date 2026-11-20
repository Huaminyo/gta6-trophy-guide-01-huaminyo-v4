[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# The Leonida Field Manual

An offline guide and tracker for all **55 Grand Theft Auto VI PlayStation 5 trophies** — built for [make.fun's GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

A single-page web app that runs from its own files, with the network off:

- **Tracker** — all 55 trophies with official names, descriptions and grades; tick them off, progress saves in `localStorage`. Filters by grade, kind, roadmap phase, missable, and search. Count trackers on the 29 trophies PlayStation counts.
- **Roadmap** — four phases to the platinum (360 / 525 / 165 / 300 PTS), in play order.
- **100% Checklist** — 27 completion categories with their targets.
- **Routes** — 15 ordered stage lists for the long grinds.
- **Sources & Disputes** — 15 cited sources and 9 open disputes, each resolved to a call.
- **Missables** — the 6 trophies that can be missed, with their windows.
- **Spoiler mask** — hidden trophies stay masked until earned.
- **Demo progress** — one click ticks the 18 Phase-1 story trophies (345 PTS) a first playthrough earns.
- **Export / Import** — progress as one JSON file.

Every guide is written for this manual in its own words and cites its sources beside the steps. The audit strip at the top shows the guide's own figures, computed live from the data: 55/55 official, 160/160 steps cited, 32 backed 2+, 15 sources, 9 disputes, 29 trackers, 28 hidden, demo 18/55, 345/1,350 PTS.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static file server. No build step, no network calls at run time.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

- `app/index.html` — page shell: masthead, audit strip, tabs, filters
- `app/style.css` — tactical field-manual theme
- `app/main.js` — bootstrap, events, deep links (`?view=`, `?demo=1`, `?open=`)
- `app/data.js` — data loading and the audit computation
- `app/store.js` — localStorage state, export/import
- `app/views.js` — the six screens and the trophy card
- `app/data/` — `trophies.json`, `routes.json`, `sources.json`
- `screenshots/` — 4 renders of the app (tracker cover, roadmap, missables, sources)
- `main.ts` — entrypoint; `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

No Rockstar Games logo, official artwork or game screenshot is used anywhere. Official trophy names, descriptions and grades are as PlayStation publishes them.

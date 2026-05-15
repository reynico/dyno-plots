# Dyno plots

![Dyno plot example](assets/screenshot_dynoplot.jpg "Dyno plot example")

Dyno plots is a client-side web tool to compare dyno runs from
[MWD](http://www.mwdyno.com/) and [Horacio Resio](http://www.horacioresio.com/)
dynos. Multiple runs with mixed sources can be compared at once (e.g. a MWD run
against a Horacio Resio run).

It is now a fully static [Next.js](https://nextjs.org/) app — all file parsing
and plotting happen in the browser, so there is no server to run and it deploys
to Cloudflare Pages or Vercel as static assets.

## Supported formats

- `.csv` — generic file with an `rpm`, `hp`, `tq` header
- `.ine` — Horacio Resio
- `.ad3` — MWD

Don't have a file at hand? Use the [samples](samples/) folder.

## Develop (containerized)

Everything runs inside Docker — no Node/npm on the host.

```
docker compose up
```

Then open <http://localhost:3000/>. The `.devcontainer` config points at the
same compose service for VS Code Dev Containers.

## Build static site

```
docker compose run --rm web npm run build
```

The static site is written to `out/`.

## Deploy

- **Cloudflare Pages** — build command `npm run build`, output directory `out`
- **Vercel** — zero config; the static export is detected automatically

## Demo

![Dyno plot demo](assets/demo.gif "Dyno plot demo")

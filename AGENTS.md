# NeonLink: guide for contributors and coding agents

NeonLink is a self-hosted link page configured entirely by environment variables. Start with
[README.md](README.md); detail is in [docs/](docs/).

1. **Content lives in configuration.** Every word and link comes from an environment variable.
   Never hard-code anyone's personal content in `app/`, `tests/`, examples or screenshots; use the
   invented sample profile. `make check` runs a leak scan (`scripts/leak_scan.mjs`); maintainers can
   add a private block list with `NEONLINK_LEAK_TERMS=<file>`.
2. **Keep littlelink-server variable names working.** New behaviour gets a new optional variable with
   a generic default, documented in docs/configuration.md and listed (commented out with its default)
   in compose.yaml; the repository check fails otherwise.
3. **No runtime dependencies.** Node 20+ only; the image runs `node app/server.mjs` and nothing else.
4. **Themes share one content model.** A theme is a folder in `app/themes/`; it must pass
   `tests/themes.test.mjs` and keep the reduced-motion and no-JavaScript fallbacks.
5. **Escape everything.** Configured text goes through `esc()`; URLs through `safeUrl()`/`safeImage()`.
6. **Before a pull request:** `make verify`, a local Docker run on 127.0.0.1, and `make browser` at
   390/900/1440 px for any theme, CSS or script change.
7. Small, focused branches, one pull or merge request each. Never commit straight to `main`.

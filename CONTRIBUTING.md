# Contributing to NeonLink

Thanks for helping. Bug reports, theme ideas and pull requests are all welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- NeonLink has **no runtime dependencies** and no build step. Please keep it that way.
- Every visible word is configuration. New behaviour gets a new optional environment variable with a
  generic default, documented in the README tables (`make check` enforces this).
- Keep littlelink-server variable names working.

## Develop

You need Node.js 20 or newer and, for the container, Docker.

```bash
make verify     # repository and leak check + unit tests (nothing to install)
make up         # sample page on http://127.0.0.1:4191/
make browser    # browser checks at 390, 900 and 1440 px (needs Playwright with Chromium)
```

`make media` regenerates every README picture and the hero animation from the sample profile, and
`make demo` writes static copies of each theme to `dist/demo/`.

## Pull requests

- One focused change per pull request, with tests for behaviour changes.
- Run `make verify`; for theme, CSS or script changes also run `make browser` and include a screenshot.
- Use only the invented sample profile in examples, tests and screenshots. Never commit real
  personal data, private addresses or secrets; `make check` scans for them.
- New themes live in `app/themes/<name>/`, must pass `tests/themes.test.mjs`, and keep the
  reduced-motion and no-JavaScript fallbacks. Fonts must be self-hosted under an open licence and
  listed in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

By contributing you agree that your contribution is licensed under the [MIT licence](LICENSE).
Please follow the [code of conduct](CODE_OF_CONDUCT.md).

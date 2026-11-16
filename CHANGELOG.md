# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- `compose.yaml` is now the file users download: it runs the published image
  (`ghcr.io/the-digital-dev/neonlink:latest`) on http://127.0.0.1:8080/ and lists every setting,
  grouped by section with a one-line explanation and its default, plus all 162 platform variables.
  To hide an element, set it to `""` (an empty `KEY:` line passes nothing in Compose).
  `docker compose up -d` works with the sample profile straight away; pictures go in `./media`.
- Building from a checkout moved to `compose.dev.yaml` (`make up`, still on port 4191).
- README quick start: download `compose.yaml`, edit, run. Links to the live theme demos.
- Repository links point at `github.com/The-Digital-Dev/NeonLink`.
- Deployment guide: Portainer needs an absolute media folder; the Cloudflare Tunnel example keeps the
  hardened container settings.

### Added

- `make check` fails when a setting the app reads, or a built-in platform, is missing from
  `compose.yaml`; `scripts/build_platform_docs.mjs` keeps the platform catalogue there in sync.

## [0.1.0] - 2026-11-16

First public release.

### Added

- Link page rendered from environment variables, compatible with littlelink-server variable names.
- Three themes: Neon (default), Neural and Opening Bell, switched with `THEME`.
- 162 built-in platforms with coloured logos, including `PHONE` and `SMS`, plus unlimited custom links
  (comma lists or `LINK_<n>_*`) with any platform logo, an emoji or a monogram, and accent colours.
- `BOOT_MODE` (full, short, once, off) and loader tokens `{name}`, `{first}`, `{handle}`, `{count}`, `{platforms}`.
- Pictures from a URL or a mounted media folder, with a generated initials avatar and favicon.
- Optional Google Analytics, Umami, Matomo, Plausible and Cloudflare Web Analytics.
- Strict Content-Security-Policy, read-only non-root container, `/healthcheck`.
- Static export of every theme for hosting demos (`make demo`).
- Multi-architecture image (linux/amd64, linux/arm64) without npm.

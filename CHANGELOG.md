# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

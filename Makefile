# NeonLink. Node 20+ is the only requirement; there is nothing to install.
PLAYWRIGHT_PATH ?=
BASE_URL ?= http://127.0.0.1:4191/
# Another Compose file: make up COMPOSE=path/to/compose.yaml
COMPOSE ?= compose.yaml
IMAGE ?= neonlink:local
PLATFORMS ?= linux/amd64,linux/arm64

.PHONY: check test verify up down logs browser media demo image image-multiarch
check:
	node scripts/check_repository.mjs
test:
	node --test tests/*.test.mjs
verify: check test
up:
	docker compose -f "$(COMPOSE)" up -d --build
down:
	docker compose -f "$(COMPOSE)" down
logs:
	docker compose -f "$(COMPOSE)" logs -f --tail=50
browser:
	BASE_URL="$(BASE_URL)" PLAYWRIGHT_PATH="$(PLAYWRIGHT_PATH)" node scripts/browser_check.mjs
# README screenshots, social card and hero animation from the sample profile (Playwright, ffmpeg, img2webp).
media:
	PLAYWRIGHT_PATH="$(PLAYWRIGHT_PATH)" node scripts/capture_media.mjs
# Static copies of every theme in dist/demo/ (for GitHub Pages or any static host).
demo:
	node scripts/export_static.mjs --out dist/demo
image:
	docker build -t "$(IMAGE)" --build-arg SOURCE_REVISION="$$(git rev-parse --short HEAD 2>/dev/null || echo development)" .
# Multi-architecture build check (needs a docker-container buildx builder; nothing is pushed).
image-multiarch:
	docker buildx build --platform "$(PLATFORMS)" -t "$(IMAGE)" .

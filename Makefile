# NeonLink. Node 20+ is the only requirement; there is nothing to install.
PLAYWRIGHT_PATH ?=
HOST_PORT ?= 4191
BASE_URL ?= http://127.0.0.1:$(HOST_PORT)/
# make up builds from this checkout (compose.yaml + compose.dev.yaml). Other files: make up COMPOSE="a.yaml b.yaml"
COMPOSE ?= compose.yaml compose.dev.yaml
IMAGE ?= neonlink:local
PLATFORMS ?= linux/amd64,linux/arm64

.PHONY: check test verify up down logs browser media demo image image-multiarch
check:
	node scripts/check_repository.mjs
test:
	node --test tests/*.test.mjs
verify: check test
DC = HOST_PORT="$(HOST_PORT)" docker compose $(foreach f,$(COMPOSE),-f "$(f)")
up:
	$(DC) up -d --build
down:
	$(DC) down
logs:
	$(DC) logs -f --tail=50
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

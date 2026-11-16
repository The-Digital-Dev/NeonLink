# syntax=docker/dockerfile:1.7
# NeonLink: an environment-configured link page. One small Node process, no runtime dependencies.
# Base pinned by digest (multi-arch index: linux/amd64 and linux/arm64); refresh monthly or on a
# Node security release.
ARG NODE_IMAGE=node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a

# ---- check: fails the build if the shipped files contain personal or internal content ----------
# Built-in rules always run. Maintainers can add a private block list without it entering the image:
#   docker build --secret id=leak-terms,src=/path/to/terms.txt .
FROM ${NODE_IMAGE} AS check
WORKDIR /src
COPY app ./app
COPY scripts/leak_scan.mjs ./scripts/leak_scan.mjs
RUN --mount=type=secret,id=leak-terms,required=false \
    if [ -s /run/secrets/leak-terms ]; then set -- --terms /run/secrets/leak-terms; fi; \
    node scripts/leak_scan.mjs "$@" app && touch /src/.leak-scan-passed

# ---- runtime -----------------------------------------------------------------------------------
FROM ${NODE_IMAGE}
ARG SOURCE_REVISION=development
ARG VERSION=0.0.0-dev
LABEL org.opencontainers.image.title="NeonLink" \
      org.opencontainers.image.description="Self-hosted link-in-bio page configured entirely by environment variables" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    RELEASE=${SOURCE_REVISION} \
    MEDIA_DIR=/app/media

# NeonLink never runs a package manager, so npm, npx, corepack and yarn are removed: fewer files,
# and no scanner findings for tools that are never executed.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* /root/.npm /tmp/*

WORKDIR /app
COPY --from=check /src/.leak-scan-passed /tmp/.leak-scan-passed
COPY --chown=root:root package.json ./
COPY --chown=root:root app ./app
RUN rm /tmp/.leak-scan-passed && mkdir -p /app/media && chmod -R a+rX /app

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthcheck').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "app/server.mjs"]

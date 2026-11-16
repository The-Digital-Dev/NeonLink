# Putting NeonLink online

NeonLink is one container that listens on port 3000 and serves a single page. It needs no
database, no volume (except an optional read-only media folder) and no secrets. Put it behind
whatever already serves your other sites.

## Container settings that apply everywhere

```yaml
services:
  links:
    image: ghcr.io/the-digital-dev/neonlink:latest   # or pin a version, e.g. :0.1.0
    restart: unless-stopped
    read_only: true
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    volumes:
      - ./media:/app/media:ro          # optional: avatar.jpg, favicon.svg, other images
    environment:
      NAME: Alex Rivera
      OG_URL: https://links.example.com/   # your public address: canonical link and share cards
```

- The page is rendered at start-up. After changing a variable, recreate the container
  (`docker compose up -d`).
- `/healthcheck` returns `{"status":"ok"}` for load balancers and uptime monitors. The image has a
  built-in Docker health check.
- Images are published for `linux/amd64` and `linux/arm64` (Raspberry Pi 4/5, Apple silicon, ARM
  servers).

## Behind a reverse proxy

Keep NeonLink off the public internet and let the proxy terminate TLS: either put the proxy on the
same Docker network and point it at `links:3000`, or publish the port on the loopback only
(`ports: ["127.0.0.1:8080:3000"]`) for a proxy running on the host, as in the Nginx example.

**Caddy** (automatic HTTPS):

```caddyfile
links.example.com {
  reverse_proxy links:3000   # the Compose service name, on the same Docker network
}
```

**Nginx:**

```nginx
server {
  listen 443 ssl;
  server_name links.example.com;
  # ssl_certificate ... ;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Traefik** labels:

```yaml
    labels:
      - traefik.enable=true
      - traefik.http.routers.links.rule=Host(`links.example.com`)
      - traefik.http.routers.links.tls.certresolver=letsencrypt
      - traefik.http.services.links.loadbalancer.server.port=3000
```

**Nginx Proxy Manager:** add a proxy host for your domain pointing at the container name (or host)
and port 3000, request a certificate, and turn on "Force SSL".

NeonLink sends its own security headers (Content-Security-Policy, `X-Frame-Options`,
`Referrer-Policy` and more). Leave them as they are in the proxy.

## Portainer

Create a stack (**Stacks → Add stack → Web editor**), paste the Compose service above with your
values, and deploy. To change the page later, edit the stack's environment values and choose
**Update the stack**. For the media folder, use a bind mount to a folder on the host.

## Cloudflare Tunnel

Run `cloudflared` next to NeonLink and route a public hostname to it; no port needs to be open on
your router.

```yaml
services:
  links:
    image: ghcr.io/the-digital-dev/neonlink:latest
    read_only: true
    environment:
      NAME: Alex Rivera
      CLOUDFLARE_WEB_ANALYTICS: "false"   # "true" if you turn on Cloudflare Web Analytics
  tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${TUNNEL_TOKEN}       # keep it in an .env file, never in Git
```

In the Cloudflare dashboard, add a public hostname for the tunnel with service `http://links:3000`.
If Cloudflare Web Analytics is on, set `CLOUDFLARE_WEB_ANALYTICS=true` so the page's
Content-Security-Policy allows the beacon Cloudflare injects.

## Static hosting (GitHub Pages, Netlify, any web server)

`make demo` (or `node scripts/export_static.mjs --out dist/demo`) renders every theme with the
values in `compose.yaml` to plain files with relative links. Upload one theme folder, or the whole
`dist/demo/` folder. The repository's "Demo site" workflow publishes it to GitHub Pages.
Static hosts cannot send headers, so the export puts the Content-Security-Policy in a `<meta>` tag
(`frame-ancestors` cannot be set that way). Rebuild after each change.

## Updating

```bash
docker compose pull && docker compose up -d
```

Pin a version tag in production and read the [changelog](../CHANGELOG.md) before moving up.

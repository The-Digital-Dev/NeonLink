# Configuration reference

Every setting NeonLink reads. The [README](../README.md#make-it-yours) lists the ones most people change,
and [compose.yaml](../compose.yaml) lists all of them, ready to switch on by removing the `#`.

Every visible word and every link is an environment variable. All variables are optional.
Lists are comma-separated, and items in the same position belong together. Write `\,` to keep a
comma inside a list item (for example in a label). In Compose, a literal `$` is written `$$`.
Where a setting says "empty hides it", write empty quotes in Compose (`AVATAR_BADGE: ""`): a bare
`AVATAR_BADGE:` line is null in YAML, so Compose passes nothing and the default stays.

## Identity

| Variable | Default | Purpose |
| --- | --- | --- |
| `NAME` | `NeonLink` | Name in the heading, title and copyright |
| `BIO` | `Links \| Projects \| Contact` | Taglines under the name, separated by `\|` |
| `LEDE` | empty | A sentence or two under the taglines (Opening Bell types it into its brief card) |
| `LOCATION` | empty | Short place name shown in the Neural and Opening Bell status pills |
| `AVATAR_URL` | auto | Profile picture: a full URL or `/media/<file>`. If unset, `media/avatar.(png\|jpg\|jpeg\|webp\|svg)` is used, then a generated initials avatar |
| `AVATAR_2X_URL` | empty | Optional high-resolution picture for sharp screens |
| `AVATAR_ALT` | `Portrait of <NAME>` | Alternative text for the picture |
| `AVATAR_BADGE` | `ONLINE` | Small badge on the picture (Neural and Opening Bell show it in the status pill); empty hides it |
| `SIGIL` | initials of `NAME` | Letters on the boot sigil, generated avatar and favicon (up to 3) |

## Links

| Variable | Default | Purpose |
| --- | --- | --- |
| `<PLATFORM>` | none | The link URL for a built-in platform, for example `GITHUB`, `LINKED_IN`, `YOUTUBE`, `X`. Every name, with its icon, is in [docs/platforms.md](platforms.md). `EMAIL` and `EMAIL_ALT` take a plain address; `PHONE` and `SMS` take a plain number such as `+1 555 0100` |
| `<PLATFORM>_TEXT` | platform name | Label for that link, for example `LINKED_IN_TEXT=Connect on LinkedIn`. `EMAIL_TEXT` and `EMAIL_ALT_TEXT` work as in littlelink-server |
| `<PLATFORM>_NOTE` | empty | Second line under the label (primary list only) |
| `<PLATFORM>_ICON` | bundled icon | Replace the icon with a URL or `/media/<file>` |
| `CUSTOM_BUTTON_NAME` | none | Names of custom links (used for ordering and analytics) |
| `CUSTOM_BUTTON_URL` | none | Their URLs |
| `CUSTOM_BUTTON_TEXT` | none | Their labels |
| `CUSTOM_BUTTON_NOTE` | empty | Their second lines |
| `CUSTOM_BUTTON_ICON` | monogram | Per link: an image URL or `/media/<file>`, the name of any built-in platform (`github`, `kofi`, `brand-etsy`), or an emoji (`🛍️`). Empty: the first letter of the label, styled by the theme |
| `CUSTOM_BUTTON_COLOR` | none | Accent colour per custom link (`#rgb` or `#rrggbb`). Neon makes the card border glow, Neural lights the icon node, Opening Bell fills the ticker chip (with black or white text, whichever reads better) |
| `CUSTOM_BUTTON_ALT_TEXT` | empty | Alternative text for custom icons |
| `CUSTOM_BUTTON_TEXT_COLOR` | none | Accepted for littlelink-server compatibility; the theme sets text colour |
| `BUTTON_ORDER` | source order | Names listed here come first, in this order, for example `GITHUB,BLOG,EMAIL` |
| `BUTTON_TARGET` | `_blank` | Where web links open |

### Custom links, one variable per field

Long comma lists are hard to read, so custom links can also be written one per number. Both forms
work together: comma-list links come first, then numbered links in number order (gaps are fine).
`BUTTON_ORDER`, `PRIMARY_BUTTONS` and `FEATURED_BUTTON` use the link's name for either form.

| Variable | Required | Purpose |
| --- | --- | --- |
| `LINK_<n>_URL` | yes | Where the link goes, for example `LINK_1_URL` |
| `LINK_<n>_TEXT` | yes | The label |
| `LINK_<n>_NAME` | no | Name for ordering and analytics (default `LINK<n>`) |
| `LINK_<n>_NOTE` | no | Second line, the small text |
| `LINK_<n>_ICON` | no | Same choices as `CUSTOM_BUTTON_ICON` |
| `LINK_<n>_COLOR` | no | Accent colour, as `CUSTOM_BUTTON_COLOR` |
| `LINK_<n>_ALT` | no | Alternative text for an image icon |

```yaml
      # Comma lists (littlelink-server form)...
      CUSTOM_BUTTON_NAME: SHOP,TALKS
      CUSTOM_BUTTON_URL: https://example.com/shop,https://example.com/talks
      CUSTOM_BUTTON_TEXT: Visit my shop,Conference talks
      CUSTOM_BUTTON_ICON: etsy,🎤
      # ...or the same two links, one field per line:
      LINK_1_NAME: SHOP
      LINK_1_URL: https://example.com/shop
      LINK_1_TEXT: Visit my shop
      LINK_1_ICON: etsy
      LINK_1_COLOR: "#F1641E"
      LINK_2_NAME: TALKS
      LINK_2_URL: https://example.com/talks
      LINK_2_TEXT: Conference talks
      LINK_2_NOTE: Slides and recordings
      LINK_2_ICON: 🎤
```

Quote colours in Compose (`"#F1641E"`), because `#` starts a comment in YAML. On the dark themes a very
dark accent is lightened for text and borders so it stays readable; fills (the Opening Bell ticker)
use it as given. Neon keeps a card's look when it has a picture: the accent then tints the icon only.

Coming from littlelink-server: `CUSTOM_BUTTON_ICON` values there are Font Awesome class names
(`fas fa-file-alt`). NeonLink does not load Font Awesome, so such a value falls back to the monogram
with a warning in the log; use a platform name, an emoji or a `/media/` file instead. Alpha in
`#rrggbbaa` colours is ignored.

A custom link is shown when its name, URL and label are all set. URLs must be `https:`, `http:`,
`mailto:`, `tel:`, `sms:` or a path on the same site (not starting `//` or `/\`); anything else, or a
URL containing control characters, is skipped with a warning in the container log.

## Sections and featured card

| Variable | Default | Purpose |
| --- | --- | --- |
| `PRIMARY_BUTTONS` | work links | Names shown in the primary list. Default: the leading run of custom links, LinkedIn and email |
| `SECTION_PRIMARY_TITLE` | theme default | Heading of the primary list (Neon `Uplinks`, Neural `Suggested next steps`, Opening Bell `The portfolio`) |
| `SECTION_SECONDARY_TITLE` | theme default | Heading of the compact grid (Neon `Around the web`); the other themes show these links as an icon row and use the title as its accessible name |
| `LINKS_LABEL` | `<NAME> links` | Accessible name of the primary list |
| `FEATURED_BUTTON` | first primary link | Name of the link shown as the large featured card; `none` hides the card |
| `FEATURED_TEXT` | the link's label | Featured card title |
| `FEATURED_LABEL` | theme default | Small line above the featured title (Neon `Featured // start here`, Neural `Start here`, Opening Bell `Top pick · start here`) |
| `FEATURED_IMAGE` | the link's icon | Picture on the featured card (a URL or `/media/<file>`) |

## Page chrome and boot sequence

| Variable | Default | Purpose |
| --- | --- | --- |
| `THEME` | `neon` | Design: `neon`, `neural` or `opening-bell`. `dark`, `light` and `auto` (littlelink-server values) select the default |
| `HUD_TITLE` | `NAME` in snake_case | Top-left label (Neural shows it in the status pill) |
| `HUD_SUFFIX` | `// link.sys` | Neon: text after the top-left label; empty hides it |
| `CLOCK_TIMEZONE` | empty | Neon: IANA time zone for a small clock in the top bar, for example `America/Denver`; empty hides it |
| `CLOCK_LABEL` | empty | Neon: short label before the clock |
| `SHARE` | empty | Neon: URL for the Share button; empty hides the button |
| `SHARE_TEXT` | `Share` | Neon: Share button label |
| `CORNER_LEFT` | `sys:online` | Neon: desktop corner text, `label:value` pairs separated by `\|` |
| `CORNER_RIGHT` | empty | Neon: same, bottom right |
| `BOOT_MODE` | `full` | The loader: `full`, `short` (about twice as fast), `once` (full on the first visit in a browser session, then the page appears at once) or `off`. Visitors can always tap to skip, and with reduced motion turned on the loader never shows |
| `BOOT_ENABLED` | `true` | `false` is the same as `BOOT_MODE=off` (littlelink-server style switch) |
| `BOOT_LOG` | `{handle}.sys booting\|[OK] Mounted /home/guest\|[OK] Reached target network.online\|[OK] Loaded {platforms}\|[OK] Linked {count} destinations` | Neon: boot log lines separated by `\|`. Start a line with `[OK]` for a green badge |
| `BOOT_PROMPT` | `guest@{handle}:~$` | Neon: prompt on the last boot line (in Compose write `$$` for `$`) |
| `BOOT_COMMAND` | `./welcome.sh` | Neon: command after the prompt |
| `BOOT_HINT` | theme default | Skip hint on the loader |
| `BOOT_GRANTED` | theme default | Text shown when the loader completes (Neon `Access granted`, Opening Bell `Market open`) |
| `BOOT_QUESTION` | `who is {name}?` | Neural: the question typed on the loader |
| `BOOT_STAGES` | theme default | Neural and Opening Bell: loader status lines separated by `\|` (Neural `Thinking…\|Reading {count} links…\|Writing answer…`, Opening Bell `Pre-market\|Reading the tape\|Sizing {count} links`) |
| `INTRO_LABEL` | theme default | Opening Bell: label on the brief card (`AI brief · the thesis`) |
| `DISCLAIMER` | theme default | Opening Bell: footer note that charts are decoration; empty hides it |
| `BACKGROUND_WORDS` | theme default | Neural: words drifting in the background, separated by `\|` |

### Loader tokens and examples

Every loader text (`BOOT_LOG`, `BOOT_PROMPT`, `BOOT_COMMAND`, `BOOT_HINT`, `BOOT_GRANTED`,
`BOOT_QUESTION`, `BOOT_STAGES`) can use these tokens, filled from your own settings:

| Token | Becomes |
| --- | --- |
| `{name}` | `NAME` |
| `{first}` | The first word of `NAME` |
| `{handle}` | `HUD_TITLE`, or `NAME` in snake_case |
| `{count}` | The number of links |
| `{platforms}` | The first four built-in platforms you link, for example `YouTube · GitHub` |
| `{year}` | The current year |

The text is shown as plain text (never as HTML). Before and after, Neon:

```yaml
      # Before: nothing set. The loader types the generic log:
      #   alex_rivera.sys booting / [OK] Mounted /home/guest / ... / [OK] Linked 11 destinations
      #   guest@alex_rivera:~$ ./welcome.sh
      # After:
      BOOT_MODE: once
      BOOT_LOG: "{first}.os waking up|[OK] Coffee loaded|[OK] Synced {platforms}|[OK] {count} links ready"
      BOOT_PROMPT: "{handle}@studio:~$$"
      BOOT_COMMAND: ./say-hello.sh
      BOOT_GRANTED: Welcome in
```

Neural and Opening Bell read `BOOT_QUESTION` and `BOOT_STAGES` instead:

```yaml
      BOOT_QUESTION: what is {first} building?
      BOOT_STAGES: Checking the workshop…|Counting {count} links…|Writing the answer…
```

## Footer

| Variable | Default | Purpose |
| --- | --- | --- |
| `FOOTER_TITLE` | empty | Footer heading |
| `FOOTER` | empty | Footer paragraph (plain text) |
| `COPYRIGHT` | `© {year} {name}` | Footer copyright; `{year}` and `{name}` are filled in |
| `BACK_TO_TOP_TEXT` | `Back to top ↑` | Footer link text |

## Metadata, favicon and robots

| Variable | Default | Purpose |
| --- | --- | --- |
| `LANG` | `en` | Page language. A locale such as `en_US.UTF-8` becomes `en-US`; anything that is not a language tag falls back to `en` |
| `META_TITLE` | `<NAME> — Links` | Browser tab title |
| `META_DESCRIPTION` | `BIO` | Search description |
| `META_AUTHOR`, `META_KEYWORDS` | empty | Optional meta tags |
| `META_INDEX_STATUS` | `index,follow` | Robots meta value |
| `OG_TITLE`, `OG_DESCRIPTION`, `OG_SITE_NAME`, `OG_URL`, `OG_IMAGE`, `OG_IMAGE_WIDTH`, `OG_IMAGE_HEIGHT` | from the above | Open Graph tags. `OG_URL` also sets the canonical link |
| `TWITTER_CARD`, `TWITTER_SITE`, `TWITTER_CREATOR`, `TWITTER_TITLE`, `TWITTER_DESCRIPTION`, `TWITTER_IMAGE` | from the above | Twitter/X card tags |
| `FAVICON_URL` | auto | Favicon URL. If unset, `media/favicon.(svg\|png\|ico)`, then a generated favicon with `SIGIL` |
| `APPLE_TOUCH_ICON_URL` | empty | Home-screen icon |
| `THEME_COLOR` | theme colour | Browser UI colour (`#rrggbb`) |
| `ROBOTS_TXT` | allow all | Full `/robots.txt` body; `\n` for new lines |
| `ROBOTS_ADDITIONAL_RULES` | empty | Lines appended to the default `/robots.txt` |

## Analytics

| Variable | Purpose |
| --- | --- |
| `GA_TRACKING_ID` | Google Analytics 4 measurement ID |
| `UMAMI_WEBSITE_ID`, `UMAMI_APP_URL`, `UMAMI_SCRIPT_NAME` | Umami (script name defaults to `script.js`) |
| `MATOMO_URL`, `MATOMO_SITE_ID` | Matomo |
| `PLAUSIBLE_URL`, `PLAUSIBLE_DATA_DOMAIN`, `PLAUSIBLE_DATA_API` | Plausible (`PLAUSIBLE_URL` is the script URL) |
| `CLOUDFLARE_WEB_ANALYTICS` | `true` when the site is behind Cloudflare with Web Analytics turned on. Cloudflare injects its beacon at the edge; this lets the Content-Security-Policy allow it (`static.cloudflareinsights.com`, `cloudflareinsights.com`). Default `false` |

The Content-Security-Policy opens only the origins of the providers you configure. Google Analytics is
set up by the bundled loader, so it needs no inline script.

## Server

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port inside the container |
| `HOST` | `0.0.0.0` | Bind address inside the container |
| `MEDIA_DIR` | `/app/media` | Folder served at `/media/` |
| `RELEASE` | image revision | Shown in `/healthcheck` and the release response header (printable ASCII only; other characters are dropped) |
| `SKIP_HEALTH_CHECK_LOGS` | `false` | `true` stops logging each health check |
| `NODE_ENV` | `production` | `test` silences health logs in tests |

Accepted for compatibility and ignored, because the theme owns them: `DROP_SHADOW`, `THEME_OS`,
`AVATAR_SIZE` and `CUSTOM_BUTTON_TEXT_COLOR`.

## Your own pictures and icons

Mount a folder read-only at `/app/media` and its images are served at `/media/`:

- `avatar.jpg` (or `.png`, `.jpeg`, `.webp`, `.svg`) becomes the profile picture automatically.
- `favicon.svg` (or `.png`, `.ico`) becomes the favicon automatically.
- Any other image can be used by path, for example `CUSTOM_BUTTON_ICON=/media/shop.png` or
  `FEATURED_IMAGE=/media/me-small.jpg`.

Only image files are served from the folder, with a five-minute cache and a sandbox policy. Symbolic
links are followed only when they point at an image inside the folder.
A variable always wins over a dropped-in file.

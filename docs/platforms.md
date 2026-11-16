# Supported platforms

NeonLink has **162 built-in platforms**. Set the variable to your link and the button
appears with its icon; add `<VARIABLE>_TEXT` for your own label, `<VARIABLE>_NOTE` for a second line and
`<VARIABLE>_ICON` to swap the icon. For anything not listed, use a custom link
([configuration](configuration.md#links)); a custom link can borrow any icon below by its variable,
for example `LINK_1_ICON: kofi` or `CUSTOM_BUTTON_ICON: LINKED_IN`.

![Every built-in platform icon with its name](images/platforms.png)

To see every button in each design, open the "all platforms" demo of each theme
(`make demo`, then `dist/demo/<theme>/all-platforms/`).

| Icon | Platform | Variable | Takes |
| --- | --- | --- | --- |
| <img src="../app/public/icons/brand-500px.svg" width="20" height="20" alt=""> | 500px | `FIVEHUNDREDPX` | a link |
| <img src="../app/public/icons/brand-amazon.svg" width="20" height="20" alt=""> | Amazon Affiliate | `AMAZON_AFFILIATE` | a link |
| <img src="../app/public/icons/generic-music.svg" width="20" height="20" alt=""> | Amazon Music | `AMAZON_MUSIC` | a link |
| <img src="../app/public/icons/brand-amazon.svg" width="20" height="20" alt=""> | Amazon Wishlist | `AMAZON_WISHLIST` | a link |
| <img src="../app/public/icons/brand-anilist.svg" width="20" height="20" alt=""> | AniList | `ANILIST` | a link |
| <img src="../app/public/icons/brand-appstore.svg" width="20" height="20" alt=""> | App Store | `APP_STORE` | a link |
| <img src="../app/public/icons/brand-applemusic.svg" width="20" height="20" alt=""> | Apple Music | `APPLE_MUSIC` | a link |
| <img src="../app/public/icons/brand-apple-podcasts.svg" width="20" height="20" alt=""> | Apple Podcasts | `APPLE_PODCASTS` | a link |
| <img src="../app/public/icons/brand-artstation.svg" width="20" height="20" alt=""> | ArtStation | `ARTSTATION` | a link |
| <img src="../app/public/icons/brand-audius.svg" width="20" height="20" alt=""> | Audius | `AUDIUS` | a link |
| <img src="../app/public/icons/brand-bandcamp.svg" width="20" height="20" alt=""> | Bandcamp | `BANDCAMP` | a link |
| <img src="../app/public/icons/brand-behance.svg" width="20" height="20" alt=""> | Behance | `BEHANCE` | a link |
| <img src="../app/public/icons/brand-blog.svg" width="20" height="20" alt=""> | Blog | `BLOG` | a link |
| <img src="../app/public/icons/brand-bluesky.svg" width="20" height="20" alt=""> | Bluesky | `BLUESKY` | a link |
| <img src="../app/public/icons/brand-buymeacoffee.svg" width="20" height="20" alt=""> | Buy Me a Coffee | `BUYMEACOFFEE` | a link |
| <img src="../app/public/icons/brand-calcom.svg" width="20" height="20" alt=""> | Cal.com | `CALCOM` | a link |
| <img src="../app/public/icons/brand-calendly.svg" width="20" height="20" alt=""> | Calendly | `CALENDLY` | a link |
| <img src="../app/public/icons/brand-phone.svg" width="20" height="20" alt=""> | Call me | `PHONE` | a phone number |
| <img src="../app/public/icons/brand-cashapp.svg" width="20" height="20" alt=""> | Cash App | `CASHAPP` | a link |
| <img src="../app/public/icons/generic-code.svg" width="20" height="20" alt=""> | CodePen | `CODEPEN` | a link |
| <img src="../app/public/icons/brand-codewars.svg" width="20" height="20" alt=""> | Codewars | `CODEWARS` | a link |
| <img src="../app/public/icons/brand-credly.svg" width="20" height="20" alt=""> | Credly | `CREDLY` | a link |
| <img src="../app/public/icons/brand-deezer.svg" width="20" height="20" alt=""> | Deezer | `DEEZER` | a link |
| <img src="../app/public/icons/designbyhumans.svg" width="20" height="20" alt=""> | Design By Hümans | `DESIGNBYHUMANS` | a link |
| <img src="../app/public/icons/brand-devto.svg" width="20" height="20" alt=""> | Dev.to | `DEVTO` | a link |
| <img src="../app/public/icons/brand-discogs.svg" width="20" height="20" alt=""> | Discogs | `DISCOGS` | a link |
| <img src="../app/public/icons/brand-discord.svg" width="20" height="20" alt=""> | Discord | `DISCORD` | a link |
| <img src="../app/public/icons/brand-dockerhub.svg" width="20" height="20" alt=""> | Docker Hub | `DOCKERHUB` | a link |
| <img src="../app/public/icons/dreamwidth.svg" width="20" height="20" alt=""> | Dreamwidth | `DREAMWIDTH` | a link |
| <img src="../app/public/icons/brand-dribbble.svg" width="20" height="20" alt=""> | Dribbble | `DRIBBBLE` | a link |
| <img src="../app/public/icons/brand-email.svg" width="20" height="20" alt=""> | Email | `EMAIL` | an e-mail address |
| <img src="../app/public/icons/email_alt.svg" width="20" height="20" alt=""> | Email | `EMAIL_ALT` | an e-mail address |
| <img src="../app/public/icons/brand-etsy.svg" width="20" height="20" alt=""> | Etsy | `ETSY` | a link |
| <img src="../app/public/icons/brand-facebook.svg" width="20" height="20" alt=""> | Facebook | `FACEBOOK` | a link |
| <img src="../app/public/icons/brand-figma.svg" width="20" height="20" alt=""> | Figma | `FIGMA` | a link |
| <img src="../app/public/icons/brand-fiverr.svg" width="20" height="20" alt=""> | Fiverr | `FIVERR` | a link |
| <img src="../app/public/icons/brand-flickr.svg" width="20" height="20" alt=""> | Flickr | `FLICKR` | a link |
| <img src="../app/public/icons/brand-forgejo.svg" width="20" height="20" alt=""> | Forgejo | `FORGEJO` | a link |
| <img src="../app/public/icons/brand-geocaching.svg" width="20" height="20" alt=""> | Geocaching | `GEOCACHING` | a link |
| <img src="../app/public/icons/brand-ghost.svg" width="20" height="20" alt=""> | Ghost | `GHOST` | a link |
| <img src="../app/public/icons/brand-gitbucket.svg" width="20" height="20" alt=""> | GitBucket | `GITBUCKET` | a link |
| <img src="../app/public/icons/brand-gitea.svg" width="20" height="20" alt=""> | Gitea | `GITEA` | a link |
| <img src="../app/public/icons/brand-github.svg" width="20" height="20" alt=""> | GitHub | `GITHUB` | a link |
| <img src="../app/public/icons/brand-gitlab.svg" width="20" height="20" alt=""> | GitLab | `GITLAB` | a link |
| <img src="../app/public/icons/brand-gofundme.svg" width="20" height="20" alt=""> | GoFundMe | `GOFUNDME` | a link |
| <img src="../app/public/icons/brand-goodreads.svg" width="20" height="20" alt=""> | Goodreads | `GOODREADS` | a link |
| <img src="../app/public/icons/brand-googlecalendar.svg" width="20" height="20" alt=""> | Google Calendar | `GOOGLE_CALENDAR` | a link |
| <img src="../app/public/icons/brand-googledrive.svg" width="20" height="20" alt=""> | Google Drive | `GOOGLE_DRIVE` | a link |
| <img src="../app/public/icons/brand-googlemaps.svg" width="20" height="20" alt=""> | Google Maps | `GOOGLEMAPS` | a link |
| <img src="../app/public/icons/brand-googleplay.svg" width="20" height="20" alt=""> | Google Play | `GOOGLE_PLAY` | a link |
| <img src="../app/public/icons/google-podcasts.svg" width="20" height="20" alt=""> | Google Podcasts | `GOOGLE_PODCASTS` | a link |
| <img src="../app/public/icons/brand-googlescholar.svg" width="20" height="20" alt=""> | Google Scholar | `GOOGLESCHOLAR` | a link |
| <img src="../app/public/icons/brand-hackernews.svg" width="20" height="20" alt=""> | Hacker News | `HACKER_NEWS` | a link |
| <img src="../app/public/icons/brand-hashnode.svg" width="20" height="20" alt=""> | Hashnode | `HASHNODE` | a link |
| <img src="../app/public/icons/brand-huggingface.svg" width="20" height="20" alt=""> | Hugging Face | `HUGGINGFACE` | a link |
| <img src="../app/public/icons/brand-instagram.svg" width="20" height="20" alt=""> | Instagram | `INSTAGRAM` | a link |
| <img src="../app/public/icons/instantgaming.svg" width="20" height="20" alt=""> | Instant Gaming | `INSTANTGAMING` | a link |
| <img src="../app/public/icons/brand-internetarchive.svg" width="20" height="20" alt=""> | Internet Archive | `INTERNETARCHIVE` | a link |
| <img src="../app/public/icons/jetphotos.svg" width="20" height="20" alt=""> | JetPhotos | `JETPHOTOS` | a link |
| <img src="../app/public/icons/brand-kaggle.svg" width="20" height="20" alt=""> | Kaggle | `KAGGLE` | a link |
| <img src="../app/public/icons/brand-kakaotalk.svg" width="20" height="20" alt=""> | KakaoTalk | `KAKAOTALK` | a link |
| <img src="../app/public/icons/brand-keybase.svg" width="20" height="20" alt=""> | Keybase | `KEYBASE` | a link |
| <img src="../app/public/icons/brand-kick.svg" width="20" height="20" alt=""> | Kick | `KICK` | a link |
| <img src="../app/public/icons/brand-kickstarter.svg" width="20" height="20" alt=""> | Kickstarter | `KICKSTARTER` | a link |
| <img src="../app/public/icons/brand-kit.svg" width="20" height="20" alt=""> | Kit | `KIT` | a link |
| <img src="../app/public/icons/brand-kofi.svg" width="20" height="20" alt=""> | Ko-fi | `KOFI` | a link |
| <img src="../app/public/icons/brand-lastfm.svg" width="20" height="20" alt=""> | Last.fm | `LASTFM` | a link |
| <img src="../app/public/icons/brand-leetcode.svg" width="20" height="20" alt=""> | LeetCode | `LEETCODE` | a link |
| <img src="../app/public/icons/brand-lemmy.svg" width="20" height="20" alt=""> | Lemmy | `LEMMY` | a link |
| <img src="../app/public/icons/brand-letterboxd.svg" width="20" height="20" alt=""> | Letterboxd | `LETTERBOXD` | a link |
| <img src="../app/public/icons/brand-linemessenger.svg" width="20" height="20" alt=""> | Line Messenger | `LINE` | a link |
| <img src="../app/public/icons/brand-linkedin.svg" width="20" height="20" alt=""> | LinkedIn | `LINKED_IN` | a link |
| <img src="../app/public/icons/brand-mailchimp.svg" width="20" height="20" alt=""> | Mailchimp | `MAILCHIMP` | a link |
| <img src="../app/public/icons/brand-makerworld.svg" width="20" height="20" alt=""> | Makerworld | `MAKERWORLD` | a link |
| <img src="../app/public/icons/brand-mastodon.svg" width="20" height="20" alt=""> | Mastodon | `MASTODON` | a link |
| <img src="../app/public/icons/brand-matrix.svg" width="20" height="20" alt=""> | Matrix | `MATRIX` | a link |
| <img src="../app/public/icons/brand-medium.svg" width="20" height="20" alt=""> | Medium | `MEDIUM` | a link |
| <img src="../app/public/icons/brand-meetup.svg" width="20" height="20" alt=""> | Meetup | `MEETUP` | a link |
| <img src="../app/public/icons/brand-facebookmessenger.svg" width="20" height="20" alt=""> | Messenger | `FACEBOOK_MESSENGER` | a link |
| <img src="../app/public/icons/brand-microblog.svg" width="20" height="20" alt=""> | Microblog | `MICRO_BLOG` | a link |
| <img src="../app/public/icons/brand-mixcloud.svg" width="20" height="20" alt=""> | Mixcloud | `MIXCLOUD` | a link |
| <img src="../app/public/icons/brand-myanimelist.svg" width="20" height="20" alt=""> | MyAnimeList | `MYANIMELIST` | a link |
| <img src="../app/public/icons/neocities.svg" width="20" height="20" alt=""> | Neocities | `NEOCITIES` | a link |
| <img src="../app/public/icons/brand-nextcloud.svg" width="20" height="20" alt=""> | Nextcloud | `NEXTCLOUD` | a link |
| <img src="../app/public/icons/generic-chat.svg" width="20" height="20" alt=""> | Nostr | `NOSTR` | a link |
| <img src="../app/public/icons/brand-notion.svg" width="20" height="20" alt=""> | Notion | `NOTION` | a link |
| <img src="../app/public/icons/brand-obsidian.svg" width="20" height="20" alt=""> | Obsidian | `OBSIDIAN` | a link |
| <img src="../app/public/icons/brand-onlyfans.svg" width="20" height="20" alt=""> | OnlyFans | `ONLYFANS` | a link |
| <img src="../app/public/icons/brand-orcid.svg" width="20" height="20" alt=""> | ORCID | `ORCID` | a link |
| <img src="../app/public/icons/brand-osu.svg" width="20" height="20" alt=""> | osu! | `OSU` | a link |
| <img src="../app/public/icons/brand-overcast.svg" width="20" height="20" alt=""> | Overcast | `OVERCAST` | a link |
| <img src="../app/public/icons/brand-patreon.svg" width="20" height="20" alt=""> | Patreon | `PATREON` | a link |
| <img src="../app/public/icons/brand-paypal.svg" width="20" height="20" alt=""> | PayPal | `PAYPAL` | a link |
| <img src="../app/public/icons/brand-peertube.svg" width="20" height="20" alt=""> | PeerTube | `PEERTUBE` | a link |
| <img src="../app/public/icons/brand-pillowfort.svg" width="20" height="20" alt=""> | Pillowfort | `PILLOWFORT` | a link |
| <img src="../app/public/icons/brand-pinterest.svg" width="20" height="20" alt=""> | Pinterest | `PINTEREST` | a link |
| <img src="../app/public/icons/brand-pixelfed.svg" width="20" height="20" alt=""> | Pixelfed | `PIXELFED` | a link |
| <img src="../app/public/icons/brand-playstation.svg" width="20" height="20" alt=""> | PlayStation | `PLAYSTATION` | a link |
| <img src="../app/public/icons/brand-pocket-casts.svg" width="20" height="20" alt=""> | Pocket Casts | `POCKET_CASTS` | a link |
| <img src="../app/public/icons/polywork.svg" width="20" height="20" alt=""> | Polywork | `POLYWORK` | a link |
| <img src="../app/public/icons/brand-printables.svg" width="20" height="20" alt=""> | Printables | `PRINTABLES` | a link |
| <img src="../app/public/icons/privatebin.svg" width="20" height="20" alt=""> | Private Bin | `PRIVATEBIN` | a link |
| <img src="../app/public/icons/brand-producthunt.svg" width="20" height="20" alt=""> | Product Hunt | `PRODUCT_HUNT` | a link |
| <img src="../app/public/icons/brand-reddit.svg" width="20" height="20" alt=""> | Reddit | `REDDIT` | a link |
| <img src="../app/public/icons/brand-rss.svg" width="20" height="20" alt=""> | RSS | `RSS` | a link |
| <img src="../app/public/icons/brand-rumble.svg" width="20" height="20" alt=""> | Rumble | `RUMBLE` | a link |
| <img src="../app/public/icons/brand-semanticscholar.svg" width="20" height="20" alt=""> | Semantic Scholar | `SEMANTICSCHOLAR` | a link |
| <img src="../app/public/icons/serializd.svg" width="20" height="20" alt=""> | Serializd | `SERIALIZD` | a link |
| <img src="../app/public/icons/brand-session.svg" width="20" height="20" alt=""> | Session | `SESSION` | a link |
| <img src="../app/public/icons/brand-shazam.svg" width="20" height="20" alt=""> | Shazam | `SHAZAM` | a link |
| <img src="../app/public/icons/brand-shopify.svg" width="20" height="20" alt=""> | Shop | `SHOPIFY` | a link |
| <img src="../app/public/icons/brand-signal.svg" width="20" height="20" alt=""> | Signal | `SIGNAL` | a link |
| <img src="../app/public/icons/brand-simplex.svg" width="20" height="20" alt=""> | Simplex | `SIMPLEX` | a link |
| <img src="../app/public/icons/skoob.svg" width="20" height="20" alt=""> | Skoob | `SKOOB` | a link |
| <img src="../app/public/icons/slack.svg" width="20" height="20" alt=""> | Slack | `SLACK` | a link |
| <img src="../app/public/icons/brand-snapchat.svg" width="20" height="20" alt=""> | Snapchat | `SNAPCHAT` | a link |
| <img src="../app/public/icons/brand-soundcloud.svg" width="20" height="20" alt=""> | SoundCloud | `SOUND_CLOUD` | a link |
| <img src="../app/public/icons/spacehey.svg" width="20" height="20" alt=""> | SpaceHey | `SPACEHEY` | a link |
| <img src="../app/public/icons/brand-spotify.svg" width="20" height="20" alt=""> | Spotify | `SPOTIFY` | a link |
| <img src="../app/public/icons/brand-stackoverflow.svg" width="20" height="20" alt=""> | Stack Overflow | `STACKOVERFLOW` | a link |
| <img src="../app/public/icons/status.svg" width="20" height="20" alt=""> | Status | `STATUS` | a link |
| <img src="../app/public/icons/brand-steam.svg" width="20" height="20" alt=""> | Steam | `STEAM` | a link |
| <img src="../app/public/icons/brand-strava.svg" width="20" height="20" alt=""> | Strava | `STRAVA` | a link |
| <img src="../app/public/icons/brand-streamlabs.svg" width="20" height="20" alt=""> | Streamlabs | `STREAMLABS` | a link |
| <img src="../app/public/icons/brand-substack.svg" width="20" height="20" alt=""> | Substack | `SUBSTACK` | a link |
| <img src="../app/public/icons/teespring.svg" width="20" height="20" alt=""> | Teespring | `TEESPRING` | a link |
| <img src="../app/public/icons/brand-telegram.svg" width="20" height="20" alt=""> | Telegram | `TELEGRAM` | a link |
| <img src="../app/public/icons/brand-sms.svg" width="20" height="20" alt=""> | Text me | `SMS` | a phone number |
| <img src="../app/public/icons/tpdb.svg" width="20" height="20" alt=""> | The Poster Database | `TPDB` | a link |
| <img src="../app/public/icons/brand-thestorygraph.svg" width="20" height="20" alt=""> | The StoryGraph | `THESTORYGRAPH` | a link |
| <img src="../app/public/icons/brand-threads.svg" width="20" height="20" alt=""> | Threads | `THREADS` | a link |
| <img src="../app/public/icons/brand-threema.svg" width="20" height="20" alt=""> | Threema | `THREEMA` | a link |
| <img src="../app/public/icons/brand-tidal.svg" width="20" height="20" alt=""> | Tidal | `TIDAL` | a link |
| <img src="../app/public/icons/brand-tiktok.svg" width="20" height="20" alt=""> | TikTok | `TIKTOK` | a link |
| <img src="../app/public/icons/brand-trakt.svg" width="20" height="20" alt=""> | Trakt | `TRAKT` | a link |
| <img src="../app/public/icons/brand-tripadvisor.svg" width="20" height="20" alt=""> | Tripadvisor | `TRIPADVISOR` | a link |
| <img src="../app/public/icons/brand-tumblr.svg" width="20" height="20" alt=""> | Tumblr | `TUMBLR` | a link |
| <img src="../app/public/icons/brand-twitch.svg" width="20" height="20" alt=""> | Twitch | `TWITCH` | a link |
| <img src="../app/public/icons/brand-twitter.svg" width="20" height="20" alt=""> | Twitter | `TWITTER` | a link |
| <img src="../app/public/icons/brand-unsplash.svg" width="20" height="20" alt=""> | Unsplash | `UNSPLASH` | a link |
| <img src="../app/public/icons/brand-untappd.svg" width="20" height="20" alt=""> | Untappd | `UNTAPPD` | a link |
| <img src="../app/public/icons/brand-upwork.svg" width="20" height="20" alt=""> | Upwork | `UPWORK` | a link |
| <img src="../app/public/icons/brand-venmo.svg" width="20" height="20" alt=""> | Venmo | `VENMO` | a link |
| <img src="../app/public/icons/vero.svg" width="20" height="20" alt=""> | VERO | `VERO` | a link |
| <img src="../app/public/icons/brand-viber.svg" width="20" height="20" alt=""> | Viber | `VIBER` | a link |
| <img src="../app/public/icons/brand-vimeo.svg" width="20" height="20" alt=""> | Vimeo | `VIMEO` | a link |
| <img src="../app/public/icons/brand-vrchat.svg" width="20" height="20" alt=""> | VRChat | `VRCHAT` | a link |
| <img src="../app/public/icons/brand-vsco.svg" width="20" height="20" alt=""> | VSCO | `VSCO` | a link |
| <img src="../app/public/icons/brand-website.svg" width="20" height="20" alt=""> | Website | `WEBSITE` | a link |
| <img src="../app/public/icons/brand-wechat.svg" width="20" height="20" alt=""> | WeChat | `WECHAT` | a link |
| <img src="../app/public/icons/brand-weibo.svg" width="20" height="20" alt=""> | Weibo | `WEIBO` | a link |
| <img src="../app/public/icons/brand-wellfound.svg" width="20" height="20" alt=""> | Wellfound | `WELLFOUND` | a link |
| <img src="../app/public/icons/brand-whatsapp.svg" width="20" height="20" alt=""> | WhatsApp | `WHATSAPP` | a link |
| <img src="../app/public/icons/brand-wordpress.svg" width="20" height="20" alt=""> | WordPress | `WORDPRESS` | a link |
| <img src="../app/public/icons/brand-x.svg" width="20" height="20" alt=""> | X | `X` | a link |
| <img src="../app/public/icons/generic-gamepad.svg" width="20" height="20" alt=""> | Xbox | `XBOX` | a link |
| <img src="../app/public/icons/brand-xing.svg" width="20" height="20" alt=""> | Xing | `XING` | a link |
| <img src="../app/public/icons/brand-yelp.svg" width="20" height="20" alt=""> | Yelp | `YELP` | a link |
| <img src="../app/public/icons/brand-youtube.svg" width="20" height="20" alt=""> | YouTube | `YOUTUBE` | a link |
| <img src="../app/public/icons/brand-youtubemusic.svg" width="20" height="20" alt=""> | YouTube Music | `YOUTUBE_MUSIC` | a link |
| <img src="../app/public/icons/brand-zelle.svg" width="20" height="20" alt=""> | Zelle | `ZELLE` | a link |
| <img src="../app/public/icons/brand-zoom.svg" width="20" height="20" alt=""> | Zoom | `ZOOM` | a link |

Generated by `scripts/build_platform_docs.mjs` from [app/platforms.mjs](../app/platforms.mjs). Icon sources
and licences: [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md). Platform names and logos are trademarks
of their owners.

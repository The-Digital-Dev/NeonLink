/* optional analytics. Loads only the providers configured in Compose and records a
   "<name>-button" event per link click, matching littlelink-server. Failures never block navigation. */
(() => {
  let cfg = {};
  try { cfg = JSON.parse(document.getElementById('analytics-config')?.textContent || '{}'); } catch (_) { return; }
  const add = (src, attrs = {}) => { const s = document.createElement('script'); s.async = true; s.src = src; for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v); document.head.appendChild(s); };
  if (cfg.ga) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', cfg.ga);
    add('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga));
  }
  if (cfg.umami) add(cfg.umami.src, { 'data-website-id': cfg.umami.id });
  if (cfg.matomo) {
    const _paq = window._paq = window._paq || [];
    _paq.push(['trackPageView'], ['enableLinkTracking'], ['setTrackerUrl', cfg.matomo.url + 'matomo.php'], ['setSiteId', cfg.matomo.site]);
    add(cfg.matomo.url + 'matomo.js');
  }
  if (cfg.plausible) add(cfg.plausible.src, Object.assign({ 'data-domain': cfg.plausible.domain }, cfg.plausible.api ? { 'data-api': cfg.plausible.api } : {}));
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[data-event]'); if (!a) return;
    const name = a.dataset.event;
    try { if (cfg.ga && window.gtag) window.gtag('event', name); } catch (_) {}
    try { if (cfg.umami && window.umami) window.umami.track(name); } catch (_) {}
    try { if (cfg.matomo && window._paq) window._paq.push(['trackEvent', 'Link', 'Click', name]); } catch (_) {}
    try { if (cfg.plausible && window.plausible) window.plausible(name); } catch (_) {}
  }, { capture: true });
})();

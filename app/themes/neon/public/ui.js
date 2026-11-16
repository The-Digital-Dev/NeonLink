/* Neon. Boot sequence, entrance order, share and clock. No dependencies.
   All wording comes from the server (environment variables); nothing personal is written here. */
(() => {
  const $ = id => document.getElementById(id);
  const body = document.body, boot = $('boot');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // BOOT_MODE (data-boot): full, short (about twice as fast) or once (full on the first visit in a browser session).
  const mode = document.body.dataset.boot || 'full', pace = mode === 'short' ? 0.45 : 1;
  let seen = false;
  if (mode === 'once') { try { seen = sessionStorage.getItem('neonlink-boot-seen') === '1'; sessionStorage.setItem('neonlink-boot-seen', '1'); } catch (_) {} }

  // Keep the glitch layers in sync with the rendered name.
  const h1 = document.querySelector('h1'); if (h1) h1.dataset.text = h1.textContent.trim();
  // Entrance order follows what you see top to bottom, whatever links the server rendered.
  const box = el => el.getBoundingClientRect();
  [...document.querySelectorAll('.seq, .channel')].sort((a, b) => box(a).top - box(b).top || box(a).left - box(b).left).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 26)));

  /* ---- boot sequence: sigil, typed log, block meter, access granted, glitch wipe ---- */
  // A Linux-style startup log. It is theatre: the lines are configured text, not real loading.
  let data = { lines: [], prompt: '', command: '' };
  try { data = JSON.parse($('boot-data')?.textContent || '{}'); } catch (_) {}
  const line = l => {
    const d = document.createElement('div');
    if (l.ok) { const b = document.createElement('b'); b.textContent = '[  OK  ]'; d.append(b, ' '); }
    if (l.prompt) { const i = document.createElement('i'); i.textContent = l.prompt; d.append(i, ' '); }
    d.append(l.text);
    return d;
  };
  const lines = [...(data.lines || [])];
  if (data.prompt || data.command) lines.push({ prompt: data.prompt, text: data.command || '' });
  const steps = lines.map((t, i) => [Math.round(i * 96 / Math.max(1, lines.length - 1)), t]);
  const N = 22; let run = 0, done = true, settle;
  function settleNow() { body.classList.add('ready'); settle = setTimeout(() => body.classList.add('settled'), 2600); }
  function reveal() {
    if (done) return; done = true;
    boot.classList.add('granted');
    setTimeout(settleNow, 420 * pace);
  }
  function start() {
    const id = ++run; done = false; clearTimeout(settle);
    body.classList.remove('ready', 'settled'); boot.classList.remove('granted');
    $('log').textContent = ''; $('meter').innerHTML = '<i></i>'.repeat(N);
    let p = 0, s = 0;
    (function tick() {
      if (done || id !== run) return;
      p = Math.min(100, p + .9 + Math.random() * 2.4);
      while (s < steps.length && p >= steps[s][0]) { $('log').appendChild(line(steps[s][1])); s += 1; }
      const on = Math.round(p / 100 * N); [...$('meter').children].forEach((b, i) => b.classList.toggle('on', i < on));
      $('pct').textContent = String(Math.floor(p)).padStart(2, '0') + '%';
      if (p < 100) setTimeout(tick, (55 + Math.random() * 60) * pace); else setTimeout(reveal, 260 * pace);
    })();
  }
  if (reduce) body.classList.add('ready', 'settled');
  else if (!boot || seen) { boot?.remove(); settleNow(); }
  else {
    boot.addEventListener('click', reveal);
    start();
  }

  /* ---- clock (only when CLOCK_TIMEZONE is set) ---- */
  const clock = $('clock');
  if (clock) {
    try {
      const tf = new Intl.DateTimeFormat('en-GB', { timeZone: clock.dataset.zone, hour: '2-digit', minute: '2-digit' });
      const label = clock.dataset.label ? clock.dataset.label + ' ' : '';
      const tick = () => { clock.textContent = label + tf.format(new Date()); }; tick(); setInterval(tick, 15000);
    } catch (_) { clock.remove(); }
  }

  /* ---- share (only when SHARE is set) ---- */
  const toast = $('toast'), share = $('share'); let timer;
  share?.addEventListener('click', async () => {
    const url = share.dataset.url || location.href, title = share.dataset.title || document.title, text = share.dataset.text || '';
    try { if (navigator.share) await navigator.share({ title, text, url }); else { await navigator.clipboard.writeText(url); toast.textContent = 'Link copied.'; } }
    catch (e) { if (e.name !== 'AbortError') toast.textContent = url; }
    clearTimeout(timer); timer = setTimeout(() => { toast.textContent = ''; }, 4000);
  });
})();

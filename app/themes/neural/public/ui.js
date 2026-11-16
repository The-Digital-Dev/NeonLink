/* Neural. Question, thinking stages, streamed answer, then links. All text comes from the server. */
(() => {
  const $ = id => document.getElementById(id);
  const body = document.body, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // BOOT_MODE (data-boot): full, short (about twice as fast) or once (full on the first visit in a browser session).
  const mode = document.body.dataset.boot || 'full', pace = mode === 'short' ? 0.45 : 1;
  let seen = false;
  if (mode === 'once') { try { seen = sessionStorage.getItem('neonlink-boot-seen') === '1'; sessionStorage.setItem('neonlink-boot-seen', '1'); } catch (_) {} }
  let data = { question: '', stages: [] };
  try { data = JSON.parse($('boot-data')?.textContent || '{}'); } catch (_) {}

  // Cursor-following highlight on link cards.
  document.querySelectorAll('.btn').forEach(b => b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

  // The bio is already in the page (it works without scripts); here it is re-typed word by word.
  const bio = $('bio');
  const bold = bio?.dataset.bold || '', rest = bio?.dataset.rest || '';
  const words = [...bold.split(' ').filter(Boolean).map(w => [w, true]), ...rest.split(' ').filter(Boolean).map(w => [w, false])];
  function render(n, caret) {
    if (!bio) return;
    bio.textContent = '';
    const b = document.createElement('b'), parts = words.slice(0, n);
    b.textContent = parts.filter(p => p[1]).map(p => p[0]).join(' ');
    if (b.textContent) bio.append(b);
    const tail = parts.filter(p => !p[1]).map(p => p[0]).join(' ');
    if (tail) bio.append((b.textContent ? ' ' : '') + tail);
    if (caret) { const c = document.createElement('span'); c.className = 'caret'; bio.append(c); }
  }
  function finish() { if (bio) render(words.length, false); body.classList.add('ready', 'done'); }
  function stream() {
    if (!bio || !words.length) { body.classList.add('done'); return; }
    let i = 0;
    (function next() { i += 1; render(i, i < words.length); if (i < words.length) setTimeout(next, 45 + Math.random() * 50); else body.classList.add('done'); })();
  }
  let started = false;
  function reveal() { if (started) return; started = true; body.classList.add('ready'); setTimeout(stream, 450); }

  const loader = $('loader');
  if (reduce || !loader) finish();
  else if (seen) { loader.remove(); reveal(); }
  else {
    const q = data.question || '', stages = data.stages || []; let i = 0;
    (function type() {
      if (started) return;
      $('q').textContent = q.slice(0, ++i);
      if (i < q.length) return setTimeout(type, 42 * pace);
      $('think').classList.add('on');
      stages.forEach((s, k) => setTimeout(() => { if (!started) $('tk').textContent = s; }, k * 600 * pace));
      setTimeout(reveal, Math.max(1, stages.length) * 600 * pace);
    })();
    loader.addEventListener('click', reveal);
  }
})();

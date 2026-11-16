/* Opening Bell. Chart draws, ring fills, bell rings, curtain lifts, then the brief types. Text comes from the server. */
(() => {
  const $ = id => document.getElementById(id);
  const body = document.body, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // BOOT_MODE (data-boot): full, short (about twice as fast) or once (full on the first visit in a browser session).
  const mode = document.body.dataset.boot || 'full', pace = mode === 'short' ? 0.45 : 1;
  let seen = false;
  if (mode === 'once') { try { seen = sessionStorage.getItem('neonlink-boot-seen') === '1'; sessionStorage.setItem('neonlink-boot-seen', '1'); } catch (_) {} }
  let data = { stages: [], granted: '' };
  try { data = JSON.parse($('boot-data')?.textContent || '{}'); } catch (_) {}
  // The brief is already in the page; with motion allowed it is re-typed after the bell.
  const th = $('thesis'), text = th?.dataset.text || '';
  function type() {
    if (!th || reduce) return;
    let i = 0;
    (function n() { i += 1; th.textContent = text.slice(0, i); if (i < text.length) { const c = document.createElement('span'); c.className = 'caret'; th.append(c); setTimeout(n, 16 + Math.random() * 22); } })();
  }
  let done = false;
  function reveal() { if (done) return; done = true; body.classList.add('ready'); setTimeout(type, 900); }
  const bell = $('bell');
  if (reduce || !bell) { done = true; body.classList.add('ready'); }
  else if (seen) { bell.remove(); reveal(); }
  else {
    const mark = $('mark'), st = $('st'), t0 = performance.now(), dur = 1900 * pace;
    const stages = (data.stages || []).map((s, k, all) => [k / Math.max(1, all.length), s]);
    (function run(now) {
      if (done) return;
      const p = Math.min(1, (now - t0) / dur); mark.style.setProperty('--p', (p * 100).toFixed(1));
      let s = stages[0]?.[1] || ''; for (const x of stages) if (p >= x[0]) s = x[1]; st.textContent = s;
      if (p < 1) requestAnimationFrame(run);
      else { st.textContent = ''; if (data.granted) { const b = document.createElement('b'); b.textContent = data.granted; st.append(b); } bell.classList.add('rung'); setTimeout(reveal, 620 * pace); }
    })(t0);
    bell.addEventListener('click', reveal);
  }
})();

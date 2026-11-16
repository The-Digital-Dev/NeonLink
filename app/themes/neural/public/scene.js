/* Neural. Background: a drifting network with signals along its edges and faint floating words.
   Pauses when the tab is hidden; draws one still frame for reduced motion. */
(() => {
  const cv = document.getElementById('net'); if (!cv || !cv.getContext) return;
  const cx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vocab = [];
  try { vocab = JSON.parse(document.getElementById('scene-data')?.textContent || '{}').words || []; } catch (_) {}
  let W, H, dpr, nodes = [], pulses = [], words = [], mx = -999, my = -999, raf = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, Math.max(26, W * H / 16000)));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: 1 + Math.random() * 1.6 }));
    words = vocab.length ? Array.from({ length: W < 700 ? 5 : 9 }, (_, i) => ({ t: vocab[i % vocab.length], x: Math.random() * W, y: Math.random() * H, v: .12 + Math.random() * .2, a: .05 + Math.random() * .08 })) : [];
    if (reduce) frame(false);
  }
  function frame(move) {
    cx.clearRect(0, 0, W, H);
    const R = W < 700 ? 110 : 150;
    if (move) for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      const dx = n.x - mx, dy = n.y - my, d = Math.hypot(dx, dy); if (d < 140 && d > 0) { n.x += dx / d * .6; n.y += dy / d * .6; } }
    cx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < R) { cx.strokeStyle = 'rgba(143,168,255,' + (1 - d / R) * .22 + ')'; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
        if (move && Math.random() < .0006 && pulses.length < 40) pulses.push({ a, b, t: 0 }); }
    }
    for (const n of nodes) { cx.fillStyle = 'rgba(200,214,255,.55)'; cx.beginPath(); cx.arc(n.x, n.y, n.r, 0, 6.3); cx.fill(); }
    if (move) pulses = pulses.filter(p => (p.t += .02) < 1);
    for (const p of pulses) { const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t; cx.fillStyle = '#7CF5C4'; cx.shadowColor = '#7CF5C4'; cx.shadowBlur = 10; cx.beginPath(); cx.arc(x, y, 2.2, 0, 6.3); cx.fill(); cx.shadowBlur = 0; }
    cx.font = '500 13px "JetBrains Mono", monospace';
    for (const w of words) { if (move) { w.y -= w.v; if (w.y < -20) { w.y = H + 20; w.x = Math.random() * W; } } cx.fillStyle = 'rgba(238,241,248,' + w.a + ')'; cx.fillText(w.t, w.x, w.y); }
  }
  function loop() { frame(true); raf = requestAnimationFrame(loop); }
  function play() { if (reduce || document.hidden || raf) return; raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  addEventListener('resize', size); addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });
  size(); if (reduce) frame(false); else play();
})();

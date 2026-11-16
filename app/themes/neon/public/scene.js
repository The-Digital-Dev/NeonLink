/* Neon. Background scene on a 2D canvas: night city, rain, light trails and a scrolling grid.
   Pauses when the tab is hidden, and draws a single still frame for reduced motion. */
(() => {
  const cv = document.getElementById('city'); if (!cv || !cv.getContext) return;
  const cx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const neon = ['#00F0FF', '#FF2A9D', '#F7F01C', '#8A5CFF'];
  let W, H, dpr, hy, far = [], near = [], rain = [], cars = [], raf = 0, paused = false, clock = 0, last = 0;

  function row(minH, maxH, minW, maxW) {
    const out = []; let x = -20;
    while (x < W + 20) {
      const w = minW + Math.random() * (maxW - minW), h = minH + Math.random() * (maxH - minH), win = [];
      for (let wy = 8; wy < h - 6; wy += 9) for (let wx = 5; wx < w - 6; wx += 8) if (Math.random() < .22) win.push({ x: wx, y: wy, c: neon[Math.random() * 4 | 0], p: Math.random() * 6.3, s: .4 + Math.random() * 1.6 });
      out.push({ x, w, h, win, sign: Math.random() < .3 ? neon[Math.random() * 3 | 0] : null }); x += w + 2 + Math.random() * 8;
    }
    return out;
  }
  function car() { const d = Math.random() < .5 ? 1 : -1; return { x: d > 0 ? -60 - Math.random() * W : W + 60 + Math.random() * W, y: H * (.12 + Math.random() * .3), v: d * (1.2 + Math.random() * 1.8), c: neon[Math.random() * 3 | 0] }; }
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hy = H * .6; const k = Math.min(1, W / 900) * .5 + .5;
    far = row(H * .1, H * .3 * k + 40, 26, 64); near = row(H * .05, H * .17 * k + 20, 34, 90);
    rain = Array.from({ length: Math.round(W / 9) }, () => ({ x: Math.random() * (W + 200), y: Math.random() * H, l: 8 + Math.random() * 16, v: 9 + Math.random() * 9 }));
    cars = Array.from({ length: W < 700 ? 2 : 4 }, car);
    if (reduce || paused) frame(false);
  }
  function city(b, fill, a, t) {
    for (const B of b) {
      cx.fillStyle = fill; cx.fillRect(B.x, hy - B.h, B.w, B.h + 2);
      for (const w of B.win) { cx.globalAlpha = a * (.35 + .65 * Math.abs(Math.sin(t * w.s + w.p))); cx.fillStyle = w.c; cx.fillRect(B.x + w.x, hy - B.h + w.y, 3, 4); }
      cx.globalAlpha = 1;
      if (B.sign) { cx.fillStyle = B.sign; cx.globalAlpha = a * (Math.sin(t * 3 + B.x) > -.85 ? .9 : .15); cx.fillRect(B.x + 3, hy - B.h - 3, B.w - 6, 2); cx.globalAlpha = 1; }
    }
  }
  function frame(move) {
    const t = clock; cx.clearRect(0, 0, W, H);
    let g = cx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#07060D'); g.addColorStop(.7, '#160A2A'); g.addColorStop(1, '#3A0E4A'); cx.fillStyle = g; cx.fillRect(0, 0, W, hy);
    g = cx.createRadialGradient(W / 2, hy, 0, W / 2, hy, Math.max(W, H) * .55); g.addColorStop(0, 'rgba(255,42,157,.35)'); g.addColorStop(1, 'rgba(255,42,157,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, hy);
    for (const c of cars) {
      if (move) { c.x += c.v; if (c.x < -200 || c.x > W + 200) Object.assign(c, car()); }
      const tr = cx.createLinearGradient(c.x, 0, c.x - c.v * 30, 0); tr.addColorStop(0, c.c); tr.addColorStop(1, 'rgba(0,0,0,0)');
      cx.strokeStyle = tr; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(c.x, c.y); cx.lineTo(c.x - c.v * 30, c.y); cx.stroke();
    }
    city(far, '#120C24', .55, t); city(near, '#07060D', 1, t);
    // floor
    cx.fillStyle = '#07060D'; cx.fillRect(0, hy, W, H - hy);
    g = cx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgba(255,42,157,.28)'); g.addColorStop(.5, 'rgba(138,92,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(0, hy, W, H - hy);
    cx.lineWidth = 1; cx.strokeStyle = 'rgba(0,240,255,.34)'; cx.beginPath();
    const fh = H - hy, n = 14, off = (t * .22) % 1;
    for (let i = 0; i < n; i++) { const z = (i + off) / n, y = hy + fh * z * z; cx.moveTo(0, y); cx.lineTo(W, y); }
    const cols = 18, spread = W * 2.2;
    for (let i = -cols; i <= cols; i++) { cx.moveTo(W / 2 + i * 6, hy); cx.lineTo(W / 2 + i * spread / cols, H); }
    cx.stroke();
    cx.strokeStyle = 'rgba(255,42,157,.9)'; cx.beginPath(); cx.moveTo(0, hy + .5); cx.lineTo(W, hy + .5); cx.stroke();
    // rain
    cx.strokeStyle = 'rgba(150,220,255,.22)'; cx.beginPath();
    for (const r of rain) {
      if (move) { r.y += r.v; r.x -= r.v * .22; if (r.y > H) { r.y = -20; r.x = Math.random() * (W + 200); } }
      cx.moveTo(r.x, r.y); cx.lineTo(r.x + r.l * .22, r.y - r.l);
    }
    cx.stroke();
    // occasional glitch bar
    if (move && Math.random() < .012) { cx.fillStyle = Math.random() < .5 ? 'rgba(0,240,255,.10)' : 'rgba(255,42,157,.10)'; cx.fillRect(0, Math.random() * H, W, 2 + Math.random() * 14); }
  }
  function loop(now) {
    clock += Math.min(.05, (now - last) / 1000); last = now;
    frame(true); raf = requestAnimationFrame(loop);
  }
  function play() { if (reduce || paused || document.hidden || raf) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  size(); addEventListener('resize', size);
  if (reduce) frame(false); else play();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });
})();

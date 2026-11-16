/* Opening Bell. Background: a slowly scrolling chart whose points are also neural nodes, a dashed second
   series and volume bars. Decoration only. Pauses when hidden; one still frame for reduced motion. */
(() => {
  const cv = document.getElementById('mkt'); if (!cv || !cv.getContext) return;
  const cx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, dpr, step, pts = [], back = [], bars = [], shift = 0, pings = [], raf = 0;
  const walk = (prev, lo, hi, vol, drift) => Math.max(lo, Math.min(hi, prev + (Math.random() - .5 + drift) * vol));
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = W < 700 ? 34 : 52; const n = Math.ceil(W / step) + 3;
    pts = [.62]; back = [.75]; bars = [];
    for (let i = 1; i < n; i++) { pts.push(walk(pts[i - 1], .2, .8, .12, -.04)); back.push(walk(back[i - 1], .45, .9, .08, -.02)); }
    for (let i = 0; i < n; i++) bars.push(.15 + Math.random() * .85);
    if (reduce) draw(false);
  }
  function path(arr, top, h) { cx.beginPath(); arr.forEach((v, i) => { const x = i * step - shift, y = top + v * h; i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); }
  function draw(move) {
    cx.clearRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(233,223,196,.05)'; cx.lineWidth = 1; cx.beginPath();
    for (let y = H * .1; y < H; y += H * .16) { cx.moveTo(0, y); cx.lineTo(W, y); }
    for (let x = -shift % (step * 2); x < W; x += step * 2) { cx.moveTo(x, 0); cx.lineTo(x, H); }
    cx.stroke();
    for (let i = 0; i < bars.length; i++) { const h = bars[i] * H * .09; cx.fillStyle = 'rgba(224,185,91,' + (.08 + bars[i] * .1) + ')'; cx.fillRect(i * step - shift - step * .3, H - h, step * .6, h); }
    const top = H * .12, h = H * .7;
    path(back, top, h); cx.strokeStyle = 'rgba(224,185,91,.22)'; cx.lineWidth = 1.2; cx.setLineDash([4, 6]); cx.stroke(); cx.setLineDash([]);
    path(pts, top, h); cx.lineTo((pts.length - 1) * step - shift, H); cx.lineTo(-shift, H); cx.closePath();
    const g = cx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(98,230,164,.16)'); g.addColorStop(1, 'rgba(98,230,164,0)'); cx.fillStyle = g; cx.fill();
    path(pts, top, h); cx.strokeStyle = 'rgba(98,230,164,.55)'; cx.lineWidth = 1.6; cx.stroke();
    cx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) { const x = i * step - shift, y = top + pts[i] * h;
      if (i % 2 === 0 && back[i + 1] !== undefined) { cx.strokeStyle = 'rgba(159,180,255,.13)'; cx.beginPath(); cx.moveTo(x, y); cx.lineTo((i + 1) * step - shift, top + back[i + 1] * h); cx.stroke(); }
      cx.fillStyle = 'rgba(159,180,255,.75)'; cx.beginPath(); cx.arc(x, y, 2.2, 0, 6.3); cx.fill(); }
    if (!move) return;
    if (Math.random() < .02 && pings.length < 4) pings.push({ i: 0, t: 0 });
    pings = pings.filter(p => p.i < pts.length - 1);
    for (const p of pings) { p.t += .06; if (p.t >= 1) { p.t = 0; p.i += 1; } if (p.i >= pts.length - 1) continue;
      const x = (p.i + p.t) * step - shift, y = top + (pts[p.i] + (pts[p.i + 1] - pts[p.i]) * p.t) * h;
      cx.fillStyle = '#F3EEDD'; cx.shadowColor = '#62E6A4'; cx.shadowBlur = 12; cx.beginPath(); cx.arc(x, y, 2.6, 0, 6.3); cx.fill(); cx.shadowBlur = 0; }
    shift += .35;
    if (shift >= step) { shift -= step; pts.shift(); back.shift(); bars.shift(); pings.forEach(p => p.i -= 1); pings = pings.filter(p => p.i >= 0);
      pts.push(walk(pts[pts.length - 1], .2, .8, .12, -.04)); back.push(walk(back[back.length - 1], .45, .9, .08, -.02)); bars.push(.15 + Math.random() * .85); }
  }
  function loop() { draw(true); raf = requestAnimationFrame(loop); }
  function play() { if (reduce || document.hidden || raf) return; raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else play(); });
  size(); if (reduce) draw(false); else play();
})();

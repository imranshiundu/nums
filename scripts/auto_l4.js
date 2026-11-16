// Auto-play for Level 4: tap SPLIT when the 4s reach the golden line.
(function () {
  const g = window.__ntGame;
  if (g.timerL4) clearInterval(g.timerL4);
  g.timerL4 = setInterval(function () {
    if (g.state !== 'play' || g.level !== 4) { clearInterval(g.timerL4); return; }
    if (g.l4.done || g.l4.failed || g.l4.splitT >= 0) { clearInterval(g.timerL4); return; }
    const lead = Math.min(g.l4.x1, g.l4.x2);
    if (lead > 230 && lead < 380) {
      g.onTap(288, 900);
    }
  }, 80);
  return 'auto-l4 started';
})();

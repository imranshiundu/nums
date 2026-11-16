// Auto-play for Level 3: tap SPLIT once the 8 is safely on the bridge.
(function () {
  const g = window.__ntGame;
  if (g.timerL3) clearInterval(g.timerL3);
  g.timerL3 = setInterval(function () {
    if (g.state !== 'play' || g.level !== 3) { clearInterval(g.timerL3); return; }
    if (g.l3.done || g.l3.splitT >= 0) { clearInterval(g.timerL3); return; }
    if (g.l3.b8x >= g.l3.bridgeStart + 80) {
      g.onTap(288, 900);
    }
  }, 100);
  return 'auto-l3 started';
})();

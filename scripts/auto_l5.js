// Auto-play for Level 5: split, then hop only while the guard eye is closed.
(function () {
  const g = window.__ntGame;
  if (g.timerL5) clearInterval(g.timerL5);
  g.timerL5 = setInterval(function () {
    if (g.state !== 'play' || g.level !== 5) { clearInterval(g.timerL5); return; }
    if (g.l5.done) { clearInterval(g.timerL5); return; }
    if (g.l5.phase === 'pre') { g.onTap(288, 900); return; }
    if (g.l5.eyeOpen < 0.3 && g.l5.hopT < 0) {
      g.onTap(288, 900);
    }
  }, 160);
  return 'auto-l5 started';
})();

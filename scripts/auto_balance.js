// Auto-play verifier: runs in browser via agent-browser eval.
// Simulates a player tapping the high side of the beam every 250ms.
(function () {
  const g = window.__ntGame;
  if (g.timerBalance) clearInterval(g.timerBalance);
  g.timerBalance = setInterval(function () {
    if (g.state !== 'play' || g.level !== 1) { clearInterval(g.timerBalance); return; }
    if (g.l1.merged) { clearInterval(g.timerBalance); return; }
    const a = g.l1.angle;
    // tap the HIGH side: angle>0 means right side is DOWN, left is UP
    const x = a > 0.02 ? 150 : a < -0.02 ? 430 : Math.random() > 0.5 ? 150 : 430;
    g.onTap(x, 800);
  }, 250);
  return 'auto-balance started';
})();

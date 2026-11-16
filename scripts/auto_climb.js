// Auto-play for Level 2: move the pink 8 to the lane of the nearest falling apple.
(function () {
  const g = window.__ntGame;
  if (g.timerClimb) clearInterval(g.timerClimb);
  g.timerClimb = setInterval(function () {
    if (g.state !== 'play' || g.level !== 2) { clearInterval(g.timerClimb); return; }
    if (g.l2.done) { clearInterval(g.timerClimb); return; }
    // find nearest live apple above the catch zone
    let best = null, bestD = 1e9;
    for (const a of g.l2.apples) {
      if (a.caught || a.dead) continue;
      const dy = (g.l2.y - 110) - a.y;
      const dx = a.x - g.l2.laneX;
      const d = dx * dx * 2 + dy * dy;
      if (dy > -60 && d < bestD) { bestD = d; best = a; }
    }
    if (best) {
      const tapX = best.x < 192 ? 100 : best.x < 384 ? 288 : 470;
      g.onTap(tapX, 800);
    }
  }, 180);
  return 'auto-climb started';
})();

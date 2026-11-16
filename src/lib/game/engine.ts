// ============================================================
// NUMS - Numbers Adventure (Game Engine)
// 6 levels mirroring the source video:
//  1. THE BALANCE        - two green 4s balance a golden seesaw -> merge 4+4=8
//  2. APPLE CLIMB        - pink 8 climbs & catches 8 golden apples (voice counts)
//  3. GIANT ROAMING      - boulder chase, tap SPLIT: 8 = 4 + 4
//  4. SPLIT IN HALF      - low tunnel: tap SPLIT: 4 = 2 + 2
//  5. THE EXIT           - sneak past the giant eye: 2 = 1 + 1
//  6. ESCAPE             - tropical paradise, merge-up celebration 1..8
// Design space: 576 x 1024
// ============================================================

import {
  PAL, Ctx,
  roundRect,
  drawGreen4, drawPink8, drawOrange2, drawRed1,
  drawCaveBackground, drawSpotlight, drawGoldenDoor, drawPlanks,
  drawBallPit, drawSeesaw, drawBoulder, drawBridge, drawTunnelArch,
  drawGuardEye, drawExitDoor, drawBadge,
  drawStarburst, drawEquation, drawChipEquation,
  drawSplitButton, drawApple,
  Particle, updateParticles, drawParticles, spawnSparkles,
} from './sprites';
import {
  initAudio, pickVoice, say, sayNumber, setMuted, isMuted,
  sfxPop, sfxBoing, sfxTap, sfxWhoosh, sfxSparkle, sfxBoom,
  sfxAlarm, sfxBonk, sfxSneak, sfxFanfare, sfxChime,
  startRumble, stopRumble, startMusic, stopMusic,
} from './audio';
import { setEquationFont } from './sprites';

export const W = 576;
export const H = 1024;

type GameState = 'title' | 'intro' | 'play' | 'reveal' | 'retry' | 'win';

interface LevelInfo {
  n: number;
  title: string;
  equation: string;
  instruction: string;
}

const LEVELS: LevelInfo[] = [
  { n: 1, title: 'THE BALANCE', equation: '4 + 4', instruction: '' },
  { n: 2, title: 'GOLDEN APPLE CLIMB', equation: '8', instruction: '' },
  { n: 3, title: 'GIANT ROAMING ALERT', equation: '8 = 4 + 4', instruction: '' },
  { n: 4, title: 'SPLIT IN HALF', equation: '4 = 2 + 2', instruction: '' },
  { n: 5, title: 'THE EXIT', equation: '2 = 1 + 1', instruction: '' },
  { n: 6, title: 'WE ESCAPED!', equation: '', instruction: '' },
];

interface Apple { x: number; y: number; vy: number; caught: boolean; dead: boolean; t: number }

export class Game {
  private c: Ctx;
  private canvas: HTMLCanvasElement;
  private raf = 0;
  private lastT = 0;
  private globalT = 0;
  state: GameState = 'title';
  private stateT = 0;
  private level = 1;
  private particles: Particle[] = [];
  private shake = 0;
  private timeScale = 1;
  private mutedFlag = false;

  // ---- level 1 ----
  private l1 = {
    angle: 0, angVel: 0, count: 0,
    bounceL: 0, bounceR: 0,
    windT: 0, merged: false, mergeT: 0,
    done: false,
  };

  // ---- level 2 ----
  private l2 = {
    y: 760, laneX: 288, targetX: 288,
    apples: [] as Apple[], caught: 0, spawnT: 0.6,
    done: false, doneT: 0, climbBob: 0,
  };

  // ---- level 3 ----
  private l3 = {
    b8x: 0, boulderX: -420, alertT: 0,
    splitT: -1, fours: 0, boulderFall: 0, crashed: false,
    done: false, bridgeStart: 820, bridgeEnd: 1340,
    walkT: 0,
  };

  // ---- level 4 ----
  private l4 = {
    x1: 70, x2: 140, splitT: -1, twos: 0,
    tunnelX: 468, done: false, failed: false, bonkT: -1,
    warnT: 0,
  };

  // ---- level 5 ----
  private l5 = {
    phase: 'pre' as 'pre' | 'sneak' | 'open',
    progress: 150, lastSafe: 0,
    eyeCycle: 0, eyeOpen: 0, // eyeOpen 0..1
    caughtFlash: 0,
    hopT: -1, done: false, doorT: 0, warnSound: false,
  };

  // ---- level 6 ----
  private l6 = { stage: 0, t: 0, confettiT: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('no 2d context');
    this.c = c;
    // use the self-hosted Nunito (next/font) for equations, once available
    try {
      const fam = getComputedStyle(document.body).getPropertyValue('--font-nunito').trim();
      setEquationFont(fam);
    } catch { /* keep fallback */ }
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    // debug/testing handle (also lets power users inspect state)
    (window as unknown as { __numsGame?: Game }).__numsGame = this;
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    stopRumble();
    stopMusic();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  }

  // ---------- input ----------
  onTap(x: number, y: number): void {
    initAudio();
    pickVoice();
    // mute button hit test (top-right circle)
    const mx = 522, my = 46, mr = 30;
    if ((x - mx) ** 2 + (y - my) ** 2 <= mr * mr) {
      this.mutedFlag = !isMuted();
      setMuted(this.mutedFlag);
      if (!this.mutedFlag) sfxTap();
      return;
    }
    switch (this.state) {
      case 'title':
        startMusic();
        this.enterIntro(1);
        break;
      case 'intro':
        this.startLevel(this.level);
        break;
      case 'reveal':
        break; // auto-advances
      case 'retry':
        break; // auto-advances
      case 'win':
        this.backToTitle();
        break;
      case 'play':
        this.tapPlay(x, y);
        break;
    }
  }

  private tapPlay(x: number, y: number): void {
    if (this.level === 1) this.tapL1(x);
    else if (this.level === 2) this.tapL2(x);
    else if (this.level === 3) this.tapL3();
    else if (this.level === 4) this.tapL4();
    else if (this.level === 5) this.tapL5();
    else if (this.level === 6) this.tapL6();
  }

  // ---------- state transitions ----------
  private enterIntro(n: number): void {
    stopRumble();
    this.level = n;
    if (n === 6) {
      this.startLevel(6);
      return;
    }
    this.state = 'intro';
    this.stateT = 0;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  private startLevel(n: number): void {
    this.state = 'play';
    this.stateT = 0;
    this.particles = [];
    this.shake = 0;
    this.timeScale = 1;
    if (n === 1) {
      this.l1 = { angle: 0.15, angVel: 0, count: 0, bounceL: 0, bounceR: 0, windT: 0, merged: false, mergeT: 0, done: false };
    } else if (n === 2) {
      this.l2 = { y: 760, laneX: 288, targetX: 288, apples: [], caught: 0, spawnT: 0.5, done: false, doneT: 0, climbBob: 0 };
    } else if (n === 3) {
      this.l3 = { b8x: 0, boulderX: -160, alertT: 0, splitT: -1, fours: 0, boulderFall: 0, crashed: false, done: false, bridgeStart: 820, bridgeEnd: 1340, walkT: 0 };
    } else if (n === 4) {
      this.l4 = { x1: 70, x2: 150, splitT: -1, twos: 0, tunnelX: 468, done: false, failed: false, bonkT: -1, warnT: 0 };
    } else if (n === 5) {
      this.l5 = { phase: 'pre', progress: 150, lastSafe: 0, eyeCycle: 0, eyeOpen: 0, caughtFlash: 0, hopT: -1, done: false, doorT: 0, warnSound: false };
    } else if (n === 6) {
      this.l6 = { stage: 0, t: 0, confettiT: 0 };
      stopMusic();
      sfxFanfare();
    }
  }

  private enterReveal(parts: string[], next: () => void): void {
    // stored transition is executed on reveal end
    this.pendingNext = next;
    this.revealParts = parts;
    this.state = 'reveal';
    this.stateT = 0;
    sfxSparkle();
    spawnSparkles(this.particles, W / 2, H / 2 - 120, 40, PAL.goldLight);
  }
  private pendingNext: (() => void) | null = null;
  private revealParts: string[] = [];

  private enterRetry(msg = 'OOPS! TRY AGAIN!'): void {
    stopRumble();
    this.state = 'retry';
    this.stateT = 0;
    this.retryMsg = msg;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    say('Whoa!', { rate: 1.15, pitch: 0.9 });
  }
  private retryMsg = 'OOPS! TRY AGAIN!';

  private backToTitle(): void {
    this.state = 'title';
    this.stateT = 0;
    this.level = 1;
    startMusic();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  // ============================================================
  // LEVEL 1 - THE BALANCE
  // ============================================================
  private tapL1(x: number): void {
    const l = this.l1;
    if (l.merged || l.done) return;
    const side = x < W / 2 ? -1 : 1; // -1 left, 1 right
    // NOTE: positive angle = clockwise = RIGHT side down, LEFT side up
    const highSide = l.angle > 0.035 ? -1 : l.angle < -0.035 ? 1 : (Math.random() > 0.5 ? -1 : 1);
    const good = side === highSide || Math.abs(l.angle) <= 0.035;
    if (good) {
      l.count++;
      l.angVel += side * 1.9;
      if (side < 0) l.bounceL = 1; else l.bounceR = 1;
      sfxTap(1 + (l.count % 3) * 0.12);
      sfxBoing(side < 0 ? 1.1 : 0.9);
      sayNumber(Math.min(8, l.count));
      spawnSparkles(this.particles, W / 2 + side * 180, 620, 6, PAL.goldLight);
      if (l.count >= 8) {
        l.merged = true;
        l.mergeT = 0;
        say('And double it! Four plus four equals eight!', { rate: 1.05 });
        sfxSparkle();
        spawnSparkles(this.particles, W / 2, 560, 50, PAL.goldLight);
      }
    } else {
      l.angVel += side * 1.9;
      sfxBonk();
      spawnSparkles(this.particles, W / 2 + side * 180, 620, 8, PAL.redLight);
    }
  }

  private updateL1(dt: number): void {
    const l = this.l1;
    l.windT += dt;
    if (l.bounceL > 0) l.bounceL = Math.max(0, l.bounceL - dt * 4);
    if (l.bounceR > 0) l.bounceR = Math.max(0, l.bounceR - dt * 4);
    if (!l.merged) {
      // destabilizing beam physics + gentle wind gusts (tuned to be fair)
      l.angVel += (l.angle * 0.9 + Math.sin(l.windT * 1.7) * 0.22) * dt * 2.0;
      l.angVel *= 0.93;
      l.angle += l.angVel * dt * 0.5;
      if (Math.abs(l.angle) > 0.88) {
        this.enterRetry('THE BLOCKS SLID OFF!');
        return;
      }
    } else {
      l.mergeT += dt;
      if (l.mergeT > 2.4 && !l.done) {
        l.done = true;
        this.enterReveal(['4', '+', '4', '=', '8'], () => {
          this.enterIntro(2);
        });
      }
    }
  }

  private drawL1(): void {
    const c = this.c;
    const l = this.l1;
    drawCaveBackground(c, this.globalT);
    drawSpotlight(c, W / 2, 0, 260, 780, 0.22);
    drawGoldenDoor(c, 288, 640, 96, 150, 0.4 + 0.6 * Math.abs(Math.sin(this.globalT * 0.7)));
    drawBallPit(c, 770, 254, this.globalT);
    // seesaw
    const angle = l.merged ? 0 : l.angle;
    drawSeesaw(c, 288, 640, 216, angle);
    // the two green 4s riding the beam (seated along the beam line)
    const beamY = 640;
    const sa = Math.sin(angle);
    const ca = Math.cos(angle);
    if (!l.merged) {
      const squashL = l.bounceL * 0.5;
      const squashR = l.bounceR * 0.5;
      drawGreen4(c, {
        cx: 288 - 200 * ca, bottomY: beamY - 200 * sa - 9,
        scale: 0.78, look: 0, mouth: Math.abs(l.angle) > 0.4 ? 'worried' : 'smile',
        squash: squashL, tilt: angle, time: this.globalT,
      });
      drawGreen4(c, {
        cx: 288 + 200 * ca, bottomY: beamY + 200 * sa - 9,
        scale: 0.78, look: 0, mouth: Math.abs(l.angle) > 0.4 ? 'worried' : 'smile',
        squash: squashR, tilt: angle, time: this.globalT,
      });
    } else {
      // merge animation: both slide to center, pink 8 rises
      const mt = Math.min(1, l.mergeT / 1.0);
      const gx = 288 - 200 * (1 - mt);
      const gy = beamY - 200 * sa * (1 - mt);
      if (mt < 1) {
        drawGreen4(c, { cx: gx, bottomY: gy, scale: 0.78, look: 0, squash: 0.3, armsUp: true, time: this.globalT, alpha: 1 - mt * 0.7 });
        drawGreen4(c, { cx: 288 + 200 * (1 - mt), bottomY: gy, scale: 0.78, look: 0, squash: 0.3, armsUp: true, time: this.globalT, alpha: 1 - mt * 0.7 });
      }
      if (l.mergeT > 0.9) {
        const rise = Math.min(1, (l.mergeT - 0.9) / 0.7);
        const bob = Math.sin(this.globalT * 3) * 6;
        const bottom = beamY + 20 - rise * 160 + bob * rise;
        drawPink8(c, {
          cx: 288, bottomY: bottom, scale: 0.85 + rise * 0.15,
          look: 0, armsUp: true, apples: 0, mouth: 'smile', time: this.globalT,
        });
        drawBadge(c, 288, bottom - 300, 8, 1.1);
      }
    }
    // equation, exactly like the video: "4 + 4"
    const chips: Array<'4' | '+' | '=' | '8' | '?'> = l.merged ? ['4', '+', '4', '=', '8'] : ['4', '+', '4'];
    drawChipEquation(c, 92, 96, chips);
    // golden hint arrow above the raised block (tap that side!)
    if (!l.merged && Math.abs(l.angle) > 0.04) {
      const hintSide = l.angle > 0.035 ? -1 : 1;
      const hx = 288 + hintSide * 200;
      const hy = 330 + Math.sin(this.globalT * 5) * 10;
      c.save();
      c.fillStyle = PAL.goldLight;
      c.strokeStyle = 'rgba(30,18,6,0.85)';
      c.lineWidth = 4;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(hx - 34, hy);
      c.lineTo(hx + 34, hy);
      c.lineTo(hx, hy + 46);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // LEVEL 2 - APPLE CLIMB
  // ============================================================
  private tapL2(x: number): void {
    const l = this.l2;
    if (l.done) return;
    l.targetX = x < 192 ? 168 : x < 384 ? 288 : 408;
    sfxTap(1.3);
  }

  private updateL2(dt: number): void {
    const l = this.l2;
    l.laneX += (l.targetX - l.laneX) * Math.min(1, dt * 6);
    if (!l.done) {
      l.y -= 42 * dt; // auto climb
      if (l.y < 300) l.y = 300;
      l.climbBob += dt;
      // spawn apples
      l.spawnT -= dt;
      if (l.spawnT <= 0 && l.caught + l.apples.filter((a) => !a.caught && !a.dead).length < 9) {
        const lanes = [168, 288, 408];
        l.apples.push({
          x: lanes[Math.floor(Math.random() * 3)] + (Math.random() * 30 - 15),
          y: -40, vy: 150 + Math.random() * 70, caught: false, dead: false, t: 0,
        });
        l.spawnT = Math.max(0.45, 1.1 - this.globalT * 0.01) + Math.random() * 0.5;
      }
      // move & catch
      for (const a of l.apples) {
        a.t += dt;
        if (a.dead) continue;
        if (a.caught) {
          a.x += (l.laneX - a.x) * dt * 8;
          a.y += (l.y - 150 - a.y) * dt * 8;
          if (a.y < l.y - 145) a.dead = true;
        } else {
          a.y += a.vy * dt;
          const dx = a.x - l.laneX;
          const dy = a.y - (l.y - 110);
          if (dx * dx + dy * dy < 80 * 80) {
            a.caught = true;
            l.caught++;
            sfxPop(1 + l.caught * 0.07);
            sayNumber(l.caught);
            spawnSparkles(this.particles, a.x, a.y, 12, PAL.goldLight);
            if (l.caught === 8) {
              l.done = true;
              l.doneT = 0;
              say('The golden delicious!', { rate: 1.0, pitch: 1.2 }); // show line
              sfxFanfare();
              spawnSparkles(this.particles, l.laneX, l.y - 110, 60, PAL.goldLight);
            }
          } else if (a.y > 900) {
            a.dead = true;
          }
        }
      }
      l.apples = l.apples.filter((a) => !a.dead);
    } else {
      l.doneT += dt;
      if (l.doneT > 2.3) {
        this.enterReveal(['8'], () => this.enterIntro(3));
      }
    }
  }

  private drawL2(): void {
    const c = this.c;
    const l = this.l2;
    drawCaveBackground(c, this.globalT, 'dark');
    drawSpotlight(c, 288, 0, 230, 1024, 0.16);
    // climbing pole (grey steel, like the video)
    const pg = c.createLinearGradient(283, 0, 293, 0);
    pg.addColorStop(0, '#6e6e6e');
    pg.addColorStop(0.5, '#b5b5b5');
    pg.addColorStop(1, '#5a5a5a');
    c.fillStyle = pg;
    c.fillRect(283, 120, 10, 720);
    // platform at bottom
    drawPlanks(c, 128, 800, 320, 26);
    // falling apples
    for (const a of l.apples) {
      if (!a.caught && !a.dead) drawApple(c, a.x, a.y, 22, true, a.t * 3);
    }
    // pink 8 climbing
    const bob = Math.sin(l.climbBob * 6) * 8;
    const mouth: 'smile' | 'grit' = l.done ? 'smile' : 'grit';
    drawPink8(c, {
      cx: l.laneX, bottomY: l.y + bob, scale: 0.72,
      look: (l.targetX - l.laneX) * 0.01, mouth,
      apples: l.done ? 8 : 0, time: this.globalT,
    });
    // badge
    drawBadge(c, l.laneX, l.y + bob - 300, 8, 1);
    // caught apples flying to arms
    for (const a of l.apples) {
      if (a.caught && !a.dead) drawApple(c, a.x, a.y, 18, true, a.t * 4);
    }
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // LEVEL 3 - GIANT ROAMING ALERT
  // ============================================================
  private tapL3(): void {
    const l = this.l3;
    if (l.done || l.splitT >= 0) return;
    const onBridge = l.b8x >= l.bridgeStart + 30 && l.b8x <= l.bridgeEnd - 60;
    if (onBridge) {
      l.splitT = 0;
      stopRumble();
      sfxSparkle();
      sfxWhoosh();
      say('Eight equals four plus four!', { rate: 1.05 });
    } else {
      sfxBonk();
      this.showTooEarlyFlash = 0.8;
    }
  }
  private showTooEarlyFlash = 0;

  private updateL3(dt: number): void {
    const l = this.l3;
    this.showTooEarlyFlash = Math.max(0, this.showTooEarlyFlash - dt);
    if (l.done) {
      l.walkT += dt;
      if (l.walkT > 2.6) {
        this.enterReveal(['8', '=', '4', '+', '4'], () => this.enterIntro(4));
      }
      return;
    }
    if (l.splitT >= 0) {
      // split sequence
      l.splitT += dt;
      if (l.splitT > 0.55 && l.fours === 0) {
        l.fours = 1;
        spawnSparkles(this.particles, 288, 520, 46, PAL.goldLight);
        spawnSparkles(this.particles, 288, 520, 20, PAL.greenLight);
      }
      // boulder keeps rolling & falls into chasm
      l.boulderX += 300 * dt;
      if (!l.crashed && l.boulderX > (l.bridgeStart + l.bridgeEnd) / 2 - 40) {
        l.crashed = true;
        l.boulderFall = 0.001;
        sfxBoom();
        this.shake = 0.7;
        spawnSparkles(this.particles, 288, 700, 30, '#8a6a45');
        say('Phew!', { rate: 1.2, pitch: 1.3 });
      }
      if (l.boulderFall > 0) l.boulderFall += dt;
      if (l.splitT > 1.9 && !l.done) {
        l.done = true;
        l.walkT = 0;
      }
      return;
    }
    // walking phase
    l.b8x += 128 * dt;
    l.walkT += dt;
    const boulderGap = l.b8x - l.boulderX;
    if (l.walkT > 0.8 && l.alertT === 0) {
      l.alertT = 0.001;
      sfxAlarm();
      say('Giant roaming alert!', { rate: 1.0, pitch: 1.0 });
      startRumble();
    }
    if (l.alertT > 0) {
      l.alertT += dt;
      if (l.alertT > 1.2) {
        l.boulderX += 175 * dt;
        if (l.boulderX + 66 >= l.b8x - 60) {
          // caught!
          stopRumble();
          sfxBoom();
          this.shake = 0.9;
          spawnSparkles(this.particles, 288, 560, 30, PAL.redLight);
          this.enterRetry('THE GIANT GOT YOU!');
          return;
        }
      }
    }
    if (l.b8x > l.bridgeEnd - 30) {
      // walked off without splitting - bridge ends, fall
      this.enterRetry('TOO LATE! YOU NEEDED TO SPLIT!');
    }
  }

  private drawL3(): void {
    const c = this.c;
    const l = this.l3;
    const cam = Math.max(0, l.b8x - 160);
    c.save();
    if (this.shake > 0) {
      c.translate((Math.random() - 0.5) * this.shake * 26, (Math.random() - 0.5) * this.shake * 26);
    }
    drawCaveBackground(c, this.globalT, 'dark');
    drawSpotlight(c, 288, 0, 300, 1024, 0.14);
    // ground with chasm
    const groundY = 660;
    const sx = (wx: number): number => wx - cam;
    c.save();
    // left ground
    const leftEnd = sx(l.bridgeStart);
    if (leftEnd > -50) {
      drawPlanks(c, -50, groundY, leftEnd + 50, 40);
    }
    // bridge
    const b0 = sx(l.bridgeStart);
    const b1 = sx(l.bridgeEnd);
    drawBridge(c, b0, groundY, Math.max(0, b1 - b0), 26);
    // right ground
    if (b1 < W + 50) {
      drawPlanks(c, b1, groundY, W + 50 - b1, 40);
    }
    // chasm shadow
    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.fillRect(b0, groundY + 40, Math.max(0, b1 - b0), 300);
    c.restore();
    // boulder
    if (l.alertT > 1.2 || l.splitT >= 0) {
      const bx = sx(l.boulderX);
      const by = l.boulderFall > 0 ? groundY + l.boulderFall * l.boulderFall * 900 : groundY - 64;
      if (bx > -140) drawBoulder(c, bx, by, 66, this.globalT * 3);
    }
    // characters
    if (l.splitT < 0) {
      // pink 8 walking
      const bob = Math.sin(l.walkT * 7) * 5;
      drawPink8(c, {
        cx: sx(l.b8x), bottomY: groundY - 26 + bob, scale: 0.7,
        look: 0.6, mouth: 'grit', time: this.globalT,
      });
      drawBadge(c, sx(l.b8x), groundY - 26 + bob - 280, 8, 1);
    } else if (l.fours > 0) {
      // two green 4s leapt apart (with apples!)
      const st = Math.min(1, (l.splitT - 0.55) / 0.7);
      const ease = 1 - (1 - st) * (1 - st);
      drawGreen4(c, {
        cx: 288 - 150 - 90 * ease, bottomY: groundY - 26, scale: 0.72,
        look: 0.6, mouth: 'smile', apples: 4, time: this.globalT,
      });
      drawGreen4(c, {
        cx: 288 + 150 + 90 * ease, bottomY: groundY - 26, scale: 0.72,
        look: 0.6, mouth: 'smile', apples: 4, time: this.globalT,
      });
      if (st < 1) {
        drawBadge(c, 288 - 150 - 90 * ease, groundY - 200, 4, 0.9);
        drawBadge(c, 288 + 150 + 90 * ease, groundY - 200, 4, 0.9);
      }
    }
    c.restore();
    // split button (icon only)
    if (l.splitT < 0 && !l.done) {
      drawSplitButton(c, 288, 900, 74, this.globalT);
    }
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // LEVEL 4 - SPLIT IN HALF
  // ============================================================
  private tapL4(): void {
    const l = this.l4;
    if (l.done || l.failed || l.splitT >= 0) return;
    const zone = Math.min(l.x1, l.x2);
    if (zone > 210 && zone < l.tunnelX - 40) {
      l.splitT = 0;
      sfxSparkle();
      sfxWhoosh();
      say('Four equals two plus two!', { rate: 1.05 });
    } else {
      sfxBonk();
      this.showTooEarlyFlash = 0.8;
    }
  }

  private updateL4(dt: number): void {
    const l = this.l4;
    this.showTooEarlyFlash = Math.max(0, this.showTooEarlyFlash - dt);
    l.warnT += dt;
    if (l.warnT > 1.6 && l.warnT - dt <= 1.6) {
      say('Split in half!', { rate: 1.0 });
    }
    if (l.failed) return;
    if (l.splitT >= 0) {
      l.splitT += dt;
      if (l.splitT > 0.55 && l.twos === 0) {
        l.twos = 1;
        spawnSparkles(this.particles, 288, 560, 46, PAL.goldLight);
        spawnSparkles(this.particles, 288, 560, 20, PAL.orangeLight);
      }
      if (l.splitT > 2.4 && !l.done) {
        l.done = true;
        this.enterReveal(['4', '=', '2', '+', '2'], () => this.enterIntro(5));
      }
      return;
    }
    // run right
    const speed = 150;
    l.x1 += speed * dt;
    l.x2 += speed * dt;
    const lead = Math.min(l.x1, l.x2);
    if (lead > l.tunnelX - 58) {
      // hit the tunnel wall
      l.failed = true;
      l.bonkT = 0;
      sfxBonk();
      this.shake = 0.6;
      this.enterRetry("THE TUNNEL'S TOO SMALL!");
    }
  }

  private drawL4(): void {
    const c = this.c;
    const l = this.l4;
    drawCaveBackground(c, this.globalT);
    drawSpotlight(c, 288, 0, 300, 1024, 0.15);
    const groundY = 700;
    drawPlanks(c, -20, groundY, W + 40, 44);
    // tunnel arch (only 2s fit)
    drawTunnelArch(c, l.tunnelX, W - l.tunnelX + 60, groundY, 100);
    // golden split zone marker (visual only, no words)
    if (l.splitT < 0 && !l.failed) {
      c.save();
      c.strokeStyle = `rgba(255,215,90,${0.55 + Math.sin(this.globalT * 4) * 0.25})`;
      c.setLineDash([14, 10]);
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(210, groundY);
      c.lineTo(210, groundY - 340);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
    const bob = Math.sin(this.globalT * 9) * 4;
    if (l.splitT < 0) {
      // two green 4s running
      drawGreen4(c, {
        cx: l.x1, bottomY: groundY - 10 + bob * 0.5, scale: 0.85,
        look: 0.7, mouth: 'worried', apples: 4, time: this.globalT,
      });
      drawGreen4(c, {
        cx: l.x2, bottomY: groundY - 10 - bob * 0.5, scale: 0.85,
        look: 0.7, mouth: 'worried', apples: 4, time: this.globalT,
      });
      drawBadge(c, l.x1, groundY - 190, 4, 0.8);
      drawBadge(c, l.x2, groundY - 190, 4, 0.8);
    } else if (l.twos > 0) {
      // four orange 2s running through
      const run = Math.max(0, l.splitT - 0.55) * 260;
      for (let i = 0; i < 4; i++) {
        const bx = 100 + i * 88 + run;
        if (bx < W + 60) {
          drawOrange2(c, {
            cx: bx, bottomY: groundY - 8 + Math.sin(this.globalT * 10 + i) * 4, scale: 0.55,
            look: 0.8, mouth: 'smile', apples: 2, time: this.globalT,
          });
        }
      }
    }
    if (l.splitT < 0 && !l.failed) drawSplitButton(c, 288, 900, 74, this.globalT);
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // LEVEL 5 - THE EXIT (sneak past the giant eye)
  // ============================================================
  private tapL5(): void {
    const l = this.l5;
    if (l.done) return;
    if (l.phase === 'pre') {
      l.phase = 'sneak';
      sfxSparkle();
      sfxWhoosh();
      say('Two equals one plus one!', { rate: 1.0 });
      return;
    }
    if (l.phase !== 'sneak') return;
    if (l.hopT >= 0) return; // mid-hop
    if (l.eyeOpen > 0.45) {
      // caught moving!
      l.caughtFlash = 0.9;
      sfxBonk();
      say('Whoa!', { rate: 1.2, pitch: 0.85 });
      l.progress = Math.max(0, l.progress - 110);
      l.lastSafe = l.progress;
      return;
    }
    // hop forward
    l.hopT = 0;
    l.progress += 38;
    sfxSneak();
  }

  private updateL5(dt: number): void {
    const l = this.l5;
    l.caughtFlash = Math.max(0, l.caughtFlash - dt);
    if (l.hopT >= 0) {
      l.hopT += dt;
      if (l.hopT > 0.3) l.hopT = -1;
    }
    if (l.phase === 'pre') {
      l.eyeCycle += dt;
      return;
    }
    if (l.done) {
      l.doorT += dt;
      if (l.doorT > 2.2) {
        this.enterReveal(['2', '=', '1', '+', '1'], () => this.enterIntro(6));
      }
      return;
    }
    // eye cycle: closed 1.9s -> warn 0.45s -> open 1.35s
    l.eyeCycle += dt;
    const closed = 1.9, warn = 0.45, open = 1.35;
    const t = l.eyeCycle % (closed + warn + open);
    let target = 0;
    if (t > closed + warn) target = 1;
    else if (t > closed) target = 0.18;
    l.eyeOpen += (target - l.eyeOpen) * Math.min(1, dt * 7);
    if (t > closed && !l.warnSound) {
      l.warnSound = true;
      sfxChime(0.6);
    }
    if (t < closed) l.warnSound = false;
    // reach door?
    if (l.progress >= 340) {
      l.done = true;
      l.doorT = 0;
      sfxFanfare();
      say('The coast is clear!', { rate: 1.05 });
      spawnSparkles(this.particles, 430, 700, 40, PAL.goldLight);
    }
  }

  private drawL5(): void {
    const c = this.c;
    const l = this.l5;
    drawCaveBackground(c, this.globalT, 'dark');
    drawSpotlight(c, 430, 0, 220, 800, 0.18);
    const groundY = 760;
    drawPlanks(c, -20, groundY, W + 40, 44);
    // exit door at right
    drawExitDoor(c, 430, groundY, l.done ? Math.min(1, l.doorT / 1.4) : 0, this.globalT);
    // guard eye above door
    drawGuardEye(c, 430, 300, l.eyeOpen, this.globalT);
    // characters
    const baseX = 90 + l.progress;
    if (l.phase === 'pre') {
      // four orange 2s waiting
      for (let i = 0; i < 4; i++) {
        drawOrange2(c, {
          cx: 80 + i * 66, bottomY: groundY - 8 + Math.sin(this.globalT * 4 + i) * 3, scale: 0.52,
          look: 0.8, mouth: 'worried', apples: 2, time: this.globalT,
        });
      }
      drawBadge(c, 212, groundY - 160, 2, 0.8);
    } else {
      // eight red 1s sneaking in a line (leader first)
      for (let i = 0; i < 8; i++) {
        const delay = i * 0.02;
        const h = l.hopT >= 0 ? Math.max(0, Math.sin(((l.hopT - delay) / 0.3) * Math.PI)) * 26 : 0;
        drawRed1(c, {
          cx: baseX - i * 34, bottomY: groundY - 8 - h, scale: 0.44 + (i % 2) * 0.02,
          look: 0.9, mouth: l.caughtFlash > 0 ? 'oh' : 'grit', apples: 1, time: this.globalT,
        });
      }
      drawBadge(c, baseX, groundY - 105, 1, 0.7);
    }
    // danger flash (visual only)
    if (l.caughtFlash > 0) {
      c.save();
      c.globalAlpha = l.caughtFlash * 0.35;
      c.fillStyle = PAL.red;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
    // golden warning glow around the eye when open
    if (l.eyeOpen > 0.45 && !l.done) {
      c.save();
      c.strokeStyle = `rgba(255,215,90,${0.4 + Math.sin(this.globalT * 9) * 0.25})`;
      c.lineWidth = 7;
      c.beginPath();
      c.arc(430, 300, 128, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    if (l.phase === 'pre') {
      drawSplitButton(c, 288, 900, 74, this.globalT);
    } else if (!l.done) {
      drawSplitButton(c, 288, 900, 74, this.globalT, 'HOP');
    }
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // LEVEL 6 - ESCAPE (merge-up celebration)
  // ============================================================
  private tapL6(): void {
    if (this.l6.stage >= 4) {
      this.enterIntro(1);
    }
  }

  private updateL6(dt: number): void {
    const l = this.l6;
    l.t += dt;
    l.confettiT -= dt;
    if (l.confettiT <= 0 && l.stage >= 3) {
      l.confettiT = 0.5;
      spawnSparkles(this.particles, Math.random() * W, -10, 14, [PAL.gold, PAL.pink, PAL.green, PAL.orange, PAL.water][Math.floor(Math.random() * 5)]);
    }
    // staged merges: ones -> twos -> fours -> eight
    const stages = [1.2, 2.6, 4.0, 5.6];
    if (l.stage < 4 && l.t > stages[l.stage]) {
      l.stage++;
      sfxSparkle();
      spawnSparkles(this.particles, 288, 500, 40, PAL.goldLight);
      if (l.stage === 1) { say('Two equals one plus one!', { rate: 1.1 }); sfxBoom(); }
      if (l.stage === 2) { say('Four equals two plus two!', { rate: 1.1 }); sfxBoom(); }
      if (l.stage === 3) { say('And four plus four equals eight!', { rate: 1.1 }); sfxBoom(); }
      if (l.stage === 4) {
        say('One, two, three, four, five, six, seven, eight! We escaped!', { rate: 1.0 });
        sfxFanfare();
        startMusic();
      }
    }
  }

  private drawL6(): void {
    const c = this.c;
    const l = this.l6;
    const openT = Math.min(1, l.t / 1.1);
    // tropical scene fills screen
    c.save();
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, PAL.skyTop);
    sky.addColorStop(0.7, '#e8f8ea');
    sky.addColorStop(1, PAL.sand);
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    // sea
    c.fillStyle = PAL.water;
    c.fillRect(0, 520, W, 130);
    const shimmer = c.createLinearGradient(0, 520, 0, 650);
    shimmer.addColorStop(0, 'rgba(255,255,255,0.5)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = shimmer;
    c.fillRect(0, 520, W, 130);
    // sand foreground
    c.fillStyle = PAL.sand;
    c.beginPath();
    c.ellipse(288, 1020, 420, 220, 0, Math.PI, 0);
    c.fill();
    // palms
    for (const [px, s] of [[60, 1.1], [510, 1.2], [120, 0.8]] as Array<[number, number]>) {
      c.strokeStyle = PAL.palmTrunk;
      c.lineWidth = 14 * s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(px, 660);
      c.quadraticCurveTo(px + 16 * s, 660 - 130 * s, px + 6 * s, 660 - 210 * s);
      c.stroke();
      const top = { x: px + 6 * s, y: 660 - 210 * s };
      const sway = Math.sin(this.globalT * 1.4 + px) * 6;
      for (let i = 0; i < 6; i++) {
        const a = (-1.1 + i * 0.44) + sway * 0.012;
        c.strokeStyle = i % 2 === 0 ? PAL.palmLeaf : PAL.palmLeafPink;
        c.lineWidth = 13 * s;
        c.beginPath();
        c.moveTo(top.x, top.y);
        c.quadraticCurveTo(
          top.x + Math.cos(a) * 52 * s, top.y + Math.sin(a) * 34 * s - 14,
          top.x + Math.cos(a) * 96 * s, top.y + Math.sin(a) * 66 * s + 12
        );
        c.stroke();
      }
    }
    c.restore();
    // characters by stage
    const bob = Math.sin(this.globalT * 5) * 8;
    const gy = 830;
    if (l.stage === 0) {
      for (let i = 0; i < 8; i++) {
        drawRed1(c, {
          cx: 130 + (i % 4) * 105, bottomY: gy - Math.floor(i / 4) * 70 + (i < 4 ? bob : -bob),
          scale: 0.62, look: 0.4, mouth: 'smile', apples: 1, time: this.globalT,
        });
      }
      drawEquation(c, ['2', '=', '1', '+', '1'], 288, 430, 0.9);
    } else if (l.stage === 1) {
      for (let i = 0; i < 4; i++) {
        drawOrange2(c, {
          cx: 150 + i * 95, bottomY: gy + (i % 2 ? bob : -bob),
          scale: 0.72, look: 0.3, mouth: 'smile', apples: 2, time: this.globalT,
        });
      }
      drawEquation(c, ['4', '=', '2', '+', '2'], 288, 430, 0.9);
    } else if (l.stage === 2) {
      drawGreen4(c, { cx: 190, bottomY: gy + bob, scale: 0.9, look: 0.3, mouth: 'smile', apples: 4, armsUp: true, time: this.globalT });
      drawGreen4(c, { cx: 386, bottomY: gy - bob, scale: 0.9, look: 0.3, mouth: 'smile', apples: 4, armsUp: true, time: this.globalT });
      drawEquation(c, ['8', '=', '4', '+', '4'], 288, 430, 0.9);
    } else {
      const dance = Math.sin(this.globalT * 6) * 14;
      const bottom = gy - 40 + Math.abs(dance) * 0.4;
      drawPink8(c, {
        cx: 288, bottomY: bottom, scale: 1.0,
        look: 0, mouth: 'smile', apples: 8, armsUp: true, time: this.globalT, squash: Math.abs(Math.sin(this.globalT * 6)) * 0.3,
      });
      drawBadge(c, 288, bottom - 300, 8, 1.2);
      if (l.stage >= 4) {
        // replay icon (circular arrow), pulsing
        const pulse = 1 + Math.sin(this.globalT * 4) * 0.08;
        c.save();
        c.translate(288, 930);
        c.scale(pulse, pulse);
        c.strokeStyle = PAL.goldLight;
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath();
        c.arc(0, 0, 26, -0.4, Math.PI * 1.55);
        c.stroke();
        c.fillStyle = PAL.goldLight;
        c.beginPath();
        c.moveTo(30, -14);
        c.lineTo(34, 8);
        c.lineTo(12, 0);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
    this.drawMuteBtn();
    this.drawParticlesAndShake();
  }

  // ============================================================
  // SHARED SCREENS
  // ============================================================
  private drawTitle(): void {
    const c = this.c;
    // the video's opening scene: golden door, seesaw, two green 4s
    drawCaveBackground(c, this.globalT);
    drawSpotlight(c, 288, 0, 260, 780, 0.22);
    drawGoldenDoor(c, 288, 640, 96, 150, 0.4 + 0.6 * Math.abs(Math.sin(this.globalT * 0.7)));
    drawBallPit(c, 770, 254, this.globalT);
    const sway = Math.sin(this.globalT * 0.9) * 0.12;
    drawSeesaw(c, 288, 640, 216, sway);
    const sa = Math.sin(sway);
    const ca = Math.cos(sway);
    const bobA = Math.sin(this.globalT * 2.2) * 3;
    drawGreen4(c, { cx: 288 - 200 * ca, bottomY: 640 - 200 * sa - 9 + bobA, scale: 0.78, look: 0, mouth: 'smile', time: this.globalT });
    drawGreen4(c, { cx: 288 + 200 * ca, bottomY: 640 + 200 * sa - 9 - bobA, scale: 0.78, look: 0, mouth: 'smile', time: this.globalT });
    // the only words in the game: the equation
    drawChipEquation(c, 92, 96, ['4', '+', '4']);
    // game name logo: NUMS - golden chunky waving letters
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const logo = 'NUMS';
    let size = 120;
    c.font = `900 ${size}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
    while (logo.split('').reduce((w, ch) => w + c.measureText(ch).width, 0) + 90 > 540 && size > 60) {
      size -= 6;
      c.font = `900 ${size}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
    }
    const widths = logo.split('').map((ch) => c.measureText(ch).width);
    const gap = 22;
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (logo.length - 1);
    let lx = 288 - totalW / 2;
    for (let i = 0; i < logo.length; i++) {
      const wave = Math.sin(this.globalT * 2.4 + i * 0.85) * 10;
      const x = lx + widths[i] / 2;
      const y = 250 + wave;
      const g = c.createLinearGradient(x, y - size / 2, x, y + size / 2);
      g.addColorStop(0, '#ffe9a8');
      g.addColorStop(0.45, PAL.gold);
      g.addColorStop(1, PAL.goldDark);
      c.fillStyle = 'rgba(15,9,3,0.85)';
      c.fillText(logo[i], x + 5, y + 7);
      c.fillStyle = g;
      c.fillText(logo[i], x, y);
      c.strokeStyle = 'rgba(80,45,8,0.9)';
      c.lineWidth = 2.5;
      c.strokeText(logo[i], x, y);
      lx += widths[i] + gap;
    }
    c.restore();
    // pulsing tap ripple
    const ripple = (this.globalT % 1.2) / 1.2;
    c.save();
    c.strokeStyle = `rgba(255,215,102,${(1 - ripple) * 0.7})`;
    c.lineWidth = 4;
    c.beginPath();
    c.arc(288, 905, 20 + ripple * 44, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(20,14,6,0.75)';
    c.beginPath();
    c.arc(288, 905, 26, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = PAL.gold;
    c.lineWidth = 3;
    c.stroke();
    // pointing-hand icon
    c.fillStyle = PAL.goldLight;
    roundRect(c, 282, 890, 12, 22, 6);
    c.fill();
    c.beginPath();
    c.arc(288, 886, 7, 0, Math.PI * 2);
    c.fill();
    c.restore();
    this.drawMuteBtn();
  }

  private drawIntro(): void {
    const c = this.c;
    // quick equation card, exactly like the show's reveal cards
    drawStarburst(c, this.globalT);
    const info = LEVELS[this.level - 1];
    const fade = Math.min(1, this.stateT / 0.25);
    c.save();
    c.globalAlpha = fade;
    if (info.equation) {
      drawEquation(c, info.equation.split(' '), 288, 470, 1.05);
    }
    c.restore();
    // mini characters popping in
    const pop = Math.min(1, this.stateT / 0.3);
    c.save();
    c.globalAlpha = pop;
    c.translate(288, 660);
    const s = 0.9 + Math.sin(this.stateT * 6) * 0.05;
    c.scale(s, s);
    const b = Math.sin(this.globalT * 4);
    if (this.level === 1) {
      drawGreen4(c, { cx: -90, bottomY: 90 + b * 4, scale: 0.55, look: 0, mouth: 'smile', time: this.globalT });
      drawGreen4(c, { cx: 90, bottomY: 90 - b * 4, scale: 0.55, look: 0, mouth: 'smile', time: this.globalT });
    } else if (this.level === 2) {
      drawPink8(c, { cx: 0, bottomY: 120 + b * 4, scale: 0.45, look: 0, mouth: 'grit', time: this.globalT });
      drawApple(c, 0, -20, 30, true, this.globalT);
    } else if (this.level === 3) {
      drawPink8(c, { cx: -60, bottomY: 110, scale: 0.45, look: 0.5, mouth: 'worried', time: this.globalT });
      drawBoulder(c, 80, 60, 52, this.globalT);
    } else if (this.level === 4) {
      drawGreen4(c, { cx: -80, bottomY: 100 + b * 4, scale: 0.5, look: 0.6, mouth: 'worried', time: this.globalT });
      drawOrange2(c, { cx: 80, bottomY: 100 - b * 4, scale: 0.5, look: 0.6, mouth: 'smile', time: this.globalT });
    } else if (this.level === 5) {
      drawOrange2(c, { cx: -80, bottomY: 100 + b * 4, scale: 0.5, look: 0.7, mouth: 'grit', time: this.globalT });
      drawGuardEye(c, 90, -60, 0.5, this.globalT);
    }
    c.restore();
  }

  private drawReveal(): void {
    const c = this.c;
    drawStarburst(c, this.globalT);
    const parts = this.revealParts;
    c.save();
    const text = parts.join(' ');
    // auto-fit: shrink long text to fit the screen
    let size = 84;
    c.font = `900 ${size}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
    while (c.measureText(text).width > 520 && size > 28) {
      size -= 4;
      c.font = `900 ${size}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = PAL.black;
    c.fillText(text, 288, 470);
    c.restore();
    // mini characters
    const pop = Math.min(1, this.stateT / 0.3);
    c.save();
    c.globalAlpha = pop;
    c.translate(288, 660);
    const s = 0.9 + Math.sin(this.stateT * 6) * 0.05;
    c.scale(s, s);
    if (this.level === 1) drawPink8(c, { cx: 0, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', armsUp: true, time: this.globalT });
    else if (this.level === 2) drawApple(c, 0, 0, 34, true, this.globalT);
    else if (this.level === 3) {
      drawGreen4(c, { cx: -80, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', apples: 4, time: this.globalT });
      drawGreen4(c, { cx: 80, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', apples: 4, time: this.globalT });
    } else if (this.level === 4) {
      drawOrange2(c, { cx: -70, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', apples: 2, time: this.globalT });
      drawOrange2(c, { cx: 0, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', apples: 2, time: this.globalT });
      drawOrange2(c, { cx: 70, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', apples: 2, time: this.globalT });
    } else if (this.level === 5) {
      drawRed1(c, { cx: -70, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', time: this.globalT });
      drawRed1(c, { cx: 0, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', time: this.globalT });
      drawRed1(c, { cx: 70, bottomY: 90, scale: 0.55, look: 0, mouth: 'smile', time: this.globalT });
    }
    c.restore();
    // sparkles during reveal
    drawParticles(this.c, this.particles);
  }

  private drawRetry(): void {
    const c = this.c;
    // word-free fail overlay: dark + red pulse + exclamation mark
    const k = Math.min(1, this.stateT / 0.25);
    c.save();
    c.globalAlpha = k * 0.82;
    c.fillStyle = 'rgba(10,6,2,0.9)';
    c.fillRect(0, 0, W, H);
    c.restore();
    const pulse = 1 + Math.sin(this.stateT * 8) * 0.05;
    c.save();
    c.translate(288, 470);
    c.scale(pulse, pulse);
    c.fillStyle = PAL.redLight;
    roundRect(c, -17, -90, 34, 130, 17);
    c.fill();
    c.beginPath();
    c.arc(0, 74, 18, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // ============================================================
  // HUD helpers
  // ============================================================
  private drawMuteBtn(): void {
    const c = this.c;
    c.save();
    c.fillStyle = 'rgba(20,16,10,0.7)';
    c.beginPath();
    c.arc(522, 46, 26, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,235,180,0.6)';
    c.lineWidth = 2;
    c.stroke();
    // speaker icon
    c.fillStyle = isMuted() ? 'rgba(255,235,180,0.45)' : PAL.goldLight;
    c.beginPath();
    c.moveTo(510, 41);
    c.lineTo(517, 41);
    c.lineTo(524, 34);
    c.lineTo(524, 58);
    c.lineTo(517, 51);
    c.lineTo(510, 51);
    c.closePath();
    c.fill();
    if (isMuted()) {
      c.strokeStyle = PAL.redLight;
      c.lineWidth = 3.5;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(530, 38);
      c.lineTo(542, 54);
      c.moveTo(542, 38);
      c.lineTo(530, 54);
      c.stroke();
    } else {
      c.strokeStyle = PAL.goldLight;
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(527, 46, 6, -0.7, 0.7);
      c.stroke();
      c.beginPath();
      c.arc(527, 46, 11, -0.6, 0.6);
      c.stroke();
    }
    c.restore();
  }

  private drawParticlesAndShake(): void {
    drawParticles(this.c, this.particles);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - 0.016);
  }

  // ============================================================
  // MAIN LOOP
  // ============================================================
  private loop(ts: number): void {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.lastT) this.lastT = ts;
    let dt = (ts - this.lastT) / 1000;
    this.lastT = ts;
    if (dt > 0.05) dt = 0.05;
    this.globalT += dt;
    this.stateT += dt;

    const c = this.c;
    // scale design space
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width / W;
    const sy = rect.height / H;
    c.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);

    // letterbox bg
    c.fillStyle = PAL.bgDark;
    c.fillRect(0, 0, W, H);

    updateParticles(this.particles, dt * this.timeScale, 300);

    switch (this.state) {
      case 'title':
        this.drawTitle();
        break;
      case 'intro':
        this.drawIntro();
        if (this.stateT > 1.6) this.startLevel(this.level); // auto-advance, no words
        break;
      case 'reveal': {
        this.drawReveal();
        if (this.stateT > 1.9 && this.pendingNext) {
          const next = this.pendingNext;
          this.pendingNext = null;
          next();
        }
        break;
      }
      case 'retry': {
        // keep drawing the level behind
        this.drawLevelFrozen();
        this.drawRetry();
        if (this.stateT > 1.4) {
          this.startLevel(this.level);
        }
        break;
      }
      case 'win':
        this.drawL6();
        break;
      case 'play':
        this.updatePlay(dt);
        this.drawPlay();
        break;
    }
  }

  private drawLevelFrozen(): void {
    // draw the last level frame statically behind retry overlay
    if (this.level === 1) this.drawL1();
    else if (this.level === 2) this.drawL2();
    else if (this.level === 3) this.drawL3();
    else if (this.level === 4) this.drawL4();
    else if (this.level === 5) this.drawL5();
    else this.drawL6();
  }

  private updatePlay(dt: number): void {
    const d = dt * this.timeScale;
    if (this.level === 1) this.updateL1(d);
    else if (this.level === 2) this.updateL2(d);
    else if (this.level === 3) this.updateL3(d);
    else if (this.level === 4) this.updateL4(d);
    else if (this.level === 5) this.updateL5(d);
    else if (this.level === 6) this.updateL6(d);
  }

  private drawPlay(): void {
    if (this.level === 1) this.drawL1();
    else if (this.level === 2) this.drawL2();
    else if (this.level === 3) this.drawL3();
    else if (this.level === 4) this.drawL4();
    else if (this.level === 5) this.drawL5();
    else if (this.level === 6) this.drawL6();
  }
}

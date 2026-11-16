// ============================================================
// NUMBER TEMPLE ESCAPE - Sprite Renderer v2
// Canvas-drawn characters & props matching the source video:
//  - glossy 3D cube blocks (Numberblocks look)
//  - green 4 (2x2), pink 8 (2x4 + goggles + tentacles),
//    orange 2 (1x2 + goggles), red 1 (1x1)
//  - warm cave temple, golden seesaw/door, glowing apples,
//    starburst equation cards, jungle finale
// Design space: 576 x 1024 (portrait, same as source video)
// ============================================================

export type Ctx = CanvasRenderingContext2D;

// ---------- palette (sampled from the video) ----------
export const PAL = {
  bgDark: '#241a0e',
  caveWall: '#8f7250',
  caveWallDark: '#55401f',
  caveFloor: '#c9a96e',
  green: '#6ecb1c',
  greenLight: '#a3e355',
  greenDark: '#3f8a0c',
  pink: '#e04f9f',
  pinkLight: '#f487c3',
  pinkDark: '#a82867',
  tentacle: '#5c2330',
  tentacleLight: '#8a4352',
  orange: '#ef9a3a',
  orangeLight: '#fbbe6e',
  orangeDark: '#bd6c15',
  red: '#e23b2e',
  redLight: '#f26b54',
  redDark: '#a02115',
  gold: '#f2b93b',
  goldLight: '#ffd766',
  goldDark: '#b97c14',
  beam: '#eeb038',
  white: '#ffffff',
  black: '#1a1a1a',
  text: '#3d3d3d',
  hatBrown: '#8b5e34',
  hatDark: '#5e3c1e',
  goggle: '#6b4a8c',
  goggleDark: '#4a3060',
  boulder: '#9a7a52',
  boulderDark: '#6e5433',
  skyTop: '#bfeef2',
  sand: '#f4e3b8',
  leaf: '#3e9e3f',
  palmTrunk: '#c98a3e',
  palmLeaf: '#5ab552',
  palmLeafPink: '#e88bb0',
  water: '#8ee6c8',
};

// ============================================================
// PRIMITIVES
// ============================================================

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// One glossy 3D cube block (the signature Numberblocks look)
export function drawCube(c: Ctx, x: number, y: number, s: number, base: string, light: string, dark: string, alpha = 1): void {
  c.save();
  c.globalAlpha = alpha;
  const r = s * 0.2;
  // drop shadow
  c.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(c, x + s * 0.05, y + s * 0.07, s, s, r);
  c.filter = 'none';
  c.fill();
  // front face
  const g = c.createLinearGradient(x, y, x + s * 0.9, y + s);
  g.addColorStop(0, light);
  g.addColorStop(0.4, base);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  roundRect(c, x, y, s, s, r);
  c.fill();
  // top light face
  const tg = c.createLinearGradient(x, y, x, y + s * 0.3);
  tg.addColorStop(0, 'rgba(255,255,255,0.55)');
  tg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = tg;
  roundRect(c, x + s * 0.06, y + s * 0.045, s * 0.88, s * 0.26, r * 0.7);
  c.fill();
  // right side shade
  const sg = c.createLinearGradient(x + s * 0.7, y, x + s, y);
  sg.addColorStop(0, 'rgba(0,0,0,0)');
  sg.addColorStop(1, 'rgba(0,0,0,0.28)');
  c.fillStyle = sg;
  roundRect(c, x, y, s, s, r);
  c.fill();
  // bottom bounce light
  const bg = c.createLinearGradient(x, y + s * 0.75, x, y + s);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(1, 'rgba(0,0,0,0.22)');
  c.fillStyle = bg;
  roundRect(c, x, y, s, s, r);
  c.fill();
  // glossy specular dot
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath();
  c.ellipse(x + s * 0.3, y + s * 0.18, s * 0.1, s * 0.055, -0.5, 0, Math.PI * 2);
  c.fill();
  // crisp outline
  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = Math.max(1, s * 0.028);
  roundRect(c, x, y, s, s, r);
  c.stroke();
  c.restore();
}

// White cartoon eye with pupil; lookDir shifts the pupil
export function drawEye(c: Ctx, x: number, y: number, r: number, px: number, py: number, lookDir = 0): void {
  c.save();
  // eye white with thick outline
  c.fillStyle = PAL.white;
  c.strokeStyle = '#26160c';
  c.lineWidth = Math.max(1.6, r * 0.18);
  c.beginPath();
  c.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  const dx = (px + lookDir) * r * 0.4;
  const dy = py * r * 0.36;
  c.fillStyle = '#131313';
  c.beginPath();
  c.arc(x + dx, y + dy, r * 0.44, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath();
  c.arc(x + dx - r * 0.15, y + dy - r * 0.17, r * 0.14, 0, Math.PI * 2);
  c.fill();
  // upper eyelid shading for depth
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  c.lineWidth = r * 0.3;
  c.beginPath();
  c.arc(x, y, r * 0.82, Math.PI * 1.15, Math.PI * 1.85);
  c.stroke();
  c.restore();
}

export function drawMouth(c: Ctx, x: number, y: number, w: number, kind: 'smile' | 'grit' | 'oh' | 'worried' = 'smile'): void {
  c.save();
  c.lineCap = 'round';
  if (kind === 'smile') {
    // open smile with teeth (like the show)
    c.fillStyle = '#7c2d1e';
    c.beginPath();
    c.moveTo(x - w * 0.5, y);
    c.quadraticCurveTo(x, y + w * 0.75, x + w * 0.5, y);
    c.quadraticCurveTo(x, y + w * 0.22, x - w * 0.5, y);
    c.closePath();
    c.fill();
    c.fillStyle = PAL.white;
    c.beginPath();
    c.moveTo(x - w * 0.44, y - w * 0.02);
    c.quadraticCurveTo(x, y + w * 0.22, x + w * 0.44, y - w * 0.02);
    c.quadraticCurveTo(x, y + w * 0.3, x - w * 0.44, y - w * 0.02);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.4)';
    c.lineWidth = Math.max(1, w * 0.07);
    c.beginPath();
    c.moveTo(x - w * 0.5, y);
    c.quadraticCurveTo(x, y + w * 0.75, x + w * 0.5, y);
    c.stroke();
  } else if (kind === 'grit') {
    c.fillStyle = '#7c2d1e';
    roundRect(c, x - w * 0.5, y - w * 0.16, w, w * 0.34, w * 0.14);
    c.fill();
    c.fillStyle = PAL.white;
    roundRect(c, x - w * 0.42, y - w * 0.1, w * 0.84, w * 0.2, w * 0.08);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = Math.max(1, w * 0.05);
    for (let i = 1; i < 3; i++) {
      const tx = x - w * 0.42 + (w * 0.84 / 3) * i;
      c.beginPath();
      c.moveTo(tx, y - w * 0.1);
      c.lineTo(tx, y + w * 0.1);
      c.stroke();
    }
  } else if (kind === 'oh') {
    c.fillStyle = '#7c2d1e';
    c.beginPath();
    c.ellipse(x, y + w * 0.1, w * 0.22, w * 0.3, 0, 0, Math.PI * 2);
    c.fill();
  } else {
    // worried: small wavy line
    c.strokeStyle = '#26160c';
    c.lineWidth = Math.max(2, w * 0.14);
    c.beginPath();
    c.moveTo(x - w * 0.42, y + w * 0.08);
    c.quadraticCurveTo(x - w * 0.2, y - w * 0.14, x, y + w * 0.08);
    c.quadraticCurveTo(x + w * 0.2, y + w * 0.26, x + w * 0.42, y + w * 0.04);
    c.stroke();
  }
  c.restore();
}

// explorer fedora hat (brown, curled brim) - big and proud, like the video
export function drawHat(c: Ctx, cx: number, y: number, w: number): void {
  c.save();
  const brimW = w * 0.78;
  const crownW = w * 0.5;
  const crownH = w * 0.4;
  const cy = y;
  // crown
  c.fillStyle = PAL.hatBrown;
  roundRect(c, cx - crownW / 2, cy - crownH, crownW, crownH * 1.06, crownW * 0.3);
  c.fill();
  // crown top highlight
  const hg = c.createLinearGradient(cx, cy - crownH, cx, cy - crownH * 0.3);
  hg.addColorStop(0, 'rgba(255,235,200,0.55)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg;
  roundRect(c, cx - crownW / 2, cy - crownH, crownW, crownH * 0.6, crownW * 0.3);
  c.fill();
  // band
  c.fillStyle = PAL.hatDark;
  c.fillRect(cx - crownW / 2, cy - crownH * 0.34, crownW, crownH * 0.2);
  // brim (curled)
  c.fillStyle = PAL.hatBrown;
  c.beginPath();
  c.ellipse(cx, cy, brimW / 2, w * 0.085, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath();
  c.ellipse(cx, cy + w * 0.025, brimW / 2, w * 0.055, 0, 0, Math.PI);
  c.fill();
  // outline
  c.strokeStyle = 'rgba(40,20,5,0.5)';
  c.lineWidth = Math.max(1, w * 0.015);
  c.beginPath();
  c.ellipse(cx, cy, brimW / 2, w * 0.085, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

// spy goggles (orange 2) - round purple lenses on a strap
export function drawGoggles(c: Ctx, cx: number, y: number, w: number): void {
  c.save();
  // strap behind head
  c.strokeStyle = PAL.goggleDark;
  c.lineWidth = w * 0.1;
  c.beginPath();
  c.moveTo(cx - w * 0.5, y);
  c.lineTo(cx + w * 0.5, y);
  c.stroke();
  for (const side of [-1, 1]) {
    const lx = cx + side * w * 0.24;
    c.fillStyle = PAL.goggle;
    c.beginPath();
    c.arc(lx, y, w * 0.19, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.arc(lx - w * 0.05, y - w * 0.05, w * 0.08, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = PAL.goggleDark;
    c.lineWidth = Math.max(1.5, w * 0.045);
    c.beginPath();
    c.arc(lx, y, w * 0.19, 0, Math.PI * 2);
    c.stroke();
  }
  // bridge
  c.strokeStyle = PAL.goggleDark;
  c.lineWidth = w * 0.05;
  c.beginPath();
  c.moveTo(cx - w * 0.05, y);
  c.lineTo(cx + w * 0.05, y);
  c.stroke();
  c.restore();
}

// number label (like the show: simple bold digit with soft glow)
export function drawBadge(c: Ctx, cx: number, cy: number, n: number, scale = 1): void {
  c.save();
  c.translate(cx, cy);
  c.scale(scale, scale);
  c.font = `800 44px ${eqFont}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.shadowColor = 'rgba(255,250,230,0.85)';
  c.shadowBlur = 10;
  c.fillStyle = PAL.text;
  c.fillText(String(n), 0, 0);
  c.restore();
}

// glowing golden apple (sphere, no stem - like the video)
export function drawApple(c: Ctx, x: number, y: number, r: number, glow = true, t = 0): void {
  c.save();
  if (glow) {
    const pulse = 0.75 + Math.sin(t) * 0.25;
    const gg = c.createRadialGradient(x, y, r * 0.3, x, y, r * (2.1 + pulse * 0.4));
    gg.addColorStop(0, 'rgba(255,214,90,0.5)');
    gg.addColorStop(1, 'rgba(255,214,90,0)');
    c.fillStyle = gg;
    c.beginPath();
    c.arc(x, y, r * (2.1 + pulse * 0.4), 0, Math.PI * 2);
    c.fill();
  }
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.2);
  g.addColorStop(0, '#ffe98a');
  g.addColorStop(0.5, '#ffcf3e');
  g.addColorStop(1, '#e09a1c');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(120,70,10,0.4)';
  c.lineWidth = Math.max(1, r * 0.08);
  c.stroke();
  c.restore();
}

// ============================================================
// CHARACTERS
// ============================================================

export interface BlockPose {
  cx: number;        // center x
  bottomY: number;   // bottom y (feet on ground)
  scale: number;     // 1 = design size
  look: number;      // pupil look direction -1..1
  mouth?: 'smile' | 'grit' | 'oh' | 'worried';
  squash?: number;   // 0..1 bounce squash amount
  tilt?: number;     // radians body tilt
  armsUp?: boolean;
  apples?: number;   // golden apples held in arms (0-8)
  alpha?: number;
  time?: number;     // anim time for glows/wiggles
}

interface LimbOpts {
  color: string;
  dark: string;
  handColor?: string;
}

function drawLimbs(c: Ctx, o: LimbOpts, cx: number, bottomY: number, s: number, squash: number, armsUp: boolean, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = o.dark;
  c.lineCap = 'round';
  // legs
  c.lineWidth = s * 0.17;
  const legLen = s * (0.34 - squash * 0.16);
  c.beginPath();
  c.moveTo(cx - s * 0.3, bottomY - legLen * 0.3);
  c.lineTo(cx - s * 0.34, bottomY);
  c.stroke();
  c.beginPath();
  c.moveTo(cx + s * 0.3, bottomY - legLen * 0.3);
  c.lineTo(cx + s * 0.34, bottomY);
  c.stroke();
  // feet
  c.fillStyle = o.dark;
  c.beginPath();
  c.ellipse(cx - s * 0.38, bottomY - s * 0.02, s * 0.15, s * 0.09, 0, 0, Math.PI * 2);
  c.ellipse(cx + s * 0.38, bottomY - s * 0.02, s * 0.15, s * 0.09, 0, 0, Math.PI * 2);
  c.fill();
  // arms
  c.lineWidth = s * 0.16;
  c.strokeStyle = o.color;
  const hand = o.handColor ?? o.dark;
  if (armsUp) {
    c.beginPath();
    c.moveTo(cx - s * 0.5, bottomY - s * 0.6);
    c.quadraticCurveTo(cx - s * 0.92, bottomY - s * 1.0, cx - s * 0.78, bottomY - s * 1.42);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + s * 0.5, bottomY - s * 0.6);
    c.quadraticCurveTo(cx + s * 0.92, bottomY - s * 1.0, cx + s * 0.78, bottomY - s * 1.42);
    c.stroke();
    c.fillStyle = hand;
    c.beginPath();
    c.arc(cx - s * 0.78, bottomY - s * 1.44, s * 0.13, 0, Math.PI * 2);
    c.arc(cx + s * 0.78, bottomY - s * 1.44, s * 0.13, 0, Math.PI * 2);
    c.fill();
  } else {
    c.beginPath();
    c.moveTo(cx - s * 0.5, bottomY - s * 0.62);
    c.quadraticCurveTo(cx - s * 0.84, bottomY - s * 0.5, cx - s * 0.8, bottomY - s * 0.24);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + s * 0.5, bottomY - s * 0.62);
    c.quadraticCurveTo(cx + s * 0.84, bottomY - s * 0.5, cx + s * 0.8, bottomY - s * 0.24);
    c.stroke();
    c.fillStyle = hand;
    c.beginPath();
    c.arc(cx - s * 0.8, bottomY - s * 0.22, s * 0.13, 0, Math.PI * 2);
    c.arc(cx + s * 0.8, bottomY - s * 0.22, s * 0.13, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function face(c: Ctx, cx: number, fy: number, s: number, look: number, mouth: 'smile' | 'grit' | 'oh' | 'worried'): void {
  const er = s * 0.2;
  // eyebrows
  c.save();
  c.strokeStyle = '#26160c';
  c.lineWidth = Math.max(2, s * 0.07);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx - er * 1.6, fy - er * 1.75);
  c.quadraticCurveTo(cx - er * 0.9, fy - er * 2.15, cx - er * 0.2, fy - er * 1.7);
  c.stroke();
  c.beginPath();
  c.moveTo(cx + er * 0.2, fy - er * 1.7);
  c.quadraticCurveTo(cx + er * 0.9, fy - er * 2.15, cx + er * 1.6, fy - er * 1.75);
  c.stroke();
  c.restore();
  drawEye(c, cx - s * 0.26, fy, er, -0.25, 0.25, look);
  drawEye(c, cx + s * 0.26, fy, er, 0.25, 0.25, look);
  drawMouth(c, cx, fy + s * 0.52, s * 0.42, mouth);
}

// one tapered tentacle with suction cups and optional orb at the tip
function tentacle(c: Ctx, x0: number, y0: number, x1: number, y1: number, bendX: number, bendY: number, w: number, orb: boolean, t: number): void {
  c.save();
  c.strokeStyle = PAL.tentacle;
  c.lineCap = 'round';
  // draw as a filled tapered shape
  const grad = c.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, PAL.tentacle);
  grad.addColorStop(1, PAL.tentacleLight);
  c.strokeStyle = grad;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(bendX, bendY, x1, y1);
  c.stroke();
  // suction cups along the inner curve
  c.fillStyle = 'rgba(255,190,190,0.5)';
  for (let i = 1; i <= 3; i++) {
    const tt = i / 4;
    const mx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * bendX + tt * tt * x1;
    const my = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * bendY + tt * tt * y1;
    c.beginPath();
    c.arc(mx, my, w * 0.16, 0, Math.PI * 2);
    c.fill();
  }
  if (orb) {
    drawApple(c, x1, y1, w * 0.5, true, t);
  }
  c.restore();
}

// GREEN 4 - 2x2 lime blocks, fedora, expressive face
export function drawGreen4(c: Ctx, p: BlockPose): void {
  const s = 62 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * 2 * (1 - squash * 0.18);
  const alpha = p.alpha ?? 1;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  drawLimbs(c, { color: PAL.greenDark, dark: PAL.greenDark, handColor: PAL.greenDark }, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 2; col++)
      drawCube(c, p.cx - s + col * s, topY + r * s, s, PAL.green, PAL.greenLight, PAL.greenDark, alpha);
  // face on upper row
  face(c, p.cx, topY + s * 0.58, s, p.look, p.mouth ?? 'smile');
  // hat
  drawHat(c, p.cx, topY + s * 0.02, s * 1.5);
  // glowing orbs held in hands
  if (p.apples && p.apples > 0) {
    const n = Math.min(p.apples, 8);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      drawApple(c, p.cx + side * s * 0.95, p.bottomY - s * 1.05 - row * s * 0.45, s * 0.19, true, (p.time ?? 0) * 3 + i);
    }
  }
  c.restore();
}

// PINK 8 (Octoblock) - 2x4 magenta blocks, fedora + goggles, 8 tentacles
export function drawPink8(c: Ctx, p: BlockPose): void {
  const s = 56 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * 4 * (1 - squash * 0.15);
  const alpha = p.alpha ?? 1;
  const t = p.time ?? 0;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  // legs
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = PAL.pinkDark;
  c.lineWidth = s * 0.3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(p.cx - s * 0.32, p.bottomY - s * 0.2);
  c.lineTo(p.cx - s * 0.36, p.bottomY);
  c.moveTo(p.cx + s * 0.32, p.bottomY - s * 0.2);
  c.lineTo(p.cx + s * 0.36, p.bottomY);
  c.stroke();
  c.restore();
  // 8 tentacles from every row (4 per side), wiggle with time
  const rows = [1.0, 1.85, 2.7, 3.55];
  for (const side of [-1, 1]) {
    rows.forEach((ry, i) => {
      const baseY = p.bottomY - s * ry;
      const wig = Math.sin(t * 3.4 + i * 1.7 + (side > 0 ? 0.9 : 0)) * s * 0.14;
      const orb = (p.apples ?? 0) > i;
      tentacle(
        c,
        p.cx + side * s * 0.92, baseY,
        p.cx + side * s * (1.5 + i * 0.14) + wig, baseY - s * (0.62 - i * 0.1),
        p.cx + side * s * (1.42 + i * 0.1) + wig, baseY + s * 0.1,
        s * (0.24 - i * 0.02), orb, t * 3 + i
      );
    });
  }
  // body blocks: 2 wide x 4 tall
  for (let r = 0; r < 4; r++)
    for (let col = 0; col < 2; col++)
      drawCube(c, p.cx - s + col * s, topY + r * s, s, PAL.pink, PAL.pinkLight, PAL.pinkDark, alpha);
  // face on top block + goggles + hat
  const fy = topY + s * 0.52;
  c.save();
  c.globalAlpha = alpha;
  // goggles sit above the eyes
  drawGoggles(c, p.cx, fy - s * 0.32, s * 1.5);
  face(c, p.cx, fy + s * 0.28, s * 0.94, p.look, p.mouth ?? 'smile');
  drawHat(c, p.cx, topY + s * 0.02, s * 1.4);
  c.restore();
  c.restore();
}

// ORANGE 2 - 1x2, fedora + spy goggles
export function drawOrange2(c: Ctx, p: BlockPose): void {
  const s = 60 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * 2 * (1 - squash * 0.18);
  const alpha = p.alpha ?? 1;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  drawLimbs(c, { color: PAL.orangeDark, dark: PAL.orangeDark, handColor: PAL.orangeDark }, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  for (let r = 0; r < 2; r++)
    drawCube(c, p.cx - s * 0.5, topY + r * s, s, PAL.orange, PAL.orangeLight, PAL.orangeDark, alpha);
  const fy = topY + s * 0.52;
  c.save();
  c.globalAlpha = alpha;
  drawGoggles(c, p.cx, fy - s * 0.38, s * 1.1);
  face(c, p.cx, fy + s * 0.3, s * 0.9, p.look, p.mouth ?? 'smile');
  drawHat(c, p.cx, topY + s * 0.02, s * 1.35);
  c.restore();
  if (p.apples && p.apples > 0) {
    const n = Math.min(p.apples, 4);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      drawApple(c, p.cx + side * s * 0.85, p.bottomY - s * 0.95, s * 0.18, true, (p.time ?? 0) * 3 + i);
    }
  }
  c.restore();
}

// RED 1 - single red block, tiny fedora, one big eye
export function drawRed1(c: Ctx, p: BlockPose): void {
  const s = 58 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * (1 - squash * 0.2);
  const alpha = p.alpha ?? 1;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  drawLimbs(c, { color: PAL.redDark, dark: PAL.redDark, handColor: PAL.redDark }, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  drawCube(c, p.cx - s * 0.5, topY, s, PAL.red, PAL.redLight, PAL.redDark, alpha);
  const fy = topY + s * 0.52;
  c.save();
  c.globalAlpha = alpha;
  // single big eye (Numberblock One)
  drawEye(c, p.cx, fy - s * 0.02, s * 0.24, 0.2, 0.3, p.look);
  drawMouth(c, p.cx, fy + s * 0.5, s * 0.4, p.mouth ?? 'smile');
  drawHat(c, p.cx, topY + s * 0.02, s * 1.3);
  c.restore();
  if (p.apples && p.apples > 0) {
    drawApple(c, p.cx + s * 0.85, p.bottomY - s * 0.6, s * 0.18, true, (p.time ?? 0) * 3);
  }
  c.restore();
}

// ============================================================
// ENVIRONMENT
// ============================================================

function vignette(c: Ctx, strength = 0.45): void {
  const g = c.createRadialGradient(W2, H2, H2 * 0.35, W2, H2, H2 * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(10,6,2,${strength})`);
  c.fillStyle = g;
  c.fillRect(0, 0, 576, 1024);
}

const W2 = 288;
const H2 = 512;

// warm brown cave wall with stalactites, rock texture & vignette
export function drawCaveBackground(c: Ctx, t: number, hue: 'brown' | 'dark' = 'brown'): void {
  c.save();
  const g = c.createLinearGradient(0, 0, 0, 1024);
  if (hue === 'brown') {
    g.addColorStop(0, '#a3845a');
    g.addColorStop(0.45, '#84683f');
    g.addColorStop(1, '#4a3418');
  } else {
    g.addColorStop(0, '#6b543a');
    g.addColorStop(0.45, '#4c3a1e');
    g.addColorStop(1, '#241608');
  }
  c.fillStyle = g;
  c.fillRect(0, 0, 576, 1024);
  // large soft rock blobs
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 173) % 640) - 30;
    const by = 60 + ((i * 271) % 900);
    const br = 60 + ((i * 97) % 90);
    c.fillStyle = i % 3 === 0 ? 'rgba(255,230,190,0.05)' : 'rgba(30,18,6,0.09)';
    c.beginPath();
    c.ellipse(bx + Math.sin(t * 0.3 + i) * 3, by, br, br * 0.72, i, 0, Math.PI * 2);
    c.fill();
  }
  // stalactites along the top
  c.fillStyle = 'rgba(28,16,6,0.8)';
  for (let i = 0; i < 9; i++) {
    const sx = 24 + i * 66 + Math.sin(i * 5.1) * 12;
    const sw = 26 + (i % 3) * 14;
    const sh = 46 + ((i * 53) % 70);
    c.beginPath();
    c.moveTo(sx - sw / 2, 0);
    c.quadraticCurveTo(sx - sw * 0.16, sh * 0.75, sx, sh);
    c.quadraticCurveTo(sx + sw * 0.16, sh * 0.75, sx + sw / 2, 0);
    c.closePath();
    c.fill();
  }
  // dim distant archways (depth cue)
  if (hue === 'brown') {
    c.fillStyle = 'rgba(30,18,8,0.28)';
    for (const ax of [70, 288, 505]) {
      c.beginPath();
      c.moveTo(ax - 34, 380);
      c.lineTo(ax - 34, 470);
      c.quadraticCurveTo(ax, 408, ax + 34, 470);
      c.lineTo(ax + 34, 380);
      c.closePath();
      c.fill();
    }
  }
  vignette(c, hue === 'brown' ? 0.4 : 0.62);
  c.restore();
}

// warm spotlight cone from the ceiling
export function drawSpotlight(c: Ctx, cx: number, topY: number, spread: number, bottomY: number, intensity = 0.25): void {
  c.save();
  const g = c.createLinearGradient(cx, topY, cx, bottomY);
  g.addColorStop(0, `rgba(255,240,200,${intensity})`);
  g.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(cx - spread * 0.18, topY);
  c.lineTo(cx + spread * 0.18, topY);
  c.lineTo(cx + spread, bottomY);
  c.lineTo(cx - spread, bottomY);
  c.closePath();
  c.fill();
  // soft pool of light where the cone lands
  const pg = c.createRadialGradient(cx, bottomY - 40, 10, cx, bottomY - 40, spread * 0.9);
  pg.addColorStop(0, `rgba(255,235,180,${intensity * 0.5})`);
  pg.addColorStop(1, 'rgba(255,235,180,0)');
  c.fillStyle = pg;
  c.beginPath();
  c.ellipse(cx, bottomY - 40, spread * 0.9, spread * 0.4, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// golden temple door with a radiant halo
export function drawGoldenDoor(c: Ctx, cx: number, baseY: number, w: number, h: number, eyeOpen = 1): void {
  c.save();
  const pulse = 0.6 + eyeOpen * 0.4;
  // halo
  const hg = c.createRadialGradient(cx, baseY - h * 0.5, w * 0.2, cx, baseY - h * 0.5, w * (1.6 + pulse * 0.5));
  hg.addColorStop(0, `rgba(255,215,110,${0.55 * pulse})`);
  hg.addColorStop(1, 'rgba(255,215,110,0)');
  c.fillStyle = hg;
  c.beginPath();
  c.arc(cx, baseY - h * 0.5, w * (1.6 + pulse * 0.5), 0, Math.PI * 2);
  c.fill();
  // frame
  c.fillStyle = '#7a5420';
  roundRect(c, cx - w * 0.62, baseY - h * 1.06, w * 1.24, h * 1.06, w * 0.2);
  c.fill();
  // door slab with arch top
  const dg = c.createLinearGradient(cx - w / 2, baseY - h, cx + w / 2, baseY);
  dg.addColorStop(0, '#ffd766');
  dg.addColorStop(0.5, '#f2b93b');
  dg.addColorStop(1, '#c98a1e');
  c.fillStyle = dg;
  c.beginPath();
  c.moveTo(cx - w * 0.5, baseY);
  c.lineTo(cx - w * 0.5, baseY - h * 0.62);
  c.quadraticCurveTo(cx, baseY - h * 1.06, cx + w * 0.5, baseY - h * 0.62);
  c.lineTo(cx + w * 0.5, baseY);
  c.closePath();
  c.fill();
  // inner panel
  c.strokeStyle = 'rgba(120,75,10,0.6)';
  c.lineWidth = w * 0.05;
  c.beginPath();
  c.moveTo(cx - w * 0.3, baseY - h * 0.1);
  c.lineTo(cx - w * 0.3, baseY - h * 0.55);
  c.quadraticCurveTo(cx, baseY - h * 0.82, cx + w * 0.3, baseY - h * 0.55);
  c.lineTo(cx + w * 0.3, baseY - h * 0.1);
  c.stroke();
  // glowing core (the door radiates light in the video)
  const cg = c.createRadialGradient(cx, baseY - h * 0.45, 2, cx, baseY - h * 0.45, w * 0.5);
  cg.addColorStop(0, `rgba(255,246,200,${0.85 * pulse})`);
  cg.addColorStop(1, 'rgba(255,246,200,0)');
  c.fillStyle = cg;
  c.beginPath();
  c.arc(cx, baseY - h * 0.45, w * 0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// golden wooden planks (floors & platforms)
export function drawPlanks(c: Ctx, x: number, y: number, w: number, h: number): void {
  c.save();
  const g = c.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#f4c356');
  g.addColorStop(0.5, '#df9f33');
  g.addColorStop(1, '#a86f18');
  c.fillStyle = g;
  roundRect(c, x, y, w, h, Math.min(8, h * 0.4));
  c.fill();
  // plank seams + grain
  c.strokeStyle = 'rgba(110,70,10,0.5)';
  c.lineWidth = 2;
  const pw = 118;
  for (let px = x + pw; px < x + w; px += pw) {
    c.beginPath();
    c.moveTo(px, y + 2);
    c.lineTo(px, y + h - 2);
    c.stroke();
  }
  c.strokeStyle = 'rgba(255,230,160,0.5)';
  c.lineWidth = 1.6;
  for (let px = x + 10; px < x + w; px += 34) {
    c.beginPath();
    c.moveTo(px, y + h * 0.3);
    c.quadraticCurveTo(px + 14, y + h * 0.42, px, y + h * 0.55);
    c.stroke();
  }
  c.strokeStyle = 'rgba(70,40,4,0.45)';
  c.lineWidth = 2.5;
  roundRect(c, x, y, w, h, Math.min(8, h * 0.4));
  c.stroke();
  c.restore();
}

// pit full of dark red glossy balls
export function drawBallPit(c: Ctx, y: number, h: number, t: number): void {
  c.save();
  // pit shadow
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1a0e06');
  g.addColorStop(1, '#0c0603');
  c.fillStyle = g;
  c.fillRect(0, y, 576, h);
  // balls (2.5 rows, wobbles gently)
  const r = 17;
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 16; col++) {
      const bx = col * 36 + (row % 2) * 18 + 6;
      const by = y + 10 + row * 30 + Math.sin(t * 1.4 + col * 0.8 + row) * 3;
      const bg = c.createRadialGradient(bx - r * 0.3, by - r * 0.35, r * 0.15, bx, by, r);
      bg.addColorStop(0, '#e05a48');
      bg.addColorStop(0.6, '#b03328');
      bg.addColorStop(1, '#6e1d15');
      c.fillStyle = bg;
      c.beginPath();
      c.arc(bx, by, r, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// golden seesaw on an earthen mound ring
export function drawSeesaw(c: Ctx, cx: number, y: number, halfW: number, angle: number): void {
  c.save();
  // mound platform
  c.fillStyle = '#9a7a50';
  c.beginPath();
  c.ellipse(cx, y + 34, halfW * 1.25, 52, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.beginPath();
  c.ellipse(cx, y + 40, halfW * 1.2, 44, 0, 0, Math.PI * 2);
  c.fill();
  // fulcrum
  c.fillStyle = '#8a6a3c';
  c.beginPath();
  c.moveTo(cx - 26, y + 26);
  c.lineTo(cx + 26, y + 26);
  c.lineTo(cx, y - 16);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(60,36,8,0.6)';
  c.lineWidth = 3;
  c.stroke();
  // plank
  c.save();
  c.translate(cx, y);
  c.rotate(angle);
  const g = c.createLinearGradient(0, -8, 0, 10);
  g.addColorStop(0, '#ffd76e');
  g.addColorStop(0.5, '#eeb038');
  g.addColorStop(1, '#b97c14');
  c.fillStyle = g;
  roundRect(c, -halfW, -9, halfW * 2, 18, 9);
  c.fill();
  c.strokeStyle = 'rgba(90,55,8,0.55)';
  c.lineWidth = 3;
  roundRect(c, -halfW, -9, halfW * 2, 18, 9);
  c.stroke();
  // grip marks
  c.strokeStyle = 'rgba(120,75,12,0.5)';
  c.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    c.beginPath();
    c.moveTo(i * halfW * 0.36, -4);
    c.lineTo(i * halfW * 0.36 + 12, -4);
    c.stroke();
  }
  c.restore();
  c.restore();
}

// giant rolling boulder
export function drawBoulder(c: Ctx, x: number, y: number, r: number, rot: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.15, 0, 0, r * 1.15);
  g.addColorStop(0, '#c4a26e');
  g.addColorStop(0.65, '#9a7a52');
  g.addColorStop(1, '#5e4426');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  // cracks & speckles (scattered, not face-like)
  c.strokeStyle = 'rgba(50,32,12,0.5)';
  c.lineWidth = r * 0.055;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-r * 0.55, -r * 0.35);
  c.quadraticCurveTo(-r * 0.3, -r * 0.3, -r * 0.18, -r * 0.48);
  c.stroke();
  c.beginPath();
  c.moveTo(r * 0.15, r * 0.55);
  c.quadraticCurveTo(r * 0.35, r * 0.35, r * 0.55, r * 0.42);
  c.stroke();
  c.beginPath();
  c.moveTo(-r * 0.6, r * 0.15);
  c.quadraticCurveTo(-r * 0.42, r * 0.28, -r * 0.5, r * 0.45);
  c.stroke();
  c.fillStyle = 'rgba(50,32,12,0.35)';
  for (const [sx, sy, sr] of [[-0.35, -0.15, 0.11], [0.3, -0.25, 0.09], [0.05, 0.15, 0.08], [-0.1, 0.45, 0.07], [0.5, 0.05, 0.09]]) {
    c.beginPath();
    c.arc(sx * r, sy * r, sr * r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // ground shadow
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(x, y + r * 0.92, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// golden bridge over a chasm
export function drawBridge(c: Ctx, x: number, y: number, w: number, h: number): void {
  drawPlanks(c, x, y, w, h);
  // rope rails
  c.strokeStyle = 'rgba(90,55,10,0.6)';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x, y - 6);
  c.quadraticCurveTo(x + w * 0.5, y - 18, x + w, y - 6);
  c.stroke();
}

// cave wall with a low tunnel opening (only 2s fit)
export function drawTunnelArch(c: Ctx, x: number, w: number, floorY: number, gapH: number): void {
  c.save();
  // wall slab
  const g = c.createLinearGradient(x, floorY - 420, x + w, floorY);
  g.addColorStop(0, '#a3845a');
  g.addColorStop(1, '#5e4426');
  c.fillStyle = g;
  roundRect(c, x - 30, floorY - 430, w + 60, 430, 26);
  c.fill();
  c.strokeStyle = 'rgba(40,24,8,0.5)';
  c.lineWidth = 3;
  roundRect(c, x - 30, floorY - 430, w + 60, 430, 26);
  c.stroke();
  // tunnel opening (dark arch)
  c.fillStyle = '#120a04';
  c.beginPath();
  c.moveTo(x + 10, floorY);
  c.lineTo(x + 10, floorY - gapH * 0.55);
  c.quadraticCurveTo(x + 10, floorY - gapH, x + w * 0.5, floorY - gapH);
  c.quadraticCurveTo(x + w - 10, floorY - gapH, x + w - 10, floorY - gapH * 0.55);
  c.lineTo(x + w - 10, floorY);
  c.closePath();
  c.fill();
  // faint light inside the tunnel
  const lg = c.createLinearGradient(x + 10, floorY - gapH, x + w - 10, floorY);
  lg.addColorStop(0, 'rgba(255,220,150,0.14)');
  lg.addColorStop(1, 'rgba(255,220,150,0)');
  c.fillStyle = lg;
  c.beginPath();
  c.moveTo(x + 10, floorY);
  c.lineTo(x + 10, floorY - gapH * 0.55);
  c.quadraticCurveTo(x + 10, floorY - gapH, x + w * 0.5, floorY - gapH);
  c.quadraticCurveTo(x + w - 10, floorY - gapH, x + w - 10, floorY - gapH * 0.55);
  c.lineTo(x + w - 10, floorY);
  c.closePath();
  c.fill();
  // small stalactites on the arch lip
  c.fillStyle = '#3c2a12';
  for (let i = 0; i < 3; i++) {
    const sx = x + w * (0.3 + i * 0.2);
    c.beginPath();
    c.moveTo(sx - 9, floorY - gapH - 2);
    c.lineTo(sx + 9, floorY - gapH - 2);
    c.lineTo(sx, floorY - gapH + 16 + i * 4);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// the giant eye embedded in the cave wall
export function drawGuardEye(c: Ctx, cx: number, cy: number, openness: number, t: number): void {
  c.save();
  // dark socket in the rock
  c.fillStyle = 'rgba(14,8,3,0.92)';
  c.beginPath();
  c.ellipse(cx, cy, 120, 86, 0, 0, Math.PI * 2);
  c.fill();
  // rocky rim
  c.strokeStyle = 'rgba(90,64,30,0.85)';
  c.lineWidth = 12;
  c.beginPath();
  c.ellipse(cx, cy, 122, 88, 0, 0, Math.PI * 2);
  c.stroke();
  const open = Math.max(0, Math.min(1, openness));
  if (open > 0.02) {
    // eye white
    const blink = 1 - open;
    c.save();
    c.beginPath();
    c.ellipse(cx, cy, 92, 62, 0, 0, Math.PI * 2);
    c.clip();
    const g = c.createRadialGradient(cx, cy - 20, 8, cx, cy, 95);
    g.addColorStop(0, '#fdfaf0');
    g.addColorStop(1, '#e8dcc0');
    c.fillStyle = g;
    c.fillRect(cx - 100, cy - 70, 200, 140);
    // iris follows time
    const ix = Math.sin(t * 0.8) * 22;
    const iy = Math.cos(t * 0.6) * 10;
    const ig = c.createRadialGradient(cx + ix, cy + iy, 6, cx + ix, cy + iy, 34);
    ig.addColorStop(0, '#5e3c1e');
    ig.addColorStop(1, '#2e1c0c');
    c.fillStyle = ig;
    c.beginPath();
    c.arc(cx + ix, cy + iy, 34, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0c0805';
    c.beginPath();
    c.arc(cx + ix, cy + iy, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.arc(cx + ix - 9, cy + iy - 10, 6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // eyelids closing from top & bottom
    c.fillStyle = '#6b4a26';
    if (blink > 0.02) {
      c.beginPath();
      c.ellipse(cx, cy - 62, 96, 62 * blink + 6, 0, Math.PI, 0);
      c.fill();
      c.beginPath();
      c.ellipse(cx, cy + 62, 96, 62 * blink + 6, 0, 0, Math.PI);
      c.fill();
    }
  } else {
    // closed lid seam
    c.strokeStyle = 'rgba(40,26,10,0.9)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(cx - 80, cy);
    c.quadraticCurveTo(cx, cy + 8, cx + 80, cy);
    c.stroke();
  }
  c.restore();
}

// carved stone exit door with maze pattern, opens into light
export function drawExitDoor(c: Ctx, cx: number, baseY: number, openT: number, t: number): void {
  c.save();
  const w = 150;
  const h = 210;
  const open = Math.max(0, Math.min(1, openT));
  // bright light behind (grows as the door opens)
  if (open > 0) {
    const lg = c.createRadialGradient(cx, baseY - h * 0.45, 4, cx, baseY - h * 0.45, w * (0.8 + open));
    lg.addColorStop(0, `rgba(255,246,200,${0.9 * open})`);
    lg.addColorStop(1, 'rgba(255,246,200,0)');
    c.fillStyle = lg;
    c.fillRect(cx - w * 1.6, baseY - h * 1.8, w * 3.2, h * 2);
  }
  // frame
  c.fillStyle = '#5e4426';
  roundRect(c, cx - w * 0.62, baseY - h * 1.1, w * 1.24, h * 1.1, 14);
  c.fill();
  // door slabs sliding apart
  const shift = open * w * 0.52;
  for (const side of [-1, 1]) {
    c.save();
    c.beginPath();
    c.rect(cx - w * 0.62, baseY - h * 1.05, w * 1.24, h * 1.05);
    c.clip();
    const dx = cx + side * shift;
    const g = c.createLinearGradient(dx - w / 2, baseY - h, dx + w / 2, baseY);
    g.addColorStop(0, '#e6b45e');
    g.addColorStop(0.5, '#d9a85c');
    g.addColorStop(1, '#a8793a');
    c.fillStyle = g;
    roundRect(c, dx - w * 0.5, baseY - h * 1.05, w, h * 1.05, 8);
    c.fill();
    // maze / greek-key carving
    c.strokeStyle = 'rgba(110,76,28,0.85)';
    c.lineWidth = 5;
    const my0 = baseY - h * 0.92;
    const half = w * 0.36;
    for (let row = 0; row < 3; row++) {
      const yy = my0 + row * h * 0.3;
      c.beginPath();
      c.moveTo(dx - half, yy + h * 0.12);
      c.lineTo(dx - half, yy);
      c.lineTo(dx + half, yy);
      c.lineTo(dx + half, yy + h * 0.12);
      c.stroke();
      if (row < 2) {
        c.beginPath();
        c.moveTo(dx - half * 0.5, yy + h * 0.12);
        c.lineTo(dx - half * 0.5, yy + h * 0.2);
        c.lineTo(dx + half * 0.5, yy + h * 0.2);
        c.lineTo(dx + half * 0.5, yy + h * 0.12);
        c.stroke();
      }
    }
    c.strokeStyle = 'rgba(50,32,8,0.5)';
    c.lineWidth = 2;
    roundRect(c, dx - w * 0.5, baseY - h * 1.05, w, h * 1.05, 8);
    c.stroke();
    c.restore();
  }
  // golden light spilling out onto the floor
  if (open > 0.1) {
    const sg = c.createLinearGradient(cx, baseY, cx, baseY + 60);
    sg.addColorStop(0, `rgba(255,238,170,${0.75 * open})`);
    sg.addColorStop(1, 'rgba(255,238,170,0)');
    c.fillStyle = sg;
    c.beginPath();
    c.ellipse(cx, baseY + 18, w * 0.7 * open, 26 * open, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ============================================================
// TEXT / UI
// ============================================================

// rotating yellow starburst (equation reveal cards)
export function drawStarburst(c: Ctx, t: number, alpha = 1): void {
  c.save();
  c.globalAlpha = alpha;
  const cx = 288;
  const cy = 512;
  // base warm fill
  const bg = c.createRadialGradient(cx, cy, 30, cx, cy, 640);
  bg.addColorStop(0, '#fffef2');
  bg.addColorStop(0.35, '#fff3b8');
  bg.addColorStop(1, '#ffd94a');
  c.fillStyle = bg;
  c.fillRect(0, 0, 576, 1024);
  // rotating rays
  c.save();
  c.translate(cx, cy);
  c.rotate(t * 0.12);
  const R = 760;
  for (let i = 0; i < 24; i++) {
    const a0 = (i * Math.PI * 2) / 24;
    const a1 = a0 + Math.PI / 24;
    c.fillStyle = i % 2 === 0 ? 'rgba(255,214,64,0.85)' : 'rgba(255,190,40,0.55)';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, a0, a1);
    c.closePath();
    c.fill();
  }
  c.restore();
  // white core
  const cg = c.createRadialGradient(cx, cy, 10, cx, cy, 260);
  cg.addColorStop(0, 'rgba(255,255,255,0.98)');
  cg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = cg;
  c.fillRect(0, 0, 576, 1024);
  c.restore();
}

let eqFont = '"Nunito", "Arial Rounded MT Bold", Arial, sans-serif';

// allow the app to inject the self-hosted Nunito family from next/font
export function setEquationFont(familyList: string): void {
  if (familyList) eqFont = `${familyList}, "Nunito", Arial, sans-serif`;
}

function eqText(c: Ctx, text: string, cx: number, cy: number, size: number, color = PAL.text): void {
  c.save();
  c.font = `800 ${size}px ${eqFont}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(text, cx, cy);
  c.restore();
}

// plain equation line (like the video: dark grey rounded numerals)
export function drawEquation(c: Ctx, parts: string[], cx: number, cy: number, scale = 1): void {
  eqText(c, parts.join(' '), cx, cy, Math.round(64 * scale), PAL.text);
}

// small equation chips row (4 + 4 = ?)
export function drawChipEquation(c: Ctx, x: number, y: number, chips: Array<'4' | '+' | '=' | '8' | '?'>): void {
  c.save();
  const size = 46;
  c.font = `800 ${size}px ${eqFont}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  let cx = x;
  for (const ch of chips) {
    const w = Math.max(c.measureText(ch).width, 20) + 6;
    c.fillStyle = ch === '?' ? 'rgba(61,61,61,0.45)' : PAL.text;
    c.fillText(ch, cx + w / 2, y);
    cx += w + 10;
  }
  c.restore();
}

// row of mini apples showing progress n/8
export function drawAppleCounter(c: Ctx, x: number, y: number, count: number, total: number): void {
  c.save();
  for (let i = 0; i < total; i++) {
    const ax = x + i * 30;
    if (i < count) {
      drawApple(c, ax, y, 11, false, 0);
    } else {
      c.fillStyle = 'rgba(60,40,14,0.5)';
      c.beginPath();
      c.arc(ax, y, 11, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

export function drawProgressBar(c: Ctx, x: number, y: number, w: number, h: number, pct: number): void {
  c.save();
  c.fillStyle = 'rgba(30,20,8,0.6)';
  roundRect(c, x, y, w, h, h / 2);
  c.fill();
  if (pct > 0.01) {
    const g = c.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, '#c98a1e');
    g.addColorStop(1, '#ffd766');
    c.fillStyle = g;
    roundRect(c, x, y, Math.max(h, w * Math.min(1, pct)), h, h / 2);
    c.fill();
  }
  c.restore();
}

// round action button, icon-only (split arrows / hop arrow)
export function drawSplitButton(c: Ctx, cx: number, cy: number, r: number, pulseT: number, label = 'SPLIT'): void {
  c.save();
  const pulse = 1 + Math.sin(pulseT * 4) * 0.06;
  c.translate(cx, cy);
  c.scale(pulse, pulse);
  // halo
  const hg = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.7);
  hg.addColorStop(0, 'rgba(255,215,110,0.35)');
  hg.addColorStop(1, 'rgba(255,215,110,0)');
  c.fillStyle = hg;
  c.beginPath();
  c.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  c.fill();
  // button
  const g = c.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, 'rgba(40,28,12,0.92)');
  g.addColorStop(1, 'rgba(18,12,4,0.92)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = PAL.gold;
  c.lineWidth = 4.5;
  c.stroke();
  // icon
  c.strokeStyle = PAL.goldLight;
  c.fillStyle = PAL.goldLight;
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (label.toUpperCase().includes('HOP')) {
    // hop: up arrow
    c.beginPath();
    c.moveTo(0, r * 0.5);
    c.lineTo(0, -r * 0.42);
    c.stroke();
    c.beginPath();
    c.moveTo(-r * 0.3, -r * 0.12);
    c.lineTo(0, -r * 0.48);
    c.lineTo(r * 0.3, -r * 0.12);
    c.stroke();
  } else {
    // split: one line diverging into two arrows
    c.beginPath();
    c.moveTo(-r * 0.5, r * 0.3);
    c.lineTo(0, -r * 0.05);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -r * 0.05);
    c.quadraticCurveTo(r * 0.22, -r * 0.18, r * 0.44, -r * 0.4);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -r * 0.05);
    c.quadraticCurveTo(r * 0.3, r * 0.02, r * 0.5, r * 0.12);
    c.stroke();
    c.beginPath();
    c.moveTo(r * 0.3, -r * 0.5);
    c.lineTo(r * 0.5, -r * 0.46);
    c.lineTo(r * 0.4, -r * 0.28);
    c.stroke();
    c.beginPath();
    c.moveTo(r * 0.38, r * 0.02);
    c.lineTo(r * 0.54, r * 0.06);
    c.lineTo(r * 0.44, r * 0.22);
    c.stroke();
  }
  c.restore();
}

// rounded banner (kept for compatibility; engine now stays word-free)
export function drawBanner(c: Ctx, text: string, y: number, t: number, color = PAL.red, size = 40): void {
  c.save();
  c.font = `900 ${size}px ${eqFont}`;
  const w = c.measureText(text).width + 56;
  c.fillStyle = 'rgba(18,12,4,0.82)';
  roundRect(c, 288 - w / 2, y - size * 0.75, w, size * 1.5, size * 0.75);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 3.5;
  roundRect(c, 288 - w / 2, y - size * 0.75, w, size * 1.5, size * 0.75);
  c.stroke();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.font = `900 ${size}px ${eqFont}`;
  c.fillText(text, 288, y);
  c.restore();
}

// ============================================================
// PARTICLES
// ============================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  color: string;
  size: number;
  rot: number;
  vr: number;
  star: boolean;
}

export function updateParticles(ps: Particle[], dt: number, gravity = 300): void {
  for (const p of ps) {
    p.life += dt;
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  for (let i = ps.length - 1; i >= 0; i--) {
    if (ps[i].life > ps[i].ttl) ps.splice(i, 1);
  }
}

function drawStar(c: Ctx, x: number, y: number, r: number, rot: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const a2 = a + Math.PI / 5;
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  c.closePath();
  c.fill();
  c.restore();
}

export function drawParticles(c: Ctx, ps: Particle[]): void {
  c.save();
  for (const p of ps) {
    const a = 1 - p.life / p.ttl;
    c.globalAlpha = Math.max(0, a);
    c.fillStyle = p.color;
    if (p.star) {
      drawStar(c, p.x, p.y, p.size, p.rot);
    } else {
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

export function spawnSparkles(ps: Particle[], x: number, y: number, n: number, color: string): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 240;
    ps.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 120,
      life: 0,
      ttl: 0.5 + Math.random() * 0.7,
      color: Array.isArray(color) ? color[i % color.length] : color,
      size: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 6,
      star: Math.random() > 0.4,
    });
  }
}

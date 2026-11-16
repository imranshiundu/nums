// ============================================================
// NUMBER TEMPLE ESCAPE - Sprite Renderer
// Canvas-drawn characters & props matching the video's look:
// cube blocks with bevels, white cartoon eyes, explorer hats,
// golden apples, cave temple environment, equation UI
// Design space: 576 x 1024 (portrait, same as source video)
// ============================================================

export type Ctx = CanvasRenderingContext2D;

// ---------- palette (sampled from the video) ----------
export const PAL = {
  bgDark: '#2e2413',        // letterbox / cave dark
  caveWall: '#8a6a45',      // tan cave wall
  caveWallDark: '#5e4526',  // lower cave shadow
  caveFloor: '#a8845b',     // floor tan
  green: '#63c231',
  greenLight: '#8adb52',
  greenDark: '#3f8f1d',
  pink: '#cf3d95',
  pinkLight: '#e665b4',
  pinkDark: '#99266b',
  tentacle: '#6d2f7a',
  orange: '#e58a2e',
  orangeLight: '#f2a950',
  orangeDark: '#b25f17',
  red: '#d8402c',
  redLight: '#ea5f44',
  redDark: '#9e2818',
  gold: '#f5b52e',
  goldLight: '#ffd766',
  goldDark: '#c17f13',
  beam: '#f0b23c',
  white: '#ffffff',
  black: '#1a1a1a',
  hatBrown: '#8a5a33',
  hatDark: '#5f3c1e',
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

// One beveled cube block (the signature look of every character)
export function drawCube(c: Ctx, x: number, y: number, s: number, base: string, light: string, dark: string, alpha = 1): void {
  c.save();
  c.globalAlpha = alpha;
  const g = c.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, light);
  g.addColorStop(0.45, base);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  roundRect(c, x, y, s, s, s * 0.16);
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = Math.max(1, s * 0.025);
  c.stroke();
  // top-left highlight edge
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = Math.max(1, s * 0.035);
  c.beginPath();
  c.moveTo(x + s * 0.14, y + s * 0.05);
  c.lineTo(x + s * 0.86, y + s * 0.05);
  c.stroke();
  c.restore();
}

// White cartoon eye with pupil; dir = pupil offset
export function drawEye(c: Ctx, x: number, y: number, r: number, px: number, py: number, lookDir = 0): void {
  c.save();
  c.fillStyle = PAL.white;
  c.strokeStyle = PAL.black;
  c.lineWidth = Math.max(1.5, r * 0.16);
  c.beginPath();
  c.ellipse(x, y, r, r * 1.12, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  const dx = (px + lookDir) * r * 0.42;
  const dy = py * r * 0.38;
  c.fillStyle = PAL.black;
  c.beginPath();
  c.arc(x + dx, y + dy, r * 0.42, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath();
  c.arc(x + dx - r * 0.14, y + dy - r * 0.16, r * 0.13, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function drawMouth(c: Ctx, x: number, y: number, w: number, kind: 'smile' | 'grit' | 'oh' | 'worried' = 'smile'): void {
  c.save();
  c.strokeStyle = PAL.black;
  c.lineWidth = Math.max(2, w * 0.14);
  c.lineCap = 'round';
  if (kind === 'smile') {
    c.beginPath();
    c.arc(x, y - w * 0.18, w * 0.55, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
  } else if (kind === 'grit') {
    c.beginPath();
    c.moveTo(x - w * 0.55, y);
    c.lineTo(x + w * 0.55, y);
    c.stroke();
    c.beginPath();
    for (let i = -1; i <= 1; i += 2) {
      c.moveTo(x + i * w * 0.35, y - w * 0.12);
      c.lineTo(x + i * w * 0.35, y + w * 0.12);
    }
    c.stroke();
  } else if (kind === 'oh') {
    c.fillStyle = PAL.black;
    c.beginPath();
    c.ellipse(x, y, w * 0.3, w * 0.4, 0, 0, Math.PI * 2);
    c.fill();
  } else {
    // worried - downward arc
    c.beginPath();
    c.arc(x, y + w * 0.35, w * 0.5, 1.2 * Math.PI, 1.8 * Math.PI);
    c.stroke();
  }
  c.restore();
}

// Brown explorer fedora (as worn by the 4s and 8 in the video)
export function drawHat(c: Ctx, cx: number, y: number, w: number): void {
  c.save();
  // brim
  c.fillStyle = PAL.hatDark;
  c.beginPath();
  c.ellipse(cx, y + w * 0.06, w * 0.62, w * 0.16, 0, 0, Math.PI * 2);
  c.fill();
  // crown
  const g = c.createLinearGradient(cx - w * 0.4, y - w * 0.5, cx + w * 0.4, y);
  g.addColorStop(0, PAL.hatBrown);
  g.addColorStop(1, PAL.hatDark);
  c.fillStyle = g;
  roundRect(c, cx - w * 0.42, y - w * 0.52, w * 0.84, w * 0.56, w * 0.18);
  c.fill();
  // band
  c.fillStyle = PAL.black;
  roundRect(c, cx - w * 0.42, y - w * 0.14, w * 0.84, w * 0.14, w * 0.05);
  c.fill();
  c.restore();
}

// Dark pill number badge above a character (matches video UI)
export function drawBadge(c: Ctx, cx: number, cy: number, n: number, scale = 1): void {
  c.save();
  const w = 46 * scale;
  const h = 40 * scale;
  c.fillStyle = 'rgba(30,26,20,0.92)';
  roundRect(c, cx - w / 2, cy - h / 2, w, h, h * 0.42);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.25)';
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = PAL.white;
  c.font = `800 ${28 * scale}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(n), cx, cy + 1 * scale);
  c.restore();
}

// Golden apple (the "golden delicious" collectible)
export function drawApple(c: Ctx, x: number, y: number, r: number, glow = true, t = 0): void {
  c.save();
  if (glow) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + x * 0.05);
    const g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4);
    g.addColorStop(0, `rgba(255,215,90,${0.5 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(255,215,90,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 2.4, 0, Math.PI * 2);
    c.fill();
  }
  // body
  const bg = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.2, x, y, r * 1.2);
  bg.addColorStop(0, PAL.goldLight);
  bg.addColorStop(0.6, PAL.gold);
  bg.addColorStop(1, PAL.goldDark);
  c.fillStyle = bg;
  c.beginPath();
  // apple-ish shape: two lobes
  c.arc(x - r * 0.18, y, r * 0.88, 0, Math.PI * 2);
  c.arc(x + r * 0.18, y, r * 0.88, 0, Math.PI * 2);
  c.fill();
  // stem + leaf
  c.strokeStyle = PAL.hatDark;
  c.lineWidth = Math.max(1.5, r * 0.16);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y - r * 0.75);
  c.quadraticCurveTo(x + r * 0.1, y - r * 1.05, x + r * 0.25, y - r * 1.1);
  c.stroke();
  c.fillStyle = PAL.leaf;
  c.beginPath();
  c.ellipse(x + r * 0.5, y - r * 1.05, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
  c.fill();
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

function drawLimbs(c: Ctx, color: string, dark: string, cx: number, bottomY: number, s: number, squash: number, armsUp: boolean, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = dark;
  c.lineCap = 'round';
  // legs
  c.lineWidth = s * 0.16;
  const legLen = s * (0.3 - squash * 0.14);
  c.beginPath();
  c.moveTo(cx - s * 0.3, bottomY - legLen * 0.3);
  c.lineTo(cx - s * 0.36, bottomY - legLen * 0.15 + legLen * 0.5);
  c.stroke();
  c.beginPath();
  c.moveTo(cx + s * 0.3, bottomY - legLen * 0.3);
  c.lineTo(cx + s * 0.36, bottomY - legLen * 0.15 + legLen * 0.5);
  c.stroke();
  // feet
  c.fillStyle = dark;
  c.beginPath();
  c.ellipse(cx - s * 0.38, bottomY - legLen * 0.02, s * 0.14, s * 0.09, 0, 0, Math.PI * 2);
  c.ellipse(cx + s * 0.38, bottomY - legLen * 0.02, s * 0.14, s * 0.09, 0, 0, Math.PI * 2);
  c.fill();
  // arms
  c.lineWidth = s * 0.15;
  if (armsUp) {
    c.beginPath();
    c.moveTo(cx - s * 0.5, bottomY - s * 0.55);
    c.quadraticCurveTo(cx - s * 0.85, bottomY - s * 0.95, cx - s * 0.7, bottomY - s * 1.3);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + s * 0.5, bottomY - s * 0.55);
    c.quadraticCurveTo(cx + s * 0.85, bottomY - s * 0.95, cx + s * 0.7, bottomY - s * 1.3);
    c.stroke();
  } else {
    c.beginPath();
    c.moveTo(cx - s * 0.5, bottomY - s * 0.6);
    c.quadraticCurveTo(cx - s * 0.8, bottomY - s * 0.45, cx - s * 0.75, bottomY - s * 0.2);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + s * 0.5, bottomY - s * 0.6);
    c.quadraticCurveTo(cx + s * 0.8, bottomY - s * 0.45, cx + s * 0.75, bottomY - s * 0.2);
    c.stroke();
  }
  c.restore();
}

// GREEN 4 - a 2x2 block with explorer hat
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
  drawLimbs(c, PAL.green, PAL.greenDark, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 2; col++)
      drawCube(c, p.cx - s + col * s, topY + r * s, s, PAL.green, PAL.greenLight, PAL.greenDark, alpha);
  // face on upper row
  const fy = topY + s * 0.62;
  drawEye(c, p.cx - s * 0.32, fy, s * 0.19, -0.2, 0.2, p.look);
  drawEye(c, p.cx + s * 0.32, fy, s * 0.19, 0.2, 0.2, p.look);
  drawMouth(c, p.cx, fy + s * 0.5, s * 0.4, p.mouth ?? 'smile');
  // hat
  drawHat(c, p.cx, topY + s * 0.02, s * 1.5);
  // apples held
  if (p.apples && p.apples > 0) {
    const n = Math.min(p.apples, 8);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      drawApple(c, p.cx + side * s * 0.95, p.bottomY - s * 1.1 - row * s * 0.5, s * 0.2, true, p.time ?? 0);
    }
  }
  c.restore();
}

// PINK 8 - a 2x4 tower with tentacle arms & hat (like the video)
export function drawPink8(c: Ctx, p: BlockPose): void {
  const s = 56 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * 4 * (1 - squash * 0.15);
  const alpha = p.alpha ?? 1;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  // tentacle arms (4 visible, wavy)
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = PAL.tentacle;
  c.lineWidth = s * 0.26;
  c.lineCap = 'round';
  const t = p.time ?? 0; // wiggle time
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const baseY = p.bottomY - s * (1.4 + i * 0.8);
      const wig = Math.sin(t * 4 + i * 2 + (side > 0 ? 1 : 0)) * s * 0.12;
      c.beginPath();
      c.moveTo(p.cx + side * s * 0.9, baseY);
      c.quadraticCurveTo(
        p.cx + side * s * (1.5 + i * 0.1) + wig, baseY - s * 0.4,
        p.cx + side * s * (1.15 + i * 0.25) + wig * 1.5, baseY - s * 0.95
      );
      c.stroke();
    }
  }
  // legs
  c.lineWidth = s * 0.3;
  c.beginPath();
  c.moveTo(p.cx - s * 0.35, p.bottomY - s * 0.3);
  c.lineTo(p.cx - s * 0.45, p.bottomY);
  c.stroke();
  c.beginPath();
  c.moveTo(p.cx + s * 0.35, p.bottomY - s * 0.3);
  c.lineTo(p.cx + s * 0.45, p.bottomY);
  c.stroke();
  c.restore();
  // 8 blocks: 2 wide, 4 tall
  for (let r = 0; r < 4; r++)
    for (let col = 0; col < 2; col++)
      drawCube(c, p.cx - s + col * s, topY + r * s, s, PAL.pink, PAL.pinkLight, PAL.pinkDark, alpha);
  // face on 2nd row from top
  const fy = topY + s * 1.55;
  // lashes
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = PAL.black;
  c.lineWidth = s * 0.05;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ex = p.cx + side * s * 0.42;
      const ey = fy - s * 0.28 - i * s * 0.1;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex + side * s * 0.16, ey - s * 0.08);
      c.stroke();
    }
  }
  drawEye(c, p.cx - s * 0.3, fy, s * 0.2, -0.2, 0.2, p.look);
  drawEye(c, p.cx + s * 0.3, fy, s * 0.2, 0.2, 0.2, p.look);
  drawMouth(c, p.cx, fy + s * 0.52, s * 0.42, p.mouth ?? 'smile');
  drawHat(c, p.cx, topY + s * 0.05, s * 1.35);
  // apples held with tentacles
  if (p.apples && p.apples > 0 && p.apples < 50) {
    const n = Math.min(p.apples, 8);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      drawApple(c, p.cx + side * s * 1.25, p.bottomY - s * (1.5 + row * 0.75), s * 0.24, true, (p.time ?? 0) + i);
    }
  }
  c.restore();
}

// ORANGE 2 - a 1x2 block with big eyes
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
  drawLimbs(c, PAL.orange, PAL.orangeDark, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  drawCube(c, p.cx - s * 0.5, topY, s, PAL.orange, PAL.orangeLight, PAL.orangeDark, alpha);
  drawCube(c, p.cx - s * 0.5, topY + s, s, PAL.orange, PAL.orangeLight, PAL.orangeDark, alpha);
  const fy = topY + s * 0.6;
  drawEye(c, p.cx - s * 0.24, fy, s * 0.22, -0.2, 0.2, p.look);
  drawEye(c, p.cx + s * 0.24, fy, s * 0.22, 0.2, 0.2, p.look);
  drawMouth(c, p.cx, fy + s * 0.55, s * 0.38, p.mouth ?? 'smile');
  if (p.apples && p.apples > 0) {
    drawApple(c, p.cx - s * 0.75, p.bottomY - s * 1.0, s * 0.22, true, p.time ?? 0);
    drawApple(c, p.cx + s * 0.75, p.bottomY - s * 1.0, s * 0.22, true, (p.time ?? 0) + 1);
  }
  c.restore();
}

// RED 1 - a single block with one big eye
export function drawRed1(c: Ctx, p: BlockPose): void {
  const s = 52 * p.scale;
  const squash = p.squash ?? 0;
  const topY = p.bottomY - s * (1 - squash * 0.2);
  const alpha = p.alpha ?? 1;
  c.save();
  if (p.tilt) {
    c.translate(p.cx, p.bottomY);
    c.rotate(p.tilt);
    c.translate(-p.cx, -p.bottomY);
  }
  drawLimbs(c, PAL.red, PAL.redDark, p.cx, p.bottomY, s, squash, p.armsUp ?? false, alpha);
  drawCube(c, p.cx - s * 0.5, topY, s, PAL.red, PAL.redLight, PAL.redDark, alpha);
  drawEye(c, p.cx, topY + s * 0.5, s * 0.26, -0.2, 0.2, p.look);
  drawMouth(c, p.cx, topY + s * 0.8, s * 0.3, p.mouth ?? 'smile');
  if (p.apples && p.apples > 0) {
    drawApple(c, p.cx - s * 0.8, p.bottomY - s * 0.9, s * 0.2, true, p.time ?? 0);
  }
  c.restore();
}

// ============================================================
// ENVIRONMENT
// ============================================================

export function drawCaveBackground(c: Ctx, t: number, hue: 'brown' | 'dark' = 'brown'): void {
  // wall gradient
  const g = c.createLinearGradient(0, 0, 0, 1024);
  if (hue === 'brown') {
    g.addColorStop(0, '#3a2c18');
    g.addColorStop(0.35, PAL.caveWallDark);
    g.addColorStop(0.75, PAL.caveWall);
    g.addColorStop(1, '#3a2c18');
  } else {
    g.addColorStop(0, '#241c10');
    g.addColorStop(0.5, '#4a3820');
    g.addColorStop(1, '#241c10');
  }
  c.fillStyle = g;
  c.fillRect(0, 0, 576, 1024);
  // speckle texture (deterministic)
  c.save();
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 576;
    const y = rnd() * 1024;
    const r = 2 + rnd() * 10;
    c.fillStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,230,180,0.07)';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // top opening glow (like the video's lit top area)
  const glow = c.createRadialGradient(288, 60, 20, 288, 60, 380);
  glow.addColorStop(0, 'rgba(255,230,170,0.28)');
  glow.addColorStop(1, 'rgba(255,230,170,0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, 576, 500);
}

export function drawSpotlight(c: Ctx, cx: number, topY: number, spread: number, bottomY: number, intensity = 0.25): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, topY, 0, bottomY);
  g.addColorStop(0, `rgba(255,235,180,${intensity})`);
  g.addColorStop(1, 'rgba(255,235,180,0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(cx - 14, topY);
  c.lineTo(cx + 14, topY);
  c.lineTo(cx + spread, bottomY);
  c.lineTo(cx - spread, bottomY);
  c.closePath();
  c.fill();
  c.restore();
}

// Golden door frame with the eye glyph (background prop)
export function drawGoldenDoor(c: Ctx, cx: number, baseY: number, w: number, h: number, eyeOpen = 1): void {
  c.save();
  // arch
  c.fillStyle = PAL.goldDark;
  roundRect(c, cx - w / 2, baseY - h, w, h, w * 0.28);
  c.fill();
  c.fillStyle = 'rgba(20,14,6,0.85)';
  roundRect(c, cx - w / 2 + w * 0.14, baseY - h + h * 0.12, w * 0.72, h * 0.88, w * 0.22);
  c.fill();
  // eye glyph on top
  const gy = baseY - h + h * 0.3;
  c.fillStyle = PAL.gold;
  c.beginPath();
  c.ellipse(cx, gy, w * 0.16, w * 0.09 * eyeOpen, 0, 0, Math.PI * 2);
  c.fill();
  if (eyeOpen > 0.15) {
    c.fillStyle = '#241a10';
    c.beginPath();
    c.arc(cx, gy, w * 0.06 * eyeOpen, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// Wooden plank platform
export function drawPlanks(c: Ctx, x: number, y: number, w: number, h: number): void {
  c.save();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#f0b34c');
  g.addColorStop(0.5, '#d99a33');
  g.addColorStop(1, '#b87c22');
  c.fillStyle = g;
  roundRect(c, x, y, w, h, 6);
  c.fill();
  c.strokeStyle = 'rgba(120,70,10,0.5)';
  c.lineWidth = 2;
  const n = Math.max(2, Math.floor(w / 90));
  for (let i = 1; i < n; i++) {
    const px = x + (w / n) * i;
    c.beginPath();
    c.moveTo(px, y);
    c.lineTo(px, y + h);
    c.stroke();
  }
  c.restore();
}

// Red ball pit (danger)
export function drawBallPit(c: Ctx, y: number, h: number, t: number): void {
  c.save();
  c.fillStyle = '#3a2410';
  c.fillRect(0, y, 576, h);
  let seed = 3;
  const rnd = (): number => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 576;
    const yy = y + 10 + rnd() * (h - 26);
    const r = 9 + rnd() * 12;
    const bob = Math.sin(t * 2 + i) * 2;
    const bg = c.createRadialGradient(x - r * 0.3, yy - r * 0.3 - bob, r * 0.2, x, yy - bob, r);
    bg.addColorStop(0, '#ff6b52');
    bg.addColorStop(1, '#8e1d10');
    c.fillStyle = bg;
    c.beginPath();
    c.arc(x, yy - bob, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// Golden balance beam (seesaw)
export function drawSeesaw(c: Ctx, cx: number, y: number, halfW: number, angle: number): void {
  c.save();
  c.translate(cx, y);
  c.rotate(angle);
  const g = c.createLinearGradient(0, -10, 0, 14);
  g.addColorStop(0, PAL.goldLight);
  g.addColorStop(0.5, PAL.beam);
  g.addColorStop(1, PAL.goldDark);
  c.fillStyle = g;
  roundRect(c, -halfW, -9, halfW * 2, 18, 9);
  c.fill();
  c.strokeStyle = 'rgba(120,70,10,0.55)';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
  // fulcrum pole
  c.save();
  const pg = c.createLinearGradient(cx - 5, 0, cx + 5, 0);
  pg.addColorStop(0, PAL.goldDark);
  pg.addColorStop(0.5, PAL.goldLight);
  pg.addColorStop(1, PAL.goldDark);
  c.fillStyle = pg;
  c.fillRect(cx - 5, y - 190, 10, 190);
  c.restore();
}

// Giant boulder
export function drawBoulder(c: Ctx, x: number, y: number, r: number, rot: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.2, 0, 0, r * 1.15);
  g.addColorStop(0, '#b09060');
  g.addColorStop(0.7, PAL.boulder);
  g.addColorStop(1, PAL.boulderDark);
  c.fillStyle = g;
  c.beginPath();
  // lumpy circle
  const pts = 11;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = r * (0.9 + 0.14 * Math.sin(i * 2.7));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath();
  c.ellipse(-r * 0.25, r * 0.3, r * 0.35, r * 0.18, 0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(r * 0.3, -r * 0.2, r * 0.22, r * 0.12, -0.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// Stone bridge segment (level 3)
export function drawBridge(c: Ctx, x: number, y: number, w: number, h: number): void {
  c.save();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#c9a25e');
  g.addColorStop(1, '#8a6a3a');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(60,40,15,0.5)';
  c.lineWidth = 2;
  for (let i = 0; i < Math.floor(w / 42); i++) {
    const bx = x + 6 + i * 42;
    c.strokeRect(bx, y + 3, 36, h * 0.4);
    c.strokeRect(bx - 21, y + h * 0.55, 36, h * 0.4);
  }
  c.restore();
}

// Tunnel / arch obstacle (level 4)
export function drawTunnelArch(c: Ctx, x: number, w: number, floorY: number, gapH: number): void {
  c.save();
  // stone block wall with opening
  c.fillStyle = '#7d5a30';
  c.fillRect(x, floorY - gapH - 260, w, 260);
  c.fillStyle = '#936f3d';
  c.fillRect(x, floorY - gapH, w, gapH); // below opening
  // opening
  c.fillStyle = 'rgba(15,10,4,0.92)';
  c.fillRect(x, floorY - gapH, w, gapH);
  c.strokeStyle = PAL.gold;
  c.lineWidth = 4;
  c.strokeRect(x, floorY - gapH, w, gapH);
  // height dashes
  c.setLineDash([10, 8]);
  c.strokeStyle = 'rgba(255,220,120,0.9)';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x - 30, floorY - gapH);
  c.lineTo(x + w + 30, floorY - gapH);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

// Sleeping guard eye (level 5)
export function drawGuardEye(c: Ctx, cx: number, cy: number, openness: number, t: number): void {
  c.save();
  // stone socket
  c.fillStyle = '#3a2c18';
  c.beginPath();
  c.ellipse(cx, cy, 86, 56, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = PAL.gold;
  c.lineWidth = 5;
  c.stroke();
  // eyelid
  c.save();
  c.beginPath();
  c.ellipse(cx, cy, 84, 54, 0, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = '#e8dfc8';
  c.beginPath();
  c.ellipse(cx, cy, 80, 50 * openness, 0, 0, Math.PI * 2);
  c.fill();
  if (openness > 0.2) {
    // iris - amber with slit
    c.fillStyle = '#c98a1e';
    c.beginPath();
    c.arc(cx, cy, 34 * openness, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#241a10';
    c.beginPath();
    c.ellipse(cx, cy, 10, 26 * openness, 0, 0, Math.PI * 2);
    c.fill();
    // glint
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.arc(cx - 10, cy - 10 * openness, 6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  c.restore();
  // light cone when open
  if (openness > 0.3) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const swing = Math.sin(t * 0.9) * 120;
    const g = c.createLinearGradient(cx, cy, cx + swing, 1024);
    g.addColorStop(0, `rgba(255,235,160,${0.34 * openness})`);
    g.addColorStop(1, 'rgba(255,235,160,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx - 30, cy);
    c.lineTo(cx + 30, cy);
    c.lineTo(cx + swing + 200, 1024);
    c.lineTo(cx + swing - 200, 1024);
    c.closePath();
    c.fill();
    c.restore();
  }
}

// Exit door opening to tropical paradise (level 5/6)
export function drawExitDoor(c: Ctx, cx: number, baseY: number, openT: number, t: number): void {
  const w = 300;
  const h = 420;
  const topY = baseY - h;
  c.save();
  // paradise behind (visible through opening as door lifts)
  c.save();
  c.beginPath();
  c.rect(cx - w / 2, topY + h * (1 - openT), w, h * openT);
  c.clip();
  // sky
  const sky = c.createLinearGradient(0, topY, 0, baseY);
  sky.addColorStop(0, PAL.skyTop);
  sky.addColorStop(1, '#e8f8ea');
  c.fillStyle = sky;
  c.fillRect(cx - w / 2, topY, w, h);
  // sea band
  c.fillStyle = PAL.water;
  c.fillRect(cx - w / 2, baseY - 150, w, 60);
  // sand
  c.fillStyle = PAL.sand;
  c.beginPath();
  c.ellipse(cx, baseY - 40, w * 0.75, 90, 0, Math.PI, 0);
  c.fill();
  c.fillRect(cx - w / 2, baseY - 45, w, 45);
  // palm trees
  for (const [px, s] of [[cx - 90, 1], [cx + 30, 1.15], [cx + 105, 0.85]] as Array<[number, number]>) {
    const trunkH = 120 * s;
    c.strokeStyle = PAL.palmTrunk;
    c.lineWidth = 13 * s;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(px, baseY - 50);
    c.quadraticCurveTo(px + 12 * s, baseY - 50 - trunkH * 0.6, px + 4 * s, baseY - 50 - trunkH);
    c.stroke();
    const top = { x: px + 4 * s, y: baseY - 50 - trunkH };
    const sway = Math.sin(t * 1.6 + px) * 5;
    for (let i = 0; i < 5; i++) {
      const a = (-0.9 + i * 0.45) + sway * 0.01;
      c.strokeStyle = i % 2 === 0 ? PAL.palmLeaf : PAL.palmLeafPink;
      c.lineWidth = 12 * s;
      c.beginPath();
      c.moveTo(top.x, top.y);
      c.quadraticCurveTo(
        top.x + Math.cos(a) * 46 * s, top.y + Math.sin(a) * 30 * s - 12,
        top.x + Math.cos(a) * 84 * s, top.y + Math.sin(a) * 58 * s + 10
      );
      c.stroke();
    }
  }
  c.restore();
  // stone door slab sliding up
  const slabY = topY - h * openT;
  c.fillStyle = '#a8835a';
  roundRect(c, cx - w / 2 - 8, slabY, w + 16, h + 10, 10);
  c.fill();
  // glyph pattern
  c.strokeStyle = 'rgba(80,55,25,0.8)';
  c.lineWidth = 6;
  for (const gx of [cx - w * 0.25, cx + w * 0.25]) {
    roundRect(c, gx - 26, slabY + 60, 52, 52, 8);
    c.stroke();
    roundRect(c, gx - 26, slabY + 140, 52, 52, 8);
    c.stroke();
  }
  // frame
  c.strokeStyle = '#c9a25e';
  c.lineWidth = 14;
  roundRect(c, cx - w / 2 - 14, topY - 14, w + 28, h + 20, 14);
  c.stroke();
  // glow when opening
  if (openT > 0.05 && openT < 0.99) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g2 = c.createRadialGradient(cx, baseY - h / 2, 10, cx, baseY - h / 2, 320);
    g2.addColorStop(0, `rgba(255,250,210,${0.5 * openT})`);
    g2.addColorStop(1, 'rgba(255,250,210,0)');
    c.fillStyle = g2;
    c.fillRect(0, 0, 576, 1024);
    c.restore();
  }
  c.restore();
}

// ============================================================
// UI
// ============================================================

export function drawStarburst(c: Ctx, t: number, alpha = 1): void {
  // yellow radial burst background (the split-reveal look)
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = '#f7e04b';
  c.fillRect(0, 0, 576, 1024);
  const cx = 288;
  const cy = 512;
  c.save();
  c.translate(cx, cy);
  c.rotate(t * 0.4);
  for (let i = 0; i < 16; i++) {
    c.rotate((Math.PI * 2) / 16);
    const g = c.createLinearGradient(0, 0, 0, -600);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(255,240,140,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.55)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-40, 0);
    c.lineTo(40, 0);
    c.lineTo(0, -620);
    c.closePath();
    c.fill();
  }
  c.restore();
  // white hot center
  const g2 = c.createRadialGradient(cx, cy, 10, cx, cy, 300);
  g2.addColorStop(0, 'rgba(255,255,255,0.95)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g2;
  c.beginPath();
  c.arc(cx, cy, 320, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// Big black equation text (e.g. "8 = 4 + 4")
export function drawEquation(c: Ctx, parts: string[], cx: number, cy: number, scale = 1): void {
  c.save();
  c.font = `800 ${72 * scale}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const text = parts.join(' ');
  c.fillStyle = PAL.black;
  c.fillText(text, cx, cy);
  c.restore();
}

// Chip-based equation UI (green squares appear as you play) - level 1
export function drawChipEquation(c: Ctx, x: number, y: number, chips: Array<'4' | '+' | '=' | '8' | '?'>): void {
  c.save();
  let cx = x;
  for (const chip of chips) {
    if (chip === '?' || !isNaN(Number(chip))) {
      const isQ = chip === '?';
      c.fillStyle = isQ ? 'rgba(255,255,255,0.35)' : 'rgba(150,220,90,0.85)';
      roundRect(c, cx, y, 52, 52, 10);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 2;
      c.stroke();
      if (!isQ) {
        c.fillStyle = PAL.black;
        c.font = '800 34px "Nunito", Arial, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(chip, cx + 26, y + 27);
      }
    } else {
      c.fillStyle = PAL.black;
      c.font = '800 46px "Nunito", Arial, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(chip, cx + 26, y + 26);
    }
    cx += chip === '?' || !isNaN(Number(chip)) ? 64 : 46;
  }
  c.restore();
}

// Apple counter HUD (level 2)
export function drawAppleCounter(c: Ctx, x: number, y: number, count: number, total: number): void {
  c.save();
  c.fillStyle = 'rgba(20,16,10,0.65)';
  roundRect(c, x - 8, y - 8, 24 * total + 16, 40, 14);
  c.fill();
  for (let i = 0; i < total; i++) {
    const ax = x + i * 24 + 4;
    if (i < count) {
      drawApple(c, ax, y + 12, 8, false, i);
    } else {
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.beginPath();
      c.arc(ax, y + 12, 8, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// Progress bar HUD
export function drawProgressBar(c: Ctx, x: number, y: number, w: number, h: number, pct: number): void {
  c.save();
  c.fillStyle = 'rgba(20,16,10,0.65)';
  roundRect(c, x, y, w, h, h / 2);
  c.fill();
  c.fillStyle = PAL.gold;
  roundRect(c, x + 3, y + 3, Math.max(h - 6, (w - 6) * Math.min(1, pct)), h - 6, (h - 6) / 2);
  c.fill();
  c.restore();
}

// Big yellow SPLIT button
export function drawSplitButton(c: Ctx, cx: number, cy: number, r: number, pulseT: number, label = 'SPLIT!'): void {
  c.save();
  const pulse = 1 + Math.sin(pulseT * 5) * 0.05;
  // glow
  const g = c.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.7);
  g.addColorStop(0, 'rgba(255,215,80,0.5)');
  g.addColorStop(1, 'rgba(255,215,80,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
  c.fill();
  // body
  const bg = c.createLinearGradient(cx, cy - r, cx, cy + r);
  bg.addColorStop(0, PAL.goldLight);
  bg.addColorStop(0.55, PAL.gold);
  bg.addColorStop(1, PAL.goldDark);
  c.fillStyle = bg;
  c.beginPath();
  c.arc(cx, cy, r * pulse, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(120,70,10,0.7)';
  c.lineWidth = 4;
  c.stroke();
  // label
  c.fillStyle = '#4a2c08';
  c.font = `800 ${r * 0.52}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, cx, cy + r * 0.04);
  c.restore();
}

// Text banner (alerts, hints)
export function drawBanner(c: Ctx, text: string, y: number, t: number, color = PAL.red, size = 40): void {
  c.save();
  const shake = Math.sin(t * 30) * 3;
  c.font = `800 ${size}px "Nunito", "Arial Rounded MT Bold", Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 8;
  c.strokeStyle = 'rgba(0,0,0,0.75)';
  c.strokeText(text, 288 + shake, y);
  c.fillStyle = color;
  c.fillText(text, 288 + shake, y);
  c.restore();
}

// Floating particles (sparkles/confetti)
export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number; spin: number; rot: number;
}

export function updateParticles(ps: Particle[], dt: number, gravity = 300): void {
  for (const p of ps) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += gravity * dt;
    p.rot += p.spin * dt;
    p.life -= dt;
  }
  for (let i = ps.length - 1; i >= 0; i--) {
    if (ps[i].life <= 0) ps.splice(i, 1);
  }
}

export function drawParticles(c: Ctx, ps: Particle[]): void {
  for (const p of ps) {
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    c.fillStyle = p.color;
    if (p.size > 3) {
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    } else {
      c.beginPath();
      c.arc(0, 0, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

export function spawnSparkles(ps: Particle[], x: number, y: number, n: number, color: string): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 240;
    ps.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 100,
      life: 0.7 + Math.random() * 0.6,
      maxLife: 1.2,
      color,
      size: 3 + Math.random() * 7,
      spin: (Math.random() - 0.5) * 8,
      rot: Math.random() * Math.PI,
    });
  }
}

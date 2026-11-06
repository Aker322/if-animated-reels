'use strict';
// More original scenes for the clip library (same helpers and look as clips.html).
// Motion standard: every scene has at least three things moving at once (light, air, the figure or an object),
// all on 5 s cycles so clips loop cleanly, plus a slow camera push applied to every scene at the bottom of this file.
const P5 = t => (t % 5) / 5, TW = (t, k = 1) => Math.sin(t * TAU * k / 5);
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
function road(horizon, vx, topW, botW, col) { c.fillStyle = col; c.beginPath(); c.moveTo(vx - topW / 2, horizon); c.lineTo(vx + topW / 2, horizon); c.lineTo(vx + botW / 2, H); c.lineTo(vx - botW / 2, H); c.fill(); }
function roadDashes(horizon, vx, t, col) {
  for (let k = 0; k < 14; k++) { const u = ((k / 14 + P5(t)) % 1), v = u * u, y = horizon + (H - horizon) * v, w = 2 + 10 * v, h = 4 + 40 * v; c.fillStyle = col; c.fillRect(vx - w / 2, y, w, h * 0.55); }
}
function walker(x, y, s, col, t, ph = 0) { const b = Math.abs(Math.sin(t * TAU / 1.25 / 2 + ph)) * 6 * s; figure(x + TW(t, 2) * 1.5, y - b, s, col, { wind: true, t }); }
function paperBall(x, y, r, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); disc(0, 0, r, '#E9E2D2'); c.strokeStyle = 'rgba(80,70,60,0.45)'; c.lineWidth = Math.max(1, r * 0.08);
  for (let i = 0; i < 4; i++) { const a = i * 1.7; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); c.quadraticCurveTo(0, 0, Math.cos(a + 2.2) * r * 0.7, Math.sin(a + 2.2) * r * 0.7); c.stroke(); }
  disc(-r * 0.3, -r * 0.35, r * 0.25, 'rgba(255,255,255,0.35)'); c.restore();
}
function fogBands(y0, y1, t, col, a, n = 4, seed = 5) {        // slow horizontal mist, wraps every 5 s
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * r(), w = 380 + r() * 420, sp = (r() < 0.5 ? -1 : 1) * (W + w), x = ((r() * (W + w) + P5(t) * sp) % (W + w) + (W + w)) % (W + w) - w / 2;
    const g = c.createRadialGradient(x, y, 0, x, y, w / 2); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.save(); c.scale(1, 0.22); c.fillStyle = g; c.fillRect(x - w / 2, y / 0.22 - w / 2, w, w); c.restore(); }
}
function cloudDrift(y0, y1, t, col, n, seed, size = 1) {      // soft flat clouds sliding across, wrap every 5 s
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * r(), s = (0.6 + r() * 0.8) * size, span = W + 400, x = ((r() * span + P5(t) * span * (r() < 0.5 ? 1 : 2)) % span) - 200;
    c.beginPath(); [[0, 0, 60], [55, -18, 70], [115, -4, 58], [-50, 8, 44], [170, 10, 42]].forEach(([dx, dy, rr]) => { c.moveTo(x + dx * s + rr * s, y + dy * s); c.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); }); c.fillStyle = col; c.fill(); }
}

Object.assign(SCENES, {
  startline(t) {                                         // a lone runner at the start line of an empty floodlit track
    sky([[0, '#05070F'], [0.5, '#0C1426'], [1, '#141B2E']]); stars(40, 31, t, 300);
    const hz = 430, vx = 480;
    [[90, 70], [870, 70]].forEach(([x, y], i) => {
      c.fillStyle = '#0A0D16'; c.fillRect(x - 6, y, 12, 380); c.fillRect(x - 46, y - 18, 92, 30);
      const fl = 0.86 + 0.14 * Math.sin(t * TAU * 3 + i * 2) * Math.sin(t * TAU / 2.5);
      glow(x, y, 170, '#EAF2FF', 0.55 * fl);
      c.save(); c.globalAlpha = 0.11 * fl; c.fillStyle = '#EAF2FF'; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x + 40, y); c.lineTo(i ? 300 : 660, H); c.lineTo(i ? 40 : 920, H); c.fill(); c.restore();
    });
    c.fillStyle = '#2B1512'; c.beginPath(); c.moveTo(0, hz); c.lineTo(W, hz); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = 'rgba(240,235,225,0.55)'; c.lineWidth = 3;
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(vx + k * 22, hz); c.lineTo(vx + k * 230, H); c.stroke(); }
    c.fillStyle = 'rgba(245,240,230,0.85)'; c.fillRect(0, 690, W, 10);
    c.fillStyle = '#0C1426'; c.fillRect(0, hz - 30, W, 30); c.fillStyle = '#05070F'; for (let x = 0; x < W; x += 18) c.fillRect(x, hz - 30 - (x % 54 === 0 ? 10 : 4), 10, 12);
    fogBands(hz - 10, hz + 120, t, '#C9D6F0', 0.16, 5, 3);
    dust(60, 37, t, '#DDE8FF', [0, 60, W, 640], 12);
    const breath = TW(t, 2) * 2;
    figure(480 + TW(t) * 2, 690 - 210 * 0.62 + 4 - Math.abs(breath), 0.62, '#030408', { wind: true, t });
  },
  calendar(t) {                                          // years tearing off a wall calendar, one after another
    sky([[0, '#14100D'], [1, '#221A14']]);
    const lamp = 0.9 + 0.1 * Math.sin(t * TAU * 2) * Math.sin(t * TAU / 1.25); glow(150, 140, 440, '#FFCE8A', 0.24 * lamp);
    const years = ['2022', '2023', '2024', '2025'], k = Math.floor(P5(t) * 4), u = (P5(t) * 4) % 1;
    const cx = 480, cy = 225, w = 300, h = 330, sway = TW(t, 2) * 0.025;
    const page = (yr, x, y, rot, a) => {
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-w / 2 + 10, 14, w, h);
      c.fillStyle = '#EFE8DA'; c.fillRect(-w / 2, 0, w, h); c.fillStyle = '#8E2B22'; c.fillRect(-w / 2, 0, w, 110);
      c.fillStyle = '#F6EFE3'; c.font = '700 78px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(yr, 0, 58);
      c.fillStyle = 'rgba(60,50,40,0.35)'; for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) c.fillRect(-w / 2 + 30 + q * 44, 150 + r * 52, 26, 26);
      c.restore();
    };
    const top = cy - h / 2;
    c.fillStyle = '#3A2A1E'; disc(cx, top - 30, 6, '#3A2A1E');
    page(years[(k + 1) % 4], cx, top, sway, 1);
    const f = smooth(Math.min(1, u * 1.4));
    page(years[k], cx - 140 * f + Math.sin(f * 9) * 18 * f, top + 560 * f * f, sway - 0.8 * f + Math.sin(f * 7) * 0.15 * f, 1 - smooth((f - 0.75) / 0.25));
    dust(36, 41, t, '#FFE2B8', [0, 0, W, H], 9);
  },
  aheadroad(t) {                                         // a long dusk road, other people already far ahead
    sky([[0, '#1A1238'], [0.4, '#5A2E6E'], [0.52, '#E07A5F'], [0.53, '#140E22']]);
    cloudDrift(70, 300, t, 'rgba(40,24,70,0.55)', 5, 7, 1.1);
    const hz = 430, vx = 480; glow(vx, hz, 270 + 10 * TW(t), '#F2A86E', 0.35);
    c.fillStyle = '#140E22'; c.fillRect(0, hz, W, H - hz);
    grassLine(hz, x => hz + 2 + (Math.abs(x - vx) < 30 ? 99 : 0), t, '#0C0816', 90, 14);
    road(hz, vx, 16, 900, '#2A2240'); roadDashes(hz, vx, t, 'rgba(240,220,170,0.55)');
    [[476, hz + 70, 0.16, 0], [506, hz + 52, 0.13, 1], [455, hz + 40, 0.11, 2], [490, hz + 28, 0.09, 3]].forEach(([x, y, s, i]) => walker(x, y - 210 * s, s, '#07040F', t, i));
    fogBands(hz - 20, hz + 60, t, '#F2A86E', 0.10, 3, 9);
    figure(300 + TW(t) * 2, 780 - 210 * 0.62, 0.62, '#05030B', { wind: true, t });
  },
  stairs(t) {                                            // climbing a dark stairwell toward one lit window, step after step
    sky([[0, '#0B0E14'], [1, '#161B24']]);
    const fl = 0.9 + 0.1 * Math.sin(t * TAU * 1.6) * Math.sin(t * TAU / 2.5);
    glow(800, 120, 320, '#FFD9A0', 0.36 * fl); c.fillStyle = '#FFE3B5'; c.fillRect(760, 70, 90, 120); c.fillStyle = '#0B0E14'; c.fillRect(802, 70, 6, 120); c.fillRect(760, 128, 90, 5);
    c.save(); c.globalAlpha = 0.08 * fl; c.fillStyle = '#FFE3B5'; c.beginPath(); c.moveTo(760, 190); c.lineTo(850, 190); c.lineTo(520, 820); c.lineTo(160, 820); c.fill(); c.restore();
    const sw = 110, sh = 62, off = P5(t * 4);
    c.fillStyle = '#232A36'; c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 3;
    for (let i = -3; i < 12; i++) { const x = -60 + (i - off) * sw, y = 820 - (i - off) * sh; c.fillRect(x, y, sw + 2, H); c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y); c.stroke(); }
    dust(40, 61, t, '#FFE8C8', [200, 150, 600, 600], 7);
    const fx = 420, s = (fx + 60) / sw + off, j = Math.floor(s), fr = s - j, yj = 820 - (j - off) * sh;
    const step = smooth((fr - 0.55) / 0.45), feet = yj - sh * step - 16 * Math.sin(Math.PI * step);
    figure(fx, feet - 210 * 0.7 + 2, 0.7, '#05070B', { wind: true, t });
  },
  backstage(t) {                                         // behind the curtain: the part nobody sees
    sky([[0, '#080506'], [1, '#120A0B']]);
    const gap = 150 + 18 * TW(t), pulse = 0.85 + 0.15 * TW(t, 2); glow(480, 420, 400, '#FFE7C2', 0.5 * pulse);
    c.fillStyle = '#FFF1DA'; c.fillRect(480 - gap / 2, 0, gap, H);
    dust(50, 43, t, '#FFFFFF', [480 - gap / 2 - 20, 0, gap + 40, H], 12);
    const curtain = (x0, x1, dir) => { for (let i = 0; i < 9; i++) { const x = x0 + (x1 - x0) * i / 9, w = (x1 - x0) / 9, sw = Math.sin(t * TAU / 5 * 2 + i * 0.8) * 7 * dir; const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3A0A0E'); g.addColorStop(0.5, '#7A1820'); g.addColorStop(1, '#2A0609'); c.fillStyle = g; c.fillRect(x + sw, 0, w + 2, H); } };
    curtain(0, 480 - gap / 2, 1); curtain(480 + gap / 2, W, -1);
    c.fillStyle = '#0A0607'; c.fillRect(0, 740, W, 80);
    figure(480 + TW(t) * 2, 745 - 210 * 0.95, 0.95, '#050304', { wind: true, t });
  },
  crumpled(t) {                                          // the hundred attempts: paper balls piling up under a swinging desk lamp
    sky([[0, '#0D0B0A'], [1, '#1A1512']]);
    const a = TW(t, 2) * 0.07;
    c.save(); c.translate(300, 0); c.rotate(a);
    glow(0, 160, 420, '#FFD08A', 0.3);
    c.fillStyle = '#1A1210'; c.fillRect(-4, 0, 8, 62); c.beginPath(); c.moveTo(-60, 60); c.lineTo(60, 60); c.lineTo(30, 120); c.lineTo(-30, 120); c.fill();
    c.globalAlpha = 0.25; c.fillStyle = '#FFD9A0'; c.beginPath(); c.moveTo(-30, 120); c.lineTo(30, 120); c.lineTo(400, 760); c.lineTo(-400, 760); c.fill();
    c.restore();
    c.fillStyle = '#2C211A'; c.fillRect(0, 700, W, 120);
    c.fillStyle = '#3B3A3E'; c.beginPath(); c.moveTo(600, 520); c.lineTo(760, 520); c.lineTo(740, 710); c.lineTo(620, 710); c.fill();
    const r = rng(47); for (let i = 0; i < 26; i++) { const x = 560 + r() * 260, y = 690 - r() * 40 - (x > 610 && x < 750 ? r() * 200 : 0); paperBall(x, Math.min(y, 690), 18 + r() * 12, r() * 6 + Math.sin(t * TAU / 2.5 + i) * 0.04); }
    for (let i = 0; i < 14; i++) paperBall(80 + r() * 460, 690 - r() * 18, 16 + r() * 10, r() * 6);
    dust(30, 67, t, '#FFE2B8', [0, 100, 700, 600], 8);
    const u = (P5(t) * 4) % 1, x = 120 + 520 * u, land = 640, y = u < 0.8 ? 300 - 380 * (u / 0.8) + 720 * (u / 0.8) ** 2 : land - 40 * Math.sin(Math.PI * (u - 0.8) / 0.2);
    paperBall(x, Math.min(y, 690), 22, u * 11);
  },
  spotlight(t) {                                         // a small figure alone on a stage, one spotlight, empty seats
    sky([[0, '#040406'], [1, '#0B0A10']]);
    const fl = 0.9 + 0.1 * Math.sin(t * TAU * 1.4) * Math.sin(t * TAU / 2.5), sx = TW(t) * 22;
    c.save(); c.globalAlpha = 0.22 * fl; c.fillStyle = '#FFF0D2'; c.beginPath(); c.moveTo(440, 0); c.lineTo(520, 0); c.lineTo(640 + sx, 560); c.lineTo(320 + sx, 560); c.fill(); c.restore();
    c.fillStyle = '#1C140F'; c.fillRect(0, 520, W, 120);
    c.save(); c.globalAlpha = 0.5 * fl; c.fillStyle = '#FFE8C0'; c.beginPath(); c.ellipse(480 + sx, 560, 170, 34, 0, 0, TAU); c.fill(); c.restore();
    dust(55, 53, t, '#FFF6E0', [330 + sx, 0, 300, 560], 10);
    figure(480 + TW(t) * 2, 560 - 210 * 0.62 - Math.abs(TW(t, 2)) * 2, 0.62, '#050406', { wind: true, t });
    c.fillStyle = '#060508'; for (let row = 0; row < 3; row++) for (let i = -1; i < 14; i++) { const x = i * 76 + (row % 2) * 38, y = 680 + row * 52; c.beginPath(); c.roundRect(x, y, 64, 80, [22, 22, 0, 0]); c.fill(); }
  },
  sunriseroad(t) {                                       // the same road at sunrise, walking it anyway
    sky([[0, '#3E5A8A'], [0.35, '#E9A27A'], [0.52, '#FFD9A0'], [0.53, '#2A2030']]);
    cloudDrift(80, 300, t, 'rgba(255,214,180,0.5)', 5, 13, 1.0);
    const hz = 430, vx = 480; glow(vx, hz, 300 + 14 * TW(t), '#FFE6B0', 0.6); disc(vx, hz, 70, '#FFF1CF');
    c.fillStyle = '#2A2030'; c.fillRect(0, hz, W, H - hz);
    grassLine(hz, x => hz + 2 + (Math.abs(x - vx) < 30 ? 99 : 0), t, '#1E1624', 90, 14);
    road(hz, vx, 16, 900, '#4A3A4E'); roadDashes(hz, vx, t, 'rgba(255,235,190,0.7)');
    c.strokeStyle = '#1E1624'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const bx = (P5(t) * 1100 + i * 140) % 1100 - 80, by = 210 + i * 26, f = Math.sin(t * TAU * 2 + i) * 6; c.beginPath(); c.moveTo(bx - 12, by - f); c.quadraticCurveTo(bx - 5, by - 5, bx, by); c.quadraticCurveTo(bx + 5, by - 5, bx + 12, by - f); c.stroke(); }
    fogBands(hz - 10, hz + 70, t, '#FFE6B0', 0.12, 3, 21);
    walker(480, 640 - 210 * 0.42, 0.42, '#120C16', t);
  },
});

// slow camera push on every scene in the library (about 5% over each 5 s loop): the main source of "smooth"
for (const name of Object.keys(SCENES)) {
  const draw = SCENES[name];
  SCENES[name] = t => { const z = 1 + 0.05 * smooth(P5(t) * 1.05); c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); draw(t); c.restore(); };
}
window.NAMES = Object.keys(SCENES);

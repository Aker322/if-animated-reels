'use strict';
// More original scenes for the clip library (same helpers and look as clips.html). Loops are built on 5 s cycles.
const P5 = t => (t % 5) / 5, TW = t => Math.sin(t * TAU / 5);
function road(horizon, vx, topW, botW, col) { c.fillStyle = col; c.beginPath(); c.moveTo(vx - topW / 2, horizon); c.lineTo(vx + topW / 2, horizon); c.lineTo(vx + botW / 2, H); c.lineTo(vx - botW / 2, H); c.fill(); }
function roadDashes(horizon, vx, t, col) {
  for (let k = 0; k < 14; k++) { const u = ((k / 14 + P5(t) * 0.5) % 1), v = u * u, y = horizon + (H - horizon) * v, w = 2 + 10 * v, h = 4 + 40 * v; c.fillStyle = col; c.fillRect(vx - w / 2, y, w, h * 0.55); }
}
function walker(x, y, s, col, t, ph = 0) { const b = Math.abs(Math.sin(t * 2.5 * Math.PI + ph)) * 6 * s; figure(x, y - b, s, col, {}); }
function paperBall(x, y, r, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); disc(0, 0, r, '#E9E2D2'); c.strokeStyle = 'rgba(80,70,60,0.45)'; c.lineWidth = Math.max(1, r * 0.08);
  for (let i = 0; i < 4; i++) { const a = i * 1.7; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); c.quadraticCurveTo(0, 0, Math.cos(a + 2.2) * r * 0.7, Math.sin(a + 2.2) * r * 0.7); c.stroke(); }
  disc(-r * 0.3, -r * 0.35, r * 0.25, 'rgba(255,255,255,0.35)'); c.restore();
}

Object.assign(SCENES, {
  startline(t) {                                         // a lone runner at the start line of an empty floodlit track
    sky([[0, '#05070F'], [0.5, '#0C1426'], [1, '#141B2E']]); stars(40, 31, t, 300);
    const hz = 430, vx = 480;
    [[90, 70], [870, 70]].forEach(([x, y], i) => {
      c.fillStyle = '#0A0D16'; c.fillRect(x - 6, y, 12, 380); c.fillRect(x - 46, y - 18, 92, 30);
      const fl = 0.85 + 0.15 * Math.sin(t * 9 + i * 2) * Math.sin(t * 3.1);
      glow(x, y, 160, '#EAF2FF', 0.55 * fl);
      c.save(); c.globalAlpha = 0.10 * fl; c.fillStyle = '#EAF2FF'; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x + 40, y); c.lineTo(i ? 300 : 660, H); c.lineTo(i ? 40 : 920, H); c.fill(); c.restore();
    });
    c.fillStyle = '#2B1512'; c.beginPath(); c.moveTo(0, hz); c.lineTo(W, hz); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = 'rgba(240,235,225,0.55)'; c.lineWidth = 3;
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(vx + k * 22, hz); c.lineTo(vx + k * 230, H); c.stroke(); }
    c.fillStyle = 'rgba(245,240,230,0.85)'; c.fillRect(0, 690, W, 10);
    c.fillStyle = '#0C1426'; c.fillRect(0, hz - 30, W, 30); c.fillStyle = '#05070F'; for (let x = 0; x < W; x += 18) c.fillRect(x, hz - 30 - (x % 54 === 0 ? 10 : 4), 10, 12);
    dust(50, 37, t, '#DDE8FF', [0, 60, W, 640], 10);
    figure(480, 690 - 210 * 0.62 + 4, 0.62, '#030408', {});
  },
  calendar(t) {                                          // years tearing off a wall calendar, one after another
    sky([[0, '#14100D'], [1, '#221A14']]); glow(150, 140, 420, '#FFCE8A', 0.22);
    const years = ['2022', '2023', '2024', '2025'], k = Math.floor(P5(t) * 4), u = (P5(t) * 4) % 1;
    const cx = 480, cy = 225, w = 300, h = 330;
    const page = (yr, x, y, rot, a) => {
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
      c.fillStyle = '#EFE8DA'; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#8E2B22'; c.fillRect(-w / 2, -h / 2, w, 110);
      c.fillStyle = '#F6EFE3'; c.font = '700 78px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(yr, 0, -h / 2 + 58);
      c.fillStyle = 'rgba(60,50,40,0.35)'; for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) c.fillRect(-w / 2 + 30 + q * 44, -h / 2 + 150 + r * 52, 26, 26);
      c.restore();
    };
    c.fillStyle = '#3A2A1E'; c.fillRect(cx - 8, cy - h / 2 - 40, 16, 40);
    page(years[(k + 1) % 4], cx, cy, 0, 1);
    const fall = Math.min(1, u * 1.6), ease = fall * fall;
    page(years[k], cx - 120 * ease, cy + 520 * ease, -0.9 * ease, 1 - Math.max(0, fall - 0.7) / 0.3);
    dust(30, 41, t, '#FFE2B8', [0, 0, W, H], 8);
  },
  aheadroad(t) {                                         // a long dusk road, other people already far ahead
    sky([[0, '#1A1238'], [0.4, '#5A2E6E'], [0.52, '#E07A5F'], [0.53, '#140E22']]);
    const hz = 430, vx = 480; glow(vx, hz, 260, '#F2A86E', 0.35);
    c.fillStyle = '#140E22'; c.fillRect(0, hz, W, H - hz);
    road(hz, vx, 16, 900, '#2A2240'); roadDashes(hz, vx, t, 'rgba(240,220,170,0.55)');
    [[476, hz + 70, 0.16, 0], [506, hz + 52, 0.13, 1], [455, hz + 40, 0.11, 2], [490, hz + 28, 0.09, 3]].forEach(([x, y, s, i]) => walker(x, y - 210 * s, s, '#07040F', t, i));
    figure(300, 780 - 210 * 0.62, 0.62, '#05030B', {});
  },
  stairs(t) {                                            // climbing a dark stairwell toward one lit window, step after step
    sky([[0, '#0B0E14'], [1, '#161B24']]);
    glow(800, 120, 300, '#FFD9A0', 0.35); c.fillStyle = '#FFE3B5'; c.fillRect(760, 70, 90, 120); c.fillStyle = '#0B0E14'; c.fillRect(802, 70, 6, 120); c.fillRect(760, 128, 90, 5);
    const sw = 110, sh = 62, off = P5(t * 4) ;
    c.fillStyle = '#232A36'; c.strokeStyle = 'rgba(255,220,170,0.25)'; c.lineWidth = 3;
    for (let i = -3; i < 12; i++) { const x = -60 + (i - off) * sw, y = 820 - (i - off) * sh; c.fillRect(x, y, sw + 2, H); c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y); c.stroke(); }
    const fx = 400, i0 = Math.floor((fx + 60) / sw + off), feet = 820 - (i0 - off) * sh;
    figure(fx + 20, feet - 210 * 0.7 + 2, 0.7, '#05070B', {});
  },
  backstage(t) {                                         // behind the curtain: the part nobody sees
    sky([[0, '#080506'], [1, '#120A0B']]);
    const gap = 150 + 14 * TW(t); glow(480, 420, 380, '#FFE7C2', 0.5);
    c.fillStyle = '#FFF1DA'; c.fillRect(480 - gap / 2, 0, gap, H);
    dust(40, 43, t, '#FFFFFF', [480 - gap / 2, 0, gap, H], 10);
    const curtain = (x0, x1, dir) => { for (let i = 0; i < 9; i++) { const x = x0 + (x1 - x0) * i / 9, w = (x1 - x0) / 9, sw = Math.sin(t * TAU / 5 + i) * 4 * dir; const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3A0A0E'); g.addColorStop(0.5, '#7A1820'); g.addColorStop(1, '#2A0609'); c.fillStyle = g; c.fillRect(x + sw, 0, w + 2, H); } };
    curtain(0, 480 - gap / 2, 1); curtain(480 + gap / 2, W, -1);
    c.fillStyle = '#0A0607'; c.fillRect(0, 740, W, 80);
    figure(480, 745 - 210 * 0.95, 0.95, '#050304', {});
  },
  crumpled(t) {                                          // the hundred attempts: paper balls piling up under a desk lamp
    sky([[0, '#0D0B0A'], [1, '#1A1512']]); glow(300, 160, 420, '#FFD08A', 0.3);
    c.fillStyle = '#1A1210'; c.beginPath(); c.moveTo(240, 60); c.lineTo(360, 60); c.lineTo(330, 120); c.lineTo(270, 120); c.fill(); c.fillRect(296, 0, 8, 62);
    c.save(); c.globalAlpha = 0.25; c.fillStyle = '#FFD9A0'; c.beginPath(); c.moveTo(270, 120); c.lineTo(330, 120); c.lineTo(700, 760); c.lineTo(-100, 760); c.fill(); c.restore();
    c.fillStyle = '#2C211A'; c.fillRect(0, 700, W, 120);
    c.fillStyle = '#3B3A3E'; c.beginPath(); c.moveTo(600, 520); c.lineTo(760, 520); c.lineTo(740, 710); c.lineTo(620, 710); c.fill();
    const r = rng(47); for (let i = 0; i < 26; i++) { const x = 560 + r() * 260, y = 690 - r() * 40 - (x > 610 && x < 750 ? r() * 200 : 0); paperBall(x, Math.min(y, 690), 18 + r() * 12, r() * 6); }
    for (let i = 0; i < 14; i++) paperBall(80 + r() * 460, 690 - r() * 18, 16 + r() * 10, r() * 6);
    const u = (P5(t) * 4) % 1, x = 120 + 560 * u, y = 300 - 380 * u + 560 * u * u; if (u < 0.92) paperBall(x, y, 22, u * 9);
  },
  spotlight(t) {                                         // a small figure alone on a stage, one spotlight, empty seats
    sky([[0, '#040406'], [1, '#0B0A10']]);
    const fl = 0.9 + 0.1 * Math.sin(t * 7) * Math.sin(t * 2.3);
    c.save(); c.globalAlpha = 0.22 * fl; c.fillStyle = '#FFF0D2'; c.beginPath(); c.moveTo(440, 0); c.lineTo(520, 0); c.lineTo(640, 560); c.lineTo(320, 560); c.fill(); c.restore();
    c.fillStyle = '#1C140F'; c.fillRect(0, 520, W, 120);
    c.save(); c.globalAlpha = 0.5 * fl; c.fillStyle = '#FFE8C0'; c.beginPath(); c.ellipse(480, 560, 170, 34, 0, 0, TAU); c.fill(); c.restore();
    dust(45, 53, t, '#FFF6E0', [330, 0, 300, 560], 9);
    figure(480, 560 - 210 * 0.62, 0.62, '#050406', {});
    c.fillStyle = '#060508'; for (let row = 0; row < 3; row++) for (let i = -1; i < 14; i++) { const x = i * 76 + (row % 2) * 38, y = 680 + row * 52; c.beginPath(); c.roundRect(x, y, 64, 80, [22, 22, 0, 0]); c.fill(); }
  },
  sunriseroad(t) {                                       // the same road at sunrise, walking it anyway
    sky([[0, '#3E5A8A'], [0.35, '#E9A27A'], [0.52, '#FFD9A0'], [0.53, '#2A2030']]);
    const hz = 430, vx = 480; glow(vx, hz, 300, '#FFE6B0', 0.6); disc(vx, hz, 70, '#FFF1CF');
    c.fillStyle = '#2A2030'; c.fillRect(0, hz, W, H - hz);
    road(hz, vx, 16, 900, '#4A3A4E'); roadDashes(hz, vx, t, 'rgba(255,235,190,0.7)');
    c.strokeStyle = '#1E1624'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const bx = ((t * 30 + i * 140) % 1100) - 80, by = 210 + i * 26, f = Math.sin(t * 9 + i) * 6; c.beginPath(); c.moveTo(bx - 12, by - f); c.quadraticCurveTo(bx - 5, by - 5, bx, by); c.quadraticCurveTo(bx + 5, by - 5, bx + 12, by - f); c.stroke(); }
    walker(480, 640 - 210 * 0.42, 0.42, '#120C16', t);
  },
});
window.NAMES = Object.keys(SCENES);

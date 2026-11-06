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
    sky([[0, '#040B2A'], [0.5, '#0A1E5C'], [1, '#13308A']]); stars(40, 31, t, 300);
    const hz = 430, vx = 480;
    [[90, 70], [870, 70]].forEach(([x, y], i) => {
      c.fillStyle = '#0A0D16'; c.fillRect(x - 6, y, 12, 380); c.fillRect(x - 46, y - 18, 92, 30);
      const fl = 0.86 + 0.14 * Math.sin(t * TAU * 3 + i * 2) * Math.sin(t * TAU / 2.5);
      glow(x, y, 170, '#EAF2FF', 0.55 * fl);
      c.save(); c.globalAlpha = 0.11 * fl; c.fillStyle = '#EAF2FF'; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x + 40, y); c.lineTo(i ? 300 : 660, H); c.lineTo(i ? 40 : 920, H); c.fill(); c.restore();
    });
    c.fillStyle = vgrad(hz, H, [[0, '#7A1E10'], [1, '#C2411F']]); c.beginPath(); c.moveTo(0, hz); c.lineTo(W, hz); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.strokeStyle = 'rgba(240,235,225,0.55)'; c.lineWidth = 3;
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(vx + k * 22, hz); c.lineTo(vx + k * 230, H); c.stroke(); }
    c.fillStyle = 'rgba(245,240,230,0.85)'; c.fillRect(0, 690, W, 10);
    c.fillStyle = '#0A1A4A'; c.fillRect(0, hz - 30, W, 30); c.fillStyle = '#040B2A'; for (let x = 0; x < W; x += 18) c.fillRect(x, hz - 30 - (x % 54 === 0 ? 10 : 4), 10, 12);
    fogBands(hz - 10, hz + 120, t, '#C9D6F0', 0.16, 5, 3);
    dust(60, 37, t, '#DDE8FF', [0, 60, W, 640], 12);
    const breath = TW(t, 2) * 2;
    figure(480 + TW(t) * 2, 690 - 210 * 0.62 + 4 - Math.abs(breath), 0.62, '#06040A', { wind: true, t });
  },
  calendar(t) {                                          // years tearing off a wall calendar, one after another
    sky([[0, '#0A3038'], [1, '#062026']]);
    const lamp = 0.9 + 0.1 * Math.sin(t * TAU * 2) * Math.sin(t * TAU / 1.25); glow(150, 140, 460, '#FFB347', 0.32 * lamp);
    const years = ['2022', '2023', '2024', '2025'], k = Math.floor(P5(t) * 4), u = (P5(t) * 4) % 1;
    const cx = 480, cy = 225, w = 300, h = 330, sway = TW(t, 2) * 0.025;
    const page = (yr, x, y, rot, a) => {
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-w / 2 + 10, 14, w, h);
      c.fillStyle = '#EFE8DA'; c.fillRect(-w / 2, 0, w, h); c.fillStyle = '#D23A2A'; c.fillRect(-w / 2, 0, w, 110);
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
    sky([[0, '#1C0B4A'], [0.38, '#9A2A8A'], [0.52, '#FF7A3D'], [0.53, '#160A30']]);
    cloudDrift(70, 300, t, 'rgba(60,14,90,0.6)', 5, 7, 1.1);
    const hz = 430, vx = 480; glow(vx, hz, 280 + 10 * TW(t), '#FFB15E', 0.5);
    c.fillStyle = '#160A30'; c.fillRect(0, hz, W, H - hz);
    grassLine(hz, x => hz + 2 + (Math.abs(x - vx) < 30 ? 99 : 0), t, '#0C0816', 90, 14);
    road(hz, vx, 16, 900, '#2E1E62'); roadDashes(hz, vx, t, 'rgba(255,214,140,0.75)');
    [[476, hz + 70, 0.16, 0], [506, hz + 52, 0.13, 1], [455, hz + 40, 0.11, 2], [490, hz + 28, 0.09, 3]].forEach(([x, y, s, i]) => walker(x, y - 210 * s, s, '#07040F', t, i));
    fogBands(hz - 20, hz + 60, t, '#F2A86E', 0.10, 3, 9);
    figure(300 + TW(t) * 2, 780 - 210 * 0.62, 0.62, '#05030B', { wind: true, t });
  },
  stairs(t) {                                            // climbing a dark stairwell toward one lit window, step after step
    sky([[0, '#06202C'], [1, '#0C3442']]);
    const fl = 0.9 + 0.1 * Math.sin(t * TAU * 1.6) * Math.sin(t * TAU / 2.5);
    glow(800, 120, 340, '#FFC24A', 0.5 * fl); c.fillStyle = '#FFD670'; c.fillRect(760, 70, 90, 120); c.fillStyle = '#06202C'; c.fillRect(802, 70, 6, 120); c.fillRect(760, 128, 90, 5);
    c.save(); c.globalAlpha = 0.12 * fl; c.fillStyle = '#FFD670'; c.beginPath(); c.moveTo(760, 190); c.lineTo(850, 190); c.lineTo(520, 820); c.lineTo(160, 820); c.fill(); c.restore();
    const sw = 110, sh = 62, off = P5(t * 4);
    c.fillStyle = '#123E50'; c.strokeStyle = 'rgba(255,214,112,0.45)'; c.lineWidth = 3;
    for (let i = -3; i < 12; i++) { const x = -60 + (i - off) * sw, y = 820 - (i - off) * sh; c.fillRect(x, y, sw + 2, H); c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y); c.stroke(); }
    dust(40, 61, t, '#FFE8C8', [200, 150, 600, 600], 7);
    const fx = 420, s = (fx + 60) / sw + off, j = Math.floor(s), fr = s - j, yj = 820 - (j - off) * sh;
    const step = smooth((fr - 0.55) / 0.45), feet = yj - sh * step - 16 * Math.sin(Math.PI * step);
    figure(fx, feet - 210 * 0.7 + 2, 0.7, '#05070B', { wind: true, t });
  },
  backstage(t) {                                         // behind the curtain: the part nobody sees
    sky([[0, '#080506'], [1, '#120A0B']]);
    const gap = 150 + 18 * TW(t), pulse = 0.85 + 0.15 * TW(t, 2); glow(480, 420, 420, '#7FE6FF', 0.5 * pulse);
    c.fillStyle = '#D8FAFF'; c.fillRect(480 - gap / 2, 0, gap, H);
    dust(50, 43, t, '#FFFFFF', [480 - gap / 2 - 20, 0, gap + 40, H], 12);
    const curtain = (x0, x1, dir) => { for (let i = 0; i < 9; i++) { const x = x0 + (x1 - x0) * i / 9, w = (x1 - x0) / 9, sw = Math.sin(t * TAU / 5 * 2 + i * 0.8) * 7 * dir; const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#4A0610'); g.addColorStop(0.5, '#B0182A'); g.addColorStop(1, '#36040C'); c.fillStyle = g; c.fillRect(x + sw, 0, w + 2, H); } };
    curtain(0, 480 - gap / 2, 1); curtain(480 + gap / 2, W, -1);
    c.fillStyle = '#0A0607'; c.fillRect(0, 740, W, 80);
    figure(480 + TW(t) * 2, 745 - 210 * 0.95, 0.95, '#050304', { wind: true, t });
  },
  crumpled(t) {                                          // the hundred attempts: paper balls piling up under a swinging desk lamp
    sky([[0, '#06231C'], [1, '#0B3328']]);
    const a = TW(t, 2) * 0.07;
    c.save(); c.translate(300, 0); c.rotate(a);
    glow(0, 160, 440, '#FFB347', 0.42);
    c.fillStyle = '#1A1210'; c.fillRect(-4, 0, 8, 62); c.beginPath(); c.moveTo(-60, 60); c.lineTo(60, 60); c.lineTo(30, 120); c.lineTo(-30, 120); c.fill();
    c.globalAlpha = 0.3; c.fillStyle = '#FFC266'; c.beginPath(); c.moveTo(-30, 120); c.lineTo(30, 120); c.lineTo(400, 760); c.lineTo(-400, 760); c.fill();
    c.restore();
    c.fillStyle = '#3A2414'; c.fillRect(0, 700, W, 120);
    c.fillStyle = '#123A30'; c.beginPath(); c.moveTo(600, 520); c.lineTo(760, 520); c.lineTo(740, 710); c.lineTo(620, 710); c.fill();
    const r = rng(47); for (let i = 0; i < 26; i++) { const x = 560 + r() * 260, y = 690 - r() * 40 - (x > 610 && x < 750 ? r() * 200 : 0); paperBall(x, Math.min(y, 690), 18 + r() * 12, r() * 6 + Math.sin(t * TAU / 2.5 + i) * 0.04); }
    for (let i = 0; i < 14; i++) paperBall(80 + r() * 460, 690 - r() * 18, 16 + r() * 10, r() * 6);
    dust(30, 67, t, '#FFE2B8', [0, 100, 700, 600], 8);
    const u = (P5(t) * 4) % 1, x = 120 + 520 * u, land = 640, y = u < 0.8 ? 300 - 380 * (u / 0.8) + 720 * (u / 0.8) ** 2 : land - 40 * Math.sin(Math.PI * (u - 0.8) / 0.2);
    paperBall(x, Math.min(y, 690), 22, u * 11);
  },
  spotlight(t) {                                         // a small figure alone on a stage, one spotlight, empty seats
    sky([[0, '#120628'], [1, '#22104A']]);
    const fl = 0.9 + 0.1 * Math.sin(t * TAU * 1.4) * Math.sin(t * TAU / 2.5), sx = TW(t) * 22;
    c.save(); c.globalAlpha = 0.3 * fl; c.fillStyle = '#FFD36B'; c.beginPath(); c.moveTo(440, 0); c.lineTo(520, 0); c.lineTo(640 + sx, 560); c.lineTo(320 + sx, 560); c.fill(); c.restore();
    c.fillStyle = '#3A0E2A'; c.fillRect(0, 520, W, 120);
    c.save(); c.globalAlpha = 0.6 * fl; c.fillStyle = '#FFD36B'; c.beginPath(); c.ellipse(480 + sx, 560, 170, 34, 0, 0, TAU); c.fill(); c.restore();
    dust(55, 53, t, '#FFF6E0', [330 + sx, 0, 300, 560], 10);
    figure(480 + TW(t) * 2, 560 - 210 * 0.62 - Math.abs(TW(t, 2)) * 2, 0.62, '#050406', { wind: true, t });
    c.fillStyle = '#0C0420'; for (let row = 0; row < 3; row++) for (let i = -1; i < 14; i++) { const x = i * 76 + (row % 2) * 38, y = 680 + row * 52; c.beginPath(); c.roundRect(x, y, 64, 80, [22, 22, 0, 0]); c.fill(); }
  },
  sunriseroad(t) {                                       // the same road at sunrise, walking it anyway
    sky([[0, '#2A4FC4'], [0.42, '#FF7A4A'], [0.65, '#FFC85A'], [0.66, '#341E5A']]);
    cloudDrift(80, 300, t, 'rgba(255,214,180,0.5)', 5, 13, 1.0);
    const hz = 540, vx = 480; glow(vx, hz, 300 + 14 * TW(t), '#FFE6B0', 0.6); disc(vx, hz, 70, '#FFF1CF');
    c.fillStyle = '#341E5A'; c.fillRect(0, hz, W, H - hz);
    grassLine(hz, x => hz + 2 + (Math.abs(x - vx) < 30 ? 99 : 0), t, '#22123E', 90, 14);
    road(hz, vx, 16, 900, '#4E2E7A'); roadDashes(hz, vx, t, 'rgba(255,235,190,0.7)');
    c.strokeStyle = '#1E1624'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const bx = (P5(t) * 1100 + i * 140) % 1100 - 80, by = 210 + i * 26, f = Math.sin(t * TAU * 2 + i) * 6; c.beginPath(); c.moveTo(bx - 12, by - f); c.quadraticCurveTo(bx - 5, by - 5, bx, by); c.quadraticCurveTo(bx + 5, by - 5, bx + 12, by - f); c.stroke(); }
    fogBands(hz - 10, hz + 70, t, '#FFE6B0', 0.12, 3, 21);
    walker(480, 700 - 210 * 0.36, 0.36, '#120C16', t);
  },
});


Object.assign(SCENES, {
  voicememos(t) {                                        // a guitar by the bed, a phone full of rough voice memos, pink LED glow
    sky([[0, '#100C3A'], [1, '#1C1660']]);
    const led = 0.8 + 0.2 * TW(t, 2); c.fillStyle = rgba('#FF4FA3', 0.9 * led); c.fillRect(0, 40, W, 8); glow(480, 44, 520, '#FF4FA3', 0.32 * led);
    c.fillStyle = '#251C6A'; c.fillRect(0, 560, W, 260); c.fillStyle = '#2E2580'; c.beginPath(); c.roundRect(-40, 520, 640, 120, 30); c.fill();
    c.save(); c.translate(760, 470); c.rotate(-0.12 + TW(t) * 0.01);
    c.fillStyle = '#0A0820'; c.fillRect(-12, -360, 24, 300); c.fillRect(-26, -400, 52, 50);
    c.beginPath(); c.ellipse(0, 40, 120, 140, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -80, 90, 95, 0, 0, TAU); c.fill();
    disc(0, 0, 30, '#FF4FA3'); disc(0, 0, 24, '#0A0820'); c.restore();
    c.save(); c.translate(330, 560); c.rotate(-0.06);
    glow(0, -30, 260, '#5FE3FF', 0.35); c.fillStyle = '#05040F'; c.beginPath(); c.roundRect(-110, -220, 220, 400, 26); c.fill();
    c.fillStyle = '#0E1A3A'; c.beginPath(); c.roundRect(-98, -206, 196, 372, 18); c.fill();
    for (let i = 0; i < 6; i++) { const y = -180 + i * 58, live = i === 1; c.fillStyle = live ? 'rgba(95,227,255,0.25)' : 'rgba(255,255,255,0.06)'; c.beginPath(); c.roundRect(-86, y, 172, 48, 10); c.fill();
      for (let b = 0; b < 18; b++) { const hh = 4 + 14 * Math.abs(Math.sin(b * 1.3 + i * 2 + (live ? t * TAU * 2 : 0))); c.fillStyle = live ? '#5FE3FF' : 'rgba(200,220,255,0.45)'; c.fillRect(-74 + b * 8.5, y + 24 - hh / 2, 4, hh); } }
    c.restore();
    dust(30, 71, t, '#FFB3DA', [0, 60, W, 500], 7);
  },
  alarm(t) {                                             // 5:30 alarm glowing in a blue pre-dawn room, someone sitting up on the edge of the bed
    sky([[0, '#06123A'], [1, '#0C1E5A']]);
    c.fillStyle = vgrad(90, 380, [[0, '#0A2A7A'], [0.8, '#2A4FC4'], [1, '#FF8A3D']]); c.fillRect(560, 90, 300, 290);
    c.fillStyle = '#06123A'; c.fillRect(700, 90, 12, 290); c.fillRect(560, 228, 300, 10); c.strokeStyle = '#06123A'; c.lineWidth = 16; c.strokeRect(560, 90, 300, 290);
    glow(710, 380, 300, '#FF8A3D', 0.18 + 0.05 * TW(t));
    c.fillStyle = '#1A2C6E'; c.beginPath(); c.roundRect(-40, 540, 720, 200, 24); c.fill(); c.fillStyle = '#22398A'; c.fillRect(-40, 520, 720, 40);
    c.fillStyle = '#0E1A4A'; c.fillRect(700, 560, 180, 260);
    const blink = (Math.floor(P5(t) * 10) % 2) ? 1 : 0.55; glow(790, 540, 160, '#FF5A3D', 0.4 * blink);
    c.fillStyle = '#0A0820'; c.beginPath(); c.roundRect(730, 515, 120, 50, 10); c.fill();
    c.fillStyle = rgba('#FF5A3D', blink); c.font = '700 34px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5:30', 790, 541);
    figure(520 + TW(t) * 1.5, 520 - Math.abs(TW(t, 2)) * 3, 0.85, '#03061A', { sit: true, wind: true, t });
    dust(25, 73, t, '#9FC0FF', [560, 90, 300, 400], 5);
  },
  emptyshop(t) {                                         // a tiny shop open late on a wet street, nobody walking in
    sky([[0, '#031E26'], [1, '#08343E']]);
    c.fillStyle = '#052A33'; c.fillRect(0, 0, W, 600); c.fillStyle = '#073640'; c.fillRect(0, 340, W, 260);
    c.fillStyle = '#FFC24A'; c.fillRect(260, 90, 440, 250); glow(480, 215, 420, '#FFC24A', 0.35);
    c.fillStyle = 'rgba(120,60,10,0.35)'; for (let i = 0; i < 4; i++) c.fillRect(290 + i * 100, 220, 60, 120);
    c.fillStyle = '#031E26'; c.fillRect(470, 90, 10, 250); c.fillRect(240, 70, 480, 24);
    const on = (Math.floor(t * 6) % 13 === 0) ? 0.35 : 1; glow(600, 130, 120, '#FF3B5C', 0.5 * on);
    c.strokeStyle = rgba('#FF3B5C', on); c.lineWidth = 5; c.beginPath(); c.roundRect(540, 114, 120, 40, 18); c.stroke();
    c.fillStyle = rgba('#FF6B80', on); c.font = '700 26px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OPEN', 600, 135);
    c.fillStyle = '#021418'; c.fillRect(0, 600, W, 220);
    c.save(); c.globalAlpha = 0.22 + 0.04 * TW(t, 2); c.fillStyle = vgrad(600, 720, [[0, '#FFC24A'], [1, 'rgba(255,194,74,0)']]); c.fillRect(260, 600, 440, 120); c.restore();
    c.strokeStyle = 'rgba(160,220,230,0.35)'; c.lineWidth = 1.5; const q = rng(79); for (let i = 0; i < 90; i++) { const x = q() * W, y = (q() * H + t * 600 * (0.8 + q() * 0.4)) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 26); c.stroke(); }
    for (let i = 0; i < 6; i++) { const k = (P5(t) * 2 + i / 6) % 1, x = 120 + i * 140; c.strokeStyle = `rgba(255,200,120,${0.35 * (1 - k)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, 690 + (i % 3) * 30, 10 + 50 * k, 3 + 10 * k, 0, 0, TAU); c.stroke(); }
  },
  summit(t) {                                            // standing at the foot of a mountain, other climbers' lights already near the top
    sky([[0, '#040A26'], [1, '#0B1A4E']]); stars(120, 83, t, 420);
    c.fillStyle = '#16226A'; c.beginPath(); c.moveTo(-40, 820); c.lineTo(520, 120); c.lineTo(640, 230); c.lineTo(1000, 820); c.fill();
    c.fillStyle = '#E8ECFF'; c.beginPath(); c.moveTo(450, 208); c.lineTo(520, 120); c.lineTo(600, 194); c.lineTo(560, 186); c.lineTo(530, 210); c.lineTo(500, 192); c.fill();
    c.fillStyle = '#0C143E'; c.beginPath(); c.moveTo(-40, 820); c.lineTo(300, 520); c.lineTo(520, 820); c.fill();
    const path = u => [520 - 260 * u + 60 * Math.sin(u * 12), 160 + 560 * u];
    for (let i = 0; i < 7; i++) { const u = 0.05 + ((i * 0.045 + P5(t) * 0.02) % 0.32), [x, y] = path(u), tw = 0.7 + 0.3 * Math.sin(t * TAU * 2 + i); glow(x, y, 26, '#FFD36B', 0.55 * tw); disc(x, y, 3.5, '#FFF2C0'); }
    fogBands(560, 760, t, '#6A7FE0', 0.14, 4, 85);
    figure(250 + TW(t) * 1.5, 790 - 210 * 0.5, 0.5, '#02041A', { wind: true, t }); glow(256, 790 - 210 * 0.5 - 85, 40, '#FFD36B', 0.6); disc(256, 790 - 210 * 0.5 - 85, 4, '#FFF2C0');
  },
  hourglass(t) {                                         // sand running out under a warm lamp, the one clock that only runs one way
    sky([[0, '#05272A'], [1, '#0A3A3E']]); glow(480, 300, 460, '#FFB347', 0.35 + 0.04 * TW(t, 2));
    const cx = 480, top = 150, mid = 420, bot = 690, u = P5(t);
    c.fillStyle = '#2A1408'; c.beginPath(); c.roundRect(cx - 190, top - 40, 380, 40, 10); c.fill(); c.beginPath(); c.roundRect(cx - 190, bot, 380, 40, 10); c.fill();
    c.fillStyle = '#3A1E0C'; c.fillRect(cx - 180, top, 16, bot - top); c.fillRect(cx + 164, top, 16, bot - top);
    const glass = () => { c.beginPath(); c.moveTo(cx - 140, top); c.bezierCurveTo(cx - 140, mid - 120, cx - 14, mid - 40, cx - 10, mid); c.bezierCurveTo(cx - 14, mid + 40, cx - 140, mid + 120, cx - 140, bot); c.lineTo(cx + 140, bot); c.bezierCurveTo(cx + 140, mid + 120, cx + 14, mid + 40, cx + 10, mid); c.bezierCurveTo(cx + 14, mid - 40, cx + 140, mid - 120, cx + 140, top); c.closePath(); };
    c.save(); glass(); c.fillStyle = 'rgba(200,240,240,0.08)'; c.fill(); c.clip();
    const lvlTop = top + 60 + 150 * u, lvlBot = bot - 40 - 110 * u;
    c.fillStyle = '#FFB347'; c.fillRect(cx - 150, lvlTop, 300, mid - lvlTop);
    c.beginPath(); c.moveTo(cx - 150, bot); c.lineTo(cx - 150, bot - 10); c.quadraticCurveTo(cx, lvlBot - 40, cx + 150, bot - 10); c.lineTo(cx + 150, bot); c.fill();
    const q = rng(89); for (let i = 0; i < 40; i++) { const y = mid + ((q() + t * 1.8) % 1) * (lvlBot - mid); disc(cx + (q() - 0.5) * 4, y, 1.6, '#FFD27A'); }
    c.restore();
    c.save(); glass(); c.strokeStyle = 'rgba(220,255,255,0.55)'; c.lineWidth = 3; c.stroke(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 110, top + 30); c.quadraticCurveTo(cx - 100, top + 140, cx - 40, mid - 50); c.stroke();
    dust(30, 91, t, '#FFE2B8', [0, 0, W, H], 6);
  },
  classroom(t) {                                         // standing at the door of a bright room where everyone already knows what they're doing
    sky([[0, '#140A3A'], [1, '#1E1060']]);
    const dx = 560, dw = 300, dy = 120, dh = 640;
    c.fillStyle = '#FFD36B'; c.fillRect(dx, dy, dw, dh); glow(710, 440, 420, '#FFD36B', 0.32 + 0.05 * TW(t, 2));
    c.fillStyle = '#FFE9A8'; c.fillRect(dx, dy, dw, 140);
    c.fillStyle = '#C98A1E'; for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = dx + 20 + i * 95, y = 420 + r * 120; c.fillRect(x, y, 76, 14);
      figure(x + 38 + Math.sin(t * TAU / 2.5 + i + r) * 2, y - 40, 0.28, '#7A4A10', { bust: true }); }
    c.save(); c.globalAlpha = 0.35; c.fillStyle = '#FFD36B'; c.beginPath(); c.moveTo(dx, dy + dh); c.lineTo(dx + dw, dy + dh); c.lineTo(dx + dw + 220, H); c.lineTo(dx - 220, H); c.fill(); c.restore();
    c.fillStyle = '#0C0630'; c.fillRect(dx - 24, dy - 24, 24, dh + 24); c.fillRect(dx + dw, dy - 24, 24, dh + 24); c.fillRect(dx - 24, dy - 24, dw + 48, 24);
    figure(700 + TW(t) * 2, 780 - 210 * 0.95, 0.95, '#06031A', { wind: true, t });
    dust(30, 97, t, '#FFF2C0', [dx, dy, dw, dh], 6);
  },
});


function house(x, y, w, h, wall, roof, win, lit, t, seed = 1) {
  c.fillStyle = wall; c.fillRect(x, y, w, h); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + w / 2, y - h * 0.45); c.lineTo(x + w + 14, y); c.fill();
  const r = rng(seed); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const on = lit === true || r() < lit; const wx = x + w * (0.18 + 0.44 * j), wy = y + h * (0.18 + 0.42 * i);
    c.fillStyle = on ? win : 'rgba(0,0,0,0.35)'; c.fillRect(wx, wy, w * 0.2, h * 0.22); if (on) glow(wx + w * 0.1, wy + h * 0.11, w * 0.3, win, 0.18 + 0.04 * Math.sin(t * TAU / 2.5 + i + j)); }
}
function tree(x, y, s, col, t) { c.fillStyle = col; c.fillRect(x - 6 * s, y - 80 * s, 12 * s, 80 * s); const sw = Math.sin(t * TAU / 2.5 + x) * 4 * s;
  [[0, -120, 55], [-35, -95, 40], [35, -95, 42], [0, -160, 38]].forEach(([dx, dy, r]) => disc(x + dx * s + sw, y + dy * s, r * s, col)); }
function streetlamp(x, y, h, t, col = '#FFB347', ph = 0) { c.fillStyle = '#05061A'; c.fillRect(x - 3, y - h, 6, h); c.fillRect(x - 3, y - h, 34, 5); const f = 0.9 + 0.1 * Math.sin(t * TAU * 1.6 + ph);
  glow(x + 30, y - h + 8, 110, col, 0.45 * f); disc(x + 30, y - h + 8, 6, '#FFF2C0'); c.save(); c.globalAlpha = 0.10 * f; c.fillStyle = col; c.beginPath(); c.moveTo(x + 24, y - h + 8); c.lineTo(x + 36, y - h + 8); c.lineTo(x + 90, y); c.lineTo(x - 30, y); c.fill(); c.restore(); }
function steam(x, y, t, n = 3, col = 'rgba(255,255,255,0.28)') { c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < n; i++) { c.beginPath(); for (let k = 0; k <= 16; k++) { const yy = y - k * 7, xx = x + i * 14 + Math.sin(k * 0.5 - t * TAU / 1.25 + i) * 6; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } }

Object.assign(SCENES, {
  afternoonstreet(t) {                                   // kids playing in the street on an ordinary golden afternoon
    sky([[0, '#2E7BD6'], [0.55, '#FFB25A'], [0.56, '#3A2A6E']]); cloudDrift(40, 200, t, 'rgba(255,240,220,0.55)', 4, 3, 0.8);
    [[40, 300, 170, 150, '#4A2E86', '#2A1A5A'], [250, 320, 150, 130, '#5A3A96', '#2A1A5A'], [700, 300, 180, 150, '#4A2E86', '#2A1A5A']].forEach(([x, y, w, h, wa, ro], i) => house(x, y, w, h, wa, ro, '#FFD36B', 0.5, t, i + 3));
    tree(560, 452, 1.0, '#2A1A5A', t); tree(910, 452, 0.8, '#2A1A5A', t);
    c.fillStyle = '#2A1A4E'; c.fillRect(0, 452, W, 368); c.fillStyle = 'rgba(255,178,90,0.18)'; c.fillRect(0, 452, W, 30);
    const kids = [[300, 0], [470, 1.3], [640, 2.1]]; kids.forEach(([x, ph], i) => { const b = Math.abs(Math.sin(t * TAU / 0.833 + ph)) * 14; c.save(); c.globalAlpha = 0.35; c.fillStyle = '#120A2A'; c.beginPath(); c.ellipse(x + 60, 700, 70, 10, -0.2, 0, TAU); c.fill(); c.restore(); figure(x + Math.sin(t * TAU / 2.5 + ph) * 30, 700 - 210 * 0.34 - b, 0.34, '#0E0824', { wind: true, t }); });
    const u = P5(t * 2), bx = 300 + 340 * Math.abs(2 * u - 1) * 1.0, by = 600 - 160 * Math.sin(Math.PI * ((u * 2) % 1)); disc(bx + 20, by, 14, '#FF5A5A');
    dust(40, 101, t, '#FFE2A8', [0, 0, W, 460], 10);
  },
  frontdoor(t) {                                         // friends at the front door at dusk, asking if you can come out
    sky([[0, '#0E1A4A'], [1, '#1A2A6E']]);
    c.fillStyle = '#2A1E5A'; c.fillRect(0, 0, 640, 700); c.fillStyle = '#1E1648'; c.fillRect(0, 700, W, 120);
    const f = 0.9 + 0.1 * Math.sin(t * TAU * 2.2) * Math.sin(t * TAU / 1.25); glow(470, 150, 260, '#FFB347', 0.45 * f); disc(470, 150, 12, '#FFE2A0');
    c.fillStyle = '#FFD36B'; c.fillRect(200, 180, 220, 520); c.fillStyle = '#B0242E'; c.save(); c.translate(200, 180); c.transform(0.75 + 0.03 * TW(t), 0.04, 0, 1, 0, 0); c.fillRect(0, 0, 220, 520); c.restore();
    disc(380, 450, 7, '#FFD36B');
    [[700, 0], [820, 1.1]].forEach(([x, ph]) => { figure(x + Math.sin(t * TAU / 2.5 + ph) * 3, 700 - 210 * 0.42, 0.42, '#06041A', { wind: true, t }); });
    c.strokeStyle = '#06041A'; c.lineWidth = 6; [[900, 680]].forEach(([x, y]) => { c.beginPath(); c.arc(x - 40, y, 22, 0, TAU); c.stroke(); c.beginPath(); c.arc(x + 30, y, 22, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x - 5, y - 30); c.lineTo(x + 30, y); c.moveTo(x - 5, y - 30); c.lineTo(x - 12, y - 48); c.stroke(); });
    dust(25, 103, t, '#FFE066', [560, 300, 400, 380], 14);
  },
  carnight(t) {                                          // falling asleep in the back seat, streetlights sliding past
    sky([[0, '#05061A'], [1, '#0C1036']]);
    c.fillStyle = '#0A0E2E'; c.beginPath(); c.roundRect(120, 90, 720, 300, 40); c.fill();
    c.save(); c.beginPath(); c.roundRect(140, 110, 680, 260, 30); c.clip(); c.fillStyle = vgrad(110, 370, [[0, '#0A1650'], [1, '#2A1A6E']]); c.fillRect(140, 110, 680, 260);
    for (let i = 0; i < 3; i++) { const x = 880 - ((P5(t * 2) + i / 3) % 1) * 1000; glow(x, 160, 90, '#FFB347', 0.6); c.fillStyle = '#05061A'; c.fillRect(x - 3, 160, 6, 220); }
    c.fillStyle = '#05061A'; for (let i = 0; i < 9; i++) { const x = 820 - ((P5(t * 3) + i / 9) % 1) * 760; c.fillRect(x, 330, 40 + (i % 3) * 30, 40); }
    c.restore();
    const sweep = (P5(t * 2) * 1.3) % 1; c.save(); c.globalAlpha = 0.18 * Math.sin(Math.PI * sweep); c.fillStyle = '#FFB347'; c.fillRect(0, 0, W, H); c.restore();
    c.fillStyle = '#16205A'; c.beginPath(); c.roundRect(60, 420, 840, 400, 50); c.fill(); c.fillStyle = '#1C2870'; c.beginPath(); c.roundRect(60, 380, 840, 120, 40); c.fill();
    c.save(); c.translate(520, 560 + Math.sin(t * TAU / 2.5) * 3); c.rotate(-0.35); figure(0, 0, 0.62, '#03041A', { sit: true }); c.restore();
  },
  nightdoor(t) {                                         // a bedroom door left open a crack, hallway light on the floor
    sky([[0, '#060C2A'], [1, '#0C1646']]);
    const open = 60 + 16 * TW(t); c.fillStyle = '#FFC24A'; c.fillRect(740, 80, open, 600); glow(760, 380, 380, '#FFC24A', 0.25);
    c.fillStyle = '#0A0E30'; c.fillRect(740 + open, 80, 180, 600); c.fillStyle = '#060A24'; c.fillRect(720, 60, 20, 640);
    c.save(); c.globalAlpha = 0.3; c.fillStyle = '#FFC24A'; c.beginPath(); c.moveTo(740, 680); c.lineTo(740 + open, 680); c.lineTo(500 + open * 3, H); c.lineTo(300, H); c.fill(); c.restore();
    c.fillStyle = '#1A2266'; c.beginPath(); c.roundRect(40, 520, 460, 160, 30); c.fill(); c.fillStyle = '#E8E4FF'; c.beginPath(); c.roundRect(60, 500, 140, 50, 20); c.fill();
    const r = rng(107); for (let i = 0; i < 14; i++) { const x = 60 + r() * 560, y = 60 + r() * 300, a = 0.4 + 0.4 * Math.sin(t * TAU / 2.5 + i); c.fillStyle = rgba('#B8F0A0', a); c.save(); c.translate(x, y); c.rotate(r() * 6); c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 4 : 10, aa = k * Math.PI / 5; c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } c.fill(); c.restore(); }
    dust(25, 109, t, '#FFE2A8', [740, 80, 120, 700], 6);
  },
  walkhome(t) {                                          // two friends walking home under streetlights
    sky([[0, '#0E2A5A'], [0.6, '#5A2A7A'], [1, '#C2416A']]);
    c.fillStyle = '#1A1240'; c.beginPath(); c.moveTo(0, 560); for (let x = 0; x <= W; x += 60) c.lineTo(x, 520 - 60 * Math.abs(Math.sin(x * 0.01))); c.lineTo(W, 820); c.lineTo(0, 820); c.fill();
    c.fillStyle = '#2A1E5A'; c.fillRect(0, 640, W, 180); c.fillStyle = '#3A2A72'; c.fillRect(0, 630, W, 14);
    const off = P5(t) * 320; for (let i = -1; i < 4; i++) streetlamp(i * 320 + 120 - off + 320, 640, 330, t, '#FFB347', i);
    walker(420, 640 - 210 * 0.5, 0.5, '#07041A', t, 0); walker(500, 640 - 210 * 0.46, 0.46, '#07041A', t, 0.8);
    dust(30, 113, t, '#FFD0A0', [0, 300, W, 340], 18);
  },
  housewindows(t) {                                      // the last night everyone was home: every window lit
    sky([[0, '#06082A'], [1, '#141A5A']]); stars(90, 117, t, 360); disc(800, 120, 40, '#F4F0FF'); glow(800, 120, 140, '#C8D0FF', 0.25);
    c.fillStyle = '#0C0E3A'; c.fillRect(0, 640, W, 180);
    c.fillStyle = '#1E1A5A'; c.fillRect(300, 470, 360, 190); c.fillRect(330, 360, 300, 120); c.fillStyle = '#120E40'; c.beginPath(); c.moveTo(280, 360); c.lineTo(480, 240); c.lineTo(680, 360); c.fill();
    const win = [[340, 500], [450, 500], [560, 500], [360, 385], [530, 385]]; win.forEach(([x, y], i) => { const tv = i === 2; const col = tv ? (Math.sin(t * TAU * 3) > 0 ? '#7FD8FF' : '#A0E8FF') : '#FFC24A'; c.fillStyle = col; c.fillRect(x, y, 70, 60); glow(x + 35, y + 30, 70, col, 0.25); c.fillStyle = '#1E1A5A'; c.fillRect(x + 33, y, 4, 60); });
    c.fillStyle = '#120E40'; c.fillRect(560, 250, 34, 70); for (let i = 0; i < 5; i++) { const k = (P5(t) + i / 5) % 1; disc(578 + Math.sin(k * 6) * 14 + k * 40, 245 - k * 180, 14 + k * 26, `rgba(200,200,240,${0.22 * (1 - k)})`); }
    tree(150, 650, 1.1, '#0A0A30', t); tree(820, 650, 0.9, '#0A0A30', t);
  },
  kitchenlight(t) {                                      // golden light in the kitchen, dinner on, people at the table
    sky([[0, '#0F4A4A'], [1, '#0A3434']]);
    c.fillStyle = '#FFB347'; c.fillRect(620, 100, 220, 220); c.fillStyle = '#0F4A4A'; c.fillRect(725, 100, 10, 220); c.fillRect(620, 205, 220, 10);
    c.save(); c.globalAlpha = 0.2 + 0.04 * TW(t, 2); c.fillStyle = '#FFB347'; c.beginPath(); c.moveTo(620, 320); c.lineTo(840, 100); c.lineTo(520, 820); c.lineTo(80, 820); c.fill(); c.restore();
    c.fillStyle = '#062626'; c.fillRect(0, 600, W, 220); c.fillStyle = '#7A3A14'; c.fillRect(140, 560, 520, 24); c.fillRect(170, 584, 16, 160); c.fillRect(610, 584, 16, 160);
    figure(230 + TW(t) * 2, 560 - 40, 0.42, '#041818', { bust: true }); figure(560 + Math.sin(t * TAU / 2.5 + 1) * 2, 560 - 40, 0.42, '#041818', { bust: true });
    c.fillStyle = '#E8E0D0'; c.beginPath(); c.ellipse(400, 556, 60, 12, 0, 0, TAU); c.fill(); steam(380, 540, t, 3);
    c.strokeStyle = '#041818'; c.lineWidth = 4; c.beginPath(); c.moveTo(400, 0); c.lineTo(400, 120); c.stroke(); c.fillStyle = '#041818'; c.beginPath(); c.moveTo(360, 120); c.lineTo(440, 120); c.lineTo(420, 150); c.lineTo(380, 150); c.fill(); glow(400, 170, 160, '#FFD36B', 0.3);
    dust(40, 127, t, '#FFE2A8', [80, 100, 760, 700], 6);
  },
  bedceiling(t) {                                        // lying awake, phone glow, the ceiling fan turning
    sky([[0, '#140A3A'], [1, '#22125A']]);
    c.save(); c.translate(480, 90); c.fillStyle = '#0C0628'; c.fillRect(-6, -90, 12, 90); disc(0, 0, 22, '#0C0628'); c.rotate(t * TAU / 2.5); for (let k = 0; k < 4; k++) { c.rotate(TAU / 4); c.beginPath(); c.ellipse(130, 0, 120, 18, 0, 0, TAU); c.fill(); } c.restore();
    c.fillStyle = '#2A1A6E'; c.beginPath(); c.roundRect(40, 600, 880, 220, 30); c.fill(); c.fillStyle = '#E8E0FF'; c.beginPath(); c.roundRect(60, 560, 200, 70, 30); c.fill();
    c.fillStyle = '#3A2A8E'; c.beginPath(); c.moveTo(260, 640); c.quadraticCurveTo(560, 560, 900, 640); c.lineTo(900, 700); c.lineTo(260, 700); c.fill();
    disc(200, 560, 48, '#0A0420'); const ph = 0.75 + 0.25 * Math.sin(t * TAU / 1.25) ** 2; glow(300, 520, 180, '#4FE3FF', 0.45 * ph);
    c.fillStyle = '#0A0420'; c.beginPath(); c.roundRect(280, 470, 50, 90, 8); c.fill(); c.fillStyle = rgba('#7FEBFF', ph); c.beginPath(); c.roundRect(284, 475, 42, 80, 6); c.fill();
    dust(20, 131, t, '#9FE8FF', [100, 300, 600, 300], 4);
  },
  storeaisle(t) {                                        // a song comes on in a store aisle and you stop walking
    sky([[0, '#1A0A3A'], [1, '#2A1260']]);
    const fl = (Math.floor(t * 8) % 23 === 0) ? 0.6 : 1; for (let i = 0; i < 3; i++) { c.fillStyle = rgba('#F0F8FF', 0.9 * fl); c.fillRect(380 + i * 0, 40 + i * 70, 200 - i * 50 + 0, 10); }
    glow(480, 60, 400, '#E0F0FF', 0.25 * fl);
    const shelf = (side) => { for (let r = 0; r < 4; r++) { const y0 = 150 + r * 130; c.fillStyle = ['#FF4FA3', '#4FE3FF', '#FFD36B', '#7CFFB0'][r]; c.beginPath(); c.moveTo(side < 0 ? 0 : W, y0); c.lineTo(side < 0 ? 380 : 580, 300 + r * 40); c.lineTo(side < 0 ? 380 : 580, 330 + r * 40); c.lineTo(side < 0 ? 0 : W, y0 + 90); c.fill(); } };
    c.save(); c.globalAlpha = 0.85; shelf(-1); shelf(1); c.restore();
    c.fillStyle = '#120830'; c.beginPath(); c.moveTo(380, 470); c.lineTo(580, 470); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    for (let i = 0; i < 6; i++) { const k = (P5(t) + i / 6) % 1, x = 620 + Math.sin(k * 8 + i) * 60 + k * 120, y = 120 + k * 260; c.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; c.font = '700 40px Georgia'; c.fillText(i % 2 ? '♪' : '♫', x, y); }
    figure(480 + TW(t) * 1.5, 720 - 210 * 0.62, 0.62, '#06021A', { wind: true, t });
  },
  cafecrowd(t) {                                         // a warm cafe window, someone inside laughing the way they used to
    sky([[0, '#06163A'], [1, '#0C2460']]);
    c.fillStyle = '#0A1A48'; c.fillRect(0, 0, W, 640); c.fillStyle = '#FFB347'; c.fillRect(540, 120, 380, 330); glow(730, 290, 360, '#FFB347', 0.32);
    c.fillStyle = '#0A1A48'; c.fillRect(725, 120, 10, 330); c.fillStyle = '#C2411F'; c.fillRect(520, 90, 420, 34);
    const laugh = Math.abs(Math.sin(t * TAU / 0.625)) * (P5(t) < 0.5 ? 1 : 0); c.fillStyle = '#7A3A10'; c.fillRect(580, 380, 120, 10); c.fillRect(760, 380, 120, 10);
    figure(610, 340 - 4, 0.3, '#6A2A08', { bust: true }); c.save(); c.translate(670, 340); c.rotate(-0.25 * laugh); figure(0, 0, 0.3, '#6A2A08', { bust: true }); c.restore(); figure(830, 340, 0.3, '#6A2A08', { bust: true });
    c.fillStyle = '#04102A'; c.fillRect(0, 640, W, 180);
    figure(220 + TW(t) * 2, 700 - 210 * 0.72, 0.72, '#020818', { wind: true, t });
    c.strokeStyle = 'rgba(180,210,255,0.3)'; c.lineWidth = 1.5; const q = rng(137); for (let i = 0; i < 60; i++) { const x = q() * W, y = (q() * H + t * 500) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 22); c.stroke(); }
  },
  stargaze(t) {                                          // two people lying on a hill, a shooting star going over
    sky([[0, '#030620'], [0.6, '#0A1A5A'], [1, '#123A6A']]); stars(160, 139, t, 600);
    c.save(); c.globalAlpha = 0.18 + 0.06 * TW(t); const g = c.createLinearGradient(0, 120, W, 320); g.addColorStop(0, '#2AFFC0'); g.addColorStop(0.5, '#B04FFF'); g.addColorStop(1, '#2AFFC0'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 200); c.bezierCurveTo(300, 80 + 30 * TW(t), 600, 260, W, 140); c.lineTo(W, 220); c.bezierCurveTo(600, 330, 300, 170, 0, 290); c.fill(); c.restore();
    const u = P5(t); if (u < 0.3) { const k = u / 0.3, x = 180 + 520 * k, y = 80 + 140 * k; c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 90, y - 24); c.stroke(); disc(x, y, 3, '#FFFFFF'); }
    const hill = x => 700 - 90 * Math.exp(-(((x - 480) / 300) ** 2)); c.fillStyle = '#16245E'; c.beginPath(); c.moveTo(0, hill(0)); for (let x = 0; x <= W; x += 12) c.lineTo(x, hill(x)); c.lineTo(W, H); c.lineTo(0, H); c.fill(); grassLine(0, hill, t, '#16245E', 120, 18);
    [[400, -0.12], [560, 0.12]].forEach(([x, r]) => { c.save(); c.translate(x, hill(x) - 8); c.rotate(Math.PI / 2 + r); c.fillStyle = '#02030E'; c.beginPath(); c.roundRect(-14, -70, 28, 120, 14); c.fill(); disc(0, -84, 18, '#02030E'); c.restore(); });
  },
  coffee(t) {                                            // two cups on a cafe table, steam rising, a hand around one
    sky([[0, '#0A3A40'], [1, '#05262A']]); glow(480, 120, 420, '#FFB347', 0.28);
    c.fillStyle = '#0E5058'; c.beginPath(); c.ellipse(480, 640, 520, 150, 0, 0, TAU); c.fill();
    [[340, 560], [620, 580]].forEach(([x, y], i) => { c.fillStyle = '#FF7A3D'; c.beginPath(); c.roundRect(x - 60, y - 80, 120, 110, [10, 10, 40, 40]); c.fill(); c.strokeStyle = '#FF7A3D'; c.lineWidth = 14; c.beginPath(); c.arc(x + 66, y - 30, 26, -1.3, 1.3); c.stroke();
      c.fillStyle = '#3A1A08'; c.beginPath(); c.ellipse(x, y - 80, 58, 12, 0, 0, TAU); c.fill(); steam(x - 18, y - 96, t + i, 3, 'rgba(255,255,255,0.3)'); });
    c.fillStyle = '#071C20'; c.beginPath(); c.roundRect(640 + 4 * TW(t), 500, 200, 64, 30); c.fill(); c.beginPath(); c.roundRect(560 + 4 * TW(t), 520, 110, 30, 14); c.fill();
    dust(30, 149, t, '#FFE2A8', [0, 0, W, 500], 6);
  },
  trainplatform(t) {                                     // a train pulling away from a night platform, one person still standing there
    sky([[0, '#040A2A'], [1, '#0A1650']]);
    for (let i = 0; i < 4; i++) { const x = 120 + i * 240; c.fillStyle = '#E8F0FF'; c.fillRect(x - 50, 70, 100, 8); glow(x, 80, 140, '#CFE0FF', 0.28); }
    const u = smooth(P5(t)), tx = -60 + u * 1100;
    c.fillStyle = '#1A2A7A'; c.fillRect(tx - 1100, 260, 1100, 220); c.fillStyle = '#0E1A5A'; c.fillRect(tx - 1100, 460, 1100, 20);
    for (let i = 0; i < 12; i++) { const x = tx - 1080 + i * 90; c.fillStyle = '#FFD36B'; c.fillRect(x, 300, 60, 70); } disc(tx - 10, 440, 12, '#FF3B3B'); glow(tx - 10, 440, 70, '#FF3B3B', 0.5);
    c.fillStyle = '#121C4A'; c.fillRect(0, 520, W, 300); c.fillStyle = '#FFD36B'; c.fillRect(0, 520, W, 8);
    figure(420 + TW(t) * 2, 760 - 210 * 0.85, 0.85, '#030618', { wind: true, t });
    fogBands(440, 540, t, '#8FA8FF', 0.12, 3, 151);
  },
  plantwindow(t) {                                       // a small plant on a rainy windowsill, a new leaf slowly opening
    sky([[0, '#0A3A3A'], [1, '#062A2A']]);
    c.fillStyle = vgrad(80, 470, [[0, '#2A6A7A'], [1, '#4A8A8A']]); c.fillRect(120, 80, 720, 390); c.strokeStyle = '#062A2A'; c.lineWidth = 18; c.strokeRect(120, 80, 720, 390); c.fillStyle = '#062A2A'; c.fillRect(470, 80, 18, 390);
    c.strokeStyle = 'rgba(220,250,255,0.4)'; c.lineWidth = 1.5; const q = rng(157); for (let i = 0; i < 70; i++) { const x = 130 + q() * 700, y = 90 + ((q() * 380 + t * 300) % 380); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 16); c.stroke(); }
    c.fillStyle = '#0E3F3F'; c.fillRect(80, 470, 800, 40);
    c.fillStyle = '#FF6B4A'; c.beginPath(); c.moveTo(640, 470); c.lineTo(760, 470); c.lineTo(745, 380); c.lineTo(655, 380); c.fill();
    const leaf = (a, l, w2) => { c.save(); c.translate(700, 380); c.rotate(a); c.fillStyle = '#4ADE80'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w2, -l / 2, 0, -l); c.quadraticCurveTo(-w2, -l / 2, 0, 0); c.fill(); c.restore(); };
    leaf(-0.6 + 0.03 * TW(t), 110, 34); leaf(0.5 + 0.03 * TW(t, 2), 120, 36); leaf(-0.1, 60 + 50 * smooth(P5(t)), 8 + 22 * smooth(P5(t)));
    glow(700, 300, 160, '#7CFFB0', 0.15);
  },
  carrain(t) {                                           // crying in the car: rain on the windshield, wipers, red lights ahead
    sky([[0, '#04082A'], [1, '#0A1450']]);
    const r = rng(163); for (let i = 0; i < 18; i++) { const x = r() * W, y = 120 + r() * 300, rr = 20 + r() * 50; glow(x, y, rr, ['#FF3B5C', '#FFB347', '#4FE3FF'][i % 3], 0.35 + 0.15 * Math.sin(t * TAU / 2.5 + i)); }
    for (let i = 0; i < 80; i++) { const x = r() * W, y = 60 + r() * 460, s = 2 + r() * 5; disc(x, y, s, 'rgba(200,220,255,0.25)'); }
    const wa = Math.sin(t * TAU / 1.25) * 1.1; [[260, 1], [620, 1]].forEach(([x]) => { c.save(); c.translate(x, 520); c.rotate(-Math.PI / 2 + wa); c.fillStyle = '#02040F'; c.fillRect(0, -4, 330, 8); c.restore(); });
    c.fillStyle = '#02040F'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 60); c.quadraticCurveTo(480, 30, 0, 60); c.fill(); c.fillRect(0, 520, W, 300);
    c.strokeStyle = '#0A0E2A'; c.lineWidth = 26; c.beginPath(); c.arc(330, 700, 150, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    figure(300, 900, 1.4, '#05081E', { bust: true });
  },
  ripples(t) {                                           // a still lake at night, circles spreading wider and wider
    sky([[0, '#020A1E'], [0.45, '#06244A'], [0.46, '#041A36'], [1, '#020E22']]); stars(80, 167, t, 360);
    disc(640, 160, 46, '#F4F0FF'); glow(640, 160, 160, '#C8D8FF', 0.3);
    c.strokeStyle = 'rgba(230,240,255,0.5)'; for (let i = 0; i < 14; i++) { const y = 400 + i * 22, w = 30 + i * 9 + 6 * Math.sin(t * TAU / 1.25 + i); c.lineWidth = 2; c.beginPath(); c.moveTo(640 - w, y); c.lineTo(640 + w, y); c.stroke(); }
    for (let i = 0; i < 4; i++) { const k = (P5(t) + i / 4) % 1; c.strokeStyle = `rgba(130,230,255,${0.6 * (1 - k)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(380, 640, 30 + 360 * k, 8 + 90 * k, 0, 0, TAU); c.stroke(); }
    c.fillStyle = '#020814'; c.beginPath(); c.moveTo(0, 700); c.quadraticCurveTo(160, 660, 300, 720); c.lineTo(300, 820); c.lineTo(0, 820); c.fill();
    figure(150, 690 - 40, 0.5, '#010410', { sit: true }); glow(250, 690, 50, '#FFB347', 0.55); disc(250, 690, 6, '#FFD27A');
  },
});

// slow camera push on every scene in the library (about 5% over each 5 s loop): the main source of "smooth"
for (const name of Object.keys(SCENES)) {
  const draw = SCENES[name];
  SCENES[name] = t => { const z = 1 + 0.07 * smooth(t / 8); c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); draw(t); c.restore(); };
}
window.NAMES = Object.keys(SCENES);

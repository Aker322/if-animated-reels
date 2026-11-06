'use strict';
// ================================================================ WORD-CUT REEL ENGINE
// One word on screen at a time, a new flat-colour shot on (almost) every word, punch-ins, shakes, RGB split,
// flat cards (inserts) on key words, drawings held on twos. Needs: WORDS, DUR, PLAN (plan.js) loaded first.
const QP = new URLSearchParams(location.search);
const FMT = QP.get('fmt') || 'tall';
const W = FMT === 'wide' ? 1920 : 1080, H = FMT === 'wide' ? 1080 : 1920, FPS = 24;
const LAY = FMT === 'wide' ? { s: 0.8, cx: 960, cy: 466 } : { s: 1.0, cx: 540, cy: 765 };   // the 1080 core square on screen
const VIS = { x0: (0 - LAY.cx) / LAY.s + 540, x1: (W - LAY.cx) / LAY.s + 540, y0: (0 - LAY.cy) / LAY.s + 540, y1: (H - LAY.cy) / LAY.s + 540 };
const BGR = { x: VIS.x0 - 200, y: VIS.y0 - 200, w: VIS.x1 - VIS.x0 + 400, h: VIS.y1 - VIS.y0 + 400 };
const TAU = Math.PI * 2;
const C = { ink: '#0D0F0D', cream: '#F6F1E4', red: '#E5262F', orange: '#F28C28', teal: '#14605E', blue: '#1F4CA8', green: '#2DB46A', pink: '#F45B7A', gold: '#F2C14E', deep: '#0F3A24', paper: '#E6DFC6' };
const BG_CYCLE = (PLAN.palette || ['ink', 'red', 'cream', 'orange', 'teal', 'ink', 'blue', 'red']).map(k => C[k] || k);
const ACCENT = PLAN.accent || '#FF3347';
const norm = w => String(w).toLowerCase().replace(/[^a-z0-9%$']/g, '');
const nmap = m => Object.fromEntries(Object.entries(m || {}).map(([k, v]) => [/^\d+$/.test(k) ? k : norm(k), v]));   // plan keys: word index or the word
const INSERTS = nmap(PLAN.inserts), TREAT = nmap(PLAN.treat), COLORS = nmap(PLAN.colors);

// ---------------------------------------------------------------- images: PLAN.images = { name: 'img/file.png' }, drawn as die-cut stickers
const IMGS = {};
function stickerize(im, pad) {
  const cv = document.createElement('canvas'); cv.width = im.width + pad * 2; cv.height = im.height + pad * 2; const x = cv.getContext('2d');
  if (pad > 0) {
    for (let a = 0; a < 32; a++) { const t = (a / 32) * Math.PI * 2; x.drawImage(im, pad + Math.cos(t) * pad, pad + Math.sin(t) * pad); }
    x.globalCompositeOperation = 'source-in'; x.fillStyle = PLAN.stickerCol || '#FFFFFF'; x.fillRect(0, 0, cv.width, cv.height); x.globalCompositeOperation = 'source-over';
  }
  x.drawImage(im, pad, pad); return cv;
}
window.READY = Promise.all(Object.entries(PLAN.images || {}).map(([k, src]) => new Promise(res => {
  const im = new Image();
  im.onload = () => { IMGS[k] = stickerize(im, Math.round((PLAN.sticker ?? 0.018) * Math.max(im.width, im.height))); res(); };
  im.onerror = () => { console.log('missing image ' + src); res(); };
  im.src = src;
})));

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x), lerp = (a, b, t) => a + (b - a) * t, inv = (x, a, b) => clamp((x - a) / (b - a));
const eo2 = t => 1 - (1 - t) ** 2, eo3 = t => 1 - (1 - t) ** 3, eio2 = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const eoBack = (t, s = 1.7) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${clamp(a)})`; };
const mixc = (h1, h2, t) => { const a = hex2rgb(h1), b = hex2rgb(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const [r, g, b] = hex2rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const stepT = t => Math.floor(t * 12 + 1e-6) / 12;                       // drawings move on twos
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.01, r), 0, TAU); }
function fillCircle(c, x, y, r, s) { circle(c, x, y, r); c.fillStyle = s; c.fill(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function fillBG(c, col) { c.fillStyle = col; c.fillRect(BGR.x, BGR.y, BGR.w, BGR.h); }
function lgText(c, s, x, y, size, col, o = {}) { c.save(); c.font = `400 ${size}px "LG"`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.letterSpacing = (o.ls ?? 4) + 'px'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }

// ---------------------------------------------------------------- flat drawings (core coords, subject around 540,540)
function capsule(c, bx, by, ang, L, w) { c.save(); c.translate(bx, by); c.rotate(ang); c.beginPath(); c.roundRect(-w / 2, -L, w, L + w / 2, w / 2); c.fill(); c.restore(); }
function flatHand(c, x, y, sc, rot, pose, col) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.fillStyle = col;
  c.beginPath(); c.roundRect(-74, 40, 148, 1600, 34); c.fill();
  c.beginPath(); c.roundRect(-100, -108, 200, 214, [74, 74, 62, 62]); c.fill();
  const ext = { open: [1, 1, 1, 1], point: [1, 0.3, 0.28, 0.26], grab: [0.34, 0.33, 0.31, 0.29], peace: [1, 1, 0.3, 0.28], three: [1, 1, 1, 0.3], fist: [0.3, 0.3, 0.3, 0.3] }[pose] || [1, 1, 1, 1];
  const Ls = [152, 178, 168, 132], xs = [-72, -25, 22, 67], ang = [-0.17, -0.055, 0.055, 0.17];
  for (let i = 0; i < 4; i++) capsule(c, xs[i], -92, ang[i] * (pose === 'grab' ? 0.2 : 1), Ls[i] * ext[i], 46);
  capsule(c, -88, 26, pose === 'grab' || pose === 'fist' ? -0.45 : -0.98, pose === 'grab' || pose === 'fist' ? 92 : 124, 52);
  c.restore();
}
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
function digit7(c, x, y, h, d, col) {
  const w = h * 0.52, t = h * 0.13, R = {
    a: [x - w / 2 + t * 0.6, y - h / 2, w - t * 1.2, t], g: [x - w / 2 + t * 0.6, y - t / 2, w - t * 1.2, t], d: [x - w / 2 + t * 0.6, y + h / 2 - t, w - t * 1.2, t],
    f: [x - w / 2, y - h / 2 + t * 0.6, t, h / 2 - t * 0.9], b: [x + w / 2 - t, y - h / 2 + t * 0.6, t, h / 2 - t * 0.9], e: [x - w / 2, y + t * 0.3, t, h / 2 - t * 0.9], c: [x + w / 2 - t, y + t * 0.3, t, h / 2 - t * 0.9] };
  c.fillStyle = col; for (const k of SEG[d] || '') { const r = R[k]; rr(c, r[0], r[1], r[2], r[3], t * 0.45); c.fill(); }
}
function clock7(c, x, y, h, str, col) {
  const w = h * 0.52, gap = h * 0.16; let cx = x - (str.replace(':', '').length * (w + gap) + (str.includes(':') ? w * 0.5 : 0)) / 2 + w / 2;
  for (const ch of str) { if (ch === ':') { fillCircle(c, cx - w * 0.3, y - h * 0.2, h * 0.07, col); fillCircle(c, cx - w * 0.3, y + h * 0.2, h * 0.07, col); cx += w * 0.5; continue; } digit7(c, cx, y, h, ch, col); cx += w + gap; }
}
function coin(c, x, y, r, sx, col) {
  c.save(); c.translate(x, y); c.scale(sx, 1);
  fillCircle(c, 0, 0, r, mixc(col, '#000000', 0.25)); fillCircle(c, 0, 0, r * 0.86, col);
  c.strokeStyle = rgba('#000000', 0.25); c.lineWidth = r * 0.045; for (let k = 1; k <= 4; k++) { circle(c, r * 0.04 * k, r * 0.03 * k, r * 0.17 * k); c.stroke(); }
  c.restore();
}
function bill(c, x, y, w, rot, col) {
  const h = w * 0.46; c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = 'rgba(0,0,0,0.28)'; rr(c, -w / 2 + w * 0.03, -h / 2 + w * 0.05, w, h, w * 0.03); c.fill();
  c.fillStyle = col; rr(c, -w / 2, -h / 2, w, h, w * 0.03); c.fill();
  c.strokeStyle = C.cream; c.lineWidth = w * 0.016; rr(c, -w / 2 + w * 0.05, -h / 2 + w * 0.05, w * 0.9, h - w * 0.1, w * 0.02); c.stroke();
  fillCircle(c, 0, 0, h * 0.3, C.cream); lgText(c, '$', 0, 4, h * 0.42, col);
  c.restore();
}
function stamp(c, x, y, s, rot, label, col) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.font = '900 80px "Inter Display", "Inter", Arial, sans-serif'; const tw = c.measureText(label).width + 44;
  c.strokeStyle = col; c.lineWidth = 8; rr(c, -tw / 2, -46, tw, 92, 12); c.stroke();
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, 4); c.restore();
}
function eye(c, x, y, s, open, iris) {
  const W2 = 300 * s, Hh = 150 * s * clamp(open);
  c.save(); c.translate(x, y); c.beginPath(); c.moveTo(-W2, 0); c.quadraticCurveTo(0, -Hh * 1.55, W2, 0); c.quadraticCurveTo(0, Hh * 1.55, -W2, 0); c.closePath();
  c.fillStyle = C.cream; c.fill();
  if (open > 0.05) { c.save(); c.clip(); fillCircle(c, 0, 0, 132 * s, iris); c.fillStyle = C.ink; c.beginPath(); c.ellipse(0, 0, 18 * s, 118 * s, 0, 0, TAU); c.fill(); fillCircle(c, 40 * s, -52 * s, 18 * s, 'rgba(255,255,255,0.85)'); c.restore(); }
  c.lineWidth = 12 * s; c.strokeStyle = C.ink; c.beginPath(); c.moveTo(-W2, 0); c.quadraticCurveTo(0, -Hh * 1.55, W2, 0); c.stroke(); c.restore();
}
function heart(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(0, 120);
  c.bezierCurveTo(-260, -40, -150, -260, 0, -130); c.bezierCurveTo(150, -260, 260, -40, 0, 120); c.fill(); c.restore();
}
function bulb(c, x, y, s, col, on) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (on) { c.strokeStyle = col; c.lineWidth = 14; c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; c.beginPath(); c.moveTo(Math.cos(a) * 230, -60 + Math.sin(a) * 230); c.lineTo(Math.cos(a) * 300, -60 + Math.sin(a) * 300); c.stroke(); } }
  fillCircle(c, 0, -60, 170, col); c.fillStyle = col; c.beginPath(); c.moveTo(-90, 60); c.lineTo(90, 60); c.lineTo(70, 160); c.lineTo(-70, 160); c.closePath(); c.fill();
  c.fillStyle = C.ink; rr(c, -75, 175, 150, 34, 12); c.fill(); rr(c, -60, 220, 120, 34, 12); c.fill(); c.restore();
}
function check(c, x, y, s, col, p) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 70; c.lineCap = 'round'; c.lineJoin = 'round';
  const k = clamp(p); c.beginPath(); c.moveTo(-200, 0); c.lineTo(-200 + 140 * Math.min(1, k * 2), 140 * Math.min(1, k * 2));
  if (k > 0.5) c.lineTo(-60 + 300 * (k - 0.5) * 2, 140 - 340 * (k - 0.5) * 2); c.stroke(); c.restore();
}
function cross(c, x, y, s, col, p) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineWidth = 70; c.lineCap = 'round'; const k = clamp(p);
  c.beginPath(); c.moveTo(-180, -180); c.lineTo(-180 + 360 * Math.min(1, k * 2), -180 + 360 * Math.min(1, k * 2)); c.stroke();
  if (k > 0.5) { const q = (k - 0.5) * 2; c.beginPath(); c.moveTo(180, -180); c.lineTo(180 - 360 * q, -180 + 360 * q); c.stroke(); } c.restore();
}
function trend(c, up, p, col) {
  const pts = up ? [[160, 860], [360, 700], [500, 760], [700, 480], [920, 260]] : [[160, 260], [380, 420], [520, 360], [720, 640], [920, 860]];
  const n = Math.max(2, Math.ceil(clamp(p) * pts.length));
  c.save(); c.strokeStyle = col; c.lineWidth = 34; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
  pts.slice(0, n).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  const [x, y] = pts[n - 1], [px, py] = pts[n - 2], a = Math.atan2(y - py, x - px);
  c.fillStyle = col; c.beginPath(); c.moveTo(x + Math.cos(a) * 60, y + Math.sin(a) * 60); c.lineTo(x + Math.cos(a + 2.5) * 70, y + Math.sin(a + 2.5) * 70); c.lineTo(x + Math.cos(a - 2.5) * 70, y + Math.sin(a - 2.5) * 70); c.fill(); c.restore();
}
function phone(c, x, y, s, text, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = C.ink; rr(c, -150, -290, 300, 580, 40); c.fill(); c.fillStyle = col; rr(c, -134, -272, 268, 544, 28); c.fill();
  if (text) { c.fillStyle = C.ink; c.font = '900 52px "Inter Display", "Inter", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, -40); }
  c.restore();
}
function calendar(c, x, y, s, top, big, band) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, -246, -282, 520, 600, 22); c.fill(); c.fillStyle = C.paper; rr(c, -260, -300, 520, 600, 22); c.fill();
  c.fillStyle = band; rr(c, -260, -300, 520, 150, [22, 22, 0, 0]); c.fill();
  lgText(c, top, 0, -222, 110, C.cream, { ls: 6 }); lgText(c, big, 0, 90, 330, C.ink); c.restore();
}
function note(c, x, y, s, lines, accent) {
  c.save(); c.translate(x, y); c.rotate(-0.05); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,0.3)'; rr(c, -316, -402, 660, 840, 18); c.fill(); c.fillStyle = C.paper; rr(c, -330, -420, 660, 840, 18); c.fill();
  c.strokeStyle = 'rgba(80,120,200,0.45)'; c.lineWidth = 3; for (let i = 0; i < 11; i++) { c.beginPath(); c.moveTo(-300, -300 + i * 64); c.lineTo(300, -300 + i * 64); c.stroke(); }
  c.strokeStyle = rgba(accent, 0.7); c.beginPath(); c.moveTo(-230, -420); c.lineTo(-230, 420); c.stroke();
  c.fillStyle = C.ink; c.font = 'italic 700 74px Lora, Georgia, serif'; c.textAlign = 'left'; lines.forEach((ln, i) => c.fillText(ln, -200, -250 + i * 128)); c.restore();
}
function plaster(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const a of [-0.62, 0.62]) { c.save(); c.rotate(a); c.fillStyle = '#F3D9B1'; c.strokeStyle = C.ink; c.lineWidth = 8; rr(c, -160, -38, 320, 76, 34); c.fill(); c.stroke(); c.fillStyle = '#E3BC86'; rr(c, -42, -26, 84, 52, 10); c.fill(); c.restore(); }
  c.restore();
}
function blob(c, r, col, ts) {
  fillCircle(c, 0, 0, r, col);
  const q = rng(Math.floor(ts * 12) + 3); c.strokeStyle = rgba(C.cream, 0.55); c.lineWidth = Math.max(4, r * 0.05); c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const a = q() * TAU, d = r * 0.45; c.beginPath(); c.moveTo(Math.cos(a) * d, Math.sin(a) * d); c.quadraticCurveTo((q() - 0.5) * r, (q() - 0.5) * r, Math.cos(a + 2.4) * d, Math.sin(a + 2.4) * d); c.stroke(); }
}
function bars(c, vals, p, col) {
  const n = vals.length, bw = 640 / n;
  vals.forEach((v, i) => { const h = 620 * v * eo3(clamp(p * 1.4 - i * 0.12)); c.fillStyle = i === n - 1 ? col : rgba(col, 0.45); rr(c, 220 + i * bw + 10, 880 - h, bw - 20, h, 10); c.fill(); });
  c.fillStyle = C.cream; c.fillRect(200, 880, 680, 10);
}

// ---------------------------------------------------------------- inserts: PLAN.inserts[wordIndex or word] = { type, ...options }
const INS = {
  hand: o => (c, t, lt) => flatHand(c, o.x ?? 560, (o.y ?? 780) - 60 * eo2(clamp(lt / 0.4)), o.scale ?? 1.9, o.rot ?? 0.08, o.pose || 'open', o.col || C.cream),
  coin: o => (c, t) => coin(c, 540, 540, 300, Math.cos(stepT(t) * 7), o.col || C.gold),
  bill: o => (c, t, lt) => { c.save(); c.translate(540, 540); c.scale(1, eoBack(clamp(lt / 0.25))); bill(c, 0, 0, 640, -0.25, o.col || C.green); c.restore(); },
  stamp: o => (c, t, lt) => { c.font = '900 80px "Inter Display", "Inter", Arial, sans-serif'; const fit = Math.min(3.2, (FMT === 'wide' ? 1500 : 860) / (c.measureText(o.label || 'NO').width + 44));
    stamp(c, 540, 560, fit * lerp(1.7, 1, eo3(clamp(lt / 0.12))), -0.14, o.label || 'NO', o.col || C.cream); },
  clock: o => (c) => clock7(c, 540, 540, Math.min(380, (FMT === 'wide' ? 1500 : 800) / ((o.label || '3:00').length * 0.68)), o.label || '3:00', o.col || C.cream),
  eye: o => (c, t, lt) => eye(c, 540, 540, 1.5, o.close ? 1 - eo2(clamp(lt / 0.5)) : eoBack(clamp(lt / 0.22), 2.4), o.iris || '#F2A12E'),
  heart: o => (c, t, lt) => { heart(c, 540, 560, 1.6 * (1 + 0.06 * Math.sin(stepT(t) * 14)), o.col || C.red); if (o.band) plaster(c, 540, 520, lerp(1.8, 1.25, eoBack(clamp((lt - 0.25) / 0.2), 2))); },
  img: o => (c, t, lt) => {
    const im = IMGS[o.src]; if (!im) return;
    const h = o.h ?? 800, w = (im.width * h) / im.height, pop = lerp(0.84, 1, eoBack(clamp(lt / 0.2), 2.2)), ts = stepT(t);
    c.save(); c.translate(o.x ?? 540, (o.y ?? 500) + Math.sin(ts * 5.2) * 7); c.rotate((o.rot ?? 0) + Math.sin(ts * 3.3) * 0.014); c.scale(pop * (o.flip ? -1 : 1), pop);
    c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowOffsetY = 18; c.drawImage(im, -w / 2, -h / 2, w, h); c.restore();
  },
  shrink: o => (c, t, lt) => { c.save(); c.translate(540, 520); blob(c, lerp(o.from ?? 430, o.to ?? 140, eoBack(clamp((lt - 0.1) / 0.7), 1.3)), o.col || C.ink, stepT(t)); c.restore(); },
  bulb: o => (c, t, lt) => bulb(c, 540, 560, 1.3, o.col || C.gold, lt > 0.12),
  check: o => (c, t, lt) => check(c, 560, 520, 1.5, o.col || C.green, lt / 0.3),
  cross: o => (c, t, lt) => cross(c, 540, 540, 1.4, o.col || C.red, lt / 0.3),
  up: o => (c, t, lt) => trend(c, true, lt / 0.6, o.col || C.green),
  down: o => (c, t, lt) => trend(c, false, lt / 0.6, o.col || C.red),
  phone: o => (c, t, lt) => phone(c, 540, 560, 1.4, o.label || '', o.screen || '#CFE3FF'),
  calendar: o => (c, t, lt) => calendar(c, 540, 560, 1.25 * (0.6 + 0.4 * eoBack(clamp(lt / 0.18), 2.2)), o.top || 'DAY', o.label || '1', o.col || C.red),
  note: o => (c) => note(c, 540, 560, 1.05, o.lines || ['note'], o.col || C.red),
  bars: o => (c, t, lt) => bars(c, o.values || [0.3, 0.45, 0.6, 0.95], lt / 0.6, o.col || C.green),
  count: o => (c, t, lt) => lgText(c, (o.prefix || '') + Math.round((o.to || 100) * eo3(clamp(lt / (o.dur || 0.8)))).toLocaleString() + (o.suffix || ''), 540, 540, o.size || 300, o.col || C.cream),
  big: o => (c) => lgText(c, o.label || '1%', 540, 540, o.size || 420, o.col || C.cream),
  black: () => () => {},
};

// ---------------------------------------------------------------- background motifs (flat, one tone off the field)
const MOTIFS = ['circle', 'stripes', 'none', 'rings', 'band', 'dots', 'half', 'none'];
function motif(c, kind, col, t) {
  const tone = lum(col) > 0.55 ? mixc(col, '#000000', 0.1) : mixc(col, '#FFFFFF', 0.08);
  c.save(); c.fillStyle = tone; c.strokeStyle = tone;
  if (kind === 'circle') fillCircle(c, 540, 520, 380, tone);
  else if (kind === 'rings') { c.lineWidth = 26; for (let r = 120; r < 1400; r += 110) { circle(c, 540, 540, r); c.stroke(); } }
  else if (kind === 'stripes') { c.translate(540, 540); c.rotate(-0.5); for (let x = -2000; x < 2000; x += 160) c.fillRect(x, -2400, 60, 4800); }
  else if (kind === 'band') c.fillRect(BGR.x, 380, BGR.w, 320);
  else if (kind === 'dots') { for (let y = BGR.y; y < BGR.y + BGR.h; y += 90) for (let x = BGR.x; x < BGR.x + BGR.w; x += 90) fillCircle(c, x, y, 9, tone); }
  else if (kind === 'half') { circle(c, 540, 1100, 520); c.fill(); }
  c.restore();
}

// ---------------------------------------------------------------- shots: a cut on (almost) every word
const SHOTS = [];
(function buildShots() {
  const cams = [[1, 540, 540], [1.3, 540, 520], [1.65, 540, 560], [1.12, 520, 540], [1.9, 560, 520], [1.05, 540, 600]];
  let look = 0, last = -9;
  const add = (t0, o) => { SHOTS.push({ t0, ...o }); };
  add(0, { bg: BG_CYCLE[0], mo: 'circle', cam: [1.15, 540, 540], tr: 'cut' });
  const Q = PLAN.quote; let hold = null;
  WORDS.forEach((w, i) => {
    if (Q && w.t >= Q.from - 1e-6) return;                     // the closing quote is one calm shot (below)
    const key = norm(w.w);
    const ins = INSERTS[i] || INSERTS[key];
    const gapBefore = i ? w.t - WORDS[i - 1].end : w.t;
    if (!ins && hold && w.t < hold.until) {                     // a held picture punches in on each word instead of cutting
      if (w.t - last < (PLAN.minGap ?? 0.3) || hold.k >= 3) return;
      const b = hold.base, face = INSERTS[hold.i]?.type === 'img'; hold.k++;   // pictures push toward the face, flat cards just nudge
      add(w.t, { ...b, cam: [b.cam[0] * (1 + (face ? 0.13 : 0.06) * hold.k), b.cam[1], b.cam[2] - (face ? 40 : 0) * hold.k], tr: w.em ? 'punch' : 'cut', fx: w.em ? ['shake', 'rgb'] : [] });
      last = w.t; return;
    }
    if (!ins && w.t - last < (PLAN.minGap ?? 0.3)) return;
    look++;
    const prev = SHOTS[SHOTS.length - 1];
    let bg = BG_CYCLE[look % BG_CYCLE.length]; if (prev && bg === prev.bg) bg = BG_CYCLE[(look + 1) % BG_CYCLE.length];
    const cam = cams[look % cams.length];
    const sec = i > 0 && WORDS[i - 1].brk === 2 && gapBefore > 0.35;
    const o = { bg: ins ? (C[ins.bg] || ins.bg || C.ink) : bg, mo: MOTIFS[look % MOTIFS.length], cam, tr: sec ? 'flash' : w.em ? 'punch' : 'cut', fx: w.em ? ['shake', 'rgb'] : (look % 5 === 3 ? ['rgb'] : []) };
    const t0 = i === 0 ? Math.min(w.t, 0.04) : w.t;
    if (ins) {
      const isImg = ins.type === 'img';
      o.ins = INS[ins.type] ? INS[ins.type](ins) : INS.black(); o.insT0 = t0 === 0 ? -1 : t0; o.cam = [1, 540, 540];   // the opening picture is already in place on frame one
      o.mo = ins.mo || (isImg ? 'circle' : 'none'); o.fx = isImg && !w.em ? ['rgb'] : ['shake', 'rgb'];
      const wy = { img: [0.69, 0.88], hand: [0.3, 0.2], big: [null, null], black: [null, null] }[ins.type] || [0.66, 0.86];   // the word sits clear of the picture
      o.wordY = ins.wordY ?? (wy[FMT === 'wide' ? 1 : 0] ?? undefined);
    }
    hold = ins && ins.hold ? { until: w.t + ins.hold, base: o, k: 0, i: INSERTS[i] ? i : key } : null;
    add(t0, o); last = w.t;
  });
  if (Q) add(Q.from - 0.02, { bg: C[Q.bg] || Q.bg || C.ink, mo: 'none', cam: [1, 540, 540], tr: 'flash', fx: [], quote: true });
  SHOTS.sort((a, b) => a.t0 - b.t0);
  // long holds get a punch-in so no picture sits still for more than ~1.3 s
  const extra = [];
  SHOTS.forEach((s, i) => { if (s.quote) return; const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR; for (let t = s.t0 + 0.75; t < t1 - 0.45; t += 0.75) extra.push({ ...s, t0: t, cam: [s.cam[0] * 1.3, s.cam[1], s.cam[2]], tr: 'cut', fx: ['rgb'] }); });
  SHOTS.push(...extra); SHOTS.sort((a, b) => a.t0 - b.t0);
  SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR + 1; });
})();
function shotAt(t) { let lo = 0, hi = SHOTS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SHOTS[m].t0 <= t) lo = m; else hi = m - 1; } return SHOTS[lo]; }
function wordAt(t) { let r = null; for (const w of WORDS) { if (w.t > t) break; if (t < w.end) r = w; } return r; }

// ---------------------------------------------------------------- drawing one frame
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const out = cv.getContext('2d', { alpha: false });
function drawShot(c, s, t) {
  const u = clamp((t - s.t0) / Math.max(0.01, s.t1 - s.t0)), ts = Math.max(s.t0, stepT(t));
  let z = s.cam[0] * (1 + 0.05 * eio2(u));
  if (s.tr === 'punch') z *= lerp(1.14, 1, eo3(clamp((t - s.t0) / 0.26)));
  let sx = 0, sy = 0;
  if (s.fx && s.fx.includes('shake')) { const d = t - s.t0, A = 18 * (0.25 + 0.75 * Math.exp(-d * 7)), r = rng(Math.floor(t * 24) * 13 + 7); sx = (r() - 0.5) * 2 * A; sy = (r() - 0.5) * 2 * A; }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = s.bg; c.fillRect(0, 0, W, H);
  c.translate(LAY.cx + sx, LAY.cy + sy); c.scale(LAY.s * z, LAY.s * z); c.translate(-s.cam[1], -s.cam[2]);
  fillBG(c, s.bg);
  const scn = !s.ins && (PLAN.scenes || []).find(q => t >= q.from && t < q.to);
  if (s.quote) { c.save(); c.font = `700 ${FMT === 'wide' ? 520 : 640}px Lora, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = lum(s.bg) > 0.55 ? mixc(s.bg, '#000000', 0.08) : mixc(s.bg, '#FFFFFF', 0.07); c.fillText('“', 540, FMT === 'wide' ? 300 : 210); c.restore(); }
  else if (s.ins) {
    if (s.mo && s.mo !== 'none') motif(c, s.mo, s.bg, ts);
    s.ins(c, ts, ts - (s.insT0 ?? s.t0));
  }
  else if (scn && window.SCENES && SCENES[scn.name]) SCENES[scn.name](c, ts, ts - scn.from, s.bg);
  else motif(c, s.mo, s.bg, ts);
  c.restore();
}
const FX1 = document.createElement('canvas'), FX2 = document.createElement('canvas'); FX1.width = FX2.width = W; FX1.height = FX2.height = H;
function rgbSplit(c, a) {
  const f1 = FX1.getContext('2d'), f2 = FX2.getContext('2d');
  f1.globalCompositeOperation = 'copy'; f1.drawImage(c.canvas, 0, 0); f1.globalCompositeOperation = 'multiply'; f1.fillStyle = '#ff0000'; f1.fillRect(0, 0, W, H);
  f2.globalCompositeOperation = 'copy'; f2.drawImage(c.canvas, 0, 0); f2.globalCompositeOperation = 'multiply'; f2.fillStyle = '#00ffff'; f2.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'copy'; c.drawImage(FX2, -a, 0); c.globalCompositeOperation = 'lighter'; c.drawImage(FX1, a, 0); c.restore();
}
const WSZ = FMT === 'wide' ? { size: PLAN.size || 130, y: 0.5, maxW: 1500 } : { size: PLAN.size || 170, y: 0.485, maxW: 920 };
const TREAT_CYCLE = ['glitch', 'outline', 'plain', 'glitch', 'script'];
function drawQuote(c, t, s) {                                     // PLAN.quote: the closing line builds up word by word in serif
  const Q = PLAN.quote, ws = WORDS.filter(w => w.t >= Q.from - 1e-6); if (!ws.length) return;
  const size = Q.size || (FMT === 'wide' ? 96 : 112), maxW = FMT === 'wide' ? 1500 : 980, lh = size * 1.22;
  const light = lum(s.bg) > 0.55, col = Q.col ? (C[Q.col] || Q.col) : light ? C.ink : C.cream, acc = Q.accent ? (C[Q.accent] || Q.accent) : ACCENT;
  const hot = new Set((Q.hot || []).map(norm));
  c.save(); c.font = `700 ${size}px Lora, Georgia, serif`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const sp = c.measureText(' ').width, lines = [[]]; let lw = 0;
  ws.forEach((w, i) => {
    const d = w.w + (w.brk === 1 ? ',' : w.brk === 2 && i === ws.length - 1 ? '.' : ''), dw = c.measureText(d).width;
    if (lw > 0 && lw + sp + dw > maxW) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ w, d, x: lw + (lw > 0 ? sp : 0) }); lw += (lw > 0 ? sp : 0) + dw;
  });
  const y0 = H * (Q.y ?? 0.42) - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, li) => {
    const last = ln[ln.length - 1], width = last.x + c.measureText(last.d).width, x0 = W / 2 - width / 2;
    ln.forEach(({ w, d, x }) => {
      if (t < w.t) return; const a = eo2(clamp((t - w.t) / 0.16));
      c.globalAlpha = a; c.fillStyle = hot.has(norm(w.w)) ? acc : col; c.fillText(d, x0 + x, y0 + li * lh + (1 - a) * 18);
    });
  });
  const lastW = ws[ws.length - 1];
  if (Q.by && t > lastW.t + 0.3) { c.globalAlpha = eo2(clamp((t - lastW.t - 0.3) / 0.3)); lgText(c, Q.by, W / 2, y0 + lines.length * lh + size * 0.3, size * 0.78, acc, { ls: 14 }); }
  c.restore();
}
function drawWord(c, t, s) {
  if (s.quote) return drawQuote(c, t, s);
  const w = wordAt(t); if (!w) return;
  const i = WORDS.indexOf(w), key = norm(w.w);
  const light = lum(s.bg) > 0.55, warm = (() => { const [r, g, b] = hex2rgb(s.bg); return r > 140 && g < 120 && r > b + 40; })();
  const tr = w.em ? (TREAT[key] || TREAT_CYCLE[i % TREAT_CYCLE.length]) : 'plain';
  let col = light ? C.ink : '#F6F1E4';
  if (w.em) { const sem = COLORS[key]; col = sem ? (Math.abs(lum(sem) - lum(s.bg)) < 0.25 ? (light ? C.ink : '#F6F1E4') : sem) : warm ? '#F6F1E4' : light ? '#D81E2C' : ACCENT; }
  let size = WSZ.size, font;
  if (tr === 'script') { size *= 0.92; font = `italic 700 ${size}px Lora, Georgia, serif`; }
  else if (tr === 'serif') { size *= 0.8; font = `700 ${size}px Lora, Georgia, serif`; }
  else font = `400 ${size}px "LG"`;
  const text = (tr === 'script' ? w.w.charAt(0).toUpperCase() + w.w.slice(1).toLowerCase() : w.w.toUpperCase());
  c.save(); c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = tr === 'serif' ? '2px' : '1px';
  const tw = c.measureText(text).width, k = Math.min(1, WSZ.maxW / tw), sc = k * lerp(1.1, 1, eo2(clamp((t - w.t) / 0.07)));
  c.translate(W / 2, H * (s.wordY ?? WSZ.y)); c.scale(sc, sc);
  if (!light) { c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 16; c.shadowOffsetY = 3; }
  if (tr === 'glitch') {
    const r = rng(Math.floor(t * 12) * 7 + i);
    c.globalAlpha = 0.85; c.fillStyle = '#FF2436'; c.fillText(text, 6 + r() * 4, 0); c.fillStyle = '#25E8FF'; c.fillText(text, -6 - r() * 4, 0); c.globalAlpha = 1; c.shadowColor = 'rgba(0,0,0,0)';
    const hg = size * 0.9; for (let b = 0; b < 5; b++) { const y0 = -hg / 2 + b * hg / 5, dx = r() < 0.45 ? (r() - 0.5) * 34 : 0; c.save(); c.beginPath(); c.rect(-tw, y0, 2 * tw, hg / 5 + 1); c.clip(); c.fillStyle = col; c.fillText(text, dx, 0); c.restore(); }
  } else if (tr === 'outline') {
    c.lineWidth = 8; c.strokeStyle = col; c.lineJoin = 'round'; c.strokeText(text, 0, 0); c.shadowColor = 'rgba(0,0,0,0)'; c.globalAlpha = 0.28; c.fillStyle = col; c.fillText(text, 0, 0);
  } else {
    if (!light) { c.lineWidth = 9; c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineJoin = 'round'; c.strokeText(text, 0, 0); }
    c.shadowColor = 'rgba(0,0,0,0)'; c.lineWidth = tr === 'plain' ? size * 0.045 : 2; c.strokeStyle = col; c.strokeText(text, 0, 0); c.fillStyle = col; c.fillText(text, 0, 0);
  }
  c.restore();
}
const NOISE = (() => { const n = document.createElement('canvas'); n.width = n.height = 256; const x = n.getContext('2d'), id = x.createImageData(256, 256), r = rng(5);
  for (let i = 0; i < 65536; i++) { const g = clamp((r() + r() + r() - 1.5) * 80 + 128, 0, 255); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = g; id.data[i * 4 + 3] = 255; } x.putImageData(id, 0, 0); return n; })();
function finish(c, f) {
  const r = rng(Math.floor(f / 2) + 11), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.12; c.translate(-ox, -oy); c.fillStyle = c.createPattern(NOISE, 'repeat'); c.fillRect(ox, oy, W, H); c.restore();
  const m = Math.max(W, H), g = c.createRadialGradient(W / 2, H / 2, m * 0.32, W / 2, H / 2, m * 0.78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function endCard(c, t) {
  const e = PLAN.end; if (!e || t < e.from) return;
  const a = inv(t, e.from, e.from + 0.3);
  c.save(); c.globalAlpha = a; c.fillStyle = e.bg || C.ink; c.fillRect(0, 0, W, H);
  const es = e.size || (FMT === 'wide' ? 120 : 130);
  lgText(c, e.text || '', W / 2, H * 0.46, es, e.col || C.cream, { ls: 6 });
  if (e.sub) lgText(c, e.sub, W / 2, H * 0.46 + es * 0.95, es * 0.5, ACCENT, { ls: 10 });
  c.restore();
}
window.renderFrame = function (f, opts = {}) {
  const t = f / FPS, s = shotAt(t);
  drawShot(out, s, t);
  const d = t - s.t0;
  if (s.fx && s.fx.includes('rgb')) { const a = 7 * (0.35 + 0.65 * Math.exp(-d * 6)); if (a > 0.6) rgbSplit(out, a); }
  if (s.tr === 'flash' && d < 0.22) { out.fillStyle = rgba(C.cream, 0.85 * (1 - eo2(d / 0.22))); out.fillRect(0, 0, W, H); }
  if (!opts.noType) drawWord(out, t, s);
  endCard(out, t);
  finish(out, f);
  if (opts.noData) return null;
  return cv.toDataURL('image/jpeg', opts.q ?? 0.92);
};
window.renderCover = function () {                                 // PLAN.cover: series cover (kicker, title, one image)
  const P = PLAN.cover || {}, c = out, bg = C[P.bg] || P.bg || BG_CYCLE[0];
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.translate(LAY.cx, LAY.cy); c.scale(LAY.s, LAY.s); c.translate(-540, -540);
  motif(c, P.mo || 'rings', bg, 0);
  const im = IMGS[P.img];
  if (im) { const h = P.h ?? 860, w = (im.width * h) / im.height; c.save(); c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowOffsetY = 20; c.drawImage(im, (P.x ?? 540) - w / 2, (P.y ?? 880) - h / 2, w, h); c.restore(); }
  c.restore();
  const light = lum(bg) > 0.55, ink = light ? C.ink : C.cream, acc = P.accent ? (C[P.accent] || P.accent) : ACCENT;
  const top = H * (P.top ?? 0.21);                                 // inside the 3:4 profile-grid crop
  if (P.tag) { c.save(); c.font = `400 64px "LG"`; c.letterSpacing = '6px'; const tw = c.measureText(P.tag).width + 56; c.fillStyle = acc; rr(c, W / 2 - tw / 2, top - 150, tw, 84, 42); c.fill(); c.restore(); lgText(c, P.tag, W / 2, top - 106, 64, light ? C.cream : C.ink, { ls: 6 }); }
  lgText(c, P.kicker || 'THE PSYCHOLOGY OF', W / 2, top, 92, ink, { ls: 10 });
  (P.title || ['TITLE']).forEach((ln, i) => {
    c.save(); c.font = `400 260px "LG"`; c.letterSpacing = '4px'; const k = Math.min(1, (W - 120) / c.measureText(ln).width); c.restore();
    const y = top + 190 + i * 250 * k, sz = 260 * k;
    c.save(); c.font = `400 ${sz}px "LG"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '4px';
    c.lineWidth = sz * 0.09; c.strokeStyle = light ? C.cream : C.ink; c.lineJoin = 'round'; c.strokeText(ln, W / 2, y);
    c.fillStyle = i === (P.hot ?? 0) ? acc : ink; c.fillText(ln, W / 2, y); c.restore();
  });
  finish(c, 0);
  return cv.toDataURL('image/png');
};
window.META = { W, H, FPS, frames: Math.round(DUR * FPS) };

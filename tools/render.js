// node render.js out.mp4 [--fmt tall|wide] [--stills 0,48,96 --dir stills] [--workers 2]   |   node render.js --cover cover.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fmt = opt('fmt', 'tall'), W = fmt === 'wide' ? 1920 : 1080, H = fmt === 'wide' ? 1080 : 1920, workers = +opt('workers', 2);
const url = 'file://' + path.resolve(__dirname, 'reel.html') + '?fmt=' + fmt;
async function page(b) {
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto(url);
  await p.evaluate(() => Promise.all([document.fonts.load('400 100px "LG"'), document.fonts.load('italic 700 100px Lora'), document.fonts.load('900 80px "Inter Display"')]).then(() => document.fonts.ready).then(() => window.READY));
  return p;
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--allow-file-access-from-files'] }), t0 = Date.now();
  if (opt('cover', null)) {
    const p = await page(b), d = await p.evaluate(() => window.renderCover());
    fs.writeFileSync(opt('cover'), Buffer.from(d.split(',')[1], 'base64'));
  } else if (opt('stills', null)) {
    const dir = opt('dir', 'stills'); fs.mkdirSync(dir, { recursive: true }); const p = await page(b);
    for (const f of opt('stills').split(',').map(Number)) { const d = await p.evaluate(f => window.renderFrame(f), f); fs.writeFileSync(path.join(dir, String(f).padStart(5, '0') + '.jpg'), Buffer.from(d.split(',')[1], 'base64')); }
  } else {
    const outFile = args[0], p0 = await page(b), total = await p0.evaluate(() => window.META.frames); await p0.close();
    const per = Math.ceil(total / workers), segs = [];
    await Promise.all(Array.from({ length: workers }, async (_, w) => {
      const a = w * per, z = Math.min(total, a + per); if (a >= z) return;
      const seg = `${outFile}.seg${w}.mp4`; segs[w] = seg;
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '24', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
      const p = await page(b);
      for (let f = a; f < z; f++) { const d = await p.evaluate(f => window.renderFrame(f), f); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
      ff.stdin.end(); await new Promise(r => ff.on('close', r)); await p.close();
    }));
    fs.writeFileSync(outFile + '.txt', segs.filter(Boolean).map(s => `file '${path.resolve(s)}'`).join('\n'));
  }
  await b.close(); console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})();

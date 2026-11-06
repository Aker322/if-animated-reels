// node clips.js outdir [seconds] [name,name] [--stills]  : each scene in clips.html -> outdir/name.mp4 (960x820, 30 fps to match the reel, sized for the CRT screen)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const a = process.argv.slice(2), stills = a.includes('--stills'), [outDir, secs = '4', only] = a.filter(x => x !== '--stills');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 960, height: 820 } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'clips.html')); await p.evaluate(() => window.READY);
  const names = only ? only.split(',') : await p.evaluate(() => window.NAMES), fps = 30, n = Math.round(+secs * fps);
  for (const name of names) {
    if (stills) { const d = await p.evaluate(([nm]) => window.renderFrame(nm, 38, 24), [name]); fs.writeFileSync(path.join(outDir, name + '.jpg'), Buffer.from(d.split(',')[1], 'base64')); continue; }
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', path.join(outDir, name + '.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < n; f++) { const d = await p.evaluate(([nm, f, fps]) => window.renderFrame(nm, f, fps), [name, f, fps]); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', name);
  }
  await b.close();
})();

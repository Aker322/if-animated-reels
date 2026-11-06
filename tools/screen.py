#!/usr/bin/env python3
"""Screen style: clips (GIF, MP4, WebM, MOV or stills) on black in one of three looks (crt, band, full),
short captions on top, a new clip on each new thought.
usage: python3 screen.py words.json plan.json voice.mp3 out.mp4 [--fmt tall|wide] [--music bed.mp3] [--keep] [--dry]
words.json comes from align.py. plan.json fields are listed in SKILL.md (clips, cuts, minShot, maxShot, font, size, ...).
Needs ffmpeg with libass (the ass filter), numpy and opencv-python (cv2)."""
import sys, os, json, re, math, shutil, subprocess, numpy as np, cv2

args = sys.argv[1:]
def opt(k, d=None):
    if '--' + k in args: i = args.index('--' + k); v = args[i + 1]; del args[i:i + 2]; return v
    return d
FMT, MUSIC, KEEP, DRY = opt('fmt', 'tall'), opt('music'), '--keep' in args, '--dry' in args
args = [a for a in args if a not in ('--keep', '--dry')]
words_path, plan_path, voice_path, out_path = args[:4]
HERE = os.path.dirname(os.path.abspath(__file__))
WJ = json.load(open(words_path, encoding='utf-8')); WORDS = WJ['words']
P = json.load(open(plan_path, encoding='utf-8'))
S = P.get('screen', P)                                   # settings may sit under "screen" or at the top level
base_dir = os.path.dirname(os.path.abspath(plan_path))
FPS = 30
W, H = (1080, 1920) if FMT == 'tall' else (1920, 1080)
LOOK = S.get('look', 'crt')                               # crt: glowing TV screen; band: sharp full-width strip; full: full-bleed (paintings)
D = {'crt':  dict(font='DM Serif Display', size=118, spacing=-5, case='lower', group=1, glow=1.0, minShot=1.5, maxShot=4.5, vignette=0.28, edgeShade=0.16),
     'band': dict(font='Poppins Medium', size=76, spacing=0, case='lower', group=2, glow=0.0, minShot=2.2, maxShot=6.0, vignette=0.12, edgeShade=0.0),
     'full': dict(font='Poppins Medium', size=76, spacing=0, case='lower', group=2, glow=0.0, minShot=2.2, maxShot=6.0, vignette=0.22, edgeShade=0.0)}[LOOK]
get = lambda k: S.get(k, D.get(k))
if LOOK == 'crt': SW, SH = (944, 808) if FMT == 'tall' else (1004, 860)     # screen box, about 1.17:1 like an old TV
elif LOOK == 'band': SW, SH = (1080, 780) if FMT == 'tall' else (1440, 1080)  # a 1.38:1 strip across the middle
else: SW, SH = W, H
CX, CY = (540, 955) if FMT == 'tall' and LOOK == 'crt' else (W // 2, H // 2)
X0, Y0 = CX - SW // 2, CY - SH // 2
end = S.get('end')
DUR = WJ['duration'] + (end.get('hold', 1.6) if end else S.get('tail', 0.8))
NF = int(round(DUR * FPS))
work = os.path.abspath(out_path) + '.work'; os.makedirs(work, exist_ok=True)
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: sys.exit('ffmpeg failed:\n' + ' '.join(cmd) + '\n' + r.stderr[-3000:])

# ------------------------------------------------------------------ shots: one clip per thought
def norm(w): return re.sub(r"[^a-z0-9']", '', str(w).lower())
clips = []
for c in S.get('clips') or sorted(os.path.join('clips', f) for f in os.listdir(os.path.join(base_dir, 'clips'))):
    c = {'file': c} if isinstance(c, str) else dict(c)
    c['file'] = c['file'] if os.path.isabs(c['file']) else os.path.join(base_dir, c['file'])
    if isinstance(c.get('at'), str):
        k = next((i for i, w in enumerate(WORDS) if norm(w['w']) == norm(c['at'])), None); c['at'] = k
    clips.append(c)
if not clips: sys.exit('no clips: list them in plan.json "clips" or put files in clips/')
minS, maxS = get('minShot'), get('maxShot')
pinned = {c['at']: c for c in clips if c.get('at') is not None}
if S.get('cuts'):
    cut_idx = sorted(i for i in set(int(i) for i in S['cuts']) | set(pinned) if i > 0)
else:
    cut_idx, cur = [], 0.0
    for i in range(1, len(WORDS)):
        w, prev, since = WORDS[i], WORDS[i - 1], WORDS[i]['t'] - cur
        if i in pinned or (since >= minS and prev.get('brk', 0) >= 1) or since >= maxS:
            if i not in pinned and since < 0.6: continue
            cut_idx.append(i); cur = w['t']
starts = [0.0] + [max(0.0, WORDS[i]['t'] - 0.04) for i in cut_idx]
shots, free, last = [], [c for c in clips if c.get('at') is None] or clips, None
fi = 0
for k, t0 in enumerate(starts):
    t1 = starts[k + 1] if k + 1 < len(starts) else DUR
    first_word = 0 if k == 0 else cut_idx[k - 1]
    c = pinned.get(first_word)
    if c is None:
        c = free[fi % len(free)]; fi += 1
        if last is not None and c['file'] == last['file'] and len(free) > 1: c = free[fi % len(free)]; fi += 1
    shots.append((t0, t1, c)); last = c
print(f'{len(shots)} shots, median {np.median([b - a for a, b, _ in shots]):.2f}s', file=sys.stderr)
if DRY:                                                    # print the cut plan with the words each clip carries, then stop
    for a, b, c in shots: print(f"{a:6.2f}-{b:6.2f}  {os.path.basename(c['file']):24s} {' '.join(w['w'] for w in WORDS if a <= w['t'] < b)}")
    shutil.rmtree(work, ignore_errors=True); sys.exit(0)

# ------------------------------------------------------------------ the clip track, cut and cropped to the screen
segs, fdone = [], 0
for k, (t0, t1, c) in enumerate(shots):
    n = int(round(t1 * FPS)) - fdone; fdone += n
    if n <= 0: continue
    f, ext = c['file'], os.path.splitext(c['file'])[1].lower()
    still = ext in ('.png', '.jpg', '.jpeg', '.webp', '.bmp')
    inp = ['-loop', '1', '-framerate', str(FPS)] if still else (['-ignore_loop', '0'] if ext == '.gif' else ['-stream_loop', '-1'])
    if c.get('start'): inp += ['-ss', str(c['start'])]
    fx, fy, sp = c.get('fx', 0.5), c.get('fy', 0.5), c.get('speed', 1.0)
    vf = (f"setpts=PTS/{sp}," if sp != 1 else '') + f"fps={FPS},scale={SW}:{SH}:force_original_aspect_ratio=increase:flags=lanczos,crop={SW}:{SH}:(iw-{SW})*{fx}:(ih-{SH})*{fy}"
    if still or c.get('push'):                             # stills get a slow push-in so they still move
        z = c.get('push', 0.06)
        vf += f",scale={SW * 2}:{SH * 2},zoompan=z='1+{z}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={SW}x{SH}:fps={FPS}"
    vf += ',setsar=1,format=yuv420p'
    seg = os.path.join(work, f'seg{k:03d}.mp4'); segs.append(seg)
    run(['ffmpeg', '-v', 'error', '-y', *inp, '-i', f, '-an', '-vf', vf, '-frames:v', str(n), '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', seg])
with open(os.path.join(work, 'segs.txt'), 'w') as fh: fh.write(''.join(f"file '{s}'\n" for s in segs))
track = os.path.join(work, 'track.mp4')
run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(work, 'segs.txt'), '-c', 'copy', track])

# ------------------------------------------------------------------ the CRT screen: bowed edges, round corners, shaded glass
def screen_mask(sw, sh, bow_x, bow_y, rad, ss=3):
    w, h = sw * ss, sh * ss; hw, hh, bx, by = w / 2 - 2 * ss, h / 2 - 2 * ss, bow_x * ss, bow_y * ss
    ax, ay = hw - bx, hh - by
    xs, ys = np.linspace(-ax, ax, 240), np.linspace(-ay, ay, 240)
    edge = lambda u: 1 - u ** 2
    pts = ([(x, -ay - by * edge(x / ax)) for x in xs] + [(ax + bx * edge(y / ay), y) for y in ys] +
           [(x, ay + by * edge(x / ax)) for x in xs[::-1]] + [(-ax - bx * edge(y / ay), y) for y in ys[::-1]])
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [(np.array(pts) + [w / 2, h / 2]).astype(np.int32)], 255)
    r = rad * ss                                           # opening by a disc rounds the corners
    inner = cv2.distanceTransform(m, cv2.DIST_L2, 5) > r
    m = (cv2.distanceTransform((~inner).astype(np.uint8) * 255, cv2.DIST_L2, 5) <= r).astype(np.uint8) * 255
    return cv2.resize(m, (sw, sh), interpolation=cv2.INTER_AREA)
mask = screen_mask(SW, SH, S.get('bowX', 16), S.get('bowY', 21), S.get('corner', 44)) if LOOK == 'crt' else np.full((SH, SW), 255, np.uint8)
cv2.imwrite(os.path.join(work, 'mask.png'), mask)
yy, xx = np.mgrid[0:SH, 0:SW]; rn = np.sqrt(((xx - SW / 2) / (SW / 2)) ** 2 + ((yy - SH / 2) / (SH / 2)) ** 2)
a_vig = np.clip(get('vignette') * (rn / 1.41) ** 2.6 * 1.9, 0, 0.5)
d_edge = cv2.distanceTransform((mask > 127).astype(np.uint8), cv2.DIST_L2, 5)
a_edge = get('edgeShade') * np.exp(-d_edge / 14.0)
alpha = 1 - (1 - a_vig) * (1 - a_edge)
if S.get('scanlines', 0): alpha[::3] = 1 - (1 - alpha[::3]) * (1 - S['scanlines'])
vig = np.zeros((SH, SW, 4), np.uint8); vig[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
cv2.imwrite(os.path.join(work, 'vignette.png'), vig)

# ------------------------------------------------------------------ the words: one at a time, lowercase serif, soft shadow
font, size = get('font'), int(get('size') * (1 if FMT == 'tall' else 0.82))
def ts(x): x = max(0, x); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f'{h}:{m:02d}:{s:05.2f}'
def txt(w):
    s = w['w']; case = get('case')
    s = s.lower() if case == 'lower' else s.upper() if case == 'upper' else s
    return s.replace('{', '').replace('}', '')
sx, sy = ((5, 7) if LOOK == 'crt' else (2, 3)) if FMT == 'tall' else (4, 6)
ev = []
hot = S.get('hot', '#FFE14A'); hot_ass = '&H%s%s%s&' % (hot[5:7], hot[3:5], hot[1:3])
groups, cur = [], []                                         # captions: `group` words at most, never across a pause or punctuation
for i, w in enumerate(WORDS):
    if cur and (len(cur) >= get('group') or WORDS[cur[-1]].get('brk', 0) or w['t'] - WORDS[cur[-1]]['end'] > 0.25 or
                sum(len(WORDS[j]['w']) for j in cur) + len(w['w']) > S.get('maxChars', 16)):
        groups.append(cur); cur = []
    cur.append(i)
if cur: groups.append(cur)
for gi, gr in enumerate(groups):
    a, z = WORDS[gr[0]], WORDS[gr[-1]]
    nxt = WORDS[groups[gi + 1][0]]['t'] if gi + 1 < len(groups) else WJ['duration'] + 0.2
    e = max(nxt if nxt - z['end'] < 0.3 else z['end'] + 0.12, a['t'] + 0.12)
    em_style = S.get('em', 'italic' if LOOK == 'crt' else 'color')
    def piece(w, shadow):
        t = txt(w)
        if not w.get('em'): return t
        if em_style == 'italic': return '{\\i1}' + t + '{\\i0}'
        if em_style == 'color' and not shadow: return '{\\1c' + hot_ass + '}' + t + '{\\1c&HFFFFFF&}'
        return t
    body_s = ' '.join(piece(WORDS[j], True) for j in gr); body = ' '.join(piece(WORDS[j], False) for j in gr)
    ev.append(f"Dialogue: 0,{ts(a['t'])},{ts(e)},W,,0,0,0,,{{\\pos({CX + sx},{CY + sy})\\blur8\\1c&H000000&\\1a&H20&}}{body_s}")
    ev.append(f"Dialogue: 1,{ts(a['t'])},{ts(e)},W,,0,0,0,,{{\\pos({CX},{CY})}}{body}")
if end:
    a = WJ['duration'] + 0.25
    es = int(size * 0.62)
    ev.append(f"Dialogue: 0,{ts(a)},{ts(DUR)},W,,0,0,0,,{{\\an7\\pos({X0},{Y0})\\1c&H000000&\\1a&H60&\\fad(300,0)\\p1}}m 0 0 l {SW} 0 {SW} {SH} 0 {SH}{{\\p0}}")
    ev.append(f"Dialogue: 1,{ts(a)},{ts(DUR)},W,,0,0,0,,{{\\pos({CX + sx},{CY + sy})\\fs{es}\\blur6\\1c&H000000&\\1a&H48&\\fad(300,0)}}{end.get('text', '')}")
    ev.append(f"Dialogue: 2,{ts(a)},{ts(DUR)},W,,0,0,0,,{{\\pos({CX},{CY})\\fs{es}\\fad(300,0)}}{end.get('text', '')}")
ass = ('[Script Info]\nScriptType: v4.00+\nPlayResX: %d\nPlayResY: %d\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n' % (W, H) +
       '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
       f"Style: W,{font},{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,{get('spacing')},0,1,0,0,5,0,0,0,1\n\n"
       '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n' + '\n'.join(ev) + '\n')
open(os.path.join(work, 'words.ass'), 'w', encoding='utf-8').write(ass)

# ------------------------------------------------------------------ composite: glow, screen, words, fades, sound
fonts = S.get('fontsdir', os.path.join(HERE, 'fonts'))
fonts = fonts if os.path.isabs(fonts) else os.path.join(base_dir, fonts)
esc = lambda p: p.replace('\\', '/').replace(':', '\\:').replace("'", "\\'")
g, sig, fi_, fo = get('glow'), S.get('glowSize', 36), S.get('fadeIn', 0.3), S.get('fadeOut', 0.9)
fc = (f"color=c=black:s={W}x{H}:r={FPS}:d={DUR:.3f},format=rgba[bg];"
      f"[0:v]format=rgba[s0];[2:v]format=rgba[vg];[s0][vg]overlay=0:0:format=auto,format=rgba[s1];[1:v]format=gray[m];[s1][m]alphamerge,split[sa][sb];"
      f"[bg][sa]overlay={X0}:{Y0},format=gbrp,split[gw][gt];[gw]gblur=sigma={sig},colorchannelmixer=rr={g}:gg={g}:bb={g}[gw2];"
      f"[gt]gblur=sigma={sig / 4:.1f},colorchannelmixer=rr={g * 0.55:.2f}:gg={g * 0.55:.2f}:bb={g * 0.55:.2f}[gt2];[gw2][gt2]blend=all_mode=addition,format=rgba[glow];"
      f"[glow][sb]overlay={X0}:{Y0},ass='{esc(os.path.join(work, 'words.ass'))}':fontsdir='{esc(fonts)}',"
      f"fade=t=in:st=0:d={fi_},fade=t=out:st={max(0, DUR - fo):.3f}:d={fo},format=yuv420p[v];")
ins = ['-i', track, '-loop', '1', '-i', os.path.join(work, 'mask.png'), '-loop', '1', '-i', os.path.join(work, 'vignette.png'), '-i', voice_path]
if MUSIC:
    ins += ['-stream_loop', '-1', '-i', MUSIC]
    fc += f"[4:a]volume={S.get('music', 0.16)}[mu];[3:a][mu]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
else:
    fc += '[3:a]'
fc += f"loudnorm=I=-14:TP=-1.5:LRA=11,apad,afade=t=out:st={max(0, DUR - fo):.3f}:d={fo}[a]"
run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', f'{DUR:.3f}', '-r', str(FPS),
     '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out_path])
json.dump([{'t0': round(a, 3), 't1': round(b, 3), 'clip': os.path.relpath(c['file'], base_dir)} for a, b, c in shots], open(out_path + '.shots.json', 'w'), indent=1)
if not KEEP: shutil.rmtree(work, ignore_errors=True)
print(f'done {out_path} ({DUR:.1f}s)', file=sys.stderr)

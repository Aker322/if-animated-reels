#!/usr/bin/env python3
"""Tighten words.json against the real pauses in the voice.
usage: python3 refine.py voice.mp3 words.json > words_refined.json
Every clause end (a word with brk) is snapped to the nearest pause in the audio (in order, within 1.2 s of the
first-pass guess); words inside each clause are then spread by syllables between the clause's speech start and end.
The first word starts at 0 so the hook is on screen from frame one."""
import sys, re, json, subprocess, numpy as np

audio, words_path = sys.argv[1], sys.argv[2]
WJ = json.load(open(words_path)); W = WJ['words']
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); hop = 160
e = np.array([np.sqrt(np.mean(x[i:i + 400] ** 2)) for i in range(0, len(x) - 400, hop)])
thr = np.percentile(e, 20) + 0.15 * (np.percentile(e, 95) - np.percentile(e, 20)); v = e > thr
idx = np.flatnonzero(v); s0, s1 = idx[0] * 0.01, idx[-1] * 0.01 + 0.05
edges = np.flatnonzero(np.diff(np.r_[0, v.astype(int), 0])); segs = list(zip(edges[::2], edges[1::2]))
pauses = [(a * 0.01, b * 0.01) for (_, a), (b, _) in zip(segs[:-1], segs[1:]) if (b - a) * 0.01 >= 0.16]

def syl(s):
    s = re.sub(r'[^a-z]', '', s.lower()); n = len(re.findall(r'[aeiouy]+', s))
    if s.endswith('e') and not s.endswith(('le', 'ee')) and n > 1: n -= 1
    return max(1, n)

ends = [i for i, w in enumerate(W) if w.get('brk') and i < len(W) - 1]
bounds, used, last = [], -1, 0.0
for i in ends:
    guess = W[i]['end']
    cand = [(abs(p[0] - guess), k) for k, p in enumerate(pauses) if k > used and p[0] > last and abs(p[0] - guess) < 1.2]
    if cand:
        _, k = min(cand); used = k; bounds.append((i, pauses[k][0], pauses[k][1])); last = pauses[k][1]
start, first = s0, 0
for i, a, b in bounds + [(len(W) - 1, s1, None)]:
    ws = list(range(first, i + 1)); wt = [syl(W[j]['w']) + 0.35 for j in ws]; tot = sum(wt); t = start
    for j, k in zip(ws, wt):
        d = (a - start) * k / tot; W[j]['t'] = round(t, 3); W[j]['end'] = round(t + d, 3); t += d
    if b is not None: W[i]['end'] = round(min(b, a + 0.25), 3); start, first = b, i + 1
W[0]['t'] = 0.0
print(f'snapped {len(bounds)} of {len(ends)} clause ends to pauses', file=sys.stderr)
json.dump(WJ, sys.stdout)

#!/usr/bin/env python3
"""Word timings for a voiceover, numpy/scipy only (no speech recogniser needed).
usage: python3 align.py voice.mp3 script.txt [captions.srt] > words.json
script.txt: the exact spoken text. *word* or *two words* = emphasis. [tags] (ElevenLabs audio tags) are ignored.
One dynamic-programming pass picks a start for every word: starts sit on onsets in the voice, word lengths follow
syllable counts (measured in voiced time, so pauses are free), and punctuation likes to land on a pause.
With an SRT, each cue's words are kept inside that cue's time range."""
import sys, re, json, subprocess, numpy as np, scipy.signal as ss

def load(path, sr=22050):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy(), sr

def syl(w):
    w = re.sub(r'[^a-z0-9]', '', w.lower())
    if not w: return 1
    if w.isdigit(): return max(1, len(w))
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and not w.endswith(('le', 'ee')) and n > 1: n -= 1
    return max(1, n)

def parse(text):
    text = re.sub(r'\[[^\]]*\]', ' ', text)
    out, em = [], False
    for tok in text.split():
        lead = tok.lstrip('"\'(')
        if lead.startswith('*'): em = True
        e = em
        closes = re.search(r'\*[^\w]*$', tok) is not None
        clean = tok.replace('*', '')
        brk = 2 if re.search(r'[.!?]["\')]*$', clean) else 1 if re.search(r'[,;:\u2014-]["\')]*$', clean) else 0
        disp = re.sub(r'^[^\w$%#]+', '', clean)
        disp = re.sub(r'[.,;:"\')\u2014-]+$', '', disp)
        if closes: em = False
        if disp: out.append({'w': disp, 'em': e, 'brk': brk, 'syl': syl(disp)})
    return out

def srt(path):
    cues = []
    for b in re.split(r'\n\s*\n', open(path, encoding='utf-8-sig').read().strip()):
        L = [x for x in b.strip().split('\n') if x.strip()]
        k = next((i for i, x in enumerate(L) if '-->' in x), None)
        if k is None: continue
        def sec(x):
            h, m, r = x.strip().replace('.', ',').split(':'); s, ms = r.split(','); return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
        a, z = L[k].split('-->')
        cues.append((sec(a), sec(z), ' '.join(L[k + 1:])))
    return cues

def features(x, sr):
    hop, n = int(sr * 0.01), 1024
    f, _, Z = ss.stft(x, sr, nperseg=n, noverlap=n - hop, boundary=None)
    M = np.abs(Z); band = (f > 150) & (f < 5000)
    L = np.log1p(200 * M[band]); d = np.diff(L, axis=1, prepend=L[:, :1]); d[d < 0] = 0
    flux = np.convolve(d.sum(0), np.hanning(5) / np.hanning(5).sum(), 'same'); flux /= np.percentile(flux, 97) + 1e-9
    db = 10 * np.log10((M[band] ** 2).sum(0) + 1e-10)
    floor = np.percentile(db, 8); voiced = db > floor + 0.42 * (np.percentile(db, 92) - floor)
    voiced = ss.medfilt(voiced.astype(float), 7) > 0.5
    return np.clip(flux, 0, 1.5), voiced, sr / hop

def main():
    audio, script = sys.argv[1], sys.argv[2]
    words = parse(open(script, encoding='utf-8').read())
    x, sr = load(audio); flux, voiced, fps = features(x, sr)
    dur = len(x) / sr
    STEP = 2                                                    # candidates every 20 ms
    cand = np.arange(0, len(flux), STEP); tc = cand / fps; K = len(cand); N = len(words)
    vc = np.concatenate([[0], np.cumsum(voiced)])[cand] / fps   # voiced seconds before each candidate
    # pauses: unvoiced runs of 0.18 s or more
    edges = np.flatnonzero(np.diff(np.concatenate([[1], voiced.astype(int), [1]])))
    pauses = [(a / fps, b / fps) for a, b in zip(edges[::2], edges[1::2]) if (b - a) / fps >= 0.18]
    pe = np.array([p[1] for p in pauses]); ps = np.array([p[0] for p in pauses])
    ends_before = np.searchsorted(np.sort(pe), tc, side='right')          # pauses finished by t
    starts_before = np.searchsorted(np.sort(ps), tc, side='left')         # pauses begun before t
    onset_after_pause = np.zeros(K)
    for (a, b) in pauses:
        k = int(round(b * fps / STEP)); onset_after_pause[max(0, k - 2):k + 3] = 1.0
    vk = voiced[np.minimum(cand + 1, len(voiced) - 1)]
    score = flux[cand] + 0.9 * onset_after_pause - 0.9 * (~vk)
    # allowed window per word (SRT cues), otherwise the whole file
    lo = np.zeros(N); hi = np.full(N, dur)
    if len(sys.argv) > 3:
        i = 0
        for (a, z, txt) in srt(sys.argv[3]):
            n = len(parse(txt))
            for j in range(i, min(N, i + n)): lo[j], hi[j] = a - 0.15, z
            i += n
    rate = max(0.12, (voiced.sum() / fps) / sum(w['syl'] for w in words))  # voiced seconds per syllable
    BACK = int(4.0 * fps / STEP)                                # a word start looks back at most 4 s
    NEG = -1e9
    D = np.full((N, K), NEG); B = np.zeros((N, K), np.int32)
    first_voice = tc[np.argmax(vk)] if vk.any() else 0
    D[0] = score - 1.5 * np.abs(tc - first_voice) - 1.0 * np.maximum(0, tc - first_voice)
    D[0][(tc < lo[0]) | (tc > hi[0])] = NEG
    idx = np.arange(K)
    for j in range(1, N):
        w = words[j - 1]; d_exp = (w['syl'] + 0.35) * rate
        best = np.full(K, NEG); arg = np.zeros(K, np.int32)
        for back in range(3, BACK):                             # predecessor = k - back  (>= 60 ms earlier)
            kp = idx - back; ok = kp >= 0; kp = np.where(ok, kp, 0)
            dv = np.maximum(vc - vc[kp], 0.02)                  # voiced time between the two starts
            cost = 1.1 * np.abs(np.log(dv / d_exp))
            inside = np.maximum(0, ends_before - starts_before[kp])   # pauses fully between the starts
            cost += np.where(inside > 0, -0.6 if w['brk'] else 0.5, 0.6 if w['brk'] == 2 else 0.0)
            val = np.where(ok, D[j - 1][kp] - cost, NEG)
            better = val > best; best = np.where(better, val, best); arg = np.where(better, kp, arg)
        D[j] = best + score; B[j] = arg
        D[j][(tc < lo[j]) | (tc > hi[j])] = NEG
    k = int(np.argmax(D[N - 1] - 0.3 * np.abs(tc - (tc[np.argmax(D[N - 1])]))))
    path = [k]
    for j in range(N - 1, 0, -1): k = int(B[j][k]); path.append(k)
    starts = tc[path[::-1]]
    res = []
    for j, w in enumerate(words):
        t = float(starts[j]); nxt = float(starts[j + 1]) if j + 1 < N else dur
        p = next((a for (a, b) in pauses if t < a < nxt), None)          # a word ends where the voice stops
        end = min(nxt, p + 0.2) if p is not None else nxt
        res.append({'w': w['w'], 't': round(t, 3), 'end': round(max(end, t + 0.25), 3), 'em': w['em'], 'brk': w['brk']})
    json.dump({'duration': round(dur, 3), 'words': res}, sys.stdout, indent=0)

if __name__ == '__main__':
    main()

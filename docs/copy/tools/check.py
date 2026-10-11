#!/usr/bin/env python3
"""Length / consistency cop for docs/copy/draft-*.md (format: BRIEF.md §8).
usage: check.py parse  draft.md  -> JSON {section: {heading: text}}
       check.py report draft.md [measure.json] -> markdown report
       check.py candidates draft.md -> JSON for measure.js check mode
"""
import sys, re, json, collections
TOYS = ['motif-memory', 'markov', 'statistical-feedback', 'possibles']
KEY = {  # keyboard clause appended to notStarted: (desktop, phone)
  'motif-memory': (' Or tab to Play and press Enter.', ' Or tab to Play and press Enter.'),
  'statistical-feedback': (' Or tab to Play and press Enter.', ' Or tab to Play and press Enter.'),
  'possibles': (' Or tab to Play and press Enter.', ' Or tab to Play and press Enter.'),
  'markov': (' Or tab to the instrument and press Enter.', ' Or tab to a control and press Enter.'),
}
SUB = {'{A}': 'cowbell', '{B}': 'cowbell', '{ON}': 'walker 2', '{OFF}': 'walker 1'}
BUDGET_WORDS = {'sub': 20, 'what-is': 20, 'blurb': 14, 'shows': 20, 'meta.description': 30,
                'og.description': 30, 'text': 120, 'teaser.text': 50, 'share': 18}
# controls the phone does NOT show, per toy (soft: the critic judges)
HIDDEN = {
  'motif-memory': ['MEM', 'density', 'rate', 'master', 'mute', 'gain', 'pan', 'knob', 'gate', 'strip', 'rack'],
  'markov': ['cell', 'row', 'rack', 'clear', 'reseed', 'tap', 'level', 'mute', 'strip', 'master'],
  'statistical-feedback': ['weight', 'stress', 'tap a name', 'level', 'mute', 'master', 'memory switch', 'knob', 'rack', 'strip'],
  'possibles': ['write', 'heavier', 'lighter', 'strip', 'finger', 'cut', 'mute', 'master', 'rack'],
}
def parse(path):
    sec, head, out = None, None, collections.OrderedDict()
    for line in open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if line.startswith('## '):
            sec = line[3:].strip(); out[sec] = collections.OrderedDict(); head = None
        elif line.startswith('### ') and sec:
            head = re.sub(r'\s*\(.*\)\s*$', '', line[4:].strip()); out[sec][head] = []
        elif sec and head is not None:
            out[sec][head].append(line)
        elif sec and head is None and line.strip():
            out[sec].setdefault('_', []).append(line)
    for s in out:
        for h in out[s]:
            txt = '\n'.join(out[s][h]).strip()
            txt = re.sub(r'\s*\((\d+)\)\s*$', '', txt)      # writer's char count
            out[s][h] = txt
    return out
def words(t):
    t = re.sub(r'<[^>]+>', '', t); t = re.sub(r'\*\*|\*', '', t)
    return 0 if t.strip() in ('', 'none', '""') else len(t.split())
def clean(t):
    t = t.strip()
    if t == '""': return ''
    return t.strip('`').strip()
def candidates(d):
    out = {}
    for toy in TOYS:
        out[toy] = {}
        for h, t in d.get(toy, {}).items():
            if not (h.startswith('start.') or h.startswith('teaser.')): continue
            if h == 'teaser.text': continue
            t = clean(t)
            if not t: continue
            for k, v in SUB.items(): t = t.replace(k, v)
            phone = h.startswith('teaser.')
            if '.notStarted' in h: t += KEY[toy][1 if phone else 0]
            out[toy][h] = t
    return out
def report(d, meas=None):
    L = []
    def row(sec, h, t, budget_key=None, phone=False):
        t = clean(t); n = words(t); b = BUDGET_WORDS.get(budget_key or h)
        flag = ''
        if b and n > b: flag = f' **OVER by {n-b}**'
        L.append(f'| {sec} | {h} | {n}{"/"+str(b) if b else ""} | {len(t)} |{flag} |')
    L.append('| section | layer | words/budget | chars | flag |'); L.append('|---|---|---|---|---|')
    for h, t in d.get('front', {}).items():
        row('front', h, t, 'blurb' if h.startswith('blurb') else h)
    for toy in TOYS:
        for h, t in d.get(toy, {}).items():
            if h.startswith('start.') or h.startswith('teaser.') and h != 'teaser.text':
                continue
            row(toy, h, t)
    L.append(''); L.append('### State sentences (chars incl. keyboard clause on notStarted; desktop ≤ 145 target / 158 hard; phone ≤ 92 target / 102 hard)')
    L.append('| toy | state | chars | fits 1200 | fits 390 | hidden-control words (phone) |'); L.append('|---|---|---|---|---|---|')
    cand = candidates(d)
    for toy in TOYS:
        for h, t in cand[toy].items():
            phone = h.startswith('teaser.')
            lim_t, lim_h = (92, 102) if phone else (145, 158)
            n = len(t); flag = ''
            if n > lim_h: flag = ' **TOO LONG**'
            elif n > lim_t: flag = ' (tight)'
            f1 = f2 = '?'
            if meas and h in meas.get(toy, {}).get('1200', {}):
                f1 = 'yes' if meas[toy]['1200'][h]['fits'] else '**NO**'
                f2 = 'yes' if meas[toy]['390'][h]['fits'] else ('**NO**' if phone else 'no (desktop word)')
            hid = ''
            if phone:
                low = t.lower()
                hid = ', '.join(w for w in HIDDEN[toy] if re.search(r'\b' + re.escape(w.lower()) + r's?\b', low))
            L.append(f'| {toy} | {h} | {n}{flag} | {f1} | {f2} | {hid} |')
        # running empty?
        for h in ('start.running', 'teaser.running'):
            if h in d.get(toy, {}) and not clean(d[toy][h]): L.append(f'| {toy} | {h} | **EMPTY — forbidden** | | | |')
        # phone text hidden words
        tt = clean(d.get(toy, {}).get('teaser.text', '')).lower()
        hid = ', '.join(w for w in HIDDEN[toy] if re.search(r'\b' + re.escape(w.lower()) + r's?\b', tt))
        if hid: L.append(f'| {toy} | teaser.text | | | | {hid} |')
    return '\n'.join(L)
if __name__ == '__main__':
    cmd, path = sys.argv[1], sys.argv[2]
    d = parse(path)
    if cmd == 'parse': print(json.dumps(d, indent=1, ensure_ascii=False))
    elif cmd == 'candidates': print(json.dumps(candidates(d), indent=1, ensure_ascii=False))
    elif cmd == 'report':
        meas = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else None
        print(report(d, meas))

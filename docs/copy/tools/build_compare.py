#!/usr/bin/env python3
"""Builds the side-by-side comparison page: page × layer × style, with the
current copy as a baseline column, the cop's measurements per cell, and the
critics' surviving objections per page × style.

usage: build_compare.py OUT.html ROUND  (ROUND = critique round number whose
       files docs/copy/critique-r<ROUND>-*.md carry the surviving objections;
       0 = none)
"""
import sys, os, re, json, html, glob
sys.path.insert(0, os.path.dirname(__file__))
import check

REPO = '/home/user/playable-papers'
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES = [('current', 'Current', 'baseline'), ('claim', 'Claim, then one gesture', 'draft-claim'),
          ('question', 'Questions the hand answers', 'draft-question'), ('rulesheet', 'Rulesheet', 'draft-rulesheet')]
PAGES = ['front'] + check.TOYS
CRITICS = [('editor', 'Fair copy editor', 'E'), ('phone', 'Phone reader', 'P'), ('academic', 'SMC academic', 'A'), ('cop', 'Length & consistency cop', 'C')]
LAYER_GROUPS = [  # (group title, which, headings or predicate)
  ('Front page', 'front', ['sub', 'what-is', 'blurb motif-memory', 'blurb markov', 'blurb statistical-feedback', 'blurb possibles']),
]
TOY_GROUPS = [
  ('Nameplate and previews', ['shows', 'meta.description', 'og.description']),
  ('Standing text', ['text', 'teaser.text', 'share']),
  ('Start line, desktop', lambda h: h.startswith('start.')),
  ('Start line, phone', lambda h: h.startswith('teaser.') and h != 'teaser.text'),
]
PHONE = {'shows', 'teaser.text', 'share'}
BUDGET = check.BUDGET_WORDS

def load(name):
    p = os.path.join(REPO, 'docs/copy', name + '.md')
    return check.parse(p) if os.path.exists(p) else {}

def meas(style):
    p = os.path.join(S, 'tools', ('baseline' if style == 'current' else 'draft-' + style) + '.meas.json')
    return json.load(open(p)) if os.path.exists(p) else {}

def md_inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'&lt;(/?)(b|i|em|strong|kbd)&gt;', r'<\1\2>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*', r'<em>\1</em>', t)
    t = t.replace('\n\n', '</p><p>')
    return '<p>' + t + '</p>'

def md_block(t):
    """A small markdown-to-HTML for the critics' prose sections: paragraphs, bullets, bold, code."""
    out, buf, inlist = [], [], False
    def flush():
        nonlocal buf
        if buf: out.append('<p>' + md_inline_text(' '.join(buf)) + '</p>'); buf = []
    for line in t.split('\n'):
        s = line.strip()
        if re.match(r'^(\d+\.|[-*])\s+', s):
            flush()
            if not inlist: out.append('<ul>'); inlist = True
            out.append('<li>' + md_inline_text(re.sub(r'^(\d+\.|[-*])\s+', '', s)) + '</li>')
        elif not s:
            flush()
            if inlist: out.append('</ul>'); inlist = False
        elif s.startswith('#'):
            flush()
            if inlist: out.append('</ul>'); inlist = False
            out.append('<h4>' + html.escape(s.lstrip('#').strip()) + '</h4>')
        else:
            if inlist and line.startswith(' '):
                out[-1] = out[-1][:-5] + ' ' + md_inline_text(s) + '</li>'
            else:
                if inlist: out.append('</ul>'); inlist = False
                buf.append(s)
    flush()
    if inlist: out.append('</ul>')
    return ''.join(out)

def md_inline_text(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*', r'<em>\1</em>', t)
    return t

def critic_prose(rnd):
    """[(critic label, section title, html)] for each critic's across/verdict sections."""
    out = []
    if not rnd: return out
    for key, label, letter in CRITICS:
        p = os.path.join(REPO, 'docs/copy', f'critique-r{rnd}-{key}.md')
        if not os.path.exists(p): continue
        t = open(p, encoding='utf-8').read()
        for m in re.finditer(r'^## (.*)$', t, re.M):
            title = m.group(1).strip()
            if not re.search(r'across|verdict|answers to', title, re.I): continue
            nxt = re.search(r'^## ', t[m.end():], re.M)
            body = t[m.end(): m.end() + nxt.start() if nxt else len(t)].strip()
            out.append((label, title, md_block(body)))
    return out

def infer_page(text):
    low = text.lower()
    for toy in check.TOYS:
        if toy in low: return toy
    if re.search(r'\b(front|blurb|sub\b|what-is)', low): return 'front'
    return '_'

def critiques(rnd):
    """{(draft, page): [[critic, id, text], ...]} from critique-r<N>-<critic>.md files."""
    out = {}
    if not rnd: return out
    for key, label, letter in CRITICS:
        p = os.path.join(REPO, 'docs/copy', f'critique-r{rnd}-{key}.md')
        if not os.path.exists(p): continue
        draft = page = None
        for line in open(p, encoding='utf-8'):
            line = line.rstrip('\n')
            if line.startswith('## '):
                h = line[3:].strip().lower()
                m = re.search(r'\b(claim|question|rulesheet)\b', h)
                if m and not h.startswith('answers'):
                    draft, page = m.group(1), '_auto'
                elif h.startswith('across'):
                    draft, page = '_across', '_'
                else:
                    draft = page = None
                continue
            if line.startswith('### ') and draft:
                h = line[4:].strip().lower()
                page = h if h in PAGES else infer_page(h)
                continue
            if draft and page and line.strip():
                m = re.match(r'^\s*(?:[-*]|\d+\.)?\s*\**\s*(' + letter + r'-[cqr]-\d+)\**[:.)]?\s*(.*)$', line)
                if m:
                    pg = infer_page(m.group(2)) if page == '_auto' else page
                    out.setdefault((draft, pg), []).append([key, m.group(1), m.group(2)])
                    last = (draft, pg)
                elif line.startswith('#'):
                    continue
                else:
                    try:
                        if out.get(last): out[last][-1][2] += '\n' + line.strip()
                    except NameError:
                        pass
    return out

def answers(d):
    """{ID: (status, why)} from a draft's `## answers` section."""
    out = {}
    txt = d.get('answers', {}).get('_', '') if isinstance(d.get('answers'), dict) else ''
    for line in txt.split('\n'):
        m = re.match(r'^\s*[-*]?\s*\**([EPAC]-[cqr]-\d+)\**\s*[:.]\s*(.*)$', line)
        if not m: continue
        rest = m.group(2).strip()
        low = rest.lower()
        status = 'refused' if low.startswith('refused') else ('taken, differently' if low.startswith('taken, differently') or low.startswith('taken differently') else ('taken' if low.startswith('taken') else 'answered'))
        out[m.group(1)] = (status, rest)
    return out

def cell(style, page, h, text, m):
    if text is None: return '<td class="c miss">—</td>'
    t = check.clean(text)
    if t in ('', 'none'):
        return f'<td class="c none">{"none" if t == "none" else "“”"}</td>'
    n = check.words(t); b = BUDGET.get('blurb' if h.startswith('blurb') else h)
    meta = []
    if b: meta.append(f'<span class="{"over" if n > b else ""}">{n}/{b} w</span>')
    if h.startswith('start.') or (h.startswith('teaser.') and h != 'teaser.text'):
        phone = h.startswith('teaser.')
        mm = m.get(page, {}) if m else {}
        full = t
        for k, v in check.SUB.items(): full = full.replace(k, v)
        if '.notStarted' in h: full += check.KEY[page][1 if phone else 0]
        lim = 102 if phone else 158
        cls = 'over' if len(full) > lim else ('tight' if len(full) > (92 if phone else 145) else '')
        meta.append(f'<span class="{cls}">{len(full)} ch</span>')
        w = '390' if phone else '1200'
        r = mm.get(w, {}).get(h)
        if r: meta.append('<span class="fit">fits</span>' if r['fits'] else '<span class="over">3 lines</span>')
    body = md_inline(t)
    return f'<td class="c"><div class="t">{body}</div><div class="m">{" · ".join(meta)}</div></td>'

def build(rnd):
    drafts = {s: load(f) for s, _, f in STYLES}
    ms = {s: meas(s) for s, _, _ in STYLES}
    crit = critiques(rnd)
    H = []
    H.append('<title>SMC26 Copy Comparison</title>')
    H.append('''<style>
/* layout: one table per page, layers as rows, four styles as columns; sticky heads; the toys' own dark palette, light variant for daylight */
:root{--bg:#f3f1ec;--ink:#111318;--dim:#4a4f5a;--faint:#8a8f99;--line:#d8d5cc;--line2:#bdb9ae;--card:#ffffff;--acc:#c25a00;--ok:#2f7d4a;--warn:#a36a00;--bad:#b3261e;--sel:#fff3e6;
 --f:ui-sans-serif,system-ui,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#070809;--ink:#ffffff;--dim:#d3d7df;--faint:#888d99;--line:#3a3d45;--line2:#5a5f6a;--card:#0f1114;--acc:#ff8a2b;--ok:#6fcf8a;--warn:#ffbe3d;--bad:#ff6b5e;--sel:#1a1410;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#070809;--ink:#ffffff;--dim:#d3d7df;--faint:#888d99;--line:#3a3d45;--line2:#5a5f6a;--card:#0f1114;--acc:#ff8a2b;--ok:#6fcf8a;--warn:#ffbe3d;--bad:#ff6b5e;--sel:#1a1410;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:13px/1.5 var(--f);font-variant-numeric:tabular-nums}
.wrap{max-width:1400px;margin:0 auto;padding-block:18px 80px;padding-inline:16px}
h1{font-size:17px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin:0}
.sub{color:var(--dim);font-size:12px;margin:6px 0 14px;max-width:80ch}
h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:34px 0 8px;border-bottom:1px solid var(--line);padding-bottom:6px}
h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:18px 0 6px;font-weight:600}
.tw{overflow-x:auto}
table{border-collapse:separate;border-spacing:0;width:100%;min-width:900px;table-layout:fixed}
th{position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);z-index:2;text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);padding:8px 8px;border-bottom:1px solid var(--line2)}
th.l{width:11ch}
td{vertical-align:top;border-bottom:1px solid var(--line);padding:8px 8px}
td.l{color:var(--faint);font:11px/1.4 var(--mono);word-break:break-word}
td.l .ph{display:inline-block;margin-top:3px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--acc)}
td.c .t p{margin:0 0 6px}
td.c .t p:last-child{margin:0}
td.c .m{margin-top:5px;font:10.5px/1.3 var(--mono);color:var(--faint)}
td.c .m .over{color:var(--bad);font-weight:700}
td.c .m .tight{color:var(--warn)}
td.c .m .fit{color:var(--ok)}
td.none,td.miss{color:var(--faint);font-style:italic}
td.c.sel{background:var(--sel);box-shadow:inset 3px 0 0 var(--acc)}
td.c{cursor:pointer}
td.c:focus-visible{outline:2px solid var(--acc);outline-offset:-2px}
.crit{margin:10px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.crit details{border:1px solid var(--line);border-radius:6px;padding:6px 10px;background:var(--card);min-width:0}
.crit summary{cursor:pointer;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}
.crit summary b{color:var(--ink)}
.crit li{margin:6px 0;font-size:12px;white-space:pre-wrap}
.crit li code{font:11px var(--mono);color:var(--acc)}
.crit li .badge{font:9.5px var(--mono);letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--line2);border-radius:4px;padding:1px 5px;color:var(--dim)}
.crit li .badge.refused{color:var(--bad);border-color:var(--bad)}
.crit li .badge.taken{color:var(--ok);border-color:var(--ok)}
.crit li.taken{opacity:.55}
.crit li .why{color:var(--dim);font-size:11.5px;margin-top:2px;padding-left:10px;border-left:2px solid var(--line)}
.prose details{border:1px solid var(--line);border-radius:6px;padding:6px 12px;background:var(--card);margin:8px 0;min-width:0}
.prose summary{cursor:pointer;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}
.prose summary b{color:var(--ink)}
.prose .pb{font-size:12.5px;max-width:78ch}
.prose .pb p,.prose .pb li{margin:6px 0}
.prose .pb h4{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:12px 0 4px}
.prose .pb code{font:11px var(--mono);color:var(--acc)}
.bar{position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line2);padding:8px 0 calc(8px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--dim)}
.bar button{font:inherit;font-size:12px;font-weight:600;background:var(--card);color:var(--ink);border:1px solid var(--line2);border-radius:6px;padding:6px 12px;cursor:pointer}
.bar button:focus-visible{outline:2px solid var(--acc)}
.bar .n{font:11px var(--mono)}
textarea#out{width:100%;min-height:120px;font:11px/1.4 var(--mono);background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;margin-top:8px}
.legend{font-size:11px;color:var(--faint);margin:8px 0 0}
.legend span{margin-right:14px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>''')
    H.append('<div class="wrap">')
    H.append('<h1>Playable Papers — SMC26 copy</h1>')
    rnd_note = f'the critics’ round-{rnd} objections with each writer’s answer (a refused one is a surviving objection)' if rnd else 'before the critics'
    H.append(f'<p class="sub">Three styles against the current copy, page by page and layer by layer; {rnd_note}. Tap a cell to pick it for that layer; your picks stay in this browser and the bar below turns them into a note to paste back.</p>')
    H.append('<p class="legend"><span><b>w</b> words / budget</span><span><b>ch</b> characters incl. the keyboard clause</span><span class="fit" style="color:var(--ok)">fits</span><span style="color:var(--bad)">3 lines</span> = measured on the real page at 1200 px (desktop) / 390 px (phone)</p>')
    for page in PAGES:
        H.append(f'<h2 id="{page}">{page}</h2>')
        groups = [(g[0], g[2]) for g in LAYER_GROUPS] if page == 'front' else TOY_GROUPS
        for gtitle, which in groups:
            heads = []
            for s, _, _ in STYLES:
                for h in drafts[s].get(page, {}):
                    if (callable(which) and which(h)) or (not callable(which) and h in which):
                        if h not in heads: heads.append(h)
            if not heads: continue
            H.append(f'<h3>{gtitle}</h3><div class="tw"><table><thead><tr><th class="l">layer</th>')
            for s, label, _ in STYLES: H.append(f'<th>{label}</th>')
            H.append('</tr></thead><tbody>')
            for h in heads:
                ph = '<span class="ph">phone</span>' if (h in PHONE or (h.startswith('teaser.'))) else ''
                H.append(f'<tr data-key="{page}|{h}"><td class="l">{h}{ph}</td>')
                for s, _, _ in STYLES:
                    H.append(cell(s, page, h, drafts[s].get(page, {}).get(h), ms[s]).replace('<td class="c', f'<td tabindex="0" data-style="{s}" class="c', 1))
                H.append('</tr>')
            H.append('</tbody></table></div>')
        # critics
        blocks = []
        for s, label, _ in STYLES[1:]:
            items = crit.get((s, page), [])
            if not items: continue
            ans = answers(drafts[s])
            li = []; nref = 0
            for i in items:
                st, why = ans.get(i[1], ('unanswered', ''))
                if st == 'refused': nref += 1
                badge = f'<span class="badge {st.split(",")[0]}">{html.escape(st)}</span>'
                whyh = f'<div class="why">{html.escape(why)}</div>' if why and st != 'taken' else ''
                li.append(f'<li class="{st.split(",")[0]}"><code>{html.escape(i[1])}</code> {badge} <span class="who">{dict((k, l) for k, l, _ in CRITICS)[i[0]]}:</span> {html.escape(i[2])}{whyh}</li>')
            blocks.append(f'<details{" open" if nref else ""}><summary><b>{label}</b> · {len(items)} objection{"s" if len(items) != 1 else ""}, {nref} refused</summary><ul>{"".join(li)}</ul></details>')
        if blocks: H.append('<div class="crit">' + ''.join(blocks) + '</div>')
    # the writers' own notes: budget breaches declared, choices left to the author
    notes = []
    for s, label, _ in STYLES[1:]:
        n = drafts[s].get('notes', {}).get('_', '') if isinstance(drafts[s].get('notes'), dict) else ''
        if n.strip(): notes.append((label, md_block(n)))
    if notes:
        H.append('<h2 id="notes">the writers’ notes: choices for the author</h2><div class="prose">')
        for label, body in notes:
            H.append(f'<details><summary><b>{html.escape(label)}</b> · notes</summary><div class="pb">{body}</div></details>')
        H.append('</div>')
    prose = critic_prose(rnd)
    if prose:
        H.append('<h2 id="critics">the critics, across the drafts</h2><div class="prose">')
        for label, title, body in prose:
            H.append(f'<details><summary><b>{html.escape(label)}</b> · {html.escape(title)}</summary><div class="pb">{body}</div></details>')
        H.append('</div>')
    across = crit.get(('_across', '_'), [])
    for s, label, _ in STYLES[1:]:
        for i in crit.get((s, '_'), []): across.append([i[0], i[1] + ' (' + label + ')', i[2]])
    if across:
        H.append('<h2>across the drafts</h2><div class="crit"><details open><summary><b>All critics</b></summary><ul>' + ''.join(f'<li><code>{html.escape(i[1])}</code> {html.escape(i[2])}</li>' for i in across) + '</ul></details></div>')
    H.append('''<div class="bar"><button id="export" type="button">Picks as a note</button><button id="clear" type="button">Clear picks</button><span class="n" id="count"></span></div><textarea id="out" hidden aria-label="your picks"></textarea></div>
<script>
(function(){
  var KEY='pp-smc26-picks', picks={};
  try{picks=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){picks={}}
  function paint(){
    document.querySelectorAll('tr[data-key]').forEach(function(tr){
      var k=tr.dataset.key; tr.querySelectorAll('td.c').forEach(function(td){td.classList.toggle('sel',picks[k]===td.dataset.style)});
    });
    var n=Object.keys(picks).length; document.getElementById('count').textContent=n?n+' layer'+(n>1?'s':'')+' picked':'no picks yet';
  }
  document.querySelectorAll('td.c').forEach(function(td){
    function pick(){var k=td.parentNode.dataset.key; if(picks[k]===td.dataset.style) delete picks[k]; else picks[k]=td.dataset.style; try{localStorage.setItem(KEY,JSON.stringify(picks))}catch(e){} paint();}
    td.addEventListener('click',pick); td.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
  });
  document.getElementById('export').addEventListener('click',function(){
    var lines=['# picks'], by={};
    Object.keys(picks).forEach(function(k){var p=k.split('|');(by[p[0]]=by[p[0]]||[]).push(p[1]+': '+picks[k])});
    Object.keys(by).forEach(function(pg){lines.push('## '+pg);by[pg].forEach(function(l){lines.push('- '+l)})});
    var ta=document.getElementById('out'); ta.hidden=false; ta.value=lines.join('\\n'); ta.focus(); ta.select();
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).catch(function(){})}
  });
  document.getElementById('clear').addEventListener('click',function(){picks={};try{localStorage.removeItem(KEY)}catch(e){}paint();});
  paint();
})();
</script>''')
    return '\n'.join(H)

if __name__ == '__main__':
    out, rnd = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 0
    open(out, 'w', encoding='utf-8').write(build(rnd))
    print('wrote', out, os.path.getsize(out), 'bytes')

// Measures candidate start-line sentences against the reserve of .pp-start,
// the way lib/page.js checkFit does, at desktop (1200) and phone (390) widths.
// usage: node measure.js budget            -> longest filler that fits, per toy/width
//        node measure.js check file.json   -> {"toy":{"label":"sentence",...}} ; reports fit
const { chromium } = require('playwright');
const fs = require('fs');
const TOYS = ['motif-memory', 'markov', 'statistical-feedback', 'possibles'];
const WIDTHS = [1200, 390];
const BASE = 'http://127.0.0.1:8765/toys/';
const FILLER = 'press ▶ Play, or the Space bar, and one option is chosen on every turn, then turn a weight up and listen for the grain of it coming and going again and again ';
(async () => {
  const mode = process.argv[2] || 'budget';
  const cand = mode === 'check' ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium/chrome-linux/chrome' }).catch(() => chromium.launch());
  const out = {};
  for (const toy of TOYS) {
    out[toy] = {};
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 } });
      page.on('console', () => {});
      await page.goto(BASE + toy + '/', { waitUntil: 'load' });
      await page.waitForSelector('.pp-start', { timeout: 10000 });
      const fits = async (text) => page.evaluate((t) => {
        const el = document.querySelector('.pp-start');
        const reserve = parseFloat(getComputedStyle(el).minHeight);
        const keep = el.textContent;
        el.textContent = t;
        const h = el.getBoundingClientRect().height;
        el.textContent = keep;
        return { fits: h <= reserve + 0.5, h, reserve, width: el.getBoundingClientRect().width };
      }, text);
      if (mode === 'budget') {
        let lo = 20, hi = 400;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; const r = await fits(FILLER.repeat(3).slice(0, mid)); if (r.fits) lo = mid; else hi = mid - 1; }
        const r = await fits(FILLER.repeat(3).slice(0, lo));
        out[toy][w] = { maxChars: lo, lineWidthPx: Math.round(r.width), reservePx: r.reserve };
      } else {
        out[toy][w] = {};
        for (const [label, text] of Object.entries(cand[toy] || {})) {
          const r = await fits(text);
          out[toy][w][label] = { fits: r.fits, chars: text.length, heightPx: +r.h.toFixed(1), reservePx: r.reserve };
        }
      }
      await page.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });

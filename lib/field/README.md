# lib/field — the field kit's material

Eight field recordings by Jean-Philippe Drecourt (CC0 with the collection), each standing in for one drum id of the built-in palette: `kit.json` holds one line per clip with its `standsFor`, its loudness trim and its provenance.
The WAVs (16-bit mono 44.1 kHz, onset-aligned, peaked to 0.9) are the material: `tools/pack-field-kit.py` reads them and writes `lib/field-kit-data.js`, which is what the pages load.
To re-cut a clip, go back to the archive file `kit.json` names (`archive`, `start_ms`, `len_s`), cut, fade and peak it, and replace the WAV under the same id.
To remap a drum, edit its line's `standsFor`; to re-balance, edit `trim_db` (decibels applied at decode, downward to the quietest clip).
Then regenerate with `python tools/pack-field-kit.py` and commit the WAVs, `kit.json` and the data file together.

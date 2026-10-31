# Playable Ideas

Browser audio toys, each built around one mechanism, served at [play.noisewrangler.art](https://play.noisewrangler.art). Vanilla JavaScript and Web Audio on a shared library (`lib/`); no build step.

- **motif-memory** — memory is a state of a voice, not a structure beside the ensemble.
- **markov** — a first-order chain gives every state exactly one future: a local grammar, and no phrase.
- **statistical-feedback** — dice have no memory, and the ear hears the difference.
- **possibles** — existing and mattering are different questions, and an instrument can let you answer them one at a time.

The drum toys carry a second kit: eight field recordings standing in for the drum sounds, behind a `sounds` switch in the master strip. The recordings are in `lib/field/` with their provenance, and `tools/pack-field-kit.py` packs them into the script the pages load.

Every toy has a `spec.md` beside its page, written so an agent can rebuild the mechanism from it alone in another language, framework or hardware; `llms.txt` indexes them.

CC0 — see `LICENSE`. This repository is the export of a private working repository; changes are made there. By [noisewrangler.art](https://noisewrangler.art).

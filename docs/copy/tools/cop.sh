#!/bin/bash
# usage: cop.sh docs/copy/draft-claim.md  -> writes docs/copy/<name>.cop.md
set -e
S=/tmp/claude-0/-home-user-playable-papers/d8a9352f-2422-57f2-a748-8c2fbbc1c1ae/scratchpad
cd /home/user/playable-papers
f="$1"; b=$(basename "$f" .md)
python3 -I $S/tools/check.py candidates "$f" > $S/tools/$b.cand.json
(cd $S/tools && NODE_PATH=/opt/node22/lib/node_modules node measure.js check $S/tools/$b.cand.json > $S/tools/$b.meas.json)
python3 -I $S/tools/check.py report "$f" $S/tools/$b.meas.json

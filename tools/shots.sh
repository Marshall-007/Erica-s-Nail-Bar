#!/usr/bin/env bash
# Capture review screenshots of the local site with headless Chrome.
#   bash tools/shots.sh <outdir> [mobile|desktop|both]
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="${1:?output dir}"; MODE="${2:-both}"; BASE="http://localhost:4321/"
mkdir -p "$OUT"
SECTIONS=(top about services builder work booking policy visit)

shoot() { # shoot <w> <h> <dsf> <label>
  local w=$1 h=$2 d=$3 label=$4
  for s in "${SECTIONS[@]}"; do
    local url="$BASE?noanim=1"; [ "$s" != "top" ] && url="$BASE?noanim=1#$s"
    "$CHROME" --headless --disable-gpu --hide-scrollbars \
      --force-device-scale-factor="$d" --window-size="$w,$h" \
      --virtual-time-budget=6000 \
      --screenshot="$OUT/${label}-${s}.png" "$url" >/dev/null 2>&1
  done
  echo "  ✓ $label"
}

[ "$MODE" = "mobile"  ] || [ "$MODE" = "both" ] && shoot 390 844  2 mobile
[ "$MODE" = "desktop" ] || [ "$MODE" = "both" ] && shoot 1440 900 1 desktop
echo "shots in $OUT"

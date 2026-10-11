#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  Erica's Nail Bar image pipeline
#  Regenerates every web image in assets/img/ from the originals in
#  source-images/.  Safe to re-run at any time.
#
#  Usage:  bash tools/build-images.sh
#  Needs:  ImageMagick 7 (`magick`) and cwebp.
#
#  Each photo is (1) gently graded, (2) hand-cropped to a consistent frame so
#  the nails always sit in the same part of the card, and (3) written out as
#  WebP (primary) + JPEG (fallback) at two widths for a responsive srcset.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="source-images"
OUT="assets/img"
mkdir -p "$OUT"

# Gentle editorial grade: recover levels, a touch of saturation, a soft
# S-curve, and a light unsharp pass so phone photos read as crisp on retina.
GRADE=(-auto-orient -contrast-stretch 0.15%x0.02% -modulate 100.5,102.5,100
       -sigmoidal-contrast 1.8x50% -unsharp 0x0.9+0.5+0.02)

# render <source> <crop WxH+X+Y> <out-name> <width-1> <width-2>
render() {
  local src="$SRC/$1" crop="$2" name="$3" w1="$4" w2="$5"
  local tmp; tmp="$(mktemp -t enb).png"
  magick "$src" "${GRADE[@]}" -crop "$crop" +repage "$tmp"
  for w in "$w1" "$w2"; do
    magick "$tmp" -resize "${w}x" -strip -quality 90 "$OUT/$name-$w.jpg"
    cwebp -quiet -q 82 -m 6 -sharp_yuv "$OUT/$name-$w.jpg" -o "$OUT/$name-$w.webp"
  done
  rm -f "$tmp"
  echo "  ✓ $name  (${w1}w, ${w2}w)"
}

echo "▸ Showcase: 4:5 portrait cards"
#        source file                      crop 4:5              name              widths
render "nails-ocean-pearl.jpeg"        "960x1200+0+0"     "ocean-pearl"       640 1100
render "nails-natural-gel.jpeg"        "640x800+380+40"      "natural-gel"       640 1100
render "nails-autumn-chrome.jpeg"      "1024x1280+128+0"  "autumn-chrome"     640 1100
render "nails-nail-diary.jpeg"         "560x700+400+120"     "nail-diary"        640 1100
render "nails-studio-hands.jpeg"       "720x900+0+260"    "studio-hands"      640 1100
render "nails-rouge-marble.jpeg"       "864x1080+180+0"   "rouge-marble"      640 1100
render "nails-midnight-glitter.jpeg"   "960x1200+0+40"    "midnight-glitter"  640 1100
render "nails-lilac-swirl.jpeg"        "800x1000+220+60"    "lilac-swirl"       640 1100
render "nails-sunshine-bloom.jpeg"     "720x900+0+240"    "sunshine-bloom"    640 1100
render "nails-wild-rose.jpeg"          "700x875+150+30"     "wild-rose"         640 1100
render "nails-blossom-kiss.jpeg"       "960x1200+0+60"    "blossom-kiss"      640 1100
render "nails-garden-bloom.jpeg"       "960x1200+0+40"    "garden-bloom"      640 1100
render "nails-lilac-french.jpeg"       "860x1075+50+205"     "lilac-french"      640 1100
render "nails-gold-star-french.jpeg"   "768x960+256+0"    "gold-star-french"  640 1100

# October 2026 sets. Each look has two extra angles that feed the scrolling
# band; the first of each trio is the one the gallery card uses.
render "nails-noir-safari.jpeg"         "560x700+120+195"    "noir-safari"          640 1100
render "nails-noir-safari-board.jpeg"   "720x900+0+130"    "noir-safari-board"    640 1100
render "nails-noir-safari-welcome.jpeg" "600x750+260+0"     "noir-safari-welcome"  640 1100
render "nails-cherry-dot.jpeg"          "800x1000+150+40"  "cherry-dot"           640 1100
render "nails-cherry-dot-studio.jpeg"   "800x1000+180+20"  "cherry-dot-studio"    640 1100
render "nails-cherry-dot-board.jpeg"    "640x800+350+0"     "cherry-dot-board"     640 1100
render "nails-wild-pearl.jpeg"          "720x900+0+330"    "wild-pearl"           640 1100
render "nails-wild-pearl-polka.jpeg"    "720x900+0+300"    "wild-pearl-polka"     640 1100
render "nails-wild-pearl-agate.jpeg"    "600x750+0+515"      "wild-pearl-agate"     640 1100

echo "▸ Storytelling"
# The letter-board shot, used in the welcome section.
render "nails-welcome-board.jpeg"      "720x900+0+330"    "welcome-board"     640 1100

echo "▸ Hero: art directed per breakpoint"
# Portrait 2:3 for phones (soft pink + gold ombré, brand colours).
render "nails-blossom-kiss.jpeg"       "720x1280+115+0"   "hero-portrait"     720 1080
# Landscape 16:9 for tablets/desktop (magenta French tips + gold charms).
render "nails-gold-star-french.jpeg"   "1280x720+0+170"   "hero-wide"        1100 1600
# Wide band used as a parallax divider.
render "nails-autumn-chrome.jpeg"      "1280x520+0+380"   "band-chrome"       900 1600

echo "▸ Brand marks"
# Full logo, background already knocked out to transparency.
magick assets/brand/logo-full.png -resize 760x -strip "$OUT/logo-760.png"
cwebp -quiet -q 90 -m 6 -alpha_q 100 "$OUT/logo-760.png" -o "$OUT/logo-760.webp"
magick assets/brand/logo-full.png -resize 380x -strip "$OUT/logo-380.png"
cwebp -quiet -q 90 -m 6 -alpha_q 100 "$OUT/logo-380.png" -o "$OUT/logo-380.webp"
echo "  ✓ logo (380w, 760w)"

echo
echo "Done: $(ls "$OUT" | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1) total."

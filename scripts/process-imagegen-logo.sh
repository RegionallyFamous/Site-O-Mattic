#!/bin/sh
set -eu

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <source.png> <logo.png> <favicon.png> <key-color> [fuzz-percent]" >&2
  exit 64
fi

source_png="$1"
logo_png="$2"
favicon_png="$3"
key_color="$4"
fuzz="${5:-20}"

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick 'magick' is required to process ImageGen raster logos." >&2
  exit 69
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/site-o-mattic-logo.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT HUP INT TERM
mkdir -p "$(dirname "$logo_png")" "$(dirname "$favicon_png")"

base="$(basename "$logo_png" .png)"
alpha_png="$tmp_dir/$base-alpha.png"
trimmed_png="$tmp_dir/$base-trimmed.png"
favicon_crop_png="$tmp_dir/$base-favicon-crop.png"

magick "$source_png" -alpha set -fuzz "${fuzz}%" -transparent "$key_color" "$alpha_png"
magick "$alpha_png" -trim +repage "$trimmed_png"
magick "$trimmed_png" -resize '940x270>' -background none -gravity center -extent 1000x300 -strip "$logo_png"

dimensions="$(magick identify -format '%w %h' "$trimmed_png")"
width="$(printf '%s' "$dimensions" | awk '{print $1}')"
height="$(printf '%s' "$dimensions" | awk '{print $2}')"
square="$height"
if [ "$width" -lt "$square" ]; then
  square="$width"
fi

magick "$trimmed_png" -gravity west -crop "${square}x${square}+0+0" +repage "$favicon_crop_png"
magick "$favicon_crop_png" -resize '360x360>' -background none -gravity center -extent 384x384 -strip "$favicon_png"

if command -v pngquant >/dev/null 2>&1; then
  pngquant --force --skip-if-larger --quality=60-85 --speed 1 --output "$logo_png" "$logo_png" || true
  pngquant --force --skip-if-larger --quality=55-80 --speed 1 --output "$favicon_png" "$favicon_png" || true
fi

echo "Wrote $logo_png and $favicon_png from $source_png"

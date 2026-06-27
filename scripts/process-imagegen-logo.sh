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

tmp_dir="$(dirname "$logo_png")/generated"
mkdir -p "$tmp_dir" "$(dirname "$favicon_png")"

base="$(basename "$logo_png" .png)"
alpha_png="$tmp_dir/$base-alpha.png"
trimmed_png="$tmp_dir/$base-trimmed.png"
favicon_crop_png="$tmp_dir/$base-favicon-crop.png"

magick "$source_png" -alpha set -fuzz "${fuzz}%" -transparent "$key_color" "$alpha_png"
magick "$alpha_png" -trim +repage "$trimmed_png"
magick "$trimmed_png" -resize '1100x220>' -background none -gravity center -extent 1200x260 "$logo_png"

dimensions="$(magick identify -format '%w %h' "$trimmed_png")"
width="$(printf '%s' "$dimensions" | awk '{print $1}')"
height="$(printf '%s' "$dimensions" | awk '{print $2}')"
square="$height"
if [ "$width" -lt "$square" ]; then
  square="$width"
fi

magick "$trimmed_png" -gravity west -crop "${square}x${square}+0+0" +repage "$favicon_crop_png"
magick "$favicon_crop_png" -resize '420x420>' -background none -gravity center -extent 512x512 "$favicon_png"

echo "Wrote $logo_png and $favicon_png from $source_png"

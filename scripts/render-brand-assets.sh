#!/bin/sh
set -eu

echo "render-brand is deprecated for Site-O-Mattic production logos." >&2
echo "Logos are now ImageGen-made raster PNG assets; do not regenerate them from SVG." >&2
echo "Use scripts/process-imagegen-logo.sh for chroma-key cleanup and sizing." >&2
exit 1

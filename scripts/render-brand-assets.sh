#!/bin/sh
set -eu

rsvg-convert -w 1200 -h 347 assets/lawn-care/greenstripe-logo.svg -o assets/lawn-care/greenstripe-logo.png
rsvg-convert -w 512 -h 512 assets/lawn-care/greenstripe-favicon.svg -o assets/lawn-care/greenstripe-favicon.png
rsvg-convert -w 1200 -h 300 assets/pressure-washing/brightjet-logo.svg -o assets/pressure-washing/brightjet-logo.png
rsvg-convert -w 512 -h 512 assets/pressure-washing/brightjet-favicon.svg -o assets/pressure-washing/brightjet-favicon.png

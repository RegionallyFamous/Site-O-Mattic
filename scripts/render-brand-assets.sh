#!/bin/sh
set -eu

rsvg-convert -w 1200 -h 347 assets/lawn-care/greenstripe-logo.svg -o assets/lawn-care/greenstripe-logo.png
rsvg-convert -w 512 -h 512 assets/lawn-care/greenstripe-favicon.svg -o assets/lawn-care/greenstripe-favicon.png

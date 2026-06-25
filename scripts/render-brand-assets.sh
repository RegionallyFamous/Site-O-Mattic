#!/bin/sh
set -eu

rsvg-convert -w 1200 -h 260 assets/lawn-care/greenstripe-logo.svg -o assets/lawn-care/greenstripe-logo.png
rsvg-convert -w 512 -h 512 assets/lawn-care/greenstripe-favicon.svg -o assets/lawn-care/greenstripe-favicon.png
rsvg-convert -w 1200 -h 260 assets/pressure-washing/brightjet-logo.svg -o assets/pressure-washing/brightjet-logo.png
rsvg-convert -w 512 -h 512 assets/pressure-washing/brightjet-favicon.svg -o assets/pressure-washing/brightjet-favicon.png
rsvg-convert -w 1200 -h 260 assets/window-cleaning/clearpane-logo.svg -o assets/window-cleaning/clearpane-logo.png
rsvg-convert -w 512 -h 512 assets/window-cleaning/clearpane-favicon.svg -o assets/window-cleaning/clearpane-favicon.png
rsvg-convert -w 1200 -h 260 assets/gutter-cleaning/clearflow-logo.svg -o assets/gutter-cleaning/clearflow-logo.png
rsvg-convert -w 512 -h 512 assets/gutter-cleaning/clearflow-favicon.svg -o assets/gutter-cleaning/clearflow-favicon.png
rsvg-convert -w 1200 -h 260 assets/pollinator-garden/bloomroute-logo.svg -o assets/pollinator-garden/bloomroute-logo.png
rsvg-convert -w 512 -h 512 assets/pollinator-garden/bloomroute-favicon.svg -o assets/pollinator-garden/bloomroute-favicon.png
rsvg-convert -w 1200 -h 260 assets/driveway-sealcoating/blackline-logo.svg -o assets/driveway-sealcoating/blackline-logo.png
rsvg-convert -w 512 -h 512 assets/driveway-sealcoating/blackline-favicon.svg -o assets/driveway-sealcoating/blackline-favicon.png
rsvg-convert -w 1200 -h 260 assets/carpet-upholstery/freshthread-logo.svg -o assets/carpet-upholstery/freshthread-logo.png
magick assets/carpet-upholstery/freshthread-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/carpet-upholstery/freshthread-logo.png
rsvg-convert -w 512 -h 512 assets/carpet-upholstery/freshthread-favicon.svg -o assets/carpet-upholstery/freshthread-favicon.png
rsvg-convert -w 1200 -h 260 assets/junk-removal/clearpath-logo.svg -o assets/junk-removal/clearpath-logo.png
magick assets/junk-removal/clearpath-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/junk-removal/clearpath-logo.png
rsvg-convert -w 512 -h 512 assets/junk-removal/clearpath-favicon.svg -o assets/junk-removal/clearpath-favicon.png
rsvg-convert -w 1200 -h 260 assets/coffee-cart/cartwright-logo.svg -o assets/coffee-cart/cartwright-logo.png
magick assets/coffee-cart/cartwright-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/coffee-cart/cartwright-logo.png
rsvg-convert -w 512 -h 512 assets/coffee-cart/cartwright-favicon.svg -o assets/coffee-cart/cartwright-favicon.png
rsvg-convert -w 1200 -h 260 assets/mobile-detailing/shineshift-logo.svg -o assets/mobile-detailing/shineshift-logo.png
magick assets/mobile-detailing/shineshift-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/mobile-detailing/shineshift-logo.png
rsvg-convert -w 512 -h 512 assets/mobile-detailing/shineshift-favicon.svg -o assets/mobile-detailing/shineshift-favicon.png

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
rsvg-convert -w 1200 -h 260 assets/deck-fence-staining/cedarline-logo.svg -o assets/deck-fence-staining/cedarline-logo.png
magick assets/deck-fence-staining/cedarline-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/deck-fence-staining/cedarline-logo.png
rsvg-convert -w 512 -h 512 assets/deck-fence-staining/cedarline-favicon.svg -o assets/deck-fence-staining/cedarline-favicon.png
rsvg-convert -w 1200 -h 260 assets/pool-cleaning/bluelane-logo.svg -o assets/pool-cleaning/bluelane-logo.png
magick assets/pool-cleaning/bluelane-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/pool-cleaning/bluelane-logo.png
rsvg-convert -w 512 -h 512 assets/pool-cleaning/bluelane-favicon.svg -o assets/pool-cleaning/bluelane-favicon.png
rsvg-convert -w 1200 -h 260 assets/garage-organization/gridnest-logo.svg -o assets/garage-organization/gridnest-logo.png
magick assets/garage-organization/gridnest-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/garage-organization/gridnest-logo.png
rsvg-convert -w 512 -h 512 assets/garage-organization/gridnest-favicon.svg -o assets/garage-organization/gridnest-favicon.png
rsvg-convert -w 1200 -h 260 assets/holiday-light-installation/ridgeglow-logo.svg -o assets/holiday-light-installation/ridgeglow-logo.png
magick assets/holiday-light-installation/ridgeglow-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/holiday-light-installation/ridgeglow-logo.png
rsvg-convert -w 512 -h 512 assets/holiday-light-installation/ridgeglow-favicon.svg -o assets/holiday-light-installation/ridgeglow-favicon.png
rsvg-convert -w 1200 -h 260 assets/solar-panel-cleaning/sunwash-logo.svg -o assets/solar-panel-cleaning/sunwash-logo.png
magick assets/solar-panel-cleaning/sunwash-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/solar-panel-cleaning/sunwash-logo.png
rsvg-convert -w 512 -h 512 assets/solar-panel-cleaning/sunwash-favicon.svg -o assets/solar-panel-cleaning/sunwash-favicon.png
rsvg-convert -w 1200 -h 260 assets/smart-home-setup/signalnest-logo.svg -o assets/smart-home-setup/signalnest-logo.png
magick assets/smart-home-setup/signalnest-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/smart-home-setup/signalnest-logo.png
rsvg-convert -w 512 -h 512 assets/smart-home-setup/signalnest-favicon.svg -o assets/smart-home-setup/signalnest-favicon.png
rsvg-convert -w 1200 -h 260 assets/mobile-bicycle-repair/tuneloop-logo.svg -o assets/mobile-bicycle-repair/tuneloop-logo.png
magick assets/mobile-bicycle-repair/tuneloop-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/mobile-bicycle-repair/tuneloop-logo.png
rsvg-convert -w 512 -h 512 assets/mobile-bicycle-repair/tuneloop-favicon.svg -o assets/mobile-bicycle-repair/tuneloop-favicon.png
rsvg-convert -w 1200 -h 260 assets/mobile-knife-sharpening/edgeroute-logo.svg -o assets/mobile-knife-sharpening/edgeroute-logo.png
magick assets/mobile-knife-sharpening/edgeroute-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/mobile-knife-sharpening/edgeroute-logo.png
rsvg-convert -w 512 -h 512 assets/mobile-knife-sharpening/edgeroute-favicon.svg -o assets/mobile-knife-sharpening/edgeroute-favicon.png
rsvg-convert -w 1200 -h 260 assets/closet-pantry-organization/shelfwise-logo.svg -o assets/closet-pantry-organization/shelfwise-logo.png
magick assets/closet-pantry-organization/shelfwise-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/closet-pantry-organization/shelfwise-logo.png
rsvg-convert -w 512 -h 512 assets/closet-pantry-organization/shelfwise-favicon.svg -o assets/closet-pantry-organization/shelfwise-favicon.png
rsvg-convert -w 1200 -h 260 assets/senior-downsizing-move-prep/kindmove-logo.svg -o assets/senior-downsizing-move-prep/kindmove-logo.png
magick assets/senior-downsizing-move-prep/kindmove-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/senior-downsizing-move-prep/kindmove-logo.png
rsvg-convert -w 512 -h 512 assets/senior-downsizing-move-prep/kindmove-favicon.svg -o assets/senior-downsizing-move-prep/kindmove-favicon.png
rsvg-convert -w 1200 -h 260 assets/vacation-rental-turnover/turnkeytidy-logo.svg -o assets/vacation-rental-turnover/turnkeytidy-logo.png
magick assets/vacation-rental-turnover/turnkeytidy-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/vacation-rental-turnover/turnkeytidy-logo.png
rsvg-convert -w 512 -h 512 assets/vacation-rental-turnover/turnkeytidy-favicon.svg -o assets/vacation-rental-turnover/turnkeytidy-favicon.png
rsvg-convert -w 1200 -h 260 assets/plant-care/leafdesk-logo.svg -o assets/plant-care/leafdesk-logo.png
magick assets/plant-care/leafdesk-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/plant-care/leafdesk-logo.png
rsvg-convert -w 512 -h 512 assets/plant-care/leafdesk-favicon.svg -o assets/plant-care/leafdesk-favicon.png
rsvg-convert -w 1200 -h 260 assets/pet-portrait-photography/brightpaw-logo.svg -o assets/pet-portrait-photography/brightpaw-logo.png
magick assets/pet-portrait-photography/brightpaw-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/pet-portrait-photography/brightpaw-logo.png
rsvg-convert -w 512 -h 512 assets/pet-portrait-photography/brightpaw-favicon.svg -o assets/pet-portrait-photography/brightpaw-favicon.png
rsvg-convert -w 1200 -h 260 assets/wood-fired-pizza-taco-catering/embermasa-logo.svg -o assets/wood-fired-pizza-taco-catering/embermasa-logo.png
magick assets/wood-fired-pizza-taco-catering/embermasa-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/wood-fired-pizza-taco-catering/embermasa-logo.png
rsvg-convert -w 512 -h 512 assets/wood-fired-pizza-taco-catering/embermasa-favicon.svg -o assets/wood-fired-pizza-taco-catering/embermasa-favicon.png
rsvg-convert -w 1200 -h 260 assets/dessert-table-bakery-catering/sugarline-logo.svg -o assets/dessert-table-bakery-catering/sugarline-logo.png
magick assets/dessert-table-bakery-catering/sugarline-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/dessert-table-bakery-catering/sugarline-logo.png
rsvg-convert -w 512 -h 512 assets/dessert-table-bakery-catering/sugarline-favicon.svg -o assets/dessert-table-bakery-catering/sugarline-favicon.png
rsvg-convert -w 1200 -h 260 assets/balloon-garland-party-backdrop/poparc-logo.svg -o assets/balloon-garland-party-backdrop/poparc-logo.png
magick assets/balloon-garland-party-backdrop/poparc-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/balloon-garland-party-backdrop/poparc-logo.png
rsvg-convert -w 512 -h 512 assets/balloon-garland-party-backdrop/poparc-favicon.svg -o assets/balloon-garland-party-backdrop/poparc-favicon.png
rsvg-convert -w 1200 -h 260 assets/micro-wedding-florals/vowsprig-logo.svg -o assets/micro-wedding-florals/vowsprig-logo.png
magick assets/micro-wedding-florals/vowsprig-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/micro-wedding-florals/vowsprig-logo.png
rsvg-convert -w 512 -h 512 assets/micro-wedding-florals/vowsprig-favicon.svg -o assets/micro-wedding-florals/vowsprig-favicon.png
rsvg-convert -w 1200 -h 260 assets/photo-booth-rental/flashdash-logo.svg -o assets/photo-booth-rental/flashdash-logo.png
magick assets/photo-booth-rental/flashdash-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/photo-booth-rental/flashdash-logo.png
rsvg-convert -w 512 -h 512 assets/photo-booth-rental/flashdash-favicon.svg -o assets/photo-booth-rental/flashdash-favicon.png
rsvg-convert -w 1200 -h 260 assets/small-event-dj-sound/soundnest-logo.svg -o assets/small-event-dj-sound/soundnest-logo.png
magick assets/small-event-dj-sound/soundnest-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/small-event-dj-sound/soundnest-logo.png
rsvg-convert -w 512 -h 512 assets/small-event-dj-sound/soundnest-favicon.svg -o assets/small-event-dj-sound/soundnest-favicon.png
rsvg-convert -w 1200 -h 260 assets/picnic-proposal-setup/linenlantern-logo.svg -o assets/picnic-proposal-setup/linenlantern-logo.png
magick assets/picnic-proposal-setup/linenlantern-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/picnic-proposal-setup/linenlantern-logo.png
rsvg-convert -w 512 -h 512 assets/picnic-proposal-setup/linenlantern-favicon.svg -o assets/picnic-proposal-setup/linenlantern-favicon.png
rsvg-convert -w 1200 -h 260 assets/mocktail-beverage-cart/spritzloop-logo.svg -o assets/mocktail-beverage-cart/spritzloop-logo.png
magick assets/mocktail-beverage-cart/spritzloop-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/mocktail-beverage-cart/spritzloop-logo.png
rsvg-convert -w 512 -h 512 assets/mocktail-beverage-cart/spritzloop-favicon.svg -o assets/mocktail-beverage-cart/spritzloop-favicon.png
rsvg-convert -w 1200 -h 260 assets/headshot-brand-photography/frameforge-logo.svg -o assets/headshot-brand-photography/frameforge-logo.png
magick assets/headshot-brand-photography/frameforge-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/headshot-brand-photography/frameforge-logo.png
rsvg-convert -w 512 -h 512 assets/headshot-brand-photography/frameforge-favicon.svg -o assets/headshot-brand-photography/frameforge-favicon.png
rsvg-convert -w 1200 -h 260 assets/mural-window-lettering-artist/letterloom-logo.svg -o assets/mural-window-lettering-artist/letterloom-logo.png
magick assets/mural-window-lettering-artist/letterloom-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/mural-window-lettering-artist/letterloom-logo.png
rsvg-convert -w 512 -h 512 assets/mural-window-lettering-artist/letterloom-favicon.svg -o assets/mural-window-lettering-artist/letterloom-favicon.png
rsvg-convert -w 1200 -h 260 assets/interior-color-consultant/huehaus-logo.svg -o assets/interior-color-consultant/huehaus-logo.png
magick assets/interior-color-consultant/huehaus-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/interior-color-consultant/huehaus-logo.png
rsvg-convert -w 512 -h 512 assets/interior-color-consultant/huehaus-favicon.svg -o assets/interior-color-consultant/huehaus-favicon.png
rsvg-convert -w 1200 -h 260 assets/furniture-refinishing-repair/grainmend-logo.svg -o assets/furniture-refinishing-repair/grainmend-logo.png
magick assets/furniture-refinishing-repair/grainmend-logo.png -trim +repage -resize 920x220 -background none -gravity center -extent 1100x260 assets/furniture-refinishing-repair/grainmend-logo.png
rsvg-convert -w 512 -h 512 assets/furniture-refinishing-repair/grainmend-favicon.svg -o assets/furniture-refinishing-repair/grainmend-favicon.png

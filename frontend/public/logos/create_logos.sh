#!/bin/bash
# Script to create simple logo images

cd "$(dirname "$0")"

# Create Uber logo (simple black square with U)
convert -size 200x200 xc:black \
  -font Arial-Bold -pointsize 80 -fill white \
  -gravity center -annotate +0-10 "U" \
  -pointsize 20 -annotate +0+40 "UBER" \
  uber.png 2>/dev/null || echo "ImageMagick not available"

# Create Rapido logo (yellow square with R)
convert -size 200x200 xc:'#FFC107' \
  -font Arial-Bold -pointsize 80 -fill black \
  -gravity center -annotate +0-10 "R" \
  -pointsize 20 -annotate +0+40 "RAPIDO" \
  rapido.png 2>/dev/null || echo "ImageMagick not available"

# Create Namma Yatri logo (purple square with NY)
convert -size 200x200 xc:'#7C3AED' \
  -font Arial-Bold -pointsize 60 -fill white \
  -gravity center -annotate +0-10 "NY" \
  -pointsize 16 -annotate +0+40 "NAMMA YATRI" \
  namma_yatri.png 2>/dev/null || echo "ImageMagick not available"

ls -lh *.png

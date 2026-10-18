#!/bin/sh
# Export poster.html to a print-ready 36 x 24 in PDF with headless Chrome (macOS path; adjust on other systems).
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless --no-pdf-header-footer --virtual-time-budget=15000 \
  --print-to-pdf=RotMania-2048-poster.pdf "file://$PWD/poster.html"

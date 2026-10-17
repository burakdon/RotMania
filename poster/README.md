# Poster

The ECE 661 expo poster: 36 × 24 in, landscape.

- `RotMania-2048-poster.pdf`: the print-ready file.
- `poster.html`: the source; the comic panels load straight from `../src/comic/art`. Open it in Chrome to edit and preview, then run `./export.sh` to rebuild the PDF.
- `img/`: a board screenshot and the cast lineup (captured from the dev server), QR codes, and the Duke Pratt wordmark (taken from an earlier course poster).

The evidence numbers come from `npm run sim -- 2000 3` (and `2` and `4`) and `npm test`. The "before fix" bars are from the 300-game runs recorded during development.

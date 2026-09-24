# mac-logo-hdr ☀️

Make a LinkedIn logo bright enough to qualify as an eye injury. Turns a logo's whites into HDR highlights that glow past normal screen brightness. 😎

## How it works

1. Snaps near-white pixels (all channels above the threshold) to pure white.
2. Re-encodes as JPEG (quality 100, 4:4:4).
3. Embeds a Rec. 2100 PQ profile, which maps white to HDR peak luminance. The profile comes from macOS ColorSync and is generated on the first request (`scripts/pq-profile.swift`).

On an HDR display the white regions glow; everything darker stays normal. On SDR screens it looks like the original.

## Requirements

- macOS (uses the built-in `sips` command)
- Xcode Command Line Tools (`xcode-select --install`), for `swift`
- Node 18+

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

Drop in an image, adjust options, click Process, download the result.

## Options

| Option | Default | What it does |
|--------|---------|--------------|
| Upscale | on | Enlarge small images before processing |
| Target size | 800px | Upscale target (longest side) |
| White threshold | 240 | Pixels above this on all channels become pure white |

## Limitations

- macOS only (the profile embed shells out to `sips`).
- The glow shows only on HDR/XDR displays.
- Output is JPEG; transparency is flattened.
- It reinterprets the whole image as PQ, so saturated colors can shift. For color-accurate results, encode non-white pixels at an SDR reference and boost only the whites.

## License

MIT, see [LICENSE](LICENSE).

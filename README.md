# Number Temple Escape

A live playable numbers adventure, rebuilt 1:1 from the reference video (`upload/numbers.mp4`).

**Play now: <https://imranshiundu.github.io/number-temple-escape/>**

- Same scenes: the golden seesaw balance, the golden apple climb, the giant boulder, the low tunnel, the giant eye, the jungle escape
- Same rules: `4 + 4 = 8`, `8 = 4 + 4`, `4 = 2 + 2`, `2 = 1 + 1`
- No menus, no instructions - just tap

## Run

```bash
bun install
bun run dev          # http://localhost:3000
```

## Build for GitHub Pages

```bash
STATIC_EXPORT=1 bun run build   # outputs ./out
```

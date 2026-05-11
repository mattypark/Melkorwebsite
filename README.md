# procedural-inspired

A minimal single-page layout inspired by studio sites that lean on a
crosshair cursor, edge grid rules, and corner-anchored navigation. This
repo is **not a clone**. Copy, wordmark, and the center element are left
intentionally generic so you can drop in your own.

What's here:

- `index.html` — the page
- `style.css` — tokens, layout, theme
- `script.js` — the damped crosshair cursor and theme toggle
- `docs/cursor-vanilla.md` — the cursor technique in plain JS, explained
- `docs/cursor-react.md` — the same thing as a React hook + component
- `docs/cursor-prompting.md` — how to prompt an AI to build this cursor
- `docs/cursor-all.md` — vanilla + React + prompting in one file

Open `index.html` in a browser. No build step.

## What you're looking at

Four corner regions, a centered stage, and a crosshair that follows the
pointer with a soft delay so it feels like it "falls into" position
rather than tracking 1:1.

```
+--------------------------------------------------------------+
| wordmark (top-left)                       theme toggle (top-right) |
|                                                              |
|   ┌─ intro pill ─┐                                           |
|   │  one to       │                                          |
|   │  three lines  │                                          |
|   └───────────────┘                                          |
|   [ Contact  C ]                                             |
|                                                              |
|                     <— horizontal rule —>                    |
|                            |                                 |
|                            | vertical rule                   |
|                            ●  dot at intersection            |
|                            |                                 |
|                                                              |
|                                              LinkedIn        |
|                                              Instagram       |
|                                              GitHub          |
+--------------------------------------------------------------+
```

## Layout choices, briefly

- Fixed positioning everywhere. Nothing scrolls. This is a one-screen
  identity page, not a marketing site. If you want sections, change
  `overflow: hidden` on `body` and convert fixed elements to sticky.
- Custom cursor via `cursor: none` plus two 1px `position: fixed` rules.
  Crisp on every screen because we round `current` to whole pixels each
  frame.
- Theme toggle writes `data-theme` on `<html>`. All colors are CSS
  variables, so switching themes is one attribute change, no JS-applied
  styles.
- Type scale is intentionally flat (one size, system stack). Visual
  hierarchy comes from position and whitespace, not weight or size.

## Make it yours

1. Replace `your studio` with your name.
2. Rewrite the intro pill in your own words.
3. Swap the links in `nav.br`.
4. Put something in `<main class="stage">` — a canvas, a video, a
   shader, an `<img>`, a Three.js mount point. The crosshair sits above
   it because `.crosshair` has `z-index: 50`.

## The "falls into it" detail

The cursor easing is in `script.js`:

```js
const EASE = 0.12;
current.x += (target.x - current.x) * EASE;
current.y += (target.y - current.y) * EASE;
```

Lower `EASE` = heavier, slower. Higher = snappier. Around `0.1` to
`0.15` is where it stops feeling like a system cursor and starts feeling
intentional. See `docs/cursor-vanilla.md` for the full walkthrough.

## License

MIT. Original studio sites that inspired the pattern are their own work
and not affiliated with this repo.
# Melkorwebsite

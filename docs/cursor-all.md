# Damped crosshair cursor — everything in one file

This is the merge of `cursor-vanilla.md`, `cursor-react.md`, and
`cursor-prompting.md`. Use this when you want to copy one file into a
new project.

---

## Part 1 — The technique

A crosshair cursor = two `position: fixed` lines (one full-width, one
full-height) that intersect at the pointer. Track two positions:

- `target` — where the pointer actually is
- `current` — where you draw

Every animation frame, move `current` a fraction of the way toward
`target`. That fraction is the cursor's weight. `0.12` per frame gives
the "falls into" feel.

## Part 2 — Vanilla JS implementation

**index.html**

```html
<!doctype html>
<html>
<head><link rel="stylesheet" href="style.css" /></head>
<body>
  <div class="crosshair" aria-hidden="true">
    <div class="crosshair__h"></div>
    <div class="crosshair__v"></div>
    <div class="crosshair__dot"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>
```

**style.css**

```css
body { cursor: none; margin: 0; height: 100vh; background: #d9d9d9; }

.crosshair { position: fixed; inset: 0; pointer-events: none; z-index: 50; --x: 50vw; --y: 50vh; }
.crosshair__h { position: absolute; left: 0; right: 0; top: var(--y); height: 1px; transform: translateY(-0.5px); background: #0a0a0a; }
.crosshair__v { position: absolute; top: 0; bottom: 0; left: var(--x); width: 1px; transform: translateX(-0.5px); background: #0a0a0a; }
.crosshair__dot { position: absolute; top: var(--y); left: var(--x); width: 6px; height: 6px; border-radius: 50%; background: #0a0a0a; transform: translate(-50%, -50%); }

@media (prefers-reduced-motion: reduce) {
  body { cursor: auto; }
  .crosshair { display: none; }
}
```

**script.js**

```js
const root = document.querySelector(".crosshair");
const target  = { x: innerWidth / 2, y: innerHeight / 2 };
const current = { x: target.x, y: target.y };
const EASE = 0.12;

addEventListener("pointermove", (e) => {
  target.x = e.clientX;
  target.y = e.clientY;
}, { passive: true });

(function tick() {
  current.x += (target.x - current.x) * EASE;
  current.y += (target.y - current.y) * EASE;
  const x = Math.round(current.x);
  const y = Math.round(current.y);
  root.style.setProperty("--x", x + "px");
  root.style.setProperty("--y", y + "px");
  requestAnimationFrame(tick);
})();
```

Three things to remember:

1. The easing math lives in `requestAnimationFrame`, not `pointermove`.
   `pointermove` only updates `target`.
2. Round to whole pixels before writing to the DOM so 1px lines stay
   crisp.
3. `pointer-events: none` on the container so the crosshair doesn't
   eat clicks.

## Part 3 — React port

**useCrosshair.ts**

```tsx
import { useEffect, useRef } from "react";

export function useCrosshair(ease = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const tick = () => {
      const k = reduced ? 1 : ease;
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      el.style.setProperty("--x", Math.round(current.x) + "px");
      el.style.setProperty("--y", Math.round(current.y) + "px");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [ease]);

  return ref;
}
```

**Crosshair.tsx**

```tsx
"use client";
import { useCrosshair } from "./useCrosshair";

export function Crosshair() {
  const ref = useCrosshair(0.12);
  return (
    <div ref={ref} className="crosshair" aria-hidden>
      <div className="crosshair__h" />
      <div className="crosshair__v" />
      <div className="crosshair__dot" />
    </div>
  );
}
```

Mount once at the root. Don't re-mount per route. In Next.js, mark the
component `"use client"` because the hook touches `window`.

The position lives on the DOM as CSS variables. React never re-renders
on pointer move. That's the entire point — don't add `useState` for
position, don't memoize, don't optimize. There's nothing to optimize.

## Part 4 — How to prompt an AI for this

Bad prompt:

> Build a custom cursor that follows the mouse with a delay.

Good prompt:

> Build a custom crosshair cursor in vanilla JS + CSS.
>
> Behavior:
> - Two 1px lines (horizontal + vertical) spanning the full viewport,
>   intersecting at the cursor.
> - 6px dot at the intersection.
> - Damped easing at 0.12 per frame using linear interpolation in a
>   requestAnimationFrame loop. Cursor should "fall into" the pointer
>   position, not track 1:1.
>
> Requirements:
> - `cursor: none` on body.
> - `position: fixed` lines, `pointer-events: none` on the container.
> - Update CSS custom properties (`--x`, `--y`), not inline styles
>   per-frame.
> - Round positions to whole pixels for crisp 1px rules.
> - Respect `prefers-reduced-motion: reduce`.
> - No libraries.
>
> Return `index.html`, `style.css`, `script.js` with inline comments
> explaining the easing math.

The difference: every important decision is already made. AI's job is
syntax, not judgment.

What to watch for in the output:

- Easing math in `requestAnimationFrame` (good) vs `mousemove` (bad,
  fires unpredictably) vs `setTimeout` (very bad, that's not damping).
- `position: fixed` (good) vs `position: absolute` (breaks on scroll).
- `pointer-events: none` present on the container.
- For React: no `useState` for position; the position lives on the DOM.

Five-step eval after pasting in the code:

1. Track smoothly at 60Hz and 144Hz.
2. Move fast, stop — does it settle without bouncing?
3. Throttle CPU 4x in devtools — does it still feel responsive?
4. Click a link — does the page actually navigate?
5. Toggle reduced motion in devtools — does the animation respect it?

If all five pass, ship.

## Part 5 — Tuning

| EASE  | Feel                     | Use for                  |
| ----- | ------------------------ | ------------------------ |
| 1.00  | snaps instantly          | precise tools, drawing   |
| 0.30  | snappy, slight delay     | utility apps             |
| 0.15  | soft, deliberate         | portfolios               |
| 0.12  | "falls into" the cursor  | studio identity sites    |
| 0.05  | very floaty              | art pieces, experiments  |

Start at `0.12`. Adjust by ±0.02 until it feels right. Don't dial it in
on a 144Hz monitor and forget about 60Hz — test both. The same EASE
feels heavier at lower refresh rates.

## Part 6 — Extensions worth knowing

Small, scoped variations that compose cleanly:

- **Hover scale-up.** Listen for `mouseenter`/`mouseleave` on `a, button`
  and toggle a class on the dot. Animate scale with CSS transitions,
  not JS.
- **Click ring.** On `pointerdown`, swap the dot for a ring that grows
  via a CSS transition over 200ms. On `pointerup`, return to the dot.
- **Magnetic snap.** When the pointer is within N pixels of certain
  elements (call them "magnets"), pull `target` toward their center
  instead of the raw pointer position. Use `getBoundingClientRect()`
  to find the centers; weight the pull by distance.
- **Touch hide.** `matchMedia("(pointer: coarse)").matches` → hide the
  crosshair entirely. Custom cursors on touch are user-hostile.
- **Color invert on dark sections.** Use `mix-blend-mode: difference`
  on the crosshair lines to invert against whatever's behind them.
  Costs nothing and looks much more designed.

Each one is 5–15 lines of code on top of the base. Add them one at a
time. Test each. Keep the file under 100 lines.

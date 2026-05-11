# Damped crosshair cursor — vanilla JS

A custom cursor made of two thin lines that span the viewport and cross
at the pointer, with a small delay so the intersection feels like it
"falls into" position. No libraries. About 30 lines of JS.

## The idea in one paragraph

A crosshair cursor is just two `position: fixed` rectangles — one full
width, one full height — whose `top` and `left` follow the pointer.
Tracking the pointer 1:1 looks robotic. The trick is to keep two copies
of the position: where the pointer *is* (`target`) and where you're
*drawing* (`current`). Each animation frame, move `current` a fraction
of the way toward `target`. That fraction is the "weight" of the cursor.

## HTML

```html
<div class="crosshair" aria-hidden="true">
  <div class="crosshair__h"></div>
  <div class="crosshair__v"></div>
  <div class="crosshair__dot"></div>
</div>
```

`aria-hidden` because the crosshair is decoration. Screen readers should
not hear it.

## CSS

```css
body { cursor: none; }              /* hide the system cursor */

.crosshair {
  position: fixed;
  inset: 0;
  pointer-events: none;             /* clicks pass through */
  z-index: 50;
  --x: 50vw;
  --y: 50vh;
}

.crosshair__h {                     /* the horizontal line */
  position: absolute;
  left: 0; right: 0;
  top: var(--y);
  height: 1px;
  transform: translateY(-0.5px);    /* center on the line, not below it */
  background: #0a0a0a;
}

.crosshair__v {                     /* the vertical line */
  position: absolute;
  top: 0; bottom: 0;
  left: var(--x);
  width: 1px;
  transform: translateX(-0.5px);
  background: #0a0a0a;
}

.crosshair__dot {                   /* small dot at the intersection */
  position: absolute;
  top: var(--y); left: var(--x);
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #0a0a0a;
  transform: translate(-50%, -50%);
}
```

Two things worth flagging:

- `cursor: none` on `body` hides the real arrow. If a user has reduced
  motion / accessibility preferences, you may want to keep the system
  cursor visible. Easy guard:
  `@media (prefers-reduced-motion: reduce) { body { cursor: auto; } .crosshair { display: none; } }`
- `pointer-events: none` on the container is critical. Without it the
  full-width line eats every click on your page.

## JS

```js
const root = document.querySelector(".crosshair");

const target  = { x: innerWidth / 2, y: innerHeight / 2 };
const current = { x: target.x, y: target.y };

const EASE = 0.12;                  // 0.05 = heavy, 0.2 = light, 1 = no easing

addEventListener("pointermove", (e) => {
  target.x = e.clientX;
  target.y = e.clientY;
}, { passive: true });

(function tick() {
  current.x += (target.x - current.x) * EASE;
  current.y += (target.y - current.y) * EASE;

  // round so a 1px rule lands on a single device row, not blurred across two
  const x = Math.round(current.x);
  const y = Math.round(current.y);

  root.style.setProperty("--x", x + "px");
  root.style.setProperty("--y", y + "px");

  requestAnimationFrame(tick);
})();
```

That's it. Read this slowly the first time:

1. `target` updates every time the pointer moves.
2. `current` updates every animation frame (60 / 120 / 144 times per
   second depending on the display).
3. Each frame, `current` moves `EASE` of the remaining distance to
   `target`. That's exponential decay: fast when far, slow when close,
   no overshoot. This is sometimes called a "lerp follow" or "smooth
   damp" in game code.

## Why the rounding matters

Browsers will sub-pixel-position a 1px line if you let them. The line
ends up rendered as two semi-transparent rows, which looks soft and
slightly blurry. Rounding `current` to whole pixels before writing it
to the DOM keeps the line crisp.

If you want sub-pixel motion (smoother on high-DPI displays at the cost
of slight softness), skip the rounding and the cursor will glide more.
Pick one or the other based on whether crispness or smoothness matters
more for your aesthetic.

## Why not `transform: translate3d(...)`?

A common optimization is to move elements with `transform` instead of
`top`/`left` because transforms skip layout. For a full-width 1px line,
the layout cost is negligible and `top`/`left` is simpler to read.

If you have a more complex cursor (image, gradient, multi-element
group), switch to:

```css
.cursor { transform: translate(var(--x), var(--y)); }
```

and write the variables without "px" units (`current.x` directly is
fine for `translate`).

## Tuning the feel

| EASE  | Feel                                  | Use for                |
| ----- | ------------------------------------- | ---------------------- |
| 1.00  | snaps instantly to the pointer        | precise tools, drawing |
| 0.30  | snappy but not instant                | utility apps           |
| 0.15  | soft delay, deliberate                | portfolios             |
| 0.12  | "falls into" the position             | studio identity sites  |
| 0.05  | very floaty, deliberate weight        | art pieces             |

`EASE` is frame-rate dependent — at 144Hz the cursor will catch up
faster than at 60Hz. For most marketing pages this is fine. If you ship
this on something where frame-rate parity matters (a game, an art tool),
multiply `EASE` by `deltaTime / 16.67` so it stays consistent.

## Common gotchas

- Forgetting `pointer-events: none` and wondering why nothing on the
  page is clickable.
- Forgetting `cursor: none` and seeing both the system cursor and the
  custom one.
- Putting the easing math in `pointermove` instead of in
  `requestAnimationFrame`. The pointer fires inconsistently
  (sometimes 60Hz, sometimes 1000Hz on high-rate mice). RAF gives you
  exactly one update per frame, which is what you want.
- Stacking the crosshair under other absolutely-positioned content. Set
  `z-index: 50` (or higher) on the container.

## Reduced motion

For users who set `prefers-reduced-motion: reduce`, either disable the
custom cursor entirely or set `EASE = 1.0` so it tracks instantly with
no animation:

```js
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = reduced ? 1.0 : 0.12;
```

# How to prompt an AI to build this cursor

The cursor in this repo is small, but it's a useful case study because
"prompt an AI to build a custom cursor" is the kind of vague request
that produces bad output by default. The fix is the same fix as for
any AI task: replace vibes with specifics.

## The bad prompt

> Build me a custom cursor that follows the mouse with a delay.

Why this fails:

- "Custom cursor" is underspecified. A dot? A ring? Crosshair? Image?
- "Follows the mouse" — does it lag? Snap? Trail? Bounce?
- "With a delay" — how much delay? Constant? Damped? Spring?
- No mention of stack (vanilla / React / Svelte / Vue).
- No mention of accessibility, performance, or where it mounts.

You'll get a working cursor, but it will be a generic one — probably a
filled circle with `setTimeout` or a CSS transition, not the
intersection-of-viewport-lines pattern.

## The good prompt

> Build a custom crosshair cursor in vanilla JS + CSS for a single
> static HTML page.
>
> Behavior:
> - Two thin 1px lines (one horizontal, one vertical) that span the
>   entire viewport and intersect at the cursor position.
> - A small 6px dot at the intersection.
> - The crosshair follows the pointer with damped easing — about 0.12
>   per frame using linear interpolation in a requestAnimationFrame
>   loop. It should feel like it "falls into" the cursor position, not
>   track 1:1.
>
> Requirements:
> - Hide the system cursor (`cursor: none` on body).
> - Use `position: fixed` for the lines, `pointer-events: none` on the
>   container so clicks pass through.
> - Update CSS custom properties (`--x`, `--y`) rather than re-rendering.
> - Round the position to whole pixels each frame so the 1px lines stay
>   crisp.
> - Respect `prefers-reduced-motion: reduce` — disable the easing or
>   the whole crosshair when set.
> - No libraries.
>
> Return three files: `index.html`, `style.css`, `script.js`, with
> inline comments explaining the easing math.

This prompt works because every important decision is *already made*.
The AI's only job is to write the syntax. There's nothing to guess.

## The principle

When you prompt an AI to build something you've seen before, the prompt
should describe:

1. **The shape.** What does it actually look like? Lines? Dots?
   Dimensions? Colors? Don't say "minimal" — say "1px black line".
2. **The behavior.** What does each input do? "Follows the mouse" is
   not behavior. "Lerps toward the pointer at 0.12 per frame in a RAF
   loop" is behavior.
3. **The constraints.** Stack, dependencies, performance budget,
   accessibility, SSR.
4. **The output.** Which files, in which language, with what kind of
   comments.

This is the same skeleton as a good engineering ticket. AI doesn't need
less specificity than a junior engineer. It needs the same or more.

## A template you can reuse

> Build [thing] in [stack].
>
> Behavior:
> - [observable behavior 1, with a number]
> - [observable behavior 2, with a number]
> - [edge case behavior — what happens at boundaries, on resize, on
>   leave, on mobile]
>
> Requirements:
> - [perf constraint]
> - [a11y constraint]
> - [API constraint — what does it export / how is it mounted]
> - [dependency rule — libraries OK? specific ones?]
>
> Return [files] with [comment level].

Fill it in. Most of the work in prompting is forcing yourself to know
what you actually want.

## Where AI still gets this wrong

Even with a tight prompt, watch for:

- **Running the easing in `mousemove` instead of `requestAnimationFrame`.**
  This is the single most common mistake AI makes on cursor code. The
  easing should be in a RAF loop. `mousemove` only updates the target.
- **Using `setTimeout` for the delay.** A `setTimeout`-based delay is
  not damping. It's a constant offset. It will feel laggy, not heavy.
- **Forgetting `pointer-events: none` on the cursor container.** The
  page becomes unclickable. Check this first when something breaks.
- **`position: absolute` instead of `position: fixed`.** Works until
  the page scrolls, then breaks.
- **Re-rendering React on every pointer move.** If you see `useState`
  for the cursor position, reject the output. The position belongs on
  the DOM, not in React state.

## A quick eval

Paste the AI's code into `index.html` (or your React app) and check:

1. Does the cursor track smoothly at 60Hz? At 144Hz?
2. Move the mouse fast, then stop. Does the crosshair *settle* into
   place, or does it overshoot and bounce? (Lerp = settle. Spring with
   too much energy = bounce.)
3. Open devtools, slow CPU to 4x. Does the cursor still keep up, or
   does it stutter? (RAF + CSS variables should be fine. State-driven
   React versions will stutter here.)
4. Click on a link. Does it actually navigate? (If not, you forgot
   `pointer-events: none`.)
5. Toggle `prefers-reduced-motion` in devtools rendering panel. Does
   the cursor still animate? It shouldn't.

If all five pass, ship it.

## Iteration prompts

Once the cursor exists, these are the prompts you'll actually need:

- "The cursor feels too snappy. Halve the easing constant and show me
  the new value."
- "Add a subtle scale-up of the dot from 6px to 10px when hovering any
  `<a>` or `<button>`. Animate with CSS transitions, not JS."
- "When the user clicks and holds, replace the dot with a small ring
  that grows over 200ms. Release returns it to the dot."
- "On touch devices (`pointer: coarse`), hide the crosshair entirely."

These are small, scoped, testable changes. That's the right size for
an AI edit.

# Damped crosshair cursor — React

Same technique as the vanilla version, packaged as a hook plus a
component. Works in any React 18+ app (Next.js, Vite, CRA).

If you haven't read `cursor-vanilla.md`, read that first — it explains
*why* the cursor works. This doc is about the *port*.

## The hook

```tsx
// useCrosshair.ts
import { useEffect, useRef } from "react";

type Options = {
  ease?: number;            // 0..1, lower = heavier
  reduced?: boolean;        // skip easing for reduced-motion users
};

export function useCrosshair(opts: Options = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const ease = opts.ease ?? 0.12;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };

    const reduced = opts.reduced
      ?? matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      const x = Math.round(current.x);
      const y = Math.round(current.y);
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [ease, opts.reduced]);

  return ref;
}
```

Things to notice:

- The hook returns a ref. You attach it to your crosshair container.
  All position state lives on that DOM node as CSS custom properties.
  React never re-renders on pointer move — that would be 1000s of
  renders per second.
- `useEffect` cleans up on unmount (removes the listener, cancels the
  RAF loop). Forget either of those and you leak a frame loop on every
  navigation in a SPA.
- `matchMedia(...).matches` is read once on mount. If you want it to
  react to a user toggling reduced motion live, swap to
  `matchMedia.addEventListener("change", ...)`.

## The component

```tsx
// Crosshair.tsx
import { useCrosshair } from "./useCrosshair";
import "./crosshair.css";

export function Crosshair() {
  const ref = useCrosshair({ ease: 0.12 });
  return (
    <div ref={ref} className="crosshair" aria-hidden>
      <div className="crosshair__h" />
      <div className="crosshair__v" />
      <div className="crosshair__dot" />
    </div>
  );
}
```

## The CSS

Identical to the vanilla doc. Drop it in `crosshair.css`:

```css
body { cursor: none; }

.crosshair { position: fixed; inset: 0; pointer-events: none; z-index: 50; --x: 50vw; --y: 50vh; }
.crosshair__h { position: absolute; left: 0; right: 0; top: var(--y); height: 1px; transform: translateY(-0.5px); background: #0a0a0a; }
.crosshair__v { position: absolute; top: 0; bottom: 0; left: var(--x); width: 1px; transform: translateX(-0.5px); background: #0a0a0a; }
.crosshair__dot { position: absolute; top: var(--y); left: var(--x); width: 6px; height: 6px; border-radius: 50%; background: #0a0a0a; transform: translate(-50%, -50%); }
```

## Mounting it

Add `<Crosshair />` once at the root of your app (in `App.tsx` or your
Next.js root layout). Don't mount it per-route or you'll get a flash
on every navigation as the easing re-initializes from the viewport
center.

```tsx
// app/layout.tsx (Next.js app router)
import { Crosshair } from "@/components/Crosshair";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Crosshair />
        {children}
      </body>
    </html>
  );
}
```

In Next.js, add `"use client"` at the top of `Crosshair.tsx` because
the hook touches `window`. Don't put `"use client"` on `layout.tsx` —
only on the leaf component.

## SSR safety

If you render this in a framework that does SSR (Next.js, Remix), the
hook needs `window`. Two safe options:

1. Mark only the Crosshair component as a client component (the
   approach above). This is the right call for Next.js app router.
2. Wrap the hook body in `if (typeof window === "undefined") return;`
   on top of the effect. The effect itself only runs on the client, so
   this is rarely needed — but it doesn't hurt.

## Why not Framer Motion / GSAP / a spring library?

You can absolutely use a spring (`useSpring` from Framer Motion,
`useSpring` from react-spring, a GSAP tween) here. A real spring gives
you overshoot and settle, which can look great on a heavier cursor.
For the "falls into" feel — gentle exponential decay, no overshoot —
the lerp above is smaller, has no dependency, and renders identically.

If you do reach for a spring, the equivalent settings are roughly:

```ts
useSpring({ stiffness: 150, damping: 18, mass: 1 })
```

Tweak from there. Higher stiffness = snappier; higher damping = less
overshoot.

## Memoization is unnecessary

Don't wrap the hook in `useMemo` or `useCallback`. The state lives on
the DOM, not in React. The only React work happening here is the
initial mount and unmount. That's the whole point of the pattern.

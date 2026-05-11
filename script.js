// Crosshair cursor — spring follow (liquid feel) + invert toggle.
//
// Why a spring instead of a plain lerp:
//   lerp moves toward target by EASE per frame. Smooth, but uniformly
//   "soft." A spring adds velocity that builds and decays. It overshoots
//   slightly when you stop, then settles. That tiny overshoot is what
//   makes the cursor feel liquid rather than damped.
//
// No libraries. ~40 lines of physics.

(function () {
  const root = document.querySelector(".crosshair");
  if (!root) return;

  // Position state.
  const target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const current = { x: target.x, y: target.y };
  const vel     = { x: 0, y: 0 };

  // Spring tuning.
  //   STIFFNESS — how hard the spring pulls toward target each frame.
  //   DAMPING   — how much velocity decays each frame (1 = no decay).
  // Try 0.22 / 0.72 for snappier, 0.12 / 0.82 for floatier.
  const STIFFNESS = 0.18;
  const DAMPING   = 0.78;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function move(e) {
    target.x = e.clientX;
    target.y = e.clientY;
  }

  // pointermove covers mouse + pen + touch in modern browsers. We also
  // attach mousemove as a belt-and-suspenders fallback for older WebKit.
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("mousemove",   move, { passive: true });

  // Seed the position to the first real pointer event so there is no
  // initial spring-from-center on page load.
  window.addEventListener("pointerover", (e) => {
    current.x = target.x = e.clientX;
    current.y = target.y = e.clientY;
    vel.x = vel.y = 0;
  }, { once: true, passive: true });

  function tick() {
    if (reduced) {
      // Snap with no animation.
      current.x = target.x;
      current.y = target.y;
    } else {
      // Spring step.
      vel.x = (vel.x + (target.x - current.x) * STIFFNESS) * DAMPING;
      vel.y = (vel.y + (target.y - current.y) * STIFFNESS) * DAMPING;
      current.x += vel.x;
      current.y += vel.y;
    }

    // 1px rules need to land on a whole device row to stay crisp.
    // The dot can live on sub-pixels because it's bigger than 1px.
    const xi = Math.round(current.x);
    const yi = Math.round(current.y);
    root.style.setProperty("--x", xi + "px");
    root.style.setProperty("--y", yi + "px");
    root.style.setProperty("--xf", current.x + "px");
    root.style.setProperty("--yf", current.y + "px");

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Invert toggle. Swaps fg/bg by flipping a data attribute on <html>.
  // No filter() — `filter: invert()` also inverts images/video, which
  // looks broken once you put real content in the stage. data-theme is
  // cleaner and respects the CSS variables in style.css.
  const invertBtn = document.getElementById("invert");
  function applyTheme(name) {
    document.documentElement.setAttribute("data-theme", name);
    if (invertBtn) invertBtn.setAttribute("aria-pressed", name === "dark" ? "true" : "false");
    try { localStorage.setItem("theme", name); } catch {}
  }
  applyTheme(localStorage.getItem("theme") || "light");
  if (invertBtn) {
    invertBtn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  // Press C to fire the contact action.
  window.addEventListener("keydown", (e) => {
    if (e.key && e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      window.location.href = "mailto:you@example.com";
    }
  });

  // Menu + panel ----------------------------------------------------------
  // Click a menu item -> panel scales out from that item's position.
  // The transform-origin is the center of the clicked pill, written as
  // CSS variables on the panel. Close on Esc, the X button, or click
  // on the panel backdrop (outside the inner card).
  const panel      = document.getElementById("panel");
  const backdrop   = document.getElementById("panel-backdrop");
  const panelTitle = document.getElementById("panel-title");
  const panelBody  = document.getElementById("panel-body");
  const panelClose = document.getElementById("panel-close");

  const PANEL_CONTENT = {
    products: {
      title: "Products",
      html:  `<h2>Products</h2>
              <p>Replace this with what you ship. One paragraph per product is enough on a landing page; deeper detail belongs on its own page.</p>
              <ul>
                <li>Product A — one-line description.</li>
                <li>Product B — one-line description.</li>
                <li>Product C — one-line description.</li>
              </ul>`
    },
    enterprise: {
      title: "Enterprise",
      html:  `<h2>Enterprise</h2>
              <p>What you offer to larger customers. Security posture, deployment options, support, billing terms. Keep it concrete.</p>
              <ul>
                <li>SSO + SCIM.</li>
                <li>Self-hosted or private cloud.</li>
                <li>Dedicated support engineer.</li>
              </ul>`
    },
    philosophy: {
      title: "Philosophy",
      html:  `<h2>Philosophy</h2>
              <p>What you believe about the work, said plainly. Not a mission statement. The opinions that decide what you build and what you refuse to build.</p>
              <p>Three to five short paragraphs is the right length.</p>`
    },
    demo: {
      title: "Request a Demo",
      html:  `<h2>Request a Demo</h2>
              <p>Drop in a form, a Cal.com embed, or a single email link. Don't overbuild this — friction here costs you meetings.</p>
              <p><a href="mailto:you@example.com" style="text-decoration: underline;">you@example.com</a></p>`
    }
  };

  function openPanel(key, originEl) {
    if (!panel) return;
    const data = PANEL_CONTENT[key];
    if (!data) return;

    // Origin for the scale animation = center of the clicked menu item.
    if (originEl) {
      const r = originEl.getBoundingClientRect();
      const ox = r.left + r.width  / 2;
      const oy = r.top  + r.height / 2;
      panel.style.setProperty("--ox", ox + "px");
      panel.style.setProperty("--oy", oy + "px");
    }

    panelTitle.textContent = data.title;
    panelBody.innerHTML    = data.html;

    panel.hidden = false;
    if (backdrop) backdrop.hidden = false;
    // next frame so the browser registers the [hidden]->visible state
    // change before applying the open class, so the transition runs.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => panel.classList.add("is-open"));
    });
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("is-open");
    // hide after the transition finishes so it can't be tabbed into
    const onEnd = () => {
      panel.hidden = true;
      if (backdrop) backdrop.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  }

  document.querySelectorAll(".menu__item").forEach((btn) => {
    btn.addEventListener("click", () => openPanel(btn.dataset.panel, btn));
  });

  if (panelClose) panelClose.addEventListener("click", closePanel);
  if (backdrop)   backdrop.addEventListener("click", closePanel);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel && !panel.hidden) closePanel();
  });
})();

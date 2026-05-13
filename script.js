// Menu + popup + contact-key.
//
// Click a menu item -> popup scales out from that item.
// Esc / X / outside click -> close.

(function () {
  // Watery cursor-driven background --------------------------------------
  // Three blurred lenses follow the pointer at different spring rates.
  // Cursor speed pushes the SVG feDisplacementMap scale up momentarily,
  // so fast moves "splash" the dot grid; idle = gentle drift only.
  const target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const lastT   = { x: target.x, y: target.y };
  let speed     = 0;        // smoothed pointer speed (px/frame)

  const lenses = [
    { el: document.querySelector(".lens--1"), x: target.x, y: target.y, vx: 0, vy: 0, k: 0.040, d: 0.84 },
    { el: document.querySelector(".lens--2"), x: target.x, y: target.y, vx: 0, vy: 0, k: 0.075, d: 0.80 },
    { el: document.querySelector(".lens--3"), x: target.x, y: target.y, vx: 0, vy: 0, k: 0.130, d: 0.78 }
  ];

  const disp = document.getElementById("liquidDisp");
  const warpDots = document.querySelector(".bg__dots--warp");
  const DISP_BASE = 18;     // idle warp
  const DISP_MAX  = 60;     // max warp when whipping the pointer
  const R_BASE = 160;       // idle warp radius (px) — only dots inside this circle around the cursor warp
  const R_MAX  = 320;       // max radius when whipping the pointer

  function onMove(e) {
    target.x = e.clientX;
    target.y = e.clientY;
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("mousemove",   onMove, { passive: true });

  function bgTick() {
    // Instantaneous pointer delta -> smoothed speed.
    const dx = target.x - lastT.x;
    const dy = target.y - lastT.y;
    const inst = Math.sqrt(dx * dx + dy * dy);
    lastT.x = target.x; lastT.y = target.y;
    speed += (inst - speed) * 0.15;        // low-pass filter

    // Map speed -> displacement scale. Cap so it doesn't blow up.
    if (disp) {
      const s = Math.min(DISP_BASE + speed * 1.8, DISP_MAX);
      disp.setAttribute("scale", s.toFixed(2));
    }

    // Move the warp mask to the cursor, and grow the radius with speed so
    // fast moves splash a wider area. Only dots inside this radius warp.
    if (warpDots) {
      const r = Math.min(R_BASE + speed * 6, R_MAX);
      warpDots.style.setProperty("--cx", target.x + "px");
      warpDots.style.setProperty("--cy", target.y + "px");
      warpDots.style.setProperty("--r",  r.toFixed(1) + "px");
    }

    // Lens springs.
    for (const L of lenses) {
      if (!L.el) continue;
      L.vx = (L.vx + (target.x - L.x) * L.k) * L.d;
      L.vy = (L.vy + (target.y - L.y) * L.k) * L.d;
      L.x += L.vx;
      L.y += L.vy;
      L.el.style.setProperty("--lx", L.x + "px");
      L.el.style.setProperty("--ly", L.y + "px");
    }

    requestAnimationFrame(bgTick);
  }
  requestAnimationFrame(bgTick);

  // Press C to fire the contact action.
  window.addEventListener("keydown", (e) => {
    if (e.key && e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // ignore C while typing in a field
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      window.location.href = "mailto:you@example.com";
    }
  });

  // Menu + panel ----------------------------------------------------------
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => panel.classList.add("is-open"));
    });
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("is-open");
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

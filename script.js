// Melkor — bg canvas of slowly drifting "galaxy" dots on a dark field
// + menu actions + C key contact shortcut.
//
// No external deps. All animation runs in a single rAF loop.

(function () {
  // ---------------------------------------------------------------------
  // Background: a single cluster of white dots floating in dark space.
  // Each dot moves radially inward toward the cluster center; when it
  // gets close, it respawns out at the rim. Closer dots are brighter
  // and slightly larger, so the cluster reads as a soft attractor with
  // depth. The whole cluster center drifts gently so the field feels
  // alive rather than locked to a pixel.
  // ---------------------------------------------------------------------
  const bgCanvas = document.getElementById("bg-canvas");
  const bgCtx    = bgCanvas.getContext("2d");
  const DPR      = Math.min(window.devicePixelRatio || 1, 2);
  const BG_COLOR = "#0d1117";   // deep slate, near-black
  const N_PARTS  = 110;

  let maxR = 320;
  let particles = [];

  function spawn(atRim) {
    const angle = Math.random() * Math.PI * 2;
    const r = atRim
      ? maxR * (0.85 + Math.random() * 0.18)
      : maxR * (0.15 + Math.random() * 0.85);
    return {
      a:    angle,
      r:    r,
      // inward speed in px/frame
      vr:   0.18 + Math.random() * 0.45,
      // tiny angular drift so paths aren't perfectly radial
      vt:   (Math.random() - 0.5) * 0.0025,
      // per-particle pulse offsets
      p:    Math.random() * Math.PI * 2,
      ps:   0.0005 + Math.random() * 0.0014,
      // most are tiny; a few are bigger feature dots
      big:  Math.random() < 0.12
    };
  }

  function initParticles() {
    particles = new Array(N_PARTS);
    for (let i = 0; i < N_PARTS; i++) particles[i] = spawn(false);
  }

  function bgResize() {
    bgCanvas.width        = window.innerWidth  * DPR;
    bgCanvas.height       = window.innerHeight * DPR;
    bgCanvas.style.width  = window.innerWidth  + "px";
    bgCanvas.style.height = window.innerHeight + "px";
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // cluster size: fit in the open area to the right of the menu and
    // above the bottom card row.
    const W = window.innerWidth, H = window.innerHeight;
    const MENU_RIGHT = W < 720 ? 0 : 320;
    const CARDS_TOP  = H - 30 - Math.max(H * 0.42, 240);
    const availW    = W - MENU_RIGHT;
    maxR = Math.max(160, Math.min(availW * 0.42, CARDS_TOP * 0.45, 360));
    initParticles();
  }
  bgResize();
  window.addEventListener("resize", bgResize);

  function bgFrame(t) {
    const W = window.innerWidth, H = window.innerHeight;
    const MENU_RIGHT = W < 720 ? 0 : 320;
    const CARDS_TOP  = H - 30 - Math.max(H * 0.42, 240);
    const baseCx = MENU_RIGHT + (W - MENU_RIGHT) / 2;
    const baseCy = CARDS_TOP / 2;
    // cluster center floats gently
    const cx = baseCx + Math.sin(t * 0.00018) * 22;
    const cy = baseCy + Math.cos(t * 0.00014) * 14;

    // dark field
    bgCtx.fillStyle = BG_COLOR;
    bgCtx.fillRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.r -= p.vr;
      p.a += p.vt;
      // respawn at rim once a particle nears the center
      if (p.r < 6) particles[i] = spawn(true);

      const x = cx + Math.cos(p.a) * p.r;
      const y = cy + Math.sin(p.a) * p.r;

      // proximity 0 (rim) -> 1 (center). Closer = bigger, brighter.
      const prox = 1 - p.r / maxR;
      const rad  = p.big
        ? 1.8 + prox * 3.4
        : 0.5 + prox * 1.5;
      let a = (0.25 + prox * 0.65) * (0.75 + Math.sin(t * p.ps + p.p) * 0.25);
      if (a < 0) a = 0; else if (a > 1) a = 1;

      bgCtx.fillStyle = "rgba(255, 255, 255, " + a.toFixed(3) + ")";
      bgCtx.beginPath();
      bgCtx.arc(x, y, rad, 0, Math.PI * 2);
      bgCtx.fill();
    }

    requestAnimationFrame(bgFrame);
  }
  requestAnimationFrame(bgFrame);

  // ---------------------------------------------------------------------
  // Press C -> fire contact action (ignore when typing in a field).
  // ---------------------------------------------------------------------
  window.addEventListener("keydown", (e) => {
    if (e.key && e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      window.location.href = "mailto:hello@example.com";
    }
  });

  // ---------------------------------------------------------------------
  // Products row: 3 cards anchored to the lower portion of the screen.
  // Always visible. Click + on a card to expand it (others shrink via
  // flex-grow). Click again to collapse.
  // ---------------------------------------------------------------------
  const products = document.getElementById("products");

  // Card expand buttons.
  document.querySelectorAll(".product-card__expand").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".product-card");
      if (!card) return;
      const willExpand = !card.classList.contains("is-expanded");
      // only one expanded at a time
      products.querySelectorAll(".product-card.is-expanded").forEach((c) => c.classList.remove("is-expanded"));
      if (willExpand) {
        card.classList.add("is-expanded");
        products.classList.add("has-expanded");
      } else {
        products.classList.remove("has-expanded");
      }
    });
  });

  // ---------------------------------------------------------------------
  // Request a Demo popup: small centered panel with a form.
  // ---------------------------------------------------------------------
  const panel      = document.getElementById("panel");
  const backdrop   = document.getElementById("panel-backdrop");
  const panelBody  = document.getElementById("panel-body");
  const panelClose = document.getElementById("panel-close");

  const DEMO_HTML = `
    <h2>Request a Demo</h2>
    <p>Leave your details. We'll send a calendar link.</p>
    <form class="demo-form" id="demo-form" novalidate>
      <label>Name
        <input type="text" name="name" required />
      </label>
      <label>Email
        <input type="email" name="email" required />
      </label>
      <label>Company
        <input type="text" name="company" />
      </label>
      <label>What do you want to see?
        <textarea name="message" rows="3"></textarea>
      </label>
      <div class="demo-form__row">
        <button class="demo-form__submit" type="submit">Send</button>
        <span class="demo-form__msg" id="demo-msg"></span>
      </div>
    </form>`;

  function openPanel() {
    if (!panel) return;
    panelBody.innerHTML = DEMO_HTML;
    panel.hidden = false;
    if (backdrop) backdrop.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => panel.classList.add("is-open"));
    });
    const form = document.getElementById("demo-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = document.getElementById("demo-msg");
        if (msg) msg.textContent = "Sent. We'll be in touch.";
        form.reset();
      });
    }
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
  if (panelClose) panelClose.addEventListener("click", closePanel);
  if (backdrop)   backdrop.addEventListener("click", closePanel);

  // ---------------------------------------------------------------------
  // Menu dispatch: route each menu item to the right behavior.
  //   Products    -> cards already visible; expand first card as a hint
  //   Philosophy  -> navigate to its own page
  //   Demo        -> open form popup
  // ---------------------------------------------------------------------
  document.querySelectorAll(".menu__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "products") {
        // brief pulse so the user sees where the cards are
        if (products) {
          products.classList.add("pulse");
          setTimeout(() => products.classList.remove("pulse"), 600);
        }
      } else if (action === "philosophy") {
        window.location.href = "philosophy.html";
      } else if (action === "demo") {
        openPanel();
      }
    });
  });

  // Esc closes whatever's open.
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (panel && !panel.hidden) closePanel();
  });
})();

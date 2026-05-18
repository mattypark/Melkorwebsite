// Melkor — bg canvas of a moving eye (red field, black almond, pupil
// tracks left-right with occasional blink) + menu actions + C key
// contact shortcut.
//
// No external deps. All animation runs in a single rAF loop.

(function () {
  // ---------------------------------------------------------------------
  // Background: red field with a black almond-shaped eye. The pupil is
  // a red circle that sways smoothly left/right inside the eye, and the
  // eye blinks shut briefly on a slow interval.
  // ---------------------------------------------------------------------
  const bgCanvas = document.getElementById("bg-canvas");
  const bgCtx    = bgCanvas.getContext("2d");
  const DPR      = Math.min(window.devicePixelRatio || 1, 2);
  const BG_COLOR = "#ffffff";
  const FG_COLOR = "#000000";

  function bgResize() {
    bgCanvas.width        = window.innerWidth  * DPR;
    bgCanvas.height       = window.innerHeight * DPR;
    bgCanvas.style.width  = window.innerWidth  + "px";
    bgCanvas.style.height = window.innerHeight + "px";
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  bgResize();
  window.addEventListener("resize", bgResize);

  function bgFrame(t) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // white field
    bgCtx.fillStyle = BG_COLOR;
    bgCtx.fillRect(0, 0, W, H);

    // eye geometry — centered in the *open* area of the viewport, i.e.
    // to the right of the left menu column and above the bottom row of
    // product cards, so the eye doesn't get covered up.
    const MENU_RIGHT  = W < 720 ? 0 : 320;
    const CARDS_TOP   = H - 30 - Math.max(H * 0.42, 240);
    const cx = (MENU_RIGHT + W) / 2;
    const cy = CARDS_TOP / 2;
    const availW = W - MENU_RIGHT - 40;
    const availH = CARDS_TOP - 40;
    const ew = Math.min(availW * 0.85, availH / 0.42, 920);
    const eh = ew * 0.42;

    // blink: short pulse every ~4.5s; openness curves 1 -> 0 -> 1
    const BLINK_PERIOD = 4500;
    const BLINK_DUR    = 220;
    const tp = t % BLINK_PERIOD;
    let openness = 1;
    if (tp < BLINK_DUR) {
      const k = tp / BLINK_DUR;
      openness = 1 - Math.sin(k * Math.PI);
    }
    const halfH = (eh / 2) * openness;

    // almond: two quadratic curves meeting at the left and right points
    bgCtx.fillStyle = FG_COLOR;
    bgCtx.beginPath();
    bgCtx.moveTo(cx - ew / 2, cy);
    bgCtx.quadraticCurveTo(cx, cy - halfH * 2, cx + ew / 2, cy);
    bgCtx.quadraticCurveTo(cx, cy + halfH * 2, cx - ew / 2, cy);
    bgCtx.closePath();
    bgCtx.fill();

    // pupil: red circle drawn inside a clip of the eye so it never
    // bleeds past the lid; only shown when eye is open enough to see it
    if (openness > 0.05) {
      bgCtx.save();
      bgCtx.clip();
      const pupilR = eh * 0.48;
      const sweep  = (ew * 0.5 - pupilR) * 0.55;
      // smooth left/right sway, slow
      const sway   = Math.sin(t * 0.0006);
      const px     = cx + sway * sweep;
      bgCtx.fillStyle = BG_COLOR;
      bgCtx.beginPath();
      bgCtx.arc(px, cy, pupilR, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
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

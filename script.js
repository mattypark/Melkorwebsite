// Melkor — bg canvas of 1s/0s + menu actions (products view, philosophy
// page nav, demo form popup) + C key contact shortcut.
//
// No external deps. All animation runs in a single rAF loop.

(function () {
  // ---------------------------------------------------------------------
  // Background: a grid of 1s and 0s drawn on a canvas. Each cell has a
  // slow alpha pulse phase so the whole field shimmers, and each cell
  // has a small per-frame chance of flipping 0<->1 so the field is
  // visibly "changing" without ever scrolling.
  // ---------------------------------------------------------------------
  const bgCanvas = document.getElementById("bg-canvas");
  const bgCtx    = bgCanvas.getContext("2d");
  const CELL     = 22;     // px between cells
  const FONT_PX  = 11;
  const DPR      = Math.min(window.devicePixelRatio || 1, 2);
  let cols = 0, rows = 0;
  let cells = [];          // flat array, length = cols*rows

  function bgResize() {
    bgCanvas.width        = window.innerWidth  * DPR;
    bgCanvas.height       = window.innerHeight * DPR;
    bgCanvas.style.width  = window.innerWidth  + "px";
    bgCanvas.style.height = window.innerHeight + "px";
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cols = Math.ceil(window.innerWidth  / CELL) + 1;
    rows = Math.ceil(window.innerHeight / CELL) + 1;
    cells = new Array(cols * rows);
    for (let i = 0; i < cells.length; i++) {
      cells[i] = {
        v: Math.random() < 0.5 ? "0" : "1",
        p: Math.random() * Math.PI * 2          // per-cell pulse phase
      };
    }
  }
  bgResize();
  window.addEventListener("resize", bgResize);

  function bgFrame(t) {
    bgCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    bgCtx.font = FONT_PX + 'px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";
    const time = t * 0.0008;
    for (let r = 0; r < rows; r++) {
      const y = r * CELL + CELL / 2;
      for (let c = 0; c < cols; c++) {
        const cell = cells[r * cols + c];
        // small flip chance: keeps the field "changing"
        if (Math.random() < 0.0015) cell.v = cell.v === "0" ? "1" : "0";
        // alpha breathing per cell
        const a = 0.18 + Math.sin(time + cell.p) * 0.10;
        bgCtx.fillStyle = "rgba(45, 92, 220, " + a.toFixed(3) + ")";
        bgCtx.fillText(cell.v, c * CELL + CELL / 2, y);
      }
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
  // Products view: 3 cards on the right. Click + on any card to expand
  // it (the other two shrink via flex). Click again to collapse.
  // ---------------------------------------------------------------------
  const products      = document.getElementById("products");
  const productsClose = document.getElementById("products-close");

  function openProducts() {
    if (!products) return;
    products.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => products.classList.add("is-open"));
    });
  }
  function closeProducts() {
    if (!products) return;
    products.classList.remove("is-open");
    // collapse any expanded card so it resets next open
    products.classList.remove("has-expanded");
    products.querySelectorAll(".product-card.is-expanded").forEach((c) => c.classList.remove("is-expanded"));
    const onEnd = () => {
      if (!products.classList.contains("is-open")) products.hidden = true;
      products.removeEventListener("transitionend", onEnd);
    };
    products.addEventListener("transitionend", onEnd);
  }
  if (productsClose) productsClose.addEventListener("click", closeProducts);

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
  //   Products    -> open products view
  //   Philosophy  -> navigate to its own page
  //   Demo        -> open form popup
  // ---------------------------------------------------------------------
  document.querySelectorAll(".menu__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "products")        openProducts();
      else if (action === "philosophy") window.location.href = "philosophy.html";
      else if (action === "demo")       openPanel();
    });
  });

  // Esc closes whatever's open.
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (panel && !panel.hidden) closePanel();
    if (products && !products.hidden) closeProducts();
  });
})();

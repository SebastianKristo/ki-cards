/* ki-tabs-card – faner med kort i hver fane.
   style: pills (piller) | dropdown (én pille som åpner meny) | auto (piller, dropdown når de ikke får plass – standard)
   sticky: true holder fanelinja øverst når innholdet scroller (gjennomsiktig med blur, eller bg: <farge>). */
(function (KI) {
  class SkTabsCard extends KI.Card {
    static getStubConfig() { return { tabs: [{ title: "Fane 1", cards: [] }] }; }
    setConfig(config) {
      if (!config.tabs || !config.tabs.length) throw new Error("tabs mangler");
      this._active = config.default || 0;
      this._config = config; this._built = false; this._menuOpen = false;
      if (this._hass) this._build();
    }
    set hass(h) { this._hass = h; if (!this._built) this._build(); (this._panels || []).forEach(p => p.hass = h); }
    get hass() { return this._hass; }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._docClick) document.removeEventListener("click", this._docClick, true);
      if (this._lukk) { window.removeEventListener("resize", this._flytt); window.removeEventListener("scroll", this._lukk, true); }
      if (this._esc) document.removeEventListener("keydown", this._esc);
      this._menuOpen = false; this.classList.remove("ki-meny-apen");
    }

    async _build() {
      this._built = true;
      const c = this._config; const tabs = c.tabs; const style = c.style || "auto";
      const sticky = !!c.sticky;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        :host { overflow:visible; position:relative; }
        :host(.ki-meny-apen) { z-index:99; }
        .wrap { display:flex; flex-direction:column; gap:${c.gap ?? 12}px; max-width:100%; }
        .bar { display:flex; justify-content:${c.align || "center"}; position:relative; z-index:6; max-width:100%;
          ${sticky ? `position:sticky; top:0; padding:6px 0 8px; margin:-6px 0 -8px; border-radius:0 0 18px 18px;
            background:${c.bg || "var(--ki-tabs-bg, transparent)"}; ${c.bg ? "" : "backdrop-filter:blur(14px) saturate(1.2); -webkit-backdrop-filter:blur(14px) saturate(1.2);"}` : ""} }
        .tabs { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
        .tab, .dd { border:0; background:transparent; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
          padding:9px 20px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:6px; white-space:nowrap;
          transition:background .15s, color .15s; --mdc-icon-size:18px; }
        .tab:hover, .dd:hover { color:rgba(255,255,255,.95); }
        .tab.active, .dd { background:var(--active-big); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
        .tab:focus-visible, .dd:focus-visible, .item:focus-visible { outline:2px solid var(--active-big); outline-offset:2px; }
        .dd .chev { transition:transform .15s; --mdc-icon-size:20px; margin-right:-6px; }
        .dd.open .chev { transform:rotate(180deg); }
        .menu { position:fixed; left:0; top:0; min-width:220px; max-width:calc(100vw - 32px); max-height:min(60vh, 420px); overflow-y:auto;
          background:var(--gray200); color:var(--gray1000); border-radius:18px; padding:6px;
          box-shadow:0 12px 32px rgba(0,0,0,.5); display:none; z-index:999; -webkit-overflow-scrolling:touch; }
        .menu.open { display:grid; gap:2px; }
        .item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; font-size:14px; font-weight:500; cursor:pointer; --mdc-icon-size:20px; }
        .item:hover { background:var(--gray100); }
        .item.active { background:var(--active-big); color:rgba(70,58,64,.95); }
        .item .n { flex:1; }
        .item .cnt { font-size:12px; opacity:.55; }
        .measure { position:absolute; visibility:hidden; pointer-events:none; left:0; top:0; }
        .panel { display:none; min-width:0; max-width:100%; } .panel.active { display:block; }
        .stack { display:grid; gap:8px; min-width:0; }
        @media (prefers-reduced-motion: reduce) { .tab, .dd, .dd .chev { transition:none; } }
      </style>
      <div class="wrap">
        <div class="bar">
          <div class="tabs pills" role="tablist">
            ${tabs.map((t, i) => `<button class="tab ${i === this._active ? "active" : ""}" role="tab" data-i="${i}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          <div class="tabs pills measure" aria-hidden="true">
            ${tabs.map(t => `<button class="tab">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          <button class="dd" aria-haspopup="listbox" aria-expanded="false"></button>
          <div class="menu" role="listbox">
            ${tabs.map((t, i) => `<div class="item ${i === this._active ? "active" : ""}" role="option" tabindex="0" data-i="${i}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}<span class="n">${KI.esc(t.title || "")}</span></div>`).join("")}
          </div>
        </div>
        ${tabs.map((t, i) => `<div class="panel ${i === this._active ? "active" : ""}" data-i="${i}"><div class="stack"></div></div>`).join("")}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.addEventListener("click", () => this._select(+b.dataset.i)));
      r.querySelectorAll(".item").forEach(el => { const go = () => { this._select(+el.dataset.i); this._toggleMenu(false); }; el.addEventListener("click", go); KI.key(el, go); });
      r.querySelector(".dd").addEventListener("click", e => { e.stopPropagation(); this._toggleMenu(); });
      this._docClick = (e) => { if (this._menuOpen && !e.composedPath().includes(this)) this._toggleMenu(false); };
      document.addEventListener("click", this._docClick, true);

      this._mode = style;
      if (style === "auto") {
        const apply = () => {
          const bar = r.querySelector(".bar"), m = r.querySelector(".measure");
          if (!bar || !m) return;
          const fits = m.scrollWidth <= bar.clientWidth - 4;
          this._setMode(fits ? "pills" : "dropdown");
        };
        this._ro = new ResizeObserver(apply); this._ro.observe(r.querySelector(".bar"));
        requestAnimationFrame(apply);
      } else this._setMode(style);
      this._renderDd();

      this._panels = [];
      for (let i = 0; i < tabs.length; i++) {
        const t = tabs[i]; const cards = t.cards || (t.card ? [t.card] : []);
        const host = r.querySelector(`.panel[data-i="${i}"] .stack`);
        for (const cc of cards) {
          try { const el = await KI.createCard(cc); el.hass = this._hass; host.appendChild(el); this._panels.push(el); }
          catch (e) { host.innerHTML += `<div class="empty">Kunne ikke laste kort: ${KI.esc(e.message)}</div>`; }
        }
      }
    }
    _setMode(mode) {
      const r = this.shadowRoot; const pills = r.querySelector(".tabs.pills:not(.measure)"), dd = r.querySelector(".dd");
      pills.style.display = mode === "pills" ? "" : "none";
      dd.style.display = mode === "dropdown" ? "" : "none";
      if (mode !== "dropdown") this._toggleMenu(false);
    }
    _renderDd() {
      const t = this._config.tabs[this._active] || {};
      const dd = this.shadowRoot.querySelector(".dd");
      dd.innerHTML = `${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>`;
    }
    /* Menyen ligger i fast posisjon og plasseres etter knappen, så den ikke
       klippes av kort under eller av foreldre med overflow:hidden. */
    _plasserMeny() {
      const r = this.shadowRoot, dd = r.querySelector(".dd"), menu = r.querySelector(".menu");
      if (!dd || !menu) return;
      const b = dd.getBoundingClientRect();
      menu.style.visibility = "hidden"; menu.style.display = "grid";
      const mb = menu.getBoundingClientRect();
      menu.style.display = ""; menu.style.visibility = "";
      const marg = 12;
      let venstre = b.left + b.width / 2 - mb.width / 2;
      venstre = Math.min(Math.max(marg, venstre), Math.max(marg, window.innerWidth - mb.width - marg));
      const under = window.innerHeight - b.bottom - marg;
      const over = b.top - marg;
      const nedenfor = under >= Math.min(mb.height, 200) || under >= over;
      menu.style.left = Math.round(venstre) + "px";
      menu.style.top = nedenfor ? Math.round(b.bottom + 6) + "px" : "auto";
      menu.style.bottom = nedenfor ? "auto" : Math.round(window.innerHeight - b.top + 6) + "px";
      menu.style.maxHeight = "min(" + Math.max(160, Math.round(nedenfor ? under : over)) + "px, 60vh)";
    }
    _toggleMenu(open) {
      this._menuOpen = open === undefined ? !this._menuOpen : open;
      const r = this.shadowRoot;
      if (this._menuOpen) this._plasserMeny();
      r.querySelector(".menu").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").setAttribute("aria-expanded", String(this._menuOpen));
      this.classList.toggle("ki-meny-apen", this._menuOpen);
      if (this._menuOpen) {
        if (!this._lukk) {
          this._lukk = () => this._toggleMenu(false);
          this._flytt = () => { if (this._menuOpen) this._plasserMeny(); };
        }
        window.addEventListener("resize", this._flytt);
        window.addEventListener("scroll", this._lukk, true);
        document.addEventListener("keydown", this._esc = this._esc || ((e) => { if (e.key === "Escape") this._toggleMenu(false); }));
      } else if (this._lukk) {
        window.removeEventListener("resize", this._flytt);
        window.removeEventListener("scroll", this._lukk, true);
        if (this._esc) document.removeEventListener("keydown", this._esc);
      }
    }
    _select(i) {
      this._active = i; const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".item").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", +p.dataset.i === i));
      this._renderDd();
      KI.fire(this, "ki-tab-changed", { index: i });
    }
    getCardSize() { return 4; }
  }
  customElements.define("ki-tabs-card", SkTabsCard);
  KI.register("ki-tabs-card", "KI Tabs", "Faner som piller eller nedtrekksmeny, med kort i hver fane");
})(window.KI);

/* ki-tabs-card – pillefaner (erstatter simple-tabs + card_mod) */
(function (SK) {
  class SkTabsCard extends SK.Card {
    static getStubConfig() { return { tabs: [{ title: "Fane 1", cards: [] }] }; }
    setConfig(config) {
      if (!config.tabs || !config.tabs.length) throw new Error("tabs mangler");
      this._active = config.default || 0;
      this._config = config; this._built = false;
      if (this._hass) this._build();
    }
    set hass(h) { this._hass = h; if (!this._built) this._build(); (this._panels || []).forEach(p => p.hass = h); }
    get hass() { return this._hass; }
    async _build() {
      this._built = true;
      const tabs = this._config.tabs;
      this.shadowRoot.innerHTML = `<style>${SK.css}
        .wrap { display:flex; flex-direction:column; gap:12px; }
        .bar { display:flex; justify-content:${this._config.align || "center"}; }
        .tabs { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; }
        .tab { border:0; background:transparent; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
          padding:9px 22px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:background .15s, color .15s; }
        .tab:hover { color:rgba(255,255,255,.95); }
        .tab.active { background:var(--active-big); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
        .tab:focus-visible { outline:2px solid var(--active-big); outline-offset:2px; }
        .panel { display:none; } .panel.active { display:block; }
        .stack { display:grid; gap:8px; }
      </style>
      <div class="wrap">
        <div class="bar"><div class="tabs" role="tablist">
          ${tabs.map((t, i) => `<button class="tab ${i === this._active ? "active" : ""}" role="tab" data-i="${i}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${t.title || ""}</button>`).join("")}
        </div></div>
        ${tabs.map((t, i) => `<div class="panel ${i === this._active ? "active" : ""}" data-i="${i}"><div class="stack"></div></div>`).join("")}
      </div>`;
      this.shadowRoot.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => this._select(+b.dataset.i)));
      this._panels = [];
      for (let i = 0; i < tabs.length; i++) {
        const t = tabs[i]; const cards = t.cards || (t.card ? [t.card] : []);
        const host = this.shadowRoot.querySelector(`.panel[data-i="${i}"] .stack`);
        for (const cc of cards) {
          try { const el = await SK.createCard(cc); el.hass = this._hass; host.appendChild(el); this._panels.push(el); }
          catch (e) { host.innerHTML += `<div style="opacity:.6;font-size:13px">Kunne ikke laste kort: ${e.message}</div>`; }
        }
      }
    }
    _select(i) {
      this._active = i;
      this.shadowRoot.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      this.shadowRoot.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", +p.dataset.i === i));
    }
    getCardSize() { return 4; }
  }
  customElements.define("ki-tabs-card", SkTabsCard);
  SK.register("ki-tabs-card", "KI Tabs", "Pillefaner med kort i hver fane");
})(window.SK);

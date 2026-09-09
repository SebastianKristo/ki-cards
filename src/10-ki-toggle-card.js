/* ki-toggle-card – erstatter template_toggle_card (large) og template_toggle_card_small (row) */
(function (KI) {
  class SkToggleCard extends KI.Card {
    static getStubConfig() { return { entity: "input_boolean.example", size: "row" }; }
    _cfg() {
      const c = this._config;
      return {
        entity: c.entity, name: c.name, label: c.label, icon: c.icon,
        size: c.size || "row",                 // "row" | "tile"
        background: c.background || "var(--gray200)",
        state_on: c.state_on ?? "På", state_off: c.state_off ?? "Av",
        show_state: c.show_state !== false,
        tap: c.tap_action || "toggle", hold: c.hold_action || "more-info",
      };
    }
    _key() { const c = this._cfg(); const s = this.st(c.entity); return JSON.stringify([c, s && s.state, s && s.attributes.friendly_name, s && s.attributes.icon]); }
    _render() {
      const c = this._cfg(); const s = this.st(c.entity);
      const on = this.on(c.entity);
      const name = c.name || KI.friendly(this._hass, c.entity);
      const icon = c.icon === null ? null : (c.icon || (s && s.attributes.icon) || "mdi:toggle-switch");
      const stateTxt = on ? c.state_on : c.state_off;
      const tile = c.size === "tile";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background}; display:flex; gap:12px; align-items:center;
          padding:${tile ? "14px 14px 12px" : "8px 14px 8px 8px"}; min-height:${tile ? "96px" : "56px"};
          ${tile ? "flex-direction:column; align-items:flex-start; justify-content:space-between;" : ""} }
        .txt { flex:1; min-width:0; }
        .txt .name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tile-bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dot { width:10px; height:10px; border-radius:50%; background:var(--gray400); flex:none; }
        .dot.on { background:var(--green); }
        ${!icon && !tile ? ".card{padding-left:16px}" : ""}
        ${s ? "" : ".card{opacity:.5}"}
      </style>
      <div class="card press" role="switch" aria-checked="${on}" tabindex="0">
        ${tile ? `
          ${icon ? `<div class="icon-wrap ${on ? "on" : ""}"><ha-icon icon="${icon}"></ha-icon></div>` : ""}
          <div class="tile-bottom">
            <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
            ${c.show_state ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : ""}
          </div>` : `
          ${icon ? `<div class="icon-wrap ${on ? "on" : ""}"><ha-icon icon="${icon}"></ha-icon></div>` : ""}
          <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
          ${c.show_state ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : ""}
          <div class="dot ${on ? "on" : ""}"></div>`}
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      const act = (a) => {
        if (a === "toggle") KI.toggle(this._hass, c.entity);
        else if (a === "more-info") KI.moreInfo(this, c.entity);
      };
      KI.bindPress(el, () => act(c.tap), () => act(c.hold));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(c.tap); } });
    }
    getCardSize() { return this._config.size === "tile" ? 2 : 1; }
  }
  customElements.define("ki-toggle-card", SkToggleCard);
  KI.register("ki-toggle-card", "KI Toggle", "Bryterkort i rad- eller flisformat");
})(window.KI);

/* ki-toggle-card – bryter som rad (pille med ikon og bryter) eller flis */
(function (KI) {
  const DOMAIN_ICON = { automation: "mdi:robot", input_boolean: "mdi:toggle-switch-variant", switch: "mdi:power",
    light: "mdi:lightbulb", fan: "mdi:fan", script: "mdi:script-text" };

  class KiToggleCard extends KI.Card {
    static getStubConfig() { return { entity: "input_boolean.example", size: "row" }; }
    _cfg() {
      const c = this._config;
      return {
        entity: c.entity, name: c.name, label: c.label, icon: c.icon,
        size: c.size || "row",                 // "row" | "tile"
        control: c.control || (c.size === "tile" ? "text" : "switch"), // "switch" | "dot" | "text" | "none"
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
      const domain = (c.entity || "").split(".")[0];
      const icon = c.icon === null ? null : (c.icon || (s && s.attributes.icon) || DOMAIN_ICON[domain] || "mdi:toggle-switch");
      const stateTxt = on ? c.state_on : c.state_off;
      const tile = c.size === "tile";
      const ctl = c.control;
      const control =
        ctl === "switch" ? `<div class="sw ${on ? "on" : ""}" aria-hidden="true"><i></i></div>` :
        ctl === "dot" ? `<div class="dot ${on ? "on" : ""}"></div>` :
        ctl === "text" && c.show_state ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : "";

      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background}; display:flex; gap:14px; align-items:center;
          ${tile
            ? "flex-direction:column; align-items:flex-start; justify-content:space-between; padding:16px 16px 14px; min-height:128px; height:100%;"
            : "border-radius:999px; padding:8px 18px 8px 8px; min-height:64px;"} }
        .icon-wrap { width:48px; height:48px; background:var(--gray300, rgba(255,255,255,.08)); }
        .icon-wrap.on { background:var(--active-big); }
        ha-icon { --mdc-icon-size: 24px; }
        .txt { flex:1; min-width:0; }
        .txt .name { ${tile ? "font-size:16px;" : "font-size:15px;"} white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tile-bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dot { width:10px; height:10px; border-radius:50%; background:var(--gray400); flex:none; }
        .dot.on { background:var(--green); }
        .sw { width:44px; height:24px; border-radius:12px; background:var(--gray400); position:relative; flex:none; transition:background .15s; }
        .sw i { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:var(--gray1000); transition:transform .15s; }
        .sw.on { background:var(--gray1000); }
        .sw.on i { background:var(--gray200); transform:translateX(20px); }
        ${!icon && !tile ? ".card{padding-left:20px}" : ""}
        ${tile ? ":host{height:100%}" : ""}
        ${s ? "" : ".card{opacity:.5}"}
        @media (prefers-reduced-motion: reduce) { .sw, .sw i { transition:none; } }
      </style>
      <div class="card press" role="switch" aria-checked="${on}" tabindex="0">
        ${icon ? `<div class="icon-wrap ${on && tile ? "on" : ""}"><ha-icon icon="${icon}"></ha-icon></div>` : ""}
        ${tile ? `
          <div class="tile-bottom">
            <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
            ${control}
          </div>` : `
          <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
          ${ctl !== "text" && this._config.show_state === true ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : ""}
          ${control}`}
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
  customElements.define("ki-toggle-card", KiToggleCard);
  KI.register("ki-toggle-card", "KI Toggle", "Bryterkort i rad- (pille med bryter) eller flisformat");
})(window.KI);

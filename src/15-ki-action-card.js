/* ki-action-card – handlingsknapp (erstatter template_trigger_card) */
(function (KI) {
  class SkActionCard extends KI.Card {
    static getStubConfig() { return { name: "Kjør", icon: "mdi:play-circle", action: { service: "automation.trigger", target: { entity_id: "automation.example" } } }; }
    _key() { return JSON.stringify(this._config); }
    _render() {
      const c = this._config;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray100)"}; display:flex; align-items:center; gap:12px; padding:8px 14px 8px 8px; min-height:56px; }
        .name { flex:1; }
        .chev { opacity:.45; }
      </style>
      <div class="card press" role="button" tabindex="0">
        ${c.icon ? `<div class="icon-wrap"><ha-icon icon="${c.icon}"></ha-icon></div>` : ""}
        <div class="name">${c.name || ""}</div>
        <ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>
      </div>`;
      const run = async () => {
        if (c.confirm && !window.confirm(c.confirm)) return;
        const a = c.action || {}; const [dom, svc] = (a.service || a.perform_action || "").split(".");
        if (!dom || !svc) return;
        await this._hass.callService(dom, svc, a.data || {}, a.target);
      };
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, run);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
    }
  }
  customElements.define("ki-action-card", SkActionCard);
  KI.register("ki-action-card", "KI Action", "Knapp som kjører en tjeneste, med valgfri bekreftelse");
})(window.KI);

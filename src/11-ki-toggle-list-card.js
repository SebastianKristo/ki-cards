/* ki-toggle-list-card – auto-entities-lignende liste av ki-toggle-card */
(function (KI) {
  class SkToggleListCard extends KI.Card {
    static getStubConfig() { return { include: [{ entity_id: "automation.*" }] }; }
    _matches() {
      const c = this._config; const inc = c.include || []; const exc = c.exclude || [];
      const hit = (rule, id) => {
        const s = this._hass.states[id];
        if (rule.domain && id.split(".")[0] !== rule.domain) return false;
        if (rule.entity_id && !KI.glob(rule.entity_id, id)) return false;
        if (rule.state && s.state !== rule.state) return false;
        return true;
      };
      let ids = Object.keys(this._hass.states).filter(id => inc.some(r => hit(r, id)) && !exc.some(r => hit(r, id)));
      const sort = c.sort || "name";
      const fn = sort === "domain"
        ? (a, b) => a.localeCompare(b)
        : (a, b) => KI.friendly(this._hass, a).localeCompare(KI.friendly(this._hass, b), "nb");
      ids.sort(fn);
      return ids;
    }
    _key() { if (!this._hass) return ""; const ids = this._matches(); return JSON.stringify([this._config, ids, ids.map(i => this._hass.states[i].state),
      (this._config.include || []).filter(r => r.label_entity && this._hass.states[r.label_entity]).map(r => { const st = this._hass.states[r.label_entity]; return r.label_attribute ? st.attributes[r.label_attribute] : st.state; })]); }
    _render() {
      const ids = this._matches(); const item = this._config.item || {};
      const gap = this._config.gap ?? 8;
      this.shadowRoot.innerHTML = `<style>:host{display:block} .list{display:grid;gap:${gap}px}
        .empty{font-size:13px;opacity:.55;padding:6px 4px}</style><div class="list"></div>`;
      const list = this.shadowRoot.querySelector(".list");
      if (!ids.length) { list.innerHTML = `<div class="empty">${this._config.empty || "Ingenting å vise"}</div>`; return; }
      const inc = this._config.include || [];
      this._children = ids.map(id => {
        const el = document.createElement("ki-toggle-card");
        // en include-regel som treffer nøyaktig denne entiteten kan gi name/label/label_entity/label_attribute/label_format/icon
        const over = inc.find(r => r.entity_id === id) || {};
        const { entity_id, domain, state, ...extra } = over;
        el.setConfig({ size: "row", icon: null, background: "var(--gray200)", ...item, ...extra, entity: id });
        el.hass = this._hass; list.appendChild(el); return el;
      });
    }
    _passHass(h) { (this._children || []).forEach(el => el.hass = h); }
    getCardSize() { return (this._children || []).length || 1; }
  }
  customElements.define("ki-toggle-list-card", SkToggleListCard);
  KI.register("ki-toggle-list-card", "KI Toggle List", "Automatisk liste av brytere fra filter");
})(window.KI);

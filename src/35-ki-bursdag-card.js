/* ki-bursdag-card – bursdager fra Birthdays-sensorer. visning: kommende | aar | tabs */
(function (KI) {
  const DAG = 86400000;
  const MND = ["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"];
  const MND_KORT = ["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];
  const UKEDAG = ["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"];
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const midnatt = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseDato = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(v); return isNaN(d) ? null : d;
  };

  class KiBursdagCard extends KI.Card {
    static getStubConfig() { return { regex: "birthday|bursdag", antall: 3 }; }
    setConfig(c) { this._tab = c.visning === "aar" ? "aar" : "kommende"; super.setConfig(c); }

    /* Finner sensorer: eksplisitt liste, ellers regex mot entity_id */
    _entities() {
      const c = this._config;
      if (c.entities && c.entities.length) return c.entities.map(e => typeof e === "string" ? { entity: e } : e);
      const re = new RegExp(c.regex || "birthday|bursdag", "i");
      return Object.keys(this._hass.states).filter(id => re.test(id)).map(id => ({ entity: id }));
    }

    /* Tolker én sensor til {navn, fodt, neste, dager, alder} – tåler flere sensorformater */
    _person(e) {
      const s = this.st(e.entity); if (!s) return null;
      const a = s.attributes || {};
      const idag = midnatt(new Date());
      let fodt = parseDato(a.date || a.birthday || a.date_of_birth || a.birthdate || a.dato);
      let neste = null;
      if (fodt) {
        neste = new Date(idag.getFullYear(), fodt.getMonth(), fodt.getDate());
        if (neste < idag) neste = new Date(idag.getFullYear() + 1, fodt.getMonth(), fodt.getDate());
      } else if (/^\d+$/.test(s.state)) {
        neste = new Date(idag.getTime() + parseInt(s.state, 10) * DAG);
      } else {
        neste = parseDato(s.state);
        if (neste && neste < idag) neste = new Date(idag.getFullYear() + 1, neste.getMonth(), neste.getDate());
      }
      if (!neste) return null;
      const dager = Math.round((midnatt(neste) - idag) / DAG);
      let alder = a.age_at_next_birthday ?? a.age ?? a.alder ?? null;
      if (alder === null && fodt) alder = neste.getFullYear() - fodt.getFullYear();
      let navn = e.name || (this._config.navn && this._config.navn[e.entity]) || a.friendly_name || e.entity;
      navn = cap(navn.replace(/birthday|bursdag|fødselsdag/ig, "").replace(/[_:-]/g, " ").trim()) || navn;
      return { id: e.entity, navn, fodt, neste, dager, alder: alder !== null ? +alder : null, icon: e.icon };
    }

    _key() {
      if (!this._hass) return "";
      const dag = Math.floor(Date.now() / DAG);
      return JSON.stringify([this._config, this._tab, dag, this._entities().map(e => { const s = this.st(e.entity); return s ? [s.state, s.attributes.date, s.attributes.age_at_next_birthday] : null; })]);
    }

    _render() {
      const c = this._config;
      const alle = this._entities().map(e => this._person(e)).filter(Boolean).sort((a, b) => a.dager - b.dager);
      const antall = c.antall ?? 3;
      const tabs = (c.visning || "tabs") === "tabs";
      const bg = c.background || "var(--gray200)";
      const ikon = c.icon || "mdi:cake-variant";
      const visKommende = this._tab === "kommende";

      const fyller = (p) => p.alder !== null ? `${p.navn} fyller ${p.alder}` : p.navn;
      const rel = (p) => p.dager === 0 ? "i dag" : p.dager === 1 ? "i morgen" : p.dager < 7 ? `om ${p.dager} dager` : p.dager < 14 ? "om 1 uke" : p.dager < 60 ? `om ${Math.round(p.dager / 7)} uker` : `om ${Math.round(p.dager / 30)} mnd`;
      const lang = (p) => `${UKEDAG[p.neste.getDay()]} ${p.neste.getDate()}. ${MND[p.neste.getMonth()]}`;
      const kort = (p) => `${p.neste.getDate()}. ${MND_KORT[p.neste.getMonth()]}`;

      const rad = (p, sub, hoyre) => `
        <div class="row press" data-id="${p.id}" role="button" tabindex="0">
          <div class="icon-wrap ${p.dager <= 1 ? "on" : ""}"><ha-icon icon="${p.icon || ikon}"></ha-icon></div>
          <div class="txt"><div class="name">${fyller(p)}</div><div class="label">${sub}</div></div>
          ${hoyre ? `<div class="state ${p.dager <= 7 ? "on" : ""}">${hoyre}</div>` : ""}
        </div>`;

      let innhold;
      if (!alle.length) {
        innhold = `<div class="empty">${c.tom || "Ingen bursdagssensorer traff mønsteret"}${c.entities ? "" : ` <code>${c.regex || "birthday|bursdag"}</code>`}</div>`;
      } else if (visKommende) {
        innhold = alle.slice(0, antall).map(p => rad(p, `${lang(p)} · ${rel(p)}`, p.dager <= 7 ? cap(rel(p)) : "")).join("");
      } else {
        // Hele året: gruppert per måned fra og med denne måneden
        const naa = new Date().getMonth();
        const grupper = [];
        for (let i = 0; i < 12; i++) {
          const m = (naa + i) % 12;
          const liste = alle.filter(p => p.neste.getMonth() === m).sort((a, b) => a.neste.getDate() - b.neste.getDate());
          if (liste.length) grupper.push({ m, liste });
        }
        innhold = grupper.map(g => `<div class="section">${cap(MND[g.m])}</div>` + g.liste.map(p => rad(p, `${UKEDAG[p.neste.getDay()]} · ${rel(p)}`, kort(p))).join("")).join("");
      }

      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${bg}; padding:${tabs ? "10px 8px 8px" : "8px"}; margin-bottom:${c.margin ?? "12px"}; }
        .head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 6px 8px; }
        .head .title { font-size:13px; font-weight:600; opacity:.55; }
        .pills { display:flex; gap:4px; }
        .pills .chip { cursor:pointer; opacity:.6; }
        .pills .chip.on { opacity:1; }
        .row { display:flex; align-items:center; gap:12px; min-height:56px; padding:0 8px 0 0; border-radius:16px; }
        .txt { flex:1; min-width:0; }
        .txt .name, .txt .label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .section { padding:10px 8px 4px; }
        code { font-size:12px; opacity:.8; }
      </style>
      <div class="card">
        ${tabs || c.tittel ? `<div class="head">
          <div class="title">${c.tittel ?? "Bursdager"}</div>
          ${tabs ? `<div class="pills">
            <div class="chip ${visKommende ? "on" : ""}" data-tab="kommende">Kommende</div>
            <div class="chip ${!visKommende ? "on" : ""}" data-tab="aar">Hele året</div>
          </div>` : ""}
        </div>` : ""}
        ${innhold}
      </div>`;

      const r = this.shadowRoot;
      r.querySelectorAll("[data-tab]").forEach(el => el.addEventListener("click", () => { this._tab = el.dataset.tab; this._lastKey = null; this._maybeRender(); }));
      r.querySelectorAll(".row").forEach(el => {
        const open = () => KI.moreInfo(this, el.dataset.id);
        KI.bindPress(el, open, open);
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      });
    }
    getCardSize() { return this._tab === "aar" ? 8 : (this._config.antall ?? 3) + 1; }
  }
  customElements.define("ki-bursdag-card", KiBursdagCard);
  KI.register("ki-bursdag-card", "KI Bursdag", "Bursdager: kommende og hele året, fra Birthdays-sensorer");
})(window.KI);

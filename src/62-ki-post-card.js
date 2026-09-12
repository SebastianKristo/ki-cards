/* ki-post-card – når posten kommer, i samme stil som resten av dashbordet.
 *
 * type: custom:ki-post-card
 * entity: sensor.nar_kommer_posten_posten_sensor_next
 * relativ: sensor.nar_kommer_posten_posten_sensor_next_relative
 * navn: Post
 * tekst: Post leveres
 * path: '#post'             # valgfritt: trykk navigerer hit
 */
const KI_POST_VERSJON = "1.1.0";

const KI_POST_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:20px; cursor:pointer;
    display:grid; grid-template-areas:"dag ." "dato tekst"; grid-template-columns:min-content 1fr;
    align-items:center; transition:background .4s var(--fjaer); }
  .kort.i_dag { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .dag { grid-area:dag; font-size:13px; opacity:.6; text-transform:capitalize; }
  .kort.i_dag .dag { opacity:.75; }
  .dato { grid-area:dato; font-size:2.6em; font-weight:300; line-height:1.05; white-space:nowrap;
    padding-right:20px; font-variant-numeric:tabular-nums; }
  .tekst { grid-area:tekst; min-width:0; }
  .tekst .n { font-size:15px; font-weight:500; }
  .tekst .u { font-size:13px; opacity:.6; margin-top:2px; }
  .kort.i_dag .tekst .u { opacity:.75; }
  .kasse { position:absolute; right:16px; top:50%; transform:translateY(-50%); width:74px; height:74px; opacity:.22; }
  .kort.i_dag .kasse { opacity:.35; }
  .flagg { transform-box:fill-box; transform-origin:bottom left; }
  .kort.i_dag .flagg { animation:po-flagg 2.6s ease-in-out infinite; }
  @keyframes po-flagg { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(-16deg); } }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiPoEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_PO_MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

class KiPostCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-post-card-editor"); }
  static getStubConfig() { return { entity: "sensor.nar_kommer_posten_posten_sensor_next" }; }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 12, rows: 2, min_rows: 2 }; }

  setConfig(c) {
    if (!c || !c.entity) throw new Error("Sett entity: til sensoren med neste leveringsdato");
    this._c = { navn: "Post", tekst: "Post leveres", ...c };
    this._forrige = null;
  }
  /* Skjules når lanseringskortet står på serier, filmer eller kalender */
  _visningslytter() {
    if (this._visAv) return;
    this._visAv = (e) => {
      const v = (e && e.detail && e.detail.visning) || "alle";
      const skjul = [].concat(this._c && this._c.skjul_paa !== undefined
        ? this._c.skjul_paa : ["serie", "film", "kalender"]);
      this.style.display = skjul.includes(v) ? "none" : "";
    };
    window.addEventListener("ki-lansering-visning", this._visAv);
  }
  connectedCallback() { this._visningslytter(); }
  disconnectedCallback() {
    if (this._visAv) { window.removeEventListener("ki-lansering-visning", this._visAv); this._visAv = null; }
  }

  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    const ids = [this._c.entity, this._c.relativ].filter(Boolean);
    if (!g || ids.some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _trykk() {
    const c = this._c;
    if (c.path) {
      history.pushState(null, "", c.path);
      window.dispatchEvent(new Event("location-changed"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: c.entity }, bubbles: true, composed: true }));
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const st = h.states[c.entity];
    const d = st ? new Date(st.state) : null;
    if (!st || !d || isNaN(d)) {
      const tom = `<style>${KI_POST_STIL}</style><div class="tom">Fant ingen leveringsdato.</div>`;
      if (tom !== this._forrige) { this.shadowRoot.innerHTML = tom; this._forrige = tom; }
      return;
    }
    const nå = new Date(); nå.setHours(0, 0, 0, 0);
    const dag = new Date(d); dag.setHours(0, 0, 0, 0);
    const diff = Math.round((dag - nå) / 86400000);
    const rel = c.relativ && h.states[c.relativ] ? h.states[c.relativ].state : "";
    const ukedag = d.toLocaleDateString("nb-NO", { weekday: "long" });
    const under = rel || (diff === 0 ? "I dag" : diff === 1 ? "I morgen" : `om ${diff} dager`);

    const html = `<style>${KI_POST_STIL}</style>
      <div class="kort ${diff === 0 ? "i_dag" : ""}" role="button" tabindex="0">
        <svg class="kasse" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor"
          stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 28a10 10 0 0 1 20 0v18H12z" fill="currentColor" fill-opacity=".12"/>
          <path d="M32 46h20V28a10 10 0 0 0-10-10H22"/>
          <path d="M18 46v8"/>
          <g class="flagg"><path d="M50 26v-12h8v7h-8"/></g>
        </svg>
        <div class="dag">${kiPoEsc(ukedag)}</div>
        <div class="dato">${d.getDate()}. ${KI_PO_MND[d.getMonth()]}</div>
        <div class="tekst"><div class="n">${kiPoEsc(c.tekst)}</div><div class="u">${kiPoEsc(under)}</div></div>
      </div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    this.shadowRoot.querySelector(".kort").addEventListener("click", () => this._trykk());
  }
}
if (!customElements.get("ki-post-card")) customElements.define("ki-post-card", KiPostCard);

class KiPostCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { entity: "Dato-sensor", relativ: "Relativ tekst (valgfri)", tekst: "Tekst", navn: "Navn", path: "Trykk går til" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "entity", selector: { entity: { domain: "sensor" } } },
      { name: "relativ", selector: { entity: { domain: "sensor" } } },
      { name: "tekst", selector: { text: {} } },
      { name: "path", selector: { text: {} } },
    ];
  }
}
if (!customElements.get("ki-post-card-editor")) customElements.define("ki-post-card-editor", KiPostCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-post-card")) window.customCards.push({ type: "ki-post-card", name: "KI Post", description: "Når posten kommer", preview: true });

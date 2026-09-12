/* ki-bursdag-pro-card – bursdager i samme stil som kalenderkortene.
 * Leser de samme sensorene som ki-bursdag-card, men med nytt design:
 * stor dato til venstre, navn og alder til høyre, og lilla kort på selve dagen.
 *
 * type: custom:ki-bursdag-pro-card
 * entities: [sensor.bursdag_rune, sensor.bursdag_cybele]   # eller
 * regex: birthday|bursdag                                  # finner dem selv
 * antall: 3
 * dager: 365            # hvor langt fram vi ser
 */
const KI_BDP_VERSJON = "1.0.0";

const KI_BDP_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:12px; }
  .kort { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:20px; cursor:pointer;
    display:grid; grid-template-areas:"dag ." "dato navn"; grid-template-columns:min-content 1fr; align-items:center; }
  .kort.liten { padding:16px 20px; grid-template-areas:"dato navn dager"; grid-template-columns:min-content 1fr min-content; }
  .kort.i_dag { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .dag { grid-area:dag; font-size:13px; opacity:.6; text-transform:capitalize; }
  .kort.i_dag .dag { opacity:.8; }
  .dato { grid-area:dato; font-size:2.6em; font-weight:300; line-height:1.05; padding-right:20px;
    white-space:nowrap; font-variant-numeric:tabular-nums; }
  .kort.liten .dato { font-size:1.6em; width:100px; }
  .navn { grid-area:navn; min-width:0; }
  .navn .n { font-size:16px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .navn .u { font-size:13px; opacity:.6; margin-top:2px; }
  .kort.i_dag .navn .u { opacity:.8; }
  .dager { grid-area:dager; font-size:13px; opacity:.55; white-space:nowrap; }
  .kake { position:absolute; right:18px; top:50%; transform:translateY(-50%); width:76px; height:76px; opacity:.2; }
  .kort.i_dag .kake { opacity:.4; }
  .flamme { transform-box:fill-box; transform-origin:50% 100%; }
  .kort.i_dag .flamme { animation:bd-flamme 1.8s ease-in-out infinite; }
  @keyframes bd-flamme { 0%,100% { transform:scaleY(1) rotate(-3deg); } 50% { transform:scaleY(1.18) rotate(3deg); } }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiBdEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_BD_MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

class KiBursdagProCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-bursdag-pro-card-editor"); }
  static getStubConfig() { return { antall: 3 }; }
  getCardSize() { return 4; }

  setConfig(c) { this._c = { antall: 3, dager: 365, regex: "birthday|bursdag", ...(c || {}) }; this._forrige = null; }
  set hass(h) { const g = this._h; this._h = h; if (!this._c) return; if (!g || this._endret(g, h)) this._tegn(); }
  _endret(g, h) { return this._ider().some((id) => g.states[id] !== h.states[id]); }

  _ider() {
    const c = this._c, h = this._h; if (!h) return [];
    if (c.entities && c.entities.length) return c.entities.map((e) => (typeof e === "string" ? e : e.entity));
    const re = new RegExp(c.regex, "i");
    return Object.keys(h.states).filter((id) => id.startsWith("sensor.") && re.test(id));
  }

  /* Tåler flere sensorformater: dato i state, eller i attributtene */
  _personer() {
    const h = this._h, nå = new Date(); nå.setHours(0, 0, 0, 0);
    const ut = [];
    this._ider().forEach((id) => {
      const st = h.states[id]; if (!st) return;
      const a = st.attributes || {};
      const navn = a.friendly_name_short || a.nickname || a.name
        || String(a.friendly_name || id).replace(/(bursdag|birthday)/i, "").trim();
      const rå = a.next_birthday || a.next_date || a.date_of_next_birthday || a.birthday || a.date || st.state;
      const d = new Date(rå);
      if (isNaN(d)) return;
      const neste = new Date(d); neste.setHours(0, 0, 0, 0);
      if (neste < nå && a.years_old === undefined) {
        neste.setFullYear(nå.getFullYear());
        if (neste < nå) neste.setFullYear(nå.getFullYear() + 1);
      }
      const dager = Math.round((neste - nå) / 86400000);
      if (dager < 0 || dager > Number(this._c.dager || 365)) return;
      const alder = a.years_old !== undefined ? Number(a.years_old) + (dager === 0 ? 0 : 1)
        : a.age !== undefined ? Number(a.age) : (a.birth_year ? neste.getFullYear() - Number(a.birth_year) : null);
      ut.push({ id, navn, dato: neste, dager, alder });
    });
    return ut.sort((a, b) => a.dager - b.dager).slice(0, Number(this._c.antall || 3));
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const folk = this._personer();
    const kort = (p, i) => {
      const ukedag = p.dato.toLocaleDateString("nb-NO", { weekday: "long" });
      const under = p.alder ? `fyller ${p.alder} år` : "bursdag";
      const naar = p.dager === 0 ? "I dag" : p.dager === 1 ? "I morgen" : `om ${p.dager} dager`;
      return `<div class="kort ${i ? "liten" : ""} ${p.dager === 0 ? "i_dag" : ""}" data-e="${kiBdEsc(p.id)}" role="button" tabindex="0">
        ${i ? "" : `<svg class="kake" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor"
            stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 52V38a6 6 0 0 1 6-6h28a6 6 0 0 1 6 6v14z" fill="currentColor" fill-opacity=".12"/>
            <path d="M10 52h44M32 32V22"/>
            <g class="flamme"><path d="M32 20c3-3 1-6 0-7-1 1-3 4 0 7z" fill="currentColor"/></g>
            <path d="M20 32v-8M44 32v-8" opacity=".5"/>
          </svg>`}
        ${i ? "" : `<div class="dag">${kiBdEsc(ukedag)}</div>`}
        <div class="dato">${p.dato.getDate()}. ${KI_BD_MND[p.dato.getMonth()]}</div>
        <div class="navn"><div class="n">${kiBdEsc(p.navn)}</div><div class="u">${kiBdEsc(under)}</div></div>
        ${i ? `<div class="dager">${kiBdEsc(naar)}</div>` : ""}
      </div>`;
    };
    const html = `<style>${KI_BDP_STIL}</style><div class="rot">${
      folk.length ? folk.map(kort).join("") : `<div class="tom">Ingen bursdager framover.</div>`}</div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.e }, bubbles: true, composed: true }))));
  }
}
if (!customElements.get("ki-bursdag-pro-card")) customElements.define("ki-bursdag-pro-card", KiBursdagProCard);

class KiBursdagProCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { antall: "Antall kort", dager: "Dager framover", regex: "Finn sensorer med (regex)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "antall", selector: { number: { mode: "box", min: 1, max: 10 } } },
      { name: "dager", selector: { number: { mode: "box", min: 1, max: 400 } } },
      { name: "regex", selector: { text: {} } },
    ];
  }
}
if (!customElements.get("ki-bursdag-pro-card-editor")) customElements.define("ki-bursdag-pro-card-editor", KiBursdagProCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-bursdag-pro-card")) window.customCards.push({ type: "ki-bursdag-pro-card", name: "KI Bursdag Pro", description: "Bursdager i kalenderkort-stil", preview: true });

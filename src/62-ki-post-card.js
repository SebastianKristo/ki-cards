/* ki-post-card – når posten kommer, i samme stil som resten av dashbordet.
 *
 * type: custom:ki-post-card
 * entity: sensor.nar_kommer_posten_posten_sensor_next
 * relativ: sensor.nar_kommer_posten_posten_sensor_next_relative
 * navn: Post
 * tekst: Post leveres
 * path: '#post'             # valgfritt: trykk navigerer hit
 */
const KI_POST_VERSJON = "2.0.0";

const KI_POST_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:16px 18px; cursor:pointer;
    display:grid; grid-template-columns:62px 1fr auto; gap:14px; align-items:center;
    transition:background .5s var(--myk); }
  .kort::before { content:""; position:absolute; inset:auto -30% -70% auto; width:70%; height:150%; z-index:-1;
    border-radius:50%; background:radial-gradient(circle, var(--tone,#6ec6ff) 0%, transparent 68%); opacity:.16; }
  .kort.i_dag { background:linear-gradient(120deg, #2a4a63 0%, #1f2f3e 60%); }
  .kort.i_dag::before { opacity:.4; }

  /* datoskive */
  .skive { width:62px; height:62px; border-radius:50%; position:relative; display:grid; place-items:center;
    background:var(--gray100); }
  .skive .ring { position:absolute; inset:0; border-radius:50%;
    background:conic-gradient(var(--tone,#6ec6ff) var(--p,0deg), transparent 0deg); opacity:.85; }
  .skive .ring::after { content:""; position:absolute; inset:4px; border-radius:50%; background:var(--gray200); }
  .kort.i_dag .skive .ring::after { background:#22384a; }
  .skive .tall { position:relative; text-align:center; line-height:1; }
  .skive .d { font-size:21px; font-weight:500; font-variant-numeric:tabular-nums; }
  .skive .m { font-size:10.5px; opacity:.6; text-transform:uppercase; letter-spacing:.06em; margin-top:2px; }

  .tekst { min-width:0; }
  .tekst .n { font-size:15.5px; font-weight:600; }
  .tekst .u { font-size:13px; opacity:.6; margin-top:3px; display:flex; align-items:center; gap:7px; }
  .kort.i_dag .tekst .u { opacity:.8; }
  .pille { font-size:11px; font-weight:700; padding:3px 9px; border-radius:8px; white-space:nowrap;
    background:rgba(255,255,255,.1); }
  .kort.i_dag .pille { background:var(--tone,#6ec6ff); color:#10222e; }

  .kasse { width:52px; height:52px; opacity:.55; }
  .kort.i_dag .kasse { opacity:1; }
  .flagg { transform-box:fill-box; transform-origin:bottom left; }
  .kort.i_dag .flagg { animation:po-flagg 2.8s ease-in-out infinite; }
  @keyframes po-flagg { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(-18deg); } }
  .brev { opacity:0; transform-box:fill-box; }
  .kort.i_dag .brev { animation:po-brev 3.6s ease-in-out infinite; }
  @keyframes po-brev { 0% { opacity:0; transform:translate(-10px,6px); } 25% { opacity:1; }
    60% { opacity:1; transform:translate(4px,-2px); } 100% { opacity:0; transform:translate(10px,-4px); } }

  .tom { background:var(--gray200); border-radius:20px; padding:20px; text-align:center; font-size:13px; opacity:.6; }
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

    /* ringen fylles etter hvor nær leveringen er – full sirkel på dagen */
    const grader = Math.max(0, Math.min(360, Math.round((1 - Math.min(diff, 7) / 7) * 360)));
    const html = `<style>${KI_POST_STIL}</style>
      <div class="kort ${diff === 0 ? "i_dag" : ""}" role="button" tabindex="0"
        style="--tone:${kiPoEsc(c.farge || "#6ec6ff")}">
        <div class="skive"><span class="ring" style="--p:${grader}deg"></span>
          <span class="tall"><span class="d">${d.getDate()}</span><span class="m">${KI_PO_MND[d.getMonth()]}</span></span></div>
        <div class="tekst">
          <div class="n">${kiPoEsc(c.tekst)}</div>
          <div class="u"><span>${kiPoEsc(ukedag)}</span><span class="pille">${kiPoEsc(under)}</span></div>
        </div>
        <svg class="kasse" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor"
          stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 30a10 10 0 0 1 20 0v16H12z" fill="currentColor" fill-opacity=".14"/>
          <path d="M32 46h20V30a10 10 0 0 0-10-10H22"/>
          <path d="M18 46v9"/>
          <g class="flagg"><path d="M50 28V16h8v7h-8"/></g>
          <g class="brev"><rect x="24" y="30" width="16" height="11" rx="2" fill="currentColor" fill-opacity=".9" stroke="none"/>
            <path d="M24 31l8 6 8-6" stroke="var(--gray200)" stroke-width="2"/></g>
        </svg>
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

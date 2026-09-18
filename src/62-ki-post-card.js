/* ki-post-card – når posten kommer, i samme stil som resten av dashbordet.
 *
 * type: custom:ki-post-card
 * entity: sensor.nar_kommer_posten_posten_sensor_next
 * relativ: sensor.nar_kommer_posten_posten_sensor_next_relative
 * navn: Post
 * tekst: Post leveres
 * path: '#post'             # valgfritt: trykk navigerer hit
 * dager: [2, 4]             # valgfritt: ukedagene posten kommer (1 = mandag)
 * farge: '#8cbef5'          # sirkelens farge når leveringen er nær
 */
const KI_POST_VERSJON = "3.0.0";

const KI_POST_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }

  /* Pilleform, som radene i dashbordet: rundt ikonfelt til venstre, to linjer tekst.
     Sirkelen er farget når leveringen er nær — nøytral ellers, slik en romflis er
     farget bare når rommet er aktivt. */
  .kort { display:flex; align-items:center; gap:14px; width:100%;
    border-radius:999px; background:var(--gray200); color:var(--gray1000);
    padding:8px 22px 8px 8px; cursor:pointer; border:0; font:inherit; text-align:left;
    transition:transform .12s var(--myk); }
  .kort:active { transform:scale(.995); }

  .ring { width:64px; height:64px; flex:none; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    background:rgba(250,251,252,.10); color:var(--gray1000);
    transition:background .5s var(--myk), color .4s; }
  .kort.nar .ring { background:var(--tone,#8cbef5); color:var(--black,#1b1b1b); }

  .ring svg { width:28px; height:28px; display:block; }
  /* Brevet hopper ned i kassa når posten kommer i dag */
  .kort.i_dag .brev { animation:kiPoSlipp 2.6s var(--myk) infinite; }
  @keyframes kiPoSlipp {
    0%, 60% { transform:translateY(0); opacity:1 }
    72% { transform:translateY(5px); opacity:.35 }
    84%, 100% { transform:translateY(0); opacity:1 }
  }

  .tekst { flex:1; min-width:0; display:grid; gap:2px; }
  .n { font-size:22px; font-weight:500; line-height:1.2;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .u { font-size:16px; opacity:.55; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }

  /* Ukestripa: én prikk per ukedag, tent på dagene posten pleier å komme */
  .uke { display:flex; gap:5px; flex:none; }
  .uke i { width:26px; height:26px; border-radius:50%; display:flex;
    align-items:center; justify-content:center; font-size:10px; font-weight:700;
    font-style:normal; background:rgba(250,251,252,.09); opacity:.6; }
  .uke i.pa { background:var(--tone,#8cbef5); color:var(--black,#1b1b1b); opacity:1; }
  @media (max-width:520px) { .uke { display:none; } }

  .tom { padding:16px 18px; border-radius:24px; background:var(--gray200);
    color:var(--gray1000); font-size:14px; opacity:.7; }
  @media (prefers-reduced-motion: reduce) { .kort, .brev { animation:none; transition:none; } }
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
    /* Tittelen er når, underteksten hva. «I morgen» er det man leser først; at det er
       posten, står under — som «Låst» over «Dørlås» i dashbordet. */
    const nar = diff === 0 ? "I dag" : diff === 1 ? "I morgen"
      : diff <= 6 ? `På ${ukedag}` : `${d.getDate()}. ${KI_PO_MND[d.getMonth()]}`;
    const under = diff <= 1 ? (c.tekst || "Post leveres")
      : `${c.tekst || "Post leveres"} · ${rel || `om ${diff} dager`}`;

    /* Ukestripa tennes bare når den vet noe: `dager: [2, 4]` er ukedagene posten
       kommer, der 1 er mandag. Uten den vises ingen stripe — en gjettet stripe er
       verre enn ingen. */
    const uke = Array.isArray(c.dager) && c.dager.length ? c.dager.map(Number) : null;
    const UKE = ["ma", "ti", "on", "to", "fr", "lø", "sø"];

    const html = `<style>${KI_POST_STIL}</style>
      <button class="kort ${diff === 0 ? "i_dag" : ""} ${diff <= 1 ? "nar" : ""}"
        style="--tone:${kiPoEsc(c.farge || "#8cbef5")}">
        <span class="ring">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 30a10 10 0 0 1 20 0v16H12z" fill="currentColor" fill-opacity=".16"/>
            <path d="M32 46h20V30a10 10 0 0 0-10-10H22"/>
            <path d="M18 46v9"/>
            <path d="M50 28V16h8v7h-8"/>
            <g class="brev">
              <rect x="24" y="29" width="16" height="11" rx="2" fill="currentColor"
                    fill-opacity=".95" stroke="none"/>
              <path d="M24 30l8 6 8-6" stroke="var(--gray200)" stroke-width="2"/>
            </g>
          </svg>
        </span>
        <span class="tekst">
          <span class="n">${kiPoEsc(nar)}</span>
          <span class="u">${kiPoEsc(under)}</span>
        </span>
        ${uke ? `<span class="uke">${UKE.map((u, i) =>
          `<i class="${uke.includes(i + 1) ? "pa" : ""}">${u}</i>`).join("")}</span>` : ""}
      </button>`;
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

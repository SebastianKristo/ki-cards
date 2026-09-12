/* ki-soppel-card – dager til neste tømming, med søppelbil på tømmedagen.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-soppel-card
 * entity: sensor.neste_tomming      # tilstand «2,Restavfall» (dager, type)
 * skille: ','                       # tegnet mellom dager og type
 * dager: sensor.x                   # eller egne entiteter i stedet for å dele tilstanden
 * type: sensor.y
 * path: '#soppel'
 */
const KI_SOPPEL_VERSJON = "1.0.0";

const KI_SOPPEL_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray100); color:var(--contast20, var(--gray1000)); cursor:pointer; padding:14px 18px;
    display:grid; grid-template-columns:40% 1fr; grid-template-rows:30% 1fr; grid-template-areas:"n l" "n type";
    min-height:150px; transition:background .6s var(--myk), color .4s; }
  .kort.idag { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .tall { grid-area:n; justify-self:center; align-self:center; font-size:70px; font-weight:800; line-height:1;
    font-variant-numeric:tabular-nums; }
  .kort.idag .tall { animation:so-tall 2.6s ease-in-out infinite; }
  @keyframes so-tall { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
  .lab { grid-area:l; justify-self:start; align-self:end; font-size:22px; font-weight:500; line-height:1.15; }
  .type { grid-area:type; justify-self:start; align-self:start; padding-top:12px; font-size:14px; font-weight:500; opacity:.85;
    display:inline-flex; align-items:center; gap:7px; }
  .type .dot { width:9px; height:9px; border-radius:50%; background:var(--sotone, currentColor); }

  /* scene: bøtte og bil */
  .scene { position:absolute; inset:auto 0 0 0; height:74px; z-index:-1; pointer-events:none; opacity:.5; }
  .kort.idag .scene { opacity:1; }
  .scene svg { position:absolute; inset:0; width:100%; height:100%; }
  .botte { transform-box:fill-box; transform-origin:50% 100%; }
  .kort.idag .botte { animation:so-rist 1.1s ease-in-out infinite; }
  @keyframes so-rist { 0%,100% { transform:rotate(0); } 25% { transform:rotate(-7deg); } 75% { transform:rotate(7deg); } }
  .bil { opacity:0; transform-box:fill-box; }
  .kort.idag .bil { animation:so-kjor 7s linear infinite; }
  @keyframes so-kjor { 0% { opacity:0; transform:translateX(-46%); } 8% { opacity:1; } 88% { opacity:1; } 100% { opacity:0; transform:translateX(150%); } }
  .hjul { transform-box:fill-box; transform-origin:center; }
  .kort.idag .hjul { animation:so-snurr .55s linear infinite; }
  @keyframes so-snurr { to { transform:rotate(360deg); } }
  .damp { opacity:0; }
  .kort.idag .damp { animation:so-damp 2.4s ease-out infinite; }
  .kort.idag .d2 { animation-delay:.8s; } .kort.idag .d3 { animation-delay:1.6s; }
  @keyframes so-damp { 0% { opacity:.5; transform:translate(0,0) scale(.6); } 100% { opacity:0; transform:translate(-18px,-26px) scale(1.4); } }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiSoEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* Fargeprikk etter avfallstype */
const KI_SOPPEL_FARGE = [[/rest/i, "#8f8f99"], [/mat|bio/i, "#7ee081"], [/papp|papir/i, "#6ec6ff"], [/plast/i, "#f5c542"],
  [/glass|metall/i, "#c9a227"], [/hage|park/i, "#59b36b"], [/farlig|spesial/i, "#e8657a"]];

class KiSoppelCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { entity: "sensor.neste_tomming" }; }
  getCardSize() { return 3; }
  setConfig(c) {
    if (!c || (!c.entity && !c.dager)) throw new Error("Sett entity: eller dager:");
    this._c = { skille: ",", path: "#soppel", ...c }; this._bygget = false; this._tegn();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const ids = [c.entity, c.dager, c.type].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  _st(id) { return id && this._h ? this._h.states[id] : null; }
  _data() {
    const c = this._c;
    if (c.dager) return { dager: this._st(c.dager) ? this._st(c.dager).state : null, type: this._st(c.type) ? this._st(c.type).state : "" };
    const s = this._st(c.entity); if (!s) return null;
    const d = String(s.state).split(c.skille);
    return { dager: d[0] !== undefined ? d[0].trim() : null, type: (d[1] || "").trim() };
  }
  _nav() {
    const sti = this._c.path; if (!sti) return;
    const gammel = location.hash;
    let url = null;
    try { url = new URL(sti, location.origin + location.pathname + location.search); } catch (e) { /* tom */ }
    if (url) { const ny = url.pathname + url.search + url.hash;
      if (ny !== location.pathname + location.search + location.hash) history.pushState(null, "", ny); }
    window.dispatchEvent(new Event("location-changed"));
    try { window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: gammel, newURL: location.href })); }
    catch (e) { window.dispatchEvent(new Event("hashchange")); }
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KI_SOPPEL_STIL}</style>
      <div class="kort" role="button" tabindex="0">
        <div class="scene"><svg viewBox="0 0 320 74" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
          <g class="botte" transform="translate(232 18)" fill="currentColor">
            <rect x="0" y="8" width="34" height="40" rx="5" opacity=".55"/>
            <rect x="-3" y="2" width="40" height="8" rx="4" opacity=".7"/>
            <rect x="11" y="-3" width="12" height="5" rx="2.5" opacity=".7"/>
            <path d="M9 16v26M17 16v26M25 16v26" stroke="var(--gray100)" stroke-opacity=".35" stroke-width="2"/>
          </g>
          <g class="bil" transform="translate(0 10)" fill="currentColor">
            <rect x="26" y="10" width="62" height="34" rx="5" opacity=".75"/>
            <path d="M88 22h22l14 12v10H88z" opacity=".75"/>
            <rect x="96" y="25" width="14" height="10" rx="2" fill="var(--gray100)" opacity=".55"/>
            <rect x="20" y="18" width="8" height="24" rx="3" opacity=".55"/>
            <g class="hjul" transform="translate(46 50)"><circle r="8"/><circle r="3" fill="var(--gray100)" opacity=".6"/></g>
            <g class="hjul" transform="translate(108 50)"><circle r="8"/><circle r="3" fill="var(--gray100)" opacity=".6"/></g>
            <circle class="damp" cx="18" cy="14" r="5" opacity=".4"/>
            <circle class="damp d2" cx="18" cy="14" r="4" opacity=".4"/>
            <circle class="damp d3" cx="18" cy="14" r="6" opacity=".4"/>
          </g>
        </svg></div>
        <div class="tall">–</div>
        <div class="lab"></div>
        <div class="type"><i class="dot"></i><span></span></div>
      </div>`;
    const k = this.shadowRoot.querySelector(".kort");
    k.addEventListener("click", () => this._nav());
    k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._nav(); } });
    this._bygget = true;
  }
  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const d = this._data();
    if (!d) { this._bygget = false; this.shadowRoot.innerHTML = `<style>${KI_SOPPEL_STIL}</style><div class="feil">Fant ikke ${kiSoEsc(c.entity)}.</div>`; return; }
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, n = parseInt(d.dager, 10);
    const ukjent = isNaN(n);
    const idag = n === 0;
    r.querySelector(".kort").classList.toggle("idag", idag);
    r.querySelector(".tall").textContent = ukjent ? "?" : String(n);
    r.querySelector(".lab").innerHTML = ukjent ? "Ukjent tid til<br>søppeltømming"
      : idag ? (c.tekst_idag || "Søppel tømmes<br>i dag")
      : n === 1 ? "Dag til neste<br>søppeltømming" : "Dager til neste<br>søppeltømming";
    const t = d.type || "";
    r.querySelector(".type span").textContent = t;
    const treff = KI_SOPPEL_FARGE.find(([re]) => re.test(t));
    r.querySelector(".kort").style.setProperty("--sotone", treff ? treff[1] : "currentColor");
  }
}
if (!customElements.get("ki-soppel-card")) customElements.define("ki-soppel-card", KiSoppelCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-soppel-card")) window.customCards.push({ type: "ki-soppel-card", name: "KI Søppel", description: "Dager til neste tømming, med søppelbil på tømmedagen", preview: true });

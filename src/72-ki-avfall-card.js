/* ki-avfall-card – alle avfallsfraksjonene i ett kort.
 *
 * Laget for sensorer med attributtene `days_to_pickup` og `raw_date`, slik de norske
 * renovasjonsintegrasjonene lager dem. Neste tømming får heroen; resten står under,
 * sortert etter hvor nær de er.
 *
 * type: custom:ki-avfall-card
 * entities:                        # eller monster, se under
 *   - sensor.restavfall
 *   - sensor.papir_og_papp
 *   - sensor.plastemballasje
 *   - sensor.glass_og_metallemballasje
 * monster: "sensor\\.(restavfall|papir|plast|glass)"   # alternativ til entities
 * dager_attributt: days_to_pickup
 * dato_attributt: raw_date
 * path: '#soppel'                  # hva trykk på heroen åpner
 */
const KI_AV_VERSJON = "1.0.0";

/* Fraksjonene kjennes igjen på navnet. Fargene følger de norske
   sorteringsfargene: papir blått, plast lilla, glass og metall grønt, rest grått. */
const KI_AV_SLAG = [
  { treff: /glass|metall/i, navn: "Glass og metall", ikon: "mdi:bottle-soda-classic-outline", farge: "var(--green, #5ad18b)" },
  { treff: /plast/i, navn: "Plast", ikon: "mdi:recycle", farge: "var(--purple, #a98fe0)" },
  { treff: /papir|papp|kartong/i, navn: "Papir og papp", ikon: "mdi:newspaper-variant-outline", farge: "var(--blue, #4aa3e0)" },
  { treff: /mat|bio|kompost/i, navn: "Matavfall", ikon: "mdi:food-apple-outline", farge: "var(--orange, #f0a952)" },
  { treff: /hage|park/i, navn: "Hageavfall", ikon: "mdi:leaf", farge: "var(--teal, #3fbfb0)" },
  { treff: /rest/i, navn: "Restavfall", ikon: "mdi:trash-can-outline", farge: "var(--gray600, #8a8a8d)" },
];

const KI_AV_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:8px; color:var(--gray1000); }

  /* ---- heroen: neste tømming ---- */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:24px;
    background:var(--gray200); min-height:168px; padding:18px;
    display:grid; grid-template-columns:1fr auto; align-items:start; gap:12px;
    cursor:pointer; transition:background .5s var(--myk), color .3s; }
  .hero.snart { background:color-mix(in srgb, var(--f) 30%, var(--gray200)); }
  .hero.idag { background:var(--f); color:var(--black,#1b1b1b); }

  .merke { display:inline-flex; align-items:center; gap:8px; font-size:13px; font-weight:600;
    opacity:.75; --mdc-icon-size:18px; }
  .stor { font-size:52px; font-weight:600; line-height:1; letter-spacing:-.04em;
    font-variant-numeric:tabular-nums; margin-top:8px; }
  .stor small { font-size:17px; font-weight:500; opacity:.6; margin-left:7px; letter-spacing:0; }
  .hero.idag .stor { animation:kiAvPuls 2.6s ease-in-out infinite; transform-origin:left center; }
  @keyframes kiAvPuls { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
  .dato { font-size:13.5px; opacity:.62; margin-top:8px; }
  .navn { text-align:right; font-size:15px; font-weight:700; letter-spacing:-.01em; }

  /* bøtte og bil nederst i heroen */
  .scene { position:absolute; inset:auto 0 0 0; height:70px; z-index:-1;
    pointer-events:none; opacity:.35; }
  .hero.idag .scene { opacity:1; }
  .scene svg { position:absolute; inset:0; width:100%; height:100%; }
  .botte { transform-box:fill-box; transform-origin:50% 100%; }
  .hero.idag .botte { animation:kiAvRist 1.1s ease-in-out infinite; }
  @keyframes kiAvRist { 0%,100% { transform:rotate(0) } 25% { transform:rotate(-7deg) } 75% { transform:rotate(7deg) } }
  .bil { opacity:0; transform-box:fill-box; }
  .hero.idag .bil { animation:kiAvKjor 7s linear infinite; }
  @keyframes kiAvKjor {
    0% { opacity:0; transform:translateX(-46%) } 8% { opacity:1 }
    88% { opacity:1 } 100% { opacity:0; transform:translateX(150%) }
  }
  .hjul { transform-box:fill-box; transform-origin:center; }
  .hero.idag .hjul { animation:kiAvRull .5s linear infinite; }
  @keyframes kiAvRull { to { transform:rotate(360deg) } }

  /* ---- de øvrige fraksjonene ---- */
  .rutenett { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .flis { background:var(--gray200); border-radius:24px; padding:0; overflow:hidden;
    display:grid; grid-template-areas:"i n" "i v"; grid-template-columns:64px minmax(0,1fr);
    grid-template-rows:1fr 1fr; align-items:center; min-height:84px; width:100%;
    text-align:left; min-width:0; cursor:pointer; }
  .flis > * { min-width:0; }
  .flis .ik { grid-area:i; justify-self:center; width:50px; height:50px; border-radius:50%;
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:25px;
    background:color-mix(in srgb, var(--f) 26%, transparent); color:var(--f); }
  .flis .n { grid-area:n; align-self:end; font-size:12.5px; opacity:.62; line-height:1.25;
    padding-right:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis .v { grid-area:v; align-self:start; font-size:23px; font-weight:500; line-height:1.2;
    letter-spacing:-.02em; font-variant-numeric:tabular-nums; padding-right:14px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis .v span { font-size:13px; font-weight:400; opacity:.55; margin-left:5px; }

  .tom { font-size:14px; opacity:.7; padding:16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }

  @media (max-width:400px) {
    .stor { font-size:42px; }
    .flis { grid-template-columns:56px minmax(0,1fr); }
    .flis .ik { width:44px; height:44px; --mdc-icon-size:22px; }
    .flis .v { font-size:21px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .botte, .bil, .hjul, .stor { animation:none !important; }
  }
`;

const kiAvEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* «0 dager» er i dag, «1» i morgen. Alt annet leses som et tall. */
const kiAvTekst = (d) => {
  if (d === null || d === undefined || isNaN(d)) return { tall: "–", enhet: "" };
  const n = Math.round(Number(d));
  if (n <= 0) return { tall: "I dag", enhet: "" };
  if (n === 1) return { tall: "I morgen", enhet: "" };
  return { tall: String(n), enhet: n === 1 ? "dag" : "dager" };
};

const kiAvDato = (raa) => {
  if (!raa) return "";
  const d = new Date(raa);
  if (isNaN(d)) return "";
  const uke = d.toLocaleDateString("nb-NO", { weekday: "long" });
  return `${uke.charAt(0).toUpperCase()}${uke.slice(1)} ${d.getDate()}. ` +
    d.toLocaleDateString("nb-NO", { month: "long" });
};

class KiAvfallCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { monster: "sensor\\.(restavfall|papir|plast|glass)" }; }
  getCardSize() { return 6; }

  setConfig(c) {
    this._c = { dager_attributt: "days_to_pickup", dato_attributt: "raw_date", ...(c || {}) };
    if (this._c.monster) {
      try { this._re = new RegExp(this._c.monster, "i"); }
      catch (e) { this._re = null; console.warn("ki-avfall-card: ugyldig monster", e); }
    }
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const n = JSON.stringify(this._fraksjoner().map((f) => [f.id, f.dager, f.dato]));
    if (n !== this._sist) { this._sist = n; this._tegn(); }
    else if (!g) this._tegn();
  }

  /* Enten en eksplisitt liste, eller alt som treffer mønsteret. */
  _ider() {
    if (Array.isArray(this._c.entities) && this._c.entities.length) return this._c.entities;
    if (!this._re || !this._h) return [];
    return Object.keys(this._h.states).filter((id) => id.startsWith("sensor.") && this._re.test(id));
  }

  _slag(navn, id) {
    const tekst = `${navn || ""} ${id || ""}`;
    return KI_AV_SLAG.find((s) => s.treff.test(tekst))
      || { navn: navn || id, ikon: "mdi:trash-can-outline", farge: "var(--gray600, #8a8a8d)" };
  }

  _fraksjoner() {
    if (!this._h) return [];
    const c = this._c;
    const ut = [];
    for (const id of this._ider()) {
      const st = this._h.states[id];
      if (!st) continue;
      const a = st.attributes || {};
      // Dagene står vanligvis som attributt, men noen integrasjoner har dem i tilstanden
      let dager = a[c.dager_attributt];
      if (dager === undefined || dager === null || dager === "") dager = parseFloat(st.state);
      dager = isNaN(parseFloat(dager)) ? null : Math.round(parseFloat(dager));
      const slag = this._slag(a.friendly_name, id);
      ut.push({ id, dager, dato: a[c.dato_attributt] || null,
        navn: a.friendly_name || slag.navn, ikon: a.icon || slag.ikon, farge: slag.farge });
    }
    return ut.sort((x, y) => (x.dager ?? 9999) - (y.dager ?? 9999));
  }

  _scene(farge) {
    return `<div class="scene"><svg viewBox="0 0 320 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <line x1="0" y1="62" x2="320" y2="62" stroke="currentColor" stroke-opacity=".2" stroke-width="2"/>
      <g class="botte">
        <rect x="24" y="30" width="26" height="32" rx="4" fill="${farge}"/>
        <rect x="21" y="25" width="32" height="7" rx="3" fill="${farge}"/>
        <path d="M31 38 V54 M37 38 V54 M43 38 V54" stroke="rgba(0,0,0,.18)" stroke-width="2"/>
      </g>
      <g class="bil">
        <rect x="90" y="26" width="84" height="26" rx="5" fill="currentColor" fill-opacity=".55"/>
        <path d="M174 34 h22 l10 12 v6 h-32 z" fill="currentColor" fill-opacity=".7"/>
        <rect x="178" y="36" width="14" height="9" rx="2" fill="rgba(255,255,255,.55)"/>
        <circle class="hjul" cx="110" cy="58" r="6" fill="#1b1b1e"/>
        <circle class="hjul" cx="160" cy="58" r="6" fill="#1b1b1e"/>
        <circle class="hjul" cx="192" cy="58" r="6" fill="#1b1b1e"/>
      </g>
    </svg></div>`;
  }

  _tegn() {
    const c = this._c;
    const alle = this._fraksjoner();

    if (!alle.length) {
      this.shadowRoot.innerHTML = `<style>${KI_AV_STIL}</style>
        <div class="kort"><div class="tom">
          Finner ingen avfallssensorer. Sett <code>entities:</code> til sensorene dine,
          eller <code>monster:</code> til et uttrykk som treffer dem.
        </div></div>`;
      return;
    }

    const neste = alle[0];
    const resten = alle.slice(1);
    const t = kiAvTekst(neste.dager);
    const idag = neste.dager !== null && neste.dager <= 0;
    const snart = neste.dager !== null && neste.dager > 0 && neste.dager <= 2;

    this.shadowRoot.innerHTML = `<style>${KI_AV_STIL}</style>
      <div class="kort">
        <div class="hero ${idag ? "idag" : snart ? "snart" : ""}" style="--f:${neste.farge}"
             data-mer="${kiAvEsc(neste.id)}" tabindex="0">
          ${this._scene(idag ? "rgba(0,0,0,.45)" : neste.farge)}
          <div>
            <div class="merke"><ha-icon icon="${kiAvEsc(neste.ikon)}"></ha-icon>Neste tømming</div>
            <div class="stor">${kiAvEsc(t.tall)}${t.enhet ? `<small>${t.enhet}</small>` : ""}</div>
            <div class="dato">${kiAvEsc(kiAvDato(neste.dato))}</div>
          </div>
          <div class="navn">${kiAvEsc(neste.navn)}</div>
        </div>

        ${resten.length ? `<div class="rutenett">${resten.map((f) => {
          const r = kiAvTekst(f.dager);
          return `<div class="flis" style="--f:${f.farge}" data-mer="${kiAvEsc(f.id)}" tabindex="0">
            <span class="ik"><ha-icon icon="${kiAvEsc(f.ikon)}"></ha-icon></span>
            <div class="n">${kiAvEsc(f.navn)}</div>
            <div class="v">${kiAvEsc(r.tall)}${r.enhet ? `<span>${r.enhet}</span>` : ""}</div>
          </div>`;
        }).join("")}</div>` : ""}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]")) {
      const aapne = () => {
        if (c.path) {
          window.history.pushState(null, "", c.path);
          window.dispatchEvent(new Event("location-changed"));
          return;
        }
        this.dispatchEvent(new CustomEvent("hass-more-info",
          { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
      };
      el.addEventListener("click", aapne);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aapne(); }
      });
    }
  }
}

customElements.define("ki-avfall-card", KiAvfallCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-avfall-card"))
  window.customCards.push({ type: "ki-avfall-card", name: "KI Avfall",
    description: "Alle avfallsfraksjonene med neste tømming øverst", preview: true });

/* ki-vann-card – hva vannet går til, med animert vann og fordeling.
 *
 * Leser sensorene fra KI Vann. Entitetene heter «sensor.<anlegg>_...» — prefikset
 * settes i konfigurasjonen, og kortet sier fra hvis det ikke finner noe.
 *
 * type: custom:ki-vann-card
 * prefiks: sensor.hjemme_          # slik entitetene dine faktisk heter
 * navn: Vann
 * mal: 250                         # liter per dag du sikter mot (styrer bølgehøyden)
 * bakgrunn: none                   # standard: ingen egen bakgrunn
 */
const KI_VN_VERSJON = "1.0.0";

/* Kategoriene i den rekkefølgen de vises, med entitetssuffiks, ikon og farge.
   Fargene er tatt fra temaet, så kortet følger resten av dashbordet. */
const KI_VN_KAT = [
  { id: "dusj", navn: "Dusj", ikon: "mdi:shower-head", farge: "var(--blue, #4aa3e0)" },
  { id: "toalett", navn: "Toalett", ikon: "mdi:toilet", farge: "var(--purple, #a98fe0)" },
  { id: "handvask", navn: "Håndvask", ikon: "mdi:hand-wash-outline", farge: "var(--active-big, #ee95ff)" },
  { id: "oppvask_og_matlaging", navn: "Oppvask", ikon: "mdi:silverware-clean", farge: "var(--green, #5ad18b)" },
  { id: "vaskemaskin", navn: "Vaskemaskin", ikon: "mdi:washing-machine", farge: "var(--yellow, #f5c542)" },
  { id: "oppvaskmaskin", navn: "Oppvaskmaskin", ikon: "mdi:dishwasher", farge: "var(--orange, #f0a952)" },
  { id: "utendors", navn: "Utendørs", ikon: "mdi:sprinkler-variant", farge: "var(--teal, #3fbfb0)" },
  { id: "basis_og_udefinert", navn: "Udefinert", ikon: "mdi:water-outline", farge: "var(--gray600, #7a7a7d)" },
];

const KI_VN_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:10px; color:var(--gray1000); }
  button { font:inherit; font-family:inherit; border:0; background:none; color:inherit; cursor:pointer; }

  /* ---- heroen: en tank som fyller seg, med bølge på toppen ---- */
  .hero { position:relative; border-radius:24px; overflow:hidden; background:var(--gray200);
    min-height:172px; display:grid; grid-template-columns:1fr auto; align-items:start;
    padding:18px; gap:12px; isolation:isolate; }
  .vann { position:absolute; left:0; right:0; bottom:0; z-index:-1;
    height:var(--fyll, 40%); transition:height 1.2s var(--myk);
    background:linear-gradient(180deg,
      color-mix(in srgb, var(--blue,#4aa3e0) 55%, transparent),
      color-mix(in srgb, var(--blue,#4aa3e0) 28%, transparent)); }
  .bolge { position:absolute; left:0; bottom:calc(var(--fyll, 40%) - 1px); z-index:-1;
    width:200%; height:26px; }
  .bolge svg { width:50%; height:100%; display:block; float:left; }
  .bolge { animation:kiVnRull 9s linear infinite; }
  @keyframes kiVnRull { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  .bolge.b2 { animation-duration:14s; animation-direction:reverse; opacity:.5;
    bottom:calc(var(--fyll, 40%) + 4px); }

  /* dråper som faller når det brukes vann nå */
  .draper { position:absolute; inset:0; z-index:-1; pointer-events:none; overflow:hidden; }
  .drape { position:absolute; top:-12px; width:6px; height:9px; border-radius:50% 50% 60% 60%;
    background:color-mix(in srgb, var(--blue,#4aa3e0) 70%, transparent);
    animation:kiVnFall var(--t,3.2s) linear infinite; animation-delay:var(--d,0s); }
  @keyframes kiVnFall {
    0% { transform:translateY(0) scale(.7); opacity:0 }
    12% { opacity:.9 }
    85% { opacity:.6 }
    100% { transform:translateY(150px) scale(1.1); opacity:0 }
  }

  .tit { font-size:13px; opacity:.6; font-weight:500; }
  .stor { font-size:46px; font-weight:600; line-height:1; letter-spacing:-.035em;
    font-variant-numeric:tabular-nums; margin-top:6px; }
  .stor small { font-size:17px; font-weight:500; opacity:.6; margin-left:6px; letter-spacing:0; }
  .under { font-size:13px; opacity:.62; margin-top:8px; line-height:1.45; }
  .kr { text-align:right; }
  .kr .v { font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
  .kr .n { font-size:11.5px; opacity:.55; }

  /* ---- fordelingen ---- */
  .stolpe { display:flex; height:16px; border-radius:99px; overflow:hidden;
    background:color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .stolpe i { height:100%; width:var(--b,0%); transition:width .9s var(--myk);
    background:var(--f); }
  .stolpe i:first-child { border-radius:99px 0 0 99px; }
  .stolpe i:last-child { border-radius:0 99px 99px 0; }

  .liste { display:grid; gap:6px; }
  .rad { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:18px;
    background:var(--gray200); width:100%; text-align:left; }
  .rad .ik { width:38px; height:38px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:20px;
    background:color-mix(in srgb, var(--f) 26%, transparent); color:var(--f); }
  .rad .navn { flex:1; min-width:0; font-size:14.5px; font-weight:600;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .rad .tall { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .rad .pst { font-size:12px; opacity:.5; min-width:38px; text-align:right;
    font-variant-numeric:tabular-nums; }

  /* ---- modellstatus ---- */
  .fot { display:flex; align-items:center; gap:8px; flex-wrap:wrap;
    font-size:12px; opacity:.55; padding:0 4px; }
  .merke { display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 11px;
    border-radius:999px; background:var(--gray200); opacity:1; font-weight:600;
    --mdc-icon-size:15px; }
  .merke.varsel { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .tom { font-size:14px; opacity:.7; padding:16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }

  @media (max-width:400px) {
    .hero { grid-template-columns:1fr; min-height:150px; }
    .stor { font-size:38px; }
    .kr { text-align:left; }
  }
  @media (prefers-reduced-motion: reduce) {
    .bolge, .drape, .vann, .stolpe i { animation:none !important; transition:none !important; }
  }
`;

const kiVnEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiVnNf = (v, d = 0) => (v === null || v === undefined || isNaN(v))
  ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });

class KiVannCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { prefiks: "sensor.hjemme_" }; }
  getCardSize() { return 8; }

  setConfig(c) {
    this._c = { prefiks: "sensor.hjemme_", navn: "Vann", mal: 250, ...(c || {}) };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    if (!g || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _id(s) { return this._c.prefiks + s; }
  _st(s) { return this._h && this._h.states[this._id(s)]; }
  _tall(s) {
    const st = this._st(s);
    if (!st || ["unknown", "unavailable", ""].includes(st.state)) return null;
    const n = parseFloat(st.state);
    return isNaN(n) ? null : n;
  }

  _ider() {
    return ["vann_i_dag", "vannkostnad_i_dag", "modell", "forklart_av_sensorene",
      "storste_forbruker_i_dag"]
      .concat(KI_VN_KAT.map((k) => `${k.id}_i_dag`))
      .map((s) => this._id(s));
  }

  _tegn() {
    const c = this._c;
    const bg = c.bakgrunn === undefined || c.bakgrunn === false || c.bakgrunn === "none"
      ? "transparent" : c.bakgrunn;

    if (!this._st("vann_i_dag")) {
      this.shadowRoot.innerHTML = `<style>${KI_VN_STIL}</style>
        <div class="kort"><div class="tom">
          Finner ingen sensorer fra <b>KI Vann</b> med prefikset
          <code>${kiVnEsc(c.prefiks)}</code>. Sett <code>prefiks:</code> til det
          entitetene dine faktisk heter — se etter «Vann i dag» i Utviklerverktøy.
        </div></div>`;
      return;
    }

    const totalt = this._tall("vann_i_dag") || 0;
    const kr = this._tall("vannkostnad_i_dag");
    const forklart = this._tall("forklart_av_sensorene");
    const modellSt = this._st("modell");
    const modell = modellSt ? modellSt.state : null;
    const timer = modellSt && modellSt.attributes ? modellSt.attributes.timer_i_vindu : null;
    const storsteSt = this._st("storste_forbruker_i_dag");

    const deler = KI_VN_KAT
      .map((k) => ({ ...k, liter: this._tall(`${k.id}_i_dag`) || 0 }))
      .filter((k) => k.liter > 0.05)
      .sort((a, b) => b.liter - a.liter);
    const sum = deler.reduce((s, k) => s + k.liter, 0) || 1;

    // Bølgehøyden viser dagens forbruk mot målet, ikke absolutt — en tank som fyller seg
    const fyll = Math.max(6, Math.min(94, Math.round(totalt / (Number(c.mal) || 250) * 100)));

    const draper = Array.from({ length: 5 }, (_, i) =>
      `<i class="drape" style="left:${12 + i * 19}%;--t:${2.6 + i * 0.45}s;--d:-${i * 0.9}s"></i>`).join("");

    const bolge = (klasse) => `<div class="bolge ${klasse}">
      ${[0, 1].map(() => `<svg viewBox="0 0 400 26" preserveAspectRatio="none">
        <path d="M0 14 q50 -13 100 0 t100 0 t100 0 t100 0 V26 H0 Z"
              fill="color-mix(in srgb, var(--blue,#4aa3e0) 45%, transparent)"/></svg>`).join("")}
    </div>`;

    this.shadowRoot.innerHTML = `<style>${KI_VN_STIL}</style>
      <div class="kort" style="${bg === "transparent" ? "" : `background:${bg};border-radius:24px;padding:16px`}">
        <div class="hero" style="--fyll:${fyll}%">
          <div class="vann"></div>
          ${bolge("b2")}${bolge("b1")}
          <div class="draper">${draper}</div>
          <div>
            <div class="tit">${kiVnEsc(c.navn)} i dag</div>
            <div class="stor">${kiVnNf(totalt, 0)}<small>liter</small></div>
            <div class="under">${storsteSt && storsteSt.state && storsteSt.state !== "unknown"
              ? `Mest av alt til ${kiVnEsc(String(storsteSt.state).toLowerCase())}`
              : "Ingen fordeling ennå i dag"}</div>
          </div>
          ${kr !== null ? `<div class="kr"><div class="v">${kiVnNf(kr, 1)} kr</div>
            <div class="n">vann og avløp</div></div>` : ""}
        </div>

        ${deler.length ? `
        <div class="stolpe">${deler.map((k) =>
          `<i style="--b:${(k.liter / sum * 100).toFixed(1)}%;--f:${k.farge}"></i>`).join("")}</div>

        <div class="liste">${deler.map((k) => `
          <div class="rad" style="--f:${k.farge}" data-mer="${this._id(`${k.id}_i_dag`)}">
            <span class="ik"><ha-icon icon="${k.ikon}"></ha-icon></span>
            <span class="navn">${kiVnEsc(k.navn)}</span>
            <span class="tall">${kiVnNf(k.liter, 0)} L</span>
            <span class="pst">${(k.liter / sum * 100).toFixed(0)} %</span>
          </div>`).join("")}</div>` : ""}

        <div class="fot">
          ${modell ? `<span class="merke"><ha-icon icon="mdi:brain"></ha-icon>${
            kiVnEsc(modell)}${timer ? ` · ${timer} t` : ""}</span>` : ""}
          ${forklart !== null ? `<span class="merke ${forklart < 60 ? "varsel" : ""}">
            <ha-icon icon="mdi:help-circle-outline"></ha-icon>${kiVnNf(forklart, 0)} % forklart</span>` : ""}
          <span>Fordelingen er estimert fra bevegelse og hvitevarer, og summerer alltid til det måleren viste.</span>
        </div>
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]"))
      el.addEventListener("click", () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true })));
  }
}

customElements.define("ki-vann-card", KiVannCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-vann-card"))
  window.customCards.push({ type: "ki-vann-card", name: "KI Vann",
    description: "Hva vannet går til, med animert fordeling og kostnad", preview: true });

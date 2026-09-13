/* ki-sparing-card – hva elbilen sparer mot den gamle bilen.
 *
 * Leser sensorene fra KI Drivstoff. Entitetene heter «sensor.ki_drivstoff_...» med
 * mindre du har døpt om enheten, og prefikset kan settes.
 *
 * type: custom:ki-sparing-card
 * prefiks: sensor.ki_drivstoff_
 * periode: maaned            # i_dag | uke | maaned | aar | totalt – hvilken som er valgt
 * perioder: [i_dag, maaned, aar, totalt]
 * tittel: Elbil mot diesel
 * bakgrunn: none             # standard: ingen egen bakgrunn (popupen har sin)
 */
const KI_SPAR_VERSJON = "1.1.0";

const KI_SPAR_PERIODER = {
  i_dag: { nokkel: "i_dag", navn: "I dag" },
  uke: { nokkel: "uke", navn: "Uke" },
  maaned: { nokkel: "denne_maneden", navn: "Måned" },
  aar: { nokkel: "i_ar", navn: "År" },
  totalt: { nokkel: "totalt", navn: "Totalt" },
};

const KI_SPAR_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { border-radius:var(--ha-card-border-radius,24px); background:var(--kort-bg,transparent);
    color:var(--gray1000); padding:var(--kort-pad,0); display:grid; gap:18px; }
  button { font:inherit; font-family:inherit; border:0; background:none; color:inherit; cursor:pointer; }

  /* ---- toppen: beløpet og perioden ---- */
  .hero { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .merke { font-size:13px; opacity:.6; font-weight:500; }
  .stor { font-size:44px; font-weight:600; line-height:1; letter-spacing:-.035em;
    font-variant-numeric:tabular-nums; margin-top:6px; }
  .stor small { font-size:16px; font-weight:500; opacity:.55; margin-left:7px; letter-spacing:0; }
  .undertekst { font-size:13px; opacity:.55; margin-top:8px; line-height:1.4; }

  .valg { display:flex; gap:3px; padding:3px; border-radius:999px; flex:none;
    border:1px solid color-mix(in srgb, var(--gray1000) 20%, transparent); }
  .valg button { padding:6px 13px; border-radius:999px; font-size:13px; font-weight:500;
    color:color-mix(in srgb, var(--gray1000) 70%, transparent); transition:background .2s, color .2s; }
  .valg button.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); font-weight:600; }

  /* ---- én delt stolpe: det du betalte mot det du slapp å betale ---- */
  .delt { display:grid; gap:10px; }
  .spor { display:flex; height:34px; border-radius:12px; overflow:hidden;
    background:color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .spor i { display:block; height:100%; transition:width .7s var(--myk);
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:rgba(20,22,20,.75); white-space:nowrap; }
  .spor .el { background:var(--green,#5ad18b); width:var(--el,10%); }
  .spor .sp { background:color-mix(in srgb, var(--orange,#f0a952) 34%, transparent);
    width:var(--sp,90%); color:var(--gray1000); opacity:.85; }
  .nokler { display:flex; gap:16px; font-size:12.5px; opacity:.7; flex-wrap:wrap; }
  .nokler b { font-weight:600; opacity:1; }
  .prikk { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px;
    vertical-align:1px; }
  .prikk.el { background:var(--green,#5ad18b); }
  .prikk.sp { background:color-mix(in srgb, var(--orange,#f0a952) 60%, transparent); }

  /* ---- tre tall på rad ---- */
  .stat { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .rute { background:var(--gray100); border-radius:18px; padding:12px 14px; display:grid; gap:2px; }
  .rute .v { font-size:19px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
  .rute .v span { font-size:12px; font-weight:500; opacity:.55; margin-left:3px; }
  .rute .n { font-size:11.5px; opacity:.55; font-weight:500; line-height:1.3; }

  /* ---- per mil, som én rolig linje ---- */
  .mil { display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:12px 14px; border-radius:18px; background:var(--gray100); font-size:13.5px; }
  .mil .par { display:flex; align-items:center; gap:8px; min-width:0; }
  .mil ha-icon { --mdc-icon-size:18px; opacity:.7; flex:none; }
  .mil .tall { font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .mil .mot { opacity:.4; font-size:12px; flex:none; }

  .fot { font-size:12px; opacity:.45; line-height:1.45; }
  .fot.varsel { opacity:1; color:var(--orange,#f0a952); }
  .tom { font-size:14px; opacity:.65; padding:16px 4px; line-height:1.5; }
  .tom code { font-size:12.5px; }

  @media (max-width:400px) {
    .stor { font-size:38px; }
    .stat { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .stat .rute:last-child { grid-column:1 / -1; }
  }
  @media (prefers-reduced-motion: reduce) { .spor i { transition:none; } }
`;

const kiSpaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiSpaNf = (v, d = 0) => (v === null || v === undefined || isNaN(v))
  ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });

class KiSparingCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { prefiks: "sensor.ki_drivstoff_" }; }
  getCardSize() { return 5; }

  setConfig(c) {
    this._c = {
      prefiks: "sensor.ki_drivstoff_",
      tittel: "Elbil mot diesel",
      perioder: ["i_dag", "maaned", "aar", "totalt"],
      periode: "maaned",
      ...(c || {}),
    };
    this._p = this._p || this._c.periode;
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    if (!g || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _id(navn) { return this._c.prefiks + navn; }
  _st(navn) { return this._h && this._h.states[this._id(navn)]; }
  _tall(navn) {
    const s = this._st(navn);
    if (!s || ["unknown", "unavailable", ""].includes(s.state)) return null;
    const n = parseFloat(s.state);
    return isNaN(n) ? null : n;
  }

  _ider() {
    const p = KI_SPAR_PERIODER[this._p] || KI_SPAR_PERIODER.maaned;
    return ["dieselpris", "ladepris", "spart_per_mil", "ladet_mot_beregnet",
      `spart_${p.nokkel}`, "liter_diesel_spart_i_ar", "co2_spart_i_ar"]
      .map((x) => this._id(x))
      .concat(Object.keys(this._h ? this._h.states : {})
        .filter((x) => x.startsWith(this._c.prefiks) && x.includes("kostnad_per_mil")));
  }

  /* «Kostnad per mil – Tesla Model Y» finnes med bilnavnet i entitets-id-en, så vi
     leter etter dem i stedet for å kreve at du skriver dem inn. */
  _biler() {
    const ut = [];
    if (!this._h) return ut;
    for (const id of Object.keys(this._h.states)) {
      if (!id.startsWith(this._c.prefiks) || !id.includes("kostnad_per_mil")) continue;
      const s = this._h.states[id];
      const n = parseFloat(s.state);
      const a = s.attributes || {};
      ut.push({
        id,
        navn: String(a.friendly_name || "").replace(/^.*?Kostnad per mil\s*[–-]\s*/i, "") || "Bil",
        verdi: isNaN(n) ? null : n,
        forbruk: a.forbruk || "",
        el: /kwh/i.test(String(a.forbruk || "")),
      });
    }
    // elbilen først
    return ut.sort((a, b) => (b.el ? 1 : 0) - (a.el ? 1 : 0));
  }

  _tegn() {
    const c = this._c;
    const bg = c.bakgrunn === undefined || c.bakgrunn === false || c.bakgrunn === "none"
      ? "transparent" : c.bakgrunn;
    const stil = `--kort-bg:${bg};--kort-pad:${bg === "transparent" ? "0" : "16px"}`;

    if (!this._st("spart_per_mil")) {
      this.shadowRoot.innerHTML = `<style>${KI_SPAR_STIL}</style>
        <div class="kort" style="${stil}"><div class="tom">
          Finner ingen sensorer fra <b>KI Drivstoff</b> med prefikset
          <code>${kiSpaEsc(c.prefiks)}</code>. Sett <code>prefiks:</code> til det
          entitetene dine faktisk heter.</div></div>`;
      return;
    }

    const perioder = c.perioder.filter((p) => KI_SPAR_PERIODER[p]);
    if (!perioder.includes(this._p)) this._p = perioder[0] || "maaned";
    const p = KI_SPAR_PERIODER[this._p];
    const spartSt = this._st(`spart_${p.nokkel}`);
    const spart = this._tall(`spart_${p.nokkel}`);
    const a = (spartSt && spartSt.attributes) || {};

    const biler = this._biler();
    const maks = Math.max(...biler.map((b) => b.verdi || 0), 0.01);

    const liter = this._tall("liter_diesel_spart_i_ar");
    const co2 = this._tall("co2_spart_i_ar");
    const kontroll = this._tall("ladet_mot_beregnet");
    const diesel = this._tall("dieselpris");
    const dieselSt = this._st("dieselpris");
    const feil = dieselSt && dieselSt.attributes && dieselSt.attributes.feil;

    // Det du faktisk betalte mot det du slapp å betale – én stolpe i stedet for to.
    const elKr = a.strom_kostet !== undefined && a.strom_kostet !== null ? Number(a.strom_kostet) : null;
    const dieselKr = a.diesel_ville_kostet !== undefined && a.diesel_ville_kostet !== null
      ? Number(a.diesel_ville_kostet) : null;
    const andel = (dieselKr && dieselKr > 0 && elKr !== null)
      ? Math.max(4, Math.min(96, Math.round(elKr / dieselKr * 100))) : null;

    const elBil = biler.find((b) => b.el), dieselBil = biler.find((b) => !b.el);

    const rute = (verdi, enhet, navn) => `
      <div class="rute"><div class="v">${verdi}<span>${kiSpaEsc(enhet)}</span></div>
        <div class="n">${kiSpaEsc(navn)}</div></div>`;

    this.shadowRoot.innerHTML = `<style>${KI_SPAR_STIL}</style>
      <div class="kort" style="${stil}">
        <div class="hero">
          <div>
            <div class="merke">Spart ${kiSpaEsc(p.navn.toLowerCase())}</div>
            <div class="stor">${kiSpaNf(spart, 0)}<small>kr</small></div>
            ${dieselKr !== null ? `<div class="undertekst">Diesel ville kostet ${
              kiSpaNf(dieselKr, 0)} kr. Strømmen kostet ${kiSpaNf(elKr, 0)} kr.</div>` : ""}
          </div>
          ${perioder.length > 1 ? `<div class="valg">${perioder.map((x) =>
            `<button class="${x === this._p ? "aktiv" : ""}" data-p="${x}">${
              kiSpaEsc(KI_SPAR_PERIODER[x].navn)}</button>`).join("")}</div>` : ""}
        </div>

        ${andel !== null ? `
        <div class="delt">
          <div class="spor" style="--el:${andel}%;--sp:${100 - andel}%">
            <i class="el">${andel >= 12 ? kiSpaNf(elKr, 0) + " kr" : ""}</i>
            <i class="sp">${kiSpaNf(spart, 0)} kr spart</i>
          </div>
          <div class="nokler">
            <span><i class="prikk el"></i>Strøm <b>${kiSpaNf(elKr, 0)} kr</b></span>
            <span><i class="prikk sp"></i>Spart <b>${kiSpaNf(spart, 0)} kr</b></span>
          </div>
        </div>` : ""}

        <div class="stat">
          ${rute(kiSpaNf(a.kjort_km, 0), "km", "kjørt " + p.navn.toLowerCase())}
          ${rute(kiSpaNf(liter, 0), "L", "diesel ikke fylt i år")}
          ${rute(kiSpaNf(co2, 0), "kg", "CO₂ spart i år")}
        </div>

        <div class="mil" ${elBil ? `data-mer="${kiSpaEsc(elBil.id)}"` : ""}>
          <div class="par"><ha-icon icon="mdi:car-electric"></ha-icon>
            <span class="tall">${kiSpaNf(elBil && elBil.verdi, 2)} kr/mil</span></div>
          <span class="mot">mot</span>
          <div class="par"><span class="tall">${kiSpaNf(dieselBil && dieselBil.verdi, 2)} kr/mil</span>
            <ha-icon icon="mdi:car-estate"></ha-icon></div>
        </div>

        <div class="fot ${feil ? "varsel" : ""}">${feil
          ? kiSpaEsc("Pumpeprisen mangler: " + feil)
          : `Diesel ${kiSpaNf(diesel, 2)} kr/L · lading ${kiSpaNf(this._tall("ladepris"), 2)} kr/kWh${
              kontroll !== null ? ` · ladet mot beregnet ${kiSpaNf(kontroll, 0)} %` : ""}`}</div>
      </div>`;

    for (const b of this.shadowRoot.querySelectorAll("[data-p]"))
      b.addEventListener("click", () => { this._p = b.dataset.p; this._tegn(); });
    for (const el of this.shadowRoot.querySelectorAll("[data-mer]"))
      el.addEventListener("click", () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true })));
  }
}

customElements.define("ki-sparing-card", KiSparingCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sparing-card"))
  window.customCards.push({ type: "ki-sparing-card", name: "KI Sparing",
    description: "Hva elbilen sparer mot den gamle bilen", preview: true });

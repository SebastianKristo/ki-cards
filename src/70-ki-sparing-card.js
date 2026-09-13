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
const KI_SPAR_VERSJON = "2.1.0";

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
  .kort { display:grid; gap:8px; color:var(--gray1000); }
  button { font:inherit; font-family:inherit; border:0; background:none; color:inherit; cursor:pointer; }

  /* ---- periodevelger: samme pilleform som simple-tabs, men liten og venstrestilt
         under beløpet i stedet for som en egen rad over kortet ---- */
  .valg { display:flex; gap:3px; padding:2px; border-radius:999px; width:fit-content;
    border:1px solid rgba(255,255,255,.3); margin-top:10px; max-width:100%;
    overflow-x:auto; scrollbar-width:none; }
  .valg::-webkit-scrollbar { display:none; }
  .valg button { padding:5px 13px; border-radius:999px; font-size:12.5px; font-weight:500;
    color:rgba(255,255,255,.72); transition:background .2s, color .2s; white-space:nowrap; flex:none; }
  .valg button.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95);
    box-shadow:0 1px 6px rgba(0,0,0,.35); }

  /* ---- flisene: samme form som universal_sensor_ny ---- */
  .rutenett { display:grid; grid-template-columns:repeat(var(--kol,2),minmax(0,1fr)); gap:8px; }
  .flis { background:var(--gray200); border-radius:24px; padding:0; overflow:hidden;
    display:grid; grid-template-areas:"i n" "i v"; grid-template-columns:76px 1fr;
    grid-template-rows:1fr 1fr; align-items:center; min-height:88px; text-align:left; width:100%; }
  .flis.hel { grid-column:1 / -1; }
  .flis .ik { grid-area:i; justify-self:start; align-self:center; margin:4px;
    width:58px; height:58px; border-radius:50%; background:rgba(250,251,252,.10);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:28px; }
  .flis .n { grid-area:n; align-self:end; font-size:13px; font-weight:400; opacity:.62;
    line-height:1.25; padding-right:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis .v { grid-area:v; align-self:start; font-size:26px; font-weight:500; line-height:1.15;
    letter-spacing:-.02em; font-variant-numeric:tabular-nums; padding-right:14px; }
  .flis .v span { font-size:14px; line-height:1.5em; margin-left:4px; font-weight:300; opacity:.75; }

  /* framhevet flis, som varslene øverst i popupen */
  .flis.stor { grid-template-rows:auto auto auto; min-height:0; padding-bottom:12px; }
  .flis.stor .v { font-size:38px; font-weight:500; }
  .flis.stor .under { grid-column:2; font-size:12.5px; opacity:.55;
    padding-right:14px; line-height:1.4; margin-top:3px; }
  .flis.stor .valg { grid-column:2; margin-right:14px; }

  /* stolpe nederst i flisa, slik show_bar gjør det */
  .bar { grid-column:1 / -1; height:6px; margin:8px 12px 0; border-radius:99px;
    background:rgba(250,251,252,.12); overflow:hidden; }
  .bar i { display:block; height:100%; border-radius:99px; width:var(--b,0%);
    background:var(--barfarge, var(--green,#5ad18b)); transition:width .7s var(--myk); }

  .fot { font-size:12px; opacity:.45; line-height:1.45; padding:0 6px; }
  .fot.varsel { opacity:1; color:var(--orange,#f0a952); }
  .tom { font-size:14px; opacity:.65; padding:16px 4px; line-height:1.5;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }

  @media (max-width:400px) {
    .flis .ik { width:50px; height:50px; --mdc-icon-size:24px; }
    .flis { grid-template-columns:64px 1fr; }
    .flis.stor .v { font-size:32px; }
  }
  @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
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

    const elKr = a.strom_kostet !== undefined && a.strom_kostet !== null ? Number(a.strom_kostet) : null;
    const dieselKr = a.diesel_ville_kostet !== undefined && a.diesel_ville_kostet !== null
      ? Number(a.diesel_ville_kostet) : null;
    // Andel av dieselregningen dere faktisk betalte. Stolpen viser det motsatte: det sparte.
    const spartAndel = (dieselKr && dieselKr > 0 && elKr !== null)
      ? Math.max(2, Math.min(100, Math.round((1 - elKr / dieselKr) * 100))) : null;

    const elBil = biler.find((b) => b.el), dieselBil = biler.find((b) => !b.el);

    const flis = (ikon, navn, verdi, enhet, ekstra = "", kl = "") => `
      <div class="flis ${kl}"${ekstra}>
        <span class="ik"><ha-icon icon="${ikon}"></ha-icon></span>
        <div class="n">${kiSpaEsc(navn)}</div>
        <div class="v">${verdi}${enhet ? `<span>${kiSpaEsc(enhet)}</span>` : ""}</div>
      </div>`;

    this.shadowRoot.innerHTML = `<style>${KI_SPAR_STIL}</style>
      <div class="kort">
        <div class="rutenett">
          <div class="flis stor hel">
            <span class="ik"><ha-icon icon="mdi:piggy-bank"></ha-icon></span>
            <div class="n">Spart ${kiSpaEsc(p.navn.toLowerCase())}</div>
            <div class="v">${kiSpaNf(spart, 0)}<span>kr</span></div>
            ${dieselKr !== null ? `<div class="under">Diesel ville kostet ${kiSpaNf(dieselKr, 0)} kr,
              strømmen kostet ${kiSpaNf(elKr, 0)} kr</div>` : ""}
            ${perioder.length > 1 ? `<div class="valg">${perioder.map((x) =>
              `<button class="${x === this._p ? "aktiv" : ""}" data-p="${x}">${
                kiSpaEsc(KI_SPAR_PERIODER[x].navn)}</button>`).join("")}</div>` : ""}
            ${spartAndel !== null ? `<div class="bar"><i style="--b:${spartAndel}%"></i></div>` : ""}
          </div>

          ${flis("mdi:car-electric", elBil ? elBil.navn : "Elbil",
            kiSpaNf(elBil && elBil.verdi, 2), "kr/mil",
            elBil ? ` data-mer="${kiSpaEsc(elBil.id)}"` : "")}
          ${flis("mdi:car-estate", dieselBil ? dieselBil.navn : "Diesel",
            kiSpaNf(dieselBil && dieselBil.verdi, 2), "kr/mil",
            dieselBil ? ` data-mer="${kiSpaEsc(dieselBil.id)}"` : "")}

          ${flis("mdi:map-marker-distance", "Kjørt " + p.navn.toLowerCase(), kiSpaNf(a.kjort_km, 0), "km")}
          ${flis("mdi:fuel", "Diesel ikke fylt i år", kiSpaNf(liter, 0), "L")}
          ${flis("mdi:molecule-co2", "CO₂ spart i år", kiSpaNf(co2, 0), "kg", "", "hel")}
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

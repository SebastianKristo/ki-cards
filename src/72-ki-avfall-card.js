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
 * fliser: false                    # bare heroen — bruk når du har egne fliser under
 * kolonner: 1                      # 1 gir én fraksjon per rad, 2 gir to i bredden
 * visning: full                    # full (hero + rader) | rader | hero | kalender
 * kalender: true                   # knapp som bytter mellom rader og månedskalender
 * kalender_entitet: calendar.renovasjon   # bruk en kalenderentitet som kilde
 * intervall_dager: 14              # framskriv datoer når du ikke har kalenderentitet
 * hoyde: 150                       # min-høyde på heroen i px
 */
const KI_AV_VERSJON = "2.1.0";

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

  /* ---- heroen ----
     Alt innholdet ligger i én kolonne ved siden av ikonet. Første utgave hadde
     fraksjonsnavnet i en egen kolonne til høyre og «Deretter»-linja under det; på en
     mobil ble kolonnen så smal at teksten rant inn over nedtellingen. */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:24px;
    background:var(--gray200); padding:16px 18px 0;
    display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px;
    align-items:start; cursor:pointer; transition:background .5s var(--myk), color .3s; }
  .hero.snart { background:color-mix(in srgb, var(--f) 26%, var(--gray200)); }
  .hero.idag { background:var(--f); color:var(--black,#1b1b1b); }

  .hero .ik { width:48px; height:48px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:25px;
    background:rgba(250,251,252,.12); }
  .hero.idag .ik { background:rgba(0,0,0,.14); }

  .merke { font-size:12.5px; font-weight:600; opacity:.7; letter-spacing:.01em; }
  .frak { font-size:17px; font-weight:700; letter-spacing:-.01em; margin-top:2px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* Nedtellingen skal aldri brekke. «I morgen» er bredere enn «5», så størrelsen
     følger bredden i stedet for å være fast. */
  .stor { font-size:clamp(28px, 9vw, 42px); font-weight:600; line-height:1.05;
    letter-spacing:-.035em; white-space:nowrap; margin-top:8px;
    font-variant-numeric:tabular-nums; }
  .stor small { font-size:.42em; font-weight:500; opacity:.62; margin-left:7px;
    letter-spacing:0; }
  .hero.idag .stor { animation:kiAvPuls 2.6s ease-in-out infinite; transform-origin:left center; }
  @keyframes kiAvPuls { 0%,100% { transform:scale(1) } 50% { transform:scale(1.03) } }
  .dato { font-size:13px; opacity:.66; margin-top:4px; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; }
  .etter { font-size:12.5px; opacity:.55; margin-top:6px; line-height:1.4; }

  /* Scenen ligger som et bånd nederst i heroen, i full bredde. Teksten over har
     bunnpadding, så de aldri overlapper — før lå bøtta oppå datoen. */
  .scene { grid-column:1 / -1; position:relative; height:58px; margin:10px -18px 0;
    pointer-events:none; opacity:.4; }
  .hero.idag .scene { opacity:1; }
  .hero.snart .scene { opacity:.62; }
  .scene svg { position:absolute; inset:0; width:100%; height:100%; }

  .botte { transform-box:fill-box; transform-origin:50% 100%; }
  .hero.idag .botte { animation:kiAvRist 1.15s ease-in-out infinite; }
  @keyframes kiAvRist { 0%,100% { transform:rotate(0) } 25% { transform:rotate(-8deg) }
    75% { transform:rotate(8deg) } }
  .lokk { transform-box:fill-box; transform-origin:88% 100%; }
  .hero.idag .lokk { animation:kiAvLokk 1.15s ease-in-out infinite; }
  @keyframes kiAvLokk { 0%,100% { transform:rotate(0) } 40% { transform:rotate(-26deg) } }

  .bil { opacity:0; transform-box:fill-box; }
  .hero.idag .bil { animation:kiAvKjor 7.5s cubic-bezier(.35,0,.65,1) infinite; }
  @keyframes kiAvKjor {
    0% { opacity:0; transform:translateX(-42%) } 7% { opacity:1 }
    42% { transform:translateX(24%) } 58% { transform:translateX(24%) }
    93% { opacity:1 } 100% { opacity:0; transform:translateX(130%) }
  }
  .hjul { transform-box:fill-box; transform-origin:center; }
  .hero.idag .hjul { animation:kiAvRull .5s linear infinite; }
  @keyframes kiAvRull { to { transform:rotate(360deg) } }
  /* eksos når bilen står og tømmer */
  .eksos { opacity:0; }
  .hero.idag .eksos { animation:kiAvEksos 2.4s ease-out infinite; }
  @keyframes kiAvEksos { 0% { opacity:.5; transform:translate(0,0) scale(.6) }
    100% { opacity:0; transform:translate(-14px,-12px) scale(1.5) } }

  /* ---- fraksjonene under ----
     Én per rad: både navnet og nedtellingen fikk plass, mens to kolonner klipte
     «Plastemballasje» til «Plastemball…» og «I morgen» til «I mo…». */
  .liste { display:grid; grid-template-columns:repeat(var(--kol,1),minmax(0,1fr)); gap:8px; }
  .rad { display:flex; align-items:center; gap:14px; min-height:66px;
    padding:10px 16px 10px 10px; border-radius:22px; background:var(--gray200);
    width:100%; text-align:left; cursor:pointer; min-width:0; }
  .rad .ik { width:46px; height:46px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:23px;
    background:color-mix(in srgb, var(--f) 26%, transparent); color:var(--f); }
  .rad .tekst { flex:1; min-width:0; }
  .rad .navn { font-size:15px; font-weight:600; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .rad .nar { font-size:12.5px; opacity:.58; margin-top:2px; }
  .rad .tall { font-size:20px; font-weight:600; letter-spacing:-.02em; white-space:nowrap;
    font-variant-numeric:tabular-nums; flex:none; }
  .rad .tall small { font-size:12px; font-weight:500; opacity:.55; margin-left:4px; }
  .rad.idag { background:color-mix(in srgb, var(--f) 30%, var(--gray200)); }

  /* ---- månedskalender, samme oppbygning som i lanseringskortet ---- */
  .bytt { display:flex; justify-content:center; gap:4px; padding:3px; border-radius:20px;
    background:var(--gray200); }
  .bytt button { flex:1; border:0; background:none; color:var(--gray1000); font:inherit;
    font-size:12.5px; padding:8px 14px; border-radius:16px; cursor:pointer; opacity:.55;
    display:flex; align-items:center; justify-content:center; gap:6px; --mdc-icon-size:18px;
    transition:background .18s, opacity .18s; }
  .bytt button.valgt { background:var(--active-small, var(--active-big, #ee95ff));
    color:var(--gray100,#fafbfc); opacity:1; font-weight:600; }

  .kal { padding:4px 2px 2px; }
  .kaltopp { display:grid; grid-template-columns:min-content 1fr min-content; align-items:center;
    gap:10px; padding:0 2px 10px; }
  .kaltopp .mnd { text-align:center; font-size:16px; font-weight:600; text-transform:capitalize; }
  .pil { border:0; background:none; color:var(--gray1000); width:36px; height:36px;
    border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;
    --mdc-icon-size:24px; opacity:.7; }
  .pil:hover { opacity:1; }
  .pil:active { transform:scale(.92); }
  .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; padding-bottom:6px; }
  .ukedager span { text-align:center; font-size:12px; font-weight:600; opacity:.45; }
  .kalrute { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .kdag { position:relative; aspect-ratio:1; border-radius:50%; background:var(--gray200);
    display:flex; align-items:center; justify-content:center; font-size:15px;
    transition:transform .14s cubic-bezier(.3,1.35,.5,1), background .2s; }
  .kdag.utenfor { opacity:.25; background:transparent; }
  .kdag.har { background:var(--gray100); font-weight:600; cursor:pointer; }
  .kdag.idag { outline:2px solid rgba(255,255,255,.35); outline-offset:-2px; }
  .kdag.valgt { transform:scale(1.06); }
  /* fargeprikkene forteller hvilke fraksjoner som tømmes den dagen */
  .kdag .prikker { position:absolute; bottom:5px; left:0; right:0; display:flex;
    justify-content:center; gap:2px; }
  .kdag .prikker i { width:5px; height:5px; border-radius:50%; background:var(--p); }
  .valgtdag { font-size:13px; opacity:.6; padding:12px 4px 4px; text-transform:capitalize; }
  .anslag { font-size:11.5px; opacity:.45; padding:6px 4px 0; line-height:1.45; }

  .tom { font-size:14px; opacity:.7; padding:16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }

  @media (prefers-reduced-motion: reduce) {
    .botte, .lokk, .bil, .hjul, .stor, .eksos { animation:none !important; }
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
    this._re = null;
    if (this._c.monster) {
      // Ankre mønsteret om det ikke er ankret selv, så det må treffe hele entitets-id-en
      let m = String(this._c.monster);
      if (!m.startsWith("^")) m = `^${m}`;
      if (!m.endsWith("$")) m = `${m}$`;
      try { this._re = new RegExp(m, "i"); }
      catch (e) { console.warn("ki-avfall-card: ugyldig monster", this._c.monster, e); }
    }
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const n = JSON.stringify(this._fraksjoner().map((f) => [f.id, f.dager, f.dato]));
    if (n !== this._sist) { this._sist = n; this._tegn(); }
    else if (!g) this._tegn();
  }

  /* Enten en eksplisitt liste, eller alt som treffer mønsteret.
   *
   * Mønsteret ankres med ^ og $, så «rest» ikke plutselig treffer
   * «sensor.data_energy_yearly». Og ved søk etter mønster kreves det at entiteten
   * faktisk har dager-attributtet — ellers ville et mønster som treffer for bredt gjøre
   * hvilken som helst tallsensor til en avfallsfraksjon. Det er nettopp det som skjedde:
   * solhøyden dukket opp som «neste tømming om -14 dager».
   */
  _ider() {
    if (Array.isArray(this._c.entities) && this._c.entities.length) return this._c.entities;
    if (!this._re || !this._h) return [];
    const attr = this._c.dager_attributt;
    return Object.keys(this._h.states).filter((id) => {
      if (!id.startsWith("sensor.") || !this._re.test(id)) return false;
      const a = (this._h.states[id] || {}).attributes || {};
      return a[attr] !== undefined && a[attr] !== null;
    });
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
      // Negative dager betyr at sensoren ikke handler om tømming i det hele tatt, eller
      // at datoen er utdatert. Over to år fram er like meningsløst.
      if (dager !== null && (dager < 0 || dager > 730)) continue;
      const slag = this._slag(a.friendly_name, id);
      ut.push({ id, dager, dato: a[c.dato_attributt] || null,
        navn: a.friendly_name || slag.navn, ikon: a.icon || slag.ikon, farge: slag.farge });
    }
    return ut.sort((x, y) => (x.dager ?? 9999) - (y.dager ?? 9999));
  }

  _scene(farge, mork) {
    const strek = mork ? "rgba(0,0,0,.45)" : farge;
    return `<div class="scene"><svg viewBox="0 0 340 58" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <line x1="0" y1="52" x2="340" y2="52" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
      <!-- bøtta, med lokk som vipper opp når den tømmes -->
      <g class="botte">
        <rect x="22" y="22" width="26" height="30" rx="4" fill="${strek}"/>
        <path d="M28 30 V46 M35 30 V46 M42 30 V46" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
        <g class="lokk"><rect x="19" y="16" width="32" height="7" rx="3.5" fill="${strek}"/></g>
      </g>
      <!-- søppelbilen -->
      <g class="bil">
        <rect x="96" y="16" width="86" height="28" rx="5" fill="currentColor" fill-opacity=".5"/>
        <rect x="102" y="21" width="74" height="9" rx="2" fill="rgba(0,0,0,.12)"/>
        <path d="M182 24 h24 l11 13 v7 h-35 z" fill="currentColor" fill-opacity=".68"/>
        <rect x="187" y="27" width="15" height="10" rx="2" fill="rgba(255,255,255,.6)"/>
        <circle cx="94" cy="30" r="3" fill="currentColor" fill-opacity=".5"/>
        <circle class="hjul" cx="118" cy="48" r="6" fill="#1b1b1e"/>
        <circle class="hjul" cx="166" cy="48" r="6" fill="#1b1b1e"/>
        <circle class="hjul" cx="202" cy="48" r="6" fill="#1b1b1e"/>
        <circle class="eksos" cx="92" cy="40" r="4" fill="currentColor" fill-opacity=".35"/>
      </g>
    </svg></div>`;
  }

  /* Alle kjente tømmedatoer, ikke bare den neste.
   *
   * Sensorene oppgir bare neste dato per fraksjon. En månedskalender trenger flere, og
   * det finnes to ærlige kilder:
   *
   *   1. En kalenderentitet fra renovasjonsselskapet — da er datoene faktiske.
   *   2. Framskriving fra intervallet. De fleste fraksjoner tømmes hver 14. eller 28.
   *      dag, så neste dato pluss intervallet treffer som regel. Men det er et anslag,
   *      og kortet sier det i klartekst under kalenderen.
   */
  _datoer(alle) {
    const c = this._c;
    const ut = [];
    // 1) kalenderentitet
    for (const h of (this._kalHendelser || [])) {
      const treff = alle.find((f) => {
        const n = String(h.summary || "").toLowerCase();
        return n && String(f.navn).toLowerCase().split(" ").some((o) => o.length > 3 && n.includes(o));
      });
      ut.push({ dato: h.dato, navn: h.summary || (treff && treff.navn) || "Tømming",
        farge: (treff && treff.farge) || "var(--gray600, #8a8a8d)", ekte: true });
    }
    if (ut.length) return ut;

    // 2) neste dato, og framskriving hvis et intervall er oppgitt
    const global = Number(c.intervall_dager) || 0;
    const slutt = new Date();
    slutt.setMonth(slutt.getMonth() + 4);
    for (const f of alle) {
      if (!f.dato) continue;
      const iv = Number(f.intervall) || global;
      let d = new Date(f.dato);
      if (isNaN(d)) continue;
      ut.push({ dato: new Date(d), navn: f.navn, farge: f.farge, ekte: true });
      if (iv > 0) {
        for (let i = 0; i < 20; i++) {
          d = new Date(d.getTime() + iv * 864e5);
          if (d > slutt) break;
          ut.push({ dato: new Date(d), navn: f.navn, farge: f.farge, ekte: false });
        }
      }
    }
    return ut;
  }

  async _hentKalender() {
    const c = this._c;
    if (!c.kalender_entitet || !this._h || !this._h.callApi) return;
    const fra = new Date(); fra.setMonth(fra.getMonth() - 1); fra.setHours(0, 0, 0, 0);
    const til = new Date(); til.setMonth(til.getMonth() + 4);
    try {
      const svar = await this._h.callApi("GET",
        `calendars/${c.kalender_entitet}?start=${encodeURIComponent(fra.toISOString())}` +
        `&end=${encodeURIComponent(til.toISOString())}`);
      this._kalHendelser = (svar || []).map((h) => {
        const raa = (h.start && (h.start.dateTime || h.start.date)) || h.start;
        const d = new Date(raa);
        return isNaN(d) ? null : { dato: d, summary: h.summary };
      }).filter(Boolean);
    } catch (e) {
      this._kalFeil = e && e.message ? e.message : String(e);
      console.warn("ki-avfall-card: fikk ikke hentet kalenderen", e);
    }
    this._tegn();
  }

  _kalender(alle) {
    const naa = new Date(); naa.setHours(0, 0, 0, 0);
    const vist = new Date(naa.getFullYear(), naa.getMonth() + (this._mnd || 0), 1);
    const start = new Date(vist);
    start.setDate(1 - ((vist.getDay() + 6) % 7));        // mandag først

    const datoer = this._datoer(alle);
    const perDag = {};
    for (const d of datoer) {
      const n = new Date(d.dato); n.setHours(0, 0, 0, 0);
      (perDag[n.toDateString()] = perDag[n.toDateString()] || []).push(d);
    }

    const ruter = [];
    for (let i = 0; i < 42; i++) {
      const dag = new Date(start); dag.setDate(start.getDate() + i);
      const liste = perDag[dag.toDateString()] || [];
      const utenfor = dag.getMonth() !== vist.getMonth();
      ruter.push(`<div class="kdag ${utenfor ? "utenfor" : ""} ${liste.length ? "har" : ""}
        ${dag.getTime() === naa.getTime() ? "idag" : ""}
        ${this._valgtDag === dag.toDateString() ? "valgt" : ""}"
        ${liste.length ? `data-dag="${dag.toDateString()}"` : ""}>${dag.getDate()}
        ${liste.length ? `<span class="prikker">${liste.slice(0, 4).map((x) =>
          `<i style="--p:${x.farge}"></i>`).join("")}</span>` : ""}</div>`);
    }

    const valgtNokkel = this._valgtDag || naa.toDateString();
    const valgt = perDag[valgtNokkel] || [];
    const dagTekst = new Date(valgtNokkel);
    const anslatt = datoer.some((d) => !d.ekte);

    return `<div class="kal">
      <div class="kaltopp">
        <button class="pil" data-mnd="-1" aria-label="Forrige måned"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <div class="mnd">${vist.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}</div>
        <button class="pil" data-mnd="1" aria-label="Neste måned"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
      <div class="ukedager">${["M", "T", "O", "T", "F", "L", "S"].map((u) => `<span>${u}</span>`).join("")}</div>
      <div class="kalrute">${ruter.join("")}</div>
      <div class="valgtdag">${kiAvEsc(dagTekst.toLocaleDateString("nb-NO",
        { weekday: "long", day: "numeric", month: "long" }))}${valgt.length ? "" : " · ingen tømming"}</div>
      ${valgt.length ? `<div class="liste">${valgt.map((x) => `
        <div class="rad" style="--f:${x.farge}">
          <span class="ik"><ha-icon icon="mdi:trash-can-outline"></ha-icon></span>
          <div class="tekst"><div class="navn">${kiAvEsc(x.navn)}</div>
            <div class="nar">${x.ekte ? "Bekreftet dato" : "Anslag fra intervallet"}</div></div>
        </div>`).join("")}</div>` : ""}
      ${anslatt ? `<div class="anslag">Datoer utover den neste er anslått ut fra
        intervallet du har satt, ikke hentet fra renovasjonsselskapet. Sett
        <code>kalender_entitet</code> for faktiske datoer.</div>` : ""}
      ${this._kalFeil ? `<div class="anslag">Fikk ikke hentet kalenderen: ${
        kiAvEsc(this._kalFeil)}</div>` : ""}
    </div>`;
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

    // Kalenderknappen vises når du har bedt om den, eller når det finnes datoer å vise
    const visKalender = c.kalender === true || !!c.kalender_entitet;
    if (c.visning === "kalender" && this._visKal === undefined) this._visKal = true;
    if (c.kalender_entitet && this._kalHendelser === undefined) {
      this._kalHendelser = [];
      this._hentKalender();
    }

    const neste = alle[0];
    // fliser: false gir bare heroen. Da kan den ligge som animert topp over et
    // rutenett du har bygget selv, uten at kortet dupliserer fraksjonene under.
    const resten = c.fliser === false ? [] : alle.slice(1);
    const t = kiAvTekst(neste.dager);
    const idag = neste.dager !== null && neste.dager <= 0;
    const snart = neste.dager !== null && neste.dager > 0 && neste.dager <= 2;

    this.shadowRoot.innerHTML = `<style>${KI_AV_STIL}</style>
      <div class="kort" style="--kol:${Math.max(1, Math.min(2, Number(c.kolonner) || 1))}">
        <div class="hero ${idag ? "idag" : snart ? "snart" : ""}"
             style="--f:${neste.farge}" data-mer="${kiAvEsc(neste.id)}" tabindex="0">
          <span class="ik"><ha-icon icon="${kiAvEsc(neste.ikon)}"></ha-icon></span>
          <div>
            <div class="merke">Neste tømming</div>
            <div class="frak">${kiAvEsc(neste.navn)}</div>
            <div class="stor">${kiAvEsc(t.tall)}${t.enhet ? `<small>${t.enhet}</small>` : ""}</div>
            <div class="dato">${kiAvEsc(kiAvDato(neste.dato))}</div>
            ${c.fliser === false && alle.length > 1 ? `<div class="etter">Deretter ${
              kiAvEsc(alle[1].navn.toLowerCase())} ${
              alle[1].dager === 0 ? "i dag" : alle[1].dager === 1 ? "i morgen"
                : `om ${alle[1].dager} dager`}</div>` : ""}
          </div>
          ${this._scene(neste.farge, idag)}
        </div>

        ${visKalender ? `<div class="bytt">
            <button data-vis="rader" class="${this._visKal ? "" : "valgt"}">
              <ha-icon icon="mdi:format-list-bulleted"></ha-icon>Fraksjoner</button>
            <button data-vis="kal" class="${this._visKal ? "valgt" : ""}">
              <ha-icon icon="mdi:calendar-month-outline"></ha-icon>Kalender</button>
          </div>` : ""}

        ${this._visKal ? this._kalender(alle) : ""}

        ${!this._visKal && resten.length ? `<div class="liste">${resten.map((f) => {
          const r = kiAvTekst(f.dager);
          return `<div class="rad ${f.dager !== null && f.dager <= 0 ? "idag" : ""}"
                       style="--f:${f.farge}" data-mer="${kiAvEsc(f.id)}" tabindex="0">
            <span class="ik"><ha-icon icon="${kiAvEsc(f.ikon)}"></ha-icon></span>
            <div class="tekst">
              <div class="navn">${kiAvEsc(f.navn)}</div>
              <div class="nar">${kiAvEsc(kiAvDato(f.dato))}</div>
            </div>
            <div class="tall">${kiAvEsc(r.tall)}${r.enhet ? `<small>${r.enhet}</small>` : ""}</div>
          </div>`;
        }).join("")}</div>` : ""}
      </div>`;

    for (const b of this.shadowRoot.querySelectorAll("[data-vis]"))
      b.addEventListener("click", () => { this._visKal = b.dataset.vis === "kal"; this._tegn(); });
    for (const b of this.shadowRoot.querySelectorAll("[data-mnd]"))
      b.addEventListener("click", () => {
        this._mnd = (this._mnd || 0) + Number(b.dataset.mnd);
        this._valgtDag = null;
        this._tegn();
      });
    for (const d of this.shadowRoot.querySelectorAll("[data-dag]"))
      d.addEventListener("click", () => { this._valgtDag = d.dataset.dag; this._tegn(); });

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

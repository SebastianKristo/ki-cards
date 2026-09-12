/* ki-prosa-card – forsideteksten, bygget automatisk. Frittstående, ingen avhengigheter.
 * Del av ki-cards-bundelen; ingen avhengigheter til KI-hjelperne og kan også brukes alene.
 *
 * Alt er valgfritt. Hver bit kan settes til false for å skrus av, til en entitets-id for å
 * bytte entitet, eller til et objekt for å styre tekst, pille, ikon, enhet og handling:
 *
 *  vaer:
 *    entity: sensor.dashboard_index
 *    attributt: weather            # les et attributt i stedet for tilstanden
 *    enhet: °
 *    mellomrom: false              # mellomrom mellom tall og enhet
 *    tusenskille: false            # tusenskille i tallet (3860 i stedet for 3 860)
 *    ikon: auto                    # auto | mdi:... | emoji | /local/bilde.png | attributt:current.icon
 *                                  # ki:vaskemaskin, ki:oppvask, ki:torketrommel – små tegninger som lever
 *    ikon_plassering: slutt        # start | slutt
 *    små_bokstaver: true
 *    tekst: 'Ute er det {pille}.'  # {pille} er der pillen settes inn
 *    path: '#vaer'
 *  pris: { billig: 0.80, dyr: 0.85, ord: true }   # grønn prikk til og med billig, rød over dyr
 *  lys: { ikon_trinn: [{fra: 0, ikon: 🌙}, {fra: 1, ikon: 💡}, {fra: 4, ikon: 🔆}], tekst_null: 'ingen lys' }
 *  effekt / kalender / ringeklokke / laser / planter / bursdag: samme mønster
 *
 *  vis: switch.gjest                # kortet vises bare når denne er på
 *  vis: { entity: input_select.hus, state: Oslo }   # eller en bestemt tilstand
 *
 *  profil: oslo | stromstad | toten # tre ferdige profiler ligger i kortet
 *  profil_entity: input_select.hus  # eller la en input_select bestemme
 *  profiler:                       # egne profiler, eller overstyr de innebygde
 *    oslo: { ... }                 # overstyringer for Oslo
 *    stromstad: { ... }            # overstyringer for Strömstad
 *  profil: stromstad               # eller profil_entity: input_select.hus
 *
 *  setninger:                      # egne setninger med betingelse (alias: ekstra)
 *    - vis: "states['sensor.x'].state == '0'"      # JS-uttrykk, eller:
 *      nar: { entity: sensor.x, over: 10 }         # state | over | under | pa
 *      tekst: 'Søppel tømmes {pille}'
 *      pille:
 *        entity: sensor.x
 *        attributt: neste
 *        mal: '{sensor.x} av {sensor.y}'
 *        enhet: kr    mellomrom: true    desimaler: 1
 *        prefiks: ca.   suffiks: igjen
 *        ikon: 🗑️     ikon_plassering: start
 *        stil: vanlig | varsel | gradient | glans
 *        animasjon: ingen | snurr | hopp | vink
 *        path: '#soppel'   tjeneste: script.x   data: {}   mer: sensor.x   hold: script.y
 *
 * Trykk på en pille = navigering eller handling. Langt trykk = more-info (eller `hold`).
 */
const KI_PROSA_VERSJON = "2.11.1";

/* Standardoppsettet. Hver nøkkel kan overstyres helt eller delvis i konfigurasjonen. */
const KI_PROSA_STD = {
  storrelse: "1.4em",
  vaer: { entity: "weather.forecast_home", enhet: "°", mellomrom: false, ikon: "auto", ikon_plassering: "slutt",
          små_bokstaver: true, tekst: "Ute er det {pille}.", path: "#weather" },
  pris: { entity: "sensor.norgespris_pris_na", enhet: "kr", mellomrom: true, desimaler: 2,
          billig: 0.80, dyr: 0.85,           /* grønn prikk til og med billig, rød over dyr */
          ord: false, ord_billig: "billig", ord_normal: "", ord_dyr: "dyrt",
          tekst: "Strømmen koster {pille}", path: "?tab=priser#strom" },
  spot: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
  effekt: { entity: "sensor.strommaler_effekt", enhet: "W", mellomrom: false, desimaler: 0, tusenskille: false,
            tekst: "og vi bruker {pille}", path: "?tab=forbruk#strom" },
  lys: { entity: "auto", ikon: "💡", tekst: "med {pille} på", path: "#lys",
         tekst_null: "ingen lys", skjul_null: false,
         /* ikonet følger hvor mange lys som står på */
         ikon_trinn: [{ fra: 0, ikon: "🌙" }, { fra: 1, ikon: "💡" }, { fra: 4, ikon: "🔆" }, { fra: 8, ikon: "✨" }] },
  lys_ekskluder: [],
  kalender: { entity: "sensor.alle_kalendere", ikon: "⏰", tekst: "Vi har {pille} i dag.", path: "#kalender" },
  apparater: [
    { navn: "Oppvaskmaskinen", aktiv: { entity: "input_select.oppvaskmaskin_status", state: "Vasker" },
      verdi: "sensor.oppvaskmaskin_power", enhet: "W", mellomrom: false, tusenskille: false,
      ikon: "ki:oppvask", animasjon: "auto",
      tekst: "{navn} vasker {pille} nå.", path: "#kjokken" },
    { navn: "Vaskemaskinen", aktiv: { entity: "sensor.vaskemaskin_power", over: 10 },
      verdi: "sensor.vaskemaskin_power", enhet: "W", mellomrom: false, tusenskille: false,
      ikon: "ki:vaskemaskin", animasjon: "auto",
      tekst: "{navn} vasker {pille} nå.", path: "#vaskegang" }],
  hjemkomst: [{ navn: "Mamma", aktiv: "input_boolean.ki_cybele_pa_vei_hjem_fra_jobb",
                reisetid: "sensor.cybele_reisetid_fra_job", ikon: "🚗", animasjon: "hopp",
                tekst: "{navn} kommer hjem ca. kl {pille}.", path: "#personer" }],
  ringeklokke: { entity: "input_boolean.ki_ringeklokke_varsel_aktiv", ikon: "🔔", animasjon: "vink",
                 stil: "varsel", tekst: "{pille} Noen ringer på døren!", tjeneste: "input_boolean.turn_off" },
  laser: { entity: "auto", natt: [23, 6], ikon: "🔒", stil: "gradient",
           tekst: "Lås alle dørene {pille}", tjeneste: "lock.lock" },
  planter: { entity: "auto", ikon: "🪴", tekst: "{pille} trenger vann.", path: "#planter" },
  bursdag: { vis: "binary_sensor.vis_bursdagskort", skjult: "input_boolean.bursdagskort_skjult",
             navn: "sensor.dagens_bursdager", ikon: "🎂", stil: "gradient glans",
             tekst: "I dag har {pille} bursdag! 🎉", tjeneste: "input_boolean.turn_on" },
  setninger: [],
};

/* Tre ferdige profiler – ett hus hver. Oslo er satt opp med de faktiske entitetene,
   Strömstad og Toten finner sine selv ut fra navn og enheter (kan overstyres som vanlig). */
const KI_PROSA_PROFILER = {
  oslo: {
    navn: "Oslo",
    nokkelord: ["oslo", "hjemme", "huset"],
    vaer: { entity: "weather.forecast_home" },
    pris: { entity: "sensor.norgespris_pris_na", billig: 0.8, dyr: 0.85 },
    spot: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
    effekt: { entity: "sensor.strommaler_effekt" },
    kalender: { entity: "sensor.alle_kalendere" },
    lys: { entity: "auto" },
    planter: { entity: "auto" },
    laser: { entity: "auto" },
  },
  stromstad: {
    navn: "Strömstad",
    nokkelord: ["stromstad", "strömstad", "hytta", "sverige", "se3"],
    vaer: { entity: "auto" },
    pris: { entity: "auto", enhet: "kr", billig: 0.4, dyr: 0.9 },
    spot: "auto",
    effekt: { entity: "auto" },
    kalender: false,
    lys: { entity: "auto" },
    planter: false,
    laser: { entity: "auto" },
    bursdag: false,
    apparater: [],
    hjemkomst: [],
  },
  toten: {
    navn: "Toten",
    nokkelord: ["toten", "gard", "gaard"],
    vaer: { entity: "auto" },
    pris: { entity: "auto" },
    spot: "auto",
    effekt: { entity: "auto" },
    kalender: false,
    lys: { entity: "auto" },
    planter: false,
    laser: { entity: "auto" },
    bursdag: false,
    apparater: [],
    hjemkomst: [],
  },
};

/* Små tegnede ikoner som beveger seg. Trommelen er blå fordi det er vann i den. */
const KI_PROSA_FIGURER = {
  vaskemaskin: `<svg class="ki-fig ki-vask" viewBox="0 0 24 24" aria-hidden="true">
    <g class="rist">
      <rect class="kropp" x="3.5" y="2.5" width="17" height="19" rx="3"/>
      <rect class="panel" x="5.5" y="4.5" width="13" height="3" rx="1.5"/>
      <circle class="knapp1" cx="16.6" cy="6" r=".9"/>
      <circle class="luke" cx="12" cy="14.5" r="5.6"/>
      <circle class="vann" cx="12" cy="14.5" r="4.3"/>
      <g class="tromle">
        <path class="boelge" d="M7.7 15.4q1.1-1 2.15 0t2.15 0q1.1-1 2.15 0t2.15 0v4.2H7.7z"/>
        <circle class="skum" cx="10.2" cy="12.8" r=".85"/>
        <circle class="skum s2" cx="13.6" cy="13.4" r=".6"/>
        <circle class="skum s3" cx="12.1" cy="11.9" r=".5"/>
      </g>
      <circle class="glass" cx="12" cy="14.5" r="4.3"/>
    </g>
    <path class="fot" d="M5.6 21.5v1.3M18.4 21.5v1.3"/>
  </svg>`,
  oppvask: `<svg class="ki-fig ki-vask" viewBox="0 0 24 24" aria-hidden="true">
    <g class="rist">
      <rect class="kropp" x="3.5" y="2.5" width="17" height="19" rx="3"/>
      <rect class="panel" x="5.5" y="4.5" width="13" height="3" rx="1.5"/>
      <rect class="vann" x="6" y="9" width="12" height="10" rx="2"/>
      <g class="tromle">
        <path class="boelge" d="M6.4 15.6q1.15-1 2.3 0t2.3 0q1.15-1 2.3 0t2.3 0v3.4H6.4z"/>
        <circle class="skum" cx="9.4" cy="12.6" r=".8"/>
        <circle class="skum s2" cx="14.2" cy="13.2" r=".55"/>
      </g>
      <path class="tallerken" d="M9.6 10.4v5.2M12 10v5.6M14.4 10.4v5.2"/>
    </g>
    <path class="fot" d="M5.6 21.5v1.3M18.4 21.5v1.3"/>
  </svg>`,
  torketrommel: `<svg class="ki-fig ki-tork" viewBox="0 0 24 24" aria-hidden="true">
    <g class="rist">
      <rect class="kropp" x="3.5" y="2.5" width="17" height="19" rx="3"/>
      <rect class="panel" x="5.5" y="4.5" width="13" height="3" rx="1.5"/>
      <circle class="luke" cx="12" cy="14.5" r="5.6"/>
      <g class="snurr"><path class="klaer" d="M9.4 12.4q2.6-1.6 5.2 0 1.3 2.1 0 4.2-2.6 1.6-5.2 0-1.3-2.1 0-4.2z"/></g>
      <circle class="glass" cx="12" cy="14.5" r="4.3"/>
    </g>
    <path class="fot" d="M5.6 21.5v1.3M18.4 21.5v1.3"/>
  </svg>`,
};

const KI_PROSA_VAER = {
  "sunny": "mdi:weather-sunny", "clear-night": "mdi:weather-night", "partlycloudy": "mdi:weather-partly-cloudy", "cloudy": "mdi:weather-cloudy",
  "rainy": "mdi:weather-rainy", "pouring": "mdi:weather-pouring", "snowy": "mdi:weather-snowy", "snowy-rainy": "mdi:weather-snowy-rainy",
  "fog": "mdi:weather-fog", "hail": "mdi:weather-hail", "lightning": "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy",
  "windy": "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant", "exceptional": "mdi:alert",
};

const KI_PROSA_STIL = `
  :host { display:block; --myk:cubic-bezier(.2,.8,.2,1); }
  .prosa { font-size:var(--str,1.4em); line-height:2em; padding:0 6px 4px 7px; font-weight:400; color:var(--gray1000, var(--primary-text-color)); }
  .prosa p { margin:0; }
  .setning { display:inline; }
  .ny { animation:pr-inn .7s var(--myk) both; display:inline-block; }
  .pille { display:inline-flex; align-items:center; gap:5px; padding:0 10px; border-radius:999px; background:var(--gray1000, var(--primary-text-color));
    color:var(--gray100, var(--card-background-color)); font-weight:500; line-height:1.65; white-space:nowrap; vertical-align:baseline;
    cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .3s, transform .12s; }
  .pille:active { transform:scale(.95); }
  .pille ha-icon { --mdc-icon-size:1em; }
  .pille img { height:1.25em; width:auto; display:block; }
  .pille:focus-visible { outline:2px solid var(--active-big, #ee95ff); outline-offset:2px; }
  .pille.lav { text-transform:lowercase; }
  .pille .v { display:inline-block; }
  .pille .prikk { width:.42em; height:.42em; border-radius:50%; background:var(--tone,var(--green)); box-shadow:0 0 8px var(--tone,var(--green)); }
  .pille.varsel { background:var(--red); color:#fff; --tone:var(--red); animation:pr-puls 1.6s ease-in-out infinite; }
  .pille.gradient { background:var(--k-grad, linear-gradient(135deg,#ffc88a,#ee95ff)); color:rgba(70,58,64,.95); }
  .pille.glans { position:relative; overflow:hidden; }
  .pille.glans::after { content:""; position:absolute; top:0; bottom:0; width:30%; left:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); animation:pr-glans 2.8s ease-in-out infinite; pointer-events:none; }
  .snurr-ik { display:inline-block; animation:pr-snurr 2.4s linear infinite; }
  /* tegnede ikoner */
  /* Figuren er større enn teksten, men skal ikke gjøre pillen høyere –
     ellers faller pillen ned i forhold til setningen rundt. */
  .ki-fig { width:1.5em; height:1.5em; margin:-.4em 0; vertical-align:middle; overflow:visible; flex:none; }
  .ki-fig .kropp { fill:none; stroke:currentColor; stroke-width:1.5; }
  .ki-fig .panel { fill:currentColor; opacity:.28; }
  .ki-fig .knapp1 { fill:currentColor; opacity:.6; }
  .ki-fig .luke { fill:none; stroke:currentColor; stroke-width:1.4; opacity:.7; }
  .ki-fig .glass { fill:none; stroke:currentColor; stroke-width:1; opacity:.35; }
  .ki-fig .vann { fill:#4da3e0; opacity:.85; }
  .ki-fig .boelge { fill:#8fd3ff; opacity:.9; }
  .ki-fig .skum { fill:#eaf6ff; opacity:.9; }
  .ki-fig .tallerken { stroke:#eaf6ff; stroke-width:1.1; opacity:.75; fill:none; stroke-linecap:round; }
  .ki-fig .klaer { fill:#8fd3ff; opacity:.85; }
  .ki-fig .fot { stroke:currentColor; stroke-width:1.4; stroke-linecap:round; opacity:.55; }
  .ki-fig .rist { transform-box:fill-box; transform-origin:50% 90%; }
  .ki-fig .tromle, .ki-fig .snurr { transform-box:fill-box; transform-origin:50% 50%; }
  /* i ro står maskinen stille */
  .ki-fig.gaar .rist { animation:pr-rist .34s ease-in-out infinite; }
  .ki-fig.gaar .tromle { animation:pr-vask 2.6s ease-in-out infinite; }
  .ki-fig.gaar .snurr { animation:pr-snurr 1.6s linear infinite; }
  .ki-fig.gaar .skum { animation:pr-skum 2.2s ease-in-out infinite; }
  .ki-fig.gaar .s2 { animation-delay:-.7s; } .ki-fig.gaar .s3 { animation-delay:-1.4s; }
  @keyframes pr-rist { 0%,100% { transform:translateX(-.35px) rotate(-.5deg); } 50% { transform:translateX(.35px) rotate(.5deg); } }
  @keyframes pr-vask { 0%,100% { transform:rotate(-16deg); } 50% { transform:rotate(16deg); } }
  @keyframes pr-skum { 0%,100% { transform:translateY(0); opacity:.9; } 50% { transform:translateY(-1.1px); opacity:.5; } }
  .hopp { display:inline-block; animation:pr-hopp 1.6s ease-in-out infinite; }
  .vink { display:inline-block; transform-origin:50% 10%; animation:pr-vink 1.2s ease-in-out infinite; }
  @keyframes pr-inn { from { opacity:0; transform:translateY(10px) scale(.985); } to { opacity:1; transform:none; } }
  @keyframes pr-snurr { to { transform:rotate(360deg); } }
  @keyframes pr-hopp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
  @keyframes pr-vink { 0%,60%,100% { transform:rotate(0); } 10%,30%,50% { transform:rotate(-16deg); } 20%,40% { transform:rotate(16deg); } }
  @keyframes pr-glans { from { transform:translateX(-120%) skewX(-18deg); } to { transform:translateX(320%) skewX(-18deg); } }
  @keyframes pr-puls { 0%,100% { box-shadow:0 0 0 0 rgba(255,90,82,0); } 50% { box-shadow:0 0 0 6px rgba(255,90,82,.25); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiPEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiPNf = (v, d = 0, tusen = true) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–"
  : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: tusen !== false });
const kiPFlertall = (n, en, fl) => `${n} ${n === 1 ? en : fl}`;
const kiPGlob = (m, s) => !m || new RegExp("^" + m.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(s);
const kiPJs = (() => { const c = {}; return (expr, h) => { try { return (c[expr] || (c[expr] = new Function("states", "hass", "return (" + expr + ");")))(h.states, h); } catch (e) { return undefined; } }; })();
const kiPMal = (t, h) => String(t || "").replace(/\{([a-z_]+\.[a-z0-9_]+)(?:\.([a-z0-9_]+))?\}/g, (m, id, at) => {
  const s = h.states[id]; if (!s) return "–"; if (at) return s.attributes[at] ?? "–";
  const v = parseFloat(s.state); return isNaN(v) ? s.state : kiPNf(v, Math.abs(v) < 10 && v % 1 ? 2 : 0) + (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
});
/* Slår sammen standard og brukerens verdi: false = av, streng = entitet, objekt = delvis overstyring */
const kiPFlett = (std, bruker) => {
  if (bruker === false || bruker === null) return false;
  if (bruker === undefined) return std;
  if (typeof bruker === "string" || typeof bruker === "number") return { ...(typeof std === "object" ? std : {}), entity: String(bruker) };
  if (Array.isArray(bruker)) return bruker;
  return { ...(typeof std === "object" ? std : {}), ...bruker };
};

class KiProsaCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return {}; }
  static getConfigElement() { return document.createElement("ki-prosa-card-editor"); }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: 12, min_rows: 1 }; }

  setConfig(c) {
    this._raa = c || {};
    this._profil = null;
    this._bygg2(this._raa);
  }
  /* Profiler: flere hus i samme kort. `profil: stromstad` velger én, eller
     `profil_entity` peker på en input_select som bestemmer hvilken. */
  _velgProfil() {
    const r = this._raa || {};
    const egne = r.profiler || {};
    const alle = { ...KI_PROSA_PROFILER, ...egne };
    if (!r.profil && !r.profil_entity && !r.profiler) return null;
    let navn = r.profil;
    if (r.profil_entity && this._h) {
      const st = this._h.states[r.profil_entity];
      if (st && st.state) navn = st.state;
    }
    if (!navn) navn = Object.keys(alle)[0];
    const rens = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/ö/g, "o");
    const n = rens(navn);
    const treff = Object.keys(alle).find((k) => rens(k) === n)
      || Object.keys(alle).find((k) => rens((alle[k] || {}).navn || "") === n);
    return treff || null;
  }
  _sjekkProfil() {
    const valgt = this._velgProfil();
    if (valgt === this._profil) return false;
    this._profil = valgt;
    const r = this._raa || {};
    const alle = { ...KI_PROSA_PROFILER, ...(r.profiler || {}) };
    const over = valgt ? alle[valgt] : {};
    const { profiler, profil, profil_entity, ...basis } = r;
    const { navn, nokkelord, ...felt } = over || {};
    this._nokkelord = nokkelord || [];
    this._profilnavn = navn || valgt;
    this._autocache = {};
    /* profilen er grunnlaget, men det du selv har skrevet i kortet vinner */
    const flettet = { ...felt };
    for (const [k, v] of Object.entries(basis)) flettet[k] = kiPFlett(felt[k], v);
    this._bygg2(flettet);
    this._bygget = false;
    return true;
  }
  _bygg2(c) {
    const b = c || {};
    const k = { ...KI_PROSA_STD, ...b };
    for (const n of ["vaer", "pris", "effekt", "lys", "kalender", "ringeklokke", "laser", "planter", "bursdag"])
      k[n] = kiPFlett(KI_PROSA_STD[n], b[n]);
    /* apparater og hjemkomst: fyll ut hvert element med standardnøklene */
    const fyll = (liste, std) => (liste || []).map((x) => ({ ...std, ...x }));
    k.apparater = b.apparater === false ? [] : fyll(b.apparater || KI_PROSA_STD.apparater,
      { enhet: "W", mellomrom: false, tusenskille: false, animasjon: "ingen", tekst: "{navn} vasker {pille} nå." });
    k.hjemkomst = b.hjemkomst === false ? [] : fyll(b.hjemkomst || KI_PROSA_STD.hjemkomst,
      { ikon: "🚗", animasjon: "hopp", tekst: "{navn} kommer hjem ca. kl {pille}." });
    k.setninger = [].concat(b.setninger || [], b.ekstra || []);   /* ekstra er gammelt navn */
    this._c = k; this._bygget = false;
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 60000); this._sjekkProfil(); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    const nyProfil = this._sjekkProfil();
    const id2 = this._raa && this._raa.profil_entity;
    if (nyProfil || !g || !this._bygget || (id2 && g.states[id2] !== h.states[id2])
      || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  /* ------------------------------------------------------------ oppslag */
  /* «auto» slår opp en passende entitet ut fra profilens nøkkelord, enhet og domene.
     Slik slipper nye hus å ha entitetslista skrevet inn. */
  _autoEnt(type) {
    if (!this._h) return null;
    const buf = (this._autocache = this._autocache || {});
    if (buf[type] !== undefined) return buf[type];
    const ord = (this._nokkelord || []).map((x) => String(x).toLowerCase());
    const S = this._h.states;
    const navn = (id) => ((S[id].attributes || {}).friendly_name || "").toLowerCase();
    const treff = (id) => !ord.length || ord.some((k) => id.toLowerCase().includes(k) || navn(id).includes(k));
    const enhet = (id) => String((S[id].attributes || {}).unit_of_measurement || "").toLowerCase();
    const klasse = (id) => String((S[id].attributes || {}).device_class || "");
    const finn = (test) => {
      const alle = Object.keys(S).filter(test);
      return alle.find(treff) || (ord.length ? null : alle[0]) || null;
    };
    let ut = null;
    if (type === "vaer") ut = finn((id) => id.startsWith("weather."));
    else if (type === "pris") ut = finn((id) => id.startsWith("sensor.")
      && /kr|øre|ore|sek|nok/.test(enhet(id)) && /kwh/.test(enhet(id)));
    else if (type === "spot") ut = finn((id) => id.startsWith("sensor.") && Array.isArray((S[id].attributes || {}).raw_today));
    else if (type === "effekt") ut = finn((id) => id.startsWith("sensor.") && klasse(id) === "power" && /^w$|kw/.test(enhet(id)));
    else if (type === "kalender") ut = finn((id) => id.startsWith("sensor.") && Array.isArray((S[id].attributes || {}).events))
      || finn((id) => id.startsWith("calendar."));
    buf[type] = ut;
    return ut;
  }
  /* Bytter ut «auto» i konfigurasjonen med en faktisk entitet */
  _ent(gren) {
    const d = this._c[gren];
    if (!d || d === false) return null;
    const id = typeof d === "string" ? d : d.entity;
    if (id !== "auto") return id;
    if (gren === "lys" || gren === "planter" || gren === "laser") return "auto";   /* disse teller selv */
    return this._autoEnt(gren);
  }
  _st(id) { return (this._h && id && this._h.states[id]) || null; }
  _val(id) { const s = this._st(id); return s ? s.state : ""; }
  _on(id) { return this._val(id) === "on"; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  _at(id, a) { const s = this._st(id); return s ? s.attributes[a] : undefined; }
  _teknisk(id) { const r = this._h.entities && this._h.entities[id]; return !!(r && (r.hidden || r.entity_category)); }
  _domene(d) { return Object.keys(this._h.states).filter((id) => id.startsWith(d + ".")); }
  _lysene() {
    const alle = this._domene("light").filter((id) => !this._teknisk(id)
      && !Array.isArray(this._h.states[id].attributes.entity_id)
      && !(this._c.lys_ekskluder || []).some((g) => kiPGlob(g, id)));
    const ord = (this._nokkelord || []).map((x) => String(x).toLowerCase());
    if (!ord.length) return alle;
    const navn = (id) => ((this._h.states[id].attributes || {}).friendly_name || "").toLowerCase();
    const passer = alle.filter((id) => ord.some((k) => id.toLowerCase().includes(k) || navn(id).includes(k)));
    return passer.length ? passer : alle;      /* uten treff teller vi alle */
  }
  _planteliste() { return Object.keys(this._h.states).filter((id) => { if (!id.startsWith("binary_sensor.")) return false; const a = this._h.states[id].attributes || {}; return a.integrasjon === "ki_planter" && a.type === "plante"; }).sort(); }
  _ider() {
    const c = this._c, ids = [], e = (x) => x && x.entity;
    if (typeof c.vis === "string" && !/[<>=!]|states\[/.test(c.vis)) ids.push(c.vis);
    else if (c.vis && c.vis.entity) ids.push(c.vis.entity);
    else if (typeof c.vis === "string") (c.vis.match(/[a-z_]+\.[a-z0-9_]+/g) || []).forEach((x) => ids.push(x));
    ["vaer", "pris", "effekt", "kalender"].forEach((g) => { const id = this._ent(g); if (id && id !== "auto") ids.push(id); });
    if (c.ringeklokke) ids.push(e(c.ringeklokke));
    const spotId = typeof c.spot === "string" ? c.spot : e(c.spot);
    ids.push(spotId === "auto" ? this._autoEnt("spot") : spotId);
    if (c.lys) { const v = e(c.lys); if (v === "auto") ids.push(...this._lysene()); else if (v) ids.push(v); }
    if (c.laser) { const v = e(c.laser); if (v === "auto") ids.push(...this._domene("lock")); else if (v) ids.push(...[].concat(v)); }
    if (c.planter && e(c.planter) === "auto") ids.push(...this._planteliste());
    else if (c.planter) ids.push(...[].concat(e(c.planter) || []));
    (c.apparater || []).forEach((a) => { const u = a.aktiv || a.vis; ids.push(a.verdi, u && (u.entity || u)); });
    (c.hjemkomst || []).forEach((a) => { const u = a.aktiv || a.vis; ids.push(u && (u.entity || u), a.reisetid); });
    if (c.bursdag) ids.push(c.bursdag.vis, c.bursdag.skjult, c.bursdag.navn);
    (c.setninger || []).forEach((s) => {
      if (s.nar) ids.push(s.nar.entity || s.nar);
      (String(s.vis || "").match(/[a-z_]+\.[a-z0-9_]+/g) || []).forEach((x) => ids.push(x));
      const p = s.pille || {}; ids.push(p.entity);
      (String(p.mal || "").match(/[a-z_]+\.[a-z0-9_]+/g) || []).forEach((x) => ids.push(x));
    });
    return ids.filter((x) => typeof x === "string");
  }

  /* ---------------------------------------------------------- handlinger */
  /* Navigerer uten å laste dashbordet på nytt – se KI.navigate i basen */
  _nav(sti) {
    if (!sti || sti === "#") return;
    const gammel = location.hash;
    let url = null;
    try { url = new URL(sti, location.origin + location.pathname + location.search); } catch (e) { /* tom */ }
    if (url) {
      const ny = url.pathname + url.search + url.hash;
      if (ny !== location.pathname + location.search + location.hash) history.pushState(null, "", ny);
    }
    window.dispatchEvent(new Event("location-changed"));
    try { window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: gammel, newURL: location.href })); }
    catch (e) { window.dispatchEvent(new Event("hashchange")); }
  }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
  _kjor(a, data) {
    if (!a) return;
    if (a.startsWith("nav:")) return this._nav(a.slice(4));
    if (a.startsWith("more:")) return this._mer(a.slice(5));
    if (a.startsWith("svc:")) { const [dom, tj] = a.slice(4).split("."); let d = {}; try { d = JSON.parse(data || "{}"); } catch (e) { /* tom */ }
      if (navigator.vibrate) navigator.vibrate(10); this._h.callService(dom, tj, d); }
  }
  _koble() {
    const r = this.shadowRoot, finn = (e) => { for (const el of e.composedPath()) { if (el === r) break; if (el.nodeType === 1 && el.dataset && el.dataset.a) return el; } return null; };
    let t = null, x0 = 0, y0 = 0, svelg = false;
    r.addEventListener("click", (e) => { if (svelg) { svelg = false; return; } const el = finn(e); if (el) { e.stopPropagation(); this._kjor(el.dataset.a, el.dataset.d); } });
    r.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = finn(e); if (el) { e.preventDefault(); this._kjor(el.dataset.a, el.dataset.d); } });
    r.addEventListener("pointerdown", (e) => {
      const el = finn(e); if (!el || (!el.dataset.e && !el.dataset.h)) return; x0 = e.clientX; y0 = e.clientY;
      t = setTimeout(() => { t = null; svelg = true; if (navigator.vibrate) navigator.vibrate(12);
        if (el.dataset.h) this._kjor(el.dataset.h, el.dataset.hd); else this._mer(el.dataset.e);
        setTimeout(() => { svelg = false; }, 700); }, 500);
    });
    const stopp = () => { clearTimeout(t); t = null; };
    r.addEventListener("pointerup", stopp); r.addEventListener("pointercancel", stopp);
    r.addEventListener("pointermove", (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stopp(); });
    r.addEventListener("contextmenu", (e) => { const el = finn(e); if (el && (el.dataset.e || el.dataset.h)) e.preventDefault(); });
  }

  /* -------------------------------------------------------------- piller */
  _aktiv(a) {
    if (a === true) return true;
    if (!a) return false;
    if (typeof a === "string") return this._on(a);
    const s = this._st(a.entity); if (!s) return false;
    if (a.over !== undefined) return parseFloat(s.state) > a.over;
    if (a.under !== undefined) return parseFloat(s.state) < a.under;
    if (a.state !== undefined) return s.state === String(a.state);
    return s.state === "on";
  }
  /* Bygger ikon-markup av emoji, mdi-navn, bilde-URL eller «attributt:sti» */
  _ikonHtml(ikon, o = {}) {
    if (!ikon || ikon === "ingen") return "";
    let k = String(ikon);
    if (k === "auto") {
      const s = this._st(o.entity);
      k = (s && KI_PROSA_VAER[s.state]) || "mdi:weather-cloudy";
    } else if (k.startsWith("attributt:")) {
      const sti = k.slice(10).split("."); let v = this._st(o.entity);
      v = v ? v.attributes : null;
      for (const d of sti) v = v ? v[d] : undefined;
      if (!v) return "";
      k = String(v);
    }
    if (k.startsWith("ki:")) {
      const fig = KI_PROSA_FIGURER[k.slice(3)];
      if (fig) {
        /* figurene beveger seg når apparatet går – «ingen» lar dem stå stille */
        const lever = o.animasjon !== "ingen" && o.animasjon !== false;
        return fig.replace('class="ki-fig', `class="ki-fig${lever ? " gaar" : ""}`);
      }
    }
    const inner = k.startsWith("mdi:") ? `<ha-icon icon="${kiPEsc(k)}"></ha-icon>`
      : /^(https?:|\/)/.test(k) ? `<img src="${kiPEsc(k)}" alt="">`
      : kiPEsc(k);
    const anim = o.animasjon && o.animasjon !== "ingen" ? o.animasjon === "snurr" ? "snurr-ik" : o.animasjon : "";
    return anim ? `<span class="${anim}">${inner}</span>` : inner;
  }
  /* Setter sammen én pille av en definisjon */
  _pille(def, tekstOverstyr) {
    const d = def || {};
    let tekst = tekstOverstyr;
    if (tekst === undefined) {
      if (d.mal) tekst = kiPMal(d.mal, this._h);
      else {
        const s = this._st(d.entity);
        let v = d.attributt ? (s ? s.attributes[d.attributt] : undefined) : (s ? s.state : undefined);
        const n = parseFloat(v);
        if (!isNaN(n) && String(v).trim() !== "" && d.tall !== false) v = kiPNf(n, d.desimaler ?? 0, d.tusenskille);
        const enhet = d.enhet !== undefined ? d.enhet : (s && s.attributes.unit_of_measurement) || "";
        tekst = (v === undefined || v === null || v === "" ? "–" : String(v)) + (enhet ? (d.mellomrom === false ? "" : " ") + enhet : "");
      }
      if (d.prefiks) tekst = d.prefiks + " " + tekst;
      if (d.suffiks) tekst = tekst + " " + d.suffiks;
      tekst = kiPEsc(tekst);
    }
    const ik = this._ikonHtml(d.ikon, d);
    const prikk = d.prikk ? `<i class="prikk" style="--tone:${kiPEsc(d.prikk)}"></i>` : "";
    const verdi = `<b class="v">${tekst}</b>`;
    const innhold = d.ikon_plassering === "slutt" ? `${prikk}${verdi}${ik ? " " + ik : ""}` : `${prikk}${ik ? ik + " " : ""}${verdi}`;
    const a = d.tjeneste ? `svc:${d.tjeneste}` : d.path ? `nav:${d.path}` : d.mer ? `more:${d.mer}` : "";
    const h = d.hold ? `svc:${d.hold}` : "";
    const klasser = ["pille", d.stil && d.stil !== "vanlig" ? d.stil : "", d.små_bokstaver ? "lav" : ""].filter(Boolean).join(" ");
    const pid = kiPEsc(d.id || d.entity || d.mal || d.path || d.tjeneste || "p");
    return `<span class="${klasser}" role="button" tabindex="0" data-p="${pid}" data-a="${a}"` +
      (d.data ? ` data-d="${kiPEsc(JSON.stringify(d.data))}"` : "") +
      (h ? ` data-h="${h}" data-hd="${kiPEsc(JSON.stringify(d.hold_data || {}))}"` : "") +
      (d.entity ? ` data-e="${kiPEsc(d.entity)}"` : "") + `>${innhold}</span>`;
  }
  /* Setter pillen inn i setningen der {pille} står */
  /* Nøkkel som sier hvilken setning dette er, uten tallene i den.
     Slik animeres bare setninger som faktisk dukker opp, ikke hver gang et tall endrer seg. */
  _nokkel(html) { return String(html).replace(/<[^>]*>/g, "").replace(/[\d.,:]+/g, "#").trim(); }
  _setning(tekst, pille, felt = {}) {
    let t = String(tekst || "{pille}");
    for (const [k, v] of Object.entries(felt)) t = t.split("{" + k + "}").join(kiPEsc(v));
    const deler = t.split("{pille}");
    return deler.length > 1 ? deler[0] + pille + deler.slice(1).join("{pille}") : t + " " + pille;
  }
  /* Tallverdien en pilledefinisjon peker på – tilstand eller attributt */
  _tallAv(d) {
    if (!d || !d.entity) return null;
    const st = this._st(d.entity); if (!st) return null;
    const v = d.attributt ? st.attributes[d.attributt] : st.state;
    const n = parseFloat(v); return isNaN(n) ? null : n;
  }
  /* Grønn, gul eller rød prikk: faste grenser hvis de finnes, ellers spotprisen i dag */
  _prisTone(c) {
    const p = c.pris || {};
    if (p.billig !== undefined || p.dyr !== undefined) {
      const v = this._tallAv(p);
      if (v === null) return null;
      const billig = p.billig ?? p.dyr, dyr = p.dyr ?? p.billig;
      return v <= billig ? "var(--green)" : v > dyr ? "var(--red)" : "var(--yellow)";
    }
    let id = typeof c.spot === "string" ? c.spot : (c.spot && c.spot.entity);
    if (id === "auto") id = this._autoEnt("spot");
    const s = this._st(id), r = s && s.attributes.raw_today;
    if (!Array.isArray(r) || !r.length) return null;
    const naa = parseFloat(s.state), v = r.map((p) => p.value).filter((x) => typeof x === "number");
    if (!v.length || isNaN(naa)) return null;
    const min = Math.min(...v), max = Math.max(...v), f = (naa - min) / (max - min || 1);
    return f < 0.34 ? "var(--green)" : f < 0.67 ? "var(--yellow)" : "var(--red)";
  }

  /* -------------------------------------------------------------- tekst */
  _deler() {
    const c = this._c, h = this._h, deler = [];

    /* vær */
    const forste = [];
    if (c.vaer && this._st(this._ent("vaer"))) {
      const d = { ...c.vaer, entity: this._ent("vaer") };
      if (d.attributt === undefined) { const s = this._st(d.entity); if (s && s.attributes.temperature !== undefined) d.attributt = "temperature"; }
      forste.push(this._setning(c.vaer.tekst, this._pille(d)));
    }
    /* pris, effekt og lys settes sammen til én setning av de bitene som finnes */
    const bit = [];
    const prisDef = c.pris ? { ...c.pris, entity: this._ent("pris") } : c.pris;
    if (prisDef && this._tallAv(prisDef) !== null) {
      const tone = this._prisTone({ ...c, pris: prisDef }), p = prisDef;
      let suffiks = p.suffiks;
      if (p.ord) {
        const v = this._tallAv(p), billig = p.billig ?? 0, dyr = p.dyr ?? billig;
        const ord = v <= billig ? p.ord_billig : v > dyr ? p.ord_dyr : p.ord_normal;
        if (ord) suffiks = [suffiks, "(" + ord + ")"].filter(Boolean).join(" ");
      }
      bit.push(this._setning(p.tekst, this._pille({ ...p, suffiks, prikk: tone || undefined })));
    }
    if (c.effekt) {
      const e = { ...c.effekt, entity: this._ent("effekt") };
      const w = this._tallAv(e);
      if (w !== null && w > 0) bit.push(this._setning(e.tekst, this._pille(e)));
    }
    if (c.lys) {
      const v = c.lys.entity;
      const n = v === "auto" ? this._lysene().filter((id) => this._on(id)).length : this._tallAv(c.lys) || 0;
      if (n > 0 || c.lys.skjul_null === false) {
        const trinn = (c.lys.ikon_trinn || []).filter((t) => n >= (t.fra ?? 0)).sort((a, b) => (a.fra ?? 0) - (b.fra ?? 0)).pop();
        const ikon = trinn ? trinn.ikon : c.lys.ikon;
        const tekst = n === 0 && c.lys.tekst_null ? c.lys.tekst_null : kiPFlertall(n, c.lys.entall || "lys", c.lys.flertall || "lys");
        bit.push(this._setning(c.lys.tekst, this._pille({ ...c.lys, ikon }, kiPEsc(tekst))));
      }
    }
    if (bit.length) {
      /* første bit skal ikke begynne med «og» eller «med» når de foregående mangler */
      bit[0] = bit[0].replace(/^(og|med) /, (m, o) => "");
      bit[0] = bit[0].charAt(0).toUpperCase() + bit[0].slice(1);
      forste.push(bit.join(" ") + ".");
    }
    if (forste.length) deler.push(forste.join(" "));

    /* kalender */
    if (c.kalender) {
      const kid = this._ent("kalender");
      const k = this._st(kid);
      if (k) {
        const i0 = new Date(); i0.setHours(0, 0, 0, 0); const i1 = i0.getTime() + 86400000;
        const n = (k.attributes.events || []).filter((e) => { const t = new Date(e.start).getTime(); return t >= i0.getTime() && t < i1; }).length;
        deler.push(this._setning(c.kalender.tekst,
          this._pille({ ...c.kalender, entity: kid }, n ? kiPEsc(kiPFlertall(n, "hendelse", "hendelser")) : "ingen hendelser")));
      }
    }
    /* apparater */
    (c.apparater || []).forEach((a) => {
      if (!this._aktiv(a.aktiv || a.vis)) return;
      /* mangler verdi-sensoren, brukes sensoren som utløste apparatet */
      const kilde = this._st(a.verdi) ? a.verdi : (a.aktiv && a.aktiv.entity) || a.aktiv;
      const p = this._pille({ entity: kilde, enhet: a.enhet, mellomrom: a.mellomrom, tusenskille: a.tusenskille, desimaler: a.desimaler ?? 0,
        ikon: a.ikon, animasjon: a.animasjon, ikon_plassering: a.ikon_plassering, path: a.path,
        mer: a.path ? undefined : kilde, stil: a.stil });
      deler.push(`<span class="ny">${this._setning(a.tekst, p, { navn: a.navn })}</span>`);
    });
    /* hjemkomst */
    (c.hjemkomst || []).forEach((a) => {
      const utloser = a.aktiv || a.vis;
      if (!(typeof utloser === "string" ? this._on(utloser) : this._aktiv(utloser))) return;
      const min = this._num(a.reisetid); if (min === null) return;
      const kl = new Date(Date.now() + min * 60000).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      const p = this._pille({ entity: a.reisetid, ikon: a.ikon, animasjon: a.animasjon, path: a.path, mer: a.path ? undefined : a.reisetid }, kiPEsc(kl));
      deler.push(`<span class="ny">${this._setning(a.tekst, p, { navn: a.navn })}</span>`);
    });
    /* ringeklokke */
    if (c.ringeklokke && this._on(c.ringeklokke.entity)) {
      const d = { ...c.ringeklokke, data: c.ringeklokke.data || { entity_id: c.ringeklokke.entity } };
      deler.push(`<span class="ny">${this._setning(c.ringeklokke.tekst, this._pille(d, ""))}</span>`);
    }
    /* låser om natta */
    if (c.laser) {
      const v = c.laser.entity;
      const ls = v === "auto" ? this._domene("lock") : [].concat(v), apne = ls.filter((id) => this._val(id) === "unlocked");
      const t = new Date().getHours(), [a, b] = c.laser.natt || [23, 6];
      if (apne.length && (a > b ? (t >= a || t < b) : (t >= a && t < b)))
        deler.push(`<span class="ny">${this._setning(c.laser.tekst,
          this._pille({ ...c.laser, entity: undefined, data: { entity_id: apne } }, String(apne.length)))}</span>`);
    }
    /* planter */
    if (c.planter) {
      const v = c.planter.entity;
      let navn = [];
      if (v === "auto") navn = this._planteliste().filter((id) => this._on(id)).map((id) => this._at(id, "navn") || this._at(id, "friendly_name"));
      else { const s = this._st(v); const tx = c.planter.attributt ? (s && s.attributes[c.planter.attributt]) : (s && s.state);
        if (tx && !["0", "", "unknown", "unavailable", "off"].includes(String(tx))) navn = [String(tx)]; }
      if (navn.length) {
        const n = navn.length > 2 ? `${navn.slice(0, -1).join(", ")} og ${navn[navn.length - 1]}` : navn.join(" og ");
        deler.push(`<span class="ny">${this._setning(c.planter.tekst, this._pille(c.planter, kiPEsc(n)))}</span>`);
      }
    }
    /* bursdag */
    const bd = c.bursdag;
    if (bd && this._on(bd.vis) && !this._on(bd.skjult))
      deler.push(`<span class="ny">${this._setning(bd.tekst,
        this._pille({ ...bd, entity: bd.navn, data: bd.data || { entity_id: bd.skjult } }, kiPEsc(this._val(bd.navn))))}</span>`);

    /* egne setninger */
    (c.setninger || []).forEach((s) => {
      if (s.vis && !kiPJs(s.vis, h)) return;
      if (s.nar && !this._aktiv(s.nar)) return;
      const p = s.pille ? this._pille(s.pille) : "";
      const felt = { ...(s.felt || {}) };
      let t = s.tekst !== undefined ? s.tekst : "{pille}";
      /* gammel form: for / etter / path uten {pille} */
      if (s.for || s.etter) t = `${s.for || ""}{pille}${s.etter ? " " + s.etter : ""}`;
      if (!s.pille && (s.path || s.tjeneste || s.mer)) {
        const pp = this._pille({ path: s.path, tjeneste: s.tjeneste, data: s.data, mer: s.mer, ikon: s.ikon, stil: s.stil },
          kiPEsc(kiPMal(s.pille_tekst || s.tekst, h)));
        deler.push(`<span class="ny">${pp}</span>`);
        return;
      }
      deler.push(`<span class="ny">${this._setning(kiPMal(t, h), p, felt)}</span>`);
    });
    return deler;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._synlig()) { this.style.display = "none"; return; }
    this.style.display = "";
    const deler = this._deler();
    const nokler = deler.map((d) => this._nokkel(d));

    if (!this._bygget) {
      this.shadowRoot.innerHTML = `<style>${KI_PROSA_STIL}</style>
        <div class="prosa" style="${c.storrelse ? `--str:${kiPEsc(c.storrelse)}` : ""}"><p></p></div>`;
      this._koble(); this._bygget = true; this._kart = new Map();
    }
    const p = this.shadowRoot.querySelector(".prosa p");
    const gamle = this._kart || (this._kart = new Map());
    const brukt = new Set();

    deler.forEach((html, i) => {
      const n = nokler[i];
      brukt.add(n);
      let span = gamle.get(n);
      if (span && span.isConnected) {
        /* samme setning som sist: bytt bare det som faktisk har endret seg */
        if (!this._mykSetning(span, html)) {
          span.innerHTML = String(html).replace(/ class="ny"/g, "");
        }
      } else {
        span = document.createElement("span");
        span.className = "setning";
        span.dataset.k = n;
        span.innerHTML = html;
        gamle.set(n, span);
      }
      /* Flytt bare noder som faktisk står feil. Å flytte en node kobler
         ha-icon fra og til igjen, og det er nettopp det som glimter. */
      if (p.children[i] !== span) {
        if (p.children[i]) p.insertBefore(span, p.children[i]); else p.appendChild(span);
      }
    });

    for (const [n, span] of [...gamle]) {
      if (!brukt.has(n)) { if (span.parentNode) span.remove(); gamle.delete(n); }
    }
    /* mellomrom mellom setningene */
    [...p.children].forEach((el, i) => {
      const m = i < p.children.length - 1 ? ".28em" : "";
      if (el.style.marginRight !== m) el.style.marginRight = m;
    });
  }

  /* Bytter tall, farge og klasse inne i en setning uten å bygge den om.
     Returnerer false hvis strukturen er en annen enn sist. */
  _mykSetning(span, html) {
    const mal = document.createElement("span");
    mal.innerHTML = String(html).replace(/ class="ny"/g, "");
    const np = mal.querySelectorAll(".pille"), gp = span.querySelectorAll(".pille");
    if (np.length !== gp.length) return false;
    for (let j = 0; j < np.length; j++) {
      if (np[j].dataset.p !== gp[j].dataset.p) return false;
      const nv = np[j].querySelector(".v"), gv = gp[j].querySelector(".v");
      if (!nv || !gv) return false;
      if (nv.textContent !== gv.textContent) gv.textContent = nv.textContent;
      if (np[j].className !== gp[j].className) gp[j].className = np[j].className;
      if (np[j].dataset.a !== gp[j].dataset.a) gp[j].dataset.a = np[j].dataset.a;
      const npr = np[j].querySelector(".prikk"), gpr = gp[j].querySelector(".prikk");
      if (!!npr !== !!gpr) return false;
      if (npr && npr.getAttribute("style") !== gpr.getAttribute("style")) gpr.setAttribute("style", npr.getAttribute("style"));
      const ni = np[j].querySelector("ha-icon"), gi = gp[j].querySelector("ha-icon");
      if (!!ni !== !!gi) return false;
      if (ni && ni.getAttribute("icon") !== gi.getAttribute("icon")) gi.setAttribute("icon", ni.getAttribute("icon"));
      const nf = np[j].querySelector(".ki-fig"), gf = gp[j].querySelector(".ki-fig");
      if (!!nf !== !!gf) return false;
      if (nf && nf.getAttribute("class") !== gf.getAttribute("class")) gf.setAttribute("class", nf.getAttribute("class"));
    }
    /* teksten utenom pillene må være den samme */
    const rens = (el) => [...el.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join("");
    if (rens(mal) !== rens(span)) {
      const nye = [...mal.childNodes].filter((x) => x.nodeType === 3);
      const gmle = [...span.childNodes].filter((x) => x.nodeType === 3);
      if (nye.length !== gmle.length) return false;
      nye.forEach((t, i) => { if (gmle[i].textContent !== t.textContent) gmle[i].textContent = t.textContent; });
    }
    return true;
  }

  /* Kortet kan skjules av en bryter, en select eller et fritt uttrykk */
  _synlig() {
    const v = this._c.vis;
    if (v === undefined || v === null || v === "") return true;
    if (v === false) return false;
    if (typeof v === "string") {
      if (/[<>=!]|states\[/.test(v)) return !!kiPJs(v, this._h);
      return this._on(v);
    }
    return this._aktiv(v);
  }

}
if (!customElements.get("ki-prosa-card")) customElements.define("ki-prosa-card", KiProsaCard);

class KiProsaCardEditor extends HTMLElement {
  setConfig(c) { this._c = JSON.parse(JSON.stringify(c || {})); this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _send() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._c }, bubbles: true, composed: true })); }

  /* Hvilken del av konfigurasjonen redigeres: rota, eller én profil */
  _mal() {
    const c = this._c;
    if (!this._redigerProfil) return c;
    c.profiler = c.profiler || {};
    c.profiler[this._redigerProfil] = c.profiler[this._redigerProfil] || {};
    return c.profiler[this._redigerProfil];
  }
  _standard(gren) {
    const p = this._redigerProfil && KI_PROSA_PROFILER[this._redigerProfil];
    const fra = p && p[gren] !== undefined ? p[gren] : KI_PROSA_STD[gren];
    return fra;
  }
  _les(gren, felt) {
    const m = this._mal();
    const std = gren ? this._standard(gren) : KI_PROSA_STD;
    if (!gren) return m[felt] !== undefined ? m[felt] : std[felt];
    if (m[gren] === false) return "";
    const b = typeof m[gren] === "string" ? { entity: m[gren] } : (m[gren] || {});
    if (b[felt] !== undefined) return b[felt];
    const s2 = typeof std === "string" ? { entity: std } : (std || {});
    return s2[felt];
  }
  _sett(gren, felt, verdi) {
    const m = this._mal();
    const tom = verdi === "" || verdi === undefined || verdi === null;
    if (gren) {
      const naa = typeof m[gren] === "string" ? { entity: m[gren] } : (m[gren] && typeof m[gren] === "object" ? { ...m[gren] } : {});
      if (tom) delete naa[felt]; else naa[felt] = verdi;
      if (Object.keys(naa).length) m[gren] = naa; else delete m[gren];
    } else if (tom) delete m[felt]; else m[felt] = verdi;
    this._send(); this._oppdater();
  }
  _av(gren, av) {
    const m = this._mal();
    if (av) m[gren] = false; else delete m[gren];
    this._send(); this._bygg();
  }
  /* lister: apparater, hjemkomst, setninger */
  _liste(navn) { const m = this._mal(); return Array.isArray(m[navn]) ? m[navn] : (this._standard(navn) || []); }
  _settListe(navn, liste) { const m = this._mal(); m[navn] = liste; this._send(); this._bygg(); }
  _settRad(navn, i, felt, verdi) {
    const liste = JSON.parse(JSON.stringify(this._liste(navn)));
    const rad = liste[i] || {};
    if (verdi === "" || verdi === undefined) delete rad[felt]; else rad[felt] = verdi;
    liste[i] = rad; const m = this._mal(); m[navn] = liste; this._send();
  }

  static get GRUPPER() {
    return [
      ["vaer", "Vær", [["entity", "Entitet", "entity"], ["attributt", "Attributt", "text"], ["enhet", "Enhet", "text"],
        ["desimaler", "Desimaler", "number"], ["mellomrom", "Mellomrom før enhet", "bool"],
        ["ikon", "Ikon", "text"], ["ikon_plassering", "Ikon start/slutt", "text"],
        ["tekst", "Setning ({pille})", "text"], ["path", "Trykk går til", "text"]]],
      ["pris", "Strømpris", [["entity", "Entitet", "entity"], ["enhet", "Enhet", "text"], ["desimaler", "Desimaler", "number"],
        ["billig", "Billig til og med", "number"], ["dyr", "Dyrt over", "number"], ["ord", "Skriv billig/dyrt", "bool"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["spot", "Spotpris (fargeprikk)", [["entity", "Entitet", "entity"]]],
      ["effekt", "Forbruk nå", [["entity", "Entitet", "entity"], ["enhet", "Enhet", "text"],
        ["mellomrom", "Mellomrom før enhet", "bool"], ["tusenskille", "Tusenskille", "bool"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["lys", "Lys", [["entity", "Entitet eller auto", "text"], ["ikon", "Ikon", "text"],
        ["tekst_null", "Tekst uten lys på", "text"], ["skjul_null", "Vis når ingen lys er på", "bool"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["kalender", "Kalender", [["entity", "Entitet", "entity"], ["ikon", "Ikon", "text"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["ringeklokke", "Ringeklokke", [["entity", "Entitet", "entity"], ["ikon", "Ikon", "text"],
        ["tekst", "Setning", "text"], ["tjeneste", "Tjeneste ved trykk", "text"]]],
      ["laser", "Låser om natta", [["entity", "Entiteter eller auto", "text"], ["ikon", "Ikon", "text"],
        ["tekst", "Setning", "text"], ["tjeneste", "Tjeneste ved trykk", "text"]]],
      ["planter", "Planter", [["entity", "Entitet eller auto", "text"], ["attributt", "Attributt", "text"],
        ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["bursdag", "Bursdag", [["vis", "Vis når på", "entity"], ["skjult", "Skjult-bryter", "entity"],
        ["navn", "Navn-sensor", "entity"], ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"]]],
    ];
  }
  static get LISTER() {
    return [
      ["apparater", "Apparater", [["navn", "Navn", "text"], ["aktiv_entity", "Aktiv når denne", "entity"],
        ["aktiv_state", "har tilstanden", "text"], ["aktiv_over", "eller er over", "number"],
        ["verdi", "Viser verdien fra", "entity"], ["enhet", "Enhet", "text"], ["ikon", "Ikon", "icon"],
        ["animasjon", "Animasjon: ingen, snurr, hopp, vink", "text"],
        ["tekst", "Setning ({navn}, {pille})", "text"], ["path", "Trykk går til", "text"]]],
      ["hjemkomst", "På vei hjem", [["navn", "Navn", "text"], ["aktiv", "På vei hjem-bryter", "entity"],
        ["reisetid", "Reisetid i minutter", "entity"], ["ikon", "Ikon", "icon"],
        ["animasjon", "Animasjon: ingen, snurr, hopp, vink", "text"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["setninger", "Egne setninger", [["tekst", "Setning ({pille})", "text"], ["nar_entity", "Vis når denne", "entity"],
        ["nar_state", "har tilstanden", "text"], ["nar_over", "eller er over", "number"],
        ["pille_entity", "Pillen viser", "entity"], ["pille_mal", "eller teksten", "text"],
        ["pille_ikon", "Ikon", "icon"], ["pille_path", "Trykk går til", "text"],
        ["pille_tjeneste", "Tjeneste ved trykk", "text"]]],
    ];
  }

  _felt(type, etikett, les, skriv) {
    let el, hent, sett;
    if (type === "entity") {
      el = document.createElement("ha-entity-picker");
      el.hass = this._h; el.label = etikett; el.allowCustomEntity = true;
      el.addEventListener("value-changed", (e) => { e.stopPropagation(); skriv(e.detail.value); });
      hent = () => el.value || ""; sett = (v) => { el.value = v ?? ""; };
    } else if (type === "icon") {
      el = document.createElement("ha-icon-picker");
      el.hass = this._h; el.label = etikett;
      el.addEventListener("value-changed", (e) => { e.stopPropagation(); skriv(e.detail.value); });
      hent = () => el.value || ""; sett = (v) => { el.value = v ?? ""; };
    } else if (type === "bool") {
      el = document.createElement("ha-formfield"); el.label = etikett;
      const sw = document.createElement("ha-switch");
      sw.addEventListener("change", (e) => skriv(e.target.checked));
      el.appendChild(sw);
      hent = () => sw.checked; sett = (v) => { sw.checked = v !== false; };
    } else {
      el = document.createElement("ha-textfield");
      el.label = etikett; if (type === "number") el.type = "number";
      el.addEventListener("change", (e) => skriv(type === "number"
        ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value));
      hent = () => el.value; sett = (v) => { el.value = v ?? ""; };
    }
    this._felter.push({ el, hent, sett, les });
    return el;
  }

  _r() { if (!this._h || !this._c) return; if (this._rot) { this._oppdater(); return; } this._bygg(); }

  /* Én seksjon som kan foldes ut, med kort oppsummering i hodet */
  _seksjon(inn, id, tittel, oppsumFn) {
    const boks = document.createElement("div");
    boks.className = "gr" + (this._apne && this._apne[id] ? " apen" : "");
    const hode = document.createElement("div"); hode.className = "hode";
    hode.innerHTML = `<ha-icon class="pil" icon="mdi:chevron-right"></ha-icon>
      <span class="tit">${kiPEsc(tittel)}</span><span class="oppsum"></span>`;
    const kropp = document.createElement("div"); kropp.className = "kropp";
    hode.addEventListener("click", () => {
      this._apne = this._apne || {};
      this._apne[id] = !this._apne[id];
      boks.classList.toggle("apen", this._apne[id]);
    });
    boks.appendChild(hode); boks.appendChild(kropp); inn.appendChild(boks);
    if (oppsumFn) this._oppsum = [...(this._oppsum || []), { el: hode.querySelector(".oppsum"), fn: oppsumFn }];
    return kropp;
  }

  _bygg() {
    if (!this._h || !this._c) return;
    if (!this._rot) {
      this._rot = document.createElement("div");
      this._rot.innerHTML = `<style>
        .gr { border:1px solid var(--divider-color,#444); border-radius:12px; margin:0 0 8px; overflow:hidden; }
        .gr > .hode { display:flex; align-items:center; gap:10px; padding:12px 14px; cursor:pointer;
          background:var(--secondary-background-color, rgba(255,255,255,.04)); }
        .gr > .hode .tit { font-size:14px; font-weight:600; }
        .gr > .hode .oppsum { margin-left:auto; font-size:12px; opacity:.6; white-space:nowrap; overflow:hidden;
          text-overflow:ellipsis; max-width:52%; }
        .gr > .hode .pil { transition:transform .18s; opacity:.6; }
        .gr.apen > .hode .pil { transform:rotate(90deg); }
        .gr > .kropp { display:none; padding:12px 14px 14px; }
        .gr.apen > .kropp { display:block; }
        .rad { display:grid; grid-template-columns:1fr 1fr; gap:10px 8px; }
        .rad > * { min-width:0; }
        .rad.full { grid-template-columns:1fr; }
        .rk { display:flex; justify-content:space-between; align-items:center; gap:8px;
          margin:10px 0 6px; padding-top:10px; border-top:1px solid var(--divider-color,#444); }
        .rk:first-of-type { border-top:0; padding-top:0; }
        .rk b { font-size:13px; }
        .knapp { border:0; background:var(--secondary-background-color,#333); color:var(--primary-text-color,#fff);
          border-radius:10px; padding:8px 14px; font:inherit; font-size:13px; cursor:pointer; }
        .knapp:hover { filter:brightness(1.15); }
        .knapp.fjern { background:none; color:var(--error-color,#e8657a); padding:6px 8px; }
        .knapp.legg { margin-top:12px; width:100%; }
        .hint { font-size:12px; opacity:.6; margin:4px 0 12px; line-height:1.5; }
        .avrad { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:12px;
          padding-top:10px; border-top:1px solid var(--divider-color,#444); font-size:13px; opacity:.85; }
      </style><div class="innhold"></div>`;
      this.appendChild(this._rot);
    }
    const inn = this._rot.querySelector(".innhold");
    inn.innerHTML = "";
    this._felter = []; this._oppsum = [];
    this._apne = this._apne || { profil: true };

    /* --- profil --- */
    const pb = this._seksjon(inn, "profil", "Profil og visning",
      () => (this._c.profil ? (KI_PROSA_PROFILER[this._c.profil] || {}).navn || this._c.profil : "ingen profil"));
    const prad = document.createElement("div"); prad.className = "rad";
    const valg = document.createElement("ha-select");
    valg.label = "Aktiv profil";
    const navn = [...new Set([...Object.keys(KI_PROSA_PROFILER), ...Object.keys(this._c.profiler || {})])];
    valg.innerHTML = `<mwc-list-item value=""></mwc-list-item>` +
      navn.map((n) => `<mwc-list-item value="${n}">${(KI_PROSA_PROFILER[n] || {}).navn || n}</mwc-list-item>`).join("");
    valg.value = this._c.profil || "";
    valg.addEventListener("selected", (e) => {
      const v = e.target.value;
      if (v) this._c.profil = v; else delete this._c.profil;
      this._send(); this._bygg();
    });
    prad.appendChild(valg);
    prad.appendChild(this._felt("entity", "Profil styres av", () => this._c.profil_entity,
      (v) => { if (v) this._c.profil_entity = v; else delete this._c.profil_entity; this._send(); }));
    pb.appendChild(prad);
    const vrad = document.createElement("div"); vrad.className = "rad";
    vrad.appendChild(this._felt("entity", "Vis kortet bare når denne er på",
      () => (typeof this._c.vis === "string" ? this._c.vis : (this._c.vis && this._c.vis.entity) || ""),
      (v) => { if (!v) delete this._c.vis; else if (this._c.vis && this._c.vis.state) this._c.vis = { ...this._c.vis, entity: v }; else this._c.vis = v; this._send(); }));
    vrad.appendChild(this._felt("text", "… eller har denne tilstanden",
      () => (this._c.vis && this._c.vis.state) || "",
      (v) => {
        const id = typeof this._c.vis === "string" ? this._c.vis : (this._c.vis || {}).entity;
        if (!id) return;
        this._c.vis = v ? { entity: id, state: v } : id;
        this._send();
      }));
    pb.appendChild(vrad);

    const rediger = document.createElement("ha-formfield");
    rediger.label = this._redigerProfil
      ? `Endringene lagres i profilen «${this._redigerProfil}»`
      : "Rediger den valgte profilen i stedet for kortet";
    const rsw = document.createElement("ha-switch");
    rsw.checked = !!this._redigerProfil;
    rsw.addEventListener("change", (e) => {
      this._redigerProfil = e.target.checked ? (this._c.profil || navn[0]) : null;
      this._bygg();
    });
    rediger.appendChild(rsw); pb.appendChild(rediger);

    /* --- generelt --- */
    const gb = this._seksjon(inn, "generelt", "Generelt", () => this._les("", "storrelse") || "");
    const grad = document.createElement("div"); grad.className = "rad";
    grad.appendChild(this._felt("text", "Tekststørrelse", () => this._les("", "storrelse"), (v) => this._sett("", "storrelse", v)));
    gb.appendChild(grad);

    /* --- bitene --- */
    for (const [gren, tittel, felter] of KiProsaCardEditor.GRUPPER) {
      const av = this._mal()[gren] === false;
      const boks = this._seksjon(inn, gren, tittel,
        () => (this._mal()[gren] === false ? "av" : (this._les(gren, "entity") || this._les(gren, "navn") || "")));
      if (!av) {
        const rad = document.createElement("div"); rad.className = "rad";
        for (const [felt, etikett, type] of felter) {
          const f = this._felt(type, etikett, () => this._les(gren, felt), (v) => this._sett(gren, felt, v));
          if (felt === "tekst") f.parentElement === null && (f.style.gridColumn = "1 / -1");
          rad.appendChild(f);
          if (felt === "tekst") f.style.gridColumn = "1 / -1";
        }
        boks.appendChild(rad);
      }
      const avrad = document.createElement("div"); avrad.className = "avrad";
      avrad.appendChild(Object.assign(document.createElement("span"), { textContent: "Skru av denne biten" }));
      const sw = document.createElement("ha-switch");
      sw.checked = av;
      sw.addEventListener("change", (e) => this._av(gren, e.target.checked));
      avrad.appendChild(sw); boks.appendChild(avrad);
    }

    /* --- lister --- */
    for (const [navnListe, tittel, felter] of KiProsaCardEditor.LISTER) {
      const boks = this._seksjon(inn, navnListe, tittel,
        () => { const n = this._liste(navnListe).length; return n ? `${n} ${n === 1 ? "rad" : "rader"}` : "tom"; });
      const liste = this._liste(navnListe);
      liste.forEach((rad, i) => {
        const topp = document.createElement("div"); topp.className = "rk";
        const b = document.createElement("b"); b.textContent = rad.navn || rad.tekst || `${tittel} ${i + 1}`;
        const fjern = document.createElement("button"); fjern.className = "knapp fjern"; fjern.textContent = "Fjern";
        fjern.addEventListener("click", () => {
          const ny = JSON.parse(JSON.stringify(this._liste(navnListe))); ny.splice(i, 1);
          this._settListe(navnListe, ny);
        });
        topp.appendChild(b); topp.appendChild(fjern); boks.appendChild(topp);
        const r2 = document.createElement("div"); r2.className = "rad";
        for (const [felt, etikett, type] of felter) {
          const les = () => {
            if (felt === "aktiv_entity") return (rad.aktiv && (rad.aktiv.entity || rad.aktiv)) || "";
            if (felt === "aktiv_state") return (rad.aktiv && rad.aktiv.state) || "";
            if (felt === "aktiv_over") return (rad.aktiv && rad.aktiv.over) ?? "";
            if (felt === "nar_entity") return (rad.nar && rad.nar.entity) || "";
            if (felt === "nar_state") return (rad.nar && rad.nar.state) || "";
            if (felt === "nar_over") return (rad.nar && rad.nar.over) ?? "";
            if (felt.startsWith("pille_")) return (rad.pille || {})[felt.slice(6)] ?? "";
            return rad[felt] ?? "";
          };
          const skriv = (v) => {
            const ny = JSON.parse(JSON.stringify(this._liste(navnListe)));
            const r3 = ny[i] || {};
            const settInn = (obj, n, verdi) => { if (verdi === "" || verdi === undefined) delete obj[n]; else obj[n] = verdi; };
            if (felt.startsWith("aktiv_")) {
              const a = typeof r3.aktiv === "string" ? { entity: r3.aktiv } : (r3.aktiv || {});
              settInn(a, felt.slice(6), v); r3.aktiv = a;
            } else if (felt.startsWith("nar_")) {
              const a = r3.nar || {}; settInn(a, felt.slice(4), v); r3.nar = a;
            } else if (felt.startsWith("pille_")) {
              const a = r3.pille || {}; settInn(a, felt.slice(6), v); r3.pille = a;
            } else settInn(r3, felt, v);
            ny[i] = r3; const m = this._mal(); m[navnListe] = ny; this._send();
          };
          r2.appendChild(this._felt(type, etikett, les, skriv));
        }
        boks.appendChild(r2);
      });
      const legg = document.createElement("button"); legg.className = "knapp legg"; legg.textContent = "+  Legg til";
      legg.addEventListener("click", () => {
        const ny = JSON.parse(JSON.stringify(this._liste(navnListe)));
        ny.push(navnListe === "setninger" ? { tekst: "Ny setning {pille}" } : { navn: "Nytt" });
        this._settListe(navnListe, ny);
      });
      boks.appendChild(legg);
    }

    const hint = document.createElement("p"); hint.className = "hint";
    hint.textContent = "Trykk på en overskrift for å folde den ut. Tomme felt arver fra profilen, "
      + "og «Skru av denne biten» fjerner setningen fra teksten.";
    inn.appendChild(hint);
    this._oppdater();
  }

  /* Fyller inn verdiene uten å bygge om skjemaet, og rører ikke feltet du skriver i */
  _oppdater() {
    (this._oppsum || []).forEach((o) => { const t = String(o.fn() ?? ""); if (o.el.textContent !== t) o.el.textContent = t; });
    if (!this._felter) return;
    for (const f of this._felter) {
      if (f.el === document.activeElement || (f.el.contains && f.el.contains(document.activeElement))) continue;
      const v = f.les();
      if (String(f.hent() ?? "") !== String(v ?? "")) f.sett(v);
      if (f.el.hass !== undefined) f.el.hass = this._h;
    }
  }
}
if (!customElements.get("ki-prosa-card-editor")) customElements.define("ki-prosa-card-editor", KiProsaCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-prosa-card")) window.customCards.push({ type: "ki-prosa-card", name: "KI Prosa", description: "Forsideteksten med levende piller – bygget automatisk", preview: true });

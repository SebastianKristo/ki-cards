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
 *    ikon: auto                    # auto | mdi:... | emoji | /local/bilde.png | attributt:current.icon
 *    ikon_plassering: slutt        # start | slutt
 *    små_bokstaver: true
 *    tekst: 'Ute er det {pille}.'  # {pille} er der pillen settes inn
 *    path: '#vaer'
 *  pris / effekt / lys / kalender / ringeklokke / laser / planter / bursdag: samme mønster
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
const KI_PROSA_VERSJON = "2.0.0";

/* Standardoppsettet. Hver nøkkel kan overstyres helt eller delvis i konfigurasjonen. */
const KI_PROSA_STD = {
  storrelse: "1.4em",
  vaer: { entity: "weather.forecast_home", enhet: "°", mellomrom: false, ikon: "auto", ikon_plassering: "slutt",
          små_bokstaver: true, tekst: "Ute er det {pille}.", path: "#vaer" },
  pris: { entity: "sensor.norgespris_pris_na", enhet: "kr", mellomrom: true, desimaler: 2,
          tekst: "Strømmen koster {pille}", path: "?tab=priser#strom" },
  spot: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
  effekt: { entity: "sensor.strommaler_effekt", enhet: "W", mellomrom: false, desimaler: 0,
            tekst: "og vi bruker {pille}", path: "?tab=forbruk#strom" },
  lys: { entity: "auto", ikon: "💡", tekst: "med {pille} på", path: "#lys" },
  lys_ekskluder: [],
  kalender: { entity: "sensor.alle_kalendere", ikon: "⏰", tekst: "Vi har {pille} i dag.", path: "#kalender" },
  apparater: [
    { navn: "Oppvaskmaskinen", aktiv: { entity: "input_select.oppvaskmaskin_status", state: "Vasker" },
      verdi: "sensor.oppvaskmaskin_power", enhet: "W", mellomrom: false, ikon: "🍽️", animasjon: "snurr",
      tekst: "{navn} vasker {pille} nå.", path: "#kjokken" },
    { navn: "Vaskemaskinen", aktiv: { entity: "sensor.vaskemaskin_power", over: 10 },
      verdi: "sensor.vaskegang_vaskemaskin_effekt", enhet: "W", mellomrom: false, ikon: "🧺", animasjon: "snurr",
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
  .pille .prikk { width:.42em; height:.42em; border-radius:50%; background:var(--tone,var(--green)); box-shadow:0 0 8px var(--tone,var(--green)); }
  .pille.varsel { background:var(--red); color:#fff; --tone:var(--red); animation:pr-puls 1.6s ease-in-out infinite; }
  .pille.gradient { background:var(--k-grad, linear-gradient(135deg,#ffc88a,#ee95ff)); color:rgba(70,58,64,.95); }
  .pille.glans { position:relative; overflow:hidden; }
  .pille.glans::after { content:""; position:absolute; top:0; bottom:0; width:30%; left:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); animation:pr-glans 2.8s ease-in-out infinite; pointer-events:none; }
  .snurr-ik { display:inline-block; animation:pr-snurr 2.4s linear infinite; }
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
const kiPNf = (v, d = 0) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
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
    const b = c || {};
    const k = { ...KI_PROSA_STD, ...b };
    for (const n of ["vaer", "pris", "effekt", "lys", "kalender", "ringeklokke", "laser", "planter", "bursdag"])
      k[n] = kiPFlett(KI_PROSA_STD[n], b[n]);
    /* apparater og hjemkomst: fyll ut hvert element med standardnøklene */
    const fyll = (liste, std) => (liste || []).map((x) => ({ ...std, ...x }));
    k.apparater = b.apparater === false ? [] : fyll(b.apparater || KI_PROSA_STD.apparater,
      { enhet: "W", mellomrom: false, animasjon: "snurr", tekst: "{navn} vasker {pille} nå." });
    k.hjemkomst = b.hjemkomst === false ? [] : fyll(b.hjemkomst || KI_PROSA_STD.hjemkomst,
      { ikon: "🚗", animasjon: "hopp", tekst: "{navn} kommer hjem ca. kl {pille}." });
    k.setninger = [].concat(b.setninger || [], b.ekstra || []);   /* ekstra er gammelt navn */
    this._c = k; this._bygget = false; this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 60000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  /* ------------------------------------------------------------ oppslag */
  _st(id) { return (this._h && id && this._h.states[id]) || null; }
  _val(id) { const s = this._st(id); return s ? s.state : ""; }
  _on(id) { return this._val(id) === "on"; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  _at(id, a) { const s = this._st(id); return s ? s.attributes[a] : undefined; }
  _teknisk(id) { const r = this._h.entities && this._h.entities[id]; return !!(r && (r.hidden || r.entity_category)); }
  _domene(d) { return Object.keys(this._h.states).filter((id) => id.startsWith(d + ".")); }
  _lysene() { return this._domene("light").filter((id) => !this._teknisk(id) && !Array.isArray(this._h.states[id].attributes.entity_id) && !(this._c.lys_ekskluder || []).some((g) => kiPGlob(g, id))); }
  _planteliste() { return Object.keys(this._h.states).filter((id) => { if (!id.startsWith("binary_sensor.")) return false; const a = this._h.states[id].attributes || {}; return a.integrasjon === "ki_planter" && a.type === "plante"; }).sort(); }
  _ider() {
    const c = this._c, ids = [], e = (x) => x && x.entity;
    [c.vaer, c.pris, c.effekt, c.kalender, c.ringeklokke].forEach((x) => x && ids.push(e(x)));
    ids.push(typeof c.spot === "string" ? c.spot : e(c.spot));
    if (c.lys) { const v = e(c.lys); if (v === "auto") ids.push(...this._lysene()); else if (v) ids.push(v); }
    if (c.laser) { const v = e(c.laser); if (v === "auto") ids.push(...this._domene("lock")); else if (v) ids.push(...[].concat(v)); }
    if (c.planter && e(c.planter) === "auto") ids.push(...this._planteliste());
    else if (c.planter) ids.push(...[].concat(e(c.planter) || []));
    (c.apparater || []).forEach((a) => ids.push(a.verdi, a.aktiv && (a.aktiv.entity || a.aktiv)));
    (c.hjemkomst || []).forEach((a) => ids.push(a.aktiv, a.reisetid));
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
  _nav(sti) {
    if (!sti || sti === "#") return;
    if (sti.startsWith("#") || sti.includes("#")) { const [p, h] = sti.split("#"); if (p) history.pushState(null, "", location.pathname + p); location.hash = "#" + h; }
    else { history.pushState(null, "", sti); window.dispatchEvent(new Event("location-changed")); }
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
        if (!isNaN(n) && String(v).trim() !== "" && d.tall !== false) v = kiPNf(n, d.desimaler ?? 0);
        const enhet = d.enhet !== undefined ? d.enhet : (s && s.attributes.unit_of_measurement) || "";
        tekst = (v === undefined || v === null || v === "" ? "–" : String(v)) + (enhet ? (d.mellomrom === false ? "" : " ") + enhet : "");
      }
      if (d.prefiks) tekst = d.prefiks + " " + tekst;
      if (d.suffiks) tekst = tekst + " " + d.suffiks;
      tekst = kiPEsc(tekst);
    }
    const ik = this._ikonHtml(d.ikon, d);
    const prikk = d.prikk ? `<i class="prikk" style="--tone:${kiPEsc(d.prikk)}"></i>` : "";
    const innhold = d.ikon_plassering === "slutt" ? `${prikk}${tekst}${ik ? " " + ik : ""}` : `${prikk}${ik ? ik + " " : ""}${tekst}`;
    const a = d.tjeneste ? `svc:${d.tjeneste}` : d.path ? `nav:${d.path}` : d.mer ? `more:${d.mer}` : "";
    const h = d.hold ? `svc:${d.hold}` : "";
    const klasser = ["pille", d.stil && d.stil !== "vanlig" ? d.stil : "", d.små_bokstaver ? "lav" : ""].filter(Boolean).join(" ");
    return `<span class="${klasser}" role="button" tabindex="0" data-a="${a}"` +
      (d.data ? ` data-d="${kiPEsc(JSON.stringify(d.data))}"` : "") +
      (h ? ` data-h="${h}" data-hd="${kiPEsc(JSON.stringify(d.hold_data || {}))}"` : "") +
      (d.entity ? ` data-e="${kiPEsc(d.entity)}"` : "") + `>${innhold}</span>`;
  }
  /* Setter pillen inn i setningen der {pille} står */
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
  _prisTone(c) {
    const id = typeof c.spot === "string" ? c.spot : (c.spot && c.spot.entity);
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
    if (c.vaer && this._st(c.vaer.entity)) {
      const d = { ...c.vaer };
      if (d.attributt === undefined) { const s = this._st(d.entity); if (s && s.attributes.temperature !== undefined) d.attributt = "temperature"; }
      forste.push(this._setning(c.vaer.tekst, this._pille(d)));
    }
    /* pris, effekt og lys settes sammen til én setning av de bitene som finnes */
    const bit = [];
    if (c.pris && this._tallAv(c.pris) !== null) {
      const tone = this._prisTone(c);
      bit.push(this._setning(c.pris.tekst, this._pille({ ...c.pris, prikk: tone || undefined })));
    }
    if (c.effekt) { const w = this._tallAv(c.effekt); if (w !== null && w > 0) bit.push(this._setning(c.effekt.tekst, this._pille(c.effekt))); }
    if (c.lys) {
      const v = c.lys.entity;
      const n = v === "auto" ? this._lysene().filter((id) => this._on(id)).length : this._tallAv(c.lys) || 0;
      if (v === "auto" || n) bit.push(this._setning(c.lys.tekst, this._pille(c.lys, kiPEsc(kiPFlertall(n, c.lys.entall || "lys", c.lys.flertall || "lys")))));
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
      const k = this._st(c.kalender.entity);
      if (k) {
        const i0 = new Date(); i0.setHours(0, 0, 0, 0); const i1 = i0.getTime() + 86400000;
        const n = (k.attributes.events || []).filter((e) => { const t = new Date(e.start).getTime(); return t >= i0.getTime() && t < i1; }).length;
        deler.push(this._setning(c.kalender.tekst,
          this._pille(c.kalender, n ? kiPEsc(kiPFlertall(n, "hendelse", "hendelser")) : "ingen hendelser")));
      }
    }
    /* apparater */
    (c.apparater || []).forEach((a) => {
      if (!this._aktiv(a.aktiv)) return;
      const p = this._pille({ entity: a.verdi, enhet: a.enhet, mellomrom: a.mellomrom, desimaler: a.desimaler ?? 0,
        ikon: a.ikon, animasjon: a.animasjon, ikon_plassering: a.ikon_plassering, path: a.path, mer: a.path ? undefined : a.verdi, stil: a.stil });
      deler.push(`<span class="ny">${this._setning(a.tekst, p, { navn: a.navn })}</span>`);
    });
    /* hjemkomst */
    (c.hjemkomst || []).forEach((a) => {
      if (!this._on(a.aktiv)) return;
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
    const html = `<div class="prosa" style="${c.storrelse ? `--str:${kiPEsc(c.storrelse)}` : ""}"><p>${this._deler().map((d) => `<span class="setning">${d}</span>`).join(" ")}</p></div>`;
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_PROSA_STIL}</style>${html}`; this._koble(); this._bygget = true; this._forrige = html; return; }
    if (html !== this._forrige) { this.shadowRoot.querySelector(".prosa").outerHTML = html; this._forrige = html; }
  }
}
if (!customElements.get("ki-prosa-card")) customElements.define("ki-prosa-card", KiProsaCard);

class KiProsaCardEditor extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _e(v) { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: v }, bubbles: true, composed: true })); }
  /* Skriver en delvis overstyring inn i en gren av konfigurasjonen */
  _sett(gren, felt, verdi) {
    const c = JSON.parse(JSON.stringify(this._c || {}));
    if (gren) {
      const naa = typeof c[gren] === "string" ? { entity: c[gren] } : (c[gren] && typeof c[gren] === "object" ? c[gren] : {});
      if (verdi === "" || verdi === undefined) delete naa[felt]; else naa[felt] = verdi;
      if (Object.keys(naa).length) c[gren] = naa; else delete c[gren];
    } else if (verdi === "" || verdi === undefined) delete c[felt]; else c[felt] = verdi;
    this._c = c; this._e(c); this._r();
  }
  _les(gren, felt) {
    const c = this._c || {};
    const std = gren ? KI_PROSA_STD[gren] : KI_PROSA_STD;
    if (!gren) return c[felt] !== undefined ? c[felt] : (std && std[felt]);
    if (c[gren] === false) return "";
    const b = typeof c[gren] === "string" ? { entity: c[gren] } : (c[gren] || {});
    return b[felt] !== undefined ? b[felt] : (std && typeof std === "object" ? std[felt] : undefined);
  }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._rot) {
      this._rot = document.createElement("div");
      this._rot.innerHTML = `<style>
        .gr { border:1px solid var(--divider-color,#444); border-radius:12px; padding:10px 12px; margin:0 0 10px; }
        .gr > h4 { margin:0 0 8px; font-size:14px; font-weight:600; opacity:.8; }
        .rad { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .rad > * { min-width:0; }
        .hint { font-size:12px; opacity:.6; margin:6px 0 0; }
      </style><div class="innhold"></div>`;
      this.appendChild(this._rot);
    }
    const inn = this._rot.querySelector(".innhold");
    if (this._f) { /* bare oppdater verdier ved ny hass */ }
    inn.innerHTML = "";
    const grupper = [
      ["", "Generelt", [["storrelse", "Tekststørrelse", "text"]]],
      ["vaer", "Vær", [["entity", "Entitet", "entity"], ["attributt", "Attributt", "text"], ["enhet", "Enhet", "text"],
        ["ikon", "Ikon (auto, mdi:…, emoji, /local/…, attributt:current.icon)", "text"],
        ["ikon_plassering", "Ikonplassering (start/slutt)", "text"], ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["pris", "Strømpris", [["entity", "Entitet", "entity"], ["enhet", "Enhet", "text"], ["desimaler", "Desimaler", "number"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["spot", "Spotpris (fargeprikk)", [["entity", "Entitet", "entity"]]],
      ["effekt", "Forbruk nå", [["entity", "Entitet", "entity"], ["enhet", "Enhet", "text"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["lys", "Lys", [["entity", "Entitet eller auto", "text"], ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["kalender", "Kalender", [["entity", "Entitet", "entity"], ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["ringeklokke", "Ringeklokke", [["entity", "Entitet", "entity"], ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"], ["tjeneste", "Tjeneste ved trykk", "text"]]],
      ["laser", "Låser om natta", [["entity", "Entiteter eller auto", "text"], ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"]]],
      ["planter", "Planter", [["entity", "Entitet eller auto", "text"], ["attributt", "Attributt", "text"], ["ikon", "Ikon", "text"],
        ["tekst", "Setning", "text"], ["path", "Trykk går til", "text"]]],
      ["bursdag", "Bursdag", [["vis", "Vis når på", "entity"], ["skjult", "Skjult-bryter", "entity"], ["navn", "Navn-sensor", "entity"],
        ["ikon", "Ikon", "text"], ["tekst", "Setning", "text"]]],
    ];
    for (const [gren, tittel, felter] of grupper) {
      const boks = document.createElement("div"); boks.className = "gr";
      const h = document.createElement("h4"); h.textContent = tittel; boks.appendChild(h);
      const rad = document.createElement("div"); rad.className = "rad";
      for (const [felt, etikett, type] of felter) {
        let el;
        if (type === "entity") {
          el = document.createElement("ha-entity-picker");
          el.hass = this._h; el.value = this._les(gren, felt) || ""; el.label = etikett; el.allowCustomEntity = true;
          el.addEventListener("value-changed", (e) => this._sett(gren, felt, e.detail.value));
        } else {
          el = document.createElement("ha-textfield");
          el.label = etikett; el.value = String(this._les(gren, felt) ?? "");
          if (type === "number") el.type = "number";
          el.addEventListener("change", (e) => this._sett(gren, felt, type === "number" ? Number(e.target.value) : e.target.value));
        }
        rad.appendChild(el);
      }
      boks.appendChild(rad);
      if (gren) {
        const av = document.createElement("ha-formfield"); av.label = "Skru av denne biten";
        const sw = document.createElement("ha-switch");
        sw.checked = this._c[gren] === false;
        sw.addEventListener("change", (e) => {
          const c = JSON.parse(JSON.stringify(this._c || {}));
          if (e.target.checked) c[gren] = false; else delete c[gren];
          this._c = c; this._e(c); this._r();
        });
        av.appendChild(sw); boks.appendChild(av);
      }
      inn.appendChild(boks);
    }
    const hint = document.createElement("p"); hint.className = "hint";
    hint.textContent = "Apparater, hjemkomst og egne setninger (setninger:) redigeres i YAML – se README for alle nøklene.";
    inn.appendChild(hint);
  }
}
if (!customElements.get("ki-prosa-card-editor")) customElements.define("ki-prosa-card-editor", KiProsaCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-prosa-card")) window.customCards.push({ type: "ki-prosa-card", name: "KI Prosa", description: "Forsideteksten med levende piller – bygget automatisk", preview: true });

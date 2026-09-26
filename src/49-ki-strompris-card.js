/* ki-strompris-card – strømpriser i dag og i morgen (48 timer) med Totalpris / Spotpris / Norgespris.
 * Frittstående (ingen avhengigheter). Grafen er den samme som «Strømpriser» på Hjem i kd-dashbordet:
 * fanerad for prisvisning, prisen nå (eller timen du drar over), trappekurve som går fra turkis
 * (billig) til oransje (dyrt) over terskelen, stiplet sammenligningslinje, dempede timer som er
 * passert, og pris for timen under fingeren med prikk, glorie og markert søyle.
 *
 * type: custom:ki-strompris-card
 * tittel: Strømpriser     # overskrift over kortet      vis_tittel: false  # skjul overskriften
 * tittel_storrelse: 15    # skriftstørrelse på overskriften i px
 *
 * Kilder (alt er valgfritt – kortet finner standardsensorene selv):
 * pris_total: sensor.totalpris_inkludert_grid_el_company_og_stromstotte  # «Totalpris»: raw_today/raw_tomorrow
 * spot: sensor.…            # eldre nøkkel: timesprisene (raw_today). Brukes som totalpris når pris_total mangler,
 *                           # justert med mva/paaslag eller kalibrert mot spot_naa (se under)
 * pris_spot: sensor.nordpool_kwh_no1_nok_3_10_025   # «Spotpris» (Nord Pool). Auto: første sensor.nordpool_* med raw_today
 * pris_norges: sensor.norgespris_pris_na            # «Norgespris» time for time (today/tomorrow)
 * norgespris: sensor.norgespris_total_strompris_norgespris   # Norgespris nå i kr/kWh. Uten pris_norges regnes
 *             false                                  # kurven ut fra nettleia (under) eller tegnes flat. false = ingen Norgespris-fane
 * norgespris_navn: Norgespris   # navnet på fanen
 * modus: total            # fanen som er valgt først: total | spot | norges
 * terskel: 2.0            # kr/kWh – over dette blir kurven oransje (Total og Norgespris)
 * terskel_spot: 1.2       # kr/kWh – samme for Spotpris
 * hoyde: 150              # grafens høyde i px
 * enhet: kr/kWh           # teksten bak det store tallet
 * bakgrunn: var(--gray200)   # kortflaten      maks_bredde: 100%   # f.eks. 620px for å holde innholdet samlet
 *
 * Timesprisene kan komme fra Nordpool i øre uten moms, mens tallet du faktisk betaler ligger i
 * en annen sensor i kr med avgifter. Da settes:
 *   spot_naa: sensor.min_totalpris_kr        # vises som «Nå» i Totalpris
 *   kalibrer: true                           # løfter hele kurven til samme nivå (standard når spot_naa er satt)
 * Eller regn det ut selv:
 *   mva: 25            # prosent som legges på timesprisene
 *   paaslag: 0.089     # kr/kWh som legges på etter moms (påslag, elsertifikat, nettleie …)
 * skala: 0.01        # øre → kr. Settes automatisk når enheten er øre.
 *
 * nettleie_dag: 0.45      # kr/kWh kl. 06–22 på hverdager (tall eller entitet)
 * nettleie_natt: 0.35     # kr/kWh natt, lørdag og søndag
 * nettleie_auto: true     # finn energiledd-sensorene selv når satsene ikke er satt
 * norgespris_energi: 0.50 # fast energipris; utelates den, regnes den ut fra Norgespris-sensoren nå
 * dagtimer_fra: 6   dagtimer_til: 22
 *
 * Under grafen (skjules alle med enkel: true):
 * vis_stat: false    # snitt / lavest / høyest i dag     vis_vindu: false  # billigste timer fremover
 * vindu: 3           # timer i «billigste vindu»
 * vis_spart: false   # spart i dag / i år                vis_forklaring: false  # teksten over grafen
 * spart_dag: sensor.norgespris_besparelse_dag        spart_ar: sensor.norgespris_besparelse_ar
 * effekt: sensor.strommaler_effekt                   # «… W nå» til høyre for overskriften
 *
 * Fanerada: fane_hoyde: 40   fane_tekst: 13   haptikk: false   sprett: false (glass: false)
 * Uten virkning nå (godtas fortsatt): graf_forhold, bakgrunn_glod.
 */
const KI_SP_VERSJON = "4.0.0";
const KI_SP_TIME = 3600000;
const KI_SP_ORANSJE = "oklch(0.74 0.17 55)";
const KI_SP_TURKIS = "oklch(0.78 0.13 175)";

const KI_SP_STIL = `
  :host { display:block; max-width:100%; overflow:hidden; }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .ramme { max-width:var(--maks,100%); margin-inline:auto; display:flex; flex-direction:column; gap:12px;
    color:var(--gray1000, var(--primary-text-color)); }
  .kort { position:relative; border-radius:var(--ha-card-border-radius,24px); background:var(--kort-bg, var(--gray200, var(--card-background-color)));
    color:var(--gray1000, var(--primary-text-color)); padding:16px 14px 12px; overflow:hidden; box-shadow:none;
    display:flex; flex-direction:column; gap:12px; }
  .topp { display:flex; justify-content:space-between; align-items:baseline; gap:10px; padding:0 4px; }
  .tittel { font-size:var(--tittel-str,15px); font-weight:500; }
  .effektnaa { font-size:14px; font-weight:500; color:var(--gray600, currentColor); font-variant-numeric:tabular-nums; white-space:nowrap; }

  /* Fanerada: fylt flate uten ramme, aktiv fane i --active-big med svart tekst (ki-tabs-card-formen). */
  .valg { display:flex; gap:0; padding:var(--fane-kant,4px); border-radius:999px; background:var(--gray200,#262629);
    width:100%; position:relative; }
  .valg .v { flex:1 1 0; height:var(--fane-h,32px); padding:0 6px; border-radius:999px; gap:6px;
    font-size:var(--fane-tekst,13px); font-weight:500; line-height:1; cursor:pointer; white-space:nowrap;
    display:flex; align-items:center; justify-content:center; color:var(--gray600,#8e8d89);
    transition:background .18s, color .18s; -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none; }
  .valg .v span { overflow:hidden; text-overflow:ellipsis; }
  .valg .v ha-icon { --mdc-icon-size:var(--fane-ikon,16px); flex:none; }
  .valg .v:hover { color:var(--gray1000,#f2f1ee); }
  .valg .v.aktiv { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .ramme:not(.flatt) .valg .ki-pille { background:transparent; box-shadow:none; }
  .ramme:not(.flatt) .valg .ki-pille::before { content:""; position:absolute; inset:0; border-radius:999px;
    background:var(--active-big,#ee95ff); transform:scale(var(--sx,1), var(--sy,1)); transform-origin:center;
    transition:transform .34s cubic-bezier(.2,1.35,.35,1); }
  .ramme:not(.flatt) .valg .ki-pille.land::before { animation:sp-sprett .42s cubic-bezier(.2,.9,.25,1); }
  @keyframes sp-sprett { 0% { transform:scale(1.10,.90); } 45% { transform:scale(.97,1.04); } 75% { transform:scale(1.02,.99); } 100% { transform:scale(1,1); } }

  .prisdel { display:flex; flex-direction:column; gap:14px; }
  /* Prisen nå / valgt time */
  .hode { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; padding:0 4px; }
  .hode .etikett { font-size:14px; font-weight:500; color:var(--gray600,#8e8d89); white-space:nowrap; }
  .hode .tall { font-size:30px; font-weight:300; letter-spacing:-0.025em; line-height:1; margin-top:4px;
    font-variant-numeric:tabular-nums; white-space:nowrap; }
  .hode .tall small { font-size:14px; font-weight:500; letter-spacing:0; color:var(--gray600,#8e8d89); margin-left:4px; }
  .hode .meta { font-size:14px; font-weight:500; color:var(--gray600,#8e8d89); text-align:right; max-width:58%;
    line-height:1.3; font-variant-numeric:tabular-nums; }

  /* Grafen */
  .graf { display:flex; flex-direction:column; gap:6px; }
  .forkl { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:11px; color:var(--gray600,#8e8d89); padding-left:28px; }
  .forkl .stiplet { display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
  .forkl .stiplet i { width:14px; border-top:1.5px dashed var(--gray800,#c9c7c2); opacity:.7; }
  .dager { display:flex; font-size:12px; font-weight:500; color:var(--gray600,#8e8d89); padding-left:28px; }
  .dager span { flex:1; text-align:center; }
  .rad { display:flex; gap:8px; }
  .yakse { display:flex; flex-direction:column; justify-content:space-between; width:20px; flex:none; text-align:right;
    font-size:9px; color:var(--gray600,#8e8d89); opacity:.8; font-variant-numeric:tabular-nums; }
  .yakse span { line-height:0; }
  .flate { position:relative; flex:1; touch-action:pan-y; cursor:crosshair; }
  .flate svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; display:block; }
  .band, .halo, .prikk { position:absolute; pointer-events:none; }
  .band { top:0; bottom:0; border-radius:2px; background:color-mix(in srgb, var(--gray1000,#fff) 12%, transparent); transition:left .15s; }
  .halo { width:34px; height:34px; margin:-17px; border-radius:50%; transition:left .15s, top .15s; }
  .prikk { width:12px; height:12px; margin:-6px; border-radius:50%; box-shadow:0 0 0 3px var(--kort-bg, var(--gray200,#262629)); transition:left .15s, top .15s; }
  .venter { position:absolute; top:50%; left:75%; transform:translate(-50%,-50%); font-size:12px; color:var(--gray600,#8e8d89);
    text-align:center; white-space:nowrap; pointer-events:none; }
  .xakse { position:relative; height:12px; margin-left:28px; font-size:9px; color:var(--gray600,#8e8d89); opacity:.8; font-variant-numeric:tabular-nums; }
  .xakse span { position:absolute; top:0; transform:translateX(-50%); }
  .xakse span.midnatt { color:var(--gray1000,#f2f1ee); opacity:.7; }

  /* Under grafen */
  .stat { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .stat > div { background:var(--gray100,#1c1c1f); border-radius:16px; padding:9px 12px; }
  .stat b { display:block; font-size:16px; font-weight:500; font-variant-numeric:tabular-nums; }
  .stat span { font-size:12px; font-weight:500; color:var(--gray600,#8e8d89); }
  .vindu { display:flex; align-items:center; gap:9px; font-size:14px; font-weight:400; padding:10px 12px; border-radius:16px; background:var(--gray100,#1c1c1f); }
  .vindu b { font-weight:500; }
  .vindu ha-icon { --mdc-icon-size:19px; color:${KI_SP_TURKIS}; flex:none; }
  .feil { padding:24px 10px; text-align:center; font-size:14px; color:var(--gray600,#8e8d89); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiSpEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiSpNf = (v, d = 2) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
const kiSpHh = (h) => String(h).padStart(2, "0");
const kiSpKlamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kiSpGyldig = (a) => a.filter((v) => v !== null && v !== undefined && !isNaN(v));

class KiStromprisCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._valgt = null; this._modus = null; this._gid = "sp" + Math.random().toString(36).slice(2, 8); }
  static getStubConfig() { return { norgespris: "sensor.norgespris_total_strompris_norgespris" }; }
  static getConfigElement() { return document.createElement("ki-strompris-card-editor"); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_rows: 5 }; }

  setConfig(c) {
    this._c = { tittel: "Strømpriser", norgespris: "sensor.norgespris_total_strompris_norgespris", spart_dag: "sensor.norgespris_besparelse_dag",
      spart_ar: "sensor.norgespris_besparelse_ar", effekt: "sensor.strommaler_effekt", hoyde: 150, vindu: 3,
      vis_stat: true, vis_vindu: true, vis_spart: true, vis_forklaring: true, ...(c || {}) };
    this._auto = undefined; this._autoSpot = undefined;
    this._bygget = false; this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 300000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget) { this._tegn(); return; }
    // Effektmåleren endrer seg hvert sekund. Den skal bare bytte tallet, ikke tegne grafen på nytt.
    const tunge = this._ider().filter((id) => id !== this._c.effekt);
    if (tunge.some((id) => g.states[id] !== h.states[id])) { this._tegn(); return; }
    if (this._c.effekt && g.states[this._c.effekt] !== h.states[this._c.effekt]) this._oppdaterEffekt();
  }

  _oppdaterEffekt() {
    const el = this.shadowRoot && this.shadowRoot.querySelector(".effektnaa");
    const v = this._num(this._c.effekt);
    if (!el) return;
    el.textContent = v === null ? "" : `${kiSpNf(v, 0)} W nå`;
  }

  _st(id) { return (this._h && id && typeof id === "string" && this._h.states[id]) || null; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  /* Eldre `spot`: timesprisene. Auto: første sensor med raw_today. */
  _spot() { if (this._c.spot) return this._c.spot; const h = this._h;
    return this._auto || (this._auto = Object.keys(h.states).find((id) => id.startsWith("sensor.") && Array.isArray(h.states[id].attributes.raw_today))); }
  /* Totalprisen: pris_total → spot → kd-standardsensoren → første med raw_today. `juster` sier om
     mva/påslag/kalibrering skal legges på (bare for den gamle `spot`-kilden). */
  _totalKilde() {
    const c = this._c;
    if (c.pris_total && this._st(c.pris_total)) return { id: c.pris_total, juster: false };
    if (c.spot) return { id: c.spot, juster: true };
    const std = "sensor.totalpris_inkludert_grid_el_company_og_stromstotte";
    if (this._st(std)) return { id: std, juster: false };
    return { id: this._spot(), juster: true };
  }
  _spotKilde() {
    const c = this._c;
    if (c.pris_spot === false) return null;
    if (c.pris_spot) return c.pris_spot;
    if (this._autoSpot === undefined) {
      const h = this._h, tot = this._totalKilde().id;
      this._autoSpot = Object.keys(h.states).find((id) => /^sensor\.nordpool/.test(id) && id !== tot && Array.isArray(h.states[id].attributes.raw_today)) || null;
    }
    return this._autoSpot;
  }
  _norgesKilde() {
    const c = this._c;
    if (c.pris_norges) return c.pris_norges;
    if (c.norgespris === false || c.norgespris === null || c.norgespris === "") return null;
    return this._st("sensor.norgespris_pris_na") ? "sensor.norgespris_pris_na" : null;
  }
  _ider() { const c = this._c; return [this._totalKilde().id, this._spotKilde(), this._norgesKilde(), c.spot_naa, c.norgespris, c.spart_dag, c.spart_ar, c.effekt]
    .filter((x) => typeof x === "string" && x); }
  _skala(id) {
    const s = this._st(id || this._spot());
    if (this._c.skala !== undefined && (!id || id === this._spot())) return this._c.skala;
    const a = (s && s.attributes) || {};
    return a.price_in_cents === true || /øre|öre|\bore\b|cent/i.test(a.unit_of_measurement || "") ? 0.01 : 1;
  }

  /* Rådata for en dag. Tåler raw_today/raw_tomorrow (Nordpool), today/tomorrow (tallister eller
     objektlister, f.eks. Norgespris) og prices_today/prices_tomorrow fra andre integrasjoner. */
  _raa(dag, id) {
    const s = this._st(id || this._spot()); if (!s) return null;
    const a = s.attributes, morgen = dag === "i_morgen";
    const tall = morgen ? a.tomorrow : a.today;
    let objekt = morgen ? (a.raw_tomorrow || a.prices_tomorrow || a.tomorrow_raw) : (a.raw_today || a.prices_today || a.today_raw);
    if (!Array.isArray(objekt) && Array.isArray(tall) && tall.length && tall[0] && typeof tall[0] === "object") objekt = tall;
    if (Array.isArray(objekt) && objekt.length && typeof objekt[0] === "object") {
      return objekt.map((p) => {
        const start = p.start || p.startsAt || p.time || p.hour;
        const slutt = p.end || p.endsAt;
        const verdi = p.value !== undefined ? p.value : (p.price !== undefined ? p.price : p.total);
        const t = new Date(start).getTime();
        return { t, slutt: slutt ? new Date(slutt).getTime() : t + KI_SP_TIME, v: verdi === null || verdi === undefined ? null : Number(verdi) };
      });
    }
    if (Array.isArray(tall) && tall.length && typeof tall[0] !== "object") {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      if (morgen) d.setDate(d.getDate() + 1);
      const steg = KI_SP_TIME * (24 / tall.length);
      return tall.map((v, i) => ({ t: d.getTime() + i * steg, slutt: d.getTime() + (i + 1) * steg, v: v === null || v === undefined ? null : Number(v) }));
    }
    return null;
  }

  /* Timesprisen slik den skal vises: rå verdi × skala, deretter moms og påslag –
     eller kalibrert mot «spot_naa» slik at kurven lander på samme nivå som tallet du betaler. */
  _justering(id) {
    const c = this._c;
    if (c.mva !== undefined || c.paaslag !== undefined)
      return { faktor: 1 + (Number(c.mva) || 0) / 100, ledd: Number(c.paaslag) || 0 };
    const naa = this._num(c.spot_naa);
    if (c.spot_naa && naa !== null && c.kalibrer !== false) {
      const raa = this._raa("i_dag", id);
      if (Array.isArray(raa) && raa.length) {
        const n = Date.now();
        const time = raa.find((p) => p.t <= n && n < p.slutt);
        const grunn = time && time.v !== null ? time.v * this._skala(id) : null;
        if (grunn && Math.abs(grunn) > 0.0001) return { faktor: naa / grunn, ledd: 0 };
      }
    }
    return { faktor: 1, ledd: 0 };
  }

  /* 48 timer (i dag 0–23, i morgen 24–47) i kr/kWh. Kvarterpriser blir timesnitt. */
  _serie(id, juster) {
    if (!id || !this._st(id)) return null;
    const k = this._skala(id), j = juster ? this._justering(id) : { faktor: 1, ledd: 0 };
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const sum = Array.from({ length: 48 }, () => [0, 0]);
    let noe = false;
    for (const dag of ["i_dag", "i_morgen"]) {
      for (const p of this._raa(dag, id) || []) {
        if (p.v === null || isNaN(p.v) || isNaN(p.t)) continue;
        const d = new Date(p.t);
        const dagNr = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - d0) / 86400000);
        if (dagNr < 0 || dagNr > 1) continue;
        const i = dagNr * 24 + d.getHours();
        sum[i][0] += p.v * k * j.faktor + j.ledd; sum[i][1]++; noe = true;
      }
    }
    return noe ? sum.map(([s, n]) => (n ? s / n : null)) : null;
  }

  _np() {
    const n = this._c.norgespris;
    if (n === false || n === null || n === "") return null;      /* uten Norgespris: ingen Norgespris-fane */
    const v = this._num(n);
    return v === null && typeof n === "number" ? n : v;
  }

  /* Norgespris = fast energipris + nettleie. Nettleia er lavere om natta og i helga,
     så med dag-/nattsats kan morgendagens pris regnes ut selv før spotprisen kommer. */
  _sats(fast, entitet, moenster) {
    if (fast !== undefined && fast !== null && fast !== "") {
      const n = Number(fast);
      if (!isNaN(n)) return n;
      const v = this._num(String(fast));       // kan være en entitets-id
      if (v !== null) return v;
    }
    if (entitet) { const v = this._num(entitet); if (v !== null) return v; }
    if (this._c.nettleie_auto === false || !this._h) return null;
    const nokkel = "auto_" + moenster;
    if (this[nokkel] === undefined) {
      this[nokkel] = Object.keys(this._h.states).find((x) =>
        x.startsWith("sensor.") && new RegExp(moenster).test(x)) || null;
    }
    return this[nokkel] ? this._num(this[nokkel]) : null;
  }

  _nettleie(t) {
    const c = this._c;
    const dag = this._sats(c.nettleie_dag, c.nettleie_dag_entitet, "energiledd_dag");
    const natt = this._sats(c.nettleie_natt, c.nettleie_natt_entitet, "energiledd_natt");
    if (dag === undefined || dag === null) return null;
    const d = new Date(t), time = d.getHours(), ukedag = d.getDay();
    const helg = ukedag === 0 || ukedag === 6;
    const fra = c.dagtimer_fra === undefined ? 6 : c.dagtimer_fra;
    const til = c.dagtimer_til === undefined ? 22 : c.dagtimer_til;
    const erDag = !helg && time >= fra && time < til;
    return Number(erDag ? dag : (natt === undefined || natt === null ? dag : natt));
  }

  /* Energidelen: enten oppgitt, ellers utledet fra Norgespris-sensoren nå minus nettleia nå. */
  _energi() {
    const c = this._c;
    if (c.norgespris_energi !== undefined && c.norgespris_energi !== null) return Number(c.norgespris_energi);
    const naa = this._np(), nl = this._nettleie(Date.now());
    return naa !== null && nl !== null ? naa - nl : null;
  }

  _npTime(t) {
    const e = this._energi(), nl = this._nettleie(t);
    if (e === null || nl === null) return null;
    return e + nl;
  }

  /* Norgespris time for time: egen sensor → utregnet fra nettleia → flat strek på prisen nå. */
  _norgesSerie() {
    const fra = this._serie(this._norgesKilde(), false);
    if (fra) return fra;
    const np = this._np();
    if (np === null) return null;
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    return Array.from({ length: 48 }, (_, i) => { const v = this._npTime(d0.getTime() + i * KI_SP_TIME); return v === null ? np : v; });
  }

  /* Alt grafen trenger, regnet ut én gang per tegning. */
  _modell() {
    const c = this._c;
    const tk = this._totalKilde();
    const ser = { total: this._serie(tk.id, tk.juster), spot: this._serie(this._spotKilde(), false), norges: this._norgesSerie() };
    const nn = c.norgespris_navn || "Norgespris";
    const MODI = [["total", "Totalpris", "mdi:receipt-text-outline"], ["spot", "Spotpris", "mdi:chart-line"], ["norges", nn, "mdi:check-decagram-outline"]]
      .filter(([k], i) => i === 0 || ser[k]);
    const onsket = this._modus || c.modus;
    const modus = MODI.some((m) => m[0] === onsket) ? onsket : "total";
    const tom = Array(48).fill(null);
    const tot = ser.total || tom, spot = ser.spot || tom, norges = ser.norges || tom;
    const alle = modus === "spot" ? spot : modus === "norges" ? norges : tot;
    return { ser, MODI, modus, tot, spot, norges, alle, nn, kilde: tk };
  }

  /* Hode + graf. Tegnes på nytt ved dra, men da byttes bare tekst og posisjoner (se _oppdaterGraf). */
  _prisdel(m) {
    const c = this._c, H = kiSpKlamp(Number(c.hoyde) || 150, 80, 400);
    const NOW_H = new Date().getHours();
    const { modus, tot, spot, norges, alle } = m;
    const nf = (v) => kiSpNf(v, 2);
    const enhet = c.enhet || "kr/kWh";

    /* Skala i øre, som på Hjem: rund opp til nærmeste 100 og legg på 100 for luft. */
    const ref = kiSpGyldig(modus === "norges" ? tot.concat(norges) : alle).map((v) => v * 100);
    const top = Math.ceil(Math.max(0, ...ref) / 100) * 100 + 100;
    const bunn = Math.min(0, Math.floor(Math.min(0, ...ref) / 50) * 50);
    const Y = (v) => H - ((v * 100 - bunn) / (top - bunn)) * H, X = (i) => i * 10;
    const trapp = (arr) => { let d = "", penn = false; arr.forEach((v, i) => { if (v === null || v === undefined) { penn = false; return; }
      const y = Y(v).toFixed(1); d += (penn ? `L${X(i)},${y}` : `M${X(i)},${y}`) + `L${X(i + 1)},${y}`; penn = true; }); return d || `M0,${H}`; };
    const flate = (arr) => { let d = "", start = null; const ut = []; const b = Y(Math.max(0, bunn / 100)).toFixed(1);
      arr.forEach((v, i) => { if (v === null || v === undefined) { if (start !== null) { ut.push(d + `L${X(i)},${b}L${X(start)},${b}Z`); d = ""; start = null; } return; }
        const y = Y(v).toFixed(1); if (start === null) { start = i; d = `M${X(i)},${y}`; } else d += `L${X(i)},${y}`; d += `L${X(i + 1)},${y}`; });
      if (start !== null) ut.push(d + `L${X(arr.length)},${b}L${X(start)},${b}Z`); return ut.join("") || `M0,${H}`; };
    const terskel = Number(modus === "spot" ? (c.terskel_spot ?? 1.2) : (c.terskel ?? 2.0));
    const thrA = kiSpKlamp((Y(terskel) - 8) / H, 0, 1), thrB = kiSpKlamp((Y(terskel) + 8) / H, 0, 1);
    let sel = this._valgt ?? NOW_H; if (alle[sel] === null || alle[sel] === undefined) sel = NOW_H;
    const selV = alle[sel];
    const dyr = selV !== null && selV !== undefined && selV > terskel;
    const synlig = selV !== null && selV !== undefined;
    const selTop = ((synlig ? Y(selV) : H) / H) * 100;
    const venstre = ((sel + 0.5) / 48) * 100;

    /* Hodet */
    const slot = (i) => `${i >= 24 ? "I morgen" : "I dag"} kl. ${kiSpHh(i % 24)}–${kiSpHh((i + 1) % 24)}`;
    let hode;
    if (modus !== "total") {
      const i = sel;
      const tmrSpot = kiSpGyldig(spot.slice(24));
      let meta = "";
      if (modus === "norges") {
        const par = tot.slice(NOW_H).map((v, k) => [v, norges[NOW_H + k]]).filter(([a, b]) => a !== null && b !== null);
        const snitt = par.length ? par.reduce((s, [a, b]) => s + (a - b), 0) / par.length : null;
        if (snitt !== null) meta = `${snitt >= 0 ? "Sparer" : "Taper"} ca. ${nf(Math.abs(snitt))} kr/kWh mot spot`;
      } else if (tmrSpot.length) meta = `Snitt i morgen ${nf(tmrSpot.reduce((x, y) => x + y, 0) / tmrSpot.length)} kr`;
      hode = { label: this._valgt !== null ? slot(i) : modus === "spot" ? "Spot nå" : `${m.nn} nå`, v: alle[i] !== null ? nf(alle[i]) : "–", meta };
    } else if (this._valgt !== null) {
      const i = this._valgt;
      hode = { label: slot(i), v: tot[i] !== null ? nf(tot[i]) : "–",
        meta: m.ser.norges && norges[i] !== null ? `${m.nn} ${nf(norges[i])} kr` : i < NOW_H ? "Tidligere i dag" : "" };
    } else {
      let fut = tot.map((p, h) => [p, h]).filter(([p, h]) => p !== null && h > NOW_H && h < 24);
      if (!fut.length) fut = tot.map((p, h) => [p, h]).filter(([p, h]) => p !== null && h > NOW_H);
      const billig = fut.length ? fut.reduce((a, x) => (x[0] < a[0] ? x : a)) : null;
      const egen = this._num(c.spot_naa);
      const naa = egen !== null ? egen : tot[NOW_H];
      hode = { label: "Nå", v: naa !== null && naa !== undefined ? nf(naa) : "–", meta: billig ? `Billigst kl. ${kiSpHh(billig[1] % 24)} · ${nf(billig[0])} kr` : "" };
    }

    /* Forklaringen over grafen */
    const spotSt = this._st(this._spotKilde()), spotId = String(this._spotKilde() || "");
    const mm = spotId.match(/nordpool_kwh_([a-z]{2}\d?)_([a-z]{3})(?:_\d+_\d+_(\d+))?/i);
    const region = String((spotSt && spotSt.attributes.region) || (mm && mm[1]) || "").toUpperCase();
    const spotMva = mm && mm[3] !== undefined ? /[1-9]/.test(mm[3]) : null;
    const tekst = modus === "spot" ? `Nord Pool${region ? " " + region : ""} · øre/kWh${spotMva === null ? "" : spotMva ? " inkl. mva" : " eks. mva"}`
      : modus === "norges" ? `${c.norgespris_tekst || m.nn} · øre/kWh` : (c.tekst_total || "Totalpris inkl. mva, påslag og nettleie · øre");
    const forkl = c.vis_forklaring !== false ? `<div class="forkl"><span>${kiSpEsc(tekst)}</span>${modus === "norges" && m.ser.total
      ? `<span class="stiplet"><i></i>Spot totalpris</span>` : ""}</div>` : "";

    const yl = Array.from({ length: 5 }, (_, i) => Math.round(top - (i * (top - bunn)) / 4));
    const grid = Array.from({ length: 5 }, (_, i) => (i * H) / 4);
    const timer = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44];
    const imorgenTom = !kiSpGyldig(alle.slice(24)).length;
    const g = this._gid;
    const bg = "var(--kort-bg, var(--gray200, #262629))";

    return `<div class="hode">
        <div><div class="etikett">${kiSpEsc(hode.label)}</div><div class="tall">${kiSpEsc(hode.v)}<small>${kiSpEsc(enhet)}</small></div></div>
        <div class="meta">${kiSpEsc(hode.meta)}</div></div>
      <div class="graf">${forkl}
        <div class="dager"><span>I dag</span><span>I morgen</span></div>
        <div class="rad">
          <div class="yakse" style="height:${H}px">${yl.map((y) => `<span>${y}</span>`).join("")}</div>
          <div class="flate" style="height:${H}px">
            <svg viewBox="0 0 480 ${H}" preserveAspectRatio="none" aria-label="Strømpris time for time">
              <defs>
                <linearGradient id="${g}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">
                  <stop offset="0" stop-color="${KI_SP_ORANSJE}"/><stop offset="${thrA}" stop-color="${KI_SP_ORANSJE}"/>
                  <stop offset="${thrB}" stop-color="${KI_SP_TURKIS}"/><stop offset="1" stop-color="${KI_SP_TURKIS}"/></linearGradient>
                <linearGradient id="${g}-f" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">
                  <stop offset="0" stop-color="${KI_SP_ORANSJE}" stop-opacity=".28"/><stop offset="${thrA}" stop-color="${KI_SP_ORANSJE}" stop-opacity=".12"/>
                  <stop offset="${thrB}" stop-color="${KI_SP_TURKIS}" stop-opacity=".14"/><stop offset="1" stop-color="${KI_SP_TURKIS}" stop-opacity="0"/></linearGradient>
              </defs>
              ${grid.map((y) => `<line x1="0" x2="480" y1="${y}" y2="${y}" stroke="var(--gray1000,#fff)" stroke-opacity=".07" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join("")}
              <line x1="240" x2="240" y1="0" y2="${H}" stroke="var(--gray1000,#fff)" stroke-opacity=".22" stroke-width="1" vector-effect="non-scaling-stroke"/>
              <path d="${flate(alle)}" fill="url(#${g}-f)"/>
              ${modus === "norges" && m.ser.total ? `<path d="${trapp(tot)}" fill="none" stroke="var(--gray1000,#fff)" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` : ""}
              <path d="${trapp(alle)}" fill="none" stroke="url(#${g}-s)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
              <rect x="0" y="0" width="${NOW_H * 10}" height="${H}" style="fill:${bg}" opacity=".5"/>
            </svg>
            ${imorgenTom ? `<div class="venter">Kommer ca. kl. 13</div>` : ""}
            <span class="band" style="left:${((sel / 48) * 100).toFixed(3)}%;width:${(100 / 48).toFixed(3)}%"></span>
            <span class="halo" style="left:${venstre.toFixed(3)}%;top:${selTop.toFixed(2)}%;background:color-mix(in oklch, ${dyr ? KI_SP_ORANSJE : KI_SP_TURKIS} 30%, transparent);display:${synlig ? "block" : "none"}"></span>
            <span class="prikk" style="left:${venstre.toFixed(3)}%;top:${selTop.toFixed(2)}%;background:${dyr ? KI_SP_ORANSJE : KI_SP_TURKIS};display:${synlig ? "block" : "none"}"></span>
          </div>
        </div>
        <div class="xakse">${timer.map((h) => `<span class="${h === 24 ? "midnatt" : ""}" style="left:${((h / 48) * 100).toFixed(3)}%">${kiSpHh(h % 24)}</span>`).join("")}</div>
      </div>`;
  }

  /* Leser timen under fingeren. Berøring: begynn først å lese av når fingeren drar sidelengs,
     ellers er det en vanlig loddrett scroll og kortet skal ikke reagere i det hele tatt. */
  _skrubb() {
    const g = this.shadowRoot.querySelector(".flate"); if (!g || g._k) return; g._k = 1;
    const finn = (e) => { const b = g.getBoundingClientRect(); if (!b.width) return;
      const i = kiSpKlamp(Math.floor(((e.clientX - b.left) / b.width) * 48), 0, 47);
      if (i !== this._valgt) { this._valgt = i; this._oppdaterGraf(); } };
    const slutt = () => { if (this._valgt !== null) { this._valgt = null; this._oppdaterGraf(); } };
    let start = null, aktiv = false, tid = null;
    g.addEventListener("pointerdown", (e) => {
      clearTimeout(tid);
      if (e.pointerType === "mouse") { aktiv = true; finn(e); return; }
      start = { x: e.clientX, y: e.clientY }; aktiv = false;
    });
    g.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") { finn(e); return; }
      if (!start) return;
      if (!aktiv) {
        const dx = Math.abs(e.clientX - start.x), dy = Math.abs(e.clientY - start.y);
        if (dy > dx || dx < 10) { if (dy > 10) start = null; return; }
        aktiv = true;
        try { g.setPointerCapture(e.pointerId); } catch (_) {}
      }
      finn(e);
    });
    g.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") slutt(); });
    g.addEventListener("pointercancel", () => { aktiv = false; start = null; slutt(); });
    g.addEventListener("pointerup", (e) => { const var_ = aktiv; aktiv = false; start = null;
      if (e.pointerType !== "mouse") { if (var_) tid = setTimeout(slutt, 2500); else { const b = g.getBoundingClientRect(); if (b.width) { finn(e); tid = setTimeout(slutt, 2500); } } } });
  }

  /* Bare hodet og markøren oppdateres når man drar langs grafen – resten står stille,
     og prikken glir (overgangen på left/top) i stedet for å hoppe. */
  _oppdaterGraf() {
    const r = this.shadowRoot, del = r.querySelector(".prisdel");
    if (!del || !this._m) { this._tegn(); return; }
    const tmp = document.createElement("div");
    tmp.innerHTML = this._prisdel(this._m);
    const hode = del.querySelector(".hode"), nyHode = tmp.querySelector(".hode");
    if (hode && nyHode) hode.innerHTML = nyHode.innerHTML;
    for (const s of [".band", ".halo", ".prikk"]) {
      const a = del.querySelector(s), b = tmp.querySelector(s);
      if (a && b) a.setAttribute("style", b.getAttribute("style"));
    }
  }

  _innhold() {
    const c = this._c;
    const m = this._m = this._modell();
    const effekt = this._num(c.effekt), sparDag = this._num(c.spart_dag), sparAr = this._num(c.spart_ar);

    /* Fanerada. `fane_hoyde` er hele rada, kanten trekkes fra så pilla blir riktig,
       og skriften skaleres med mindre `fane_tekst` er satt. */
    const fhRa = Math.max(24, Number(c.fane_hoyde) || 40);
    const fhKant = fhRa < 34 ? 3 : 4;
    const fhPille = Math.max(16, fhRa - fhKant * 2);
    const fhTekst = Number(c.fane_tekst) || Math.max(11, Math.min(15, Math.round(fhPille * 0.42)));
    const fhStil = `--fane-kant:${fhKant}px;--fane-h:${fhPille}px;--fane-tekst:${fhTekst}px;--fane-ikon:${Math.round(fhTekst * 1.25)}px`;
    const valg = m.MODI.length > 1 ? `<div class="valg" style="${fhStil}">${m.MODI.map(([k, navn, ikon]) =>
      `<span class="v ${m.modus === k ? "aktiv" : ""}" data-m="${k}" role="button" tabindex="0"><ha-icon icon="${ikon}"></ha-icon><span>${kiSpEsc(navn)}</span></span>`).join("")}</div>` : "";

    const topp = c.vis_tittel === false ? "" : `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span>${
      effekt !== null ? `<span class="effektnaa">${kiSpNf(effekt, 0)} W nå</span>` : ""}</div>`;
    const kortStil = c.bakgrunn ? `--kort-bg:${kiSpEsc(c.bakgrunn)}` : "";

    if (!m.ser.total && !m.ser.spot && !m.ser.norges) {
      return `${topp}<div class="kort" style="${kortStil}"><div class="feil">Fant ingen prissensor. Sett <b>pris_total:</b> (eller <b>spot:</b>) i kortet.</div></div>`;
    }

    /* Under grafen: snitt / lavest / høyest i dag, billigste vindu fremover og spart. */
    let under = "";
    if (!c.enkel) {
      const NOW_H = new Date().getHours();
      const idag = kiSpGyldig(m.alle.slice(0, 24));
      if (c.vis_stat !== false && idag.length) {
        const snitt = idag.reduce((a, b) => a + b, 0) / idag.length;
        under += `<div class="stat"><div><b>${kiSpNf(snitt)}</b><span>snitt i dag</span></div>
          <div><b style="color:${KI_SP_TURKIS}">${kiSpNf(Math.min(...idag))}</b><span>lavest</span></div>
          <div><b style="color:${KI_SP_ORANSJE}">${kiSpNf(Math.max(...idag))}</b><span>høyest</span></div></div>`;
      }
      const n = Math.max(1, Number(c.vindu) || 3);
      if (c.vis_vindu !== false) {
        let best = -1, bestSum = Infinity;
        for (let i = NOW_H; i + n <= 48; i++) {
          const bit = m.alle.slice(i, i + n); if (bit.some((v) => v === null || v === undefined)) continue;
          const s = bit.reduce((a, b) => a + b, 0); if (s < bestSum) { bestSum = s; best = i; }
        }
        if (best >= 0) under += `<div class="vindu"><ha-icon icon="mdi:clock-check-outline"></ha-icon><span>Billigste ${n} timer: <b>${best >= 24 ? "i morgen " : ""}kl. ${kiSpHh(best % 24)}–${kiSpHh((best + n) % 24)}</b> · snitt ${kiSpNf(bestSum / n)} kr</span></div>`;
      }
      if (c.vis_spart !== false && (sparDag !== null || sparAr !== null)) {
        under += `<div class="stat" style="grid-template-columns:repeat(${[sparDag, sparAr].filter((x) => x !== null).length},minmax(0,1fr))">
          ${sparDag !== null ? `<div><b style="color:${KI_SP_TURKIS}">${kiSpNf(sparDag, 0)} kr</b><span>spart i dag</span></div>` : ""}
          ${sparAr !== null ? `<div><b style="color:${KI_SP_TURKIS}">${kiSpNf(sparAr, 0)} kr</b><span>spart i år</span></div>` : ""}</div>`;
      }
    }

    return `${topp}${valg}<div class="kort" style="${kortStil}"><div class="prisdel">${this._prisdel(m)}</div>${under}</div>`;
  }

  /* Haptikk: HA-appen lytter på haptic-eventet, en nettleser på Android tar vibrasjonen. */
  _haptikk(type) {
    const h = this._c && this._c.haptikk;
    if (h === false) return;
    const t = typeof h === "string" ? h : (type || "selection");
    try {
      window.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true }));
    } catch (e) { /* eldre nettlesere: la det stå */ }
    const ms = { selection: 5, light: 8, medium: 14, heavy: 22, success: 12, warning: 20, failure: 30 }[t] || 8;
    if (typeof navigator !== "undefined" && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* blokkert uten interaksjon */ } }
  }

  /* Av-bryteren. `sprett: false` er navnet nå; `glass: false` godtas fortsatt. */
  _stille() { const c = this._c || {}; return c.sprett === false || c.glass === false; }

  /* Klem og strekk. Settes som variabler på pilla, leses av ::before. */
  _klem(sx, sy) {
    if (this._stille()) return;
    const p = this.shadowRoot.querySelector(".valg .ki-pille");
    if (!p) return;
    p.style.setProperty("--sx", sx);
    p.style.setProperty("--sy", sy);
  }

  _sprett() {
    if (this._stille()) return;
    const p = this.shadowRoot.querySelector(".valg .ki-pille");
    if (!p) return;
    p.style.removeProperty("--sx");
    p.style.removeProperty("--sy");
    p.classList.remove("land");
    void p.offsetWidth;
    p.classList.add("land");
  }

  /* Variabler som skal gjelde hele kortet. */
  _ramStil() {
    const c = this._c || {}, t = Number(c.tittel_storrelse), ut = [];
    if (t) ut.push(`--tittel-str:${Math.max(10, Math.min(40, t))}px`);
    if (c.maks_bredde) ut.push(`--maks:${kiSpEsc(c.maks_bredde)}`);
    if (c.bakgrunn) ut.push(`--kort-bg:${kiSpEsc(c.bakgrunn)}`);
    return ut.join(";");
  }

  _koble() {
    const r = this.shadowRoot;
    const bytt = (e) => { const el = e.composedPath().find((x) => x.dataset && x.dataset.m); if (!el) return;
      const m = this._m ? this._m.modus : null;
      if (el.dataset.m === m) return;
      this._haptikk("selection");
      this._modus = el.dataset.m; this._valgt = null; this._tegn(); this._sprett(); };
    r.addEventListener("click", bytt);
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bytt(e); } });

    /* Trykk og dra kjennes på pilla (klem ned, strekk under dra, sprett ved landing). */
    let nedX = null;
    r.addEventListener("pointerdown", (e) => {
      if (!e.composedPath().some((x) => x.dataset && x.dataset.m)) return;
      nedX = e.clientX;
      this._klem(0.94, 0.86);
    }, { passive: true });
    r.addEventListener("pointermove", (e) => {
      if (nedX === null) return;
      const s2 = Math.min(0.13, Math.abs(e.clientX - nedX) / 420);
      this._klem(1 + s2, 1 - s2 * 0.7);
    }, { passive: true });
    const slipp = () => { if (nedX === null) return; nedX = null; this._klem(1, 1); };
    r.addEventListener("pointerup", slipp, { passive: true });
    r.addEventListener("pointercancel", slipp, { passive: true });
  }

  /* Glidende pille og dra på fanerada, som i faneradene ellers. MÅ kalles etter hver
     tegning: .ramme byttes ut i sin helhet, så rada er en ny node. Slås opp på window,
     siden kortet også skal virke alene fra /local/ uten KI. */
  _pille() {
    const ki = (typeof window !== "undefined" && window.KI) || null;
    if (ki && ki.pillefaner && this.shadowRoot.querySelector(".valg")) {
      ki.pillefaner(this, { rad: ".valg", knapp: ".valg .v", aktiv: "aktiv", av: false });
    }
  }
  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    let html;
    try {
      html = `<div class="ramme${this._stille() ? " flatt" : ""}" style="${this._ramStil()}">${this._innhold()}</div>`;
    } catch (e) {
      // Et blankt kort sier ingenting om hva som er galt. Vis feilen i stedet.
      console.error("ki-strompris-card:", e);
      this.shadowRoot.innerHTML = `<style>${KI_SP_STIL}</style>
        <div class="ramme"><div class="kort"><div class="feil">
          Kortet feilet: ${kiSpEsc(e && e.message ? e.message : String(e))}
        </div></div></div>`;
      this._bygget = false; this._forrige = null;
      return;
    }
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_SP_STIL}</style>${html}`; this._koble(); this._bygget = true; this._forrige = html; this._pille(); }
    else if (html !== this._forrige) {
      const t = document.createElement("template"); t.innerHTML = html;
      this.shadowRoot.querySelector(".ramme").replaceWith(t.content);
      this._forrige = html;
      this._pille();
    }
    this._skrubb();
  }
}
if (!customElements.get("ki-strompris-card")) customElements.define("ki-strompris-card", KiStromprisCard);

class KiStromprisCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { pris_total: "Totalpris (raw_today / raw_tomorrow)", pris_spot: "Spotpris (Nord Pool)", pris_norges: "Norgespris time for time (today / tomorrow)",
        norgespris: "Norgespris nå (tom = ingen Norgespris-fane)", norgespris_navn: "Navn på Norgespris-fanen",
        modus: "Fanen som vises først", terskel: "Terskel for dyr time (kr/kWh)", terskel_spot: "Terskel for dyr spotpris (kr/kWh)",
        enhet: "Enhet bak tallet", bakgrunn: "Bakgrunnsfarge (f.eks. var(--gray100) eller #1e1e24)", maks_bredde: "Maks bredde på innholdet", spot: "Timespriser (eldre: raw_today)",
        spot_naa: "Pris nå i kr (med avgifter)", mva: "Moms på timesprisene (%)", paaslag: "Påslag (kr/kWh)", spart_dag: "Spart i dag", spart_ar: "Spart i år", effekt: "Effekt nå", tittel: "Tittel", tittel_storrelse: "Skriftstørrelse på tittelen (px)", vindu: "Timer i billigste vindu", hoyde: "Grafhøyde (px)",
        vis_tittel: "Vis tittel", enkel: "Bare faner og graf",
        fane_hoyde: "Høyde på fanerada (px)", fane_tekst: "Skriftstørrelse i fanene (px, tom = følger høyden)",
        haptikk: "Vibrasjon ved fanebytte", sprett: "Sprett i pilla ved trykk og dra",
        vis_stat: "Vis snitt / lavest / høyest", vis_vindu: "Vis billigste timer", vis_spart: "Vis spart i dag / i år", vis_forklaring: "Vis forklaring over grafen",
        nettleie_dag: "Nettleie dag (kr/kWh, kl. 06–22 hverdag)", nettleie_natt: "Nettleie natt og helg (kr/kWh)", norgespris_energi: "Fast energipris (kr/kWh, valgfri)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h;
    this._f.data = { vis_tittel: true, vis_stat: true, vis_vindu: true, vis_spart: true, vis_forklaring: true, haptikk: true, sprett: true, ...this._c };
    const sensor = (name) => ({ name, selector: { entity: { domain: "sensor" } } });
    const tall = (name, o) => ({ name, selector: { number: { mode: "box", ...o } } });
    const bryter = (name) => ({ name, selector: { boolean: {} } });
    const tekst = (name) => ({ name, selector: { text: {} } });
    this._f.schema = [sensor("pris_total"), sensor("pris_spot"), sensor("pris_norges"), sensor("norgespris"), tekst("norgespris_navn"),
      { name: "modus", selector: { select: { mode: "dropdown", options: [{ value: "total", label: "Totalpris" }, { value: "spot", label: "Spotpris" }, { value: "norges", label: "Norgespris" }] } } },
      tall("terskel", { min: 0, max: 10, step: 0.05 }), tall("terskel_spot", { min: 0, max: 10, step: 0.05 }),
      tekst("tittel"), tall("tittel_storrelse", { min: 10, max: 40 }), bryter("vis_tittel"), bryter("enkel"),
      tekst("enhet"), tekst("bakgrunn"), tekst("maks_bredde"), tall("hoyde", { min: 80, max: 400 }),
      sensor("spot"), sensor("spot_naa"), tall("mva", { min: 0, max: 100, step: "any" }), tall("paaslag", { step: "any" }),
      sensor("spart_dag"), sensor("spart_ar"), sensor("effekt"), tall("vindu", { min: 1, max: 8 }),
      tall("fane_hoyde", { min: 24, max: 72 }), tall("fane_tekst", { min: 10, max: 22 }), bryter("haptikk"), bryter("sprett"),
      bryter("vis_stat"), bryter("vis_vindu"), bryter("vis_spart"), bryter("vis_forklaring"),
      tall("nettleie_dag", { min: 0, max: 3, step: 0.01 }), tall("nettleie_natt", { min: 0, max: 3, step: 0.01 }), tall("norgespris_energi", { min: 0, max: 3, step: 0.01 })];
  }
}
if (!customElements.get("ki-strompris-card-editor")) customElements.define("ki-strompris-card-editor", KiStromprisCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-strompris-card")) window.customCards.push({ type: "ki-strompris-card", name: "KI Strømpris", description: "Strømpriser i dag og i morgen – totalpris, spotpris og Norgespris med graf du kan dra over", preview: true });
console.info(`%c KI-STROMPRIS-CARD %c v${KI_SP_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

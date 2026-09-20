/* ki-strompris-card – strømpris i dag / i morgen med Norgespris. Frittstående (ingen avhengigheter).
 * Legg filen i /config/www/ og legg til ressursen /local/ki-strompris-card.js (JavaScript-modul).
 *
 * type: custom:ki-strompris-card
 * vis_tittel: false       # tittelrad over kortet (av som standard – dagvelgeren står i kortet)
 * norgespris: sensor.norgespris_total_strompris_norgespris   # det du faktisk betaler, i kr/kWh
 *             false                                  # uten Norgespris vises spotprisen i kr i stedet
 * enhet: kr/kWh                                      # teksten bak det store tallet
 * bakgrunn: var(--gray200)                           # bakgrunnsfarge på kortet
 * maks_bredde: 100%                                  # sett f.eks. 620px for å holde innholdet samlet
 * graf_forhold: 2.6                                  # bredde delt på høyde – lavere gir høyere graf
 * bakgrunn_glod: false                               # slår av det fargede skjæret øverst
 *
 * Timesprisene kan komme fra Nordpool i øre uten moms, mens tallet du faktisk betaler ligger i
 * en annen sensor i kr med avgifter. Da settes:
 *   spot_naa: sensor.min_totalpris_kr        # vises som hovedtall
 *   kalibrer: true                           # løfter hele kurven til samme nivå (standard når spot_naa er satt)
 * Eller regn det ut selv:
 *   mva: 25            # prosent som legges på timesprisene
 *   paaslag: 0.089     # kr/kWh som legges på etter moms (påslag, elsertifikat, nettleie …)
 * spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # auto: første sensor med raw_today
 * spart_dag: sensor.norgespris_besparelse_dag        spart_ar: sensor.norgespris_besparelse_ar
 * effekt: sensor.strommaler_effekt                   # viser hva du bruker akkurat nå
 * tittel: Strøm      hoyde: 170      vindu: 3        # timer i «billigste vindu»
 * tittel_storrelse: 15   # skriftstørrelsen på tittelen i px (standard 15, 20 i enkel visning)
 * bakgrunn_glod: false   # fjerner det fargede skjæret øverst i kortet
 * glass: false       # slår av glasseffekten på pilla ved fanebytte
 * haptikk: false     # slår av vibrasjonen når du bytter mellom I dag og I morgen
 * fane_hoyde: 44     # høyden på I dag / I morgen-rada i px (standard 44)
 * fane_tekst: 14     # skriftstørrelse i fanene; utelates den, følger den høyden
 * enkel: true       # BARE overskrift, dagsvelger og graf — resten utelates
 * vis_stat: false    # skjul snitt/lavest/høyest    vis_vindu: false   # skjul «billigste timer»
 * vis_spart: false   # skjul spart i dag / i år     vis_forklaring: false
 *
 * nettleie_dag: 0.45      # kr/kWh kl. 06–22 på hverdager (tall eller entitet)
 * nettleie_natt: 0.35     # kr/kWh natt, lørdag og søndag
 * nettleie_auto: true     # finn energiledd-sensorene selv når satsene ikke er satt
 * norgespris_energi: 0.50 # fast energipris; utelates den, regnes den ut fra Norgespris-sensoren nå
 * dagtimer_fra: 6   dagtimer_til: 22
 * Med nettleiesatsene tegnes Norgespris som trapp, og «I morgen» viser prisen selv før spot er klar.
 * skala: 0.01        # øre → kr. Settes automatisk når enheten er øre.
 *
 * Grafen viser spotprisen time for time. Den vannrette stiplede linjen er Norgespris:
 * er kurven over linjen, sparer du på Norgespris i den timen.
 */
const KI_SP_VERSJON = "3.5.0";
const KI_SP_TIME = 3600000;

const KI_SP_STIL = `
  :host { display:block; max-width:100%; overflow:hidden; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .ramme { max-width:100%; }
  .ramme { color:var(--gray1000, var(--primary-text-color)); }
  .kort { position:relative; border-radius:var(--ha-card-border-radius,24px); background:var(--kort-bg, var(--gray200, var(--card-background-color)));
    color:var(--gray1000, var(--primary-text-color)); padding:14px 16px 12px; overflow:hidden; isolation:isolate; }
  .kort::before { content:""; position:absolute; inset:-40% -10% auto -10%; height:70%; z-index:-1; opacity:calc(.2 * var(--glod, 1));
    background:radial-gradient(60% 100% at 30% 0%, var(--tone,#8fe3c0), transparent 70%); }
  .topp { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;
    padding:0 4px 10px; background:none; max-width:var(--maks, 100%); margin-inline:auto; }
  /* Fyller kortet som standard. Sett maks_bredde for å holde innholdet samlet på
     veldig brede skjermer – før var 620px standard, og da lå kortet med tomme marger
     på en utbrettet mobil. */
  .kort > .hero, .kort > .grafboks, .kort > .akse, .kort > .stat, .kort > .vindu, .kort > .forkl,
  .kort > .varsel-np, .kort > .venter { max-width:var(--maks, 100%); margin-inline:auto; }
  .hero { width:100%; }
  .topp .valg { margin-left:auto; }

  /* Enkel visning: overskriften står utenfor kortet, så grafen får hele flata.
     Tallene og statistikken er nyttige, men de konkurrerer med kurven — og vil man se
     prisen time for time, er kurven kortet. */
  .topp.enkel { padding:2px 4px 14px; }
  .topp.enkel .tittel { font-size:var(--tittel-str,20px); font-weight:500; }
  .enkelkort { padding:18px 14px 12px; }
  .enkelkort .grafboks { min-height:260px; }
  .enkelkort .akse { padding-top:10px; opacity:.55; }
  /* Tittelen settes med tittel_storrelse og kommer inn som --tittel-str på .ramme,
     så den gjelder begge visningene. */
  .tittel { font-size:var(--tittel-str,15px); font-weight:500; }
  /* faner i samme pilleform som ki-tabs-card / ki-hjem-card */
  /* Fylt beholder uten ramme, som fanerada i søvnpopupen. En ramme rundt en
     gjennomsiktig bunn leses som en knapperad; en fylt flate leses som en bryter med to
     stillinger — og det er det dette er. */
  /* Høyden settes med fane_hoyde og kommer inn som --fane-h på selve rada, slik at
     pilla kan bli så lav han vil uten at teksten klippes: knappen har høyde i stedet
     for loddrett luft, og skriften følger med om fane_tekst ikke er satt. */
  .valg { display:inline-flex; gap:0; padding:var(--fane-kant,4px); border-radius:999px;
    background:var(--gray200,#2a2a2d); max-width:100%; position:relative; }
  .valg .v { height:var(--fane-h,36px); padding:0 var(--fane-side,24px); border-radius:999px;
    font-size:var(--fane-tekst,14.5px); font-weight:500; line-height:1;
    cursor:pointer; white-space:nowrap; display:flex; align-items:center;
    justify-content:center; color:var(--gray1000,#fafbfc); opacity:.6;
    transition:background .18s, opacity .18s, color .18s;
    -webkit-tap-highlight-color:transparent; }
  .valg .v:hover { opacity:.85; }
  .valg .v.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95);
    opacity:1; }
  .valg .v.tom { opacity:.3; }
  @media (max-width:420px) { .valg .v { padding:0 var(--fane-side-smal,16px); } }
  /* Glasspille.
   *
   * Pilla lages av KI.pillefaner i basen; her legges bare utseendet oppå. Farget glass
   * i stedet for flatt fyll: gjennomskinnelig toning av --active-big, lys kant øverst
   * og uskarphet bak, slik at rada under skinner svakt gjennom.
   *
   * Bevegelsen ligger i border-radius og lys, ALDRI i transform: basen bruker transform
   * til å plassere pilla (translateX(var(--x))), så en animasjon på samme egenskap ville
   * overstyrt plasseringen og fått pilla til å hoppe tilbake til start midt i glidningen.
   */
  .ramme:not(.flatt) .valg .ki-pille {
    background:linear-gradient(150deg,
      color-mix(in srgb, var(--active-big,#ee95ff) 92%, #fff 8%),
      color-mix(in srgb, var(--active-big,#ee95ff) 66%, transparent));
    border:1px solid rgba(255,255,255,.28);
    backdrop-filter:blur(7px) saturate(1.5); -webkit-backdrop-filter:blur(7px) saturate(1.5);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.55), inset 0 -7px 12px rgba(255,255,255,.10),
      0 5px 14px rgba(0,0,0,.30);
    overflow:hidden; }
  .ramme:not(.flatt) .valg .ki-pille::after { content:""; position:absolute; inset:0; border-radius:inherit;
    background:linear-gradient(105deg, transparent 32%, rgba(255,255,255,.6) 48%, transparent 66%);
    transform:translateX(-130%); opacity:0; pointer-events:none; }
  .ramme:not(.flatt) .valg .ki-pille.sprut { animation:sp-flyt .5s cubic-bezier(.2,.8,.2,1); }
  .ramme:not(.flatt) .valg .ki-pille.sprut::after { animation:sp-glans .55s cubic-bezier(.2,.8,.2,1); }
  @keyframes sp-flyt {
    0%   { border-radius:999px; filter:brightness(1) saturate(1); }
    35%  { border-radius:46% 54% 55% 45% / 52% 48% 52% 48%; filter:brightness(1.16) saturate(1.25); }
    70%  { border-radius:53% 47% 46% 54% / 49% 51% 49% 51%; filter:brightness(1.05) saturate(1.1); }
    100% { border-radius:999px; filter:brightness(1) saturate(1); } }
  @keyframes sp-glans {
    0%   { transform:translateX(-130%); opacity:0; }
    18%  { opacity:.95; }
    100% { transform:translateX(130%); opacity:0; } }
  /* Ingen luft over: heroen er det første i kortet. */
  .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin:0 0 6px; flex-wrap:wrap; }
  .stor { font-size:2.6em; font-weight:300; line-height:1; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
  @media (min-width:620px) { .stor { font-size:2.2em; } }
  .stor small { font-size:.34em; font-weight:400; opacity:.6; margin-left:6px; letter-spacing:0; }
  .merke { font-size:12.5px; opacity:.65; }
  .hoyre { text-align:right; font-size:13px; line-height:1.5; }
  .spar { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:12.5px; font-weight:600;
    background:color-mix(in srgb, var(--green) 26%, transparent); }
  .spar.tap { background:color-mix(in srgb, var(--red) 26%, transparent); }
  .spar ha-icon { --mdc-icon-size:15px; }
  /* Høyden kommer fra selve tegningen. En fast height her klippet bunnen av grafen
     saa snart den ble hoyere enn hoyde-valget paa en bred skjerm. */
  .grafboks { position:relative; margin:10px 0 0; max-width:100%; touch-action:pan-y; }
  .grafboks svg { display:block; width:100%; overflow:hidden; }
  .strek { stroke-linecap:round; stroke-linejoin:round; }
  .naalinje { stroke:var(--gray1000, var(--primary-text-color)); stroke-width:1; opacity:.35; stroke-dasharray:3 4; }
  .nplinje { stroke:#7ab8ff; stroke-width:1.6; stroke-dasharray:5 5; opacity:.9; }
  .sveip { animation:sp-sveip 1.1s var(--myk) forwards; transform-origin:left center; transform-box:fill-box; }
  @keyframes sp-sveip { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  .naapunkt { animation:sp-ping 2.4s ease-out infinite; transform-origin:center; transform-box:fill-box; }
  @keyframes sp-ping { 0% { r:4; opacity:.9; } 70%,100% { r:13; opacity:0; } }
  .akse { display:flex; justify-content:space-between; gap:6px; font-size:11px; opacity:.55; padding:4px 2px 0; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .boble { position:absolute; top:0; transform:translateX(-50%); background:var(--gray1000, var(--primary-text-color)); color:var(--gray100, var(--card-background-color));
    padding:5px 10px; border-radius:12px; font-size:12px; font-weight:600; white-space:nowrap; pointer-events:none; z-index:2; }
  .boble small { display:block; font-weight:400; opacity:.7; font-size:10.5px; }
  .stat { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; max-width:100%; }
  .stat > div { background:rgba(128,128,128,.12); border-radius:16px; padding:9px 11px; }
  .stat b { display:block; font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
  .stat span { font-size:11.5px; opacity:.6; }
  .vindu { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-top:8px; font-size:13px; padding:10px 12px; border-radius:16px;
    background:linear-gradient(90deg,color-mix(in srgb,var(--green) 22%,transparent),transparent); }
  .vindu ha-icon { --mdc-icon-size:19px; color:var(--green); }
  .forkl { display:flex; flex-wrap:wrap; gap:14px; font-size:11.5px; opacity:.65; margin-top:8px; }
  .forkl i { display:inline-block; width:14px; height:3px; border-radius:2px; vertical-align:middle; margin-right:5px; }
  .varsel-np { margin-top:8px; font-size:12px; opacity:.7; line-height:1.45; }
  .venter { padding:30px 10px; text-align:center; font-size:14px; opacity:.7; }
  .venter i { display:inline-block; width:6px; height:6px; margin:0 2px; border-radius:50%; background:currentColor; animation:sp-hopp 1.2s ease-in-out infinite; }
  .venter i:nth-child(2) { animation-delay:.15s; } .venter i:nth-child(3) { animation-delay:.3s; }
  @keyframes sp-hopp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiSpEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiSpNf = (v, d = 2) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
const kiSpKl = (t) => new Date(t).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
const kiSpKlamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kiSpFarge = (f) => f < 0.34 ? "#3ddc97" : f < 0.67 ? "#ffd24a" : "#ff6b5c";

class KiStromprisCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._valgt = null; this._dag = "i_dag"; this._gid = "sp" + Math.random().toString(36).slice(2, 8); }
  static getStubConfig() { return { norgespris: "sensor.norgespris_total_strompris_norgespris" }; }
  static getConfigElement() { return document.createElement("ki-strompris-card-editor"); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_rows: 5 }; }

  setConfig(c) {
    this._c = { tittel: "Strømpris", norgespris: "sensor.norgespris_total_strompris_norgespris", spart_dag: "sensor.norgespris_besparelse_dag",
      spart_ar: "sensor.norgespris_besparelse_ar", effekt: "sensor.strommaler_effekt", hoyde: 170, vindu: 3,
      vis_stat: true, vis_vindu: true, vis_spart: true, vis_forklaring: true, ...(c || {}) };
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

  _st(id) { return (this._h && id && this._h.states[id]) || null; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  _spot() { if (this._c.spot) return this._c.spot; const h = this._h;
    return this._auto || (this._auto = Object.keys(h.states).find((id) => id.startsWith("sensor.") && Array.isArray(h.states[id].attributes.raw_today))); }
  _ider() { const c = this._c; return [this._spot(), c.spot_naa, c.norgespris, c.spart_dag, c.spart_ar, c.effekt]
    .filter((x) => typeof x === "string" && x); }
  _skala() { const s = this._st(this._spot()); if (this._c.skala !== undefined) return this._c.skala;
    return /øre|ore/i.test((s && s.attributes.unit_of_measurement) || "") ? 0.01 : 1; }

  /* Rådata for en dag. Tåler raw_today/raw_tomorrow (Nordpool), today/tomorrow (tallister)
     og prices_today/prices_tomorrow (objektlister) fra andre integrasjoner. */
  _raa(dag) {
    const s = this._st(this._spot()); if (!s) return null;
    const a = s.attributes, morgen = dag === "i_morgen";
    const objekt = morgen ? (a.raw_tomorrow || a.prices_tomorrow || a.tomorrow_raw) : (a.raw_today || a.prices_today || a.today_raw);
    if (Array.isArray(objekt) && objekt.length && typeof objekt[0] === "object") {
      return objekt.map((p) => {
        const start = p.start || p.startsAt || p.time || p.hour;
        const slutt = p.end || p.endsAt;
        const verdi = p.value !== undefined ? p.value : (p.price !== undefined ? p.price : p.total);
        const t = new Date(start).getTime();
        return { t, slutt: slutt ? new Date(slutt).getTime() : t + KI_SP_TIME, v: verdi === null || verdi === undefined ? null : Number(verdi) };
      });
    }
    const tall = morgen ? a.tomorrow : a.today;
    if (Array.isArray(tall) && tall.length && typeof tall[0] !== "object") {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      if (morgen) d.setDate(d.getDate() + 1);
      const steg = KI_SP_TIME * (24 / tall.length);
      return tall.map((v, i) => ({ t: d.getTime() + i * steg, slutt: d.getTime() + (i + 1) * steg, v: v === null || v === undefined ? null : Number(v) }));
    }
    return null;
  }

  /* Timespriser for valgt dag, skalert til kr/kWh */
  /* Timesprisen slik den skal vises: rå verdi × skala, deretter moms og påslag –
     eller kalibrert mot «spot_naa» slik at kurven lander på samme nivå som tallet du betaler. */
  _justering() {
    const c = this._c;
    if (c.mva !== undefined || c.paaslag !== undefined)
      return { faktor: 1 + (Number(c.mva) || 0) / 100, ledd: Number(c.paaslag) || 0 };
    const naa = this._num(c.spot_naa);
    if (c.spot_naa && naa !== null && c.kalibrer !== false) {
      const raa = this._raa("i_dag");
      if (Array.isArray(raa) && raa.length) {
        const n = Date.now();
        const time = raa.find((p) => p.t <= n && n < p.slutt);
        const grunn = time && time.v !== null ? time.v * this._skala() : null;
        if (grunn && Math.abs(grunn) > 0.0001) return { faktor: naa / grunn, ledd: 0 };
      }
    }
    return { faktor: 1, ledd: 0 };
  }
  _punkter() {
    const s = this._st(this._spot()); if (!s) return null;
    const raa = this._raa(this._dag);
    if (!Array.isArray(raa) || !raa.length) return [];
    const k = this._skala(), j = this._justering();
    return raa.map((p) => ({ t: p.t, slutt: p.slutt, v: p.v === null ? null : p.v * k * j.faktor + j.ledd }))
      .filter((p) => p.v !== null && !isNaN(p.v) && !isNaN(p.t));
  }
  _harMorgen() { const r = this._raa("i_morgen"); return Array.isArray(r) && r.some((p) => p.v !== null && p.v !== undefined && !isNaN(p.v)); }
  _np() {
    const n = this._c.norgespris;
    if (n === false || n === null || n === "") return null;      /* uten Norgespris: rent spotpriskort */
    const v = this._num(n);
    return v === null && typeof n === "number" ? n : v;
  }

  /* Norgespris = fast energipris + nettleie. Nettleia er lavere om natta og i helga,
     så med dag-/nattsats kan morgendagens pris regnes ut selv før spotprisen kommer. */
  /* Satsene kan settes som tall, som entiteter, eller finnes automatisk blant
     energiledd-sensorene (Elvia-integrasjonen lager dem). Uten satser blir
     Norgespris tegnet som én flat strek, siden nettleia er det eneste som varierer
     gjennom døgnet når energiprisen er fast. */
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

  /* 24 timer med Norgespris for valgt dag – brukes når spotprisen ikke er klar ennå. */
  _npPunkter(dag) {
    if (this._nettleie(Date.now()) === null) return null;
    const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(0);
    if (dag === "i_morgen") d.setDate(d.getDate() + 1);
    const ut = [];
    for (let i = 0; i < 24; i++) {
      const t = d.getTime() + i * KI_SP_TIME, v = this._npTime(t);
      if (v === null) return null;
      ut.push({ t, slutt: t + KI_SP_TIME, v });
    }
    return ut;
  }

  _graf(pkt, np) {
    // Tegn i faktiske piksler. Med en fast viewBox på 320 og preserveAspectRatio="none"
    // ble alt inni skalert horisontalt på brede skjermer – også teksten og strekene.
    const c = this._c, B = 14;
    const V = Math.max(280, Math.round(this._bredde || 320));
    const H = Math.round(Math.min(c.hoyde * 1.9, Math.max(c.hoyde, V / (c.graf_forhold || 2.6))));
    const x0 = pkt[0].t, x1 = pkt[pkt.length - 1].slutt;
    const npVerdier = pkt.map((p) => this._npTime(p.t)).filter((v) => v !== null);
    const harNpKurve = npVerdier.length === pkt.length && !this._kunNp;
    const verdier = pkt.map((p) => p.v);
    const lav = Math.min(...verdier, ...(harNpKurve ? npVerdier : [np ?? Infinity]));
    const hoy = Math.max(...verdier, ...(harNpKurve ? npVerdier : [np ?? -Infinity]));
    const pad = (hoy - lav) * 0.18 || 0.1, ymin = Math.max(0, lav - pad), ymax = hoy + pad;
    const X = (t) => ((t - x0) / (x1 - x0)) * V, Y = (v) => B + (1 - (v - ymin) / (ymax - ymin || 1)) * (H - B * 2);
    this._x0 = x0; this._x1 = x1;

    // trappekurve
    let d = "";
    pkt.forEach((p, i) => { const y = Y(p.v); d += `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${y.toFixed(1)} L${X(p.slutt).toFixed(1)} ${y.toFixed(1)} `; });
    const fyll = `${d} L${X(x1).toFixed(1)} ${H} L${X(x0).toFixed(1)} ${H} Z`;

    // Norgespris som trapp når nettleia er kjent (den hopper ved dag-/nattskifte)
    let npTrapp = "";
    if (harNpKurve) {
      pkt.forEach((p, i) => { const y = Y(this._npTime(p.t)); npTrapp += `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${y.toFixed(1)} L${X(p.slutt).toFixed(1)} ${y.toFixed(1)} `; });
    }

    // fargen følger prisnivået: grønt nederst (billig), rødt øverst (dyrt)
    const gy = [0, 0.5, 1].map((f) => `<stop offset="${(f * 100).toFixed(0)}%" stop-color="${kiSpFarge(1 - f)}"/>`).join("");

    const naa = Date.now(), iNaa = pkt.findIndex((p) => p.t <= naa && naa < p.slutt);
    const min = pkt.reduce((a, b) => (b.v < a.v ? b : a)), maks = pkt.reduce((a, b) => (b.v > a.v ? b : a));
    const merke = (p, tekst, farge) => `<g><circle cx="${X((p.t + p.slutt) / 2).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.5" fill="${farge}"/>
      <text x="${kiSpKlamp(X((p.t + p.slutt) / 2), 18, V - 18).toFixed(1)}" y="${(Y(p.v) - 9).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="${farge}" font-weight="600">${tekst}</text></g>`;

    const valgt = this._valgt !== null && pkt[this._valgt] ? pkt[this._valgt] : null;
    return `<svg viewBox="0 0 ${V} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img" aria-label="Spotpris time for time">
      <defs><linearGradient id="${this._gid}-l" gradientUnits="userSpaceOnUse" x1="0" y1="${B}" x2="0" y2="${H - B}">${gy}</linearGradient>
        <linearGradient id="${this._gid}-f" gradientUnits="userSpaceOnUse" x1="0" y1="${B}" x2="0" y2="${H}">
          <stop offset="0" stop-color="${kiSpFarge(0.85)}" stop-opacity=".22"/><stop offset="65%" stop-color="${kiSpFarge(0.15)}" stop-opacity=".14"/><stop offset="100%" stop-color="${kiSpFarge(0)}" stop-opacity="0"/></linearGradient>
        <filter id="${this._gid}-s" x="-5%" y="-20%" width="110%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity=".5"/></filter></defs>
      <g class="${this._animert ? "" : "sveip"}"><path d="${fyll}" fill="url(#${this._gid}-f)"/>
      <path class="strek" d="${d}" fill="none" stroke="${this._kunNp ? "#7ab8ff" : `url(#${this._gid}-l)`}" stroke-width="3" vector-effect="non-scaling-stroke" filter="url(#${this._gid}-s)"/>
      ${npTrapp ? `<path class="nplinje" d="${npTrapp}" fill="none" vector-effect="non-scaling-stroke"/>
        <text x="4" y="${(Y(kiSpKlamp(this._npTime(pkt[0].t), ymin, ymax)) - 6).toFixed(1)}" font-size="10" fill="#7ab8ff" font-weight="600">Norgespris</text>`
        : (np !== null && np >= ymin && np <= ymax ? `<line class="nplinje" x1="0" y1="${Y(np).toFixed(1)}" x2="${V}" y2="${Y(np).toFixed(1)}" vector-effect="non-scaling-stroke"/>
        <text x="4" y="${(Y(np) - 6).toFixed(1)}" font-size="10" fill="#7ab8ff" font-weight="600">Norgespris</text>` : "")}
      </g>${merke(min, kiSpNf(min.v, 2), "#3ddc97")}${merke(maks, kiSpNf(maks.v, 2), "#ff6b5c")}
      ${iNaa >= 0 ? `<line class="naalinje" x1="${X(naa).toFixed(1)}" y1="0" x2="${X(naa).toFixed(1)}" y2="${H}" vector-effect="non-scaling-stroke"/>
        <circle class="naapunkt" cx="${X(naa).toFixed(1)}" cy="${Y(pkt[iNaa].v).toFixed(1)}" r="4" fill="none" stroke="var(--gray1000, #fff)" stroke-width="1.5"/>
        <circle cx="${X(naa).toFixed(1)}" cy="${Y(pkt[iNaa].v).toFixed(1)}" r="4" fill="var(--gray1000, #fff)"/>` : ""}
      ${valgt ? `<line x1="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" y1="0" x2="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" y2="${H}" stroke="var(--gray1000,#fff)" stroke-width="1" opacity=".5" vector-effect="non-scaling-stroke"/>
        <circle cx="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" cy="${Y(valgt.v).toFixed(1)}" r="4.5" fill="var(--gray1000,#fff)"/>` : ""}
    </svg>${valgt ? `<div class="boble" style="left:${kiSpKlamp(((X((valgt.t + valgt.slutt) / 2)) / V) * 100, 12, 88).toFixed(1)}%">${kiSpNf(valgt.v, 2)} kr<small>kl ${kiSpKl(valgt.t)}–${kiSpKl(valgt.slutt)}${np !== null ? ` · ${valgt.v > np ? "Norgespris er billigst" : "spot er billigst"}` : ""}</small></div>` : ""}`;
  }

  _skrubb() {
    const g = this.shadowRoot.querySelector(".grafboks"); if (!g || g._k) return; g._k = 1;
    const finn = (e) => { const b = g.getBoundingClientRect(); if (!this._pkt || !this._pkt.length) return;
      const f = kiSpKlamp((e.clientX - b.left) / b.width, 0, 1), t = this._x0 + f * (this._x1 - this._x0);
      let i = this._pkt.findIndex((p) => p.t <= t && t < p.slutt); if (i < 0) i = f > 0.5 ? this._pkt.length - 1 : 0;
      if (i !== this._valgt) { this._valgt = i; this._oppdaterGraf(); } };
    const slutt = () => { if (this._valgt !== null) { this._valgt = null; this._oppdaterGraf(); } };
    // Berøring: begynn først å lese av når fingeren drar sidelengs, ellers er det en vanlig
    // loddrett scroll og kortet skal ikke reagere i det hele tatt.
    let start = null, aktiv = false;
    g.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") { aktiv = true; finn(e); return; }
      start = { x: e.clientX, y: e.clientY }; aktiv = false;
    });
    g.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") { if (e.buttons || aktiv !== false) finn(e); return; }
      if (!start) return;
      if (!aktiv) {
        const dx = Math.abs(e.clientX - start.x), dy = Math.abs(e.clientY - start.y);
        if (dy > dx || dx < 10) { if (dy > 10) start = null; return; }
        aktiv = true;
        try { g.setPointerCapture(e.pointerId); } catch (_) {}
      }
      finn(e);
    });
    g.addEventListener("pointerleave", () => { if (aktiv) slutt(); aktiv = false; start = null; });
    g.addEventListener("pointercancel", () => { aktiv = false; start = null; slutt(); });
    g.addEventListener("pointerup", (e) => { const var_ = aktiv; aktiv = false; start = null; if (e.pointerType !== "mouse" && var_) setTimeout(slutt, 2500); });
  }

  /* Bare grafen tegnes på nytt når man drar langs den – resten av kortet står stille. */
  _oppdaterGraf() {
    const boks = this.shadowRoot.querySelector(".grafboks");
    if (!boks || !this._pkt || !this._pkt.length) { this._tegn(); return; }
    boks.innerHTML = this._graf(this._pkt, this._np());
  }

  _innhold() {
    const c = this._c, np = this._np();
    let pkt = this._punkter();
    const naa = Date.now(), spotSt = this._st(this._spot());
    const egenNaa = this._num(c.spot_naa);
    const fraKurve = pkt && pkt.length ? (pkt.find((p) => p.t <= naa && naa < p.slutt) || {}).v : null;
    const spotNaa = egenNaa !== null && egenNaa !== undefined ? egenNaa
      : (fraKurve !== null && fraKurve !== undefined ? fraKurve
        : (spotSt ? parseFloat(spotSt.state) * this._skala() * this._justering().faktor + this._justering().ledd : null));
    const sparTime = np !== null && spotNaa !== undefined && spotNaa !== null ? spotNaa - np : null;
    const effekt = this._num(c.effekt), sparDag = this._num(c.spart_dag), sparAr = this._num(c.spart_ar);

    /* Fanerada. `fane_hoyde` er hele rada, kanten trekkes fra så pilla blir riktig,
       og skriften skaleres med mindre `fane_tekst` er satt. */
    const fhRa = Math.max(24, Number(c.fane_hoyde) || 44);
    const fhKant = fhRa < 34 ? 3 : 4;
    const fhPille = Math.max(16, fhRa - fhKant * 2);
    const fhTekst = Number(c.fane_tekst) || Math.max(11, Math.min(15, Math.round(fhPille * 0.4)));
    const fhSide = Math.max(12, Math.round(fhPille * 0.66));
    const fhStil = `--fane-kant:${fhKant}px;--fane-h:${fhPille}px;--fane-tekst:${fhTekst}px;--fane-side:${fhSide}px;--fane-side-smal:${Math.max(10, Math.round(fhSide * 0.66))}px`;
    const valg = `<div class="valg" style="${fhStil}">
      <span class="v ${this._dag === "i_dag" ? "aktiv" : ""}" data-d="i_dag" role="button" tabindex="0">I dag</span>
      <span class="v ${this._dag === "i_morgen" ? "aktiv" : ""} ${this._harMorgen() ? "" : "tom"}" data-d="i_morgen" role="button" tabindex="0">I morgen</span></div>`;

    const enhet = c.enhet || "kr/kWh";
    /* Uten Norgespris er spotprisen hovedtallet – da er kortet et rent spotpriskort. */
    const stort = np !== null ? np : (spotNaa === null || spotNaa === undefined ? null : spotNaa);
    const merke = np !== null ? (c.tekst_norgespris || "Du betaler nå (Norgespris)") : (c.tekst_spot || "Spotpris nå");
    const hero = `<div class="hero">
      <div><div class="merke">${kiSpEsc(merke)}</div><div class="stor">${kiSpNf(stort, 2)}<small>${kiSpEsc(enhet)}</small></div></div>
      <div class="hoyre">
        ${c.vis_tittel === true ? "" : valg}
        ${np !== null && spotNaa !== null && spotNaa !== undefined ? `<div style="opacity:.65">Spot: ${kiSpNf(spotNaa, 2)} kr</div>` : ""}
        ${sparTime !== null ? `<div style="margin-top:4px"><span class="spar ${sparTime < 0 ? "tap" : ""}"><ha-icon icon="mdi:${sparTime < 0 ? "trending-down" : "piggy-bank-outline"}"></ha-icon>${sparTime < 0 ? "−" : "+"}${kiSpNf(Math.abs(sparTime), 2)} ${kiSpEsc(enhet)}</span></div>` : ""}
        ${effekt !== null ? `<div class="effektnaa" style="opacity:.65;margin-top:4px">${kiSpNf(effekt, 0)} W nå</div>` : ""}</div></div>`;

    if (!spotSt) return `${c.vis_tittel === true ? `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span></div>` : ""}${hero}
      <div class="venter">Fant ingen spotprissensor. Sett <b>spot:</b> i kortet.</div>`;
    let kunNp = false, pkt2 = pkt;
    if (pkt === null || !pkt.length) {
      const npp = this._npPunkter(this._dag);
      if (npp) { pkt2 = npp; kunNp = true; }
      else return `${c.vis_tittel === true ? `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span>${valg}</div>` : ""}
      <div class="kort" style="--maks:${kiSpEsc(c.maks_bredde || "100%")};--tone:${this._tone()}${c.bakgrunn ? `;--kort-bg:${kiSpEsc(c.bakgrunn)}` : ""}${c.bakgrunn_glod === false ? ";--glod:0" : ""}">${hero}
      <div class="venter">${this._dag === "i_morgen" ? "Morgendagens priser kommer rundt kl. 13" : "Venter på priser"} <i></i><i></i><i></i></div></div>`;
    }
    this._kunNp = kunNp;
    pkt = pkt2;

    this._pkt = pkt;
    const v = pkt.map((p) => p.v), min = Math.min(...v), maks = Math.max(...v), snitt = v.reduce((a, b) => a + b, 0) / v.length;
    const n = Math.min(c.vindu, pkt.length); let best = 0, bestSum = Infinity;
    for (let i = 0; i + n <= pkt.length; i++) { const s = v.slice(i, i + n).reduce((a, b) => a + b, 0); if (s < bestSum) { bestSum = s; best = i; } }
    const billigst = pkt[best], billigstSlutt = pkt[best + n - 1];
    const over = np !== null ? v.filter((x) => x > np).length : null;
    // færre klokkeslett på smale kort, ellers går de inn i hverandre
    const bredde = this.clientWidth || this.offsetWidth || 400;
    const antall = bredde < 330 ? 3 : bredde < 430 ? 4 : bredde < 620 ? 5 : 7;
    const steg = Math.max(1, Math.ceil(pkt.length / (antall - 1)));
    const timer = pkt.filter((_, i) => i % steg === 0).map((p) => kiSpKl(p.t));

    const toppRad = c.vis_tittel === true
      ? `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span>${valg}</div>` : "";

    /* `enkel: true` — bare overskrift, dagsvelger og graf.
     *
     * Hovedtallet, statistikken, billigste vindu og spart-tallene er nyttige, men de
     * konkurrerer med kurven. Vil man se prisen time for time, er kurven kortet.
     * Da skal den få plassen.
     */
    if (c.enkel) {
      return `<div class="topp enkel"><span class="tittel">${
        kiSpEsc(c.tittel || "Strømpriser")}</span>${valg}</div>
        <div class="kort enkelkort" style="--maks:${kiSpEsc(c.maks_bredde || "100%")};--tone:${
          this._tone()}${c.bakgrunn ? `;--kort-bg:${kiSpEsc(c.bakgrunn)}` : ""}${c.bakgrunn_glod === false ? ";--glod:0" : ""}">
          <div class="grafboks" style="min-height:${c.hoyde}px">${this._graf(pkt, np)}</div>
          <div class="akse">${timer.map((t) => `<span>${t}</span>`).join("")}<span>${
            kiSpKl(pkt[pkt.length - 1].slutt)}</span></div>
        </div>`;
    }

    return `${toppRad}
      <div class="kort" style="--maks:${kiSpEsc(c.maks_bredde || "100%")};--tone:${this._tone()}${c.bakgrunn ? `;--kort-bg:${kiSpEsc(c.bakgrunn)}` : ""}${c.bakgrunn_glod === false ? ";--glod:0" : ""}">
      ${hero}
      <div class="grafboks" style="min-height:${c.hoyde}px">${this._graf(pkt, np)}</div>
      <div class="akse">${timer.map((t) => `<span>${t}</span>`).join("")}<span>${kiSpKl(pkt[pkt.length - 1].slutt)}</span></div>
      ${kunNp ? `<div class="varsel-np">Spotprisen for i morgen kommer rundt kl. 13. Grafen viser Norgespris time for time (nettleia faller om natta og i helga).</div>` : ""}
      ${c.vis_forklaring !== false && !kunNp && np === null ? `<div class="forkl"><span><i style="background:linear-gradient(90deg,#3ddc97,#ffd24a,#ff6b5c)"></i>Spotpris</span>
        <span>snitt ${kiSpNf(snitt, 2)} ${kiSpEsc(c.enhet || "kr/kWh")}</span></div>` : ""}
      ${c.vis_forklaring !== false && !kunNp && np !== null ? `<div class="forkl"><span><i style="background:linear-gradient(90deg,#3ddc97,#ffd24a,#ff6b5c)"></i>Spotpris</span><span><i style="background:repeating-linear-gradient(90deg,#7ab8ff 0 5px,transparent 5px 10px)"></i>Norgespris ${kiSpNf(np, 2)} kr</span>
        ${over !== null ? `<span>${over} av ${pkt.length} timer over Norgespris</span>` : ""}</div>` : ""}
      ${c.vis_stat !== false ? `<div class="stat">
        <div><b>${kiSpNf(snitt, 2)}</b><span>${kunNp ? "snitt Norgespris" : `snitt ${this._dag === "i_morgen" ? "i morgen" : "i dag"}`}</span></div>
        <div><b style="color:#3ddc97">${kiSpNf(min, 2)}</b><span>lavest</span></div>
        <div><b style="color:#ff6b5c">${kiSpNf(maks, 2)}</b><span>høyest</span></div></div>` : ""}
      ${c.vis_vindu !== false ? `<div class="vindu"><ha-icon icon="mdi:clock-check-outline"></ha-icon><span>Billigste ${n} timer: <b>kl ${kiSpKl(billigst.t)}–${kiSpKl(billigstSlutt.slutt)}</b> · snitt ${kiSpNf(bestSum / n, 2)} kr</span></div>` : ""}
      ${c.vis_spart !== false && !kunNp && (sparDag !== null || sparAr !== null) ? `<div class="stat" style="grid-template-columns:repeat(${[sparDag, sparAr].filter((x) => x !== null).length},minmax(0,1fr))">
        ${sparDag !== null ? `<div><b style="color:#3ddc97">${kiSpNf(sparDag, 0)} kr</b><span>spart i dag</span></div>` : ""}
        ${sparAr !== null ? `<div><b style="color:#3ddc97">${kiSpNf(sparAr, 0)} kr</b><span>spart i år</span></div>` : ""}</div>` : ""}
      </div>`;
  }

  _tone() { return this._np() !== null ? "#8fe3c0" : "#ffd24a"; }

  /* Måler hvor bred grafen faktisk er, og tegner på nytt når det endrer seg nok til
     å bety noe. Uten dette ville vi ikke visst hvor mange piksler vi tegner i. */
  _maalevakt() {
    if (this._ro || typeof ResizeObserver === "undefined") return;
    const g = this.shadowRoot.querySelector(".grafboks");
    if (!g) return;
    this._ro = new ResizeObserver((poster) => {
      const b = poster[0] && poster[0].contentRect ? poster[0].contentRect.width : 0;
      if (!b || Math.abs(b - (this._bredde || 0)) < 8) return;
      this._bredde = b;
      this._forrige = null;          // tving full omtegning med ny bredde
      this._tegn();
    });
    this._ro.observe(g);
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  /* Haptikk.
   *
   * navigator.vibrate finnes ikke i Safari på iOS, så på iPhone hadde et trykk ingen
   * respons i det hele tatt. Home Assistant-appen — både iOS og Android — lytter i
   * stedet på et haptic-event på window, der detaljen er styrken. Vi sender begge:
   * appen tar eventet, en nettleser på Android tar vibrasjonen.
   *
   * Typene er HAs egne: selection, light, medium, heavy, success, warning, failure.
   * Et fanebytte er et valg, så standarden er selection. Slås av med haptikk: false.
   */
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

  /* Setter glassanimasjonen i gang på nytt. Klassen må FJERNES og layouten leses
     (offsetWidth) før den settes igjen — ellers ser nettleseren ingen endring, og et
     nytt trykk mens det forrige fortsatt holder på gir ingen ny bevegelse.
     Kortet tegner rada på nytt ved bytte, så pilla er en ny node her. */
  _glass() {
    if (this._c && this._c.glass === false) return;
    const p = this.shadowRoot.querySelector(".valg .ki-pille");
    if (!p) return;
    p.classList.remove("sprut");
    void p.offsetWidth;
    p.classList.add("sprut");
  }

  /* Variabler som skal gjelde hele kortet, uansett hvilken visning som tegnes. */
  _ramStil() {
    const t = Number(this._c && this._c.tittel_storrelse);
    return t ? `--tittel-str:${Math.max(10, Math.min(40, t))}px` : "";
  }

  _koble() {
    const r = this.shadowRoot;
    const bytt = (e) => { const el = e.composedPath().find((x) => x.dataset && x.dataset.d); if (!el || el.hasAttribute("disabled")) return;
      /* Bare når dagen faktisk skifter: et trykk på fanen som alt er valgt skal ikke
         kjennes ut som om noe skjedde. Dra på rada ender i samme click, så
         glidepilla gir haptikk den også. */
      if (el.dataset.d === this._dag) return;
      this._haptikk("selection");
      this._dag = el.dataset.d; this._valgt = null; this._tegn(); this._glass(); };
    r.addEventListener("click", bytt);
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bytt(e); } });

  }

  /* Glidende pille og dra på I dag / I morgen, som i faneradene ellers.
   *
   * MÅ kalles etter HVER tegning, ikke bare fra `_koble()`. `.ramme` byttes ut i sin
   * helhet når dagen skifter, så rada er en ny node — og siden stilen slår av kortets
   * egen aktivbakgrunn, sto begge fanene umerket til pilla kom tilbake.
   *
   * Kortet er frittstående og skal virke uten ki-cards, så vi slår opp på window i
   * stedet for å bruke `KI` direkte: den finnes ikke når fila brukes alene fra
   * /local/. Uten den er kortet som før, bare uten bevegelsen.
   *
   * «I morgen» har klassen `tom` før morgendagens priser er klare, og hoppes over
   * ved dra. */
  _pille() {
    const ki = (typeof window !== "undefined" && window.KI) || null;
    if (ki && ki.pillefaner) {
      /* av: false — «I morgen» er dempet før prisene er klare, men den KAN trykkes
         (kortet sier da at prisene kommer rundt kl. 13). Da skal den kunne dras til
         også, ellers gjør trykk og dra to forskjellige ting. */
      ki.pillefaner(this, { rad: ".valg", knapp: ".valg .v", aktiv: "aktiv", av: false });
    }
  }
  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    let html;
    try {
      html = `<div class="ramme${this._c.glass === false ? " flatt" : ""}" style="${this._ramStil()}">${this._innhold()}</div>`;
    } catch (e) {
      // Et blankt kort sier ingenting om hva som er galt. Vis feilen i stedet.
      console.error("ki-strompris-card:", e);
      this.shadowRoot.innerHTML = `<style>${KI_SP_STIL}</style>
        <div class="ramme"><div class="kort"><div class="venter">
          Kortet feilet: ${kiSpEsc(e && e.message ? e.message : String(e))}
        </div></div></div>`;
      this._bygget = false; this._forrige = null;
      return;
    }
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_SP_STIL}</style>${html}`; this._koble(); this._maalevakt(); this._bygget = true; this._forrige = html; this._pille(); }
    else if (html !== this._forrige) {
      this.shadowRoot.querySelector(".ramme").outerHTML = html;
      this._forrige = html;
      this._pille();
      // .ramme byttes ut i sin helhet, så elementet observeren så på finnes ikke lenger
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      this._maalevakt();
    }
    this._skrubb();
    // sveipeanimasjonen skal bare kjøre første gang kortet tegnes, ikke ved hver oppdatering
    if (!this._animert) setTimeout(() => { this._animert = true; }, 1200);
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
      const n = { norgespris: "Norgespris (tom = vis spotpris)", enhet: "Enhet bak tallet",
        bakgrunn: "Bakgrunnsfarge (f.eks. var(--gray100) eller #1e1e24)", maks_bredde: "Maks bredde på innholdet", spot: "Timespriser (raw_today)",
        spot_naa: "Pris nå i kr (med avgifter)", mva: "Moms på timesprisene (%)", paaslag: "Påslag (kr/kWh)", spart_dag: "Spart i dag", spart_ar: "Spart i år", effekt: "Effekt nå", tittel: "Tittel", tittel_storrelse: "Skriftstørrelse på tittelen (px)", vindu: "Timer i billigste vindu", hoyde: "Grafhøyde (px)",
        fane_hoyde: "Høyde på fanerada (px)", fane_tekst: "Skriftstørrelse i fanene (px, tom = følger høyden)",
        haptikk: "Vibrasjon ved fanebytte", glass: "Glasseffekt på pilla ved fanebytte",
        bakgrunn_glod: "Farget skjær øverst i kortet",
        vis_stat: "Vis snitt / lavest / høyest", vis_vindu: "Vis billigste timer", vis_spart: "Vis spart i dag / i år", vis_forklaring: "Vis forklaring under grafen",
        nettleie_dag: "Nettleie dag (kr/kWh, kl. 06–22 hverdag)", nettleie_natt: "Nettleie natt og helg (kr/kWh)", norgespris_energi: "Fast energipris (kr/kWh, valgfri)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h;
    this._f.data = { vis_stat: true, vis_vindu: true, vis_spart: true, vis_forklaring: true, haptikk: true, glass: true, bakgrunn_glod: true, ...this._c };
    this._f.schema = [{ name: "norgespris", selector: { entity: { domain: "sensor" } } }, { name: "spot", selector: { entity: { domain: "sensor" } } },
      { name: "enhet", selector: { text: {} } },
      { name: "bakgrunn", selector: { text: {} } },
      { name: "maks_bredde", selector: { text: {} } },
      { name: "spot_naa", selector: { entity: { domain: "sensor" } } },
      { name: "mva", selector: { number: { mode: "box", min: 0, max: 100, step: "any" } } },
      { name: "paaslag", selector: { number: { mode: "box", step: "any" } } },
      { name: "spart_dag", selector: { entity: { domain: "sensor" } } }, { name: "spart_ar", selector: { entity: { domain: "sensor" } } },
      { name: "effekt", selector: { entity: { domain: "sensor" } } }, { name: "tittel", selector: { text: {} } },
      { name: "tittel_storrelse", selector: { number: { min: 10, max: 40, mode: "box" } } },
      { name: "vindu", selector: { number: { min: 1, max: 8, mode: "box" } } }, { name: "hoyde", selector: { number: { min: 100, max: 320, mode: "box" } } },
      { name: "fane_hoyde", selector: { number: { min: 24, max: 72, mode: "box" } } },
      { name: "fane_tekst", selector: { number: { min: 10, max: 22, mode: "box" } } },
      { name: "haptikk", selector: { boolean: {} } },
      { name: "glass", selector: { boolean: {} } },
      { name: "bakgrunn_glod", selector: { boolean: {} } },
      { name: "vis_stat", selector: { boolean: {} } }, { name: "vis_vindu", selector: { boolean: {} } },
      { name: "vis_spart", selector: { boolean: {} } }, { name: "vis_forklaring", selector: { boolean: {} } },
      { name: "nettleie_dag", selector: { number: { min: 0, max: 3, step: 0.01, mode: "box" } } },
      { name: "nettleie_natt", selector: { number: { min: 0, max: 3, step: 0.01, mode: "box" } } },
      { name: "norgespris_energi", selector: { number: { min: 0, max: 3, step: 0.01, mode: "box" } } }];
  }
}
if (!customElements.get("ki-strompris-card-editor")) customElements.define("ki-strompris-card-editor", KiStromprisCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-strompris-card")) window.customCards.push({ type: "ki-strompris-card", name: "KI Strømpris", description: "Spotpris time for time med Norgespris-linje, billigste timer og besparelse", preview: true });
console.info(`%c KI-STROMPRIS-CARD %c v${KI_SP_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

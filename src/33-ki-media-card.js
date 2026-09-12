/* ki-media-card – nå spilles med levende omslag, transport, volum og radiokanaler.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-media-card
 * media: media_player.squeezebox_radio      # eller en liste: den som spiller velges automatisk
 * visning: full            # full (alt) | stor (180 px hero) | naa (topplinja) | kontroll (uten topplinje)
 * fane_media:              # bytter spiller etter hvilken fane i ki-tabs-card som er valgt
 *   Tv: media_player.stue_tv
 *   Musikk: media_player.squeezebox_radio
 * radio: [{navn: NRK P1, skript: script.nrk_p1}]      # entity: virker også (button, switch, scene, script)
 * velger: [{navn: Stue TV, entity: media_player.stue_tv}, {navn: Google TV, entity: media_player.google_tv}]
 *         # flere spillere: sveip mellom dem, med prikker under
 * sveip: false            # bytt tilbake til pillerad i stedet for sveiping
 * folg: true              # kontrollkortet følger spilleren du sveiper til i hero-kortet
 * spillknapp: av_pa                                 # av_pa | spill – midtknappen i transportraden
 * kontroll: {play_pause: script..., neste: ..., forrige: ..., shuffle: ..., repeat: ...}
 * grupper: [{navn: Oppe, entity: input_boolean.sonos_group_oppe}]
 * i_dag: sensor.tv_seertid_i_dag          # seertid i timer, vises som pille i stor visning
 * maned: sensor.tv_seertid_denne_maned
 * tid:                                    # egne sensorer per spiller
 *   media_player.stue_tv: {i_dag: sensor.tv_seertid_i_dag, maned: sensor.tv_seertid_denne_maned}
 */
const KI_MEDIA_VERSJON = "1.8.1";

const KI_MEDIA_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .rot { display:grid; gap:12px; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* ---- nå spilles ---- */
  .naa { position:relative; min-height:66px; border-radius:75px; overflow:hidden; isolation:isolate;
    background:var(--gray200); color:var(--gray1000); display:grid; grid-template-columns:76px 1fr min-content;
    grid-template-areas:"om tittel eq" "om under eq"; align-items:center; padding:4px 20px 4px 4px;
    transition:background .6s var(--myk), color .4s; cursor:pointer; }
  .naa.spiller { background:var(--ki-tone, var(--gray1000)); color:var(--ki-blekk,#111); }
  .naa.av { background:var(--gray200); color:var(--gray1000); }
  .bakgrunn { position:absolute; inset:-30%; z-index:-1; opacity:0; transition:opacity .8s ease;
    background-size:cover; background-position:center; filter:blur(22px) saturate(1.5); }
  .naa.harbilde .bakgrunn, .hero.harbilde .bakgrunn { opacity:.55; animation:kenburns 26s ease-in-out infinite alternate; }
  .hero.harbilde .bakgrunn { opacity:.6; }
  @keyframes kenburns { from { transform:scale(1) translate3d(0,0,0); } to { transform:scale(1.18) translate3d(-3%,2%,0); } }
  .omslag { grid-area:om; position:relative; width:58px; height:58px; border-radius:50%; overflow:hidden; justify-self:start;
    background:rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; }
  .omslag img { width:100%; height:100%; object-fit:cover; }
  .omslag ha-icon { --mdc-icon-size:28px; opacity:.75; }
  .naa.spiller .omslag { animation:snurr 18s linear infinite; }
  @keyframes snurr { to { transform:rotate(360deg); } }
  .tittel { grid-area:tittel; align-self:end; padding-top:4px; font-size:16px; font-weight:500; min-width:0; }
  .under { grid-area:under; align-self:start; padding-bottom:7px; font-size:14px; opacity:.7; min-width:0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rulle { display:block; white-space:nowrap; overflow:hidden; }
  .rulle span { display:inline-block; }
  .rulle.lang span { animation:rull 16s linear infinite; padding-right:40px; }
  @keyframes rull { 0%,8% { transform:translateX(0); } 92%,100% { transform:translateX(-100%); } }
  .eqboks { grid-area:eq; justify-self:end; display:flex; align-items:center; gap:10px; }
  .eq { display:inline-flex; align-items:flex-end; gap:2.5px; height:16px; }
  .eq i { width:3px; border-radius:2px; background:currentColor; height:30%; animation:eqhopp .85s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay:-.25s; } .eq i:nth-child(3) { animation-delay:-.55s; }
  .eq i:nth-child(4) { animation-delay:-.1s; } .eq i:nth-child(5) { animation-delay:-.4s; }
  @keyframes eqhopp { from { height:20%; } to { height:100%; } }
  .eq.pause i { animation-play-state:paused; height:34%; }
  .framdrift { position:absolute; left:0; right:0; bottom:0; height:3px; background:rgba(0,0,0,.12); }
  .framdrift i { display:block; height:100%; width:0; background:currentColor; opacity:.6; transition:width 1s linear; }
  .tid { font-size:12px; opacity:.65; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .eqboks { flex-wrap:nowrap; }

  /* ---- stor visning (hero, 180 px) ---- */
  .hero { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate;
    padding:20px; display:grid; grid-template-columns:1fr 116px; grid-template-rows:min-content 1fr min-content;
    grid-template-areas:"kilde om" "tekst om" "fram om"; gap:6px 16px; cursor:pointer;
    background:var(--gray200); color:var(--gray1000); transition:background .8s var(--myk), color .5s; }
  .hero.spiller { background:var(--ki-tone, var(--gray200)); color:var(--ki-blekk, var(--gray1000)); }
  .hero .skygge { position:absolute; inset:0; z-index:-1; pointer-events:none;
    background:linear-gradient(100deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.12) 52%, rgba(0,0,0,0) 74%); opacity:0; transition:opacity .8s; }
  .hero.harbilde .skygge { opacity:1; }
  .hkilde { grid-area:kilde; display:flex; align-items:center; gap:8px; min-width:0; overflow:hidden; }
  .hpille { min-width:0; overflow:hidden; }
  .hpille .pnavn { overflow:hidden; text-overflow:ellipsis; }
  .hpille { display:inline-flex; align-items:center; gap:6px; padding:4px 11px 4px 6px; border-radius:999px;
    background:rgba(250,251,252,.16); font-size:12px; font-weight:600; --mdc-icon-size:15px; white-space:nowrap; }
  .hero.harbilde .hpille { background:rgba(0,0,0,.22); }
  .hhoyre { grid-area:om; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  .hstat { display:flex; flex:none; }
  .hstat .sp { display:inline-flex; align-items:center; gap:5px; padding:4px 11px 4px 8px; border-radius:999px;
    background:rgba(250,251,252,.13); font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap;
    --mdc-icon-size:14px; }
  .hero.harbilde .hstat .sp { background:rgba(0,0,0,.24); }
  .hstat .sp em { font-style:normal; font-weight:500; opacity:.6; }
  .hstat ha-icon { opacity:.7; }
  .hstat .sp.stiger { animation:statpuls 2.6s ease-in-out infinite; }
  @keyframes statpuls { 0%,100% { box-shadow:0 0 0 0 rgba(255,255,255,0); } 50% { box-shadow:0 0 0 3px rgba(255,255,255,.12); } }
  @media (max-width:400px) { .hstat .sp em { display:none; } .hstat .sp { padding:4px 9px 4px 7px; } }
  .htekst { grid-area:tekst; align-self:center; min-width:0; display:grid; gap:3px; align-content:center; }
  .htittel { font-size:1.55em; line-height:1.15; font-weight:400; min-width:0; }
  .hartist { font-size:14px; opacity:.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hfram { grid-area:fram; display:flex; align-items:center; gap:10px; min-width:0; }
  .hlinje { flex:1; height:4px; border-radius:2px; background:rgba(128,128,128,.28); overflow:hidden; min-width:0; }
  .hlinje i { display:block; height:100%; width:0; border-radius:2px; background:currentColor; opacity:.85; transition:width 1s linear; }
  .hbolge { flex:1; display:flex; align-items:flex-end; gap:3px; height:18px; }
  .hbolge i { flex:1; border-radius:2px; background:currentColor; opacity:.5; height:22%;
    animation:hbolge 1.2s ease-in-out infinite alternate; }
  @keyframes hbolge { from { height:14%; } to { height:100%; } }
  .htid { font-size:12px; opacity:.7; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .hknapp { border:0; width:40px; height:40px; border-radius:50%; flex:none; cursor:pointer; --mdc-icon-size:22px;
    display:flex; align-items:center; justify-content:center; background:rgba(250,251,252,.18); color:inherit;
    transition:transform .12s var(--fjaer), background .2s; }
  .hero.harbilde .hknapp { background:rgba(0,0,0,.26); }
  .hknapp:active { transform:scale(.9); }
  .hom { position:relative; width:116px; height:116px; border-radius:20px; overflow:hidden;
    background:rgba(128,128,128,.18); box-shadow:0 14px 34px rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center;
    animation:hsvev 7s ease-in-out infinite alternate; }
  @keyframes hsvev { from { transform:translateY(-3px) rotate(-.6deg); } to { transform:translateY(3px) rotate(.6deg); } }
  .hom img { width:100%; height:100%; object-fit:cover; }
  .hom ha-icon { --mdc-icon-size:46px; opacity:.55; }
  .hom::after { content:""; position:absolute; top:-60%; left:-120%; width:60%; height:220%; transform:rotate(18deg);
    background:linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,.32), rgba(255,255,255,0)); }
  .hero.spiller .hom::after { animation:hglans 5.5s ease-in-out 1.2s infinite; }
  @keyframes hglans { 0% { left:-120%; } 45%,100% { left:150%; } }
  .hring { position:absolute; inset:0; z-index:-1; border-radius:20px; }
  .hero.spiller .hring::before, .hero.spiller .hring::after { content:""; position:absolute; inset:0; border-radius:22px;
    border:2px solid currentColor; opacity:0; animation:hringut 3s ease-out infinite; }
  .hero.spiller .hring::after { animation-delay:1.5s; }
  @keyframes hringut { 0% { transform:scale(1); opacity:.4; } 100% { transform:scale(1.22); opacity:0; } }
  .hhoyre.medstat .hom { width:104px; height:104px; }
  @media (max-width:400px) { .hero { grid-template-columns:1fr 96px; padding:16px; } .hom { width:96px; height:96px; }
    .hhoyre.medstat .hom { width:88px; height:88px; } .htittel { font-size:1.35em; } }

  /* ---- transport ---- */
  .transport { display:flex; align-items:center; justify-content:center; gap:10px; }
  .tk { border:0; background:none; color:var(--gray1000); display:flex; align-items:center; justify-content:center;
    cursor:pointer; border-radius:50%; transition:transform .12s var(--fjaer), background .2s, opacity .2s; }
  .tk:active { transform:scale(.9); }
  .tk.liten { width:44px; height:44px; --mdc-icon-size:24px; opacity:.6; }
  .tk.liten.pa { opacity:1; color:var(--active-big,#ee95ff); }
  .tk.midt2 { width:50px; height:50px; --mdc-icon-size:34px; }
  .tk.stor { width:76px; height:76px; background:var(--active-big,#ee95ff); color:var(--black,#000); --mdc-icon-size:30px;
    box-shadow:0 8px 24px rgba(0,0,0,.28); }
  .tk.stor.spiller::after { content:""; position:absolute; width:76px; height:76px; border-radius:50%;
    border:2px solid var(--active-big,#ee95ff); animation:ringut 2.4s ease-out infinite; }
  .tk.stor { position:relative; }
  @keyframes ringut { 0% { transform:scale(1); opacity:.55; } 100% { transform:scale(1.5); opacity:0; } }

  /* ---- volum ---- */
  /* velger for flere spillere – samme pilleform som fanene ellers */
  .velger { display:flex; justify-content:center; padding:0 0 4px; }
  .vskinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px;
    max-width:100%; overflow-x:auto; scrollbar-width:none; }
  .vskinne::-webkit-scrollbar { display:none; }
  .vknapp2 { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:13px; font-weight:500;
    padding:6px 14px; border-radius:999px; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center;
    gap:6px; --mdc-icon-size:16px; transition:background .2s, color .2s; }
  .vknapp2.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .vknapp2 i { width:6px; height:6px; border-radius:50%; background:var(--green,#7ee081); display:none; }
  .vknapp2.spiller i { display:block; }
  .vknapp2.mangler { opacity:.4; text-decoration:line-through; }
  /* sveip mellom spillere */
  .sveip { position:relative; overflow:hidden; touch-action:pan-y; overscroll-behavior-y:auto; }
  .spor { display:flex; transition:transform .35s var(--myk, cubic-bezier(.2,.8,.2,1)); will-change:transform; }
  .spor.drar { transition:none; }
  .side { flex:0 0 100%; min-width:0; }
  .prikker { display:flex; gap:6px; justify-content:center; padding:10px 0 2px; height:auto; align-items:center; }
  .prikker i { width:7px; height:7px; border-radius:50%; background:var(--gray1000); opacity:.25;
    transition:opacity .25s, transform .25s; cursor:pointer; }
  .prikker i.valgt { opacity:.95; transform:scale(1.15); }
  .mangler-side { display:flex; align-items:center; justify-content:center; height:180px; border-radius:24px;
    background:var(--gray200); color:var(--gray1000); font-size:13px; opacity:.7; text-align:center; padding:20px; }
  /* samme oppsett som volumraden i rom-popupen: 90px navn, spor, 50px prosent */
  .volum { display:grid; grid-template-columns:90px 1fr 50px; align-items:center;
    background:none; border-radius:0; padding:6px 0; }
  .vnavn { font-size:14px; font-weight:500; justify-self:start; padding:0 12px; white-space:nowrap; }
  .vknapp { border:0; background:var(--gray100); color:var(--gray1000); width:34px; height:34px; border-radius:50%;
    cursor:pointer; display:flex; align-items:center; justify-content:center; --mdc-icon-size:20px; flex:none; }
  .vknapp:active { transform:scale(.92); }
  .gruppe { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
  .gknapp { border:0; font:inherit; font-size:13px; font-weight:500; padding:8px 14px; border-radius:999px;
    background:var(--gray200); color:var(--gray1000); cursor:pointer; transition:background .2s, color .2s, transform .12s var(--fjaer); }
  .gknapp:active { transform:scale(.96); }
  .gknapp.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  /* spor i --gray100, framdrift i --active-big, hvit rund gripeknapp */
  input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none;
    background-color:var(--gray100); background-repeat:no-repeat;
    background-image:linear-gradient(to right, var(--active-big,#ee95ff) var(--p,0%), rgba(0,0,0,0) var(--p,0%)); }
  input[type=range]::-webkit-slider-runnable-track { -webkit-appearance:none; background:none; height:8px; border-radius:4px; }
  input[type=range]::-moz-range-track { background:none; height:8px; border-radius:4px; }
  input[type=range]::-moz-range-progress { background:var(--active-big,#ee95ff); height:8px; border-radius:4px; }
  .vnavn:active { opacity:.6; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
    background:var(--gray1000); border:0; cursor:grab; }
  input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000);
    border:0; cursor:grab; }
  .vtall { font-size:14px; font-weight:500; font-variant-numeric:tabular-nums; justify-self:end; }

  /* ---- radiokanaler ---- */
  .radio { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding:2px; margin:0 -2px; scroll-snap-type:x proximity; }
  .radio::-webkit-scrollbar { display:none; }
  .kanal { position:relative; flex:none; width:76px; height:76px; border:0; border-radius:24px; cursor:pointer; scroll-snap-align:start;
    background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:600; line-height:1.2;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px; overflow:hidden;
    transition:transform .14s var(--fjaer), background .25s, color .25s; }
  .kanal:active { transform:scale(.94); }
  .kanal ha-icon { --mdc-icon-size:22px; opacity:.8; }
  .kanal.spiller { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .kanal .bolge { position:absolute; left:0; right:0; bottom:0; height:16px; display:flex; align-items:flex-end;
    justify-content:center; gap:2px; opacity:0; }
  .kanal.spiller .bolge { opacity:.5; }
  .kanal .bolge i { width:2.5px; border-radius:2px; background:currentColor; height:25%; animation:eqhopp .8s ease-in-out infinite alternate; }
  .kanal .bolge i:nth-child(2) { animation-delay:-.2s; } .kanal .bolge i:nth-child(3) { animation-delay:-.45s; }
  .kanal .bolge i:nth-child(4) { animation-delay:-.65s; }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiMediaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiMediaKl = (s) => {
  const n = Math.max(0, Math.round(s || 0)), m = Math.floor(n / 60), t = n % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(t).padStart(2, "0")}`
    : `${m}:${String(t).padStart(2, "0")}`;
};

class KiMediaCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._farge = {}; }
  static getConfigElement() { return document.createElement("ki-media-card-editor"); }
  static getStubConfig() { return { media: "media_player.squeezebox_radio", visning: "full" }; }
  getCardSize() { const v = this._c && this._c.visning; return v === "naa" ? 1 : v === "stor" ? 3 : 8; }
  getGridOptions() { return this._c && this._c.visning === "stor" ? { columns: 12, rows: 3, min_rows: 3 } : undefined; }

  setConfig(c) {
    if (!c || (!c.media && !c.fane_media && !c.velger)) throw new Error("Sett media: til mediaspilleren");
    this._c = { visning: "full", ikon: "mdi:speaker", ...c };
    if (this._c.fane_media && !this._c.media) {
      /* uten «media» starter kortet på den første fanen i kartet */
      const forste = Object.values(this._c.fane_media)[0];
      const liste = Array.isArray(forste) ? forste : [forste];
      this._faneListe = liste;
      this._c.media = typeof liste[0] === "string" ? liste[0] : liste[0].entity;
    }
    if (this._c.velger && !this._c.media) {
      const f = this._c.velger[0];
      this._c.media = typeof f === "string" ? f : f.entity;
    }
    this._spillere = (Array.isArray(c.media) ? c.media : [c.media]).filter(Boolean);
    this._radio = (c.radio || []).map((r) => typeof r === "string" ? { navn: r } : r);
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const tid = Object.values(c.tid || {}).flatMap((t) => [t.i_dag, t.maned]);
    const ids = [...(this._spillere || []), ...(c.grupper || []).map((g2) => g2.entity), c.i_dag, c.maned, ...tid].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._oppdater();
  }
  get hass() { return this._h; }
  /* Følger fanevalget i ki-tabs-card: {Tv: media_player.stue_tv, Musikk: media_player.sonos} */
  _fanelytter() {
    if (this._faneAv || !this._c.fane_media) return;
    this._faneAv = (e) => {
      const d = (e && e.detail) || {};
      const kart = this._c.fane_media || {};
      const rens = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const treff = Object.keys(kart).find((k) => rens(k) === rens(d.title))
        || (d.index !== undefined ? Object.keys(kart)[d.index] : null);
      const rå = treff ? kart[treff] : null;
      if (!rå) return;
      const liste = (Array.isArray(rå) ? rå : [rå]).map((x) => (typeof x === "string" ? x : x.entity));
      if (JSON.stringify(liste) === JSON.stringify(this._faneListe || [])) return;
      this._faneListe = Array.isArray(rå) ? rå : [rå];
      this._valgt = liste[0];
      this._spillere = liste;
      this._meldValg(liste[0]);
      this._bygget = false;
      if (this._h) { this._bygg(); this._oppdater(); }
    };
    window.addEventListener("ki-tab-changed", this._faneAv);
  }

  connectedCallback() { this._start(); this._fanelytter(); this._folgelytter(); if (this._bygget) this._oppdater(); }
  disconnectedCallback() {
    if (this._faneAv) { window.removeEventListener("ki-tab-changed", this._faneAv); this._faneAv = null; }
    if (this._folgAv) { window.removeEventListener("ki-media-valgt", this._folgAv); this._folgAv = null; } clearInterval(this._ur); }
  _start() { clearInterval(this._ur); this._ur = setInterval(() => this._tikk(), 1000); }

  /* Med flere spillere velges den som spiller, ellers den som er på, ellers den første */
  _id() {
    const h = this._h, l = this._spillere || [];
    if (this._valgt && l.includes(this._valgt)) return this._valgt;   /* valgt i pillene */
    if (!h || l.length < 2) return l[0] || this._c.media;
    const rang = (id) => { const s = h.states[id]; if (!s) return 9;
      return { playing: 0, paused: 1, buffering: 0, on: 2, idle: 3, standby: 4 }[s.state] ?? 5; };
    return l.slice().sort((a, b) => rang(a) - rang(b))[0];
  }
  _st() { return this._h && this._h.states[this._id()]; }
  _spiller() { const s = this._st(); return !!s && s.state === "playing"; }
  _pause() { const s = this._st(); return !!s && s.state === "paused"; }

  /* Posisjon regnes ut fra media_position + tidspunktet den ble oppdatert */
  _posisjon() {
    const s = this._st(); if (!s) return null;
    const a = s.attributes, p = a.media_position, t = a.media_position_updated_at, d = a.media_duration;
    if (p === undefined || !d) return null;
    const gaatt = t ? (Date.now() - new Date(t).getTime()) / 1000 : 0;
    return { na: Math.min(d, p + (this._spiller() ? Math.max(0, gaatt) : 0)), total: d };
  }
  _tikk() {
    if (!this._bygget) return;
    const p = this._posisjon(), r = this.shadowRoot;
    const b = r.querySelector(".framdrift i") || r.querySelector(".hlinje i"), t = r.querySelector(".tid") || r.querySelector(".htid");
    if (!p) { if (b) b.style.width = "0"; if (t) t.textContent = ""; return; }
    if (b) b.style.width = ((p.na / p.total) * 100).toFixed(2) + "%";
    if (t) t.textContent = `${kiMediaKl(p.na)} / ${kiMediaKl(p.total)}`;
  }

  /* Henter en dominerende farge fra omslaget, med lys/mørk tekst etter lumen */
  _tone(url) {
    if (!url || this._farge[url] !== undefined) { this._settTone(this._farge[url]); return; }
    this._farge[url] = null;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas"), n = 12;
        c.width = n; c.height = n;
        const x = c.getContext("2d"); x.drawImage(img, 0, 0, n, n);
        const d = x.getImageData(0, 0, n, n).data;
        let r = 0, g = 0, b = 0, v = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const vekt = 0.3 + (mx - mn) / 255;           /* mettede piksler teller mer */
          r += d[i] * vekt; g += d[i + 1] * vekt; b += d[i + 2] * vekt; v += vekt;
        }
        r = Math.round(r / v); g = Math.round(g / v); b = Math.round(b / v);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        this._farge[url] = { bg: `rgb(${r},${g},${b})`, blekk: lum > 0.55 ? "rgba(20,16,22,.92)" : "#fff" };
      } catch (e) { this._farge[url] = null; }
      this._settTone(this._farge[url]);
    };
    img.onerror = () => { this._farge[url] = null; };
    img.crossOrigin = "anonymous"; img.src = url;
  }
  _settTone(f) {
    const n = this.shadowRoot && this.shadowRoot.querySelector(".naa, .hero"); if (!n) return;
    n.style.setProperty("--ki-tone", f ? f.bg : "var(--gray1000)");
    n.style.setProperty("--ki-blekk", f ? f.blekk : "var(--black,#111)");
  }

  _kall(navn, standard, data) {
    const k = (this._c.kontroll || {})[navn];
    if (navigator.vibrate) navigator.vibrate(8);
    if (k) { const [d, s] = k.split("."); return this._h.callService(d, s, {}); }
    return this._h.callService("media_player", standard, { entity_id: this._id(), ...(data || {}) });
  }
  _spillPause() {
    const s = this._st();
    this._kall("play_pause", "media_play_pause");
    if (s) { /* raskt svar i grensesnittet */ }
  }
  /* Seertid for den aktive spilleren: tid-kartet først, ellers i_dag/maned */
  _tidkilder() {
    const c = this._c, kart = c.tid || {}, egen = kart[this._id()] || {};
    return { i_dag: egen.i_dag || (Object.keys(kart).length ? null : c.i_dag), maned: egen.maned || (Object.keys(kart).length ? null : c.maned) };
  }
  _timer(id) {
    const s = id && this._h && this._h.states[id], n = s ? parseFloat(s.state) : NaN;
    if (!isFinite(n)) return null;
    const t = Math.floor(n), m = Math.round((n - t) * 60);
    return m === 60 ? `${t + 1}:00` : `${t}:${String(m).padStart(2, "0")}`;
  }
  _mer() { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._id() }, bubbles: true, composed: true })); }

  _byggStor() {
    const c = this._c;
    const liste = this._velgere();
    const sveip = liste.length > 1 && c.sveip !== false;
    this.shadowRoot.innerHTML = `<style>${KI_MEDIA_STIL}</style>
      ${sveip ? `<div class="sveip"><div class="spor"><div class="side">` : ""}
      <div class="hero" role="button" tabindex="0">
        <div class="bakgrunn"></div><div class="skygge"></div>
        <div class="hkilde"><span class="hpille"><ha-icon class="pikon" icon="${kiMediaEsc(c.ikon)}"></ha-icon><span class="pnavn"></span></span>
          <span class="eq"><i></i><i></i><i></i><i></i><i></i></span></div>
        <div class="htekst">
          <div class="htittel"><span class="rulle"><span class="tt"></span></span></div>
          <div class="hartist"></div>
        </div>
        <div class="hfram">
          <div class="hlinje"><i></i></div>
          <div class="hbolge">${"<i></i>".repeat(14)}</div>
          <span class="htid"></span>
          <button class="hknapp" data-t="strom" aria-label="Av eller på"><ha-icon icon="mdi:power"></ha-icon></button>
          <button class="hknapp" data-t="neste" aria-label="Neste"><ha-icon icon="mdi:skip-next"></ha-icon></button>
        </div>
        <div class="hhoyre">
          <div class="hom"><div class="hring"></div><ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon></div>
          <span class="hstat"></span>
        </div>
      </div>
      ${sveip ? `</div></div></div>
        <div class="prikker">${liste.map((v, i) =>
          `<i class="${v.entity === this._id() ? "valgt" : ""}" data-p="${i}" title="${kiMediaEsc(v.navn)}"></i>`).join("")}</div>` : ""}`;
    const r = this.shadowRoot, hero = r.querySelector(".hero");
    if (sveip) this._koblSveip(r, liste);
    hero.addEventListener("click", (e) => {
      if (this._sveipet) { this._sveipet = false; return; }
      if (!e.target.closest(".hknapp")) this._mer();
    });
    hero.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._mer(); } });
    r.querySelectorAll(".hknapp").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (b.dataset.t === "strom") {
        const st = this._st();
        const av = !st || ["off", "unavailable", "standby", "idle"].includes(st.state);
        this._h.callService("media_player", av ? "turn_on" : "turn_off", { entity_id: this._id() });
      } else if (b.dataset.t === "spill") this._spillPause();
      else this._kall("neste", "media_next_track");
    }));
    r.querySelectorAll(".hbolge i").forEach((el, i) => {
      el.style.animationDelay = `-${((i * 0.17) % 1.2).toFixed(2)}s`;
      el.style.animationDuration = `${(0.9 + ((i * 0.11) % 0.7)).toFixed(2)}s`;
    });
    this._bygget = true; this._start();
  }

  /* Sveip mellom spillerne: dra til siden for å bytte, prikkene viser hvor du er */
  _koblSveip(r, liste) {
    const boks = r.querySelector(".sveip"), spor = r.querySelector(".spor");
    if (!boks || !spor) return;
    const bytt = (retning) => {
      const naa = Math.max(0, liste.findIndex((v) => v.entity === this._id()));
      const ny = (naa + retning + liste.length) % liste.length;
      this._valgt = liste[ny].entity;
      this._spillere = liste.map((v) => v.entity);
      this._meldValg(liste[ny].entity);
      /* la kortet gli ut, bygg om, og la det gli inn igjen */
      spor.style.transform = `translateX(${retning > 0 ? -100 : 100}%)`;
      setTimeout(() => {
        this._bygg(); this._oppdater();
        const nySpor = this.shadowRoot.querySelector(".spor");
        if (!nySpor) return;
        nySpor.classList.add("drar");
        nySpor.style.transform = `translateX(${retning > 0 ? 100 : -100}%)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          nySpor.classList.remove("drar");
          nySpor.style.transform = "translateX(0)";
        }));
      }, 180);
    };

    let x0 = null, y0 = 0, dx = 0, retning = null;
    boks.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".hknapp")) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; retning = null;
    });
    boks.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      /* Bestem retning én gang: er bevegelsen mest loddrett, skal siden rulle
         som normalt og kortet holde seg i ro. */
      if (retning === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        retning = Math.abs(dx) > Math.abs(dy) * 1.6 ? "vannrett" : "loddrett";
        if (retning === "vannrett") { spor.classList.add("drar"); if (boks.setPointerCapture) boks.setPointerCapture(e.pointerId); }
      }
      if (retning !== "vannrett") return;
      boks.style.touchAction = "none";          /* stopp rullingen mens man drar */
      if (e.cancelable) e.preventDefault();
      spor.style.transform = `translateX(${dx * 0.6}px)`;
    });
    const slipp = () => {
      if (x0 === null) return;
      spor.classList.remove("drar");
      boks.style.touchAction = "";
      const flyttet = retning === "vannrett" && Math.abs(dx) > 55;
      spor.style.transform = "translateX(0)";
      if (flyttet) { this._sveipet = true; bytt(dx < 0 ? 1 : -1); }
      x0 = null; dx = 0; retning = null;
    };
    boks.addEventListener("pointerup", slipp);
    boks.addEventListener("pointercancel", slipp);
    boks.addEventListener("pointerleave", slipp);
    /* trykk på en prikk går rett til den spilleren */
    r.querySelectorAll("[data-p]").forEach((pr) => pr.addEventListener("click", () => {
      const ny = liste[+pr.dataset.p]; if (!ny || ny.entity === this._id()) return;
      this._valgt = ny.entity; this._spillere = liste.map((v) => v.entity);
      this._meldValg(ny.entity);
      this._bygg(); this._oppdater();
    }));
  }

  /* Sier fra til de andre kortene hvilken spiller som er valgt */
  _meldValg(entity) {
    window.dispatchEvent(new CustomEvent("ki-media-valgt", { detail: { entity } }));
  }

  /* Kontrollkortet kan følge spilleren som velges i hero-kortet */
  _folgelytter() {
    const c = this._c;
    const folg = c.folg !== undefined ? c.folg : (c.visning === "kontroll" && !c.velger);
    if (!folg || this._folgAv) return;
    this._folgAv = (e) => {
      const ny = e && e.detail && e.detail.entity;
      if (!ny || ny === this._id()) return;
      /* følg bare spillere vi faktisk kjenner, ellers bytter TV-valget musikkortet */
      const kjent = this._velgere().map((v) => v.entity);
      if (kjent.length && !kjent.includes(ny)) return;
      this._valgt = ny;
      if (!this._spillere || !this._spillere.includes(ny)) this._spillere = [...(this._spillere || []), ny];
      this._bygg(); this._oppdater();
    };
    window.addEventListener("ki-media-valgt", this._folgAv);
  }

  /* Kontroll-visning: bare kanaler, transport, volum og grupper */
  _oppdaterKontroll(s) {
    const r = this.shadowRoot, a = s.attributes || {};
    const spiller = this._spiller();
    const sp = r.querySelector('[data-t="spill"] ha-icon');
    if (sp) sp.setAttribute("icon", spiller ? "mdi:pause" : "mdi:play");
    const strom = r.querySelector('[data-t="strom"]');
    if (strom) {
      const av = ["off", "unavailable", "standby"].includes(s.state);
      strom.classList.toggle("av", av);
      strom.querySelector("ha-icon").setAttribute("icon", av ? "mdi:power" : "mdi:power-off");
    }
    const mute = r.querySelector('[data-v="av"]');
    if (mute) { mute.textContent = a.is_volume_muted ? "Dempet" : "Volum"; mute.style.opacity = a.is_volume_muted ? ".5" : ""; }
    const sh = r.querySelector('[data-t="shuffle"] ha-icon');
    if (sh) sh.setAttribute("icon", a.shuffle ? "mdi:shuffle" : "mdi:shuffle-disabled");
    const rp = r.querySelector('[data-t="repeat"] ha-icon');
    if (rp) rp.setAttribute("icon", a.repeat === "one" ? "mdi:repeat-once" : a.repeat === "all" ? "mdi:repeat" : "mdi:repeat-off");
    const vol = r.querySelector('input[type=range]');
    if (vol && document.activeElement !== vol) {
      const v = Math.round((a.volume_level || 0) * 100);
      vol.value = v; vol.style.setProperty("--p", v + "%");
      const t = r.querySelector(".vtall"); if (t) t.textContent = v + "%";
    }
    this._merkKanal(a, this._spiller() || this._pause());
    this._merkGrupper();
  }

  /* Hvilke spillere kan velges? Fra «velger», eller fra fanen vi står i. */
  _velgere() {
    const c = this._c;
    const fra = (x) => (Array.isArray(x) ? x : [x]).filter(Boolean).map((v) => (typeof v === "string"
      ? { entity: v, navn: this._navnFor(v) } : { ...v, navn: v.navn || this._navnFor(v.entity) }));
    if (c.velger) return fra(c.velger);
    if (this._faneListe) return fra(this._faneListe);
    return [];
  }
  _navnFor(id) {
    const st = this._h && this._h.states[id];
    return (st && st.attributes.friendly_name) || String(id).split(".").pop().replace(/_/g, " ");
  }

  _merkGrupper() {
    const h = this._h, c = this._c, r = this.shadowRoot;
    r.querySelectorAll("[data-g]").forEach((b) => {
      const g = (c.grupper || [])[+b.dataset.g];
      if (!g) return;
      /* gruppe kan være en bryter, eller en annen spiller som knyttes til */
      const pa = g.entity ? (h.states[g.entity] || {}).state === "on"
        : g.spiller ? ((h.states[this._id()] || {}).attributes || {}).group_members || [] : [];
      b.classList.toggle("pa", g.entity ? !!pa : Array.isArray(pa) && pa.includes(g.spiller));
    });
  }
  _merkKanal(a, lyder) {
    const r = this.shadowRoot;
    const kilde = String(a.media_channel || a.source || a.media_title || "").toLowerCase();
    r.querySelectorAll("[data-radio]").forEach((b) => {
      const v = this._radio[+b.dataset.radio], n = String(v.navn || "").toLowerCase();
      b.classList.toggle("spiller", !!lyder && !!n && (kilde.includes(n) || (n.includes(kilde) && kilde.length > 2)));
    });
  }

  _bygg() {
    const c = this._c, stor = c.visning === "stor";
    const kontroll = c.visning === "kontroll";
    const full = c.visning === "full" || kontroll;
    const eq = `<span class="eq"><i></i><i></i><i></i><i></i><i></i></span>`;
    if (stor) { this._byggStor(); return; }
    const velgere = this._velgere();
    this.shadowRoot.innerHTML = `<style>${KI_MEDIA_STIL}</style>
      <div class="rot">
        ${velgere.length > 1 ? `<div class="velger"><div class="vskinne" role="tablist">${velgere.map((v, i) =>
          `<button class="vknapp2 ${v.entity === this._id() ? "valgt" : ""} ${this._h.states[v.entity] ? "" : "mangler"}" data-velg="${kiMediaEsc(v.entity)}"
            title="${this._h.states[v.entity] ? "" : "Finner ikke " + kiMediaEsc(v.entity)}">
            ${v.ikon ? `<ha-icon icon="${kiMediaEsc(v.ikon)}"></ha-icon>` : ""}<i></i>${kiMediaEsc(v.navn)}</button>`).join("")}</div></div>` : ""}
        ${kontroll ? "" : `<div class="naa" role="button" tabindex="0">
          <div class="bakgrunn"></div>
          <div class="omslag"><ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon></div>
          <div class="tittel"><span class="rulle"><span class="tt"></span></span></div>
          <div class="under"></div>
          <div class="eqboks"><span class="tid"></span>${eq}</div>
          <div class="framdrift"><i></i></div>
        </div>`}

        ${full && this._radio.length ? `<div class="radio">${this._radio.map((r, i) =>
          `<button class="kanal" data-radio="${i}">${r.ikon ? `<ha-icon icon="${kiMediaEsc(r.ikon)}"></ha-icon>` : ""}
            <span>${kiMediaEsc(r.navn)}</span>
            <span class="bolge"><i></i><i></i><i></i><i></i></span></button>`).join("")}</div>` : ""}

        ${full ? `<div class="transport">
          <button class="tk liten" data-t="repeat" aria-label="Gjenta"><ha-icon icon="mdi:repeat-off"></ha-icon></button>
          <button class="tk midt2" data-t="forrige" aria-label="Forrige"><ha-icon icon="mdi:skip-backward"></ha-icon></button>
          ${(c.spillknapp || "spill") === "av_pa"
            ? `<button class="tk stor" data-t="strom" aria-label="Av eller på"><ha-icon icon="mdi:power"></ha-icon></button>`
            : `<button class="tk stor" data-t="spill" aria-label="Spill eller pause"><ha-icon icon="mdi:play"></ha-icon></button>`}
          <button class="tk midt2" data-t="neste" aria-label="Neste"><ha-icon icon="mdi:skip-forward"></ha-icon></button>
          <button class="tk liten" data-t="shuffle" aria-label="Tilfeldig"><ha-icon icon="mdi:shuffle-disabled"></ha-icon></button>
        </div>

        <div class="volum">
          <span class="vnavn" data-v="av" role="button" tabindex="0">Volum</span>
          <input type="range" min="0" max="100" step="1" value="0" aria-label="Volum">
          <div class="vtall">0%</div>
        </div>
        ${(c.grupper || []).length ? `<div class="gruppe">${(c.grupper || []).map((g, i) =>
          `<button class="gknapp" data-g="${i}">${kiMediaEsc(g.navn)}</button>`).join("")}</div>` : ""}` : ""}
      </div>`;

    const r = this.shadowRoot;
    const naa = r.querySelector(".naa");
    if (naa) {
      naa.addEventListener("click", () => this._mer());
      naa.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._mer(); } });
    }
    r.querySelectorAll("[data-velg]").forEach((b) => b.addEventListener("click", () => {
      this._valgt = b.dataset.velg;
      this._spillere = [this._valgt];
      this._bygg(); this._oppdater();
    }));
    r.querySelectorAll("[data-radio]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const v = this._radio[+b.dataset.radio];
      if (navigator.vibrate) navigator.vibrate(10);
      const mål = v.entity || v.skript;
      if (mål) {
        const dom = String(mål).split(".")[0];
        if (dom === "button" || dom === "input_button") this._h.callService(dom, "press", { entity_id: mål });
        else if (dom === "scene") this._h.callService("scene", "turn_on", { entity_id: mål });
        else if (dom === "switch" || dom === "input_boolean") this._h.callService(dom, "turn_on", { entity_id: mål });
        else if (dom === "script" && mål.includes(".")) { const [d, s2] = mål.split("."); this._h.callService(d, s2, {}); }
        else this._h.callService("media_player", "play_media", { entity_id: this._id(), media_content_id: mål, media_content_type: "music" });
      }
      else if (v.kilde) this._h.callService("media_player", "select_source", { entity_id: this._id(), source: v.kilde });
    }));
    r.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.t, s = this._st(), a = (s && s.attributes) || {};
      if (t === "strom") {
        const st = this._st();
        const av = !st || ["off", "unavailable", "standby", "idle"].includes(st.state);
        this._h.callService("media_player", av ? "turn_on" : "turn_off", { entity_id: this._id() });
      } else if (t === "spill") this._spillPause();
      else if (t === "neste") this._kall("neste", "media_next_track");
      else if (t === "forrige") this._kall("forrige", "media_previous_track");
      else if (t === "shuffle") this._kall("shuffle", "shuffle_set", { shuffle: !a.shuffle });
      else if (t === "repeat") {
        const nå = a.repeat || "off";
        this._kall("repeat", "repeat_set", { repeat: nå === "off" ? "all" : nå === "all" ? "one" : "off" });
      }
    }));
    r.querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => {
      const g = (c.grupper || [])[+b.dataset.g];
      if (navigator.vibrate) navigator.vibrate(8);
      if (g.entity) return this._h.callService("homeassistant", "toggle", { entity_id: g.entity });
      /* uten hjelpebryter: knytt spilleren til eller fra gruppa */
      const med = ((this._h.states[this._id()] || {}).attributes || {}).group_members || [];
      if (med.includes(g.spiller)) this._h.callService("media_player", "unjoin", { entity_id: g.spiller });
      else this._h.callService("media_player", "join", { entity_id: this._id(), group_members: [g.spiller] });
    }));
    r.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
      const st = this._st(), a = (st && st.attributes) || {};
      const naa = Math.round((a.volume_level || 0) * 100);
      if (navigator.vibrate) navigator.vibrate(8);
      if (b.dataset.v === "av") return this._h.callService("media_player", "volume_mute",
        { entity_id: this._id(), is_volume_muted: !a.is_volume_muted });
      const ny = Math.max(0, Math.min(100, naa + (b.dataset.v === "opp" ? 5 : -5)));
      this._h.callService("media_player", "volume_set", { entity_id: this._id(), volume_level: ny / 100 });
    }));
    const vol = r.querySelector('input[type=range]');
    if (vol) {
      vol.addEventListener("input", () => {
        r.querySelector(".vtall").textContent = vol.value + "%";
        vol.style.setProperty("--p", vol.value + "%");
      });
      vol.addEventListener("change", () => this._h.callService("media_player", "volume_set",
        { entity_id: this._id(), volume_level: +vol.value / 100 }));
    }
    this._bygget = true; this._start();
  }

  _oppdaterStor(s) {
    const c = this._c, r = this.shadowRoot, a = s.attributes;
    const spiller = this._spiller(), pause = this._pause(), aktiv = spiller || pause;
    const hero = r.querySelector(".hero");
    hero.classList.toggle("spiller", aktiv);

    const bilde = a.entity_picture || null;
    hero.classList.toggle("harbilde", !!bilde);
    r.querySelector(".bakgrunn").style.backgroundImage = bilde ? `url("${bilde}")` : "none";
    const om = r.querySelector(".hom");
    if (bilde) {
      if (om.dataset.bilde !== bilde) {
        om.dataset.bilde = bilde;
        om.innerHTML = `<div class="hring"></div><img src="${bilde}" alt="">`;
      }
      this._tone(bilde);
    } else if (om.dataset.bilde) {
      delete om.dataset.bilde;
      om.innerHTML = `<div class="hring"></div><ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon>`;
      this._settTone(null);
    }

    const sover = ["off", "idle", "standby", "unavailable", "unknown"].includes(s.state);

    /* seertid som piller, med puls på «i dag» mens det spilles */
    const kilder = this._tidkilder(), idag = this._timer(kilder.i_dag), mnd = this._timer(kilder.maned);
    const statEl = r.querySelector(".hstat");
    /* én samlet pille: i dag, og måneden som dempet tillegg */
    const stat = idag || mnd
      ? `<span class="sp ${this._spiller() ? "stiger" : ""}" title="Seertid i dag${mnd ? " og denne måneden" : ""}">
          <ha-icon icon="mdi:clock-outline"></ha-icon>${idag || "–"}${mnd ? `<em>· ${mnd}</em>` : ""}</span>`
      : "";
    if (statEl.innerHTML !== stat) statEl.innerHTML = stat;
    r.querySelector(".hhoyre").classList.toggle("medstat", !!stat);
    /* kildepille: spillernavn, og app eller kanal når det finnes */
    const navn = c.navn || (this._h.states[this._id()].attributes.friendly_name) || "Media";
    const kilde = a.media_channel || a.app_name || a.source || "";
    r.querySelector(".pnavn").textContent = !sover && kilde && kilde !== navn ? `${navn} · ${kilde}` : navn;
    r.querySelector(".pikon").setAttribute("icon", a.app_name || a.media_content_type === "tvshow" ? "mdi:television-play" : c.ikon);

    const tittel = (!sover && a.media_title) || (s.state === "off" ? "Av" : s.state === "unavailable" || s.state === "unknown" ? "Utilgjengelig"
      : sover ? "Ingenting spilles" : navn);
    const tt = r.querySelector(".tt"), rull = r.querySelector(".rulle");
    if (tt.textContent !== tittel) {
      tt.textContent = tittel;
      rull.classList.toggle("lang", tittel.length > 24);
      rull.querySelectorAll("span:not(.tt)").forEach((x) => x.remove());
      if (rull.classList.contains("lang")) tt.insertAdjacentHTML("afterend", `<span>${kiMediaEsc(tittel)}</span>`);
    }
    const under = (!sover && [a.media_artist, a.media_album_name].filter(Boolean).join(" · "))
      || (aktiv ? (a.media_series_title || kilde || "") : navn);
    const ha = r.querySelector(".hartist"); if (ha.textContent !== under) ha.textContent = under;

    const eq = r.querySelector(".eq");
    eq.style.display = aktiv ? "" : "none";
    eq.classList.toggle("pause", pause && !spiller);

    const spill = r.querySelector('[data-t="spill"] ha-icon');
    if (spill) spill.setAttribute("icon", spiller ? "mdi:pause" : "mdi:play");

    /* framdrift der varighet finnes, ellers levende bølge (radio) */
    const p = this._posisjon();
    r.querySelector(".hlinje").style.display = p ? "" : "none";
    const bolge = r.querySelector(".hbolge");
    bolge.style.display = p ? "none" : aktiv ? "" : "none";
    this._tikk();
  }

  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const s = h.states[this._id()];
    if (!s) {
      this._bygget = false;
      this.shadowRoot.innerHTML = `<style>${KI_MEDIA_STIL}</style><div class="feil">Fant ikke ${kiMediaEsc(this._id())}.</div>`;
      return;
    }
    if (!this._bygget) this._bygg();
    if (c.visning === "stor") return this._oppdaterStor(s);
    const r = this.shadowRoot, a = s.attributes, spiller = this._spiller(), pause = this._pause();
    const naa = r.querySelector(".naa");
    if (!naa) return this._oppdaterKontroll(s);      /* kontroll-visning: ingen topplinje */
    naa.classList.toggle("spiller", spiller || pause);
    naa.classList.toggle("av", !spiller && !pause);

    /* omslag og tone */
    const bilde = a.entity_picture ? (a.entity_picture.startsWith("http") ? a.entity_picture : a.entity_picture) : null;
    const om = r.querySelector(".omslag");
    naa.classList.toggle("harbilde", !!bilde);
    r.querySelector(".bakgrunn").style.backgroundImage = bilde ? `url("${bilde}")` : "none";
    if (bilde) {
      if (om.dataset.bilde !== bilde) { om.dataset.bilde = bilde; om.innerHTML = `<img src="${bilde}" alt="">`; }
      this._tone(bilde);
    } else if (om.dataset.bilde) { delete om.dataset.bilde; om.innerHTML = `<ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon>`; this._settTone(null); }

    /* tekst */
    const tittel = a.media_title || (s.state === "off" ? "Av" : s.state === "idle" ? "Ingenting spilles" : c.navn || "Media");
    const under = [a.media_artist, a.media_album_name, a.media_channel].filter(Boolean).join(" · ")
      || a.app_name || c.navn || "";
    const tt = r.querySelector(".tt");
    if (tt.textContent !== tittel) {
      tt.textContent = tittel;
      const rull = r.querySelector(".rulle");
      rull.classList.toggle("lang", tittel.length > 26);
      if (rull.classList.contains("lang") && rull.querySelectorAll("span").length < 2) tt.insertAdjacentHTML("afterend", `<span>${kiMediaEsc(tittel)}</span>`);
      else if (!rull.classList.contains("lang")) rull.querySelectorAll("span:not(.tt)").forEach((x) => x.remove());
    }
    const u = r.querySelector(".under"); if (u.textContent !== under) u.textContent = under;

    const eq = r.querySelector(".eq");
    eq.style.display = spiller || pause ? "" : "none";
    eq.classList.toggle("pause", pause && !spiller);

    /* transport */
    const spill = r.querySelector('[data-t="spill"]');
    if (spill) {
      spill.querySelector("ha-icon").setAttribute("icon", spiller ? "mdi:pause" : "mdi:play");
      spill.classList.toggle("spiller", spiller);
    }
    const sh = r.querySelector('[data-t="shuffle"]');
    if (sh) { sh.querySelector("ha-icon").setAttribute("icon", a.shuffle ? "mdi:shuffle-variant" : "mdi:shuffle-disabled"); sh.classList.toggle("pa", !!a.shuffle); }
    const rp = r.querySelector('[data-t="repeat"]');
    if (rp) {
      const v = a.repeat || "off";
      rp.querySelector("ha-icon").setAttribute("icon", v === "one" ? "mdi:repeat-once" : v === "off" ? "mdi:repeat-off" : "mdi:repeat-variant");
      rp.classList.toggle("pa", v !== "off");
    }

    /* volum og grupper */
    const vol = r.querySelector('input[type=range]');
    if (vol && a.volume_level !== undefined && document.activeElement !== vol) {
      const p = Math.round(a.volume_level * 100);
      vol.value = p; vol.style.setProperty("--p", p + "%");
      r.querySelector(".vtall").textContent = p + "%";
    }
    const mute2 = r.querySelector('[data-v="av"]');
    if (mute2 && mute2.classList.contains("vnavn")) {
      mute2.textContent = a.is_volume_muted ? "Dempet" : "Volum";
      mute2.style.opacity = a.is_volume_muted ? ".5" : "";
    }
    this._merkGrupper();
    this._merkKanal(a, spiller || pause);

    this._tikk();
  }
}
if (!customElements.get("ki-media-card")) customElements.define("ki-media-card", KiMediaCard);

class KiMediaCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { media: "Mediaspiller", visning: "Visning", navn: "Navn", ikon: "Ikon uten omslag",
        i_dag: "Seertid i dag", maned: "Seertid denne måned" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "media", required: true, selector: { entity: { domain: ["media_player"] } } },
      { name: "visning", selector: { select: { mode: "dropdown", options: [
        { value: "full", label: "Alt (nå spilles, kanaler, transport, volum)" },
        { value: "stor", label: "Stor (180 px med omslag)" },
        { value: "naa", label: "Bare nå spilles" }] } } },
      { name: "navn", selector: { text: {} } }, { name: "ikon", selector: { icon: {} } },
      { name: "i_dag", selector: { entity: { domain: ["sensor"] } } },
      { name: "maned", selector: { entity: { domain: ["sensor"] } } },
    ];
  }
}
if (!customElements.get("ki-media-card-editor")) customElements.define("ki-media-card-editor", KiMediaCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-media-card")) window.customCards.push({ type: "ki-media-card", name: "KI Media", description: "Nå spilles med levende omslag, transport, volum og radiokanaler", preview: true });

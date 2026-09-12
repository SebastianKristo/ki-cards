/* ki-jul-card – julelysene fra KI Lys, i samme form som julepopupen.
 *
 * type: custom:ki-jul-card
 * nedtelling: sensor.ki_jul_nedtelling   # oppdages automatisk
 * faner: [lys, automasjon]
 * hero: true                            # julekortscene øverst (hero: false skrur den av)
 * sveip: true                           # sveip mellom julekortet og nedtellingen
 * snoe: true                            # snø over hele kortet i julesesongen
 * dato: '2026-12-24'                    # se hvordan kortet ser ut en bestemt dag
 * sesong: switch.ki_jul_sesong          # trykk på kortet styrer denne (oppdages automatisk)
 * automasjoner:                          # valgfritt, vises i Automasjon-fanen
 *   - {entity: automation.julelys_sla_pa_1_november, navn: Slå på, under: 1. november, ikon: mdi:calendar-arrow-right}
 */
const KI_JUL_VERSJON = "1.4.0";

const KI_JUL_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { position:relative; display:grid; gap:12px; max-width:100%; }

  /* snø over hele kortet, ikke bare i scenen */
  .snolag { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:3; border-radius:24px; }
  .snolag i { position:absolute; top:-8px; width:5px; height:5px; border-radius:50%; background:#fff;
    opacity:.5; animation:jul-drys linear infinite; }
  @keyframes jul-drys { 0% { transform:translateY(-8px) translateX(0) scale(.8); opacity:0; }
    12% { opacity:.55; } 100% { transform:translateY(var(--h,900px)) translateX(24px) scale(1.1); opacity:0; } }

  /* sveip mellom julekortet og nedtellingen */
  .sveip { position:relative; overflow:hidden; touch-action:pan-y; }
  .spor { display:flex; transition:transform .35s var(--myk); will-change:transform; align-items:stretch; }
  .spor.drar { transition:none; }
  .side { flex:0 0 100%; min-width:0; display:flex; }
  .side > * { flex:1; }
  .prikker { display:flex; gap:6px; justify-content:center; padding:8px 0 0; }
  .prikker i { width:7px; height:7px; border-radius:50%; background:var(--gray1000); opacity:.25;
    transition:opacity .25s, transform .25s; cursor:pointer; }
  .prikker i.valgt { opacity:.95; transform:scale(1.15); }

  /* scenen som vokser ut av julesesong-flisen */
  .utvidet { position:absolute; left:0; right:0; top:0; z-index:4; border-radius:var(--ha-card-border-radius,24px);
    overflow:hidden; clip-path:inset(var(--t,0) var(--r,0) var(--b,0) var(--l,0) round 24px);
    transition:clip-path .55s var(--myk); }
  .utvidet.lukker { clip-path:inset(var(--t0,0) var(--r0,0) var(--b0,0) var(--l0,0) round 24px); }
  .utvidet .scene { height:100%; border-radius:0; }
  .utvidet .scene svg { position:absolute; inset:0; width:100%; height:100%; }
  .utvidet .scenetekst { left:20px; bottom:18px; }
  .utvidet .scenetekst b { font-size:24px; }
  .utvidet .scenetekst span { display:none; }          /* tallet står til høyre i stedet */
  .utvidet .lukk { position:absolute; right:14px; top:14px; z-index:5; width:34px; height:34px; border:0;
    border-radius:50%; background:rgba(0,0,0,.35); color:#fff; cursor:pointer; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:20px; }
  .utvidet .telling { position:absolute; right:18px; bottom:16px; text-align:right; color:#fff; }
  .utvidet .telling b { display:block; font-size:34px; font-weight:300; line-height:1; }
  .utvidet .telling span { font-size:13px; opacity:.75; }

  /* nedtellingskortet – samme oppsett som button-card-utgaven */
  .tell { position:relative; height:200px; background:var(--gray200); border-radius:var(--ha-card-border-radius,24px);
    overflow:hidden; display:grid; cursor:pointer;
    grid-template-areas:"n i" "dager maal" "merker merker" "bar bar";
    grid-template-columns:1fr min-content; grid-template-rows:min-content 1fr min-content min-content; }
  .tell .tit { grid-area:n; align-self:center; padding-left:20px; font-size:14px; opacity:.7; }
  .tell .rund { grid-area:i; justify-self:end; align-self:start; width:58px; height:58px; margin:4px;
    border-radius:50%; background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center;
    --mdc-icon-size:30px; }
  .tell .dager { grid-area:dager; align-self:end; padding-left:20px; font-size:2em; font-weight:300; line-height:1.5em; }
  .tell .dager small { font-size:14px; opacity:.7; margin-left:4px; }
  .tell .maal { grid-area:maal; justify-self:end; align-self:end; font-size:14px; opacity:.7;
    padding:0 20px 9px 0; }
  .tell .merker { grid-area:merker; display:flex; justify-content:space-between; font-size:12px; opacity:.5;
    padding:0 20px 4px; }
  .tell .bar { grid-area:bar; height:30px; overflow:hidden; border-bottom-left-radius:34px;
    border-bottom-right-radius:34px; }
  .tell .bar i { display:block; height:30px; transition:width .6s var(--myk); }
  /* snø som daler i julesesongen */
  .sno { position:absolute; inset:0; pointer-events:none; }
  .sno i { position:absolute; top:-8px; width:4px; height:4px; border-radius:50%; background:#fff; opacity:.45;
    animation:jul-sno linear infinite; }
  @keyframes jul-sno { 0% { transform:translateY(-8px) translateX(0); opacity:0; }
    10% { opacity:.5; } 100% { transform:translateY(170px) translateX(14px); opacity:0; } }

  /* julekortscenen */
  .scene { position:relative; height:200px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden;
    background:linear-gradient(180deg,#101b2e 0%,#17283f 55%,#1d3350 100%); cursor:pointer; }
  .scene svg { position:absolute; inset:0; width:100%; height:100%; }
  .stjerne-himmel circle { animation:jul-blink 3.4s ease-in-out infinite; }
  @keyframes jul-blink { 0%,100% { opacity:.25; } 50% { opacity:.9; } }
  .royk { opacity:0; animation:jul-royk 6s ease-out infinite; }
  .royk.r2 { animation-delay:-2s; } .royk.r3 { animation-delay:-4s; }
  @keyframes jul-royk { 0% { opacity:0; transform:translate(0,0) scale(.6); }
    20% { opacity:.5; } 100% { opacity:0; transform:translate(-10px,-34px) scale(1.6); } }
  .snoefall i { animation:jul-fall linear infinite; }
  @keyframes jul-fall { 0% { transform:translateY(-10px) translateX(0); opacity:0; }
    10% { opacity:.75; } 100% { transform:translateY(210px) translateX(16px); opacity:0; } }
  /* pærer i hekken – lyser etter tur når utelyset står på */
  .paere { opacity:.3; }
  .scene.ute .paere { animation:jul-paere 2.6s ease-in-out infinite; }
  @keyframes jul-paere { 0%,100% { opacity:.25; } 50% { opacity:1; } }
  .vindu { fill:#3b4a63; transition:fill .6s var(--myk); }
  .scene.inne .vindu { fill:#e0b45f; }
  .stjerne { opacity:.2; transform-box:fill-box; transform-origin:center; }
  .scene.stjerne-pa .stjerne { opacity:1; animation:jul-puls 3.2s ease-in-out infinite; }
  @keyframes jul-puls { 0%,100% { transform:scale(1); filter:none; } 50% { transform:scale(1.08); } }
  .flamme { opacity:0; transform-box:fill-box; transform-origin:50% 100%; }
  .scene.stake-pa .flamme { opacity:1; animation:jul-flamme 1.7s ease-in-out infinite; }
  .scene.stake-pa .flamme.f2 { animation-delay:-.6s; } .scene.stake-pa .flamme.f3 { animation-delay:-1.1s; }
  @keyframes jul-flamme { 0%,100% { transform:scaleY(1) rotate(-4deg); } 50% { transform:scaleY(1.25) rotate(4deg); } }
  /* julaften: nissen på taket og reinsdyr i hagen */
  .nisse { transform-box:fill-box; transform-origin:50% 100%; animation:jul-nisse 3.4s ease-in-out infinite; }
  @keyframes jul-nisse { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-3px) rotate(2deg); } }
  .sekk { transform-box:fill-box; transform-origin:50% 0; animation:jul-sekk 3.4s ease-in-out infinite; }
  @keyframes jul-sekk { 0%,100% { transform:rotate(-3deg); } 50% { transform:rotate(3deg); } }
  .rein { transform-box:fill-box; transform-origin:50% 100%; animation:jul-rein 4.6s ease-in-out infinite; }
  .rein.r2 { animation-delay:-1.8s; }
  @keyframes jul-rein { 0%,100% { transform:translateX(0); } 50% { transform:translateX(6px); } }
  .reinhode { transform-box:fill-box; transform-origin:80% 100%; animation:jul-beite 5.2s ease-in-out infinite; }
  @keyframes jul-beite { 0%,60%,100% { transform:rotate(0deg); } 75% { transform:rotate(26deg); } }

  /* nyttårsaften: fyrverkeri */
  .rakett { transform-box:fill-box; animation:jul-rakett 4s ease-out infinite; }
  .rakett.f2 { animation-delay:-1.4s; } .rakett.f3 { animation-delay:-2.6s; }
  @keyframes jul-rakett { 0% { opacity:0; transform:scale(.1); } 12% { opacity:1; }
    55% { opacity:.9; transform:scale(1); } 100% { opacity:0; transform:scale(1.25); } }
  .rakett line { stroke-linecap:round; }

  .sesongmerke { position:absolute; right:16px; top:16px; font-size:11px; font-weight:700; letter-spacing:.03em;
    padding:6px 12px; border-radius:999px; background:rgba(255,255,255,.14); backdrop-filter:blur(6px); }
  .scene.inne .sesongmerke { background:var(--yellow); color:var(--black,#000); }
  .scene::after { content:""; position:absolute; left:0; right:0; bottom:0; height:86px; pointer-events:none;
    background:linear-gradient(180deg, rgba(8,14,26,0) 0%, rgba(8,14,26,.72) 70%, rgba(8,14,26,.85) 100%); }
  .scenetekst { position:absolute; left:18px; bottom:14px; z-index:2; }
  .scenetekst b { display:block; font-size:19px; font-weight:600; text-shadow:0 2px 10px rgba(0,0,0,.75); }
  .scenetekst span { font-size:13px; opacity:.85; text-shadow:0 1px 6px rgba(0,0,0,.8); }
  .sesongmerke { z-index:2; }

  /* to fliser: sesong og antall tent */
  .fliser { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .flis { position:relative; height:160px; background:var(--gray200); border-radius:var(--ha-card-border-radius,24px);
    padding:4px 4px 12px 20px; display:grid; grid-template-areas:"n i" "verdi knapp";
    grid-template-columns:1fr min-content; grid-template-rows:min-content 1fr; cursor:pointer; }
  .flis.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .flis .tit { grid-area:n; font-size:14px; opacity:.7; align-self:center; }
  .flis .rund { grid-area:i; justify-self:end; align-self:start; width:58px; height:58px; border-radius:50%;
    background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .flis.pa .rund { background:rgba(0,0,0,.12); }
  .flis .verdi { grid-area:verdi; align-self:end; font-size:2em; font-weight:300; line-height:1.5em; }
  .flis .verdi small { font-size:14px; opacity:.7; margin-left:4px; }
  .flis .knapp { grid-area:knapp; justify-self:end; align-self:end; padding-right:10px; line-height:0;
    --mdc-icon-size:60px; color:var(--gray400); }
  .flis.pa .knapp { color:var(--black,#000); }

  /* to handlinger */
  .handlinger { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .hknapp { height:66px; background:var(--gray200); border:0; border-radius:var(--ha-card-border-radius,24px);
    color:var(--gray1000); font:inherit; display:grid; grid-template-columns:76px 1fr; align-items:center;
    cursor:pointer; text-align:left; padding:0; }
  .hknapp .rund { width:56px; height:56px; margin:0 4px; border-radius:50%; background:rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .hknapp b { font-size:16px; font-weight:500; }
  .hknapp:active { transform:scale(.98); }
`;

const KI_JUL_STIL2 = `
  /* faner, som i resten av kortene */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:3px; border:1px solid rgba(255,255,255,.3); border-radius:999px; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:15px; font-weight:500;
    padding:9px 22px; border-radius:999px; cursor:pointer; white-space:nowrap; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }

  /* overskriftsrad */
  .overskrift { display:grid; grid-template-columns:min-content min-content 1fr; align-items:center; gap:12px;
    padding:4px 0 8px; }
  .overskrift ha-icon { --mdc-icon-size:22px; }
  .overskrift b { font-size:16px; font-weight:500; white-space:nowrap; }
  .overskrift span { font-size:14px; opacity:.7; }

  /* lysrad – samme pilleform som jul_toggle */
  .rad { height:66px; border-radius:75px; background:var(--gray200); color:var(--gray1000);
    display:grid; grid-template-columns:76px 1fr min-content; grid-template-areas:"i n knapp" "i u knapp";
    align-items:center; padding:4px 20px 4px 4px; cursor:pointer; margin-bottom:8px;
    transition:background .25s var(--myk); }
  .rad.pa { background:var(--yellow); color:var(--black,#000); }
  .rad.automasjon.pa { background:var(--active-big,#ee95ff); }
  .rad.borte { opacity:.4; }
  .rad .rund { grid-area:i; width:58px; height:58px; border-radius:50%; background:rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .rad.pa .rund { background:rgba(0,0,0,.12); }
  .rad .n { grid-area:n; align-self:end; font-size:16px; font-weight:500; padding-top:4px; }
  .rad .u { grid-area:u; align-self:start; font-size:14px; opacity:.7; padding-bottom:7px; }
  .rad .knapp { grid-area:knapp; justify-self:end; line-height:0; --mdc-icon-size:50px; color:var(--gray400); }
  .rad.pa .knapp { color:var(--black,#000); }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiJulEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiJulCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "lys"; }
  static getConfigElement() { return document.createElement("ki-jul-card-editor"); }
  static getStubConfig() { return { faner: ["lys", "automasjon"] }; }
  getCardSize() { return 12; }

  setConfig(c) { this._c = { faner: ["lys", "automasjon"], ...(c || {}) }; this._forrige = null; }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || this._endret(g, h)) this._tegn();
  }
  _endret(g, h) {
    const ids = [this._id(), ...this._lys(), ...(this._c.automasjoner || []).map((x) => x.entity || x)];
    return ids.filter(Boolean).some((id) => g.states[id] !== h.states[id]);
  }

  /* Nedtellingssensoren fra KI Lys */
  _id() {
    if (this._c && this._c.nedtelling) return this._c.nedtelling;
    const h = this._h; if (!h) return null;
    return Object.keys(h.states).find((x) => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_lys" && a.ki_type === "jul";
    });
  }
  _d() { const s = this._h && this._id() ? this._h.states[this._id()] : null; return s ? s.attributes : null; }
  _lys() { const d = this._d(); return (d && d.lys) || []; }
  _paa(id) { const s = this._h && this._h.states[id]; return !!s && s.state === "on"; }

  _veksle(id) {
    if (!id) return;
    if (navigator.vibrate) navigator.vibrate(10);
    const dom = String(id).split(".")[0];
    this._h.callService(dom === "automation" ? "automation" : dom, "toggle", { entity_id: id });
  }
  /* Julesesong-bryteren fra KI Lys, hvis den finnes */
  _sesongBryter() {
    const h = this._h; if (!h) return null;
    return Object.keys(h.states).find((x) => {
      if (!x.startsWith("switch.")) return false;
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_lys" && a.ki_type === "jul_sesong";
    }) || (this._c && this._c.sesong) || null;
  }
  _sesongPaa() {
    const id = this._sesongBryter();
    return id ? this._paa(id) : (this._d() || {}).tent > 0;
  }
  _veksleSesong() {
    const id = this._sesongBryter();
    if (navigator.vibrate) navigator.vibrate(10);
    if (id) return this._h.callService("switch", "toggle", { entity_id: id });
    this._alle(!this._sesongPaa());          /* uten bryteren tar vi lysene direkte */
  }

  _alle(pa) {
    if (navigator.vibrate) navigator.vibrate(10);
    const h = this._h;
    const knapp = Object.keys(h.states).find((x) => x.startsWith("button.") && (() => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_lys" && a.ki_type === "jul_knapp" && !!a.pa === pa;
    })());
    if (knapp) return h.callService("button", "press", { entity_id: knapp });
    /* uten knappene fra integrasjonen tar vi lysene direkte */
    this._lys().forEach((x) => h.callService(String(x).split(".")[0], pa ? "turn_on" : "turn_off", { entity_id: x }));
  }
  _mer(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  /* Julekort: hus med lysslynge i hekken, stjerne og lysestake i vinduene.
     Lysene i tegningen følger lysene som faktisk står på. */
  _scene(d) {
    const grupper = d.grupper || [];
    const pa = (id) => (grupper.find((g) => g.id === id) || { lys: [] }).lys.some((x) => this._paa(x.entity));
    const stjerne = pa("stjerner"), stake = pa("staker"), ute = pa("ute");
    const inne = stjerne || stake || (d.tent || 0) > 0;
    const fig = this._dagensFigurer();

    const stjerner = Array.from({ length: 14 }, (_, i) =>
      `<circle cx="${(i * 27 + 14) % 360}" cy="${(i * 13) % 60 + 8}" r="${i % 3 === 0 ? 1.6 : 1.1}"
        fill="#fff" style="animation-delay:-${(i * 0.42).toFixed(1)}s"/>`).join("");

    /* hekken foran huset, med pærerad langs toppen */
    const paerer = Array.from({ length: 16 }, (_, i) => {
      const x = 18 + i * 21, y = 166 + Math.sin(i * 1.25) * 7;
      const f = ["#ff8f8f", "#ffd98a", "#8fd3ff", "#a6f0a6"][i % 4];
      return `<circle class="paere" cx="${x}" cy="${y}" r="3.6" fill="${f}"
        style="animation-delay:-${(i * 0.17).toFixed(2)}s"/>`;
    }).join("");

    const snø = Array.from({ length: 16 }, (_, i) =>
      `<i style="position:absolute;left:${(i * 6.4 + 2).toFixed(0)}%;top:-6px;width:4px;height:4px;
        border-radius:50%;background:#fff;opacity:.6;animation-duration:${(7 + (i % 6) * 1.6).toFixed(1)}s;
        animation-delay:-${(i * 1.1).toFixed(1)}s"></i>`).join("");

    return `<div class="scene ${ute ? "ute" : ""} ${inne ? "inne" : ""}
      ${stjerne ? "stjerne-pa" : ""} ${stake ? "stake-pa" : ""}" data-mer="1" role="button" tabindex="0">
      <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <g class="stjerne-himmel">${stjerner}</g>
        ${fig.fyrverkeri}

        <!-- grantrær i bakgrunnen -->
        <g fill="#16321f" opacity=".9">
          <path d="M40 150 62 96l22 54z"/><path d="M48 126 62 92l14 34z"/>
          <path d="M300 152 322 100l22 52z"/>
        </g>

        <!-- huset -->
        <g>
          <path d="M118 96 186 52l68 44v72H118z" fill="#243c57"/>
          <path d="M110 100 186 46l76 54-6 8-70-50-70 50z" fill="#f2f6ff" opacity=".9"/>
          <rect x="228" y="60" width="14" height="26" rx="2" fill="#243c57"/>
          <g fill="#eaf6ff">
            <circle class="royk" cx="235" cy="56" r="5"/>
            <circle class="royk r2" cx="235" cy="56" r="4"/>
            <circle class="royk r3" cx="235" cy="56" r="6"/>
          </g>
          <!-- vindu med julestjerne -->
          <rect class="vindu" x="136" y="112" width="34" height="30" rx="4"/>
          <g class="stjerne">
            <circle cx="153" cy="127" r="13" fill="#fff3c4" opacity=".22"/>
            <path d="M153 113l4.5 10.5 10.5 4.5-10.5 4.5-4.5 10.5-4.5-10.5-10.5-4.5 10.5-4.5z"
              fill="#fff6d6" stroke="#8a6a18" stroke-width="1.2" stroke-linejoin="round"/>
          </g>
          <!-- vindu med lysestake -->
          <rect class="vindu" x="200" y="112" width="34" height="30" rx="4"/>
          <g fill="#8a6a18">
            <path d="M206 140h22v3h-22z"/><path d="M215 128h4v12h-4z"/>
            <path d="M207 132h3v8h-3zM224 132h3v8h-3z"/>
            <path d="M209 136h16v2h-16z" opacity=".7"/>
          </g>
          <g fill="#fff2b0">
            <path class="flamme" d="M217 128c2-2 .8-4 0-5-.8 1-2 3 0 5z"/>
            <path class="flamme f2" d="M208.5 132c2-2 .8-4 0-5-.8 1-2 3 0 5z"/>
            <path class="flamme f3" d="M225.5 132c2-2 .8-4 0-5-.8 1-2 3 0 5z"/>
          </g>
          <rect x="176" y="126" width="20" height="42" rx="3" fill="#1b2c42"/>
        </g>

        ${fig.nisse}
        ${fig.rein}

        <!-- snødekt bakke først, så hekken foran -->
        <path d="M0 178q60-8 120 0t120 0 120 0v22H0z" fill="#e8eefc" opacity=".95"/>
        <path d="M0 172q26-20 52-6t52-2 52 6 52-8 52 6 52-4 48 8v28H0z" fill="#1f4029"/>
        <path d="M0 172q26-20 52-6t52-2 52 6 52-8 52 6 52-4 48 8" fill="none" stroke="#356c40" stroke-width="3.5" opacity=".95"/>
        <path d="M10 176q34-12 68 0t68 0 68 0 68 0 40 0" fill="none" stroke="#2a5433" stroke-width="2" opacity=".7"/>
        ${paerer}
      </svg>
      <div class="snoefall" style="position:absolute;inset:0;pointer-events:none">${snø}</div>
      <span class="sesongmerke">${(d.tent || 0) > 0 ? "Tent" : "Slukket"}</span>
      <div class="scenetekst"><b>${kiJulEsc(fig.nyttaar ? "Godt nytt år"
        : fig.julaften ? "God jul" : d.fase === "jul" ? "Snart jul" : "Venter på jul")}</b>
        <span>${d.tent || 0} av ${d.antall || (d.lys || []).length} lys tent</span></div>
    </div>`;
  }

  /* Julaften: nissen på taket, reinsdyr i hagen. Nyttårsaften: fyrverkeri. */
  _dagensFigurer() {
    const nå = this._c && this._c.dato ? new Date(this._c.dato + "T12:00:00") : new Date();
    const julaften = nå.getMonth() === 11 && nå.getDate() === 24;
    const nyttaar = nå.getMonth() === 11 && nå.getDate() === 31;

    const nisse = julaften ? `
      <g transform="translate(-24 4)"><g class="nisse">
        <!-- kropp -->
        <path d="M200 62q12-6 24 0l4 22h-32z" fill="#d9433f"/>
        <path d="M196 84h32v5h-32z" fill="#3b2a1d"/>
        <!-- armer -->
        <path d="M200 68l-10 8" stroke="#d9433f" stroke-width="6" stroke-linecap="round"/>
        <path d="M224 68l10 6" stroke="#d9433f" stroke-width="6" stroke-linecap="round"/>
        <!-- skjegg og ansikt -->
        <circle cx="212" cy="55" r="9" fill="#f3d9bd"/>
        <path d="M203 56q9 16 18 0 2 10-9 12t-9-12z" fill="#fff"/>
        <circle cx="209" cy="53" r="1.3" fill="#3b2a1d"/><circle cx="215" cy="53" r="1.3" fill="#3b2a1d"/>
        <circle cx="212" cy="57" r="1.8" fill="#e08a7a"/>
        <!-- lue -->
        <path d="M201 48q11-14 22 0z" fill="#d9433f"/>
        <path d="M200 47h24v5h-24z" fill="#fff"/>
        <path d="M223 47q8-4 10-10" stroke="#d9433f" stroke-width="5" stroke-linecap="round" fill="none"/>
        <circle cx="234" cy="36" r="3.4" fill="#fff"/>
      </g></g>
      <g transform="translate(-24 4)"><g class="sekk">
        <path d="M236 70q16 4 13 18-14 5-19-5z" fill="#8a5a2b"/>
        <path d="M236 70q6-4 12-2" stroke="#6d461f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </g></g>` : "";

    const rein = julaften ? `
      <g class="rein">
        <path d="M64 178v-14M76 178v-14" stroke="#6b4a2f" stroke-width="3" stroke-linecap="round"/>
        <rect x="58" y="152" width="26" height="14" rx="6" fill="#8a5f3a"/>
        <g class="reinhode">
          <circle cx="88" cy="150" r="7" fill="#8a5f3a"/>
          <path d="M85 143l-4-8M91 143l4-8M81 135l-5-3M95 135l5-3" stroke="#5d4028" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="93" cy="151" r="2.2" fill="#ff6b6b"/>
        </g>
      </g>
      <g class="rein r2" opacity=".85">
        <path d="M276 180v-12M286 180v-12" stroke="#6b4a2f" stroke-width="3" stroke-linecap="round"/>
        <rect x="270" y="158" width="22" height="12" rx="5" fill="#7a5232"/>
        <circle cx="296" cy="156" r="6" fill="#7a5232"/>
        <path d="M293 150l-3-7M299 150l3-7" stroke="#5d4028" stroke-width="2.2" stroke-linecap="round"/>
      </g>` : "";

    const fyrverkeri = nyttaar ? [0, 1, 2].map((i) => {
      const cx = [90, 200, 290][i], cy = [46, 30, 58][i];
      const farge = ["#ffd98a", "#ff9ec4", "#8fd3ff"][i];
      const straaler = Array.from({ length: 12 }, (_, k) => {
        const v = (k / 12) * Math.PI * 2;
        return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(v) * 26).toFixed(1)}"
          y2="${(cy + Math.sin(v) * 26).toFixed(1)}" stroke="${farge}" stroke-width="2" opacity=".9"/>`;
      }).join("");
      return `<g class="rakett ${i ? "f" + (i + 1) : ""}" style="transform-origin:${cx}px ${cy}px">
        ${straaler}<circle cx="${cx}" cy="${cy}" r="3" fill="${farge}"/></g>`;
    }).join("") : "";

    return { nisse, rein, fyrverkeri, julaften, nyttaar };
  }

  _nedtelling(d) {
    const jul = d.fase === "jul";
    const farge = jul ? "var(--red)" : "var(--active-big,#ee95ff)";
    const pct = Math.max(0, Math.min(100, Number(d.prosent) || 0));
    const n = Number(d.dager);
    const dagtekst = isNaN(n) ? "––" : n === 0 ? "I dag"
      : `${n}<small>${n === 1 ? "dag" : "dager"}</small>`;
    const snø = jul ? `<div class="sno">${Array.from({ length: 12 }, (_, i) =>
      `<i style="left:${(i * 8.3 + 3).toFixed(0)}%;animation-duration:${(6 + (i % 5) * 1.7).toFixed(1)}s;
        animation-delay:-${(i * 1.3).toFixed(1)}s"></i>`).join("")}</div>` : "";
    return `<div class="tell" data-mer="1" role="button" tabindex="0">
      ${snø}
      <div class="tit">${kiJulEsc(d.overskrift || "Jul")}</div>
      <div class="rund"><ha-icon icon="${jul ? "mdi:pine-tree" : "mdi:calendar-star"}"></ha-icon></div>
      <div class="dager">${dagtekst}</div>
      <div class="maal">${kiJulEsc(d.maal_dato || "")}</div>
      <div class="merker"><span>${kiJulEsc(d.fra_tekst || "")}</span><span>${Math.round(pct)}%</span>
        <span>${kiJulEsc(d.til_tekst || "")}</span></div>
      <div class="bar" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 2px,${farge} 3px,transparent 4px)">
        <i style="background:${farge};width:${pct}%"></i></div>
    </div>`;
  }

  _fliser(d) {
    const tent = Number(d.tent) || 0;
    const antall = Number(d.antall) || (d.lys || []).length;
    const pa = tent > 0;
    return `<div class="fliser">
      <div class="flis ${pa ? "pa" : ""}" data-sesong="1" role="button" tabindex="0">
        <div class="tit">Julesesong</div>
        <div class="rund"><ha-icon icon="mdi:pine-tree"></ha-icon></div>
        <div class="verdi">${pa ? "På" : "Av"}</div>
        <div class="knapp"><ha-icon icon="${pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}"></ha-icon></div>
      </div>
      <div class="flis" data-mer="1" role="button" tabindex="0">
        <div class="tit">Tent nå</div>
        <div class="rund"><ha-icon icon="mdi:string-lights"></ha-icon></div>
        <div class="verdi">${tent}<small>av ${antall}</small></div>
      </div>
    </div>`;
  }

  _handlinger() {
    return `<div class="handlinger">
      <button class="hknapp" data-alle="av"><span class="rund"><ha-icon icon="mdi:lightbulb-off-outline"></ha-icon></span><b>Alle av</b></button>
      <button class="hknapp" data-alle="pa"><span class="rund"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon></span><b>Alle på</b></button>
    </div>`;
  }

  _rad(x, klasse) {
    const pa = this._paa(x.entity);
    const st = this._h.states[x.entity];
    const borte = !st || st.state === "unavailable";
    return `<div class="rad ${klasse || ""} ${pa ? "pa" : ""} ${borte ? "borte" : ""}"
      data-veksle="${kiJulEsc(x.entity)}" role="switch" aria-checked="${pa}" tabindex="0">
      <span class="rund"><ha-icon icon="${kiJulEsc(x.ikon || "mdi:string-lights")}"></ha-icon></span>
      <span class="n">${kiJulEsc(x.navn)}</span>
      <span class="u">${kiJulEsc(x.under || "")}</span>
      <span class="knapp"><ha-icon icon="${pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}"></ha-icon></span>
    </div>`;
  }

  _panelLys(d) {
    const grupper = d.grupper || [];
    if (!grupper.length) return `<div class="tom">Ingen julelys valgt i KI Lys ennå.</div>`;
    return grupper.map((g) => `
      <div class="overskrift"><ha-icon icon="${kiJulEsc(g.ikon)}"></ha-icon><b>${kiJulEsc(g.navn)}</b>
        <span>${g.antall} stk</span></div>
      ${(g.lys || []).map((x) => this._rad({
        entity: x.entity, navn: x.navn, under: x.undertekst, ikon: g.ikon,
      })).join("")}`).join("");
  }

  _panelAutomasjon(d) {
    const c = this._c;
    let rader = c.automasjoner;
    if (!rader) {
      /* finner julens egne automasjoner selv */
      rader = Object.keys(this._h.states)
        .filter((x) => x.startsWith("automation.") && /jul/i.test(x))
        .map((x) => {
          const a = this._h.states[x].attributes || {};
          const navn = a.friendly_name || x.split(".").pop().replace(/_/g, " ");
          const m = String(navn).match(/(\d+\.?\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember))/i);
          return {
            entity: x,
            navn: (String(navn).replace(/\s*\d+\.?\s*\w+$/, "").replace(/^(varsel|julelys)\s*/i, "").trim() || navn)
              .replace(/^./, (c) => c.toUpperCase()),
            under: m ? m[1] : "Automasjon",
            ikon: /varsel|påminn/i.test(navn) ? "mdi:bell-ring" : /av\b|slutt/i.test(navn) ? "mdi:calendar-remove" : "mdi:calendar-arrow-right",
          };
        });
    } else {
      rader = rader.map((x) => (typeof x === "string" ? { entity: x } : x)).map((x) => ({
        ...x, navn: x.navn || (this._h.states[x.entity] || { attributes: {} }).attributes.friendly_name || x.entity,
      }));
    }
    if (!rader.length) return `<div class="tom">Fant ingen juleautomasjoner.</div>`;
    return `<div class="overskrift"><ha-icon icon="mdi:calendar-sync-outline"></ha-icon><b>Sesong</b>
        <span>${kiJulEsc(d.sesong_fra || "")} – ${kiJulEsc(d.sesong_til || "")}</span></div>
      ${rader.map((x) => this._rad(x, "automasjon")).join("")}`;
  }

  /* Julekortet vokser ut av julesesong-flisen, som nattkortet gjør */
  _utvid(flis) {
    const r = this.shadowRoot, rot = r.querySelector(".rot");
    if (!rot || r.querySelector(".utvidet") || !flis) return;
    const d = this._d(); if (!d) return;
    const rf = rot.getBoundingClientRect(), ff = flis.getBoundingClientRect();
    /* laget dekker toppen av kortet – ikke hele lista under */
    const hoyde = Math.min(rf.height, 420);
    const inset = {
      t: Math.round(ff.top - rf.top),
      b: Math.max(0, Math.round(hoyde - (ff.bottom - rf.top))),
      l: Math.round(ff.left - rf.left),
      r: Math.round(rf.right - ff.right),
    };
    const lag = document.createElement("div");
    lag.className = "utvidet";
    lag.style.height = hoyde + "px";
    lag.style.setProperty("--t0", inset.t + "px"); lag.style.setProperty("--b0", inset.b + "px");
    lag.style.setProperty("--l0", inset.l + "px"); lag.style.setProperty("--r0", inset.r + "px");
    lag.style.clipPath = `inset(${inset.t}px ${inset.r}px ${inset.b}px ${inset.l}px round 24px)`;
    lag.innerHTML = `${this._scene(d)}
      <button class="lukk"><ha-icon icon="mdi:close"></ha-icon></button>
      <div class="telling"><b>${d.tent || 0}</b><span>av ${d.antall || (d.lys || []).length} lys tent</span></div>`;
    /* i full størrelse skal hele motivet være synlig, ikke zoomes inn */
    const svg = lag.querySelector(".scene svg");
    if (svg) svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    rot.appendChild(lag);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      lag.style.clipPath = "inset(0px 0px 0px 0px round 24px)";
    }));
    const lukk = () => {
      lag.style.clipPath = `inset(${inset.t}px ${inset.r}px ${inset.b}px ${inset.l}px round 24px)`;
      setTimeout(() => lag.remove(), 560);
    };
    lag.querySelector(".lukk").addEventListener("click", (e) => { e.stopPropagation(); lukk(); });
    lag.querySelector(".scene").addEventListener("click", lukk);
  }

  /* Sveip mellom julekortet og nedtellingen */
  _koblSveip(r) {
    const boks = r.querySelector(".sveip"), spor = r.querySelector(".spor");
    if (!boks || !spor) return;
    const antall = r.querySelectorAll(".side").length;
    const gaTil = (i) => {
      this._side = Math.max(0, Math.min(antall - 1, i));
      spor.style.transform = `translateX(-${this._side * 100}%)`;
      r.querySelectorAll("[data-s]").forEach((p, n) => p.classList.toggle("valgt", n === this._side));
    };
    let x0 = null, y0 = 0, dx = 0, retning = null;
    boks.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; retning = null; });
    boks.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (retning === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        retning = Math.abs(dx) > Math.abs(dy) * 1.6 ? "vannrett" : "loddrett";
        if (retning === "vannrett") { spor.classList.add("drar"); boks.style.touchAction = "none"; }
      }
      if (retning !== "vannrett") return;
      if (e.cancelable) e.preventDefault();
      spor.style.transform = `translateX(calc(-${this._side * 100}% + ${dx * 0.7}px))`;
    });
    const slipp = () => {
      if (x0 === null) return;
      spor.classList.remove("drar"); boks.style.touchAction = "";
      if (retning === "vannrett" && Math.abs(dx) > 55) { this._sveipet = true; gaTil(this._side + (dx < 0 ? 1 : -1)); }
      else gaTil(this._side);
      x0 = null; dx = 0; retning = null;
    };
    boks.addEventListener("pointerup", slipp);
    boks.addEventListener("pointercancel", slipp);
    boks.addEventListener("pointerleave", slipp);
    r.querySelectorAll("[data-s]").forEach((p) => p.addEventListener("click", () => gaTil(+p.dataset.s)));
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const d = this._d();
    if (!d) {
      const tom = `<style>${KI_JUL_STIL}${KI_JUL_STIL2}</style>
        <div class="tom">Fant ingen julelys fra <b>KI Lys</b>. Slå på julelysdelen i integrasjonen.</div>`;
      if (tom !== this._forrige) { this.shadowRoot.innerHTML = tom; this._forrige = tom; }
      return;
    }
    const faner = [].concat(c.faner || ["lys", "automasjon"]);
    const navn = { lys: "Lys", automasjon: "Automasjon" };
    const sider = [];
    if (c.hero !== false) sider.push(this._scene(d));
    sider.push(this._nedtelling(d));
    if (this._side === undefined || this._side >= sider.length) this._side = 0;
    const topp = sider.length > 1 && c.sveip !== false
      ? `<div class="sveip"><div class="spor" style="transform:translateX(-${this._side * 100}%)">
          ${sider.map((x) => `<div class="side">${x}</div>`).join("")}</div></div>
        <div class="prikker">${sider.map((_, i) =>
          `<i class="${i === this._side ? "valgt" : ""}" data-s="${i}"></i>`).join("")}</div>`
      : sider.join("");

    const snoer = c.snoe !== false && d.fase === "jul"
      ? `<div class="snolag">${Array.from({ length: 22 }, (_, i) =>
          `<i style="left:${(i * 4.6 + 1).toFixed(1)}%;--h:1100px;
            animation-duration:${(11 + (i % 7) * 2.2).toFixed(1)}s;
            animation-delay:-${(i * 1.4).toFixed(1)}s"></i>`).join("")}</div>`
      : "";

    const html = `<style>${KI_JUL_STIL}${KI_JUL_STIL2}</style>
      <div class="rot">
        ${snoer}
        ${topp}
        ${this._handlinger()}
        ${faner.length > 1 ? `<div class="faner"><div class="skinne">${faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        <div class="panel">${this._fane === "automasjon" ? this._panelAutomasjon(d) : this._panelLys(d)}</div>
      </div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    this._kobl();
  }

  _kobl() {
    const r = this.shadowRoot;
    r.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      this._fane = b.dataset.f; this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-veksle]").forEach((el) => {
      const slaa = () => {
        /* snu med en gang – tilstanden kommer tilbake fra Home Assistant like etter */
        const pa = !el.classList.contains("pa");
        el.classList.toggle("pa", pa);
        el.setAttribute("aria-checked", String(pa));
        el.querySelector(".knapp ha-icon").setAttribute("icon", pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off");
        this._veksle(el.dataset.veksle);
      };
      el.addEventListener("click", slaa);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); slaa(); } });
    });
    r.querySelectorAll("[data-alle]").forEach((b) => b.addEventListener("click", () => this._alle(b.dataset.alle === "pa")));

    /* julekortet er bryteren: trykk tenner og slukker, hold åpner det stort */
    const scene = r.querySelector(".scene");
    if (scene) {
      let holdt = false, t = null;
      const start = () => { holdt = false; t = setTimeout(() => { holdt = true; this._utvid(scene); }, 500); };
      const slutt = () => { clearTimeout(t); };
      scene.addEventListener("pointerdown", start);
      scene.addEventListener("pointerup", slutt);
      scene.addEventListener("pointercancel", slutt);
      scene.addEventListener("pointerleave", slutt);
      scene.addEventListener("click", () => {
        if (holdt || this._sveipet) { holdt = false; this._sveipet = false; return; }
        const paa = scene.classList.contains("inne");
        scene.classList.toggle("inne", !paa);
        const merke = scene.querySelector(".sesongmerke");
        if (merke) merke.textContent = paa ? "Slukket" : "Tent";
        this._veksleSesong();
      });
    }
    this._koblSveip(r);
    r.querySelectorAll("[data-mer]").forEach((el) => el.addEventListener("click", () => this._mer(this._id())));
  }
}
if (!customElements.get("ki-jul-card")) customElements.define("ki-jul-card", KiJulCard);

class KiJulCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { nedtelling: "Nedtellingssensor", faner: "Faner" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;opacity:.6;margin:8px 2px";
      p.textContent = "Lysene og gruppene kommer fra KI Lys. Egne automasjonsrader settes i YAML.";
      this.appendChild(p);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "nedtelling", selector: { entity: { domain: "sensor" } } },
      { name: "faner", selector: { select: { multiple: true, mode: "list",
        options: [{ value: "lys", label: "Lys" }, { value: "automasjon", label: "Automasjon" }] } } },
    ];
  }
}
if (!customElements.get("ki-jul-card-editor")) customElements.define("ki-jul-card-editor", KiJulCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-jul-card")) window.customCards.push({ type: "ki-jul-card", name: "KI Jul", description: "Julelys, nedtelling og sesong", preview: true });

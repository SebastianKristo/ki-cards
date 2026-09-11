/* ki-natt-card – nattmodus og helgemodus, om natten et sovende hus.
 * Del av ki-cards-bundelen; har ingen avhengigheter til KI-hjelperne og kan også brukes alene.
 *
 * Dag (nattmodus av): en liten nattflis med huset vårt vått av lys, ved siden av helgemodus-flisen.
 * Natt (nattmodus på): nattkortet vokser ut av den lille flisen og dekker begge – vinduene slukkes
 * ett etter ett, månen stiger, huset puster, røyk fra pipa og Z-er fra loftsvinduet.
 *
 * type: custom:ki-natt-card
 * natt: switch.nattmodus
 * helg: switch.ki_helgemodus
 * vekking: sensor.neste_vekking      # valgfri: tidsstempel eller «07:00»
 * navn_natt: Nattmodus   ikon_natt: mdi:sleep
 * navn_helg: Helgemodus  ikon_helg: mdi:airplane-takeoff
 * tekst_pa: På           tekst_av: Av        tekst_natt: God natt
 * tekst_morgen: God morgen   morgen_fra: '05:00'   morgen_til: '12:00'   morgen: true
 *
 * Fra morgen_fra til morgen_til bytter nattkortet til morgenutgaven: soloppgang i stedet for måne,
 * vinduene tennes ett etter ett, fugler i stedet for Z-er. Teksten blir «God morgen».
 */
const KI_NATT_VERSJON = "2.1.0";

const KI_NATT_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  [data-a] { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big, #ee95ff); outline-offset:2px; }
  .nk { display:grid; height:180px; --gap:var(--grid-card-gap,8px); --hoyre:calc(50% + var(--gap) / 2); --origo:25%; }
  .nk.en { --hoyre:0px; --origo:50%; }
  .lag { grid-area:1/1; min-width:0; }
  .dag { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--gap); }
  .nk.en .dag { grid-template-columns:1fr; }
  .nk.natt .dag { pointer-events:none; }

  /* nattlaget klippes til nattflisen når det er av, og vokser ut over begge når det slås på */
  .nattlag { clip-path:inset(0 var(--hoyre) 0 0 round var(--ha-card-border-radius,24px));
    opacity:0; pointer-events:none; will-change:clip-path;
    transition:clip-path .5s var(--myk), opacity .28s ease .22s; }
  .nk.natt .nattlag { clip-path:inset(0 0 0 0 round var(--ha-card-border-radius,24px));
    opacity:1; pointer-events:auto; transition:clip-path .85s var(--fjaer), opacity .22s ease; }
  .nk.natt .dag .mini { opacity:0; transition:opacity .35s ease .12s; }
  /* på vei ut: bare bakgrunnen trekker seg sammen, innholdet forsvinner først */
  .nk:not(.natt) .nattlag .tekst, .nk:not(.natt) .nattlag .scene, .nk:not(.natt) .nattlag .stj { opacity:0; transition:opacity .16s ease; }
  .dag .mini { transition:opacity .3s ease .25s; }
  .blaff { position:absolute; left:var(--origo); top:50%; width:70px; height:70px; margin:-35px 0 0 -35px; border-radius:50%;
    background:radial-gradient(circle, rgba(238,240,255,.5) 0%, transparent 70%); opacity:0; pointer-events:none; z-index:3; }
  .nk.natt .blaff { animation:blaff 1.2s ease-out both; }
  @keyframes blaff { 0% { opacity:.85; transform:scale(.25); } 100% { opacity:0; transform:scale(4.5); } }

  /* brytefliser – template_toggle_card */
  .bf { position:relative; height:180px; padding:4px 4px 12px 20px; border-radius:var(--ha-card-border-radius,24px);
    display:grid; grid-template-areas:"n i" "s t"; grid-template-columns:1fr min-content; grid-template-rows:min-content 1fr;
    background:var(--gray200); color:var(--gray1000); --knott:var(--gray200); overflow:hidden;
    transition:background .4s var(--myk), color .3s, transform .15s var(--fjaer); }
  .bf:active { transform:scale(.97); }
  .bf.av { background:var(--red); color:var(--black,#000); --knott:var(--red); }
  .bf .n { grid-area:n; align-self:start; padding-top:14px; font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bf .ic { grid-area:i; justify-self:end; align-self:start; width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:rgba(var(--highlight, 250,251,252,.1)); transition:background .4s; }
  .bf.av .ic { background:rgba(0,0,0,.1); }
  .bf .ic ha-icon { --mdc-icon-size:30px; }
  .bf .s { grid-area:s; align-self:end; font-size:2em; line-height:1.5em; font-weight:300; }
  .bf .s span { display:inline-block; }
  .bf .s span.ny { animation:inn .35s var(--myk) both; }
  .bf .t { grid-area:t; justify-self:end; align-self:end; margin:0 8px 6px 0; }
  .bryt { position:relative; width:50px; height:30px; border-radius:15px; background:currentColor; color:var(--black,#000); transition:color .35s; }
  .bf.pa .bryt { color:var(--green); }
  .bryt i { position:absolute; top:5px; left:5px; width:20px; height:20px; border-radius:50%; background:var(--knott); transition:transform .45s var(--fjaer), background .4s; }
  .bf.pa .bryt i { transform:translateX(20px); }
  .bf.pa .fly { animation:fly 2.8s ease-in-out infinite; }
  @keyframes fly { 0%,100% { transform:translate(0,0) rotate(0); } 45% { transform:translate(3px,-3px) rotate(-6deg); } }
  @keyframes inn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

  /* nattflisen – liten utgave av nattkortet */
  .bf.mini, .bf.mini.av, .bf.mini.pa { color:#eef0ff; --knott:#eef0ff;
    background:radial-gradient(90% 120% at 85% 110%, #3a2e6a 0%, transparent 60%), linear-gradient(165deg,#141a36 0%,#1d2146 55%,#2a2352 100%); }
  .bf.mini .ic { background:rgba(238,240,255,.12); }
  .bf.mini .bryt { color:rgba(238,240,255,.26); }
  .bf.mini.pa { --knott:#0f132c; }
  .bf.mini.pa .bryt { color:var(--green); }
  .bf.mini .n, .bf.mini .s, .bf.mini .ic, .bf.mini .t { position:relative; z-index:2; }
  .bf.mini .bryt { box-shadow:inset 0 0 0 1px rgba(238,240,255,.22); }
  .bf.mini .miniscene { position:absolute; right:-10px; top:2px; width:58%; max-width:150px; height:72%; pointer-events:none; opacity:.95; }
  .bf.mini .bakke { position:absolute; left:0; right:0; bottom:0; height:34%; pointer-events:none;
    background:linear-gradient(to top, rgba(12,16,38,.55), rgba(12,16,38,0)); }
  .bf.mini .miniscene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }
  .bf.mini .stj { opacity:.3; animation:blunk 5s ease-in-out infinite; }
  .bf.mini .mvindu { fill:#ffd27a; animation:mglim 4s ease-in-out infinite; }
  @keyframes mglim { 0%,100% { fill:#ffd27a; } 50% { fill:#ffe9b0; } }
  .bf.mini .mglod { opacity:.5; animation:mpust 5s ease-in-out infinite; }
  @keyframes mpust { 0%,100% { opacity:.4; } 50% { opacity:.7; } }
  .bf.mini .mmaane { animation:mflyt 9s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes mflyt { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }

  /* nattkortet */
  .nattlag { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; color:#eef0ff;
    background:radial-gradient(90% 120% at 85% 110%, #3a2e6a 0%, transparent 60%), linear-gradient(165deg,#141a36 0%,#1d2146 55%,#2a2352 100%); }
  .nattlag:active { transform:scale(.985); }
  .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:52%; }
  .tekst .n { font-size:14px; opacity:.7; }
  .tekst .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
  .tekst .sub { font-size:13px; opacity:.62; margin-top:2px; min-height:1em; }
  .helgpille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:999px;
    font-size:12px; font-weight:500; background:rgba(238,240,255,.12); --mdc-icon-size:14px; }
  .helgpille[hidden] { display:none; }
  .stj { position:absolute; width:2px; height:2px; border-radius:50%; background:#fff; opacity:.25; }
  .nk.natt .stj { animation:blunk 4.5s ease-in-out infinite; }
  @keyframes blunk { 0%,100% { opacity:.18; } 50% { opacity:.9; } }
  .scene { position:absolute; right:0; bottom:0; width:62%; max-width:300px; height:100%; }
  .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }
  .maane { transform:translateY(26px); opacity:0; }
  .nk.natt .maane { transform:none; opacity:1; transition:transform 1.6s var(--myk) .3s, opacity 1.2s ease .3s; }
  .maaneglod { opacity:0; } .nk.natt .maaneglod { opacity:.55; transition:opacity 2s ease 1s; }
  .hus { transform-box:fill-box; transform-origin:50% 100%; }
  .nk.natt .hus { animation:puste 5.5s ease-in-out 2.4s infinite; }
  @keyframes puste { 0%,100% { transform:scale(1,1); } 50% { transform:scale(1.012,1.028); } }
  .vindu { fill:#ffd27a; }
  .nk.natt .vindu { animation:slukk .5s ease forwards; }
  .nk.natt .vindu.v1 { animation-delay:.7s; } .nk.natt .vindu.v2 { animation-delay:1.1s; } .nk.natt .vindu.v3 { animation-delay:1.5s; }
  @keyframes slukk { 0% { fill:#ffd27a; } 40% { fill:#ffe9b0; } 100% { fill:#262b52; } }
  .nk.natt .vindu.nattlys { animation:nattlys .9s ease 2.2s forwards, nattpust 6s ease-in-out 3.1s infinite; }
  @keyframes nattlys { to { fill:#b0714a; } } @keyframes nattpust { 0%,100% { fill:#b0714a; } 50% { fill:#8c5a40; } }
  .lysglod { opacity:.9; } .nk.natt .lysglod { opacity:0; transition:opacity 1.4s ease 1s; }
  .z { font-family:inherit; font-weight:600; fill:#eef0ff; opacity:0; }
  .nk.natt .z { animation:zz 4.2s ease-in infinite; }
  .nk.natt .z1 { animation-delay:2.8s; } .nk.natt .z2 { animation-delay:4.2s; } .nk.natt .z3 { animation-delay:5.6s; }
  @keyframes zz { 0% { opacity:0; transform:translate(0,0) scale(.6); } 15% { opacity:.85; } 100% { opacity:0; transform:translate(26px,-46px) scale(1.25) rotate(-8deg); } }
  .roeyk { fill:#c9cbe8; opacity:0; }
  .nk.natt .roeyk { animation:royk 7s ease-out infinite; } .nk.natt .r2 { animation-delay:2.3s; } .nk.natt .r3 { animation-delay:4.6s; }
  @keyframes royk { 0% { opacity:0; transform:translate(0,0) scale(.5); } 20% { opacity:.22; } 100% { opacity:0; transform:translate(-14px,-40px) scale(1.8); } }
  .roeyk, .z { transform-box:fill-box; transform-origin:center; }
  /* morgenutgaven – soloppgang, vinduene tennes, fugler */
  .nk.morgen .nattlag { color:#fff4e6;
    background:radial-gradient(75% 115% at 18% 118%, #ffb877 0%, rgba(255,184,119,0) 58%), linear-gradient(168deg,#2b3a70 0%,#6b5590 46%,#c97f7c 78%,#f2a878 100%); }
  .nk.morgen .tekst { text-shadow:0 1px 12px rgba(48,24,44,.5); }
  .nk.morgen .tekst .n { opacity:.85; } .nk.morgen .tekst .sub { opacity:.82; }
  .nk.morgen .helgpille { background:rgba(255,244,230,.18); }
  .nk.morgen .stj, .nk.morgen .maane, .nk.morgen .maaneglod { opacity:0 !important; animation:none !important; }
  .sol, .fugl { opacity:0; }
  .sol { transform:translateY(52px); }
  .nk.natt.morgen .sol { opacity:1; transform:none; transition:transform 2.6s var(--myk) .2s, opacity 1.4s ease .2s; }
  .solglod { opacity:0; } .nk.natt.morgen .solglod { opacity:.6; transition:opacity 2.4s ease 1s; }
  .nk.natt.morgen .solstraler { animation:snurr 46s linear infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes snurr { to { transform:rotate(360deg); } }
  .nk.natt.morgen .hus { animation:none; }
  .nk.natt.morgen .lysglod { opacity:0; transition:opacity 1.6s ease; }
  .nk.natt.morgen .z { animation:none; opacity:0; }
  .nk.natt.morgen .vindu { animation:tennes .7s ease forwards; }
  .nk.natt.morgen .vindu.v2 { animation-delay:.6s; } .nk.natt.morgen .vindu.v3 { animation-delay:1.1s; }
  .nk.natt.morgen .vindu.v1 { animation-delay:1.7s; }
  .nk.natt.morgen .vindu.nattlys { animation:tennes .7s ease .1s forwards; }
  @keyframes tennes { 0% { fill:#262b52; } 60% { fill:#ffe9b0; } 100% { fill:#ffd27a; } }
  .fugl { transform-box:fill-box; transform-origin:center; }
  .nk.natt.morgen .fugl { animation:flyforbi 9s linear infinite, vinge .5s ease-in-out infinite alternate; }
  .nk.natt.morgen .f2 { animation-delay:1.3s, .2s; } .nk.natt.morgen .f3 { animation-delay:2.2s, .35s; }
  @keyframes flyforbi { 0% { opacity:0; transform:translate(0,0) scale(.8); } 12% { opacity:.75; } 85% { opacity:.5; } 100% { opacity:0; transform:translate(-130px,-38px) scale(1); } }
  @keyframes vinge { from { transform:scaleY(.65); } to { transform:scaleY(1.25); } }

  .feil { padding:16px; border-radius:24px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (max-width:380px) { .scene { width:58%; } .tekst { max-width:48%; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const KI_NATT_HUS = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
  <defs><radialGradient id="mg"><stop offset="0" stop-color="#fdf3d0" stop-opacity=".7"/><stop offset="1" stop-color="#fdf3d0" stop-opacity="0"/></radialGradient>
    <radialGradient id="lg"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="sg"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs>
  <g class="maane"><circle class="maaneglod" cx="56" cy="36" r="34" fill="url(#mg)"/><path d="M66 22a17 17 0 1 0 6 25 14 14 0 1 1-6-25z" fill="#fdf3d0"/></g>
  <g class="sol"><circle class="solglod" cx="44" cy="132" r="58" fill="url(#sg)"/>
    <g class="solstraler" opacity=".5"><path d="M44 96v-14M44 168v14M8 132h-14M80 132h14M19 107l-10-10M69 157l10 10M69 107l10-10M19 157l-10 10" stroke="#ffe6bd" stroke-width="3" stroke-linecap="round"/></g>
    <circle cx="44" cy="132" r="21" fill="#ffdba6"/></g>
  <g class="fugler"><path class="fugl f1" d="M150 54q6-6 12 0q6-6 12 0" fill="none" stroke="#3a2b3f" stroke-width="2.4" stroke-linecap="round"/>
    <path class="fugl f2" d="M168 40q5-5 10 0q5-5 10 0" fill="none" stroke="#3a2b3f" stroke-width="2.2" stroke-linecap="round"/>
    <path class="fugl f3" d="M182 66q4-4 8 0q4-4 8 0" fill="none" stroke="#3a2b3f" stroke-width="2" stroke-linecap="round"/></g>
  <ellipse cx="120" cy="182" rx="120" ry="20" fill="#11152d"/>
  <path d="M38 170 l14-40 14 40z M44 150 l8-26 8 26z" fill="#1a1f40"/>
  <g class="hus">
    <ellipse class="lysglod" cx="112" cy="128" rx="62" ry="40" fill="url(#lg)"/>
    <rect x="146" y="72" width="12" height="26" rx="2" fill="#2c2f5c"/>
    <circle class="roeyk" cx="152" cy="66" r="5"/><circle class="roeyk r2" cx="152" cy="66" r="5"/><circle class="roeyk r3" cx="152" cy="66" r="5"/>
    <path d="M70 110 L112 72 L154 110 Z" fill="#383b72"/>
    <path d="M66 112 L112 70 L158 112" fill="none" stroke="#4a4d8c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="76" y="108" width="72" height="64" fill="#2c2f5c"/>
    <circle class="vindu v1" cx="112" cy="94" r="7"/>
    <rect class="vindu v2" x="86" y="118" width="16" height="16" rx="2.5"/><rect class="vindu v3" x="122" y="118" width="16" height="16" rx="2.5"/>
    <rect class="vindu nattlys" x="86" y="144" width="16" height="16" rx="2.5"/>
    <rect x="120" y="140" width="20" height="32" rx="3" fill="#22254a"/><circle cx="135" cy="157" r="1.6" fill="#4a4d8c"/>
    <path d="M94 118v16M86 126h16M130 118v16M122 126h16M94 144v16M86 152h16" stroke="#2c2f5c" stroke-width="1.6"/>
    <text class="z z1" x="118" y="86" font-size="11">z</text><text class="z z2" x="118" y="86" font-size="14">z</text><text class="z z3" x="118" y="86" font-size="17">Z</text>
  </g></svg>`;

const KI_NATT_MINIHUS = `<svg viewBox="0 0 160 110" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
  <defs><radialGradient id="mmg"><stop offset="0" stop-color="#fdf3d0" stop-opacity=".6"/><stop offset="1" stop-color="#fdf3d0" stop-opacity="0"/></radialGradient>
    <radialGradient id="mlg"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
  <g class="mmaane"><circle cx="26" cy="24" r="20" fill="url(#mmg)"/><path d="M33 13a11 11 0 1 0 4 17 9 9 0 0 1-4-17z" fill="#fdf3d0"/></g>
  <path d="M18 104 l9-26 9 26z" fill="#1a1f40"/>
  <path d="M10 108 Q60 96 100 104 T160 100 V110 H10 Z" fill="#171c3c"/>
  <ellipse class="mglod" cx="96" cy="80" rx="46" ry="28" fill="url(#mlg)"/>
  <rect x="122" y="42" width="8" height="18" rx="2" fill="#2c2f5c"/>
  <path d="M62 70 L96 42 L130 70 Z" fill="#383b72"/>
  <path d="M59 72 L96 41 L133 72" fill="none" stroke="#4a4d8c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="68" y="68" width="56" height="40" fill="#2c2f5c"/>
  <circle class="mvindu" cx="96" cy="58" r="5"/>
  <rect class="mvindu" x="76" y="76" width="14" height="14" rx="2"/><rect class="mvindu" x="102" y="76" width="14" height="14" rx="2"/>
  <rect x="100" y="94" width="16" height="14" rx="2" fill="#22254a"/>
  <path d="M83 76v14M76 83h14M109 76v14M102 83h14" stroke="#2c2f5c" stroke-width="1.4"/>
</svg>`;

const KI_NATT_MINISTJERNER = [[10, 16], [24, 34], [36, 12], [50, 26], [62, 8], [18, 52]];

const KI_NATT_STJERNER = [[8, 14], [18, 30], [30, 10], [41, 24], [52, 8], [63, 34], [72, 16], [86, 9], [93, 28], [58, 22], [36, 40], [79, 40]];
const kiNattEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiNattKl = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

class KiNattCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._forvent = {}; }
  static getStubConfig() { return { natt: "switch.nattmodus", helg: "switch.ki_helgemodus" }; }
  static getConfigElement() { return document.createElement("ki-natt-card-editor"); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }

  setConfig(c) {
    if (!c || !c.natt) throw new Error("Sett natt: til bryteren for nattmodus");
    this._c = { navn_natt: "Nattmodus", ikon_natt: "mdi:sleep", navn_helg: "Helgemodus", ikon_helg: "mdi:airplane-takeoff",
      tekst_pa: "På", tekst_av: "Av", tekst_natt: "God natt", tekst_morgen: "God morgen",
      morgen: true, morgen_fra: "05:00", morgen_til: "12:00", ...c };
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    if (!g || !this._bygget || [c.natt, c.helg, c.vekking].some((id) => id && g.states[id] !== h.states[id])) this._oppdater();
  }

  /* Viser ønsket tilstand med en gang man trykker, til HA bekrefter (maks 4 s) */
  _pa(id) {
    const s = this._h && this._h.states[id], f = this._forvent[id];
    if (f && Date.now() - f.t < 4000 && (!s || s.state !== f.state)) return f.state === "on";
    delete this._forvent[id]; return !!s && s.state === "on";
  }
  _veksle(id) {
    const d = id.split(".")[0];
    this._forvent[id] = { state: this._pa(id) ? "off" : "on", t: Date.now() };
    clearTimeout(this._ft); this._ft = setTimeout(() => this._oppdater(), 4100);
    if (navigator.vibrate) navigator.vibrate(10);
    this._oppdater();
    this._h.callService(["switch", "input_boolean", "light", "fan"].includes(d) ? d : "homeassistant", "toggle", { entity_id: id });
  }
  /* natt eller morgen – morgen fra morgen_fra til morgen_til */
  _morgen() {
    const c = this._c; if (!c.morgen) return false;
    const min = (t) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
    const n = new Date(), na = n.getHours() * 60 + n.getMinutes(), a = min(c.morgen_fra), b = min(c.morgen_til);
    return a <= b ? na >= a && na < b : na >= a || na < b;
  }
  /* Sjekker hvert minutt om vi har krysset morgengrensen */
  _tikk() {
    clearInterval(this._ti);
    this._ti = setInterval(() => { if (this._morgen() !== this._sisteMorgen) this._oppdater(); }, 60000);
  }
  disconnectedCallback() { clearInterval(this._ti); clearTimeout(this._ft); }
  connectedCallback() { if (this._bygget) this._tikk(); }
  _mer(id) { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }

  _flis(id, navn, ikon, ekstra, mini) {
    return `<div class="bf${mini ? " mini" : ""}" data-a="${id}" data-hold="${id}" role="switch" tabindex="0" aria-label="${kiNattEsc(navn)}">
      ${mini ? KI_NATT_MINISTJERNER.map(([x, y], i) => `<i class="stj" style="left:${x}%;top:${y}%;animation-delay:-${(i * 0.81).toFixed(2)}s"></i>`).join("")
        + `<div class="miniscene">${KI_NATT_MINIHUS}</div><div class="bakke"></div>` : ""}
      <div class="n">${kiNattEsc(navn)}</div><div class="ic"><ha-icon icon="${kiNattEsc(ikon)}" class="${ekstra || ""}"></ha-icon></div>
      <div class="s"><span></span></div><div class="t"><div class="bryt"><i></i></div></div></div>`;
  }
  _bygg() {
    const c = this._c;
    this.shadowRoot.innerHTML = `<style>${KI_NATT_STIL}</style>
      <div class="nk ${c.helg ? "" : "en"}">
        <div class="lag dag">${this._flis(c.natt, c.navn_natt, c.ikon_natt, "", true)}${c.helg ? this._flis(c.helg, c.navn_helg, c.ikon_helg, "fly") : ""}</div>
        <div class="lag nattlag" data-a="${c.natt}" data-hold="${c.natt}" role="switch" aria-label="${kiNattEsc(c.navn_natt)} er på. Trykk for å slå av.">
          ${KI_NATT_STJERNER.map(([x, y], i) => `<i class="stj" style="left:${x}%;top:${y}%;animation-delay:-${((i * 0.73) % 4.5).toFixed(2)}s"></i>`).join("")}
          <div class="tekst"><div class="n">${kiNattEsc(c.navn_natt)}</div>
            ${c.helg ? `<span class="helgpille" data-a="${c.helg}" data-hold="${c.helg}" role="switch" aria-checked="true" tabindex="0" hidden><ha-icon icon="${kiNattEsc(c.ikon_helg)}"></ha-icon>${kiNattEsc(c.navn_helg)}</span>` : ""}
            <div class="stor">${kiNattEsc(c.tekst_natt)}</div><div class="sub"></div></div>
          <div class="scene">${KI_NATT_HUS}</div><div class="blaff"></div></div></div>`;
    this._koble(); this._tikk(); this._bygget = true;
  }
  _koble() {
    const r = this.shadowRoot, finn = (e, a) => { for (const el of e.composedPath()) { if (el === r) break; if (el.nodeType === 1 && el.hasAttribute(a)) return el; } return null; };
    let t = null, x0 = 0, y0 = 0, svelg = false;
    r.addEventListener("click", (e) => { if (svelg) { svelg = false; return; } const el = finn(e, "data-a"); if (el) { e.stopPropagation(); this._veksle(el.dataset.a); } });
    r.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = finn(e, "data-a"); if (el) { e.preventDefault(); this._veksle(el.dataset.a); } });
    r.addEventListener("pointerdown", (e) => { const el = finn(e, "data-hold"); if (!el) return; x0 = e.clientX; y0 = e.clientY;
      t = setTimeout(() => { t = null; svelg = true; if (navigator.vibrate) navigator.vibrate(12); this._mer(el.dataset.hold); setTimeout(() => { svelg = false; }, 700); }, 500); });
    const stopp = () => { clearTimeout(t); t = null; };
    r.addEventListener("pointerup", stopp); r.addEventListener("pointercancel", stopp);
    r.addEventListener("pointermove", (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stopp(); });
    r.addEventListener("contextmenu", (e) => { if (finn(e, "data-hold")) e.preventDefault(); });
  }
  _undertekst() {
    const c = this._c, h = this._h, v = c.vekking && h.states[c.vekking];
    if (v && !["unknown", "unavailable", ""].includes(v.state)) {
      const d = new Date(v.state);
      const kl = v.state.includes("-") && !isNaN(d) ? kiNattKl(d) : /^\d{1,2}:\d{2}/.test(v.state) ? v.state.slice(0, 5) : "";
      if (kl) return `Vekking kl. ${kl}`;
    }
    const s = h.states[c.natt]; return s && s.state === "on" ? `Siden ${kiNattKl(new Date(s.last_changed))}` : "";
  }
  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!h.states[c.natt]) { this._bygget = false; this.shadowRoot.innerHTML = `<style>${KI_NATT_STIL}</style><div class="feil">Fant ikke ${kiNattEsc(c.natt)}. Sett natt: til bryteren for nattmodus.</div>`; return; }
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, natt = this._pa(c.natt), helg = !!c.helg && this._pa(c.helg);
    const morgen = natt && this._morgen(); this._sisteMorgen = this._morgen();
    const nk = r.querySelector(".nk");
    nk.classList.toggle("natt", natt); nk.classList.toggle("morgen", morgen);
    const stor = r.querySelector(".stor"), st = morgen ? c.tekst_morgen : c.tekst_natt;
    if (stor.textContent !== st) stor.textContent = st;
    const dag = r.querySelector(".dag"), nl = r.querySelector(".nattlag");
    dag.setAttribute("aria-hidden", String(natt)); nl.setAttribute("aria-hidden", String(!natt));
    nl.setAttribute("aria-checked", String(natt)); nl.tabIndex = natt ? 0 : -1;
    dag.querySelectorAll(".bf").forEach((b) => { b.tabIndex = natt ? -1 : 0; });
    r.querySelectorAll(".bf").forEach((b) => {
      const pa = this._pa(b.dataset.a), sp = b.querySelector(".s span"), tekst = pa ? c.tekst_pa : c.tekst_av;
      b.classList.toggle("pa", pa); b.classList.toggle("av", !pa); b.setAttribute("aria-checked", String(pa));
      if (sp.textContent !== tekst) { const endret = sp.textContent !== ""; sp.textContent = tekst; if (endret) { sp.classList.remove("ny"); void sp.offsetWidth; sp.classList.add("ny"); } }
    });
    const pille = r.querySelector(".helgpille"); if (pille) pille.hidden = !helg;
    const sub = r.querySelector(".sub"), u = this._undertekst(); if (sub.textContent !== u) sub.textContent = u;
  }
}
if (!customElements.get("ki-natt-card")) customElements.define("ki-natt-card", KiNattCard);

class KiNattCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { natt: "Nattmodus", helg: "Helgemodus", vekking: "Neste vekking (valgfri)", navn_natt: "Navn nattmodus", navn_helg: "Navn helgemodus", tekst_natt: "Tekst i nattkortet" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [{ name: "natt", required: true, selector: { entity: { domain: ["switch", "input_boolean"] } } }, { name: "helg", selector: { entity: { domain: ["switch", "input_boolean"] } } },
      { name: "vekking", selector: { entity: {} } }, { name: "navn_natt", selector: { text: {} } }, { name: "navn_helg", selector: { text: {} } }, { name: "tekst_natt", selector: { text: {} } }];
  }
}
if (!customElements.get("ki-natt-card-editor")) customElements.define("ki-natt-card-editor", KiNattCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-natt-card")) window.customCards.push({ type: "ki-natt-card", name: "KI Natt", description: "Nattmodus og helgemodus – om natten et sovende hus", preview: true });
console.info(`%c KI-NATT-CARD %c v${KI_NATT_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

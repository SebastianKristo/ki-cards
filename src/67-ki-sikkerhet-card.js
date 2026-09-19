/* ki-sikkerhet-card – hele sikkerhetspanelet i ett kort.
 *
 * Leser samme `zones:`-struktur som ki-alarm-card, så sonene settes opp én gang og
 * brukes i begge kortene. Huset tegnes i SVG og reagerer på tilstanden: skjoldet
 * pulserer når alarmen er på, vinduer og dører lyser når de står åpne, en radarvifte
 * sveiper når noe beveger seg, og hele huset blinker rødt når alarmen har gått.
 *
 * type: custom:ki-sikkerhet-card
 * entity: alarm_control_panel.alarm
 * navn: Hjemme                 # valgfri overskrift
 * zones: …                     # samme liste som ki-alarm-card
 * batteri_grense: 20           # varsler under denne prosenten (0 = av)
 * kompakt: false               # lavere hus, for smale popuper
 * faner: [sikkerhet, laser, logg]   # false gir bare sikkerhetsfanen
 * laser:                       # låsene i egen fane
 *   entities: [lock.dorlas, lock.stue_dorlas, lock.vaskerom_dorlas, lock.garasjedor]
 *   navn: { lock.dorlas: Inngang }
 *   batteri: { lock.dorlas: sensor.dorlas_batteri }
 * logg:
 *   ansikt: sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av
 *   personer: { Rune: person.rune }   # ellers gjettes person.* ut fra navnet
 *   bilder: { Rune: /local/rune.jpg } # eller en bildeadresse rett fram
 *   dager: 7
 *   diagnose: true                  # vis hvor ansiktsradene kom fra
 * rull_topp: true              # rull til toppen når tastaturet åpnes/lukkes
 * soner: false                 # sonelistene utelates – bruk ki-sensor-liste-card
 * tastatur:                    # ki-alarm-card bakes inn under huset
 *   code_length: 6             # false slår det av og gir bare huset
 *   arm_requires_code: true
 */
const KI_SIK_VERSJON = "1.1.0";

const KI_SIK_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); --fjaer:cubic-bezier(.3,1.35,.5,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }

  .kort { position:relative; isolation:isolate;
    border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000);
    display:grid; gap:14px; padding:18px 18px 16px;
    transition:background .7s var(--myk); }
  /* Gløden ligger i sitt eget lag med overflow:hidden. Lå den på .kort selv,
     måtte hele kortet klippes – og da ble tastaturet kappet når det foldet seg ut. */
  .glo { position:absolute; inset:0; z-index:-1; overflow:hidden; border-radius:inherit; pointer-events:none; }
  .glo::before { content:""; position:absolute; inset:-40% -20% auto -20%; height:150%;
    background:radial-gradient(ellipse at 50% 0%, var(--tone,#5ad18b) 0%, transparent 62%);
    opacity:.20; transition:opacity .7s var(--myk), background .7s var(--myk); }
  .kort.utrygg .glo::before { opacity:.30; }
  .kort.alarm .glo::before { opacity:.42; animation:kiSikBlink 1.1s steps(1,end) infinite; }
  @keyframes kiSikBlink { 0%,49% { opacity:.45 } 50%,100% { opacity:.12 } }

  .tit { font-size:17px; font-weight:600; line-height:1.25; }
  .und { font-size:13px; opacity:.72; margin-top:2px; line-height:1.35; }
  .fyll { flex:1; }

  .skjold { width:46px; height:46px; border-radius:50%; flex:none; position:relative;
    display:flex; align-items:center; justify-content:center;
    background:var(--gray100); color:var(--gray1000);
    transition:background .5s var(--myk), color .5s var(--myk); }
  .skjold ha-icon { --mdc-icon-size:24px; }
  .skjold.pa { background:var(--tone,#5ad18b); color:rgba(20,32,26,.92); }
  .skjold.alarm { background:var(--red,#e0524a); color:#fff; }
  .skjold.pa::after, .skjold.venter::after { content:""; position:absolute; inset:-4px; border-radius:50%;
    border:2px solid var(--tone,#5ad18b); opacity:0; animation:kiSikPuls 2.4s var(--myk) infinite; }
  .skjold.alarm::after { border-color:var(--red,#e0524a); animation-duration:.9s; }
  @keyframes kiSikPuls { 0% { transform:scale(.86); opacity:.75 } 70%,100% { transform:scale(1.35); opacity:0 } }
  .skjold.venter ha-icon { animation:kiSikNikk 1.4s ease-in-out infinite; }
  @keyframes kiSikNikk { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-2px) } }

  /* ---- huset ---- */
  .scene { position:relative; width:100%; height:172px;
    --vegg-lys:color-mix(in srgb, var(--gray1000) 12%, transparent);
    --vegg-mork:color-mix(in srgb, var(--gray1000) 22%, transparent);
    --tak-lys:color-mix(in srgb, var(--gray1000) 78%, transparent);
    --tak-mork:color-mix(in srgb, var(--gray1000) 55%, transparent); }
  .kompakt .scene { height:132px; }
  .scene svg { width:100%; height:100%; display:block; overflow:visible; }

  /* ---- stedsprofiler: bakgrunnen bak huset ----
     Alt her er dempet med vilje. Huset og alarmen skal eie oppmerksomheten; dette er
     kulisser som forteller hvilket sted du ser på. */
  .bg { opacity:.9; }

  /* Oslo: rekkehus */
  .nabovegg { fill:var(--vegg-mork); opacity:.45; }
  .nabotak { fill:var(--tak-mork); opacity:.5; }
  .nabovindu { fill:var(--gray1000); opacity:.12; }
  .nabodor { fill:var(--gray1000); opacity:.16; }
  .hekk { fill:#5ad18b; opacity:.16; }

  /* Toten: åker, låve og traktor */
  .aker { fill:#c8a34a; opacity:.16; }
  .akerrad { stroke:#c8a34a; stroke-width:1; opacity:.22; fill:none; }
  .laave { fill:#b0553f; opacity:.3; }
  .laavetak { fill:#8d4230; opacity:.35; }
  .silo { fill:var(--gray1000); opacity:.14; }
  .tkropp, .thytte { fill:#3f8f4f; opacity:.75; }
  .thjul { fill:var(--gray1000); opacity:.35; }
  .teksos { stroke:var(--gray1000); stroke-width:2; fill:none; opacity:.2; }
  /* Traktoren kjører over åkeren og starter på nytt. 26 sekunder er sakte nok til at
     den ikke stjeler blikket, men rask nok til at man ser at den beveger seg. */
  .traktor { animation:sik-traktor 26s linear infinite; }
  @keyframes sik-traktor {
    from { transform:translateX(-30px); }
    to { transform:translateX(330px); }
  }

  /* Strömstad: sjø, brygge og fyrtårn */
  .sjo { fill:#4a9df8; opacity:.16; }
  .bolge { stroke:#bfe9ff; stroke-width:1.5; fill:none; opacity:.3; }
  .bolge.b1 { animation:sik-bolge 7s linear infinite; }
  .bolge.b2 { animation:sik-bolge 11s linear infinite reverse; opacity:.2; }
  @keyframes sik-bolge { to { transform:translateX(80px); } }
  .fyrtarn { fill:var(--gray1000); opacity:.3; }
  .fyrstripe { fill:#e5706b; opacity:.35; }
  .fyrhus { fill:var(--gray1000); opacity:.38; }
  .fyrlampe { fill:#f0a952; opacity:.9; }
  /* Strålen svinger fram og tilbake fra lampa. En full rotasjon ville pekt inn i
     huset halve tiden og sett ut som en feil. */
  .fyrstrale {
    fill:#f0a952; opacity:.1; transform-box:fill-box; transform-origin:0% 50%;
    animation:sik-fyr 9s ease-in-out infinite alternate;
  }
  @keyframes sik-fyr {
    from { transform:rotate(-16deg); opacity:.05; }
    50% { opacity:.13; }
    to { transform:rotate(16deg); opacity:.05; }
  }
  .brygge { fill:#8d6a45; opacity:.3; }
  .bryggestolpe { fill:#8d6a45; opacity:.22; }
  .scene { overflow:visible; }

  .bakke { fill:var(--gray1000); opacity:.10; }
  .vegg { stroke:var(--gray1000); stroke-opacity:.08; stroke-width:1; }
  .pipe { fill:var(--tak-mork); }

  /* røyk: bare når alt er rolig, og med litt drift */
  .roykgruppe { opacity:0; transition:opacity .8s var(--myk); }
  .modus-av .roykgruppe, .modus-pa .roykgruppe { opacity:1; }
  .roykpust { fill:none; stroke:var(--gray1000); stroke-opacity:.30; stroke-width:2.5; stroke-linecap:round;
    stroke-dasharray:40; stroke-dashoffset:40; }
  .modus-av .roykpust, .modus-pa .roykpust { animation:kiSikRoyk 6s ease-in-out infinite; }
  .modus-av .roykpust.r2, .modus-pa .roykpust.r2 { animation-delay:3s; }
  @keyframes kiSikRoyk {
    0%   { stroke-dashoffset:40; opacity:0; transform:translateY(6px) scale(.85) }
    25%  { opacity:.6 }
    60%  { stroke-dashoffset:0 }
    100% { stroke-dashoffset:-20; opacity:0; transform:translateY(-16px) scale(1.15) }
  }

  /* vinduer */
  .rute { fill:var(--gray1000); opacity:.30; transition:fill .5s var(--myk), opacity .5s var(--myk); }
  .sprosse { stroke:var(--gray000,#fff); stroke-opacity:.20; stroke-width:1.5; fill:none; }
  .skinn { fill:var(--orange,#f0a952); opacity:.18; filter:blur(2px); }
  .vindu.apen .rute { fill:var(--orange,#f0a952); opacity:.95; }
  .vindu.apen { animation:kiSikTenn .5s var(--fjaer) both; animation-delay:var(--d,0s); }
  .vindu.apen .skinn { animation:kiSikFlimmer 3.4s ease-in-out infinite; animation-delay:var(--d,0s); }
  @keyframes kiSikTenn { from { opacity:.2; transform:scale(.94) } to { opacity:1; transform:none } }
  @keyframes kiSikFlimmer { 0%,100% { opacity:.14 } 50% { opacity:.30 } }

  /* dør */
  .dor { fill:var(--gray000,#fff); opacity:.22; }
  .handtak { fill:var(--gray000,#fff); opacity:.55; }
  .dorblad { transform-box:fill-box; transform-origin:left center;
    transition:transform .6s var(--fjaer); }
  .dorgruppe.apen .dorblad { transform:scaleX(.42); }
  .dorapning { fill:var(--orange,#f0a952); opacity:0; transition:opacity .5s var(--myk); }
  .dorgruppe.apen .dorapning { opacity:.85; animation:kiSikGlo 2.4s ease-in-out infinite; }
  @keyframes kiSikGlo { 0%,100% { opacity:.75 } 50% { opacity:1 } }

  /* ---- tilstandene i huset ---- */

  /* Utløst alarm: to varsellys på mønet som blinker i vekselvis rytme, og en rød
     vask over hele fasaden på samme takt. */
  .blinklys { opacity:0; transition:opacity .3s var(--myk); }
  .blinkfot { fill:var(--tak-mork); }
  .blink { fill:var(--red,#e0524a); opacity:.25; }
  .modus-alarm .blinklys { opacity:1; }
  .modus-alarm .blink.v { animation:kiSikBlink2 .9s steps(1,end) infinite; }
  .modus-alarm .blink.h { animation:kiSikBlink2 .9s steps(1,end) .45s infinite; }
  @keyframes kiSikBlink2 {
    0%, 45%  { opacity:1; filter:drop-shadow(0 0 8px var(--red,#e0524a)) }
    46%,100% { opacity:.22; filter:none }
  }
  .rodvask { fill:var(--red,#e0524a); opacity:0; pointer-events:none; }
  .modus-alarm .rodvask { animation:kiSikVask .9s steps(1,end) infinite; }
  @keyframes kiSikVask { 0%,45% { opacity:.16 } 46%,100% { opacity:0 } }

  /* Armert: en tynn strek sveiper nedover fasaden, og et lite skjold puster på veggen.
     Vinduene kjøles ned – huset «sover». */
  .skann rect { fill:var(--tone,#5ad18b); opacity:0; }
  .modus-pa .skann rect { animation:kiSikSkann 4.5s var(--myk) infinite; }
  @keyframes kiSikSkann {
    0%   { opacity:0; transform:translateY(0) }
    10%  { opacity:.55 }
    55%  { opacity:.35; transform:translateY(52px) }
    70%,100% { opacity:0; transform:translateY(52px) }
  }
  .veggskjold { fill:var(--tone,#5ad18b); opacity:0; transition:opacity .5s var(--myk); }
  .modus-pa .veggskjold { opacity:.5; animation:kiSikSkjoldpust 3.2s ease-in-out infinite; }
  @keyframes kiSikSkjoldpust { 0%,100% { opacity:.35 } 50% { opacity:.7 } }
  .modus-pa .rute { fill:var(--blue,#6ec6ff); opacity:.14; }

  /* Avslått: varmt lys innenfra, huset er i bruk. */
  .modus-av .rute { fill:var(--orange,#f0a952); opacity:.26; }
  .modus-av .vindu:not(.apen) .rute { animation:kiSikLunt 7s ease-in-out infinite; }
  .modus-av .vindu:nth-of-type(2) .rute { animation-delay:2.3s; }
  .modus-av .vindu:nth-of-type(3) .rute { animation-delay:4.6s; }
  @keyframes kiSikLunt { 0%,100% { opacity:.22 } 50% { opacity:.34 } }

  /* Kobler på: hele huset dempes gradvis mens ringen teller ned. */
  .modus-venter .vegg, .modus-venter .tak { animation:kiSikVent 1.8s ease-in-out infinite; }
  @keyframes kiSikVent { 0%,100% { opacity:1 } 50% { opacity:.78 } }

  /* radar for bevegelse */
  .radar { transform-origin:var(--rx,50%) var(--ry,50%); animation:kiSikSveip 3.6s linear infinite; }
  @keyframes kiSikSveip { to { transform:rotate(360deg) } }
  .radarvifte { fill:var(--blue,#6ec6ff); opacity:.22; }
  .radarring { fill:none; stroke:var(--blue,#6ec6ff); stroke-opacity:.30; stroke-width:1.5; }
  .radarring.puls { transform-origin:160px 110px; animation:kiSikRing 3.6s ease-out infinite; }
  @keyframes kiSikRing { 0% { transform:scale(.4); stroke-opacity:.5 } 100% { transform:scale(1.06); stroke-opacity:0 } }

  /* nedtelling ved på-/avkobling */
  .tellering { fill:none; stroke:var(--yellow,#f5c542); stroke-width:3; stroke-linecap:round;
    stroke-dasharray:5 10; opacity:0; transition:opacity .4s var(--myk); }
  .modus-venter .tellering { opacity:1; animation:kiSikRull 1.8s linear infinite; }
  @keyframes kiSikRull { to { stroke-dashoffset:-30 } }

  /* sirenebuer */
  .sirene { fill:none; stroke:var(--red,#e0524a); stroke-width:3; stroke-linecap:round; opacity:0;
    transform-origin:160px 84px; }
  .modus-alarm .sirene { animation:kiSikSirene 1.3s ease-out infinite; }
  .modus-alarm .sirene:nth-child(2), .modus-alarm .sirene:nth-child(4) { animation-delay:.2s; }
  @keyframes kiSikSirene { 0% { opacity:0; transform:scale(.55) } 45% { opacity:.85 } 100% { opacity:0; transform:scale(1.2) } }

  .rutenett { display:grid; gap:8px; }
  .pille { display:flex; align-items:center; gap:14px; min-height:66px; padding:10px 18px 10px 10px;
    border-radius:24px; background:var(--gray100); color:var(--gray1000); border:0; font-family:inherit;
    text-align:left; width:100%; cursor:pointer; transition:background .3s var(--myk), color .3s var(--myk); }
  .pille .merke { width:44px; height:44px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; background:color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .pille .merke ha-icon { --mdc-icon-size:22px; }
  .pille .tekst { display:grid; gap:2px; min-width:0; }
  .pille .navn { font-size:16px; font-weight:700; }
  .pille .under { font-size:14px; opacity:.62; }
  .pille.aktiv { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .pille.aktiv .merke { background:rgba(255,255,255,.22); }
  .pille.borte { opacity:.5; }
  .laserfane, .loggfane { display:grid; gap:12px; }

  /* ---- faner ---- */
  .fanerad { display:flex; gap:4px; padding:3px; border-radius:999px; width:fit-content; margin:0 auto;
    border:1px solid color-mix(in srgb, var(--gray1000) 22%, transparent); }
  .fane { border:0; background:none; font-family:inherit; font-size:14px; font-weight:500;
    color:color-mix(in srgb, var(--gray1000) 72%, transparent);
    padding:8px 20px; border-radius:999px; cursor:pointer; transition:background .2s, color .2s; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); font-weight:600;
    box-shadow:0 1px 6px rgba(0,0,0,.35); }

  /* ---- låsefanen ---- */
  .lasknapper { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .stor { display:flex; align-items:center; gap:12px; padding:10px; border-radius:22px; border:0;
    font-family:inherit; text-align:left; cursor:pointer; color:var(--black,#1b1b1b);
    transition:transform .08s ease, filter .2s; }
  .stor:active { transform:scale(.98); }
  .stor.las { background:var(--blue,#6ec6ff); }
  .stor.opp { background:var(--orange,#f0a952); }
  .stor .rund { width:56px; height:56px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; background:rgba(0,0,0,.10); }
  .stor .rund ha-icon { --mdc-icon-size:28px; }
  .stor .t1 { font-size:15px; font-weight:600; line-height:1.2; }
  .stor .t2 { font-size:12px; opacity:.85; line-height:1.3; margin-top:2px; }

  /* ---- loggen ---- */
  .logg { display:grid; gap:2px; }
  .hendelse { display:flex; align-items:flex-start; gap:12px; padding:10px 6px; border-radius:14px; }
  .hendelse + .hendelse { border-top:1px solid color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .hikon { width:36px; height:36px; border-radius:50%; flex:none; display:flex; align-items:center;
    justify-content:center; background:color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .hikon ha-icon { --mdc-icon-size:19px; }
  .hikon.foto { background:none; overflow:hidden; }
  .hikon.foto img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
  .hikon.pa { background:var(--tone,#5ad18b); color:rgba(20,32,26,.92); }
  .hikon.av { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .hikon.fare { background:var(--red,#e0524a); color:#fff; }
  .htekst { flex:1; min-width:0; }
  .htekst b { font-size:14px; font-weight:600; display:block; }
  .htekst span { font-size:13px; opacity:.62; }
  .htid { font-size:12px; opacity:.55; white-space:nowrap; padding-top:2px; font-variant-numeric:tabular-nums; }
  .laster { font-size:13px; opacity:.6; padding:14px 6px; }

  /* ---- brikker ---- */
  .hero { display:grid; gap:14px; }
  .topp { display:flex; align-items:flex-start; gap:12px; }
  .bunn { display:grid; gap:12px; }
  .tastatur:not(:empty) { margin-top:2px; padding-top:14px;
    border-top:1px solid color-mix(in srgb, var(--gray1000) 12%, transparent); }
  .brikker { display:flex; flex-wrap:wrap; gap:8px; }
  .brikke { display:flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:999px;
    background:var(--gray100); color:var(--gray1000); font-size:13px; font-weight:600;
    border:0; font-family:inherit; cursor:pointer; opacity:.62;
    transition:opacity .2s, transform .08s ease, background .3s; }
  .brikke:active { transform:scale(.96); }
  .brikke ha-icon { --mdc-icon-size:17px; }
  .brikke.pa { opacity:1; }
  .brikke.varsel { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); opacity:1; }
  .brikke.fare   { background:var(--red,#e0524a); color:#fff; opacity:1; }
  .brikke.rolig  { background:var(--tone,#5ad18b); color:rgba(20,32,26,.92); opacity:1; }
  .brikke[aria-expanded="true"] { outline:2px solid var(--gray1000); outline-offset:-2px; }

  .liste { display:grid; gap:2px; background:var(--gray100); border-radius:16px; padding:6px;
    animation:kiSikInn .28s var(--fjaer); }
  @keyframes kiSikInn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }
  .rad { display:flex; align-items:center; gap:10px; min-height:42px; padding:0 10px; border-radius:12px;
    cursor:pointer; font-size:14px; }
  .rad:active { background:var(--gray200); }
  .rad ha-icon { --mdc-icon-size:20px; opacity:.75; flex:none; }
  .rad .navn { flex:1; font-weight:500; }
  .rad .verdi { font-size:13px; opacity:.65; white-space:nowrap; }
  .rad .verdi.pa { opacity:1; font-weight:600; }
  .tom { font-size:13px; opacity:.6; padding:10px; }

  @media (prefers-reduced-motion: reduce) {
    .traktor, .bolge.b1, .bolge.b2, .fyrstrale,
    .glo::before, .skjold::after, .skjold ha-icon, .vindu.apen, .vindu.apen .skinn,
    .dorgruppe.apen .dorapning, .radar, .radarring.puls,
    .sirene, .modus-venter .tellering, .roykpust, .liste,
    .blink, .rodvask, .skann rect, .veggskjold,
    .modus-av .vindu .rute, .modus-venter .vegg, .modus-venter .tak { animation:none !important; }
    .modus-alarm .rodvask { opacity:.14; }
    .modus-alarm .blink { opacity:1; }
    .dorblad { transition:none; }
  }
`;

const KI_SIK_PA = new Set(["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass"]);
const KI_SIK_VENTER = new Set(["arming", "pending"]);
const KI_SIK_NAVN = {
  disarmed: "Avslått", armed_home: "På – hjemme", armed_away: "På – borte",
  armed_night: "På – natt", armed_vacation: "På – ferie", armed_custom_bypass: "På – tilpasset",
  arming: "Kobler på", pending: "Teller ned", triggered: "Alarm utløst",
  unavailable: "Utilgjengelig", unknown: "Ukjent",
};

class KiSikkerhetCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._apen = null; }
  static getStubConfig() { return { entity: "alarm_control_panel.alarm", zones: [] }; }
  getCardSize() { return this._c && this._c.tastatur ? (this._c.soner === false ? 8 : 10 + (this._c.zones || []).length * 2) : 4; }
  getGridOptions() {
    // Ingen fast høyde: med tastatur bygger kortet seg langt nedover, og en låst
    // radhøyde klipper bunnen av.
    const rader = !this._c || !this._c.tastatur ? 5
      : this._c.soner === false ? 11
      : 12 + (this._c.zones || []).length * 2;
    return { columns: 12, rows: "auto", min_rows: rader };
  }

  static getConfigElement() { return document.createElement("ki-sikkerhet-card-editor"); }
  static getStubConfig() {
    return { entity: "alarm_control_panel.alarmo", profil: "oslo", navn: "Sikkerhet" };
  }

  setConfig(c) {
    if (!c || !c.entity) throw new Error("Sett entity: til alarmpanelet");
    this._c = { navn: "Sikkerhet", batteri_grense: 20, kompakt: false, tastatur: true,
                profil: "oslo", faner: ["sikkerhet", "laser", "logg"], zones: [], ...c };
    this._bygget = false;
    this._fane = this._fane || this._faner()[0];
  }

  _faner() {
    const f = this._c && this._c.faner;
    if (f === false) return ["sikkerhet"];
    const mulige = ["sikkerhet", "laser", "logg"];
    return (Array.isArray(f) ? f : mulige).filter((x) => mulige.includes(x));
  }

  /* Tastaturet folder seg ut og inn under huset, og høyden på kortet endrer seg
     kraftig. Uten dette blir du stående midt nede i kortet når koden er tastet
     ferdig. Vi ser på høyden til tastaturboksen og ruller kortet til toppen når
     den endrer seg. */
  _rullevakt() {
    if (this._ro || this._c.rull_topp === false || typeof ResizeObserver === "undefined") return;
    const boks = this.shadowRoot.querySelector(".tastatur");
    if (!boks) return;
    this._ro = new ResizeObserver((poster) => {
      const h = poster[0] && poster[0].contentRect ? poster[0].contentRect.height : 0;
      if (this._forrigeH === undefined) { this._forrigeH = h; return; }
      const endring = h - this._forrigeH;
      if (Math.abs(endring) < 40) return;   // små justeringer teller ikke
      this._forrigeH = h;
      // Vokser boksen har tastaturet foldet seg ut: rull ned til det, så du slipper
      // å lete etter sifrene. Krymper den er koden tastet ferdig: tilbake til toppen.
      this._rull(endring > 0 ? "ned" : "opp");
    });
    this._ro.observe(boks);
  }

  /* Finner boksen som faktisk ruller. Inne i en bubble-card-popup er det ikke
     vinduet, men et element med egen overflow – og det kan ligge på andre siden av
     en shadow-rot, så vi går via host når parentElement tar slutt. */
  _rulleboks() {
    let el = this.parentElement || (this.getRootNode() && this.getRootNode().host);
    for (let i = 0; i < 30 && el; i++) {
      try {
        const stil = getComputedStyle(el);
        const kanRulle = /(auto|scroll|overlay)/.test(stil.overflowY);
        if (kanRulle && el.scrollHeight > el.clientHeight + 8) return el;
      } catch (e) { /* hopp over */ }
      el = el.parentElement || (el.getRootNode && el.getRootNode().host) || null;
    }
    return null;
  }

  /* retning: "ned" viser hele tastaturet, "opp" går helt til toppen av kortet. */
  _rull(retning) {
    clearTimeout(this._rullTid);
    // Vent til utfoldingen har satt seg, ellers måler vi på en høyde som fortsatt vokser
    this._rullTid = setTimeout(() => {
      const boks = this._rulleboks();
      const mal = retning === "ned" ? this.shadowRoot.querySelector(".tastatur") : this;
      if (!mal) return;

      if (!boks) {
        try {
          mal.scrollIntoView({ block: retning === "ned" ? "end" : "start", behavior: "smooth" });
        } catch (e) { mal.scrollIntoView(retning !== "ned"); }
        return;
      }

      const luft = 16;
      if (retning === "opp") {
        // helt til toppen av kortet, ikke bare så vidt innenfor
        const topp = boks.scrollTop + this.getBoundingClientRect().top
          - boks.getBoundingClientRect().top - luft;
        boks.scrollTo({ top: Math.max(0, topp), behavior: "smooth" });
        return;
      }
      // ned: sørg for at hele tastaturet er synlig, ikke bare øverste kant
      const m = mal.getBoundingClientRect(), b = boks.getBoundingClientRect();
      const under = m.bottom - b.bottom + luft;
      if (under > 0) boks.scrollTo({ top: boks.scrollTop + under, behavior: "smooth" });
    }, 180);
  }

  /* Henter en fane som ble bedt om med «#alarm::laser» rett før kortet ble bygget. */
  _ventendeFane() {
    const KI = window.KI || {};
    if (!this._c || !KI.hentFane) return false;
    const f = KI.hentFane(this._faner());
    if (f && f !== this._fane) { this._fane = f; return true; }
    return false;
  }

  connectedCallback() {
    this._ventendeFane();
    if (this._faneAv) return;
    // «#alarm::laser» fra et annet kort velger fanen når popupen åpnes
    this._faneAv = (e) => {
      const f = e && e.detail && e.detail.fane;
      if (f && this._faner().includes(f) && this._fane !== f) { this._fane = f; this._tegn(); }
    };
    window.addEventListener("ki-fane", this._faneAv);
  }
  disconnectedCallback() {
    if (this._faneAv) { window.removeEventListener("ki-fane", this._faneAv); this._faneAv = null; }
    if (this._ro) { this._ro.disconnect(); this._ro = null; this._forrigeH = undefined; }
    clearTimeout(this._rullTid);
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    if (!g || this._ids().some((id) => g.states[id] !== h.states[id])) { this._tegn(); return; }
    // Ingenting av mitt endret seg, men det innebygde alarmkortet skal likevel
    // ha fersk hass – ellers står tastaturet igjen med gammel tilstand mens
    // panelet går disarmed → arming → armed_away.
    if (this._alarm) this._alarm.hass = h;
  }

  _ids() {
    const ut = [this._c.entity];
    for (const s of this._c.zones || []) for (const i of s.items || []) {
      if (i.entity) ut.push(i.entity);
      if (i.battery) ut.push(i.battery);
    }
    return ut;
  }

  /* En sone-oppføring gjort om til noe kortet kan vise */
  _les(sone, i) {
    const st = this._h.states[i.entity];
    if (!st) return null;
    const s = st.state;
    const aktiv = sone.kind === "lock"
      ? s !== "locked"                       // ulåst, låser opp, eller jammed
      : s === "on" || s === "open" || s === "detected";
    const bat = i.battery ? Number(this._h.states[i.battery] && this._h.states[i.battery].state) : NaN;
    return {
      entity: i.entity,
      navn: i.name || (st.attributes && st.attributes.friendly_name) || i.entity,
      aktiv,
      tekst: aktiv ? (sone.active_text || "Aktiv") : (sone.idle_text || "Rolig"),
      ikon: sone.icon || "mdi:shield-outline",
      lavt: Number.isFinite(bat) && this._c.batteri_grense > 0 && bat <= this._c.batteri_grense ? bat : null,
      utilgjengelig: s === "unavailable" || s === "unknown",
    };
  }

  _grupper() {
    const g = { opening: [], motion: [], lock: [], annet: [], lavt: [], borte: [] };
    for (const sone of this._c.zones || []) {
      const bøtte = g[sone.kind] ? sone.kind : "annet";
      for (const i of sone.items || []) {
        const r = this._les(sone, i);
        if (!r) continue;
        g[bøtte].push(r);
        if (r.lavt !== null) g.lavt.push(r);
        if (r.utilgjengelig) g.borte.push(r);
      }
    }
    return g;
  }

  _laser() {
    const l = this._c.laser || {};
    let ids = l.entities;
    if (!ids) {
      // ingen egen liste: bruk låsene fra sonene
      ids = [];
      for (const z of this._c.zones || []) if ((z.kind || "") === "lock")
        for (const i of z.items || []) if (i.entity) ids.push(i.entity);
    }
    return ids.map((id) => {
      const st = this._h.states[id];
      const b = (l.batteri || {})[id];
      const bs = b ? this._h.states[b] : null;
      return {
        id, st,
        navn: (l.navn || {})[id] || this._sonenavn(id) || (st && st.attributes.friendly_name) || id,
        last: st && st.state === "locked",
        ukjent: !st || ["unavailable", "unknown"].includes(st.state),
        batteri: bs && !isNaN(Number(bs.state)) ? Math.round(Number(bs.state)) : null,
        endret: st && st.last_changed,
      };
    });
  }

  _sonenavn(id) {
    for (const z of this._c.zones || []) for (const i of z.items || [])
      if (i.entity === id && i.name) return i.name;
    return null;
  }

  _mer(id) {
    this.dispatchEvent(new CustomEvent("hass-more-info",
      { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _tegn() {
    const c = this._c, h = this._h;
    const panel = h.states[c.entity];
    const st = panel ? panel.state : "unavailable";
    const paa = KI_SIK_PA.has(st), venter = KI_SIK_VENTER.has(st), alarm = st === "triggered";

    const g = this._grupper();
    const apne = g.opening.filter((r) => r.aktiv);
    const rorer = g.motion.filter((r) => r.aktiv);
    const ulast = g.lock.filter((r) => r.aktiv);
    const utrygg = apne.length + ulast.length > 0;

    const tone = alarm ? "var(--red,#e0524a)"
      : venter ? "var(--yellow,#f5c542)"
      : utrygg ? "var(--orange,#f0a952)"
      : paa ? "var(--green,#5ad18b)" : "var(--blue,#6ec6ff)";

    const und = alarm ? "Alarmen har gått"
      : venter ? (panel && panel.attributes && panel.attributes.next_state
        ? `${KI_SIK_NAVN[st]} – ${KI_SIK_NAVN[panel.attributes.next_state] || ""}`.trim() : KI_SIK_NAVN[st])
      : utrygg ? [apne.length ? `${apne.length} åpen${apne.length > 1 ? "e" : ""}` : "",
                  ulast.length ? `${ulast.length} ulåst` : ""].filter(Boolean).join(" · ")
      : paa ? "Alt lukket og låst"
      : "Alarmen er av";

    const klasse = ["kort", alarm ? "alarm" : utrygg ? "utrygg" : "trygg", c.kompakt ? "kompakt" : ""].join(" ");

    const brikke = (id, ikon, tekst, stil) => `
      <button class="brikke ${stil}" data-liste="${id}" aria-expanded="${this._apen === id}">
        <ha-icon icon="${ikon}"></ha-icon>${KI_SIK_ESC(tekst)}
      </button>`;

    const brikker = [
      brikke("apne", "mdi:door-open",
        apne.length ? `${apne.length} åpen${apne.length > 1 ? "e" : ""}` : "Alt lukket",
        apne.length ? "varsel" : "pa"),
      g.motion.length ? brikke("motion", "mdi:motion-sensor",
        rorer.length ? `Bevegelse${rorer.length > 1 ? ` (${rorer.length})` : ""}` : "Stille",
        rorer.length ? (paa ? "fare" : "pa") : "") : "",
      g.lock.length ? brikke("lock", ulast.length ? "mdi:lock-open-variant" : "mdi:lock",
        ulast.length ? `${ulast.length} ulåst` : "Låst",
        ulast.length ? "varsel" : "pa") : "",
      g.lavt.length ? brikke("lavt", "mdi:battery-alert-variant-outline",
        `${g.lavt.length} lavt batteri`, "varsel") : "",
      g.borte.length ? brikke("borte", "mdi:help-rhombus-outline",
        `${g.borte.length} uten svar`, "fare") : "",
    ].filter(Boolean).join("");

    const lister = { apne: apne.length ? apne : g.opening, motion: g.motion, lock: g.lock, lavt: g.lavt, borte: g.borte };
    const valgt = this._apen && lister[this._apen] ? lister[this._apen] : null;

    if (!this._bygget) this._bygg();

    const kort = this.shadowRoot.querySelector(".kort");
    kort.className = klasse;   // .glo og .hero ligger som barn og overlever
    kort.style.setProperty("--tone", tone);

    const faner = this._faner();
    this._ventendeFane();      // trykket kom kanskje før kortet fantes
    if (!faner.includes(this._fane)) this._fane = faner[0];
    this._sett(".fanerad", faner.length < 2 ? "" : faner.map((f) => `
      <button class="fane ${f === this._fane ? "valgt" : ""}" data-fane="${f}">${
        { sikkerhet: "Sikkerhet", laser: "Dørlåser", logg: "Logg" }[f]}</button>`).join(""));

    /* Glidende pille på fanerada. Rett etter `_sett`, som skriver ny innmat ved hver
       oppdatering — knappene er da nye noder, og pilla må festes på nytt. Ligger den
       bare ett sted, forsvinner markeringen helt, siden stilen slår av kortets egen
       aktivbakgrunn.
       Er det bare én fane, tegnes ingen rad, og da er det ingenting å feste til. */
    if (faner.length > 1) {
      const ki = (typeof window !== "undefined" && window.KI) || null;
      if (ki && ki.pillefaner) {
        ki.pillefaner(this, { rad: ".fanerad", knapp: ".fanerad .fane", aktiv: "valgt" });
      }
    }

    const vis = (v, p) => { const el = this.shadowRoot.querySelector(v); if (el) el.style.display = p ? "" : "none"; };
    vis(".hero", this._fane === "sikkerhet");
    vis(".tastatur", this._fane === "sikkerhet");
    vis(".laserfane", this._fane === "laser");
    vis(".loggfane", this._fane === "logg");

    if (this._fane === "sikkerhet") {
      // Heroen er delt i tre. Ved armering endrer bare toppen seg, og da skal ikke
      // huset tegnes om – det ville nullstilt røyk, radar og døranimasjon midt i.
      this._sett(".topp", `
        <div class="fyll">
          <div class="tit">${KI_SIK_ESC(c.navn)}</div>
          <div class="und">${KI_SIK_ESC(und)}</div>
        </div>
        <div class="skjold ${alarm ? "alarm" : paa ? "pa" : venter ? "venter" : ""}" data-mer="${c.entity}"
             role="button" tabindex="0" title="${KI_SIK_ESC(KI_SIK_NAVN[st] || st)}">
          <ha-icon icon="${alarm ? "mdi:shield-alert" : paa ? "mdi:shield-check" : venter ? "mdi:shield-sync" : "mdi:shield-off-outline"}"></ha-icon>
        </div>`);
      this._sett(".scene", this._hus({ paa, venter, alarm, apne, rorer, ulast }));
      // Modusklassen settes på containeren, ikke inne i SVG-strengen. Ellers ville
      // hele huset blitt skrevet om ved hver armering, og animasjonene startet forfra.
      const scene = this.shadowRoot.querySelector(".scene");
      if (scene) scene.className = "scene " + (alarm ? "modus-alarm" : venter ? "modus-venter" : paa ? "modus-pa" : "modus-av");
      this._sett(".bunn", `
        <div class="brikker">${brikker}</div>
        ${valgt ? `<div class="liste">${this._liste(valgt)}</div>` : ""}`);
      this._tastatur();
    } else if (this._fane === "laser") {
      this._sett(".laserfane", this._laserHtml());
    } else {
      this._loggFane();
    }
  }

  /* ------------------------------------------------------------ dørlåser */
  _laserHtml() {
    const l = this._laser();
    if (!l.length) return `<div class="tom">Ingen låser satt opp. Legg dem i en sone med <code>kind: lock</code>, eller i <code>laser.entities</code>.</div>`;
    const ulast = l.filter((x) => !x.last && !x.ukjent);
    const last = l.filter((x) => x.last);
    const alle = l.map((x) => x.id);

    return `
      <div class="lasknapper">
        <button class="stor las" data-tjeneste="lock" data-ids="${alle.join(",")}">
          <span class="rund"><ha-icon icon="mdi:lock"></ha-icon></span>
          <span><span class="t1">Lås alle</span>
            <span class="t2">${ulast.length ? `Lås ${ulast.length} stk` : "Alle dører er låst nå"}</span></span>
        </button>
        <button class="stor opp" data-tjeneste="unlock" data-ids="${alle.join(",")}">
          <span class="rund"><ha-icon icon="mdi:lock-open-variant-outline"></ha-icon></span>
          <span><span class="t1">Lås opp alle</span>
            <span class="t2">${last.length ? `Åpne ${last.length} stk` : "Alle dører er ulåst nå"}</span></span>
        </button>
      </div>
      <div class="rutenett">${l.map((x) => `
        <button class="pille ${x.last ? "" : "aktiv"} ${x.ukjent ? "borte" : ""}" data-mer="${x.id}">
          <span class="merke"><ha-icon icon="${x.last ? "mdi:lock" : "mdi:lock-open-variant"}"></ha-icon></span>
          <span class="tekst">
            <span class="navn">${KI_SIK_ESC(x.navn)}</span>
            <span class="under">${x.ukjent ? "Uten svar" : x.last ? "Låst" : "Ulåst"}${
              x.batteri !== null ? ` · ${x.batteri} %` : ""}${
              x.endret ? ` · ${KI_SIK_SIDEN(x.endret)}` : ""}</span>
          </span>
        </button>`).join("")}</div>`;
  }

  /* ----------------------------------------------------------------- logg */
  _loggFane() {
    const boks = this.shadowRoot.querySelector(".loggfane");
    if (!boks) return;
    if (!boks.innerHTML) boks.innerHTML = `<div class="laster">Henter historikk …</div>`;
    const naa = Date.now();
    if (this._loggTid && naa - this._loggTid < 30000) return;   // ikke hent ved hver tick
    this._loggTid = naa;
    this._hentLogg().then((rader) => {
      boks.innerHTML = rader.length
        ? `<div class="logg">${rader.map((r) => `
            <div class="hendelse">
              <span class="hikon ${r.stil} ${r.bilde ? "foto" : ""}">${r.bilde
                ? `<img src="${KI_SIK_ESC(r.bilde)}" alt="">`
                : `<ha-icon icon="${r.ikon}"></ha-icon>`}</span>
              <span class="htekst"><b>${KI_SIK_ESC(r.tittel)}</b><span>${KI_SIK_ESC(r.under)}</span></span>
              <span class="htid">${KI_SIK_ESC(KI_SIK_SIDEN(r.tid))}</span>
            </div>`).join("")}</div>`
        : `<div class="tom">Ingen hendelser i perioden.</div>`;
      const mangler = this._forventet().filter((id) => !(this._lest || {})[id]);
      if (mangler.length) boks.innerHTML += `<div class="tom">Ingen historikk for ${
        KI_SIK_ESC(mangler.join(", "))}. Sjekk at entiteten ikke er utelatt fra recorder.</div>`;
      if (this._c.logg && this._c.logg.diagnose && (this._diag || []).length)
        boks.innerHTML += `<div class="tom">Loggbok-rader — ${
          KI_SIK_ESC(this._diag.join(" · "))}</div>`;
    }).catch((e) => {
      boks.innerHTML = `<div class="tom">Fikk ikke hentet historikk: ${KI_SIK_ESC(e.message || e)}</div>`;
    });
  }

  /* Profilbilde for et navn. Rekkefølge:
   *   1. `logg.bilder` – en URL du setter selv
   *   2. `logg.personer` – peker på en person-entitet
   *   3. person.*-entiteter, matchet på hele navnet, fornavnet eller entitets-ID-en
   * Ansiktssensoren melder ofte bare fornavnet («Rune») mens person-entiteten heter
   * «Rune Kristo» – derfor sammenlignes også første ord. */
  _bilde(navn) {
    if (!navn || !this._h) return null;
    const lg = this._c.logg || {};
    const n = (x) => String(x || "").trim().toLowerCase()
      .replace(/ø|ö/g, "o").replace(/æ|ä|å/g, "a");
    const sok = n(navn);
    if (!sok) return null;

    if ((lg.bilder || {})[navn]) return lg.bilder[navn];

    const hentBilde = (id) => {
      const st = id && this._h.states[id];
      return (st && st.attributes && st.attributes.entity_picture) || null;
    };
    const eksplisitt = (lg.personer || {})[navn];
    if (eksplisitt) return hentBilde(eksplisitt);

    const kandidater = Object.keys(this._h.states).filter((x) => x.startsWith("person."));
    const treff = (test) => kandidater.find((id) => {
      const fn = n((this._h.states[id].attributes || {}).friendly_name);
      return test(fn, n(id.slice(7)));
    });

    const id =
      treff((fn, eid) => fn === sok || eid === sok) ||
      treff((fn, eid) => fn.split(" ")[0] === sok || eid.split("_")[0] === sok) ||
      treff((fn) => fn.startsWith(sok + " "));
    return hentBilde(id);
  }

  /* Hvilke entiteter loggen forventet å finne noe fra. Brukes til å si fra når en av
     dem ikke ga en eneste rad – typisk fordi den er utelatt fra recorder. */
  _forventet() {
    const lg = this._c.logg || {};
    return [this._c.entity, ...this._laser().map((x) => x.id), lg.ansikt].filter(Boolean);
  }

  /* Hendelseslista. Loggboken er kilden for tilstandsendringer – den er laget for
   * nettopp dette og gir én rad per endring med tidspunkt. Historikk-API-et brukte
   * jeg først, men med `minimal_response` kom bare de eldste radene med, og alarmen
   * forsvant helt. Historikken brukes nå kun til ansiktssensorens attributter
   * (`bekreftet_tid` og `kilde`), som loggboken ikke har. */
  async _hentLogg() {
    const lg = this._c.logg || {};
    const dager = lg.dager || 7;
    const laser = this._laser();
    const fra = new Date(Date.now() - dager * 864e5).toISOString();
    // Loggboken returnerer ETT DØGN fra `fra` hvis vi ikke sier noe annet. Uten end_time
    // fikk vi døgnet som begynte for sju dager siden – derfor bare seks dager gamle rader,
    // og ingenting fra entiteter som ikke hadde aktivitet nettopp det døgnet.
    const til = new Date(Date.now() + 6e4).toISOString();
    const navn = {};
    for (const x of laser) navn[x.id] = x.navn;

    const ut = [];
    this._lest = {};
    this._diag = [];

    /* Loggbokens REST-sti er `logbook/<tid>` – uten `period`, i motsetning til
       historikken som heter `history/period/<tid>`. Jeg brukte `logbook/period/…`
       først, og da traff kallet ingenting. Vi prøver den riktige først og faller
       tilbake på den andre skrivemåten i fall en HA-versjon vil ha den. */
    const feiltekst = (e) => {
      if (!e) return "ukjent";
      if (typeof e === "string") return e;
      if (e.message) return String(e.message);
      if (e.body && e.body.message) return String(e.body.message);
      if (e.status || e.code) return `HTTP ${e.status || e.code}`;
      try { return JSON.stringify(e).slice(0, 120); } catch (x) { return String(e); }
    };

    const loggbok = async (id) => {
      const kort = id.split(".")[1] || id;
      const q = `entity=${id}&end_time=${encodeURIComponent(til)}`;
      const stier = [`logbook/${fra}?${q}`, `logbook/period/${fra}?${q}`];
      let siste = null;
      for (const sti of stier) {
        try {
          const r = await this._h.callApi("GET", sti);
          const rader = Array.isArray(r) ? r : [];
          this._lest[id] = rader.length;
          this._diag.push(`${kort}: ${rader.length}`);
          return rader;
        } catch (e) {
          siste = e;
        }
      }
      this._lest[id] = 0;
      this._diag.push(`${kort}: ${feiltekst(siste)}`);
      console.warn("ki-sikkerhet-card: loggbok feilet for", id, siste);
      return [];
    };

    // --- alarmen
    if (this._c.entity) {
      for (const e of await loggbok(this._c.entity)) {
        const v = e.state;
        if (!v || !e.when || ["unavailable", "unknown"].includes(v)) continue;
        ut.push({ tid: e.when,
          ikon: KI_SIK_PA.has(v) ? "mdi:shield-check" : v === "triggered" ? "mdi:shield-alert" : "mdi:shield-off-outline",
          stil: v === "triggered" ? "fare" : KI_SIK_PA.has(v) ? "pa" : "",
          tittel: KI_SIK_NAVN[v] || v, under: "Alarm" });
      }
    }

    // --- låsene
    for (const x of laser) {
      for (const e of await loggbok(x.id)) {
        const v = e.state;
        if (!v || !e.when || ["unavailable", "unknown"].includes(v)) continue;
        const l = v === "locked";
        ut.push({ tid: e.when, ikon: l ? "mdi:lock" : "mdi:lock-open-variant",
          stil: l ? "" : "av",
          tittel: `${navn[x.id] || x.navn || x.id} ${l ? "låst" : "låst opp"}`,
          under: "Dørlås" });
      }
    }

    // --- ansiktsgjenkjenning: loggboken for hendelsene, historikken for attributtene
    if (lg.ansikt) {
      const naa = this._h.states[lg.ansikt];
      const sett = new Set();
      const attr = {};            // bekreftet_tid -> attributter
      const legg = (hvem, tid, a) => {
        if (!hvem || !tid || ["unavailable", "unknown", ""].includes(hvem)) return;
        const merke = `${hvem}|${tid}`;
        if (sett.has(merke)) return;
        sett.add(merke);
        ut.push({ tid, ikon: (a && a.icon) || "mdi:face-recognition", stil: "av",
          bilde: this._bilde(hvem), tittel: `${hvem} låste opp`,
          under: a && a.kilde ? `Ansiktsgjenkjenning · ${a.kilde}` : "Ansiktsgjenkjenning" });
      };

      try {
        const h = await this._h.callApi("GET",
          `history/period/${fra}?filter_entity_id=${lg.ansikt}&significant_changes_only=0`);
        for (const serie of h || []) for (const punkt of serie) {
          const a = punkt.attributes || {};
          const tid = a.bekreftet_tid || punkt.last_changed || punkt.last_updated;
          if (tid) attr[tid] = a;
          legg(punkt.state, tid, a);
        }
      } catch (e) {
        console.warn("ki-sikkerhet-card: historikk for ansiktssensoren feilet", e);
      }

      for (const e of await loggbok(lg.ansikt)) {
        legg(e.state, e.when, attr[e.when] || (naa && naa.attributes));
      }

      if (!sett.size && naa) {
        const a = naa.attributes || {};
        legg(naa.state, a.bekreftet_tid || naa.last_changed, a);
      }
    }

    ut.sort((a, b) => new Date(b.tid) - new Date(a.tid));
    return ut.slice(0, lg.maks || 40);
  }

  /* Skriver bare når innholdet faktisk er nytt, og kobler opp igjen etterpå. */
  _sett(velger, html) {
    const el = this.shadowRoot.querySelector(velger);
    if (!el || el._sist === html) return;
    el.innerHTML = html;
    el._sist = html;
    for (const b of el.querySelectorAll("[data-mer]"))
      b.addEventListener("click", () => this._mer(b.dataset.mer));
    for (const b of el.querySelectorAll("[data-fane]"))
      b.addEventListener("click", () => { this._fane = b.dataset.fane; this._tegn(); });
    for (const b of el.querySelectorAll("[data-tjeneste]"))
      b.addEventListener("click", () => this._h.callService("lock", b.dataset.tjeneste,
        { entity_id: b.dataset.ids.split(",") }));
    for (const b of el.querySelectorAll("[data-liste]"))
      b.addEventListener("click", () => {
        this._apen = this._apen === b.dataset.liste ? null : b.dataset.liste;
        this._tegn();
      });
  }

  /* Skallet bygges én gang. Ville vi skrevet hele shadowRoot på nytt ved hver
   * tilstandsendring, hadde det innebygde tastaturet blitt laget på nytt midt i
   * inntastingen og mistet sifrene. */
  _bygg() {
    this.shadowRoot.innerHTML = `
      <style>${KI_SIK_STIL}</style>
      <ha-card>
        <div class="kort">
          <div class="glo"></div>
          <div class="fanerad"></div>
          <div class="hero">
            <div class="topp"></div>
            <div class="scene"></div>
            <div class="bunn"></div>
          </div>
          <div class="tastatur"></div>
          <div class="laserfane"></div>
          <div class="loggfane"></div>
        </div>
      </ha-card>`;
    this._bygget = true;
  }

  /* ki-alarm-card settes inn under huset, uten sin egen topp (hero: false),
   * så de to framstår som ett kort. Sonene er de samme. */
  _tastatur() {
    const boks = this.shadowRoot.querySelector(".tastatur");
    if (!this._c.tastatur) { boks.innerHTML = ""; this._alarm = null; return; }
    if (!this._alarm) {
      if (!customElements.get("ki-alarm-card")) return;   // ikke lastet – hopp over
      this._alarm = document.createElement("ki-alarm-card");
      const ekstra = typeof this._c.tastatur === "object" ? this._c.tastatur : {};
      this._alarm.setConfig({
        entity: this._c.entity,
        zones: this._c.zones,
        soner: this._c.soner !== false,   // soner: false gir bare modusknappene
        ...ekstra,
        // hero står sist: sikkerhetskortet har sitt eget hus og sin egen statuslinje,
        // så alarmkortets rosa statusfelt skal aldri vises her. Sto den før `...ekstra`,
        // kunne en `hero`-nøkkel i `tastatur`-objektet overstyre den.
        hero: false,
      });
      boks.appendChild(this._alarm);
    }
    this._alarm.hass = this._h;
    this._rullevakt();
  }

  _liste(rader) {
    if (!rader.length) return `<div class="tom">Ingenting å vise her.</div>`;
    return rader.map((r) => `
      <div class="rad" data-mer="${r.entity}">
        <ha-icon icon="${r.ikon}"></ha-icon>
        <span class="navn">${KI_SIK_ESC(r.navn)}</span>
        ${r.lavt !== null ? `<span class="verdi pa">${r.lavt} %</span>` : ""}
        <span class="verdi ${r.aktiv ? "pa" : ""}">${KI_SIK_ESC(r.utilgjengelig ? "Uten svar" : r.tekst)}</span>
      </div>`).join("");
  }

  /* Huset. Færre, større former – tre vinduer og en dør, ingen panelskjøter,
   * ingen lampe. Silhuetten skal leses på et halvt sekund. */
  /* Bakgrunnen bak huset, etter sted.
   *
   * Huset selv er uendret i alle tre — vinduene, døra, skannestreken og sirenene hører
   * til alarmen og skal se like ut uansett. Profilen legger bare til det som står rundt,
   * tegnet BAK huset, så ingen av animasjonene påvirkes.
   *
   * Hver profil har én bevegelse, ikke flere: traktoren kjører, fyrlyset svinger. Mer
   * enn det ville konkurrert med blinklysene når alarmen går.
   */
  _bakgrunn(profil) {
    if (profil === "toten") {
      return `
        <g class="bg toten">
          <!-- åkeren: rader som smalner innover, så det leses som dybde -->
          <path class="aker" d="M0 138 L320 138 L320 152 L0 152 z"></path>
          ${[0, 1, 2, 3, 4].map((i) => `
            <path class="akerrad" d="M${-20 + i * 74} 152 L${60 + i * 52} 138"></path>`).join("")}
          <!-- silo og låve til høyre, bak huset -->
          <rect class="laave" x="256" y="94" width="46" height="46" rx="3"></rect>
          <path class="laavetak" d="M252 96 L279 78 L306 96 z"></path>
          <rect class="silo" x="240" y="86" width="14" height="54" rx="7"></rect>
          <!-- traktoren kjører sakte over åkeren -->
          <g class="traktor">
            <rect class="tkropp" x="0" y="118" width="26" height="12" rx="3"></rect>
            <rect class="thytte" x="14" y="108" width="12" height="11" rx="2"></rect>
            <circle class="thjul bak" cx="7" cy="132" r="7"></circle>
            <circle class="thjul for" cx="22" cy="133" r="5"></circle>
            <path class="teksos" d="M12 108 q3 -6 0 -11"></path>
          </g>
        </g>`;
    }
    if (profil === "stromstad") {
      return `
        <g class="bg stromstad">
          <!-- sjøen med to bølgelinjer -->
          <path class="sjo" d="M0 140 L320 140 L320 160 L0 160 z"></path>
          <path class="bolge b1" d="M-20 146 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"></path>
          <path class="bolge b2" d="M-20 153 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"></path>
          <!-- fyrtårnet i bakgrunnen, til venstre -->
          <g class="fyr">
            <path class="fyrtarn" d="M28 138 L33 64 H47 L52 138 z"></path>
            ${[0, 1, 2].map((i) => `
              <rect class="fyrstripe" x="${30 + i * 0.6}" y="${76 + i * 20}"
                    width="${20 - i * 1.2}" height="7"></rect>`).join("")}
            <path class="fyrhus" d="M31 64 h18 l-3 -9 H34 z"></path>
            <circle class="fyrlampe" cx="40" cy="58" r="4"></circle>
            <!-- lysstrålen svinger: én bevegelse, ikke en roterende lyskjegle -->
            <path class="fyrstrale" d="M40 58 L148 30 L148 86 z"></path>
          </g>
          <!-- brygge foran huset -->
          <path class="brygge" d="M96 140 h128 v5 H96 z"></path>
          ${[0, 1, 2, 3].map((i) => `
            <rect class="bryggestolpe" x="${106 + i * 36}" y="145" width="4" height="12"></rect>`).join("")}
        </g>`;
    }
    if (profil === "oslo") {
      return `
        <g class="bg oslo">
          <!-- rekkehus: naboene på hver side, litt lavere og dempet, med felles vegg -->
          <path class="nabotak" d="M44 96 L74 62 L104 96 z"></path>
          <rect class="nabovegg" x="44" y="94" width="60" height="46" rx="3"></rect>
          <rect class="nabovindu" x="58" y="104" width="18" height="15" rx="3"></rect>
          <rect class="nabodor" x="82" y="112" width="12" height="28" rx="2"></rect>

          <path class="nabotak" d="M216 96 L246 62 L276 96 z"></path>
          <rect class="nabovegg" x="216" y="94" width="60" height="46" rx="3"></rect>
          <rect class="nabovindu" x="244" y="104" width="18" height="15" rx="3"></rect>
          <rect class="nabodor" x="224" y="112" width="12" height="28" rx="2"></rect>

          <!-- hekk langs fortauet, som binder rekka sammen -->
          <path class="hekk" d="M30 140 h260 v6 H30 z"></path>
        </g>`;
    }
    return "";
  }

  _hus({ paa, venter, alarm, apne, rorer, ulast }) {
    const antApne = apne.length;
    const dorApen = ulast.length > 0 || apne.some((r) => /dør|door|inngang|veranda/i.test(r.navn));
    const id = this._uid || (this._uid = "s" + Math.random().toString(36).slice(2, 8));

    const V = [[96, 88], [134, 88], [172, 88]];   // veggen går fra x=80 til x=240
    const vindu = ([x, y], i) => {
      const lyser = i < antApne;
      return `
        <g class="vindu ${lyser ? "apen" : ""}" style="--d:${i * 0.2}s">
          ${lyser ? `<rect class="skinn" x="${x - 10}" y="${y - 10}" width="52" height="46" rx="18"></rect>` : ""}
          <rect class="rute" x="${x}" y="${y}" width="32" height="26" rx="4"></rect>
          <path class="sprosse" d="M${x + 16} ${y} V${y + 26}"></path>
        </g>`;
    };

    return `
      <svg viewBox="0 0 320 186" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="${id}vegg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--vegg-lys)"></stop>
            <stop offset="100%" stop-color="var(--vegg-mork)"></stop>
          </linearGradient>
          <linearGradient id="${id}tak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--tak-lys)"></stop>
            <stop offset="100%" stop-color="var(--tak-mork)"></stop>
          </linearGradient>
          <radialGradient id="${id}lys">
            <stop offset="0%" stop-color="var(--orange,#f0a952)" stop-opacity=".5"></stop>
            <stop offset="100%" stop-color="var(--orange,#f0a952)" stop-opacity="0"></stop>
          </radialGradient>
        </defs>

        ${this._bakgrunn(this._c.profil)}

        <ellipse class="bakke" cx="160" cy="146" rx="104" ry="7"></ellipse>

        <g class="roykgruppe">
          <path class="roykpust" d="M214 40 q8 -8 0 -16 q-8 -8 0 -16"></path>
          <path class="roykpust r2" d="M214 40 q-8 -8 0 -16 q8 -8 0 -16"></path>
        </g>
        <rect class="pipe" x="206" y="42" width="16" height="26" rx="4"></rect>

        <path class="tak" fill="url(#${id}tak)"
              d="M160 24 a7 7 0 0 1 5 2 L254 76 a5 5 0 0 1 -3 9 H69 a5 5 0 0 1 -3 -9 L155 26 a7 7 0 0 1 5 -2 z"></path>

        <path class="vegg" fill="url(#${id}vegg)"
              d="M88 82 h144 a8 8 0 0 1 8 8 v46 a6 6 0 0 1 -6 6 H86 a6 6 0 0 1 -6 -6 V90 a8 8 0 0 1 8 -8 z"></path>

        ${V.map(vindu).join("")}

        <g class="dorgruppe ${dorApen ? "apen" : ""}">
          <rect class="dorapning" x="206" y="96" width="26" height="42" rx="5"></rect>
          <g class="dorblad">
            <rect class="dor" x="206" y="96" width="26" height="42" rx="5"></rect>
            <circle class="handtak" cx="226" cy="118" r="2"></circle>
          </g>
        </g>

        ${rorer.length ? `
          <g class="radar" style="--rx:160px; --ry:110px">
            <path class="radarvifte" d="M160 110 L160 44 A66 66 0 0 1 207 63 Z"></path>
          </g>
          <circle class="radarring puls" cx="160" cy="110" r="66"></circle>` : ""}

        <circle class="tellering" cx="160" cy="84" r="76"></circle>

        <g class="blinklys">
          <circle class="blink v" cx="132" cy="30" r="7"></circle>
          <circle class="blink h" cx="188" cy="30" r="7"></circle>
          <rect class="blinkfot" x="126" y="30" width="68" height="5" rx="2.5"></rect>
        </g>
        <rect class="rodvask" x="60" y="20" width="200" height="126" rx="14"></rect>

        <!-- armert: en tynn skannestrek som sveiper nedover fasaden -->
        <g class="skann"><rect x="80" y="82" width="160" height="3" rx="1.5"></rect></g>

        <!-- armert: et lite skjold på veggen som puster -->
        <path class="veggskjold" d="M160 118 l-9 -4 v-7 l9 -4 l9 4 v7 z"></path>

        <g class="sirener">
          <path class="sirene" d="M272 64 a26 26 0 0 1 0 38"></path>
          <path class="sirene" d="M284 52 a42 42 0 0 1 0 62"></path>
          <path class="sirene" d="M48 64 a26 26 0 0 0 0 38"></path>
          <path class="sirene" d="M36 52 a42 42 0 0 0 0 62"></path>
        </g>
      </svg>`;
  }
}

const KI_SIK_SIDEN = (iso) => {
  const d = new Date(iso); if (isNaN(d)) return "";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "nå";
  if (m < 60) return `${m} min siden`;
  const t = Math.floor(m / 60);
  if (t < 24) return `${t} ${t === 1 ? "time" : "timer"} siden`;
  const dg = Math.floor(t / 24);
  if (dg < 7) return `${dg} ${dg === 1 ? "dag" : "dager"} siden`;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
};

const KI_SIK_ESC = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

if (!customElements.get("ki-sikkerhet-card")) {
  customElements.define("ki-sikkerhet-card", KiSikkerhetCard);
}

class KiSikkerhetCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = {
        entity: "Alarmpanel", navn: "Navn", profil: "Sted",
        batteri_grense: "Varsle under batterinivå (%)",
        kompakt: "Kompakt (lavere hus)", tastatur: "Vis tastatur",
        soner: "Vis soneknapper", faner: "Faner",
      };
      this._f.computeLabel = (x) => n[x.name] || x.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(
        new CustomEvent("config-changed",
          { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h;
    /* Standardverdiene må stå i `data`, ikke bare i kortet: uten dem viser editoren
       tomme felt, og første lagring skriver tomme verdier over standardene. */
    this._f.data = { profil: "oslo", navn: "Sikkerhet", batteri_grense: 20,
      kompakt: false, tastatur: true, soner: true,
      faner: ["sikkerhet", "laser", "logg"], ...this._c };
    this._f.schema = [
      { name: "entity", required: true,
        selector: { entity: { domain: ["alarm_control_panel"] } } },
      { name: "navn", selector: { text: {} } },
      { name: "profil", selector: { select: { mode: "dropdown", options: [
        { value: "oslo", label: "Oslo — rekkehus" },
        { value: "toten", label: "Toten — hus med åker og traktor" },
        { value: "stromstad", label: "Strömstad — hus ved sjøen med fyrtårn" },
        { value: "ingen", label: "Ingen bakgrunn" }] } } },
      { name: "batteri_grense", selector: { number: { min: 0, max: 100, step: 5,
        mode: "slider" } } },
      { name: "faner", selector: { select: { multiple: true, mode: "list", options: [
        { value: "sikkerhet", label: "Sikkerhet" },
        { value: "laser", label: "Låser" },
        { value: "logg", label: "Logg" }] } } },
      { name: "soner", selector: { boolean: {} } },
      { name: "tastatur", selector: { boolean: {} } },
      { name: "kompakt", selector: { boolean: {} } },
    ];
  }
}
if (!customElements.get("ki-sikkerhet-card-editor")) {
  customElements.define("ki-sikkerhet-card-editor", KiSikkerhetCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sikkerhet-card"))
  window.customCards.push({ type: "ki-sikkerhet-card", name: "KI Sikkerhet", description: "Animert hus som viser alarm, åpne dører og bevegelse", preview: true });

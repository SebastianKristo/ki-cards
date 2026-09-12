/* ki-vanning-card – OpenSprinkler-kort som setter seg opp selv.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-vanning-card
 * Kortet virker både med OpenSprinkler og med egne ventiler styrt av KI Vanning.
 * prefiks: ute_opensprinkler        # oppdages automatisk hvis den utelates
 * vinter: input_boolean.vinter_modus_vanning
 * varigheter: [5, 10, 15, 30, 60]   # minutter på hurtigknappene
 * skjul_ubrukte: true               # skjuler soner uten navn (S10–S16)
 * faner: [naa, soner, programmer, forbruk, innstillinger]
 * ki_vanning: sensor.ki_vanning_oversikt   # oppdages automatisk når integrasjonen er installert
 * hero: stor                       # stor (hagescene, 190 px) | smal (den gamle linja)
 * demo: false                      # true | vanner | tomt | vinter | regn – eksempeldata å se på
 * navn_kort: true                   # «Plen nord» i stedet for «Plen nord · Spreder B2»
 */
const KI_VANN_VERSJON = "3.3.0";

const KI_VANN_STIL = `
  :host { display:block; max-width:100%; overflow:hidden; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  /* alt skal krympe med kortet, aldri dytte det bredere enn skjermen */
  .rot { display:grid; gap:12px; max-width:100%; min-width:0; }
  .rot > *, .panel > * { min-width:0; max-width:100%; }
  [tabindex]:focus-visible, button:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* ---- hero ---- */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:0; display:grid; cursor:pointer;
    grid-template-columns:76px 1fr min-content; grid-template-areas:"i n t" "i l t"; align-items:center; min-height:74px;
    transition:background .5s var(--myk), color .35s; }
  .hero.vanner { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .hero.vinter { background:var(--gray1000); color:var(--gray100); }
  .hero .ic { grid-area:i; justify-self:start; width:58px; height:58px; margin:4px; border-radius:50%;
    background:rgba(0,0,0,.1); display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .hero.vinter .ic { background:rgba(255,255,255,.12); }
  .hero .n { grid-area:n; align-self:end; font-weight:600; font-size:16px; padding-top:6px; min-width:0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hero .l { grid-area:l; align-self:start; font-size:12px; opacity:.85; padding-bottom:6px; min-width:0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hero .t { grid-area:t; padding-right:18px; font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .hero .strek { position:absolute; left:0; right:0; bottom:0; height:3px; background:rgba(0,0,0,.15); }
  .hero .strek i { display:block; height:100%; background:currentColor; opacity:.7; width:0; transition:width 1s linear; }
  /* vanndråper når det vannes */
  .drapper { position:absolute; inset:0; z-index:-1; overflow:hidden; pointer-events:none; opacity:0; transition:opacity .5s; }
  .hero.vanner .drapper { opacity:.5; }
  .drapper i { position:absolute; top:-20%; width:2px; height:12px; border-radius:1px; background:rgba(255,255,255,.75);
    animation:va-fall linear infinite; }
  @keyframes va-fall { from { transform:translateY(-14px); } to { transform:translateY(120px); } }
  .hero.vanner .ic ha-icon { animation:va-puls 1.6s ease-in-out infinite; }
  @keyframes va-puls { 0%,100% { transform:scale(1); } 50% { transform:scale(1.14); } }

  /* ---- stor hero: hagen ---- */
  .scene { position:relative; height:190px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate;
    color:#eaf6ff; cursor:pointer; background:linear-gradient(180deg,#1d2b3a 0%,#22415a 52%,#1d3a33 100%);
    transition:background .8s var(--myk); }
  .scene.vanner { background:linear-gradient(180deg,#1b3550 0%,#1e5a7a 50%,#1c4a3c 100%); }
  .scene.vinter { background:linear-gradient(180deg,#28303c 0%,#3b4655 55%,#5b6572 100%); }
  .scene.regn { background:linear-gradient(180deg,#222b34 0%,#2f3f4d 55%,#27403a 100%); }
  .scene svg { position:absolute; inset:0; width:100%; height:100%; }
  .scene .tekst { position:absolute; left:20px; right:20px; top:16px; z-index:3; pointer-events:none; }
  .scene .tittel { font-size:17px; font-weight:600; text-shadow:0 1px 10px rgba(0,0,0,.45); }
  .scene .under { font-size:13px; opacity:.85; margin-top:2px; text-shadow:0 1px 8px rgba(0,0,0,.45); }
  .scene .ned { position:absolute; right:20px; top:14px; z-index:3; font-size:30px; font-weight:300;
    font-variant-numeric:tabular-nums; text-shadow:0 2px 12px rgba(0,0,0,.5); }
  .scene .bunn { position:absolute; left:20px; right:20px; bottom:14px; z-index:3; display:flex; align-items:center; gap:10px; }
  .scene .bunn .sp { flex:1; height:5px; border-radius:3px; background:rgba(255,255,255,.22); overflow:hidden; }
  .scene .bunn .sp i { display:block; height:100%; background:#fff; opacity:.85; width:0; transition:width 1s linear; }
  .scene .bunn .tall { font-size:12px; opacity:.9; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .demo { position:absolute; right:20px; bottom:34px; z-index:4; font-size:10px; font-weight:700;
    letter-spacing:.06em; padding:3px 8px; border-radius:6px; background:rgba(255,255,255,.2); }
  .sol { animation:va-sol 9s ease-in-out infinite alternate; transform-box:fill-box; transform-origin:center; }
  @keyframes va-sol { from { transform:translateY(0); } to { transform:translateY(-6px); } }
  .sky2 { animation:va-sky 34s linear infinite alternate; transform-box:fill-box; }
  .sky2.b { animation-duration:48s; animation-delay:-12s; }
  @keyframes va-sky { from { transform:translateX(-6%); } to { transform:translateX(16%); } }
  .straa { transform-box:fill-box; transform-origin:50% 100%; animation:va-straa 3.4s ease-in-out infinite alternate; }
  .scene.vanner .straa { animation-duration:2.1s; }
  @keyframes va-straa { from { transform:rotate(-6deg); } to { transform:rotate(6deg); } }
  .spreder { transform-box:fill-box; transform-origin:50% 100%; }
  .scene.vanner .spreder { animation:va-vipp 3.2s ease-in-out infinite alternate; }
  @keyframes va-vipp { from { transform:rotate(-13deg); } to { transform:rotate(13deg); } }
  /* hele strålegruppa svinger med hodet – strålen og dråpene henger sammen */
  .stralegruppe { opacity:0; transform-box:view-box; }
  .scene.vanner .stralegruppe { opacity:1; animation:va-sving 3.2s ease-in-out infinite alternate; }
  @keyframes va-sving { from { transform:rotate(-13deg); } to { transform:rotate(13deg); } }
  .straale { opacity:.85; }
  .sdrape { opacity:0; transform-box:view-box; }
  .scene.vanner .sdrape { animation:va-sprut 1.4s ease-out infinite; }
  /* dråpene kastes ut langs buen og faller ned igjen */
  @keyframes va-sprut {
    0% { opacity:0; transform:translate(0,0) scale(.45); }
    12% { opacity:.95; }
    45% { transform:translate(calc(var(--dx,40px) * .55), calc(var(--dy,22px) * -1)) scale(.9); }
    100% { opacity:0; transform:translate(var(--dx,40px), calc(var(--dy,22px) * .9)) scale(.8); } }
  .vaatt { opacity:0; transition:opacity 1.4s ease; } .scene.vanner .vaatt { opacity:.5; }
  .snofnugg { opacity:0; } .scene.vinter .snofnugg { animation:va-sno linear infinite; }
  @keyframes va-sno { 0% { opacity:0; transform:translateY(-10px); } 15% { opacity:.9; }
    100% { opacity:.2; transform:translate(10px, 200px); } }
  .regndrape { opacity:0; } .scene.regn .regndrape { animation:va-regn linear infinite; }
  @keyframes va-regn { 0% { opacity:0; transform:translateY(-10px); } 15% { opacity:.8; }
    100% { opacity:0; transform:translateY(200px); } }
  .blomst { transform-box:fill-box; transform-origin:50% 100%; animation:va-straa 4.6s ease-in-out infinite alternate; }
  .scene.vinter .blomst, .scene.vinter .straa { animation:none; opacity:.6; }

  /* ---- hurtigknapper ---- */
  .hurtig { display:grid; grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)); gap:8px; }
  .hk span { overflow:hidden; text-overflow:ellipsis; max-width:100%; white-space:nowrap; }
  .hk { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:500;
    border-radius:24px; padding:14px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;
    --mdc-icon-size:24px; transition:transform .12s var(--fjaer), background .2s; }
  .hk:active { transform:scale(.95); }
  .hk.pa { background:var(--gray1000); color:var(--gray100); }
  .hk.skjult { display:none; }
  .hk ha-icon { color:var(--hk-farge, inherit); }

  /* ---- faner ---- */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
    padding:7px 16px; border-radius:999px; cursor:pointer; white-space:nowrap; transition:background .2s, color .2s; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .panel { display:none; min-width:0; max-width:100%; } .panel.valgt { display:grid; gap:10px; }

  /* ---- soner ---- */
  .boks { background:var(--gray200); border-radius:20px; padding:6px; }
  .bokstittel { display:flex; align-items:center; gap:10px; padding:10px 10px 8px; font-size:16px; font-weight:500; --mdc-icon-size:22px; }
  .bokstittel span { opacity:.55; font-size:12px; margin-left:auto; }
  .sone { border-radius:16px; background:var(--gray100); margin:0 0 6px; overflow:hidden; transition:background .3s; }
  .sone.gaar { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .sonerad { display:grid; grid-template-columns:64px minmax(0,1fr) min-content; grid-template-areas:"i n t" "i l t";
    align-items:center; cursor:pointer; min-width:0; }
  .sonerad .n, .sonerad .l { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .sonerad .ic { grid-area:i; justify-self:start; width:48px; height:48px; margin:6px; border-radius:12px;
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:26px; }
  .sonerad .n { grid-area:n; align-self:end; font-weight:600; padding-top:6px; }
  .sonerad .l { grid-area:l; align-self:start; font-size:12px; opacity:.65; padding-bottom:6px; }
  .sonerad .t { grid-area:t; padding-right:14px; font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
  .varigheter { display:grid; grid-template-columns:repeat(var(--ant,6), minmax(0,1fr)); gap:6px; padding:0 6px 8px; min-width:0; }
  .vk { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:13px; font-weight:600;
    border-radius:12px; padding:10px 2px; cursor:pointer; transition:transform .12s var(--fjaer), background .2s; }
  .sone.gaar .vk { background:rgba(0,0,0,.18); color:var(--black,#000); }
  .vk:active { transform:scale(.93); }
  .vk.stopp { color:var(--red,#e8657a); font-size:12px; }
  .sone.av .sonerad { opacity:.45; }

  /* ---- programmer ---- */
  .prog { display:grid; grid-template-columns:56px minmax(0,1fr) min-content; grid-template-areas:"i n t" "i l t";
    align-items:center; background:var(--gray200); border-radius:16px; cursor:pointer; transition:background .3s; }
  .prog.gaar { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .prog.av { opacity:.55; }
  .prog .ic { grid-area:i; justify-self:start; width:40px; height:40px; margin:8px; border-radius:10px; background:rgba(0,0,0,.15);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:22px; }
  .prog .n { grid-area:n; align-self:end; font-weight:600; font-size:15px; padding-top:6px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .prog .l { grid-area:l; align-self:start; font-size:12px; opacity:.7; padding-bottom:6px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .prog .t { grid-area:t; padding-right:14px; font-size:12px; opacity:.7; font-variant-numeric:tabular-nums; }
  .hint { font-size:11px; opacity:.55; padding:0 4px 4px; }
  /* ---- programkort ---- */
  .pkort { background:var(--gray200); border-radius:20px; padding:14px 16px; display:grid; gap:10px;
    position:relative; overflow:hidden; transition:background .3s; }
  .pkort.gaar { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .pkort.av { opacity:.55; }
  .pkort .topp { display:grid; grid-template-columns:1fr min-content min-content; gap:10px; align-items:center; }
  .pkort .navn { font-size:16px; font-weight:600; display:flex; align-items:center; gap:8px; min-width:0; }
  .pkort .navn span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pkort .klokke { font-size:22px; font-weight:300; font-variant-numeric:tabular-nums; }
  .pkort .naar { font-size:12px; opacity:.7; }
  .merkelapp { font-size:10px; font-weight:700; letter-spacing:.04em; padding:3px 7px; border-radius:7px;
    background:rgba(0,0,0,.16); white-space:nowrap; }
  .dagsrad { display:flex; gap:4px; }
  .dagsrad i { flex:1; text-align:center; font-size:10px; font-weight:700; font-style:normal; padding:4px 0;
    border-radius:6px; background:rgba(255,255,255,.07); opacity:.4; }
  .pkort.gaar .dagsrad i { background:rgba(0,0,0,.12); }
  .dagsrad i.pa { opacity:1; background:var(--gray1000); color:var(--gray100); }
  .pkort.gaar .dagsrad i.pa { background:var(--black,#000); color:#fff; }
  .sonebrikker { display:flex; flex-wrap:wrap; gap:6px; }
  .sonebrikke { font-size:11px; font-weight:600; padding:4px 9px; border-radius:999px; background:rgba(255,255,255,.09); }
  .pkort.gaar .sonebrikke { background:rgba(0,0,0,.16); }
  .sonebrikke.aktiv { background:var(--gray1000); color:var(--gray100); animation:va-blink 1.4s ease-in-out infinite; }
  .pknapper { display:grid; grid-template-columns:1fr 1fr min-content; gap:8px; align-items:center; }
  .pk { border:0; border-radius:12px; padding:10px; font:inherit; font-size:12px; font-weight:600; cursor:pointer;
    background:rgba(255,255,255,.09); color:inherit; display:flex; align-items:center; justify-content:center; gap:6px;
    --mdc-icon-size:18px; }
  .pkort.gaar .pk { background:rgba(0,0,0,.16); }
  .pk:active { transform:scale(.96); }
  .pbryter { width:44px; height:26px; border-radius:13px; background:rgba(255,255,255,.14); position:relative;
    cursor:pointer; transition:background .3s; }
  .pbryter.pa { background:var(--green,#7ee081); }
  .pbryter i { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%;
    background:var(--gray1000); transition:transform .3s var(--fjaer); }
  .pbryter.pa i { transform:translateX(18px); background:var(--black,#000); }

  /* ---- kalender og historikk ---- */
  .kaldag { display:grid; grid-template-columns:70px 1fr; gap:10px; padding:10px 0;
    border-top:1px solid rgba(255,255,255,.07); }
  .kaldag:first-child { border-top:0; }
  .kaldag .dag { font-size:12px; font-weight:600; opacity:.65; padding-top:3px; }
  .kaldag .dag.idag { opacity:1; color:var(--blue,#6ec6ff); }
  .kalrad { display:grid; grid-template-columns:46px 1fr min-content; gap:10px; align-items:baseline;
    font-size:13px; padding:3px 0; }
  .kalrad .kl { font-variant-numeric:tabular-nums; font-weight:600; }
  .kalrad .hva { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .kalrad .est { font-size:12px; opacity:.55; white-space:nowrap; }
  .hist { display:grid; gap:8px; }
  .histrad { display:grid; grid-template-columns:minmax(0,1fr) max-content; gap:10px; font-size:13px; align-items:baseline; }
  .histrad > span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .histrad > span:nth-child(2) { white-space:nowrap; }
  .histrad .spor { grid-column:1 / -1; height:6px; border-radius:4px; background:var(--gray100); overflow:hidden; }
  .histrad .spor i { display:block; height:100%; background:var(--blue,#6ec6ff); border-radius:4px; }

  /* innstillinger */
  .innboks { background:var(--gray200); border-radius:20px; overflow:hidden; }
  .innrad { display:grid; grid-template-columns:1fr min-content min-content; gap:12px; align-items:center;
    padding:14px 16px; cursor:pointer; border-top:1px solid rgba(255,255,255,.06); --mdc-icon-size:20px; }
  .innrad:first-child { border-top:0; }
  .innrad:active { background:var(--gray100); }
  .innrad .n { font-size:14px; font-weight:500; }
  .innrad .v { font-size:13px; opacity:.6; white-space:nowrap; }
  .innrad ha-icon { opacity:.5; }
  .innrad .sw { width:42px; height:24px; border-radius:12px; background:var(--gray100); position:relative; transition:background .3s; }
  .innrad .sw.pa { background:var(--green,#7ee081); }
  .innrad .sw i { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%;
    background:var(--gray1000); transition:transform .3s var(--fjaer); }
  .innrad .sw.pa i { transform:translateX(18px); background:var(--black,#000); }
  /* skjema for å lage og endre programmer */
  .nyprog { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:13px; font-weight:600;
    border-radius:16px; padding:12px; cursor:pointer; width:100%; }
  .nyprog:active { transform:scale(.98); }
  .skjema { background:var(--gray200); border-radius:20px; padding:14px; display:grid; gap:12px; }
  .skjema { max-width:100%; overflow:hidden; }
  .skjema .rad { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; align-items:center; }
  .skjema .rad > div { min-width:0; }
  .skjema label { font-size:12px; opacity:.6; display:block; margin-bottom:4px; }
  .skjema input[type=text], .skjema input[type=time], .skjema input[type=number], .skjema input[type=date] {
    width:100%; max-width:100%; box-sizing:border-box; background:var(--gray100); border:0; border-radius:12px;
    color:var(--gray1000); font:inherit; font-size:14px; padding:10px 12px; appearance:none; -webkit-appearance:none; }
  .skjema input::-webkit-calendar-picker-indicator { filter:invert(1); opacity:.5; }
  .dager { display:flex; gap:5px; flex-wrap:wrap; }
  .dag { border:0; background:var(--gray100); color:var(--gray1000); font:inherit; font-size:12px; font-weight:600;
    border-radius:999px; padding:8px 0; cursor:pointer; flex:1 1 36px; min-width:36px; }
  .dag.valgt { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .bryterrad { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; }
  .velg { display:inline-flex; padding:2px; gap:3px; border-radius:999px; background:var(--gray100); }
  .velg button { border:0; background:none; color:var(--gray1000); font:inherit; font-size:12px; font-weight:600;
    padding:7px 12px; border-radius:999px; cursor:pointer; opacity:.65; }
  .velg button.valgt { background:var(--gray1000); color:var(--gray100); opacity:1; }
  .sonevalg { display:grid; gap:6px; }
  .sonerad2 { display:grid; grid-template-columns:26px 1fr 74px; gap:8px; align-items:center; font-size:13px; }
  .sonerad2 input[type=checkbox] { width:18px; height:18px; accent-color:var(--active-big,#ee95ff); }
  .skjemaknapper { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .sk { border:0; border-radius:14px; padding:12px; font:inherit; font-size:13px; font-weight:600; cursor:pointer;
    background:var(--gray100); color:var(--gray1000); }
  .sk.lagre { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .sk.slett { color:var(--red,#e8657a); }
  .progknapp { border:0; background:none; color:inherit; cursor:pointer; padding:6px; --mdc-icon-size:20px; opacity:.7; }
  .tom { padding:18px; font-size:13px; opacity:.6; text-align:center; }
  .nokkel { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px,1fr)); gap:8px; min-width:0; }
  .nk .v { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nk { background:var(--gray200); border-radius:16px; padding:12px 14px; }
  .nk .n { font-size:12px; opacity:.55; }
  .nk .v { font-size:16px; font-weight:500; margin-top:2px; }
  /* ---- estimat og forbruk ---- */
  .maal { background:var(--gray200); border-radius:20px; padding:16px 18px; display:grid; gap:10px;
    min-width:0; max-width:100%; overflow:hidden; }
  .maal .rad { display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap;
    min-width:0; }
  .maal .rad > div { min-width:0; }
  .maal .und { overflow-wrap:anywhere; }
  .maal .stor { font-size:2em; font-weight:300; line-height:1; font-variant-numeric:tabular-nums; }
  .maal .und { font-size:12px; opacity:.6; }
  .stolpe { height:10px; border-radius:6px; background:var(--gray100); overflow:hidden; position:relative; }
  .stolpe i { display:block; height:100%; border-radius:6px; width:0;
    background:linear-gradient(90deg, var(--blue,#6ec6ff), #9ad9ff); transition:width 1.1s var(--myk); }
  .stolpe.lever i::after { content:""; position:absolute; inset:0;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent); animation:va-sveip 2.4s ease-in-out infinite; }
  @keyframes va-sveip { from { transform:translateX(-100%); } to { transform:translateX(100%); } }
  .fordeling { display:grid; gap:7px; }
  .frad { display:grid; grid-template-columns:minmax(0,1fr) 64px; gap:10px; align-items:center; font-size:13px; min-width:0; }
  .frad > div { min-width:0; }
  .fbar { height:8px; border-radius:5px; background:var(--gray100); overflow:hidden; }
  .fbar i { display:block; height:100%; border-radius:5px; background:var(--blue,#6ec6ff); width:0;
    transition:width 1s var(--myk); }
  .frad .navn { display:flex; align-items:center; gap:7px; min-width:0; }
  .frad .navn span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .frad .tall { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; }
  .knagg { font-size:10px; font-weight:700; padding:1px 6px; border-radius:6px; background:var(--gray100); opacity:.7; }
  .periodefaner { display:flex; gap:6px; flex-wrap:wrap; }
  .pf { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:600;
    padding:6px 12px; border-radius:999px; cursor:pointer; opacity:.6; }
  .pf.valgt { opacity:1; background:var(--gray1000); color:var(--gray100); }

  /* ---- program med soner ---- */
  .pdetalj { display:flex; flex-wrap:wrap; gap:6px; padding:0 12px 10px; min-width:0; }
  .pz { font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; background:rgba(0,0,0,.16); }
  .prog.gaar .pz.aktiv { background:var(--gray1000); color:var(--gray100); animation:va-blink 1.4s ease-in-out infinite; }
  @keyframes va-blink { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  .pstolpe { height:4px; margin:0 12px 10px; border-radius:3px; background:rgba(0,0,0,.15); overflow:hidden; }
  .pstolpe i { display:block; height:100%; background:currentColor; opacity:.75; width:0; transition:width 1s linear; }
  .nedtelling { font-size:12px; opacity:.75; font-variant-numeric:tabular-nums; }

  /* gress som svaier når det vannes */
  .gress { position:absolute; left:0; right:0; bottom:0; height:26px; z-index:-1; opacity:0; transition:opacity .6s; }
  .hero.vanner .gress { opacity:.35; }
  .gress i { position:absolute; bottom:0; width:3px; border-radius:2px 2px 0 0; background:currentColor;
    transform-origin:50% 100%; animation:va-svai 2.6s ease-in-out infinite alternate; }
  @keyframes va-svai { from { transform:rotate(-8deg); } to { transform:rotate(8deg); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiVaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* Ikon etter vanningsmetode i sonenavnet */
/* Hagen i hero-kortet: himmel, sol, bed, gress og en spreder som svinger */
const kiVaScene = () => {
  const straa = Array.from({ length: 34 }, (_, i) => {
    const x = 6 + i * 9.2, h = 9 + ((i * 7) % 13);
    return `<path class="straa" d="M${x} 150 q2 -${h / 2} 0 -${h}" stroke="#5fbf7a" stroke-width="2.4" fill="none"
      stroke-linecap="round" style="animation-delay:-${((i * 0.21) % 3.4).toFixed(2)}s;opacity:${(0.55 + (i % 4) * 0.12).toFixed(2)}"/>`;
  }).join("");
  /* Dråpene ligger inne i samme gruppe som strålen, slik at de kastes ut fra
     dysa og svinger med den i stedet for å falle ned fra himmelen. */
  const sprut = Array.from({ length: 10 }, (_, i) => {
    const lengde = 30 + ((i * 11) % 26), hoyde = 10 + ((i * 7) % 10);
    return `<circle class="sdrape" cx="250" cy="110" r="${1.8 + (i % 3) * 0.5}" fill="#bfe9ff"
      style="--dx:${lengde.toFixed(0)}px;--dy:${hoyde.toFixed(0)}px;animation-delay:-${((i * 0.15) % 1.5).toFixed(2)}s"/>`;
  }).join("");
  const sno = Array.from({ length: 16 }, (_, i) =>
    `<circle class="snofnugg" cx="${12 + i * 20}" cy="-6" r="${1.6 + (i % 3) * 0.5}" fill="#fff"
      style="animation-duration:${(5 + (i % 4)).toFixed(1)}s;animation-delay:-${((i * 0.4) % 5).toFixed(1)}s"/>`).join("");
  const regn = Array.from({ length: 18 }, (_, i) =>
    `<rect class="regndrape" x="${10 + i * 18}" y="-8" width="1.6" height="11" rx="1" fill="#9fd4ff"
      style="animation-duration:${(0.8 + (i % 4) * 0.12).toFixed(2)}s;animation-delay:-${((i * 0.17) % 1).toFixed(2)}s"/>`).join("");
  return `<svg viewBox="0 0 320 190" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g class="sol" transform="translate(268 34)"><circle r="30" fill="#ffd98a" opacity=".18"/><circle r="15" fill="#ffe2a3"/></g>
    <g class="sky2" opacity=".22" fill="#eaf6ff"><ellipse cx="70" cy="34" rx="26" ry="12"/><ellipse cx="92" cy="30" rx="18" ry="14"/></g>
    <g class="sky2 b" opacity=".14" fill="#eaf6ff"><ellipse cx="180" cy="22" rx="22" ry="10"/><ellipse cx="198" cy="19" rx="14" ry="11"/></g>
    ${sno}${regn}
    <path d="M0 128 q80 -14 160 -4 t160 -6 V190 H0 Z" fill="#2b5c46"/>
    <path class="vaatt" d="M0 136 q80 -12 160 -3 t160 -5 V190 H0 Z" fill="#17403a"/>
    <g fill="#8b5e3c" opacity=".55"><ellipse cx="52" cy="150" rx="34" ry="9"/><ellipse cx="150" cy="156" rx="30" ry="8"/></g>
    <g class="blomst" style="animation-delay:-1s"><path d="M46 150v-16" stroke="#5fbf7a" stroke-width="2.4" fill="none"/>
      <circle cx="46" cy="131" r="5" fill="#ff9ec4"/><circle cx="46" cy="131" r="2" fill="#ffe2a3"/></g>
    <g class="blomst" style="animation-delay:-2.3s"><path d="M60 152v-12" stroke="#5fbf7a" stroke-width="2.2" fill="none"/>
      <circle cx="60" cy="137" r="4" fill="#c9a7ff"/></g>
    <g class="blomst" style="animation-delay:-3.1s"><path d="M148 156v-14" stroke="#5fbf7a" stroke-width="2.2" fill="none"/>
      <circle cx="148" cy="140" r="4.5" fill="#ffd98a"/></g>
    ${straa}
    <g class="stralegruppe" transform-origin="250px 110px">
      <g class="straale">
        <path d="M250 110 q30 -34 62 -16" stroke="#bfe9ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M250 110 q24 -28 48 -18" stroke="#bfe9ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>
      </g>
      ${sprut}
    </g>
    <g class="spreder" transform-origin="250px 150px">
      <rect x="246" y="112" width="8" height="40" rx="4" fill="#dce8f0"/>
      <circle cx="250" cy="110" r="7" fill="#eaf6ff"/><circle cx="250" cy="110" r="3" fill="#6aa9c9"/>
      <ellipse cx="250" cy="152" rx="16" ry="5" fill="#1d3a33" opacity=".6"/>
    </g>
  </svg>`;
};

const kiVaIkon = (t) => /drypp/i.test(t) ? "mdi:water-outline" : /spreder|spr\b/i.test(t) ? "mdi:sprinkler-variant" : "mdi:sprinkler";

class KiVanningCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "naa"; }
  static getConfigElement() { return document.createElement("ki-vanning-card-editor"); }
  static getStubConfig() { return {}; }
  getCardSize() { return 10; }

  setConfig(c) {
    this._c = { varigheter: [5, 10, 15, 30, 60], skjul_ubrukte: true, navn_kort: true,
                faner: ["naa", "soner", "programmer", "forbruk", "innstillinger"], ...(c || {}) };
    this._periode = "i_dag";
    this._fane = this._c.faner[0]; this._bygget = false; this._tegn();
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g) { this._tegn(); return; }
    const ids = this._ider();
    if (!this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  connectedCallback() { clearInterval(this._ur); this._ur = setInterval(() => this._tikk(), 1000); }
  disconnectedCallback() { clearInterval(this._ur); }

  /* Demomodus: kortet tegnes med eksempeldata, fint når anlegget er av eller
     OpenSprinkler ikke svarer. `demo: true` gir en sone som vanner. */
  _demoData() {
    if (this._demo) return this._demo;
    const modus = this._c.demo === true ? "vanner" : String(this._c.demo);
    const p = "demo_opensprinkler";
    const soner = [["01", "Urtebed", "Drypp B1"], ["02", "Lavendelbed", "Drypp B1"], ["03", "Garasje/Roser", "Spreder B1"],
      ["04", "Bed v/støttemur", "Drypp B2"], ["05", "Plen nord", "Spreder B2"], ["06", "Hilliihekk", "Drypp B2"],
      ["07", "Ligusterhekk", "Drypp B3"], ["08", "Plen sør", "Spreder B3"]];
    const S = {};
    soner.forEach(([nr, navn, metode]) => {
      const h = "_" + navn.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      S[`switch.${p}_s${nr}${h}_station_enabled`] = { state: nr === "07" ? "off" : "on",
        attributes: { friendly_name: `S${nr} ${navn} · ${metode} Station Enabled` } };
      const gaar = modus === "vanner" && nr === "05";
      S[`binary_sensor.${p}_s${nr}${h}_station_running`] = { state: gaar ? "on" : "off", attributes: {} };
      S[`sensor.${p}_s${nr}${h}_station_status`] = { state: gaar ? "7:24" : "idle", attributes: {} };
    });
    S[`switch.${p}_enabled`] = { state: modus === "av" ? "off" : "on", attributes: {} };
    S[`binary_sensor.${p}_rain_delay_active`] = { state: modus === "regn" ? "on" : "off", attributes: {} };
    S[`sensor.${p}_rain_delay_stop_time`] = { state: "i morgen 07:00", attributes: {} };
    S["input_boolean.demo_vinter"] = { state: modus === "vinter" ? "on" : "off", attributes: {} };
    S[`sensor.${p}_water_level`] = { state: "100", attributes: {} };
    S[`sensor.${p}_flow_rate`] = { state: "12.4", attributes: {} };
    [["p1", "Plen nord", "on", modus === "vanner" ? "on" : "off"], ["p2", "Plen sør", "off", "off"], ["p3", "Runde – Mandag", "on", "off"]]
      .forEach(([slug, navn, pa, gaar]) => {
        S[`switch.${p}_${slug}_program_enabled`] = { state: pa, attributes: { friendly_name: navn + " Program Enabled" } };
        S[`binary_sensor.${p}_${slug}_program_running`] = { state: gaar, attributes: {} };
        S[`time.${p}_${slug}_start_time`] = { state: "06:00:00", attributes: {} };
        S[`number.${p}_${slug}_interval_days`] = { state: "2", attributes: {} };
      });
    S["sensor.demo_ki_vanning_oversikt"] = { state: "8 soner", attributes: {
      integrasjon: "ki_vanning", ki_type: "oversikt", prefiks: p, pris_m3: 41.11,
      i_dag: 842, uke: 3120, maaned: 9480, aar: 41200, totalt: 52340, kostnad_i_dag: 34.61,
      estimat_i_dag: 1180, estimat_kostnad: 48.5,
      neste: { naar: "I morgen", tid: "06:00", navn: "Runde – Mandag", total_min: 64, estimat_liter: 520 },
      programmer: [
        { navn: "Plen nord", tid: "06:00", i_dag: true, total_min: 40, estimat_liter: 480,
          soner: [{ navn: "Plen nord", min: 25, nr: 5 }, { navn: "Hilliihekk", min: 15, nr: 6 }] },
        { navn: "Runde – Mandag", tid: "05:30", i_dag: false, total_min: 64, estimat_liter: 520,
          soner: [{ navn: "Urtebed", min: 12, nr: 1 }, { navn: "Lavendelbed", min: 12, nr: 2 }, { navn: "Garasje/Roser", min: 40, nr: 3 }] }],
      soner: [
        { nr: 5, navn: "Plen nord", i_dag: 420, uke: 1600, maaned: 4200, aar: 18400, totalt: 18400, rate: 12.4, kalibrert: true },
        { nr: 6, navn: "Hilliihekk", i_dag: 180, uke: 700, maaned: 1900, aar: 6200, totalt: 6200, rate: 6.1, kalibrert: true },
        { nr: 1, navn: "Urtebed", i_dag: 120, uke: 480, maaned: 1400, aar: 3100, totalt: 3100, rate: 4.2, kalibrert: true },
        { nr: 0, navn: "Hageslange", i_dag: 122, uke: 340, maaned: 980, aar: 2400, totalt: 2400, rate: 8, kalibrert: false }] } };
    this._demo = S;
    return S;
  }
  get _states() { return this._c && this._c.demo ? this._demoData() : (this._h ? this._h.states : {}); }
  _st(id) { const S = this._states; return (id && S[id]) || null; }
  _on(id) { const s = this._st(id); return !!s && s.state === "on"; }
  /* Oversiktssensoren fra KI Vanning gir forbruk, estimat og programplan ferdig regnet ut */
  _ki() {
    const S = this._states; if (!S) return null;
    const finn = () => Object.keys(S).find((x) => x.startsWith("sensor.") && (S[x].attributes || {}).ki_type === "oversikt"
      && (S[x].attributes || {}).integrasjon === "ki_vanning") || null;
    const id = this._c.ki_vanning || (this._c.demo ? finn() : (this._kiId !== undefined ? this._kiId : (this._kiId = finn())));
    const st = id ? S[id] : null;
    return st ? { id, ...st.attributes } : null;
  }
  /* Finner en entitet fra KI Vanning ut fra markøren i attributtene,
     slik at vannpris, feriemodus og knappene ikke må skrives inn. */
  _kiEnt(type) {
    const S = this._states; if (!S) return null;
    this._kiEntCache = this._kiEntCache || {};
    if (this._kiEntCache[type] !== undefined) return this._kiEntCache[type];
    const treff = Object.keys(S).find((id) => {
      const a = S[id].attributes || {};
      return a.integrasjon === "ki_vanning" && a.ki_type === type;
    }) || null;
    this._kiEntCache[type] = treff;
    return treff;
  }
  _litertekst(v) {
    const n = Number(v) || 0;
    return n >= 1000 ? (n / 1000).toLocaleString("nb-NO", { maximumFractionDigits: 2 }) + " m³"
      : Math.round(n).toLocaleString("nb-NO") + " L";
  }

  /* ---------- automatisk oppsett ---------- */
  _prefiks() {
    if (this._c.prefiks) return this._c.prefiks;
    const ki0 = this._ki();
    if (ki0 && ki0.modus === "ventiler") return ki0.prefiks || "ki_vanning";
    if (this._pref !== undefined) return this._pref;
    const S = this._states;
    const t = Object.keys(S).find((id) => /^binary_sensor\..+_s\d\d.*_station_running$/.test(id));
    this._pref = t ? t.replace(/^binary_sensor\./, "").replace(/_s\d\d.*_station_running$/, "") : null;
    if (this._c && this._c.demo) { const x = this._pref; this._pref = undefined; return x; }
    return this._pref;
  }
  /* Soner: S01 … S16 med navn og metode hentet fra friendly_name */
  /* Styrer KI Vanning ventilene selv, kommer sonene og programmene derfra. */
  _ventilmodus() { const ki = this._ki(); return !!ki && ki.modus === "ventiler"; }
  _soner() {
    const ki = this._ki();
    if (ki && ki.modus === "ventiler") {
      return (ki.soner || []).filter((z) => z.nr !== 0).map((z) => ({
        nr: String(z.nr).padStart(2, "0"), navn: z.navn, metode: z.metode || "", boks: z.boks || "",
        bryter: z.bryter, gaar: z.gaar || z.bryter, status: z.status || z.bryter, ubrukt: false,
      }));
    }
    const S = this._states, p = this._prefiks(); if (!p) return [];
    const re = new RegExp("^switch\\." + p + "_s(\\d\\d)(.*)_station_enabled$");
    return Object.keys(S).map((id) => {
      const m = id.match(re); if (!m) return null;
      const nr = m[1], hale = m[2] || "";
      const fn = (S[id].attributes || {}).friendly_name || "";
      /* «S05 Plen nord · Spreder B2 Station Enabled» → navn og metode */
      let tekst = fn.replace(/^S\d\d\s*/i, "").replace(/\s*Station Enabled$/i, "").trim();
      const ubrukt = !tekst || /^S?\d+$/.test(tekst);
      const deler = tekst.split("·").map((x) => x.trim());
      const navn = deler[0] || "Sone " + nr;
      const metode = deler[1] || "";
      const boks = (metode.match(/B(\d)/i) || [])[1] || (tekst.match(/B(\d)/i) || [])[1] || "";
      return { nr, navn, metode, boks, ubrukt,
        bryter: id,
        gaar: `binary_sensor.${p}_s${nr}${hale}_station_running`,
        status: `sensor.${p}_s${nr}${hale}_station_status` };
    }).filter(Boolean).sort((a, b) => a.nr.localeCompare(b.nr))
      .filter((z) => !(this._c.skjul_ubrukte !== false && z.ubrukt));
  }
  _programmer() {
    const ki = this._ki();
    if (ki && ki.modus === "ventiler") {
      return (ki.program_historikk || []).map((x) => ({
        navn: x.navn, slug: x.slug, bryter: null, gaar: null, start: null, intervall: null,
        plan: x,
      }));
    }
    const S = this._states, p = this._prefiks(); if (!p) return [];
    const re = new RegExp("^switch\\." + p + "_(.+)_program_enabled$");
    return Object.keys(S).map((id) => {
      const m = id.match(re); if (!m) return null;
      const slug = m[1];
      const fn = (S[id].attributes || {}).friendly_name || slug;
      return { navn: fn.replace(/\s*Program Enabled$/i, "").trim(), slug, bryter: id,
        gaar: `binary_sensor.${p}_${slug}_program_running`,
        start: `time.${p}_${slug}_start_time`,
        vaer: `switch.${p}_${slug}_program_use_weather`,
        intervall: `number.${p}_${slug}_interval_days` };
    }).filter(Boolean).sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }
  _styring() {
    const p = this._prefiks();
    return p ? {
      aktiv: `switch.${p}_enabled`, regn: `binary_sensor.${p}_rain_delay_active`,
      regn_til: `sensor.${p}_rain_delay_stop_time`, vannivaa: `sensor.${p}_water_level`,
      flyt: `sensor.${p}_flow_rate`, strom: `sensor.${p}_current_draw`,
      siste: `sensor.${p}_last_run`, neste: `sensor.opensprinkler_next_run`,
      pause: `binary_sensor.${p}_paused`, pause_til: `sensor.${p}_pause_end_time`,
    } : {};
  }
  _ider() {
    const s = this._styring(), z = this._soner(), p = this._programmer();
    return [...Object.values(s), this._c.vinter,
      ...z.flatMap((x) => [x.bryter, x.gaar, x.status]),
      ...p.flatMap((x) => [x.bryter, x.gaar, x.start])].filter(Boolean);
  }
  _aktivSone() { return this._soner().find((z) => this._on(z.gaar)) || null; }

  /* ---------- handlinger ---------- */
  _tjeneste(navn, data, mål) {
    if (navigator.vibrate) navigator.vibrate(10);
    return this._h.callService("opensprinkler", navn, data || {}, mål ? { entity_id: mål } : undefined);
  }
  _ki_tjeneste(navn, data) {
    if (navigator.vibrate) navigator.vibrate(10);
    return this._h.callService("ki_vanning", navn, data || {});
  }
  _kjor(sone, min) {
    if (this._ventilmodus()) return this._ki_tjeneste("kjor", { sone: sone.bryter, minutter: min });
    this._tjeneste("run_station", { run_seconds: min * 60 }, sone.bryter);
  }
  _stopp(id) {
    if (this._ventilmodus()) return this._ki_tjeneste("stopp", {});
    this._tjeneste("stop", {}, id || this._styring().aktiv);
  }
  _regn(t) {
    if (this._ventilmodus()) return this._ki_tjeneste("sett_ferie", { pa: t > 0 });
    this._tjeneste("set_rain_delay", { rain_delay: t }, this._styring().aktiv);
  }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
  _veksle(id) { if (navigator.vibrate) navigator.vibrate(8); this._h.callService("homeassistant", "toggle", { entity_id: id }); }

  /* ---------- oppbygging ---------- */
  _bygg() {
    const c = this._c, faner = c.faner;
    const navn = { naa: "Nå", soner: "Soner", programmer: "Programmer", forbruk: "Forbruk", innstillinger: "Mer" };
    const gress = Array.from({ length: 26 }, (_, i) =>
      `<i style="left:${(i * 4 + 1)}%;height:${8 + ((i * 7) % 14)}px;animation-delay:-${((i * 0.19) % 2.6).toFixed(2)}s"></i>`).join("");
    const drapper = Array.from({ length: 14 }, (_, i) =>
      `<i style="left:${(i * 37 + 9) % 96 + 2}%;animation-duration:${(0.7 + (i % 5) * 0.12).toFixed(2)}s;animation-delay:-${((i * 0.23) % 1.2).toFixed(2)}s"></i>`).join("");
    this.shadowRoot.innerHTML = `<style>${KI_VANN_STIL}</style>
      <div class="rot">
        ${c.hero === "smal" ? `<div class="hero" role="button" tabindex="0">
          <div class="drapper">${drapper}</div>
          <div class="gress">${gress}</div>
          <div class="ic"><ha-icon icon="mdi:sprinkler-variant"></ha-icon></div>
          <div class="n"></div><div class="l"></div><div class="t"></div>
          <div class="strek"><i></i></div>
        </div>` : `<div class="scene" role="button" tabindex="0">
          ${kiVaScene()}
          <div class="tekst"><div class="tittel"></div><div class="under"></div></div>
          <div class="ned"></div>
          ${c.demo ? `<div class="demo">DEMO</div>` : ""}
          <div class="bunn"><div class="sp"><i></i></div><div class="tall"></div></div>
        </div>`}

        <div class="hurtig">
          <button class="hk" data-h="stopp" style="--hk-farge:var(--red,#e8657a)"><ha-icon icon="mdi:stop-circle"></ha-icon><span>Stopp alt</span></button>
          <button class="hk" data-h="regn24"><ha-icon icon="mdi:weather-rainy"></ha-icon><span>Regn 24t</span></button>
          <button class="hk" data-h="regn0"><ha-icon icon="mdi:weather-sunny"></ha-icon><span>Nullstill</span></button>
          <button class="hk skjult" data-h="program"><ha-icon icon="mdi:play-circle"></ha-icon><span>Kjør program</span></button>
          <button class="hk" data-h="vinter"><ha-icon icon="mdi:snowflake"></ha-icon><span>${c.vinter ? "Vintermodus" : "Anlegg"}</span></button>
        </div>

        ${faner.length > 1 ? `<div class="faner"><div class="skinne" role="tablist">${faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" role="tab" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        ${faner.map((f) => `<div class="panel ${f === this._fane ? "valgt" : ""}" data-p="${f}"></div>`).join("")}
      </div>`;

    const r = this.shadowRoot;
    r.querySelector(".hero, .scene").addEventListener("click", () => {
      const z = this._aktivSone();
      if (z) this._stopp(z.bryter); else this._mer(this._styring().aktiv);
    });
    r.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => {
      const h = b.dataset.h;
      if (h === "program") { const p = this._programmer()[0]; if (p) this._ki_tjeneste("kjor_program", { program: p.navn }); }
      else if (h === "stopp") this._stopp();
      else if (h === "regn24") this._regn(24);
      else if (h === "regn0") this._regn(0);
      else this._veksle(c.vinter || this._styring().aktiv);
    }));
    r.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => { this._fane = b.dataset.f; this._tegn(); }));
    this._bygget = true;
  }

  /* ---------- paneler ---------- */
  /* Forbruksfane: perioder, fordeling per sone og estimat */
  /* «Mer»: innstillingene som ikke trenger å stå nederst hele tiden */
  _panelInnstillinger() {
    const ki = this._ki();
    const rad = (id, navn, tekst) => {
      if (!id || !this._st(id)) return "";
      const st = this._st(id);
      const bryter = id.startsWith("switch.") || id.startsWith("input_boolean.");
      const knapp = id.startsWith("button.");
      return `<div class="innrad" data-inn="${kiVaEsc(id)}" data-type="${bryter ? "bryter" : knapp ? "knapp" : "mer"}" role="button" tabindex="0">
        <div class="n">${kiVaEsc(navn)}</div>
        <div class="v">${bryter ? (st.state === "on" ? "På" : "Av") : kiVaEsc(tekst !== undefined ? tekst : st.state)}</div>
        ${bryter ? `<div class="sw ${st.state === "on" ? "pa" : ""}"><i></i></div>`
          : knapp ? `<ha-icon icon="mdi:play-circle-outline"></ha-icon>` : `<ha-icon icon="mdi:pencil"></ha-icon>`}
      </div>`;
    };
    const pris = this._kiEnt("vannpris"), ferie = this._kiEnt("ferie"), faktor = this._kiEnt("ferie_faktor");
    const deler = [
      rad(ferie, "Feriemodus", undefined),
      rad(faktor, "Ferie – lengre vanning", faktor && this._st(faktor) ? "×" + this._st(faktor).state : ""),
      rad(pris, "Vannpris", pris && this._st(pris) ? this._st(pris).state + " kr/m³" : ""),
      rad(this._kiEnt("hent_plan"), "Hent programplan på nytt", "Kjør"),
      rad(this._kiEnt("nullstill_forbruk"), "Nullstill forbruk", "Kjør"),
      rad(this._kiEnt("nullstill_kalibrering"), "Nullstill kalibrering", "Kjør"),
    ].filter(Boolean).join("");
    if (!deler) return `<div class="tom">Installer <b>KI Vanning</b> for innstillinger her.</div>`;
    return `<div class="innboks">${deler}</div>
      ${ki ? `<div class="hint">Vannpris og feriemodus kommer fra KI Vanning – ingen entiteter å skrive inn.</div>` : ""}`;
  }

  _panelForbruk() {
    const ki = this._ki();
    if (!ki) return `<div class="tom">Installer <b>KI Vanning</b>-integrasjonen for forbruk, kostnad og estimat.</div>`;
    const per = { i_dag: "I dag", uke: "Uke", maaned: "Måned", aar: "År" };
    const valgt = this._periode;
    const total = Number(ki[valgt] || 0);
    const soner = (ki.soner || []).slice().sort((a, b) => (b.i_dag || 0) - (a.i_dag || 0));
    const maks = Math.max(1, ...soner.map((x) => Number(x.i_dag || 0)));
    const pris = Number(ki.pris_m3 || 0);
    const est = Number(ki.estimat_i_dag || 0), brukt = Number(ki.i_dag || 0);
    const andel = est ? Math.min(100, (brukt / est) * 100) : 0;
    return `
      <div class="periodefaner">${Object.keys(per).map((k) =>
        `<button class="pf ${k === valgt ? "valgt" : ""}" data-per="${k}">${per[k]}</button>`).join("")}</div>
      <div class="maal">
        <div class="rad"><div><div class="stor">${this._litertekst(total)}</div>
          <div class="und">${per[valgt]} · ${(total / 1000 * pris).toFixed(2)} kr</div></div>
          <div style="text-align:right"><div class="stor" style="font-size:1.2em">${this._litertekst(est)}</div>
          <div class="und">estimat i dag</div></div></div>
        <div class="stolpe ${this._aktivSone() ? "lever" : ""}"><i style="width:${andel.toFixed(1)}%"></i></div>
        <div class="und">${Math.round(brukt)} av ${Math.round(est)} L brukt i dag${est > brukt ? ` · ${Math.round(est - brukt)} L igjen` : ""}</div>
      </div>
      <div class="maal">
        <div class="und">Fordeling ${per[valgt].toLowerCase()}</div>
        <div class="fordeling">${soner.map((x) => {
          const v = Number(x[valgt === "i_dag" ? "i_dag" : valgt] ?? x.i_dag ?? 0);
          return `<div class="frad"><div>
            <div class="navn"><span>${kiVaEsc(x.navn)}</span>${x.kalibrert
              ? `<span class="knagg">${x.rate} L/min</span>` : `<span class="knagg">anslag</span>`}</div>
            <div class="fbar"><i style="width:${((v / maks) * 100).toFixed(1)}%"></i></div>
          </div><div class="tall">${this._litertekst(v)}</div></div>`;
        }).join("")}</div>
      </div>`;
  }

  _panelNaa() {
    const s = this._styring(), z = this._soner(), p = this._programmer();
    const gaar = z.filter((x) => this._on(x.gaar));
    const koer = p.filter((x) => this._on(x.gaar));
    const felt = (navn, id, etter) => {
      const st = this._st(id); if (!st || ["unknown", "unavailable"].includes(st.state)) return "";
      return `<div class="nk" data-e="${id}"><div class="n">${navn}</div><div class="v">${kiVaEsc(st.state)}${etter || ""}</div></div>`;
    };
    const regn = this._on(s.regn);
    return `
      ${koer.length ? `<div class="prog gaar" data-e="${koer[0].bryter}">
        <div class="ic"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
        <div class="n">${kiVaEsc(koer[0].navn)}</div><div class="l">Programmet kjører nå</div>
        <div class="t">${gaar.length ? kiVaEsc(gaar[0].navn) : ""}</div></div>` : ""}
      ${regn ? `<div class="prog" data-e="${s.regn}" style="background:var(--blue,#6ec6ff);color:var(--black)">
        <div class="ic"><ha-icon icon="mdi:weather-pouring"></ha-icon></div>
        <div class="n">Regnpause aktiv</div>
        <div class="l">${this._st(s.regn_til) ? "Til " + kiVaEsc(this._st(s.regn_til).state) : ""}</div></div>` : ""}
      ${(() => { const ki = this._ki(); if (!ki) return "";
        const n = ki.neste || {};
        return `<div class="maal">
          <div class="rad"><div><div class="stor">${this._litertekst(ki.i_dag)}</div>
            <div class="und">brukt i dag · ${Number(ki.kostnad_i_dag || 0).toFixed(2)} kr</div></div>
            <div style="text-align:right"><div class="stor" style="font-size:1.1em">${this._litertekst(ki.estimat_i_dag)}</div>
            <div class="und">planlagt i dag</div></div></div>
          <div class="stolpe ${this._aktivSone() ? "lever" : ""}"><i style="width:${
            ki.estimat_i_dag ? Math.min(100, (ki.i_dag / ki.estimat_i_dag) * 100).toFixed(1) : 0}%"></i></div>
          ${n.navn ? `<div class="und">Neste: ${kiVaEsc(n.navn)} ${kiVaEsc(n.naar || "")} ${kiVaEsc(n.tid || "")}${
            n.total_min ? ` · ${n.total_min} min · ca. ${Math.round(n.estimat_liter || 0)} L` : ""}</div>` : ""}
        </div>`; })()}
      <div class="nokkel">
        ${felt("Vannivå", s.vannivaa, " %")}
        ${felt("Flyt", s.flyt, "")}
        ${felt("Strømtrekk", s.strom, "")}
        ${felt("Neste kjøring", s.neste, "")}
        ${felt("Siste kjøring", s.siste, "")}
        ${this._c.vinter ? `<div class="nk" data-e="${this._c.vinter}"><div class="n">Vintermodus</div>
          <div class="v">${this._on(this._c.vinter) ? "På – alt stengt" : "Av"}</div></div>` : ""}
      </div>`;
  }

  _panelSoner() {
    const z = this._soner(), c = this._c;
    if (!z.length) return `<div class="tom">Fant ingen soner. Sjekk at OpenSprinkler-integrasjonen er satt opp.</div>`;
    const vinter = this._c.vinter && this._on(this._c.vinter);
    const bokser = {};
    z.forEach((x) => { const b = x.boks || "–"; (bokser[b] = bokser[b] || []).push(x); });
    const varigheter = c.varigheter;
    return Object.keys(bokser).sort().map((b) => `<div class="boks">
      <div class="bokstittel"><ha-icon icon="mdi:water-boiler"></ha-icon>${
        b === "–" ? "Soner" : /^\d+$/.test(b) ? "Boks " + b : b}
        <span>${bokser[b].length} ${bokser[b].length === 1 ? "sone" : "soner"}</span></div>
      ${bokser[b].map((x) => {
        const gaar = this._on(x.gaar), av = !this._on(x.bryter);
        const st = this._st(x.status);
        const status = vinter ? "Vinterstengt" : gaar ? (st ? st.state : "Vanner") : av ? "Deaktivert" : (st ? st.state : "Av");
        return `<div class="sone ${gaar ? "gaar" : ""} ${av ? "av" : ""}">
          <div class="sonerad" data-e="${x.status}" role="button" tabindex="0">
            <div class="ic" style="background:rgba(0,0,0,.15)"><ha-icon icon="${kiVaIkon(x.metode || x.navn)}"></ha-icon></div>
            <div class="n">${kiVaEsc(x.navn)}</div>
            <div class="l">${kiVaEsc(x.metode || "Sone " + x.nr)} · ${kiVaEsc(status)}</div>
            <div class="t">${gaar ? "vanner" : ""}</div>
          </div>
          <div class="varigheter" style="--ant:${varigheter.length + 1}">
            ${varigheter.map((m) => `<button class="vk" data-z="${x.nr}" data-min="${m}">${m}m</button>`).join("")}
            <button class="vk stopp" data-z="${x.nr}" data-min="0">Stopp</button>
          </div>
        </div>`;
      }).join("")}
    </div>`).join("");
  }

  /* Skjema for å lage eller endre et program. Bare i ventilmodus, der KI Vanning
     selv styrer klokka. */
  _skjema() {
    const d = this._nyttProgram;
    const dager = [["man", "M"], ["tir", "T"], ["ons", "O"], ["tor", "T"], ["fre", "F"], ["lor", "L"], ["son", "S"]];
    const soner = this._soner();
    const valgt = (e) => (d.soner || []).find((z) => z.entity === e);
    return `<div class="skjema">
      <div class="rad">
        <div><label>Navn</label><input type="text" data-f="navn" value="${kiVaEsc(d.navn || "")}" placeholder="Morgen"></div>
        <div><label>Starter</label><input type="time" data-f="tid" value="${kiVaEsc(d.tid || "06:00")}"></div>
      </div>

      <div>
        <div class="bryterrad"><span>Hyppighet</span>
          <span class="velg">
            <button data-m="dager" class="${d.intervall ? "" : "valgt"}">Ukedager</button>
            <button data-m="intervall" class="${d.intervall ? "valgt" : ""}">Intervall</button>
          </span></div>
        ${d.intervall ? `<div class="rad" style="margin-top:8px">
            <div><label>Hver … dag</label><input type="number" min="1" max="30" data-f="intervall" value="${d.intervall}"></div>
            <div><label>Første gang</label><input type="date" data-f="start_dato" value="${kiVaEsc(d.start_dato || "")}"></div>
          </div>`
          : `<div class="dager" style="margin-top:8px">${dager.map(([k, t]) =>
              `<button class="dag ${(d.dager || []).includes(k) ? "valgt" : ""}" data-dag="${k}">${t}</button>`).join("")}</div>`}
      </div>

      <div>
        <div class="bryterrad"><span>Sonene kjører</span>
          <span class="velg">
            <button data-s="etter" class="${d.samtidig ? "" : "valgt"}">Etter hverandre</button>
            <button data-s="samtidig" class="${d.samtidig ? "valgt" : ""}">Samtidig</button>
          </span></div>
      </div>

      <div class="sonevalg">
        <label>Soner og minutter</label>
        ${soner.map((z) => { const v = valgt(z.bryter); return `<div class="sonerad2">
          <input type="checkbox" data-sone="${kiVaEsc(z.bryter)}" ${v ? "checked" : ""}>
          <span>${kiVaEsc(z.navn)}</span>
          <input type="number" min="1" max="180" data-min="${kiVaEsc(z.bryter)}" value="${v ? v.min : 10}">
        </div>`; }).join("")}
      </div>

      <div class="bryterrad"><span>Bare i feriemodus</span>
        <span class="velg">
          <button data-fe="nei" class="${d.ferie ? "" : "valgt"}">Nei</button>
          <button data-fe="ja" class="${d.ferie ? "valgt" : ""}">Ja</button>
        </span></div>

      <div class="skjemaknapper">
        <button class="sk" data-skjema="avbryt">Avbryt</button>
        <button class="sk lagre" data-skjema="lagre">Lagre</button>
      </div>
      ${d._finnes ? `<button class="sk slett" data-skjema="slett">Slett programmet</button>` : ""}
    </div>`;
  }

  _koblSkjema(r) {
    const d = this._nyttProgram; if (!d) return;
    const tegn = () => this._tegn();
    r.querySelectorAll(".skjema [data-f]").forEach((el) => el.addEventListener("change", () => {
      const f = el.dataset.f;
      d[f] = f === "intervall" ? Number(el.value) : el.value;
    }));
    r.querySelectorAll("[data-dag]").forEach((el) => el.addEventListener("click", () => {
      d.dager = d.dager || [];
      const k = el.dataset.dag;
      d.dager = d.dager.includes(k) ? d.dager.filter((x) => x !== k) : [...d.dager, k];
      tegn();
    }));
    r.querySelectorAll("[data-m]").forEach((el) => el.addEventListener("click", () => {
      d.intervall = el.dataset.m === "intervall" ? (d.intervall || 2) : 0;
      if (!d.intervall && !(d.dager || []).length) d.dager = ["man", "tor"];
      tegn();
    }));
    r.querySelectorAll("[data-s]").forEach((el) => el.addEventListener("click", () => {
      d.samtidig = el.dataset.s === "samtidig"; tegn();
    }));
    r.querySelectorAll("[data-fe]").forEach((el) => el.addEventListener("click", () => {
      d.ferie = el.dataset.fe === "ja"; tegn();
    }));
    const lesSoner = () => {
      const ut = [];
      r.querySelectorAll("[data-sone]").forEach((boks) => {
        if (!boks.checked) return;
        const e = boks.dataset.sone;
        const min = r.querySelector(`[data-min="${e}"]`);
        ut.push({ entity: e, min: Number(min && min.value) || 10 });
      });
      return ut;
    };
    r.querySelectorAll("[data-sone], [data-min]").forEach((el) =>
      el.addEventListener("change", () => { d.soner = lesSoner(); }));
    r.querySelectorAll("[data-skjema]").forEach((el) => el.addEventListener("click", () => {
      const hva = el.dataset.skjema;
      if (hva === "avbryt") { this._nyttProgram = null; return tegn(); }
      if (hva === "slett") {
        this._ki_tjeneste("slett_program", { navn: d._opprinnelig || d.navn });
        this._nyttProgram = null; return tegn();
      }
      d.soner = d.soner && d.soner.length ? d.soner : lesSoner();
      const navnFelt = r.querySelector('[data-f="navn"]');
      const tidFelt = r.querySelector('[data-f="tid"]');
      this._ki_tjeneste("lag_program", {
        navn: (navnFelt && navnFelt.value) || d.navn || "Nytt program",
        tid: (tidFelt && tidFelt.value) || d.tid || "06:00",
        dager: d.intervall ? [] : (d.dager || []),
        intervall: d.intervall || 0,
        start_dato: d.start_dato || "",
        soner: d.soner || [],
        samtidig: !!d.samtidig,
        ferie: !!d.ferie,
        aktiv: d.aktiv !== false,
      });
      this._nyttProgram = null; tegn();
    }));
  }

  _panelProgrammer() {
    const ventil = this._ventilmodus();
    if (ventil && this._nyttProgram) return this._skjema();
    const ki = this._ki();
    const plan = (ki && ki.programmer) || [];         /* kommende kjøringer */
    const hist = (ki && ki.program_historikk) || [];  /* programmene slik de er satt opp */
    const p = this._programmer();
    const aktiv = this._aktivSone();
    const dagKort = ["M", "T", "O", "T", "F", "L", "S"];
    const dagNokkel = ["man", "tir", "ons", "tor", "fre", "lor", "son"];

    const finnPlan = (navn) => plan.find((x) => String(x.navn).toLowerCase() === String(navn).toLowerCase()) || null;
    const finnOppsett = (navn) => hist.find((x) => String(x.navn).toLowerCase() === String(navn).toLowerCase()) || null;

    const kort = p.map((x) => {
      const o = x.plan || finnOppsett(x.navn) || {};
      const pl = finnPlan(x.navn);
      const ventilProg = !x.bryter;
      const gaar = ventilProg ? !!(ki && ki.planlegger && ki.planlegger.program === x.navn) : this._on(x.gaar);
      const pa = ventilProg ? o.aktiv !== false : this._on(x.bryter);
      const tid = o.tid || (this._st(x.start) ? String(this._st(x.start).state).slice(0, 5) : "––:––");
      const soner = (o.soner && o.soner.length ? o.soner : (pl && pl.soner) || []).map((z) => ({
        navn: z.navn || (this._soner().find((y) => y.bryter === z.entity) || {}).navn || z.entity,
        min: z.min,
      }));
      const naar = o.intervall ? `Hver ${o.intervall}. dag` : pl ? `${pl.i_dag ? "I dag" : "Neste"} kl. ${pl.tid}` : "";
      const total = o.total_min || (pl && pl.total_min) || soner.reduce((a, b) => a + (b.min || 0), 0);
      const liter = pl ? pl.estimat_liter : null;
      return `<div class="pkort ${gaar ? "gaar" : ""} ${pa ? "" : "av"}">
        <div class="topp">
          <div class="navn"><span>${kiVaEsc(x.navn)}</span>
            ${o.ferie ? `<span class="merkelapp">Ferie</span>` : ""}
            ${o.samtidig ? `<span class="merkelapp">Samtidig</span>` : ""}
            ${gaar ? `<span class="merkelapp">Kjører</span>` : ""}</div>
          <div style="text-align:right"><div class="klokke">${kiVaEsc(tid)}</div>
            <div class="naar">${kiVaEsc(naar)}</div></div>
          <div class="pbryter ${pa ? "pa" : ""}" data-pa="${kiVaEsc(x.navn)}" data-bryter="${x.bryter || ""}"
            role="switch" tabindex="0" aria-checked="${pa}"><i></i></div>
        </div>
        ${o.intervall ? "" : `<div class="dagsrad">${dagKort.map((d, i) =>
          `<i class="${(o.dager || dagNokkel).includes(dagNokkel[i]) ? "pa" : ""}">${d}</i>`).join("")}</div>`}
        ${soner.length ? `<div class="sonebrikker">${soner.map((z) =>
          `<span class="sonebrikke ${gaar && aktiv && aktiv.navn === z.navn ? "aktiv" : ""}">${kiVaEsc(z.navn)} ${z.min}m</span>`).join("")}</div>` : ""}
        <div class="pknapper">
          <button class="pk" data-kjorprog="${kiVaEsc(x.navn)}"><ha-icon icon="mdi:play"></ha-icon>Kjør nå</button>
          <div class="naar" style="text-align:center">${total ? total + " min" : ""}${liter ? " · ca. " + Math.round(liter) + " L" : ""}</div>
          ${ventil ? `<button class="pk" data-rediger="${kiVaEsc(x.navn)}"><ha-icon icon="mdi:pencil"></ha-icon></button>` : ""}
        </div>
      </div>`;
    }).join("");

    return (kort || `<div class="tom">Ingen programmer ennå.</div>`)
      + (ventil ? `<button class="nyprog" data-nytt="1">+  Nytt program</button>` : "")
      + this._kalender(plan)
      + this._historikk(hist);
  }

  /* Kalender: kommende kjøringer gruppert per dag */
  _kalender(plan) {
    const kommende = (plan || []).filter((x) => (x.minutter_til ?? 0) >= 0).slice(0, 20);
    if (!kommende.length) return "";
    const dager = {};
    kommende.forEach((x) => {
      const d = x.start ? new Date(x.start) : new Date();
      const n = d.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "short" });
      (dager[n] = dager[n] || []).push({ ...x, dato: d });
    });
    const idag = new Date().toDateString();
    return `<div class="maal"><div class="und">Kommende vanninger</div>
      ${Object.keys(dager).map((n) => {
        const rader = dager[n];
        const erIdag = rader[0].dato.toDateString() === idag;
        return `<div class="kaldag"><div class="dag ${erIdag ? "idag" : ""}">${erIdag ? "I dag" : kiVaEsc(n.split(" ")[0])}<br>
          <span style="font-size:11px;opacity:.7">${kiVaEsc(rader[0].dato.toLocaleDateString("nb-NO", { day: "numeric", month: "short" }))}</span></div>
          <div>${rader.map((x) => `<div class="kalrad">
            <span class="kl">${kiVaEsc(x.tid)}</span>
            <span class="hva">${kiVaEsc(x.navn)}${x.soner && x.soner.length ? ` · ${x.soner.length} ${x.soner.length === 1 ? "sone" : "soner"}` : ""}</span>
            <span class="est">${x.total_min ? x.total_min + " min" : ""}${x.estimat_liter ? " · " + Math.round(x.estimat_liter) + " L" : ""}</span>
          </div>`).join("")}</div></div>`;
      }).join("")}</div>`;
  }

  /* Historikk: hva programmene faktisk brukte sist */
  _historikk(hist) {
    const rader = (hist || []).filter((x) => x.siste_liter || x.kjoringer);
    if (!rader.length) return "";
    const maks = Math.max(...rader.map((x) => x.siste_liter || 0), 1);
    return `<div class="maal"><div class="und">Siste kjøringer</div>
      <div class="hist">${rader.map((x) => `<div class="histrad">
        <span>${kiVaEsc(x.navn)}${x.siste_minutter ? ` · ${Math.round(x.siste_minutter)} min` : ""}</span>
        <span style="font-weight:600">${this._litertekst(x.siste_liter || 0)}</span>
        <span class="spor"><i style="width:${(((x.siste_liter || 0) / maks) * 100).toFixed(0)}%"></i></span>
        ${x.kjoringer ? `<span class="und" style="grid-column:1/-1;font-size:11px">${x.kjoringer} kjøringer · snitt ${this._litertekst(x.snitt_liter || 0)}</span>` : ""}
      </div>`).join("")}</div></div>`;
  }

  _tikk() {
    if (!this._bygget || !this._slutt) return;
    const igjen = Math.max(0, Math.round((this._slutt - Date.now()) / 1000));
    const tekst = igjen ? `${Math.floor(igjen / 60)}:${String(igjen % 60).padStart(2, "0")}` : "";
    const t = this.shadowRoot.querySelector(".hero .t") || this.shadowRoot.querySelector(".scene .ned");
    if (t) t.textContent = tekst;
    const b = this.shadowRoot.querySelector(".hero .strek i");
    if (b && this._total) b.style.width = (100 - (igjen / this._total) * 100).toFixed(1) + "%";
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._prefiks()) {
      this._bygget = false;
      this.shadowRoot.innerHTML = `<style>${KI_VANN_STIL}</style><div class="tom">Fant ingen OpenSprinkler-entiteter.
        Sett <code>prefiks:</code> manuelt hvis kontrolleren din heter noe annet.</div>`;
      return;
    }
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, s = this._styring();
    const vinterId = c.demo ? "input_boolean.demo_vinter" : c.vinter;
    const z = this._aktivSone(), vinter = vinterId && this._on(vinterId);
    const scene = r.querySelector(".scene");
    if (scene) return this._tegnScene(scene, z, vinter, s), this._tegnResten(r, c, s);
    const hero = r.querySelector(".hero");
    hero.classList.toggle("vanner", !!z);
    hero.classList.toggle("vinter", !z && vinter);
    const st = z ? this._st(z.status) : null;
    hero.querySelector(".ic ha-icon").setAttribute("icon",
      z ? kiVaIkon(z.metode || z.navn) : vinter ? "mdi:snowflake" : this._on(s.aktiv) ? "mdi:sprinkler-variant" : "mdi:power-off");
    hero.querySelector(".n").textContent = z ? "Nå vannes: " + z.navn
      : vinter ? "Vintermodus er på" : this._on(s.aktiv) ? "Anlegget er klart" : "Anlegget er av";
    hero.querySelector(".l").textContent = z ? ((st ? st.state + " · " : "") + "trykk for å stoppe")
      : vinter ? "All vanning er stengt · trykk for å endre" : this._on(s.regn) ? "Regnpause aktiv" : "Ingen soner kjører";

    /* nedtelling når statusen forteller hvor lenge det er igjen */
    const rest = z && st ? String(st.state).match(/(\d+):(\d\d)(?::(\d\d))?/) : null;
    if (rest) {
      const sek = rest[3] ? (+rest[1]) * 3600 + (+rest[2]) * 60 + (+rest[3]) : (+rest[1]) * 60 + (+rest[2]);
      if (!this._total || Math.abs((this._slutt - Date.now()) / 1000 - sek) > 3) { this._total = sek; this._slutt = Date.now() + sek * 1000; }
    } else { this._slutt = null; this._total = 0; hero.querySelector(".t").textContent = ""; hero.querySelector(".strek i").style.width = "0"; }
    this._tikk();

    this._tegnResten(r, c, s);
  }

  /* Den store hagescenen */
  _tegnScene(scene, z, vinter, s) {
    const ki = this._ki(), st = z ? this._st(z.status) : null;
    const pl = ki && ki.planlegger;
    const regn = this._on(s.regn) || !!(ki && ki.ferie);
    scene.classList.toggle("vanner", !!z);
    scene.classList.toggle("vinter", !z && !!vinter);
    scene.classList.toggle("regn", !z && !vinter && regn);
    scene.querySelector(".tittel").textContent = z ? "Vanner " + z.navn
      : vinter ? "Vintermodus" : (ki && ki.ferie) ? "Feriemodus" : regn ? "Regnpause"
      : this._on(s.aktiv) || this._ventilmodus() ? "Hagen er tørr og klar" : "Anlegget er av";
    const n = (ki && ki.neste) || {};
    scene.querySelector(".under").textContent = z
      ? `${z.metode || "Sone " + z.nr}${st ? " · " + st.state : ""} · trykk for å stoppe`
      : vinter ? "All vanning er stengt for sesongen"
      : regn ? (this._st(s.regn_til) ? "Fortsetter " + this._st(s.regn_til).state : "Venter på oppholdsvær")
      : n.navn ? `Neste: ${n.navn} ${n.naar || ""} ${n.tid || ""}` : "Ingen soner kjører";

    /* egne ventiler: planleggeren vet nøyaktig hvor lenge det er igjen */
    const fraPlan = !!(pl && pl.kjorer && pl.sekunder_igjen > 0);
    if (fraPlan) {
      if (!this._total || Math.abs((this._slutt - Date.now()) / 1000 - pl.sekunder_igjen) > 3) {
        this._total = Math.max(this._total || 0, pl.sekunder_igjen);
        this._slutt = Date.now() + pl.sekunder_igjen * 1000;
      }
      const koe = (pl.i_koe || []).length;
      scene.querySelector(".under").textContent =
        `${pl.program ? pl.program + " · " : ""}${koe ? koe + " i kø · " : ""}trykk for å stoppe`;
      this._tikk();
    }
    /* nedtelling fra statussensoren */
    const rest = !fraPlan && z && st ? String(st.state).match(/(\d+):(\d\d)(?::(\d\d))?/) : null;
    if (rest) {
      const sek = rest[3] ? (+rest[1]) * 3600 + (+rest[2]) * 60 + (+rest[3]) : (+rest[1]) * 60 + (+rest[2]);
      if (!this._total || Math.abs((this._slutt - Date.now()) / 1000 - sek) > 3) { this._total = sek; this._slutt = Date.now() + sek * 1000; }
    } else if (!fraPlan) { this._slutt = null; this._total = 0; }
    const ned = scene.querySelector(".ned");
    if (!this._slutt) ned.textContent = "";
    this._tikk();

    const brukt = ki ? Number(ki.i_dag || 0) : 0, plan = ki ? Number(ki.estimat_i_dag || 0) : 0;
    const sp = scene.querySelector(".bunn .sp i");
    sp.style.width = plan ? Math.min(100, (brukt / plan) * 100).toFixed(1) + "%" : (z ? "100%" : "0");
    scene.querySelector(".bunn .tall").textContent = ki
      ? `${this._litertekst(brukt)} av ${this._litertekst(plan)} i dag`
      : z ? "vanner nå" : "";
  }

  _tegnResten(r, c, s) {
    const vk = r.querySelector('[data-h="vinter"]');
    if (vk) { const pa = c.vinter ? this._on(c.vinter) : !this._on(s.aktiv); vk.classList.toggle("pa", pa);
      vk.querySelector("span").textContent = c.vinter ? "Vintermodus" : (this._on(s.aktiv) ? "Slå av anlegg" : "Slå på anlegg"); }

    const sett = (navn, html) => { const el = r.querySelector(`.panel[data-p="${navn}"]`); if (el) el.innerHTML = html; };
    if (c.faner.includes("naa")) sett("naa", this._panelNaa());
    if (c.faner.includes("soner")) sett("soner", this._panelSoner());
    if (c.faner.includes("programmer")) sett("programmer", this._panelProgrammer());
    if (c.faner.includes("forbruk")) sett("forbruk", this._panelForbruk());
    if (c.faner.includes("innstillinger")) sett("innstillinger", this._panelInnstillinger());
    r.querySelectorAll(".fane").forEach((b) => b.classList.toggle("valgt", b.dataset.f === this._fane));
    r.querySelectorAll(".panel").forEach((p) => p.classList.toggle("valgt", p.dataset.p === this._fane));

    /* klikk i panelene kobles på nytt etter hver tegning */
    r.querySelectorAll("[data-inn]").forEach((el) => el.addEventListener("click", () => {
      const id = el.dataset.inn, type = el.dataset.type;
      if (type === "bryter") this._veksle(id);
      else if (type === "knapp") { if (navigator.vibrate) navigator.vibrate(10); this._h.callService("button", "press", { entity_id: id }); }
      else this._mer(id);
    }));
    r.querySelectorAll("[data-per]").forEach((b) => b.addEventListener("click", () => {
      this._periode = b.dataset.per; this._tegn();
    }));
    r.querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => {
      const sone = this._soner().find((x) => x.nr === b.dataset.z); if (!sone) return;
      const m = +b.dataset.min;
      if (m) this._kjor(sone, m); else this._stopp(sone.bryter);
    }));
    r.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", (e) => {
      if (e.target.closest("[data-min]")) return; this._mer(el.dataset.e);
    }));
    r.querySelectorAll("[data-nytt]").forEach((el) => el.addEventListener("click", () => {
      const forste = this._soner()[0];
      this._nyttProgram = { navn: "", tid: "06:00", dager: ["man", "tor"], intervall: 0, samtidig: false,
        ferie: false, soner: forste ? [{ entity: forste.bryter, min: 10 }] : [] };
      this._tegn();
    }));
    r.querySelectorAll("[data-rediger]").forEach((el) => el.addEventListener("click", (e) => {
      e.stopPropagation();
      const navn = el.dataset.rediger;
      const ki = this._ki();
      const pl = ((ki && ki.program_historikk) || []).find((x) => x.navn === navn) || { navn };
      this._nyttProgram = { ...pl, _finnes: true, _opprinnelig: navn,
        soner: (pl.soner || []).map((z) => ({ entity: z.entity, min: z.min })) };
      this._tegn();
    }));
    r.querySelectorAll("[data-pa]").forEach((el) => {
      const slaa = () => {
        const bryter = el.dataset.bryter;
        if (bryter) return this._veksle(bryter);          /* OpenSprinkler: egen bryter */
        const navn = el.dataset.pa;
        const ki = this._ki();
        const o = ((ki && ki.program_historikk) || []).find((x) => x.navn === navn) || {};
        this._ki_tjeneste("lag_program", { ...o, navn, aktiv: o.aktiv === false });
      };
      el.addEventListener("click", (e) => { e.stopPropagation(); slaa(); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); slaa(); } });
    });
    r.querySelectorAll("[data-kjorprog]").forEach((el) =>
      el.addEventListener("click", () => this._ki_tjeneste("kjor_program", { program: el.dataset.kjorprog })));
    this._koblSkjema(r);
    r.querySelectorAll("[data-prog]").forEach((el) => {
      let t = null, holdt = false;
      const start = () => { holdt = false; t = setTimeout(() => { holdt = true; this._tjeneste("run_program", {}, el.dataset.kjor); }, 500); };
      const slutt = () => { clearTimeout(t); if (!holdt) this._veksle(el.dataset.prog); };
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", slutt);
      el.addEventListener("pointerleave", () => clearTimeout(t));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._veksle(el.dataset.prog); } });
    });
  }
}
if (!customElements.get("ki-vanning-card")) customElements.define("ki-vanning-card", KiVanningCard);

class KiVanningCardEditor extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { prefiks: "Prefiks (tomt = auto)", vinter: "Vintermodus-bryter", skjul_ubrukte: "Skjul ubrukte soner",
        navn_kort: "Korte sonenavn", hero: "Toppkort", demo: "Demomodus (eksempeldata)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "prefiks", selector: { text: {} } },
      { name: "vinter", selector: { entity: { domain: ["input_boolean", "switch"] } } },
      { name: "skjul_ubrukte", selector: { boolean: {} } },
      { name: "hero", selector: { select: { mode: "dropdown", options: [
        { value: "stor", label: "Stor hagescene" }, { value: "smal", label: "Smal linje" }] } } },
      { name: "demo", selector: { boolean: {} } },
    ];
  }
}
if (!customElements.get("ki-vanning-card-editor")) customElements.define("ki-vanning-card-editor", KiVanningCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-vanning-card")) window.customCards.push({ type: "ki-vanning-card", name: "KI Vanning", description: "OpenSprinkler: soner, programmer og hurtigvanning – setter seg opp selv", preview: true });

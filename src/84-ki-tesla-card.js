/* ki-tesla-card – animert Tesla Model Y i samme stil som ki-varmepumpe-card og ki-homelab-card.
 *
 *  Scenen viser bilen fra siden:
 *   – batteriet i dørterskelen fylles til batterinivået, med en markør for ladegrensen
 *   – ved lading strømmer energi fra laderen gjennom kabelen, og batteriet glitrer
 *   – frunk og bagasjerom åpnes i tegningen når de står åpne
 *   – defrost gir varmebølger på frontruta, sentry blinker rødt
 *   – vinduer på gløtt: en svart glipe øverst i vinduene og luft som strømmer ut
 *   – når bilen kjører, ruller hjulene og veien glir forbi i takt med farten
 *   – ladeporten i baklyset åpnes og lyser når porten er åpen, grønt når kabelen står i
 *   – låseikonet over taket er oransje og vipper når bilen er ulåst
 *
 *  Alle entiteter har standardverdier. Frunk, sentry, klima, innetemperatur, gir og fart
 *  letes opp automatisk blant entiteter som starter med prefiksene (folkevogn, tesla_model_y).
 *
 *  type: custom:ki-tesla-card
 *  navn: Tesla Model Y
 *  lakk: "#7b92ac"          # bilens farge (standard: blågrå som på bildet)
 *  kapasitet: 75            # kWh, brukes til å anslå når ladingen er ferdig
 *  tap_action: { action: navigate, navigation_path: "#tesla" }
 */
(() => {
  const STANDARD = {
    navn: "Tesla Model Y",
    lakk: "#7b92ac",
    kapasitet: 75,
    prefiks: ["folkevogn", "tesla_model_y"],
    batteri: "sensor.tesla_model_y_batteri_batteriniva",
    rekkevidde: "sensor.tesla_model_y_batteri_estimert_batterirekkevidde",
    effekt: "sensor.tesla_model_y_batteri_charge_power",
    ladestatus: "select.tesla_model_y_batteri_charging_state",
    ladeport: "switch.tesla_model_y_batteri_charging_port",
    lader: "switch.elbillader_charging",
    ladegrense: "input_number.tesla_model_y_ladegrense",
    laas: "switch.tesla_model_y_car_doors_locked",
    /* Bryteren heter «doors_locked», men `on` betyr ÅPEN. Navnet sier altså det
       motsatte av verdien, og derfor er tolkningen et eget valg i stedet for noe koden
       gjetter seg til. Bruker du en ekte `lock.`-entitet, sett `laas_omvendt: false`. */
    laas_omvendt: true,
    bagasje: "switch.tesla_model_y_car_trunk_rear",
    frunk: "switch.tesla_model_y_car_trunk_front", sentry: null, klima: null, innetemp: null, gir: null, fart: "sensor.tesla_model_y_car_drive_speed",
    // defrost kan være én entitet eller en liste – animasjonen vises hvis én av dem er på
    defrost: ["switch.tesla_model_y_klima_climate_defrost", "switch.folkevogn_defrost"],
    vindu: "switch.tesla_model_y_klima_climate_window_vent",
  };
  const AUTO = {
    frunk: [/^(switch|cover)\..*(frunk|trunk_front|front_trunk|vehicle_state_ft)/],
    sentry: [/^switch\..*sentry/],
    klima: [/^climate\./],
    innetemp: [/^sensor\..*(inside_temp|innetemp|inne_temp|interior)/],
    gir: [/^sensor\..*(shift_state|gir|gear)/],
    fart: [/^sensor\..*(speed|fart|hastighet)$/],
    kabel: [/^binary_sensor\..*(charge_cable|ladekabel|plugged|tilkoblet)/],
  };
  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const tall = (s) => { if (!ok(s)) return NaN; const v = parseFloat(String(s.state).replace(",", ".")); return isNaN(v) ? NaN : v; };
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const komma = (v, d = 0) => (isNaN(v) ? "--" : v.toFixed(d).replace(".", ","));

  const STIL = `
    :host { display:block; }
    .tc { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eef3f8;
      background:linear-gradient(165deg,#15191f 0%,#1a1f27 55%,#1f2530 100%); -webkit-tap-highlight-color:transparent; outline:none;
      transition:transform .15s cubic-bezier(.3,1.4,.5,1); }
    .tc:active { transform:scale(.985); }
    .tc:focus-visible { box-shadow:0 0 0 2px var(--active-big,#f5c542); }
    .glod { position:absolute; inset:0; z-index:-1; opacity:0; transition:opacity 1.4s; }
    .tc.lader .glod { opacity:1; background:radial-gradient(70% 90% at 80% 100%, rgba(90,230,160,.30) 0%, transparent 62%); }
    .tc.kjorer .glod { opacity:1; background:radial-gradient(70% 90% at 70% 100%, rgba(90,170,255,.28) 0%, transparent 62%); }
    .tc.lavt .glod { opacity:1; background:radial-gradient(70% 90% at 70% 100%, rgba(255,90,70,.28) 0%, transparent 62%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:42%; min-width:0; }
    .n { font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(238,243,248,.12); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; }
    .tc.lader .pille { background:rgba(90,230,160,.26); } .tc.kjorer .pille { background:rgba(90,170,255,.28); }
    .pille.gul { background:rgba(255,179,74,.32) !important; } .pille.rod { background:rgba(255,80,70,.42) !important; }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-left:2px; opacity:.85; }
    .sub { font-size:13px; opacity:.62; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .scene { position:absolute; right:0; bottom:0; width:64%; max-width:320px; height:100%; }
    .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }
    .scene text { font-family:inherit; }

    .vei { stroke:rgba(255,255,255,.12); stroke-width:1.5; }
    .veistriper { stroke:rgba(255,255,255,.28); stroke-width:1.5; stroke-dasharray:10 14; opacity:0; }
    .tc.kjorer .veistriper { opacity:1; animation:vei var(--vei,.6s) linear infinite; }
    @keyframes vei { to { stroke-dashoffset:24; } }
    .skygge { fill:rgba(0,0,0,.35); }
    .karosseri { fill:var(--lakk); }
    .glass { fill:#1c2530; }
    .glans { fill:none; stroke:rgba(255,255,255,.35); stroke-width:1; }
    .linje { fill:none; stroke:rgba(0,0,0,.18); stroke-width:1; }
    .dekk { fill:#0d0f11; } .felg { fill:#2b3037; } .nav { fill:#1a1d21; }
    .eiker { transform-box:fill-box; transform-origin:center; }
    .tc.kjorer .eiker { animation:rull var(--hjul,.45s) linear infinite; }
    .tc.kjorer .skygge { animation:dump .9s ease-in-out infinite; }
    @keyframes dump { 0%,100% { transform:scaleX(1); } 50% { transform:scaleX(.985); } }
    .skygge { transform-box:fill-box; transform-origin:center; }
    .boks, .boks-led { transition:opacity .6s; } .tc.kjorer .boks, .tc.kjorer .boks-led { opacity:0; }
    .fartlinjer { stroke:rgba(255,255,255,.35); stroke-width:1; stroke-linecap:round; opacity:0; }
    .tc.kjorer .fartlinjer { animation:fartlinje var(--vei,.6s) linear infinite; }
    .tc.kjorer .fl2 { animation-delay:calc(var(--vei,.6s) / -3); } .tc.kjorer .fl3 { animation-delay:calc(var(--vei,.6s) / -1.5); }
    @keyframes fartlinje { 0% { opacity:0; transform:translateX(0); } 20% { opacity:.8; } 100% { opacity:0; transform:translateX(26px); } }
    @keyframes rull { to { transform:rotate(-360deg); } }
    .lys { fill:#f4f9ff; opacity:.7; } .tc.kjorer .lys, .tc.ulast .lys { opacity:1; filter:drop-shadow(0 0 3px #dfefff); }
    .baklys { stroke:#ff3b30; opacity:.6; } .tc.kjorer .baklys, .tc.ulast .baklys { opacity:1; filter:drop-shadow(0 0 2px #ff3b30); }
    .lokk { transform-box:view-box; transition:transform .9s cubic-bezier(.3,1.2,.4,1); }
    .frunk { transform-origin:56.3px 117px; } .tc.frunk-apen .frunk { transform:rotate(22deg); }
    .bak { transform-origin:143px 102px; } .tc.bak-apen .bak { transform:rotate(-34deg); }

    .terskel { fill:#0a0d10; }
    .celle { transition:width 1.4s cubic-bezier(.3,.8,.3,1), fill .6s; }
    .glitter { fill:url(#glitter); opacity:0; } .tc.lader .glitter { opacity:1; animation:glitter 1.6s linear infinite; }
    @keyframes glitter { from { transform:translateX(-30px); } to { transform:translateX(60px); } }
    .grense { stroke:#eef3f8; stroke-width:1.2; opacity:.8; transition:transform 1s; }

    .boks { fill:#232a33; stroke:#3a4452; stroke-width:1; }
    .boks-led { fill:#3a4452; } .tc.tilkoblet .boks-led { fill:#5be38a; } .tc.lader .boks-led { animation:blink 1s steps(2,end) infinite; }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }
    .kabel { fill:none; stroke:#2c333d; stroke-width:3; stroke-linecap:round; opacity:0; transition:opacity .6s; }
    .tc.tilkoblet .kabel { opacity:1; }
    .energi { fill:none; stroke:#5ae6a0; stroke-width:2.2; stroke-linecap:round; stroke-dasharray:2 7; opacity:0; }
    .tc.lader .energi { opacity:1; animation:flyt var(--flyt,1s) linear infinite; }
    @keyframes flyt { to { stroke-dashoffset:-18; } }
    .port { fill:#8fd0ff; opacity:0; transition:opacity .5s, fill .5s; }
    .tc.port-apen .port { opacity:1; filter:drop-shadow(0 0 2.5px #8fd0ff); }
    .tc.tilkoblet .port { fill:#5be38a; filter:drop-shadow(0 0 2.5px #5be38a); }
    .tc.lader .port { animation:blink 1.2s ease-in-out infinite; }
    .portluke { transform-box:fill-box; transform-origin:right center; transition:transform .7s cubic-bezier(.3,1.3,.4,1); }
    .tc.port-apen .portluke { transform:translateX(1.2px) scaleX(.22); }

    .dfr { fill:none; stroke:#ff9a5c; stroke-width:1.3; stroke-linecap:round; opacity:0; }
    .tc.defrost .dfr { animation:stig 2.2s ease-out infinite; } .tc.defrost .dfr.d2 { animation-delay:.7s; } .tc.defrost .dfr.d3 { animation-delay:1.4s; }
    @keyframes stig { 0% { opacity:0; transform:translateY(2px); } 30% { opacity:.9; } 100% { opacity:0; transform:translateY(-4px); } }
    .dfr { transform-box:fill-box; }
    .glipe { fill:none; stroke:#04060a; stroke-width:1.7; stroke-linecap:round; opacity:0; transition:opacity .6s; }
    .tc.vindu .glipe { opacity:1; }
    .luft { fill:none; stroke:#bfe4ff; stroke-width:1; stroke-linecap:round; opacity:0; transform-box:fill-box; }
    .tc.vindu .luft { animation:luft 2.6s ease-out infinite; } .tc.vindu .l2 { animation-delay:.9s; } .tc.vindu .l3 { animation-delay:1.7s; }
    @keyframes luft { 0% { opacity:0; transform:translate(0,2px); } 30% { opacity:.8; } 100% { opacity:0; transform:translate(5px,-7px); } }
    .sentrylys { fill:#ff3b30; opacity:0; } .tc.sentry .sentrylys { animation:sentry 1.6s ease-in-out infinite; }
    @keyframes sentry { 0%,100% { opacity:.25; } 50% { opacity:1; filter:drop-shadow(0 0 4px #ff3b30); } }
    .t-inne { font-size:8px; font-weight:600; fill:#eef3f8; opacity:.85; }

    .laas { transform-box:fill-box; transform-origin:center; }
    .laas-sirkel { fill:rgba(238,243,248,.12); transition:fill .5s; }
    .laas-bue { fill:none; stroke:#eef3f8; stroke-width:1.6; stroke-linecap:round; transition:transform .4s; transform-box:fill-box; transform-origin:right bottom; }
    .laas-kropp { fill:#eef3f8; }
    .tc.ulast .laas-sirkel { fill:#ffb34a; } .tc.ulast .laas-bue { stroke:#1a1f27; transform:translateY(-1.5px) rotate(-25deg); } .tc.ulast .laas-kropp { fill:#1a1f27; }
    .tc.ulast .laas { animation:vipp 3s ease-in-out infinite; }
    @keyframes vipp { 0%,85%,100% { transform:rotate(0); } 90% { transform:rotate(-10deg); } 95% { transform:rotate(10deg); } }
    @media (prefers-reduced-motion: reduce) { .tc * { animation:none !important; } }
    @media (max-width:380px) { .scene { width:60%; } .tekst { max-width:42%; } }
  `;

  // Model Y (2025, «Juniper») sett fra venstre side, fronten mot venstre. Bakken ligger på y≈157.
  const EIKE = (x) => [0, 72, 144, 216, 288].map((a) => `<path d="M${x} 144.5 q2.2 -3.4 0.6 -8.4 l1.7 0.2 q1.3 5.2 -2.3 8.2z" fill="#4a515b" transform="rotate(${a} ${x} 144.5)"/>`).join("");
  const HJUL = (x) => `<g><circle class="dekk" cx="${x}" cy="144.5" r="12.8"/><circle class="felg" cx="${x}" cy="144.5" r="9.3"/>
      <g class="eiker"><circle cx="${x}" cy="144.5" r="9.3" fill="none"/>${EIKE(x)}</g>
      <circle class="nav" cx="${x}" cy="144.5" r="2"/></g>`;
  const KAROSSERI = "M11.5 148.6 L9.7 139 Q9.2 131 12.3 127.9 Q15 125 20.7 123.3 L55.9 116.1 Q72 104 91.1 99.8 Q112 96.6 143.1 101.9 Q158 104.5 169.9 110.3 L175.2 112.3 Q175.4 116 176 120.7 Q178.6 126 178.3 133.3 L179.1 146.3 L163.3 148.6 A15.3 15.3 0 1 0 133.7 148.6 L53.1 148.6 A15.3 15.3 0 1 0 23.5 148.6 Z";
  const SVG = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <defs>
      <linearGradient id="glitter" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="lakkskygge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/>
        <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
      <linearGradient id="lakkside" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/>
        <stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
      <linearGradient id="frontrute" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55606c"/><stop offset="1" stop-color="#262d35"/></linearGradient>
      <linearGradient id="bakrute" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b2027"/><stop offset=".6" stop-color="#0f1216"/><stop offset="1" stop-color="#1d2229"/></linearGradient>
      <clipPath id="terskelklipp"><rect x="56" y="145.6" width="76" height="3.6" rx="1.8"/></clipPath>
    </defs>
    <line class="vei" x1="0" y1="157.5" x2="200" y2="157.5"/>
    <line class="veistriper" x1="0" y1="166" x2="200" y2="166"/>
    <line class="fartlinjer" x1="180" y1="126" x2="192" y2="126"/><line class="fartlinjer fl2" x1="182" y1="134" x2="196" y2="134"/><line class="fartlinjer fl3" x1="180" y1="142" x2="190" y2="142"/>
    <ellipse class="skygge" cx="95" cy="157.5" rx="88" ry="4.5"/>

    <!-- lader på veggen og kabel -->
    <rect class="boks" x="186" y="98" width="12" height="24" rx="4"/><circle class="boks-led" cx="192" cy="104" r="1.7"/>
    <path class="kabel" d="M192 122 C192 150, 183 154, 180 140 S176.5 122 172.5 119.5"/>
    <path class="energi" d="M192 122 C192 150, 183 154, 180 140 S176.5 122 172.5 119.5"/>

    <!-- låseikon over taket -->
    <g transform="translate(112 84)"><g class="laas">
      <circle class="laas-sirkel" cx="0" cy="0" r="8"/>
      <path class="laas-bue" d="M-2.6 -1 v-2.2 a2.6 2.6 0 0 1 5.2 0 v2.2"/>
      <rect class="laas-kropp" x="-3.8" y="-1" width="7.6" height="5.6" rx="1.2"/>
    </g></g>

    <!-- bakluke: tegnes før karosseriet så den ligger bak når den åpnes -->
    <g class="lokk bak">
      <path class="karosseri" d="M143.1 101.9 Q158 104.5 169.9 110.3 L175.2 112.3 L176 120.7 L168.5 119.4 Q160 110 143.1 105.6 Z"/>
      <path d="M143.1 101.9 Q158 104.5 169.9 110.3 L175.2 112.3 L176 120.7 L168.5 119.4 Q160 110 143.1 105.6 Z" fill="url(#lakkskygge)"/>
      <path d="M145 103.3 Q156 105.6 164 110.2 L160.5 110.8 Q153 107 144.5 105Z" fill="#12161b"/>
    </g>

    <!-- karosseri med lakk og skygge -->
    <path class="karosseri" d="${KAROSSERI}"/>
    <path d="${KAROSSERI}" fill="url(#lakkside)"/>
    <path d="${KAROSSERI}" fill="url(#lakkskygge)"/>
    <!-- svarte hjulbuer, terskel og støtfangere -->
    <path d="M53.1 148.6 A15.3 15.3 0 1 0 23.5 148.6" fill="none" stroke="#15181c" stroke-width="2.4"/>
    <path d="M163.3 148.6 A15.3 15.3 0 1 0 133.7 148.6" fill="none" stroke="#15181c" stroke-width="2.4"/>
    <path d="M11.2 146 Q16 147.6 22.8 147.4 L22.8 149.6 Q15 150 11.6 148.6Z" fill="#15181c"/>
    <path d="M164.8 142.6 L179.3 141.4 L179.1 146.3 L164.5 148.4Z" fill="#15181c"/>
    <path d="M11.2 134.4 Q15 133.6 19.5 133.8 L19.2 135.6 Q15 135.6 11.4 136.2Z" fill="#15181c"/>
    <!-- vinduer -->
    <path d="M63.6 117 Q76 105 91 100.4 Q118 97.5 143 102.4 Q150 104 155 107.2 Q153 110.5 151.5 112.9 L63.6 117.2 Z" fill="#0d1014"/>
    <path d="M65.5 116.4 Q77 105.8 91.5 101.6 L102.8 101 L102.8 115.8 Z" fill="url(#frontrute)"/>
    <path d="M109 100.8 Q127 100.6 141.5 103.3 L141.5 113.6 L109 115.4 Z" fill="url(#bakrute)"/>
    <path d="M144 103.8 Q150 105 153.2 107.6 Q151.8 110.4 150.4 112.2 L144 113.2 Z" fill="url(#bakrute)"/>
    <path d="M67 115 Q76 107 88 103" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
    <!-- vinduer på gløtt -->
    <path class="glipe" d="M67 115.2 Q77.5 105.8 91.6 102 L102.4 101.4"/>
    <path class="glipe" d="M109.4 101.4 Q127 101.2 141.2 104"/>
    <path class="glipe" d="M144.4 104.4 Q149.8 105.6 152.6 108"/>
    <path class="luft" d="M84 101 q1.5-2 0-4 q-1.5-2 0-4"/><path class="luft l2" d="M121 99.5 q1.5-2 0-4 q-1.5-2 0-4"/><path class="luft l3" d="M138 101 q1.5-2 0-4 q-1.5-2 0-4"/>
    <!-- detaljer: dørlinjer, håndtak, speil, kamera, skulderlinje -->
    <path class="linje" d="M58.2 118.9 Q55.4 132 57.6 147 M102.8 117.2 V146.4 M143.1 114.2 Q141.4 124 136.4 131.5"/>
    <path d="M58 124.8 Q115 120.4 176.4 120" fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".9"/>
    <rect x="92.6" y="120.6" width="7.8" height="1.5" rx=".75" fill="rgba(0,0,0,.45)"/>
    <rect x="131.6" y="118.4" width="7.8" height="1.5" rx=".75" fill="rgba(0,0,0,.45)"/>
    <path d="M64.3 117.9 Q64.3 113.4 69.4 112.7 Q72.9 113 72.7 115.8 L68.4 118.4 Z" class="karosseri"/>
    <path d="M64.3 117.9 Q64.3 113.4 69.4 112.7 Q72.9 113 72.7 115.8 L68.4 118.4 Z" fill="rgba(0,0,0,.22)"/>
    <path d="M49.8 125.8 L55.9 125.5 L53 127.3 Z" fill="#101316"/>
    <circle class="sentrylys" cx="53" cy="126.2" r="1.5"/>
    <!-- lys -->
    <path class="lys" d="M11.5 128.6 Q16 126.6 24 126.2 L23.5 127.4 Q17 128 12 129.8 Z"/>
    <path d="M165.3 116.2 Q171 115.6 176.3 118.2 L176 121.4 Q170 120.2 165.6 118.6 Z" fill="#170d0d"/>
    <path class="baklys" d="M166 117.4 Q171 117.2 176 119.6" fill="none" stroke-width="1.1"/>
    <circle class="port" cx="172.3" cy="119.2" r="1.6"/>
    <g class="portluke"><rect class="karosseri" x="170.3" y="117.3" width="4.2" height="3.8" rx="1"/><rect x="170.3" y="117.3" width="4.2" height="3.8" rx="1" fill="rgba(0,0,0,.28)"/></g>
    <text class="t-inne" x="125" y="110.5" text-anchor="middle"></text>

    <!-- frunk (panser) -->
    <g class="lokk frunk">
      <path class="karosseri" d="M20.7 123.3 L55.9 116.1 L57 119.2 L21.8 126.6 Z"/>
      <path d="M20.7 123.3 L55.9 116.1 L57 119.2 L21.8 126.6 Z" fill="rgba(255,255,255,.2)"/>
    </g>

    <!-- defrost på frontruta -->
    <path class="dfr" d="M72 114.5 q1.5-2 0-4 q-1.5-2 0-4"/><path class="dfr d2" d="M79 112 q1.5-2 0-4 q-1.5-2 0-4"/><path class="dfr d3" d="M86 109.5 q1.5-2 0-4 q-1.5-2 0-4"/>

    <!-- batteriet i den svarte terskelen mellom hjulene -->
    <rect x="54" y="144.4" width="80" height="6" rx="2" fill="#15181c"/>
    <rect class="terskel" x="56" y="145.6" width="76" height="3.6" rx="1.8"/>
    <g clip-path="url(#terskelklipp)">
      <rect class="celle" x="56" y="145.6" width="0" height="3.6" fill="#5be38a"/>
      <rect class="glitter" x="56" y="145.6" width="24" height="3.6"/>
    </g>
    <line class="grense" x1="0" y1="143" x2="0" y2="152"/>

    <!-- hjul -->
    ${HJUL(38.3)}${HJUL(148.5)}
  </svg>`;

  class KiTeslaCard extends HTMLElement {
    static getStubConfig() { return {}; }
    static getConfigForm() {
      return {
        schema: [
          { name: "navn", selector: { text: {} } },
          { name: "lakk", selector: { text: {} } },
          { name: "kapasitet", selector: { number: { min: 40, max: 110, unit_of_measurement: "kWh" } } },
          { name: "batteri", selector: { entity: { domain: "sensor" } } },
          { name: "rekkevidde", selector: { entity: { domain: "sensor" } } },
          { name: "effekt", selector: { entity: { domain: "sensor" } } },
          { name: "ladegrense", selector: { entity: {} } },
          { name: "ladestatus", selector: { entity: {} } },
          { name: "ladeport", selector: { entity: {} } },
          { name: "fart", selector: { entity: { domain: "sensor" } } },
          { name: "vindu", selector: { entity: { domain: "switch" } } },
          { name: "laas", selector: { entity: { domain: ["lock", "switch", "binary_sensor"] } } },
          { name: "laas_omvendt", selector: { boolean: {} } },
          { name: "bagasje", selector: { entity: { domain: ["switch", "cover"] } } },
          { name: "frunk", selector: { entity: { domain: ["switch", "cover"] } } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", lakk: "Lakkfarge (hex)", kapasitet: "Batterikapasitet", batteri: "Batterinivå", rekkevidde: "Rekkevidde",
          effekt: "Ladeeffekt", ladegrense: "Ladegrense", ladestatus: "Ladestatus", ladeport: "Ladeport", fart: "Fart", vindu: "Vinduer på gløtt", laas: "Lås", laas_omvendt: "Lås: «på» betyr åpen", bagasje: "Bagasjerom", frunk: "Frunk", tap_action: "Trykk" }[s.name] || s.name),
      };
    }
    setConfig(c) { this._c = { ...STANDARD, ...(c || {}) }; this._auto = null; this._bygget = false; if (this._hass) this._oppdater(); }
    set hass(h) {
      this._hass = h; if (!this._c) return;
      if (!this._auto || Date.now() - this._autoTid > 60000) this._finn();
      const ids = this._ids || [];
      if (this._bygget && this._siste && ids.every((id, i) => h.states[id] === this._siste[i])) return;
      this._siste = ids.map((id) => h.states[id]); this._oppdater();
    }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }

    /** fyll inn manglende entiteter automatisk ut fra prefiksene */
    _finn() {
      const c = this._c, h = this._hass, pre = [].concat(c.prefiks || []);
      const kandidater = Object.keys(h.states).filter((id) => pre.some((p) => id.includes(p)));
      const a = {};
      for (const [k, mønstre] of Object.entries(AUTO)) {
        if (c[k] && h.states[c[k]]) { a[k] = c[k]; continue; }
        a[k] = kandidater.find((id) => mønstre.some((m) => m.test(id)));
      }
      for (const k of ["batteri", "rekkevidde", "effekt", "ladestatus", "ladeport", "lader", "ladegrense", "laas", "bagasje", "defrost", "vindu"]) a[k] = c[k];
      if (a.bagasje && a.frunk === a.bagasje) a.frunk = null;
      this._auto = a; this._autoTid = Date.now();
      this._ids = Object.values(a).flat().filter(Boolean);
    }
    _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
    _trykk() {
      const a = this._c.tap_action || { action: "more-info" };
      if (a.action === "none") return;
      if (a.action === "navigate" && a.navigation_path) { history.pushState(null, "", a.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); }
      else if (a.action === "more-info") this._mer(a.entity || this._auto.batteri);
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: this._auto.batteri }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="tc" role="button" tabindex="0">
        <div class="glod"></div><div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
        <div class="stor"></div><div class="sub"></div></div><div class="scene">${SVG}</div></div>`;
      const kort = this.shadowRoot.querySelector(".tc");
      kort.addEventListener("click", () => this._trykk());
      kort.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }

    _oppdater() {
      if (!this._bygget) this._bygg();
      if (!this._auto) this._finn();
      const a = this._auto, c = this._c, h = this._hass, s = (id) => (id ? h.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".tc");
      kort.style.setProperty("--lakk", c.lakk);

      const batt = tall(s(a.batteri)), rekk = tall(s(a.rekkevidde)), grense = tall(s(a.ladegrense));
      let eff = tall(s(a.effekt)); if (!isNaN(eff) && s(a.effekt).attributes.unit_of_measurement === "W") eff /= 1000;
      const lsSt = ok(s(a.ladestatus)) ? String(s(a.ladestatus).state).toLowerCase() : "";
      // ladestatus: charging/starting = lader, complete/stopped/no_power/plugged = tilkoblet, disconnected = frakoblet
      const lader = ((/charging|starting|lader/.test(lsSt)) && !/not|complete|stopped|disconnected/.test(lsSt)) || (s(a.lader) && s(a.lader).state === "on") || eff > 0.3;
      const tilkoblet = lader || (/plugged|connected|complete|stopped|no_power|nopower|fullført|stoppet/.test(lsSt) && !/disconnected|unplugged|frakoblet/.test(lsSt)) || (s(a.kabel) && s(a.kabel).state === "on");
      const portApen = tilkoblet || (s(a.ladeport) && ["on", "open"].includes(s(a.ladeport).state));
      const gir = ok(s(a.gir)) ? String(s(a.gir).state).toUpperCase() : "";
      let fart = tall(s(a.fart));
      if (!isNaN(fart) && /mph|mi\/h/i.test(String(s(a.fart).attributes.unit_of_measurement || ""))) fart *= 1.609;
      const kjorer = fart > 0.5 || ["D", "R"].includes(gir);
      /* Tre former i praksis:
         · `lock.` gir "locked" / "unlocked"
         · en bryter der `on` betyr LÅST
         · en bryter der `on` betyr ÅPEN (Tesla-brua, `doors_locked`)
         Den siste kan ikke utledes fra navnet, så `laas_omvendt` avgjør.
         Ukjent verdi regnes som låst: å vippe på låseikonet fordi en entitet ikke
         svarer, ville vært en påstand uten dekning. */
      const laasSt = s(a.laas) && s(a.laas).state;
      const ulast = laasSt === "unlocked" ? true
        : laasSt === "locked" ? false
        : laasSt === "on" ? c.laas_omvendt !== false
        : laasSt === "off" ? c.laas_omvendt === false
        : false;
      // bryter (on = åpen) eller cover (open/opening)
      const apen = (x) => !!x && ["open", "opening", "on"].includes(x.state);
      const bakApen = apen(s(a.bagasje)), frunkApen = apen(s(a.frunk));
      const defrost = [].concat(a.defrost || []).some((id) => s(id) && s(id).state === "on");
      const vindu = apen(s(a.vindu));
      const sentry = s(a.sentry) && s(a.sentry).state === "on";
      const lavt = batt < 20 && !lader;

      const kl = { lader, tilkoblet, kjorer, ulast, "port-apen": portApen, "bak-apen": bakApen, "frunk-apen": frunkApen, defrost, vindu, sentry, lavt: lavt && !kjorer };
      for (const [k, v] of Object.entries(kl)) kort.classList.toggle(k, !!v);
      kort.style.setProperty("--flyt", (isNaN(eff) ? 1 : klem(1.3 - eff / 20, 0.3, 1.3)).toFixed(2) + "s");
      const f = isNaN(fart) ? 40 : klem(fart, 5, 130);
      kort.style.setProperty("--hjul", (18 / f).toFixed(3) + "s");   // 50 km/t ≈ 0,36 s per omdreining
      kort.style.setProperty("--vei", (36 / f).toFixed(3) + "s");

      // batteri i terskelen + ladegrense-markør
      const b = isNaN(batt) ? 0 : klem(batt, 0, 100);
      const celle = $(".celle");
      celle.setAttribute("width", (b / 100 * 76).toFixed(1));
      celle.setAttribute("fill", lader ? "#5ae6a0" : b < 20 ? "#ff5a4a" : b < 31 ? "#ffb34a" : "#5be38a");
      const gl = $(".grense");
      if (isNaN(grense)) gl.style.display = "none"; else { gl.style.display = ""; gl.style.transform = `translateX(${(56 + klem(grense, 0, 100) / 100 * 76).toFixed(1)}px)`; }
      const inne = tall(s(a.innetemp)), klimaPaa = s(a.klima) && s(a.klima).state !== "off" && ok(s(a.klima));
      $(".t-inne").textContent = !isNaN(inne) && (klimaPaa || kjorer) ? `${Math.round(inne)}°` : "";

      // tekst
      $(".n").textContent = c.navn;
      let pt, ik, farge = "";
      if (kjorer) { pt = !isNaN(fart) && fart > 0.5 ? `Kjører · ${Math.round(fart)} km/t` : "Kjører"; ik = "mdi:steering"; }
      else if (lader) { pt = isNaN(eff) ? "Lader" : `Lader · ${komma(eff, 1)} kW`; ik = "mdi:ev-station"; }
      else if (bakApen || frunkApen) { pt = frunkApen && bakApen ? "Frunk og bagasjerom åpne" : frunkApen ? "Frunken er åpen" : "Bagasjerommet er åpent"; ik = "mdi:car-back"; farge = "gul"; }
      else if (ulast) { pt = "Ulåst"; ik = "mdi:lock-open-variant"; farge = "gul"; }
      else if (vindu) { pt = "Vinduer på gløtt"; ik = "mdi:car-door"; farge = "gul"; }
      else if (lavt) { pt = "Lavt batteri"; ik = "mdi:battery-alert-variant-outline"; farge = "rod"; }
      else if (tilkoblet) { pt = /complete|fullført/.test(lsSt) ? "Ferdig ladet" : "Tilkoblet"; ik = "mdi:power-plug"; }
      else if (portApen) { pt = "Ladeport åpen"; ik = "mdi:ev-plug-type2"; }
      else if (sentry) { pt = "Sentry på"; ik = "mdi:cctv"; }
      else { pt = "Låst"; ik = "mdi:lock"; }
      const pille = $(".pille"); pille.className = "pille " + farge;
      pille.querySelector("ha-icon").setAttribute("icon", ik); $(".pt").textContent = pt;
      $(".stor").innerHTML = isNaN(batt) ? "--" : `${Math.round(batt)}<small>%</small>`;

      const deler = [];
      if (!isNaN(rekk)) deler.push(`${Math.round(rekk)} km`);
      if (lader && !isNaN(eff) && eff > 0.3 && !isNaN(grense) && !isNaN(batt) && grense > batt) {
        const timer = ((grense - batt) / 100) * c.kapasitet / eff;
        const ferdig = new Date(Date.now() + timer * 3600000);
        deler.push(`${Math.round(grense)} % ca ${ferdig.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`);
      } else if (!isNaN(grense)) deler.push(`grense ${Math.round(grense)} %`);
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${pt}. Batteri ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
  }

  if (!customElements.get("ki-tesla-card")) customElements.define("ki-tesla-card", KiTeslaCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-tesla-card"))
    window.customCards.push({ type: "ki-tesla-card", name: "KI Tesla", description: "Animert Tesla Model Y: lading, batteri, lås, frunk, bagasjerom, defrost og sentry", preview: true });
})();

/* ki-tesla-card – animert Tesla Model Y i samme stil som ki-varmepumpe-card og ki-homelab-card.
 *
 *  Scenen viser bilen fra siden:
 *   – batteriet i dørterskelen fylles til batterinivået, med en markør for ladegrensen
 *   – ved lading strømmer energi fra laderen gjennom kabelen, og batteriet glitrer
 *   – frunk og bagasjerom åpnes i tegningen når de står åpne
 *   – defrost gir varmebølger på frontruta, sentry blinker rødt
 *   – når bilen kjører, ruller hjulene og veien glir forbi
 *   – låseikonet over taket er oransje og vipper når bilen er ulåst
 *
 *  Alle entiteter har standardverdier. Frunk, sentry, klima, innetemperatur, gir og fart
 *  letes opp automatisk blant entiteter som starter med prefiksene (folkevogn, tesla_model_y).
 *
 *  type: custom:ki-tesla-card
 *  navn: Tesla Model Y
 *  lakk: "#dfe3e8"          # bilens farge
 *  kapasitet: 75            # kWh, brukes til å anslå når ladingen er ferdig
 *  tap_action: { action: navigate, navigation_path: "#tesla" }
 */
(() => {
  const STANDARD = {
    navn: "Tesla Model Y",
    lakk: "#dfe3e8",
    kapasitet: 75,
    prefiks: ["folkevogn", "tesla_model_y"],
    batteri: "sensor.tesla_model_y_batteri_batteriniva",
    rekkevidde: "sensor.tesla_model_y_batteri_estimert_batterirekkevidde",
    effekt: "sensor.tesla_model_y_batteri_charge_power",
    ladestatus: "select.tesla_model_y_ev_charging_state",
    lader: "switch.elbillader_charging",
    ladegrense: "input_number.tesla_model_y_ladegrense",
    laas: "lock.folkevogn_lock",
    bagasje: "cover.folkevogn_trunk",
    frunk: null, sentry: null, klima: null, innetemp: null, gir: null, fart: null,
    defrost: "switch.folkevogn_defrost",
  };
  const AUTO = {
    frunk: [/^cover\..*(frunk|front_trunk|vehicle_state_ft)/],
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
    .tc.kjorer .veistriper { opacity:1; animation:vei .6s linear infinite; }
    @keyframes vei { to { stroke-dashoffset:24; } }
    .skygge { fill:rgba(0,0,0,.35); }
    .karosseri { fill:var(--lakk); }
    .glass { fill:#1c2530; }
    .glans { fill:none; stroke:rgba(255,255,255,.35); stroke-width:1; }
    .linje { fill:none; stroke:rgba(0,0,0,.18); stroke-width:1; }
    .dekk { fill:#15181c; } .felg { fill:#5b636e; } .nav { fill:#2a2f36; }
    .eiker { transform-box:fill-box; transform-origin:center; }
    .tc.kjorer .eiker { animation:rull .45s linear infinite; }
    @keyframes rull { to { transform:rotate(-360deg); } }
    .lys { fill:#fff6d6; opacity:.55; } .tc.kjorer .lys { opacity:1; filter:drop-shadow(0 0 3px #fff3c0); }
    .baklys { fill:#ff4a3a; opacity:.5; } .tc.kjorer .baklys { opacity:1; filter:drop-shadow(0 0 3px #ff4a3a); }
    .lokk { transform-box:view-box; transition:transform .9s cubic-bezier(.3,1.2,.4,1); }
    .frunk { transform-origin:58px 105px; } .tc.frunk-apen .frunk { transform:rotate(22deg); }
    .bak { transform-origin:128px 84px; } .tc.bak-apen .bak { transform:rotate(-38deg); }

    .terskel { fill:#0f141a; stroke:rgba(255,255,255,.12); stroke-width:.8; }
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
    .port { fill:#2c333d; } .tc.tilkoblet .port { fill:#5be38a; filter:drop-shadow(0 0 2px #5be38a); }

    .dfr { fill:none; stroke:#ff9a5c; stroke-width:1.3; stroke-linecap:round; opacity:0; }
    .tc.defrost .dfr { animation:stig 2.2s ease-out infinite; } .tc.defrost .dfr.d2 { animation-delay:.7s; } .tc.defrost .dfr.d3 { animation-delay:1.4s; }
    @keyframes stig { 0% { opacity:0; transform:translateY(3px); } 30% { opacity:.9; } 100% { opacity:0; transform:translateY(-8px); } }
    .dfr { transform-box:fill-box; }
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

  // Model Y sett fra venstre side, fronten mot venstre. Bakken ligger på y=150.
  const SVG = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <defs>
      <linearGradient id="glitter" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="terskelklipp"><rect x="64" y="127" width="52" height="5" rx="2.5"/></clipPath>
    </defs>
    <line class="vei" x1="0" y1="157" x2="200" y2="157"/>
    <line class="veistriper" x1="0" y1="165" x2="200" y2="165"/>
    <ellipse class="skygge" cx="90" cy="157" rx="86" ry="5"/>

    <!-- lader på veggen og kabel -->
    <rect class="boks" x="184" y="92" width="14" height="26" rx="4"/><circle class="boks-led" cx="191" cy="99" r="1.8"/>
    <path class="kabel" d="M191 118 C191 148, 176 150, 172 134 S167 114 163 112"/>
    <path class="energi" d="M191 118 C191 148, 176 150, 172 134 S167 114 163 112"/>

    <!-- låseikon over taket -->
    <g transform="translate(110 64)"><g class="laas">
      <circle class="laas-sirkel" cx="0" cy="0" r="8"/>
      <path class="laas-bue" d="M-2.6 -1 v-2.2 a2.6 2.6 0 0 1 5.2 0 v2.2"/>
      <rect class="laas-kropp" x="-3.8" y="-1" width="7.6" height="5.6" rx="1.2"/>
    </g></g>

    <!-- bagasjerom (bakluke) – tegnes før karosseriet så den ligger bak når den åpnes -->
    <g class="lokk bak"><path class="karosseri" d="M128 83 Q150 88 164 103 L166 108 L158 108 Q146 94 127 87 Z"/><path class="glass" d="M130 87 Q146 92 155 103 L151 104 Q142 94 129 90Z"/></g>

    <!-- karosseri -->
    <path class="karosseri" d="M10 130 Q9 119 16 114 Q34 108 56 104 Q70 90 90 84 Q112 80 130 83 Q150 88 164 103 Q170 108 170 118 L169 136 L152 136 A17 17 0 0 0 118 136 L62 136 A17 17 0 0 0 28 136 L12 136 Z"/>
    <path class="glass" d="M64 103 Q76 91 92 87 Q112 84 128 86 Q144 90 156 102 Q110 104 64 103 Z"/>
    <rect class="karosseri" x="105.5" y="84" width="3" height="20"/>
    <path class="glans" d="M20 113 Q36 109 54 106 M94 85 Q112 82 128 84"/>
    <path class="linje" d="M107 104 V132 M66 106 L66 132 M150 106 Q152 118 150 130 M16 121 Q90 116 168 118"/>
    <path class="lys" d="M11 118 Q15 115 22 114 L21 117 Q15 118 12 121Z"/>
    <path class="baklys" d="M160 104 Q166 104 170 110 L168 112 Q164 107 159 107Z"/>
    <circle class="port" cx="163" cy="112" r="1.8"/>
    <circle class="sentrylys" cx="68" cy="112" r="2"/>
    <text class="t-inne" x="118" y="98" text-anchor="middle"></text>

    <!-- frunk (panser) -->
    <g class="lokk frunk"><path class="karosseri" d="M16 114 Q34 108 56 104 L58 107 Q36 111 18 117 Z"/></g>

    <!-- defrost på frontruta -->
    <path class="dfr" d="M70 98 q2-3 0-6 q-2-3 0-6"/><path class="dfr d2" d="M78 95 q2-3 0-6 q-2-3 0-6"/><path class="dfr d3" d="M86 92 q2-3 0-6 q-2-3 0-6"/>

    <!-- batteri i terskelen (mellom hjulene) -->
    <rect class="terskel" x="64" y="127" width="52" height="5" rx="2.5"/>
    <g clip-path="url(#terskelklipp)">
      <rect class="celle" x="64" y="127" width="0" height="5" fill="#5be38a"/>
      <rect class="glitter" x="64" y="127" width="24" height="5"/>
    </g>
    <line class="grense" x1="0" y1="124" x2="0" y2="135"/>

    <!-- hjul -->
    ${[45, 135].map((x) => `<g><circle class="dekk" cx="${x}" cy="140" r="14"/><circle class="felg" cx="${x}" cy="140" r="9"/>
      <g class="eiker"><circle cx="${x}" cy="140" r="9" fill="none"/>${[0, 72, 144, 216, 288].map((a) => `<rect x="${x - 1}" y="${131.5}" width="2" height="8" rx="1" fill="#8a929c" transform="rotate(${a} ${x} 140)"/>`).join("")}</g>
      <circle class="nav" cx="${x}" cy="140" r="2.4"/></g>`).join("")}
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
          { name: "laas", selector: { entity: { domain: "lock" } } },
          { name: "bagasje", selector: { entity: { domain: "cover" } } },
          { name: "frunk", selector: { entity: { domain: "cover" } } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", lakk: "Lakkfarge (hex)", kapasitet: "Batterikapasitet", batteri: "Batterinivå", rekkevidde: "Rekkevidde",
          effekt: "Ladeeffekt", ladegrense: "Ladegrense", laas: "Lås", bagasje: "Bagasjerom", frunk: "Frunk", tap_action: "Trykk" }[s.name] || s.name),
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
      for (const k of ["batteri", "rekkevidde", "effekt", "ladestatus", "lader", "ladegrense", "laas", "bagasje", "defrost"]) a[k] = c[k];
      if (a.bagasje && a.frunk === a.bagasje) a.frunk = null;
      this._auto = a; this._autoTid = Date.now();
      this._ids = Object.values(a).filter(Boolean);
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
      const lader = (/charging/.test(lsSt) && !/not|complete|stopped/.test(lsSt)) || (s(a.lader) && s(a.lader).state === "on") || eff > 0.3;
      const tilkoblet = lader || /plugged|connected|complete|stopped/.test(lsSt) && !/disconnected|unplugged/.test(lsSt) || (s(a.kabel) && s(a.kabel).state === "on");
      const gir = ok(s(a.gir)) ? String(s(a.gir).state).toUpperCase() : "";
      const fart = tall(s(a.fart));
      const kjorer = ["D", "R", "N"].includes(gir) || fart > 1;
      const ulast = s(a.laas) && s(a.laas).state === "unlocked";
      const bakApen = s(a.bagasje) && ["open", "opening"].includes(s(a.bagasje).state);
      const frunkApen = s(a.frunk) && ["open", "opening"].includes(s(a.frunk).state);
      const defrost = s(a.defrost) && s(a.defrost).state === "on";
      const sentry = s(a.sentry) && s(a.sentry).state === "on";
      const lavt = batt < 20 && !lader;

      const kl = { lader, tilkoblet, kjorer, ulast, "bak-apen": bakApen, "frunk-apen": frunkApen, defrost, sentry, lavt: lavt && !kjorer };
      for (const [k, v] of Object.entries(kl)) kort.classList.toggle(k, !!v);
      kort.style.setProperty("--flyt", (isNaN(eff) ? 1 : klem(1.3 - eff / 20, 0.3, 1.3)).toFixed(2) + "s");

      // batteri i terskelen + ladegrense-markør
      const b = isNaN(batt) ? 0 : klem(batt, 0, 100);
      const celle = $(".celle");
      celle.setAttribute("width", (b / 100 * 52).toFixed(1));
      celle.setAttribute("fill", lader ? "#5ae6a0" : b < 20 ? "#ff5a4a" : b < 31 ? "#ffb34a" : "#5be38a");
      const gl = $(".grense");
      if (isNaN(grense)) gl.style.display = "none"; else { gl.style.display = ""; gl.style.transform = `translateX(${(64 + klem(grense, 0, 100) / 100 * 52).toFixed(1)}px)`; }
      const inne = tall(s(a.innetemp)), klimaPaa = s(a.klima) && s(a.klima).state !== "off" && ok(s(a.klima));
      $(".t-inne").textContent = !isNaN(inne) && (klimaPaa || kjorer) ? `${Math.round(inne)}°` : "";

      // tekst
      $(".n").textContent = c.navn;
      let pt, ik, farge = "";
      if (kjorer) { pt = !isNaN(fart) && fart > 1 ? `Kjører · ${Math.round(fart)} km/t` : "Kjører"; ik = "mdi:steering"; }
      else if (lader) { pt = isNaN(eff) ? "Lader" : `Lader · ${komma(eff, 1)} kW`; ik = "mdi:ev-station"; }
      else if (bakApen || frunkApen) { pt = frunkApen && bakApen ? "Frunk og bagasjerom åpne" : frunkApen ? "Frunken er åpen" : "Bagasjerommet er åpent"; ik = "mdi:car-back"; farge = "gul"; }
      else if (ulast) { pt = "Ulåst"; ik = "mdi:lock-open-variant"; farge = "gul"; }
      else if (lavt) { pt = "Lavt batteri"; ik = "mdi:battery-alert-variant-outline"; farge = "rod"; }
      else if (tilkoblet) { pt = "Tilkoblet"; ik = "mdi:power-plug"; }
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

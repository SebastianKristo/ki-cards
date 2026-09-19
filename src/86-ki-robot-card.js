/* ki-robot-card – animert robotklipper (plen) eller robotstøvsuger (gulv), i samme stil som de andre ki-kortene.
 *
 *  modell: klipper
 *   – plenen sett ovenfra; roboten kjører i baner og etterlater et lysere, nyklippet spor
 *   – posisjonen i banemønsteret følger fremdriften (sensor …_progress)
 *   – i dokken lyser ladestasjonen og RTK-antennen pulserer; lynet blinker når den lader
 *  modell: stovsuger
 *   – gulvet sett ovenfra med sofa og teppe; støvsugeren kjører i baner, sidebørsten snurrer
 *     og støvkorn forsvinner i sporet
 *  Felles: pause fryser roboten, «på vei hjem» viser pil mot dokken, feil gir rødt blink og feilmeldingen.
 *
 *  type: custom:ki-robot-card
 *  modell: klipper                   # klipper | stovsuger
 *  entity: lawn_mower.gjeita         # lawn_mower.* eller vacuum.*
 *  navn: Gjeita
 *  batteri: sensor.gjeita_battery    # valgfritt – ellers attributtet battery_level
 *  lader: binary_sensor.gjeita_lader
 *  fremdrift: sensor.gjeita_progress
 *  tid_igjen: sensor.gjeita_time_left
 *  feil: sensor.gjeita_last_error
 *  varsel: binary_sensor.rolf_water_shortage   # valgfritt: på = rødt varsel
 *  varsel_tekst: Vanntanken er tom
 */
(() => {
  const DAARLIG = ["unavailable", "unknown", "", "none", "None", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const tall = (s) => { if (!ok(s)) return NaN; const v = parseFloat(String(s.state).replace(",", ".")); return isNaN(v) ? NaN : v; };
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // sikksakk-baner over arbeidsflaten
  const baner = (x0, x1, y0, y1, n) => {
    const dy = (y1 - y0) / (n - 1); let d = `M${x0} ${y0}`;
    for (let i = 0; i < n; i++) { const y = +(y0 + i * dy).toFixed(1); d += ` L${i % 2 ? x0 : x1} ${y}`; if (i < n - 1) d += ` L${i % 2 ? x0 : x1} ${(y + dy).toFixed(1)}`; }
    return d;
  };
  const MODELL = {
    klipper: {
      bane: baner(90, 186, 42, 150, 8), bredde: 13.5, varighet: 36, dokk: [74, 150], farge: "#8fe07a",
      bak: `linear-gradient(165deg,#131a14 0%,#172016 55%,#1b2718 100%)`, glod: "rgba(120,220,100,.28)",
      tegning: `
        <defs>
          <pattern id="gress" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#2f5a2a"/><path d="M1 6 L1.6 2.5 M3.5 6 L3 1.5 M5 6 L5.6 3" stroke="#3e7436" stroke-width=".8"/></pattern>
          <pattern id="klippet" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="7" fill="#5c9a4b"/><rect y="7" width="14" height="7" fill="#528c43"/></pattern>
        </defs>
        <rect x="80" y="30" width="116" height="132" rx="14" fill="url(#gress)"/>
        <rect x="80" y="30" width="116" height="132" rx="14" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
        <!-- bed og stein for liv -->
        <ellipse cx="184" cy="40" rx="9" ry="6" fill="#4a3526"/><circle cx="181" cy="38" r="2.2" fill="#e05a7a"/><circle cx="186" cy="41" r="2" fill="#f2c14e"/>
        <!-- ladestasjon med RTK-antenne -->
        <g class="dokk"><rect x="62" y="140" width="22" height="20" rx="4" fill="#2a3038"/><rect x="66" y="144" width="14" height="4" rx="2" class="dokklys"/>
          <line x1="68" y1="140" x2="68" y2="126" stroke="#8a929c" stroke-width="1.4"/><circle cx="68" cy="125" r="2.4" class="antenne"/></g>`,
      robot: `<g class="robotkropp"><rect x="-9" y="-7" width="18" height="14" rx="5" fill="#eef1f4"/><rect x="-9" y="-7" width="18" height="14" rx="5" fill="url(#robotskygge)"/>
          <rect x="-11" y="-7.5" width="4" height="4" rx="1.2" fill="#1b1f24"/><rect x="-11" y="3.5" width="4" height="4" rx="1.2" fill="#1b1f24"/>
          <rect x="7" y="-7.5" width="4" height="4" rx="1.2" fill="#1b1f24"/><rect x="7" y="3.5" width="4" height="4" rx="1.2" fill="#1b1f24"/>
          <circle cx="0" cy="0" r="3.2" fill="#2a3038"/><circle cx="3.5" cy="0" r="1.2" class="robotlys"/></g>`,
      partikler: `<g class="flis">${[0, 1, 2, 3].map((i) => `<rect x="-12" y="${-4 + i * 2.6}" width="2" height="1" rx=".5" fill="#9be08a" style="animation-delay:${(i * 0.12).toFixed(2)}s"/>`).join("")}</g>`,
    },
    stovsuger: {
      bane: baner(88, 188, 40, 152, 11), bredde: 11, varighet: 42, dokk: [76, 152], farge: "rgba(255,255,255,.14)",
      bak: `linear-gradient(165deg,#17161a 0%,#1d1b20 55%,#221f26 100%)`, glod: "rgba(150,170,255,.26)",
      tegning: `
        <defs>
          <pattern id="gulv" width="36" height="9" patternUnits="userSpaceOnUse">
            <rect width="36" height="9" fill="#4a3c30"/><path d="M0 8.6 H36 M18 0 V9" stroke="#3b2f25" stroke-width=".8"/></pattern>
        </defs>
        <rect x="80" y="26" width="116" height="140" rx="10" fill="url(#gulv)"/>
        <ellipse cx="148" cy="118" rx="30" ry="20" fill="#5f5a6e" opacity=".75"/>
        <ellipse cx="148" cy="118" rx="24" ry="15" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="2 3"/>
        <rect x="110" y="28" width="62" height="12" rx="4" fill="#3a4250"/><rect x="112" y="30" width="58" height="6" rx="3" fill="#465061"/>
        <rect x="80" y="26" width="116" height="140" rx="10" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
        ${[[98, 60], [132, 76], [166, 58], [104, 102], [172, 140], [120, 132], [150, 92], [94, 142], [182, 104]].map(([x, y], i) => `<circle class="stov" cx="${x}" cy="${y}" r="1" style="animation-delay:${(i * 0.37).toFixed(2)}s"/>`).join("")}
        <g class="dokk"><rect x="64" y="140" width="20" height="22" rx="4" fill="#2a3038"/><rect x="68" y="146" width="12" height="3.5" rx="1.75" class="dokklys"/></g>`,
      robot: `<g class="robotkropp"><circle r="9" fill="#eef1f4"/><circle r="9" fill="url(#robotskygge)"/><circle r="9" fill="none" stroke="#c7ccd3" stroke-width=".8"/>
          <path d="M5.5 -6.5 A9 9 0 0 1 5.5 6.5" fill="none" stroke="#2a3038" stroke-width="2.2"/>
          <circle cx="-1.5" cy="0" r="3" fill="#2a3038"/><circle cx="-1.5" cy="0" r="1.2" class="robotlys"/>
          <g transform="translate(6 -7)"><g class="borste"><circle r="3.6" fill="none"/><path d="M0 -3.5 V3.5 M-3 -1.8 L3 1.8 M-3 1.8 L3 -1.8" stroke="#8a929c" stroke-width=".8"/></g></g></g>`,
      partikler: "",
    },
  };

  const STIL = `
    :host { display:block; }
    .rk { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eef3f8;
      -webkit-tap-highlight-color:transparent; outline:none; transition:transform .15s cubic-bezier(.3,1.4,.5,1); }
    .rk:active { transform:scale(.985); }
    .rk:focus-visible { box-shadow:0 0 0 2px var(--active-big,#f5c542); }
    .glod { position:absolute; inset:0; z-index:-1; opacity:0; transition:opacity 1.2s; }
    .rk.jobber .glod, .rk.lader .glod { opacity:1; }
    .rk.feil .glod { opacity:1; background:radial-gradient(70% 90% at 72% 70%, rgba(255,80,70,.34) 0%, transparent 62%) !important; }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:44%; min-width:0; }
    .n { font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(238,243,248,.12); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; }
    .rk.jobber .pille { background:rgba(120,220,100,.26); } .rk.pause .pille, .rk.hjem .pille { background:rgba(255,179,74,.3); }
    .rk.feil .pille { background:rgba(255,80,70,.42); animation:rist 4s ease-in-out infinite; }
    @keyframes rist { 0%,90%,100% { transform:none; } 92% { transform:translateX(-2px); } 94% { transform:translateX(2px); } 96% { transform:translateX(-1px); } }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-left:2px; opacity:.85; }
    .sub { font-size:13px; opacity:.62; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rk.feil .sub { opacity:.9; color:#ffb0a8; }
    .batt { margin-top:7px; height:4px; border-radius:2px; background:rgba(238,243,248,.14); overflow:hidden; }
    .batt i { display:block; height:100%; border-radius:2px; background:#5be38a; transition:width 1.2s ease, background .6s; }
    .rk.lader .batt i { background-image:linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); background-size:40% 100%;
      background-repeat:no-repeat; background-color:#5ae6a0; animation:glitter 1.6s linear infinite; }
    @keyframes glitter { from { background-position:-40% 0; } to { background-position:140% 0; } }
    .scene { position:absolute; right:0; bottom:0; width:58%; max-width:300px; height:100%; }
    .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }

    .spor { fill:none; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1000; stroke-dashoffset:1000; opacity:0; }
    .rk.jobber .spor, .rk.pause .spor { opacity:1; animation:spor var(--varighet,36s) linear infinite; animation-delay:var(--forsinkelse,0s); }
    @keyframes spor { to { stroke-dashoffset:0; } }
    .robot { offset-rotate:auto; transition:opacity .4s; }
    .rk.jobber .robot, .rk.pause .robot { offset-path:var(--bane); animation:kjor var(--varighet,36s) linear infinite; animation-delay:var(--forsinkelse,0s); }
    @keyframes kjor { from { offset-distance:0%; } to { offset-distance:100%; } }
    .rk.pause .robot, .rk.pause .spor, .rk.pause .flis rect, .rk.pause .borste { animation-play-state:paused !important; }
    .rk:not(.jobber):not(.pause) .robot { transform:translate(var(--dx), var(--dy)); }
    .rk.hjem .robot { transform:translate(calc(var(--dx) + 20px), calc(var(--dy) - 18px)) rotate(-140deg); }
    .robotlys { fill:#5be38a; } .rk.feil .robotlys { fill:#ff5a4a; animation:blink .7s steps(2,end) infinite; } .rk.pause .robotlys { fill:#ffb34a; }
    .rk.feil .robotkropp { animation:feilrist 1.4s ease-in-out infinite; }
    @keyframes feilrist { 0%,100% { transform:rotate(0); } 25% { transform:rotate(-6deg); } 75% { transform:rotate(6deg); } }
    .borste { animation:snurr .35s linear infinite; animation-play-state:paused; transform-box:fill-box; transform-origin:center; }
    .rk.jobber .borste { animation-play-state:running; }
    @keyframes snurr { to { transform:rotate(360deg); } }
    .flis rect { opacity:0; } .rk.jobber .flis rect { animation:flis .5s linear infinite; }
    @keyframes flis { 0% { opacity:.9; transform:translateX(0); } 100% { opacity:0; transform:translateX(-6px); } }
    .stov { fill:#d9cbb6; opacity:.7; } .rk.jobber .stov { animation:stov 3.2s ease-in-out infinite; }
    @keyframes stov { 0%,60% { opacity:.7; } 80%,100% { opacity:0; } }
    .dokklys { fill:#3a4452; transition:fill .6s; } .rk.lader .dokklys, .rk.dokket .dokklys { fill:#5be38a; }
    .rk.lader .dokklys { animation:blink 1.2s ease-in-out infinite; }
    .antenne { fill:#8a929c; } .rk.jobber .antenne, .rk.dokket .antenne { fill:#5ad1ff; animation:blink 2s ease-in-out infinite; }
    .hjempil { fill:#ffb34a; opacity:0; } .rk.hjem .hjempil { animation:hjempil 1.2s ease-in-out infinite; }
    @keyframes hjempil { 0%,100% { opacity:.2; transform:translateX(3px); } 50% { opacity:1; transform:translateX(-2px); } }
    .lyn { fill:#ffd24a; opacity:0; } .rk.lader .lyn { animation:blink 1s steps(2,end) infinite; }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }
    @media (prefers-reduced-motion: reduce) { .rk * { animation:none !important; } }
    @media (max-width:380px) { .scene { width:54%; } .tekst { max-width:46%; } }
  `;

  class KiRobotCard extends HTMLElement {
    /* Stubben må gi en konfigurasjon `setConfig` godtar, ellers kaster kortet i
       kortvelgerens forhåndsvisning og står tomt der. `hass` sendes med, så vi velger
       en robot som faktisk finnes hos brukeren når det er en. */
    static getStubConfig(hass) {
      const finn = (pre) => Object.keys((hass && hass.states) || {})
        .find((id) => id.startsWith(pre));
      const klipper = finn("lawn_mower."), sug = finn("vacuum.");
      return klipper
        ? { modell: "klipper", entity: klipper }
        : sug
          ? { modell: "stovsuger", entity: sug }
          : { modell: "klipper", entity: "lawn_mower.robot" };
    }
    static getConfigForm() {
      return {
        schema: [
          { name: "modell", selector: { select: { mode: "dropdown", options: [{ value: "klipper", label: "Robotklipper" }, { value: "stovsuger", label: "Robotstøvsuger" }] } } },
          { name: "entity", selector: { entity: { domain: ["lawn_mower", "vacuum"] } } },
          { name: "navn", selector: { text: {} } },
          { name: "batteri", selector: { entity: { domain: "sensor" } } },
          { name: "lader", selector: { entity: {} } },
          { name: "fremdrift", selector: { entity: { domain: "sensor" } } },
          { name: "tid_igjen", selector: { entity: { domain: "sensor" } } },
          { name: "feil", selector: { entity: { domain: "sensor" } } },
          { name: "varsel", selector: { entity: {} } },
          { name: "varsel_tekst", selector: { text: {} } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ modell: "Type robot", entity: "Robot", navn: "Navn", batteri: "Batteri", lader: "Lader", fremdrift: "Fremdrift (%)",
          tid_igjen: "Tid igjen (min)", feil: "Siste feil", varsel: "Varsel (på = rødt)", varsel_tekst: "Varseltekst", tap_action: "Trykk" }[s.name] || s.name),
      };
    }
    setConfig(c) {
      if (!c || !c.entity) throw new Error("Velg robot-entiteten (lawn_mower.* eller vacuum.*)");
      this._c = { modell: c.entity.startsWith("vacuum.") ? "stovsuger" : "klipper", ...c };
      this._bygget = false; if (this._hass) this._oppdater();
    }
    set hass(h) {
      this._hass = h; if (!this._c) return;
      const c = this._c, ids = [c.entity, c.batteri, c.lader, c.fremdrift, c.tid_igjen, c.feil, c.varsel].filter(Boolean);
      const n = ids.map((id) => h.states[id]);
      if (this._bygget && this._siste && n.every((s, i) => s === this._siste[i])) return;
      this._siste = n; this._oppdater();
    }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }

    _trykk() {
      const a = this._c.tap_action || { action: "more-info" };
      if (a.action === "none") return;
      if (a.action === "navigate" && a.navigation_path) { history.pushState(null, "", a.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); }
      else if (a.action === "more-info") this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: a.entity || this._c.entity }, bubbles: true, composed: true }));
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: this._c.entity }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      const m = MODELL[this._c.modell] || MODELL.klipper;
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style>
        <div class="rk" role="button" tabindex="0" style="background:${m.bak};--varighet:${m.varighet}s;--bane:path('${m.bane}');--dx:${m.dokk[0]}px;--dy:${m.dokk[1]}px">
          <div class="glod" style="background:radial-gradient(70% 90% at 72% 70%, ${m.glod} 0%, transparent 62%)"></div>
          <div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
            <div class="stor"></div><div class="sub"></div><div class="batt"><i></i></div></div>
          <div class="scene"><svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
            <defs><radialGradient id="robotskygge" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient></defs>
            ${m.tegning}
            <path class="spor" d="${m.bane}" pathLength="1000" stroke="${m.farge}" stroke-width="${m.bredde}"/>
            ${this._c.modell === "klipper" ? `<path class="spor" d="${m.bane}" pathLength="1000" stroke="url(#klippet)" stroke-width="${m.bredde}" style="opacity:var(--klippet,0)"/>` : ""}
            <path class="hjempil" d="M${m.dokk[0] + 28} ${m.dokk[1] - 22} l-8 4 8 4 v-2.5 h8 v-3 h-8z"/>
            <g class="robot">${m.partikler}${m.robot}</g>
            <path class="lyn" d="M${m.dokk[0] + 12} ${m.dokk[1] - 26} l-5 8 h4 l-3 7 8-10 h-4 l3-5z"/>
          </svg></div></div>`;
      const kort = this.shadowRoot.querySelector(".rk");
      kort.addEventListener("click", () => this._trykk());
      kort.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }

    _oppdater() {
      if (!this._bygget) this._bygg();
      const c = this._c, h = this._hass, s = (id) => (id ? h.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".rk");
      const r = s(c.entity), st = r ? String(r.state).toLowerCase() : "unavailable";
      const klipper = c.modell !== "stovsuger";
      const jobber = ["mowing", "cleaning", "on"].includes(st);
      const pause = st === "paused";
      const hjem = st === "returning";
      const feilTilst = st === "error";
      const dokket = st === "docked" || st === "charging";
      let batt = tall(s(c.batteri)); if (isNaN(batt) && r) batt = parseFloat(r.attributes.battery_level);
      const lader = (s(c.lader) && s(c.lader).state === "on") || st === "charging" || (dokket && r && /charg/i.test(String(r.attributes.status || "")));
      const frem = tall(s(c.fremdrift)), igjen = tall(s(c.tid_igjen));
      const feilS = s(c.feil), feilTxt = ok(feilS) && !/^(no.?error|ingen|0)$/i.test(feilS.state) ? feilS.state : "";
      const varsel = c.varsel && s(c.varsel) && s(c.varsel).state === "on";
      const feil = feilTilst || varsel;

      kort.classList.toggle("jobber", jobber); kort.classList.toggle("pause", pause); kort.classList.toggle("hjem", hjem);
      kort.classList.toggle("dokket", dokket); kort.classList.toggle("lader", !!lader && !jobber); kort.classList.toggle("feil", !!feil);
      // start i banemønsteret der fremdriften er
      const varighet = (MODELL[c.modell] || MODELL.klipper).varighet;
      const del = isNaN(frem) ? 0 : klem(frem, 0, 99) / 100;
      const forsinkelse = (-del * varighet).toFixed(1) + "s";
      if (kort.style.getPropertyValue("--forsinkelse") !== forsinkelse && !this._forsinketSatt) { kort.style.setProperty("--forsinkelse", forsinkelse); this._forsinketSatt = jobber; }
      if (!jobber && !pause) this._forsinketSatt = false;
      if (klipper) kort.style.setProperty("--klippet", jobber || pause ? "1" : "0");

      const bi = $(".batt i"), b = isNaN(batt) ? 0 : klem(batt, 0, 100);
      bi.style.width = b + "%";
      bi.style.backgroundColor = lader && !jobber ? "#5ae6a0" : b < 20 ? "#ff5a4a" : b < 40 ? "#ffb34a" : "#5be38a";

      $(".n").textContent = c.navn || (r && r.attributes.friendly_name) || "Robot";
      let pt, ik;
      if (varsel) { pt = c.varsel_tekst || "Varsel"; ik = "mdi:alert-circle"; }
      else if (feilTilst) { pt = "Feil"; ik = "mdi:alert-circle"; }
      else if (jobber) { pt = klipper ? "Klipper" : "Støvsuger"; ik = klipper ? "mdi:robot-mower" : "mdi:robot-vacuum"; }
      else if (pause) { pt = "Pauset"; ik = "mdi:pause"; }
      else if (hjem) { pt = "På vei hjem"; ik = "mdi:home-import-outline"; }
      else if (lader) { pt = "Lader i dokken"; ik = "mdi:battery-charging"; }
      else if (dokket) { pt = "I dokken"; ik = "mdi:home"; }
      else if (st === "unavailable") { pt = "Utilgjengelig"; ik = "mdi:wifi-off"; }
      else { pt = "Klar"; ik = "mdi:check"; }
      $(".pille ha-icon").setAttribute("icon", ik); $(".pt").textContent = pt;

      if ((jobber || pause) && !isNaN(frem)) $(".stor").innerHTML = `${Math.round(frem)}<small>% ferdig</small>`;
      else $(".stor").innerHTML = isNaN(batt) ? "--" : `${Math.round(batt)}<small>% batteri</small>`;
      const deler = [];
      if (feil) deler.push(feilTilst && feilTxt ? feilTxt : varsel ? "" : feilTxt);
      else if ((jobber || pause) && !isNaN(igjen)) deler.push(`${Math.round(igjen)} min igjen`);
      if ((jobber || pause) && !isNaN(batt) && !isNaN(frem)) deler.push(`batteri ${Math.round(batt)} %`);
      if (!klipper && (jobber || pause) && r && r.attributes.cleaned_area) deler.push(`${Math.round(r.attributes.cleaned_area)} m²`);
      if (!klipper && jobber && r && r.attributes.fan_speed) deler.push(String(r.attributes.fan_speed));
      $(".sub").textContent = deler.filter(Boolean).join("  ·  ");
      kort.setAttribute("aria-label", `${$(".n").textContent}: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
  }

  if (!customElements.get("ki-robot-card")) customElements.define("ki-robot-card", KiRobotCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-robot-card"))
    window.customCards.push({ type: "ki-robot-card", name: "KI Robot", description: "Animert robotklipper eller robotstøvsuger som kjører i baner", preview: true });
})();

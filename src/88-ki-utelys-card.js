/* ki-utelys-card – animert utelys-kort i samme stil som de andre ki-kortene.
 *
 *  Scenen viser et hus under himmelen:
 *   – himmelen skifter farge etter solhøyden (dag, gyllen time, skumring, natt med stjerner og måne)
 *   – sola står der den faktisk er: asimut gir plassering øst–vest, solhøyde gir høyde over horisonten
 *   – utelyset ved døra og hagelykta tennes og kaster lys når lyset er på
 *
 *  Fungerer i alle Home Assistant-installasjoner:
 *   – solen leses fra sun.sun (finnes alltid). Sol-sensorene (sensor.sun_*) brukes hvis de er slått på.
 *   – KI Utelys-entitetene (status, neste på/av, automatikk) finnes automatisk hvis integrasjonen er installert.
 *     Uten den viser kortet solnedgang/soloppgang i stedet.
 *   – alt kan overstyres i den visuelle editoren.
 *
 *  type: custom:ki-utelys-card
 *  lys: light.ute_lys                 # én lampe eller en liste; «på» hvis én av dem er på
 *  navn: Utelys
 *  tap_action: { action: navigate, navigation_path: "#lys" }
 */
(() => {
  // standardverdier fra den opprinnelige installasjonen – brukes bare hvis de finnes
  const REFERANSE = {
    lys: "light.ute_lys",
    status: "sensor.ki_utelys_status",
    auto: "switch.ki_utelys_auto",
    neste_paa: "sensor.ki_utelys_neste_paa",
    neste_av: "sensor.ki_utelys_neste_av",
  };
  // KI Utelys: objekt-id-er som slutter slik (plattform som inneholder «utelys»)
  const KI_MONSTER = { status: /_status$/, auto: /_(auto|automatikk)$/, neste_paa: /_neste_(paa|på|on)$/, neste_av: /_neste_(av|off)$/ };
  // sol: sensor hvis den finnes, ellers attributt på sun.sun
  const SOL = {
    hoyde: ["sensor.sun_solar_elevation", "elevation"],
    asimut: ["sensor.sun_solar_azimuth", "azimuth"],
    solnedgang: ["sensor.sun_next_setting", "next_setting"],
    soloppgang: ["sensor.sun_next_rising", "next_rising"],
  };

  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const blend = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const tidDel = (verdi) => {
    if (DAARLIG.includes(verdi)) return null;
    const d = new Date(verdi);
    if (isNaN(d)) return { dag: "", kl: String(verdi) };
    const n = new Date(), m = new Date(n); m.setDate(n.getDate() + 1);
    const kl = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === n.toDateString()) return { dag: "", kl };
    if (d.toDateString() === m.toDateString()) return { dag: "i morgen", kl };
    return { dag: d.toLocaleDateString("nb-NO", { weekday: "long" }), kl };
  };
  const HIMMEL = [
    [-18, "#070a16", "#10162b"], [-8, "#0d1330", "#1c2346"], [-3, "#2a2552", "#6b3f5e"],
    [2, "#35406e", "#b8664a"], [8, "#2f5a88", "#c99a6a"], [20, "#285b8f", "#6e9ccc"], [60, "#23578e", "#5e93c8"],
  ];
  const himmel = (e) => {
    if (isNaN(e)) e = 10;
    for (let i = 0; i < HIMMEL.length - 1; i++) {
      const [a, t1, b1] = HIMMEL[i], [b, t2, b2] = HIMMEL[i + 1];
      if (e <= b) { const t = klem((e - a) / (b - a), 0, 1); return [blend(t1, t2, t), blend(b1, b2, t)]; }
    }
    return [HIMMEL.at(-1)[1], HIMMEL.at(-1)[2]];
  };

  const STIL = `
    :host { display:block; }
    /* clip-path gir rene, runde hjørner også i Safari/iOS, der animerte lag ellers kan «stikke ut» av border-radius */
    .uk { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eef3f8;
      clip-path:inset(0 round var(--ha-card-border-radius,24px)); -webkit-mask-image:-webkit-radial-gradient(white, black);
      background:linear-gradient(180deg, var(--h1,#23578e) 0%, var(--h2,#5e93c8) 76.7%, var(--h2,#5e93c8) 100%);
      -webkit-tap-highlight-color:transparent; outline:none; transition:transform .15s cubic-bezier(.3,1.4,.5,1); }
    .uk:active { transform:scale(.985); }
    .uk:focus-visible { box-shadow:inset 0 0 0 2px var(--active-big,#f5c542); }
    .lag { position:absolute; inset:0; pointer-events:none; }
    .stjerner { z-index:0; } .scene { z-index:1; }
    .scene svg, .stjerner svg { width:100%; height:100%; display:block; }
    /* bakken går i full bredde, uansett hvor bredt kortet er */
    .bakke { position:absolute; left:0; right:0; bottom:0; height:23.4%; z-index:0; background:#0d1a12; border-top:1px solid rgba(255,255,255,.12); }
    .skygge { position:absolute; inset:0; z-index:2; pointer-events:none;
      background:linear-gradient(90deg, rgba(8,10,20,.72) 0%, rgba(8,10,20,.35) 42%, transparent 64%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:3; max-width:48%; min-width:0; }
    .n { font-size:14px; opacity:.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(238,243,248,.14); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; }
    .uk.paa .pille { background:rgba(255,196,90,.32); } .uk.manuell .pille { background:rgba(255,138,61,.34); }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-right:6px; opacity:.8; }
    .sub { font-size:13px; opacity:.72; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .stjerner circle { fill:#fff; opacity:0; transition:opacity 2s; }
    .uk.natt .stjerner circle { opacity:var(--o,.7); animation:blunk var(--t,3s) ease-in-out infinite; }
    @keyframes blunk { 0%,100% { opacity:var(--o,.7); } 50% { opacity:.15; } }
    .solbue { fill:none; stroke:rgba(255,255,255,.18); stroke-width:1; stroke-dasharray:2 4; }
    .sol { transition:transform 2s cubic-bezier(.3,.8,.3,1), opacity 1.5s; }
    .solkjerne { fill:#ffd66b; filter:drop-shadow(0 0 6px rgba(255,210,110,.9)); }
    .solstraler { transform-box:fill-box; transform-origin:center; animation:snurr 40s linear infinite; }
    .solstraler line { stroke:#ffd66b; stroke-width:1.2; stroke-linecap:round; opacity:.6; }
    @keyframes snurr { to { transform:rotate(360deg); } }
    .mane { fill:#e8ecf5; opacity:0; transition:opacity 2s; filter:drop-shadow(0 0 5px rgba(220,230,255,.6)); }
    .uk.natt .mane { opacity:.9; }
    .tre { fill:#0a140e; } .hus { fill:#161b24; } .tak { fill:#1d2330; }
    .vindu { fill:#ffcf7a; opacity:0; transition:opacity 1.5s; } .uk.kveld .vindu { opacity:.55; }
    .lampe { fill:#3a4250; transition:fill .8s; }
    .uk.paa .lampe { fill:#ffe39a; filter:drop-shadow(0 0 4px rgba(255,220,130,1)); }
    .lyskjegle { fill:url(#kjegle); opacity:0; transition:opacity 1.2s; }
    .uk.paa .lyskjegle { opacity:1; animation:flakk 5s ease-in-out infinite; }
    @keyframes flakk { 0%,100% { opacity:1; } 46% { opacity:.92; } 50% { opacity:.97; } }
    .lysflekk { fill:url(#flekk); opacity:0; transition:opacity 1.2s; } .uk.paa .lysflekk { opacity:1; }
    .moll { fill:#ffe9b0; opacity:0; } .uk.paa .moll { animation:moll 4s ease-in-out infinite; }
    .uk.paa .m2 { animation-delay:1.3s; } .uk.paa .m3 { animation-delay:2.6s; }
    @keyframes moll { 0% { opacity:0; transform:translate(0,0); } 30% { opacity:.9; } 100% { opacity:0; transform:translate(4px,-6px); } }
    @media (prefers-reduced-motion: reduce) { .uk * { animation:none !important; } }
  `;

  const STJERNER = `<svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => {
    const tilf = (n) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };   // fast «tilfeldig» mønster
    const x = tilf(i) * 390 + 5, y = tilf(i + 100) * 112 + 6, r = (i % 3) * 0.3 + 0.5;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="--o:${(0.4 + (i % 4) * 0.15).toFixed(2)};--t:${(2 + (i % 5) * 0.7).toFixed(1)}s;animation-delay:-${(i * 0.37).toFixed(1)}s"/>`;
  }).join("")}</svg>`;

  // Scenen ligger alltid høyrejustert i full høyde (viewBox 220×180, horisont på y=138 = 76,7 %),
  // så den møter bakken nøyaktig og aldri beskjæres, uansett kortbredde.
  const SCENE = `<svg viewBox="100 0 220 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <defs>
      <radialGradient id="kjegle" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
      <radialGradient id="flekk"><stop offset="0" stop-color="#ffe39a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="solbue" d="M100 138 Q205 26 310 138"/>
    <path class="mane" d="M204 52 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z"/>
    <g class="sol"><g class="solstraler">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-10" x2="0" y2="-13" transform="rotate(${a})"/>`).join("")}</g><circle class="solkjerne" r="7"/></g>
    <path class="tre" d="M296 138 l7 -24 l7 24z M302 138 l5 -16 l5 16z"/>
    <path class="tre" d="M150 138 l6 -20 l6 20z M157 138 l4 -13 l4 13z"/>
    <path class="tak" d="M240 106 L267 86 L294 106 Z"/>
    <rect class="hus" x="245" y="104" width="44" height="34"/>
    <rect class="vindu" x="250" y="112" width="9" height="8" rx="1"/><rect class="vindu" x="276" y="112" width="9" height="8" rx="1"/>
    <rect x="262" y="120" width="10" height="18" rx="1.5" fill="#0e1218"/>
    <path class="lyskjegle" d="M275 118 L287 138 L263 138 Z"/>
    <ellipse class="lysflekk" cx="275" cy="140" rx="14" ry="2.5"/>
    <rect class="lampe" x="273.3" y="114.5" width="3.4" height="4.5" rx="1"/>
    <line x1="222" y1="138" x2="222" y2="116" stroke="#2a303b" stroke-width="1.6"/>
    <path class="lyskjegle" d="M222 118 L234 138 L210 138 Z"/>
    <ellipse class="lysflekk" cx="222" cy="140" rx="14" ry="2.5"/>
    <circle class="lampe" cx="222" cy="115" r="2.8"/>
    <circle class="moll" cx="224" cy="112" r=".8"/><circle class="moll m2" cx="219" cy="110" r=".7"/><circle class="moll m3" cx="277" cy="111" r=".7"/>
  </svg>`;

  class KiUtelysCard extends HTMLElement {
    static getStubConfig(hass) {
      // velg en utelampe automatisk i forhåndsvisningen
      const lys = Object.keys((hass && hass.states) || {}).find((id) => /^light\..*(ute|outdoor|veranda|terrasse|hage|garden|porch)/.test(id));
      return lys ? { lys } : {};
    }
    static getConfigForm() {
      return {
        schema: [
          { name: "navn", selector: { text: {} } },
          { name: "lys", selector: { entity: { domain: "light", multiple: true } } },
          { type: "expandable", name: "", title: "KI Utelys (finnes automatisk)", schema: [
            { name: "status", selector: { entity: { domain: "sensor" } } },
            { name: "auto", selector: { entity: { domain: ["switch", "input_boolean"] } } },
            { name: "neste_paa", selector: { entity: { domain: "sensor" } } },
            { name: "neste_av", selector: { entity: { domain: "sensor" } } },
          ] },
          { type: "expandable", name: "", title: "Sol (bruker sun.sun hvis tomt)", schema: [
            { name: "hoyde", selector: { entity: { domain: "sensor" } } },
            { name: "asimut", selector: { entity: { domain: "sensor" } } },
            { name: "solnedgang", selector: { entity: { domain: "sensor" } } },
            { name: "soloppgang", selector: { entity: { domain: "sensor" } } },
          ] },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", lys: "Utelys (én eller flere lamper)", status: "Status", auto: "Automatikk", neste_paa: "Tennes neste gang",
          neste_av: "Slukkes neste gang", hoyde: "Solhøyde", asimut: "Sol-asimut", solnedgang: "Neste solnedgang", soloppgang: "Neste soloppgang", tap_action: "Trykk" }[s.name] || s.name),
      };
    }
    setConfig(c) { this._c = { navn: "Utelys", ...(c || {}) }; this._r = null; this._bygget = false; if (this._hass) this._oppdater(); }
    set hass(h) {
      this._hass = h; if (!this._c) return;
      if (!this._r || Object.keys(h.entities || {}).length !== this._antall) this._los();
      const n = this._ids.map((id) => h.states[id]);
      if (this._bygget && this._siste && n.every((s, i) => s === this._siste[i])) return;
      this._siste = n; this._oppdater();
    }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }

    /** finn entitetene: konfig > KI Utelys-integrasjonen > opprinnelige standardnavn > ingenting */
    _los() {
      const h = this._hass, c = this._c, E = h.entities || {}, finnes = (id) => id && h.states[id];
      this._antall = Object.keys(E).length;
      const ki = Object.values(E).filter((e) => /utelys|outdoor_light/i.test(e.platform || ""));
      const r = {};
      for (const k of ["status", "auto", "neste_paa", "neste_av"]) {
        const funnet = ki.find((e) => KI_MONSTER[k].test(e.entity_id) || (e.translation_key && KI_MONSTER[k].test("_" + e.translation_key)));
        r[k] = finnes(c[k]) ? c[k] : funnet ? funnet.entity_id : finnes(REFERANSE[k]) ? REFERANSE[k] : null;
      }
      let lys = [].concat(c.lys || []).filter(finnes);
      if (!lys.length && finnes(REFERANSE.lys)) lys = [REFERANSE.lys];
      r.lys = lys;
      for (const [k, [sensor]] of Object.entries(SOL)) r[k] = finnes(c[k]) ? c[k] : finnes(sensor) ? sensor : null;
      this._r = r;
      this._ids = [...r.lys, r.status, r.auto, r.neste_paa, r.neste_av, r.hoyde, r.asimut, r.solnedgang, r.soloppgang, "sun.sun"].filter(Boolean);
    }
    _sol(k) {
      const id = this._r[k], s = id && this._hass.states[id];
      if (ok(s)) return s.state;
      const sun = this._hass.states["sun.sun"];
      return sun ? sun.attributes[SOL[k][1]] : undefined;
    }
    _trykk() {
      const a = this._c.tap_action || { action: "more-info" }, mal = this._r.lys[0] || this._r.status || "sun.sun";
      if (a.action === "none") return;
      if (a.action === "navigate" && a.navigation_path) { history.pushState(null, "", a.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); }
      else if (a.action === "more-info") this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: a.entity || mal }, bubbles: true, composed: true }));
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: mal }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="uk" role="button" tabindex="0">
        <div class="lag stjerner">${STJERNER}</div><div class="bakke"></div><div class="lag scene">${SCENE}</div><div class="skygge"></div>
        <div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
        <div class="stor"></div><div class="sub"></div></div></div>`;
      const k = this.shadowRoot.querySelector(".uk");
      k.addEventListener("click", () => this._trykk());
      k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }
    _oppdater() {
      if (!this._bygget) this._bygg();
      if (!this._r) this._los();
      const c = this._c, r = this._r, h = this._hass, s = (id) => (id ? h.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".uk");
      const e = parseFloat(this._sol("hoyde")), az = parseFloat(this._sol("asimut"));
      const paa = r.lys.some((id) => s(id) && s(id).state === "on");
      const auto = s(r.auto), autoPaa = !auto || auto.state === "on";

      const [topp, bunn] = himmel(e);
      kort.style.setProperty("--h1", topp); kort.style.setProperty("--h2", bunn);
      kort.classList.toggle("natt", !isNaN(e) && e < -6);
      kort.classList.toggle("kveld", isNaN(e) || e < 4);
      kort.classList.toggle("paa", paa);
      kort.classList.toggle("manuell", !!auto && !autoPaa);

      const t = isNaN(az) ? 0.5 : klem((az - 45) / 270, 0, 1);
      const x = 100 + t * 210;
      const yBue = (1 - t) * (1 - t) * 138 + 2 * (1 - t) * t * 26 + t * t * 138;
      const y = isNaN(e) ? yBue : klem(138 - (e / 55) * 100, 40, 170);
      $(".sol").style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      $(".sol").style.opacity = isNaN(e) || e > -2 ? 1 : 0;

      $(".n").textContent = c.navn;
      const st = s(r.status);
      let pt = ok(st) ? String(st.state) : paa ? "På" : "Av";
      pt = pt.replace(/^./, (x) => x.toUpperCase());
      if (auto && !autoPaa) pt = "Manuell · " + (paa ? "på" : "av");
      $(".pille ha-icon").setAttribute("icon", paa ? "mdi:outdoor-lamp" : auto && !autoPaa ? "mdi:hand-back-right-outline" : "mdi:weather-sunset");
      $(".pt").textContent = pt;

      const ned = tidDel(this._sol("solnedgang")), opp = tidDel(this._sol("soloppgang"));
      const nesteAv = tidDel(s(r.neste_av) && s(r.neste_av).state), nestePaa = tidDel(s(r.neste_paa) && s(r.neste_paa).state);
      const vis = (ord, t) => `<small>${ord}${t.dag ? " " + t.dag : ""}</small>${t.kl}`;
      if (paa && nesteAv) $(".stor").innerHTML = vis("slukkes", nesteAv);
      else if (!paa && nestePaa) $(".stor").innerHTML = vis("tennes", nestePaa);
      else if (!r.neste_paa && !r.neste_av) {
        // uten KI Utelys: vis neste solnedgang eller soloppgang
        const dag = !isNaN(e) && e > 0;
        const t2 = dag ? ned : opp;
        $(".stor").innerHTML = t2 ? vis(dag ? "sol ned" : "sol opp", t2) : paa ? "På" : "Av";
      } else $(".stor").innerHTML = paa ? "På" : "Av";
      const deler = [];
      if (!isNaN(e) && e > 0) { if (ned) deler.push(`Sol ned ${ned.kl}`); if (opp) deler.push(`opp ${opp.kl}`); }
      else { if (opp) deler.push(`Sol opp ${opp.kl}`); if (ned) deler.push(`ned ${ned.kl}`); }
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
  }

  if (!customElements.get("ki-utelys-card")) customElements.define("ki-utelys-card", KiUtelysCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-utelys-card"))
    window.customCards.push({ type: "ki-utelys-card", name: "KI Utelys", description: "Animert himmel med sol, stjerner og utelys som tennes. Bruker sun.sun og finner KI Utelys selv.", preview: true });
})();

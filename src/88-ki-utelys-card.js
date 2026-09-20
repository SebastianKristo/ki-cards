/* ki-utelys-card – animert utelys-kort i samme stil som de andre ki-kortene.
 *
 *  Scenen viser huset ditt under himmelen:
 *   – himmelen skifter farge etter solhøyden (dag, gyllen time, skumring, natt med stjerner)
 *   – sola står der den faktisk er: asimut gir plassering øst–vest, solhøyde gir høyde over horisonten
 *   – solbanen er tegnet som en stiplet bue, med horisonten som skille
 *   – utelyset ved inngangen og på verandaen tennes og kaster lys når lyset er på
 *   – vinduene i huset lyser svakt om kvelden
 *  Til venstre: status fra KI Utelys, neste gang lyset tennes eller slukkes, og sol ned/opp.
 *
 *  type: custom:ki-utelys-card            # alle entiteter under er standard og kan utelates
 *  lys: light.ute_lys
 *  tap_action: { action: navigate, navigation_path: "#lys" }
 */
(() => {
  const STANDARD = {
    navn: "Utelys",
    lys: "light.ute_lys",
    status: "sensor.ki_utelys_status",
    auto: "switch.ki_utelys_auto",
    neste_paa: "sensor.ki_utelys_neste_paa",
    neste_av: "sensor.ki_utelys_neste_av",
    hoyde: "sensor.sun_solar_elevation",
    asimut: "sensor.sun_solar_azimuth",
    solnedgang: "sensor.sun_next_setting",
    soloppgang: "sensor.sun_next_rising",
    skumring: "sensor.sun_next_dusk",
    graalysning: "sensor.sun_next_dawn",
  };
  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const tall = (s) => { if (!ok(s)) return NaN; const v = parseFloat(String(s.state).replace(",", ".")); return isNaN(v) ? NaN : v; };
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const blend = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  /** «16:42», «i morgen 08:31» eller rå tekst */
  const tidDel = (s) => {
    if (!ok(s)) return null;
    const d = new Date(s.state);
    if (isNaN(d)) return { dag: "", kl: String(s.state) };
    const n = new Date(), imorgen = new Date(n); imorgen.setDate(n.getDate() + 1);
    const kl = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === n.toDateString()) return { dag: "", kl };
    if (d.toDateString() === imorgen.toDateString()) return { dag: "i morgen", kl };
    return { dag: d.toLocaleDateString("nb-NO", { weekday: "long" }), kl };
  };
  const tid = (s) => { const t = tidDel(s); return t ? t.kl : ""; };
  // himmelfarger: [topp, bunn] ved en gitt solhøyde (dempet for mørkt tema)
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
    .uk { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eef3f8;
      -webkit-tap-highlight-color:transparent; outline:none; transition:transform .15s cubic-bezier(.3,1.4,.5,1), background 2s; }
    .uk:active { transform:scale(.985); }
    .uk:focus-visible { box-shadow:0 0 0 2px var(--active-big,#f5c542); }
    .skygge { position:absolute; inset:0; z-index:0; pointer-events:none;
      background:linear-gradient(90deg, rgba(8,10,20,.72) 0%, rgba(8,10,20,.35) 40%, transparent 62%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:46%; min-width:0; }
    .n { font-size:14px; opacity:.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(238,243,248,.14); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; backdrop-filter:blur(4px); }
    .uk.paa .pille { background:rgba(255,196,90,.32); }
    .uk.manuell .pille { background:rgba(255,138,61,.34); }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-right:6px; opacity:.8; }
    .sub { font-size:13px; opacity:.7; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .scene { position:absolute; inset:0; z-index:-1; }
    .scene svg { width:100%; height:100%; display:block; }

    .stjerner circle { fill:#fff; opacity:0; transition:opacity 2s; }
    .uk.natt .stjerner circle { opacity:var(--o,.7); animation:blunk var(--t,3s) ease-in-out infinite; }
    @keyframes blunk { 0%,100% { opacity:var(--o,.7); } 50% { opacity:.15; } }
    .solbue { fill:none; stroke:rgba(255,255,255,.18); stroke-width:1; stroke-dasharray:2 4; }
    .sol { transition:transform 2s cubic-bezier(.3,.8,.3,1); }
    .solkjerne { fill:#ffd66b; filter:drop-shadow(0 0 6px rgba(255,210,110,.9)); }
    .solstraler { transform-box:fill-box; transform-origin:center; animation:snurr 40s linear infinite; }
    .solstraler line { stroke:#ffd66b; stroke-width:1.2; stroke-linecap:round; opacity:.6; }
    @keyframes snurr { to { transform:rotate(360deg); } }
    .mane { fill:#e8ecf5; opacity:0; transition:opacity 2s; filter:drop-shadow(0 0 5px rgba(220,230,255,.6)); }
    .uk.natt .mane { opacity:.9; }
    .bakke { fill:#0d1a12; } .horisont { stroke:rgba(255,255,255,.12); stroke-width:1; }
    .tre { fill:#0a140e; }
    .hus { fill:#161b24; } .tak { fill:#1d2330; }
    .vindu { fill:#ffcf7a; opacity:0; transition:opacity 1.5s; }
    .uk.kveld .vindu { opacity:.55; }
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

  const STJERNER = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 97) % 300 + 5, y = (i * 53) % 70 + 6, r = (i % 3) * 0.3 + 0.5;
    return `<circle cx="${x}" cy="${y}" r="${r}" style="--o:${(0.4 + (i % 4) * 0.15).toFixed(2)};--t:${(2 + (i % 5) * 0.7).toFixed(1)}s;animation-delay:-${(i * 0.37).toFixed(1)}s"/>`;
  }).join("");

  // viewBox 320×180. Horisont på y=138. Solbuen spenner x 150–310.
  const SVG = `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop class="h1" offset="0"/><stop class="h2" offset="1"/></linearGradient>
      <radialGradient id="kjegle" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
      <radialGradient id="flekk"><stop offset="0" stop-color="#ffe39a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="320" height="180" fill="url(#himmel)"/>
    <g class="stjerner">${STJERNER}</g>
    <path class="solbue" d="M100 138 Q205 26 310 138"/>
    <path class="mane" d="M204 52 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z"/>
    <g class="sol"><g class="solstraler">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-10" x2="0" y2="-13" transform="rotate(${a})"/>`).join("")}</g><circle class="solkjerne" r="7"/></g>
    <!-- bakke og trær -->
    <rect class="bakke" x="0" y="138" width="320" height="42"/>
    <line class="horisont" x1="0" y1="138" x2="320" y2="138"/>
    <path class="tre" d="M304 138 l7 -24 l7 24z M310 138 l5 -16 l5 16z"/>
    <path class="tre" d="M150 138 l6 -20 l6 20z M157 138 l4 -13 l4 13z"/>
    <!-- huset -->
    <path class="tak" d="M246 106 L273 86 L300 106 Z"/>
    <rect class="hus" x="251" y="104" width="44" height="34"/>
    <rect class="vindu" x="256" y="112" width="9" height="8" rx="1"/><rect class="vindu" x="282" y="112" width="9" height="8" rx="1"/>
    <rect x="268" y="120" width="10" height="18" rx="1.5" fill="#0e1218"/>
    <!-- utelys ved døra og på stolpen i hagen -->
    <path class="lyskjegle" d="M281 118 L293 138 L269 138 Z"/>
    <ellipse class="lysflekk" cx="281" cy="141" rx="14" ry="3.5"/>
    <rect class="lampe" x="279.3" y="114.5" width="3.4" height="4.5" rx="1"/>
    <line x1="226" y1="138" x2="226" y2="116" stroke="#2a303b" stroke-width="1.6"/>
    <path class="lyskjegle" d="M226 118 L238 138 L214 138 Z"/>
    <ellipse class="lysflekk" cx="226" cy="141" rx="14" ry="3.5"/>
    <circle class="lampe" cx="226" cy="115" r="2.8"/>
    <circle class="moll" cx="228" cy="112" r=".8"/><circle class="moll m2" cx="223" cy="110" r=".7"/><circle class="moll m3" cx="283" cy="111" r=".7"/>
  </svg>`;

  class KiUtelysCard extends HTMLElement {
    static getStubConfig() { return {}; }
    static getConfigForm() {
      return {
        schema: [
          { name: "navn", selector: { text: {} } },
          { name: "lys", selector: { entity: { domain: "light" } } },
          { name: "status", selector: { entity: { domain: "sensor" } } },
          { name: "auto", selector: { entity: { domain: "switch" } } },
          { name: "neste_paa", selector: { entity: { domain: "sensor" } } },
          { name: "neste_av", selector: { entity: { domain: "sensor" } } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", lys: "Utelys", status: "Status (KI Utelys)", auto: "Automatikk", neste_paa: "Neste på", neste_av: "Neste av", tap_action: "Trykk" }[s.name] || s.name),
      };
    }
    setConfig(c) { this._c = { ...STANDARD, ...(c || {}) }; this._bygget = false; if (this._hass) this._oppdater(); }
    set hass(h) {
      this._hass = h; if (!this._c) return;
      const ids = Object.values(this._c).filter((v) => typeof v === "string" && v.includes("."));
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
      else if (a.action === "more-info") this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: a.entity || this._c.lys }, bubbles: true, composed: true }));
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: this._c.lys }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="uk" role="button" tabindex="0">
        <div class="scene">${SVG}</div><div class="skygge"></div>
        <div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
        <div class="stor"></div><div class="sub"></div></div></div>`;
      const k = this.shadowRoot.querySelector(".uk");
      k.addEventListener("click", () => this._trykk());
      k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }
    _oppdater() {
      if (!this._bygget) this._bygg();
      const c = this._c, s = (id) => (id ? this._hass.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".uk");
      const e = tall(s(c.hoyde)), az = tall(s(c.asimut));
      const lys = s(c.lys), paa = !!lys && lys.state === "on";
      const auto = s(c.auto), autoPaa = !auto || auto.state === "on";

      // himmel og klasser
      const [topp, bunn] = himmel(e);
      $(".h1").setAttribute("stop-color", topp); $(".h2").setAttribute("stop-color", bunn);
      kort.classList.toggle("natt", !isNaN(e) && e < -6);
      kort.classList.toggle("kveld", isNaN(e) || e < 4);
      kort.classList.toggle("paa", paa);
      kort.classList.toggle("manuell", !autoPaa);

      // sola: asimut 45–315 → x 100–310 langs buen, høyden fra solhøyden
      const t = isNaN(az) ? 0.5 : klem((az - 45) / 270, 0, 1);
      const x = 100 + t * 210;
      const yBue = (1 - t) * (1 - t) * 138 + 2 * (1 - t) * t * 26 + t * t * 138;   // punkt på buen
      const y = isNaN(e) ? yBue : klem(138 - (e / 55) * 100, 40, 170);
      $(".sol").style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      $(".sol").style.opacity = isNaN(e) || e > -2 ? 1 : 0;

      // tekst
      $(".n").textContent = c.navn;
      const st = s(c.status);
      let pt = ok(st) ? String(st.state) : paa ? "På" : "Av";
      pt = pt.replace(/^./, (x) => x.toUpperCase());
      if (!autoPaa) pt = "Manuell · " + (paa ? "på" : "av");
      $(".pille ha-icon").setAttribute("icon", paa ? "mdi:outdoor-lamp" : autoPaa ? "mdi:weather-sunset" : "mdi:hand-back-right-outline");
      $(".pt").textContent = pt;
      const nesteAv = tidDel(s(c.neste_av)), nestePaa = tidDel(s(c.neste_paa));
      const vis = (ord, t) => `<small>${ord}${t.dag ? " " + t.dag : ""}</small>${t.kl}`;
      if (paa && nesteAv) $(".stor").innerHTML = vis("slukkes", nesteAv);
      else if (!paa && nestePaa) $(".stor").innerHTML = vis("tennes", nestePaa);
      else $(".stor").innerHTML = paa ? "På" : "Av";
      const ned = tid(s(c.solnedgang)), opp = tid(s(c.soloppgang));
      const deler = [];
      if (!isNaN(e) && e > 0) { if (ned) deler.push(`Sol ned ${ned}`); if (opp) deler.push(`opp ${opp}`); }
      else { if (opp) deler.push(`Sol opp ${opp}`); if (ned) deler.push(`ned ${ned}`); }
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
  }

  if (!customElements.get("ki-utelys-card")) customElements.define("ki-utelys-card", KiUtelysCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-utelys-card"))
    window.customCards.push({ type: "ki-utelys-card", name: "KI Utelys", description: "Animert himmel med sol, stjerner og utelys som tennes", preview: true });
})();

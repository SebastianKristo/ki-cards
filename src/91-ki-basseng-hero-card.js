/* ki-basseng-hero-card – animert bassengkort i samme stil som de andre ki-kortene.
 *
 *  Scenen viser bassenget fra siden:
 *   – vannflaten bølger, og farge og høyde følger vanntemperaturen
 *   – bobler stiger når sirkulasjonspumpa går
 *   – varmepumpa til høyre snurrer og blåser varme bølger når den varmer, saktere i stillemodus
 *   – damp stiger fra vannet når det varmes
 *   – bassenglyset lyser opp vannet nedenfra
 *   – står varmepumpa i auto, blinker et gult varsel (den kan kjøle i auto)
 *
 *  type: custom:ki-basseng-hero-card
 *  varmepumpe: climate.basseng_bassengvarmepumpe
 *  pumpe: switch.bassengpumpe
 *  lys: light.bassenglys
 *  stillemodus: switch.baseng_basengvarmepumpe_stillemodus
 *  ute: sensor.outdoor_meter_temperature     # valgfritt
 *  tap_action: { action: navigate, navigation_path: "#badebasseng" }
 */
(() => {
  const STANDARD = {
    navn: "Bassenget",
    varmepumpe: "climate.basseng_bassengvarmepumpe",
    pumpe: "switch.bassengpumpe",
    lys: "light.bassenglys",
    stillemodus: "switch.baseng_basengvarmepumpe_stillemodus",
    stikkontakt: "switch.baseng_stikkontakt",
    vanntemp: null,          // egen temperatursensor, ellers current_temperature fra varmepumpa
    ute: "sensor.outdoor_meter_temperature",
    kald: 18, varm: 30,      // skala for vannfargen
  };
  const DAARLIG = ["unavailable", "unknown", "", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const komma = (v, d = 0) => (isNaN(v) || v === null ? "--" : v.toFixed(d).replace(".", ","));
  const blend = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };

  const STIL = `
    :host { display:block; }
    .bk { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eaf4f8;
      clip-path:inset(0 round var(--ha-card-border-radius,24px));
      background:linear-gradient(165deg,#0f1a20 0%,#13222a 55%,#152833 100%);
      -webkit-tap-highlight-color:transparent; outline:none; transition:transform .15s cubic-bezier(.3,1.4,.5,1); }
    .bk:active { transform:scale(.985); }
    .bk:focus-visible { box-shadow:inset 0 0 0 2px var(--active-big,#f5c542); }
    .glod { position:absolute; inset:0; z-index:-1; opacity:0; transition:opacity 1.4s;
      background:radial-gradient(70% 90% at 78% 95%, rgba(255,110,70,.28) 0%, transparent 62%); }
    .bk.varmer .glod { opacity:1; }
    .bk.auto .glod { opacity:1; background:radial-gradient(70% 90% at 78% 95%, rgba(255,179,74,.3) 0%, transparent 62%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:46%; min-width:0; }
    .n { font-size:14px; opacity:.72; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(234,244,248,.14); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; }
    .bk.varmer .pille { background:rgba(255,110,70,.3); }
    .bk.auto .pille { background:rgba(255,179,74,.34); animation:rist 4s ease-in-out infinite; }
    @keyframes rist { 0%,90%,100% { transform:none; } 92% { transform:translateX(-2px); } 94% { transform:translateX(2px); } 96% { transform:translateX(-1px); } }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-left:2px; opacity:.85; }
    .sub { font-size:13px; opacity:.65; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .scene { position:absolute; right:0; bottom:0; width:60%; max-width:320px; height:100%; }
    .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }

    .dekke { fill:#1b2830; } .kant { fill:#243440; } .flis { fill:#1f2f3a; }
    .vann { transition:fill 1.5s; }
    .bolge { animation:skvulp 5s ease-in-out infinite; }
    .b2 { animation:skvulp 7s ease-in-out infinite reverse; opacity:.6; }
    @keyframes skvulp { 0%,100% { transform:translateX(0); } 50% { transform:translateX(-14px); } }
    .glimt { fill:#ffffff; opacity:.12; animation:glimt 6s ease-in-out infinite; }
    @keyframes glimt { 0%,100% { opacity:.06; } 50% { opacity:.18; } }
    .boble { fill:#cfeeff; opacity:0; }
    .bk.pumpe .boble { animation:boble 3.4s ease-in infinite; }
    .bk.pumpe .bo2 { animation-delay:.9s; } .bk.pumpe .bo3 { animation-delay:1.7s; } .bk.pumpe .bo4 { animation-delay:2.5s; }
    @keyframes boble { 0% { opacity:0; transform:translateY(0) scale(.6); } 20% { opacity:.75; } 100% { opacity:0; transform:translateY(-30px) scale(1.1); } }
    .damp { fill:none; stroke:#ffd9c2; stroke-width:1.4; stroke-linecap:round; opacity:0; transform-box:fill-box; }
    .bk.varmer .damp { animation:damp 3.6s ease-out infinite; }
    .bk.varmer .d2 { animation-delay:1.2s; } .bk.varmer .d3 { animation-delay:2.4s; }
    @keyframes damp { 0% { opacity:0; transform:translateY(4px); } 30% { opacity:.55; } 100% { opacity:0; transform:translateY(-16px); } }
    .lysglod { fill:url(#lys); opacity:0; transition:opacity 1.2s; } .bk.lys .lysglod { opacity:1; animation:lyspust 6s ease-in-out infinite; }
    @keyframes lyspust { 0%,100% { opacity:.85; } 50% { opacity:1; } }
    .lampe { fill:#2a3b46; transition:fill .8s; } .bk.lys .lampe { fill:#ffe9a8; filter:drop-shadow(0 0 4px rgba(255,230,160,.9)); }
    .vp { fill:#233039; stroke:#33454f; stroke-width:1; }
    .rist { stroke:#33454f; stroke-width:1; }
    .vifte { transform-box:fill-box; transform-origin:center; animation:snurr var(--vifte,1.6s) linear infinite; animation-play-state:paused; }
    .bk.varmer .vifte { animation-play-state:running; }
    @keyframes snurr { to { transform:rotate(360deg); } }
    .varmebolge { fill:none; stroke:#ff9a6b; stroke-width:1.5; stroke-linecap:round; opacity:0; transform-box:fill-box; }
    .bk.varmer .varmebolge { animation:stig 2.6s ease-out infinite; }
    .bk.varmer .v2 { animation-delay:.9s; } .bk.varmer .v3 { animation-delay:1.8s; }
    @keyframes stig { 0% { opacity:0; transform:translateY(4px); } 30% { opacity:.8; } 100% { opacity:0; transform:translateY(-12px); } }
    .stillemerke { opacity:0; transition:opacity .6s; } .bk.stille .stillemerke { opacity:1; }
    .av .vp, .av .rist { opacity:.45; }
    @media (prefers-reduced-motion: reduce) { .bk * { animation:none !important; } }
    @media (max-width:380px) { .scene { width:56%; } .tekst { max-width:46%; } }
  `;

  // Bassenget sett fra siden. Vannflate på y=104, bunn på y=150, dekke på y=156.
  const SVG = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <defs>
      <linearGradient id="vanngrad" x1="0" y1="0" x2="0" y2="1"><stop class="v1" offset="0"/><stop class="v2" offset="1"/></linearGradient>
      <radialGradient id="lys" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
      <clipPath id="basseng"><rect x="28" y="96" width="132" height="58" rx="5"/></clipPath>
    </defs>
    <rect class="dekke" x="0" y="152" width="200" height="28"/>
    <rect class="kant" x="22" y="90" width="144" height="8" rx="3"/>
    <rect class="flis" x="28" y="96" width="132" height="58" rx="5"/>
    <g clip-path="url(#basseng)">
      <rect class="vann" x="28" y="102" width="132" height="52" fill="url(#vanngrad)"/>
      <path class="vann bolge" d="M14 103 q10-4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V152 H20z" fill="url(#vanngrad)"/>
      <path class="vann bolge b2" d="M14 105 q12-4 24 0 t24 0 t24 0 t24 0 t24 0 V152 H20z" fill="url(#vanngrad)"/>
      <ellipse class="lysglod" cx="58" cy="152" rx="40" ry="34"/>
      <rect class="glimt" x="56" y="110" width="30" height="1.6" rx=".8"/>
      <rect class="glimt" x="100" y="120" width="20" height="1.4" rx=".7" style="animation-delay:-2s"/>
      <circle class="boble" cx="132" cy="148" r="1.7"/><circle class="boble bo2" cx="138" cy="150" r="1.3"/>
      <circle class="boble bo3" cx="126" cy="149" r="1.1"/><circle class="boble bo4" cx="135" cy="146" r="1.5"/>
    </g>
    <rect class="lampe" x="38" y="132" width="6" height="4" rx="1.5"/>
    <!-- stige -->
    <path d="M34 90 q6 -12 12 0" fill="none" stroke="#8b9aa4" stroke-width="2" stroke-linecap="round"/>
    <!-- damp over vannet -->
    <path class="damp" d="M66 94 q2-3 0-6 q-2-3 0-6"/><path class="damp d2" d="M88 94 q2-3 0-6 q-2-3 0-6"/><path class="damp d3" d="M110 94 q2-3 0-6 q-2-3 0-6"/>
    <!-- varmepumpe -->
    <g class="enhet">
      <rect class="vp" x="166" y="102" width="32" height="50" rx="5"/>
      <circle cx="182" cy="121" r="12" fill="#16202880"/>
      <g class="vifte"><circle cx="182" cy="121" r="12" fill="none"/>
        <path d="M182 121 q-2-9 5-11 q1 6-5 11 M182 121 q9-2 11 5 q-6 1-11-5 M182 121 q2 9-5 11 q-1-6 5-11 M182 121 q-9 2-11-5 q6-1 11 5" fill="#93a4af"/>
        <circle cx="182" cy="121" r="2.4" fill="#16202880"/></g>
      <path class="rist" d="M170 138 h24 M170 142 h24 M170 146 h24"/>
      <g class="stillemerke" transform="translate(192 107)"><circle r="4.5" fill="#1b2830"/><path d="M-2 -1.4 h1.4 l1.6-1.6 v6 l-1.6-1.6 H-2z M1.4 -1.4 l2.6 2.8 M4 -1.4 l-2.6 2.8" stroke="#8fd0ff" stroke-width=".9" fill="none"/></g>
      <path class="varmebolge" d="M164 126 q-3-4 0-8"/><path class="varmebolge v2" d="M162 134 q-3-4 0-8"/><path class="varmebolge v3" d="M164 118 q-3-4 0-8"/>
    </g>
  </svg>`;

  class KiBassengHeroCard extends HTMLElement {
    static getStubConfig() { return {}; }
    static getConfigForm() {
      return {
        schema: [
          { name: "navn", selector: { text: {} } },
          { name: "varmepumpe", selector: { entity: { domain: "climate" } } },
          { name: "pumpe", selector: { entity: { domain: ["switch", "input_boolean"] } } },
          { name: "lys", selector: { entity: { domain: "light" } } },
          { name: "stillemodus", selector: { entity: { domain: "switch" } } },
          { name: "vanntemp", selector: { entity: { domain: "sensor" } } },
          { name: "ute", selector: { entity: { domain: "sensor" } } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", varmepumpe: "Varmepumpe", pumpe: "Sirkulasjonspumpe", lys: "Bassenglys", stillemodus: "Stillemodus",
          vanntemp: "Vanntemperatur (valgfritt)", ute: "Utetemperatur (valgfritt)", tap_action: "Trykk" }[s.name] || s.name),
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
      else if (a.action === "more-info") this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: a.entity || this._c.varmepumpe }, bubbles: true, composed: true }));
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: this._c.varmepumpe }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="bk" role="button" tabindex="0">
        <div class="glod"></div><div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
        <div class="stor"></div><div class="sub"></div></div><div class="scene">${SVG}</div></div>`;
      const k = this.shadowRoot.querySelector(".bk");
      k.addEventListener("click", () => this._trykk());
      k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }
    _oppdater() {
      if (!this._bygget) this._bygg();
      const c = this._c, s = (id) => (id ? this._hass.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".bk");
      const vp = s(c.varmepumpe), modus = ok(vp) ? String(vp.state) : "unavailable";
      const handling = vp ? String(vp.attributes.hvac_action || "") : "";
      const vann = c.vanntemp && ok(s(c.vanntemp)) ? parseFloat(s(c.vanntemp).state)
        : vp ? parseFloat(vp.attributes.current_temperature) : NaN;
      const mal = vp ? parseFloat(vp.attributes.temperature) : NaN;
      const ute = ok(s(c.ute)) ? parseFloat(s(c.ute).state) : NaN;
      const pumpe = s(c.pumpe) && s(c.pumpe).state === "on";
      const lys = s(c.lys) && s(c.lys).state === "on";
      const stille = s(c.stillemodus) && s(c.stillemodus).state === "on";
      const auto = modus === "auto";
      const av = modus === "off" || modus === "unavailable";
      // varmer: enten hvac_action sier det, eller den står i heat og vannet er under målet
      const varmer = !av && (/heat/.test(handling) || (modus === "heat" && (isNaN(mal) || isNaN(vann) || vann < mal)));

      kort.classList.toggle("varmer", !!varmer);
      kort.classList.toggle("auto", auto);
      kort.classList.toggle("pumpe", !!pumpe);
      kort.classList.toggle("lys", !!lys);
      kort.classList.toggle("stille", !!stille);
      kort.classList.toggle("av", av);
      $(".enhet").classList.toggle("av", av);
      kort.style.setProperty("--vifte", (stille ? 2.6 : 1.2) + "s");

      // vannfarge og -nivå etter temperaturen
      const t = isNaN(vann) ? 0.5 : klem((vann - c.kald) / (c.varm - c.kald), 0, 1);
      $(".v1").setAttribute("stop-color", blend("#2b6f9b", "#2fa8b8", t));
      $(".v2").setAttribute("stop-color", blend("#123a55", "#14707a", t));

      $(".n").textContent = c.navn;
      let pt, ik;
      if (modus === "unavailable") { pt = "Varmepumpa er borte"; ik = "mdi:wifi-off"; }
      else if (auto) { pt = "Står i auto"; ik = "mdi:alert-outline"; }
      else if (varmer) { pt = stille ? "Varmer · stillemodus" : "Varmer"; ik = "mdi:heat-wave"; }
      else if (modus === "heat") { pt = isNaN(mal) || isNaN(vann) ? "Klar" : "På måltemperatur"; ik = "mdi:check-circle"; }
      else if (pumpe) { pt = "Sirkulerer"; ik = "mdi:pump"; }
      else { pt = "Av"; ik = "mdi:power"; }
      $(".pille ha-icon").setAttribute("icon", ik); $(".pt").textContent = pt;
      $(".stor").innerHTML = isNaN(vann) ? "--" : `${komma(vann, 1)}<small>°C</small>`;
      const deler = [];
      if (!isNaN(mal)) deler.push(`mål ${Math.round(mal)}°`);
      deler.push(pumpe ? "pumpe på" : "pumpe av");
      if (!isNaN(ute)) deler.push(`ute ${komma(ute, 1)}°`);
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
  }

  if (!customElements.get("ki-basseng-hero-card")) customElements.define("ki-basseng-hero-card", KiBassengHeroCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-basseng-hero-card"))
    window.customCards.push({ type: "ki-basseng-hero-card", name: "KI Basseng (animert)", description: "Animert basseng med vann, bobler, varmepumpe og lys", preview: true });
})();

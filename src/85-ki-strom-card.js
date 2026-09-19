/* ki-strom-card – animert strømkort i samme stil som ki-varmepumpe-card, ki-homelab-card og ki-tesla-card.
 *
 *  Scenen viser huset koblet til en strømmast:
 *   – strømmen renner gjennom ledningene, fortere jo mer huset trekker
 *   – ledningene og gløden får farge etter spotprisen akkurat nå (lav, middels, høy)
 *   – vinduene lyser sterkere jo høyere forbruket er
 *   – huset blinker oransje når du nærmer deg neste effekttrinn
 *   – nederst ligger dagens spotpris time for time, med Norgespris som stiplet linje og «nå» markert
 *  Til venstre: forbruk nå, Norgespris, dagens kostnad og hvor langt det er til neste effekttrinn.
 *
 *  type: custom:ki-strom-card        # alle entiteter under er standard og kan utelates
 *  tap_action: { action: navigate, navigation_path: "#strom" }
 */
(() => {
  const STANDARD = {
    navn: "Strøm",
    effekt: "sensor.strommaler_effekt",
    norgespris: "sensor.norgespris_pris_na",
    spot: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",   // øre/kWh, attributter raw_today, min, max
    spot_i_ore: true,
    kostnad: "sensor.um_daily_cost_strommaler_norgespris",
    margin: "sensor.nettleie_elvia_margin_til_neste_trinn",
    terskel: "sensor.neste_effektledd_terskel",
    trinn: "sensor.nettleie_elvia_kapasitetstrinn_intervall",
  };
  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const tall = (s) => { if (!ok(s)) return NaN; const v = parseFloat(String(s.state).replace(",", ".")); return isNaN(v) ? NaN : v; };
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const komma = (v, d = 0) => (isNaN(v) ? "--" : v.toFixed(d).replace(".", ","));
  const FARGE = { lav: "#5be38a", mid: "#ffb34a", hoy: "#ff5a4a" };

  const STIL = `
    :host { display:block; }
    .sk { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; cursor:pointer; color:#eef3f8;
      background:linear-gradient(165deg,#15191f 0%,#1a1f27 55%,#1f2530 100%); -webkit-tap-highlight-color:transparent; outline:none;
      transition:transform .15s cubic-bezier(.3,1.4,.5,1); --pf:#5be38a; }
    .sk:active { transform:scale(.985); }
    .sk:focus-visible { box-shadow:0 0 0 2px var(--active-big,#f5c542); }
    .glod { position:absolute; inset:0; z-index:-1; transition:background 1.4s;
      background:radial-gradient(70% 90% at 72% 60%, color-mix(in srgb, var(--pf) 26%, transparent) 0%, transparent 62%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:50%; min-width:0; }
    .n { font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden;
      background:color-mix(in srgb, var(--pf) 28%, transparent); transition:background 1s; }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-left:4px; opacity:.85; }
    .sub { font-size:13px; opacity:.62; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .trinn { margin-top:7px; display:grid; gap:4px; }
    .trinn .t { font-size:11px; opacity:.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .trinn .strek { height:4px; border-radius:2px; background:rgba(238,243,248,.14); overflow:hidden; }
    .trinn .strek i { display:block; height:100%; border-radius:2px; background:#ffb34a; transition:width 1s ease, background .6s; }
    .sk.naer .trinn .strek i { background:#ff5a4a; }
    .scene { position:absolute; right:0; bottom:0; width:58%; max-width:300px; height:100%; }
    .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }
    .scene text { font-family:inherit; }

    .mast { fill:none; stroke:#6b7686; stroke-width:1.4; stroke-linejoin:round; stroke-linecap:round; }
    .isolator { fill:#8f9aab; }
    .ledning { fill:none; stroke:rgba(255,255,255,.14); stroke-width:1.2; }
    .strom { fill:none; stroke:var(--pf); stroke-width:2; stroke-linecap:round; stroke-dasharray:2 8; animation:flyt var(--flyt,1.2s) linear infinite; transition:stroke 1s; }
    .sk.stille .strom { animation-play-state:paused; opacity:.3; }
    @keyframes flyt { to { stroke-dashoffset:-20; } }
    .tak { fill:#2d3743; } .vegg { fill:#232b36; } .dor { fill:#161c23; }
    .vindu { fill:#ffcf7a; transition:opacity 1s; filter:drop-shadow(0 0 3px rgba(255,200,110,.7)); }
    .pipe { fill:#2d3743; }
    .sk.naer .hus { animation:varsel 1.2s ease-in-out infinite; }
    @keyframes varsel { 0%,100% { filter:drop-shadow(0 0 0 rgba(255,138,61,0)); } 50% { filter:drop-shadow(0 0 5px rgba(255,138,61,.95)); } }
    .maaler { fill:#1a2029; stroke:#3a4452; stroke-width:.8; }
    .maalerpil { stroke:#eef3f8; stroke-width:1.2; stroke-linecap:round; transform-box:view-box; transition:transform 1s cubic-bezier(.3,1.2,.4,1); }
    .soyle { transition:height .6s, y .6s; }
    .soyle.naa { animation:puls 2s ease-in-out infinite; }
    @keyframes puls { 0%,100% { opacity:1; } 50% { opacity:.55; } }
    .np-linje { stroke:#6fb6ff; stroke-width:1.2; stroke-dasharray:3 2; }
    .t-graf { font-size:7px; fill:#eef3f8; opacity:.55; }
    .naa-pil { fill:#eef3f8; }
    @media (prefers-reduced-motion: reduce) { .sk * { animation:none !important; } }
    @media (max-width:380px) { .scene { width:54%; } .tekst { max-width:46%; } }
  `;

  const SVG = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <!-- strømmast -->
    <g class="mast">
      <path d="M176 138 L182 44 L188 138 M178.6 100 L185.4 100 M177.6 118 L186.4 118 M179.6 76 L184.4 76 M178.6 100 L186.4 118 M185.4 100 L177.6 118 M179.6 76 L185.4 100 M184.4 76 L178.6 100"/>
      <path d="M168 54 H196 M171 66 H193"/>
    </g>
    <circle class="isolator" cx="170" cy="56" r="1.6"/><circle class="isolator" cx="173" cy="68" r="1.6"/>
    <!-- ledninger til huset -->
    <path class="ledning" d="M170 56 Q150 84 124 96"/><path class="ledning" d="M173 68 Q152 92 124 102"/>
    <path class="strom" d="M170 56 Q150 84 124 96"/><path class="strom" d="M173 68 Q152 92 124 102" style="animation-delay:-.5s"/>
    <!-- huset -->
    <g class="hus">
    <rect class="pipe" x="108" y="68" width="7" height="14"/>
    <path class="tak" d="M62 100 L94 72 L126 100 Z"/>
    <rect class="vegg" x="68" y="98" width="54" height="42"/>
    <rect class="vindu" x="74" y="106" width="12" height="10" rx="1.5"/>
    <rect class="vindu" x="102" y="106" width="12" height="10" rx="1.5"/>
    <rect class="dor" x="89" y="118" width="10" height="22" rx="1.5"/>
    <!-- strømmåler på veggen -->
    <circle class="maaler" cx="117" cy="126" r="5"/>
    <line class="maalerpil" x1="117" y1="126" x2="117" y2="122.2"/>
    </g>
    <line x1="56" y1="140.5" x2="196" y2="140.5" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
    <!-- dagens spotpris -->
    <g class="graf"></g>
    <line class="np-linje" x1="62" x2="192" y1="0" y2="0"/>
    <text class="t-graf t-venstre" x="62" y="152">spot i dag</text>
    <text class="t-graf t-hoyre" x="192" y="152" text-anchor="end"></text>
  </svg>`;

  class KiStromCard extends HTMLElement {
    static getStubConfig() { return {}; }
    static getConfigForm() {
      return {
        schema: [
          { name: "navn", selector: { text: {} } },
          { name: "effekt", selector: { entity: { domain: "sensor" } } },
          { name: "norgespris", selector: { entity: { domain: "sensor" } } },
          { name: "spot", selector: { entity: { domain: "sensor" } } },
          { name: "spot_i_ore", selector: { boolean: {} } },
          { name: "kostnad", selector: { entity: { domain: "sensor" } } },
          { name: "margin", selector: { entity: { domain: "sensor" } } },
          { name: "terskel", selector: { entity: { domain: "sensor" } } },
          { name: "trinn", selector: { entity: { domain: "sensor" } } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ navn: "Navn", effekt: "Effekt nå (W)", norgespris: "Norgespris (kr/kWh)", spot: "Spotpris med time-for-time", spot_i_ore: "Spotprisen er i øre",
          kostnad: "Kostnad i dag", margin: "Margin til neste trinn (kW)", terskel: "Neste trinn-terskel (kW)", trinn: "Kapasitetstrinn", tap_action: "Trykk" }[s.name] || s.name),
      };
    }
    setConfig(c) { this._c = { ...STANDARD, ...(c || {}) }; this._bygget = false; this._grafNokkel = ""; if (this._hass) this._oppdater(); }
    set hass(h) {
      this._hass = h; if (!this._c) return;
      const ids = ["effekt", "norgespris", "spot", "kostnad", "margin", "terskel", "trinn"].map((k) => this._c[k]).filter(Boolean);
      const n = ids.map((id) => h.states[id]);
      if (this._bygget && this._siste && n.every((s, i) => s === this._siste[i])) return;
      this._siste = n; this._oppdater();
    }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }
    connectedCallback() { if (!this._timer) this._timer = setInterval(() => { this._grafNokkel = ""; if (this._hass) this._oppdater(); }, 60000); }
    disconnectedCallback() { clearInterval(this._timer); this._timer = null; }

    _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
    _trykk() {
      const a = this._c.tap_action || { action: "more-info" };
      if (a.action === "none") return;
      if (a.action === "navigate" && a.navigation_path) { history.pushState(null, "", a.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); }
      else if (a.action === "more-info") this._mer(a.entity || this._c.effekt);
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: this._c.effekt }, action: "tap" }, bubbles: true, composed: true }));
      navigator.vibrate && navigator.vibrate(10);
    }
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="sk" role="button" tabindex="0">
        <div class="glod"></div><div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
        <div class="stor"></div><div class="sub"></div><div class="trinn"><div class="t"></div><div class="strek"><i></i></div></div></div>
        <div class="scene">${SVG}</div></div>`;
      const kort = this.shadowRoot.querySelector(".sk");
      kort.addEventListener("click", () => this._trykk());
      kort.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._trykk(); } });
      this._bygget = true;
    }

    /** timepriser for i dag i kr/kWh: [{t: Date, v}] */
    _timer_i_dag(spotS) {
      if (!spotS) return [];
      const a = spotS.attributes || {};
      const rå = a.raw_today || a.today || a.prices_today || [];
      const f = this._c.spot_i_ore ? 0.01 : 1;
      return rå.map((p, i) => (typeof p === "number"
        ? { t: new Date(new Date().setHours(i, 0, 0, 0)), v: p * f }
        : { t: new Date(p.start || p.startsAt || p.time), v: parseFloat(p.value ?? p.price ?? p.total) * f })).filter((p) => !isNaN(p.v) && !isNaN(p.t));
    }

    _oppdater() {
      if (!this._bygget) this._bygg();
      const c = this._c, h = this._hass, s = (id) => (id ? h.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q), kort = $(".sk");

      let effekt = tall(s(c.effekt)); if (!isNaN(effekt) && s(c.effekt).attributes.unit_of_measurement === "kW") effekt *= 1000;
      const np = tall(s(c.norgespris)), kost = tall(s(c.kostnad));
      const spotS = s(c.spot), spotNaa = tall(spotS) * (c.spot_i_ore ? 0.01 : 1);
      const timer = this._timer_i_dag(spotS);
      const f = c.spot_i_ore ? 0.01 : 1;
      let min = parseFloat(spotS && spotS.attributes.min) * f, max = parseFloat(spotS && spotS.attributes.max) * f;
      if (isNaN(min) || isNaN(max)) { const v = timer.map((p) => p.v); min = Math.min(...v); max = Math.max(...v); }

      // prisnivå: tredjedeler av dagens spenn
      let niva = "mid";
      if (!isNaN(spotNaa) && isFinite(min) && isFinite(max) && max > min) {
        const d = (max - min) / 3; niva = spotNaa <= min + d ? "lav" : spotNaa >= max - d ? "hoy" : "mid";
      }
      kort.style.setProperty("--pf", FARGE[niva]);
      kort.style.setProperty("--flyt", (isNaN(effekt) ? 1.2 : klem(1.7 - Math.log10(effekt / 200 + 1) * 0.6, 0.25, 1.7)).toFixed(2) + "s");
      kort.classList.toggle("stille", !(effekt > 20));
      const lys = isNaN(effekt) ? 0.5 : klem(0.25 + effekt / 6000, 0.25, 1);
      this.shadowRoot.querySelectorAll(".vindu").forEach((v) => v.style.opacity = lys.toFixed(2));
      $(".maalerpil").style.transform = `rotate(${(isNaN(effekt) ? -90 : -110 + klem(effekt / 8000, 0, 1) * 220).toFixed(0)}deg)`;
      $(".maalerpil").style.transformOrigin = "117px 126px";

      // effekttrinn
      const margin = tall(s(c.margin)), terskel = tall(s(c.terskel));
      const trinnS = s(c.trinn);
      let andel = NaN;
      if (!isNaN(margin) && !isNaN(terskel) && terskel > 0) andel = klem((terskel - margin) / terskel, 0, 1);
      kort.classList.toggle("naer", andel >= 0.9 || (!isNaN(margin) && margin < 0.5));
      $(".trinn").style.display = isNaN(andel) ? "none" : "";
      $(".trinn i").style.width = isNaN(andel) ? "0" : (andel * 100).toFixed(0) + "%";
      $(".trinn .t").textContent = `${ok(trinnS) ? "Trinn " + trinnS.state + " · " : ""}${komma(margin, 1)} kW til neste`;

      // prisgraf – bygges bare på nytt når prisene eller timen endrer seg
      const naa = new Date();
      const nokkel = timer.length + "|" + (timer[0] && timer[0].t.getTime()) + "|" + naa.getHours() + "|" + np + "|" + niva;
      if (nokkel !== this._grafNokkel) {
        this._grafNokkel = nokkel;
        const X0 = 62, W = 130, Y0 = 172, H = 16;
        const topp = Math.max(...timer.map((p) => p.v), isNaN(np) ? 0 : np, 0.01);
        const n = Math.max(timer.length, 1), bw = W / n;
        const naaIdx = timer.findIndex((p, i) => p.t <= naa && (!timer[i + 1] || timer[i + 1].t > naa));
        const d = (max - min) / 3;
        $(".graf").innerHTML = timer.map((p, i) => {
          const hgt = Math.max(1.5, (Math.max(p.v, 0) / topp) * H);
          const nv = max > min ? (p.v <= min + d ? "lav" : p.v >= max - d ? "hoy" : "mid") : "mid";
          const er = i === naaIdx;
          return `<rect class="soyle ${er ? "naa" : ""}" x="${(X0 + i * bw + bw * 0.15).toFixed(1)}" y="${(Y0 - hgt).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${hgt.toFixed(1)}" rx="${Math.min(1.5, bw * 0.3).toFixed(1)}"
            fill="${FARGE[nv]}" opacity="${er ? 1 : p.t < naa ? 0.3 : 0.6}"/>`;
        }).join("") + (naaIdx >= 0 ? `<path class="naa-pil" d="M${(X0 + naaIdx * bw + bw / 2 - 2.5).toFixed(1)} ${Y0 - H - 5} h5 l-2.5 3z"/>` : "");
        const npl = $(".np-linje");
        if (isNaN(np) || !timer.length) npl.style.display = "none";
        else { npl.style.display = ""; const y = (Y0 - (np / topp) * H).toFixed(1); npl.setAttribute("y1", y); npl.setAttribute("y2", y); }
        $(".t-hoyre").textContent = timer.length ? `${komma(Math.min(...timer.map((p) => p.v)), 2)}–${komma(Math.max(...timer.map((p) => p.v)), 2)} kr` : "";
      }

      // tekst
      $(".n").textContent = c.navn;
      const PT = { lav: ["Spotpris lav nå", "mdi:arrow-down-bold"], mid: ["Spotpris middels", "mdi:minus"], hoy: ["Spotpris høy nå", "mdi:arrow-up-bold"] };
      const [pt, ik] = kort.classList.contains("naer") ? ["Nær neste effekttrinn", "mdi:flash-alert"] : PT[niva];
      $(".pille ha-icon").setAttribute("icon", ik); $(".pt").textContent = pt;
      if (isNaN(effekt)) $(".stor").innerHTML = "--";
      else if (effekt >= 10000) $(".stor").innerHTML = `${komma(effekt / 1000, 1)}<small>kW</small>`;
      else $(".stor").innerHTML = `${Math.round(effekt).toLocaleString("nb-NO")}<small>W</small>`;
      const deler = [];
      if (!isNaN(np)) deler.push(`Norgespris ${komma(np, 2)} kr`);
      if (!isNaN(kost)) deler.push(`i dag ${Math.round(kost)} kr`);
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${$(".stor").textContent} nå. ${pt}. ${$(".sub").textContent}. ${$(".trinn .t").textContent}`);
    }
  }

  if (!customElements.get("ki-strom-card")) customElements.define("ki-strom-card", KiStromCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-strom-card"))
    window.customCards.push({ type: "ki-strom-card", name: "KI Strøm", description: "Animert hus med strøm fra nettet, prisnivå, effekttrinn og dagens spotpris", preview: true });
})();

/* ki-vanning-card – OpenSprinkler-kort som setter seg opp selv.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-vanning-card
 * prefiks: ute_opensprinkler        # oppdages automatisk hvis den utelates
 * vinter: input_boolean.vinter_modus_vanning
 * varigheter: [5, 10, 15, 30, 60]   # minutter på hurtigknappene
 * skjul_ubrukte: true               # skjuler soner uten navn (S10–S16)
 * faner: [naa, soner, programmer]
 * navn_kort: true                   # «Plen nord» i stedet for «Plen nord · Spreder B2»
 */
const KI_VANN_VERSJON = "1.0.0";

const KI_VANN_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .rot { display:grid; gap:12px; }
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

  /* ---- hurtigknapper ---- */
  .hurtig { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:8px; }
  .hk { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:500;
    border-radius:24px; padding:14px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;
    --mdc-icon-size:24px; transition:transform .12s var(--fjaer), background .2s; }
  .hk:active { transform:scale(.95); }
  .hk.pa { background:var(--gray1000); color:var(--gray100); }
  .hk ha-icon { color:var(--hk-farge, inherit); }

  /* ---- faner ---- */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
    padding:7px 16px; border-radius:999px; cursor:pointer; white-space:nowrap; transition:background .2s, color .2s; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .panel { display:none; } .panel.valgt { display:grid; gap:10px; }

  /* ---- soner ---- */
  .boks { background:var(--gray200); border-radius:20px; padding:6px; }
  .bokstittel { display:flex; align-items:center; gap:10px; padding:10px 10px 8px; font-size:16px; font-weight:500; --mdc-icon-size:22px; }
  .bokstittel span { opacity:.55; font-size:12px; margin-left:auto; }
  .sone { border-radius:16px; background:var(--gray100); margin:0 0 6px; overflow:hidden; transition:background .3s; }
  .sone.gaar { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .sonerad { display:grid; grid-template-columns:64px 1fr min-content; grid-template-areas:"i n t" "i l t";
    align-items:center; cursor:pointer; }
  .sonerad .ic { grid-area:i; justify-self:start; width:48px; height:48px; margin:6px; border-radius:12px;
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:26px; }
  .sonerad .n { grid-area:n; align-self:end; font-weight:600; padding-top:6px; }
  .sonerad .l { grid-area:l; align-self:start; font-size:12px; opacity:.65; padding-bottom:6px; }
  .sonerad .t { grid-area:t; padding-right:14px; font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
  .varigheter { display:grid; grid-template-columns:repeat(var(--ant,6), minmax(0,1fr)); gap:6px; padding:0 6px 8px; }
  .vk { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:13px; font-weight:600;
    border-radius:12px; padding:10px 2px; cursor:pointer; transition:transform .12s var(--fjaer), background .2s; }
  .sone.gaar .vk { background:rgba(0,0,0,.18); color:var(--black,#000); }
  .vk:active { transform:scale(.93); }
  .vk.stopp { color:var(--red,#e8657a); font-size:12px; }
  .sone.av .sonerad { opacity:.45; }

  /* ---- programmer ---- */
  .prog { display:grid; grid-template-columns:56px 1fr min-content; grid-template-areas:"i n t" "i l t";
    align-items:center; background:var(--gray200); border-radius:16px; cursor:pointer; transition:background .3s; }
  .prog.gaar { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .prog.av { opacity:.55; }
  .prog .ic { grid-area:i; justify-self:start; width:40px; height:40px; margin:8px; border-radius:10px; background:rgba(0,0,0,.15);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:22px; }
  .prog .n { grid-area:n; align-self:end; font-weight:600; font-size:15px; padding-top:6px; }
  .prog .l { grid-area:l; align-self:start; font-size:12px; opacity:.7; padding-bottom:6px; }
  .prog .t { grid-area:t; padding-right:14px; font-size:12px; opacity:.7; font-variant-numeric:tabular-nums; }
  .hint { font-size:11px; opacity:.55; padding:0 4px 4px; }
  .tom { padding:18px; font-size:13px; opacity:.6; text-align:center; }
  .nokkel { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px,1fr)); gap:8px; }
  .nk { background:var(--gray200); border-radius:16px; padding:12px 14px; }
  .nk .n { font-size:12px; opacity:.55; }
  .nk .v { font-size:16px; font-weight:500; margin-top:2px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiVaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* Ikon etter vanningsmetode i sonenavnet */
const kiVaIkon = (t) => /drypp/i.test(t) ? "mdi:water-outline" : /spreder|spr\b/i.test(t) ? "mdi:sprinkler-variant" : "mdi:sprinkler";

class KiVanningCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "naa"; }
  static getConfigElement() { return document.createElement("ki-vanning-card-editor"); }
  static getStubConfig() { return {}; }
  getCardSize() { return 10; }

  setConfig(c) {
    this._c = { varigheter: [5, 10, 15, 30, 60], skjul_ubrukte: true, navn_kort: true,
                faner: ["naa", "soner", "programmer"], ...(c || {}) };
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

  _st(id) { return id && this._h ? this._h.states[id] : null; }
  _on(id) { const s = this._st(id); return !!s && s.state === "on"; }

  /* ---------- automatisk oppsett ---------- */
  _prefiks() {
    if (this._c.prefiks) return this._c.prefiks;
    if (this._pref !== undefined) return this._pref;
    const h = this._h; if (!h) return null;
    const t = Object.keys(h.states).find((id) => /^binary_sensor\..+_s\d\d.*_station_running$/.test(id));
    this._pref = t ? t.replace(/^binary_sensor\./, "").replace(/_s\d\d.*_station_running$/, "") : null;
    return this._pref;
  }
  /* Soner: S01 … S16 med navn og metode hentet fra friendly_name */
  _soner() {
    const h = this._h, p = this._prefiks(); if (!h || !p) return [];
    const re = new RegExp("^switch\\." + p + "_s(\\d\\d)(.*)_station_enabled$");
    return Object.keys(h.states).map((id) => {
      const m = id.match(re); if (!m) return null;
      const nr = m[1], hale = m[2] || "";
      const fn = h.states[id].attributes.friendly_name || "";
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
    const h = this._h, p = this._prefiks(); if (!h || !p) return [];
    const re = new RegExp("^switch\\." + p + "_(.+)_program_enabled$");
    return Object.keys(h.states).map((id) => {
      const m = id.match(re); if (!m) return null;
      const slug = m[1];
      const fn = h.states[id].attributes.friendly_name || slug;
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
  _kjor(sone, min) { this._tjeneste("run_station", { run_seconds: min * 60 }, sone.bryter); }
  _stopp(id) { this._tjeneste("stop", {}, id || this._styring().aktiv); }
  _regn(t) { this._tjeneste("set_rain_delay", { rain_delay: t }, this._styring().aktiv); }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
  _veksle(id) { if (navigator.vibrate) navigator.vibrate(8); this._h.callService("homeassistant", "toggle", { entity_id: id }); }

  /* ---------- oppbygging ---------- */
  _bygg() {
    const c = this._c, faner = c.faner;
    const navn = { naa: "Nå", soner: "Soner", programmer: "Programmer" };
    const drapper = Array.from({ length: 14 }, (_, i) =>
      `<i style="left:${(i * 37 + 9) % 96 + 2}%;animation-duration:${(0.7 + (i % 5) * 0.12).toFixed(2)}s;animation-delay:-${((i * 0.23) % 1.2).toFixed(2)}s"></i>`).join("");
    this.shadowRoot.innerHTML = `<style>${KI_VANN_STIL}</style>
      <div class="rot">
        <div class="hero" role="button" tabindex="0">
          <div class="drapper">${drapper}</div>
          <div class="ic"><ha-icon icon="mdi:sprinkler-variant"></ha-icon></div>
          <div class="n"></div><div class="l"></div><div class="t"></div>
          <div class="strek"><i></i></div>
        </div>

        <div class="hurtig">
          <button class="hk" data-h="stopp" style="--hk-farge:var(--red,#e8657a)"><ha-icon icon="mdi:stop-circle"></ha-icon><span>Stopp alt</span></button>
          <button class="hk" data-h="regn24"><ha-icon icon="mdi:weather-rainy"></ha-icon><span>Regn 24t</span></button>
          <button class="hk" data-h="regn0"><ha-icon icon="mdi:weather-sunny"></ha-icon><span>Nullstill</span></button>
          <button class="hk" data-h="vinter"><ha-icon icon="mdi:snowflake"></ha-icon><span>${c.vinter ? "Vintermodus" : "Anlegg"}</span></button>
        </div>

        ${faner.length > 1 ? `<div class="faner"><div class="skinne" role="tablist">${faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" role="tab" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        ${faner.map((f) => `<div class="panel ${f === this._fane ? "valgt" : ""}" data-p="${f}"></div>`).join("")}
      </div>`;

    const r = this.shadowRoot;
    r.querySelector(".hero").addEventListener("click", () => {
      const z = this._aktivSone();
      if (z) this._stopp(z.bryter); else this._mer(this._styring().aktiv);
    });
    r.querySelectorAll("[data-h]").forEach((b) => b.addEventListener("click", () => {
      const h = b.dataset.h;
      if (h === "stopp") this._stopp();
      else if (h === "regn24") this._regn(24);
      else if (h === "regn0") this._regn(0);
      else this._veksle(c.vinter || this._styring().aktiv);
    }));
    r.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => { this._fane = b.dataset.f; this._tegn(); }));
    this._bygget = true;
  }

  /* ---------- paneler ---------- */
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
      <div class="bokstittel"><ha-icon icon="mdi:water-boiler"></ha-icon>${b === "–" ? "Andre soner" : "Boks " + b}
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

  _panelProgrammer() {
    const p = this._programmer();
    if (!p.length) return `<div class="tom">Fant ingen programmer.</div>`;
    return p.map((x) => {
      const gaar = this._on(x.gaar), av = !this._on(x.bryter);
      const t = this._st(x.start), iv = this._st(x.intervall);
      const under = [t && !["unknown", "unavailable"].includes(t.state) ? "Start " + String(t.state).slice(0, 5) : "",
        iv && iv.state !== "unknown" ? "hver " + Math.round(parseFloat(iv.state)) + ". dag" : ""].filter(Boolean).join(" · ");
      return `<div class="prog ${gaar ? "gaar" : ""} ${av ? "av" : ""}" data-prog="${x.bryter}" data-kjor="${x.bryter}" role="button" tabindex="0">
        <div class="ic"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
        <div class="n">${kiVaEsc(x.navn)}</div>
        <div class="l">${gaar ? "Kjører nå" : av ? "Deaktivert" : under || "Aktivert"}</div>
        <div class="t">${av ? "av" : "på"}</div></div>`;
    }).join("") + `<div class="hint">Trykk = av eller på · hold = kjør programmet nå</div>`;
  }

  _tikk() {
    if (!this._bygget || !this._slutt) return;
    const igjen = Math.max(0, Math.round((this._slutt - Date.now()) / 1000));
    const t = this.shadowRoot.querySelector(".hero .t");
    if (t) t.textContent = igjen ? `${Math.floor(igjen / 60)}:${String(igjen % 60).padStart(2, "0")}` : "";
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
    const z = this._aktivSone(), vinter = c.vinter && this._on(c.vinter);
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

    const vk = r.querySelector('[data-h="vinter"]');
    if (vk) { const pa = c.vinter ? this._on(c.vinter) : !this._on(s.aktiv); vk.classList.toggle("pa", pa);
      vk.querySelector("span").textContent = c.vinter ? "Vintermodus" : (this._on(s.aktiv) ? "Slå av anlegg" : "Slå på anlegg"); }

    const sett = (navn, html) => { const el = r.querySelector(`.panel[data-p="${navn}"]`); if (el) el.innerHTML = html; };
    if (c.faner.includes("naa")) sett("naa", this._panelNaa());
    if (c.faner.includes("soner")) sett("soner", this._panelSoner());
    if (c.faner.includes("programmer")) sett("programmer", this._panelProgrammer());
    r.querySelectorAll(".fane").forEach((b) => b.classList.toggle("valgt", b.dataset.f === this._fane));
    r.querySelectorAll(".panel").forEach((p) => p.classList.toggle("valgt", p.dataset.p === this._fane));

    /* klikk i panelene kobles på nytt etter hver tegning */
    r.querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => {
      const sone = this._soner().find((x) => x.nr === b.dataset.z); if (!sone) return;
      const m = +b.dataset.min;
      if (m) this._kjor(sone, m); else this._stopp(sone.bryter);
    }));
    r.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", (e) => {
      if (e.target.closest("[data-min]")) return; this._mer(el.dataset.e);
    }));
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
        navn_kort: "Korte sonenavn" };
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
    ];
  }
}
if (!customElements.get("ki-vanning-card-editor")) customElements.define("ki-vanning-card-editor", KiVanningCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-vanning-card")) window.customCards.push({ type: "ki-vanning-card", name: "KI Vanning", description: "OpenSprinkler: soner, programmer og hurtigvanning – setter seg opp selv", preview: true });

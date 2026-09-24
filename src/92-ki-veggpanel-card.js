/*
 * ki-veggpanel-card — hele veggpanelet for stua, som ett kort.
 *
 * Tegnet etter DESIGN.md (mysmarthome): mørk bunn, gray200-kort med radius 24, lyse
 * ikonsirkler med tynn kant, navn i 14/500 med 70 % opasitet, store tall i vekt 300,
 * aktivfargen for det som er på. Trykk gjør handlingen, langt trykk åpner entiteten,
 * og alt som kan dras (lysstyrke, gardiner, strømprisen) kan leses og styres med fingeren.
 *
 * Oppbygning:  toppstripe  |  venstre: prosa, familie, scener
 *                          |  midten: media, klima, strøm
 *                          |  høyre: lys, markise og gardiner
 *
 * type: custom:ki-veggpanel-card
 * topp:                         # alle valgfrie, standard = oppsettet i stua
 *   vaer: weather.forecast_home
 *   hjemme: sensor.antall_personer_hjemme
 *   las: lock.dorlas_blatann
 *   alarm: alarm_control_panel.alarm
 *   stovsuger: vacuum.sir_sweeps_a_lot
 *   innstillinger: "#settings"
 *   vaer_trykk / hjemme_trykk / las_trykk / alarm_trykk / stovsuger_trykk: "#popup"  (ellers mer-info)
 * prosa:   { …ki-prosa-card }     # kortene monteres slik de er
 * familie: { …family-status-card }
 * media:   { …ki-media-card }
 * scener:
 *   - { navn: Filmkveld, ikon: mdi:movie-open, tap_action: {…}, aktiv: switch.x }
 * klima: [climate.stue_oljefyr, climate.stue_panelovn]
 * strom: { pris: sensor.…, effekt: sensor.strommaler_effekt, trykk: "#strom" }
 * lys:   { gruppe: light.stue, lamper: [light.a, { entity: light.b, navn: Leselampe }] }
 * dekker:
 *   - { navn: Markise, ikon: mdi:awning-outline, hoved: cover.markise,
 *       deler: [{ navn: Venstre, entity: cover.markise_venstre }, …], invertert: true }
 */
(() => {
  const VERSJON = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const komma = (v, d = 0) => (isNaN(v) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const TIME = 3600000;

  const STD = {
    topp: {
      vaer: "weather.forecast_home", hjemme: "sensor.antall_personer_hjemme", las: "lock.dorlas_blatann",
      alarm: "alarm_control_panel.alarm", stovsuger: "vacuum.sir_sweeps_a_lot", innstillinger: "#settings",
      vaer_trykk: "#weather", alarm_trykk: "#alarm",
    },
    klima: [],
    scener: [],
    dekker: [],
  };

  const VAER = {
    "clear-night": ["Klar himmel", "mdi:weather-night"], sunny: ["Sol", "mdi:weather-sunny"],
    partlycloudy: ["Delvis skyet", "mdi:weather-partly-cloudy"], cloudy: ["Skyet", "mdi:weather-cloudy"],
    rainy: ["Regn", "mdi:weather-rainy"], pouring: ["Kraftig regn", "mdi:weather-pouring"],
    snowy: ["Snø", "mdi:weather-snowy"], "snowy-rainy": ["Sludd", "mdi:weather-snowy-rainy"],
    fog: ["Tåke", "mdi:weather-fog"], windy: ["Vind", "mdi:weather-windy"], "windy-variant": ["Vind", "mdi:weather-windy-variant"],
    lightning: ["Torden", "mdi:weather-lightning"], "lightning-rainy": ["Torden og regn", "mdi:weather-lightning-rainy"],
    hail: ["Hagl", "mdi:weather-hail"], exceptional: ["Ekstremvær", "mdi:alert"],
  };
  const LAS = { locked: "Låst", unlocked: "Ulåst", open: "Åpen", jammed: "Fastkjørt", locking: "Låser …", unlocking: "Låser opp …" };
  const ALARM = { disarmed: "Alarm av", armed_home: "Hjemme", armed_away: "Borte", armed_night: "Natt",
    armed_vacation: "Ferie", triggered: "Utløst!", arming: "Aktiverer …", pending: "Venter …" };
  const STOV = { docked: "Ladet", cleaning: "Støvsuger", returning: "På vei hjem", idle: "Venter", paused: "Pause", error: "Feil" };

  const CSS = `
    :host { display: block; container-type: inline-size; }
    * { box-sizing: border-box; min-width: 0; }
    .vp {
      color: var(--gray1000, #fafbfc); font-family: inherit;
      display: grid; gap: 16px; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
    }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    ha-icon { --mdc-icon-size: 22px; }

    /* toppstripe */
    .topp { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-height: 64px; }
    .klokke { display: flex; align-items: center; gap: 14px; margin-right: auto; }
    .klokke b { font-size: 52px; font-weight: 300; letter-spacing: -2px; line-height: 1; font-variant-numeric: tabular-nums; }
    .klokke span { display: grid; gap: 2px; }
    .klokke i { font-style: normal; font-size: 16px; font-weight: 500; }
    .klokke small { font-size: 14px; font-weight: 500; opacity: .7; }
    .pille { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 12px; border-radius: 999px;
      background: var(--gray200); font-size: 15px; font-weight: 500; white-space: nowrap; transition: transform .14s cubic-bezier(.2,1.3,.3,1), background .25s; }
    .pille ha-icon { --mdc-icon-size: 20px; }
    .pille:active { transform: scale(.95); }
    .pille.fylt { background: var(--active-big); color: var(--black); }
    .pille.rund { width: 44px; padding: 0; justify-content: center; }

    /* kolonner */
    .kol3 { display: grid; grid-template-columns: 340px minmax(0, 1fr) 330px; gap: 16px; align-items: start; }
    .kol { display: grid; gap: 14px; align-content: start; }
    @container (max-width: 980px) { .kol3 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .kol.midt { grid-column: 1 / -1; order: -1; } }
    @container (max-width: 640px) { .kol3 { grid-template-columns: minmax(0, 1fr); } .kol.midt { order: 0; } }

    .kort { background: var(--gray200); border-radius: 24px; padding: 16px; display: grid; gap: 12px; }
    .vert { display: block; }
    .vert > * { display: block; }
    .hode { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 12px; align-items: center; text-align: left; }
    .ik { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
      background: rgba(250,251,252,.1); border: 1px solid rgba(250,251,252,.1); }
    .ik ha-icon { --mdc-icon-size: 24px; }
    .ik.fylt { background: var(--active-big); border-color: transparent; color: var(--black); }
    .ik.varm { background: var(--orange); border-color: transparent; color: var(--black); }
    .navn { font-size: 14px; font-weight: 500; opacity: .7; }
    .status { font-size: 18px; font-weight: 300; line-height: 1.2; }
    .liten { font-size: 14px; font-weight: 500; }

    /* scener */
    .scener { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .scene { display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 9px 12px 9px 9px; border-radius: 22px;
      background: var(--gray100); text-align: left; font-size: 15px; font-weight: 500;
      transition: background .25s, transform .14s cubic-bezier(.2,1.3,.3,1); }
    .scene:active { transform: scale(.96); }
    .scene .ik { flex: none; }
    .scene.aktiv { background: var(--active-big); color: var(--black); }
    .scene.aktiv .ik { background: rgba(0,0,0,.1); border-color: rgba(0,0,0,.08); }
    .scene.kjort { animation: vp-kjort .5s ease; }
    @keyframes vp-kjort { 40% { background: var(--active-big); color: var(--black); } }

    /* klima */
    .klima { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .termo { display: grid; grid-template-columns: 48px minmax(0, 1fr) 48px; align-items: center; }
    .termo b { text-align: center; font-size: 46px; font-weight: 300; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
    .termo b small { font-size: 20px; opacity: .7; }
    .rund { width: 48px; height: 48px; border-radius: 50%; background: var(--gray100); display: grid; place-items: center; transition: transform .12s; }
    .rund:active { transform: scale(.9); }
    .termo.venter b { opacity: .55; }

    /* strøm */
    .tallrad { display: flex; justify-content: space-between; align-items: end; gap: 12px; }
    .tall { font-size: 30px; font-weight: 300; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .tall small { font-size: 14px; font-weight: 500; opacity: .7; }
    .soyler { position: relative; height: 110px; display: flex; align-items: flex-end; gap: 3px; touch-action: pan-y; }
    .soyler.peker { touch-action: none; }
    .soyler i { flex: 1; border-radius: 3px; min-height: 3px; transition: opacity .15s; }
    .soyler i.bil { background: color-mix(in srgb, var(--green, #72cf93) 75%, transparent); }
    .soyler i.mid { background: color-mix(in srgb, var(--orange, #e8b56e) 75%, transparent); }
    .soyler i.dyr { background: color-mix(in srgb, var(--red, #e5646a) 80%, transparent); }
    .soyler i.naa { background: var(--active-big); }
    .soyler i.forbi { opacity: .4; }
    .soyler.peker i { opacity: .35; }
    .soyler.peker i.valgt { opacity: 1; }
    .lapp { position: absolute; top: -6px; transform: translate(-50%, -100%); padding: 6px 10px; border-radius: 12px;
      background: var(--gray1000); color: var(--gray200); white-space: nowrap; pointer-events: none; display: grid; text-align: center; }
    .lapp b { font-size: 16px; font-weight: 500; }
    .lapp span { font-size: 11px; opacity: .8; }
    .akse { display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; opacity: .7; }

    /* lys */
    .lampe { display: grid; grid-template-columns: minmax(0, 1fr) auto 50px; gap: 6px 10px; align-items: center; text-align: left; }
    .lampe .ln { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lampe .lv { font-size: 15px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; }
    .bryter { grid-row: span 2; justify-self: end; width: 44px; height: 26px; border-radius: 999px; position: relative;
      background: rgba(250,251,252,.12); transition: background .2s; }
    .bryter::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
      background: var(--gray1000); transition: left .2s cubic-bezier(.2,1.3,.3,1), background .2s; }
    .bryter.pa { background: var(--active-big); }
    .bryter.pa::after { left: 21px; background: var(--black); }
    .dra { grid-column: 1 / 3; position: relative; height: 22px; display: flex; align-items: center; touch-action: none; cursor: ew-resize; }
    .dra::before { content: ""; position: absolute; left: 0; right: 0; height: 8px; border-radius: 4px; background: var(--gray100); }
    .dra i { position: absolute; left: 0; height: 8px; border-radius: 4px; background: var(--active-big); }
    .dra b { position: absolute; width: 20px; height: 20px; margin-left: -10px; border-radius: 50%; background: var(--gray1000);
      box-shadow: 0 1px 4px rgba(0,0,0,.4); transition: transform .12s; }
    .dra.drar b { transform: scale(1.2); }
    .dra.av i, .dra.av b { opacity: .25; }

    /* dekker */
    .del { display: grid; grid-template-columns: 64px minmax(0, 1fr) 44px; gap: 10px; align-items: center; font-size: 14px; font-weight: 500; }
    .del .dn { opacity: .7; }
    .del .dv { text-align: right; font-variant-numeric: tabular-nums; }
    .del .dra { grid-column: auto; }
    .preset { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
    .preset button { height: 44px; border-radius: 999px; background: var(--gray100); font-size: 14px; font-weight: 500;
      transition: background .2s, transform .12s; }
    .preset button:active { transform: scale(.93); }
    .preset button.valgt { background: var(--active-big); color: var(--black); }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `;

  class KiVeggpanelCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._sist = {};      // tilstandsobjekter vi sist tegnet fra, per del
      this._opt = {};       // optimistiske verdier mens vi venter på svar
      this._barn = {};      // monterte kort (prosa, familie, media)
    }

    static getStubConfig() { return {}; }
    getCardSize() { return 14; }

    setConfig(c) {
      this._c = {
        ...STD, ...c,
        topp: { ...STD.topp, ...(c.topp || {}) },
        strom: { effekt: "sensor.strommaler_effekt", trykk: "#strom", ...(c.strom || {}) },
      };
      this._bygget = false;
      if (this._hass) this._tegnAlt();
    }

    set hass(h) {
      this._hass = h;
      for (const k of Object.values(this._barn)) if (k) k.hass = h;
      this._tegnAlt();
    }

    connectedCallback() {
      clearInterval(this._ur);
      this._ur = setInterval(() => this._klokke(), 15000);
    }

    disconnectedCallback() { clearInterval(this._ur); }

    /* ---------- hjelpere ---------- */
    _st(id) { return id && this._hass ? this._hass.states[id] : undefined; }
    _ids(liste) { return (liste || []).map((x) => (typeof x === "string" ? { entity: x } : x)).filter((x) => x && x.entity); }

    _haptikk(t = "light") {
      try { window.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true })); } catch (e) { /* eldre */ }
      if (navigator.vibrate) { try { navigator.vibrate(t === "selection" ? 5 : t === "medium" ? 12 : 8); } catch (e) { /* blokkert */ } }
    }

    _mer(id) {
      if (!id) return;
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: id };
      this.dispatchEvent(ev);
    }

    _gaTil(sti) {
      if (!sti) return;
      if (sti.startsWith("#")) { window.location.hash = sti; return; }
      history.pushState(null, "", sti);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }

    /* Handling i HA-form: navigate, toggle, more-info, perform-action/call-service, url. */
    _handling(a, standardId) {
      if (!a) return;
      const id = a.entity || (a.target && a.target.entity_id) || standardId;
      switch (a.action) {
        case "navigate": return this._gaTil(a.navigation_path);
        case "url": return window.open(a.url_path);
        case "toggle": return this._hass.callService("homeassistant", "toggle", { entity_id: id });
        case "more-info": return this._mer(id);
        case "perform-action":
        case "call-service": {
          const [d, s] = String(a.perform_action || a.service || "").split(".");
          if (d && s) this._hass.callService(d, s, a.data || a.service_data || {}, a.target);
          return;
        }
        default:
          this.dispatchEvent(new CustomEvent("hass-action", { bubbles: true, composed: true,
            detail: { config: { tap_action: a, entity: standardId }, action: "tap" } }));
      }
    }

    /* ---------- bygging ---------- */
    _bygg() {
      const r = this.shadowRoot;
      r.innerHTML = `<style>${CSS}</style>
        <div class="vp">
          <div class="topp" id="topp"></div>
          <div class="kol3">
            <div class="kol venstre">
              ${this._c.prosa ? `<div class="vert" id="v-prosa"></div>` : ""}
              ${this._c.familie ? `<div class="vert" id="v-familie"></div>` : ""}
              <div id="scener"></div>
            </div>
            <div class="kol midt">
              ${this._c.media ? `<div class="vert" id="v-media"></div>` : ""}
              <div id="klima"></div>
              <div id="strom"></div>
            </div>
            <div class="kol hoyre">
              <div id="lys"></div>
              <div id="dekker"></div>
            </div>
          </div>
        </div>`;
      this._sist = {};
      this._barn = {};
      for (const [navn, std] of [["prosa", "custom:ki-prosa-card"], ["familie", "custom:family-status-card"], ["media", "custom:ki-media-card"]]) {
        const konf = this._c[navn];
        if (!konf) continue;
        this._monter(navn, { type: std, ...konf });
      }
      if (!this._lyttere) this._koble();
      this._bygget = true;
    }

    async _monter(navn, konf) {
      const vert = this.shadowRoot.getElementById(`v-${navn}`);
      if (!vert) return;
      try {
        const hjelp = await window.loadCardHelpers();
        const el = hjelp.createCardElement(konf);
        el.hass = this._hass;
        vert.innerHTML = "";
        vert.appendChild(el);
        this._barn[navn] = el;
      } catch (e) {
        vert.innerHTML = `<div class="kort"><span class="navn">Fant ikke ${esc(konf.type)}</span></div>`;
      }
    }

    /* Én lytter for trykk og hold på hele kortet. Elementene bærer data-tap / data-hold. */
    _koble() {
      this._lyttere = true;
      const r = this.shadowRoot;
      let timer = null, holdt = false;
      r.addEventListener("pointerdown", (e) => {
        const el = e.composedPath().find((n) => n && n.dataset && (n.dataset.hold || n.dataset.tap));
        holdt = false;
        clearTimeout(timer);
        if (!el || !el.dataset.hold) return;
        timer = setTimeout(() => { holdt = true; this._haptikk("medium"); this._mer(el.dataset.hold); }, 500);
      });
      const avbryt = () => clearTimeout(timer);
      r.addEventListener("pointerup", avbryt);
      r.addEventListener("pointercancel", avbryt);
      r.addEventListener("contextmenu", (e) => { if (e.composedPath().some((n) => n && n.dataset && n.dataset.hold)) e.preventDefault(); });
      r.addEventListener("click", (e) => {
        if (holdt) { holdt = false; e.stopPropagation(); return; }
        const el = e.composedPath().find((n) => n && n.dataset && n.dataset.tap);
        if (!el) return;
        this._trykk(el);
      });
      // dra: lysstyrke og dekker
      r.addEventListener("pointerdown", (e) => {
        const dra = e.composedPath().find((n) => n && n.classList && n.classList.contains("dra"));
        if (!dra) return;
        clearTimeout(timer);
        e.preventDefault();
        dra.setPointerCapture(e.pointerId);
        dra.classList.add("drar");
        const flytt = (ev) => this._draTil(dra, ev);
        const slipp = (ev) => {
          dra.removeEventListener("pointermove", flytt);
          dra.removeEventListener("pointerup", slipp);
          dra.removeEventListener("pointercancel", slipp);
          dra.classList.remove("drar");
          this._draSlipp(dra, ev);
        };
        dra.addEventListener("pointermove", flytt);
        dra.addEventListener("pointerup", slipp);
        dra.addEventListener("pointercancel", slipp);
        this._draTil(dra, e);
      });
      // strømprisen: fingeren over søylene
      r.addEventListener("pointerdown", (e) => { const s = e.composedPath().find((n) => n && n.classList && n.classList.contains("soyler")); if (s) this._pris(s, e, true); });
      const slippPris = () => { if (this._prisPek != null) { this._prisPek = null; this._sist.strom = null; this._tegnStrom(); } };
      r.addEventListener("pointermove", (e) => {
        const s = e.composedPath().find((n) => n && n.classList && n.classList.contains("soyler"));
        if (s && (e.pointerType === "mouse" || e.buttons)) this._pris(s, e, false);
        else if (!s && e.pointerType === "mouse") slippPris();
      });
      r.addEventListener("pointerup", slippPris);
      r.addEventListener("pointercancel", slippPris);
    }

    _trykk(el) {
      const t = el.dataset.tap, id = el.dataset.id;
      if (t === "gaa") { this._haptikk("light"); this._gaTil(el.dataset.sti); return; }
      if (t === "mer") { this._mer(id); return; }
      if (t === "veksle") {
        this._haptikk("light");
        const st = this._st(id);
        this._opt[id] = { state: st && st.state === "on" ? "off" : "on", t: Date.now() };
        this._hass.callService("homeassistant", "toggle", { entity_id: id });
        this._tegnAlt(true);
        return;
      }
      if (t === "scene") {
        const s = (this._c.scener || [])[Number(el.dataset.i)];
        if (!s) return;
        this._haptikk("light");
        el.classList.remove("kjort"); void el.offsetWidth; el.classList.add("kjort");
        this._handling(s.tap_action || (s.entity ? { action: "toggle" } : null), s.entity);
        return;
      }
      if (t === "temp") { this._justerTemp(id, Number(el.dataset.steg)); return; }
      if (t === "preset") {
        this._haptikk("light");
        const d = (this._c.dekker || [])[Number(el.dataset.i)];
        const verdi = Number(el.dataset.v);
        const inv = d.invertert !== false;
        const ids = (d.deler || []).map((x) => x.entity).concat(d.deler && d.deler.length ? [] : [d.hoved]);
        for (const e of ids) this._opt[e] = { pos: inv ? 100 - verdi : verdi, t: Date.now() };
        this._hass.callService("cover", "set_cover_position", { entity_id: ids, position: inv ? 100 - verdi : verdi });
        this._sist.dekker = null;
        this._tegnDekker();
      }
    }

    /* − og +: trykkene samles i 0,8 s og sendes som ett kall, så termostaten ikke får
       fem kall på rad – og tallet står på det du har trykket deg fram til imens. */
    _justerTemp(id, steg) {
      const st = this._st(id); if (!st) return;
      this._haptikk("selection");
      const o = this._opt[id];
      const fra = o && o.temp != null ? o.temp : Number(st.attributes.temperature) || 20;
      const trinn = Number(st.attributes.target_temp_step) || 0.5;
      const min = Number(st.attributes.min_temp) || 5, max = Number(st.attributes.max_temp) || 35;
      const ny = Math.min(max, Math.max(min, Math.round((fra + steg * trinn) / trinn) * trinn));
      this._opt[id] = { temp: ny, t: Date.now() };
      clearTimeout(this._tempTimer && this._tempTimer[id]);
      this._tempTimer = this._tempTimer || {};
      this._tempTimer[id] = setTimeout(() => this._hass.callService("climate", "set_temperature", { entity_id: id, temperature: ny }), 800);
      this._sist.klima = null;
      this._tegnKlima();
    }

    _draTil(dra, e) {
      const r = dra.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
      dra._verdi = Math.round(f * 100);
      const i = dra.querySelector("i"), b = dra.querySelector("b");
      if (i) i.style.width = `${dra._verdi}%`;
      if (b) b.style.left = `${dra._verdi}%`;
      const vis = dra.parentElement && dra.parentElement.querySelector(".lv, .dv");
      if (vis) vis.textContent = `${dra._verdi} %`;
    }

    _draSlipp(dra) {
      const id = dra.dataset.id, v = dra._verdi;
      if (id == null || v == null) return;
      this._haptikk("light");
      if (dra.dataset.slag === "lys") {
        this._opt[id] = { state: v > 0 ? "on" : "off", pst: v, t: Date.now() };
        if (v === 0) this._hass.callService("light", "turn_off", { entity_id: id });
        else this._hass.callService("light", "turn_on", { entity_id: id, brightness_pct: v });
      } else {
        const inv = dra.dataset.inv === "1";
        const pos = inv ? 100 - v : v;
        this._opt[id] = { pos, t: Date.now() };
        this._hass.callService("cover", "set_cover_position", { entity_id: id, position: pos });
      }
    }

    /* Optimistisk verdi: gjelder til entiteten er enig, eller i 6 s. */
    _optFor(id, felt, faktisk, lik) {
      const o = this._opt[id];
      if (!o || o[felt] === undefined) return faktisk;
      if ((lik ? lik(o[felt], faktisk) : o[felt] === faktisk) || Date.now() - o.t > 6000) { delete this._opt[id]; return faktisk; }
      return o[felt];
    }

    /* ---------- tegning ---------- */
    _tegnAlt(tving = false) {
      if (!this._hass || !this._c) return;
      if (!this._bygget) this._bygg();
      if (tving) this._sist = {};
      this._tegnTopp();
      this._tegnScener();
      this._tegnKlima();
      this._tegnStrom();
      this._tegnLys();
      this._tegnDekker();
    }

    /* Tegner en del bare når en av entitetene den bruker, har fått et nytt tilstandsobjekt. */
    _endret(del, ids) {
      const naa = ids.map((id) => this._st(id));
      const f = this._sist[del];
      if (f && f.length === naa.length && f.every((x, i) => x === naa[i])) return false;
      this._sist[del] = naa;
      return true;
    }

    _klokke() {
      const el = this.shadowRoot && this.shadowRoot.getElementById("klokke");
      if (!el) return;
      const d = new Date();
      const dag = d.toLocaleDateString("nb-NO", { weekday: "long" });
      el.innerHTML = `<b>${d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}</b>
        <span><i>${dag.charAt(0).toUpperCase() + dag.slice(1)}</i><small>${d.toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}</small></span>`;
    }

    _tegnTopp() {
      const t = this._c.topp;
      if (!this._endret("topp", [t.vaer, t.hjemme, t.las, t.alarm, t.stovsuger])) return;
      const pille = (ikon, tekst, { id, sti, fylt, farge, tap = sti ? "gaa" : "mer" } = {}) =>
        `<button class="pille ${fylt ? "fylt" : ""}" data-tap="${tap}" ${sti ? `data-sti="${esc(sti)}"` : ""}
          ${id ? `data-id="${esc(id)}" data-hold="${esc(id)}"` : ""}>
          <ha-icon icon="${ikon}" ${farge && !fylt ? `style="color:${farge}"` : ""}></ha-icon><span>${esc(tekst)}</span></button>`;
      const deler = [];
      const v = this._st(t.vaer);
      if (v) {
        const [tekst, ikon] = VAER[v.state] || [v.state, "mdi:weather-cloudy"];
        const g = v.attributes.temperature;
        deler.push(pille(ikon, `${g != null ? Math.round(g) + "° · " : ""}${tekst}`, { id: t.vaer, sti: t.vaer_trykk, farge: "var(--yellow)" }));
      }
      const h = this._st(t.hjemme);
      if (h) deler.push(pille("mdi:account-multiple", `${h.state} hjemme`, { id: t.hjemme, sti: t.hjemme_trykk }));
      const l = this._st(t.las);
      if (l) deler.push(pille(l.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant", LAS[l.state] || "Lås",
        { id: t.las, sti: t.las_trykk, farge: l.state === "locked" ? "var(--green)" : "var(--red)", fylt: l.state === "jammed" }));
      const a = this._st(t.alarm);
      if (a) deler.push(pille(a.state === "disarmed" ? "mdi:shield-off-outline" : "mdi:shield-check", ALARM[a.state] || a.state,
        { id: t.alarm, sti: t.alarm_trykk, fylt: a.state === "triggered" }));
      const s = this._st(t.stovsuger);
      if (s) deler.push(pille("mdi:robot-vacuum", STOV[s.state] || s.state, { id: t.stovsuger, sti: t.stovsuger_trykk, fylt: s.state === "cleaning" }));
      if (t.innstillinger) deler.push(`<button class="pille rund" data-tap="gaa" data-sti="${esc(t.innstillinger)}" aria-label="Innstillinger"><ha-icon icon="mdi:cog-outline"></ha-icon></button>`);
      this.shadowRoot.getElementById("topp").innerHTML = `<div class="klokke" id="klokke"></div>${deler.join("")}`;
      this._klokke();
    }

    _tegnScener() {
      const sc = this._c.scener || [];
      const vert = this.shadowRoot.getElementById("scener");
      if (!sc.length) { vert.innerHTML = ""; return; }
      if (!this._endret("scener", sc.map((s) => s.aktiv || s.entity).filter(Boolean))) return;
      vert.innerHTML = `<div class="kort"><div class="navn">${esc(this._c.scener_tittel || "Scener")}</div><div class="scener">
        ${sc.map((s, i) => {
          const aktivId = s.aktiv || null;
          const aktiv = aktivId ? this._optFor(aktivId, "state", (this._st(aktivId) || {}).state) === "on" : false;
          const hold = s.entity || aktivId || (s.tap_action && s.tap_action.target && [].concat(s.tap_action.target.entity_id)[0]) || "";
          return `<button class="scene ${aktiv ? "aktiv" : ""}" data-tap="scene" data-i="${i}" ${hold ? `data-hold="${esc(hold)}"` : ""}>
            <span class="ik"><ha-icon icon="${esc(s.ikon || s.icon || "mdi:palette-outline")}"></ha-icon></span>${esc(s.navn || s.name || "")}</button>`;
        }).join("")}</div></div>`;
    }

    _tegnKlima() {
      const ids = this._ids(this._c.klima);
      const vert = this.shadowRoot.getElementById("klima");
      if (!ids.length) { vert.innerHTML = ""; return; }
      if (!this._endret("klima", ids.map((x) => x.entity))) return;
      vert.innerHTML = `<div class="klima">${ids.map((x) => {
        const st = this._st(x.entity);
        if (!st) return "";
        const a = st.attributes;
        const mal = this._optFor(x.entity, "temp", Number(a.temperature), (o, f) => Math.abs(o - f) < 0.01);
        const venter = this._opt[x.entity] && this._opt[x.entity].temp != null;
        const varmer = a.hvac_action === "heating";
        const hva = { heating: "Varmer", idle: "Venter", off: "Av", cooling: "Kjøler", fan: "Vifte" }[a.hvac_action] || (st.state === "off" ? "Av" : "På");
        const rom = a.current_temperature != null ? ` · rommet ${komma(a.current_temperature, 1)}°` : "";
        return `<div class="kort">
          <button class="hode" data-tap="mer" data-id="${esc(x.entity)}" data-hold="${esc(x.entity)}">
            <span class="ik ${varmer ? "varm" : ""}"><ha-icon icon="${esc(x.ikon || (/panel|ovn|radiator/i.test(x.entity) ? "mdi:radiator" : "mdi:fire"))}"></ha-icon></span>
            <span><div class="navn">${esc(x.navn || a.friendly_name || x.entity)}</div><div class="liten">${hva}${rom}</div></span><span></span></button>
          <div class="termo ${venter ? "venter" : ""}">
            <button class="rund" data-tap="temp" data-id="${esc(x.entity)}" data-steg="-1" aria-label="Senk"><ha-icon icon="mdi:minus"></ha-icon></button>
            <b>${isNaN(mal) ? "–" : komma(mal, 1)}<small>°</small></b>
            <button class="rund" data-tap="temp" data-id="${esc(x.entity)}" data-steg="1" aria-label="Øk"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div></div>`;
      }).join("")}</div>`;
    }

    /* Timeprisene for i dag, som i ki-strompris-card: raw_today (Nord Pool),
       prices_today (objektliste) eller today (tall). */
    _priser(id) {
      const s = this._st(id); if (!s) return null;
      const a = s.attributes;
      const obj = a.raw_today || a.prices_today || a.today_raw;
      if (Array.isArray(obj) && obj.length && typeof obj[0] === "object") {
        return obj.map((p) => ({ t: new Date(p.start || p.startsAt || p.time || p.hour).getTime(),
          v: Number(p.value !== undefined ? p.value : p.price !== undefined ? p.price : p.total) }));
      }
      if (Array.isArray(a.today) && a.today.length) {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        const steg = TIME * (24 / a.today.length);
        return a.today.map((v, i) => ({ t: d.getTime() + i * steg, v: Number(v) }));
      }
      return null;
    }

    _prisKilde() {
      if (this._c.strom.pris) return this._c.strom.pris;
      if (this._autoPris && this._st(this._autoPris)) return this._autoPris;
      const S = this._hass.states;
      this._autoPris = Object.keys(S).find((id) => id.startsWith("sensor.") && Array.isArray(S[id].attributes.raw_today));
      return this._autoPris;
    }

    _pris(s, e, ned) {
      const r = s.getBoundingClientRect();
      const n = s.querySelectorAll("i").length;
      if (!n) return;
      const i = Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / (r.width || 1)) * n)));
      if (ned) { try { s.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } }
      if (this._prisPek === i) return;
      this._prisPek = i;
      if (ned) this._haptikk("selection");
      this._sist.strom = null;
      this._tegnStrom();
    }

    _tegnStrom() {
      const c = this._c.strom;
      if (c === false || c.vis === false) return;
      const kilde = this._prisKilde();
      if (!this._endret("strom", [kilde, c.effekt])) return;
      const vert = this.shadowRoot.getElementById("strom");
      const p = (this._priser(kilde) || []).filter((x) => !isNaN(x.v));
      const eff = this._st(c.effekt);
      const naa = Date.now();
      const iNaa = p.findIndex((x, i) => x.t <= naa && (i === p.length - 1 || p[i + 1].t > naa));
      const prisNaa = iNaa >= 0 ? p[iNaa].v : Number((this._st(kilde) || {}).state);
      const maks = Math.max(...p.map((x) => x.v), 0.01);
      const sortert = p.map((x) => x.v).sort((a, b) => a - b);
      const kv = (q) => sortert[Math.floor(q * (sortert.length - 1))] || 0;
      const klasse = (v) => (v <= kv(0.33) ? "bil" : v <= kv(0.72) ? "mid" : "dyr");
      const pek = this._prisPek;
      let lapp = "";
      if (pek != null && p[pek]) {
        const d = new Date(p[pek].t);
        lapp = `<div class="lapp" style="left:${((pek + 0.5) / p.length) * 100}%"><b>${komma(p[pek].v, 2)} kr</b>
          <span>kl. ${String(d.getHours()).padStart(2, "0")}–${String((d.getHours() + 1) % 24).padStart(2, "0")}</span></div>`;
      }
      const effekt = eff ? Number(eff.state) : NaN;
      vert.innerHTML = `<div class="kort">
        <button class="hode" data-tap="gaa" data-sti="${esc(c.trykk || "")}" ${kilde ? `data-hold="${esc(kilde)}"` : ""}>
          <span class="ik"><ha-icon icon="mdi:lightning-bolt"></ha-icon></span>
          <span><div class="navn">Strøm nå</div><div class="tall">${komma(prisNaa, 2)} <small>kr/kWh</small></div></span>
          ${!isNaN(effekt) ? `<span style="text-align:right"><div class="navn">Effekt</div><div class="tall">${komma(effekt, 0)} <small>W</small></div></span>` : "<span></span>"}
        </button>
        ${p.length ? `<div class="soyler ${pek != null ? "peker" : ""}">
          ${p.map((x, i) => `<i class="${klasse(x.v)} ${i === iNaa ? "naa" : ""} ${i < iNaa ? "forbi" : ""} ${i === pek ? "valgt" : ""}"
            style="height:${Math.max(3, (x.v / maks) * 100).toFixed(1)}%"></i>`).join("")}
          ${lapp}</div>
        <div class="akse"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>` : ""}
      </div>`;
    }

    _tegnLys() {
      const k = this._c.lys;
      const vert = this.shadowRoot.getElementById("lys");
      if (!k) { vert.innerHTML = ""; return; }
      const lamper = this._ids(k.lamper);
      if (!this._endret("lys", [k.gruppe, ...lamper.map((x) => x.entity)])) return;
      const g = this._st(k.gruppe);
      const pa = lamper.filter((x) => this._optFor(x.entity, "state", (this._st(x.entity) || {}).state) === "on").length;
      vert.innerHTML = `<div class="kort">
        <button class="hode" data-tap="${k.gruppe ? "veksle" : "mer"}" data-id="${esc(k.gruppe || "")}" ${k.gruppe ? `data-hold="${esc(k.gruppe)}"` : ""}>
          <span class="ik ${pa ? "fylt" : ""}"><ha-icon icon="${esc(k.ikon || "mdi:lightbulb-group")}"></ha-icon></span>
          <span><div class="navn">${esc(k.navn || "Lys i stua")}</div><div class="status">${lamper.length ? `${pa} av ${lamper.length} på` : (g && g.state === "on" ? "På" : "Av")}</div></span><span></span></button>
        ${lamper.map((x) => {
          const st = this._st(x.entity);
          if (!st) return "";
          const erPa = this._optFor(x.entity, "state", st.state) === "on";
          const faktiskPst = st.attributes.brightness ? Math.round(st.attributes.brightness / 2.55) : erPa ? 100 : 0;
          const pst = erPa ? this._optFor(x.entity, "pst", faktiskPst, (o, f) => Math.abs(o - f) <= 2) : 0;
          const kanDimmes = st.attributes.supported_color_modes ? !st.attributes.supported_color_modes.every((m) => m === "onoff") : true;
          return `<div class="lampe">
            <button class="ln" style="text-align:left" data-tap="veksle" data-id="${esc(x.entity)}" data-hold="${esc(x.entity)}">${esc(x.navn || st.attributes.friendly_name || x.entity)}</button>
            <span class="lv">${erPa ? (kanDimmes ? `${pst} %` : "På") : "Av"}</span>
            <button class="bryter ${erPa ? "pa" : ""}" data-tap="veksle" data-id="${esc(x.entity)}" aria-label="Slå av og på"></button>
            ${kanDimmes ? `<div class="dra ${erPa ? "" : "av"}" data-slag="lys" data-id="${esc(x.entity)}"><i style="width:${pst}%"></i><b style="left:${pst}%"></b></div>` : ""}
          </div>`;
        }).join("")}
      </div>`;
    }

    _tegnDekker() {
      const dk = this._c.dekker || [];
      const vert = this.shadowRoot.getElementById("dekker");
      if (!dk.length) { vert.innerHTML = ""; return; }
      const alle = dk.flatMap((d) => [d.hoved, ...(d.deler || []).map((x) => x.entity)]).filter(Boolean);
      if (!this._endret("dekker", alle)) return;
      vert.innerHTML = dk.map((d, i) => {
        const inv = d.invertert !== false;
        const vis = (id) => {
          const st = this._st(id);
          const pos = this._optFor(id, "pos", st ? Math.round(st.attributes.current_position || 0) : 0, (o, f) => Math.abs(o - f) <= 2);
          return inv ? 100 - pos : pos;
        };
        const deler = (d.deler && d.deler.length ? d.deler : [{ navn: "", entity: d.hoved }]).filter((x) => this._st(x.entity));
        const snitt = deler.length ? Math.round(deler.reduce((s, x) => s + vis(x.entity), 0) / deler.length) : 0;
        const tekst = inv ? (snitt <= 2 ? "Oppe" : snitt >= 98 ? "Nede" : `${snitt} % nede`) : (snitt >= 98 ? "Åpen" : snitt <= 2 ? "Lukket" : `${snitt} % åpen`);
        return `<div class="kort" style="${i ? "margin-top:14px" : ""}">
          <button class="hode" data-tap="mer" data-id="${esc(d.hoved || deler[0] && deler[0].entity)}" data-hold="${esc(d.hoved || deler[0] && deler[0].entity)}">
            <span class="ik"><ha-icon icon="${esc(d.ikon || "mdi:blinds")}"></ha-icon></span>
            <span><div class="navn">${esc(d.navn || "")}</div><div class="status">${tekst}</div></span><span></span></button>
          ${deler.map((x) => {
            const v = vis(x.entity);
            return `<div class="del"><span class="dn">${esc(x.navn || "")}</span>
              <div class="dra" data-slag="dekke" data-inv="${inv ? 1 : 0}" data-id="${esc(x.entity)}"><i style="width:${v}%"></i><b style="left:${v}%"></b></div>
              <span class="dv">${v} %</span></div>`;
          }).join("")}
          <div class="preset">${[0, 25, 50, 75, 100].map((v) =>
            `<button class="${Math.abs(snitt - v) <= 5 ? "valgt" : ""}" data-tap="preset" data-i="${i}" data-v="${v}">${v} %</button>`).join("")}</div>
        </div>`;
      }).join("");
    }
  }

  if (!customElements.get("ki-veggpanel-card")) customElements.define("ki-veggpanel-card", KiVeggpanelCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-veggpanel-card"))
    window.customCards.push({ type: "ki-veggpanel-card", name: "KI Veggpanel",
      description: "Hele veggpanelet for et rom som ett kort: toppstripe, scener, media, klima, strøm, lys og gardiner.", preview: false });
  console.info(`%c KI-VEGGPANEL %c ${VERSJON} `, "color:#fff;background:#463a40", "color:#463a40;background:#efc6c9");
})();

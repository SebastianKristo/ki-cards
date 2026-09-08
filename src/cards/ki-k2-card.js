/**
 * ki-k2-card.js
 * Creality K2 — printer, CFS, vifter og energi i ett kort med to visninger.
 *
 *  Enkel     : kamera/forhåndsvisning, status med fremdriftsring, styreknapper,
 *              temperaturer og filamentslots
 *  Avansert  : alt over + temperaturmål, vifter, utskriftstuning, posisjon,
 *              energi og kostnad, systeminfo
 *
 * Kopier til /config/www/ki-k2-card.js og legg til som ressurs:
 *   URL:  /local/ki-k2-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-k2-card
 */

const KI_K2_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-K2-CARD %c ${KI_K2_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#fc6d09;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const STATUS_NO = {
  idle: "Klar", standby: "Klar", ready: "Klar",
  printing: "Skriver ut", running: "Skriver ut", busy: "Opptatt",
  paused: "Pauset", pausing: "Pauser",
  complete: "Ferdig", completed: "Ferdig", finished: "Ferdig",
  stopped: "Stoppet", cancelled: "Avbrutt", canceled: "Avbrutt",
  error: "Feil", offline: "Frakoblet", unavailable: "Utilgjengelig", unknown: "Ukjent",
  preheating: "Forvarmer", heating: "Varmer",
};

const AKTIV = ["printing", "running", "busy", "paused", "pausing", "preheating", "heating"];

const escK = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfK = (v, dec) => { const n = Number(v); return isFinite(n) ? n.toFixed(dec).replace(".", ",") : "–"; };

/** Sekunder eller "H:MM:SS" → "2 t 14 min" */
function varighet(raw) {
  if (raw === undefined || raw === null || raw === "") return "–";
  let sek = Number(raw);
  if (!isFinite(sek)) {
    const d = String(raw).split(":").map(Number);
    if (d.length === 3 && d.every((x) => isFinite(x))) sek = d[0] * 3600 + d[1] * 60 + d[2];
    else if (d.length === 2 && d.every((x) => isFinite(x))) sek = d[0] * 60 + d[1];
    else return String(raw);
  }
  if (sek < 0) return "–";
  if (sek < 60) return `${Math.round(sek)} sek`;
  const min = Math.round(sek / 60);
  if (min < 60) return `${min} min`;
  const t = Math.floor(min / 60);
  const r = min % 60;
  if (t < 24) return r ? `${t} t ${r} min` : `${t} t`;
  return `${Math.floor(t / 24)} d ${t % 24} t`;
}

/** "#FF0000", "FF0000" eller "255,0,0" → gyldig css-farge */
function fargeAv(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i.test(s)) return s.length > 7 ? s.slice(0, 7) : s;
  if (/^([0-9a-f]{6,8})$/i.test(s)) return "#" + s.slice(0, 6);
  if (/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(s)) return `rgb(${s})`;
  if (/^[a-z]+$/i.test(s) && s !== "unknown" && s !== "unavailable") return s;
  return null;
}

class KiK2Card extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-k2-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-k2-card", default_view: "enkel" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._media = "kamera";
    this._bekreft = false;
    this._pending = {};
    this._timers = {};
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "creality_k2",
        title: "",
        default_view: "enkel",
        remember_view: true,
        show_media: true,
        show_cfs: true,
        show_energi: true,
        romvifte: "fan.baderomsvifte",
        homey_flow: "button.homey_flows_02_creality_k2_bryter",
        cfs_slots: 4,
      },
      config || {}
    );
    this._p = this._config.prefix || "creality_k2";
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 24 : 14; }

  s(n) { return `sensor.${this._p}_${n}`; }
  nu(n) { return `number.${this._p}_${n}`; }
  bt(n) { return `button.${this._p}_${n}`; }
  fa(n) { return `fan.${this._p}_${n}`; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-k2-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-k2-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|" + this._media + "|";
    for (const id of this._watched) sig += ((hass.states[id] || {}).state || "-") + ",";
    if (sig !== this._sig) { this._sig = sig; this._update(); }
    if (this._mediaEl) this._mediaEl.hass = hass;
  }

  /* ------------------------------------------------------------ *
   * Bygg
   * ------------------------------------------------------------ */

  _build() {
    this._watched = new Set();
    const c = this._config;

    this.shadowRoot.innerHTML = `<style>${KiK2Card.styles}</style>
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escK(c.title)}</div>` : ""}
          ${this._statusHtml()}
          ${c.show_media ? this._mediaHtml() : ""}
          ${this._knapperHtml()}
          ${this._switchHtml()}
          ${this._tempHtml()}
          ${c.show_cfs ? this._cfsHtml() : ""}
          <div class="avansert-kun">
            ${this._vifterHtml()}
            ${this._tuningHtml()}
            ${c.show_energi ? this._energiHtml() : ""}
            ${this._systemHtml()}
          </div>
        </div>
      </ha-card>`;

    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._root.addEventListener("input", (e) => this._onInput(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _statusHtml() {
    ["print_status", "print_progress", "print_time_left", "print_job_time", "working_layer", "total_layers", "current_object"]
      .forEach((x) => this._watched.add(this.s(x)));
    return `
      <div class="status" id="status">
        <div class="ring" data-action="more" data-entity="${this.s("print_progress")}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-spor" cx="50" cy="50" r="43"></circle>
            <circle class="ring-fyll" id="ring-fyll" cx="50" cy="50" r="43"></circle>
          </svg>
          <div class="ring-tall" id="ring-tall">–</div>
        </div>
        <div class="status-tekst">
          <div class="status-navn" id="status-navn">–</div>
          <div class="status-jobb" id="status-jobb">–</div>
          <div class="status-detalj" id="status-detalj">–</div>
        </div>
      </div>`;
  }

  _mediaHtml() {
    return `
      <div class="media">
        <div class="media-bytt">
          <div class="media-valg" data-action="media" data-media="kamera">Kamera</div>
          <div class="media-valg" data-action="media" data-media="preview">Modell</div>
        </div>
        <div class="media-flate" id="media-flate"></div>
      </div>`;
  }

  _knapperHtml() {
    const knapper = [
      { key: "pause",  icon: "mdi:pause",        navn: "Pause",  ent: this.bt("pause_print"),  type: "button" },
      { key: "resume", icon: "mdi:play",         navn: "Fortsett", ent: this.bt("resume_print"), type: "button" },
      { key: "stop",   icon: "mdi:stop",         navn: "Stopp",  ent: this.bt("stop_print"),   type: "button", bekreft: true },
      { key: "light",  icon: "mdi:lightbulb",    navn: "Lys",    ent: `light.${this._p}_light`, type: "light" },
      { key: "power",  icon: "mdi:power",        navn: "Strøm",  ent: `switch.${this._p}`,      type: "switch", bekreft: true },
      { key: "home",   icon: "mdi:home-import-outline", navn: "Home", ent: this.bt("home_xy_then_z"), type: "button", avansert: true },
    ];
    return `
      <div class="knapper">
        ${knapper.map((k) => {
          this._watched.add(k.ent);
          return `
            <div class="knapp k-${k.key} ${k.avansert ? "avansert-kun" : ""}"
                 data-action="btn" data-key="${k.key}" data-type="${k.type}" data-entity="${k.ent}"
                 data-bekreft="${k.bekreft ? "1" : ""}" tabindex="0" role="button">
              <div class="knapp-sirkel"><ha-icon icon="${k.icon}"></ha-icon></div>
              <div class="knapp-navn">${escK(k.navn)}</div>
            </div>`;
        }).join("")}
      </div>`;
  }

  _switchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _tempHtml() {
    const t = [
      { navn: "Dyse",    icon: "mdi:printer-3d-nozzle-heat", nå: this.s("nozzle_temperature"),  mål: this.nu("nozzle_target"),  maks: this.s("max_nozzle_temperature") },
      { navn: "Plate",   icon: "mdi:heating-coil",           nå: this.s("bed_temperature"),     mål: this.nu("bed_target"),     maks: this.s("max_bed_temperature") },
      { navn: "Kammer",  icon: "mdi:home-thermometer",       nå: this.s("chamber_temperature"), mål: this.nu("chamber_target"), maks: this.s("max_chamber_temperature") },
    ];
    t.forEach((x) => { this._watched.add(x.nå); this._watched.add(x.mål); });
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Temperatur</span><span class="blokk-sub" id="temp-sub"></span></div>
        <div class="temp-rutenett">
          ${t.map((x) => `
            <div class="temp" data-action="more" data-entity="${x.nå}">
              <ha-icon icon="${x.icon}"></ha-icon>
              <div class="temp-navn">${escK(x.navn)}</div>
              <div class="temp-verdi"><span data-bind="num" data-entity="${x.nå}" data-dec="0" data-unit="°">–</span><span class="temp-mal" data-bind="mal" data-entity="${x.mål}"></span></div>
            </div>`).join("")}
        </div>
        <div class="avansert-kun">
          ${t.map((x) => `
            <div class="slider-rad">
              <div class="slider-topp">
                <div class="slider-navn" data-action="more" data-entity="${x.mål}">${escK(x.navn)} — mål</div>
                <div class="slider-verdi" data-bind="num" data-entity="${x.mål}" data-dec="0" data-unit=" °C">–</div>
              </div>
              <input class="slider" type="range" data-bind="range" data-domain="number" data-entity="${x.mål}">
            </div>`).join("")}
        </div>
      </div>`;
  }

  _cfsHtml() {
    const n = Math.min(4, Math.max(1, Number(this._config.cfs_slots) || 4));
    const aktiv = this.s("active_filament_slot");
    this._watched.add(aktiv);
    ["cfs_box_1_temperature", "cfs_box_1_humidity", "cfs_external_filament", "cfs_external_color", "cfs_external_remaining", "filament_status"]
      .forEach((x) => this._watched.add(this.s(x)));

    let slots = "";
    for (let i = 1; i <= n; i++) {
      const f = this.s(`cfs_box_1_slot_${i}_filament`);
      const c = this.s(`cfs_box_1_slot_${i}_color`);
      const r = this.s(`cfs_box_1_slot_${i}_remaining`);
      [f, c, r].forEach((x) => this._watched.add(x));
      slots += `
        <div class="slot" data-slot="${i}" data-action="more" data-entity="${f}">
          <div class="slot-farge" data-bind="farge" data-entity="${c}"><span class="slot-nr">${i}</span></div>
          <div class="slot-navn" data-bind="tekst" data-entity="${f}">–</div>
          <div class="slot-spor"><div class="slot-fyll" data-bind="pct" data-entity="${r}"></div></div>
          <div class="slot-pct" data-bind="num" data-entity="${r}" data-dec="0" data-unit=" %">–</div>
        </div>`;
    }

    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Filament (CFS)</span><span class="blokk-sub" id="cfs-sub">–</span></div>
        <div class="slots">${slots}</div>
        <div class="avansert-kun">
          <div class="rad rad-les" data-action="more" data-entity="${this.s("cfs_external_filament")}">
            <div class="prikk" data-bind="farge-prikk" data-entity="${this.s("cfs_external_color")}"></div>
            <div class="rad-navn">Ekstern spole</div>
            <div class="rad-verdi"><span data-bind="tekst" data-entity="${this.s("cfs_external_filament")}">–</span> · <span data-bind="num" data-entity="${this.s("cfs_external_remaining")}" data-dec="0" data-unit=" %">–</span></div>
          </div>
          <div class="rad rad-les" data-action="more" data-entity="${this.s("filament_status")}">
            <div class="prikk"></div>
            <div class="rad-navn">Filamentstatus</div>
            <div class="rad-verdi" data-bind="tekst" data-entity="${this.s("filament_status")}">–</div>
          </div>
        </div>
      </div>`;
  }

  _vifterHtml() {
    const vifter = [
      { ent: this.fa("model_fan"), navn: "Modellvifte", icon: "mdi:fan" },
      { ent: this.fa("side_fan"),  navn: "Sidevifte",   icon: "mdi:fan" },
      { ent: this.fa("case_fan"),  navn: "Kabinettvifte", icon: "mdi:fan-chevron-up" },
    ];
    if (this._config.romvifte) vifter.push({ ent: this._config.romvifte, navn: "Baderomsvifte", icon: "mdi:air-filter", rom: true });
    vifter.forEach((v) => this._watched.add(v.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Vifter</span><span class="blokk-sub">Baderomsvifta lufter ut damp fra utskriften</span></div>
        ${vifter.map((v) => `
          <div class="rad">
            <div class="rad-ikon ${v.rom ? "rom" : ""}" data-bind="vifte-ikon" data-entity="${v.ent}"><ha-icon icon="${v.icon}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${v.ent}">${escK(v.navn)}</div>
            <div class="rad-verdi" data-bind="vifte" data-entity="${v.ent}">–</div>
            <div class="bryter" data-toggle="${v.ent}" data-entity="${v.ent}" data-action="fan" tabindex="0" role="switch"><span class="bryter-kule"></span></div>
          </div>`).join("")}
      </div>`;
  }

  _tuningHtml() {
    const rader = [
      { ent: this.s("print_speed"),          navn: "Hastighet",       dec: 0, unit: " mm/s" },
      { ent: this.s("real_time_flow"),       navn: "Flyt nå",         dec: 1, unit: " mm³/s" },
      { ent: this.s("flow_rate"),            navn: "Flytrate",        dec: 0, unit: " %" },
      { ent: this.s("used_material_length"), navn: "Brukt materiale", dec: 1, unit: " m" },
      { ent: this.s("object_count"),         navn: "Objekter",        dec: 0, unit: "" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    ["position_x", "position_y", "position_z"].forEach((x) => this._watched.add(this.s(x)));
    this._watched.add(this.nu("print_tuning"));

    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Utskrift</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="num" data-entity="${r.ent}" data-dec="${r.dec}" data-unit="${escK(r.unit)}">–</div>
          </div>`).join("")}
        <div class="slider-rad">
          <div class="slider-topp">
            <div class="slider-navn" data-action="more" data-entity="${this.nu("print_tuning")}">Tuning</div>
            <div class="slider-verdi" data-bind="num" data-entity="${this.nu("print_tuning")}" data-dec="0" data-unit="">–</div>
          </div>
          <input class="slider" type="range" data-bind="range" data-domain="number" data-entity="${this.nu("print_tuning")}">
        </div>
        <div class="posisjon">
          <div class="pos"><span>X</span><b data-bind="num" data-entity="${this.s("position_x")}" data-dec="1" data-unit="">–</b></div>
          <div class="pos"><span>Y</span><b data-bind="num" data-entity="${this.s("position_y")}" data-dec="1" data-unit="">–</b></div>
          <div class="pos"><span>Z</span><b data-bind="num" data-entity="${this.s("position_z")}" data-dec="2" data-unit="">–</b></div>
        </div>
      </div>`;
  }

  _energiHtml() {
    const p = this._p;
    const rader = [
      { ent: `sensor.${p}_power`,   navn: "Effekt nå",     dec: 0, unit: " W" },
      { ent: `sensor.${p}_energy_hourly`, navn: "Denne timen", dec: 2, unit: " kWh" },
      { ent: `sensor.${p}_energy_daily`,  navn: "I dag",       dec: 2, unit: " kWh" },
      { ent: `sensor.${p}_energy_monthly`,navn: "Denne måneden", dec: 2, unit: " kWh" },
      { ent: `sensor.um_daily_cost_${p}_norgespris`, navn: "Kostnad i dag", dec: 2, unit: " kr" },
      { ent: `sensor.um_monthly_cost_${p}_norgespris`, navn: "Kostnad denne måneden", dec: 2, unit: " kr" },
      { ent: `sensor.cost_hour_${p}_norgespris`, navn: "Kostnad denne timen", dec: 2, unit: " kr" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Energi</span><span class="blokk-sub">Norgespris</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="num" data-entity="${r.ent}" data-dec="${r.dec}" data-unit="${escK(r.unit)}">–</div>
          </div>`).join("")}
      </div>`;
  }

  _systemHtml() {
    const rader = [
      { ent: this.s("model"),  navn: "Modell" },
      { ent: this.s("system"), navn: "System" },
      { ent: this.s("print_control"), navn: "Print control" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    const flow = this._config.homey_flow;
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>System</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="tekst" data-entity="${r.ent}">–</div>
          </div>`).join("")}
        <div class="hurtig">
          <div class="mini" data-action="btn" data-type="button" data-entity="${this.bt("reconnect")}">Koble til på nytt</div>
          ${flow ? `<div class="mini" data-action="btn" data-type="button" data-entity="${flow}">Homey: bryter</div>` : ""}
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ *
   * Oppdatering
   * ------------------------------------------------------------ */

  _update() {
    const h = this._hass;
    if (!h || !this._built) return;

    this._root.querySelectorAll("[data-bind]").forEach((el) => {
      const st = h.states[el.dataset.entity];
      const k = el.dataset.bind;

      if (k === "num") {
        el.textContent = st ? nfK(st.state, Number(el.dataset.dec ?? 0)) + (el.dataset.unit || "") : "–";
      } else if (k === "tekst") {
        const v = st ? st.state : null;
        el.textContent = !v || v === "unknown" || v === "unavailable" || v === "None" ? "–" : v;
      } else if (k === "mal") {
        const m = st ? Number(st.state) : NaN;
        el.textContent = isFinite(m) && m > 0 ? ` / ${Math.round(m)}°` : "";
      } else if (k === "pct") {
        const v = st ? Math.max(0, Math.min(100, Number(st.state))) : 0;
        el.style.width = (isFinite(v) ? v : 0) + "%";
      } else if (k === "farge" || k === "farge-prikk") {
        const f = st ? fargeAv(st.state) : null;
        el.style.background = f || "rgba(128,128,128,.30)";
        el.classList.toggle("tom", !f);
      } else if (k === "range") {
        if (!st) { el.disabled = true; return; }
        el.disabled = false;
        el.min = st.attributes.min ?? 0;
        el.max = st.attributes.max ?? 100;
        el.step = st.attributes.step ?? 1;
        if (this._root.activeElement !== el && this._pending[el.dataset.entity] === undefined) el.value = st.state;
      } else if (k === "vifte") {
        if (!st) { el.textContent = "–"; return; }
        const pct = st.attributes.percentage;
        el.textContent = st.state === "on" ? (pct !== undefined && pct !== null ? `${Math.round(pct)} %` : "På") : "Av";
      } else if (k === "vifte-ikon") {
        el.classList.toggle("spinner", !!st && st.state === "on");
      }
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      el.classList.toggle("on", !!st && st.state === "on");
      el.classList.toggle("mangler", !st);
    });

    this._updateStatus();
    this._updateKnapper();
    this._updateCfs();
    if (this._config.show_media) this._mountMedia();
  }

  _updateStatus() {
    const h = this._hass;
    const st = h.states[this.s("print_status")];
    const raw = st ? String(st.state).toLowerCase() : "";
    const navn = STATUS_NO[raw] || (st ? st.state : "–");
    const aktiv = AKTIV.includes(raw);

    const boks = this._root.getElementById("status");
    boks.dataset.tilstand = raw === "paused" ? "pauset" : raw === "error" ? "feil" : aktiv ? "aktiv" : "rolig";

    const pro = Number((h.states[this.s("print_progress")] || {}).state);
    const pct = isFinite(pro) ? Math.max(0, Math.min(100, pro)) : 0;
    const omkrets = 2 * Math.PI * 43;
    const ring = this._root.getElementById("ring-fyll");
    ring.style.strokeDasharray = `${omkrets}`;
    ring.style.strokeDashoffset = `${omkrets * (1 - pct / 100)}`;
    this._root.getElementById("ring-tall").textContent = isFinite(pro) ? `${Math.round(pct)}%` : "–";

    this._root.getElementById("status-navn").textContent = navn;

    const obj = h.states[this.s("current_object")];
    const jobb = obj && obj.state && !["unknown", "unavailable", "None", ""].includes(obj.state) ? obj.state : aktiv ? "Utskrift pågår" : "Ingen jobb";
    this._root.getElementById("status-jobb").textContent = jobb;

    const igjen = h.states[this.s("print_time_left")];
    const lag = h.states[this.s("working_layer")];
    const totalt = h.states[this.s("total_layers")];
    const del = [];
    if (aktiv && igjen) del.push(`${varighet(igjen.state)} igjen`);
    if (lag && totalt && isFinite(Number(totalt.state)) && Number(totalt.state) > 0) del.push(`Lag ${lag.state}/${totalt.state}`);
    if (!aktiv) {
      const jobbtid = h.states[this.s("print_job_time")];
      if (jobbtid && raw !== "idle") del.push(`Brukte ${varighet(jobbtid.state)}`);
    }
    this._root.getElementById("status-detalj").textContent = del.join("  ·  ") || "Klar til utskrift";

    const tempSub = this._root.getElementById("temp-sub");
    if (tempSub) tempSub.textContent = aktiv ? "Under utskrift" : "";
  }

  _updateKnapper() {
    const h = this._hass;
    const raw = String((h.states[this.s("print_status")] || {}).state || "").toLowerCase();
    const skriver = ["printing", "running", "busy"].includes(raw);
    const pauset = raw === "paused";
    const aktiv = AKTIV.includes(raw);

    const sett = (key, mulig) => {
      const el = this._root.querySelector(`.knapp.k-${key}`);
      if (el) el.classList.toggle("inaktiv", !mulig);
    };
    sett("pause", skriver);
    sett("resume", pauset);
    sett("stop", aktiv);
    sett("home", !aktiv);

    ["light", "power"].forEach((key) => {
      const el = this._root.querySelector(`.knapp.k-${key}`);
      if (!el) return;
      const st = h.states[el.dataset.entity];
      el.classList.toggle("på", !!st && st.state === "on");
      el.classList.toggle("mangler", !st);
    });
  }

  _updateCfs() {
    const sub = this._root.getElementById("cfs-sub");
    if (!sub) return;
    const a = this._hass.states[this.s("active_filament_slot")];
    const boks = this._hass.states[this.s("cfs_box_1_temperature")];
    const fukt = this._hass.states[this.s("cfs_box_1_humidity")];
    const del = [];
    if (boks) del.push(`${nfK(boks.state, 0)} °C`);
    if (fukt) del.push(`${nfK(fukt.state, 0)} % RF`);
    sub.textContent = del.join(" · ");

    const nr = a ? parseInt(a.state, 10) : NaN;
    this._root.querySelectorAll(".slot").forEach((el) => {
      el.classList.toggle("aktiv", isFinite(nr) && Number(el.dataset.slot) === nr);
    });
  }

  async _mountMedia() {
    const flate = this._root.getElementById("media-flate");
    if (!flate) return;
    this._root.querySelectorAll(".media-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.media === this._media));
    if (flate.dataset.type === this._media) return;

    try {
      const helpers = await window.loadCardHelpers();
      const conf = this._media === "kamera"
        ? { type: "picture-entity", entity: `camera.${this._p}_printer_camera`, camera_view: "live", show_state: false, show_name: false }
        : { type: "picture-entity", entity: `image.${this._p}_current_print_preview`, show_state: false, show_name: false };
      const el = helpers.createCardElement(conf);
      el.hass = this._hass;
      flate.innerHTML = "";
      flate.appendChild(el);
      flate.dataset.type = this._media;
      this._mediaEl = el;
    } catch (e) {
      flate.textContent = "Kunne ikke laste bildet.";
    }
  }

  /* ------------------------------------------------------------ *
   * Interaksjon
   * ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "more") {
      this._moreInfo(el.dataset.entity);
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "media") {
      this._media = el.dataset.media;
      this._mountMedia();
      this._haptic("selection");
    } else if (a === "fan") {
      const st = this._hass.states[el.dataset.entity];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("fan", st.state === "on" ? "turn_off" : "turn_on", { entity_id: el.dataset.entity });
    } else if (a === "btn") {
      this._trykk(el);
    }
  }

  _trykk(el) {
    if (el.classList.contains("inaktiv") || el.classList.contains("mangler")) return;
    const id = el.dataset.entity;
    const type = el.dataset.type;

    if (el.dataset.bekreft === "1" && this._bekreft !== id) {
      this._bekreft = id;
      el.classList.add("bekreft");
      this._haptic("warning");
      clearTimeout(this._bekreftTimer);
      this._bekreftTimer = setTimeout(() => {
        this._bekreft = false;
        this._root.querySelectorAll(".bekreft").forEach((n) => n.classList.remove("bekreft"));
      }, 4000);
      return;
    }
    clearTimeout(this._bekreftTimer);
    this._bekreft = false;
    el.classList.remove("bekreft");
    this._haptic("medium");

    if (type === "button") this._hass.callService("button", "press", { entity_id: id });
    else if (type === "light") {
      const st = this._hass.states[id];
      this._hass.callService("light", st && st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    } else if (type === "switch") {
      const st = this._hass.states[id];
      this._hass.callService("switch", st && st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    }
  }

  _onInput(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    this._pending[el.dataset.entity] = Number(el.value);
    const vis = this._root.querySelector(`[data-bind="num"][data-entity="${el.dataset.entity}"]`);
    if (vis) vis.textContent = nfK(el.value, Number(vis.dataset.dec ?? 0)) + (vis.dataset.unit || "");
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    const id = el.dataset.entity;
    const verdi = Number(el.value);
    clearTimeout(this._timers[id]);
    this._timers[id] = setTimeout(() => {
      delete this._pending[id];
      this._hass.callService("number", "set_value", { entity_id: id, value: verdi });
    }, 300);
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) { this._lagreView(this._view); this._haptic("selection"); }
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
  }

  _moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }
  _haptic(type) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  /* ------------------------------------------------------------ *
   * Stil
   * ------------------------------------------------------------ */

  static get styles() {
    return `
      :host { display:block; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0; }
      .wrap { display:flex; flex-direction:column; gap:10px; color: var(--gray1000, var(--primary-text-color)); }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Status */
      .status { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:16px; }
      .ring { position:relative; width:88px; height:88px; cursor:pointer; }
      .ring svg { width:88px; height:88px; transform: rotate(-90deg); }
      .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
      .ring-spor { stroke: rgba(128,128,128,.24); }
      .ring-fyll { stroke: var(--gray1000, var(--primary-text-color));
        transition: stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1), stroke .3s ease; }
      .status[data-tilstand="aktiv"] .ring-fyll { stroke: var(--green, #4caf50); }
      .status[data-tilstand="pauset"] .ring-fyll { stroke: var(--orange, #fc6d09); }
      .status[data-tilstand="feil"] .ring-fyll { stroke: var(--red, #f44336); }
      .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:19px; font-weight:600; font-variant-numeric:tabular-nums; }
      .status-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .status-jobb { font-size:14px; opacity:.8; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .status-detalj { font-size:13px; opacity:.6; margin-top:2px; }

      /* Media */
      .media { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px; }
      .media-bytt { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:2px 2px 8px; }
      .media-valg { text-align:center; padding:7px 0; border-radius:75px; font-size:13px; cursor:pointer; opacity:.6;
        background: rgba(128,128,128,.16); }
      .media-valg.aktiv { background: rgba(128,128,128,.30); opacity:1; font-weight:600; }
      .media-flate { border-radius:18px; overflow:hidden; min-height:120px; background: rgba(0,0,0,.2); }
      .media-flate ha-card { background:none; border:none; box-shadow:none; }

      /* Knapper */
      .knapper { display:flex; justify-content:space-between; gap:6px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:12px 10px; }
      .knapp { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; }
      .knapp-sirkel { width:54px; height:54px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.18); transition: background .18s ease, color .18s ease; }
      .knapp-sirkel ha-icon { --mdc-icon-size:26px; }
      .knapp-navn { font-size:12px; opacity:.7; }
      .knapp:active .knapp-sirkel { transform: scale(.94); }
      .knapp.inaktiv { opacity:.32; pointer-events:none; }
      .knapp.mangler { opacity:.25; pointer-events:none; }
      .k-pause .knapp-sirkel { background: rgba(252,109,9,.90); color:#fff; }
      .k-resume .knapp-sirkel { background: rgba(76,175,80,.90); color:#fff; }
      .k-stop .knapp-sirkel { background: rgba(244,67,54,.95); color:#fff; }
      .k-light.på .knapp-sirkel { background: rgba(255,235,59,.95); color:#000; }
      .k-power.på .knapp-sirkel { background: var(--active-big, var(--primary-color)); color: var(--gray100,#fafbfc); }
      .knapp.bekreft .knapp-sirkel { outline:3px solid var(--gray1000, var(--primary-text-color)); outline-offset:2px; }
      .knapp.bekreft .knapp-navn::after { content:" — trykk igjen"; }

      /* Visningsbryter */
      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; opacity:.6; transition: background .18s ease, opacity .18s ease, color .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      /* Blokk */
      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 14px; }
      .blokk + .blokk { margin-top:10px; }
      .avansert-kun > .blokk:first-child { margin-top:0; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px 8px; }
      .blokk-sub { font-weight:500; text-align:right; }

      /* Temperatur */
      .temp-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .temp { background: rgba(128,128,128,.12); border-radius:18px; padding:12px 8px; text-align:center; cursor:pointer; }
      .temp ha-icon { --mdc-icon-size:22px; opacity:.8; }
      .temp-navn { font-size:12px; opacity:.65; margin-top:2px; }
      .temp-verdi { font-size:17px; font-weight:600; font-variant-numeric:tabular-nums; margin-top:2px; }
      .temp-mal { font-size:13px; opacity:.55; font-weight:500; }

      /* Slots */
      .slots { display:flex; flex-direction:column; gap:8px; }
      .slot { display:grid; grid-template-columns:38px 1fr 90px 48px; align-items:center; gap:10px;
        padding:6px 8px; border-radius:16px; cursor:pointer; background: rgba(128,128,128,.10); }
      .slot.aktiv { background: rgba(128,128,128,.22); box-shadow: inset 0 0 0 2px var(--active-big, var(--primary-color)); }
      .slot-farge { width:34px; height:34px; border-radius:10px; position:relative;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); }
      .slot-nr { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:#fff; text-shadow:0 0 3px rgba(0,0,0,.7); }
      .slot-navn { font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .slot-spor { height:7px; border-radius:4px; background: rgba(128,128,128,.26); overflow:hidden; }
      .slot-fyll { height:100%; width:0%; border-radius:4px; background: var(--gray1000, var(--primary-text-color)); opacity:.75;
        transition: width .5s ease; }
      .slot-pct { font-size:13px; font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }

      /* Rader */
      .rad { display:grid; grid-template-columns:36px 1fr auto auto; align-items:center; gap:10px; padding:8px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-les { grid-template-columns:14px 1fr auto; cursor:pointer; }
      .rad-ikon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.14); }
      .rad-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .rad-ikon.spinner ha-icon { animation: snurr 2.4s linear infinite; }
      @keyframes snurr { to { transform: rotate(360deg); } }
      .rad-navn { font-size:14.5px; cursor:pointer; }
      .rad-verdi { font-size:14px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .prikk.usynlig { background:none; }

      .bryter { width:46px; height:28px; border-radius:75px; background: rgba(128,128,128,.28); cursor:pointer;
        position:relative; transition: background .18s ease; }
      .bryter.on { background: var(--active-big, var(--primary-color)); }
      .bryter-kule { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%;
        background:#fff; transition: transform .18s ease; }
      .bryter.on .bryter-kule { transform: translateX(18px); }

      /* Slider */
      .slider-rad { padding:10px 2px 4px; }
      .slider-topp { display:flex; justify-content:space-between; align-items:baseline; }
      .slider-navn { font-size:14.5px; font-weight:500; cursor:pointer; }
      .slider-verdi { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; margin:12px 0 4px;
        border-radius:4px; background: rgba(128,128,128,.28); outline:none; }
      .slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; border:none; }
      .slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; border:none;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; }

      /* Posisjon */
      .posisjon { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
      .pos { background: rgba(128,128,128,.12); border-radius:14px; padding:8px; text-align:center; }
      .pos span { font-size:12px; opacity:.6; margin-right:6px; }
      .pos b { font-size:14px; font-variant-numeric:tabular-nums; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); }
      .mini:active { transform: scale(.98); }

      .mangler { opacity:.4; }
      [tabindex]:focus-visible { outline:2px solid var(--active-big, var(--primary-color)); outline-offset:2px; }
      @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important; } }
      @media (max-width: 400px) {
        .status { grid-template-columns:80px 1fr; gap:10px; padding:12px; }
        .ring, .ring svg { width:76px; height:76px; }
        .knapp-sirkel { width:46px; height:46px; }
        .knapp-sirkel ha-icon { --mdc-icon-size:22px; }
        .slot { grid-template-columns:34px 1fr 60px 44px; }
      }
    `;
  }
}

customElements.define("ki-k2-card", KiK2Card);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const K2_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  { name: "romvifte", selector: { entity: { domain: ["fan", "switch"] } } },
  { name: "homey_flow", selector: { entity: { domain: "button" } } },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { name: "cfs_slots", selector: { number: { min: 1, max: 4, mode: "slider" } } },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_media", selector: { boolean: {} } },
    { name: "show_cfs", selector: { boolean: {} } },
    { name: "show_energi", selector: { boolean: {} } },
  ] },
];

const K2_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  romvifte: "Romvifte",
  homey_flow: "Homey-flow (valgfri)",
  default_view: "Standardvisning",
  cfs_slots: "Antall CFS-slots",
  remember_view: "Husk valgt visning",
  show_media: "Vis kamera og modell",
  show_cfs: "Vis filament",
  show_energi: "Vis energi",
};

class KiK2CardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) {
    this._config = Object.assign(
      { prefix: "creality_k2", default_view: "enkel", remember_view: true,
        show_media: true, show_cfs: true, show_energi: true, cfs_slots: 4 },
      config || {}
    );
    this._render();
  }

  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }

  _render() {
    if (!this._form) {
      this.shadowRoot.innerHTML = `<style>
        .info { font-size:13px; opacity:.7; padding:10px 2px 0; line-height:1.45; }
        code { background: rgba(128,128,128,.18); padding:1px 5px; border-radius:5px; }
      </style>`;
      this._form = document.createElement("ha-form");
      this._form.schema = K2_SCHEMA;
      this._form.computeLabel = (s) => K2_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = "Alle printerentiteter bygges fra prefikset, f.eks. <code>creality_k2</code> → <code>sensor.creality_k2_print_status</code>. Energisensorene følger <code>sensor.creality_k2_energy_daily</code> og <code>sensor.um_daily_cost_creality_k2_norgespris</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

customElements.define("ki-k2-card-editor", KiK2CardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-k2-card",
  name: "KI Creality K2",
  description: "3D-printer med status, kamera, filament, vifter og energi",
  preview: true,
});

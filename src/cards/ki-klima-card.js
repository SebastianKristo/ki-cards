/**
 * ki-klima-card.js
 * Klimastyring for KI-pakken (ki_klimastyring.yaml) — ett kort, to visninger.
 *
 *  Enkel     : hovedbryter, effektvakt, modus, soner med settpunkt
 *  Avansert  : alt over + unntak, effektgrenser, måltidsvinduer, tider,
 *              finjustering og diagnostikk
 *
 * Kopier til /config/www/ki-klima-card.js og legg til som ressurs:
 *   URL:  /local/ki-klima-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-klima-card
 */

const KI_KLIMA_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-KLIMA-CARD %c ${KI_KLIMA_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#4a9eff;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

/* ------------------------------------------------------------------ *
 * Datamodell — soner, tallfelt og tider. Alt bygges fra prefix (ki).
 * ------------------------------------------------------------------ */

const ZONER = [
  { key: "stue_panelovn",     navn: "Stue panelovn",     gruppe: "Stue",       icon: "mdi:radiator",     styr: "styr_stue_panelovn",       dag: "temp_stue_dag",              natt: "temp_stue_natt" },
  { key: "stue_oljefyr",      navn: "Stue oljefyr",      gruppe: "Stue",       icon: "mdi:fire",         styr: "styr_stue_oljefyr",        dag: "temp_stue_dag",              natt: "temp_stue_natt", notat: "Deler settpunkt med panelovnen" },
  { key: "trappegang",        navn: "Trappegang",        gruppe: "Trappegang", icon: "mdi:stairs",       styr: "styr_trappegang_panelovn", dag: "temp_trappegang_dag",        natt: "temp_trappegang_natt" },
  { key: "kjokken_panelovn",  navn: "Kjøkken panelovn",  gruppe: "Kjøkken",    icon: "mdi:countertop",   styr: "styr_kjokken_panelovn",    dag: "temp_kjokken_panelovn_dag",  natt: "temp_kjokken_panelovn_natt" },
  { key: "kjokken_gulvvarme", navn: "Kjøkken gulvvarme", gruppe: "Kjøkken",    icon: "mdi:heating-coil", styr: "styr_kjokken_gulvvarme",   fast: "temp_kjokken" },
  { key: "cybele",            navn: "Cybele panelovn",   gruppe: "Soverom",    icon: "mdi:bed",          styr: "styr_cybele_panelovn",     dag: "temp_cybele_dag",            natt: "temp_cybele_natt" },
  { key: "sebastian",         navn: "Sebastian panelovn",gruppe: "Soverom",    icon: "mdi:bed-king",     styr: "styr_sebastian_panelovn",  dag: "temp_sebastian_dag",         natt: "temp_sebastian_natt" },
  { key: "bad",               navn: "Bad gulvvarme",     gruppe: "Bad og do",  icon: "mdi:shower",       styr: "styr_bad_gulvvarme",       fast: "temp_bad" },
  { key: "do",                navn: "Do gulvvarme",      gruppe: "Bad og do",  icon: "mdi:toilet",       styr: "styr_do_gulvvarme",        fast: "temp_do" },
  { key: "gardiner",          navn: "Gardiner",          gruppe: "Annet",      icon: "mdi:curtains",     styr: "styr_gardiner" },
];

const UNNTAK = [
  { id: "temp_helg",           navn: "Helg",           icon: "mdi:calendar-weekend", enhet: " °C", dec: 1 },
  { id: "temp_helg_gulvvarme", navn: "Helg gulvvarme", icon: "mdi:heating-coil",     enhet: " °C", dec: 1 },
  { id: "temp_sommer",         navn: "Sommer",         icon: "mdi:weather-sunny",    enhet: " °C", dec: 1 },
];

const EFFEKT_TALL = [
  { id: "effektgrense_kwh",     navn: "Effektgrense",    icon: "mdi:flash",          enhet: " kWh", dec: 1 },
  { id: "effekt_hysterese_kwh", navn: "Hysterese",       icon: "mdi:swap-vertical",  enhet: " kWh", dec: 1 },
  { id: "reserve_frokost_kwh",  navn: "Reserve frokost", icon: "mdi:coffee",         enhet: " kWh", dec: 1 },
  { id: "reserve_middag_kwh",   navn: "Reserve middag",  icon: "mdi:silverware-fork-knife", enhet: " kWh", dec: 1 },
];

const JUSTERING = [
  { id: "stagger_minutter",      navn: "Stagger mellom soner", icon: "mdi:timer-outline",   enhet: " min",    dec: 0 },
  { id: "natt_senk_ute_grense",  navn: "Natt-senk utegrense",  icon: "mdi:thermometer-low", enhet: " °C",     dec: 1 },
  { id: "preheat_min_per_grad",  navn: "Preheat per grad",     icon: "mdi:fire-circle",     enhet: " min/°C", dec: 0 },
  { id: "preheat_kuldetillegg",  navn: "Preheat kuldetillegg", icon: "mdi:snowflake",       enhet: " min",    dec: 0 },
  { id: "gardin_start_maned",    navn: "Gardiner fra",         icon: "mdi:curtains",        enhet: ". måned", dec: 0 },
  { id: "gardin_slutt_maned",    navn: "Gardiner til",         icon: "mdi:curtains-closed", enhet: ". måned", dec: 0 },
];

const TIDER_DOGN = [
  { id: "tid_dag_start", navn: "Dag starter",  icon: "mdi:weather-sunny" },
  { id: "tid_natt_start", navn: "Natt starter", icon: "mdi:weather-night" },
];

const TIDER_PERSON = [
  { id: "cybele_dag",              navn: "Cybele dag",        icon: "mdi:account-clock" },
  { id: "cybele_natt",             navn: "Cybele natt",       icon: "mdi:account-clock" },
  { id: "sebastian_vekking",       navn: "Sebastian vekking", icon: "mdi:alarm" },
  { id: "sebastian_vekking_helg",  navn: "Vekking helg",      icon: "mdi:alarm-snooze" },
  { id: "sebastian_natt",          navn: "Sebastian natt",    icon: "mdi:sleep" },
];

const TIDER_MALTID = [
  { id: "frokost_start", navn: "Frokost fra", icon: "mdi:clock-start" },
  { id: "frokost_slutt", navn: "Frokost til", icon: "mdi:clock-end" },
  { id: "middag_start",  navn: "Middag fra",  icon: "mdi:clock-start" },
  { id: "middag_slutt",  navn: "Middag til",  icon: "mdi:clock-end" },
];

const TIDER_HELG = [
  { id: "helg_varsel_tid",   navn: "Helgevarsel",   icon: "mdi:bell-outline" },
  { id: "helg_sporsmal_tid", navn: "Helgespørsmål", icon: "mdi:help-circle-outline" },
  { id: "helg_frist_tid",    navn: "Helgefrist",    icon: "mdi:timer-sand" },
];

/* ------------------------------------------------------------------ *
 * Hjelpere
 * ------------------------------------------------------------------ */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const nf = (v, dec) => {
  const n = Number(v);
  if (!isFinite(n)) return "–";
  return n.toFixed(dec).replace(".", ",");
};

/* ------------------------------------------------------------------ *
 * Kortet
 * ------------------------------------------------------------------ */

class KiKlimaCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("ki-klima-card-editor");
  }

  static getStubConfig() {
    return { type: "custom:ki-klima-card", default_view: "enkel" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._pending = {};
    this._timers = {};
    this._apen = new Set();
    this._seksjoner = new Set(["soner"]);
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "ki",
        title: "",
        default_view: "enkel",
        remember_view: true,
        show_gauge: true,
        show_hurtigvalg: true,
        show_diagnostikk: true,
        show_historikk: true,
        ute_sensor: "",
        sone_sensorer: {},
      },
      config || {}
    );
    this._p = this._config.prefix || "ki";
    this._view = this._lesLagretView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() {
    return this._view === "avansert" ? 22 : 12;
  }

  /* ---- entitets-ID-byggere ---- */
  b(n) { return `input_boolean.${this._p}_${n}`; }
  n(n) { return `input_number.${this._p}_${n}`; }
  t(n) { return `input_datetime.${this._p}_${n}`; }
  s(n) { return `sensor.${this._p}_${n}`; }
  bs(n) { return `binary_sensor.${this._p}_${n}`; }

  _lesLagretView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-klima-card:view"); } catch (e) { return null; }
  }

  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-klima-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    const sig = this._signatur(hass);
    if (sig !== this._sig) {
      this._sig = sig;
      this._update();
    }
    if (this._historyEl) this._historyEl.hass = hass;
  }

  _signatur(hass) {
    let out = this._view + "|";
    for (const id of this._watched) {
      const st = hass.states[id];
      out += (st ? st.state : "-") + ",";
    }
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Bygg DOM én gang
   * ---------------------------------------------------------------- */

  _build() {
    this._watched = new Set();
    const c = this._config;

    const html = `
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${esc(c.title)}</div>` : ""}
          ${this._masterHtml()}
          ${c.show_gauge ? this._gaugeHtml() : ""}
          ${this._viewSwitchHtml()}
          ${c.show_hurtigvalg ? this._modusHtml() : ""}
          ${this._sonerHtml()}
          <div class="avansert-kun">
            ${this._seksjon("unntak", "mdi:calendar-star", "Unntak", "Helg og sommer", this._tallListe(UNNTAK))}
            ${this._seksjon("effekt", "mdi:flash", "Effektvakt", "Grenser og reserver", this._tallListe(EFFEKT_TALL) + this._underTittel("Måltidsvinduer") + this._tidListe(TIDER_MALTID))}
            ${this._seksjon("tider", "mdi:clock-outline", "Tider", "Døgnrytme og varsler",
              this._underTittel("Hele huset") + this._tidListe(TIDER_DOGN) +
              this._underTittel("Personlig") + this._tidListe(TIDER_PERSON) +
              this._underTittel("Helgemodus") + this._tidListe(TIDER_HELG))}
            ${this._seksjon("justering", "mdi:tune-vertical", "Finjustering", "Lastfordeling og preheat", this._tallListe(JUSTERING))}
            ${c.show_diagnostikk ? this._seksjon("diagnostikk", "mdi:stethoscope", "Diagnostikk", "Hva KI ser akkurat nå", this._diagnostikkHtml()) : ""}
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.innerHTML = `<style>${KiKlimaCard.styles}</style>${html}`;
    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._built = true;
    this._settView(this._view, false);
  }

  /* ---- delkomponenter ---- */

  _masterHtml() {
    const ent = this.b("klima_hovedbryter");
    this._watched.add(ent);
    this._watched.add(this.s("klima_status"));
    if (this._config.ute_sensor) this._watched.add(this._config.ute_sensor);
    return `
      <div class="master" data-toggle="${ent}" data-action="toggle" data-entity="${ent}" tabindex="0" role="button">
        <div class="master-ikon"><ha-icon id="master-icon" icon="mdi:robot"></ha-icon></div>
        <div class="master-tekst">
          <div class="master-navn">KI Klima</div>
          <div class="master-status" id="master-status">–</div>
        </div>
        <div class="master-ute" id="master-ute"></div>
      </div>`;
  }

  _gaugeHtml() {
    ["estimert_timesforbruk", "effektiv_effektgrense"].forEach((x) => this._watched.add(this.s(x)));
    this._watched.add(this.bs("effekt_over_grense"));
    this._watched.add(this.n("shed_niva"));
    return `
      <div class="gauge" id="gauge" data-action="more" data-entity="${this.s("estimert_timesforbruk")}">
        <div class="gauge-topp">
          <span class="gauge-tittel">Forbruk denne timen</span>
          <span class="gauge-verdi" id="gauge-verdi">–</span>
        </div>
        <div class="gauge-spor"><div class="gauge-fyll" id="gauge-fyll"></div></div>
        <div class="gauge-bunn">
          <span id="gauge-tekst">–</span>
          <span class="gauge-merke" id="gauge-shed"></span>
        </div>
      </div>`;
  }

  _viewSwitchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _modusHtml() {
    const chips = [
      { ent: this.b("helgemodus"),          icon: "mdi:calendar-weekend",   navn: "Helgemodus", type: "toggle" },
      { ent: this.b("sommermodus"),         icon: "mdi:weather-sunny",      navn: "Sommermodus", type: "toggle" },
      { ent: this.b("sebastian_ferie"),     icon: "mdi:beach",              navn: "Ferie", type: "toggle" },
      { ent: this.b("helg_senk_gulvvarme"), icon: "mdi:heating-coil",       navn: "Helg senk gulv", type: "toggle", avansert: true },
      { ent: this.bs("alle_borte"),         icon: "mdi:home-export-outline",navn: "Tilstedeværelse", type: "les", på: "Alle borte", av: "Noen hjemme" },
    ];
    const html = chips
      .map((c) => {
        this._watched.add(c.ent);
        const kls = ["chip", c.type === "les" ? "chip-les" : "", c.avansert ? "avansert-kun" : ""].filter(Boolean).join(" ");
        const act = c.type === "les" ? "more" : "toggle";
        return `
          <div class="${kls}" data-toggle="${c.ent}" data-entity="${c.ent}" data-action="${act}"
               data-on-label="${esc(c.på || "På")}" data-off-label="${esc(c.av || "Av")}" tabindex="0" role="button">
            <div class="chip-ikon"><ha-icon icon="${c.icon}"></ha-icon></div>
            <div class="chip-tekst">
              <div class="chip-navn">${esc(c.navn)}</div>
              <div class="chip-sub" data-toggle-label>–</div>
            </div>
          </div>`;
      })
      .join("");
    return `<div class="rutenett">${html}</div>`;
  }

  _sonerHtml() {
    let ut = "";
    let forrigeGruppe = null;
    for (const z of ZONER) {
      const styr = this.b(z.styr);
      this._watched.add(styr);
      const felt = [];
      if (z.dag) felt.push({ id: z.dag, navn: "Dag", icon: "mdi:weather-sunny", enhet: " °C", dec: 1 });
      if (z.natt) felt.push({ id: z.natt, navn: "Natt", icon: "mdi:weather-night", enhet: " °C", dec: 1 });
      if (z.fast) felt.push({ id: z.fast, navn: "Settpunkt", icon: "mdi:thermometer", enhet: " °C", dec: 1 });
      felt.forEach((f) => this._watched.add(this.n(f.id)));
      const maling = this._config.sone_sensorer && this._config.sone_sensorer[z.key];
      if (maling) this._watched.add(maling);

      if (z.gruppe !== forrigeGruppe) {
        ut += `<div class="gruppe">${esc(z.gruppe)}</div>`;
        forrigeGruppe = z.gruppe;
      }

      ut += `
        <div class="sone" data-sone="${z.key}">
          <div class="sone-hode" data-action="expand" data-sone="${z.key}" tabindex="0" role="button">
            <div class="sone-ikon"><ha-icon icon="${z.icon}"></ha-icon></div>
            <div class="sone-tekst">
              <div class="sone-navn">${esc(z.navn)}</div>
              <div class="sone-sub" data-sone-sum="${z.key}">–</div>
            </div>
            <div class="ki-pill" data-toggle="${styr}" data-entity="${styr}" data-action="toggle"
                 data-on-label="KI" data-off-label="Manuell" tabindex="0" role="switch">
              <span data-toggle-label>–</span>
            </div>
            ${felt.length ? `<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>` : `<span class="chev-tom"></span>`}
          </div>
          ${felt.length ? `<div class="sone-kropp">
              ${z.notat ? `<div class="notat">${esc(z.notat)}</div>` : ""}
              ${maling ? `<div class="maling" data-bind="maling" data-entity="${maling}">–</div>` : ""}
              ${this._tallListe(felt)}
            </div>` : ""}
        </div>`;
    }

    const alle = ZONER.map((z) => this.b(z.styr)).join(" ");
    return `
      <div class="seksjon apen" data-seksjon="soner">
        <div class="seksjon-hode" data-action="accordion" data-seksjon="soner" tabindex="0" role="button">
          <div class="seksjon-ikon"><ha-icon icon="mdi:home-thermometer"></ha-icon></div>
          <div class="seksjon-tekst">
            <div class="seksjon-navn">Soner</div>
            <div class="seksjon-sub" id="sone-teller">–</div>
          </div>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </div>
        <div class="seksjon-kropp">
          <div class="hurtig avansert-kun">
            <div class="mini" data-action="alle" data-alle="on" data-entities="${alle}">Slå KI på i alle soner</div>
            <div class="mini" data-action="alle" data-alle="off" data-entities="${alle}">Sett alle til manuell</div>
          </div>
          ${ut}
        </div>
      </div>`;
  }

  _seksjon(key, icon, navn, sub, innhold) {
    return `
      <div class="seksjon" data-seksjon="${key}">
        <div class="seksjon-hode" data-action="accordion" data-seksjon="${key}" tabindex="0" role="button">
          <div class="seksjon-ikon"><ha-icon icon="${icon}"></ha-icon></div>
          <div class="seksjon-tekst">
            <div class="seksjon-navn">${esc(navn)}</div>
            <div class="seksjon-sub">${esc(sub)}</div>
          </div>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </div>
        <div class="seksjon-kropp">${innhold}</div>
      </div>`;
  }

  _underTittel(t) {
    return `<div class="undertittel">${esc(t)}</div>`;
  }

  _tallListe(liste) {
    return liste
      .map((f) => {
        const ent = f.id.startsWith("input_number.") ? f.id : this.n(f.id);
        this._watched.add(ent);
        return `
          <div class="rad">
            <div class="rad-ikon"><ha-icon icon="${f.icon || "mdi:tune"}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${ent}">${esc(f.navn)}</div>
            <div class="stepper">
              <div class="steg" data-action="step" data-dir="-1" data-entity="${ent}" tabindex="0" role="button" aria-label="Ned">−</div>
              <div class="steg-verdi" data-bind="num" data-entity="${ent}" data-dec="${f.dec ?? 1}" data-unit="${esc(f.enhet || "")}">–</div>
              <div class="steg" data-action="step" data-dir="1" data-entity="${ent}" tabindex="0" role="button" aria-label="Opp">+</div>
            </div>
          </div>`;
      })
      .join("");
  }

  _tidListe(liste) {
    return liste
      .map((f) => {
        const ent = this.t(f.id);
        this._watched.add(ent);
        return `
          <div class="rad">
            <div class="rad-ikon"><ha-icon icon="${f.icon}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${ent}">${esc(f.navn)}</div>
            <input class="tid" type="time" data-bind="time" data-entity="${ent}">
          </div>`;
      })
      .join("");
  }

  _diagnostikkHtml() {
    const rader = [
      { ent: this.s("klima_status"), navn: "Status", icon: "mdi:information-outline" },
      { ent: this.s("estimert_timesforbruk"), navn: "Prognose timen", icon: "mdi:counter", dec: 2, enhet: " kWh" },
      { ent: this.s("effektiv_effektgrense"), navn: "Effektiv grense", icon: "mdi:speedometer", dec: 2, enhet: " kWh" },
      { ent: this.n("shed_niva"), navn: "Utkoblingsnivå", icon: "mdi:stairs-down", dec: 0 },
      { ent: this.bs("effekt_over_grense"), navn: "Over grense", icon: "mdi:flash-alert" },
      { ent: this.bs("alle_borte"), navn: "Alle borte", icon: "mdi:home-export-outline" },
    ];
    const html = rader
      .map((r) => {
        this._watched.add(r.ent);
        return `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="rad-ikon"><ha-icon icon="${r.icon}"></ha-icon></div>
            <div class="rad-navn">${esc(r.navn)}</div>
            <div class="rad-verdi" data-bind="raw" data-entity="${r.ent}" data-dec="${r.dec ?? ""}" data-unit="${esc(r.enhet || "")}">–</div>
          </div>`;
      })
      .join("");
    return html + (this._config.show_historikk ? `<div class="historikk" id="historikk"></div>` : "");
  }

  /* ---------------------------------------------------------------- *
   * Oppdatering
   * ---------------------------------------------------------------- */

  _update() {
    const h = this._hass;
    if (!h || !this._built) return;

    this._root.querySelectorAll("[data-bind]").forEach((el) => {
      const st = h.states[el.dataset.entity];
      const kind = el.dataset.bind;
      if (kind === "num") {
        const dec = Number(el.dataset.dec ?? 1);
        el.textContent = st ? nf(st.state, dec) + (el.dataset.unit || "") : "–";
        el.classList.toggle("mangler", !st);
      } else if (kind === "time") {
        const v = st ? String(st.state).slice(0, 5) : "";
        if (el.value !== v && this._root.activeElement !== el) el.value = v;
        el.disabled = !st;
      } else if (kind === "maling") {
        el.textContent = st ? `Måler nå ${nf(st.state, 1)} °C` : "";
      } else if (kind === "raw") {
        if (!st) { el.textContent = "–"; return; }
        const dec = el.dataset.dec;
        let v = st.state;
        if (dec !== "" && dec !== undefined && isFinite(Number(v))) v = nf(v, Number(dec));
        if (v === "on") v = "Ja";
        if (v === "off") v = "Nei";
        el.textContent = v + (el.dataset.unit || "");
      }
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      const on = !!st && st.state === "on";
      el.classList.toggle("on", on);
      el.classList.toggle("mangler", !st);
      const lbl = el.querySelector("[data-toggle-label]");
      if (lbl) lbl.textContent = on ? el.dataset.onLabel || "På" : el.dataset.offLabel || "Av";
    });

    this._updateMaster();
    this._updateGauge();
    this._updateSoner();
    if (this._config.show_diagnostikk && this._config.show_historikk && this._view === "avansert") this._mountHistorikk();
  }

  _updateMaster() {
    const h = this._hass;
    const st = h.states[this.b("klima_hovedbryter")];
    const on = st && st.state === "on";
    const ikon = this._root.getElementById("master-icon");
    const status = this._root.getElementById("master-status");
    if (ikon) ikon.setAttribute("icon", on ? "mdi:robot" : "mdi:robot-off");
    if (status) {
      if (!on) status.textContent = "KI er slått av — soner styres manuelt";
      else {
        const s = h.states[this.s("klima_status")];
        status.textContent = s ? s.state : "Aktiv";
      }
    }
    const ute = this._root.getElementById("master-ute");
    if (ute) {
      const u = this._config.ute_sensor ? h.states[this._config.ute_sensor] : null;
      ute.innerHTML = u ? `<ha-icon icon="mdi:thermometer"></ha-icon><span>${nf(u.state, 1)}°</span>` : "";
    }
  }

  _updateGauge() {
    if (!this._config.show_gauge) return;
    const h = this._hass;
    const g = this._root.getElementById("gauge");
    if (!g) return;
    const forbruk = Number((h.states[this.s("estimert_timesforbruk")] || {}).state);
    const grense = Number((h.states[this.s("effektiv_effektgrense")] || {}).state);
    const over = (h.states[this.bs("effekt_over_grense")] || {}).state === "on";
    const shed = parseInt((h.states[this.n("shed_niva")] || {}).state, 10);

    const gyldig = isFinite(forbruk) && isFinite(grense) && grense > 0;
    const pct = gyldig ? Math.max(0, Math.min(100, (forbruk / grense) * 100)) : 0;

    const fyll = this._root.getElementById("gauge-fyll");
    fyll.style.width = pct + "%";
    const niva = over || pct >= 100 ? "kritisk" : pct >= 80 ? "hoy" : "ok";
    g.dataset.niva = niva;

    this._root.getElementById("gauge-verdi").textContent = gyldig ? `${nf(forbruk, 2)} kWh` : "–";
    this._root.getElementById("gauge-tekst").textContent = gyldig
      ? `${Math.round(pct)} % av ${nf(grense, 2)} kWh`
      : "Mangler effektsensorer";
    const merke = this._root.getElementById("gauge-shed");
    merke.textContent = isFinite(shed) && shed > 0 ? `Utkobling nivå ${shed}` : over ? "Over grense" : "";
  }

  _updateSoner() {
    const h = this._hass;
    let aktive = 0;
    for (const z of ZONER) {
      const st = h.states[this.b(z.styr)];
      if (st && st.state === "on") aktive++;
      const sum = this._root.querySelector(`[data-sone-sum="${z.key}"]`);
      if (!sum) continue;
      const del = [];
      if (z.dag) del.push(`Dag ${this._verdi(z.dag)}°`);
      if (z.natt) del.push(`Natt ${this._verdi(z.natt)}°`);
      if (z.fast) del.push(`${this._verdi(z.fast)}°`);
      if (z.key === "gardiner") {
        const a = this._verdi("gardin_start_maned", 0);
        const b = this._verdi("gardin_slutt_maned", 0);
        del.push(`Sesong ${a}.–${b}. måned`);
      }
      sum.textContent = del.join("  ·  ");
    }
    const teller = this._root.getElementById("sone-teller");
    if (teller) teller.textContent = `${aktive} av ${ZONER.length} soner styres av KI`;
  }

  _verdi(id, dec = 1) {
    const st = this._hass.states[this.n(id)];
    return st ? nf(st.state, dec) : "–";
  }

  async _mountHistorikk() {
    const slot = this._root.getElementById("historikk");
    if (!slot || slot.dataset.mounted) return;
    slot.dataset.mounted = "1";
    try {
      const helpers = await window.loadCardHelpers();
      const el = helpers.createCardElement({
        type: "history-graph",
        hours_to_show: 12,
        entities: [this.s("estimert_timesforbruk"), this.s("effektiv_effektgrense")],
      });
      el.hass = this._hass;
      slot.appendChild(el);
      this._historyEl = el;
    } catch (e) {
      slot.textContent = "Historikk kunne ikke lastes.";
    }
  }

  /* ---------------------------------------------------------------- *
   * Interaksjon
   * ---------------------------------------------------------------- */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "toggle") {
      const id = el.dataset.entity;
      const st = this._hass.states[id];
      if (!st) return;
      const domain = id.split(".")[0];
      if (domain === "input_boolean") {
        this._haptic("light");
        this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
      } else {
        this._moreInfo(id);
      }
      ev.stopPropagation();
    } else if (a === "more") {
      this._moreInfo(el.dataset.entity);
      ev.stopPropagation();
    } else if (a === "step") {
      this._step(el.dataset.entity, Number(el.dataset.dir));
      ev.stopPropagation();
    } else if (a === "expand") {
      const sone = this._root.querySelector(`.sone[data-sone="${el.dataset.sone}"]`);
      if (sone && sone.querySelector(".sone-kropp")) {
        sone.classList.toggle("apen");
        this._haptic("selection");
      }
    } else if (a === "accordion") {
      const sek = this._root.querySelector(`.seksjon[data-seksjon="${el.dataset.seksjon}"]`);
      if (sek) {
        sek.classList.toggle("apen");
        this._haptic("selection");
        if (el.dataset.seksjon === "diagnostikk") this._mountHistorikk();
      }
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "alle") {
      const ids = el.dataset.entities.split(" ");
      this._haptic("medium");
      this._hass.callService("input_boolean", el.dataset.alle === "on" ? "turn_on" : "turn_off", { entity_id: ids });
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "time");
    if (!el || !el.value) return;
    const [t, m] = el.value.split(":");
    this._hass.callService("input_datetime", "set_datetime", {
      entity_id: el.dataset.entity,
      time: `${t}:${m}:00`,
    });
  }

  _step(id, dir) {
    const st = this._hass.states[id];
    if (!st) return;
    const step = Number(st.attributes.step ?? 0.5) || 0.5;
    const min = Number(st.attributes.min ?? -100);
    const max = Number(st.attributes.max ?? 1000);
    const naa = this._pending[id] !== undefined ? this._pending[id] : Number(st.state);
    const ny = Math.min(max, Math.max(min, Number((naa + dir * step).toFixed(4))));
    if (ny === naa) return;
    this._pending[id] = ny;
    this._haptic("light");

    this._root.querySelectorAll(`[data-bind="num"][data-entity="${id}"]`).forEach((el) => {
      el.textContent = nf(ny, Number(el.dataset.dec ?? 1)) + (el.dataset.unit || "");
      el.classList.add("endres");
    });

    clearTimeout(this._timers[id]);
    this._timers[id] = setTimeout(() => {
      const verdi = this._pending[id];
      delete this._pending[id];
      this._root.querySelectorAll(`[data-bind="num"][data-entity="${id}"]`).forEach((el) => el.classList.remove("endres"));
      this._hass.callService("input_number", "set_value", { entity_id: id, value: verdi });
    }, 500);
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) {
      this._lagreView(this._view);
      this._haptic("selection");
    }
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
    if (this._view === "avansert" && this._config.show_historikk) this._mountHistorikk();
  }

  _moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _haptic(type) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  /* ---------------------------------------------------------------- *
   * Stil — følger designsystemet i resten av dashbordet
   * ---------------------------------------------------------------- */

  static get styles() {
    return `
      :host { display:block; }
      ha-card {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .wrap { display:flex; flex-direction:column; gap:10px; }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; color:var(--gray1000, var(--primary-text-color)); }

      /* Avansert-innhold skjules i enkel visning */
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Hovedbryter */
      .master {
        display:grid; grid-template-columns:66px 1fr auto; align-items:center;
        gap:10px; height:78px; padding:0 16px 0 4px;
        border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .master.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .master-ikon {
        width:62px; height:62px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .master.on .master-ikon { background: rgba(40,40,42,.12); }
      .master-ikon ha-icon { --mdc-icon-size:30px; }
      .master-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .master-status { font-size:13px; opacity:.72; line-height:1.3; margin-top:2px;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .master-ute { display:flex; align-items:center; gap:4px; font-size:15px; opacity:.8; white-space:nowrap; }
      .master-ute ha-icon { --mdc-icon-size:18px; }

      /* Effektmåler */
      .gauge {
        background: var(--gray200, var(--secondary-background-color));
        border-radius:24px; padding:14px 18px 12px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .gauge-topp { display:flex; justify-content:space-between; align-items:baseline; }
      .gauge-tittel { font-size:14px; opacity:.7; }
      .gauge-verdi { font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; }
      .gauge-spor { height:10px; border-radius:6px; margin:10px 0 8px; overflow:hidden;
        background: rgba(128,128,128,.22); }
      .gauge-fyll { height:100%; width:0%; border-radius:6px; background: var(--green, #4caf50);
        transition: width .5s cubic-bezier(.2,.7,.3,1), background .3s ease; }
      .gauge[data-niva="hoy"] .gauge-fyll { background: var(--orange, #ff9800); }
      .gauge[data-niva="kritisk"] .gauge-fyll { background: var(--red, #f44336); }
      .gauge-bunn { display:flex; justify-content:space-between; font-size:13px; opacity:.7; }
      .gauge-merke { font-weight:600; opacity:1; color: var(--orange, #ff9800); }
      .gauge[data-niva="kritisk"] .gauge-merke { color: var(--red, #f44336); }

      /* Visningsbryter */
      .switch {
        display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px;
        background: var(--gray200, var(--secondary-background-color));
        border-radius:75px;
      }
      .switch-valg {
        text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; color: var(--gray1000, var(--primary-text-color)); opacity:.6;
        transition: background .18s ease, opacity .18s ease, color .18s ease;
      }
      .switch-valg.aktiv {
        background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1;
      }

      /* Modus-chips */
      .rutenett { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .chip {
        display:grid; grid-template-columns:58px 1fr; align-items:center; gap:8px;
        height:66px; padding-left:4px; border-radius:75px; cursor:pointer; overflow:hidden;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .chip.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chip.chip-les.on { background: var(--orange, #ff9800); color: var(--black, #101010); }
      .chip-ikon {
        width:58px; height:58px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .chip.on .chip-ikon { background: rgba(40,40,42,.12); }
      .chip-ikon ha-icon { --mdc-icon-size:24px; }
      .chip-tekst { padding-right:10px; min-width:0; }
      .chip-navn { font-size:15px; font-weight:500; line-height:1.2;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .chip-sub { font-size:13px; opacity:.7; line-height:1.3; }

      /* Seksjoner (trekkspill) */
      .seksjon {
        background: var(--gray200, var(--secondary-background-color));
        border-radius:24px; overflow:hidden;
      }
      .seksjon + .seksjon { margin-top:10px; }
      .avansert-kun .seksjon:first-child { margin-top:0; }
      .seksjon-hode {
        display:grid; grid-template-columns:66px 1fr 28px; align-items:center;
        height:66px; padding-right:12px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .seksjon-ikon {
        width:58px; height:58px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .seksjon-ikon ha-icon { --mdc-icon-size:24px; }
      .seksjon-navn { font-size:16px; font-weight:500; }
      .seksjon-sub { font-size:13px; opacity:.7; }
      .seksjon-kropp { display:none; padding:2px 14px 14px; }
      .seksjon.apen .seksjon-kropp { display:block; }
      .seksjon.apen .seksjon-hode .chev { transform: rotate(180deg); }
      .chev { --mdc-icon-size:22px; opacity:.5; transition: transform .2s ease; }

      .undertittel {
        font-size:13px; font-weight:600; opacity:.55; letter-spacing:.2px;
        padding:14px 6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .gruppe {
        font-size:13px; font-weight:600; opacity:.55;
        padding:14px 6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .gruppe:first-child { padding-top:6px; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:6px 0 2px; }
      .mini {
        text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); color: var(--gray1000, var(--primary-text-color));
      }
      .mini:active { transform: scale(.98); }

      /* Sone */
      .sone { border-radius:18px; background: rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
      .sone-hode {
        display:grid; grid-template-columns:48px 1fr auto 24px; align-items:center; gap:8px;
        padding:8px 10px 8px 6px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .sone-ikon {
        width:44px; height:44px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.16);
      }
      .sone-ikon ha-icon { --mdc-icon-size:22px; }
      .sone-navn { font-size:15px; font-weight:500; line-height:1.2; }
      .sone-sub { font-size:12.5px; opacity:.65; font-variant-numeric:tabular-nums; }
      .ki-pill {
        font-size:12px; font-weight:600; padding:6px 12px; border-radius:75px; cursor:pointer;
        background: rgba(128,128,128,.20); color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .ki-pill.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chev-tom { width:24px; }
      .sone-kropp { display:none; padding:0 8px 10px 8px; }
      .sone.apen .sone-kropp { display:block; }
      .sone.apen .sone-hode .chev { transform: rotate(180deg); }
      .notat { font-size:12.5px; opacity:.6; padding:2px 6px 6px; }
      .maling { font-size:13px; opacity:.75; padding:2px 6px 8px; font-variant-numeric:tabular-nums; }

      /* Rader med stepper eller tid */
      .rad {
        display:grid; grid-template-columns:40px 1fr auto; align-items:center; gap:8px;
        padding:6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-ikon { width:36px; height:36px; border-radius:50%;
        display:flex; align-items:center; justify-content:center; background: rgba(128,128,128,.14); }
      .rad-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .rad-navn { font-size:14.5px; cursor:pointer; }
      .rad-verdi { font-size:14.5px; font-weight:600; font-variant-numeric:tabular-nums; opacity:.9; }
      .rad-les { cursor:pointer; }

      .stepper { display:flex; align-items:center; gap:2px;
        background: rgba(128,128,128,.16); border-radius:75px; padding:2px; }
      .steg {
        width:34px; height:34px; border-radius:50%; cursor:pointer; user-select:none;
        display:flex; align-items:center; justify-content:center;
        font-size:20px; font-weight:500; line-height:1;
        background: rgba(128,128,128,.18);
      }
      .steg:active { transform: scale(.92); }
      .steg-verdi {
        min-width:72px; text-align:center; font-size:15px; font-weight:600;
        font-variant-numeric:tabular-nums;
      }
      .steg-verdi.endres { opacity:.6; }
      .steg-verdi.mangler { opacity:.35; }

      .tid {
        font-family:inherit; font-size:15px; font-weight:600;
        color: var(--gray1000, var(--primary-text-color));
        background: rgba(128,128,128,.16); border:none; border-radius:75px;
        padding:8px 14px; text-align:center;
      }
      .tid::-webkit-calendar-picker-indicator { opacity:.5; }

      .historikk { margin-top:10px; }
      .historikk ha-card { background: rgba(128,128,128,.10); border-radius:18px; }

      .mangler { opacity:.4; }

      [tabindex]:focus-visible {
        outline:2px solid var(--active-big, var(--primary-color));
        outline-offset:2px;
      }
      @media (prefers-reduced-motion: reduce) {
        * { transition:none !important; }
      }
      @media (max-width: 380px) {
        .rutenett { grid-template-columns:1fr; }
        .steg-verdi { min-width:62px; }
      }
    `;
  }
}

customElements.define("ki-klima-card", KiKlimaCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { name: "ute_sensor", selector: { entity: { domain: "sensor" } } },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_gauge", selector: { boolean: {} } },
    { name: "show_hurtigvalg", selector: { boolean: {} } },
    { name: "show_diagnostikk", selector: { boolean: {} } },
    { name: "show_historikk", selector: { boolean: {} } },
  ] },
];

const EDITOR_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  default_view: "Standardvisning",
  ute_sensor: "Utetemperatur (valgfri)",
  remember_view: "Husk valgt visning",
  show_gauge: "Vis effektmåler",
  show_hurtigvalg: "Vis modusknapper",
  show_diagnostikk: "Vis diagnostikk",
  show_historikk: "Vis historikkgraf",
};

class KiKlimaCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "ki",
        default_view: "enkel",
        remember_view: true,
        show_gauge: true,
        show_hurtigvalg: true,
        show_diagnostikk: true,
        show_historikk: true,
      },
      config || {}
    );
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this.shadowRoot.innerHTML = `<style>
        .info { font-size:13px; opacity:.7; padding:10px 2px 0; line-height:1.45; }
        code { background: rgba(128,128,128,.18); padding:1px 5px; border-radius:5px; }
      </style>`;
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
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
      info.innerHTML = "Faktiske romtemperaturer kan legges til per sone i YAML med <code>sone_sensorer</code>, f.eks. <code>stue_panelovn: sensor.stue_temperatur</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

customElements.define("ki-klima-card-editor", KiKlimaCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-klima-card",
  name: "KI Klima",
  description: "Klimastyring med enkel og avansert visning, effektvakt og sonestyring",
  preview: true,
});

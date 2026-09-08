/**
 * ki-vekkealarm-card.js
 * Vekkealarm med gradvis lys — ett kort, to visninger.
 *
 *  Enkel     : hovedbryter med nedtelling til neste alarm, ukedager med
 *              vekketid, nattlampe og testkjøring
 *  Avansert  : alt over + hurtigvalg for uka, lysinnstillinger,
 *              betingelser og automasjonsstatus
 *
 * Kopier til /config/www/ki-vekkealarm-card.js og legg til som ressurs:
 *   URL:  /local/ki-vekkealarm-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-vekkealarm-card
 */

const KI_VEKKEALARM_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-VEKKEALARM-CARD %c ${KI_VEKKEALARM_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#f2c94c;color:#28282a;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const DAGER = [
  { key: "mandag",  navn: "Mandag",  kort: "Ma", helg: false },
  { key: "tirsdag", navn: "Tirsdag", kort: "Ti", helg: false },
  { key: "onsdag",  navn: "Onsdag",  kort: "On", helg: false },
  { key: "torsdag", navn: "Torsdag", kort: "To", helg: false },
  { key: "fredag",  navn: "Fredag",  kort: "Fr", helg: false },
  { key: "lordag",  navn: "Lørdag",  kort: "Lø", helg: true },
  { key: "sondag",  navn: "Søndag",  kort: "Sø", helg: true },
];

const escV = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfV = (v, dec) => { const n = Number(v); return isFinite(n) ? n.toFixed(dec).replace(".", ",") : "–"; };

class KiVekkealarmCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-vekkealarm-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-vekkealarm-card", default_view: "enkel" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._bekreft = false;
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "alarm",
        title: "",
        default_view: "enkel",
        remember_view: true,
        automation: "automation.soverom_vekkealarm_gradvis_lys",
        nattlampe: "input_boolean.alarm_nattlampe",
        fade: "input_number.alarm_fade_minutter",
        av_etter: "input_number.alarm_av_etter_minutter",
        show_test: true,
        betingelser: [
          { entity: "switch.sebastian_posisjon_hjemme_borte", name: "Sebastian hjemme" },
          { entity: "input_boolean.ki_klima_hovedbryter", name: "Klimastyring" },
        ],
      },
      config || {}
    );
    this._p = this._config.prefix || "alarm";
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 18 : 11; }

  b(n) { return `input_boolean.${this._p}_${n}`; }
  t(n) { return `input_datetime.${this._p}_${n}`; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-vekkealarm-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-vekkealarm-card:view", v); } catch (e) { /* ignorer */ }
  }

  connectedCallback() {
    this._tikk = setInterval(() => this._updateNeste(), 30000);
  }
  disconnectedCallback() {
    clearInterval(this._tikk);
    clearTimeout(this._bekreftTimer);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|";
    for (const id of this._watched) sig += ((hass.states[id] || {}).state || "-") + ",";
    if (sig !== this._sig) { this._sig = sig; this._update(); }
  }

  /* ------------------------------------------------------------ *
   * Bygg
   * ------------------------------------------------------------ */

  _build() {
    this._watched = new Set();
    const c = this._config;

    const html = `
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escV(c.title)}</div>` : ""}
          ${this._masterHtml()}
          ${this._switchHtml()}
          ${this._ukeHtml()}
          ${this._nattlampeHtml()}
          <div class="avansert-kun">
            ${this._lysHtml()}
            ${this._betingelserHtml()}
            ${this._automasjonHtml()}
          </div>
          ${c.show_test ? this._testHtml() : ""}
        </div>
      </ha-card>`;

    this.shadowRoot.innerHTML = `<style>${KiVekkealarmCard.styles}</style>${html}`;
    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._root.addEventListener("input", (e) => this._onInput(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _masterHtml() {
    const ent = this.b("master");
    this._watched.add(ent);
    DAGER.forEach((d) => { this._watched.add(this.b(d.key + "_aktiv")); this._watched.add(this.t(d.key)); });
    return `
      <div class="master" data-toggle="${ent}" data-entity="${ent}" data-action="toggle" tabindex="0" role="button">
        <div class="master-ikon"><ha-icon id="master-icon" icon="mdi:alarm"></ha-icon></div>
        <div class="master-tekst">
          <div class="master-navn" id="master-navn">Vekkealarm</div>
          <div class="master-status" id="master-status">–</div>
        </div>
        <div class="master-nedtell" id="master-nedtell"></div>
      </div>`;
  }

  _switchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _ukeHtml() {
    const rader = DAGER.map((d) => {
      const akt = this.b(d.key + "_aktiv");
      const tid = this.t(d.key);
      return `
        <div class="dag ${d.helg ? "dag-helg" : ""}" data-dag="${d.key}">
          <div class="dag-pill" data-toggle="${akt}" data-entity="${akt}" data-action="toggle" tabindex="0" role="switch" aria-label="${escV(d.navn)}">${d.kort}</div>
          <div class="dag-navn" data-action="more" data-entity="${tid}">${escV(d.navn)}</div>
          <div class="dag-merke" data-merke="${d.key}"></div>
          <input class="tid" type="time" data-bind="time" data-entity="${tid}">
        </div>`;
    }).join("");

    const ukedager = DAGER.filter((d) => !d.helg).map((d) => this.b(d.key + "_aktiv")).join(" ");
    const helg = DAGER.filter((d) => d.helg).map((d) => this.b(d.key + "_aktiv")).join(" ");
    const alle = DAGER.map((d) => this.b(d.key + "_aktiv")).join(" ");

    return `
      <div class="blokk">
        <div class="blokk-hode">
          <span>Ukeplan</span>
          <span class="blokk-sub" id="uke-teller">–</span>
        </div>
        ${rader}
        <div class="hurtig avansert-kun">
          <div class="mini" data-action="sett" data-entities="${ukedager}" data-verdi="on">Ukedager på</div>
          <div class="mini" data-action="sett" data-entities="${helg}" data-verdi="off">Helg av</div>
          <div class="mini" data-action="sett" data-entities="${alle}" data-verdi="off">Alle av</div>
          <div class="mini" data-action="kopier">Kopier mandag til ukedagene</div>
        </div>
      </div>`;
  }

  _nattlampeHtml() {
    const ent = this._config.nattlampe;
    if (!ent) return "";
    this._watched.add(ent);
    return `
      <div class="chip" data-toggle="${ent}" data-entity="${ent}" data-action="toggle" tabindex="0" role="switch">
        <div class="chip-ikon"><ha-icon icon="mdi:lightbulb-night"></ha-icon></div>
        <div class="chip-tekst">
          <div class="chip-navn">Nattlampe</div>
          <div class="chip-sub" data-toggle-label>–</div>
        </div>
      </div>`;
  }

  _lysHtml() {
    const felt = [
      { ent: this._config.fade, navn: "Fade opp", icon: "mdi:brightness-percent", enhet: " min", sub: "Hvor lenge lyset bruker på å nå full styrke" },
      { ent: this._config.av_etter, navn: "Av etter", icon: "mdi:timer-off-outline", enhet: " min", sub: "Tid fra alarmen starter til lyset slukkes" },
    ].filter((f) => f.ent);
    felt.forEach((f) => this._watched.add(f.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Lys</span></div>
        ${felt.map((f) => `
          <div class="slider-rad">
            <div class="slider-topp">
              <div class="slider-ikon"><ha-icon icon="${f.icon}"></ha-icon></div>
              <div class="slider-tekst">
                <div class="slider-navn" data-action="more" data-entity="${f.ent}">${escV(f.navn)}</div>
                <div class="slider-sub">${escV(f.sub)}</div>
              </div>
              <div class="slider-verdi" data-bind="num" data-entity="${f.ent}" data-dec="0" data-unit="${escV(f.enhet)}">–</div>
            </div>
            <input class="slider" type="range" data-bind="range" data-entity="${f.ent}">
          </div>`).join("")}
      </div>`;
  }

  _betingelserHtml() {
    const liste = this._config.betingelser || [];
    if (!liste.length) return "";
    liste.forEach((r) => this._watched.add(r.entity));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Betingelser</span><span class="blokk-sub">Alarmen kjører bare når disse er på</span></div>
        ${liste.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.entity}">
            <div class="prikk" data-prikk="${r.entity}"></div>
            <div class="rad-navn">${escV(r.name || r.entity)}</div>
            <div class="rad-verdi" data-bind="japp" data-entity="${r.entity}">–</div>
          </div>`).join("")}
      </div>`;
  }

  _automasjonHtml() {
    const ent = this._config.automation;
    if (!ent) return "";
    this._watched.add(ent);
    return `
      <div class="chip" data-toggle="${ent}" data-entity="${ent}" data-action="toggle-auto" tabindex="0" role="switch">
        <div class="chip-ikon"><ha-icon icon="mdi:robot"></ha-icon></div>
        <div class="chip-tekst">
          <div class="chip-navn">Automasjonen</div>
          <div class="chip-sub" id="auto-sub">–</div>
        </div>
      </div>`;
  }

  _testHtml() {
    return `
      <div class="test" id="test" data-action="test" tabindex="0" role="button">
        <ha-icon icon="mdi:play-circle"></ha-icon>
        <span id="test-tekst">Test vekkesekvensen</span>
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
      const kind = el.dataset.bind;
      if (kind === "time") {
        const v = st ? String(st.state).slice(0, 5) : "";
        if (el.value !== v && this._root.activeElement !== el) el.value = v;
        el.disabled = !st;
      } else if (kind === "num") {
        el.textContent = st ? nfV(st.state, Number(el.dataset.dec ?? 0)) + (el.dataset.unit || "") : "–";
      } else if (kind === "range") {
        if (!st) { el.disabled = true; return; }
        el.min = st.attributes.min ?? 0;
        el.max = st.attributes.max ?? 60;
        el.step = st.attributes.step ?? 1;
        if (this._root.activeElement !== el) el.value = st.state;
      } else if (kind === "japp") {
        const on = st && (st.state === "on" || st.state === "home");
        el.textContent = st ? (on ? "På" : "Av") : "Mangler";
        el.classList.toggle("nei", !on);
      }
    });

    this._root.querySelectorAll("[data-prikk]").forEach((el) => {
      const st = h.states[el.dataset.prikk];
      const on = st && (st.state === "on" || st.state === "home");
      el.classList.toggle("gronn", !!on);
      el.classList.toggle("rod", !on);
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      const on = !!st && st.state === "on";
      el.classList.toggle("on", on);
      el.classList.toggle("mangler", !st);
      const lbl = el.querySelector("[data-toggle-label]");
      if (lbl) lbl.textContent = on ? "Tas med i vekkingen" : "Ikke med";
    });

    // Dag-rader dempes når dagen er av, og dagens dato merkes
    const idxIdag = (new Date().getDay() + 6) % 7;
    DAGER.forEach((d, i) => {
      const rad = this._root.querySelector(`.dag[data-dag="${d.key}"]`);
      if (!rad) return;
      const st = h.states[this.b(d.key + "_aktiv")];
      rad.classList.toggle("av", !st || st.state !== "on");
      rad.classList.toggle("idag", i === idxIdag);
      const merke = rad.querySelector(`[data-merke="${d.key}"]`);
      if (merke) merke.textContent = i === idxIdag ? "i dag" : "";
    });

    const teller = this._root.getElementById("uke-teller");
    if (teller) {
      const n = DAGER.filter((d) => (h.states[this.b(d.key + "_aktiv")] || {}).state === "on").length;
      teller.textContent = n === 0 ? "Ingen dager valgt" : `${n} av 7 dager`;
    }

    const auto = this._root.getElementById("auto-sub");
    if (auto) {
      const st = h.states[this._config.automation];
      if (!st) auto.textContent = "Finner ikke automasjonen";
      else {
        const sist = st.attributes.last_triggered;
        auto.textContent = st.state === "on"
          ? sist ? `Aktiv · sist kjørt ${this._relativ(new Date(sist))}` : "Aktiv · aldri kjørt"
          : "Deaktivert";
      }
    }

    this._updateNeste();
  }

  _updateNeste() {
    if (!this._built || !this._hass) return;
    const h = this._hass;
    const master = h.states[this.b("master")];
    const på = master && master.state === "on";
    const ikon = this._root.getElementById("master-icon");
    if (ikon) ikon.setAttribute("icon", på ? "mdi:alarm" : "mdi:alarm-off");

    const status = this._root.getElementById("master-status");
    const nedtell = this._root.getElementById("master-nedtell");
    if (!status) return;

    if (!master) { status.textContent = "Finner ikke alarmbryteren"; nedtell.textContent = ""; return; }
    if (!på) { status.textContent = "Slått av"; nedtell.textContent = ""; return; }

    const neste = this._nesteAlarm();
    if (!neste) {
      status.textContent = "Ingen vekketid satt";
      nedtell.textContent = "";
      return;
    }
    const nå = new Date();
    const dagerFrem = Math.round((new Date(neste.når).setHours(0, 0, 0, 0) - new Date(nå).setHours(0, 0, 0, 0)) / 86400000);
    const nårTekst = dagerFrem === 0 ? "i dag" : dagerFrem === 1 ? "i morgen" : neste.dag.navn.toLowerCase();
    status.textContent = `Neste ${nårTekst} kl. ${neste.tid}`;

    const min = Math.max(0, Math.round((neste.når - nå) / 60000));
    const t = Math.floor(min / 60);
    nedtell.textContent = t >= 24 ? `om ${Math.floor(t / 24)} d` : t > 0 ? `om ${t} t ${min % 60} min` : `om ${min} min`;
  }

  _nesteAlarm() {
    const h = this._hass;
    const nå = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(nå);
      d.setDate(nå.getDate() + i);
      const dag = DAGER[(d.getDay() + 6) % 7];
      const akt = h.states[this.b(dag.key + "_aktiv")];
      if (!akt || akt.state !== "on") continue;
      const tid = h.states[this.t(dag.key)];
      if (!tid) continue;
      const [hh, mm] = String(tid.state).split(":");
      if (hh === "00" && mm === "00") continue;
      const når = new Date(d);
      når.setHours(Number(hh), Number(mm), 0, 0);
      if (når > nå) return { når, dag, tid: `${hh}:${mm}` };
    }
    return null;
  }

  _relativ(dato) {
    const min = Math.round((Date.now() - dato.getTime()) / 60000);
    if (min < 1) return "nå";
    if (min < 60) return `for ${min} min siden`;
    const t = Math.round(min / 60);
    if (t < 24) return `for ${t} t siden`;
    const d = Math.round(t / 24);
    return d === 1 ? "i går" : `for ${d} dager siden`;
  }

  /* ------------------------------------------------------------ *
   * Interaksjon
   * ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "toggle") {
      const id = el.dataset.entity;
      const st = this._hass.states[id];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    } else if (a === "toggle-auto") {
      const st = this._hass.states[this._config.automation];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("automation", st.state === "on" ? "turn_off" : "turn_on", { entity_id: this._config.automation });
    } else if (a === "more") {
      this._moreInfo(el.dataset.entity);
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "sett") {
      this._haptic("medium");
      this._hass.callService("input_boolean", el.dataset.verdi === "on" ? "turn_on" : "turn_off", {
        entity_id: el.dataset.entities.split(" "),
      });
    } else if (a === "kopier") {
      this._kopierMandag();
    } else if (a === "test") {
      this._test();
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind);
    if (!el) return;
    if (el.dataset.bind === "time" && el.value) {
      const [t, m] = el.value.split(":");
      this._hass.callService("input_datetime", "set_datetime", { entity_id: el.dataset.entity, time: `${t}:${m}:00` });
    } else if (el.dataset.bind === "range") {
      this._hass.callService("input_number", "set_value", { entity_id: el.dataset.entity, value: Number(el.value) });
    }
  }

  _onInput(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    const vis = this._root.querySelector(`[data-bind="num"][data-entity="${el.dataset.entity}"]`);
    if (vis) vis.textContent = nfV(el.value, 0) + (vis.dataset.unit || "");
  }

  _kopierMandag() {
    const kilde = this._hass.states[this.t("mandag")];
    if (!kilde) return;
    const tid = String(kilde.state).slice(0, 8);
    const mål = DAGER.filter((d) => !d.helg && d.key !== "mandag").map((d) => this.t(d.key));
    this._haptic("medium");
    this._hass.callService("input_datetime", "set_datetime", { entity_id: mål, time: tid });
  }

  _test() {
    const knapp = this._root.getElementById("test");
    const tekst = this._root.getElementById("test-tekst");
    if (!this._bekreft) {
      this._bekreft = true;
      knapp.classList.add("bekreft");
      tekst.textContent = "Trykk igjen for å kjøre nå";
      this._haptic("warning");
      clearTimeout(this._bekreftTimer);
      this._bekreftTimer = setTimeout(() => {
        this._bekreft = false;
        knapp.classList.remove("bekreft");
        tekst.textContent = "Test vekkesekvensen";
      }, 5000);
      return;
    }
    clearTimeout(this._bekreftTimer);
    this._bekreft = false;
    knapp.classList.remove("bekreft");
    tekst.textContent = "Kjører …";
    this._haptic("success");
    this._hass.callService("automation", "trigger", {
      entity_id: this._config.automation,
      skip_condition: true,
    });
    setTimeout(() => { tekst.textContent = "Test vekkesekvensen"; }, 4000);
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
      .wrap { display:flex; flex-direction:column; gap:10px; }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; color:var(--gray1000, var(--primary-text-color)); }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Hovedbryter */
      .master {
        display:grid; grid-template-columns:66px 1fr auto; align-items:center; gap:10px;
        height:78px; padding:0 16px 0 4px; border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .master.on { background: var(--yellow, #f2c94c); color: var(--black, #101010); }
      .master-ikon {
        width:62px; height:62px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center; background: rgba(250,251,252,.10);
      }
      .master.on .master-ikon { background: rgba(40,40,42,.14); }
      .master-ikon ha-icon { --mdc-icon-size:30px; }
      .master-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .master-status { font-size:13px; opacity:.72; margin-top:2px; }
      .master-nedtell { font-size:14px; font-weight:600; opacity:.85; white-space:nowrap; font-variant-numeric:tabular-nums; }

      /* Visningsbryter */
      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; color: var(--gray1000, var(--primary-text-color)); opacity:.6;
        transition: background .18s ease, opacity .18s ease, color .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      /* Blokk */
      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 12px;
        color: var(--gray1000, var(--primary-text-color)); }
      .blokk + .blokk { margin-top:10px; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px 6px; }
      .blokk-sub { font-weight:500; }

      /* Dag-rad */
      .dag { display:grid; grid-template-columns:46px 1fr auto auto; align-items:center; gap:10px; padding:5px 2px; }
      .dag + .dag { border-top:1px solid rgba(128,128,128,.14); }
      .dag.av .dag-navn, .dag.av .tid { opacity:.42; }
      .dag-pill {
        width:44px; height:38px; border-radius:14px; cursor:pointer; user-select:none;
        display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600;
        background: rgba(128,128,128,.18); color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .dag-pill.on { background: var(--yellow, #f2c94c); color: var(--black, #101010); }
      .dag-navn { font-size:15px; cursor:pointer; }
      .dag.idag .dag-navn { font-weight:600; }
      .dag-merke { font-size:11px; font-weight:600; opacity:.5; text-transform:none; }
      .tid { font-family:inherit; font-size:15px; font-weight:600; color: var(--gray1000, var(--primary-text-color));
        background: rgba(128,128,128,.16); border:none; border-radius:75px; padding:8px 12px; text-align:center; }
      .tid::-webkit-calendar-picker-indicator { opacity:.5; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px 0 2px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); color: var(--gray1000, var(--primary-text-color)); }
      .mini:last-child { grid-column:1 / -1; }
      .mini:active { transform: scale(.98); }

      /* Chip */
      .chip { display:grid; grid-template-columns:58px 1fr; align-items:center; gap:8px; height:66px;
        padding-left:4px; border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease; }
      .chip.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chip-ikon { width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10); }
      .chip.on .chip-ikon { background: rgba(40,40,42,.12); }
      .chip-ikon ha-icon { --mdc-icon-size:24px; }
      .chip-navn { font-size:15px; font-weight:500; }
      .chip-sub { font-size:13px; opacity:.7; }
      .avansert-kun .chip { margin-top:10px; }

      /* Slider */
      .slider-rad { padding:8px 2px 4px; }
      .slider-rad + .slider-rad { border-top:1px solid rgba(128,128,128,.14); margin-top:6px; }
      .slider-topp { display:grid; grid-template-columns:38px 1fr auto; align-items:center; gap:10px; }
      .slider-ikon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.14); }
      .slider-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .slider-navn { font-size:14.5px; font-weight:500; cursor:pointer; }
      .slider-sub { font-size:12px; opacity:.6; line-height:1.3; }
      .slider-verdi { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; margin:14px 0 6px;
        border-radius:4px; background: rgba(128,128,128,.28); outline:none; }
      .slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; border:none; }
      .slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; border:none;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; }

      /* Betingelser */
      .rad { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px; padding:9px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-les { cursor:pointer; }
      .rad-navn { font-size:14.5px; }
      .rad-verdi { font-size:14px; font-weight:600; opacity:.85; }
      .rad-verdi.nei { opacity:.55; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .prikk.gronn { background: var(--green, #4caf50); }
      .prikk.rod { background: var(--red, #f44336); }

      /* Test */
      .test { display:flex; align-items:center; justify-content:center; gap:10px; height:60px; border-radius:75px;
        cursor:pointer; font-size:15px; font-weight:500;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease; }
      .test ha-icon { --mdc-icon-size:24px; }
      .test.bekreft { background: var(--orange, #ff9800); color: var(--black, #101010); }

      .mangler { opacity:.4; }
      [tabindex]:focus-visible { outline:2px solid var(--active-big, var(--primary-color)); outline-offset:2px; }
      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
      @media (max-width: 380px) {
        .dag { grid-template-columns:44px 1fr auto; }
        .dag-merke { display:none; }
        .master-nedtell { font-size:13px; }
      }
    `;
  }
}

customElements.define("ki-vekkealarm-card", KiVekkealarmCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const VEKKE_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  { name: "automation", selector: { entity: { domain: "automation" } } },
  { name: "nattlampe", selector: { entity: { domain: "input_boolean" } } },
  { type: "grid", name: "", schema: [
    { name: "fade", selector: { entity: { domain: "input_number" } } },
    { name: "av_etter", selector: { entity: { domain: "input_number" } } },
  ] },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_test", selector: { boolean: {} } },
  ] },
];

const VEKKE_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  automation: "Automasjon",
  nattlampe: "Nattlampe-bryter",
  fade: "Fade opp (minutter)",
  av_etter: "Av etter (minutter)",
  default_view: "Standardvisning",
  remember_view: "Husk valgt visning",
  show_test: "Vis testknapp",
};

class KiVekkealarmCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) {
    this._config = Object.assign(
      { prefix: "alarm", default_view: "enkel", remember_view: true, show_test: true },
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
      this._form.schema = VEKKE_SCHEMA;
      this._form.computeLabel = (s) => VEKKE_LABELS[s.name] || s.name;
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
      info.innerHTML = "Betingelsene som vises i avansert visning settes i YAML med <code>betingelser</code> — en liste av <code>entity</code> og <code>name</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

customElements.define("ki-vekkealarm-card-editor", KiVekkealarmCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-vekkealarm-card",
  name: "KI Vekkealarm",
  description: "Vekkealarm med ukeplan, nedtelling, lysinnstillinger og testkjøring",
  preview: true,
});

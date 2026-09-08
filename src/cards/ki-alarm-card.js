/**
 * ki-alarm-card.js  —  v1.0.0
 *
 * Alarmsentral for Home Assistant, i samme designspråk som ki-energi-card.
 *   • Statuspanel som skifter farge og ikon etter alarmtilstand
 *   • Fire modusknapper (Av / Hjemme / Borte / Natt)
 *   • Soner med sensorfliser: dører, vinduer, bevegelse, låser
 *   • Kodetastatur som overlegg i kortet — koden holdes bare i nettleseren
 *     og sendes rett til alarm_disarm. Ingen input_text, ingen skript.
 *   • Full GUI-editor for soner, sensorer, ikoner og farger.
 *
 * Legges i /config/www/ki-alarm-card.js og registreres som
 * JavaScript Module: /local/ki-alarm-card.js
 */

const KI_ALARM_VERSION = "1.2.1";

console.info(
  `%c KI-ALARM-CARD %c ${KI_ALARM_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e5484d;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ─────────────────────────────────────────────────────────────── tilstand ── */

const TILSTAND = {
  disarmed: {
    tittel: "Deaktivert",
    ikon: "mdi:shield-off-outline",
    farge: "hvile",
  },
  armed_home: { tittel: "Aktivert – hjemme", ikon: "mdi:shield-home", farge: "sikret" },
  armed_away: { tittel: "Aktivert – borte", ikon: "mdi:shield-lock", farge: "sikret" },
  armed_night: { tittel: "Aktivert – natt", ikon: "mdi:shield-moon", farge: "sikret" },
  armed_vacation: {
    tittel: "Aktivert – ferie",
    ikon: "mdi:shield-airplane",
    farge: "sikret",
  },
  arming: { tittel: "Aktiverer", ikon: "mdi:shield-sync-outline", farge: "venter" },
  pending: { tittel: "Nedtelling", ikon: "mdi:shield-alert-outline", farge: "venter" },
  triggered: { tittel: "Alarm utløst", ikon: "mdi:alarm-light", farge: "utlost" },
};

const MODUSER = [
  { id: "disarmed", tekst: "Av", ikon: "mdi:shield-off-outline", tjeneste: "alarm_disarm" },
  {
    id: "armed_home",
    tekst: "Hjemme",
    ikon: "mdi:shield-home-outline",
    tjeneste: "alarm_arm_home",
  },
  {
    id: "armed_away",
    tekst: "Borte",
    ikon: "mdi:shield-lock-outline",
    tjeneste: "alarm_arm_away",
  },
  {
    id: "armed_night",
    tekst: "Natt",
    ikon: "mdi:shield-moon-outline",
    tjeneste: "alarm_arm_night",
  },
];

const FARGER = [
  { navn: "Rød", verdi: "var(--red)" },
  { navn: "Oransje", verdi: "var(--orange)" },
  { navn: "Gul", verdi: "var(--yellow)" },
  { navn: "Grønn", verdi: "var(--green)" },
  { navn: "Blå", verdi: "var(--blue)" },
  { navn: "Lilla", verdi: "var(--purple)" },
  { navn: "Rosa", verdi: "var(--pink)" },
  { navn: "Grå", verdi: "var(--gray800)" },
];

const SONETYPER = [
  ["opening", "Åpning (dør/vindu)"],
  ["motion", "Bevegelse"],
  ["lock", "Lås"],
];

/** Er sensoren i avviksstatus? Låser er «avvik» når de ikke er låst. */
const erAktiv = (hass, item, kind) => {
  const s = hass.states[item.entity];
  if (!s) return null;
  if (kind === "lock") return s.state !== "locked";
  return s.state === "on";
};

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const STANDARD_KONFIG = () => ({
  type: "custom:ki-alarm-card",
  entity: "alarm_control_panel.alarm",
  code_length: 4,
  arm_requires_code: false,
  zones: [
    {
      title: "Dører",
      icon: "mdi:door",
      color: "var(--red)",
      kind: "opening",
      active_text: "Åpen",
      idle_text: "Lukket",
      items: [
        { entity: "binary_sensor.inngangsdor", name: "Inngang" },
        { entity: "binary_sensor.verandador", name: "Veranda" },
      ],
    },
    {
      title: "Vinduer",
      icon: "mdi:window-closed-variant",
      color: "var(--orange)",
      kind: "opening",
      active_text: "Åpent",
      idle_text: "Lukket",
      items: [
        { entity: "binary_sensor.kjokken_vindu", name: "Kjøkken" },
        { entity: "binary_sensor.cybele_soverom_vindu", name: "Cybele soverom" },
        { entity: "binary_sensor.rune_kontorvindu", name: "Rune kontor" },
        { entity: "binary_sensor.rune_soveromsvindu", name: "Rune soverom" },
        { entity: "binary_sensor.soveromsvindu_venstre", name: "Soverom venstre" },
        { entity: "binary_sensor.soveromsvindu_hoyre", name: "Soverom høyre" },
      ],
    },
    {
      title: "Bevegelse",
      icon: "mdi:motion-sensor",
      color: "var(--blue)",
      kind: "motion",
      active_text: "Bevegelse",
      idle_text: "Stille",
      items: [
        {
          entity: "binary_sensor.trappegang_bevegelsessensor_occupancy",
          name: "Trappegang",
        },
        { entity: "binary_sensor.bad_bevegelsesensor_motion", name: "Bad" },
        { entity: "binary_sensor.pult_aqara_fp2_motion", name: "Pult" },
        { entity: "binary_sensor.stue_g6_turret_motion", name: "Stue" },
        {
          entity: "binary_sensor.mellomgang_g5_turret_ultra_motion",
          name: "Mellomgang",
        },
        {
          entity: "binary_sensor.everything_presence_lite_occupancy",
          name: "Tilstedeværelse",
        },
      ],
    },
    {
      title: "Dørlåser",
      icon: "mdi:lock",
      color: "var(--red)",
      kind: "lock",
      active_text: "Ulåst",
      idle_text: "Låst",
      items: [
        {
          entity: "lock.dorlas_blatann",
          name: "Dørlås",
          battery: "sensor.dorlas_wifi_battery_2",
        },
      ],
    },
  ],
});

/* ───────────────────────────────────────────────────────────────── kortet ── */

class KiAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._kode = "";
    this._tastaturApent = false;
    this._ventendeModus = null; // hvilken tjeneste koden skal brukes til
    this._feil = false;
    this._ok = false;
    this._skjulteSoner = new Set();
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-alarm-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    if (!config.entity || !config.entity.startsWith("alarm_control_panel.")) {
      throw new Error("ki-alarm-card: 'entity' må være et alarm_control_panel");
    }
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.zones) this._config.zones = [];
    this._signatur = "";
    this._bygget = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._tegn();
  }

  getCardSize() {
    return 6 + (this._config.zones || []).length * 2;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiAlarmCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => this._klikk(e));
    this._bygget = true;
  }

  /* --------------------------------------------------------------- data -- */

  _panel() {
    return this._hass.states[this._config.entity];
  }

  _sonedata() {
    return (this._config.zones || []).map((z) => {
      const items = (z.items || []).map((it) => {
        const aktiv = erAktiv(this._hass, it, z.kind);
        const s = this._hass.states[it.entity];
        return {
          ...it,
          aktiv,
          mangler: !s,
          navn: it.name || (s ? s.attributes.friendly_name : it.entity),
        };
      });
      const antallAktive = items.filter((i) => i.aktiv === true).length;
      return { ...z, items, antallAktive, totalt: items.length };
    });
  }

  _hindringer(soner) {
    // Åpninger og ulåste låser hindrer aktivering. Bevegelse gjør det ikke.
    const navn = [];
    soner.forEach((z) => {
      if (z.kind === "motion") return;
      z.items.forEach((i) => {
        if (i.aktiv === true) navn.push(i.navn);
      });
    });
    return navn;
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const p = this._panel();
    const soner = this._sonedata();

    const sign = JSON.stringify([
      p ? p.state : null,
      p ? p.last_changed : null,
      soner.map((z) => z.items.map((i) => i.aktiv)),
      this._tastaturApent,
      this._kode.length,
      this._feil,
      this._ok,
      [...this._skjulteSoner],
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    const tilstand = p && TILSTAND[p.state] ? TILSTAND[p.state] : null;
    const farge = tilstand ? tilstand.farge : "hvile";
    const hindringer = this._hindringer(soner);

    this._rot.innerHTML = `
      ${this._heroHtml(p, tilstand, farge, soner, hindringer)}
      ${
        this._tastaturApent
          ? this._tastaturHtml()
          : `${this._modusHtml(p)}
             ${soner.map((z, zi) => this._soneHtml(z, zi)).join("")}`
      }
    `;
  }

  _heroHtml(p, tilstand, farge, soner, hindringer) {
    const tittel = tilstand ? tilstand.tittel : "Ukjent tilstand";
    const ikon = tilstand ? tilstand.ikon : "mdi:shield-outline";

    let under;
    if (p && p.state === "triggered") {
      under = "Sjekk hva som utløste alarmen";
    } else if (hindringer.length) {
      under = `Ikke sikret: ${hindringer.join(", ")}`;
    } else if (p && p.state === "disarmed") {
      under = "Alt er lukket og låst";
    } else if (p && p.last_changed) {
      const t = new Date(p.last_changed).toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      under = `Aktivert kl. ${t}`;
    } else {
      under = "Alt er sikret";
    }

    const chips = soner
      .map(
        (z) => `
        <div class="chip">
          <div class="chip-navn">${esc(z.title)}</div>
          <div class="chip-tall">${z.totalt - z.antallAktive}<span>/${
          z.totalt
        }</span></div>
        </div>`
      )
      .join("");

    return `
      <section class="hero ${farge}" data-handling="mer-info">
        <div class="hero-hode">
          <span class="hero-ikon"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
          <span class="hero-tekst">
            <span class="hero-tittel">${esc(tittel)}</span>
            <span class="hero-under">${esc(under)}</span>
          </span>
        </div>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </section>
    `;
  }

  _modusHtml(p) {
    const naa = p ? p.state : "";
    const knapper = MODUSER.map((m) => {
      const aktiv = naa === m.id;
      return `
        <button type="button"
          class="modus ${aktiv ? "aktiv" : ""} ${m.id === "disarmed" ? "av" : ""}"
          data-handling="modus" data-modus="${m.id}">
          <ha-icon icon="${esc(m.ikon)}"></ha-icon>
          <span>${esc(m.tekst)}</span>
        </button>`;
    }).join("");
    return `<div class="moduser">${knapper}</div>`;
  }

  _soneHtml(z, zi) {
    const skjult = this._skjulteSoner.has(String(zi));
    const status =
      z.antallAktive === 0
        ? `Alt ${z.idle_text ? z.idle_text.toLowerCase() : "i orden"}`
        : `${z.antallAktive} ${
            z.antallAktive === 1
              ? (z.active_text || "avvik").toLowerCase()
              : (z.active_text || "avvik").toLowerCase() + "e"
          }`;

    // Avvik først, deretter opprinnelig rekkefølge
    const sortert = z.items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => (b.it.aktiv === true) - (a.it.aktiv === true) || a.i - b.i);

    const fliser = sortert
      .map(({ it }) => {
        const batteri =
          it.battery && this._hass.states[it.battery]
            ? ` · ${this._hass.states[it.battery].state}%`
            : "";
        const under = it.mangler
          ? "Ikke tilgjengelig"
          : (it.aktiv ? z.active_text || "Aktiv" : z.idle_text || "I orden") + batteri;
        return `
          <button type="button" class="flis ${it.aktiv ? "varsel" : ""} ${
          it.mangler ? "mangler" : ""
        }"
            style="--flis-farge:${esc(z.color || "var(--red)")}"
            data-handling="flis" data-entity="${esc(it.entity)}"
            data-kind="${esc(z.kind || "opening")}">
            <span class="flis-ikon"><ha-icon icon="${esc(
              it.icon || z.icon || "mdi:checkbox-blank-circle-outline"
            )}"></ha-icon></span>
            <span class="flis-tekst">
              <span class="flis-navn">${esc(it.navn)}</span>
              <span class="flis-under">${esc(under)}</span>
            </span>
          </button>`;
      })
      .join("");

    return `
      <section class="sone">
        <header class="sone-hode" data-handling="brytsone" data-sone="${zi}">
          <span class="sone-ikon" style="--sone-farge:${esc(
            z.color || "var(--red)"
          )}"><ha-icon icon="${esc(z.icon || "mdi:shield")}"></ha-icon></span>
          <h3>${esc(z.title)}</h3>
          <span class="sone-status ${z.antallAktive ? "avvik" : ""}">${esc(
      status
    )}</span>
          <ha-icon class="sone-pil ${skjult ? "" : "ned"}"
            icon="mdi:chevron-down"></ha-icon>
        </header>
        ${skjult ? "" : `<div class="fliser">${fliser}</div>`}
      </section>`;
  }

  _tastaturHtml() {
    const lengde = parseInt(this._config.code_length) || 4;
    let prikker = "";
    for (let i = 0; i < lengde; i++) {
      prikker += `<span class="prikk ${i < this._kode.length ? "fylt" : ""}"></span>`;
    }
    const taster = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
      .map((t) => `<button type="button" class="tast" data-handling="tast" data-tegn="${t}">${t}</button>`)
      .join("");

    let tittel = "Tast koden";
    let under = "Lukk med krysset for å gå tilbake";
    if (this._feil) {
      tittel = "Feil kode";
      under = "Prøv på nytt";
    } else if (this._ok) {
      tittel = "Alarmen er deaktivert";
      under = "";
    }

    return `
      <div class="tastatur ${this._feil ? "feil" : ""} ${this._ok ? "ok" : ""}">
        <button type="button" class="lukk" data-handling="lukk-tastatur"
          aria-label="Lukk tastatur">
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
        <div class="tast-hode">
          <div class="tast-tittel">${esc(tittel)}</div>
          <div class="tast-under">${esc(under)}</div>
          <div class="prikker">${prikker}</div>
        </div>
        <div class="tastrad">
          ${taster}
          <button type="button" class="tast tom" disabled></button>
          <button type="button" class="tast" data-handling="tast" data-tegn="0">0</button>
          <button type="button" class="tast ikon" data-handling="slett">
            <ha-icon icon="mdi:backspace-outline"></ha-icon>
          </button>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ handling -- */

  _klikk(e) {
    const el = e.target.closest("[data-handling]");
    if (!el) return;
    const h = el.dataset.handling;

    if (h === "stopp") {
      e.stopPropagation();
      return;
    }
    if (h === "mer-info") return this._merInfo(this._config.entity);
    if (h === "flis") {
      if (el.dataset.kind === "lock") {
        const s = this._hass.states[el.dataset.entity];
        if (s) {
          this._hass.callService(
            "lock",
            s.state === "locked" ? "unlock" : "lock",
            { entity_id: el.dataset.entity }
          );
          return;
        }
      }
      return this._merInfo(el.dataset.entity);
    }
    if (h === "brytsone") {
      const id = el.dataset.sone;
      if (this._skjulteSoner.has(id)) this._skjulteSoner.delete(id);
      else this._skjulteSoner.add(id);
      this._signatur = "";
      return this._tegn();
    }
    if (h === "modus") return this._velgModus(el.dataset.modus);
    if (h === "tast") return this._tast(el.dataset.tegn);
    if (h === "slett") {
      this._kode = this._kode.slice(0, -1);
      this._feil = false;
      this._signatur = "";
      return this._tegn();
    }
    if (h === "lukk-tastatur") return this._lukkTastatur();
  }

  _merInfo(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  _velgModus(modusId) {
    const m = MODUSER.find((x) => x.id === modusId);
    if (!m) return;
    const p = this._panel();
    if (p && p.state === modusId) return; // allerede i denne modusen

    const krever =
      modusId === "disarmed" ? true : !!this._config.arm_requires_code;

    if (krever) {
      this._ventendeModus = m.tjeneste;
      this._kode = "";
      this._feil = false;
      this._ok = false;
      this._tastaturApent = true;
      this._signatur = "";
      this._tegn();
      this._rullTil();
      return;
    }
    this._kall(m.tjeneste, null);
  }

  /** Sørger for at tastaturet er synlig, uansett hvor kortet står i popupen. */
  _rullTil() {
    requestAnimationFrame(() => {
      try {
        this.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch (e) {
        try {
          this.scrollIntoView(true);
        } catch (e2) {
          /* ignorer */
        }
      }
    });
  }

  _tast(tegn) {
    const lengde = parseInt(this._config.code_length) || 4;
    if (this._kode.length >= lengde) return;
    this._feil = false;
    this._kode += tegn;
    this._signatur = "";
    this._tegn();
    if (this._kode.length === lengde) {
      const kode = this._kode;
      // Kort pause så siste prikk rekker å tegnes
      setTimeout(() => this._kall(this._ventendeModus || "alarm_disarm", kode), 180);
    }
  }

  async _kall(tjeneste, kode) {
    const data = { entity_id: this._config.entity };
    if (kode) data.code = kode;
    try {
      await this._hass.callService("alarm_control_panel", tjeneste, data);
      this._kode = "";
      if (this._tastaturApent) {
        this._ok = true;
        this._feil = false;
        this._signatur = "";
        this._tegn();
        setTimeout(() => this._lukkTastatur(), 1400);
      }
    } catch (err) {
      this._kode = "";
      this._feil = true;
      this._ok = false;
      this._signatur = "";
      this._tegn();
      setTimeout(() => {
        this._feil = false;
        this._signatur = "";
        this._tegn();
      }, 2500);
    }
  }

  _lukkTastatur() {
    this._tastaturApent = false;
    this._ventendeModus = null;
    this._kode = "";
    this._feil = false;
    this._ok = false;
    this._signatur = "";
    this._tegn();
  }
}

KiAlarmCard.styles = `
  :host { display: block; }
  .rot {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    position: relative;
    display: block;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- hero ---------- */
  .hero {
    border-radius: 26px;
    padding: 20px;
    margin-bottom: 12px;
    cursor: pointer;
    color: var(--gray100, #fff);
    background: var(--active-big, var(--primary-color));
  }
  .hero.hvile {
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .hero.venter { background: var(--orange, #f5a623); animation: ki-puls 1.6s ease-in-out infinite; }
  .hero.utlost { background: var(--red, #e5484d); animation: ki-puls .9s ease-in-out infinite; }
  @keyframes ki-puls { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.22); } }

  .hero-hode { display: flex; align-items: center; gap: 16px; }
  .hero-ikon {
    flex: 0 0 auto;
    width: 58px; height: 58px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .14);
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: 30px;
  }
  .hero-tekst { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .hero-tittel { font-size: 22px; font-weight: 600; line-height: 1.2; }
  .hero-under { font-size: 14px; font-weight: 500; opacity: .8; }
  .chips {
    display: flex; gap: 6px;
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .hero.hvile .chips { border-top-color: rgba(0, 0, 0, .12); }
  .chip { flex: 1; text-align: center; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall { font-size: 19px; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; }
  .chip-tall span { font-size: 12px; font-weight: 600; opacity: .6; }

  /* ---------- modusknapper ---------- */
  .moduser { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .modus {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; height: 92px; border-radius: 22px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray800, var(--secondary-text-color));
    font-size: 13px; font-weight: 600;
    --mdc-icon-size: 26px;
    transition: background .25s ease, color .25s ease;
  }
  .modus.aktiv { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fff); }
  .modus.aktiv.av { background: var(--gray1000, var(--primary-text-color)); color: var(--gray200, #222); }
  .modus:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  /* ---------- soner ---------- */
  .sone + .sone { margin-top: 18px; }
  .sone-hode {
    display: flex; align-items: center; gap: 10px;
    padding: 0 6px 10px; cursor: pointer;
  }
  .sone-ikon {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--sone-farge, var(--gray800));
    --mdc-icon-size: 16px;
  }
  .sone-hode h3 {
    margin: 0; flex: 1;
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .sone-status { font-size: 12px; font-weight: 600; opacity: .55; color: var(--gray1000, var(--primary-text-color)); }
  .sone-status.avvik { opacity: 1; color: var(--orange, #f5a623); }
  .sone-pil { --mdc-icon-size: 18px; opacity: .45; color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease; }
  .sone-pil.ned { transform: rotate(0deg); }

  .fliser { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .flis {
    display: grid; grid-template-columns: 44px 1fr;
    align-items: center; gap: 10px;
    padding: 10px 12px 10px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    transition: background .2s ease, color .2s ease;
  }
  .flis.varsel { background: var(--flis-farge, var(--red)); color: var(--gray100, #fff); }
  .flis.mangler { opacity: .45; }
  .flis:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .flis-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    --mdc-icon-size: 21px;
    justify-self: end;
  }
  .flis.varsel .flis-ikon { background: rgba(250, 251, 252, .16); }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn {
    font-size: 14px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .flis-under { font-size: 12px; font-weight: 500; opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ---------- kodetastatur ---------- */
  .tastatur {
    position: relative;
    background: var(--gray200, var(--card-background-color));
    border-radius: 26px;
    padding: 28px 18px 22px;
    display: flex; flex-direction: column; gap: 18px;
    max-width: 340px;
    margin: 0 auto;
  }
  .tastatur.feil { animation: ki-rist .4s ease; }
  @keyframes ki-rist {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-9px); }
    75% { transform: translateX(9px); }
  }
  .tast-hode { text-align: center; display: flex; flex-direction: column; gap: 4px; }
  .tast-tittel { font-size: 17px; font-weight: 600; color: var(--gray1000, var(--primary-text-color)); }
  .tastatur.feil .tast-tittel { color: var(--red, #e5484d); }
  .tastatur.ok .tast-tittel { color: var(--green, #30a46c); }
  .tast-under { font-size: 12px; font-weight: 500; opacity: .6; color: var(--gray1000, var(--primary-text-color)); }
  .prikker { display: flex; gap: 14px; justify-content: center; margin-top: 10px; }
  .prikk {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(128, 128, 128, .5);
    box-sizing: border-box;
    transition: background .15s ease, border-color .15s ease;
  }
  .prikk.fylt { background: var(--gray1000, var(--primary-text-color)); border-color: var(--gray1000, var(--primary-text-color)); }
  .tastatur.feil .prikk.fylt { background: var(--red, #e5484d); border-color: var(--red, #e5484d); }
  .tastatur.ok .prikk.fylt { background: var(--green, #30a46c); border-color: var(--green, #30a46c); }

  .tastrad {
    display: grid;
    grid-template-columns: repeat(3, 68px);
    justify-content: center;
    gap: 16px;
  }
  .tast {
    width: 68px; height: 68px;
    aspect-ratio: 1 / 1;
    padding: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, .18);
    color: var(--gray1000, var(--primary-text-color));
    font-size: 24px; font-weight: 500;
    --mdc-icon-size: 22px;
    display: flex; align-items: center; justify-content: center;
    transition: filter .12s ease;
  }
  .tast:active { filter: brightness(1.35); }
  .tast.tom { background: transparent; pointer-events: none; }
  .tast:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }
  .lukk {
    position: absolute;
    top: 14px; right: 14px;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .18);
    color: var(--gray1000, var(--primary-text-color));
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: 26px;
    padding: 0;
  }
  .lukk:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  @media (max-width: 420px) {
    .fliser { grid-template-columns: 1fr; }
    .hero-tittel { font-size: 20px; }
    .modus { height: 84px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero.venter, .hero.utlost, .tastatur.feil { animation: none; }
    .sone-pil, .flis, .modus { transition: none; }
  }
`;

/* ───────────────────────────────────────────────────────────────── editor ── */

class KiAlarmCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.zones) this._config.zones = STANDARD_KONFIG().zones;
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange, type = "text") {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = type;
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _avkryssing(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "avkryss";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = !!verdi;
    inp.addEventListener("change", () => onChange(inp.checked));
    wrap.appendChild(inp);
    const s = document.createElement("span");
    s.textContent = label;
    wrap.appendChild(s);
    return wrap;
  }

  _velger(label, valg, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement("select");
    valg.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.value = verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    wrap.appendChild(sel);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      if (domener) p.includeDomains = domener;
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _fargefelt(verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>Farge ved avvik</span>`;
    const rad = document.createElement("div");
    rad.className = "fargerad";
    const prikk = document.createElement("i");
    prikk.className = "prikk";
    prikk.style.background = verdi || "var(--red)";
    const sel = document.createElement("select");
    FARGER.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.verdi;
      o.textContent = f.navn;
      sel.appendChild(o);
    });
    sel.value = FARGER.some((f) => f.verdi === verdi) ? verdi : FARGER[0].verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    rad.appendChild(prikk);
    rad.appendChild(sel);
    wrap.appendChild(rad);
    return wrap;
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiAlarmCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Alarmpanel</h4>";
    gen.appendChild(
      this._entitetsfelt(
        "Alarmpanel",
        this._config.entity,
        (v) => {
          this._config.entity = v;
          this._endret();
        },
        ["alarm_control_panel"]
      )
    );
    gen.appendChild(
      this._tekstfelt(
        "Antall siffer i koden",
        this._config.code_length || 4,
        (v) => {
          this._config.code_length = parseInt(v) || 4;
          this._endret();
        },
        "number"
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Krev kode også ved aktivering",
        this._config.arm_requires_code,
        (v) => {
          this._config.arm_requires_code = v;
          this._endret();
        }
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Koden tastes i kortet og sendes rett til alarmpanelet. Den lagres ikke i Home Assistant.";
    gen.appendChild(h);
    rot.appendChild(gen);

    /* Soner */
    this._config.zones.forEach((z, zi) => this._tegnSone(rot, z, zi));

    rot.appendChild(
      this._knapp("+ Ny sone", "hovedknapp", () => {
        this._config.zones.push({
          title: "Ny sone",
          icon: "mdi:shield",
          color: "var(--red)",
          kind: "opening",
          active_text: "Åpen",
          idle_text: "Lukket",
          items: [],
        });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnSone(rot, z, zi) {
    const boks = document.createElement("div");
    boks.className = "boks";

    const topp = document.createElement("div");
    topp.className = "sonetopp";
    const t = document.createElement("h4");
    t.textContent = z.title || "Uten navn";
    topp.appendChild(t);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (zi > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.zones.splice(zi, 1);
          this._config.zones.splice(zi - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (zi < this._config.zones.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.zones.splice(zi, 1);
          this._config.zones.splice(zi + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett sone", "mini fare", () => {
        this._config.zones.splice(zi, 1);
        this._endret();
        this._tegn();
      })
    );
    topp.appendChild(verktoy);
    boks.appendChild(topp);

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Overskrift", z.title, (v) => {
        z.title = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._ikonfelt(z.icon, (v) => {
        z.icon = v;
        this._endret();
      })
    );
    boks.appendChild(r1);

    const r2 = document.createElement("div");
    r2.className = "tokol";
    r2.appendChild(
      this._velger("Sensortype", SONETYPER, z.kind || "opening", (v) => {
        z.kind = v;
        this._endret();
      })
    );
    r2.appendChild(
      this._fargefelt(z.color, (v) => {
        z.color = v;
        this._endret();
        this._tegn();
      })
    );
    boks.appendChild(r2);

    const r3 = document.createElement("div");
    r3.className = "tokol";
    r3.appendChild(
      this._tekstfelt("Tekst ved avvik", z.active_text, (v) => {
        z.active_text = v;
        this._endret();
      })
    );
    r3.appendChild(
      this._tekstfelt("Tekst når i orden", z.idle_text, (v) => {
        z.idle_text = v;
        this._endret();
      })
    );
    boks.appendChild(r3);

    (z.items || []).forEach((it, ii) => {
      const noekkel = `${zi}:${ii}`;
      const d = document.createElement("details");
      d.className = "rad";
      d.open = this._apne.has(noekkel);
      d.addEventListener("toggle", () => {
        if (d.open) this._apne.add(noekkel);
        else this._apne.delete(noekkel);
      });
      const s = document.createElement("summary");
      s.textContent = it.name || it.entity || "Ny sensor";
      d.appendChild(s);

      const kropp = document.createElement("div");
      kropp.className = "radkropp";
      kropp.appendChild(
        this._entitetsfelt(
          "Sensor",
          it.entity,
          (v) => {
            it.entity = v;
            this._endret();
            this._tegn();
          },
          z.kind === "lock" ? ["lock"] : ["binary_sensor", "sensor"]
        )
      );
      const rad = document.createElement("div");
      rad.className = "tokol";
      rad.appendChild(
        this._tekstfelt("Visningsnavn", it.name, (v) => {
          it.name = v;
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(
        this._ikonfelt(it.icon, (v) => {
          if (v) it.icon = v;
          else delete it.icon;
          this._endret();
        })
      );
      kropp.appendChild(rad);
      kropp.appendChild(
        this._entitetsfelt(
          "Batterisensor (valgfritt)",
          it.battery,
          (v) => {
            if (v) it.battery = v;
            else delete it.battery;
            this._endret();
          },
          ["sensor"]
        )
      );
      kropp.appendChild(
        this._knapp("Slett sensor", "mini fare", () => {
          z.items.splice(ii, 1);
          this._apne.delete(noekkel);
          this._endret();
          this._tegn();
        })
      );
      d.appendChild(kropp);
      boks.appendChild(d);
    });

    boks.appendChild(
      this._knapp("+ Legg til sensor", "hovedknapp liten", () => {
        if (!z.items) z.items = [];
        z.items.push({ entity: "", name: "" });
        this._apne.add(`${zi}:${z.items.length - 1}`);
        this._endret();
        this._tegn();
      })
    );

    rot.appendChild(boks);
  }
}

KiAlarmCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
  .felt input, .felt select {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px;
    width: 100%; box-sizing: border-box;
  }
  .avkryss { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text-color); cursor: pointer; }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .fargerad { display: flex; align-items: center; gap: 8px; }
  .prikk { width: 14px; height: 14px; border-radius: 50%; display: inline-block; flex: 0 0 auto; }
  .sonetopp { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 5px 9px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  details.rad { border: 1px solid var(--divider-color); border-radius: 10px; padding: 8px 10px; }
  .radkropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

customElements.define("ki-alarm-card", KiAlarmCard);
customElements.define("ki-alarm-card-editor", KiAlarmCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-alarm-card",
  name: "KI Alarm",
  description: "Alarmsentral med soner, sensorstatus og kodetastatur.",
  preview: true,
});
/**
 * ki-helse-card.js  —  v1.0.0
 *
 * Helsedata fra Home Assistant Companion (iPhone/Apple Watch), i samme
 * designspråk som de øvrige KI-kortene.
 *
 *   • Hero med dagens aktivitet
 *   • Seksjoner: aktivitet, hjerte og pust, søvn, kropp
 *   • Søvnseksjonen tegner fasene som en stablet stolpe
 *   • Full GUI-editor med automatisk oppdaging ut fra enhetsprefiks
 *
 * Kortet viser tallene slik de kommer fra Apple Health. Det tolker dem ikke
 * og setter ingen mål eller grenseverdier.
 *
 * Legges i /config/www/ki-helse-card.js og registreres som
 * JavaScript Module: /local/ki-helse-card.js
 */

const KI_HELSE_VERSION = "1.0.1";

console.info(
  `%c KI-HELSE-CARD %c ${KI_HELSE_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e5484d;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── verktøy ── */

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const tall = (hass, id) => {
  if (!id || !hass || !hass.states[id]) return null;
  const v = parseFloat(hass.states[id].state);
  return isNaN(v) ? null : v;
};

const enhetFor = (hass, id) => {
  const s = id && hass ? hass.states[id] : null;
  return s && s.attributes ? s.attributes.unit_of_measurement || "" : "";
};

/** Timer som «7 t 12 min», ellers tall med enhet. */
const fmtVerdi = (hass, id) => {
  const s = id ? hass.states[id] : null;
  if (!s) return "–";
  const v = parseFloat(s.state);
  const e = enhetFor(hass, id);
  if (isNaN(v)) return s.state;

  if (e === "h" || e === "t") {
    const timer = Math.floor(v);
    const min = Math.round((v - timer) * 60);
    if (timer === 0) return `${min} min`;
    return min ? `${timer} t ${min} min` : `${timer} t`;
  }
  if (e === "min") {
    if (v >= 60) {
      const timer = Math.floor(v / 60);
      const rest = Math.round(v % 60);
      return rest ? `${timer} t ${rest} min` : `${timer} t`;
    }
    return `${Math.round(v)} min`;
  }

  let des = 0;
  if (Math.abs(v) < 10) des = 1;
  if (e === "%" || e === "bpm" || e === "" ) des = Math.abs(v) < 10 ? 1 : 0;
  if (e === "km" || e === "kg" || e === "°C") des = 1;
  if (e === "m" && Math.abs(v) < 10) des = 2;
  const t = v.toLocaleString("nb-NO", {
    minimumFractionDigits: des,
    maximumFractionDigits: des,
  });
  return e ? `${t} ${e}` : t;
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-helse-card",
  title: "",
  prefix: "sensor.sebastian_iphone_17_pro_",
  hero: {
    main: "sensor.sebastian_iphone_17_pro_steps",
    main_label: "Skritt i dag",
    chips: [
      { entity: "sensor.sebastian_iphone_17_pro_active_energy", name: "Aktiv" },
      { entity: "sensor.sebastian_iphone_17_pro_exercise_time", name: "Trening" },
      {
        entity: "sensor.sebastian_iphone_17_pro_walking_running_distance",
        name: "Distanse",
      },
    ],
  },
  sections: [
    {
      title: "Aktivitet",
      color: "var(--green)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_health_steps", name: "Skritt (Health)", icon: "mdi:shoe-print" },
        { entity: "sensor.sebastian_iphone_17_pro_distance", name: "Distanse", icon: "mdi:map-marker-distance" },
        { entity: "sensor.sebastian_iphone_17_pro_flights_climbed", name: "Etasjer", icon: "mdi:stairs-up" },
        { entity: "sensor.sebastian_iphone_17_pro_floors_ascended", name: "Opp", icon: "mdi:arrow-up-bold" },
        { entity: "sensor.sebastian_iphone_17_pro_floors_descended", name: "Ned", icon: "mdi:arrow-down-bold" },
        { entity: "sensor.sebastian_iphone_17_pro_average_active_pace", name: "Snittfart", icon: "mdi:speedometer" },
        { entity: "sensor.sebastian_iphone_17_pro_active_energy", name: "Aktiv energi", icon: "mdi:fire" },
        { entity: "sensor.sebastian_iphone_17_pro_resting_energy", name: "Hvileenergi", icon: "mdi:sleep" },
      ],
    },
    {
      title: "Hjerte og pust",
      color: "var(--red)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_heart_rate", name: "Puls", icon: "mdi:heart-pulse" },
        { entity: "sensor.sebastian_iphone_17_pro_resting_heart_rate", name: "Hvilepuls", icon: "mdi:heart" },
        { entity: "sensor.sebastian_iphone_17_pro_walking_heart_rate_average", name: "Gangpuls", icon: "mdi:walk" },
        { entity: "sensor.sebastian_iphone_17_pro_heart_rate_variability", name: "HRV", icon: "mdi:sine-wave" },
        { entity: "sensor.sebastian_iphone_17_pro_vo2_max", name: "VO2 maks", icon: "mdi:lungs" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_oxygen", name: "Oksygen", icon: "mdi:water-percent" },
        { entity: "sensor.sebastian_iphone_17_pro_respiratory_rate", name: "Pustefrekvens", icon: "mdi:weather-windy" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_pressure_systolic", name: "Blodtrykk over", icon: "mdi:gauge" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_pressure_diastolic", name: "Blodtrykk under", icon: "mdi:gauge-low" },
      ],
    },
    {
      title: "Søvn",
      color: "var(--purple)",
      type: "sleep",
      total: "sensor.sebastian_iphone_17_pro_sleep_duration",
      in_bed: "sensor.sebastian_iphone_17_pro_in_bed",
      phases: [
        { entity: "sensor.sebastian_iphone_17_pro_deep_sleep", name: "Dyp", color: "var(--purple)" },
        { entity: "sensor.sebastian_iphone_17_pro_core_sleep", name: "Kjerne", color: "var(--blue)" },
        { entity: "sensor.sebastian_iphone_17_pro_rem_sleep", name: "REM", color: "var(--green)" },
        { entity: "sensor.sebastian_iphone_17_pro_awake", name: "Våken", color: "var(--orange)" },
      ],
    },
    {
      title: "Kropp",
      color: "var(--blue)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_weight", name: "Vekt", icon: "mdi:scale-bathroom" },
        { entity: "sensor.sebastian_iphone_17_pro_height", name: "Høyde", icon: "mdi:human-male-height" },
        { entity: "sensor.sebastian_iphone_17_pro_lean_body_mass", name: "Mager masse", icon: "mdi:arm-flex" },
        { entity: "sensor.sebastian_iphone_17_pro_body_fat_percentage", name: "Fettprosent", icon: "mdi:percent" },
        { entity: "sensor.sebastian_iphone_17_pro_body_temperature", name: "Kroppstemp", icon: "mdi:thermometer" },
        { entity: "sensor.sebastian_iphone_17_pro_basal_body_temperature", name: "Basaltemp", icon: "mdi:thermometer-low" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_glucose", name: "Blodsukker", icon: "mdi:water-opacity" },
        { entity: "sensor.sebastian_iphone_17_pro_water", name: "Vann", icon: "mdi:cup-water" },
      ],
    },
  ],
});

/** Suffiks brukt av «Finn entiteter automatisk». */
const SUFFIKS = {
  hero_main: "steps",
  chips: ["active_energy", "exercise_time", "walking_running_distance"],
  Aktivitet: [
    ["health_steps", "Skritt (Health)", "mdi:shoe-print"],
    ["distance", "Distanse", "mdi:map-marker-distance"],
    ["flights_climbed", "Etasjer", "mdi:stairs-up"],
    ["floors_ascended", "Opp", "mdi:arrow-up-bold"],
    ["floors_descended", "Ned", "mdi:arrow-down-bold"],
    ["average_active_pace", "Snittfart", "mdi:speedometer"],
    ["active_energy", "Aktiv energi", "mdi:fire"],
    ["resting_energy", "Hvileenergi", "mdi:sleep"],
  ],
  "Hjerte og pust": [
    ["heart_rate", "Puls", "mdi:heart-pulse"],
    ["resting_heart_rate", "Hvilepuls", "mdi:heart"],
    ["walking_heart_rate_average", "Gangpuls", "mdi:walk"],
    ["heart_rate_variability", "HRV", "mdi:sine-wave"],
    ["vo2_max", "VO2 maks", "mdi:lungs"],
    ["blood_oxygen", "Oksygen", "mdi:water-percent"],
    ["respiratory_rate", "Pustefrekvens", "mdi:weather-windy"],
    ["blood_pressure_systolic", "Blodtrykk over", "mdi:gauge"],
    ["blood_pressure_diastolic", "Blodtrykk under", "mdi:gauge-low"],
  ],
  Kropp: [
    ["weight", "Vekt", "mdi:scale-bathroom"],
    ["height", "Høyde", "mdi:human-male-height"],
    ["lean_body_mass", "Mager masse", "mdi:arm-flex"],
    ["body_fat_percentage", "Fettprosent", "mdi:percent"],
    ["body_temperature", "Kroppstemp", "mdi:thermometer"],
    ["basal_body_temperature", "Basaltemp", "mdi:thermometer-low"],
    ["blood_glucose", "Blodsukker", "mdi:water-opacity"],
    ["water", "Vann", "mdi:cup-water"],
  ],
  sleep: {
    total: "sleep_duration",
    in_bed: "in_bed",
    phases: [
      ["deep_sleep", "Dyp", "var(--purple)"],
      ["core_sleep", "Kjerne", "var(--blue)"],
      ["rem_sleep", "REM", "var(--green)"],
      ["awake", "Våken", "var(--orange)"],
    ],
  },
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiHelseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._skjulte = new Set();
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-helse-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.sections) this._config.sections = [];
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
    return 10;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiHelseCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) return;
      if (el.dataset.handling === "bolk") {
        const i = el.dataset.bolk;
        if (this._skjulte.has(i)) this._skjulte.delete(i);
        else this._skjulte.add(i);
        this._signatur = "";
        this._tegn();
      } else if (el.dataset.handling === "mer-info" && el.dataset.entity) {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });
    this._bygget = true;
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const hass = this._hass;
    const cfg = this._config;

    const fulgte = [];
    if (cfg.hero) {
      if (cfg.hero.main) fulgte.push(cfg.hero.main);
      (cfg.hero.chips || []).forEach((c) => fulgte.push(c.entity));
    }
    (cfg.sections || []).forEach((s) => {
      (s.items || []).forEach((i) => fulgte.push(i.entity));
      (s.phases || []).forEach((f) => fulgte.push(f.entity));
      if (s.total) fulgte.push(s.total);
      if (s.in_bed) fulgte.push(s.in_bed);
    });

    const sign = JSON.stringify([
      fulgte.map((e) => (e && hass.states[e] ? hass.states[e].state : null)),
      [...this._skjulte].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._heroHtml()}
      ${(cfg.sections || [])
        .map((s, i) =>
          s.type === "sleep" ? this._sovnHtml(s, i) : this._bolkHtml(s, i)
        )
        .join("")}
    `;
  }

  _tittelHtml() {
    const t = this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(this._config.title_icon || "mdi:heart-pulse")}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _heroHtml() {
    const hass = this._hass;
    const h = this._config.hero || {};
    if (!h.main || !hass.states[h.main]) return "";
    const v = tall(hass, h.main);

    const chips = (h.chips || [])
      .filter((c) => c.entity && hass.states[c.entity])
      .map(
        (c) => `
        <div class="chip">
          <div class="chip-navn">${esc(c.name || "")}</div>
          <div class="chip-tall">${esc(fmtVerdi(hass, c.entity))}</div>
        </div>`
      )
      .join("");

    return `
      <section class="hero" data-handling="mer-info" data-entity="${esc(h.main)}">
        <div class="hero-topp">${esc(h.main_label || "I dag")}</div>
        <div class="hero-sum">${
          v === null
            ? esc(hass.states[h.main].state)
            : esc(v.toLocaleString("nb-NO", { maximumFractionDigits: 0 }))
        }<span>${esc(enhetFor(hass, h.main))}</span></div>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </section>`;
  }

  _bolkHtml(s, i) {
    const hass = this._hass;
    const skjult = this._skjulte.has(String(i));
    const synlige = (s.items || []).filter((it) => it.entity && hass.states[it.entity]);
    if (!synlige.length) return "";

    return `
      <section class="bolk">
        <header class="bolk-hode" data-handling="bolk" data-bolk="${i}">
          <span class="bolk-prikk" style="background:${esc(
            s.color || "var(--gray800)"
          )}"></span>
          <h3>${esc(s.title)}</h3>
          <span class="bolk-antall">${synlige.length}</span>
          <ha-icon class="bolk-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="fliser">
                ${synlige
                  .map(
                    (it) => `
                  <button type="button" class="flis" data-handling="mer-info"
                    data-entity="${esc(it.entity)}"
                    style="--flis-farge:${esc(it.color || s.color || "var(--gray800)")}">
                    <span class="flis-ikon"><ha-icon icon="${esc(
                      it.icon || "mdi:heart-outline"
                    )}"></ha-icon></span>
                    <span class="flis-tekst">
                      <span class="flis-navn">${esc(it.name || it.entity)}</span>
                      <span class="flis-verdi">${esc(fmtVerdi(hass, it.entity))}</span>
                    </span>
                  </button>`
                  )
                  .join("")}
              </div>`
        }
      </section>`;
  }

  _sovnHtml(s, i) {
    const hass = this._hass;
    const skjult = this._skjulte.has(String(i));
    const faser = (s.phases || [])
      .map((f) => ({ ...f, v: tall(hass, f.entity) }))
      .filter((f) => f.v !== null);
    const total = tall(hass, s.total);
    if (!faser.length && total === null) return "";

    const sum = faser.reduce((a, b) => a + b.v, 0) || 1;

    return `
      <section class="bolk">
        <header class="bolk-hode" data-handling="bolk" data-bolk="${i}">
          <span class="bolk-prikk" style="background:${esc(
            s.color || "var(--purple)"
          )}"></span>
          <h3>${esc(s.title)}</h3>
          <span class="bolk-antall">${
            total !== null ? esc(fmtVerdi(hass, s.total)) : ""
          }</span>
          <ha-icon class="bolk-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="sovn">
                ${
                  faser.length
                    ? `<div class="stolpe">
                        ${faser
                          .map(
                            (f) =>
                              `<i style="width:${((f.v / sum) * 100).toFixed(
                                1
                              )}%;background:${esc(f.color || "var(--purple)")}"></i>`
                          )
                          .join("")}
                      </div>`
                    : ""
                }
                <div class="sovn-tekst">
                  ${faser
                    .map(
                      (f) => `
                    <button type="button" class="sovn-del" data-handling="mer-info"
                      data-entity="${esc(f.entity)}">
                      <span class="prikk" style="background:${esc(
                        f.color || "var(--purple)"
                      )}"></span>
                      ${esc(f.name)} <b>${esc(fmtVerdi(hass, f.entity))}</b>
                    </button>`
                    )
                    .join("")}
                </div>
                ${
                  s.in_bed && hass.states[s.in_bed]
                    ? `<button type="button" class="sovn-linje" data-handling="mer-info"
                        data-entity="${esc(s.in_bed)}">
                        <span>I sengen</span><b>${esc(
                          fmtVerdi(hass, s.in_bed)
                        )}</b>
                      </button>`
                    : ""
                }
              </div>`
        }
      </section>`;
  }
}

KiHelseCard.styles = `
  :host { display: block; }
  .rot { background: transparent; border: none; box-shadow: none; padding: 0; display: block; }
  .rot * { box-sizing: border-box; min-width: 0; }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad { display: flex; align-items: center; gap: 12px; padding: 0 4px 14px; }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px; flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1; font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }

  /* ---------- hero ---------- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 24px; padding: 18px 20px; margin-bottom: 18px;
    cursor: pointer;
  }
  .hero-topp { font-size: 13px; font-weight: 600; opacity: .75; }
  .hero-sum {
    font-size: 34px; font-weight: 700; line-height: 1.15;
    margin: 4px 0 2px; font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 16px; font-weight: 600; opacity: .7; margin-left: 6px; }
  .chips {
    display: flex; gap: 6px; margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .chip { flex: 1; text-align: center; min-width: 0; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall {
    font-size: 15px; font-weight: 700; line-height: 1.4;
    font-variant-numeric: tabular-nums;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ---------- bolker ---------- */
  .bolk + .bolk { margin-top: 18px; }
  .bolk-hode {
    display: flex; align-items: center; gap: 10px;
    padding: 0 6px 10px; cursor: pointer;
  }
  .bolk-prikk { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
  .bolk-hode h3 {
    margin: 0; flex: 1; font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-antall {
    font-size: 12px; font-weight: 700; opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-pil {
    --mdc-icon-size: 18px; opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease;
  }
  .bolk-pil.ned { transform: rotate(0deg); }

  /* ---------- fliser ---------- */
  .fliser { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 8px; }
  .flis {
    display: grid; grid-template-columns: 42px minmax(0, 1fr);
    align-items: center; gap: 10px;
    padding: 11px 13px 11px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .flis-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--flis-farge, var(--gray800));
    --mdc-icon-size: 20px; justify-self: end;
  }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn {
    font-size: 12px; font-weight: 600; opacity: .55;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .flis-verdi {
    font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ---------- søvn ---------- */
  .sovn {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .stolpe {
    display: flex; height: 12px; border-radius: 6px; overflow: hidden;
    background: rgba(0, 0, 0, .16);
  }
  .stolpe i { display: block; height: 100%; transition: width .4s ease; }
  .sovn-tekst { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 14px; }
  .sovn-del {
    display: flex; align-items: center; gap: 7px;
    background: none; padding: 0;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .sovn-del b { font-weight: 700; }
  .prikk { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
  .sovn-linje {
    display: flex; justify-content: space-between; width: 100%;
    margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(128, 128, 128, .2);
    background: none;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .sovn-linje b { font-weight: 700; }

  @media (max-width: 430px) {
    .hero-sum { font-size: 30px; }
    .fliser { grid-template-columns: 1fr 1fr; }
    .flis { grid-template-columns: 36px minmax(0, 1fr); padding-left: 4px; }
    .flis-ikon { width: 34px; height: 34px; --mdc-icon-size: 18px; }
    .flis-verdi { font-size: 15px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stolpe i, .bolk-pil { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

class KiHelseCardEditor extends HTMLElement {
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
    if (!this._config.sections) this._config.sections = [];
    if (!this._config.hero) this._config.hero = {};
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

  _tekstfelt(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
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

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  /**
   * Bygger hele oppsettet på nytt ut fra prefikset. Nyttig når kortet skal
   * over på en annen telefon eller en annen server.
   */
  _oppdag() {
    if (!this._hass) return;
    const pre = this._config.prefix || "";
    if (!pre) {
      this._svar = "Fyll inn prefiks først, f.eks. sensor.min_iphone_";
      this._tegn();
      return;
    }
    const finnes = (suff) => (this._hass.states[pre + suff] ? pre + suff : null);
    let n = 0;

    const hoved = finnes(SUFFIKS.hero_main);
    if (hoved) {
      this._config.hero.main = hoved;
      this._config.hero.main_label = this._config.hero.main_label || "Skritt i dag";
      n++;
    }
    this._config.hero.chips = SUFFIKS.chips
      .map((s) => {
        const e = finnes(s);
        if (!e) return null;
        n++;
        return {
          entity: e,
          name: { active_energy: "Aktiv", exercise_time: "Trening", walking_running_distance: "Distanse" }[s],
        };
      })
      .filter(Boolean);

    const seksjoner = [];
    ["Aktivitet", "Hjerte og pust"].forEach((tittel) => {
      const items = SUFFIKS[tittel]
        .map(([s, navn, ikon]) => {
          const e = finnes(s);
          if (!e) return null;
          n++;
          return { entity: e, name: navn, icon: ikon };
        })
        .filter(Boolean);
      if (items.length)
        seksjoner.push({
          title: tittel,
          color: tittel === "Aktivitet" ? "var(--green)" : "var(--red)",
          items,
        });
    });

    const faser = SUFFIKS.sleep.phases
      .map(([s, navn, farge]) => {
        const e = finnes(s);
        if (!e) return null;
        n++;
        return { entity: e, name: navn, color: farge };
      })
      .filter(Boolean);
    if (faser.length || finnes(SUFFIKS.sleep.total)) {
      seksjoner.push({
        title: "Søvn",
        color: "var(--purple)",
        type: "sleep",
        total: finnes(SUFFIKS.sleep.total) || undefined,
        in_bed: finnes(SUFFIKS.sleep.in_bed) || undefined,
        phases: faser,
      });
    }

    const kropp = SUFFIKS.Kropp.map(([s, navn, ikon]) => {
      const e = finnes(s);
      if (!e) return null;
      n++;
      return { entity: e, name: navn, icon: ikon };
    }).filter(Boolean);
    if (kropp.length)
      seksjoner.push({ title: "Kropp", color: "var(--blue)", items: kropp });

    this._config.sections = seksjoner;
    this._svar = `Fant ${n} entiteter og satte opp ${seksjoner.length} seksjoner.`;
    this._endret();
    this._tegn();
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiHelseCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tr = document.createElement("div");
    tr.className = "tokol";
    tr.appendChild(
      this._tekstfelt("Overskrift", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    tr.appendChild(
      this._ikonfelt(this._config.title_icon, (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tr);
    gen.appendChild(
      this._tekstfelt(
        "Enhetsprefiks",
        this._config.prefix,
        (v) => {
          this._config.prefix = v;
          this._endret();
        }
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Alt foran suffikset, f.eks. sensor.sebastian_iphone_17_pro_ — brukes av knappen under.";
    gen.appendChild(h);
    gen.appendChild(
      this._knapp("Bygg opp fra prefiks", "hovedknapp", () => this._oppdag())
    );
    if (this._svar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._svar;
      gen.appendChild(sv);
    }
    rot.appendChild(gen);

    /* Hero */
    const hero = document.createElement("div");
    hero.className = "boks";
    hero.innerHTML = "<h4>Toppkort</h4>";
    hero.appendChild(
      this._entitetsfelt("Hovedtall", this._config.hero.main, (v) => {
        this._config.hero.main = v;
        this._endret();
      })
    );
    hero.appendChild(
      this._tekstfelt("Etikett", this._config.hero.main_label, (v) => {
        this._config.hero.main_label = v;
        this._endret();
      })
    );
    const cb = document.createElement("div");
    cb.className = "underboks";
    cb.innerHTML = "<div class='undertittel'>Små tall under</div>";
    (this._config.hero.chips || []).forEach((c, ci) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Entitet", c.entity, (v) => {
          c.entity = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._tekstfelt("Navn", c.name, (v) => {
          c.name = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          this._config.hero.chips.splice(ci, 1);
          this._endret();
          this._tegn();
        })
      );
      cb.appendChild(rad);
    });
    cb.appendChild(
      this._knapp("+ Legg til", "hovedknapp liten", () => {
        if (!this._config.hero.chips) this._config.hero.chips = [];
        this._config.hero.chips.push({ entity: "", name: "" });
        this._endret();
        this._tegn();
      })
    );
    hero.appendChild(cb);
    rot.appendChild(hero);

    /* Seksjoner */
    this._config.sections.forEach((s, si) => this._tegnSeksjon(rot, s, si));
    rot.appendChild(
      this._knapp("+ Ny seksjon", "hovedknapp", () => {
        this._config.sections.push({ title: "Ny seksjon", color: "var(--blue)", items: [] });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnSeksjon(rot, s, si) {
    const noekkel = "s" + si;
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const sum = document.createElement("summary");
    sum.textContent = `${s.title || "Seksjon"}${s.type === "sleep" ? " (søvn)" : ""}`;
    d.appendChild(sum);

    const kropp = document.createElement("div");
    kropp.className = "kropp";
    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Tittel", s.title, (v) => {
        s.title = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._tekstfelt("Farge", s.color, (v) => {
        s.color = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    if (s.type === "sleep") {
      kropp.appendChild(
        this._entitetsfelt("Total søvn", s.total, (v) => {
          s.total = v;
          this._endret();
        })
      );
      kropp.appendChild(
        this._entitetsfelt("I sengen", s.in_bed, (v) => {
          s.in_bed = v;
          this._endret();
        })
      );
      const fb = document.createElement("div");
      fb.className = "underboks";
      fb.innerHTML = "<div class='undertittel'>Søvnfaser</div>";
      (s.phases || []).forEach((f, fi) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Entitet", f.entity, (v) => {
            f.entity = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._tekstfelt("Navn", f.name, (v) => {
            f.name = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            s.phases.splice(fi, 1);
            this._endret();
            this._tegn();
          })
        );
        fb.appendChild(rad);
      });
      fb.appendChild(
        this._knapp("+ Legg til fase", "hovedknapp liten", () => {
          if (!s.phases) s.phases = [];
          s.phases.push({ entity: "", name: "", color: "var(--purple)" });
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(fb);
    } else {
      const ib = document.createElement("div");
      ib.className = "underboks";
      ib.innerHTML = "<div class='undertittel'>Verdier</div>";
      (s.items || []).forEach((it, ii) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Entitet", it.entity, (v) => {
            it.entity = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._tekstfelt("Navn", it.name, (v) => {
            it.name = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._ikonfelt(it.icon, (v) => {
            it.icon = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            s.items.splice(ii, 1);
            this._endret();
            this._tegn();
          })
        );
        ib.appendChild(rad);
      });
      ib.appendChild(
        this._knapp("+ Legg til verdi", "hovedknapp liten", () => {
          if (!s.items) s.items = [];
          s.items.push({ entity: "", name: "", icon: "mdi:heart-outline" });
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(ib);
    }

    kropp.appendChild(
      this._knapp("Slett seksjon", "mini fare", () => {
        this._config.sections.splice(si, 1);
        this._endret();
        this._tegn();
      })
    );
    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiHelseCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .kropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

customElements.define("ki-helse-card", KiHelseCard);
customElements.define("ki-helse-card-editor", KiHelseCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-helse-card",
  name: "KI Helse",
  description: "Aktivitet, hjerte, søvn og kropp fra Apple Health.",
  preview: true,
});
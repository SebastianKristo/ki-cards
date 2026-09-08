/**
 * ki-ruter-card.js  —  v1.0.0
 *
 * Kollektivavganger fra Entur-sensorer, med avviksvarsler fra Ruter.
 *
 *   • Avgangstavle per holdeplass: linjenummer, destinasjon, klokkeslett
 *     og nedtelling. Forsinkelser vises i oransje.
 *   • Nedtellingen oppdateres hvert tiende sekund uten å vente på HA
 *   • Avviksbanner øverst når det er meldinger, med linjer som chips
 *   • Full GUI-editor med automatisk oppdaging av transport-sensorer
 *
 * Legges i /config/www/ki-ruter-card.js og registreres som
 * JavaScript Module: /local/ki-ruter-card.js
 */

const KI_RUTER_VERSION = "1.0.0";

console.info(
  `%c KI-RUTER-CARD %c ${KI_RUTER_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e11d48;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── verktøy ── */

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** «12:34» fra ISO-tid, klokkeslett eller Date. */
const klokke = (v) => {
  if (!v) return "";
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
};

/** Minutter til avgang, regnet ut fra tidspunktet hvis mulig. */
const minutterTil = (v) => {
  if (!v) return null;
  let d;
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) {
    const [t, m] = v.split(":").map(Number);
    d = new Date();
    d.setHours(t, m, 0, 0);
    // Passert med mer enn seks timer betyr sannsynligvis i morgen
    if (d.getTime() - Date.now() < -6 * 3600000) d.setDate(d.getDate() + 1);
  } else {
    d = new Date(v);
  }
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 60000);
};

const nedtelling = (min) => {
  if (min === null) return "";
  if (min <= 0) return "nå";
  if (min < 60) return `${min} min`;
  const t = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${t} t ${r} min` : `${t} t`;
};

/** Skiller «21 Helsfyr» i linjenummer og destinasjon. */
const delRute = (rute) => {
  const s = String(rute || "").trim();
  const m = s.match(/^([0-9]+[A-Za-z]?)\s+(.*)$/);
  if (m) return { linje: m[1], mal: m[2] };
  return { linje: "", mal: s };
};

/**
 * Leser avgangene ut av en Entur-sensor. Integrasjonen legger den første
 * avgangen i umerkede attributter og resten som route_1, due_at_1 osv.
 */
const forsinkMin = (v, enhet) => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  if (enhet === "min") return n;
  if (enhet === "s") return n / 60;
  // auto: Entur oppgir sekunder, men noen oppsett bruker minutter.
  // Verdier på 60 og over tolkes som sekunder.
  return Math.abs(n) >= 60 ? n / 60 : n;
};

const lesAvganger = (s, maks, forsinkEnhet) => {
  if (!s || !s.attributes) return [];
  const a = s.attributes;
  const ut = [];

  const legg = (rute, tid, forsinkelse, sanntid) => {
    if (!rute && !tid) return;
    ut.push({
      ...delRute(rute),
      rute,
      tid,
      forsinkelse: forsinkMin(forsinkelse, forsinkEnhet),
      sanntid: sanntid !== false,
    });
  };

  legg(a.route, a.due_at || a.next_due_at, a.delay, a.real_time);
  for (let i = 1; i <= 12; i++) {
    if (a[`route_${i}`] === undefined && a[`due_at_${i}`] === undefined) continue;
    legg(a[`route_${i}`], a[`due_at_${i}`], a[`delay_${i}`], a[`real_time_${i}`]);
  }

  // Første avgang kan mangle tid; da står den i selve tilstanden
  if (ut.length && !ut[0].tid && s.state && s.state !== "unknown") ut[0].tid = s.state;

  return ut
    .filter((x) => x.tid)
    .map((x) => ({ ...x, min: a.next_due_in !== undefined && ut.indexOf(x) === 0
        ? parseInt(a.next_due_in)
        : minutterTil(x.tid) }))
    .filter((x) => x.min === null || x.min >= -2)
    .slice(0, maks || 4);
};

const IKON_MODUS = {
  bus: "mdi:bus",
  tram: "mdi:tram",
  metro: "mdi:subway-variant",
  rail: "mdi:train",
  train: "mdi:train",
  water: "mdi:ferry",
  ferry: "mdi:ferry",
  air: "mdi:airplane",
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-ruter-card",
  title: "Kollektiv",
  title_icon: "mdi:bus-clock",
  max_departures: 4,
  delay_unit: "auto",
  stops: [
    { entity: "sensor.transport_majorstuen", name: "Majorstuen", icon: "mdi:subway-variant" },
    { entity: "sensor.transport_smestad", name: "Smestad", icon: "mdi:subway-variant" },
    { entity: "sensor.transport_bislett", name: "Bislett", icon: "mdi:tram" },
    { entity: "sensor.transport_homansbyen", name: "Homansbyen", icon: "mdi:tram" },
    { entity: "sensor.transport_hovseter", name: "Hovseter", icon: "mdi:subway-variant" },
  ],
  disruptions: {
    summary: "sensor.ruter_disruption_summary",
    lines: [
      { entity: "sensor.ruter_disruption_rut_line_1", name: "1" },
      { entity: "sensor.ruter_disruption_rut_line_2", name: "2" },
      { entity: "sensor.ruter_disruption_rut_line_12", name: "12" },
      { entity: "sensor.ruter_disruption_rut_line_13", name: "13" },
      { entity: "sensor.ruter_disruption_rut_line_15", name: "15" },
      { entity: "sensor.ruter_disruption_rut_line_19", name: "19" },
      { entity: "sensor.ruter_disruption_rut_line_45", name: "45" },
      { entity: "sensor.ruter_disruption_rut_line_46", name: "46" },
    ],
  },
});

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiRuterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apneStopp = new Set();
    this._visAvvik = false;
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-ruter-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.stops) this._config.stops = [];
    if (!this._config.disruptions) this._config.disruptions = {};
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
    return 4 + (this._config.stops || []).length * 2;
  }

  connectedCallback() {
    // Nedtellingen må gå selv om HA ikke sender nye tilstander
    this._timer = setInterval(() => {
      this._signatur = "";
      if (this._hass && this._bygget) this._tegn();
    }, 10000);
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiRuterCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) return;
      const h = el.dataset.handling;
      if (h === "avvik") {
        this._visAvvik = !this._visAvvik;
        this._signatur = "";
        this._tegn();
      } else if (h === "stopp") {
        const i = el.dataset.stopp;
        if (this._apneStopp.has(i)) this._apneStopp.delete(i);
        else this._apneStopp.add(i);
        this._signatur = "";
        this._tegn();
      } else if (h === "mer-info" && el.dataset.entity) {
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
    const maks = cfg.max_departures || 4;

    const stopp = (cfg.stops || [])
      .map((st) => {
        const s = st.entity ? hass.states[st.entity] : null;
        return {
          ...st,
          navn: st.name || (s ? s.attributes.friendly_name : st.entity),
          avganger: lesAvganger(s, maks, cfg.delay_unit || "auto"),
          mangler: !s,
        };
      })
      .filter((st) => !st.mangler || st.entity);

    const d = cfg.disruptions || {};
    const sum = d.summary ? hass.states[d.summary] : null;
    const antAvvik = sum ? parseInt(sum.state) || 0 : 0;

    const sign = JSON.stringify([
      stopp.map((s) => s.avganger.map((a) => [a.rute, a.tid, a.min, a.forsinkelse])),
      antAvvik,
      (d.lines || []).map((l) => (hass.states[l.entity] ? hass.states[l.entity].state : null)),
      this._visAvvik,
      [...this._apneStopp].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._avvikHtml(sum, antAvvik)}
      ${this._linjerHtml()}
      ${stopp.map((st, i) => this._stoppHtml(st, i)).join("")}
    `;
  }

  _tittelHtml() {
    const t = this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(this._config.title_icon || "mdi:bus-clock")}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _avvikHtml(sum, ant) {
    if (!sum) return "";
    if (ant <= 0) {
      return `
        <div class="avvik ok" data-handling="mer-info" data-entity="${esc(
          this._config.disruptions.summary
        )}">
          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
          <span>Ingen meldte avvik</span>
        </div>`;
    }

    const tekst = [
      sum.attributes.markdown_active,
      sum.attributes.markdown_planned,
    ]
      .filter(Boolean)
      .join("\n")
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*/g, "")
      .trim();

    return `
      <div class="avvik varsel">
        <button type="button" class="avvik-hode" data-handling="avvik">
          <ha-icon icon="mdi:alert"></ha-icon>
          <span>${ant} ${ant === 1 ? "avvik" : "avvik"} i kollektivtrafikken</span>
          <ha-icon class="avvik-pil ${this._visAvvik ? "ned" : ""}"
            icon="mdi:chevron-down"></ha-icon>
        </button>
        ${
          this._visAvvik && tekst
            ? `<div class="avvik-tekst">${esc(tekst)}</div>`
            : ""
        }
      </div>`;
  }

  _linjerHtml() {
    const hass = this._hass;
    const linjer = (this._config.disruptions.lines || []).filter(
      (l) => l.entity && hass.states[l.entity]
    );
    if (!linjer.length) return "";

    return `
      <div class="linjer">
        ${linjer
          .map((l) => {
            const s = hass.states[l.entity];
            const n = parseInt(s.state) || 0;
            return `
            <button type="button" class="linje ${n > 0 ? "varsel" : ""}"
              data-handling="mer-info" data-entity="${esc(l.entity)}">
              ${esc(l.name || s.attributes.friendly_name || "")}
              ${n > 0 ? `<em>${n}</em>` : ""}
            </button>`;
          })
          .join("")}
      </div>`;
  }

  _stoppHtml(st, i) {
    const skjult = this._apneStopp.has(String(i));
    const ikon =
      st.icon ||
      IKON_MODUS[(st.mode || "").toLowerCase()] ||
      "mdi:bus";

    const neste = st.avganger[0];

    const rader = st.avganger
      .map((a) => {
        const forsinket = a.forsinkelse !== null && a.forsinkelse > 0.5;
        const naa = a.min !== null && a.min <= 1;
        return `
        <div class="avgang ${naa ? "naa" : ""}">
          <span class="linjenr" style="--linje-farge:${esc(
            st.color || "var(--active-big)"
          )}">${esc(a.linje || "–")}</span>
          <span class="mal">${esc(a.mal || a.rute || "")}</span>
          <span class="tider">
            <span class="ned">${esc(nedtelling(a.min))}</span>
            <span class="klokke">${esc(klokke(a.tid))}${
          forsinket ? `<em>+${Math.round(a.forsinkelse)}</em>` : ""
        }</span>
          </span>
        </div>`;
      })
      .join("");

    return `
      <section class="stopp">
        <header class="stopp-hode" data-handling="stopp" data-stopp="${i}">
          <span class="stopp-ikon"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
          <span class="stopp-navn">
            ${esc(st.navn)}
            ${st.walk ? `<em>${esc(st.walk)} min å gå</em>` : ""}
          </span>
          <span class="stopp-neste">${
            neste ? esc(nedtelling(neste.min)) : st.mangler ? "Mangler" : "Ingen"
          }</span>
          <ha-icon class="stopp-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="avganger" data-handling="mer-info"
                data-entity="${esc(st.entity || "")}">
                ${rader || `<div class="ingen">Ingen avganger å vise</div>`}
              </div>`
        }
      </section>`;
  }
}

KiRuterCard.styles = `
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

  /* ---------- avvik ---------- */
  .avvik { border-radius: 18px; margin-bottom: 10px; overflow: hidden; }
  .avvik.ok {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; cursor: pointer;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    --mdc-icon-size: 19px;
  }
  .avvik.ok ha-icon { color: var(--green, #30a46c); }
  .avvik.varsel { background: var(--red, #e5484d); color: #fff; }
  .avvik-hode {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 13px 16px; background: none; color: inherit;
    font-size: 14px; font-weight: 600; text-align: left;
    --mdc-icon-size: 20px;
  }
  .avvik-hode > span { flex: 1; }
  .avvik-pil { transform: rotate(-90deg); transition: transform .2s ease; }
  .avvik-pil.ned { transform: rotate(0deg); }
  .avvik-tekst {
    padding: 0 16px 16px; font-size: 13px; line-height: 1.55;
    white-space: pre-wrap; opacity: .95;
  }

  /* ---------- linjechips ---------- */
  .linjer { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
  .linje {
    display: flex; align-items: center; gap: 5px;
    min-width: 38px; padding: 7px 11px;
    border-radius: 11px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 700;
    opacity: .55;
  }
  .linje.varsel {
    background: var(--orange, #f5a623); color: var(--black, #1c1c1e); opacity: 1;
  }
  .linje em {
    font-style: normal; font-size: 10px; font-weight: 700;
    background: rgba(0, 0, 0, .22); padding: 1px 5px; border-radius: 6px;
  }

  /* ---------- holdeplass ---------- */
  .stopp + .stopp { margin-top: 14px; }
  .stopp-hode {
    display: flex; align-items: center; gap: 11px;
    padding: 0 6px 9px; cursor: pointer;
  }
  .stopp-ikon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 18px; flex: 0 0 auto;
  }
  .stopp-navn {
    flex: 1; display: flex; flex-direction: column; gap: 1px;
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    overflow: hidden;
  }
  .stopp-navn em {
    font-style: normal; font-size: 11px; font-weight: 500; opacity: .5;
  }
  .stopp-neste {
    font-size: 13px; font-weight: 700; opacity: .6;
    color: var(--gray1000, var(--primary-text-color));
    white-space: nowrap;
  }
  .stopp-pil {
    --mdc-icon-size: 18px; opacity: .4;
    color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease;
  }
  .stopp-pil.ned { transform: rotate(0deg); }

  .avganger {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 4px 14px; cursor: pointer;
  }
  .avgang {
    display: grid; grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center; gap: 12px;
    padding: 11px 0;
    color: var(--gray1000, var(--primary-text-color));
  }
  .avgang + .avgang { border-top: 1px solid rgba(128, 128, 128, .16); }
  .linjenr {
    display: flex; align-items: center; justify-content: center;
    height: 30px; border-radius: 9px;
    background: var(--linje-farge, var(--active-big));
    color: var(--gray100, #fff);
    font-size: 14px; font-weight: 700;
  }
  .mal {
    font-size: 15px; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tider { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .ned {
    font-size: 15px; font-weight: 700;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .avgang.naa .ned { color: var(--green, #30a46c); }
  .klokke {
    font-size: 12px; font-weight: 500; opacity: .55;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .klokke em {
    font-style: normal; font-weight: 700;
    color: var(--orange, #f5a623); margin-left: 4px; opacity: 1;
  }
  .ingen { padding: 16px 0; font-size: 13px; opacity: .55; text-align: center;
    color: var(--gray1000, var(--primary-text-color)); }

  @media (max-width: 400px) {
    .avgang { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; }
    .mal { font-size: 14px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stopp-pil, .avvik-pil { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

class KiRuterCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
    if (!this._config.stops) this._config.stops = [];
    if (!this._config.disruptions) this._config.disruptions = {};
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

  _entitetsfelt(label, verdi, onChange) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = ["sensor"];
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

  /** Finner holdeplass-sensorer og avvikslinjer i denne installasjonen. */
  _oppdag() {
    if (!this._hass) return;
    const alle = Object.keys(this._hass.states);

    // Hovedsensorene, ikke plattformene — de har ikke «_platform_» i navnet
    const stopp = alle
      .filter((id) => id.startsWith("sensor.transport_") && !id.includes("_platform_"))
      .sort();
    const nye = stopp.filter(
      (id) => !this._config.stops.some((s) => s.entity === id)
    );
    nye.forEach((id) => {
      const s = this._hass.states[id];
      this._config.stops.push({
        entity: id,
        name: (s.attributes.friendly_name || id)
          .replace(/^Transport\s+/i, "")
          .trim(),
        icon: "mdi:bus",
      });
    });

    const linjer = alle
      .filter((id) => /disruption.*_line_/.test(id))
      .sort((a, b) => {
        const n = (x) => parseInt((x.match(/_line_(\d+)/) || [])[1] || 0);
        return n(a) - n(b);
      });
    if (!this._config.disruptions.lines || !this._config.disruptions.lines.length) {
      this._config.disruptions.lines = linjer.map((id) => ({
        entity: id,
        name: (id.match(/_line_(\w+)/) || [])[1] || "",
      }));
    }
    if (!this._config.disruptions.summary) {
      const s = alle.find((id) => /disruption_summary$/.test(id));
      if (s) this._config.disruptions.summary = s;
    }

    this._svar = `La til ${nye.length} holdeplasser (${stopp.length} funnet totalt) og ${linjer.length} linjer.`;
    this._endret();
    this._tegn();
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiRuterCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tr = document.createElement("div");
    tr.className = "tokol";
    tr.appendChild(
      this._tekstfelt("Overskrift (tom = skjul)", this._config.title, (v) => {
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
        "Avganger per holdeplass",
        this._config.max_departures || 4,
        (v) => {
          this._config.max_departures = parseInt(v) || 4;
          this._endret();
        },
        "number"
      )
    );
    const fv = document.createElement("label");
    fv.className = "felt";
    fv.innerHTML = "<span>Enhet på forsinkelse</span>";
    const sel = document.createElement("select");
    [["auto", "Gjett automatisk"], ["s", "Sekunder"], ["min", "Minutter"]].forEach(
      ([v, t]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = t;
        sel.appendChild(o);
      }
    );
    sel.value = this._config.delay_unit || "auto";
    sel.addEventListener("change", () => {
      this._config.delay_unit = sel.value;
      this._endret();
    });
    fv.appendChild(sel);
    gen.appendChild(fv);

    gen.appendChild(
      this._knapp("Finn holdeplasser automatisk", "hovedknapp", () => this._oppdag())
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Legger til alle sensor.transport_* som ikke er plattformsensorer, og alle avvikslinjer.";
    gen.appendChild(h);
    if (this._svar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._svar;
      gen.appendChild(sv);
    }
    rot.appendChild(gen);

    /* Holdeplasser */
    const sb = document.createElement("div");
    sb.className = "boks";
    sb.innerHTML = "<h4>Holdeplasser</h4>";
    this._config.stops.forEach((st, si) => {
      const rad = document.createElement("div");
      rad.className = "stopprad";
      rad.appendChild(
        this._entitetsfelt("Sensor", st.entity, (v) => {
          st.entity = v;
          this._endret();
        })
      );
      const r2 = document.createElement("div");
      r2.className = "trekol";
      r2.appendChild(
        this._tekstfelt("Navn", st.name, (v) => {
          st.name = v;
          this._endret();
        })
      );
      r2.appendChild(this._ikonfelt(st.icon, (v) => {
        st.icon = v;
        this._endret();
      }));
      r2.appendChild(
        this._tekstfelt("Gangtid (min)", st.walk, (v) => {
          if (v) st.walk = parseInt(v);
          else delete st.walk;
          this._endret();
        }, "number")
      );
      rad.appendChild(r2);
      const verktoy = document.createElement("div");
      verktoy.className = "verktoy";
      if (si > 0)
        verktoy.appendChild(
          this._knapp("↑", "mini", () => {
            const [x] = this._config.stops.splice(si, 1);
            this._config.stops.splice(si - 1, 0, x);
            this._endret();
            this._tegn();
          })
        );
      if (si < this._config.stops.length - 1)
        verktoy.appendChild(
          this._knapp("↓", "mini", () => {
            const [x] = this._config.stops.splice(si, 1);
            this._config.stops.splice(si + 1, 0, x);
            this._endret();
            this._tegn();
          })
        );
      verktoy.appendChild(
        this._knapp("Slett", "mini fare", () => {
          this._config.stops.splice(si, 1);
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(verktoy);
      sb.appendChild(rad);
    });
    sb.appendChild(
      this._knapp("+ Legg til holdeplass", "hovedknapp liten", () => {
        this._config.stops.push({ entity: "", name: "", icon: "mdi:bus" });
        this._endret();
        this._tegn();
      })
    );
    rot.appendChild(sb);

    /* Avvik */
    const ab = document.createElement("div");
    ab.className = "boks";
    ab.innerHTML = "<h4>Avvik</h4>";
    ab.appendChild(
      this._entitetsfelt("Sammendrag", this._config.disruptions.summary, (v) => {
        this._config.disruptions.summary = v;
        this._endret();
      })
    );
    const lb = document.createElement("div");
    lb.className = "underboks";
    lb.innerHTML = "<div class='undertittel'>Linjer</div>";
    (this._config.disruptions.lines || []).forEach((l, li) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Sensor", l.entity, (v) => {
          l.entity = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._tekstfelt("Vises som", l.name, (v) => {
          l.name = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          this._config.disruptions.lines.splice(li, 1);
          this._endret();
          this._tegn();
        })
      );
      lb.appendChild(rad);
    });
    lb.appendChild(
      this._knapp("+ Legg til linje", "hovedknapp liten", () => {
        if (!this._config.disruptions.lines) this._config.disruptions.lines = [];
        this._config.disruptions.lines.push({ entity: "", name: "" });
        this._endret();
        this._tegn();
      })
    );
    ab.appendChild(lb);
    rot.appendChild(ab);
  }
}

KiRuterCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input, .felt select {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .trekol { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .stopprad {
    border: 1px solid var(--divider-color); border-radius: 10px;
    padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  .verktoy { display: flex; gap: 6px; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 6px 10px; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol, .trekol { grid-template-columns: 1fr; } }
`;

customElements.define("ki-ruter-card", KiRuterCard);
customElements.define("ki-ruter-card-editor", KiRuterCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-ruter-card",
  name: "KI Ruter",
  description: "Kollektivavganger fra Entur med avviksvarsler.",
  preview: true,
});

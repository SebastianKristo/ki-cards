/**
 * ki-stromregning-card.js  —  v1.0.0
 *
 * Strømregning, nettleie og Norgespris i samme designspråk som
 * ki-energi-card, ki-alarm-card og ki-kamera-card.
 *
 *   • Periodebryter: denne måneden / forrige måned
 *   • Regningsspesifikasjon med linjer, fortegn og sum
 *   • Forbruksfordeling dagtariff mot natt/helg
 *   • Norgespris: aktiv nå, prisforskjell mot spot, besparelse
 *   • Kapasitetsledd hos Elvia: trinn, margin til neste, toppforbruk
 *   • Knapp for fakturaverifiserings-rapport
 *   • Full GUI-editor
 *
 * Legges i /config/www/ki-stromregning-card.js og registreres som
 * JavaScript Module: /local/ki-stromregning-card.js
 */

const KI_STROM_VERSION = "1.1.0";

console.info(
  `%c KI-STROMREGNING-CARD %c ${KI_STROM_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#30a46c;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
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

/** Formaterer etter enheten på entiteten: kroner, kWh, kW eller rå tekst. */
const fmt = (v, enhet) => {
  if (v === null || v === undefined) return "–";
  const e = (enhet || "").toLowerCase();
  let des = 2;
  if (e.includes("kwh")) des = 1;
  else if (e === "kw") des = 2;
  else if (Math.abs(v) >= 100) des = 0;
  const t = v.toLocaleString("nb-NO", {
    minimumFractionDigits: des,
    maximumFractionDigits: des,
  });
  return enhet ? `${t} ${enhet}` : t;
};

const fmtEnt = (hass, id) => fmt(tall(hass, id), enhetFor(hass, id));

const STANDARD_KONFIG = () => ({
  type: "custom:ki-stromregning-card",
  title: "Strømregning",
  title_icon: "mdi:file-document-outline",
  periods: [
    {
      name: "Denne måneden",
      total: "sensor.manedlig_forbruk_estimert_manedskostnad",
      total_label: "Estimert månedskostnad",
      accumulated: "sensor.manedlig_forbruk_akkumulert_stromkostnad",
      today: "sensor.manedlig_forbruk_dagens_kostnad",
      consumption_day: "sensor.manedlig_forbruk_manedlig_forbruk_dagtariff",
      consumption_night: "sensor.manedlig_forbruk_manedlig_forbruk_natt_helg",
      consumption_total: "sensor.manedlig_forbruk_manedlig_forbruk_totalt",
      lines: [
        {
          name: "Strøm",
          entity: "sensor.manedlig_forbruk_akkumulert_stromkostnad",
          icon: "mdi:flash",
          color: "var(--orange)",
        },
        {
          name: "Nettleie",
          entity: "sensor.manedlig_forbruk_manedlig_nettleie",
          icon: "mdi:transmission-tower",
          color: "var(--blue)",
        },
        {
          name: "Avgifter",
          entity: "sensor.manedlig_forbruk_manedlig_avgifter",
          icon: "mdi:bank-outline",
          color: "var(--gray800)",
        },
        {
          name: "Strømstøtte",
          entity: "sensor.manedlig_forbruk_manedlig_stromstotte",
          icon: "mdi:hand-coin-outline",
          color: "var(--green)",
          sign: -1,
        },
        {
          name: "Norgespris-kompensasjon",
          entity: "sensor.manedlig_forbruk_norgespris_kompensasjon",
          icon: "mdi:cash-refund",
          color: "var(--green)",
          sign: -1,
        },
      ],
    },
    {
      name: "Forrige måned",
      total: "sensor.forrige_maned_forrige_maned_nettleie",
      total_label: "Nettleie forrige måned",
      consumption_day: "sensor.forrige_maned_forrige_maned_forbruk_dagtariff",
      consumption_night: "sensor.forrige_maned_forrige_maned_forbruk_natt_helg",
      consumption_total: "sensor.forrige_maned_forrige_maned_forbruk_totalt",
      report_button: "button.forrige_maned_lag_fakturaverifiserings_rapport",
      lines: [
        {
          name: "Nettleie",
          entity: "sensor.forrige_maned_forrige_maned_nettleie",
          icon: "mdi:transmission-tower",
          color: "var(--blue)",
        },
        {
          name: "Norgespris-kompensasjon",
          entity: "sensor.forrige_maned_forrige_maned_norgespris_kompensasjon",
          icon: "mdi:cash-refund",
          color: "var(--green)",
          sign: -1,
        },
        {
          name: "Toppforbruk",
          entity: "sensor.forrige_maned_forrige_maned_toppforbruk",
          icon: "mdi:speedometer",
          color: "var(--red)",
          no_sum: true,
        },
      ],
    },
  ],
  norgespris: {
    active: "binary_sensor.norgespris_norgespris_aktiv_na",
    price: "sensor.norgespris_total_strompris_norgespris",
    price_raw: "sensor.norgespris_strompris_norgespris_uten_nettleie",
    diff: "sensor.norgespris_prisforskjell_norgespris",
    spot: "sensor.stromstotte_total_strompris_etter_stotte",
    saving: "sensor.manedlig_forbruk_norgespris_besparelse",
    compensation: "sensor.manedlig_forbruk_norgespris_kompensasjon",
    support_active: "binary_sensor.stromstotte_stromstotte_aktiv_na",
    support: "sensor.stromstotte_stromstotte",
    support_left: "sensor.stromstotte_stromstotte_gjenstaende",
  },
  savings: {
    label: "Norgespris-besparelse",
    hour: "sensor.norgespris_besparelse_time",
    day: "sensor.norgespris_besparelse_dag",
    week: "sensor.norgespris_besparelse_uke",
    month: "sensor.norgespris_besparelse_maned",
    year: "sensor.norgespris_besparelse_ar",
  },
  capacity: {
    step: "sensor.nettleie_elvia_kapasitetstrinn",
    next_threshold: "sensor.neste_effektledd_terskel",
    manual_peak: "input_number.effekt_topp_1",
    power_cost: "sensor.effektledd_kostnad",
    fixed_cost: "sensor.fastledd_kostnad",
    estimate: "sensor.stromregning_estimate",
    step_number: "sensor.nettleie_elvia_kapasitetstrinn_nummer",
    interval: "sensor.nettleie_elvia_kapasitetstrinn_intervall",
    margin: "sensor.nettleie_elvia_margin_til_neste_trinn",
    warning: "binary_sensor.nettleie_elvia_kapasitetsvarsel",
    peak_avg: "sensor.nettleie_elvia_snitt_toppforbruk",
    peaks: [
      "sensor.nettleie_elvia_toppforbruk",
      "sensor.nettleie_elvia_toppforbruk_2",
      "sensor.nettleie_elvia_toppforbruk_3",
    ],
    tariff: "sensor.nettleie_elvia_tariff",
    energy_day: "sensor.nettleie_elvia_energiledd_dag",
    energy_night: "sensor.nettleie_elvia_energiledd_natt_helg",
  },
});

/* ────────────────────────────────────────────────── automatisk oppdaging ── */

/**
 * Mønstre for å finne igjen entitetene på en annen HA-server.
 * Hver oppføring er en liste med suffiks som entity_id kan slutte på.
 * Første treff vinner, så de mest spesifikke står først.
 */
const MONSTER = {
  norgespris: {
    active: ["norgespris_aktiv_na"],
    price: ["total_strompris_norgespris"],
    price_raw: ["strompris_norgespris_uten_nettleie"],
    diff: ["prisforskjell_norgespris"],
    spot: ["total_strompris_etter_stotte", "spotpris_etter_stotte"],
    saving: ["norgespris_besparelse"],
    compensation: ["norgespris_kompensasjon"],
    support_active: ["stromstotte_aktiv_na"],
    support: ["stromstotte_stromstotte"],
    support_left: ["stromstotte_gjenstaende"],
  },
  savings: {
    hour: ["norgespris_besparelse_time"],
    day: ["norgespris_besparelse_dag"],
    week: ["norgespris_besparelse_uke"],
    month: ["norgespris_besparelse_maned"],
    year: ["norgespris_besparelse_ar"],
  },
  capacity: {
    step: ["kapasitetstrinn"],
    step_number: ["kapasitetstrinn_nummer"],
    interval: ["kapasitetstrinn_intervall"],
    margin: ["margin_til_neste_trinn"],
    warning: ["kapasitetsvarsel"],
    peak_avg: ["snitt_toppforbruk"],
    tariff: ["_tariff"],
    energy_day: ["energiledd_dag"],
    energy_night: ["energiledd_natt_helg"],
    next_threshold: ["neste_effektledd_terskel"],
    manual_peak: ["effekt_topp_1"],
    power_cost: ["effektledd_kostnad"],
    fixed_cost: ["fastledd_kostnad"],
    estimate: ["stromregning_estimate"],
  },
};

/** Suffiks som ikke skal treffe: unngår at "kapasitetstrinn" tar "…_nummer". */
const finnEntitet = (hass, suffikser, domener) => {
  const alle = Object.keys(hass.states || {});
  for (const suff of suffikser) {
    const treff = alle.filter((id) => {
      if (domener && !domener.includes(id.split(".")[0])) return false;
      return id.endsWith(suff);
    });
    if (treff.length) {
      treff.sort((a, b) => a.length - b.length);
      return treff[0];
    }
  }
  return null;
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiStromregningCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._periode = 0;
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-stromregning-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.periods || !this._config.periods.length) {
      throw new Error("ki-stromregning-card: 'periods' mangler");
    }
    this._periode = 0;
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
    return 14;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiStromregningCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => this._klikk(e));
    this._bygget = true;
  }

  _klikk(e) {
    const el = e.target.closest("[data-handling]");
    if (!el) return;
    const h = el.dataset.handling;
    if (h === "periode") {
      const i = parseInt(el.dataset.verdi);
      if (i === this._periode) return;
      this._periode = i;
      this._signatur = "";
      this._tegn();
    } else if (h === "mer-info") {
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: el.dataset.entity };
      this.dispatchEvent(ev);
    } else if (h === "rapport") {
      this._hass.callService("button", "press", { entity_id: el.dataset.entity });
    }
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const hass = this._hass;
    const cfg = this._config;
    const p = cfg.periods[this._periode] || cfg.periods[0];

    const fulgte = [
      p.total,
      p.accumulated,
      p.today,
      p.consumption_day,
      p.consumption_night,
      p.consumption_total,
      ...(p.lines || []).map((l) => l.entity),
      ...Object.values(cfg.norgespris || {}),
      ...Object.values(cfg.savings || {}),
      ...Object.values(cfg.capacity || {}).flat(),
    ].filter((x) => typeof x === "string");

    const sign = JSON.stringify([
      this._periode,
      fulgte.map((e) => (hass.states[e] ? hass.states[e].state : null)),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._heroHtml(p)}
      ${this._periodeHtml()}
      ${this._regningHtml(p)}
      ${this._forbrukHtml(p)}
      ${this._norgesprisHtml()}
      ${this._besparelseHtml()}
      ${this._kapasitetHtml()}
      ${this._rapportHtml(p)}
    `;
  }

  _tittelHtml() {
    const t = this._config.title === undefined ? "Strømregning" : this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(
            this._config.title_icon || "mdi:file-document-outline"
          )}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _heroHtml(p) {
    const hass = this._hass;
    const total = tall(hass, p.total);
    const enhet = enhetFor(hass, p.total) || "kr";
    const akk = tall(hass, p.accumulated);
    const idag = tall(hass, p.today);

    const chips = [];
    if (akk !== null)
      chips.push(["Så langt", fmt(akk, enhetFor(hass, p.accumulated) || "kr")]);
    if (idag !== null)
      chips.push(["I dag", fmt(idag, enhetFor(hass, p.today) || "kr")]);
    const np = this._config.norgespris || {};
    const spare = tall(hass, np.saving);
    if (spare !== null)
      chips.push(["Norgespris", fmt(spare, enhetFor(hass, np.saving) || "kr")]);

    return `
      <section class="hero" data-handling="mer-info" data-entity="${esc(p.total || "")}">
        <div class="hero-topp">${esc(p.total_label || p.name || "")}</div>
        <div class="hero-sum">${
          total === null
            ? "–"
            : `${esc(
                total.toLocaleString("nb-NO", {
                  minimumFractionDigits: Math.abs(total) < 100 ? 2 : 0,
                  maximumFractionDigits: Math.abs(total) < 100 ? 2 : 0,
                })
              )}<span>${esc(enhet)}</span>`
        }</div>
        ${
          chips.length
            ? `<div class="chips">${chips
                .map(
                  (c) => `
              <div class="chip">
                <div class="chip-navn">${esc(c[0])}</div>
                <div class="chip-tall">${esc(c[1])}</div>
              </div>`
                )
                .join("")}</div>`
            : ""
        }
      </section>`;
  }

  _periodeHtml() {
    const p = this._config.periods;
    if (p.length < 2) return "";
    return `
      <div class="pille">
        ${p
          .map(
            (x, i) => `
          <button type="button" data-handling="periode" data-verdi="${i}"
            class="${this._periode === i ? "aktiv" : ""}">${esc(x.name)}</button>`
          )
          .join("")}
      </div>`;
  }

  _regningHtml(p) {
    const hass = this._hass;
    const linjer = (p.lines || []).filter((l) => l.entity);
    if (!linjer.length) return "";

    let sum = 0;
    let harSum = false;
    const rader = linjer
      .map((l) => {
        const v = tall(hass, l.entity);
        const enhet = enhetFor(hass, l.entity) || "kr";
        const fortegn = l.sign === -1 ? -1 : 1;
        if (v !== null && !l.no_sum && enhet.toLowerCase().includes("kr")) {
          sum += v * fortegn;
          harSum = true;
        }
        const vist =
          v === null ? "–" : (fortegn === -1 ? "− " : "") + fmt(Math.abs(v), enhet);
        return `
          <button type="button" class="rad" data-handling="mer-info"
            data-entity="${esc(l.entity)}"
            style="--rad-farge:${esc(l.color || "var(--gray800)")}">
            <span class="rad-ikon"><ha-icon icon="${esc(
              l.icon || "mdi:cash"
            )}"></ha-icon></span>
            <span class="rad-navn">${esc(l.name)}</span>
            <span class="rad-verdi ${fortegn === -1 ? "minus" : ""}">${esc(
          vist
        )}</span>
          </button>`;
      })
      .join("");

    return `
      <section class="bolk">
        <header class="bolk-hode"><h3>Spesifikasjon</h3></header>
        <div class="rader">${rader}</div>
        ${
          harSum
            ? `<div class="sumrad">
                <span>Sum</span>
                <span>${esc(fmt(sum, "kr"))}</span>
              </div>`
            : ""
        }
      </section>`;
  }

  _forbrukHtml(p) {
    const hass = this._hass;
    const dag = tall(hass, p.consumption_day);
    const natt = tall(hass, p.consumption_night);
    const tot = tall(hass, p.consumption_total);
    if (dag === null && natt === null && tot === null) return "";

    const sum = dag !== null && natt !== null ? dag + natt : tot;
    const dagP = sum ? ((dag || 0) / sum) * 100 : 0;
    const nattP = sum ? ((natt || 0) / sum) * 100 : 0;

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Forbruk</h3>
          <span class="bolk-hoyre">${esc(
            fmt(sum, enhetFor(hass, p.consumption_total) || "kWh")
          )}</span>
        </header>
        <div class="forbruk">
          <div class="stolpe">
            <i style="width:${dagP.toFixed(1)}%;background:var(--orange)"></i>
            <i style="width:${nattP.toFixed(1)}%;background:var(--blue)"></i>
          </div>
          <div class="forbruk-tekst">
            <button type="button" class="forbruk-del" data-handling="mer-info"
              data-entity="${esc(p.consumption_day || "")}">
              <span class="prikk" style="background:var(--orange)"></span>
              Dagtariff <b>${esc(fmt(dag, "kWh"))}</b>
              <em>${dagP.toFixed(0)} %</em>
            </button>
            <button type="button" class="forbruk-del" data-handling="mer-info"
              data-entity="${esc(p.consumption_night || "")}">
              <span class="prikk" style="background:var(--blue)"></span>
              Natt/helg <b>${esc(fmt(natt, "kWh"))}</b>
              <em>${nattP.toFixed(0)} %</em>
            </button>
          </div>
        </div>
      </section>`;
  }

  _norgesprisHtml() {
    const hass = this._hass;
    const n = this._config.norgespris || {};
    if (!n.price && !n.diff && !n.active) return "";

    const aktiv = hass.states[n.active];
    const på = aktiv && aktiv.state === "on";
    const diff = tall(hass, n.diff);
    const npPris = tall(hass, n.price);
    const spot = tall(hass, n.spot);
    const stotte = hass.states[n.support_active];

    // Positiv prisforskjell = Norgespris er billigst
    const billigst =
      diff === null ? null : diff > 0 ? "Norgespris" : diff < 0 ? "Spotpris" : "likt";

    const fliser = [];
    if (npPris !== null)
      fliser.push([
        "Norgespris nå",
        fmt(npPris, enhetFor(hass, n.price)),
        n.price,
        på ? "var(--green)" : null,
      ]);
    if (spot !== null)
      fliser.push([
        "Spot etter støtte",
        fmt(spot, enhetFor(hass, n.spot)),
        n.spot,
        !på ? "var(--orange)" : null,
      ]);
    if (diff !== null)
      fliser.push(["Prisforskjell", fmt(Math.abs(diff), enhetFor(hass, n.diff)), n.diff, null]);
    if (tall(hass, n.compensation) !== null)
      fliser.push([
        "Kompensasjon",
        fmt(tall(hass, n.compensation), enhetFor(hass, n.compensation) || "kr"),
        n.compensation,
        null,
      ]);
    if (stotte)
      fliser.push([
        "Strømstøtte",
        stotte.state === "on" ? "Aktiv" : "Ikke aktiv",
        n.support_active,
        null,
      ]);
    if (tall(hass, n.support_left) !== null)
      fliser.push([
        "Gjenstående støtte",
        fmt(tall(hass, n.support_left), enhetFor(hass, n.support_left)),
        n.support_left,
        null,
      ]);

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Norgespris</h3>
          ${
            aktiv
              ? `<span class="merke ${på ? "pa" : ""}">${
                  på ? "Aktiv nå" : "Ikke aktiv"
                }</span>`
              : ""
          }
        </header>
        ${
          billigst && billigst !== "likt"
            ? `<div class="notis ${
                billigst === "Norgespris" ? "god" : "advarsel"
              }">${esc(billigst)} er billigst akkurat nå${
                diff !== null
                  ? ` — ${esc(fmt(Math.abs(diff), enhetFor(hass, n.diff)))} i forskjell`
                  : ""
              }</div>`
            : ""
        }
        <div class="fliser">
          ${fliser
            .map(
              (f) => `
            <button type="button" class="flis ${f[3] ? "uthevet" : ""}"
              style="--flis-farge:${esc(f[3] || "var(--gray800)")}"
              data-handling="mer-info" data-entity="${esc(f[2] || "")}">
              <span class="flis-navn">${esc(f[0])}</span>
              <span class="flis-verdi">${esc(f[1])}</span>
            </button>`
            )
            .join("")}
        </div>
      </section>`;
  }

  _besparelseHtml() {
    const hass = this._hass;
    const b = this._config.savings || {};
    const perioder = [
      ["hour", "Time"],
      ["day", "Dag"],
      ["week", "Uke"],
      ["month", "Måned"],
      ["year", "År"],
    ].filter(([k]) => b[k] && hass.states[b[k]]);
    if (!perioder.length) return "";

    // Positiv besparelse = Norgespris lønner seg
    const aar = tall(hass, b.year);
    const retning = aar === null ? 0 : aar > 0 ? 1 : aar < 0 ? -1 : 0;

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>${esc(b.label || "Besparelse")}</h3>
          ${
            retning !== 0
              ? `<span class="merke ${retning > 0 ? "pa" : "varsel"}">${
                  retning > 0 ? "Norgespris lønner seg" : "Spotpris lønner seg"
                }</span>`
              : ""
          }
        </header>
        <div class="spar">
          ${perioder
            .map(([k, navn]) => {
              const v = tall(hass, b[k]);
              const pos = v !== null && v > 0;
              const neg = v !== null && v < 0;
              return `
              <button type="button" class="spar-del ${pos ? "pluss" : ""} ${
                neg ? "minus" : ""
              }" data-handling="mer-info" data-entity="${esc(b[k])}">
                <span class="spar-navn">${esc(navn)}</span>
                <span class="spar-verdi">${
                  v === null
                    ? "–"
                    : esc(
                        (v > 0 ? "+" : v < 0 ? "−" : "") +
                          fmt(Math.abs(v), enhetFor(hass, b[k]) || "kr")
                      )
                }</span>
              </button>`;
            })
            .join("")}
        </div>
      </section>`;
  }

  _kapasitetHtml() {
    const hass = this._hass;
    const k = this._config.capacity || {};
    if (!k.step && !k.margin) return "";

    const trinn = hass.states[k.step];
    const nr = hass.states[k.step_number];
    const intervall = hass.states[k.interval];
    const margin = tall(hass, k.margin);
    const varsel = hass.states[k.warning];
    const snitt = tall(hass, k.peak_avg);

    // Plasser snittet inne i trinnets intervall, når det lar seg lese
    let plassering = null;
    if (intervall && snitt !== null) {
      const t = String(intervall.state).match(/(\d+[.,]?\d*)/g);
      if (t && t.length >= 2) {
        const fra = parseFloat(t[0].replace(",", "."));
        const til = parseFloat(t[1].replace(",", "."));
        if (til > fra) plassering = Math.min(100, Math.max(0, ((snitt - fra) / (til - fra)) * 100));
      }
    }

    const topper = (k.peaks || [])
      .map((e, i) => {
        const v = tall(hass, e);
        if (v === null) return "";
        return `
          <button type="button" class="topp" data-handling="mer-info" data-entity="${esc(e)}">
            <span class="topp-nr">${i + 1}</span>
            <span class="topp-verdi">${esc(fmt(v, enhetFor(hass, e) || "kW"))}</span>
          </button>`;
      })
      .join("");

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Kapasitetsledd</h3>
          ${
            varsel && varsel.state === "on"
              ? `<span class="merke varsel">Nær neste trinn</span>`
              : ""
          }
        </header>
        <div class="kap">
          <div class="kap-topp">
            <div>
              <div class="kap-trinn">${esc(
                trinn ? trinn.state : nr ? `Trinn ${nr.state}` : "–"
              )}</div>
              ${
                intervall
                  ? `<div class="kap-intervall">${esc(intervall.state)}</div>`
                  : ""
              }
            </div>
            <div class="kap-hoyre">
              ${
                snitt !== null
                  ? `<div class="kap-snitt">${esc(
                      fmt(snitt, enhetFor(hass, k.peak_avg) || "kW")
                    )}</div><div class="kap-merk">snitt topp</div>`
                  : ""
              }
            </div>
          </div>
          ${
            plassering !== null
              ? `<div class="stolpe kap-stolpe">
                  <i style="width:${plassering.toFixed(1)}%;background:${
                  varsel && varsel.state === "on" ? "var(--red)" : "var(--green)"
                }"></i>
                </div>`
              : ""
          }
          ${
            margin !== null || tall(hass, k.next_threshold) !== null
              ? `<div class="kap-margin">${
                  margin !== null
                    ? esc(fmt(margin, enhetFor(hass, k.margin) || "kW")) +
                      " igjen til neste trinn"
                    : ""
                }${
                  margin !== null && tall(hass, k.next_threshold) !== null ? " · " : ""
                }${
                  tall(hass, k.next_threshold) !== null
                    ? "terskel " +
                      esc(
                        fmt(
                          tall(hass, k.next_threshold),
                          enhetFor(hass, k.next_threshold) || "kW"
                        )
                      )
                    : ""
                }</div>`
              : ""
          }
          ${topper ? `<div class="topper">${topper}</div>` : ""}
          ${this._kostnadslinjer(k)}
        </div>
      </section>`;
  }

  /** Fastledd, effektledd og estimat — det som lå i strom_billig_settings. */
  _kostnadslinjer(k) {
    const hass = this._hass;
    const felt = [
      ["fixed_cost", "Fastledd"],
      ["power_cost", "Effektledd"],
      ["manual_peak", "Registrert topp"],
      ["estimate", "Estimert regning"],
    ].filter(([f]) => k[f] && hass.states[k[f]]);
    if (!felt.length) return "";
    return `
      <div class="kap-linjer">
        ${felt
          .map(
            ([f, navn]) => `
          <button type="button" class="kap-linje" data-handling="mer-info"
            data-entity="${esc(k[f])}">
            <span>${esc(navn)}</span>
            <b>${esc(fmtEnt(hass, k[f]))}</b>
          </button>`
          )
          .join("")}
      </div>`;
  }

  _rapportHtml(p) {
    const id = p.report_button || this._config.report_button;
    if (!id || !this._hass.states[id]) return "";
    return `
      <button type="button" class="rapport" data-handling="rapport" data-entity="${esc(
        id
      )}">
        <ha-icon icon="mdi:file-check-outline"></ha-icon>
        <span>Lag fakturaverifiserings-rapport</span>
      </button>`;
  }
}

KiStromregningCard.styles = `
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
    margin: 0; flex: 1;
    font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }

  /* ---------- hero ---------- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 24px; padding: 18px 20px;
    margin-bottom: 12px; cursor: pointer;
  }
  .hero-topp { font-size: 13px; font-weight: 600; opacity: .75; }
  .hero-sum {
    font-size: 34px; font-weight: 700; line-height: 1.15;
    margin: 4px 0 2px; font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 17px; font-weight: 600; opacity: .75; margin-left: 5px; }
  .chips {
    display: flex; gap: 6px; margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .chip { flex: 1; text-align: center; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall { font-size: 15px; font-weight: 700; line-height: 1.4; font-variant-numeric: tabular-nums; }

  /* ---------- periodebryter ---------- */
  .pille {
    display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
    gap: 4px; background: var(--gray200, var(--card-background-color));
    border-radius: 16px; padding: 4px; height: 44px; margin-bottom: 20px;
  }
  .pille button {
    background: transparent; color: var(--gray1000, var(--primary-text-color));
    opacity: .5; border-radius: 12px; font-size: 13px; font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff); opacity: 1;
  }

  /* ---------- bolker ---------- */
  .bolk + .bolk { margin-top: 20px; }
  .bolk-hode {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 0 6px 10px;
  }
  .bolk-hode h3 {
    margin: 0; font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-hoyre {
    font-size: 13px; font-weight: 700; opacity: .6;
    color: var(--gray1000, var(--primary-text-color));
    font-variant-numeric: tabular-nums;
  }
  .merke {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 10px;
    background: rgba(128, 128, 128, .22);
    color: var(--gray1000, var(--primary-text-color));
  }
  .merke.pa { background: var(--green, #30a46c); color: #fff; }
  .merke.varsel { background: var(--red, #e5484d); color: #fff; }

  /* ---------- spesifikasjon ---------- */
  .rader { display: flex; flex-direction: column; gap: 8px; }
  .rad {
    display: grid; grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center; gap: 12px;
    padding: 11px 14px 11px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .rad-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--rad-farge, var(--gray800));
    --mdc-icon-size: 21px; justify-self: end;
  }
  .rad-navn {
    font-size: 15px; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .rad-verdi { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rad-verdi.minus { color: var(--green, #30a46c); }
  .sumrad {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 10px; padding: 14px 16px;
    border-radius: 18px;
    background: var(--gray1000, var(--primary-text-color));
    color: var(--gray200, #222);
    font-size: 16px; font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* ---------- forbruk ---------- */
  .forbruk {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .stolpe {
    display: flex; height: 10px; border-radius: 5px; overflow: hidden;
    background: rgba(0, 0, 0, .16);
  }
  .stolpe i { display: block; height: 100%; transition: width .4s ease; }
  .forbruk-tekst { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 12px; }
  .forbruk-del {
    display: flex; align-items: center; gap: 7px;
    background: none; padding: 0;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .forbruk-del b { font-weight: 700; }
  .forbruk-del em { font-style: normal; opacity: .5; font-weight: 600; }
  .prikk { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }

  /* ---------- fliser ---------- */
  .notis {
    padding: 11px 14px; border-radius: 14px; margin-bottom: 8px;
    font-size: 13px; font-weight: 600;
    background: rgba(128, 128, 128, .16);
    color: var(--gray1000, var(--primary-text-color));
  }
  .notis.god { background: rgba(48, 164, 108, .18); }
  .notis.advarsel { background: rgba(245, 166, 35, .18); }
  .fliser { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
  .flis {
    display: flex; flex-direction: column; gap: 3px;
    padding: 13px 15px; border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    border-left: 3px solid transparent;
  }
  .flis.uthevet { border-left-color: var(--flis-farge, var(--green)); }
  .flis-navn { font-size: 12px; font-weight: 600; opacity: .6; }
  .flis-verdi { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- kapasitet ---------- */
  .kap {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .kap-topp { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .kap-trinn { font-size: 20px; font-weight: 700; color: var(--gray1000, var(--primary-text-color)); }
  .kap-intervall { font-size: 12px; opacity: .6; margin-top: 2px; color: var(--gray1000, var(--primary-text-color)); }
  .kap-hoyre { text-align: right; }
  .kap-snitt { font-size: 18px; font-weight: 700; color: var(--gray1000, var(--primary-text-color)); font-variant-numeric: tabular-nums; }
  .kap-merk { font-size: 11px; font-weight: 600; opacity: .5; color: var(--gray1000, var(--primary-text-color)); }
  .kap-stolpe { margin-top: 14px; }
  .kap-margin { font-size: 12px; font-weight: 600; opacity: .6; margin-top: 8px; color: var(--gray1000, var(--primary-text-color)); }
  .topper { display: flex; gap: 8px; margin-top: 14px; }
  .topp {
    flex: 1; display: flex; align-items: center; gap: 8px;
    padding: 9px 11px; border-radius: 13px;
    background: rgba(0, 0, 0, .14);
    color: var(--gray1000, var(--primary-text-color));
  }
  .topp-nr {
    width: 19px; height: 19px; border-radius: 50%;
    background: rgba(128, 128, 128, .3);
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  }
  .topp-verdi { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- besparelse ---------- */
  .spar { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
  .spar-del {
    display: flex; flex-direction: column; gap: 3px;
    padding: 12px 10px; border-radius: 16px; text-align: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .spar-navn { font-size: 11px; font-weight: 600; opacity: .55; }
  .spar-verdi { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .spar-del.pluss .spar-verdi { color: var(--green, #30a46c); }
  .spar-del.minus .spar-verdi { color: var(--red, #e5484d); }

  /* ---------- kostnadslinjer ---------- */
  .kap-linjer {
    display: flex; flex-direction: column; gap: 1px;
    margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(128, 128, 128, .2);
  }
  .kap-linje {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; padding: 8px 2px;
    background: none;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .kap-linje b { font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- rapportknapp ---------- */
  .rapport {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; margin-top: 20px; padding: 15px;
    border-radius: 18px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 14px; font-weight: 600;
    --mdc-icon-size: 20px;
  }
  .rapport:active { filter: brightness(1.2); }

  @media (max-width: 430px) {
    .hero-sum { font-size: 30px; }
    .topper { flex-direction: column; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stolpe i, .pille button { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

const FLISFELT = {
  norgespris: [
    ["active", "Aktiv nå", ["binary_sensor"]],
    ["price", "Total strømpris (Norgespris)", ["sensor"]],
    ["price_raw", "Strømpris uten nettleie", ["sensor"]],
    ["diff", "Prisforskjell", ["sensor"]],
    ["spot", "Spotpris etter støtte", ["sensor"]],
    ["saving", "Besparelse", ["sensor"]],
    ["compensation", "Kompensasjon", ["sensor"]],
    ["support_active", "Strømstøtte aktiv", ["binary_sensor"]],
    ["support", "Strømstøtte", ["sensor"]],
    ["support_left", "Gjenstående støtte", ["sensor"]],
  ],
  savings: [
    ["hour", "Besparelse time", ["sensor"]],
    ["day", "Besparelse dag", ["sensor"]],
    ["week", "Besparelse uke", ["sensor"]],
    ["month", "Besparelse måned", ["sensor"]],
    ["year", "Besparelse år", ["sensor"]],
  ],
  capacity: [
    ["step", "Kapasitetstrinn", ["sensor"]],
    ["next_threshold", "Neste effektledd-terskel", ["sensor"]],
    ["manual_peak", "Manuell topp", ["input_number", "sensor"]],
    ["power_cost", "Effektledd-kostnad", ["sensor"]],
    ["fixed_cost", "Fastledd-kostnad", ["sensor"]],
    ["estimate", "Strømregning estimat", ["sensor"]],
    ["step_number", "Trinnummer", ["sensor"]],
    ["interval", "Trinnintervall", ["sensor"]],
    ["margin", "Margin til neste trinn", ["sensor"]],
    ["warning", "Kapasitetsvarsel", ["binary_sensor"]],
    ["peak_avg", "Snitt toppforbruk", ["sensor"]],
    ["tariff", "Tariff", ["sensor"]],
    ["energy_day", "Energiledd dag", ["sensor"]],
    ["energy_night", "Energiledd natt/helg", ["sensor"]],
  ],
};

class KiStromregningCardEditor extends HTMLElement {
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
    if (!this._config.periods) this._config.periods = STANDARD_KONFIG().periods;
    if (!this._config.norgespris) this._config.norgespris = {};
    if (!this._config.capacity) this._config.capacity = {};
    if (!this._config.savings) this._config.savings = {};
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

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = domener || ["sensor"];
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

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiStromregningCardEditor.styles}</style>`;
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

    const oppdag = document.createElement("div");
    oppdag.className = "oppdag";
    oppdag.appendChild(
      this._knapp("Finn entiteter automatisk", "hovedknapp", () => this._oppdag())
    );
    const hjelp = document.createElement("p");
    hjelp.className = "hjelp";
    hjelp.textContent =
      "Leter opp entiteter etter navnemønster i denne HA-installasjonen og fyller ut feltene som er tomme. Nyttig når kortet flyttes til en annen server.";
    oppdag.appendChild(hjelp);
    if (this._oppdagSvar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._oppdagSvar;
      oppdag.appendChild(sv);
    }
    gen.appendChild(oppdag);
    rot.appendChild(gen);

    this._config.periods.forEach((p, pi) => this._tegnPeriode(rot, p, pi));
    rot.appendChild(
      this._knapp("+ Ny periode", "hovedknapp", () => {
        this._config.periods.push({ name: "Ny periode", lines: [] });
        this._endret();
        this._tegn();
      })
    );

    this._tegnGruppe(rot, "Norgespris og strømstøtte", "norgespris");
    this._tegnGruppe(rot, "Besparelse over tid", "savings");
    this._tegnGruppe(rot, "Kapasitetsledd og nettleie", "capacity");
  }

  /** Fyller ut tomme entitetsfelt ved å lete etter kjente navnemønstre. */
  _oppdag(overskriv) {
    if (!this._hass) return;
    let funnet = 0;
    let manglet = 0;

    Object.entries(MONSTER).forEach(([gruppe, felt]) => {
      if (!this._config[gruppe]) this._config[gruppe] = {};
      Object.entries(felt).forEach(([navn, suffikser]) => {
        const eksisterende = this._config[gruppe][navn];
        if (eksisterende && this._hass.states[eksisterende] && !overskriv) return;
        const treff = finnEntitet(this._hass, suffikser);
        if (treff) {
          this._config[gruppe][navn] = treff;
          funnet++;
        } else {
          manglet++;
        }
      });
    });

    // Toppforbruk-listen
    if (!this._config.capacity.peaks || !this._config.capacity.peaks.length) {
      const topper = Object.keys(this._hass.states)
        .filter((id) => /toppforbruk(_\d+)?$/.test(id) && !id.includes("snitt"))
        .sort();
      if (topper.length) {
        this._config.capacity.peaks = topper.slice(0, 3);
        funnet += topper.slice(0, 3).length;
      }
    }

    this._oppdagSvar = `Fylte ut ${funnet} felt. ${
      manglet ? manglet + " fant jeg ikke — fyll dem inn manuelt." : "Alt ble funnet."
    }`;
    this._endret();
    this._tegn();
  }

  _tegnGruppe(rot, tittel, noekkel) {
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = tittel;
    d.appendChild(s);
    const kropp = document.createElement("div");
    kropp.className = "kropp";
    FLISFELT[noekkel].forEach(([felt, label, dom]) => {
      kropp.appendChild(
        this._entitetsfelt(
          label,
          this._config[noekkel][felt],
          (v) => {
            if (v) this._config[noekkel][felt] = v;
            else delete this._config[noekkel][felt];
            this._endret();
          },
          dom
        )
      );
    });

    if (noekkel === "capacity") {
      const tb = document.createElement("div");
      tb.className = "underboks";
      tb.innerHTML = "<div class='undertittel'>Toppforbruk</div>";
      const liste = this._config.capacity.peaks || [];
      liste.forEach((e, ei) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Topp " + (ei + 1), e, (v) => {
            if (v) liste[ei] = v;
            else liste.splice(ei, 1);
            this._endret();
            this._tegn();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            liste.splice(ei, 1);
            this._endret();
            this._tegn();
          })
        );
        tb.appendChild(rad);
      });
      tb.appendChild(
        this._knapp("+ Legg til topp", "hovedknapp liten", () => {
          if (!this._config.capacity.peaks) this._config.capacity.peaks = [];
          this._config.capacity.peaks.push("");
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(tb);
    }

    d.appendChild(kropp);
    rot.appendChild(d);
  }

  _tegnPeriode(rot, p, pi) {
    const noekkel = "p" + pi;
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = p.name || "Periode";
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "kropp";

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Navn", p.name, (v) => {
        p.name = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._tekstfelt("Etikett over totalen", p.total_label, (v) => {
        p.total_label = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    [
      ["total", "Total (vises stort)"],
      ["accumulated", "Akkumulert så langt"],
      ["today", "Dagens kostnad"],
      ["consumption_day", "Forbruk dagtariff"],
      ["consumption_night", "Forbruk natt/helg"],
      ["consumption_total", "Forbruk totalt"],
    ].forEach(([felt, label]) => {
      kropp.appendChild(
        this._entitetsfelt(label, p[felt], (v) => {
          if (v) p[felt] = v;
          else delete p[felt];
          this._endret();
        })
      );
    });

    kropp.appendChild(
      this._entitetsfelt(
        "Rapportknapp",
        p.report_button,
        (v) => {
          if (v) p.report_button = v;
          else delete p.report_button;
          this._endret();
        },
        ["button", "script"]
      )
    );

    const lb = document.createElement("div");
    lb.className = "underboks";
    lb.innerHTML = "<div class='undertittel'>Linjer i spesifikasjonen</div>";
    (p.lines || []).forEach((l, li) => {
      const ld = document.createElement("details");
      ld.className = "linje";
      const lnoekkel = `${pi}:${li}`;
      ld.open = this._apne.has(lnoekkel);
      ld.addEventListener("toggle", () => {
        if (ld.open) this._apne.add(lnoekkel);
        else this._apne.delete(lnoekkel);
      });
      const ls = document.createElement("summary");
      ls.textContent = l.name || "Ny linje";
      ld.appendChild(ls);

      const lk = document.createElement("div");
      lk.className = "kropp";
      const lr = document.createElement("div");
      lr.className = "tokol";
      lr.appendChild(
        this._tekstfelt("Navn", l.name, (v) => {
          l.name = v;
          this._endret();
          this._tegn();
        })
      );
      lr.appendChild(
        this._ikonfelt(l.icon, (v) => {
          l.icon = v;
          this._endret();
        })
      );
      lk.appendChild(lr);
      lk.appendChild(
        this._entitetsfelt("Entitet", l.entity, (v) => {
          l.entity = v;
          this._endret();
        })
      );
      lk.appendChild(
        this._tekstfelt("Farge", l.color, (v) => {
          l.color = v;
          this._endret();
        })
      );
      lk.appendChild(
        this._avkryssing("Trekkes fra (negativ linje)", l.sign === -1, (v) => {
          if (v) l.sign = -1;
          else delete l.sign;
          this._endret();
        })
      );
      lk.appendChild(
        this._avkryssing("Hold utenfor summen", l.no_sum, (v) => {
          if (v) l.no_sum = true;
          else delete l.no_sum;
          this._endret();
        })
      );
      lk.appendChild(
        this._knapp("Slett linje", "mini fare", () => {
          p.lines.splice(li, 1);
          this._endret();
          this._tegn();
        })
      );
      ld.appendChild(lk);
      lb.appendChild(ld);
    });
    lb.appendChild(
      this._knapp("+ Legg til linje", "hovedknapp liten", () => {
        if (!p.lines) p.lines = [];
        p.lines.push({ name: "Ny linje", icon: "mdi:cash", color: "var(--gray800)" });
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(lb);

    kropp.appendChild(
      this._knapp("Slett periode", "mini fare", () => {
        this._config.periods.splice(pi, 1);
        this._endret();
        this._tegn();
      })
    );

    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiStromregningCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .kropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .avkryss { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text-color); cursor: pointer; }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .linje { border: 1px solid var(--divider-color); border-radius: 10px; padding: 8px 10px; }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .oppdag {
    display: flex; flex-direction: column; gap: 8px;
    margin-top: 4px; padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

customElements.define("ki-stromregning-card", KiStromregningCard);
customElements.define("ki-stromregning-card-editor", KiStromregningCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-stromregning-card",
  name: "KI Strømregning",
  description: "Strømregning, nettleie, kapasitetsledd og Norgespris.",
  preview: true,
});
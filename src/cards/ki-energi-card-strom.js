/**
 * ki-energi-card-strom.js  —  v1.0.0
 *
 * Energioversikt for Home Assistant.
 *   • To seksjoner: "Kategorier" (tverrgående, f.eks. oppvarming, belysning)
 *     og "Kurser" (sikringskurser per rom). Overlapp mellom dem er tilsiktet —
 *     en panelovn ligger både i Oppvarming og i Stue-kursen.
 *   • Hver seksjon sorteres synkende etter forbruk.
 *   • Brytere for kr/kWh, i dag/måned og prismodell.
 *   • Full GUI-editor: legg til/fjern seksjoner og rader, velg entiteter,
 *     ikon og farge.
 *
 * Legges i /config/www/ki-energi-card-strom.js og registreres som
 * JavaScript Module: /local/ki-energi-card-strom.js
 */

const KI_ENERGI_VERSION = "1.2.0";

console.info(
  `%c KI-ENERGI-CARD %c ${KI_ENERGI_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#f5a623;color:#1c1c1e;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── helpers ── */

const FARGER = [
  { navn: "Gul", verdi: "var(--yellow)" },
  { navn: "Oransje", verdi: "var(--orange)" },
  { navn: "Rød", verdi: "var(--red)" },
  { navn: "Rosa", verdi: "var(--pink)" },
  { navn: "Lilla", verdi: "var(--purple)" },
  { navn: "Blå", verdi: "var(--blue)" },
  { navn: "Grønn", verdi: "var(--green)" },
  { navn: "Grå", verdi: "var(--gray800)" },
];

const num = (hass, id) => {
  if (!id || !hass || !hass.states[id]) return null;
  const v = parseFloat(hass.states[id].state);
  return isNaN(v) ? null : v;
};

const fmt = (v, enhet) => {
  if (v === null) return "–";
  const des = v < 10 ? 2 : v < 100 ? 1 : 0;
  return (
    v.toLocaleString("nb-NO", {
      minimumFractionDigits: des,
      maximumFractionDigits: des,
    }) +
    " " +
    enhet
  );
};

/**
 * Finner kostnadsentiteten for gjeldende prismodell.
 * Rekkefølge når Norgespris er valgt:
 *   1. eksplisitt utfylt alt-entitet
 *   2. hovedentiteten + endelsen fra `alt_suffix`, hvis den finnes i HA
 *   3. hovedentiteten (fallback, så kortet aldri blir tomt)
 */
const finnKostnad = (hass, base, altBase, alt, suffix) => {
  if (!alt) return base;
  if (altBase) return altBase;
  if (suffix && base) {
    const kandidat = base + suffix;
    if (hass && hass.states[kandidat]) return kandidat;
  }
  return base;
};

/** Velger riktig entitet for en rad ut fra enhet/periode/prismodell. */
const velgEntitet = (rad, enhet, periode, alt, hass, suffix) => {
  if (enhet === "kwh") {
    return periode === "month" ? rad.energy_monthly : rad.energy_daily;
  }
  const base = periode === "month" ? rad.cost_monthly : rad.cost_daily;
  const altBase = periode === "month" ? rad.cost_monthly_alt : rad.cost_daily_alt;
  return finnKostnad(hass, base, altBase, alt, suffix);
};

/** Samme logikk for de valgfrie totalsensorene. */
const velgTotal = (totals, enhet, periode, alt, hass, suffix) => {
  if (!totals) return null;
  if (enhet === "kwh") {
    return periode === "month" ? totals.energy_monthly : totals.energy_daily;
  }
  const base = periode === "month" ? totals.cost_monthly : totals.cost_daily;
  const altBase =
    periode === "month" ? totals.cost_monthly_alt : totals.cost_daily_alt;
  return finnKostnad(hass, base, altBase, alt, suffix);
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-energi-card-strom",
  title: "Energi",
  price_entity: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
  price_entity_alt: "sensor.norgespris_pris_na",
  alt_suffix: "_norgespris",
  default_unit: "kr",
  default_period: "day",
  default_price: "alt",
  groups: [
    {
      title: "Kategorier",
      subtitle: "På tvers av rom",
      items: [
        {
          name: "Oppvarming",
          icon: "mdi:heating-coil",
          color: "var(--red)",
          cost_daily: "sensor.um_daily_cost_oppvarming_kurs",
          cost_monthly: "sensor.um_monthly_cost_oppvarming_kurs",
          energy_daily: "sensor.oppvarming_energy_daily",
          energy_monthly: "sensor.oppvarming_energy_monthly",
        },
        {
          name: "Belysning",
          icon: "mdi:lamp",
          color: "var(--yellow)",
          cost_daily: "sensor.um_daily_cost_lights",
          cost_monthly: "sensor.um_monthly_cost_lights",
          energy_daily: "sensor.lys_energy_daily",
          energy_monthly: "sensor.lys_energy_monthly",
        },
        {
          name: "Hvitvarer",
          icon: "mdi:fridge",
          color: "var(--blue)",
          cost_daily: "sensor.um_daily_cost_hvitvarer",
          cost_monthly: "sensor.um_monthly_cost_hvitvarer",
          energy_daily: "sensor.hvitvarer_energy_daily",
          energy_monthly: "sensor.hvitvarer_energy_monthly",
        },
        {
          name: "Data og nettverk",
          icon: "mdi:nas",
          color: "var(--gray800)",
          cost_daily: "sensor.um_daily_cost_data",
          cost_monthly: "sensor.um_monthly_cost_data",
          energy_daily: "sensor.data_energy_daily",
          energy_monthly: "sensor.data_energy_monthly",
        },
      ],
    },
    {
      title: "Kurser",
      subtitle: "Per sikringskurs",
      items: [
        {
          name: "Varmtvannsbereder",
          icon: "mdi:water-boiler",
          color: "var(--orange)",
          cost_daily: "sensor.um_daily_cost_varmtvannsbereder_kurs",
          cost_monthly: "sensor.um_monthly_cost_varmtvannsbereder_kurs",
          energy_daily: "sensor.varmtvannsbereder_kurs_energy_daily",
          energy_monthly: "sensor.varmtvannsbereder_kurs_energy_monthly",
        },
        {
          name: "Stue",
          icon: "mdi:sofa",
          color: "var(--orange)",
          cost_daily: "sensor.um_daily_cost_stue_kurs",
          cost_monthly: "sensor.um_monthly_cost_stue_kurs",
          energy_daily: "sensor.stue_kurs_energy_daily",
          energy_monthly: "sensor.stue_kurs_energy_monthly",
        },
        {
          name: "Kjøkken",
          icon: "mdi:knife",
          color: "var(--green)",
          cost_daily: "sensor.um_daily_cost_kjokken_kurs",
          cost_monthly: "sensor.um_monthly_cost_kjokken_kurs",
          energy_daily: "sensor.kjokken_kurs_energy_daily",
          energy_monthly: "sensor.kjokken_kurs_energy_monthly",
        },
        {
          name: "Soverom og bad",
          icon: "mdi:bed-double-outline",
          color: "var(--purple)",
          cost_daily: "sensor.um_daily_cost_soverom_og_bad_kurs",
          cost_monthly: "sensor.um_monthly_cost_soverom_og_bad_kurs",
          energy_daily: "sensor.soverom_og_bad_kurs_energy_daily",
          energy_monthly: "sensor.soverom_og_bad_kurs_energy_monthly",
        },
        {
          name: "Vaskegang og do",
          icon: "mdi:washing-machine",
          color: "var(--pink)",
          cost_daily: "sensor.um_daily_cost_vaskegang_kurs",
          cost_monthly: "sensor.um_monthly_cost_vaskegang_kurs",
          energy_daily: "sensor.vaskegang_og_do_kurs_energy_daily",
          energy_monthly: "sensor.vaskegang_og_do_kurs_energy_monthly",
        },
        {
          name: "Gang og bod",
          icon: "mdi:door",
          color: "var(--blue)",
          cost_daily: "sensor.um_daily_cost_gang_og_bod_kurs",
          cost_monthly: "sensor.um_monthly_cost_gang_og_bod_kurs",
          energy_daily: "sensor.gang_og_bod_kurs_energy_daily",
          energy_monthly: "sensor.gang_og_bod_kurs_energy_monthly",
        },
      ],
    },
  ],
});

/* ──────────────────────────────────────────────────────────────── kortet ── */

class KiEnergiCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._enhet = "kr";
    this._periode = "day";
    this._alt = false;
    this._bygget = false;
    this._signatur = "";
    this._apne = new Set();
  }

  static getConfigElement() {
    return document.createElement("ki-energi-card-strom-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    if (!config.groups || !Array.isArray(config.groups)) {
      throw new Error("ki-energi-card-strom: 'groups' mangler i konfigurasjonen");
    }
    this._config = JSON.parse(JSON.stringify(config));
    this._enhet = config.default_unit === "kwh" ? "kwh" : "kr";
    this._periode = config.default_period === "month" ? "month" : "day";
    this._alt = config.default_price === "alt";
    this._bygget = false;
    this._signatur = "";
    this._apne = new Set();
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._oppdater();
  }

  getCardSize() {
    const rader = (this._config.groups || []).reduce(
      (n, g) => n + (g.items || []).length,
      0
    );
    return 4 + Math.ceil(rader / 2);
  }

  /* ---------------------------------------------------------- struktur -- */

  _bygg() {
    const harAlt = (this._config.groups || []).some((g) =>
      (g.items || []).some((i) => i.cost_daily_alt || i.cost_monthly_alt)
    );
    this._harAlt =
      harAlt || !!this._config.alt_suffix || !!this._config.price_entity_alt;

    this.shadowRoot.innerHTML = `
      <style>${KiEnergiCard.styles}</style>
      <ha-card>
        <section class="hero" id="hero">
          <div class="hero-top">
            <span class="hero-periode" id="heroPeriode"></span>
            <button class="pris-pille" id="prisPille" type="button"></button>
          </div>
          <div class="hero-sum" id="heroSum"></div>
          <div class="hero-bunn" id="heroBunn"></div>
        </section>

        <div class="brytere">
          <div class="pille" id="enhetPille">
            <button type="button" data-verdi="kr">Kroner</button>
            <button type="button" data-verdi="kwh">kWh</button>
          </div>
          <div class="pille" id="periodePille">
            <button type="button" data-verdi="day">I dag</button>
            <button type="button" data-verdi="month">Måneden</button>
          </div>
        </div>

        <div class="grupper" id="grupper"></div>
      </ha-card>
    `;

    const sr = this.shadowRoot;

    sr.getElementById("enhetPille").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      this._enhet = b.dataset.verdi;
      this._signatur = "";
      this._oppdater();
    });

    sr.getElementById("periodePille").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      this._periode = b.dataset.verdi;
      this._signatur = "";
      this._oppdater();
    });

    const prisPille = sr.getElementById("prisPille");
    if (this._harAlt) {
      prisPille.addEventListener("click", () => {
        this._alt = !this._alt;
        this._signatur = "";
        this._oppdater();
      });
    } else {
      prisPille.classList.add("statisk");
    }

    // Seksjonsskall bygges én gang; radene tegnes på nytt ved endring,
    // siden underkategorier kan felles ut og inn.
    const grupper = sr.getElementById("grupper");
    (this._config.groups || []).forEach((g, gi) => {
      const seksjon = document.createElement("section");
      seksjon.className = "gruppe";
      seksjon.innerHTML = `
        <header class="gruppe-topp">
          <h3>${this._esc(g.title || "Uten navn")}</h3>
          <div class="gruppe-hoyre">
            ${
              g.subtitle
                ? `<span class="gruppe-under">${this._esc(g.subtitle)}</span>`
                : ""
            }
            <span class="gruppe-sum" id="gsum-${gi}"></span>
          </div>
        </header>
        <div class="rader" id="rader-${gi}"></div>
      `;
      grupper.appendChild(seksjon);
    });

    grupper.addEventListener("click", (e) => {
      const el = e.target.closest("[data-sti]");
      if (!el) return;
      if (el.dataset.barn === "1") {
        if (this._apne.has(el.dataset.sti)) this._apne.delete(el.dataset.sti);
        else this._apne.add(el.dataset.sti);
        this._signatur = "";
        this._oppdater();
      } else if (el.dataset.entity) {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });

    this._bygget = true;
  }

  _esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  }

  _merInfo(gi, ii) {
    const rad = this._config.groups[gi].items[ii];
    const id = velgEntitet(
      rad,
      this._enhet,
      this._periode,
      this._alt,
      this._hass,
      this._config.alt_suffix
    );
    if (!id) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId: id };
    this.dispatchEvent(ev);
  }

  /** Entiteten som gjelder for et element med gjeldende bryterstilling. */
  _entFor(it) {
    return velgEntitet(
      it,
      this._enhet,
      this._periode,
      this._alt,
      this._hass,
      this._config.alt_suffix
    );
  }

  /**
   * Verdien til et element: egen sensor hvis den finnes, ellers summen av
   * underkategoriene. Slik kan «Panelovner» ha verdi uten egen sensor.
   */
  _verdi(it) {
    const egen = num(this._hass, this._entFor(it));
    if (egen !== null) return egen;
    const barn = it.children || [];
    if (!barn.length) return null;
    let sum = null;
    barn.forEach((b) => {
      const v = this._verdi(b);
      if (v !== null) sum = (sum || 0) + v;
    });
    return sum;
  }

  /** Tegner én rad, og under den barna hvis raden er felt ut. */
  _radHtml(it, sti, niva, topp, sum) {
    const enhetTekst = this._enhet === "kwh" ? "kWh" : "kr";
    const v = this._verdi(it);
    const barn = (it.children || []).filter(Boolean);
    const harBarn = barn.length > 0;
    const apen = this._apne.has(sti);
    const farge = it.color || "var(--gray800)";
    const ent = this._entFor(it);

    const andel = sum > 0 && v !== null ? (v / sum) * 100 : 0;
    const bredde = topp > 0 && v !== null ? (v / topp) * 100 : 0;

    let barnHtml = "";
    if (harBarn && apen) {
      const verdier = barn.map((b) => this._verdi(b));
      const gyldige = verdier.filter((x) => x !== null);
      const bSum = gyldige.reduce((a, b2) => a + b2, 0);
      const bTopp = gyldige.length ? Math.max(...gyldige) : 0;
      const rangert = barn
        .map((b, i) => ({ b, v: verdier[i], i }))
        .sort((a, b2) => {
          if (a.v === null && b2.v === null) return a.i - b2.i;
          if (a.v === null) return 1;
          if (b2.v === null) return -1;
          return b2.v - a.v;
        });
      barnHtml = `<div class="barn">${rangert
        .map((r) =>
          this._radHtml(
            r.b,
            `${sti}-${r.i}`,
            Math.min(niva + 1, 2),
            bTopp,
            bSum
          )
        )
        .join("")}</div>`;
    }

    return `
      <div class="radgruppe">
        <button type="button" class="rad n${niva} ${v === null ? "tom" : ""} ${
      apen ? "apen" : ""
    }"
          style="--rad-farge:${this._esc(farge)}"
          data-sti="${this._esc(sti)}"
          data-barn="${harBarn ? "1" : "0"}"
          data-entity="${this._esc(ent || "")}">
          <span class="ikon"><ha-icon icon="${this._esc(
            it.icon || "mdi:flash"
          )}"></ha-icon></span>
          <span class="midt">
            <span class="linje">
              <span class="navn">${this._esc(it.name || "Uten navn")}</span>
              <span class="verdi">${this._esc(fmt(v, enhetTekst))}</span>
            </span>
            <span class="linje">
              <span class="spor"><i style="width:${bredde.toFixed(1)}%"></i></span>
              <span class="andel">${
                v === null ? "" : andel.toFixed(0) + " %"
              }</span>
            </span>
          </span>
          ${
            harBarn
              ? `<span class="pil"><ha-icon icon="mdi:chevron-down"></ha-icon></span>`
              : ""
          }
        </button>
        ${barnHtml}
      </div>`;
  }

  /* ------------------------------------------------------------ verdier -- */

  _oppdater() {
    const hass = this._hass;
    if (!hass || !this._bygget) return;

    const enhetTekst = this._enhet === "kwh" ? "kWh" : "kr";
    const sr = this.shadowRoot;

    // Les alle verdier (inkludert summer fra underkategorier)
    const data = (this._config.groups || []).map((g) =>
      (g.items || []).map((it) => this._verdi(it))
    );

    const sign = JSON.stringify([
      data,
      this._enhet,
      this._periode,
      this._alt,
      [...this._apne].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    // Brytere
    sr.querySelectorAll("#enhetPille button").forEach((b) =>
      b.classList.toggle("aktiv", b.dataset.verdi === this._enhet)
    );
    sr.querySelectorAll("#periodePille button").forEach((b) =>
      b.classList.toggle("aktiv", b.dataset.verdi === this._periode)
    );

    // Rader, per gruppe
    let hovedgruppe = null;
    (this._config.groups || []).forEach((g, gi) => {
      const verdier = data[gi];
      const gyldige = verdier.filter((v) => v !== null);
      const sum = gyldige.reduce((a, b) => a + b, 0);
      const topp = gyldige.length ? Math.max(...gyldige) : 0;

      const gsum = sr.getElementById(`gsum-${gi}`);
      if (gsum) gsum.textContent = fmt(sum, enhetTekst);

      const rangert = verdier
        .map((v, ii) => ({ v, ii }))
        .sort((a, b) => {
          if (a.v === null && b.v === null) return a.ii - b.ii;
          if (a.v === null) return 1;
          if (b.v === null) return -1;
          return b.v - a.v;
        });

      const vert = sr.getElementById(`rader-${gi}`);
      if (vert) {
        vert.innerHTML = rangert
          .map((r) =>
            this._radHtml((g.items || [])[r.ii], `${gi}-${r.ii}`, 0, topp, sum)
          )
          .join("");
      }

      if (gi === 0) {
        const best = rangert.find((r) => r.v !== null);
        hovedgruppe = {
          sum,
          best: best ? g.items[best.ii] : null,
          verdi: best ? best.v : 0,
        };
      }
    });

    // Hero
    const totalId = velgTotal(
      this._config.totals,
      this._enhet,
      this._periode,
      this._alt,
      hass,
      this._config.alt_suffix
    );
    const totalFraSensor = num(hass, totalId);
    const totalVerdi =
      totalFraSensor !== null
        ? totalFraSensor
        : hovedgruppe
        ? hovedgruppe.sum
        : 0;

    sr.getElementById("heroPeriode").textContent =
      this._periode === "month" ? "Denne måneden" : "I dag";

    sr.getElementById("heroSum").innerHTML = `${this._esc(
      totalVerdi.toLocaleString("nb-NO", {
        minimumFractionDigits: totalVerdi < 100 ? 2 : 0,
        maximumFractionDigits: totalVerdi < 100 ? 2 : 0,
      })
    )}<span>${enhetTekst}</span>`;

    const prisId = this._alt
      ? this._config.price_entity_alt
      : this._config.price_entity;
    const pris = num(hass, prisId);
    const prisTekst =
      pris === null
        ? ""
        : ` · ${pris.toLocaleString("nb-NO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} kr/kWh`;
    sr.getElementById("prisPille").textContent =
      (this._alt ? "Norgespris" : "Spotpris") + prisTekst;

    const bunn = sr.getElementById("heroBunn");
    if (hovedgruppe && hovedgruppe.best && hovedgruppe.sum > 0) {
      const p = ((hovedgruppe.verdi / hovedgruppe.sum) * 100).toFixed(0);
      let tekst = `Størst: ${hovedgruppe.best.name} står for ${p} % av forbruket`;

      // Når totalen kommer fra hovedmåleren, si hvor mye kategoriene dekker.
      // Resten er forbruk som ikke er fordelt på noen kategori.
      if (totalFraSensor !== null && totalFraSensor > 0) {
        const dekning = (hovedgruppe.sum / totalFraSensor) * 100;
        if (dekning < 99.5) {
          tekst += ` · sporet ${dekning.toFixed(0)} % av totalen`;
        }
      }
      bunn.textContent = tekst;
    } else {
      bunn.textContent = "Venter på sensordata";
    }
  }
}

KiEnergiCard.styles = `
  :host { display: block; }
  ha-card {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---- hero ---- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 22px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .hero-periode { font-size: 13px; font-weight: 600; opacity: .75; }
  .pris-pille {
    background: rgba(0, 0, 0, .16);
    color: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 11px;
    white-space: nowrap;
  }
  .pris-pille.statisk { pointer-events: none; }
  .pris-pille:focus-visible { outline: 2px solid var(--gray100, #fff); outline-offset: 2px; }
  .hero-sum {
    font-size: 34px;
    font-weight: 700;
    line-height: 1.15;
    margin: 4px 0 2px;
    font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 17px; font-weight: 600; opacity: .75; margin-left: 5px; }
  .hero-bunn { font-size: 13px; opacity: .8; }

  /* ---- brytere ---- */
  .brytere {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  .pille {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background: var(--gray200, var(--card-background-color));
    border-radius: 16px;
    padding: 4px;
    height: 44px;
    box-sizing: border-box;
  }
  .pille button {
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .5;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    opacity: 1;
  }
  .pille button:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }

  /* ---- grupper ---- */
  .gruppe + .gruppe { margin-top: 20px; }
  .gruppe-topp {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 0 6px 8px;
  }
  .gruppe-topp h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .gruppe-hoyre { display: flex; align-items: baseline; gap: 10px; }
  .gruppe-under { font-size: 12px; opacity: .5; color: var(--gray1000, var(--primary-text-color)); }
  .gruppe-sum {
    font-size: 13px;
    font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .75;
    font-variant-numeric: tabular-nums;
  }
  .rader { display: flex; flex-direction: column; gap: 8px; }
  .radgruppe { display: flex; flex-direction: column; gap: 8px; }
  .barn {
    display: flex; flex-direction: column; gap: 6px;
    padding-left: 16px;
    border-left: 2px solid rgba(128, 128, 128, .22);
    margin-left: 20px;
  }
  .pil {
    --mdc-icon-size: 20px;
    opacity: .4;
    color: var(--gray1000, var(--primary-text-color));
    transition: transform .2s ease;
    align-self: center;
  }
  .rad.apen .pil { transform: rotate(180deg); opacity: .8; }
  .rad.apen { background: var(--gray400, rgba(128, 128, 128, .22)); }

  /* nivåer: mindre og tettere jo dypere */
  .rad.n1 { height: 62px; border-radius: 15px; padding: 10px 12px 10px 6px; }
  .rad.n1 .ikon { width: 36px; height: 36px; }
  .rad.n1 .ikon ha-icon { --mdc-icon-size: 19px; }
  .rad.n1 .navn, .rad.n1 .verdi { font-size: 14px; }
  .rad.n2 { height: 54px; border-radius: 13px; }
  .rad.n2 .ikon { width: 30px; height: 30px; }
  .rad.n2 .ikon ha-icon { --mdc-icon-size: 16px; }
  .rad.n2 .navn, .rad.n2 .verdi { font-size: 13px; }
  .rad.n2 .spor { height: 5px; }

  /* ---- rad ---- */
  .rad {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px;
    padding: 12px 14px 12px 8px;
    text-align: left;
    color: var(--gray1000, var(--primary-text-color));
  }
  .rad:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .rad.tom { opacity: .45; }
  .ikon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .12);
    color: var(--rad-farge, var(--gray800));
    --mdc-icon-size: 24px;
  }
  .midt { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
  .linje { display: flex; align-items: center; gap: 8px; }
  .navn {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .verdi { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .spor {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(0, 0, 0, .13);
    overflow: hidden;
  }
  .spor i {
    display: block;
    height: 100%;
    width: 0;
    border-radius: 3px;
    background: var(--rad-farge, var(--gray800));
    transition: width .4s ease;
  }
  .andel {
    font-size: 11px;
    font-weight: 700;
    opacity: .55;
    min-width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 420px) {
    .brytere { gap: 6px; }
    .pille { padding: 3px; gap: 3px; }
    .pille button { font-size: 12px; }
    .hero-sum { font-size: 30px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .spor i, .pille button { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

const FELTER = [
  { key: "cost_daily", label: "Kostnad i dag (kr)" },
  { key: "cost_monthly", label: "Kostnad denne måneden (kr)" },
  { key: "energy_daily", label: "Forbruk i dag (kWh)" },
  { key: "energy_monthly", label: "Forbruk denne måneden (kWh)" },
  { key: "cost_daily_alt", label: "Kostnad i dag – Norgespris" },
  { key: "cost_monthly_alt", label: "Kostnad denne måneden – Norgespris" },
];

class KiEnergiCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickers();
  }

  async _lastPickers() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({
        type: "entities",
        entities: [],
      });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.groups) this._config.groups = STANDARD_KONFIG().groups;
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
    const ev = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(ev);
  }

  /* -- små byggeklosser -- */

  _tekstfelt(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = verdi || "";
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
      wrap.className = "felt bred";
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
    wrap.innerHTML = `<span>Farge</span>`;
    const rad = document.createElement("div");
    rad.className = "fargerad";
    const sel = document.createElement("select");
    FARGER.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.verdi;
      o.textContent = f.navn;
      sel.appendChild(o);
    });
    const egen = document.createElement("option");
    egen.value = "__egen__";
    egen.textContent = "Egendefinert…";
    sel.appendChild(egen);

    const kjent = FARGER.some((f) => f.verdi === verdi);
    sel.value = kjent ? verdi : "__egen__";

    const fri = document.createElement("input");
    fri.type = "text";
    fri.placeholder = "f.eks. #ff9500";
    fri.value = kjent ? "" : verdi || "";
    fri.hidden = kjent;

    const prikk = document.createElement("i");
    prikk.className = "prikk";
    prikk.style.background = verdi || "var(--gray800)";

    sel.addEventListener("change", () => {
      if (sel.value === "__egen__") {
        fri.hidden = false;
        fri.focus();
      } else {
        fri.hidden = true;
        onChange(sel.value);
      }
    });
    fri.addEventListener("change", () => onChange(fri.value.trim()));

    rad.appendChild(prikk);
    rad.appendChild(sel);
    rad.appendChild(fri);
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

  /* -- hovedtegning -- */

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiEnergiCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = `<h4>Generelt</h4>`;
    gen.appendChild(
      this._tekstfelt("Tittel", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    gen.appendChild(
      this._entitetsfelt(
        "Spotpris nå",
        this._config.price_entity,
        (v) => {
          this._config.price_entity = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._entitetsfelt(
        "Norgespris nå",
        this._config.price_entity_alt,
        (v) => {
          this._config.price_entity_alt = v;
          this._endret();
        }
      )
    );

    gen.appendChild(
      this._tekstfelt(
        "Endelse for Norgespris-sensorer (f.eks. _norgespris)",
        this._config.alt_suffix,
        (v) => {
          if (v) this._config.alt_suffix = v;
          else delete this._config.alt_suffix;
          this._endret();
        }
      )
    );
    const suffikshjelp = document.createElement("p");
    suffikshjelp.className = "hjelp";
    suffikshjelp.textContent =
      "Med endelse fylt ut finner kortet Norgespris-sensorene selv, så lenge de heter det samme som spotpris-sensorene pluss endelsen. Rader der du fyller ut feltene manuelt overstyrer dette.";
    gen.appendChild(suffikshjelp);

    const valg = document.createElement("div");
    valg.className = "trekol";
    valg.appendChild(
      this._velger(
        "Viser først",
        [
          ["kr", "Kroner"],
          ["kwh", "kWh"],
        ],
        this._config.default_unit || "kr",
        (v) => {
          this._config.default_unit = v;
          this._endret();
        }
      )
    );
    valg.appendChild(
      this._velger(
        "Periode",
        [
          ["day", "I dag"],
          ["month", "Måned"],
        ],
        this._config.default_period || "day",
        (v) => {
          this._config.default_period = v;
          this._endret();
        }
      )
    );
    valg.appendChild(
      this._velger(
        "Prismodell",
        [
          ["alt", "Norgespris"],
          ["main", "Spotpris"],
        ],
        this._config.default_price || "alt",
        (v) => {
          this._config.default_price = v;
          this._endret();
        }
      )
    );
    gen.appendChild(valg);
    rot.appendChild(gen);

    /* Totalsensorer */
    const tot = document.createElement("details");
    tot.className = "boks";
    tot.innerHTML = `<summary>Totalsensorer (valgfritt)</summary>
      <p class="hjelp">Uten disse regnes totalen som summen av første seksjon,
      slik at enheter som ligger i både kategori og kurs ikke telles dobbelt.</p>`;
    if (!this._config.totals) this._config.totals = {};
    [
      ["cost_daily", "Kostnad i dag – spotpris"],
      ["cost_monthly", "Kostnad denne måneden – spotpris"],
      ["cost_daily_alt", "Kostnad i dag – Norgespris"],
      ["cost_monthly_alt", "Kostnad denne måneden – Norgespris"],
      ["energy_daily", "Forbruk i dag"],
      ["energy_monthly", "Forbruk denne måneden"],
    ].forEach(([k, l]) => {
      tot.appendChild(
        this._entitetsfelt(l, this._config.totals[k], (v) => {
          this._config.totals[k] = v;
          this._endret();
        })
      );
    });
    rot.appendChild(tot);

    /* Seksjoner */
    this._config.groups.forEach((g, gi) => this._tegnGruppe(rot, g, gi));

    const legg = this._knapp("+ Ny seksjon", "hovedknapp", () => {
      this._config.groups.push({ title: "Ny seksjon", items: [] });
      this._endret();
      this._tegn();
    });
    rot.appendChild(legg);
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

  /**
   * Én rad i editoren. Kalles rekursivt for underkategorier, slik at
   * Oppvarming kan ha Panelovner, som igjen har hver enkelt ovn.
   */
  _tegnRad(liste, it, ii, noekkel, dybde) {
    const d = document.createElement("details");
    d.className = "rad dybde" + dybde;
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });

    const s = document.createElement("summary");
    const antBarn = (it.children || []).length;
    s.innerHTML = `<i class="prikk" style="background:${
      it.color || "var(--gray800)"
    }"></i><span>${it.name || "Uten navn"}</span>${
      antBarn ? `<em>${antBarn}</em>` : ""
    }`;
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "radkropp";

    const rad1 = document.createElement("div");
    rad1.className = "tokol";
    rad1.appendChild(
      this._tekstfelt("Navn", it.name, (v) => {
        it.name = v;
        this._endret();
        this._tegn();
      })
    );
    rad1.appendChild(
      this._ikonfelt(it.icon, (v) => {
        it.icon = v;
        this._endret();
      })
    );
    kropp.appendChild(rad1);
    kropp.appendChild(
      this._fargefelt(it.color, (v) => {
        it.color = v;
        this._endret();
        this._tegn();
      })
    );

    const harBarn = (it.children || []).length > 0;
    if (harBarn) {
      const p = document.createElement("p");
      p.className = "hjelp";
      p.textContent =
        "Har underkategorier. Egne sensorer er valgfrie — uten dem summeres barna.";
      kropp.appendChild(p);
    }

    FELTER.forEach((f) => {
      kropp.appendChild(
        this._entitetsfelt(f.label, it[f.key], (v) => {
          if (v) it[f.key] = v;
          else delete it[f.key];
          this._endret();
        })
      );
    });

    // Underkategorier
    const ub = document.createElement("div");
    ub.className = "underboks";
    ub.innerHTML = `<div class='undertittel'>Underkategorier${
      dybde >= 1 ? " (siste nivå)" : ""
    }</div>`;
    (it.children || []).forEach((barn, bi) => {
      ub.appendChild(
        this._tegnRad(it.children, barn, bi, `${noekkel}:${bi}`, dybde + 1)
      );
    });
    if (dybde < 2) {
      ub.appendChild(
        this._knapp("+ Legg til underkategori", "hovedknapp liten", () => {
          if (!it.children) it.children = [];
          it.children.push({
            name: "Ny underkategori",
            icon: it.icon || "mdi:flash",
            color: it.color,
          });
          this._apne.add(`${noekkel}:${it.children.length - 1}`);
          this._endret();
          this._tegn();
        })
      );
    }
    kropp.appendChild(ub);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    verktoy.appendChild(
      this._knapp("Dupliser", "mini", () => {
        liste.splice(ii + 1, 0, JSON.parse(JSON.stringify(it)));
        this._endret();
        this._tegn();
      })
    );
    verktoy.appendChild(
      this._knapp("Slett", "mini fare", () => {
        liste.splice(ii, 1);
        this._apne.delete(noekkel);
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(verktoy);

    d.appendChild(kropp);
    return d;
  }

  _tegnGruppe(rot, g, gi) {
    const boks = document.createElement("div");
    boks.className = "boks gruppe";

    const topp = document.createElement("div");
    topp.className = "gruppetopp";
    const h = document.createElement("h4");
    h.textContent = g.title || "Uten navn";
    topp.appendChild(h);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (gi > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.groups.splice(gi, 1);
          this._config.groups.splice(gi - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (gi < this._config.groups.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.groups.splice(gi, 1);
          this._config.groups.splice(gi + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett seksjon", "mini fare", () => {
        this._config.groups.splice(gi, 1);
        this._endret();
        this._tegn();
      })
    );
    topp.appendChild(verktoy);
    boks.appendChild(topp);

    const navnrad = document.createElement("div");
    navnrad.className = "tokol";
    navnrad.appendChild(
      this._tekstfelt("Overskrift", g.title, (v) => {
        g.title = v;
        this._endret();
        this._tegn();
      })
    );
    navnrad.appendChild(
      this._tekstfelt("Undertekst", g.subtitle, (v) => {
        g.subtitle = v;
        this._endret();
      })
    );
    boks.appendChild(navnrad);

    (g.items || []).forEach((it, ii) => {
      boks.appendChild(this._tegnRad(g.items, it, ii, `${gi}:${ii}`, 0));
    });

    boks.appendChild(
      this._knapp("+ Legg til rad", "hovedknapp liten", () => {
        if (!g.items) g.items = [];
        g.items.push({
          name: "Ny rad",
          icon: "mdi:flash",
          color: "var(--blue)",
        });
        this._apne.add(`${gi}:${g.items.length - 1}`);
        this._endret();
        this._tegn();
      })
    );

    rot.appendChild(boks);
  }
}

KiEnergiCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
  .felt input[type="text"], .felt select {
    font: inherit;
    font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 8px 10px;
    width: 100%;
    box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .trekol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .fargerad { display: flex; align-items: center; gap: 8px; }
  .prikk {
    width: 14px; height: 14px; border-radius: 50%;
    display: inline-block; flex: 0 0 auto;
  }
  .gruppetopp { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini {
    background: transparent;
    color: var(--primary-text-color);
    font-size: 12px;
    padding: 5px 9px;
  }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  details.rad {
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 10px;
  }
  details.rad summary { display: flex; align-items: center; gap: 8px; }
  details.rad summary em {
    font-style: normal; font-size: 11px; font-weight: 700;
    padding: 2px 7px; border-radius: 8px;
    background: var(--divider-color); color: var(--secondary-text-color);
  }
  details.rad.dybde1 { border-style: dashed; }
  details.rad.dybde2 { border-style: dotted; }
  .radkropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  @media (max-width: 500px) {
    .tokol, .trekol { grid-template-columns: 1fr; }
  }
`;

customElements.define("ki-energi-card-strom", KiEnergiCard);
customElements.define("ki-energi-card-strom-editor", KiEnergiCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energi-card-strom",
  name: "KI Energi",
  description:
    "Energiforbruk gruppert i kategorier og kurser, sortert etter størst forbruk.",
  preview: true,
});
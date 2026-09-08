/**
 * ki-kamera-card.js  —  v1.0.0
 *
 * Kameraoversikt i samme designspråk som ki-energi-card og ki-alarm-card.
 *   • Kildebryter: Frigate (advanced-camera-card + hendelsesgalleri) eller
 *     Vanlig (rå kamerastrøm, f.eks. UniFi high resolution channel)
 *   • Kamerapiller med ikon, horisontalt rullbare
 *   • Hendelsesfane som samler alle Frigate-kameraene
 *   • Full GUI-editor
 *
 * De eksisterende kortene dine brukes videre — dette kortet monterer
 * custom:advanced-camera-card og custom:mysmart-frigate-gallery inni seg.
 *
 * Legges i /config/www/ki-kamera-card.js og registreres som
 * JavaScript Module: /local/ki-kamera-card.js
 */

const KI_KAMERA_VERSION = "1.8.0";

console.info(
  `%c KI-KAMERA-CARD %c ${KI_KAMERA_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#3b82f6;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* ──────────────────────────────────────────────────────── oppsett/presets ── */

/**
 * Presets for Alle-visningen. `omrader` er grid-template-areas, ett felt per
 * kamera i rekkefølgen de står i konfigurasjonen (a, b, c, d, e …).
 * Kameraer utover feltene legges til som fullbreddes rader nederst.
 */
const OPPSETT = {
  mosaikk: {
    navn: "Mosaikk",
    ikon: "mdi:view-quilt-outline",
    kolonner: "1fr 1fr",
    rader: "1fr 1fr 1fr",
    ratio: "1 / 1",
    omrader: ['"a b"', '"a c"', '"d e"'],
  },
  hoved: {
    navn: "Hovedkamera",
    ikon: "mdi:view-dashboard-outline",
    kolonner: "1fr 1fr",
    // Ingen fast høyde på beholderen: hver celle får 16:9, så hovedkameraet
    // fyller hele bredden i full høyde i stedet for å presses inn i en rad.
    celleRatio: "16 / 9",
    omrader: ['"a a"', '"b c"', '"d e"'],
  },
  rutenett: {
    navn: "Rutenett",
    ikon: "mdi:view-grid-outline",
    kolonner: "1fr 1fr",
    celleRatio: "16 / 9",
    auto: true,
  },
  liste: {
    navn: "Liste",
    ikon: "mdi:view-sequential-outline",
    kolonner: "1fr",
    celleRatio: "16 / 9",
    auto: true,
  },
};

const FELTNAVN = "abcdefghijklmnop".split("");

const STANDARD_KONFIG = () => ({
  type: "custom:ki-kamera-card",
  title: "Kamera",
  title_icon: "mdi:cctv",
  grid_layout: "mosaikk",
  fill_screen: true,
  fill_offset: 210,
  privacy_invert: true,
  logbook_hours: 24,
  logbook_limit: 60,
  show_layout_switcher: true,
  default_source: "frigate",
  show_events: true,
  events_limit: 12,
  events_columns: 2,
  events_height: "500px",
  cameras: [
    {
      name: "Inngang",
      icon: "mdi:doorbell-video",
      plain: "camera.ringeklokke_g6_entry_high_resolution_channel",
      frigate: ["camera.ringeklokke", "camera.ringeklokke_pakke"],
      privacy: "switch.ringeklokke_g6_entry_privacy_mode",
      motion: "binary_sensor.ringeklokke_g6_entry_motion",
      last_motion: "sensor.ringeklokke_g6_entry_last_motion_detected",
      logbook: [
        "binary_sensor.ringeklokke_g6_entry_doorbell",
        "binary_sensor.ringeklokke_g6_entry_motion",
        "binary_sensor.ringeklokke_g6_entry_person_detected",
        "binary_sensor.ringeklokke_g6_entry_car_alarm_detected",
        "switch.ringeklokke_g6_entry_package_detection",
        "switch.ringeklokke_g6_entry_animal_detection",
        "switch.ringeklokke_g6_entry_speaking_detection",
      ],
    },
    {
      name: "Mellomgang",
      icon: "mdi:stairs",
      plain: "camera.mellomgang_g5_turret_ultra_high_resolution_channel",
      frigate: ["camera.mellomgang"],
      privacy: "switch.mellomgang_g5_turret_ultra_privacy_mode",
      motion: "binary_sensor.mellomgang_g5_turret_ultra_motion",
      last_motion: "sensor.mellomgang_g5_turret_ultra_last_motion_detected",
      logbook: [
        "binary_sensor.mellomgang_g5_turret_ultra_motion",
        "binary_sensor.mellomgang_g5_turret_ultra_person_detected",
      ],
    },
    {
      name: "Pakke",
      icon: "mdi:package-variant-closed",
      plain: "camera.ringeklokke_g6_entry_package_camera",
      frigate: ["camera.ringeklokke_pakke"],
      privacy: "switch.ringeklokke_g6_entry_privacy_mode",
      logbook: [
        "binary_sensor.ringeklokke_g6_entry_package_detected",
        "switch.ringeklokke_g6_entry_package_detection",
      ],
    },
    {
      name: "Veranda",
      icon: "mdi:flower",
      plain: "camera.veranda_g6_bullet_high_resolution_channel",
      frigate: ["camera.veranda"],
      privacy: "switch.veranda_g6_bullet_privacy_mode",
      motion: "binary_sensor.veranda_g6_bullet_motion",
      last_motion: "sensor.veranda_g6_bullet_last_motion_detected",
      logbook: [
        "binary_sensor.veranda_g6_bullet_motion",
        "binary_sensor.veranda_g6_bullet_person_detected",
      ],
    },
    {
      name: "Stue",
      icon: "mdi:sofa",
      plain: "camera.stue_g6_turret_high_resolution_channel",
      frigate: ["camera.stue"],
      privacy: "switch.stue_g6_turret_privacy_mode",
      motion: "binary_sensor.stue_g6_turret_motion",
      last_motion: "sensor.stue_g6_turret_last_motion_detected",
      logbook: [
        "binary_sensor.stue_g6_turret_motion",
        "binary_sensor.stue_g6_turret_person_detected",
      ],
    },
  ],
});

/** «for 4 min siden», «i dag 09:12», «12. mai 14:03» */
const siden = (iso) => {
  if (!iso || iso === "unknown" || iso === "unavailable") return "Aldri";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Ukjent";
  const sek = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sek < 60) return "Nå nettopp";
  if (sek < 3600) return `${Math.floor(sek / 60)} min siden`;
  const klokke = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  if (sek < 86400) return `${Math.floor(sek / 3600)} t siden · ${klokke}`;
  return (
    d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" }) + " " + klokke
  );
};

/* ─────────────────────────────────────────────── kortkonfigurasjoner ── */

/** Frigate-visning for ett kamera — samme oppsett som i det gamle dashbordet. */
const frigateKort = (entiteter) => ({
  type: "custom:advanced-camera-card",
  cameras: entiteter.map((e) => ({ camera_entity: e })),
  menu: {
    style: "hidden",
    buttons: {
      iris: { enabled: true },
      cameras: { enabled: false },
      substreams: { enabled: false },
      live: { enabled: true },
      download: { enabled: true },
      media_player: { enabled: false },
      clips: { enabled: false },
      snapshots: { enabled: false },
      timeline: { enabled: false },
      expand: { enabled: false },
    },
  },
  status_bar: {},
  media_viewer: {
    draggable: true,
    zoomable: true,
    lazy_load: true,
    snapshot_click_plays_clip: true,
  },
});

const galleriKort = (entiteter, cfg) => ({
  type: "custom:mysmart-frigate-gallery",
  title: "Hendelser",
  entities: entiteter,
  limit: cfg.events_limit || 12,
  columns: cfg.events_columns || 2,
  card_height: cfg.events_height || "500px",
});

const stromKort = (entitet, live) => ({
  type: "picture-entity",
  entity: entitet,
  camera_view: live ? "live" : "auto",
  show_state: false,
  show_name: false,
});


/* ────────────────────────────────────────────────────────────── tidslinje ── */

/** Oversetter tilstand til norsk, ut fra domene og device_class. */
const tilstandTekst = (hass, entityId, state) => {
  const s = hass.states[entityId];
  const dc = s && s.attributes ? s.attributes.device_class : null;
  const domene = (entityId || "").split(".")[0];
  const på = state === "on";

  if (domene === "binary_sensor") {
    if (dc === "motion" || dc === "occupancy") return på ? "Oppdaget" : "Klar";
    if (dc === "sound") return på ? "Lyd" : "Stille";
    if (dc === "door" || dc === "window" || dc === "opening")
      return på ? "Åpen" : "Lukket";
    if (dc === "problem") return på ? "Problem" : "OK";
    return på ? "Oppdaget" : "Klar";
  }
  if (domene === "switch" || domene === "light" || domene === "input_boolean") {
    return på ? "På" : "Av";
  }
  if (state === "unavailable") return "Utilgjengelig";
  if (state === "unknown") return "Ukjent";
  return state;
};

/** Ikon for en linje: fra loggen, fra entiteten, eller etter device_class. */
const linjeIkon = (hass, entityId, state, fraLogg) => {
  if (fraLogg) return fraLogg;
  const s = hass.states[entityId];
  if (s && s.attributes && s.attributes.icon) return s.attributes.icon;
  const dc = s && s.attributes ? s.attributes.device_class : null;
  const domene = (entityId || "").split(".")[0];
  const på = state === "on";
  if (dc === "motion" || dc === "occupancy") return på ? "mdi:motion-sensor" : "mdi:motion-sensor-off";
  if (dc === "sound") return "mdi:account-voice";
  if (dc === "door") return på ? "mdi:door-open" : "mdi:door-closed";
  if (entityId.includes("doorbell")) return "mdi:doorbell";
  if (entityId.includes("package")) return "mdi:package-variant-closed";
  if (entityId.includes("animal")) return "mdi:paw";
  if (entityId.includes("car")) return "mdi:car";
  if (entityId.includes("person")) return "mdi:account";
  if (entityId.includes("privacy")) return på ? "mdi:eye-off" : "mdi:eye";
  if (domene === "switch") return "mdi:toggle-switch-outline";
  return "mdi:information-outline";
};

/** «Område ▸ Enhet» under tittelen, hentet fra HAs registre. */
const opphav = (hass, entityId) => {
  const deler = [];
  try {
    const e = hass.entities ? hass.entities[entityId] : null;
    const d = e && e.device_id && hass.devices ? hass.devices[e.device_id] : null;
    const omrId = (e && e.area_id) || (d && d.area_id);
    const omr = omrId && hass.areas ? hass.areas[omrId] : null;
    if (omr && omr.name) deler.push(omr.name);
    if (d && d.name_by_user) deler.push(d.name_by_user);
    else if (d && d.name) deler.push(d.name);
  } catch (err) {
    /* registrene finnes ikke i eldre frontend */
  }
  return deler;
};

const klokke = (naar) => {
  const d = new Date(typeof naar === "number" ? naar * 1000 : naar);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const dagTekst = (naar) => {
  const d = new Date(typeof naar === "number" ? naar * 1000 : naar);
  const i_dag = new Date();
  const igaar = new Date(Date.now() - 86400000);
  const lik = (a, b) => a.toDateString() === b.toDateString();
  if (lik(d, i_dag)) return "I dag";
  if (lik(d, igaar)) return "I går";
  return d.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiKameraCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._kilde = "frigate";
    this._valgt = "hendelser";
    this._oppsett = "mosaikk";
    this._menyApen = false;
    this._cache = new Map();
    this._loggCache = new Map();
    this._montert = null;
    this._loggKort = null;
  }

  static getConfigElement() {
    return document.createElement("ki-kamera-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.cameras) this._config.cameras = [];
    this._oppsett = OPPSETT[config.grid_layout] ? config.grid_layout : "mosaikk";
    this._menyApen = false;
    this._kilde = config.default_source === "vanlig" ? "vanlig" : "frigate";
    // Startfanen må følge kilden — Direkte har ingen hendelsesfane
    this._valgt = this._forsteTilgjengelige();
    this._cache.clear();
    this._loggCache.clear();
    this._montert = null;
    this._loggKort = null;
    this._loggNoekkel = undefined;
    this._bygget = false;
  }

  set hass(hass) {
    const forste = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    // Nestede kort får hass videreformidlet uten at noe bygges på nytt,
    // ellers ville livestrømmen startet om ved hver tilstandsendring.
    if (this._montert) this._montert.hass = hass;
    if (this._loggKort) this._loggKort.hass = hass;
    if (forste) this._oppdater();
    else this._tegnDetaljer();
  }

  getCardSize() {
    return 12;
  }

  disconnectedCallback() {
    if (this._obs) this._obs.disconnect();
  }

  connectedCallback() {
    if (this._obs && this._rot) this._obs.observe(this._rot);
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiKameraCard.styles}</style>`;
    const rot = document.createElement("ha-card");
    rot.className = "rot";
    rot.innerHTML = `
      <div class="tittelrad" id="tittelrad"></div>
      <div class="kilde" id="kilde"></div>
      <div class="piller" id="piller"></div>
      <div class="innhold" id="innhold"></div>
      <div class="detaljer" id="detaljer"></div>
      <div class="logg" id="logg"></div>
    `;
    this.shadowRoot.appendChild(rot);
    this._rot = rot;

    // Brede skjermer (nettbrett, foldbare) får høydestyrt rutenett i stedet
    // for sideforhold per celle, slik at det fyller skjermen som på mobil.
    if (window.ResizeObserver) {
      this._obs = new ResizeObserver((e) => {
        const b = e[0] ? e[0].contentRect.width : 0;
        const bred = b >= (this._config.fill_breakpoint || 700);
        if (bred === this._bred) return;
        this._bred = bred;
        if (this._valgt === "alle") {
          this._montertNoekkel = null;
          this._visInnhold();
        }
      });
      this._obs.observe(rot);
    }

    rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) {
        if (this._menyApen) {
          this._menyApen = false;
          this._tegnPiller();
        }
        return;
      }
      if (
        this._menyApen &&
        el.dataset.handling !== "oppsett" &&
        el.dataset.handling !== "oppsett-meny"
      ) {
        this._menyApen = false;
      }
      if (el.dataset.handling === "kilde") {
        if (this._kilde === el.dataset.verdi) return;
        this._kilde = el.dataset.verdi;
        if (this._kilde === "vanlig") {
          // Direkte åpner alltid i oversikten
          this._valgt = "alle";
        } else if (!this._erTilgjengelig(this._valgt)) {
          this._valgt = this._forsteTilgjengelige();
        }
        this._oppdater();
      } else if (el.dataset.handling === "kamera") {
        if (this._valgt === el.dataset.verdi) return;
        this._valgt = el.dataset.verdi;
        this._oppdater();
      } else if (el.dataset.handling === "oppsett-meny") {
        this._menyApen = !this._menyApen;
        this._tegnPiller();
      } else if (el.dataset.handling === "oppsett") {
        this._menyApen = false;
        if (this._oppsett === el.dataset.verdi) {
          this._tegnPiller();
          return;
        }
        this._oppsett = el.dataset.verdi;
        this._oppdater();
      } else if (el.dataset.handling === "personvern") {
        this._hass.callService("switch", "toggle", {
          entity_id: el.dataset.entity,
        });
      } else if (el.dataset.handling === "mer-info") {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });

    this._bygget = true;
  }

  /* ------------------------------------------------------------ utvalg -- */

  _kameraer() {
    return (this._config.cameras || []).map((c, i) => ({
      ...c,
      id: String(i),
      harFrigate: !!(c.frigate && c.frigate.length),
      harVanlig: !!c.plain,
    }));
  }

  _erTilgjengelig(id) {
    if (id === "hendelser") return this._kilde === "frigate" && this._config.show_events !== false;
    if (id === "alle") return this._kilde === "vanlig";
    if (id === "logg") return this._alleLogg().length > 0;
    const k = this._kameraer().find((x) => x.id === id);
    if (!k) return false;
    return this._kilde === "frigate" ? k.harFrigate : k.harVanlig;
  }

  _forsteTilgjengelige() {
    if (this._kilde === "vanlig") return "alle";
    if (this._config.show_events !== false && this._alleFrigate().length) {
      return "hendelser";
    }
    const k = this._kameraer().find((x) => this._erTilgjengelig(x.id));
    return k ? k.id : "";
  }

  _alleLogg() {
    const ut = [];
    this._kameraer().forEach((k) =>
      (k.logbook || []).forEach((e) => {
        if (e && !ut.includes(e)) ut.push(e);
      })
    );
    return ut;
  }

  _alleFrigate() {
    const ut = [];
    this._kameraer().forEach((k) =>
      (k.frigate || []).forEach((e) => {
        if (!ut.includes(e)) ut.push(e);
      })
    );
    return ut;
  }

  /* ------------------------------------------------------------- tegne -- */

  _oppdater() {
    this._tegnPiller();
    this._visInnhold();
    this._tegnDetaljer();
    this._visLogg();
  }

  /**
   * Aktivitetslogg for kameraet. Bare i kameraets egen fane, og bare når
   * kameraet har logbook-entiteter satt opp.
   */
  async _visLogg() {
    const vert = this._rot && this._rot.querySelector("#logg");
    if (!vert) return;

    const k =
      this._valgt === "logg"
        ? null
        : this._kameraer().find((x) => x.id === this._valgt);
    const entiteter = k && k.logbook ? k.logbook.filter(Boolean) : [];
    const noekkel = entiteter.length ? `${k.id}|${entiteter.join(",")}` : "";

    if (this._loggNoekkel === noekkel) return;
    this._loggNoekkel = noekkel;

    if (!noekkel) {
      vert.innerHTML = "";
      this._loggKort = null;
      return;
    }

    let el = this._loggCache.get(noekkel);
    if (!el) {
      el = this._lagTidslinje(entiteter);
      if (el) this._loggCache.set(noekkel, el);
    }

    vert.innerHTML = "";
    this._loggKort = el || null;
    if (el) {
      el.hass = this._hass;
      const tittel = document.createElement("div");
      tittel.className = "loggtittel";
      tittel.textContent = "Aktivitet";
      vert.appendChild(tittel);
      vert.appendChild(el);
    }
  }

  /**
   * Personvernbryter, bevegelse og siste bevegelse.
   * Vises bare når ett bestemt kamera er valgt — ikke i Alle eller Hendelser.
   */
  _tegnDetaljer() {
    const vert = this._rot && this._rot.querySelector("#detaljer");
    if (!vert || !this._hass) return;

    const k = this._kameraer().find((x) => x.id === this._valgt);
    if (!k) {
      if (vert.innerHTML) vert.innerHTML = "";
      this._detaljSignatur = "";
      return;
    }

    const s = (id) => (id ? this._hass.states[id] : null);
    const pv = s(k.privacy);
    const bev = s(k.motion);
    const sist = s(k.last_motion);

    const sign = JSON.stringify([
      k.id,
      pv ? pv.state : null,
      bev ? bev.state : null,
      sist ? sist.state : null,
    ]);
    if (sign === this._detaljSignatur) return;
    this._detaljSignatur = sign;

    const fliser = [];

    if (pv) {
      // Med privacy_invert betyr "on" at kameraet filmer, ikke at det er avslått
      const invertert = this._config.privacy_invert !== false;
      const skjult = (pv.state === "on") !== invertert;
      fliser.push(`
        <button type="button" class="flis ${skjult ? "varsel" : ""}"
          data-handling="personvern" data-entity="${esc(k.privacy)}">
          <span class="flis-ikon">
            <ha-icon icon="${skjult ? "mdi:eye-off" : "mdi:eye"}"></ha-icon>
          </span>
          <span class="flis-tekst">
            <span class="flis-navn">Personvern</span>
            <span class="flis-under">${skjult ? "Kamera av" : "Kamera på"}</span>
          </span>
        </button>`);
    }

    if (bev) {
      const på = bev.state === "on";
      fliser.push(`
        <button type="button" class="flis ${på ? "aktiv" : ""}"
          data-handling="mer-info" data-entity="${esc(k.motion)}">
          <span class="flis-ikon"><ha-icon icon="mdi:motion-sensor"></ha-icon></span>
          <span class="flis-tekst">
            <span class="flis-navn">Bevegelse</span>
            <span class="flis-under">${på ? "Registrerer nå" : "Stille"}</span>
          </span>
        </button>`);
    }

    if (sist) {
      fliser.push(`
        <button type="button" class="flis"
          data-handling="mer-info" data-entity="${esc(k.last_motion)}">
          <span class="flis-ikon"><ha-icon icon="mdi:history"></ha-icon></span>
          <span class="flis-tekst">
            <span class="flis-navn">Siste bevegelse</span>
            <span class="flis-under">${esc(siden(sist.state))}</span>
          </span>
        </button>`);
    }

    vert.innerHTML = fliser.length
      ? `<div class="fliser">${fliser.join("")}</div>`
      : "";
  }

  _tegnPiller() {
    const tittel = this._config.title === undefined ? "Kamera" : this._config.title;
    const trad = this._rot.querySelector("#tittelrad");
    if (tittel) {
      const antall = this._kameraer().filter((k) =>
        this._kilde === "frigate" ? k.harFrigate : k.harVanlig
      ).length;
      // Ikonet blir menyknapp i Alle-visningen, ellers bare et ikon
      const kanBytte =
        this._valgt === "alle" &&
        this._config.show_layout_switcher !== false &&
        this._kameraer().filter((k) => k.harVanlig).length > 1;

      const meny = this._menyApen
        ? `<div class="meny">
            ${Object.entries(OPPSETT)
              .map(
                ([id, o]) => `
              <button type="button" class="menyvalg ${
                this._oppsett === id ? "aktiv" : ""
              }" data-handling="oppsett" data-verdi="${id}">
                <ha-icon icon="${esc(o.ikon)}"></ha-icon>
                <span>${esc(o.navn)}</span>
                ${this._oppsett === id ? '<ha-icon class="hake" icon="mdi:check"></ha-icon>' : ""}
              </button>`
              )
              .join("")}
          </div>`
        : "";

      trad.innerHTML = `
        <span class="tittel-ikon ${kanBytte ? "klikkbar" : ""} ${
        this._menyApen ? "apen" : ""
      }" ${kanBytte ? 'data-handling="oppsett-meny" role="button" tabindex="0"' : ""}>
          <ha-icon icon="${esc(this._config.title_icon || "mdi:cctv")}"></ha-icon>
          ${kanBytte ? '<ha-icon class="karet" icon="mdi:chevron-down"></ha-icon>' : ""}
        </span>
        <h2>${esc(tittel)}</h2>
        <span class="tittel-antall">${antall} kamera${antall === 1 ? "" : "er"}</span>
        ${meny}`;
      trad.style.display = "";
    } else {
      trad.innerHTML = "";
      trad.style.display = "none";
      this._menyApen = false;
    }

    const kilde = this._rot.querySelector("#kilde");
    kilde.innerHTML = `
      <div class="pille">
        <button type="button" data-handling="kilde" data-verdi="vanlig"
          class="${this._kilde === "vanlig" ? "aktiv" : ""}">Direkte</button>
        <button type="button" data-handling="kilde" data-verdi="frigate"
          class="${this._kilde === "frigate" ? "aktiv" : ""}">Frigate</button>
      </div>`;

    const faner = [];
    if (this._kilde === "frigate" && this._config.show_events !== false) {
      faner.push({ id: "hendelser", navn: "Hendelser", ikon: "mdi:motion-play" });
    }
    if (this._kilde === "vanlig") {
      faner.push({ id: "alle", navn: "Alle", ikon: "mdi:view-grid-outline" });
    }
    this._kameraer().forEach((k) => {
      if (this._erTilgjengelig(k.id)) {
        faner.push({ id: k.id, navn: k.name, ikon: k.icon || "mdi:cctv" });
      }
    });
    if (this._erTilgjengelig("logg")) {
      faner.push({ id: "logg", navn: "Logg", ikon: "mdi:format-list-bulleted" });
    }

    this._rot.querySelector("#piller").innerHTML = faner
      .map(
        (f) => `
        <button type="button" class="fane ${this._valgt === f.id ? "aktiv" : ""}"
          data-handling="kamera" data-verdi="${esc(f.id)}">
          <ha-icon icon="${esc(f.ikon)}"></ha-icon>
          <span>${esc(f.navn)}</span>
        </button>`
      )
      .join("");

  }

  async _visInnhold() {
    const vert = this._rot.querySelector("#innhold");
    const noekkel = `${this._kilde}|${this._valgt}|${this._oppsett}|${
      this._bred ? "bred" : "smal"
    }`;

    if (this._montertNoekkel === noekkel && this._montert) return;
    this._montertNoekkel = noekkel;

    let el = this._cache.get(noekkel);
    if (!el) {
      el = await this._byggInnhold();
      if (el) this._cache.set(noekkel, el);
    }

    vert.innerHTML = "";
    this._montert = el || null;
    if (el) {
      el.hass = this._hass;
      vert.appendChild(el);
    } else {
      vert.innerHTML = `<div class="tomt">Ingen kamerakilde er satt opp for dette valget.</div>`;
    }
  }

  async _byggInnhold() {
    const cfg = this._config;

    if (this._valgt === "logg") {
      const e = this._alleLogg();
      if (!e.length) return null;
      return this._lagTidslinje(e);
    }

    if (this._kilde === "frigate") {
      if (this._valgt === "hendelser") {
        const alle = this._alleFrigate();
        if (!alle.length) return null;
        return this._lagKort(galleriKort(alle, cfg));
      }
      const k = this._kameraer().find((x) => x.id === this._valgt);
      if (!k || !k.harFrigate) return null;
      return this._lagKort({
        type: "vertical-stack",
        cards: [frigateKort(k.frigate), galleriKort(k.frigate, cfg)],
      });
    }

    // Direkte strøm
    if (this._valgt === "alle") {
      const med = this._kameraer().filter((k) => k.harVanlig);
      if (!med.length) return null;
      return this._byggRutenett(med);
    }
    const k = this._kameraer().find((x) => x.id === this._valgt);
    if (!k || !k.harVanlig) return null;
    return this._lagKort(stromKort(k.plain, true));
  }

  /**
   * Rutenett av stillbilder. Egne <img> i stedet for nestede kort, slik at
   * cellene kan spenne over flere rader og bildene fylle dem helt.
   */
  _byggRutenett(kameraer) {
    const preset = OPPSETT[this._oppsett] || OPPSETT.rutenett;
    const fyll = !!this._bred && this._config.fill_screen !== false;
    const avstand = this._config.fill_offset || 210;

    const vert = document.createElement("div");
    vert.className = "rutenett" + (fyll ? " fyll" : "");
    vert.style.gridTemplateColumns = preset.kolonner;

    if (fyll && preset.auto) {
      const rader = Math.ceil(kameraer.length / preset.kolonner.split(" ").length);
      vert.style.gridTemplateRows = `repeat(${rader}, minmax(0, 1fr))`;
      vert.style.height = `calc(100vh - ${avstand}px)`;
      vert.style.height = `calc(100dvh - ${avstand}px)`;
      vert.style.minHeight = "320px";
    }

    if (!preset.auto && preset.omrader) {
      // Kameraer utover feltene i preset-et får hver sin fullbreddes rad
      const antallFelt = preset.omrader.join(" ").match(/[a-p]/g);
      const unike = [...new Set(antallFelt || [])];
      const ekstra = kameraer.slice(unike.length);
      const kolonnetall = preset.kolonner.split(" ").length;
      const ekstraRader = ekstra.map((_, i) =>
        `"${Array(kolonnetall).fill(FELTNAVN[unike.length + i]).join(" ")}"`
      );
      const antRader = preset.omrader.length + ekstraRader.length;
      vert.style.gridTemplateAreas = [...preset.omrader, ...ekstraRader].join(" ");

      if (fyll) {
        // Fyll tilgjengelig skjermhøyde; radene deler den likt
        vert.style.gridTemplateRows = `repeat(${antRader}, minmax(0, 1fr))`;
        vert.style.height = `calc(100vh - ${avstand}px)`;
        vert.style.height = `calc(100dvh - ${avstand}px)`;
        vert.style.minHeight = "320px";
      } else if (preset.celleRatio) {
        // Radene styres av cellenes eget sideforhold
        vert.style.gridTemplateRows = "";
      } else {
        vert.style.gridTemplateRows =
          preset.rader +
          (ekstraRader.length ? " " + ekstraRader.map(() => "1fr").join(" ") : "");
        if (preset.ratio && !ekstraRader.length) vert.style.aspectRatio = preset.ratio;
      }
    }

    const bilder = [];
    kameraer.forEach((k, i) => {
      const celle = document.createElement("button");
      celle.type = "button";
      celle.className = "celle";
      if (!preset.auto) celle.style.gridArea = FELTNAVN[i];
      if (preset.celleRatio && !fyll) celle.style.aspectRatio = preset.celleRatio;
      celle.dataset.handling = "kamera";
      celle.dataset.verdi = k.id;

      const img = document.createElement("img");
      img.alt = k.name || "";
      img.loading = "lazy";
      img.dataset.entity = k.plain;
      celle.appendChild(img);
      bilder.push(img);

      const merke = document.createElement("span");
      merke.className = "celle-navn";
      merke.textContent = k.name || "";
      celle.appendChild(merke);

      const prikk = document.createElement("span");
      prikk.className = "celle-prikk";
      prikk.dataset.motion = k.motion || "";
      celle.appendChild(prikk);

      vert.appendChild(celle);
    });

    const oppdater = (hass) => {
      if (!hass) return;
      bilder.forEach((img) => {
        const s = hass.states[img.dataset.entity];
        const bilde = s && s.attributes ? s.attributes.entity_picture : null;
        if (bilde && img.getAttribute("src") !== bilde) img.setAttribute("src", bilde);
        const celle = img.parentElement;
        const pv = celle.querySelector(".celle-prikk");
        const m = pv && pv.dataset.motion ? hass.states[pv.dataset.motion] : null;
        celle.classList.toggle("bevegelse", !!m && m.state === "on");
        celle.classList.toggle("borte", !s || s.state === "unavailable");
      });
    };

    Object.defineProperty(vert, "hass", {
      set(v) {
        oppdater(v);
      },
      configurable: true,
    });
    oppdater(this._hass);
    return vert;
  }

  /**
   * Tidslinje bygget på HAs logbook-data, tegnet selv slik at den følger
   * designspråket. Henter på nytt når en av entitetene endrer tilstand.
   */
  _lagTidslinje(entiteter) {
    const kort = this;
    const vert = document.createElement("div");
    vert.className = "tidslinje";
    vert.innerHTML = `<div class="tl-laster">Henter aktivitet …</div>`;

    let sisteSignatur = "";
    let henter = false;

    const tegn = (linjer, hass) => {
      if (!linjer.length) {
        vert.innerHTML = `<div class="tl-tom">Ingen aktivitet i perioden.</div>`;
        return;
      }
      let html = "";
      let forrigeDag = "";
      linjer.forEach((l) => {
        const dag = dagTekst(l.when);
        if (dag !== forrigeDag) {
          html += `<div class="tl-dag">${esc(dag)}</div>`;
          forrigeDag = dag;
        }
        const aktiv = l.state === "on";
        const navn = l.name || l.entity_id;
        const sti = opphav(hass, l.entity_id);
        html += `
          <button type="button" class="tl-rad ${aktiv ? "aktiv" : ""}"
            data-handling="mer-info" data-entity="${esc(l.entity_id)}">
            <span class="tl-tid">${esc(klokke(l.when))}</span>
            <span class="tl-ikon">
              <ha-icon icon="${esc(
                linjeIkon(hass, l.entity_id, l.state, l.icon)
              )}"></ha-icon>
            </span>
            <span class="tl-tekst">
              <span class="tl-tittel">${esc(navn)} <i>→</i> ${esc(
          tilstandTekst(hass, l.entity_id, l.state)
        )}</span>
              ${
                sti.length
                  ? `<span class="tl-sti">${sti.map(esc).join(" ▸ ")}</span>`
                  : ""
              }
            </span>
          </button>`;
      });
      vert.innerHTML = html;
    };

    const hent = async (hass) => {
      if (!hass || henter || !entiteter.length) return;
      henter = true;
      const timer = kort._config.logbook_hours || 24;
      const grense = kort._config.logbook_limit || 60;
      const slutt = new Date();
      const start = new Date(slutt.getTime() - timer * 3600 * 1000);
      try {
        let data;
        try {
          data = await hass.callWS({
            type: "logbook/get_events",
            start_time: start.toISOString(),
            end_time: slutt.toISOString(),
            entity_ids: entiteter,
          });
        } catch (e) {
          // Eldre frontend: fall tilbake på REST
          data = await hass.callApi(
            "GET",
            `logbook/${start.toISOString()}?end_time=${slutt.toISOString()}&entity=${entiteter.join(
              ","
            )}`
          );
        }
        const linjer = (data || [])
          .filter((r) => r.entity_id && r.state !== undefined)
          .sort((a, b) => (b.when || 0) - (a.when || 0))
          .slice(0, grense);
        tegn(linjer, hass);
      } catch (err) {
        console.error("ki-kamera-card: klarte ikke å hente logg", err);
        vert.innerHTML = `<div class="tl-tom">Fikk ikke hentet aktiviteten.</div>`;
      } finally {
        henter = false;
      }
    };

    Object.defineProperty(vert, "hass", {
      set(hass) {
        // Hent bare når en av de fulgte entitetene faktisk har endret seg
        const sign = entiteter
          .map((e) => {
            const s = hass.states[e];
            return s ? s.last_changed : "-";
          })
          .join("|");
        if (sign === sisteSignatur) return;
        sisteSignatur = sign;
        hent(hass);
      },
      configurable: true,
    });

    vert.hass = this._hass;
    return vert;
  }

  async _lagKort(config) {
    try {
      const helpers = await window.loadCardHelpers();
      const el = await helpers.createCardElement(config);
      el.hass = this._hass;
      const skall = document.createElement("div");
      skall.className = "skall";
      skall.appendChild(el);
      // hass må videreformidles til det ekte kortet
      Object.defineProperty(skall, "hass", {
        set(v) {
          el.hass = v;
        },
        configurable: true,
      });
      return skall;
    } catch (err) {
      console.error("ki-kamera-card: klarte ikke å lage kort", config, err);
      return null;
    }
  }
}

KiKameraCard.styles = `
  :host { display: block; }
  .rot {
    background: transparent; border: none; box-shadow: none;
    padding: 0; display: block;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad {
    display: flex; align-items: center; gap: 12px;
    padding: 0 4px 14px;
  }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px;
    flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1;
    font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }
  .tittel-antall {
    font-size: 12px; font-weight: 600; opacity: .5;
    color: var(--gray1000, var(--primary-text-color));
    white-space: nowrap;
  }

  /* ---------- kildebryter ---------- */
  .kilde { margin-bottom: 12px; }
  .pille {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
    background: var(--gray200, var(--card-background-color));
    border-radius: 16px; padding: 4px; height: 44px; box-sizing: border-box;
  }
  .pille button {
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .5; border-radius: 12px;
    font-size: 13px; font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff); opacity: 1;
  }
  .pille button:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }

  /* ---------- kamerapiller ---------- */
  .piller {
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 4px;
    margin-bottom: 14px;
    scrollbar-width: none;
  }
  .piller::-webkit-scrollbar { display: none; }
  .fane {
    display: flex; align-items: center; gap: 7px;
    flex: 0 0 auto;
    padding: 9px 15px 9px 12px;
    border-radius: 16px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    opacity: .55;
    --mdc-icon-size: 18px;
    transition: background .18s ease, opacity .18s ease, color .18s ease;
  }
  .fane.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    opacity: 1;
  }
  .fane:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  /* ---------- oppsettsmeny ---------- */
  .tittelrad { position: relative; }
  .tittel-ikon.klikkbar {
    cursor: pointer;
    width: auto; min-width: 38px;
    padding: 0 6px 0 8px;
    gap: 1px;
    border-radius: 19px;
    transition: background .18s ease;
  }
  .tittel-ikon.klikkbar:hover { background: var(--gray400, rgba(128,128,128,.25)); }
  .tittel-ikon.apen {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
  }
  .tittel-ikon .karet { --mdc-icon-size: 15px; opacity: .6; }
  .tittel-ikon.apen .karet { opacity: 1; transform: rotate(180deg); }

  .meny {
    position: absolute;
    top: 44px; left: 0;
    z-index: 20;
    min-width: 190px;
    padding: 6px;
    border-radius: 18px;
    background: var(--gray200, var(--card-background-color));
    box-shadow: 0 14px 38px rgba(0, 0, 0, .45);
    display: flex; flex-direction: column; gap: 2px;
  }
  .menyvalg {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 13px;
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    text-align: left;
    --mdc-icon-size: 18px;
  }
  .menyvalg span { flex: 1; }
  .menyvalg:hover { background: rgba(128, 128, 128, .18); }
  .menyvalg.aktiv { color: var(--active-big, var(--primary-color)); }
  .menyvalg .hake { --mdc-icon-size: 16px; }

  /* ---------- mosaikk ---------- */
  .rutenett { display: grid; gap: 8px; width: 100%; }
  .rutenett.fyll { gap: 10px; }
  .rutenett.fyll .celle { min-height: 0; height: 100%; }
  .celle {
    position: relative;
    padding: 0;
    border-radius: 18px;
    overflow: hidden;
    background: var(--gray200, #222);
    min-height: 90px;
    aspect-ratio: auto;
  }
  .celle img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .celle::after {
    content: "";
    position: absolute; inset: 0;
    border-radius: 18px;
    box-shadow: inset 0 0 0 2px transparent;
    transition: box-shadow .25s ease;
    pointer-events: none;
  }
  .celle.bevegelse::after { box-shadow: inset 0 0 0 2px var(--blue, #3b82f6); }
  .celle.borte img { opacity: .25; }
  .celle-navn {
    position: absolute; left: 10px; bottom: 9px;
    font-size: 12px; font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0, 0, 0, .8);
    pointer-events: none;
  }
  .celle-prikk {
    position: absolute; right: 10px; top: 10px;
    width: 8px; height: 8px; border-radius: 50%;
    background: transparent;
    transition: background .25s ease;
  }
  .celle.bevegelse .celle-prikk { background: var(--blue, #3b82f6); }

  /* ---------- tidslinje ---------- */
  .tidslinje {
    position: relative;
    background: var(--gray200, var(--card-background-color));
    border-radius: 22px;
    padding: 6px 14px 10px;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
  }
  .tidslinje * { box-sizing: border-box; min-width: 0; }
  .tl-laster, .tl-tom {
    padding: 26px 8px;
    text-align: center;
    font-size: 14px;
    color: var(--gray800, var(--secondary-text-color));
  }
  .tl-dag {
    font-size: 12px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
    padding: 14px 0 8px 78px;
  }
  .tl-rad {
    position: relative;
    display: grid;
    grid-template-columns: 62px 44px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 10px 0;
    background: none;
    text-align: left;
    color: var(--gray1000, var(--primary-text-color));
    border-radius: 12px;
  }
  /* koblingslinjen mellom ikonene */
  .tl-rad::before {
    content: "";
    position: absolute;
    left: 95px;
    top: 0; bottom: 0;
    width: 1px;
    background: rgba(128, 128, 128, .28);
  }
  .tl-rad:first-of-type::before { top: 50%; }
  .tl-rad:last-of-type::before { bottom: 50%; }
  .tl-tid {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--gray800, var(--secondary-text-color));
    opacity: .8;
    white-space: nowrap;
  }
  .tl-ikon {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(128, 128, 128, .22);
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px;
  }
  .tl-rad.aktiv .tl-ikon {
    background: var(--yellow, #d6a41a);
    color: var(--black, #1c1c1e);
  }
  .tl-tekst {
    display: flex; flex-direction: column; gap: 3px;
    min-width: 0; max-width: 100%; overflow: hidden;
  }
  .tl-tittel {
    font-size: 15px; font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: normal;
  }
  .tl-tittel i { font-style: normal; opacity: .45; padding: 0 3px; }
  .tl-sti {
    font-size: 13px;
    max-width: 100%;
    color: var(--gray800, var(--secondary-text-color));
    opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .tl-rad + .tl-rad .tl-tekst {
    border-top: 1px solid rgba(128, 128, 128, .14);
    padding-top: 10px;
    margin-top: -10px;
  }

  /* ---------- aktivitetslogg ---------- */
  .logg { display: block; margin-top: 18px; }
  .loggtittel {
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    padding: 0 6px 8px;
  }
  .logg .skall {
    border-radius: 22px;
    overflow: hidden;
    background: var(--gray200, var(--card-background-color));
  }

  /* ---------- innhold ---------- */
  .innhold { display: block; }
  .skall { display: block; }
  .skall ha-card,
  .skall > * {
    --ha-card-border-width: 0;
    --ha-card-box-shadow: none;
  }
  .innhold hui-picture-entity-card, .innhold .skall {
    border-radius: 22px;
    overflow: hidden;
  }
  /* ---------- detaljfliser ---------- */
  .detaljer { display: block; }
  .fliser {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
    margin-top: 12px;
  }
  .flis {
    display: grid; grid-template-columns: 44px 1fr;
    align-items: center; gap: 10px;
    padding: 10px 12px 10px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    transition: background .2s ease, color .2s ease;
  }
  .flis.varsel { background: var(--red, #e5484d); color: var(--gray100, #fff); }
  .flis.aktiv { background: var(--blue, #3b82f6); color: var(--gray100, #fff); }
  .flis:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .flis-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    --mdc-icon-size: 21px;
    justify-self: end;
  }
  .flis.varsel .flis-ikon, .flis.aktiv .flis-ikon { background: rgba(250, 251, 252, .16); }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn { font-size: 14px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flis-under { font-size: 12px; font-weight: 500; opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tomt {
    padding: 28px 18px;
    border-radius: 22px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray800, var(--secondary-text-color));
    font-size: 14px; text-align: center;
  }

  @media (max-width: 430px) {
    .tidslinje { padding: 4px 10px 8px; }
    .tl-rad { grid-template-columns: 48px 36px minmax(0, 1fr); gap: 9px; }
    .tl-rad::before { left: 75px; }
    .tl-ikon { width: 36px; height: 36px; --mdc-icon-size: 18px; }
    .tl-tid { font-size: 11px; }
    .tl-tittel { font-size: 14px; }
    .tl-sti { font-size: 12px; }
    .tl-dag { padding-left: 57px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pille button, .fane { transition: none; }
  }
`;

/* ───────────────────────────────────────────────────────────────── editor ── */

class KiKameraCardEditor extends HTMLElement {
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
    if (!this._config.cameras) this._config.cameras = STANDARD_KONFIG().cameras;
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
    inp.checked = verdi !== false;
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
      p.includeDomains = domener || ["camera"];
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
    this.shadowRoot.innerHTML = `<style>${KiKameraCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tittelrad = document.createElement("div");
    tittelrad.className = "tokol";
    tittelrad.appendChild(
      this._tekstfelt(
        "Overskrift (tom = skjul)",
        this._config.title === undefined ? "Kamera" : this._config.title,
        (v) => {
          this._config.title = v;
          this._endret();
        }
      )
    );
    tittelrad.appendChild(
      this._ikonfelt(this._config.title_icon || "mdi:cctv", (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tittelrad);
    gen.appendChild(
      this._velger(
        "Oppsett i Alle-visningen",
        Object.entries(OPPSETT).map(([id, o]) => [id, o.navn]),
        this._config.grid_layout || "mosaikk",
        (v) => {
          this._config.grid_layout = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Fyll skjermhøyden på brede skjermer",
        this._config.fill_screen,
        (v) => {
          this._config.fill_screen = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._tekstfelt(
        "Plass til annet innhold (px)",
        this._config.fill_offset || 210,
        (v) => {
          this._config.fill_offset = parseInt(v) || 210;
          this._endret();
        },
        "number"
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Vis oppsettsvelger i kortet",
        this._config.show_layout_switcher,
        (v) => {
          this._config.show_layout_switcher = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._velger(
        "Kilde ved åpning",
        [
          ["frigate", "Frigate"],
          ["vanlig", "Direkte strøm"],
        ],
        this._config.default_source || "frigate",
        (v) => {
          this._config.default_source = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing("Vis samlet hendelsesfane", this._config.show_events, (v) => {
        this._config.show_events = v;
        this._endret();
      })
    );
    gen.appendChild(
      this._avkryssing(
        "Inverter personvernbryter (på = kamera filmer)",
        this._config.privacy_invert,
        (v) => {
          this._config.privacy_invert = v;
          this._endret();
        }
      )
    );
    const rad = document.createElement("div");
    rad.className = "trekol";
    rad.appendChild(
      this._tekstfelt(
        "Hendelser",
        this._config.events_limit || 12,
        (v) => {
          this._config.events_limit = parseInt(v) || 12;
          this._endret();
        },
        "number"
      )
    );
    rad.appendChild(
      this._tekstfelt(
        "Kolonner",
        this._config.events_columns || 2,
        (v) => {
          this._config.events_columns = parseInt(v) || 2;
          this._endret();
        },
        "number"
      )
    );
    rad.appendChild(
      this._tekstfelt("Høyde", this._config.events_height || "500px", (v) => {
        this._config.events_height = v;
        this._endret();
      })
    );
    gen.appendChild(rad);
    gen.appendChild(
      this._tekstfelt(
        "Timer i aktivitetsloggen",
        this._config.logbook_hours || 24,
        (v) => {
          this._config.logbook_hours = parseInt(v) || 24;
          this._endret();
        },
        "number"
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Frigate-visningen bruker advanced-camera-card og mysmart-frigate-gallery. Direkte-visningen bruker kameraentiteten rå, uten deteksjon.";
    gen.appendChild(h);
    rot.appendChild(gen);

    this._config.cameras.forEach((c, ci) => this._tegnKamera(rot, c, ci));

    rot.appendChild(
      this._knapp("+ Nytt kamera", "hovedknapp", () => {
        this._config.cameras.push({ name: "Nytt kamera", icon: "mdi:cctv", frigate: [] });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnKamera(rot, c, ci) {
    const noekkel = String(ci);
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = c.name || "Uten navn";
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "kropp";

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Navn", c.name, (v) => {
        c.name = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._ikonfelt(c.icon, (v) => {
        c.icon = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    kropp.appendChild(
      this._entitetsfelt("Direkte strøm (UniFi e.l.)", c.plain, (v) => {
        if (v) c.plain = v;
        else delete c.plain;
        this._endret();
      }, ["camera"])
    );

    const sensorboks = document.createElement("div");
    sensorboks.className = "underboks";
    sensorboks.innerHTML =
      "<div class='undertittel'>Vises bare i kameraets egen fane</div>";
    sensorboks.appendChild(
      this._entitetsfelt(
        "Personvernmodus",
        c.privacy,
        (v) => {
          if (v) c.privacy = v;
          else delete c.privacy;
          this._endret();
        },
        ["switch"]
      )
    );
    sensorboks.appendChild(
      this._entitetsfelt(
        "Bevegelsessensor",
        c.motion,
        (v) => {
          if (v) c.motion = v;
          else delete c.motion;
          this._endret();
        },
        ["binary_sensor"]
      )
    );
    sensorboks.appendChild(
      this._entitetsfelt(
        "Siste bevegelse",
        c.last_motion,
        (v) => {
          if (v) c.last_motion = v;
          else delete c.last_motion;
          this._endret();
        },
        ["sensor"]
      )
    );
    kropp.appendChild(sensorboks);

    const loggboks = document.createElement("div");
    loggboks.className = "underboks";
    loggboks.innerHTML = "<div class='undertittel'>Aktivitetslogg</div>";
    (c.logbook || []).forEach((e, ei) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt(
          "Entitet",
          e,
          (v) => {
            if (v) c.logbook[ei] = v;
            else c.logbook.splice(ei, 1);
            this._endret();
            this._tegn();
          },
          ["binary_sensor", "sensor", "switch", "event", "camera"]
        )
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          c.logbook.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      loggboks.appendChild(rad);
    });
    loggboks.appendChild(
      this._knapp("+ Legg til i loggen", "hovedknapp liten", () => {
        if (!c.logbook) c.logbook = [];
        c.logbook.push("");
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(loggboks);

    const fri = document.createElement("div");
    fri.className = "underboks";
    fri.innerHTML = "<div class='undertittel'>Frigate-kameraer</div>";
    (c.frigate || []).forEach((e, ei) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Frigate-kamera", e, (v) => {
          if (v) c.frigate[ei] = v;
          else c.frigate.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          c.frigate.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      fri.appendChild(rad);
    });
    fri.appendChild(
      this._knapp("+ Legg til Frigate-kamera", "hovedknapp liten", () => {
        if (!c.frigate) c.frigate = [];
        c.frigate.push("");
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(fri);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (ci > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.cameras.splice(ci, 1);
          this._config.cameras.splice(ci - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (ci < this._config.cameras.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.cameras.splice(ci, 1);
          this._config.cameras.splice(ci + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett kamera", "mini fare", () => {
        this._config.cameras.splice(ci, 1);
        this._apne.delete(noekkel);
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(verktoy);

    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiKameraCardEditor.styles = `
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
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
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
  .trekol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color);
    border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol, .trekol { grid-template-columns: 1fr; } }
`;

customElements.define("ki-kamera-card", KiKameraCard);
customElements.define("ki-kamera-card-editor", KiKameraCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-kamera-card",
  name: "KI Kamera",
  description: "Kameraoversikt med bryter mellom Frigate og direkte strøm.",
  preview: true,
});
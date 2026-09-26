/**
 * ki-kamera-card.js
 *
 * Kameraoversikt i samme designspråk som ki-energi-card og ki-alarm-card.
 *   • Kildebryter: Frigate (advanced-camera-card + hendelsesgalleri) eller
 *     Direkte (rå kamerastrøm, f.eks. UniFi high resolution channel)
 *   • Kamerapiller med ikon og bevegelsesprikk, horisontalt rullbare
 *   • Alle-visningen i ni oppsett: mosaikk, hovedkamera, rutenett, liste, masonry,
 *     oversikt (stort kamera med direktestrøm + småbilder), fokus (bla ett og ett),
 *     2×2 (sider med fire) og 3 kolonner
 *   • Fliser med LIVE-merke, deteksjon (person/bil/dyr/pakke/bevegelse), modell og åpne-knapp;
 *     stillbildene byttes hvert `oppdater` sekund
 *   • Enkeltvisning med personvern, bevegelse, siste bevegelse, lys, sirene, snakk og «ta bilde»
 *   • Hendelser (Direkte): dagens deteksjoner fra sensorhistorikken, med filter og tall
 *   • Hendelsesfane som samler alle Frigate-kameraene
 *   • Full GUI-editor
 *
 * De eksisterende kortene dine brukes videre — dette kortet monterer
 * custom:advanced-camera-card og custom:mysmart-frigate-gallery inni seg.
 *
 * Tilpass kameraer (per bruker): hver bruker velger oppsett, hvilke kameraer som vises og i hvilken
 * rekkefølge, bytter kamera-entitet, legger til andre camera.* og velger egen entitet for stillbildene
 * (f.eks. lav oppløsning). Lagres i Home Assistant (frontend/set_user_data, nøkkel «ki_kamera»), så valgene
 * følger brukeren til alle enheter: { [oppsett_id]: { oppsett, liste: [camera.*], skjul: [camera.*], bilde: {} } }.
 * Standard for en bruker kan settes i konfigurasjonen:
 *   per_bruker:
 *     Sebastian: { grid_layout: hoved, rekkefolge: [Inngang, Garasje], skjul: [Bod] }
 *
 * Nye valg (alle valgfrie):
 *   auto: false            # ta med andre camera.* som ikke står i cameras (medium/low/insecure hoppes over)
 *   navn: { ringeklokke: Inngang }   # nøkkelord i objekt-ID → navn for automatiske kameraer
 *   oppdater: 10           # sek mellom stillbilder i rutenettet
 *   direkte: true          # direktestrøm (ha-camera-stream) i oversikt/fokus
 *   sirene: null           # siren.* for sirene-flisen (tom = første siren.*, false = skjul)
 *   bilde_mappe: /config/www/kamera   # camera.snapshot (må være i allowlist_external_dirs)
 *   lagring: null          # sensor for opptakskapasitet (auto: sensor.*_recording_capacity)
 *   show_detections: true  # Hendelser-fanen i Direkte
 *   show_customize: true   # «Tilpass kameraer»-knappen under rutenettet
 *   oppsett_id: standard   # skiller brukervalgene når flere kamerakort finnes
 *   cameras[].lys / .snakk # lys og snakk-bryter for enkeltvisningen
 *
 * Legges i /config/www/ki-kamera-card.js og registreres som
 * JavaScript Module: /local/ki-kamera-card.js
 */

const KI_KAMERA_VERSION = "2.0.0";

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
    adaptiv: true,      // kolonnetallet følger bredden, se _kolonnetall()
  },
  liste: {
    navn: "Liste",
    ikon: "mdi:view-sequential-outline",
    kolonner: "1fr",
    celleRatio: "16 / 9",
    auto: true,
  },
  /* Oppsettene under er hentet fra kd-kamera-card og tegnes av _byggSpesial(). */
  masonry: { navn: "Masonry", ikon: "mdi:view-dashboard-variant-outline", spesial: true },
  oversikt: { navn: "Oversikt", ikon: "mdi:view-compact-outline", spesial: true },
  fokus: { navn: "Fokus", ikon: "mdi:crop-free", spesial: true },
  "2x2": { navn: "2×2", ikon: "mdi:grid-large", spesial: true },
  "3kol": { navn: "3 kolonner", ikon: "mdi:view-column-outline", spesial: true },
};

/* Deteksjon: binary_sensor.<enhet><suffiks> (UniFi Protect / Frigate). */
const DET = {
  person: ["_person_detected", "_person_occupancy"],
  car: ["_vehicle_detected", "_car_occupancy"],
  animal: ["_animal_detected", "_cat_occupancy", "_dog_occupancy"],
  package: ["_package_detected", "_package_occupancy"],
};
const OBJ = {
  person: ["Person", "mdi:account"],
  car: ["Bil", "mdi:car"],
  animal: ["Dyr", "mdi:paw"],
  package: ["Pakke", "mdi:package-variant-closed"],
  motion: ["Bevegelse", "mdi:motion-sensor"],
};
const AUTO_IKON = [
  [/pakke|package/, "mdi:package-variant-closed"], [/inngang|ringeklokke|doorbell|entry|d[øo]r/, "mdi:doorbell-video"],
  [/mellomgang|trapp|gang|hall|stair/, "mdi:stairs"], [/veranda|terrasse|deck|balkong|patio/, "mdi:flower"],
  [/stue|living/, "mdi:sofa"], [/garasje|garage/, "mdi:garage"], [/kj[øo]kken|kitchen/, "mdi:countertop"],
  [/hage|ute|yard|garden|innkj/, "mdi:tree"], [/printer|k2|creality/, "mdi:printer-3d"],
];
const UD_NOKKEL = "ki_kamera";
const slug = (s) => String(s || "").toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
  .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
/** Objekt-ID uten oppløsning/kanal: ringeklokke_g6_entry_high_resolution_channel → ringeklokke_g6_entry */
const enhetAv = (obj) => obj.replace(/_(ultra_)?(high|medium|low)(_resolution_channel|_resolution|_res)?$/, "")
  .replace(/_insecure$/, "").replace(/_package(_camera)?$/, "");
const kvalitet = (id) => /_high|_ultra_high/.test(id) ? "Høy" : /_medium/.test(id) ? "Middels" : /_low/.test(id) ? "Lav"
  : /_insecure/.test(id) ? "Usikret" : /_package/.test(id) ? "Pakke" : "";
const LAV_OPPLOSNING = /_(medium|low)(_resolution_channel|_resolution|_res)?$|_insecure$/;
const mmss = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

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
    this._strommer = new Map();
    this._tikk = 0;
    this._sistTikk = Date.now();
    this._onUd = (e) => {
      if (!e || !e.detail || e.detail.key !== UD_NOKKEL || !this._hass || !this._config || !this._bygget) return;
      const for_ = JSON.stringify(this._personlig || {});
      this._lastPersonlig();
      if (JSON.stringify(this._personlig || {}) === for_) return;
      this._montertNoekkel = null;
      if (!this._erTilgjengelig(this._valgt)) this._valgt = this._forsteTilgjengelige();
      this._oppdater();
      if (this._tpApen) this._tegnTilpass();
    };
  }

  static getConfigElement() {
    return document.createElement("ki-kamera-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  /* Hvor mange kolonner rutenettet skal ha.
   *
   * Alle oppsettene var låst til to kolonner. På en bred skjerm ble hver celle da over
   * tusen piksler bred med fast radhøyde, og bildet beskåret hardt — og med seks eller
   * sju kameraer ble radene så lave at det knapt var noe igjen å se.
   *
   * Nå deles bredden på ønsket minstebredde per celle, begrenset av `maks_kolonner` og
   * av hvor mange kameraer som faktisk finnes.
   */
  _kolonnetall(antall) {
    const c = this._config || {};
    const bredde = this.clientWidth || this.offsetWidth || 0;
    const min = Number(c.min_bredde) || 420;
    const maks = Math.max(1, Number(c.maks_kolonner) || 4);
    if (!bredde) return Math.min(2, Math.max(1, antall));
    // Mobil: to kolonner, som rutenettet i kd-kamera-card; ellers så mange som får plass
    const passer = Math.max(bredde < 700 && !c.min_bredde ? 2 : 1, Math.floor(bredde / min));
    return Math.max(1, Math.min(maks, passer, Math.max(1, antall)));
  }

  /* Luft mellom cellene. Sto fast på 1 px, som ble påfallende tett. */
  _gap() {
    const g = (this._config || {}).gap;
    if (g === undefined || g === null || g === "") return "6px";
    return /^-?\d+(\.\d+)?$/.test(String(g).trim()) ? `${parseFloat(g)}px` : String(g);
  }

  _standardOppsett() {
    return OPPSETT[this._config.grid_layout] ? this._config.grid_layout : "mosaikk";
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.cameras) this._config.cameras = [];
    // luft: marg rundt kortet. Et rent tall blir px, ellers brukes verdien som den er
    // — «0 14px» er en gyldig CSS-padding. parseFloat alene duger ikke her: den
    // godtar alt som begynner med et tall, så «0 14px» ble tolket som 0.
    const luft = this._config.luft;
    const rentTall = /^-?\d+(\.\d+)?$/.test(String(luft).trim());
    this.style.setProperty("--ki-kam-gap", this._gap());
    this.style.setProperty("--ki-kam-luft",
      luft === undefined || luft === null || luft === "" ? "0px"
        : (rentTall ? `${parseFloat(luft)}px` : String(luft)));
    this._oppsett = this._standardOppsett();
    this._personlig = null;
    this._tpApen = false;
    this._tpVelg = null;
    this._tpSok = "";
    this._menyApen = false;
    this._feat = null;
    this._side = 0;
    this._fi = 0;
    this._kamCache = null;
    this._kilde = config.default_source === "vanlig" ? "vanlig" : "frigate";
    // Startfanen må følge kilden — Direkte har ingen hendelsesfane
    this._valgt = this._forsteTilgjengelige();
    this._cache.clear();
    this._loggCache.clear();
    this._montert = null;
    this._loggKort = null;
    this._loggNoekkel = undefined;
    this._montertNoekkel = null;
    this._tegnetFor = false;
    this._bygget = false;
  }

  set hass(hass) {
    const forste = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._personlig && hass.user) this._lastPersonlig();
    if (!this._bygget) {
      this._bygg();
      if (!this._erTilgjengelig(this._valgt)) this._valgt = this._forsteTilgjengelige();
    }
    // Nestede kort får hass videreformidlet uten at noe bygges på nytt,
    // ellers ville livestrømmen startet om ved hver tilstandsendring.
    if (this._montert) this._montert.hass = hass;
    if (this._loggKort) this._loggKort.hass = hass;
    if (forste || !this._tegnetFor) { this._tegnetFor = true; this._oppdater(); return; }
    // Bevegelsesprikkene i kamerapillene
    const sig = this._aktivSignatur();
    if (sig !== this._aktivSig) { this._aktivSig = sig; this._tegnPiller(); }
    this._tegnDetaljer();
  }

  getCardSize() {
    return 12;
  }

  disconnectedCallback() {
    if (this._obs) this._obs.disconnect();
    clearInterval(this._timer);
    window.removeEventListener("ki-ud", this._onUd);
  }

  connectedCallback() {
    if (this._obs && this._rot) this._obs.observe(this._rot);
    window.addEventListener("ki-ud", this._onUd);
    clearInterval(this._timer);
    // Stillbildene i Alle-visningen byttes hvert `oppdater` sekund
    this._timer = setInterval(() => {
      if ((typeof document !== "undefined" && document.hidden) || !this._alleEl || !this._alleEl.isConnected) return;
      const per = Math.max(2, Number(this._config && this._config.oppdater) || 10) * 1000;
      if (Date.now() - this._sistTikk < per) return;
      this._sistTikk = Date.now();
      this._tikk++;
      this._patch(this._alleEl);
    }, 1000);
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiKameraCard.styles}</style>`;
    const rot = document.createElement("ha-card");
    rot.className = "rot";
    rot.innerHTML = `
      <div class="tittelrad" id="tittelrad"></div>
      <div class="tilpass" id="tilpass" style="display:none"></div>
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
        // Kolonnetallet kan endre seg uten at smal/bred gjør det — da må rutenettet
        // likevel tegnes på nytt, ellers henger det igjen på gammelt antall.
        const kol = this._kolonnetall(this._kameraer().filter((k) => k.harVanlig).length);
        if (bred === this._bred && kol === this._kolFor) return;
        this._bred = bred;
        this._kolFor = kol;
        if (this._valgt === "alle") {
          this._montertNoekkel = null;
          this._visInnhold();
        }
      });
      this._obs.observe(rot);
    }

    rot.addEventListener("click", (e) => this._klikk(e));
    rot.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target && e.target.classList && e.target.classList.contains("celle")) {
        e.preventDefault();
        e.target.click();
      }
    });
    // Søkefeltet i «Tilpass kameraer»: bare brikkene tegnes på nytt, så fokus blir stående
    rot.addEventListener("input", (e) => {
      const inp = e.target;
      if (!inp || !inp.dataset || inp.dataset.tpSok === undefined) return;
      this._tpSok = inp.value;
      const k = this._kameraer().find((x) => x.id === this._tpVelg);
      const vert = this._rot.querySelector("[data-tp-chips]");
      if (k && vert) vert.innerHTML = this._tpChips(k);
    });

    /* Langt trykk på en flis eller en logglinje åpner entiteten. */
    this._rot.addEventListener("pointerdown", (e) => {
      const el = e.composedPath().find((n) => n && n.dataset && n.dataset.entity);
      if (!el) return;
      clearTimeout(this._holdTimer);
      this._holdt = false;
      this._holdTimer = setTimeout(() => {
        this._holdt = true;
        this._haptikk("medium");
        this._merInfo(el.dataset.entity);
      }, 500);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((t) =>
      this._rot.addEventListener(t, () => clearTimeout(this._holdTimer)));
    this._rot.addEventListener("contextmenu", (e) => {
      if (e.composedPath().some((n) => n && n.dataset && n.dataset.entity)) e.preventDefault();
    });

    this._bygget = true;
  }

  _klikk(e) {
    const el = e.target.closest("[data-handling]");
    if (!el) {
      if (this._menyApen) {
        this._menyApen = false;
        this._tegnPiller();
      }
      return;
    }
    const h = el.dataset.handling;
    if (el.disabled) return;
    if (this._menyApen && h !== "oppsett" && h !== "oppsett-meny") {
      this._menyApen = false;
    }
    if (h === "kilde") {
      if (this._kilde === el.dataset.verdi) return;
      this._haptikk("selection");
      this._kilde = el.dataset.verdi;
      if (this._kilde === "vanlig") {
        // Direkte åpner alltid i oversikten
        this._valgt = "alle";
      } else if (!this._erTilgjengelig(this._valgt)) {
        this._valgt = this._forsteTilgjengelige();
      }
      this._oppdater();
    } else if (h === "kamera") {
      if (this._holdt) { this._holdt = false; return; }
      e.stopPropagation();
      if (this._valgt === el.dataset.verdi) return;
      this._haptikk("selection");
      this._valgt = el.dataset.verdi;
      this._oppdater();
    } else if (h === "feat") {
      if (this._holdt) { this._holdt = false; return; }
      if (this._feat === el.dataset.verdi) return;
      this._haptikk("selection");
      this._feat = el.dataset.verdi;
      this._visAlle();
    } else if (h === "side") {
      this._haptikk("selection");
      this._side = Math.max(0, (this._side || 0) + Number(el.dataset.verdi));
      this._visAlle();
    } else if (h === "fokus") {
      this._fokusGaa(el.dataset.verdi);
    } else if (h === "oppsett-meny") {
      this._menyApen = !this._menyApen;
      this._tegnPiller();
    } else if (h === "oppsett") {
      this._menyApen = false;
      if (this._oppsett === el.dataset.verdi) {
        this._tegnPiller();
        return;
      }
      this._haptikk("selection");
      this._settOppsett(el.dataset.verdi);
      this._oppdater();
    } else if (h === "tilpass") {
      this._menyApen = false;
      this._haptikk("selection");
      this._tpApen = true;
      this._tpVelg = null;
      this._tegnPiller();
      this._tegnTilpass();
    } else if (h.startsWith("tilpass-")) {
      this._tilpassHandling(h, el);
    } else if (h === "personvern") {
      if (this._holdt) { this._holdt = false; return; }
      this._haptikk("light");
      /* Vis det nye med en gang. Kameraet bruker et par sekunder på å svare, og
         en flis som står i gammel tilstand så lenge leses som at trykket ikke tok. */
      const st = this._hass.states[el.dataset.entity];
      this._optPersonvern = { id: el.dataset.entity, state: st && st.state === "on" ? "off" : "on", t: Date.now() };
      this._detaljSignatur = "";
      this._tegnDetaljer();
      this._hass.callService("switch", "toggle", {
        entity_id: el.dataset.entity,
      });
    } else if (h === "veksle") {
      if (this._holdt) { this._holdt = false; return; }
      this._haptikk("light");
      const id = el.dataset.entity, dom = id.split(".")[0];
      if (dom === "camera") { this._merInfo(id); return; }
      this._hass.callService(["switch", "light", "siren", "input_boolean", "fan"].includes(dom) ? dom : "homeassistant", "toggle", { entity_id: id });
    } else if (h === "bilde") {
      if (this._holdt) { this._holdt = false; return; }
      this._taBilde(el.dataset.verdi);
    } else if (h === "mer-info") {
      if (this._holdt) { this._holdt = false; return; }
      this._merInfo(el.dataset.entity);
    }
  }

  _merInfo(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  _haptikk(type = "light") {
    try { window.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true })); } catch (e) { /* eldre */ }
    if (navigator.vibrate) { try { navigator.vibrate(type === "medium" ? 12 : 8); } catch (e) { /* blokkert */ } }
  }

  /** camera.snapshot til bilde_mappe (må stå i allowlist_external_dirs). */
  _taBilde(id) {
    if (!id || !this._hass) return;
    const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
    const stempel = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
    const mappe = String(this._config.bilde_mappe || "/config/www/kamera").replace(/\/$/, "");
    this._haptikk("light");
    Promise.resolve(this._hass.callService("camera", "snapshot", { entity_id: id, filename: `${mappe}/${id.split(".")[1]}_${stempel}.jpg` }))
      .then(() => this._toast("Bilde lagret i " + mappe))
      .catch((err) => this._toast("Fikk ikke lagret bildet: " + ((err && err.message) || err)));
  }

  /* ───────────────────────── brukervalg (Tilpass kameraer) ─────────────────────────
     Lagres i Home Assistant per bruker (KI.ud/KI.udSave, nøkkel «ki_kamera»), så valgene følger
     brukeren til alle enheter. Uten ki-cards-basen (kortet lastet alene) brukes nettleseren.
     Eldre valg fra localStorage og per_bruker i konfigurasjonen leses fortsatt. */
  _personligNokkel() {
    const bruker = (this._hass && this._hass.user && this._hass.user.id) || "ukjent";
    const kort = this._config.oppsett_id || this._config.title || (this._config.cameras || []).map((c) => c.name).join(",");
    return `ki-kamera-oppsett:${kort}:${bruker}`;
  }
  _kortId() {
    return String(this._config.oppsett_id || "standard");
  }
  _ki() {
    const K = window.KI;
    return K && typeof K.ud === "function" && typeof K.udSave === "function" ? K : null;
  }
  _brukerStandard() {
    const pb = this._config.per_bruker || {};
    const u = this._hass && this._hass.user;
    if (!u) return null;
    return pb[u.name] || pb[u.id] || pb[(u.name || "").split(" ")[0]] || null;
  }
  _lastPersonlig() {
    let lagret = null;
    const K = this._ki();
    if (K) {
      const alle = K.ud(this._hass, UD_NOKKEL) || {};
      const v = alle[this._kortId()];
      if (v && typeof v === "object" && Object.keys(v).length) lagret = v;
    }
    if (!lagret) {
      try { lagret = JSON.parse(localStorage.getItem(this._personligNokkel()) || "null"); } catch (e) { /* privat modus */ }
    }
    const std = this._brukerStandard();
    const p = lagret || (std ? { oppsett: std.grid_layout, rekkefolge: std.rekkefolge, skjul: std.skjul } : null);
    this._personlig = p || {};
    this._harEgetOppsett = !!lagret;
    this._oppsett = p && p.oppsett && OPPSETT[p.oppsett] ? p.oppsett : this._standardOppsett();
    this._kamCache = null;
  }
  _lagrePersonlig(endring) {
    this._personlig = { ...(this._personlig || {}), ...endring };
    this._harEgetOppsett = true;
    this._kamCache = null;
    const K = this._ki();
    if (K) {
      const alle = { ...(K.ud(this._hass, UD_NOKKEL) || {}) };
      alle[this._kortId()] = this._personlig;
      K.udSave(this._hass, UD_NOKKEL, alle);
    } else {
      try { localStorage.setItem(this._personligNokkel(), JSON.stringify(this._personlig)); } catch (e) { /* privat modus */ }
    }
  }
  _nullstillPersonlig() {
    try { localStorage.removeItem(this._personligNokkel()); } catch (e) { /* privat modus */ }
    const K = this._ki();
    if (K) {
      const alle = { ...(K.ud(this._hass, UD_NOKKEL) || {}) };
      delete alle[this._kortId()];
      this._personlig = {};
      K.udSave(this._hass, UD_NOKKEL, alle);
    }
    this._lastPersonlig();
  }
  _settOppsett(v) {
    if (!OPPSETT[v]) return;
    this._oppsett = v;
    this._side = 0;
    this._fi = 0;
    this._lagrePersonlig({ oppsett: v });
  }
  _erSkjult(k) {
    const skjul = (this._personlig || {}).skjul || [];
    return skjul.includes(k.id) || skjul.includes(k.name);
  }
  /* Kameraene i brukerens rekkefølge; skjulte tas bare ut der det bes om (Alle-visningen). */
  _iRekkefolge(liste, utenSkjulte) {
    const p = this._personlig || {};
    let ut = liste.slice();
    if (!Array.isArray(p.liste) || !p.liste.length) {
      const rek = p.rekkefolge || [];
      const plass = (k) => {
        const i = rek.indexOf(k.id) >= 0 ? rek.indexOf(k.id) : rek.indexOf(k.name);
        return i < 0 ? 1000 + (k._i === undefined ? 500 : k._i) : i;
      };
      ut = ut.map((k, n) => [k, n]).sort((a, b) => plass(a[0]) - plass(b[0]) || a[1] - b[1]).map((x) => x[0]);
    }
    return ut.filter((k) => !utenSkjulte || !this._erSkjult(k));
  }

  /* ───────────────────────── kameraene ───────────────────────── */

  /** Kameraene fra konfigurasjonen. kd-kamera-cards `kameraer`-liste godtas også. */
  _konfigKameraer() {
    const c = this._config;
    const a = (c.cameras || []).map((x, i) => ({ ...x, _i: i }));
    const b = (Array.isArray(c.kameraer) ? c.kameraer : []).map((x, i) => {
      const o = typeof x === "string" ? { entity: x } : x || {};
      const fr = o.frigate ? (Array.isArray(o.frigate) ? o.frigate : ["camera." + String(o.frigate).replace(/^camera\./, "")]) : [];
      return {
        name: o.name || o.navn, icon: o.icon || (String(o.ikon || "").includes(":") ? o.ikon : undefined),
        plain: o.plain || o.entity, frigate: fr, motion: o.motion || o.bevegelse, privacy: o.privacy,
        lys: o.lys, snakk: o.snakk, meta: o.meta, logbook: o.logbook, _i: a.length + i,
      };
    });
    return [...a, ...b].filter((x) => x.plain || (x.frigate && x.frigate.length));
  }

  /** Beriker en kameraoppføring med navn, ikon, bevegelse/deteksjon, lys og stillbilde-entitet. */
  _berik(c, fraKonfig) {
    const states = (this._hass && this._hass.states) || {};
    const id = c.plain || null;
    const obj = id ? id.split(".")[1] || "" : "";
    const dev = obj ? enhetAv(obj) : "";
    const pkg = /_package(_camera)?$/.test(obj);
    const fr = (c.frigate || []).map((f) => String(f).split(".").pop());
    const devs = [dev, ...fr].filter(Boolean);
    const st = id ? states[id] : null;
    let name = c.name;
    if (!name) for (const [k, v] of Object.entries(this._config.navn || {})) if (obj.includes(k)) { name = v; break; }
    if (!name && pkg) name = "Pakke";
    if (!name) {
      const fn = String((st && st.attributes && st.attributes.friendly_name) || "");
      name = fn.replace(/\s*(high|medium|low)( resolution( channel)?)?$/i, "").replace(/\s+G\d\b.*$/i, "").trim()
        || (obj ? obj.replace(/_/g, " ").replace(/^./, (m) => m.toUpperCase()) : "Kamera");
    }
    const icon = c.icon || (AUTO_IKON.find(([re]) => re.test(`${slug(name)} ${obj}`)) || [0, "mdi:cctv"])[1];
    const det = {};
    for (const [k, sufs] of Object.entries(DET)) {
      if (pkg && k !== "package") continue;
      const hit = devs.flatMap((d) => sufs.map((x) => `binary_sensor.${d}${x}`)).find((x) => states[x]);
      if (hit) det[k] = hit;
    }
    const motion = c.motion || (pkg ? null : devs.map((d) => `binary_sensor.${d}_motion`).find((x) => states[x]) || null);
    const lys = c.lys || c.light || (dev ? [`light.${dev}_flood_light`, `light.${dev}_floodlight`].find((x) => states[x]) : null) || null;
    const bilde = ((this._personlig || {}).bilde || {})[id];
    const snap = bilde && bilde !== id && states[bilde] ? bilde : null;
    // Kameraer som ikke står i konfigurasjonen får aktivitetsloggen fra sensorene sine
    const logbook = c.logbook !== undefined || fraKonfig ? c.logbook : [motion, ...Object.values(det)].filter(Boolean);
    return {
      ...c, id: id || "frigate:" + c._i, obj, dev, pkg, name, icon, det, motion, lys, snap, logbook, fraKonfig,
      harFrigate: !!(c.frigate && c.frigate.length),
      harVanlig: !!id && !c.fjernet,
    };
  }

  _autoPa() {
    const a = this._config.auto;
    return a === true || (a !== false && !this._konfigKameraer().length);
  }

  /** Alle kameraene kortet kjenner: brukerens liste (eller konfigurasjonen + auto) og Frigate-kameraene. */
  _kameraer() {
    const states = (this._hass && this._hass.states) || {};
    const ids = Object.keys(states);
    const noekkel = ids.length + "|" + JSON.stringify(this._personlig || {});
    if (this._kamCache && this._kamCache.n === noekkel) return this._kamCache.v;
    const cfg = this._konfigKameraer();
    const p = this._personlig || {};
    const liste = Array.isArray(p.liste) && p.liste.length
      ? [...new Set(p.liste.filter((x) => typeof x === "string" && x.startsWith("camera.")))] : null;
    let ut;
    if (liste) {
      // Brukerlista bestemmer utvalg og rekkefølge i Direkte; navn, ikon og sensorer arves fra
      // konfigurasjonen for samme kamera. Frigate-kameraene står der uansett.
      const cfgFor = (id) => cfg.find((c) => c.plain === id);
      ut = liste.map((id) => cfgFor(id) ? this._berik(cfgFor(id), true) : this._berik({ plain: id }, false));
      cfg.filter((c) => !liste.includes(c.plain) && c.frigate && c.frigate.length)
        .forEach((c) => ut.push(this._berik({ ...c, fjernet: !!c.plain }, true)));
    } else {
      ut = cfg.map((c) => this._berik(c, true));
      if (this._autoPa()) {
        const brukt = new Set();
        cfg.forEach((c) => { if (c.plain) brukt.add(c.plain); (c.frigate || []).forEach((f) => brukt.add(f)); });
        const enheter = new Set(ut.filter((k) => k.plain).map((k) => k.dev + (k.pkg ? "_pkg" : "")));
        ids.filter((id) => id.startsWith("camera.") && !brukt.has(id) && !LAV_OPPLOSNING.test(id)).sort().forEach((id) => {
          const k = this._berik({ plain: id }, false);
          const d = k.dev + (k.pkg ? "_pkg" : "");
          if (enheter.has(d)) return;
          enheter.add(d);
          ut.push(k);
        });
      }
    }
    const sett = new Set();
    ut = ut.filter((k) => (sett.has(k.id) ? false : sett.add(k.id)));
    this._kamCache = { n: noekkel, v: ut };
    this._kamKart = new Map(ut.map((k) => [k.id, k]));
    return ut;
  }

  _st(id) {
    return id && this._hass ? this._hass.states[id] : null;
  }
  _bildeUrl(k) {
    const st = this._st(k.snap || k.plain);
    if (!st || st.state === "unavailable") return null;
    const p = st.attributes && st.attributes.entity_picture;
    if (!p) return null;
    const url = this._hass.hassUrl ? this._hass.hassUrl(p) : p;
    if (/^data:/.test(url) || !this._tikk) return url;
    return url + (url.includes("?") ? "&" : "?") + "ki=" + this._tikk;
  }
  /** Hva kameraet ser nå: person/car/animal/package, motion eller null. */
  _aktiv(k) {
    for (const o of ["person", "car", "animal", "package"]) {
      const s = this._st(k.det && k.det[o]);
      if (s && s.state === "on") return o;
    }
    const m = this._st(k.motion);
    return m && m.state === "on" ? "motion" : null;
  }
  _modell(k) {
    if (k.meta) return k.meta;
    const st = this._st(k.plain), at = (st && st.attributes) || {};
    if (at.model_name) return at.model_name;
    const h = this._hass, ent = h && h.entities && h.entities[k.plain], dev = ent && h.devices && h.devices[ent.device_id];
    return (dev && (dev.model || dev.name)) || at.brand || "";
  }
  _aktivSignatur() {
    return this._kameraer().map((k) => this._aktiv(k) || "").join(",");
  }
  _sirene() {
    const s = this._config.sirene;
    if (s === false) return null;
    if (s) return s;
    return Object.keys((this._hass && this._hass.states) || {}).find((id) => id.startsWith("siren.")) || null;
  }
  /** Opptakskapasitet: sensor.*_recording_capacity (sek) → «7 d». */
  _lagring() {
    const c = this._config.lagring;
    const dager = (id) => {
      const s = this._st(id);
      const v = s ? parseFloat(s.state) : NaN;
      if (isNaN(v)) return "–";
      const u = (s.attributes || {}).unit_of_measurement;
      return `${Math.round((u === "d" ? v * 86400 : u === "h" ? v * 3600 : v) / 86400)} d`;
    };
    if (c) return /\./.test(c) && this._st(c) ? dager(c) : String(c);
    const id = Object.keys((this._hass && this._hass.states) || {}).find((x) => /^sensor\..*_recording_capacity$/.test(x));
    return id ? dager(id) : "–";
  }
  /** Andre camera.* for samme enhet (høy/middels/lav oppløsning …) – kandidater til stillbilde-entitet */
  _soesken(id) {
    const h = this._hass, R = (h && h.entities) || {}, dv = R[id] && R[id].device_id, d0 = enhetAv(id.split(".")[1]);
    return Object.keys(h.states).filter((x) => x.startsWith("camera.") && x !== id && !/_package(_camera)?$/.test(x)
      && (dv ? R[x] && R[x].device_id === dv : enhetAv(x.split(".")[1]) === d0));
  }
  _fnavn(id) {
    const s = this._st(id);
    return String((s && s.attributes && s.attributes.friendly_name) || id);
  }

  _erTilgjengelig(id) {
    if (id === "hendelser") return this._kilde === "frigate" && this._config.show_events !== false;
    if (id === "alle") return this._kilde === "vanlig";
    if (id === "logg") return this._alleLogg().length > 0;
    if (id === "deteksjon") return this._kilde === "vanlig" && this._harDeteksjon();
    const k = this._kameraer().find((x) => x.id === id);
    if (!k) return false;
    return this._kilde === "frigate" ? k.harFrigate : k.harVanlig;
  }

  _harDeteksjon() {
    if (this._config.show_detections === false) return false;
    return this._kameraer().some((k) => k.harVanlig && (k.motion || Object.keys(k.det).length));
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
    this._aktivSig = this._aktivSignatur();
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
      const panel = document.createElement("div");
      panel.className = "loggpanel";
      panel.innerHTML = `<div class="loggtittel"><span class="pik"><ha-icon icon="mdi:history"></ha-icon></span>
        <span class="loggnavn">Aktivitet</span><span class="loggunder">siste ${esc(this._config.logbook_hours || 24)} timer</span></div>`;
      panel.appendChild(el);
      vert.appendChild(panel);
    }
  }

  /**
   * Personvernbryter, bevegelse, siste bevegelse og kamerakontrollene (lys, snakk, sirene, bilde).
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
    let pv = s(k.privacy);
    const o = this._optPersonvern;
    if (o && pv && o.id === k.privacy) {
      if (o.state === pv.state || Date.now() - o.t > 5000) this._optPersonvern = null;
      else pv = { ...pv, state: o.state };
    }
    const bev = s(k.motion);
    const sist = s(k.last_motion);
    const lys = s(k.lys);
    const snakkId = k.snakk || null;
    const snakk = s(snakkId);
    const sireneId = this._sirene();
    const sirene = s(sireneId);
    const hva = this._aktiv(k);

    const sign = JSON.stringify([
      k.id,
      pv ? pv.state : null,
      bev ? bev.state : null,
      sist ? sist.state : null,
      lys ? lys.state : null,
      snakk ? snakk.state : null,
      sirene ? sirene.state : null,
      hva,
    ]);
    if (sign === this._detaljSignatur) return;
    this._detaljSignatur = sign;

    const fliser = [];
    const flis = (kl, attr, ikon, navn, under) => `
        <button type="button" class="flis ${kl}" ${attr}>
          <span class="flis-ikon"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
          <span class="flis-tekst">
            <span class="flis-navn">${esc(navn)}</span>
            <span class="flis-under">${esc(under)}</span>
          </span>
        </button>`;

    if (pv) {
      // Med privacy_invert betyr "on" at kameraet filmer, ikke at det er avslått
      const invertert = this._config.privacy_invert !== false;
      const skjult = (pv.state === "on") !== invertert;
      fliser.push(flis(skjult ? "varsel" : "", `data-handling="personvern" data-entity="${esc(k.privacy)}"`,
        skjult ? "mdi:eye-off" : "mdi:eye", "Personvern", skjult ? "Kamera av" : "Kamera på"));
    }

    if (bev || hva) {
      const på = !!hva;
      const o2 = hva && hva !== "motion" ? OBJ[hva] : null;
      fliser.push(flis(på ? "aktiv" : "", `data-handling="mer-info" data-entity="${esc(o2 ? k.det[hva] : k.motion)}"`,
        o2 ? o2[1] : "mdi:motion-sensor", o2 ? o2[0] : "Bevegelse", på ? (o2 ? "Oppdaget nå" : "Registrerer nå") : "Stille"));
    }

    if (sist) {
      fliser.push(flis("", `data-handling="mer-info" data-entity="${esc(k.last_motion)}"`,
        "mdi:history", "Siste bevegelse", siden(sist.state)));
    }

    if (lys) {
      const på = lys.state === "on";
      fliser.push(flis(på ? "aktiv" : "", `data-handling="veksle" data-entity="${esc(k.lys)}"`,
        på ? "mdi:flashlight" : "mdi:flashlight-off", "Lys", på ? "På" : "Av"));
    }

    if (snakk && !snakkId.startsWith("camera.")) {
      const på = snakk.state === "on";
      fliser.push(flis(på ? "aktiv" : "", `data-handling="veksle" data-entity="${esc(snakkId)}"`,
        på ? "mdi:microphone" : "mdi:microphone-outline", "Snakk", på ? "På" : "Av"));
    }

    if (sirene && k.harVanlig) {
      const på = sirene.state === "on";
      fliser.push(flis(på ? "varsel" : "", `data-handling="veksle" data-entity="${esc(sireneId)}"`,
        "mdi:alarm-light", "Sirene", på ? "Går nå" : "Av"));
    }

    if (k.plain && this._kilde === "vanlig") {
      fliser.push(flis("", `data-handling="bilde" data-verdi="${esc(k.plain)}"`,
        "mdi:camera-iris", "Ta bilde", "Lagres som fil"));
    }

    vert.innerHTML = fliser.length
      ? `<div class="fliser">${fliser.join("")}</div>`
      : "";
  }

  _tegnPiller() {
    const tittel = this._config.title === undefined ? "Kamera" : this._config.title;
    const trad = this._rot.querySelector("#tittelrad");
    const vanlige = this._kameraer().filter((k) => k.harVanlig);
    if (tittel) {
      const antall = this._kameraer().filter((k) =>
        this._kilde === "frigate" ? k.harFrigate : k.harVanlig
      ).length;
      // Ikonet blir menyknapp i Alle-visningen, ellers bare et ikon
      const kanBytte =
        this._valgt === "alle" &&
        this._config.show_layout_switcher !== false &&
        vanlige.length > 1;

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
            ${this._config.show_customize !== false ? `<button type="button" class="menyvalg" data-handling="tilpass">
              <ha-icon icon="mdi:tune-variant"></ha-icon><span>Tilpass kameraer …</span></button>` : ""}
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
          class="${this._kilde === "vanlig" ? "aktiv" : ""}"><ha-icon icon="mdi:video-outline"></ha-icon>Direkte</button>
        <button type="button" data-handling="kilde" data-verdi="frigate"
          class="${this._kilde === "frigate" ? "aktiv" : ""}"><ha-icon icon="mdi:history"></ha-icon>Frigate</button>
      </div>`;
    /* Direkte/Frigate: glidende pille som kan dras (bevegelsen fra Liquid Glass, uten glass). */
    if (window.KI && window.KI.pillefaner) window.KI.pillefaner(this, { rad: "#kilde .pille", knapp: "#kilde .pille button", aktiv: "aktiv" });

    const faner = [];
    if (this._kilde === "frigate" && this._config.show_events !== false) {
      faner.push({ id: "hendelser", navn: "Hendelser", ikon: "mdi:motion-play" });
    }
    if (this._kilde === "vanlig") {
      faner.push({ id: "alle", navn: "Alle", ikon: "mdi:view-grid-outline" });
      if (this._erTilgjengelig("deteksjon")) faner.push({ id: "deteksjon", navn: "Hendelser", ikon: "mdi:motion-play-outline" });
    }
    this._iRekkefolge(this._kameraer(), false).forEach((k) => {
      if (this._erTilgjengelig(k.id)) {
        faner.push({ id: k.id, navn: k.name, ikon: k.icon || "mdi:cctv", prikk: !!this._aktiv(k) });
      }
    });
    if (this._erTilgjengelig("logg")) {
      faner.push({ id: "logg", navn: "Logg", ikon: "mdi:format-list-bulleted" });
    }

    const piller = this._rot.querySelector("#piller");
    const rull = piller.scrollLeft;
    piller.innerHTML = faner
      .map(
        (f) => `
        <button type="button" class="fane ${this._valgt === f.id ? "aktiv" : ""}"
          data-handling="kamera" data-verdi="${esc(f.id)}">
          <ha-icon icon="${esc(f.ikon)}"></ha-icon>
          <span>${esc(f.navn)}</span>${f.prikk ? '<span class="prikk"></span>' : ""}
        </button>`
      )
      .join("");
    piller.scrollLeft = rull;
  }

  async _visInnhold() {
    const vert = this._rot.querySelector("#innhold");
    const alle = this._kilde === "vanlig" && this._valgt === "alle";
    const levende = alle || (this._kilde === "vanlig" && this._valgt === "deteksjon");
    const noekkel = `${this._kilde}|${this._valgt}|${this._oppsett}|${
      this._bred ? "bred" : "smal"
    }${levende ? "|" + this._alleSignatur() : ""}`;

    if (this._montertNoekkel === noekkel && this._montert) return;
    this._montertNoekkel = noekkel;

    // Alle og Hendelser (Direkte) følger brukervalgene og bygges derfor på nytt
    let el = levende ? null : this._cache.get(noekkel);
    if (!el) {
      el = await this._byggInnhold();
      if (this._montertNoekkel !== noekkel) return; // et nyere valg kom i mellomtiden
      if (el && !levende) this._cache.set(noekkel, el);
    }

    vert.innerHTML = "";
    this._montert = el || null;
    this._alleEl = alle ? el : null;
    if (el) {
      el.hass = this._hass;
      vert.appendChild(el);
      if (el._etterMontering) el._etterMontering();
    } else {
      vert.innerHTML = `<div class="tomt">Ingen kamerakilde er satt opp for dette valget.</div>`;
    }
  }

  _alleSignatur() {
    const kams = this._iRekkefolge(this._kameraer().filter((k) => k.harVanlig), true);
    return [kams.map((k) => k.id + ">" + (k.snap || "")).join(","), this._feat || "", this._side || 0, this._kolonnetall(kams.length)].join("|");
  }

  _visAlle() {
    this._montertNoekkel = null;
    this._visInnhold();
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
      const med = this._iRekkefolge(this._kameraer().filter((k) => k.harVanlig), true);
      if (!med.length) return this._tomAlle();
      return this._byggAlle(med);
    }
    if (this._valgt === "deteksjon") return this._lagDeteksjon();
    const k = this._kameraer().find((x) => x.id === this._valgt);
    if (!k || !k.harVanlig) return null;
    return this._lagKort(stromKort(k.plain, true));
  }

  _tpKnapp() {
    return this._config.show_customize === false ? "" : `<button type="button" class="tp-knapp" data-handling="tilpass">
      <ha-icon icon="mdi:tune-variant"></ha-icon><span>Tilpass kameraer</span></button>`;
  }

  _tomAlle() {
    const vert = document.createElement("div");
    vert.className = "alle";
    vert.innerHTML = `<div class="tomt">Ingen kameraer valgt.</div>${this._tpKnapp()}`;
    return vert;
  }

  /** Alle-visningen: rutenettet i valgt oppsett + «Tilpass kameraer». Bildene holdes oppdatert av _patch. */
  _byggAlle(kameraer) {
    const preset = OPPSETT[this._oppsett] || OPPSETT.rutenett;
    const vert = document.createElement("div");
    vert.className = "alle";
    vert.appendChild(preset.spesial ? this._byggSpesial(kameraer) : this._byggRutenett(kameraer));
    if (this._tpKnapp()) vert.insertAdjacentHTML("beforeend", this._tpKnapp());
    Object.defineProperty(vert, "hass", {
      set: () => { this._patch(vert); this._monterStrommer(vert); },
      configurable: true,
    });
    vert._etterMontering = () => {
      const f = vert.querySelector("[data-fokus]");
      if (f) {
        f.scrollLeft = (this._fi || 0) * (f.clientWidth || 0);
        f.addEventListener("scroll", () => {
          clearTimeout(this._fokusT);
          this._fokusT = setTimeout(() => {
            const i = Math.round(f.scrollLeft / (f.clientWidth || 1));
            if (i !== this._fi && i >= 0 && i < f.children.length) { this._fi = i; this._fokusVis(vert); this._haptikk("selection"); }
          }, 60);
        }, { passive: true });
      }
    };
    return vert;
  }

  /** Én kameraflis i ki-stil. sz: lg | md | sm. handling: kamera (åpne) | feat (løft fram i Oversikt). */
  _celleHTML(k, o = {}) {
    const sz = o.sz || "md";
    const handling = o.handling || "kamera";
    return `<div class="celle sz-${sz}" role="button" tabindex="0" data-handling="${handling}" data-verdi="${esc(k.id)}"
        data-entity="${esc(k.plain)}" data-cam="${esc(k.id)}" style="${o.style || ""}" aria-label="${esc(k.name)}">
      <span class="c-tom"><ha-icon icon="${esc(k.icon)}"></ha-icon><span>${esc(k.name)}</span></span>
      <img class="c-img" alt="" draggable="false">
      ${o.strom ? `<div class="c-strom${o.live ? " pa" : ""}" data-strom="${esc(k.plain)}"></div>` : ""}
      <span class="c-skygge"></span>
      <span class="c-topp"><span class="c-live">LIVE</span><span class="c-bev"><ha-icon icon="mdi:motion-sensor"></ha-icon><span class="c-bev-t"></span></span></span>
      ${sz === "sm" ? "" : `<button type="button" class="c-apne" data-handling="kamera" data-verdi="${esc(k.id)}" aria-label="Åpne ${esc(k.name)}"><ha-icon icon="mdi:arrow-expand"></ha-icon></button>`}
      <span class="c-bunn"><span class="c-navn">${esc(k.name)}</span>${sz === "lg" ? '<span class="c-meta"></span>' : ""}</span>
    </div>`;
  }

  _lagCelle(k, o) {
    const t = document.createElement("div");
    t.innerHTML = this._celleHTML(k, o);
    return t.firstElementChild;
  }

  /** Oppdaterer bilder, LIVE-merker og deteksjon i flisene uten å bygge dem på nytt. */
  _patch(rot) {
    if (!rot || !this._hass) return;
    this._kameraer();
    rot.querySelectorAll("[data-cam]").forEach((c) => {
      const k = this._kamKart && this._kamKart.get(c.dataset.cam);
      if (!k) return;
      const st = this._st(k.plain);
      const borte = !st || st.state === "unavailable";
      const src = this._bildeUrl(k);
      const img = c.querySelector(".c-img");
      if (img && src && img.getAttribute("src") !== src) img.setAttribute("src", src);
      c.classList.toggle("tom", !src);
      c.classList.toggle("borte", borte);
      const hva = borte ? null : this._aktiv(k);
      c.classList.toggle("bevegelse", !!hva);
      const live = c.querySelector(".c-live");
      const lt = borte ? "AV" : st.state === "recording" ? "OPPTAK" : "LIVE";
      if (live && live.textContent !== lt) live.textContent = lt;
      const bi = c.querySelector(".c-bev ha-icon"), bt = c.querySelector(".c-bev-t");
      const ob = OBJ[hva || "motion"];
      if (bi && bi.getAttribute("icon") !== ob[1]) bi.setAttribute("icon", ob[1]);
      if (bt && bt.textContent !== ob[0]) bt.textContent = ob[0];
      const meta = c.querySelector(".c-meta");
      if (meta) {
        const m = borte ? "Utilgjengelig" : hva ? "Bevegelse nå" : this._modell(k);
        if (meta.textContent !== m) meta.textContent = m;
      }
    });
  }

  /** Direktestrøm (ha-camera-stream) i flisene som har en aktiv strømplass. Elementene gjenbrukes. */
  _monterStrommer(rot) {
    if (!rot || !this._hass) return;
    const kan = this._config.direkte !== false && !!customElements.get("ha-camera-stream");
    rot.querySelectorAll(".c-strom").forEach((vert) => {
      const id = vert.dataset.strom, st = this._st(id);
      if (!kan || !vert.classList.contains("pa") || !st || st.state === "unavailable") {
        if (vert.firstChild) vert.innerHTML = "";
        return;
      }
      let el = this._strommer.get(id);
      if (!el) {
        el = document.createElement("ha-camera-stream");
        el.muted = true; el.controls = false; el.allowExoPlayer = true;
        el.style.cssText = "display:block;width:100%;height:100%";
        this._strommer.set(id, el);
      }
      if (el.parentNode !== vert) { vert.innerHTML = ""; vert.appendChild(el); }
      el.hass = this._hass;
      if (el.stateObj !== st) el.stateObj = st;
    });
  }

  _navKnapp(handling, d, ikon, av) {
    return `<button type="button" class="navk" data-handling="${handling}" data-verdi="${d}" ${av ? "disabled" : ""} aria-label="${d < 0 ? "Forrige" : "Neste"}"><ha-icon icon="${ikon}"></ha-icon></button>`;
  }

  /** Oppsettene fra kd-kamera-card: masonry, oversikt, fokus, 2×2 og 3 kolonner. */
  _byggSpesial(kameraer) {
    const L = this._oppsett, n = kameraer.length;
    const vert = document.createElement("div");
    vert.className = "spesial sp-" + L.replace(/[^a-z0-9]/g, "");
    const cel = (k, o) => this._celleHTML(k, o);
    let html = "";
    if (L === "masonry") {
      const kol = (c) => `<div class="mkol">${kameraer.map((k, i) => [k, i]).filter(([, i]) => i % 2 === c)
        .map(([k, i]) => cel(k, { sz: "md", style: `aspect-ratio:${i % 4 === 0 || i % 4 === 3 ? "3/4" : "4/3"}` })).join("")}</div>`;
      html = `<div class="masonry">${kol(0)}${kol(1)}</div>`;
    } else if (L === "3kol") {
      html = `<div class="g3">${kameraer.map((k) => cel(k, { sz: "sm", style: "aspect-ratio:16/9" })).join("")}</div>`;
    } else if (L === "2x2") {
      const sider = Math.ceil(n / 4);
      const pg = Math.min(this._side || 0, sider - 1);
      this._side = pg;
      html = `<div class="g2">${kameraer.slice(pg * 4, pg * 4 + 4).map((k) => cel(k, { sz: "md", style: "aspect-ratio:16/10" })).join("")}</div>
        ${sider > 1 ? `<div class="navrad">${this._navKnapp("side", -1, "mdi:chevron-left", pg === 0)}
          <div class="navmid"><span class="dotter">${Array.from({ length: sider }, (_, i) => `<span class="dot${i === pg ? " pa" : ""}"></span>`).join("")}</span>
          <span class="navtekst">${pg * 4 + 1}–${Math.min(n, pg * 4 + 4)} av ${n}</span></div>
          ${this._navKnapp("side", 1, "mdi:chevron-right", pg >= sider - 1)}</div>` : ""}`;
    } else if (L === "oversikt") {
      const F = kameraer.find((k) => k.id === this._feat) || kameraer[0];
      const rest = kameraer.filter((k) => k !== F);
      html = `${cel(F, { sz: "lg", style: "aspect-ratio:16/10", strom: true, live: true })}
        ${rest.length ? `<div class="gsm" style="grid-template-columns:repeat(${rest.length > 4 ? 4 : 3},minmax(0,1fr))">${rest.map((k) => cel(k, { sz: "sm", handling: "feat", style: "aspect-ratio:16/10" })).join("")}</div>` : ""}`;
    } else if (L === "fokus") {
      const fi = Math.min(this._fi || 0, n - 1);
      this._fi = fi;
      html = `<div class="fokus" data-fokus="1">${kameraer.map((k, i) => `<div class="fok-side">${cel(k, { sz: "lg", style: "aspect-ratio:3/4", strom: true, live: i === fi })}</div>`).join("")}</div>
        <div class="navrad">${this._navKnapp("fokus", -1, "mdi:chevron-left", fi === 0)}
          <div class="navmid"><span class="navnavn">${esc(kameraer[fi].name)}</span>
          <span class="dotter">${kameraer.map((k, i) => `<button type="button" class="dot${i === fi ? " pa" : ""}${this._aktiv(k) ? " akt" : ""}" data-handling="fokus" data-verdi="=${i}" aria-label="${esc(k.name)}"></button>`).join("")}</span></div>
          ${this._navKnapp("fokus", 1, "mdi:chevron-right", fi >= n - 1)}</div>`;
      vert._kameraer = kameraer;
    }
    vert.innerHTML = html;
    return vert;
  }

  _fokusGaa(d) {
    const rot = this._alleEl, f = rot && rot.querySelector("[data-fokus]");
    if (!f) return;
    const n = f.children.length;
    const i = Math.max(0, Math.min(n - 1, String(d)[0] === "=" ? Number(String(d).slice(1)) : (this._fi || 0) + Number(d)));
    if (i === this._fi) return;
    this._fi = i;
    try { f.scrollTo({ left: i * f.clientWidth, behavior: "smooth" }); } catch (e) { f.scrollLeft = i * f.clientWidth; }
    this._fokusVis(rot);
    this._haptikk("selection");
  }

  /** Fokus: flytter strømmen, prikkene og navnet til kameraet som vises. */
  _fokusVis(rot) {
    const sp = rot.querySelector(".sp-fokus");
    const kams = (sp && sp._kameraer) || [];
    const i = this._fi || 0;
    rot.querySelectorAll(".fok-side .c-strom").forEach((s, j) => s.classList.toggle("pa", j === i));
    rot.querySelectorAll(".dotter .dot").forEach((d, j) => d.classList.toggle("pa", j === i));
    const nn = rot.querySelector(".navnavn");
    if (nn && kams[i]) nn.textContent = kams[i].name;
    const kn = rot.querySelectorAll(".navrad .navk");
    if (kn[0]) kn[0].disabled = i === 0;
    if (kn[1]) kn[1].disabled = i >= kams.length - 1;
    this._monterStrommer(rot);
  }

  /**
   * Rutenett av stillbilder for de klassiske oppsettene (mosaikk, hovedkamera, rutenett, liste).
   * Egne fliser i stedet for nestede kort, slik at cellene kan spenne over flere rader og
   * bildene fylle dem helt.
   */
  _byggRutenett(kameraer) {
    const preset = OPPSETT[this._oppsett] || OPPSETT.rutenett;
    const fyll = !!this._bred && this._config.fill_screen !== false;
    // Lufta rundt kortet spiser av høyden, så den legges til avstanden vi trekker fra
    // Bare loddrett luft spiser av høyden. Er verdien en CSS-streng med flere ledd,
    // er første ledd den loddrette – «0 14px» gir 0.
    const luft = parseFloat(String(this._config.luft ?? 0)) || 0;
    const avstand = (this._config.fill_offset || 210) + luft * 2;

    const vert = document.createElement("div");
    vert.className = "rutenett" + (fyll ? " fyll" : "");
    const kolonner = preset.adaptiv
      ? this._kolonnetall(kameraer.length)
      : preset.kolonner.split(" ").length;
    vert.style.gridTemplateColumns = preset.adaptiv
      ? `repeat(${kolonner}, minmax(0, 1fr))`
      : preset.kolonner;
    vert.style.gap = this._gap();

    if (fyll && preset.auto) {
      const rader = Math.ceil(kameraer.length / kolonner);
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

    const hovedFelt = this._oppsett === "hoved";
    kameraer.forEach((k, i) => {
      const stor = this._oppsett === "liste" || (hovedFelt && i === 0) || (!preset.auto && i >= (preset.omrader.join(" ").match(/[a-p]/g) || []).filter((x, j, a) => a.indexOf(x) === j).length);
      const celle = this._lagCelle(k, { sz: stor ? "lg" : "md" });
      if (!preset.auto) celle.style.gridArea = FELTNAVN[i];
      if (preset.celleRatio && !fyll) celle.style.aspectRatio = preset.celleRatio;
      if (!preset.celleRatio && !fyll) celle.style.minHeight = "90px";
      vert.appendChild(celle);
    });
    return vert;
  }

  /**
   * Hendelser (Direkte): dagens deteksjoner fra sensorhistorikken (UniFi Protect / Frigate-sensorer),
   * med tall øverst og filter per objekt. Trykk åpner sensoren.
   */
  _lagDeteksjon() {
    const kort = this;
    const vert = document.createElement("div");
    vert.className = "deteksjon";
    const kams = this._iRekkefolge(this._kameraer().filter((k) => k.harVanlig), false);
    const par = [];
    kams.forEach((k) => {
      const d = Object.entries(k.det);
      if (d.length) d.forEach(([o, id]) => par.push([k, o, id]));
      else if (k.motion) par.push([k, "motion", k.motion]);
    });
    let filter = "all", data = null, sig = "", henter = false;
    const typer = ["all", ...Object.keys(OBJ).filter((o) => par.some((p) => p[1] === o))];

    const tegn = () => {
      const alle = data || [];
      const liste = alle.filter((x) => filter === "all" || x.obj === filter);
      const tall = [[alle.length, "hendelser i dag"], [alle.filter((x) => x.obj === "person").length, "personer"], [kort._lagring(), "opptak lagret"]];
      vert.innerHTML = `
        <div class="hd-tall">${tall.map(([v, t]) => `<div class="hd-stat"><span class="hd-v">${esc(v)}</span><span class="hd-k">${esc(t)}</span></div>`).join("")}</div>
        ${typer.length > 2 ? `<div class="hd-filter">${typer.map((o) => `<button type="button" class="${o === filter ? "pa" : ""}" data-filter="${o}">
          <ha-icon icon="${o === "all" ? "mdi:filter-variant" : OBJ[o][1]}"></ha-icon>${o === "all" ? "Alle" : OBJ[o][0]}</button>`).join("")}</div>` : ""}
        <div class="loggpanel"><div class="tidslinje">${data === null ? `<div class="tl-laster">Henter hendelser …</div>`
          : !liste.length ? `<div class="tl-tom">Ingen hendelser i dag.</div>`
          : liste.map((x) => `
            <button type="button" class="tl-rad ${x.live ? "aktiv" : ""}" data-handling="mer-info" data-entity="${esc(x.id)}">
              <span class="tl-ikon"><ha-icon icon="${esc(OBJ[x.obj][1])}"></ha-icon></span>
              <span class="tl-tekst">
                <span class="tl-tittel">${esc(OBJ[x.obj][0])}</span>
                <span class="tl-meta">${esc(x.kam)} · ${esc(klokke(x.t).slice(0, 5))}</span>
              </span>
              <span class="tl-tid">${x.live ? "nå" : esc(mmss(x.dur))}</span>
            </button>`).join("")}</div></div>`;
    };

    vert.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (!b || b.dataset.filter === filter) return;
      filter = b.dataset.filter;
      kort._haptikk("selection");
      tegn();
    });

    const hent = async (hass) => {
      if (henter || !par.length || !hass.callWS) { if (!par.length) { data = []; tegn(); } return; }
      henter = true;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      try {
        const r = await hass.callWS({
          type: "history/history_during_period", start_time: start.toISOString(), end_time: new Date().toISOString(),
          entity_ids: par.map((p) => p[2]), minimal_response: true, no_attributes: true, significant_changes_only: false,
        });
        const ut = [];
        for (const [k, o, id] of par) {
          let pa = null;
          const tid = (p) => p.lu != null ? p.lu * 1000 : p.lc != null ? p.lc * 1000 : new Date(p.last_updated || p.last_changed).getTime();
          for (const p of (r && r[id]) || []) {
            const s = p.s != null ? p.s : p.state, t = tid(p);
            if (s === "on" && pa == null) pa = t;
            else if (s !== "on" && pa != null) { ut.push({ id, obj: o, kam: k.name, t: pa, dur: (t - pa) / 1000, live: false }); pa = null; }
          }
          if (pa != null) ut.push({ id, obj: o, kam: k.name, t: pa, dur: (Date.now() - pa) / 1000, live: true });
        }
        data = ut.filter((x) => x.t >= start.getTime()).sort((a, b) => b.t - a.t);
      } catch (err) {
        console.warn("ki-kamera-card: klarte ikke å hente hendelser", err);
        data = data || [];
      } finally {
        henter = false;
      }
      tegn();
    };

    Object.defineProperty(vert, "hass", {
      set(hass) {
        if (!hass) return;
        const s = par.map((p) => { const x = hass.states[p[2]]; return x ? x.state + x.last_changed : "-"; }).join("|");
        if (s === sig) return;
        sig = s;
        hent(hass);
      },
      configurable: true,
    });
    tegn();
    return vert;
  }

  /* ───────────────────────── Tilpass kameraer ───────────────────────── */

  /** Alle camera.* sortert: høy oppløsning først, så navn. */
  _alleKameraIder() {
    const lav = (x) => (LAV_OPPLOSNING.test(x) ? 1 : 0);
    return Object.keys((this._hass && this._hass.states) || {}).filter((x) => x.startsWith("camera."))
      .sort((a, b) => lav(a) - lav(b) || this._fnavn(a).localeCompare(this._fnavn(b), "nb"));
  }

  _tpListe() {
    return this._iRekkefolge(this._kameraer().filter((k) => k.harVanlig), false).map((k) => k.id);
  }

  _tpChips(k) {
    const q = String(this._tpSok || "").trim().toLowerCase();
    const ids = this._tpListe();
    const valg = this._alleKameraIder().filter((id) => !q || id.toLowerCase().includes(q) || this._fnavn(id).toLowerCase().includes(q));
    if (!valg.length) return `<span class="tom">Ingen treff</span>`;
    return valg.map((id) => {
      const sel = id === k.plain, brukt = !sel && ids.includes(id);
      return `<button type="button" class="chip${sel ? " sel" : ""}${brukt ? " brukt" : ""}" data-handling="tilpass-sett" data-verdi="${esc(k.id)}" data-ny="${esc(id)}" title="${esc(id)}">
        ${brukt ? '<ha-icon icon="mdi:swap-vertical"></ha-icon>' : ""}<span class="l">${esc(this._fnavn(id))}</span></button>`;
    }).join("");
  }

  _tilpassHandling(h, el) {
    this._haptikk("selection");
    const v = el.dataset.verdi;
    const lagreListe = (l) => this._lagrePersonlig({ liste: l });
    if (h === "tilpass-ferdig") { this._tpApen = false; this._tpVelg = null; this._tegnTilpass(); return; }
    if (h === "tilpass-velg") {
      this._tpVelg = this._tpVelg === v ? null : v;
      this._tpSok = "";
      this._tegnTilpass();
      return;
    }
    if (h === "tilpass-nullstill") {
      this._nullstillPersonlig();
      this._tpVelg = null;
    } else if (h === "tilpass-oppsett") {
      this._settOppsett(v);
    } else if (h === "tilpass-vis") {
      const k = this._kameraer().find((x) => x.id === v);
      const skjul = new Set((this._personlig || {}).skjul || []);
      if (k && this._erSkjult(k)) { skjul.delete(k.id); skjul.delete(k.name); } else skjul.add(v);
      this._lagrePersonlig({ skjul: [...skjul] });
    } else if (h === "tilpass-flytt") {
      const l = this._tpListe();
      const i = l.indexOf(v), j = i + Number(el.dataset.retning);
      if (i >= 0 && j >= 0 && j < l.length) { [l[i], l[j]] = [l[j], l[i]]; lagreListe(l); }
    } else if (h === "tilpass-sett") {
      const ny = el.dataset.ny, l = this._tpListe();
      const i = l.indexOf(v), j = l.indexOf(ny);
      if (i < 0 || ny === v) return;
      if (j >= 0) l[j] = l[i]; // valgt kamera står allerede i lista → bytt plass
      l[i] = ny;
      this._tpVelg = ny;
      lagreListe(l);
    } else if (h === "tilpass-fjern") {
      lagreListe(this._tpListe().filter((x) => x !== v));
      this._tpVelg = null;
    } else if (h === "tilpass-legg") {
      const l = this._tpListe();
      if (!l.includes(v)) l.push(v);
      lagreListe(l);
    } else if (h === "tilpass-bilde") {
      const b = { ...((this._personlig || {}).bilde || {}) };
      if (!el.dataset.ny || el.dataset.ny === v) delete b[v]; else b[v] = el.dataset.ny;
      this._lagrePersonlig({ bilde: b });
    }
    if (!this._erTilgjengelig(this._valgt)) this._valgt = this._forsteTilgjengelige();
    this._montertNoekkel = null;
    this._oppdater();
    this._tegnTilpass();
  }

  /** «Tilpass kameraer»: ark over navigasjonslinja, i samme stil som «Tilpass rommet». */
  _tegnTilpass() {
    const vert = this._rot && this._rot.querySelector("#tilpass");
    if (!vert) return;
    if (!this._tpApen) { vert.innerHTML = ""; vert.style.display = "none"; return; }
    const forrige = vert.querySelector(".tp-ark");
    const rull = forrige ? forrige.scrollTop : 0;
    const kams = this._iRekkefolge(this._kameraer().filter((k) => k.harVanlig), false);
    const ids = kams.map((k) => k.id);
    const bruker = (this._hass && this._hass.user && this._hass.user.name) || "deg";
    const ico = (i) => `<ha-icon icon="${i}"></ha-icon>`;

    const rader = kams.map((k, i) => {
      const apen = this._tpVelg === k.id, skjult = this._erSkjult(k), src = this._bildeUrl(k);
      const sb = k.pkg ? [] : this._soesken(k.plain);
      const cur = k.snap || k.plain;
      const bchip = (id, label) => `<button type="button" class="chip${id === cur ? " sel" : ""}" data-handling="tilpass-bilde" data-verdi="${esc(k.id)}" data-ny="${esc(id)}" title="${esc(id)}"><span class="l">${esc(label)}</span></button>`;
      return `<div class="tp-kort${apen ? " apen" : ""}">
        <div class="row${skjult ? " hid" : ""}">
          <span class="tn">${src ? `<img src="${esc(src)}" alt="" draggable="false">` : ico(esc(k.icon))}</span>
          <button type="button" class="txt" data-handling="tilpass-velg" data-verdi="${esc(k.id)}" aria-expanded="${apen}">
            <span class="n">${esc(k.name)}</span>
            <span class="s mono">${this._st(k.plain) ? "" : "Utilgjengelig · "}${esc(k.plain)}</span>
          </button>
          <button type="button" class="rb eye" data-handling="tilpass-vis" data-verdi="${esc(k.id)}" aria-label="${skjult ? "Vis" : "Skjul"}">${ico(skjult ? "mdi:eye-off-outline" : "mdi:eye-outline")}</button>
          <button type="button" class="rb" data-handling="tilpass-flytt" data-verdi="${esc(k.id)}" data-retning="-1" ${i === 0 ? "disabled" : ""} aria-label="Flytt opp">${ico("mdi:arrow-up")}</button>
          <button type="button" class="rb" data-handling="tilpass-flytt" data-verdi="${esc(k.id)}" data-retning="1" ${i === kams.length - 1 ? "disabled" : ""} aria-label="Flytt ned">${ico("mdi:arrow-down")}</button>
        </div>
        ${apen ? `<div class="mer">
          ${sb.length ? `<div class="sh">${ico("mdi:image-multiple-outline")}<span class="t">Stillbilde i rutenettet</span></div>
            <div class="chips">${bchip(k.plain, "Samme" + (kvalitet(k.plain) ? " · " + kvalitet(k.plain) : ""))}${sb.map((id) => bchip(id, kvalitet(id) || this._fnavn(id))).join("")}</div>` : ""}
          <div class="sh">${ico("mdi:swap-horizontal")}<span class="t">Bytt kamera</span></div>
          <input class="sok" data-tp-sok placeholder="Søk etter camera.*" value="${esc(this._tpSok || "")}">
          <div class="chips scroll" data-tp-chips>${this._tpChips(k)}</div>
          <button type="button" class="fjern" data-handling="tilpass-fjern" data-verdi="${esc(k.id)}">${ico("mdi:minus-circle-outline")}Fjern fra lista</button>
        </div>` : ""}
      </div>`;
    }).join("");

    const leggTil = this._alleKameraIder().filter((id) => !ids.includes(id));
    vert.style.display = "";
    vert.innerHTML = `
      <div class="tp-bakgrunn" data-handling="tilpass-ferdig"></div>
      <div class="tp-ark" role="dialog" aria-label="Tilpass kameraer">
        <div class="tp-hode">
          <span class="ic">${ico("mdi:tune-variant")}</span>
          <span class="txt"><span class="n">Tilpass kameraer</span><span class="s">For ${esc(bruker)} · følger brukeren</span></span>
          <button type="button" class="rb" data-handling="tilpass-ferdig" aria-label="Lukk">${ico("mdi:close")}</button>
        </div>
        <div class="panel">
          <div class="ph"><span class="t">Visning</span><span class="alt">${esc((OPPSETT[this._oppsett] || {}).navn || "")}</span></div>
          <div class="tp-oppsett">${Object.entries(OPPSETT).map(([id, o]) => `
            <button type="button" class="${this._oppsett === id ? "sel" : ""}" data-handling="tilpass-oppsett" data-verdi="${id}">
              ${ico(esc(o.ikon))}<span>${esc(o.navn)}</span></button>`).join("")}</div>
        </div>
        <div class="panel">
          <div class="ph"><span class="t">Kameraer som vises</span><span class="alt">${kams.filter((k) => !this._erSkjult(k)).length} av ${kams.length}</span></div>
          <div class="rows">${rader || `<div class="tom">Ingen kameraer valgt</div>`}</div>
          <div class="hint">Trykk på navnet for å bytte kamera eller velge stillbilde.</div>
        </div>
        ${leggTil.length ? `<div class="panel">
          <div class="ph"><span class="t">Legg til kamera</span><span class="alt">${leggTil.length}</span></div>
          <div class="rows">${leggTil.map((id) => `
            <button type="button" class="row add" data-handling="tilpass-legg" data-verdi="${esc(id)}">
              <span class="ic sm">${ico("mdi:cctv")}</span>
              <span class="txt"><span class="n">${esc(this._fnavn(id))}</span><span class="s mono">${esc(id)}</span></span>
              <span class="rb pluss">${ico("mdi:plus")}</span>
            </button>`).join("")}</div>
        </div>` : ""}
        <div class="tp-bar">
          <button type="button" class="b" data-handling="tilpass-nullstill" ${this._harEgetOppsett ? "" : "disabled"}>Nullstill</button>
          <button type="button" class="b ok" data-handling="tilpass-ferdig">Ferdig</button>
        </div>
      </div>`;
    const ark = vert.querySelector(".tp-ark");
    if (ark && rull) ark.scrollTop = rull;
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
            <span class="tl-ikon">
              <ha-icon icon="${esc(
                linjeIkon(hass, l.entity_id, l.state, l.icon)
              )}"></ha-icon>
            </span>
            <span class="tl-tekst">
              <span class="tl-tittel">${esc(navn)}</span>
              <span class="tl-meta">${esc(tilstandTekst(hass, l.entity_id, l.state))}${
                sti.length ? ` · ${sti.map(esc).join(" ▸ ")}` : ""}</span>
            </span>
            <span class="tl-tid">${esc(klokke(l.when))}</span>
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
  /* Valget luft gir marg rundt hele kortet. I en panelvisning gir Home Assistant ingen
     padding, og da lå kameraene klemt helt ut i skjermkanten. */
  .rot {
    background: transparent; border: none; box-shadow: none;
    padding: var(--ki-kam-luft, 0); display: block;
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
    margin: 0; flex: 1; min-width: 0;
    font-size: 22px; font-weight: 500;
    color: var(--gray1000, var(--primary-text-color));
  }
  .tittel-antall {
    font-size: 14px; font-weight: 500; opacity: .7;
    color: var(--gray1000, var(--primary-text-color));
    white-space: nowrap;
  }

  /* ---------- kildebryter ---------- */
  /* Kildebryteren er den samme brede bryteren som Vekking/Søvn i søvnpopupen:
     --gray200 bak, 75 px hjørner, valgt halvdel i --active-small. */
  .kilde { margin-bottom: 12px; }
  .pille {
    display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
    gap: 4px; padding: 4px; border-radius: 75px;
    background: var(--gray200, var(--card-background-color));
    box-sizing: border-box;
  }
  .pille button {
    background: transparent; text-align: center;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .6; border-radius: 75px; padding: 9px 0;
    font-size: 15px; font-weight: 500; white-space: nowrap;
    display: flex; align-items: center; justify-content: center; gap: 7px; --mdc-icon-size: 18px;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--black, #000); opacity: 1;
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
    font-size: 14px; font-weight: 500;
    opacity: .6;
    --mdc-icon-size: 18px;
    transition: background .18s ease, opacity .18s ease, color .18s ease;
  }
  .fane.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--black, #000);
    opacity: 1;
  }
  .fane .prikk { width: 7px; height: 7px; border-radius: 50%; background: var(--red, #e5484d); flex: none; margin-left: -1px; }
  .fane:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  /* ---------- oppsettsmeny ---------- */
  .tittelrad { position: relative; }
  .tittel-ikon.klikkbar {
    cursor: pointer;
    width: auto; min-width: 38px;
    padding: 0 6px 0 8px;
    gap: var(--ki-kam-gap, 6px);
    border-radius: 19px;
    transition: background .18s ease;
  }
  .tittel-ikon.klikkbar:hover { background: var(--gray400, rgba(128,128,128,.25)); }
  .tittel-ikon.apen {
    background: var(--active-big, var(--primary-color));
    color: var(--black, #000);
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
    border: 1px solid rgba(250, 251, 252, .1);
    display: flex; flex-direction: column; gap: 2px;
  }
  .menyvalg {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 13px;
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 14px; font-weight: 500;
    text-align: left;
    --mdc-icon-size: 18px;
  }
  .menyvalg span { flex: 1; }
  .menyvalg:hover { background: rgba(128, 128, 128, .18); }
  .menyvalg.aktiv { background: var(--gray100, rgba(128,128,128,.18)); }
  .menyvalg .hake { --mdc-icon-size: 16px; }

  /* ---------- Tilpass kameraer ----------
     Arket ligger over navigasjonslinja (--kd-dokk-h), i samme stil som «Tilpass rommet»:
     --gray000-ark, --gray200-paneler, --gray100-rader, 52 px ikonsirkler, 14 px/500. */
  .tilpass { display: block; }
  .tp-bakgrunn { position: fixed; inset: 0; z-index: 29; background: rgba(0, 0, 0, .45); }
  .tp-ark {
    position: fixed; z-index: 30; left: 12px; right: 12px; max-width: 560px; margin: 0 auto;
    bottom: calc(var(--kd-dokk-h, 90px) + 6px);
    max-height: calc(100dvh - var(--kd-dokk-h, 90px) - 24px - env(safe-area-inset-top, 0px));
    overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
    display: flex; flex-direction: column; gap: 8px; box-sizing: border-box;
    padding: 12px 12px 0; border-radius: 28px;
    background: var(--gray000, #141416); border: 1px solid rgba(250, 251, 252, .1); box-shadow: none;
    color: var(--gray1000, var(--primary-text-color)); user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .tp-ark::-webkit-scrollbar { display: none; }
  .tp-ark *, .tp-ark *::before, .tp-ark *::after { box-sizing: border-box; min-width: 0; }
  .tp-ark button { background: none; color: inherit; padding: 0; margin: 0; }
  .tp-ark ha-icon { display: inline-flex; --mdc-icon-size: 22px; }
  .tp-ark .ic { width: 52px; height: 52px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center;
    background: rgba(250, 251, 252, .1); border: 1px solid rgba(250, 251, 252, .1); color: var(--gray1000); }
  .tp-ark .ic ha-icon { --mdc-icon-size: 26px; }
  .tp-ark .ic.sm { width: 40px; height: 40px; } .tp-ark .ic.sm ha-icon { --mdc-icon-size: 20px; }
  .tp-ark .txt { flex: 1; display: flex; flex-direction: column; gap: 2px; text-align: left; }
  .tp-ark .n { font-size: 14px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tp-ark .s { font-size: 14px; font-weight: 500; line-height: 1.25; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tp-ark .s.mono { font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; opacity: .55; }
  .tp-hode { display: flex; align-items: center; gap: 12px; padding: 2px 2px 4px; }
  .tp-hode .n { font-size: 16px; }
  .tp-ark .panel { border-radius: 24px; background: var(--gray200, #262629); padding: 4px 12px 12px; display: flex; flex-direction: column; flex: none; }
  .tp-ark .ph { display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 0 2px; }
  .tp-ark .ph .t { flex: 1; font-size: 16px; font-weight: 500; }
  .tp-ark .ph .alt { font-size: 14px; font-weight: 500; color: var(--gray600, var(--gray800)); white-space: nowrap; }
  .tp-ark .hint { font-size: 13px; font-weight: 500; opacity: .5; padding: 10px 4px 0; }
  .tp-ark .tom { font-size: 14px; font-weight: 500; opacity: .5; padding: 6px 4px; }
  .tp-oppsett { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .tp-oppsett button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 66px;
    padding: 0 4px; border-radius: 22px; background: var(--gray100, #1c1c1f); font-size: 13px; font-weight: 500; white-space: nowrap; }
  .tp-oppsett button span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .tp-oppsett button.sel { background: var(--active-big, #ee95ff); color: var(--black, #000); }
  .tp-ark .rows { display: flex; flex-direction: column; gap: 6px; }
  .tp-kort { border-radius: 22px; background: var(--gray100, #1c1c1f); }
  .tp-ark .row { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 66px; padding: 7px; border-radius: 22px; background: var(--gray100, #1c1c1f); }
  .tp-kort .row { background: none; }
  .tp-ark .row .txt { padding-left: 4px; cursor: pointer; }
  .tp-ark .tn { position: relative; width: 64px; height: 40px; border-radius: 14px; overflow: hidden; flex: none;
    background: var(--gray200, #262629); display: flex; align-items: center; justify-content: center; color: var(--gray600, #8e8d89); }
  .tp-ark .tn img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .tp-ark .row.hid .tn, .tp-ark .row.hid .txt { opacity: .4; }
  .tp-ark .row.hid .n { text-decoration: line-through; }
  .tp-ark .rb { width: 40px; height: 40px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center;
    background: var(--gray200, #262629); color: var(--gray1000); }
  .tp-ark .rb ha-icon { --mdc-icon-size: 20px; }
  .tp-ark .rb[disabled] { opacity: .25; pointer-events: none; }
  .tp-ark .row.hid .rb.eye { background: none; border: 1px dashed var(--gray400, #48474a); color: var(--gray600, var(--gray800)); }
  .tp-hode .rb { background: var(--gray200, #262629); }
  .tp-ark .row.add { text-align: left; }
  .tp-ark .row.add .rb.pluss { background: var(--active-big, #ee95ff); color: var(--black, #000); }
  .tp-ark .mer { display: flex; flex-direction: column; gap: 10px; padding: 4px 10px 12px; }
  .tp-ark .sh { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; opacity: .7; padding-top: 4px; }
  .tp-ark .sh ha-icon { --mdc-icon-size: 18px; }
  .tp-ark .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .tp-ark .chips.scroll { max-height: 220px; overflow-y: auto; overscroll-behavior: contain; }
  .tp-ark .chip { display: flex; align-items: center; gap: 6px; max-width: 100%; height: 36px; padding: 0 14px; border-radius: 999px;
    background: var(--gray200, #262629); font-size: 14px; font-weight: 500; }
  .tp-ark .chip ha-icon { --mdc-icon-size: 16px; flex: none; }
  .tp-ark .chip .l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tp-ark .chip.brukt { opacity: .6; }
  .tp-ark .chip.sel { background: var(--active-big, #ee95ff); color: var(--black, #000); opacity: 1; }
  .tp-ark input.sok { width: 100%; height: 46px; border-radius: 999px; border: none; outline: none; padding: 0 18px;
    background: var(--gray200, #262629); color: var(--gray1000); font: inherit; font-size: 14px; font-weight: 500; }
  .tp-ark input.sok::placeholder { color: var(--gray1000); opacity: .45; }
  .tp-ark .fjern { display: flex; align-items: center; justify-content: center; gap: 8px; height: 46px; border-radius: 999px;
    background: var(--gray200, #262629); color: var(--red, #e5484d); font-size: 14px; font-weight: 500; }
  .tp-ark .fjern ha-icon { --mdc-icon-size: 18px; }
  .tp-bar { position: sticky; bottom: 0; z-index: 2; display: flex; gap: 8px; margin: 0 -12px; padding: 8px 12px 12px;
    background: var(--gray000, #141416); }
  .tp-bar .b { flex: 1; height: 46px; border-radius: 999px; background: var(--gray200, #262629); font-size: 14px; font-weight: 500; }
  .tp-bar .b[disabled] { opacity: .4; pointer-events: none; }
  .tp-bar .b.ok { background: var(--active-big, #ee95ff); color: var(--black, #000); }
  .tp-knapp { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 46px; margin-top: 8px;
    border-radius: 999px; background: var(--gray200, var(--card-background-color)); color: var(--gray1000, var(--primary-text-color));
    font-size: 14px; font-weight: 500; --mdc-icon-size: 18px; -webkit-tap-highlight-color: transparent; }
  .tp-knapp:active { transform: scale(.98); }
  .tp-knapp ha-icon { opacity: .7; }

  /* ---------- kamerafliser ---------- */
  .alle { display: block; }
  .rutenett { display: grid; gap: 8px; width: 100%; }
  .rutenett.fyll { gap: 10px; }
  .rutenett.fyll .celle { min-height: 0; height: 100%; }
  .celle {
    position: relative; display: block; box-sizing: border-box;
    padding: 0; border-radius: 22px; overflow: hidden; min-width: 0;
    background: var(--gray200, #222); color: #fff; cursor: pointer;
    user-select: none; -webkit-tap-highlight-color: transparent; outline: none;
    transition: transform .12s ease;
  }
  .celle:active { transform: scale(.985); }
  .celle:focus-visible { box-shadow: 0 0 0 2px var(--gray1000); }
  .celle.sz-sm { border-radius: 16px; }
  .celle .c-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .celle.tom .c-img { display: none; }
  .c-tom {
    position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
    padding: 12px; text-align: center; color: var(--gray600, #8e8d89); font-size: 14px; font-weight: 500; --mdc-icon-size: 28px;
  }
  .sz-sm .c-tom { --mdc-icon-size: 22px; gap: 2px; padding: 6px; font-size: 12px; }
  .sz-sm .c-tom span { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .celle.borte { background: none; border: 1px dashed var(--gray400, #48474a); }
  .celle.borte .c-img { opacity: .25; }
  .c-strom { position: absolute; inset: 0; }
  .c-strom > * { display: block; width: 100%; height: 100%; }
  .c-skygge { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(0,0,0,.35), transparent 32%, transparent 58%, rgba(0,0,0,.6)); }
  .celle.tom .c-skygge { background: none; }
  .c-topp { position: absolute; left: 12px; top: 12px; display: flex; align-items: center; gap: 6px; pointer-events: none; }
  .c-live { display: flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px 0 8px; border-radius: 999px;
    background: rgba(20, 20, 22, .55); font-size: 11px; font-weight: 500; letter-spacing: .06em; }
  .c-live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--red, #e5484d); flex: none; }
  .celle.borte .c-live::before { background: var(--gray600, #8e8d89); }
  .c-bev { display: none; align-items: center; gap: 4px; height: 22px; padding: 0 9px 0 6px; border-radius: 999px;
    background: var(--active-big, #ee95ff); color: var(--black, #000); font-size: 11px; font-weight: 500; --mdc-icon-size: 14px; }
  .celle.bevegelse .c-bev { display: flex; }
  .celle.bevegelse::after { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 2px; pointer-events: none;
    background: var(--active-big, #ee95ff);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
  .c-apne { position: absolute; right: 10px; top: 10px; width: 36px; height: 36px; border-radius: 50%; padding: 0;
    display: flex; align-items: center; justify-content: center; background: rgba(20, 20, 22, .55); color: #fff;
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); --mdc-icon-size: 18px; }
  .sz-md .c-apne { width: 32px; height: 32px; right: 8px; top: 8px; --mdc-icon-size: 16px; }
  .c-bunn { position: absolute; left: 14px; right: 14px; bottom: 11px; display: flex; align-items: baseline; justify-content: space-between;
    gap: 10px; pointer-events: none; }
  .celle.tom .c-bunn { display: none; }
  .c-navn { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    text-shadow: 0 1px 4px rgba(0, 0, 0, .5); }
  .c-meta { font-size: 12px; font-weight: 500; opacity: .75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 50%; font-variant-numeric: tabular-nums; flex: none; }
  .sz-md .c-topp { left: 10px; top: 10px; }
  .sz-md.bevegelse .c-live { display: none; }
  .sz-md .c-bunn { left: 12px; right: 12px; bottom: 9px; }
  .sz-sm .c-topp { left: 7px; top: 7px; }
  .sz-sm .c-live { font-size: 0; gap: 0; width: 16px; height: 16px; padding: 0; justify-content: center; }
  .sz-sm .c-bev { height: 18px; padding: 0 3px; } .sz-sm .c-bev-t { display: none; }
  .sz-sm.bevegelse .c-live { display: none; }
  .sz-sm .c-bunn { left: 8px; right: 6px; bottom: 6px; }
  .sz-sm .c-navn { font-size: 12px; }

  /* ---------- masonry / 3 kolonner / 2×2 / oversikt / fokus ---------- */
  .spesial { display: flex; flex-direction: column; gap: var(--ki-kam-gap, 6px); min-width: 0; }
  .masonry { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ki-kam-gap, 6px); align-items: start; }
  .mkol { display: flex; flex-direction: column; gap: var(--ki-kam-gap, 6px); min-width: 0; }
  .g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ki-kam-gap, 6px); }
  .g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ki-kam-gap, 6px); }
  .gsm { display: grid; gap: var(--ki-kam-gap, 6px); }
  .fokus { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 24px; min-width: 0; }
  .fokus::-webkit-scrollbar { display: none; }
  .fok-side { flex: none; width: 100%; scroll-snap-align: center; scroll-snap-stop: always; }
  .fok-side .celle { border-radius: 24px; }
  .navrad { display: flex; align-items: center; gap: 8px; margin-top: 4px; min-width: 0; }
  .navk { width: 44px; height: 44px; border-radius: 50%; flex: none; padding: 0; display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color)); color: var(--gray1000, var(--primary-text-color)); --mdc-icon-size: 24px; }
  .navk[disabled] { opacity: .3; pointer-events: none; }
  .navmid { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
  .sp-2x2 .navmid { flex-direction: row; gap: 10px; }
  .navnavn { font-size: 14px; font-weight: 500; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    color: var(--gray1000, var(--primary-text-color)); }
  .navtekst { font-size: 14px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; color: var(--gray1000, var(--primary-text-color)); }
  .dotter { display: flex; gap: 5px; align-items: center; }
  .dot { width: 7px; height: 7px; border-radius: 4px; padding: 0; background: var(--gray400, #48474a); transition: width .3s ease; flex: none; }
  .dot.akt { background: var(--red, #e5484d); }
  .dot.pa { width: 18px; background: var(--gray1000, #f2f1ee); }

  /* ---------- hendelser (Direkte) ---------- */
  .deteksjon { display: flex; flex-direction: column; gap: 8px; }
  .hd-tall { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .hd-stat { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 22px; min-width: 0;
    background: var(--gray200, var(--card-background-color)); color: var(--gray1000, var(--primary-text-color)); }
  .hd-v { font-size: 26px; font-weight: 300; line-height: 1.15; font-variant-numeric: tabular-nums; }
  .hd-k { font-size: 13px; font-weight: 500; opacity: .7; line-height: 1.25; }
  .hd-filter { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .hd-filter::-webkit-scrollbar { display: none; }
  .hd-filter button { display: flex; align-items: center; gap: 6px; flex: none; height: 36px; padding: 0 14px 0 11px; border-radius: 999px;
    background: var(--gray200, var(--card-background-color)); color: var(--gray1000, var(--primary-text-color));
    font-size: 14px; font-weight: 500; --mdc-icon-size: 18px; opacity: .7; }
  .hd-filter button.pa { background: var(--active-big, #ee95ff); color: var(--black, #000); opacity: 1; }

  /* ---------- tidslinje ---------- */
  .tidslinje { position: relative; padding: 2px 6px 8px; max-width: 100%; overflow: hidden; }
  .tidslinje * { box-sizing: border-box; min-width: 0; }
  .tl-laster, .tl-tom { padding: 22px 8px; text-align: center; font-size: 14px; font-weight: 500; opacity: .7; }
  .tl-dag { font-size: 13px; font-weight: 500; opacity: .7; padding: 12px 8px 6px; }
  .tl-rad {
    display: grid; grid-template-columns: 46px minmax(0, 1fr) auto;
    align-items: center; gap: 12px;
    width: 100%; max-width: 100%; min-width: 0;
    padding: 8px; border: 0; background: none; text-align: left;
    color: var(--gray1000, var(--primary-text-color)); border-radius: 16px;
    -webkit-tap-highlight-color: transparent;
    transition: background .15s ease, transform .12s ease;
  }
  .tl-rad:active { transform: scale(.985); background: rgba(250, 251, 252, .06); }
  .tl-rad + .tl-rad { border-top: 1px solid rgba(250, 251, 252, .07); border-radius: 0 0 16px 16px; }
  .tl-ikon {
    width: 46px; height: 46px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(250, 251, 252, .1); border: 1px solid rgba(250, 251, 252, .1);
    color: var(--gray1000, var(--primary-text-color)); --mdc-icon-size: 24px;
  }
  .tl-rad.aktiv .tl-ikon { background: var(--active-big, #ee95ff); border-color: transparent; color: var(--black, #1c1c1e); }
  .tl-tekst { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .tl-tittel { font-size: 15px; font-weight: 500; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tl-meta { font-size: 13px; font-weight: 500; opacity: .7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tl-tid { font-size: 13px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; white-space: nowrap; }

  /* ---------- aktivitetslogg ---------- */
  .logg { display: block; margin-top: 10px; }
  .loggpanel { border-radius: 24px; background: var(--gray200, var(--card-background-color)); padding: 8px; }
  .loggtittel { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 12px; align-items: center; padding: 6px 6px 4px; }
  .loggtittel .pik {
    width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: rgba(250, 251, 252, .1); border: 1px solid rgba(250, 251, 252, .1); --mdc-icon-size: 24px;
  }
  .loggnavn { font-size: 14px; font-weight: 500; opacity: .7; }
  .loggunder { font-size: 16px; font-weight: 300; grid-column: 2; margin-top: -2px; }
  .loggtittel .loggnavn { grid-column: 2; grid-row: 1; }
  .loggtittel .pik { grid-row: 1 / 3; }

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
  .fliser { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 10px; }
  .flis {
    display: grid; grid-template-columns: 46px minmax(0, 1fr);
    align-items: center; gap: 12px;
    min-height: 66px; padding: 10px 12px 10px 10px;
    border: 0; border-radius: 24px; text-align: left; cursor: pointer;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    -webkit-tap-highlight-color: transparent;
    transition: background .25s ease, color .25s ease, transform .14s cubic-bezier(.2, 1.3, .3, 1);
  }
  .flis:active { transform: scale(.97); }
  .flis.varsel { background: var(--red, #e5484d); color: var(--black, #1c1c1e); }
  .flis.aktiv { background: var(--active-big, #ee95ff); color: var(--black, #1c1c1e); }
  .flis:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .flis-ikon {
    width: 46px; height: 46px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(250, 251, 252, .1); border: 1px solid rgba(250, 251, 252, .1);
    --mdc-icon-size: 24px;
  }
  .flis.varsel .flis-ikon, .flis.aktiv .flis-ikon { background: rgba(0, 0, 0, .1); border-color: rgba(0, 0, 0, .08); }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flis-under { font-size: 13px; font-weight: 500; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tomt {
    padding: 28px 18px;
    border-radius: 22px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray800, var(--secondary-text-color));
    font-size: 14px; text-align: center;
  }

  @media (max-width: 430px) {
    .tidslinje { padding: 2px 4px 6px; }
    .tl-rad { grid-template-columns: 40px minmax(0, 1fr) auto; gap: 10px; }
    .tl-ikon { width: 40px; height: 40px; --mdc-icon-size: 21px; }
    .tl-tid { font-size: 12px; }
    .tl-tittel { font-size: 14px; }
    .tl-meta { font-size: 12px; }
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
      this._avkryssing(
        "Vis «Tilpass kameraer» (hver bruker velger kameraer, rekkefølge og oppsett)",
        this._config.show_customize,
        (v) => {
          this._config.show_customize = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Ta med andre camera.* automatisk",
        this._config.auto === true,
        (v) => {
          if (v) this._config.auto = true;
          else delete this._config.auto;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Direktestrøm i Oversikt og Fokus",
        this._config.direkte,
        (v) => {
          this._config.direkte = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Vis Hendelser-fanen i Direkte (deteksjoner i dag)",
        this._config.show_detections,
        (v) => {
          this._config.show_detections = v;
          this._endret();
        }
      )
    );
    const r2 = document.createElement("div");
    r2.className = "tokol";
    r2.appendChild(
      this._tekstfelt(
        "Nytt stillbilde hvert (sek)",
        this._config.oppdater || 10,
        (v) => {
          this._config.oppdater = Math.max(2, parseInt(v) || 10);
          this._endret();
        },
        "number"
      )
    );
    r2.appendChild(
      this._tekstfelt(
        "Brukervalg-ID (flere kamerakort)",
        this._config.oppsett_id || "",
        (v) => {
          if (v) this._config.oppsett_id = v;
          else delete this._config.oppsett_id;
          this._endret();
        }
      )
    );
    gen.appendChild(r2);
    gen.appendChild(
      this._tekstfelt(
        "Mappe for «Ta bilde»",
        this._config.bilde_mappe || "/config/www/kamera",
        (v) => {
          if (v) this._config.bilde_mappe = v;
          else delete this._config.bilde_mappe;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._entitetsfelt(
        "Sirene (tom = første siren.*)",
        this._config.sirene || "",
        (v) => {
          if (v) this._config.sirene = v;
          else delete this._config.sirene;
          this._endret();
        },
        ["siren", "switch"]
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
      "Frigate-visningen bruker advanced-camera-card og mysmart-frigate-gallery. Direkte-visningen bruker kameraentiteten rå; bevegelse og deteksjon (person/bil/dyr/pakke) finnes automatisk fra binary_sensor.<kamera>_*. Hver bruker kan tilpasse kameraene selv — det lagres i Home Assistant på brukeren.";
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
    sensorboks.appendChild(
      this._entitetsfelt(
        "Lys (flomlys)",
        c.lys,
        (v) => {
          if (v) c.lys = v;
          else delete c.lys;
          this._endret();
        },
        ["light", "switch"]
      )
    );
    sensorboks.appendChild(
      this._entitetsfelt(
        "Snakk (bryter)",
        c.snakk,
        (v) => {
          if (v) c.snakk = v;
          else delete c.snakk;
          this._endret();
        },
        ["switch", "input_boolean"]
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
  description: "Kameraoversikt med Frigate og direkte strøm, ni oppsett, deteksjon og «Tilpass kameraer» per bruker.",
  preview: true,
});
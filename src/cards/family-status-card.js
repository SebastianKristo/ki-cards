import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

/* ------------------------------------------------------------------ */
/*  family-status-card                                                */
/*  Hilsen + familiemedlemmers hjemme/borte-status med badge-ikoner   */
/*  basert på sone. Trykk på et bilde åpner en popup der man setter   */
/*  hjemme/borte og våken/sover. Fullt konfigurerbar via GUI-editor.  */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG = {
  greeting: "👋 Hei!",
  greeting_navigation_path: "/config",
  greeting_hold_entity: "",
  greeting_font_size: 22,
  greeting_color: "var(--gray1000)",
  navigation_path: "#personer",
  avatar_size: 50,
  badge_size: 20,
  persons_gap: 12,
  card_padding: "12px 8px",
  show_names: true,
  name_font_size: 11,
  name_color: "var(--gray1000)",
  home_icon: "mdi:lighthouse",
  home_color: "var(--blue)",
  // Når noen er hjemme vises søvntilstanden i stedet for stedet
  show_sleep_badge: true,
  sleep_icon: "mdi:sleep",
  sleep_color: "var(--purple, #6f6bd8)",
  awake_icon: "",            // tom = bruk home_icon
  awake_color: "",           // tom = bruk home_color
  default_icon: "mdi:airplane",
  default_color: "var(--blue)",
  // Popup
  dialog_background: "",
  dialog_track_color: "",
  dialog_text_color: "",
  dialog_active_color: "",
  dialog_active_text_color: "",
  dialog_inactive_text_color: "",
  home_active_color: "",
  home_active_text_color: "",
  away_active_color: "var(--blue, #4a90e2)",
  away_active_text_color: "var(--white, #ffffff)",
  awake_active_color: "var(--orange, #f2a33c)",
  awake_active_text_color: "var(--black, #101010)",
  asleep_active_color: "var(--purple, #6f6bd8)",
  asleep_active_text_color: "var(--white, #ffffff)",
  haptic: true,
  haptic_tap: "light",
  haptic_hold: "medium",
  tap_behavior: "dialog", // "dialog" | "toggle"
  dialog_home_icon: "mdi:home",
  dialog_away_icon: "mdi:home-export-outline",
  dialog_awake_icon: "mdi:white-balance-sunny",
  dialog_asleep_icon: "mdi:moon-waning-crescent",
  home_label: "Hjemme",
  away_label: "Borte",
  awake_label: "Våken",
  asleep_label: "Sover",
  done_label: "Ferdig",
  persons: [],
  locations: [],
  auto_zones: true,
  profiles: [],
  debug: false,
};

// Gjør tall om til px, men behold verdier som allerede har en enhet
// (bakoverkompatibelt med eldre konfigurasjoner som brukte f.eks. "1.4em").
function toCssSize(value, fallbackPx) {
  if (value === undefined || value === null || value === "") {
    return `${fallbackPx}px`;
  }
  if (typeof value === "number") return `${value}px`;
  if (/^[0-9.]+$/.test(String(value))) return `${value}px`;
  return String(value);
}

/* Malen «Vær»-profilen skriver inn: temperatur og tilstand, som i appen. */
const VAER_MAL = "{temp} • {vaer}";

/* Værtilstandene i Home Assistant på norsk, slik appen viser dem. */
const VAER_NB = {
  "clear-night": "Klar himmel", sunny: "Sol", partlycloudy: "Delvis skyet", cloudy: "Skyet",
  fog: "Tåke", rainy: "Regn", pouring: "Kraftig regn", snowy: "Snø", "snowy-rainy": "Sludd",
  hail: "Hagl", lightning: "Torden", "lightning-rainy": "Torden og regn", windy: "Vind",
  "windy-variant": "Vind og skyer", exceptional: "Ekstremvær",
};

class FamilyStatusCard extends LitElement {
  static get properties() {
    return { hass: {}, config: {}, _dialogIndex: {}, _lukker: {}, _serverApen: {} };
  }

  constructor() {
    super();
    this._dialogIndex = null;
    this._lukker = false;
    this._serverApen = false;
    /* Valget man nettopp gjorde, til entiteten svarer. Se _aktiv(). */
    this._opt = {};
    this._openedAt = 0;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onResize = () => this.requestUpdate();
  }

  setConfig(config) {
    if (!config.persons || !Array.isArray(config.persons) || config.persons.length === 0) {
      throw new Error("Legg til minst én person under 'persons' i konfigurasjonen.");
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._pressTimer = null;
  }

  static getConfigElement() {
    return document.createElement("family-status-card-editor");
  }

  static getStubConfig() {
    return {
      greeting: "👋 Hei!",
      greeting_navigation_path: "/config",
      greeting_font_size: 22,
      greeting_color: "var(--gray1000)",
      navigation_path: "#personer",
      avatar_size: 50,
      badge_size: 20,
      persons_gap: 12,
      show_names: true,
      name_font_size: 11,
      name_color: "var(--gray1000)",
      home_icon: "mdi:lighthouse",
      home_color: "var(--blue)",
      show_sleep_badge: true,
      sleep_icon: "mdi:sleep",
      sleep_color: "var(--purple, #6f6bd8)",
      default_icon: "mdi:airplane",
      default_color: "var(--blue)",
      tap_behavior: "dialog",
      persons: [{ person: "", presence_switch: "", sleep_switch: "", display_name: "" }],
      locations: [{ zone: "zone.home", icon: "mdi:home", color: "var(--green)" }],
    };
  }

  getCardSize() {
    return 1;
  }

  /**
   * Finner første profil som matcher enheten. En profil matcher på
   * user_agent (delstreng), user (navn på innlogget bruker) og/eller
   * min_width/max_width i piksler. Alle oppgitte kriterier må stemme.
   */
  _activeProfile() {
    const profiles = this.config.profiles;
    if (!Array.isArray(profiles)) return null;
    const ua = (navigator.userAgent || "").toLowerCase();
    const model = (this._model || "").toLowerCase();
    const width = window.innerWidth;
    const userName = (this.hass?.user?.name || "").toLowerCase();

    return (
      profiles.find((p) => {
        if (!p) return false;
        const hasRule =
          p.model ||
          p.user_agent ||
          p.user ||
          p.min_width !== undefined ||
          p.max_width !== undefined;
        if (!hasRule) return false;
        if (p.model && !model.includes(String(p.model).toLowerCase())) return false;
        if (p.user_agent && !ua.includes(String(p.user_agent).toLowerCase())) return false;
        if (p.user && !userName.startsWith(String(p.user).toLowerCase())) return false;
        if (p.min_width !== undefined && width < Number(p.min_width)) return false;
        if (p.max_width !== undefined && width > Number(p.max_width)) return false;
        return true;
      }) || null
    );
  }

  /** Basiskonfigurasjonen med eventuell profil lagt oppå. */
  get cfg() {
    const profile = this._activeProfile();
    if (!profile) return this.config;
    const { name, user, user_agent, model, min_width, max_width, ...overrides } = profile;
    return { ...this.config, ...overrides };
  }

  /** Fornavnet til den innloggede brukeren, f.eks. "Sebastian". */
  _firstName() {
    const full = this.hass?.user?.name || "";
    return full.trim().split(/\s+/)[0] || "";
  }

  /** Bytter ut {name}, {user} og {first_name} i hilsenen med fornavnet. */
  /* Hvor servernavnet står.
   *   tittel – servernavnet ER den store linja, hilsenen forsvinner (som Oslo ▾ i appen)
   *   under  – hilsenen står som før, og servernavnet ligger på linja under
   *   navn   – bare hilsenen/navnet, ingen servernavn noe sted; trykk på den åpner menyen
   * Det er feltet med pila som åpner menyen, uansett hvilken. */
  _serverPlass() {
    if (!this._servere().length) return "";
    const v = String(this.cfg.server_plass || "tittel").toLowerCase();
    if (v.startsWith("u")) return "under";
    if (v.startsWith("n")) return "navn";
    return "tittel";
  }

  /* Er det den store linja som er knappen for menyen? */
  _storLinjeErMeny() {
    const p = this._serverPlass();
    return p === "tittel" || p === "navn";
  }

  _greetingText() {
    const text = this._serverPlass() === "tittel" && !/\{server\}/.test(this.cfg.greeting || "")
      ? "{server}" : (this.cfg.greeting || "");
    return text
      .replace(/\{(name|user|first_name)\}/g, this._firstName())
      .replace(/\{server\}/g, this._serverNavn());
  }

  /* ── servervelger ──────────────────────────────────────────────────────
   *
   * Companion-appen kan ha flere Home Assistant-servere (Oslo, Strömstad, Toten), og
   * bytter med lenka homeassistant://navigate/<sti>?server=<navn>. Navnet er det
   * serveren heter I APPEN - det kan skrives med en annen bokstav enn det du vil vise
   * (Strömstad / Strømstad), derfor kan hver rad ha både navn og server.
   *
   *   servere:
   *     - navn: Oslo
   *     - navn: Strömstad
   *       server: Strømstad
   *     - navn: Toten
   *   server_sti: lovelace          # siden som åpnes på den andre serveren
   */
  _servere() {
    let liste = this.cfg.servere || [];
    /* Også som tekst, slik editoren lagrer den: «Oslo, Strömstad=Strømstad, Toten».
       Det som står etter = er navnet i appen. */
    if (typeof liste === "string") {
      liste = liste.split(",").map((d) => d.trim()).filter(Boolean).map((d) => {
        const [navn, server] = d.split("=").map((x) => x.trim());
        return { navn, server: server || navn };
      });
    }
    return (Array.isArray(liste) ? liste : []).map((s) =>
      typeof s === "string" ? { navn: s, server: s } : { navn: s.navn || s.server, server: s.server || s.navn, ikon: s.ikon, sti: s.sti }
    ).filter((s) => s.navn);
  }

  /* Hvilken server kortet står på nå. Home Assistant vet ikke hva appen kaller den,
     så vi bruker navnet på installasjonen og ser om det ligner på en av radene -
     uten hensyn til store bokstaver og ø/ö. server_navn: overstyrer. */
  _serverNavn() {
    if (this.cfg.server_navn) return this.cfg.server_navn;
    const her = String((this.hass && this.hass.config && this.hass.config.location_name) || "");
    const vask = (t) => String(t).toLowerCase().replace(/ö/g, "ø").replace(/ä/g, "æ").trim();
    const treff = this._servere().find((s) => vask(s.navn) === vask(her) || vask(s.server) === vask(her));
    return treff ? treff.navn : her;
  }

  /* Undertekst under den store linja, med samme plassholdere som hilsenen pluss vær:
     undertekst: "{temp} • {vaer}"   og   vaer: weather.forecast_home */
  _underTekst() {
    const mal = this.cfg.undertekst;
    if (!mal) return "";
    const st = this.cfg.vaer && this.hass && this.hass.states[this.cfg.vaer];
    const a = (st && st.attributes) || {};
    const temp = a.temperature !== undefined && a.temperature !== null
      ? `${Math.round(Number(a.temperature))} ${a.temperature_unit || "°C"}` : "";
    const vaer = st ? (VAER_NB[st.state] || st.state) : "";
    return String(mal)
      .replace(/\{temp\}/g, temp)
      .replace(/\{vaer\}/g, vaer)
      .replace(/\{(name|user|first_name)\}/g, this._firstName())
      .replace(/\{server\}/g, this._serverNavn())
      .replace(/^\s*[•·|,-]\s*|\s*[•·|,-]\s*$/g, "")
      .trim();
  }

  _apneMeny(e) {
    if (e) e.stopPropagation();
    this._haptic(this.cfg.haptic_tap);
    this._serverApen = !this._serverApen;
  }

  _serverBytt(s) {
    this._haptic("selection");
    this._serverApen = false;
    /* Siden som åpnes på den andre serveren: stedets egen sti, så server_sti for alle,
       og ellers samme dashbord som du står i nå - da havner du i /dashboard-mysmarthome
       på Toten når du bytter fra /dashboard-mysmarthome i Oslo, i stedet for i standard-
       dashbordet. Skråstrek foran er valgfritt. */
    const naa = String((window.location && window.location.pathname) || "").split("/").filter(Boolean)[0];
    const sti = String(s.sti || this.cfg.server_sti || naa || "lovelace").replace(/^\/+/, "");
    /* Servernavnet skrives som i mushroom-kortet ditt, med ø som ø. Full koding ville
       gjort det til Str%C3%B8mstad, og det er ikke sikkert appen dekoder det før den
       leter etter serveren. Bare tegn som ville brutt selve lenka, kodes. */
    const navn = String(s.server).replace(/[&?#%\s]/g, (t) => encodeURIComponent(t));
    const url = `homeassistant://navigate/${sti}?server=${navn}`;
    /* Byttet må gå gjennom window.open, ikke location.href.
     *
     * Det er slik Home Assistant selv åpner en url-handling (tap_action: url, som
     * mushroom-kortet ditt), og det er window.open appen fanger opp og tolker som
     * «bytt server». En location.href-endring inne i appens nettleservindu ble
     * stille ignorert - derfor skjedde det ingenting når du trykket på Strömstad.
     * I en vanlig nettleser finnes ikke homeassistant://, og der skjer det fortsatt
     * ingenting. */
    window.open(url);
  }

  /* Linja under den store. Står servernavnet der, er det den som er knappen; resten
     av teksten (vær og lignende) står bak et skilletegn. */
  _renderUnder() {
    const tekst = this._underTekst();
    const under = this._serverPlass() === "under";
    if (!tekst && !under) return "";
    return html`<div class="undertekst">
      ${under ? html`<span class="servervalg" role="button" tabindex="0"
          @click=${(e) => this._apneMeny(e)}
          @keydown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._apneMeny(e); } }}
        >${this._serverNavn()}<ha-icon class="serverpil liten ${this._serverApen ? "apen" : ""}"
          icon="mdi:menu-down"></ha-icon></span>` : ""}
      ${under && tekst ? html`<span class="skilletegn">•</span>` : ""}
      ${tekst ? html`<span>${tekst}</span>` : ""}
    </div>`;
  }

  /* Standardutseende for de tre stedene dine; alt kan overstyres med ikon/farge per server. */
  _serverStil(srv, i) {
    const n = String(srv.navn || "").toLowerCase().replace(/ö/g, "ø");
    const kjent = [
      [/oslo/, "mdi:home-city-outline", "var(--green, #34c759)"],
      [/str[øo]mstad/, "mdi:lighthouse", "var(--blue, #0a84ff)"],
      [/toten/, "mdi:tractor-variant", "var(--yellow, #ffd60a)"],
    ].find(([m]) => m.test(n));
    const reserve = ["var(--active-big, #ee95ff)", "var(--purple, #bf5af2)", "var(--teal, #40c8e0)"];
    return {
      ikon: srv.ikon || (kjent ? kjent[1] : "mdi:home-variant-outline"),
      farge: srv.farge || (kjent ? kjent[2] : reserve[i % reserve.length]),
    };
  }

  /* Servermenyen.
   *
   * Et lite ark som folder seg ut fra navnet: en overskrift, og én rad per sted med
   * en farget ikonflis, navnet og en merkelapp på der du er. Radene kommer inn én og
   * én, og trykkes ned når fingeren står på dem. */
  _renderServerMeny() {
    const her = this._serverNavn();
    return html`
      <div class="serververn" @click=${(e) => {
        e.stopPropagation();
        /* Andre trykk i et dobbelttrykk: menyen kom på det første, og bakgrunnen dens ligger nå
           over navnet – så det andre trykket landet her og lukket bare menyen. Kom det innen
           fristen, er det et dobbelttrykk: lukk menyen og kjør dobbelttrykket. */
        if (this._dobbelTimer) {
          window.clearTimeout(this._dobbelTimer);
          this._dobbelTimer = null;
          this._serverApen = false;
          this._greetingGest("double_tap");
          return;
        }
        this._serverApen = false;
      }}></div>
      <div class="servermeny" role="menu" @click=${(e) => e.stopPropagation()}>
        <div class="menytopp">Bytt sted</div>
        ${this._servere().map((srv, i) => {
          const na = srv.navn === her;
          const stil = this._serverStil(srv, i);
          return html`<button class="serverrad ${na ? "na" : ""}" role="menuitem"
            style="--rad-farge:${stil.farge};--forsink:${i * 45}ms"
            @click=${(e) => { e.stopPropagation(); if (na) { this._serverApen = false; return; } this._serverBytt(srv); }}>
            <span class="flis"><ha-icon icon=${stil.ikon}></ha-icon></span>
            <span class="radnavn">${srv.navn}</span>
            ${na
              ? html`<span class="her">Du er her</span>`
              : html`<ha-icon class="gaa" icon="mdi:chevron-right"></ha-icon>`}
          </button>`;
        })}
      </div>`;
  }


  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._onResize);
    // Client hints gir det faktiske modellnavnet på Android, der user agent
    // bare rapporterer "K". Ikke tilgjengelig på iOS/Safari.
    if (this._model === undefined && navigator.userAgentData?.getHighEntropyValues) {
      this._model = "";
      navigator.userAgentData
        .getHighEntropyValues(["model"])
        .then((data) => {
          this._model = data.model || "";
          this.requestUpdate();
        })
        .catch(() => {});
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("resize", this._onResize);
  }

  _fire(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  /**
   * Sender et "haptic"-event som Home Assistant-appen fanger opp. I vanlig
   * nettleser faller vi tilbake på navigator.vibrate, men aldri i appen –
   * da ville det vibrert to ganger.
   */
  _haptic(type) {
    if (this.cfg.haptic === false) return;
    this._fire("haptic", type);
    const inApp = !!(window.externalApp || window.webkit?.messageHandlers?.externalBus);
    if (inApp || !navigator.vibrate) return;
    const ms = {
      selection: 5,
      light: 10,
      medium: 20,
      heavy: 35,
      success: 15,
      warning: 25,
      failure: 40,
    };
    navigator.vibrate(ms[type] || 10);
  }

  _navigate(path) {
    if (!path) return;
    /* Bytter URL med history og varsler ruteren – window.location.hash gir
       full innlasting av dashbordet i companion-appen. */
    const gammel = window.location.hash;
    let url = null;
    try { url = new URL(path, window.location.origin + window.location.pathname + window.location.search); } catch (e) { /* tom */ }
    if (url) {
      const ny = url.pathname + url.search + url.hash;
      if (ny !== window.location.pathname + window.location.search + window.location.hash)
        history.pushState(null, "", ny);
    }
    this._fire("location-changed", { replace: false });
    try { window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: gammel, newURL: window.location.href })); }
    catch (e) { window.dispatchEvent(new Event("hashchange")); }
  }

  /**
   * Finner sonen som matcher personens nåværende tilstand.
   * Matcher mot sonens friendly_name, entity_id, eller slug for å tåle
   * ulike varianter.
   */
  /* Sonene kortet kjenner: de du har satt opp, pluss alle andre `zone.*` funnet selv.
   *
   * Uten dette måtte hver nye sone legges inn manuelt, og den som glemte det fikk
   * standardikonet — et fly — for en person som sto på skolen. Sonene i Home Assistant
   * har allerede både navn og ikon; vi bruker dem.
   *
   * `locations:` overstyrer fortsatt: har du gitt zone.toten en traktor, vinner den
   * over sonens eget ikon. `auto_zones: false` slår oppdagelsen av.
   */
  _alleSoner(cfg) {
    const satt = cfg.locations || [];
    if (cfg.auto_zones === false || !this.hass) return satt;

    const sattZones = new Set(satt.map((l) => l.zone).filter(Boolean));
    const ekstra = [];
    for (const id of Object.keys(this.hass.states)) {
      if (!id.startsWith("zone.") || id === "zone.home") continue;
      if (sattZones.has(id)) continue;
      const a = this.hass.states[id].attributes || {};
      ekstra.push({
        zone: id,
        /* Sonens eget ikon. Har sonen ingen, bruker vi et kartmerke og ikke flyet:
           personen er på et kjent sted, og et fly sier det motsatte. */
        icon: a.icon || "mdi:map-marker",
        color: cfg.zone_color || "var(--blue)",
        navn: a.friendly_name || id.slice(5),
        auto: true,
      });
    }
    ekstra.sort((x, y) => String(x.navn).localeCompare(String(y.navn), "nb"));
    return satt.concat(ekstra);
  }

  _resolveStatus(personConfig) {
    const cfg = this.cfg;
    const presenceState = personConfig.presence_switch
      ? this.hass.states[personConfig.presence_switch]
      : null;
    const isHome = presenceState && presenceState.state === "on";

    if (isHome) {
      /* Hjemme: vis søvntilstanden hvis personen har en søvnbryter */
      if (cfg.show_sleep_badge !== false && personConfig.sleep_switch) {
        const sover = this._isOn(personConfig.sleep_switch);
        if (sover) {
          return { icon: cfg.sleep_icon || "mdi:sleep", color: cfg.sleep_color || cfg.home_color };
        }
        return { icon: cfg.awake_icon || cfg.home_icon, color: cfg.awake_color || cfg.home_color };
      }
      return { icon: cfg.home_icon, color: cfg.home_color };
    }

    const personState = this.hass.states[personConfig.person];
    const currentValue = personState ? personState.state : null;

    const match = this._alleSoner(cfg).find((l) => {
      if (!currentValue) return false;
      if (l.zone) {
        const zoneEntity = this.hass.states[l.zone];
        const zoneFriendlyName = zoneEntity?.attributes?.friendly_name;
        const zoneSlug = l.zone.replace("zone.", "");
        return currentValue === zoneFriendlyName || currentValue === zoneSlug || currentValue === l.zone;
      }
      if (l.name) {
        return currentValue === l.name;
      }
      return false;
    });

    if (match) {
      return { icon: match.icon, color: match.color };
    }
    return { icon: cfg.default_icon, color: cfg.default_color };
  }

  _isOn(entityId) {
    if (!entityId) return false;
    const state = this.hass.states[entityId];
    return !!state && state.state === "on";
  }

  /** Slår en entitet av/på uavhengig av om det er switch eller input_boolean. */
  _setEntity(entityId, turnOn) {
    if (!entityId) return;
    this._haptic("selection");
    if (this._isOn(entityId) === turnOn) return;
    this.hass.callService("homeassistant", turnOn ? "turn_on" : "turn_off", {
      entity_id: entityId,
    });
  }

  _togglePresence(personConfig) {
    if (!personConfig.presence_switch) return;
    this.hass.callService("homeassistant", "toggle", {
      entity_id: personConfig.presence_switch,
    });
  }

  _openDialog(index) {
    this._dialogIndex = index;
    this._openedAt = Date.now();
    window.addEventListener("keydown", this._onKeyDown);
  }

  /**
   * Touch-enheter sender et "ghost click" rett etter pointerup, på det som nå
   * ligger under fingeren. Uten denne sperren treffer det backdrop-en og
   * lukker dialogen med én gang den er åpnet.
   */
  _onBackdropClick(ev) {
    if (ev.target !== ev.currentTarget) return;
    if (Date.now() - this._openedAt < 600) return;
    this._closeDialog();
  }

  /* Lukking i to trinn: først klassen som spiller utgangen, så borte.
     Uten dette forsvant popupen momentant mens den kom inn med animasjon — det
     leses som at noe gikk galt, ikke som at man lukket den. */
  _closeDialog() {
    if (this._lukker) return;
    window.removeEventListener("keydown", this._onKeyDown);
    this._lukker = true;
    window.setTimeout(() => {
      this._dialogIndex = null;
      this._lukker = false;
      this._opt = {};
    }, 170);
  }

  /* Hvilken side av bryteren som står aktiv.
   *
   * Rett etter et trykk stoler vi på valget i stedet for på entiteten: Home Assistant
   * bruker et øyeblikk på å svare, og uten dette spratt pilla tilbake til utgangspunktet
   * før den kom fram igjen — nettopp det bevegelsen skal skjule. Vi slipper taket så
   * snart entiteten er enig, eller etter tre sekunder. */
  _aktiv(nokkel, faktisk) {
    const o = this._opt[nokkel];
    if (!o) return faktisk;
    if (o.idx === faktisk || Date.now() - o.t > 3000) {
      delete this._opt[nokkel];
      return faktisk;
    }
    return o.idx;
  }

  _velg(nokkel, idx, sett) {
    this._opt[nokkel] = { idx, t: Date.now() };
    this.requestUpdate();
    sett();
  }

  /* Trykk og dra på en bryter.
   *
   * Pilla ligger som eget element i sporet, og flyttes med transform. Fingeren ned:
   * pilla klemmes flat. Dra: den følger fingeren mellom de to plassene. Slipp: den går
   * til den nærmeste, og det valget settes — akkurat som et trykk ville gjort.
   *
   * Klemmen ligger på ::before, ikke på pilla selv: pilla eier transform til
   * plasseringen, og en skalering på samme element ville overskrevet den. */
  _segDown(ev, nokkel, idx, valg) {
    const spor = ev.currentTarget;
    const pille = spor.querySelector(".pill");
    if (!pille) return;
    const bredde = pille.offsetWidth;
    const gap = 6;
    this._drag = {
      spor, pille, nokkel, idx, valg,
      x0: ev.clientX,
      base: idx === 1 ? bredde + gap : 0,
      maks: bredde + gap,
      flyttet: false,
    };
    pille.style.setProperty("--sx", 0.94);
    pille.style.setProperty("--sy", 0.86);
    try { spor.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
  }

  _segMove(ev) {
    const d = this._drag;
    if (!d) return;
    const dx = ev.clientX - d.x0;
    if (!d.flyttet && Math.abs(dx) < 5) return;
    d.flyttet = true;
    d.x = Math.max(0, Math.min(d.maks, d.base + dx));
    d.pille.style.transition = "none";
    d.pille.style.transform = `translateX(${d.x}px)`;
    const strekk = Math.min(0.12, Math.abs(dx) / 420);
    d.pille.style.setProperty("--sx", 1 + strekk);
    d.pille.style.setProperty("--sy", 1 - strekk * 0.7);
  }

  _segUp() {
    const d = this._drag;
    if (!d) return;
    this._drag = null;
    const pille = d.pille;
    pille.style.transition = "";
    pille.style.removeProperty("--sx");
    pille.style.removeProperty("--sy");
    const ny = d.flyttet ? (d.x > d.maks / 2 ? 1 : 0) : d.idx;
    /* Sett sluttplassen selv. Lit skriver bare style-attributtet på nytt når verdien
       har endret seg, så et dra som ender der det startet ville blitt stående på
       piksel-verdien fra fingeren. */
    pille.style.transform = ny === 1 ? "translateX(calc(100% + 6px))" : "";
    pille.classList.remove("land");
    void pille.offsetWidth;
    pille.classList.add("land");
    if (d.flyttet) {
      /* Et dra ender i et klikk på knappen under fingeren. Uten denne sperren ville
         det klikket satt tilbake verdien man nettopp dro bort fra. */
      this._dro = Date.now();
      if (ny !== d.idx) this._velg(d.nokkel, ny, d.valg[ny].sett);
    }
  }

  /* Én bryter: spor, glidende pille og to valg. */
  _segment(nokkel, aktiv, valg) {
    const v = valg[aktiv] || valg[0];
    return html`
      <div
        class="segment"
        @pointerdown=${(e) => this._segDown(e, nokkel, aktiv, valg)}
        @pointermove=${(e) => this._segMove(e)}
        @pointerup=${() => this._segUp()}
        @pointercancel=${() => this._segUp()}
      >
        <span
          class="pill"
          style="${aktiv === 1 ? "transform:translateX(calc(100% + 6px));" : ""}${
            v.farge ? `--pf:${v.farge};` : ""}"
        ></span>
        ${valg.map(
          (o, i) => html`
            <button
              class="seg ${i === aktiv ? "active" : ""}"
              style=${i === aktiv && o.tekstfarge ? `color:${o.tekstfarge}` : ""}
              @click=${() => {
                if (this._dro && Date.now() - this._dro < 400) return;
                if (i === aktiv) { this._haptic("selection"); return; }
                this._velg(nokkel, i, o.sett);
              }}
            >
              <ha-icon icon=${o.ikon}></ha-icon>
              <span>${o.tekst}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  _onKeyDown(ev) {
    if (ev.key === "Escape") this._closeDialog();
  }

  /** Langt trykk: personens egen hold_navigation_path, ellers kortets navigation_path. */
  _onPointerDown(personConfig) {
    this._pressTimer = window.setTimeout(() => {
      this._pressTimer = null;
      this._haptic(this.cfg.haptic_hold);
      this._navigate((personConfig && personConfig.hold_navigation_path) || this.cfg.navigation_path);
    }, 500);
  }

  _onPointerUp(personConfig, index) {
    if (this._pressTimer) {
      window.clearTimeout(this._pressTimer);
      this._pressTimer = null;
      this._haptic(this.cfg.haptic_tap);
      if (this.cfg.tap_behavior === "toggle") {
        this._togglePresence(personConfig);
      } else {
        this._openDialog(index);
      }
    }
  }

  _onPointerCancel() {
    if (this._pressTimer) {
      window.clearTimeout(this._pressTimer);
      this._pressTimer = null;
    }
  }

  /* Trykk og langt trykk på hilsenen.
   *
   * Et vanlig trykk håndteres i click, ikke i pointerup. Grunnen er rekkefølgen:
   * pointerup → click. Åpnet menyen seg allerede i pointerup, tegnet den laget som
   * lukker ved trykk utenfor rett under fingeren - og klikket som kom etterpå traff
   * det laget og lukket menyen igjen med én gang. Et langt trykk sender ikke click,
   * og derfor virket det bare når du holdt fingeren litt. */
  _onGreetingPointerDown() {
    this._holdt = false;
    this._greetingTimer = window.setTimeout(() => {
      this._greetingTimer = null;
      this._holdt = true;
      this._greetingGest("hold");
    }, 500);
  }

  /* ── handlinger på hilsenen ──────────────────────────────────────────────
   *
   * Tre gester, hver med sin handling i samme form som resten av Home Assistant:
   *
   *   greeting_tap_action:        { action: navigate, navigation_path: /config }
   *   greeting_double_tap_action: { action: perform-action, perform_action: input_boolean.toggle,
   *                                 target: { entity_id: input_boolean.kiosk_mode } }
   *   greeting_hold_action:       …
   *
   * De gamle feltene virker fortsatt som reserve: greeting_navigation_path for trykk og
   * greeting_hold_entity for langt trykk. Servermenyen ligger på gesten server_meny_med
   * (trykk som standard), og vinner over handlingen for den gesten.
   */
  _greetingHandling(gest) {
    const c = this.cfg;
    const satt = { tap: c.greeting_tap_action, double_tap: c.greeting_double_tap_action,
      hold: c.greeting_hold_action }[gest];
    if (satt && satt.action) return satt;
    if (gest === "tap" && c.greeting_navigation_path)
      return { action: "navigate", navigation_path: c.greeting_navigation_path };
    if (gest === "hold" && c.greeting_hold_entity)
      return { action: "toggle", entity: c.greeting_hold_entity };
    return { action: "none" };
  }

  _serverGest() {
    if (!this._storLinjeErMeny()) return "";
    const v = String(this.cfg.server_meny_med || "tap").toLowerCase();
    if (v.startsWith("d")) return "double_tap";
    if (v.startsWith("h") || v.startsWith("l")) return "hold";
    if (v.startsWith("n") || v === "ingen") return "";
    return "tap";
  }

  _greetingGest(gest) {
    if (this._serverGest() === gest) {
      this._haptic(this.cfg.haptic_tap);
      this._serverApen = !this._serverApen;
      return;
    }
    const h = this._greetingHandling(gest);
    if (!h || h.action === "none") return;
    this._haptic(gest === "hold" ? this.cfg.haptic_hold : this.cfg.haptic_tap);
    this._kjorHandling(h);
  }

  _kjorHandling(h) {
    const a = h.action;
    if (a === "navigate") return this._navigate(h.navigation_path);
    if (a === "url") { if (h.url_path) window.open(h.url_path); return; }
    if (a === "toggle") {
      const id = h.entity || (h.target && h.target.entity_id);
      if (id) this.hass.callService("homeassistant", "toggle", { entity_id: id });
      return;
    }
    if (a === "more-info") {
      const id = h.entity || (h.target && h.target.entity_id);
      if (id) this._fire("hass-more-info", { entityId: id });
      return;
    }
    if (a === "perform-action" || a === "call-service") {
      const tjeneste = h.perform_action || h.service || "";
      const [domene, navn] = tjeneste.split(".");
      if (domene && navn)
        this.hass.callService(domene, navn, h.data || h.service_data || {}, h.target);
      return;
    }
    /* Alt annet (assist o.l.) sendes videre til Home Assistant, som kjenner resten. */
    this._fire("hass-action", { config: { tap_action: h }, action: "tap" });
  }

  _onGreetingPointerUp() {
    if (this._greetingTimer) {
      window.clearTimeout(this._greetingTimer);
      this._greetingTimer = null;
    }
  }

  _onGreetingClick(e) {
    /* Et langt trykk er allerede håndtert; da skal det ikke også telle som trykk. */
    if (this._holdt) { this._holdt = false; return; }
    if (e) e.stopPropagation();
    /* Dobbelttrykk: finnes det noe å gjøre på dobbelttrykk, venter vi 250 ms før et
       enkelt trykk utføres. Finnes det ikke, kjøres trykket med en gang - ingen grunn
       til å gjøre hvert trykk tregere for en gest som ikke brukes. */
    const harDobbel = this._serverGest() === "double_tap"
      || this._greetingHandling("double_tap").action !== "none";
    if (!harDobbel) { this._greetingGest("tap"); return; }
    if (this._dobbelTimer) {
      window.clearTimeout(this._dobbelTimer);
      this._dobbelTimer = null;
      this._greetingGest("double_tap");
      return;
    }
    /* Vanlig dobbelttrykk: første trykk venter et øyeblikk. Kommer et andre trykk innen
       fristen, er det et dobbelttrykk; ellers utføres trykket (f.eks. servermenyen).
       Finnes det ingen dobbelttrykk-handling, kjøres trykket med en gang (se over). */
    this._dobbelTimer = window.setTimeout(() => {
      this._dobbelTimer = null;
      this._greetingGest("tap");
    }, 280);
  }

  _onGreetingPointerCancel() {
    if (this._greetingTimer) {
      window.clearTimeout(this._greetingTimer);
      this._greetingTimer = null;
    }
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.cfg;
    const hostStyle = `
      --fsc-avatar-size: ${toCssSize(cfg.avatar_size, 50)};
      --fsc-badge-size: ${toCssSize(cfg.badge_size, 20)};
      --fsc-badge-icon-size: ${Math.round(Number(cfg.badge_size ?? 20) * 0.6)}px;
      --fsc-persons-gap: ${toCssSize(cfg.persons_gap, 12)};
      --fsc-card-padding: ${cfg.card_padding || "12px 8px"};
      --fsc-greeting-size: ${toCssSize(cfg.greeting_font_size, 22)};
      --fsc-greeting-color: ${cfg.greeting_color || "var(--gray1000)"};
      --fsc-name-size: ${toCssSize(cfg.name_font_size, 11)};
      --fsc-name-color: ${cfg.name_color || "var(--gray1000)"};
    `;

    return html`
      <ha-card style=${hostStyle}>
        <div class="row">
          <div class="hilsen">
          <div
            class="greeting"
            @pointerdown=${() => this._onGreetingPointerDown()}
            @pointerup=${() => this._onGreetingPointerUp()}
            @pointerleave=${() => this._onGreetingPointerCancel()}
            @pointercancel=${() => this._onGreetingPointerCancel()}
            @click=${(e) => this._onGreetingClick(e)}
            @contextmenu=${(e) => e.preventDefault()}
          >
            ${this._greetingText()}${this._storLinjeErMeny()
              ? html`<ha-icon class="serverpil ${this._serverApen ? "apen" : ""}" icon="mdi:menu-down"></ha-icon>`
              : ""}
          </div>
          ${this._renderUnder()}
          ${this._serverApen ? this._renderServerMeny() : ""}
          </div>
          <div class="persons">
            ${cfg.persons.map((p, i) => this._renderPerson(p, i))}
          </div>
        </div>
        ${this._dialogIndex !== null ? this._renderDialog() : ""}
        ${cfg.debug ? this._renderDebug() : ""}
      </ha-card>
    `;
  }

  _renderDebug() {
    const profile = this._activeProfile();
    return html`
      <div class="debug">
        <div><b>Bredde:</b> ${window.innerWidth} px</div>
        <div><b>Modell:</b> ${this._model || "ikke tilgjengelig"}</div>
        <div><b>Bruker:</b> ${this.hass?.user?.name || "ukjent"}</div>
        <div><b>Profil:</b> ${profile ? profile.name || "uten navn" : "standard"}</div>
        <div class="ua">${navigator.userAgent}</div>
      </div>
    `;
  }

  _renderPerson(personConfig, index) {
    const state = this.hass.states[personConfig.person];
    const picture = state?.attributes?.entity_picture || "";
    const fallbackName = state?.attributes?.friendly_name || personConfig.person || "Ukjent";
    const displayName = personConfig.display_name || fallbackName;
    const status = this._resolveStatus(personConfig);
    const showNames = this.cfg.show_names !== false;

    return html`
      <div class="person">
        <div
          class="avatar-wrap"
          title=${fallbackName}
          @pointerdown=${() => this._onPointerDown(personConfig)}
          @pointerup=${() => this._onPointerUp(personConfig, index)}
          @pointerleave=${() => this._onPointerCancel()}
          @contextmenu=${(e) => e.preventDefault()}
        >
          <div class="avatar" style=${picture ? `background-image:url(${picture})` : ""}></div>
          <div class="badge" style="background:${status.color}">
            <ha-icon icon=${status.icon}></ha-icon>
          </div>
        </div>
        ${showNames ? html`<div class="person-name">${displayName}</div>` : ""}
      </div>
    `;
  }

  /* ---------------------------- POPUP ---------------------------- */

  _renderDialog() {
    const cfg = this.cfg;
    const personConfig = cfg.persons[this._dialogIndex];
    if (!personConfig) return "";

    const state = this.hass.states[personConfig.person];
    const picture = state?.attributes?.entity_picture || "";
    const name =
      personConfig.display_name ||
      state?.attributes?.friendly_name ||
      personConfig.person ||
      "Ukjent";

    const isHome = this._isOn(personConfig.presence_switch);
    const isAsleep = this._isOn(personConfig.sleep_switch);

    const cssVar = (name, value) => (value ? `${name}: ${value};` : "");
    const segStyle = (bg, text) =>
      [
        bg ? `background: ${bg};` : "",
        text ? `color: ${text};` : "",
      ].join(" ");
    const dialogStyle = [
      cssVar("--fsc-dialog-bg", cfg.dialog_background),
      cssVar("--fsc-dialog-track", cfg.dialog_track_color),
      cssVar("--fsc-dialog-text", cfg.dialog_text_color),
      cssVar("--fsc-dialog-active", cfg.dialog_active_color),
      cssVar("--fsc-dialog-active-text", cfg.dialog_active_text_color),
      cssVar("--fsc-dialog-inactive-text", cfg.dialog_inactive_text_color),
    ].join(" ");

    return html`
      <div
        class="backdrop ${this._lukker ? "ut" : ""}"
        @click=${(e) => this._onBackdropClick(e)}
      >
        <div
          class="dialog ${this._lukker ? "ut" : ""}"
          role="dialog"
          aria-label=${name}
          style=${dialogStyle}
          @click=${(e) => e.stopPropagation()}
        >
          <div class="glans"></div>
          <div class="avatarring ${isHome ? "hjemme" : "borte"} ${isAsleep ? "sover" : ""}">
            <div
              class="dialog-avatar"
              style=${picture ? `background-image:url(${picture})` : ""}
            ></div>
          </div>
          <div class="dialog-name">${name}</div>
          <div class="dialog-sub">
            ${isHome ? cfg.home_label : cfg.away_label}${
              personConfig.sleep_switch
                ? html` · ${isAsleep ? cfg.asleep_label : cfg.awake_label}`
                : ""}
          </div>

          ${personConfig.presence_switch
            ? this._segment("pres", this._aktiv("pres", isHome ? 0 : 1), [
                {
                  ikon: cfg.dialog_home_icon,
                  tekst: cfg.home_label,
                  farge: cfg.home_active_color,
                  tekstfarge: cfg.home_active_text_color,
                  sett: () => this._setEntity(personConfig.presence_switch, true),
                },
                {
                  ikon: cfg.dialog_away_icon,
                  tekst: cfg.away_label,
                  farge: cfg.away_active_color,
                  tekstfarge: cfg.away_active_text_color,
                  sett: () => this._setEntity(personConfig.presence_switch, false),
                },
              ])
            : ""}
          ${personConfig.sleep_switch
            ? this._segment("sovn", this._aktiv("sovn", isAsleep ? 1 : 0), [
                {
                  ikon: cfg.dialog_awake_icon,
                  tekst: cfg.awake_label,
                  farge: cfg.awake_active_color,
                  tekstfarge: cfg.awake_active_text_color,
                  sett: () => this._setEntity(personConfig.sleep_switch, false),
                },
                {
                  ikon: cfg.dialog_asleep_icon,
                  tekst: cfg.asleep_label,
                  farge: cfg.asleep_active_color,
                  tekstfarge: cfg.asleep_active_text_color,
                  sett: () => this._setEntity(personConfig.sleep_switch, true),
                },
              ])
            : ""}

          <button
            class="done"
            @click=${(e) => {
              this._haptic(this.cfg.haptic_tap);
              /* Knappen får sin egen lille sprett før popupen lukkes. Lukker vi med en
                 gang, rekker trykket aldri å bli sett. */
              const b = e.currentTarget;
              b.classList.remove("trykk");
              void b.offsetWidth;
              b.classList.add("trykk");
              window.setTimeout(() => this._closeDialog(), 130);
            }}
          >
            ${cfg.done_label}
          </button>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        box-shadow: none;
        background: none;
        border: none;
      }
      .row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: var(--fsc-card-padding, 12px 8px);
        gap: 8px;
      }
      .greeting {
        font-size: var(--fsc-greeting-size, 22px);
        font-weight: 600;
        color: var(--fsc-greeting-color, var(--gray1000));
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        touch-action: manipulation;
        -webkit-touch-callout: none;
      }
      .persons {
        display: flex;
        gap: var(--fsc-persons-gap, 12px);
        align-items: flex-start;
      }
      .person {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .avatar-wrap {
        position: relative;
        width: var(--fsc-avatar-size, 50px);
        height: var(--fsc-avatar-size, 50px);
        cursor: pointer;
        user-select: none;
        touch-action: manipulation;
        -webkit-touch-callout: none;
      }
      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: var(--gray200, var(--secondary-background-color));
      }
      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: var(--fsc-badge-size, 20px);
        height: var(--fsc-badge-size, 20px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.3);
      }
      .badge ha-icon {
        --mdc-icon-size: var(--fsc-badge-icon-size, 12px);
        color: white;
      }
      .person-name {
        font-size: var(--fsc-name-size, 11px);
        color: var(--fsc-name-color, var(--gray1000));
        opacity: 0.8;
        text-align: center;
        max-width: calc(var(--fsc-avatar-size, 50px) + 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ---------------------------- DEBUG ---------------------------- */
      .debug {
        margin: 0 8px 8px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--gray100, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        font-size: 12px;
        line-height: 1.6;
      }
      .debug .ua {
        margin-top: 6px;
        opacity: 0.7;
        word-break: break-all;
      }

      /* ------------------------- SERVERVELGER ------------------------- */
      .row {
        position: relative;
      }
      .greeting {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .hilsen {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
      }
      .undertekst {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fsc-under-size, 15px);
        color: var(--gray800, var(--secondary-text-color));
        white-space: nowrap;
        min-width: 0;
      }
      .undertekst > span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .undertekst > .servervalg {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        color: var(--gray1000, var(--primary-text-color));
        font-weight: 500;
        cursor: pointer;
        overflow: visible;
        -webkit-tap-highlight-color: transparent;
      }
      .skilletegn {
        opacity: 0.6;
      }
      .serverpil.liten {
        --mdc-icon-size: 20px;
      }
      .serverpil {
        --mdc-icon-size: 26px;
        opacity: 0.85;
        transition: transform 0.2s ease;
        flex: none;
      }
      .serverpil.apen {
        transform: rotate(180deg);
      }
      /* Et usynlig lag over resten av siden, så et trykk utenfor menyen lukker den. */
      .serververn {
        position: fixed;
        inset: 0;
        z-index: 20;
      }
      .servermeny {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        z-index: 21;
        width: min(260px, calc(100vw - 32px));
        padding: 8px;
        border-radius: 22px;
        background: var(--gray200, var(--ha-card-background, #2a2a2d));
        border: 1px solid rgba(250, 251, 252, 0.08);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
        display: grid;
        gap: 4px;
        animation: fsc-meny 260ms cubic-bezier(0.2, 1.25, 0.3, 1);
        transform-origin: 24px -8px;
      }
      /* Den lille spissen som peker opp mot navnet. */
      .servermeny::before {
        content: "";
        position: absolute;
        top: -6px;
        left: 22px;
        width: 12px;
        height: 12px;
        transform: rotate(45deg);
        background: inherit;
        border-left: 1px solid rgba(250, 251, 252, 0.08);
        border-top: 1px solid rgba(250, 251, 252, 0.08);
        border-radius: 3px 0 0 0;
      }
      .menytopp {
        padding: 6px 10px 4px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--gray800, var(--secondary-text-color));
      }
      .serverrad {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px;
        border: 0;
        border-radius: 14px;
        background: none;
        color: var(--gray1000, var(--primary-text-color));
        font: inherit;
        font-size: 16px;
        text-align: left;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.15s ease, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1);
        animation: fsc-rad 320ms cubic-bezier(0.2, 1.2, 0.3, 1) backwards;
        animation-delay: var(--forsink, 0ms);
      }
      .serverrad:active {
        transform: scale(0.96);
        background: rgba(250, 251, 252, 0.08);
      }
      .serverrad.na {
        background: rgba(250, 251, 252, 0.06);
      }
      .serverrad .flis {
        width: 36px;
        height: 36px;
        border-radius: 11px;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--rad-farge) 22%, transparent);
        color: var(--rad-farge);
      }
      .serverrad.na .flis {
        background: var(--rad-farge);
        color: rgba(20, 20, 24, 0.85);
      }
      .serverrad .flis ha-icon {
        --mdc-icon-size: 20px;
      }
      .serverrad .radnavn {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .serverrad .her {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--rad-farge);
        color: rgba(20, 20, 24, 0.85);
        white-space: nowrap;
      }
      .serverrad .gaa {
        --mdc-icon-size: 20px;
        opacity: 0.45;
        flex: none;
      }
      @keyframes fsc-rad {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .servermeny,
        .serverrad {
          animation: none;
        }
      }
      @keyframes fsc-meny {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(-6px);
        }
      }

      /* ---------------------------- POPUP ---------------------------- */
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        animation: fsc-fade 160ms ease-out;
      }
      .backdrop.ut {
        animation: fsc-fade 160ms ease-in reverse forwards;
      }
      .dialog {
        position: relative;
        width: min(340px, 100%);
        margin-top: 46px;
        padding: 62px 18px 18px;
        border-radius: 32px;
        background: var(
          --fsc-dialog-bg,
          var(--gray000, var(--ha-card-background, var(--card-background-color)))
        );
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        gap: 10px;
        /* Fjærkurve: popupen kommer opp og setter seg, i stedet for å tone inn. */
        animation: fsc-pop 260ms cubic-bezier(0.2, 1.2, 0.3, 1);
      }
      .dialog.ut {
        animation: fsc-vekk 160ms ease-in forwards;
      }
      /* Svakt skjær øverst, i samme farge som den aktive pilla. Gir popupen en topp
         uten å tegne en strek. */
      /* Skjæret må ligge INNE i popupen: avataren henger utenfor toppen, så
         overflow:hidden på dialogen ville klippet den vekk. Derfor egen
         border-radius i toppen i stedet. */
      .glans {
        position: absolute;
        inset: 0 0 auto 0;
        height: 130px;
        pointer-events: none;
        border-radius: 32px 32px 0 0;
        background: radial-gradient(
          70% 100% at 50% 0%,
          var(--fsc-dialog-active, var(--active-big, var(--primary-color))),
          transparent 70%
        );
        opacity: 0.15;
      }
      .avatarring {
        position: absolute;
        top: -46px;
        left: 50%;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        transform: translateX(-50%);
        padding: 3px;
        background: var(--gray400, rgba(255, 255, 255, 0.25));
        animation: fsc-drypp 320ms cubic-bezier(0.2, 1.3, 0.3, 1) 40ms backwards;
      }
      .avatarring.hjemme {
        background: var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
      }
      .avatarring.sover {
        background: var(--purple, #6f6bd8);
      }
      .dialog-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: var(--gray200, var(--secondary-background-color));
      }
      .dialog-name {
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.15;
        color: var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
      }
      .dialog-sub {
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        opacity: 0.55;
        margin: -4px 0 6px;
        color: var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
      }
      .segment {
        position: relative;
        display: flex;
        gap: 6px;
        padding: 5px;
        border-radius: 999px;
        background: var(--fsc-dialog-track, var(--gray100, var(--secondary-background-color)));
        touch-action: pan-y;
      }
      /* Den glidende pilla. To like brede valg, så plassen kan regnes i prosent —
         ingen måling, ingenting som må rettes når skrifta byttes. */
      .pill {
        position: absolute;
        top: 5px;
        bottom: 5px;
        left: 5px;
        width: calc(50% - 8px);
        border-radius: 999px;
        pointer-events: none;
        transition: transform 320ms cubic-bezier(0.2, 1.25, 0.35, 1);
      }
      .pill::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: var(--pf, var(--fsc-dialog-active, var(--active-big, var(--primary-color))));
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
        transform: scale(var(--sx, 1), var(--sy, 1));
        transition: transform 300ms cubic-bezier(0.2, 1.35, 0.35, 1), background 200ms ease;
      }
      .pill.land::before {
        animation: fsc-sprett 420ms cubic-bezier(0.2, 0.9, 0.25, 1);
      }
      .seg {
        position: relative;
        z-index: 1;
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px 8px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--fsc-dialog-inactive-text, var(--gray800, var(--secondary-text-color)));
        font-family: inherit;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        transition: color 160ms ease, transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .seg:active {
        transform: scale(0.96);
      }
      .seg ha-icon {
        --mdc-icon-size: 20px;
        flex: none;
      }
      .seg span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .seg.active {
        color: var(--fsc-dialog-active-text, var(--black, var(--primary-text-color)));
        font-weight: 600;
      }
      .seg:focus-visible {
        outline: 2px solid var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
        outline-offset: 2px;
      }
      .done {
        margin-top: 8px;
        padding: 16px;
        border: none;
        border-radius: 999px;
        background: var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
        color: var(--fsc-dialog-active-text, var(--black, var(--primary-text-color)));
        font-family: inherit;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 160ms cubic-bezier(0.2, 1.3, 0.3, 1);
      }
      .done:active {
        transform: scale(0.96);
      }
      .done.trykk {
        animation: fsc-sprett 360ms cubic-bezier(0.2, 0.9, 0.25, 1);
      }
      .done:focus-visible {
        outline: 2px solid var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
        outline-offset: 2px;
      }
      @keyframes fsc-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes fsc-pop {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(14px);
        }
      }
      @keyframes fsc-vekk {
        to {
          opacity: 0;
          transform: scale(0.94) translateY(8px);
        }
      }
      @keyframes fsc-drypp {
        from {
          opacity: 0;
          transform: translateX(-50%) scale(0.6);
        }
      }
      @keyframes fsc-sprett {
        0% {
          transform: scale(0.9, 1.08);
        }
        45% {
          transform: scale(1.04, 0.97);
        }
        75% {
          transform: scale(0.99, 1.01);
        }
        100% {
          transform: scale(1, 1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .dialog,
        .avatarring,
        .pill.land::before,
        .done.trykk {
          animation: none;
        }
        .pill,
        .pill::before,
        .seg,
        .done {
          transition: none;
        }
      }
    `;
  }
}

customElements.define("family-status-card", FamilyStatusCard);

/* ------------------------------------------------------------------ */
/*  GUI-editor                                                        */
/* ------------------------------------------------------------------ */

class FamilyStatusCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {} };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /* ------------------------- oppdateringer ------------------------- */

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _update(field, value) {
    this._config = { ...this._config, [field]: value };
    this._fireChanged();
  }

  _updateNumber(field, value) {
    const num = Number(value);
    this._update(field, Number.isFinite(num) && value !== "" ? num : value);
  }

  _updateList(list, index, field, value) {
    const items = [...(this._config[list] || [])];
    items[index] = { ...items[index], [field]: value };
    this._update(list, items);
  }

  _removeFromList(list, index) {
    this._update(
      list,
      (this._config[list] || []).filter((_, i) => i !== index)
    );
  }

  _addToList(list, item) {
    this._update(list, [...(this._config[list] || []), item]);
  }

  /** Tomme felter fjernes helt fra profilen, slik at verdien arves. */
  _updateProfile(index, field, value) {
    const profiles = [...(this._config.profiles || [])];
    const profile = { ...profiles[index] };
    if (value === "" || value === null || value === undefined) {
      delete profile[field];
    } else {
      profile[field] = value;
    }
    profiles[index] = profile;
    this._update("profiles", profiles);
  }

  _updateProfileNumber(index, field, value) {
    if (value === "") return this._updateProfile(index, field, "");
    const num = Number(value);
    this._updateProfile(index, field, Number.isFinite(num) ? num : value);
  }

  /* --------------------------- byggeklosser ------------------------ */

  _text(label, field, value = null) {
    return html`
      <ha-textfield
        label=${label}
        .value=${value !== null ? value : this._config[field] || ""}
        @input=${(e) => this._update(field, e.target.value)}
      ></ha-textfield>
    `;
  }

  _number(label, field, fallback) {
    return html`
      <ha-textfield
        type="number"
        suffix="px"
        label=${label}
        .value=${this._config[field] ?? fallback}
        @input=${(e) => this._updateNumber(field, e.target.value)}
      ></ha-textfield>
    `;
  }

  /* Fargefelt med velger.
   *
   * Før var fargeruta bare en visning: den viste fargen, men trykk på den gjorde
   * ingenting, og den eneste måten å endre fargen på var å skrive en CSS-verdi i
   * tekstfeltet. Nå åpner ruta en palett med fargene fra mysmarthome-temaet, en
   * egen fargevelger for en hvilken som helst farge, og «Arv fra temaet» som tømmer. */
  _color(label, field) {
    const value = this._config[field] || "";
    const apen = this._fargeApen === field;
    const palett = [
      ["var(--active-big)", "Aktiv"], ["var(--red)", "Rød"], ["var(--orange)", "Oransje"],
      ["var(--yellow)", "Gul"], ["var(--green)", "Grønn"], ["var(--blue)", "Blå"],
      ["var(--purple)", "Lilla"], ["var(--pink)", "Rosa"], ["var(--gray1000)", "Tekst"],
      ["var(--gray800)", "Dempet"], ["var(--gray200)", "Flate"], ["var(--black)", "Svart"],
    ];
    const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#ee95ff";
    return html`
      <div class="color-field ${apen ? "apen" : ""}">
        <button
          class="swatch"
          type="button"
          style=${value ? `background: ${value}` : ""}
          title=${value || "Arver fra temaet"}
          aria-label="Velg farge"
          @click=${(e) => { e.stopPropagation(); this._fargeApen = apen ? null : field; this.requestUpdate(); }}
        ></button>
        <ha-textfield
          label=${label}
          .value=${value}
          @input=${(e) => this._update(field, e.target.value)}
        ></ha-textfield>
        ${apen ? html`
          <div class="palett" @click=${(e) => e.stopPropagation()}>
            ${palett.map(([v, navn]) => html`
              <button type="button" class="pfarge ${value === v ? "valgt" : ""}" title=${navn}
                style=${`background:${v}`}
                @click=${() => { this._update(field, v); this._fargeApen = null; this.requestUpdate(); }}></button>`)}
            <label class="pegen" title="Egen farge">
              <input type="color" .value=${hex}
                @input=${(e) => this._update(field, e.target.value)}
                @change=${() => { this._fargeApen = null; this.requestUpdate(); }} />
              <ha-icon icon="mdi:eyedropper-variant"></ha-icon>
            </label>
            <button type="button" class="parv"
              @click=${() => { this._update(field, ""); this._fargeApen = null; this.requestUpdate(); }}>Arv fra temaet</button>
          </div>` : ""}
      </div>
    `;
  }

  _icon(label, field) {
    return html`
      <ha-icon-picker
        label=${label}
        .hass=${this.hass}
        .value=${this._config[field] || ""}
        @value-changed=${(e) => this._update(field, e.detail.value)}
      ></ha-icon-picker>
    `;
  }

  _switch(label, field, defaultOn = true) {
    const checked = defaultOn ? this._config[field] !== false : !!this._config[field];
    return html`
      <div class="switch-row">
        <ha-switch
          .checked=${checked}
          @change=${(e) => this._update(field, e.target.checked)}
        ></ha-switch>
        <span>${label}</span>
      </div>
    `;
  }

  _select(label, field, options, fallback) {
    return html`
      <ha-select
        label=${label}
        naturalMenuWidth
        fixedMenuPosition
        .value=${this._config[field] || fallback}
        @closed=${(e) => e.stopPropagation()}
        @selected=${(e) => this._update(field, e.target.value)}
      >
        ${options.map(
          (o) => html`<mwc-list-item .value=${o.value}>${o.label}</mwc-list-item>`
        )}
      </ha-select>
    `;
  }

  _labelRow(iconField, iconLabel, textField, textLabel, colorField, colorLabel) {
    return html`
      <div class="field-row three">
        ${this._icon(iconLabel, iconField)} ${this._text(textLabel, textField)}
        ${this._color(colorLabel, colorField)}
      </div>
    `;
  }

  _personLabel(p, i) {
    if (p.display_name) return p.display_name;
    const state = this.hass?.states?.[p.person];
    return state?.attributes?.friendly_name || `Person ${i + 1}`;
  }

  _zoneLabel(l, i) {
    const state = this.hass?.states?.[l.zone];
    return state?.attributes?.friendly_name || l.zone || `Sone ${i + 1}`;
  }

  /* ------------------------------ render --------------------------- */

  render() {
    if (!this._config) return html``;
    const cfg = this._config;
    const hapticTypes = [
      { value: "selection", label: "Selection – nesten umerkelig" },
      { value: "light", label: "Light – lett" },
      { value: "medium", label: "Medium" },
      { value: "heavy", label: "Heavy – kraftig" },
      { value: "success", label: "Success" },
      { value: "warning", label: "Warning" },
      { value: "failure", label: "Failure" },
    ];

    return html`
      <div class="editor">
        <!-- HILSEN -->
        <ha-expansion-panel outlined expanded>
          <div slot="header" class="header">
            <ha-icon icon="mdi:hand-wave"></ha-icon>
            <span>Hilsen</span>
          </div>
          <div class="body">
            ${this._text("Tekst", "greeting")}
            <div class="hint">
              Skriv {name} der fornavnet til den innloggede brukeren skal stå.
            </div>
            <div class="field-row">
              ${this._number("Skriftstørrelse", "greeting_font_size", 22)}
              ${this._color("Farge", "greeting_color")}
            </div>
            <div class="hint">
              Hva som skjer når du trykker på hilsenen. Samme valg som ellers i Home Assistant:
              naviger, utfør handling, veksle, åpne URL eller mer info.
            </div>
            ${[["greeting_tap_action", "Trykk", "tap"],
               ["greeting_double_tap_action", "Dobbelttrykk", "double_tap"],
               ["greeting_hold_action", "Langt trykk", "hold"]].map(([felt, navn, gest]) => html`
              <ha-selector
                .hass=${this.hass}
                .label=${navn}
                .selector=${{ ui_action: { default_action: "none" } }}
                .value=${cfg[felt] || (gest === "tap" && cfg.greeting_navigation_path
                  ? { action: "navigate", navigation_path: cfg.greeting_navigation_path }
                  : gest === "hold" && cfg.greeting_hold_entity
                    ? { action: "toggle", entity: cfg.greeting_hold_entity } : undefined)}
                @value-changed=${(e) => this._update(felt, e.detail.value)}
              ></ha-selector>`)}
          </div>
        </ha-expansion-panel>

        <!-- SERVERE -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:server-network"></ha-icon>
            <span>Servere</span>
          </div>
          <div class="body">
            <ha-textfield
              label="Servere (kommaseparert)"
              .value=${Array.isArray(cfg.servere)
                ? cfg.servere.map((s) => typeof s === "string" ? s
                    : (s.server && s.server !== s.navn ? `${s.navn}=${s.server}` : (s.navn || s.server))).join(", ")
                : (cfg.servere || "")}
              @change=${(e) => this._update("servere", e.target.value)}
            ></ha-textfield>
            <div class="hint">
              Med servere satt viser hilsenen navnet på serveren du er på, og et trykk åpner
              en meny for å bytte. Skriv navnet slik det står i appen etter =, hvis det er
              annerledes: <b>Oslo, Strömstad=Strømstad, Toten</b>.
            </div>
            <div class="field-row">
              ${this._text("Denne serverens navn (valgfri)", "server_navn")}
              ${this._text("Side som åpnes (f.eks. /dashboard-mysmarthome)", "server_sti")}
            </div>
            <ha-selector
              .hass=${this.hass}
              .label=${"Servermenyen åpnes med"}
              .selector=${{ select: { mode: "dropdown", options: [
                { value: "tap", label: "Trykk" }, { value: "double_tap", label: "Dobbelttrykk" },
                { value: "hold", label: "Langt trykk" }, { value: "ingen", label: "Ingen gest" }] } }}
              .value=${cfg.server_meny_med || "tap"}
              @value-changed=${(e) => this._update("server_meny_med", e.detail.value)}
            ></ha-selector>
            <ha-selector
              .hass=${this.hass}
              .label=${"Hvor servernavnet står"}
              .selector=${{ select: { mode: "dropdown", options: [
                { value: "tittel", label: "Som tittel – erstatter hilsenen" },
                { value: "under", label: "Under hilsenen" },
                { value: "navn", label: "Ikke vist – trykk på navnet åpner menyen" }] } }}
              .value=${cfg.server_plass || "tittel"}
              @value-changed=${(e) => this._update("server_plass", e.detail.value)}
            ></ha-selector>
            <ha-selector
              .hass=${this.hass}
              .label=${"Linja under navnet"}
              .selector=${{ select: { mode: "dropdown", options: [
                { value: "ingen", label: "Ingen" },
                { value: "vaer", label: "Vær – temperatur og tilstand" },
                { value: "egen", label: "Egen tekst" }] } }}
              .value=${!cfg.undertekst ? "ingen" : cfg.undertekst === VAER_MAL ? "vaer" : "egen"}
              @value-changed=${(e) => {
                const v = e.detail.value;
                this._update("undertekst", v === "ingen" ? "" : v === "vaer" ? VAER_MAL : (cfg.undertekst && cfg.undertekst !== VAER_MAL ? cfg.undertekst : "Hei {name}"));
              }}
            ></ha-selector>
            ${cfg.undertekst && cfg.undertekst !== VAER_MAL ? this._text("Undertekst", "undertekst") : ""}
            <div class="hint">
              Linja under navnet. {temp} og {vaer} hentes fra værentiteten, {name} og {server}
              som i hilsenen: <b>{temp} • {vaer}</b>
            </div>
            <ha-entity-picker
              label="Værentitet (valgfri)"
              .hass=${this.hass}
              .value=${cfg.vaer || ""}
              .includeDomains=${["weather"]}
              @value-changed=${(e) => this._update("vaer", e.detail.value)}
            ></ha-entity-picker>
          </div>
        </ha-expansion-panel>

        <!-- PERSONER -->
        <ha-expansion-panel outlined expanded>
          <div slot="header" class="header">
            <ha-icon icon="mdi:account-group"></ha-icon>
            <span>Personer</span>
            <span class="count">${(cfg.persons || []).length}</span>
          </div>
          <div class="body">
            ${(cfg.persons || []).map(
              (p, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${this._personLabel(p, i)}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("persons", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-entity-picker
                    label="Person-entitet"
                    .hass=${this.hass}
                    .value=${p.person || ""}
                    .includeDomains=${["person"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "person", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-entity-picker
                    label="Hjemme/borte-entitet"
                    .hass=${this.hass}
                    .value=${p.presence_switch || ""}
                    .includeDomains=${["switch", "input_boolean"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "presence_switch", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-entity-picker
                    label="Søvn-entitet (valgfri)"
                    .hass=${this.hass}
                    .value=${p.sleep_switch || ""}
                    .includeDomains=${["switch", "input_boolean"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "sleep_switch", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-textfield
                    label="Visningsnavn (valgfri)"
                    .value=${p.display_name || ""}
                    @input=${(e) =>
                      this._updateList("persons", i, "display_name", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Naviger til ved langt trykk (valgfri, f.eks. #helse)"
                    .value=${p.hold_navigation_path || ""}
                    @input=${(e) =>
                      this._updateList("persons", i, "hold_navigation_path", e.target.value)}
                  ></ha-textfield>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() =>
                this._addToList("persons", {
                  person: "",
                  presence_switch: "",
                  sleep_switch: "",
                  display_name: "",
                  hold_navigation_path: "",
                })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til person
            </mwc-button>
          </div>
        </ha-expansion-panel>

        <!-- SONER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:map-marker-radius"></ha-icon>
            <span>Soner</span>
            <span class="count">${(cfg.locations || []).length}</span>
          </div>
          <div class="body">
            ${(cfg.locations || []).map(
              (l, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${this._zoneLabel(l, i)}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("locations", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-entity-picker
                    label="Sone"
                    .hass=${this.hass}
                    .value=${l.zone || ""}
                    .includeDomains=${["zone"]}
                    @value-changed=${(e) =>
                      this._updateList("locations", i, "zone", e.detail.value)}
                  ></ha-entity-picker>
                  <div class="field-row">
                    <ha-icon-picker
                      label="Ikon"
                      .hass=${this.hass}
                      .value=${l.icon || ""}
                      @value-changed=${(e) =>
                        this._updateList("locations", i, "icon", e.detail.value)}
                    ></ha-icon-picker>
                    <div class="color-field">
                      <div class="swatch" style=${l.color ? `background: ${l.color}` : ""}></div>
                      <ha-textfield
                        label="Farge"
                        .value=${l.color || ""}
                        @input=${(e) =>
                          this._updateList("locations", i, "color", e.target.value)}
                      ></ha-textfield>
                    </div>
                  </div>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() =>
                this._addToList("locations", {
                  zone: "",
                  icon: "mdi:map-marker",
                  color: "var(--blue)",
                })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til sone
            </mwc-button>
            <div class="hint">
              Kortet matcher personens tilstand mot sonens visningsnavn,
              entity_id eller slug.
            </div>
          </div>
        </ha-expansion-panel>

        <!-- UTSEENDE -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:palette-outline"></ha-icon>
            <span>Utseende</span>
          </div>
          <div class="body">
            <div class="field-row">
              ${this._number("Avatar-størrelse", "avatar_size", 50)}
              ${this._number("Badge-størrelse", "badge_size", 20)}
            </div>
            <div class="field-row">
              ${this._number("Mellomrom mellom personer", "persons_gap", 12)}
              ${this._text("Kantavstand", "card_padding")}
            </div>
            <div class="hint">
              Kantavstand skrives som CSS, f.eks. 12px 8px. Øk den om badgen
              blir klippet på smale skjermer.
            </div>
            ${this._switch("Vis navn under bildet", "show_names")}
            ${cfg.show_names !== false
              ? html`
                  <div class="field-row">
                    ${this._number("Skriftstørrelse navn", "name_font_size", 11)}
                    ${this._color("Farge navn", "name_color")}
                  </div>
                `
              : ""}

            <div class="subheading">Badge når hjemme</div>
            <div class="field-row">
              ${this._icon("Ikon", "home_icon")} ${this._color("Farge", "home_color")}
            </div>
            ${this._switch("Vis søvntilstand i stedet når personen er hjemme", "show_sleep_badge")}
            ${this._config.show_sleep_badge !== false
              ? html`
                  <div class="field-row">
                    ${this._icon("Ikon sover", "sleep_icon")} ${this._color("Farge sover", "sleep_color")}
                  </div>
                  <div class="field-row">
                    ${this._icon("Ikon våken", "awake_icon")} ${this._color("Farge våken", "awake_color")}
                  </div>
                `
              : ""}
            <div class="subheading">Badge når ingen sone treffer</div>
            <div class="field-row">
              ${this._icon("Ikon", "default_icon")} ${this._color("Farge", "default_color")}
            </div>
          </div>
        </ha-expansion-panel>

        <!-- HANDLINGER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:gesture-tap"></ha-icon>
            <span>Handlinger</span>
          </div>
          <div class="body">
            ${this._select(
              "Kort trykk på en person",
              "tap_behavior",
              [
                { value: "dialog", label: "Åpne popup" },
                { value: "toggle", label: "Veksle hjemme/borte direkte" },
              ],
              "dialog"
            )}
            ${this._text("Naviger til ved langt trykk på en person", "navigation_path")}

            <div class="subheading">Vibrasjon</div>
            ${this._switch("Vibrasjonsrespons ved trykk og hold", "haptic")}
            ${cfg.haptic !== false
              ? html`
                  <div class="field-row">
                    ${this._select("Ved trykk", "haptic_tap", hapticTypes, "light")}
                    ${this._select("Ved hold", "haptic_hold", hapticTypes, "medium")}
                  </div>
                  <div class="hint">
                    På iOS virker vibrasjon bare i Home Assistant-appen, ikke i
                    Safari.
                  </div>
                `
              : ""}
          </div>
        </ha-expansion-panel>

        <!-- POPUP -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:card-account-details-outline"></ha-icon>
            <span>Popup</span>
          </div>
          <div class="body">
            <div class="subheading">Valgknapper</div>
            ${this._labelRow(
              "dialog_home_icon",
              "Ikon hjemme",
              "home_label",
              "Tekst hjemme",
              "home_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_away_icon",
              "Ikon borte",
              "away_label",
              "Tekst borte",
              "away_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_awake_icon",
              "Ikon våken",
              "awake_label",
              "Tekst våken",
              "awake_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_asleep_icon",
              "Ikon sover",
              "asleep_label",
              "Tekst sover",
              "asleep_active_color",
              "Aktiv farge"
            )}

            <div class="subheading">Tekstfarge på aktiv knapp</div>
            <div class="field-row">
              ${this._color("Hjemme", "home_active_text_color")}
              ${this._color("Borte", "away_active_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Våken", "awake_active_text_color")}
              ${this._color("Sover", "asleep_active_text_color")}
            </div>

            <div class="subheading">Dialogen</div>
            <div class="field-row">
              ${this._color("Bakgrunn", "dialog_background")}
              ${this._color("Tekst", "dialog_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Bakgrunn valgrad", "dialog_track_color")}
              ${this._color("Inaktiv tekst", "dialog_inactive_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Aktiv standardfarge", "dialog_active_color")}
              ${this._color("Aktiv standardtekst", "dialog_active_text_color")}
            </div>
            ${this._text("Tekst på lukkeknappen", "done_label")}
            <div class="hint">
              Tomme felter arver fra temaet: gray000, gray100, gray800,
              gray1000, active-big og black. Hex-verdier må stå i fnutter i
              YAML, ellers leses # som kommentar.
            </div>
          </div>
        </ha-expansion-panel>

        <!-- PROFILER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:cellphone-cog"></ha-icon>
            <span>Profiler</span>
            <span class="count">${(cfg.profiles || []).length}</span>
          </div>
          <div class="body">
            <div class="hint">
              En profil overstyrer innstillingene over når den matcher enheten.
              Alle kriteriene du fyller ut må stemme, og første treff vinner.
              Tomme felter arves fra standardoppsettet.
            </div>
            ${(cfg.profiles || []).map(
              (p, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${p.name || `Profil ${i + 1}`}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("profiles", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-textfield
                    label="Navn på profilen"
                    .value=${p.name || ""}
                    @input=${(e) => this._updateProfile(i, "name", e.target.value)}
                  ></ha-textfield>

                  <div class="subheading">Matcher når</div>
                  <ha-textfield
                    label="Modell (Android, f.eks. Pixel 9 Pro Fold)"
                    .value=${p.model || ""}
                    @input=${(e) => this._updateProfile(i, "model", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Enhet (del av user agent, f.eks. iPhone)"
                    .value=${p.user_agent || ""}
                    @input=${(e) => this._updateProfile(i, "user_agent", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Innlogget bruker (fornavn)"
                    .value=${p.user || ""}
                    @input=${(e) => this._updateProfile(i, "user", e.target.value)}
                  ></ha-textfield>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Minste bredde"
                      .value=${p.min_width ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "min_width", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Største bredde"
                      .value=${p.max_width ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "max_width", e.target.value)}
                    ></ha-textfield>
                  </div>

                  <div class="subheading">Overstyrer</div>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Avatar-størrelse"
                      .value=${p.avatar_size ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "avatar_size", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Badge-størrelse"
                      .value=${p.badge_size ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "badge_size", e.target.value)}
                    ></ha-textfield>
                  </div>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Mellomrom"
                      .value=${p.persons_gap ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "persons_gap", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Skriftstørrelse hilsen"
                      .value=${p.greeting_font_size ?? ""}
                      @input=${(e) =>
                        this._updateProfileNumber(i, "greeting_font_size", e.target.value)}
                    ></ha-textfield>
                  </div>
                  <ha-textfield
                    label="Kantavstand"
                    .value=${p.card_padding || ""}
                    @input=${(e) => this._updateProfile(i, "card_padding", e.target.value)}
                  ></ha-textfield>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() => this._addToList("profiles", { name: "Ny profil", model: "" })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til profil
            </mwc-button>
            ${this._switch("Vis feilsøkingsinfo i kortet", "debug", false)}
            <div class="hint">
              Feilsøkingsinfoen viser bredde, modell, bruker og hvilken profil
              som traff — åpne dashbordet på enheten og les av verdiene der.
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      ha-expansion-panel {
        border-radius: 12px;
        --expansion-panel-summary-padding: 0 14px;
        --expansion-panel-content-padding: 0;
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .header ha-icon {
        color: var(--secondary-text-color);
        --mdc-icon-size: 20px;
      }
      .count {
        margin-left: auto;
        font-size: 12px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }
      .body {
        padding: 4px 14px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .subheading {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        opacity: 0.6;
        margin-top: 6px;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-items: end;
      }
      .field-row.three {
        grid-template-columns: 1fr 1fr 1fr;
      }
      @media (max-width: 560px) {
        .field-row,
        .field-row.three {
          grid-template-columns: 1fr;
        }
      }
      .field-row > * {
        min-width: 0;
      }
      .color-field {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .color-field ha-textfield {
        flex: 1;
        min-width: 0;
      }
      .color-field {
        position: relative;
        flex-wrap: wrap;
      }
      .swatch {
        flex: none;
        width: 34px;
        height: 34px;
        padding: 0;
        border-radius: 10px;
        border: 1px solid var(--divider-color);
        cursor: pointer;
        background-image: linear-gradient(45deg, var(--divider-color) 25%, transparent 25%),
          linear-gradient(-45deg, var(--divider-color) 25%, transparent 25%);
        background-size: 8px 8px;
      }
      .palett {
        flex-basis: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 8px;
        border-radius: 12px;
        background: var(--secondary-background-color, rgba(127, 127, 127, 0.12));
      }
      .pfarge {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
      }
      .pfarge.valgt {
        border-color: var(--primary-text-color);
      }
      .pegen {
        position: relative;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px dashed var(--divider-color);
        display: grid;
        place-items: center;
        cursor: pointer;
        --mdc-icon-size: 16px;
      }
      .pegen input {
        position: absolute;
        inset: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
      }
      .parv {
        margin-left: auto;
        border: 0;
        background: none;
        color: var(--primary-color);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 2px 0;
      }
      ha-textfield,
      ha-select,
      ha-icon-picker,
      ha-entity-picker {
        display: block;
        width: 100%;
      }
      .item {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--card-background-color);
      }
      .item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 600;
      }
      .item-header span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      mwc-icon-button {
        --mdc-icon-button-size: 34px;
        flex: none;
        color: var(--error-color, red);
      }
      mwc-button {
        align-self: flex-start;
      }
      mwc-button ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 6px;
      }
      .hint {
        font-size: 12px;
        line-height: 1.45;
        opacity: 0.7;
      }
    `;
  }
}

customElements.define("family-status-card-editor", FamilyStatusCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "family-status-card",
  name: "Family Status Card",
  description:
    "Hilsen + familiemedlemmers hjemme/borte-status med tilpassbare soner, navn og størrelser. Trykk på en person åpner en popup for hjemme/borte og våken/sover.",
});
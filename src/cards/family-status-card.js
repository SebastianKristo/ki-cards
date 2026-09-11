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

class FamilyStatusCard extends LitElement {
  static get properties() {
    return { hass: {}, config: {}, _dialogIndex: {} };
  }

  constructor() {
    super();
    this._dialogIndex = null;
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
  _greetingText() {
    const text = this.cfg.greeting || "";
    return text.replace(/\{(name|user|first_name)\}/g, this._firstName());
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
    if (path.startsWith("#")) {
      window.location.hash = path;
      return;
    }
    history.pushState(null, "", path);
    this._fire("location-changed", { replace: false });
  }

  /**
   * Finner sonen som matcher personens nåværende tilstand.
   * Matcher mot sonens friendly_name, entity_id, eller slug for å tåle
   * ulike varianter.
   */
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

    const match = (cfg.locations || []).find((l) => {
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

  _closeDialog() {
    this._dialogIndex = null;
    window.removeEventListener("keydown", this._onKeyDown);
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

  _onGreetingPointerDown() {
    this._greetingTimer = window.setTimeout(() => {
      this._greetingTimer = null;
      const entity = this.cfg.greeting_hold_entity;
      if (entity) {
        this._haptic(this.cfg.haptic_hold);
        this.hass.callService("homeassistant", "toggle", { entity_id: entity });
      }
    }, 500);
  }

  _onGreetingPointerUp() {
    if (this._greetingTimer) {
      window.clearTimeout(this._greetingTimer);
      this._greetingTimer = null;
      this._haptic(this.cfg.haptic_tap);
      this._navigate(this.cfg.greeting_navigation_path);
    }
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
          <div
            class="greeting"
            @pointerdown=${() => this._onGreetingPointerDown()}
            @pointerup=${() => this._onGreetingPointerUp()}
            @pointerleave=${() => this._onGreetingPointerCancel()}
            @contextmenu=${(e) => e.preventDefault()}
          >
            ${this._greetingText()}
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
      <div class="backdrop" @click=${(e) => this._onBackdropClick(e)}>
        <div
          class="dialog"
          role="dialog"
          aria-label=${name}
          style=${dialogStyle}
          @click=${(e) => e.stopPropagation()}
        >
          <div
            class="dialog-avatar"
            style=${picture ? `background-image:url(${picture})` : ""}
          ></div>
          <div class="dialog-name">${name}</div>

          ${personConfig.presence_switch
            ? html`
                <div class="segment">
                  <button
                    class="seg ${isHome ? "active" : ""}"
                    style=${isHome
                      ? segStyle(cfg.home_active_color, cfg.home_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.presence_switch, true)}
                  >
                    <ha-icon icon=${cfg.dialog_home_icon}></ha-icon>
                    <span>${cfg.home_label}</span>
                  </button>
                  <button
                    class="seg ${!isHome ? "active" : ""}"
                    style=${!isHome
                      ? segStyle(cfg.away_active_color, cfg.away_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.presence_switch, false)}
                  >
                    <ha-icon icon=${cfg.dialog_away_icon}></ha-icon>
                    <span>${cfg.away_label}</span>
                  </button>
                </div>
              `
            : ""}
          ${personConfig.sleep_switch
            ? html`
                <div class="segment">
                  <button
                    class="seg ${!isAsleep ? "active" : ""}"
                    style=${!isAsleep
                      ? segStyle(cfg.awake_active_color, cfg.awake_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.sleep_switch, false)}
                  >
                    <ha-icon icon=${cfg.dialog_awake_icon}></ha-icon>
                    <span>${cfg.awake_label}</span>
                  </button>
                  <button
                    class="seg ${isAsleep ? "active" : ""}"
                    style=${isAsleep
                      ? segStyle(cfg.asleep_active_color, cfg.asleep_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.sleep_switch, true)}
                  >
                    <ha-icon icon=${cfg.dialog_asleep_icon}></ha-icon>
                    <span>${cfg.asleep_label}</span>
                  </button>
                </div>
              `
            : ""}

          <button
            class="done"
            @click=${() => {
              this._haptic(this.cfg.haptic_tap);
              this._closeDialog();
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
      .dialog {
        position: relative;
        width: min(340px, 100%);
        margin-top: 44px;
        padding: 60px 20px 20px;
        border-radius: 28px;
        background: var(
          --fsc-dialog-bg,
          var(--gray000, var(--ha-card-background, var(--card-background-color)))
        );
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fsc-pop 180ms cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .dialog-avatar {
        position: absolute;
        top: -44px;
        left: 50%;
        transform: translateX(-50%);
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: var(--gray200, var(--secondary-background-color));
      }
      .dialog-name {
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
        margin-bottom: 4px;
      }
      .segment {
        display: flex;
        gap: 6px;
        padding: 5px;
        border-radius: 999px;
        background: var(--fsc-dialog-track, var(--gray100, var(--secondary-background-color)));
      }
      .seg {
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
        transition: background 140ms ease, color 140ms ease;
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
        background: var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
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
          transform: scale(0.94);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .dialog {
          animation: none;
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

  _color(label, field) {
    const value = this._config[field] || "";
    return html`
      <div class="color-field">
        <div
          class="swatch"
          style=${value ? `background: ${value}` : ""}
          title=${value || "Arver fra temaet"}
        ></div>
        <ha-textfield
          label=${label}
          .value=${value}
          @input=${(e) => this._update(field, e.target.value)}
        ></ha-textfield>
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
            ${this._text("Naviger til ved trykk", "greeting_navigation_path")}
            <ha-entity-picker
              label="Veksle ved langt trykk (valgfri)"
              .hass=${this.hass}
              .value=${cfg.greeting_hold_entity || ""}
              .includeDomains=${["input_boolean", "switch"]}
              @value-changed=${(e) => this._update("greeting_hold_entity", e.detail.value)}
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
      .swatch {
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background-image: linear-gradient(45deg, var(--divider-color) 25%, transparent 25%),
          linear-gradient(-45deg, var(--divider-color) 25%, transparent 25%);
        background-size: 8px 8px;
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
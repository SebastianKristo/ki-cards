/* ki-cards – felles grunnlag. Lastes først i bundle. */
window.KI = window.KI || {};
(function (KI) {
  KI.VERSION = "1.2.1";

  KI.css = `
    :host { display:block; }
    *, *::before, *::after { box-sizing:border-box; }
    .card {
      border-radius: 22px;
      background: var(--ki-bg, var(--gray200));
      color: var(--gray1000);
      font-family: inherit;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .press { cursor:pointer; transition: transform .08s ease, filter .15s ease; }
    .press:active { transform: scale(.985); filter: brightness(1.08); }
    .icon-wrap {
      width: 40px; height: 40px; border-radius: 50%;
      display:flex; align-items:center; justify-content:center;
      background: var(--gray100); color: var(--gray1000);
      flex: none;
    }
    .icon-wrap.on { background: var(--active-big); color: rgba(70,58,64,.95); }
    ha-icon { --mdc-icon-size: 22px; }
    .name { font-size:14px; font-weight:500; line-height:1.2; }
    .label { font-size:12px; font-weight:500; opacity:.65; line-height:1.2; margin-top:2px; }
    .state { font-size:13px; font-weight:500; opacity:.7; white-space:nowrap; }
    .state.on { opacity:1; }
    .section { font-size:13px; font-weight:600; opacity:.55; padding:4px 2px 2px; color:var(--gray1000); }
    @media (prefers-reduced-motion: reduce) { .press { transition:none; } }
  `;

  KI.fire = (el, type, detail) =>
    el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  KI.moreInfo = (el, entityId) => KI.fire(el, "hass-more-info", { entityId });
  KI.toggle = (hass, entityId) =>
    hass.callService("homeassistant", "toggle", { entity_id: entityId });

  /* Tap = kort trykk, hold = >500 ms. Hindrer dobbel-utløsning på touch. */
  KI.bindPress = (el, onTap, onHold) => {
    let timer = null, held = false, active = false, touch = false;
    const start = (e) => {
      if (e.type === "touchstart") touch = true;
      if (e.type === "mousedown" && (touch || e.button !== 0)) return;
      active = true; held = false;
      timer = setTimeout(() => { held = true; onHold && onHold(); }, 500);
    };
    const end = (e) => {
      if (e.type === "mouseup" && touch) return;
      if (!active) return;
      active = false; clearTimeout(timer);
      if (!held) onTap && onTap();
      if (e.cancelable) e.preventDefault();
    };
    const cancel = () => { active = false; clearTimeout(timer); };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end);
    el.addEventListener("touchmove", cancel, { passive: true });
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", cancel);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };

  KI.glob = (pattern, str) => {
    if (!pattern) return true;
    const re = new RegExp("^" + pattern.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return re.test(str);
  };

  KI.friendly = (hass, id, fallback) => {
    const s = hass && hass.states[id];
    return (s && s.attributes.friendly_name) || fallback || id;
  };

  KI.createCard = async (config) => {
    const helpers = await window.loadCardHelpers();
    return helpers.createCardElement(config);
  };

  KI.register = (type, name, description) => {
    const documentationURL = "https://github.com/SebastianKristo/ki-cards#" + type;
    window.customCards = window.customCards || [];
    window.customCards.push({ type, name, description, preview: false, documentationURL });
  };

  /* Basisklasse: renderer på nytt bare når _key() endrer seg. */
  KI.Card = class extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._lastKey = null; }
    setConfig(config) {
      if (!config) throw new Error("Mangler config");
      this._config = config; this._lastKey = null;
      if (this._hass) this._maybeRender();
    }
    set hass(hass) { this._hass = hass; this._maybeRender(); this._passHass && this._passHass(hass); }
    get hass() { return this._hass; }
    st(id) { return this._hass ? this._hass.states[id] : undefined; }
    on(id) { const s = this.st(id); return !!s && s.state === "on"; }
    val(id) { const s = this.st(id); return s ? s.state : "—"; }
    _maybeRender() {
      const k = this._key();
      if (k === this._lastKey) return;
      this._lastKey = k; this._render();
    }
    _key() { return ""; }
    _render() {}
    getCardSize() { return 1; }
  };

  console.info(`%c KI-CARDS %c v${KI.VERSION} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");
})(window.KI);

/* ki-cards – felles grunnlag. Lastes først i bundle. */
window.KI = window.KI || {};
(function (KI) {
  KI.VERSION = "2.4.0";

  KI.css = `
    :host { display:block; min-width:0; max-width:100%; }
    *, *::before, *::after { box-sizing:border-box; min-width:0; }
    .card {
      border-radius: 22px;
      max-width:100%; overflow:hidden;
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
    .chip { font-size:12px; font-weight:500; padding:4px 10px; border-radius:999px; background:var(--gray100); color:var(--gray1000); opacity:.6; white-space:nowrap; }
    .chip.on { background:var(--active-big); color:rgba(70,58,64,.95); opacity:1; }
    .chip.warn { background:var(--yellow); color:var(--black); opacity:1; }
    .chip.bad { background:var(--red); color:#fff; opacity:1; }
    .btn { display:flex; align-items:center; justify-content:center; gap:8px; height:46px; border-radius:16px; padding:0 16px;
      background:var(--gray100); color:var(--gray1000); font-size:14px; font-weight:600; --mdc-icon-size:20px; cursor:pointer; }
    .btn.primary { background:var(--active-big); color:rgba(70,58,64,.95); }
    .btn.danger { background:var(--red); color:#fff; }
    .sw { width:44px; height:26px; border-radius:13px; background:var(--gray100); position:relative; flex:none; transition:background .2s; cursor:pointer; }
    .sw.on { background:var(--active-big); }
    .sw.disabled { opacity:.3; pointer-events:none; }
    .sw i { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform .2s; }
    .sw.on i { transform:translateX(18px); }
    .empty { font-size:13px; opacity:.6; padding:10px 12px; line-height:1.5; }
    .group { background:var(--gray100); border-radius:16px; padding:6px; display:grid; gap:4px; }
    .group .section { padding:6px 10px 2px; }
    .kv { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:40px; padding:0 10px; }
    .kv .k { font-size:13px; font-weight:500; opacity:.85; }
    .kv .v { font-size:13px; opacity:.6; font-variant-numeric:tabular-nums; }
    .disclosure { display:flex; align-items:center; justify-content:space-between; min-height:44px; padding:0 4px 0 12px; border-radius:14px; cursor:pointer; }
    .disclosure ha-icon { opacity:.5; transition:transform .2s; --mdc-icon-size:22px; }
    .disclosure.open ha-icon { transform:rotate(180deg); }
    .empty code { font-size:12px; opacity:.85; }
    input[type=time] { font:inherit; font-size:14px; font-weight:500; color:var(--gray1000); background:var(--gray100);
      border:0; border-radius:10px; padding:6px 10px; color-scheme:dark; min-width:0; }
    input[type=time]:focus-visible { outline:2px solid var(--active-big); }
    @media (prefers-reduced-motion: reduce) { .press { transition:none; } }
  `;

  /* Felles stil for "pro"-kortene – samme språk som ki-energi-card / ki-klima-pro-card */
  KI.pro = `
    :host { display:block; min-width:0; max-width:100%; }
    *, *::before, *::after { box-sizing:border-box; min-width:0; }
    .wrap { display:flex; flex-direction:column; gap:10px; color:var(--gray1000, var(--primary-text-color)); max-width:100%; overflow:hidden; }
    .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
    .hero { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px; background:var(--gray200); border-radius:24px; padding:16px; }
    .ring { position:relative; width:88px; height:88px; cursor:pointer; }
    .ring svg { width:88px; height:88px; transform:rotate(-90deg); }
    .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
    .ring-spor { stroke:rgba(128,128,128,.24); }
    .ring-fyll { stroke:var(--green,#4caf50); transition:stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1); }
    .ring-fyll.gul { stroke:var(--yellow,#f2c94c); } .ring-fyll.rod { stroke:var(--red,#f44336); } .ring-fyll.aktiv { stroke:var(--active-big); } .ring-fyll.av { stroke:rgba(128,128,128,.5); }
    .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
    .ring-tall span { font-size:13px; opacity:.6; margin-left:1px; }
    .ring-tall.liten { font-size:19px; }
    .hero-navn { font-size:19px; font-weight:600; }
    .hero-forklaring { font-size:13.5px; opacity:.72; line-height:1.4; margin-top:3px; }
    .merke { font-size:11px; font-weight:600; padding:2px 7px; border-radius:75px; background:rgba(128,128,128,.28); vertical-align:middle; }
    .merke.gul { background:rgba(242,201,76,.35); } .merke.rod { background:rgba(244,67,54,.3); }
    .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px; background:var(--gray200); }
    .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500; cursor:pointer; opacity:.6; transition:background .18s ease, opacity .18s ease; }
    .switch-valg.aktiv { background:var(--active-small, var(--active-big)); color:var(--gray100,#fafbfc); opacity:1; }
    .blokk { background:var(--gray200); border-radius:24px; padding:8px 14px 14px; }
    .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px; font-size:13px; font-weight:600; opacity:.55; padding:8px 4px; }
    .blokk-sub { font-weight:500; text-align:right; }
    .tall-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .tall { background:rgba(128,128,128,.12); border-radius:16px; padding:10px 6px; text-align:center; }
    .tall b { display:block; font-size:18px; font-variant-numeric:tabular-nums; } .tall span { font-size:11.5px; opacity:.6; }
    .spor { height:10px; border-radius:6px; background:rgba(128,128,128,.24); overflow:hidden; margin:10px 0 6px; position:relative; }
    .fyll { height:100%; background:var(--active-big); transition:width .5s ease; }
    .fyll.gul { background:var(--yellow); } .fyll.rod { background:var(--red); } .fyll.gronn { background:var(--green); }
    .spor .strek { position:absolute; top:0; bottom:0; width:2px; background:var(--gray1000); opacity:.45; }
    .under { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; opacity:.6; }
    .notat { font-size:12.5px; opacity:.6; padding:8px 2px 0; line-height:1.4; }
    .last { border-radius:18px; background:rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
    .last:last-child { margin-bottom:0; }
    .last-hode { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px; padding:10px; cursor:pointer; }
    .last-hode.med-bryter { grid-template-columns:14px 1fr auto auto; }
    .last-navn { font-size:14.5px; font-weight:500; }
    .last-forklaring { font-size:12.5px; opacity:.62; line-height:1.35; }
    .last-verdi { font-size:13.5px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }
    .last-verdi small { display:block; font-size:11px; font-weight:500; opacity:.55; }
    .last-kropp { display:none; padding:0 10px 10px; }
    .last.apen .last-kropp { display:block; }
    .last-fakta { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; opacity:.85; padding-bottom:8px; }
    .last-fakta span { background:rgba(128,128,128,.16); padding:3px 9px; border-radius:75px; }
    .last-fakta span.b-nei { opacity:.45; text-decoration:line-through; }
    .b-ok { background:rgba(76,175,80,.25) !important; } .b-advarsel { background:rgba(252,109,9,.25) !important; } .b-feil { background:rgba(244,67,54,.25) !important; }
    .prikk { width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,.4); }
    .p-ok { background:var(--green,#4caf50); } .p-advarsel { background:var(--yellow,#f2c94c); } .p-feil { background:var(--red,#f44336); } .p-aktiv { background:var(--active-big); }
    .rad { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 2px; }
    .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
    .rad-navn { font-size:14.5px; } .rad-sub { font-size:12px; opacity:.55; line-height:1.3; }
    .rad-verdi { font-size:13.5px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
    .rad.dim { opacity:.45; }
    .bryter { width:46px; height:28px; min-width:46px; border-radius:75px; background:rgba(128,128,128,.28); cursor:pointer; position:relative; transition:background .18s ease; }
    .bryter.on { background:var(--active-big); }
    .bryter span { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition:transform .18s ease; }
    .bryter.on span { transform:translateX(18px); } .bryter.mangler { opacity:.35; pointer-events:none; }
    .knapper { display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; }
    .knapp { flex:1; min-width:120px; text-align:center; padding:11px 14px; border-radius:75px; font-size:14px; font-weight:600; cursor:pointer; background:rgba(128,128,128,.18); }
    .knapp.primar { background:var(--active-big); color:rgba(70,58,64,.95); } .knapp.fjern { background:rgba(244,67,54,.22); }
    .knapp.press:active { filter:brightness(1.1); }
    .dager { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; padding:2px 0 6px; }
    .dag { height:38px; border-radius:12px; background:rgba(128,128,128,.14); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; opacity:.5; cursor:pointer; }
    .dag.on { background:var(--yellow); color:var(--black); opacity:1; }
    .dag.idag { box-shadow:inset 0 0 0 2px rgba(255,255,255,.4); }
    input[type=time] { font:inherit; font-size:14px; font-weight:600; color:var(--gray1000); background:rgba(128,128,128,.18); border:0; border-radius:10px; padding:6px 10px; color-scheme:dark; min-width:0; width:92px; text-align:center; }
    input[type=time]::-webkit-calendar-picker-indicator { display:none; }
    input[type=time]:focus-visible { outline:2px solid var(--active-big); }
    input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none; background:linear-gradient(to right, var(--active-big) 0 var(--p), rgba(128,128,128,.24) var(--p) 100%); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; cursor:grab; }
    input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
    .slider-rad { display:grid; grid-template-columns:110px 1fr 64px; align-items:center; gap:10px; padding:9px 2px; }
    .slider-rad + .slider-rad, .rad + .slider-rad, .slider-rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
    .tom { font-size:13px; opacity:.6; padding:10px 4px; line-height:1.5; }
    @media (prefers-reduced-motion: reduce) { .ring-fyll, .fyll, .bryter, .bryter span { transition:none; } }
  `;
  KI.ringHtml = (pct, txt, cls, entity) => { const o = 2 * Math.PI * 43; return `<div class="ring" ${entity ? `data-more="${entity}"` : ""}>
    <svg viewBox="0 0 100 100"><circle class="ring-spor" cx="50" cy="50" r="43"></circle>
    <circle class="ring-fyll ${cls || ""}" cx="50" cy="50" r="43" style="stroke-dasharray:${o};stroke-dashoffset:${o * (1 - Math.max(0, Math.min(100, pct)) / 100)}"></circle></svg>
    <div class="ring-tall ${String(txt).length > 3 ? "liten" : ""}">${txt}</div></div>`; };
  KI.sliderHtml = (hass, id, name, opts = {}) => { const s = hass.states[id]; if (!s) return ""; const a = s.attributes;
    const min = opts.min ?? a.min ?? 0, max = opts.max ?? a.max ?? 100, step = opts.step ?? a.step ?? 1, v = parseFloat(s.state);
    const unit = opts.unit ?? (a.unit_of_measurement ? " " + a.unit_of_measurement : ""); const pct = ((v - min) / (max - min)) * 100;
    return `<div class="slider-rad"><span class="rad-navn" data-more="${id}">${name}</span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${pct}%" data-range="${id}" data-unit="${unit}" data-min="${min}" data-max="${max}">
      <span class="rad-verdi" data-out="${id}">${v}${unit}</span></div>`; };
  /* Kobler opp data-more / data-toggle / data-press / data-range / data-time / .last-hode i et pro-kort */
  KI.wirePro = (card, root) => {
    const h = card._hass;
    root.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); KI.moreInfo(card, el.dataset.more); }));
    root.querySelectorAll("[data-toggle]").forEach(el => { const run = (e) => { e && e.stopPropagation(); KI.toggle(h, el.dataset.toggle); }; el.addEventListener("click", run); KI.key(el, run); });
    root.querySelectorAll("[data-press]").forEach(el => { const run = (e) => { e && e.stopPropagation(); if (el.dataset.confirm && !window.confirm(el.dataset.confirm)) return; KI.press(h, el.dataset.press); }; el.addEventListener("click", run); KI.key(el, run); });
    root.querySelectorAll("input[data-range]").forEach(inp => {
      const out = root.querySelector(`[data-out="${inp.dataset.range}"]`); const min = +inp.dataset.min, max = +inp.dataset.max;
      inp.addEventListener("input", () => { out.textContent = inp.value + inp.dataset.unit; inp.style.setProperty("--p", ((inp.value - min) / (max - min)) * 100 + "%"); });
      inp.addEventListener("change", () => h.callService(inp.dataset.range.split(".")[0], "set_value", { entity_id: inp.dataset.range, value: parseFloat(inp.value) }));
      inp.addEventListener("click", e => e.stopPropagation());
    });
    root.querySelectorAll("input[data-time]").forEach(inp => { inp.addEventListener("click", e => e.stopPropagation());
      inp.addEventListener("change", () => { if (inp.value) h.callService(inp.dataset.time.split(".")[0], "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" }); }); });
    root.querySelectorAll(".last-hode[data-open]").forEach(el => el.addEventListener("click", () => { const k = el.dataset.open; card._apen = card._apen === k ? null : k; card._lastKey = null; card._maybeRender(); }));
    root.querySelectorAll(".switch-valg").forEach(el => el.addEventListener("click", () => { card._view = el.dataset.view; card._lastKey = null; card._maybeRender(); }));
  };

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

  /* Finn entiteter etter attributter, f.eks. KI.find(hass, "binary_sensor", { integrasjon:"ki_sovn", type:"person" }) */
  KI.find = (hass, domain, attrs) => {
    if (!hass) return [];
    return Object.keys(hass.states).filter(id => {
      if (domain && !id.startsWith(domain + ".")) return false;
      const a = hass.states[id].attributes || {};
      return Object.keys(attrs).every(k => a[k] === attrs[k]);
    }).sort();
  };
  KI.navigate = (path) => { window.history.pushState(null, "", path); window.dispatchEvent(new Event("location-changed")); };
  KI.go = (c) => { if (c.navigation_path) KI.navigate(c.navigation_path); else if (c.hash) window.location.hash = c.hash; };
  KI.press = (hass, entityId) => hass.callService("button", "press", { entity_id: entityId });
  KI.key = (el, fn) => el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  KI.hhmm = (v) => (v && v !== "unknown" && v !== "unavailable") ? String(v).slice(0, 5) : "--:--";
  KI.rel = (iso) => {
    if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return "";
    const m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "nå"; if (m < 60) return `${m} min`; const h = Math.floor(m / 60);
    if (h < 24) return `${h} t${m % 60 ? " " + (m % 60) + " min" : ""}`; return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  };
  KI.clock = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }); };
  KI.esc = (s) => String(s ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

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

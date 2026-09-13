/* ki-sensor-liste-card – sensorer som brede piller, én per rad.
 *
 * Laget for å ligge inne i et expander-kort. Tar samme `zones:`-struktur som
 * ki-alarm-card og ki-sikkerhet-card, så sensorene defineres ett sted.
 *
 * type: custom:ki-sensor-liste-card
 * tittel: Dører                  # valgfri overskrift over lista
 * kolonner: 1                    # 1 = brede piller, 2 = to i bredden
 * batteri: true                  # vis batteriprosent under navnet
 * bare_aktive: false             # vis bare det som er åpent/ulåst/i bevegelse
 * zones: …                       # samme liste som i alarmkortet
 *   – eller –
 * kind: opening                  # opening | motion | lock
 * items:
 *   - entity: binary_sensor.verandador
 *     name: Verandadør
 *     battery: sensor.verandador_battery
 */
const KI_SLIST_VERSJON = "1.0.0";

const KI_SLIST_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }

  .rot { display:grid; gap:8px; }
  .tit { font-size:15px; font-weight:600; opacity:.75; padding:2px 4px; }

  .rutenett { display:grid; gap:8px; grid-template-columns:repeat(var(--kol,1), minmax(0,1fr)); }

  .pille { display:flex; align-items:center; gap:12px; min-height:62px; padding:10px 16px 10px 10px;
    border-radius:999px; background:var(--gray100); color:var(--gray1000);
    border:0; font-family:inherit; text-align:left; width:100%; cursor:pointer;
    transition:background .35s var(--myk), color .35s var(--myk), transform .08s ease; }
  .pille:active { transform:scale(.985); }
  .pille:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  .merke { width:42px; height:42px; border-radius:50%; flex:none;
    display:flex; align-items:center; justify-content:center;
    background:color-mix(in srgb, var(--gray1000) 10%, transparent);
    transition:background .35s var(--myk); }
  .merke ha-icon { --mdc-icon-size:22px; }

  .tekst { display:grid; gap:2px; min-width:0; }
  .navn { font-size:15px; font-weight:600; line-height:1.25;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .under { font-size:13px; font-weight:500; opacity:.68; line-height:1.25; }

  /* aktiv: åpen, ulåst eller bevegelse – fargen kommer fra sonen */
  .pille.aktiv { background:var(--tone,#8fd6a8); color:var(--pa-tekst,#1d2b21); }
  .pille.aktiv .under { opacity:.75; }
  .pille.aktiv .merke { background:color-mix(in srgb, #000 12%, transparent); }
  .pille.aktiv .merke ha-icon { animation:kiSLPust 2.6s ease-in-out infinite; }
  @keyframes kiSLPust { 0%,100% { transform:scale(1) } 50% { transform:scale(1.12) } }

  .pille.borte { opacity:.5; }
  .pille.borte .navn { text-decoration:line-through; }

  .lavt { font-weight:700; }
  .tom { font-size:13px; opacity:.6; padding:12px 6px; }

  @media (prefers-reduced-motion: reduce) {
    .pille, .merke, .merke ha-icon { animation:none !important; transition:none !important; }
  }
`;

const KI_SLIST_IKON = {
  opening: ["mdi:door-open", "mdi:door-closed"],
  motion: ["mdi:motion-sensor", "mdi:motion-sensor-off"],
  lock: ["mdi:lock-open-variant", "mdi:lock"],
};

const KI_SLIST_ESC = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiSensorListeCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { kind: "opening", items: [] }; }
  getCardSize() { return Math.max(1, Math.ceil(this._antall() / (this._c && this._c.kolonner === 2 ? 2 : 1))); }

  setConfig(c) {
    if (!c || (!c.zones && !c.items)) throw new Error("Sett enten zones: eller items:");
    this._c = { kolonner: 1, batteri: true, bare_aktive: false, ...c };
  }

  _antall() {
    if (!this._c) return 0;
    if (this._c.items) return this._c.items.length;
    return (this._c.zones || []).reduce((n, z) => n + (z.items || []).length, 0);
  }

  /* Både `zones:` og en enkel `items:`-liste ender opp som samme flate liste */
  _soner() {
    const c = this._c;
    if (c.items) return [{ title: c.tittel, icon: c.icon, color: c.color, kind: c.kind || "opening",
      active_text: c.active_text, idle_text: c.idle_text, items: c.items }];
    return c.zones || [];
  }

  _ids() {
    const ut = [];
    for (const z of this._soner()) for (const i of z.items || []) {
      if (i.entity) ut.push(i.entity);
      if (i.battery) ut.push(i.battery);
    }
    return ut;
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    if (!g || this._ids().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _rad(sone, i) {
    const st = this._h.states[i.entity];
    if (!st) return "";
    const s = st.state;
    const borte = s === "unavailable" || s === "unknown";
    const kind = sone.kind || "opening";
    const aktiv = !borte && (kind === "lock" ? s !== "locked" : ["on", "open", "detected"].includes(s));
    if (this._c.bare_aktive && !aktiv) return "";

    const [ikonPa, ikonAv] = KI_SLIST_IKON[kind] || KI_SLIST_IKON.opening;
    const ikon = i.icon || sone.icon || (aktiv ? ikonPa : ikonAv);
    const navn = i.name || (st.attributes && st.attributes.friendly_name) || i.entity;
    const tekst = borte ? "Uten svar"
      : aktiv ? (sone.active_text || "Aktiv") : (sone.idle_text || "Rolig");

    let bat = "";
    if (this._c.batteri && i.battery) {
      const b = this._h.states[i.battery];
      const n = b ? Number(b.state) : NaN;
      if (Number.isFinite(n)) bat = ` · <span class="${n <= 20 ? "lavt" : ""}">${Math.round(n)} %</span>`;
    }

    return `
      <button class="pille ${aktiv ? "aktiv" : ""} ${borte ? "borte" : ""}"
              style="${sone.color ? `--tone:${sone.color}` : ""}" data-mer="${KI_SLIST_ESC(i.entity)}">
        <span class="merke"><ha-icon icon="${KI_SLIST_ESC(ikon)}"></ha-icon></span>
        <span class="tekst">
          <span class="navn">${KI_SLIST_ESC(navn)}</span>
          <span class="under">${KI_SLIST_ESC(tekst)}${bat}</span>
        </span>
      </button>`;
  }

  _tegn() {
    const c = this._c;
    const blokker = this._soner().map((z) => {
      const rader = (z.items || []).map((i) => this._rad(z, i)).filter(Boolean).join("");
      if (!rader) return "";
      return `${z.title && !c.items ? `<div class="tit">${KI_SLIST_ESC(z.title)}</div>` : ""}
              <div class="rutenett">${rader}</div>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>${KI_SLIST_STIL}</style>
      <div class="rot" style="--kol:${c.kolonner === 2 ? 2 : 1}">
        ${c.tittel && c.items ? `<div class="tit">${KI_SLIST_ESC(c.tittel)}</div>` : ""}
        ${blokker || `<div class="tom">${c.bare_aktive ? "Alt er lukket og låst." : "Ingen sensorer å vise."}</div>`}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]"))
      el.addEventListener("click", () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true })));
  }
}

customElements.define("ki-sensor-liste-card", KiSensorListeCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sensor-liste-card"))
  window.customCards.push({ type: "ki-sensor-liste-card", name: "KI Sensorliste",
    description: "Sensorer som brede piller – for expander-kort", preview: true });

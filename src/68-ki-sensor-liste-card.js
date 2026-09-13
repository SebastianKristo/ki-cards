/* ki-sensor-liste-card – sensorer som brede piller, én per rad.
 *
 * Laget for å ligge inne i et expander-kort. Tar samme `zones:`-struktur som
 * ki-alarm-card og ki-sikkerhet-card, så sensorene defineres ett sted.
 *
 * type: custom:ki-sensor-liste-card
 * tittel: Dører                  # valgfri overskrift over lista
 * hode: true                     # sonehode med ikon, teller og sammenfolding
 * apnet: true                    # sonene starter utfoldet
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

  .rot { display:grid; gap:14px; }
  .sone { display:grid; gap:8px; }
  .tit { font-size:15px; font-weight:600; opacity:.75; padding:2px 4px; }

  /* sonehode: ikonmerke, tittel, teller og pil */
  .hode { display:flex; align-items:center; gap:12px; padding:2px 6px 2px 0;
    background:none; border:0; font-family:inherit; width:100%; cursor:pointer; color:inherit; }
  .hode:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:4px; border-radius:14px; }
  .hodemerke { width:40px; height:40px; border-radius:50%; flex:none;
    display:flex; align-items:center; justify-content:center;
    background:color-mix(in srgb, var(--gray1000) 10%, transparent); }
  .hodemerke ha-icon { --mdc-icon-size:21px; color:var(--gray1000); opacity:.75; }
  .hodemerke.aktiv ha-icon { color:var(--tone,#e0524a); opacity:1; }
  .hodenavn { font-size:19px; font-weight:700; flex:1; text-align:left; letter-spacing:-.01em; }
  .teller { font-size:14px; font-weight:600; opacity:.55; white-space:nowrap; }
  .teller.aktiv { opacity:1; color:var(--tone,#f0a952); }
  .pil { --mdc-icon-size:22px; opacity:.5; transition:transform .3s var(--myk); }
  .sone.lukket .pil { transform:rotate(-90deg); }

  .kropp { display:grid; gap:8px; overflow:hidden; }
  .sone.lukket .kropp { display:none; }

  .rutenett { display:grid; gap:8px; grid-template-columns:repeat(var(--kol,1), minmax(0,1fr)); }

  .pille { display:flex; align-items:center; gap:14px; min-height:70px; padding:12px 18px 12px 12px;
    border-radius:26px; background:var(--gray100); color:var(--gray1000);
    border:0; font-family:inherit; text-align:left; width:100%; cursor:pointer;
    transition:background .35s var(--myk), color .35s var(--myk), transform .08s ease; }
  .pille:active { transform:scale(.985); }
  .pille:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  .merke { width:46px; height:46px; border-radius:50%; flex:none;
    display:flex; align-items:center; justify-content:center;
    background:color-mix(in srgb, var(--gray1000) 10%, transparent);
    transition:background .35s var(--myk); }
  .merke ha-icon { --mdc-icon-size:23px; }

  .tekst { display:grid; gap:2px; min-width:0; }
  .navn { font-size:17px; font-weight:700; line-height:1.25; letter-spacing:-.01em;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .under { font-size:15px; font-weight:500; opacity:.62; line-height:1.3; }

  /* aktiv: åpen, ulåst eller bevegelse – fargen kommer fra sonen */
  .pille.aktiv { background:var(--tone,#8fd6a8); color:var(--pa-tekst,#1d2b21); }
  .pille.aktiv .under { opacity:.75; }
  .pille.aktiv .merke { background:color-mix(in srgb, #fff 22%, transparent); }
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
    this._c = { kolonner: 1, batteri: true, bare_aktive: false, hode: true, apnet: true, ...c };
    this._lukket = this._lukket || {};
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

  _aktiv(sone, i) {
    const st = this._h.states[i.entity];
    if (!st || ["unavailable", "unknown"].includes(st.state)) return false;
    return (sone.kind || "opening") === "lock"
      ? st.state !== "locked" : ["on", "open", "detected"].includes(st.state);
  }

  /* «1 åpen», «2 åpne», «1 ulåst», «3 i bevegelse».
   * Norsk bøyning lar seg ikke gjette fra endelsen – «åpent» skal bli «åpne»,
   * ikke «åpente» – så vi bruker en tabell, og `teller_tekst` i sonen overstyrer. */
  _tellenavn(sone, n) {
    if (sone.teller_tekst) {
      const d = [].concat(sone.teller_tekst);
      return n === 1 ? d[0] : (d[1] || d[0]);
    }
    const kind = sone.kind || "opening";
    if (kind === "lock") return n === 1 ? "ulåst" : "ulåste";
    if (kind === "motion") return "i bevegelse";
    return n === 1 ? "åpen" : "åpne";
  }

  _roligtekst(sone) {
    const kind = sone.kind || "opening";
    if (kind === "lock") return "Alt låst";
    if (kind === "motion") return "Alt stille";
    return "Alt lukket";
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
    const blokker = this._soner().map((z, zi) => {
      const rader = (z.items || []).map((i) => this._rad(z, i)).filter(Boolean).join("");
      if (!rader) return "";
      const lukket = this._lukket[zi] ?? !c.apnet;
      const kropp = `<div class="kropp"><div class="rutenett">${rader}</div></div>`;
      if (!c.hode || (!z.title && !c.items)) return `<div class="sone">${kropp}</div>`;

      const n = (z.items || []).filter((i) => this._aktiv(z, i)).length;
      const tell = n ? `${n} ${this._tellenavn(z, n)}` : (z.tom_text || this._roligtekst(z));
      return `
        <div class="sone ${lukket ? "lukket" : ""}" style="${z.color ? `--tone:${z.color}` : ""}">
          <button class="hode" data-sone="${zi}" aria-expanded="${!lukket}">
            <span class="hodemerke ${n ? "aktiv" : ""}"><ha-icon icon="${KI_SLIST_ESC(z.icon || "mdi:shape-outline")}"></ha-icon></span>
            <span class="hodenavn">${KI_SLIST_ESC(z.title || c.tittel || "")}</span>
            <span class="teller ${n ? "aktiv" : ""}">${KI_SLIST_ESC(tell)}</span>
            <ha-icon class="pil" icon="mdi:chevron-down"></ha-icon>
          </button>
          ${kropp}
        </div>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>${KI_SLIST_STIL}</style>
      <div class="rot" style="--kol:${c.kolonner === 2 ? 2 : 1}">
        ${blokker || `<div class="tom">${c.bare_aktive ? "Alt er lukket og låst." : "Ingen sensorer å vise."}</div>`}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-sone]"))
      el.addEventListener("click", () => {
        const i = +el.dataset.sone;
        this._lukket[i] = !(this._lukket[i] ?? !c.apnet);
        this._tegn();
      });

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

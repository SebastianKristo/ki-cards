/* ki-panel-card – ett samlet panel i stedet for mange små sensorfliser.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan brukes alene.
 *
 * type: custom:ki-panel-card
 * tittel: Paritet
 * timer: 24                  # historikkvindu for grafene
 * graf: sparkline            # sparkline | ingen  (per rad kan overstyres)
 * hovedgraf:                 # valgfri stor graf øverst
 *   entity: sensor.x
 *   navn: Framdrift
 *   enhet: ' %'
 *   maks: 100
 * kolonner: 1                # 1 | 2  (2 = tettere rutenett uten grafer)
 * entiteter:
 *   - sensor.x                                   # kort form
 *   - entity: sensor.y
 *     navn: Hastighet
 *     ikon: mdi:speedometer
 *     enhet: ' MB/s'
 *     desimaler: 1
 *     maks: 200              # for stolpe/sparkline-skala
 *     graf: false
 *     tekst: { 'on': Kjører, 'off': Hviler }
 *     varsel_over: 80        # rød verdi over
 *     ok_naar: 'on'          # grønn prikk når tilstanden er denne
 */
const KI_PANEL_VERSJON = "1.0.0";

const KI_PANEL_STIL = `
  :host { display:block; --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); color:var(--gray1000);
    padding:6px 14px 10px; overflow:hidden; }
  .hode { display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:10px 2px 6px; }
  .hode h3 { margin:0; font-size:13px; font-weight:600; opacity:.55; letter-spacing:.02em; }
  .hode .sub { font-size:12px; font-weight:500; opacity:.45; white-space:nowrap; }

  /* stor graf */
  .stor { position:relative; margin:2px 0 6px; }
  .stor .topp { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; padding:0 2px 2px; }
  .stor .verdi { font-size:26px; font-weight:300; line-height:1.1; font-variant-numeric:tabular-nums; }
  .stor .verdi .e { font-size:13px; font-weight:500; opacity:.6; }
  .stor .navn { font-size:12.5px; opacity:.55; }
  .stor svg { display:block; width:100%; height:78px; overflow:visible; }
  .stor .omrade { fill:var(--graf, var(--active-big,#ee95ff)); opacity:.16; }
  .stor .linje { fill:none; stroke:var(--graf, var(--active-big,#ee95ff)); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  .stor .punkt { fill:var(--graf, var(--active-big,#ee95ff)); }
  .stor .rute { stroke:currentColor; stroke-opacity:.09; stroke-width:1; }
  .akse { font-size:9.5px; fill:currentColor; opacity:.4; }

  /* rader */
  .rader { display:grid; }
  .rad { display:grid; grid-template-columns:1fr minmax(0,86px) auto; align-items:center; gap:12px; padding:9px 2px; min-width:0; }
  .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
  .rad.uten-graf { grid-template-columns:1fr auto; }
  .rad.press { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .rad.press:active { opacity:.7; }
  .navn { display:flex; align-items:center; gap:8px; min-width:0; font-size:14px; }
  .navn ha-icon { --mdc-icon-size:18px; opacity:.55; flex:none; }
  .navn span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .prikk { width:8px; height:8px; border-radius:50%; background:rgba(128,128,128,.45); flex:none; }
  .prikk.ok { background:var(--green,#7ee081); }
  .prikk.feil { background:var(--red,#e8657a); }
  .prikk.aktiv { background:var(--active-big,#ee95ff); animation:puls 2.2s ease-in-out infinite; }
  @keyframes puls { 0%,100% { opacity:1; } 50% { opacity:.35; } }
  .verdi { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }
  .verdi .e { font-size:11.5px; font-weight:500; opacity:.55; margin-left:1px; }
  .verdi.varsel { color:var(--red,#e8657a); }
  .verdi.dim { font-weight:500; opacity:.7; }

  .mini { height:26px; }
  .mini svg { display:block; width:100%; height:26px; overflow:visible; }
  .mini .l { fill:none; stroke:currentColor; stroke-opacity:.55; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
  .mini .a { fill:currentColor; opacity:.1; }
  .mini .p { fill:currentColor; opacity:.75; }
  .mini .flat { stroke:currentColor; stroke-opacity:.18; stroke-width:1.6; stroke-dasharray:2 4; }
  .mini .stolpe { fill:currentColor; opacity:.14; }
  .mini .stolpe.fyll { opacity:.6; }

  /* to kolonner: tett rutenett uten grafer */
  .rader.to { grid-template-columns:1fr 1fr; column-gap:14px; }
  .rader.to .rad { grid-template-columns:1fr auto; }
  .rader.to .rad:nth-child(2) { border-top:0; }

  .feil-kort { padding:16px; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }
`;

const kiPanelEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiPanelNum = (v) => { const n = parseFloat(v); return isFinite(n) && /^-?\d/.test(String(v).trim()) ? n : null; };

class KiPanelCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-panel-card-editor"); }
  static getStubConfig() { return { tittel: "Panel", entiteter: [] }; }

  setConfig(c) {
    if (!c) throw new Error("konfigurasjon mangler");
    const liste = c.entiteter || c.entities || [];
    this._c = { timer: 24, graf: "sparkline", kolonner: 1, ...c, entiteter: liste.map(e => (typeof e === "string" ? { entity: e } : e)) };
    if (!this._c.entiteter.length && !this._c.hovedgraf) throw new Error("entiteter mangler");
    this._bygget = false; this._hist = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  set hass(h) {
    const forst = !this._hass;
    this._hass = h;
    if (!this._bygget) { this._bygg(); this._hentHistorikk(); }
    else if (this._endret(h)) this._tegn();
    if (forst) this._timer = setInterval(() => this._hentHistorikk(), 5 * 60000);
  }
  get hass() { return this._hass; }
  disconnectedCallback() { if (this._timer) clearInterval(this._timer); }
  getCardSize() { return 1 + Math.ceil(this._c.entiteter.length / (this._c.kolonner === 2 ? 2 : 1)) * 0.6 + (this._c.hovedgraf ? 2 : 0); }

  _ider() {
    const ids = this._c.entiteter.map(e => e.entity).filter(Boolean);
    if (this._c.hovedgraf && this._c.hovedgraf.entity) ids.unshift(this._c.hovedgraf.entity);
    return [...new Set(ids)];
  }
  /* bare re-tegn når egne entiteter faktisk har endret seg (objekt-referanse) */
  _endret(h) {
    const f = this._forrige || {}; let endret = false; const ny = {};
    for (const id of this._ider()) { const st = h.states[id]; ny[id] = st; if (st !== f[id]) endret = true; }
    this._forrige = ny; return endret;
  }

  async _hentHistorikk() {
    const h = this._hass, ids = this._ider().filter(id => {
      const e = this._c.entiteter.find(x => x.entity === id);
      if (this._c.hovedgraf && this._c.hovedgraf.entity === id) return true;
      if (e && e.graf === false) return false;
      return this._c.graf !== "ingen";
    });
    if (!h || !ids.length) return;
    const start = new Date(Date.now() - this._c.timer * 3600000).toISOString();
    try {
      const res = await h.callApi("GET", `history/period/${start}?filter_entity_id=${ids.join(",")}&minimal_response&no_attributes`);
      const data = {};
      (res || []).forEach(arr => { if (arr && arr.length) data[arr[0].entity_id] = arr.map(x => [new Date(x.last_changed || x.last_updated).getTime(), x.state]); });
      this._hist = data; this._tegn();
    } catch (e) { this._hist = {}; }
  }

  _bygg() {
    this._bygget = true;
    this.shadowRoot.innerHTML = `<style>${KI_PANEL_STIL}</style><div class="kort"></div>`;
    this._tegn();
  }

  /* ---------- verdier ---------- */
  _les(e) {
    const st = this._hass && this._hass.states[e.entity];
    if (!st) return { mangler: true, tekst: "—", tall: null, tilstand: null };
    const raw = st.state;
    if (e.tekst && e.tekst[raw] !== undefined) return { tekst: String(e.tekst[raw]), tall: null, tilstand: raw, st };
    const n = kiPanelNum(raw);
    if (n === null) return { tekst: raw === "unavailable" ? "utilgjengelig" : raw === "unknown" ? "ukjent" : raw, tall: null, tilstand: raw, st };
    const d = e.desimaler ?? (Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2);
    const enhet = e.enhet ?? (st.attributes.unit_of_measurement ? " " + st.attributes.unit_of_measurement : "");
    return { tekst: n.toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }), enhet, tall: n, tilstand: raw, st };
  }
  _prikk(e, v) {
    if (v.mangler) return "";
    if (e.ok_naar !== undefined) return v.tilstand === String(e.ok_naar) ? "ok" : "feil";
    if (e.tekst || v.tilstand === "on" || v.tilstand === "off") {
      if (v.tilstand === "on") return e.varsel_naar_pa ? "feil" : "aktiv";
      if (v.tilstand === "off") return "";
    }
    return "";
  }

  /* ---------- grafer ---------- */
  _serie(id, maks) {
    const rå = (this._hist || {})[id] || [];
    const pts = rå.map(([t, s]) => [t, kiPanelNum(s)]).filter(p => p[1] !== null);
    if (!pts.length) return null;
    const now = Date.now(), t0 = now - this._c.timer * 3600000;
    pts.push([now, pts[pts.length - 1][1]]);
    const ys = pts.map(p => p[1]);
    let lo = Math.min(...ys), hi = maks ?? Math.max(...ys);
    if (maks !== undefined && maks !== null) lo = Math.min(lo, 0);
    if (hi - lo < 1e-9) { hi = lo + 1; lo -= 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    return { pts, t0, now, lo, hi };
  }
  _mini(id, maks, digital) {
    const s = this._serie(id, maks);
    if (!s) return `<svg viewBox="0 0 86 26" preserveAspectRatio="none"><line class="flat" x1="2" y1="13" x2="84" y2="13"></line></svg>`;
    const W = 86, H = 26, x = t => 2 + ((Math.max(s.t0, Math.min(s.now, t)) - s.t0) / (s.now - s.t0)) * (W - 4);
    const y = v => 3 + (1 - (v - s.lo) / (s.hi - s.lo)) * (H - 6);
    if (digital) {
      const bånd = []; let på = null;
      ((this._hist || {})[id] || []).forEach(([t, st]) => { if (st === "on" && på === null) på = t; if (st !== "on" && på !== null) { bånd.push([på, t]); på = null; } });
      if (på !== null) bånd.push([på, s.now]);
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <rect class="stolpe" x="2" y="8" width="${W - 4}" height="10" rx="5"></rect>
        ${bånd.map(([a, b]) => `<rect class="stolpe fyll" x="${x(a).toFixed(1)}" y="8" width="${Math.max(1.5, x(b) - x(a)).toFixed(1)}" height="10" rx="5"></rect>`).join("")}
      </svg>`;
    }
    const d = s.pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const sis = s.pts[s.pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path class="a" d="${d} L${x(s.now).toFixed(1)},${H} L${x(s.pts[0][0]).toFixed(1)},${H} Z"></path>
      <path class="l" d="${d}" vector-effect="non-scaling-stroke"></path>
      <circle class="p" cx="${x(sis[0]).toFixed(1)}" cy="${y(sis[1]).toFixed(1)}" r="1.8"></circle>
    </svg>`;
  }
  _stor(g) {
    const v = this._les(g);
    const s = this._serie(g.entity, g.maks);
    const W = 320, H = 78;
    let inner = `<line class="rute" x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}"></line>`;
    if (s) {
      const x = t => ((Math.max(s.t0, Math.min(s.now, t)) - s.t0) / (s.now - s.t0)) * W;
      const y = val => 6 + (1 - (val - s.lo) / (s.hi - s.lo)) * (H - 22);
      const d = s.pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
      const sis = s.pts[s.pts.length - 1];
      const timer = this._c.timer;
      const merker = [];
      for (let i = 0; i <= 4; i++) {
        const t = s.t0 + (i / 4) * (s.now - s.t0);
        merker.push(`<text class="akse" x="${(x(t)).toFixed(1)}" y="${H - 1}" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}">${new Date(t).getHours().toString().padStart(2, "0")}</text>`);
      }
      inner = `<line class="rute" x1="0" y1="${y(s.lo + (s.hi - s.lo) / 2).toFixed(1)}" x2="${W}" y2="${y(s.lo + (s.hi - s.lo) / 2).toFixed(1)}"></line>
        <path class="omrade" d="${d} L${x(s.now).toFixed(1)},${H - 14} L${x(s.pts[0][0]).toFixed(1)},${H - 14} Z"></path>
        <path class="linje" d="${d}" vector-effect="non-scaling-stroke"></path>
        <circle class="punkt" cx="${x(sis[0]).toFixed(1)}" cy="${y(sis[1]).toFixed(1)}" r="2.6"></circle>
        ${merker.join("")}`;
    }
    return `<div class="stor" ${g.entity ? `data-mer="${g.entity}"` : ""} style="${g.farge ? `--graf:${g.farge};` : ""}">
      <div class="topp">
        <div class="verdi">${kiPanelEsc(v.tekst)}${v.enhet ? `<span class="e">${kiPanelEsc(v.enhet)}</span>` : ""}</div>
        <div class="navn">${kiPanelEsc(g.navn || (v.st ? v.st.attributes.friendly_name : "") || "")}${s ? ` · siste ${this._c.timer} t` : ""}</div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${inner}</svg>
    </div>`;
  }

  _tegn() {
    if (!this._hass || !this.shadowRoot) return;
    const c = this._c, rot = this.shadowRoot.querySelector(".kort");
    if (!rot) return;
    const to = c.kolonner === 2;
    const rader = c.entiteter.map(e => {
      const v = this._les(e);
      const digital = !!e.tekst || v.tilstand === "on" || v.tilstand === "off";
      const graf = !to && c.graf !== "ingen" && e.graf !== false;
      const prikk = this._prikk(e, v);
      const varsel = v.tall !== null && e.varsel_over !== undefined && v.tall > e.varsel_over;
      return `<div class="rad ${graf ? "" : "uten-graf"} press" data-mer="${e.entity}" tabindex="0">
        <div class="navn">${e.ikon ? `<ha-icon icon="${e.ikon}"></ha-icon>` : prikk ? `<i class="prikk ${prikk}"></i>` : ""}<span>${kiPanelEsc(e.navn || (v.st ? v.st.attributes.friendly_name : e.entity))}</span></div>
        ${graf ? `<div class="mini">${this._mini(e.entity, e.maks, digital)}</div>` : ""}
        <div class="verdi ${varsel ? "varsel" : ""} ${v.tall === null ? "dim" : ""}">${kiPanelEsc(v.tekst)}${v.enhet ? `<span class="e">${kiPanelEsc(v.enhet)}</span>` : ""}</div>
      </div>`;
    }).join("");
    rot.innerHTML = `
      ${c.tittel || c.undertittel ? `<div class="hode"><h3>${kiPanelEsc(c.tittel || "")}</h3>${c.undertittel ? `<div class="sub">${kiPanelEsc(c.undertittel)}</div>` : ""}</div>` : ""}
      ${c.hovedgraf ? this._stor(typeof c.hovedgraf === "string" ? { entity: c.hovedgraf } : c.hovedgraf) : ""}
      <div class="rader ${to ? "to" : ""}">${rader}</div>`;
    rot.querySelectorAll("[data-mer]").forEach(el => {
      const gå = (ev) => { ev && ev.stopPropagation(); this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true })); };
      el.addEventListener("click", gå);
      el.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); gå(ev); } });
    });
  }
}
customElements.define("ki-panel-card", KiPanelCard);

/* ---------------- enkel visuell editor ---------------- */
class KiPanelCardEditor extends HTMLElement {
  setConfig(c) { this._c = { ...c }; this._tegn(); }
  set hass(h) { this._hass = h; this._tegn(); }
  _ut() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._c }, bubbles: true, composed: true })); }
  _tegn() {
    if (!this._hass || this._bygget) return;
    this._bygget = true;
    this.innerHTML = `<div style="display:grid;gap:12px"></div>`;
    const rot = this.firstElementChild;
    const skjema = document.createElement("ha-form");
    skjema.hass = this._hass;
    skjema.schema = [
      { name: "tittel", selector: { text: {} } },
      { name: "undertittel", selector: { text: {} } },
      { name: "entiteter", selector: { entity: { multiple: true } } },
      { name: "hovedgraf", selector: { entity: { domain: ["sensor", "number"] } } },
      { name: "timer", selector: { number: { min: 1, max: 168, step: 1, mode: "box" } } },
      { name: "kolonner", selector: { select: { options: [{ value: 1, label: "Én kolonne med grafer" }, { value: 2, label: "To kolonner, tett" }], mode: "dropdown" } } },
      { name: "graf", selector: { select: { options: [{ value: "sparkline", label: "Minigraf per rad" }, { value: "ingen", label: "Ingen grafer" }], mode: "dropdown" } } },
    ];
    skjema.computeLabel = (s) => ({ tittel: "Tittel", undertittel: "Undertittel", entiteter: "Entiteter", hovedgraf: "Stor graf (valgfri)", timer: "Timer historikk", kolonner: "Oppsett", graf: "Grafer" }[s.name] || s.name);
    const norm = (c) => ({ ...c, entiteter: (c.entiteter || []).map(e => (typeof e === "string" ? e : e.entity)) });
    skjema.data = norm(this._c);
    skjema.addEventListener("value-changed", (e) => {
      const v = e.detail.value;
      const gamle = (this._c.entiteter || []).map(x => (typeof x === "string" ? { entity: x } : x));
      this._c = { ...this._c, ...v, entiteter: (v.entiteter || []).map(id => gamle.find(g => g.entity === id) || { entity: id }) };
      if (!this._c.hovedgraf) delete this._c.hovedgraf;
      this._ut();
    });
    rot.appendChild(skjema);
    const hjelp = document.createElement("div");
    hjelp.style.cssText = "font-size:12px;opacity:.6;line-height:1.5";
    hjelp.textContent = "Navn, ikon, enhet, tekstkart og varsel_over settes per entitet i YAML-editoren.";
    rot.appendChild(hjelp);
  }
}
customElements.define("ki-panel-card-editor", KiPanelCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === "ki-panel-card")) {
  window.customCards.push({ type: "ki-panel-card", name: "KI Panel", preview: true,
    description: `Ett panel med flere sensorer: rader med minigraf, verdi og status, valgfri stor graf (v${KI_PANEL_VERSJON})` });
}

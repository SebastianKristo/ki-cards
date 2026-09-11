/* ki-prosa-card – forsideteksten, bygget automatisk. Frittstående, ingen avhengigheter.
 * Del av ki-cards-bundelen; ingen avhengigheter til KI-hjelperne og kan også brukes alene.
 *
 * Alt er valgfritt; standardene peker på entitetene i MySmartHome. Sett en nøkkel til false for å skru den av.
 *  vaer: weather.forecast_home          pris: sensor.norgespris_pris_na      effekt: sensor.strommaler_effekt
 *  lys: auto                            kalender: sensor.alle_kalendere      laser: auto   natt: [23, 6]
 *  planter: auto                        ringeklokke: input_boolean.ki_ringeklokke_varsel_aktiv
 *  spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # gir fargeprikk på prisen
 *  storrelse: 1.4em                     lys_ekskluder: ['light.wled_*']
 *  apparater: [ { navn: Oppvaskmaskinen, aktiv: { entity, state | over }, verdi: sensor.x, ikon: 🍽️, path: '#kjokken' } ]
 *  hjemkomst: [ { navn: Mamma, aktiv: input_boolean.x, reisetid: sensor.x } ]
 *  bursdag: { vis: binary_sensor.vis_bursdagskort, skjult: input_boolean.bursdagskort_skjult, navn: sensor.dagens_bursdager }
 *  ekstra: [ { tekst: 'Søppel tømmes i dag', vis: "states['sensor.x'].state == '0'", path: '#soppel' } ]
 *
 * Trykk på en pille = navigering eller handling. Langt trykk = more-info.
 */
const KI_PROSA_VERSJON = "1.0.0";

const KI_PROSA_STD = {
  vaer: "weather.forecast_home", pris: "sensor.norgespris_pris_na", effekt: "sensor.strommaler_effekt", lys: "auto", kalender: "sensor.alle_kalendere",
  laser: "auto", natt: [23, 6], planter: "auto", ringeklokke: "input_boolean.ki_ringeklokke_varsel_aktiv",
  spot: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
  apparater: [
    { navn: "Oppvaskmaskinen", aktiv: { entity: "input_select.oppvaskmaskin_status", state: "Vasker" }, verdi: "sensor.oppvaskmaskin_power", ikon: "🍽️", path: "#kjokken" },
    { navn: "Vaskemaskinen", aktiv: { entity: "sensor.vaskemaskin_power", over: 10 }, verdi: "sensor.vaskegang_vaskemaskin_effekt", ikon: "🧺", path: "#vaskegang" }],
  hjemkomst: [{ navn: "Mamma", aktiv: "input_boolean.ki_cybele_pa_vei_hjem_fra_jobb", reisetid: "sensor.cybele_reisetid_fra_job" }],
  bursdag: { vis: "binary_sensor.vis_bursdagskort", skjult: "input_boolean.bursdagskort_skjult", navn: "sensor.dagens_bursdager" },
};

const KI_PROSA_VAER = {
  "sunny": "mdi:weather-sunny", "clear-night": "mdi:weather-night", "partlycloudy": "mdi:weather-partly-cloudy", "cloudy": "mdi:weather-cloudy",
  "rainy": "mdi:weather-rainy", "pouring": "mdi:weather-pouring", "snowy": "mdi:weather-snowy", "snowy-rainy": "mdi:weather-snowy-rainy",
  "fog": "mdi:weather-fog", "hail": "mdi:weather-hail", "lightning": "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy",
  "windy": "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant", "exceptional": "mdi:alert",
};

const KI_PROSA_STIL = `
  :host { display:block; --myk:cubic-bezier(.2,.8,.2,1); }
  .prosa { font-size:var(--str,1.4em); line-height:2em; padding:0 6px 4px 7px; font-weight:400; color:var(--gray1000, var(--primary-text-color)); }
  .prosa p { margin:0; }
  .setning { display:inline; }
  .ny { animation:pr-inn .7s var(--myk) both; display:inline-block; }
  .pille { display:inline-flex; align-items:center; gap:5px; padding:0 10px; border-radius:999px; background:var(--gray1000, var(--primary-text-color));
    color:var(--gray100, var(--card-background-color)); font-weight:500; line-height:1.65; white-space:nowrap; vertical-align:baseline;
    cursor:pointer; -webkit-tap-highlight-color:transparent; transition:background .3s, transform .12s; }
  .pille:active { transform:scale(.95); }
  .pille ha-icon { --mdc-icon-size:1em; }
  .pille:focus-visible { outline:2px solid var(--active-big, #ee95ff); outline-offset:2px; }
  .pille .prikk { width:.42em; height:.42em; border-radius:50%; background:var(--tone,var(--green)); box-shadow:0 0 8px var(--tone,var(--green)); }
  .pille.varsel { background:var(--red); color:#fff; --tone:var(--red); animation:pr-puls 1.6s ease-in-out infinite; }
  .pille.gradient { background:var(--k-grad, linear-gradient(135deg,#ffc88a,#ee95ff)); color:rgba(70,58,64,.95); }
  .pille.glans { position:relative; overflow:hidden; }
  .pille.glans::after { content:""; position:absolute; top:0; bottom:0; width:30%; left:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); animation:pr-glans 2.8s ease-in-out infinite; pointer-events:none; }
  .snurr-ik { display:inline-block; animation:pr-snurr 2.4s linear infinite; }
  .hopp { display:inline-block; animation:pr-hopp 1.6s ease-in-out infinite; }
  .vink { display:inline-block; transform-origin:50% 10%; animation:pr-vink 1.2s ease-in-out infinite; }
  @keyframes pr-inn { from { opacity:0; transform:translateY(10px) scale(.985); } to { opacity:1; transform:none; } }
  @keyframes pr-snurr { to { transform:rotate(360deg); } }
  @keyframes pr-hopp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
  @keyframes pr-vink { 0%,60%,100% { transform:rotate(0); } 10%,30%,50% { transform:rotate(-16deg); } 20%,40% { transform:rotate(16deg); } }
  @keyframes pr-glans { from { transform:translateX(-120%) skewX(-18deg); } to { transform:translateX(320%) skewX(-18deg); } }
  @keyframes pr-puls { 0%,100% { box-shadow:0 0 0 0 rgba(255,90,82,0); } 50% { box-shadow:0 0 0 6px rgba(255,90,82,.25); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiPEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiPNf = (v, d = 0) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
const kiPFlertall = (n, en, fl) => `${n} ${n === 1 ? en : fl}`;
const kiPGlob = (m, s) => !m || new RegExp("^" + m.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(s);
const kiPJs = (() => { const c = {}; return (expr, h) => { try { return (c[expr] || (c[expr] = new Function("states", "hass", "return (" + expr + ");")))(h.states, h); } catch (e) { return undefined; } }; })();
const kiPMal = (t, h) => String(t || "").replace(/\{([a-z_]+\.[a-z0-9_]+)(?:\.([a-z0-9_]+))?\}/g, (m, id, at) => {
  const s = h.states[id]; if (!s) return "–"; if (at) return s.attributes[at] ?? "–";
  const v = parseFloat(s.state); return isNaN(v) ? s.state : kiPNf(v, Math.abs(v) < 10 && v % 1 ? 2 : 0) + (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
});

class KiProsaCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return {}; }
  static getConfigElement() { return document.createElement("ki-prosa-card-editor"); }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: 12, min_rows: 1 }; }

  setConfig(c) { this._c = { ...KI_PROSA_STD, ...(c || {}) }; this._bygget = false; this._tegn(); }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 60000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  /* ------------------------------------------------------------ oppslag */
  _st(id) { return (this._h && id && this._h.states[id]) || null; }
  _val(id) { const s = this._st(id); return s ? s.state : ""; }
  _on(id) { return this._val(id) === "on"; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  _at(id, a) { const s = this._st(id); return s ? s.attributes[a] : undefined; }
  _teknisk(id) { const r = this._h.entities && this._h.entities[id]; return !!(r && (r.hidden || r.entity_category)); }
  _domene(d) { return Object.keys(this._h.states).filter((id) => id.startsWith(d + ".")); }
  _lysene() { return this._domene("light").filter((id) => !this._teknisk(id) && !Array.isArray(this._h.states[id].attributes.entity_id) && !(this._c.lys_ekskluder || []).some((g) => kiPGlob(g, id))); }
  _planter() { return Object.keys(this._h.states).filter((id) => { if (!id.startsWith("binary_sensor.")) return false; const a = this._h.states[id].attributes || {}; return a.integrasjon === "ki_planter" && a.type === "plante"; }).sort(); }
  _ider() {
    const c = this._c, ids = [c.vaer, c.pris, c.effekt, c.ringeklokke, c.kalender, c.spot];
    if (c.lys === "auto") ids.push(...this._lysene()); else if (c.lys) ids.push(c.lys);
    if (c.laser === "auto") ids.push(...this._domene("lock")); else if (c.laser) ids.push(...[].concat(c.laser));
    if (c.planter === "auto") ids.push(...this._planter());
    (c.apparater || []).forEach((a) => ids.push(a.verdi, a.aktiv && (a.aktiv.entity || a.aktiv)));
    (c.hjemkomst || []).forEach((a) => ids.push(a.aktiv, a.reisetid));
    if (c.bursdag) ids.push(c.bursdag.vis, c.bursdag.skjult, c.bursdag.navn);
    (c.ekstra || []).forEach((e) => (String(e.vis || "").match(/[a-z_]+\.[a-z0-9_]+/g) || []).forEach((x) => ids.push(x)));
    return ids.filter((x) => typeof x === "string");
  }

  /* ---------------------------------------------------------- handlinger */
  _nav(sti) {
    if (!sti || sti === "#") return;
    if (sti.startsWith("#") || sti.includes("#")) { const [p, h] = sti.split("#"); if (p) history.pushState(null, "", location.pathname + p); location.hash = "#" + h; }
    else { history.pushState(null, "", sti); window.dispatchEvent(new Event("location-changed")); }
  }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
  _handling(el) {
    const a = el.dataset.a || "";
    if (a.startsWith("nav:")) return this._nav(a.slice(4));
    if (a.startsWith("more:")) return this._mer(a.slice(5));
    if (a.startsWith("svc:")) { const [dom, tj] = a.slice(4).split("."); let d = {}; try { d = JSON.parse(el.dataset.d || "{}"); } catch (e) { /* tom */ }
      if (navigator.vibrate) navigator.vibrate(10); this._h.callService(dom, tj, d); }
  }
  _koble() {
    const r = this.shadowRoot, finn = (e) => { for (const el of e.composedPath()) { if (el === r) break; if (el.nodeType === 1 && el.dataset && el.dataset.a) return el; } return null; };
    let t = null, x0 = 0, y0 = 0, svelg = false;
    r.addEventListener("click", (e) => { if (svelg) { svelg = false; return; } const el = finn(e); if (el) { e.stopPropagation(); this._handling(el); } });
    r.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = finn(e); if (el) { e.preventDefault(); this._handling(el); } });
    r.addEventListener("pointerdown", (e) => { const el = finn(e); if (!el || !el.dataset.e) return; x0 = e.clientX; y0 = e.clientY;
      t = setTimeout(() => { t = null; svelg = true; if (navigator.vibrate) navigator.vibrate(12); this._mer(el.dataset.e); setTimeout(() => { svelg = false; }, 700); }, 500); });
    const stopp = () => { clearTimeout(t); t = null; };
    r.addEventListener("pointerup", stopp); r.addEventListener("pointercancel", stopp);
    r.addEventListener("pointermove", (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stopp(); });
    r.addEventListener("contextmenu", (e) => { const el = finn(e); if (el && el.dataset.e) e.preventDefault(); });
  }

  /* -------------------------------------------------------------- tekst */
  _aktiv(a) { if (!a) return false; if (typeof a === "string") return this._on(a); const s = this._st(a.entity); if (!s) return false;
    if (a.over !== undefined) return parseFloat(s.state) > a.over; if (a.state !== undefined) return s.state === String(a.state); return s.state === "on"; }
  _pille(innhold, o = {}) {
    const a = o.svc ? `svc:${o.svc}` : o.path ? `nav:${o.path}` : o.mer ? `more:${o.mer}` : "";
    return `<span class="pille ${o.cls || ""}" role="button" tabindex="0" data-a="${a}"${o.data ? ` data-d="${kiPEsc(JSON.stringify(o.data))}"` : ""}${o.mer && !o.svc && !o.path ? "" : o.entity ? ` data-e="${o.entity}"` : ""}>${innhold}</span>`;
  }
  _prisTone() { const s = this._st(this._c.spot), r = s && s.attributes.raw_today; if (!Array.isArray(r) || !r.length) return null;
    const naa = parseFloat(s.state), v = r.map((p) => p.value).filter((x) => typeof x === "number"); if (!v.length || isNaN(naa)) return null;
    const min = Math.min(...v), max = Math.max(...v), f = (naa - min) / (max - min || 1);
    return f < 0.34 ? "var(--green)" : f < 0.67 ? "var(--yellow)" : "var(--red)"; }

  _deler() {
    const c = this._c, h = this._h, deler = [];
    // vær + strøm
    const s1 = [], v = this._st(c.vaer);
    if (v) s1.push(`Ute er det ${this._pille(`${kiPNf(v.attributes.temperature, 0)}° <ha-icon icon="${KI_PROSA_VAER[v.state] || "mdi:weather-cloudy"}"></ha-icon>`, { path: "#vaer", entity: c.vaer })}.`);
    const pris = this._num(c.pris);
    if (c.pris && pris !== null) {
      const tone = this._prisTone();
      let t = `Strømmen koster ${this._pille(`${tone ? `<i class="prikk" style="--tone:${tone}"></i>` : ""}${kiPNf(pris, 2)} kr`, { path: "?tab=priser#strom", entity: c.pris })}`;
      const w = this._num(c.effekt);
      if (c.effekt && w > 0) t += ` og vi bruker ${this._pille(`${kiPNf(w, 0)} W`, { path: "?tab=forbruk#strom", entity: c.effekt })}`;
      if (c.lys) { const n = c.lys === "auto" ? this._lysene().filter((id) => this._on(id)).length : this._num(c.lys) || 0; t += ` med ${this._pille(`💡 ${kiPFlertall(n, "lys", "lys")}`, { path: "#lys" })} på`; }
      s1.push(t + ".");
    }
    if (s1.length) deler.push(s1.join(" "));
    // kalender
    const k = this._st(c.kalender);
    if (k) { const i0 = new Date(); i0.setHours(0, 0, 0, 0); const i1 = i0.getTime() + 86400000;
      const n = (k.attributes.events || []).filter((e) => { const t = new Date(e.start).getTime(); return t >= i0.getTime() && t < i1; }).length;
      deler.push(`Vi har ${this._pille(`⏰ ${n ? kiPFlertall(n, "hendelse", "hendelser") : "ingen hendelser"}`, { path: "#kalender", entity: c.kalender })} i dag.`); }
    // apparater
    (c.apparater || []).forEach((a) => { if (!this._aktiv(a.aktiv)) return; const w = this._num(a.verdi);
      deler.push(`<span class="ny">${kiPEsc(a.navn)} vasker ${this._pille(`<span class="snurr-ik">${a.ikon || "⚙️"}</span> ${w !== null ? kiPNf(w, 0) + " W" : ""}`, a.path ? { path: a.path, entity: a.verdi } : { mer: a.verdi })} nå.</span>`); });
    // hjemkomst
    (c.hjemkomst || []).forEach((a) => { if (!this._on(a.aktiv)) return; const min = this._num(a.reisetid); if (min === null) return;
      const t = new Date(Date.now() + min * 60000).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      deler.push(`<span class="ny">${kiPEsc(a.navn)} kommer hjem ca. kl ${this._pille(`<span class="hopp">🚗</span> ${t}`, { mer: a.reisetid })}.</span>`); });
    // ringeklokke
    if (c.ringeklokke && this._on(c.ringeklokke))
      deler.push(`<span class="ny">${this._pille(`<span class="vink">🔔</span>`, { cls: "varsel", svc: "input_boolean.turn_off", data: { entity_id: c.ringeklokke }, entity: c.ringeklokke })} Noen ringer på døren!</span>`);
    // låser om natta
    if (c.laser) {
      const ls = c.laser === "auto" ? this._domene("lock") : [].concat(c.laser), apne = ls.filter((id) => this._val(id) === "unlocked");
      const t = new Date().getHours(), [a, b] = c.natt || [23, 6];
      if (apne.length && (a > b ? (t >= a || t < b) : (t >= a && t < b)))
        deler.push(`<span class="ny">Lås alle dørene ${this._pille(`🔒 ${apne.length}`, { cls: "gradient", svc: "lock.lock", data: { entity_id: apne } })}</span>`);
    }
    // planter
    if (c.planter === "auto") {
      const ps = this._planter().filter((id) => this._on(id)).map((id) => this._at(id, "navn") || this._at(id, "friendly_name"));
      if (ps.length) { const n = ps.length > 2 ? `${ps.slice(0, -1).join(", ")} og ${ps[ps.length - 1]}` : ps.join(" og ");
        deler.push(`<span class="ny">${this._pille(`🪴 ${kiPEsc(n)}`, { path: "#planter" })} trenger vann.</span>`); }
    }
    // bursdag
    const bd = c.bursdag;
    if (bd && this._on(bd.vis) && !this._on(bd.skjult))
      deler.push(`<span class="ny">I dag har ${this._pille(`🎂 ${kiPEsc(this._val(bd.navn))}`, { cls: "gradient glans", svc: "input_boolean.turn_on", data: { entity_id: bd.skjult }, entity: bd.navn })} bursdag! 🎉</span>`);
    // egne setninger
    (c.ekstra || []).forEach((e) => {
      if (e.vis && !kiPJs(e.vis, h)) return; const t = kiPMal(e.tekst, h);
      deler.push(e.path || e.pille
        ? `<span class="ny">${e.for ? kiPEsc(e.for) + " " : ""}${this._pille(kiPEsc(e.pille ? kiPMal(e.pille, h) : t), { path: e.path || "#" })}${e.etter ? " " + kiPEsc(e.etter) : ""}</span>`
        : `<span class="ny">${kiPEsc(t)}</span>`);
    });
    return deler;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const html = `<div class="prosa" style="${c.storrelse ? `--str:${kiPEsc(c.storrelse)}` : ""}"><p>${this._deler().map((d) => `<span class="setning">${d}</span>`).join(" ")}</p></div>`;
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_PROSA_STIL}</style>${html}`; this._koble(); this._bygget = true; this._forrige = html; return; }
    if (html !== this._forrige) { this.shadowRoot.querySelector(".prosa").outerHTML = html; this._forrige = html; }
  }
}
if (!customElements.get("ki-prosa-card")) customElements.define("ki-prosa-card", KiProsaCard);

class KiProsaCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { vaer: "Vær", pris: "Strømpris", effekt: "Effekt nå", kalender: "Kalender-sensor (events)", spot: "Spotpris (fargeprikk)", ringeklokke: "Ringeklokke", storrelse: "Tekststørrelse (1.4em)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [{ name: "vaer", selector: { entity: { domain: "weather" } } }, { name: "pris", selector: { entity: {} } }, { name: "effekt", selector: { entity: {} } },
      { name: "kalender", selector: { entity: {} } }, { name: "spot", selector: { entity: {} } }, { name: "ringeklokke", selector: { entity: {} } }, { name: "storrelse", selector: { text: {} } }];
  }
}
if (!customElements.get("ki-prosa-card-editor")) customElements.define("ki-prosa-card-editor", KiProsaCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-prosa-card")) window.customCards.push({ type: "ki-prosa-card", name: "KI Prosa", description: "Forsideteksten med levende piller – bygget automatisk", preview: true });


/* ki-enhet-card – levende statuskort for ruter, switch, AP, server, VM og container.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-enhet-card
 * navn: Dream Machine Pro
 * figur: ruter            # ruter | switch | ap | server | boks
 * status: device_tracker.oslo_dream_machine_pro
 * status_pa: [home, on, online, running]    # standardverdier som betyr «oppe»
 * oppetid: sensor.oslo_dream_machine_pro_oppetid
 * maalinger: [{navn: CPU, entity: sensor..., enhet: '%', maks: 100}]
 * info: [{navn: Klienter, entity: sensor...}]         # vises som rader i ett panel med minigraf
 * info_stil: rader        # rader (standard) | fliser (som før)
 * graf: sensor.x          # eller {entity, navn, enhet, maks, farge}: stor graf øverst i panelet
 * timer: 24               # historikkvindu for grafene
 * knapper: [{navn: Restart, entity: button..., ikon: mdi:restart, farge: var(--orange), bekreft: Restarte?}]
 */
const KI_ENHET_VERSJON = "1.1.0";

const KI_ENHET_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .rot { display:grid; gap:10px; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* ---- hero ---- */
  .hero { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate;
    padding:18px 20px; display:grid; grid-template-columns:1fr 42%; grid-template-rows:min-content 1fr min-content;
    grid-template-areas:"navn figur" "tom figur" "maal figur"; color:var(--gray1000); cursor:pointer;
    background:var(--gray200); transition:background .6s var(--myk), color .4s; }
  .hero.oppe { background:radial-gradient(85% 120% at 88% 115%, rgba(126,224,129,.16) 0%, transparent 62%), var(--gray200); }
  .hero.nede { background:radial-gradient(85% 120% at 88% 115%, rgba(232,101,122,.22) 0%, transparent 62%), var(--gray200); }
  .navn { grid-area:navn; display:flex; align-items:center; gap:8px; row-gap:2px; flex-wrap:wrap; min-width:0; }
  .navn h3 { margin:0; font-size:16px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .pille { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:999px; flex:none;
    font-size:12px; font-weight:600; background:var(--gray100); }
  .pille.oppe { background:var(--green,#7ee081); color:var(--black,#000); }
  .pille.nede { background:var(--red,#e8657a); color:#fff; }
  .pille i { width:7px; height:7px; border-radius:50%; background:currentColor; }
  .pille.oppe i { animation:hjerte 2.4s ease-in-out infinite; }
  @keyframes hjerte { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.5); opacity:.5; } }
  .under { grid-area:tom; align-self:center; font-size:13px; opacity:.62; line-height:1.4; min-width:0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .under b { font-weight:600; opacity:.9; }

  /* målere */
  .maal { grid-area:maal; display:flex; gap:14px; align-items:flex-end; }
  .ring { position:relative; width:56px; text-align:center; }
  .ring svg { width:52px; height:52px; display:block; margin:0 auto; transform:rotate(-90deg); }
  .ring .spor { fill:none; stroke:currentColor; stroke-opacity:.14; stroke-width:5; }
  .ring .bue { fill:none; stroke:var(--ring, var(--active-big,#ee95ff)); stroke-width:5; stroke-linecap:round;
    transition:stroke-dashoffset 1.2s var(--myk), stroke 1s ease; }
  .ring .tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600;
    margin-top:-2px; }
  .ring .lab { font-size:11px; opacity:.55; margin-top:2px; white-space:nowrap; }

  /* figurer */
  .figur { grid-area:figur; position:relative; margin:-18px -20px -18px 0; }
  .figur svg { position:absolute; inset:0; width:100%; height:100%; }
  .hero.nede .figur { filter:grayscale(.65); opacity:.8; }
  .boks2 { fill:currentColor; opacity:.14; }
  .kant { fill:none; stroke:currentColor; stroke-opacity:.35; stroke-width:2; }
  .led { fill:var(--green,#7ee081); }
  .hero.oppe .led { animation:blink 1.6s steps(1,end) infinite; }
  .hero.nede .led { fill:var(--red,#e8657a); opacity:.35; animation:none; }
  @keyframes blink { 0%,60% { opacity:1; } 61%,100% { opacity:.18; } }
  .bolge { fill:none; stroke:var(--green,#7ee081); stroke-width:2.5; stroke-linecap:round; opacity:0; }
  .hero.oppe .bolge { animation:bolgeut 2.6s ease-out infinite; }
  .hero.oppe .b2 { animation-delay:.6s; } .hero.oppe .b3 { animation-delay:1.2s; }
  @keyframes bolgeut { 0% { opacity:0; transform:scale(.5); } 25% { opacity:.75; } 100% { opacity:0; transform:scale(1.25); } }
  .pakke { fill:var(--active-big,#ee95ff); opacity:0; }
  .hero.oppe .pakke { animation:flyt 2.2s linear infinite; }
  .hero.oppe .p2 { animation-delay:.7s; } .hero.oppe .p3 { animation-delay:1.4s; }
  @keyframes flyt { 0% { opacity:0; transform:translateX(-40px); } 15% { opacity:.9; } 85% { opacity:.9; } 100% { opacity:0; transform:translateX(60px); } }
  .vifte { transform-box:fill-box; transform-origin:center; }
  .hero.oppe .vifte { animation:snurr 2.4s linear infinite; }
  @keyframes snurr { to { transform:rotate(360deg); } }
  .skann { opacity:.35; }
  .hero.oppe .skann { animation:skann 3.4s ease-in-out infinite; }
  @keyframes skann { 0%,100% { transform:translateY(0); opacity:.1; } 50% { transform:translateY(38px); opacity:.5; } }
  .kryss { stroke:var(--red,#e8657a); stroke-width:3.5; stroke-linecap:round; opacity:0; }
  .hero.nede .kryss { opacity:.9; animation:kryssinn .5s var(--fjaer) both; }
  @keyframes kryssinn { from { transform:scale(.4); opacity:0; } to { transform:scale(1); opacity:.9; } }

  /* ---- info som samlet panel med grafer (standard) ---- */
  .panel { background:var(--gray200); border-radius:var(--ha-card-border-radius,24px); padding:4px 14px 8px; overflow:hidden; }
  .stor { position:relative; margin:8px 0 2px; }
  .stor .topp { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; padding:0 2px 2px; }
  .stor .sverdi { font-size:24px; font-weight:300; line-height:1.1; font-variant-numeric:tabular-nums; }
  .stor .snavn { font-size:12px; opacity:.5; }
  .stor svg { display:block; width:100%; height:70px; overflow:visible; }
  .stor .omrade { fill:var(--graf, var(--active-big,#ee95ff)); opacity:.15; }
  .stor .linje { fill:none; stroke:var(--graf, var(--active-big,#ee95ff)); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  .stor .punkt { fill:var(--graf, var(--active-big,#ee95ff)); }
  .stor .rute { stroke:currentColor; stroke-opacity:.09; }
  .stor text { font-size:9.5px; fill:currentColor; opacity:.38; }
  .rad { display:grid; grid-template-columns:1fr minmax(0,84px) auto; align-items:center; gap:12px; padding:9px 2px; min-width:0; cursor:pointer; }
  .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
  .rad.uten { grid-template-columns:1fr auto; }
  .rad:active { opacity:.7; }
  .rad .rn { font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:.85; }
  .rad .rv { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }
  .rad.varsel .rv { color:var(--red,#e8657a); }
  .mini svg { display:block; width:100%; height:24px; overflow:visible; }
  .mini .l { fill:none; stroke:currentColor; stroke-opacity:.5; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
  .mini .a { fill:currentColor; opacity:.09; }
  .mini .p { fill:currentColor; opacity:.7; }
  .mini .flat { stroke:currentColor; stroke-opacity:.16; stroke-width:1.6; stroke-dasharray:2 4; }
  .mini .bnd { fill:currentColor; opacity:.14; } .mini .bnd.f { opacity:.55; }

  /* ---- info som fliser (info_stil: fliser) ---- */
  .info { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; }
  .ifl { background:var(--gray200); border-radius:18px; padding:12px 14px; min-width:0; }
  .ifl .n { font-size:12px; font-weight:500; opacity:.55; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ifl .v { font-size:16px; font-weight:500; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ifl.varsel { background:var(--orange,#f0883e); color:var(--black,#000); }
  .ifl.varsel .n { opacity:.7; }
  .ifl.trykk { cursor:pointer; transition:transform .12s var(--fjaer); }
  .ifl.trykk:active { transform:scale(.98); }
  .knapper { display:grid; grid-template-columns:repeat(auto-fit, minmax(88px, 1fr)); gap:8px; }
  .kn { border:0; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:500;
    border-radius:18px; padding:12px 6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;
    --mdc-icon-size:22px; transition:transform .12s var(--fjaer), background .2s; }
  .kn:active { transform:scale(.95); }
  .kn.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .kn ha-icon { color:var(--kn-farge, inherit); }
  .kn.pa ha-icon { color:inherit; }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (max-width:400px) { .hero { grid-template-columns:1fr 38%; padding:16px; } .ring { width:50px; } .ring svg { width:46px; height:46px; } .maal { gap:10px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiEnhetEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_ENHET_OPPE = ["home", "on", "online", "running", "started", "ok", "aktiv", "connected"];

/* Figurer: felles ramme 120x120, tegnes med currentColor */
const KI_ENHET_FIGUR = {
  ruter: `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g><path class="bolge" d="M44 34a22 22 0 0 1 32 0" transform-origin="60 46"/>
      <path class="bolge b2" d="M36 26a34 34 0 0 1 48 0" transform-origin="60 46"/>
      <path class="bolge b3" d="M28 18a46 46 0 0 1 64 0" transform-origin="60 46"/></g>
    <rect class="boks2" x="22" y="60" width="76" height="26" rx="8"/>
    <rect class="kant" x="22" y="60" width="76" height="26" rx="8"/>
    <path class="kant" d="M38 60V44M82 60V44"/>
    <circle class="led" cx="34" cy="73" r="3"/><circle class="led" cx="46" cy="73" r="3" style="animation-delay:-.4s"/>
    <circle class="led" cx="58" cy="73" r="3" style="animation-delay:-.9s"/>
    <g><circle class="pakke" cx="78" cy="100" r="3.4"/><circle class="pakke p2" cx="78" cy="100" r="3.4"/><circle class="pakke p3" cx="78" cy="100" r="3.4"/></g>
    <path class="kant" d="M26 100h68" stroke-dasharray="3 5" stroke-opacity=".2"/>
    <path class="kryss" d="M46 96l28 28M74 96l-28 28"/></svg>`,
  switch: `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect class="boks2" x="12" y="44" width="96" height="36" rx="7"/>
    <rect class="kant" x="12" y="44" width="96" height="36" rx="7"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect class="kant" x="${19 + i * 11}" y="52" width="8" height="9" rx="1.5" stroke-opacity=".25"/>
      <circle class="led" cx="${23 + i * 11}" cy="70" r="2.6" style="animation-delay:-${(i * 0.31).toFixed(2)}s"/>`).join("")}
    <g><circle class="pakke" cx="60" cy="98" r="3.2"/><circle class="pakke p2" cx="60" cy="98" r="3.2"/></g>
    <path class="kant" d="M16 98h88" stroke-dasharray="3 5" stroke-opacity=".2"/>
    <path class="kryss" d="M46 96l28 28M74 96l-28 28"/></svg>`,
  ap: `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g><circle class="bolge" cx="60" cy="62" r="18" transform-origin="60 62"/>
      <circle class="bolge b2" cx="60" cy="62" r="30" transform-origin="60 62"/>
      <circle class="bolge b3" cx="60" cy="62" r="42" transform-origin="60 62"/></g>
    <circle class="boks2" cx="60" cy="62" r="20"/>
    <circle class="kant" cx="60" cy="62" r="20"/>
    <circle class="led" cx="60" cy="62" r="5"/>
    <path class="kryss" d="M46 48l28 28M74 48l-28 28"/></svg>`,
  server: `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect class="boks2" x="26" y="22" width="68" height="76" rx="8"/>
    <rect class="kant" x="26" y="22" width="68" height="76" rx="8"/>
    ${[34, 52, 70].map((y, r) => `<path class="kant" d="M34 ${y + 10}h30" stroke-opacity=".22"/>
      ${[0, 1, 2].map((i) => `<circle class="led" cx="${72 + i * 8}" cy="${y + 6}" r="2.6" style="animation-delay:-${((r * 3 + i) * 0.27).toFixed(2)}s"/>`).join("")}`).join("")}
    <g class="vifte" transform="translate(46 80)"><circle class="kant" cx="0" cy="0" r="11" stroke-opacity=".25"/>
      <path d="M0-9C4-4 4 4 0 9M-9 0c5 4 13 4 18 0" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="2"/></g>
    <path class="kryss" d="M46 48l28 28M74 48l-28 28"/></svg>`,
  boks: `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect class="boks2" x="24" y="32" width="72" height="56" rx="10"/>
    <rect class="kant" x="24" y="32" width="72" height="56" rx="10"/>
    <rect class="skann" x="26" y="38" width="68" height="8" rx="4" fill="currentColor"/>
    <path class="kant" d="M34 74h22" stroke-opacity=".3"/>
    <circle class="led" cx="84" cy="42" r="3"/>
    <path class="kryss" d="M46 46l28 28M74 46l-28 28"/></svg>`,
};

class KiEnhetCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-enhet-card-editor"); }
  static getStubConfig() { return { navn: "Enhet", figur: "server" }; }
  getCardSize() { return 6; }

  setConfig(c) {
    if (!c) throw new Error("Mangler konfigurasjon");
    this._c = { figur: "server", navn: "Enhet", ...c };
    this._maal = (c.maalinger || []).slice(0, 4);
    this._info = c.info || [];
    this._kn = c.knapper || [];
    this._stil = c.info_stil === "fliser" ? "fliser" : "rader";
    this._graf = c.graf ? (typeof c.graf === "string" ? { entity: c.graf } : c.graf) : null;
    this._timer = c.timer ?? 24;
    this._hist = null;
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._oppdater();
    if (!g) { this._hentHist(); this._histTimer = setInterval(() => this._hentHist(), 5 * 60000); }
  }
  disconnectedCallback() { if (this._histTimer) clearInterval(this._histTimer); }

  /* --- historikk for minigrafene og den store grafen --- */
  _grafIder() {
    if (this._stil !== "rader") return this._graf ? [this._graf.entity] : [];
    const ids = this._info.filter((x) => x.entity && x.graf !== false && !x.attributt).map((x) => x.entity);
    if (this._graf && this._graf.entity) ids.unshift(this._graf.entity);
    return [...new Set(ids)];
  }
  async _hentHist() {
    const ids = this._grafIder(); if (!this._h || !ids.length) return;
    const start = new Date(Date.now() - this._timer * 3600000).toISOString();
    try {
      const res = await this._h.callApi("GET", `history/period/${start}?filter_entity_id=${ids.join(",")}&minimal_response&no_attributes`);
      const d = {};
      (res || []).forEach((arr) => { if (arr && arr.length) d[arr[0].entity_id] = arr.map((x) => [new Date(x.last_changed || x.last_updated).getTime(), x.state]); });
      this._hist = d; if (this._bygget) this._tegnGrafer();
    } catch (e) { this._hist = {}; }
  }
  _serie(id, maks) {
    const rå = (this._hist || {})[id] || [];
    const pts = rå.map(([t, v]) => [t, parseFloat(String(v).replace(",", "."))]).filter((p) => isFinite(p[1]));
    if (!pts.length) return null;
    const now = Date.now(), t0 = now - this._timer * 3600000;
    pts.push([now, pts[pts.length - 1][1]]);
    const ys = pts.map((p) => p[1]);
    let lo = Math.min(...ys), hi = maks ?? Math.max(...ys);
    if (maks !== undefined && maks !== null) lo = Math.min(lo, 0);
    if (hi - lo < 1e-9) { hi = lo + 1; lo -= 1; }
    const pad = (hi - lo) * 0.12;
    return { pts, t0, now, lo: lo - pad, hi: hi + pad };
  }
  _miniSvg(id, maks) {
    const rå = (this._hist || {})[id] || [];
    const digital = rå.length && rå.every(([, v]) => ["on", "off", "unavailable", "unknown"].includes(v));
    const W = 84, H = 24;
    if (digital) {
      const bånd = []; let på = null; const now = Date.now();
      rå.forEach(([t, v]) => { if (v === "on" && på === null) på = t; if (v !== "on" && på !== null) { bånd.push([på, t]); på = null; } });
      if (på !== null) bånd.push([på, now]);
      const t0 = now - this._timer * 3600000;
      const x = (t) => 1 + ((Math.max(t0, Math.min(now, t)) - t0) / (now - t0)) * (W - 2);
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect class="bnd" x="1" y="7" width="${W - 2}" height="10" rx="5"/>
        ${bånd.map(([a, b]) => `<rect class="bnd f" x="${x(a).toFixed(1)}" y="7" width="${Math.max(1.5, x(b) - x(a)).toFixed(1)}" height="10" rx="5"/>`).join("")}</svg>`;
    }
    const s = this._serie(id, maks);
    if (!s) return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line class="flat" x1="1" y1="12" x2="${W - 1}" y2="12"/></svg>`;
    const x = (t) => 1 + ((Math.max(s.t0, Math.min(s.now, t)) - s.t0) / (s.now - s.t0)) * (W - 2);
    const y = (v) => 3 + (1 - (v - s.lo) / (s.hi - s.lo)) * (H - 6);
    const d = s.pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const sis = s.pts[s.pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path class="a" d="${d} L${x(s.now).toFixed(1)},${H} L${x(s.pts[0][0]).toFixed(1)},${H} Z"/>
      <path class="l" d="${d}" vector-effect="non-scaling-stroke"/>
      <circle class="p" cx="${x(sis[0]).toFixed(1)}" cy="${y(sis[1]).toFixed(1)}" r="1.7"/></svg>`;
  }
  _storSvg() {
    const g = this._graf, W = 320, H = 70;
    const s = g ? this._serie(g.entity, g.maks) : null;
    if (!s) return `<line class="rute" x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}"/>`;
    const x = (t) => ((Math.max(s.t0, Math.min(s.now, t)) - s.t0) / (s.now - s.t0)) * W;
    const y = (v) => 5 + (1 - (v - s.lo) / (s.hi - s.lo)) * (H - 20);
    const d = s.pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const sis = s.pts[s.pts.length - 1];
    const midt = y(s.lo + (s.hi - s.lo) / 2).toFixed(1);
    const merker = [0, 1, 2, 3, 4].map((i) => { const t = s.t0 + (i / 4) * (s.now - s.t0);
      return `<text x="${x(t).toFixed(1)}" y="${H - 1}" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}">${new Date(t).getHours().toString().padStart(2, "0")}</text>`; }).join("");
    return `<line class="rute" x1="0" y1="${midt}" x2="${W}" y2="${midt}"/>
      <path class="omrade" d="${d} L${x(s.now).toFixed(1)},${H - 13} L${x(s.pts[0][0]).toFixed(1)},${H - 13} Z"/>
      <path class="linje" d="${d}" vector-effect="non-scaling-stroke"/>
      <circle class="punkt" cx="${x(sis[0]).toFixed(1)}" cy="${y(sis[1]).toFixed(1)}" r="2.5"/>${merker}`;
  }
  _tegnGrafer() {
    const r = this.shadowRoot; if (!r) return;
    if (this._graf) { const el = r.querySelector(".stor svg"); if (el) el.innerHTML = this._storSvg(); }
    if (this._stil !== "rader") return;
    this._info.forEach((x, i) => {
      const el = r.querySelector(`[data-mini="${i}"]`); if (!el || !x.entity) return;
      el.innerHTML = this._miniSvg(x.entity, x.maks);
    });
  }
  get hass() { return this._h; }

  _ider() {
    const c = this._c;
    return [c.status, c.oppetid, c.oppdatering, ...this._maal.map((m) => m.entity),
      ...this._info.map((i) => i.entity), ...this._kn.map((k) => k.entity)].filter(Boolean);
  }
  _st(id) { return id && this._h ? this._h.states[id] : undefined; }
  _tall(id) { const s = this._st(id); const n = s ? parseFloat(String(s.state).replace(",", ".")) : NaN; return isFinite(n) ? n : null; }

  /* Oppe/nede ut fra statusentiteten; uten status antas oppe */
  _oppe() {
    const c = this._c, s = this._st(c.status);
    if (!s) return c.status ? false : true;
    const liste = (c.status_pa || KI_ENHET_OPPE).map((v) => String(v).toLowerCase());
    return liste.includes(String(s.state).toLowerCase());
  }
  _verdi(e, standard) {
    const s = this._st(e.entity);
    if (!s) return standard ?? "–";
    if (e.attributt) { const v = s.attributes[e.attributt]; return v === undefined ? (standard ?? "–") : String(v); }
    let v = s.state;
    if (v === "unavailable" || v === "unknown") return "–";
    if (e.tekst) { const kart = e.tekst; if (kart[v] !== undefined) return kart[v]; }
    const n = parseFloat(String(v).replace(",", "."));
    if (isFinite(n) && e.desimaler !== undefined) v = n.toFixed(e.desimaler);
    const enhet = e.enhet !== undefined ? e.enhet : (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "");
    return String(v) + (enhet || "");
  }
  _farge(m, pst) {
    if (m.farge) return m.farge;
    const gul = m.gul ?? 70, rod = m.rod ?? 88;
    return pst >= rod ? "var(--red,#e8657a)" : pst >= gul ? "var(--yellow,#f5c542)" : "var(--green,#7ee081)";
  }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
  _trykk(k) {
    const h = this._h, id = k.entity;
    if (k.bekreft && !window.confirm(k.bekreft)) return;
    if (navigator.vibrate) navigator.vibrate(10);
    if (k.tjeneste) { const [d, s] = k.tjeneste.split("."); return h.callService(d, s, k.data || {}); }
    if (!id) return;
    const dom = id.split(".")[0];
    if (dom === "button" || dom === "input_button") return h.callService(dom, "press", { entity_id: id });
    if (dom === "scene") return h.callService("scene", "turn_on", { entity_id: id });
    if (dom === "script") return h.callService("script", "turn_on", { entity_id: id });
    return h.callService("homeassistant", "toggle", { entity_id: id });
  }

  _bygg() {
    const c = this._c;
    const R = 23, O = 2 * Math.PI * R;
    this.shadowRoot.innerHTML = `<style>${KI_ENHET_STIL}</style>
      <div class="rot">
        <div class="hero" role="button" tabindex="0">
          <div class="navn"><h3>${kiEnhetEsc(c.navn)}</h3><span class="pille"><i></i><span class="ptekst"></span></span></div>
          <div class="under"></div>
          <div class="maal">${this._maal.map((m, i) => `<div class="ring" data-ring="${i}">
            <svg viewBox="0 0 52 52"><circle class="spor" cx="26" cy="26" r="${R}"/>
              <circle class="bue" cx="26" cy="26" r="${R}" stroke-dasharray="${O.toFixed(1)}" stroke-dashoffset="${O.toFixed(1)}"/></svg>
            <div class="tall">–</div><div class="lab">${kiEnhetEsc(m.navn || "")}</div></div>`).join("")}</div>
          <div class="figur">${KI_ENHET_FIGUR[c.figur] || KI_ENHET_FIGUR.server}</div>
        </div>

        ${(this._info.length || this._graf) && this._stil === "rader" ? `<div class="panel" ${this._graf && this._graf.farge ? `style="--graf:${kiEnhetEsc(this._graf.farge)}"` : ""}>
          ${this._graf ? `<div class="stor" data-info="graf"><div class="topp"><div class="sverdi">–</div>
            <div class="snavn">${kiEnhetEsc(this._graf.navn || "")}${this._graf.navn ? " · " : ""}siste ${this._timer} t</div></div>
            <svg viewBox="0 0 320 70" preserveAspectRatio="none"></svg></div>` : ""}
          ${this._info.map((x, i) => {
            const graf = !!x.entity && x.graf !== false && !x.attributt;
            return `<div class="rad ${graf ? "" : "uten"}" data-info="${i}" tabindex="0">
              <div class="rn">${kiEnhetEsc(x.navn || "")}</div>
              ${graf ? `<div class="mini" data-mini="${i}"></div>` : ""}
              <div class="rv">–</div></div>`;
          }).join("")}
        </div>` : this._info.length ? `<div class="info">${this._info.map((x, i) =>
          `<div class="ifl ${x.entity ? "trykk" : ""}" data-info="${i}"><div class="n">${kiEnhetEsc(x.navn || "")}</div><div class="v">–</div></div>`).join("")}</div>` : ""}

        ${this._kn.length ? `<div class="knapper">${this._kn.map((k, i) =>
          `<button class="kn" data-kn="${i}" style="${k.farge ? `--kn-farge:${kiEnhetEsc(k.farge)}` : ""}">
            ${k.ikon ? `<ha-icon icon="${kiEnhetEsc(k.ikon)}"></ha-icon>` : ""}<span>${kiEnhetEsc(k.navn || "")}</span></button>`).join("")}</div>` : ""}
      </div>`;

    const r = this.shadowRoot;
    const hero = r.querySelector(".hero");
    hero.addEventListener("click", () => this._mer(c.status || (this._maal[0] || {}).entity));
    hero.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._mer(c.status); } });
    r.querySelectorAll("[data-ring]").forEach((el) => el.addEventListener("click", (e) => {
      e.stopPropagation(); this._mer(this._maal[+el.dataset.ring].entity);
    }));
    r.querySelectorAll("[data-info]").forEach((el) => el.addEventListener("click", () =>
      this._mer(el.dataset.info === "graf" ? (this._graf || {}).entity : (this._info[+el.dataset.info] || {}).entity)));
    r.querySelectorAll("[data-kn]").forEach((el) => el.addEventListener("click", () => this._trykk(this._kn[+el.dataset.kn])));
    this._O = O; this._bygget = true;
  }

  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, oppe = this._oppe();
    const hero = r.querySelector(".hero");
    hero.classList.toggle("oppe", oppe); hero.classList.toggle("nede", !oppe);
    const pille = r.querySelector(".pille");
    pille.classList.toggle("oppe", oppe); pille.classList.toggle("nede", !oppe);
    const st = this._st(c.status);
    r.querySelector(".ptekst").textContent = c.tekst_pa && oppe ? c.tekst_pa : c.tekst_av && !oppe ? c.tekst_av
      : oppe ? "Online" : st && ["unavailable", "unknown"].includes(st.state) ? "Utilgjengelig" : "Offline";

    /* undertekst: oppetid, oppdatering og valgfri egen tekst */
    const bit = [];
    if (c.oppetid) { const o = this._st(c.oppetid); if (o && !["unavailable", "unknown"].includes(o.state)) bit.push(`Oppetid <b>${kiEnhetEsc(o.state)}</b>`); }
    if (c.undertekst) bit.push(kiEnhetEsc(c.undertekst));
    const opp = this._st(c.oppdatering);
    if (opp) bit.push(opp.state === "on" ? "Ny fastvare" : "Oppdatert");
    const u = r.querySelector(".under"), ny = bit.join(" · ");
    if (u.innerHTML !== ny) u.innerHTML = ny;

    /* ringmålere */
    this._maal.forEach((m, i) => {
      const el = r.querySelector(`[data-ring="${i}"]`); if (!el) return;
      const v = this._tall(m.entity);
      const maks = m.maks ?? 100, min = m.min ?? 0;
      const pst = v === null ? 0 : Math.min(100, Math.max(0, ((v - min) / (maks - min)) * 100));
      const bue = el.querySelector(".bue");
      bue.style.strokeDashoffset = (this._O * (1 - (oppe ? pst : 0) / 100)).toFixed(1);
      bue.style.setProperty("--ring", this._farge(m, pst));
      const tekst = v === null ? "–" : (m.desimaler !== undefined ? v.toFixed(m.desimaler) : Math.round(v)) + (m.enhet ?? "");
      const tl = el.querySelector(".tall"); if (tl.textContent !== tekst) tl.textContent = tekst;
    });

    /* stor graf: verdien over grafen */
    if (this._graf) {
      const sv = r.querySelector(".stor .sverdi");
      if (sv) { const v = this._verdi(this._graf); if (sv.textContent !== v) sv.textContent = v; }
    }

    /* infofliser / inforader */
    this._info.forEach((x, i) => {
      const el = r.querySelector(`[data-info="${i}"]`); if (!el) return;
      const v = this._verdi(x);
      const vd = el.querySelector(".v") || el.querySelector(".rv"); if (vd && vd.textContent !== v) vd.textContent = v;
      let varsel = false;
      if (x.varsel_over !== undefined) { const n = this._tall(x.entity); varsel = n !== null && n > x.varsel_over; }
      if (x.varsel_er !== undefined) { const s = this._st(x.entity); varsel = !!s && String(s.state) === String(x.varsel_er); }
      el.classList.toggle("varsel", varsel);
    });
    this._tegnGrafer();

    /* knapper som er brytere viser tilstand */
    this._kn.forEach((k, i) => {
      const el = r.querySelector(`[data-kn="${i}"]`); if (!el || !k.entity) return;
      const dom = k.entity.split(".")[0];
      if (["light", "switch", "input_boolean", "fan"].includes(dom)) {
        const s = this._st(k.entity);
        el.classList.toggle("pa", !!s && s.state === "on");
      }
    });
  }
}
if (!customElements.get("ki-enhet-card")) customElements.define("ki-enhet-card", KiEnhetCard);

class KiEnhetCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { navn: "Navn", figur: "Figur", status: "Statusentitet", oppetid: "Oppetid", oppdatering: "Fastvare (update)", undertekst: "Egen undertekst" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "navn", selector: { text: {} } },
      { name: "figur", selector: { select: { mode: "dropdown", options: [
        { value: "ruter", label: "Ruter" }, { value: "switch", label: "Switch" }, { value: "ap", label: "Aksesspunkt" },
        { value: "server", label: "Server" }, { value: "boks", label: "VM eller container" }] } } },
      { name: "status", selector: { entity: {} } },
      { name: "oppetid", selector: { entity: { domain: ["sensor"] } } },
      { name: "oppdatering", selector: { entity: { domain: ["update"] } } },
      { name: "undertekst", selector: { text: {} } },
    ];
  }
}
if (!customElements.get("ki-enhet-card-editor")) customElements.define("ki-enhet-card-editor", KiEnhetCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-enhet-card")) window.customCards.push({ type: "ki-enhet-card", name: "KI Enhet", description: "Levende statuskort for ruter, switch, AP, server, VM og container", preview: true });

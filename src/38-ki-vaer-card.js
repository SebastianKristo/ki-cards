/* ki-vaer-card – vær med levende himmel, sol/måne og prognoser.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-vaer-card
 * naa: sensor.weather_forecast_v2      # attributtet current: temperature, feels_like, condition, wind_desc, precipitation, icon
 * vaer: weather.forecast_home          # prognoser (timer/dager) og uv_index
 * sol: sun.sun                         # next_dawn / next_dusk / next_rising / next_setting
 * maane: sensor.oslo_moon_phase
 * visning: alle                        # alle | naa | himmel | timer | dager
 * timer: 24    dager: 6
 */
const KI_VAER_VERSJON = "1.0.0";

const KI_VAER_STIL = `
  :host { display:block; }
  * { box-sizing:border-box; }
  .kort { position:relative; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); color:var(--gray1000);
    overflow:hidden; isolation:isolate; -webkit-tap-highlight-color:transparent; }
  .faner { display:flex; gap:4px; padding:8px 8px 0; }
  .fane { flex:1 1 0; border:0; background:none; color:var(--gray1000); font:inherit; font-size:13px; font-weight:500;
    opacity:.55; padding:8px 6px; border-radius:14px; cursor:pointer; transition:background .2s, opacity .2s; }
  .fane.valgt { opacity:1; background:var(--gray100); }
  .fane:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }
  .panel { display:none; } .panel.valgt { display:block; }

  /* ---- Været nå ---- */
  .naa { position:relative; height:170px; padding:24px 0 24px 24px; display:grid;
    grid-template-areas:"dag himmel" "temp himmel" "cond himmel"; grid-template-columns:1fr 42%;
    grid-template-rows:min-content 1fr min-content; }
  .naa .dag { grid-area:dag; font-size:14px; align-self:end; }
  .naa .temp { grid-area:temp; font-size:3.4em; line-height:1em; font-weight:300; padding-top:12px; white-space:nowrap; }
  .naa .temp small { font-size:.3em; font-weight:400; margin-left:4px; opacity:.75; }
  .naa .cond { grid-area:cond; align-self:end; font-size:13.5px; display:flex; gap:11px; flex-wrap:nowrap; overflow:hidden; }
  .naa .cond > * { white-space:nowrap; }
  .naa .cond b { font-weight:400; }
  .naa .cond span { opacity:.7; }
  .himmel { grid-area:himmel; position:relative; align-self:stretch; justify-self:stretch; margin:-24px 0; overflow:hidden; }

  /* himmelscene */
  .himmel svg { position:absolute; inset:0; width:100%; height:100%; }
  .solskive { transform-box:fill-box; transform-origin:center; }
  .solstr { transform-box:fill-box; transform-origin:center; animation:vsnurr 60s linear infinite; }
  @keyframes vsnurr { to { transform:rotate(360deg); } }
  .solpust { animation:vpust 5s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes vpust { 0%,100% { opacity:.35; transform:scale(1); } 50% { opacity:.6; transform:scale(1.08); } }
  .sky { transform-box:fill-box; animation:vdrift 26s linear infinite; }
  .sky { animation-timing-function:ease-in-out; animation-direction:alternate; }
  .sky.s2 { animation-duration:38s; animation-delay:-9s; } .sky.s3 { animation-duration:31s; animation-delay:-17s; }
  @keyframes vdrift { 0%,100% { transform:translateX(14%); } 50% { transform:translateX(-22%); } }
  .maanefig { transform-box:fill-box; transform-origin:center; animation:vflyt 11s ease-in-out infinite; }
  @keyframes vflyt { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  .vstj { animation:vblunk 4.5s ease-in-out infinite; }
  @keyframes vblunk { 0%,100% { opacity:.2; } 50% { opacity:.95; } }
  .lyn { opacity:0; animation:vlyn 6s ease-out infinite; }
  @keyframes vlyn { 0%,88%,100% { opacity:0; } 90% { opacity:1; } 93% { opacity:.2; } 95% { opacity:.9; } }
  .taake { animation:vtaake 14s ease-in-out infinite; transform-box:fill-box; }
  .taake.t2 { animation-duration:19s; animation-delay:-6s; }
  @keyframes vtaake { 0%,100% { transform:translateX(-8%); opacity:.28; } 50% { transform:translateX(10%); opacity:.5; } }

  /* nedbør */
  .nedbor { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
  .drape { position:absolute; top:-14%; width:1.6px; height:13px; border-radius:1px;
    background:linear-gradient(to bottom, rgba(150,200,255,0), rgba(160,210,255,.85));
    animation:vregn linear infinite; }
  @keyframes vregn { from { transform:translateY(-10px); } to { transform:translateY(230px); } }
  .fnugg { position:absolute; top:-10%; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.9);
    animation:vsno linear infinite; }
  @keyframes vsno { 0% { transform:translate(0,-10px); opacity:0; } 12% { opacity:.95; }
    50% { transform:translate(9px,110px); } 100% { transform:translate(-4px,220px); opacity:.5; } }
  .vind { position:absolute; height:2px; border-radius:2px; background:linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,.5), rgba(255,255,255,0));
    opacity:0; animation:vkast 7s ease-in-out infinite; }
  @keyframes vkast { 0%,100% { opacity:0; transform:translateX(-30px); } 40% { opacity:.55; } 70% { opacity:0; transform:translateX(120px); } }

  /* ---- Sol og måne ---- */
  .himmelrad { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:8px; }
  .boks { background:var(--gray100); border-radius:20px; padding:14px 16px; position:relative; overflow:hidden; }
  .boks .tit { font-size:13px; font-weight:500; opacity:.55; }
  .boks .verdi { font-size:20px; font-weight:400; margin-top:2px; }
  .boks .und { font-size:12px; opacity:.6; margin-top:2px; }
  .bue { grid-column:1 / -1; padding-bottom:10px; }
  .bue svg { width:100%; height:92px; display:block; overflow:visible; }
  .buevei { fill:none; stroke:currentColor; stroke-opacity:.18; stroke-width:2; stroke-dasharray:4 6; }
  .buegatt { fill:none; stroke:var(--yellow,#f5c542); stroke-width:3; stroke-linecap:round;
    transition:stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1); }
  .buesol { fill:var(--yellow,#f5c542); filter:drop-shadow(0 0 8px rgba(245,197,66,.7)); transition:transform 1.4s cubic-bezier(.2,.8,.2,1); }
  .buetider { display:flex; justify-content:space-between; font-size:12px; opacity:.6; margin-top:-6px; }
  .maanekort { display:flex; align-items:center; gap:14px; }
  .maanekort svg { width:58px; height:58px; flex:none; }
  .uvtall { font-size:28px; font-weight:400; line-height:1.1; }
  .uvstolpe { margin-top:8px; height:6px; border-radius:3px; overflow:hidden;
    background:linear-gradient(to right, var(--green,#7ee081), var(--yellow,#f5c542), var(--orange,#f0883e), var(--red,#e8657a), var(--purple,#a97bff)); }
  .uvpil { position:relative; height:10px; margin-top:2px; }
  .uvpil i { position:absolute; top:0; width:2px; height:8px; border-radius:1px; background:currentColor; transition:left 1s ease; }

  /* ---- prognoser ---- */
  .graf { padding:6px 8px 12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .graf::-webkit-scrollbar { display:none; }
  .graf svg { width:100%; display:block; overflow:visible; }
  .tlinje { fill:none; stroke:var(--yellow,#f5c542); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round;
    stroke-dasharray:var(--len,1000); stroke-dashoffset:var(--len,1000); animation:vtegn 1.6s ease-out forwards; }
  @keyframes vtegn { to { stroke-dashoffset:0; } }
  .tflate { fill:var(--yellow,#f5c542); opacity:0; animation:vflate 1.2s ease-out .6s forwards; }
  @keyframes vflate { to { opacity:.1; } }
  .pstolpe { fill:#6ec6ff; opacity:.75; transform-box:fill-box; transform-origin:50% 100%; transform:scaleY(0);
    animation:vstolpe .7s cubic-bezier(.2,.8,.2,1) forwards; }
  @keyframes vstolpe { to { transform:scaleY(1); } }
  .akse { font-size:10px; fill:currentColor; opacity:.5; }
  .tpunkt { fill:currentColor; opacity:.35; }
  .dagrad { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:14px; }
  .dagrad:nth-child(odd) { background:var(--gray100); }
  .dagrad .navn { width:44px; font-size:14px; font-weight:500; }
  .dagrad .mm { width:52px; text-align:right; font-size:12px; opacity:.6; }
  .dagrad .min, .dagrad .maks { width:38px; font-size:13px; opacity:.75; text-align:right; }
  .dagrad .spenn { flex:1; height:6px; border-radius:3px; background:var(--gray200); position:relative; overflow:hidden; }
  .dagrad .spenn i { position:absolute; top:0; bottom:0; border-radius:3px;
    background:linear-gradient(to right, #6ec6ff, var(--yellow,#f5c542)); width:0; animation:vspenn .9s cubic-bezier(.2,.8,.2,1) forwards; }
  .tom { padding:18px; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiVaerEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiVaerKl = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
const KI_VAER_UKEDAG = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
const KI_VAER_MAANEFASER = {
  new_moon: [0, 1], waxing_crescent: [0.25, 1], first_quarter: [0.5, 1], waxing_gibbous: [0.75, 1],
  full_moon: [1, 1], waning_gibbous: [0.75, -1], last_quarter: [0.5, -1], waning_crescent: [0.25, -1],
};
const KI_VAER_MAANENAVN = {
  new_moon: "Nymåne", waxing_crescent: "Voksende månesigd", first_quarter: "Første kvartal", waxing_gibbous: "Voksende halvmåne",
  full_moon: "Fullmåne", waning_gibbous: "Minkende halvmåne", last_quarter: "Siste kvartal", waning_crescent: "Minkende månesigd",
};
const KI_VAER_UVNIVA = [[11, "Ekstrem", "var(--purple,#a97bff)"], [8, "Svært sterk", "var(--red,#e8657a)"], [6, "Sterk", "var(--orange,#f0883e)"],
  [3, "Moderat", "var(--yellow,#f5c542)"], [1, "Lav", "var(--green,#7ee081)"], [0, "Svært lav", "var(--gray400)"]];

/* Leser værtype ut av en tekst eller HA-tilstand */
const kiVaerType = (tekst) => {
  const t = String(tekst || "").toLowerCase();
  const f = { sol: false, natt: false, skyer: 0, regn: 0, sno: 0, torden: false, taake: false, vind: 0 };
  if (/klar|sol|fair|sunny|clear/.test(t)) f.sol = true;
  if (/delvis|fair|partly/.test(t)) f.skyer = 1;
  if (/skyet|overskyet|cloudy|cloud/.test(t)) f.skyer = /delvis|partly/.test(t) ? 1 : 2;
  if (/regn|rain|yr|drizzle|sludd|byer|shower/.test(t)) f.regn = /kraftig|heavy|styrt/.test(t) ? 3 : /lett|light|yr|drizzle/.test(t) ? 1 : 2;
  if (/sn[øo]|snow|sludd|sleet/.test(t)) f.sno = /kraftig|heavy/.test(t) ? 3 : /lett|light/.test(t) ? 1 : 2;
  if (/torden|thunder|lightning/.test(t)) { f.torden = true; f.regn = Math.max(f.regn, 2); }
  if (/t[åa]ke|fog|mist|dis/.test(t)) f.taake = true;
  if (/vind|wind|storm|kuling|bris/.test(t)) f.vind = /sterk|storm|kuling/.test(t) ? 2 : 1;
  if (f.regn || f.sno || f.torden) f.skyer = Math.max(f.skyer, 2);
  return f;
};

class KiVaerCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._pro = {}; this._ab = []; }
  static getConfigElement() { return document.createElement("ki-vaer-card-editor"); }
  static getStubConfig() { return { naa: "sensor.weather_forecast_v2", vaer: "weather.forecast_home", sol: "sun.sun" }; }
  getCardSize() { return 6; }

  setConfig(c) {
    if (!c || (!c.naa && !c.vaer)) throw new Error("Sett naa: eller vaer:");
    this._c = { visning: "alle", timer: 24, dager: 6, ...c };
    const f = this._faner();
    this._fane = f.includes(c.start) ? c.start : f[0];
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    this._abonner();
    const ids = [c.naa, c.vaer, c.sol, c.maane].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._oppdater();
  }
  get hass() { return this._h; }

  _faner() {
    const c = this._c;
    if (c.visning && c.visning !== "alle") return [c.visning];
    const f = [];
    if (c.naa || c.vaer) f.push("naa");
    if (c.sol || c.maane || c.vaer) f.push("himmel");
    if (c.vaer) f.push("timer", "dager");
    return f;
  }

  /* Prognoser: abonnerer via websocket, faller tilbake på forecast-attributtet */
  _abonner() {
    const h = this._h, c = this._c;
    if (!h || !c.vaer || this._abStartet) return;
    this._abStartet = true;
    const fallback = () => {
      const s = h.states[c.vaer], a = s && s.attributes.forecast;
      if (a && a.length) { this._pro.daily = a; this._pro.hourly = a; this._oppdaterPro(); }
    };
    if (!h.connection || !h.connection.subscribeMessage) { fallback(); return; }
    for (const type of ["hourly", "daily"]) {
      h.connection.subscribeMessage(
        (m) => { this._pro[type] = m.forecast || []; this._oppdaterPro(); },
        { type: "weather/subscribe_forecast", forecast_type: type, entity_id: c.vaer }
      ).then((av) => this._ab.push(av)).catch(fallback);
    }
  }
  disconnectedCallback() { this._ab.forEach((f) => { try { f(); } catch (e) {} }); this._ab = []; this._abStartet = false; }
  connectedCallback() { if (this._bygget) this._abonner(); }

  _st(id) { return id && this._h ? this._h.states[id] : undefined; }
  _tall(v, d) { const n = parseFloat(v); return isFinite(n) ? n : d; }

  /* Samler «nå»-verdiene fra current-attributtet eller væreentiteten */
  _naa() {
    const c = this._c, s = this._st(c.naa), v = this._st(c.vaer);
    const cur = (s && s.attributes && s.attributes.current) || {};
    const va = (v && v.attributes) || {};
    const temp = this._tall(cur.temperature, this._tall(va.temperature, null));
    return {
      temp, foles: this._tall(cur.feels_like, this._tall(va.apparent_temperature, null)),
      kond: cur.condition || (v ? v.state : "") || "",
      vind: cur.wind_desc || (va.wind_speed !== undefined ? `${Math.round(va.wind_speed)} ${va.wind_speed_unit || "m/s"}` : ""),
      nedbor: this._tall(cur.precipitation, null),
      ikon: cur.icon || null,
    };
  }
  _erNatt() {
    const s = this._st(this._c.sol);
    if (s) return s.state === "below_horizon";
    const t = new Date().getHours(); return t < 6 || t >= 21;
  }
  _uv() {
    const c = this._c, v = this._st(c.vaer), s = this._st(c.naa);
    let uv = v && v.attributes.uv_index;
    if (uv === undefined && s) uv = (s.attributes.current || {}).uv_index;
    return this._tall(uv, null);
  }

  /* ---------- himmelscene ---------- */
  _scene() {
    const f = kiVaerType(this._naa().kond), natt = this._erNatt();
    const sky = (kl, x, y, s, o) => `<g class="sky ${kl}" transform="translate(${x} ${y}) scale(${s})" opacity="${o}" fill="currentColor">
      <circle cx="15" cy="15" r="11"/><circle cx="33" cy="11" r="14"/><circle cx="51" cy="17" r="10"/>
      <rect x="3" y="17" width="56" height="12" rx="6"/></g>`;
    const stjerner = [[14, 16], [38, 9], [58, 26], [80, 14], [100, 32], [28, 40], [68, 46], [92, 58]];
    let lag = "";
    if (natt) {
      lag += stjerner.map(([x, y], i) => `<circle class="vstj" cx="${x}" cy="${y}" r="1.6" fill="#fff" style="animation-delay:-${(i * 0.6).toFixed(1)}s"/>`).join("");
      lag += `<g class="maanefig" transform="translate(74 34)"><circle cx="0" cy="0" r="26" fill="#fdf3d0" opacity=".18"/>
        <path d="M8 -17a18 18 0 1 0 6 27 15 15 0 0 1-6-27z" fill="#fdf3d0"/></g>`;
    } else if (f.sol || f.skyer < 2) {
      lag += `<g transform="translate(72 38)">
        <circle class="solpust" cx="0" cy="0" r="27" fill="var(--yellow,#f5c542)" opacity=".22"/>
        <g class="solstr" opacity=".65"><path d="M0-26v-9M0 26v9M-26 0h-9M26 0h9M-18-18l-6-6M18 18l6 6M18-18l6-6M-18 18l-6 6"
          stroke="var(--yellow,#f5c542)" stroke-width="3" stroke-linecap="round"/></g>
        <circle class="solskive" cx="0" cy="0" r="17" fill="var(--yellow,#f5c542)"/></g>`;
    }
    if (f.skyer >= 1) {
      const o = f.skyer >= 2 ? 0.42 : 0.3;
      lag += sky("s1", 20, 42, 1, o) + sky("s2", 60, 22, 0.7, o * 0.8);
      if (f.skyer >= 2) lag += sky("s3", 4, 62, 0.85, o * 0.9);
    }
    if (f.torden) lag += `<path class="lyn" d="M58 58l-9 20h8l-6 18 16-24h-8l6-14z" fill="var(--yellow,#f5c542)"/>`;
    if (f.taake) lag += `<g><rect class="taake" x="-10" y="76" width="150" height="7" rx="3.5" fill="currentColor" opacity=".35"/>
      <rect class="taake t2" x="-10" y="90" width="150" height="7" rx="3.5" fill="currentColor" opacity=".28"/></g>`;

    let fall = "";
    const drapetall = f.regn ? [10, 18, 28][f.regn - 1] : 0;
    for (let i = 0; i < drapetall; i++) {
      const x = (i * 37 + 11) % 96 + 2, d = (i * 0.31) % 1.4, v = 0.62 + ((i * 0.17) % 0.5);
      fall += `<i class="drape" style="left:${x}%;animation-duration:${v.toFixed(2)}s;animation-delay:-${d.toFixed(2)}s;height:${f.regn >= 3 ? 17 : 13}px"></i>`;
    }
    const fnuggtall = f.sno ? [8, 14, 20][f.sno - 1] : 0;
    for (let i = 0; i < fnuggtall; i++) {
      const x = (i * 43 + 7) % 94 + 3, d = (i * 0.53) % 4, v = 3.6 + ((i * 0.29) % 2.4);
      fall += `<i class="fnugg" style="left:${x}%;animation-duration:${v.toFixed(2)}s;animation-delay:-${d.toFixed(2)}s;width:${3 + (i % 3)}px;height:${3 + (i % 3)}px"></i>`;
    }
    for (let i = 0; i < f.vind * 2; i++) {
      fall += `<i class="vind" style="top:${30 + i * 22}%;width:${34 + i * 12}px;left:${6 + i * 9}%;animation-delay:-${(i * 1.7).toFixed(1)}s"></i>`;
    }
    return `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(0 13)">${lag}</g></svg>
      ${fall ? `<div class="nedbor">${fall}</div>` : ""}`;
  }

  /* ---------- sol og måne ---------- */
  _solbue() {
    const s = this._st(this._c.sol);
    if (!s) return "";
    const a = s.attributes, na = new Date();
    const d = (v) => { const x = v ? new Date(v) : null; return x && !isNaN(x) ? x : null; };
    const opp = d(a.next_rising), ned = d(a.next_setting);
    let start, slutt, natt = s.state === "below_horizon";
    if (!natt && ned) { start = opp && opp < ned ? opp : new Date(ned.getTime() - 16 * 3600e3); slutt = ned; }
    else if (opp) { slutt = opp; start = ned && ned < opp ? ned : new Date(opp.getTime() - 8 * 3600e3); }
    if (!start || !slutt) return "";
    const p = Math.min(1, Math.max(0, (na - start) / (slutt - start)));
    /* halvsirkel fra (10,86) til (230,86) */
    const bue = (t) => [10 + 220 * t, 86 - Math.sin(Math.PI * t) * 66];
    const [sx, sy] = bue(p), len = 300;
    const tid = (x) => (x ? kiVaerKl(x) : "–");
    const dawn = d(a.next_dawn), dusk = d(a.next_dusk);
    return `<div class="boks bue">
      <div class="tit">${natt ? "Soloppgang" : "Sol"}</div>
      <svg viewBox="0 0 240 96">
        <path class="buevei" d="M10 86 A110 110 0 0 1 230 86"/>
        <path class="buegatt" d="M10 86 A110 110 0 0 1 230 86" style="stroke-dasharray:${len};stroke-dashoffset:${(len * (1 - p)).toFixed(1)}"/>
        <line x1="6" y1="86" x2="234" y2="86" stroke="currentColor" stroke-opacity=".2" stroke-width="1"/>
        <circle class="buesol" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="7"/>
      </svg>
      <div class="buetider"><span>${natt ? tid(dawn) : tid(start)}</span><span>${natt ? tid(opp) : tid(slutt)}</span></div>
    </div>`;
  }
  _maanesvg(fase) {
    const [lys, retning] = KI_VAER_MAANEFASER[fase] || [0.5, 1];
    const r = 26, off = (1 - lys) * 2 * r * retning;
    return `<svg viewBox="-32 -32 64 64" aria-hidden="true">
      <defs><mask id="mf"><rect x="-32" y="-32" width="64" height="64" fill="#000"/>
        <circle cx="0" cy="0" r="${r}" fill="#fff"/><circle cx="${off.toFixed(1)}" cy="0" r="${r}" fill="#000"/></mask></defs>
      <circle cx="0" cy="0" r="${r}" fill="currentColor" opacity=".12"/>
      <g mask="url(#mf)"><circle cx="0" cy="0" r="${r}" fill="#fdf3d0"/>
        <circle cx="-8" cy="-7" r="4.5" fill="#e7dcb8" opacity=".7"/><circle cx="7" cy="6" r="6" fill="#e7dcb8" opacity=".55"/>
        <circle cx="10" cy="-9" r="3" fill="#e7dcb8" opacity=".5"/></g></svg>`;
  }
  _himmel() {
    const c = this._c, m = this._st(c.maane), uv = this._uv();
    const fase = m ? String(m.state) : "";
    const uvn = uv === null ? null : KI_VAER_UVNIVA.find(([g]) => uv >= g) || KI_VAER_UVNIVA[KI_VAER_UVNIVA.length - 1];
    const s = this._st(c.sol), a = (s && s.attributes) || {};
    const kl = (v) => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? kiVaerKl(d) : "–"; };
    return `<div class="himmelrad">
      ${this._solbue()}
      ${m ? `<div class="boks"><div class="tit">Måne</div><div class="maanekort">${this._maanesvg(fase)}
        <div><div class="verdi" style="font-size:15px">${kiVaerEsc(KI_VAER_MAANENAVN[fase] || fase.replace(/_/g, " "))}</div>
        <div class="und">${Math.round((KI_VAER_MAANEFASER[fase] || [0])[0] * 100)} % opplyst</div></div></div></div>` : ""}
      ${uvn ? `<div class="boks"><div class="tit">UV-indeks</div>
        <div class="uvtall" style="color:${uvn[2]}">${uv.toFixed(1)}</div><div class="und">${uvn[1]}</div>
        <div class="uvstolpe"></div><div class="uvpil"><i style="left:${Math.min(100, (uv / 12) * 100).toFixed(0)}%"></i></div></div>` : ""}
      ${!m && !uvn ? `<div class="boks"><div class="tit">Daggry</div><div class="verdi">${kl(a.next_dawn)}</div>
        <div class="und">Skumring ${kl(a.next_dusk)}</div></div>` : ""}
    </div>`;
  }

  /* ---------- prognoser ---------- */
  _timer() {
    const liste = (this._pro.hourly || []).slice(0, this._c.timer);
    if (!liste.length) return `<div class="tom">Venter på timeprognose …</div>`;
    const B = 30, H = 120, topp = 18, bunn = 74, V = liste.length * B;
    const t = liste.map((x) => this._tall(x.temperature, 0));
    const mn = Math.min(...t), mx = Math.max(...t), spenn = Math.max(1, mx - mn);
    const y = (v) => topp + (1 - (v - mn) / spenn) * (bunn - topp - 16);
    const x = (i) => i * B + B / 2;
    const pkt = t.map((v, i) => [x(i), y(v)]);
    const linje = pkt.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)} ${b.toFixed(1)}`).join(" ");
    const flate = `${linje} L${x(t.length - 1).toFixed(1)} ${bunn} L${x(0).toFixed(1)} ${bunn} Z`;
    const nedb = liste.map((r) => this._tall(r.precipitation, 0));
    const pmaks = Math.max(1.2, ...nedb);
    return `<div class="graf"><svg viewBox="0 0 ${V} ${H}" style="min-width:${V}px;--len:${(V * 1.3).toFixed(0)}">
      <path class="tflate" d="${flate}"/>
      <path class="tlinje" d="${linje}"/>
      ${pkt.map(([a, b], i) => i % 3 === 0 ? `<text class="akse" x="${a.toFixed(1)}" y="${(b - 9).toFixed(1)}" text-anchor="middle">${Math.round(t[i])}°</text>` : "").join("")}
      ${nedb.map((mm, i) => { const h = Math.max(3, (mm / pmaks) * 28); return mm > 0.05
        ? `<rect class="pstolpe" x="${(x(i) - 6).toFixed(1)}" y="${(bunn + 30 - h).toFixed(1)}" width="12" height="${h.toFixed(1)}" rx="3" style="animation-delay:${(i * 0.03).toFixed(2)}s"/>` : ""; }).join("")}
      ${pmaks > 1.2 ? `<text class="akse" x="2" y="${bunn + 10}">${pmaks.toFixed(1)} mm</text>` : ""}
      <line x1="0" y1="${bunn + 31}" x2="${V}" y2="${bunn + 31}" stroke="currentColor" stroke-opacity=".15"/>
      ${liste.map((r, i) => i % 3 === 0 ? `<text class="akse" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${kiVaerKl(new Date(r.datetime))}</text>` : "").join("")}
    </svg></div>`;
  }
  _dager() {
    const alle = this._pro.daily || [];
    const liste = (this._c.hopp_forste ? alle.slice(1) : alle).slice(0, this._c.dager);
    if (!liste.length) return `<div class="tom">Venter på døgnprognose …</div>`;
    const lo = liste.map((d) => this._tall(d.templow, this._tall(d.temperature, 0)));
    const hi = liste.map((d) => this._tall(d.temperature, 0));
    const mn = Math.min(...lo), mx = Math.max(...hi), spenn = Math.max(1, mx - mn);
    return `<div class="graf" style="padding:4px 8px 10px">
      ${liste.map((d, i) => {
        const dt = new Date(d.datetime), v = (lo[i] - mn) / spenn * 100, b = (hi[i] - lo[i]) / spenn * 100;
        const mm = this._tall(d.precipitation, 0);
        return `<div class="dagrad">
          <div class="navn">${i === 0 && !this._c.hopp_forste ? "I dag" : KI_VAER_UKEDAG[dt.getDay()]}</div>
          <div class="min">${Math.round(lo[i])}°</div>
          <div class="spenn"><i style="left:${v.toFixed(1)}%;animation-delay:${(i * 0.06).toFixed(2)}s;--b:${Math.max(6, b).toFixed(1)}%;width:${Math.max(6, b).toFixed(1)}%"></i></div>
          <div class="maks">${Math.round(hi[i])}°</div>
          <div class="mm">${mm > 0.05 ? mm.toFixed(1) + " mm" : ""}</div>
        </div>`;
      }).join("")}</div>`;
  }
  _oppdaterPro() {
    if (!this._bygget) return;
    const r = this.shadowRoot;
    const t = r.querySelector('.panel[data-p="timer"]'), d = r.querySelector('.panel[data-p="dager"]');
    if (t) t.innerHTML = this._timer();
    if (d) d.innerHTML = this._dager();
  }

  /* ---------- oppbygging ---------- */
  _bygg() {
    const c = this._c, faner = this._faner();
    const navn = { naa: "Nå", himmel: "Sol og måne", timer: "Timer", dager: "Dager" };
    this.shadowRoot.innerHTML = `<style>${KI_VAER_STIL}</style>
      <div class="kort">
        ${faner.length > 1 ? `<div class="faner" role="tablist">${faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" role="tab" data-f="${f}">${navn[f]}</button>`).join("")}</div>` : ""}
        ${faner.map((f) => `<div class="panel ${f === this._fane ? "valgt" : ""}" data-p="${f}"></div>`).join("")}
      </div>`;
    this.shadowRoot.querySelectorAll(".fane").forEach((b) =>
      b.addEventListener("click", () => { this._fane = b.dataset.f; this._bygget = false; this._oppdater(); }));
    this._bygget = true;
  }
  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot;
    const p = (f) => r.querySelector(`.panel[data-p="${f}"]`);
    const n = this._naa(), pn = p("naa");
    if (pn) {
      const bit = [];
      if (n.kond) bit.push(`<b>${kiVaerEsc(n.kond.charAt(0).toUpperCase() + n.kond.slice(1))}</b>`);
      if (n.vind) bit.push(`<span>${kiVaerEsc(n.vind)}</span>`);
      if (n.nedbor !== null) bit.push(`<span>${n.nedbor} mm</span>`);
      pn.innerHTML = `<div class="naa">
        <div class="dag">${kiVaerEsc(c.tittel || "Været nå")}</div>
        <div class="temp">${n.temp === null ? "–" : Math.round(n.temp) + "°"}${n.foles === null ? "" : `<small>${Math.round(n.foles)}°</small>`}</div>
        <div class="cond">${bit.join("")}</div>
        <div class="himmel">${this._scene()}</div>
      </div>`;
      pn.querySelector(".naa").addEventListener("click", () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: c.vaer || c.naa }, bubbles: true, composed: true })));
    }
    const ph = p("himmel"); if (ph) ph.innerHTML = this._himmel();
    this._oppdaterPro();
  }
}
if (!customElements.get("ki-vaer-card")) customElements.define("ki-vaer-card", KiVaerCard);

class KiVaerCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { naa: "Sensor med current-attributt", vaer: "Værentitet (prognoser og UV)", sol: "Sol", maane: "Månefase",
        visning: "Visning", timer: "Antall timer", dager: "Antall døgn", tittel: "Tittel", hopp_forste: "Hopp over i dag" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "naa", selector: { entity: { domain: ["sensor"] } } },
      { name: "vaer", selector: { entity: { domain: ["weather"] } } },
      { name: "sol", selector: { entity: { domain: ["sun"] } } },
      { name: "maane", selector: { entity: { domain: ["sensor"] } } },
      { name: "visning", selector: { select: { mode: "dropdown", options: [
        { value: "alle", label: "Alle faner" }, { value: "naa", label: "Bare nå" }, { value: "himmel", label: "Sol og måne" },
        { value: "timer", label: "Timer" }, { value: "dager", label: "Dager" }] } } },
      { name: "timer", selector: { number: { mode: "box", min: 6, max: 48 } } },
      { name: "dager", selector: { number: { mode: "box", min: 2, max: 10 } } },
      { name: "hopp_forste", selector: { boolean: {} } },
      { name: "tittel", selector: { text: {} } },
    ];
  }
}
if (!customElements.get("ki-vaer-card-editor")) customElements.define("ki-vaer-card-editor", KiVaerCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-vaer-card")) window.customCards.push({ type: "ki-vaer-card", name: "KI Vær", description: "Vær med levende himmel, solbue, månefase, UV og prognoser", preview: true });

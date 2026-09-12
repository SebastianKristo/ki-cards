/* ki-strompris-card – strømpris i dag / i morgen med Norgespris. Frittstående (ingen avhengigheter).
 * Legg filen i /config/www/ og legg til ressursen /local/ki-strompris-card.js (JavaScript-modul).
 *
 * type: custom:ki-strompris-card
 * norgespris: sensor.norgespris_total_strompris_norgespris   # det du faktisk betaler, i kr/kWh
 * spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # auto: første sensor med raw_today
 * spart_dag: sensor.norgespris_besparelse_dag        spart_ar: sensor.norgespris_besparelse_ar
 * effekt: sensor.strommaler_effekt                   # viser hva du bruker akkurat nå
 * tittel: Strøm      hoyde: 170      vindu: 3        # timer i «billigste vindu»
 * skala: 0.01        # øre → kr. Settes automatisk når enheten er øre.
 *
 * Grafen viser spotprisen time for time. Den vannrette stiplede linjen er Norgespris:
 * er kurven over linjen, sparer du på Norgespris i den timen.
 */
const KI_SP_VERSJON = "2.0.0";
const KI_SP_TIME = 3600000;

const KI_SP_STIL = `
  :host { display:block; --myk:cubic-bezier(.2,.8,.2,1); }
  .kort { position:relative; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200, var(--card-background-color));
    color:var(--gray1000, var(--primary-text-color)); padding:16px 16px 12px; overflow:hidden; isolation:isolate; }
  .kort::before { content:""; position:absolute; inset:-40% -10% auto -10%; height:70%; z-index:-1; opacity:.2;
    background:radial-gradient(60% 100% at 30% 0%, var(--tone,#8fe3c0), transparent 70%); }
  .topp { display:flex; justify-content:space-between; align-items:center; gap:10px; }
  .tittel { font-size:16px; font-weight:500; }
  .valg { display:flex; gap:4px; }
  .valg .v { padding:5px 12px; border-radius:24px; font-size:13px; font-weight:500; cursor:pointer; opacity:.7;
    border:1px solid var(--gray400,rgba(128,128,128,.4)); transition:all .3s; -webkit-tap-highlight-color:transparent; }
  .valg .v.aktiv { background:var(--active-big,#ee95ff); border-color:transparent; color:rgba(70,58,64,.95); opacity:1; }
  .valg .v[disabled] { opacity:.28; pointer-events:none; }
  .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin:12px 0 2px; }
  .stor { font-size:2.6em; font-weight:300; line-height:1; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
  .stor small { font-size:.34em; font-weight:400; opacity:.6; margin-left:6px; letter-spacing:0; }
  .merke { font-size:12.5px; opacity:.65; }
  .hoyre { text-align:right; font-size:13px; line-height:1.5; }
  .spar { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:12.5px; font-weight:600;
    background:color-mix(in srgb, var(--green) 26%, transparent); }
  .spar.tap { background:color-mix(in srgb, var(--red) 26%, transparent); }
  .spar ha-icon { --mdc-icon-size:15px; }
  .grafboks { position:relative; margin:10px -6px 0; touch-action:pan-y; }
  .grafboks svg { display:block; width:100%; height:100%; overflow:hidden; }
  .strek { stroke-linecap:round; stroke-linejoin:round; }
  .naalinje { stroke:var(--gray1000, var(--primary-text-color)); stroke-width:1; opacity:.35; stroke-dasharray:3 4; }
  .nplinje { stroke:#7ab8ff; stroke-width:1.6; stroke-dasharray:5 5; opacity:.9; }
  .sveip { animation:sp-sveip 1.1s var(--myk) forwards; transform-origin:left center; transform-box:fill-box; }
  @keyframes sp-sveip { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  .naapunkt { animation:sp-ping 2.4s ease-out infinite; transform-origin:center; transform-box:fill-box; }
  @keyframes sp-ping { 0% { r:4; opacity:.9; } 70%,100% { r:13; opacity:0; } }
  .akse { display:flex; justify-content:space-between; font-size:11px; opacity:.55; padding:4px 4px 0; font-variant-numeric:tabular-nums; }
  .boble { position:absolute; top:0; transform:translateX(-50%); background:var(--gray1000, var(--primary-text-color)); color:var(--gray100, var(--card-background-color));
    padding:5px 10px; border-radius:12px; font-size:12px; font-weight:600; white-space:nowrap; pointer-events:none; z-index:2; }
  .boble small { display:block; font-weight:400; opacity:.7; font-size:10.5px; }
  .stat { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; }
  .stat > div { background:rgba(128,128,128,.12); border-radius:16px; padding:9px 11px; }
  .stat b { display:block; font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
  .stat span { font-size:11.5px; opacity:.6; }
  .vindu { display:flex; align-items:center; gap:9px; margin-top:8px; font-size:13px; padding:10px 12px; border-radius:16px;
    background:linear-gradient(90deg,color-mix(in srgb,var(--green) 22%,transparent),transparent); }
  .vindu ha-icon { --mdc-icon-size:19px; color:var(--green); }
  .forkl { display:flex; flex-wrap:wrap; gap:14px; font-size:11.5px; opacity:.65; margin-top:8px; }
  .forkl i { display:inline-block; width:14px; height:3px; border-radius:2px; vertical-align:middle; margin-right:5px; }
  .venter { padding:30px 10px; text-align:center; font-size:14px; opacity:.7; }
  .venter i { display:inline-block; width:6px; height:6px; margin:0 2px; border-radius:50%; background:currentColor; animation:sp-hopp 1.2s ease-in-out infinite; }
  .venter i:nth-child(2) { animation-delay:.15s; } .venter i:nth-child(3) { animation-delay:.3s; }
  @keyframes sp-hopp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiSpEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiSpNf = (v, d = 2) => (v === null || v === undefined || v === "" || isNaN(v)) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
const kiSpKl = (t) => new Date(t).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
const kiSpKlamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kiSpFarge = (f) => f < 0.34 ? "#3ddc97" : f < 0.67 ? "#ffd24a" : "#ff6b5c";

class KiStromprisCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._valgt = null; this._dag = "i_dag"; this._gid = "sp" + Math.random().toString(36).slice(2, 8); }
  static getStubConfig() { return { norgespris: "sensor.norgespris_total_strompris_norgespris" }; }
  static getConfigElement() { return document.createElement("ki-strompris-card-editor"); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_rows: 5 }; }

  setConfig(c) {
    this._c = { tittel: "Strøm", norgespris: "sensor.norgespris_total_strompris_norgespris", spart_dag: "sensor.norgespris_besparelse_dag",
      spart_ar: "sensor.norgespris_besparelse_ar", effekt: "sensor.strommaler_effekt", hoyde: 170, vindu: 3, ...(c || {}) };
    this._bygget = false; this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 300000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _st(id) { return (this._h && id && this._h.states[id]) || null; }
  _num(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
  _spot() { if (this._c.spot) return this._c.spot; const h = this._h;
    return this._auto || (this._auto = Object.keys(h.states).find((id) => id.startsWith("sensor.") && Array.isArray(h.states[id].attributes.raw_today))); }
  _ider() { const c = this._c; return [this._spot(), c.norgespris, c.spart_dag, c.spart_ar, c.effekt].filter(Boolean); }
  _skala() { const s = this._st(this._spot()); if (this._c.skala !== undefined) return this._c.skala;
    return /øre|ore/i.test((s && s.attributes.unit_of_measurement) || "") ? 0.01 : 1; }

  /* Timespriser for valgt dag, skalert til kr/kWh */
  _punkter() {
    const s = this._st(this._spot()); if (!s) return null;
    const raa = this._dag === "i_morgen" ? s.attributes.raw_tomorrow : s.attributes.raw_today;
    if (!Array.isArray(raa) || !raa.length) return [];
    const k = this._skala();
    return raa.map((p) => ({ t: new Date(p.start).getTime(), slutt: new Date(p.end).getTime(), v: p.value === null ? null : p.value * k })).filter((p) => p.v !== null && !isNaN(p.t));
  }
  _harMorgen() { const s = this._st(this._spot()); const r = s && s.attributes.raw_tomorrow; return Array.isArray(r) && r.some((p) => p.value !== null && p.value !== undefined); }
  _np() { const v = this._num(this._c.norgespris); return v === null && typeof this._c.norgespris === "number" ? this._c.norgespris : v; }

  _graf(pkt, np) {
    const c = this._c, B = 14, H = c.hoyde, V = 320, x0 = pkt[0].t, x1 = pkt[pkt.length - 1].slutt;
    const verdier = pkt.map((p) => p.v), lav = Math.min(...verdier, np ?? Infinity), hoy = Math.max(...verdier, np ?? -Infinity);
    const pad = (hoy - lav) * 0.18 || 0.1, ymin = Math.max(0, lav - pad), ymax = hoy + pad;
    const X = (t) => ((t - x0) / (x1 - x0)) * V, Y = (v) => B + (1 - (v - ymin) / (ymax - ymin || 1)) * (H - B * 2);
    this._x0 = x0; this._x1 = x1;

    // trappekurve
    let d = "";
    pkt.forEach((p, i) => { const y = Y(p.v); d += `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${y.toFixed(1)} L${X(p.slutt).toFixed(1)} ${y.toFixed(1)} `; });
    const fyll = `${d} L${X(x1).toFixed(1)} ${H} L${X(x0).toFixed(1)} ${H} Z`;

    // fargen følger prisnivået: grønt nederst (billig), rødt øverst (dyrt)
    const gy = [0, 0.5, 1].map((f) => `<stop offset="${(f * 100).toFixed(0)}%" stop-color="${kiSpFarge(1 - f)}"/>`).join("");

    const naa = Date.now(), iNaa = pkt.findIndex((p) => p.t <= naa && naa < p.slutt);
    const min = pkt.reduce((a, b) => (b.v < a.v ? b : a)), maks = pkt.reduce((a, b) => (b.v > a.v ? b : a));
    const merke = (p, tekst, farge) => `<g><circle cx="${X((p.t + p.slutt) / 2).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.5" fill="${farge}"/>
      <text x="${kiSpKlamp(X((p.t + p.slutt) / 2), 18, V - 18).toFixed(1)}" y="${(Y(p.v) - 9).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="${farge}" font-weight="600">${tekst}</text></g>`;

    const valgt = this._valgt !== null && pkt[this._valgt] ? pkt[this._valgt] : null;
    return `<svg viewBox="0 0 ${V} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img" aria-label="Spotpris time for time">
      <defs><linearGradient id="${this._gid}-l" gradientUnits="userSpaceOnUse" x1="0" y1="${B}" x2="0" y2="${H - B}">${gy}</linearGradient>
        <linearGradient id="${this._gid}-f" gradientUnits="userSpaceOnUse" x1="0" y1="${B}" x2="0" y2="${H}">
          <stop offset="0" stop-color="${kiSpFarge(0.85)}" stop-opacity=".22"/><stop offset="65%" stop-color="${kiSpFarge(0.15)}" stop-opacity=".14"/><stop offset="100%" stop-color="${kiSpFarge(0)}" stop-opacity="0"/></linearGradient>
        <filter id="${this._gid}-s" x="-5%" y="-20%" width="110%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity=".5"/></filter></defs>
      <g class="sveip"><path d="${fyll}" fill="url(#${this._gid}-f)"/>
      <path class="strek" d="${d}" fill="none" stroke="url(#${this._gid}-l)" stroke-width="3" vector-effect="non-scaling-stroke" filter="url(#${this._gid}-s)"/>
      ${np !== null && np >= ymin && np <= ymax ? `<line class="nplinje" x1="0" y1="${Y(np).toFixed(1)}" x2="${V}" y2="${Y(np).toFixed(1)}" vector-effect="non-scaling-stroke"/>
        <text x="4" y="${(Y(np) - 6).toFixed(1)}" font-size="10" fill="#7ab8ff" font-weight="600">Norgespris</text>` : ""}
      </g>${merke(min, kiSpNf(min.v, 2), "#3ddc97")}${merke(maks, kiSpNf(maks.v, 2), "#ff6b5c")}
      ${iNaa >= 0 ? `<line class="naalinje" x1="${X(naa).toFixed(1)}" y1="0" x2="${X(naa).toFixed(1)}" y2="${H}" vector-effect="non-scaling-stroke"/>
        <circle class="naapunkt" cx="${X(naa).toFixed(1)}" cy="${Y(pkt[iNaa].v).toFixed(1)}" r="4" fill="none" stroke="var(--gray1000, #fff)" stroke-width="1.5"/>
        <circle cx="${X(naa).toFixed(1)}" cy="${Y(pkt[iNaa].v).toFixed(1)}" r="4" fill="var(--gray1000, #fff)"/>` : ""}
      ${valgt ? `<line x1="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" y1="0" x2="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" y2="${H}" stroke="var(--gray1000,#fff)" stroke-width="1" opacity=".5" vector-effect="non-scaling-stroke"/>
        <circle cx="${X((valgt.t + valgt.slutt) / 2).toFixed(1)}" cy="${Y(valgt.v).toFixed(1)}" r="4.5" fill="var(--gray1000,#fff)"/>` : ""}
    </svg>${valgt ? `<div class="boble" style="left:${kiSpKlamp(((X((valgt.t + valgt.slutt) / 2)) / V) * 100, 12, 88).toFixed(1)}%">${kiSpNf(valgt.v, 2)} kr<small>kl ${kiSpKl(valgt.t)}–${kiSpKl(valgt.slutt)}${np !== null ? ` · ${valgt.v > np ? "Norgespris er billigst" : "spot er billigst"}` : ""}</small></div>` : ""}`;
  }

  _skrubb() {
    const g = this.shadowRoot.querySelector(".grafboks"); if (!g || g._k) return; g._k = 1;
    const finn = (e) => { const b = g.getBoundingClientRect(); if (!this._pkt || !this._pkt.length) return;
      const f = kiSpKlamp((e.clientX - b.left) / b.width, 0, 1), t = this._x0 + f * (this._x1 - this._x0);
      let i = this._pkt.findIndex((p) => p.t <= t && t < p.slutt); if (i < 0) i = f > 0.5 ? this._pkt.length - 1 : 0;
      if (i !== this._valgt) { this._valgt = i; this._tegn(); } };
    const slutt = () => { if (this._valgt !== null) { this._valgt = null; this._tegn(); } };
    g.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) finn(e); });
    g.addEventListener("pointerdown", finn);
    g.addEventListener("pointerleave", slutt);
    g.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") setTimeout(slutt, 2500); });
  }

  _innhold() {
    const c = this._c, np = this._np(), pkt = this._punkter();
    const naa = Date.now(), spotSt = this._st(this._spot());
    const spotNaa = pkt && pkt.length ? (pkt.find((p) => p.t <= naa && naa < p.slutt) || {}).v : (spotSt ? parseFloat(spotSt.state) * this._skala() : null);
    const sparTime = np !== null && spotNaa !== undefined && spotNaa !== null ? spotNaa - np : null;
    const effekt = this._num(c.effekt), sparDag = this._num(c.spart_dag), sparAr = this._num(c.spart_ar);

    const valg = `<div class="valg">
      <span class="v ${this._dag === "i_dag" ? "aktiv" : ""}" data-d="i_dag" role="button" tabindex="0">I dag</span>
      <span class="v ${this._dag === "i_morgen" ? "aktiv" : ""}" data-d="i_morgen" role="button" tabindex="0" ${this._harMorgen() ? "" : "disabled"}>I morgen</span></div>`;

    const hero = `<div class="hero">
      <div><div class="merke">Du betaler nå (Norgespris)</div><div class="stor">${kiSpNf(np, 2)}<small>kr/kWh</small></div></div>
      <div class="hoyre">
        ${spotNaa !== null && spotNaa !== undefined ? `<div style="opacity:.65">Spot: ${kiSpNf(spotNaa, 2)} kr</div>` : ""}
        ${sparTime !== null ? `<div style="margin-top:4px"><span class="spar ${sparTime < 0 ? "tap" : ""}"><ha-icon icon="mdi:${sparTime < 0 ? "trending-down" : "piggy-bank-outline"}"></ha-icon>${sparTime < 0 ? "−" : "+"}${kiSpNf(Math.abs(sparTime), 2)} kr/kWh</span></div>` : ""}
        ${effekt !== null ? `<div style="opacity:.65;margin-top:4px">${kiSpNf(effekt, 0)} W nå</div>` : ""}</div></div>`;

    if (!spotSt) return `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span></div>${hero}
      <div class="venter">Fant ingen spotprissensor. Sett <b>spot:</b> i kortet.</div>`;
    if (pkt === null || !pkt.length) return `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span>${valg}</div>${hero}
      <div class="venter">${this._dag === "i_morgen" ? "Morgendagens priser kommer rundt kl. 13" : "Venter på priser"} <i></i><i></i><i></i></div>`;

    this._pkt = pkt;
    const v = pkt.map((p) => p.v), min = Math.min(...v), maks = Math.max(...v), snitt = v.reduce((a, b) => a + b, 0) / v.length;
    const n = Math.min(c.vindu, pkt.length); let best = 0, bestSum = Infinity;
    for (let i = 0; i + n <= pkt.length; i++) { const s = v.slice(i, i + n).reduce((a, b) => a + b, 0); if (s < bestSum) { bestSum = s; best = i; } }
    const billigst = pkt[best], billigstSlutt = pkt[best + n - 1];
    const over = np !== null ? v.filter((x) => x > np).length : null;
    const timer = pkt.filter((_, i) => i % 6 === 0).map((p) => kiSpKl(p.t));

    return `<div class="topp"><span class="tittel">${kiSpEsc(c.tittel)}</span>${valg}</div>
      ${hero}
      <div class="grafboks" style="height:${c.hoyde}px">${this._graf(pkt, np)}</div>
      <div class="akse">${timer.map((t) => `<span>${t}</span>`).join("")}<span>24</span></div>
      ${np !== null ? `<div class="forkl"><span><i style="background:linear-gradient(90deg,#3ddc97,#ffd24a,#ff6b5c)"></i>Spotpris</span><span><i style="background:repeating-linear-gradient(90deg,#7ab8ff 0 5px,transparent 5px 10px)"></i>Norgespris ${kiSpNf(np, 2)} kr</span>
        ${over !== null ? `<span>${over} av ${pkt.length} timer over Norgespris</span>` : ""}</div>` : ""}
      <div class="stat">
        <div><b>${kiSpNf(snitt, 2)}</b><span>snitt ${this._dag === "i_morgen" ? "i morgen" : "i dag"}</span></div>
        <div><b style="color:#3ddc97">${kiSpNf(min, 2)}</b><span>lavest</span></div>
        <div><b style="color:#ff6b5c">${kiSpNf(maks, 2)}</b><span>høyest</span></div></div>
      <div class="vindu"><ha-icon icon="mdi:clock-check-outline"></ha-icon><span>Billigste ${n} timer: <b>kl ${kiSpKl(billigst.t)}–${kiSpKl(billigstSlutt.slutt)}</b> · snitt ${kiSpNf(bestSum / n, 2)} kr</span></div>
      ${(sparDag !== null || sparAr !== null) ? `<div class="stat" style="grid-template-columns:repeat(${[sparDag, sparAr].filter((x) => x !== null).length},minmax(0,1fr))">
        ${sparDag !== null ? `<div><b style="color:#3ddc97">${kiSpNf(sparDag, 0)} kr</b><span>spart i dag</span></div>` : ""}
        ${sparAr !== null ? `<div><b style="color:#3ddc97">${kiSpNf(sparAr, 0)} kr</b><span>spart i år</span></div>` : ""}</div>` : ""}`;
  }

  _koble() {
    const r = this.shadowRoot;
    const bytt = (e) => { const el = e.composedPath().find((x) => x.dataset && x.dataset.d); if (!el || el.hasAttribute("disabled")) return;
      this._dag = el.dataset.d; this._valgt = null; this._tegn(); };
    r.addEventListener("click", bytt);
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bytt(e); } });
  }
  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const np = this._np(), tone = np !== null ? "#8fe3c0" : "#ffd24a";
    const html = `<div class="kort" style="--tone:${tone}">${this._innhold()}</div>`;
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_SP_STIL}</style>${html}`; this._koble(); this._bygget = true; this._forrige = html; }
    else if (html !== this._forrige) { this.shadowRoot.querySelector(".kort").outerHTML = html; this._forrige = html; }
    this._skrubb();
  }
}
if (!customElements.get("ki-strompris-card")) customElements.define("ki-strompris-card", KiStromprisCard);

class KiStromprisCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { norgespris: "Norgespris (kr/kWh)", spot: "Spotpris (raw_today)", spart_dag: "Spart i dag", spart_ar: "Spart i år", effekt: "Effekt nå", tittel: "Tittel", vindu: "Timer i billigste vindu", hoyde: "Grafhøyde (px)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [{ name: "norgespris", selector: { entity: { domain: "sensor" } } }, { name: "spot", selector: { entity: { domain: "sensor" } } },
      { name: "spart_dag", selector: { entity: { domain: "sensor" } } }, { name: "spart_ar", selector: { entity: { domain: "sensor" } } },
      { name: "effekt", selector: { entity: { domain: "sensor" } } }, { name: "tittel", selector: { text: {} } },
      { name: "vindu", selector: { number: { min: 1, max: 8, mode: "box" } } }, { name: "hoyde", selector: { number: { min: 100, max: 320, mode: "box" } } }];
  }
}
if (!customElements.get("ki-strompris-card-editor")) customElements.define("ki-strompris-card-editor", KiStromprisCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-strompris-card")) window.customCards.push({ type: "ki-strompris-card", name: "KI Strømpris", description: "Spotpris time for time med Norgespris-linje, billigste timer og besparelse", preview: true });
console.info(`%c KI-STROMPRIS-CARD %c v${KI_SP_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

/* ki-hytte-card – hyttebesøk: kalender, opphold og statistikk.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-hytte-card
 * sted: Strömstad                 # velger riktig oversiktssensor når du har flere
 * oversikt: sensor.ki_hyttebesok_stromstad_oversikt   # oppdages automatisk
 * faner: [kalender, opphold, statistikk]
 * maaneder: 1                     # antall måneder i kalenderen
 */
const KI_HYTTE_VERSJON = "1.1.0";

const KI_HYTTE_STIL = `
  :host { display:block; max-width:100%; overflow:hidden; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:12px; max-width:100%; }
  button { font:inherit; }

  /* ---- hero ---- */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:16px 18px; display:grid; gap:10px; min-height:104px;
    transition:background .6s var(--myk), color .4s; }
  .hero.her { background:linear-gradient(135deg, #2b5c46, #1d3a33); }
  .hero .tit { font-size:17px; font-weight:600; display:flex; align-items:center; gap:8px; }
  .hero .und { font-size:13px; opacity:.75; }
  .ansikter { display:flex; gap:-6px; }
  .prikk { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:var(--black,#000); margin-left:-8px; border:2px solid var(--gray200); }
  .prikk:first-child { margin-left:0; }
  .hero.her .prikk { border-color:#23483b; }
  .hero .tall { display:flex; gap:18px; margin-top:2px; }
  .hero .tall div { font-size:12px; opacity:.75; }
  .hero .tall b { display:block; font-size:20px; font-weight:400; opacity:1; font-variant-numeric:tabular-nums; }
  .synk { position:absolute; right:14px; top:14px; z-index:2; border:0; background:rgba(255,255,255,.12);
    color:inherit; width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center;
    justify-content:center; --mdc-icon-size:18px; }
  .synk:active { transform:scale(.92); }
  .synk.gaar ha-icon { animation:hy-snurr 1s linear infinite; }
  @keyframes hy-snurr { to { transform:rotate(360deg); } }
  .hytte { position:absolute; right:14px; bottom:-6px; width:104px; height:84px; opacity:.5; z-index:-1; }
  .hero.her .hytte { opacity:.75; }
  .royk { opacity:0; }
  .hero.her .royk { animation:hy-royk 4.2s ease-out infinite; }
  .hero.her .r2 { animation-delay:1.4s; } .hero.her .r3 { animation-delay:2.8s; }
  @keyframes hy-royk { 0% { opacity:.5; transform:translate(0,0) scale(.6); } 100% { opacity:0; transform:translate(-10px,-26px) scale(1.5); } }
  .vindu { fill:#ffd98a; opacity:.25; }
  .hero.her .vindu { opacity:.95; animation:hy-lys 5s ease-in-out infinite alternate; }
  @keyframes hy-lys { from { opacity:.7; } to { opacity:1; } }

  /* ---- faner ---- */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font-size:13px; font-weight:500; padding:6px 14px;
    border-radius:999px; cursor:pointer; white-space:nowrap; transition:background .2s, color .2s; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .panel { display:none; } .panel.valgt { display:grid; gap:12px; }

  /* ---- kalender ---- */
  .kal { background:var(--gray200); border-radius:20px; padding:14px; }
  .kaltopp { display:grid; grid-template-columns:min-content 1fr min-content; align-items:center; gap:10px; padding:0 2px 10px; }
  .kaltopp .mnd { text-align:center; font-size:15px; font-weight:600; text-transform:capitalize; }
  .pil { border:0; background:var(--gray100); color:var(--gray1000); width:32px; height:32px; border-radius:50%;
    cursor:pointer; display:flex; align-items:center; justify-content:center; --mdc-icon-size:20px; }
  .pil:active { transform:scale(.92); }
  .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; padding-bottom:4px; }
  .ukedager span { text-align:center; font-size:11px; font-weight:600; opacity:.45; }
  .rutenett { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .dag { position:relative; aspect-ratio:1; border-radius:12px; background:var(--gray100); display:flex;
    align-items:center; justify-content:center; font-size:13px; font-weight:500; cursor:default;
    transition:transform .12s var(--fjaer); }
  .dag.utenfor { opacity:.25; background:transparent; }
  .dag.idag { outline:2px solid var(--active-big,#ee95ff); outline-offset:-2px; font-weight:700; }
  .dag.fremtid { border:1px dashed rgba(255,255,255,.25); }
  .dag.harbesok { color:var(--black,#000); font-weight:700; }
  .dag .strimler { position:absolute; inset:0; border-radius:12px; overflow:hidden; display:flex; z-index:0; }
  .dag .nr { position:relative; z-index:1; }
  .dag .strimler i { flex:1; }
  .dag:hover { transform:scale(1.06); }
  .navn { display:flex; flex-wrap:wrap; gap:8px; padding:12px 2px 0; }
  .navn span { display:inline-flex; align-items:center; gap:6px; font-size:12px; opacity:.8; }
  .navn i { width:10px; height:10px; border-radius:3px; }

  /* ---- lister ---- */
  .liste { background:var(--gray200); border-radius:20px; overflow:hidden; }
  .rad { display:grid; grid-template-columns:40px 1fr min-content; gap:12px; align-items:center; padding:12px 14px;
    border-top:1px solid rgba(255,255,255,.06); }
  .rad:first-child { border-top:0; }
  .rad .n { font-size:14px; font-weight:500; }
  .rad .d { font-size:12px; opacity:.6; }
  .rad .netter { font-size:13px; font-weight:600; white-space:nowrap; }
  .tom { padding:22px; text-align:center; font-size:13px; opacity:.6; }

  /* ---- statistikk ---- */
  .stolper { background:var(--gray200); border-radius:20px; padding:16px; display:grid; gap:10px; }
  .mndrad { display:grid; grid-template-columns:34px 1fr 34px; gap:10px; align-items:center; font-size:12px; }
  .mndrad .spor { height:10px; border-radius:6px; background:var(--gray100); overflow:hidden; display:flex; }
  .mndrad .spor i { height:100%; }
  .mndrad .t { text-align:right; font-variant-numeric:tabular-nums; opacity:.7; }
  .pkort { background:var(--gray200); border-radius:20px; padding:14px 16px; display:grid;
    grid-template-columns:36px 1fr min-content; gap:12px; align-items:center; }
  .pkort .stor { font-size:20px; font-weight:400; font-variant-numeric:tabular-nums; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiHyEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_HY_UKE = ["ma", "ti", "on", "to", "fr", "lø", "sø"];
const KI_HY_MND = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const kiHyDato = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const kiHyKort = (iso) => { const d = new Date(iso); return `${d.getDate()}. ${KI_HY_MND[d.getMonth()].slice(0, 3)}`; };

class KiHytteCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "kalender"; this._mnd = 0; }
  static getConfigElement() { return document.createElement("ki-hytte-card-editor"); }
  static getStubConfig() { return {}; }
  getCardSize() { return 10; }

  setConfig(c) {
    this._c = { faner: ["kalender", "opphold", "statistikk"], maaneder: 1, ...(c || {}) };
    this._fane = this._c.faner[0]; this._bygget = false; this._tegn();
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    const id = this._id();
    if (!g || !this._bygget || (id && g.states[id] !== h.states[id])) this._tegn();
  }

  /* Finner oversiktssensoren fra KI Hyttebesøk – riktig sted når du har flere */
  _id() {
    if (this._c.oversikt) return this._c.oversikt;
    const h = this._h; if (!h) return null;
    const alle = Object.keys(h.states).filter((x) => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_hyttebesok" && a.ki_type === "oversikt";
    });
    if (this._c.sted) {
      const rens = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/ö/g, "o");
      const treff = alle.find((x) => rens((h.states[x].attributes || {}).sted) === rens(this._c.sted));
      if (treff) return treff;
    }
    return alle[0] || null;
  }
  _data() { const s = this._h && this._id() ? this._h.states[this._id()] : null; return s ? s.attributes : null; }
  _farge(navn, d) {
    const p = ((d && d.personer) || []).find((x) => String(x.navn).toLowerCase() === String(navn).toLowerCase());
    return (p && p.farge) || "var(--gray400)";
  }
  _mer() { const id = this._id(); if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }

  /* ---------------------------------------------------------- kalenderen */
  _kalender(d) {
    const nå = new Date(); nå.setHours(0, 0, 0, 0);
    const vist = new Date(nå.getFullYear(), nå.getMonth() + this._mnd, 1);
    const forste = new Date(vist.getFullYear(), vist.getMonth(), 1);
    const start = new Date(forste);
    start.setDate(1 - ((forste.getDay() + 6) % 7));           /* mandag først */
    const dager = d.dager || {};
    const ruter = [];
    for (let i = 0; i < 42; i++) {
      const dag = new Date(start); dag.setDate(start.getDate() + i);
      const iso = kiHyDato(dag);
      const folk = dager[iso] || [];
      const utenfor = dag.getMonth() !== vist.getMonth();
      const idag = dag.getTime() === nå.getTime();
      const fremtid = dag > nå && folk.length;
      ruter.push(`<div class="dag ${utenfor ? "utenfor" : ""} ${idag ? "idag" : ""} ${fremtid ? "fremtid" : ""}
        ${folk.length ? "harbesok" : ""}" title="${kiHyEsc(folk.join(", "))}">
        ${folk.length ? `<span class="strimler">${folk.map((n) =>
          `<i style="background:${kiHyEsc(this._farge(n, d))}"></i>`).join("")}</span>` : ""}
        <span class="nr">${dag.getDate()}</span></div>`);
    }
    const kanTilbake = this._mnd > -24, kanFram = this._mnd < 12;
    return `<div class="kal">
      <div class="kaltopp">
        <button class="pil" data-mnd="-1" ${kanTilbake ? "" : "disabled"}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <div class="mnd">${KI_HY_MND[vist.getMonth()]} ${vist.getFullYear()}</div>
        <button class="pil" data-mnd="1" ${kanFram ? "" : "disabled"}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
      <div class="ukedager">${KI_HY_UKE.map((u) => `<span>${u}</span>`).join("")}</div>
      <div class="rutenett">${ruter.join("")}</div>
      <div class="navn">${(d.personer || []).map((p) =>
        `<span><i style="background:${kiHyEsc(p.farge)}"></i>${kiHyEsc(p.navn)}</span>`).join("")}
        <span style="margin-left:auto;opacity:.5">stiplet = planlagt${
          d.sist_lest ? " · lest " + kiHyEsc(String(d.sist_lest).slice(11, 16)) : ""}</span></div>
    </div>`;
  }

  /* ---------------------------------------------------------- oppholdene */
  _opphold(d) {
    const rad = (o, fremtid) => `<div class="rad">
      <span class="prikk" style="background:${kiHyEsc(this._farge(o.person, d))};margin:0">${kiHyEsc(String(o.person || "?").slice(0, 1))}</span>
      <div><div class="n">${kiHyEsc(o.person)}</div>
        <div class="d">${kiHyKort(o.start)}${o.slutt !== o.start ? " – " + kiHyKort(o.slutt) : ""}${fremtid ? " · planlagt" : ""}</div></div>
      <div class="netter">${o.netter} ${o.netter === 1 ? "natt" : "netter"}</div>
    </div>`;
    const kommende = (d.kommende || []).map((o) => rad(o, true)).join("");
    const gamle = (d.opphold || []).map((o) => rad(o, false)).join("");
    return `${kommende ? `<div><div class="hero" style="min-height:0;padding:12px 16px">
        <div class="tit"><ha-icon icon="mdi:calendar-arrow-right"></ha-icon>Planlagt framover</div></div></div>
      <div class="liste">${kommende}</div>` : ""}
      <div class="liste">${gamle || `<div class="tom">Ingen registrerte opphold ennå.</div>`}</div>`;
  }

  /* ---------------------------------------------------------- statistikk */
  _statistikk(d) {
    const mnd = d.per_maaned || [];
    const maks = Math.max(1, ...mnd.map((m) => m.netter));
    return `<div class="stolper">
      <div class="d" style="opacity:.6;font-size:12px">Netter per måned i år</div>
      ${mnd.map((m) => `<div class="mndrad">
        <span style="opacity:.6">${kiHyEsc(m.navn.slice(0, 3))}</span>
        <span class="spor">${Object.keys(m.personer || {}).map((n) =>
          `<i style="width:${((m.personer[n] / maks) * 100).toFixed(1)}%;background:${kiHyEsc(this._farge(n, d))}"></i>`).join("")}</span>
        <span class="t">${m.netter || ""}</span></div>`).join("")}
    </div>
    ${(d.personer || []).map((p) => `<div class="pkort">
      <span class="prikk" style="background:${kiHyEsc(p.farge)};margin:0">${kiHyEsc(p.navn.slice(0, 1))}</span>
      <div><div class="n">${kiHyEsc(p.navn)}</div>
        <div class="d">${p.besok_i_aar} ${p.besok_i_aar === 1 ? "besøk" : "besøk"} i år${
          p.siste ? ` · sist ${kiHyKort(p.siste.start)}` : ""}</div></div>
      <div class="stor">${p.netter_i_aar}<span style="font-size:12px;opacity:.6"> netter</span></div>
    </div>`).join("")}`;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const d = this._data();
    if (!d) {
      this.shadowRoot.innerHTML = `<style>${KI_HYTTE_STIL}</style>
        <div class="tom">Fant ingen oversikt fra <b>KI Hyttebesøk</b>. Sett <code>oversikt:</code> manuelt hvis du har flere steder.</div>`;
      this._bygget = false;
      return;
    }
    const navn = { kalender: "Kalender", opphold: "Opphold", statistikk: "Statistikk" };
    const her = d.her_naa || [];
    const siste = d.siste;
    const hero = `<div class="hero ${her.length ? "her" : ""}" role="button" tabindex="0">
      <svg class="hytte" viewBox="0 0 120 90" aria-hidden="true">
        <g fill="currentColor" opacity=".9">
          <path d="M18 44 60 16l42 28v40H18z" opacity=".35"/>
          <path d="M14 46 60 14l46 32-4 5-42-29-42 29z"/>
          <rect x="74" y="24" width="10" height="16" rx="2" opacity=".6"/>
        </g>
        <rect class="vindu" x="40" y="52" width="16" height="14" rx="3"/>
        <rect class="vindu" x="66" y="52" width="16" height="14" rx="3"/>
        <g fill="#eaf6ff"><circle class="royk" cx="79" cy="20" r="4"/>
          <circle class="royk r2" cx="79" cy="20" r="3"/><circle class="royk r3" cx="79" cy="20" r="5"/></g>
      </svg>
      <button class="synk" data-synk="1" title="Les kalenderen på nytt"><ha-icon icon="mdi:calendar-sync"></ha-icon></button>
      <div class="tit"><span>${kiHyEsc(d.sted || "Hytta")}</span>
        <span class="ansikter">${her.map((p) =>
          `<span class="prikk" style="background:${kiHyEsc(p.farge)}">${kiHyEsc(p.navn.slice(0, 1))}</span>`).join("")}</span></div>
      <div class="und">${her.length
        ? `${her.map((p) => kiHyEsc(p.navn)).join(", ")} er her${her[0].siden ? " siden " + kiHyKort(her[0].siden) : ""}`
        : siste ? `Tomt nå · sist ${kiHyEsc(siste.person)} ${kiHyKort(siste.start)}` : "Tomt nå"}</div>
      <div class="tall">
        <div><b>${d.netter_i_aar || 0}</b>netter i år</div>
        <div><b>${d.besok_i_aar || 0}</b>besøk i år</div>
        ${(d.kommende || []).length ? `<div><b>${kiHyKort(d.kommende[0].start)}</b>neste besøk</div>` : ""}
      </div>
    </div>`;

    const html = `<style>${KI_HYTTE_STIL}</style>
      <div class="rot">
        ${hero}
        ${c.faner.length > 1 ? `<div class="faner"><div class="skinne" role="tablist">${c.faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        ${c.faner.map((f) => `<div class="panel ${f === this._fane ? "valgt" : ""}" data-p="${f}">${
          f === "kalender" ? this._kalender(d) : f === "opphold" ? this._opphold(d) : this._statistikk(d)}</div>`).join("")}
      </div>`;

    if (html !== this._forrige) { this.shadowRoot.innerHTML = html; this._forrige = html; this._kobl(); }
    this._bygget = true;
  }

  _kobl() {
    const r = this.shadowRoot;
    const hero = r.querySelector(".hero");
    if (hero) hero.addEventListener("click", () => this._mer());
    const synk = r.querySelector("[data-synk]");
    if (synk) synk.addEventListener("click", (e) => {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(10);
      synk.classList.add("gaar");
      setTimeout(() => synk.classList.remove("gaar"), 2500);
      /* knappen fra integrasjonen om den finnes, ellers tjenesten */
      const knapp = Object.keys(this._h.states).find((x) => x.startsWith("button.")
        && (this._h.states[x].attributes || {}).integrasjon === "ki_hyttebesok"
        && (this._h.states[x].attributes || {}).ki_type === "synk");
      if (knapp) this._h.callService("button", "press", { entity_id: knapp });
      else this._h.callService("ki_hyttebesok", "les_kalender", {});
    });
    r.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => { this._fane = b.dataset.f; this._forrige = null; this._tegn(); }));
    r.querySelectorAll("[data-mnd]").forEach((b) => b.addEventListener("click", () => {
      this._mnd += Number(b.dataset.mnd); this._forrige = null; this._tegn();
    }));
  }
}
if (!customElements.get("ki-hytte-card")) customElements.define("ki-hytte-card", KiHytteCard);

class KiHytteCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { sted: "Sted (tomt = første)", oversikt: "Oversiktssensor", maaneder: "Måneder i kalenderen" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "sted", selector: { text: {} } },
      { name: "oversikt", selector: { entity: { domain: ["sensor"] } } },
    ];
  }
}
if (!customElements.get("ki-hytte-card-editor")) customElements.define("ki-hytte-card-editor", KiHytteCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-hytte-card")) window.customCards.push({ type: "ki-hytte-card", name: "KI Hytte", description: "Hyttebesøk: kalender, opphold og statistikk", preview: true });

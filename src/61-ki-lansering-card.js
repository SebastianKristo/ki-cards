/* ki-lansering-card – kommende episoder og filmer fra Sonarr og Radarr.
 * Leser «upcoming media»-sensorene og viser dem i samme stil som resten av dashbordet.
 *
 * type: custom:ki-lansering-card
 * serier: sensor.sonarr_sonarr_upcoming_media
 * filmer: sensor.radarr_radarr_upcoming_media
 * antall: 6                 # hvor mange i lista under heroen
 * visning: full             # full (hero + liste) | liste | hero | kalender
 * kalender: true            # vis knappen som bytter mellom liste og månedskalender
 * bursdag: true             # bursdagskort i samme sveip som neste lansering
 *   # eller: { kalender: calendar.birthdays, dager: 45 }
 *   # eller: { regex: bursdag, entities: [...] }
 * plakater: true            # vis plakater i lista
 */
const KI_LANS_VERSJON = "1.4.0";

const KI_LANS_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:12px; max-width:100%; }

  /* ---- hero med bakgrunnsbilde ---- */
  .hero { position:relative; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate;
    min-height:196px; display:grid; grid-template-columns:96px 1fr; gap:14px; align-items:end;
    padding:16px; color:#fff; cursor:pointer; background:var(--gray200); }
  .hero .bak { position:absolute; inset:0; z-index:-2; background-size:cover; background-position:center 22%;
    transform:scale(1.04); transition:transform 6s var(--myk); }
  .hero:hover .bak { transform:scale(1.1); }
  .hero::after { content:""; position:absolute; inset:0; z-index:-1;
    background:linear-gradient(180deg, rgba(10,10,14,.15) 0%, rgba(10,10,14,.72) 58%, rgba(10,10,14,.94) 100%); }
  .plakat { width:96px; aspect-ratio:2/3; border-radius:12px; background:var(--gray100) center/cover;
    box-shadow:0 8px 24px rgba(0,0,0,.55); }
  .hero .tekst { min-width:0; padding-bottom:2px; }
  .hero .merkerad { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
  .merke { font-size:10.5px; font-weight:700; letter-spacing:.03em; padding:4px 9px; border-radius:8px;
    background:rgba(255,255,255,.16); backdrop-filter:blur(6px); white-space:nowrap; }
  .merke.naa { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); }
  .merke.film { background:rgba(255,214,138,.22); }
  .hero h3 { margin:0; font-size:21px; font-weight:600; line-height:1.15; text-shadow:0 2px 12px rgba(0,0,0,.6);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hero .und { font-size:13px; opacity:.85; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hero .nar { font-size:12.5px; opacity:.7; margin-top:8px; display:flex; align-items:center; gap:8px; }
  .hero .nar b { font-weight:600; opacity:1; }

  /* ---- liste ---- */
  .liste { background:var(--gray200); border-radius:20px; overflow:hidden; }
  .rad { display:grid; grid-template-columns:44px 1fr min-content; gap:12px; align-items:center;
    padding:10px 14px; border-top:1px solid rgba(255,255,255,.05); cursor:pointer; }
  .rad:first-child { border-top:0; }
  .rad:active { background:var(--gray100); }
  .rad .p { width:44px; aspect-ratio:2/3; border-radius:7px; background:var(--gray100) center/cover; }
  .rad .n { display:block; font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rad .d { display:block; font-size:12px; opacity:.55; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    margin-top:1px; }
  .rad > span { min-width:0; }
  .rad .dag, .rad .dato { display:block; }
  .rad .hoyre { text-align:right; }
  .rad .dag { font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .rad .dato { font-size:11px; opacity:.5; white-space:nowrap; }
  .rad.idag .dag { color:var(--active-big,#ee95ff); }

  /* ---- faner ---- */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:13px; font-weight:500;
    padding:6px 14px; border-radius:999px; cursor:pointer; white-space:nowrap; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .tom { background:var(--gray200); border-radius:20px; padding:24px; text-align:center; font-size:13px; opacity:.6; }

  /* ---- vis mer ---- */
  .mer { border:0; width:100%; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:13px;
    font-weight:500; padding:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;
    border-top:1px solid rgba(255,255,255,.05); --mdc-icon-size:20px; }
  .mer ha-icon { transition:transform .25s var(--myk); }
  .mer.apen ha-icon { transform:rotate(180deg); }
  .mer:active { background:var(--gray100); }

  /* ---- månedskalender ---- */
  /* kalenderen står rett på popup-bakgrunnen – ingen egen boks bak */
  .kal { background:none; border-radius:20px; padding:4px 2px 2px; }
  .kaltopp { display:grid; grid-template-columns:min-content 1fr min-content; align-items:center; gap:10px;
    padding:0 2px 10px; }
  .kaltopp .mnd { text-align:center; font-size:16px; font-weight:600; text-transform:capitalize; }
  .pil { border:0; background:none; color:var(--gray1000); width:36px; height:36px; border-radius:50%;
    cursor:pointer; display:flex; align-items:center; justify-content:center; --mdc-icon-size:24px; opacity:.7; }
  .pil:hover { opacity:1; }
  .pil:active { transform:scale(.92); }
  .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; padding-bottom:7px; }
  .ukedager span { text-align:center; font-size:12px; font-weight:600; opacity:.45; }
  .rutenett { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; }
  .dag { position:relative; aspect-ratio:1; border-radius:50%; background:var(--gray200); display:flex;
    align-items:center; justify-content:center; font-size:15px; cursor:pointer;
    transition:transform .14s var(--fjaer), background .2s; }
  .dag.utenfor { opacity:.25; background:transparent; cursor:default; }
  .dag.har { background:var(--gray100); font-weight:600; }
  .dag.idag { outline:2px solid rgba(255,255,255,.35); outline-offset:-2px; }
  .dag.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); transform:scale(1.06); }
  .dag .antall { position:absolute; top:-3px; left:-3px; min-width:22px; height:22px; border-radius:11px;
    background:#ffc0dd; color:#3a2430; font-size:12px; font-weight:700; display:flex; align-items:center;
    justify-content:center; padding:0 6px; box-shadow:0 2px 6px rgba(0,0,0,.4); }
  .dag.film .antall { background:#ffd98a; }
  .valgtdag { font-size:13px; opacity:.6; padding:14px 4px 2px; text-transform:capitalize; }

  /* ---- sveip mellom hero-sidene ---- */
  .sveip { position:relative; overflow:hidden; touch-action:pan-y; }
  .spor { display:flex; transition:transform .35s var(--myk); will-change:transform; }
  .spor.drar { transition:none; }
  .side { flex:0 0 100%; min-width:0; }
  .prikker { display:flex; gap:6px; justify-content:center; padding:8px 0 0; }
  .prikker i { width:7px; height:7px; border-radius:50%; background:var(--gray1000); opacity:.25;
    transition:opacity .25s, transform .25s; cursor:pointer; }
  .prikker i.valgt { opacity:.95; transform:scale(1.15); }

  /* ---- bursdagshero ---- */
  .bhero { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    min-height:196px; padding:18px; display:grid; align-content:end; gap:6px; color:#fff; cursor:pointer;
    background:linear-gradient(135deg,#5b2d52 0%,#33213c 55%,#241c33 100%); }
  .bhero.i_dag { background:linear-gradient(135deg,#7a3468 0%,#4a2551 50%,#2b1b3a 100%); }
  .bhero h3 { margin:0; font-size:22px; font-weight:600; text-shadow:0 2px 12px rgba(0,0,0,.5); }
  .bhero .und { font-size:14px; opacity:.85; }
  .bhero .merkerad { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
  .bkake { position:absolute; right:16px; bottom:8px; width:120px; height:120px; opacity:.9; }
  .blys { transform-box:fill-box; transform-origin:50% 100%; animation:bu-lys 1.6s ease-in-out infinite; }
  @keyframes bu-lys { 0%,100% { transform:scaleY(1) rotate(-4deg); } 50% { transform:scaleY(1.2) rotate(4deg); } }
  .ballong { transform-box:fill-box; transform-origin:50% 100%; animation:bu-sveve 5s ease-in-out infinite alternate; }
  .ballong.b2 { animation-duration:6.5s; animation-delay:-1.5s; }
  .ballong.b3 { animation-duration:7.5s; animation-delay:-3s; }
  @keyframes bu-sveve { from { transform:translateY(4px) rotate(-3deg); } to { transform:translateY(-10px) rotate(3deg); } }
  .konf { opacity:0; }
  .bhero.i_dag .konf { animation:bu-konf 3.4s ease-in infinite; }
  @keyframes bu-konf { 0% { opacity:0; transform:translateY(-14px) rotate(0deg); } 15% { opacity:.95; }
    100% { opacity:0; transform:translateY(150px) rotate(220deg); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; transition:none !important; } }
`;

/* «Rune's Birthday», «Bursdag Rune» og «rune_bursdag» blir alle til «Rune» */
const kiLaNavn = (s) => String(s || "")
  .replace(/\(\s*\d{4}\s*\)/g, "")
  .replace(/[_-]+/g, " ")
  .replace(/\b(bursdag|birthday|fodselsdag|fødselsdag|geburtstag)\b/gi, "")
  .replace(/[’']\s*s\b/gi, "")
  .replace(/\bs\b\s*$/i, "")
  .replace(/^\s*s\b/i, "")
  .replace(/\s{2,}/g, " ")
  .replace(/^[\s.,·-]+|[\s.,·-]+$/g, "")
  .replace(/^./, (c) => c.toUpperCase());

const kiLaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_LA_MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

class KiLanseringCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "alle"; }
  static getConfigElement() { return document.createElement("ki-lansering-card-editor"); }
  static getStubConfig() { return { serier: "sensor.sonarr_sonarr_upcoming_media", filmer: "sensor.radarr_radarr_upcoming_media" }; }
  getCardSize() { return 8; }

  setConfig(c) {
    this._c = { antall: 6, visning: "full", plakater: true, kalender: true, ...(c || {}) };
    this._visKal = this._c.visning === "kalender";
    this._mnd = 0; this._valgtDag = null; this._alt = false;
    if (!this._c.serier && !this._c.filmer) throw new Error("Sett serier: eller filmer: til upcoming media-sensoren");
    this._forrige = null;
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    const ids = [this._c.serier, this._c.filmer].filter(Boolean);
    if (!g || ids.some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 60000); if (this._h) this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }

  /* Sonarr og Radarr legger et oppsettobjekt først i lista – det hopper vi over */
  _les(id, type) {
    const st = this._h && this._h.states[id];
    if (!st || !Array.isArray(st.attributes.data)) return [];
    return st.attributes.data
      .filter((x) => x && x.airdate && x.title)
      .map((x) => ({
        type, kilde: id,
        tittel: x.title,
        episode: x.episode && x.episode !== "TBA" ? x.episode : "",
        nummer: x.number || "",
        naar: new Date(x.airdate),
        lengde: Number(x.runtime) || 0,
        studio: x.studio || "",
        rating: x.rating || "",
        sjanger: x.genres || "",
        sammendrag: x.summary || "",
        plakat: x.poster || "",
        bakgrunn: x.fanart || "",
        lenke: x.deep_link || "",
        trailer: x.trailer || "",
        kino: !!x.flag,                       /* Radarr: kinopremiere i stedet for digitalt */
      }));
  }
  _alle() {
    const c = this._c;
    const ut = [...this._les(c.serier, "serie"), ...this._les(c.filmer, "film")]
      .filter((x) => !isNaN(x.naar))
      .sort((a, b) => a.naar - b.naar);
    return this._fane === "alle" ? ut : ut.filter((x) => x.type === this._fane);
  }

  _naartekst(d) {
    const nå = new Date();
    const dag = new Date(d); dag.setHours(0, 0, 0, 0);
    const i_dag = new Date(nå); i_dag.setHours(0, 0, 0, 0);
    const diff = Math.round((dag - i_dag) / 86400000);
    const kl = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    if (diff === 0) {
      const min = Math.round((d - nå) / 60000);
      if (min > 0 && min < 90) return { kort: min < 1 ? "nå" : `om ${min} min`, lang: `I dag kl. ${kl}`, naa: true };
      return { kort: kl, lang: `I dag kl. ${kl}`, naa: min > -180 };
    }
    if (diff === 1) return { kort: "i morgen", lang: `I morgen kl. ${kl}` };
    if (diff < 7) {
      const u = d.toLocaleDateString("nb-NO", { weekday: "long" });
      return { kort: u.slice(0, 3), lang: u.charAt(0).toUpperCase() + u.slice(1) + ` kl. ${kl}` };
    }
    return { kort: `${d.getDate()}. ${KI_LA_MND[d.getMonth()]}`, lang: `${d.getDate()}. ${KI_LA_MND[d.getMonth()]} kl. ${kl}` };
  }
  _apne(x) {
    if (x.lenke) return window.open(x.lenke, "_blank", "noopener");
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: x.kilde }, bubbles: true, composed: true }));
  }

  /* Sveip mellom hero-sidene, med retningslås så siden kan rulles som normalt */
  _koblSveip(r, antall) {
    if (antall < 2) return;
    const boks = r.querySelector(".sveip"), spor = r.querySelector(".spor");
    if (!boks || !spor) return;
    const gaTil = (i) => {
      this._side = Math.max(0, Math.min(antall - 1, i));
      spor.style.transform = `translateX(-${this._side * 100}%)`;
      r.querySelectorAll("[data-s]").forEach((p, n) => p.classList.toggle("valgt", n === this._side));
    };
    let x0 = null, y0 = 0, dx = 0, retning = null;
    boks.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; retning = null; });
    boks.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (retning === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        retning = Math.abs(dx) > Math.abs(dy) * 1.3 ? "vannrett" : "loddrett";
        if (retning === "vannrett") spor.classList.add("drar");
      }
      if (retning !== "vannrett") return;
      if (e.cancelable) e.preventDefault();
      spor.style.transform = `translateX(calc(-${this._side * 100}% + ${dx * 0.7}px))`;
    });
    const slipp = () => {
      if (x0 === null) return;
      spor.classList.remove("drar");
      if (retning === "vannrett" && Math.abs(dx) > 55) { this._sveipet = true; gaTil(this._side + (dx < 0 ? 1 : -1)); }
      else gaTil(this._side);
      x0 = null; dx = 0; retning = null;
    };
    boks.addEventListener("pointerup", slipp);
    boks.addEventListener("pointercancel", slipp);
    boks.addEventListener("pointerleave", slipp);
    r.querySelectorAll("[data-s]").forEach((p) => p.addEventListener("click", () => gaTil(+p.dataset.s)));
  }

  /* Bursdager fra sensorene – samme kilder som bursdagskortene */
  _bursdager() {
    const c = this._c.bursdag; if (!c || !this._h) return [];
    const o = typeof c === "object" ? c : {};
    const h = this._h, nå = new Date(); nå.setHours(0, 0, 0, 0);
    if (o.kalender) {
      if (this._bdKal === undefined) { this._bdKal = null; this._hentBursdagKalender(o); }
      return (this._bdKal || []).filter((p) => p.dager <= Number(o.dager || 45));
    }
    const ider = o.entities && o.entities.length
      ? o.entities.map((e) => (typeof e === "string" ? e : e.entity))
      : Object.keys(h.states).filter((id) => id.startsWith("sensor.") && new RegExp(o.regex || "birthday|bursdag", "i").test(id));
    const ut = [];
    ider.forEach((id) => {
      const st = h.states[id]; if (!st) return;
      const a = st.attributes || {};
      const rå = a.next_birthday || a.next_date || a.date_of_next_birthday || a.birthday || a.date || st.state;
      const d = new Date(rå); if (isNaN(d)) return;
      const neste = new Date(d); neste.setHours(0, 0, 0, 0);
      if (neste < nå && a.years_old === undefined) {
        neste.setFullYear(nå.getFullYear());
        if (neste < nå) neste.setFullYear(nå.getFullYear() + 1);
      }
      const dager = Math.round((neste - nå) / 86400000);
      if (dager < 0 || dager > Number(o.dager || 45)) return;
      const alder = a.years_old !== undefined ? Number(a.years_old) + (dager === 0 ? 0 : 1)
        : a.age !== undefined ? Number(a.age)
        : a.birth_year ? neste.getFullYear() - Number(a.birth_year) : null;
      const råNavn = a.friendly_name_short || a.nickname || a.name || a.friendly_name || id.split(".").pop();
      ut.push({ id, navn: kiLaNavn(råNavn),
                dato: neste, dager, alder });
    });
    return ut.sort((a, b) => a.dager - b.dager);
  }

  /* Bursdager fra en kalender – fødselsåret ligger i beskrivelsen eller tittelen */
  async _hentBursdagKalender(o) {
    const h = this._h; if (!h) return;
    const fra = new Date(); fra.setHours(0, 0, 0, 0);
    const til = new Date(fra); til.setDate(til.getDate() + Number(o.dager || 45) + 1);
    try {
      const svar = await h.callApi("GET",
        `calendars/${o.kalender}?start=${encodeURIComponent(fra.toISOString())}&end=${encodeURIComponent(til.toISOString())}`);
      const ut = [];
      (svar || []).forEach((e) => {
        const start = e.start && (e.start.date || e.start.dateTime || e.start);
        const d = new Date(start); if (isNaN(d)) return;
        d.setHours(0, 0, 0, 0);
        const tekst = `${e.description || ""} ${e.summary || ""}`;
        const full = tekst.match(/(\d{4})-(\d{2})-(\d{2})/);
        const bare = tekst.match(/(?:f\.?|født|fodt|\()\s*(\d{4})/i);
        const år = full ? Number(full[1]) : bare ? Number(bare[1]) : null;
        ut.push({ id: o.kalender, navn: kiLaNavn(e.summary || ""), dato: d,
                  dager: Math.round((d - fra) / 86400000), alder: år ? d.getFullYear() - år : null });
      });
      ut.sort((a, b) => a.dager - b.dager);
      this._bdKal = ut; this._forrige = null; this._tegn();
    } catch (feil) { this._bdKal = []; }
  }

  _bursdagHero(p) {
    const naar = p.dager === 0 ? "I dag" : p.dager === 1 ? "I morgen" : `om ${p.dager} dager`;
    const dato = `${p.dato.getDate()}. ${KI_LA_MND[p.dato.getMonth()]}`;
    const konf = Array.from({ length: 9 }, (_, i) =>
      `<rect class="konf" x="${18 + i * 12}" y="-8" width="5" height="9" rx="1.5"
        fill="${["#ffd98a", "#ff9ec4", "#8fd3ff", "#b6f0c2"][i % 4]}"
        style="animation-delay:-${((i * 0.36) % 3.4).toFixed(2)}s"/>`).join("");
    return `<div class="bhero ${p.dager === 0 ? "i_dag" : ""}" data-b="${kiLaEsc(p.id)}" role="button" tabindex="0">
      <svg viewBox="0 0 140 140" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;z-index:-1">
        ${konf}
      </svg>
      <svg class="bkake" viewBox="0 0 120 120" aria-hidden="true">
        <g class="ballong"><ellipse cx="24" cy="30" rx="11" ry="14" fill="#ff9ec4" opacity=".9"/>
          <path d="M24 44v16" stroke="#ff9ec4" stroke-width="1.6" opacity=".6"/></g>
        <g class="ballong b2"><ellipse cx="46" cy="22" rx="9" ry="12" fill="#8fd3ff" opacity=".85"/>
          <path d="M46 34v14" stroke="#8fd3ff" stroke-width="1.5" opacity=".6"/></g>
        <g class="ballong b3"><ellipse cx="64" cy="34" rx="8" ry="10" fill="#ffd98a" opacity=".8"/>
          <path d="M64 44v12" stroke="#ffd98a" stroke-width="1.4" opacity=".55"/></g>
        <path d="M22 108V84a8 8 0 0 1 8-8h58a8 8 0 0 1 8 8v24z" fill="#fff" fill-opacity=".16"/>
        <path d="M18 108h82" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".65"/>
        <path d="M59 76V64" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
        <g class="blys"><path d="M59 62c4-4 1.5-8 0-9.5-1.5 1.5-4 5.5 0 9.5z" fill="#ffd98a"/></g>
      </svg>
      <div class="merkerad">
        <span class="merke ${p.dager === 0 ? "naa" : ""}">${kiLaEsc(naar)}</span>
        <span class="merke">${kiLaEsc(dato)}</span>
      </div>
      <h3>${kiLaEsc(p.navn)}</h3>
      <div class="und">${p.alder ? `fyller ${p.alder} år` : "har bursdag"}</div>
    </div>`;
  }

  /* Månedskalender: en ring per dag, med antall lanseringer som merke */
  _kalender(alle) {
    const nå = new Date(); nå.setHours(0, 0, 0, 0);
    const vist = new Date(nå.getFullYear(), nå.getMonth() + this._mnd, 1);
    const start = new Date(vist);
    start.setDate(1 - ((vist.getDay() + 6) % 7));                   /* mandag først */
    const perDag = {};
    alle.forEach((x) => {
      const d = new Date(x.naar); d.setHours(0, 0, 0, 0);
      (perDag[d.toDateString()] = perDag[d.toDateString()] || []).push(x);
    });
    const ruter = [];
    for (let i = 0; i < 42; i++) {
      const dag = new Date(start); dag.setDate(start.getDate() + i);
      const liste = perDag[dag.toDateString()] || [];
      const utenfor = dag.getMonth() !== vist.getMonth();
      const bareFilm = liste.length > 0 && liste.every((x) => x.type === "film");
      ruter.push(`<div class="dag ${utenfor ? "utenfor" : ""} ${liste.length ? "har" : ""}
        ${dag.getTime() === nå.getTime() ? "idag" : ""} ${bareFilm ? "film" : ""}
        ${this._valgtDag === dag.toDateString() ? "valgt" : ""}"
        ${liste.length ? `data-dag="${dag.toDateString()}"` : ""}>
        ${liste.length ? `<span class="antall">${liste.length}</span>` : ""}${dag.getDate()}</div>`);
    }
    const valgt = this._valgtDag ? (perDag[this._valgtDag] || []) : (perDag[nå.toDateString()] || []);
    const dagTekst = this._valgtDag ? new Date(this._valgtDag) : nå;
    return `<div class="kal">
      <div class="kaltopp">
        <button class="pil" data-mnd="-1"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <div class="mnd">${vist.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}</div>
        <button class="pil" data-mnd="1"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
      <div class="ukedager">${["M", "T", "O", "T", "F", "L", "S"].map((u) => `<span>${u}</span>`).join("")}</div>
      <div class="rutenett">${ruter.join("")}</div>
      <div class="valgtdag">${kiLaEsc(dagTekst.toLocaleDateString("nb-NO",
        { weekday: "long", day: "numeric", month: "long" }))}${valgt.length ? "" : " · ingenting"}</div>
    </div>
    ${valgt.length ? this._liste(valgt, 0) : ""}`;
  }

  /* Én liste med rader, brukt både under heroen og under kalenderen */
  _liste(rader, forskyv, hale = "") {
    const c = this._c;
    const i_dag = new Date(); i_dag.setHours(0, 0, 0, 0);
    return `<div class="liste">${rader.map((x, i) => {
      const n = this._naartekst(x.naar);
      const dag = new Date(x.naar); dag.setHours(0, 0, 0, 0);
      const under = [x.episode || (x.type === "film" ? (x.kino ? "Kino" : "Film") : ""), x.nummer, x.studio]
        .filter(Boolean).join(" · ");
      return `<div class="rad ${dag.getTime() === i_dag.getTime() ? "idag" : ""}" data-i="${i + forskyv}"
        role="button" tabindex="0">
        ${c.plakater !== false ? `<span class="p" style="${x.plakat ? `background-image:url('${kiLaEsc(x.plakat)}')` : ""}"></span>` : "<span></span>"}
        <span><span class="n">${kiLaEsc(x.tittel)}</span><span class="d">${kiLaEsc(under)}</span></span>
        <span class="hoyre"><span class="dag">${kiLaEsc(n.kort)}</span>
          <span class="dato">${kiLaEsc(x.naar.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }))}</span></span>
      </div>`;
    }).join("")}${hale}</div>`;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const alle = this._alle();
    const forste = alle[0];
    const fra = c.visning === "liste" ? 0 : 1;
    const resten = this._alt ? alle.slice(fra) : alle.slice(fra, fra + Number(c.antall || 6));
    const begge = !!c.serier && !!c.filmer;

    const hero = forste && c.visning !== "liste" && !this._visKal ? (() => {
      const n = this._naartekst(forste.naar);
      const bits = [forste.rating, forste.lengde ? `${forste.lengde} min` : "", forste.studio].filter(Boolean);
      return `<div class="hero" data-i="0" role="button" tabindex="0">
        ${forste.bakgrunn ? `<div class="bak" style="background-image:url('${kiLaEsc(forste.bakgrunn)}')"></div>` : ""}
        ${forste.plakat ? `<div class="plakat" style="background-image:url('${kiLaEsc(forste.plakat)}')"></div>` : `<div class="plakat"></div>`}
        <div class="tekst">
          <div class="merkerad">
            <span class="merke ${n.naa ? "naa" : ""}">${kiLaEsc(n.lang)}</span>
            ${forste.type === "film" ? `<span class="merke film">${forste.kino ? "Kino" : "Film"}</span>` : ""}
            ${forste.nummer ? `<span class="merke">${kiLaEsc(forste.nummer)}</span>` : ""}
          </div>
          <h3>${kiLaEsc(forste.tittel)}</h3>
          ${forste.episode ? `<div class="und">${kiLaEsc(forste.episode)}</div>` : ""}
          <div class="nar">${bits.map((b) => `<span>${kiLaEsc(b)}</span>`).join("<span>·</span>")}</div>
        </div>
      </div>`;
    })() : "";

    const forskyv = c.visning === "liste" ? 0 : 1;
    const igjen = Math.max(0, alle.length - forskyv - Number(c.antall || 6));
    const merKnapp = igjen || this._alt
      ? `<button class="mer ${this._alt ? "apen" : ""}" data-mer="1">
          <ha-icon icon="mdi:chevron-down"></ha-icon>${this._alt ? "Vis færre" : `Vis ${igjen} til`}</button>`
      : "";
    const liste = resten.length ? this._liste(resten, forskyv, merKnapp) : "";

    /* Hero-sidene: bursdag først når noen har bursdag i dag */
    const bursdager = this._bursdager();
    const bSider = bursdager.slice(0, 3).map((p) => ({ type: "bursdag", html: this._bursdagHero(p), dager: p.dager }));
    const lSide = hero ? [{ type: "lansering", html: hero }] : [];
    /* har noen bursdag i dag, kommer den først – ellers ligger lanseringen først */
    const sider = bursdager[0] && bursdager[0].dager === 0 ? [...bSider, ...lSide] : [...lSide, ...bSider];
    if (this._side === undefined || this._side >= sider.length) this._side = 0;
    const sveip = sider.length > 1
      ? `<div class="sveip"><div class="spor" style="transform:translateX(-${this._side * 100}%)">
          ${sider.map((x) => `<div class="side">${x.html}</div>`).join("")}</div></div>
        <div class="prikker">${sider.map((_, i) =>
          `<i class="${i === this._side ? "valgt" : ""}" data-s="${i}"></i>`).join("")}</div>`
      : (sider[0] ? sider[0].html : "");

    const html = `<style>${KI_LANS_STIL}</style>
      <div class="rot">
        ${begge || c.kalender !== false ? `<div class="faner"><div class="skinne">
          ${begge ? [["alle", "Alle"], ["serie", "Serier"], ["film", "Filmer"]].map(([k, n]) =>
            `<button class="fane ${this._fane === k ? "valgt" : ""}" data-f="${k}">${n}</button>`).join("") : ""}
          ${c.kalender !== false ? `<button class="fane ${this._visKal ? "valgt" : ""}" data-v="kal"
            title="Kalender">${begge ? `<ha-icon icon="mdi:calendar-month" style="--mdc-icon-size:18px"></ha-icon>` : "Kalender"}</button>` : ""}
        </div></div>` : ""}
        ${this._visKal ? this._kalender(alle)
          : (sveip || (alle.length ? "" : `<div class="tom">Ingenting på vei akkurat nå.</div>`)) + liste}
      </div>`;

    const visning = this._visKal ? "kalender" : this._fane;
    if (visning !== this._sisteVisning) {
      this._sisteVisning = visning;
      window.dispatchEvent(new CustomEvent("ki-lansering-visning", { detail: { visning } }));
    }
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    const r = this.shadowRoot;
    r.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      this._fane = b.dataset.f; this._visKal = false; this._forrige = null; this._tegn();
    }));
    const kalKnapp = r.querySelector('[data-v="kal"]');
    if (kalKnapp) kalKnapp.addEventListener("click", () => { this._visKal = !this._visKal; this._forrige = null; this._tegn(); });
    this._koblSveip(r, sider.length);
    r.querySelectorAll("[data-b]").forEach((el) => el.addEventListener("click", () => {
      if (this._sveipet) { this._sveipet = false; return; }
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.b }, bubbles: true, composed: true }));
    }));
    const mer = r.querySelector("[data-mer]");
    if (mer) mer.addEventListener("click", () => { this._alt = !this._alt; this._forrige = null; this._tegn(); });
    r.querySelectorAll("[data-mnd]").forEach((b) => b.addEventListener("click", () => {
      this._mnd += Number(b.dataset.mnd); this._valgtDag = null; this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-dag]").forEach((el) => el.addEventListener("click", () => {
      this._valgtDag = this._valgtDag === el.dataset.dag ? null : el.dataset.dag;
      this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-i]").forEach((el) => el.addEventListener("click", () => {
      if (this._visKal) {
        const nå = new Date(); nå.setHours(0, 0, 0, 0);
        const dag = this._valgtDag || nå.toDateString();
        const denne = this._alle().filter((x) => { const d = new Date(x.naar); d.setHours(0, 0, 0, 0); return d.toDateString() === dag; });
        const x = denne[+el.dataset.i]; if (x) this._apne(x);
        return;
      }
      const x = this._alle()[+el.dataset.i]; if (x) this._apne(x);
    }));
  }
}
if (!customElements.get("ki-lansering-card")) customElements.define("ki-lansering-card", KiLanseringCard);

class KiLanseringCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { serier: "Sonarr-sensor", filmer: "Radarr-sensor", antall: "Antall i lista",
        visning: "Visning", plakater: "Vis plakater" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "serier", selector: { entity: { domain: "sensor" } } },
      { name: "filmer", selector: { entity: { domain: "sensor" } } },
      { name: "antall", selector: { number: { mode: "box", min: 1, max: 20 } } },
      { name: "visning", selector: { select: { mode: "dropdown", options: [
        { value: "full", label: "Hero og liste" }, { value: "liste", label: "Bare liste" },
        { value: "hero", label: "Bare hero" }] } } },
      { name: "plakater", selector: { boolean: {} } },
    ];
  }
}
if (!customElements.get("ki-lansering-card-editor")) customElements.define("ki-lansering-card-editor", KiLanseringCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-lansering-card")) window.customCards.push({ type: "ki-lansering-card", name: "KI Lansering", description: "Kommende episoder og filmer fra Sonarr og Radarr", preview: true });

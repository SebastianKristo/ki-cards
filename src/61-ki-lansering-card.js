/* ki-lansering-card – kommende episoder og filmer fra Sonarr og Radarr.
 * Leser «upcoming media»-sensorene og viser dem i samme stil som resten av dashbordet.
 *
 * type: custom:ki-lansering-card
 * serier: sensor.sonarr_sonarr_upcoming_media
 * filmer: sensor.radarr_radarr_upcoming_media
 * antall: 6                 # hvor mange i lista under heroen
 * visning: full             # full (hero + liste) | liste | hero
 * plakater: true            # vis plakater i lista
 */
const KI_LANS_VERSJON = "1.0.0";

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
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; transition:none !important; } }
`;

const kiLaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_LA_MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

class KiLanseringCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "alle"; }
  static getConfigElement() { return document.createElement("ki-lansering-card-editor"); }
  static getStubConfig() { return { serier: "sensor.sonarr_sonarr_upcoming_media", filmer: "sensor.radarr_radarr_upcoming_media" }; }
  getCardSize() { return 8; }

  setConfig(c) {
    this._c = { antall: 6, visning: "full", plakater: true, ...(c || {}) };
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

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const alle = this._alle();
    const forste = alle[0];
    const resten = alle.slice(c.visning === "liste" ? 0 : 1, (c.visning === "liste" ? 0 : 1) + Number(c.antall || 6));
    const begge = !!c.serier && !!c.filmer;

    const hero = forste && c.visning !== "liste" ? (() => {
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

    const i_dag = new Date(); i_dag.setHours(0, 0, 0, 0);
    const liste = resten.length ? `<div class="liste">${resten.map((x, i) => {
      const n = this._naartekst(x.naar);
      const dag = new Date(x.naar); dag.setHours(0, 0, 0, 0);
      const under = [x.episode || (x.type === "film" ? (x.kino ? "Kino" : "Film") : ""), x.nummer, x.studio]
        .filter(Boolean).join(" · ");
      return `<div class="rad ${dag.getTime() === i_dag.getTime() ? "idag" : ""}" data-i="${i + (c.visning === "liste" ? 0 : 1)}" role="button" tabindex="0">
        ${c.plakater !== false ? `<span class="p" style="${x.plakat ? `background-image:url('${kiLaEsc(x.plakat)}')` : ""}"></span>` : `<span></span>`}
        <span><span class="n">${kiLaEsc(x.tittel)}</span><span class="d">${kiLaEsc(under)}</span></span>
        <span class="hoyre"><span class="dag">${kiLaEsc(n.kort)}</span>
          <span class="dato">${kiLaEsc(x.naar.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }))}</span></span>
      </div>`;
    }).join("")}</div>` : "";

    const html = `<style>${KI_LANS_STIL}</style>
      <div class="rot">
        ${begge ? `<div class="faner"><div class="skinne">
          ${[["alle", "Alle"], ["serie", "Serier"], ["film", "Filmer"]].map(([k, n]) =>
            `<button class="fane ${this._fane === k ? "valgt" : ""}" data-f="${k}">${n}</button>`).join("")}
        </div></div>` : ""}
        ${hero || (alle.length ? "" : `<div class="tom">Ingenting på vei akkurat nå.</div>`)}
        ${liste}
      </div>`;

    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    const r = this.shadowRoot;
    r.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { this._fane = b.dataset.f; this._forrige = null; this._tegn(); }));
    r.querySelectorAll("[data-i]").forEach((el) => el.addEventListener("click", () => {
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

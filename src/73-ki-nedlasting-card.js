/* ki-nedlasting-card – qBittorrent: fart, køen, totaler og historikk.
 *
 * type: custom:ki-nedlasting-card
 * prefiks: sensor.qbittorrent_        # slik entitetene dine heter
 * bryter: switch.qbittorrent_alternative_speed
 * container: switch.d_day_darling_container_binhex_qbittorrentvpn
 * oppdatering: update.d_day_darling_container_binhex_qbittorrentvpn_update
 * historikk_dager: 30                 # 0 slår av historikkdelen
 * maks_fart: 12                       # MB/s som fyller søylen helt
 */
const KI_NED_VERSJON = "1.0.0";

const KI_NED_STATUS = {
  downloading: { navn: "Laster ned", farge: "var(--blue, #4aa3e0)", ikon: "mdi:download" },
  up_down: { navn: "Laster og deler", farge: "var(--purple, #a98fe0)", ikon: "mdi:swap-vertical" },
  seeding: { navn: "Deler", farge: "var(--green, #5ad18b)", ikon: "mdi:upload" },
  idle: { navn: "Hviler", farge: "var(--gray600, #8a8a8d)", ikon: "mdi:sleep" },
};

const KI_NED_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:8px; color:var(--gray1000); }

  /* ---- heroen: farten, med data som renner gjennom et rør ---- */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:24px;
    background:var(--gray200); padding:14px 16px 0; cursor:pointer;
    display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:13px; align-items:start;
    transition:background .5s var(--myk); }
  .hero.aktiv { background:color-mix(in srgb, var(--f) 22%, var(--gray200)); }

  .hero .ik { width:42px; height:42px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:22px;
    background:rgba(250,251,252,.10); color:var(--f); }
  .merke { font-size:12px; font-weight:600; opacity:.7; }
  .tilstand { font-size:16px; font-weight:700; letter-spacing:-.01em; margin-top:1px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .fart { display:flex; align-items:baseline; gap:16px; margin-top:6px; flex-wrap:wrap; }
  .fart b { font-size:clamp(24px,7vw,32px); font-weight:600; letter-spacing:-.03em;
    line-height:1.05; font-variant-numeric:tabular-nums; }
  .fart span { font-size:12px; opacity:.6; margin-left:5px; font-weight:500; }
  .fart i { font-style:normal; --mdc-icon-size:15px; opacity:.6; }
  .kobling { font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:999px;
    background:rgba(250,251,252,.10); white-space:nowrap; }
  .kobling.advarsel { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .kobling.feil { background:var(--red,#e5706b); color:var(--black,#1b1b1b); }

  /* røret nederst i heroen. Pakkene går ned når den laster, opp når den deler. */
  .ror { grid-column:1 / -1; position:relative; height:34px; margin:8px -16px 0;
    overflow:hidden; opacity:.5; }
  .hero.aktiv .ror { opacity:1; }
  .ror .lag { position:absolute; inset:0; }
  .ror i { position:absolute; width:5px; height:5px; border-radius:50%;
    background:var(--f); top:50%; margin-top:-2.5px; opacity:0; }
  .hero.ned .ror i { animation:kiNedHoyre var(--t,2.2s) linear infinite; }
  .hero.opp .ror i { animation:kiNedVenstre var(--t,2.2s) linear infinite; }
  @keyframes kiNedHoyre {
    0% { left:-2%; opacity:0 } 8% { opacity:.9 } 92% { opacity:.9 } 100% { left:102%; opacity:0 }
  }
  @keyframes kiNedVenstre {
    0% { left:102%; opacity:0 } 8% { opacity:.9 } 92% { opacity:.9 } 100% { left:-2%; opacity:0 }
  }
  .ror .strek { position:absolute; left:0; right:0; top:50%; height:1px;
    background:color-mix(in srgb, var(--gray1000) 14%, transparent); }

  /* ---- køen ---- */
  .rutenett { display:grid; grid-template-columns:repeat(auto-fit,minmax(78px,1fr)); gap:8px; }
  .flis { background:var(--gray200); border-radius:20px; padding:12px 10px; text-align:center;
    cursor:pointer; min-width:0; }
  .flis b { display:block; font-size:22px; font-weight:600; letter-spacing:-.02em;
    font-variant-numeric:tabular-nums; }
  .flis span { display:block; font-size:11.5px; opacity:.58; margin-top:2px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis.varsel { background:color-mix(in srgb, var(--red,#e5706b) 30%, var(--gray200)); }

  /* ---- totaler og forhold ---- */
  .totaler { background:var(--gray200); border-radius:24px; padding:14px 16px;
    display:grid; gap:10px; }
  .trad { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
    font-size:13.5px; }
  .trad b { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
  .trad .n { opacity:.6; }
  .forhold { height:12px; border-radius:999px; overflow:hidden; display:flex;
    background:color-mix(in srgb, var(--gray1000) 12%, transparent); }
  .forhold i { height:100%; transition:width .9s var(--myk); }
  .forhold i.ned { background:var(--blue,#4aa3e0); }
  .forhold i.opp { background:var(--green,#5ad18b); }
  .fnote { display:flex; justify-content:space-between; font-size:11.5px; opacity:.55; }

  /* ---- historikk ---- */
  .hist { background:var(--gray200); border-radius:24px; padding:14px 16px; display:grid; gap:8px; }
  .hist .tittel { font-size:13px; opacity:.6; }
  .soyler { display:flex; align-items:flex-end; gap:2px; height:96px; }
  .soyler .s { flex:1 1 0; min-width:0; height:100%; display:flex; align-items:flex-end; }
  .soyler .s i { display:block; width:100%; border-radius:3px 3px 0 0;
    background:var(--blue,#4aa3e0); transition:height .5s var(--myk); }
  .soyler .s i.null { background:color-mix(in srgb, var(--gray1000) 14%, transparent); }
  .soyler .s:hover i { filter:brightness(1.25); }
  .akse { display:flex; justify-content:space-between; font-size:11px; opacity:.5; }

  .knapper { display:flex; gap:8px; flex-wrap:wrap; }
  .kn { border:0; border-radius:75px; padding:11px 16px; font:inherit; font-size:13px;
    font-weight:500; cursor:pointer; background:var(--gray200); color:var(--gray1000);
    display:flex; align-items:center; gap:8px; --mdc-icon-size:18px; }
  .kn.pa { background:var(--active-small, var(--active-big,#ee95ff)); color:var(--gray100,#fafbfc); }
  .kn.rod { background:var(--red,#e5706b); color:var(--black,#1b1b1b); }

  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }

  @media (prefers-reduced-motion: reduce) {
    .ror i, .soyler .s i, .forhold i { animation:none !important; transition:none !important; }
  }
`;

const kiNeEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* MB/s med fornuftig oppløsning: 0,0 under 10, heltall over */
const kiNeFart = (v) => (v === null || v === undefined || isNaN(v)) ? "–"
  : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: v < 10 ? 1 : 0,
    maximumFractionDigits: v < 10 ? 1 : 0 });

/* TiB til noe lesbart. Integrasjonen oppgir TiB, men 0,004 TiB sier ingenting. */
const kiNeMengde = (tib) => {
  if (tib === null || tib === undefined || isNaN(tib)) return "–";
  const gib = Number(tib) * 1024;
  if (gib < 1) return `${Math.round(gib * 1024)} MiB`;
  if (gib < 1024) return `${gib.toLocaleString("nb-NO", { maximumFractionDigits: gib < 10 ? 1 : 0 })} GiB`;
  return `${Number(tib).toLocaleString("nb-NO", { maximumFractionDigits: 2 })} TiB`;
};

class KiNedlastingCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { prefiks: "sensor.qbittorrent_" }; }
  getCardSize() { return 10; }

  setConfig(c) {
    this._c = { prefiks: "sensor.qbittorrent_", historikk_dager: 30, maks_fart: 12, ...(c || {}) };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._ider().map((id) => (h.states[id] || {}).state));
    if (sig !== this._sig) { this._sig = sig; this._tegn(); }
    else if (!g) this._tegn();
  }

  _id(s) { return this._c.prefiks + s; }
  _st(s) { return this._h && this._h.states[this._id(s)]; }
  _tall(s) {
    const st = this._st(s);
    if (!st || ["unknown", "unavailable", ""].includes(st.state)) return null;
    const n = parseFloat(st.state);
    return isNaN(n) ? null : n;
  }
  _tekst(s) {
    const st = this._st(s);
    return st && !["unknown", "unavailable"].includes(st.state) ? st.state : null;
  }

  _ider() {
    const c = this._c;
    const egne = ["status", "connection_status", "download_speed", "upload_speed",
      "active_torrents", "all_torrents", "paused_torrents", "inactive_torrents",
      "errored_torrents", "all_time_download", "all_time_upload"].map((s) => this._id(s));
    return egne.concat([c.bryter, c.container, c.oppdatering].filter(Boolean));
  }

  /* Historikken hentes fra statistikken: «all-time download» er total_increasing, så
     Home Assistant har ferdig utregnet endring per døgn. Tilstandshistorikken måtte vi
     ellers differensiert selv, og den overlever ikke en omstart av qBittorrent. */
  async _hentHistorikk() {
    const c = this._c;
    const id = this._id("all_time_download");
    if (!this._h || !this._h.callWS || !this._h.states[id]) return { rader: [], feil: null };
    const dager = Math.max(7, Math.min(180, Number(c.historikk_dager) || 30));
    const slutt = new Date();
    const start = new Date(slutt.getTime() - dager * 864e5);
    start.setHours(0, 0, 0, 0);
    try {
      const svar = await this._h.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(),
        end_time: slutt.toISOString(),
        statistic_ids: [id],
        period: "day",
        types: ["change", "sum"],
      });
      const rader = (svar && svar[id]) || [];
      let forrige = null;
      const ut = [];
      for (const r of rader) {
        let v = r.change;
        if (v === undefined || v === null) {
          v = forrige === null ? null : Number(r.sum) - forrige;
          forrige = Number(r.sum);
        }
        if (v === null || isNaN(v)) continue;
        // verdiene er i TiB, som sensoren
        ut.push({ dato: new Date(r.start), tib: Math.max(0, Number(v)) });
      }
      return { rader: ut, feil: null };
    } catch (e) {
      return { rader: [], feil: e && e.message ? e.message : String(e) };
    }
  }

  _histHtml() {
    const c = this._c;
    if (!Number(c.historikk_dager)) return "";
    const h = this._hist;
    if (!h) {
      if (!this._henter) {
        this._henter = true;
        this._hentHistorikk().then((r) => { this._henter = false; this._hist = r; this._tegn(); });
      }
      return `<div class="hist"><div class="tittel">Henter historikk …</div></div>`;
    }
    if (h.feil) {
      return `<div class="hist"><div class="tittel">Fikk ikke hentet statistikken: ${
        kiNeEsc(h.feil)}</div></div>`;
    }
    if (!h.rader.length) {
      return `<div class="hist"><div class="tittel">Ingen døgnstatistikk ennå. Home Assistant
        skriver den én gang i timen, så første søyle tar et døgn.</div></div>`;
    }
    const r = h.rader;
    const maks = Math.max(...r.map((x) => x.tib), 1e-9);
    const sum = r.reduce((a, x) => a + x.tib, 0);
    const dagerMed = r.filter((x) => x.tib > 0.0005).length;
    const dato = (d) => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
    return `<div class="hist">
      <div class="trad"><span class="n">Lastet ned siste ${r.length} døgn</span>
        <b>${kiNeEsc(kiNeMengde(sum))}</b></div>
      <div class="soyler">${r.map((x) => `
        <div class="s" title="${kiNeEsc(dato(x.dato))}: ${kiNeEsc(kiNeMengde(x.tib))}">
          <i class="${x.tib > 0.0005 ? "" : "null"}"
             style="height:${Math.max(2, (x.tib / maks) * 100).toFixed(1)}%"></i>
        </div>`).join("")}</div>
      <div class="akse"><span>${kiNeEsc(dato(r[0].dato))}</span>
        <span>${dagerMed} av ${r.length} døgn med nedlasting</span>
        <span>${kiNeEsc(dato(r[r.length - 1].dato))}</span></div>
    </div>`;
  }

  _tegn() {
    const c = this._c;
    if (!this._st("status") && !this._st("download_speed")) {
      this.shadowRoot.innerHTML = `<style>${KI_NED_STIL}</style>
        <div class="kort"><div class="tom">
          Finner ingen qBittorrent-sensorer med prefikset <code>${kiNeEsc(c.prefiks)}</code>.
          Se etter «Download speed» i Utviklerverktøy og sett <code>prefiks</code> til det
          entitetene dine faktisk heter.
        </div></div>`;
      return;
    }

    const status = this._tekst("status") || "idle";
    const s = KI_NED_STATUS[status] || { navn: status, farge: "var(--gray600)", ikon: "mdi:help" };
    const ned = this._tall("download_speed");
    const opp = this._tall("upload_speed");
    const kobling = this._tekst("connection_status");
    const laster = (ned || 0) > 0.01;
    const deler = (opp || 0) > 0.01;

    // Pakkene i røret går fortere når farten er høyere, men aldri raskere enn øyet tåler
    const maksFart = Number(c.maks_fart) || 12;
    const brukt = Math.max(ned || 0, opp || 0);
    const tid = (2.6 - Math.min(1, brukt / maksFart) * 1.9).toFixed(2);
    const pakker = Array.from({ length: 7 }, (_, i) =>
      `<i style="--t:${tid}s;animation-delay:-${(i * Number(tid) / 7).toFixed(2)}s"></i>`).join("");

    const koblingKlasse = kobling === "firewalled" ? "advarsel"
      : kobling === "disconnected" ? "feil" : "";
    const koblingTekst = { connected: "Tilkoblet", firewalled: "Bak brannmur",
      disconnected: "Frakoblet" }[kobling] || kobling;

    const koen = [
      { n: "Aktive", k: "active_torrents" },
      { n: "Pauset", k: "paused_torrents" },
      { n: "Uten trafikk", k: "inactive_torrents" },
      { n: "Feilet", k: "errored_torrents", varsel: true },
      { n: "Totalt", k: "all_torrents" },
    ].map((x) => ({ ...x, v: this._tall(x.k) })).filter((x) => x.v !== null);

    const nedT = this._tall("all_time_download");
    const oppT = this._tall("all_time_upload");
    const forhold = nedT && oppT !== null ? oppT / nedT : null;
    const sumT = (nedT || 0) + (oppT || 0);

    const alt = c.bryter && this._h.states[c.bryter];
    const cont = c.container && this._h.states[c.container];
    const oppd = c.oppdatering && this._h.states[c.oppdatering];

    this.shadowRoot.innerHTML = `<style>${KI_NED_STIL}</style>
      <div class="kort">
        <div class="hero ${laster || deler ? "aktiv" : ""} ${laster ? "ned" : deler ? "opp" : ""}"
             style="--f:${s.farge}" data-mer="${kiNeEsc(this._id("status"))}" tabindex="0">
          <span class="ik"><ha-icon icon="${s.ikon}"></ha-icon></span>
          <div>
            <div class="merke">qBittorrent</div>
            <div class="tilstand">${kiNeEsc(s.navn)}</div>
            <div class="fart">
              <span><i><ha-icon icon="mdi:arrow-down"></ha-icon></i>
                <b>${kiNeEsc(kiNeFart(ned))}</b><span>MB/s</span></span>
              <span><i><ha-icon icon="mdi:arrow-up"></ha-icon></i>
                <b>${kiNeEsc(kiNeFart(opp))}</b><span>MB/s</span></span>
            </div>
          </div>
          ${kobling ? `<span class="kobling ${koblingKlasse}">${kiNeEsc(koblingTekst)}</span>` : ""}
          <div class="ror"><span class="strek"></span><div class="lag">${pakker}</div></div>
        </div>

        ${koen.length ? `<div class="rutenett">${koen.map((x) => `
          <div class="flis ${x.varsel && x.v > 0 ? "varsel" : ""}"
               data-mer="${kiNeEsc(this._id(x.k))}" tabindex="0">
            <b>${x.v}</b><span>${kiNeEsc(x.n)}</span>
          </div>`).join("")}</div>` : ""}

        ${nedT !== null || oppT !== null ? `<div class="totaler">
          <div class="trad"><span class="n">Totalt siden start</span>
            <b>${kiNeEsc(kiNeMengde(sumT))}</b></div>
          <div class="forhold">
            <i class="ned" style="width:${sumT ? ((nedT || 0) / sumT * 100).toFixed(1) : 50}%"></i>
            <i class="opp" style="width:${sumT ? ((oppT || 0) / sumT * 100).toFixed(1) : 50}%"></i>
          </div>
          <div class="fnote">
            <span>Ned ${kiNeEsc(kiNeMengde(nedT))}</span>
            ${forhold !== null ? `<span>Forhold ${forhold.toLocaleString("nb-NO",
              { maximumFractionDigits: 2 })}</span>` : ""}
            <span>Opp ${kiNeEsc(kiNeMengde(oppT))}</span>
          </div>
        </div>` : ""}

        ${this._histHtml()}

        <div class="knapper">
          ${alt ? `<button class="kn ${alt.state === "on" ? "pa" : ""}" data-veksle="${
            kiNeEsc(c.bryter)}">
            <ha-icon icon="mdi:speedometer-slow"></ha-icon>Sparefart</button>` : ""}
          ${cont ? `<button class="kn ${cont.state === "on" ? "" : "rod"}" data-veksle="${
            kiNeEsc(c.container)}">
            <ha-icon icon="mdi:${cont.state === "on" ? "check-circle-outline" : "alert-circle-outline"}"></ha-icon>${
            cont.state === "on" ? "Containeren kjører" : "Containeren er stoppet"}</button>` : ""}
          ${oppd && oppd.state === "on" ? `<button class="kn" data-mer="${kiNeEsc(c.oppdatering)}">
            <ha-icon icon="mdi:cloud-download-outline"></ha-icon>Ny versjon</button>` : ""}
        </div>
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]")) {
      const aapne = () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
      el.addEventListener("click", aapne);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aapne(); }
      });
    }
    for (const el of this.shadowRoot.querySelectorAll("[data-veksle]")) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = el.dataset.veksle;
        this._h.callService(id.split(".")[0], "toggle", { entity_id: id });
      });
    }
  }
}

customElements.define("ki-nedlasting-card", KiNedlastingCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-nedlasting-card"))
  window.customCards.push({ type: "ki-nedlasting-card", name: "KI Nedlasting",
    description: "qBittorrent med fart, kø, totaler og historikk", preview: true });

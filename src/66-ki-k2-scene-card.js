/* ki-k2-scene-card – 3D-printeren som levende bilde, ment øverst i #3d-popupen.
 *
 * type: custom:ki-k2-scene-card
 * prefix: creality_k2          # entitetene finnes ut fra prefikset
 * navn: Creality K2
 * hoyde: 210
 * # framdrift/status/dyse/seng/gjenstaar/lag/av_lag/filnavn kan settes manuelt
 * demo: skriver | ferdig | pause | av
 */
const KI_K2S_VERSJON = "1.0.0";

const KI_K2S_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { position:relative; overflow:hidden; border-radius:var(--ha-card-border-radius,24px);
    background:linear-gradient(180deg,#1b2030 0%,#161a26 60%,#12151f 100%); color:var(--gray1000);
    cursor:pointer; }
  .kort.skriver { background:linear-gradient(180deg,#1d2a3a 0%,#17222f 60%,#121a24 100%); }
  .kort.ferdig { background:linear-gradient(180deg,#1b3026 0%,#16261f 60%,#121d18 100%); }
  .kort.feil { background:linear-gradient(180deg,#3a1f22 0%,#2a171a 60%,#1d1215 100%); }
  .kort svg { position:absolute; inset:0; width:100%; height:100%; }

  /* skrivehodet går fram og tilbake, og stiger med laget */
  .hode { transform-box:fill-box; animation:k2-hode 3.2s ease-in-out infinite alternate; }
  .kort.pause .hode, .kort.av .hode, .kort.ferdig .hode { animation:none; }
  @keyframes k2-hode { from { transform:translateX(-46px); } to { transform:translateX(46px); } }
  .traad { opacity:0; }
  .kort.skriver .traad { opacity:.9; animation:k2-traad 1.1s linear infinite; }
  @keyframes k2-traad { 0% { transform:translateY(-3px); opacity:.2; } 60% { opacity:.9; }
    100% { transform:translateY(4px); opacity:0; } }

  /* spolen snurrer når den skriver */
  .spole { transform-box:fill-box; transform-origin:center; }
  .kort.skriver .spole { animation:k2-spole 6s linear infinite; }
  @keyframes k2-spole { to { transform:rotate(360deg); } }
  /* vifta går litt raskere */
  .vifte { transform-box:fill-box; transform-origin:center; }
  .kort.skriver .vifte { animation:k2-vifte 1.1s linear infinite; }
  @keyframes k2-vifte { to { transform:rotate(360deg); } }

  /* varmen over sengen når den er varm */
  .varme { opacity:0; }
  .kort.varm .varme { opacity:.5; animation:k2-varme 3.4s ease-in-out infinite; }
  @keyframes k2-varme { 0%,100% { transform:translateY(0); opacity:.15; }
    50% { transform:translateY(-7px); opacity:.5; } }

  .emne { transition:height .8s var(--myk), y .8s var(--myk); }
  .glass { opacity:.12; }

  .tekst { position:absolute; left:18px; bottom:14px; z-index:2; }
  .tekst b { display:block; font-size:19px; font-weight:600; text-shadow:0 2px 10px rgba(0,0,0,.6); }
  .tekst span { font-size:13px; opacity:.82; }
  .kort::after { content:""; position:absolute; left:0; right:0; bottom:0; height:78px; pointer-events:none;
    background:linear-gradient(180deg, rgba(10,13,20,0) 0%, rgba(10,13,20,.74) 72%, rgba(10,13,20,.88) 100%); }
  .merke { position:absolute; right:16px; top:16px; z-index:2; font-size:11px; font-weight:700;
    padding:6px 12px; border-radius:999px; background:rgba(255,255,255,.14); backdrop-filter:blur(6px); }
  .kort.skriver .merke { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); }
  .kort.ferdig .merke { background:var(--green,#7ee081); color:var(--black,#000); }
  .kort.feil .merke { background:var(--red,#e8657a); color:var(--black,#000); }

  /* framdriftslinje nederst */
  .bar { position:absolute; left:0; right:0; bottom:0; height:6px; z-index:2; background:rgba(255,255,255,.12); }
  .bar i { display:block; height:6px; background:var(--active-big,#ee95ff); transition:width .8s var(--myk); }
  .kort.ferdig .bar i { background:var(--green,#7ee081); }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiK2Esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiK2SceneCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-k2-scene-card-editor"); }
  static getStubConfig() { return { prefix: "creality_k2", hoyde: 210 }; }
  getCardSize() { return 4; }

  setConfig(c) {
    this._c = { prefix: "creality_k2", navn: "Creality K2", hoyde: 210, ...(c || {}) };
    this._forrige = null; this._cache = {};
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 30000); }
  disconnectedCallback() { clearInterval(this._i); }

  /* Finner entitetene ut fra prefikset – eller tar dem du har satt selv */
  _finn(navn, monstre, domener) {
    const c = this._c;
    if (c[navn]) return c[navn];
    if (this._cache[navn] !== undefined) return this._cache[navn];
    const h = this._h, p = String(c.prefix || "").toLowerCase();
    let treff = null;
    if (h) {
      const kandidater = Object.keys(h.states).filter((id) =>
        id.toLowerCase().includes(p) && (!domener || domener.includes(id.split(".")[0])));
      for (const m of monstre) {
        treff = kandidater.find((id) => m.test(id));
        if (treff) break;
      }
    }
    this._cache[navn] = treff;
    return treff;
  }
  _ider() {
    return ["framdrift", "status", "dyse", "seng", "gjenstaar", "lag", "av_lag", "filnavn"]
      .map((n) => this[`_id_${n}`] && this[`_id_${n}`]()).filter(Boolean);
  }
  _id_framdrift() { return this._finn("framdrift", [/progress|framdrift|prosent/i], ["sensor", "number"]); }
  _id_status() { return this._finn("status", [/print_?stat|_status|_state|tilstand/i], ["sensor", "binary_sensor"]); }
  _id_dyse() { return this._finn("dyse", [/nozzle|dyse|hotend|extruder.*temp/i], ["sensor"]); }
  _id_seng() { return this._finn("seng", [/bed|seng|plate.*temp/i], ["sensor"]); }
  _id_gjenstaar() { return this._finn("gjenstaar", [/remain|gjenst|left|eta/i], ["sensor"]); }
  _id_lag() { return this._finn("lag", [/current_?layer|lag_?na|layer$/i], ["sensor"]); }
  _id_av_lag() { return this._finn("av_lag", [/total_?layer|lag_?total/i], ["sensor"]); }
  _id_filnavn() { return this._finn("filnavn", [/file|jobb|job|print_?name|filnavn/i], ["sensor"]); }

  _tall(id, standard = null) {
    const st = id && this._h && this._h.states[id];
    if (!st) return standard;
    const n = Number(st.state);
    return isNaN(n) ? standard : n;
  }
  _tekst(id) {
    const st = id && this._h && this._h.states[id];
    return st ? String(st.state) : "";
  }

  /* Tilstanden i klartekst: skriver, pause, ferdig, feil eller av */
  _tilstand() {
    if (this._c.demo) return this._c.demo === true ? "skriver" : this._c.demo;
    const s = this._tekst(this._id_status()).toLowerCase();
    if (/print|kjør|running|busy|skriver/.test(s)) return "skriver";
    if (/paus/.test(s)) return "pause";
    if (/finish|complete|ferdig|done|idle_?finish/.test(s)) return "ferdig";
    if (/error|feil|fail/.test(s)) return "feil";
    if (/off|unavailable|unknown|av$/.test(s) || !s) return "av";
    return "klar";
  }
  _minutter(n) {
    if (n === null || n === undefined) return "";
    const m = Math.max(0, Math.round(Number(n)));
    if (m < 60) return `${m} min`;
    const t = Math.floor(m / 60);
    return `${t} t ${String(m % 60).padStart(2, "0")} min`;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const demo = !!c.demo;
    const tilstand = this._tilstand();
    if (!demo && !this._id_status() && !this._id_framdrift()) {
      const tom = `<style>${KI_K2S_STIL}</style>
        <div class="tom">Fant ingen entiteter med prefikset <b>${kiK2Esc(c.prefix)}</b>.</div>`;
      if (tom !== this._forrige) { this.shadowRoot.innerHTML = tom; this._forrige = tom; }
      return;
    }
    const pct = demo
      ? ({ skriver: 46, pause: 46, ferdig: 100, av: 0 }[tilstand] ?? 0)
      : Math.max(0, Math.min(100, this._tall(this._id_framdrift(), 0) || 0));
    const dyse = demo ? (tilstand === "skriver" ? 245 : 24) : this._tall(this._id_dyse());
    const seng = demo ? (tilstand === "skriver" ? 60 : 22) : this._tall(this._id_seng());
    const igjen = demo ? (tilstand === "skriver" ? 96 : null) : this._tall(this._id_gjenstaar());
    const lag = demo ? 128 : this._tall(this._id_lag());
    const avLag = demo ? 280 : this._tall(this._id_av_lag());
    const fil = demo ? "brakett_v3.gcode" : this._tekst(this._id_filnavn());
    const varm = (dyse || 0) > 50 || (seng || 0) > 35;

    /* emnet vokser på platen etter framdriften */
    const maksH = 54;
    const h2 = Math.max(2, Math.round(maksH * pct / 100));
    const dyseY = 150 - h2 - 16;

    const tekst = {
      skriver: fil ? fil.replace(/\.(gcode|3mf)$/i, "") : "Skriver ut",
      pause: "Satt på pause", ferdig: "Ferdig", feil: "Noe gikk galt",
      av: "Printeren er av", klar: "Klar",
    }[tilstand];
    const under = [
      tilstand === "skriver" && igjen ? `${this._minutter(igjen)} igjen` : "",
      lag && avLag ? `lag ${lag}/${avLag}` : "",
      dyse ? `dyse ${Math.round(dyse)}°` : "",
      seng ? `seng ${Math.round(seng)}°` : "",
    ].filter(Boolean).join(" · ");
    const merke = { skriver: `${Math.round(pct)} %`, pause: "Pause", ferdig: "Ferdig",
      feil: "Feil", av: "Av", klar: "Klar" }[tilstand];

    const html = `<style>${KI_K2S_STIL}</style>
      <div class="kort ${tilstand} ${varm ? "varm" : ""}" style="height:${Number(c.hoyde) || 210}px"
        role="button" tabindex="0">
        <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <!-- kabinettet -->
          <rect x="58" y="28" width="244" height="140" rx="10" fill="#0f141d"/>
          <rect class="glass" x="66" y="36" width="228" height="124" rx="6" fill="#8fd3ff"/>
          <rect x="58" y="28" width="244" height="140" rx="10" fill="none" stroke="#3d4a5f" stroke-width="4"/>
          <!-- portalen -->
          <path d="M74 52h212" stroke="#54627a" stroke-width="6" stroke-linecap="round"/>
          <path d="M74 46v112M286 46v112" stroke="#3d4a5f" stroke-width="5" stroke-linecap="round"/>

          <!-- skrivehodet -->
          <g transform="translate(180 0)"><g class="hode">
            <rect x="-20" y="46" width="40" height="22" rx="5" fill="#6f7f99"/>
            <path d="M-6 68h12l-4 12h-4z" fill="#c9d4e6"/>
            <g class="vifte" transform="translate(14 57)">
              <circle r="7" fill="none" stroke="#c9d4e6" stroke-width="2"/>
              <path d="M0 -6 A6 6 0 0 1 5 3z" fill="#c9d4e6" opacity=".8"/>
            </g>
            <rect class="traad" x="-1.2" y="80" width="2.4" height="${Math.max(6, 150 - h2 - 82)}" fill="#ffd98a"/>
          </g></g>

          <!-- varmeflimmer -->
          <g class="varme" fill="#ffb066">
            <circle cx="150" cy="140" r="3"/><circle cx="180" cy="136" r="2.4"/><circle cx="212" cy="141" r="3"/>
          </g>

          <!-- emnet som vokser, og platen -->
          <rect class="emne" x="150" y="${150 - h2}" width="62" height="${h2}" rx="3" fill="#8fd3ff" opacity=".85"/>
          <rect class="emne" x="162" y="${150 - h2}" width="38" height="${Math.max(1, h2 - 8)}" rx="2" fill="#b9e3ff" opacity=".5"/>
          <rect x="120" y="150" width="122" height="8" rx="3" fill="#c9d4e6"/>
          <rect x="112" y="158" width="138" height="6" rx="3" fill="#54627a"/>

          <!-- filamentspolen -->
          <g transform="translate(318 74)">
            <g class="spole">
              <circle r="26" fill="#2b3446"/><circle r="26" fill="none" stroke="#54627a" stroke-width="3"/>
              <circle r="16" fill="#ffd98a" opacity=".85"/>
              <circle r="6" fill="#1b2030"/>
              <path d="M0 -16v-10M16 0h10M0 16v10M-16 0h-10" stroke="#54627a" stroke-width="3"/>
            </g>
            <path d="M-4 20 C -24 60 -60 62 -96 62" fill="none" stroke="#ffd98a" stroke-width="2.4" opacity=".7"/>
          </g>
        </svg>
        <span class="merke">${kiK2Esc(merke)}</span>
        <div class="tekst"><b>${kiK2Esc(tekst)}</b><span>${kiK2Esc(under)}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    const kort = this.shadowRoot.querySelector(".kort");
    if (kort) kort.addEventListener("click", () => {
      const id = this._id_status() || this._id_framdrift();
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: id }, bubbles: true, composed: true }));
    });
  }
}
if (!customElements.get("ki-k2-scene-card")) customElements.define("ki-k2-scene-card", KiK2SceneCard);

class KiK2SceneCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { prefix: "Prefiks", navn: "Navn", hoyde: "Høyde", demo: "Eksempeldata" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;opacity:.6;margin:8px 2px";
      p.textContent = "Entitetene finnes ut fra prefikset. Sett framdrift, status, dyse eller seng i YAML om gjetningen bommer.";
      this.appendChild(p);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "prefix", selector: { text: {} } },
      { name: "navn", selector: { text: {} } },
      { name: "hoyde", selector: { number: { mode: "box", min: 140, max: 320 } } },
      { name: "demo", selector: { select: { mode: "dropdown", options: [
        { value: "", label: "Av" }, { value: "skriver", label: "Skriver" },
        { value: "pause", label: "Pause" }, { value: "ferdig", label: "Ferdig" }] } } },
    ];
  }
}
if (!customElements.get("ki-k2-scene-card-editor")) customElements.define("ki-k2-scene-card-editor", KiK2SceneCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-k2-scene-card")) window.customCards.push({ type: "ki-k2-scene-card", name: "KI K2 scene", description: "3D-printeren som levende bilde", preview: true });

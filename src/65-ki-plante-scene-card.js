/* ki-plante-scene-card – vinduskarmen med plantene dine, som hero over plantekortet.
 *
 * type: custom:ki-plante-scene-card
 * sted: Sebastians soverom        # ellers tas det første stedet fra KI Planter
 * hoyde: 210
 * demo: false | tort | vannet     # se kortet med eksempeldata
 * natt: false                     # tving dag- eller nattbilde
 */
const KI_PSC_VERSJON = "1.0.0";

const KI_PSC_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { position:relative; overflow:hidden; border-radius:var(--ha-card-border-radius,24px);
    background:linear-gradient(180deg,#1a2b22 0%,#14231d 60%,#111d19 100%); color:var(--gray1000);
    cursor:pointer; }
  .kort.natt { background:linear-gradient(180deg,#141a2a 0%,#111726 60%,#0e141f 100%); }
  .kort svg { position:absolute; inset:0; width:100%; height:100%; }

  /* sola som beveger seg over vinduet, og lysstriper inn i rommet */
  .sol { transform-box:fill-box; animation:pl-sol 12s ease-in-out infinite alternate; }
  @keyframes pl-sol { from { transform:translate(-16px,10px); } to { transform:translate(16px,-6px); } }
  .straale { opacity:.14; animation:pl-straale 7s ease-in-out infinite alternate; }
  .straale.s2 { animation-delay:-2.5s; } .straale.s3 { animation-delay:-4.5s; }
  @keyframes pl-straale { from { opacity:.07; } to { opacity:.2; } }

  /* bladene vaier, hver i sin takt */
  .blad { transform-box:fill-box; transform-origin:50% 100%; animation:pl-vai 5.5s ease-in-out infinite alternate; }
  .blad.b2 { animation-duration:6.8s; animation-delay:-1.4s; }
  .blad.b3 { animation-duration:7.6s; animation-delay:-3.1s; }
  .blad.b4 { animation-duration:6.2s; animation-delay:-2.2s; }
  @keyframes pl-vai { from { transform:rotate(-3deg); } to { transform:rotate(3.5deg); } }

  /* tørst plante henger litt og har lys jord */
  .plante.torst .blad { animation-duration:9s; transform-origin:50% 100%; }
  .plante.torst .krone { transform:translateY(3px) scaleY(.94); transform-box:fill-box; }
  .jord { transition:fill .8s var(--myk); }

  /* vanndråper faller på den som trenger vann */
  .draape { opacity:0; animation:pl-draape 2.6s ease-in infinite; }
  .draape.d2 { animation-delay:-.9s; } .draape.d3 { animation-delay:-1.7s; }
  @keyframes pl-draape { 0% { opacity:0; transform:translateY(-14px); } 25% { opacity:.9; }
    75% { opacity:.9; } 100% { opacity:0; transform:translateY(26px); } }

  /* støvkorn i lyset */
  .stov { animation:pl-stov linear infinite; opacity:.5; }
  @keyframes pl-stov { from { transform:translate(0,0); opacity:0; } 20% { opacity:.55; }
    to { transform:translate(-18px,-26px); opacity:0; } }

  .tekst { position:absolute; left:18px; bottom:14px; z-index:2; }
  .tekst b { display:block; font-size:19px; font-weight:600; text-shadow:0 2px 10px rgba(0,0,0,.6); }
  .tekst span { font-size:13px; opacity:.8; }
  .kort::after { content:""; position:absolute; left:0; right:0; bottom:0; height:78px; pointer-events:none;
    background:linear-gradient(180deg, rgba(10,16,14,0) 0%, rgba(10,16,14,.72) 72%, rgba(10,16,14,.86) 100%); }
  .merke { position:absolute; right:16px; top:16px; z-index:2; font-size:11px; font-weight:700;
    padding:6px 12px; border-radius:999px; background:rgba(255,255,255,.14); backdrop-filter:blur(6px); }
  .merke.torst { background:var(--orange,#f0883e); color:var(--black,#000); }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiPsEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiPlanteSceneCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-plante-scene-card-editor"); }
  static getStubConfig() { return { hoyde: 210 }; }
  getCardSize() { return 4; }

  setConfig(c) { this._c = { hoyde: 210, ...(c || {}) }; this._forrige = null; }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 300000); }
  disconnectedCallback() { clearInterval(this._i); }

  /* Plantene fra KI Planter: binærsensorene bærer alt vi trenger */
  _planter() {
    if (this._c.demo) return this._demo();
    const h = this._h; if (!h) return [];
    const sted = this._c.sted;
    return Object.keys(h.states)
      .filter((id) => {
        const a = h.states[id].attributes || {};
        if (a.integrasjon !== "ki_planter" || a.type !== "plante") return false;
        return !sted || a.sted === sted || a.sted_prefix === sted;
      })
      .map((id) => {
        const a = h.states[id].attributes || {};
        return {
          id, navn: a.navn || id, latin: a.latin, ikon: a.ikon,
          trenger: h.states[id].state === "on",
          dager_igjen: a.dager_igjen, dager_siden: a.dager_siden,
          prosent: Number(a.prosent) || 0, sesong: a.sesong,
          daglengde: a.daglengde_timer, fuktighet: a.fuktighet,
          sted: a.sted,
        };
      })
      .sort((a, b) => (a.dager_igjen ?? 99) - (b.dager_igjen ?? 99));
  }
  _demo() {
    const modus = this._c.demo;
    return [
      { id: "demo1", navn: "Arekapalme", latin: "Dypsis lutescens", trenger: modus === "tort",
        dager_igjen: modus === "tort" ? 0 : 3, prosent: modus === "tort" ? 100 : 55,
        sesong: "vekst", daglengde: 12.4 },
      { id: "demo2", navn: "Palmelilje", latin: "Yucca elephantipes", trenger: false,
        dager_igjen: 7, prosent: 30, sesong: "vekst", daglengde: 12.4 },
    ];
  }

  _mer(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  /* Én potteplante: potte, jord, stamme og blader som vaier */
  _plante(p, x, skala, farge) {
    const torst = p.trenger;
    const jord = torst ? "#6b5138" : "#3a2a1c";
    const blader = [
      { d: "M0 0 C -26 -14 -34 -36 -30 -52 C -14 -44 -2 -24 0 0 Z", kl: "" },
      { d: "M0 0 C 26 -14 34 -36 30 -52 C 14 -44 2 -24 0 0 Z", kl: "b2" },
      { d: "M0 0 C -16 -30 -12 -54 -2 -66 C 8 -54 10 -30 0 0 Z", kl: "b3" },
      { d: "M0 0 C -34 -6 -48 -20 -50 -34 C -32 -32 -14 -18 0 0 Z", kl: "b4" },
      { d: "M0 0 C 34 -6 48 -20 50 -34 C 32 -32 14 -18 0 0 Z", kl: "" },
    ];
    const draaper = torst ? [0, 1, 2].map((i) =>
      `<circle class="draape ${i ? "d" + (i + 1) : ""}" cx="${-8 + i * 9}" cy="-58" r="2.6" fill="#8fd3ff"/>`).join("") : "";
    return `<g class="plante ${torst ? "torst" : ""}" transform="translate(${x} 150) scale(${skala})">
      ${draaper}
      <g class="krone">
        ${blader.map((b, i) => `<path class="blad ${b.kl}" d="${b.d}"
          transform="translate(0 -34)" fill="${farge}" opacity="${0.72 + (i % 3) * 0.09}"/>`).join("")}
        <path d="M-2 -34 L-1 0 L1 0 L2 -34z" fill="#5b4a2e"/>
      </g>
      <path class="jord" d="M-19 0h38l-2 6h-34z" fill="${jord}"/>
      <path d="M-22 4h44l-6 30h-32z" fill="#b5754a"/>
      <path d="M-22 4h44l-1 5h-42z" fill="#c98a5c"/>
    </g>`;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const planter = this._planter();
    if (!planter.length) {
      const tom = `<style>${KI_PSC_STIL}</style>
        <div class="tom">Fant ingen planter fra <b>KI Planter</b>${c.sted ? ` på «${kiPsEsc(c.sted)}»` : ""}.</div>`;
      if (tom !== this._forrige) { this.shadowRoot.innerHTML = tom; this._forrige = tom; }
      return;
    }
    const torste = planter.filter((p) => p.trenger);
    const neste = planter.find((p) => !p.trenger);
    const time = c.time !== undefined ? Number(c.time) : new Date().getHours();
    const natt = c.natt !== undefined ? !!c.natt : (time < 6 || time > 21);
    const p0 = planter[0] || {};

    /* plantene settes bortover karmen, med litt ulik størrelse */
    const bredde = 360;
    const antall = Math.min(planter.length, 4);
    const farger = ["#4f9b5c", "#3f8a52", "#5aa76a", "#2f7a48"];
    const figurer = planter.slice(0, 4).map((p, i) => {
      const x = bredde / (antall + 1) * (i + 1);
      return this._plante(p, x, 0.86 + (i % 2) * 0.14, farger[i % farger.length]);
    }).join("");

    const stov = Array.from({ length: 7 }, (_, i) =>
      `<circle class="stov" cx="${90 + i * 26}" cy="${60 + (i % 4) * 14}" r="1.5" fill="#ffe9b8"
        style="animation-duration:${(9 + i * 1.6).toFixed(1)}s;animation-delay:-${(i * 1.7).toFixed(1)}s"/>`).join("");

    const tekst = torste.length
      ? `${torste.map((p) => kiPsEsc(p.navn)).join(" og ")} trenger vann`
      : neste && neste.dager_igjen !== undefined && neste.dager_igjen !== null
        ? `Neste vanning om ${neste.dager_igjen} ${neste.dager_igjen === 1 ? "dag" : "dager"}`
        : "Alt er vannet";
    const sesong = p0.sesong ? p0.sesong.replace(/^./, (x) => x.toUpperCase()) : "";
    const under = [sesong, p0.daglengde ? `${p0.daglengde} t dagslys` : "",
      `${planter.length} ${planter.length === 1 ? "plante" : "planter"}`].filter(Boolean).join(" · ");

    const html = `<style>${KI_PSC_STIL}</style>
      <div class="kort ${natt ? "natt" : ""}" style="height:${Number(c.hoyde) || 210}px"
        data-mer="${kiPsEsc((torste[0] || p0).id || "")}" role="button" tabindex="0">
        <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <!-- vinduet bak -->
          <rect x="196" y="14" width="150" height="112" rx="8" fill="${natt ? "#10192b" : "#2d4a63"}"/>
          <g class="sol">
            <circle cx="300" cy="52" r="${natt ? 13 : 17}" fill="${natt ? "#dfe7ff" : "#ffd98a"}" opacity=".9"/>
            <circle cx="300" cy="52" r="30" fill="${natt ? "#dfe7ff" : "#ffd98a"}" opacity=".14"/>
          </g>
          ${natt ? "" : `
            <path class="straale" d="M212 30 L150 200 L226 200 L262 30z" fill="#ffe9b8"/>
            <path class="straale s2" d="M262 30 L206 200 L282 200 L312 30z" fill="#ffe9b8"/>
            <path class="straale s3" d="M312 30 L268 200 L344 200 L346 30z" fill="#ffe9b8"/>`}
          <rect x="196" y="14" width="150" height="112" rx="8" fill="none" stroke="#e8eefc" stroke-width="4" opacity=".7"/>
          <path d="M271 14v112M196 70h150" stroke="#e8eefc" stroke-width="3" opacity=".5"/>
          ${natt ? "" : stov}
          <!-- karmen -->
          <path d="M0 150h360v12H0z" fill="#e8eefc" opacity=".9"/>
          <path d="M0 162h360v38H0z" fill="#cfd8ea" opacity=".25"/>
          ${figurer}
        </svg>
        <span class="merke ${torste.length ? "torst" : ""}">${torste.length ? `${torste.length} trenger vann` : "Alt i orden"}</span>
        <div class="tekst"><b>${kiPsEsc(tekst)}</b><span>${kiPsEsc(under)}</span></div>
      </div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    const kort = this.shadowRoot.querySelector(".kort");
    if (kort) kort.addEventListener("click", () => this._mer(kort.dataset.mer));
  }

  _ider() { return this._planter().map((p) => p.id); }
}
if (!customElements.get("ki-plante-scene-card")) customElements.define("ki-plante-scene-card", KiPlanteSceneCard);

class KiPlanteSceneCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { sted: "Sted", hoyde: "Høyde", demo: "Eksempeldata" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "sted", selector: { text: {} } },
      { name: "hoyde", selector: { number: { mode: "box", min: 140, max: 320 } } },
      { name: "demo", selector: { select: { mode: "dropdown", options: [
        { value: "", label: "Av" }, { value: "tort", label: "Trenger vann" },
        { value: "vannet", label: "Nylig vannet" }] } } },
    ];
  }
}
if (!customElements.get("ki-plante-scene-card-editor")) customElements.define("ki-plante-scene-card-editor", KiPlanteSceneCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-plante-scene-card")) window.customCards.push({ type: "ki-plante-scene-card", name: "KI Plantescene", description: "Vinduskarmen med plantene dine", preview: true });

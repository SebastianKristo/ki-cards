/* ki-strompris-card – døgnets priser med fanene I dag og I morgen.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-strompris-card
 * tittel: Strømpriser
 * spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # raw_today / raw_tomorrow
 * norgespris: sensor.norgespris_pris_na        # egen linje, flat hvis den mangler timedata
 * billig: 0.80        dyr: 0.85                # fargegrenser
 * hoyde: 260
 */
const KI_PRIS_VERSJON = "1.0.0";

const KI_PRIS_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { color:var(--gray1000); }
  .topp { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 2px 12px; }
  .topp h3 { margin:0; font-size:16px; font-weight:500; }
  /* samme faneskinne som ki-tabs-card */
  .faner { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
    padding:7px 16px; border-radius:999px; cursor:pointer; transition:background .2s, color .2s, transform .12s var(--fjaer); }
  .fane:hover { color:rgba(255,255,255,.95); }
  .fane:active { transform:scale(.96); }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .fane:disabled { opacity:.4; cursor:default; }
  .fane:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  .graf { position:relative; background:var(--gray200); border-radius:var(--ha-card-border-radius,24px); padding:14px 12px 8px; }
  .graf svg { width:100%; display:block; overflow:visible; }
  .rute { stroke:var(--gray300, rgba(255,255,255,.12)); stroke-width:1; }
  .akse { font-size:10px; fill:currentColor; opacity:.5; }
  .flate { opacity:0; animation:pr-flate 1.1s ease-out .35s forwards; }
  @keyframes pr-flate { to { opacity:.14; } }
  .linje { fill:none; stroke-width:3.5; stroke-linejoin:round; stroke-linecap:round;
    stroke-dasharray:var(--len,2000); stroke-dashoffset:var(--len,2000); animation:pr-tegn 1.5s var(--myk) forwards; }
  @keyframes pr-tegn { to { stroke-dashoffset:0; } }
  .nspris { fill:none; stroke:var(--yellow,#f5c542); stroke-width:2.5; stroke-dasharray:6 6; opacity:0; animation:pr-inn .6s ease-out .9s forwards; }
  @keyframes pr-inn { to { opacity:.9; } }
  .naa { stroke:#ffb581; stroke-width:2; }
  .naapunkt { fill:#ffb581; }
  .naapunkt.puls { animation:pr-puls 2.4s ease-out infinite; transform-box:fill-box; transform-origin:center; }
  @keyframes pr-puls { 0% { r:5; opacity:.9; } 100% { r:14; opacity:0; } }
  .merke { font-size:11px; font-weight:600; fill:currentColor; }
  .topplokk { fill:var(--red,#e8657a); } .bunnlokk { fill:var(--green,#7ee081); }
  .bunn { display:flex; flex-wrap:wrap; gap:8px 16px; padding:10px 4px 2px; font-size:13px; }
  .n { display:inline-flex; align-items:center; gap:7px; opacity:.85; }
  .n i { width:14px; height:3px; border-radius:2px; background:currentColor; }
  .n i.stiplet { background:repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px); }
  .n b { font-weight:600; }
  .tom { padding:26px 12px; font-size:14px; opacity:.6; text-align:center; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiPrEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiPrKr = (v, d = 2) => Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });

class KiStromprisCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "idag"; }
  static getConfigElement() { return document.createElement("ki-strompris-card-editor"); }
  static getStubConfig() { return { spot: "sensor.nordpool" }; }
  getCardSize() { return 6; }

  setConfig(c) {
    if (!c || (!c.spot && !c.norgespris)) throw new Error("Sett spot: eller norgespris:");
    this._c = { tittel: "Strømpriser", billig: 0.8, dyr: 0.85, hoyde: 260, desimaler: 2, ...c };
    this._bygget = false; this._tegn();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const ids = [c.spot, c.norgespris].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._tegn();
  }
  _st(id) { return id && this._h ? this._h.states[id] : null; }
  /* Timelista for valgt dag – raw_today / raw_tomorrow, ellers flat linje fra tilstanden */
  _timer(id, morgen) {
    const s = this._st(id); if (!s) return null;
    const a = s.attributes || {};
    const r = morgen ? (a.raw_tomorrow || a.tomorrow) : (a.raw_today || a.today);
    if (Array.isArray(r) && r.length) {
      const liste = r.map((p, i) => typeof p === "number"
        ? { t: i, v: p }
        : { t: p.start ? new Date(p.start).getHours() : i, v: typeof p.value === "number" ? p.value : parseFloat(p.value) });
      return liste.filter((p) => isFinite(p.v));
    }
    if (morgen) return null;
    const v = parseFloat(s.state);
    return isFinite(v) ? Array.from({ length: 24 }, (_, i) => ({ t: i, v })) : null;
  }
  _farge(v) { const c = this._c; return v <= c.billig ? "var(--green,#7ee081)" : v > c.dyr ? "var(--red,#e8657a)" : "var(--yellow,#f5c542)"; }

  _bygg() {
    const c = this._c;
    this.shadowRoot.innerHTML = `<style>${KI_PRIS_STIL}</style>
      <div class="kort">
        <div class="topp">
          <h3>${kiPrEsc(c.tittel)}</h3>
          <div class="faner" role="tablist">
            <button class="fane" role="tab" data-f="idag">I dag</button>
            <button class="fane" role="tab" data-f="imorgen">I morgen</button>
          </div>
        </div>
        <div class="graf"></div>
        <div class="bunn"></div>
      </div>`;
    this.shadowRoot.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => {
      if (b.disabled) return; this._fane = b.dataset.f; this._tegn(true);
    }));
    this._bygget = true;
  }

  _tegn(bytte) {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, morgen = this._fane === "imorgen";
    const spot = c.spot ? this._timer(c.spot, morgen) : null;
    const ns = c.norgespris ? this._timer(c.norgespris, morgen) : null;
    const imorgenFinnes = !!(c.spot && this._timer(c.spot, true)) || !!(c.norgespris && this._timer(c.norgespris, true));
    r.querySelectorAll(".fane").forEach((b) => {
      b.classList.toggle("valgt", b.dataset.f === this._fane);
      if (b.dataset.f === "imorgen") { b.disabled = !imorgenFinnes; b.title = imorgenFinnes ? "" : "Morgendagens priser er ikke klare"; }
    });

    const graf = r.querySelector(".graf");
    const serier = [spot, ns].filter(Boolean);
    if (!serier.length) { graf.innerHTML = `<div class="tom">${morgen ? "Morgendagens priser er ikke klare ennå." : "Ingen prisdata."}</div>`; r.querySelector(".bunn").innerHTML = ""; return; }

    /* skala */
    const alle = serier.flatMap((s) => s.map((p) => p.v));
    const lav = Math.min(...alle), hoy = Math.max(...alle);
    const pad = Math.max(0.05, (hoy - lav) * 0.25);
    const min = Math.max(0, lav - pad), maks = hoy + pad;
    const B = 660, H = c.hoyde, mv = 38, mh = 22, mt = 16, mb = 24;
    const x = (t) => mv + (t / 24) * (B - mv - mh);
    const y = (v) => mt + (1 - (v - min) / (maks - min || 1)) * (H - mt - mb);

    /* trappelinje: hver time holder verdien sin */
    const trapp = (liste) => {
      const d = [];
      liste.forEach((p, i) => { d.push(`${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`, `L${x(p.t + 1).toFixed(1)} ${y(p.v).toFixed(1)}`); });
      return d.join(" ");
    };
    const naa = new Date(), time = naa.getHours() + naa.getMinutes() / 60;
    const spotNaa = spot ? (spot.find((p) => p.t === Math.floor(time)) || spot[spot.length - 1]).v : null;
    const nsNaa = ns ? (ns.find((p) => p.t === Math.floor(time)) || ns[ns.length - 1]).v : null;
    const linjefarge = spotNaa !== null ? this._farge(spotNaa) : "var(--blue,#6ec6ff)";

    const ekstrem = spot ? [spot.reduce((a, b) => (b.v < a.v ? b : a)), spot.reduce((a, b) => (b.v > a.v ? b : a))] : [];
    const linjer = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = min + (maks - min) * f; return { v, y: y(v) }; });

    graf.innerHTML = `<svg viewBox="0 0 ${B} ${H}" role="img" aria-label="${morgen ? "Priser i morgen" : "Priser i dag"}">
      ${linjer.map((l) => `<line class="rute" x1="${mv}" y1="${l.y.toFixed(1)}" x2="${B - mh}" y2="${l.y.toFixed(1)}"/>
        <text class="akse" x="${mv - 6}" y="${(l.y + 3.5).toFixed(1)}" text-anchor="end">${kiPrKr(l.v, 1)}</text>`).join("")}
      ${[0, 6, 12, 18, 24].map((t) => `<text class="akse" x="${x(t).toFixed(1)}" y="${H - 6}" text-anchor="middle">${String(t % 24).padStart(2, "0")}</text>`).join("")}
      ${spot ? `<path class="flate" d="${trapp(spot)} L${x(24).toFixed(1)} ${y(min)} L${x(0).toFixed(1)} ${y(min)} Z" fill="${linjefarge}"/>
        <path class="linje" d="${trapp(spot)}" stroke="${linjefarge}" style="--len:${(B * 2.4).toFixed(0)}"/>` : ""}
      ${ns ? `<path class="nspris" d="${trapp(ns)}"/>` : ""}
      ${!morgen ? `<line class="naa" x1="${x(time).toFixed(1)}" y1="${mt}" x2="${x(time).toFixed(1)}" y2="${H - mb}"/>
        ${spotNaa !== null ? `<circle class="naapunkt puls" cx="${x(time).toFixed(1)}" cy="${y(spotNaa).toFixed(1)}" r="5"/>
        <circle class="naapunkt" cx="${x(time).toFixed(1)}" cy="${y(spotNaa).toFixed(1)}" r="5"/>` : ""}
        <text class="merke" x="${(x(time) + 6).toFixed(1)}" y="${(mt + 10).toFixed(1)}" fill="#ffb581">Nå</text>` : ""}
      ${ekstrem.map((p, i) => `<circle class="${i ? "topplokk" : "bunnlokk"}" cx="${x(p.t + 0.5).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4"/>
        <text class="merke" x="${x(p.t + 0.5).toFixed(1)}" y="${(y(p.v) + (i ? -10 : 16)).toFixed(1)}" text-anchor="middle">${kiPrKr(p.v, c.desimaler)}</text>`).join("")}
    </svg>`;

    const snitt = spot ? spot.reduce((a, b) => a + b.v, 0) / spot.length : null;
    r.querySelector(".bunn").innerHTML = [
      spot ? `<span class="n" style="color:${linjefarge}"><i></i><span>Spotpris${spotNaa !== null && !morgen ? ` nå <b>${kiPrKr(spotNaa, c.desimaler)} kr</b>` : ""}</span></span>` : "",
      ns ? `<span class="n" style="color:var(--yellow,#f5c542)"><i class="stiplet"></i><span>Norgespris <b>${kiPrKr(nsNaa, c.desimaler)} kr</b></span></span>` : "",
      spot ? `<span class="n"><span>Snitt <b>${kiPrKr(snitt, c.desimaler)}</b> · lavest <b>${kiPrKr(ekstrem[0].v, c.desimaler)}</b> kl. ${String(ekstrem[0].t).padStart(2, "0")} · høyest <b>${kiPrKr(ekstrem[1].v, c.desimaler)}</b> kl. ${String(ekstrem[1].t).padStart(2, "0")}</span></span>` : "",
    ].join("");
  }
}
if (!customElements.get("ki-strompris-card")) customElements.define("ki-strompris-card", KiStromprisCard);

class KiStromprisCardEditor extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { tittel: "Tittel", spot: "Spotpris (med raw_today)", norgespris: "Norgespris", billig: "Billig til og med (kr)",
        dyr: "Dyrt over (kr)", hoyde: "Høyde på grafen", desimaler: "Desimaler" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "tittel", selector: { text: {} } },
      { name: "spot", selector: { entity: { domain: ["sensor"] } } },
      { name: "norgespris", selector: { entity: { domain: ["sensor"] } } },
      { name: "billig", selector: { number: { mode: "box", step: "any" } } },
      { name: "dyr", selector: { number: { mode: "box", step: "any" } } },
      { name: "hoyde", selector: { number: { mode: "box", min: 120, max: 500 } } },
      { name: "desimaler", selector: { number: { mode: "box", min: 0, max: 4 } } },
    ];
  }
}
if (!customElements.get("ki-strompris-card-editor")) customElements.define("ki-strompris-card-editor", KiStromprisCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-strompris-card")) window.customCards.push({ type: "ki-strompris-card", name: "KI Strømpris", description: "Døgnets priser med spotpris og Norgespris, i dag og i morgen", preview: true });

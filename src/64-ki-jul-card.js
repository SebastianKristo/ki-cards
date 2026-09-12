/* ki-jul-card – julelysene fra KI Lys, i samme form som julepopupen.
 *
 * type: custom:ki-jul-card
 * nedtelling: sensor.ki_jul_nedtelling   # oppdages automatisk
 * faner: [lys, automasjon]
 * automasjoner:                          # valgfritt, vises i Automasjon-fanen
 *   - {entity: automation.julelys_sla_pa_1_november, navn: Slå på, under: 1. november, ikon: mdi:calendar-arrow-right}
 */
const KI_JUL_VERSJON = "1.0.0";

const KI_JUL_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:12px; max-width:100%; }

  /* nedtellingskortet – samme oppsett som button-card-utgaven */
  .tell { position:relative; height:160px; background:var(--gray200); border-radius:var(--ha-card-border-radius,24px);
    overflow:hidden; display:grid; cursor:pointer;
    grid-template-areas:"n i" "dager maal" "merker merker" "bar bar";
    grid-template-columns:1fr min-content; grid-template-rows:min-content 1fr min-content min-content; }
  .tell .tit { grid-area:n; align-self:center; padding-left:20px; font-size:14px; opacity:.7; }
  .tell .rund { grid-area:i; justify-self:end; align-self:start; width:58px; height:58px; margin:4px;
    border-radius:50%; background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center;
    --mdc-icon-size:30px; }
  .tell .dager { grid-area:dager; align-self:end; padding-left:20px; font-size:2em; font-weight:300; line-height:1.5em; }
  .tell .dager small { font-size:14px; opacity:.7; margin-left:4px; }
  .tell .maal { grid-area:maal; justify-self:end; align-self:end; font-size:14px; opacity:.7;
    padding:0 20px 9px 0; }
  .tell .merker { grid-area:merker; display:flex; justify-content:space-between; font-size:12px; opacity:.5;
    padding:0 20px 4px; }
  .tell .bar { grid-area:bar; height:30px; overflow:hidden; border-bottom-left-radius:34px;
    border-bottom-right-radius:34px; }
  .tell .bar i { display:block; height:30px; transition:width .6s var(--myk); }
  /* snø som daler i julesesongen */
  .sno { position:absolute; inset:0; pointer-events:none; }
  .sno i { position:absolute; top:-8px; width:4px; height:4px; border-radius:50%; background:#fff; opacity:.45;
    animation:jul-sno linear infinite; }
  @keyframes jul-sno { 0% { transform:translateY(-8px) translateX(0); opacity:0; }
    10% { opacity:.5; } 100% { transform:translateY(170px) translateX(14px); opacity:0; } }

  /* to fliser: sesong og antall tent */
  .fliser { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .flis { position:relative; height:160px; background:var(--gray200); border-radius:var(--ha-card-border-radius,24px);
    padding:4px 4px 12px 20px; display:grid; grid-template-areas:"n i" "verdi knapp";
    grid-template-columns:1fr min-content; grid-template-rows:min-content 1fr; cursor:pointer; }
  .flis.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .flis .tit { grid-area:n; font-size:14px; opacity:.7; align-self:center; }
  .flis .rund { grid-area:i; justify-self:end; align-self:start; width:58px; height:58px; border-radius:50%;
    background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .flis.pa .rund { background:rgba(0,0,0,.12); }
  .flis .verdi { grid-area:verdi; align-self:end; font-size:2em; font-weight:300; line-height:1.5em; }
  .flis .verdi small { font-size:14px; opacity:.7; margin-left:4px; }
  .flis .knapp { grid-area:knapp; justify-self:end; align-self:end; padding-right:10px; line-height:0;
    --mdc-icon-size:60px; color:var(--gray400); }
  .flis.pa .knapp { color:var(--black,#000); }

  /* to handlinger */
  .handlinger { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .hknapp { height:66px; background:var(--gray200); border:0; border-radius:var(--ha-card-border-radius,24px);
    color:var(--gray1000); font:inherit; display:grid; grid-template-columns:76px 1fr; align-items:center;
    cursor:pointer; text-align:left; padding:0; }
  .hknapp .rund { width:56px; height:56px; margin:0 4px; border-radius:50%; background:rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .hknapp b { font-size:16px; font-weight:500; }
  .hknapp:active { transform:scale(.98); }
`;

const KI_JUL_STIL2 = `
  /* faner, som i resten av kortene */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:13px; font-weight:500;
    padding:6px 14px; border-radius:999px; cursor:pointer; white-space:nowrap; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }

  /* overskriftsrad */
  .overskrift { display:grid; grid-template-columns:min-content min-content 1fr; align-items:center; gap:12px;
    padding:4px 0 8px; }
  .overskrift ha-icon { --mdc-icon-size:22px; }
  .overskrift b { font-size:16px; font-weight:500; white-space:nowrap; }
  .overskrift span { font-size:14px; opacity:.7; }

  /* lysrad – samme pilleform som jul_toggle */
  .rad { height:66px; border-radius:75px; background:var(--gray200); color:var(--gray1000);
    display:grid; grid-template-columns:76px 1fr min-content; grid-template-areas:"i n knapp" "i u knapp";
    align-items:center; padding:4px 20px 4px 4px; cursor:pointer; margin-bottom:8px;
    transition:background .25s var(--myk); }
  .rad.pa { background:var(--yellow); color:var(--black,#000); }
  .rad.automasjon.pa { background:var(--active-big,#ee95ff); }
  .rad.borte { opacity:.4; }
  .rad .rund { grid-area:i; width:58px; height:58px; border-radius:50%; background:rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .rad.pa .rund { background:rgba(0,0,0,.12); }
  .rad .n { grid-area:n; align-self:end; font-size:16px; font-weight:500; padding-top:4px; }
  .rad .u { grid-area:u; align-self:start; font-size:14px; opacity:.7; padding-bottom:7px; }
  .rad .knapp { grid-area:knapp; justify-self:end; line-height:0; --mdc-icon-size:50px; color:var(--gray400); }
  .rad.pa .knapp { color:var(--black,#000); }
  .tom { background:var(--gray200); border-radius:20px; padding:22px; text-align:center; font-size:13px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { * { animation:none !important; } }
`;

const kiJulEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiJulCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "lys"; }
  static getConfigElement() { return document.createElement("ki-jul-card-editor"); }
  static getStubConfig() { return { faner: ["lys", "automasjon"] }; }
  getCardSize() { return 12; }

  setConfig(c) { this._c = { faner: ["lys", "automasjon"], ...(c || {}) }; this._forrige = null; }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || this._endret(g, h)) this._tegn();
  }
  _endret(g, h) {
    const ids = [this._id(), ...this._lys(), ...(this._c.automasjoner || []).map((x) => x.entity || x)];
    return ids.filter(Boolean).some((id) => g.states[id] !== h.states[id]);
  }

  /* Nedtellingssensoren fra KI Lys */
  _id() {
    if (this._c && this._c.nedtelling) return this._c.nedtelling;
    const h = this._h; if (!h) return null;
    return Object.keys(h.states).find((x) => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_lys" && a.ki_type === "jul";
    });
  }
  _d() { const s = this._h && this._id() ? this._h.states[this._id()] : null; return s ? s.attributes : null; }
  _lys() { const d = this._d(); return (d && d.lys) || []; }
  _paa(id) { const s = this._h && this._h.states[id]; return !!s && s.state === "on"; }

  _veksle(id) {
    if (!id) return;
    if (navigator.vibrate) navigator.vibrate(10);
    const dom = String(id).split(".")[0];
    this._h.callService(dom === "automation" ? "automation" : dom, "toggle", { entity_id: id });
  }
  _alle(pa) {
    if (navigator.vibrate) navigator.vibrate(10);
    const h = this._h;
    const knapp = Object.keys(h.states).find((x) => x.startsWith("button.") && (() => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_lys" && a.ki_type === "jul_knapp" && !!a.pa === pa;
    })());
    if (knapp) return h.callService("button", "press", { entity_id: knapp });
    /* uten knappene fra integrasjonen tar vi lysene direkte */
    this._lys().forEach((x) => h.callService(String(x).split(".")[0], pa ? "turn_on" : "turn_off", { entity_id: x }));
  }
  _mer(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _nedtelling(d) {
    const jul = d.fase === "jul";
    const farge = jul ? "var(--red)" : "var(--active-big,#ee95ff)";
    const pct = Math.max(0, Math.min(100, Number(d.prosent) || 0));
    const n = Number(d.dager);
    const dagtekst = isNaN(n) ? "––" : n === 0 ? "I dag"
      : `${n}<small>${n === 1 ? "dag" : "dager"}</small>`;
    const snø = jul ? `<div class="sno">${Array.from({ length: 12 }, (_, i) =>
      `<i style="left:${(i * 8.3 + 3).toFixed(0)}%;animation-duration:${(6 + (i % 5) * 1.7).toFixed(1)}s;
        animation-delay:-${(i * 1.3).toFixed(1)}s"></i>`).join("")}</div>` : "";
    return `<div class="tell" data-mer="1" role="button" tabindex="0">
      ${snø}
      <div class="tit">${kiJulEsc(d.overskrift || "Jul")}</div>
      <div class="rund"><ha-icon icon="${jul ? "mdi:pine-tree" : "mdi:calendar-star"}"></ha-icon></div>
      <div class="dager">${dagtekst}</div>
      <div class="maal">${kiJulEsc(d.maal_dato || "")}</div>
      <div class="merker"><span>${kiJulEsc(d.fra_tekst || "")}</span><span>${Math.round(pct)}%</span>
        <span>${kiJulEsc(d.til_tekst || "")}</span></div>
      <div class="bar" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 2px,${farge} 3px,transparent 4px)">
        <i style="background:${farge};width:${pct}%"></i></div>
    </div>`;
  }

  _fliser(d) {
    const tent = Number(d.tent) || 0;
    const antall = Number(d.antall) || (d.lys || []).length;
    const pa = tent > 0;
    return `<div class="fliser">
      <div class="flis ${pa ? "pa" : ""}" data-sesong="1" role="button" tabindex="0">
        <div class="tit">Julesesong</div>
        <div class="rund"><ha-icon icon="mdi:pine-tree"></ha-icon></div>
        <div class="verdi">${pa ? "På" : "Av"}</div>
        <div class="knapp"><ha-icon icon="${pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}"></ha-icon></div>
      </div>
      <div class="flis" data-mer="1" role="button" tabindex="0">
        <div class="tit">Tent nå</div>
        <div class="rund"><ha-icon icon="mdi:string-lights"></ha-icon></div>
        <div class="verdi">${tent}<small>av ${antall}</small></div>
      </div>
    </div>`;
  }

  _handlinger() {
    return `<div class="handlinger">
      <button class="hknapp" data-alle="av"><span class="rund"><ha-icon icon="mdi:lightbulb-off-outline"></ha-icon></span><b>Alle av</b></button>
      <button class="hknapp" data-alle="pa"><span class="rund"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon></span><b>Alle på</b></button>
    </div>`;
  }

  _rad(x, klasse) {
    const pa = this._paa(x.entity);
    const st = this._h.states[x.entity];
    const borte = !st || st.state === "unavailable";
    return `<div class="rad ${klasse || ""} ${pa ? "pa" : ""} ${borte ? "borte" : ""}"
      data-veksle="${kiJulEsc(x.entity)}" role="switch" aria-checked="${pa}" tabindex="0">
      <span class="rund"><ha-icon icon="${kiJulEsc(x.ikon || "mdi:string-lights")}"></ha-icon></span>
      <span class="n">${kiJulEsc(x.navn)}</span>
      <span class="u">${kiJulEsc(x.under || "")}</span>
      <span class="knapp"><ha-icon icon="${pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}"></ha-icon></span>
    </div>`;
  }

  _panelLys(d) {
    const grupper = d.grupper || [];
    if (!grupper.length) return `<div class="tom">Ingen julelys valgt i KI Lys ennå.</div>`;
    return grupper.map((g) => `
      <div class="overskrift"><ha-icon icon="${kiJulEsc(g.ikon)}"></ha-icon><b>${kiJulEsc(g.navn)}</b>
        <span>${g.antall} stk</span></div>
      ${(g.lys || []).map((x) => this._rad({
        entity: x.entity, navn: x.navn, under: x.undertekst, ikon: g.ikon,
      })).join("")}`).join("");
  }

  _panelAutomasjon(d) {
    const c = this._c;
    let rader = c.automasjoner;
    if (!rader) {
      /* finner julens egne automasjoner selv */
      rader = Object.keys(this._h.states)
        .filter((x) => x.startsWith("automation.") && /jul/i.test(x))
        .map((x) => {
          const a = this._h.states[x].attributes || {};
          const navn = a.friendly_name || x.split(".").pop().replace(/_/g, " ");
          const m = String(navn).match(/(\d+\.?\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember))/i);
          return {
            entity: x,
            navn: (String(navn).replace(/\s*\d+\.?\s*\w+$/, "").replace(/^(varsel|julelys)\s*/i, "").trim() || navn)
              .replace(/^./, (c) => c.toUpperCase()),
            under: m ? m[1] : "Automasjon",
            ikon: /varsel|påminn/i.test(navn) ? "mdi:bell-ring" : /av\b|slutt/i.test(navn) ? "mdi:calendar-remove" : "mdi:calendar-arrow-right",
          };
        });
    } else {
      rader = rader.map((x) => (typeof x === "string" ? { entity: x } : x)).map((x) => ({
        ...x, navn: x.navn || (this._h.states[x.entity] || { attributes: {} }).attributes.friendly_name || x.entity,
      }));
    }
    if (!rader.length) return `<div class="tom">Fant ingen juleautomasjoner.</div>`;
    return `<div class="overskrift"><ha-icon icon="mdi:calendar-sync-outline"></ha-icon><b>Sesong</b>
        <span>${kiJulEsc(d.sesong_fra || "")} – ${kiJulEsc(d.sesong_til || "")}</span></div>
      ${rader.map((x) => this._rad(x, "automasjon")).join("")}`;
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const d = this._d();
    if (!d) {
      const tom = `<style>${KI_JUL_STIL}${KI_JUL_STIL2}</style>
        <div class="tom">Fant ingen julelys fra <b>KI Lys</b>. Slå på julelysdelen i integrasjonen.</div>`;
      if (tom !== this._forrige) { this.shadowRoot.innerHTML = tom; this._forrige = tom; }
      return;
    }
    const faner = [].concat(c.faner || ["lys", "automasjon"]);
    const navn = { lys: "Lys", automasjon: "Automasjon" };
    const html = `<style>${KI_JUL_STIL}${KI_JUL_STIL2}</style>
      <div class="rot">
        ${this._nedtelling(d)}
        ${this._fliser(d)}
        ${this._handlinger()}
        ${faner.length > 1 ? `<div class="faner"><div class="skinne">${faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        <div class="panel">${this._fane === "automasjon" ? this._panelAutomasjon(d) : this._panelLys(d)}</div>
      </div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    this._kobl();
  }

  _kobl() {
    const r = this.shadowRoot;
    r.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      this._fane = b.dataset.f; this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-veksle]").forEach((el) => {
      const slaa = () => {
        /* snu med en gang – tilstanden kommer tilbake fra Home Assistant like etter */
        const pa = !el.classList.contains("pa");
        el.classList.toggle("pa", pa);
        el.setAttribute("aria-checked", String(pa));
        el.querySelector(".knapp ha-icon").setAttribute("icon", pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off");
        this._veksle(el.dataset.veksle);
      };
      el.addEventListener("click", slaa);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); slaa(); } });
    });
    r.querySelectorAll("[data-alle]").forEach((b) => b.addEventListener("click", () => this._alle(b.dataset.alle === "pa")));
    const sesong = r.querySelector("[data-sesong]");
    if (sesong) sesong.addEventListener("click", () => this._alle(!sesong.classList.contains("pa")));
    r.querySelectorAll("[data-mer]").forEach((el) => el.addEventListener("click", () => this._mer(this._id())));
  }
}
if (!customElements.get("ki-jul-card")) customElements.define("ki-jul-card", KiJulCard);

class KiJulCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { nedtelling: "Nedtellingssensor", faner: "Faner" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;opacity:.6;margin:8px 2px";
      p.textContent = "Lysene og gruppene kommer fra KI Lys. Egne automasjonsrader settes i YAML.";
      this.appendChild(p);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "nedtelling", selector: { entity: { domain: "sensor" } } },
      { name: "faner", selector: { select: { multiple: true, mode: "list",
        options: [{ value: "lys", label: "Lys" }, { value: "automasjon", label: "Automasjon" }] } } },
    ];
  }
}
if (!customElements.get("ki-jul-card-editor")) customElements.define("ki-jul-card-editor", KiJulCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-jul-card")) window.customCards.push({ type: "ki-jul-card", name: "KI Jul", description: "Julelys, nedtelling og sesong", preview: true });

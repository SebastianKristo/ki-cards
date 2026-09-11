/* ki-sensor-card – universelt sensorkort i universal_sensor_ny-stilen, med levende bakgrunn.
 * Del av ki-cards-bundelen; ingen avhengigheter til KI-hjelperne og kan også brukes alene.
 *
 * type: custom:ki-sensor-card
 * entity: sensor.strommaler_effekt
 * navn: Forbruk nå            # undertekst (sub_text)
 * ikon: mdi:home-lightning-bolt
 * enhet: W                    # standard: enheten til sensoren
 * desimaler: 0                # standard: 0 for W, 1 ellers
 * storrelse: stor             # stor (160px) | liten (66px)
 * animasjon: auto             # auto | soyler | boelge | puls | ingen
 * maks: 4000                  # referanse for animasjon/stolpe (standard fra enheten)
 * alt: sensor.x | tekst       # høyrestilt tilleggstekst
 * stolpe: false               # tynn framdriftsstolpe nederst
 * nivaa:                      # farger over gitte verdier
 *   - over: 3000
 *     farge: var(--red)
 */
const KI_SENSOR_VERSJON = "1.1.0";

const KI_SENSOR_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--sk-bg,var(--gray200)); color:var(--sk-fg,var(--gray1000));
    -webkit-tap-highlight-color:transparent; cursor:pointer;
    transition:background .5s var(--myk), color .35s, transform .15s var(--fjaer); }
  .kort:active { transform:scale(.985); }
  .kort:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* stor */
  .kort.stor { height:160px; padding:20px; display:grid; grid-template-areas:"i i i" "n n n" "l l alt";
    grid-template-columns:1fr 1fr min-content; grid-template-rows:1fr min-content min-content; }
  .kort.stor .ic { grid-area:i; justify-self:start; align-self:start; translate:-10px -10px; }
  .kort.stor .n { grid-area:n; align-self:end; padding-top:10px; }
  .kort.stor .v { grid-area:l; align-self:end; font-size:2em; line-height:1.2em; font-weight:300; }
  .kort.stor .alt { grid-area:alt; justify-self:end; align-self:end; margin-bottom:-12px; }

  /* liten */
  .kort.liten { height:66px; display:grid; grid-template-areas:"i l" "i n"; grid-template-columns:76px 1fr; grid-template-rows:1fr 1fr; }
  .kort.liten .ic { grid-area:i; justify-self:start; align-self:start; margin:4px; width:56px; height:56px; }
  .kort.liten .ic ha-icon { --mdc-icon-size:30px; }
  .kort.liten .v { grid-area:l; align-self:end; font-size:16px; font-weight:500; line-height:1.2em; }
  .kort.liten .n { grid-area:n; align-self:start; padding-top:2px; }
  .kort.liten .alt { display:none; }

  .ic { position:relative; z-index:2; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:rgba(250,251,252,.1); border:1px solid rgba(250,251,252,.1); }
  .ic ha-icon { --mdc-icon-size:30px; }
  .ic .ring { position:absolute; inset:-1px; border-radius:50%; border:1.5px solid currentColor; opacity:0; }
  .kort.puls .ic .ring { animation:ring var(--takt,2.6s) ease-out infinite; }
  .kort.puls .ic .r2 { animation-delay:calc(var(--takt,2.6s) / 2); }
  @keyframes ring { 0% { transform:scale(.85); opacity:.5; } 100% { transform:scale(1.9); opacity:0; } }

  .n, .v, .alt { position:relative; z-index:2; min-width:0; }
  .n { font-size:14px; font-weight:500; opacity:.7; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .v { white-space:nowrap; }
  .v .enhet { font-size:14px; font-weight:500; opacity:.7; margin-left:2px; }
  .kort.stor .v.tekst { font-size:1.35em; line-height:1.15em; white-space:normal; overflow:hidden;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .kort.liten .v.tekst { font-size:14px; overflow:hidden; text-overflow:ellipsis; }
  .v b { font-weight:inherit; display:inline-block; }
  .v b.ny { animation:tall .45s var(--myk) both; }
  @keyframes tall { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  .alt { font-size:14px; font-weight:500; opacity:.7; white-space:nowrap; }

  .merke { position:absolute; z-index:3; right:0; top:0; width:9px; height:9px; border-radius:50%; background:var(--merke,var(--red)); }
  .merke::after { content:""; position:absolute; inset:0; border-radius:50%; background:inherit; animation:merkepuls 2s ease-out infinite; }
  @keyframes merkepuls { 0% { transform:scale(1); opacity:.7; } 100% { transform:scale(2.6); opacity:0; } }

  .stolpe { position:absolute; z-index:2; left:20px; right:20px; bottom:10px; height:4px; border-radius:2px; background:rgba(250,251,252,.12); overflow:hidden; }
  .stolpe i { display:block; height:100%; border-radius:2px; background:currentColor; opacity:.75; width:0; transition:width .9s var(--myk); }
  .kort.liten .stolpe { left:76px; right:12px; bottom:6px; }

  /* levende bakgrunn */
  .bakgrunn { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
  .bakgrunn svg { position:absolute; inset:0; width:100%; height:100%; }
  .glod { position:absolute; right:-30%; bottom:-60%; width:90%; padding-bottom:90%; border-radius:50%;
    background:radial-gradient(circle, currentColor 0%, transparent 65%); opacity:0; transition:opacity 1.2s ease; }
  .kort.lever .glod { opacity:calc(.05 + var(--niva,0) * .13); }

  /* søyler */
  .soyler { position:absolute; right:16px; bottom:0; display:flex; align-items:flex-end; gap:5px; height:78%; }
  .kort.liten .soyler { right:10px; height:62%; gap:4px; }
  .soyler i { width:6px; border-radius:3px 3px 0 0; background:currentColor; opacity:.16; height:14%;
    transform-origin:50% 100%; transition:opacity .6s ease; }
  .kort.liten .soyler i { width:4px; }
  .kort.lever .soyler i { opacity:calc(.12 + var(--niva,0) * .22); animation:hopp var(--takt,1.4s) ease-in-out infinite alternate; }
  .soyler i:nth-child(1) { animation-delay:-.1s; --h:.55; } .soyler i:nth-child(2) { animation-delay:-.5s; --h:.9; }
  .soyler i:nth-child(3) { animation-delay:-.3s; --h:.7; }  .soyler i:nth-child(4) { animation-delay:-.8s; --h:1; }
  .soyler i:nth-child(5) { animation-delay:-.2s; --h:.75; } .soyler i:nth-child(6) { animation-delay:-.6s; --h:.95; }
  .soyler i:nth-child(7) { animation-delay:-.4s; --h:.6; }
  @keyframes hopp { from { transform:scaleY(1); } to { transform:scaleY(calc(1 + var(--h,1) * var(--niva,0) * 5.5)); } }

  /* bølge */
  .boelge { position:absolute; left:0; right:0; bottom:0; height:100%; transform:translateY(calc((1 - var(--niva,0)) * 100%));
    transition:transform 1.4s var(--myk); }
  .boelge .fyll { position:absolute; left:0; right:0; top:14px; bottom:-40px; background:currentColor; opacity:.1; }
  .boelge svg { position:absolute; left:0; right:0; top:0; height:18px; width:200%; opacity:.14; }
  .kort.lever .boelge svg { animation:skli 7s linear infinite; }
  .kort.lever .boelge svg.b2 { animation-duration:11s; animation-direction:reverse; opacity:.08; }
  @keyframes skli { from { transform:translateX(0); } to { transform:translateX(-50%); } }

  .feil { padding:16px; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiSensorEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_SENSOR_MAKS = { W: 4000, kW: 4, Wh: 4000, kWh: 25, MWh: 1, "%": 100, "°C": 30, A: 32, V: 250, ppm: 1500, "µg/m³": 50 };

class KiSensorCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-sensor-card-editor"); }
  static getStubConfig() { return { entity: "sensor.strommaler_effekt", navn: "Forbruk nå", ikon: "mdi:home-lightning-bolt" }; }

  setConfig(c) {
    if (!c || !c.entity) throw new Error("entity mangler");
    const liten = c.storrelse === "liten" || c.size === "small" || c.size === "liten";
    this._c = { animasjon: "auto", ikon: "mdi:flash", stolpe: false, nivaa: [], ...c, storrelse: liten ? "liten" : "stor" };
    this._bygget = false; this._sisteVerdi = null; this.innerHTML = "";
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._oppdater();
  }
  set hass(h) { this._h = h; this._oppdater(); }
  get hass() { return this._h; }
  getCardSize() { return this._c && this._c.storrelse === "liten" ? 1 : 3; }

  _st() { return this._h && this._h.states[this._c.entity]; }

  /* Tallverdi, enhet, maks og hvilken animasjon som passer */
  _les() {
    const s = this._st(), a = (s && s.attributes) || {}, c = this._c;
    /* bare rene tall regnes som tallverdi – «12 dager» er tekst */
    const rå = String(s ? s.state : "").trim();
    const tall = /^-?\d+([.,]\d+)?$/.test(rå) ? parseFloat(rå.replace(",", ".")) : NaN;
    const enhet = c.enhet !== undefined ? c.enhet : (a.unit_of_measurement || "");
    const desimaler = c.desimaler !== undefined ? c.desimaler
      : (!isFinite(tall) ? 0 : /^(W|Wh|VA|ppm|lx|A|V)$/.test(enhet) || Math.abs(tall) >= 1000 ? 0 : 1);
    const maks = c.maks || KI_SENSOR_MAKS[enhet] || (isFinite(tall) ? Math.max(Math.abs(tall) * 1.6, 1) : 1);
    let anim = c.animasjon;
    if (anim === "auto") anim = /Wh$/.test(enhet) || a.state_class === "total_increasing" ? "boelge"
      : /^(W|kW|VA|A)$/.test(enhet) ? "soyler" : "puls";
    return { s, tall, enhet, desimaler, maks, anim, niva: isFinite(tall) ? Math.min(1, Math.max(0, Math.abs(tall) / maks)) : 0 };
  }

  /* Tekst for høyrestilt felt: entitet hvis det finnes, ellers rå tekst */
  _alt() {
    const v = this._c.alt; if (!v) return "";
    const s = this._h && this._h.states[v];
    if (!s) return String(v);
    const e = s.attributes.unit_of_measurement;
    return s.state + (e ? " " + e : "");
  }

  _nivaaFarge(tall) {
    let treff = null;
    for (const n of this._c.nivaa || []) {
      if (n.over !== undefined && tall > n.over) treff = n;
      else if (n.under !== undefined && tall < n.under) treff = n;
    }
    return treff;
  }

  _bygg(anim) {
    const c = this._c;
    const boelge = `<svg viewBox="0 0 240 18" preserveAspectRatio="none"><path d="M0 9 Q30 0 60 9 T120 9 T180 9 T240 9 V18 H0 Z" fill="currentColor"/></svg>`;
    this.shadowRoot.innerHTML = `<style>${KI_SENSOR_STIL}</style>
      <div class="kort ${c.storrelse} ${anim}" role="button" tabindex="0">
        <div class="bakgrunn">
          <div class="glod"></div>
          ${anim === "soyler" ? `<div class="soyler">${"<i></i>".repeat(7)}</div>` : ""}
          ${anim === "boelge" ? `<div class="boelge"><div class="fyll"></div>${boelge}${boelge.replace("<svg", '<svg class="b2"')}</div>` : ""}
        </div>
        <div class="ic"><ha-icon icon="${kiSensorEsc(c.ikon)}"></ha-icon>${anim === "puls" ? `<i class="ring"></i><i class="ring r2"></i>` : ""}</div>
        <div class="n"></div>
        <div class="v"></div>
        <div class="alt"></div>
        ${c.stolpe ? `<div class="stolpe"><i></i></div>` : ""}
        <div class="merke" hidden></div>
      </div>`;
    const k = this.shadowRoot.querySelector(".kort");
    const aapne = () => this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: c.entity }, bubbles: true, composed: true }));
    k.addEventListener("click", aapne);
    k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aapne(); } });
    this._bygget = true; this._anim = anim;
  }

  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const s = this._st();
    if (!s) {
      this._bygget = false;
      this.shadowRoot.innerHTML = `<style>${KI_SENSOR_STIL}</style><div class="feil">Fant ikke ${kiSensorEsc(c.entity)}.</div>`;
      return;
    }
    const d = this._les();
    if (!this._bygget || this._anim !== d.anim) this._bygg(d.anim);
    const r = this.shadowRoot, k = r.querySelector(".kort");
    const ukjent = !isFinite(d.tall) || s.state === "unavailable" || s.state === "unknown";

    /* verdi + enhet, med rulleanimasjon når tallet endrer seg */
    const kart = c.tekst || {};
    const rå = String(s.state);
    const tekst = c.verdi !== undefined ? String(c.verdi)
      : kart[rå] !== undefined ? String(kart[rå])
      : s.state === "unavailable" || s.state === "unknown" ? "–"
      : !isFinite(d.tall) ? rå                              /* tekstverdi: vis den som den er */
      : d.tall.toLocaleString("nb-NO", { minimumFractionDigits: d.desimaler, maximumFractionDigits: d.desimaler });
    const vEl = r.querySelector(".v");
    if (this._sisteVerdi !== tekst) {
      const ny = this._sisteVerdi !== null;
      const erTekst = !isFinite(d.tall) || c.verdi !== undefined || kart[rå] !== undefined;
      vEl.classList.toggle("tekst", erTekst && tekst.length > 6);
      vEl.innerHTML = `<b>${kiSensorEsc(tekst)}</b>${d.enhet && !ukjent && !erTekst ? `<span class="enhet">${kiSensorEsc(d.enhet)}</span>` : ""}`;
      if (ny) { const b = vEl.querySelector("b"); void b.offsetWidth; b.classList.add("ny"); }
      this._sisteVerdi = tekst;
    }

    const navn = c.navn ?? c.sub_text ?? s.attributes.friendly_name ?? "";
    const nEl = r.querySelector(".n"); if (nEl.textContent !== navn) nEl.textContent = navn;
    const alt = this._alt(); const aEl = r.querySelector(".alt");
    if (aEl.textContent !== alt) aEl.textContent = alt;

    /* nivåfarge overstyrer bakgrunn/tekst */
    const n = ukjent ? null : this._nivaaFarge(d.tall);
    k.style.setProperty("--sk-bg", (n && n.bakgrunn) || c.bakgrunn || "var(--gray200)");
    k.style.setProperty("--sk-fg", (n && n.farge) || c.tekstfarge || "var(--gray1000)");
    k.style.setProperty("--niva", ukjent ? 0 : d.niva.toFixed(3));
    /* rask puls ved høyt forbruk, rolig ved lavt */
    k.style.setProperty("--takt", (d.anim === "soyler" ? (1.9 - d.niva * 1.2) : (3.4 - d.niva * 1.6)).toFixed(2) + "s");
    k.classList.toggle("lever", !ukjent && d.niva > 0.005);

    const st = r.querySelector(".stolpe i"); if (st) st.style.width = (ukjent ? 0 : d.niva * 100).toFixed(1) + "%";
    const m = r.querySelector(".merke");
    const varsel = (n && n.merke) || (c.merke_over !== undefined && !ukjent && d.tall > c.merke_over);
    m.hidden = !varsel;
    if (varsel) m.style.setProperty("--merke", (n && n.farge) || c.merke_farge || "var(--red)");
  }
}
if (!customElements.get("ki-sensor-card")) customElements.define("ki-sensor-card", KiSensorCard);

class KiSensorCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { entity: "Sensor", navn: "Undertekst", ikon: "Ikon", enhet: "Enhet (tom = fra sensoren)", desimaler: "Desimaler",
        storrelse: "Størrelse", animasjon: "Animasjon", maks: "Maksverdi for animasjon", alt: "Tilleggstekst (entitet eller tekst)", stolpe: "Vis stolpe" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "entity", required: true, selector: { entity: { domain: ["sensor", "input_number", "number", "counter"] } } },
      { name: "navn", selector: { text: {} } },
      { name: "ikon", selector: { icon: {} } },
      { name: "storrelse", selector: { select: { mode: "dropdown", options: [{ value: "stor", label: "Stor" }, { value: "liten", label: "Liten" }] } } },
      { name: "animasjon", selector: { select: { mode: "dropdown", options: [
        { value: "auto", label: "Auto" }, { value: "soyler", label: "Søyler" }, { value: "boelge", label: "Bølge" }, { value: "puls", label: "Puls" }, { value: "ingen", label: "Ingen" }] } } },
      { name: "maks", selector: { number: { mode: "box", min: 0, step: "any" } } },
      { name: "enhet", selector: { text: {} } },
      { name: "desimaler", selector: { number: { mode: "box", min: 0, max: 4 } } },
      { name: "alt", selector: { text: {} } },
      { name: "stolpe", selector: { boolean: {} } },
    ];
  }
}
if (!customElements.get("ki-sensor-card-editor")) customElements.define("ki-sensor-card-editor", KiSensorCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sensor-card")) window.customCards.push({ type: "ki-sensor-card", name: "KI Sensor", description: "Sensorkort med levende bakgrunn – søyler, bølge eller puls", preview: true });

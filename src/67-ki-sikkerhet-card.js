/* ki-sikkerhet-card – hele sikkerhetspanelet i ett kort.
 *
 * Leser samme `zones:`-struktur som ki-alarm-card, så sonene settes opp én gang og
 * brukes i begge kortene. Huset tegnes i SVG og reagerer på tilstanden: skjoldet
 * pulserer når alarmen er på, vinduer og dører lyser når de står åpne, en radarvifte
 * sveiper når noe beveger seg, og hele huset blinker rødt når alarmen har gått.
 *
 * type: custom:ki-sikkerhet-card
 * entity: alarm_control_panel.alarm
 * navn: Hjemme                 # valgfri overskrift
 * zones: …                     # samme liste som ki-alarm-card
 * batteri_grense: 20           # varsler under denne prosenten (0 = av)
 * kompakt: false               # lavere hus, for smale popuper
 * tastatur:                    # ki-alarm-card bakes inn under huset
 *   code_length: 6             # false slår det av og gir bare huset
 *   arm_requires_code: true
 */
const KI_SIK_VERSJON = "1.0.0";

const KI_SIK_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); --fjaer:cubic-bezier(.3,1.35,.5,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }

  .kort { position:relative; overflow:hidden; isolation:isolate;
    border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000);
    display:grid; gap:14px; padding:18px 18px 16px;
    transition:background .7s var(--myk); }
  .kort::before { content:""; position:absolute; inset:-40% -20% auto -20%; height:150%; z-index:-1;
    background:radial-gradient(ellipse at 50% 0%, var(--tone,#5ad18b) 0%, transparent 62%);
    opacity:.20; transition:opacity .7s var(--myk), background .7s var(--myk); }
  .kort.utrygg::before { opacity:.30; }
  .kort.alarm::before { opacity:.42; animation:kiSikBlink 1.1s steps(1,end) infinite; }
  @keyframes kiSikBlink { 0%,49% { opacity:.45 } 50%,100% { opacity:.12 } }

  .topp { display:flex; align-items:flex-start; gap:12px; }
  .tit { font-size:17px; font-weight:600; line-height:1.25; }
  .und { font-size:13px; opacity:.72; margin-top:2px; line-height:1.35; }
  .fyll { flex:1; }

  .skjold { width:46px; height:46px; border-radius:50%; flex:none; position:relative;
    display:flex; align-items:center; justify-content:center;
    background:var(--gray100); color:var(--gray1000);
    transition:background .5s var(--myk), color .5s var(--myk); }
  .skjold ha-icon { --mdc-icon-size:24px; }
  .skjold.pa { background:var(--tone,#5ad18b); color:rgba(20,32,26,.92); }
  .skjold.alarm { background:var(--red,#e0524a); color:#fff; }
  .skjold.pa::after, .skjold.venter::after { content:""; position:absolute; inset:-4px; border-radius:50%;
    border:2px solid var(--tone,#5ad18b); opacity:0; animation:kiSikPuls 2.4s var(--myk) infinite; }
  .skjold.alarm::after { border-color:var(--red,#e0524a); animation-duration:.9s; }
  @keyframes kiSikPuls { 0% { transform:scale(.86); opacity:.75 } 70%,100% { transform:scale(1.35); opacity:0 } }
  .skjold.venter ha-icon { animation:kiSikNikk 1.4s ease-in-out infinite; }
  @keyframes kiSikNikk { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-2px) } }

  /* ---- huset ---- */
  .scene { position:relative; width:100%; height:172px;
    --vegg-lys:color-mix(in srgb, var(--gray1000) 12%, transparent);
    --vegg-mork:color-mix(in srgb, var(--gray1000) 22%, transparent);
    --tak-lys:color-mix(in srgb, var(--gray1000) 78%, transparent);
    --tak-mork:color-mix(in srgb, var(--gray1000) 55%, transparent);
    --dor-lys:color-mix(in srgb, var(--tone,#5ad18b) 55%, var(--gray1000));
    --dor-mork:color-mix(in srgb, var(--tone,#5ad18b) 25%, var(--gray1000)); }
  .kompakt .scene { height:132px; }
  .scene svg { width:100%; height:100%; display:block; overflow:visible; }
  .scene { overflow:visible; }

  .bakke { fill:var(--gray1000); opacity:.10; }
  .vegg { stroke:var(--gray1000); stroke-opacity:.10; stroke-width:1; }
  .panel { stroke:var(--gray1000); stroke-opacity:.07; stroke-width:1.5; fill:none; }
  .takskygge { fill:var(--gray1000); opacity:.10; }
  .mone { stroke:var(--gray000,#fff); stroke-opacity:.18; stroke-width:2; stroke-linecap:round; }
  .pipe, .pipehatt { fill:var(--gray1000); opacity:.62; }

  /* røyk: bare når alt er rolig, og med litt drift */
  .roykgruppe { opacity:0; transition:opacity .8s var(--myk); }
  .kort.trygg .roykgruppe { opacity:1; }
  .roykpust { fill:none; stroke:var(--gray1000); stroke-opacity:.30; stroke-width:2.5; stroke-linecap:round;
    stroke-dasharray:40; stroke-dashoffset:40; }
  .kort.trygg .roykpust { animation:kiSikRoyk 6s ease-in-out infinite; }
  .kort.trygg .roykpust.r2 { animation-delay:3s; }
  @keyframes kiSikRoyk {
    0%   { stroke-dashoffset:40; opacity:0; transform:translateY(6px) scale(.85) }
    25%  { opacity:.6 }
    60%  { stroke-dashoffset:0 }
    100% { stroke-dashoffset:-20; opacity:0; transform:translateY(-16px) scale(1.15) }
  }

  /* vinduer */
  .rute { fill:var(--gray1000); opacity:.30; transition:fill .5s var(--myk), opacity .5s var(--myk); }
  .karm { fill:none; stroke:var(--gray000,#fff); stroke-opacity:.16; stroke-width:1.5; }
  .sprosse { stroke:var(--gray000,#fff); stroke-opacity:.14; stroke-width:1.2; fill:none; }
  .sale { fill:var(--gray000,#fff); opacity:.10; }
  .skinn { fill:var(--orange,#f0a952); opacity:.18; filter:blur(1px); }
  .vindu.apen .rute { fill:var(--orange,#f0a952); opacity:.95; }
  .vindu.apen { animation:kiSikTenn .5s var(--fjaer) both; animation-delay:var(--d,0s); }
  .vindu.apen .skinn { animation:kiSikFlimmer 3.4s ease-in-out infinite; animation-delay:var(--d,0s); }
  @keyframes kiSikTenn { from { opacity:.2; transform:scale(.94) } to { opacity:1; transform:none } }
  @keyframes kiSikFlimmer { 0%,100% { opacity:.14 } 50% { opacity:.30 } }

  /* lampe over døra */
  .lampearm, .lampeskjerm { stroke:var(--gray1000); stroke-opacity:.55; stroke-width:1.5; fill:none; }
  .lampeglo { opacity:0; transition:opacity .6s var(--myk); }
  .lampe.tent .lampeglo { opacity:1; animation:kiSikFlimmer 4.2s ease-in-out infinite; }
  .lampe.tent .lampeskjerm { fill:var(--orange,#f0a952); fill-opacity:.5; }

  /* dør */
  .dorkarm { fill:var(--gray000,#fff); opacity:.10; }
  .dorfyll { fill:var(--gray000,#fff); opacity:.10; }
  .handtak { fill:var(--gray000,#fff); opacity:.5; }
  .dorblad { transform-box:fill-box; transform-origin:left center;
    transition:transform .6s var(--fjaer); }
  .dorgruppe.apen .dorblad { transform:scaleX(.42); }
  .dorapning { fill:var(--orange,#f0a952); opacity:0; transition:opacity .5s var(--myk); }
  .dorgruppe.apen .dorapning { opacity:.85; animation:kiSikGlo 2.4s ease-in-out infinite; }
  @keyframes kiSikGlo { 0%,100% { opacity:.75 } 50% { opacity:1 } }

  /* radar for bevegelse */
  .radar { transform-origin:var(--rx,50%) var(--ry,50%); animation:kiSikSveip 3.6s linear infinite; }
  @keyframes kiSikSveip { to { transform:rotate(360deg) } }
  .radarvifte { fill:var(--blue,#6ec6ff); opacity:.22; }
  .radarring { fill:none; stroke:var(--blue,#6ec6ff); stroke-opacity:.30; stroke-width:1.5; }
  .radarring.puls { transform-origin:160px 108px; animation:kiSikRing 3.6s ease-out infinite; }
  @keyframes kiSikRing { 0% { transform:scale(.4); stroke-opacity:.5 } 100% { transform:scale(1.06); stroke-opacity:0 } }

  /* nedtelling ved på-/avkobling */
  .tellering { fill:none; stroke:var(--yellow,#f5c542); stroke-width:3; stroke-linecap:round;
    stroke-dasharray:5 10; animation:kiSikRull 1.8s linear infinite; }
  @keyframes kiSikRull { to { stroke-dashoffset:-30 } }

  /* sirenebuer */
  .sirene { fill:none; stroke:var(--red,#e0524a); stroke-width:3; stroke-linecap:round; opacity:0;
    transform-origin:160px 84px; }
  .kort.alarm .sirene { animation:kiSikSirene 1.3s ease-out infinite; }
  .kort.alarm .sirene:nth-child(2), .kort.alarm .sirene:nth-child(5) { animation-delay:.18s; }
  .kort.alarm .sirene:nth-child(3), .kort.alarm .sirene:nth-child(6) { animation-delay:.36s; }
  @keyframes kiSikSirene { 0% { opacity:0; transform:scale(.55) } 45% { opacity:.85 } 100% { opacity:0; transform:scale(1.2) } }

  /* ---- brikker ---- */
  .hero { display:grid; gap:14px; }
  .tastatur:not(:empty) { margin-top:2px; padding-top:14px;
    border-top:1px solid color-mix(in srgb, var(--gray1000) 12%, transparent); }
  .brikker { display:flex; flex-wrap:wrap; gap:8px; }
  .brikke { display:flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:999px;
    background:var(--gray100); color:var(--gray1000); font-size:13px; font-weight:600;
    border:0; font-family:inherit; cursor:pointer; opacity:.62;
    transition:opacity .2s, transform .08s ease, background .3s; }
  .brikke:active { transform:scale(.96); }
  .brikke ha-icon { --mdc-icon-size:17px; }
  .brikke.pa { opacity:1; }
  .brikke.varsel { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); opacity:1; }
  .brikke.fare   { background:var(--red,#e0524a); color:#fff; opacity:1; }
  .brikke.rolig  { background:var(--tone,#5ad18b); color:rgba(20,32,26,.92); opacity:1; }
  .brikke[aria-expanded="true"] { outline:2px solid var(--gray1000); outline-offset:-2px; }

  .liste { display:grid; gap:2px; background:var(--gray100); border-radius:16px; padding:6px;
    animation:kiSikInn .28s var(--fjaer); }
  @keyframes kiSikInn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }
  .rad { display:flex; align-items:center; gap:10px; min-height:42px; padding:0 10px; border-radius:12px;
    cursor:pointer; font-size:14px; }
  .rad:active { background:var(--gray200); }
  .rad ha-icon { --mdc-icon-size:20px; opacity:.75; flex:none; }
  .rad .navn { flex:1; font-weight:500; }
  .rad .verdi { font-size:13px; opacity:.65; white-space:nowrap; }
  .rad .verdi.pa { opacity:1; font-weight:600; }
  .tom { font-size:13px; opacity:.6; padding:10px; }

  @media (prefers-reduced-motion: reduce) {
    .kort::before, .skjold::after, .skjold ha-icon, .vindu.apen, .vindu.apen .skinn,
    .lampe.tent .lampeglo, .dorgruppe.apen .dorapning, .radar, .radarring.puls,
    .sirene, .tellering, .roykpust, .liste { animation:none !important; }
    .dorblad { transition:none; }
  }
`;

const KI_SIK_PA = new Set(["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass"]);
const KI_SIK_VENTER = new Set(["arming", "pending"]);
const KI_SIK_NAVN = {
  disarmed: "Avslått", armed_home: "På – hjemme", armed_away: "På – borte",
  armed_night: "På – natt", armed_vacation: "På – ferie", armed_custom_bypass: "På – tilpasset",
  arming: "Kobler på", pending: "Teller ned", triggered: "Alarm utløst",
  unavailable: "Utilgjengelig", unknown: "Ukjent",
};

class KiSikkerhetCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._apen = null; }
  static getStubConfig() { return { entity: "alarm_control_panel.alarm", zones: [] }; }
  getCardSize() { return this._c && this._c.tastatur ? 10 + (this._c.zones || []).length * 2 : 4; }
  getGridOptions() {
    // Ingen fast høyde: med tastatur bygger kortet seg langt nedover, og en låst
    // radhøyde klipper bunnen av.
    const rader = this._c && this._c.tastatur ? 12 + (this._c.zones || []).length * 2 : 5;
    return { columns: 12, rows: "auto", min_rows: rader };
  }

  setConfig(c) {
    if (!c || !c.entity) throw new Error("Sett entity: til alarmpanelet");
    this._c = { navn: "Sikkerhet", batteri_grense: 20, kompakt: false, tastatur: true, zones: [], ...c };
    this._bygget = false;
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    if (!g || this._ids().some((id) => g.states[id] !== h.states[id])) this._tegn();
  }

  _ids() {
    const ut = [this._c.entity];
    for (const s of this._c.zones || []) for (const i of s.items || []) {
      if (i.entity) ut.push(i.entity);
      if (i.battery) ut.push(i.battery);
    }
    return ut;
  }

  /* En sone-oppføring gjort om til noe kortet kan vise */
  _les(sone, i) {
    const st = this._h.states[i.entity];
    if (!st) return null;
    const s = st.state;
    const aktiv = sone.kind === "lock"
      ? s !== "locked"                       // ulåst, låser opp, eller jammed
      : s === "on" || s === "open" || s === "detected";
    const bat = i.battery ? Number(this._h.states[i.battery] && this._h.states[i.battery].state) : NaN;
    return {
      entity: i.entity,
      navn: i.name || (st.attributes && st.attributes.friendly_name) || i.entity,
      aktiv,
      tekst: aktiv ? (sone.active_text || "Aktiv") : (sone.idle_text || "Rolig"),
      ikon: sone.icon || "mdi:shield-outline",
      lavt: Number.isFinite(bat) && this._c.batteri_grense > 0 && bat <= this._c.batteri_grense ? bat : null,
      utilgjengelig: s === "unavailable" || s === "unknown",
    };
  }

  _grupper() {
    const g = { opening: [], motion: [], lock: [], annet: [], lavt: [], borte: [] };
    for (const sone of this._c.zones || []) {
      const bøtte = g[sone.kind] ? sone.kind : "annet";
      for (const i of sone.items || []) {
        const r = this._les(sone, i);
        if (!r) continue;
        g[bøtte].push(r);
        if (r.lavt !== null) g.lavt.push(r);
        if (r.utilgjengelig) g.borte.push(r);
      }
    }
    return g;
  }

  _mer(id) {
    this.dispatchEvent(new CustomEvent("hass-more-info",
      { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _tegn() {
    const c = this._c, h = this._h;
    const panel = h.states[c.entity];
    const st = panel ? panel.state : "unavailable";
    const paa = KI_SIK_PA.has(st), venter = KI_SIK_VENTER.has(st), alarm = st === "triggered";

    const g = this._grupper();
    const apne = g.opening.filter((r) => r.aktiv);
    const rorer = g.motion.filter((r) => r.aktiv);
    const ulast = g.lock.filter((r) => r.aktiv);
    const utrygg = apne.length + ulast.length > 0;

    const tone = alarm ? "var(--red,#e0524a)"
      : venter ? "var(--yellow,#f5c542)"
      : utrygg ? "var(--orange,#f0a952)"
      : paa ? "var(--green,#5ad18b)" : "var(--blue,#6ec6ff)";

    const und = alarm ? "Alarmen har gått"
      : venter ? (panel && panel.attributes && panel.attributes.next_state
        ? `${KI_SIK_NAVN[st]} – ${KI_SIK_NAVN[panel.attributes.next_state] || ""}`.trim() : KI_SIK_NAVN[st])
      : utrygg ? [apne.length ? `${apne.length} åpen${apne.length > 1 ? "e" : ""}` : "",
                  ulast.length ? `${ulast.length} ulåst` : ""].filter(Boolean).join(" · ")
      : paa ? "Alt lukket og låst"
      : "Alarmen er av";

    const klasse = ["kort", alarm ? "alarm" : utrygg ? "utrygg" : "trygg", c.kompakt ? "kompakt" : ""].join(" ");

    const brikke = (id, ikon, tekst, stil) => `
      <button class="brikke ${stil}" data-liste="${id}" aria-expanded="${this._apen === id}">
        <ha-icon icon="${ikon}"></ha-icon>${KI_SIK_ESC(tekst)}
      </button>`;

    const brikker = [
      brikke("apne", "mdi:door-open",
        apne.length ? `${apne.length} åpen${apne.length > 1 ? "e" : ""}` : "Alt lukket",
        apne.length ? "varsel" : "pa"),
      g.motion.length ? brikke("motion", "mdi:motion-sensor",
        rorer.length ? `Bevegelse${rorer.length > 1 ? ` (${rorer.length})` : ""}` : "Stille",
        rorer.length ? (paa ? "fare" : "pa") : "") : "",
      g.lock.length ? brikke("lock", ulast.length ? "mdi:lock-open-variant" : "mdi:lock",
        ulast.length ? `${ulast.length} ulåst` : "Låst",
        ulast.length ? "varsel" : "pa") : "",
      g.lavt.length ? brikke("lavt", "mdi:battery-alert-variant-outline",
        `${g.lavt.length} lavt batteri`, "varsel") : "",
      g.borte.length ? brikke("borte", "mdi:help-rhombus-outline",
        `${g.borte.length} uten svar`, "fare") : "",
    ].filter(Boolean).join("");

    const lister = { apne: apne.length ? apne : g.opening, motion: g.motion, lock: g.lock, lavt: g.lavt, borte: g.borte };
    const valgt = this._apen && lister[this._apen] ? lister[this._apen] : null;

    if (!this._bygget) this._bygg();

    const kort = this.shadowRoot.querySelector(".kort");
    kort.className = klasse;
    kort.style.setProperty("--tone", tone);

    this.shadowRoot.querySelector(".hero").innerHTML = `
      <div class="topp">
        <div class="fyll">
          <div class="tit">${KI_SIK_ESC(c.navn)}</div>
          <div class="und">${KI_SIK_ESC(und)}</div>
        </div>
        <div class="skjold ${alarm ? "alarm" : paa ? "pa" : venter ? "venter" : ""}" data-mer="${c.entity}"
             role="button" tabindex="0" title="${KI_SIK_ESC(KI_SIK_NAVN[st] || st)}">
          <ha-icon icon="${alarm ? "mdi:shield-alert" : paa ? "mdi:shield-check" : venter ? "mdi:shield-sync" : "mdi:shield-off-outline"}"></ha-icon>
        </div>
      </div>

      <div class="scene">${this._hus({ paa, venter, alarm, apne, rorer, ulast })}</div>

      <div class="brikker">${brikker}</div>
      ${valgt ? `<div class="liste">${this._liste(valgt)}</div>` : ""}`;

    for (const el of this.shadowRoot.querySelectorAll(".hero [data-mer]"))
      el.addEventListener("click", () => this._mer(el.dataset.mer));
    for (const el of this.shadowRoot.querySelectorAll(".hero [data-liste]"))
      el.addEventListener("click", () => {
        this._apen = this._apen === el.dataset.liste ? null : el.dataset.liste;
        this._tegn();
      });

    this._tastatur();
  }

  /* Skallet bygges én gang. Ville vi skrevet hele shadowRoot på nytt ved hver
   * tilstandsendring, hadde det innebygde tastaturet blitt laget på nytt midt i
   * inntastingen og mistet sifrene. */
  _bygg() {
    this.shadowRoot.innerHTML = `
      <style>${KI_SIK_STIL}</style>
      <ha-card>
        <div class="kort">
          <div class="hero"></div>
          <div class="tastatur"></div>
        </div>
      </ha-card>`;
    this._bygget = true;
  }

  /* ki-alarm-card settes inn under huset, uten sin egen topp (hero: false),
   * så de to framstår som ett kort. Sonene er de samme. */
  _tastatur() {
    const boks = this.shadowRoot.querySelector(".tastatur");
    if (!this._c.tastatur) { boks.innerHTML = ""; this._alarm = null; return; }
    if (!this._alarm) {
      if (!customElements.get("ki-alarm-card")) return;   // ikke lastet – hopp over
      this._alarm = document.createElement("ki-alarm-card");
      const ekstra = typeof this._c.tastatur === "object" ? this._c.tastatur : {};
      this._alarm.setConfig({
        entity: this._c.entity,
        zones: this._c.zones,
        hero: false,
        ...ekstra,
      });
      boks.appendChild(this._alarm);
    }
    this._alarm.hass = this._h;
  }

  _liste(rader) {
    if (!rader.length) return `<div class="tom">Ingenting å vise her.</div>`;
    return rader.map((r) => `
      <div class="rad" data-mer="${r.entity}">
        <ha-icon icon="${r.ikon}"></ha-icon>
        <span class="navn">${KI_SIK_ESC(r.navn)}</span>
        ${r.lavt !== null ? `<span class="verdi pa">${r.lavt} %</span>` : ""}
        <span class="verdi ${r.aktiv ? "pa" : ""}">${KI_SIK_ESC(r.utilgjengelig ? "Uten svar" : r.tekst)}</span>
      </div>`).join("");
  }

  /* Huset. Tegnet med gradienter og lag, ikke flate rektangler.
   * Vinduene tennes ett for ett av de faktisk åpne; resten står mørke. */
  _hus({ paa, venter, alarm, apne, rorer, ulast }) {
    const antApne = apne.length;
    const dorApen = ulast.length > 0 || apne.some((r) => /dør|door|inngang|veranda/i.test(r.navn));
    const id = this._uid || (this._uid = "s" + Math.random().toString(36).slice(2, 8));

    /* fire vinduer: to til venstre for døra, to til høyre */
    const V = [[104, 86], [138, 86], [196, 86], [230, 86]];
    const vindu = ([x, y], i) => {
      const lyser = i < antApne;
      return `
        <g class="vindu ${lyser ? "apen" : ""}" style="--d:${i * 0.22}s">
          ${lyser ? `<rect class="skinn" x="${x - 7}" y="${y - 7}" width="40" height="36" rx="14"></rect>` : ""}
          <rect class="rute" x="${x}" y="${y}" width="26" height="22" rx="3"></rect>
          <path class="sprosse" d="M${x + 13} ${y} V${y + 22} M${x} ${y + 11} H${x + 26}"></path>
          <rect class="karm" x="${x}" y="${y}" width="26" height="22" rx="3"></rect>
          <rect class="sale" x="${x - 2}" y="${y + 22}" width="30" height="3" rx="1.5"></rect>
        </g>`;
    };

    return `
      <svg viewBox="0 0 320 186" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="${id}vegg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--vegg-lys)"></stop>
            <stop offset="100%" stop-color="var(--vegg-mork)"></stop>
          </linearGradient>
          <linearGradient id="${id}tak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--tak-lys)"></stop>
            <stop offset="100%" stop-color="var(--tak-mork)"></stop>
          </linearGradient>
          <radialGradient id="${id}lys">
            <stop offset="0%" stop-color="var(--orange,#f0a952)" stop-opacity=".55"></stop>
            <stop offset="100%" stop-color="var(--orange,#f0a952)" stop-opacity="0"></stop>
          </radialGradient>
          <linearGradient id="${id}dor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--dor-lys)"></stop>
            <stop offset="100%" stop-color="var(--dor-mork)"></stop>
          </linearGradient>
        </defs>

        <ellipse class="bakke" cx="160" cy="140" rx="118" ry="8"></ellipse>

        <!-- pipe -->
        <path class="pipe" d="M200 44 h15 a2 2 0 0 1 2 2 v26 h-19 v-26 a2 2 0 0 1 2 -2 z"></path>
        <rect class="pipehatt" x="197" y="40" width="23" height="5" rx="2.5"></rect>
        <g class="roykgruppe">
          <path class="roykpust" d="M208 36 q7 -7 0 -14 q-7 -7 0 -14"></path>
          <path class="roykpust r2" d="M208 36 q-7 -7 0 -14 q7 -7 0 -14"></path>
        </g>

        <!-- tak med utstikk -->
        <path class="takskygge" d="M160 24 L258 78 L62 78 Z"></path>
        <path class="tak" fill="url(#${id}tak)" d="M160 20 L256 74 a4 4 0 0 1 -2 7 L66 81 a4 4 0 0 1 -2 -7 Z"></path>
        <path class="mone" d="M160 20 L160 30"></path>

        <!-- vegg -->
        <path class="vegg" fill="url(#${id}vegg)" d="M84 78 h152 a6 6 0 0 1 6 6 v50 a4 4 0 0 1 -4 4 H82 a4 4 0 0 1 -4 -4 V84 a6 6 0 0 1 6 -6 z"></path>
        <path class="panel" d="M78 98 H242 M78 116 H242"></path>

        ${V.map(vindu).join("")}

        <!-- lampe over døra -->
        <g class="lampe ${paa || dorApen ? "tent" : ""}">
          <circle class="lampeglo" cx="160" cy="92" r="16" fill="url(#${id}lys)"></circle>
          <path class="lampearm" d="M160 84 v5"></path>
          <path class="lampeskjerm" d="M153 95 l7 -7 l7 7 z"></path>
        </g>

        <!-- dør -->
        <g class="dorgruppe ${dorApen ? "apen" : ""}">
          <rect class="dorkarm" x="146" y="96" width="28" height="42" rx="4"></rect>
          <rect class="dorapning" x="148" y="98" width="24" height="40" rx="3"></rect>
          <g class="dorblad">
            <rect class="dor" fill="url(#${id}dor)" x="148" y="98" width="24" height="40" rx="3"></rect>
            <rect class="dorfyll" x="152" y="103" width="16" height="14" rx="2"></rect>
            <circle class="handtak" cx="167" cy="118" r="1.8"></circle>
          </g>
        </g>

        ${rorer.length ? `
          <g class="radar" style="--rx:160px; --ry:108px">
            <path class="radarvifte" d="M160 108 L160 44 A64 64 0 0 1 205 63 Z"></path>
          </g>
          <circle class="radarring" cx="160" cy="108" r="64"></circle>
          <circle class="radarring puls" cx="160" cy="108" r="64"></circle>` : ""}

        ${venter ? `<circle class="tellering" cx="160" cy="80" r="74"></circle>` : ""}

        ${alarm ? `
          <g class="sirener">
            <path class="sirene" d="M264 66 a24 24 0 0 1 0 34"></path>
            <path class="sirene" d="M274 56 a38 38 0 0 1 0 54"></path>
            <path class="sirene" d="M284 46 a52 52 0 0 1 0 74"></path>
            <path class="sirene" d="M56 66 a24 24 0 0 0 0 34"></path>
            <path class="sirene" d="M46 56 a38 38 0 0 0 0 54"></path>
            <path class="sirene" d="M36 46 a52 52 0 0 0 0 74"></path>
          </g>` : ""}
      </svg>`;
  }
}

const KI_SIK_ESC = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

customElements.define("ki-sikkerhet-card", KiSikkerhetCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sikkerhet-card"))
  window.customCards.push({ type: "ki-sikkerhet-card", name: "KI Sikkerhet", description: "Animert hus som viser alarm, åpne dører og bevegelse", preview: true });

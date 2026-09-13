/* ki-sikkerhet-card – animert hero for sikkerhetspopupen.
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
  .scene { position:relative; width:100%; height:150px; }
  .kompakt .scene { height:112px; }
  .scene svg { width:100%; height:100%; display:block; overflow:visible; }

  .vegg { fill:var(--gray100); transition:fill .6s var(--myk); }
  .tak  { fill:var(--gray1000); opacity:.82; }
  .ramme { fill:none; stroke:var(--gray1000); stroke-opacity:.22; stroke-width:2; }
  .rute { fill:var(--gray1000); opacity:.10; transition:fill .45s var(--myk), opacity .45s var(--myk); }
  .rute.apen { fill:var(--orange,#f0a952); opacity:.92; animation:kiSikGlo 1.8s ease-in-out infinite; }
  .dor.apen  { fill:var(--red,#e0524a); opacity:.9; animation:kiSikGlo 1.8s ease-in-out infinite; }
  @keyframes kiSikGlo { 0%,100% { opacity:.55 } 50% { opacity:1 } }

  .bakke { fill:var(--gray1000); opacity:.13; }
  .roykpust { fill:none; stroke:var(--gray1000); stroke-opacity:.28; stroke-width:2.5; stroke-linecap:round; }
  .kort.trygg .roykpust { animation:kiSikRoyk 5s linear infinite; }
  @keyframes kiSikRoyk { 0% { opacity:0; transform:translateY(4px) } 30% { opacity:.5 } 100% { opacity:0; transform:translateY(-12px) } }

  /* radar for bevegelse */
  .radar { transform-origin:var(--rx,50%) var(--ry,50%); animation:kiSikSveip 3.2s linear infinite; }
  @keyframes kiSikSveip { to { transform:rotate(360deg) } }
  .radarvifte { fill:var(--blue,#6ec6ff); opacity:.30; }
  .radarring { fill:none; stroke:var(--blue,#6ec6ff); stroke-opacity:.35; stroke-width:1.5; }

  /* sirenebuer */
  .sirene { fill:none; stroke:var(--red,#e0524a); stroke-width:3; stroke-linecap:round; opacity:0; }
  .kort.alarm .sirene { animation:kiSikSirene 1.2s ease-out infinite; }
  .kort.alarm .sirene:nth-of-type(2) { animation-delay:.2s; }
  .kort.alarm .sirene:nth-of-type(3) { animation-delay:.4s; }
  @keyframes kiSikSirene { 0% { opacity:0; transform:scale(.5) } 40% { opacity:.8 } 100% { opacity:0; transform:scale(1.25) } }

  /* nedtelling ved på-/avkobling */
  .tellering { fill:none; stroke:var(--yellow,#f5c542); stroke-width:3; stroke-linecap:round;
    stroke-dasharray:4 8; animation:kiSikRull 1.6s linear infinite; }
  @keyframes kiSikRull { to { stroke-dashoffset:-24 } }

  /* ---- brikker ---- */
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
    .kort::before, .skjold::after, .skjold ha-icon, .rute.apen, .dor.apen,
    .radar, .sirene, .tellering, .roykpust, .liste { animation:none !important; }
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
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, rows: 5, min_rows: 4 }; }

  setConfig(c) {
    if (!c || !c.entity) throw new Error("Sett entity: til alarmpanelet");
    this._c = { navn: "Sikkerhet", batteri_grense: 20, kompakt: false, zones: [], ...c };
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

    this.shadowRoot.innerHTML = `
      <style>${KI_SIK_STIL}</style>
      <ha-card>
        <div class="${klasse}" style="--tone:${tone}">
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

          <div class="scene">${this._hus({ paa, venter, alarm, apne, rorer, ulast, g })}</div>

          <div class="brikker">${brikker}</div>
          ${valgt ? `<div class="liste">${this._liste(valgt)}</div>` : ""}
        </div>
      </ha-card>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]"))
      el.addEventListener("click", () => this._mer(el.dataset.mer));
    for (const el of this.shadowRoot.querySelectorAll("[data-liste]"))
      el.addEventListener("click", () => {
        this._apen = this._apen === el.dataset.liste ? null : el.dataset.liste;
        this._tegn();
      });
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

  /* Huset. Vinduene fylles opp av de faktisk åpne, resten står mørke. */
  _hus({ paa, venter, alarm, apne, rorer, ulast, g }) {
    const ruter = 4;
    const antApne = Math.min(apne.length, ruter);
    const vindu = (x, y, i) => `
      <rect class="rute ${i < antApne ? "apen" : ""}" x="${x}" y="${y}" width="26" height="22" rx="4"></rect>
      <rect class="ramme" x="${x}" y="${y}" width="26" height="22" rx="4"></rect>
      <line class="ramme" x1="${x + 13}" y1="${y}" x2="${x + 13}" y2="${y + 22}"></line>`;

    const dorApen = ulast.length > 0 || apne.some((r) => /dør|door|inngang|veranda/i.test(r.navn));

    return `
      <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <ellipse class="bakke" cx="160" cy="138" rx="120" ry="7"></ellipse>

        <!-- pipe og røyk: bare når alt er rolig -->
        <rect class="tak" x="206" y="34" width="14" height="24" rx="3"></rect>
        <path class="roykpust" d="M213 30 q6 -6 0 -12 q-6 -6 0 -12"></path>

        <!-- tak -->
        <path class="tak" d="M160 22 L252 74 L68 74 Z"></path>
        <!-- vegg -->
        <rect class="vegg" x="82" y="72" width="156" height="62" rx="6"></rect>

        ${vindu(96, 84, 0)}
        ${vindu(130, 84, 1)}
        ${vindu(196, 84, 2)}
        ${vindu(206, 112, 3)}

        <!-- dør -->
        <rect class="rute dor ${dorApen ? "apen" : ""}" x="158" y="94" width="26" height="40" rx="4"></rect>
        <rect class="ramme" x="158" y="94" width="26" height="40" rx="4"></rect>
        <circle class="ramme" cx="178" cy="115" r="2"></circle>

        ${rorer.length ? `
          <g class="radar" style="--rx:160px; --ry:112px">
            <path class="radarvifte" d="M160 112 L160 58 A54 54 0 0 1 198 74 Z"></path>
          </g>
          <circle class="radarring" cx="160" cy="112" r="54"></circle>` : ""}

        ${venter ? `<circle class="tellering" cx="160" cy="78" r="66"></circle>` : ""}

        ${alarm ? `
          <path class="sirene" d="M262 62 a26 26 0 0 1 0 36"></path>
          <path class="sirene" d="M272 52 a40 40 0 0 1 0 56"></path>
          <path class="sirene" d="M282 42 a54 54 0 0 1 0 76"></path>
          <path class="sirene" d="M58 62 a26 26 0 0 0 0 36"></path>
          <path class="sirene" d="M48 52 a40 40 0 0 0 0 56"></path>` : ""}
      </svg>`;
  }
}

const KI_SIK_ESC = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

customElements.define("ki-sikkerhet-card", KiSikkerhetCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-sikkerhet-card"))
  window.customCards.push({ type: "ki-sikkerhet-card", name: "KI Sikkerhet", description: "Animert hus som viser alarm, åpne dører og bevegelse", preview: true });

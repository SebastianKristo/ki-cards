/* ki-status-card – «er alt friskt?» i klartekst.
 *
 * Toppkortet i hver fane, i samme form som heroen i søvn- og klimakortet: rundt ikonfelt,
 * én linje som sier hvordan det står, og nøkkeltallene under.
 *
 * Poenget er at du skal slippe å lese tjue sensorer for å finne ut om noe er galt.
 * Kortet gjør sjekkene og sier hva som feiler — og bare da.
 *
 * type: custom:ki-status-card
 * navn: Unraid
 * ikon: mdi:server
 * ok_tekst: Alt friskt
 * sjekker:
 *   - navn: Paritet            # vises når den feiler: «Paritet ugyldig»
 *     entity: binary_sensor.d_day_darling_parity_valid
 *     ok: 'on'                 # tilstanden som betyr greit
 *     feil: Paritet ugyldig
 *     alvor: rod               # rod | gul  (standard gul)
 *   - navn: Disker
 *     entity: binary_sensor.d_day_darling_disks_missing
 *     ok: 'off'
 *     feil: Disker mangler
 *     alvor: rod
 *   - entity: sensor.d_day_darling_active_notifications
 *     over: 0                  # tallsjekk i stedet for tilstand
 *     feil: '{verdi} varsler'
 * tall:
 *   - navn: CPU
 *     entity: sensor.d_day_darling_cpu_usage
 *     enhet: ' %'
 *     desimaler: 0
 */
const KI_STATUS_VERSJON = "1.0.0";

const KI_STATUS_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .hero { position:relative; border-radius:24px; background:var(--gray200);
    padding:16px 18px; color:var(--gray1000);
    display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px; align-items:start;
    transition:background .5s var(--myk), color .3s; }
  .hero.gul { background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .hero.rod { background:var(--red,#e5706b); color:var(--black,#1b1b1b); }

  .ik { width:48px; height:48px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:25px;
    background:rgba(250,251,252,.12); }
  .hero.gul .ik, .hero.rod .ik { background:rgba(0,0,0,.14); }
  .hero.rod .ik ha-icon { animation:kiStPuls 1.8s ease-in-out infinite; }
  @keyframes kiStPuls { 0%,100% { transform:scale(1) } 50% { transform:scale(1.12) } }

  .navn { font-size:12.5px; font-weight:600; opacity:.7; }
  .tilstand { font-size:19px; font-weight:700; letter-spacing:-.015em; margin-top:2px;
    line-height:1.3; }
  .feilliste { font-size:13px; opacity:.75; margin-top:5px; line-height:1.5; }

  /* Nøkkeltallene. De tre–fire tallene man ser på først, ikke alt som finnes. */
  .tall { grid-column:1 / -1; display:grid; gap:8px; margin-top:14px;
    grid-template-columns:repeat(var(--kol,4),minmax(0,1fr)); }
  .tall .t { background:rgba(250,251,252,.08); border-radius:18px; padding:10px 8px;
    text-align:center; cursor:pointer; min-width:0; }
  .hero.gul .tall .t, .hero.rod .tall .t { background:rgba(0,0,0,.10); }
  .tall .t b { display:block; font-size:20px; font-weight:600; letter-spacing:-.02em;
    font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .tall .t span { display:block; font-size:11px; opacity:.6; margin-top:2px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  @media (max-width:400px) { .tilstand { font-size:17px; } .tall .t b { font-size:18px; } }
  @media (prefers-reduced-motion: reduce) { .hero.rod .ik ha-icon { animation:none; } }
`;

const kiStEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiStatusCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { navn: "Status", sjekker: [] }; }
  getCardSize() { return 4; }

  setConfig(c) {
    this._c = { navn: "", ikon: "mdi:heart-pulse", ok_tekst: "Alt friskt",
      sjekker: [], tall: [], ...(c || {}) };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const ids = [...this._c.sjekker, ...this._c.tall].map((x) => x.entity);
    const sig = JSON.stringify(ids.map((id) => (h.states[id] || {}).state));
    if (sig !== this._sig) { this._sig = sig; this._tegn(); }
    else if (!g) this._tegn();
  }

  /* Sjekkene som feiler. En sjekk kan være på tilstand (`ok`) eller på tall (`over`).
     Utilgjengelige entiteter regnes ikke som feil — vi vet rett og slett ikke, og et
     falskt rødt kort er verre enn ingenting. */
  _feil() {
    const ut = [];
    for (const s of (this._c.sjekker || [])) {
      const st = this._h && this._h.states[s.entity];
      if (!st || ["unknown", "unavailable", ""].includes(st.state)) continue;
      let feiler = false;
      if (s.over !== undefined) {
        const v = parseFloat(st.state);
        feiler = !isNaN(v) && v > Number(s.over);
      } else if (s.ok !== undefined) {
        const ok = [].concat(s.ok).map(String);
        feiler = !ok.includes(String(st.state));
      }
      if (!feiler) continue;
      const tekst = String(s.feil || s.navn || s.entity)
        .replace("{verdi}", st.state);
      ut.push({ tekst, alvor: s.alvor === "rod" ? "rod" : "gul", entity: s.entity });
    }
    return ut;
  }

  _tallVerdi(t) {
    const st = this._h && this._h.states[t.entity];
    if (!st || ["unknown", "unavailable", ""].includes(st.state)) return "–";
    /* Hele strengen må være et tall. `parseFloat` godtar alt som *begynner* med et
       tall, så «7.2.1-beta» ble vist som «7,2» — versjonsnummeret ble et måltall. */
    const rentTall = /^-?\d+([.,]\d+)?$/.test(st.state.trim());
    const v = rentTall ? parseFloat(String(st.state).replace(",", ".")) : NaN;
    if (isNaN(v)) {
      // Tekstverdier forkortes, ellers sprenger de flisa
      return st.state.length > 12 ? st.state.slice(0, 11) + "…" : st.state;
    }
    const d = t.desimaler === undefined ? (Math.abs(v) < 10 ? 1 : 0) : Number(t.desimaler);
    return v.toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d })
      + (t.enhet || "");
  }

  _tegn() {
    const c = this._c;
    const feil = this._feil();
    const rod = feil.some((f) => f.alvor === "rod");
    const klasse = rod ? "rod" : feil.length ? "gul" : "";
    const tall = (c.tall || []).slice(0, 4);

    /* Én feil får hele linja. Flere blir oppsummert, med detaljene under — «3 ting
       krever oppmerksomhet» og så hva de er. */
    const tilstand = !feil.length ? c.ok_tekst
      : feil.length === 1 ? feil[0].tekst
      : `${feil.length} ting krever oppmerksomhet`;

    this.shadowRoot.innerHTML = `<style>${KI_STATUS_STIL}</style>
      <div class="hero ${klasse}">
        <span class="ik"><ha-icon icon="${kiStEsc(
          feil.length ? (rod ? "mdi:alert-circle-outline" : "mdi:alert-outline") : c.ikon
        )}"></ha-icon></span>
        <div>
          ${c.navn ? `<div class="navn">${kiStEsc(c.navn)}</div>` : ""}
          <div class="tilstand">${kiStEsc(tilstand)}</div>
          ${feil.length > 1 ? `<div class="feilliste">${
            feil.map((f) => kiStEsc(f.tekst)).join(" · ")}</div>` : ""}
        </div>
        ${tall.length ? `<div class="tall" style="--kol:${tall.length}">${tall.map((t) => `
          <div class="t" data-mer="${kiStEsc(t.entity)}" tabindex="0">
            <b>${kiStEsc(this._tallVerdi(t))}</b><span>${kiStEsc(t.navn || "")}</span>
          </div>`).join("")}</div>` : ""}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]")) {
      const aapne = () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
      el.addEventListener("click", aapne);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aapne(); }
      });
    }
  }
}

customElements.define("ki-status-card", KiStatusCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-status-card"))
  window.customCards.push({ type: "ki-status-card", name: "KI Status",
    description: "Er alt friskt? Sjekker flere sensorer og sier det i klartekst",
    preview: true });

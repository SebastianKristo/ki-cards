/* ki-rack-card – enhetene som fliser, detaljene bak et trykk.
 *
 * Problemet med alle de forrige forsøkene var prinsippet, ikke høyden: et fullbreddekort
 * per enhet stablet nedover blir rulling uansett hvor lavt hvert kort er. Seks
 * nettverksenheter er seks skjermhøyder.
 *
 * Her ligger enhetene som fliser i et rutenett — to per rad, fire linjer tekst hver — så
 * hele parken er på én skjerm. Trykker du på en flis, glir detaljene inn over rutenettet
 * i stedet for å ligge under det. Da ser du én enhet av gangen, og ingenting å bla forbi.
 *
 * type: custom:ki-rack-card
 * kolonner: 2
 * enheter:
 *   - navn: Dream Machine Pro
 *     ikon: mdi:router-network
 *     status: device_tracker.oslo_dream_machine_pro
 *     status_pa: [home]
 *     tall: sensor.oslo_dream_machine_pro_clients      # tallet på flisen
 *     tall_enhet: ' klienter'
 *     nokkel: sensor.oslo_dream_machine_pro_cpu_utilisation_2   # liten linje under
 *     nokkel_enhet: '% CPU'
 *     detalj:                                          # konfig til ki-enhet-card
 *       navn: Dream Machine Pro
 *       figur: ruter
 *       ...
 */
const KI_RACK_VERSJON = "1.0.0";

const KI_RACK_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { position:relative; display:grid; gap:8px; color:var(--gray1000); }

  .rutenett { display:grid; gap:8px;
    grid-template-columns:repeat(var(--kol,2),minmax(0,1fr)); }

  /* Flisen: ikon i farget felt, navn, ett stort tall, én liten linje. Fire opplysninger
     er nok til å se om enheten har det bra — resten venter bak trykket. */
  .flis { position:relative; background:var(--gray200); border-radius:24px;
    padding:12px 14px; border:0; color:inherit; font:inherit; text-align:left;
    cursor:pointer; display:grid; gap:2px; min-width:0;
    transition:background .2s, transform .12s var(--myk); }
  .flis:active { transform:scale(.985); }
  .flis .topp { display:flex; align-items:center; gap:10px; }
  .flis .ik { width:38px; height:38px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:20px;
    background:rgba(250,251,252,.10); }
  .flis .n { flex:1; min-width:0; font-size:13.5px; font-weight:600;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis .prikk { width:9px; height:9px; border-radius:50%; flex:none;
    background:var(--green,#5ad18b); }
  .flis.nede { background:color-mix(in srgb, var(--red,#e5706b) 30%, var(--gray200)); }
  .flis.nede .prikk { background:var(--red,#e5706b); }
  .flis.borte .prikk { background:var(--orange,#f0a952); }
  .flis .stor { font-size:22px; font-weight:600; letter-spacing:-.02em; margin-top:6px;
    font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .flis .stor small { font-size:12px; font-weight:500; opacity:.55; margin-left:4px; }
  .flis .liten { font-size:11.5px; opacity:.55; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }

  /* Detaljlaget. Dekker rutenettet i stedet for å ligge under det — det er dette som
     fjerner rullingen. */
  .lag { display:grid; gap:8px; animation:kiRaInn .2s var(--myk); }
  @keyframes kiRaInn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
  .tilbake { display:flex; align-items:center; gap:8px; border:0; background:var(--gray200);
    color:var(--gray1000); font:inherit; font-size:13.5px; font-weight:500;
    padding:10px 16px 10px 12px; border-radius:75px; cursor:pointer; width:fit-content;
    max-width:100%; --mdc-icon-size:19px; }
  .tilbake span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .topprad { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
    padding:0 6px 2px; }
  .topprad .t { font-size:14px; font-weight:600; }
  .topprad .s { font-size:12px; opacity:.55; }
  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  @media (prefers-reduced-motion: reduce) { .lag { animation:none; } .flis { transition:none; } }
`;

const kiRaEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiRackCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._apen = null; }
  static getStubConfig() { return { enheter: [] }; }
  getCardSize() { return 8; }

  setConfig(c) {
    if (!c || !Array.isArray(c.enheter) || !c.enheter.length) {
      throw new Error("ki-rack-card: 'enheter' må være en liste med minst én enhet");
    }
    this._c = { kolonner: 2, tittel: "", ...c };
    this._apen = null;
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    if (!this._bygget) this._bygg();
    this._oppdater();
    if (this._detalj) this._detalj.hass = h;
  }

  _st(id) { return id && this._h ? this._h.states[id] : null; }

  /* Tilstanden til én enhet: oppe, nede eller uten svar. Uten svar er noe annet enn
     nede — vi vet ikke, og det skal se annerledes ut. */
  _tilstand(e) {
    const st = this._st(e.status);
    if (!st || ["unavailable", "unknown", ""].includes(st.state)) return "borte";
    const paa = [].concat(e.status_pa || ["home", "on", "running", "online"]).map(String);
    return paa.includes(String(st.state)) ? "oppe" : "nede";
  }

  _verdi(id, enhet, desimaler) {
    const st = this._st(id);
    if (!st || ["unavailable", "unknown", ""].includes(st.state)) return null;
    const rentTall = /^-?\d+([.,]\d+)?$/.test(st.state.trim());
    if (!rentTall) return { tekst: st.state, enhet: enhet || "" };
    const v = parseFloat(String(st.state).replace(",", "."));
    /* Et heltall skal bli et heltall. «0,0 klienter» og «23,0 torrenter» er feil —
       desimaler hører bare til verdier som faktisk har dem. */
    const d = desimaler !== undefined ? Number(desimaler)
      : Number.isInteger(v) ? 0 : (Math.abs(v) < 10 ? 1 : 0);
    return { tekst: v.toLocaleString("nb-NO",
      { minimumFractionDigits: d, maximumFractionDigits: d }), enhet: enhet || "" };
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KI_RACK_STIL}</style><div class="rot"></div>`;
    this._bygget = true;
    this._sistApen = undefined;
  }

  _oppdater() {
    const c = this._c;
    const rot = this.shadowRoot.querySelector(".rot");

    if (this._apen !== null) {
      // Detaljvisningen bygges bare når valget endrer seg, ellers mister ki-enhet-card
      // sin egen tilstand hver gang en sensor tikker.
      if (this._sistApen !== this._apen) {
        this._sistApen = this._apen;
        const e = c.enheter[this._apen];
        rot.innerHTML = `<div class="lag">
          <button class="tilbake" data-tilbake="1">
            <ha-icon icon="mdi:chevron-left"></ha-icon><span>Alle ${
              kiRaEsc(c.tittel || "enheter")}</span></button>
          <div class="innhold"></div>
        </div>`;
        rot.querySelector("[data-tilbake]").addEventListener("click", () => {
          this._apen = null; this._detalj = null; this._oppdater();
        });
        const boks = rot.querySelector(".innhold");
        this._detalj = null;
        if (e && e.detalj && customElements.get("ki-enhet-card")) {
          const k = document.createElement("ki-enhet-card");
          k.setConfig({ type: "custom:ki-enhet-card", ...e.detalj });
          boks.appendChild(k);
          this._detalj = k;
          for (const ekstra of (e.under || [])) {
            const t = ekstra.type && String(ekstra.type).replace(/^custom:/, "");
            if (!t || !customElements.get(t)) continue;
            const el = document.createElement(t);
            el.setConfig(ekstra);
            boks.appendChild(el);
          }
        } else {
          boks.innerHTML = `<div class="tom">Ingen detaljer satt opp for denne
            enheten.</div>`;
        }
      }
      if (this._detalj) this._detalj.hass = this._h;
      for (const el of this.shadowRoot.querySelectorAll(".innhold > *")) {
        if (el !== this._detalj && el.setConfig) el.hass = this._h;
      }
      return;
    }

    this._sistApen = undefined;
    const tilst = c.enheter.map((e) => this._tilstand(e));
    const oppe = tilst.filter((t) => t === "oppe").length;

    rot.innerHTML = `
      ${c.tittel ? `<div class="topprad">
        <span class="t">${kiRaEsc(c.tittel)}</span>
        <span class="s">${oppe} av ${c.enheter.length} oppe</span>
      </div>` : ""}
      <div class="rutenett" style="--kol:${Math.max(1, Math.min(3, Number(c.kolonner) || 2))}">
        ${c.enheter.map((e, i) => {
          const t = tilst[i];
          const stor = this._verdi(e.tall, e.tall_enhet, e.tall_desimaler);
          const liten = this._verdi(e.nokkel, e.nokkel_enhet, e.nokkel_desimaler);
          return `<button class="flis ${t === "oppe" ? "" : t}" data-i="${i}">
            <div class="topp">
              <span class="ik"><ha-icon icon="${kiRaEsc(e.ikon || "mdi:server")}"></ha-icon></span>
              <span class="n">${kiRaEsc(e.navn)}</span>
              <span class="prikk"></span>
            </div>
            <div class="stor">${stor ? `${kiRaEsc(stor.tekst)}${
              stor.enhet ? `<small>${kiRaEsc(stor.enhet)}</small>` : ""}`
              : t === "borte" ? "Uten svar" : t === "nede" ? "Nede" : "–"}</div>
            <div class="liten">${liten ? `${kiRaEsc(liten.tekst)}${kiRaEsc(liten.enhet)}`
              : "&nbsp;"}</div>
          </button>`;
        }).join("")}
      </div>`;

    for (const b of rot.querySelectorAll("[data-i]")) {
      b.addEventListener("click", () => {
        this._apen = Number(b.dataset.i);
        this._oppdater();
      });
    }
  }
}

customElements.define("ki-rack-card", KiRackCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-rack-card"))
  window.customCards.push({ type: "ki-rack-card", name: "KI Rack",
    description: "Enheter som fliser, med detaljene bak et trykk", preview: false });

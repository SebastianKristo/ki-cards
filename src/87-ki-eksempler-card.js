/* ki-eksempler-card – hva ting koster akkurat nå, i hverdagsspråk.
 *
 *  Tretten nesten like knappekort i YAML blir én liste her. Hvert eksempel er en
 *  energimengde i kWh, og kortet ganger med prisen.
 *
 *  Poenget er ikke presisjon: en panelovn går ikke for full effekt hele timen, og
 *  en tørketrommel varierer med programmet. Tallene er ment å gi størrelsesorden,
 *  og derfor kan hvert eksempel ha en egen note som sier hva anslaget bygger på.
 *
 *  type: custom:ki-eksempler-card
 *  pris: sensor.norgespris_pris_na       # kr/kWh
 *  kolonner: 2
 *  eksempler:                            # utelates = standardlista under
 *    - navn: Dusj 10 min
 *      ikon: mdi:shower-head
 *      kwh: 2.79
 *      note: 8 l/min, 30 °C oppvarming
 *    - navn: Lade bilen
 *      ikon: mdi:car-electric
 *      kwh: 85.2
 *      note: 75 kWh batteri, 88 % ladeeffektivitet
 */
(() => {
  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kr = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(2)).replace(".", ",");

  /* Standardlista. Hvert tall er regnet ut fra det noten sier, slik at man kan
     etterprøve det i stedet for å stole på et rundt tall. */
  const STANDARD = [
    { navn: "Lade bilen 0–100 %", ikon: "mdi:car-electric", kwh: 85.2,
      note: "75 kWh batteri, 88 % ladeeffektivitet" },
    { navn: "Dusj 10 min", ikon: "mdi:shower-head", kwh: 2.79,
      note: "8 l/min, 30 °C oppvarming" },
    { navn: "Varmtvannsbereder", ikon: "mdi:water-boiler", kwh: 9.3,
      note: "200 l fra kaldt, 40 °C" },
    { navn: "Tørketrommel", ikon: "mdi:tumble-dryer", kwh: 3.5,
      note: "kondens; varmepumpe bruker 1,5–2" },
    { navn: "Oppvaskmaskin", ikon: "mdi:dishwasher", kwh: 1.0,
      note: "eco-program" },
    { navn: "Vaskemaskin", ikon: "mdi:washing-machine", kwh: 0.9,
      note: "40 °C" },
    { navn: "Panelovn 1 time", ikon: "mdi:radiator", kwh: 1.0,
      note: "1 kW, full effekt" },
    { navn: "Pizza i ovnen", ikon: "mdi:pizza", kwh: 0.44,
      note: "2,4 kW i 20 min, termostatstyrt" },
    { navn: "Støvsuging 30 min", ikon: "mdi:vacuum", kwh: 0.3,
      note: "600 W" },
    { navn: "TV 1 time", ikon: "mdi:television", kwh: 0.1,
      note: "100 W" },
    { navn: "Lade laptop", ikon: "mdi:laptop", kwh: 0.05,
      note: "50 W i en time" },
  ];

  const STIL = `
    :host { display:block; }
    .kort { background:var(--gray200, #2a2a2d); border-radius:24px; padding:14px;
      color:var(--gray1000, #fafbfc); font-family:inherit; }
    .topp { display:flex; align-items:baseline; gap:8px; margin:2px 4px 12px; }
    .tittel { font-size:16px; font-weight:500; }
    .pris { margin-left:auto; font-size:13px; opacity:.6; }
    .rutenett { display:grid; gap:8px; }
    .e { display:flex; align-items:center; gap:12px; padding:12px;
      border-radius:18px; background:rgba(128,128,128,.14); min-width:0; }
    .ikon { flex:0 0 auto; width:42px; height:42px; border-radius:50%;
      background:rgba(128,128,128,.2); display:flex; align-items:center;
      justify-content:center; --mdc-icon-size:22px; }
    .tekst { min-width:0; flex:1; }
    .navn { font-size:14px; font-weight:500; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap; }
    /* Noten sier hva anslaget bygger på. Uten den ser tallene ut som fasit. */
    .note { font-size:11px; opacity:.5; margin-top:2px; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap; }
    .belop { flex:0 0 auto; font-size:20px; font-weight:500; white-space:nowrap; }
    .belop small { font-size:12px; opacity:.6; margin-left:2px; font-weight:400; }
    .mangler { padding:18px 12px; text-align:center; opacity:.6; font-size:14px; }
  `;

  class KiEksemplerCard extends HTMLElement {
    static getStubConfig(hass) {
      const finn = Object.keys((hass && hass.states) || {})
        .find((id) => /^sensor\..*(norgespris|stroempris|strompris|pris)/.test(id));
      return { pris: finn || "sensor.norgespris_pris_na" };
    }

    static getConfigElement() {
      const el = document.createElement("ha-form");
      return el;
    }

    static getConfigForm() {
      return {
        schema: [
          { name: "pris", selector: { entity: { domain: "sensor" } } },
          { name: "tittel", selector: { text: {} } },
          { name: "kolonner", selector: { number: { min: 1, max: 3, mode: "slider" } } },
          { name: "vis_note", selector: { boolean: {} } },
        ],
        computeLabel: (s) => ({ pris: "Prissensor (kr/kWh)", tittel: "Tittel",
          kolonner: "Kolonner", vis_note: "Vis forutsetningene" }[s.name] || s.name),
      };
    }

    setConfig(c) {
      this._c = { tittel: "Hva koster det nå", kolonner: 2, vis_note: true,
        pris: "sensor.norgespris_pris_na", ...(c || {}) };
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._bygget = false;
      if (this._hass) this._tegn();
    }

    set hass(h) {
      const gammel = this._hass;
      this._hass = h;
      if (!this._c) return;
      /* Bare prisen betyr noe her. Uten denne sjekken tegnes kortet på nytt ved hver
         tilstandsendring i huset — mange ganger i minuttet. */
      const id = this._c.pris;
      if (gammel && gammel.states[id] === h.states[id] && this._bygget) return;
      this._tegn();
    }

    getCardSize() { return 6; }

    _tegn() {
      const c = this._c, h = this._hass;
      const s = h.states[c.pris];
      const pris = ok(s) ? parseFloat(String(s.state).replace(",", ".")) : NaN;

      const liste = (Array.isArray(c.eksempler) && c.eksempler.length
        ? c.eksempler : STANDARD)
        .filter((e) => e && isFinite(Number(e.kwh)));

      const kropp = isNaN(pris)
        ? `<div class="mangler">Fant ingen pris fra <b>${esc(c.pris)}</b>.</div>`
        : `<div class="rutenett" style="grid-template-columns:repeat(${
            Math.max(1, Math.min(3, Number(c.kolonner) || 2))},minmax(0,1fr))">${
            liste.map((e) => `
            <div class="e">
              <div class="ikon"><ha-icon icon="${esc(e.ikon || "mdi:flash")}"></ha-icon></div>
              <div class="tekst">
                <div class="navn">${esc(e.navn || "")}</div>
                ${c.vis_note !== false && e.note
                  ? `<div class="note">${esc(e.note)}</div>` : ""}
              </div>
              <div class="belop">${kr(pris * Number(e.kwh))}<small>kr</small></div>
            </div>`).join("")}</div>`;

      this.shadowRoot.innerHTML = `<style>${STIL}</style>
        <div class="kort">
          <div class="topp">
            <span class="tittel">${esc(c.tittel)}</span>
            <span class="pris">${isNaN(pris) ? "" : kr(pris) + " kr/kWh"}</span>
          </div>
          ${kropp}
        </div>`;
      this._bygget = true;
    }
  }

  if (!customElements.get("ki-eksempler-card"))
    customElements.define("ki-eksempler-card", KiEksemplerCard);

  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-eksempler-card"))
    window.customCards.push({ type: "ki-eksempler-card", name: "KI Eksempler",
      description: "Hva hverdagslige ting koster ved dagens strømpris", preview: true });
})();

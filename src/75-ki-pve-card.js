/* ki-pve-card – én velger over mange Proxmox-enheter.
 *
 * Containerne og de virtuelle maskinene har identisk oppsett: status, oppetid, CPU, seks
 * info-felt og fire til ni knapper. Én nøstet fane per enhet ga elleve blokker på over
 * seks hundre linjer YAML, der alt bortsett fra navnet og id-en var det samme.
 *
 * Her oppgir du bare navn og id per enhet. Kortet bygger resten, og viser den valgte
 * enheten gjennom `ki-enhet-card` — samme kort som før, så utseendet er uendret.
 *
 * type: custom:ki-pve-card
 * mal: ct                         # ct (container) eller vm
 * enheter:
 *   - navn: Dispatcharr
 *     id: dispatcharr_100
 *   - navn: Pi-hole
 *     id: pihole_108
 *     tjeneste: pihole            # brukes i knappenavnene, hvis den avviker fra id-en
 */
const KI_PVE_VERSJON = "1.0.0";

const KI_PVE_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:10px; }
  /* Velgeren: samme pilleform som fanerada i klimakortet, men med en prikk som
     viser om enheten kjører — da ser du hele parken uten å bla gjennom fanene. */
  .velg { display:flex; gap:4px; padding:4px; border-radius:20px; background:var(--gray200);
    overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .velg::-webkit-scrollbar { display:none; }
  .velg button { flex:0 0 auto; display:flex; align-items:center; gap:7px; border:0;
    background:none; color:var(--gray1000); font:inherit; font-size:13px; font-weight:500;
    padding:9px 14px; border-radius:16px; cursor:pointer; opacity:.55; white-space:nowrap;
    transition:background .18s, opacity .18s; }
  .velg button.valgt { background:var(--active-small, var(--active-big, #ee95ff));
    color:var(--gray100,#fafbfc); opacity:1; font-weight:600; }
  .velg .prikk { width:8px; height:8px; border-radius:50%; flex:none;
    background:color-mix(in srgb, var(--gray1000) 28%, transparent); }
  .velg button.kjorer .prikk { background:var(--green,#5ad18b); }
  .velg button.valgt .prikk { background:rgba(0,0,0,.35); }
  .velg button.kjorer.valgt .prikk { background:rgba(0,0,0,.55); }
  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; color:var(--gray1000); }
`;

const kiPvEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Info-feltene er de samme for alle enheter. VM-ene mangler «Disk brukt». */
const KI_PVE_INFO = (mal) => [
  ["RAM brukt", "ram_used"], ["RAM totalt", "ram_total"],
  ...(mal === "vm" ? [] : [["Disk brukt", "disk_used"]]),
  ["Disk totalt", "disk_total"], ["Nett RX", "network_rx"], ["Nett TX", "network_tx"],
];

/* Knappene. VM-ene har fire ekstra, og rekkefølgen er fra ufarlig til farlig. */
const KI_PVE_KNAPPER = (mal) => [
  ["Start", "start", "mdi:play", "var(--green)", null],
  ["Stopp", "stop", "mdi:stop", null, "Stoppe {navn}?"],
  ["Restart", "reboot", "mdi:restart", "var(--orange)", "Restarte {navn}?"],
  ...(mal === "vm" ? [
    ["Pause", "pause", "mdi:pause", null, null],
    ["Fortsett", "resume", "mdi:play-pause", null, null],
    ["Dvale", "hibernate", "mdi:moon-waning-crescent", null, null],
  ] : []),
  ["Av", "shutdown", "mdi:power", "var(--red)", "Slå av {navn}?"],
  ...(mal === "vm" ? [
    ["Reset", "reset", "mdi:restart-alert", "var(--red)",
      "Tvangsreset av {navn}? Kan gi datatap."],
  ] : []),
];

class KiPveCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { mal: "ct", enheter: [] }; }
  getCardSize() { return 14; }

  setConfig(c) {
    if (!c || !Array.isArray(c.enheter) || !c.enheter.length) {
      throw new Error("ki-pve-card: 'enheter' må være en liste med minst én enhet");
    }
    this._c = { mal: "ct", prefiks_sensor: "sensor.3_ct_", prefiks_knapp: "button.3_ct_", ...c };
    if (c.mal === "vm" && !c.prefiks_sensor) this._c.prefiks_sensor = "sensor.4_vm_";
    if (c.mal === "vm" && !c.prefiks_knapp) this._c.prefiks_knapp = "button.4_vm_";
    this._valgt = 0;
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    if (!this._bygget) this._bygg();
    this._oppdater();
    if (this._enhet) this._enhet.hass = h;
  }

  _s(id, felt) { return `${this._c.prefiks_sensor}${id}_${felt}`; }
  _b(id, felt, tjeneste) { return `${this._c.prefiks_knapp}${id}_${felt}_${tjeneste}`; }

  /* Konfigurasjonen ki-enhet-card får. Den bygges av malen, så et nytt felt trenger
     bare legges til her i stedet for i elleve YAML-blokker. */
  _enhetConfig(e) {
    const c = this._c;
    const tj = e.tjeneste || e.id.replace(/_\d+$/, "");
    return {
      type: "custom:ki-enhet-card",
      navn: e.navn,
      figur: e.figur || "boks",
      status: this._s(e.id, "status"),
      status_pa: ["running"],
      tekst_pa: "Kjører",
      tekst_av: "Stoppet",
      oppetid: this._s(e.id, "uptime"),
      maalinger: [{ navn: "CPU", entity: this._s(e.id, "cpu_usage"), enhet: "%" }],
      info: KI_PVE_INFO(c.mal).map(([navn, felt]) => ({ navn, entity: this._s(e.id, felt) })),
      knapper: KI_PVE_KNAPPER(c.mal).map(([navn, felt, ikon, farge, bekreft]) => ({
        navn,
        entity: this._b(e.id, felt, tj),
        ikon,
        ...(farge ? { farge } : {}),
        ...(bekreft ? { bekreft: bekreft.replace("{navn}", e.navn) } : {}),
      })),
    };
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KI_PVE_STIL}</style>
      <div class="kort"><div class="velg"></div><div class="innhold"></div></div>`;
    this._bygget = true;
    this._sistValgt = null;
    /* Velgeren: glidende pille som kan dras (bevegelsen fra Liquid Glass, uten glass).
       Knappene tegnes på nytt ved hver oppdatering; vakta i basen setter pilla inn igjen. */
    if (window.KI && window.KI.pillefaner) window.KI.pillefaner(this, { rad: ".velg", knapp: ".velg button", aktiv: "valgt",
      farge: "var(--active-small, var(--active-big))" });
  }

  _oppdater() {
    const c = this._c;
    const velg = this.shadowRoot.querySelector(".velg");
    const innhold = this.shadowRoot.querySelector(".innhold");

    velg.innerHTML = c.enheter.map((e, i) => {
      const st = this._h && this._h.states[this._s(e.id, "status")];
      const kjorer = st && st.state === "running";
      return `<button class="${i === this._valgt ? "valgt" : ""} ${kjorer ? "kjorer" : ""}"
        data-i="${i}"><span class="prikk"></span>${kiPvEsc(e.navn)}</button>`;
    }).join("");
    for (const b of velg.querySelectorAll("[data-i]")) {
      b.addEventListener("click", () => {
        this._valgt = Number(b.dataset.i);
        this._oppdater();
        if (this._enhet) this._enhet.hass = this._h;
      });
    }

    // Bare bygg enhetskortet på nytt når valget faktisk endrer seg
    if (this._sistValgt === this._valgt && this._enhet) return;
    this._sistValgt = this._valgt;
    innhold.innerHTML = "";
    this._enhet = null;

    if (!customElements.get("ki-enhet-card")) {
      innhold.innerHTML = `<div class="tom">Fant ikke <code>ki-enhet-card</code>.
        Det ligger i samme pakke som dette kortet — sjekk at hele bundelen er lastet.</div>`;
      return;
    }
    const e = c.enheter[this._valgt] || c.enheter[0];
    const kort = document.createElement("ki-enhet-card");
    kort.setConfig(this._enhetConfig(e));
    innhold.appendChild(kort);
    this._enhet = kort;
  }
}

customElements.define("ki-pve-card", KiPveCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-pve-card"))
  window.customCards.push({ type: "ki-pve-card", name: "KI Proxmox",
    description: "Containere og VM-er med én velger i stedet for en fane hver",
    preview: false });

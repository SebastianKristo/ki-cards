/* ki-unifi-card – rutere, switcher og aksesspunkt med én velger.
 *
 * Nettverk-fanen hadde én nøstet fane per enhet: tre switcher, to aksesspunkt, hver med
 * samme oppsett — status, oppetid, firmware, CPU, minne, klienter, tilstand, uplink MAC
 * og en restart-knapp. Det er 250 linjer YAML der bare navnet og slugen skiller dem.
 *
 * Her oppgir du navn og slug. Kortet bygger resten og viser den valgte enheten gjennom
 * `ki-enhet-card`, så utseendet er uendret.
 *
 * type: custom:ki-unifi-card
 * figur: switch                   # ruter | switch | ap | boks
 * enheter:
 *   - navn: Treets USW-24-PoE
 *     slug: treets_usw_24_poe
 *     led: true                   # enheten har en LED-bryter
 *     porter: 16                  # viser ki-porter-card under, med strømsykling
 *   - navn: Veien USW-24-G2
 *     slug: veien_usw_24_g2
 */
const KI_UNIFI_VERSJON = "1.0.0";

const KI_UNIFI_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:10px; }
  .velg { display:flex; gap:4px; padding:4px; border-radius:20px; background:var(--gray200);
    overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .velg::-webkit-scrollbar { display:none; }
  .velg button { flex:0 0 auto; display:flex; align-items:center; gap:7px; border:0;
    background:none; color:var(--gray1000); font:inherit; font-size:13px; font-weight:500;
    padding:9px 14px; border-radius:16px; cursor:pointer; opacity:.55; white-space:nowrap;
    transition:background .18s, opacity .18s; }
  .velg button.valgt { background:var(--active-small, var(--active-big, #ee95ff));
    color:var(--gray100,#fafbfc); opacity:1; font-weight:600; }
  /* Prikken viser om enheten svarer. Med fem enheter i velgeren ser du hele nettet
     på én gang i stedet for å åpne én fane av gangen. */
  .velg .prikk { width:8px; height:8px; border-radius:50%; flex:none;
    background:color-mix(in srgb, var(--gray1000) 28%, transparent); }
  .velg button.oppe .prikk { background:var(--green,#5ad18b); }
  .velg button.valgt .prikk { background:rgba(0,0,0,.35); }
  .velg button.oppe.valgt .prikk { background:rgba(0,0,0,.55); }
  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; color:var(--gray1000); }
`;

const kiUnEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiUnifiCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { figur: "switch", enheter: [] }; }
  getCardSize() { return 14; }

  setConfig(c) {
    if (!c || !Array.isArray(c.enheter) || !c.enheter.length) {
      throw new Error("ki-unifi-card: 'enheter' må være en liste med minst én enhet");
    }
    this._c = { figur: "switch", ...c };
    this._valgt = 0;
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    if (!this._bygget) this._bygg();
    this._oppdater();
    for (const k of this._barn || []) k.hass = h;
  }

  /* Dream Machine Pro har `_2` bak flere av sensorene sine. `etterfiks` per enhet
     dekker det uten at de andre trenger å bry seg. */
  _e(slug, felt, etterfiks) {
    return `sensor.${slug}_${felt}${etterfiks || ""}`;
  }

  _enhetConfig(e) {
    const c = this._c;
    const p = e.etterfiks || "";
    const ut = {
      type: "custom:ki-enhet-card",
      navn: e.navn,
      figur: e.figur || c.figur,
      status: `device_tracker.${e.slug}`,
      oppetid: this._e(e.slug, "uptime", p),
      oppdatering: `update.${e.slug}_firmware`,
      maalinger: [
        { navn: "CPU", entity: this._e(e.slug, "cpu_utilisation", p), enhet: "%" },
        { navn: "Minne", entity: this._e(e.slug, "memory_utilisation", p), enhet: "%" },
      ],
      info: [
        { navn: "Klienter", entity: this._e(e.slug, "clients"), enhet: "" },
        { navn: "Tilstand", entity: this._e(e.slug, "state") },
        { navn: "Uplink MAC", entity: this._e(e.slug, "uplink_mac") },
      ],
      knapper: [
        { navn: "Restart", entity: `button.${e.slug}_restart`, ikon: "mdi:restart",
          farge: "var(--orange)", bekreft: `Restarte ${e.navn}?` },
        ...(e.led ? [{ navn: "LED", entity: `light.${e.slug}_led`,
          ikon: "mdi:led-outline" }] : []),
      ],
    };
    // Ruteren har temperatur og latens, og det er nettopp de tallene man åpner den for
    if ((e.figur || c.figur) === "ruter") {
      ut.maalinger.push({ navn: "Temp", entity: this._e(e.slug, "cpu_temperature", p),
        enhet: "°", maks: 90, gul: 60, rod: 75 });
      ut.info = [
        ...(e.latens || []).map((n) => ({ navn: n.navn,
          entity: `sensor.${e.slug}_${n.felt}_wan_latency`, enhet: " ms", varsel_over: 80 })),
        { navn: "Local temp", entity: this._e(e.slug, "local_temperature"),
          enhet: " °C", varsel_over: 70 },
        ...ut.info,
      ];
    }
    return ut;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KI_UNIFI_STIL}</style>
      <div class="kort"><div class="velg"></div><div class="innhold"></div></div>`;
    this._bygget = true;
    this._sistValgt = null;
  }

  _oppdater() {
    const c = this._c;
    const velg = this.shadowRoot.querySelector(".velg");
    const innhold = this.shadowRoot.querySelector(".innhold");

    // Én enhet trenger ingen velger
    velg.style.display = c.enheter.length > 1 ? "" : "none";
    velg.innerHTML = c.enheter.map((e, i) => {
      const st = this._h && this._h.states[`device_tracker.${e.slug}`];
      const oppe = st && st.state === "home";
      return `<button class="${i === this._valgt ? "valgt" : ""} ${oppe ? "oppe" : ""}"
        data-i="${i}"><span class="prikk"></span>${kiUnEsc(e.navn)}</button>`;
    }).join("");
    for (const b of velg.querySelectorAll("[data-i]")) {
      b.addEventListener("click", () => {
        this._valgt = Number(b.dataset.i);
        this._oppdater();
        for (const k of this._barn || []) k.hass = this._h;
      });
    }

    if (this._sistValgt === this._valgt && this._barn) return;
    this._sistValgt = this._valgt;
    innhold.innerHTML = "";
    this._barn = [];

    if (!customElements.get("ki-enhet-card")) {
      innhold.innerHTML = `<div class="tom">Fant ikke <code>ki-enhet-card</code>.
        Sjekk at hele bundelen er lastet.</div>`;
      return;
    }
    const e = c.enheter[this._valgt] || c.enheter[0];
    const kort = document.createElement("ki-enhet-card");
    kort.setConfig(this._enhetConfig(e));
    innhold.appendChild(kort);
    this._barn.push(kort);

    // Switchene med PoE har portene under, hvis kortet finnes
    if (e.porter && customElements.get("ki-porter-card")) {
      const p = document.createElement("ki-porter-card");
      p.setConfig({
        type: "custom:ki-porter-card",
        tittel: e.porter_tittel || "Porter (strømsykling)",
        prefiks: `button.${e.slug}_port_`,
        etterfiks: "_power_cycle",
        antall: Number(e.porter),
        kolonner: e.porter_kolonner || 4,
        bekreft: "Strømsykle {port}?",
      });
      innhold.appendChild(p);
      this._barn.push(p);
    }
  }
}

customElements.define("ki-unifi-card", KiUnifiCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-unifi-card"))
  window.customCards.push({ type: "ki-unifi-card", name: "KI UniFi",
    description: "Rutere, switcher og AP-er med én velger", preview: false });

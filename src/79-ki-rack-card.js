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
 * oppdag: unifi            # unifi | pve_ct | pve_vm — finner enhetene selv
 * overstyr:                # valgfrie rettelser på det som ble funnet
 *   treets_usw_24_poe: { navn: Treets, ikon: mdi:switch }
 *   posten_u7_lite: { skjul: true }
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
  /* Navigasjonsfliser har ingen tilstand: prikken byttes mot en pil */
  .flis.nøytral .prikk { background:none; }
  .flis.nøytral .prikk::after { content:"›"; display:block; font-size:19px;
    line-height:9px; opacity:.4; margin-top:-5px; }
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
    if (!c || (!c.oppdag && (!Array.isArray(c.enheter) || !c.enheter.length))) {
      throw new Error("ki-rack-card: sett 'oppdag' eller en liste i 'enheter'");
    }
    this._c = { kolonner: 2, tittel: "", overstyr: {}, ...c };
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

  /* Enhetene: enten oppdaget fra integrasjonen, eller lista i konfigurasjonen.
     Oppdagelsen bygges om hver gang entitetene endrer seg i antall, ikke ved hver
     tilstandsendring — ellers ville kortet bygget seg på nytt hvert sekund. */
  _enheter() {
    const c = this._c;
    if (!c.oppdag) return c.enheter || [];
    const n = this._h ? Object.keys(this._h.states).length : 0;
    if (this._oppdaget && this._antall === n) return this._oppdaget;
    this._antall = n;
    const funnet = c.oppdag === "unifi" ? this._oppdagUnifi()
      : c.oppdag === "pve_ct" ? this._oppdagPve("ct")
      : c.oppdag === "pve_vm" ? this._oppdagPve("vm")
      : [];
    // Egne oppføringer i `enheter` legges etter de oppdagede
    this._oppdaget = [...funnet, ...(c.enheter || [])];
    return this._oppdaget;
  }

  /* Navnet integrasjonen har gitt entiteten, uten sensornavnet bak. «Treets USW-24-PoE
     Uptime» blir «Treets USW-24-PoE». */
  _rentNavn(st, hale) {
    let n = (st.attributes && st.attributes.friendly_name) || "";
    for (const h of [].concat(hale)) {
      n = n.replace(new RegExp(`\\s*${h}\\s*$`, "i"), "");
    }
    return n.trim();
  }

  /* UniFi: hver enhet har en device_tracker og en «uptime»-sensor med samme slug.
     Det er den paringen vi leter etter — ikke et navnemønster, som ville brutt så
     snart du døper om noe. */
  _oppdagUnifi() {
    const S = this._h.states;
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith("device_tracker.")) continue;
      const slug = id.slice("device_tracker.".length);
      // `_2` bak sensorene: Dream Machine Pro har det, de andre ikke. Vi ser hvilken
      // som finnes i stedet for å gjette.
      const ett = S[`sensor.${slug}_uptime_2`] ? "_2"
        : S[`sensor.${slug}_uptime`] ? "" : null;
      if (ett === null) continue;
      const cpu = S[`sensor.${slug}_cpu_utilisation${ett}`] ? `_cpu_utilisation${ett}` : null;
      if (!cpu) continue;

      const navn = this._rentNavn(S[`sensor.${slug}_uptime${ett}`], ["Uptime", "Oppetid"])
        || slug.replace(/_/g, " ");
      const lav = `${navn} ${slug}`.toLowerCase();
      const figur = /dream|udm|gateway|udr/.test(lav) ? "ruter"
        : /usw|switch|flex/.test(lav) ? "switch"
        : /u[67]|uap|ap |access|lite|lr|pro xg|mesh/.test(lav) ? "ap" : "boks";
      const ikon = { ruter: "mdi:router-network", switch: "mdi:switch",
        ap: "mdi:access-point", boks: "mdi:cube-outline" }[figur];

      // Portene telles: så mange som finnes, ikke et tall vi har skrevet inn
      let porter = 0;
      while (S[`button.${slug}_port_${porter + 1}_power_cycle`]) porter++;

      ut.push({ slug, navn, ikon, figur, ett, led: !!S[`light.${slug}_led`], porter });
    }
    ut.sort((a, b) => {
      const r = { ruter: 0, switch: 1, ap: 2, boks: 3 };
      return (r[a.figur] - r[b.figur]) || a.navn.localeCompare(b.navn, "nb");
    });
    return ut.map((e) => this._unifiFlis(e)).filter(Boolean);
  }

  _unifiFlis(e) {
    const o = (this._c.overstyr || {})[e.slug] || {};
    if (o.skjul) return null;
    const navn = o.navn || e.navn;
    const slug = e.slug, ett = e.ett;
    const S = this._h.states;
    const har = (id) => !!S[id];

    const maal = [
      { navn: "CPU", entity: `sensor.${slug}_cpu_utilisation${ett}`, enhet: "%" },
    ];
    if (har(`sensor.${slug}_memory_utilisation${ett}`)) {
      maal.push({ navn: "Minne", entity: `sensor.${slug}_memory_utilisation${ett}`, enhet: "%" });
    }
    if (har(`sensor.${slug}_cpu_temperature${ett}`)) {
      maal.push({ navn: "Temp", entity: `sensor.${slug}_cpu_temperature${ett}`,
        enhet: "°", maks: 90, gul: 60, rod: 75 });
    }
    const info = [];
    for (const [n, f] of [["Google", "google"], ["Cloudflare", "cloudflare"],
      ["Microsoft", "microsoft"]]) {
      if (har(`sensor.${slug}_${f}_wan_latency`)) {
        info.push({ navn: n, entity: `sensor.${slug}_${f}_wan_latency`,
          enhet: " ms", varsel_over: 80 });
      }
    }
    for (const [n, f, ekstra] of [["Local temp", "local_temperature", { enhet: " °C", varsel_over: 70 }],
      ["Klienter", "clients", { enhet: "" }], ["Tilstand", "state", {}],
      ["Uplink MAC", "uplink_mac", {}], ["IP", "ip", {}]]) {
      if (har(`sensor.${slug}_${f}`)) info.push({ navn: n, entity: `sensor.${slug}_${f}`, ...ekstra });
    }
    const knapper = [];
    if (har(`button.${slug}_restart`)) {
      knapper.push({ navn: "Restart", entity: `button.${slug}_restart`, ikon: "mdi:restart",
        farge: "var(--orange)", bekreft: `Restarte ${navn}?` });
    }
    if (e.led) knapper.push({ navn: "LED", entity: `light.${slug}_led`, ikon: "mdi:led-outline" });

    const flis = {
      navn, ikon: o.ikon || e.ikon, status: `device_tracker.${slug}`, status_pa: ["home"],
      tall: har(`sensor.${slug}_clients`) ? `sensor.${slug}_clients` : null,
      tall_enhet: " klienter", tall_desimaler: 0,
      nokkel: `sensor.${slug}_cpu_utilisation${ett}`, nokkel_enhet: " % CPU",
      detalj: { navn, figur: o.figur || e.figur, status: `device_tracker.${slug}`,
        oppetid: `sensor.${slug}_uptime${ett}`,
        ...(har(`update.${slug}_firmware`) ? { oppdatering: `update.${slug}_firmware` } : {}),
        maalinger: maal, info, knapper },
    };
    if (e.porter) {
      flis.under = [{ type: "custom:ki-porter-card", tittel: "Porter (strømsykling)",
        prefiks: `button.${slug}_port_`, etterfiks: "_power_cycle",
        antall: e.porter, kolonner: 4, bekreft: "Strømsykle {port}?" }];
    }
    return flis;
  }

  /* Proxmox Extended Sensors: containere heter `sensor.3_ct_<id>_status`, maskinene
     `sensor.4_vm_<id>_status`. Tjenestenavnet i knappene er id-en uten nummeret bak,
     men vi sjekker at knappen finnes før vi tar den med. */
  _oppdagPve(slag) {
    const S = this._h.states;
    const c = this._c;
    const pre = slag === "ct" ? (c.prefiks_sensor || "sensor.3_ct_")
      : (c.prefiks_sensor || "sensor.4_vm_");
    const preB = slag === "ct" ? (c.prefiks_knapp || "button.3_ct_")
      : (c.prefiks_knapp || "button.4_vm_");
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith(pre) || !id.endsWith("_status")) continue;
      const eid = id.slice(pre.length, id.length - "_status".length);
      if (!eid) continue;
      const o = (c.overstyr || {})[eid] || {};
      if (o.skjul) continue;
      const navn = o.navn || this._rentNavn(S[id], ["Status"]) || eid.replace(/_/g, " ");
      const tj = eid.replace(/_\d+$/, "");
      const har = (x) => !!S[x];

      const info = [];
      for (const [n, f] of [["RAM brukt", "ram_used"], ["RAM totalt", "ram_total"],
        ["Disk brukt", "disk_used"], ["Disk totalt", "disk_total"],
        ["Nett RX", "network_rx"], ["Nett TX", "network_tx"]]) {
        if (har(`${pre}${eid}_${f}`)) info.push({ navn: n, entity: `${pre}${eid}_${f}` });
      }
      const knapper = [];
      /* `kNavn`, ikke `navn`: den ytre `navn` er enhetens navn, og skygget over
         løkkevariabelen — alle knappene het «Dispatcharr». */
      for (const [kNavn, f, ikon, farge, bekreft] of [
        ["Start", "start", "mdi:play", "var(--green)", null],
        ["Stopp", "stop", "mdi:stop", null, `Stoppe ${navn}?`],
        ["Restart", "reboot", "mdi:restart", "var(--orange)", `Restarte ${navn}?`],
        ["Pause", "pause", "mdi:pause", null, null],
        ["Fortsett", "resume", "mdi:play-pause", null, null],
        ["Dvale", "hibernate", "mdi:moon-waning-crescent", null, null],
        ["Av", "shutdown", "mdi:power", "var(--red)", `Slå av ${navn}?`],
        ["Reset", "reset", "mdi:restart-alert", "var(--red)",
          `Tvangsreset av ${navn}? Kan gi datatap.`],
      ]) {
        const b = `${preB}${eid}_${f}_${tj}`;
        if (!har(b)) continue;
        knapper.push({ navn: kNavn, entity: b, ikon, ...(farge ? { farge } : {}),
          ...(bekreft ? { bekreft } : {}) });
      }
      ut.push({
        navn, ikon: o.ikon || (slag === "vm" ? "mdi:desktop-tower" : "mdi:cube-outline"),
        /* Ingen `status_pa` her: standardlista dekker «running», «online», «on» og
           «started». Første utgave låste den til «running», og containere som melder
           «online» ble vist som nede i rødt selv om de kjørte. */
        status: id,
        ...(har(`${pre}${eid}_cpu_usage`)
          ? { tall: `${pre}${eid}_cpu_usage`, tall_enhet: " % CPU" } : {}),
        ...(har(`${pre}${eid}_ram_used`)
          ? { nokkel: `${pre}${eid}_ram_used`, nokkel_enhet: " RAM" } : {}),
        detalj: { navn, figur: "boks", status: id,
          status_pa: ["running", "Running", "RUNNING", "online", "Online", "on", "started"],
          tekst_pa: "Kjører", tekst_av: "Stoppet",
          ...(har(`${pre}${eid}_uptime`) ? { oppetid: `${pre}${eid}_uptime` } : {}),
          maalinger: har(`${pre}${eid}_cpu_usage`)
            ? [{ navn: "CPU", entity: `${pre}${eid}_cpu_usage`, enhet: "%" }] : [],
          info, knapper },
      });
    }
    return ut.sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }

  /* Tilstanden til én enhet: oppe, nede eller uten svar. Uten svar er noe annet enn
     nede — vi vet ikke, og det skal se annerledes ut. */
  _tilstand(e) {
    /* En flis uten statusentitet er ren navigasjon — «Disker», «Delinger». Den har
       ingen tilstand, og prikken skal ikke være rød eller grønn. */
    if (!e.status) return "nøytral";
    const st = this._st(e.status);
    if (!st || ["unavailable", "unknown", ""].includes(st.state)) return "borte";
    /* Sammenligningen er uten hensyn til store og små bokstaver, og lista dekker
       synonymene integrasjonene bruker. Proxmox Extended Sensors oppgir «running» for
       noen containere og «Running» eller «online» for andre, og en ordrett
       sammenligning mot «running» gjorde de andre røde selv om de kjørte. */
    const std = ["home", "on", "running", "online", "active", "started", "up", "ok"];
    const paa = [].concat(e.status_pa || std).map((x) => String(x).toLowerCase());
    const naa = String(st.state).toLowerCase();
    if (paa.includes(naa)) return "oppe";
    /* Er tilstanden noe vi ikke kjenner igjen i det hele tatt — verken «på» eller en
       kjent «av»-verdi — er det tryggere å vise den som uten svar enn som nede. Et
       falskt rødt kort er verre enn et spørsmålstegn. */
    const av = ["not_home", "off", "stopped", "offline", "inactive", "idle", "down",
      "paused", "suspended", "prelaunch", "hibernated"];
    return av.includes(naa) ? "nede" : "borte";
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

  /* Bygger en liste kort inn i en boks.
   *
   * Innebygde Home Assistant-kort — `grid`, `conditional`, `entities` — kan ikke lages
   * med `document.createElement("grid")`; de heter noe annet internt og finnes bare via
   * HAs egen korthjelper. Første utgave brukte tagnavnet for alt, og da ble et `grid`
   * stille droppet. Egendefinerte kort lages direkte, resten gjennom hjelperen.
   */
  async _lagKort(liste, boks) {
    let hjelper = null;
    const trengerHjelper = liste.some((k) => !String(k.type || "").startsWith("custom:"));
    if (trengerHjelper && window.loadCardHelpers) {
      try { hjelper = await window.loadCardHelpers(); } catch (e) { hjelper = null; }
    }
    for (const k of liste) {
      let el = null;
      const type = String(k.type || "");
      if (type.startsWith("custom:")) {
        const tag = type.slice("custom:".length);
        if (customElements.get(tag)) { el = document.createElement(tag); el.setConfig(k); }
      } else if (hjelper) {
        try { el = hjelper.createCardElement(k); } catch (e) { el = null; }
      }
      if (!el) {
        const d = document.createElement("div");
        d.className = "tom";
        d.textContent = `Fikk ikke laget kortet ${k.type || "(uten type)"}.`;
        boks.appendChild(d);
        continue;
      }
      boks.appendChild(el);
      this._barn.push(el);
      if (this._h) el.hass = this._h;
    }
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
        const e = this._enheter()[this._apen];
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
        this._barn = [];
        /* `kort:` lar en flis åpne hva som helst — en seksjon med flere kort, ikke bare
           en enhet. Det er dette som gjør flisene brukbare som navigasjon: Unraid-fanen
           blir fem fliser der hver åpner sin egen del. */
        if (e && Array.isArray(e.kort) && e.kort.length) {
          this._lagKort(e.kort, boks);
        } else if (e && e.detalj && customElements.get("ki-enhet-card")) {
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
      for (const k of (this._barn || [])) { if (k !== this._detalj) k.hass = this._h; }
      return;
    }

    this._sistApen = undefined;
    const enheter = this._enheter();
    const tilst = enheter.map((e) => this._tilstand(e));
    const oppe = tilst.filter((t) => t === "oppe").length;

    rot.innerHTML = `
      ${c.tittel ? `<div class="topprad">
        <span class="t">${kiRaEsc(c.tittel)}</span>
        <span class="s">${oppe} av ${enheter.length} oppe</span>
      </div>` : ""}
      <div class="rutenett" style="--kol:${Math.max(1, Math.min(3, Number(c.kolonner) || 2))}">
        ${enheter.map((e, i) => {
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

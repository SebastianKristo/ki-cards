/* ki-varsling-card – bryterne fra KI Varslinger og sikkerhet, funnet selv.
 *
 * Integrasjonen lager ett config entry per regel, med én enhet og som regel én bryter.
 * Kortet finner dem gjennom entitetsregisteret og grupperer per enhet, så lista aldri
 * blir utdatert: legger du til en regel, dukker den opp av seg selv.
 *
 * type: custom:ki-varsling-card
 * grupper: [varsling, sikkerhet]     # egne faner; utelates = alt i én liste
 * ekstra: [automation.vaermelding_ai]   # automasjoner som ikke hører til integrasjonen
 * master: true                       # bare hovedbryteren per regel (standard)
 * kjente: false                      # slå av innebygde navn og forklaringer
 * enheter: [Autolås, Dørlås]         # bare disse reglene (treff i enhetsnavnet)
 * ikke_enheter: [Alarm]              # alt unntatt disse
 * bare: [autolas_autolas]            # bare disse entitetene, i denne rekkefølgen
 * skjul: [autolas_autolas]           # bryter-slugger som ikke skal vises
 * navn: { autolas_autolas: 'Autolås' }
 * undertekst: { autolas_autolas: 'Låser døra etter lukking' }
 * skille: '-'                        # skilletegn i friendly_name: navn - beskrivelse
 * ikoner: { autolas_autolas: 'mdi:lock-clock' }
 * sok: true                          # søkefelt når det er mange
 * grupper: true                      # overskrift per enhet (av som standard)
 * teller: true                        # «2 av 5 på» nederst (av som standard)
 */
const KI_VARS_VERSJON = "1.0.0";
/* Flere integrasjoner kan ha varslingsbrytere. `ki_energi` legger alle sine på ÉN
   enhet, i motsetning til `ki_notifications` som har én enhet per regel. */
const KI_VARS_PLATTFORM = ["ki_notifications", "ki_energi"];

const KI_VARS_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:8px; color:var(--gray1000); }

  .sok { display:flex; align-items:center; gap:10px; background:var(--gray100);
    border-radius:999px; padding:0 8px 0 16px; height:44px; --mdc-icon-size:19px; }
  .sok input { flex:1; min-width:0; border:0; background:none; color:inherit;
    font:inherit; font-size:15px; outline:none; }
  .sok input::placeholder { color:currentColor; opacity:.4; }
  .sok button { width:30px; height:30px; flex:none; border:0; border-radius:50%;
    background:rgba(128,128,128,.18); color:inherit; cursor:pointer; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:16px; }

  .gruppe { display:grid; gap:8px; }
  .hode { display:flex; align-items:baseline; justify-content:space-between; gap:10px;
    padding:6px 6px 0; }
  .hode .h { font-size:13px; font-weight:600; }
  .hode .s { font-size:11.5px; opacity:.5; }

  /* Målene er hentet fra template_toggle_card_small i dashbordet: 66 px høy,
     75 px hjørner, 76 px ikonkolonne, navn 16/500 og etikett 14 med 0.7 i dekning.
     Ingen egne verdier her — det er den malen kortet skal se ut som. */
  .rad { display:grid; align-items:center; width:100%; border:0; cursor:pointer;
    font:inherit; text-align:left; height:66px; border-radius:75px;
    padding:4px 20px 4px 4px; background:var(--gray200); color:var(--gray1000);
    grid-template-columns:76px 1fr min-content;
    grid-template-areas:"i n bryter" "i l bryter"; }
  .rad .ikon { grid-area:i; justify-self:start; width:58px; height:58px;
    border-radius:50%; background:rgba(var(--highlight)); display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .rad .n { grid-area:n; justify-self:start; font-size:16px; font-weight:500;
    padding-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    max-width:100%; }
  .rad .l { grid-area:l; justify-self:start; font-size:14px; opacity:.7;
    padding-bottom:7px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    max-width:100%; }
  .rad .bryter { grid-area:bryter; justify-self:end; display:flex;
    align-items:center; --mdc-icon-size:40px; }
  .rad .bryter ha-icon { width:50px; height:40px; }

  /* Av er rød, som i malen: fargen sier «dette skjer ikke nå», og den er lettere å
     se i en lang liste enn en grå bryter. */
  .rad.av { background:var(--red); }
  .rad.av .n, .rad.av .l, .rad.av .ikon, .rad.av .bryter { color:var(--black); }
  .rad.av .ikon { background:rgba(0,0,0,.1); }
  .rad.borte { opacity:.45; }

  .tom { padding:16px 18px; border-radius:22px; background:var(--gray200);
    font-size:14px; opacity:.7; line-height:1.5; }
`;


const kiVaEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Ikon gjettes fra navnet når integrasjonen ikke gir et. Rekkefølgen betyr noe:
   «dorlas_fastkjort» skal treffe låsen, ikke varselet, så de mest spesifikke først. */
/* Navn og beskrivelse per regel, slik de sto i det håndskrevne oppsettet.
   Integrasjonens egne navn er tekniske («Alarm - Alle varsler»), og disse er de som
   faktisk forklarer hva bryteren gjør. `navn:` og `undertekst:` overstyrer. */
const KI_VARS_TEKST = [
  [/vekking|vekke/, "Vekking", "Lys og lyd på vekketidspunkt", "mdi:alarm"],
  [/ansikt/, "Ansiktsgjenkjenning", "Låser opp ved gjenkjent ansikt", "mdi:face-recognition"],
  [/autolas|autolås/, "Autolås", "Låser døra automatisk etter lukking", "mdi:lock-clock"],
  [/fastkjort|fastkjørt/, "Fastkjørt lås", "Varsel hvis låsen ikke går i lås", "mdi:lock-alert"],
  [/blink|dorlys|dørlys/, "Dørlys", "Blinker med lyset når døra åpnes", "mdi:monitor-shimmer"],
  [/familie|hjemme.?borte/, "Hjemme / borte", "Varsler når noen kommer eller drar", "mdi:home-account"],
  [/^alarm|alarm_/, "Alarm", "Aktiverer alarmsystemet", "mdi:shield-home"],
  [/heimdall|alarmo/, "Heimdall", "Synk mellom Heimdall og Alarmo", "mdi:sync"],
  [/ruter|skolen/, "Ruter fra skolen", "Avgangstider hjem etter forelesning", "mdi:bus-clock"],
  [/planter/, "Planter", "Varsel når plantene trenger vann", "mdi:flower-tulip"],
  [/stovsug|støvsug/, "Støvsuger", "Varsel om feil og fullført runde", "mdi:robot-vacuum"],
  [/home.?assistant|oppstart|startet/, "Home Assistant", "Varsel etter omstart av HA", "mdi:home-assistant"],
  [/vaermelding|værmelding|vaer_ai/, "Værmelding", "Daglig værvarsel fra AI", "mdi:weather-partly-cloudy"],
  [/stromforbruk|strømforbruk|forbruk.?rapport/, "Strømforbruk", "Daglig rapport", "mdi:chart-bar"],

  /* KI Utelys. Tre brytere på samme enhet, som ellers ville hett det samme. */
  [/ki_utelys_auto/, "Utelys automatikk", "Styrer utelysene etter solhøyden", "mdi:lightbulb-auto"],
  [/ki_utelys_morgen/, "Utelys morgen", "Lys om morgenen til det lysner", "mdi:weather-sunset-up"],
  [/ki_utelys_kveld/, "Utelys kveld", "Lys om kvelden når det blir mørkt", "mdi:weather-sunset-down"],

  /* KI Energi. Hovedbryteren først: den slår av alle de andre, og må ikke forveksles
     med `ki_varsel_effekt`, som bare gjelder effektgrensen. */
  [/\bki_energi_varsler\b/, "Energivarsler", "Hovedbryter for alle energivarsler", "mdi:bell-outline"],
  [/ki_varsel_effekt/, "Effektgrense", "Varsel når timen nærmer seg grensen", "mdi:flash-alert"],
  [/ki_varsel_hjemkomst/, "Hjemkomst", "Varsel når huset varmes opp før dere kommer", "mdi:home-import-outline"],
  [/ki_varsel_sommer/, "Sommermodus", "Varsel når sommermodus slår inn", "mdi:white-balance-sunny"],
  [/ki_varsel_vvb/, "Varmtvann", "Varsel om berederen og legionella", "mdi:water-boiler"],
  [/ki_varsel_hanklevarmer/, "Håndklevarmer", "Varsel om håndklevarmeren", "mdi:radiator"],
  [/ki_varsel_helg/, "Bortemodus", "Varsel når huset settes i bortemodus", "mdi:bag-suitcase"],
  [/ki_helg_spor_torsdag/, "Spør torsdag", "Spør om dere drar bort i helgen", "mdi:calendar-question"],
  [/ki_helg_spor_fredag/, "Spør fredag", "Spør igjen fredag hvis du ikke svarte", "mdi:calendar-question"],
];

const KI_VARS_IKON = [
  [/fastkjort|fastkj/, "mdi:lock-alert"],
  [/autolas|autolås/, "mdi:lock-clock"],
  [/las|lås|dor|dør/, "mdi:door-closed-lock"],
  [/alarm|heimdall|alarmo/, "mdi:shield-home"],
  [/ansikt|face/, "mdi:face-recognition"],
  [/familie|hjemme|borte|person/, "mdi:home-account"],
  [/stovsug|støvsug|vacuum/, "mdi:robot-vacuum"],
  [/vaer|vær|weather/, "mdi:weather-partly-cloudy"],
  [/ruter|buss|avgang/, "mdi:bus-clock"],
  [/strom|strøm|forbruk|energi/, "mdi:chart-bar"],
  [/oppstart|restart|startup/, "mdi:restart"],
  [/blink|lys|skjerm/, "mdi:monitor-shimmer"],
  [/rapport|daglig/, "mdi:file-document-outline"],
];

const kiVarsIkon = (tekst) => {
  const t = String(tekst || "").toLowerCase();
  for (const [m, ikon] of KI_VARS_IKON) if (m.test(t)) return ikon;
  return "mdi:bell-outline";
};

class KiVarslingCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._sok = ""; }
  static getStubConfig() { return { sok: true }; }

  static getConfigElement() {
    return document.createElement("ki-varsling-card-editor");
  }
  getCardSize() { return 6; }

  setConfig(c) {
    this._c = { plattform: KI_VARS_PLATTFORM, sok: true, ...(c || {}) };
    this._plattformer = [].concat(this._c.plattform);
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._brytere().map((b) => [b.id, b.pa]));
    if (sig !== this._sig || !this._bygget) { this._sig = sig; this._tegn(); }
  }

  /* Bryterne fra integrasjonen, pluss det som er lagt til manuelt i `ekstra`.
   *
   * Vi går gjennom entitetsregisteret og ikke gjennom tilstandene, fordi registeret er
   * det eneste stedet plattformen står. To brytere kan hete det samme og komme fra
   * ulike integrasjoner. */
  _brytere() {
    const h = this._h;
    if (!h) return [];
    const c = this._c;
    const reg = h.entities || {};
    const dev = h.devices || {};
    const skjul = new Set((c.skjul || []).map(String));
    const ut = [];

    const legg = (id, kilde) => {
      const st = h.states[id];
      if (!st) return;
      const slug = id.split(".")[1] || id;
      if (skjul.has(slug) || skjul.has(id)) return;
      const e = reg[id] || {};
      const enhet = (dev[e.device_id] || {}).name_by_user
        || (dev[e.device_id] || {}).name || "";
      const a = st.attributes || {};
      const eget = (c.navn || {})[slug] || (c.navn || {})[id];
      const egenUnder = (c.undertekst || {})[slug] || (c.undertekst || {})[id];

      /* Navn og undertekst hentes som i template_toggle_card_small: `friendly_name`
         deles på et skilletegn, navnet foran og beskrivelsen bak.
         «Vekking - Lys og lyd på vekketidspunkt» blir to linjer. */
      const skille = c.skille || "-";
      const helt = a.friendly_name || slug;
      const deler = helt.split(skille);
      let navn = deler[0].trim() || slug;
      let under = deler.length > 1 ? deler.slice(1).join(skille).trim() : "";

      /* Uten skilletegn i navnet faller vi tilbake til enhetsnavnet som overskrift og
         resten som beskrivelse — «Autolås Autolås» skal ikke stå to ganger. */
      if (!under && enhet && helt.toLowerCase().startsWith(enhet.toLowerCase() + " ")) {
        navn = enhet;
        under = helt.slice(enhet.length + 1).trim();
      }
      /* Kjente regler får navnet og forklaringen fra tabellen over. Den er mer presis
         enn integrasjonens tekniske navn, og sparer deg for å skrive dem i YAML-en. */
      let kjentIkon = null;
      if (c.kjente !== false) {
        const n = `${slug} ${enhet} ${helt}`.toLowerCase();
        for (const [m, kn, ku, ki] of KI_VARS_TEKST) {
          if (!m.test(n)) continue;
          navn = kn; under = ku; kjentIkon = ki; break;
        }
      }
      if (eget) navn = eget;
      if (egenUnder) under = egenUnder;
      ut.push({
        id, slug, kilde, plattform: (reg[id] || {}).platform || "",
        enhet: enhet || "Annet",
        navn: navn.trim() || slug,
        under,
        ikon: (c.ikoner || {})[slug] || (c.ikoner || {})[id]
          || kjentIkon || a.icon || kiVarsIkon(`${slug} ${navn}`),
        pa: st.state === "on",
        borte: ["unavailable", "unknown"].includes(st.state),
      });
    };

    for (const [id, e] of Object.entries(reg)) {
      if (!this._plattformer.includes(e.platform)) continue;
      if (!id.startsWith("switch.") && !id.startsWith("input_boolean.")) continue;
      /* KI Energi har 206 entiteter på én enhet, og bare noen få er varslingsbrytere.
         Vi tar bare dem som faktisk handler om varsling — resten er styring, og hører
         hjemme i klimakortet. */
      if (e.platform === "ki_energi" && !/varsel|varsler|spor_/.test(id)) continue;
      legg(id, "integrasjon");
    }
    for (const id of (c.ekstra || [])) legg(id, "ekstra");

    /* Én bryter per regel: hovedbryteren.
     *
     * «Alarm» har åtte entiteter og «Familie – hjemme/borte» ti, men bare én av dem er
     * den man vil ha i en oversikt — den som slår hele regelen av og på. Resten er
     * finjustering som hører hjemme i more-info, ikke i en liste man skummer.
     *
     * Hovedbryteren kjennes på navnet: «alle varsler», «aktivert», «varsling», eller
     * at den heter det samme som regelen. Finner vi ingen, viser vi alle bryterne for
     * den regelen — det er bedre enn å skjule noe vi ikke forstod. */
    if (c.master !== false) {
      const erMaster = (b) => /alle[ _-]?varsler|_aktivert$|_varsling$|_aktiv$/.test(b.id)
        || b.slug === b.enhet.toLowerCase().replace(/[^a-z0-9]+/g, "_")
        || /^(alle varsler|aktivert|varsling|aktiv)$/i.test(b.under || "");
      /* Mastermodus gjelder bare der én enhet ER én regel. KI Energi har alle sine
         varslingsbrytere på samme enhet, og da ville «hovedbryteren» skjult fem av seks
         — de er sidestilte valg, ikke underinnstillinger. */
      const perEnhet = new Map();
      for (const b of ut) {
        /* Mastermodus gjelder BARE der én enhet er én regel, som i ki_notifications.
           Før var unntaket hardkodet til ki_energi, og da falt enhver ny integrasjon
           med flere brytere på samme enhet sammen til én rad — KI Utelys sine tre
           viste seg som «KI Utelys» tre ganger. */
        if (b.kilde === "ekstra" || b.plattform !== "ki_notifications") continue;
        if (!perEnhet.has(b.enhet)) perEnhet.set(b.enhet, []);
        perEnhet.get(b.enhet).push(b);
      }

      const behold = new Set();
      /* Brytere fra KI Energi beholdes alltid: de er sidestilte valg på én enhet. */
      for (const b of ut) if (b.plattform !== "ki_notifications") behold.add(b.id);
      for (const [, liste] of perEnhet) {
        if (liste.length <= 1) { liste.forEach((b) => behold.add(b.id)); continue; }
        const m = liste.filter(erMaster);
        (m.length ? m : liste).forEach((b) => behold.add(b.id));
      }
      for (let i = ut.length - 1; i >= 0; i--) {
        if (ut[i].kilde !== "ekstra" && !behold.has(ut[i].id)) ut.splice(i, 1);
      }
    }

    /* Filtrering på ENHETSNAVN, ikke entitets-ID.
     *
     * Reglene heter det samme i alle installasjonene dine — «Autolås», «Alarm»,
     * «Ruter – fra skolen» — mens entitets-ID-ene varierer, og en installasjon har
     * bare noen av reglene. Et navnefilter overlever derfor flyttingen mellom Oslo,
     * Toten og Strömstad; en entitetsliste gjør det ikke.
     *
     * Treffet er delvis og uten hensyn til store bokstaver: «autolås» finner både
     * «Autolås» og «Autolås garasje». */
    const treff = (navn, liste) => liste.some((m) =>
      String(navn).toLowerCase().includes(String(m).toLowerCase()));
    if (c.enheter && c.enheter.length) {
      for (let i = ut.length - 1; i >= 0; i--) {
        if (!treff(ut[i].enhet, c.enheter) && ut[i].kilde !== "ekstra") ut.splice(i, 1);
      }
    }
    if (c.ikke_enheter && c.ikke_enheter.length) {
      for (let i = ut.length - 1; i >= 0; i--) {
        if (treff(ut[i].enhet, c.ikke_enheter)) ut.splice(i, 1);
      }
    }

    /* `bare:` er motsatt av `skjul:` og styrer også rekkefølgen. Med to faner som deler
       de samme bryterne er det langt enklere enn at hver fane må kjenne den andres
       innhold for å skjule det. */
    const bare = (c.bare || []).map(String);
    if (bare.length) {
      const rang = new Map(bare.map((x, i) => [x, i]));
      return ut
        .filter((b) => rang.has(b.slug) || rang.has(b.id))
        .sort((a, b) => (rang.get(a.slug) ?? rang.get(a.id))
                      - (rang.get(b.slug) ?? rang.get(b.id)));
    }
    return ut.sort((a, b) => a.enhet.localeCompare(b.enhet, "nb")
      || a.navn.localeCompare(b.navn, "nb"));
  }

  _tegn() {
    const c = this._c;
    let brytere = this._brytere();
    const alle = brytere.length;

    const sok = this._sok.trim().toLowerCase();
    if (sok) {
      brytere = brytere.filter((b) =>
        `${b.navn} ${b.under} ${b.enhet} ${b.slug}`.toLowerCase().includes(sok));
    }

    /* Grupperes per enhet, som er én regel i integrasjonen. Er det bare én gruppe,
       droppes overskriften — en overskrift over alt er ikke en gruppering. */
    const grupper = new Map();
    for (const b of brytere) {
      if (!grupper.has(b.enhet)) grupper.set(b.enhet, []);
      grupper.get(b.enhet).push(b);
    }
    /* Overskriften er av. Den fortalte «Autolås — 1 av 1 på» over én enkelt rad, og
       da sier den ingenting raden ikke alt viser. `grupper: true` slår den på for den
       som har mange regler og vil ha dem delt opp. */
    const flereGrupper = this._c.grupper === true && grupper.size > 1;
    const visSok = c.sok !== false && (alle >= (Number(c.sok_fra) || 8) || sok);

    const paa = brytere.filter((b) => b.pa).length;

    this.shadowRoot.innerHTML = `<style>${KI_VARS_STIL}</style>
      <div class="rot">
        ${visSok ? `<label class="sok">
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                 placeholder="Søk blant ${alle}" value="${kiVaEsc(this._sok)}" />
          ${sok ? `<button data-tom="1" aria-label="Tøm">
            <ha-icon icon="mdi:close"></ha-icon></button>` : ""}
        </label>` : ""}
        ${!alle ? `<div class="tom">Fant ingen brytere fra KI Varslinger og sikkerhet.
          Sjekk at integrasjonen er satt opp, eller sett <code>plattform:</code> hvis
          domenet heter noe annet.</div>`
        : !brytere.length ? `<div class="tom">Ingen treff på «${kiVaEsc(this._sok)}».</div>`
        : [...grupper.entries()].map(([enhet, liste]) => `
          <div class="gruppe">
            ${flereGrupper ? `<div class="hode">
              <span class="h">${kiVaEsc(enhet)}</span>
              <span class="s">${liste.filter((b) => b.pa).length} av ${liste.length} på</span>
            </div>` : ""}
            ${liste.map((b) => `
              <button class="rad ${b.pa ? "" : "av"} ${b.borte ? "borte" : ""}"
                      data-veksle="${kiVaEsc(b.id)}" data-mer="${kiVaEsc(b.id)}">
                <span class="ikon"><ha-icon icon="${kiVaEsc(b.ikon)}"></ha-icon></span>
                <span class="n">${kiVaEsc(b.navn)}</span>
                <span class="l">${kiVaEsc(b.under || (b.borte ? "Svarer ikke" : ""))}</span>
                <span class="bryter"><ha-icon icon="${
                  b.pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}"></ha-icon></span>
              </button>`).join("")}
          </div>`).join("")}
        ${this._c.teller === true && brytere.length ? `<div class="hode">
          <span class="s">${paa} av ${brytere.length} på</span></div>` : ""}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-veksle]")) {
      let holdt = null;
      const veksle = () => {
        const id = el.dataset.veksle;
        this._h.callService(id.split(".")[0], "toggle", { entity_id: id });
      };
      /* Langt trykk åpner entiteten. Uten det må man inn i innstillingene for å se
         hvilken automasjon en bryter egentlig styrer. */
      el.addEventListener("pointerdown", () => {
        holdt = setTimeout(() => {
          holdt = null;
          this.dispatchEvent(new CustomEvent("hass-more-info",
            { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
        }, 500);
      });
      el.addEventListener("pointerup", () => {
        if (holdt) { clearTimeout(holdt); holdt = null; veksle(); }
      });
      el.addEventListener("pointercancel", () => { clearTimeout(holdt); holdt = null; });
    }

    const felt = this.shadowRoot.querySelector(".sok input");
    if (felt) {
      felt.addEventListener("input", (e) => {
        const pos = e.target.selectionStart;
        this._sok = e.target.value;
        this._tegn();
        const ny = this.shadowRoot.querySelector(".sok input");
        if (ny) { ny.focus(); try { ny.setSelectionRange(pos, pos); } catch (x) { /* ok */ } }
      });
    }
    const tom = this.shadowRoot.querySelector("[data-tom]");
    if (tom) tom.addEventListener("click", () => { this._sok = ""; this._tegn(); });

    this._bygget = true;
  }
}

/* ------------------------------------------------------------------ editor
 *
 * Poenget er at nye integrasjoner skal kunne legges til uten å redigere YAML.
 * Plattformlista fylles derfor fra entitetsregisteret: alt som faktisk finnes hos
 * deg står der, og du huker av det som skal med.
 */
class KiVarslingEditor extends HTMLElement {
  setConfig(c) {
    const tekst = JSON.stringify(c || {});
    /* HA sender konfigurasjonen tilbake etter hver endring. Bygger vi om da, mister
       tekstfeltet markøren midt i et ord. */
    if (this._sisteUt === tekst) { this._c = JSON.parse(tekst); return; }
    this._c = JSON.parse(tekst);
    this._r();
  }

  set hass(h) {
    const forste = !this._h;
    this._h = h;
    for (const el of this._felt || []) el.hass = h;
    if (forste) this._r();
  }

  _ut() {
    this._sisteUt = JSON.stringify(this._c);
    this.dispatchEvent(new CustomEvent("config-changed",
      { detail: { config: this._c }, bubbles: true, composed: true }));
  }

  /* Alle plattformer som har brytere hos deg, med antall.
     Antallet er med fordi «ki_energi (206)» og «ki_notifications (14)» sier noe om
     hva man er i ferd med å slå på. */
  _plattformer() {
    const reg = (this._h && this._h.entities) || {};
    const teller = {};
    for (const [id, e] of Object.entries(reg)) {
      if (!id.startsWith("switch.") && !id.startsWith("input_boolean.")) continue;
      if (!e.platform) continue;
      teller[e.platform] = (teller[e.platform] || 0) + 1;
    }
    return Object.entries(teller)
      .sort((a, b) => b[1] - a[1])
      .map(([p, n]) => ({ value: p, label: `${p} (${n})` }));
  }

  _r() {
    if (!this._h || !this._c) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._felt = [];

    const valgt = [].concat(this._c.plattform || KI_VARS_PLATTFORM);

    this.shadowRoot.innerHTML = `<style>
      :host { display:block; }
      h4 { margin:14px 0 4px; font-size:15px; }
      .merk { font-size:13px; opacity:.65; line-height:1.5; margin:6px 0 0; }
    </style><div id="skjema"></div>`;

    const f = document.createElement("ha-form");
    f.hass = this._h;
    f.data = {
      plattform: valgt,
      enheter: (this._c.enheter || []).join(", "),
      ikke_enheter: (this._c.ikke_enheter || []).join(", "),
      ekstra: this._c.ekstra || [],
      master: this._c.master !== false,
      grupper: !!this._c.grupper,
      teller: !!this._c.teller,
      sok: this._c.sok !== false,
    };
    f.schema = [
      { name: "plattform", selector: { select: { multiple: true, mode: "list",
        options: this._plattformer() } } },
      { name: "enheter", selector: { text: {} } },
      { name: "ikke_enheter", selector: { text: {} } },
      { name: "ekstra", selector: { entity: { multiple: true,
        domain: ["switch", "input_boolean", "automation"] } } },
      { name: "visning", type: "expandable", flatten: true, icon: "mdi:eye-settings",
        schema: [
          { name: "master", selector: { boolean: {} } },
          { name: "grupper", selector: { boolean: {} } },
          { name: "teller", selector: { boolean: {} } },
          { name: "sok", selector: { boolean: {} } },
        ] },
    ];
    f.computeLabel = (x) => ({
      plattform: "Integrasjoner",
      enheter: "Bare disse (skilt med komma)",
      ikke_enheter: "Ikke disse (skilt med komma)",
      ekstra: "Ekstra brytere",
      visning: "Visning",
      master: "Bare hovedbryteren per regel",
      grupper: "Gruppér etter enhet",
      teller: "Vis antall",
      sok: "Søkefelt",
    }[x.name] || x.name);

    f.addEventListener("value-changed", (e) => {
      e.stopPropagation();
      const v = e.detail.value;
      const liste = (t) => String(t || "").split(",")
        .map((x) => x.trim()).filter(Boolean);

      this._c.plattform = v.plattform && v.plattform.length
        ? v.plattform : undefined;
      this._c.enheter = liste(v.enheter).length ? liste(v.enheter) : undefined;
      this._c.ikke_enheter = liste(v.ikke_enheter).length
        ? liste(v.ikke_enheter) : undefined;
      this._c.ekstra = (v.ekstra || []).length ? v.ekstra : undefined;
      /* Standardverdier ut av YAML-en, så den ikke fylles med `grupper: false`
         og lignende som ser ut som noe man har valgt. */
      this._c.master = v.master === false ? false : undefined;
      this._c.grupper = v.grupper ? true : undefined;
      this._c.teller = v.teller ? true : undefined;
      this._c.sok = v.sok === false ? false : undefined;
      for (const k of Object.keys(this._c)) {
        if (this._c[k] === undefined) delete this._c[k];
      }

      /* Skjemaet MÅ få de nye verdiene tilbake.
       *
       * `ha-form` styres av `data`. Vi hopper over ombyggingen når HAs ekko kommer,
       * og uten denne linja sto `data` igjen med de gamle verdiene — avkrysningen
       * spratt tilbake, og det så ut som ingenting skjedde da man trykket. */
      f.data = {
        plattform: this._c.plattform || [].concat(KI_VARS_PLATTFORM),
        enheter: (this._c.enheter || []).join(", "),
        ikke_enheter: (this._c.ikke_enheter || []).join(", "),
        ekstra: this._c.ekstra || [],
        master: this._c.master !== false,
        grupper: !!this._c.grupper,
        teller: !!this._c.teller,
        sok: this._c.sok !== false,
      };

      this._ut();
    });
    this._felt.push(f);
    this.shadowRoot.querySelector("#skjema").appendChild(f);

    const merk = document.createElement("p");
    merk.className = "merk";
    merk.textContent = "Integrasjonene viser alle som har brytere hos deg, med antall. "
      + "«Bare disse» og «Ikke disse» filtrerer på regelnavn, ikke entitets-ID — "
      + "delvis treff holder, og store og små bokstaver spiller ingen rolle.";
    this.shadowRoot.appendChild(merk);
  }
}

if (!customElements.get("ki-varsling-card-editor"))
  customElements.define("ki-varsling-card-editor", KiVarslingEditor);

customElements.define("ki-varsling-card", KiVarslingCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-varsling-card"))
  window.customCards.push({ type: "ki-varsling-card", name: "KI Varsling",
    description: "Bryterne fra KI Varslinger og sikkerhet, funnet automatisk",
    preview: true });

/*!
 * ki-basseng-card 3.1.0 - del av ki-cards
 * Kort for integrasjonen ki_basseng: sirkulasjon, varme og spreder.
 *
 * 2.0: fanen Varme for KI Basseng 1.3 – temperatur mot målet med −/+ for ønsket
 *   temperatur, pooltaket som stor bryter, nattsenkingen (vindu, besparelse, hvorfor)
 *   og klorloggen. Oversikt får fliser for pooltak, nattsenking og klor, og varsler
 *   øverst. Mot eldre integrasjon uten varmemodell skjules alt dette av seg selv.
 * 2.1: ny temperaturgraf (endring, maks/min, natt, pumpe- og varmebaner), klorkalender
 *   og «hvem la i» med navn fra integrasjonen, og fanene satt sammen til færre flater.
 * 2.2: kompakt, klor-ark med navn og redigerbar kalender, vintermodus, pooltak fra
 *   sensor og varsel når den ikke varmer.
 * 2.3: høydene tilbake som før 2.2, og klor logges i kortet i stedet for i et ark.
 * 2.4: «Spart i dag» folder ut oppdelingen, og fanerada ruller som i ki-tabs-card.
 * 3.0: nytt oppsett, satt sammen av dashbordets Tesla-, Strøm-, Innstillinger- og
 *   Pult-kort. Bassengscenen og hurtigknappene står øverst på alle faner, og fanene er
 *   Oversikt, Varme, Klor og Spreder (Innstillinger bak tannhjulet).
 *   – Oversikt: vann og «spart i dag» som fliser du blar i, én setning om hva som skjer
 *     («Vannet når 27° om ca 2 t 10 min …»), dagens tall, profilene som scener og
 *     bryterne som fargede rader.
 *   – Varme: varmepumpa og effekten, forvalg for ønsket temperatur, hva det koster å nå
 *     målet, grafen med underfaner for temperatur, sirkulasjon og pris, nattsenkingen
 *     som lilla kort, og pooltak og vintermodus som bilder.
 *   – Klor: trykk på den som la i, antall, kalenderen og klorloggens innstillinger.
 *   En `faner:`-liste skrevet for 2.x (uten klor) får Klor etter Varme, og Sirkulasjon
 *   faller bort – den ligger under grafen på Varme nå.
 * 3.1: setningene tegnes av ki-prosa-card (som forsideteksten), flisene du blar i er som
 *   css-swipe-card i Strøm-kortet, og temperaturvalgene er kvadratiske som ladegrense-
 *   knappene i Tesla-kortet.
 *
 * - Faneskinne øverst (samme pilleform som etasjefanene i ki-hjem-card);
 *   faner: false gir én flyt med utvidbare seksjoner i stedet.
 * - Knappefliser i samme stil som button-card-flisene (gray200 -> active-big).
 * - Tallvalg bruker <select>, så iOS/Android viser sin egen hjulvelger.
 * - Grafer hentes fra HA sin historikk, ikke fra en ekstra sensor.
 * - Tegner bare når bassengets egne entiteter faktisk har endret seg.
 *
 * hero: false    – ta vekk vannheroen fra Oversikt (når den står som eget kort i dashbordet)
 * visning: hero  – bare vannheroen (temperatur, status, omsetninger), som eget kort i dashbordet.
 *
 * Varmepumpe og hurtigknapper (1.11) – det som før lå som egne kort over kortet i popupen:
 *   varmepumpe: climate.basseng_bassengvarmepumpe
 *   stillemodus: switch.baseng_basengvarmepumpe_stillemodus
 *   hurtig:
 *     - entity: light.bassenglys
 *       navn: Lys
 *     - entity: switch.bassengpumpe
 *       navn: Pumpe
 */
(() => {
  "use strict";

  if (customElements.get("ki-basseng-card")) return;

  const VERSJON = "3.1.0";

  /* Finner LitElement i frontend.
   *
   * Gammel utgave tok prototypen til ett HA-element og antok at `html` og `css` lå på
   * den. Det holder bare så lenge arvekjeden er nøyaktig ett ledd dyp, og Home
   * Assistant har flyttet på den: er det et mellomledd — en mixin — mellom elementet
   * og LitElement, er `html` ikke der, og kortet registrerer seg aldri.
   *
   * Nå går vi OPPOVER kjeden til vi finner et ledd som faktisk har `html` og `css`, og
   * vi prøver flere elementer. Det tåler et mellomledd uten å vite hva det heter.
   */
  const finnLit = () => {
    const kandidater = [
      "ha-panel-lovelace", "hui-view", "hui-masonry-view", "hui-sections-view",
      "home-assistant-main", "ha-card", "hui-entities-card", "ha-panel-config",
    ];
    for (const navn of kandidater) {
      let k = customElements.get(navn);
      if (!k) continue;
      // maks ti ledd; kjeden er kort, og en løkke uten tak er en løkke som kan henge
      for (let i = 0; i < 10 && k; i++) {
        k = Object.getPrototypeOf(k);
        if (k && k.prototype && k.prototype.html && k.prototype.css) return k;
      }
    }
    return null;
  };

  const start = (LitElement) => {
    const html = LitElement.prototype.html;
    const css = LitElement.prototype.css;

    /* ---------------------------------------------------------------- */
    /* Entiteter og tekster                                              */
    /* ---------------------------------------------------------------- */

    const KEYS = {
      modus: ["sensor", ["pumpemodus"]],
      omsetninger: ["sensor", ["omsetninger_i_dag"]],
      volum: ["sensor", ["pumpet_volum_i_dag"]],
      volumTotalt: ["sensor", ["pumpet_volum_totalt"]],
      pumpetid: ["sensor", ["pumpetid_i_dag"]],
      nesteStart: ["sensor", ["neste_pumpestart"]],
      pumpeEffekt: ["sensor", ["pumpe_effekt"]],
      vpEffekt: ["sensor", ["varmepumpe_effekt"]],
      pumpeEnergi: ["sensor", ["pumpe_energi_i_dag"]],
      vpEnergi: ["sensor", ["varmepumpe_energi_i_dag"]],
      kostnad: ["sensor", ["kostnad_i_dag"]],
      spart: ["sensor", ["spart_i_dag"]],
      vanntemp: ["sensor", ["vanntemperatur"]],
      spredertid: ["sensor", ["spreder_gjenstar"]],
      skalGa: ["binary_sensor", ["pumpe_skal_ga"]],
      spreder: ["binary_sensor", ["spreder_kjorer"]],
      overstyrt: ["binary_sensor", ["manuell_overstyring"]],
      vpVenter: ["binary_sensor", ["varmepumpe_venter"]],
      auto: ["switch", ["automatikk"]],
      pris: ["switch", ["prisstyring"]],
      varme: ["switch", ["varmeprioritet"]],
      tvingVarme: ["switch", ["tving_oppvarming"]],
      styrVp: ["switch", ["styr_varmepumpe"]],
      pulsVarme: ["switch", ["puls_med_varme"]],
      spredprogram: ["switch", ["spreder_program"]],
      frostvakt: ["switch", ["frostvakt"]],
      mal: ["number", ["omsetninger_per_dogn", "omsetninger_mal"]],
      puls: ["number", ["vedlikeholdspuls"]],
      minTid: ["number", ["minste_kjoretid"]],
      overstyringTid: ["number", ["manuell_overstyring_varer", "overstyring_varighet"]],
      dagtimer: ["number", ["dagtimer_i_planen", "dagtimer"]],
      varmeStart: ["number", ["varmevindu_start"]],
      varmeSlutt: ["number", ["varmevindu_slutt"]],
      basislast: ["number", ["pumpe_basislast"]],
      spredVarighet: ["number", ["spreder_varighet"]],
      spredIntervall: ["number", ["spreder_intervall"]],
      spredMaks: ["number", ["spreder_maks_per_dogn", "spreder_maks"]],
      profil: ["select", ["driftsprofil"]],
      startSpreder: ["button", ["start_spreder"]],
      stoppSpreder: ["button", ["stopp_spreder"]],
      boost: ["button", ["boost_sirkulasjon"]],
      nullstill: ["button", ["nullstill_dagens_tellere", "nullstill_i_dag"]],
      /* Varmemodellen og klorloggen (KI Basseng 1.3) */
      maltemp: ["sensor", ["maltemperatur"]],
      senking: ["sensor", ["nattsenking"]],
      senkingSpar: ["sensor", ["nattsenking_besparelse"]],
      varmetap: ["sensor", ["varmetap"]],
      sol: ["sensor", ["solinnstraling"]],
      sisteKlor: ["sensor", ["siste_klortablett"]],
      nesteKlor: ["sensor", ["neste_klortablett"]],
      klorForfall: ["binary_sensor", ["klortablett_bor_legges_i"]],
      hjemme: ["binary_sensor", ["noen_hjemme"]],
      senkingAktiv: ["binary_sensor", ["nattsenking_aktiv"]],
      smartSenking: ["switch", ["smart_nattsenking"]],
      pooltak: ["switch", ["pooltak_pa", "pooltak"]],
      styrSettpunkt: ["switch", ["styr_settpunkt"]],
      solvarme: ["switch", ["solvarme"]],
      tvingHeat: ["switch", ["tving_varmepumpa_til_heat", "tving_heat"]],
      onsketTemp: ["number", ["onsket_temperatur"]],
      borteSenking: ["number", ["senking_nar_ingen_er_hjemme", "borte_senking"]],
      maksSenking: ["number", ["maks_nattsenking"]],
      uApen: ["number", ["varmetap_uten_tak"]],
      uTak: ["number", ["varmetap_med_tak"]],
      solTak: ["number", ["sol_gjennom_taket"]],
      klorIntervall: ["number", ["klortablett_intervall"]],
      kriterium: ["select", ["nattsenking_skal_spare", "nattsenking_kriterium"]],
      loggKlor: ["button", ["logg_klortablett"]],
      angreKlor: ["button", ["angre_siste_klortablett", "angre_klortablett"]],
      klorNavn: ["text", ["navn_i_klorloggen", "klor_navn"]],
      klorKalender: ["calendar", ["klorlogg"]],
      /* Vinter (KI Basseng 1.5) */
      vintermodus: ["switch", ["vintermodus"]],
      frostVarme: ["binary_sensor", ["frostsikring_varmer"]],
      frostUnder: ["number", ["frostsikring_varme_pa_under", "frost_varme_under"]],
      frostSirk: ["number", ["frostsikring_sirkulasjon_under", "frost_sirkulasjon_under"]],
      vinterOms: ["number", ["omsetninger_per_dogn_om_vinteren", "vinter_omsetninger"]],
    };

    const MODUS = {
      filtrering: ["Filtrerer", "var(--kib-blue)", "mdi:pump"],
      oppvarming: ["Varmer opp", "var(--kib-orange)", "mdi:heat-wave"],
      vedlikehold: ["Vedlikehold", "var(--kib-accent)", "mdi:timer-play-outline"],
      boost: ["Boost", "var(--kib-accent)", "mdi:fan-plus"],
      spreder: ["Spreder", "var(--kib-blue)", "mdi:sprinkler"],
      hvile: ["Hviler", "var(--kib-muted)", "mdi:pause"],
      manuell: ["Manuell", "var(--kib-red)", "mdi:hand-back-right-outline"],
      solvarme: ["Solvarme", "var(--kib-orange)", "mdi:solar-power-variant"],
      vinter: ["Vinter", "var(--kib-blue)", "mdi:snowflake"],
      frostsikring: ["Frostsikring", "var(--kib-blue)", "mdi:snowflake-alert"],
    };

    /* Nattsenkingens tilstand: tekst, farge, ikon */
    const SENKING = {
      aktiv: ["Varmepumpa står av", "var(--kib-purple)", "mdi:weather-night"],
      planlagt: ["Planlagt i natt", "var(--kib-accent)", "mdi:calendar-clock"],
      lonner_seg_ikke: ["Lønner seg ikke i natt", "var(--kib-muted)", "mdi:scale-balance"],
      av: ["Av", "var(--kib-muted)", "mdi:power-off"],
    };

    const KRITERIUM = {
      begge: "Penger, aldri mer strøm",
      kostnad: "Penger",
      energi: "Strøm (kWh)",
    };

    const PROFIL = {
      eco: "Eco",
      balansert: "Balansert",
      badeklar: "Badeklar",
      ferie: "Ferie",
      egendefinert: "Egen",
    };

    /* Profilene som scener (3.0) */
    const PROFIL_IKON = {
      eco: "mdi:leaf",
      balansert: "mdi:scale-balance",
      badeklar: "mdi:star-outline",
      ferie: "mdi:airplane",
      egendefinert: "mdi:tune-variant",
    };

    const nf = (v, d = 1) =>
      v === null || v === undefined || v === "" || isNaN(v)
        ? "–"
        : Number(v).toFixed(d).replace(".", ",");

    const klokke = (iso) => {
      if (!iso || typeof iso !== "string") return null;
      const d = new Date(iso);
      return isNaN(d) ? null : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    };

    /* «2 t 10 min»: minutter som i en setning, rundet så det ikke later som det er
       mer nøyaktig enn modellen er. */
    const varighet = (min) => {
      const m = Number(min);
      if (!isFinite(m) || m < 0) return "–";
      if (m < 55) return `${Math.max(5, Math.round(m / 5) * 5)} min`;
      if (m < 600) {
        let t = Math.floor(m / 60);
        let r = Math.round((m - t * 60) / 10) * 10;
        if (r === 60) { t += 1; r = 0; }
        return r ? `${t} t ${r} min` : `${t} t`;
      }
      if (m < 2880) return `${Math.round(m / 60)} t`;
      return `${Math.round(m / 1440)} døgn`;
    };

    /* «ca 2 kroner», «ca 60 øre»: beløp som i en setning. */
    const kroner = (v, valuta = "kr") => {
      const n = Number(v);
      if (!isFinite(n)) return "–";
      const kr = /^(kr|nok|sek|dkk)$/i.test(String(valuta || "kr").trim());
      if (kr && Math.abs(n) < 1) return `${Math.max(1, Math.round(Math.abs(n) * 100))} øre`;
      const t = nf(n, 0);
      return kr ? `${t} ${t === "1" ? "krone" : "kroner"}` : `${t} ${valuta}`;
    };

    /* «23:00–04:00» blir «23–04» når det er hele timer. */
    const kortVindu = (fra, til) => {
      if (!fra || !til) return "";
      const k = (x) => String(x).replace(/:00$/, "");
      return /:00$/.test(fra) && /:00$/.test(til) ? `${k(fra)}–${k(til)}` : `${fra}–${til}`;
    };

    const dagNokkel = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    const blokker = (timer) => {
      const ut = [];
      let fra = null;
      let forrige = null;
      for (const t of timer) {
        if (fra === null) fra = t;
        else if (t !== forrige + 1) {
          ut.push([fra, forrige + 1]);
          fra = t;
        }
        forrige = t;
      }
      if (fra !== null) ut.push([fra, forrige + 1]);
      return ut;
    };

    /* ---------------------------------------------------------------- */
    /* Kortet                                                            */
    /* ---------------------------------------------------------------- */

    class KiBassengCard extends LitElement {
      static get properties() {
        return {
          hass: {},
          _config: {},
          _apne: { state: true },
          _fane: { state: true },
          _hist: { state: true },
          _timer: { state: true },
          _under: { state: true },
          _sveipIdx: { state: true },
        };
      }

      static getStubConfig() {
        return { type: "custom:ki-basseng-card", tittel: "Badebasseng" };
      }

      static getConfigElement() {
        return document.createElement("ki-basseng-card-editor");
      }

      constructor() {
        super();
        this._apne = {};
        this._fane = null;
        this._hist = null;
        this._timer = 24;
        this._ider = new Map();
        this._prefiks = null;
        this._modusId = null;
        this._sistSok = 0;
        this._sistHist = 0;
        this._henter = false;
        this._kalMnd = 0;
        this._kalValgt = null;
        this._under = "temperatur";
        this._sveipIdx = {};
      }

      setConfig(config) {
        /* Ingen tittel over fanerada som standard. «Badebasseng» sto både i
           popup-overskriften og her, og gjentakelsen stjal en linje. `tittel:` med en
           verdi viser den likevel. */
        /* Grafen er på igjen: den viser nå temperatur OG sirkulasjon i samme bilde,
           som er det den skulle vise hele tiden. `graf: false` skrur den av. */
        this._config = { tittel: "", graf: true, ...config };
        this._ider.clear();
        this._prefiks = this._config.prefix || null;
        this._modusId = null;
        this._hist = null;
      }

      getCardSize() {
        return 12;
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        this._sistHist = 0;
        if (this._fanerRo) { this._fanerRo.disconnect(); this._fanerRo = null; }
        this._fanerRad = null;
      }

      /* --- ytelse -------------------------------------------------- */

      shouldUpdate(endret) {
        if (!endret.has("hass") || endret.size > 1) return true;
        const gammel = endret.get("hass");
        if (!gammel || !this.hass) return true;
        for (const id of this._ider.values()) {
          if (id && gammel.states[id] !== this.hass.states[id]) return true;
        }
        /* Varmepumpa og hurtigknappene ligger utenfor integrasjonen, så de må følges for seg. */
        for (const id of this._eksterne()) {
          if (gammel.states[id] !== this.hass.states[id]) return true;
        }
        return this._ider.size === 0;
      }

      updated() {
        if (this._config.graf !== false) this._hentHistorikk();
        this._fanerad();
      }

      /* Fanerada oppfører seg som ki-tabs-card med style: auto. Får fanene plass, er
       * det vanlige piller. Gjør de ikke det, blir rada rullbar med tonede kanter, og
       * den valgte fanen rulles inn i midten.
       *
       * To ting gjorde at den ikke lot seg rulle før:
       *  1. Rada kunne ikke krympe under innholdet sitt (flex-elementer har min-width
       *     auto). Den ble bredere enn kortet og ble klippet, i stedet for å rulle.
       *  2. Pillehjelperen setter touch-action: none på fanene, slik at pilla kan dras.
       *     Da kunne man ikke rulle med fingeren på en fane – og fanene fyller rada.
       * Begge er rettet i stilen; her kobles kantene og rullingen til den valgte. */
      _fanerad() {
        const rad = this.shadowRoot && this.shadowRoot.querySelector(".faner");
        if (!rad) return;
        const kanter = () => {
          const mer = rad.scrollWidth - rad.clientWidth;
          rad.classList.toggle("ruller", mer > 2);
          rad.classList.toggle("mer-v", rad.scrollLeft > 4);
          rad.classList.toggle("mer-h", rad.scrollLeft < mer - 4);
        };
        if (rad !== this._fanerRad) {
          this._fanerRad = rad;
          this._sistRullet = null;
          rad.addEventListener("scroll", kanter, { passive: true });
          /* Vannrett hjul på PC: loddrett skroll på rada ruller den sidelengs */
          rad.addEventListener("wheel", (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            if (rad.scrollWidth <= rad.clientWidth) return;
            e.preventDefault();
            rad.scrollLeft += e.deltaY;
          }, { passive: false });
          if (this._fanerRo) this._fanerRo.disconnect();
          if (window.ResizeObserver) {
            this._fanerRo = new ResizeObserver(() => { kanter(); this._rullTilFane(true); });
            this._fanerRo.observe(rad);
          }
        }
        if (this._sistRullet !== this._fane) {
          const forste = this._sistRullet === null;
          this._sistRullet = this._fane;
          requestAnimationFrame(() => this._rullTilFane(forste));
        }
        kanter();
      }

      _rullTilFane(uten = false) {
        const rad = this._fanerRad;
        const a = rad && rad.querySelector(".fane.aktiv");
        if (!rad || !a || rad.scrollWidth <= rad.clientWidth + 2) return;
        const mal = a.offsetLeft - (rad.clientWidth - a.offsetWidth) / 2;
        rad.scrollTo({ left: Math.max(0, mal), behavior: uten ? "auto" : "smooth" });
      }

      /* --- oppslag -------------------------------------------------- */

      _finnPrefiks() {
        if (this._prefiks && this._modusId) return this._prefiks;
        const na = Date.now();
        if (na - this._sistSok < 30000 && this._prefiks) return this._prefiks;
        this._sistSok = na;

        const states = this.hass.states;
        for (const id in states) {
          if (!id.startsWith("sensor.")) continue;
          const a = states[id].attributes;
          if (a.integrasjon !== "ki_basseng") continue;
          if (this._config.prefix && a.prefiks !== this._config.prefix) continue;
          this._modusId = id;
          this._prefiks =
            a.prefiks || id.slice(7).replace(/_pumpemodus(_\d+)?$/, "");
          return this._prefiks;
        }
        if (this._config.prefix) return this._config.prefix;
        for (const id in states) {
          if (id.startsWith("sensor.") && id.endsWith("_pumpemodus")) {
            this._prefiks = id.slice(7, -11);
            return this._prefiks;
          }
        }
        return (this._prefiks = "ki_basseng");
      }

      id(key) {
        const husket = this._ider.get(key);
        if (husket && this.hass.states[husket]) return husket;
        const spec = KEYS[key];
        if (!spec) return null;
        const prefiks = this._finnPrefiks();
        if (key === "modus" && this._modusId) {
          this._ider.set(key, this._modusId);
          return this._modusId;
        }
        const [domain, haler] = spec;
        for (const hale of haler) {
          const id = `${domain}.${prefiks}_${hale}`;
          if (this.hass.states[id]) {
            this._ider.set(key, id);
            return id;
          }
        }
        return null;
      }

      st(key) {
        const id = this.id(key);
        return id ? this.hass.states[id] : undefined;
      }

      val(key, fallback = null) {
        const s = this.st(key);
        if (!s || s.state === "unknown" || s.state === "unavailable") return fallback;
        const n = Number(s.state);
        return isNaN(n) ? s.state : n;
      }

      attr(key, navn, fallback) {
        const s = this.st(key);
        const v = s ? s.attributes[navn] : undefined;
        return v === undefined ? fallback : v;
      }

      /* Bryteren viser det du nettopp valgte, til entiteten svarer.
       *
       * Et trykk på «Program på» sender tjenestekallet, men flisen sto i gammel tilstand
       * til integrasjonen hadde skrevet den nye og Home Assistant hadde sendt den
       * tilbake – gjerne et par sekunder. Det leses som at trykket ikke tok. Nå vises
       * valget med en gang, og slippes så snart entiteten er enig (eller etter 5 s hvis
       * den aldri ble det – da var det noe som ikke tok, og flisen skal si sannheten). */
      on(key) {
        const s = this.st(key);
        const faktisk = !!s && s.state === "on";
        const o = this._opt && this._opt[key];
        if (o) {
          if (o.pa === faktisk || Date.now() - o.t > 5000) delete this._opt[key];
          else return o.pa;
        }
        return faktisk;
      }

      enhet(key) {
        const s = this.st(key);
        return (s && s.attributes.unit_of_measurement) || "";
      }

      /* --- historikk ------------------------------------------------ */

      async _hentHistorikk(tvang = false) {
        if (this._henter || !this.hass) return;
        const na = Date.now();
        if (!tvang && na - this._sistHist < 300000) return;
        const temp = this.id("vanntemp");
        const effekt = this.id("pumpeEffekt");
        const vp = this.id("vpEffekt");
        if (!temp) return;
        this._henter = true;
        this._sistHist = na;
        try {
          const start = new Date(na - this._timer * 3600000).toISOString();
          const svar = await this.hass.callWS({
            type: "history/history_during_period",
            start_time: start,
            entity_ids: [temp, effekt, vp].filter(Boolean),
            minimal_response: true,
            no_attributes: true,
            significant_changes_only: false,
          });
          const les = (id) =>
            (svar[id] || [])
              .map((r) => ({ t: (r.lu || r.last_updated) * 1000, v: Number(r.s ?? r.state) }))
              .filter((r) => !isNaN(r.v) && r.t);
          this._hist = {
            fra: na - this._timer * 3600000,
            til: na,
            temp: les(temp),
            effekt: effekt ? les(effekt) : [],
            vp: vp ? les(vp) : [],
          };
        } catch (e) {
          this._hist = { feil: true };
        } finally {
          this._henter = false;
        }
      }

      /* Sirkulasjon og oppvarming over samme tid.
       *
       * Temperaturgrafen viser resultatet; denne viser arbeidet. Pumpa som fylt blå
       * flate, varmepumpa som oransje over — da ser du om varmen kom mens vannet
       * sirkulerte, som er hele forutsetningen for at den varmer noe.
       *
       * Skalaen er felles for de to, ellers ville en pumpe på 200 W sett like stor ut
       * som en varmepumpe på 2 kW.
       */
      _grafArbeid() {
        const h = this._hist;
        if (!h || h.feil) return html`<div class="dempet senter graf-tom">Henter historikk …</div>`;
        const pumpe = h.effekt || [];
        const vp = h.vp || [];
        if (pumpe.length < 2 && vp.length < 2) {
          return html`<div class="dempet senter graf-tom">
            Ingen effektmåling på pumpe eller varmepumpe.</div>`;
        }
        const B = 320;
        const H = 74;
        const fra = h.fra;
        const til = h.til;
        const maks = Math.max(100, ...pumpe.map((p) => p.v), ...vp.map((p) => p.v));
        const X = (t) => ((t - fra) / (til - fra)) * B;
        const Y = (v) => H - (v / maks) * (H - 6);

        /* Trappeform, ikke rette linjer mellom punktene: en pumpe som slår på går fra
           0 til 200 W momentant, og en skrå linje ville antydet en opptrapping. */
        const bane = (liste) => {
          if (!liste.length) return "";
          let d = `M${X(liste[0].t).toFixed(1)},${Y(liste[0].v).toFixed(1)}`;
          for (let i = 1; i < liste.length; i++) {
            d += ` L${X(liste[i].t).toFixed(1)},${Y(liste[i - 1].v).toFixed(1)}`;
            d += ` L${X(liste[i].t).toFixed(1)},${Y(liste[i].v).toFixed(1)}`;
          }
          d += ` L${B},${Y(liste[liste.length - 1].v).toFixed(1)}`;
          return d;
        };
        const flate = (liste) => {
          const b = bane(liste);
          return b ? `${b} L${B},${H} L0,${H} Z` : "";
        };

        const sum = (liste) => {
          // kWh: trapesregel over tiden, i timer
          let kwh = 0;
          for (let i = 1; i < liste.length; i++) {
            const dt = (liste[i].t - liste[i - 1].t) / 3600000;
            kwh += ((liste[i].v + liste[i - 1].v) / 2) * dt / 1000;
          }
          return kwh;
        };

        /* Banene ligger direkte i samme mal, alltid alle fire. Lit har ingen
           `svg`-tag tilgjengelig her, og en nøstet `html`-mal ville laget elementene i
           HTML-navnerommet — der blir en <path> usynlig. Tom `d` tegner ingenting. */
        return html`
          <svg class="graf" viewBox="0 0 ${B} ${H}" preserveAspectRatio="none">
            <path class="a-vp-flate" d="${vp.length ? flate(vp) : ""}"/>
            <path class="a-pumpe-flate" d="${pumpe.length ? flate(pumpe) : ""}"/>
            <path class="a-vp" d="${vp.length ? bane(vp) : ""}"/>
            <path class="a-pumpe" d="${pumpe.length ? bane(pumpe) : ""}"/>
          </svg>
          <div class="graf-tekst">
            <span><i class="prikk pumpe"></i>Sirkulasjon
              ${pumpe.length ? html`<b>${nf(sum(pumpe), 2)} kWh</b>` : ""}</span>
            <span><i class="prikk vp"></i>Oppvarming
              ${vp.length ? html`<b>${nf(sum(vp), 2)} kWh</b>` : ""}</span>
            <span class="dempet">topp ${nf(maks, 0)} W</span>
          </div>`;
      }

      /* Fingeren over grafen. Brøken langs bredden lagres; _graf regner resten. Bare
         mens fingeren er nede på mobil (pointerdown → move), så rulling ikke stjeles. */
      _grafPek(e) {
        if (e.pointerType !== "mouse" && e.type === "pointermove" && e.buttons === 0) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (!r.width) return;
        const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        if (this._pek === f) return;
        this._pek = f;
        if (e.type === "pointerdown") try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
        this.requestUpdate();
      }

      _grafSlipp() {
        if (this._pek === undefined || this._pek === null) return;
        this._pek = null;
        this.requestUpdate();
      }

      _byttVindu(timer) {
        this._timer = timer;
        this._hentHistorikk(true);
      }

      /* Vanntemperaturen, redesignet (2.1).
       *
       * Én akse: grader. Pumpa og varmepumpa er ikke en akse nummer to, men to baner
       * under grafen som viser NÅR de gikk – samme tidslinje, så man ser at vannet
       * steg mens varmen gikk. Natta (varmevinduets slutt til start) er skyggelagt,
       * og timene varmen gikk er tonet bak kurva.
       *
       * Toppen sier det viktigste i tall: temperaturen nå, endringen over vinduet, og
       * når det var varmest og kaldest. Fingeren over grafen viser verdien, klokka og
       * om pumpe og varme gikk akkurat da.
       *
       * Kurva og flaten ligger i en strukket svg (fyller bredden, streken er like tykk
       * overalt). Alt annet – natt, baner, merker, tekst – er HTML plassert i prosent,
       * så ingenting strekkes.
       */
      _graf() {
        const h = this._hist;
        if (!h || h.feil) return html`<div class="dempet senter graf-tom">Henter historikk …</div>`;
        const T = (h.temp || []).filter((p) => isFinite(p.v));
        if (T.length < 2) {
          return html`<div class="dempet senter graf-tom">Ikke nok temperaturhistorikk ennå.</div>`;
        }
        const fra = h.fra, til = h.til, spenn = til - fra;
        const timer = spenn / 3600000;
        const W = 300, H = 120, N = Math.min(96, Math.max(24, Math.round(timer * 2)));

        const botter = Array.from({ length: N }, () => []);
        for (const p of T) {
          const i = Math.floor(((p.t - fra) / spenn) * N);
          if (i >= 0 && i < N) botter[i].push(p.v);
        }
        let pkt = botter
          .map((a, i) => (a.length ? { t: fra + ((i + 0.5) / N) * spenn, v: a.reduce((x, y) => x + y, 0) / a.length } : null))
          .filter(Boolean);
        if (!pkt.length) pkt = [{ t: fra, v: T[0].v }, { t: til, v: T[T.length - 1].v }];
        if (pkt.length === 1) pkt.push({ t: til, v: pkt[0].v });
        pkt = pkt.map((p, i, a) => ({ t: p.t, v: (a[Math.max(0, i - 1)].v + p.v + a[Math.min(a.length - 1, i + 1)].v) / 3 }));

        const mal = this._malTemp();
        const siste = T[T.length - 1];
        const iVindu = T.filter((p) => p.t >= fra);
        const maks = (iVindu.length ? iVindu : T).reduce((a, b) => (b.v > a.v ? b : a));
        const min = (iVindu.length ? iVindu : T).reduce((a, b) => (b.v < a.v ? b : a));
        const verdier = pkt.map((p) => p.v).concat([siste.v, maks.v, min.v], mal != null ? [mal] : []);
        let lo = Math.min(...verdier), hi = Math.max(...verdier);
        if (hi - lo < 1.5) { const m = (hi + lo) / 2; lo = m - 0.75; hi = m + 0.75; }
        const pad = (hi - lo) * 0.18; lo -= pad; hi += pad;
        const X = (t) => ((t - fra) / spenn) * W;
        const Y = (v) => H - ((v - lo) / (hi - lo)) * H;
        const px = (t) => Math.max(0, Math.min(100, (X(t) / W) * 100));
        const py = (v) => Math.max(0, Math.min(100, (Y(v) / H) * 100));

        const P = pkt.map((p) => [X(p.t), Y(p.v)]);
        let linje = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
        for (let i = 0; i < P.length - 1; i++) {
          const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
          const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
          const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
          linje += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        const flate = `${linje} L${P[P.length - 1][0].toFixed(1)},${H} L${P[0][0].toFixed(1)},${H} Z`;

        /* Perioder over en terskel, slått sammen; blaff under to minutter forkastes. */
        const perioder = (liste, terskel) => {
          const ut = [];
          let aapen = null;
          for (const p of liste) {
            const gar = p.v > terskel;
            if (gar && aapen === null) aapen = p.t;
            if (!gar && aapen !== null) { ut.push([aapen, p.t]); aapen = null; }
          }
          if (aapen !== null) ut.push([aapen, til]);
          return ut.map(([a, b]) => [Math.max(a, fra), Math.min(b, til)]).filter(([a, b]) => b - a >= 120000);
        };
        const pumpe = perioder(h.effekt || [], 40);
        const varme = perioder(h.vp || [], 100);
        const timerI = (per) => per.reduce((s, [a, b]) => s + (b - a), 0) / 3600000;
        const segmenter = (per) => per.map(([a, b]) => html`<i style="left:${px(a).toFixed(2)}%;width:${Math.max(0.6, px(b) - px(a)).toFixed(2)}%"></i>`);

        /* Natta: fra varmevinduets slutt til start, hver natt i vinduet */
        const slutt = Number(this.val("varmeSlutt", 22)) % 24;
        const start = Number(this.val("varmeStart", 6)) % 24;
        const netter = [];
        if (slutt !== start) {
          const d0 = new Date(fra); d0.setHours(0, 0, 0, 0);
          for (let d = d0.getTime() - 86400000; d <= til; d += 86400000) {
            const a = d + slutt * 3600000;
            const b = d + (start > slutt ? start : start + 24) * 3600000;
            if (b > fra && a < til) netter.push([Math.max(a, fra), Math.min(b, til)]);
          }
        }

        const kl = (t) => {
          const d = new Date(t);
          const k = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
          return timer <= 30 ? k : `${d.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", "")} ${k}`;
        };
        const endring = siste.v - (T.find((p) => p.t >= fra) || T[0]).v;
        const periodeTekst = timer <= 30 ? "siste døgn" : `siste ${Math.round(timer / 24)} døgn`;

        const pek = this._pek;
        let pekHtml = "";
        if (pek !== null && pek !== undefined) {
          const t = fra + pek * spenn;
          const n = pkt.reduce((b, q) => (Math.abs(q.t - t) < Math.abs(b.t - t) ? q : b), pkt[0]);
          const i = (per) => per.some(([a, b]) => t >= a && t <= b);
          const x = px(n.t);
          pekHtml = html`
            <div class="vg-pekline" style="left:${x.toFixed(1)}%"></div>
            <div class="vg-pekboks ${x > 60 ? "venstre" : ""}" style="left:${x.toFixed(1)}%">
              <b>${nf(n.v, 1)}°</b><span>${kl(n.t)}</span>
              <span class="vg-flagg">
                ${i(pumpe) ? html`<em class="p">pumpe</em>` : ""}${i(varme) ? html`<em class="v">varme</em>` : ""}
              </span>
            </div>`;
        }

        const merker = [0, 0.25, 0.5, 0.75, 1].map((f) => {
          const d = new Date(fra + f * spenn);
          const tekst = timer <= 30
            ? `${String(d.getHours()).padStart(2, "0")}`
            : d.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", "");
          return { f, tekst: f === 1 ? "nå" : tekst };
        });
        const malY = mal != null ? py(mal) : null;

        return html`
          <div class="vg">
            <div class="vg-topp">
              <div class="vg-stor">
                <small>Endring ${periodeTekst}</small>
                <b class="${endring >= 0.05 ? "opp" : endring <= -0.05 ? "ned" : ""}">${endring >= 0.05 ? "+" : endring <= -0.05 ? "−" : "±"}${nf(Math.abs(endring), 1)}°</b>
              </div>
              <div class="vg-ekstrem">
                <span><small>maks</small> ${nf(maks.v, 1)}° <em>${kl(maks.t)}</em></span>
                <span><small>min</small> ${nf(min.v, 1)}° <em>${kl(min.t)}</em></span>
              </div>
            </div>
            <div class="vg-plot ${pekHtml ? "peker" : ""}"
              @pointerdown=${(e) => this._grafPek(e)} @pointermove=${(e) => this._grafPek(e)}
              @pointerup=${() => this._grafSlipp()} @pointerleave=${() => this._grafSlipp()}
              @pointercancel=${() => this._grafSlipp()}>
              <div class="vg-flate">
                ${netter.map(([a, b]) => html`<i class="vg-natt" style="left:${px(a).toFixed(2)}%;width:${(px(b) - px(a)).toFixed(2)}%"></i>`)}
                ${varme.map(([a, b]) => html`<i class="vg-varmetone" style="left:${px(a).toFixed(2)}%;width:${(px(b) - px(a)).toFixed(2)}%"></i>`)}
                ${[0.25, 0.5, 0.75].map((f) => html`<i class="vg-rute" style="top:${f * 100}%"></i>`)}
                <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="kib-vg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="currentColor" stop-opacity="0.38"></stop>
                      <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path class="vg-fyll" d="${flate}"></path>
                  <path class="vg-mal" d="${malY !== null ? `M0,${((malY / 100) * H).toFixed(1)} H${W}` : ""}"></path>
                  <path class="vg-linje" d="${linje}"></path>
                </svg>
                ${malY !== null ? html`<span class="vg-mallapp" style="top:${malY.toFixed(1)}%">mål ${nf(mal, mal % 1 ? 1 : 0)}°</span>` : ""}
                <span class="vg-y topp">${nf(hi, 1)}°</span>
                <span class="vg-y bunn">${nf(lo, 1)}°</span>
                <span class="vg-ekstrempkt" style="left:${px(maks.t).toFixed(1)}%;top:${py(maks.v).toFixed(1)}%"></span>
                <span class="vg-ekstrempkt" style="left:${px(min.t).toFixed(1)}%;top:${py(min.v).toFixed(1)}%"></span>
                <span class="vg-napkt" style="left:${Math.min(px(siste.t), 98).toFixed(1)}%;top:${py(siste.v).toFixed(1)}%"></span>
              </div>
              <div class="vg-bane pumpe" title="Pumpe">${segmenter(pumpe)}</div>
              <div class="vg-bane varme" title="Varme">${segmenter(varme)}</div>
              ${pekHtml}
            </div>
            <div class="vg-akse">
              ${merker.map((m) => html`<span style="left:${(m.f * 100).toFixed(0)}%">${m.tekst}</span>`)}
            </div>
            <div class="vg-forklaring">
              <span><i class="vg-f pumpe"></i>Pumpe <b>${nf(timerI(pumpe), 1)} t</b></span>
              <span><i class="vg-f varme"></i>Varme <b>${nf(timerI(varme), 1)} t</b></span>
              ${netter.length ? html`<span><i class="vg-f vg-f-natt"></i>Natt</span>` : ""}
              ${mal != null ? html`<span><i class="vg-f mal"></i>Mål</span>` : ""}
            </div>
          </div>`;
      }

      /* --- handlinger ----------------------------------------------- */

      _kall(domain, service, key, data = {}) {
        const id = this.id(key);
        if (!id) return;
        this.hass.callService(domain, service, { entity_id: id, ...data });
        this._haptikk("light");
      }

      _trykk(key) {
        this._kall("button", "press", key);
      }

      _veksle(key) {
        this._opt = this._opt || {};
        this._opt[key] = { pa: !this.on(key), t: Date.now() };
        this._kall("switch", "toggle", key);
        this.requestUpdate();
      }

      _sett(key, value) {
        this._kall("number", "set_value", key, { value });
      }

      _velg(option, key = "profil") {
        this._kall("select", "select_option", key, { option });
      }

      _mer(key) {
        const id = this.id(key);
        if (!id) return;
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: id };
        this.dispatchEvent(ev);
      }

      /* --- varmepumpe og hurtigknapper (1.11) -------------------------- */

      _hurtigListe() {
        const h = this._config.hurtig || [];
        return (Array.isArray(h) ? h : []).map((x) => (typeof x === "string" ? { entity: x } : x))
          .filter((x) => x && x.entity);
      }

      _eksterne() {
        const c = this._config;
        return [c.varmepumpe, c.stillemodus, ...this._hurtigListe().map((x) => x.entity)].filter(Boolean);
      }

      /* Haptikk som virker i appen på iPhone også: navigator.vibrate finnes ikke i
         Safari, men appen lytter på et haptic-event på window. */
      _haptikk(type = "light") {
        try { window.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true })); }
        catch (e) { /* eldre nettlesere */ }
        if (navigator.vibrate) { try { navigator.vibrate(type === "selection" ? 5 : 8); } catch (e) { /* blokkert */ } }
      }

      _merId(id) {
        if (!id) return;
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: id };
        this.dispatchEvent(ev);
      }

      /* Varmepumpa, øverst i kortet.
       *
       *   heat  → «Varmer bassenget · 27,3° → 28° · stillemodus», rød toning
       *   auto  → advarsel i oransje: i auto kan den kjøle, og KI Basseng setter den
       *           tilbake til heat
       *   av    → en stille linje, så du ser at den står av uten at det roper
       *
       * Før var dette to conditional-kort med button-card over kortet i popupen. */
      _varmestatus() {
        const id = this._config.varmepumpe;
        const st = id && this.hass.states[id];
        if (!st) return "";
        const a = st.attributes || {};
        const na = a.current_temperature, mal = a.temperature;
        const stille = this._config.stillemodus && this.hass.states[this._config.stillemodus];
        const stilleOn = stille && stille.state === "on";
        const grad = (v, d = 1) => (v === undefined || v === null ? null : nf(v, d) + "°");
        /* Med bassengscenen øverst (3.0) sier pillen i scenen om den varmer. Da står
           bare varselet om auto igjen her – det ber om noe. */
        const medScene = this._config.hero !== false;
        if (st.state === "auto") {
          return html`
            <div class="vpstatus auto" @click=${() => this._merId(id)}>
              <span class="vpik"><ha-icon icon="mdi:alert-outline"></ha-icon></span>
              <div class="vptekst">
                <div class="vptittel">Varmepumpa står i auto</div>
                <div class="vpunder">I auto kan den kjøle. KI Basseng setter den tilbake til varme.</div>
              </div>
            </div>`;
        }
        if (medScene) return "";
        if (st.state === "heat") {
          const del = [grad(na) && mal != null ? `${grad(na)} → ${grad(mal, 0)}` : grad(na) || (mal != null ? `mål ${grad(mal, 0)}` : null)]
            .filter(Boolean);
          /* Stolpen viser hvor nær målet vannet er: 10 grader under målet er tom. */
          const fylt = na != null && mal != null ? Math.max(4, Math.min(100, 100 - (mal - na) * 10)) : null;
          return html`
            <div class="vpstatus varme" @click=${() => this._merId(id)}>
              <span class="vpik"><ha-icon icon="mdi:heat-wave"></ha-icon></span>
              <div class="vptekst">
                <div class="vptittel">Varmer bassenget</div>
                <div class="vpunder">${del.join(" · ")}${stilleOn ? html` <span class="vpchip">stillemodus</span>` : ""}</div>
              </div>
              ${fylt !== null ? html`<div class="vpstolpe"><i style="width:${fylt.toFixed(0)}%"></i></div>` : ""}
            </div>`;
        }
        if (["unavailable", "unknown"].includes(st.state)) return "";
        return html`
          <div class="vpstatus av" @click=${() => this._merId(id)}>
            <span class="vpik"><ha-icon icon="mdi:heat-pump-outline"></ha-icon></span>
            <div class="vptekst">
              <div class="vptittel">Varmepumpa står av</div>
              ${grad(na) ? html`<div class="vpunder">Vannet er ${grad(na)}</div>` : ""}
            </div>
          </div>`;
      }

      /* Hurtigknappene: ikon og navn, og fargen viser tilstanden – aktivfarge når noe er
         på, rød når varmepumpa varmer, oransje når den står i auto, stiplet når enheten
         ikke svarer. Trykk veksler, langt trykk åpner mer info. */
      _hurtig() {
        const liste = this._hurtigListe();
        if (!liste.length) return "";
        const ikonFor = (id, st) => {
          const d = id.split(".")[0];
          if (d === "light") return st && st.state === "on" ? "mdi:lightbulb-on" : "mdi:lightbulb-outline";
          if (d === "climate") return st && st.state === "heat" ? "mdi:heat-wave" : st && st.state === "auto" ? "mdi:alert-outline" : "mdi:heat-pump-outline";
          return (st && st.attributes && st.attributes.icon) || "mdi:power";
        };
        return html`
          <div class="hurtig ${this._config.hurtig_navn ? "navn" : ""}" style="--kolonner:${Math.min(liste.length, 5)}">
            ${liste.map((x) => {
              const st = this.hass.states[x.entity];
              const tilstand = st ? st.state : "unavailable";
              const borte = ["unavailable", "unknown"].includes(tilstand);
              const klasse = borte ? "borte" : tilstand === "heat" ? "varme" : tilstand === "auto" ? "auto"
                : ["on", "open", "cool", "heat_cool", "dry", "fan_only"].includes(tilstand) ? "pa" : "";
              const navn = x.navn || (st && st.attributes.friendly_name) || x.entity;
              let holdTimer = null, holdt = false;
              const ned = () => {
                holdt = false;
                holdTimer = setTimeout(() => { holdt = true; this._haptikk("medium"); this._merId(x.entity); }, 500);
              };
              const opp = () => { clearTimeout(holdTimer); };
              const trykk = () => {
                if (holdt) { holdt = false; return; }
                if (borte) { this._merId(x.entity); return; }
                this._haptikk("light");
                this.hass.callService("homeassistant", "toggle", { entity_id: x.entity });
              };
              return html`
                <button class="hk ${klasse}" title=${navn}
                  @pointerdown=${ned} @pointerup=${opp} @pointerleave=${opp} @pointercancel=${opp}
                  @click=${trykk} @contextmenu=${(e) => e.preventDefault()}>
                  <ha-icon icon=${x.ikon || ikonFor(x.entity, st)}></ha-icon>
                  <span>${navn}</span>
                </button>`;
            })}
          </div>`;
      }

      /* Langt trykk åpner entiteten bak det du holder på. Lytterne legges på hvert
         element som har en nøkkel; klikket etterpå svelges når det var et hold. */
      _holdNed(e, key) {
        this._holdt = false;
        clearTimeout(this._holdTimer);
        this._holdTimer = setTimeout(() => {
          this._holdt = true;
          this._haptikk("medium");
          this._mer(key);
        }, 500);
      }

      _holdOpp() {
        clearTimeout(this._holdTimer);
      }

      _holdKlikk(fn) {
        return (e) => {
          if (this._holdt) { this._holdt = false; e.preventDefault(); e.stopPropagation(); return; }
          fn(e);
        };
      }

      _apneLukk(navn) {
        this._apne = { ...this._apne, [navn]: !this._apne[navn] };
      }

      /* --- byggeklosser --------------------------------------------- */

      // <select> gir systemets egen hjulvelger på iOS og Android
      _velger(key, tekst, opts = {}) {
        const s = this.st(key);
        if (!s) return "";
        const min = opts.min ?? Number(s.attributes.min ?? 0);
        const maks = opts.max ?? Number(s.attributes.max ?? 100);
        const steg = opts.step ?? Number(s.attributes.step ?? 1);
        const des = opts.desimaler ?? (steg < 1 ? 2 : 0);
        const suffiks = opts.suffiks ?? "";
        const naa = Number(s.state);

        const verdier = [];
        for (let v = min; v <= maks + 1e-9 && verdier.length < 400; v += steg) {
          verdier.push(+v.toFixed(4));
        }
        if (!verdier.some((v) => Math.abs(v - naa) < 1e-6)) verdier.push(naa);

        return html`
          <label class="velger">
            <span class="velger-tekst"
              @pointerdown=${(e) => this._holdNed(e, key)} @pointerup=${() => this._holdOpp()}
              @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
              @contextmenu=${(e) => e.preventDefault()}>${tekst}</span>
            <span class="velger-verdi">
              ${nf(naa, des)}${suffiks}
              <ha-icon icon="mdi:chevron-down"></ha-icon>
              <select
                .value=${String(naa)}
                @change=${(e) => this._sett(key, Number(e.target.value))}
              >
                ${verdier.map(
                  (v) => html`
                    <option value="${v}" ?selected=${Math.abs(v - naa) < 1e-6}>
                      ${nf(v, des)}${suffiks}
                    </option>
                  `
                )}
              </select>
            </span>
          </label>
        `;
      }

      /* Bare <select>-en, til å legge usynlig over en hel rad (3.0): trykk hvor som
         helst på raden, så kommer hjulvelgeren. */
      _velgerSelect(key, opts = {}) {
        const s = this.st(key);
        if (!s) return "";
        const min = opts.min ?? Number(s.attributes.min ?? 0);
        const maks = opts.max ?? Number(s.attributes.max ?? 100);
        const steg = opts.step ?? Number(s.attributes.step ?? 1);
        const des = opts.desimaler ?? (steg < 1 ? 2 : 0);
        const suffiks = opts.suffiks ?? "";
        const naa = Number(s.state);
        const verdier = [];
        for (let v = min; v <= maks + 1e-9 && verdier.length < 400; v += steg) verdier.push(+v.toFixed(4));
        if (!verdier.some((v) => Math.abs(v - naa) < 1e-6)) verdier.push(naa);
        return html`
          <select class="rad3-velg" .value=${String(naa)} @change=${(e) => this._sett(key, Number(e.target.value))}>
            ${verdier.map((v) => html`<option value="${v}" ?selected=${Math.abs(v - naa) < 1e-6}>${nf(v, des)}${suffiks}</option>`)}
          </select>`;
      }

      _velgerEntitet(key, tekst, tekster = {}) {
        const s = this.st(key);
        if (!s) return "";
        const opts = s.attributes.options || [];
        return html`
          <label class="velger">
            <span class="velger-tekst">${tekst}</span>
            <span class="velger-verdi">
              ${tekster[s.state] || s.state}
              <ha-icon icon="mdi:chevron-down"></ha-icon>
              <select .value=${s.state} @change=${(e) => this._velg(e.target.value, key)}>
                ${opts.map(
                  (o) => html`<option value="${o}" ?selected=${o === s.state}>
                    ${tekster[o] || o}
                  </option>`
                )}
              </select>
            </span>
          </label>
        `;
      }

      _bryterRad(key, tekst) {
        const s = this.st(key);
        if (!s) return "";
        const paa = s.state === "on";
        return html`
          <button class="bryterrad"
            @pointerdown=${(e) => this._holdNed(e, key)} @pointerup=${() => this._holdOpp()}
            @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
            @contextmenu=${(e) => e.preventDefault()}
            @click=${this._holdKlikk(() => this._veksle(key))}>
            <span>${tekst}</span>
            <span class="knott ${paa ? "paa" : ""}"></span>
          </button>
        `;
      }

      _faneListe() {
        const valgt = this._config.faner;
        const varme = this._harVarme();
        const alle = [
          { id: "oversikt", navn: "Oversikt" },
          { id: "varme", navn: "Varme" },
          { id: "klor", navn: "Klor" },
          { id: "sirkulasjon", navn: "Sirkulasjon" },
          { id: "spreder", navn: "Spreder" },
          /* Innstillinger er ikke en likeverdig fane — den åpnes fra tannhjulet til
             høyre i rada. Den ligger her bare så `faner:`-lista kan nevne den. */
          { id: "innstillinger", navn: "Innstillinger", tannhjul: true },
        ];
        const idAv = (v) => (v && typeof v === "object" ? v.id : v);
        const finnes = (id) => (id === "varme" ? varme : id === "klor" ? this._harKlor() : true);
        if (Array.isArray(valgt) && valgt.length) {
          let liste = [...valgt];
          const ider = liste.map(idAv);
          /* En liste skrevet for 2.x kjenner ikke Klor. Den settes inn etter Varme, og
             Sirkulasjon faller bort: med varmemodellen ligger den under grafen på Varme. */
          if (!ider.includes("klor") && ider.includes("varme")) {
            liste.splice(ider.indexOf("varme") + 1, 0, "klor");
            if (varme) liste = liste.filter((v) => idAv(v) !== "sirkulasjon");
          }
          return liste
            .filter((v) => finnes(idAv(v)))
            .map((v) => alle.find((f) => f.id === v) || (typeof v === "object" && v.id ? { id: v.id, navn: v.navn || v.id } : null))
            .filter(Boolean);
        }
        /* Uten varmemodellen (KI Basseng 1.2) er Sirkulasjon fortsatt en egen fane. */
        const std = varme
          ? ["oversikt", "varme", "klor", "spreder", "innstillinger"]
          : ["oversikt", "sirkulasjon", "klor", "spreder", "innstillinger"];
        return std.filter(finnes).map((id) => alle.find((f) => f.id === id));
      }

      /* Fanerada er den fra ki-tabs-card: tynn ring, piller, og glidepilla fra
         KI.pillefaner med klem og sprett. Vakta i basen setter pilla på igjen når Lit
         tegner rada på nytt. Uten basen (kortet alene) beholder fanen egen bakgrunn. */
      firstUpdated() {
        const ki = window.KI;
        if (ki && ki.pillefaner) ki.pillefaner(this, { rad: ".faner", knapp: ".faner .fane", aktiv: "aktiv", sprett: true });
      }

      _faner(liste, aktiv) {
        /* Tannhjulet skilles ut fra de vanlige fanene. Innstillinger er noe man går inn
           i sjelden, og som fane stjal den plass fra de tre man bruker. */
        const vanlige = liste.filter((f) => !f.tannhjul);
        const cog = liste.find((f) => f.tannhjul);
        return html`
          <div class="fanerad">
          <div class="faner ${vanlige.length >= 4 ? "mange" : ""}">
            ${vanlige.map(
              (f) => html`
                <button
                  class="fane ${f.id === aktiv ? "aktiv" : ""}"
                  @click=${() => { if (this._fane !== f.id) this._haptikk("selection"); this._fane = f.id; }}
                >
                  ${f.navn}
                </button>
              `
            )}
          </div>
          ${cog ? html`
            <button
              class="cog ${cog.id === aktiv ? "aktiv" : ""}"
              title="Innstillinger"
              aria-label="Innstillinger"
              @click=${() => { this._fane = cog.id === aktiv ? vanlige[0].id : cog.id; }}
            >
              <ha-icon icon="mdi:cog-outline"></ha-icon>
            </button>` : ""}
          </div>
        `;
      }

      /* Et panel: overskrift med farget ikonflis, noe valgfritt til høyre, og innholdet
         under. Sirkulasjon, spreder og innstillinger er bygget av slike, i stedet for
         lange lister med rader rett på bakgrunnen. */
      _panel(ikon, farge, tittel, under, innhold, hoyre = "", klikk = null) {
        return html`
          <section class="panel" style="--pf:${farge}">
            <header class="phode ${klikk ? "trykkbar" : ""}" @click=${klikk || (() => {})}>
              <span class="pik"><ha-icon icon="${ikon}"></ha-icon></span>
              <div class="ptekst">
                <div class="ptittel">${tittel}</div>
                ${under ? html`<div class="punder">${under}</div>` : ""}
              </div>
              ${hoyre}
            </header>
            ${innhold}
          </section>`;
      }

      /* Ring for «hvor langt har vi kommet» – omsetninger mot målet, spredertid mot taket.
         Hele svg-en står i én mal; Lit har ingen svg-tag her, og en nøstet mal ville lagt
         sirklene i HTML-navnerommet, der de ikke tegnes. */
      _ring(pst, farge, stor, liten, klikk = null, mini = false) {
        const r = 42;
        const omkrets = 2 * Math.PI * r;
        const fylt = Math.max(0, Math.min(100, Number(pst) || 0));
        return html`
          <div class="ring ${klikk ? "trykkbar" : ""} ${mini ? "mini" : ""}" style="--rf:${farge}" @click=${klikk || (() => {})}>
            <svg viewBox="0 0 100 100">
              <circle class="rbak" cx="50" cy="50" r="${r}"></circle>
              <circle class="rfor" cx="50" cy="50" r="${r}"
                stroke-dasharray="${omkrets.toFixed(1)}"
                stroke-dashoffset="${(omkrets * (1 - fylt / 100)).toFixed(1)}"></circle>
            </svg>
            <div class="rtekst"><b>${stor}</b><span>${liten}</span></div>
          </div>`;
      }

      /* Nøkkeltall: ikon, verdien stor, navnet dempet under. */
      _stat(ikon, navn, verdi, enhet = "", klikk = null) {
        return html`
          <button class="stat" @click=${klikk || (() => {})} ?disabled=${!klikk}
            @contextmenu=${(e) => e.preventDefault()}>
            <ha-icon icon="${ikon}"></ha-icon>
            <span class="sv">${verdi}${enhet ? html`<small>${enhet}</small>` : ""}</span>
            <span class="sn">${navn}</span>
          </button>`;
      }

      _vinduvelger() {
        return html`
          <span class="vindu">
            ${[24, 72, 168].map((t) => html`
              <button class="${this._timer === t ? "aktiv" : ""}"
                @click=${(e) => { e.stopPropagation(); this._byttVindu(t); }}>
                ${t === 24 ? "24 t" : t === 72 ? "3 d" : "7 d"}
              </button>`)}
          </span>`;
      }

      _seksjon(navn, ikon, tittel, undertekst, innhold) {
        const apen = !!this._apne[navn];
        return html`
          <div class="seksjon ${apen ? "apen" : ""}">
            <button class="seksjon-hode" @click=${() => this._apneLukk(navn)}>
              <ha-icon class="seksjon-ikon" icon="${ikon}"></ha-icon>
              <span class="seksjon-tittel">${tittel}</span>
              <span class="seksjon-under">${undertekst}</span>
              <ha-icon class="pil" icon="mdi:chevron-down"></ha-icon>
            </button>
            ${apen ? html`<div class="seksjon-kropp">${innhold()}</div>` : ""}
          </div>
        `;
      }

      /* --- varme (2.0) ----------------------------------------------- */

      /* Er integrasjonen ny nok til å ha varmemodellen? Uten den skjules Varme-fanen
         og de nye flisene, så kortet fortsatt fungerer mot KI Basseng 1.2. */
      _harVarme() {
        return !!(this.st("maltemp") || this.st("senking") || this.st("onsketTemp"));
      }

      _malTemp() {
        const m = this.val("maltemp");
        if (m !== null && m !== undefined && m !== "") return Number(m);
        const a = this.attr("vanntemp", "maltemperatur");
        return a === undefined || a === null ? null : Number(a);
      }

      /* Vanntemperaturen vi stoler på: modellens estimat når pumpa står (da måler
         følerne vannet i røret), ellers sensoren. */
      _vannTemp() {
        const est = this.attr("maltemp", "estimert_vanntemperatur");
        if (!this.on("skalGa") && est !== undefined && est !== null) return Number(est);
        const t = this.val("vanntemp");
        return t === null ? (est == null ? null : Number(est)) : Number(t);
      }

      _borte() {
        return !!this.st("hjemme") && !this.on("hjemme");
      }

      /* Styres taket av en sensor (dør/vindu, cover), kan det ikke slås av og på
         herfra – da åpner et trykk sensoren i stedet. */
      _takSensor() {
        const kilde = this.attr("varmetap", "pooltak_kilde");
        return kilde && kilde !== "bryter" ? kilde : null;
      }

      _taket() {
        if (this.st("pooltak")) return this.on("pooltak");
        return !!this.attr("varmetap", "pooltak", false);
      }

      /* Natta som en stripe fra varmevinduets slutt til start, med av-vinduet inntegnet. */
      _nattlinje(fra, til, aktiv) {
        const slutt = Number(this.val("varmeSlutt", 22)) % 24;
        const start = Number(this.val("varmeStart", 6)) % 24;
        const lengde = ((start - slutt + 24) % 24) || 24;
        const pos = (hhmm) => {
          if (!hhmm) return null;
          const [h, m] = String(hhmm).split(":").map(Number);
          if (isNaN(h)) return null;
          return (((h + (m || 0) / 60) - slutt + 24) % 24) / lengde;
        };
        const a = pos(fra);
        let b = pos(til);
        if (a !== null && b !== null && b <= a) b = 1;
        const na = new Date();
        const naPos = pos(`${na.getHours()}:${na.getMinutes()}`);
        const merker = [0, 0.25, 0.5, 0.75, 1].map((f) => {
          const t = Math.round(slutt + f * lengde) % 24;
          return { f, t: String(t).padStart(2, "0") };
        });
        return html`
          <div class="natt ${aktiv ? "aktiv" : ""}">
            ${a !== null && b !== null ? html`<i class="natt-av" style="left:${(a * 100).toFixed(1)}%;width:${((b - a) * 100).toFixed(1)}%"></i>` : ""}
            ${naPos !== null && naPos <= 1 ? html`<i class="natt-na" style="left:${(naPos * 100).toFixed(1)}%"></i>` : ""}
          </div>
          <div class="natt-akse">${merker.map((m) => html`<span style="left:${m.f * 100}%">${m.t}</span>`)}</div>`;
      }

      /* `bare`: bare innholdet, med detaljene ute – under det lilla kortet på Varme (3.0). */
      _senkingPanel(bare = false) {
        const s = this.st("senking");
        if (!s) return "";
        const tilstand = s.state;
        const [tekst, farge, ikon] = SENKING[tilstand] || SENKING.av;
        const a = s.attributes || {};
        const valuta = this.enhet("kostnad") || "kr";
        const uten = Number(a.uten_senking_kwh), med = Number(a.med_senking_kwh);
        const utenK = Number(a.uten_senking_kostnad);
        const harSammenligning = isFinite(uten) && isFinite(med) && uten > 0;
        const topp = harSammenligning ? Math.max(uten, med) : 1;
        const vindu = a.fra && a.til ? `${a.fra}–${a.til}` : "";
        const alt = (a.beste_alternativer || []).slice(0, 3);
        const chip = html`<span class="tilstandchip" style="--c:${farge}"><ha-icon icon="${ikon}"></ha-icon>${
          tilstand === "aktiv" || tilstand === "planlagt" ? vindu || tekst : tekst}</span>`;

        const detaljer = bare || this._apne.senking;
        const innhold = html`
            ${tilstand !== "av" ? this._nattlinje(a.fra, a.til, tilstand === "aktiv") : ""}
            ${a.spart_kwh ? html`
              <div class="spar">
                <div><b>${nf(a.spart_kwh, 1)}</b><small>kWh spart</small></div>
                <div><b>${nf(a.spart_kostnad, 2)}</b><small>${valuta} spart</small></div>
                ${a.laveste_temperatur != null ? html`<div><b>${nf(a.laveste_temperatur, 1)}°</b><small>laveste</small></div>` : ""}
              </div>` : ""}
            ${detaljer ? html`
            ${harSammenligning ? html`
              <div class="sammen">
                <div class="srad"><span>Holde varmen</span>
                  <span class="sspor"><i style="width:${(uten / topp * 100).toFixed(1)}%"></i></span>
                  <span class="sv">${nf(uten, 1)} kWh${isFinite(utenK) ? ` · ${nf(utenK, 2)} ${valuta}` : ""}</span></div>
                <div class="srad med"><span>Med senking</span>
                  <span class="sspor"><i style="width:${(med / topp * 100).toFixed(1)}%"></i></span>
                  <span class="sv">${nf(med, 1)} kWh</span></div>
              </div>` : ""}
            ${a.begrunnelse ? html`<div class="tips"><ha-icon icon="mdi:head-lightbulb-outline"></ha-icon>${a.begrunnelse}</div>` : ""}
            ${alt.length && tilstand === "lonner_seg_ikke" ? html`
              <div class="alternativ">
                <div class="plabel">Beste vinduer den vurderte</div>
                ${alt.map((x) => html`<div class="altrad ${x.klar ? "" : "ikke"}">
                  <span>${x.fra}–${x.til}</span><span>${nf(x.kwh, 1)} kWh</span>
                  <span>${x.klar ? `min ${nf(x.temp_min, 1)}°` : "rekker ikke"}</span></div>`)}
              </div>` : ""}
            <div class="pliste">
              ${this._bryterRad("smartSenking", "Smart nattsenking")}
              ${this._velgerEntitet("kriterium", "Skal spare", KRITERIUM)}
              ${this._velger("maksSenking", "Maks senking", { step: 0.5, desimaler: 1, suffiks: "°" })}
            </div>` : ""}
            ${bare ? "" : html`<button class="detaljer" @click=${() => this._apneLukk("senking")}>
              ${this._apne.senking ? "Færre detaljer" : "Detaljer og innstillinger"}
              <ha-icon icon="mdi:chevron-${this._apne.senking ? "up" : "down"}"></ha-icon>
            </button>`}`;
        if (bare) return html`<section class="panel nk3-detaljer">${innhold}</section>`;
        return this._panel("mdi:weather-night", farge, "Nattsenking",
          tilstand === "aktiv" ? `Står av til ${a.til || "–"}`
            : tilstand === "planlagt" ? `Av ${vindu} i natt`
            : tilstand === "lonner_seg_ikke" ? "Holder varmen i natt" : "Slått av",
          innhold, chip, () => this._mer("senking"));
      }

      _dato(v, lang = false) {
        const d = new Date(v);
        if (isNaN(d)) return "–";
        return d.toLocaleDateString("nb-NO", lang
          ? { weekday: "long", day: "numeric", month: "long" }
          : { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
      }

      /* Klor logges der du er, uten overlegg: fra Oversikt folder et felt seg ut
         rett under flisene, og på Varme folder klorkortet seg ut med kalenderen.
         (Arket fra 2.2 la seg over popupen og var tungt å bruke på telefonen.) */
      _apneKlor(hvor = "oversikt") {
        this._haptikk("selection");
        this._klorApen = this._klorApen === hvor ? null : hvor;
        this._kalValgt = null;
        this._kalMnd = 0;
        this._klorAntall = 1;
        this._klorKvittering = null;
        this.requestUpdate();
      }

      _lukkKlor() {
        this._klorApen = null;
        this.requestUpdate();
      }

      /* Hvem la i: ett trykk på et navn, så er det logget. Er en dag valgt i
         kalenderen (på Varme), logges det på den dagen. */
      _klorLogger(hvor) {
        const navn = this._klorNavn();
        const antall = this._klorAntall || 1;
        const dag = hvor === "oversikt" ? null : this._klorDag();
        const logg = (hvem) => this._klorLogg(hvem, dag, hvor);
        if (this._klorKvittering) {
          return html`<div class="kvittering"><ha-icon icon="mdi:check-circle"></ha-icon>Logget ${this._klorKvittering}</div>`;
        }
        return html`
          <div class="klorlogger">
            <div class="kl-hode">
              <span>Hvem la i klor${dag ? html` <em>${this._dato(dag)}</em>` : ""}?</span>
              <span class="kl-antall">
                <button aria-label="Færre" ?disabled=${antall <= 1}
                  @click=${() => { this._klorAntall = Math.max(1, antall - 1); this._haptikk("selection"); this.requestUpdate(); }}>−</button>
                <b>${antall} stk</b>
                <button aria-label="Flere" ?disabled=${antall >= 10}
                  @click=${() => { this._klorAntall = Math.min(10, antall + 1); this._haptikk("selection"); this.requestUpdate(); }}>+</button>
              </span>
            </div>
            <div class="kl-navn">
              ${navn.map((n) => html`
                <button class="navneknapp" @click=${() => logg(n)}>
                  <span class="initial">${n.slice(0, 1).toUpperCase()}</span>${n}
                </button>`)}
              <button class="navneknapp uten" @click=${() => logg("")}>
                <span class="initial"><ha-icon icon="mdi:check"></ha-icon></span>${navn.length ? "Uten navn" : "Logg"}
              </button>
            </div>
            ${!navn.length ? html`<div class="dempet">Legg til navn på Klor-fanen, så kan du trykke på den som la i.</div>` : ""}
          </div>`;
      }

      /* Vinter: bassenghuset holdes frostfritt med varmeelementene, og vannet
         sirkulerer når det er kaldt ute. Varmepumpa står av. */
      _vinterPanel() {
        if (!this.st("vintermodus")) return "";
        const pa = this.on("vintermodus");
        const a = this.st("frostVarme") ? this.st("frostVarme").attributes : {};
        const hus = a.bassenghus ?? a.temperatur;
        const grense = Number(this.val("frostUnder", 5));
        const varmer = this.on("frostVarme");
        const modus = this.val("modus");
        // Av: bryteren er vinterbildet på Varme (3.0)
        if (!pa) return "";
        const pst = hus != null && isFinite(hus) ? Math.max(3, Math.min(100, ((Number(hus) - (grense - 5)) / 15) * 100)) : 0;
        return this._panel("mdi:snowflake", "var(--kib-blue)", "Vintermodus",
          modus === "frostsikring" ? "Frostsikring: vannet sirkulerer" : varmer ? "Varmeelementene varmer" : "Bassenghuset er frostfritt",
          html`
            <div class="ringrad">
              ${this._ring(pst, varmer ? "var(--kib-orange)" : "var(--kib-blue)",
                hus != null ? `${nf(hus, 1)}°` : "–", "bassenghus", () => this._mer("frostVarme"))}
              <div class="statliste">
                ${this._stat("mdi:radiator", "Varmeelementer", varmer ? "På" : "Av", "", () => this._mer("frostVarme"))}
                ${this._stat("mdi:thermometer-low", "Varme på under", nf(grense, 1), "°", () => this._mer("frostUnder"))}
                ${this._stat("mdi:pump", "Pumpe", modus === "frostsikring" ? "Frostsirk." : modus === "filtrering" ? "Filtrerer" : "Hviler", "")}
              </div>
            </div>
            <div class="pliste">
              ${this._bryterRad("vintermodus", "Vintermodus")}
              ${this._velger("frostUnder", "Varme på under", { step: 0.5, desimaler: 1, suffiks: "°" })}
              ${this._velger("frostSirk", "Sirkulasjon hele tiden under", { step: 0.5, desimaler: 1, suffiks: "° ute" })}
              ${this._velger("vinterOms", "Omsetninger per døgn", { step: 0.25, desimaler: 2, suffiks: "×" })}
            </div>`, "", () => this._mer("vintermodus"));
      }

      _klorNavn() {
        const fra = this.attr("sisteKlor", "navn");
        if (Array.isArray(fra)) return fra;
        const felt = this.val("klorNavn");
        return typeof felt === "string" ? felt.split(",").map((x) => x.trim()).filter(Boolean) : [];
      }

      _klorKalender(neste, redigerbar = false) {
        const logg = this.attr("sisteKlor", "logg") || this.attr("sisteKlor", "historikk", []) || [];
        const idag = new Date();
        const forskyv = this._kalMnd || 0;
        const m0 = new Date(idag.getFullYear(), idag.getMonth() + forskyv, 1);
        const aar = m0.getFullYear(), mnd = m0.getMonth();
        const dagerIMnd = new Date(aar, mnd + 1, 0).getDate();
        const forste = (m0.getDay() + 6) % 7; // mandag først
        const nokkel = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const perDag = {};
        for (const r of logg) {
          const d = new Date(r.tid);
          if (isNaN(d)) continue;
          (perDag[nokkel(d)] = perDag[nokkel(d)] || []).push(r);
        }
        const nesteD = neste ? new Date(neste) : null;
        const celler = [];
        for (let i = 0; i < forste; i++) celler.push(html`<span class="kal-tom"></span>`);
        for (let dag = 1; dag <= dagerIMnd; dag++) {
          const d = new Date(aar, mnd, dag);
          const k = nokkel(d);
          const rader = perDag[k] || [];
          const erIdag = k === nokkel(idag);
          const erNeste = nesteD && !isNaN(nesteD) && k === nokkel(nesteD);
          const forbi = d < new Date(idag.getFullYear(), idag.getMonth(), idag.getDate());
          const fremtid = d > idag;
          const init = [...new Set(rader.map((r) => (r.hvem || "").trim()).filter(Boolean))]
            .map((n) => n.slice(0, 1).toUpperCase()).join("");
          celler.push(html`
            <button class="kal-dag ${rader.length ? "lagt" : ""} ${erIdag ? "kal-idag" : ""} ${erNeste ? "neste" : ""} ${this._kalValgt === k ? "valgt" : ""} ${forbi && !rader.length ? "forbi" : ""} ${fremtid ? "fremtid" : ""}"
              ?disabled=${redigerbar && fremtid && !rader.length}
              @click=${() => { this._haptikk("selection"); this._kalValgt = this._kalValgt === k ? null : k; this.requestUpdate(); }}>
              <span class="kal-tall">${dag}</span>
              ${rader.length ? html`<span class="kal-prikk">${init || rader.reduce((s, r) => s + (r.antall || 1), 0)}</span>` : ""}
            </button>`);
        }
        const valgteRader = this._kalValgt ? (perDag[this._kalValgt] || []) : [];
        const tittel = m0.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
        const iMnd = logg.filter((r) => { const d = new Date(r.tid); return d.getFullYear() === aar && d.getMonth() === mnd; })
          .reduce((s, r) => s + (r.antall || 1), 0);
        return html`
          <div class="kal">
            <div class="kal-hode">
              <button class="kal-pil" aria-label="Forrige måned" @click=${() => { this._kalMnd = forskyv - 1; this._kalValgt = null; this.requestUpdate(); }}>
                <ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <span class="kal-tittel">${tittel}<small>${iMnd} stk</small></span>
              <button class="kal-pil" aria-label="Neste måned" ?disabled=${forskyv >= 1}
                @click=${() => { this._kalMnd = forskyv + 1; this._kalValgt = null; this.requestUpdate(); }}>
                <ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </div>
            <div class="kal-uke">${["ma", "ti", "on", "to", "fr", "lø", "sø"].map((u) => html`<span>${u}</span>`)}</div>
            <div class="kal-grid">${celler}</div>
            ${this._kalValgt ? html`
              <div class="kal-detalj">
                ${valgteRader.length ? valgteRader.map((r) => html`
                  <div class="klorrad">
                    <span>${new Date(r.tid).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>${r.antall || 1} stk${r.hvem ? ` · ${r.hvem}` : ""}</span>
                    <span></span>
                    ${redigerbar ? html`<button class="angre" title="Slett" aria-label="Slett"
                      @click=${() => { this._haptikk("medium"); this.hass.callService("ki_basseng", "slett_klortablett", { tid: r.tid }); }}>
                      <ha-icon icon="mdi:trash-can-outline"></ha-icon></button>` : html`<span></span>`}
                  </div>`) : html`<div class="dempet">${redigerbar
                    ? "Ingen klortablett denne dagen. Trykk på et navn over for å logge den her."
                    : "Ingen klortablett denne dagen."}</div>`}
              </div>` : ""}
            <div class="kal-forklaring">
              <span><i class="kf lagt"></i>Lagt i</span>
              <span><i class="kf neste"></i>Neste</span>
              <span><i class="kf kf-idag"></i>I dag</span>
              ${!redigerbar && this.st("angreKlor") && logg.length ? html`<button class="angre-tekst"
                @click=${() => { this._haptikk("medium"); this._trykk("angreKlor"); }}>
                <ha-icon icon="mdi:undo"></ha-icon>Angre siste</button>` : ""}
            </div>
          </div>`;
      }

      /* Navnene redigeres her og lagres i integrasjonen (text-entiteten), så de er de
         samme på alle skjermer. */
      _klorNavnPanel(bare = false) {
        const id = this.id("klorNavn");
        if (!id) return "";
        const navn = this._klorNavn();
        const lagre = (liste) => {
          this.hass.callService("text", "set_value", { entity_id: id, value: liste.join(", ") });
          this._haptikk("light");
        };
        const leggTil = (e) => {
          e.preventDefault();
          const felt = this.shadowRoot.querySelector(".navn-felt");
          const nytt = (felt.value || "").trim();
          if (!nytt || navn.some((n) => n.toLowerCase() === nytt.toLowerCase())) { felt.value = ""; return; }
          lagre([...navn, nytt]);
          felt.value = "";
        };
        const innhold = html`
          ${navn.length ? html`<div class="navneliste">
            ${navn.map((n) => html`<span class="navnechip">${n}
              <button aria-label="Fjern ${n}" @click=${() => lagre(navn.filter((x) => x !== n))}>
                <ha-icon icon="mdi:close"></ha-icon></button></span>`)}
          </div>` : ""}
          <form class="navn-ny" @submit=${leggTil}>
            <input class="navn-felt" type="text" placeholder="Navn, f.eks. Sebastian" maxlength="40" autocomplete="off">
            <button type="submit"><ha-icon icon="mdi:plus"></ha-icon>Legg til</button>
          </form>`;
        if (bare) return html`<section class="panel navn3">${innhold}</section>`;
        return this._panel("mdi:account-multiple-check", "var(--kib-green)", "Klorlogg",
          navn.length ? `${navn.length} ${navn.length === 1 ? "person" : "personer"} kan hukes av` : "Legg til hvem som legger i klor",
          innhold);
      }

      /* Til en fane, eller åpne seksjonen når kortet står uten faner. Gir false når
         fanen er valgt bort i `faner:`. */
      _tilFane(id) {
        this._haptikk("selection");
        if (this._config.faner === false) {
          this._apne = { ...this._apne, [id]: true };
          return true;
        }
        if (this._faneListe().some((f) => f.id === id)) {
          this._fane = id;
          return true;
        }
        return false;
      }

      /* Er Varme valgt bort, åpnes nattsenkingen som mer-info i stedet. */
      _tilVarme() {
        if (!this._tilFane("varme")) this._mer("senking");
      }

      /* Er Klor valgt bort, folder loggeren seg ut på Oversikt som før. */
      _tilKlor() {
        if (!this._tilFane("klor")) this._apneKlor("oversikt");
      }

      _harKlor() {
        return !!(this.st("sisteKlor") || this.st("loggKlor"));
      }

      /* --- Varme (3.0) ------------------------------------------------ */

      _varmeFane() {
        if (this.on("vintermodus")) {
          return html`
            ${this._vinterPanel()}
            ${this._sceneFliser()}
          `;
        }
        return html`
          ${this._vpFliser()}
          ${this._forvalg()}
          ${this._varmeSetning()}
          ${this._varmeTips()}
          ${this.st("tvingVarme") ? this._radBryter("tvingVarme", "mdi:fire", "Varm nå",
            this.on("tvingVarme") ? "Varmer til målet uansett pris og vindu" : "Til målet, uansett pris og vindu") : ""}
          ${this._underfaner()}
          ${this._nattKort()}
          ${this._sceneFliser()}
        `;
      }

      /* Varmepumpa og effekten, to store fliser (som i Tesla-kortet). Bryteren setter
         varmepumpa i heat eller av; trykk på flisen åpner den. */
      _vpFliser() {
        const id = this._config.varmepumpe;
        const st = id && this.hass.states[id];
        const vp = Number(this.val("vpEffekt", 0)) || 0;
        let venstre;
        if (st) {
          const t = st.state;
          const borte = ["unavailable", "unknown"].includes(t);
          const pa = !borte && t !== "off";
          const tekst = borte ? "Svarer ikke" : t === "off" ? "Av" : t === "auto" ? "Auto" : vp > 100 ? "Varmer" : "Hviler";
          venstre = html`
            <div class="fl3 ${t === "auto" ? "varsel" : ""}" role="button" @click=${() => { this._haptikk("light"); this._merId(id); }}>
              <span class="fik3"><ha-icon icon=${pa ? "mdi:heat-pump" : "mdi:heat-pump-outline"}></ha-icon></span>
              ${borte ? "" : html`<button class="tog3 ${pa ? "pa" : ""}" aria-label="Varmepumpe av eller på"
                @click=${(e) => { e.stopPropagation(); this._haptikk("light");
                  this.hass.callService("climate", "set_hvac_mode", { entity_id: id, hvac_mode: pa ? "off" : "heat" }); }}><i></i></button>`}
              <span class="fl3-navn">Varmepumpe</span>
              <span class="fl3-verdi">${tekst}</span>
            </div>`;
        } else {
          const mal = this._malTemp();
          venstre = html`
            <button class="fl3" @click=${() => this._mer("maltemp")}>
              <span class="fik3"><ha-icon icon="mdi:thermometer-check"></ha-icon></span>
              <span class="fl3-navn">Mål</span>
              <span class="fl3-verdi">${nf(mal, mal % 1 ? 1 : 0)}<small>°C</small></span>
            </button>`;
        }
        const hoyre = this.st("vpEffekt") ? html`
          <button class="fl3" @click=${() => this._mer("vpEffekt")}>
            <span class="fik3"><ha-icon icon="mdi:flash"></ha-icon></span>
            <span class="fl3-navn">Effekt nå</span>
            <span class="fl3-verdi">${vp >= 1000 ? nf(vp / 1000, 1) : nf(vp, 0)}<small>${vp >= 1000 ? "kW" : "W"}</small></span>
          </button>` : html`
          <button class="fl3" @click=${() => this._mer("varmetap")}>
            <span class="fik3"><ha-icon icon="mdi:waves-arrow-up"></ha-icon></span>
            <span class="fl3-navn">Varmetap nå</span>
            <span class="fl3-verdi">${nf(this.val("varmetap"), 0)}<small>W</small></span>
          </button>`;
        return html`<div class="g23">${venstre}${hoyre}</div>`;
      }

      /* Ønsket temperatur som faste valg (26–30°). Rada flytter seg bare når verdien
         havner utenfor, så knappene ikke hopper under fingeren. `forvalg: [..]` gir
         egne. Langt trykk åpner entiteten, for halve grader. */
      _forvalg() {
        const s = this.st("onsketTemp");
        if (!s) return "";
        const faktisk = Number(s.state);
        this._lokal = this._lokal || {};
        const l = this._lokal.onsketTemp;
        if (l && (Math.abs(l.v - faktisk) < 1e-6 || Date.now() - l.t > 4000)) delete this._lokal.onsketTemp;
        const v = this._lokal.onsketTemp ? this._lokal.onsketTemp.v : faktisk;
        const min = Number(s.attributes.min ?? 10), maks = Number(s.attributes.max ?? 40);
        let liste;
        if (Array.isArray(this._config.forvalg) && this._config.forvalg.length) {
          liste = this._config.forvalg.map(Number).filter((x) => isFinite(x));
        } else {
          let a = 26;
          if (isFinite(v) && (v < a || v > a + 4)) a = Math.round(v) - 2;
          a = Math.max(Math.ceil(min), Math.min(a, Math.floor(maks) - 4));
          liste = [0, 1, 2, 3, 4].map((i) => a + i);
        }
        liste = liste.filter((x) => x >= min && x <= maks).slice(0, 6);
        if (!liste.length) return "";
        return html`
          <div class="fv3" style="--n:${liste.length}">
            ${liste.map((t) => html`
              <button class="fv3-k ${Math.abs(t - v) < 0.05 ? "pa" : ""}"
                @pointerdown=${(e) => this._holdNed(e, "onsketTemp")} @pointerup=${() => this._holdOpp()}
                @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
                @contextmenu=${(e) => e.preventDefault()}
                @click=${this._holdKlikk(() => {
                  this._lokal.onsketTemp = { v: t, t: Date.now() };
                  this._haptikk("selection");
                  this._sett("onsketTemp", t);
                  this.requestUpdate();
                })}>${nf(t, t % 1 ? 1 : 0)}°</button>`)}
          </div>`;
      }

      /* «Vannet er 26,3° og når 27° om ca 2 t 10 min, og det koster ca 4 kroner.» */
      _varmeSetning() {
        const vann = this._vannTemp(), mal = this._malTemp();
        if (vann == null || mal == null) return "";
        const v = `${nf(vann, 1)}°`, m = `${nf(mal, mal % 1 ? 1 : 0)}°`;
        const min = this.attr("maltemp", "minutter_til_mal");
        const kost = this.attr("maltemp", "oppvarming_kostnad");
        const rekker = this.attr("maltemp", "rekker_malet");
        const valuta = this.enhet("kostnad") || "kr";
        const harKost = kost != null && Number(kost) > 0.005;
        const deler = [{ t: "Vannet er {pille}", v, k: "vanntemp" }];
        if (vann >= mal - 0.2) deler.push({ t: "og holder målet på {pille}.", v: m, k: "onsketTemp" });
        else if (min != null && min > 0) {
          deler.push({ t: "og når {pille}", v: m, k: "onsketTemp" });
          deler.push({ t: `om ca {pille}${harKost ? "," : "."}`, v: varighet(min), k: "maltemp" });
          if (harKost) deler.push({ t: "og det koster ca {pille}.", v: kroner(kost, valuta), k: "maltemp" });
        } else if (rekker === false) {
          deler[0].t = "Vannet er {pille}.";
          deler.push({ t: "Varmepumpa rekker ikke {pille} med dette været.", v: m, k: "onsketTemp" });
        } else {
          deler[0].t = "Vannet er {pille},";
          deler.push({ t: "og målet er {pille}.", v: m, k: "onsketTemp" });
        }
        if (this._borte()) {
          deler.push({ t: "Ingen er hjemme, så målet er senket {pille}.", v: `${nf(this.val("borteSenking", 0), 1)}°`, k: "borteSenking" });
        }
        return this._prosa("varme", deler);
      }

      _varmeTips() {
        const blokk = this.attr("modus", "varmer_ikke_fordi");
        return html`
          ${blokk && this.val("senking") !== "aktiv" ? html`<div class="tips"><ha-icon icon="mdi:thermometer-alert"></ha-icon>Varmer ikke: ${blokk}</div>` : ""}
          ${this.st("styrSettpunkt") && !this.on("styrSettpunkt") ? html`<div class="tips">
            <ha-icon icon="mdi:information-outline"></ha-icon>Styr settpunkt er av – varmepumpas eget settpunkt gjelder.</div>` : ""}`;
      }

      /* En bred rad med ikon, tekst og bryter (som i Innstillinger-kortet). */
      _radBryter(key, ikon, navn, tekst) {
        const pa = this.on(key);
        return html`
          <button class="rad3 bred ${pa ? "pa" : ""}"
            @pointerdown=${(e) => this._holdNed(e, key)} @pointerup=${() => this._holdOpp()}
            @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
            @contextmenu=${(e) => e.preventDefault()}
            @click=${this._holdKlikk(() => this._veksle(key))}>
            <span class="fik3"><ha-icon icon=${ikon}></ha-icon></span>
            <span class="rad3-tekst"><b>${navn}</b><small>${tekst}</small></span>
            <span class="tog3 ${pa ? "pa" : ""}"><i></i></span>
          </button>`;
      }

      /* Grafen med underfaner (som i Strøm-kortet): temperatur, sirkulasjon og pris. */
      _underfaner() {
        const graf = this._config.graf !== false;
        const alle = [["temperatur", "Temperatur"], ["sirkulasjon", "Sirkulasjon"], ["pris", "Pris"]];
        const liste = alle.filter(([id]) => (id === "temperatur" ? graf : id === "pris" ? this.attr("modus", "snittpris_plan") != null : true));
        if (!liste.length) return "";
        const aktiv = liste.some(([id]) => id === this._under) ? this._under : liste[0][0];
        return html`
          <div class="uf3">
            ${liste.map(([id, navn]) => html`
              <button class="uf3-k ${id === aktiv ? "pa" : ""}"
                @click=${() => { if (this._under !== id) this._haptikk("selection"); this._under = id; }}>${navn}</button>`)}
          </div>
          <section class="panel uf3-flate">
            ${aktiv === "temperatur" ? this._tempUnder() : aktiv === "sirkulasjon" ? this._sirkUnder() : this._prisUnder()}
          </section>`;
      }

      _tempUnder() {
        const ute = this.attr("varmetap", "utetemperatur");
        const solW = this.attr("varmetap", "solgevinst_w");
        return html`
          <div class="uf3-topp"><span>Vanntemperatur</span>${this._vinduvelger()}</div>
          ${this._graf()}
          <div class="statgrid tre">
            ${this._stat("mdi:thermometer", "Ute", nf(ute, 1), "°", () => this._mer("varmetap"))}
            ${this._stat("mdi:waves-arrow-up", "Varmetap", nf(Number(this.val("varmetap", 0)) / 1000, 1), " kW", () => this._mer("varmetap"))}
            ${this._stat("mdi:weather-sunny", "Sol inn", nf(solW, 0), " W", () => this._mer("sol"))}
          </div>`;
      }

      _sirkUnder() {
        const bl = this.attr("modus", "blokker", []) || [];
        const blm = this.attr("modus", "blokker_i_morgen", []) || [];
        const gjort = Number(this.val("omsetninger", 0)) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const neste = this.val("nesteStart");
        return html`
          <div class="ringrad">
            ${this._ring(Math.min(100, (gjort / mal) * 100), "var(--kib-blue)", `${nf(gjort, 2)}×`, `av ${nf(mal, 2)}×`, () => this._mer("omsetninger"))}
            <div class="statliste">
              ${this._stat("mdi:timer-outline", "Pumpetid i dag", nf(this.val("pumpetid", 0), 1), " t", () => this._mer("pumpetid"))}
              ${this._stat("mdi:clock-start", "Neste start", neste ? klokke(neste) || String(neste) : "–", "", () => this._mer("nesteStart"))}
              ${this._stat("mdi:water-sync", "Én omsetning", nf(this.attr("omsetninger", "en_omsetning_timer"), 1), " t")}
            </div>
          </div>
          <div class="plabel">I dag</div>
          ${this._planstripe(bl, true)}
          ${blm.length ? html`<div class="plabel">I morgen</div>${this._planstripe(blm, false)}` : ""}`;
      }

      _prisUnder() {
        const snittPlan = this.attr("modus", "snittpris_plan");
        const snittDogn = this.attr("modus", "snittpris_dogn");
        const valuta = this.enhet("kostnad") || "kr";
        const billigere = snittPlan != null && snittDogn != null && snittDogn > 0
          ? Math.round((1 - snittPlan / snittDogn) * 100) : null;
        return html`
          <div class="prisrad">
            <div><small>Snitt i planen</small><b>${nf(snittPlan, 2)}</b><em>${valuta}/kWh</em></div>
            <div><small>Snitt i døgnet</small><b>${nf(snittDogn, 2)}</b><em>${valuta}/kWh</em></div>
            ${billigere !== null ? html`<div class="${billigere > 0 ? "gron" : ""}"><small>Billigere</small><b>${billigere}</b><em>%</em></div>` : ""}
          </div>
          <div class="statgrid">
            ${this._stat("mdi:cash", "Kostnad i dag", nf(this.val("kostnad", 0), 1), ` ${valuta}`, () => this._mer("kostnad"))}
            ${this._stat("mdi:piggy-bank-outline", "Spart i dag", nf(this.val("spart", 0), 1), ` ${valuta}`, () => this._mer("spart"))}
          </div>`;
      }

      /* Nattsenkingen som et farget kort (som i Innstillinger-kortet): vinduet stort,
         hva det sparer under, og bryteren for smart nattsenking. Trykk folder ut
         sammenligningen, begrunnelsen og innstillingene. */
      _nattKort() {
        const s = this.st("senking");
        if (!s) return "";
        const t = s.state;
        const a = s.attributes || {};
        const valuta = this.enhet("kostnad") || "kr";
        let stor, under;
        if (t === "aktiv") { stor = `Av til ${a.til || "–"}`; under = "Varmepumpa står av for natta"; }
        else if (t === "planlagt") {
          stor = a.fra && a.til ? `${a.fra}–${a.til}` : "Planlagt";
          under = `sparer ca ${nf(a.spart_kwh, 1)} kWh · ${nf(a.spart_kostnad, 2)} ${valuta}`;
        } else if (t === "lonner_seg_ikke") { stor = "Holder varmen"; under = a.begrunnelse || "Lønner seg ikke i natt"; }
        else { stor = "Av"; under = "Varmepumpa går som vanlig om natta"; }
        const smart = this.st("smartSenking") ? this.on("smartSenking") : t !== "av";
        return html`
          <div class="nk3 ${t === "aktiv" || t === "planlagt" ? "farget" : ""}" role="button"
            @click=${() => { this._haptikk("selection"); this._apneLukk("senking"); }}>
            <span class="nk3-navn">Nattsenking</span>
            <span class="fik3 nk3-ik"><ha-icon icon="mdi:weather-night"></ha-icon></span>
            <span class="nk3-stor">${stor}</span>
            <span class="nk3-under">${under}</span>
            ${this.st("smartSenking") ? html`<button class="tog3 ${smart ? "pa" : ""}" aria-label="Smart nattsenking"
              @click=${(e) => { e.stopPropagation(); this._veksle("smartSenking"); }}><i></i></button>` : ""}
          </div>
          ${this._apne.senking ? this._senkingPanel(true) : ""}`;
      }

      /* Pooltaket og vintermodus som bilder (som scenene i Innstillinger-kortet). */
      _sceneFliser() {
        const fliser = [];
        if (this.st("pooltak") || this._takSensor()) {
          const pa = this._taket();
          const sensor = this._takSensor();
          const tap = Number(this.val("varmetap"));
          const uA = Number(this.val("uApen", 15)), uT = Number(this.val("uTak", 5));
          const w = (x) => (x >= 1000 ? `${nf(x / 1000, 1)} kW` : `${nf(x, 0)} W`);
          const effekt = isFinite(tap) && tap > 0 && uA > 0 && uT > 0
            ? (pa ? `sparer ${w(tap * (uA / uT - 1))}` : `tak sparer ${w(tap * (1 - uT / uA))}`) : "";
          fliser.push(html`
            <div class="sc3 tak ${pa ? "pa" : ""}" role="button"
              @pointerdown=${(e) => this._holdNed(e, "pooltak")} @pointerup=${() => this._holdOpp()}
              @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
              @contextmenu=${(e) => e.preventDefault()}
              @click=${this._holdKlikk(() => { this._haptikk("light"); if (sensor) this._merId(sensor); else this._veksle("pooltak"); })}>
              <svg class="sc3-bilde" viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs><clipPath id="kib-sc3-klipp"><rect x="46" y="66" width="138" height="30" rx="5"></rect></clipPath></defs>
                <rect width="240" height="180" fill="#2c3136"></rect>
                <rect x="40" y="60" width="150" height="42" rx="8" fill="#1e2a31"></rect>
                <rect x="46" y="66" width="138" height="30" rx="5" fill="#2a8fa3"></rect>
                <g clip-path="url(#kib-sc3-klipp)">
                  <path class="sc3-bolge" d="M6 76 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#bfe9ff" stroke-opacity=".5" fill="none"></path>
                </g>
                <g class="sc3-dekke">
                  <rect x="44" y="62" width="142" height="12" rx="4" fill="#6f8494"></rect>
                  <path d="M58 62v12M72 62v12M86 62v12M100 62v12M114 62v12M128 62v12M142 62v12M156 62v12M170 62v12" stroke="#9fb2c1"></path>
                </g>
              </svg>
              <span class="sc3-navn">Pooltak</span>
              <span class="fik3 sc3-ik"><ha-icon icon=${sensor ? `mdi:door-sliding${pa ? "" : "-open"}` : pa ? "mdi:pool" : "mdi:waves"}></ha-icon></span>
              <span class="sc3-verdi">${pa ? "Lukket" : "Åpent"}<small>${effekt || (sensor ? "fra sensoren" : "")}</small></span>
              ${sensor ? "" : html`<span class="tog3 ${pa ? "pa" : ""}"><i></i></span>`}
            </div>`);
        }
        if (this.st("vintermodus")) {
          const pa = this.on("vintermodus");
          const hus = this.attr("frostVarme", "bassenghus", this.attr("frostVarme", "temperatur"));
          fliser.push(html`
            <div class="sc3 vinter ${pa ? "pa" : ""}" role="button"
              @pointerdown=${(e) => this._holdNed(e, "vintermodus")} @pointerup=${() => this._holdOpp()}
              @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
              @contextmenu=${(e) => e.preventDefault()}
              @click=${this._holdKlikk(() => this._veksle("vintermodus"))}>
              <svg class="sc3-bilde" viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs><linearGradient id="kib-sc3-sno" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#1f2c4a"></stop><stop offset="1" stop-color="#2d3e5f"></stop></linearGradient></defs>
                <rect width="240" height="180" fill="url(#kib-sc3-sno)"></rect>
                <g class="sc3-fnugg" fill="#fff">
                  <circle style="--i:0" cx="176" cy="74" r="2"></circle><circle style="--i:1" cx="60" cy="60" r="2"></circle>
                  <circle style="--i:2" cx="48" cy="96" r="2"></circle><circle style="--i:3" cx="184" cy="100" r="2"></circle>
                  <circle style="--i:4" cx="140" cy="54" r="2"></circle><circle style="--i:5" cx="196" cy="84" r="2"></circle>
                  <circle style="--i:6" cx="76" cy="110" r="2"></circle>
                </g>
                <path d="M92 128 v-34 l30 -20 l30 20 v34 z" fill="#2b3550"></path>
                <path d="M86 96 l36 -26 l36 26" fill="none" stroke="#dfe8f5" stroke-width="5" stroke-linecap="round"></path>
                <rect class="sc3-vindu" x="112" y="104" width="20" height="16" rx="2" fill="#f5c542"></rect>
                <rect x="0" y="128" width="240" height="52" fill="#e8eef6" opacity=".18"></rect>
              </svg>
              <span class="sc3-navn">Vintermodus</span>
              <span class="fik3 sc3-ik"><ha-icon icon=${pa ? "mdi:snowflake" : "mdi:snowflake-off"}></ha-icon></span>
              <span class="sc3-verdi">${pa ? "På" : "Av"}<small>${pa && hus != null ? `huset ${nf(hus, 1)}°` : pa ? "frostsikring" : ""}</small></span>
              <span class="tog3 ${pa ? "pa" : ""}"><i></i></span>
            </div>`);
        }
        if (!fliser.length) return "";
        return html`<div class="g23 ${fliser.length === 1 ? "en" : ""}">${fliser}</div>`;
      }

      /* --- Klor (3.0) --------------------------------------------------- */

      /* Logg klor: med navn (eller uten), antallet som er valgt, og på dagen som er
         valgt i kalenderen (ellers nå). En kvittering står et par sekunder. */
      _klorLogg(hvem, dag, hvor) {
        const antall = this._klorAntall || 1;
        const data = { antall };
        if (hvem) data.hvem = hvem;
        if (dag) {
          const p = (n) => String(n).padStart(2, "0");
          data.tidspunkt = `${dag.getFullYear()}-${p(dag.getMonth() + 1)}-${p(dag.getDate())} 12:00:00`;
        }
        this._haptikk("success");
        this.hass.callService("ki_basseng", "logg_klortablett", data);
        this._klorKvittering = `${antall} ${antall === 1 ? "tablett" : "tabletter"}${hvem ? ` · ${hvem}` : ""}${dag ? ` · ${this._dato(dag)}` : ""}`;
        this.requestUpdate();
        clearTimeout(this._kvitteringTimer);
        this._kvitteringTimer = setTimeout(() => {
          this._klorKvittering = null;
          // Fra Oversikt lukkes feltet når det er gjort; på Klor blir alt stående
          if (hvor === "oversikt") this._klorApen = null;
          this.requestUpdate();
        }, 1800);
      }

      /* Dagen som er valgt i kalenderen, hvis det ikke er i dag. */
      _klorDag() {
        if (!this._kalValgt || this._kalValgt === dagNokkel(new Date())) return null;
        const [a, m, d] = this._kalValgt.split("-").map(Number);
        return new Date(a, m, d, 12, 0, 0);
      }

      _klorFane() {
        const siste = this.val("sisteKlor");
        const dager = Number(this.attr("sisteKlor", "dager_siden"));
        const forfall = this.on("klorForfall");
        const neste = this.val("nesteKlor");
        const logg = this.attr("sisteKlor", "logg") || this.attr("sisteKlor", "historikk", []) || [];
        const sisteRad = (this.attr("sisteKlor", "historikk", []) || [])[0];
        const navn = this._klorNavn();
        const per = this.attr("sisteKlor", "per_person", {}) || {};
        const antall = this._klorAntall || 1;
        const dag = this._klorDag();

        const tittel = !siste ? "Ingen klortablett logget ennå"
          : forfall ? "På tide med klortablett" : `Neste klortablett ${this._dato(neste)}`;
        const naar = !siste ? "" : !isFinite(dager) ? `Sist ${this._dato(siste)}`
          : dager < 1 ? "Lagt i i dag" : `${nf(dager, 0)} ${Math.round(dager) === 1 ? "dag" : "dager"} siden`;
        const under = [naar, sisteRad && sisteRad.hvem ? `${sisteRad.hvem} la i sist` : ""].filter(Boolean).join(" · ")
          || "Trykk på den som la i";

        const tall = (n) => per[n] || 0;
        const tabletter = (n) => `${tall(n)} ${tall(n) === 1 ? "tablett" : "tabletter"}`;
        const navneflis = (n, stor) => html`
          <button class="nv3 ${stor ? "stor" : ""}" @click=${() => this._klorLogg(n, dag, "klor")}>
            <span class="fik3"><ha-icon icon="mdi:account"></ha-icon></span>
            ${stor ? html`<small>${tabletter(n)}</small><span class="nv3-navn">${n}</span>`
              : html`<b>${n}</b><small class="nv3-tall">${tall(n)}</small>`}
          </button>`;

        /* Kalenderen står åpen til du lukker den (huskes ikke mellom økter). */
        const kalApen = !this._apne.kalLukket;
        const na = new Date();
        const iMnd = logg.filter((r) => { const d = new Date(r.tid); return d.getFullYear() === na.getFullYear() && d.getMonth() === na.getMonth(); })
          .reduce((sum, r) => sum + (r.antall || 1), 0);
        const mnd = na.toLocaleDateString("nb-NO", { month: "long" });
        const speil = this.attr("sisteKlor", "speiles_til");
        const speilNavn = speil && this.hass.states[speil] ? this.hass.states[speil].attributes.friendly_name || speil : speil;
        const intervall = Number(this.attr("nesteKlor", "intervall_dager", this.val("klorIntervall", 7))) || 7;
        const grunn = Number(this.val("klorIntervall", intervall)) || intervall;

        return html`
          <button class="kb3 ${forfall || !siste ? "varsel" : ""}" @click=${() => this._mer("sisteKlor")}>
            <span class="fik3"><ha-icon icon="mdi:pill"></ha-icon></span>
            <span class="rad3-tekst"><b>${tittel}</b><small>${under}</small></span>
          </button>

          ${this._klorKvittering ? html`<div class="kvittering"><ha-icon icon="mdi:check-circle"></ha-icon>Logget ${this._klorKvittering}</div>`
            : html`<div class="kl3-hint">${navn.length ? "Hvem la i? Trykk på navnet" : "Trykk for å logge"}${dag ? html` – logges på <b>${this._dato(dag)}</b>` : ""}.</div>`}

          ${navn.length ? html`
            <div class="nv3-grid ${navn.length === 1 ? "en" : ""}">
              ${navneflis(navn[0], true)}
              ${navn.slice(1).map((n) => navneflis(n, false))}
            </div>` : ""}

          <button class="lg3" @click=${() => this._klorLogg("", dag, "klor")}>
            <span class="fik3"><ha-icon icon="mdi:pill"></ha-icon></span>${navn.length ? "Logg klortablett uten navn" : "Logg klortablett"}
          </button>

          <div class="chips3">
            ${[1, 2, 3].map((n) => html`
              <button class="chip3 ${antall === n ? "pa" : ""}"
                @click=${() => { this._klorAntall = n; this._haptikk("selection"); this.requestUpdate(); }}>
                <ha-icon icon="mdi:pill"></ha-icon>${n} stk</button>`)}
            ${dag ? html`<button class="chip3 dag" @click=${() => { this._kalValgt = null; this.requestUpdate(); }}>
                <ha-icon icon="mdi:calendar"></ha-icon>${this._dato(dag)}<ha-icon icon="mdi:close"></ha-icon></button>` : ""}
            ${this.st("angreKlor") && logg.length ? html`<button class="chip3"
                @click=${() => { this._haptikk("medium"); this._trykk("angreKlor"); }}>
                <ha-icon icon="mdi:undo"></ha-icon>Angre siste</button>` : ""}
          </div>

          <section class="akk3 ${kalApen ? "apen" : ""}">
            <button class="akk3-hode" @click=${() => { this._haptikk("selection"); this._apneLukk("kalLukket"); }}>
              <ha-icon icon="mdi:calendar-month"></ha-icon><b>Kalender</b>
              <span>${iMnd} i ${mnd}</span>
              <ha-icon class="akk3-pil" icon="mdi:chevron-${kalApen ? "up" : "down"}"></ha-icon>
            </button>
            ${kalApen ? this._klorKalender(neste, true) : ""}
          </section>

          ${this.st("klorIntervall") ? html`
            <label class="rad3 bred">
              <span class="fik3"><ha-icon icon="mdi:bell-ring-outline"></ha-icon></span>
              <span class="rad3-tekst"><b>Påminnelse</b>
                <small>Hver ${nf(grunn, grunn % 1 ? 1 : 0)}. dag${Math.abs(intervall - grunn) > 0.05 ? ` · nå ${nf(intervall, 1)} dager fordi vannet er varmt` : " · oftere i varmt vann"}</small></span>
              <ha-icon class="rad3-pil" icon="mdi:chevron-down"></ha-icon>
              ${this._velgerSelect("klorIntervall", { step: 0.5, desimaler: 1, suffiks: " d" })}
            </label>` : ""}
          <button class="rad3 bred" @click=${() => (speil ? this._merId(speil) : this._mer("klorKalender"))}>
            <span class="fik3"><ha-icon icon="mdi:calendar-sync"></ha-icon></span>
            <span class="rad3-tekst"><b>${speil ? "Kalender" : "Klorloggen"}</b>
              <small>${speil ? `Skriver også til ${speilNavn}` : "Velg en kalender under Utstyr, så skrives tablettene dit også"}</small></span>
            <ha-icon class="rad3-pil" icon="mdi:chevron-right"></ha-icon>
          </button>
          ${this.id("klorNavn") ? html`
            <button class="rad3 bred" @click=${() => { this._haptikk("selection"); this._apneLukk("klorNavn"); }}>
              <span class="fik3"><ha-icon icon="mdi:account-multiple-check"></ha-icon></span>
              <span class="rad3-tekst"><b>Navn i klorloggen</b><small>${navn.length ? navn.join(", ") : "Legg til hvem som legger i klor"}</small></span>
              <ha-icon class="rad3-pil" icon="mdi:chevron-${this._apne.klorNavn ? "up" : "right"}"></ha-icon>
            </button>
            ${this._apne.klorNavn ? this._klorNavnPanel(true) : ""}` : ""}
        `;
      }

      /* Varmemodellen under tannhjulet: tallene den regner med, og det den har lært. */
      _modellPanel() {
        if (!this._harVarme()) return "";
        const f = (n) => this.attr("varmetap", n);
        const laert = [
          ["Tap uten tak", f("laert_tapsfaktor_uten_tak")],
          ["Tap med tak", f("laert_tapsfaktor_med_tak")],
          ["COP", f("laert_cop_faktor")],
        ].filter(([, v]) => v !== undefined && v !== null);
        return this._panel("mdi:function-variant", "var(--kib-orange)", "Varmemodell", "Tallene nattsenkingen regner med", html`
          <div class="pliste">
            ${this._bryterRad("styrSettpunkt", "Styr settpunkt")}
            ${this._velger("borteSenking", "Senking når ingen er hjemme", { step: 0.5, desimaler: 1, suffiks: "°" })}
            ${this._velger("uApen", "Varmetap uten tak", { step: 0.5, desimaler: 1, suffiks: " W/m²K" })}
            ${this._velger("uTak", "Varmetap med tak", { step: 0.5, desimaler: 1, suffiks: " W/m²K" })}
            ${this._velger("solTak", "Sol gjennom taket", { step: 5, suffiks: " %" })}
            ${this._bryterRad("solvarme", "Solvarme (med solfanger)")}
            ${this._velger("klorIntervall", "Klortablett hver", { step: 0.5, desimaler: 1, suffiks: " d" })}
            ${this._bryterRad("tvingHeat", "Tving varmepumpa til heat")}
          </div>
          ${laert.length ? html`<div class="chips">${laert.map(([n, v]) =>
            html`<span class="chip">${n} ×${nf(v, 2)}</span>`)}</div>
            <div class="dempet">Faktorene læres fra målinger. 1,00 betyr at tabellverdiene stemmer.</div>` : ""}
        `);
      }

      /* Varsler øverst i Oversikt: bare det som ber om noe. */
      _varsler() {
        const ut = [];
        /* Klor har ikke eget banner lenger (3.0): Klor-raden nederst på Oversikt blir
           oransje når det er på tide, og et trykk tar deg til Klor-fanen. */
        if (this.val("senking") === "aktiv") {
          ut.push(html`<button class="banner natt-b" @click=${() => { this._tilVarme(); }}>
            <span class="bik"><ha-icon icon="mdi:weather-night"></ha-icon></span>
            <span><b>Nattsenking til ${this.attr("senking", "til", "–")}</b>
              <small>Sparer ${nf(this.attr("senking", "spart_kwh"), 1)} kWh i natt</small></span>
          </button>`);
        }
        const blokk = this.attr("modus", "varmer_ikke_fordi");
        if (blokk && this.val("senking") !== "aktiv" && !this.on("vintermodus")) {
          ut.push(html`<button class="banner info" @click=${() => this._mer("modus")}>
            <span class="bik"><ha-icon icon="mdi:thermometer-alert"></ha-icon></span>
            <span><b>Varmer ikke</b><small>${blokk}</small></span>
          </button>`);
        }
        return ut.length ? html`<div class="bannere">${ut}</div>` : "";
      }

      /* --- deler ----------------------------------------------------- */

      /* Bassengscenen øverst (3.0): teksten til venstre, bassenget fra siden til høyre.
       *
       * Scenen er én svg i én mal – Lit har ingen svg-tag her, og en nøstet mal ville
       * lagt figurene i HTML-navnerommet, der de ikke tegnes. Alt som kan skje står
       * derfor i svg-en hele tiden, og klassene på flaten slår det av og på:
       *   gar     – pumpa går: bølgene beveger seg og bobler stiger
       *   varmer  – varmepumpa trekker strøm: viften snurrer, varmen blåser, damp stiger
       *   tak     – pooltaket ligger på
       *   natt    – nattsenking: månen, og en mørkere himmel
       *   vinter  – snø og kaldere farger
       *   lys     – bassenglyset er på (fra hurtigknappene)
       */
      _hero() {
        const modus = this.val("modus", "hvile");
        const [tekst, , ikon] = MODUS[modus] || [modus, "", "mdi:pump"];
        const gjort = Number(this.val("omsetninger", 0)) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const andel = Math.max(0, Math.min(1, gjort / mal));
        const gar = this.on("skalGa") || ["filtrering", "oppvarming", "boost", "solvarme", "frostsikring"].includes(modus);
        /* «Varmer» avgjøres av effekten varmepumpa faktisk trekker, ikke av en
           bryter: pumpa kan stå i heat uten å kjøre. Over 100 W regnes som i gang. */
        const varmer = ["oppvarming", "boost"].includes(modus) || Number(this.val("vpEffekt", 0)) > 100;
        const vinter = this.on("vintermodus");
        const harVarme = this._harVarme();
        const temp = harVarme ? this._vannTemp() : this.val("vanntemp");
        const maltemp = this._malTemp();
        const tak = this.st("pooltak") || this._takSensor() ? this._taket() : false;
        const natt = this.val("senking") === "aktiv";
        const borte = this._borte();
        const lys = this._hurtigListe().some((x) => x.entity.startsWith("light.")
          && this.hass.states[x.entity] && this.hass.states[x.entity].state === "on");
        const grad = (v) => `${nf(v, 1)}°`;
        const malTekst = maltemp != null ? `${nf(maltemp, maltemp % 1 ? 1 : 0)}°` : null;

        let pille = null, pilleIkon = ikon, pilleKl = "";
        if (vinter) {
          const hus = this.attr("frostVarme", "bassenghus", this.attr("frostVarme", "temperatur"));
          pille = hus != null ? `Vinter · huset ${grad(hus)}` : "Vintermodus";
          pilleIkon = "mdi:snowflake"; pilleKl = "bla";
        } else if (natt) {
          pille = `Nattsenking til ${this.attr("senking", "til", "–")}`;
          pilleIkon = "mdi:weather-night"; pilleKl = "lilla";
        } else if (varmer) {
          pille = `Varmer${temp != null && malTekst ? ` · ${grad(temp)} → ${malTekst}` : ""}`;
          pilleIkon = "mdi:heat-wave"; pilleKl = "varm";
        } else if (harVarme && temp != null && maltemp != null) {
          if (temp >= maltemp - 0.2) { pille = `På målet ${malTekst}`; pilleIkon = "mdi:check"; pilleKl = "gronn"; }
          else { pille = `Under målet · ${grad(temp)} → ${malTekst}`; pilleIkon = "mdi:thermometer-low"; }
        }
        const malLinje = !vinter && malTekst ? `mål ${malTekst}${borte ? " · ingen hjemme" : ""}` : vinter ? "vintermodus" : "";

        return html`
          <div class="hero3 ${gar ? "gar" : ""} ${varmer ? "varmer" : ""} ${tak ? "tak" : ""} ${natt ? "natt" : ""} ${vinter ? "vinter" : ""} ${lys ? "lys" : ""}"
            title=${this.attr("modus", "begrunnelse", "") || ""} @click=${() => this._mer("modus")}>
            <svg class="h3-scene" viewBox="0 0 220 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
              <defs>
                <linearGradient id="kib-h3-vann" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#2fa0b4"></stop><stop offset="1" stop-color="#135b6c"></stop>
                </linearGradient>
                <radialGradient id="kib-h3-glod" cx=".82" cy="1" r=".9">
                  <stop offset="0" stop-color="#ff7850" stop-opacity=".38"></stop><stop offset="1" stop-color="#ff7850" stop-opacity="0"></stop>
                </radialGradient>
                <radialGradient id="kib-h3-lys" cx=".5" cy="1" r=".9">
                  <stop offset="0" stop-color="#c8f6ff" stop-opacity=".7"></stop><stop offset="1" stop-color="#c8f6ff" stop-opacity="0"></stop>
                </radialGradient>
                <clipPath id="kib-h3-klipp"><rect x="24" y="99" width="140" height="56" rx="5"></rect></clipPath>
              </defs>
              <rect class="h3-glod" width="220" height="180" fill="url(#kib-h3-glod)"></rect>
              <g class="h3-mane"><circle cx="64" cy="36" r="10" fill="#f3f0dc"></circle><circle cx="69" cy="32" r="9" fill="#1b1f35"></circle></g>
              <g class="h3-sno" fill="#fff">
                <circle style="--i:0" cx="40" cy="20" r="1.6"></circle><circle style="--i:1" cx="90" cy="8" r="1.2"></circle>
                <circle style="--i:2" cx="140" cy="26" r="1.6"></circle><circle style="--i:3" cx="190" cy="12" r="1.2"></circle>
                <circle style="--i:4" cx="116" cy="50" r="1.4"></circle><circle style="--i:5" cx="64" cy="60" r="1.2"></circle>
                <circle style="--i:6" cx="170" cy="58" r="1.4"></circle><circle style="--i:7" cx="206" cy="44" r="1.2"></circle>
              </g>
              <rect x="0" y="152" width="220" height="28" fill="#1a262d"></rect>
              <rect x="18" y="92" width="152" height="9" rx="3" fill="#2a3a44"></rect>
              <rect x="24" y="99" width="140" height="56" rx="5" fill="#1f2f39"></rect>
              <g clip-path="url(#kib-h3-klipp)">
                <g class="h3-vannet">
                  <rect x="24" y="106" width="140" height="50" fill="url(#kib-h3-vann)"></rect>
                  <path class="h3-bolge" d="M4 106 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V160 H4 Z" fill="url(#kib-h3-vann)"></path>
                </g>
                <rect class="h3-lysflate" x="24" y="99" width="140" height="56" fill="url(#kib-h3-lys)"></rect>
                <rect x="50" y="116" width="34" height="1.8" rx=".9" fill="#fff" opacity=".18"></rect>
                <rect x="100" y="128" width="22" height="1.6" rx=".8" fill="#fff" opacity=".14"></rect>
                <g class="h3-bobler" fill="#cfeeff">
                  <circle style="--i:0" cx="44" cy="156" r="1.6"></circle><circle style="--i:1" cx="72" cy="156" r="1.2"></circle>
                  <circle style="--i:2" cx="98" cy="156" r="1.8"></circle><circle style="--i:3" cx="122" cy="156" r="1.3"></circle>
                  <circle style="--i:4" cx="140" cy="156" r="1.6"></circle><circle style="--i:5" cx="156" cy="156" r="1.1"></circle>
                </g>
              </g>
              <g class="h3-tak">
                <rect x="22" y="97" width="144" height="9" rx="3" fill="#5f7383"></rect>
                <path d="M34 97v9M50 97v9M66 97v9M82 97v9M98 97v9M114 97v9M130 97v9M146 97v9" stroke="#8196a6"></path>
              </g>
              <path d="M30 92 q6 -12 12 0" fill="none" stroke="#8b9aa4" stroke-width="2" stroke-linecap="round"></path>
              <g class="h3-damp" stroke="#ffd9c2" stroke-width="1.4" fill="none" stroke-linecap="round">
                <path style="--i:0" d="M66 88 q2 -3 0 -6 q-2 -3 0 -6"></path>
                <path style="--i:1" d="M90 86 q2 -3 0 -6 q-2 -3 0 -6"></path>
                <path style="--i:2" d="M114 88 q2 -3 0 -6 q-2 -3 0 -6"></path>
              </g>
              <rect x="176" y="104" width="38" height="50" rx="6" fill="#233039" stroke="#33454f"></rect>
              <circle cx="195" cy="123" r="12" fill="#162028"></circle>
              <path class="h3-vifte" d="M195 123 q-2 -9 5 -11 q1 6 -5 11 M195 123 q9 -2 11 5 q-6 1 -11 -5 M195 123 q2 9 -5 11 q-1 -6 5 -11 M195 123 q-9 2 -11 -5 q6 -1 11 5" fill="#93a4af"></path>
              <path d="M180 140 h30 M180 144 h30 M180 148 h30" stroke="#33454f"></path>
              <g class="h3-varme" stroke="#ff9a6b" stroke-width="1.6" fill="none" stroke-linecap="round">
                <path style="--i:0" d="M171 128 q-3 -4 0 -8"></path><path style="--i:1" d="M169 138 q-3 -4 0 -8"></path>
              </g>
            </svg>
            <div class="h3-tekst">
              <div class="h3-navn">${tekst}</div>
              ${pille ? html`<span class="h3-pille ${pilleKl}"><ha-icon icon=${pilleIkon}></ha-icon>${pille}</span>` : ""}
              <div class="h3-temp" @click=${(e) => { e.stopPropagation(); this._mer("vanntemp"); }}>${nf(temp, 1)}<small>°C</small></div>
              ${malLinje ? html`<div class="h3-under">${malLinje}</div>` : ""}
              <div class="h3-under">${nf(gjort, 2)} av ${nf(mal, 2)} omsetninger</div>
              <div class="h3-stolpe"><i style="width:${(andel * 100).toFixed(0)}%"></i></div>
            </div>
          </div>
        `;
      }

      /* --- Oversikt (3.0) ---------------------------------------------- */

      _oversikt() {
        const valuta = this.enhet("spart") || this.enhet("kostnad") || "kr";
        const effekt = (Number(this.val("pumpeEffekt", 0)) || 0) + (Number(this.val("vpEffekt", 0)) || 0);
        const ute = this.attr("varmetap", "utetemperatur");
        const spart = Number(this.val("spart", 0)) || 0;
        const iGar = this.attr("spart", "i_gar");
        const temp = this._harVarme() ? this._vannTemp() : this.val("vanntemp");
        const kw = (w) => (w >= 1000 ? [nf(w / 1000, 1), "kW"] : [nf(w, 0), "W"]);
        const [effV, effE] = kw(effekt);
        const venstre = [
          { ikon: "mdi:pool-thermometer", navn: "Vann", verdi: nf(temp, 1), enhet: "°C", klikk: () => this._mer("vanntemp"), nokkel: "vanntemp" },
          ute != null ? { ikon: "mdi:thermometer", navn: "Ute", verdi: nf(ute, 1), enhet: "°C", klikk: () => this._mer("varmetap"), nokkel: "varmetap" } : null,
          { ikon: "mdi:flash", navn: "Effekt nå", verdi: effV, enhet: effE, klikk: () => this._mer("vpEffekt"), nokkel: "pumpeEffekt" },
        ].filter(Boolean);
        const hoyre = [
          { ikon: "mdi:piggy-bank-outline", navn: "Spart i dag", verdi: nf(spart, 0), enhet: valuta, kl: spart > 0 ? "gron" : "",
            klikk: () => this._apneLukk("spart"), nokkel: "spart" },
          iGar != null ? { ikon: "mdi:calendar-arrow-left", navn: "Spart i går", verdi: nf(iGar, 0), enhet: valuta, klikk: () => this._apneLukk("spart"), nokkel: "spart" } : null,
          { ikon: "mdi:cash", navn: "Kostnad i dag", verdi: nf(this.val("kostnad", 0), 0), enhet: this.enhet("kostnad") || valuta, klikk: () => this._mer("kostnad"), nokkel: "kostnad" },
        ].filter(Boolean);
        return html`
          ${this._varsler()}
          <div class="g23">
            ${this._sveip("venstre", venstre)}
            ${this._sveip("hoyre", hoyre)}
          </div>
          ${this._setning()}
          ${this._idagListe()}
          ${this._apne.spart ? this._sparPanel() : ""}
          ${this._profiler()}
          ${this._brytere()}
          ${this._klorApen === "oversikt" ? html`<section class="panel klorfelt">${this._klorLogger("oversikt")}</section>` : ""}
          ${this._config.graf !== false && !this._harVarme()
            ? this._panel("mdi:chart-bell-curve-cumulative", "var(--kib-orange)", "Vanntemperatur", "",
                this._graf(), this._vinduvelger(), () => this._mer("vanntemp"))
            : ""}
          ${this.on("overstyrt") ? html`<div class="varsel">Manuell overstyring – automatikken venter.</div>` : ""}
          ${this.on("vpVenter") ? html`<div class="varsel">Varmepumpen står av til sirkulasjonen er tilbake.</div>` : ""}
        `;
      }

      /* Store fliser du blar i sidelengs (som bilflisene i Tesla-kortet), med prikker
         under. Trykk åpner det tallet står for, langt trykk entiteten. */
      _sveip(nokkel, sider) {
        const i = Math.min(this._sveipIdx[nokkel] || 0, sider.length - 1);
        return html`
          <div class="sv3">
            <div class="sv3-spor" @scroll=${(e) => this._sveipet(e, nokkel)}>
              ${sider.map((x) => html`
                <button class="fl3 sv3-side"
                  @pointerdown=${(e) => x.nokkel && this._holdNed(e, x.nokkel)} @pointerup=${() => this._holdOpp()}
                  @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
                  @contextmenu=${(e) => e.preventDefault()}
                  @click=${this._holdKlikk(() => { this._haptikk("light"); x.klikk(); })}>
                  <span class="fik3"><ha-icon icon=${x.ikon}></ha-icon></span>
                  <span class="fl3-navn">${x.navn}</span>
                  <span class="fl3-verdi ${x.kl || ""}">${x.verdi}<small>${x.enhet || ""}</small></span>
                </button>`)}
            </div>
            ${sider.length > 1 ? html`<div class="prikker3">${sider.map((_, j) => html`<i class=${j === i ? "a" : ""}></i>`)}</div>` : ""}
          </div>`;
      }

      _sveipet(e, nokkel) {
        const el = e.currentTarget;
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
        if (i !== (this._sveipIdx[nokkel] || 0)) this._sveipIdx = { ...this._sveipIdx, [nokkel]: i };
      }

      /* Setningene tegnes av ki-prosa-card, samme kort som forsideteksten i dashbordet.
       *
       * Hver del er { t, v, k }: teksten med {pille} der verdien står, verdien, og
       * entiteten et trykk på pillen åpner. ki-prosa-card har én pille per setning, så
       * en lang setning deles i biter som står etter hverandre. Er ki-prosa-card ikke
       * lastet (kortet brukt alene), tegnes de samme bitene her. */
      _prosa(navn, deler) {
        if (!deler.length) return "";
        const std = { vaer: false, pris: false, effekt: false, lys: false, kalender: false, ringeklokke: false,
          laser: false, planter: false, bursdag: false, apparater: false, hjemkomst: false, spot: false };
        if (customElements.get("ki-prosa-card")) {
          this._prosaEl = this._prosaEl || {};
          let el = this._prosaEl[navn];
          if (!el) { el = document.createElement("ki-prosa-card"); el.classList.add("prosa3"); this._prosaEl[navn] = el; }
          const konf = {
            ...std,
            storrelse: this._config.prosa_storrelse || "1.2em",
            setninger: deler.map((d) => (d.v === undefined ? { tekst: d.t }
              : { tekst: d.t, pille: { mal: d.v, mer: d.k ? this.id(d.k) || undefined : undefined, id: `${navn}-${d.t}` } })),
          };
          const json = JSON.stringify(konf);
          if (el._kibKonf !== json) { el._kibKonf = json; el.setConfig(konf); }
          el.hass = this.hass;
          return el;
        }
        return html`<p class="setn3">${deler.map((d, i) => {
          const [for_, etter = ""] = d.t.split("{pille}");
          return html`${i ? " " : ""}${for_}${d.v === undefined ? "" : html`<b class="pl3"
            @click=${(e) => { e.stopPropagation(); if (d.k) this._mer(d.k); }}>${d.v}</b>`}${etter}`;
        })}</p>`;
      }

      /* Hva som skjer, sagt i setninger (som forsideteksten):
         «Vannet når 27° om ca 2 t 10 min. Pumpa starter 23:00, og i natt står varmen
         av 23–04 og sparer ca 2 kroner.» */
      _setning() {
        const deler = [];
        const vinter = this.on("vintermodus");
        if (vinter) {
          const hus = this.attr("frostVarme", "bassenghus", this.attr("frostVarme", "temperatur"));
          if (hus != null) {
            deler.push({ t: this.on("frostVarme") ? "Vintermodus: bassenghuset er {pille}, og varmeelementene varmer."
              : "Vintermodus: bassenghuset er {pille}.", v: `${nf(hus, 1)}°`, k: "frostVarme" });
          } else deler.push({ t: "Vintermodus holder bassenghuset frostfritt." });
        } else if (this._harVarme()) {
          const vann = this._vannTemp(), mal = this._malTemp();
          const min = this.attr("maltemp", "minutter_til_mal");
          const rekker = this.attr("maltemp", "rekker_malet");
          if (vann != null && mal != null) {
            const v = `${nf(vann, 1)}°`, m = `${nf(mal, mal % 1 ? 1 : 0)}°`;
            if (vann >= mal - 0.2) deler.push({ t: "Vannet er {pille} og på målet.", v, k: "vanntemp" });
            else if (min != null && min > 0) {
              deler.push({ t: "Vannet når {pille}", v: m, k: "onsketTemp" });
              deler.push({ t: "om ca {pille}.", v: varighet(min), k: "maltemp" });
            } else if (rekker === false) {
              deler.push({ t: "Vannet er {pille},", v, k: "vanntemp" });
              deler.push({ t: "og varmepumpa rekker ikke {pille} med dette været.", v: m, k: "onsketTemp" });
            } else {
              deler.push({ t: "Vannet er {pille},", v, k: "vanntemp" });
              deler.push({ t: "og målet er {pille}.", v: m, k: "onsketTemp" });
            }
          }
        } else {
          const t = this.val("vanntemp");
          if (t != null) deler.push({ t: "Vannet er {pille}.", v: `${nf(t, 1)}°`, k: "vanntemp" });
        }
        const modus = this.val("modus", "hvile");
        const neste = klokke(this.val("nesteStart"));
        const gar = ["filtrering", "oppvarming", "boost", "solvarme", "frostsikring"].includes(modus);
        const s = this.val("senking");
        const a = (this.st("senking") || {}).attributes || {};
        const valuta = this.enhet("kostnad") || "kr";
        const natt = [];
        if (!vinter && s === "planlagt") {
          const spar = Number(a.spart_kostnad);
          if (spar > 0.005) {
            natt.push({ t: "og i natt står varmen av {pille}", v: kortVindu(a.fra, a.til), k: "senking" });
            natt.push({ t: "og sparer ca {pille}.", v: kroner(spar, valuta), k: "senking" });
          } else natt.push({ t: "og i natt står varmen av {pille}.", v: kortVindu(a.fra, a.til), k: "senking" });
        } else if (!vinter && s === "aktiv") {
          natt.push({ t: "og varmen står av til {pille}.", v: a.til || "–", k: "senking" });
        }
        const tegn = natt.length ? "," : ".";
        deler.push(gar ? { t: `Pumpa går nå${tegn}` }
          : neste ? { t: `Pumpa starter {pille}${tegn}`, v: neste, k: "nesteStart" }
          : { t: `Ingen pumpestart er planlagt${tegn}` });
        deler.push(...natt);
        return this._prosa("oversikt", deler);
      }

      /* Dagens tall som en liste (som «I dag» i Strøm-kortet). */
      _idagListe() {
        const na = new Date();
        const dato = na.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
        const valuta = this.enhet("spart") || this.enhet("kostnad") || "kr";
        const gjort = Number(this.val("omsetninger", 0)) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const spart = Number(this.val("spart", 0)) || 0;
        const rad = (navn, verdi, enhet, pil, klikk, nokkel) => html`
          <button class="lr3"
            @pointerdown=${(e) => this._holdNed(e, nokkel)} @pointerup=${() => this._holdOpp()}
            @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
            @contextmenu=${(e) => e.preventDefault()}
            @click=${this._holdKlikk(() => { this._haptikk("selection"); klikk(); })}>
            <span class="lr3-navn">${navn}</span>
            <span class="lr3-verdi">${verdi}<small>${enhet}</small></span>
            <ha-icon class="lr3-pil ${pil[1]}" icon=${pil[0]}></ha-icon>
          </button>`;
        return html`
          <div class="dag3"><ha-icon icon="mdi:home-outline"></ha-icon><b>I dag</b><span>${dato.slice(0, 1).toUpperCase() + dato.slice(1)}</span></div>
          <div class="liste3">
            ${rad("Pumpet", nf(this.val("pumpetid", 0), 1), "t", ["mdi:chevron-right", ""], () => this._mer("pumpetid"), "pumpetid")}
            ${rad("Omsetninger", nf(gjort, 2), `av ${nf(mal, 2)}`, gjort >= mal ? ["mdi:check", "gronn"] : ["mdi:arrow-right", "oransje"],
              () => this._mer("omsetninger"), "omsetninger")}
            ${rad("Spart", nf(spart, 0), valuta, [`mdi:chevron-${this._apne.spart ? "up" : "down"}`, spart > 0 ? "gronn" : ""],
              () => this._apneLukk("spart"), "spart")}
          </div>`;
      }

      /* Profilene som scener i en rad du ruller (som i Tesla- og Pult-kortene):
         boost og spreder først, så driftsprofilene. Den valgte er fylt. */
      _profiler() {
        const s = this.st("profil");
        const valgt = s ? s.state : null;
        const opts = (s && s.attributes.options) || [];
        const spredGar = this.on("spreder");
        const liste = [];
        if (this.st("boost")) {
          liste.push({ ikon: "mdi:fan-plus", navn: "Boost", pa: this.val("modus") === "boost",
            klikk: () => this._trykk("boost"), nokkel: "boost" });
        }
        if (this.st("startSpreder")) {
          liste.push({ ikon: spredGar ? "mdi:sprinkler-variant" : "mdi:sprinkler",
            navn: spredGar ? `${Math.ceil(this.val("spredertid", 0) || 0)} min` : "Spreder", pa: spredGar,
            klikk: () => this._trykk(spredGar ? "stoppSpreder" : "startSpreder"), nokkel: "spreder" });
        }
        for (const o of opts) {
          if (o === "egendefinert" && valgt !== o) continue;
          liste.push({ ikon: PROFIL_IKON[o] || "mdi:tune-variant", navn: PROFIL[o] || o, pa: valgt === o,
            klikk: () => this._velg(o), nokkel: "profil" });
        }
        if (!liste.length) return "";
        return html`
          <div class="sk3-rad">
            ${liste.map((x) => html`
              <button class="sk3 ${x.pa ? "pa" : ""}"
                @pointerdown=${(e) => this._holdNed(e, x.nokkel)} @pointerup=${() => this._holdOpp()}
                @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
                @contextmenu=${(e) => e.preventDefault()}
                @click=${this._holdKlikk(() => { this._haptikk("light"); x.klikk(); })}>
                <ha-icon icon=${x.ikon}></ha-icon><span>${x.navn}</span>
              </button>`)}
          </div>`;
      }

      /* Bryterne som fargede rader, to i bredden (som i Innstillinger-kortet): fylt når
         de er på. Klor blir oransje når det er på tide, og tar deg til Klor-fanen. */
      _brytere() {
        const bryter = (key, ikon, navn) => (this.st(key)
          ? { ikon, navn, tekst: this.on(key) ? "På" : "Av", pa: this.on(key), klikk: () => this._veksle(key), nokkel: key }
          : null);
        const rader = [
          /* Myke bindestreker: på en smal telefon deles «Varme-prioritet» heller enn å kuttes */
          bryter("auto", "mdi:robot-outline", "Automatikk"),
          bryter("pris", "mdi:cash-clock", "Pris\u00adstyring"),
          bryter("varme", "mdi:heat-wave", "Varme\u00adprioritet"),
        ];
        if (this._harKlor()) {
          const forfall = this.on("klorForfall");
          const d = Number(this.attr("sisteKlor", "dager_siden"));
          rader.push({ ikon: "mdi:pill", navn: "Klor", varsel: forfall, nokkel: "sisteKlor",
            tekst: forfall ? (isFinite(d) ? `På tide · ${nf(d, 0)} d siden` : "På tide") : isFinite(d) ? `${nf(d, 0)} d siden` : "Logg",
            klikk: () => this._tilKlor() });
        } else {
          rader.push(bryter("tvingVarme", "mdi:fire", "Varm nå"));
        }
        const liste = rader.filter(Boolean);
        if (!liste.length) return "";
        return html`
          <div class="br3 ${liste.length % 2 ? "odde" : ""}">
            ${liste.map((x) => html`
              <button class="rad3 ${x.pa ? "pa" : ""} ${x.varsel ? "varsel" : ""}"
                @pointerdown=${(e) => this._holdNed(e, x.nokkel)} @pointerup=${() => this._holdOpp()}
                @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
                @contextmenu=${(e) => e.preventDefault()}
                @click=${this._holdKlikk(() => { this._haptikk("light"); x.klikk(); })}>
                <span class="fik3"><ha-icon icon=${x.ikon}></ha-icon></span>
                <span class="rad3-tekst"><b>${x.navn}</b><small>${x.tekst}</small></span>
              </button>`)}
          </div>`;
      }

      /* «Spart i dag», delt opp (KI Basseng 1.6).
       *
       * Tallet i cella er det målte: pumpa mot døgndrift. Her står hva det består av –
       * færre pumpetimer og billigere timer, som går opp i det målte – og under det
       * anslagene fra varmemodellen: nattsenkingen og pooltaket. Nederst i går, denne
       * måneden og totalt. Mot eldre integrasjon står bare det målte tallet. */
      _sparPanel() {
        const st = this.st("spart");
        const a = (st && st.attributes) || {};
        const valuta = this.enhet("spart") || this.enhet("kostnad") || "kr";
        const spart = Number(this.val("spart", 0)) || 0;
        const tall = (v) => v !== undefined && v !== null && v !== "" && isFinite(v);
        const kr = (v, d = 2) => (tall(v) ? `${nf(v, d)} ${valuta}` : "–");
        const harDel = tall(a.sirkulasjon_kr);
        /* KI Basseng før 1.6 har ikke oppdelingen i det hele tatt */
        const nyIntegrasjon = "uten_ki_kr" in a || "i_gar" in a;
        const hel = (v) => Number(v).toLocaleString("nb-NO", { maximumFractionDigits: 0 });
        const uten = Number(a.uten_ki_kr), med = Number(a.med_ki_kr);
        const harSammen = isFinite(uten) && isFinite(med) && uten > 0;
        const topp = harSammen ? Math.max(uten, med, 0.01) : 1;
        const rad = (ikon, navn, under, verdi, klasse = "") => html`
          <div class="sprad ${klasse}">
            <span class="spik"><ha-icon icon="${ikon}"></ha-icon></span>
            <span class="spnavn"><b>${navn}</b><small>${under}</small></span>
            <span class="spverdi">${verdi}</span>
          </div>`;
        const taket = Number(a.pooltak_kr_anslatt);
        const taketKwh = Number(a.pooltak_kwh_anslatt);
        return this._panel("mdi:piggy-bank-outline", "var(--kib-green)", "Spart i dag",
          html`<span class="spstor ${spart > 0 ? "gron" : ""}">${kr(spart)}</span> mot pumpe i døgndrift`,
          html`
            ${harSammen ? html`
              <div class="sammen">
                <div class="srad"><span>Uten KI</span>
                  <span class="sspor"><i style="width:${(uten / topp * 100).toFixed(1)}%"></i></span>
                  <span class="sv">${kr(uten)}</span></div>
                <div class="srad med gron"><span>Med KI</span>
                  <span class="sspor"><i style="width:${(med / topp * 100).toFixed(1)}%"></i></span>
                  <span class="sv">${kr(med)}</span></div>
              </div>` : ""}
            <div class="spliste">
              ${harDel ? html`
                ${rad("mdi:pump", "Færre pumpetimer",
                  tall(a.timer_med_pris)
                    ? `Pumpa gikk ${nf(a.pumpetimer, 1)} t av ${nf(a.timer_med_pris, 1)} t · ${nf(a.sirkulasjon_kwh, 1)} kWh mindre`
                    : `${nf(a.sirkulasjon_kwh, 1)} kWh mindre`,
                  kr(a.sirkulasjon_kr))}
                ${rad("mdi:cash-clock", "Billigere timer",
                  tall(a.snittpris_pumpe)
                    ? `Pumpa betalte ${nf(a.snittpris_pumpe, 2)} mot snittet ${nf(a.snittpris_dogn_sa_langt, 2)} ${valuta}/kWh`
                    : "Pumpa har ikke gått i timer med pris ennå",
                  kr(a.billigere_timer_kr), Number(a.billigere_timer_kr) < 0 ? "minus" : "")}
              ` : html`<div class="tips"><ha-icon icon="mdi:information-outline"></ha-icon>
                  ${nyIntegrasjon
                    ? "Oppdelingen kommer fra neste døgn – i dag startet tellerne midt i døgnet."
                    : "Oppdater KI Basseng til 1.6 for å se hva besparelsen består av."}</div>`}
              ${this.st("senking") ? rad("mdi:weather-night", "Nattsenking",
                  Number(a.nattsenking_kwh_anslatt) > 0 ? `${nf(a.nattsenking_kwh_anslatt, 1)} kWh · anslått av modellen` : "Ingen senking startet i dag",
                  Number(a.nattsenking_kr_anslatt) > 0 ? kr(a.nattsenking_kr_anslatt) : "–", "anslag") : ""}
              ${this.st("pooltak") && isFinite(taketKwh) && Math.abs(taketKwh) > 0.005 ? rad("mdi:pool", "Pooltaket",
                  taketKwh >= 0 ? `Hindret ${nf(taketKwh, 1)} kWh varmetap · anslått` : `Stengte ute sol for ${nf(-taketKwh, 1)} kWh · anslått`,
                  isFinite(taket) ? kr(taket) : "–", `anslag ${taket < 0 ? "minus" : ""}`) : ""}
            </div>
            ${tall(a.med_nattsenking_kr) && Number(a.nattsenking_kr_anslatt) > 0 ? html`
              <div class="sptotal"><span>Med nattsenkingen</span><b>${kr(a.med_nattsenking_kr)}</b></div>` : ""}
            ${tall(a.totalt) ? html`
              <div class="sphist">
                <button @click=${() => this._mer("spart")}><small>I går</small><b>${hel(a.i_gar)}<em> ${valuta}</em></b></button>
                <button @click=${() => this._mer("spart")}><small>Denne måneden</small><b>${hel(a.denne_maneden)}<em> ${valuta}</em></b></button>
                <button @click=${() => this._mer("spart")}><small>Totalt</small><b>${hel(a.totalt)}<em> ${valuta}</em></b></button>
              </div>` : ""}
          `,
          html`<button class="sp-lukk" aria-label="Lukk" @click=${(e) => { e.stopPropagation(); this._apneLukk("spart"); }}>
            <ha-icon icon="mdi:chevron-up"></ha-icon></button>`,
          () => this._mer("spart"));
      }

      /* Døgnet som en stripe, med de planlagte blokkene tegnet inn og et merke for nå.
       *
       * Blokkene sto som tekstrader — «Blokk 1: 02:00–05:00» — og da måtte man regne
       * selv for å se om pumpa går nå, eller hvor mye av natta som er dekket. På en
       * stripe ser man det med én gang.
       *
       * `blokker` er strenger som «02:00–05:00» eller «02:00 - 05:00» fra
       * integrasjonen; vi tolker begge strekene.
       */
      _planstripe(blokker, merkeNa) {
        const tolk = (b) => {
          const m = String(b).match(/(\d{1,2}):(\d{2})\s*[–\-—]\s*(\d{1,2}):(\d{2})/);
          if (!m) return null;
          const fra = Number(m[1]) * 60 + Number(m[2]);
          let til = Number(m[3]) * 60 + Number(m[4]);
          // over midnatt: klipp ved døgnskillet, resten hører til neste døgn
          if (til <= fra) til = 1440;
          return { fra, til };
        };
        const deler = blokker.map(tolk).filter(Boolean);
        const na = new Date();
        const naMin = na.getHours() * 60 + na.getMinutes();
        const dekket = deler.reduce((sum, d) => sum + (d.til - d.fra), 0);
        const gaarNa = deler.some((d) => naMin >= d.fra && naMin < d.til);

        return html`
          <div class="stripe ${gaarNa ? "aktiv" : ""}">
            ${[6, 12, 18].map((t) => html`
              <i class="rute" style="left:${(t / 24) * 100}%"></i>`)}
            ${deler.map((d) => html`
              <i class="blokk" style="left:${(d.fra / 1440) * 100}%;width:${
                ((d.til - d.fra) / 1440) * 100}%"></i>`)}
            ${merkeNa ? html`<i class="na" style="left:${(naMin / 1440) * 100}%"></i>` : ""}
          </div>
          <div class="stripetekst">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
          <div class="dempet">
            ${deler.length
              ? `${deler.length} blokk${deler.length === 1 ? "" : "er"} · ${
                  Math.round(dekket / 60 * 10) / 10} t planlagt${
                  gaarNa ? " · går nå" : ""}`
              : "Ingen blokker planlagt."}
          </div>
        `;
      }

      _sirkulasjon() {
        const bl = this.attr("modus", "blokker", []) || [];
        const blm = this.attr("modus", "blokker_i_morgen", []) || [];
        const snittPlan = this.attr("modus", "snittpris_plan");
        const snittDogn = this.attr("modus", "snittpris_dogn");
        const anbefalt = this.attr("omsetninger", "anbefalt");
        const enOms = this.attr("omsetninger", "en_omsetning_timer");
        const gjort = Number(this.val("omsetninger", 0)) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const neste = this.val("nesteStart");
        const pst = Math.min(100, (gjort / mal) * 100);
        const valuta = this.enhet("kostnad") || "";
        const billigere = snittPlan != null && snittDogn != null && snittDogn > 0
          ? Math.round((1 - snittPlan / snittDogn) * 100) : null;

        /* Omsetninger, planen og prisen er ett regnskap: hvor mye vann som må
           gjennom filteret, når det skjer, og hva det koster. Før var det tre løse
           paneler; nå er det ett, delt med hårfine skiller. */
        return html`
          ${this._panel("mdi:autorenew", "var(--kib-blue)", "Sirkulasjon i dag",
            gjort >= mal ? "Målet er nådd" : `${nf(Math.max(0, mal - gjort), 2)} omsetninger igjen`,
            html`
              <div class="ringrad">
                ${this._ring(pst, "var(--kib-blue)", `${nf(gjort, 2)}×`, `av ${nf(mal, 2)}×`, () => this._mer("omsetninger"))}
                <div class="statliste">
                  ${this._stat("mdi:timer-outline", "Pumpetid i dag", nf(this.val("pumpetid", 0), 1), " t", () => this._mer("pumpetid"))}
                  ${this._stat("mdi:clock-start", "Neste start", neste ? klokke(neste) || String(neste) : "–", "", () => this._mer("nesteStart"))}
                  ${this._stat("mdi:water-sync", "Én omsetning", nf(enOms, 1), " t")}
                </div>
              </div>
              ${anbefalt ? html`<div class="tips"><ha-icon icon="mdi:thermometer-water"></ha-icon>
                Vanntemperaturen tilsier ${nf(anbefalt, 2)} omsetninger i døgnet.</div>` : ""}
              <div class="skille"></div>
              <div class="plabel">I dag</div>
              ${this._planstripe(bl, true)}
              ${blm.length ? html`<div class="plabel">I morgen</div>${this._planstripe(blm, false)}` : ""}
              ${snittPlan != null ? html`
                <div class="skille"></div>
                <div class="prisrad">
                  <div><small>Snitt i planen</small><b>${nf(snittPlan, 2)}</b><em>${valuta}/kWh</em></div>
                  <div><small>Snitt i døgnet</small><b>${nf(snittDogn, 2)}</b><em>${valuta}/kWh</em></div>
                  ${billigere !== null ? html`<div class="${billigere > 0 ? "gron" : ""}"><small>Billigere</small><b>${billigere}</b><em>%</em></div>` : ""}
                </div>` : ""}
            `, "", () => this._mer("modus"))}

          ${this._config.graf !== false && !this._harVarme()
            ? this._panel("mdi:chart-bell-curve-cumulative", "var(--kib-orange)", "Temperatur og sirkulasjon", "",
              this._graf(), this._vinduvelger(), () => this._mer("vanntemp"))
            : ""}

          ${this._panel("mdi:tune-variant", "var(--kib-muted)", "Styring", "Profil, mål og plan", html`
            <div class="pliste">
              ${this._velgerEntitet("profil", "Driftsprofil", PROFIL)}
              ${this._velger("mal", "Omsetninger per døgn", { step: 0.25, desimaler: 2, suffiks: "×" })}
              ${this._velger("puls", "Vedlikeholdspuls", { suffiks: " min/t" })}
              ${this._velger("dagtimer", "Dagtimer i planen", { suffiks: " t" })}
              ${this._bryterRad("pris", "Prisstyring")}
              ${this._bryterRad("varme", "Varmeprioritet")}
            </div>`)}
        `;
      }

      _spreder() {
        const gar = this.on("spreder");
        const igjen = this.val("spredertid", 0) || 0;
        const varighet = this.val("spredVarighet", 10) || 10;
        const brukt = Number(this.attr("spredertid", "brukt_i_dag_min", 0)) || 0;
        const maks = Number(this.val("spredMaks", 0)) || 0;
        const intervall = Number(this.val("spredIntervall", 0)) || 0;
        const programPa = this.on("spredprogram");

        return html`
          <section class="panel spredpanel ${gar ? "gar" : ""}">
          <!-- Sprederen som en scene: kveldshimmel, vannflaten med bølger, dysa midt i
               bassenget, fem stråler i bue med dråper langs buen, og ringer i vannet der
               strålene lander. Alt i én svg, gradientene i defs. -->
          <div class="spredscene ${gar ? "gar" : ""}">
            <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <defs>
                <linearGradient id="sp-himmel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#101a26"></stop><stop offset="1" stop-color="#1b3550"></stop>
                </linearGradient>
                <linearGradient id="sp-sjo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#2f8fc4"></stop><stop offset="1" stop-color="#153a5c"></stop>
                </linearGradient>
                <linearGradient id="sp-straaleg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#dff4ff" stop-opacity=".95"></stop>
                  <stop offset="1" stop-color="#9fd6ff" stop-opacity="0"></stop>
                </linearGradient>
                <radialGradient id="sp-glans" cx=".5" cy=".5" r=".5">
                  <stop offset="0" stop-color="#ffffff" stop-opacity=".35"></stop><stop offset="1" stop-color="#ffffff" stop-opacity="0"></stop>
                </radialGradient>
              </defs>
              <rect class="sp-himmel" width="320" height="150" fill="url(#sp-himmel)"></rect>
              <g class="sp-stjerner">
                <circle cx="24" cy="22" r="1.4" fill="#fff" style="--i:0"></circle>
                <circle cx="61" cy="14" r="1" fill="#fff" style="--i:1"></circle>
                <circle cx="98" cy="30" r="1" fill="#fff" style="--i:2"></circle>
                <circle cx="150" cy="12" r="1.4" fill="#fff" style="--i:3"></circle>
                <circle cx="204" cy="26" r="1" fill="#fff" style="--i:4"></circle>
                <circle cx="248" cy="17" r="1" fill="#fff" style="--i:5"></circle>
                <circle cx="290" cy="34" r="1.4" fill="#fff" style="--i:6"></circle>
                <circle cx="176" cy="40" r="1" fill="#fff" style="--i:7"></circle>
              </g>
              <ellipse class="sp-mane" cx="272" cy="42" rx="11" ry="11" fill="#f3f0dc" opacity=".85"></ellipse>
              <!-- vannet -->
              <path class="sp-vann" d="M0 96 C40 90 60 102 100 96 S160 90 200 96 S260 102 320 96 L320 150 L0 150 Z" fill="url(#sp-sjo)"></path>
              <path class="sp-bolge b1" d="M-40 98 C-10 92 20 104 60 98 S120 92 160 98 S220 104 260 98 S320 92 360 98" fill="none" stroke="#bfe9ff" stroke-opacity=".45" stroke-width="1.6"></path>
              <path class="sp-bolge b2" d="M-40 106 C0 100 30 112 70 106 S130 100 170 106 S230 112 270 106 S330 100 370 106" fill="none" stroke="#bfe9ff" stroke-opacity=".22" stroke-width="1.2"></path>
              <ellipse class="sp-lys" cx="160" cy="118" rx="70" ry="16" fill="url(#sp-glans)"></ellipse>
              <!-- ringer der strålene lander -->
              <g class="sp-ringer">
                <ellipse cx="70" cy="100" rx="10" ry="3" fill="none" stroke="#dff4ff" stroke-width="1.2" style="--i:0"></ellipse>
                <ellipse cx="110" cy="98" rx="10" ry="3" fill="none" stroke="#dff4ff" stroke-width="1.2" style="--i:1"></ellipse>
                <ellipse cx="210" cy="98" rx="10" ry="3" fill="none" stroke="#dff4ff" stroke-width="1.2" style="--i:2"></ellipse>
                <ellipse cx="250" cy="100" rx="10" ry="3" fill="none" stroke="#dff4ff" stroke-width="1.2" style="--i:3"></ellipse>
              </g>
              <!-- dysa -->
              <g class="sp-hode">
                <rect x="156" y="70" width="8" height="30" rx="4" fill="#9aa4ad"></rect>
                <rect x="150" y="66" width="20" height="9" rx="4.5" fill="#cfd6dc"></rect>
                <circle cx="160" cy="70" r="3" fill="#6aa9c9"></circle>
              </g>
              <!-- strålene -->
              <g class="sp-gruppe">
                <path class="sp-straale s0" style="--i:0" d="M160 70 q0 -40 0 28" fill="none" stroke="#dff4ff" stroke-linecap="round"></path>
                <path class="sp-straale s1" style="--i:1" d="M160 70 q30 -42 60 28" fill="none" stroke="#dff4ff" stroke-linecap="round"></path>
                <path class="sp-straale s2" style="--i:2" d="M160 70 q52 -26 96 26" fill="none" stroke="#dff4ff" stroke-linecap="round"></path>
                <path class="sp-straale s3" style="--i:3" d="M160 70 q-30 -42 -60 28" fill="none" stroke="#dff4ff" stroke-linecap="round"></path>
                <path class="sp-straale s4" style="--i:4" d="M160 70 q-52 -26 -96 26" fill="none" stroke="#dff4ff" stroke-linecap="round"></path>
              </g>
              <g class="sp-draper">
                <circle class="sp-drape" cx="160" cy="70" r="2.0" style="--dx:44px;--dy:24px;animation-delay:0.00s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.4" style="--dx:70px;--dy:36px;animation-delay:0.19s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.8" style="--dx:96px;--dy:30px;animation-delay:0.38s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.0" style="--dx:-44px;--dy:24px;animation-delay:0.57s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.4" style="--dx:-70px;--dy:36px;animation-delay:0.76s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.8" style="--dx:-96px;--dy:30px;animation-delay:0.95s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.0" style="--dx:22px;--dy:40px;animation-delay:1.14s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.4" style="--dx:-22px;--dy:40px;animation-delay:1.33s"></circle>
                <circle class="sp-drape" cx="160" cy="70" r="2.8" style="--dx:0px;--dy:46px;animation-delay:1.52s"></circle>
              </g>
            </svg>
            <div class="spredtekst">
              <b>${gar ? "Sprederen går" : "Sprederen står"}</b>
              <span>${gar ? `${Math.ceil(igjen)} min igjen` : `Klar for ${Math.round(varighet)} min`}</span>
            </div>
          </div>

            <button class="stor ${gar ? "stopp" : ""}"
              @click=${() => { this._haptikk("medium"); this._trykk(gar ? "stoppSpreder" : "startSpreder"); }}>
              <ha-icon icon="${gar ? "mdi:stop" : "mdi:play"}"></ha-icon>
              ${gar ? "Stopp sprederen" : `Start i ${Math.round(varighet)} min`}
            </button>
            <div class="spredtall">
              <button @click=${() => this._mer("spredertid")}>
                <small>Brukt i dag</small><b>${nf(brukt, 0)}<em>${maks ? ` / ${nf(maks, 0)}` : ""} min</em></b>
                ${maks ? html`<span class="ispor"><i style="width:${Math.min(100, (brukt / maks) * 100).toFixed(1)}%"></i></span>` : ""}
              </button>
              <button @click=${() => this._mer("spredVarighet")}><small>Varighet</small><b>${nf(varighet, 0)}<em> min</em></b></button>
              <button @click=${() => this._mer("spredprogram")}><small>Program</small><b>${programPa ? (intervall ? `hver ${nf(intervall, 0)} t` : "på") : "av"}</b></button>
            </div>
          </section>

          ${this._panel("mdi:calendar-sync", "var(--kib-accent)", "Program", programPa ? "Går av seg selv" : "Bare når du starter", html`
            <div class="pliste">
              ${this._bryterRad("spredprogram", "Program på")}
              ${this._velger("spredVarighet", "Varighet", { suffiks: " min" })}
              ${this._velger("spredIntervall", "Start hver", { suffiks: " t" })}
              ${this._velger("spredMaks", "Maks per døgn", { step: 10, suffiks: " min" })}
              ${this._bryterRad("frostvakt", "Frostvakt")}
            </div>`)}
        `;
      }

      _innstillinger() {
        const energi = (this.val("pumpeEnergi", 0) || 0) + (this.val("vpEnergi", 0) || 0);
        const faner = this._config.faner === false ? [] : this._faneListe().map((f) => f.id);
        return html`
          ${faner.length && !faner.includes("sirkulasjon") ? this._panel("mdi:tune-variant", "var(--kib-accent)", "Styring", "Profil, mål og plan", html`
            <div class="pliste">
              ${this._velgerEntitet("profil", "Driftsprofil", PROFIL)}
              ${this._velger("mal", "Omsetninger per døgn", { step: 0.25, desimaler: 2, suffiks: "×" })}
              ${this._velger("puls", "Vedlikeholdspuls", { suffiks: " min/t" })}
              ${this._velger("dagtimer", "Dagtimer i planen", { suffiks: " t" })}
              ${this._bryterRad("pris", "Prisstyring")}
              ${this._bryterRad("varme", "Varmeprioritet")}
            </div>`) : ""}

          ${this._panel("mdi:pump", "var(--kib-blue)", "Pumpe", "Hvor lenge og hvor mye", html`
            <div class="pliste">
              ${this._velger("minTid", "Minste kjøretid", { step: 5, suffiks: " min" })}
              ${this._velger("basislast", "Basislast", { step: 10, suffiks: " W" })}
              ${this._velger("overstyringTid", "Manuell overstyring varer", { step: 15, suffiks: " min" })}
            </div>`)}

          ${this._panel("mdi:heat-wave", "var(--kib-red)", "Varme",
            this._harVarme() ? "Natta går fra vinduets slutt til start" : "Når varmepumpa får gå", html`
            <div class="pliste">
              ${this._bryterRad("styrVp", "Styr varmepumpa")}
              ${this._velger("varmeStart", "Varmevindu fra", { suffiks: ":00" })}
              ${this._velger("varmeSlutt", "Varmevindu til", { suffiks: ":00" })}
              ${this._bryterRad("pulsVarme", "Puls med varme")}
            </div>`)}

          ${this._modellPanel()}
          ${faner.includes("klor") ? "" : this._klorNavnPanel()}

          ${this._panel("mdi:chart-box-outline", "var(--kib-accent)", "Tellere", "", html`
            <div class="statgrid">
              ${this._stat("mdi:water", "Pumpet i dag", nf(this.val("volum", 0), 1), " m³", () => this._mer("volum"))}
              ${this._stat("mdi:water-sync", "Pumpet totalt", nf(this.val("volumTotalt", 0), 1), " m³", () => this._mer("volumTotalt"))}
              ${this._stat("mdi:lightning-bolt", "Energi i dag", nf(energi, 1), " kWh")}
              ${this._stat("mdi:cash", "Kostnad i dag", nf(this.val("kostnad", 0), 1), ` ${this.enhet("kostnad") || "kr"}`, () => this._mer("kostnad"))}
            </div>
            <button class="stor stille" @click=${() => { this._haptikk("medium"); this._trykk("nullstill"); }}>
              <ha-icon icon="mdi:backup-restore"></ha-icon>Nullstill dagens tellere
            </button>`)}

          <div class="dempet senter versjon">ki-basseng-card ${VERSJON} · ${this._prefiks || ""}</div>
        `;
      }

      /* --- render ---------------------------------------------------- */

      render() {
        if (!this.hass || !this._config) return html``;
        if (!this.st("modus")) {
          return html`
            <ha-card>
              <div class="seksjon tom">
                Fant ingen KI Basseng-integrasjon. Sett den opp under Enheter og
                tjenester, eller oppgi <code>prefix:</code> i kortet.
              </div>
            </ha-card>
          `;
        }
        /* Bare heroen: bassengscenen som eget kort. Ingen knapper eller faner – de
           ligger i popupen bak trykket. */
        if (String(this._config.visning || "").toLowerCase() === "hero") {
          return html`<ha-card class="barehero">${this._hero()}</ha-card>`;
        }
        const medFaner = this._config.faner !== false;
        const faneListe = medFaner ? this._faneListe() : [];
        const aktiv = medFaner
          ? (faneListe.some((f) => f.id === this._fane) ? this._fane : faneListe[0].id)
          : null;
        const vis = (id) => !medFaner || aktiv === id;

        return html`
          <ha-card>
            <div class="kort3">
            ${this._config.tittel ? html`<div class="tittel">${this._config.tittel}</div>` : ""}
            ${this._varmestatus()}
            ${this._config.hero === false ? "" : this._hero()}
            ${this._hurtig()}
            ${medFaner && faneListe.length > 1 ? this._faner(faneListe, aktiv) : ""}
            <div class="innhold">
              ${vis("oversikt") ? this._oversikt() : ""}
              ${medFaner
                ? html`
                    ${vis("varme") ? html`<div class="faneinnhold">${this._varmeFane()}</div>` : ""}
                    ${vis("klor") ? html`<div class="faneinnhold">${this._klorFane()}</div>` : ""}
                    ${vis("sirkulasjon") ? html`<div class="faneinnhold">${this._sirkulasjon()}</div>` : ""}
                    ${vis("spreder") ? html`<div class="faneinnhold">${this._spreder()}</div>` : ""}
                    ${vis("innstillinger") ? html`<div class="faneinnhold">${this._innstillinger()}</div>` : ""}
                  `
                : html`
              ${this._harVarme() ? this._seksjon(
                "varme",
                "mdi:pool-thermometer",
                "Varme",
                this._malTemp() != null ? `mål ${nf(this._malTemp(), 1)}°` : "",
                () => this._varmeFane()
              ) : ""}
              ${this._harKlor() ? this._seksjon(
                "klor",
                "mdi:pill",
                "Klor",
                this.on("klorForfall") ? "på tide" : isFinite(Number(this.attr("sisteKlor", "dager_siden")))
                  ? `${nf(this.attr("sisteKlor", "dager_siden"), 0)} d siden` : "",
                () => this._klorFane()
              ) : ""}
              ${this._seksjon(
                "sirk",
                "mdi:pump",
                "Sirkulasjon",
                `${nf(this.val("omsetninger", 0), 2)}× i dag`,
                () => this._sirkulasjon()
              )}
              ${this._seksjon(
                "spred",
                "mdi:sprinkler",
                "Spreder",
                this.on("spreder")
                  ? `${Math.ceil(this.val("spredertid", 0))} min igjen`
                  : `${nf(this.attr("spredertid", "brukt_i_dag_min", 0), 0)} min i dag`,
                () => this._spreder()
              )}
              ${this._seksjon(
                "innst",
                "mdi:tune-variant",
                "Innstillinger",
                "",
                () => this._innstillinger()
              )}
            `}
            </div>
            </div>
          </ha-card>
        `;
      }

      static get styles() {
        return css`
          :host {
            --kib-surface: var(--gray200, var(--card-background-color, #262628));
            --kib-inner: var(--gray100, rgba(127, 127, 127, 0.14));
            --kib-text: var(--gray1000, var(--primary-text-color, #fafbfc));
            --kib-muted: var(--gray600, var(--secondary-text-color, #8e8e93));
            --kib-accent: var(--active-big, var(--primary-color, #4dd07a));
            --kib-blue: var(--blue, #4a9df8);
            --kib-orange: var(--orange, #f0a03c);
            --kib-red: var(--red, #e8604c);
            --kib-sort: var(--black, #000);
            --kib-purple: var(--purple, #a78bfa);
            --kib-green: var(--green, #4dd07a);
            --kib-vann: var(--cyan, #3fc1c9);
            display: block;
            max-width: 100%;
            overflow: hidden;
          }
          ha-card {
            background: none;
            border: none;
            box-shadow: none;
            color: var(--kib-text);
          }
          button {
            font: inherit;
            border: none;
            cursor: pointer;
            color: inherit;
            background: none;
            padding: 0;
            text-align: left;
          }
          button:focus-visible {
            outline: 2px solid var(--kib-accent);
            outline-offset: 2px;
          }
          /* --- info-rader med ikonfelt, som bannerne i dashbordet --- */
          .iradliste { display: grid; gap: 6px; }
          .irad {
            position: relative;
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 11px 16px 11px 8px;
            border-radius: 22px;
            background: var(--kib-surface);
            overflow: hidden;
          }
          .iik {
            width: 42px;
            height: 42px;
            flex: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(250, 251, 252, 0.09);
            --mdc-icon-size: 21px;
            color: var(--kib-muted);
          }
          .inavn {
            flex: 1;
            min-width: 0;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .iverdi {
            font-size: 17px;
            font-weight: 600;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .iverdi small { font-size: 12px; font-weight: 500; opacity: 0.55; margin-left: 1px; }
          /* Stolpen ligger langs underkanten av raden i stedet for inne i en flis —
             den viser nivå uten å ta en egen linje. */
          .ispor {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 3px;
            background: rgba(128, 128, 128, 0.18);
          }
          .ispor i {
            display: block;
            height: 100%;
            background: rgba(74, 157, 248, 0.9);
            transition: width 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
          }

          /* --- døgnstripa med planlagte blokker --- */
          .stripe {
            position: relative;
            height: 26px;
            border-radius: 8px;
            background: rgba(128, 128, 128, 0.18);
            overflow: hidden;
            margin-top: 2px;
          }
          .stripe .rute {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 1px;
            background: rgba(255, 255, 255, 0.12);
          }
          .stripe .blokk {
            position: absolute;
            top: 3px;
            bottom: 3px;
            border-radius: 5px;
            background: rgba(74, 157, 248, 0.75);
            min-width: 2px;
          }
          /* Går pumpa nå, pulserer blokkene svakt — ikke mer enn det, stripa skal
             kunne leses. */
          .stripe.aktiv .blokk { animation: stripepuls 2.6s ease-in-out infinite; }
          @keyframes stripepuls {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 1; }
          }
          .stripe .na {
            position: absolute;
            top: -2px;
            bottom: -2px;
            width: 2px;
            background: var(--kib-accent, #ee95ff);
            box-shadow: 0 0 6px var(--kib-accent, #ee95ff);
          }
          .stripetekst {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            opacity: 0.45;
            margin-top: 3px;
            font-variant-numeric: tabular-nums;
          }

          /* --- sprederscenen, i samme form som sprinkleren i vanningskortet --- */
          .spredscene {
            position: relative;
            border-radius: 22px;
            background: #101a26;
            overflow: hidden;
            margin-bottom: 8px;
          }
          .spredscene svg { display: block; width: 100%; height: 150px; }
          .sp-stjerner circle { animation: sp-blink 3.4s ease-in-out infinite; animation-delay: calc(var(--i) * -0.5s); }
          @keyframes sp-blink { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
          .sp-bolge { animation: sp-bolge 7s linear infinite; }
          .sp-bolge.b2 { animation-duration: 11s; animation-direction: reverse; }
          @keyframes sp-bolge { from { transform: translateX(0); } to { transform: translateX(40px); } }
          .sp-lys { opacity: 0.5; }
          /* Dysa vipper sakte, og strålegruppa følger med. */
          .sp-hode { transform-box: fill-box; transform-origin: 50% 100%; }
          .spredscene.gar .sp-hode { animation: sp-vipp 4s ease-in-out infinite alternate; }
          @keyframes sp-vipp { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
          .sp-gruppe { opacity: 0; transform-box: view-box; transition: opacity 0.6s; }
          .spredscene.gar .sp-gruppe { opacity: 1; animation: sp-sving 4s ease-in-out infinite alternate; }
          @keyframes sp-sving { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
          .sp-straale { stroke-width: 3; stroke-opacity: 0.85; stroke-dasharray: 80; stroke-dashoffset: 80; }
          .sp-straale.s0 { stroke-width: 2.4; }
          .spredscene.gar .sp-straale { animation: sp-stroem 1.6s ease-out infinite; animation-delay: calc(var(--i) * 0.12s); }
          @keyframes sp-stroem { 0% { stroke-dashoffset: 80; stroke-opacity: 0; } 20% { stroke-opacity: 0.9; } 100% { stroke-dashoffset: 0; stroke-opacity: 0.5; } }
          .sp-drape { fill: #dff4ff; opacity: 0; transform-box: view-box; }
          .spredscene.gar .sp-drape { animation: sp-sprut 1.6s ease-out infinite; }
          @keyframes sp-sprut {
            0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
            15% { opacity: 0.95; }
            50% { transform: translate(calc(var(--dx, 40px) * 0.6), calc(var(--dy, 22px) * -1)) scale(0.9); }
            100% { opacity: 0; transform: translate(var(--dx, 40px), calc(var(--dy, 22px) * 1.1)) scale(0.7); }
          }
          .sp-ringer ellipse { opacity: 0; transform-box: fill-box; transform-origin: center; }
          .spredscene.gar .sp-ringer ellipse { animation: sp-ring 2.2s ease-out infinite; animation-delay: calc(var(--i) * 0.55s); }
          @keyframes sp-ring { 0% { opacity: 0.7; transform: scale(0.3); } 100% { opacity: 0; transform: scale(1.6); } }
          .spredscene:not(.gar) .sp-hode { opacity: 0.55; }
          @media (prefers-reduced-motion: reduce) {
            .sp-stjerner circle, .sp-bolge, .sp-hode, .sp-gruppe, .sp-drape, .sp-ringer ellipse { animation: none !important; }
            .spredscene.gar .sp-gruppe { opacity: 1; }
            .spredscene.gar .sp-straale { stroke-dashoffset: 0; }
          }
          .spredtekst {
            position: absolute;
            left: 16px;
            top: 12px;
            font-size: 13px;
            font-weight: 600;
            opacity: 0.8;
          }

          .fanerad { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 12px 0 14px; }
          .faner {
            display: inline-flex; gap: 4px; padding: 2px; max-width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 999px;
          }
          .fane {
            border: 0; background: none; color: rgba(255, 255, 255, 0.72); font: inherit; font-size: 13px;
            font-weight: 500; padding: 6px 14px; border-radius: 999px; cursor: pointer; white-space: nowrap;
            -webkit-tap-highlight-color: transparent;
          }
          .faner .ki-pille { background: var(--active-big, #ee95ff); }
          .fane.aktiv { background: var(--active-big, #ee95ff); color: rgba(70, 58, 64, 0.95); box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35); }
          .cog {
            flex: 0 0 auto;
            width: 40px;
            height: 40px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            background: none;
            color: rgba(255, 255, 255, 0.72);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            --mdc-icon-size: 20px;
            transition: background 0.18s, color 0.18s, transform 0.3s ease;
          }
          .cog:hover { color: rgba(255, 255, 255, 0.95); }
          .cog.aktiv {
            background: var(--kib-accent);
            color: rgba(70, 58, 64, 0.95);
            transform: rotate(60deg);
          }
          .faner {
            display: flex;
            gap: 4px;
            align-items: center;
            box-sizing: border-box;
            width: fit-content;
            max-width: 100%;
            margin: 0;
            padding: 2px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 999px;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .faner::-webkit-scrollbar {
            display: none;
          }
          .fane {
            flex: 0 0 auto;
            padding: 9px 22px;
            border-radius: 999px;
            font-size: 15px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.72);
            white-space: nowrap;
          }
          .fane:hover {
            color: rgba(255, 255, 255, 0.95);
          }
          /* Fire faner (med Varme) skal få plass ved siden av tannhjulet på en telefon */
          .faner.mange .fane { padding: 9px 12px; font-size: 14px; }
          .fane.aktiv {
            background: var(--kib-accent);
            color: rgba(70, 58, 64, 0.95);
            box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
          }
          .faneinnhold {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .tittel {
            font-size: 15px;
            font-weight: 600;
            padding: 0 4px 10px;
          }
          .innhold {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          /* --- paneler (1.12) --- */
          .panel {
            background: var(--kib-surface);
            border-radius: 24px;
            padding: 14px;
            margin-top: 10px;
            display: grid;
            gap: 12px;
            min-width: 0;
          }
          /* Ikonflisen er den fra mysmarthome: lys, gjennomskinnelig sirkel med tynn kant,
             hvitt ikon. Fargen (--pf) brukes bare i ringer og stolper, ikke i ikonet. */
          .phode { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
          .phode.trykkbar { cursor: pointer; }
          .pik {
            width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
            background: rgba(250, 251, 252, 0.1);
            border: 1px solid rgba(250, 251, 252, 0.1);
            color: var(--kib-text);
          }
          .pik ha-icon { --mdc-icon-size: 24px; }
          .ptittel { font-size: 14px; font-weight: 500; opacity: 0.7; }
          .punder { font-size: 16px; font-weight: 300; margin-top: 1px; line-height: 1.2; }
          .ptekst { min-width: 0; }
          .ptekst div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

          /* ring + nøkkeltall */
          .ringrad { display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 14px; align-items: center; }
          .ring { position: relative; width: 116px; height: 116px; }
          .ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
          .ring circle { fill: none; stroke-width: 9; }
          .ring .rbak { stroke: var(--kib-inner); }
          .ring .rfor { stroke: var(--rf, var(--kib-accent)); stroke-linecap: round;
            transition: stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
          .rtekst { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
          .ring.trykkbar { cursor: pointer; }
          .rtekst b { font-size: 26px; font-weight: 300; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
          .rtekst span { font-size: 12px; font-weight: 500; opacity: 0.7; }
          .statliste { display: grid; gap: 6px; min-width: 0; }
          .statgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .stat {
            display: grid; grid-template-columns: 22px minmax(0, 1fr); grid-template-areas: "i v" "i n";
            column-gap: 10px; align-items: center; text-align: left;
            padding: 8px 12px; border-radius: 16px; background: var(--kib-inner); color: var(--kib-text);
            cursor: pointer; min-width: 0;
          }
          .stat[disabled] { cursor: default; }
          .stat ha-icon { grid-area: i; --mdc-icon-size: 20px; color: var(--kib-muted); }
          .stat .sv { grid-area: v; font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .stat .sv small { font-size: 12px; font-weight: 500; opacity: 0.7; margin-left: 2px; }
          .stat .sn { grid-area: n; font-size: 12px; font-weight: 500; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .stat ha-icon { color: var(--kib-text); opacity: 0.85; }
          .statgrid .stat { padding: 12px; }
          .tips { display: flex; gap: 8px; align-items: center; font-size: 12.5px; color: var(--kib-muted);
            padding: 8px 12px; border-radius: 14px; background: var(--kib-inner); }
          .tips ha-icon { --mdc-icon-size: 18px; color: var(--kib-orange); flex: none; }
          .plabel { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
            color: var(--kib-muted); margin-bottom: -6px; }

          /* innstillinger som liste med skillelinjer inne i panelet */
          .pliste { display: grid; }
          .pliste > * { border-top: 1px solid var(--kib-inner); min-height: 50px; }
          .pliste > *:first-child { border-top: none; }
          .pliste .velger-tekst, .pliste .bryterrad { color: var(--kib-text); }
          .pliste .bryterrad { padding: 0; background: none; }

          /* spreder: scenen i eget panel, knappen under */
          .spredpanel { padding: 0; overflow: hidden; gap: 0; }
          .spredpanel .spredscene { border-radius: 0; margin: 0; }
          .spredpanel .spredtekst { display: grid; gap: 2px; }
          .spredpanel .spredtekst b { font-size: 16px; font-weight: 600; }
          .spredpanel .spredtekst span { font-size: 12px; opacity: 0.75; }
          .spredpanel .stor { width: calc(100% - 24px); margin: 12px; }

          /* --- temperaturgrafen (1.12) --- */
          .tgraf { display: grid; gap: 6px; }
          .tflate { position: relative; height: 150px; margin-right: 34px; touch-action: pan-y; }
          .tflate.peker { touch-action: none; }
          .tflate.peker .tg-na, .tflate.peker .tg-natekst { opacity: 0; }
          .tg-pekline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--kib-text); opacity: 0.35; }
          .tg-pekdot { position: absolute; width: 11px; height: 11px; border-radius: 50%; background: var(--kib-text);
            border: 2px solid var(--kib-surface); transform: translate(-50%, -50%); }
          .tg-pekboks { position: absolute; top: 0; transform: translateX(8px); display: grid; gap: 1px;
            padding: 6px 10px; border-radius: 12px; background: var(--kib-text); color: var(--kib-surface);
            white-space: nowrap; pointer-events: none; }
          .tg-pekboks.venstre { transform: translateX(calc(-100% - 8px)); }
          .tg-pekboks b { font-size: 16px; font-weight: 500; }
          .tg-pekboks span { font-size: 11px; opacity: 0.8; }
          .tg-pekboks i { font-style: normal; font-size: 11px; color: var(--kib-blue); }
          .tflate svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; color: var(--kib-orange); }
          .tg-pumpe { fill: var(--kib-blue); opacity: 0.16; }
          .tg-mal { fill: none; stroke: var(--kib-text); stroke-opacity: 0.35; stroke-width: 1; stroke-dasharray: 4 4;
            vector-effect: non-scaling-stroke; }
          .tg-flate { fill: url(#kib-tg); }
          .tg-linje { fill: none; stroke: var(--kib-orange); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
            vector-effect: non-scaling-stroke; }
          .tg-na { position: absolute; width: 11px; height: 11px; border-radius: 50%; background: var(--kib-orange);
            border: 2px solid var(--kib-surface); transform: translate(-50%, -50%);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--kib-orange) 60%, transparent); animation: kib-puls 2.2s ease-out infinite; }
          @keyframes kib-puls { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--kib-orange) 55%, transparent); }
            100% { box-shadow: 0 0 0 10px transparent; } }
          .tg-natekst { position: absolute; transform: translate(-100%, -170%); font-size: 12px; font-weight: 600;
            padding: 2px 7px; border-radius: 999px; background: var(--kib-orange); color: var(--kib-sort); white-space: nowrap; }
          .tg-natekst.under { transform: translate(-100%, 70%); }
          .tg-malmerke { position: absolute; right: -34px; transform: translateY(-50%); font-size: 10px; color: var(--kib-muted); }
          .tg-y { position: absolute; right: -34px; font-size: 10px; color: var(--kib-muted); font-variant-numeric: tabular-nums; }
          .tg-y.topp { top: 0; }
          .tg-y.bunn { bottom: 0; }
          .tg-akse { position: relative; height: 14px; margin-right: 34px; }
          .tg-akse span { position: absolute; transform: translateX(-50%); font-size: 10px; color: var(--kib-muted); white-space: nowrap; }
          .tg-akse span:first-child { transform: none; }
          .tg-akse span:last-child { transform: translateX(-100%); }
          .tg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 5px 10px;
            border-radius: 999px; background: var(--kib-inner); white-space: nowrap; }
          .chip.opp { color: var(--kib-orange); }
          .chip.ned { color: var(--kib-blue); }
          .chip .prikk { margin: 0; width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
          .chip .prikk.temp { background: var(--kib-orange); }
          .chip .prikk.sirk { background: var(--kib-blue); }
          .versjon { margin-top: 12px; font-size: 11px; }
          @media (prefers-reduced-motion: reduce) {
            .tg-na { animation: none; }
            .ring .rfor { transition: none; }
          }

          /* Varmepumpa: et statuskort øverst, samme form som i vanningskortet. */
          .vpstatus {
            position: relative;
            overflow: hidden;
            display: grid;
            grid-template-columns: 52px minmax(0, 1fr);
            gap: 14px;
            align-items: center;
            padding: 14px 16px;
            margin-bottom: 10px;
            border-radius: 24px;
            cursor: pointer;
            transition: transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1);
          }
          .vpstatus:active { transform: scale(0.98); }
          .vpstatus.varme {
            background: linear-gradient(135deg, color-mix(in srgb, var(--kib-red) 70%, #000) 0%, var(--kib-red) 100%);
            color: #fff;
          }
          .vpstatus.auto { background: var(--kib-orange); color: var(--kib-sort); }
          .vpstatus.av { background: var(--kib-surface); color: var(--kib-text); padding: 10px 16px; }
          .vpik {
            width: 52px; height: 52px; border-radius: 50%;
            display: grid; place-items: center;
            background: rgba(255, 255, 255, 0.16);
          }
          .vpstatus.auto .vpik { background: rgba(0, 0, 0, 0.12); }
          .vpstatus.av .vpik { width: 40px; height: 40px; background: var(--kib-inner); }
          .vpik ha-icon { --mdc-icon-size: 27px; }
          .vpstatus.av .vpik ha-icon { --mdc-icon-size: 21px; }
          .vpstatus.varme .vpik ha-icon { animation: kib-varme 2.4s ease-in-out infinite; }
          @keyframes kib-varme { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
          .vptittel { font-size: 16px; font-weight: 500; }
          .vpstatus.av .vptittel { font-size: 14px; font-weight: 500; }
          .vpunder { font-size: 13px; opacity: 0.88; margin-top: 2px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
          .vpchip { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); }
          .vpstolpe { grid-column: 1 / -1; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.2); overflow: hidden; }
          .vpstolpe i { display: block; height: 100%; border-radius: 2px; background: #fff; opacity: 0.85; }

          /* Hurtigknappene: ikon og navn, samme fliseform som resten. */
          .hurtig {
            display: grid;
            grid-template-columns: repeat(var(--kolonner, 5), minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 14px;
          }
          .hk {
            aspect-ratio: 1;
            min-width: 0;
            border-radius: 22px;
            background: var(--kib-surface);
            color: var(--kib-text);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 4px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
            transition: background 0.25s ease, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1);
          }
          .hk:active { transform: scale(0.93); }
          .hk ha-icon { --mdc-icon-size: 24px; }
          .hk span {
            font-size: 11px;
            font-weight: 500;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            opacity: 0.75;
          }
          .hk.pa { background: var(--kib-accent); color: var(--kib-sort); }
          .hk.varme { background: var(--kib-red); color: var(--kib-sort); }
          .hk.auto { background: var(--kib-orange); color: var(--kib-sort); }
          .hk.pa span, .hk.varme span, .hk.auto span { opacity: 0.85; }
          .hk.borte { background: none; border: 1px dashed var(--gray400, #555); color: var(--kib-muted); }
          .hk.borte ha-icon { opacity: 0.6; }
          @media (prefers-reduced-motion: reduce) {
            .vpstatus.varme .vpik ha-icon { animation: none; }
          }

          /* --- timesøyler: én søyle per time, opp når vannet steg, ned når det falt --- */
          .soyler {
            display: flex;
            align-items: stretch;
            gap: 2px;
            height: 104px;
            padding: 2px 0 0;
          }
          .soyle {
            flex: 1 1 0;
            min-width: 0;
            display: grid;
            grid-template-rows: 44px 1px 44px 12px;
            cursor: default;
          }
          .soyle.tom { opacity: 0.35; }
          .soyle .opp { display: flex; align-items: flex-end; }
          .soyle .ned { display: flex; align-items: flex-start; }
          .soyle .opp i, .soyle .ned i {
            display: block;
            width: 100%;
            border-radius: 3px 3px 0 0;
            background: var(--kib-orange);
            transition: height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .soyle .ned i { border-radius: 0 0 3px 3px; background: var(--kib-blue); }
          /* Midtlinja er nullpunktet: over den steg temperaturen, under falt den */
          .soyle .midt { background: rgba(128, 128, 128, 0.3); }
          .soyle .pumpe { display: flex; align-items: flex-end; padding-top: 2px; }
          .soyle .pumpe i {
            display: block;
            width: 100%;
            border-radius: 2px;
            background: var(--kib-blue);
            opacity: 0.55;
            transition: height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .soyle:hover .opp i, .soyle:hover .ned i { filter: brightness(1.25); }
          .soyleakse {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            opacity: 0.45;
            margin-top: 4px;
            font-variant-numeric: tabular-nums;
          }

          /* --- grafen: to lag, så tekst ikke strekkes med kurvene --- */
          .grafflate { position: relative; height: 96px; }
          .grafflate .graf, .grafflate .grafover {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
          }
          /* Fargene på band, linje, mal og akse er de som alt fantes lenger ned
             (.graf .band og resten). Her legges bare det som er nytt til, så det ikke
             finnes to konkurrerende sett med farger for samme graf. */
          .grafna { fill: var(--kib-orange); }
          .graf-tekst .prikk {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            vertical-align: middle;
          }
          .graf-tekst .prikk.temp { background: var(--kib-orange); }
          .graf-tekst .prikk.sirk { background: var(--kib-blue); opacity: 0.7; }

          /* Graf */
          .grafblokk {
            padding: 14px 16px 10px;
            border-radius: 18px;
            background: var(--kib-surface);
          }
          .grafhode {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-bottom: 10px;
            font-size: 14px;
            font-weight: 500;
          }
          .vindu {
            display: flex;
            gap: 4px;
            padding: 3px;
            border-radius: 12px;
            background: var(--kib-inner);
          }
          .vindu button {
            padding: 4px 10px;
            border-radius: 9px;
            font-size: 12px;
            color: var(--kib-muted);
          }
          .vindu button.aktiv {
            background: var(--kib-accent);
            color: var(--kib-sort);
            font-weight: 600;
          }
          .graf {
            display: block;
            width: 100%;
            height: 110px;
            overflow: visible;
          }
          .graf .band {
            fill: var(--kib-blue);
            opacity: 0.16;
          }
          .graf .flate {
            fill: var(--kib-orange);
            opacity: 0.12;
          }
          .graf .linje {
            fill: none;
            stroke: var(--kib-orange);
            stroke-width: 2;
            stroke-linejoin: round;
            vector-effect: non-scaling-stroke;
          }
          .graf .mal {
            stroke: var(--kib-muted);
            stroke-width: 1;
            stroke-dasharray: 3 3;
            vector-effect: non-scaling-stroke;
          }
          .graf .akse {
            fill: var(--kib-muted);
            font-size: 9px;
          }
          .graf-tom {
            padding: 30px 0;
          }
          .a-pumpe-flate { fill: rgba(74, 157, 248, 0.26); }
          .a-vp-flate { fill: rgba(255, 176, 92, 0.22); }
          .a-pumpe { fill: none; stroke: rgba(74, 157, 248, 0.9); stroke-width: 1.6; }
          .a-vp { fill: none; stroke: rgba(255, 176, 92, 0.9); stroke-width: 1.6; }
          .prikk {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            vertical-align: middle;
          }
          .prikk.pumpe { background: rgba(74, 157, 248, 0.9); }
          .prikk.vp { background: rgba(255, 176, 92, 0.9); }
          .graf-tekst {
            display: flex;
            justify-content: space-between;
            padding-top: 4px;
            font-size: 11px;
            color: var(--kib-muted);
          }

          /* Seksjoner */
          .seksjon {
            border-radius: 18px;
            background: var(--kib-surface);
            overflow: hidden;
          }
          .seksjon.tom {
            padding: 18px;
            font-size: 13px;
            line-height: 1.5;
            color: var(--kib-muted);
          }
          .seksjon-hode {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 16px;
            box-sizing: border-box;
          }
          .seksjon-ikon {
            --mdc-icon-size: 21px;
            color: var(--kib-text);
            flex: none;
          }
          .seksjon-tittel {
            font-size: 15px;
            font-weight: 500;
          }
          .seksjon-under {
            flex: 1;
            text-align: right;
            font-size: 13px;
            color: var(--kib-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .pil {
            --mdc-icon-size: 20px;
            color: var(--kib-muted);
            flex: none;
            transition: transform 0.2s ease;
          }
          .seksjon.apen .pil {
            transform: rotate(180deg);
          }
          .seksjon-kropp {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 0 16px 16px;
          }

          /* Rader, velgere, brytere */
          .rad {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 14px;
          }
          .rad span:first-child {
            color: var(--kib-muted);
          }
          .rad-verdi {
            font-variant-numeric: tabular-nums;
            text-align: right;
          }
          .skille {
            height: 1px;
            margin: 2px 0;
            background: var(--kib-inner);
          }
          .velger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 44px;
          }
          .velger-tekst {
            font-size: 14px;
            color: var(--kib-muted);
          }
          .velger-verdi {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            border-radius: 12px;
            background: var(--kib-inner);
            font-size: 15px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .velger-verdi ha-icon {
            --mdc-icon-size: 16px;
            color: var(--kib-muted);
          }
          .velger select {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            border: none;
            -webkit-appearance: none;
            appearance: none;
            font: inherit;
          }
          .bryterrad {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
            min-height: 44px;
            font-size: 14px;
            color: var(--kib-muted);
          }
          .knott {
            flex: none;
            width: 46px;
            height: 28px;
            border-radius: 999px;
            background: var(--kib-inner);
            position: relative;
            transition: background 0.2s ease;
          }
          .knott::after {
            content: "";
            position: absolute;
            top: 3px;
            left: 3px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--kib-text);
            transition: transform 0.2s ease;
          }
          .knott.paa {
            background: var(--kib-accent);
          }
          .knott.paa::after {
            transform: translateX(18px);
            background: var(--kib-sort);
          }
          .stor {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 15px;
            border-radius: 18px;
            background: var(--kib-accent);
            color: var(--kib-sort);
            font-size: 15px;
            font-weight: 500;
            box-sizing: border-box;
          }
          .stor ha-icon {
            --mdc-icon-size: 20px;
          }
          .stor.stopp {
            background: var(--kib-red);
          }
          .stor.stille {
            background: var(--kib-inner);
            color: var(--kib-text);
            font-weight: 500;
          }
          .dempet {
            font-size: 12px;
            line-height: 1.45;
            color: var(--kib-muted);
          }
          .senter {
            text-align: center;
          }
          .varsel {
            padding: 12px 14px;
            border-radius: 14px;
            border-left: 3px solid var(--kib-orange);
            background: var(--kib-surface);
            font-size: 13px;
          }

          @media (prefers-reduced-motion: reduce) {
            .spredscene.gar .sp-hode,
            .spredscene.gar .sp-gruppe,
            .sp-drape,
            .stripe.aktiv .blokk {
              animation: none;
            }
            .knott,
            .knott::after,
            .pil {
              transition: none;
            }
          }

          /* --- 2.0: varme, nattsenking, pooltak og klor ------------------ */
          .tilstandchip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px 5px 8px;
            border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap;
            background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--kib-text); }
          .tilstandchip ha-icon { --mdc-icon-size: 15px; color: var(--c); }

          .natt { position: relative; height: 26px; border-radius: 13px; overflow: hidden;
            background: linear-gradient(90deg, #1b2440, #10152a 50%, #1f2a44); }
          .natt-av { position: absolute; top: 0; bottom: 0; border-radius: 13px;
            background: repeating-linear-gradient(135deg, var(--kib-purple) 0 6px,
              color-mix(in srgb, var(--kib-purple) 70%, transparent) 6px 12px); opacity: 0.85; }
          .natt.aktiv .natt-av { animation: stripepuls 2.4s ease-in-out infinite; }
          .natt-na { position: absolute; top: 3px; bottom: 3px; width: 3px; margin-left: -1.5px;
            border-radius: 2px; background: #fff; box-shadow: 0 0 6px rgba(255, 255, 255, 0.6); }
          .natt-akse { position: relative; height: 16px; font-size: 11px; color: var(--kib-muted);
            font-variant-numeric: tabular-nums; }
          .natt-akse span { position: absolute; transform: translateX(-50%); }
          .natt-akse span:first-child { transform: none; }
          .natt-akse span:last-child { transform: translateX(-100%); }

          .spar { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 8px; }
          .spar > div { background: var(--kib-inner); border-radius: 16px; padding: 10px 12px; display: grid; }
          .spar b { font-size: 22px; font-weight: 300; font-variant-numeric: tabular-nums; }
          .spar small { font-size: 12px; font-weight: 500; opacity: 0.7; }

          .sammen { display: grid; gap: 8px; }
          .srad { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 10px; align-items: center;
            font-size: 13px; }
          .srad > span:first-child { opacity: 0.7; font-weight: 500; }
          .sspor { height: 8px; border-radius: 4px; background: var(--kib-inner); overflow: hidden; }
          .sspor i { display: block; height: 100%; border-radius: 4px; background: var(--kib-muted);
            transition: width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
          .srad.med .sspor i { background: var(--kib-purple); }
          .srad .sv { font-variant-numeric: tabular-nums; white-space: nowrap; }

          .alternativ { display: grid; gap: 4px; }
          .altrad { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; font-size: 13px;
            font-variant-numeric: tabular-nums; padding: 4px 2px; }
          .altrad.ikke { opacity: 0.5; }

          .klorlogg { display: grid; }
          .klorrad { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto 32px; gap: 10px;
            align-items: center; min-height: 40px; font-size: 13px; border-top: 1px solid var(--kib-inner);
            font-variant-numeric: tabular-nums; }
          .klorrad span:nth-child(2) { opacity: 0.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .angre { width: 32px; height: 32px; border-radius: 50%; background: var(--kib-inner);
            color: var(--kib-text); display: grid; place-items: center; cursor: pointer; }
          .angre ha-icon { --mdc-icon-size: 16px; }
          .stor.varsle { background: var(--kib-orange); }

          .bannere { display: grid; gap: 8px; margin-bottom: 10px; }
          .banner { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 12px; align-items: center;
            width: 100%; padding: 4px 14px 4px 4px; border-radius: 999px; box-sizing: border-box;
            color: var(--kib-sort); text-align: left; cursor: pointer; }
          .banner.natt-b { background: var(--kib-purple); grid-template-columns: 58px minmax(0, 1fr); }
          .bik { width: 58px; height: 58px; border-radius: 50%; background: rgba(0, 0, 0, 0.1);
            display: grid; place-items: center; }
          .bik ha-icon { --mdc-icon-size: 28px; }
          .banner b { display: block; font-size: 14px; font-weight: 500; }
          .banner small { display: block; font-size: 13px; opacity: 0.75; }
          .bknapp { padding: 8px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.14);
            font-size: 13px; font-weight: 500; }

          .chips { display: flex; flex-wrap: wrap; gap: 6px; }
          /* --- 2.1: sammensatte paneler, ny temperaturgraf, klorkalender --- */
          .skille { height: 1px; background: var(--kib-inner); margin: 2px -14px; }

          .vg { display: grid; gap: 8px; --vg: var(--kib-vann); }
          .vg-topp { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
          .vg-stor { display: grid; gap: 2px; }
          .vg-stor small { font-size: 12px; font-weight: 500; opacity: 0.65; }
          .vg-stor b { font-size: 26px; font-weight: 300; line-height: 1.1; font-variant-numeric: tabular-nums; }
          .vg-stor b.opp { color: var(--kib-orange); }
          .vg-stor b.ned { color: var(--kib-blue); }
          .vg-ekstrem { display: grid; gap: 2px; text-align: right; font-size: 13px; font-variant-numeric: tabular-nums; }
          .vg-ekstrem small { font-size: 11px; opacity: 0.6; margin-right: 2px; }
          .vg-ekstrem em { font-style: normal; font-size: 11px; opacity: 0.6; margin-left: 2px; }
          .vg-plot { position: relative; display: grid; gap: 4px; touch-action: pan-y; cursor: crosshair; }
          .vg-flate { position: relative; height: 132px; border-radius: 12px; overflow: hidden; }
          .vg-flate svg { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--vg); overflow: visible; }
          .vg-natt { position: absolute; top: 0; bottom: 0; background: rgba(167, 139, 250, 0.08); }
          .vg-varmetone { position: absolute; top: 0; bottom: 0;
            background: linear-gradient(180deg, color-mix(in srgb, var(--kib-orange) 16%, transparent), transparent 85%); }
          .vg-rute { position: absolute; left: 0; right: 0; height: 1px; background: var(--kib-inner); }
          .vg-fyll { fill: url(#kib-vg); }
          .vg-linje { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
            vector-effect: non-scaling-stroke; }
          .vg-mal { fill: none; stroke: var(--kib-text); stroke-opacity: 0.45; stroke-width: 1; stroke-dasharray: 4 4;
            vector-effect: non-scaling-stroke; }
          .vg-mallapp { position: absolute; right: 6px; transform: translateY(-50%); font-size: 11px; font-weight: 500;
            padding: 2px 7px; border-radius: 999px; background: var(--kib-surface); color: var(--kib-text);
            border: 1px solid var(--kib-inner); pointer-events: none; }
          .vg-y { position: absolute; left: 6px; font-size: 10.5px; color: var(--kib-muted);
            font-variant-numeric: tabular-nums; pointer-events: none; }
          .vg-y.topp { top: 4px; } .vg-y.bunn { bottom: 4px; }
          .vg-ekstrempkt { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%;
            background: var(--kib-surface); box-shadow: 0 0 0 2px var(--vg); pointer-events: none; }
          .vg-napkt { position: absolute; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
            background: var(--vg); box-shadow: 0 0 0 2px var(--kib-surface); animation: kib-puls 2.4s ease-in-out infinite;
            pointer-events: none; }
          .vg-bane { position: relative; height: 8px; border-radius: 4px; background: var(--kib-inner); overflow: hidden; }
          .vg-bane i { position: absolute; top: 0; bottom: 0; border-radius: 4px; }
          .vg-bane.pumpe i { background: var(--kib-blue); }
          .vg-bane.varme i { background: var(--kib-orange); }
          .vg-akse { position: relative; height: 14px; font-size: 11px; color: var(--kib-muted); font-variant-numeric: tabular-nums; }
          .vg-akse span { position: absolute; transform: translateX(-50%); }
          .vg-akse span:first-child { transform: none; }
          .vg-akse span:last-child { transform: translateX(-100%); }
          .vg-forklaring { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--kib-muted); }
          .vg-forklaring span { display: inline-flex; align-items: center; gap: 6px; }
          .vg-forklaring b { color: var(--kib-text); font-weight: 500; font-variant-numeric: tabular-nums; }
          .vg-f { width: 12px; height: 8px; border-radius: 3px; display: inline-block; }
          .vg-f.pumpe { background: var(--kib-blue); } .vg-f.varme { background: var(--kib-orange); }
          .vg-f.vg-f-natt { background: rgba(167, 139, 250, 0.35); }
          .vg-f.mal { height: 0; border-top: 1.5px dashed var(--kib-text); opacity: 0.6; border-radius: 0; }
          .vg-pekline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--kib-text); opacity: 0.5;
            pointer-events: none; }
          .vg-pekboks { position: absolute; top: 6px; transform: translateX(8px); display: grid; gap: 1px;
            padding: 7px 10px; border-radius: 12px; background: var(--kib-surface); border: 1px solid var(--kib-inner);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); font-size: 12px; pointer-events: none; white-space: nowrap; z-index: 2; }
          .vg-pekboks.venstre { transform: translateX(calc(-100% - 8px)); }
          .vg-pekboks b { font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums; }
          .vg-pekboks span { color: var(--kib-muted); }
          .vg-flagg { display: flex; gap: 4px; }
          .vg-flagg em { font-style: normal; font-size: 10.5px; font-weight: 500; padding: 1px 6px; border-radius: 999px; color: var(--kib-sort); }
          .vg-flagg em.p { background: var(--kib-blue); } .vg-flagg em.v { background: var(--kib-orange); }
          .vg-plot.peker .vg-napkt { opacity: 0; }

          .hvem { display: grid; gap: 8px; }
          .hvem-tekst { font-size: 13px; font-weight: 500; opacity: 0.7; }
          .hvem-rad { display: flex; flex-wrap: wrap; gap: 8px; }
          .hvem-chip { display: inline-flex; align-items: center; gap: 8px; padding: 4px 14px 4px 4px; border-radius: 999px;
            background: var(--kib-inner); color: var(--kib-text); font-size: 14px; font-weight: 500; cursor: pointer;
            transition: background 0.2s, transform 0.12s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .hvem-chip:active { transform: scale(0.95); }
          .hvem-chip small { font-size: 11px; opacity: 0.6; font-variant-numeric: tabular-nums; }
          .hvem-sjekk { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
            background: rgba(250, 251, 252, 0.1); }
          .hvem-sjekk ha-icon { --mdc-icon-size: 17px; }
          .hvem-chip.valgt { background: var(--kib-green); color: var(--kib-sort); }
          .hvem-chip.valgt .hvem-sjekk { background: rgba(0, 0, 0, 0.14); }

          .kal { display: grid; gap: 6px; background: var(--kib-inner); border-radius: 18px; padding: 10px; }
          .kal-hode { display: grid; grid-template-columns: 36px 1fr 36px; align-items: center; }
          .kal-tittel { text-align: center; font-size: 14px; font-weight: 500; text-transform: capitalize; }
          .kal-tittel small { display: block; font-size: 11px; font-weight: 500; opacity: 0.6; text-transform: none; }
          .kal-pil { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
            background: var(--kib-surface); color: var(--kib-text); cursor: pointer; }
          .kal-pil[disabled] { opacity: 0.3; cursor: default; }
          .kal-pil ha-icon { --mdc-icon-size: 20px; }
          .kal-uke, .kal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
          .kal-uke span { text-align: center; font-size: 11px; font-weight: 500; opacity: 0.55; }
          .kal-dag { position: relative; aspect-ratio: 1 / 1; border-radius: 12px; background: none; color: var(--kib-text);
            display: grid; place-items: center; text-align: center; cursor: pointer; font-variant-numeric: tabular-nums; padding: 0; }
          .kal-tall { font-size: 13px; width: 100%; text-align: center; }
          .kal-dag.forbi .kal-tall { opacity: 0.45; }
          .kal-dag.kal-idag { box-shadow: inset 0 0 0 1.5px var(--kib-text); }
          .kal-dag.neste { box-shadow: inset 0 0 0 2px var(--kib-orange); }
          .kal-dag.lagt { background: var(--kib-green); color: var(--kib-sort); }
          .kal-dag.valgt { outline: 2px solid var(--kib-accent); outline-offset: 1px; }
          .kal-prikk { position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 600;
            line-height: 1; letter-spacing: 0.02em; }
          .kal-dag.lagt .kal-tall { transform: translateY(-3px); }
          .kal-detalj { background: var(--kib-surface); border-radius: 12px; padding: 4px 10px; }
          .kal-detalj .klorrad:first-child { border-top: none; }
          .kal-forklaring { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 11.5px; color: var(--kib-muted); }
          .kal-forklaring span { display: inline-flex; align-items: center; gap: 5px; }
          .kf { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
          .kf.lagt { background: var(--kib-green); }
          .kf.neste { box-shadow: inset 0 0 0 2px var(--kib-orange); }
          .kf.kf-idag { box-shadow: inset 0 0 0 1.5px var(--kib-text); }
          .angre-tekst { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px;
            border-radius: 999px; background: var(--kib-surface); color: var(--kib-text); font-size: 12px; cursor: pointer; }
          .angre-tekst ha-icon { --mdc-icon-size: 14px; }

          .navneliste { display: flex; flex-wrap: wrap; gap: 6px; }
          .navnechip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 4px 4px 12px; border-radius: 999px;
            background: var(--kib-inner); font-size: 14px; font-weight: 500; }
          .navnechip button { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
            background: rgba(250, 251, 252, 0.08); color: var(--kib-text); cursor: pointer; }
          .navnechip ha-icon { --mdc-icon-size: 15px; }
          .navn-ny { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin: 0; }
          .navn-felt { font: inherit; font-size: 15px; color: var(--kib-text); background: var(--kib-inner); border: none;
            border-radius: 14px; padding: 12px 14px; outline: none; min-width: 0; }
          .navn-felt:focus { box-shadow: inset 0 0 0 1.5px var(--kib-accent); }
          .navn-ny button { display: inline-flex; align-items: center; gap: 4px; padding: 0 16px; border-radius: 14px;
            background: var(--kib-accent); color: var(--kib-sort); font-size: 14px; font-weight: 500; cursor: pointer; }
          .navn-ny ha-icon { --mdc-icon-size: 18px; }

          .prisrad { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 8px; }
          .prisrad > div { display: grid; gap: 1px; }
          .prisrad small { font-size: 11.5px; font-weight: 500; opacity: 0.65; }
          .prisrad b { font-size: 20px; font-weight: 300; font-variant-numeric: tabular-nums; }
          .prisrad em { font-style: normal; font-size: 11px; opacity: 0.6; }
          .prisrad .gron b { color: var(--kib-green); }

          .spredtall { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px;
            background: var(--kib-inner); border-radius: 16px; overflow: hidden; }
          .spredtall button { display: grid; gap: 2px; align-content: start; padding: 10px 12px; background: var(--kib-surface);
            color: var(--kib-text); text-align: left; cursor: pointer; min-width: 0; }
          .spredtall small { font-size: 11.5px; font-weight: 500; opacity: 0.65; }
          .spredtall b { font-size: 18px; font-weight: 300; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .spredtall em { font-style: normal; font-size: 12px; opacity: 0.6; }
          .spredtall .ispor { margin-top: 4px; }
          @media (prefers-reduced-motion: reduce) { .vg-napkt { animation: none; } }

          /* --- 2.4: fanerada som ki-tabs, og «spart i dag» -------------- */
          .fanerad { min-width: 0; max-width: 100%; }
          .faner {
            flex: 0 1 auto; min-width: 0; overflow-x: auto; overflow-y: hidden;
            overscroll-behavior-x: contain; scroll-snap-type: x proximity;
            scroll-behavior: smooth; -webkit-overflow-scrolling: touch;
          }
          /* Pillehjelperen setter touch-action: none på fanene for å kunne dra pilla.
             Her må fingeren kunne rulle rada, så vannrett panorering tillates. */
          .faner .fane { flex: 0 0 auto; scroll-snap-align: center; touch-action: pan-x !important; }
          .faner.ruller.mer-h { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent 100%);
            mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent 100%); }
          .faner.ruller.mer-v { -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px);
            mask-image: linear-gradient(to right, transparent 0, #000 40px); }
          .faner.ruller.mer-v.mer-h { -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%); }

          .spstor { font-weight: 500; }
          .spstor.gron { color: var(--kib-green); }
          .sp-lukk { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
            background: var(--kib-inner); color: var(--kib-text); cursor: pointer; }
          .sp-lukk ha-icon { --mdc-icon-size: 20px; }
          .srad.gron .sspor i { background: var(--kib-green); }
          .spliste { display: grid; }
          .sprad { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center;
            padding: 8px 0; border-top: 1px solid var(--kib-inner); }
          .sprad:first-child { border-top: none; }
          .spik { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
            background: color-mix(in srgb, var(--kib-green) 18%, transparent); color: var(--kib-green); }
          .sprad.anslag .spik { background: var(--kib-inner); color: var(--kib-text); }
          .spik ha-icon { --mdc-icon-size: 19px; }
          .spnavn { display: grid; gap: 1px; min-width: 0; }
          .spnavn b { font-size: 14px; font-weight: 500; }
          .spnavn small { font-size: 12px; opacity: 0.7; line-height: 1.35; }
          .spverdi { font-size: 15px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap;
            color: var(--kib-green); }
          .sprad.anslag .spverdi { color: var(--kib-text); opacity: 0.85; }
          .sprad.minus .spverdi { color: var(--kib-orange); }
          .sptotal { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 12px;
            border-radius: 14px; background: var(--kib-inner); font-size: 13px; }
          .sptotal b { font-size: 15px; font-weight: 500; color: var(--kib-green); font-variant-numeric: tabular-nums; }
          .sphist { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px;
            background: var(--kib-inner); border-radius: 16px; overflow: hidden; }
          .sphist button { display: grid; gap: 2px; padding: 10px 12px; background: var(--kib-surface);
            color: var(--kib-text); text-align: left; cursor: pointer; min-width: 0; }
          .sphist small { font-size: 11.5px; font-weight: 500; opacity: 0.65; white-space: nowrap; }
          .sphist b { font-size: 18px; font-weight: 300; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .sphist em { font-style: normal; font-size: 12px; opacity: 0.6; }
          /* --- 2.3: nye deler, i samme størrelse som resten av kortet --- */
          .ring.mini { width: 56px; height: 56px; }
          .ring.mini circle { stroke-width: 10; }
          .ring.mini .rtekst b { font-size: 16px; }
          .ring.mini .rtekst span { font-size: 9.5px; margin-top: -2px; }
          .banner.info { grid-template-columns: 58px minmax(0, 1fr); background: var(--kib-surface); color: var(--kib-text); }
          .banner.info .bik { background: color-mix(in srgb, var(--kib-orange) 22%, transparent); color: var(--kib-orange); }

          .detaljer { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px;
            margin: -4px 0 -4px; background: none; color: var(--kib-muted); font-size: 12.5px; cursor: pointer; }
          .detaljer ha-icon { --mdc-icon-size: 17px; }

          .klorfelt { padding: 12px; }
          .klorlogger { display: grid; gap: 10px; }
          .kl-hode { display: flex; justify-content: space-between; align-items: center; gap: 10px;
            font-size: 14px; font-weight: 500; }
          .kl-hode em { font-style: normal; color: var(--kib-orange); }
          .kl-antall { display: inline-flex; align-items: center; gap: 2px; background: var(--kib-inner);
            border-radius: 999px; padding: 3px; font-size: 13px; }
          .kl-antall b { font-weight: 500; min-width: 44px; text-align: center; font-variant-numeric: tabular-nums; }
          .kl-antall button { width: 30px; height: 30px; border-radius: 50%; background: var(--kib-surface);
            color: var(--kib-text); font-size: 17px; line-height: 1; cursor: pointer; }
          .kl-antall button[disabled] { opacity: 0.35; cursor: default; }
          .kl-navn { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
          .navneknapp { display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 8px; border-radius: 18px;
            background: var(--kib-inner); color: var(--kib-text); font-size: 15px; font-weight: 500; cursor: pointer; min-height: 52px;
            text-align: left; transition: transform 0.12s cubic-bezier(0.2, 1.3, 0.3, 1), background 0.2s; }
          .navneknapp:active { transform: scale(0.95); background: var(--kib-green); color: var(--kib-sort); }
          .initial { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; flex: none;
            background: color-mix(in srgb, var(--kib-green) 30%, transparent); font-size: 15px; font-weight: 600; }
          .initial ha-icon { --mdc-icon-size: 18px; }
          .navneknapp.uten .initial { background: var(--kib-inner); }
          .navneknapp.uten { color: var(--kib-muted); }
          .kvittering { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 14px;
            background: color-mix(in srgb, var(--kib-green) 20%, transparent); font-size: 13.5px; font-weight: 500; }
          .kvittering ha-icon { --mdc-icon-size: 18px; color: var(--kib-green); }
          .kal-dag.fremtid .kal-tall { opacity: 0.35; }
          .kal-dag[disabled] { cursor: default; }

          @media (prefers-reduced-motion: reduce) {
            .natt.aktiv .natt-av { animation: none; }
            .sspor i { transition: none; }
          }
          /* --- 3.0: scenen, fliser du blar i, setningen, Varme og Klor ----------
             Satt sammen av dashbordets Tesla-, Strøm-, Innstillinger- og Pult-kort.
             MERK: ingen backticks i kommentarene her, de lukker css-malen. */
          .kort3 { display: flex; flex-direction: column; gap: 12px; }
          .kort3 > .innhold, .kort3 .faneinnhold { gap: 12px; }
          .kort3 .panel { margin-top: 0; }
          .kort3 .fanerad { margin: 2px 0; }
          .kort3 .vpstatus, .kort3 .hurtig, .kort3 .bannere { margin-bottom: 0; }
          .kort3 .hurtig { gap: 12px; }
          .kort3 .hk ha-icon { --mdc-icon-size: 30px; }
          .kort3 .hurtig:not(.navn) .hk span { display: none; }

          .fik3 { width: 52px; height: 52px; flex: none; box-sizing: border-box; border-radius: 50%;
            display: grid; place-items: center; background: rgba(250, 251, 252, 0.1); border: 1px solid rgba(250, 251, 252, 0.1); }
          .fik3 ha-icon { --mdc-icon-size: 28px; }
          .tog3 { position: relative; display: inline-block; width: 46px; height: 26px; flex: none; padding: 0;
            border-radius: 13px; background: rgba(250, 251, 252, 0.25); transition: background 0.2s; }
          .tog3 i { position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; border-radius: 50%;
            background: #2b2b2d; transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1); }
          .tog3.pa { background: #f3f3f3; }
          .tog3.pa i { transform: translateX(20px); background: #222; }

          /* Scenen øverst */
          .hero3 { position: relative; height: 178px; border-radius: 24px; overflow: hidden; isolation: isolate; cursor: pointer;
            color: #eaf4f8; background: linear-gradient(160deg, #172028 0%, #1b2a34 60%, #213643 100%);
            -webkit-tap-highlight-color: transparent; transition: transform 0.15s cubic-bezier(0.3, 1.4, 0.5, 1); }
          .hero3:active { transform: scale(0.99); }
          .hero3.natt { background: linear-gradient(160deg, #141626 0%, #1b1f35 60%, #252c48 100%); }
          .hero3.vinter { background: linear-gradient(160deg, #1b2233 0%, #243049 60%, #2d3e5f 100%); }
          .h3-scene { position: absolute; right: 0; bottom: 0; height: 84%; width: auto; aspect-ratio: 220 / 180; max-width: 66%; z-index: -1; }
          .h3-tekst { position: absolute; left: 20px; top: 16px; bottom: 16px; right: 16px; display: flex; flex-direction: column;
            align-items: flex-start; text-shadow: 0 1px 10px rgba(0, 0, 0, 0.35); }
          .h3-navn { font-size: 14px; font-weight: 500; opacity: 0.75; }
          .h3-pille { margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px 4px 8px; border-radius: 999px;
            background: rgba(250, 251, 252, 0.13); font-size: 12.5px; font-weight: 500; white-space: nowrap; --mdc-icon-size: 15px; text-shadow: none; }
          .h3-pille.varm ha-icon { color: #ffb08a; }
          .h3-pille.lilla { background: color-mix(in srgb, var(--kib-purple) 32%, transparent); }
          .h3-pille.gronn { background: color-mix(in srgb, var(--kib-green) 26%, transparent); }
          .h3-pille.bla { background: color-mix(in srgb, var(--kib-blue) 28%, transparent); }
          .h3-temp { margin-top: auto; font-size: 34px; font-weight: 300; line-height: 1.05; font-variant-numeric: tabular-nums; cursor: pointer; }
          .h3-temp small { font-size: 15px; margin-left: 3px; opacity: 0.85; }
          .h3-under { font-size: 12.5px; opacity: 0.68; margin-top: 1px; white-space: nowrap; }
          .h3-stolpe { width: min(170px, 48%); height: 4px; margin-top: 7px; border-radius: 2px; background: rgba(250, 251, 252, 0.12); overflow: hidden; }
          .h3-stolpe i { display: block; height: 100%; border-radius: 2px; background: var(--kib-green); transition: width 0.8s ease; }
          .h3-glod, .h3-mane, .h3-sno, .h3-tak, .h3-damp, .h3-varme, .h3-lysflate { opacity: 0; transition: opacity 0.8s; }
          .hero3.varmer .h3-glod, .hero3.varmer .h3-damp, .hero3.varmer .h3-varme,
          .hero3.natt .h3-mane, .hero3.vinter .h3-sno, .hero3.tak .h3-tak, .hero3.lys .h3-lysflate { opacity: 1; }
          .hero3.vinter .h3-vannet { filter: saturate(0.35) brightness(1.15); }
          .hero3.gar .h3-bolge { animation: h3-bolge 5s linear infinite; }
          @keyframes h3-bolge { from { transform: translateX(0); } to { transform: translateX(20px); } }
          .h3-bobler circle { opacity: 0; }
          .hero3.gar .h3-bobler circle { animation: h3-boble 3.6s ease-in infinite; animation-delay: calc(var(--i) * -0.6s); }
          @keyframes h3-boble { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-46px); } }
          .h3-vifte { transform-box: fill-box; transform-origin: center; }
          .hero3.varmer .h3-vifte { animation: h3-snurr 1.1s linear infinite; }
          @keyframes h3-snurr { to { transform: rotate(360deg); } }
          .hero3.varmer .h3-damp path { animation: h3-damp 3s ease-in-out infinite; animation-delay: calc(var(--i) * -1s); }
          @keyframes h3-damp { 0% { opacity: 0; transform: translateY(4px); } 40% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-10px); } }
          .hero3.varmer .h3-varme path { animation: h3-blaas 1.6s ease-in-out infinite; animation-delay: calc(var(--i) * -0.8s); }
          @keyframes h3-blaas { 0% { opacity: 0; transform: translateX(0); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateX(-8px); } }
          .hero3.vinter .h3-sno circle { animation: h3-sno 6s linear infinite; animation-delay: calc(var(--i) * -0.75s); }
          @keyframes h3-sno { 0% { opacity: 0; transform: translateY(-10px); } 15% { opacity: 0.85; } 100% { opacity: 0; transform: translateY(90px); } }

          /* Store fliser, og fliser du blar i */
          .g23 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .g23.en { grid-template-columns: minmax(0, 1fr); }
          .fl3 { position: relative; height: 160px; min-width: 0; box-sizing: border-box; padding: 14px 16px; border-radius: 24px;
            background: var(--kib-surface); color: var(--kib-text); display: flex; flex-direction: column; align-items: flex-start;
            text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: background 0.25s, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .fl3:active { transform: scale(0.98); }
          .fl3.varsel { background: var(--kib-orange); color: var(--kib-sort); }
          .fl3-navn { margin-top: auto; font-size: 14px; font-weight: 500; opacity: 0.72; }
          .fl3-verdi { font-size: 30px; font-weight: 300; line-height: 1.15; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .fl3-verdi small { font-size: 13px; font-weight: 400; opacity: 0.8; margin-left: 3px; }
          .fl3-verdi.gron { color: var(--kib-green); }
          .fl3 .tog3 { position: absolute; right: 16px; top: 28px; }
          /* Som css-swipe-card i Strøm-kortet: 190 px med prikkene, aktiv prikk gray400,
             de andre gray200, uten kant. */
          .sv3 { display: grid; gap: 6px; min-width: 0; }
          .sv3 .fl3 { height: 168px; }
          .sv3-spor { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; border-radius: 24px;
            scrollbar-width: none; overscroll-behavior-x: contain; }
          .sv3-spor::-webkit-scrollbar { display: none; }
          .sv3-side { flex: 0 0 100%; scroll-snap-align: start; scroll-snap-stop: always; }
          .prikker3 { display: flex; justify-content: center; gap: 8px; height: 8px; }
          .prikker3 i { width: 8px; height: 8px; border-radius: 50%; border: none; background: var(--gray200, rgba(250, 251, 252, 0.2)); transition: background 0.2s; }
          .prikker3 i.a { background: var(--gray400, rgba(250, 251, 252, 0.55)); }

          /* Setningen med verdiene i piller */
          .setn3 { margin: 0; padding: 0 6px; font-size: 19px; line-height: 1.8; }
          .prosa3 { margin: 0 -2px; }
          .pl3 { display: inline-block; margin: 0 2px; padding: 0 11px; border-radius: 999px; line-height: 1.5;
            background: var(--kib-text); color: var(--kib-surface); font-weight: 500; font-variant-numeric: tabular-nums; cursor: pointer; }

          /* I dag */
          .dag3 { display: flex; align-items: center; gap: 10px; padding: 4px 4px 0; font-size: 15px; }
          .dag3 ha-icon { --mdc-icon-size: 22px; }
          .dag3 b { font-size: 17px; font-weight: 500; }
          .dag3 span { opacity: 0.7; }
          .liste3 { border-radius: 24px; background: var(--kib-surface); padding: 4px 18px; }
          .lr3 { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 0; color: var(--kib-text); cursor: pointer;
            border-top: 1px solid rgba(250, 251, 252, 0.08); -webkit-tap-highlight-color: transparent; }
          .lr3:first-child { border-top: 0; }
          .lr3-navn { flex: 1; font-size: 15px; opacity: 0.8; }
          .lr3-verdi { font-size: 28px; font-weight: 300; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .lr3-verdi small { font-size: 13px; margin-left: 4px; opacity: 0.75; }
          .lr3-pil { --mdc-icon-size: 18px; width: 18px; flex: none; opacity: 0.55; }
          .lr3-pil.gronn { color: var(--kib-green); opacity: 1; }
          .lr3-pil.oransje { color: var(--kib-orange); opacity: 1; }

          /* Profilene som scener */
          .sk3-rad { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x proximity; }
          .sk3-rad::-webkit-scrollbar { display: none; }
          .sk3 { position: relative; flex: 0 0 96px; height: 96px; border-radius: 24px; background: var(--kib-surface); color: var(--kib-text);
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 500;
            scroll-snap-align: start; cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: background 0.25s, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .sk3:active { transform: scale(0.95); }
          .sk3 ha-icon { --mdc-icon-size: 26px; }
          .sk3 span { max-width: 88px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .sk3.pa { background: var(--kib-accent); color: var(--kib-sort); }

          /* Rader med ikon og tekst, to i bredden eller brede */
          .br3 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .br3.odde > :last-child { grid-column: 1 / -1; }
          .br3 .rad3-tekst b, .br3 .rad3-tekst small { white-space: normal; }
          .rad3 { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-width: 0; min-height: 72px;
            box-sizing: border-box; padding: 10px 14px 10px 10px; border-radius: 24px; background: var(--kib-surface); color: var(--kib-text);
            text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: background 0.25s, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .rad3:active { transform: scale(0.98); }
          .rad3 .fik3 { width: 48px; height: 48px; }
          .rad3 .fik3 ha-icon { --mdc-icon-size: 25px; }
          .rad3-tekst { flex: 1; display: grid; gap: 1px; min-width: 0; }
          .rad3-tekst b { font-size: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .rad3-tekst small { font-size: 13px; font-weight: 500; opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .rad3.bred .rad3-tekst small { white-space: normal; }
          .rad3.pa { background: var(--kib-accent); color: var(--kib-sort); }
          .rad3.varsel { background: linear-gradient(135deg, var(--kib-orange), color-mix(in srgb, var(--kib-orange) 72%, #fff)); color: var(--kib-sort); }
          .rad3.pa .fik3, .rad3.varsel .fik3, .kb3.varsel .fik3, .lg3 .fik3, .fl3.varsel .fik3 { background: rgba(0, 0, 0, 0.08); border-color: rgba(0, 0, 0, 0.06); }
          .rad3-pil { --mdc-icon-size: 22px; flex: none; opacity: 0.7; }
          .rad3-velg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; font-size: 16px; }

          /* Varme */
          .fv3 { display: grid; grid-template-columns: repeat(var(--n, 5), minmax(0, 1fr)); gap: 12px; }
          /* Som ladegrense-knappene i Tesla-kortet: kvadratiske, 24 px hjørner, et
             trykkmerke øverst, og fylt med aktivfargen når verdien er valgt. */
          .fv3-k { position: relative; aspect-ratio: 1 / 1; border-radius: 24px; background: var(--kib-surface); color: var(--kib-text);
            display: grid; place-items: center; font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums; cursor: pointer;
            -webkit-tap-highlight-color: transparent; transition: background 0.25s, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .fv3-k::before, .sk3::before { content: ""; position: absolute; top: 8px; left: calc(50% - 18px); width: 36px; height: 3px;
            border-radius: 5px; background: var(--kib-text); opacity: 0.1; }
          .fv3-k:active { transform: scale(0.94); }
          .fv3-k.pa { background: var(--kib-accent); color: var(--kib-sort); }
          .uf3 { align-self: center; display: inline-flex; gap: 4px; max-width: 100%; box-sizing: border-box; padding: 2px;
            border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 999px; overflow-x: auto; scrollbar-width: none; }
          .uf3-k { flex: none; padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; white-space: nowrap;
            color: rgba(255, 255, 255, 0.72); -webkit-tap-highlight-color: transparent; transition: background 0.2s, color 0.2s; }
          .uf3-k.pa { background: var(--kib-accent); color: rgba(70, 58, 64, 0.95); box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35); }
          .uf3-topp { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14px; font-weight: 500; }
          .statgrid.tre { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .statgrid.tre .stat { padding: 10px 12px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "v" "n"; }
          .statgrid.tre .stat ha-icon { display: none; }
          .nk3 { position: relative; min-height: 164px; box-sizing: border-box; padding: 18px 20px; border-radius: 26px;
            display: flex; flex-direction: column; background: var(--kib-surface); color: var(--kib-text); cursor: pointer;
            -webkit-tap-highlight-color: transparent; transition: transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .nk3:active { transform: scale(0.99); }
          .nk3.farget { background: linear-gradient(135deg, var(--kib-purple) 0%, color-mix(in srgb, var(--kib-purple) 72%, #fff) 100%); color: #fff; }
          .nk3-navn { font-size: 14px; font-weight: 500; opacity: 0.8; }
          .nk3-ik { position: absolute; right: 14px; top: 14px; }
          .nk3.farget .nk3-ik { background: rgba(0, 0, 0, 0.12); border-color: transparent; }
          .nk3-stor { margin-top: auto; padding-right: 60px; font-size: 32px; font-weight: 300; line-height: 1.1; font-variant-numeric: tabular-nums; }
          .nk3-under { padding-right: 60px; font-size: 13px; opacity: 0.82; }
          .nk3 .tog3 { position: absolute; right: 18px; bottom: 24px; }
          .nk3-detaljer { gap: 10px; }
          .sc3 { position: relative; height: 176px; box-sizing: border-box; padding: 14px 16px; border-radius: 24px; overflow: hidden;
            isolation: isolate; display: flex; flex-direction: column; color: #fff; cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .sc3:active { transform: scale(0.98); }
          .sc3-bilde { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
          .sc3-navn { padding-right: 52px; font-size: 14px; font-weight: 500; opacity: 0.85; }
          .sc3-ik { position: absolute; right: 12px; top: 12px; width: 44px; height: 44px; background: rgba(0, 0, 0, 0.25); }
          .sc3-ik ha-icon { --mdc-icon-size: 24px; }
          .sc3-verdi { margin-top: auto; display: grid; font-size: 30px; font-weight: 300; line-height: 1.1; }
          .sc3-verdi small { padding-right: 50px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: 500; line-height: 1.3; opacity: 0.75; }
          .sc3 .tog3 { position: absolute; right: 16px; bottom: 20px; }
          .sc3-dekke { transform-box: view-box; transform-origin: 186px 68px; transform: scaleX(0.45);
            transition: transform 0.7s cubic-bezier(0.3, 1.2, 0.5, 1); }
          .sc3.tak.pa .sc3-dekke { transform: scaleX(1); }
          .sc3-bolge { animation: h3-bolge 4s linear infinite; }
          .sc3-vindu { opacity: 0.35; transition: opacity 0.6s; }
          .sc3.vinter.pa .sc3-vindu { opacity: 0.95; }
          .sc3.vinter.pa .sc3-fnugg circle { animation: h3-sno 5s linear infinite; animation-delay: calc(var(--i) * -0.7s); }

          /* Klor */
          .kb3 { display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; padding: 10px 16px 10px 10px;
            border-radius: 26px; background: var(--kib-surface); color: var(--kib-text); text-align: left; cursor: pointer; }
          .kb3 .fik3 { color: var(--kib-green); }
          .kb3.varsel { background: linear-gradient(135deg, var(--kib-orange), color-mix(in srgb, var(--kib-orange) 72%, #fff)); color: var(--kib-sort); }
          .kb3.varsel .fik3 { color: inherit; }
          .kl3-hint { padding: 0 6px; font-size: 15px; opacity: 0.75; }
          .kl3-hint b { font-weight: 500; color: var(--kib-orange); }
          .nv3-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 66px; gap: 12px; }
          .nv3-grid.en .nv3.stor { grid-column: 1 / -1; }
          .nv3 { position: relative; display: flex; align-items: center; gap: 12px; min-width: 0; box-sizing: border-box;
            padding: 8px 16px 8px 8px; border-radius: 26px; background: var(--kib-surface); color: var(--kib-text); text-align: left;
            cursor: pointer; -webkit-tap-highlight-color: transparent;
            transition: transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1), background 0.2s; }
          .nv3:active { transform: scale(0.96); background: var(--kib-green); color: var(--kib-sort); }
          .nv3 .fik3 { width: 48px; height: 48px; }
          .nv3 b { flex: 1; font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .nv3-tall { font-size: 13px; opacity: 0.65; font-variant-numeric: tabular-nums; }
          .nv3.stor { grid-row: span 2; flex-direction: column; align-items: flex-start; gap: 0; padding: 14px 16px; }
          .nv3.stor .fik3 { position: absolute; right: 12px; top: 12px; }
          .nv3.stor small { font-size: 13px; opacity: 0.65; }
          .nv3-navn { margin-top: auto; max-width: 100%; font-size: 26px; font-weight: 300; line-height: 1.1;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .lg3 { display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; padding: 8px; border-radius: 999px;
            background: var(--kib-green); color: var(--kib-sort); font-size: 16px; font-weight: 500; cursor: pointer;
            transition: transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .lg3:active { transform: scale(0.98); }
          .lg3 .fik3 { width: 48px; height: 48px; }
          .chips3 { display: flex; flex-wrap: wrap; gap: 10px; }
          .chips3::-webkit-scrollbar { display: none; }
          .chip3 { flex: none; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px;
            background: var(--kib-surface); color: var(--kib-text); font-size: 15px; font-weight: 500; white-space: nowrap;
            cursor: pointer; --mdc-icon-size: 19px; transition: background 0.2s; }
          .chip3.pa { background: var(--kib-accent); color: var(--kib-sort); }
          .chip3.dag { background: color-mix(in srgb, var(--kib-orange) 25%, var(--kib-surface)); }
          .akk3 { border-radius: 24px; background: var(--kib-surface); padding: 0 16px; }
          .akk3.apen { padding-bottom: 14px; }
          .akk3-hode { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 64px; color: var(--kib-text);
            cursor: pointer; --mdc-icon-size: 24px; }
          .akk3-hode b { flex: 1; font-size: 17px; font-weight: 500; }
          .akk3-hode span { font-size: 14px; opacity: 0.72; }
          .akk3-pil { --mdc-icon-size: 22px; opacity: 0.8; }
          .navn3 { gap: 10px; }

          @media (prefers-reduced-motion: reduce) {
            .hero3 *, .sc3 * { animation: none !important; }
          }
        `;
      }
    }

    /* ---------------------------------------------------------------- */
    /* Editor                                                            */
    /* ---------------------------------------------------------------- */

    class KiBassengCardEditor extends LitElement {
      static get properties() {
        return { hass: {}, _config: {} };
      }

      setConfig(config) {
        this._config = config;
      }

      _endret(ev) {
        ev.stopPropagation();
        const config = { ...this._config, ...ev.detail.value };
        if (config.faner === true) delete config.faner;
        /* En faneliste fra YAML (oversikt, sirkulasjon …) skal ikke bli til true bare
           fordi editoren viser feltet som en bryter. */
        if (Array.isArray(this._config.faner) && ev.detail.value.faner === true) config.faner = this._config.faner;
        /* Hurtigknappene vises som en entitetsliste. Navn og ikon satt i YAML tas vare
           på for de entitetene som fortsatt står i lista. */
        if (Array.isArray(ev.detail.value.hurtig)) {
          const forrige = {};
          (this._config.hurtig || []).forEach((x) => {
            const o = typeof x === "string" ? { entity: x } : x;
            if (o && o.entity) forrige[o.entity] = o;
          });
          config.hurtig = ev.detail.value.hurtig.map((id) =>
            forrige[id] && Object.keys(forrige[id]).length > 1 ? forrige[id] : id);
          if (!config.hurtig.length) delete config.hurtig;
        }
        for (const k of ["varmepumpe", "stillemodus"]) if (!config[k]) delete config[k];
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })
        );
      }

      render() {
        if (!this.hass || !this._config) return html``;
        const schema = [
          { name: "tittel", selector: { text: {} } },
          { name: "prefix", selector: { text: {} } },
          { name: "graf", selector: { boolean: {} } },
          { name: "faner", selector: { boolean: {} } },
          { name: "varmepumpe", selector: { entity: { domain: "climate" } } },
          { name: "stillemodus", selector: { entity: { domain: ["switch", "input_boolean"] } } },
          { name: "hurtig", selector: { entity: { multiple: true } } },
        ];
        return html`
          <ha-form
            .hass=${this.hass}
            .data=${{ graf: true, ...this._config, faner: this._config.faner !== false,
              hurtig: (this._config.hurtig || []).map((x) => (typeof x === "string" ? x : x.entity)).filter(Boolean) }}
            .schema=${schema}
            .computeLabel=${(s) =>
              ({
                tittel: "Tittel",
                prefix: "Entitetsprefiks (valgfritt)",
                graf: "Vis graf",
                faner: "Faner (av = én flyt med utvidbare seksjoner)",
                varmepumpe: "Varmepumpe (statuskort øverst)",
                stillemodus: "Stillemodus-bryter (vises i statuskortet)",
                hurtig: "Hurtigknapper øverst",
              })[s.name] || s.name}
            @value-changed=${this._endret}
          ></ha-form>
        `;
      }
    }

    customElements.define("ki-basseng-card", KiBassengCard);
    customElements.define("ki-basseng-card-editor", KiBassengCardEditor);

    window.customCards = window.customCards || [];
    window.customCards.push({
      type: "ki-basseng-card",
      name: "KI Basseng",
      preview: true,
      description: "Sirkulasjon, varme og spreder for bassenget",
    });

    console.info(
      `%c KI-BASSENG-CARD %c ${VERSJON} `,
      "background:#4a9df8;color:#000;font-weight:600;border-radius:3px 0 0 3px",
      "background:#333;color:#fff;border-radius:0 3px 3px 0"
    );
  };

  /* Registreringen skjer ofte fra en `.then()`, fordi LitElement ikke finnes i
   * frontend ennå når fila lastes. Kaster `start()` der, fanges det IKKE av
   * try/catch-en bundelen legger rundt hver fil — feilen forsvinner som en ubehandlet
   * promise-avvisning, og resultatet er «Custom element doesn't exist» uten et ord om
   * hvorfor.
   *
   * Derfor egen fangst med et navn på feilen. Kortet blir ikke mer robust av dette,
   * men neste gang står årsaken i konsollen.
   */
  const trygtStart = (LitElement, hvor) => {
    try {
      if (!LitElement || !LitElement.prototype || !LitElement.prototype.html) {
        console.error(`ki-basseng-card: LitElement fra ${hvor} mangler html/css. `
          + "Frontend-versjonen kan ha endret seg.");
        return;
      }
      start(LitElement);
    } catch (e) {
      console.error(`ki-basseng-card: registreringen feilet (${hvor})`, e);
    }
  };

  const lit = finnLit();
  if (lit) {
    trygtStart(lit, "ved lasting");
  } else {
    Promise.race([
      customElements.whenDefined("ha-panel-lovelace"),
      customElements.whenDefined("hui-view"),
      customElements.whenDefined("home-assistant-main"),
    ]).then(() => {
      const sen = finnLit();
      if (sen) trygtStart(sen, "etter whenDefined");
      else console.error("ki-basseng-card: fant ikke LitElement i frontend");
    }).catch((e) => console.error("ki-basseng-card: whenDefined feilet", e));
  }
})();

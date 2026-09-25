/*!
 * ki-basseng-card 2.4.0 - del av ki-cards
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

  const VERSJON = "2.4.0";

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

    const nf = (v, d = 1) =>
      v === null || v === undefined || v === "" || isNaN(v)
        ? "–"
        : Number(v).toFixed(d).replace(".", ",");

    const klokke = (iso) => {
      if (!iso || typeof iso !== "string") return null;
      const d = new Date(iso);
      return isNaN(d) ? null : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    };

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
        try { this._klorHvem = localStorage.getItem("kib-klor-hvem"); } catch (e) { this._klorHvem = null; }
        this._kalMnd = 0;
        this._kalValgt = null;
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
          <div class="hurtig" style="--kolonner:${Math.min(liste.length, 5)}">
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

      // Flis i samme form som button-card-flisene i dashbordet
      /* Liggende flis, som de små flisene i dashbordet: ikonsirkel til venstre, navnet
         og tilstanden til høyre. Aktiv = fylt med aktivfargen og svart tekst. */
      _flis(ikon, navn, tekst, aktiv, klikk, farge, nokkel = null) {
        return html`
          <button
            class="flis ${aktiv ? "aktiv" : ""}"
            style=${aktiv && farge ? `background:${farge}` : ""}
            @pointerdown=${(e) => nokkel && this._holdNed(e, nokkel)}
            @pointerup=${() => this._holdOpp()} @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
            @contextmenu=${(e) => e.preventDefault()}
            @click=${this._holdKlikk(() => { this._haptikk("light"); klikk(); })}
          >
            <span class="flis-ikon"><ha-icon icon="${ikon}"></ha-icon></span>
            <span class="flis-tekstblokk">
              <span class="flis-navn">${navn}</span>
              <span class="flis-tekst">${tekst}</span>
            </span>
          </button>
        `;
      }

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

      _rad(tekst, verdi) {
        return html`<div class="rad"><span>${tekst}</span><span class="rad-verdi">${verdi}</span></div>`;
      }

      _faneListe() {
        const valgt = this._config.faner;
        const alle = [
          { id: "oversikt", navn: "Oversikt" },
          { id: "varme", navn: "Varme" },
          { id: "sirkulasjon", navn: "Sirkulasjon" },
          { id: "spreder", navn: "Spreder" },
          /* Innstillinger er ikke en likeverdig fane — den åpnes fra tannhjulet til
             høyre i rada. Den ligger her bare så `faner:`-lista kan nevne den. */
          { id: "innstillinger", navn: "Innstillinger", tannhjul: true },
        ];
        if (Array.isArray(valgt) && valgt.length) {
          return valgt
            .filter((v) => v !== "varme" || this._harVarme())
            .map((v) => alle.find((f) => f.id === v) || (typeof v === "object" && v.id ? { id: v.id, navn: v.navn || v.id } : null))
            .filter(Boolean);
        }
        return alle.filter((f) => f.id !== "varme" || this._harVarme());
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

      /* Stor −/+ for ett tall. Holder valget lokalt til entiteten svarer, så to raske
         trykk blir +1,0 og ikke +0,5 to ganger fra samme utgangspunkt. */
      _stepperStor(key, tekst, steg, des = 1, suffiks = "") {
        const s = this.st(key);
        if (!s) return "";
        const faktisk = Number(s.state);
        this._lokal = this._lokal || {};
        const l = this._lokal[key];
        if (l && (Math.abs(l.v - faktisk) < 1e-6 || Date.now() - l.t > 4000)) delete this._lokal[key];
        const v = this._lokal[key] ? this._lokal[key].v : faktisk;
        const min = Number(s.attributes.min ?? 0);
        const maks = Number(s.attributes.max ?? 100);
        /* Leser verdien på trykket, ikke fra forrige tegning: to trykk før Lit har
           tegnet på nytt skal gi to steg. */
        const naa = () => (this._lokal[key] ? this._lokal[key].v : Number(this.hass.states[s.entity_id].state));
        const sett = (retning) => {
          const fra = naa();
          const ny = Math.max(min, Math.min(maks, +(fra + retning * steg).toFixed(4)));
          if (ny === fra) return;
          this._lokal[key] = { v: ny, t: Date.now() };
          this._haptikk("selection");
          this._sett(key, ny);
          this.requestUpdate();
        };
        return html`
          <div class="steg">
            <span class="steg-tekst">${tekst}</span>
            <div class="steg-styr">
              <button aria-label="Mindre" ?disabled=${v <= min} @click=${() => sett(-1)}>
                <ha-icon icon="mdi:minus"></ha-icon></button>
              <span class="steg-verdi" @click=${() => this._mer(key)}>${nf(v, des)}${suffiks}</span>
              <button aria-label="Mer" ?disabled=${v >= maks} @click=${() => sett(1)}>
                <ha-icon icon="mdi:plus"></ha-icon></button>
            </div>
          </div>`;
      }

      /* Temperatur: ringen viser hvor nær målet vannet er, ti grader under er tom. */
      _temperaturPanel() {
        const vann = this._vannTemp();
        const mal = this._malTemp();
        const onsket = this.val("onsketTemp");
        const borte = this._borte();
        const pst = vann != null && mal != null ? Math.max(3, Math.min(100, 100 - (mal - vann) * 10)) : 0;
        const nadd = vann != null && mal != null && vann >= mal - 0.2;
        const ute = this.attr("varmetap", "utetemperatur");
        const tap = this.val("varmetap");
        const solW = this.attr("varmetap", "solgevinst_w");
        const under = vann == null || mal == null ? ""
          : nadd ? "Vannet er på målet"
          : `${nf(mal - vann, 1)}° under målet`;
        return this._panel("mdi:pool-thermometer", "var(--kib-orange)", "Temperatur", under, html`
          <div class="ringrad">
            ${this._ring(pst, nadd ? "var(--kib-green)" : "var(--kib-orange)",
              `${nf(vann, 1)}°`, mal != null ? `mål ${nf(mal, 1)}°` : "", () => this._mer("maltemp"))}
            <div class="statliste">
              ${this._stat("mdi:thermometer", "Ute", nf(ute, 1), "°", () => this._mer("varmetap"))}
              ${this._stat("mdi:waves-arrow-up", "Varmetap nå", nf(tap, 0), " W", () => this._mer("varmetap"))}
              ${this._stat("mdi:weather-sunny", "Sol inn", nf(solW, 0), " W", () => this._mer("sol"))}
            </div>
          </div>
          ${this._stepperStor("onsketTemp", "Ønsket temperatur", 0.5, 1, "°")}
          ${borte ? html`<div class="tips"><ha-icon icon="mdi:home-export-outline"></ha-icon>
            Ingen er hjemme – målet er senket ${nf(this.val("borteSenking", 0), 1)}° fra ${nf(onsket, 1)}°.</div>` : ""}
          ${this.st("styrSettpunkt") && !this.on("styrSettpunkt") ? html`<div class="tips">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            Styr settpunkt er av – varmepumpas eget settpunkt gjelder.</div>` : ""}
          ${this._config.graf !== false ? html`<div class="skille"></div>${this._graf()}` : ""}
        `, this._config.graf !== false ? this._vinduvelger() : "", () => this._mer("maltemp"));
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

      _senkingPanel() {
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

        return this._panel("mdi:weather-night", farge, "Nattsenking",
          tilstand === "aktiv" ? `Står av til ${a.til || "–"}`
            : tilstand === "planlagt" ? `Av ${vindu} i natt`
            : tilstand === "lonner_seg_ikke" ? "Holder varmen i natt" : "Slått av",
          html`
            ${tilstand !== "av" ? this._nattlinje(a.fra, a.til, tilstand === "aktiv") : ""}
            ${a.spart_kwh ? html`
              <div class="spar">
                <div><b>${nf(a.spart_kwh, 1)}</b><small>kWh spart</small></div>
                <div><b>${nf(a.spart_kostnad, 2)}</b><small>${valuta} spart</small></div>
                ${a.laveste_temperatur != null ? html`<div><b>${nf(a.laveste_temperatur, 1)}°</b><small>laveste</small></div>` : ""}
              </div>` : ""}
            ${this._apne.senking ? html`
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
            <button class="detaljer" @click=${() => this._apneLukk("senking")}>
              ${this._apne.senking ? "Færre detaljer" : "Detaljer og innstillinger"}
              <ha-icon icon="mdi:chevron-${this._apne.senking ? "up" : "down"}"></ha-icon>
            </button>`,
          chip, () => this._mer("senking"));
      }

      /* Pooltaket: én stor bryter med bassenget tegnet, og hva taket betyr for tapet nå. */
      _pooltakPanel() {
        if (!this.st("pooltak")) return "";
        const pa = this._taket();
        const tap = Number(this.val("varmetap"));
        const uA = Number(this.val("uApen", 15)), uT = Number(this.val("uTak", 5));
        let effekt = "";
        if (isFinite(tap) && tap > 0 && uA > 0 && uT > 0) {
          effekt = pa
            ? `Taket sparer ca. ${nf(tap * (uA / uT - 1), 0)} W nå`
            : `Med tak ville tapet vært ca. ${nf(tap * (uT / uA), 0)} W`;
        }
        const sensor = this._takSensor();
        return html`
          <button class="takflis ${pa ? "pa" : ""}"
            @pointerdown=${(e) => this._holdNed(e, "pooltak")} @pointerup=${() => this._holdOpp()}
            @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
            @contextmenu=${(e) => e.preventDefault()}
            @click=${this._holdKlikk(() => (sensor ? this._merId(sensor) : this._veksle("pooltak")))}>
            <svg class="takbilde" viewBox="0 0 120 64" aria-hidden="true">
              <rect x="6" y="22" width="108" height="36" rx="8" class="tb-kant"></rect>
              <rect x="12" y="28" width="96" height="24" rx="5" class="tb-vann"></rect>
              <path class="tb-bolge" d="M12 34 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"></path>
              <g class="tb-tak">
                <rect x="4" y="20" width="112" height="12" rx="6"></rect>
                <path d="M16 26 H104" class="tb-som"></path>
              </g>
            </svg>
            <span class="taktekst">
              <b>${pa ? "Pooltaket er lukket" : "Pooltaket er åpent"}</b>
              <span>${effekt || (pa ? "Mindre varmetap, mindre sol" : "Trykk når du legger på taket")}${sensor ? " · fra sensoren" : ""}</span>
            </span>
            ${sensor ? html`<ha-icon class="taksensor" icon="mdi:door-sliding${pa ? "" : "-open"}"></ha-icon>`
              : html`<span class="knott ${pa ? "paa" : ""}"></span>`}
          </button>`;
      }

      /* Klortabletter: én linje med status. Et trykk folder ut «hvem la i» og
         kalenderen rett i kortet. */
      _klorPanel() {
        if (!this.st("sisteKlor") && !this.st("loggKlor")) return "";
        const siste = this.val("sisteKlor");
        const dager = Number(this.attr("sisteKlor", "dager_siden"));
        const intervall = Number(this.attr("nesteKlor", "intervall_dager", this.val("klorIntervall", 7))) || 7;
        const forfall = this.on("klorForfall");
        const neste = this.val("nesteKlor");
        const pst = siste && isFinite(dager) ? Math.min(100, (dager / intervall) * 100) : 100;
        const farge = forfall ? "var(--kib-orange)" : "var(--kib-green)";
        const sisteRad = (this.attr("sisteKlor", "historikk", []) || [])[0];
        return html`
          <section class="panel klorkort">
            <button class="klorlinje" @click=${() => this._apneKlor("varme")}>
              ${this._ring(pst, farge, siste ? nf(dager, dager < 10 ? 1 : 0) : "–", "dager", null, true)}
              <span class="klortekst">
                <b>${!siste ? "Ingen klor logget" : forfall ? "På tide med klortablett" : `Neste ${this._dato(neste)}`}</b>
                <span>${siste ? `Sist ${this._dato(siste)}${sisteRad && sisteRad.hvem ? ` · ${sisteRad.hvem}` : ""}` : "Trykk for å logge"}</span>
              </span>
              <span class="klorknapp ${forfall ? "varsle" : ""}">
                <ha-icon icon="mdi:${this._klorApen === "varme" ? "chevron-up" : "plus"}"></ha-icon>${this._klorApen === "varme" ? "Lukk" : "Logg"}</span>
            </button>
            ${this._klorApen === "varme" ? html`
              ${this._klorLogger("varme")}
              ${this._klorKalender(neste, true)}` : ""}
          </section>`;
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
        const idag = new Date();
        const nokkel = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        let dag = null;
        if (hvor === "varme" && this._kalValgt && this._kalValgt !== nokkel(idag)) {
          const [a, m, d] = this._kalValgt.split("-").map(Number);
          dag = new Date(a, m, d, 12, 0, 0);
        }
        const logg = (hvem) => {
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
            // Fra Oversikt lukkes feltet når det er gjort; på Varme blir kalenderen stående
            if (hvor === "oversikt") this._klorApen = null;
            this.requestUpdate();
          }, 1800);
        };
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
            ${!navn.length ? html`<div class="dempet">Legg til navn under tannhjulet → Klorlogg, så kan du trykke på den som la i.</div>` : ""}
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
        if (!pa) {
          return html`
            <button class="takflis vinterav" @click=${() => this._veksle("vintermodus")}>
              <span class="vinterik"><ha-icon icon="mdi:snowflake"></ha-icon></span>
              <span class="taktekst"><b>Vintermodus</b><span>Frostsikring av bassenghuset når sesongen er over</span></span>
              <span class="knott"></span>
            </button>`;
        }
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

      /* Valgt navn huskes per nettleser, så den som bruker dashbordet sitt slipper å
         velge seg selv hver gang. */
      _settKlorHvem(n) {
        this._klorHvem = n;
        try { if (n) localStorage.setItem("kib-klor-hvem", n); else localStorage.removeItem("kib-klor-hvem"); } catch (e) { /* privat modus */ }
        this.requestUpdate();
      }

      _loggKlor(hvem) {
        this._haptikk("success");
        if (hvem) {
          this.hass.callService("ki_basseng", "logg_klortablett", { antall: 1, hvem });
        } else {
          this._trykk("loggKlor");
        }
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
      _klorNavnPanel() {
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
        return this._panel("mdi:account-multiple-check", "var(--kib-green)", "Klorlogg",
          navn.length ? `${navn.length} ${navn.length === 1 ? "person" : "personer"} kan hukes av` : "Legg til hvem som legger i klor", html`
          ${navn.length ? html`<div class="navneliste">
            ${navn.map((n) => html`<span class="navnechip">${n}
              <button aria-label="Fjern ${n}" @click=${() => lagre(navn.filter((x) => x !== n))}>
                <ha-icon icon="mdi:close"></ha-icon></button></span>`)}
          </div>` : ""}
          <form class="navn-ny" @submit=${leggTil}>
            <input class="navn-felt" type="text" placeholder="Navn, f.eks. Sebastian" maxlength="40" autocomplete="off">
            <button type="submit"><ha-icon icon="mdi:plus"></ha-icon>Legg til</button>
          </form>`);
      }

      /* Til Varme-fanen, eller åpne Varme-seksjonen når kortet står uten faner. Er
         fanen valgt bort i `faner:`, åpnes nattsenkingen som mer-info i stedet. */
      _tilVarme() {
        this._haptikk("selection");
        if (this._config.faner === false) {
          this._apne = { ...this._apne, varme: true };
        } else if (this._faneListe().some((f) => f.id === "varme")) {
          this._fane = "varme";
        } else {
          this._mer("senking");
        }
      }

      _varmeFane() {
        if (this.on("vintermodus")) {
          return html`
            ${this._vinterPanel()}
            ${this._klorPanel()}
            ${this._pooltakPanel()}
          `;
        }
        return html`
          ${this._temperaturPanel()}
          ${this._klorPanel()}
          ${this._pooltakPanel()}
          ${this._senkingPanel()}
          ${this._vinterPanel()}
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
        if (this.on("klorForfall")) {
          const d = Number(this.attr("sisteKlor", "dager_siden"));
          ut.push(html`<button class="banner klor" @click=${() => this._apneKlor()}>
            <span class="bik"><ha-icon icon="mdi:pill"></ha-icon></span>
            <span><b>På tide med klortablett</b>${isFinite(d) ? html`<small>${nf(d, 0)} dager siden sist</small>` : html`<small>Ingen logget ennå</small>`}</span>
            <span class="bknapp" @click=${(e) => { e.stopPropagation(); this._apneKlor(); }}>Logg</span>
          </button>`);
        }
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

      _hero() {
        const modus = this.val("modus", "hvile");
        const [tekst, farge, ikon] = MODUS[modus] || [modus, "var(--kib-muted)", "mdi:pump"];
        const gjort = this.val("omsetninger", 0) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const andel = Math.max(0, Math.min(1, gjort / mal));
        const gar = this.on("skalGa") || ["filtrering", "oppvarming", "boost", "solvarme"].includes(modus);
        const temp = this._harVarme() ? this._vannTemp() : this.val("vanntemp");
        const maltemp = this._malTemp();
        const tak = this.st("pooltak") ? this._taket() : false;
        const natt = this.val("senking") === "aktiv";
        const borte = this._borte();
        const begrunnelse = this.attr("modus", "begrunnelse", "");
        /* To animasjoner som betyr to forskjellige ting, og de kan skje samtidig:
           sirkulasjon er vann som beveger seg, oppvarming er varme som stiger.
           Før var det én bølge for begge, så du kunne ikke se hva som faktisk skjedde. */
        const sirkulerer = gar;
        /* «Varmer» avgjøres av effekten varmepumpa faktisk trekker, ikke av en
           bryter: pumpa kan stå i heat uten å kjøre. Over 100 W regnes som i gang. */
        const varmer = ["oppvarming", "boost"].includes(modus)
          || Number(this.val("vpEffekt", 0)) > 100;

        return html`
          <div class="hero ${gar ? "gar" : ""} ${tak ? "tak" : ""} ${natt ? "natt" : ""} ${this.on("vintermodus") ? "vinter" : ""}" @click=${() => this._mer("modus")}>
            <div class="vann" style="height:${Math.round(andel * 100)}%">
              <div class="bolge"></div>
              <div class="bolge b2"></div>
              ${sirkulerer ? html`<div class="strom">${
                [0, 1, 2, 3, 4, 5].map((i) => html`<i style="--i:${i}"></i>`)}</div>` : ""}
              ${varmer ? html`<div class="bobler">${
                [0, 1, 2, 3, 4, 5, 6, 7].map((i) => html`<i style="--i:${i}"></i>`)}</div>` : ""}
            </div>
            ${varmer ? html`<div class="varmedis">${
              [0, 1, 2, 3].map((i) => html`<i style="--i:${i}"></i>`)}</div>` : ""}
            ${tak ? html`<div class="lokk"></div>` : ""}
            <div class="hero-innhold">
              <div class="hero-topp">
                <div>
                  <div class="temp" @click=${(e) => { e.stopPropagation(); this._mer("vanntemp"); }}>
                    ${nf(temp, 1)}<span>°C</span>
                  </div>
                  ${maltemp != null && !this.on("vintermodus")
                    ? html`<div class="maltemp">mål ${nf(maltemp, maltemp % 1 ? 1 : 0)} °C${borte ? " · borte" : ""}</div>`
                    : ""}
                </div>
                <div class="merker">
                  <div class="merke" style="--merke:${farge}">
                    <ha-icon icon="${ikon}"></ha-icon>${tekst}
                  </div>
                  ${natt ? html`<div class="merke liten" style="--merke:var(--kib-purple)">
                    <ha-icon icon="mdi:weather-night"></ha-icon>til ${this.attr("senking", "til", "")}</div>` : ""}
                  ${tak ? html`<div class="merke liten" style="--merke:var(--kib-muted)">
                    <ha-icon icon="mdi:pool"></ha-icon>tak på</div>` : ""}
                </div>
              </div>
              <div class="hero-bunn">
                <div class="begrunnelse">${begrunnelse}</div>
                <div class="omsetning">
                  <span class="omsetning-tall">${nf(gjort, 2)}</span>
                  <span class="omsetning-tekst">av ${nf(mal, 2)} omsetninger</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      _plan() {
        const timer = this.attr("modus", "plan_i_dag", []) || [];
        const na = new Date();
        const naPst = ((na.getHours() * 60 + na.getMinutes()) / 1440) * 100;
        const gar = this.on("skalGa");
        return html`
          <div class="plan">
            <div class="spor">
              ${blokker(timer).map(
                ([fra, til]) => html`
                  <div
                    class="segment ${fra <= na.getHours() && na.getHours() < til ? "na" : ""}"
                    style="left:${(fra / 24) * 100}%;width:${((til - fra) / 24) * 100}%"
                  ></div>
                `
              )}
              <div class="na-strek ${gar ? "gar" : ""}" style="left:${naPst}%"></div>
            </div>
            <div class="skala">
              <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
            </div>
          </div>
        `;
      }

      _knapper() {
        const sprederGar = this.on("spreder");
        const igjen = Math.ceil(this.val("spredertid", 0) || 0);
        const maltemp = this._malTemp();
        const pumpeGar = this.on("skalGa");
        const fliser = [];

        if (this.st("tvingVarme")) {
          const tvang = this.on("tvingVarme");
          fliser.push(this._flis(tvang ? "mdi:fire" : "mdi:fire-off", "Varm nå",
            tvang ? "til målet" : maltemp != null ? `mot ${nf(maltemp, 0)}°` : "av",
            tvang, () => this._veksle("tvingVarme"), "var(--kib-orange)", "tvingVarme"));
        }
        if (this.st("pooltak")) {
          const tak = this._taket();
          const sensor = this._takSensor();
          fliser.push(this._flis(tak ? "mdi:pool" : "mdi:waves", "Pooltak",
            `${tak ? "lukket" : "åpent"}${sensor ? " · sensor" : ""}`,
            tak, () => (sensor ? this._merId(sensor) : this._veksle("pooltak")), null, "pooltak"));
        }
        const vinter = this.on("vintermodus");
        if (this.st("vintermodus")) {
          const varmer = this.on("frostVarme");
          const hus = this.attr("frostVarme", "bassenghus", this.attr("frostVarme", "temperatur"));
          fliser.push(this._flis(vinter ? "mdi:snowflake" : "mdi:snowflake-off", "Vinter",
            vinter ? (varmer ? "elementene varmer" : hus != null ? `${nf(hus, 1)}° i huset` : "på") : "av",
            vinter, () => this._veksle("vintermodus"), "var(--kib-blue)", "vintermodus"));
        }
        if (this.st("senking") && !vinter) {
          const t = this.val("senking");
          const vindu = this.attr("senking", "fra") ? `${this.attr("senking", "fra")}–${this.attr("senking", "til")}` : "";
          const tekst = t === "aktiv" ? `av til ${this.attr("senking", "til")}`
            : t === "planlagt" ? vindu : t === "lonner_seg_ikke" ? "lønner seg ikke" : "av";
          fliser.push(this._flis("mdi:weather-night", "Nattsenking", tekst, t === "aktiv",
            () => { this._tilVarme(); }, "var(--kib-purple)", "senking"));
        }
        if (this.st("loggKlor")) {
          const forfall = this.on("klorForfall");
          const d = Number(this.attr("sisteKlor", "dager_siden"));
          fliser.push(this._flis("mdi:pill", "Klor",
            forfall ? "på tide" : isFinite(d) ? `${nf(d, 0)} d siden` : "logg",
            forfall, () => this._apneKlor(), "var(--kib-orange)", "sisteKlor"));
        }
        fliser.push(this._flis("mdi:fan-plus", "Boost", pumpeGar ? "pumpen går" : "30 min",
          false, () => this._trykk("boost"), null, "boost"));
        fliser.push(this._flis(sprederGar ? "mdi:sprinkler-variant" : "mdi:sprinkler", "Spreder",
          sprederGar ? `${igjen} min igjen` : "start", sprederGar,
          () => this._trykk(sprederGar ? "stoppSpreder" : "startSpreder"), "var(--kib-blue)", "spreder"));
        fliser.push(this._flis("mdi:robot-outline", "Automatikk", this.on("auto") ? "på" : "av",
          this.on("auto"), () => this._veksle("auto"), null, "auto"));
        /* Uten varmemodellen (KI Basseng 1.2) er det plass til de to gamle bryterne. */
        if (!this._harVarme()) {
          fliser.push(this._flis("mdi:cash-clock", "Prisstyring", this.on("pris") ? "på" : "av",
            this.on("pris"), () => this._veksle("pris"), null, "pris"));
          fliser.push(this._flis("mdi:heat-wave", "Varmeprioritet", this.on("varme") ? "på" : "av",
            this.on("varme"), () => this._veksle("varme"), null, "varme"));
        }
        /* Et oddetall fliser gir et hull nederst til høyre; den siste strekkes da. */
        return html`<div class="fliser ${fliser.length % 2 ? "odde" : ""}">${fliser}</div>`;
      }

      _tallrad() {
        const valuta = this.enhet("kostnad");
        const effekt = (this.val("pumpeEffekt", 0) || 0) + (this.val("vpEffekt", 0) || 0);
        const spart = this.val("spart", 0) || 0;
        /* Tre tall som hører sammen — hvor mye pumpa har gått, hva den trekker nå, og
           hva automatikken har spart — ligger på ÉN flate med hårfine skiller mellom.
           Tre løse bokser leste som tre uavhengige ting; dette er ett regnskap for
           dagen.
           Sparingen er den interessante av de tre, så den får grønn verdi. */
        return html`
          <div class="idag">
            <button class="idagcelle" @click=${() => this._mer("pumpetid")}>
              <ha-icon icon="mdi:timer-outline"></ha-icon>
              <span class="idagn">Pumpet i dag</span>
              <span class="idagv">${nf(this.val("pumpetid", 0), 1)}<small>t</small></span>
            </button>
            <button class="idagcelle" @click=${() => this._mer("pumpeEffekt")}>
              <ha-icon icon="mdi:flash"></ha-icon>
              <span class="idagn">Effekt nå</span>
              <span class="idagv">${nf(effekt, 0)}<small>W</small></span>
            </button>
            <button class="idagcelle ${this._apne.spart ? "apen" : ""}"
              @pointerdown=${(e) => this._holdNed(e, "spart")} @pointerup=${() => this._holdOpp()}
              @pointerleave=${() => this._holdOpp()} @pointercancel=${() => this._holdOpp()}
              @contextmenu=${(e) => e.preventDefault()}
              @click=${this._holdKlikk(() => { this._haptikk("selection"); this._apneLukk("spart"); })}>
              <ha-icon icon="mdi:piggy-bank-outline"></ha-icon>
              <span class="idagn">Spart i dag <ha-icon class="idagpil" icon="mdi:chevron-${this._apne.spart ? "up" : "down"}"></ha-icon></span>
              <span class="idagv ${spart > 0 ? "gron" : ""}">${
                nf(spart, 0)}<small>${valuta}</small></span>
            </button>
          </div>
        `;
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

      /* Full-bredde rad med rundt ikonfelt til venstre — samme form som bannerne og
       * sensorkortene i dashbordet.
       *
       * Forrige utgave brukte små rutefliser, fire per rad. Det var lånt fra
       * serverpopupen og passer ikke her: bassengkortet er bygget av brede flater med
       * ikonfelt, og småfliser bryter det språket.
       */
      _infoRad(ikon, navn, verdi, enhet, pst) {
        return html`
          <div class="irad">
            <span class="iik"><ha-icon icon="${ikon}"></ha-icon></span>
            <span class="inavn">${navn}</span>
            <span class="iverdi">${verdi}${enhet ? html`<small>${enhet}</small>` : ""}</span>
            ${pst === undefined ? "" : html`<span class="ispor">
              <i style="width:${Math.max(0, Math.min(100, pst)).toFixed(1)}%"></i></span>`}
          </div>
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
        return html`
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
          ${this._klorNavnPanel()}

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
        const modus = this.val("modus", "hvile");
        const pagar = ["filtrering", "oppvarming", "boost", "solvarme"].includes(modus);
        const neste = klokke(this.val("nesteStart"));
        const planlagt = this.attr("modus", "timer_planlagt", 0);

        /* Bare heroen: samme vannflate som øverst i Oversikt, som eget kort. Ingen
           status, knapper eller faner – de ligger i popupen bak trykket. */
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
            ${this._config.tittel ? html`<div class="tittel">${this._config.tittel}</div>` : ""}
            ${this._varmestatus()}
            ${this._hurtig()}
            ${medFaner && faneListe.length > 1 ? this._faner(faneListe, aktiv) : ""}
            <div class="innhold">
              ${vis("oversikt") ? html`
              ${this._varsler()}
              ${this._config.hero === false ? "" : this._hero()}
              ${this._plan()}
              <div class="plan-tekst">
                <span>
                  ${pagar ? "Pumpen går nå" : neste ? `Neste start ${neste}` : "Ingen start planlagt"}
                </span>
                <span>${planlagt} t i planen</span>
              </div>
              ${this._knapper()}
              ${this._klorApen === "oversikt" ? html`<section class="panel klorfelt">${this._klorLogger("oversikt")}</section>` : ""}
              ${this._tallrad()}
              ${this._apne.spart ? this._sparPanel() : ""}
              ${this._config.graf !== false && !this._harVarme()
                ? this._panel("mdi:chart-bell-curve-cumulative", "var(--kib-orange)", "Vanntemperatur", "",
                    this._graf(), this._vinduvelger(), () => this._mer("vanntemp"))
                : ""}
              ${this.on("overstyrt")
                ? html`<div class="varsel">Manuell overstyring – automatikken venter.</div>`
                : ""}
              ${this.on("vpVenter")
                ? html`<div class="varsel">Varmepumpen står av til sirkulasjonen er tilbake.</div>`
                : ""}
              ` : ""}
              ${medFaner
                ? html`
                    ${vis("varme") ? html`<div class="faneinnhold">${this._varmeFane()}</div>` : ""}
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

          /* Hero */
          .hero {
            position: relative;
            min-height: 172px;
            border-radius: 24px;
            background: var(--kib-surface);
            overflow: hidden;
            cursor: pointer;
          }
          .vann {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(74, 157, 248, 0.42), rgba(74, 157, 248, 0.68));
            transition: height 0.8s ease;
          }
          .bolge {
            position: absolute;
            left: 0;
            top: -10px;
            width: 200%;
            height: 12px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 12' preserveAspectRatio='none'%3E%3Cpath d='M0 12V6C15 6 15 0 30 0S45 6 60 6 75 0 90 0s15 6 30 6v6z' fill='rgba(74,157,248,0.45)'/%3E%3C/svg%3E")
              repeat-x;
            background-size: 120px 12px;
          }
          .hero.gar .bolge {
            animation: bolge 6s linear infinite;
          }
          /* Andre bølge, tregere og motsatt vei — én bølge alene ser mekanisk ut */
          .bolge.b2 {
            top: -7px;
            opacity: 0.5;
            background-size: 90px 12px;
          }
          .hero.gar .bolge.b2 {
            animation: bolge 9s linear infinite reverse;
          }
          @keyframes bolge {
            to {
              transform: translateX(-120px);
            }
          }

          /* Sirkulasjon: strømmer som drar sidelengs gjennom vannet */
          .strom {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
          }
          .strom i {
            position: absolute;
            left: -12%;
            top: calc(18% + var(--i) * 14%);
            width: 26%;
            height: 2px;
            border-radius: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            animation: strom 3.4s linear infinite;
            animation-delay: calc(var(--i) * -0.55s);
          }
          @keyframes strom {
            to {
              transform: translateX(480%);
            }
          }

          /* Oppvarming: bobler opp gjennom vannet, og varmedis over flaten */
          .bobler {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
          }
          .bobler i {
            position: absolute;
            bottom: -6px;
            left: calc(8% + var(--i) * 11%);
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.45);
            animation: boble 4.2s ease-in infinite;
            animation-delay: calc(var(--i) * -0.5s);
          }
          @keyframes boble {
            0% { transform: translateY(0) scale(0.6); opacity: 0; }
            15% { opacity: 0.8; }
            85% { opacity: 0.5; }
            100% { transform: translateY(-120px) scale(1.15); opacity: 0; }
          }
          .varmedis {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }
          .varmedis i {
            position: absolute;
            bottom: 34%;
            left: calc(16% + var(--i) * 22%);
            width: 2px;
            height: 26px;
            border-radius: 2px;
            background: linear-gradient(0deg, rgba(255, 176, 92, 0.55), transparent);
            filter: blur(1px);
            animation: dis 3.6s ease-in-out infinite;
            animation-delay: calc(var(--i) * -0.9s);
          }
          @keyframes dis {
            0% { transform: translateY(0) scaleX(1); opacity: 0; }
            25% { opacity: 0.75; }
            100% { transform: translateY(-38px) scaleX(1.8); opacity: 0; }
          }
          .hero-innhold {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 172px;
            padding: 18px 20px 16px;
            box-sizing: border-box;
          }
          .hero-topp {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }
          .temp {
            font-size: 46px;
            font-weight: 300;
            line-height: 1;
            letter-spacing: -1px;
          }
          .temp span {
            font-size: 18px;
            font-weight: 400;
            opacity: 0.6;
            margin-left: 2px;
          }
          .maltemp {
            padding-top: 4px;
            font-size: 12px;
            opacity: 0.7;
          }
          .merke {
            flex: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px 5px 9px;
            border-radius: 999px;
            background: var(--merke);
            color: var(--kib-sort);
            font-size: 13px;
            font-weight: 600;
          }
          .merke ha-icon {
            --mdc-icon-size: 16px;
          }
          .hero-bunn {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
          }
          .begrunnelse {
            font-size: 12px;
            line-height: 1.4;
            opacity: 0.75;
            max-width: 58%;
          }
          .omsetning {
            text-align: right;
            white-space: nowrap;
          }
          .omsetning-tall {
            display: block;
            font-size: 24px;
            font-weight: 600;
            line-height: 1;
          }
          .omsetning-tekst {
            font-size: 11px;
            opacity: 0.7;
          }

          /* Døgnplan */
          .plan {
            padding: 14px 16px 10px;
            border-radius: 18px;
            background: var(--kib-surface);
          }
          .spor {
            position: relative;
            height: 14px;
            border-radius: 7px;
            background: var(--kib-inner);
          }
          .segment {
            position: absolute;
            top: 0;
            bottom: 0;
            border-radius: 7px;
            background: var(--kib-blue);
            opacity: 0.55;
          }
          .segment.na {
            opacity: 1;
          }
          .na-strek {
            position: absolute;
            top: -5px;
            bottom: -5px;
            width: 2px;
            margin-left: -1px;
            background: var(--kib-text);
            border-radius: 1px;
          }
          .na-strek.gar {
            background: var(--kib-accent);
            box-shadow: 0 0 0 3px rgba(77, 208, 122, 0.3);
          }
          .skala {
            display: flex;
            justify-content: space-between;
            padding-top: 6px;
            font-size: 11px;
            color: var(--kib-muted);
          }
          .plan-tekst {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            padding: 0 6px;
            font-size: 12px;
            color: var(--kib-muted);
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

          /* Knappefliser: liggende, to i bredden, som template_toggle_card_small */
          .fliser {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .flis {
            display: grid;
            grid-template-columns: 46px minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            padding: 10px 12px 10px 10px;
            min-height: 66px;
            border-radius: 24px;
            background: var(--kib-surface);
            color: var(--kib-text);
            text-align: left;
            min-width: 0;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: background 0.25s ease, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1);
          }
          .flis:active { transform: scale(0.97); }
          .flis-ikon {
            display: grid;
            place-items: center;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: rgba(250, 251, 252, 0.1);
            border: 1px solid rgba(250, 251, 252, 0.1);
          }
          .flis-ikon ha-icon { --mdc-icon-size: 24px; color: var(--kib-text); }
          .flis-tekstblokk { display: grid; gap: 1px; min-width: 0; }
          .flis-navn { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .flis-tekst { font-size: 13px; font-weight: 500; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .flis.aktiv { background: var(--kib-accent); color: var(--kib-sort); }
          .flis.aktiv .flis-ikon { background: rgba(0, 0, 0, 0.1); border-color: rgba(0, 0, 0, 0.08); }
          .flis.aktiv .flis-ikon ha-icon { color: var(--kib-sort); }
          .flis.aktiv .flis-tekst { opacity: 0.75; }

          /* --- dagens regnskap: én flate, tre celler, hårfine skiller --- */
          .idag {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            border-radius: 22px;
            background: var(--kib-surface);
            overflow: hidden;
          }
          .idagcelle {
            position: relative;
            border: 0;
            background: none;
            color: inherit;
            font: inherit;
            cursor: pointer;
            padding: 14px 10px 13px;
            display: grid;
            justify-items: center;
            gap: 3px;
            min-width: 0;
          }
          /* Skillet er en 1 px linje mellom cellene, ikke mellomrom mellom bokser */
          .idagcelle + .idagcelle::before {
            content: "";
            position: absolute;
            left: 0;
            top: 14px;
            bottom: 14px;
            width: 1px;
            background: rgba(128, 128, 128, 0.22);
          }
          .idagcelle ha-icon {
            --mdc-icon-size: 20px;
            color: var(--kib-text);
            opacity: 0.8;
          }
          .idagn {
            font-size: 12px;
            font-weight: 500;
            opacity: 0.7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .idagv {
            font-size: 24px;
            font-weight: 300;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            line-height: 1.15;
          }
          .idagv small { font-size: 12px; font-weight: 500; opacity: 0.7; margin-left: 2px; }
          .idagv.gron { color: var(--kib-green, #5ad18b); }

          /* Klassene tall, tall-verdi og tall-tekst er fjernet — de hørte til de tre
             løse boksene som idag-flaten erstattet, og ingen mal viste til dem lenger.
             MERK: ingen backticks i denne kommentaren. Den står inne i en
             css-template-streng, og en backtick her lukker strengen midt i. */

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

          @media (max-width: 380px) {
            .fliser {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .spredscene.gar .sp-hode,
            .spredscene.gar .sp-gruppe,
            .sp-drape,
            .stripe.aktiv .blokk,
            .strom i,
            .bobler i,
            .varmedis i,
            .hero.gar .bolge {
              animation: none;
            }
            .vann,
            .knott,
            .knott::after,
            .pil {
              transition: none;
            }
          }

          /* --- 2.0: varme, nattsenking, pooltak og klor ------------------ */
          .merker { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
          .merke.liten { padding: 3px 10px 3px 8px; font-size: 12px; font-weight: 500; }
          .merke.liten ha-icon { --mdc-icon-size: 14px; }
          /* Pooltaket som et lokk over vannflaten: stripete, litt gjennomskinnelig */
          .lokk {
            position: absolute; left: 0; right: 0; bottom: 0; height: 100%;
            background: repeating-linear-gradient(90deg, rgba(120, 140, 160, 0.34) 0 22px, rgba(150, 170, 190, 0.26) 22px 44px);
            border-top: 3px solid rgba(190, 205, 220, 0.55);
            pointer-events: none;
          }
          .hero.tak .bolge { animation-duration: 14s; opacity: 0.35; }
          .hero.natt::before {
            content: ""; position: absolute; inset: 0; pointer-events: none;
            background: radial-gradient(60% 80% at 85% 0%, rgba(167, 139, 250, 0.22), transparent 70%);
          }

          .steg { display: flex; align-items: center; justify-content: space-between; gap: 12px;
            padding: 6px 4px 2px; }
          .steg-tekst { font-size: 14px; font-weight: 500; }
          .steg-styr { display: flex; align-items: center; gap: 6px; background: var(--kib-inner);
            border-radius: 999px; padding: 4px; }
          .steg-styr button { width: 40px; height: 40px; border-radius: 50%; background: var(--kib-surface);
            color: var(--kib-text); display: grid; place-items: center; cursor: pointer;
            transition: transform 0.12s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .steg-styr button:active { transform: scale(0.9); }
          .steg-styr button[disabled] { opacity: 0.35; cursor: default; }
          .steg-styr ha-icon { --mdc-icon-size: 20px; }
          .steg-verdi { min-width: 64px; text-align: center; font-size: 22px; font-weight: 300;
            font-variant-numeric: tabular-nums; cursor: pointer; }

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

          .takflis { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 12px; align-items: center;
            width: 100%; margin-top: 10px; padding: 12px 16px 12px 12px; border-radius: 24px; box-sizing: border-box;
            background: var(--kib-surface); color: var(--kib-text); text-align: left; cursor: pointer;
            transition: background 0.25s ease, transform 0.14s cubic-bezier(0.2, 1.3, 0.3, 1); }
          .takflis:active { transform: scale(0.98); }
          .takflis.pa { background: var(--kib-accent); color: var(--kib-sort); }
          .takbilde { width: 96px; height: 52px; overflow: visible; }
          .tb-kant { fill: rgba(250, 251, 252, 0.1); }
          .tb-vann { fill: var(--kib-blue); opacity: 0.75; }
          .tb-bolge { fill: none; stroke: rgba(255, 255, 255, 0.6); stroke-width: 1.5;
            animation: tb-bolge 3s ease-in-out infinite; }
          @keyframes tb-bolge { 50% { transform: translateX(-4px); } }
          .tb-tak { transform: translateY(-16px); opacity: 0;
            transition: transform 0.5s cubic-bezier(0.3, 1.3, 0.5, 1), opacity 0.3s; }
          .tb-tak rect { fill: rgba(0, 0, 0, 0.55); }
          .tb-som { stroke: rgba(255, 255, 255, 0.35); stroke-width: 1.2; stroke-dasharray: 3 4; }
          .takflis.pa .tb-tak { transform: translateY(8px); opacity: 1; }
          .takflis.pa .tb-kant { fill: rgba(0, 0, 0, 0.12); }
          .taktekst { display: grid; gap: 2px; min-width: 0; }
          .taktekst b { font-size: 15px; font-weight: 500; }
          .taktekst span { font-size: 13px; font-weight: 500; opacity: 0.7; }
          .takflis.pa .knott { background: rgba(0, 0, 0, 0.18); }

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
          .banner.klor { background: var(--kib-orange); }
          .banner.natt-b { background: var(--kib-purple); grid-template-columns: 58px minmax(0, 1fr); }
          .bik { width: 58px; height: 58px; border-radius: 50%; background: rgba(0, 0, 0, 0.1);
            display: grid; place-items: center; }
          .bik ha-icon { --mdc-icon-size: 28px; }
          .banner b { display: block; font-size: 14px; font-weight: 500; }
          .banner small { display: block; font-size: 13px; opacity: 0.75; }
          .bknapp { padding: 8px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.14);
            font-size: 13px; font-weight: 500; }

          .chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .fliser.odde > :last-child { grid-column: 1 / -1; }
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

          .idagpil { --mdc-icon-size: 14px; vertical-align: -2px; opacity: 0.7; }
          .idagcelle.apen { background: color-mix(in srgb, var(--kib-green) 12%, transparent); }
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

          .klorkort { padding: 10px; }
          .klorlinje { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 12px; align-items: center;
            width: 100%; background: none; color: var(--kib-text); text-align: left; cursor: pointer; padding: 0 4px 0 0; }
          .klortekst { display: grid; gap: 1px; min-width: 0; }
          .klortekst b { font-size: 14.5px; font-weight: 500; }
          .klortekst span { font-size: 12px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .klorknapp { display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px 8px 10px; border-radius: 999px;
            background: var(--kib-inner); font-size: 13.5px; font-weight: 500; }
          .klorknapp ha-icon { --mdc-icon-size: 17px; }
          .klorknapp.varsle { background: var(--kib-orange); color: var(--kib-sort); }

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
          .klorkort .kal { margin-top: 2px; }
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

          .hero.vinter .vann { background: linear-gradient(180deg, rgba(160, 200, 235, 0.35), rgba(120, 160, 200, 0.55)); }
          .vinterik { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; justify-self: center;
            background: color-mix(in srgb, var(--kib-blue) 22%, transparent); color: var(--kib-blue); }
          .takflis.vinterav { grid-template-columns: 52px minmax(0, 1fr) auto; }
          .taksensor { --mdc-icon-size: 22px; opacity: 0.8; }


          @media (prefers-reduced-motion: reduce) {
            .tb-bolge, .natt.aktiv .natt-av { animation: none; }
            .tb-tak, .sspor i { transition: none; }
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

/*!
 * ki-basseng-card 1.2.0 - del av ki-cards
 * Kort for integrasjonen ki_basseng: sirkulasjon, varme og spreder.
 *
 * - Faneskinne øverst (samme pilleform som etasjefanene i ki-hjem-card);
 *   faner: false gir én flyt med utvidbare seksjoner i stedet.
 * - Knappefliser i samme stil som button-card-flisene (gray200 -> active-big).
 * - Tallvalg bruker <select>, så iOS/Android viser sin egen hjulvelger.
 * - Grafer hentes fra HA sin historikk, ikke fra en ekstra sensor.
 * - Tegner bare når bassengets egne entiteter faktisk har endret seg.
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

  const VERSJON = "1.12.0";

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
    };

    const MODUS = {
      filtrering: ["Filtrerer", "var(--kib-blue)", "mdi:pump"],
      oppvarming: ["Varmer opp", "var(--kib-orange)", "mdi:heat-wave"],
      vedlikehold: ["Vedlikehold", "var(--kib-accent)", "mdi:timer-play-outline"],
      boost: ["Boost", "var(--kib-accent)", "mdi:fan-plus"],
      spreder: ["Spreder", "var(--kib-blue)", "mdi:sprinkler"],
      hvile: ["Hviler", "var(--kib-muted)", "mdi:pause"],
      manuell: ["Manuell", "var(--kib-red)", "mdi:hand-back-right-outline"],
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

      on(key) {
        const s = this.st(key);
        return !!s && s.state === "on";
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

      _byttVindu(timer) {
        this._timer = timer;
        this._hentHistorikk(true);
      }

      /* Temperatur og sirkulasjon i samme graf.
       *
       * Konseptet var riktig fra før — bånd for pumpeperiodene bak temperaturkurven —
       * men utførelsen hadde tre feil:
       *
       *  1. Alt lå i ÉN svg med `preserveAspectRatio="none"`. Den strekker innholdet
       *     etter bredden, så aksetallene ble forvrengt og strektykkelsen ujevn. Nå er
       *     det to lag: kurvene i en strukket svg, tekst og punkter i en som ikke
       *     strekkes.
       *  2. Terskelen for «pumpa går» var 10 W. Standby-trekk ligger over det, så det
       *     ble bånd hele døgnet. Nå 40 W, og bånd kortere enn to minutter forkastes —
       *     et blaff er ikke en pumpeperiode.
       *  3. Flaten under temperaturkurven la seg over båndene og gjorde begge grumsete.
       *     Kurven står nå som en rein strek.
       */
      /* Timesøyler i stedet for en kurve.
       *
       * Kurven var feil form for dette. En temperaturkurve over et døgn er nesten flat,
       * og da blir den enten en kjedelig strek eller — med stramt vindu — en dramatisk
       * fjellkjede av målestøy. Ingen av dem sier noe.
       *
       * Én søyle per time sier det kurven ikke kunne: hvor mye vannet steg eller falt
       * DEN timen, og om pumpa gikk mens det skjedde. Søylen går opp fra midtlinja når
       * temperaturen steg, ned når den falt, og det blå merket under viser minuttene
       * pumpa gikk i samme time.
       *
       * Ingen strukket svg, så ingen forvrengt tekst. Ingen levende måling, så ingenting
       * som hopper mens du ser på det.
       */
      /* Vanntemperaturen som en myk kurve over tid, med pumpeperiodene som blå felt bak.
       *
       * Søylene per time (1.10) sa riktig ting – steg eller falt vannet – men var tunge å
       * lese: en skog av små streker opp og ned fra en midtlinje. En kurve er det øyet
       * forventer av en temperatur, og med feltene bak ser man likevel hvorfor den steg.
       *
       * Kurva og feltene ligger i en strukket svg (fyller bredden), med
       * vector-effect:non-scaling-stroke så streken er like tykk overalt. Tekst og
       * «nå»-punktet ligger som HTML oppå, plassert i prosent – de strekkes ikke.
       * Målingene jevnes ut på 48 punkter over vinduet, så målestøy ikke blir fjell.
       */
      _graf() {
        const h = this._hist;
        if (!h || h.feil) return html`<div class="dempet senter graf-tom">Henter historikk …</div>`;
        const T = (h.temp || []).filter((p) => isFinite(p.v));
        if (T.length < 2) {
          return html`<div class="dempet senter graf-tom">Ikke nok temperaturhistorikk ennå.</div>`;
        }
        const fra = h.fra, til = h.til, spenn = til - fra;
        const W = 300, H = 100, N = 48;

        // 1) gjennomsnitt i 48 like store bøtter, 2) glidende snitt over tre
        const botter = Array.from({ length: N }, () => []);
        for (const p of T) {
          const i = Math.floor(((p.t - fra) / spenn) * N);
          if (i >= 0 && i < N) botter[i].push(p.v);
        }
        let pkt = botter
          .map((a, i) => (a.length ? { t: fra + ((i + 0.5) / N) * spenn, v: a.reduce((x, y) => x + y, 0) / a.length } : null))
          .filter(Boolean);
        // Tomme bøtter i starten: ta med siste måling før vinduet, så kurva går helt ut.
        if (!pkt.length) pkt = [{ t: fra, v: T[0].v }, { t: til, v: T[T.length - 1].v }];
        if (pkt.length === 1) pkt.push({ t: til, v: pkt[0].v });
        pkt = pkt.map((p, i, a) => ({ t: p.t, v: (a[Math.max(0, i - 1)].v + p.v + a[Math.min(a.length - 1, i + 1)].v) / 3 }));

        const mal = this.attr("vanntemp", "maltemperatur");
        const siste = T[T.length - 1];
        const verdier = pkt.map((p) => p.v).concat([siste.v], mal != null ? [Number(mal)] : []);
        let lo = Math.min(...verdier), hi = Math.max(...verdier);
        if (hi - lo < 1) { const m = (hi + lo) / 2; lo = m - 0.5; hi = m + 0.5; }
        const pad = (hi - lo) * 0.2; lo -= pad; hi += pad;
        const X = (t) => ((t - fra) / spenn) * W;
        const Y = (v) => H - ((v - lo) / (hi - lo)) * H;

        // Catmull-Rom → bezier, så kurva går gjennom punktene uten knekker
        const P = pkt.map((p) => [X(p.t), Y(p.v)]);
        let linje = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
        for (let i = 0; i < P.length - 1; i++) {
          const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
          const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
          const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
          linje += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        const flate = `${linje} L${P[P.length - 1][0].toFixed(1)},${H} L${P[0][0].toFixed(1)},${H} Z`;

        // Pumpeperioder: over 40 W, slått sammen, kortere enn to minutter forkastes
        const E = h.effekt || [];
        const felt = [];
        let aapen = null;
        for (let i = 0; i < E.length; i++) {
          const gar = E[i].v > 40;
          if (gar && aapen === null) aapen = E[i].t;
          if (!gar && aapen !== null) { felt.push([aapen, E[i].t]); aapen = null; }
        }
        if (aapen !== null) felt.push([aapen, til]);
        const ekte = felt.filter(([a, b]) => b - a >= 120000);
        const feltD = ekte.map(([a, b]) => {
          const x0 = Math.max(0, X(a)), x1 = Math.min(W, X(b));
          return `M${x0.toFixed(1)},0 H${x1.toFixed(1)} V${H} H${x0.toFixed(1)} Z`;
        }).join(" ");
        const pumpetMin = ekte.reduce((sum, [a, b]) => sum + (b - a) / 60000, 0);

        const malY = mal != null ? Y(Number(mal)) : null;
        const naX = Math.max(0, Math.min(100, (X(siste.t) / W) * 100));
        const naY = Math.max(0, Math.min(100, (Y(siste.v) / H) * 100));
        const endring = siste.v - T[0].v;
        const timer = spenn / 3600000;

        // Fem merker langs tida
        const merker = [0, 0.25, 0.5, 0.75, 1].map((f) => {
          const d = new Date(fra + f * spenn);
          const tekst = timer <= 30
            ? `${String(d.getHours()).padStart(2, "0")}:00`
            : d.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", "");
          return { f, tekst: f === 1 ? "nå" : tekst };
        });

        return html`
          <div class="tgraf">
            <div class="tflate">
              <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="kib-tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0.42"></stop>
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <path class="tg-pumpe" d="${feltD}"></path>
                <path class="tg-mal" d="${malY !== null ? `M0,${malY.toFixed(1)} H${W}` : ""}"></path>
                <path class="tg-flate" d="${flate}"></path>
                <path class="tg-linje" d="${linje}"></path>
              </svg>
              ${malY !== null && malY > 4 && malY < H - 4
                ? html`<span class="tg-malmerke" style="top:${((malY / H) * 100).toFixed(1)}%">mål ${nf(mal, 0)}°</span>` : ""}
              <span class="tg-y topp">${nf(hi, 1)}°</span>
              <span class="tg-y bunn">${nf(lo, 1)}°</span>
              <span class="tg-na" style="left:${naX.toFixed(1)}%;top:${naY.toFixed(1)}%"></span>
              <span class="tg-natekst ${naY < 22 ? "under" : ""}" style="left:${naX.toFixed(1)}%;top:${naY.toFixed(1)}%">${nf(siste.v, 1)}°</span>
            </div>
            <div class="tg-akse">
              ${merker.map((m) => html`<span style="left:${(m.f * 100).toFixed(0)}%">${m.tekst}</span>`)}
            </div>
            <div class="tg-chips">
              <span class="chip"><i class="prikk temp"></i>${nf(siste.v, 1)}° nå</span>
              ${mal != null ? html`<span class="chip">mål ${nf(mal, 0)}°</span>` : ""}
              <span class="chip ${endring >= 0 ? "opp" : "ned"}">${endring >= 0 ? "▲" : "▼"} ${nf(Math.abs(endring), 1)}°
                ${timer <= 30 ? "siste døgn" : `siste ${Math.round(timer / 24)} døgn`}</span>
              <span class="chip"><i class="prikk sirk"></i>pumpet ${pumpetMin >= 60
                ? `${nf(pumpetMin / 60, 1)} t` : `${Math.round(pumpetMin)} min`}</span>
            </div>
          </div>`;
      }

      /* --- handlinger ----------------------------------------------- */

      _kall(domain, service, key, data = {}) {
        const id = this.id(key);
        if (!id) return;
        this.hass.callService(domain, service, { entity_id: id, ...data });
        if (navigator.vibrate) navigator.vibrate(6);
      }

      _trykk(key) {
        this._kall("button", "press", key);
      }

      _veksle(key) {
        this._kall("switch", "toggle", key);
      }

      _sett(key, value) {
        this._kall("number", "set_value", key, { value });
      }

      _velg(option) {
        this._kall("select", "select_option", "profil", { option });
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

      _apneLukk(navn) {
        this._apne = { ...this._apne, [navn]: !this._apne[navn] };
      }

      /* --- byggeklosser --------------------------------------------- */

      // Flis i samme form som button-card-flisene i dashbordet
      _flis(ikon, navn, tekst, aktiv, klikk, farge) {
        return html`
          <button
            class="flis ${aktiv ? "aktiv" : ""}"
            style=${aktiv && farge ? `background:${farge}` : ""}
            @click=${klikk}
          >
            <span class="flis-ikon"><ha-icon icon="${ikon}"></ha-icon></span>
            <span class="flis-navn">${navn}</span>
            <span class="flis-tekst">${tekst}</span>
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
            <span class="velger-tekst">${tekst}</span>
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
              <select .value=${s.state} @change=${(e) => this._velg(e.target.value)}>
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
          <button class="bryterrad" @click=${() => this._veksle(key)}>
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
          { id: "sirkulasjon", navn: "Sirkulasjon" },
          { id: "spreder", navn: "Spreder" },
          /* Innstillinger er ikke en likeverdig fane — den åpnes fra tannhjulet til
             høyre i rada. Den ligger her bare så `faner:`-lista kan nevne den. */
          { id: "innstillinger", navn: "Innstillinger", tannhjul: true },
        ];
        if (Array.isArray(valgt) && valgt.length) {
          return valgt
            .map((v) => alle.find((f) => f.id === v) || (typeof v === "object" && v.id ? { id: v.id, navn: v.navn || v.id } : null))
            .filter(Boolean);
        }
        return alle;
      }

      _faner(liste, aktiv) {
        /* Tannhjulet skilles ut fra de vanlige fanene. Innstillinger er noe man går inn
           i sjelden, og som fane stjal den plass fra de tre man bruker. */
        const vanlige = liste.filter((f) => !f.tannhjul);
        const cog = liste.find((f) => f.tannhjul);
        return html`
          <div class="fanerad">
          <div class="faner">
            ${vanlige.map(
              (f) => html`
                <button
                  class="fane ${f.id === aktiv ? "aktiv" : ""}"
                  @click=${() => { this._fane = f.id; }}
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
      _panel(ikon, farge, tittel, under, innhold, hoyre = "") {
        return html`
          <section class="panel" style="--pf:${farge}">
            <header class="phode">
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
      _ring(pst, farge, stor, liten) {
        const r = 42;
        const omkrets = 2 * Math.PI * r;
        const fylt = Math.max(0, Math.min(100, Number(pst) || 0));
        return html`
          <div class="ring" style="--rf:${farge}">
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
          <button class="stat" @click=${klikk || (() => {})} ?disabled=${!klikk}>
            <ha-icon icon="${ikon}"></ha-icon>
            <span class="sv">${verdi}${enhet ? html`<small>${enhet}</small>` : ""}</span>
            <span class="sn">${navn}</span>
          </button>`;
      }

      _vinduvelger() {
        return html`
          <span class="vindu">
            ${[24, 72, 168].map((t) => html`
              <button class="${this._timer === t ? "aktiv" : ""}" @click=${() => this._byttVindu(t)}>
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

      /* --- deler ----------------------------------------------------- */

      _hero() {
        const modus = this.val("modus", "hvile");
        const [tekst, farge, ikon] = MODUS[modus] || [modus, "var(--kib-muted)", "mdi:pump"];
        const gjort = this.val("omsetninger", 0) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const andel = Math.max(0, Math.min(1, gjort / mal));
        const gar = this.on("skalGa") || ["filtrering", "oppvarming", "boost"].includes(modus);
        const temp = this.val("vanntemp");
        const maltemp = this.attr("vanntemp", "maltemperatur");
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
          <div class="hero ${gar ? "gar" : ""}" @click=${() => this._mer("modus")}>
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
            <div class="hero-innhold">
              <div class="hero-topp">
                <div>
                  <div class="temp" @click=${(e) => { e.stopPropagation(); this._mer("vanntemp"); }}>
                    ${nf(temp, 1)}<span>°C</span>
                  </div>
                  ${maltemp != null
                    ? html`<div class="maltemp">mål ${nf(maltemp, 0)} °C</div>`
                    : ""}
                </div>
                <div class="merke" style="--merke:${farge}">
                  <ha-icon icon="${ikon}"></ha-icon>${tekst}
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
        const tvang = this.on("tvingVarme");
        const maltemp = this.attr("vanntemp", "maltemperatur");
        const pumpeGar = this.on("skalGa");

        return html`
          <div class="fliser">
            ${this._flis(
              tvang ? "mdi:fire" : "mdi:fire-off",
              "Varm nå",
              tvang ? "til målet" : maltemp != null ? `mot ${nf(maltemp, 0)}°` : "av",
              tvang,
              () => this._veksle("tvingVarme"),
              "var(--kib-orange)"
            )}
            ${this._flis(
              "mdi:fan-plus",
              "Boost",
              pumpeGar ? "pumpen går" : "30 min",
              false,
              () => this._trykk("boost")
            )}
            ${this._flis(
              sprederGar ? "mdi:sprinkler-variant" : "mdi:sprinkler",
              "Spreder",
              sprederGar ? `${igjen} min igjen` : "start",
              sprederGar,
              () => this._trykk(sprederGar ? "stoppSpreder" : "startSpreder"),
              "var(--kib-blue)"
            )}
            ${this._flis(
              "mdi:robot-outline",
              "Automatikk",
              this.on("auto") ? "på" : "av",
              this.on("auto"),
              () => this._veksle("auto")
            )}
            ${this._flis(
              "mdi:cash-clock",
              "Prisstyring",
              this.on("pris") ? "på" : "av",
              this.on("pris"),
              () => this._veksle("pris")
            )}
            ${this._flis(
              "mdi:heat-wave",
              "Varmeprioritet",
              this.on("varme") ? "på" : "av",
              this.on("varme"),
              () => this._veksle("varme")
            )}
          </div>
        `;
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
            <button class="idagcelle" @click=${() => this._mer("spart")}>
              <ha-icon icon="mdi:piggy-bank-outline"></ha-icon>
              <span class="idagn">Spart i dag</span>
              <span class="idagv ${spart > 0 ? "gron" : ""}">${
                nf(spart, 0)}<small>${valuta}</small></span>
            </button>
          </div>
        `;
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

        return html`
          ${this._panel("mdi:autorenew", "var(--kib-blue)", "Omsetninger i dag",
            gjort >= mal ? "Målet er nådd" : `${nf(Math.max(0, mal - gjort), 2)} igjen til målet`,
            html`
              <div class="ringrad">
                ${this._ring(pst, "var(--kib-blue)", `${nf(gjort, 2)}×`, `av ${nf(mal, 2)}×`)}
                <div class="statliste">
                  ${this._stat("mdi:timer-outline", "Pumpetid i dag", nf(this.val("pumpetid", 0), 1), " t", () => this._mer("pumpetid"))}
                  ${this._stat("mdi:clock-start", "Neste start", neste ? klokke(neste) || String(neste) : "–", "", () => this._mer("nesteStart"))}
                  ${this._stat("mdi:water-sync", "Én omsetning", nf(enOms, 1), " t")}
                </div>
              </div>
              ${anbefalt ? html`<div class="tips"><ha-icon icon="mdi:thermometer-water"></ha-icon>
                Vanntemperaturen tilsier ${nf(anbefalt, 2)} omsetninger i døgnet.</div>` : ""}`)}

          ${this._panel("mdi:chart-bell-curve-cumulative", "var(--kib-orange)", "Temperatur og sirkulasjon", "",
            this._graf(), this._vinduvelger())}

          ${this._panel("mdi:calendar-clock", "var(--kib-accent)", "Planen",
            snittPlan != null ? `Snitt ${nf(snittPlan, 2)} mot ${nf(snittDogn, 2)} for døgnet` : "",
            html`
              <div class="plabel">I dag</div>
              ${this._planstripe(bl, true)}
              ${blm.length ? html`<div class="plabel">I morgen</div>${this._planstripe(blm, false)}` : ""}`)}

          ${this._panel("mdi:tune-variant", "var(--kib-muted)", "Innstillinger", "", html`
            <div class="pliste">
              ${this._velgerEntitet("profil", "Driftsprofil", PROFIL)}
              ${this._velger("mal", "Omsetninger per døgn", { step: 0.25, desimaler: 2, suffiks: "×" })}
              ${this._velger("puls", "Vedlikeholdspuls", { suffiks: " min/t" })}
              ${this._velger("dagtimer", "Dagtimer i planen", { suffiks: " t" })}
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
          <div class="spredscene ${gar ? "gar" : ""}">
            <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet">
              <rect class="sp-vann" x="0" y="96" width="320" height="24"></rect>
              <g class="sp-gruppe" transform-origin="160px 78px">
                <path class="sp-straale" d="M160 78 q34 -38 70 -18"></path>
                <path class="sp-straale tynn" d="M160 78 q26 -30 54 -20"></path>
                <path class="sp-straale" d="M160 78 q-34 -38 -70 -18"></path>
                <path class="sp-straale tynn" d="M160 78 q-26 -30 -54 -20"></path>
              </g>
              <g class="sp-draper">
                ${[[52, 16], [74, 26], [96, 20], [-52, 16], [-74, 26], [-96, 20],
                   [38, 30], [-38, 30]].map(([dx, dy], i) => html`
                  <circle class="sp-drape" cx="160" cy="78" r="2.6"
                    style="--dx:${dx}px;--dy:${dy}px;animation-delay:${
                      (i * 0.17).toFixed(2)}s"></circle>`)}
              </g>
              <g class="sp-hode" transform-origin="160px 96px">
                <rect x="157" y="78" width="6" height="20" rx="3" class="sp-stamme"></rect>
                <circle cx="160" cy="78" r="7" class="sp-topp"></circle>
                <circle cx="160" cy="78" r="3" class="sp-dyse"></circle>
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
          </section>

          ${this._panel("mdi:sprinkler-variant", "var(--kib-blue)", "I dag",
            maks ? `${nf(Math.max(0, maks - brukt), 0)} min igjen av taket` : "Ingen tak satt",
            html`
              <div class="ringrad">
                ${this._ring(maks ? (brukt / maks) * 100 : 0, "var(--kib-blue)", `${nf(brukt, 0)}`, maks ? `av ${nf(maks, 0)} min` : "min")}
                <div class="statliste">
                  ${this._stat("mdi:timer-sand", "Varighet", nf(varighet, 0), " min")}
                  ${this._stat("mdi:repeat", "Start hver", intervall ? nf(intervall, 0) : "–", intervall ? " t" : "")}
                  ${this._stat("mdi:calendar-check", "Program", programPa ? "På" : "Av", "")}
                </div>
              </div>`)}

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

          ${this._panel("mdi:heat-wave", "var(--kib-red)", "Varme", "Når varmepumpa får gå", html`
            <div class="pliste">
              ${this._bryterRad("styrVp", "Styr varmepumpa")}
              ${this._velger("varmeStart", "Varmevindu fra", { suffiks: ":00" })}
              ${this._velger("varmeSlutt", "Varmevindu til", { suffiks: ":00" })}
              ${this._bryterRad("pulsVarme", "Puls med varme")}
            </div>`)}

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
        const pagar = ["filtrering", "oppvarming", "boost"].includes(modus);
        const neste = klokke(this.val("nesteStart"));
        const planlagt = this.attr("modus", "timer_planlagt", 0);

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
              ${this._hero()}
              ${this._plan()}
              <div class="plan-tekst">
                <span>
                  ${pagar ? "Pumpen går nå" : neste ? `Neste start ${neste}` : "Ingen start planlagt"}
                </span>
                <span>${planlagt} t i planen</span>
              </div>
              ${this._knapper()}
              ${this._tallrad()}
              ${this._config.graf !== false
                ? this._panel("mdi:chart-bell-curve-cumulative", "var(--kib-orange)", "Vanntemperatur", "",
                    this._graf(), this._vinduvelger())
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
                    ${vis("sirkulasjon") ? html`<div class="faneinnhold">${this._sirkulasjon()}</div>` : ""}
                    ${vis("spreder") ? html`<div class="faneinnhold">${this._spreder()}</div>` : ""}
                    ${vis("innstillinger") ? html`<div class="faneinnhold">${this._innstillinger()}</div>` : ""}
                  `
                : html`
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
            background: var(--kib-surface);
            overflow: hidden;
            margin-bottom: 8px;
          }
          .spredscene svg { display: block; width: 100%; height: 120px; }
          .sp-vann { fill: rgba(74, 157, 248, 0.18); }
          .sp-stamme { fill: rgba(200, 205, 210, 0.45); }
          .sp-topp { fill: rgba(234, 246, 255, 0.9); }
          .sp-dyse { fill: rgba(106, 169, 201, 0.95); }

          /* Hodet vipper, og strålegruppa svinger i samme takt. Ellers ville strålene
             stått stille mens dysa beveget seg. */
          .sp-hode { transform-box: fill-box; transform-origin: 50% 100%; }
          .spredscene.gar .sp-hode { animation: sp-vipp 3.2s ease-in-out infinite alternate; }
          @keyframes sp-vipp { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }

          .sp-gruppe { opacity: 0; transform-box: view-box; }
          .spredscene.gar .sp-gruppe {
            opacity: 1;
            animation: sp-sving 3.2s ease-in-out infinite alternate;
          }
          @keyframes sp-sving { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
          .sp-straale {
            fill: none;
            stroke: rgba(191, 233, 255, 0.55);
            stroke-width: 3;
            stroke-linecap: round;
          }
          .sp-straale.tynn { stroke-width: 2; stroke: rgba(191, 233, 255, 0.35); }

          .sp-drape { fill: rgba(191, 233, 255, 0.9); opacity: 0; transform-box: view-box; }
          .spredscene.gar .sp-drape { animation: sp-sprut 1.5s ease-out infinite; }
          @keyframes sp-sprut {
            0% { opacity: 0; transform: translate(0, 0) scale(0.45); }
            12% { opacity: 0.95; }
            45% { transform: translate(calc(var(--dx, 40px) * 0.55),
                    calc(var(--dy, 22px) * -1)) scale(0.9); }
            100% { opacity: 0; transform: translate(var(--dx, 40px),
                     calc(var(--dy, 22px) * 0.9)) scale(0.8); }
          }
          .spredtekst {
            position: absolute;
            left: 16px;
            top: 12px;
            font-size: 13px;
            font-weight: 600;
            opacity: 0.8;
          }

          .fanerad {
            display: flex;
            align-items: center;
            gap: 8px;
            /* Verdien 0 0 12px auto skjøv hele rada mot høyre kant. Den skal stå midt
               på, slik den gjorde før tannhjulet kom til. Ingen backticks i CSS-
               kommentarer: de lukker template-strengen. */
            margin: 0 auto 12px auto;
            width: fit-content;
            max-width: 100%;
            min-width: 0;
          }
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
          .phode { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
          .pik {
            width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
            background: color-mix(in srgb, var(--pf, var(--kib-muted)) 20%, transparent);
            color: var(--pf, var(--kib-text));
          }
          .pik ha-icon { --mdc-icon-size: 21px; }
          .ptittel { font-size: 15px; font-weight: 600; }
          .punder { font-size: 12px; color: var(--kib-muted); margin-top: 1px; }
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
          .rtekst b { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
          .rtekst span { font-size: 11px; color: var(--kib-muted); }
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
          .stat .sv { grid-area: v; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .stat .sv small { font-size: 11px; font-weight: 500; opacity: 0.6; margin-left: 1px; }
          .stat .sn { grid-area: n; font-size: 11px; color: var(--kib-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
          .spredpanel .stor { margin: 12px; }

          /* --- temperaturgrafen (1.12) --- */
          .tgraf { display: grid; gap: 6px; }
          .tflate { position: relative; height: 150px; margin-right: 34px; }
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
          .vptittel { font-size: 16px; font-weight: 600; }
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

          /* Knappefliser, samme form som button-card-flisene */
          .fliser {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .flis {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 14px 12px 12px;
            border-radius: 24px;
            background: var(--kib-surface);
            min-width: 0;
            transition: background 0.2s ease;
          }
          .flis-ikon {
            display: grid;
            place-items: center;
            width: 38px;
            height: 38px;
            margin-bottom: 8px;
            border-radius: 50%;
            background: var(--kib-inner);
          }
          .flis-ikon ha-icon {
            --mdc-icon-size: 21px;
            color: var(--kib-text);
          }
          .flis-navn {
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .flis-tekst {
            font-size: 11px;
            color: var(--kib-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .flis.aktiv {
            background: var(--kib-accent);
            color: var(--kib-sort);
          }
          .flis.aktiv .flis-ikon {
            background: rgba(0, 0, 0, 0.12);
          }
          .flis.aktiv .flis-ikon ha-icon,
          .flis.aktiv .flis-tekst {
            color: var(--kib-sort);
          }
          .flis.aktiv .flis-tekst {
            opacity: 0.7;
          }

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
            --mdc-icon-size: 18px;
            color: var(--kib-muted);
            opacity: 0.7;
          }
          .idagn {
            font-size: 10.5px;
            opacity: 0.55;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .idagv {
            font-size: 21px;
            font-weight: 600;
            letter-spacing: -0.025em;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .idagv small { font-size: 11.5px; font-weight: 500; opacity: 0.5; margin-left: 2px; }
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
            font-weight: 600;
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

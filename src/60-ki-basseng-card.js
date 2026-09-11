/*!
 * ki-basseng-card 1.1.0 - del av ki-cards
 * Kort for integrasjonen ki_basseng: sirkulasjon, varme og spreder.
 *
 * Tegner bare på nytt når en av bassengets egne entiteter har endret seg,
 * ikke ved hver hass-oppdatering i huset.
 */
(() => {
  "use strict";

  if (customElements.get("ki-basseng-card")) return;

  const VERSJON = "1.1.0";

  const finnLit = () => {
    const base =
      customElements.get("ha-panel-lovelace") ||
      customElements.get("hui-view") ||
      customElements.get("hui-masonry-view") ||
      customElements.get("home-assistant-main");
    return base ? Object.getPrototypeOf(base) : null;
  };

  const start = (LitElement) => {
    const html = LitElement.prototype.html;
    const css = LitElement.prototype.css;

    /* -------------------------------------------------------------- */
    /* Entiteter                                                       */
    /* -------------------------------------------------------------- */

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

    const FANER = {
      oversikt: "Oversikt",
      sirkulasjon: "Sirkulasjon",
      spreder: "Spreder",
      innstillinger: "Innstillinger",
    };

    const nf = (v, d = 1) =>
      v === null || v === undefined || v === "" || isNaN(v)
        ? "–"
        : Number(v).toFixed(d).replace(".", ",");

    const klokke = (iso) => {
      if (!iso || typeof iso !== "string") return null;
      const d = new Date(iso);
      if (isNaN(d)) return null;
      return d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
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

    /* -------------------------------------------------------------- */
    /* Kortet                                                          */
    /* -------------------------------------------------------------- */

    class KiBassengCard extends LitElement {
      static get properties() {
        return { hass: {}, _config: {}, _fane: { state: true } };
      }

      static getStubConfig() {
        return { type: "custom:ki-basseng-card", tittel: "Badebasseng" };
      }

      static getConfigElement() {
        return document.createElement("ki-basseng-card-editor");
      }

      constructor() {
        super();
        this._fane = null;
        this._ider = new Map();
        this._prefiks = null;
        this._modusId = null;
        this._sistSok = 0;
      }

      setConfig(config) {
        this._config = {
          tittel: "Badebasseng",
          faner: ["oversikt", "sirkulasjon", "spreder", "innstillinger"],
          ...config,
        };
        if (typeof this._config.faner === "string") {
          this._config.faner = [this._config.faner];
        }
        this._fane = this._config.fane || this._config.faner[0];
        this._ider.clear();
        this._prefiks = this._config.prefix || null;
        this._modusId = null;
      }

      getCardSize() {
        return 8;
      }

      /* --- ytelse: tegn bare når egne entiteter endret seg -------- */

      shouldUpdate(endret) {
        if (!endret.has("hass") || endret.size > 1) return true;
        const gammel = endret.get("hass");
        if (!gammel || !this.hass) return true;
        for (const id of this._ider.values()) {
          if (id && gammel.states[id] !== this.hass.states[id]) return true;
        }
        // Ingen entiteter løst ennå: integrasjonen kan ha dukket opp.
        return this._ider.size === 0;
      }

      /* --- oppslag ------------------------------------------------- */

      _finnPrefiks() {
        if (this._prefiks && this._modusId) return this._prefiks;
        const na = Date.now();
        if (na - this._sistSok < 30000 && this._prefiks) return this._prefiks;
        this._sistSok = na;

        const states = this.hass.states;
        let merket = null;
        for (const id in states) {
          if (!id.startsWith("sensor.")) continue;
          const a = states[id].attributes;
          if (a.integrasjon !== "ki_basseng") continue;
          if (this._config.prefix && a.prefiks !== this._config.prefix) continue;
          merket = id;
          break;
        }
        if (merket) {
          this._modusId = merket;
          this._prefiks =
            states[merket].attributes.prefiks ||
            merket.slice(7).replace(/_pumpemodus(_\d+)?$/, "");
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

      /* --- handlinger ---------------------------------------------- */

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

      /* --- byggeklosser -------------------------------------------- */

      _hero() {
        const modus = this.val("modus", "hvile");
        const [tekst, farge, ikon] = MODUS[modus] || [modus, "var(--kib-muted)", "mdi:pump"];
        const gjort = this.val("omsetninger", 0) || 0;
        const mal = Number(this.attr("omsetninger", "mal", this.val("mal", 1.5))) || 1.5;
        const andel = Math.max(0, Math.min(1, gjort / mal));
        const gar = this.on("skalGa") || ["filtrering", "oppvarming", "boost"].includes(modus);
        const temp = this.val("vanntemp");
        const begrunnelse = this.attr("modus", "begrunnelse", "");

        return html`
          <div class="hero ${gar ? "gar" : ""}" @click=${() => this._mer("modus")}>
            <div class="vann" style="height:${Math.round(andel * 100)}%">
              <div class="bolge"></div>
            </div>
            <div class="hero-innhold">
              <div class="hero-topp">
                <div class="temp" @click=${(e) => { e.stopPropagation(); this._mer("vanntemp"); }}>
                  ${nf(temp, 1)}<span>°C</span>
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
        const segmenter = blokker(timer).map(
          ([fra, til]) => html`
            <div
              class="segment ${fra <= na.getHours() && na.getHours() < til ? "na" : ""}"
              style="left:${(fra / 24) * 100}%;width:${((til - fra) / 24) * 100}%"
            ></div>
          `
        );
        return html`
          <div class="plan">
            <div class="spor">
              ${segmenter}
              <div class="na-strek ${gar ? "gar" : ""}" style="left:${naPst}%"></div>
            </div>
            <div class="skala">
              <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
            </div>
          </div>
        `;
      }

      _tall(key, verdi, tekst) {
        return html`
          <div class="tall" @click=${() => this._mer(key)}>
            <div class="tall-verdi">${verdi}</div>
            <div class="tall-tekst">${tekst}</div>
          </div>
        `;
      }

      _bryter(key, tekst, ikon) {
        if (!this.st(key)) return "";
        const paa = this.on(key);
        return html`
          <button class="pille ${paa ? "aktiv" : ""}" @click=${() => this._veksle(key)}>
            <ha-icon icon="${ikon}"></ha-icon><span>${tekst}</span>
          </button>
        `;
      }

      _stepper(key, tekst, steg, desimaler = 0, suffiks = "") {
        const s = this.st(key);
        if (!s) return "";
        const v = Number(s.state);
        const min = Number(s.attributes.min ?? 0);
        const maks = Number(s.attributes.max ?? 100);
        const sett = (ny) => this._sett(key, Math.max(min, Math.min(maks, +ny.toFixed(4))));
        return html`
          <div class="stepper">
            <span class="stepper-tekst">${tekst}</span>
            <div class="stepper-styring">
              <button @click=${() => sett(v - steg)} aria-label="Mindre">
                <ha-icon icon="mdi:minus"></ha-icon>
              </button>
              <span class="stepper-verdi">${nf(v, desimaler)}${suffiks}</span>
              <button @click=${() => sett(v + steg)} aria-label="Mer">
                <ha-icon icon="mdi:plus"></ha-icon>
              </button>
            </div>
          </div>
        `;
      }

      _rad(tekst, verdi) {
        return html`
          <div class="rad"><span>${tekst}</span><span class="rad-verdi">${verdi}</span></div>
        `;
      }

      /* --- faner --------------------------------------------------- */

      _oversikt() {
        const modus = this.val("modus", "hvile");
        const valuta = this.enhet("kostnad");
        const effekt = (this.val("pumpeEffekt", 0) || 0) + (this.val("vpEffekt", 0) || 0);
        const neste = klokke(this.val("nesteStart"));
        const pagar = ["filtrering", "oppvarming", "boost"].includes(modus);
        const planlagt = this.attr("modus", "timer_planlagt", 0);
        const sprederGar = this.on("spreder");

        return html`
          ${this._hero()}
          ${this._plan()}
          <div class="plan-tekst">
            <span>${pagar ? "Pumpen går nå" : neste ? `Neste start ${neste}` : "Ingen start planlagt"}</span>
            <span>${planlagt} t i planen</span>
          </div>

          <div class="tallrad">
            ${this._tall("pumpetid", `${nf(this.val("pumpetid", 0), 1)} t`, "pumpet i dag")}
            ${this._tall("pumpeEffekt", `${nf(effekt, 0)} W`, "effekt nå")}
            ${this._tall("spart", `${nf(this.val("spart", 0), 0)} ${valuta}`, "spart i dag")}
          </div>

          <div class="handlinger">
            <button class="handling" @click=${() => this._trykk("boost")}>
              <ha-icon icon="mdi:fan-plus"></ha-icon>Boost 30 min
            </button>
            <button
              class="handling ${sprederGar ? "stopp" : ""}"
              @click=${() => this._trykk(sprederGar ? "stoppSpreder" : "startSpreder")}
            >
              <ha-icon icon="${sprederGar ? "mdi:stop" : "mdi:sprinkler"}"></ha-icon>
              ${sprederGar ? `Stopp spreder · ${Math.ceil(this.val("spredertid", 0))} min` : "Start spreder"}
            </button>
          </div>

          ${this.on("overstyrt")
            ? html`<div class="varsel">Manuell overstyring – automatikken venter.</div>`
            : ""}
          ${this.on("vpVenter")
            ? html`<div class="varsel">Varmepumpen står av til sirkulasjonen er tilbake.</div>`
            : ""}
        `;
      }

      _sirkulasjon() {
        const bl = this.attr("modus", "blokker", []) || [];
        const blm = this.attr("modus", "blokker_i_morgen", []) || [];
        const snittPlan = this.attr("modus", "snittpris_plan");
        const snittDogn = this.attr("modus", "snittpris_dogn");
        const profil = this.st("profil");
        const anbefalt = this.attr("omsetninger", "anbefalt");
        const enOms = this.attr("omsetninger", "en_omsetning_timer");

        return html`
          ${this._plan()}
          <div class="blokk">
            ${bl.length
              ? bl.map((b, i) => this._rad(`Blokk ${i + 1}`, b))
              : html`<div class="dempet">Ingen blokker planlagt i dag.</div>`}
            ${blm.length ? this._rad("I morgen", blm.join("  ·  ")) : ""}
            ${snittPlan != null
              ? html`
                  <div class="skille"></div>
                  ${this._rad("Snittpris i planen", nf(snittPlan, 2))}
                  ${this._rad("Snittpris hele døgnet", nf(snittDogn, 2))}
                `
              : ""}
          </div>

          ${profil
            ? html`
                <div class="chips">
                  ${(profil.attributes.options || []).map(
                    (o) => html`
                      <button class="chip ${profil.state === o ? "aktiv" : ""}" @click=${() => this._velg(o)}>
                        ${PROFIL[o] || o}
                      </button>
                    `
                  )}
                </div>
              `
            : ""}

          <div class="blokk">
            ${this._stepper("mal", "Omsetninger per døgn", 0.25, 2, "×")}
            ${this._stepper("puls", "Vedlikeholdspuls", 1, 0, " min/t")}
            <div class="dempet">
              Én omsetning tar ${nf(enOms, 1)} t.
              ${anbefalt ? ` Vanntemperaturen tilsier ${nf(anbefalt, 2)} omsetninger.` : ""}
            </div>
          </div>

          <div class="piller">
            ${this._bryter("auto", "Automatikk", "mdi:robot-outline")}
            ${this._bryter("pris", "Prisstyring", "mdi:cash-clock")}
            ${this._bryter("varme", "Varmeprioritet", "mdi:heat-wave")}
          </div>
        `;
      }

      _spreder() {
        const gar = this.on("spreder");
        const igjen = this.val("spredertid", 0) || 0;
        const varighet = this.val("spredVarighet", 10) || 10;
        const brukt = this.attr("spredertid", "brukt_i_dag_min", 0);
        const maks = this.val("spredMaks", 0) || 0;
        const status = this.attr("spredertid", "status", "Klar");
        const andel = gar ? Math.max(0, Math.min(1, igjen / varighet)) : 0;

        return html`
          <div class="spreder ${gar ? "gar" : ""}">
            <div class="spreder-vann" style="width:${andel * 100}%"></div>
            <div class="spreder-innhold">
              <ha-icon icon="${gar ? "mdi:sprinkler-variant" : "mdi:sprinkler"}"></ha-icon>
              <div>
                <div class="spreder-tall">${gar ? `${Math.ceil(igjen)} min igjen` : status}</div>
                <div class="dempet">
                  ${nf(brukt, 0)} min brukt i dag${maks ? ` av ${nf(maks, 0)}` : ""}
                </div>
              </div>
            </div>
          </div>

          <div class="chips">
            ${[5, 10, 20, 30].map(
              (m) => html`
                <button
                  class="chip ${Math.round(varighet) === m ? "aktiv" : ""}"
                  @click=${() => this._sett("spredVarighet", m)}
                >
                  ${m} min
                </button>
              `
            )}
          </div>

          <button class="stor ${gar ? "stopp" : ""}" @click=${() => this._trykk(gar ? "stoppSpreder" : "startSpreder")}>
            <ha-icon icon="${gar ? "mdi:stop" : "mdi:play"}"></ha-icon>
            ${gar ? "Stopp sprederen" : `Start sprederen i ${Math.round(varighet)} min`}
          </button>

          <div class="blokk">
            ${this._stepper("spredIntervall", "Program: start hver", 1, 0, " t")}
            <div class="piller">
              ${this._bryter("spredprogram", "Program", "mdi:repeat")}
              ${this._bryter("frostvakt", "Frostvakt", "mdi:snowflake-alert")}
            </div>
            <div class="dempet">Programmet går mellom 10 og 20, og stopper ved døgnets grense.</div>
          </div>
        `;
      }

      _innstillinger() {
        const energi = (this.val("pumpeEnergi", 0) || 0) + (this.val("vpEnergi", 0) || 0);
        return html`
          <div class="blokk">
            ${this._stepper("dagtimer", "Dagtimer i planen", 1, 0, " t")}
            ${this._stepper("minTid", "Minste kjøretid", 5, 0, " min")}
            ${this._stepper("overstyringTid", "Manuell overstyring varer", 15, 0, " min")}
            ${this._stepper("varmeStart", "Varmevindu start", 1, 0, ":00")}
            ${this._stepper("varmeSlutt", "Varmevindu slutt", 1, 0, ":00")}
            ${this._stepper("basislast", "Pumpe basislast", 10, 0, " W")}
            ${this._stepper("spredMaks", "Spreder maks per døgn", 10, 0, " min")}
          </div>
          <div class="piller">
            ${this._bryter("styrVp", "Styr varmepumpe", "mdi:heat-pump-outline")}
            ${this._bryter("pulsVarme", "Puls med varme", "mdi:fire-circle")}
          </div>
          <div class="blokk">
            ${this._rad("Pumpet totalt", `${nf(this.val("volumTotalt", 0), 1)} m³`)}
            ${this._rad("Pumpet i dag", `${nf(this.val("volum", 0), 1)} m³`)}
            ${this._rad("Energi i dag", `${nf(energi, 1)} kWh`)}
            ${this._rad("Kostnad i dag", `${nf(this.val("kostnad", 0), 1)} ${this.enhet("kostnad")}`)}
          </div>
          <button class="stor stille" @click=${() => this._trykk("nullstill")}>
            <ha-icon icon="mdi:backup-restore"></ha-icon>Nullstill dagens tellere
          </button>
          <div class="dempet senter">ki-basseng-card ${VERSJON} · ${this._prefiks || ""}</div>
        `;
      }

      /* --- render -------------------------------------------------- */

      render() {
        if (!this.hass || !this._config) return html``;
        if (!this.st("modus")) {
          return html`
            <ha-card>
              <div class="blokk tom">
                Fant ingen KI Basseng-integrasjon. Sett den opp under Enheter og
                tjenester, eller oppgi <code>prefix:</code> i kortet.
              </div>
            </ha-card>
          `;
        }
        const faner = this._config.faner;
        const aktiv = faner.includes(this._fane) ? this._fane : faner[0];
        const innhold = {
          oversikt: () => this._oversikt(),
          sirkulasjon: () => this._sirkulasjon(),
          spreder: () => this._spreder(),
          innstillinger: () => this._innstillinger(),
        };
        return html`
          <ha-card>
            ${this._config.tittel ? html`<div class="tittel">${this._config.tittel}</div>` : ""}
            ${faner.length > 1
              ? html`
                  <div class="faner">
                    ${faner.map(
                      (f) => html`
                        <button class="fane ${aktiv === f ? "aktiv" : ""}" @click=${() => (this._fane = f)}>
                          ${FANER[f] || f}
                        </button>
                      `
                    )}
                  </div>
                `
              : ""}
            <div class="innhold">${(innhold[aktiv] || innhold.oversikt)()}</div>
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
          }
          button:focus-visible {
            outline: 2px solid var(--kib-accent);
            outline-offset: 2px;
          }
          .tittel {
            font-size: 15px;
            font-weight: 600;
            padding: 0 4px 10px;
          }
          .faner {
            display: flex;
            gap: 4px;
            padding: 4px;
            margin-bottom: 12px;
            border-radius: 16px;
            background: var(--kib-surface);
          }
          .fane {
            flex: 1 1 0;
            min-width: 0;
            padding: 9px 4px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 500;
            color: var(--kib-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .fane.aktiv {
            background: var(--kib-accent);
            color: #000;
            font-weight: 600;
          }
          .innhold {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          /* Hero: vannstanden er dagens omsetning */
          .hero {
            position: relative;
            min-height: 168px;
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
            background: linear-gradient(180deg, rgba(74, 157, 248, 0.45), rgba(74, 157, 248, 0.7));
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
          @keyframes bolge {
            to {
              transform: translateX(-120px);
            }
          }
          .hero-innhold {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 168px;
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
          .merke {
            flex: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px 5px 9px;
            border-radius: 999px;
            background: var(--merke);
            color: #000;
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
            max-width: 60%;
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

          /* Tall */
          .tallrad {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .tall {
            padding: 14px 14px 12px;
            border-radius: 18px;
            background: var(--kib-surface);
            cursor: pointer;
            min-width: 0;
          }
          .tall-verdi {
            font-size: 20px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .tall-tekst {
            padding-top: 2px;
            font-size: 12px;
            color: var(--kib-muted);
          }

          /* Handlinger */
          .handlinger {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .handling,
          .stor {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 10px;
            border-radius: 18px;
            background: var(--kib-surface);
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .handling ha-icon,
          .stor ha-icon {
            --mdc-icon-size: 20px;
            flex: none;
          }
          .stor {
            width: 100%;
            padding: 16px;
            background: var(--kib-accent);
            color: #000;
            font-weight: 600;
            font-size: 15px;
          }
          .handling.stopp,
          .stor.stopp {
            background: var(--kib-red);
            color: #000;
          }
          .stor.stille {
            background: var(--kib-surface);
            color: var(--kib-text);
            font-weight: 500;
          }

          /* Blokker og rader */
          .blokk {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px 16px;
            border-radius: 18px;
            background: var(--kib-surface);
          }
          .blokk.tom {
            line-height: 1.5;
            font-size: 13px;
            color: var(--kib-muted);
          }
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
            background: var(--kib-inner);
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

          /* Chips og piller */
          .chips,
          .piller {
            display: flex;
            gap: 8px;
          }
          .chip,
          .pille {
            flex: 1 1 0;
            min-width: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 11px 6px;
            border-radius: 14px;
            background: var(--kib-surface);
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .blokk .chip,
          .blokk .pille {
            background: var(--kib-inner);
          }
          .pille ha-icon {
            --mdc-icon-size: 18px;
            flex: none;
          }
          .chip.aktiv,
          .pille.aktiv {
            background: var(--kib-accent);
            color: #000;
            font-weight: 600;
          }

          /* Stepper */
          .stepper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .stepper-tekst {
            font-size: 14px;
            color: var(--kib-muted);
            min-width: 0;
          }
          .stepper-styring {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: none;
          }
          .stepper-styring button {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: var(--kib-inner);
            display: grid;
            place-items: center;
          }
          .stepper-styring ha-icon {
            --mdc-icon-size: 18px;
          }
          .stepper-verdi {
            min-width: 76px;
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
          }

          /* Spreder */
          .spreder {
            position: relative;
            border-radius: 22px;
            background: var(--kib-surface);
            overflow: hidden;
          }
          .spreder-vann {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            background: rgba(74, 157, 248, 0.35);
            transition: width 1s linear;
          }
          .spreder-innhold {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px;
          }
          .spreder-innhold ha-icon {
            --mdc-icon-size: 36px;
            color: var(--kib-muted);
            flex: none;
          }
          .spreder.gar .spreder-innhold ha-icon {
            color: var(--kib-blue);
            animation: vipp 2.4s ease-in-out infinite;
          }
          @keyframes vipp {
            0%,
            100% {
              transform: rotate(-10deg);
            }
            50% {
              transform: rotate(10deg);
            }
          }
          .spreder-tall {
            font-size: 20px;
            font-weight: 600;
          }

          @media (prefers-reduced-motion: reduce) {
            .hero.gar .bolge,
            .spreder.gar .spreder-innhold ha-icon {
              animation: none;
            }
            .vann,
            .spreder-vann {
              transition: none;
            }
          }
        `;
      }
    }

    /* -------------------------------------------------------------- */
    /* Editor                                                          */
    /* -------------------------------------------------------------- */

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
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })
        );
      }

      render() {
        if (!this.hass || !this._config) return html``;
        const schema = [
          { name: "tittel", selector: { text: {} } },
          { name: "prefix", selector: { text: {} } },
          {
            name: "faner",
            selector: {
              select: {
                multiple: true,
                mode: "list",
                options: Object.entries(FANER).map(([value, label]) => ({ value, label })),
              },
            },
          },
        ];
        const data = { faner: Object.keys(FANER), ...this._config };
        return html`
          <ha-form
            .hass=${this.hass}
            .data=${data}
            .schema=${schema}
            .computeLabel=${(s) =>
              ({ tittel: "Tittel", prefix: "Entitetsprefiks (valgfritt)", faner: "Faner" })[s.name] || s.name}
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

  const lit = finnLit();
  if (lit) {
    start(lit);
  } else {
    Promise.race([
      customElements.whenDefined("ha-panel-lovelace"),
      customElements.whenDefined("hui-view"),
      customElements.whenDefined("home-assistant-main"),
    ]).then(() => {
      const sen = finnLit();
      if (sen) start(sen);
      else console.error("ki-basseng-card: fant ikke LitElement i frontend");
    });
  }
})();

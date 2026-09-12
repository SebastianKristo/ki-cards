/*!
 * ki-basseng-card 1.2.0 - del av ki-cards
 * Kort for integrasjonen ki_basseng: sirkulasjon, varme og spreder.
 *
 * - Ingen faner: én flyt med utvidbare seksjoner, som resten av dashbordet.
 * - Knappefliser i samme stil som button-card-flisene (gray200 -> active-big).
 * - Tallvalg bruker <select>, så iOS/Android viser sin egen hjulvelger.
 * - Grafer hentes fra HA sin historikk, ikke fra en ekstra sensor.
 * - Tegner bare når bassengets egne entiteter faktisk har endret seg.
 */
(() => {
  "use strict";

  if (customElements.get("ki-basseng-card")) return;

  const VERSJON = "1.2.0";

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
        this._config = { tittel: "Badebasseng", graf: true, ...config };
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
        if (!temp) return;
        this._henter = true;
        this._sistHist = na;
        try {
          const start = new Date(na - this._timer * 3600000).toISOString();
          const svar = await this.hass.callWS({
            type: "history/history_during_period",
            start_time: start,
            entity_ids: effekt ? [temp, effekt] : [temp],
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
          };
        } catch (e) {
          this._hist = { feil: true };
        } finally {
          this._henter = false;
        }
      }

      _byttVindu(timer) {
        this._timer = timer;
        this._hentHistorikk(true);
      }

      _graf() {
        const h = this._hist;
        if (!h || h.feil || !h.temp || h.temp.length < 2) {
          return html`<div class="dempet senter graf-tom">Henter historikk …</div>`;
        }
        const B = 320;
        const H = 92;
        const verdier = h.temp.map((p) => p.v);
        const mal = this.attr("vanntemp", "maltemperatur");
        let lav = Math.min(...verdier);
        let hoy = Math.max(...verdier);
        if (mal != null && !isNaN(mal)) {
          lav = Math.min(lav, Number(mal));
          hoy = Math.max(hoy, Number(mal));
        }
        if (hoy - lav < 1) {
          const m = (hoy + lav) / 2;
          lav = m - 0.5;
          hoy = m + 0.5;
        }
        const pad = (hoy - lav) * 0.15;
        lav -= pad;
        hoy += pad;
        const x = (t) => ((t - h.fra) / (h.til - h.fra)) * B;
        const y = (v) => H - ((v - lav) / (hoy - lav)) * H;

        const linje = h.temp
          .map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
          .join("");
        const flate = `${linje}L${B},${H}L0,${H}Z`;

        // Blå bånd der pumpen faktisk trakk effekt
        const band = [];
        let paa = null;
        for (const p of h.effekt) {
          if (p.v > 10 && paa === null) paa = p.t;
          else if (p.v <= 10 && paa !== null) {
            band.push([paa, p.t]);
            paa = null;
          }
        }
        if (paa !== null) band.push([paa, h.til]);

        const timerTilbake = this._timer;
        const merker = [];
        const steg = timerTilbake <= 24 ? 6 : 24;
        for (let i = steg; i < timerTilbake; i += steg) {
          const t = h.til - (timerTilbake - i) * 3600000;
          merker.push(
            html`<text class="akse" x="${x(t)}" y="${H + 14}" text-anchor="middle">
              ${new Date(t).getHours().toString().padStart(2, "0")}
            </text>`
          );
        }

        return html`
          <svg class="graf" viewBox="0 0 ${B} ${H + 18}" preserveAspectRatio="none">
            ${band.map(
              ([a, b]) => html`
                <rect
                  class="band"
                  x="${x(a)}"
                  y="0"
                  width="${Math.max(1, x(b) - x(a))}"
                  height="${H}"
                ></rect>
              `
            )}
            ${mal != null && !isNaN(mal) && Number(mal) > lav && Number(mal) < hoy
              ? html`<line
                  class="mal"
                  x1="0"
                  x2="${B}"
                  y1="${y(Number(mal))}"
                  y2="${y(Number(mal))}"
                ></line>`
              : ""}
            <path class="flate" d="${flate}"></path>
            <path class="linje" d="${linje}"></path>
            ${merker}
          </svg>
          <div class="graf-tekst">
            <span>${nf(Math.min(...verdier), 1)} – ${nf(Math.max(...verdier), 1)} °C</span>
            <span>${band.length} pumpeperioder</span>
          </div>
        `;
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

        return html`
          <div class="hero ${gar ? "gar" : ""}" @click=${() => this._mer("modus")}>
            <div class="vann" style="height:${Math.round(andel * 100)}%">
              <div class="bolge"></div>
            </div>
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
        return html`
          <div class="tallrad">
            <div class="tall" @click=${() => this._mer("pumpetid")}>
              <div class="tall-verdi">${nf(this.val("pumpetid", 0), 1)} t</div>
              <div class="tall-tekst">pumpet i dag</div>
            </div>
            <div class="tall" @click=${() => this._mer("pumpeEffekt")}>
              <div class="tall-verdi">${nf(effekt, 0)} W</div>
              <div class="tall-tekst">effekt nå</div>
            </div>
            <div class="tall" @click=${() => this._mer("spart")}>
              <div class="tall-verdi">${nf(this.val("spart", 0), 0)} ${valuta}</div>
              <div class="tall-tekst">spart i dag</div>
            </div>
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
        return html`
          ${this._velgerEntitet("profil", "Driftsprofil", PROFIL)}
          ${this._velger("mal", "Omsetninger per døgn", { step: 0.25, desimaler: 2, suffiks: "×" })}
          ${this._velger("puls", "Vedlikeholdspuls", { suffiks: " min/t" })}
          ${this._velger("dagtimer", "Dagtimer i planen", { suffiks: " t" })}
          <div class="skille"></div>
          ${bl.length
            ? bl.map((b, i) => this._rad(`Blokk ${i + 1}`, b))
            : html`<div class="dempet">Ingen blokker planlagt i dag.</div>`}
          ${blm.length ? this._rad("I morgen", blm.join("  ·  ")) : ""}
          ${snittPlan != null
            ? html`
                ${this._rad("Snittpris i planen", nf(snittPlan, 2))}
                ${this._rad("Snittpris hele døgnet", nf(snittDogn, 2))}
              `
            : ""}
          <div class="dempet">
            Én omsetning tar ${nf(enOms, 1)} t.${anbefalt
              ? ` Vanntemperaturen tilsier ${nf(anbefalt, 2)} omsetninger.`
              : ""}
          </div>
        `;
      }

      _spreder() {
        const gar = this.on("spreder");
        const igjen = this.val("spredertid", 0) || 0;
        const varighet = this.val("spredVarighet", 10) || 10;
        const brukt = this.attr("spredertid", "brukt_i_dag_min", 0);
        const maks = this.val("spredMaks", 0) || 0;
        return html`
          <button
            class="stor ${gar ? "stopp" : ""}"
            @click=${() => this._trykk(gar ? "stoppSpreder" : "startSpreder")}
          >
            <ha-icon icon="${gar ? "mdi:stop" : "mdi:play"}"></ha-icon>
            ${gar
              ? `Stopp sprederen · ${Math.ceil(igjen)} min igjen`
              : `Start sprederen i ${Math.round(varighet)} min`}
          </button>
          ${this._velger("spredVarighet", "Varighet", { suffiks: " min" })}
          ${this._velger("spredIntervall", "Program: start hver", { suffiks: " t" })}
          ${this._velger("spredMaks", "Maks per døgn", { step: 10, suffiks: " min" })}
          ${this._bryterRad("spredprogram", "Program på")}
          ${this._bryterRad("frostvakt", "Frostvakt")}
          <div class="skille"></div>
          ${this._rad("Brukt i dag", `${nf(brukt, 0)} min${maks ? ` av ${nf(maks, 0)}` : ""}`)}
        `;
      }

      _innstillinger() {
        const energi = (this.val("pumpeEnergi", 0) || 0) + (this.val("vpEnergi", 0) || 0);
        return html`
          ${this._velger("minTid", "Minste kjøretid", { step: 5, suffiks: " min" })}
          ${this._velger("overstyringTid", "Manuell overstyring varer", { step: 15, suffiks: " min" })}
          ${this._velger("varmeStart", "Varmevindu start", { suffiks: ":00" })}
          ${this._velger("varmeSlutt", "Varmevindu slutt", { suffiks: ":00" })}
          ${this._velger("basislast", "Pumpe basislast", { step: 10, suffiks: " W" })}
          ${this._bryterRad("styrVp", "Styr varmepumpe")}
          ${this._bryterRad("pulsVarme", "Puls med varme")}
          <div class="skille"></div>
          ${this._rad("Pumpet totalt", `${nf(this.val("volumTotalt", 0), 1)} m³`)}
          ${this._rad("Pumpet i dag", `${nf(this.val("volum", 0), 1)} m³`)}
          ${this._rad("Energi i dag", `${nf(energi, 1)} kWh`)}
          ${this._rad("Kostnad i dag", `${nf(this.val("kostnad", 0), 1)} ${this.enhet("kostnad")}`)}
          <button class="stor stille" @click=${() => this._trykk("nullstill")}>
            <ha-icon icon="mdi:backup-restore"></ha-icon>Nullstill dagens tellere
          </button>
          <div class="dempet senter">ki-basseng-card ${VERSJON} · ${this._prefiks || ""}</div>
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

        return html`
          <ha-card>
            ${this._config.tittel ? html`<div class="tittel">${this._config.tittel}</div>` : ""}
            <div class="innhold">
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
                ? html`
                    <div class="grafblokk">
                      <div class="grafhode">
                        <span>Vanntemperatur</span>
                        <span class="vindu">
                          ${[24, 72, 168].map(
                            (t) => html`
                              <button
                                class="${this._timer === t ? "aktiv" : ""}"
                                @click=${() => this._byttVindu(t)}
                              >
                                ${t === 24 ? "24 t" : t === 72 ? "3 d" : "7 d"}
                              </button>
                            `
                          )}
                        </span>
                      </div>
                      ${this._graf()}
                    </div>
                  `
                : ""}
              ${this.on("overstyrt")
                ? html`<div class="varsel">Manuell overstyring – automatikken venter.</div>`
                : ""}
              ${this.on("vpVenter")
                ? html`<div class="varsel">Varmepumpen står av til sirkulasjonen er tilbake.</div>`
                : ""}
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
            font-size: 19px;
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
        ];
        return html`
          <ha-form
            .hass=${this.hass}
            .data=${{ graf: true, ...this._config }}
            .schema=${schema}
            .computeLabel=${(s) =>
              ({
                tittel: "Tittel",
                prefix: "Entitetsprefiks (valgfritt)",
                graf: "Vis graf",
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

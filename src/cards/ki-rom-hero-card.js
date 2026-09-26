/*
 * ki-rom-hero-card — toppkortet i rom-popupen (Rom v3): romnavn, status-pille, stor
 * temperatur, fukt og spennet siste døgn, en fuktsøyle til høyre og en levende bakgrunn.
 *
 * Tilstanden styrer farge, ikon og partikler:
 *   varmer  (klima varmer)       rødt,  flamme,  raske gnister   «Varmer til 21,0°»
 *   lys på  (noen lys i rommet)  gult,  lyspære                  «3 lys på»
 *   holder  (klima har mål)      blått, luft                     «Holder 21,0°»
 *   rolig                         blått, luft                     «Alt er rolig»
 *
 * Minste oppsett – resten finnes i området (sensorer, termostat og lys med area = stue):
 *   type: custom:ki-rom-hero-card
 *   omrade: stue
 *
 * Alt kan settes selv:
 *   navn: Stue
 *   ikon: mdi:sofa
 *   temperatur: sensor.stue_temperatur      # ellers klimaets current_temperature
 *   fukt: sensor.stue_fuktighet             # ellers klimaets current_humidity
 *   klima: climate.stue_oljefyr
 *   lys: [light.sofabord, light.taklist]    # eller en lysgruppe
 *   hoyde: 184
 *   tap_action:      { action: more-info }                 # trykk på kortet (standard: temperaturen)
 *   ikon_tap_action: { action: navigate, navigation_path: "#stue" }   # overstyrer tannhjulet
 *   fukt_tap_action: { action: more-info }                 # standard: fuktsensoren
 *   farge: "#80c3ff"                                       # grafens farge (ellers følger den varme/lys)
 *   stil: enkel                                            # levende (standard) | enkel: grå og minimalistisk (temp, fukt og en grå graf)
 *   animasjon: false                                       # uten partikler og pusting
 *   graf: false                                            # skjul temperaturgrafen
 *   bakgrunn: "var(--gray200)"                             # kortets bakgrunn
 *   tannhjul: false                                        # vis romikonet i stedet for tannhjulet
 *   rom_nokkel: stue+kjokken                               # nøkkelen i ki_rom (standard: omrade)
 *
 * Tannhjulet oppe til høyre åpner «Tilpass rommet»: kortet sender hendelsen
 * `ki-rom-tilpass` (bobler ut av shadow DOM). Ligger kortet i ki-rom-card, tar rom-kortet
 * imot den og åpner redigeringen. Står kortet alene, åpnes termostaten som før.
 * Temperatur-/fuktsensoren brukeren har valgt i «Tilpass rommet» (ki_rom) brukes når
 * kortet ikke har fått temperatur/fukt i config.
 */
(() => {
  const VERSJON = "1.3.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const komma = (v, d = 1) => (isNaN(v) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const ok = (s) => s && !["unavailable", "unknown", ""].includes(s.state);
  const tall = (s) => (ok(s) ? parseFloat(s.state) : NaN);

  // fargene fra designet (oklch), med hex for eldre nettlesere
  const F = { rod: "#f47b74", gul: "#ead070", bla: "#80c3ff", rav: "#f2b966" };
  /* Flat grå bakgrunn som resten av ki-cards; fargen ligger i grafen, pilla og ikonet. */
  const BAK = "var(--gray200, #1c1c1f)";
  // partiklene: [venstre %, forsinkelse s]
  const STOV = [[12, 0], [24, 1.4], [36, 0.6], [48, 2.2], [60, 0.9], [70, 1.8], [80, 0.3], [30, 2.8], [54, 3.3], [18, 2]];

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    .kort { position: relative; height: var(--h, 184px); border-radius: 24px; overflow: hidden; color: var(--gray1000, #f2f1ee);
      transition: background .8s; cursor: pointer;
      -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; font-family: inherit; }
    .kort:focus-visible { outline: 2px solid var(--f); outline-offset: 2px; }
    .graf { position: absolute; left: 0; right: 0; width: 100%; bottom: 0; height: 58%; pointer-events: none; display: block; }
    .graf .linje { fill: none; stroke: var(--f); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
    .graf .flate { fill: url(#kiHeroFyll); }
    .stov { position: absolute; bottom: -4px; border-radius: 2px; background: var(--f); box-shadow: 0 0 6px var(--f);
      animation: drift var(--t, 6s) linear var(--d, 0s) infinite; pointer-events: none; }
    @keyframes drift { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: .9; } 100% { transform: translate(18px, -110px); opacity: 0; } }
    .glyf { position: absolute; right: 86px; top: 36px; color: var(--f); pointer-events: none;
      filter: drop-shadow(0 0 14px color-mix(in srgb, var(--f) 70%, transparent)); animation: puste 3s ease-in-out infinite; }
    .glyf ha-icon { --mdc-icon-size: 36px; display: block; }
    @keyframes puste { 0%, 100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
    .ikon { position: absolute; right: 16px; top: 16px; width: 48px; height: 48px; border-radius: 24px; background: var(--gray100, rgba(255,255,255,.08));
      display: grid; place-items: center; border: 0; padding: 0; color: var(--gray1000, #f2f1ee); cursor: pointer; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .ikon:active { transform: scale(.92); }
    .ikon ha-icon { --mdc-icon-size: 24px; }
    .topp { position: absolute; left: 18px; top: 18px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .navn { font-size: 14px; font-weight: 500; color: var(--gray800, #c9c7c2); }
    .pille { height: 26px; padding: 0 10px 0 8px; border-radius: 13px; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600;
      white-space: nowrap; background: color-mix(in srgb, var(--f) 18%, transparent); color: var(--f); }
    .pille ha-icon { --mdc-icon-size: 14px; }
    .bunn { position: absolute; left: 18px; right: 84px; bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .temp { display: flex; align-items: baseline; gap: 2px; white-space: nowrap; }
    .temp b { font-size: 40px; font-weight: 300; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }
    .temp span { font-size: 18px; color: var(--gray600, #8e8d89); }
    .sub { font-size: 12px; color: var(--gray600, #8e8d89); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .fukt { position: absolute; right: 16px; bottom: 16px; width: 48px; height: calc(var(--h, 184px) - 92px); border-radius: 24px;
      background: var(--gray100, rgba(255,255,255,.08)); overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;
      border: 0; padding: 0; cursor: pointer; }
    .fukt i { display: block; height: 0; background: color-mix(in srgb, var(--fb) 55%, transparent); transition: height .6s; }
    .fukt ha-icon { position: absolute; left: 0; right: 0; top: 10px; margin: auto; --mdc-icon-size: 16px; color: var(--gray1000, #f2f1ee); }
    .kort.rolig .stov { display: none; }
    .kort.rolig .glyf { animation: none; }
    /* «Enkel»: grå flate, temperatur og fukt, og en grå fylt graf langs bunnen. */
    .kort.enkel .stovlag, .kort.enkel .glyf, .kort.enkel .topp, .kort.enkel .fukt, .kort.enkel .sub { display: none; }
    .kort.enkel .graf { height: 62%; right: 0 !important; }
    .kort.enkel .graf .linje { display: none; }
    .kort.enkel .graf .flate { fill: var(--graf-enkel, rgba(250,251,252,.16)); }
    .kort.enkel .bunn { top: 0; bottom: auto; height: 60%; justify-content: center; right: 18px !important; left: 22px; }
    .kort.enkel .temp b { font-size: 44px; }
    .kort.enkel .temp span { font-size: 13px; color: var(--gray1000, #f2f1ee); margin-left: 4px; font-weight: 500; }
    .kort.enkel .ikon { background: transparent; width: 40px; height: 40px; right: 10px; top: 10px; opacity: .55; }
    .kort.enkel .ikon ha-icon { --mdc-icon-size: 20px; }
    @media (prefers-reduced-motion: reduce) { .stov, .glyf { animation: none; } .stov { display: none; } }
  `;

  class KiRomHeroCard extends HTMLElement {
    static getStubConfig(hass) {
      const omr = hass && hass.areas ? Object.keys(hass.areas)[0] : undefined;
      return omr ? { omrade: omr } : { navn: "Stue" };
    }
    static getConfigForm() {
      return {
        schema: [
          { name: "omrade", selector: { area: {} } },
          { name: "navn", selector: { text: {} } },
          { name: "ikon", selector: { icon: {} } },
          { type: "expandable", name: "", title: "Entiteter (fylles ut fra området)", schema: [
            { name: "temperatur", selector: { entity: { domain: "sensor", device_class: "temperature" } } },
            { name: "fukt", selector: { entity: { domain: "sensor", device_class: "humidity" } } },
            { name: "klima", selector: { entity: { domain: "climate" } } },
            { name: "lys", selector: { entity: { domain: "light", multiple: true } } },
          ] },
          { type: "expandable", name: "", title: "Trykk", schema: [
            { name: "tap_action", selector: { ui_action: {} } },
            { name: "ikon_tap_action", selector: { ui_action: {} } },
            { name: "fukt_tap_action", selector: { ui_action: {} } },
            { name: "tannhjul", selector: { boolean: {} } },
          ] },
          { type: "expandable", name: "", title: "Utseende", schema: [
            { name: "farge", selector: { text: {} } },
            { name: "graf", selector: { boolean: {} } },
            { name: "stil", selector: { select: { mode: "dropdown", options: [{ value: "levende", label: "Levende" }, { value: "enkel", label: "Enkel (grå)" }] } } },
            { name: "animasjon", selector: { boolean: {} } },
          ] },
          { name: "hoyde", selector: { number: { min: 140, max: 320, step: 4, unit_of_measurement: "px", mode: "box" } } },
        ],
        computeLabel: (s) => ({ omrade: "Rom (område)", navn: "Navn", ikon: "Ikon", temperatur: "Temperatur", fukt: "Luftfuktighet",
          klima: "Termostat", lys: "Lys i rommet", tap_action: "Trykk på kortet", ikon_tap_action: "Trykk på ikonet",
          fukt_tap_action: "Trykk på fuktsøylen", tannhjul: "Tannhjul som åpner «Tilpass rommet»", farge: "Farge på grafen (f.eks. #80c3ff)", graf: "Vis temperaturgraf", stil: "Stil", animasjon: "Animasjon", hoyde: "Høyde" }[s.name] || s.name),
      };
    }

    setConfig(c) {
      this._c = { ...(c || {}) };
      this._auto = null;
      this._spenn = null; this._spennFor = null;
      if (this._hass) this._oppdater(true);
    }

    set hass(h) {
      const forste = !this._hass;
      this._hass = h;
      if (!this._c) return;
      if (forste || !this._auto) this._auto = this._finn();
      const ids = this._alleIds();
      const n = ids.map((id) => h.states[id]);
      if (this._bygget && this._siste && n.length === this._siste.length && n.every((s, i) => s === this._siste[i])) return;
      this._siste = n;
      this._oppdater();
    }

    connectedCallback() {
      clearInterval(this._timer);
      this._timer = setInterval(() => this._hentSpenn(true), 10 * 60 * 1000);
      /* Brukerens sensorvalg (ki_rom) kan endres i «Tilpass rommet» – finn entitetene på nytt. */
      if (!this._udLytter) {
        this._udLytter = (ev) => {
          if (!ev.detail || ev.detail.key !== "ki_rom" || !this._hass) return;
          this._siste = null;
          this._oppdater(true);
        };
        window.addEventListener("ki-ud", this._udLytter);
      }
    }
    disconnectedCallback() {
      clearInterval(this._timer);
      if (this._udLytter) { window.removeEventListener("ki-ud", this._udLytter); this._udLytter = null; }
    }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: 12, rows: 3, min_rows: 3 }; }

    /* ---------- oppsett ---------- */

    /* Finner rommets entiteter ut fra området: entitetens eget område, ellers enhetens. */
    _finn() {
      const c = this._c, h = this._hass;
      const ut = { temperatur: c.temperatur, fukt: c.fukt, klima: c.klima, lys: c.lys, navn: c.navn, ikon: c.ikon };
      const omr = c.omrade;
      /* Brukerens eget valg fra «Tilpass rommet» – bare når config ikke sier noe. */
      const K = window.KI || {};
      const ud = K.ud ? K.ud(h, "ki_rom") : null;
      const U = ud && typeof ud === "object" ? ud[c.rom_nokkel || omr] : null;
      if (U && typeof U === "object") {
        if (!ut.temperatur && U.temp && h.states[U.temp]) ut.temperatur = U.temp;
        if (!ut.fukt && U.fukt && h.states[U.fukt]) ut.fukt = U.fukt;
        if (U.farge) ut.farge = U.farge;
        if (U.stil) ut.stil = U.stil;
        if (U.animasjon === false) ut.animasjon = false;
      }
      if (!omr || !h.entities) return ut;
      const E = h.entities, D = h.devices || {};
      const iRom = Object.keys(E).filter((id) => {
        const e = E[id];
        if (!e || e.hidden || e.entity_category) return false;
        return (e.area_id || (e.device_id && D[e.device_id] && D[e.device_id].area_id)) === omr;
      }).filter((id) => h.states[id]);
      const dc = (id) => h.states[id].attributes.device_class;
      const velg = (liste) => liste.sort((a, b) => Number(ok(h.states[b])) - Number(ok(h.states[a])))[0];
      if (!ut.temperatur) ut.temperatur = velg(iRom.filter((id) => id.startsWith("sensor.") && dc(id) === "temperature"));
      if (!ut.fukt) ut.fukt = velg(iRom.filter((id) => id.startsWith("sensor.") && dc(id) === "humidity"));
      if (!ut.klima) ut.klima = iRom.find((id) => id.startsWith("climate."));
      if (!ut.lys) {
        // lysgrupper telles ikke to ganger: en lampe som står i en gruppe i rommet, hoppes over
        const lys = iRom.filter((id) => id.startsWith("light."));
        const iGruppe = new Set(lys.flatMap((id) => [].concat(h.states[id].attributes.entity_id || [])));
        ut.lys = lys.filter((id) => !iGruppe.has(id));
      }
      const a = h.areas && h.areas[omr];
      if (!ut.navn) ut.navn = a ? a.name : omr;
      if (!ut.ikon) ut.ikon = (a && a.icon) || "mdi:sofa";
      return ut;
    }

    _lysIds() {
      const a = this._auto || {};
      const liste = [].concat(a.lys || []).filter(Boolean);
      // en lysgruppe teller medlemmene
      return liste.flatMap((id) => {
        const s = this._hass.states[id];
        const m = s && s.attributes.entity_id;
        return Array.isArray(m) && m.length ? m : [id];
      });
    }

    _alleIds() {
      const a = this._auto || {};
      return [a.temperatur, a.fukt, a.klima, ...this._lysIds()].filter(Boolean);
    }

    /* Min og maks siste døgn fra historikken, hentet på nytt hvert tiende minutt. */
    async _hentSpenn(tving = false) {
      const id = this._tempKilde();
      if (!id || !this._hass || !this._hass.callWS) return;
      if (!tving && this._spennFor === id) return;
      this._spennFor = id;
      try {
        const slutt = new Date(), start = new Date(slutt.getTime() - 24 * 3600 * 1000);
        const erKlima = id.startsWith("climate.");
        const svar = await this._hass.callWS({
          type: "history/history_during_period", start_time: start.toISOString(), end_time: slutt.toISOString(),
          entity_ids: [id], minimal_response: !erKlima, no_attributes: !erKlima, significant_changes_only: false,
        });
        const rader = (svar && svar[id]) || [];
        const pkt = rader.map((r) => ({ t: Number(r.lu || r.lc) * 1000, v: parseFloat(erKlima ? (r.a && r.a.current_temperature) : r.s) }))
          .filter((x) => !isNaN(x.v) && !isNaN(x.t));
        const v = pkt.map((x) => x.v);
        this._spenn = v.length ? [Math.min(...v), Math.max(...v)] : null;
        this._punkter = pkt;
      } catch (e) {
        this._spenn = null;
        this._punkter = null;
      }
      this._siste = null;
      this._oppdater();
    }

    _tempKilde() {
      const a = this._auto || {};
      if (a.temperatur && this._hass.states[a.temperatur]) return a.temperatur;
      return a.klima && this._hass.states[a.klima] ? a.klima : null;
    }

    /* ---------- trykk ---------- */
    _handling(a, standardId) {
      a = a || { action: "more-info" };
      if (a.action === "none") return;
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* blokkert */ } }
      const id = a.entity || standardId;
      if (a.action === "navigate" && a.navigation_path) {
        if (a.navigation_path.startsWith("#")) { window.location.hash = a.navigation_path; return; }
        history.pushState(null, "", a.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
        return;
      }
      if (a.action === "more-info") {
        if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
        return;
      }
      this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a, entity: id }, action: "tap" }, bubbles: true, composed: true }));
    }

    /* ---------- tegning ---------- */
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="kort" role="button" tabindex="0">
          <div class="stovlag">${STOV.map(([x, d], i) => {
            const st = i % 3 ? 2 : 3;
            return `<span class="stov" data-i="${i}" style="left:${x}%;width:${st}px;height:${st}px;--d:${d}s"></span>`;
          }).join("")}</div>
          <svg class="graf" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="kiHeroFyll" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color:var(--f);stop-opacity:.22"></stop><stop offset="1" style="stop-color:var(--f);stop-opacity:0"></stop>
            </linearGradient></defs>
            <path class="flate"></path><path class="linje"></path>
          </svg>
          <span class="glyf"><ha-icon></ha-icon></span>
          <button class="ikon" aria-label="${this._c.tannhjul === false ? "Åpne rommet" : "Tilpass rommet"}"><ha-icon></ha-icon></button>
          <div class="topp"><span class="navn"></span><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span></div>
          <div class="bunn"><div class="temp"><b></b><span>°</span></div><span class="sub"></span></div>
          <button class="fukt" aria-label="Luftfuktighet"><i></i><ha-icon icon="mdi:water"></ha-icon></button>
        </div>`;
      const r = this.shadowRoot;
      const kort = r.querySelector(".kort");
      kort.addEventListener("click", () => this._handling(this._c.tap_action, this._tempKilde()));
      kort.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._handling(this._c.tap_action, this._tempKilde()); } });
      r.querySelector(".ikon").addEventListener("click", (e) => {
        e.stopPropagation();
        const a = this._auto || {};
        if (!this._c.ikon_tap_action && this._c.tannhjul !== false) {
          /* Tannhjulet: be rom-kortet rundt oss åpne «Tilpass rommet». */
          const ev = new CustomEvent("ki-rom-tilpass", { detail: { omrade: this._c.omrade }, bubbles: true, composed: true, cancelable: true });
          this.dispatchEvent(ev);
          if (ev.defaultPrevented) { if (navigator.vibrate) { try { navigator.vibrate(8); } catch (x) { /* blokkert */ } } return; }
        }
        this._handling(this._c.ikon_tap_action || (a.klima ? { action: "more-info" } : { action: "none" }), a.klima);
      });
      r.querySelector(".fukt").addEventListener("click", (e) => {
        e.stopPropagation();
        const a = this._auto || {};
        this._handling(this._c.fukt_tap_action, a.fukt || a.klima);
      });
      this._bygget = true;
    }

    _oppdater(ny = false) {
      if (!this._hass || !this._c) return;
      if (ny || !this._auto) this._auto = this._finn();
      if (!this._bygget) this._bygg();
      this._hentSpenn();
      const h = this._hass, a = this._auto, c = this._c;
      const S = (id) => (id ? h.states[id] : undefined);
      const $ = (q) => this.shadowRoot.querySelector(q);
      const k = S(a.klima);

      const temp = !isNaN(tall(S(a.temperatur))) ? tall(S(a.temperatur)) : k ? parseFloat(k.attributes.current_temperature) : NaN;
      const fukt = !isNaN(tall(S(a.fukt))) ? tall(S(a.fukt)) : k ? parseFloat(k.attributes.current_humidity) : NaN;
      const mal = k && ok(k) && k.state !== "off" ? parseFloat(k.attributes.temperature) : NaN;
      const handling = k ? String(k.attributes.hvac_action || "") : "";
      const varmer = !!k && k.state !== "off" && (handling === "heating" || (!handling && !isNaN(mal) && !isNaN(temp) && mal > temp));
      const lysPa = this._lysIds().filter((id) => (S(id) || {}).state === "on").length;
      // som i designet: fargen følger varme, så lys; teksten følger varme, så mål, så lys
      const modus = varmer ? "varmer" : lysPa > 0 ? "lys" : "rolig";
      const f = c.farge || a.farge || (modus === "varmer" ? F.rod : modus === "lys" ? F.gul : F.bla);

      const kort = $(".kort");
      kort.style.background = c.bakgrunn || BAK;
      kort.style.setProperty("--f", f);
      kort.style.setProperty("--h", `${Number(c.hoyde) || 184}px`);
      this.shadowRoot.querySelectorAll(".stov").forEach((el) => {
        const i = Number(el.dataset.i);
        el.style.setProperty("--t", `${(modus === "varmer" ? 3 : 6) + (i % 3) * 0.8}s`);
      });

      $(".glyf ha-icon").setAttribute("icon", modus === "varmer" ? "mdi:fire" : modus === "lys" ? "mdi:lightbulb-on" : "mdi:weather-windy");
      $(".ikon ha-icon").setAttribute("icon", c.tannhjul === false || c.ikon_tap_action ? (a.ikon || "mdi:sofa") : "mdi:cog");
      $(".navn").textContent = a.navn || "";

      const pi = varmer ? "mdi:fire" : lysPa ? "mdi:lightbulb" : "mdi:check";
      const pt = varmer ? (isNaN(mal) ? "Varmer" : `Varmer til ${komma(mal)}°`)
        : !isNaN(mal) ? `Holder ${komma(mal)}°` : lysPa ? `${lysPa} lys på` : "Alt er rolig";
      $(".pille ha-icon").setAttribute("icon", pi);
      $(".pt").textContent = pt;

      const enkel = c.stil === "enkel" || a.stil === "enkel";
      kort.classList.toggle("enkel", enkel);
      kort.classList.toggle("rolig", c.animasjon === false || a.animasjon === false);
      $(".temp b").textContent = enkel ? `${komma(temp)}°` : komma(temp);
      $(".temp span").textContent = enkel ? (isNaN(fukt) ? "" : `${komma(fukt, 0)}%`) : "°";
      const deler = [];
      if (!isNaN(fukt)) deler.push(`${komma(fukt, 0)} % fukt`);
      if (this._spenn) {
        // dagens verdi skal alltid være innenfor spennet
        const lo = Math.min(this._spenn[0], isNaN(temp) ? Infinity : temp), hi = Math.max(this._spenn[1], isNaN(temp) ? -Infinity : temp);
        deler.push(`${komma(lo)}–${komma(hi)}° siste døgn`);
      }
      $(".sub").textContent = deler.join(" · ");

      const fs = $(".fukt");
      fs.style.display = isNaN(fukt) ? "none" : "";
      fs.style.setProperty("--fb", fukt > 60 ? F.rav : F.bla);
      $(".fukt i").style.height = `${Math.max(0, Math.min(100, isNaN(fukt) ? 0 : fukt))}%`;
      fs.setAttribute("aria-label", `Luftfuktighet ${komma(fukt, 0)} %`);
      $(".bunn").style.right = isNaN(fukt) ? "18px" : "84px";
      this._tegnGraf(temp, !isNaN(fukt));

      kort.setAttribute("aria-label", `${a.navn || ""}: ${komma(temp)} grader. ${pt}. ${$(".sub").textContent}`);
    }
  }

  /* Temperaturgrafen siste døgn: tidsakse fra 24 t siden til nå, trinnvis som historikken,
     med dagens verdi som siste punkt. */
  KiRomHeroCard.prototype._tegnGraf = function (naa, harFukt) {
    const svg = this.shadowRoot.querySelector(".graf");
    const pkt = (this._punkter || []).slice();
    if (this._c.graf === false || pkt.length < 2 && isNaN(naa)) { svg.style.display = "none"; return; }
    const slutt = Date.now(), start = slutt - 24 * 3600 * 1000;
    if (!isNaN(naa)) pkt.push({ t: slutt, v: naa });
    if (pkt.length < 2) { svg.style.display = "none"; return; }
    svg.style.display = "";
    svg.style.right = "0";
    /* Snitt per halvtime (siste verdi bæres videre), så en glatt kurve gjennom punktene. */
    const N = 48, spor = [];
    let j = 0, sist = pkt[0].v;
    for (let i = 0; i <= N; i++) {
      const t = start + (i / N) * (slutt - start);
      const del = [];
      while (j < pkt.length && pkt[j].t <= t) { del.push(pkt[j].v); sist = pkt[j].v; j++; }
      spor.push(del.length ? del.reduce((x, y) => x + y, 0) / del.length : sist);
    }
    let lo = Math.min(...spor), hi = Math.max(...spor);
    if (hi - lo < 1) { const m = (hi + lo) / 2; lo = m - 0.5; hi = m + 0.5; }
    const P = spor.map((x, i) => [(i / N) * 100, 38 - ((x - lo) / (hi - lo)) * 26]);
    let d = "M" + P[0][0].toFixed(2) + " " + P[0][1].toFixed(2);
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + c1.map((x) => x.toFixed(2)).join(" ") + " " + c2.map((x) => x.toFixed(2)).join(" ") + " " + p2.map((x) => x.toFixed(2)).join(" ");
    }
    svg.querySelector(".linje").setAttribute("d", d);
    svg.querySelector(".flate").setAttribute("d", d + " L100 40 L0 40 Z");
  };

  if (!customElements.get("ki-rom-hero-card")) customElements.define("ki-rom-hero-card", KiRomHeroCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-rom-hero-card"))
    window.customCards.push({ type: "ki-rom-hero-card", name: "KI Rom (hero)",
      description: "Toppkortet for et rom: temperatur, fukt, spennet siste døgn og en levende bakgrunn som følger varme og lys.", preview: true });
  console.info(`%c KI-ROM-HERO %c ${VERSJON} `, "color:#fff;background:#463a40", "color:#463a40;background:#efc6c9");
})();

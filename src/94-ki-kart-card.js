/*
 * ki-kart-card — hvor er alle? Kartet med sonene, personene og bilen, og under det en
 * liste med hvor hver enkelt er, siden når og hvor langt unna hjemme.
 *
 * Kartet er Home Assistants eget kartkort (Leaflet), montert inne i kortet. Sonene
 * tegnes som sirkler, personene med bildet sitt, og bilen med sitt ikon.
 *
 * type: custom:ki-kart-card
 * personer: [person.sebastian_kristo_jemtland, person.cybele_kristo, person.rune_jemtland]
 * bil: device_tracker.tesla_model_y_location     # finnes av seg selv (Tesla-sporer med posisjon)
 * bil_batteri: sensor.tesla_model_y_batteri       # finnes av seg selv
 * soner: auto                                     # auto = alle zone.*, eller en liste
 * forhold: "16:10"                                # kartets sideforhold
 * zoom: 11
 */
(() => {
  const VERSJON = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SONEFARGER = ["var(--green, #6fcf8e)", "var(--blue, #6f9fe0)", "var(--orange, #f2a33c)", "var(--purple, #b39cf0)",
    "var(--pink, #ff8ac0)", "var(--teal, #40c8e0)", "var(--yellow, #f2c94c)"];

  /* Avstand i km mellom to punkt (haversine). */
  function km(a, b) {
    const R = 6371, rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function siden(iso) {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return "akkurat nå";
    if (min < 60) return `i ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `i ${h} t`;
    const d = Math.round(h / 24);
    return `i ${d} ${d === 1 ? "dag" : "dager"}`;
  }

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .kk { display: grid; gap: 14px; color: var(--gray1000, #f2f1ee); }
    .kart { position: relative; border-radius: 24px; overflow: hidden; background: var(--gray200, #1b1b1d); min-height: 200px;
      --ha-card-border-radius: 24px; --ha-card-border-width: 0; }
    .kart .laster { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; opacity: .6; }
    .etikett { font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--gray800, #8e8d89); padding: 0 4px; }
    .liste { display: grid; gap: 8px; }
    .rad { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 14px 10px 10px;
      border-radius: 20px; background: var(--gray200, #1b1b1d); text-align: left; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .rad:active { transform: scale(.98); }
    .bilde { position: relative; width: 48px; height: 48px; border-radius: 50%; background: var(--gray100, #26262a) center/cover no-repeat;
      display: grid; place-items: center; box-shadow: 0 0 0 2px var(--rf, transparent); }
    .bilde ha-icon { --mdc-icon-size: 24px; }
    .bilde .merke { position: absolute; right: -3px; bottom: -3px; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
      background: var(--rf, var(--gray400, #48474a)); color: var(--black, #161618); border: 2px solid var(--gray200, #1b1b1d); }
    .bilde .merke ha-icon { --mdc-icon-size: 12px; }
    .navn { font-size: 15px; font-weight: 500; }
    .hvor { font-size: 13px; font-weight: 500; opacity: .7; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hoyre { text-align: right; display: grid; gap: 2px; }
    .hoyre b { font-size: 16px; font-weight: 300; font-variant-numeric: tabular-nums; }
    .hoyre small { font-size: 12px; opacity: .6; }
    .soner { display: flex; flex-wrap: wrap; gap: 6px; }
    .sone { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px 0 10px; border-radius: 17px; font-size: 13px; font-weight: 500;
      background: color-mix(in srgb, var(--sf) 14%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sf) 35%, transparent); }
    .sone i { width: 8px; height: 8px; border-radius: 50%; background: var(--sf); }
    .sone.tom { background: var(--gray100, #1f1f22); box-shadow: none; opacity: .7; }
    .sone.tom i { background: var(--gray400, #48474a); }
    .sone small { opacity: .7; font-weight: 400; }
  `;

  class KiKartCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; }
    static getStubConfig() { return { personer: [] }; }
    getCardSize() { return 10; }

    setConfig(c) {
      this._c = { zoom: 11, soner: "auto", ...c };
      this._kart = null;
      this._bygget = false;
      if (this._hass) this._tegn();
    }

    set hass(h) {
      this._hass = h;
      if (this._kart) this._kart.hass = h;
      const ids = [...this._personer(), this._bil(), this._bilBatteri(), ...this._soner()].filter(Boolean);
      const sig = ids.map((id) => { const s = h.states[id]; return s ? `${s.state}|${s.last_changed}|${s.attributes.latitude}` : "-"; }).join(",");
      if (sig === this._sig && this._bygget) return;
      this._sig = sig;
      this._tegn();
    }

    /* ---------- hvem og hva ---------- */
    _personer() {
      if (this._c.personer && this._c.personer.length) return [].concat(this._c.personer).map((p) => (typeof p === "string" ? p : p.entity));
      return Object.keys((this._hass || {}).states || {}).filter((id) => id.startsWith("person."));
    }

    /* Bilen: en sporer med «tesla» (eller bil_navn) i id-en og en posisjon. Ruter og mål
       (route/destination) hoppes over – det er posisjonen vi vil ha. */
    _bil() {
      if (this._c.bil !== undefined) return this._c.bil || null;
      if (this._bilAuto !== undefined) return this._bilAuto;
      const S = (this._hass || {}).states || {};
      const navn = new RegExp(this._c.bil_navn || "tesla|model_y|bil", "i");
      const kandidater = Object.keys(S).filter((id) => id.startsWith("device_tracker.") && navn.test(id)
        && !/route|rute|destin|mal$/i.test(id) && S[id].attributes.latitude != null);
      kandidater.sort((a, b) => (/location|plassering|posisjon/.test(b) ? 1 : 0) - (/location|plassering|posisjon/.test(a) ? 1 : 0));
      this._bilAuto = kandidater[0] || null;
      return this._bilAuto;
    }

    _bilBatteri() {
      if (this._c.bil_batteri !== undefined) return this._c.bil_batteri || null;
      const S = (this._hass || {}).states || {};
      const navn = new RegExp(this._c.bil_navn || "tesla|model_y", "i");
      return Object.keys(S).find((id) => id.startsWith("sensor.") && navn.test(id) && /batter/i.test(id) && !/rekkevidde|range|temp/i.test(id)
        && S[id].attributes.unit_of_measurement === "%") || null;
    }

    _soner() {
      if (Array.isArray(this._c.soner)) return this._c.soner;
      return Object.keys((this._hass || {}).states || {}).filter((id) => id.startsWith("zone."));
    }

    _pos(id) {
      const s = this._hass.states[id];
      if (!s || s.attributes.latitude == null) return null;
      return { lat: Number(s.attributes.latitude), lon: Number(s.attributes.longitude) };
    }

    _soneNavn(tilstand) {
      if (tilstand === "home") return "Hjemme";
      if (tilstand === "not_home") return "Borte";
      if (["unknown", "unavailable"].includes(tilstand)) return "Ukjent";
      const z = Object.keys(this._hass.states).find((id) => id.startsWith("zone.") && (id.slice(5) === tilstand
        || (this._hass.states[id].attributes.friendly_name || "").toLowerCase() === String(tilstand).toLowerCase()));
      return z ? this._hass.states[z].attributes.friendly_name : tilstand;
    }

    _mer(id) {
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: id };
      this.dispatchEvent(ev);
    }

    /* ---------- tegning ---------- */
    _tegn() {
      if (!this._hass || !this._c) return;
      if (!this._bygget) this._bygg();
      const hjem = this._pos("zone.home");
      const soner = this._soner();
      const farge = {};
      soner.forEach((z, i) => { farge[z] = z === "zone.home" ? "var(--green, #6fcf8e)" : SONEFARGER[(i + 1) % SONEFARGER.length]; });
      const soneFor = (tilstand) => {
        if (tilstand === "home") return "zone.home";
        return soner.find((z) => z.slice(5) === tilstand
          || ((this._hass.states[z] || {}).attributes || {}).friendly_name === tilstand) || null;
      };

      const rader = [];
      for (const id of this._personer()) {
        const s = this._hass.states[id];
        if (!s) continue;
        const z = soneFor(s.state);
        const rf = z ? farge[z] : s.state === "not_home" ? "var(--gray600, #6d6c69)" : "var(--gray400, #48474a)";
        const pos = this._pos(id);
        const avstand = hjem && pos && s.state !== "home" ? km(hjem, pos) : null;
        const bilde = s.attributes.entity_picture;
        rader.push(`<button class="rad" data-mer="${esc(id)}">
          <span class="bilde" style="--rf:${rf};${bilde ? `background-image:url('${esc(bilde)}')` : ""}">
            ${bilde ? "" : `<ha-icon icon="mdi:account"></ha-icon>`}
            <span class="merke"><ha-icon icon="${s.state === "home" ? "mdi:home" : z ? "mdi:map-marker" : "mdi:walk"}"></ha-icon></span></span>
          <span><div class="navn">${esc((s.attributes.friendly_name || id).split(" ")[0])}</div>
            <div class="hvor">${esc(this._soneNavn(s.state))} · ${esc(siden(s.last_changed))}</div></span>
          <span class="hoyre">${avstand != null ? `<b>${avstand < 10 ? avstand.toFixed(1).replace(".", ",") : Math.round(avstand)} km</b><small>fra hjemme</small>` : ""}</span>
        </button>`);
      }
      const bil = this._bil();
      if (bil && this._hass.states[bil]) {
        const s = this._hass.states[bil];
        const z = soneFor(s.state);
        const pos = this._pos(bil);
        const avstand = hjem && pos && s.state !== "home" ? km(hjem, pos) : null;
        const bat = this._hass.states[this._bilBatteri()];
        const batPst = bat ? Math.round(Number(bat.state)) : null;
        rader.push(`<button class="rad" data-mer="${esc(bil)}">
          <span class="bilde" style="--rf:${z ? farge[z] : "var(--gray400, #48474a)"}"><ha-icon icon="mdi:car-electric"></ha-icon>
            <span class="merke"><ha-icon icon="${s.state === "home" ? "mdi:home" : "mdi:map-marker"}"></ha-icon></span></span>
          <span><div class="navn">${esc(this._c.bil_tittel || "Bilen")}</div>
            <div class="hvor">${esc(this._soneNavn(s.state))} · ${esc(siden(s.last_changed))}</div></span>
          <span class="hoyre">${batPst != null && !isNaN(batPst) ? `<b>${batPst} %</b><small>${avstand != null ? `${avstand < 10 ? avstand.toFixed(1).replace(".", ",") : Math.round(avstand)} km unna` : "batteri"}</small>`
            : avstand != null ? `<b>${Math.round(avstand)} km</b><small>fra hjemme</small>` : ""}</span>
        </button>`);
      }

      // sonene, med hvem som er der
      const hvem = {};
      for (const id of [...this._personer(), bil].filter(Boolean)) {
        const s = this._hass.states[id]; if (!s) continue;
        const z = soneFor(s.state); if (!z) continue;
        (hvem[z] = hvem[z] || []).push(id === bil ? (this._c.bil_tittel || "Bilen") : (s.attributes.friendly_name || id).split(" ")[0]);
      }
      const soneBrikker = soner.map((z) => {
        const zs = this._hass.states[z]; if (!zs) return "";
        const her = hvem[z] || [];
        return `<button class="sone ${her.length ? "" : "tom"}" style="--sf:${farge[z]}" data-mer="${esc(z)}"><i></i>${esc(zs.attributes.friendly_name || z)}
          ${her.length ? `<small>${esc(her.join(", "))}</small>` : ""}</button>`;
      }).join("");

      const r = this.shadowRoot;
      r.getElementById("liste").innerHTML = rader.join("") || `<div class="hvor">Ingen personer funnet.</div>`;
      r.getElementById("soner").innerHTML = soneBrikker;
      r.querySelectorAll("[data-mer]").forEach((b) => { b.onclick = () => {
        try { window.dispatchEvent(new CustomEvent("haptic", { detail: "light", bubbles: true, composed: true })); } catch (e) { /* eldre */ }
        this._mer(b.dataset.mer);
      }; });
    }

    _bygg() {
      const r = this.shadowRoot;
      r.innerHTML = `<style>${CSS}</style>
        <div class="kk">
          <div class="kart"><div class="laster">Laster kartet …</div></div>
          <div class="etikett">Hvor er alle</div>
          <div class="liste" id="liste"></div>
          <div class="etikett">Soner</div>
          <div class="soner" id="soner"></div>
        </div>`;
      this._bygget = true;
      this._monterKart();
    }

    async _monterKart() {
      const vert = this.shadowRoot.querySelector(".kart");
      const entities = [...this._personer(), this._bil(), ...this._soner()].filter(Boolean);
      try {
        const hjelp = await window.loadCardHelpers();
        const kart = hjelp.createCardElement({
          type: "map", entities, theme_mode: this._c.tema || "dark", default_zoom: Number(this._c.zoom) || 11,
          hours_to_show: Number(this._c.timer_spor) || 0, fit_zones: false, auto_fit: true,
          aspect_ratio: this._c.forhold || "16:10",
        });
        kart.hass = this._hass;
        vert.innerHTML = "";
        vert.appendChild(kart);
        this._kart = kart;
      } catch (e) {
        vert.innerHTML = `<div class="laster">Fikk ikke lastet kartet</div>`;
      }
    }
  }

  if (!customElements.get("ki-kart-card")) customElements.define("ki-kart-card", KiKartCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-kart-card"))
    window.customCards.push({ type: "ki-kart-card", name: "KI Kart",
      description: "Kartet med sonene, personene og bilen, med hvor hver enkelt er, siden når og hvor langt unna.", preview: false });
  console.info(`%c KI-KART %c ${VERSJON} `, "color:#fff;background:#463a40", "color:#463a40;background:#efc6c9");
})();

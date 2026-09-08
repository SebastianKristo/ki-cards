/**
 * ki-energi-card.js
 * Frontend for KI-energimotoren (pyscript ki_energi.py).
 *
 *  Enkel     : status med timebudsjett, forklaring, laster og bereder
 *  Avansert  : prognose, overstyring, statistikk, innstillinger, beslutningslogg
 *
 * Kopier til /config/www/ki-energi-card.js og legg til som ressurs:
 *   URL:  /local/ki-energi-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-energi-card
 */

const KI_ENERGI_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-ENERGI-CARD %c ${KI_ENERGI_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#4caf50;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const SONE_TEKST = {
  gronn: "God margin",
  gul: "Nærmer seg grensen",
  oransje: "Liten margin",
  rod: "Fare for ny topp",
  kritisk: "Kritisk",
  fallback: "Trygg fallback",
  av: "Motoren er av",
};

const HANDLING = {
  normal: { tekst: "Normal", klasse: "ok" },
  senket: { tekst: "Senket", klasse: "advarsel" },
  utsatt: { tekst: "Utsatt", klasse: "advarsel" },
  "på": { tekst: "På", klasse: "ok" },
  av: { tekst: "Av", klasse: "nøytral" },
  utilgjengelig: { tekst: "Utilgjengelig", klasse: "feil" },
};

const escE = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfE = (v, d) => { const n = Number(v); return isFinite(n) ? n.toFixed(d).replace(".", ",") : "–"; };

class KiEnergiCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-energi-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-energi-card" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._apneSoner = new Set();
  }

  setConfig(config) {
    this._config = Object.assign({
      title: "",
      default_view: "enkel",
      remember_view: true,
      status: "sensor.ki_energi_status",
      laster: "sensor.ki_laster",
      bereder: "sensor.ki_bereder",
      logg: "sensor.ki_beslutningslogg",
      tau: "sensor.ki_tidskonstanter",
    }, config || {});
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 24 : 12; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-energi-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-energi-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|";
    for (const id of this._watched) {
      const s = hass.states[id];
      sig += (s ? s.state + (s.last_updated || "") : "-") + ",";
    }
    if (sig !== this._sig) { this._sig = sig; this._update(); }
  }

  /* ------------------------------------------------------------ */

  _build() {
    const c = this._config;
    this._watched = new Set([c.status, c.laster, c.bereder, c.logg, c.tau,
      "input_boolean.ki_energi_hovedbryter", "input_boolean.ki_skyggemodus",
      "input_boolean.ki_dynamisk_grense", "input_boolean.ki_prediktiv_forvarming",
      "input_boolean.ki_laering_tau", "input_boolean.ki_solkompensasjon",
      "input_boolean.ki_nattsenk_okonomi", "input_boolean.ki_bereder_styring",
      "input_boolean.ki_legionella_aktiv", "input_boolean.ki_handkle_styring",
      "input_boolean.ki_energi_varsler",
      "input_number.ki_maks_time_kwh", "input_number.ki_mal_snitt_kwh",
      "input_number.ki_komfort_vekt", "input_number.ki_shed_gulv_maks",
      "input_number.ki_shed_panel_maks",
      "input_number.ki_stat_unngatte_topper", "input_number.ki_stat_shed_hendelser",
      "input_number.ki_stat_flyttet_kwh", "input_number.ki_stat_spart_kwh",
      "input_text.ki_varsel_mottakere",
      "sensor.nettleie_elvia_kapasitetstrinn", "sensor.nettleie_elvia_margin_til_neste_trinn",
      "sensor.nettleie_elvia_toppforbruk", "sensor.nettleie_elvia_toppforbruk_2",
      "sensor.nettleie_elvia_toppforbruk_3",
      "sensor.ki_uregulert_effekt", "sensor.ki_styrt_effekt", "sensor.strommaler_effekt",
    ]);

    this.shadowRoot.innerHTML = `<style>${KiEnergiCard.styles}</style>
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escE(c.title)}</div>` : ""}
          <div id="hero"></div>
          <div class="switch" role="tablist">
            <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
            <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
          </div>
          <div id="budsjett"></div>
          <div id="laster"></div>
          <div class="avansert-kun">
            <div id="topper"></div>
            <div id="tau"></div>
            <div id="statistikk"></div>
            <div id="innstillinger"></div>
            <div id="logg"></div>
          </div>
        </div>
      </ha-card>`;

    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _st(id) { return this._hass.states[id]; }
  _attr(id, n, d) { const s = this._st(id); return s && s.attributes[n] !== undefined ? s.attributes[n] : d; }

  /* ------------------------------------------------------------ */

  _update() {
    if (!this._hass || !this._built) return;
    this._renderHero();
    this._renderBudsjett();
    this._renderLaster();
    if (this._view === "avansert") {
      this._renderTopper();
      this._renderTau();
      this._renderStatistikk();
      this._renderInnstillinger();
      this._renderLogg();
    }
  }

  _renderHero() {
    const s = this._st(this._config.status);
    const sone = s ? s.state : "ukjent";
    const forklaring = this._attr(this._config.status, "forklaring", "Venter på motoren …");
    const skygge = this._attr(this._config.status, "skyggemodus", false);
    const forbrukt = Number(this._attr(this._config.status, "forbrukt_kwh", NaN));
    const grense = Number(this._attr(this._config.status, "grense_kwh", NaN));
    const pct = isFinite(forbrukt) && isFinite(grense) && grense > 0
      ? Math.max(0, Math.min(100, (forbrukt / grense) * 100)) : 0;
    const omkrets = 2 * Math.PI * 43;

    this._root.getElementById("hero").innerHTML = `
      <div class="hero" data-sone="${escE(sone)}">
        <div class="ring" data-action="more" data-entity="${escE(this._config.status)}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-spor" cx="50" cy="50" r="43"></circle>
            <circle class="ring-fyll" cx="50" cy="50" r="43"
              style="stroke-dasharray:${omkrets};stroke-dashoffset:${omkrets * (1 - pct / 100)}"></circle>
          </svg>
          <div class="ring-tall">${isFinite(pct) ? Math.round(pct) : "–"}<span>%</span></div>
        </div>
        <div class="hero-tekst">
          <div class="hero-navn">${escE(SONE_TEKST[sone] || sone)}${skygge ? ' <span class="merke">skygge</span>' : ""}</div>
          <div class="hero-forklaring">${escE(forklaring)}</div>
        </div>
      </div>`;
  }

  _renderBudsjett() {
    const a = (n, d) => this._attr(this._config.status, n, d);
    const igjen = Number(a("igjen_kwh", NaN));
    const min = a("minutter_igjen", "–");
    const tillatt = Number(a("tillatt_effekt_kw", NaN));
    const forventet = Number(a("forventet_effekt_kw", NaN));
    const uregulert = Number(a("uregulert_kw", NaN));
    const u60 = Number(a("uregulert_60_kw", NaN));
    const ledig = Number(a("ledig_kw", NaN));
    const grensegrunn = a("grense_grunn", "");
    const usikker = a("usikkert_grunnlag", false);
    const bredde = isFinite(forventet) && isFinite(tillatt) && tillatt > 0
      ? Math.max(0, Math.min(100, (forventet / tillatt) * 100)) : 0;

    this._root.getElementById("budsjett").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Timebudsjett</span><span class="blokk-sub">${min} min igjen av timen</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(igjen, 2)}</b><span>kWh igjen</span></div>
          <div class="tall"><b>${nfE(tillatt, 2)}</b><span>kW tillatt nå</span></div>
          <div class="tall"><b>${nfE(forventet, 2)}</b><span>kW forventet</span></div>
        </div>
        <div class="spor"><div class="fyll" style="width:${bredde}%"></div></div>
        <div class="under">
          <span>Uregulert nå ${nfE(uregulert, 2)} kW · om en time ${nfE(u60, 2)} kW</span>
          <span>${isFinite(ledig) ? nfE(ledig, 2) + " kW ledig" : ""}</span>
        </div>
        ${grensegrunn ? `<div class="notat">${escE(grensegrunn)}</div>` : ""}
        ${usikker ? `<div class="notat advarsel-tekst">Timesmåleren mangler — motoren regner på øyeblikkseffekt</div>` : ""}
      </div>`;
  }

  _renderLaster() {
    const liste = this._attr(this._config.laster, "laster", []) || [];
    const enkel = this._view !== "avansert";
    const vist = enkel ? liste.filter((l) => l.handling !== "normal" || (l.naa !== null && l.mal !== null)) : liste;

    const rader = vist.map((l) => {
      const h = HANDLING[l.handling] || { tekst: l.handling || "–", klasse: "nøytral" };
      const apen = this._apneSoner.has(l.key);
      const temp = l.naa !== null && l.naa !== undefined
        ? `${nfE(l.naa, 1)}° → ${l.settpunkt !== null && l.settpunkt !== undefined ? nfE(l.settpunkt, 1) : nfE(l.mal, 1)}°`
        : `${nfE(l.effekt, 2)} kW`;
      return `
        <div class="last ${apen ? "apen" : ""}" data-key="${escE(l.key)}">
          <div class="last-hode" data-action="apne" data-key="${escE(l.key)}">
            <div class="prikk p-${h.klasse}"></div>
            <div class="last-tekst">
              <div class="last-navn">${escE(l.navn)}${l.overstyrt ? ' <span class="merke">manuell</span>' : ""}</div>
              <div class="last-forklaring">${escE(l.forklaring || "")}</div>
            </div>
            <div class="last-verdi">${escE(temp)}</div>
          </div>
          <div class="last-kropp">
            <div class="last-fakta">
              <span>Prioritet ${escE(l.prio)}</span>
              <span>${escE(l.type)}</span>
              <span>${nfE(l.effekt, 2)} kW</span>
              <span class="badge b-${h.klasse}">${escE(h.tekst)}</span>
            </div>
            ${l.type !== "bryter" ? `
              <div class="overstyr">
                <div class="ov-tittel">Overstyr midlertidig</div>
                <div class="ov-rad">
                  <div class="steg" data-action="ov-temp" data-key="${escE(l.key)}" data-dir="-1">−</div>
                  <div class="ov-verdi" data-ov="${escE(l.key)}">${nfE(l.mal, 1)}</div>
                  <div class="steg" data-action="ov-temp" data-key="${escE(l.key)}" data-dir="1">+</div>
                  <div class="ov-knapp" data-action="ov-sett" data-key="${escE(l.key)}" data-min="120">2 t</div>
                  <div class="ov-knapp" data-action="ov-sett" data-key="${escE(l.key)}" data-min="360">6 t</div>
                  ${l.overstyrt ? `<div class="ov-knapp fjern" data-action="ov-fjern" data-key="${escE(l.key)}">Fjern</div>` : ""}
                </div>
              </div>` : ""}
          </div>
        </div>`;
    }).join("");

    this._root.getElementById("laster").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Laster</span><span class="blokk-sub">Sortert etter prioritet i motoren</span></div>
        ${rader || '<div class="notat">Ingen laster rapportert ennå.</div>'}
      </div>`;
  }

  _renderTopper() {
    const t = ["sensor.nettleie_elvia_toppforbruk", "sensor.nettleie_elvia_toppforbruk_2", "sensor.nettleie_elvia_toppforbruk_3"]
      .map((id) => Number((this._st(id) || {}).state));
    const trinn = (this._st("sensor.nettleie_elvia_kapasitetstrinn") || {}).state || "–";
    const margin = (this._st("sensor.nettleie_elvia_margin_til_neste_trinn") || {}).state;
    const snitt = t.every(isFinite) ? (t[0] + t[1] + t[2]) / 3 : NaN;
    const b = this._st(this._config.bereder);
    const ba = b ? b.attributes : {};

    this._root.getElementById("topper").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Månedens topper</span><span class="blokk-sub">${escE(trinn)}</span></div>
        <div class="tall-rutenett">
          ${t.map((v, i) => `<div class="tall"><b>${nfE(v, 2)}</b><span>topp ${i + 1}</span></div>`).join("")}
        </div>
        <div class="under"><span>Snitt ${nfE(snitt, 2)} kWh — dette er tallet Elvia fakturerer etter</span>
          <span>${margin !== undefined ? "Margin " + escE(margin) : ""}</span></div>
      </div>
      <div class="blokk">
        <div class="blokk-hode"><span>Varmtvann</span><span class="blokk-sub">${escE(b ? b.state : "–")}</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(ba.minutter_i_dag, 0)}</b><span>min i dag</span></div>
          <div class="tall"><b>${nfE(ba.mangler_minutter, 0)}</b><span>min igjen</span></div>
          <div class="tall"><b>${nfE(ba.dager_siden_legionella, 0)}</b><span>d siden legionella</span></div>
        </div>
        <div class="notat">${escE(ba.forklaring || "")}</div>
        <div class="hurtig">
          <div class="mini" data-action="tjeneste" data-domene="pyscript" data-tjeneste="ki_legionella_na">Kjør legionella nå</div>
          <div class="mini" data-action="more" data-entity="switch.varmtvannsbereder">Åpne berederen</div>
        </div>
      </div>`;
  }

  _renderTau() {
    const soner = this._attr(this._config.tau, "soner", {}) || {};
    const rader = Object.entries(soner).map(([navn, v]) => `
      <div class="rad rad-les">
        <div class="rad-navn">${escE(navn)}</div>
        <div class="rad-verdi">${v.tau_timer ? nfE(v.tau_timer, 1) + " t" : "–"} · ${v.grader_per_time ? nfE(v.grader_per_time, 1) + " °C/t" : "–"} <span class="svak">(${v.malinger || 0})</span></div>
      </div>`).join("");
    this._root.getElementById("tau").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Innlærte tidskonstanter</span><span class="blokk-sub">Tidskonstant · oppvarming · målinger</span></div>
        ${rader || '<div class="notat">Motoren har ikke lært nok ennå. Tallene kommer etter noen døgn.</div>'}
      </div>`;
  }

  _renderStatistikk() {
    const g = (id) => Number((this._st(id) || {}).state);
    this._root.getElementById("statistikk").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Denne måneden</span><span class="blokk-sub">Estimat, ikke måling</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(g("input_number.ki_stat_unngatte_topper"), 0)}</b><span>unngåtte topper</span></div>
          <div class="tall"><b>${nfE(g("input_number.ki_stat_shed_hendelser"), 0)}</b><span>utkoblinger</span></div>
          <div class="tall"><b>${nfE(g("input_number.ki_stat_flyttet_kwh"), 2)}</b><span>kWh flyttet</span></div>
        </div>
        <div class="notat">Flyttet energi er varme som ble utsatt til senere i timen eller døgnet. Tallene nullstilles den 1.</div>
      </div>`;
  }

  _renderInnstillinger() {
    const brytere = [
      ["input_boolean.ki_energi_hovedbryter", "Energimotor", "Hovedbryter"],
      ["input_boolean.ki_skyggemodus", "Skyggemodus", "Regner og logger, styrer ingenting"],
      ["input_boolean.ki_dynamisk_grense", "Dynamisk grense", "Regner mot snittet av tre topper"],
      ["input_boolean.ki_prediktiv_forvarming", "Prediktiv forvarming", "Starter tidlig ut fra målt oppvarmingsrate"],
      ["input_boolean.ki_laering_tau", "Lær tidskonstanter", "Måler treghet per sone"],
      ["input_boolean.ki_solkompensasjon", "Solkompensasjon", "Trekker fra solvarme i stua"],
      ["input_boolean.ki_nattsenk_okonomi", "Økonomisk nattsenking", "Senker bare når det lønner seg"],
      ["input_boolean.ki_bereder_styring", "Styr bereder", ""],
      ["input_boolean.ki_legionella_aktiv", "Legionellasikring", "Kan aldri blokkeres av sparing"],
      ["input_boolean.ki_handkle_styring", "Styr håndklevarmer", ""],
      ["input_boolean.ki_energi_varsler", "Varsler", ""],
    ];
    const rader = brytere.map(([id, navn, sub]) => {
      const st = this._st(id);
      const on = st && st.state === "on";
      return `
        <div class="rad">
          <div class="rad-tekst">
            <div class="rad-navn">${escE(navn)}</div>
            ${sub ? `<div class="rad-sub">${escE(sub)}</div>` : ""}
          </div>
          <div class="bryter ${on ? "on" : ""} ${st ? "" : "mangler"}" data-action="veksle" data-entity="${id}"><span></span></div>
        </div>`;
    }).join("");

    const mottakere = (this._st("input_text.ki_varsel_mottakere") || {}).state || "";
    this._root.getElementById("innstillinger").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Innstillinger</span></div>
        ${rader}
        <div class="ov-tittel" style="padding-top:12px">Varselmottakere</div>
        <input class="tekst" type="text" data-action="ingen" id="mottakere" value="${escE(mottakere)}"
               placeholder="notify.mobile_app_...">
        <div class="notat">Kommaseparert. Endringen lagres når du forlater feltet.</div>
      </div>`;
  }

  _renderLogg() {
    const linjer = this._attr(this._config.logg, "linjer", []) || [];
    const html = linjer.slice(0, 25).map((l) => `
      <div class="logg-linje">
        <div class="logg-topp">
          <span class="logg-tid">${escE(String(l.tid || "").slice(11, 16))}</span>
          <span class="badge b-${l.sone === "gronn" ? "ok" : l.sone === "gul" ? "advarsel" : "feil"}">${escE(l.sone)}</span>
          ${l.skygge ? '<span class="merke">skygge</span>' : ""}
          <span class="logg-tall">${nfE(l.forbrukt, 2)} / ${nfE(l.grense, 2)} kWh</span>
        </div>
        <div class="logg-tekst">${escE(l.forklaring || "")}</div>
        ${(l.tiltak || []).length ? `<ul class="logg-tiltak">${l.tiltak.map((t) => `<li>${escE(t)}</li>`).join("")}</ul>` : ""}
      </div>`).join("");
    this._root.getElementById("logg").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Beslutningslogg</span><span class="blokk-sub">Siste avgjørelser</span></div>
        ${html || '<div class="notat">Ingen beslutninger logget ennå.</div>'}
      </div>`;
  }

  /* ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "more") {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    } else if (a === "apne") {
      const k = el.dataset.key;
      if (this._apneSoner.has(k)) this._apneSoner.delete(k); else this._apneSoner.add(k);
      this._renderLaster();
    } else if (a === "veksle") {
      const st = this._st(el.dataset.entity);
      if (!st) return;
      this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: el.dataset.entity });
    } else if (a === "ov-temp") {
      const felt = this._root.querySelector(`[data-ov="${el.dataset.key}"]`);
      if (!felt) return;
      const v = Number(String(felt.textContent).replace(",", ".")) + Number(el.dataset.dir) * 0.5;
      felt.textContent = nfE(v, 1);
    } else if (a === "ov-sett") {
      const felt = this._root.querySelector(`[data-ov="${el.dataset.key}"]`);
      if (!felt) return;
      this._hass.callService("pyscript", "ki_overstyr", {
        sone: el.dataset.key,
        temp: Number(String(felt.textContent).replace(",", ".")),
        minutter: Number(el.dataset.min),
      });
    } else if (a === "ov-fjern") {
      this._hass.callService("pyscript", "ki_fjern_overstyring", { sone: el.dataset.key });
    } else if (a === "tjeneste") {
      this._hass.callService(el.dataset.domene, el.dataset.tjeneste, {});
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n && n.id === "mottakere");
    if (!el) return;
    this._hass.callService("input_text", "set_value", {
      entity_id: "input_text.ki_varsel_mottakere",
      value: el.value.slice(0, 255),
    });
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) this._lagreView(this._view);
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
    this._update();
  }

  /* ------------------------------------------------------------ */

  static get styles() {
    return `
      :host { display:block; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0; }
      .wrap { display:flex; flex-direction:column; gap:10px; color: var(--gray1000, var(--primary-text-color)); }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      .hero { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:16px; }
      .ring { position:relative; width:88px; height:88px; cursor:pointer; }
      .ring svg { width:88px; height:88px; transform: rotate(-90deg); }
      .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
      .ring-spor { stroke: rgba(128,128,128,.24); }
      .ring-fyll { stroke: var(--green, #4caf50); transition: stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1); }
      .hero[data-sone="gul"] .ring-fyll { stroke: var(--yellow, #f2c94c); }
      .hero[data-sone="oransje"] .ring-fyll { stroke: var(--orange, #fc6d09); }
      .hero[data-sone="rod"] .ring-fyll,
      .hero[data-sone="kritisk"] .ring-fyll { stroke: var(--red, #f44336); }
      .hero[data-sone="fallback"] .ring-fyll,
      .hero[data-sone="av"] .ring-fyll { stroke: rgba(128,128,128,.5); }
      .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
      .ring-tall span { font-size:13px; opacity:.6; margin-left:1px; }
      .hero-navn { font-size:19px; font-weight:600; }
      .hero-forklaring { font-size:13.5px; opacity:.72; line-height:1.4; margin-top:3px; }
      .merke { font-size:11px; font-weight:600; padding:2px 7px; border-radius:75px;
        background: rgba(128,128,128,.28); vertical-align:middle; }

      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; opacity:.6; transition: background .18s ease, opacity .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 14px; }
      .blokk + .blokk { margin-top:10px; }
      .avansert-kun > div + div { margin-top:10px; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px; }
      .blokk-sub { font-weight:500; text-align:right; }

      .tall-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .tall { background: rgba(128,128,128,.12); border-radius:16px; padding:10px 6px; text-align:center; }
      .tall b { display:block; font-size:18px; font-variant-numeric:tabular-nums; }
      .tall span { font-size:11.5px; opacity:.6; }
      .spor { height:10px; border-radius:6px; background: rgba(128,128,128,.24); overflow:hidden; margin:10px 0 6px; }
      .fyll { height:100%; background: var(--active-big, var(--primary-color)); transition: width .5s ease; }
      .under { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; opacity:.6; }
      .notat { font-size:12.5px; opacity:.6; padding:8px 2px 0; line-height:1.4; }
      .advarsel-tekst { color: var(--orange, #fc6d09); opacity:.9; }
      .svak { opacity:.5; }

      .last { border-radius:18px; background: rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
      .last-hode { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px;
        padding:10px; cursor:pointer; }
      .last-navn { font-size:14.5px; font-weight:500; }
      .last-forklaring { font-size:12.5px; opacity:.62; line-height:1.35; }
      .last-verdi { font-size:13.5px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .last-kropp { display:none; padding:0 10px 10px; }
      .last.apen .last-kropp { display:block; }
      .last-fakta { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; opacity:.7; padding-bottom:8px; }
      .last-fakta span { background: rgba(128,128,128,.16); padding:3px 9px; border-radius:75px; }
      .badge { font-weight:600; opacity:1; }
      .b-ok { background: rgba(76,175,80,.25) !important; }
      .b-advarsel { background: rgba(252,109,9,.25) !important; }
      .b-feil { background: rgba(244,67,54,.25) !important; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .p-ok { background: var(--green, #4caf50); }
      .p-advarsel { background: var(--orange, #fc6d09); }
      .p-feil { background: var(--red, #f44336); }
      .p-nøytral { background: rgba(128,128,128,.45); }

      .overstyr { border-top:1px solid rgba(128,128,128,.16); padding-top:8px; }
      .ov-tittel { font-size:12px; font-weight:600; opacity:.5; padding-bottom:6px; }
      .ov-rad { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .steg { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        font-size:19px; cursor:pointer; background: rgba(128,128,128,.18); user-select:none; }
      .ov-verdi { min-width:52px; text-align:center; font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .ov-knapp { padding:8px 14px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.18); }
      .ov-knapp.fjern { background: rgba(244,67,54,.22); }

      .rad { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-navn { font-size:14.5px; }
      .rad-sub { font-size:12px; opacity:.55; line-height:1.3; }
      .rad-verdi { font-size:13.5px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
      .bryter { width:46px; height:28px; min-width:46px; border-radius:75px; background: rgba(128,128,128,.28);
        cursor:pointer; position:relative; transition: background .18s ease; }
      .bryter.on { background: var(--active-big, var(--primary-color)); }
      .bryter span { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%;
        background:#fff; transition: transform .18s ease; }
      .bryter.on span { transform: translateX(18px); }
      .bryter.mangler { opacity:.35; }

      .tekst { width:100%; box-sizing:border-box; font-family:inherit; font-size:14px;
        color: var(--gray1000, var(--primary-text-color)); background: rgba(128,128,128,.16);
        border:none; border-radius:16px; padding:11px 14px; }

      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); }

      .logg-linje { padding:10px 2px; }
      .logg-linje + .logg-linje { border-top:1px solid rgba(128,128,128,.14); }
      .logg-topp { display:flex; align-items:center; gap:8px; font-size:12px; }
      .logg-tid { font-weight:600; font-variant-numeric:tabular-nums; }
      .logg-topp .badge { padding:2px 8px; border-radius:75px; }
      .logg-tall { margin-left:auto; opacity:.6; font-variant-numeric:tabular-nums; }
      .logg-tekst { font-size:13px; opacity:.8; margin-top:4px; line-height:1.4; }
      .logg-tiltak { margin:6px 0 0; padding-left:18px; font-size:12.5px; opacity:.62; line-height:1.45; }

      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
      @media (max-width: 400px) {
        .hero { grid-template-columns:78px 1fr; gap:10px; padding:12px; }
        .ring, .ring svg { width:74px; height:74px; }
        .tall b { font-size:16px; }
      }
    `;
  }
}

customElements.define("ki-energi-card", KiEnergiCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const EN_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "status", selector: { entity: { domain: "sensor" } } },
  { name: "laster", selector: { entity: { domain: "sensor" } } },
  { name: "bereder", selector: { entity: { domain: "sensor" } } },
  { name: "logg", selector: { entity: { domain: "sensor" } } },
  { name: "tau", selector: { entity: { domain: "sensor" } } },
  { name: "default_view", selector: { select: { mode: "dropdown", options: [
    { value: "enkel", label: "Enkel" }, { value: "avansert", label: "Avansert" }] } } },
  { name: "remember_view", selector: { boolean: {} } },
];

const EN_LABELS = {
  title: "Tittel (valgfri)", status: "Statussensor", laster: "Lastsensor",
  bereder: "Berdersensor", logg: "Loggsensor", tau: "Tidskonstantsensor",
  default_view: "Standardvisning", remember_view: "Husk valgt visning",
};

class KiEnergiCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  setConfig(config) {
    this._config = Object.assign({
      status: "sensor.ki_energi_status", laster: "sensor.ki_laster",
      bereder: "sensor.ki_bereder", logg: "sensor.ki_beslutningslogg",
      tau: "sensor.ki_tidskonstanter", default_view: "enkel", remember_view: true,
    }, config || {});
    this._render();
  }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EN_SCHEMA;
      this._form.computeLabel = (s) => EN_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

customElements.define("ki-energi-card-editor", KiEnergiCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energi-card",
  name: "KI Energi",
  description: "Timebudsjett, laster, beslutningslogg og innstillinger for KI-energimotoren",
  preview: true,
});
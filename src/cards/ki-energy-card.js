/**
 * ki-energy-card.js
 * ---------------------------------------------------------------
 * Homey Energy-stil energikort for Home Assistant.
 * Ingen avhengigheter — tegner egen SVG-graf fra historikk-API-et.
 *
 * Plassering:  /config/www/ki-energy-card.js
 * Ressurs:     /local/ki-energy-card.js  (type: JavaScript Module)
 * ---------------------------------------------------------------
 */

const NBSP = "\u00A0";

class KIEnergyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._expanded = false;
    this._history = null;
    this._historyFetchedAt = 0;
    this._signature = "";
    this._uid = "ki" + Math.random().toString(36).slice(2, 8);
  }

  // ------------------------------------------------------------
  //  Konfigurasjon
  // ------------------------------------------------------------
  setConfig(config) {
    if (!config.power || !config.power.entity) {
      throw new Error("ki-energy-card: 'power.entity' (effektsensor i W) er påkrevd");
    }
    this._config = {
      title: "Energy",
      currency: "kr",
      top_count: 3,
      stats: [],
      chips: [],
      consumers: [],
      ...config,
    };
    this._history = null;
    this._signature = "";
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  static getStubConfig() {
    return {
      type: "custom:ki-energy-card",
      power: { entity: "sensor.strommaler_effekt" },
      stats: [],
      chips: [],
      consumers: [],
    };
  }

  getCardSize() {
    return 14;
  }

  // ------------------------------------------------------------
  //  hass-oppdatering
  // ------------------------------------------------------------
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    const sig = this._buildSignature();
    const trengerHistorikk = Date.now() - this._historyFetchedAt > 60000;

    if (trengerHistorikk) this._fetchHistory();
    if (sig !== this._signature) {
      this._signature = sig;
      this._render();
    }
  }

  _buildSignature() {
    const ids = this._trackedEntities();
    return ids.map((id) => (this._hass.states[id] || {}).state).join("|") + "|" + this._expanded;
  }

  _trackedEntities() {
    const c = this._config;
    const ids = [c.power.entity];
    if (c.power.energy) ids.push(c.power.energy);
    if (c.power.cost) ids.push(c.power.cost);
    (c.stats || []).forEach((s) => ids.push(s.entity));
    (c.chips || []).forEach((s) => ids.push(s.entity));
    (c.consumers || []).forEach((s) => {
      ids.push(s.entity);
      if (s.cost) ids.push(s.cost);
    });
    if (c.water) {
      ids.push(c.water.entity);
      if (c.water.cost) ids.push(c.water.cost);
    }
    return ids.filter(Boolean);
  }

  // ------------------------------------------------------------
  //  Historikk for grafen
  // ------------------------------------------------------------
  async _fetchHistory() {
    this._historyFetchedAt = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const ids = [this._config.power.entity];
    if (this._config.water && this._config.water.entity) ids.push(this._config.water.entity);

    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: new Date().toISOString(),
        minimal_response: true,
        no_attributes: true,
        entity_ids: ids,
      });
      this._history = {};
      for (const id of ids) {
        const rows = res[id] || [];
        this._history[id] = rows
          .map((r) => ({
            t: new Date(r.lu ? r.lu * 1000 : r.last_updated).getTime(),
            v: parseFloat(r.s !== undefined ? r.s : r.state),
          }))
          .filter((p) => !isNaN(p.v));
      }
      this._signature = "";
      this._render();
    } catch (e) {
      // Historikk kan feile (recorder utilgjengelig) — kortet vises uten graf
      this._history = this._history || {};
    }
  }

  // ------------------------------------------------------------
  //  Hjelpere
  // ------------------------------------------------------------
  _st(id) {
    return this._hass && this._hass.states[id] ? this._hass.states[id] : null;
  }

  _num(id) {
    const s = this._st(id);
    if (!s) return NaN;
    const v = parseFloat(s.state);
    return isNaN(v) ? NaN : v;
  }

  _fmtNum(v, dec) {
    if (isNaN(v)) return "–";
    return v.toLocaleString("nb-NO", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }

  /** Viser kWh, men faller til Wh under 1 kWh — som i Homey */
  _fmtEnergy(v) {
    if (isNaN(v)) return { tall: "–", enhet: "kWh" };
    if (Math.abs(v) < 1) return { tall: this._fmtNum(Math.round(v * 1000), 0), enhet: "Wh" };
    return { tall: this._fmtNum(v, 1), enhet: "kWh" };
  }

  _fmtAkse(v) {
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
    return String(Math.round(v));
  }

  _niceMax(v) {
    if (!(v > 0)) return 1;
    const eksp = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / eksp;
    const nf = f <= 1 ? 1 : f <= 1.4 ? 1.4 : f <= 2 ? 2 : f <= 2.8 ? 2.8 : f <= 4 ? 4 : f <= 7 ? 7 : 10;
    return nf * eksp;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  // ------------------------------------------------------------
  //  Toppforbrukere
  // ------------------------------------------------------------
  _consumers() {
    return (this._config.consumers || [])
      .map((c) => {
        const s = this._st(c.entity);
        const kwh = this._num(c.entity);
        return {
          entity: c.entity,
          navn: c.name || (s && s.attributes.friendly_name) || c.entity,
          ikon: c.icon || (s && s.attributes.icon) || "mdi:flash",
          kwh: isNaN(kwh) ? 0 : kwh,
          kr: c.cost ? this._num(c.cost) : NaN,
        };
      })
      .filter((c) => c.kwh > 0)
      .sort((a, b) => b.kwh - a.kwh);
  }

  // ------------------------------------------------------------
  //  SVG-graf
  // ------------------------------------------------------------
  _chart(entityId, farge, enhetsetikett) {
    const W = 1000;
    const H = 300;
    const padL = 92;
    const padR = 24;
    const padT = 18;
    const padB = 52;

    const rows = (this._history && this._history[entityId]) || [];
    const dagStart = new Date();
    dagStart.setHours(0, 0, 0, 0);
    const t0 = dagStart.getTime();
    const t24 = t0 + 86400000;
    const naa = Date.now();

    // Nedsampling til 5-minutters bøtter
    const bøtter = new Array(288).fill(null);
    let siste = NaN;
    for (const p of rows) {
      const i = Math.floor((p.t - t0) / 300000);
      if (i < 0 || i > 287) continue;
      bøtter[i] = bøtter[i] === null ? p.v : Math.max(bøtter[i], p.v);
    }
    // Fyll hull framover (sensoren rapporterer kun ved endring)
    const punkter = [];
    for (let i = 0; i < 288; i++) {
      const tid = t0 + i * 300000;
      if (tid > naa) break;
      if (bøtter[i] !== null) siste = bøtter[i];
      if (!isNaN(siste)) punkter.push({ i, v: siste });
    }

    const maksVerdi = punkter.reduce((m, p) => Math.max(m, p.v), 0);
    const yMaks = this._niceMax(maksVerdi * 1.1);

    const x = (i) => padL + (i / 287) * (W - padL - padR);
    const y = (v) => H - padB - (v / yMaks) * (H - padT - padB);
    const bunn = H - padB;

    // Rutenett
    let rutenett = "";
    const yLinjer = 4;
    for (let n = 0; n <= yLinjer; n++) {
      const v = (yMaks / yLinjer) * n;
      const yy = y(v);
      rutenett += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" class="grid"/>`;
      rutenett += `<text x="${padL - 14}" y="${yy + 6}" class="ylab">${this._fmtAkse(v)}</text>`;
    }
    for (let t = 0; t <= 24; t += 6) {
      const xx = x((t / 24) * 287);
      if (t > 0 && t < 24) rutenett += `<line x1="${xx}" y1="${padT}" x2="${xx}" y2="${bunn}" class="grid vgrid"/>`;
      rutenett += `<text x="${xx}" y="${bunn + 34}" class="xlab">${t % 24}:00</text>`;
    }

    if (!punkter.length) {
      return `<svg viewBox="0 0 ${W} ${H}" class="chart">${rutenett}
        <text x="${W / 2}" y="${H / 2}" class="tom">Ingen historikk</text></svg>`;
    }

    const linje = punkter.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const første = punkter[0];
    const sisteP = punkter[punkter.length - 1];
    const areal =
      `M ${x(første.i).toFixed(1)},${bunn} ` +
      punkter.map((p) => `L ${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ") +
      ` L ${x(sisteP.i).toFixed(1)},${bunn} Z`;

    const naaX = x(((naa - t0) / (t24 - t0)) * 287);
    const gid = `${this._uid}-grad-${entityId.replace(/\W/g, "")}`;

    return `
      <svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="${farge}" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="${farge}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${rutenett}
        <path d="${areal}" fill="url(#${gid})"/>
        <polyline points="${linje}" fill="none" stroke="${farge}" stroke-width="2.5"
                  stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="${naaX}" y1="${padT}" x2="${naaX}" y2="${bunn}" class="naa"/>
        <circle cx="${x(sisteP.i).toFixed(1)}" cy="${y(sisteP.v).toFixed(1)}" r="8"
                fill="${farge}" stroke="var(--card-background-color, #16181D)" stroke-width="3"/>
        <text x="${padL - 14}" y="${padT + 4}" class="ylab enhet">${enhetsetikett}</text>
      </svg>`;
  }

  // ------------------------------------------------------------
  //  Render
  // ------------------------------------------------------------
  _render() {
    if (!this._hass || !this._config) return;
    const c = this._config;
    const blå = c.color || "#4A9EFF";

    // --- Topprad ---
    const stats = (c.stats || [])
      .map((s) => {
        const { tall, enhet } = this._fmtEnergy(this._num(s.entity));
        return `<div class="stat" data-entity="${s.entity}">
                  <div class="stat-verdi">${tall}${NBSP}<span class="stat-enhet">${enhet}</span></div>
                  <div class="stat-etikett">${s.label || ""}</div>
                </div>`;
      })
      .join("");

    // --- Brikker ---
    const chips = (c.chips || [])
      .map((ch) => {
        const st = this._st(ch.entity);
        let under = st ? st.state : "–";
        if (ch.states && st && ch.states[st.state] !== undefined) under = ch.states[st.state];
        else if (st && ch.unit !== false) {
          const u = ch.unit || st.attributes.unit_of_measurement;
          if (u) under = `${this._fmtNum(parseFloat(st.state), u === "%" ? 0 : u === "W" ? 0 : 1)}${NBSP}${u}`;
        }
        return `<div class="chip" data-entity="${ch.entity}">
                  <ha-icon icon="${ch.icon || "mdi:flash"}" style="color:${ch.color || blå}"></ha-icon>
                  <div class="chip-tekst">
                    <div class="chip-navn">${ch.name || ch.entity}</div>
                    <div class="chip-under">${under}</div>
                  </div>
                </div>`;
      })
      .join("");

    // --- Strøm ---
    const kost = c.power.cost ? this._num(c.power.cost) : NaN;
    const energi = this._fmtEnergy(c.power.energy ? this._num(c.power.energy) : NaN);
    const strømGraf = this._chart(c.power.entity, blå, "W");

    // --- Toppforbrukere ---
    const alle = this._consumers();
    const antall = this._expanded ? alle.length : Math.min(c.top_count, alle.length);
    const maks = alle.length ? alle[0].kwh : 1;
    const medaljer = ["#F0A93B", "#E3D33F", "#7ED321"];

    const rader = alle
      .slice(0, antall)
      .map((f, i) => {
        const pct = Math.max(4, Math.min(100, Math.round((f.kwh / maks) * 100)));
        const badge = medaljer[i] || "#5B8DEF";
        return `<div class="rad" data-entity="${f.entity}">
          <div class="rad-ikon">
            <ha-icon icon="${f.ikon}"></ha-icon>
            <span class="badge" style="background:${badge}">${i + 1}</span>
          </div>
          <div class="rad-tekst">
            <div class="rad-navn">${f.navn}</div>
            <div class="rad-kwh">${this._fmtNum(f.kwh, 1)}${NBSP}kWh</div>
          </div>
          <div class="pill">${isNaN(f.kr) ? "–" : this._fmtNum(f.kr, 2)}${NBSP}${c.currency}</div>
          <div class="bar"><div class="bar-fyll" style="width:${pct}%"></div></div>
        </div>`;
      })
      .join("");

    const visAlt =
      alle.length > c.top_count
        ? `<button class="visalt" id="visalt">${this._expanded ? "Vis mindre" : "Vis alt"}</button>`
        : "";

    // --- Vann (valgfritt) ---
    let vann = "";
    if (c.water && c.water.entity) {
      const vKost = c.water.cost ? this._num(c.water.cost) : NaN;
      const vVerdi = this._num(c.water.entity);
      vann = `
        <div class="seksjon">
          <h2>Vann</h2>
          <div class="pill stor">${isNaN(vKost) ? "0,00" : this._fmtNum(vKost, 2)}${NBSP}${c.currency}</div>
        </div>
        <div class="panel">
          <div class="panel-topp">
            <ha-icon icon="mdi:water" style="color:${c.water.color || blå}"></ha-icon>
            <span class="panel-verdi" style="color:${c.water.color || blå}">${this._fmtNum(vVerdi, 0)}<span class="panel-enhet">${NBSP}L</span></span>
            <span class="panel-etikett">Forbrukt</span>
          </div>
          ${this._chart(c.water.entity, c.water.color || blå, "L")}
        </div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card>
        <div class="topp">
          ${c.title ? `<h1>${c.title}</h1>` : ""}
          <div class="stats">${stats}</div>
        </div>

        <div class="chips">${chips}</div>

        <div class="seksjon">
          <h2>Strøm</h2>
          <div class="pill stor">${isNaN(kost) ? "–" : this._fmtNum(kost, 2)}${NBSP}${c.currency}</div>
        </div>

        <div class="panel">
          <div class="panel-topp" data-entity="${c.power.energy || c.power.entity}">
            <ha-icon icon="mdi:lightning-bolt" style="color:${blå}"></ha-icon>
            <span class="panel-verdi" style="color:${blå}">${energi.tall}<span class="panel-enhet">${NBSP}${energi.enhet}</span></span>
            <span class="panel-etikett">Importert</span>
          </div>
          ${strømGraf}
        </div>

        <div class="seksjon"><h2>Toppforbrukere</h2></div>
        <div class="panel liste">
          ${rader || `<div class="tomliste">Ingen forbruk registrert i dag</div>`}
          ${visAlt}
        </div>

        ${vann}
      </ha-card>`;

    // Klikk-håndtering
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((el) => {
      el.addEventListener("click", () => this._moreInfo(el.dataset.entity));
    });
    const knapp = this.shadowRoot.getElementById("visalt");
    if (knapp) {
      knapp.addEventListener("click", () => {
        this._expanded = !this._expanded;
        this._signature = "";
        this._render();
      });
    }
  }

  // ------------------------------------------------------------
  //  Stil
  // ------------------------------------------------------------
  _styles() {
    return `
      :host { --ki-panel: var(--ki-panel-color, #23262E);
              --ki-blue: #4A9EFF;
              --ki-pill-bg: #1B2434;
              --ki-muted: #9096A0;
              --ki-track: #3A3F49; }

      ha-card {
        background: var(--card-background-color, #16181D);
        border-radius: 24px;
        padding: 18px 16px 22px;
        overflow: hidden;
      }

      h1 { margin: 0 0 14px; font-size: 40px; font-weight: 800; letter-spacing: -0.5px;
           color: var(--primary-text-color, #fff); }
      h2 { margin: 0; font-size: 30px; font-weight: 700; color: var(--primary-text-color, #fff); }

      .stats { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
      .stat { text-align: center; cursor: pointer; padding: 4px 0; }
      .stat-verdi { font-size: 21px; font-weight: 700; color: var(--primary-text-color, #fff); }
      .stat-enhet { font-size: 15px; font-weight: 600; }
      .stat-etikett { font-size: 14px; color: var(--ki-muted); margin-top: 1px; }

      .chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
      .chip { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 12px;
              background: var(--ki-panel); border-radius: 16px; padding: 14px 16px; cursor: pointer; }
      .chip ha-icon { --mdc-icon-size: 32px; }
      .chip-navn { font-size: 18px; font-weight: 700; color: var(--primary-text-color, #fff); }
      .chip-under { font-size: 16px; color: var(--ki-muted); margin-top: 1px; }

      .seksjon { display: flex; align-items: center; justify-content: space-between;
                 margin: 26px 4px 10px; gap: 12px; }

      .pill { background: var(--ki-pill-bg); color: var(--ki-blue); border-radius: 12px;
              padding: 8px 14px; font-weight: 700; font-size: 20px; white-space: nowrap; }
      .pill.stor { font-size: 22px; }

      .panel { background: var(--ki-panel); border-radius: 20px; padding: 16px 12px 8px; }
      .panel.liste { padding: 6px 16px 14px; }
      .panel-topp { display: flex; align-items: baseline; gap: 8px; padding: 4px 6px 10px; cursor: pointer; }
      .panel-topp ha-icon { --mdc-icon-size: 26px; align-self: center; }
      .panel-verdi { font-size: 30px; font-weight: 700; }
      .panel-enhet { font-size: 18px; font-weight: 600; }
      .panel-etikett { font-size: 16px; color: var(--ki-muted); margin-left: -2px;
                       align-self: flex-end; width: 100%; }
      .panel-topp { flex-wrap: wrap; }

      .chart { width: 100%; height: 230px; display: block; }
      .grid { stroke: #2C3038; stroke-width: 1; }
      .vgrid { stroke-dasharray: 0; }
      .naa { stroke: #6B7280; stroke-width: 1.5; }
      .ylab { fill: var(--ki-muted); font-size: 20px; text-anchor: end; font-family: inherit; }
      .ylab.enhet { font-size: 18px; }
      .xlab { fill: var(--ki-muted); font-size: 20px; text-anchor: middle; font-family: inherit; }
      .tom { fill: var(--ki-muted); font-size: 22px; text-anchor: middle; font-family: inherit; }

      .rad { display: grid;
             grid-template-columns: 56px 1fr auto;
             grid-template-areas: "ikon tekst pill" "bar bar bar";
             align-items: center; column-gap: 14px; padding: 14px 0 8px; cursor: pointer; }
      .rad-ikon { grid-area: ikon; position: relative; width: 48px; height: 44px; }
      .rad-ikon ha-icon { --mdc-icon-size: 36px; color: #E8EAEE; }
      .badge { position: absolute; bottom: 0; left: 22px; width: 22px; height: 22px;
               border-radius: 50%; color: #14161A; font-size: 13px; font-weight: 700;
               line-height: 22px; text-align: center; }
      .rad-tekst { grid-area: tekst; min-width: 0; }
      .rad-navn { font-size: 21px; font-weight: 700; color: var(--primary-text-color, #fff);
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rad-kwh { font-size: 17px; color: var(--ki-muted); margin-top: 2px; }
      .rad .pill { grid-area: pill; }
      .bar { grid-area: bar; height: 5px; border-radius: 3px; background: var(--ki-track);
             margin-top: 14px; overflow: hidden; }
      .bar-fyll { height: 100%; border-radius: 3px;
                  background: linear-gradient(90deg, #7ED321 0%, #E3D33F 55%, #F0A93B 100%); }

      .visalt { width: 100%; margin-top: 10px; padding: 18px 0; border: none; cursor: pointer;
                background: var(--ki-pill-bg); color: var(--ki-blue); border-radius: 16px;
                font-size: 21px; font-weight: 700; font-family: inherit; }
      .visalt:hover { filter: brightness(1.15); }
      .tomliste { padding: 24px 4px; color: var(--ki-muted); font-size: 17px; text-align: center; }
    `;
  }
}

customElements.define("ki-energy-card", KIEnergyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energy-card",
  name: "KI Energy Card",
  description: "Energioversikt i Homey Energy-stil med graf og toppforbrukere",
  preview: false,
});

console.info("%c KI-ENERGY-CARD %c v1.0.0 ", "background:#4A9EFF;color:#fff;font-weight:700", "");

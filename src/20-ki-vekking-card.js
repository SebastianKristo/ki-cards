/* ki-vekking-card – vekkealarm med ukedager, tider, fade og betingelser (ekspanderbart) */
(function (KI) {
  const DAGER = [
    ["mandag", "Ma", "Mandag"], ["tirsdag", "Ti", "Tirsdag"], ["onsdag", "On", "Onsdag"], ["torsdag", "To", "Torsdag"],
    ["fredag", "Fr", "Fredag"], ["lordag", "Lø", "Lørdag"], ["sondag", "Sø", "Søndag"],
  ];
  const idag = () => { const j = new Date().getDay(); return DAGER[j === 0 ? 6 : j - 1][0]; };

  class SkAlarmCard extends KI.Card {
    static getStubConfig() { return { prefix: "alarm", automation: "automation.soverom_vekkealarm_gradvis_lys" }; }
    setConfig(c) { this._open = !!c.expanded; super.setConfig(c); }
    _cfg() {
      const c = this._config; const p = c.prefix || "alarm";
      /* Integrasjonsmodus (ki_vekking): time./switch./number./button.<prefix>_* – oppdages automatisk */
      const ki = c.source === "ki_vekking" || (c.source !== "package" && !!this.st(`time.${p}_mandag`));
      const neste = ki ? this.st(`sensor.${p}_neste_alarm`) : null;
      const condFromInt = neste && Array.isArray(neste.attributes.betingelser) ? neste.attributes.betingelser.map(e => ({ entity: e })) : [];
      return {
        p, ki,
        name: c.name || "Gradvis lys",
        automation: c.automation,
        master: c.master || (ki ? `switch.${p}_aktiv` : `input_boolean.${p}_master`),
        dayOn: (d) => (c.days && c.days[d] && c.days[d].active) || (ki ? `switch.${p}_${d}_aktiv` : `input_boolean.${p}_${d}_aktiv`),
        dayTime: (d) => (c.days && c.days[d] && c.days[d].time) || (ki ? `time.${p}_${d}` : `input_datetime.${p}_${d}`),
        fade: c.fade || (ki ? `number.${p}_fade_opp` : `input_number.${p}_fade_minutter`),
        off: c.off_after || (ki ? `number.${p}_av_etter` : `input_number.${p}_av_etter_minutter`),
        nattlampe: c.nattlampe || (ki ? `switch.${p}_nattlampe` : `input_boolean.${p}_nattlampe`),
        neste: ki ? `sensor.${p}_neste_alarm` : null,
        kjorer: ki ? `binary_sensor.${p}_kjorer` : null,
        testBtn: ki ? `button.${p}_test` : null,
        stopBtn: ki ? `button.${p}_stopp` : null,
        conditions: c.conditions || condFromInt,
        test: c.test !== false,
        test_text: c.test_confirm || "Kjøre vekkesekvensen nå? Lysene fader opp og slukkes etter innstilt tid.",
        bg: c.background || "var(--gray200)",
      };
    }
    _ids() { const c = this._cfg(); return [c.master, c.fade, c.off, c.nattlampe, c.neste, c.kjorer, ...DAGER.flatMap(([d]) => [c.dayOn(d), c.dayTime(d)]), ...c.conditions.map(x => x.entity)].filter(Boolean); }
    _key() { return JSON.stringify([this._config, this._open, this._ids().map(id => { const s = this.st(id); return s ? [s.state, s.attributes.min, s.attributes.max, s.attributes.neste_dag, s.attributes.fase] : null; })]); }

    _status() {
      const c = this._cfg();
      if (c.kjorer && this.on(c.kjorer)) { const f = (this.st(c.kjorer).attributes.fase || ""); return f === "fader" ? "Fader opp …" : "Lyser – slukker snart"; }
      if (!this.on(c.master)) return "Skrudd av";
      if (c.neste) {
        const n = this.st(c.neste); if (!n || n.state === "Av") return "Ingen alarm satt";
        const dag = n.attributes.neste_dag || ""; const dagI = DAGER[(new Date().getDay() + 6) % 7][2];
        const morgen = DAGER[(new Date().getDay()) % 7][2];
        return (dag === dagI ? "I dag" : dag === morgen ? "I morgen" : dag) + " kl. " + n.state;
      }
      const d = idag();
      if (!this.on(c.dayOn(d))) return "Ingen alarm i dag";
      const tt = this.val(c.dayTime(d)).slice(0, 5);
      return tt === "00:00" ? "Tid ikke satt" : "I dag kl. " + tt;
    }

    _render() {
      const c = this._cfg(); const masterOn = this.on(c.master);
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.bg}; padding:6px 0; }
        .head { display:grid; grid-template-columns:116px 1fr 52px; align-items:center; height:46px; }
        .head .title { padding:0 14px; cursor:pointer; }
        .head .status { text-align:center; font-size:12px; font-weight:500; opacity:.65; }
        .head .tgl { display:flex; justify-content:center; cursor:pointer; --mdc-icon-size:40px; }
        .head .tgl ha-icon { color:${masterOn ? "var(--green)" : "var(--gray400)"}; }
        .expand { display:flex; justify-content:center; padding:2px 0 0; }
        .expand button { border:0; background:none; color:var(--gray1000); opacity:.6; cursor:pointer; padding:4px 24px; --mdc-icon-size:22px; }
        .expand ha-icon { transition:transform .2s; ${this._open ? "transform:rotate(180deg);" : ""} }
        .body { padding:12px 12px 18px; display:${this._open ? "block" : "none"}; }
        .gap { height:14px; }
        .days { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
        .day { aspect-ratio:1/1; border-radius:14px; display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:600; background:var(--gray100); color:var(--gray1000); }
        .day.on { background:var(--yellow); color:var(--black); }
        .times { display:grid; gap:2px; }
        .trow { display:flex; align-items:center; justify-content:space-between; height:40px; padding:0 4px; }
        .trow .name { flex:1; }
        .trow.dim { opacity:.45; }
        input[type=time] { font:inherit; font-size:14px; font-weight:500; color:var(--gray1000); background:var(--gray100);
          border:0; border-radius:10px; padding:6px 10px; color-scheme:dark; }
        input[type=time]:focus-visible { outline:2px solid var(--active-big); }
        .cond { display:flex; align-items:center; justify-content:space-between; height:40px; padding:0 4px; }
        .cond .pill { font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--gray100); opacity:.6; }
        .cond .pill.on { background:var(--green); color:var(--black); opacity:1; }
        .stack { display:grid; gap:8px; }
        @media (prefers-reduced-motion: reduce) { .expand ha-icon { transition:none; } }
      </style>
      <div class="card">
        <div class="head">
          <div class="title name" data-act="more" data-id="${c.automation || c.master}">${c.name}</div>
          <div class="status">${this._status()}</div>
          <div class="tgl press" data-act="toggle" data-id="${c.master}"><ha-icon icon="${masterOn ? "mdi:toggle-switch" : "mdi:toggle-switch-off-outline"}"></ha-icon></div>
        </div>
        <div class="expand"><button aria-label="Vis innstillinger" aria-expanded="${this._open}"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>
        <div class="body">
          <div class="section">Ukedager</div>
          <div class="days">
            ${DAGER.map(([d, k]) => `<div class="day press ${this.on(c.dayOn(d)) ? "on" : ""}" data-act="toggle" data-id="${c.dayOn(d)}">${k}</div>`).join("")}
          </div>
          <div class="gap"></div>
          <div class="section">Vekketider</div>
          <div class="times">
            ${DAGER.map(([d, , full]) => `<div class="trow ${this.on(c.dayOn(d)) ? "" : "dim"}">
              <div class="name">${full}</div>
              <input type="time" data-id="${c.dayTime(d)}" value="${this.val(c.dayTime(d)).slice(0, 5)}">
            </div>`).join("")}
          </div>
          <div class="gap"></div>
          <div class="section">Lys</div>
          <div class="stack">
            <ki-slider-card id="fade"></ki-slider-card>
            <ki-slider-card id="off"></ki-slider-card>
            <ki-toggle-card id="natt"></ki-toggle-card>
          </div>
          ${c.conditions.length ? `
          <div class="gap"></div>
          <div class="section">Betingelser (må være på)</div>
          ${c.conditions.map(x => `<div class="cond press" data-act="more" data-id="${x.entity}">
            <div class="name">${x.name || KI.friendly(this._hass, x.entity)}</div>
            <div class="pill ${this.on(x.entity) ? "on" : ""}">${this.on(x.entity) ? "På" : "Av"}</div>
          </div>`).join("")}` : ""}
          ${c.test && (c.automation || c.testBtn) ? `<div class="gap"></div><div class="stack"><ki-action-card id="test"></ki-action-card>${c.stopBtn && c.kjorer && this.on(c.kjorer) ? `<ki-action-card id="stop"></ki-action-card>` : ""}</div>` : ""}
        </div>
      </div>`;

      const r = this.shadowRoot;
      r.querySelectorAll("[data-act]").forEach(el => {
        const id = el.dataset.id;
        if (el.dataset.act === "toggle") KI.bindPress(el, () => KI.toggle(this._hass, id), () => KI.moreInfo(this, id));
        else el.addEventListener("click", () => KI.moreInfo(this, id));
      });
      r.querySelector(".expand button").addEventListener("click", () => { this._open = !this._open; this._lastKey = null; this._maybeRender(); });
      r.querySelectorAll("input[type=time]").forEach(inp => inp.addEventListener("change", () => {
        if (!inp.value) return;
        if (c.ki) this._hass.callService("time", "set_value", { entity_id: inp.dataset.id, time: inp.value + ":00" });
        else this._hass.callService("input_datetime", "set_datetime", { entity_id: inp.dataset.id, time: inp.value + ":00" });
      }));

      const sub = (id, cfg) => { const el = r.getElementById(id); if (el) { el.setConfig(cfg); el.hass = this._hass; } };
      sub("fade", { entity: c.fade, name: "Fade opp", unit: " min" });
      sub("off", { entity: c.off, name: "Av etter", unit: " min" });
      sub("natt", { entity: c.nattlampe, name: "Nattlampe", label: "Ta med i vekking", icon: "mdi:lightbulb-night", background: "var(--gray100)" });
      sub("test", { name: "Test vekkesekvens", icon: "mdi:play-circle", background: "var(--gray100)", confirm: c.test_text,
        action: c.testBtn ? { service: "button.press", target: { entity_id: c.testBtn } }
                          : { service: "automation.trigger", target: { entity_id: c.automation }, data: { skip_condition: true } } });
      sub("stop", { name: "Stopp og slukk", icon: "mdi:stop-circle", background: "var(--gray100)",
        action: { service: "button.press", target: { entity_id: c.stopBtn } } });
      this._subs = ["fade", "off", "natt", "test", "stop"].map(i => r.getElementById(i)).filter(Boolean);
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }
    getCardSize() { return this._open ? 8 : 1; }
  }
  customElements.define("ki-vekking-card", SkAlarmCard);
  KI.register("ki-vekking-card", "KI Vekking", "Vekkealarm: ukedager, tider, fade og betingelser");
})(window.KI);

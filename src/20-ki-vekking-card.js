/* ki-vekking-card – vekkealarm fra ki_sovn (type vekking). mode: list (innstillinger/popup) | tile (oversikt)
   Finner alarmen selv (prefix fra sensor.*_vekking_neste_alarm) – eller sett prefix: soverom_vekking. */
(function (KI) {
  const DAGER = [
    ["mandag", "Ma", "Mandag"], ["tirsdag", "Ti", "Tirsdag"], ["onsdag", "On", "Onsdag"], ["torsdag", "To", "Torsdag"],
    ["fredag", "Fr", "Fredag"], ["lordag", "Lø", "Lørdag"], ["sondag", "Sø", "Søndag"],
  ];
  const idag = () => { const j = new Date().getDay(); return DAGER[j === 0 ? 6 : j - 1][0]; };

  class KiVekkingCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? !c.collapsible; super.setConfig(c); }

    /* Finn prefix: config → markør-attributt → gammelt navnemønster */
    _prefix() {
      const c = this._config;
      if (c.prefix) return c.prefix;
      if (c.entity && this.st(c.entity)) return this.st(c.entity).attributes.prefix || c.entity.replace(/^sensor\./, "").replace(/_neste_alarm$/, "");
      const hit = KI.find(this._hass, "sensor", { integrasjon: "ki_sovn", type: "vekking" })[0];
      if (hit) return this.st(hit).attributes.prefix;
      const old = Object.keys(this._hass ? this._hass.states : {}).find(id => /^sensor\..*_vekking_neste_alarm$/.test(id));
      return old ? old.slice(7, -12) : null;
    }
    _ids(p) {
      return {
        master: `switch.${p}_aktiv`, natt: `switch.${p}_nattlampe`, vekk: `switch.${p}_vekk_person`, bare: `switch.${p}_bare_hvis_sover`,
        fade: `number.${p}_fade_opp`, off: `number.${p}_av_etter`, neste: `sensor.${p}_neste_alarm`, kjorer: `binary_sensor.${p}_kjorer`,
        test: `button.${p}_test`, stopp: `button.${p}_stopp`,
        dayOn: (d) => `switch.${p}_${d}_aktiv`, dayTime: (d) => `time.${p}_${d}`,
      };
    }
    _all(e) { return [e.master, e.natt, e.vekk, e.bare, e.fade, e.off, e.neste, e.kjorer, ...DAGER.flatMap(([d]) => [e.dayOn(d), e.dayTime(d)])]; }
    _key() {
      const p = this._prefix(); if (!p) return JSON.stringify([this._config, "none"]);
      const e = this._ids(p); const n = this.st(e.neste);
      return JSON.stringify([this._config, this._open, p, this._all(e).map(id => { const s = this.st(id); return s ? [s.state, s.attributes.min, s.attributes.max] : null; }),
        n && n.attributes, (this.st(e.kjorer) || {}).attributes, (n && n.attributes.betingelser || []).map(id => this.val(id))]);
    }

    _info(e) {
      const n = this.st(e.neste); const a = (n && n.attributes) || {};
      const masterOn = this.on(e.master); const running = this.on(e.kjorer); const fase = (this.st(e.kjorer) || { attributes: {} }).attributes.fase;
      const tid = n ? n.state : null; const dag = a.neste_dag || "";
      const d = idag();
      const today = this.on(e.dayOn(d)) && masterOn ? KI.hhmm(this.val(e.dayTime(d))) : null;
      let status;
      if (running) status = fase === "fader" ? "Fader opp lyset …" : "Lyset er på";
      else if (!masterOn) status = "Skrudd av";
      else if (!tid || tid === "Av") status = "Ingen dager valgt";
      else status = a.neste_tidspunkt && new Date(a.neste_tidspunkt).toDateString() === new Date().toDateString() ? `I dag kl. ${tid}` : `${dag} kl. ${tid}`;
      return { ok: !!n, a, masterOn, running, fase, tid: tid && tid !== "Av" ? tid : "--:--", dag, status, today, skip: a.hopper_over, person: a.person, personSover: a.person_sover };
    }

    _render() {
      const c = this._config; const p = this._prefix();
      if (!p) {
        this.shadowRoot.innerHTML = `<style>${KI.css}</style><div class="card"><div class="empty">Fant ingen vekkealarm fra <b>KI Søvn &amp; Vekking</b>.<br>Legg til «Vekkealarm» i integrasjonen, eller sett <code>prefix: soverom_vekking</code>.</div></div>`;
        return;
      }
      const e = this._ids(p); const s = this._info(e);
      if (c.mode === "tile") return this._renderTile(e, s);
      const name = c.name || KI.friendly(this._hass, e.neste, "Vekkealarm").replace(/ neste alarm$/i, "");
      const chips = [];
      if (s.running) chips.push(`<span class="chip on">${s.fase === "fader" ? "fader" : "lyser"}</span>`);
      if (s.masterOn && s.skip === "betingelser") chips.push(`<span class="chip warn">hopper over – betingelser</span>`);
      if (s.masterOn && s.skip === "våken") chips.push(`<span class="chip warn">hopper over – våken</span>`);
      if (s.person) chips.push(`<span class="chip ${s.personSover ? "on" : ""}">${KI.friendly(this._hass, s.person).replace(/ (søvn )?sover$/i, "")} ${s.personSover ? "sover" : s.personSover === false ? "er våken" : ""}</span>`);
      const conds = s.a.betingelser || [];

      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .head { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; }
        .head .txt { flex:1; min-width:0; }
        .head .main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer; }
        .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding:10px 8px 4px; flex-wrap:wrap; }
        .time { font-size:44px; font-weight:600; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; ${s.masterOn ? "" : "opacity:.35;"} }
        .time small { font-size:14px; font-weight:500; opacity:.6; margin-left:8px; letter-spacing:0; }
        .chips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; padding-bottom:6px; }
        .expand { display:flex; justify-content:center; }
        .expand button { border:0; background:none; color:var(--gray1000); opacity:.6; cursor:pointer; padding:2px 24px; --mdc-icon-size:22px; }
        .expand ha-icon { transition:transform .2s; ${this._open ? "transform:rotate(180deg);" : ""} }
        .body { padding:10px 4px 4px; display:${this._open ? "block" : "none"}; }
        .gap { height:14px; }
        .days { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; }
        .day { border-radius:14px; background:var(--gray100); color:var(--gray1000); display:flex; flex-direction:column; align-items:center;
          padding:8px 0 6px; gap:4px; opacity:.55; }
        .day.on { background:var(--yellow); color:var(--black); opacity:1; }
        .day.today { box-shadow:inset 0 0 0 2px rgba(255,255,255,.35); }
        .day b { font-size:13px; font-weight:600; cursor:pointer; padding:0 6px; }
        .day input[type=time] { width:100%; background:rgba(0,0,0,.18); color:inherit; font-size:12px; padding:3px 0; text-align:center; border-radius:8px;
          color-scheme:${"dark"}; }
        .day input[type=time]::-webkit-calendar-picker-indicator { display:none; }
        .stack { display:grid; gap:8px; }
        .cond { display:flex; align-items:center; justify-content:space-between; min-height:44px; padding:0 10px; border-radius:14px; background:var(--gray100); cursor:pointer; }
        .actions { display:grid; grid-template-columns:1fr ${s.running ? "1fr" : ""}; gap:8px; }
        @media (prefers-reduced-motion: reduce) { .expand ha-icon { transition:none; } }
      </style>
      <div class="card">
        <div class="head">
          <div class="main" data-more="${e.neste}">
            <div class="icon-wrap ${s.masterOn ? "on" : ""}"><ha-icon icon="${c.icon || (s.running ? "mdi:weather-sunny" : "mdi:alarm")}"></ha-icon></div>
            <div class="txt"><div class="name">${KI.esc(name)}</div><div class="label">${KI.esc(s.status)}</div></div>
          </div>
          <div class="sw ${s.masterOn ? "on" : ""}" data-toggle="${e.master}" role="switch" aria-checked="${s.masterOn}" tabindex="0"><i></i></div>
        </div>
        <div class="hero">
          <div class="time">${s.tid}${s.masterOn && s.dag ? `<small>${KI.esc(s.dag)}</small>` : ""}</div>
          <div class="chips">${chips.join("")}</div>
        </div>
        ${c.collapsible ? `<div class="expand"><button aria-label="Vis innstillinger" aria-expanded="${this._open}"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>` : ""}
        <div class="body">
          <div class="section">Ukedager og tider</div>
          <div class="days">
            ${DAGER.map(([d, k, full]) => { const on = this.on(e.dayOn(d)); return `<div class="day ${on ? "on" : ""} ${d === idag() ? "today" : ""}">
              <b class="press" data-toggle="${e.dayOn(d)}" title="${full}" role="switch" aria-checked="${on}" tabindex="0">${k}</b>
              <input type="time" data-time="${e.dayTime(d)}" value="${KI.hhmm(this.val(e.dayTime(d)))}" aria-label="${full}">
            </div>`; }).join("")}
          </div>
          <div class="gap"></div>
          <div class="section">Lys</div>
          <div class="stack">
            <ki-slider-card data-slider="${e.fade}" data-name="Fade opp"></ki-slider-card>
            <ki-slider-card data-slider="${e.off}" data-name="Av etter"></ki-slider-card>
            ${this.st(e.natt) ? `<ki-toggle-card data-toggle-card="${e.natt}" data-name="Nattlampe" data-label="Ta med i vekkingen" data-icon="mdi:lightbulb-night"></ki-toggle-card>` : ""}
          </div>
          ${s.person ? `<div class="gap"></div><div class="section">Person</div><div class="stack">
            <ki-toggle-card data-toggle-card="${e.vekk}" data-name="Vekk person" data-label="Marker som våken når lyset er oppe" data-icon="mdi:account-alert"></ki-toggle-card>
            <ki-toggle-card data-toggle-card="${e.bare}" data-name="Bare hvis sover" data-label="Hopp over alarmen hvis personen er våken" data-icon="mdi:sleep"></ki-toggle-card>
          </div>` : ""}
          ${conds.length ? `<div class="gap"></div><div class="section">Betingelser (må være på)</div><div class="stack">
            ${conds.map(id => `<div class="cond press" data-more="${id}"><div class="name">${KI.esc((c.condition_names || {})[id] || KI.friendly(this._hass, id))}</div><span class="chip ${this.on(id) ? "on" : "bad"}">${this.on(id) ? "På" : "Av"}</span></div>`).join("")}
          </div>` : ""}
          ${c.test === false ? "" : `<div class="gap"></div><div class="actions">
            ${s.running ? `<div class="btn danger press" data-press="${e.stopp}" tabindex="0"><ha-icon icon="mdi:stop-circle"></ha-icon>Stopp</div>` : ""}
            <div class="btn press" data-press="${e.test}" data-confirm="1" tabindex="0"><ha-icon icon="mdi:play-circle"></ha-icon>${s.running ? "Kjører …" : "Test vekkesekvensen"}</div>
          </div>`}
        </div>
      </div>`;
      this._wire(c);
    }

    _wire(c) {
      const r = this.shadowRoot; const h = this._hass;
      r.querySelectorAll("[data-toggle]").forEach(el => { const id = el.dataset.toggle; const run = () => KI.toggle(h, id); KI.bindPress(el, run, () => KI.moreInfo(this, id)); KI.key(el, run); });
      r.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", () => KI.moreInfo(this, el.dataset.more)));
      r.querySelectorAll("[data-press]").forEach(el => {
        const run = () => { if (el.dataset.confirm && !window.confirm(c.test_confirm || "Kjøre vekkesekvensen nå? Lysene fader opp og slukkes etter innstilt tid.")) return; KI.press(h, el.dataset.press); };
        KI.bindPress(el, run); KI.key(el, run);
      });
      r.querySelectorAll("input[type=time]").forEach(inp => inp.addEventListener("change", () => {
        if (inp.value) h.callService("time", "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" });
      }));
      this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { el.setConfig({ entity: el.dataset.slider, name: el.dataset.name, label_width: "96px", value_width: "64px" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("ki-toggle-card").forEach(el => { el.setConfig({ entity: el.dataset.toggleCard, name: el.dataset.name, label: el.dataset.label, icon: el.dataset.icon, background: "var(--gray100)" }); el.hass = h; this._subs.push(el); });
      const ex = r.querySelector(".expand button"); if (ex) ex.addEventListener("click", () => { this._open = !this._open; this._lastKey = null; this._maybeRender(); });
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }

    _renderTile(e, s) {
      const c = this._config;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .big { font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; ${s.masterOn ? "" : "opacity:.4;"} }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${s.masterOn ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:alarm"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Vekking")}</div><div class="label">${KI.esc(s.status)}</div></div><div class="big">${s.tid}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => KI.toggle(this._hass, e.master)); KI.key(el, () => KI.go(c));
    }
    getCardSize() { return this._config.mode === "tile" ? 2 : this._open ? 9 : 2; }
  }
  customElements.define("ki-vekking-card", KiVekkingCard);
  KI.register("ki-vekking-card", "KI Vekking", "Vekkealarm fra KI Søvn & Vekking: neste alarm, ukedager med tider, lys, person og betingelser");
})(window.KI);

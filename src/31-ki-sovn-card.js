/* ki-sovn-card – søvnstatus per person fra ki_sovn. mode: list (popup) | tile (oversikt) */
(function (KI) {
  const OBS_LABEL = {
    hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga",
  };

  class KiSovnCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? null; super.setConfig(c); }

    /* Personer fra config, ellers auto-oppdaget fra ki_sovn-entitetene */
    _persons() {
      const c = this._config;
      const mk = (slug, p = {}) => ({
        name: p.name || slug.charAt(0).toUpperCase() + slug.slice(1),
        entity: p.entity || `binary_sensor.${slug}_sovn_sover`,
        switch: p.switch || `switch.homey_logic_${slug}_sovn_vaken`,
        prefix: p.prefix || `${slug}_sovn`,           // ki_sovn-innstillinger: number./time./switch.<prefix>_*
        bedtime: p.bedtime || "",
      });
      if (c.persons) return c.persons.map(p => mk(p.slug || (p.entity || p.name).replace(/^binary_sensor\./, "").replace(/_sovn_sover$/, "").toLowerCase(), p));
      if (!this._hass) return [];
      return Object.keys(this._hass.states)
        .filter(id => id.startsWith("binary_sensor.") && id.endsWith("_sovn_sover") && this._hass.states[id].attributes.sannsynlighet !== undefined)
        .sort().map(id => mk(id.slice(14, -11)));
    }

    _info(p) {
      const st = this.st(p.entity); const sw = this.st(p.switch);
      if (!st) return { ok: false, sover: false, pct: 0, txt: "mangler " + p.entity, tone: "red", obs: [], why: "" };
      const a = st.attributes;
      const sover = sw ? sw.state === "on" : st.state === "on";
      const pending = a["venter_på"] || null;
      const pct = Math.round(a.sannsynlighet ?? 0);
      const txt = pending === "sovner" ? "Sovner …" : pending === "våkner" ? "Våkner …" : sover ? "Sover" : "Våken";
      const tone = pending ? "yellow" : sover ? "on" : "off";
      const obs = Object.keys(OBS_LABEL).map(k => ({ label: OBS_LABEL[k], v: a["obs_" + k] }))
        .filter(o => o.v !== undefined);
      return { ok: true, sover, pending, pct, txt, tone, obs, puls: a.obs_puls_glattet ?? null, why: a["årsak"] || "", hasSwitch: !!sw };
    }

    _key() {
      const ps = this._persons();
      return JSON.stringify([this._config, this._open, ps.map(p => {
        const s = this.st(p.entity), w = this.st(p.switch);
        const cfgIds = Object.keys(this._hass ? this._hass.states : {}).filter(id => id.includes(`.${p.prefix}_`));
        return [s && s.state, s && s.attributes, w && w.state, cfgIds.map(id => this.val(id))];
      })]);
    }

    _render() {
      const c = this._config; const persons = this._persons(); const infos = persons.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(persons, infos);
      const thr = c.threshold ?? 80;

      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .row { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; }
        .txt { flex:1; min-width:0; }
        .txt .label.bed { opacity:.5; }
        .right { display:flex; align-items:center; gap:12px; }
        .status { text-align:right; }
        .status .state { display:block; }
        .status .pct { font-size:12px; opacity:.5; font-variant-numeric:tabular-nums; }
        .status.on .state { opacity:1; }
        .status.yellow .state { color:var(--yellow); opacity:1; }
        .status.red .state { color:var(--red); opacity:1; }
        .sw { width:44px; height:26px; border-radius:13px; background:var(--gray100); position:relative; flex:none; transition:background .2s; }
        .sw.on { background:var(--active-big); }
        .sw.disabled { opacity:.3; pointer-events:none; }
        .sw i { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform .2s; }
        .sw.on i { transform:translateX(18px); }
        .bar { position:relative; height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 0; }
        .bar i { display:block; height:100%; border-radius:2px; background:var(--gray400); transition:width .4s; }
        .bar i.on { background:var(--active-big); } .bar i.yellow { background:var(--yellow); }
        .bar b { position:absolute; top:-3px; width:2px; height:10px; border-radius:1px; background:var(--gray1000); opacity:.35; }
        .body { display:none; padding:12px 8px 4px; }
        .body.open { display:block; }
        .chips { display:flex; flex-wrap:wrap; gap:6px; }
        .chip { font-size:12px; font-weight:500; padding:3px 9px; border-radius:10px; background:var(--gray100); opacity:.45; }
        .chip.yes { opacity:1; background:var(--active-big); color:rgba(70,58,64,.95); }
        .chip.no { opacity:.75; text-decoration:line-through; }
        .chip.num { opacity:1; font-variant-numeric:tabular-nums; }
        .why { font-size:12px; opacity:.55; margin-top:8px; }
        .empty { font-size:13px; opacity:.55; padding:6px 4px; }
        :host { min-width:0; max-width:100%; overflow:hidden; }
        .list { min-width:0; }
        .card { overflow:hidden; }
        .settings { margin-top:14px; }
        .times { display:flex; flex-wrap:wrap; gap:8px 14px; padding:4px 2px 10px; }
        .tm { display:flex; align-items:center; gap:8px; font-size:13px; opacity:.85; }
        .tm span { opacity:.7; }
        .tm input { font:inherit; font-size:14px; font-weight:500; color:var(--gray1000); background:var(--gray100); border:0; border-radius:10px; padding:6px 8px; }
        .tm input:focus-visible { outline:2px solid var(--active-big); }
        .stack { display:grid; gap:8px; }
        @media (prefers-reduced-motion: reduce) { .bar i, .sw, .sw i { transition:none; } }
      </style>
      <div class="list">
        ${persons.length ? persons.map((p, i) => { const s = infos[i]; const open = this._open === i;
          return `<div class="card">
            <div class="row">
              <div class="press main" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                <div class="icon-wrap ${s.sover ? "on" : ""}"><ha-icon icon="${s.sover ? "mdi:sleep" : "mdi:sleep-off"}"></ha-icon></div>
                <div class="txt"><div class="name">${p.name}</div>${p.bedtime ? `<div class="label bed">Legger seg ${p.bedtime}</div>` : ""}</div>
              </div>
              <div class="right">
                <div class="status ${s.tone}"><span class="state">${s.txt}</span><span class="pct">${s.ok ? s.pct + " %" : ""}</span></div>
                <div class="sw press ${s.sover ? "on" : ""} ${s.hasSwitch ? "" : "disabled"}" data-sw="${i}" role="switch" aria-checked="${s.sover}" tabindex="0" title="${s.sover ? "Sett våken" : "Sett sover"}"><i></i></div>
              </div>
            </div>
            <div class="bar"><i class="${s.tone === "off" ? "" : s.tone}" style="width:${s.pct}%"></i><b style="left:${thr}%"></b></div>
            <div class="body ${open ? "open" : ""}">
              <div class="chips">
                ${s.obs.map(o => `<span class="chip ${o.v === true ? "yes" : o.v === false ? "no" : ""}">${o.label}</span>`).join("")}
                ${s.puls !== null ? `<span class="chip num">${s.puls} bpm</span>` : ""}
              </div>
              ${s.why ? `<div class="why">Sist: ${s.why}</div>` : ""}
              ${c.settings === false ? "" : this._settingsHtml(p, s, i)}
            </div>
          </div>`; }).join("") : `<div class="card"><div class="empty">Fant ingen ki_sovn-entiteter (binary_sensor.*_sover)</div></div>`}
      </div>`;

      const r = this.shadowRoot;
      r.querySelectorAll(".main").forEach(el => {
        const i = +el.dataset.i;
        const toggle = () => { this._open = this._open === i ? null : i; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, toggle, () => KI.moreInfo(this, persons[i].entity));
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      });
      r.querySelectorAll(".sw").forEach(el => {
        const p = persons[+el.dataset.sw];
        const run = () => KI.toggle(this._hass, p.switch);
        KI.bindPress(el, run, () => KI.moreInfo(this, p.switch));
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
      });
      this._wireSettings();
    }

    _settingsHtml(p, s, i) {
      const x = p.prefix;
      const t = (id, lbl) => { const st = this.st(id); return st ? `<label class="tm"><span>${lbl}</span><input type="time" data-time="${id}" value="${st.state.slice(0, 5)}"></label>` : ""; };
      const times = [t(`time.${x}_sovevindu_start`, "Sovevindu"), t(`time.${x}_sovevindu_slutt`, "til"), t(`time.${x}_morgen_fra`, "Morgen fra")].join("");
      const sl = (id, name, extra = "") => this.st(id) ? `<ki-slider-card data-slider="${i}" data-entity="${id}" data-name="${name}" ${extra}></ki-slider-card>` : "";
      const tg = (id, name, label) => this.st(id) ? `<ki-toggle-card data-toggle="${i}" data-entity="${id}" data-name="${name}" data-label="${label}"></ki-toggle-card>` : "";
      if (!times && !this.st(`number.${x}_terskel`)) return "";
      return `<div class="settings">
        <div class="section">Innstillinger</div>
        <div class="times">${times}</div>
        <div class="stack">
          ${sl(`number.${x}_terskel`, "Terskel")}
          ${sl(`number.${x}_forsinkelse_sovner`, "Sovner etter")}
          ${sl(`number.${x}_forsinkelse_vakner`, "Våkner etter")}
          ${sl(`number.${x}_hold_i_rommet`, "Hold i rommet")}
          ${sl(`number.${x}_borte_fra_rommet_vaken`, "Borte = våken")}
          ${sl(`number.${x}_dor_lukket_i`, "Dør lukket i")}
          ${s.puls !== null || s.obs.some(o => o.label === "lav puls" && o.v !== undefined) ? sl(`number.${x}_puls_sover`, "Puls sover") + sl(`number.${x}_puls_vaken`, "Puls våken") : ""}
          ${tg(`switch.${x}_dor_om_natta_ok`, "Dør om natta", "Do-turer vekker ikke")}
          ${tg(`switch.${x}_automatisk`, "Automatisk", "Styrer Homey-bryteren")}
        </div>
      </div>`;
    }

    _wireSettings() {
      const r = this.shadowRoot; this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => {
        el.setConfig({ entity: el.dataset.entity, name: el.dataset.name, label_width: "118px", value_width: "64px" });
        el.hass = this._hass; this._subs.push(el);
      });
      r.querySelectorAll("ki-toggle-card").forEach(el => {
        el.setConfig({ entity: el.dataset.entity, name: el.dataset.name, label: el.dataset.label, icon: null });
        el.hass = this._hass; this._subs.push(el);
      });
      r.querySelectorAll("input[type=time]").forEach(inp => {
        inp.addEventListener("change", () => this._hass.callService("time", "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" }));
      });
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }

    _renderTile(persons, infos) {
      const c = this._config;
      const sovende = infos.filter(s => s.sover).map((s, i) => persons[infos.indexOf(s)].name);
      const pending = infos.find(s => s.pending);
      const label = pending ? `${persons[infos.indexOf(pending)].name} ${pending.txt.toLowerCase()}`
        : sovende.length === 0 ? "Alle er våkne"
        : sovende.length === persons.length ? "Alle sover"
        : sovende.join(", ") + (sovende.length === 1 ? " sover" : " sover");
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start;
          gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; }
        .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.on { background:var(--active-big); } .dots i.yellow { background:var(--yellow); }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${sovende.length ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:sleep"}"></ha-icon></div>
        <div class="bottom">
          <div><div class="name">${c.name || "Søvn"}</div><div class="label">${label}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone === "off" ? "" : s.tone}" title="${s.txt}"></i>`).join("")}</div>
        </div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      const go = () => {
        if (c.navigation_path) { window.history.pushState(null, "", c.navigation_path); window.dispatchEvent(new Event("location-changed")); }
        else if (c.hash) { window.location.hash = c.hash; }
      };
      KI.bindPress(el, go, () => persons[0] && KI.moreInfo(this, persons[0].entity));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    }

    getCardSize() { return this._config.mode === "tile" ? 2 : Math.max(1, this._persons().length) * 2; }
  }
  customElements.define("ki-sovn-card", KiSovnCard);
  KI.register("ki-sovn-card", "KI Søvn", "Søvnstatus per person fra ki_sovn: sannsynlighet, observasjoner og manuell overstyring");
})(window.KI);

/* ki-sovn-card – søvnstatus per person fra ki_sovn. mode: list (popup/innstillinger) | tile (oversikt)
   Finner personene selv via binary_sensor.*_sovn_sover. persons: kan brukes for å velge/omdøpe. */
(function (KI) {
  const OBS = { hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga" };

  class KiSovnCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? null; super.setConfig(c); }

    _persons() {
      const c = this._config; const h = this._hass; if (!h) return [];
      const mk = (id, p = {}) => {
        const a = (h.states[id] || { attributes: {} }).attributes;
        const prefix = p.prefix || a.prefix || id.replace(/^binary_sensor\./, "").replace(/_sover$/, "");
        return { entity: id, name: p.name || a.navn || KI.friendly(h, id).replace(/ (søvn )?sover$/i, ""), prefix,
          switch: p.switch || a.bryter || null, bedtime: p.bedtime || "" , setSover: `button.${prefix}_sett_sover`, setVaaken: `button.${prefix}_sett_vaken` };
      };
      if (c.persons) return c.persons.map(p => mk(p.entity || `binary_sensor.${(p.slug || p.name).toLowerCase()}_sovn_sover`, p));
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_sovn", type: "person" });
      if (!ids.length) ids = Object.keys(h.states).filter(id => /^binary_sensor\..*_sovn_sover$/.test(id) && h.states[id].attributes.sannsynlighet !== undefined).sort();
      return ids.map(id => mk(id));
    }
    _info(p) {
      const st = this.st(p.entity); if (!st) return { ok: false, sover: false, pct: 0, txt: "mangler", tone: "red", obs: [], sub: p.entity };
      const a = st.attributes; const sover = st.state === "on"; const pending = a["venter_på"] || null;
      const pct = Math.round(a.sannsynlighet ?? 0);
      const txt = pending === "sovner" ? "Sovner …" : pending === "våkner" ? "Våkner …" : sover ? "Sover" : "Våken";
      const since = a.siden ? (sover ? "Sover siden " : "Våken siden ") + KI.clock(a.siden) : (p.bedtime ? `Legger seg ${p.bedtime}` : "");
      const obs = Object.keys(OBS).map(k => ({ label: OBS[k], v: a["obs_" + k] })).filter(o => o.v !== undefined);
      return { ok: true, sover, pending, pct, txt, tone: pending ? "yellow" : sover ? "on" : "off", obs, puls: a.obs_puls_glattet ?? null, why: a["årsak"] || "", sub: since, thr: null };
    }
    _key() {
      const ps = this._persons();
      return JSON.stringify([this._config, this._open, ps.map(p => { const s = this.st(p.entity);
        const cfgIds = Object.keys(this._hass.states).filter(id => id.includes(`.${p.prefix}_`)); return [p, s && s.state, s && s.attributes, cfgIds.map(id => this.val(id))]; })]);
    }

    _render() {
      const c = this._config; const persons = this._persons(); const infos = persons.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(persons, infos);
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .row { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; }
        .main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer; }
        .txt { flex:1; min-width:0; } .txt .label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .status { text-align:right; } .status .state { display:block; } .status .pct { font-size:12px; opacity:.5; font-variant-numeric:tabular-nums; }
        .status.on .state { opacity:1; } .status.yellow .state { color:var(--yellow); opacity:1; } .status.red .state { color:var(--red); opacity:1; }
        .icon-wrap.zz { background:var(--active-big); color:rgba(70,58,64,.95); }
        .bar { position:relative; height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 0; }
        .bar i { display:block; height:100%; border-radius:2px; background:var(--gray400); transition:width .4s; }
        .bar i.on { background:var(--active-big); } .bar i.yellow { background:var(--yellow); }
        .bar b { position:absolute; top:-3px; width:2px; height:10px; border-radius:1px; background:var(--gray1000); opacity:.35; }
        .body { display:none; padding:12px 6px 4px; } .body.open { display:block; }
        .chips { display:flex; flex-wrap:wrap; gap:6px; }
        .chip.no { opacity:.5; text-decoration:line-through; } .chip.num { opacity:1; font-variant-numeric:tabular-nums; }
        .why { font-size:12px; opacity:.55; margin:8px 2px 0; }
        .settings { margin-top:14px; }
        .times { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:4px 0 10px; }
        .tm { display:flex; flex-direction:column; gap:4px; font-size:12px; opacity:.85; } .tm span { opacity:.7; padding-left:2px; }
        .tm input { width:100%; }
        .stack { display:grid; gap:8px; }
        @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
      </style>
      <div class="list">
        ${persons.length ? persons.map((p, i) => { const s = infos[i]; const open = this._open === i; const thr = this._thr(p);
          return `<div class="card">
            <div class="row">
              <div class="main" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0">
                <div class="icon-wrap ${s.sover ? "zz" : ""}"><ha-icon icon="${s.sover ? "mdi:sleep" : "mdi:sleep-off"}"></ha-icon></div>
                <div class="txt"><div class="name">${KI.esc(p.name)}</div>${s.sub ? `<div class="label">${KI.esc(s.sub)}</div>` : ""}</div>
              </div>
              <div class="status ${s.tone}"><span class="state">${s.txt}</span><span class="pct">${s.ok ? s.pct + " %" : ""}</span></div>
              <div class="sw ${s.sover ? "on" : ""} ${s.ok ? "" : "disabled"}" data-sw="${i}" role="switch" aria-checked="${s.sover}" tabindex="0" title="${s.sover ? "Sett våken" : "Sett sover"}"><i></i></div>
            </div>
            <div class="bar"><i class="${s.tone === "off" ? "" : s.tone}" style="width:${s.pct}%"></i><b style="left:${thr}%"></b></div>
            <div class="body ${open ? "open" : ""}">
              <div class="chips">
                ${s.obs.map(o => `<span class="chip ${o.v === true ? "on" : o.v === false ? "no" : ""}">${o.label}</span>`).join("")}
                ${s.puls !== null ? `<span class="chip num">${s.puls} bpm</span>` : ""}
              </div>
              ${s.why ? `<div class="why">Sist: ${KI.esc(s.why)}</div>` : ""}
              ${c.settings === false ? "" : this._settingsHtml(p, s, i)}
            </div>
          </div>`; }).join("")
        : `<div class="card"><div class="empty">Fant ingen personer fra <b>KI Søvn &amp; Vekking</b>.<br>Legg til «Person – søvndeteksjon» i integrasjonen. Kortet ser etter <code>binary_sensor.&lt;navn&gt;_sovn_sover</code>.</div></div>`}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".main").forEach(el => {
        const i = +el.dataset.i; const t = () => { this._open = this._open === i ? null : i; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, t, () => KI.moreInfo(this, persons[i].entity)); KI.key(el, t);
      });
      r.querySelectorAll(".sw").forEach(el => {
        const p = persons[+el.dataset.sw]; const s = infos[+el.dataset.sw];
        const run = () => {
          if (this.st(p.setSover)) KI.press(this._hass, s.sover ? p.setVaaken : p.setSover);
          else if (p.switch) KI.toggle(this._hass, p.switch);
        };
        KI.bindPress(el, run, () => KI.moreInfo(this, p.switch || p.entity)); KI.key(el, run);
      });
      this._wireSettings();
    }
    _thr(p) { const s = this.st(`number.${p.prefix}_terskel`); return s ? parseFloat(s.state) : (this._config.threshold ?? 80); }

    _settingsHtml(p, s, i) {
      const x = p.prefix;
      const t = (id, lbl) => this.st(id) ? `<label class="tm"><span>${lbl}</span><input type="time" data-time="${id}" value="${KI.hhmm(this.val(id))}"></label>` : "";
      const times = [t(`time.${x}_sovevindu_start`, "Sovevindu fra"), t(`time.${x}_sovevindu_slutt`, "til"), t(`time.${x}_morgen_fra`, "Morgen fra")].join("");
      const sl = (id, name) => this.st(id) ? `<ki-slider-card data-slider="${id}" data-name="${name}"></ki-slider-card>` : "";
      const tg = (id, name, label, icon) => this.st(id) ? `<ki-toggle-card data-toggle-card="${id}" data-name="${name}" data-label="${label}" data-icon="${icon}"></ki-toggle-card>` : "";
      if (!times && !this.st(`number.${x}_terskel`)) return "";
      const hasHr = s.puls !== null || s.obs.some(o => o.label === "lav puls");
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
          ${hasHr ? sl(`number.${x}_puls_sover`, "Puls sover") + sl(`number.${x}_puls_vaken`, "Puls våken") : ""}
          ${tg(`switch.${x}_dor_om_natta_ok`, "Dør om natta", "Do-turer vekker ikke", "mdi:door-open")}
          ${tg(`switch.${x}_automatisk`, "Automatisk", "Styrer søvnbryteren", "mdi:auto-fix")}
        </div>
      </div>`;
    }
    _wireSettings() {
      const r = this.shadowRoot; const h = this._hass; this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { el.setConfig({ entity: el.dataset.slider, name: el.dataset.name, label_width: "112px", value_width: "64px" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("ki-toggle-card").forEach(el => { el.setConfig({ entity: el.dataset.toggleCard, name: el.dataset.name, label: el.dataset.label, icon: el.dataset.icon, background: "var(--gray100)" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("input[type=time]").forEach(inp => inp.addEventListener("change", () => { if (inp.value) h.callService("time", "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" }); }));
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }

    _renderTile(persons, infos) {
      const c = this._config;
      const sovende = persons.filter((p, i) => infos[i].sover).map(p => p.name);
      const pi = infos.findIndex(s => s.pending);
      const label = pi >= 0 ? `${persons[pi].name} ${infos[pi].txt.toLowerCase()}` : !persons.length ? "Ingen personer" : sovende.length === 0 ? "Alle er våkne" : sovende.length === persons.length ? "Alle sover" : sovende.join(", ") + " sover";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; } .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.on { background:var(--active-big); } .dots i.yellow { background:var(--yellow); }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${sovende.length ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:sleep"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Søvn")}</div><div class="label">${KI.esc(label)}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone === "off" ? "" : s.tone}" title="${s.txt}"></i>`).join("")}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => persons[0] && KI.moreInfo(this, persons[0].entity)); KI.key(el, () => KI.go(c));
    }
    getCardSize() { return this._config.mode === "tile" ? 2 : Math.max(1, this._persons().length) * 2; }
  }
  customElements.define("ki-sovn-card", KiSovnCard);
  KI.register("ki-sovn-card", "KI Søvn", "Søvnstatus per person fra KI Søvn & Vekking: sannsynlighet, observasjoner, manuell overstyring og innstillinger");
})(window.KI);

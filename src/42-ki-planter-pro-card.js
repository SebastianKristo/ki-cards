/* ki-planter-pro-card – planter i ki-energi/klima-pro-stil. Finner plantene fra ki_planter selv; sted: filtrerer. */
(function (KI) {
  const DAG = 86400000;
  const fmtDato = d => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  class KiPlanterProCard extends KI.Card {
    static getStubConfig() { return { title: "Planter" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _plants() {
      const c = this._config, h = this._hass; if (!h) return [];
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_planter", type: "plante" });
      if (c.sted) { const q = String(c.sted).toLowerCase(); ids = ids.filter(id => String(h.states[id].attributes.sted || "").toLowerCase().includes(q)); }
      return ids.map(id => { const a = h.states[id].attributes, b = id.replace(/^binary_sensor\./, "").replace(/_trenger_vann$/, "");
        const last = a.sist_vannet ? new Date(a.sist_vannet) : null, iv = a.intervall_dager || 7;
        const left = last ? Math.ceil(iv - (Date.now() - last) / DAG) : null, pct = last ? Math.min(100, Math.max(0, (Date.now() - last) / DAG / iv * 100)) : 100;
        const due = h.states[id].state === "on"; const fukt = a.fuktighet ?? null;
        let tone = due ? "feil" : left === 0 || pct >= 70 ? "advarsel" : "ok";
        let txt = a.grunn === "tørr jord" ? `Tørr jord ${fukt !== null ? Math.round(fukt) + " %" : ""}` : left === null ? "Ikke vannet" : due ? (left < 0 ? `${-left} ${-left === 1 ? "dag" : "dager"} over` : "Vann i dag") : left > 1 ? `Om ${left} dager` : left === 1 ? "I morgen" : (fukt !== null ? `Fuktig ${Math.round(fukt)} %` : "Vann i dag");
        return { entity: id, id: a.plante_id, name: a.navn, latin: a.latin || "", icon: a.ikon, tip: a.tips || "", sted: a.sted, stedPrefix: a.sted_prefix, last, iv, left, pct, tone, txt, due,
          sesong: a.sesong, dagl: a.daglengde_timer, fukt, fuktMin: a.fuktighet_min, fuktSensor: a.fuktighet_sensor, ivVekst: a.intervall_vekst, ivHoy: a.intervall_hoysommer, ivVinter: a.intervall_vinter,
          water: `button.${b}_vannet_na`, interval: `number.${b}_intervall`, intervalV: `number.${b}_intervall_vinter`, intervalH: `number.${b}_intervall_hoysommer`, fuktMinEnt: `number.${b}_fuktighet_min`, auto: `switch.${b}_auto_registrer`, sist: `datetime.${b}_sist_vannet` }; });
    }
    _key() { return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 3600000), this._plants().map(p => [p.entity, (this.st(p.entity) || {}).attributes, this.val(p.interval)])]); }
    _render() {
      const c = this._config, ps = this._plants(), due = ps.filter(p => p.due), adv = this._view === "avansert";
      const steder = [...new Set(ps.map(p => p.stedPrefix))];
      const navn = !ps.length ? "Ingen planter" : due.length === 0 ? "Alle er vannet" : `${due.length} av ${ps.length} trenger vann`;
      const next = ps.filter(p => p.left !== null && p.left > 0).sort((a, b) => a.left - b.left)[0];
      const forkl = due.length ? due.map(p => p.name).join(", ") + " trenger vann" + (next ? ` · neste: ${next.name} ${next.txt.toLowerCase()}` : "") : next ? `Neste: ${next.name} ${next.txt.toLowerCase()}` : "Legg til planter i KI Planter.";
      const okPct = ps.length ? ((ps.length - due.length) / ps.length) * 100 : 0;
      this.shadowRoot.innerHTML = `<style>${KI.pro}
        /* scenen står tettere enn ringraden gjorde – gi den litt mer luft */
        .wrap > .scene-hero { margin-bottom:14px; }
        .wrap > .scene-hero ~ .switch { margin-bottom:14px; }
        .wrap > .scene-hero ki-plante-scene-card { display:block; }
      </style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        ${c.scene && customElements.get("ki-plante-scene-card")
          ? `<div class="scene-hero"></div>`
          : `<div class="hero">${KI.ringHtml(okPct, `${ps.length - due.length}<span>/${ps.length}</span>`, !ps.length ? "av" : due.length ? "rod" : "", ps[0] && ps[0].entity)}
          <div><div class="hero-navn">${KI.esc(navn)}${ps.some(p => (this.st(p.entity) || { attributes: {} }).attributes.grunn === "test") ? ` <span class="merke gul">test</span>` : ""}</div><div class="hero-forklaring">${KI.esc(forkl)}</div></div>`}</div>
        <div class="switch" role="tablist"><div class="switch-valg ${!adv ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${adv ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        <div class="blokk"><div class="blokk-hode"><span>Planter</span><span class="blokk-sub">${ps[0] && ps[0].sesong ? ({ vinter: "❄ vinterhvile", vekst: "🌱 vekstsesong", "høysommer": "☀ høysommer", sommer: "☀ sommer" }[ps[0].sesong] || ps[0].sesong) + (ps[0].dagl ? ` · ${ps[0].dagl} t dag` : "") : ""}</span></div>
          ${ps.length ? ps.map(p => this._plant(p, adv)).join("") : `<div class="tom">Fant ingen planter fra <b>KI Planter</b>. Legg til integrasjonen med et sted og plantene dine.</div>`}
          ${due.length > 1 && steder.length === 1 ? `<div class="knapper"><div class="knapp primar press" data-press="button.${steder[0]}_alle_vannet" data-confirm="Registrere alle som trenger vann som vannet nå?" tabindex="0">Alle vannet</div></div>` : ""}
        </div>
        ${adv && steder.length ? steder.map(sp => { const sw = `switch.${sp}_varsling`, cnt = this.st(`sensor.${sp}_trenger_vann`); return `<div class="blokk"><div class="blokk-hode"><span>Varsling</span><span class="blokk-sub">${cnt ? KI.friendly(this._hass, `sensor.${sp}_trenger_vann`).replace(/ trenger vann$/i, "") : ""}</span></div>
          ${this.st(sw) ? `<div class="rad"><div><div class="rad-navn">Varsel når planter trenger vann</div><div class="rad-sub">${cnt && cnt.attributes.sist_varslet ? "sist varslet " + new Date(cnt.attributes.sist_varslet).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "klokkeslett settes i integrasjonen"}</div></div><div class="bryter ${this.on(sw) ? "on" : ""}" data-toggle="${sw}" tabindex="0"><span></span></div></div>` : ""}
          ${(cnt && cnt.attributes.varsel_enheter || []).map(svc => { const id = Object.keys(this._hass.states).find(k => k.startsWith(`switch.${sp}_varsel_`) && this._hass.states[k].attributes.tjeneste === svc); if (!id) return "";
            return `<div class="rad"><div><div class="rad-navn">${KI.esc(KI.friendly(this._hass, id).replace(/^.*?Varsel /, ""))}</div><div class="rad-sub">${KI.esc(svc)}</div></div><div class="bryter ${this.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>`; }).join("")}
          ${this.st(`switch.${sp}_testvisning`) ? `<div class="rad"><div><div class="rad-navn">Testvisning</div><div class="rad-sub">Viser alle planter som tørste i 10 min – i kortet og på dashboardet</div></div><div class="bryter ${this.on(`switch.${sp}_testvisning`) ? "on" : ""}" data-toggle="switch.${sp}_testvisning" tabindex="0"><span></span></div></div>` : ""}
          <div class="knapper"><div class="knapp press" data-press="button.${sp}_send_varsel" tabindex="0">🧪 Send testvarsel</div></div></div>`; }).join("") : ""}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
      this._settInnScene();
    }

    /* Scenevisning: vinduskarmen som hero i stedet for ringen */
    _passHass(h) { if (this._sceneEl) this._sceneEl.hass = h; }

    _settInnScene() {
      const boks = this.shadowRoot.querySelector(".scene-hero");
      if (!boks) { this._sceneEl = null; return; }
      if (!this._sceneEl) {
        this._sceneEl = document.createElement("ki-plante-scene-card");
        this._sceneEl.setConfig({
          sted: this._config.sted,
          entities: this._plants().map((p) => p.entity),   // nøyaktig de samme plantene
          hoyde: this._config.scene_hoyde || 200,
          natt: this._config.scene_natt,
        });
      }
      else {
        this._sceneEl.setConfig({
          sted: this._config.sted,
          entities: this._plants().map((p) => p.entity),
          hoyde: this._config.scene_hoyde || 200,
          natt: this._config.scene_natt,
        });
      }
      if (this._sceneEl.parentElement !== boks) boks.appendChild(this._sceneEl);
      this._sceneEl.hass = this._hass;
    }
    _plant(p, adv) {
      const open = this._apen === p.entity;
      return `<div class="last ${open ? "apen" : ""}">
        <div class="last-hode" data-open="${p.entity}">
          <div class="prikk p-${p.tone}"></div>
          <div><div class="last-navn">${KI.esc(p.name)}</div><div class="last-forklaring">${KI.esc(p.latin || (p.last ? "vannet " + fmtDato(p.last) : ""))}</div></div>
          <div class="last-verdi">${p.txt}${p.last ? `<small>vannet ${fmtDato(p.last)}</small>` : ""}</div>
        </div>
        <div class="last-kropp">
          <div class="spor"><div class="fyll ${p.tone === "feil" ? "rod" : p.tone === "advarsel" ? "gul" : "gronn"}" style="width:${p.pct}%"></div></div>
          <div class="under"><span>${p.last ? "sist " + p.last.toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "ikke vannet ennå"}</span><span>${p.last ? "neste " + fmtDato(new Date(p.last.getTime() + p.iv * DAG)) : ""}</span></div>
          <div class="last-fakta" style="padding-top:8px"><span>hver ${Math.round(p.iv)}. dag nå</span>${p.ivVekst ? `<span>🌱 ${p.ivVekst} d</span>` : ""}${p.ivHoy ? `<span>☀ ${p.ivHoy} d</span>` : ""}${p.ivVinter ? `<span>❄ ${p.ivVinter} d</span>` : ""}${p.fukt !== null ? `<span class="${p.fukt < p.fuktMin ? "b-feil" : "b-ok"}" data-more="${p.fuktSensor}" style="cursor:pointer">fuktighet ${Math.round(p.fukt)} %</span>` : p.fuktSensor ? `<span>fuktsensor utilgjengelig</span>` : ""}</div>
          ${p.tip ? `<div class="notat">${KI.esc(p.tip)}</div>` : ""}
          ${adv ? KI.stepperHtml(this._hass, p.interval, "🌱 Vekstsesong", { unit: " d", sub: "Daglengde 10–17 t" }) + KI.stepperHtml(this._hass, p.intervalH, "☀ Høysommer", { unit: " d", sub: "Over 17 t dag · 0 = som vekstsesong" }) + KI.stepperHtml(this._hass, p.intervalV, "❄ Vinterhvile", { unit: " d", sub: "Under 10 t dag · 0 = som vekstsesong" })
            + (this.st(p.fuktMinEnt) ? KI.stepperHtml(this._hass, p.fuktMinEnt, "Tørr under", { unit: " %", tick: p.fukt ?? undefined }) : "")
            + (this.st(p.auto) ? `<div class="rad"><div><div class="rad-navn">Auto-registrer</div><div class="rad-sub">Vanning registreres når fuktigheten hopper opp</div></div><div class="bryter ${this.on(p.auto) ? "on" : ""}" data-toggle="${p.auto}" tabindex="0"><span></span></div></div>` : "")
            + `<div class="rad" data-more="${p.sist}" style="cursor:pointer"><span class="rad-navn">Sist vannet</span><span class="rad-verdi">rediger ›</span></div>` : ""}
          <div class="knapper"><div class="knapp primar press" data-press="${p.water}" ${this._config.confirm ? `data-confirm="Registrere ${KI.esc(p.name)} som vannet nå?"` : ""} tabindex="0">Vannet nå</div></div>
        </div></div>`;
    }
    getCardSize() { return 3 + this._plants().length; }
  }
  customElements.define("ki-planter-pro-card", KiPlanterProCard);
  KI.register("ki-planter-pro-card", "KI Planter Pro", "Planter: status, neste vanning, tips, intervall og varsling");
})(window.KI);

/* ki-vekking-pro-card – vekkealarm i ki-energi/klima-pro-stil. Finner alarmen fra ki_sovn (type vekking) selv; prefix: for å velge. */
(function (KI) {
  const DAGER = [["mandag", "Ma", "Mandag"], ["tirsdag", "Ti", "Tirsdag"], ["onsdag", "On", "Onsdag"], ["torsdag", "To", "Torsdag"], ["fredag", "Fr", "Fredag"], ["lordag", "Lø", "Lørdag"], ["sondag", "Sø", "Søndag"]];
  const idag = () => { const j = new Date().getDay(); return DAGER[j === 0 ? 6 : j - 1][0]; };

  class KiVekkingProCard extends KI.Card {
    static getStubConfig() { return { title: "Vekking" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _prefix() {
      const c = this._config; if (c.prefix) return c.prefix;
      const hit = KI.find(this._hass, "sensor", { integrasjon: "ki_sovn", type: "vekking" })[0]; if (hit) return this.st(hit).attributes.prefix;
      const old = Object.keys(this._hass ? this._hass.states : {}).find(id => /^sensor\..*_vekking_neste_alarm$/.test(id)); return old ? old.slice(7, -12) : null;
    }
    _ids(p) { return { master: `switch.${p}_aktiv`, natt: `switch.${p}_nattlampe`, vekk: `switch.${p}_vekk_person`, bare: `switch.${p}_bare_hvis_sover`, fade: `number.${p}_fade_opp`, off: `number.${p}_av_etter`,
      neste: `sensor.${p}_neste_alarm`, kjorer: `binary_sensor.${p}_kjorer`, test: `button.${p}_test`, stopp: `button.${p}_stopp`, dayOn: d => `switch.${p}_${d}_aktiv`, dayTime: d => `time.${p}_${d}` }; }
    _key() { const p = this._prefix(); if (!p) return JSON.stringify([this._config, "none"]); const e = this._ids(p);
      const ids = [e.master, e.natt, e.vekk, e.bare, e.fade, e.off, e.neste, e.kjorer, ...DAGER.flatMap(([d]) => [e.dayOn(d), e.dayTime(d)])];
      const n = this.st(e.neste); return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 60000), ids.map(id => this.val(id)), n && n.attributes, (this.st(e.kjorer) || {}).attributes, ((n && n.attributes.betingelser) || []).map(id => this.val(id))]); }

    _render() {
      const c = this._config, p = this._prefix();
      if (!p) { this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap"><div class="blokk"><div class="tom">Fant ingen vekkealarm fra <b>KI Søvn &amp; Vekking</b>. Legg til «Vekkealarm» i integrasjonen, eller sett <code>prefix:</code>.</div></div></div>`; return; }
      const e = this._ids(p), n = this.st(e.neste), a = (n && n.attributes) || {};
      const masterOn = this.on(e.master), running = this.on(e.kjorer), fase = (this.st(e.kjorer) || { attributes: {} }).attributes.fase;
      const tid = n && n.state !== "Av" ? n.state : null;
      const when = a.neste_tidspunkt ? new Date(a.neste_tidspunkt) : null;
      const igjenMin = when ? Math.max(0, Math.round((when - Date.now()) / 60000)) : null;
      const igjen = igjenMin === null ? "" : igjenMin >= 60 ? `${Math.floor(igjenMin / 60)} t ${igjenMin % 60} min` : `${igjenMin} min`;
      const erIdag = when && when.toDateString() === new Date().toDateString();
      const navn = running ? (fase === "fader" ? "Fader opp lyset" : "Lyset er på") : !masterOn ? "Vekking er av" : !tid ? "Ingen dager valgt" : `${erIdag ? "I dag" : a.neste_dag} kl. ${tid}`;
      const skip = masterOn && a.hopper_over ? (a.hopper_over === "betingelser" ? "Hoppes over: en betingelse er av." : "Hoppes over: personen er våken.") : "";
      const person = a.person ? `${KI.friendly(this._hass, a.person).replace(/ (søvn )?sover$/i, "")} ${a.person_sover ? "sover" : a.person_sover === false ? "er våken" : ""}` : "";
      const forkl = running ? `Startet ${a.sist_kjort ? KI.clock(a.sist_kjort) : ""} · fader ${this.val(e.fade)} min, av etter ${this.val(e.off)} min` : [skip, igjen ? `om ${igjen}` : "", person].filter(Boolean).join(" · ") || "Sett ukedager og tider under.";
      const ringPct = igjenMin === null ? 0 : Math.max(0, Math.min(100, 100 - (igjenMin / (24 * 60)) * 100));
      const ringCls = running ? "gul" : !masterOn ? "av" : skip ? "rod" : "aktiv";
      const conds = a.betingelser || [], adv = this._view === "avansert";
      const sw = (id, lbl, sub) => this.st(id) ? `<div class="rad"><div><div class="rad-navn">${lbl}</div>${sub ? `<div class="rad-sub">${sub}</div>` : ""}</div><div class="bryter ${this.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>` : "";
      this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero">${KI.ringHtml(ringPct, tid && masterOn ? tid : "Av", ringCls, e.neste)}
          <div><div class="hero-navn">${KI.esc(navn)}${running ? ` <span class="merke gul">kjører</span>` : ""}</div><div class="hero-forklaring">${KI.esc(forkl)}</div></div></div>
        <div class="switch" role="tablist"><div class="switch-valg ${!adv ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${adv ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>

        <div class="blokk">
          <div class="blokk-hode"><span>Vekking</span><span class="blokk-sub">${masterOn ? "på" : "av"}</span></div>
          ${sw(e.master, "Aktiv", "Hovedbryter for alle dager")}
          <div class="blokk-hode"><span>Ukeplan</span><span class="blokk-sub">trykk en dag for å slå av/på</span></div>
          <div class="dager">${DAGER.map(([d, k, full]) => `<div class="dag ${this.on(e.dayOn(d)) ? "on" : ""} ${d === idag() ? "idag" : ""}" data-toggle="${e.dayOn(d)}" title="${full}" role="switch" tabindex="0">${k}</div>`).join("")}</div>
          ${DAGER.map(([d, , full]) => `<div class="rad ${this.on(e.dayOn(d)) ? "" : "dim"}"><span class="rad-navn">${full}</span><input type="time" data-time="${e.dayTime(d)}" value="${KI.hhmm(this.val(e.dayTime(d)))}"></div>`).join("")}
        </div>

        ${adv ? `<div class="blokk"><div class="blokk-hode"><span>Lys</span><span class="blokk-sub">${(a.lys || []).length} lys</span></div>
          ${KI.sliderHtml(this._hass, e.fade, "Fade opp")}${KI.sliderHtml(this._hass, e.off, "Av etter")}${sw(e.natt, "Nattlampe", "Ta med i vekkingen")}
          ${(a.lys || []).length ? `<div class="last-fakta" style="padding-top:8px">${a.lys.map(id => `<span data-more="${id}" style="cursor:pointer">${KI.esc(KI.friendly(this._hass, id))}</span>`).join("")}</div>` : ""}</div>
        ${a.person ? `<div class="blokk"><div class="blokk-hode"><span>Person</span><span class="blokk-sub">${KI.esc(person)}</span></div>
          ${sw(e.vekk, "Vekk person", "Marker som våken når lyset er oppe")}${sw(e.bare, "Bare hvis sover", "Hopp over alarmen hvis personen er våken")}</div>` : ""}
        ${conds.length ? `<div class="blokk"><div class="blokk-hode"><span>Betingelser</span><span class="blokk-sub">alle må være på</span></div>
          ${conds.map(id => `<div class="rad" data-more="${id}" style="cursor:pointer"><span class="rad-navn">${KI.esc((c.condition_names || {})[id] || KI.friendly(this._hass, id))}</span><span class="last-fakta" style="padding:0"><span class="${this.on(id) ? "b-ok" : "b-feil"}">${this.on(id) ? "På" : "Av"}</span></span></div>`).join("")}</div>` : ""}
        ${a.sist_kjort || a.sist_hoppet_over ? `<div class="blokk"><div class="blokk-hode"><span>Logg</span></div>
          ${a.sist_kjort ? `<div class="rad"><span class="rad-navn">Sist kjørt</span><span class="rad-verdi">${new Date(a.sist_kjort).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>` : ""}
          ${a.sist_hoppet_over ? `<div class="rad"><span class="rad-navn">Sist hoppet over</span><span class="rad-verdi">${KI.esc(a.sist_hoppet_over)}</span></div>` : ""}</div>` : ""}` : ""}

        ${c.test === false ? "" : `<div class="knapper">
          ${running ? `<div class="knapp fjern press" data-press="${e.stopp}" tabindex="0">Stopp og slukk</div>` : ""}
          <div class="knapp ${running ? "" : "primar"} press" data-press="${e.test}" data-confirm="${c.test_confirm || "Kjøre vekkesekvensen nå?"}" tabindex="0">${running ? "Kjører …" : "Test vekkesekvensen"}</div></div>`}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
    }
    getCardSize() { return 8; }
  }
  customElements.define("ki-vekking-pro-card", KiVekkingProCard);
  KI.register("ki-vekking-pro-card", "KI Vekking Pro", "Vekkealarm: neste alarm, ukeplan, lys, person, betingelser og logg");
})(window.KI);

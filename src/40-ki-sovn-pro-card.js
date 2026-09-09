/* ki-sovn-pro-card – søvn for husstanden i ki-energi/klima-pro-stil. Finner personene fra ki_sovn selv. */
(function (KI) {
  const OBS = { hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga" };

  class KiSovnProCard extends KI.Card {
    static getStubConfig() { return { title: "Søvn og vekking" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _persons() {
      const c = this._config, h = this._hass; if (!h) return [];
      let ids = c.persons ? c.persons.map(p => p.entity || p) : KI.find(h, "binary_sensor", { integrasjon: "ki_sovn", type: "person" });
      if (!ids.length) ids = Object.keys(h.states).filter(id => /^binary_sensor\..*_sovn_sover$/.test(id)).sort();
      return ids.map((id, i) => { const a = (h.states[id] || { attributes: {} }).attributes; const p = (c.persons && typeof c.persons[i] === "object") ? c.persons[i] : {};
        const prefix = a.prefix || id.replace(/^binary_sensor\./, "").replace(/_sover$/, "");
        return { entity: id, prefix, name: p.name || a.navn || KI.friendly(h, id).replace(/ (søvn )?sover$/i, ""), bedtime: p.bedtime || "", bryter: a.bryter,
          setSover: `button.${prefix}_sett_sover`, setVaaken: `button.${prefix}_sett_vaken` }; });
    }
    _info(p) {
      const st = this.st(p.entity); if (!st) return { ok: false, tone: "feil", txt: "Ikke satt opp", sub: "finnes ikke i integrasjonen", pct: 0, obs: [] };
      const a = st.attributes, sover = st.state === "on", pending = a["venter_på"] || null, pct = Math.round(a.sannsynlighet ?? 0);
      const txt = pending === "sovner" ? "Sovner …" : pending === "våkner" ? "Våkner …" : sover ? "Sover" : "Våken";
      const sub = [a.siden ? "siden " + KI.clock(a.siden) : "", p.bedtime ? "legger seg " + p.bedtime : ""].filter(Boolean).join(" · ");
      return { ok: true, sover, pending, pct, txt, sub, tone: pending ? "advarsel" : sover ? "aktiv" : "nøytral", why: a["årsak"] || "", puls: a.obs_puls_glattet ?? null,
        obs: Object.keys(OBS).map(k => ({ l: OBS[k], v: a["obs_" + k] })).filter(o => o.v !== undefined) };
    }
    _vekking() { const c = this._config; if (c.vekking === false) return []; return c.vekking_prefix ? [c.vekking_prefix] : KI.vekkingPrefixes(this._hass); }
    _key() { const ps = this._persons(); const vk = this._vekking(); return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 60000), ps.map(p => { const s = this.st(p.entity);
      return [p, s && s.state, s && s.attributes, Object.keys(this._hass.states).filter(id => id.includes(`.${p.prefix}_`)).map(id => this.val(id))]; }),
      vk.map(p => Object.keys(this._hass.states).filter(id => id.includes(`.${p}_`)).map(id => [this.val(id), this.st(id).attributes]))]); }

    _render() {
      const c = this._config, persons = this._persons(), infos = persons.map(p => this._info(p));
      const n = persons.length, sov = infos.filter(s => s.sover).length, pend = infos.find(s => s.pending);
      const navn = !n ? "Ingen personer" : sov === 0 ? "Alle er våkne" : sov === n ? "Alle sover" : `${sov} av ${n} sover`;
      const forkl = pend ? `${persons[infos.indexOf(pend)].name} ${pend.txt.toLowerCase()}` : infos.map((s, i) => s.ok ? `${persons[i].name}: ${s.txt.toLowerCase()}${s.sub.startsWith("siden") ? " " + s.sub.split(" · ")[0] : ""}` : `${persons[i].name}: ikke satt opp`).join(" · ");
      const ringCls = !n ? "av" : sov === n ? "aktiv" : sov ? "gul" : "av";
      const vks = this._vekking().map(p => KI.vekkingInfo(this, p));
      const vkTxt = vks.filter(v => v.n).map(v => v.running ? `${v.name}: ${v.navn.toLowerCase()}` : v.masterOn && v.tid ? `Vekking ${v.navn.replace(/^I dag/, "i dag").replace(/^([A-ZÆØÅ])/, m => m.toLowerCase())}${v.igjen ? " (om " + v.igjen + ")" : ""}` : "Vekking av").join(" · ");
      this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero">${KI.ringHtml(n ? (sov / n) * 100 : 0, `${sov}<span>/${n}</span>`, ringCls, persons[0] && persons[0].entity)}
          <div><div class="hero-navn">${KI.esc(navn)}</div><div class="hero-forklaring">${KI.esc(forkl)}${vkTxt ? `<br>${KI.esc(vkTxt)}` : ""}</div></div></div>
        <div class="switch" role="tablist"><div class="switch-valg ${this._view === "enkel" ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${this._view === "avansert" ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        <div class="blokk"><div class="blokk-hode"><span>Personer</span><span class="blokk-sub">${n ? "trykk for detaljer" : ""}</span></div>
          ${n ? persons.map((p, i) => this._person(p, infos[i])).join("") : `<div class="tom">Fant ingen personer fra <b>KI Søvn &amp; Vekking</b>. Legg til «Person – søvndeteksjon» i integrasjonen.</div>`}
        </div>
        ${vks.filter(v => v.n).map(v => KI.vekkingBlocks(this, v, this._view === "avansert", c)).join("")}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
    }
    _person(p, s) {
      const open = this._apen === p.entity, x = p.prefix, adv = this._view === "avansert";
      const toggleId = this.st(p.setSover) ? (s.sover ? p.setVaaken : p.setSover) : null;
      const bryter = toggleId ? `<div class="bryter ${s.sover ? "on" : ""}" data-press="${toggleId}" role="switch" aria-checked="${s.sover}" tabindex="0"><span></span></div>`
        : p.bryter ? `<div class="bryter ${s.sover ? "on" : ""}" data-toggle="${p.bryter}" role="switch" tabindex="0"><span></span></div>` : `<div class="bryter mangler"><span></span></div>`;
      const t = (id, lbl) => this.st(id) ? `<div class="rad"><span class="rad-navn">${lbl}</span><input type="time" data-time="${id}" value="${KI.hhmm(this.val(id))}"></div>` : "";
      const sw = (id, lbl, sub) => this.st(id) ? `<div class="rad"><div><div class="rad-navn">${lbl}</div><div class="rad-sub">${sub}</div></div><div class="bryter ${this.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>` : "";
      const sl = (id, lbl) => KI.sliderHtml(this._hass, id, lbl);
      const thr = this.st(`number.${x}_terskel`) ? parseFloat(this.val(`number.${x}_terskel`)) : 80;
      return `<div class="last ${open ? "apen" : ""}">
        <div class="last-hode med-bryter" data-open="${p.entity}">
          <div class="prikk p-${s.tone === "aktiv" ? "aktiv" : s.tone === "advarsel" ? "advarsel" : s.tone === "feil" ? "feil" : "nøytral"}"></div>
          <div><div class="last-navn">${KI.esc(p.name)}</div><div class="last-forklaring">${KI.esc(s.sub)}</div></div>
          <div class="last-verdi">${s.txt}${s.ok ? `<small>${s.pct} %</small>` : ""}</div>
          ${bryter}
        </div>
        <div class="last-kropp">
          ${s.ok ? `<div class="spor"><div class="fyll ${s.tone === "advarsel" ? "gul" : s.sover ? "" : "gronn"}" style="width:${s.pct}%;${s.sover || s.pending ? "" : "opacity:.5"}"></div><div class="strek" style="left:${thr}%"></div></div>
            <div class="under"><span>sannsynlighet ${s.pct} %</span><span>terskel ${thr} %</span></div>
            <div class="last-fakta" style="padding-top:8px">${s.obs.map(o => `<span class="${o.v === true ? "b-ok" : o.v === false ? "b-nei" : ""}">${o.l}</span>`).join("")}${s.puls !== null ? `<span>${s.puls} bpm</span>` : ""}</div>
            ${s.why ? `<div class="notat" style="padding-top:0">Sist endret: ${KI.esc(s.why)}</div>` : ""}
            ${adv ? `<div class="blokk-hode"><span>Tider</span></div>${t(`time.${x}_sovevindu_start`, "Sovevindu fra")}${t(`time.${x}_sovevindu_slutt`, "Sovevindu til")}${t(`time.${x}_morgen_fra`, "Morgen fra")}
              <div class="blokk-hode"><span>Terskler</span></div>${sl(`number.${x}_terskel`, "Terskel")}${sl(`number.${x}_forsinkelse_sovner`, "Sovner etter")}${sl(`number.${x}_forsinkelse_vakner`, "Våkner etter")}${sl(`number.${x}_hold_i_rommet`, "Hold i rommet")}${sl(`number.${x}_borte_fra_rommet_vaken`, "Borte = våken")}${sl(`number.${x}_dor_lukket_i`, "Dør lukket i")}${s.puls !== null ? sl(`number.${x}_puls_sover`, "Puls sover") + sl(`number.${x}_puls_vaken`, "Puls våken") : ""}
              <div class="blokk-hode"><span>Regler</span></div>${sw(`switch.${x}_dor_om_natta_ok`, "Dør om natta OK", "Do-turer vekker ikke")}${sw(`switch.${x}_automatisk`, "Automatisk", "Styrer søvnbryteren")}` : ""}`
          : `<div class="tom">Personen finnes ikke i KI Søvn &amp; Vekking. Sjekk at oppføringen «${KI.esc(p.name)}» finnes og har entiteten <code>${p.entity}</code>.</div>`}
        </div></div>`;
    }
    getCardSize() { return 3 + this._persons().length * 2; }
  }
  customElements.define("ki-sovn-pro-card", KiSovnProCard);
  KI.register("ki-sovn-pro-card", "KI Søvn Pro", "Søvn og vekking i ett kort: status per person, sannsynlighet, observasjoner, innstillinger og vekkealarm(er)");
})(window.KI);

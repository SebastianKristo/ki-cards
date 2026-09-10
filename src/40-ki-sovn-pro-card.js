/* ki-sovn-pro-card – søvn for husstanden i ki-energi/klima-pro-stil. Finner personene fra ki_sovn selv. */
(function (KI) {
  const OBS = { hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga" };

  class KiSovnProCard extends KI.Card {
    static getStubConfig() { return { title: "Søvn og vekking" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._tab = c.tab || "sovn"; this._apen = null; super.setConfig(c); }

    /* Nattehimmel med måne: månefasen = andel som sover (tynn sigd → fullmåne). Stjerner blinker, zzz driver når noen sover. */
    _moonHtml(frac, sov, n, pending) {
      const R = 26, cx = 44, cy = 40;
      const dx = (0.3 + Math.max(0, Math.min(1, frac)) * 1.95) * R;      // skyggens forskyvning: 0 = tynn sigd, 1 = fullmåne
      const stars = [[14, 14, 1.6, 0], [70, 12, 1.2, .9], [22, 62, 1.1, 1.7], [76, 58, 1.5, .4], [58, 8, .9, 2.3], [8, 40, 1, 1.3]]
        .map(([x, y, r, d]) => `<circle class="stjerne" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${d}s"></circle>`).join("");
      const zzz = sov ? `<g class="mzzz"><text x="62" y="26">z</text><text x="62" y="26" style="animation-delay:1s">z</text><text x="62" y="26" style="animation-delay:2s">z</text></g>` : "";
      return `<div class="himmel ${sov ? "natt" : ""} ${pending ? "blink" : ""}" data-more="${this._persons()[0] ? this._persons()[0].entity : ""}">
        <svg viewBox="0 0 88 88" aria-hidden="true">
          <defs><clipPath id="mclip"><circle cx="${cx}" cy="${cy}" r="${R}"></circle></clipPath>
            <radialGradient id="mglow"><stop offset="55%" stop-color="var(--yellow,#f2c94c)" stop-opacity=".35"></stop><stop offset="100%" stop-color="var(--yellow,#f2c94c)" stop-opacity="0"></stop></radialGradient></defs>
          ${stars}
          <circle class="glod" cx="${cx}" cy="${cy}" r="${R + 12}" fill="url(#mglow)"></circle>
          <g class="mane ${sov ? "pust" : ""}" style="transform-origin:${cx}px ${cy}px">
            <circle cx="${cx}" cy="${cy}" r="${R}" class="mane-lys"></circle>
            <circle cx="${cx - dx}" cy="${cy - 3}" r="${R + 2}" class="mane-skygge" clip-path="url(#mclip)"></circle>
          </g>
          ${zzz}
        </svg>
        <div class="mtall">${sov}<span>/${n}</span></div>
      </div>`;
    }
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
      const vindu = a["obs_vindu_åpent"] === true;
      const sub = [a.siden ? "siden " + KI.clock(a.siden) : "", p.bedtime ? "legger seg " + p.bedtime : "", vindu ? "vindu åpent" : ""].filter(Boolean).join(" · ");
      return { ok: true, sover, pending, pct, txt, sub, vindu, tone: pending ? "advarsel" : sover ? "aktiv" : "nøytral", why: a["årsak"] || "", puls: a.obs_puls_glattet ?? null,
        obs: Object.keys(OBS).map(k => ({ l: OBS[k], v: a["obs_" + k] })).filter(o => o.v !== undefined) };
    }
    _vekking() { const c = this._config; if (c.vekking === false) return []; return c.vekking_prefix ? [c.vekking_prefix] : KI.vekkingPrefixes(this._hass); }
    _key() { const ps = this._persons(); const vk = this._vekking(); return JSON.stringify([this._config, this._view, this._tab, this._apen, Math.floor(Date.now() / 60000), ps.map(p => { const s = this.st(p.entity);
      return [p, s && s.state, s && s.attributes, Object.keys(this._hass.states).filter(id => id.includes(`.${p.prefix}_`)).map(id => this.val(id))]; }),
      vk.map(p => Object.keys(this._hass.states).filter(id => id.includes(`.${p}_`)).map(id => [this.val(id), this.st(id).attributes]))]); }

    _render() {
      const c = this._config, persons = this._persons(), infos = persons.map(p => this._info(p));
      const n = persons.length, sov = infos.filter(s => s.sover).length, pend = infos.find(s => s.pending);
      const navn = !n ? "Ingen personer" : sov === 0 ? "Alle er våkne" : sov === n ? "Alle sover" : `${sov} av ${n} sover`;
      const forkl = pend ? `${persons[infos.indexOf(pend)].name} ${pend.txt.toLowerCase()}` : infos.map((s, i) => s.ok ? `${persons[i].name}: ${s.txt.toLowerCase()}${s.sub.startsWith("siden") ? " " + s.sub.split(" · ")[0] : ""}` : `${persons[i].name}: ikke satt opp`).join(" · ");
      const ringCls = !n ? "av" : sov === n ? "aktiv" : sov ? "gul" : "av";
      const vks = this._vekking().map(p => KI.vekkingInfo(this, p));
      const harVk = vks.some(v => v.n), tabs = harVk && c.tabs !== false;
      const visSovn = !tabs || this._tab === "sovn", visVk = harVk && (!tabs || this._tab === "vekking");
      const vkTxt = vks.filter(v => v.n).map(v => v.running ? `${v.name}: ${v.navn.toLowerCase()}` : v.masterOn && v.tid ? `Vekking ${v.navn.replace(/^I dag/, "i dag").replace(/^([A-ZÆØÅ])/, m => m.toLowerCase())}${v.igjen ? " (om " + v.igjen + ")" : ""}` : "Vekking av").join(" · ");
      this.shadowRoot.innerHTML = `<style>${KI.pro}
        .himmel { position:relative; width:88px; height:88px; border-radius:50%; overflow:hidden; cursor:pointer;
          background:radial-gradient(circle at 50% 40%, rgba(60,70,120,.35), rgba(20,24,48,.55)); transition:background .6s; }
        .himmel.natt { background:radial-gradient(circle at 50% 40%, rgba(40,48,110,.6), rgba(8,10,30,.9)); }
        .himmel svg { width:88px; height:88px; display:block; }
        .mane-lys { fill:var(--yellow,#f2c94c); } .himmel:not(.natt) .mane-lys { fill:rgba(242,201,76,.55); }
        .mane-skygge { fill:rgb(16,19,44); } .himmel:not(.natt) .mane-skygge { fill:rgba(28,32,60,.92); }
        .glod { opacity:0; } .himmel.natt .glod { animation:ki-glod 4s ease-in-out infinite; }
        .stjerne { fill:#fff; opacity:.35; } .himmel.natt .stjerne { animation:ki-stjerne 3.2s ease-in-out infinite; }
        .mzzz text { font-size:11px; font-weight:700; fill:#fff; animation:ki-mzzz 3s ease-out infinite; opacity:0; }
        .mtall { position:absolute; left:0; right:0; bottom:5px; text-align:center; font-size:13px; font-weight:700; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.6); font-variant-numeric:tabular-nums; }
        .mtall span { font-size:10px; opacity:.7; }
        @keyframes ki-glod { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes ki-stjerne { 0%,100% { opacity:.25; } 50% { opacity:1; } }
        @keyframes ki-mzzz { 0% { opacity:0; transform:translate(0,0) scale(.7); } 25% { opacity:1; } 100% { opacity:0; transform:translate(10px,-20px) scale(1.2); } }
        .b-vindu { background:rgba(120,170,255,.28) !important; }
        @media (prefers-reduced-motion: reduce) { .glod, .stjerne, .mzzz text, .mane { animation:none !important; } }
      </style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero natt-hero">${c.mane === false ? `<div class="${sov ? "pust" : ""}">${KI.ringHtml(n ? (sov / n) * 100 : 0, `${sov}<span>/${n}</span>`, ringCls, persons[0] && persons[0].entity)}</div>` : this._moonHtml(n ? sov / n : 0, sov, n, !!pend)}
          <div><div class="hero-navn">${KI.esc(navn)}</div><div class="hero-forklaring">${KI.esc(forkl)}${vkTxt ? `<br>${KI.esc(vkTxt)}` : ""}</div></div></div>
        ${harVk && c.tabs !== false ? `<div class="switch" role="tablist"><div class="switch-valg ${this._tab === "sovn" ? "aktiv" : ""}" data-tab="sovn">Søvn</div><div class="switch-valg ${this._tab === "vekking" ? "aktiv" : ""}" data-tab="vekking">Vekking</div></div>` : ""}
        <div class="switch" role="tablist"><div class="switch-valg ${this._view === "enkel" ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${this._view === "avansert" ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        ${visSovn ? `<div class="blokk"><div class="blokk-hode"><span>Personer</span><span class="blokk-sub">${n ? "trykk for detaljer" : ""}</span></div>
          ${n ? persons.map((p, i) => this._person(p, infos[i])).join("") : `<div class="tom">Fant ingen personer fra <b>KI Søvn &amp; Vekking</b>. Legg til «Person – søvndeteksjon» i integrasjonen.</div>`}
        </div>
        ${n && c.graf !== false ? `<div class="blokk"><div class="blokk-hode"><span>Siste ${c.hours || 24} timer</span><span class="blokk-sub">hvem sov når</span></div>${this._natt(persons, infos, c.hours || 24)}</div>` : ""}` : ""}
        ${visVk ? vks.filter(v => v.n).map(v => KI.vekkingBlocks(this, v, this._view === "avansert", c)).join("") : ""}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
      this.shadowRoot.querySelectorAll("[data-tab]").forEach(el => el.addEventListener("click", () => { this._tab = el.dataset.tab; this._lastKey = null; this._maybeRender(); }));
      this._loadHist(persons);
    }
    /* Tidslinje per person: bånd der personen sov */
    _natt(persons, infos, hours) {
      const W = 320, rowH = 22, L = 70, now = Date.now(), t0 = now - hours * 3600000;
      const x = (t) => L + ((Math.max(t0, Math.min(now, t)) - t0) / (now - t0)) * (W - L - 4);
      const rows = persons.map((p, i) => { const h = ((this._hist || {})[p.prefix] || {})[p.entity] || [];
        const bands = []; let on = null; h.forEach(([t, st]) => { if (st === "on" && on === null) on = t; if (st !== "on" && on !== null) { bands.push([on, t]); on = null; } }); if (on !== null) bands.push([on, now]);
        const y = 6 + i * rowH; const tot = bands.reduce((a, [s, e]) => a + (e - s), 0) / 3600000;
        return `<text x="0" y="${y + 13}">${KI.esc(p.name)}</text><rect x="${L}" y="${y + 3}" width="${W - L - 4}" height="12" rx="6" fill="rgba(128,128,128,.14)"></rect>
          ${bands.map(([a, b]) => `<rect class="sover gronn" style="opacity:.85" x="${x(a).toFixed(1)}" y="${y + 3}" width="${Math.max(2, x(b) - x(a)).toFixed(1)}" height="12" rx="6"></rect>`).join("")}
          <text x="${W}" y="${y + 13}" text-anchor="end" style="opacity:.8">${tot ? (tot >= 1 ? tot.toFixed(1) + " t" : Math.round(tot * 60) + " min") : ""}</text>`; });
      const H = 6 + persons.length * rowH + 14;
      const ticks = []; for (let h = 0; h <= hours; h += hours / 4) { const t = t0 + h * 3600000; ticks.push(`<text x="${x(t).toFixed(1)}" y="${H - 2}" text-anchor="${h === 0 ? "start" : h === hours ? "end" : "middle"}">${new Date(t).getHours().toString().padStart(2, "0")}</text>`); }
      return `<svg class="graf" viewBox="0 0 ${W} ${H}" style="height:${H}px">${rows.join("")}${ticks.join("")}</svg>`;
    }
    _loadHist(persons) {
      if (!persons.length || this._config.graf === false) return;
      const ids = persons.flatMap(p => [p.entity, `sensor.${p.prefix}_sannsynlighet`]);
      const before = this._histStamp;
      KI.history(this._hass, ids, this._config.hours || 24).then(data => {
        const stamp = JSON.stringify(Object.keys(data).map(k => [k, data[k].length]));
        this._hist = {}; persons.forEach(p => { this._hist[p.prefix] = { [p.entity]: data[p.entity], [`sensor.${p.prefix}_sannsynlighet`]: data[`sensor.${p.prefix}_sannsynlighet`] }; });
        if (stamp !== before) { this._histStamp = stamp; this._lastKey = null; this._maybeRender(); }
      });
    }
    _person(p, s) {
      const open = this._apen === p.entity, x = p.prefix, adv = this._view === "avansert";
      const toggleId = this.st(p.setSover) ? (s.sover ? p.setVaaken : p.setSover) : null;
      const bryter = toggleId ? `<div class="bryter ${s.sover ? "on" : ""}" data-press="${toggleId}" role="switch" aria-checked="${s.sover}" tabindex="0"><span></span></div>`
        : p.bryter ? `<div class="bryter ${s.sover ? "on" : ""}" data-toggle="${p.bryter}" role="switch" tabindex="0"><span></span></div>` : `<div class="bryter mangler"><span></span></div>`;
      const t = (id, lbl) => this.st(id) ? `<div class="rad"><span class="rad-navn">${lbl}</span><input type="time" data-time="${id}" value="${KI.hhmm(this.val(id))}"></div>` : "";
      const sw = (id, lbl, sub) => this.st(id) ? `<div class="rad"><div><div class="rad-navn">${lbl}</div><div class="rad-sub">${sub}</div></div><div class="bryter ${this.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>` : "";
      const sl = (id, lbl, sub, o = {}) => KI.stepperHtml(this._hass, id, lbl, { sub, ...o });
      const thr = this.st(`number.${x}_terskel`) ? parseFloat(this.val(`number.${x}_terskel`)) : 80;
      const hist = (this._hist || {})[p.prefix] || {};
      return `<div class="last ${open ? "apen" : ""}">
        <div class="last-hode med-bryter" data-open="${p.entity}" style="grid-template-columns:40px 1fr auto auto">
          <div class="avatar ${s.sover ? "sover pust" : s.ok ? "vaken" : "feil"} ${s.pending ? "blink" : ""}"><ha-icon icon="${!s.ok ? "mdi:help" : s.sover ? "mdi:sleep" : "mdi:white-balance-sunny"}"></ha-icon>${s.sover ? `<div class="zzz"><span>z</span><span>z</span><span>z</span></div>` : ""}</div>
          <div><div class="last-navn">${KI.esc(p.name)}${s.vindu ? ` <span class="merke b-vindu">vindu åpent</span>` : ""}</div><div class="last-forklaring">${KI.esc(s.sub)}</div></div>
          <div class="last-verdi">${s.txt}${s.ok ? `<small>${s.pct} %</small>` : ""}</div>
          ${bryter}
        </div>
        <div class="last-kropp">
          ${s.ok ? `<div class="spor"><div class="fyll ${s.tone === "advarsel" ? "gul" : s.sover ? "" : "gronn"}" style="width:${s.pct}%;${s.sover || s.pending ? "" : "opacity:.5"}"></div><div class="strek" style="left:${thr}%"></div></div>
            <div class="under"><span>sannsynlighet ${s.pct} %</span><span>terskel ${thr} %</span></div>
            ${KI.sovnGraf(hist[`sensor.${x}_sannsynlighet`], hist[p.entity], thr, this._config.hours || 24)}
            <div class="tegnforklaring"><span><i style="background:var(--active-big);opacity:.4"></i>sov</span><span><i style="background:var(--active-big)"></i>sannsynlighet</span><span><i style="background:var(--yellow)"></i>terskel</span></div>
            <div class="last-fakta" style="padding-top:8px">${s.obs.map(o => `<span class="${o.v === true ? "b-ok" : o.v === false ? "b-nei" : ""}">${o.l}</span>`).join("")}${s.puls !== null ? `<span>${s.puls} bpm</span>` : ""}</div>
            ${s.why ? `<div class="notat" style="padding-top:0">Sist endret: ${KI.esc(s.why)}</div>` : ""}
            ${adv ? `<div class="blokk-hode"><span>Tider</span></div>${t(`time.${x}_sovevindu_start`, "Sovevindu fra")}${t(`time.${x}_sovevindu_slutt`, "Sovevindu til")}${t(`time.${x}_morgen_fra`, "Morgen fra")}
              <div class="blokk-hode"><span>Terskler</span></div>${sl(`number.${x}_terskel`, "Terskel", "Sannsynlighet som regnes som «sover»", { tick: s.pct, tone: s.pct >= thr ? "" : "gul" })}${sl(`number.${x}_forsinkelse_sovner`, "Sovner etter", "Over terskel så lenge før «sover»")}${sl(`number.${x}_forsinkelse_vakner`, "Våkner etter", "Under terskel så lenge før «våken»")}${sl(`number.${x}_hold_i_rommet`, "Hold i rommet", "Etter siste bevegelse")}${sl(`number.${x}_borte_fra_rommet_vaken`, "Borte = våken", "Borte fra rommet så lenge")}${sl(`number.${x}_dor_lukket_i`, "Dør lukket i", "Før døra teller som stengt")}${s.puls !== null ? sl(`number.${x}_puls_sover`, "Puls sover", "Glattet puls under dette", { tick: s.puls }) + sl(`number.${x}_puls_vaken`, "Puls våken", "Puls over dette", { tick: s.puls }) : ""}
              <div class="blokk-hode"><span>Regler</span></div>${sw(`switch.${x}_dor_om_natta_ok`, "Dør om natta OK", "Do-turer vekker ikke")}${sw(`switch.${x}_automatisk`, "Automatisk", "Styrer søvnbryteren")}` : ""}`
          : `<div class="tom">Personen finnes ikke i KI Søvn &amp; Vekking. Sjekk at oppføringen «${KI.esc(p.name)}» finnes og har entiteten <code>${p.entity}</code>.</div>`}
        </div></div>`;
    }
    getCardSize() { return 3 + this._persons().length * 2; }
  }
  customElements.define("ki-sovn-pro-card", KiSovnProCard);
  KI.register("ki-sovn-pro-card", "KI Søvn Pro", "Søvn og vekking i ett kort: status per person, sannsynlighet, observasjoner, innstillinger og vekkealarm(er)");
})(window.KI);

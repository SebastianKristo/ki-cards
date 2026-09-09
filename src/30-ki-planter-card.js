/* ki-planter-card – vanning av planter. mode: list (popup) | tile (oversikt)
   Finner plantene selv fra ki_planter (binary_sensor.<plante>_trenger_vann). sted: begrenser til ett sted.
   Gammel YAML-pakke støttes fortsatt via plants: [{ id, name, ... }] med input_datetime/input_number. */
(function (KI) {
  const DAG = 86400000;
  const fmtDato = (d) => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  const fmtTid = (d) => d.toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  class KiPlanterCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? null; super.setConfig(c); }

    _plants() {
      const c = this._config; const h = this._hass; if (!h) return [];
      if (c.plants) return c.plants.map(p => ({
        id: p.id, name: p.name || p.id, latin: p.latin || "", icon: p.icon || "mdi:sprout", tip: p.tip || "", legacy: true,
        last: p.last || `input_datetime.plante_${p.id}_sist_vannet`, interval: p.interval || `input_number.plante_${p.id}_intervall`,
      }));
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_planter", type: "plante" });
      if (c.sted) { const q = String(c.sted).toLowerCase(); ids = ids.filter(id => String(h.states[id].attributes.sted || "").toLowerCase().includes(q)); }
      if (c.include) ids = ids.filter(id => c.include.some(g => KI.glob(g, id)));
      return ids.map(id => { const a = h.states[id].attributes; const base = id.replace(/^binary_sensor\./, "").replace(/_trenger_vann$/, "");
        return { id: a.plante_id, name: a.navn, latin: a.latin || "", icon: a.ikon || "mdi:sprout", tip: a.tips || "", entity: id, sted: a.sted,
          last: `datetime.${base}_sist_vannet`, interval: `number.${base}_intervall`, water: `button.${base}_vannet_na` }; });
    }
    _info(p) {
      let interval, last;
      if (p.legacy) {
        const ls = this.st(p.last), is = this.st(p.interval);
        interval = is ? parseFloat(is.state) : 7;
        last = ls && ls.state && ls.state !== "unknown" ? new Date(ls.state.replace(" ", "T")) : null;
      } else {
        const a = (this.st(p.entity) || { attributes: {} }).attributes;
        interval = a.intervall_dager || 7; last = a.sist_vannet ? new Date(a.sist_vannet) : null;
        if (a.grunn === "tørr jord") return { interval, last, left: 0, pct: 100, txt: `Tørr jord ${Math.round(a.fuktighet)} %`, tone: "red" };
      }
      if (!last || isNaN(last)) return { interval, last: null, left: null, pct: 0, txt: "Ikke vannet ennå", tone: "red" };
      const elapsed = (Date.now() - last.getTime()) / DAG; const left = Math.ceil(interval - elapsed);
      const pct = Math.min(100, Math.max(0, (elapsed / interval) * 100));
      let txt, tone = "green";
      if (left > 1) txt = `Om ${left} dager`; else if (left === 1) txt = "I morgen";
      else if (left === 0) { txt = "Vann i dag"; tone = "yellow"; } else { txt = `${-left} ${-left === 1 ? "dag" : "dager"} over tiden`; tone = "red"; }
      if (tone === "green" && pct >= 70) tone = "yellow";
      return { interval, last, left, pct, txt, tone };
    }
    _key() {
      const hour = Math.floor(Date.now() / 3600000);
      return JSON.stringify([this._config, this._open, hour, this._plants().map(p => [p, this.val(p.last), this.val(p.interval), p.entity && (this.st(p.entity) || {}).attributes])]);
    }
    _vannet(p) {
      if (!p.legacy) return KI.press(this._hass, p.water);
      const d = new Date(); const pad = n => String(n).padStart(2, "0");
      return this._hass.callService("input_datetime", "set_datetime", { entity_id: p.last, datetime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00` });
    }

    _render() {
      const c = this._config; const plants = this._plants(); const infos = plants.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(plants, infos);
      const due = infos.filter(s => s.left !== null && s.left <= 0).length;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .row { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; cursor:pointer; }
        .txt { flex:1; min-width:0; } .txt .latin { font-style:italic; }
        .due { text-align:right; } .due .state { display:block; } .due .when { font-size:12px; opacity:.5; }
        .due.red .state { color:var(--red); opacity:1; } .due.yellow .state { color:var(--yellow); opacity:1; }
        .icon-wrap.red { background:var(--red); color:#fff; } .icon-wrap.yellow { background:var(--yellow); color:var(--black); }
        .bar { height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 0; overflow:hidden; }
        .bar i { display:block; height:100%; border-radius:2px; transition:width .3s; }
        .bar i.green { background:var(--green); } .bar i.yellow { background:var(--yellow); } .bar i.red { background:var(--red); }
        .body { padding:12px 6px 4px; display:none; } .body.open { display:block; }
        .stack { display:grid; gap:8px; }
        .tip { font-size:13px; line-height:1.45; opacity:.7; padding:2px 8px 10px; }
        .meta { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; font-size:12px; opacity:.55; padding:0 8px 10px; }
        .summary { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:2px 6px 8px; }
        .summary .n { font-size:13px; opacity:.6; }
        .summary .btn { height:38px; font-size:13px; }
        @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
      </style>
      <div class="list">
        ${plants.length && c.summary !== false ? `<div class="summary"><div class="n">${due ? `${due} plante${due > 1 ? "r" : ""} trenger vann` : "Alle planter er vannet"}</div>
          ${due > 1 && !plants[0].legacy ? `<div class="btn primary press" data-all="1" tabindex="0"><ha-icon icon="mdi:watering-can"></ha-icon>Alle vannet</div>` : ""}</div>` : ""}
        ${plants.length ? plants.map((p, i) => { const s = infos[i]; const open = this._open === i;
          return `<div class="card">
            <div class="row" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0">
              <div class="icon-wrap ${s.tone === "green" ? "" : s.tone}" style="width:44px;height:44px"><ha-icon icon="${p.icon}"></ha-icon></div>
              <div class="txt"><div class="name">${KI.esc(p.name)}</div>${p.latin ? `<div class="label latin">${KI.esc(p.latin)}</div>` : ""}</div>
              <div class="due ${s.tone}"><span class="state">${s.txt}</span><span class="when">${s.last ? "vannet " + fmtDato(s.last) : ""}</span></div>
            </div>
            <div class="bar"><i class="${s.tone}" style="width:${s.pct}%"></i></div>
            <div class="body ${open ? "open" : ""}">
              ${p.tip ? `<div class="tip">${KI.esc(p.tip)}</div>` : ""}
              <div class="group">
                <div class="kv"><span class="k">Sist vannet</span><span class="v">${s.last ? fmtTid(s.last) : "—"}</span></div>
                ${s.last ? `<div class="kv"><span class="k">Neste vanning</span><span class="v">${fmtDato(new Date(s.last.getTime() + s.interval * DAG))}</span></div>` : ""}
                <ki-slider-card data-slider="${i}"></ki-slider-card>
              </div>
              <div class="btn primary press" data-water="${i}" role="button" tabindex="0" style="margin-top:8px"><ha-icon icon="mdi:watering-can"></ha-icon>Vannet nå</div>
            </div>
          </div>`; }).join("")
        : `<div class="card"><div class="empty">Fant ingen planter fra <b>KI Planter</b>.<br>Legg til integrasjonen med et sted og plantene dine – kortet finner dem selv.</div></div>`}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".row").forEach(el => { const i = +el.dataset.i; const t = () => { this._open = this._open === i ? null : i; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, t, () => KI.moreInfo(this, plants[i].entity || plants[i].last)); KI.key(el, t); });
      r.querySelectorAll("[data-water]").forEach(el => { const p = plants[+el.dataset.water];
        const run = () => { if (c.confirm && !window.confirm(`Registrere ${p.name} som vannet nå?`)) return; this._vannet(p); }; KI.bindPress(el, run); KI.key(el, run); });
      const all = r.querySelector("[data-all]");
      if (all) { const run = () => { if (c.confirm && !window.confirm("Registrere alle som trenger vann som vannet nå?")) return;
        plants.forEach((p, i) => { if (infos[i].left !== null && infos[i].left <= 0) this._vannet(p); }); }; KI.bindPress(all, run); KI.key(all, run); }
      this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { const p = plants[+el.dataset.slider];
        el.setConfig({ entity: p.interval, name: "Intervall", unit: " d", min: 1, max: p.legacy ? 45 : 60, step: 1, label_width: "90px", value_width: "56px" }); el.hass = this._hass; this._subs.push(el); });
    }

    _renderTile(plants, infos) {
      const c = this._config;
      const due = infos.filter(s => s.left !== null && s.left <= 0).length;
      const next = infos.map((s, i) => ({ s, p: plants[i] })).filter(x => x.s.left !== null).sort((a, b) => a.s.left - b.s.left)[0];
      const tone = due ? "red" : (next && next.s.left <= 1 ? "yellow" : "green");
      const label = !plants.length ? "Ingen planter" : due ? `${due} trenger vann` : next ? `${next.p.name}: ${next.s.txt.toLowerCase()}` : "Ingen registrert";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; } .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.green { background:var(--green); } .dots i.yellow { background:var(--yellow); } .dots i.red { background:var(--red); }
        .label.red { color:var(--red); opacity:1; }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${tone === "red" ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:flower-outline"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Planter")}</div><div class="label ${tone}">${KI.esc(label)}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone}"></i>`).join("")}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => plants[0] && KI.moreInfo(this, plants[0].entity || plants[0].last)); KI.key(el, () => KI.go(c));
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }
    getCardSize() { return this._config.mode === "tile" ? 2 : Math.max(1, this._plants().length) * 2; }
  }
  customElements.define("ki-planter-card", KiPlanterCard);
  KI.register("ki-planter-card", "KI Planter", "Vanning av planter fra KI Planter: status, intervall og «vannet nå» (mode: list / tile)");
})(window.KI);

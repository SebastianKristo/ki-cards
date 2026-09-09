/* ki-planter-card – vanning av planter. mode: list (popup) | tile (oversikt) */
(function (KI) {
  const DAG = 86400000;
  const fmtDato = (d) => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

  class KiPlanterCard extends KI.Card {
    static getStubConfig() { return { plants: [{ id: "areca", name: "Arekapalme" }] }; }
    setConfig(c) {
      if (!c.plants || !c.plants.length) throw new Error("plants mangler");
      this._open = c.expanded ?? null; super.setConfig(c);
    }
    _plants() {
      return this._config.plants.map(p => ({
        id: p.id, name: p.name || p.id, latin: p.latin || "", icon: p.icon || "mdi:sprout",
        last: p.last || `input_datetime.plante_${p.id}_sist_vannet`,
        interval: p.interval || `input_number.plante_${p.id}_intervall`,
        tip: p.tip || "",
      }));
    }
    /* Beregner status for én plante */
    _info(p) {
      const ls = this.st(p.last), is = this.st(p.interval);
      const interval = is ? parseFloat(is.state) : 7;
      const last = ls && ls.state && ls.state !== "unknown" ? new Date(ls.state.replace(" ", "T")) : null;
      if (!last || isNaN(last)) return { interval, last: null, left: null, pct: 0, txt: "Ikke vannet ennå", tone: "red" };
      const elapsed = (Date.now() - last.getTime()) / DAG;
      const left = Math.ceil(interval - elapsed);
      const pct = Math.min(100, Math.max(0, (elapsed / interval) * 100));
      let txt, tone = "green";
      if (left > 1) txt = `Om ${left} dager`;
      else if (left === 1) txt = "I morgen";
      else if (left === 0) { txt = "Vann i dag"; tone = "yellow"; }
      else { txt = `${-left} ${-left === 1 ? "dag" : "dager"} over tiden`; tone = "red"; }
      if (tone === "green" && pct >= 70) tone = "yellow";
      return { interval, last, left, pct, txt, tone };
    }
    _key() {
      const day = Math.floor(Date.now() / 3600000); // ny nøkkel hver time
      return JSON.stringify([this._config, this._open, day, this._plants().map(p => [this.val(p.last), this.val(p.interval)])]);
    }
    _vannet(p) {
      const d = new Date(); const pad = n => String(n).padStart(2, "0");
      const dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      return this._hass.callService("input_datetime", "set_datetime", { entity_id: p.last, datetime: dt });
    }

    _render() {
      const c = this._config; const plants = this._plants();
      const infos = plants.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(plants, infos);

      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .row { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; }
        .txt { flex:1; min-width:0; }
        .txt .latin { font-style:italic; }
        .due { text-align:right; }
        .due .state { display:block; }
        .due .when { font-size:12px; opacity:.5; }
        .due.yellow .state, .due.red .state { opacity:1; }
        .due.red .state { color:var(--red); }
        .due.yellow .state { color:var(--yellow); }
        .bar { height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 0; overflow:hidden; }
        .bar i { display:block; height:100%; border-radius:2px; transition:width .3s; }
        .bar i.green { background:var(--green); } .bar i.yellow { background:var(--yellow); } .bar i.red { background:var(--red); }
        .body { padding:12px 6px 4px; display:none; }
        .body.open { display:block; }
        .stack { display:grid; gap:8px; }
        .tip { font-size:13px; line-height:1.45; opacity:.7; padding:2px 8px 10px; }
        .meta { display:flex; justify-content:space-between; font-size:12px; opacity:.55; padding:0 8px 10px; }
        .water { display:flex; align-items:center; justify-content:center; gap:8px; height:46px; border-radius:16px;
          background:var(--active-big); color:rgba(70,58,64,.95); font-size:14px; font-weight:600; --mdc-icon-size:20px; }
        .empty { font-size:13px; opacity:.55; padding:6px 4px; }
        @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
      </style>
      <div class="list">
        ${plants.map((p, i) => { const s = infos[i]; const open = this._open === i;
          return `<div class="card">
            <div class="row press" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0">
              <div class="icon-wrap ${s.tone === "red" ? "on" : ""}"><ha-icon icon="${p.icon}"></ha-icon></div>
              <div class="txt"><div class="name">${p.name}</div>${p.latin ? `<div class="label latin">${p.latin}</div>` : ""}</div>
              <div class="due ${s.tone}">
                <span class="state">${s.txt}</span>
                <span class="when">${s.last ? "vannet " + fmtDato(s.last) : ""}</span>
              </div>
            </div>
            <div class="bar"><i class="${s.tone}" style="width:${s.pct}%"></i></div>
            <div class="body ${open ? "open" : ""}">
              ${p.tip ? `<div class="tip">${p.tip}</div>` : ""}
              <div class="meta">
                <span>Sist vannet: ${s.last ? s.last.toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                <span>Hver ${Math.round(s.interval)}. dag</span>
              </div>
              <div class="stack">
                <ki-slider-card data-slider="${i}"></ki-slider-card>
                <div class="water press" data-water="${i}" role="button" tabindex="0"><ha-icon icon="mdi:watering-can"></ha-icon>Vannet nå</div>
              </div>
            </div>
          </div>`; }).join("")}
      </div>`;

      const r = this.shadowRoot;
      r.querySelectorAll(".row").forEach(el => {
        const i = +el.dataset.i;
        const toggle = () => { this._open = this._open === i ? null : i; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, toggle, () => KI.moreInfo(this, plants[i].last));
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      });
      r.querySelectorAll(".water").forEach(el => {
        const p = plants[+el.dataset.water];
        const run = () => { if (c.confirm && !window.confirm(`Registrere ${p.name} som vannet nå?`)) return; this._vannet(p); };
        KI.bindPress(el, run);
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
      });
      this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => {
        const p = plants[+el.dataset.slider];
        el.setConfig({ entity: p.interval, name: "Intervall", unit: " d", min: 1, max: 45, step: 1, label_width: "90px", value_width: "56px" });
        el.hass = this._hass; this._subs.push(el);
      });
    }

    _renderTile(plants, infos) {
      const c = this._config;
      const due = infos.filter(s => s.left !== null && s.left <= 0).length;
      const next = infos.map((s, i) => ({ s, p: plants[i] })).filter(x => x.s.left !== null).sort((a, b) => a.s.left - b.s.left)[0];
      const tone = due ? "red" : (next && next.s.left <= 1 ? "yellow" : "green");
      const label = due ? `${due} trenger vann` : next ? `${next.p.name}: ${next.s.txt.toLowerCase()}` : "Ingen registrert";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start;
          gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; }
        .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.green { background:var(--green); } .dots i.yellow { background:var(--yellow); } .dots i.red { background:var(--red); }
        .label.red { color:var(--red); opacity:1; }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${tone === "red" ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:flower-outline"}"></ha-icon></div>
        <div class="bottom">
          <div><div class="name">${c.name || "Planter"}</div><div class="label ${tone}">${label}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone}"></i>`).join("")}</div>
        </div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      const go = () => {
        if (c.navigation_path) { window.history.pushState(null, "", c.navigation_path); window.dispatchEvent(new Event("location-changed")); }
        else if (c.hash) { window.location.hash = c.hash; }
      };
      KI.bindPress(el, go, () => KI.moreInfo(this, plants[0].last));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }
    getCardSize() { return this._config.mode === "tile" ? 2 : this._plants().length * 2; }
  }
  customElements.define("ki-planter-card", KiPlanterCard);
  KI.register("ki-planter-card", "KI Planter", "Vanning av planter: status, intervall og «vannet nå»");
})(window.KI);

/* ki-slider-card – etikett | slider | verdi, for input_number / number */
(function (SK) {
  class SkSliderCard extends SK.Card {
    static getStubConfig() { return { entity: "input_number.example", unit: "" }; }
    _key() { const s = this.st(this._config.entity); return JSON.stringify([this._config, s && s.state, s && s.attributes]); }
    _render() {
      const c = this._config; const s = this.st(c.entity);
      const a = (s && s.attributes) || {};
      const min = c.min ?? a.min ?? 0, max = c.max ?? a.max ?? 100, step = c.step ?? a.step ?? 1;
      const v = s ? parseFloat(s.state) : min;
      const dec = c.decimals ?? (step < 1 ? 1 : 0);
      const unit = c.unit ?? (a.unit_of_measurement ? " " + a.unit_of_measurement : "");
      const fmt = (x) => x.toFixed(dec) + unit;
      const name = c.name || SK.friendly(this._hass, c.entity);
      const pct = ((v - min) / (max - min)) * 100;
      this.shadowRoot.innerHTML = `<style>${SK.css}
        .row { display:grid; grid-template-columns:${c.label_width || "106px"} 1fr ${c.value_width || "80px"}; align-items:center; height:46px; }
        .lbl { padding:0 14px; cursor:pointer; }
        .valtxt { font-size:14px; font-weight:500; text-align:right; }
        input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none;
          background: linear-gradient(to right, var(--active-big) 0 var(--p), var(--gray200) var(--p) 100%); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; cursor:grab; }
        input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
        input[type=range]:focus-visible { box-shadow:0 0 0 2px var(--active-big); }
      </style>
      <div class="row">
        <div class="lbl name">${name}</div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${pct}%">
        <div class="valtxt">${fmt(v)}</div>
      </div>`;
      const inp = this.shadowRoot.querySelector("input"), out = this.shadowRoot.querySelector(".valtxt");
      inp.addEventListener("input", () => { const x = parseFloat(inp.value); out.textContent = fmt(x); inp.style.setProperty("--p", ((x - min) / (max - min)) * 100 + "%"); });
      inp.addEventListener("change", () => {
        const domain = c.entity.split(".")[0];
        this._hass.callService(domain, "set_value", { entity_id: c.entity, value: parseFloat(inp.value) });
      });
      this.shadowRoot.querySelector(".lbl").addEventListener("click", () => SK.moreInfo(this, c.entity));
    }
  }
  customElements.define("ki-slider-card", SkSliderCard);
  SK.register("ki-slider-card", "KI Slider", "Etikett, slider og verdi for tall-entiteter");
})(window.SK);

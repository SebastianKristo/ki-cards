/* ki-strom-detaljer-card – kompakte detaljkort for strømregning og Norgespris.
 *
 *  Laget som eget kort (ikke button-card) fordi button-card stopper klikk inne i custom_fields:
 *  her virker periodevelger, månedsvalg og «trykk for å åpne sensoren» overalt.
 *
 *  type: custom:ki-strom-detaljer-card
 *  vis: regning        # regning | effekt | effektledd | norgespris | sammenligning
 *
 *  Alle sensorer har standardverdier (din installasjon) og kan overstyres under «sensorer:», f.eks.
 *  sensorer:
 *    estimat: sensor.min_estimerte_kostnad
 */
(() => {
  const M = "sensor.manedlig_forbruk_", P = "sensor.strommaler_strommaler_powercalc_", E = "sensor.nettleie_elvia_";
  const STANDARD = {
    maned: "sensor.maned",
    // strømregning
    estimat: M + "estimert_manedskostnad", akkumulert: M + "akkumulert_stromkostnad", idag: M + "dagens_kostnad",
    nettleie: M + "manedlig_nettleie_total", avgifter: M + "manedlig_avgifter", stromstotte: M + "manedlig_stromstotte",
    kompensasjon: M + "norgespris_kompensasjon", besparelse_mnd: M + "norgespris_besparelse",
    forbruk_totalt: M + "manedlig_forbruk_totalt", forbruk_dag: M + "manedlig_forbruk_dagtariff", forbruk_natt: M + "manedlig_forbruk_natt_helg",
    // effekttrinn
    snitt: E + "snitt_toppforbruk", topp1: E + "toppforbruk", topp2: E + "toppforbruk_2", topp3: E + "toppforbruk_3",
    margin: E + "margin_til_neste_trinn", terskel: "sensor.neste_effektledd_terskel", trinn: E + "kapasitetstrinn_intervall",
    // effektledd per måned
    maned_prefiks: "input_number.fastledd_",
    // norgespris
    spart_time: "sensor.norgespris_besparelse_time", spart_dag: "sensor.norgespris_besparelse_dag", spart_uke: "sensor.norgespris_besparelse_uke",
    spart_maned: "sensor.norgespris_besparelse_maned", spart_ar: "sensor.norgespris_besparelse_ar",
    spot_dag: P + "daily_energy_cost_2", np_dag: P + "daily_energy_cost_3", spot_uke: P + "weekly_energy_cost_2", np_uke: P + "weekly_energy_cost_3",
    spot_maned: P + "monthly_energy_cost_2", np_maned: P + "monthly_energy_cost_3", spot_ar: P + "yearly_energy_cost_2", np_ar: P + "yearly_energy_cost_3",
  };
  const MND = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

  const STIL = `
    :host { display:block; }
    .k { background:var(--gray200, var(--ha-card-background, #1f1f21)); color:var(--gray1000, var(--primary-text-color));
      border-radius:var(--ha-card-border-radius, 24px); padding:16px 18px 18px; font-size:14px; -webkit-tap-highlight-color:transparent; }
    .hode { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .tittel { opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .tittel ha-icon { --mdc-icon-size:18px; vertical-align:-3px; margin-right:6px; }
    .svak { opacity:.6; font-size:12px; white-space:nowrap; }
    .stor { font-size:2.2em; font-weight:300; line-height:1.2; }
    .stor small { font-size:14px; opacity:.7; margin-left:6px; }
    .under { font-size:13px; opacity:.7; }
    [data-mer] { cursor:pointer; border-radius:8px; transition:background .15s; }
    [data-mer]:active { background:rgba(250,251,252,.08); }
    .skille[data-mer] { border-radius:0; }
    .stolpe { display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; background:rgba(250,251,252,.1); }
    .stolpe > div { transition:width 1s ease; }
    .spor { height:8px; border-radius:4px; background:rgba(250,251,252,.1); overflow:hidden; }
    .spor > div { height:100%; border-radius:4px; transition:width .6s ease; }
    .rutenett { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px 18px; }
    .rad { display:flex; justify-content:space-between; align-items:center; min-width:0; padding:2px 0; }
    .prikk { display:inline-block; width:8px; height:8px; border-radius:2px; margin-right:6px; }
    .brikker { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
    .brikke { background:var(--gray100, rgba(250,251,252,.06)); border-radius:12px; padding:8px 10px; min-width:0; }
    .brikke .t { font-size:11px; opacity:.65; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .brikke .v { font-size:15px; font-weight:500; white-space:nowrap; }
    .skille { margin-top:12px; padding-top:10px; border-top:1px solid rgba(250,251,252,.1); }
    .faner { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:4px; padding:3px; border-radius:999px; background:rgba(250,251,252,.06); margin-bottom:16px; }
    .fane { text-align:center; padding:7px 0; border-radius:999px; cursor:pointer; font-size:13px; color:rgba(242,242,247,.65); user-select:none;
      transition:background .25s, color .25s; border:none; background:none; font-family:inherit; }
    .fane.aktiv { background:var(--gray100, rgba(250,251,252,.12)); color:var(--gray1000, #f2f2f7); font-weight:500; box-shadow:0 1px 4px rgba(0,0,0,.35); }
    .graf { display:flex; align-items:flex-end; gap:4px; height:64px; }
    .soyle { flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; position:relative; cursor:pointer; }
    .soyle .fyll { width:100%; max-width:18px; border-radius:4px 4px 1px 1px; background:rgba(250,251,252,.3); transition:background .25s, height 1s ease; }
    .soyle.fremtid .fyll { background:rgba(250,251,252,.08); }
    .soyle.valgt .fyll { background:var(--orange, #ff9f0a); }
    .soyle .tall { position:absolute; font-size:11px; color:var(--orange, #ff9f0a); white-space:nowrap; opacity:0; transition:opacity .25s; }
    .soyle.valgt .tall { opacity:1; }
    .bokst { display:flex; gap:4px; margin-top:6px; font-size:11px; }
    .bokst span { flex:1; text-align:center; opacity:.55; cursor:pointer; } .bokst span.valgt { color:var(--orange, #ff9f0a); opacity:1; }
    .gronn { color:var(--green, #34c759); } .rod { color:var(--red, #ff453a); } .oransje { color:var(--orange, #ff9f0a); }
  `;

  class KiStromDetaljerCard extends HTMLElement {
    static getStubConfig() { return { vis: "regning" }; }
    static getConfigForm() {
      return { schema: [{ name: "vis", selector: { select: { mode: "dropdown", options: [
        { value: "regning", label: "Strømregning" }, { value: "effekt", label: "Effekttrinn" }, { value: "effektledd", label: "Effektledd per måned" },
        { value: "norgespris", label: "Norgespris – spart" }, { value: "sammenligning", label: "Spotpris mot Norgespris" }] } } }],
        computeLabel: () => "Visning" };
    }
    setConfig(c) {
      this._c = { vis: "regning", ...(c || {}) };
      this._s = { ...STANDARD, ...((c && c.sensorer) || {}) };
      this._periode = this._periode ?? 2; this._mnd = this._mnd ?? new Date().getMonth();
      if (this._hass) this._tegn();
    }
    set hass(h) {
      this._hass = h;
      const ids = this._ids();
      if (this._siste && ids.every((id, i) => h.states[id] === this._siste[i])) return;
      this._siste = ids.map((id) => h.states[id]); this._tegn();
    }
    getCardSize() { return 4; }
    _ids() {
      const s = this._s, v = this._c && this._c.vis;
      if (v === "effektledd") return MND.map((m) => s.maned_prefiks + m);
      return Object.entries(s).filter(([k]) => k !== "maned_prefiks").map(([, id]) => id);
    }
    _n(id) { const st = this._hass.states[id]; const n = st ? parseFloat(st.state) : NaN; return isNaN(n) ? null : n; }
    _kr(v, d = 0) { if (v === null || v === undefined) return "–"; return d ? Math.abs(v).toFixed(d).replace(".", ",") : Math.round(Math.abs(v)).toLocaleString("nb-NO"); }
    _mndNavn() { const m = this._hass.states[this._s.maned]; return m ? String(m.state).toLowerCase() : MND[new Date().getMonth()]; }

    _tegn() {
      if (!this._hass || !this._c) return;
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
        // ett felles klikk-lytteri: åpne sensor eller bytt valg
        this.shadowRoot.addEventListener("click", (e) => {
          const el = e.composedPath().find((x) => x.dataset && (x.dataset.mer || x.dataset.periode !== undefined || x.dataset.mnd !== undefined));
          if (!el) return;
          if (el.dataset.periode !== undefined) { this._periode = +el.dataset.periode; this._tegn(); }
          else if (el.dataset.mnd !== undefined) { this._mnd = +el.dataset.mnd; this._tegn(); }
          else this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
          navigator.vibrate && navigator.vibrate(8);
        });
      }
      const vis = { regning: this._regning, effekt: this._effekt, effektledd: this._effektledd, norgespris: this._norgespris, sammenligning: this._sammenligning }[this._c.vis] || this._regning;
      this.shadowRoot.innerHTML = `<style>${STIL}</style><div class="k">${vis.call(this)}</div>`;
    }

    /* ── strømregning ── */
    _regning() {
      const s = this._s, n = (k) => this._n(s[k]), kr = (v, d) => this._kr(v, d);
      const poster = [
        { t: "Strøm hittil", v: n("akkumulert"), c: "var(--blue, #0a84ff)", id: s.akkumulert },
        { t: "Nettleie", v: n("nettleie"), c: "var(--orange, #ff9f0a)", id: s.nettleie },
        { t: "Avgifter", v: n("avgifter"), c: "var(--purple, #bf5af2)", id: s.avgifter },
      ];
      const sum = poster.reduce((a, p) => a + Math.max(p.v || 0, 0), 0) || 1;
      const rad = (t, v, c, id, minus) => `<div class="rad" data-mer="${id}"><span style="white-space:nowrap"><span class="prikk" style="background:${c}"></span><span style="opacity:.7">${t}</span></span>
        <span style="white-space:nowrap" class="${minus ? "gronn" : ""}">${minus && v ? "−" : ""}${kr(v)} kr</span></div>`;
      let rader = poster.map((p) => rad(p.t, p.v, p.c, p.id)).join("");
      const komp = n("kompensasjon"), stotte = n("stromstotte"), spart = n("besparelse_mnd");
      if (komp) rader += rad("Norgespris", Math.abs(komp), "var(--green, #34c759)", s.kompensasjon, true);
      if (stotte) rader += rad("Strømstøtte", Math.abs(stotte), "var(--green, #34c759)", s.stromstotte, true);
      const dag = n("forbruk_dag"), natt = n("forbruk_natt"), tot = n("forbruk_totalt");
      const pst = Math.round((dag || 0) / (((dag || 0) + (natt || 0)) || 1) * 100);
      return `
        <div class="hode"><span class="tittel"><ha-icon icon="mdi:cash-fast"></ha-icon>Strømregning · ${this._mndNavn()}</span><span class="svak">estimat</span></div>
        <div class="stor" data-mer="${s.estimat}" style="margin-top:6px;display:inline-block">${kr(n("estimat"))}<small>kr</small></div>
        <div class="under" style="margin-bottom:12px">Hele måneden, anslått · <span data-mer="${s.idag}">i dag ${kr(n("idag"))} kr</span></div>
        <div class="stolpe">${poster.filter((p) => p.v > 0).map((p) => `<div style="width:${(p.v / sum * 100).toFixed(1)}%;background:${p.c}"></div>`).join("")}</div>
        <div class="rutenett" style="margin-top:12px">${rader}</div>
        ${spart ? `<div class="gronn" data-mer="${s.besparelse_mnd}" style="margin-top:10px;font-size:13px"><ha-icon icon="mdi:piggy-bank-outline" style="--mdc-icon-size:16px;vertical-align:-3px;margin-right:6px"></ha-icon>Norgespris har spart deg ${kr(spart)} kr denne måneden</div>` : ""}
        ${tot !== null || dag !== null ? `<div class="skille">
          <div class="rad" data-mer="${s.forbruk_totalt}" style="font-size:13px;margin-bottom:6px"><span style="opacity:.7">Forbruk denne måneden</span><span>${kr(tot, 1)} kWh</span></div>
          <div class="stolpe" style="height:8px"><div style="width:${pst}%;background:var(--yellow, #ffd60a)"></div><div style="width:${100 - pst}%;background:var(--blue, #0a84ff);opacity:.7"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;opacity:.75">
            <span data-mer="${s.forbruk_dag}"><ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:14px;vertical-align:-2px;margin-right:4px"></ha-icon>Dag ${kr(dag, 1)} kWh · ${pst} %</span>
            <span data-mer="${s.forbruk_natt}"><ha-icon icon="mdi:weather-night" style="--mdc-icon-size:14px;vertical-align:-2px;margin-right:4px"></ha-icon>Natt/helg ${kr(natt, 1)} kWh</span>
          </div></div>` : ""}`;
    }

    /* ── effekttrinn ── */
    _effekt() {
      const s = this._s, n = (k) => this._n(s[k]);
      const f = (v, d = 2) => (v === null ? "–" : v.toFixed(d).replace(".", ","));
      const margin = n("margin"), terskel = n("terskel"), trinn = this._hass.states[s.trinn]?.state || "";
      const neste = this._hass.states[s.terskel]?.attributes || {};
      const pct = margin !== null && terskel ? Math.min(100, Math.max(0, (terskel - margin) / terskel * 100)) : 0;
      const topp = (l, k, c) => `<div class="brikke" data-mer="${s[k]}" style="font-size:13px;white-space:nowrap"><span style="color:${c}">${l}</span> <b style="font-weight:500">${f(n(k))}</b> <span style="opacity:.6">kW</span></div>`;
      return `
        <div class="hode"><span class="tittel"><ha-icon icon="mdi:flash-triangle"></ha-icon>Effekttrinn</span>
          ${trinn ? `<span data-mer="${s.trinn}" style="font-size:12px;background:rgba(255,166,0,.2);color:var(--orange, #ff9f0a);padding:3px 10px;border-radius:999px;white-space:nowrap">Trinn ${trinn}</span>` : ""}</div>
        <div data-mer="${s.snitt}" style="display:flex;align-items:baseline;gap:8px;margin:6px 0 10px"><span class="stor">${f(n("snitt"))}</span><span class="under">kW snitt av 3 topper</span></div>
        <div class="spor" style="height:10px"><div style="width:${pct.toFixed(0)}%;background:${pct >= 90 ? "var(--red, #ff453a)" : "var(--orange, #ff9f0a)"}"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;opacity:.6;margin-top:5px"><span>0 kW</span><span data-mer="${s.margin}">${f(margin, 1)} kW margin</span><span data-mer="${s.terskel}">${f(terskel, 0)} kW</span></div>
        <div class="brikker" style="margin-top:12px">${topp("#1", "topp1", "var(--red, #ff453a)")}${topp("#2", "topp2", "var(--orange, #ff9f0a)")}${topp("#3", "topp3", "var(--blue, #0a84ff)")}</div>
        <div class="rad skille" data-mer="${s.terskel}" style="font-size:13px"><span style="opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Neste${neste.trinn ? ": trinn " + neste.trinn : ""}${neste.spenn ? " · " + neste.spenn : ""}</span>
          <span class="rod" style="white-space:nowrap">${neste.kostnad ? neste.kostnad + " kr/mnd" : "–"}</span></div>`;
    }

    /* ── effektledd per måned (trykk på en søyle) ── */
    _effektledd() {
      const s = this._s, naa = new Date().getMonth();
      const vals = MND.map((m, i) => ({ m, id: s.maned_prefiks + m, v: this._n(s.maned_prefiks + m), fremtid: i > naa }));
      const har = vals.filter((x) => x.v !== null && !x.fremtid);
      const aar = har.reduce((a, x) => a + x.v, 0), snitt = har.length ? aar / har.length : null;
      const max = Math.max(...vals.map((x) => x.v || 0), 1);
      const valgt = vals[this._mnd];
      const diff = valgt.v !== null && snitt ? valgt.v - snitt : null;
      const merk = valgt.fremtid ? "ikke kommet ennå" : valgt.v === null ? "ingen data" : diff === null ? "" : diff >= 0 ? `${Math.round(diff)} kr over snittet` : `${Math.round(-diff)} kr under snittet`;
      const soyler = vals.map((x, i) => {
        const h = x.fremtid || !x.v ? 4 : Math.max(8, x.v / max * 100);
        return `<div class="soyle ${x.fremtid ? "fremtid" : ""} ${i === this._mnd ? "valgt" : ""}" data-mnd="${i}">
          <span class="tall" style="bottom:calc(${h}% + 3px)">${x.v !== null && !x.fremtid ? Math.round(x.v) : ""}</span>
          <div class="fyll" style="height:${h}%"></div></div>`;
      }).join("");
      return `
        <div class="hode"><span class="tittel"><ha-icon icon="mdi:chart-bar"></ha-icon>Effektledd per måned</span><span class="svak" style="font-size:13px">i år ${this._kr(aar)} kr</span></div>
        <div data-mer="${valgt.id}" style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:8px 0 18px;min-height:30px">
          <span style="font-size:1.6em;font-weight:300;white-space:nowrap">${valgt.fremtid ? "–" : this._kr(valgt.v) + " kr"}</span>
          <span class="under" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${valgt.m[0].toUpperCase() + valgt.m.slice(1)}${this._mnd === naa ? " (nå)" : ""}${merk ? " · " + merk : ""}</span></div>
        <div class="graf">${soyler}</div>
        <div class="bokst">${vals.map((x, i) => `<span data-mnd="${i}" class="${i === this._mnd ? "valgt" : ""}">${x.m[0].toUpperCase()}</span>`).join("")}</div>`;
    }

    /* ── norgespris: spart ── */
    _norgespris() {
      const s = this._s, n = (k) => this._n(s[k]);
      const ar = n("spart_ar"), spot = n("spot_ar"), np = n("np_ar"), spart = ar === null || ar >= 0;
      let merke = "";
      if (spot && np !== null) { const p = Math.round((spot - np) / spot * 100);
        merke = `<span style="font-size:12px;padding:3px 10px;border-radius:999px;white-space:nowrap;background:${p >= 0 ? "rgba(52,199,89,.18)" : "rgba(255,69,58,.2)"}" class="${p >= 0 ? "gronn" : "rod"}">${Math.abs(p)} % ${p >= 0 ? "billigere" : "dyrere"}</span>`; }
      const brikke = (t, k, d = 0) => { const v = n(k); return `<div class="brikke" data-mer="${s[k]}"><div class="t">${t}</div><div class="v ${v !== null && v < 0 ? "rod" : ""}">${v !== null && v < 0 ? "−" : ""}${this._kr(v, d)} kr</div></div>`; };
      return `
        <div class="hode"><span class="tittel"><ha-icon icon="mdi:piggy-bank-outline"></ha-icon>Norgespris · ${this._mndNavn()}</span>${merke}</div>
        <div data-mer="${s.spart_ar}" style="display:flex;align-items:baseline;gap:8px;margin:6px 0 12px">
          <span class="stor ${spart ? "gronn" : "rod"}">${this._kr(ar)}</span><span class="under">kr ${spart ? "spart" : "tapt"} i år</span></div>
        <div class="brikker">${brikke("Denne timen", "spart_time", 2)}${brikke("I dag", "spart_dag")}${brikke("Denne uken", "spart_uke")}</div>`;
    }

    /* ── spotpris mot norgespris (periodevelger) ── */
    _sammenligning() {
      const s = this._s, n = (k) => this._n(s[k]) || 0;
      const perioder = [["I dag", "i dag", "dag"], ["Uke", "denne uken", "uke"], ["Måned", "denne måneden", "maned"], ["År", "i år", "ar"]];
      const [, tekst, k] = perioder[this._periode];
      const sp = n("spot_" + k), np = n("np_" + k), d = n("spart_" + k), max = Math.max(sp, np, 0.1), spart = d >= 0;
      const kr = (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString("nb-NO") : (Math.round(v * 10) / 10).toString().replace(".", ","));
      const stolpe = (t, v, farge, id) => `<div data-mer="${id}"><div class="rad" style="font-size:13px;margin-bottom:5px"><span style="opacity:.7">${t}</span><span>${kr(v)} kr</span></div>
        <div class="spor"><div style="width:${(v / max * 100).toFixed(0)}%;background:${farge}"></div></div></div>`;
      return `
        <div class="tittel" style="margin-bottom:12px"><ha-icon icon="mdi:scale-balance"></ha-icon>Spotpris mot Norgespris</div>
        <div class="faner">${perioder.map(([navn], i) => `<button class="fane ${i === this._periode ? "aktiv" : ""}" data-periode="${i}">${navn}</button>`).join("")}</div>
        <div style="display:grid;gap:10px">${stolpe("Spotpris", sp, "var(--orange, #ff9f0a)", s["spot_" + k])}${stolpe("Norgespris", np, "var(--blue, #0a84ff)", s["np_" + k])}</div>
        <div class="rad skille" data-mer="${s["spart_" + k]}" style="align-items:baseline;margin-top:14px">
          <span class="under">${spart ? "Spart" : "Tapt"} ${tekst}</span><span class="${spart ? "gronn" : "rod"}" style="font-size:1.5em;font-weight:300">${kr(Math.abs(d))} kr</span></div>`;
    }
  }

  if (!customElements.get("ki-strom-detaljer-card")) customElements.define("ki-strom-detaljer-card", KiStromDetaljerCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-strom-detaljer-card"))
    window.customCards.push({ type: "ki-strom-detaljer-card", name: "KI Strøm-detaljer", description: "Strømregning, effekttrinn, effektledd per måned og Norgespris – kompakt og trykkbart" });
})();

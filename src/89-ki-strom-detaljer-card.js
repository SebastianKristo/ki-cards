/* ki-strom-detaljer-card – kompakte detaljkort for strømregning og Norgespris.
 *
 *  Laget som eget kort (ikke button-card) fordi button-card stopper klikk inne i custom_fields:
 *  her virker periodevelger, månedsvalg og «trykk for å åpne sensoren» overalt.
 *
 *  type: custom:ki-strom-detaljer-card
 *  vis: regning        # regning | effekt | effektledd | norgespris | sammenligning | aar
 *  faner: false        # dropp fanerada i regning-visningen og vis bare måneden
 *  fane: maned         # hvilken fane kortet åpner på: dag | uke | maned | ar
 *
 *  Alle sensorer har standardverdier (din installasjon) og kan overstyres under «sensorer:», f.eks.
 *  sensorer:
 *    estimat: sensor.min_estimerte_kostnad
 */
(() => {
  const M = "sensor.manedlig_forbruk_", P = "sensor.strommaler_strommaler_powercalc_", E = "sensor.nettleie_elvia_";
  const STANDARD = {
    maned: "sensor.maned",
    // Årsregningen: oversiktssensoren fra ki_enhetsforbruk. Står den tom,
    // finnes den selv på markørene integrasjon/type.
    regning: "",
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

    /* ---- årsregning ---- */
    /* Fanerada står som sitt eget spor OVER kortet, ikke inni det - samme plass som
       et ki-tabs-card ville hatt. Kalenderknappen har EGEN klasse, ikke .fane, så
       glidepilla fra KI.pillefaner ikke regner den som en femte fane. */
    .skinne { display:flex; align-items:center; gap:4px; padding:4px; border-radius:999px;
      background:var(--gray200, var(--ha-card-background, #1f1f21)); margin-bottom:10px; }
    .skinne .fane { flex:1; min-width:0; text-align:center; padding:9px 0; border-radius:999px;
      border:none; background:none; font-family:inherit; font-size:14px; font-weight:500; cursor:pointer;
      color:var(--gray1000,#f2f2f7); opacity:.6; user-select:none; white-space:nowrap;
      -webkit-tap-highlight-color:transparent;
      transition:background .25s, color .25s, opacity .25s; }
    /* Fargen kommer fra --active-big, men MED reserve. Uten den ble pilla borte i
       dashbord der variabelen ikke når inn i kortet: bakgrunnen falt bort, og igjen
       sto bare skyggen - en mørk flis med en kant, i stedet for en fylt pille.
       Regelen er sterkere enn basens .ki-pille, så den er den som gjelder. */
    .skinne .ki-pille { background:var(--active-big, #ee95ff); }
    .skinne .fane.valgt { background:var(--active-big, #ee95ff); color:rgba(70,58,64,.95);
      opacity:1; font-weight:600; }
    .kalknapp { flex:none; width:40px; height:34px; border:0; border-radius:999px; background:none;
      color:var(--gray1000,#f2f2f7); opacity:.55; cursor:pointer; display:flex; align-items:center;
      justify-content:center; --mdc-icon-size:19px; position:relative; z-index:1;
      -webkit-tap-highlight-color:transparent;
      transition:background .2s, opacity .2s, transform .14s; }
    .kalknapp:active { transform:scale(.92); }
    .kalknapp.pa { background:var(--active-big, #ee95ff); color:rgba(70,58,64,.95); opacity:1; }
    .ikonknapp { border:0; background:rgba(250,251,252,.08); color:var(--gray1000,#f2f2f7); width:32px; height:32px;
      border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;
      --mdc-icon-size:19px; flex:none; transition:background .2s, transform .14s; }
    .ikonknapp:active { transform:scale(.92); }
    .ikonknapp.pa { background:var(--orange, #ff9f0a); color:#241a05; }
    .kaltopp { display:grid; grid-template-columns:min-content 1fr min-content; align-items:center; gap:10px; padding:2px 0 10px; }
    .kaltopp .mnd { text-align:center; font-size:15px; font-weight:600; text-transform:capitalize; }
    .pil { border:0; background:none; color:var(--gray1000,#f2f2f7); width:32px; height:32px; border-radius:50%;
      cursor:pointer; display:flex; align-items:center; justify-content:center; --mdc-icon-size:22px; opacity:.7; }
    .pil:active { transform:scale(.92); }
    .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; padding-bottom:5px; }
    .ukedager span { text-align:center; font-size:11px; font-weight:600; opacity:.45; }
    .rutenett7 { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
    /* Ruta viser kronene for dagen. Bakgrunnen er samme farge hele veien, bare
       sterkere jo dyrere dagen var - da leses måneden som et varmekart. */
    .dag { position:relative; aspect-ratio:1; border-radius:12px; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:1px; font-size:13px; font-weight:500; cursor:pointer;
      background:rgba(250,251,252,.06); transition:transform .14s, background .2s; overflow:hidden; }
    .dag .dnr { font-size:10px; opacity:.5; line-height:1; }
    .dag.utenfor { opacity:.2; cursor:default; }
    .dag.tom { color:rgba(242,242,247,.35); }
    .dag.idag { outline:2px solid rgba(255,255,255,.35); outline-offset:-2px; }
    .dag.valgt { transform:scale(1.06); outline:2px solid var(--orange, #ff9f0a); outline-offset:-2px; }
    .dagdetalj { font-size:12px; opacity:.7; padding:12px 2px 0; text-transform:capitalize; }
    .poster { display:grid; gap:4px; margin-top:10px; }
  `;

  class KiStromDetaljerCard extends HTMLElement {
    static getStubConfig() { return { vis: "regning" }; }
    static getConfigForm() {
      return { schema: [{ name: "vis", selector: { select: { mode: "dropdown", options: [
        { value: "regning", label: "Strømregning" }, { value: "effekt", label: "Effekttrinn" }, { value: "effektledd", label: "Effektledd per måned" },
        { value: "norgespris", label: "Norgespris – spart" }, { value: "sammenligning", label: "Spotpris mot Norgespris" },
        { value: "aar", label: "Årlig strømregning" }] } } }],
        computeLabel: () => "Visning" };
    }
    setConfig(c) {
      this._c = { vis: "regning", ...(c || {}) };
      this._s = { ...STANDARD, ...((c && c.sensorer) || {}) };
      this._periode = this._periode ?? 2; this._mnd = this._mnd ?? new Date().getMonth();
      this._kal = this._kal ?? false;      // kalender i stedet for søyler
      // 0 dag · 1 uke · 2 måned · 3 år. Kortet åpner på måneden, som er det
      // samme det alltid har vist; vis: aar åpner på året.
      const fane = { dag: 0, uke: 1, maned: 2, måned: 2, mnd: 2, ar: 3, år: 3 }[
        String(this._c.fane || "").toLowerCase()];
      this._per = this._per ?? (fane !== undefined ? fane : (this._c.vis === "aar" ? 3 : 2));
      this._blaMnd = this._blaMnd ?? 0;    // hvor mange måneder bakover kalenderen står
      this._valgtDag = this._valgtDag ?? null;
      this._hentet = this._hentet || {};   // måneder hentet med tjenesten
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
      const faste = Object.entries(s).filter(([k]) => k !== "maned_prefiks" && k !== "regning").map(([, id]) => id);
      // Regning-visningen viser både Strømkalkulator (måneden) og boka (resten).
      if (v === "regning" || v === "aar") { const r = this._regningId(); return r ? [...faste, r] : faste; }
      return faste;
    }

    /* Oversiktssensoren fra ki_enhetsforbruk.
       Den finnes på markørene sine, så den slipper å skrives inn - entitets-id-en
       følger navnet du ga regningen, og er ikke til å gjette. */
    _regningId() {
      if (this._s.regning) return this._s.regning;
      if (this._funnet && this._hass.states[this._funnet]) return this._funnet;
      const treff = Object.keys(this._hass.states).find((id) => {
        const a = this._hass.states[id].attributes;
        return a && a.integrasjon === "ki_enhetsforbruk" && a.type === "regning";
      });
      this._funnet = treff || null;
      return this._funnet;
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
          const el = e.composedPath().find((x) => x.dataset && (x.dataset.mer || x.dataset.periode !== undefined
            || x.dataset.mnd !== undefined || x.dataset.kal !== undefined || x.dataset.bla !== undefined
            || x.dataset.dag !== undefined || x.dataset.per !== undefined));
          if (!el) return;
          if (el.dataset.periode !== undefined) { this._periode = +el.dataset.periode; this._tegn(); }
          else if (el.dataset.per !== undefined) { this._per = +el.dataset.per; this._kal = false; this._valgtDag = null; this._tegn(); }
          else if (el.dataset.kal !== undefined) { this._kal = !this._kal; this._valgtDag = null; this._tegn(); }
          else if (el.dataset.bla !== undefined) { this._blaMnd += +el.dataset.bla; this._valgtDag = null; this._tegn(); }
          else if (el.dataset.dag !== undefined) {
            this._valgtDag = this._valgtDag === el.dataset.dag ? null : el.dataset.dag; this._tegn();
          } else if (el.dataset.mnd !== undefined) { this._mnd = +el.dataset.mnd; this._tegn(); }
          else this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
          navigator.vibrate && navigator.vibrate(8);
        });
      }
      const vis = { regning: this._regning, effekt: this._effekt, effektledd: this._effektledd, norgespris: this._norgespris, sammenligning: this._sammenligning, aar: this._aar }[this._c.vis] || this._regning;
      const ut = vis.call(this);
      const topp = ut && ut.topp ? ut.topp : "";
      const kort = ut && ut.kort !== undefined ? ut.kort : ut;
      this.shadowRoot.innerHTML = `<style>${STIL}</style>${topp}<div class="k">${kort}</div>`;
      /* Glidende pille på fanerada, samme som i de andre kortene. Kortet tegner hele
         markupen på nytt ved hvert klikk, så den må settes på igjen hver gang. Finnes
         ikke ki-cards-basen (kortet kan stå alene), beholder fanen sin egen bakgrunn. */
      const ki = window.KI;
      if (ki && ki.pillefaner && this.shadowRoot.querySelector(".skinne")) {
        ki.pillefaner(this, { rad: ".skinne", knapp: ".skinne .fane", aktiv: "valgt" });
      }
    }

    /* ── strømregning ──
     *
     * Fanerada øverst, og under den perioden du står i. Måneden er den samme som
     * før, og leses rett fra Strømkalkulator - den virker altså uten noe mer. Dag,
     * uke, år og kalender kommer fra ki_enhetsforbruk, som fører boka av de samme
     * månedssensorene; mangler den, sier fanene fra i klartekst.
     */
    _regning() {
      if (this._c.faner === false) return this._regningMaaned();
      const id = this._regningId();
      const a = (id && this._hass.states[id] && this._hass.states[id].attributes) || null;
      const faner = ["Dag", "Uke", "Måned", "År"];
      const skinne = `<div class="skinne">
        ${faner.map((navn, i) => `<button class="fane ${i === this._per ? "valgt" : ""}" data-per="${i}">${navn}</button>`).join("")}
        <button class="kalknapp ${this._kal ? "pa" : ""}" data-kal="1" title="Kalender">
          <ha-icon icon="mdi:calendar-month"></ha-icon></button></div>`;
      let innhold;
      if (this._kal) innhold = a ? this._aarKalender(a) : this._mangler();
      else if (this._per === 2) innhold = this._regningMaaned();
      else innhold = a ? this._regningPeriode(a, id) : this._mangler();
      /* Rada leveres utenfor kortflaten - se _tegn(). */
      return { topp: skinne, kort: innhold };
    }

    _mangler() {
      return `<div class="under">Denne fanen kommer fra KI Enhetsforbruk.
        Legg til en «Strømregning» på integrasjonssiden, eller sett <b>sensorer: { regning: … }</b> i kortet.</div>`;
    }

    /* Måneden, rett fra Strømkalkulator - uendret fra før fanene kom. */
    _regningMaaned() {
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

    /* ── årlig strømregning ── */
    /* Tallene kommer fra ki_enhetsforbruk, som fører dag-, måneds- og årstall av
       Strømkalkulators månedssensorer. Kortet regner ingenting selv - det leser
       boka og tegner den. */
    /* vis: aar er samme kort, bare åpnet på År-fanen. */
    _aar() { return this._regning(); }

    /* Postene i to kolonner, samme form som i månedskortet. */
    _postRutenett(poster) {
      const felt = [
        ["kostnad", "Strøm", "var(--blue, #0a84ff)"],
        ["nettleie", "Nettleie", "var(--orange, #ff9f0a)"],
        ["avgifter", "Avgifter", "var(--purple, #bf5af2)"],
        ["stromstotte", "Strømstøtte", "var(--green, #34c759)"],
        ["norgespris", "Norgespris", "var(--green, #34c759)"],
      ];
      const fradrag = (k, v) => k === "stromstotte" || (k === "norgespris" && v < 0);
      const rader = felt.filter(([k]) => poster && poster[k]).map(([k, navn, farge]) => {
        const v = Number(poster[k]);
        return `<div class="rad"><span style="white-space:nowrap"><span class="prikk" style="background:${farge}"></span>
          <span style="opacity:.7">${navn}</span></span>
          <span style="white-space:nowrap" class="${fradrag(k, v) ? "gronn" : ""}">${
            fradrag(k, v) ? "−" : ""}${this._kr(v)} kr</span></div>`;
      }).join("");
      return rader
        ? `<div class="rutenett" style="margin-top:12px">${rader}</div>`
        : `<div class="under" style="margin-top:12px">Ingen poster ført ennå</div>`;
    }

    /* Den stablede stolpa: bare postene som koster noe. */
    _postStolpe(poster) {
      const deler = [
        [Number((poster || {}).kostnad) || 0, "var(--blue, #0a84ff)"],
        [Number((poster || {}).nettleie) || 0, "var(--orange, #ff9f0a)"],
        [Number((poster || {}).avgifter) || 0, "var(--purple, #bf5af2)"],
      ].filter(([v]) => v > 0);
      const sum = deler.reduce((t, [v]) => t + v, 0);
      if (!sum) return "";
      return `<div class="stolpe">${deler.map(([v, c]) =>
        `<div style="width:${(v / sum * 100).toFixed(1)}%;background:${c}"></div>`).join("")}</div>`;
    }

    /* Dag, uke og år.
     *
     * Samme oppbygning som måneden: tallet, den stablede stolpa, postene – og under
     * en søyle per døgn (per måned i År-fanen). Trykk på en søyle, så bytter HELE
     * blokka til det døgnet; trykk igjen for å komme tilbake til perioden.
     */
    _regningPeriode(a, id) {
      const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const na = new Date(); na.setHours(0, 0, 0, 0);
      const aaret = this._per === 3;
      let rader;

      if (aaret) {
        rader = (a.maneder || []).map((m, i) => ({
          id: String(i), sum: m.sum === null || m.sum === undefined ? null : Number(m.sum),
          poster: m.poster, energi: m.energi, fremtid: m.fremtid,
          navn: (m.navn || "")[0] ? m.navn[0].toUpperCase() + m.navn.slice(1) : "",
          merke: String(m.navn || "·")[0].toUpperCase(), pagaende: m.pagaende,
        }));
      } else {
        const alle = a.dager || [];
        const fra = new Date(na);
        if (this._per === 0) fra.setDate(na.getDate() - 13);           /* dag: to uker som bakteppe */
        else fra.setDate(na.getDate() - ((na.getDay() + 6) % 7));      /* uke: fra mandag */
        rader = [];
        for (const d = new Date(fra); d <= na; d.setDate(d.getDate() + 1)) {
          const dato = iso(d);
          const funn = alle.find((x) => x.dato === dato);
          rader.push({
            id: dato, sum: funn ? Number(funn.sum) : null, poster: funn && funn.poster,
            navn: d.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }),
            merke: this._per === 1 ? ["S", "M", "T", "O", "T", "F", "L"][d.getDay()]
              : (d.getDate() % 2 ? "" : d.getDate()),
            pagaende: dato === iso(na),
          });
        }
      }

      const valgt = rader.find((r) => r.id === this._valgtDag) || null;
      let sum, poster, tittel, undertekst, energi;
      if (valgt) {
        sum = valgt.sum; poster = valgt.poster; energi = valgt.energi;
        tittel = valgt.navn;
        undertekst = valgt.pagaende ? "Så langt" : (aaret ? "Hele måneden" : "Hele døgnet");
      } else if (this._per === 0) {
        sum = a.i_dag; poster = a.poster_i_dag; tittel = "i dag";
        undertekst = `Så langt i dag${a.dagens_energikostnad ? ` · strøm ${this._kr(a.dagens_energikostnad)} kr` : ""}`;
      } else if (this._per === 1) {
        poster = {};
        rader.forEach((r) => Object.entries(r.poster || {}).forEach(([k, v]) => {
          poster[k] = (poster[k] || 0) + Number(v);
        }));
        sum = a.denne_uken; tittel = "denne uken"; undertekst = "Fra mandag til i dag";
      } else {
        poster = {}; energi = {};
        rader.forEach((r) => {
          Object.entries(r.poster || {}).forEach(([k, v]) => { poster[k] = (poster[k] || 0) + Number(v); });
          Object.entries(r.energi || {}).forEach(([k, v]) => { energi[k] = (energi[k] || 0) + Number(v); });
        });
        sum = a.i_ar; tittel = String(a.ar || na.getFullYear());
        undertekst = `Hittil i år${a.i_fjor ? ` · i fjor ${this._kr(a.i_fjor)} kr` : ""}`;
      }

      const max = Math.max(...rader.map((r) => Math.abs(r.sum) || 0), 1);
      const soyler = rader.map((r) => {
        const v = Math.abs(r.sum) || 0;
        const h = r.fremtid || !v ? 4 : Math.max(8, v / max * 100);
        return `<div class="soyle ${r.fremtid || r.sum === null ? "fremtid" : ""} ${
          this._valgtDag === r.id ? "valgt" : ""}" data-dag="${r.id}">
          <span class="tall" style="bottom:calc(${h}% + 3px)">${r.sum === null ? "" : Math.round(r.sum)}</span>
          <div class="fyll" style="height:${h}%"></div></div>`;
      }).join("");
      const merker = rader.map((r) => `<span data-dag="${r.id}" class="${
        this._valgtDag === r.id ? "valgt" : ""}">${r.merke}</span>`).join("");

      const dag = energi && energi.forbruk_dag, natt = energi && energi.forbruk_natt;
      const pst = dag || natt ? Math.round((dag || 0) / (((dag || 0) + (natt || 0)) || 1) * 100) : null;

      return `
        <div class="hode"><span class="tittel"><ha-icon icon="mdi:cash-fast"></ha-icon>Strømregning · ${tittel}</span>
          <span class="svak">${valgt ? "trykk igjen" : "hittil"}</span></div>
        <div class="stor" data-mer="${id}" style="margin-top:6px;display:inline-block">${
          sum === null || sum === undefined ? "–" : `${sum < 0 ? "−" : ""}${this._kr(sum)}<small>kr</small>`}</div>
        <div class="under" style="margin-bottom:12px">${undertekst}</div>
        ${this._postStolpe(poster)}
        ${this._postRutenett(poster)}
        <div class="skille">
          <div class="graf">${soyler}</div>
          <div class="bokst">${merker}</div>
        </div>
        ${energi && energi.forbruk_totalt ? `<div class="skille">
          <div class="rad" style="font-size:13px;margin-bottom:6px"><span style="opacity:.7">Forbruk ${
            valgt ? "denne måneden" : "i år"}</span><span>${this._kr(energi.forbruk_totalt, 1)} kWh</span></div>
          ${pst === null ? "" : `<div class="stolpe" style="height:8px">
            <div style="width:${pst}%;background:var(--yellow, #ffd60a)"></div>
            <div style="width:${100 - pst}%;background:var(--blue, #0a84ff);opacity:.7"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px;opacity:.75">
            <span><ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:14px;vertical-align:-2px;margin-right:4px"></ha-icon>Dag ${
              this._kr(dag, 1)} kWh · ${pst} %</span>
            <span><ha-icon icon="mdi:weather-night" style="--mdc-icon-size:14px;vertical-align:-2px;margin-right:4px"></ha-icon>Natt/helg ${
              this._kr(natt, 1)} kWh</span></div>`}
        </div>` : ""}`;
    }

    /* Månedskalender: én rute per dag med kronene for det døgnet.
       Fargen blir sterkere jo dyrere dagen var, så måneden leses som et varmekart. */
    _aarKalender(a) {
      const na = new Date(); na.setHours(0, 0, 0, 0);
      const vist = new Date(na.getFullYear(), na.getMonth() + this._blaMnd, 1);
      const nokkel = `${vist.getFullYear()}-${String(vist.getMonth() + 1).padStart(2, "0")}`;
      const dager = this._dagerFor(a, nokkel);
      const perDag = {}; dager.forEach((d) => { perDag[d.dato] = d; });
      const verdier = dager.map((d) => Math.abs(Number(d.sum) || 0));
      const max = Math.max(...verdier, 1);
      const start = new Date(vist);
      start.setDate(1 - ((vist.getDay() + 6) % 7));            /* mandag først */
      const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const ruter = [];
      for (let i = 0; i < 42; i++) {
        const dag = new Date(start); dag.setDate(start.getDate() + i);
        const utenfor = dag.getMonth() !== vist.getMonth();
        const rad = perDag[iso(dag)];
        const v = rad ? Number(rad.sum) : null;
        const styrke = v === null ? 0 : Math.min(0.85, 0.12 + Math.abs(v) / max * 0.7);
        ruter.push(`<div class="dag ${utenfor ? "utenfor" : ""} ${v === null ? "tom" : ""}
          ${dag.getTime() === na.getTime() ? "idag" : ""} ${this._valgtDag === iso(dag) ? "valgt" : ""}"
          ${!utenfor && rad ? `data-dag="${iso(dag)}"` : ""}
          style="${v === null ? "" : `background:rgba(255,159,10,${styrke.toFixed(2)})`}">
          <span class="dnr">${dag.getDate()}</span>${v === null ? "" : `<span>${Math.round(v)}</span>`}</div>`);
      }
      const valgt = this._valgtDag ? perDag[this._valgtDag] : null;
      const sum = dager.reduce((t, d) => t + (Number(d.sum) || 0), 0);
      const navn = { kostnad: "Strøm", nettleie: "Nettleie", avgifter: "Avgifter",
        stromstotte: "Strømstøtte", norgespris: "Norgespris" };
      const detalj = valgt
        ? `${new Date(valgt.dato).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })} · ${
            this._kr(valgt.sum)} kr${valgt.pagaende ? " så langt" : ""}${
            valgt.poster ? " · " + Object.keys(navn).filter((k) => valgt.poster[k])
              .map((k) => `${navn[k]} ${this._kr(valgt.poster[k])}`).join(" · ") : ""}`
        : dager.length ? `${dager.length} døgn ført · ${this._kr(sum)} kr til sammen`
          : "Ingen døgn ført for denne måneden";
      return `
        <div style="margin-top:14px">
          <div class="kaltopp">
            <button class="pil" data-bla="-1"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <div class="mnd">${vist.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}</div>
            <button class="pil" data-bla="1" ${this._blaMnd >= 0 ? "disabled style=opacity:.25" : ""}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </div>
          <div class="ukedager">${["M", "T", "O", "T", "F", "L", "S"].map((u) => `<span>${u}</span>`).join("")}</div>
          <div class="rutenett7">${ruter.join("")}</div>
          <div class="dagdetalj">${detalj}</div>
        </div>`;
    }

    /* Døgnene for én måned.
       Oversiktssensoren bærer de siste 95 døgnene - alt arkivet som attributt ville
       blitt skrevet om igjen hver gang en kilde rørte seg. Blar du lenger bakover,
       hentes måneden med tjenesten, og svaret beholdes til kortet bygges på nytt. */
    _dagerFor(a, nokkel) {
      const fra = (a.dager || []).filter((d) => String(d.dato || "").startsWith(nokkel));
      if (fra.length) return fra;
      if (this._hentet[nokkel]) return this._hentet[nokkel];
      if (!this._hass.callWS) return [];
      this._hentet[nokkel] = [];
      this._hass.callWS({
        type: "call_service", domain: "ki_enhetsforbruk", service: "historikk",
        service_data: { maned: nokkel }, return_response: true,
      }).then((svar) => {
        const regninger = (svar && svar.response && svar.response.regninger) || {};
        const forste = Object.values(regninger)[0];
        this._hentet[nokkel] = (forste && forste.dager) || [];
        if (this._kal) this._tegn();
      }).catch(() => { /* eldre integrasjon uten tjenesten: la ruta stå tom */ });
      return [];
    }
  }

  if (!customElements.get("ki-strom-detaljer-card")) customElements.define("ki-strom-detaljer-card", KiStromDetaljerCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-strom-detaljer-card"))
    window.customCards.push({ type: "ki-strom-detaljer-card", name: "KI Strøm-detaljer", description: "Strømregning med dag/uke/måned/år og kalender, effekttrinn, effektledd per måned og Norgespris – kompakt og trykkbart" });
})();

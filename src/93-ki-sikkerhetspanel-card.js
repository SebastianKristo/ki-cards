/*
 * ki-sikkerhetspanel-card — sikkerhetspopupen fra skissen «Sikkerhet v2».
 *
 * Øverst en ring med én strek per sensor rundt alarmens modus: streken lyser når en
 * dør eller et vindu står åpent eller en lås er ulåst (oransje), eller når en sensor
 * ser bevegelse (blå). Under ringen en setning om hva som trenger deg, modusvelgeren
 * (hold inne for å bytte), «Krever oppmerksomhet» med en knapp per ting, rommene med
 * sensorene sine, og siste hendelser fra loggboka.
 *
 * Fargene er dashbordets egne: --orange for det som krever oppmerksomhet, --blue for
 * bevegelse, --green for Hjemme, --gray* for flater og tekst.
 *
 * type: custom:ki-sikkerhetspanel-card
 * entity: alarm_control_panel.alarm
 * topp: false               # egen overskrift og X (standard av – bubble-card har sin egen topp)
 * ansikt: sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av   # hvem som låste opp med ansikt
 * kode_lengde: 6             # tastatur når alarmen krever kode (settes ellers av entiteten)
 * batteri_grense: 20
 * hendelser: 6               # antall i «Siste hendelser» (0 = skjul)
 * zones: …                   # samme soner som ki-sikkerhet-card; hvert punkt kan ha rom:
 *   - title: Dører           # tittel/ikon avgjør typen: dør, vindu, bevegelse, lås
 *     kind: opening
 *     items:
 *       - { entity: binary_sensor.inngangsdor, name: Dør, rom: Inngang, battery: sensor.x }
 */
(() => {
  const VERSJON = "1.2.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const kl = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

  const MODUS = [
    { k: "disarmed", navn: "Av", ikon: "mdi:shield-off-outline", farge: "var(--gray800, #8e8d89)", tjeneste: "alarm_disarm" },
    { k: "armed_home", navn: "Hjemme", ikon: "mdi:home-outline", ikonPa: "mdi:home", farge: "var(--green, #6fcf8e)", tjeneste: "alarm_arm_home" },
    { k: "armed_away", navn: "Borte", ikon: "mdi:shield-lock-outline", ikonPa: "mdi:shield-lock", farge: "var(--orange, #e8b56e)", tjeneste: "alarm_arm_away" },
    { k: "armed_night", navn: "Natt", ikon: "mdi:weather-night", ikonPa: "mdi:weather-night", farge: "var(--blue, #6f9fe0)", tjeneste: "alarm_arm_night" },
  ];
  const OBS = "var(--orange, #e8b56e)", BEV = "var(--blue, #6f9fe0)";
  const tone = (farge, pst) => `color-mix(in srgb, ${farge} ${pst}%, transparent)`;

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    ha-icon { --mdc-icon-size: 20px; }
    .sp { color: var(--gray1000, #f2f1ee); display: flex; flex-direction: column; gap: 22px; padding: 6px 2px 18px;
      user-select: none; -webkit-user-select: none; }
    .etikett { font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--gray800, #8e8d89); }
    .topp { display: flex; align-items: center; justify-content: space-between; }
    .lukk { width: 36px; height: 36px; border-radius: 18px; background: var(--gray200, #232326); display: grid; place-items: center; }

    /* ringen */
    .midt { display: flex; flex-direction: column; align-items: center; gap: 18px; }
    .ring { position: relative; width: 260px; height: 260px; }
    .strek { position: absolute; left: calc(50% - 4px); top: calc(50% - 16px); width: 8px; height: 32px; border-radius: 4px;
      transition: background .4s, box-shadow .4s; }
    .strek.lyser { animation: sp-puls 2.4s ease-in-out infinite; }
    @keyframes sp-puls { 50% { filter: brightness(1.25); } }
    .kjerne { position: absolute; inset: 44px; border-radius: 50%; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 4px; background: var(--gray100, #1c1c1f); box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
      transition: background .4s; cursor: pointer; }
    .kjerne ha-icon { --mdc-icon-size: 32px; }
    .kjerne b { font-size: 26px; font-weight: 500; letter-spacing: -.02em; }
    .kjerne small { font-size: 12px; color: var(--gray800, #8e8d89); }
    .setning { display: grid; gap: 6px; text-align: center; max-width: 340px; }
    .setning b { font-size: 22px; font-weight: 500; letter-spacing: -.015em; line-height: 1.25; text-wrap: balance; }
    .setning span { font-size: 14px; line-height: 1.35; color: var(--gray800, #8e8d89); }

    /* modus */
    .moduser { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 5px; border-radius: 22px; background: var(--gray100, #1c1c1f); }
    .modus { position: relative; overflow: hidden; height: 64px; border-radius: 17px; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 5px; color: var(--gray800, #a9a7a2); touch-action: none; transition: background .25s; }
    .modus span { position: relative; font-size: 12px; font-weight: 500; }
    .modus ha-icon { position: relative; --mdc-icon-size: 21px; }
    .modus .fyll { position: absolute; inset: 0 auto 0 0; width: 0; }
    .modus.aktiv { color: var(--gray1000, #f2f1ee); }
    .hint { font-size: 11px; color: var(--gray800, #6d6c69); opacity: .8; text-align: center; margin-top: 8px; }

    /* krever oppmerksomhet */
    .obs { display: flex; flex-direction: column; gap: 8px; }
    .obs .etikett { color: ${OBS}; padding: 0 4px; }
    .varsel { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 14px; border-radius: 20px;
      background: ${tone(OBS, 12)}; box-shadow: inset 0 0 0 1px ${tone(OBS, 35)}; }
    .varsel > ha-icon { --mdc-icon-size: 22px; color: ${OBS}; flex: none; }
    .varsel .vt { flex: 1; min-width: 0; display: grid; gap: 2px; }
    .varsel .vt b { font-size: 15px; font-weight: 500; }
    .varsel .vt span { font-size: 12px; opacity: .8; }
    .varsel .vk { height: 36px; padding: 0 14px; border-radius: 18px; background: ${OBS}; color: var(--black, #161618); font-size: 13px;
      font-weight: 600; white-space: nowrap; transition: transform .12s; }
    .varsel .vk:active { transform: scale(.94); }

    /* rom */
    .romhode { display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px 8px; }
    .romhode small { font-size: 12px; color: var(--gray800, #6d6c69); }
    .rom { display: flex; align-items: flex-start; gap: 10px; padding: 10px 4px; }
    .rom + .rom { border-top: 1px solid rgba(255,255,255,.05); }
    .rnavn { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; padding-top: 7px; }
    .rnavn i { width: 7px; height: 7px; border-radius: 4px; flex: none; background: var(--gray400, #48474a); }
    .rnavn span { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brikker { flex: none; max-width: 64%; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .brikke { height: 32px; padding: 0 11px 0 8px; border-radius: 16px; display: flex; align-items: center; gap: 6px; font-size: 12px;
      font-weight: 500; white-space: nowrap; background: var(--gray100, #1f1f22); color: var(--gray1000, #c9c7c2);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.04); transition: background .2s; }
    .brikke ha-icon { --mdc-icon-size: 16px; color: var(--gray800, #8e8d89); }
    .brikke.borte { opacity: .5; }

    /* hendelser */
    .logg { display: flex; flex-direction: column; padding-left: 4px; }
    .hend { display: flex; gap: 14px; align-items: stretch; }
    .spor { display: flex; flex-direction: column; align-items: center; width: 10px; flex: none; }
    .spor i { width: 9px; height: 9px; border-radius: 5px; margin-top: 5px; flex: none; }
    .spor u { flex: 1; width: 1px; margin-top: 4px; background: rgba(255,255,255,.1); }
    .hend:last-child .spor u { background: transparent; }
    .htekst { flex: 1; display: flex; justify-content: space-between; gap: 12px; padding-bottom: 14px; }
    .htekst b { font-size: 14px; font-weight: 400; }
    .htekst span { display: block; font-size: 12px; color: var(--gray800, #8e8d89); margin-top: 2px; }
    .htekst time { font-size: 12px; color: var(--gray800, #8e8d89); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .tomt { font-size: 13px; color: var(--gray800, #8e8d89); padding: 0 4px; }

    /* kodetastaturet fra ki-alarm-card */
    .tastatur { position: relative; margin-top: 10px; background: var(--gray200, var(--card-background-color)); border-radius: 26px;
      padding: 28px 18px 22px; display: flex; flex-direction: column; gap: 18px; max-width: 340px; margin-left: auto; margin-right: auto;
      animation: sp-inn .25s cubic-bezier(.2,.9,.3,1); }
    @keyframes sp-inn { from { opacity: 0; transform: translateY(-6px); } }
    .tastatur.feil { animation: sp-rist .4s ease; }
    @keyframes sp-rist { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-9px); } 75% { transform: translateX(9px); } }
    .tast-hode { text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .tast-tittel { font-size: 17px; font-weight: 600; color: var(--gray1000, var(--primary-text-color)); }
    .tastatur.feil .tast-tittel { color: var(--red, #e5484d); }
    .tast-under { font-size: 12px; font-weight: 500; opacity: .6; }
    .prikker { display: flex; gap: 14px; justify-content: center; margin-top: 10px; }
    .prikk { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(128,128,128,.5); transition: background .15s, border-color .15s; }
    .prikk.fylt { background: var(--gray1000, var(--primary-text-color)); border-color: var(--gray1000, var(--primary-text-color)); }
    .tastatur.feil .prikk.fylt { background: var(--red, #e5484d); border-color: var(--red, #e5484d); }
    .tastrad { display: grid; grid-template-columns: repeat(3, 68px); justify-content: center; gap: 16px; }
    .tast { width: 68px; height: 68px; padding: 0; border-radius: 50%; background: rgba(0,0,0,.18); color: var(--gray1000, var(--primary-text-color));
      font-size: 24px; font-weight: 500; --mdc-icon-size: 22px; display: flex; align-items: center; justify-content: center; transition: filter .12s ease; }
    .tast:active { filter: brightness(1.35); }
    .tast.tom { background: transparent; pointer-events: none; }
    .tlukk { position: absolute; top: 14px; right: 14px; width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,.18);
      display: flex; align-items: center; justify-content: center; --mdc-icon-size: 26px; }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  `;

  /* Hva slags sensor et punkt er – ut fra sonens kind, tittel, ikon og domenet. */
  function typeFor(z, it) {
    if (it.type) return it.type;
    const d = String(it.entity || "").split(".")[0];
    if (d === "lock" || z.kind === "lock") return "las";
    if (z.kind === "motion") return /presence|tilstede/i.test(`${it.entity} ${it.name || ""}`) ? "tilstede" : "bevegelse";
    const t = `${z.title || ""} ${z.icon || ""}`.toLowerCase();
    if (/vindu|window/.test(t)) return "vindu";
    return "dor";
  }

  class KiSikkerhetspanelCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; this._logg = null; this._kode = ""; }
    static getStubConfig() { return { entity: "alarm_control_panel.alarm", zones: [] }; }
    getCardSize() { return 16; }

    setConfig(c) {
      if (!c || !c.entity) throw new Error("Sett entity: alarm_control_panel.…");
      this._c = { tittel: "Sikkerhet", topp: false, lukk: true, batteri_grense: 20, hendelser: 6, tastatur_luft: 96, ...c };
      this._sensorer = [];
      for (const z of c.zones || []) {
        for (const it of z.items || []) {
          if (!it || !it.entity) continue;
          this._sensorer.push({ id: it.entity, navn: it.name || it.navn || it.entity, rom: it.rom || it.room || it.name || "Annet",
            type: typeFor(z, it), batteri: it.battery || it.batteri || null });
        }
      }
      this._sig = "";
      if (this._hass) this._tegn();
    }

    set hass(h) {
      this._hass = h;
      const ids = [this._c.entity, this._c.ansikt, ...this._sensorer.map((s) => s.id), ...this._sensorer.map((s) => s.batteri).filter(Boolean)].filter(Boolean);
      const sig = ids.map((id) => { const st = h.states[id]; return st ? `${st.state}|${st.last_changed}` : "-"; }).join(",");
      if (sig === this._sig) return;
      this._sig = sig;
      /* Holder du inne en modusknapp eller taster kode, venter tegningen til du er ferdig.
         Før ble hele kortet tegnet på nytt når en sensor meldte midt i holdet – knappen
         under fingeren forsvant, holdet ble avbrutt, og du måtte holde på nytt. */
      if (this._holder || this._kodeApen) { this._ventende = true; return; }
      this._tegn();
      this._hentLogg();
    }

    /* ---------- tilstand ---------- */
    _st(id) { return id && this._hass ? this._hass.states[id] : undefined; }

    _status(s) {
      const st = this._st(s.id);
      if (!st || ["unavailable", "unknown"].includes(st.state)) return { borte: true, pa: false, obs: false };
      let pa;
      if (s.type === "las") pa = ["unlocked", "open", "opening", "unlocking", "jammed"].includes(st.state);
      else pa = st.state === "on" || st.state === "open";
      const obs = pa && (s.type === "dor" || s.type === "vindu" || s.type === "las");
      return { borte: false, pa, obs, bev: pa && !obs, st };
    }

    _batteri(s) {
      const b = this._st(s.batteri);
      const v = b ? Number(b.state) : NaN;
      return isNaN(v) ? null : Math.round(v);
    }

    _haptikk(t = "light") {
      try { window.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true })); } catch (e) { /* eldre */ }
      if (navigator.vibrate) { try { navigator.vibrate(t === "success" ? [10, 40, 10] : 8); } catch (e) { /* blokkert */ } }
    }

    _mer(id) {
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: id };
      this.dispatchEvent(ev);
    }

    /* ---------- tegning ---------- */
    _tegn() {
      if (!this._hass || !this._c) return;
      const alarm = this._st(this._c.entity);
      const modus = MODUS.find((m) => m.k === (alarm && alarm.state)) || MODUS[0];
      const armert = modus.k !== "disarmed";
      const liste = this._sensorer.map((s) => ({ ...s, ...this._status(s), bat: this._batteri(s),
        ansikt: s.type === "las" ? this._ansiktNaa(s.id) : null }));
      const obs = liste.filter((x) => x.obs);
      const bev = liste.filter((x) => x.bev);
      const n = liste.length || 1;

      // ringen
      const ring = liste.map((x, i) => {
        const farge = x.obs ? OBS : x.bev ? BEV : null;
        const grunn = armert ? tone(modus.farge, 55) : "var(--gray200, #38383b)";
        return `<i class="strek ${farge ? "lyser" : ""}" title="${esc(`${x.rom} · ${x.navn}`)}" style="transform:rotate(${((360 / n) * i).toFixed(1)}deg) translateY(-110px);
          background:${farge || grunn};${farge ? `box-shadow:0 0 14px ${tone(farge, 70)}` : ""}"></i>`;
      }).join("");
      const siden = alarm && alarm.last_changed ? kl(new Date(alarm.last_changed)) : "";
      const overgang = alarm && ["arming", "pending", "triggered"].includes(alarm.state);

      // setningen
      const flertall = (k, en, flere) => `${k} ${k === 1 ? en : flere}`;
      const deler = [];
      const dorer = obs.filter((x) => x.type === "dor").length, vinduer = obs.filter((x) => x.type === "vindu").length, laser = obs.filter((x) => x.type === "las").length;
      if (dorer) deler.push(`${flertall(dorer, "dør", "dører")} ${dorer === 1 ? "står åpen" : "står åpne"}`);
      if (vinduer) deler.push(`${flertall(vinduer, "vindu", "vinduer")} ${vinduer === 1 ? "står åpent" : "står åpne"}`);
      if (laser) deler.push(`${flertall(laser, "lås", "låser")} er ulåst${laser === 1 ? "" : "e"}`);
      const setning = alarm && alarm.state === "triggered" ? "Alarmen er utløst!"
        : deler.length ? (deler.length > 1 ? `${deler.slice(0, -1).join(", ")} og ${deler[deler.length - 1]}` : deler[0]).replace(/^./, (c) => c.toUpperCase())
        : "Alt er lukket og låst";
      const iRo = liste.length - obs.length - bev.length;
      const under = `${bev.length ? `${flertall(bev.length, "sensor", "sensorer")} ser bevegelse` : "Ingen bevegelse"} · ${iRo} i ro`;

      // modusvelger
      const moduser = MODUS.map((m) => {
        const aktiv = m.k === modus.k;
        return `<button class="modus ${aktiv ? "aktiv" : ""}" data-modus="${m.k}"
          style="${aktiv ? `background:${tone(m.farge, 18)};box-shadow:inset 0 0 0 1px ${tone(m.farge, 45)}` : ""}">
          <span class="fyll" style="background:${tone(m.farge, 28)}"></span>
          <ha-icon icon="${aktiv ? (m.ikonPa || m.ikon) : m.ikon}" style="${aktiv ? `color:${m.farge}` : ""}"></ha-icon>
          <span>${m.navn}</span></button>`;
      }).join("");

      // krever oppmerksomhet
      const varsler = obs.map((x) => {
        const erLas = x.type === "las";
        const tekst = erLas ? `${x.navn} er ulåst` : `${x.type === "vindu" ? "Vindu" : "Dør"} er ${x.type === "vindu" ? "åpent" : "åpen"}`;
        return `<div class="varsel">
          <ha-icon icon="${erLas ? "mdi:lock-open-variant-outline" : x.type === "vindu" ? "mdi:window-open-variant" : "mdi:door-open"}"></ha-icon>
          <div class="vt"><b>${esc(tekst)}</b><span>${esc(x.ansikt ? `${x.rom} · låst opp av ${x.ansikt} med ansikt` : x.rom)}</span></div>
          <button class="vk" data-fiks="${esc(x.id)}">${erLas ? "Lås" : "Vis"}</button></div>`;
      }).join("");
      // lavt batteri er også noe som krever deg
      const lave = liste.filter((x) => x.bat != null && x.bat <= this._c.batteri_grense).map((x) => `<div class="varsel">
          <ha-icon icon="mdi:battery-alert-variant-outline"></ha-icon>
          <div class="vt"><b>Lavt batteri · ${x.bat} %</b><span>${esc(`${x.rom} · ${x.navn}`)}</span></div>
          <button class="vk" data-mer="${esc(x.batteri)}">Vis</button></div>`).join("");

      // rommene
      const rom = [...new Set(liste.map((x) => x.rom))];
      const ikon = (x) => ({ dor: x.pa ? "mdi:door-open" : "mdi:door", vindu: x.pa ? "mdi:window-open-variant" : "mdi:window-closed-variant",
        las: x.pa ? "mdi:lock-open-variant-outline" : "mdi:lock-outline", bevegelse: x.pa ? "mdi:run" : "mdi:walk", tilstede: "mdi:account-outline" })[x.type];
      const tekst = (x) => {
        if (x.borte) return `${x.navn} · ikke tilgjengelig`;
        if (x.type === "las") return x.pa ? (x.ansikt ? `Låst opp av ${x.ansikt}` : `${x.navn} ulåst`) : x.bat != null ? `${x.navn} · ${x.bat} %` : x.navn;
        if (x.type === "dor") return x.pa ? "Åpen" : x.navn;
        if (x.type === "vindu") return x.pa ? "Åpent" : x.navn;
        if (x.type === "tilstede") return x.pa ? "Noen her" : x.navn;
        return x.pa ? "Bevegelse nå" : x.navn;
      };
      const romHtml = rom.map((r) => {
        const her = liste.filter((x) => x.rom === r);
        const al = her.some((x) => x.obs), mv = her.some((x) => x.bev);
        return `<div class="rom"><div class="rnavn"><i style="${al ? `background:${OBS}` : mv ? `background:${BEV}` : ""}"></i><span>${esc(r)}</span></div>
          <div class="brikker">${her.map((x) => {
            const f = x.obs ? OBS : x.bev ? BEV : null;
            return `<button class="brikke ${x.borte ? "borte" : ""}" data-mer="${esc(x.id)}"
              style="${f ? `background:${tone(f, 16)};box-shadow:inset 0 0 0 1px ${tone(f, 40)}` : ""}">
              <ha-icon icon="${ikon(x)}" style="${f ? `color:${f}` : ""}"></ha-icon>${esc(tekst(x))}</button>`;
          }).join("")}</div></div>`;
      }).join("");

      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="sp">
          ${this._c.topp ? `<div class="topp"><span class="etikett">${esc(this._c.tittel)}</span>
            ${this._c.lukk ? `<button class="lukk" data-lukk aria-label="Lukk"><ha-icon icon="mdi:close"></ha-icon></button>` : ""}</div>` : ""}
          <section class="midt">
            <div class="ring">${ring}
              <button class="kjerne" data-mer="${esc(this._c.entity)}" style="${armert ? `background:radial-gradient(circle at 50% 35%, ${tone(modus.farge, 16)}, var(--gray100, #1c1c1f) 70%)` : ""}">
                <ha-icon icon="${overgang ? "mdi:timer-sand" : (modus.ikonPa || modus.ikon)}" style="color:${alarm && alarm.state === "triggered" ? "var(--red, #e5646a)" : modus.farge}"></ha-icon>
                <b>${alarm && alarm.state === "triggered" ? "Utløst" : alarm && alarm.state === "arming" ? "Aktiverer" : alarm && alarm.state === "pending" ? "Venter" : modus.navn}</b>
                <small>${siden ? `${armert ? "Aktivert" : "Avslått"} ${siden}` : ""}</small>
              </button>
            </div>
            <div class="setning"><b>${esc(setning)}</b><span>${esc(under)}</span></div>
          </section>
          <section>
            <div class="moduser">${moduser}</div>
            ${this._kodeApen ? this._tastHtml() : `<div class="hint">${this._holder ? `Hold for å sette ${esc((MODUS.find((m) => m.k === this._holder) || {}).navn || "").toLowerCase()} …` : "Hold inne for å bytte modus"}</div>`}
          </section>
          ${varsler || lave ? `<section class="obs"><div class="etikett">Krever oppmerksomhet</div>${varsler}${lave}</section>` : ""}
          <section>
            <div class="romhode"><span class="etikett">Rom</span><small>${liste.length} sensorer</small></div>
            ${romHtml || `<div class="tomt">Ingen sensorer satt opp.</div>`}
          </section>
          ${this._c.hendelser ? `<section><div class="etikett" style="padding:0 4px 8px">Siste hendelser</div><div class="logg" id="logg">${this._loggHtml()}</div></section>` : ""}
        </div>
`;
      this._koble();
    }

    /* ---------- trykk og hold ---------- */
    _koble() {
      const r = this.shadowRoot;
      r.querySelectorAll("[data-mer]").forEach((b) => b.addEventListener("click", () => { this._haptikk(); this._mer(b.dataset.mer); }));
      r.querySelectorAll("[data-fiks]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.fiks;
        this._haptikk("medium");
        if (id.startsWith("lock.")) this._hass.callService("lock", "lock", { entity_id: id });
        else this._mer(id);
      }));
      const lukk = r.querySelector("[data-lukk]");
      if (lukk) lukk.addEventListener("click", () => {
        this._haptikk();
        if (window.location.hash) history.back();
      });
      /* Hold inne i 0,9 s for å bytte modus. Fyllet går over knappen mens du holder,
         så du ser hvor lenge det er igjen; slipper du før, skjer ingenting. */
      r.querySelectorAll("[data-modus]").forEach((b) => {
        const k = b.dataset.modus;
        const fyll = b.querySelector(".fyll");
        let peker = null;
        const stopp = (e) => {
          if (e && peker !== null && e.pointerId !== peker) return;
          cancelAnimationFrame(this._raf);
          if (fyll) { fyll.style.transition = "width .2s"; fyll.style.width = "0"; }
          if (this._holder === k) { this._holder = null; this._oppdaterHint(); }
          peker = null;
          this._tegnHvisVentende();
        };
        b.addEventListener("pointerdown", (e) => {
          const alarm = this._st(this._c.entity);
          if (alarm && alarm.state === k) return;
          e.preventDefault();
          /* Pekeren fanges, så holdet ikke slippes om fingeren glir litt – bare når du
             faktisk løfter fingeren (eller systemet avbryter). */
          peker = e.pointerId;
          try { b.setPointerCapture(e.pointerId); } catch (x) { /* eldre nettlesere */ }
          this._holder = k; this._oppdaterHint();
          this._haptikk("selection");
          const t0 = performance.now();
          if (fyll) fyll.style.transition = "none";
          const steg = () => {
            const p = Math.min(1, (performance.now() - t0) / 900);
            if (fyll) fyll.style.width = `${p * 100}%`;
            if (p < 1) this._raf = requestAnimationFrame(steg);
            else { this._holder = null; peker = null; this._velg(k); this._tegnHvisVentende(); }
          };
          this._raf = requestAnimationFrame(steg);
        });
        b.addEventListener("pointerup", stopp);
        b.addEventListener("pointercancel", stopp);
        b.addEventListener("lostpointercapture", stopp);
        b.addEventListener("contextmenu", (e) => e.preventDefault());
      });
      if (this._kodeApen) {
        r.querySelectorAll("[data-tast]").forEach((b) => b.addEventListener("click", () => this._tast(b.dataset.tast)));
      }
    }

    _tegnHvisVentende() {
      if (this._ventende && !this._holder && !this._kodeApen) { this._ventende = false; this._tegn(); this._hentLogg(); }
    }

    _oppdaterHint() {
      const h = this.shadowRoot.querySelector(".hint");
      if (h) h.textContent = this._holder ? `Hold for å sette ${((MODUS.find((m) => m.k === this._holder) || {}).navn || "").toLowerCase()} …` : "Hold inne for å bytte modus";
    }

    /* Trenger alarmen kode for dette? Avslåing trenger det når entiteten har et kodeformat;
       aktivering når code_arm_required er satt. */
    _trengerKode(k) {
      const a = (this._st(this._c.entity) || {}).attributes || {};
      if (!a.code_format) return false;
      return k === "disarmed" ? true : a.code_arm_required !== false;
    }

    _velg(k) {
      this._haptikk("success");
      if (this._trengerKode(k)) {
        this._kodeFor = k; this._kode = ""; this._kodeFeil = false; this._kodeApen = true; this._tegn();
        const tk = this.shadowRoot.querySelector(".tastatur");
        if (tk && tk.scrollIntoView) setTimeout(() => tk.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
        return;
      }
      this._send(k);
    }

    _send(k, kode) {
      const m = MODUS.find((x) => x.k === k);
      const data = { entity_id: this._c.entity };
      if (kode) data.code = kode;
      this._hass.callService("alarm_control_panel", m.tjeneste, data)
        .then(() => { if (this._kodeApen) this._lukkKode(); })
        .catch(() => {
          this._kodeFeil = true;
          this._kode = "";
          const tk = this.shadowRoot.querySelector(".tastatur");
          if (tk) {
            tk.classList.remove("feil"); void tk.offsetWidth; tk.classList.add("feil");
            tk.querySelector(".tast-tittel").textContent = "Feil kode";
            tk.querySelector(".tast-under").textContent = "Prøv på nytt";
          }
          this._fyllPrikker();
          this._haptikk("failure");
        });
    }

    _lengde() {
      const a = (this._st(this._c.entity) || {}).attributes || {};
      return Number(this._c.kode_lengde) || (a.code_format === "number" ? 6 : 6);
    }

    /* Tastaturet fra ki-alarm-card: eget kort med tittel, runde prikker, store runde
       taster og kryss oppe til høyre – nå i kortet rett under modusvelgeren, ikke som et
       ark nederst på skjermen, så navbaren aldri dekker det. */
    _tastHtml() {
      const m = MODUS.find((x) => x.k === this._kodeFor) || MODUS[0];
      const lengde = this._lengde();
      let tittel = `Tast koden for ${m.navn.toLowerCase()}`, under = "Lukk med krysset for å gå tilbake";
      if (this._kodeFeil) { tittel = "Feil kode"; under = "Prøv på nytt"; }
      const taster = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((t) => `<button type="button" class="tast" data-tast="${t}">${t}</button>`).join("");
      return `<div class="tastatur ${this._kodeFeil ? "feil" : ""}">
        <button type="button" class="tlukk" data-tast="lukk" aria-label="Lukk tastatur"><ha-icon icon="mdi:close"></ha-icon></button>
        <div class="tast-hode"><div class="tast-tittel">${esc(tittel)}</div><div class="tast-under">${esc(under)}</div>
          <div class="prikker">${Array.from({ length: lengde }, (_, i) => `<span class="prikk ${i < this._kode.length ? "fylt" : ""}"></span>`).join("")}</div></div>
        <div class="tastrad">${taster}
          <button type="button" class="tast tom" disabled></button>
          <button type="button" class="tast" data-tast="0">0</button>
          <button type="button" class="tast ikon" data-tast="slett" aria-label="Slett"><ha-icon icon="mdi:backspace-outline"></ha-icon></button>
        </div></div>`;
    }

    _fyllPrikker() {
      this.shadowRoot.querySelectorAll(".prikk").forEach((p, i) => p.classList.toggle("fylt", i < this._kode.length));
    }

    _tast(t) {
      this._haptikk("selection");
      if (t === "lukk") { this._lukkKode(); return; }
      if (this._kodeFeil) { this._kodeFeil = false; const tk = this.shadowRoot.querySelector(".tastatur");
        if (tk) { tk.classList.remove("feil"); tk.querySelector(".tast-tittel").textContent = `Tast koden for ${((MODUS.find((x) => x.k === this._kodeFor) || MODUS[0]).navn).toLowerCase()}`;
          tk.querySelector(".tast-under").textContent = "Lukk med krysset for å gå tilbake"; } }
      if (t === "slett") this._kode = this._kode.slice(0, -1);
      else if (this._kode.length < this._lengde()) this._kode += t;
      this._fyllPrikker();
      if (this._kode.length === this._lengde()) this._send(this._kodeFor, this._kode);
    }

    _lukkKode() { this._kodeApen = false; this._kodeFeil = false; this._kode = ""; this._ventende = false; this._tegn(); this._hentLogg(); }

    /* ---------- siste hendelser ---------- */
    async _hentLogg() {
      if (!this._c.hendelser || this._henter) return;
      if (this._loggHentet && Date.now() - this._loggHentet < 60000 && !this._loggUtdatert()) return;
      this._henter = true;
      try {
        const ids = [this._c.entity, ...this._sensorer.map((s) => s.id), this._c.ansikt].filter(Boolean);
        const start = new Date(Date.now() - 24 * 3600e3).toISOString();
        const svar = await this._hass.callWS({ type: "logbook/get_events", start_time: start, entity_ids: ids });
        const tid = (e) => (typeof e.when === "number" ? e.when * 1000 : new Date(e.when).getTime());
        this._logg = (Array.isArray(svar) ? svar : []).filter((e) => e.state !== undefined || e.message)
          .sort((x, y) => tid(y) - tid(x)).slice(0, 80);
        this._loggHentet = Date.now();
        const el = this.shadowRoot.getElementById("logg");
        if (el) el.innerHTML = this._loggHtml();
      } catch (e) {
        this._logg = [];
      } finally {
        this._henter = false;
      }
    }

    _loggUtdatert() {
      const a = this._st(this._c.entity);
      return a && this._sistAlarm !== a.last_changed && (this._sistAlarm = a.last_changed, true);
    }

    /* Ansiktsgjenkjenning: sensoren har navnet på den som sist låste opp som tilstand.
       Hver opplåsing kobles til ansiktshendelsen som kom rett før (innen 2 min), og får
       navnet – «Inngang låst opp · Sebastian med ansikt». En ansiktshendelse uten
       opplåsing i loggen står som egen rad. */
    _ansiktHendelser() {
      if (!this._c.ansikt || !this._logg) return [];
      return this._logg.filter((e) => e.entity_id === this._c.ansikt && e.state && !["unknown", "unavailable", ""].includes(e.state))
        .map((e) => ({ hvem: e.state, t: typeof e.when === "number" ? e.when * 1000 : new Date(e.when).getTime() }));
    }

    _ansiktFor(t) {
      return this._ansiktHendelser().find((a) => t - a.t >= -30000 && t - a.t <= 120000) || null;
    }

    /* Hvem låste opp nå? Brukes på låsen i rom-lista og i «krever oppmerksomhet». */
    _ansiktNaa(lasId) {
      const las = this._st(lasId), a = this._st(this._c.ansikt);
      if (!las || !a || ["unknown", "unavailable", ""].includes(a.state)) return null;
      if (!["unlocked", "open"].includes(las.state)) return null;
      const tAns = new Date((a.attributes && a.attributes.bekreftet_tid) || a.last_changed).getTime();
      const tLas = new Date(las.last_changed).getTime();
      return Math.abs(tLas - tAns) <= 120000 ? a.state : null;
    }

    _loggHtml() {
      if (this._logg === null) return `<div class="tomt">Henter …</div>`;
      const rader = [];
      const brukteAnsikt = new Set();
      for (const e of this._logg) {
        const tMs = typeof e.when === "number" ? e.when * 1000 : new Date(e.when).getTime();
        if (e.entity_id === this._c.ansikt) {
          if (!e.state || ["unknown", "unavailable", ""].includes(e.state) || brukteAnsikt.has(tMs)) continue;
          // står det en opplåsing rett etter, er navnet allerede på den raden
          const las = this._logg.find((x) => x.entity_id && x.entity_id.startsWith("lock.") && ["unlocked", "open"].includes(x.state)
            && (() => { const tx = typeof x.when === "number" ? x.when * 1000 : new Date(x.when).getTime(); return tx - tMs >= -30000 && tx - tMs <= 120000; })());
          if (las) continue;
          if (rader.length >= this._c.hendelser) break;
          const tid = new Date(tMs);
          rader.push(`<div class="hend"><div class="spor"><i style="background:var(--green, #6fcf8e)"></i><u></u></div>
            <div class="htekst"><div><b>${esc(e.state)} ble gjenkjent</b><span>Ansiktsgjenkjenning</span></div>
            <time>${tid.toDateString() === new Date().toDateString() ? kl(tid) : tid.toLocaleDateString("nb-NO", { weekday: "short" }) + " " + kl(tid)}</time></div></div>`);
          continue;
        }
        if (rader.length >= this._c.hendelser) break;
        const s = this._sensorer.find((x) => x.id === e.entity_id);
        let tekst, hvem, farge;
        if (e.entity_id === this._c.entity) {
          if (["arming", "pending"].includes(e.state)) continue;
          const m = MODUS.find((x) => x.k === e.state);
          tekst = e.state === "triggered" ? "Alarmen ble utløst" : e.state === "disarmed" ? "Alarm slått av" : m ? `Alarm satt til ${m.navn}` : `Alarm: ${e.state}`;
          hvem = e.context_user_id ? this._bruker(e.context_user_id) : (e.context_entity_id ? this._navn(e.context_entity_id) : "Alarmsystemet");
          farge = e.state === "triggered" ? "var(--red, #e5646a)" : "var(--gray1000, #f2f1ee)";
        } else if (s) {
          const pa = s.type === "las" ? ["unlocked", "open"].includes(e.state) : e.state === "on";
          if (!pa && s.type !== "las") continue;          // «lukket» og «ingen bevegelse» er støy
          tekst = s.type === "las" ? `${s.rom} ${pa ? "låst opp" : "låst"}`
            : s.type === "bevegelse" || s.type === "tilstede" ? `Bevegelse i ${s.rom.toLowerCase()}`
            : `${s.rom} ${s.type === "vindu" ? "vindu åpnet" : "åpnet"}`;
          hvem = e.context_user_id ? this._bruker(e.context_user_id) : { dor: "Dørsensor", vindu: "Vindussensor", las: "Dørlås", bevegelse: "Bevegelsessensor", tilstede: "Tilstedeværelse" }[s.type];
          if (s.type === "las" && pa) {
            const t = typeof e.when === "number" ? e.when * 1000 : new Date(e.when).getTime();
            const ans = this._ansiktFor(t);
            if (ans) { hvem = `${ans.hvem} · ansiktsgjenkjenning`; brukteAnsikt.add(ans.t); }
          }
          farge = s.type === "las" ? (pa ? OBS : "var(--green, #6fcf8e)") : s.type === "bevegelse" || s.type === "tilstede" ? BEV : OBS;
        } else continue;
        const tid = new Date(typeof e.when === "number" ? e.when * 1000 : e.when);
        const idag = tid.toDateString() === new Date().toDateString();
        rader.push(`<div class="hend"><div class="spor"><i style="background:${farge}"></i><u></u></div>
          <div class="htekst"><div><b>${esc(tekst)}</b><span>${esc(hvem || "")}</span></div>
          <time>${idag ? kl(tid) : tid.toLocaleDateString("nb-NO", { weekday: "short" }) + " " + kl(tid)}</time></div></div>`);
      }
      return rader.join("") || `<div class="tomt">Ingenting det siste døgnet.</div>`;
    }

    _navn(id) { const s = this._st(id); return (s && s.attributes.friendly_name) || id; }
    _bruker(uid) {
      if (this._hass.user && this._hass.user.id === uid) return "Deg";
      const p = Object.values(this._hass.states).find((s) => s.entity_id.startsWith("person.") && s.attributes.user_id === uid);
      return p ? p.attributes.friendly_name : "Bruker";
    }
  }

  if (!customElements.get("ki-sikkerhetspanel-card")) customElements.define("ki-sikkerhetspanel-card", KiSikkerhetspanelCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-sikkerhetspanel-card"))
    window.customCards.push({ type: "ki-sikkerhetspanel-card", name: "KI Sikkerhetspanel",
      description: "Sikkerhetspopupen: ring med alle sensorene, modus med hold-for-å-bytte, det som krever deg, rommene og siste hendelser.", preview: false });
  console.info(`%c KI-SIKKERHETSPANEL %c ${VERSJON} `, "color:#fff;background:#463a40", "color:#463a40;background:#efc6c9");
})();

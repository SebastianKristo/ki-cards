/*
 * ki-entur-card — kollektivtavla. Avgangene fra Entur-sensorene (entur_public_transport),
 * samlet i tavler: «Til byen», «Hjem», «Fra Holbergs plass» … Hver tavle kan hente fra flere
 * holdeplasser og plattformer, og blande buss, T-bane og trikk.
 *
 * Øverst på hver tavle står neste avgang stort – minutter igjen, klokkeslett, i rute eller
 * forsinket, og når du må gå. Under står de neste i en liste, hver med linjemerket i
 * Ruter-fargen for sitt transportmiddel: T-bane oransje, trikk blå, buss rød, regionbuss grønn,
 * flybuss grå. Minuttene telles ned i kortet selv, mellom sensoroppdateringene.
 *
 * type: custom:ki-entur-card
 * tittel: Kollektiv
 * tavler:                          # (retninger: fungerer også, som før)
 *   - navn: Til byen
 *     fra: Amagerveien · Hovseter
 *     gange: 4                     # minutter å gå → «Gå om … / Gå nå! / Rekker ikke»
 *     antall: 4                    # rader under den store (standard 4)
 *     sensorer:
 *       - sensor.transport_amagerveien_platform_11676        # alt fra plattformen
 *       - { entity: sensor.transport_majorstuen_platform_j, mot: Voksen skog }   # bare mot …
 *       - { entity: sensor.transport_hovseter_platform_1, linje: "2", gange: 9 } # egen gangtid
 * maks_min: 90                     # avganger lenger fram enn dette vises ikke
 */
(() => {
  const VERSJON = "2.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Ruters farger per transportmiddel. */
  const MIDDEL = {
    tbane: { farge: "#ec700c", ikon: "mdi:subway-variant", navn: "T-bane" },
    trikk: { farge: "#0b91ef", ikon: "mdi:tram", navn: "Trikk" },
    buss: { farge: "#e60000", ikon: "mdi:bus", navn: "Buss" },
    region: { farge: "#75a300", ikon: "mdi:bus", navn: "Regionbuss" },
    fly: { farge: "#6b6b75", ikon: "mdi:airplane", navn: "Flybuss" },
    natt: { farge: "#3b3b8f", ikon: "mdi:weather-night", navn: "Nattbuss" },
  };

  /* Hva slags linje: ut fra linjenummeret, med sensorens ikon som reserve. */
  function middelFor(linje, ikon) {
    const l = String(linje || "").toUpperCase();
    if (/^FB/.test(l)) return "fly";
    if (/N$/.test(l)) return "natt";
    const n = parseInt(l, 10);
    if (!isNaN(n) && String(n) === l) {
      if (n >= 1 && n <= 5) return "tbane";
      if (n >= 11 && n <= 19) return "trikk";
      if (n >= 100) return "region";
      return "buss";
    }
    if (/subway|metro/.test(ikon || "")) return "tbane";
    if (/tram/.test(ikon || "")) return "trikk";
    return "buss";
  }

  /* «14:27» → tidspunkt i dag (eller i morgen, om klokka er passert med mer enn to timer). */
  function tidFra(hhmm) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
    if (!m) return null;
    const d = new Date(); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    if (d.getTime() < Date.now() - 2 * 3600e3) d.setDate(d.getDate() + 1);
    return d;
  }
  const minTil = (t) => Math.max(0, Math.ceil((t.getTime() - Date.now()) / 60000 - 0.05));

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .ek { background: var(--gray200, #1b1b1d); border-radius: 24px; padding: 16px; display: grid; gap: 12px; color: var(--gray1000, #f2f1ee); }
    .hode { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 12px; align-items: center; }
    .ik { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(250,251,252,.1);
      border: 1px solid rgba(250,251,252,.1); }
    .ik ha-icon { --mdc-icon-size: 24px; }
    .navn { font-size: 14px; font-weight: 500; opacity: .7; }
    .status { font-size: 16px; font-weight: 300; }
    .tavler { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
    .tavle { background: var(--gray100, #232326); border-radius: 20px; padding: 14px; display: grid; gap: 10px; align-content: start; min-width: 0; }
    .thode { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .tnavn { font-size: 15px; font-weight: 500; }
    .tfra { font-size: 12px; opacity: .6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .merke { flex: none; min-width: 34px; height: 26px; padding: 0 7px 0 5px; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center; gap: 3px; }
    .merke ha-icon { --mdc-icon-size: 14px; }
    .stor { display: grid; gap: 8px; text-align: left; }
    .stor .linje { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .stor .mal { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .neste { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .neste b { font-size: 34px; font-weight: 300; letter-spacing: -1px; line-height: 1; font-variant-numeric: tabular-nums; }
    .neste b small { font-size: 15px; font-weight: 500; opacity: .7; margin-left: 2px; letter-spacing: 0; }
    .neste span { font-size: 13px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; }
    .brikker { display: flex; flex-wrap: wrap; gap: 6px; }
    .bk { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px; border-radius: 12px; font-size: 12px; font-weight: 500;
      background: rgba(255,255,255,.06); }
    .bk i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .bk.ok { color: var(--green, #6fcf8e); }
    .bk.sen { color: var(--orange, #f2a33c); }
    .bk.plan { color: var(--gray800, #8e8d89); }
    .bk.ga { color: var(--gray1000, #f2f1ee); background: color-mix(in srgb, var(--blue, #6f9fe0) 22%, transparent); }
    .bk.naa { color: #161618; background: var(--orange, #f2a33c); animation: ek-puls 1.2s ease-in-out infinite; }
    .bk.rekker { opacity: .6; }
    @keyframes ek-puls { 50% { filter: brightness(1.2); transform: scale(1.04); } }
    .liste { display: grid; gap: 2px; border-top: 1px solid rgba(255,255,255,.06); padding-top: 8px; }
    .rad { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 4px 0; text-align: left; }
    .rad .merke { height: 22px; min-width: 30px; font-size: 12px; border-radius: 7px; }
    .rad .rm { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rad .rt { font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
    .rad .rt small { opacity: .6; margin-left: 4px; }
    .rad .rt.sen { color: var(--orange, #f2a33c); }
    .rad.rekker { opacity: .45; }
    .tom { font-size: 13px; opacity: .6; }
    @media (prefers-reduced-motion: reduce) { .bk.naa { animation: none; } }
  `;

  class KiEnturCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; }
    static getStubConfig() { return { tavler: [] }; }
    getCardSize() { return 6; }

    setConfig(c) {
      this._c = { tittel: "Kollektiv", maks_min: 90, ...c };
      this._sig = "";
      if (this._hass) this._tegn();
    }

    _tavler() { return this._c.tavler || this._c.retninger || []; }

    /* Sensorene i en tavle, som { id, mot, linje, gange } – en ren id arver tavlas filter. */
    _kilder(t) {
      return [].concat(t.sensorer || t.sensor || []).filter(Boolean).map((x) => (typeof x === "string"
        ? { id: x, mot: t.mot, linje: t.linje, gange: t.gange }
        : { id: x.entity || x.sensor, mot: x.mot ?? t.mot, linje: x.linje ?? t.linje, gange: x.gange ?? t.gange }));
    }

    set hass(h) {
      this._hass = h;
      const ids = this._tavler().flatMap((t) => this._kilder(t).map((k) => k.id));
      const sig = ids.map((id) => { const s = h.states[id]; return s ? `${s.attributes.due_at}|${s.attributes.next_due_at}|${s.attributes.delay}|${s.attributes.next_delay}` : "-"; }).join(",");
      if (sig === this._sig) return;
      this._sig = sig;
      this._tegn();
    }

    connectedCallback() { clearInterval(this._ur); this._ur = setInterval(() => this._tegn(), 20000); }
    disconnectedCallback() { clearInterval(this._ur); }

    /* Alle avgangene for en tavle: to per sensor, filtrert, uten dubletter, sortert. */
    _avganger(t) {
      const ut = [], sett = new Set();
      const maks = Number(this._c.maks_min) || 90;
      for (const k of this._kilder(t)) {
        const s = this._hass.states[k.id];
        if (!s) continue;
        const a = s.attributes;
        const mot = k.mot ? new RegExp(k.mot, "i") : null;
        const linjer = k.linje != null ? [].concat(k.linje).map(String) : null;
        for (const [rute, kl, sanntid, forsinkelse] of [[a.route, a.due_at, a.real_time, a.delay], [a.next_route, a.next_due_at, a.next_real_time, a.next_delay]]) {
          if (!rute || !kl) continue;
          const linje = (String(rute).match(/^\S+/) || [""])[0];
          const mal = String(rute).replace(/^\S+\s*/, "");
          if (!mal || mal === "-") continue;
          if (mot && !mot.test(mal)) continue;
          if (linjer && !linjer.includes(linje)) continue;
          const tid = tidFra(kl);
          if (!tid) continue;
          const min = minTil(tid);
          if (tid.getTime() < Date.now() - 60000 || min > maks) continue;
          const nokkel = `${linje}|${mal}|${kl}`;
          if (sett.has(nokkel)) continue;
          sett.add(nokkel);
          ut.push({ id: k.id, linje, mal, kl, t: tid, min, sanntid: !!sanntid, forsinkelse: Number(forsinkelse) || 0,
            middel: middelFor(linje, a.icon), gange: Number(k.gange) || 0 });
        }
      }
      return ut.sort((x, y) => x.t - y.t);
    }

    _merke(x, stor) {
      const m = MIDDEL[x.middel] || MIDDEL.buss;
      return `<span class="merke" style="background:${m.farge}" title="${m.navn}">${stor ? `<ha-icon icon="${m.ikon}"></ha-icon>` : ""}${esc(x.linje)}</span>`;
    }

    _tegn() {
      if (!this._hass || !this._c) return;
      const tavler = this._tavler();
      let totalt = 0;
      const blokker = tavler.map((t, i) => {
        const liste = this._avganger(t);
        // neste du faktisk rekker, når gangtid er satt; ellers den første
        const rekkes = (x) => !x.gange || x.min >= x.gange;
        const forste = liste.find(rekkes) || liste[0];
        totalt += liste.filter((x) => x.min <= 30).length;
        const hode = `<div class="thode"><span class="tnavn">${esc(t.navn || `Tavle ${i + 1}`)}</span>${t.fra ? `<span class="tfra">${esc(t.fra)}</span>` : ""}</div>`;
        if (!forste) {
          const mangler = this._kilder(t).filter((k) => !this._hass.states[k.id]).map((k) => k.id);
          return `<div class="tavle">${hode}<div class="tom">${mangler.length ? `Fant ikke ${esc(mangler.join(", "))}` : "Ingen avganger nå"}</div></div>`;
        }
        const status = !forste.sanntid ? `<span class="bk plan"><i></i>rutetid</span>`
          : forste.forsinkelse >= 2 ? `<span class="bk sen"><i></i>${forste.forsinkelse} min forsinket</span>`
          : `<span class="bk ok"><i></i>i rute</span>`;
        let ga = "";
        if (forste.gange > 0) {
          const igjen = forste.min - forste.gange;
          ga = igjen < 0 ? `<span class="bk rekker">Rekker ikke</span>` : igjen <= 1 ? `<span class="bk naa">Gå nå!</span>` : `<span class="bk ga">Gå om ${igjen} min</span>`;
        }
        const rader = liste.filter((x) => x !== forste).slice(0, Number(t.antall ?? this._c.antall ?? 4)).map((x) => `
          <button class="rad ${rekkes(x) ? "" : "rekker"}" data-mer="${esc(x.id)}">${this._merke(x)}
            <span class="rm">${esc(x.mal)}</span>
            <span class="rt ${x.sanntid && x.forsinkelse >= 2 ? "sen" : ""}">${x.min === 0 ? "nå" : `${x.min} min`}<small>${esc(x.kl)}</small></span>
          </button>`).join("");
        return `<div class="tavle">${hode}
          <button class="stor" data-mer="${esc(forste.id)}">
            <div class="linje">${this._merke(forste, true)}<span class="mal">${esc(forste.mal)}</span></div>
            <div class="neste"><b>${forste.min === 0 ? "nå" : `${forste.min}<small>min</small>`}</b><span>${esc(forste.kl)}</span></div>
            <div class="brikker">${status}${ga}</div>
          </button>
          ${rader ? `<div class="liste">${rader}</div>` : ""}
        </div>`;
      }).join("");
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="ek">
          <div class="hode"><span class="ik"><ha-icon icon="mdi:bus-clock"></ha-icon></span>
            <div><div class="navn">${esc(this._c.tittel)}</div><div class="status">${totalt ? `${totalt} avganger neste halvtime` : "Sanntid fra Entur"}</div></div></div>
          <div class="tavler">${blokker || `<div class="tom">Legg til tavler under tavler:</div>`}</div>
        </div>`;
      this.shadowRoot.querySelectorAll("[data-mer]").forEach((b) => { b.onclick = () => {
        try { window.dispatchEvent(new CustomEvent("haptic", { detail: "light", bubbles: true, composed: true })); } catch (e) { /* eldre */ }
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: b.dataset.mer };
        this.dispatchEvent(ev);
      }; });
    }
  }

  if (!customElements.get("ki-entur-card")) customElements.define("ki-entur-card", KiEnturCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-entur-card"))
    window.customCards.push({ type: "ki-entur-card", name: "KI Entur",
      description: "Kollektivtavla fra Entur: buss, T-bane og trikk i tavler, med neste avgang, forsinkelse og når du må gå.", preview: false });
  console.info(`%c KI-ENTUR %c ${VERSJON} `, "color:#fff;background:#e60000", "color:#e60000;background:#fff");
})();

/*
 * ki-entur-card — bussen, begge veier. Avgangene fra Entur-sensorene (entur_public_transport),
 * delt i retninger: «Til Majorstuen» fra Amagerveien, «Til Amagerveien» fra Majorstuen.
 *
 * Hver retning viser neste avgang stort – minutter igjen, klokkeslett, om den er i rute eller
 * forsinket – og de neste etter. Med gangtid sier kortet når du må gå: «Gå om 3 min»,
 * «Gå nå!» eller «Rekker ikke». Minuttene telles ned i kortet selv, mellom sensoroppdateringene.
 *
 * type: custom:ki-entur-card
 * tittel: Buss
 * retninger:
 *   - navn: Til Majorstuen
 *     fra: Amagerveien
 *     sensorer: [sensor.transport_amagerveien_platform_11676]
 *     mot: Majorstuen            # bare avganger med dette i ruta (tekst eller regex)
 *     gange: 4                   # minutter å gå til holdeplassen
 *   - navn: Til Amagerveien
 *     fra: Majorstuen
 *     sensorer: [sensor.transport_majorstuen_platform_xxxx]
 *     mot: Voksen skog
 */
(() => {
  const VERSJON = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const RUTER = "#e60000";

  /* «14:27» → tidspunkt i dag (eller i morgen, om klokka er passert med mer enn to timer). */
  function tidFra(hhmm) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
    if (!m) return null;
    const d = new Date(); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    if (d.getTime() < Date.now() - 2 * 3600e3) d.setDate(d.getDate() + 1);
    return d;
  }

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .ek { background: var(--gray200, #1b1b1d); border-radius: 24px; padding: 16px; display: grid; gap: 12px; color: var(--gray1000, #f2f1ee); }
    .hode { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 12px; align-items: center; }
    .ik { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: ${RUTER}; color: #fff; }
    .ik ha-icon { --mdc-icon-size: 24px; }
    .navn { font-size: 14px; font-weight: 500; opacity: .7; }
    .status { font-size: 16px; font-weight: 300; }
    .retninger { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .ret { background: var(--gray100, #232326); border-radius: 20px; padding: 14px; display: grid; gap: 8px; text-align: left; min-width: 0;
      transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .ret:active { transform: scale(.98); }
    .rhode { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .linje { flex: none; min-width: 30px; height: 24px; padding: 0 7px; border-radius: 7px; background: ${RUTER}; color: #fff;
      font-size: 13px; font-weight: 600; display: grid; place-items: center; }
    .rnavn { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rfra { font-size: 12px; opacity: .6; margin-top: -4px; }
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
    .deretter { font-size: 12.5px; opacity: .65; font-variant-numeric: tabular-nums; }
    .tom { font-size: 13px; opacity: .6; }
    @media (prefers-reduced-motion: reduce) { .bk.naa { animation: none; } }
  `;

  class KiEnturCard extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; }
    static getStubConfig() { return { retninger: [] }; }
    getCardSize() { return 4; }

    setConfig(c) {
      this._c = { tittel: "Buss", ...c };
      this._sig = "";
      if (this._hass) this._tegn();
    }

    set hass(h) {
      this._hass = h;
      const ids = (this._c.retninger || []).flatMap((r) => [].concat(r.sensorer || r.sensor || []));
      const sig = ids.map((id) => { const s = h.states[id]; return s ? `${s.state}|${s.attributes.due_at}|${s.attributes.next_due_at}|${s.attributes.delay}` : "-"; }).join(",");
      if (sig === this._sig) return;
      this._sig = sig;
      this._tegn();
    }

    connectedCallback() {
      clearInterval(this._ur);
      // minuttene telles ned mellom oppdateringene fra sensoren
      this._ur = setInterval(() => this._tegn(), 20000);
    }
    disconnectedCallback() { clearInterval(this._ur); }

    /* Alle avgangene for en retning: to per sensor (route/due_at og next_route/next_due_at),
       filtrert på retningen, uten dubletter, sortert. */
    _avganger(r) {
      const mot = r.mot ? new RegExp(r.mot, "i") : null;
      const ut = [], sett = new Set();
      for (const id of [].concat(r.sensorer || r.sensor || [])) {
        const s = this._hass.states[id];
        if (!s) continue;
        const a = s.attributes;
        for (const [rute, kl, sanntid, forsinkelse] of [[a.route, a.due_at, a.real_time, a.delay], [a.next_route, a.next_due_at, a.next_real_time, a.next_delay]]) {
          if (!rute || !kl) continue;
          if (mot && !mot.test(rute)) continue;
          const t = tidFra(kl);
          if (!t) continue;
          const nokkel = `${rute}|${kl}`;
          if (sett.has(nokkel)) continue;
          sett.add(nokkel);
          const linje = (String(rute).match(/^\S+/) || [""])[0];
          ut.push({ id, rute, linje, mal: String(rute).replace(/^\S+\s*/, ""), kl, t, sanntid: !!sanntid, forsinkelse: Number(forsinkelse) || 0 });
        }
      }
      return ut.filter((x) => x.t.getTime() > Date.now() - 60000).sort((x, y) => x.t - y.t);
    }

    _tegn() {
      if (!this._hass || !this._c) return;
      const retninger = this._c.retninger || [];
      const blokker = retninger.map((r, i) => {
        const liste = this._avganger(r);
        const forste = liste[0];
        const forsteId = [].concat(r.sensorer || r.sensor || [])[0] || "";
        if (!forste) {
          const mangler = [].concat(r.sensorer || r.sensor || []).filter((id) => !this._hass.states[id]);
          return `<button class="ret" data-mer="${esc(forsteId)}"><div class="rhode"><span class="rnavn">${esc(r.navn || `Retning ${i + 1}`)}</span></div>
            ${r.fra ? `<div class="rfra">fra ${esc(r.fra)}</div>` : ""}
            <div class="tom">${mangler.length ? `Fant ikke ${esc(mangler.join(", "))}` : "Ingen avganger nå"}</div></button>`;
        }
        const min = Math.max(0, Math.ceil((forste.t.getTime() - Date.now()) / 60000 - 0.05));
        const status = !forste.sanntid ? `<span class="bk plan"><i></i>rutetid</span>`
          : forste.forsinkelse >= 2 ? `<span class="bk sen"><i></i>${forste.forsinkelse} min forsinket</span>`
          : `<span class="bk ok"><i></i>i rute</span>`;
        let ga = "";
        const gange = Number(r.gange);
        if (gange > 0) {
          const igjen = min - gange;
          ga = igjen < 0 ? `<span class="bk rekker">Rekker ikke</span>`
            : igjen <= 1 ? `<span class="bk naa">Gå nå!</span>`
            : `<span class="bk ga">Gå om ${igjen} min</span>`;
        }
        const deretter = liste.slice(1, 3).map((x) => {
          const m = Math.max(0, Math.ceil((x.t.getTime() - Date.now()) / 60000 - 0.05));
          return `${x.kl} (${m} min)`;
        });
        return `<button class="ret" data-mer="${esc(forste.id)}">
          <div class="rhode"><span class="linje">${esc(forste.linje)}</span><span class="rnavn">${esc(r.navn || forste.mal)}</span></div>
          ${r.fra ? `<div class="rfra">fra ${esc(r.fra)}</div>` : ""}
          <div class="neste"><b>${min === 0 ? "nå" : `${min}<small>min</small>`}</b><span>${esc(forste.kl)}</span></div>
          <div class="brikker">${status}${ga}</div>
          ${deretter.length ? `<div class="deretter">Så ${esc(deretter.join(" · "))}</div>` : ""}
        </button>`;
      }).join("");
      const linjer = [...new Set(retninger.flatMap((r) => this._avganger(r).map((x) => x.linje)))];
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="ek">
          <div class="hode"><span class="ik"><ha-icon icon="mdi:bus"></ha-icon></span>
            <div><div class="navn">${esc(this._c.tittel)}</div><div class="status">${linjer.length ? `Linje ${esc(linjer.join(", "))} · sanntid fra Entur` : "Entur"}</div></div></div>
          <div class="retninger">${blokker || `<div class="tom">Legg til retninger: under retninger:</div>`}</div>
        </div>`;
      this.shadowRoot.querySelectorAll("[data-mer]").forEach((b) => { b.onclick = () => {
        if (!b.dataset.mer) return;
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
      description: "Bussen begge veier fra Entur: neste avgang, forsinkelse, og når du må gå.", preview: false });
  console.info(`%c KI-ENTUR %c ${VERSJON} `, "color:#fff;background:#e60000", "color:#e60000;background:#fff");
})();

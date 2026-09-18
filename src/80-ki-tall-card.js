/* ki-tall-card – tett rutenett av tall.
 *
 * Problemet med enhetskortene var at ett kort tar en halv skjerm for å vise tre tall.
 * Her får tolv tall plass i samme høyde: liten etikett, verdien, og en stolpe når det
 * finnes en skala.
 *
 * type: custom:ki-tall-card
 * tittel: Ytelse
 * kolonner: 4
 * tall:
 *   - { navn: CPU, entity: sensor.x_cpu, enhet: ' %', maks: 100, gul: 70, rod: 88 }
 *   - { navn: RAM, entity: sensor.x_ram, enhet: ' %', maks: 100 }
 *   - { navn: Oppetid, entity: sensor.x_uptime, tid: true }
 *   - { navn: Versjon, entity: sensor.x_version }
 */
const KI_TALL_VERSJON = "1.0.0";

const KI_TALL_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:6px; color:var(--gray1000); }
  .tittel { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
    padding:2px 6px 2px; }
  .tittel .t { font-size:14px; font-weight:600; }
  .tittel .s { font-size:12px; opacity:.5; }

  .rutenett { display:grid; gap:6px;
    grid-template-columns:repeat(var(--kol,4),minmax(0,1fr)); }
  /* Flisene het .t, det samme som tittelteksten, og da fikk tittelen flisenes
     bakgrunn og padding. Egen klasse nå. Merk: ingen backticks i denne CSS-en,
     den er en template-streng. */
  .flis { background:var(--gray200); border-radius:16px; padding:9px 10px; cursor:pointer;
    min-width:0; display:grid; gap:3px; align-content:start;
    transition:transform .12s var(--myk); }
  .flis:active { transform:scale(.97); }
  .flis .n { font-size:10.5px; opacity:.55; text-transform:uppercase; letter-spacing:.04em;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .flis .v { font-size:17px; font-weight:600; letter-spacing:-.02em; line-height:1.15;
    font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .flis .v small { font-size:11px; font-weight:500; opacity:.55; margin-left:2px; }
  /* Stolpen er tynn med vilje: den skal antyde nivå, ikke konkurrere med tallet. */
  .flis .spor { height:3px; border-radius:99px; margin-top:1px;
    background:color-mix(in srgb, var(--gray1000) 14%, transparent); overflow:hidden; }
  .flis .spor i { display:block; height:100%; border-radius:99px;
    background:var(--blue,#4aa3e0); transition:width .7s var(--myk); }
  .flis .spor i.gul { background:var(--orange,#f0a952); }
  .flis .spor i.rod { background:var(--red,#e5706b); }
  .flis.rod { background:color-mix(in srgb, var(--red,#e5706b) 26%, var(--gray200)); }
  .flis.gul { background:color-mix(in srgb, var(--orange,#f0a952) 24%, var(--gray200)); }
  .flis.borte { opacity:.45; }

  .tom { font-size:13px; opacity:.6; padding:12px 14px; background:var(--gray200);
    border-radius:16px; line-height:1.5; }
  @media (max-width:420px) { .rutenett { grid-template-columns:repeat(var(--kolsmal,3),minmax(0,1fr)); } }
  @media (prefers-reduced-motion: reduce) { .t, .flis .spor i { transition:none; } }
`;

const kiTaEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Sekunder eller et tidsstempel til noe lesbart. UniFi og Proxmox oppgir oppetid som
   tidsstempel, andre som sekunder — «2026-09-12T22:29:29» er ikke et tall man leser. */
const kiTaTid = (st) => {
  const raa = String(st.state).trim();
  let sek = null;
  if (/^-?\d+(\.\d+)?$/.test(raa) && (st.attributes || {}).device_class !== "timestamp") {
    const e = (st.attributes || {}).unit_of_measurement || "";
    const n = parseFloat(raa);
    sek = /min/i.test(e) ? n * 60 : /^h|time/i.test(e) ? n * 3600
      : /dag|day/i.test(e) ? n * 86400 : n;
  } else {
    const d = new Date(raa);
    if (!isNaN(d)) sek = (Date.now() - d.getTime()) / 1000;
  }
  if (sek === null || sek < 0) return null;
  const dg = Math.floor(sek / 86400);
  const t = Math.floor((sek % 86400) / 3600);
  if (dg >= 1) return { tall: String(dg), enhet: dg === 1 ? "døgn" : "døgn" };
  if (t >= 1) return { tall: String(t), enhet: "timer" };
  return { tall: String(Math.max(1, Math.floor(sek / 60))), enhet: "min" };
};

class KiTallCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { tall: [] }; }
  getCardSize() { return 4; }

  setConfig(c) {
    if (!c || !Array.isArray(c.tall) || !c.tall.length) {
      throw new Error("ki-tall-card: 'tall' må være en liste med minst ett tall");
    }
    this._c = { kolonner: 4, kolonner_smal: 3, tittel: "", ...c };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._c.tall.map((t) => (h.states[t.entity] || {}).state));
    if (sig !== this._sig) { this._sig = sig; this._tegn(); }
    else if (!g) this._tegn();
  }

  _verdi(t) {
    const st = this._h && this._h.states[t.entity];
    if (!st || ["unknown", "unavailable", ""].includes(st.state)) {
      return { tall: "–", enhet: "", borte: true };
    }
    if (t.tid) {
      const r = kiTaTid(st);
      if (r) return r;
    }
    /* Hele strengen må være et tall. `parseFloat` godtar alt som begynner med et —
       «6.12.4-pve» ble ellers vist som 6,1. */
    const rent = /^-?\d+([.,]\d+)?$/.test(st.state.trim());
    if (!rent) {
      const s = st.state;
      return { tall: s.length > 14 ? s.slice(0, 13) + "…" : s, enhet: "" };
    }
    const v = parseFloat(String(st.state).replace(",", "."));
    const d = t.desimaler !== undefined ? Number(t.desimaler)
      : Number.isInteger(v) ? 0 : (Math.abs(v) < 10 ? 1 : 0);
    return {
      tall: v.toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }),
      enhet: (t.enhet || "").trim(),
      raa: v,
    };
  }

  _tegn() {
    const c = this._c;
    const rader = c.tall.map((t) => ({ ...t, ...this._verdi(t) }));
    const borte = rader.filter((r) => r.borte).length;

    this.shadowRoot.innerHTML = `<style>${KI_TALL_STIL}</style>
      <div class="kort">
        ${c.tittel ? `<div class="tittel">
          <span class="t">${kiTaEsc(c.tittel)}</span>
          ${borte ? `<span class="s">${borte} uten svar</span>` : ""}
        </div>` : ""}
        <div class="rutenett" style="--kol:${Math.max(1, Math.min(6, Number(c.kolonner) || 4))};--kolsmal:${
          Math.max(1, Math.min(4, Number(c.kolonner_smal) || 3))}">
          ${rader.map((r) => {
            const har = r.raa !== undefined && r.maks;
            const pst = har ? Math.max(0, Math.min(100, (r.raa / Number(r.maks)) * 100)) : null;
            const nivaa = r.raa === undefined ? ""
              : r.rod !== undefined && r.raa >= Number(r.rod) ? "rod"
              : r.gul !== undefined && r.raa >= Number(r.gul) ? "gul" : "";
            return `<div class="flis ${r.borte ? "borte" : nivaa}"
                 data-mer="${kiTaEsc(r.entity)}" tabindex="0"
                 title="${kiTaEsc(r.navn || r.entity)}">
              <div class="n">${kiTaEsc(r.navn || "")}</div>
              <div class="v">${kiTaEsc(r.tall)}${r.enhet
                ? `<small>${kiTaEsc(r.enhet)}</small>` : ""}</div>
              ${pst === null ? "" : `<div class="spor">
                <i class="${nivaa}" style="width:${pst.toFixed(1)}%"></i></div>`}
            </div>`;
          }).join("")}
        </div>
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-mer]")) {
      const aapne = () => this.dispatchEvent(new CustomEvent("hass-more-info",
        { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
      el.addEventListener("click", aapne);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aapne(); }
      });
    }
  }
}

customElements.define("ki-tall-card", KiTallCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-tall-card"))
  window.customCards.push({ type: "ki-tall-card", name: "KI Tall",
    description: "Tett rutenett av tall med stolper og terskler", preview: true });

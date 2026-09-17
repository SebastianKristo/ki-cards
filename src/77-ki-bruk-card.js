/* ki-bruk-card – lister med «hvor fullt er det», funnet ut fra et prefiks.
 *
 * Delinger, Proxmox-lagring og diskene var tre lister med nesten like blokker: 13 + 5 + 5
 * oppføringer på rundt 400 linjer, der bare navnet og en del av entitets-id-en skiller
 * dem.
 *
 * Kortet finner oppføringene selv, sorterer dem etter hvor fulle de er, og viser en
 * stolpe per oppføring. Den fulleste først er poenget: det er den du må gjøre noe med.
 *
 * type: custom:ki-bruk-card
 * prefiks: sensor.d_day_darling_share_
 * etterfiks: _usage
 * tittel: Delinger
 * felt:                            # valgfrie tilleggstall under navnet
 *   - { navn: Brukt, etterfiks: _used }
 *   - { navn: Ledig, etterfiks: _free }
 * helse: binary_sensor.d_day_darling_disk_{navn}_health   # valgfri, {navn} byttes ut
 * helse_ok: 'off'                  # tilstanden som betyr «frisk»
 * terskel_gul: 75
 * terskel_rod: 90
 * navn_kort: {aoosar_x_linux: Aoosar X Linux}
 */
const KI_BRUK_VERSJON = "1.0.0";

const KI_BRUK_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:6px; color:var(--gray1000); }
  .tittel { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
    padding:2px 6px 6px; }
  .tittel .t { font-size:15px; font-weight:600; }
  .tittel .s { font-size:12px; opacity:.55; }

  .rad { background:var(--gray200); border-radius:20px; padding:12px 14px;
    display:grid; gap:8px; cursor:pointer; }
  .topp { display:flex; align-items:baseline; gap:10px; }
  .topp .ik { --mdc-icon-size:18px; opacity:.6; align-self:center; }
  .topp .n { flex:1; min-width:0; font-size:14px; font-weight:500;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .topp .v { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums;
    white-space:nowrap; }
  .spor { height:8px; border-radius:99px; overflow:hidden;
    background:color-mix(in srgb, var(--gray1000) 12%, transparent); }
  .spor i { display:block; height:100%; border-radius:99px; background:var(--blue,#4aa3e0);
    transition:width .8s var(--myk); }
  .spor i.gul { background:var(--orange,#f0a952); }
  .spor i.rod { background:var(--red,#e5706b); }
  .felt { display:flex; gap:14px; flex-wrap:wrap; font-size:11.5px; opacity:.55; }
  .felt span b { font-weight:600; opacity:1; }
  .syk { font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:999px;
    background:var(--red,#e5706b); color:var(--black,#1b1b1b); white-space:nowrap; }

  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }
  @media (prefers-reduced-motion: reduce) { .spor i { transition:none; } }
`;

const kiBrEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const kiBrNavn = (n) => String(n).replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

class KiBrukCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { prefiks: "sensor.", etterfiks: "_usage" }; }
  getCardSize() { return 8; }

  setConfig(c) {
    if (!c || !c.prefiks) throw new Error("ki-bruk-card: 'prefiks' må settes");
    this._c = { etterfiks: "_usage", terskel_gul: 75, terskel_rod: 90,
      navn_kort: {}, felt: [], helse_ok: "off", ...c };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._rader().map((r) => [r.nokkel, r.verdi, r.syk]));
    if (sig !== this._sig) { this._sig = sig; this._tegn(); }
    else if (!g) this._tegn();
  }

  _rader() {
    if (!this._h) return [];
    const c = this._c;
    const ut = [];
    for (const id of Object.keys(this._h.states)) {
      if (!id.startsWith(c.prefiks) || !id.endsWith(c.etterfiks)) continue;
      const nokkel = id.slice(c.prefiks.length, id.length - c.etterfiks.length);
      if (!nokkel) continue;
      const st = this._h.states[id];
      const v = parseFloat(st.state);
      // Helsen ligger i en egen entitet hos Unraid, med nøkkelen midt i navnet
      let syk = false, harHelse = false;
      if (c.helse) {
        const hid = c.helse.replace("{navn}", nokkel);
        const hst = this._h.states[hid];
        if (hst && !["unknown", "unavailable"].includes(hst.state)) {
          harHelse = true;
          syk = hst.state !== String(c.helse_ok);
        }
      }
      ut.push({
        id, nokkel,
        navn: c.navn_kort[nokkel] || kiBrNavn(nokkel),
        verdi: isNaN(v) ? null : v,
        tekst: isNaN(v) ? st.state : null,
        felt: (c.felt || []).map((f) => {
          const fst = this._h.states[`${c.prefiks}${nokkel}${f.etterfiks}`];
          return fst && !["unknown", "unavailable"].includes(fst.state)
            ? { navn: f.navn, verdi: fst.state } : null;
        }).filter(Boolean),
        syk, harHelse,
      });
    }
    // Fulleste først. Syke oppføringer helt øverst — de haster mer enn en full disk.
    return ut.sort((a, b) => (b.syk - a.syk) || ((b.verdi ?? -1) - (a.verdi ?? -1)));
  }

  _tegn() {
    const c = this._c;
    const rader = this._rader();
    if (!rader.length) {
      this.shadowRoot.innerHTML = `<style>${KI_BRUK_STIL}</style>
        <div class="kort"><div class="tom">
          Finner ingen sensorer som starter med <code>${kiBrEsc(c.prefiks)}</code>
          og slutter på <code>${kiBrEsc(c.etterfiks)}</code>.
        </div></div>`;
      return;
    }
    /* Maksverdien, ikke første rad: sorteringen setter syke oppføringer først, så
       «fulleste» ble disken med feil i stedet for den som faktisk er full. */
    const tall = rader.map((r) => r.verdi).filter((v) => v !== null);
    const fulleste = tall.length ? Math.max(...tall) : null;
    const syke = rader.filter((r) => r.syk).length;

    this.shadowRoot.innerHTML = `<style>${KI_BRUK_STIL}</style>
      <div class="kort">
        ${c.tittel ? `<div class="tittel">
          <span class="t">${kiBrEsc(c.tittel)}</span>
          <span class="s">${rader.length} stk${
            fulleste !== null ? ` · fulleste ${Math.round(fulleste)} %` : ""}${
            syke ? ` · ${syke} med feil` : ""}</span>
        </div>` : ""}
        ${rader.map((r) => {
          const kl = r.verdi === null ? "" : r.verdi >= c.terskel_rod ? "rod"
            : r.verdi >= c.terskel_gul ? "gul" : "";
          return `<div class="rad" data-mer="${kiBrEsc(r.id)}" tabindex="0">
            <div class="topp">
              <ha-icon class="ik" icon="${kiBrEsc(c.ikon || "mdi:folder-outline")}"></ha-icon>
              <span class="n">${kiBrEsc(r.navn)}</span>
              ${r.syk ? `<span class="syk">Feil</span>` : ""}
              <span class="v">${r.verdi === null ? kiBrEsc(r.tekst)
                : `${Math.round(r.verdi)} %`}</span>
            </div>
            ${r.verdi === null ? "" : `<div class="spor">
              <i class="${kl}" style="width:${Math.max(0, Math.min(100, r.verdi)).toFixed(1)}%"></i>
            </div>`}
            ${r.felt.length ? `<div class="felt">${r.felt.map((f) =>
              `<span>${kiBrEsc(f.navn)} <b>${kiBrEsc(f.verdi)}</b></span>`).join("")}</div>` : ""}
          </div>`;
        }).join("")}
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

customElements.define("ki-bruk-card", KiBrukCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-bruk-card"))
  window.customCards.push({ type: "ki-bruk-card", name: "KI Bruk",
    description: "Delinger, lagring og disker med stolper, funnet fra et prefiks",
    preview: true });

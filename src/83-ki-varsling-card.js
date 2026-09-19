/* ki-varsling-card – bryterne fra KI Varslinger og sikkerhet, funnet selv.
 *
 * Integrasjonen lager ett config entry per regel, med én enhet og som regel én bryter.
 * Kortet finner dem gjennom entitetsregisteret og grupperer per enhet, så lista aldri
 * blir utdatert: legger du til en regel, dukker den opp av seg selv.
 *
 * type: custom:ki-varsling-card
 * grupper: [varsling, sikkerhet]     # egne faner; utelates = alt i én liste
 * ekstra: [automation.vaermelding_ai]   # automasjoner som ikke hører til integrasjonen
 * bare: [autolas_autolas]            # bare disse, i denne rekkefølgen
 * skjul: [autolas_autolas]           # bryter-slugger som ikke skal vises
 * navn: { autolas_autolas: 'Autolås' }
 * undertekst: { autolas_autolas: 'Låser døra etter lukking' }
 * ikoner: { autolas_autolas: 'mdi:lock-clock' }
 * sok: true                          # søkefelt når det er mange
 */
const KI_VARS_VERSJON = "1.0.0";
const KI_VARS_PLATTFORM = "ki_notifications";

const KI_VARS_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:8px; color:var(--gray1000); }

  .sok { display:flex; align-items:center; gap:10px; background:var(--gray100);
    border-radius:999px; padding:0 8px 0 16px; height:44px; --mdc-icon-size:19px; }
  .sok input { flex:1; min-width:0; border:0; background:none; color:inherit;
    font:inherit; font-size:15px; outline:none; }
  .sok input::placeholder { color:currentColor; opacity:.4; }
  .sok button { width:30px; height:30px; flex:none; border:0; border-radius:50%;
    background:rgba(128,128,128,.18); color:inherit; cursor:pointer; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:16px; }

  .gruppe { display:grid; gap:6px; }
  .hode { display:flex; align-items:baseline; justify-content:space-between; gap:10px;
    padding:6px 6px 0; }
  .hode .h { font-size:13px; font-weight:600; }
  .hode .s { font-size:11.5px; opacity:.5; }

  /* Pilleform med rundt ikonfelt, som radene ellers i dashbordet. */
  .rad { display:flex; align-items:center; gap:13px; width:100%; border:0; font:inherit;
    text-align:left; cursor:pointer; border-radius:22px; background:var(--gray200);
    color:var(--gray1000); padding:8px 16px 8px 8px;
    transition:transform .12s var(--myk); }
  .rad:active { transform:scale(.995); }
  .ring { width:46px; height:46px; flex:none; border-radius:50%; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:22px;
    background:rgba(250,251,252,.10); color:var(--gray1000);
    transition:background .35s var(--myk), color .3s; }
  .rad.pa .ring { background:var(--active-big,#ee95ff); color:var(--black,#1b1b1b); }
  .rad.borte { opacity:.45; }
  .tekst { flex:1; min-width:0; display:grid; gap:1px; }
  .n { font-size:15px; font-weight:500; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .u { font-size:13px; opacity:.55; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .verdi { font-size:13px; opacity:.5; flex:none; white-space:nowrap; }

  .tom { padding:16px 18px; border-radius:22px; background:var(--gray200);
    font-size:14px; opacity:.7; line-height:1.5; }
  @media (prefers-reduced-motion: reduce) { .rad, .ring { transition:none; } }
`;

const kiVaEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Ikon gjettes fra navnet når integrasjonen ikke gir et. Rekkefølgen betyr noe:
   «dorlas_fastkjort» skal treffe låsen, ikke varselet, så de mest spesifikke først. */
const KI_VARS_IKON = [
  [/fastkjort|fastkj/, "mdi:lock-alert"],
  [/autolas|autolås/, "mdi:lock-clock"],
  [/las|lås|dor|dør/, "mdi:door-closed-lock"],
  [/alarm|heimdall|alarmo/, "mdi:shield-home"],
  [/ansikt|face/, "mdi:face-recognition"],
  [/familie|hjemme|borte|person/, "mdi:home-account"],
  [/stovsug|støvsug|vacuum/, "mdi:robot-vacuum"],
  [/vaer|vær|weather/, "mdi:weather-partly-cloudy"],
  [/ruter|buss|avgang/, "mdi:bus-clock"],
  [/strom|strøm|forbruk|energi/, "mdi:chart-bar"],
  [/oppstart|restart|startup/, "mdi:restart"],
  [/blink|lys|skjerm/, "mdi:monitor-shimmer"],
  [/rapport|daglig/, "mdi:file-document-outline"],
];

const kiVarsIkon = (tekst) => {
  const t = String(tekst || "").toLowerCase();
  for (const [m, ikon] of KI_VARS_IKON) if (m.test(t)) return ikon;
  return "mdi:bell-outline";
};

class KiVarslingCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._sok = ""; }
  static getStubConfig() { return { sok: true }; }
  getCardSize() { return 6; }

  setConfig(c) {
    this._c = { plattform: KI_VARS_PLATTFORM, sok: true, ...(c || {}) };
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._brytere().map((b) => [b.id, b.pa]));
    if (sig !== this._sig || !this._bygget) { this._sig = sig; this._tegn(); }
  }

  /* Bryterne fra integrasjonen, pluss det som er lagt til manuelt i `ekstra`.
   *
   * Vi går gjennom entitetsregisteret og ikke gjennom tilstandene, fordi registeret er
   * det eneste stedet plattformen står. To brytere kan hete det samme og komme fra
   * ulike integrasjoner. */
  _brytere() {
    const h = this._h;
    if (!h) return [];
    const c = this._c;
    const reg = h.entities || {};
    const dev = h.devices || {};
    const skjul = new Set((c.skjul || []).map(String));
    const ut = [];

    const legg = (id, kilde) => {
      const st = h.states[id];
      if (!st) return;
      const slug = id.split(".")[1] || id;
      if (skjul.has(slug) || skjul.has(id)) return;
      const e = reg[id] || {};
      const enhet = (dev[e.device_id] || {}).name_by_user
        || (dev[e.device_id] || {}).name || "";
      const a = st.attributes || {};
      const eget = (c.navn || {})[slug] || (c.navn || {})[id];
      /* Enhetsnavnet står ofte foran entitetsnavnet — «Autolås Autolås». Er de like,
         holder det med ett. */
      let navn = eget || a.friendly_name || slug;
      if (enhet && navn.toLowerCase().startsWith(enhet.toLowerCase() + " ")) {
        navn = navn.slice(enhet.length + 1);
      }
      ut.push({
        id, slug, kilde, enhet: enhet || "Annet",
        navn: navn.trim() || slug,
        under: (c.undertekst || {})[slug] || (c.undertekst || {})[id] || "",
        ikon: (c.ikoner || {})[slug] || (c.ikoner || {})[id]
          || a.icon || kiVarsIkon(`${slug} ${navn}`),
        pa: st.state === "on",
        borte: ["unavailable", "unknown"].includes(st.state),
      });
    };

    for (const [id, e] of Object.entries(reg)) {
      if (e.platform !== c.plattform) continue;
      if (!id.startsWith("switch.") && !id.startsWith("input_boolean.")) continue;
      legg(id, "integrasjon");
    }
    for (const id of (c.ekstra || [])) legg(id, "ekstra");

    /* `bare:` er motsatt av `skjul:` og styrer også rekkefølgen. Med to faner som deler
       de samme bryterne er det langt enklere enn at hver fane må kjenne den andres
       innhold for å skjule det. */
    const bare = (c.bare || []).map(String);
    if (bare.length) {
      const rang = new Map(bare.map((x, i) => [x, i]));
      return ut
        .filter((b) => rang.has(b.slug) || rang.has(b.id))
        .sort((a, b) => (rang.get(a.slug) ?? rang.get(a.id))
                      - (rang.get(b.slug) ?? rang.get(b.id)));
    }
    return ut.sort((a, b) => a.enhet.localeCompare(b.enhet, "nb")
      || a.navn.localeCompare(b.navn, "nb"));
  }

  _tegn() {
    const c = this._c;
    let brytere = this._brytere();
    const alle = brytere.length;

    const sok = this._sok.trim().toLowerCase();
    if (sok) {
      brytere = brytere.filter((b) =>
        `${b.navn} ${b.under} ${b.enhet} ${b.slug}`.toLowerCase().includes(sok));
    }

    /* Grupperes per enhet, som er én regel i integrasjonen. Er det bare én gruppe,
       droppes overskriften — en overskrift over alt er ikke en gruppering. */
    const grupper = new Map();
    for (const b of brytere) {
      if (!grupper.has(b.enhet)) grupper.set(b.enhet, []);
      grupper.get(b.enhet).push(b);
    }
    const flereGrupper = grupper.size > 1;
    const visSok = c.sok !== false && (alle >= (Number(c.sok_fra) || 8) || sok);

    const paa = brytere.filter((b) => b.pa).length;

    this.shadowRoot.innerHTML = `<style>${KI_VARS_STIL}</style>
      <div class="rot">
        ${visSok ? `<label class="sok">
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                 placeholder="Søk blant ${alle}" value="${kiVaEsc(this._sok)}" />
          ${sok ? `<button data-tom="1" aria-label="Tøm">
            <ha-icon icon="mdi:close"></ha-icon></button>` : ""}
        </label>` : ""}
        ${!alle ? `<div class="tom">Fant ingen brytere fra KI Varslinger og sikkerhet.
          Sjekk at integrasjonen er satt opp, eller sett <code>plattform:</code> hvis
          domenet heter noe annet.</div>`
        : !brytere.length ? `<div class="tom">Ingen treff på «${kiVaEsc(this._sok)}».</div>`
        : [...grupper.entries()].map(([enhet, liste]) => `
          <div class="gruppe">
            ${flereGrupper ? `<div class="hode">
              <span class="h">${kiVaEsc(enhet)}</span>
              <span class="s">${liste.filter((b) => b.pa).length} av ${liste.length} på</span>
            </div>` : ""}
            ${liste.map((b) => `
              <button class="rad ${b.pa ? "pa" : ""} ${b.borte ? "borte" : ""}"
                      data-veksle="${kiVaEsc(b.id)}" data-mer="${kiVaEsc(b.id)}">
                <span class="ring"><ha-icon icon="${kiVaEsc(b.ikon)}"></ha-icon></span>
                <span class="tekst">
                  <span class="n">${kiVaEsc(b.navn)}</span>
                  ${b.under ? `<span class="u">${kiVaEsc(b.under)}</span>` : ""}
                </span>
                <span class="verdi">${b.borte ? "uten svar" : b.pa ? "På" : "Av"}</span>
              </button>`).join("")}
          </div>`).join("")}
        ${alle && !flereGrupper && brytere.length ? `<div class="hode">
          <span class="s">${paa} av ${brytere.length} på</span></div>` : ""}
      </div>`;

    for (const el of this.shadowRoot.querySelectorAll("[data-veksle]")) {
      let holdt = null;
      const veksle = () => {
        const id = el.dataset.veksle;
        this._h.callService(id.split(".")[0], "toggle", { entity_id: id });
      };
      /* Langt trykk åpner entiteten. Uten det må man inn i innstillingene for å se
         hvilken automasjon en bryter egentlig styrer. */
      el.addEventListener("pointerdown", () => {
        holdt = setTimeout(() => {
          holdt = null;
          this.dispatchEvent(new CustomEvent("hass-more-info",
            { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
        }, 500);
      });
      el.addEventListener("pointerup", () => {
        if (holdt) { clearTimeout(holdt); holdt = null; veksle(); }
      });
      el.addEventListener("pointercancel", () => { clearTimeout(holdt); holdt = null; });
    }

    const felt = this.shadowRoot.querySelector(".sok input");
    if (felt) {
      felt.addEventListener("input", (e) => {
        const pos = e.target.selectionStart;
        this._sok = e.target.value;
        this._tegn();
        const ny = this.shadowRoot.querySelector(".sok input");
        if (ny) { ny.focus(); try { ny.setSelectionRange(pos, pos); } catch (x) { /* ok */ } }
      });
    }
    const tom = this.shadowRoot.querySelector("[data-tom]");
    if (tom) tom.addEventListener("click", () => { this._sok = ""; this._tegn(); });

    this._bygget = true;
  }
}

customElements.define("ki-varsling-card", KiVarslingCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-varsling-card"))
  window.customCards.push({ type: "ki-varsling-card", name: "KI Varsling",
    description: "Bryterne fra KI Varslinger og sikkerhet, funnet automatisk",
    preview: true });

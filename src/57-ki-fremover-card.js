/* ki-fremover-card – hva som skjer framover, hentet fra kalenderne.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-fremover-card
 * kalendere:
 *   - entity: calendar.familien
 *     navn: Familien
 *     farge: var(--green)
 *   - entity: calendar.helge_hus
 *     navn: Hytta
 *     farge: var(--blue)
 *     ikon: mdi:home-heart
 * dager: 21                  # hvor langt fram vi ser
 * maks: 25                   # hvor mange hendelser som vises
 * tittel: Framover
 * ekstra:                    # egne rader, for eksempel bursdager eller søppel
 *   - entity: sensor.dagens_bursdager
 *     navn: Bursdag
 *     ikon: mdi:cake-variant
 *     farge: var(--yellow)
 */
const KI_FREM_VERSJON = "1.0.0";

const KI_FREM_STIL = `
  :host { display:block; max-width:100%; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:10px; max-width:100%; }
  .topp { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:0 4px 2px; }
  .topp h3 { margin:0; font-size:16px; font-weight:500; }
  .filtre { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px;
    max-width:60%; overflow-x:auto; scrollbar-width:none; }
  .filtre::-webkit-scrollbar { display:none; }
  .filter { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:12px; font-weight:500;
    padding:5px 12px; border-radius:999px; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:6px; }
  .filter i { width:8px; height:8px; border-radius:50%; background:currentColor; }
  .filter.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); }

  /* dagsbolker */
  .dag { background:var(--gray200); border-radius:20px; overflow:hidden; }
  .dagtopp { display:flex; align-items:baseline; gap:10px; padding:12px 16px 6px; }
  .dagtopp .n { font-size:15px; font-weight:600; }
  .dagtopp .d { font-size:12px; opacity:.5; }
  .dagtopp .antall { margin-left:auto; font-size:11px; opacity:.45; }
  .dag.idag .dagtopp .n { color:var(--active-big,#ee95ff); }

  .hendelse { display:grid; grid-template-columns:4px 58px 1fr min-content; gap:12px; align-items:center;
    padding:10px 16px 10px 12px; border-top:1px solid rgba(255,255,255,.05); cursor:pointer; }
  .hendelse:first-of-type { border-top:0; }
  .hendelse:active { background:var(--gray100); }
  .hendelse .strek { align-self:stretch; border-radius:3px; min-height:26px; }
  .hendelse .kl { font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; opacity:.85; }
  .hendelse .kl small { display:block; font-size:11px; font-weight:400; opacity:.55; }
  .hendelse .hva { min-width:0; }
  .hendelse .tit { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hendelse .sted { font-size:12px; opacity:.55; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hendelse .merke { font-size:10px; font-weight:700; padding:3px 8px; border-radius:7px; white-space:nowrap;
    background:rgba(255,255,255,.08); }
  .hendelse ha-icon { --mdc-icon-size:18px; opacity:.7; }

  /* nå-linje og nedtelling */
  .snart { position:relative; }
  .snart::after { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; border-radius:3px;
    background:var(--active-big,#ee95ff); animation:fr-puls 2.4s ease-in-out infinite; }
  @keyframes fr-puls { 0%,100% { opacity:.5; } 50% { opacity:1; } }
  .naa { font-size:11px; font-weight:700; color:var(--active-big,#ee95ff); }

  .tom { background:var(--gray200); border-radius:20px; padding:26px 16px; text-align:center; font-size:13px; opacity:.6; }
  .laster { display:flex; gap:5px; justify-content:center; padding:22px; }
  .laster i { width:7px; height:7px; border-radius:50%; background:var(--gray1000); opacity:.3; animation:fr-lys 1.1s ease-in-out infinite; }
  .laster i:nth-child(2) { animation-delay:.15s; } .laster i:nth-child(3) { animation-delay:.3s; }
  @keyframes fr-lys { 0%,100% { opacity:.25; transform:translateY(0); } 50% { opacity:.9; transform:translateY(-3px); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiFrEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_FR_FARGER = ["var(--green)", "var(--blue)", "var(--yellow)", "var(--orange)", "var(--active-big)", "var(--red)"];

class KiFremoverCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._valgt = null; }
  static getConfigElement() { return document.createElement("ki-fremover-card-editor"); }
  static getStubConfig() { return { dager: 21 }; }
  getCardSize() { return 8; }

  setConfig(c) {
    this._c = { dager: 21, maks: 25, tittel: "Framover", ...(c || {}) };
    this._kal = (this._c.kalendere || []).map((k, i) => (typeof k === "string"
      ? { entity: k, navn: "", farge: KI_FR_FARGER[i % KI_FR_FARGER.length] }
      : { farge: KI_FR_FARGER[i % KI_FR_FARGER.length], ...k }));
    this._bygget = false; this._hendelser = null;
  }
  set hass(h) {
    const forste = !this._h; this._h = h;
    if (!this._c) return;
    if (forste) { this._hent(); this._tegn(); return; }
    if (!this._bygget) this._tegn();
    if (this._c.ekstra && this._ekstraEndret(h)) this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._hent(), 300000); if (this._h) this._hent(); }
  disconnectedCallback() { clearInterval(this._i); }

  _ekstraEndret(h) {
    const ids = (this._c.ekstra || []).map((x) => x.entity).filter(Boolean);
    const nøkkel = ids.map((id) => (h.states[id] || {}).state).join("|");
    if (nøkkel === this._ekstraNokkel) return false;
    this._ekstraNokkel = nøkkel; return true;
  }

  /* Henter hendelsene rett fra kalender-API-et, samme kilde som kalendervisningen i HA */
  async _hent() {
    const h = this._h, c = this._c; if (!h || !this._kal.length) { this._hendelser = []; return this._tegn(); }
    const fra = new Date(); fra.setHours(0, 0, 0, 0);
    const til = new Date(fra); til.setDate(til.getDate() + Number(c.dager || 21));
    const ut = [];
    await Promise.all(this._kal.map(async (k) => {
      try {
        const svar = await h.callApi("GET",
          `calendars/${k.entity}?start=${encodeURIComponent(fra.toISOString())}&end=${encodeURIComponent(til.toISOString())}`);
        (svar || []).forEach((e) => {
          const start = e.start && (e.start.dateTime || e.start.date || e.start);
          const slutt = e.end && (e.end.dateTime || e.end.date || e.end);
          if (!start) return;
          const heldags = !String(start).includes("T");
          ut.push({
            kalender: k.entity, navn: k.navn || k.entity.split(".").pop().replace(/_/g, " "),
            farge: k.farge, ikon: k.ikon,
            tittel: e.summary || e.title || "", sted: e.location || "",
            start: new Date(start), slutt: slutt ? new Date(slutt) : null, heldags,
          });
        });
      } catch (feil) { /* kalenderen svarte ikke – vi viser de andre */ }
    }));
    ut.sort((a, b) => a.start - b.start);
    this._hendelser = ut;
    this._tegn();
  }

  _ekstraRader() {
    const h = this._h;
    return (this._c.ekstra || []).map((x, i) => {
      const st = x.entity && h.states[x.entity];
      if (!st || ["unknown", "unavailable", "0", "", "off"].includes(String(st.state))) return null;
      const d = x.dato && st.attributes[x.dato] ? new Date(st.attributes[x.dato]) : new Date();
      return {
        kalender: x.entity, navn: x.navn || "", farge: x.farge || KI_FR_FARGER[(i + 3) % KI_FR_FARGER.length],
        ikon: x.ikon, tittel: x.tekst || st.state, sted: "", start: d, slutt: null, heldags: true, ekstra: true,
      };
    }).filter(Boolean);
  }

  _dagnavn(d) {
    const nå = new Date(); nå.setHours(0, 0, 0, 0);
    const dag = new Date(d); dag.setHours(0, 0, 0, 0);
    const diff = Math.round((dag - nå) / 86400000);
    if (diff === 0) return "I dag";
    if (diff === 1) return "I morgen";
    const u = dag.toLocaleDateString("nb-NO", { weekday: "long" });
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
  _klokke(e) {
    if (e.heldags) return { topp: "hele", bunn: "dagen" };
    const t = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    return { topp: t(e.start), bunn: e.slutt && (e.slutt - e.start) < 86400000 ? t(e.slutt) : "" };
  }
  _nedtelling(e) {
    if (e.heldags) return "";        /* heldagshendelser teller vi ikke ned til */
    const min = Math.round((e.start - new Date()) / 60000);
    if (min < 0 || min > 180) return "";
    if (min < 1) return "nå";
    if (min < 60) return `om ${min} min`;
    return `om ${Math.round(min / 60)} t`;
  }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }

  _tegn() {
    const c = this._c; if (!c || !this._h) return;
    const alle = [...(this._hendelser || []), ...this._ekstraRader()]
      .filter((e) => !this._valgt || e.kalender === this._valgt)
      .sort((a, b) => a.start - b.start)
      .slice(0, Number(c.maks || 25));

    const dager = new Map();
    alle.forEach((e) => {
      const n = e.start.toISOString().slice(0, 10);
      if (!dager.has(n)) dager.set(n, []);
      dager.get(n).push(e);
    });
    const idag = new Date().toISOString().slice(0, 10);

    const innhold = this._hendelser === null
      ? `<div class="tom"><div class="laster"><i></i><i></i><i></i></div></div>`
      : dager.size === 0
        ? `<div class="tom">Ingenting de neste ${c.dager} dagene.</div>`
        : [...dager.entries()].map(([n, liste]) => {
          const d = new Date(n + "T12:00:00");
          return `<div class="dag ${n === idag ? "idag" : ""}">
            <div class="dagtopp">
              <span class="n">${kiFrEsc(this._dagnavn(d))}</span>
              <span class="d">${kiFrEsc(d.toLocaleDateString("nb-NO", { day: "numeric", month: "long" }))}</span>
              <span class="antall">${liste.length}</span>
            </div>
            ${liste.map((e) => {
              const kl = this._klokke(e), snart = this._nedtelling(e);
              return `<div class="hendelse ${snart ? "snart" : ""}" data-e="${kiFrEsc(e.kalender)}">
                <span class="strek" style="background:${kiFrEsc(e.farge)}"></span>
                <span class="kl">${kiFrEsc(kl.topp)}${kl.bunn ? `<small>${kiFrEsc(kl.bunn)}</small>` : ""}</span>
                <span class="hva"><span class="tit">${kiFrEsc(e.tittel)}</span>
                  ${e.sted ? `<span class="sted">${kiFrEsc(e.sted)}</span>`
                    : snart ? `<span class="naa">${kiFrEsc(snart)}</span>` : ""}</span>
                ${e.ikon ? `<ha-icon icon="${kiFrEsc(e.ikon)}"></ha-icon>`
                  : `<span class="merke" style="color:${kiFrEsc(e.farge)}">${kiFrEsc(e.navn)}</span>`}
              </div>`;
            }).join("")}
          </div>`;
        }).join("");

    const html = `<style>${KI_FREM_STIL}</style>
      <div class="rot">
        <div class="topp"><h3>${kiFrEsc(c.tittel)}</h3>
          ${this._kal.length > 1 ? `<div class="filtre">
            <button class="filter ${this._valgt ? "" : "valgt"}" data-f="">Alle</button>
            ${this._kal.map((k) => `<button class="filter ${this._valgt === k.entity ? "valgt" : ""}" data-f="${kiFrEsc(k.entity)}">
              <i style="color:${kiFrEsc(k.farge)}"></i>${kiFrEsc(k.navn || k.entity.split(".").pop())}</button>`).join("")}
          </div>` : ""}
        </div>
        ${innhold}
      </div>`;

    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html; this._bygget = true;
    const r = this.shadowRoot;
    r.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      this._valgt = b.dataset.f || null; this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", () => this._mer(el.dataset.e)));
  }
}
if (!customElements.get("ki-fremover-card")) customElements.define("ki-fremover-card", KiFremoverCard);

class KiFremoverCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { tittel: "Tittel", dager: "Dager framover", maks: "Maks antall hendelser" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("p");
      p.style.cssText = "font-size:12px;opacity:.6;margin:8px 2px";
      p.textContent = "Kalenderne og egne rader (ekstra:) settes i YAML – se README.";
      this.appendChild(p);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "tittel", selector: { text: {} } },
      { name: "dager", selector: { number: { mode: "box", min: 1, max: 90 } } },
      { name: "maks", selector: { number: { mode: "box", min: 3, max: 100 } } },
    ];
  }
}
if (!customElements.get("ki-fremover-card-editor")) customElements.define("ki-fremover-card-editor", KiFremoverCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-fremover-card")) window.customCards.push({ type: "ki-fremover-card", name: "KI Framover", description: "Kommende hendelser fra kalenderne, gruppert per dag", preview: true });

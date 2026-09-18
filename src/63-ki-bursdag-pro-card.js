/* ki-bursdag-pro-card – bursdager i samme stil som kalenderkortene.
 * Leser de samme sensorene som ki-bursdag-card, men med nytt design:
 * stor dato til venstre, navn og alder til høyre, og lilla kort på selve dagen.
 *
 * type: custom:ki-bursdag-pro-card
 * kalender: calendar.birthdays      # bursdagene ligger som heldagshendelser
 * entities: [sensor.bursdag_rune]   # eller sensorer, som før
 * regex: birthday|bursdag           # eller finn sensorene selv
 * antall: 3
 * dager: 365            # hvor langt fram vi ser
 * legg_til: true        # knapp for å legge inn en ny bursdag
 * aar_fram: 10          # hvor mange år fram nye bursdager opprettes
 *
 * Fødselsåret leses fra hendelsen: skriv datoen i beskrivelsen («1985-04-12»,
 * «f. 1985» eller «født 1985»), eller sett den i tittelen: «Rune (1985)».
 */
const KI_BDP_VERSJON = "3.0.0";

/* Ett kakeikon, brukt både i flisa og i pillene. Sto det to steder, ville de kommet ut
   av takt ved første endring. */
const KI_BD_KAKE = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
  stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 52V38a6 6 0 0 1 6-6h28a6 6 0 0 1 6 6v14z" fill="currentColor" fill-opacity=".16"/>
  <path d="M10 52h44M32 32V22"/>
  <g class="flamme"><path d="M32 20c3-3 1-6 0-7-1 1-3 4 0 7z" fill="currentColor"/></g>
  <path d="M20 32v-8M44 32v-8" opacity=".5"/>
</svg>`;

const KI_BDP_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:8px; color:var(--gray1000); }
  button { font:inherit; color:inherit; border:0; text-align:left; cursor:pointer; }

  /* --- den nærmeste: høy flis, som et rom --- */
  .flis { position:relative; display:grid; align-content:start;
    grid-template-columns:1fr auto; gap:0 12px;
    min-height:190px; padding:20px 22px 22px; border-radius:28px;
    background:var(--gray200); overflow:hidden;
    transition:transform .12s var(--myk), background .5s var(--myk); }
  .flis:active { transform:scale(.99); }
  .flis.i_dag { background:color-mix(in srgb, var(--tone) 24%, var(--gray200)); }

  .fnavn { grid-column:1; font-size:23px; font-weight:500; align-self:start;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .fsirkel { grid-column:2; grid-row:1 / span 2; width:66px; height:66px; flex:none;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:rgba(250,251,252,.09); color:var(--gray1000);
    transition:background .5s var(--myk), color .4s; }
  .fsirkel svg { width:32px; height:32px; }
  .fsirkel.nar { background:var(--tone); color:var(--black,#1b1b1b); }

  /* Tallet er stort og lett, halen dempet ved siden av — som «23°» med «48%» */
  .fverdi { grid-column:1; display:flex; align-items:baseline; gap:10px;
    margin-top:34px; }
  .fverdi b { font-size:clamp(46px,13vw,64px); font-weight:200; line-height:1;
    letter-spacing:-.03em; font-variant-numeric:tabular-nums; }
  .fverdi i { font-style:normal; font-size:21px; font-weight:300; opacity:.5; }
  .funder { grid-column:1 / -1; font-size:14px; opacity:.55; margin-top:10px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .fstripe { position:absolute; left:0; right:0; bottom:0; height:4px;
    background:rgba(128,128,128,.2); }
  .fstripe i { display:block; height:100%; background:var(--tone);
    transition:width .8s var(--myk); }

  /* --- de neste: piller med rundt ikon og to linjer --- */
  .pille { display:flex; align-items:center; gap:14px; width:100%;
    border-radius:999px; background:var(--gray200); padding:8px 20px 8px 8px;
    transition:transform .12s var(--myk); }
  .pille:active { transform:scale(.995); }
  .pikon { width:58px; height:58px; flex:none; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    background:rgba(250,251,252,.09); color:var(--gray1000);
    transition:background .5s var(--myk), color .4s; }
  .pikon svg { width:26px; height:26px; }
  .pille.nar .pikon { background:var(--tone); color:var(--black,#1b1b1b); }
  .pille.i_dag { background:color-mix(in srgb, var(--tone) 22%, var(--gray200)); }
  .ptekst { flex:1; min-width:0; display:grid; gap:1px; }
  .pn { font-size:19px; font-weight:500; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .pu { font-size:14px; opacity:.55; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .pdato { font-size:13px; opacity:.4; flex:none; white-space:nowrap; }
  @media (max-width:400px) { .pdato { display:none; } }

  /* Flammen blafrer bare på selve dagen — ellers ville tre kort blinket samtidig */
  .flamme { transform-box:fill-box; transform-origin:50% 100%; }
  .flis.i_dag .flamme, .pille.i_dag .flamme {
    animation:kiBdFlamme 1.6s ease-in-out infinite alternate; }
  @keyframes kiBdFlamme {
    from { transform:scale(.85) rotate(-6deg); opacity:.75 }
    to { transform:scale(1.1) rotate(6deg); opacity:1 }
  }

  .nyknapp { display:flex; align-items:center; justify-content:center; gap:8px;
    padding:13px; border-radius:999px; background:var(--gray200); opacity:.75;
    font-size:14px; --mdc-icon-size:19px; }
  .tom { padding:16px 18px; border-radius:24px; background:var(--gray200);
    font-size:14px; opacity:.7; }
  @media (prefers-reduced-motion: reduce) {
    .flis, .pille, .flamme, .fstripe i { animation:none; transition:none; }
  }
`;

/* «Rune (1985)», «Rune's Birthday» og «bursdag_rune» blir alle til «Rune» */
const kiBdNavn = (s) => String(s || "")
  .replace(/\(\s*\d{4}\s*\)/g, "")
  .replace(/[_-]+/g, " ")
  .replace(/\b(bursdag|birthday|fodselsdag|fødselsdag)\b/gi, "")
  .replace(/[’']\s*s\b/gi, "")
  .replace(/^\s*s\b/i, "")
  .replace(/\s{2,}/g, " ")
  .replace(/^[\s.,·-]+|[\s.,·-]+$/g, "")
  .replace(/^./, (c) => c.toUpperCase());

const kiBdEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_BD_MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

class KiBursdagProCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getConfigElement() { return document.createElement("ki-bursdag-pro-card-editor"); }
  static getStubConfig() { return { antall: 3 }; }
  getCardSize() { return 4; }

  setConfig(c) {
    this._c = { antall: 3, dager: 365, regex: "birthday|bursdag", legg_til: true, aar_fram: 10, ...(c || {}) };
    this._forrige = null; this._fraKalender = null; this._nytt = null;
  }

  /* Bursdagene som heldagshendelser i en kalender. Fødselsåret hentes fra
     beskrivelsen («1985-04-12», «f. 1985») eller fra tittelen («Rune (1985)»). */
  async _hentKalender() {
    const h = this._h, c = this._c; if (!h || !c.kalender) return;
    const fra = new Date(); fra.setHours(0, 0, 0, 0);
    const til = new Date(fra); til.setDate(til.getDate() + Number(c.dager || 365));
    try {
      const svar = await h.callApi("GET",
        `calendars/${c.kalender}?start=${encodeURIComponent(fra.toISOString())}&end=${encodeURIComponent(til.toISOString())}`);
      const nå = new Date(); nå.setHours(0, 0, 0, 0);
      const ut = [];
      (svar || []).forEach((e) => {
        const start = e.start && (e.start.date || e.start.dateTime || e.start);
        const d = new Date(start); if (isNaN(d)) return;
        d.setHours(0, 0, 0, 0);
        const tekst = `${e.description || ""} ${e.summary || ""}`;
        const full = tekst.match(/(\d{4})-(\d{2})-(\d{2})/);
        const bare = tekst.match(/(?:f\.?|født|fodt|\()\s*(\d{4})/i);
        const fodselsaar = full ? Number(full[1]) : bare ? Number(bare[1]) : null;
        ut.push({
          id: c.kalender, navn: kiBdNavn(e.summary || ""), dato: d,
          dager: Math.round((d - nå) / 86400000),
          alder: fodselsaar ? d.getFullYear() - fodselsaar : null,
          fodt: full ? full[0] : fodselsaar ? String(fodselsaar) : null,
          fra_kalender: true,
        });
      });
      ut.sort((a, b) => a.dager - b.dager);
      this._fraKalender = ut; this._forrige = null; this._tegn();
    } catch (feil) { this._fraKalender = []; }
  }
  /* Skjules når lanseringskortet står på serier, filmer eller kalender */
  _visningslytter() {
    if (this._visAv) return;
    this._visAv = (e) => {
      const v = (e && e.detail && e.detail.visning) || "alle";
      const skjul = [].concat(this._c && this._c.skjul_paa !== undefined
        ? this._c.skjul_paa : ["serie", "film", "kalender"]);
      this.style.display = skjul.includes(v) ? "none" : "";
    };
    window.addEventListener("ki-lansering-visning", this._visAv);
  }
  connectedCallback() {
    this._visningslytter();
    clearInterval(this._i);
    if (this._c && this._c.kalender) {
      this._i = setInterval(() => this._hentKalender(), 900000);
      if (this._h && this._fraKalender === null) this._hentKalender();
    }
  }
  disconnectedCallback() {
    clearInterval(this._i);
    if (this._visAv) { window.removeEventListener("ki-lansering-visning", this._visAv); this._visAv = null; }
  }

  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g && this._c.kalender) this._hentKalender();
    if (!g || this._endret(g, h)) this._tegn();
  }
  _endret(g, h) {
    return this._ider().some((id) => g.states[id] !== h.states[id])
      || (this._c.kalender && g.states[this._c.kalender] !== h.states[this._c.kalender]);
  }

  _ider() {
    const c = this._c, h = this._h; if (!h) return [];
    if (c.entities && c.entities.length) return c.entities.map((e) => (typeof e === "string" ? e : e.entity));
    const re = new RegExp(c.regex, "i");
    return Object.keys(h.states).filter((id) => id.startsWith("sensor.") && re.test(id));
  }

  /* Tåler flere sensorformater: dato i state, eller i attributtene */
  _personer() {
    if (this._c.kalender) return (this._fraKalender || []).slice(0, Number(this._c.antall || 3));
    const h = this._h, nå = new Date(); nå.setHours(0, 0, 0, 0);
    const ut = [];
    this._ider().forEach((id) => {
      const st = h.states[id]; if (!st) return;
      const a = st.attributes || {};
      const rått = a.friendly_name_short || a.nickname || a.name || a.friendly_name || id.split(".").pop();
      const navn = kiBdNavn(rått);
      const rå = a.next_birthday || a.next_date || a.date_of_next_birthday || a.birthday || a.date || st.state;
      const d = new Date(rå);
      if (isNaN(d)) return;
      const neste = new Date(d); neste.setHours(0, 0, 0, 0);
      if (neste < nå && a.years_old === undefined) {
        neste.setFullYear(nå.getFullYear());
        if (neste < nå) neste.setFullYear(nå.getFullYear() + 1);
      }
      const dager = Math.round((neste - nå) / 86400000);
      if (dager < 0 || dager > Number(this._c.dager || 365)) return;
      const alder = a.years_old !== undefined ? Number(a.years_old) + (dager === 0 ? 0 : 1)
        : a.age !== undefined ? Number(a.age) : (a.birth_year ? neste.getFullYear() - Number(a.birth_year) : null);
      ut.push({ id, navn, dato: neste, dager, alder });
    });
    return ut.sort((a, b) => a.dager - b.dager).slice(0, Number(this._c.antall || 3));
  }

  /* Skjema for å legge inn en ny bursdag i kalenderen */
  _skjema() {
    const d = this._nytt || {};
    return `<div class="skjema">
      <div><label>Navn</label><input type="text" data-f="navn" value="${kiBdEsc(d.navn || "")}" placeholder="Rune"></div>
      <div class="skjemarad">
        <div><label>Fødselsdato</label><input type="date" data-f="fodt" value="${kiBdEsc(d.fodt || "")}"></div>
        <div><label>År fram</label><input type="number" min="1" max="30" data-f="aar" value="${d.aar || this._c.aar_fram || 10}"></div>
      </div>
      <p class="hint">Datoen lagres i beskrivelsen på hendelsen, slik at alderen kan regnes ut.
        Du kan redigere den senere i kalenderen.</p>
      <div class="sknapper">
        <button class="sk" data-s="avbryt">Avbryt</button>
        <button class="sk lagre" data-s="lagre">Legg til</button>
      </div>
    </div>`;
  }

  async _lagre() {
    const d = this._nytt || {}, c = this._c, h = this._h;
    if (!d.navn || !d.fodt || !c.kalender) { this._nytt = null; this._forrige = null; return this._tegn(); }
    const fodt = new Date(d.fodt);
    const aar = Math.max(1, Math.min(30, Number(d.aar || c.aar_fram || 10)));
    const iAar = new Date().getFullYear();
    const start = fodt.getFullYear() >= iAar ? fodt.getFullYear() : iAar;
    for (let i = 0; i < aar; i++) {
      const dag = new Date(start + i, fodt.getMonth(), fodt.getDate());
      const slutt = new Date(dag); slutt.setDate(slutt.getDate() + 1);
      const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
      /* eslint-disable no-await-in-loop */
      await h.callService("calendar", "create_event", {
        entity_id: c.kalender,
        summary: `${d.navn} (${fodt.getFullYear()})`,
        description: `Født ${d.fodt}`,
        start_date: iso(dag), end_date: iso(slutt),
      });
    }
    this._nytt = null; this._forrige = null;
    await this._hentKalender();
    this._tegn();
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (this._nytt) {
      const html = `<style>${KI_BDP_STIL}</style><div class="rot">${this._skjema()}</div>`;
      if (html !== this._forrige) {
        this.shadowRoot.innerHTML = html; this._forrige = html;
        const r = this.shadowRoot;
        r.querySelectorAll("[data-f]").forEach((el) => el.addEventListener("change", () => {
          this._nytt[el.dataset.f] = el.value;
        }));
        r.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
          if (b.dataset.s === "avbryt") { this._nytt = null; this._forrige = null; return this._tegn(); }
          const felt = r.querySelectorAll("[data-f]");
          felt.forEach((el) => { this._nytt[el.dataset.f] = el.value; });
          this._lagre();
        }));
      }
      return;
    }
    const folk = this._personer();
    const farger = ["var(--active-big,#ee95ff)", "var(--blue)", "var(--yellow)", "var(--green)", "var(--orange)"];
    /* Første bursdag er en høy flis: navnet oppe til venstre, kakesirkelen i motsatt
       hjørne, og det store tallet nede — samme oppbygning som romflisene. De neste blir
       piller, siden de sjelden haster.
       Sirkelen er farget bare når det nærmer seg. Ellers er den nøytral, slik et rom
       som er av ikke lyser. */
    const kort = (p, i) => {
      const ukedag = p.dato.toLocaleDateString("nb-NO", { weekday: "long" });
      const under = p.alder ? `fyller ${p.alder} år` : "bursdag";
      const dato = `${p.dato.getDate()}. ${KI_BD_MND[p.dato.getMonth()]}`;
      const tone = farger[i % farger.length];
      const nar = p.dager <= 14;

      if (i) {
        const naar = p.dager === 0 ? "I dag" : p.dager === 1 ? "I morgen"
          : `${p.dager} dager`;
        return `<button class="pille ${p.dager === 0 ? "i_dag" : ""} ${nar ? "nar" : ""}"
            data-e="${kiBdEsc(p.id)}" style="--tone:${tone}">
          <span class="pikon">${KI_BD_KAKE}</span>
          <span class="ptekst">
            <span class="pn">${kiBdEsc(p.navn)}</span>
            <span class="pu">${kiBdEsc(naar)} · ${kiBdEsc(under)}</span>
          </span>
          <span class="pdato">${kiBdEsc(dato)}</span>
        </button>`;
      }

      /* Tallet er det store: dagene igjen, eller «I dag» på selve dagen. */
      const stort = p.dager === 0 ? "I dag" : String(p.dager);
      const halet = p.dager === 0 ? "" : p.dager === 1 ? "dag" : "dager";
      /* Stripa under fylles jo nærmere vi kommer, med 60 dager som helt vindu. */
      const fyll = Math.max(0, Math.min(100, (1 - Math.min(p.dager, 60) / 60) * 100));
      return `<button class="flis ${p.dager === 0 ? "i_dag" : ""}"
          data-e="${kiBdEsc(p.id)}" style="--tone:${tone}">
        <span class="fnavn">${kiBdEsc(p.navn)}</span>
        <span class="fsirkel ${nar ? "nar" : ""}">${KI_BD_KAKE}</span>
        <span class="fverdi">
          <b>${kiBdEsc(stort)}</b>${halet ? `<i>${halet}</i>` : ""}
        </span>
        <span class="funder">${kiBdEsc(under)} · ${kiBdEsc(ukedag)} ${kiBdEsc(dato)}</span>
        <span class="fstripe"><i style="width:${fyll.toFixed(0)}%"></i></span>
      </button>`;
    };

    const nyKnapp = c.kalender && c.legg_til !== false
      ? `<button class="nyknapp" data-ny="1"><ha-icon icon="mdi:plus"></ha-icon>Ny bursdag</button>` : "";
    const html = `<style>${KI_BDP_STIL}</style><div class="rot">${
      folk.length ? folk.map(kort).join("") : `<div class="tom">Ingen bursdager framover.</div>`}${nyKnapp}</div>`;
    if (html === this._forrige) return;
    this.shadowRoot.innerHTML = html; this._forrige = html;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.e }, bubbles: true, composed: true }))));
    const ny = this.shadowRoot.querySelector("[data-ny]");
    if (ny) ny.addEventListener("click", () => { this._nytt = { aar: c.aar_fram || 10 }; this._forrige = null; this._tegn(); });
  }
}
if (!customElements.get("ki-bursdag-pro-card")) customElements.define("ki-bursdag-pro-card", KiBursdagProCard);

class KiBursdagProCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { kalender: "Bursdagskalender", antall: "Antall kort", dager: "Dager framover",
        regex: "Finn sensorer med (regex)", legg_til: "Knapp for ny bursdag", aar_fram: "År fram nye lages" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "kalender", selector: { entity: { domain: "calendar" } } },
      { name: "antall", selector: { number: { mode: "box", min: 1, max: 10 } } },
      { name: "legg_til", selector: { boolean: {} } },
      { name: "aar_fram", selector: { number: { mode: "box", min: 1, max: 30 } } },
      { name: "dager", selector: { number: { mode: "box", min: 1, max: 400 } } },
      { name: "regex", selector: { text: {} } },
    ];
  }
}
if (!customElements.get("ki-bursdag-pro-card-editor")) customElements.define("ki-bursdag-pro-card-editor", KiBursdagProCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-bursdag-pro-card")) window.customCards.push({ type: "ki-bursdag-pro-card", name: "KI Bursdag Pro", description: "Bursdager i kalenderkort-stil", preview: true });

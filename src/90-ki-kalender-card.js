/* ki-kalender-card – månedskalender med hendelsene fra kalenderne dine.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-kalender-card
 * kalendere:                       # utelates den, tas alle calendar.* som finnes
 *   - entity: calendar.sebastian_kristo_no
 *     navn: Sebastian
 *     farge: var(--active-big)
 *   - entity: calendar.helge_hus
 *     navn: Hytta
 *     farge: var(--blue)
 * ekskluder: [calendar.todoist]    # ta bort enkelte når lista lages av seg selv
 * tittel: Kalender
 * start_dag: mandag                # mandag | sondag
 * visning: antall                 # antall (merke med tallet) | prikker (én prikk per hendelse)
 * prikker: 4                       # hvor mange prikker en dag kan vise i prikkevisningen
 * filtre: true                     # pillerad for å slå kalendere av og på
 * liste: true                      # hendelsene for valgt dag under rutenettet
 * dager_i_liste: 1                 # 1 = bare valgt dag, ellers så mange dager framover
 *
 * Hendelsene hentes fra kalender-API-et, samme kilde som HAs egen kalendervisning.
 */
const KI_KAL_VERSJON = "1.1.0";

/* Fargene deles ut i denne rekkefølgen til kalendere som ikke har fått sin egen. */
const KI_KAL_FARGER = [
  "var(--active-big, #ee95ff)", "var(--blue, #0a84ff)", "var(--green, #34c759)",
  "var(--orange, #ff9f0a)", "var(--purple, #bf5af2)", "var(--yellow, #ffd60a)",
  "var(--red, #ff453a)", "var(--teal, #40c8e0)",
];

const KI_KAL_STIL = `
  :host { display:block; max-width:100%; }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:10px; }
  .topp { display:grid; grid-template-columns:min-content 1fr min-content min-content;
    align-items:center; gap:8px; padding:0 2px 2px; }
  .mnd { text-align:center; font-size:16px; font-weight:600; text-transform:capitalize;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pil, .idag { border:0; background:rgba(250,251,252,.08); color:var(--gray1000,#f2f2f7);
    border-radius:999px; cursor:pointer; font:inherit; font-size:13px; font-weight:500;
    display:flex; align-items:center; justify-content:center; flex:none;
    -webkit-tap-highlight-color:transparent; transition:background .2s, transform .14s; }
  .pil { width:34px; height:34px; --mdc-icon-size:20px; }
  .idag { height:34px; padding:0 14px; }
  .pil:active, .idag:active { transform:scale(.92); }

  /* Filtrene er de samme pillene som ellers i pakka: tynn ring, fylt når de er på. */
  .filtre { display:flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3);
    border-radius:999px; overflow-x:auto; scrollbar-width:none; }
  .filtre::-webkit-scrollbar { display:none; }
  .filter { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:12px;
    font-weight:500; padding:5px 12px; border-radius:999px; cursor:pointer; white-space:nowrap;
    display:inline-flex; align-items:center; gap:6px; -webkit-tap-highlight-color:transparent;
    transition:background .2s, color .2s, opacity .2s; }
  .filter i { width:8px; height:8px; border-radius:50%; background:currentColor; flex:none; }
  .filter.av { opacity:.4; }
  .filter.pa { background:rgba(250,251,252,.12); color:var(--gray1000,#f2f2f7); }

  /* Rutenettet er det samme som månedskalenderen i ki-lansering-card: runde dager rett
     på bakgrunnen, uten boks rundt, og et merke med antallet på dagene som har noe. */
  .kort { background:none; padding:2px; }
  .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; padding-bottom:7px; }
  .ukedager span { text-align:center; font-size:12px; font-weight:600; opacity:.45; }
  .rutenett { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; }
  .dag { position:relative; aspect-ratio:1; border-radius:50%;
    background:var(--gray200, var(--ha-card-background, #1f1f21)); display:flex;
    flex-direction:column; align-items:center; justify-content:center; gap:3px; font-size:15px;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    transition:transform .14s cubic-bezier(.3,1.35,.5,1), background .2s; }
  .dag:active { transform:scale(.94); }
  .dag.utenfor { opacity:.25; background:transparent; }
  .dag.har { background:var(--gray100, rgba(250,251,252,.12)); font-weight:600; }
  .dag.idag { outline:2px solid rgba(255,255,255,.35); outline-offset:-2px; }
  .dag.valgt { background:var(--active-big, #ee95ff); color:rgba(70,58,64,.95); transform:scale(1.06); }
  /* Merket sitter oppe til venstre, utenfor sirkelen, som i lanseringskortet. Er alt
     den dagen fra samme kalender, får det fargen til den kalenderen. */
  .dag .antall { position:absolute; top:-3px; left:-3px; min-width:22px; height:22px; border-radius:11px;
    background:#ffc0dd; color:#3a2430; font-size:12px; font-weight:700; display:flex; align-items:center;
    justify-content:center; padding:0 6px; box-shadow:0 2px 6px rgba(0,0,0,.4); }
  .prikker { display:flex; gap:3px; height:6px; align-items:center; }
  .prikker i { width:5px; height:5px; border-radius:50%; flex:none; }
  .prikker .fler { font-size:9px; opacity:.6; line-height:1; }

  .liste { display:grid; gap:8px; }
  .dagsbolk { background:var(--gray200, var(--ha-card-background, #1f1f21)); border-radius:20px; overflow:hidden; }
  .dagshode { display:flex; align-items:baseline; gap:8px; padding:12px 16px 8px; }
  .dagshode b { font-size:15px; font-weight:500; text-transform:capitalize; }
  .dagshode span { font-size:12px; opacity:.55; }
  .hendelse { display:grid; grid-template-columns:3px auto 1fr; gap:12px; align-items:center;
    padding:10px 16px; border-top:1px solid rgba(250,251,252,.07); cursor:pointer; }
  .hendelse .strek { width:3px; align-self:stretch; border-radius:2px; min-height:28px; }
  .hendelse .tid { font-size:13px; opacity:.7; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .hendelse .navn { font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hendelse .sted { font-size:12px; opacity:.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tom { padding:14px 16px; font-size:13px; opacity:.5; }
  .laster { padding:14px 16px; font-size:13px; opacity:.5; }
`;

class KiKalenderCard extends HTMLElement {
  static getStubConfig() { return { tittel: "Kalender" }; }
  static getConfigElement() { return document.createElement("ki-kalender-card-editor"); }

  setConfig(c) {
    this._c = { tittel: "Kalender", prikker: 4, filtre: true, liste: true, dager_i_liste: 1, ...c };
    this._mnd = 0;                       /* hvor mange måneder fra denne */
    this._valgt = this._idag();
    this._av = new Set();                /* kalendere som er slått av i filteret */
    this._cache = {};                    /* hendelser per måned, så bla ikke henter på nytt */
    this._bygget = false;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  set hass(h) {
    const forste = !this._h;
    this._h = h;
    if (forste) { this._hent(); this._tegn(); }
    else if (!this._bygget) this._tegn();
  }

  connectedCallback() {
    clearInterval(this._i);
    /* Kalenderne endrer seg sjelden, men en ny hendelse skal ikke kreve at popupen
       lukkes og åpnes igjen. */
    this._i = setInterval(() => { this._cache = {}; this._hent(); }, 300000);
    if (this._h) this._hent();
  }
  disconnectedCallback() { clearInterval(this._i); }

  getCardSize() { return 8; }

  _idag() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  _iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /* Kalenderne kortet skal vise. Uten lista tas alle calendar.* som finnes, minus
     de du har nevnt i ekskluder. */
  _kalendere() {
    const c = this._c, h = this._h;
    let liste = c.kalendere;
    if (!liste || !liste.length) {
      const bort = new Set(c.ekskluder || []);
      liste = Object.keys((h && h.states) || {})
        .filter((id) => id.startsWith("calendar.") && !bort.has(id))
        .sort()
        .map((entity) => ({ entity }));
    }
    return liste.map((k, i) => {
      const rå = typeof k === "string" ? { entity: k } : k;
      const st = h && h.states[rå.entity];
      return {
        entity: rå.entity,
        navn: rå.navn || (st && st.attributes && st.attributes.friendly_name)
          || rå.entity.split(".").pop().replace(/_/g, " "),
        farge: rå.farge || KI_KAL_FARGER[i % KI_KAL_FARGER.length],
      };
    });
  }

  /* Rutenettet starter på mandagen (eller søndagen) før den 1., og dekker hele uker. */
  _vindu() {
    const na = this._idag();
    const forste = new Date(na.getFullYear(), na.getMonth() + this._mnd, 1);
    const fraSondag = String(this._c.start_dag || "mandag").toLowerCase().startsWith("s");
    const start = new Date(forste);
    const skift = fraSondag ? forste.getDay() : (forste.getDay() + 6) % 7;
    start.setDate(1 - skift);
    const siste = new Date(forste.getFullYear(), forste.getMonth() + 1, 0);
    const ruter = Math.ceil((skift + siste.getDate()) / 7) * 7;
    const slutt = new Date(start); slutt.setDate(start.getDate() + ruter);
    return { forste, start, slutt, ruter, fraSondag };
  }

  async _hent() {
    const h = this._h; if (!h) return;
    const { forste, start, slutt } = this._vindu();
    const nokkel = `${forste.getFullYear()}-${forste.getMonth()}`;
    if (this._cache[nokkel]) return;
    this._cache[nokkel] = [];                 /* hindrer at bla henter samme måned to ganger */
    const ut = [];
    await Promise.all(this._kalendere().map(async (k) => {
      try {
        const svar = await h.callApi("GET",
          `calendars/${k.entity}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(slutt.toISOString())}`);
        (svar || []).forEach((e) => {
          const s = e.start && (e.start.dateTime || e.start.date || e.start);
          const sl = e.end && (e.end.dateTime || e.end.date || e.end);
          if (!s) return;
          ut.push({
            kalender: k.entity, navn: k.navn, farge: k.farge,
            tittel: e.summary || e.title || "(uten tittel)", sted: e.location || "",
            start: new Date(s), slutt: sl ? new Date(sl) : null,
            heldags: !String(s).includes("T"),
          });
        });
      } catch (feil) { /* kalenderen svarte ikke – vi viser de andre */ }
    }));
    ut.sort((a, b) => a.start - b.start || (a.heldags === b.heldags ? 0 : a.heldags ? -1 : 1));
    this._cache[nokkel] = ut;
    this._tegn();
  }

  _hendelser() {
    const { forste } = this._vindu();
    return this._cache[`${forste.getFullYear()}-${forste.getMonth()}`] || [];
  }

  /* Hendelsene fordelt på dato. En hendelse over flere døgn havner på hver av dem;
     heldagshendelser slutter ved midnatt DAGEN ETTER siste dag, så den siste dagen
     skal ikke telles med. */
  _perDag() {
    const kart = {};
    this._hendelser().forEach((e) => {
      if (this._av.has(e.kalender)) return;
      const fra = new Date(e.start); fra.setHours(0, 0, 0, 0);
      let til = e.slutt ? new Date(e.slutt) : new Date(e.start);
      if (e.heldags) til.setDate(til.getDate() - 1);
      til.setHours(0, 0, 0, 0);
      if (til < fra) til = new Date(fra);
      for (const d = new Date(fra); d <= til; d.setDate(d.getDate() + 1)) {
        (kart[this._iso(d)] = kart[this._iso(d)] || []).push(e);
      }
    });
    return kart;
  }

  _tid(e, dato) {
    if (e.heldags) return "Hele dagen";
    const kl = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    const samme = !e.slutt || this._iso(e.start) === this._iso(e.slutt);
    if (dato && this._iso(e.start) !== dato) return e.slutt ? `→ ${kl(e.slutt)}` : "Pågår";
    return e.slutt && samme ? `${kl(e.start)} – ${kl(e.slutt)}` : kl(e.start);
  }

  _tegn() {
    if (!this._c || !this._h) return;
    const c = this._c, { forste, start, ruter, fraSondag } = this._vindu();
    const na = this._idag(), perDag = this._perDag(), kal = this._kalendere();
    const lastet = !!this._cache[`${forste.getFullYear()}-${forste.getMonth()}`];

    const ukedager = fraSondag ? ["S", "M", "T", "O", "T", "F", "L"] : ["M", "T", "O", "T", "F", "L", "S"];
    const celler = [];
    for (let i = 0; i < ruter; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const dato = this._iso(d);
      const hend = perDag[dato] || [];
      const utenfor = d.getMonth() !== forste.getMonth();
      let merke = "";
      if (hend.length && !utenfor) {
        if (String(c.visning || "antall").toLowerCase().startsWith("p")) {
          const maks = Number(c.prikker) || 4;
          merke = `<span class="prikker">${hend.slice(0, maks)
            .map((e) => `<i style="background:${e.farge}"></i>`).join("")}${
            hend.length > maks ? `<span class="fler">+${hend.length - maks}</span>` : ""}</span>`;
        } else {
          /* Én kalender bak alt den dagen: da bærer merket fargen dens. Flere: rosa,
             som i lanseringskortet, så merket ikke lyver om hvem det gjelder. */
          const ene = hend.every((e) => e.kalender === hend[0].kalender) ? hend[0].farge : "";
          merke = `<span class="antall"${ene ? ` style="background:${ene};color:rgba(70,58,64,.95)"` : ""}>${
            hend.length}</span>`;
        }
      }
      celler.push(`<div class="dag${utenfor ? " utenfor" : ""}${hend.length && !utenfor ? " har" : ""}${
        d.getTime() === na.getTime() ? " idag" : ""}${
        dato === this._iso(this._valgt) ? " valgt" : ""}" data-dato="${dato}">
        ${d.getDate()}${merke}</div>`);
    }

    const filtre = c.filtre !== false && kal.length > 1
      ? `<div class="filtre">${kal.map((k) => `<button class="filter ${
          this._av.has(k.entity) ? "av" : "pa"}" data-kal="${k.entity}">
          <i style="color:${k.farge}"></i>${k.navn}</button>`).join("")}</div>`
      : "";

    /* Lista under: valgt dag, eller så mange dager framover som du ber om. */
    let liste = "";
    if (c.liste !== false) {
      const antall = Math.max(1, Number(c.dager_i_liste) || 1);
      const bolker = [];
      for (let i = 0; i < antall; i++) {
        const d = new Date(this._valgt); d.setDate(d.getDate() + i);
        const dato = this._iso(d);
        const hend = perDag[dato] || [];
        if (antall > 1 && !hend.length) continue;
        const navn = d.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
        const merke = dato === this._iso(na) ? "i dag"
          : (d - na) / 86400000 === 1 ? "i morgen" : "";
        bolker.push(`<div class="dagsbolk">
          <div class="dagshode"><b>${navn}</b>${merke ? `<span>${merke}</span>` : ""}</div>
          ${hend.length ? hend.map((e) => `<div class="hendelse" data-kal="${e.kalender}">
              <span class="strek" style="background:${e.farge}"></span>
              <span class="tid">${this._tid(e, dato)}</span>
              <span><span class="navn">${e.tittel}</span>${
                e.sted ? `<br><span class="sted">${e.sted}</span>` : ""}</span></div>`).join("")
            : `<div class="${lastet ? "tom" : "laster"}">${
                lastet ? "Ingenting denne dagen" : "Henter hendelser …"}</div>`}
        </div>`);
      }
      liste = `<div class="liste">${bolker.join("")}</div>`;
    }

    this.shadowRoot.innerHTML = `<style>${KI_KAL_STIL}</style>
      <div class="rot">
        <div class="topp">
          <button class="pil" data-bla="-1"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
          <span class="mnd">${forste.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}</span>
          ${this._mnd !== 0 || this._iso(this._valgt) !== this._iso(na)
            ? `<button class="idag" data-idag="1">I dag</button>` : ""}
          <button class="pil" data-bla="1"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
        </div>
        ${filtre}
        <div class="kort">
          <div class="ukedager">${ukedager.map((u) => `<span>${u}</span>`).join("")}</div>
          <div class="rutenett">${celler.join("")}</div>
        </div>
        ${liste}
      </div>`;

    if (!this._bygget) {
      this._bygget = true;
      this.shadowRoot.addEventListener("click", (ev) => {
        const el = ev.composedPath().find((x) => x.dataset
          && (x.dataset.bla !== undefined || x.dataset.dato || x.dataset.kal || x.dataset.idag));
        if (!el) return;
        if (el.dataset.bla !== undefined) {
          this._mnd += Number(el.dataset.bla);
          this._tegn(); this._hent();
        } else if (el.dataset.idag !== undefined) {
          this._mnd = 0; this._valgt = this._idag(); this._tegn(); this._hent();
        } else if (el.dataset.dato) {
          const [å, m, d] = el.dataset.dato.split("-").map(Number);
          this._valgt = new Date(å, m - 1, d);
          /* Trykker du på en dag fra nabomåneden, blar kalenderen dit - ellers ville
             den valgte dagen ligget utenfor det du ser. */
          if (this._valgt.getMonth() !== this._vindu().forste.getMonth()) {
            this._mnd += this._valgt < this._vindu().forste ? -1 : 1;
            this._tegn(); this._hent(); return;
          }
          this._tegn();
        } else if (el.dataset.kal) {
          if (el.classList.contains("filter")) {
            if (this._av.has(el.dataset.kal)) this._av.delete(el.dataset.kal);
            else this._av.add(el.dataset.kal);
            this._tegn();
          } else {
            this.dispatchEvent(new CustomEvent("hass-more-info", {
              detail: { entityId: el.dataset.kal }, bubbles: true, composed: true,
            }));
          }
        }
      });
    }
  }
}

class KiKalenderCardEditor extends HTMLElement {
  setConfig(c) { this._c = { ...c }; }
  set hass(h) { this._h = h; this._tegn(); }

  _tegn() {
    if (!this._f) {
      this._f = document.createElement("ha-form");
      this._f.addEventListener("value-changed", (e) => {
        this._c = { ...e.detail.value };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._c }, bubbles: true, composed: true }));
      });
      this.appendChild(this._f);
    }
    this._f.hass = this._h;
    this._f.data = { tittel: "Kalender", prikker: 4, filtre: true, liste: true, dager_i_liste: 1, ...this._c };
    this._f.schema = [
      { name: "tittel", selector: { text: {} } },
      { name: "kalendere", selector: { entity: { domain: "calendar", multiple: true } } },
      { name: "start_dag", selector: { select: { mode: "dropdown", options: [
        { value: "mandag", label: "Mandag" }, { value: "sondag", label: "Søndag" }] } } },
      { name: "visning", selector: { select: { mode: "dropdown", options: [
        { value: "antall", label: "Merke med antallet" }, { value: "prikker", label: "Prikk per hendelse" }] } } },
      { name: "prikker", selector: { number: { min: 1, max: 8, mode: "box" } } },
      { name: "dager_i_liste", selector: { number: { min: 1, max: 14, mode: "box" } } },
      { name: "filtre", selector: { boolean: {} } },
      { name: "liste", selector: { boolean: {} } },
    ];
    this._f.computeLabel = (s) => ({
      tittel: "Tittel", kalendere: "Kalendere (tom = alle)", start_dag: "Uka begynner på",
      visning: "Slik vises hendelsene i rutenettet", prikker: "Prikker per dag (i prikkevisningen)", dager_i_liste: "Dager i lista under (1 = valgt dag)",
      filtre: "Vis filterpiller", liste: "Vis hendelsene under kalenderen",
    }[s.name] || s.name);
  }
}

if (!customElements.get("ki-kalender-card")) customElements.define("ki-kalender-card", KiKalenderCard);
if (!customElements.get("ki-kalender-card-editor")) customElements.define("ki-kalender-card-editor", KiKalenderCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-kalender-card", name: "KI Kalender",
  description: "Månedskalender med hendelsene fra kalenderne dine, filter per kalender og dagsliste under",
});

console.info(`%c KI-KALENDER-CARD %c v${KI_KAL_VERSJON} `,
  "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

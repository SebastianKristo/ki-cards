/* ki-hytte-card – hyttebesøk: kalender, opphold og statistikk.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-hytte-card
 * sted: Strömstad                 # velger riktig oversiktssensor når du har flere
 * oversikt: sensor.ki_hyttebesok_stromstad_oversikt   # oppdages automatisk
 * faner: [kalender, opphold, statistikk, helger]
 * alle_steder: true          # Opphold viser alle stedene, med filter øverst
 * sveip: true                # sveip mellom «Alle steder» og ett kort per sted
 * demo: true                 # eksempeldata for Oslo, Strömstad og Toten
 * helger: sensor.ki_hyttebesok_oslo_helger   # oppdages automatisk
 * maaneder: 1                     # antall måneder i kalenderen
 */
const KI_HYTTE_VERSJON = "2.1.0";

const KI_HYTTE_STIL = `
  :host { display:block; max-width:100%; overflow:hidden; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:12px; max-width:100%; }
  button { font:inherit; }

  /* ---- hero ---- */
  .hero { position:relative; overflow:hidden; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--gray200); color:var(--gray1000); padding:16px 18px; display:grid; gap:10px; min-height:104px;
    transition:background .6s var(--myk), color .4s; }
  .hero.her { background:linear-gradient(135deg, #2b5c46, #1d3a33); }
  .hero .tit { font-size:17px; font-weight:600; display:flex; align-items:center; gap:8px; }
  .hero .und { font-size:13px; opacity:.75; }
  .ansikter { display:flex; gap:-6px; }
  .prikk { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:var(--black,#000); margin-left:-8px; border:2px solid var(--gray200); }
  .prikk:first-child { margin-left:0; }
  .hero.her .prikk { border-color:#23483b; }
  .hero .tall { display:flex; gap:18px; margin-top:2px; }
  .hero .tall div { font-size:12px; opacity:.75; }
  .hero .tall b { display:block; font-size:20px; font-weight:400; opacity:1; font-variant-numeric:tabular-nums; }
  .synk { position:absolute; right:14px; top:14px; z-index:2; border:0; background:rgba(255,255,255,.12);
    color:inherit; width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center;
    justify-content:center; --mdc-icon-size:18px; }
  .synk:active { transform:scale(.92); }
  .synk.gaar ha-icon { animation:hy-snurr 1s linear infinite; }
  @keyframes hy-snurr { to { transform:rotate(360deg); } }
  .hytte { position:absolute; right:14px; bottom:-6px; width:104px; height:84px; opacity:.5; z-index:-1; }
  .hero.her .hytte { opacity:.75; }
  .royk { opacity:0; }
  .hero.her .royk { animation:hy-royk 4.2s ease-out infinite; }
  .hero.her .r2 { animation-delay:1.4s; } .hero.her .r3 { animation-delay:2.8s; }
  @keyframes hy-royk { 0% { opacity:.5; transform:translate(0,0) scale(.6); } 100% { opacity:0; transform:translate(-10px,-26px) scale(1.5); } }
  .vindu { fill:#ffd98a; opacity:.25; }
  .hero.her .vindu { opacity:.95; animation:hy-lys 5s ease-in-out infinite alternate; }
  @keyframes hy-lys { from { opacity:.7; } to { opacity:1; } }

  /* ---- sveip mellom stedene ---- */
  .sveip { position:relative; overflow:hidden; touch-action:pan-y; }
  .spor { display:flex; transition:transform .35s var(--myk); will-change:transform; }
  .spor.drar { transition:none; }
  .side { flex:0 0 100%; min-width:0; }
  .prikker { display:flex; gap:6px; justify-content:center; padding:8px 0 0; }
  .prikker i { width:7px; height:7px; border-radius:50%; background:var(--gray1000); opacity:.25;
    transition:opacity .25s, transform .25s; cursor:pointer; }
  .prikker i.valgt { opacity:.95; transform:scale(1.15); }

  /* master-kortet: alle stedene under ett */
  .hero.master { background:linear-gradient(135deg,#243447 0%,#1d2b3a 55%,#1e2a26 100%); }
  .stedrad { display:flex; gap:8px; flex-wrap:wrap; margin-top:2px; }
  .stedpille { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600;
    padding:5px 10px; border-radius:999px; background:rgba(255,255,255,.12); }
  .stedpille i { width:8px; height:8px; border-radius:3px; }

  /* ---- faner ---- */
  .faner { display:flex; justify-content:center; }
  .skinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
  .fane { border:0; background:none; color:rgba(255,255,255,.72); font-size:13px; font-weight:500; padding:6px 14px;
    border-radius:999px; cursor:pointer; white-space:nowrap; transition:background .2s, color .2s; }
  .fane.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .panel { display:none; } .panel.valgt { display:grid; gap:12px; }

  /* ---- kalender ---- */
  .kal { background:var(--gray200); border-radius:20px; padding:14px; }
  .kaltopp { display:grid; grid-template-columns:min-content 1fr min-content; align-items:center; gap:10px; padding:0 2px 10px; }
  .kaltopp .mnd { text-align:center; font-size:15px; font-weight:600; text-transform:capitalize; }
  .pil { border:0; background:var(--gray100); color:var(--gray1000); width:32px; height:32px; border-radius:50%;
    cursor:pointer; display:flex; align-items:center; justify-content:center; --mdc-icon-size:20px; }
  .pil:active { transform:scale(.92); }
  .ukedager { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; padding-bottom:4px; }
  .ukedager span { text-align:center; font-size:11px; font-weight:600; opacity:.45; }
  .rutenett { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .dag { position:relative; aspect-ratio:1; border-radius:12px; background:var(--gray100); display:flex;
    align-items:center; justify-content:center; font-size:13px; font-weight:500; cursor:default;
    transition:transform .12s var(--fjaer); }
  .dag.utenfor { opacity:.25; background:transparent; }
  .dag.idag { outline:2px solid var(--active-big,#ee95ff); outline-offset:-2px; font-weight:700; }
  .dag.fremtid { border:1px dashed rgba(255,255,255,.25); }
  .dag.harbesok { color:var(--black,#000); font-weight:700; }
  .dag .strimler { position:absolute; inset:0; border-radius:12px; overflow:hidden; display:flex; z-index:0; }
  .dag .nr { position:relative; z-index:1; }
  .dag .strimler i { flex:1; }
  .dag:hover { transform:scale(1.06); }
  .navn { display:flex; flex-wrap:wrap; gap:8px; padding:12px 2px 0; }
  .navn span { display:inline-flex; align-items:center; gap:6px; font-size:12px; opacity:.8; }
  .navn i { width:10px; height:10px; border-radius:3px; }

  /* ---- lister ---- */
  .liste { background:var(--gray200); border-radius:20px; overflow:hidden; }
  .rad { display:grid; grid-template-columns:40px 1fr min-content; gap:12px; align-items:center; padding:12px 14px;
    border-top:1px solid rgba(255,255,255,.06); }
  .rad:first-child { border-top:0; }
  .rad .n { font-size:14px; font-weight:500; }
  .rad .d { font-size:12px; opacity:.6; }
  .rad .netter { font-size:13px; font-weight:600; white-space:nowrap; }
  .tom { padding:22px; text-align:center; font-size:13px; opacity:.6; }
  /* stedsfilter i oppholdsfanen */
  .stedfilter { display:flex; justify-content:center; }
  .stedskinne { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px;
    max-width:100%; overflow-x:auto; scrollbar-width:none; }
  .stedskinne::-webkit-scrollbar { display:none; }
  .stedknapp { border:0; background:none; color:rgba(255,255,255,.72); font:inherit; font-size:12.5px; font-weight:500;
    padding:6px 13px; border-radius:999px; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:6px; }
  .stedknapp i { width:8px; height:8px; border-radius:3px; }
  .stedknapp.valgt { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); }
  .stedmerke { font-size:10px; font-weight:700; padding:3px 7px; border-radius:6px; white-space:nowrap;
    background:rgba(255,255,255,.09); }

  /* ---- statistikk ---- */
  .stolper { background:var(--gray200); border-radius:20px; padding:16px; display:grid; gap:10px; }
  .mndrad { display:grid; grid-template-columns:34px 1fr 34px; gap:10px; align-items:center; font-size:12px; }
  .mndrad .spor { height:10px; border-radius:6px; background:var(--gray100); overflow:hidden; display:flex; }
  .mndrad .spor i { height:100%; }
  .mndrad .t { text-align:right; font-variant-numeric:tabular-nums; opacity:.7; }
  .pkort { background:var(--gray200); border-radius:20px; padding:14px 16px; display:grid;
    grid-template-columns:36px 1fr min-content; gap:12px; align-items:center; }
  .pkort .stor { font-size:20px; font-weight:400; font-variant-numeric:tabular-nums; }

  /* ---- helger ---- */
  .helg { background:var(--gray200); border-radius:18px; padding:14px 16px; display:grid; gap:8px; }
  .helg .topp { display:flex; align-items:baseline; gap:10px; }
  .helg .uke { font-size:15px; font-weight:600; }
  .helg .dato { font-size:12px; opacity:.55; }
  .helg .sammen { margin-left:auto; font-size:10px; font-weight:700; padding:3px 8px; border-radius:7px;
    background:rgba(255,255,255,.1); }
  .helg .steder { display:grid; gap:6px; }
  .helg .sted { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; font-size:13px; }
  .helg .sted .navn { display:flex; align-items:center; gap:7px; font-weight:500; }
  .helg .sted .navn i { width:9px; height:9px; border-radius:3px; }
  .helg .folk { display:flex; gap:-6px; }
  .helg .folk .prikk { width:24px; height:24px; font-size:11px; margin-left:-7px; border-color:var(--gray200); }
  .helg .folk .prikk:first-child { margin-left:0; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiHyEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KI_HY_UKE = ["ma", "ti", "on", "to", "fr", "lø", "sø"];
const KI_HY_MND = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const kiHyDato = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const kiHyKort = (iso) => { const d = new Date(iso); return `${d.getDate()}. ${KI_HY_MND[d.getMonth()].slice(0, 3)}`; };

class KiHytteCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._fane = "kalender"; this._mnd = 0; this._sted = null; }
  static getConfigElement() { return document.createElement("ki-hytte-card-editor"); }
  static getStubConfig() { return {}; }
  getCardSize() { return 10; }

  setConfig(c) {
    this._c = { faner: ["kalender", "opphold", "statistikk"], maaneder: 1, ...(c || {}) };
    this._fane = this._c.faner[0]; this._bygget = false; this._tegn();
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    const id = this._id();
    if (!g || !this._bygget || (id && g.states[id] !== h.states[id])) this._tegn();
  }

  /* Finner oversiktssensoren fra KI Hyttebesøk – riktig sted når du har flere */
  _id() {
    if (this._c.oversikt) return this._c.oversikt;
    const h = this._h; if (!h) return null;
    const alle = Object.keys(h.states).filter((x) => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_hyttebesok" && a.ki_type === "oversikt";
    });
    if (this._c.sted) {
      const rens = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/ö/g, "o");
      const treff = alle.find((x) => rens((h.states[x].attributes || {}).sted) === rens(this._c.sted));
      if (treff) return treff;
    }
    return alle[0] || null;
  }
  _data() {
    if (this._c && this._c.demo) return this._demo()[0];
    const s = this._h && this._id() ? this._h.states[this._id()] : null;
    return s ? s.attributes : null;
  }
  _farge(navn, d) {
    if (d && d.master) return this._stedFarge2(navn);
    const liste = (d && d.personer) || [];
    const p = liste.find((x) => String(x.navn || x).toLowerCase() === String(navn).toLowerCase());
    if (p && p.farge) return p.farge;
    /* helgeoversikten har bare navn – gi hver person sin faste farge */
    const alle = liste.map((x) => String(x.navn || x));
    const i = Math.max(0, alle.indexOf(String(navn)));
    return ["var(--green)", "var(--blue)", "var(--yellow)", "var(--orange)", "var(--active-big)"][i % 5];
  }
  _mer() { const id = this._id(); if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }

  /* ---------------------------------------------------------- kalenderen */
  _kalender(d) {
    const nå = new Date(); nå.setHours(0, 0, 0, 0);
    const vist = new Date(nå.getFullYear(), nå.getMonth() + this._mnd, 1);
    const forste = new Date(vist.getFullYear(), vist.getMonth(), 1);
    const start = new Date(forste);
    start.setDate(1 - ((forste.getDay() + 6) % 7));           /* mandag først */
    const dager = d.dager || {};
    const ruter = [];
    for (let i = 0; i < 42; i++) {
      const dag = new Date(start); dag.setDate(start.getDate() + i);
      const iso = kiHyDato(dag);
      const folk = dager[iso] || [];
      const utenfor = dag.getMonth() !== vist.getMonth();
      const idag = dag.getTime() === nå.getTime();
      const fremtid = dag > nå && folk.length;
      ruter.push(`<div class="dag ${utenfor ? "utenfor" : ""} ${idag ? "idag" : ""} ${fremtid ? "fremtid" : ""}
        ${folk.length ? "harbesok" : ""}" title="${kiHyEsc(folk.join(", "))}">
        ${folk.length ? `<span class="strimler">${folk.map((n) =>
          `<i style="background:${kiHyEsc(this._farge(n, d))}"></i>`).join("")}</span>` : ""}
        <span class="nr">${dag.getDate()}</span></div>`);
    }
    const kanTilbake = this._mnd > -24, kanFram = this._mnd < 12;
    return `<div class="kal">
      <div class="kaltopp">
        <button class="pil" data-mnd="-1" ${kanTilbake ? "" : "disabled"}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <div class="mnd">${KI_HY_MND[vist.getMonth()]} ${vist.getFullYear()}</div>
        <button class="pil" data-mnd="1" ${kanFram ? "" : "disabled"}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>
      <div class="ukedager">${KI_HY_UKE.map((u) => `<span>${u}</span>`).join("")}</div>
      <div class="rutenett">${ruter.join("")}</div>
      <div class="navn">${(d.personer || []).map((p) =>
        `<span><i style="background:${kiHyEsc(p.farge)}"></i>${kiHyEsc(p.navn)}</span>`).join("")}
        <span style="margin-left:auto;opacity:.5">stiplet = planlagt${
          d.sist_lest ? " · lest " + kiHyEsc(String(d.sist_lest).slice(11, 16)) : ""}</span></div>
    </div>`;
  }

  /* ---------------------------------------------------------- oppholdene */
  /* Alle stedene under ett: leser alle oversiktssensorene fra KI Hyttebesøk */
  /* Eksempeldata, så oppsettet kan prøves før alle stedene er lagt inn */
  _demo() {
    if (this._demoData) return this._demoData;
    const i_dag = new Date(); i_dag.setHours(0, 0, 0, 0);
    const dag = (n) => { const d = new Date(i_dag); d.setDate(d.getDate() + n); return kiHyDato(d); };
    const folk = [["Sebastian", "var(--green)"], ["Rune", "var(--blue)"], ["Cybele", "var(--yellow)"]];
    const lagSted = (sted, rolle, opphold, kommende, her) => {
      const dager = {};
      [...opphold, ...kommende].forEach((o) => {
        const a = new Date(o.start), b = new Date(o.slutt);
        for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
          const n = kiHyDato(d);
          dager[n] = dager[n] || [];
          if (!dager[n].includes(o.person)) dager[n].push(o.person);
        }
      });
      const netter = opphold.reduce((sum, o) => sum + o.netter, 0);
      return {
        id: `sensor.demo_${sted.toLowerCase()}`, integrasjon: "ki_hyttebesok", ki_type: "oversikt",
        sted, rolle, her_naa: her, personer: folk.map(([navn, farge]) => ({ navn, farge, netter_i_aar: 0, besok_i_aar: 0 })),
        netter_i_aar: netter, besok_i_aar: opphold.length, siste: opphold[0] || null,
        kommende, opphold, dager,
        per_maaned: Array.from({ length: 12 }, (_, i) => ({ maaned: i + 1,
          navn: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"][i],
          netter: [3, 1, 4, 2, 5, 8, 11, 9, 4, 0, 0, 2][i], personer: {} })),
        sist_lest: new Date().toISOString().slice(0, 16),
      };
    };
    this._demoData = [
      lagSted("Oslo", "hjem",
        [{ person: "Rune", start: dag(-6), slutt: dag(-4), netter: 3 },
         { person: "Sebastian", start: dag(-2), slutt: dag(0), netter: 3 }],
        [], [{ navn: "Sebastian", farge: "var(--green)", siden: dag(-2) }]),
      lagSted("Strömstad", "hytte",
        [{ person: "Sebastian", start: dag(-13), slutt: dag(-9), netter: 5 },
         { person: "Cybele", start: dag(-13), slutt: dag(-10), netter: 4 }],
        [{ person: "Sebastian", start: dag(11), slutt: dag(15), netter: 5 }], []),
      lagSted("Toten", "hytte",
        [{ person: "Cybele", start: dag(-22), slutt: dag(-19), netter: 4 }], [], []),
    ];
    return this._demoData;
  }

  _alleSteder() {
    if (this._c && this._c.demo) return this._demo();
    const h = this._h; if (!h) return [];
    return Object.keys(h.states)
      .filter((x) => {
        const a = h.states[x].attributes || {};
        return a.integrasjon === "ki_hyttebesok" && a.ki_type === "oversikt";
      })
      .map((x) => ({ id: x, ...h.states[x].attributes }))
      .sort((a, b) => (a.rolle === "hjem" ? -1 : b.rolle === "hjem" ? 1 : String(a.sted).localeCompare(String(b.sted), "nb")));
  }
  _stedFarge2(sted) {
    const alle = this._alleSteder();
    const s = alle.find((x) => x.sted === sted);
    if (s && s.rolle === "hjem") return "var(--green)";
    const i = Math.max(0, alle.findIndex((x) => x.sted === sted));
    return ["var(--blue)", "var(--yellow)", "var(--orange)", "var(--active-big)"][i % 4];
  }

  /* «Alle steder»: slår sammen de tre stedene til ett datasett.
     Kalenderdagene fargelegges da etter sted i stedet for person. */
  _master() {
    const alle = this._alleSteder();
    if (!alle.length) return null;
    const dager = {};
    const kommende = [], opphold = [];
    let netter = 0, besok = 0;
    const her = [];
    alle.forEach((x) => {
      netter += Number(x.netter_i_aar || 0);
      besok += Number(x.besok_i_aar || 0);
      (x.her_naa || []).forEach((p) => her.push({ ...p, sted: x.sted, farge: this._stedFarge2(x.sted) }));
      (x.kommende || []).forEach((o) => kommende.push({ ...o, sted: x.sted }));
      (x.opphold || []).forEach((o) => opphold.push({ ...o, sted: x.sted }));
      Object.keys(x.dager || {}).forEach((dag) => {
        dager[dag] = dager[dag] || [];
        if (!dager[dag].includes(x.sted)) dager[dag].push(x.sted);
      });
    });
    kommende.sort((a, b) => String(a.start).localeCompare(String(b.start)));
    opphold.sort((a, b) => String(b.start).localeCompare(String(a.start)));
    /* måned for måned, fordelt på sted */
    const maaneder = [];
    for (let m = 1; m <= 12; m++) {
      const rad = { maaned: m, navn: (alle[0].per_maaned || [])[m - 1]?.navn || String(m), netter: 0, personer: {} };
      alle.forEach((x) => {
        const kilde = (x.per_maaned || [])[m - 1];
        if (!kilde) return;
        rad.netter += Number(kilde.netter || 0);
        if (kilde.netter) rad.personer[x.sted] = (rad.personer[x.sted] || 0) + Number(kilde.netter);
      });
      maaneder.push(rad);
    }
    return {
      master: true, sted: "Alle steder", her_naa: her,
      personer: alle.map((x) => ({ navn: x.sted, farge: this._stedFarge2(x.sted), sted: true,
        netter_i_aar: x.netter_i_aar, besok_i_aar: x.besok_i_aar, siste: x.siste })),
      netter_i_aar: netter, besok_i_aar: besok,
      siste: opphold[0] || null, kommende: kommende.slice(0, 12), opphold: opphold.slice(0, 40),
      per_maaned: maaneder, dager, steder: alle.map((x) => ({ sted: x.sted, rolle: x.rolle })),
      sist_lest: alle[0].sist_lest,
    };
  }

  _opphold(d) {
    const rad = (o, fremtid) => `<div class="rad">
      <span class="prikk" style="background:${kiHyEsc(this._farge(o.person, d))};margin:0">${kiHyEsc(String(o.person || "?").slice(0, 1))}</span>
      <div><div class="n">${kiHyEsc(o.person)}${o.sted && d.master && !this._sted
        ? ` <span class="stedmerke" style="color:${kiHyEsc(this._stedFarge2(o.sted))}">${kiHyEsc(o.sted)}</span>` : ""}</div>
        <div class="d">${kiHyKort(o.start)}${o.slutt !== o.start ? " – " + kiHyKort(o.slutt) : ""}${fremtid ? " · planlagt" : ""}</div></div>
      <div class="netter">${o.netter} ${o.netter === 1 ? "natt" : "netter"}</div>
    </div>`;
    const alle = this._alleSteder();
    const flere = this._c.alle_steder !== false && alle.length > 1;
    /* på et stedskort vises bare det stedet, på masterkortet kan du filtrere */
    const valgt = d.master ? (this._sted === undefined ? null : this._sted) : d.sted;
    const kilder = flere && d.master ? (valgt ? alle.filter((x) => x.sted === valgt) : alle) : [d];
    const merk = (liste, sted) => (liste || []).map((o) => ({ ...o, sted }));
    const komm = kilder.flatMap((x) => merk(x.kommende, x.sted))
      .sort((a, b) => String(a.start).localeCompare(String(b.start)));
    const hist = kilder.flatMap((x) => merk(x.opphold, x.sted))
      .sort((a, b) => String(b.start).localeCompare(String(a.start))).slice(0, 40);

    const filter = flere && d.master ? `<div class="stedfilter"><div class="stedskinne">
      <button class="stedknapp ${valgt ? "" : "valgt"}" data-sted="">Alle</button>
      ${alle.map((x) => `<button class="stedknapp ${valgt === x.sted ? "valgt" : ""}" data-sted="${kiHyEsc(x.sted)}">
        <i style="background:${kiHyEsc(this._stedFarge2(x.sted))}"></i>${kiHyEsc(x.sted)}</button>`).join("")}
    </div></div>` : "";

    const kommende = komm.map((o) => rad(o, true)).join("");
    const gamle = hist.map((o) => rad(o, false)).join("");
    return `${filter}
      ${kommende ? `<div><div class="hero" style="min-height:0;padding:12px 16px">
        <div class="tit"><ha-icon icon="mdi:calendar-arrow-right"></ha-icon>Planlagt framover</div></div></div>
      <div class="liste">${kommende}</div>` : ""}
      <div class="liste">${gamle || `<div class="tom">Ingen registrerte opphold ennå.</div>`}</div>`;
  }

  /* ---------------------------------------------------------- statistikk */
  _statistikk(d) {
    const mnd = d.per_maaned || [];
    const maks = Math.max(1, ...mnd.map((m) => m.netter));
    return `<div class="stolper">
      <div class="d" style="opacity:.6;font-size:12px">Netter per måned i år</div>
      ${mnd.map((m) => `<div class="mndrad">
        <span style="opacity:.6">${kiHyEsc(m.navn.slice(0, 3))}</span>
        <span class="spor">${Object.keys(m.personer || {}).map((n) =>
          `<i style="width:${((m.personer[n] / maks) * 100).toFixed(1)}%;background:${kiHyEsc(this._farge(n, d))}"></i>`).join("")}</span>
        <span class="t">${m.netter || ""}</span></div>`).join("")}
    </div>
    ${(d.personer || []).map((p) => `<div class="pkort">
      <span class="prikk" style="background:${kiHyEsc(p.farge)};margin:0">${kiHyEsc(p.navn.slice(0, 1))}</span>
      <div><div class="n">${kiHyEsc(p.navn)}</div>
        <div class="d">${p.besok_i_aar} ${p.besok_i_aar === 1 ? "besøk" : "besøk"} i år${
          p.siste ? ` · sist ${kiHyKort(p.siste.start)}` : ""}</div></div>
      <div class="stor">${p.netter_i_aar}<span style="font-size:12px;opacity:.6"> netter</span></div>
    </div>`).join("")}`;
  }

  /* Helgeoversikten kommer fra hjemme-oppføringen og dekker alle stedene */
  _helgedata() {
    const h = this._h; if (!h) return null;
    const id = this._c.helger || Object.keys(h.states).find((x) => {
      const a = h.states[x].attributes || {};
      return a.integrasjon === "ki_hyttebesok" && a.ki_type === "helger";
    });
    return id && h.states[id] ? h.states[id].attributes : null;
  }
  _stedFarge(sted, d) {
    const hytte = (d.steder || []).find((s) => s.sted === sted);
    if (hytte && hytte.rolle === "hjem") return "var(--green)";
    const i = Math.max(0, (d.steder || []).findIndex((s) => s.sted === sted));
    return ["var(--blue)", "var(--yellow)", "var(--orange)", "var(--active-big)"][i % 4];
  }
  _helger() {
    const d = this._helgedata();
    if (!d || !(d.helger || []).length)
      return `<div class="tom">Fant ingen helgeoversikt. Merk hjemmet som «Hjemme» i KI Hyttebesøk.</div>`;
    const mnd = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
    const kort = (h) => {
      const lor = new Date(h.lordag), son = new Date(h.sondag);
      const dato = lor.getMonth() === son.getMonth()
        ? `${lor.getDate()}.–${son.getDate()}. ${mnd[son.getMonth()]}`
        : `${lor.getDate()}. ${mnd[lor.getMonth()]} – ${son.getDate()}. ${mnd[son.getMonth()]}`;
      const steder = Object.keys(h.steder || {});
      return `<div class="helg">
        <div class="topp"><span class="uke">Uke ${h.uke}</span><span class="dato">${kiHyEsc(dato)}</span>
          ${h.sammen && steder.length ? `<span class="sammen">Samlet</span>` : ""}</div>
        <div class="steder">${steder.map((s) => `<div class="sted">
          <span class="navn"><i style="background:${kiHyEsc(this._stedFarge(s, d))}"></i>${kiHyEsc(s)}</span>
          <span class="folk">${(h.steder[s] || []).map((p) =>
            `<span class="prikk" style="background:${kiHyEsc(this._farge(p, d))}" title="${kiHyEsc(p)}">${kiHyEsc(p.slice(0, 1))}</span>`).join("")}</span>
        </div>`).join("")}</div>
      </div>`;
    };
    return (d.helger || []).map(kort).join("");
  }

  /* Sveip mellom stedene, med retningslås så siden kan rulles som normalt */
  _koblSveip(r, antall) {
    if (antall < 2) return;
    const boks = r.querySelector(".sveip"), spor = r.querySelector(".spor");
    if (!boks || !spor) return;
    const gaTil = (i) => {
      this._side = Math.max(0, Math.min(antall - 1, i));
      this._sted = null;
      this._forrige = null;
      this._tegn();
    };
    let x0 = null, y0 = 0, dx = 0, retning = null;
    boks.addEventListener("pointerdown", (e) => { if (e.target.closest(".synk")) return; x0 = e.clientX; y0 = e.clientY; dx = 0; retning = null; });
    boks.addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (retning === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        retning = Math.abs(dx) > Math.abs(dy) * 1.3 ? "vannrett" : "loddrett";
        if (retning === "vannrett") spor.classList.add("drar");
      }
      if (retning !== "vannrett") return;
      if (e.cancelable) e.preventDefault();
      spor.style.transform = `translateX(calc(-${this._side * 100}% + ${dx * 0.7}px))`;
    });
    const slipp = () => {
      if (x0 === null) return;
      spor.classList.remove("drar");
      const bytt = retning === "vannrett" && Math.abs(dx) > 55;
      spor.style.transform = `translateX(-${this._side * 100}%)`;
      if (bytt) { this._sveipet = true; gaTil(this._side + (dx < 0 ? 1 : -1)); }
      x0 = null; dx = 0; retning = null;
    };
    boks.addEventListener("pointerup", slipp);
    boks.addEventListener("pointercancel", slipp);
    boks.addEventListener("pointerleave", slipp);
    r.querySelectorAll("[data-s]").forEach((p) => p.addEventListener("click", () => gaTil(+p.dataset.s)));
  }

  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const d = this._data();
    if (!d) {
      this.shadowRoot.innerHTML = `<style>${KI_HYTTE_STIL}</style>
        <div class="tom">Fant ingen oversikt fra <b>KI Hyttebesøk</b>. Sett <code>oversikt:</code> manuelt hvis du har flere steder.</div>`;
      this._bygget = false;
      return;
    }
    const navn = { kalender: "Kalender", opphold: "Opphold", statistikk: "Statistikk", helger: "Helger" };
    const heroFor = (dd) => {
      const her = dd.her_naa || [];
      const siste = dd.siste;
      return `<div class="hero ${her.length ? "her" : ""} ${dd.master ? "master" : ""}" role="button" tabindex="0">
      <svg class="hytte" viewBox="0 0 120 90" aria-hidden="true">
        <g fill="currentColor" opacity=".9">
          <path d="M18 44 60 16l42 28v40H18z" opacity=".35"/>
          <path d="M14 46 60 14l46 32-4 5-42-29-42 29z"/>
          <rect x="74" y="24" width="10" height="16" rx="2" opacity=".6"/>
        </g>
        <rect class="vindu" x="40" y="52" width="16" height="14" rx="3"/>
        <rect class="vindu" x="66" y="52" width="16" height="14" rx="3"/>
        <g fill="#eaf6ff"><circle class="royk" cx="79" cy="20" r="4"/>
          <circle class="royk r2" cx="79" cy="20" r="3"/><circle class="royk r3" cx="79" cy="20" r="5"/></g>
      </svg>
      <button class="synk" data-synk="1" title="Les kalenderen på nytt"><ha-icon icon="mdi:calendar-sync"></ha-icon></button>
      <div class="tit"><span>${kiHyEsc(dd.sted || "Hytta")}</span>
        <span class="ansikter">${her.map((p) =>
          `<span class="prikk" style="background:${kiHyEsc(p.farge)}">${kiHyEsc(p.navn.slice(0, 1))}</span>`).join("")}</span></div>
      <div class="und">${her.length
        ? `${her.map((p) => kiHyEsc(p.navn)).join(", ")} er her${her[0].siden ? " siden " + kiHyKort(her[0].siden) : ""}`
        : siste ? `Tomt nå · sist ${kiHyEsc(siste.person)} ${kiHyKort(siste.start)}` : "Tomt nå"}</div>
      <div class="tall">
        <div><b>${dd.netter_i_aar || 0}</b>netter i år</div>
        <div><b>${dd.besok_i_aar || 0}</b>besøk i år</div>
        ${(dd.kommende || []).length ? `<div><b>${kiHyKort(dd.kommende[0].start)}</b>neste besøk</div>` : ""}
      </div>
      ${dd.master ? `<div class="stedrad">${(dd.personer || []).map((x) =>
        `<span class="stedpille"><i style="background:${kiHyEsc(x.farge)}"></i>${kiHyEsc(x.navn)} ${x.netter_i_aar || 0}</span>`).join("")}</div>` : ""}
    </div>`;
    };

    const alleSteder = this._alleSteder();
    const sider = this._c.sveip !== false && alleSteder.length > 1
      ? [this._master(), ...alleSteder] : [d];
    if (this._side === undefined || this._side >= sider.length) this._side = 0;
    this._antallSider = sider.length;
    const valgtD = sider[this._side] || d;
    const heroer = sider.length > 1
      ? `<div class="sveip"><div class="spor" style="transform:translateX(-${this._side * 100}%)">
          ${sider.map((x) => `<div class="side">${heroFor(x)}</div>`).join("")}</div></div>
        <div class="prikker">${sider.map((_, i) =>
          `<i class="${i === this._side ? "valgt" : ""}" data-s="${i}" title="${kiHyEsc(sider[i].sted || "")}"></i>`).join("")}</div>`
      : heroFor(d);

    const html = `<style>${KI_HYTTE_STIL}</style>
      <div class="rot">
        ${heroer}
        ${c.faner.length > 1 ? `<div class="faner"><div class="skinne" role="tablist">${c.faner.map((f) =>
          `<button class="fane ${f === this._fane ? "valgt" : ""}" data-f="${f}">${navn[f] || f}</button>`).join("")}</div></div>` : ""}
        ${c.faner.map((f) => `<div class="panel ${f === this._fane ? "valgt" : ""}" data-p="${f}">${
          f === "kalender" ? this._kalender(valgtD) : f === "opphold" ? this._opphold(valgtD)
          : f === "helger" ? this._helger() : this._statistikk(valgtD)}</div>`).join("")}
      </div>`;

    if (html !== this._forrige) { this.shadowRoot.innerHTML = html; this._forrige = html; this._kobl(); }
    this._bygget = true;
  }

  _kobl() {
    const r = this.shadowRoot;
    const hero = r.querySelector(".hero");
    if (hero) hero.addEventListener("click", () => this._mer());
    this._koblSveip(r, this._antallSider || 1);
    const synk = r.querySelector("[data-synk]");
    if (synk) synk.addEventListener("click", (e) => {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(10);
      synk.classList.add("gaar");
      setTimeout(() => synk.classList.remove("gaar"), 2500);
      /* knappen fra integrasjonen om den finnes, ellers tjenesten */
      const knapp = Object.keys(this._h.states).find((x) => x.startsWith("button.")
        && (this._h.states[x].attributes || {}).integrasjon === "ki_hyttebesok"
        && (this._h.states[x].attributes || {}).ki_type === "synk");
      if (knapp) this._h.callService("button", "press", { entity_id: knapp });
      else this._h.callService("ki_hyttebesok", "les_kalender", {});
    });
    r.querySelectorAll(".fane").forEach((b) => b.addEventListener("click", () => { this._fane = b.dataset.f; this._forrige = null; this._tegn(); }));
    r.querySelectorAll("[data-sted]").forEach((b) => b.addEventListener("click", () => {
      this._sted = b.dataset.sted || null; this._forrige = null; this._tegn();
    }));
    r.querySelectorAll("[data-mnd]").forEach((b) => b.addEventListener("click", () => {
      this._mnd += Number(b.dataset.mnd); this._forrige = null; this._tegn();
    }));
  }
}
if (!customElements.get("ki-hytte-card")) customElements.define("ki-hytte-card", KiHytteCard);

class KiHytteCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { sted: "Sted (tomt = første)", oversikt: "Oversiktssensor", maaneder: "Måneder i kalenderen" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "sted", selector: { text: {} } },
      { name: "oversikt", selector: { entity: { domain: ["sensor"] } } },
    ];
  }
}
if (!customElements.get("ki-hytte-card-editor")) customElements.define("ki-hytte-card-editor", KiHytteCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-hytte-card")) window.customCards.push({ type: "ki-hytte-card", name: "KI Hytte", description: "Hyttebesøk: kalender, opphold og statistikk", preview: true });

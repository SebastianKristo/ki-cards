/* ki-ruter-card – kollektivavganger fra Entur med avvik fra Ruter. Frittstående, ingen avhengigheter.
 * Del av ki-cards-bundelen; kan også legges i /config/www/ og lastes som JavaScript-modul alene.
 *
 * type: custom:ki-ruter-card
 * tittel: Ruter                    ikon: mdi:bus-clock
 * visning: valgt | alle            # valgt = én tavle med holdeplassvelger, alle = alle under hverandre
 * maks: 5                          # avganger per holdeplass
 * gange: 4                         # minutter å gå – avganger du ikke rekker tones ned
 * bakgrunn: var(--gray200)         # bakgrunnsfarge på kortet
 * maks_bredde: 620px               # innholdet strekkes ikke bredere enn dette
 * bakgrunn_glod: false             # slår av det fargede skjæret øverst
 * vis_neste: true                  # den store «neste avgang»-blokken
 * vis_avvik: true    vis_linjer: true    vis_sanntid: true
 * stops:
 *   - entity: sensor.transport_majorstuen
 *     name: Majorstuen             icon: mdi:subway-variant     gange: 7
 *     linjer: ['1', '2']           # vis bare disse linjene
 * disruptions:
 *   summary: sensor.ruter_disruption_summary
 *   lines: [ { entity: sensor.ruter_disruption_rut_line_1, name: '1' } ]
 *
 * Nedtellingen går hvert tiende sekund uten å vente på Home Assistant.
 */
const KI_RUTER_VERSJON = "4.0.0";

const KI_R_MODUS = {
  bus: { ikon: "mdi:bus", farge: "#e2483d", navn: "Buss" },
  tram: { ikon: "mdi:tram", farge: "#2b7fd1", navn: "Trikk" },
  metro: { ikon: "mdi:subway-variant", farge: "#ec700c", navn: "T-bane" },
  rail: { ikon: "mdi:train", farge: "#3ca66e", navn: "Tog" },
  train: { ikon: "mdi:train", farge: "#3ca66e", navn: "Tog" },
  water: { ikon: "mdi:ferry", farge: "#00a2b6", navn: "Båt" },
  ferry: { ikon: "mdi:ferry", farge: "#00a2b6", navn: "Båt" },
  air: { ikon: "mdi:airplane", farge: "#8a6fd1", navn: "Fly" },
};

const KI_R_STIL = `
  :host { display:block; max-width:100%; --myk:cubic-bezier(.2,.8,.2,1); --fjaer:cubic-bezier(.3,1.35,.5,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .ramme { max-width:100%; color:var(--gray1000, var(--primary-text-color)); }
  .kort { position:relative; isolation:isolate; border-radius:var(--ha-card-border-radius,24px);
    background:var(--kort-bg, var(--gray200, var(--card-background-color)));
    color:var(--gray1000, var(--primary-text-color)); padding:18px; display:grid; gap:14px; }
  .glo { position:absolute; inset:0; z-index:-1; overflow:hidden; border-radius:inherit; pointer-events:none; }
  .glo::before { content:""; position:absolute; inset:-45% -20% auto -20%; height:150%;
    background:radial-gradient(ellipse at 50% 0%, var(--tone,#2b7fd1) 0%, transparent 62%);
    opacity:calc(.22 * var(--glod, 1)); }
  .kort > * { max-width:var(--maks, 620px); margin-inline:auto; width:100%; }
  button { font:inherit; border:0; background:none; color:inherit; font-family:inherit; }
  [data-a] { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; border-radius:14px; }

  /* ---- topp ---- */
  .topp { display:flex; align-items:center; gap:12px; }
  .topp .ikon { width:48px; height:48px; border-radius:50%; flex:none; display:flex; align-items:center;
    justify-content:center; background:rgba(250,251,252,.10); --mdc-icon-size:24px; }
  .topp .tittel { font-size:19px; font-weight:700; letter-spacing:-.01em; flex:1; }
  .topp .klokke { font-size:12px; opacity:.5; font-variant-numeric:tabular-nums; white-space:nowrap; }

  /* ---- holdeplassvelger: samme pillerad som fanene ellers ---- */
  .valg { display:flex; gap:4px; padding:3px; border-radius:999px; width:fit-content; max-width:100%;
    margin-inline:auto; overflow-x:auto; scrollbar-width:none;
    border:1px solid color-mix(in srgb, var(--gray1000) 22%, transparent); }
  .valg::-webkit-scrollbar { display:none; }
  .valg .v { display:inline-flex; align-items:center; gap:7px; padding:8px 16px; border-radius:999px;
    font-size:14px; font-weight:500; white-space:nowrap; --mdc-icon-size:17px; cursor:pointer;
    color:color-mix(in srgb, var(--gray1000) 72%, transparent); transition:background .2s, color .2s; }
  .valg .v.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95); font-weight:600;
    box-shadow:0 1px 6px rgba(0,0,0,.35); }
  .valg .v b { font-variant-numeric:tabular-nums; font-weight:700; opacity:.7; }
  .valg .v.aktiv b { opacity:.85; }

  /* ---- neste avgang ---- */
  .neste { display:flex; align-items:center; gap:14px; padding:16px; border-radius:24px;
    background:linear-gradient(120deg, color-mix(in srgb, var(--lf,#2b7fd1) 92%, #000) 0%, var(--lf,#2b7fd1) 100%);
    color:#fff; }
  .neste .tekst { flex:1; min-width:0; }
  .neste .mot { font-size:17px; font-weight:700; letter-spacing:-.01em;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .neste .hvor { font-size:13px; opacity:.78; margin-top:3px; line-height:1.35; }
  .neste .stor { font-size:40px; font-weight:600; line-height:1; font-variant-numeric:tabular-nums;
    letter-spacing:-.03em; text-align:right; }
  .neste .stor small { display:block; font-size:12px; font-weight:500; opacity:.75; letter-spacing:0; margin-top:3px; }

  /* ---- avgangsrader: samme pilleform som sensorlistene ---- */
  .tavle { display:grid; gap:8px; }
  .tavle + .tavle { margin-top:6px; }
  .tavlehode { display:flex; align-items:center; gap:12px; padding:2px 4px; }
  .tavlehode .navn { display:flex; align-items:center; gap:10px; font-size:17px; font-weight:700;
    letter-spacing:-.01em; flex:1; min-width:0; }
  .tavlehode .navn ha-icon { --mdc-icon-size:21px; flex:none; }
  .tavlehode .meta { font-size:13px; font-weight:500; opacity:.55; text-align:right; white-space:nowrap; }

  .avg { display:flex; align-items:center; gap:14px; min-height:70px; padding:10px 18px 10px 10px;
    border-radius:22px; background:var(--gray100); transition:background .3s var(--myk), opacity .3s; }
  .avg.snart { background:color-mix(in srgb, var(--lf,#2b7fd1) 24%, var(--gray100)); }
  .avg.rekker-ikke { opacity:.42; }

  .linje { width:50px; height:50px; border-radius:50%; flex:none; display:flex; align-items:center;
    justify-content:center; background:var(--lf,#666); color:#fff; font-size:17px; font-weight:700;
    font-variant-numeric:tabular-nums; --mdc-icon-size:24px; letter-spacing:-.02em; }
  .linje.lang { font-size:14px; }

  .avg .tekst { flex:1; min-width:0; }
  .mot2 { font-size:16px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .under { display:flex; align-items:center; gap:8px; font-size:13px; opacity:.62; margin-top:2px;
    flex-wrap:wrap; line-height:1.35; }
  .under .strek { text-decoration:line-through; opacity:.7; }
  .forsink { color:var(--yellow,#f2c94c); font-weight:600; opacity:1; }
  .tidlig { color:var(--green,#4caf50); font-weight:600; opacity:1; }
  .sanntid { display:inline-flex; align-items:center; gap:5px; opacity:1; }
  .sanntid i { width:6px; height:6px; border-radius:50%; background:var(--green,#4caf50);
    animation:kiRPuls 2s ease-in-out infinite; }
  @keyframes kiRPuls { 0%,100% { opacity:.35; transform:scale(.8) } 50% { opacity:1; transform:scale(1.15) } }

  .ned { text-align:right; font-variant-numeric:tabular-nums; flex:none; }
  .ned b { font-size:24px; font-weight:700; display:block; line-height:1.1; letter-spacing:-.02em; }
  .ned b.naa { color:var(--green,#4caf50); animation:kiRBlink 1.4s ease-in-out infinite; }
  @keyframes kiRBlink { 0%,100% { opacity:1 } 50% { opacity:.45 } }
  .ned span { font-size:12px; opacity:.55; }

  /* ---- avvik ---- */
  .avvik { border-radius:22px; font-size:15px; --mdc-icon-size:22px; overflow:hidden; }
  .avvik.ok { display:flex; align-items:center; gap:12px; padding:14px 18px;
    background:var(--gray100); opacity:.8; }
  .avvik.ok ha-icon { color:var(--green,#4caf50); opacity:1; }
  .avvik.varsel { background:color-mix(in srgb, var(--red,#e0524a) 24%, var(--gray100)); }
  .avvik-hode { display:flex; align-items:center; gap:12px; padding:14px 18px; font-weight:600;
    width:100%; text-align:left; cursor:pointer; }
  .avvik-hode .pil { margin-left:auto; transition:transform .25s var(--myk); opacity:.6; }
  .avvik-hode .pil.ap { transform:rotate(180deg); }
  .avvik-tekst { padding:0 18px 16px; font-size:13.5px; line-height:1.55; opacity:.85;
    white-space:pre-line; max-height:260px; overflow-y:auto; }

  .linjer { display:flex; flex-wrap:wrap; gap:8px; }
  .lj { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; border-radius:999px;
    font-size:13px; font-weight:600; background:var(--gray100); font-variant-numeric:tabular-nums;
    opacity:.62; cursor:pointer; transition:opacity .2s, background .3s; }
  .lj.varsel { background:var(--red,#e0524a); color:#fff; opacity:1; }
  .lj em { font-style:normal; font-size:11px; font-weight:700; background:rgba(0,0,0,.22);
    border-radius:999px; padding:1px 7px; }

  .tom { font-size:14px; opacity:.6; padding:14px 6px; line-height:1.5; }
  .tom code { font-size:12.5px; opacity:.85; }

  @media (max-width:420px) {
    .neste .stor { font-size:34px; }
    .linje { width:46px; height:46px; font-size:16px; }
    .avg { min-height:64px; gap:12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important;
      transition-duration:.001ms !important; }
  }
`;

const kiREsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiRKl = (v) => { if (!v) return ""; if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }); };
const kiRMin = (v) => { if (!v) return null; let d;
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) { const [t, m] = v.split(":").map(Number); d = new Date(); d.setHours(t, m, 0, 0); if (d - Date.now() < -6 * 3600000) d.setDate(d.getDate() + 1); }
  else d = new Date(v);
  return isNaN(d) ? null : Math.round((d - Date.now()) / 60000); };
const kiRNed = (m) => m === null ? "" : m <= 0 ? "nå" : m < 60 ? `${m}` : `${Math.floor(m / 60)}t ${m % 60}`;
const kiRForsink = (v) => { if (v === undefined || v === null || v === "") return null; const n = parseFloat(v); if (isNaN(n)) return null; return Math.abs(n) >= 60 ? Math.round(n / 60) : Math.round(n); };
const kiRDel = (rute) => { const s = String(rute || "").trim(); const m = s.match(/^([0-9]+[A-Za-z]?)\s+(.*)$/); return m ? { linje: m[1], mal: m[2] } : { linje: "", mal: s }; };

class KiRuterCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._valgt = 0; this._visAvvik = false; }
  static getStubConfig() { return { tittel: "Ruter", stops: [] }; }
  static getConfigElement() { return document.createElement("ki-ruter-card-editor"); }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, min_rows: 6 }; }

  setConfig(c) {
    const k = JSON.parse(JSON.stringify(c || {}));
    this._c = { tittel: k.tittel ?? k.title ?? "Ruter", ikon: k.ikon || k.title_icon || "mdi:bus-clock", visning: k.visning || "valgt",
      maks: k.maks || k.max_departures || 5, gange: k.gange ?? 0, vis_neste: true, vis_avvik: true, vis_linjer: true, vis_sanntid: true,
      stops: k.stops || [], disruptions: k.disruptions || {}, ...k };
    this._bygget = false; this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => this._tegn(), 10000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) { const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn(); }
  _ider() { const c = this._c, d = c.disruptions || {};
    return [...(c.stops || []).map((s) => s.entity), d.summary, ...(d.lines || []).map((l) => l.entity)].filter(Boolean); }

  /* ---------------------------------------------------------- avganger */
  _avganger(st) {
    const s = this._h.states[st.entity]; if (!s) return [];
    const a = s.attributes, ut = [];
    const legg = (rute, tid, forsinkelse, sanntid, mal, plattform) => {
      if (!rute && !tid) return; const d = kiRDel(rute);
      ut.push({ linje: d.linje, mal: mal || d.mal, rute, tid, forsinkelse: kiRForsink(forsinkelse), sanntid: sanntid !== false && sanntid !== "false", plattform });
    };
    legg(a.route, a.due_at || a.next_due_at, a.delay, a.real_time, a.destination, a.platform || a.quay);
    for (let i = 1; i <= 12; i++) { if (a[`route_${i}`] === undefined && a[`due_at_${i}`] === undefined) continue;
      legg(a[`route_${i}`], a[`due_at_${i}`], a[`delay_${i}`], a[`real_time_${i}`], a[`destination_${i}`], a[`platform_${i}`]); }
    if (ut.length && !ut[0].tid && s.state && !["unknown", "unavailable"].includes(s.state)) ut[0].tid = s.state;
    const filter = st.linjer ? [].concat(st.linjer).map(String) : null;
    return ut.filter((x) => x.tid).filter((x) => !filter || filter.includes(String(x.linje)))
      .map((x, i) => ({ ...x, min: i === 0 && a.next_due_in !== undefined && !isNaN(parseInt(a.next_due_in)) ? parseInt(a.next_due_in) : kiRMin(x.tid) }))
      .filter((x) => x.min === null || x.min >= -1).sort((x, y) => (x.min ?? 999) - (y.min ?? 999)).slice(0, this._c.maks);
  }
  _modus(st, avg) {
    const s = this._h.states[st.entity], m = String((s && (s.attributes.transport_mode || s.attributes.mode)) || st.mode || "").toLowerCase();
    if (KI_R_MODUS[m]) return KI_R_MODUS[m];
    const treff = Object.values(KI_R_MODUS).find((x) => x.ikon === (st.icon || "")); if (treff) return treff;
    const n = avg && avg.linje ? parseInt(avg.linje) : NaN;
    if (n >= 1 && n <= 6) return KI_R_MODUS.metro; if (n >= 11 && n <= 19) return KI_R_MODUS.tram;
    return KI_R_MODUS.bus;
  }
  _stopp() { return (this._c.stops || []).filter((st) => st.entity).map((st) => { const s = this._h.states[st.entity], avg = this._avganger(st);
    return { ...st, navn: st.name || st.navn || (s ? s.attributes.friendly_name : st.entity), gange: st.gange ?? this._c.gange,
      avg, modus: this._modus(st, avg[0]), mangler: !s }; }); }

  /* -------------------------------------------------------------- html */
  _avgHtml(st, a) {
    const mod = this._modus(st, a), rekker = st.gange ? (a.min ?? 99) >= st.gange : true;
    const planlagt = a.forsinkelse ? new Date(new Date(a.tid).getTime() - a.forsinkelse * 60000) : null;
    return `<div class="avg ${a.min !== null && a.min <= 2 ? "snart" : ""} ${rekker ? "" : "rekker-ikke"}" style="--lf:${mod.farge}">
      <span class="linje ${String(a.linje || "").length > 2 ? "lang" : ""}">${
        a.linje ? kiREsc(a.linje) : `<ha-icon icon="${mod.ikon}"></ha-icon>`}</span>
      <div class="tekst"><div class="mot2">${kiREsc(a.mal || a.rute || "Avgang")}</div>
        <div class="under">
          ${a.forsinkelse > 0 ? `<span class="strek">${kiRKl(planlagt)}</span><span class="forsink">${kiRKl(a.tid)} · ${a.forsinkelse} min forsinket</span>`
            : a.forsinkelse < 0 ? `<span class="tidlig">${kiRKl(a.tid)} · ${Math.abs(a.forsinkelse)} min før</span>` : `<span>${kiRKl(a.tid)}</span>`}
          ${this._c.vis_sanntid ? (a.sanntid ? `<span class="sanntid"><i></i>sanntid</span>` : `<span>rutetid</span>`) : ""}
          ${a.plattform && String(a.plattform).length <= 4 ? `<span>spor ${kiREsc(a.plattform)}</span>` : ""}
          ${rekker ? "" : `<span>rekker du ikke</span>`}
        </div></div>
      <div class="ned"><b class="${a.min !== null && a.min <= 0 ? "naa" : ""}">${kiRNed(a.min)}</b><span>${a.min === null || a.min <= 0 ? "" : a.min < 60 ? "min" : "t"}</span></div></div>`;
  }
  _tavle(st) {
    const linjer = [...new Set(st.avg.map((a) => a.linje).filter(Boolean))].sort((a, b) => a.localeCompare(b, "nb", { numeric: true })).slice(0, 8);
    const meta = st.mangler ? "mangler" : [linjer.length ? `linje ${linjer.join(", ")}` : "", st.gange ? `${st.gange} min å gå` : ""].filter(Boolean).join(" · ");
    return `<div class="tavle"><div class="tavlehode">
        <span class="navn"><ha-icon icon="${kiREsc(st.icon || st.modus.ikon)}" style="color:${st.modus.farge}"></ha-icon>${kiREsc(st.navn)}</span>
        <span class="meta" data-a="mer" data-e="${kiREsc(st.entity)}" tabindex="0">${kiREsc(meta)}</span></div>
      ${st.avg.length ? st.avg.map((a) => this._avgHtml(st, a)).join("") : `<div class="tom">${st.mangler ? `Fant ikke <code>${kiREsc(st.entity)}</code>` : "Ingen avganger de neste timene"}</div>`}</div>`;
  }
  _avvikHtml() {
    const d = this._c.disruptions || {}, sum = d.summary && this._h.states[d.summary];
    if (!sum || !this._c.vis_avvik) return "";
    const ant = parseInt(sum.state) || 0;
    if (ant <= 0) return `<div class="avvik ok" data-a="mer" data-e="${kiREsc(d.summary)}" tabindex="0"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Ingen meldte avvik</span></div>`;
    const tekst = [sum.attributes.markdown_active, sum.attributes.markdown_planned].filter(Boolean).join("\n")
      .replace(/^#+\s*(.*)$/gm, "$1").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
    return `<div class="avvik varsel"><div class="avvik-hode" data-a="avvik" tabindex="0" role="button" aria-expanded="${this._visAvvik}">
        <ha-icon icon="mdi:alert-outline"></ha-icon><span>${ant} avvik i kollektivtrafikken</span>
        <ha-icon class="pil ${this._visAvvik ? "ap" : ""}" icon="mdi:chevron-down"></ha-icon></div>
      ${this._visAvvik && tekst ? `<div class="avvik-tekst">${kiREsc(tekst)}</div>` : ""}</div>`;
  }
  _linjerHtml() {
    if (!this._c.vis_linjer) return "";
    const l = ((this._c.disruptions || {}).lines || []).filter((x) => x.entity && this._h.states[x.entity]); if (!l.length) return "";
    return `<div class="linjer">${l.map((x) => { const s = this._h.states[x.entity], n = parseInt(s.state) || 0;
      return `<span class="lj ${n > 0 ? "varsel" : ""}" data-a="mer" data-e="${kiREsc(x.entity)}" tabindex="0">${kiREsc(x.name || s.attributes.friendly_name || "")}${n > 0 ? `<em>${n}</em>` : ""}</span>`; }).join("")}</div>`;
  }
  _nesteHtml(stopp) {
    if (!this._c.vis_neste) return "";
    const kand = stopp.flatMap((st) => st.avg.map((a) => ({ a, st }))).filter((x) => x.a.min !== null && x.a.min >= (x.st.gange || 0)).sort((x, y) => x.a.min - y.a.min)[0];
    if (!kand) return "";
    const { a, st } = kand, mod = this._modus(st, a);
    return `<div class="neste" style="--lf:${mod.farge}">
      <span class="linje ${String(a.linje || "").length > 2 ? "lang" : ""}" style="background:rgba(0,0,0,.20)">${
        a.linje ? kiREsc(a.linje) : `<ha-icon icon="${mod.ikon}"></ha-icon>`}</span>
      <div class="tekst"><div class="mot">${kiREsc(a.mal || a.rute)}</div>
        <div class="hvor">fra ${kiREsc(st.navn)} kl ${kiRKl(a.tid)}${
          a.forsinkelse > 0 ? ` · ${a.forsinkelse} min forsinket` : ""}${
          st.gange ? ` · gå om ${Math.max(0, a.min - st.gange)} min` : ""}</div></div>
      <div class="stor">${kiRNed(a.min)}<small>${a.min <= 0 ? "" : a.min < 60 ? "min" : "timer"}</small></div></div>`;
  }
  _innhold() {
    const c = this._c, stopp = this._stopp();
    const topp = `<div class="topp"><span class="ikon"><ha-icon icon="${kiREsc(c.ikon)}"></ha-icon></span>
      ${c.tittel ? `<span class="tittel">${kiREsc(c.tittel)}</span>` : ""}
      <span class="klokke">oppdatert ${new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}</span></div>`;
    if (!stopp.length) return `${topp}<div class="tom">Legg til holdeplasser under <code>stops:</code>.</div>`;
    const valgt = Math.min(this._valgt, stopp.length - 1);
    const enTavle = c.visning !== "alle" && stopp.length > 1;
    const velger = !enTavle ? "" : `<div class="valg" role="tablist">${stopp.map((st, i) => { const n = st.avg.length ? st.avg[0].min : null;
      return `<span class="v ${i === valgt ? "aktiv" : ""}" data-a="hp" data-i="${i}" tabindex="0" role="tab" aria-selected="${i === valgt}">
        <ha-icon icon="${kiREsc(st.icon || st.modus.ikon)}"></ha-icon>${kiREsc(st.navn)}${n !== null ? `<b>${n <= 0 ? "nå" : n + "′"}</b>` : ""}</span>`; }).join("")}</div>`;
    return `${topp}${this._avvikHtml()}${this._linjerHtml()}${this._nesteHtml(stopp)}${velger}
      ${enTavle ? this._tavle(stopp[valgt]) : stopp.map((st) => this._tavle(st)).join("")}`;
  }

  _koble() {
    const r = this.shadowRoot;
    const finn = (e) => { for (const el of e.composedPath()) { if (el === r) break; if (el.nodeType === 1 && el.dataset && el.dataset.a) return el; } return null; };
    const kjor = (el) => { if (el.dataset.a === "hp") { this._valgt = +el.dataset.i; this._tegn(); }
      else if (el.dataset.a === "avvik") { this._visAvvik = !this._visAvvik; this._tegn(); }
      else if (el.dataset.a === "mer" && el.dataset.e) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.e }, bubbles: true, composed: true })); };
    r.addEventListener("click", (e) => { const el = finn(e); if (el) { e.stopPropagation(); kjor(el); } });
    r.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = finn(e); if (el) { e.preventDefault(); kjor(el); } });
  }
  _tegn() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const stil = `--kort-bg:${c.bakgrunn || "var(--gray200, var(--card-background-color))"};--maks:${c.maks_bredde || "620px"};--glod:${c.bakgrunn_glod === false ? 0 : 1}`;
    const html = `<div class="ramme"><div class="kort" style="${stil}"><div class="glo"></div>${this._innhold()}</div></div>`;
    // Chromium og Safari nekter å sette outerHTML på et element som ligger rett i en shadow root,
    // så innholdet byttes inne i en fast beholder i stedet.
    if (!this._bygget) { this.shadowRoot.innerHTML = `<style>${KI_R_STIL}</style><div class="rot"></div>`;
      this._rot = this.shadowRoot.querySelector(".rot"); this._koble(); this._bygget = true; this._forrige = null; }
    if (html !== this._forrige) { this._rot.innerHTML = html; this._forrige = html; }
  }
}
if (!customElements.get("ki-ruter-card")) customElements.define("ki-ruter-card", KiRuterCard);

class KiRuterCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { tittel: "Tittel", ikon: "Ikon", visning: "Visning", maks: "Avganger per holdeplass", gange: "Gangtid (min)",
        bakgrunn: "Bakgrunnsfarge (f.eks. var(--gray100) eller #1e1e24)", maks_bredde: "Maks bredde på innholdet",
        vis_neste: "Vis neste avgang øverst", vis_avvik: "Vis avviksbanner", vis_linjer: "Vis linjebrikker", vis_sanntid: "Vis sanntid / rutetid" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...this._c, ...e.detail.value } }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("div");
      p.style.cssText = "padding:8px 4px;font-size:12.5px;opacity:.7";
      p.textContent = "Holdeplasser (stops:) og avvik (disruptions:) settes i YAML-redigeringen.";
      this.appendChild(p);
    }
    this._f.hass = this._h;
    this._f.data = { vis_neste: true, vis_avvik: true, vis_linjer: true, vis_sanntid: true, ...this._c };
    this._f.schema = [{ name: "tittel", selector: { text: {} } }, { name: "ikon", selector: { icon: {} } },
      { name: "visning", selector: { select: { options: [{ value: "valgt", label: "Én holdeplass om gangen" }, { value: "alle", label: "Alle under hverandre" }] } } },
      { name: "maks", selector: { number: { min: 1, max: 12, mode: "box" } } }, { name: "gange", selector: { number: { min: 0, max: 30, mode: "box" } } },
      { name: "bakgrunn", selector: { text: {} } }, { name: "maks_bredde", selector: { text: {} } },
      { name: "vis_neste", selector: { boolean: {} } }, { name: "vis_avvik", selector: { boolean: {} } },
      { name: "vis_linjer", selector: { boolean: {} } }, { name: "vis_sanntid", selector: { boolean: {} } }];
  }
}
if (!customElements.get("ki-ruter-card-editor")) customElements.define("ki-ruter-card-editor", KiRuterCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-ruter-card")) window.customCards.push({ type: "ki-ruter-card", name: "KI Ruter", description: "Avgangstavle fra Entur med sanntid, forsinkelser og Ruter-avvik", preview: true });
console.info(`%c KI-RUTER-CARD %c v${KI_RUTER_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

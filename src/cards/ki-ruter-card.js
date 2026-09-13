/* ki-ruter-card – kollektivavganger fra Entur + avvik fra Ruter. Frittstående (ingen avhengigheter).
 * Legg filen i /config/www/ og legg til ressursen /local/ki-ruter-card.js (JavaScript-modul).
 *
 * type: custom:ki-ruter-card
 * tittel: Ruter
 * visning: valgt | alle          # valgt = holdeplass-velger, alle = alle tavlene under hverandre
 * maks: 5                        # avganger per holdeplass
 * gange: 4                       # minutter å gå til holdeplassen – avganger du ikke rekker tones ned
 * stops:
 *   - entity: sensor.transport_majorstuen
 *     name: Majorstuen           ikon: mdi:subway-variant      gange: 7
 * disruptions:
 *   summary: sensor.ruter_disruption_summary
 *   lines: [ { entity: sensor.ruter_disruption_rut_line_1, name: '1' } ]
 *
 * Nedtellingen går hvert tiende sekund uten å vente på Home Assistant.
 */
const KI_RUTER_VERSJON = "2.0.0";

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
  :host { display:block; --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { border-radius:var(--ha-card-border-radius,24px); background:var(--gray200, var(--card-background-color));
    color:var(--gray1000, var(--primary-text-color)); padding:14px 14px 12px; }
  [data-a] { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  .hode { display:flex; align-items:center; gap:10px; padding:2px 4px 12px; }
  .hode h2 { margin:0; font-size:17px; font-weight:500; flex:1; }
  .hode .ik { width:36px; height:36px; border-radius:50%; background:rgba(128,128,128,.16); display:flex; align-items:center; justify-content:center; --mdc-icon-size:20px; }
  .hode .klokke { font-size:12.5px; opacity:.55; font-variant-numeric:tabular-nums; }

  /* neste avgang */
  .neste { position:relative; border-radius:20px; padding:14px 16px; margin-bottom:10px; overflow:hidden; isolation:isolate;
    background:linear-gradient(100deg, color-mix(in srgb, var(--lf,#2b7fd1) 30%, transparent), transparent 72%); }
  .neste::after { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--lf,#2b7fd1); }
  .neste .rad { display:flex; align-items:center; gap:12px; }
  .neste .tall { font-size:2.5em; font-weight:300; line-height:1; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
  .neste .tall small { font-size:.32em; font-weight:400; opacity:.6; margin-left:5px; letter-spacing:0; }
  .neste .hvor { font-size:13px; opacity:.7; margin-top:3px; }
  .neste .mot { font-size:15px; font-weight:500; }

  /* holdeplassvelger */
  .velger { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; margin:0 -14px 10px; padding:2px 14px; scroll-snap-type:x proximity; }
  .velger::-webkit-scrollbar { display:none; }
  .hp { flex:none; scroll-snap-align:start; display:flex; align-items:center; gap:7px; padding:8px 13px; border-radius:999px; font-size:13px; font-weight:500;
    background:rgba(128,128,128,.16); white-space:nowrap; transition:background .3s, color .3s, transform .15s; --mdc-icon-size:17px; }
  .hp:active { transform:scale(.95); }
  .hp.valgt { background:var(--gray1000, var(--primary-text-color)); color:var(--gray200, var(--card-background-color)); }
  .hp b { font-variant-numeric:tabular-nums; opacity:.75; font-weight:600; }
  .hp .varsel { width:7px; height:7px; border-radius:50%; background:var(--red,#e2483d); }

  /* tavle */
  .tavle + .tavle { margin-top:14px; }
  .tavlehode { display:flex; align-items:center; justify-content:space-between; padding:2px 6px 8px; }
  .tavlehode .navn { font-size:15px; font-weight:600; display:flex; align-items:center; gap:8px; --mdc-icon-size:18px; }
  .tavlehode .meta { font-size:12px; opacity:.55; }
  .avg { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:center; padding:9px 12px 9px 8px; border-radius:18px;
    background:rgba(128,128,128,.10); transition:background .3s, opacity .3s; }
  .avg + .avg { margin-top:5px; }
  .avg.snart { background:linear-gradient(100deg, color-mix(in srgb, var(--lf) 22%, transparent), rgba(128,128,128,.10) 60%); }
  .avg.rekker-ikke { opacity:.45; }
  .linje { min-width:42px; height:34px; padding:0 9px; border-radius:10px; background:var(--lf,#666); color:#fff; display:flex; align-items:center; justify-content:center;
    gap:4px; font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; --mdc-icon-size:17px; }
  .linje.ikon-bare { min-width:34px; padding:0; }
  .mot2 { font-size:14.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .under { display:flex; align-items:center; gap:7px; font-size:12px; opacity:.65; margin-top:2px; flex-wrap:wrap; }
  .under .strek { text-decoration:line-through; }
  .forsink { color:var(--orange,#f0a020); font-weight:600; opacity:1; }
  .tidlig { color:var(--green,#3ddc97); font-weight:600; opacity:1; }
  .sanntid { display:inline-flex; align-items:center; gap:4px; opacity:1; }
  .sanntid i { width:6px; height:6px; border-radius:50%; background:var(--green,#3ddc97); animation:r-puls 2s ease-in-out infinite; }
  @keyframes r-puls { 0%,100% { opacity:.35; transform:scale(.8); } 50% { opacity:1; transform:scale(1.15); } }
  .ned { text-align:right; font-variant-numeric:tabular-nums; }
  .ned b { font-size:19px; font-weight:600; display:block; line-height:1.15; }
  .ned b.naa { color:var(--green,#3ddc97); animation:r-blink 1.4s ease-in-out infinite; }
  @keyframes r-blink { 0%,100% { opacity:1; } 50% { opacity:.45; } }
  .ned span { font-size:11.5px; opacity:.55; }

  /* avvik */
  .avvik { border-radius:18px; padding:11px 14px; margin-bottom:10px; display:flex; align-items:center; gap:10px; font-size:13.5px; --mdc-icon-size:20px; }
  .avvik.ok { background:color-mix(in srgb, var(--green,#3ddc97) 16%, transparent); color:var(--green,#3ddc97); }
  .avvik.varsel { background:color-mix(in srgb, var(--red,#e2483d) 20%, transparent); flex-direction:column; align-items:stretch; gap:0; padding:0; }
  .avvik-hode { display:flex; align-items:center; gap:10px; padding:11px 14px; font-weight:500; }
  .avvik-hode .pil { margin-left:auto; transition:transform .3s; --mdc-icon-size:20px; opacity:.7; }
  .avvik-hode .pil.ap { transform:rotate(180deg); }
  .avvik-tekst { padding:0 14px 12px; font-size:13px; line-height:1.5; opacity:.85; white-space:pre-line; max-height:260px; overflow-y:auto; animation:r-inn .35s var(--myk) both; }
  .avvik-tekst h4 { margin:10px 0 3px; font-size:13px; }
  @keyframes r-inn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
  .linjer { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
  .lj { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:999px; font-size:12.5px; font-weight:700;
    background:rgba(128,128,128,.16); font-variant-numeric:tabular-nums; }
  .lj.varsel { background:color-mix(in srgb, var(--red,#e2483d) 26%, transparent); }
  .lj em { font-style:normal; font-size:11px; font-weight:700; background:var(--red,#e2483d); color:#fff; border-radius:999px; padding:1px 6px; }
  .tom { padding:18px 10px; text-align:center; font-size:13.5px; opacity:.6; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
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
      maks: k.maks || k.max_departures || 5, gange: k.gange ?? 0, stops: k.stops || [], disruptions: k.disruptions || {} };
    this._bygget = false; this._tegn();
  }
  connectedCallback() { clearInterval(this._i); this._i = setInterval(() => { this._forrige = null; this._tegn(); }, 10000); this._tegn(); }
  disconnectedCallback() { clearInterval(this._i); }
  set hass(h) { const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._ider().some((id) => g.states[id] !== h.states[id])) this._tegn(); }
  _ider() { const c = this._c, d = c.disruptions;
    return [...c.stops.map((s) => s.entity), d.summary, ...(d.lines || []).map((l) => l.entity)].filter(Boolean); }

  /* ---------------------------------------------------------- avganger */
  _avganger(st) {
    const s = this._h.states[st.entity]; if (!s) return [];
    const a = s.attributes, ut = [];
    const legg = (rute, tid, forsinkelse, sanntid, mal, plattform) => {
      if (!rute && !tid) return; const d = kiRDel(rute);
      ut.push({ linje: d.linje, mal: mal || d.mal, rute, tid, forsinkelse: kiRForsink(forsinkelse), sanntid: sanntid !== false && sanntid !== "false", plattform });
    };
    legg(a.route, a.due_at || a.next_due_at, a.delay, a.real_time, a.destination, a.platform || a.quay || a.stop_id);
    for (let i = 1; i <= 12; i++) { if (a[`route_${i}`] === undefined && a[`due_at_${i}`] === undefined) continue;
      legg(a[`route_${i}`], a[`due_at_${i}`], a[`delay_${i}`], a[`real_time_${i}`], a[`destination_${i}`], a[`platform_${i}`]); }
    if (ut.length && !ut[0].tid && s.state && !["unknown", "unavailable"].includes(s.state)) ut[0].tid = s.state;
    return ut.filter((x) => x.tid).map((x, i) => ({ ...x, min: i === 0 && a.next_due_in !== undefined && !isNaN(parseInt(a.next_due_in)) ? parseInt(a.next_due_in) : kiRMin(x.tid) }))
      .filter((x) => x.min === null || x.min >= -1).sort((x, y) => (x.min ?? 999) - (y.min ?? 999)).slice(0, this._c.maks);
  }
  _modus(st, avg) {
    const s = this._h.states[st.entity], m = String((s && (s.attributes.transport_mode || s.attributes.mode)) || st.mode || "").toLowerCase();
    if (KI_R_MODUS[m]) return KI_R_MODUS[m];
    const ik = st.icon || "";
    const treff = Object.values(KI_R_MODUS).find((x) => x.ikon === ik); if (treff) return treff;
    const n = avg && avg.linje ? parseInt(avg.linje) : NaN;
    if (n >= 1 && n <= 6) return KI_R_MODUS.metro; if (n >= 11 && n <= 19) return KI_R_MODUS.tram;
    return KI_R_MODUS.bus;
  }
  _stopp() { return this._c.stops.filter((st) => st.entity).map((st) => { const s = this._h.states[st.entity], avg = this._avganger(st);
    return { ...st, navn: st.name || st.navn || (s ? s.attributes.friendly_name : st.entity), gange: st.gange ?? this._c.gange, avg, modus: this._modus(st, avg[0]), mangler: !s }; }); }

  /* -------------------------------------------------------------- html */
  _avgHtml(st, a) {
    const mod = this._modus(st, a), rekker = st.gange ? (a.min ?? 99) >= st.gange : true;
    const planlagt = a.forsinkelse ? new Date(new Date(a.tid).getTime() - a.forsinkelse * 60000) : null;
    return `<div class="avg ${a.min !== null && a.min <= 2 ? "snart" : ""} ${rekker ? "" : "rekker-ikke"}" style="--lf:${mod.farge}">
      <span class="linje ${a.linje ? "" : "ikon-bare"}">${a.linje ? kiREsc(a.linje) : `<ha-icon icon="${mod.ikon}"></ha-icon>`}</span>
      <div style="min-width:0"><div class="mot2">${kiREsc(a.mal || a.rute || "Avgang")}</div>
        <div class="under">
          ${a.forsinkelse > 0 ? `<span class="strek">${kiRKl(planlagt)}</span><span class="forsink">${kiRKl(a.tid)} · ${a.forsinkelse} min forsinket</span>`
            : a.forsinkelse < 0 ? `<span class="tidlig">${kiRKl(a.tid)} · ${Math.abs(a.forsinkelse)} min før</span>` : `<span>${kiRKl(a.tid)}</span>`}
          ${a.sanntid ? `<span class="sanntid"><i></i>sanntid</span>` : `<span>rutetid</span>`}
          ${a.plattform && String(a.plattform).length <= 4 ? `<span>spor ${kiREsc(a.plattform)}</span>` : ""}
          ${!rekker ? `<span>rekker du ikke</span>` : ""}
        </div></div>
      <div class="ned"><b class="${a.min !== null && a.min <= 0 ? "naa" : ""}">${kiRNed(a.min)}</b><span>${a.min === null ? "" : a.min <= 0 ? "" : a.min < 60 ? "min" : "t"}</span></div></div>`;
  }
  _tavle(st) {
    const linjer = [...new Set(st.avg.map((a) => a.linje).filter(Boolean))].slice(0, 6);
    return `<div class="tavle"><div class="tavlehode">
        <span class="navn"><ha-icon icon="${kiREsc(st.icon || st.modus.ikon)}" style="color:${st.modus.farge}"></ha-icon>${kiREsc(st.navn)}</span>
        <span class="meta" data-a="mer" data-e="${kiREsc(st.entity)}" tabindex="0">${st.mangler ? "mangler" : [linjer.length ? `linje ${linjer.sort((a, b) => a.localeCompare(b, "nb", { numeric: true })).join(", ")}` : "", st.gange ? `${st.gange} min å gå` : ""].filter(Boolean).join(" · ")}</span></div>
      ${st.avg.length ? st.avg.map((a) => this._avgHtml(st, a)).join("") : `<div class="tom">${st.mangler ? `Fant ikke ${kiREsc(st.entity)}` : "Ingen avganger de neste timene"}</div>`}</div>`;
  }
  _avvikHtml() {
    const d = this._c.disruptions, sum = d.summary && this._h.states[d.summary]; if (!sum) return "";
    const ant = parseInt(sum.state) || 0;
    if (ant <= 0) return `<div class="avvik ok" data-a="mer" data-e="${kiREsc(d.summary)}" tabindex="0"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Ingen meldte avvik</span></div>`;
    const tekst = [sum.attributes.markdown_active, sum.attributes.markdown_planned].filter(Boolean).join("\n")
      .replace(/^#+\s*(.*)$/gm, "$1").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
    return `<div class="avvik varsel"><div class="avvik-hode" data-a="avvik" tabindex="0" role="button" aria-expanded="${this._visAvvik}">
        <ha-icon icon="mdi:alert-outline"></ha-icon><span>${ant} ${ant === 1 ? "avvik" : "avvik"} i kollektivtrafikken</span>
        <ha-icon class="pil ${this._visAvvik ? "ap" : ""}" icon="mdi:chevron-down"></ha-icon></div>
      ${this._visAvvik && tekst ? `<div class="avvik-tekst">${kiREsc(tekst)}</div>` : ""}</div>`;
  }
  _linjerHtml() {
    const l = (this._c.disruptions.lines || []).filter((x) => x.entity && this._h.states[x.entity]); if (!l.length) return "";
    return `<div class="linjer">${l.map((x) => { const s = this._h.states[x.entity], n = parseInt(s.state) || 0;
      return `<span class="lj ${n > 0 ? "varsel" : ""}" data-a="mer" data-e="${kiREsc(x.entity)}" tabindex="0">${kiREsc(x.name || s.attributes.friendly_name || "")}${n > 0 ? `<em>${n}</em>` : ""}</span>`; }).join("")}</div>`;
  }
  _nesteHtml(stopp) {
    const kand = stopp.flatMap((st) => st.avg.map((a) => ({ a, st }))).filter((x) => x.a.min !== null && x.a.min >= (x.st.gange || 0)).sort((x, y) => x.a.min - y.a.min)[0];
    if (!kand) return "";
    const { a, st } = kand, mod = this._modus(st, a);
    return `<div class="neste" style="--lf:${mod.farge}"><div class="rad">
      <span class="linje ${a.linje ? "" : "ikon-bare"}" style="height:40px;font-size:17px">${a.linje ? kiREsc(a.linje) : `<ha-icon icon="${mod.ikon}"></ha-icon>`}</span>
      <div style="flex:1;min-width:0"><div class="mot">${kiREsc(a.mal || a.rute)}</div>
        <div class="hvor">fra ${kiREsc(st.navn)} kl ${kiRKl(a.tid)}${a.forsinkelse > 0 ? ` · ${a.forsinkelse} min forsinket` : ""}${st.gange ? ` · gå om ${Math.max(0, a.min - st.gange)} min` : ""}</div></div>
      <div style="text-align:right"><div class="tall">${kiRNed(a.min)}<small>${a.min <= 0 ? "" : a.min < 60 ? "min" : ""}</small></div></div></div></div>`;
  }
  _innhold() {
    const c = this._c, stopp = this._stopp();
    if (!stopp.length) return `<div class="hode"><div class="ik"><ha-icon icon="${kiREsc(c.ikon)}"></ha-icon></div><h2>${kiREsc(c.tittel)}</h2></div>
      <div class="tom">Legg til holdeplasser under <b>stops:</b>.</div>`;
    const valgt = Math.min(this._valgt, stopp.length - 1);
    const velger = c.visning === "alle" || stopp.length < 2 ? "" : `<div class="velger">${stopp.map((st, i) => { const n = st.avg.length ? st.avg[0].min : null;
      return `<span class="hp ${i === valgt ? "valgt" : ""}" data-a="hp" data-i="${i}" tabindex="0" role="tab" aria-selected="${i === valgt}">
        <ha-icon icon="${kiREsc(st.icon || st.modus.ikon)}"></ha-icon>${kiREsc(st.navn)}${n !== null ? `<b>${n <= 0 ? "nå" : n + "′"}</b>` : ""}</span>`; }).join("")}</div>`;
    return `<div class="hode"><div class="ik"><ha-icon icon="${kiREsc(c.ikon)}"></ha-icon></div><h2>${kiREsc(c.tittel)}</h2>
        <span class="klokke">oppdatert ${new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}</span></div>
      ${this._avvikHtml()}${this._linjerHtml()}${this._nesteHtml(stopp)}${velger}
      ${c.visning === "alle" || stopp.length < 2 ? stopp.map((st) => this._tavle(st)).join("") : this._tavle(stopp[valgt])}`;
  }

  _koble() {
    const r = this.shadowRoot;
    const finn = (e) => { for (const el of e.composedPath()) { if (el === r) break; if (el.nodeType === 1 && el.dataset && el.dataset.a) return el; } return null; };
    const kjor = (el) => { if (el.dataset.a === "hp") { this._valgt = +el.dataset.i; this._forrige = null; this._tegn(); }
      else if (el.dataset.a === "avvik") { this._visAvvik = !this._visAvvik; this._forrige = null; this._tegn(); }
      else if (el.dataset.a === "mer" && el.dataset.e) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.e }, bubbles: true, composed: true })); };
    r.addEventListener("click", (e) => { const el = finn(e); if (el) { e.stopPropagation(); kjor(el); } });
    r.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = finn(e); if (el) { e.preventDefault(); kjor(el); } });
  }
  _tegn() {
    if (!this._c || !this._h) return;
    const html = `<div class="kort">${this._innhold()}</div>`;
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
      const n = { tittel: "Tittel", ikon: "Ikon", visning: "Visning", maks: "Avganger per holdeplass", gange: "Gangtid (min)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...this._c, ...e.detail.value } }, bubbles: true, composed: true })));
      this.appendChild(this._f);
      const p = document.createElement("div");
      p.style.cssText = "padding:8px 4px;font-size:12.5px;opacity:.7";
      p.textContent = "Holdeplasser (stops:) og avvik (disruptions:) settes i YAML-redigeringen.";
      this.appendChild(p);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [{ name: "tittel", selector: { text: {} } }, { name: "ikon", selector: { icon: {} } },
      { name: "visning", selector: { select: { options: [{ value: "valgt", label: "Én holdeplass om gangen" }, { value: "alle", label: "Alle under hverandre" }] } } },
      { name: "maks", selector: { number: { min: 1, max: 12, mode: "box" } } }, { name: "gange", selector: { number: { min: 0, max: 30, mode: "box" } } }];
  }
}
if (!customElements.get("ki-ruter-card-editor")) customElements.define("ki-ruter-card-editor", KiRuterCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-ruter-card")) window.customCards.push({ type: "ki-ruter-card", name: "KI Ruter", description: "Avgangstavle fra Entur med sanntid, forsinkelser og Ruter-avvik", preview: true });
console.info(`%c KI-RUTER-CARD %c v${KI_RUTER_VERSJON} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");

/* ki-server-card – hele serverpopupen i ett kort.
 *
 * Fem runder med sammensatte kort ble dårligere for hver gang, og årsaken var metoden:
 * åtte korttyper med hver sin stil, limt sammen i YAML, kan ikke bli et helhetlig
 * design. Her eier ett kort alt — faner, hero, grafer, tall, knapper — så formspråket
 * er ett stykke arbeid i stedet for åtte som nesten passer sammen.
 *
 * type: custom:ki-server-card
 * unraid: d_day_darling            # prefiks uten «sensor.»
 * qbit: sensor.qbittorrent_
 * pve_node: sensor.1_node_pve_
 *
 * Alt annet finnes selv: UniFi-enhetene, Proxmox-containere og -maskiner, Unraids
 * containere, disker og delinger.
 */
const KI_SRV_VERSJON = "2.0.0";

const KI_SRV_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip;
    --myk:cubic-bezier(.2,.8,.2,1);
    --f1:#4aa3e0; --f2:#5ad18b; --f3:#a98fe0; --f4:#f0a952; --fr:#e5706b; }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .rot { display:grid; gap:10px; color:var(--gray1000); }

  /* ---------- fanerad med tannhjul ---------- */
  .fanerad { display:flex; align-items:center; gap:8px; width:fit-content;
    max-width:100%; margin:0 auto; }
  .faner { display:flex; gap:3px; padding:3px; border-radius:999px; min-width:0;
    border:1px solid rgba(255,255,255,.22); overflow-x:auto; scrollbar-width:none; }
  .faner::-webkit-scrollbar { display:none; }
  .fane { flex:0 0 auto; display:flex; align-items:center; gap:7px; border:0;
    background:none; color:inherit; font:inherit; font-size:13.5px; font-weight:500;
    padding:8px 15px; border-radius:999px; cursor:pointer; opacity:.6;
    white-space:nowrap; transition:background .2s, opacity .2s; }
  .fane .prikk { width:7px; height:7px; border-radius:50%; flex:none;
    background:var(--f2); transition:background .3s; }
  .fane .prikk.feil { background:var(--fr); animation:srvPuls 1.6s ease-in-out infinite; }
  .fane .prikk.advarsel { background:var(--f4); }
  .fane.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95);
    opacity:1; font-weight:600; }
  .cog { flex:0 0 auto; width:38px; height:38px; border-radius:50%; cursor:pointer;
    border:1px solid rgba(255,255,255,.22); background:none; color:inherit;
    display:flex; align-items:center; justify-content:center; --mdc-icon-size:19px;
    opacity:.6; transition:background .2s, opacity .2s, transform .35s var(--myk); }
  .cog.aktiv { background:var(--active-big,#ee95ff); color:rgba(70,58,64,.95);
    opacity:1; transform:rotate(90deg); }
  @keyframes srvPuls { 0%,100% { opacity:1 } 50% { opacity:.35 } }

  /* ---------- scenen: serverrommet ----------
     Planterkortet har scene: true og scene_hoyde: 200, og det er den formen som gjør de
     popupene levende. Her er serverrommet: rack med diskblink, vifte som snurrer, og
     pakker som renner mellom nodene. Hver fane tenner sin del. */
  .scene { position:relative; border-radius:26px; overflow:hidden; background:var(--gray200);
    margin-bottom:8px; }
  .scene svg { display:block; width:100%; }
  .rackramme { fill:none; stroke:color-mix(in srgb, var(--gray1000) 22%, transparent);
    stroke-width:2; }
  .rackhylle { fill:rgba(250,251,252,.05); }
  .disk { fill:rgba(250,251,252,.10); }
  .diskled { fill:var(--f2); }
  .diskled.blink { animation:srvBlink 1.4s steps(2,end) infinite; }
  @keyframes srvBlink { 0%,60% { opacity:1 } 61%,100% { opacity:.15 } }
  .vifte { transform-box:fill-box; transform-origin:50% 50%; animation:srvSnurr 3.2s linear infinite; }
  @keyframes srvSnurr { to { transform:rotate(360deg) } }
  .viftehus { fill:rgba(250,251,252,.08); }
  .viftblad { fill:rgba(250,251,252,.22); }
  /* Pakkene renner fra racket mot nettverkssymbolet og tilbake */
  .pakke { fill:var(--f1); animation:srvPakke 2.6s linear infinite; }
  @keyframes srvPakke {
    0% { transform:translateX(0); opacity:0 }
    10% { opacity:.9 }
    90% { opacity:.9 }
    100% { transform:translateX(96px); opacity:0 }
  }
  .kabel { stroke:color-mix(in srgb, var(--gray1000) 16%, transparent); stroke-width:2; fill:none; }
  .sky { fill:rgba(250,251,252,.10); }
  .scenetekst { position:absolute; left:18px; top:14px; }
  .scenetekst .st1 { font-size:12px; font-weight:600; opacity:.55;
    text-transform:uppercase; letter-spacing:.05em; }
  .scenetekst .st2 { font-size:19px; font-weight:700; letter-spacing:-.015em; margin-top:2px; }
  .scenetall { position:absolute; right:18px; bottom:14px; text-align:right; }
  .scenetall b { font-size:2em; font-weight:300; letter-spacing:-.02em; line-height:1;
    font-variant-numeric:tabular-nums; }
  .scenetall span { display:block; font-size:12px; opacity:.55; margin-top:2px; }

  /* ---------- heroen ----------
     Grafen ligger BAK tallet, ikke ved siden av. Det er det som gjør at et stort tall
     og en tidsserie får plass på samme flate uten å slåss om oppmerksomheten. */
  .hero { position:relative; border-radius:26px; overflow:hidden; isolation:isolate;
    background:var(--gray200); padding:16px 18px 14px; cursor:pointer;
    min-height:124px; display:grid; align-content:space-between; gap:10px; }
  .hero .bakgraf { position:absolute; left:0; right:0; bottom:0; height:62%;
    opacity:.5; pointer-events:none; }
  .hero .bakgraf svg { width:100%; height:100%; display:block; }
  .hero .flate { fill:color-mix(in srgb, var(--a) 26%, transparent); }
  .hero .linje { fill:none; stroke:var(--a); stroke-width:2; stroke-linejoin:round;
    stroke-linecap:round; }
  .hero .topp { position:relative; display:flex; align-items:flex-start; gap:12px; }
  .hero .ik { width:44px; height:44px; border-radius:50%; flex:none; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:23px;
    background:rgba(250,251,252,.10); color:var(--a); }
  .hero .merke { font-size:11.5px; font-weight:600; opacity:.6;
    text-transform:uppercase; letter-spacing:.05em; }
  .hero .tilstand { font-size:16px; font-weight:700; letter-spacing:-.01em;
    margin-top:2px; line-height:1.3; }
  .hero .pille { margin-left:auto; flex:none; font-size:11.5px; font-weight:600;
    padding:5px 11px; border-radius:999px; background:rgba(250,251,252,.10);
    white-space:nowrap; }
  .hero .pille.feil { background:var(--fr); color:var(--black,#1b1b1b); }
  .hero .pille.advarsel { background:var(--f4); color:var(--black,#1b1b1b); }
  .hero .stort { position:relative; display:flex; align-items:baseline; gap:4px; }
  .hero .stort b { font-size:clamp(30px,9vw,42px); font-weight:600; line-height:1;
    letter-spacing:-.035em; font-variant-numeric:tabular-nums; }
  .hero .stort span { font-size:13px; opacity:.55; font-weight:500; }
  .hero .stort em { font-style:normal; font-size:12px; opacity:.5; margin-left:auto;
    align-self:flex-end; text-align:right; }

  /* ---------- fliser i dashbordets egen form ----------
     Malene er hentet fra universal_sensor_ny: 160 px hoy, rundt ikonfelt paa 52 px med
     30 px ikon, verdien i 2em/300 og navnet under. To per rad, som i vanningspopupen. */
  .fliser { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .flis { position:relative; height:160px; border-radius:26px; background:var(--gray200);
    padding:20px; cursor:pointer; display:grid; align-content:space-between;
    transition:transform .12s var(--myk); }
  .flis:active { transform:scale(.985); }
  .flis .fik { width:52px; height:52px; border-radius:50%; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:30px;
    background:rgba(250,251,252,.10); color:var(--a); }
  .flis .fnavn { font-size:14px; opacity:.6; padding-top:10px; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap; }
  .flis .fverdi { font-size:2em; font-weight:300; letter-spacing:-.02em; line-height:1.1;
    font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .flis .fverdi small { font-size:14px; line-height:1.5em; margin-left:4px; font-weight:300; }
  .flis.gul { background:color-mix(in srgb, var(--f4) 20%, var(--gray200)); }
  .flis.rod { background:color-mix(in srgb, var(--fr) 22%, var(--gray200)); }
  .flis.borte { opacity:.45; }

  /* ---------- brede rader med ikonfelt ----------
     Rutefliser fire per rad ble avvist, og med god grunn: de er små, tette, og
     ingenting i dashbordet ellers ser slik ut. Dette er samme form som bannerne og
     info-radene i bassengkortet — én bred flate per opplysning, rundt ikonfelt til
     venstre, verdien til høyre. */
  .rader { display:grid; gap:6px; }
  .irad { position:relative; display:flex; align-items:center; gap:13px;
    padding:11px 16px 11px 8px; border-radius:22px; background:var(--gray200);
    overflow:hidden; cursor:pointer; transition:transform .12s var(--myk); }
  .irad:active { transform:scale(.995); }
  .iik { width:42px; height:42px; flex:none; border-radius:50%; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:21px;
    background:rgba(250,251,252,.09); color:var(--a); }
  .inavn { flex:1; min-width:0; font-size:14px; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap; }
  .iverdi { font-size:17px; font-weight:600; letter-spacing:-.02em;
    font-variant-numeric:tabular-nums; white-space:nowrap; }
  .iverdi small { font-size:12px; font-weight:500; opacity:.55; margin-left:1px; }
  /* Stolpen ligger langs underkanten, ikke inne i en flis: nivå uten en egen linje */
  .ispor { position:absolute; left:0; right:0; bottom:0; height:3px;
    background:rgba(128,128,128,.18); }
  .ispor i { display:block; height:100%; background:var(--a);
    transition:width .7s var(--myk); }
  .irad.gul { background:color-mix(in srgb, var(--f4) 20%, var(--gray200)); }
  .irad.rod { background:color-mix(in srgb, var(--fr) 22%, var(--gray200)); }
  .irad.borte { opacity:.45; }

  /* To tall på samme flate, med hårfint skille — som «i dag» i bassengkortet */
  .par { display:grid; grid-template-columns:1fr 1fr; border-radius:22px;
    background:var(--gray200); overflow:hidden; }
  .parcelle { position:relative; padding:13px 14px; display:grid; gap:3px;
    cursor:pointer; min-width:0; }
  .parcelle + .parcelle::before { content:""; position:absolute; left:0; top:13px;
    bottom:13px; width:1px; background:rgba(128,128,128,.22); }
  .parn { font-size:10.5px; opacity:.55; text-transform:uppercase;
    letter-spacing:.04em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .parv { font-size:19px; font-weight:600; letter-spacing:-.02em;
    font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; }
  .parv small { font-size:11px; font-weight:500; opacity:.5; margin-left:2px; }

  /* ---------- liste med enheter ---------- */
  .liste { display:grid; gap:5px; }
  .rad { display:flex; align-items:center; gap:10px; padding:9px 12px; border:0;
    border-radius:16px; background:var(--gray200); color:inherit; font:inherit;
    text-align:left; cursor:pointer; width:100%; min-width:0;
    transition:transform .12s var(--myk); }
  .rad:active { transform:scale(.99); }
  .rad .p { width:8px; height:8px; border-radius:50%; flex:none; background:var(--f2); }
  .rad .p.av { background:color-mix(in srgb, currentColor 26%, transparent); }
  .rad .p.borte { background:var(--f4); }
  .rad .nv { flex:1; min-width:0; font-size:13.5px; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap; }
  .rad .hv { font-size:12px; opacity:.55; font-variant-numeric:tabular-nums;
    white-space:nowrap; }
  .rad .oppd { width:6px; height:6px; border-radius:50%; background:var(--f4); flex:none; }

  /* ---------- knapper ---------- */
  .knapper { display:flex; gap:7px; flex-wrap:wrap; }
  .kn { border:0; border-radius:999px; padding:10px 15px; font:inherit; font-size:12.5px;
    font-weight:500; cursor:pointer; background:var(--gray200); color:inherit;
    display:flex; align-items:center; gap:7px; --mdc-icon-size:17px; }
  .kn.oransje { background:var(--f4); color:var(--black,#1b1b1b); }
  .kn.rod { background:var(--fr); color:var(--black,#1b1b1b); }
  .kn.pa { background:var(--active-small,var(--active-big,#ee95ff)); }

  /* ---------- felles ---------- */
  .hode { display:flex; align-items:baseline; justify-content:space-between; gap:10px;
    padding:2px 6px 0; }
  .hode .h { font-size:13px; font-weight:600; }
  .hode .s { font-size:11.5px; opacity:.5; }
  .sok { display:flex; align-items:center; gap:9px; background:var(--gray100);
    border-radius:999px; padding:0 14px; height:38px; --mdc-icon-size:18px; }
  .sok input { flex:1; min-width:0; border:0; background:none; color:inherit;
    font:inherit; font-size:14px; outline:none; }
  .tom { font-size:13px; opacity:.6; padding:12px 14px; background:var(--gray200);
    border-radius:16px; line-height:1.5; }
  @media (prefers-reduced-motion: reduce) {
    .t, .rad, .cog, .fane, .t .spor i, .fane .prikk { transition:none; animation:none; }
  }
`;

const kiSrvEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const kiSrvNavn = (n) => String(n).replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/* Tall som ikke lyver: hele strengen må være et tall, ellers er det tekst.
   `parseFloat("6.12.4-pve")` gir 6.12, og et kjerneversjonsnummer er ikke et måltall. */
const kiSrvTall = (st) => {
  if (!st || ["unknown", "unavailable", ""].includes(st.state)) return null;
  const r = String(st.state).trim();
  if (!/^-?\d+([.,]\d+)?$/.test(r)) return null;
  return parseFloat(r.replace(",", "."));
};

const kiSrvFmt = (v, d) => {
  if (v === null) return "–";
  const des = d !== undefined ? d : Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0;
  return v.toLocaleString("nb-NO", { minimumFractionDigits: des, maximumFractionDigits: des });
};

/* Oppetid fra tidsstempel eller sekunder. UniFi og Proxmox bruker tidsstempel. */
const kiSrvOppe = (st) => {
  if (!st || ["unknown", "unavailable", ""].includes(st.state)) return null;
  const r = String(st.state).trim();
  let sek = null;
  if (/^-?\d+(\.\d+)?$/.test(r) && (st.attributes || {}).device_class !== "timestamp") {
    const e = (st.attributes || {}).unit_of_measurement || "";
    const n = parseFloat(r);
    sek = /min/i.test(e) ? n * 60 : /^h|time/i.test(e) ? n * 3600
      : /dag|day/i.test(e) ? n * 86400 : n;
  } else {
    const d = new Date(r);
    if (!isNaN(d)) sek = (Date.now() - d.getTime()) / 1000;
  }
  if (sek === null || sek < 0) return null;
  const dg = Math.floor(sek / 86400);
  if (dg >= 1) return { v: String(dg), e: "døgn" };
  const t = Math.floor(sek / 3600);
  if (t >= 1) return { v: String(t), e: "timer" };
  return { v: String(Math.max(1, Math.floor(sek / 60))), e: "min" };
};

class KiServerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._fane = "unraid";
    this._sok = "";
    this._prover = {};
  }
  static getStubConfig() {
    return { unraid: "d_day_darling", qbit: "sensor.qbittorrent_", pve_node: "sensor.1_node_pve_" };
  }
  getCardSize() { return 14; }

  setConfig(c) {
    /* `bare_hero: true` viser bare statuslinja og det store tallet — tallene under
       kommer da fra dashbordets egne `universal_sensor_ny`-fliser i stedet for fra
       kortet. `fane:` låser hvilken den viser, så én per fane i popupen. */
    this._c = { unraid: "d_day_darling", qbit: "sensor.qbittorrent_",
      pve_node: "sensor.1_node_pve_", pve_ct: "sensor.3_ct_", pve_vm: "sensor.4_vm_",
      knapp_ct: "button.3_ct_", knapp_vm: "button.4_vm_", ...(c || {}) };
    this._U = `sensor.${this._c.unraid}_`;
    this._Ub = `binary_sensor.${this._c.unraid}_`;
    this._bygget = false;
  }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    this._maal();
    if (!this._klokke) {
      /* Egen klokke: uten den får grafene bare et punkt når en verdi endrer seg, og en
         rolig periode ser ut som at grafen stoppet i stedet for å være flat. */
      this._klokke = setInterval(() => { this._maal(); this._tegn(); }, 15000);
    }
    if (!this._bygget) { this._bygg(); this._bygget = true; }
    this._tegn();
  }

  disconnectedCallback() {
    if (this._klokke) { clearInterval(this._klokke); this._klokke = null; }
  }

  // ------------------------------------------------------------ data
  _st(id) { return id && this._h ? this._h.states[id] : null; }
  _n(id) { return kiSrvTall(this._st(id)); }
  _s(id) {
    const st = this._st(id);
    return st && !["unknown", "unavailable", ""].includes(st.state) ? st.state : null;
  }
  _pa(id, pa) {
    const st = this._st(id);
    if (!st || ["unknown", "unavailable", ""].includes(st.state)) return null;
    const liste = (pa || ["on", "home", "running", "online", "started", "active"])
      .map((x) => String(x).toLowerCase());
    return liste.includes(String(st.state).toLowerCase());
  }

  /* Måleserier for heroene, ett kvarter tilbake. Lagres per nøkkel så hver fane har
     sin egen graf. */
  _maal() {
    const kilder = {
      unraid: this._U + "cpu_usage",
      unifi: "sensor.oslo_dream_machine_pro_cpu_utilisation_2",
      proxmox: this._c.pve_node + "cpu_usage",
      nedlasting: this._c.qbit + "download_speed",
    };
    const naa = Date.now();
    for (const [k, id] of Object.entries(kilder)) {
      const v = this._n(id);
      if (v === null) continue;
      const liste = (this._prover[k] = this._prover[k] || []);
      const sist = liste[liste.length - 1];
      if (sist && naa - sist.t < 8000) continue;
      liste.push({ t: naa, v });
      while (liste.length > 60) liste.shift();
    }
  }

  _graf(nokkel) {
    const p = this._prover[nokkel] || [];
    if (p.length < 2) return "";
    const B = 340, H = 70;
    const maks = Math.max(1, ...p.map((x) => x.v));
    const t0 = p[0].t, t1 = Math.max(p[p.length - 1].t, t0 + 1);
    const X = (t) => ((t - t0) / (t1 - t0)) * B;
    const Y = (v) => H - (v / maks) * (H - 4);
    const d = p.map((x) => `${X(x.t).toFixed(1)},${Y(x.v).toFixed(1)}`).join(" L");
    return `<div class="bakgraf"><svg viewBox="0 0 ${B} ${H}" preserveAspectRatio="none">
      <path class="flate" d="M${d} L${B},${H} L0,${H} Z"/>
      <path class="linje" d="M${d}"/>
    </svg></div>`;
  }

  // ------------------------------------------------------------ oppdagelse
  _unifi() {
    if (this._unifiCache && this._unifiN === Object.keys(this._h.states).length) {
      return this._unifiCache;
    }
    this._unifiN = Object.keys(this._h.states).length;
    const S = this._h.states;
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith("device_tracker.")) continue;
      const slug = id.slice(15);
      const ett = S[`sensor.${slug}_uptime_2`] ? "_2" : S[`sensor.${slug}_uptime`] ? "" : null;
      if (ett === null || !S[`sensor.${slug}_cpu_utilisation${ett}`]) continue;
      const navn = ((S[`sensor.${slug}_uptime${ett}`].attributes || {}).friendly_name || slug)
        .replace(/\s*(uptime|oppetid)\s*$/i, "").trim() || kiSrvNavn(slug);
      const lav = `${navn} ${slug}`.toLowerCase();
      const slag = /dream|udm|gateway|udr/.test(lav) ? 0
        : /usw|switch|flex/.test(lav) ? 1 : 2;
      let porter = 0;
      while (S[`button.${slug}_port_${porter + 1}_power_cycle`]) porter++;
      ut.push({ slug, navn, ett, slag, porter,
        ikon: ["mdi:router-network", "mdi:switch", "mdi:access-point"][slag] });
    }
    return (this._unifiCache = ut.sort((a, b) => a.slag - b.slag
      || a.navn.localeCompare(b.navn, "nb")));
  }

  _pveListe(slag) {
    const pre = slag === "ct" ? this._c.pve_ct : this._c.pve_vm;
    const preB = slag === "ct" ? this._c.knapp_ct : this._c.knapp_vm;
    const S = this._h.states;
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith(pre) || !id.endsWith("_status")) continue;
      const eid = id.slice(pre.length, id.length - 7);
      if (!eid) continue;
      const navn = ((S[id].attributes || {}).friendly_name || eid)
        .replace(/\s*status\s*$/i, "").trim() || kiSrvNavn(eid);
      ut.push({ eid, navn, status: id, tj: eid.replace(/_\d+$/, ""), pre, preB });
    }
    return ut.sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }

  _containere() {
    const pre = `switch.${this._c.unraid}_container_`;
    const S = this._h.states;
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith(pre)) continue;
      const n = id.slice(pre.length);
      const oppd = S[`update.${id.split(".")[1]}_update`];
      ut.push({ id, nokkel: n, navn: (this._c.navn_kort || {})[n] || kiSrvNavn(n),
        pa: S[id].state === "on",
        borte: ["unavailable", "unknown"].includes(S[id].state),
        oppd: !!(oppd && oppd.state === "on") });
    }
    return ut.sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }

  _bruk(pre, ett) {
    const S = this._h.states;
    const ut = [];
    for (const id of Object.keys(S)) {
      if (!id.startsWith(pre) || !id.endsWith(ett)) continue;
      const n = id.slice(pre.length, id.length - ett.length);
      if (!n) continue;
      const v = kiSrvTall(S[id]);
      ut.push({ id, nokkel: n, navn: (this._c.navn_kort || {})[n] || kiSrvNavn(n), v });
    }
    return ut.sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
  }

  // ------------------------------------------------------------ helsen per fane
  _helse(fane) {
    const U = this._U, Ub = this._Ub, c = this._c;
    const sjekk = [];
    const legg = (ok, tekst, alvor) => { if (ok === false) sjekk.push({ tekst, alvor }); };
    if (fane === "unraid") {
      legg(this._pa(Ub + "array_started"), "Array er stoppet", "rod");
      legg(this._pa(Ub + "parity_valid"), "Pariteten er ugyldig", "rod");
      legg(this._pa(Ub + "disks_missing", ["off"]), "Disker mangler", "rod");
      legg(this._pa(Ub + "disks_invalid", ["off"]), "Disker er ugyldige", "rod");
      legg(this._pa(Ub + "filesystems_unmountable", ["off"]), "Filsystem kan ikke monteres", "rod");
      legg(this._pa(Ub + "disk_parity_health", ["off"]), "Paritetsdisken har feil", "rod");
      legg(this._pa(Ub + "config_valid"), "Konfigurasjonen er ugyldig", "rod");
      const v = this._n(U + "active_notifications");
      if (v) sjekk.push({ tekst: `${v} varsler fra Unraid`, alvor: "gul" });
      legg(this._pa(Ub + "cloud_connected"), "Ikke koblet til Unraid Connect", "gul");
    } else if (fane === "unifi") {
      for (const e of this._unifi()) {
        legg(this._pa(`device_tracker.${e.slug}`, ["home"]), `${e.navn} svarer ikke`, "rod");
      }
      const lat = this._n("sensor.oslo_dream_machine_pro_google_wan_latency");
      if (lat !== null && lat > 120) sjekk.push({ tekst: `Høy latens: ${Math.round(lat)} ms`, alvor: "gul" });
    } else if (fane === "proxmox") {
      legg(this._pa(c.pve_node + "node_status", ["online"]), "Noden er ikke online", "rod");
      legg(this._pa("binary_sensor.overloaded", ["off"]), "Noden er overbelastet", "rod");
      legg(this._pa("binary_sensor.disk_overloaded", ["off"]), "Disken er overbelastet", "rod");
      legg(this._pa("binary_sensor.stressed", ["off"]), "Noden er stresset", "gul");
      for (const x of [...this._pveListe("ct"), ...this._pveListe("vm")]) {
        legg(this._pa(x.status), `${x.navn} er stoppet`, "gul");
      }
    } else if (fane === "nedlasting") {
      legg(this._pa(`switch.${c.unraid}_container_binhex_qbittorrentvpn`),
        "qBittorrent er stoppet", "rod");
      const kob = this._s(c.qbit + "connection_status");
      if (kob && kob !== "connected") {
        sjekk.push({ tekst: `VPN-porten er ikke åpen (${kob})`, alvor: "rod" });
      }
      const f = this._n(c.qbit + "errored_torrents");
      if (f) sjekk.push({ tekst: `${f} torrenter med feil`, alvor: "gul" });
    }
    return {
      feil: sjekk,
      niva: sjekk.some((s) => s.alvor === "rod") ? "feil"
        : sjekk.length ? "advarsel" : "ok",
    };
  }

  // ------------------------------------------------------------ byggeklosser
  /* Serverrommet som scene. Hvilken fane du står i tenner sin del: racket blinker
     alltid, viften snurrer når CPU-en jobber, pakkene renner når nettet er oppe, og
     skyen lyser når noe lastes ned. */
  _sceneHtml(nokkel, farge, merke, tilstand, stort, enhet) {
    const h = Number(this._c.scene_hoyde) || 200;
    const arbeider = nokkel === "unraid" || nokkel === "proxmox";
    const nett = nokkel === "unifi";
    const laster = nokkel === "nedlasting";

    /* Diskene blinker i ulik takt. Samme takt ville sett ut som ett lys, ikke som
       fire disker som jobber hver for seg. */
    const disker = [0, 1, 2, 3].map((i) => `
      <g transform="translate(0 ${i * 22})">
        <rect class="disk" x="38" y="52" width="86" height="16" rx="4"></rect>
        <circle class="diskled blink" cx="114" cy="60" r="3"
                style="animation-delay:-${(i * 0.37).toFixed(2)}s"></circle>
      </g>`).join("");

    const pakker = nett || laster ? [0, 1, 2, 3].map((i) => `
      <rect class="pakke" x="140" y="${70 + i * 14}" width="7" height="4" rx="2"
            style="animation-delay:-${(i * 0.65).toFixed(2)}s"></rect>`).join("") : "";

    return `<div class="scene" style="--a:${farge}">
      <svg viewBox="0 0 320 ${h}" preserveAspectRatio="xMidYMid meet">
        <rect class="rackramme" x="30" y="42" width="102" height="${Math.min(h - 60, 104)}" rx="8"></rect>
        ${disker}
        ${arbeider ? `<g class="vifte" transform="translate(252 ${Math.min(h - 54, 128)})">
          <circle class="viftehus" cx="0" cy="0" r="20"></circle>
          ${[0, 1, 2, 3, 4].map((i) => `<path class="viftblad"
            transform="rotate(${i * 72})" d="M0 0 L5 -17 A18 18 0 0 0 -5 -17 Z"></path>`).join("")}
        </g>` : ""}
        ${nett || laster ? `
          <path class="kabel" d="M132 96 H244"></path>
          ${pakker}
          <g transform="translate(252 ${Math.min(h - 62, 96)})">
            <path class="sky" d="M-18 6 a10 10 0 0 1 3 -19 a13 13 0 0 1 25 -3
              a9 9 0 0 1 4 22 z"></path>
          </g>` : ""}
      </svg>
      <div class="scenetekst">
        <div class="st1">${kiSrvEsc(merke)}</div>
        <div class="st2">${kiSrvEsc(tilstand)}</div>
      </div>
      <div class="scenetall">
        <b>${kiSrvEsc(stort)}</b><span>${kiSrvEsc(enhet || "")}</span>
      </div>
    </div>`;
  }

  _heroHtml({ nokkel, farge, ikon, merke, tilstand, stort, enhet, hoyre, pille, entity }) {
    const h = this._helse(nokkel);
    const p = pille || (h.niva === "feil"
      ? { tekst: h.feil.length === 1 ? h.feil[0].tekst : `${h.feil.length} feil`, klasse: "feil" }
      : h.niva === "advarsel"
      ? { tekst: h.feil.length === 1 ? h.feil[0].tekst : `${h.feil.length} advarsler`, klasse: "advarsel" }
      : null);
    return `<div class="hero" style="--a:${farge}" data-mer="${kiSrvEsc(entity || "")}">
      ${this._graf(nokkel)}
      <div class="topp">
        <span class="ik"><ha-icon icon="${ikon}"></ha-icon></span>
        <div style="min-width:0">
          <div class="merke">${kiSrvEsc(merke)}</div>
          <div class="tilstand">${kiSrvEsc(tilstand)}</div>
        </div>
        ${p ? `<span class="pille ${p.klasse}">${kiSrvEsc(p.tekst)}</span>` : ""}
      </div>
      <div class="stort">
        <b>${kiSrvEsc(stort)}</b>${enhet ? `<span>${kiSrvEsc(enhet)}</span>` : ""}
        ${hoyre ? `<em>${kiSrvEsc(hoyre)}</em>` : ""}
      </div>
    </div>`;
  }

  /* Én opplysning per rad. `par: true` på et tall legger det sammen med det neste på
     samme flate — for tall som hører sammen, som RX og TX. */
  _tallHtml(liste, farge) {
    const med = liste.filter((t) => t);
    if (!med.length) return "";
    const les = (t) => {
      const st = this._st(t.entity);
      const borte = !st || ["unknown", "unavailable", ""].includes(st.state);
      let verdi = "–", enhet = t.enhet || "", raa = null;
      if (!borte) {
        if (t.tid) {
          const o = kiSrvOppe(st);
          if (o) { verdi = o.v; enhet = o.e; }
        } else {
          raa = kiSrvTall(st);
          if (raa === null) {
            verdi = st.state.length > 16 ? st.state.slice(0, 15) + "…" : st.state;
            enhet = "";
          } else verdi = kiSrvFmt(raa, t.desimaler);
        }
      }
      const niva = raa === null ? ""
        : t.rod !== undefined && raa >= t.rod ? "rod"
        : t.gul !== undefined && raa >= t.gul ? "gul" : "";
      const pst = raa !== null && t.maks
        ? Math.max(0, Math.min(100, (raa / t.maks) * 100)) : null;
      return { ...t, verdi, enhet, borte, niva, pst };
    };

    const ut = [];
    for (let i = 0; i < med.length; i++) {
      const t = les(med[i]);
      if (t.par && med[i + 1] && this._c.fliser === false) {
        const u = les(med[++i]);
        ut.push(`<div class="par" style="--a:${farge}">${[t, u].map((x) => `
          <div class="parcelle" data-mer="${kiSrvEsc(x.entity)}" tabindex="0">
            <div class="parn">${kiSrvEsc(x.navn)}</div>
            <div class="parv">${kiSrvEsc(x.verdi)}${x.enhet
              ? `<small>${kiSrvEsc(x.enhet)}</small>` : ""}</div>
          </div>`).join("")}</div>`);
        continue;
      }
      if (this._c.fliser !== false) {
        ut.push(`<div class="flis ${t.borte ? "borte" : t.niva}" style="--a:${farge}"
             data-mer="${kiSrvEsc(t.entity)}" tabindex="0">
          <span class="fik"><ha-icon icon="${kiSrvEsc(t.ikon || "mdi:chart-line")}"></ha-icon></span>
          <div>
            <div class="fverdi">${kiSrvEsc(t.verdi)}${t.enhet
              ? `<small>${kiSrvEsc(t.enhet)}</small>` : ""}</div>
            <div class="fnavn">${kiSrvEsc(t.navn)}</div>
          </div>
        </div>`);
        continue;
      }
      ut.push(`<div class="irad ${t.borte ? "borte" : t.niva}" style="--a:${farge}"
           data-mer="${kiSrvEsc(t.entity)}" tabindex="0">
        <span class="iik"><ha-icon icon="${kiSrvEsc(t.ikon || "mdi:chart-line")}"></ha-icon></span>
        <span class="inavn">${kiSrvEsc(t.navn)}</span>
        <span class="iverdi">${kiSrvEsc(t.verdi)}${t.enhet
          ? `<small>${kiSrvEsc(t.enhet)}</small>` : ""}</span>
        ${t.pst === null ? "" : `<span class="ispor">
          <i style="width:${t.pst.toFixed(1)}%"></i></span>`}
      </div>`);
    }
    return `<div class="${this._c.fliser === false ? "rader" : "fliser"}">${
      ut.join("")}</div>`;
  }

  _knapper(liste) {
    const med = liste.filter((k) => k && this._st(k.entity));
    if (!med.length) return "";
    return `<div class="knapper">${med.map((k, i) => `
      <button class="kn ${k.klasse || ""}" data-kn="${i}"
        data-e="${kiSrvEsc(k.entity)}" data-t="${kiSrvEsc(k.type || "trykk")}"
        data-b="${kiSrvEsc(k.bekreft || "")}">
        <ha-icon icon="${k.ikon}"></ha-icon>${kiSrvEsc(k.navn)}</button>`).join("")}</div>`;
  }

  _hodeHtml(h, s) {
    return `<div class="hode"><span class="h">${kiSrvEsc(h)}</span>${
      s ? `<span class="s">${kiSrvEsc(s)}</span>` : ""}</div>`;
  }

  // ------------------------------------------------------------ fanene
  _unraidHtml() {
    const U = this._U, Ub = this._Ub;
    const cont = this._containere();
    const paa = cont.filter((x) => x.pa).length;
    const oppd = Math.max(cont.filter((x) => x.oppd).length,
      this._n(U + "container_updates_available") || 0);
    const array = this._n(U + "array_usage");
    const disker = this._bruk(`sensor.${this._c.unraid}_disk_`, "_usage");
    const delinger = this._bruk(`sensor.${this._c.unraid}_share_`, "_usage");
    const sok = this._sok.trim().toLowerCase();
    const vist = sok ? cont.filter((x) => x.navn.toLowerCase().includes(sok)
      || x.nokkel.toLowerCase().includes(sok)) : cont;

    return (this._c.scene === false ? "" : this._sceneHtml("unraid", "var(--f2)", "Unraid",
      this._pa(Ub + "array_started") ? "Array kjører" : "Array er stoppet",
      kiSrvFmt(array, 0), "% av array-en brukt"))
    + this._heroHtml({
      nokkel: "unraid", farge: "var(--f2)", ikon: "mdi:server", merke: "Unraid",
      tilstand: this._pa(Ub + "array_started") ? "Array kjører" : "Array er stoppet",
      stort: kiSrvFmt(array, 0), enhet: "% av array-en brukt",
      hoyre: `${paa} av ${cont.length} containere`,
      entity: Ub + "array_started",
    })
    + this._tallHtml([
      { navn: "CPU", ikon: "mdi:cpu-64-bit", entity: U + "cpu_usage", enhet: "%", maks: 100, gul: 70, rod: 88 },
      { navn: "RAM", ikon: "mdi:memory", entity: U + "ram_usage", enhet: "%", maks: 100, gul: 75, rod: 90 },
      { navn: "Temp", ikon: "mdi:thermometer", entity: U + "cpu_temperature", enhet: "°", maks: 95, gul: 65, rod: 80 },
      { navn: "Effekt", ikon: "mdi:flash", entity: U + "cpu_power", enhet: "W", maks: 200 },
      { navn: "Oppe", ikon: "mdi:clock-outline", entity: U + "up_since", tid: true },
      { navn: "Docker CPU", ikon: "mdi:docker", entity: U + "docker_total_cpu", enhet: "%", maks: 100, gul: 70 },
      { navn: "Docker RAM", ikon: "mdi:docker", entity: U + "docker_total_memory", enhet: "%", maks: 100, gul: 75 },
      { navn: "Varsler", ikon: "mdi:bell-outline", entity: U + "active_notifications", gul: 1, rod: 5 },
    ], "var(--f2)")
    + this._hodeHtml("Disker", disker.length ? `fulleste ${kiSrvFmt(disker[0].v, 0)} %` : "")
    + this._tallHtml(disker.slice(0, 8).map((d) => ({
      navn: d.navn, entity: d.id, enhet: "%", maks: 100, gul: 80, rod: 92 })), "var(--f1)")
    + this._hodeHtml("Delinger", delinger.length ? `${delinger.length} stk` : "")
    + this._tallHtml(delinger.slice(0, 8).map((d) => ({
      navn: d.navn, entity: d.id, enhet: "%", maks: 100, gul: 80, rod: 92 })), "var(--f1)")
    + this._hodeHtml("Containere", `${paa} kjører${oppd ? ` · ${oppd} oppdateringer` : ""}`)
    + `<label class="sok"><ha-icon icon="mdi:magnify"></ha-icon>
        <input type="text" placeholder="Søk i ${cont.length} containere"
               value="${kiSrvEsc(this._sok)}" /></label>`
    + `<div class="liste">${vist.slice(0, 60).map((x) => `
        <button class="rad" data-veksle="${kiSrvEsc(x.id)}">
          <span class="p ${x.borte ? "borte" : x.pa ? "" : "av"}"></span>
          <span class="nv">${kiSrvEsc(x.navn)}</span>
          ${x.oppd ? `<span class="oppd" title="Ny versjon"></span>` : ""}
          <span class="hv">${x.borte ? "uten svar" : x.pa ? "kjører" : "av"}</span>
        </button>`).join("") || `<div class="tom">Ingen treff.</div>`}</div>`
    + this._knapper([
      { navn: "Se etter oppdateringer", entity: `button.${this._c.unraid}_check_container_updates`,
        ikon: "mdi:cloud-download" },
      { navn: "HA-maskin", entity: `switch.${this._c.unraid}_vm_home_assistant`,
        ikon: "mdi:home-assistant", type: "veksle",
        klasse: this._pa(`switch.${this._c.unraid}_vm_home_assistant`) ? "pa" : "" },
      { navn: "HA Ny", entity: `switch.${this._c.unraid}_vm_home_assistantny`,
        ikon: "mdi:home-assistant", type: "veksle",
        klasse: this._pa(`switch.${this._c.unraid}_vm_home_assistantny`) ? "pa" : "" },
    ]);
  }

  _unifiHtml() {
    const e = this._unifi();
    const oppe = e.filter((x) => this._pa(`device_tracker.${x.slug}`, ["home"])).length;
    const R = "sensor.oslo_dream_machine_pro_";
    const klienter = this._n(R + "clients");

    return (this._c.scene === false ? "" : this._sceneHtml("unifi", "var(--f1)", "UniFi",
      oppe === e.length ? "Nettet er oppe" : `${e.length - oppe} enhet(er) svarer ikke`, kiSrvFmt(klienter, 0), "klienter"))
    return this._heroHtml({
      nokkel: "unifi", farge: "var(--f1)", ikon: "mdi:lan-connect", merke: "UniFi",
      tilstand: oppe === e.length ? "Nettet er oppe" : `${e.length - oppe} enhet(er) svarer ikke`,
      stort: kiSrvFmt(klienter, 0), enhet: "klienter",
      hoyre: `${oppe} av ${e.length} enheter oppe`,
      entity: "device_tracker.oslo_dream_machine_pro",
    })
    + this._tallHtml([
      { navn: "Google", ikon: "mdi:google", entity: R + "google_wan_latency", enhet: "ms", maks: 200, gul: 80, rod: 120 },
      { navn: "Cloudflare", ikon: "mdi:cloud", entity: R + "cloudflare_wan_latency", enhet: "ms", maks: 200, gul: 80, rod: 120 },
      { navn: "Microsoft", ikon: "mdi:microsoft", entity: R + "microsoft_wan_latency", enhet: "ms", maks: 200, gul: 80, rod: 120 },
      { navn: "Ruter CPU", ikon: "mdi:router-network", entity: R + "cpu_utilisation_2", enhet: "%", maks: 100, gul: 70, rod: 88 },
      { navn: "Ruter RAM", ikon: "mdi:memory", entity: R + "memory_utilisation_2", enhet: "%", maks: 100, gul: 75, rod: 90 },
      { navn: "Ruter temp", ikon: "mdi:thermometer", entity: R + "cpu_temperature_2", enhet: "°", maks: 95, gul: 65, rod: 80 },
      { navn: "Lokal temp", ikon: "mdi:thermometer", entity: R + "local_temperature", enhet: "°", maks: 95, gul: 60, rod: 70 },
      { navn: "Oppe", ikon: "mdi:clock-outline", entity: R + "uptime_2", tid: true },
    ], "var(--f1)")
    + this._hodeHtml("Enhetene", `${oppe} av ${e.length} oppe`)
    + `<div class="liste">${e.map((x) => {
      const paa = this._pa(`device_tracker.${x.slug}`, ["home"]);
      const cpu = this._n(`sensor.${x.slug}_cpu_utilisation${x.ett}`);
      const kl = this._n(`sensor.${x.slug}_clients`);
      return `<button class="rad" data-mer="device_tracker.${kiSrvEsc(x.slug)}">
        <span class="p ${paa === null ? "borte" : paa ? "" : "av"}"></span>
        <ha-icon icon="${x.ikon}" style="--mdc-icon-size:17px;opacity:.55"></ha-icon>
        <span class="nv">${kiSrvEsc(x.navn)}</span>
        <span class="hv">${kl !== null ? `${kiSrvFmt(kl, 0)} kl.` : ""}${
          kl !== null && cpu !== null ? " · " : ""}${
          cpu !== null ? `${kiSrvFmt(cpu, 0)} % cpu` : ""}${
          paa === null ? "uten svar" : ""}</span>
      </button>`;
    }).join("") || `<div class="tom">Fant ingen UniFi-enheter.</div>`}</div>`
    + this._knapper([
      { navn: "Restart ruter", entity: "button.oslo_dream_machine_pro_restart",
        ikon: "mdi:restart", klasse: "oransje", bekreft: "Restarte Dream Machine Pro?" },
      ...e.filter((x) => x.porter).map((x) => ({
        navn: `${x.navn}: porter`, entity: `button.${x.slug}_port_1_power_cycle`,
        ikon: "mdi:ethernet", type: "mer" })),
      ...e.filter((x) => this._st(`light.${x.slug}_led`)).map((x) => ({
        navn: `${x.navn} LED`, entity: `light.${x.slug}_led`, ikon: "mdi:led-outline",
        type: "veksle", klasse: this._pa(`light.${x.slug}_led`) ? "pa" : "" })),
    ]);
  }

  _proxmoxHtml() {
    const N = this._c.pve_node;
    const ct = this._pveListe("ct");
    const vm = this._pveListe("vm");
    const alle = [...ct, ...vm];
    const kjorer = alle.filter((x) => this._pa(x.status)).length;
    const cpu = this._n(N + "cpu_usage");
    const lagring = this._bruk("sensor.5_storage_", "_usage");

    return (this._c.scene === false ? "" : this._sceneHtml("proxmox", "var(--f3)", "Proxmox",
      this._pa(N + "node_status", ["online"]) ? "Noden er online" : "Noden svarer ikke", kiSrvFmt(cpu, 0), "% CPU"))
    return this._heroHtml({
      nokkel: "proxmox", farge: "var(--f3)", ikon: "mdi:server-network", merke: "Proxmox",
      tilstand: this._pa(N + "node_status", ["online"]) ? "Noden er online" : "Noden svarer ikke",
      stort: kiSrvFmt(cpu, 0), enhet: "% CPU",
      hoyre: `${kjorer} av ${alle.length} kjører`,
      entity: N + "node_status",
    })
    + this._tallHtml([
      { navn: "Minne", ikon: "mdi:memory", entity: N + "memory_usage", enhet: "%", maks: 100, gul: 75, rod: 90 },
      { navn: "Swap", ikon: "mdi:swap-horizontal", entity: N + "swap_usage", enhet: "%", maks: 100, gul: 20, rod: 50 },
      { navn: "Rot-FS", ikon: "mdi:harddisk", entity: N + "root_filesystem_usage", enhet: "%", maks: 100, gul: 80, rod: 92 },
      { navn: "Load 1m", ikon: "mdi:speedometer", entity: N + "load_average_1m", desimaler: 2 },
      { navn: "IO wait", ikon: "mdi:timer-sand", entity: N + "io_wait", enhet: "%", maks: 100, gul: 10, rod: 25 },
      { navn: "Idle", ikon: "mdi:sleep", entity: N + "idle", enhet: "%", maks: 100 },
      { navn: "Oppe", ikon: "mdi:clock-outline", entity: N + "uptime", tid: true },
      { navn: "Kernel", ikon: "mdi:console", entity: N + "kernel_version" },
    ], "var(--f3)")
    + (lagring.length ? this._hodeHtml("Lagring",
        `fulleste ${kiSrvFmt(lagring[0].v, 0)} %`)
      + this._tallHtml(lagring.slice(0, 8).map((x) => ({
        navn: x.navn, entity: x.id, enhet: "%", maks: 100, gul: 80, rod: 92 })), "var(--f3)") : "")
    + this._hodeHtml("Containere og maskiner", `${kjorer} kjører`)
    + `<div class="liste">${alle.map((x) => {
      const paa = this._pa(x.status);
      const c = this._n(`${x.pre}${x.eid}_cpu_usage`);
      const ram = this._s(`${x.pre}${x.eid}_ram_used`);
      return `<button class="rad" data-mer="${kiSrvEsc(x.status)}">
        <span class="p ${paa === null ? "borte" : paa ? "" : "av"}"></span>
        <span class="nv">${kiSrvEsc(x.navn)}</span>
        <span class="hv">${c !== null ? `${kiSrvFmt(c, 1)} % cpu` : ""}${
          c !== null && ram ? " · " : ""}${ram ? kiSrvEsc(ram) : ""}${
          paa === false ? "stoppet" : ""}</span>
      </button>`;
    }).join("") || `<div class="tom">Fant ingen Proxmox-enheter.</div>`}</div>`
    + this._knapper([
      { navn: "Restart node", entity: "button.1_node_pve_reboot_pve", ikon: "mdi:restart",
        klasse: "oransje", bekreft: "Restarte hele Proxmox-noden?" },
      { navn: "Slå av node", entity: "button.1_node_pve_shutdown_pve", ikon: "mdi:power",
        klasse: "rod", bekreft: "Slå av hele Proxmox-noden? Dette stopper alt." },
    ]);
  }

  _nedlastingHtml() {
    const Q = this._c.qbit;
    const ned = this._n(Q + "download_speed");
    const opp = this._n(Q + "upload_speed");
    const status = this._s(Q + "status") || "idle";
    const navn = { downloading: "Laster ned", seeding: "Deler",
      up_down: "Laster og deler", idle: "Hviler" }[status] || status;
    const kob = this._s(Q + "connection_status");

    return (this._c.scene === false ? "" : this._sceneHtml("nedlasting", "var(--f4)", "qBittorrent",
      navn, kiSrvFmt(ned, 1), "MB/s ned"))
    return this._heroHtml({
      nokkel: "nedlasting", farge: "var(--f4)", ikon: "mdi:download-network-outline",
      merke: "qBittorrent", tilstand: navn,
      stort: kiSrvFmt(ned, 1), enhet: "MB/s ned",
      hoyre: `${kiSrvFmt(opp, 1)} MB/s opp`,
      entity: Q + "status",
      pille: kob && kob !== "connected"
        ? { tekst: kob === "firewalled" ? "Bak brannmur" : "Frakoblet", klasse: "feil" } : null,
    })
    + this._tallHtml([
      { navn: "Aktive", ikon: "mdi:play-circle", entity: Q + "active_torrents" },
      { navn: "Pauset", ikon: "mdi:pause-circle", entity: Q + "paused_torrents" },
      { navn: "Uten trafikk", ikon: "mdi:sleep", entity: Q + "inactive_torrents" },
      { navn: "Feilet", ikon: "mdi:alert-circle-outline", entity: Q + "errored_torrents", gul: 1, rod: 3 },
      { navn: "Totalt", ikon: "mdi:format-list-numbered", entity: Q + "all_torrents" },
      { par: true, navn: "Ned totalt", ikon: "mdi:download", entity: Q + "all_time_download", enhet: "TiB", desimaler: 2 },
      { navn: "Opp totalt", ikon: "mdi:upload", entity: Q + "all_time_upload", enhet: "TiB", desimaler: 2 },
      { navn: "Tilkobling", ikon: "mdi:lan-connect", entity: Q + "connection_status" },
    ], "var(--f4)")
    + this._hodeHtml("Kjeden", "trykk for å slå av og på")
    + `<div class="liste">${[
      ["Prowlarr", "binhex_prowlarr"], ["Flaresolverr", "flaresolverr"],
      ["Sonarr", "binhex_sonarr"], ["Radarr", "binhex_radarr"],
      ["Readarr", "binhex_readarr"], ["Bazarr", "bazarr"],
      ["Seerr", "binhex_seerr"], ["qBittorrent", "binhex_qbittorrentvpn"],
    ].map(([navn2, n]) => {
      const id = `switch.${this._c.unraid}_container_${n}`;
      const st = this._st(id);
      if (!st) return "";
      const paa = st.state === "on";
      const borte = ["unavailable", "unknown"].includes(st.state);
      return `<button class="rad" data-veksle="${kiSrvEsc(id)}">
        <span class="p ${borte ? "borte" : paa ? "" : "av"}"></span>
        <span class="nv">${kiSrvEsc(navn2)}</span>
        <span class="hv">${borte ? "uten svar" : paa ? "kjører" : "av"}</span>
      </button>`;
    }).join("")}</div>`
    + this._knapper([
      { navn: "Sparefart", entity: "switch.qbittorrent_alternative_speed",
        ikon: "mdi:speedometer-slow", type: "veksle",
        klasse: this._pa("switch.qbittorrent_alternative_speed") ? "pa" : "" },
    ]);
  }

  _innstillingerHtml() {
    return this._hodeHtml("Oppsett", `ki-server-card ${KI_SRV_VERSJON}`)
      + `<div class="tom">
        Prefiksene kortet bruker:<br>
        Unraid: <code>sensor.${kiSrvEsc(this._c.unraid)}_</code><br>
        Proxmox-node: <code>${kiSrvEsc(this._c.pve_node)}</code><br>
        qBittorrent: <code>${kiSrvEsc(this._c.qbit)}</code><br><br>
        UniFi-enhetene, Proxmox-containerne og -maskinene, og Unraids containere, disker
        og delinger finnes automatisk — ingen liste å vedlikeholde.
      </div>`
      + this._tallHtml([
        { navn: "Unraid", ikon: "mdi:server", entity: this._U + "unraid_version" },
        { navn: "PVE", ikon: "mdi:server-network", entity: this._c.pve_node + "pve_version" },
        { navn: "Kernel", ikon: "mdi:console", entity: this._c.pve_node + "kernel_version" },
        { navn: "Lagringsomr.", ikon: "mdi:database", entity: this._c.pve_node + "storages" },
      ], "var(--f1)");
  }

  // ------------------------------------------------------------ tegning
  _bygg() { this.shadowRoot.innerHTML = `<style>${KI_SRV_STIL}</style><div class="rot"></div>`; }

  _tegn() {
    const rot = this.shadowRoot.querySelector(".rot");
    if (!rot) return;
    const faner = [
      { id: "unraid", navn: "Unraid" },
      { id: "unifi", navn: "UniFi" },
      { id: "proxmox", navn: "Proxmox" },
      { id: "nedlasting", navn: "Nedlasting" },
    ];
    const laast = this._c.fane;
    const aktiv = laast && (faner.some((f) => f.id === laast) || laast === "innstillinger")
      ? laast
      : faner.some((f) => f.id === this._fane) || this._fane === "innstillinger"
      ? this._fane : "unraid";

    const innhold = aktiv === "unraid" ? this._unraidHtml()
      : aktiv === "unifi" ? this._unifiHtml()
      : aktiv === "proxmox" ? this._proxmoxHtml()
      : aktiv === "nedlasting" ? this._nedlastingHtml()
      : this._innstillingerHtml();

    /* Prikken i fanen viser helsen der, så du ser hvor problemet er uten å åpne fanen.
       Det er hele grunnen til at helsen regnes ut for alle fire hver gang. */
    /* Bare heroen: ingen fanerad, ingen tall, ingen lister. Popupen har sin egen
       fanerad og sine egne fliser, og to sett ville vært to design oppå hverandre. */
    if (this._c.bare_hero) {
      const bare = aktiv === "unraid" ? this._unraidHtml()
        : aktiv === "unifi" ? this._unifiHtml()
        : aktiv === "proxmox" ? this._proxmoxHtml()
        : this._nedlastingHtml();
      const slutt = bare.indexOf("</div>", bare.indexOf('class="stort"'));
      rot.innerHTML = bare.slice(0, bare.indexOf("</div>", slutt + 6) + 6);
      for (const el of rot.querySelectorAll("[data-mer]")) {
        if (!el.dataset.mer) continue;
        el.addEventListener("click", () => this.dispatchEvent(new CustomEvent(
          "hass-more-info", { detail: { entityId: el.dataset.mer },
            bubbles: true, composed: true })));
      }
      return;
    }

    rot.innerHTML = `
      <div class="fanerad">
        <div class="faner">${faner.map((f) => {
          const h = this._helse(f.id);
          return `<button class="fane ${f.id === aktiv ? "aktiv" : ""}" data-fane="${f.id}">
            <span class="prikk ${h.niva === "ok" ? "" : h.niva}"></span>${kiSrvEsc(f.navn)}
          </button>`;
        }).join("")}</div>
        <button class="cog ${aktiv === "innstillinger" ? "aktiv" : ""}"
          data-fane="${aktiv === "innstillinger" ? "unraid" : "innstillinger"}"
          aria-label="Oppsett"><ha-icon icon="mdi:cog-outline"></ha-icon></button>
      </div>
      ${innhold}`;

    for (const b of rot.querySelectorAll("[data-fane]")) {
      b.addEventListener("click", () => { this._fane = b.dataset.fane; this._tegn(); });
    }
    for (const el of rot.querySelectorAll("[data-mer]")) {
      if (!el.dataset.mer) continue;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent("hass-more-info",
          { detail: { entityId: el.dataset.mer }, bubbles: true, composed: true }));
      });
    }
    for (const el of rot.querySelectorAll("[data-veksle]")) {
      el.addEventListener("click", () => {
        const id = el.dataset.veksle;
        this._h.callService(id.split(".")[0], "toggle", { entity_id: id });
      });
    }
    for (const el of rot.querySelectorAll("[data-kn]")) {
      el.addEventListener("click", () => {
        const id = el.dataset.e;
        const type = el.dataset.t;
        const bekreft = el.dataset.b;
        if (type === "mer") {
          this.dispatchEvent(new CustomEvent("hass-more-info",
            { detail: { entityId: id }, bubbles: true, composed: true }));
          return;
        }
        if (bekreft && !confirm(bekreft)) return;
        const dom = id.split(".")[0];
        if (type === "veksle") this._h.callService(dom, "toggle", { entity_id: id });
        else this._h.callService(dom, dom === "button" ? "press" : "turn_on", { entity_id: id });
      });
    }
    const felt = rot.querySelector(".sok input");
    if (felt) {
      felt.addEventListener("input", (e) => {
        this._sok = e.target.value;
        const pos = e.target.selectionStart;
        this._tegn();
        const nytt = this.shadowRoot.querySelector(".sok input");
        if (nytt) { nytt.focus(); try { nytt.setSelectionRange(pos, pos); } catch (x) { /* ok */ } }
      });
    }
  }
}

customElements.define("ki-server-card", KiServerCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-server-card"))
  window.customCards.push({ type: "ki-server-card", name: "KI Server",
    description: "Unraid, UniFi, Proxmox og nedlasting i ett kort", preview: true });

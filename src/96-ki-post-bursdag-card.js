/*
 * ki-post-bursdag-card — «Bursdager og post» etter designet med samme navn.
 *
 * Øverst to store kort: neste postlevering og neste bursdag (rosa). Trykk velger hva
 * som vises under: postdagene de neste to ukene og pakkene på vei, eller bursdagene med
 * «Legg til bursdag». Kalenderknappen bytter til en månedskalender med prikker for
 * bursdag, post og pakke, og hva som skjer den dagen du trykker på.
 *
 * type: custom:ki-post-bursdag-card
 * post: sensor.nar_kommer_posten_posten_sensor_next     # neste leveringsdato (tilstand = dato)
 * kalender: calendar.birthdays                          # bursdagene som heldagshendelser
 * postnummer: 1670                                      # vises i overskriften «Posten · 1670»
 * sted: Oslo
 * pakker: true                                          # pakker fra Norwegian Parcel Tracker
 * dager: [2, 4]                                         # valgfritt: faste postdager (1 = mandag);
 *                                                       #   ellers annenhver hverdag fra neste levering
 * tittel: false                                         # egen topp med ikon og navn (popupen har sin)
 * start: post                                           # post | bursdag – hva som vises først
 *
 * Nye bursdager lagres i kalenderen som årlig gjentatte heldagshendelser, med fødselsåret i
 * tittelen («Rune (1969)»), så alderen kan regnes ut – som ki-bursdag-pro-card gjør.
 */
(() => {
  const VERSJON = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ROSA = "oklch(0.78 0.13 350)", ROD = "oklch(0.72 0.15 25)", RAV = "oklch(0.82 0.12 75)";
  const a = (c, o) => c.replace(")", ` / ${o})`);
  const ROSAGRAD = "var(--active-big, linear-gradient(135deg, oklch(0.78 0.13 350), oklch(0.9 0.05 20)))";
  const somme = (x, y) => x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  const dag0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const stor = (t) => t.replace(/^./, (c) => c.toUpperCase());
  const ukedagKort = (d) => stor(d.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", ""));
  const datoKort = (d) => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" }).replace(/\.$/, "");
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

  /* «Rune (1985)», «Rune's Birthday» og «bursdag_rune» blir alle til «Rune» */
  const navnFra = (s) => String(s || "")
    .replace(/\(\s*\d{4}\s*\)/g, "").replace(/[_-]+/g, " ")
    .replace(/\b(bursdag|birthday|fodselsdag|fødselsdag)\b/gi, "").replace(/[’']\s*s\b/gi, "")
    .replace(/\s{2,}/g, " ").replace(/^[\s.,·-]+|[\s.,·-]+$/g, "").replace(/^./, (c) => c.toUpperCase());

  const CSS = `
    :host { display:block; }
    * { box-sizing:border-box; }
    button { font:inherit; color:inherit; border:0; background:none; padding:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
    input { font:inherit; }
    .pb { display:flex; flex-direction:column; gap:16px; color:var(--gray1000, #f2f1ee); }
    .topp { display:flex; align-items:center; gap:12px; padding:0 6px; }
    .topp .ik { width:40px; height:40px; border-radius:20px; background:#e9e7e2; color:#141416; display:grid; place-items:center; --mdc-icon-size:22px; }
    .topp b { font-size:26px; font-weight:500; letter-spacing:-.02em; }
    .to { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .stor { height:190px; padding:12px; border-radius:32px; display:flex; flex-direction:column; align-items:flex-start; gap:2px; text-align:left; min-width:0;
      background:var(--gray200, #2a2a2d); transition:transform .2s; }
    .stor:active { transform:scale(.98); }
    .stor.rosa { background:${ROSAGRAD}; color:#2a1720; }
    .stor .ring { width:60px; height:60px; border-radius:30px; display:grid; place-items:center; background:rgba(255,255,255,.1); --mdc-icon-size:28px; }
    .stor.rosa .ring { background:rgba(42,23,32,.12); }
    .stor .luft { flex:1; }
    .stor .sub { font-size:15px; padding:4px 0 0 12px; color:var(--gray800, #c9c7c2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
    .stor.rosa .sub { color:#2a1720; }
    .stor .tall { display:flex; align-items:baseline; gap:5px; white-space:nowrap; padding:0 0 6px 12px; }
    .stor .tall b { font-size:44px; font-weight:300; letter-spacing:-.04em; line-height:1; }
    .stor .tall span { font-size:14px; }
    .prikker { display:flex; justify-content:center; gap:6px; }
    .prikker button { width:8px; height:8px; border-radius:4px; background:#3a3a3d; transition:background .25s; }
    .prikker button.pa { background:#a9a7a2; }
    .seksjon { display:flex; align-items:center; justify-content:space-between; gap:10px; padding-left:6px; }
    .seksjon span { font-size:15px; font-weight:500; }
    .kalknapp { width:40px; height:40px; border-radius:20px; display:grid; place-items:center; background:var(--gray200, #1c1c1f); --mdc-icon-size:20px; transition:background .25s; }
    .kalknapp.pa { background:${ROSAGRAD}; color:#2a1720; }
    .liste { display:flex; flex-direction:column; gap:10px; }
    .flate { padding:16px; border-radius:30px; background:var(--gray200, #1c1c1f); }
    /* bursdager */
    .brad { display:flex; align-items:center; gap:14px; padding:14px 18px 14px 14px; border-radius:30px; background:var(--gray200, #1c1c1f); text-align:left; }
    .brad.snart { background:linear-gradient(100deg, ${a(ROSA, 0.18)}, ${a(ROSA, 0.04)} 70%), var(--gray200, #1c1c1f); }
    .avatar { width:44px; height:44px; border-radius:22px; flex:none; display:grid; place-items:center; font-size:17px; font-weight:600; background:#2a2a2d; color:#c9c7c2; }
    .brad.snart .avatar { background:${ROSA}; color:#2a1720; }
    .midt { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    .midt b { font-size:17px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .midt span { font-size:13px; color:#a9a7a2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dgr { font-size:13px; font-weight:500; padding:5px 11px; border-radius:12px; background:#262629; color:#8e8d89; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .brad.snart .dgr { background:${a(ROSA, 0.22)}; color:#f2f1ee; }
    .ny { display:flex; flex-direction:column; gap:10px; padding:16px; border-radius:30px; background:var(--gray200, #1c1c1f); }
    .ny .nh { display:flex; align-items:center; justify-content:space-between; padding:0 4px; }
    .ny .nh b { font-size:16px; font-weight:500; }
    .ny .nh button { width:32px; height:32px; border-radius:16px; display:grid; place-items:center; color:#a9a7a2; --mdc-icon-size:20px; }
    .ny input { height:48px; border-radius:24px; border:0; outline:none; padding:0 18px; background:#262629; color:#f2f1ee; font-size:15px; color-scheme:dark; width:100%; }
    .ny label { font-size:12px; color:#8e8d89; padding:0 18px; }
    .lagre { height:48px; border-radius:24px; font-size:15px; font-weight:600; background:#262629; color:#6d6c69; transition:background .2s; }
    .lagre.klar { background:${ROSAGRAD}; color:#2a1720; }
    .feil { font-size:13px; color:${ROD}; padding:0 6px; }
    .leggtil { height:56px; border-radius:28px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:15px; font-weight:500;
      background:var(--gray200, #1c1c1f); --mdc-icon-size:22px; }
    /* post */
    .postdager { display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; padding:14px; border-radius:30px; background:var(--gray200, #1c1c1f); }
    .pdag { height:70px; border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; background:#262629; }
    .pdag.pa { background:${a(ROD, 0.18)}; box-shadow:inset 0 0 0 1px ${a(ROD, 0.45)}; }
    .pdag.helg { opacity:.4; }
    .pdag small { font-size:10px; color:#8e8d89; }
    .pdag b { font-size:15px; font-weight:500; font-variant-numeric:tabular-nums; }
    .pdag ha-icon { --mdc-icon-size:14px; color:${ROD}; opacity:0; }
    .pdag.pa ha-icon { opacity:1; }
    .pakke { display:flex; align-items:center; gap:14px; padding:16px 20px; border-radius:30px; background:var(--gray200, #1c1c1f); text-align:left; }
    .pring { width:44px; height:44px; border-radius:22px; flex:none; display:grid; place-items:center; background:${a(RAV, 0.18)}; color:${RAV}; --mdc-icon-size:20px; }
    .pakke.klar .pring { background:${RAV}; color:#2a2010; }
    .pmidt { flex:1; min-width:0; display:flex; flex-direction:column; gap:7px; }
    .pmidt .l1 { display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
    .pmidt .l1 b { font-size:16px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pmidt .l1 span, .pmidt .st { font-size:13px; color:#a9a7a2; white-space:nowrap; }
    .steg { display:flex; gap:3px; }
    .steg i { flex:1; height:4px; border-radius:2px; background:#2e2e32; }
    .steg i.pa { background:${RAV}; }
    .tom { padding:18px 20px; border-radius:30px; background:var(--gray200, #1c1c1f); font-size:14px; color:#8e8d89; }
    /* kalender */
    .kal { display:flex; flex-direction:column; gap:12px; padding:16px; border-radius:30px; background:var(--gray200, #1c1c1f); }
    .kh { display:flex; align-items:center; justify-content:space-between; }
    .kh .pil { width:40px; height:40px; border-radius:20px; background:#262629; display:grid; place-items:center; --mdc-icon-size:22px; }
    .kh .mnd { font-size:17px; font-weight:500; }
    .rute { display:grid; grid-template-columns:repeat(7, 1fr); gap:5px; }
    .ukedag { text-align:center; font-size:11px; color:#6d6c69; padding:2px 0; }
    .celle { height:50px; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; background:#262629; transition:background .2s; }
    .celle.ute { background:transparent; opacity:.25; pointer-events:none; }
    .celle.bday { background:${a(ROSA, 0.16)}; }
    .celle.idag { box-shadow:inset 0 0 0 1.5px #f2f1ee; }
    .celle.valgt { background:${ROSAGRAD}; color:#2a1720; box-shadow:none; }
    .celle b { font-size:14px; font-weight:500; font-variant-numeric:tabular-nums; }
    .celle.idag b, .celle.valgt b { font-weight:600; }
    .celle .pp { display:flex; gap:3px; height:6px; }
    .celle .pp i { width:6px; height:6px; border-radius:3px; }
    .forklaring { display:flex; gap:14px; justify-content:center; font-size:12px; color:#a9a7a2; }
    .forklaring span { display:flex; align-items:center; gap:6px; }
    .forklaring i { width:8px; height:8px; border-radius:4px; }
    .valgttittel { font-size:15px; font-weight:500; padding:4px 6px 0; }
    .hend { display:flex; align-items:center; gap:14px; padding:14px 20px 14px 14px; border-radius:30px; }
    .hend .hik { width:44px; height:44px; border-radius:22px; flex:none; display:grid; place-items:center; --mdc-icon-size:20px; }
  `;

  class KiPostBursdagCard extends HTMLElement {
    constructor() {
      super(); this.attachShadow({ mode: "open" });
      this._modus = null; this._visning = "liste"; this._ny = null; this._bdager = null;
      const n = new Date(); this._mnd = [n.getFullYear(), n.getMonth()]; this._valgt = dag0(n);
    }
    static getStubConfig() { return { post: "", kalender: "" }; }
    getCardSize() { return 10; }

    setConfig(c) {
      this._c = { pakker: true, tittel: false, start: "post", ...c };
      this._modus = this._modus || (this._c.start === "bursdag" ? "bday" : "post");
      this._bdager = null;
      if (this._h) { this._hent(); this._tegn(); }
    }

    set hass(h) {
      const forste = !this._h;
      this._h = h;
      if (forste || !this._hentet || Date.now() - this._hentet > 6 * 3600e3) this._hent();
      const post = h.states[this._c.post];
      const sig = [post && post.state, ...Object.keys(h.states).filter((id) => /parcel|pakke|sporing/.test(id)).map((id) => h.states[id].state)].join("|");
      if (sig === this._sig && !forste) return;
      this._sig = sig;
      this._tegn();
    }

    /* ---------- data ---------- */
    async _hent() {
      const h = this._h, c = this._c;
      this._hentet = Date.now();
      if (!c.kalender || !h || !h.callApi) { this._bdager = []; return; }
      const fra = dag0(new Date()), til = new Date(fra); til.setDate(til.getDate() + 370);
      try {
        const svar = await h.callApi("GET", `calendars/${c.kalender}?start=${encodeURIComponent(fra.toISOString())}&end=${encodeURIComponent(til.toISOString())}`);
        const sett = new Map();
        (svar || []).forEach((e) => {
          const start = e.start && (e.start.date || e.start.dateTime || e.start);
          const d = new Date(start); if (isNaN(d)) return;
          d.setHours(0, 0, 0, 0);
          const tekst = `${e.description || ""} ${e.summary || ""}`;
          const full = tekst.match(/(\d{4})-(\d{2})-(\d{2})/), bare = tekst.match(/(?:f\.?|født|fodt|\()\s*(\d{4})/i);
          const fodt = full ? Number(full[1]) : bare ? Number(bare[1]) : null;
          const navn = navnFra(e.summary || "");
          if (!navn) return;
          const nokkel = `${navn}|${d.getMonth()}|${d.getDate()}`;
          if (sett.has(nokkel)) return;         // gjentatte hendelser: bare første gang
          sett.set(nokkel, { navn, dato: d, fodt, alder: fodt ? d.getFullYear() - fodt : null });
        });
        this._bdager = [...sett.values()].sort((x, y) => x.dato - y.dato);
      } catch (e) { this._bdager = []; }
      this._tegn();
    }

    _bursdager() {
      const i0 = dag0(new Date());
      return (this._bdager || []).map((b) => ({ ...b, dager: Math.round((b.dato - i0) / 864e5) })).filter((b) => b.dager >= 0);
    }
    _bdPaa(d) { return this._bursdager().filter((b) => b.dato.getMonth() === d.getMonth() && b.dato.getDate() === d.getDate()); }

    /* Postdagene: faste ukedager (dager:), ellers annenhver hverdag regnet fra neste levering. */
    _nestePost() {
      const st = this._h && this._h.states[this._c.post];
      const d = st ? new Date(st.state) : null;
      return d && !isNaN(d) ? dag0(d) : null;
    }
    _erPost(d) {
      const wd = d.getDay();
      if (!wd || wd === 6) return false;
      const faste = Array.isArray(this._c.dager) && this._c.dager.length ? this._c.dager.map(Number) : null;
      if (faste) return faste.includes(wd === 0 ? 7 : wd);
      const st = this._h && this._h.states[this._c.post];
      const liste = st && (st.attributes.delivery_dates || st.attributes.next_delivery_dates || st.attributes.dates);
      if (Array.isArray(liste) && liste.length) return liste.some((x) => somme(dag0(new Date(x)), d));
      const ref = this._nestePost();
      if (!ref) return false;
      // hverdager mellom ref og d; annenhver er postdag
      const dager = Math.round((dag0(d) - ref) / 864e5);
      const uker = Math.floor(dager / 7);
      let hverdager = uker * 5;
      const rest = ((dager % 7) + 7) % 7;
      for (let i = 1; i <= rest; i++) { const x = new Date(ref); x.setDate(x.getDate() + uker * 7 + i); const w = x.getDay(); if (w && w !== 6) hverdager++; }
      return ((hverdager % 2) + 2) % 2 === 0;
    }
    _forstePost() {
      const i0 = dag0(new Date());
      for (let i = 0; i < 21; i++) { const d = new Date(i0); d.setDate(d.getDate() + i); if (this._erPost(d)) return d; }
      return this._nestePost();
    }

    _pakker() {
      const h = this._h;
      if (!h || this._c.pakker === false) return [];
      const reg = h.entities || {};
      const ut = [];
      for (const [id, e] of Object.entries(reg)) {
        if (e.platform !== "norwegian_parcel_tracker" || !id.startsWith("sensor.") || !/_status$/.test(id)) continue;
        const st = h.states[id]; if (!st) continue;
        const at = st.attributes || {};
        const t = String(st.state || "").toLowerCase();
        const levert = /levert|delivered|utlevert/.test(t);
        if (levert) continue;
        const klar = /hentes|ready|klar|pickup|utleveringssted/.test(t);
        const transport = /transport|underveis|in transit|sortert|på vei|pa vei/.test(t);
        const steg = klar ? 3 : transport ? 2 : 1;
        const eta = at.estimated_delivery || at.forventet_levering || "";
        const d = eta ? new Date(eta) : null;
        ut.push({ id, navn: (at.friendly_name || id.slice(7)).replace(/\s*status\s*$/i, "").trim() || "Pakke",
          status: klar && (at.pickup_point || at.hentested) ? `Til hentested · ${at.pickup_point || at.hentested}` : at.latest_event || at.siste_hendelse || st.state,
          steg, klar, eta: d && !isNaN(d) ? dag0(d) : null,
          ikon: klar ? "mdi:package-variant-closed-check" : transport ? "mdi:truck-delivery-outline" : "mdi:package-variant" });
      }
      return ut.sort((x, y) => y.steg - x.steg);
    }

    /* ---------- tegning ---------- */
    _tegn() {
      if (!this._h || !this._c) return;
      const i0 = dag0(new Date());
      const bl = this._bursdager();
      const nb = bl[0];
      const fp = this._forstePost();
      const isB = this._modus === "bday";
      const pakker = this._pakker();

      const postKort = `<button class="stor" data-modus="post">
          <span class="ring"><ha-icon icon="mdi:email"></ha-icon></span><span class="luft"></span>
          <span class="sub">Neste post</span>
          <span class="tall"><b>${fp ? (somme(fp, i0) ? "I dag" : ukedagKort(fp)) : "–"}</b><span>${fp && !somme(fp, i0) ? esc(datoKort(fp)) : ""}</span></span></button>`;
      const bdKort = `<button class="stor rosa" data-modus="bday">
          <span class="ring"><ha-icon icon="mdi:cake-variant"></ha-icon></span><span class="luft"></span>
          <span class="sub">${nb ? esc(nb.alder ? `${nb.navn} fyller ${nb.alder}` : nb.navn) : "Ingen bursdager"}</span>
          <span class="tall"><b>${nb ? (nb.dager === 0 ? "I dag" : nb.dager) : "–"}</b><span>${nb && nb.dager ? (nb.dager === 1 ? "dag" : "dager") : ""}</span></span></button>`;

      const sted = this._c.postnummer || this._c.sted ? ` · ${[this._c.postnummer, this._c.sted].filter(Boolean).join(" ")}` : "";
      let under = "";
      if (this._visning === "kal") under = this._kalHtml(bl, pakker);
      else if (isB) under = this._bdHtml(bl);
      else under = this._postHtml(pakker);

      this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="pb">
        ${this._c.tittel ? `<div class="topp"><span class="ik"><ha-icon icon="mdi:gift"></ha-icon></span><b>${esc(this._c.tittel === true ? "Bursdager og post" : this._c.tittel)}</b></div>` : ""}
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="to">${postKort}${bdKort}</div>
          <div class="prikker"><button class="${!isB ? "pa" : ""}" data-modus="post" aria-label="Post"></button><button class="${isB ? "pa" : ""}" data-modus="bday" aria-label="Bursdager"></button></div>
        </div>
        <div class="seksjon"><span>${this._visning === "kal" ? "Kalender" : isB ? "Bursdager" : `Posten${esc(sted)}`}</span>
          <button class="kalknapp ${this._visning === "kal" ? "pa" : ""}" data-kal aria-label="Kalender"><ha-icon icon="${this._visning === "kal" ? "mdi:view-agenda-outline" : "mdi:calendar-month"}"></ha-icon></button></div>
        ${under}
      </div>`;
      this._koble();
    }

    _bdHtml(bl) {
      const rader = bl.slice(1).map((b) => {
        const snart = b.dager < 60;
        return `<div class="brad ${snart ? "snart" : ""}"><span class="avatar">${esc(b.navn[0] || "?")}</span>
          <div class="midt"><b>${esc(b.navn)}</b><span>${b.alder ? `Fyller ${b.alder} · ` : ""}${esc(b.dato.toLocaleDateString("nb-NO", { day: "numeric", month: "long" }))}</span></div>
          <span class="dgr">${b.dager} d</span></div>`;
      }).join("");
      const tom = this._bdager === null ? `<div class="tom">Henter bursdagene …</div>`
        : !bl.length ? `<div class="tom">${this._c.kalender ? "Ingen bursdager i kalenderen ennå." : "Velg en kalender for bursdagene (kalender:)."}</div>` : "";
      const n = this._ny;
      const ok = n && n.navn && n.navn.trim() && /^\d{4}-\d{2}-\d{2}$/.test(n.dato || "");
      const skjema = n ? `<div class="ny">
          <div class="nh"><b>Ny bursdag</b><button data-lukk aria-label="Lukk"><ha-icon icon="mdi:close"></ha-icon></button></div>
          <input id="nnavn" placeholder="Navn" value="${esc(n.navn || "")}">
          <div style="display:flex;flex-direction:column;gap:4px"><label>Fødselsdato</label><input id="ndato" type="date" value="${esc(n.dato || "")}"></div>
          ${this._feil ? `<div class="feil">${esc(this._feil)}</div>` : ""}
          <button class="lagre ${ok ? "klar" : ""}" data-lagre>${this._lagrer ? "Lagrer …" : "Lagre"}</button></div>` : "";
      return `<section class="liste">${rader}${tom}</section>${skjema}
        ${this._c.kalender && !n ? `<button class="leggtil" data-ny><ha-icon icon="mdi:plus"></ha-icon>Legg til bursdag</button>` : ""}`;
    }

    _postHtml(pakker) {
      const i0 = dag0(new Date());
      const dager = Array.from({ length: 14 }, (_, i) => { const d = new Date(i0); d.setDate(d.getDate() + i); return d; });
      const rute = this._c.post ? `<section class="postdager">${dager.map((d) => {
        const pa = this._erPost(d), helg = d.getDay() === 0 || d.getDay() === 6;
        return `<div class="pdag ${pa ? "pa" : ""} ${helg ? "helg" : ""}"><small>${esc(d.toLocaleDateString("nb-NO", { weekday: "short" }).replace(".", ""))}</small>
          <b>${d.getDate()}</b><ha-icon icon="mdi:email"></ha-icon></div>`; }).join("")}</section>`
        : `<div class="tom">Velg sensoren for neste postlevering (post:).</div>`;
      const eta = (d) => { if (!d) return ""; const diff = Math.round((d - i0) / 864e5);
        return diff <= 0 ? "I dag" : diff === 1 ? "I morgen" : diff < 7 ? ukedagKort(d) : datoKort(d); };
      const liste = pakker.map((p) => `<button class="pakke ${p.klar ? "klar" : ""}" data-mer="${esc(p.id)}">
          <span class="pring"><ha-icon icon="${p.ikon}"></ha-icon></span>
          <div class="pmidt"><div class="l1"><b>${esc(p.navn)}</b><span>${esc(p.klar ? "Klar" : eta(p.eta))}</span></div>
            <div class="steg">${[1, 2, 3, 4].map((k) => `<i class="${k <= p.steg ? "pa" : ""}"></i>`).join("")}</div>
            <span class="st">${esc(p.status)}</span></div></button>`).join("");
      return `${rute}${liste ? `<section class="liste">${liste}</section>` : ""}`;
    }

    _kalHtml(bl, pakker) {
      const [y, m] = this._mnd, f1 = new Date(y, m, 1), off = (f1.getDay() + 6) % 7;
      const i0 = dag0(new Date()), sel = this._valgt;
      const celler = Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - off + i));
      const pkPaa = (d) => pakker.filter((p) => p.eta && somme(p.eta, d));
      const bdPaa = (d) => bl.filter((b) => b.dato.getMonth() === d.getMonth() && b.dato.getDate() === d.getDate());
      const prikk = (vis, farge) => `<i style="background:${farge};display:${vis ? "block" : "none"}"></i>`;
      const rute = celler.map((d) => {
        const inn = d.getMonth() === m, valgt = somme(d, sel), idag = somme(d, i0), hb = inn && bdPaa(d).length > 0;
        return `<button class="celle ${inn ? "" : "ute"} ${hb ? "bday" : ""} ${idag ? "idag" : ""} ${valgt ? "valgt" : ""}" data-dag="${iso(d)}">
          <b>${d.getDate()}</b><span class="pp">${prikk(hb, valgt ? "#2a1720" : ROSA)}${prikk(inn && this._erPost(d), valgt ? "#6a2a20" : ROD)}${prikk(inn && pkPaa(d).length > 0, valgt ? "#6a5020" : RAV)}</span></button>`;
      }).join("");
      const ting = [
        ...bdPaa(sel).map((b) => ({ ik: "mdi:cake-variant", t: b.navn, u: b.fodt ? `Fyller ${sel.getFullYear() - b.fodt}` : "Bursdag", c: ROSA, blekk: "#2a1720" })),
        ...(this._erPost(sel) ? [{ ik: "mdi:email", t: "Posten leverer", u: "Brev i postkassen", c: ROD, blekk: "#2a1512" }] : []),
        ...pkPaa(sel).map((p) => ({ ik: p.ikon, t: p.navn, u: p.status, c: RAV, blekk: "#2a2010" })),
      ];
      const tittel = (somme(sel, i0) ? "I dag · " : "") + stor(sel.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }));
      return `<section class="kal">
          <div class="kh"><button class="pil" data-mnd="-1" aria-label="Forrige måned"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <button class="mnd" data-idag>${esc(stor(f1.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })))}</button>
            <button class="pil" data-mnd="1" aria-label="Neste måned"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div>
          <div class="rute">${["M", "T", "O", "T", "F", "L", "S"].map((w) => `<div class="ukedag">${w}</div>`).join("")}${rute}</div>
          <div class="forklaring"><span><i style="background:${ROSA}"></i>Bursdag</span><span><i style="background:${ROD}"></i>Post</span><span><i style="background:${RAV}"></i>Pakke</span></div>
        </section>
        <div class="valgttittel">${esc(tittel)}</div>
        <section class="liste">${ting.map((e) => `<div class="hend" style="background:linear-gradient(100deg, ${a(e.c, 0.2)}, ${a(e.c, 0.05)} 70%), var(--gray200, #1c1c1f)">
            <span class="hik" style="background:${e.c};color:${e.blekk}"><ha-icon icon="${e.ik}"></ha-icon></span>
            <div class="midt"><b>${esc(e.t)}</b><span>${esc(e.u)}</span></div></div>`).join("")
          || `<div class="tom">Ingen bursdager eller post denne dagen</div>`}</section>`;
    }

    _haptikk(t = "light") { try { window.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true })); } catch (e) { /* eldre */ } }

    _koble() {
      const r = this.shadowRoot;
      r.querySelectorAll("[data-modus]").forEach((b) => b.addEventListener("click", () => {
        this._haptikk("selection"); this._modus = b.dataset.modus; this._visning = "liste"; this._tegn(); }));
      const k = r.querySelector("[data-kal]");
      if (k) k.addEventListener("click", () => { this._haptikk("selection"); this._visning = this._visning === "kal" ? "liste" : "kal"; this._tegn(); });
      r.querySelectorAll("[data-mnd]").forEach((b) => b.addEventListener("click", () => {
        const [y, m] = this._mnd, n = m + Number(b.dataset.mnd);
        this._mnd = n < 0 ? [y - 1, 11] : n > 11 ? [y + 1, 0] : [y, n]; this._tegn(); }));
      const idag = r.querySelector("[data-idag]");
      if (idag) idag.addEventListener("click", () => { const n = new Date(); this._mnd = [n.getFullYear(), n.getMonth()]; this._valgt = dag0(n); this._tegn(); });
      r.querySelectorAll("[data-dag]").forEach((b) => b.addEventListener("click", () => {
        const [yy, mm, dd] = b.dataset.dag.split("-").map(Number); this._valgt = new Date(yy, mm - 1, dd); this._haptikk("selection"); this._tegn(); }));
      r.querySelectorAll("[data-mer]").forEach((b) => b.addEventListener("click", () => {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true }); ev.detail = { entityId: b.dataset.mer }; this.dispatchEvent(ev); }));
      const ny = r.querySelector("[data-ny]");
      if (ny) ny.addEventListener("click", () => { this._ny = { navn: "", dato: "" }; this._feil = null; this._tegn(); });
      const lukk = r.querySelector("[data-lukk]");
      if (lukk) lukk.addEventListener("click", () => { this._ny = null; this._feil = null; this._tegn(); });
      const nn = r.querySelector("#nnavn"), nd = r.querySelector("#ndato"), lagre = r.querySelector("[data-lagre]");
      const oppdater = () => {
        this._ny = { navn: nn.value, dato: nd.value };
        const ok = this._ny.navn.trim() && /^\d{4}-\d{2}-\d{2}$/.test(this._ny.dato);
        if (lagre) lagre.classList.toggle("klar", !!ok);
      };
      if (nn) nn.addEventListener("input", oppdater);
      if (nd) nd.addEventListener("input", oppdater);
      if (nd) nd.addEventListener("change", oppdater);
      if (lagre) lagre.addEventListener("click", () => this._lagre());
    }

    /* Ny bursdag: én heldagshendelse som gjentas årlig, med fødselsåret i tittelen og
       datoen i beskrivelsen. Støtter ikke kalenderen gjentakelse, legges ti år inn én og én. */
    async _lagre() {
      const n = this._ny || {}, c = this._c, h = this._h;
      if (!n.navn || !n.navn.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(n.dato || "")) { this._feil = "Skriv navn og fødselsdato."; return this._tegn(); }
      if (this._lagrer) return;
      const [fy, fm, fd] = n.dato.split("-").map(Number);
      const i0 = dag0(new Date());
      let aar = i0.getFullYear();
      if (new Date(aar, fm - 1, fd) < i0) aar += 1;
      const tittel = `${n.navn.trim()} (${fy})`;
      const lag = (a2, rrule) => {
        const d = new Date(a2, fm - 1, fd), s = new Date(d); s.setDate(s.getDate() + 1);
        const data = { entity_id: c.kalender, summary: tittel, description: `Født ${n.dato}`, start_date: iso(d), end_date: iso(s) };
        if (rrule) data.rrule = rrule;
        return h.callService("calendar", "create_event", data);
      };
      this._lagrer = true; this._tegn();
      try {
        try { await lag(aar, "FREQ=YEARLY"); }
        catch (e) { for (let i = 0; i < 10; i++) await lag(aar + i); }
        this._ny = null; this._feil = null;
        this._haptikk("success");
        await this._hent();
      } catch (e) {
        this._feil = `Fikk ikke lagret: ${e.message || e}`;
      }
      this._lagrer = false; this._tegn();
    }
  }

  if (!customElements.get("ki-post-bursdag-card")) customElements.define("ki-post-bursdag-card", KiPostBursdagCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-post-bursdag-card"))
    window.customCards.push({ type: "ki-post-bursdag-card", name: "KI Post og bursdager",
      description: "Neste postlevering og bursdag, postdager, pakker og en kalender med alt samlet.", preview: false });
  console.info(`%c KI-POST-BURSDAG %c ${VERSJON} `, "color:#2a1720;background:#f3a6c8", "color:#f3a6c8;background:#2a1720");
})();

/* ki-media-card – nå spilles med levende omslag, transport, volum og radiokanaler.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-media-card
 * media: media_player.squeezebox_radio
 * visning: full            # full (alt) | naa (bare topplinja, f.eks. over faner)
 * radio: [{navn: NRK P1, skript: script.nrk_p1}]
 * kontroll: {play_pause: script..., neste: ..., forrige: ..., shuffle: ..., repeat: ...}
 * grupper: [{navn: Oppe, entity: input_boolean.sonos_group_oppe}]
 */
const KI_MEDIA_VERSJON = "1.0.0";

const KI_MEDIA_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .rot { display:grid; gap:12px; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* ---- nå spilles ---- */
  .naa { position:relative; min-height:66px; border-radius:75px; overflow:hidden; isolation:isolate;
    background:var(--gray200); color:var(--gray1000); display:grid; grid-template-columns:76px 1fr min-content;
    grid-template-areas:"om tittel eq" "om under eq"; align-items:center; padding:4px 20px 4px 4px;
    transition:background .6s var(--myk), color .4s; cursor:pointer; }
  .naa.spiller { background:var(--ki-tone, var(--gray1000)); color:var(--ki-blekk,#111); }
  .naa.av { background:var(--gray200); color:var(--gray1000); }
  .bakgrunn { position:absolute; inset:-30%; z-index:-1; opacity:0; transition:opacity .8s ease;
    background-size:cover; background-position:center; filter:blur(22px) saturate(1.5); }
  .naa.harbilde .bakgrunn { opacity:.55; animation:kenburns 26s ease-in-out infinite alternate; }
  @keyframes kenburns { from { transform:scale(1) translate3d(0,0,0); } to { transform:scale(1.18) translate3d(-3%,2%,0); } }
  .omslag { grid-area:om; position:relative; width:58px; height:58px; border-radius:50%; overflow:hidden; justify-self:start;
    background:rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; }
  .omslag img { width:100%; height:100%; object-fit:cover; }
  .omslag ha-icon { --mdc-icon-size:28px; opacity:.75; }
  .naa.spiller .omslag { animation:snurr 18s linear infinite; }
  @keyframes snurr { to { transform:rotate(360deg); } }
  .tittel { grid-area:tittel; align-self:end; padding-top:4px; font-size:16px; font-weight:500; min-width:0; }
  .under { grid-area:under; align-self:start; padding-bottom:7px; font-size:14px; opacity:.7; min-width:0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rulle { display:block; white-space:nowrap; overflow:hidden; }
  .rulle span { display:inline-block; }
  .rulle.lang span { animation:rull 16s linear infinite; padding-right:40px; }
  @keyframes rull { 0%,8% { transform:translateX(0); } 92%,100% { transform:translateX(-100%); } }
  .eqboks { grid-area:eq; justify-self:end; display:flex; align-items:center; gap:10px; }
  .eq { display:inline-flex; align-items:flex-end; gap:2.5px; height:16px; }
  .eq i { width:3px; border-radius:2px; background:currentColor; height:30%; animation:eqhopp .85s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay:-.25s; } .eq i:nth-child(3) { animation-delay:-.55s; }
  .eq i:nth-child(4) { animation-delay:-.1s; } .eq i:nth-child(5) { animation-delay:-.4s; }
  @keyframes eqhopp { from { height:20%; } to { height:100%; } }
  .eq.pause i { animation-play-state:paused; height:34%; }
  .framdrift { position:absolute; left:0; right:0; bottom:0; height:3px; background:rgba(0,0,0,.12); }
  .framdrift i { display:block; height:100%; width:0; background:currentColor; opacity:.6; transition:width 1s linear; }
  .tid { font-size:12px; opacity:.65; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .eqboks { flex-wrap:nowrap; }

  /* ---- transport ---- */
  .transport { display:flex; align-items:center; justify-content:center; gap:10px; }
  .tk { border:0; background:none; color:var(--gray1000); display:flex; align-items:center; justify-content:center;
    cursor:pointer; border-radius:50%; transition:transform .12s var(--fjaer), background .2s, opacity .2s; }
  .tk:active { transform:scale(.9); }
  .tk.liten { width:44px; height:44px; --mdc-icon-size:24px; opacity:.6; }
  .tk.liten.pa { opacity:1; color:var(--active-big,#ee95ff); }
  .tk.midt2 { width:50px; height:50px; --mdc-icon-size:34px; }
  .tk.stor { width:76px; height:76px; background:var(--active-big,#ee95ff); color:var(--black,#000); --mdc-icon-size:30px;
    box-shadow:0 8px 24px rgba(0,0,0,.28); }
  .tk.stor.spiller::after { content:""; position:absolute; width:76px; height:76px; border-radius:50%;
    border:2px solid var(--active-big,#ee95ff); animation:ringut 2.4s ease-out infinite; }
  .tk.stor { position:relative; }
  @keyframes ringut { 0% { transform:scale(1); opacity:.55; } 100% { transform:scale(1.5); opacity:0; } }

  /* ---- volum ---- */
  .volum { display:grid; grid-template-columns:auto 1fr 52px; gap:10px; align-items:center; }
  .gruppe { display:flex; gap:6px; }
  .gknapp { border:0; font:inherit; font-size:13px; font-weight:500; padding:8px 14px; border-radius:999px;
    background:var(--gray200); color:var(--gray1000); cursor:pointer; transition:background .2s, color .2s, transform .12s var(--fjaer); }
  .gknapp:active { transform:scale(.96); }
  .gknapp.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none;
    background:linear-gradient(to right, var(--active-big,#ee95ff) 0 var(--p,0%), var(--gray200) var(--p,0%) 100%); }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
  input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
  .vtall { font-size:14px; font-weight:500; text-align:right; font-variant-numeric:tabular-nums; }

  /* ---- radiokanaler ---- */
  .radio { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding:2px; margin:0 -2px; scroll-snap-type:x proximity; }
  .radio::-webkit-scrollbar { display:none; }
  .kanal { position:relative; flex:none; width:76px; height:76px; border:0; border-radius:24px; cursor:pointer; scroll-snap-align:start;
    background:var(--gray200); color:var(--gray1000); font:inherit; font-size:12px; font-weight:600; line-height:1.2;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px; overflow:hidden;
    transition:transform .14s var(--fjaer), background .25s, color .25s; }
  .kanal:active { transform:scale(.94); }
  .kanal ha-icon { --mdc-icon-size:22px; opacity:.8; }
  .kanal.spiller { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .kanal .bolge { position:absolute; left:0; right:0; bottom:0; height:16px; display:flex; align-items:flex-end;
    justify-content:center; gap:2px; opacity:0; }
  .kanal.spiller .bolge { opacity:.5; }
  .kanal .bolge i { width:2.5px; border-radius:2px; background:currentColor; height:25%; animation:eqhopp .8s ease-in-out infinite alternate; }
  .kanal .bolge i:nth-child(2) { animation-delay:-.2s; } .kanal .bolge i:nth-child(3) { animation-delay:-.45s; }
  .kanal .bolge i:nth-child(4) { animation-delay:-.65s; }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiMediaEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiMediaKl = (s) => {
  const n = Math.max(0, Math.round(s || 0)), m = Math.floor(n / 60), t = n % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(t).padStart(2, "0")}`
    : `${m}:${String(t).padStart(2, "0")}`;
};

class KiMediaCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._farge = {}; }
  static getConfigElement() { return document.createElement("ki-media-card-editor"); }
  static getStubConfig() { return { media: "media_player.squeezebox_radio", visning: "full" }; }
  getCardSize() { return this._c && this._c.visning === "naa" ? 1 : 8; }

  setConfig(c) {
    if (!c || !c.media) throw new Error("Sett media: til mediaspilleren");
    this._c = { visning: "full", ikon: "mdi:speaker", ...c };
    this._radio = (c.radio || []).map((r) => typeof r === "string" ? { navn: r } : r);
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const ids = [c.media, ...(c.grupper || []).map((g2) => g2.entity)].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._oppdater();
  }
  get hass() { return this._h; }
  connectedCallback() { this._start(); if (this._bygget) this._oppdater(); }
  disconnectedCallback() { clearInterval(this._ur); }
  _start() { clearInterval(this._ur); this._ur = setInterval(() => this._tikk(), 1000); }

  _st() { return this._h && this._h.states[this._c.media]; }
  _spiller() { const s = this._st(); return !!s && s.state === "playing"; }
  _pause() { const s = this._st(); return !!s && s.state === "paused"; }

  /* Posisjon regnes ut fra media_position + tidspunktet den ble oppdatert */
  _posisjon() {
    const s = this._st(); if (!s) return null;
    const a = s.attributes, p = a.media_position, t = a.media_position_updated_at, d = a.media_duration;
    if (p === undefined || !d) return null;
    const gaatt = t ? (Date.now() - new Date(t).getTime()) / 1000 : 0;
    return { na: Math.min(d, p + (this._spiller() ? Math.max(0, gaatt) : 0)), total: d };
  }
  _tikk() {
    if (!this._bygget) return;
    const p = this._posisjon(), b = this.shadowRoot.querySelector(".framdrift i"), t = this.shadowRoot.querySelector(".tid");
    if (!p) { if (b) b.style.width = "0"; if (t) t.textContent = ""; return; }
    if (b) b.style.width = ((p.na / p.total) * 100).toFixed(2) + "%";
    if (t) t.textContent = `${kiMediaKl(p.na)} / ${kiMediaKl(p.total)}`;
  }

  /* Henter en dominerende farge fra omslaget, med lys/mørk tekst etter lumen */
  _tone(url) {
    if (!url || this._farge[url] !== undefined) { this._settTone(this._farge[url]); return; }
    this._farge[url] = null;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas"), n = 12;
        c.width = n; c.height = n;
        const x = c.getContext("2d"); x.drawImage(img, 0, 0, n, n);
        const d = x.getImageData(0, 0, n, n).data;
        let r = 0, g = 0, b = 0, v = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const vekt = 0.3 + (mx - mn) / 255;           /* mettede piksler teller mer */
          r += d[i] * vekt; g += d[i + 1] * vekt; b += d[i + 2] * vekt; v += vekt;
        }
        r = Math.round(r / v); g = Math.round(g / v); b = Math.round(b / v);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        this._farge[url] = { bg: `rgb(${r},${g},${b})`, blekk: lum > 0.55 ? "rgba(20,16,22,.92)" : "#fff" };
      } catch (e) { this._farge[url] = null; }
      this._settTone(this._farge[url]);
    };
    img.onerror = () => { this._farge[url] = null; };
    img.crossOrigin = "anonymous"; img.src = url;
  }
  _settTone(f) {
    const n = this.shadowRoot && this.shadowRoot.querySelector(".naa"); if (!n) return;
    n.style.setProperty("--ki-tone", f ? f.bg : "var(--gray1000)");
    n.style.setProperty("--ki-blekk", f ? f.blekk : "var(--black,#111)");
  }

  _kall(navn, standard, data) {
    const k = (this._c.kontroll || {})[navn];
    if (navigator.vibrate) navigator.vibrate(8);
    if (k) { const [d, s] = k.split("."); return this._h.callService(d, s, {}); }
    return this._h.callService("media_player", standard, { entity_id: this._c.media, ...(data || {}) });
  }
  _spillPause() {
    const s = this._st();
    this._kall("play_pause", "media_play_pause");
    if (s) { /* raskt svar i grensesnittet */ }
  }
  _mer() { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._c.media }, bubbles: true, composed: true })); }

  _bygg() {
    const c = this._c, full = c.visning !== "naa";
    const eq = `<span class="eq"><i></i><i></i><i></i><i></i><i></i></span>`;
    this.shadowRoot.innerHTML = `<style>${KI_MEDIA_STIL}</style>
      <div class="rot">
        <div class="naa" role="button" tabindex="0">
          <div class="bakgrunn"></div>
          <div class="omslag"><ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon></div>
          <div class="tittel"><span class="rulle"><span class="tt"></span></span></div>
          <div class="under"></div>
          <div class="eqboks"><span class="tid"></span>${eq}</div>
          <div class="framdrift"><i></i></div>
        </div>

        ${full && this._radio.length ? `<div class="radio">${this._radio.map((r, i) =>
          `<button class="kanal" data-radio="${i}">${r.ikon ? `<ha-icon icon="${kiMediaEsc(r.ikon)}"></ha-icon>` : ""}
            <span>${kiMediaEsc(r.navn)}</span>
            <span class="bolge"><i></i><i></i><i></i><i></i></span></button>`).join("")}</div>` : ""}

        ${full ? `<div class="transport">
          <button class="tk liten" data-t="repeat" aria-label="Gjenta"><ha-icon icon="mdi:repeat-off"></ha-icon></button>
          <button class="tk midt2" data-t="forrige" aria-label="Forrige"><ha-icon icon="mdi:skip-backward"></ha-icon></button>
          <button class="tk stor" data-t="spill" aria-label="Spill eller pause"><ha-icon icon="mdi:play"></ha-icon></button>
          <button class="tk midt2" data-t="neste" aria-label="Neste"><ha-icon icon="mdi:skip-forward"></ha-icon></button>
          <button class="tk liten" data-t="shuffle" aria-label="Tilfeldig"><ha-icon icon="mdi:shuffle-disabled"></ha-icon></button>
        </div>

        <div class="volum">
          <div class="gruppe">${(c.grupper || []).map((g, i) =>
            `<button class="gknapp" data-g="${i}">${kiMediaEsc(g.navn)}</button>`).join("")}</div>
          <input type="range" min="0" max="100" step="1" value="0" aria-label="Volum">
          <div class="vtall">–</div>
        </div>` : ""}
      </div>`;

    const r = this.shadowRoot;
    const naa = r.querySelector(".naa");
    naa.addEventListener("click", () => this._mer());
    naa.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._mer(); } });
    r.querySelectorAll("[data-radio]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const v = this._radio[+b.dataset.radio];
      if (navigator.vibrate) navigator.vibrate(10);
      if (v.skript) { const [d, s] = v.skript.split("."); this._h.callService(d, s, {}); }
      else if (v.kilde) this._h.callService("media_player", "select_source", { entity_id: c.media, source: v.kilde });
    }));
    r.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.t, s = this._st(), a = (s && s.attributes) || {};
      if (t === "spill") this._spillPause();
      else if (t === "neste") this._kall("neste", "media_next_track");
      else if (t === "forrige") this._kall("forrige", "media_previous_track");
      else if (t === "shuffle") this._kall("shuffle", "shuffle_set", { shuffle: !a.shuffle });
      else if (t === "repeat") {
        const nå = a.repeat || "off";
        this._kall("repeat", "repeat_set", { repeat: nå === "off" ? "all" : nå === "all" ? "one" : "off" });
      }
    }));
    r.querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => {
      const g = (c.grupper || [])[+b.dataset.g];
      if (navigator.vibrate) navigator.vibrate(8);
      this._h.callService("homeassistant", "toggle", { entity_id: g.entity });
    }));
    const vol = r.querySelector('input[type=range]');
    if (vol) {
      vol.addEventListener("input", () => {
        r.querySelector(".vtall").textContent = vol.value + " %";
        vol.style.setProperty("--p", vol.value + "%");
      });
      vol.addEventListener("change", () => this._h.callService("media_player", "volume_set",
        { entity_id: c.media, volume_level: +vol.value / 100 }));
    }
    this._bygget = true; this._start();
  }

  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    const s = h.states[c.media];
    if (!s) {
      this._bygget = false;
      this.shadowRoot.innerHTML = `<style>${KI_MEDIA_STIL}</style><div class="feil">Fant ikke ${kiMediaEsc(c.media)}.</div>`;
      return;
    }
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, a = s.attributes, spiller = this._spiller(), pause = this._pause();
    const naa = r.querySelector(".naa");
    naa.classList.toggle("spiller", spiller || pause);
    naa.classList.toggle("av", !spiller && !pause);

    /* omslag og tone */
    const bilde = a.entity_picture ? (a.entity_picture.startsWith("http") ? a.entity_picture : a.entity_picture) : null;
    const om = r.querySelector(".omslag");
    naa.classList.toggle("harbilde", !!bilde);
    r.querySelector(".bakgrunn").style.backgroundImage = bilde ? `url("${bilde}")` : "none";
    if (bilde) {
      if (om.dataset.bilde !== bilde) { om.dataset.bilde = bilde; om.innerHTML = `<img src="${bilde}" alt="">`; }
      this._tone(bilde);
    } else if (om.dataset.bilde) { delete om.dataset.bilde; om.innerHTML = `<ha-icon icon="${kiMediaEsc(c.ikon)}"></ha-icon>`; this._settTone(null); }

    /* tekst */
    const tittel = a.media_title || (s.state === "off" ? "Av" : s.state === "idle" ? "Ingenting spilles" : c.navn || "Media");
    const under = [a.media_artist, a.media_album_name, a.media_channel].filter(Boolean).join(" · ")
      || a.app_name || c.navn || "";
    const tt = r.querySelector(".tt");
    if (tt.textContent !== tittel) {
      tt.textContent = tittel;
      const rull = r.querySelector(".rulle");
      rull.classList.toggle("lang", tittel.length > 26);
      if (rull.classList.contains("lang") && rull.querySelectorAll("span").length < 2) tt.insertAdjacentHTML("afterend", `<span>${kiMediaEsc(tittel)}</span>`);
      else if (!rull.classList.contains("lang")) rull.querySelectorAll("span:not(.tt)").forEach((x) => x.remove());
    }
    const u = r.querySelector(".under"); if (u.textContent !== under) u.textContent = under;

    const eq = r.querySelector(".eq");
    eq.style.display = spiller || pause ? "" : "none";
    eq.classList.toggle("pause", pause && !spiller);

    /* transport */
    const spill = r.querySelector('[data-t="spill"]');
    if (spill) {
      spill.querySelector("ha-icon").setAttribute("icon", spiller ? "mdi:pause" : "mdi:play");
      spill.classList.toggle("spiller", spiller);
    }
    const sh = r.querySelector('[data-t="shuffle"]');
    if (sh) { sh.querySelector("ha-icon").setAttribute("icon", a.shuffle ? "mdi:shuffle-variant" : "mdi:shuffle-disabled"); sh.classList.toggle("pa", !!a.shuffle); }
    const rp = r.querySelector('[data-t="repeat"]');
    if (rp) {
      const v = a.repeat || "off";
      rp.querySelector("ha-icon").setAttribute("icon", v === "one" ? "mdi:repeat-once" : v === "off" ? "mdi:repeat-off" : "mdi:repeat-variant");
      rp.classList.toggle("pa", v !== "off");
    }

    /* volum og grupper */
    const vol = r.querySelector('input[type=range]');
    if (vol && a.volume_level !== undefined && document.activeElement !== vol) {
      const p = Math.round(a.volume_level * 100);
      vol.value = p; vol.style.setProperty("--p", p + "%");
      r.querySelector(".vtall").textContent = p + " %";
    }
    r.querySelectorAll("[data-g]").forEach((b) => {
      const g = (c.grupper || [])[+b.dataset.g], st = g && h.states[g.entity];
      b.classList.toggle("pa", !!st && st.state === "on");
    });

    /* hvilken kanal spilles */
    const kilde = (a.media_channel || a.source || a.media_title || "").toLowerCase();
    r.querySelectorAll("[data-radio]").forEach((b) => {
      const v = this._radio[+b.dataset.radio], n = String(v.navn || "").toLowerCase();
      b.classList.toggle("spiller", (spiller || pause) && !!n && (kilde.includes(n) || n.includes(kilde) && kilde.length > 2));
    });

    this._tikk();
  }
}
if (!customElements.get("ki-media-card")) customElements.define("ki-media-card", KiMediaCard);

class KiMediaCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { media: "Mediaspiller", visning: "Visning", navn: "Navn", ikon: "Ikon uten omslag" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "media", required: true, selector: { entity: { domain: ["media_player"] } } },
      { name: "visning", selector: { select: { mode: "dropdown", options: [
        { value: "full", label: "Alt (nå spilles, kanaler, transport, volum)" }, { value: "naa", label: "Bare nå spilles" }] } } },
      { name: "navn", selector: { text: {} } }, { name: "ikon", selector: { icon: {} } },
    ];
  }
}
if (!customElements.get("ki-media-card-editor")) customElements.define("ki-media-card-editor", KiMediaCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-media-card")) window.customCards.push({ type: "ki-media-card", name: "KI Media", description: "Nå spilles med levende omslag, transport, volum og radiokanaler", preview: true });

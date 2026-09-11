/* ki-fjernkontroll-card – Apple TV-fjernkontroll med berøringsflate, seertid og kilder.
 * Del av ki-cards-bundelen; ingen avhengigheter og kan også brukes alene.
 *
 * type: custom:ki-fjernkontroll-card
 * media: media_player.stue_tv
 * fjernkontroll: remote.stue_tv
 * navn: Apple TV
 * i_dag: sensor.tv_seertid_i_dag          # timer som desimaltall
 * maned: sensor.tv_seertid_denne_maned
 * kilder: [Plex, NRK TV, TV 2 Play]       # eller [{navn: Plex, kilde: plex}]
 * apper: { com.netflix.Netflix: Netflix } # legges til standardlista
 */
const KI_FJK_VERSJON = "1.0.0";

const KI_FJK_APPER = {
  "com.netflix.Netflix": "Netflix", "com.apple.TVWatchList": "Apple TV+", "com.apple.TVMovies": "Filmer",
  "com.apple.TVShows": "Serier", "com.apple.TVMusic": "Musikk", "com.apple.podcasts": "Podkaster",
  "com.google.ios.youtube": "YouTube", "com.hbo.hbonow": "HBO Max", "com.wbd.stream": "HBO Max",
  "com.disney.disneyplus": "Disney+", "com.spotify.client": "Spotify", "com.plexapp.plex": "Plex",
  "no.nrk.tv": "NRK TV", "no.nrk.super": "NRK Super", "no.altibox.tv": "Altibox", "no.tv2.sumo": "TV 2 Play",
  "com.telia.play": "Telia Play", "com.amazon.aiv.AIVApp": "Prime Video", "com.viaplay.Viaplay": "Viaplay",
};

const KI_FJK_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .rot { display:grid; gap:12px; }
  [tabindex]:focus-visible { outline:2px solid var(--active-big,#ee95ff); outline-offset:2px; }

  /* ---- status ---- */
  .topp { position:relative; height:66px; border-radius:75px; padding:4px 20px 4px 4px; display:grid;
    grid-template-columns:76px 1fr min-content; grid-template-areas:"i tekst bryt" "i navn bryt";
    align-items:center; background:var(--gray200); color:var(--gray1000); overflow:hidden;
    transition:background .45s var(--myk), color .3s; }
  .topp.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .topp.av { background:var(--red,#e8657a); color:var(--black,#000); }
  .topp .ic { grid-area:i; justify-self:start; width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:rgba(250,251,252,.12); }
  .topp.pa .ic, .topp.av .ic { background:rgba(0,0,0,.1); }
  .topp .ic ha-icon { --mdc-icon-size:30px; }
  .topp .tekst { grid-area:tekst; align-self:end; font-size:16px; font-weight:500; padding-top:4px; display:flex; align-items:center; gap:8px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .topp .navn { grid-area:navn; align-self:start; font-size:14px; opacity:.7; padding-bottom:7px; }
  .topp .bryt { grid-area:bryt; justify-self:end; --mdc-icon-size:44px; display:flex; cursor:pointer; }
  .eq { display:inline-flex; align-items:flex-end; gap:2px; height:13px; flex:none; margin-right:8px; }
  .eq i { width:3px; border-radius:2px; background:currentColor; height:30%; animation:eqhopp .9s ease-in-out infinite alternate; }
  .eq i:nth-child(2) { animation-delay:-.3s; } .eq i:nth-child(3) { animation-delay:-.6s; } .eq i:nth-child(4) { animation-delay:-.15s; }
  @keyframes eqhopp { from { height:22%; } to { height:100%; } }
  .eq.pause i { animation-play-state:paused; height:35%; }

  /* ---- seertid ---- */
  .tid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .tidboks { background:var(--gray200); border-radius:20px; padding:16px 20px; }
  .tidboks .lab { font-size:14px; font-weight:300; }
  .tidboks .verdi { font-size:22px; font-weight:500; font-variant-numeric:tabular-nums; margin-top:2px; }
  .tidboks .stolpe { margin-top:10px; height:4px; border-radius:2px; background:var(--gray100); overflow:hidden; }
  .tidboks .stolpe i { display:block; height:100%; border-radius:2px; background:var(--active-big,#ee95ff); width:0;
    transition:width 1s var(--myk); }

  /* ---- berøringsflate ---- */
  .padrad { display:grid; grid-template-columns:1fr; justify-items:center; }
  .pad { position:relative; width:100%; max-width:260px; aspect-ratio:1/1; border-radius:50%;
    background:radial-gradient(120% 120% at 50% 8%, var(--gray100) 0%, var(--gray200) 70%);
    box-shadow:inset 0 1px 0 rgba(250,251,252,.06); cursor:pointer; touch-action:none; overflow:hidden;
    display:flex; align-items:center; justify-content:center; }
  .pad::after { content:""; position:absolute; inset:14%; border-radius:50%; border:1px solid rgba(250,251,252,.07); }
  .pad .midt { position:relative; z-index:2; width:34%; height:34%; border-radius:50%; background:var(--gray200);
    box-shadow:0 6px 20px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:600; opacity:.75; transition:transform .18s var(--fjaer), background .2s; }
  .pad.trykk .midt { transform:scale(.92); background:var(--gray100); }
  .pil { position:absolute; --mdc-icon-size:26px; color:var(--gray1000); opacity:.32; transition:opacity .18s, transform .18s var(--fjaer); }
  .pil.opp { top:7%; } .pil.ned { bottom:7%; } .pil.venstre { left:7%; } .pil.hoyre { right:7%; }
  .pil.aktiv { opacity:1; transform:scale(1.3); }
  .ringpuls { position:absolute; width:70px; height:70px; margin:-35px 0 0 -35px; border-radius:50%; pointer-events:none;
    background:radial-gradient(circle, rgba(250,251,252,.35) 0%, transparent 70%); opacity:0; }
  .ringpuls.gaa { animation:padpuls .55s ease-out forwards; }
  @keyframes padpuls { 0% { opacity:.9; transform:scale(.3); } 100% { opacity:0; transform:scale(2.6); } }
  .spor { position:absolute; inset:0; pointer-events:none; }
  .spor i { position:absolute; width:8px; height:8px; margin:-4px 0 0 -4px; border-radius:50%; background:var(--active-big,#ee95ff);
    opacity:0; transition:opacity .25s; }
  .pad.drar .spor i { opacity:.55; }

  /* ---- knapper ---- */
  .knapper { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
  .rund { width:62px; height:62px; border-radius:50%; border:0; background:var(--gray200); color:var(--gray1000);
    display:flex; align-items:center; justify-content:center; cursor:pointer; --mdc-icon-size:24px;
    transition:transform .12s var(--fjaer), background .2s; }
  .rund:active { transform:scale(.92); background:var(--gray100); }
  .rund.pa { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .lyd { display:grid; grid-template-columns:1fr 1fr 1fr; background:var(--gray200); border-radius:66px; overflow:hidden; }
  .lyd button { height:62px; border:0; background:none; color:var(--gray1000); display:flex; align-items:center; justify-content:center;
    cursor:pointer; --mdc-icon-size:26px; transition:background .15s; }
  .lyd button:active { background:var(--gray100); }
  .lyd button.dempet { color:var(--red,#e8657a); }

  /* ---- kilder ---- */
  .kilder { display:grid; gap:8px; grid-template-columns:repeat(auto-fit, minmax(128px, 1fr)); }
  .kilde { border:0; text-align:left; background:var(--gray200); color:var(--gray1000); font:inherit; font-size:14px; font-weight:500;
    padding:12px 20px; border-radius:16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:8px;
    transition:background .25s, color .25s, transform .12s var(--fjaer); }
  .kilde:active { transform:scale(.985); }
  .kilde.valgt { background:var(--active-big,#ee95ff); color:var(--black,#000); }
  .kilde ha-icon { --mdc-icon-size:18px; opacity:0; transition:opacity .2s; }
  .kilde.valgt ha-icon { opacity:.9; }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (max-width:400px) { .rund { width:56px; height:56px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const kiFjkEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiFjkTid = (t) => {
  const n = parseFloat(t); if (!isFinite(n)) return "–";
  const h = Math.floor(n), m = Math.floor((n - h) * 60), s = Math.round(((n - h) * 60 - m) * 60);
  const p = (x) => String(x).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s >= 60 ? 59 : s)}`;
};

class KiFjernkontrollCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._forvent = null; }
  static getConfigElement() { return document.createElement("ki-fjernkontroll-card-editor"); }
  static getStubConfig() { return { media: "media_player.stue_tv", fjernkontroll: "remote.stue_tv", navn: "Apple TV" }; }
  getCardSize() { return 12; }

  setConfig(c) {
    if (!c || !c.media) throw new Error("Sett media: til media_player-entiteten");
    this._c = { navn: "Apple TV", ikon: "mdi:apple", ...c };
    this._apper = { ...KI_FJK_APPER, ...(c.apper || {}) };
    this._kilder = (c.kilder || []).map((k) => typeof k === "string" ? { navn: k, kilde: k } : { navn: k.navn || k.kilde, kilde: k.kilde || k.navn });
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const ids = [c.media, c.i_dag, c.maned].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._oppdater();
  }
  get hass() { return this._h; }
  disconnectedCallback() { clearInterval(this._gjenta); clearTimeout(this._ft); }

  _st(id) { return id && this._h ? this._h.states[id] : undefined; }
  _tilstand() {
    const s = this._st(this._c.media); if (!s) return "ukjent";
    if (this._forvent && Date.now() - this._forvent.t < 4000 && s.state !== this._forvent.state) return this._forvent.state;
    this._forvent = null; return s.state;
  }
  _pa() { return !["off", "unavailable", "unknown", "standby", "ukjent"].includes(this._tilstand()); }

  /* Hva som vises i statuslinja */
  _statustekst() {
    const s = this._st(this._c.media), t = this._tilstand();
    if (!s) return "Fant ikke spilleren";
    if (t === "off") return `${this._c.navn} er av`;
    if (t === "unavailable" || t === "unknown") return "Utilgjengelig";
    const a = s.attributes, app = (a.app_id && this._apper[a.app_id]) || a.app_name || null;
    if (a.media_title) return (t === "paused" ? "Pause: " : "Ser på: ") + a.media_title;
    if (app) return (t === "playing" ? "Spiller: " : t === "paused" ? app + " (pause)" : "Åpen: ") + (t === "paused" ? "" : app);
    return t === "playing" ? "Spiller" : t === "paused" ? "Pause" : "Påskrudd";
  }

  _vibrer(ms) { if (navigator.vibrate) navigator.vibrate(ms || 8); }
  _send(kommando) {
    const c = this._c; if (!c.fjernkontroll || !this._h) return;
    this._vibrer(8);
    this._h.callService("remote", "send_command", { entity_id: c.fjernkontroll, command: kommando, hold_secs: 0 });
  }
  _veksle() {
    const c = this._c; this._vibrer(12);
    this._forvent = { state: this._pa() ? "off" : "on", t: Date.now() };
    clearTimeout(this._ft); this._ft = setTimeout(() => this._oppdater(), 4100);
    this._oppdater();
    this._h.callService("media_player", this._forvent.state === "off" ? "turn_off" : "turn_on", { entity_id: c.media });
  }
  _velgKilde(kilde) {
    this._vibrer(10);
    this._h.callService("media_player", "select_source", { entity_id: this._c.media, source: kilde });
  }
  _mer() { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._c.media }, bubbles: true, composed: true })); }

  /* Trykk og hold på lydknappene gjentar kommandoen */
  _hold(el, kommando) {
    const start = (e) => {
      if (e.button) return;
      this._send(kommando);
      clearInterval(this._gjenta);
      this._gjenta = setInterval(() => this._send(kommando), 320);
    };
    const stopp = () => clearInterval(this._gjenta);
    el.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((n) => el.addEventListener(n, stopp));
  }

  /* Berøringsflaten: sveip = retning, trykk = velg, dra videre = flere steg */
  _kobblePad(pad) {
    const ROT = 26, STEG = 46;
    let x0 = 0, y0 = 0, aktiv = false, steg = 0, retning = null, flyttet = false;
    const puls = pad.querySelector(".ringpuls"), spor = pad.querySelector(".spor i");
    const piler = { opp: pad.querySelector(".pil.opp"), ned: pad.querySelector(".pil.ned"), venstre: pad.querySelector(".pil.venstre"), hoyre: pad.querySelector(".pil.hoyre") };
    const marker = (r) => { Object.values(piler).forEach((p) => p.classList.remove("aktiv")); if (r && piler[r]) piler[r].classList.add("aktiv"); };
    const blaff = (x, y) => { puls.style.left = x + "px"; puls.style.top = y + "px"; puls.classList.remove("gaa"); void puls.offsetWidth; puls.classList.add("gaa"); };

    pad.addEventListener("pointerdown", (e) => {
      const r = pad.getBoundingClientRect();
      x0 = e.clientX; y0 = e.clientY; aktiv = true; steg = 0; retning = null; flyttet = false;
      pad.classList.add("trykk"); pad.setPointerCapture && pad.setPointerCapture(e.pointerId);
      spor.style.left = e.clientX - r.left + "px"; spor.style.top = e.clientY - r.top + "px";
    });
    pad.addEventListener("pointermove", (e) => {
      if (!aktiv) return;
      const r = pad.getBoundingClientRect();
      spor.style.left = e.clientX - r.left + "px"; spor.style.top = e.clientY - r.top + "px";
      const dx = e.clientX - x0, dy = e.clientY - y0, l = Math.hypot(dx, dy);
      if (l > 8) { flyttet = true; pad.classList.add("drar"); pad.classList.remove("trykk"); }
      if (l < ROT) { marker(null); return; }
      const ny = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "hoyre" : "venstre") : (dy > 0 ? "ned" : "opp");
      if (ny !== retning) { retning = ny; steg = 0; x0 = e.clientX; y0 = e.clientY; }
      marker(ny);
      const langs = Math.abs(Math.abs(dx) > Math.abs(dy) ? dx : dy);
      const vil = Math.max(1, Math.floor(langs / STEG));
      while (steg < vil) {
        steg++;
        this._send({ opp: "up", ned: "down", venstre: "left", hoyre: "right" }[ny]);
        blaff(e.clientX - r.left, e.clientY - r.top);
      }
    });
    const slutt = (e) => {
      if (!aktiv) return;
      aktiv = false; pad.classList.remove("trykk", "drar");
      const r = pad.getBoundingClientRect();
      if (!flyttet) { this._send("select"); blaff(e.clientX - r.left, e.clientY - r.top); }
      else if (retning && steg === 0) { this._send({ opp: "up", ned: "down", venstre: "left", hoyre: "right" }[retning]); }
      setTimeout(() => marker(null), 220);
    };
    pad.addEventListener("pointerup", slutt);
    pad.addEventListener("pointercancel", () => { aktiv = false; pad.classList.remove("trykk", "drar"); marker(null); });
    pad.addEventListener("keydown", (e) => {
      const k = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Enter: "select", " ": "select" }[e.key];
      if (k) { e.preventDefault(); this._send(k); }
    });
  }

  _bygg() {
    const c = this._c;
    const rund = (kl, ikon, tit) => `<button class="rund ${kl}" data-k="${kl}" aria-label="${tit}" title="${tit}"><ha-icon icon="${ikon}"></ha-icon></button>`;
    this.shadowRoot.innerHTML = `<style>${KI_FJK_STIL}</style>
      <div class="rot">
        <div class="topp" role="group">
          <div class="ic" data-mer><ha-icon icon="${kiFjkEsc(c.ikon)}"></ha-icon></div>
          <div class="tekst"><span class="stat"></span></div>
          <div class="navn">${kiFjkEsc(c.navn)}</div>
          <div class="bryt" data-veksle role="switch" tabindex="0" aria-label="Slå ${kiFjkEsc(c.navn)} av eller på"><ha-icon icon="mdi:toggle-switch"></ha-icon></div>
        </div>

        ${c.i_dag || c.maned ? `<div class="tid">
          ${c.i_dag ? `<div class="tidboks"><div class="lab">TV i dag</div><div class="verdi" data-t="i_dag">–</div>
            <div class="stolpe"><i data-b="i_dag"></i></div></div>` : ""}
          ${c.maned ? `<div class="tidboks"><div class="lab">TV denne måned</div><div class="verdi" data-t="maned">–</div>
            <div class="stolpe"><i data-b="maned"></i></div></div>` : ""}
        </div>` : ""}

        ${c.fjernkontroll ? `<div class="padrad">
          <div class="pad" role="button" tabindex="0" aria-label="Styreflate: sveip for å navigere, trykk for å velge">
            <ha-icon class="pil opp" icon="mdi:chevron-up"></ha-icon>
            <ha-icon class="pil ned" icon="mdi:chevron-down"></ha-icon>
            <ha-icon class="pil venstre" icon="mdi:chevron-left"></ha-icon>
            <ha-icon class="pil hoyre" icon="mdi:chevron-right"></ha-icon>
            <div class="spor"><i></i></div>
            <div class="ringpuls"></div>
            <div class="midt">OK</div>
          </div>
        </div>

        <div class="knapper">
          ${rund("meny", "mdi:arrow-u-left-top", "Tilbake")}
          ${rund("hjem", "mdi:home-outline", "Hjem")}
          ${rund("mikrofon", "mdi:microphone-outline", "Søk")}
          ${rund("spill", "mdi:play", "Spill eller pause")}
        </div>

        <div class="lyd">
          <button data-lyd="volume_down" aria-label="Volum ned"><ha-icon icon="mdi:volume-minus"></ha-icon></button>
          <button data-lyd="mute" class="demp" aria-label="Demp"><ha-icon icon="mdi:volume-variant-off"></ha-icon></button>
          <button data-lyd="volume_up" aria-label="Volum opp"><ha-icon icon="mdi:volume-plus"></ha-icon></button>
        </div>` : ""}

        ${this._kilder.length ? `<div class="kilder">${this._kilder.map((k) =>
          `<button class="kilde" data-kilde="${kiFjkEsc(k.kilde)}">${kiFjkEsc(k.navn)}<ha-icon icon="mdi:check"></ha-icon></button>`).join("")}</div>` : ""}
      </div>`;

    const r = this.shadowRoot;
    r.querySelector("[data-mer]").addEventListener("click", () => this._mer());
    const br = r.querySelector("[data-veksle]");
    br.addEventListener("click", () => this._veksle());
    br.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._veksle(); } });
    const pad = r.querySelector(".pad"); if (pad) this._kobblePad(pad);
    const kom = { meny: "menu", hjem: "home", mikrofon: "siri" };
    r.querySelectorAll(".rund").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (k === "spill") { const t = this._tilstand(); this._send(t === "playing" ? "pause" : "play"); }
      else this._send(kom[k]);
    }));
    r.querySelectorAll("[data-lyd]").forEach((b) => {
      const k = b.dataset.lyd;
      if (k === "mute") b.addEventListener("click", () => this._send("mute"));
      else this._hold(b, k);
    });
    r.querySelectorAll(".kilde").forEach((b) => b.addEventListener("click", () => this._velgKilde(b.dataset.kilde)));
    this._bygget = true;
  }

  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!h.states[c.media]) {
      this._bygget = false;
      this.shadowRoot.innerHTML = `<style>${KI_FJK_STIL}</style><div class="feil">Fant ikke ${kiFjkEsc(c.media)}.</div>`;
      return;
    }
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, s = h.states[c.media], t = this._tilstand(), pa = this._pa();
    const topp = r.querySelector(".topp");
    topp.classList.toggle("pa", pa); topp.classList.toggle("av", !pa);
    r.querySelector(".bryt ha-icon").setAttribute("icon", pa ? "mdi:toggle-switch" : "mdi:toggle-switch-off");
    r.querySelector("[data-veksle]").setAttribute("aria-checked", String(pa));

    const spiller = t === "playing", pause = t === "paused";
    const eq = spiller || pause ? `<span class="eq ${pause ? "pause" : ""}"><i></i><i></i><i></i><i></i></span>` : "";
    const stat = r.querySelector(".stat");
    const ny = eq + kiFjkEsc(this._statustekst());
    if (stat.innerHTML !== ny) stat.innerHTML = ny;

    const spill = r.querySelector('.rund[data-k="spill"]');
    if (spill) { spill.querySelector("ha-icon").setAttribute("icon", spiller ? "mdi:pause" : "mdi:play"); spill.classList.toggle("pa", spiller); }
    const demp = r.querySelector(".demp");
    if (demp) demp.classList.toggle("dempet", !!s.attributes.is_volume_muted);

    const sett = (navn, id, maks) => {
      const v = r.querySelector(`[data-t="${navn}"]`), b = r.querySelector(`[data-b="${navn}"]`);
      if (!v) return;
      const st = this._st(id), tall = st ? parseFloat(st.state) : NaN;
      v.textContent = kiFjkTid(st && st.state);
      if (b) b.style.width = isFinite(tall) ? Math.min(100, (tall / maks) * 100).toFixed(1) + "%" : "0";
    };
    sett("i_dag", c.i_dag, c.maks_i_dag || 6);
    sett("maned", c.maned, c.maks_maned || 90);

    const kilde = s.attributes.source;
    r.querySelectorAll(".kilde").forEach((b) => b.classList.toggle("valgt",
      !!kilde && String(kilde).toLowerCase() === String(b.dataset.kilde).toLowerCase()));
  }
}
if (!customElements.get("ki-fjernkontroll-card")) customElements.define("ki-fjernkontroll-card", KiFjernkontrollCard);

class KiFjernkontrollCardEditor extends HTMLElement {
  setConfig(c) { this._c = c; this._r(); }
  set hass(h) { this._h = h; this._r(); }
  _r() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement("ha-form");
      const n = { media: "Mediaspiller", fjernkontroll: "Fjernkontroll (remote)", navn: "Navn", ikon: "Ikon",
        i_dag: "Seertid i dag", maned: "Seertid denne måned", maks_i_dag: "Full stolpe i dag (timer)", maks_maned: "Full stolpe måned (timer)" };
      this._f.computeLabel = (s) => n[s.name] || s.name;
      this._f.addEventListener("value-changed", (e) => this.dispatchEvent(new CustomEvent("config-changed",
        { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._f);
    }
    this._f.hass = this._h; this._f.data = this._c;
    this._f.schema = [
      { name: "media", required: true, selector: { entity: { domain: ["media_player"] } } },
      { name: "fjernkontroll", selector: { entity: { domain: ["remote"] } } },
      { name: "navn", selector: { text: {} } }, { name: "ikon", selector: { icon: {} } },
      { name: "i_dag", selector: { entity: { domain: ["sensor"] } } },
      { name: "maned", selector: { entity: { domain: ["sensor"] } } },
      { name: "maks_i_dag", selector: { number: { mode: "box", min: 1, max: 24 } } },
      { name: "maks_maned", selector: { number: { mode: "box", min: 1, max: 400 } } },
    ];
  }
}
if (!customElements.get("ki-fjernkontroll-card-editor")) customElements.define("ki-fjernkontroll-card-editor", KiFjernkontrollCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-fjernkontroll-card")) window.customCards.push({ type: "ki-fjernkontroll-card", name: "KI Fjernkontroll", description: "Apple TV-fjernkontroll med styreflate, seertid og kilder", preview: true });

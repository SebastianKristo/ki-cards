/*
 * ki-person-card — popupen for én person: samme type toppkort som ki-rom-hero-card (grå flate,
 * status-pille, stort stedsnavn, søyle til høyre) og seksjoner under for soner i dag, mobil og søvn.
 * Brukes når man trykker på en person i familiekortet, eller alene i en bubble-card-popup.
 *
 * Tilstanden styrer aksentfargen (pillen, glyfen og små detaljer – flaten er alltid grå):
 *   sover   (søvnbryteren er på)   blålilla, måne      «Sover»
 *   hjemme  (person = home)        grønt,    hus       «Hjemme»
 *   sone    (person = en zone.*)   ravgult,  sonens ikon «Skole»
 *   borte   (person = not_home)    lilla,    ut-dør    «Borte · Oslo» (stedet fra mobilen)
 *
 * Minste oppsett – mobilsensorene finnes via personens device_trackers
 * (device_tracker.sebastian_iphone_17_pro → sensor.sebastian_iphone_17_pro_battery_level osv.):
 *   type: custom:ki-person-card
 *   person: person.sebastian
 *
 * Alt kan settes selv:
 *   navn: Sebastian                        # ellers personens friendly_name
 *   bilde: true                            # false = forbokstaven i stedet for entity_picture
 *   sovn: switch.sebastian_sovn            # switch/input_boolean, på = sover
 *   posisjon: switch.sebastian_hjemme      # reserve når personen er utilgjengelig (på = hjemme)
 *   mobil: sensor.sebastian_iphone_17_pro_ # prefikset til mobilsensorene
 *   farge: "#8fd6a0"                       # overstyr aksentfargen (CSS-farge)
 *   seksjoner: { soner: true, mobil: true, sovn: true }   # false skjuler seksjonen
 *   stov: true                             # de svake partiklene i toppkortet
 *   hoyde: 184                             # høyden på toppkortet
 *
 * Mobilsensorer (med prefiks): battery_level, battery_state, connection_type, ssid, steps,
 * distance / walking_running_distance, geocoded_location, sleep_duration
 * (+ binary_sensor.<prefiks>is_charging).
 *
 * Trykk på kortet/avataren = mer-info for personen, batterisøylen = batteriet. Radene: trykk =
 * mer-info, langt trykk = mer-info; søvnraden: trykk = bytt sover/våken, langt trykk = mer-info.
 * Soner i dag hentes fra historikken siden midnatt, på nytt hvert tiende minutt.
 */
(() => {
  const VERSJON = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DARLIG = new Set(["unavailable", "unknown", ""]);
  const ok = (s) => s && !DARLIG.has(s.state);
  const tall = (s) => (ok(s) ? parseFloat(s.state) : NaN);
  const nf = (v, d = 0) => Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const to = (n) => String(n).padStart(2, "0");
  const hm = (d) => `${to(d.getHours())}:${to(d.getMinutes())}`;
  const DAG = ["søn.", "man.", "tir.", "ons.", "tor.", "fre.", "lør."];
  const midnatt = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iDag = (d) => d.toDateString() === new Date().toDateString();
  const slug = (s) => String(s || "").toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const varighet = (min) => {
    min = Math.max(0, Math.round(min));
    const t = Math.floor(min / 60), m = min % 60;
    return t ? (m ? `${t} t ${m} min` : `${t} t`) : `${m} min`;
  };

  // aksentfargene
  const F = { hjemme: "#8fd6a0", sover: "#a4a8ff", borte: "#b69cff", sone: "#f2b966", ukjent: "#8e8d89", rod: "#f47b74" };
  // partiklene: [venstre %, forsinkelse s] – færre og svakere enn i rom-kortet
  const STOV = [[14, 0], [30, 1.6], [46, 0.7], [58, 2.4], [70, 1.1], [38, 3.1]];

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; }
    .kort { position: relative; height: var(--h, 184px); border-radius: 28px; overflow: hidden;
      background: var(--gray200, #1c1c1f); color: var(--gray1000, #f2f1ee); cursor: pointer;
      -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; font-family: inherit; }
    .kort:focus-visible { outline: 2px solid var(--f); outline-offset: 2px; }
    .stov { position: absolute; bottom: -4px; border-radius: 2px; background: var(--f); pointer-events: none;
      animation: drift var(--t, 7s) linear var(--d, 0s) infinite; }
    @keyframes drift { 0% { transform: translate(0, 0); opacity: 0; } 25% { opacity: .35; } 100% { transform: translate(14px, -120px); opacity: 0; } }
    .glyf { position: absolute; right: 86px; top: 36px; color: var(--f); pointer-events: none; opacity: .8;
      animation: puste 3.4s ease-in-out infinite; }
    .glyf ha-icon { --mdc-icon-size: 36px; display: block; }
    @keyframes puste { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: .9; transform: scale(1.05); } }
    .avatar { position: absolute; right: 16px; top: 16px; width: 48px; height: 48px; border-radius: 50%; padding: 0; cursor: pointer;
      border: 2px solid color-mix(in srgb, var(--f) 70%, transparent); background: color-mix(in srgb, var(--f) 22%, var(--gray100, #26262a));
      background-size: cover; background-position: center; color: var(--gray1000, #f2f1ee); display: grid; place-items: center;
      font-family: inherit; font-size: 19px; font-weight: 500; line-height: 1; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .avatar:active { transform: scale(.92); }
    .topp { position: absolute; left: 18px; top: 18px; right: 130px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .navn { font-size: 13px; color: var(--gray800, #c9c7c2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .pille { height: 26px; padding: 0 10px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500;
      white-space: nowrap; background: color-mix(in srgb, var(--f) 18%, transparent); color: var(--f); max-width: 100%; overflow: hidden; }
    .pille ha-icon { --mdc-icon-size: 14px; flex: none; }
    .pt { overflow: hidden; text-overflow: ellipsis; }
    .bunn { position: absolute; left: 18px; right: 84px; bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .sted { font-size: 38px; font-weight: 300; letter-spacing: -.035em; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sted.lang { font-size: 30px; }
    .sub { font-size: 12px; color: #8e8d89; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .bat { position: absolute; right: 16px; bottom: 16px; width: 48px; height: calc(var(--h, 184px) - 92px); border-radius: 24px;
      background: rgba(255,255,255,.08); overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;
      border: 0; padding: 0; cursor: pointer; }
    .bat i { display: block; height: 0; background: color-mix(in srgb, var(--fb) 55%, transparent); transition: height .6s; }
    .bat ha-icon { position: absolute; left: 0; right: 0; top: 10px; margin: auto; --mdc-icon-size: 16px; color: var(--gray1000, #f2f1ee); }

    .seksjoner { display: flex; flex-direction: column; gap: 8px; }
    .seksjoner:not(:empty) { margin-top: 8px; }
    .seksjon { background: var(--gray200, #1c1c1f); border-radius: 24px; padding: 14px 6px 6px; }
    .tittel { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 0 12px 6px;
      font-size: 14px; font-weight: 500; color: var(--gray1000, #f2f1ee); opacity: .7; }
    .tittel span:last-child { font-size: 12px; font-variant-numeric: tabular-nums; }
    .rad { display: flex; align-items: center; gap: 12px; padding: 7px 10px 7px 8px; border-radius: 20px; cursor: pointer;
      color: var(--gray1000, #f2f1ee); -webkit-tap-highlight-color: transparent; transition: background .2s, transform .14s; }
    .rad:active { transform: scale(.985); }
    .rad:focus-visible { outline: 2px solid var(--f); outline-offset: -2px; }
    .ik { width: 40px; height: 40px; border-radius: 50%; flex: none; display: grid; place-items: center;
      background: rgba(250,251,252,.1); border: 1px solid rgba(250,251,252,.1); }
    .ik ha-icon { --mdc-icon-size: 22px; }
    .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .l { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .s { font-size: 12px; font-weight: 500; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .v { font-size: 14px; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; opacity: .7; }
    .rad.pa { background: var(--active-big, #ee95ff); color: var(--black, #101010); }
    .rad.pa .ik { background: rgba(0,0,0,.08); border-color: rgba(0,0,0,.1); }
    .rad.pa .v, .rad.pa .s { opacity: .75; }
    .rad.na .ik { background: color-mix(in srgb, var(--zf) 20%, transparent); border-color: color-mix(in srgb, var(--zf) 30%, transparent); color: var(--zf); }
    @media (prefers-reduced-motion: reduce) { .stov, .glyf { animation: none; } .stov { display: none; } }
  `;

  class KiPersonCard extends HTMLElement {
    static getStubConfig(hass) {
      const p = hass && Object.keys(hass.states).find((id) => id.startsWith("person."));
      return { person: p || "person.meg", seksjoner: { soner: true, mobil: true, sovn: true } };
    }
    static getConfigForm() {
      return {
        schema: [
          { name: "person", required: true, selector: { entity: { domain: "person" } } },
          { name: "navn", selector: { text: {} } },
          { name: "bilde", selector: { boolean: {} } },
          { name: "sovn", selector: { entity: { domain: ["switch", "input_boolean"] } } },
          { type: "expandable", name: "", title: "Mer", schema: [
            { name: "posisjon", selector: { entity: { domain: ["switch", "input_boolean"] } } },
            { name: "mobil", selector: { text: {} } },
            { name: "farge", selector: { text: {} } },
            { name: "stov", selector: { boolean: {} } },
            { name: "hoyde", selector: { number: { min: 140, max: 320, step: 4, unit_of_measurement: "px", mode: "box" } } },
          ] },
          { type: "expandable", name: "seksjoner", title: "Seksjoner", schema: [
            { name: "soner", selector: { boolean: {} } },
            { name: "mobil", selector: { boolean: {} } },
            { name: "sovn", selector: { boolean: {} } },
          ] },
        ],
        computeLabel: (s) => ({ person: "Person", navn: "Navn", bilde: "Vis bilde", sovn: "Søvnbryter (på = sover)",
          posisjon: "Posisjonsbryter (reserve, på = hjemme)", mobil: "Prefiks for mobilsensorer (sensor.navn_iphone_)",
          farge: "Aksentfarge (CSS)", stov: "Partikler i toppkortet", hoyde: "Høyde på toppkortet",
          soner: "Soner i dag", }[s.name] || (s.name === "mobil" ? "Mobil" : s.name === "sovn" ? "Søvn" : s.name)),
      };
    }

    setConfig(c) {
      if (!c || !c.person) throw new Error("ki-person-card: «person» mangler (person.*)");
      this._c = { bilde: true, stov: true, ...c, seksjoner: { soner: true, mobil: true, sovn: true, ...(c.seksjoner || {}) } };
      this._pfx = undefined;
      this._hist = null; this._histFor = null;
      this._siste = null;
      this._bygget = false; this._sisteHtml = null;
      if (this._hass) this._oppdater();
    }

    set hass(h) {
      this._hass = h;
      if (!this._c) return;
      if (this._pfx === undefined || this._pfx === null) this._pfx = this._prefiks();
      const n = this._alleIds().map((id) => h.states[id]);
      if (this._bygget && this._siste && n.length === this._siste.length && n.every((s, i) => s === this._siste[i])) return;
      this._siste = n;
      this._oppdater();
    }

    connectedCallback() {
      clearInterval(this._timer);
      this._timer = setInterval(() => this._hentSoner(true), 10 * 60 * 1000);
    }
    disconnectedCallback() { clearInterval(this._timer); clearTimeout(this._holdT); }
    getCardSize() { return 9; }
    getGridOptions() { return { columns: 12, rows: "auto", min_rows: 3 }; }

    /* ---------- oppslag ---------- */
    _S(id) { return id && this._hass ? this._hass.states[id] : undefined; }

    /* Prefikset til mobilsensorene: config, ellers personens device_trackers, ellers navnet. */
    _prefiks() {
      const c = this._c, h = this._hass;
      if (c.mobil) { const m = String(c.mobil).replace(/^sensor\./, ""); return "sensor." + (m.endsWith("_") ? m : m + "_"); }
      const p = this._S(c.person);
      const trs = [].concat((p && p.attributes.device_trackers) || []);
      for (const tr of trs) {
        const o = String(tr).split(".")[1];
        if (o && h.states[`sensor.${o}_battery_level`]) return `sensor.${o}_`;
      }
      const nokkel = slug(String(c.person).split(".")[1] || "").split("_")[0];
      if (!nokkel) return "";
      const id = Object.keys(h.states).find((x) => x.startsWith(`sensor.${nokkel}_`) && x.endsWith("_battery_level"));
      return id ? id.replace(/battery_level$/, "") : "";
    }

    _mobilIds() {
      const px = this._pfx;
      if (!px) return {};
      const o = px.slice(7);
      const finnes = (id) => (this._hass.states[id] ? id : null);
      return {
        bat: finnes(px + "battery_level"), batState: finnes(px + "battery_state"), lader: finnes(`binary_sensor.${o}is_charging`),
        conn: finnes(px + "connection_type"), ssid: finnes(px + "ssid"), skritt: finnes(px + "steps"),
        dist: finnes(px + "distance") || finnes(px + "walking_running_distance"), geo: finnes(px + "geocoded_location"),
        sovnTid: finnes(px + "sleep_duration"),
      };
    }

    _alleIds() {
      const c = this._c, p = this._S(c.person);
      const m = Object.values(this._mobilIds()).filter(Boolean);
      const z = p ? this._soneId(p.state) : null;
      return [c.person, c.sovn, c.posisjon, z, ...m].filter(Boolean);
    }

    _soneId(state) {
      if (!state || DARLIG.has(state) || state === "not_home") return null;
      if (state === "home") return "zone.home";
      const st = this._hass.states;
      if (st["zone." + slug(state)]) return "zone." + slug(state);
      return Object.keys(st).find((id) => id.startsWith("zone.") && st[id].attributes.friendly_name === state) || null;
    }

    /* [navn, ikon, farge] for en tilstand på person.* */
    _sone(state) {
      if (!state || DARLIG.has(state)) return ["Ukjent", "mdi:help-circle-outline", F.ukjent];
      if (state === "home") return ["Hjemme", "mdi:home", F.hjemme];
      if (state === "not_home") return ["Borte", "mdi:home-export-outline", F.borte];
      const z = this._S(this._soneId(state));
      return [(z && z.attributes.friendly_name) || state, (z && z.attributes.icon) || "mdi:map-marker", F.sone];
    }

    /* Personens tilstand, med posisjonsbryteren som reserve. */
    _tilstand() {
      const c = this._c, p = this._S(c.person), pos = this._S(c.posisjon);
      if ((!p || !ok(p)) && ok(pos)) return { state: pos.state === "on" ? "home" : "not_home", siden: pos.last_changed };
      return { state: p ? p.state : "", siden: p && p.last_changed };
    }

    _timer_(id) {
      const s = this._S(id), v = tall(s);
      if (isNaN(v)) return null;
      const u = String(s.attributes.unit_of_measurement || "").toLowerCase();
      return u === "min" ? v / 60 : u === "s" ? v / 3600 : u === "h" || u === "t" ? v : v > 24 ? v / 60 : v;
    }

    /* ---------- soner i dag ---------- */
    async _hentSoner(tving = false) {
      const c = this._c, h = this._hass;
      if (!c.seksjoner.soner || !h || !h.callWS) return;
      const p = this._S(c.person);
      const nokkel = `${c.person}|${p && p.last_changed}|${midnatt().getTime()}`;
      if (!tving && this._histFor === nokkel) return;
      this._histFor = nokkel;
      try {
        const start = midnatt();
        const svar = await h.callWS({
          type: "history/history_during_period", start_time: start.toISOString(), end_time: new Date().toISOString(),
          entity_ids: [c.person], minimal_response: true, no_attributes: true, significant_changes_only: false,
        });
        const rader = (svar && svar[c.person]) || [];
        const t0 = start.getTime();
        const seg = [];
        for (const r of rader) {
          const s = r.s !== undefined ? r.s : r.state;
          if (s === undefined || DARLIG.has(s)) continue;
          const tid = r.lc || r.lu ? (r.lc || r.lu) * 1000 : Date.parse(r.last_changed || r.last_updated);
          const t = Math.max(t0, isNaN(tid) ? t0 : tid);
          const forrige = seg[seg.length - 1];
          if (forrige && forrige.s === s) continue;
          if (forrige) forrige.til = t;
          seg.push({ s, fra: t, til: null });
        }
        this._hist = seg.filter((x) => x.til === null || x.til - x.fra >= 60 * 1000);
      } catch (e) {
        this._hist = null;
      }
      this._tegnSeksjoner();
    }

    /* ---------- trykk ---------- */
    _vibrer(ms = 8) {
      if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* blokkert */ } }
      this.dispatchEvent(new CustomEvent("haptic", { detail: ms > 10 ? "medium" : "light", bubbles: true, composed: true }));
    }
    _info(id) {
      if (!id) return;
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }
    _veksle(id) {
      if (!id || !this._hass) return;
      this._hass.callService("homeassistant", "toggle", { entity_id: id });
    }

    /* Trykk og langt trykk på et element (data-id, data-veksle). */
    _trykk(el, trykk, hold) {
      let holdt = false, x0 = 0, y0 = 0;
      el.addEventListener("pointerdown", (e) => {
        holdt = false; x0 = e.clientX; y0 = e.clientY;
        clearTimeout(this._holdT);
        this._holdT = setTimeout(() => { holdt = true; this._vibrer(20); hold(e); }, 500);
      });
      el.addEventListener("pointermove", (e) => { if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) clearTimeout(this._holdT); });
      ["pointerup", "pointercancel", "pointerleave"].forEach((t) => el.addEventListener(t, () => clearTimeout(this._holdT)));
      el.addEventListener("contextmenu", (e) => e.preventDefault());
      el.addEventListener("click", (e) => { if (holdt) { holdt = false; e.stopPropagation(); return; } this._vibrer(); trykk(e); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._vibrer(); trykk(e); } });
    }

    /* ---------- tegning ---------- */
    _bygg() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="kort" role="button" tabindex="0">
          <div class="stovlag">${STOV.map(([x, d], i) =>
            `<span class="stov" style="left:${x}%;width:${i % 2 ? 2 : 3}px;height:${i % 2 ? 2 : 3}px;--d:${d}s;--t:${6 + (i % 3)}s"></span>`).join("")}</div>
          <span class="glyf"><ha-icon></ha-icon></span>
          <button class="avatar" aria-label="Personen"></button>
          <div class="topp"><span class="navn"></span><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span></div>
          <div class="bunn"><div class="sted"></div><span class="sub"></span></div>
          <button class="bat" aria-label="Batteri"><i></i><ha-icon icon="mdi:cellphone"></ha-icon></button>
        </div>
        <div class="seksjoner"></div>`;
      const r = this.shadowRoot;
      this._trykk(r.querySelector(".kort"), () => this._info(this._c.person), () => this._info(this._c.person));
      r.querySelector(".avatar").addEventListener("click", (e) => { e.stopPropagation(); this._vibrer(); this._info(this._c.person); });
      r.querySelector(".bat").addEventListener("click", (e) => { e.stopPropagation(); this._vibrer(); this._info(this._mobilIds().bat); });
      this._bygget = true;
    }

    _oppdater() {
      if (!this._hass || !this._c) return;
      if (this._pfx === undefined) this._pfx = this._prefiks();
      if (!this._bygget) this._bygg();
      this._hentSoner();
      const c = this._c, h = this._hass;
      const $ = (q) => this.shadowRoot.querySelector(q);
      const p = this._S(c.person);
      const t = this._tilstand();
      const [sted, ikon, soneF] = this._sone(t.state);
      const sover = this._S(c.sovn) && this._S(c.sovn).state === "on";
      const m = this._mobilIds();
      const geo = this._S(m.geo);
      const lokal = geo && (geo.attributes.Locality || geo.attributes.locality);

      const f = c.farge || (sover ? F.sover : soneF);
      const pi = sover ? "mdi:sleep" : ikon;
      const pt = sover ? "Sover" : t.state === "not_home" && lokal ? `Borte · ${lokal}` : sted;

      const kort = $(".kort");
      kort.style.setProperty("--f", f);
      kort.style.setProperty("--h", `${Number(c.hoyde) || 184}px`);
      this.style.setProperty("--f", f);
      $(".stovlag").style.display = c.stov === false ? "none" : "";
      $(".glyf ha-icon").setAttribute("icon", sover ? "mdi:weather-night" : ikon);

      const navn = c.navn || (p && p.attributes.friendly_name) || String(c.person).split(".")[1] || "";
      $(".navn").textContent = navn;
      $(".pille ha-icon").setAttribute("icon", pi);
      $(".pt").textContent = pt;

      // avataren: bilde eller forbokstav
      const av = $(".avatar");
      const bilde = c.bilde !== false && p && p.attributes.entity_picture;
      if (bilde) {
        const url = h.hassUrl ? h.hassUrl(bilde) : bilde;
        av.style.backgroundImage = `url("${String(url).replace(/"/g, "%22")}")`;
        av.textContent = "";
      } else {
        av.style.backgroundImage = "";
        av.textContent = (String(navn).trim()[0] || "?").toUpperCase();
      }
      av.setAttribute("aria-label", `${navn} – mer info`);

      const stedEl = $(".sted");
      stedEl.textContent = sted;
      stedEl.classList.toggle("lang", sted.length > 9);

      // «siden 14:32 · 82 %»
      const deler = [];
      const siden = t.siden ? new Date(t.siden) : null;
      if (siden && !isNaN(siden)) deler.push(`siden ${iDag(siden) ? "" : DAG[siden.getDay()] + " "}${hm(siden)}`);
      if (t.state === "not_home" && lokal) deler.push(lokal);
      const bat = tall(this._S(m.bat));
      if (!isNaN(bat)) deler.push(`${nf(bat)} %`);
      $(".sub").textContent = deler.join(" · ");

      const lader = this._lader(m);
      const bs = $(".bat");
      bs.style.display = isNaN(bat) ? "none" : "";
      bs.style.setProperty("--fb", bat < 20 && !lader ? F.rod : lader ? F.hjemme : "#f2f1ee");
      $(".bat i").style.height = `${Math.max(0, Math.min(100, isNaN(bat) ? 0 : bat))}%`;
      $(".bat ha-icon").setAttribute("icon", lader ? "mdi:cellphone-charging" : "mdi:cellphone");
      bs.setAttribute("aria-label", `Batteri ${isNaN(bat) ? "–" : nf(bat)} %${lader ? ", lader" : ""}`);
      $(".bunn").style.right = isNaN(bat) ? "18px" : "84px";

      kort.setAttribute("aria-label", `${navn}: ${pt}. ${$(".sub").textContent}`);
      this._tegnSeksjoner();
    }

    _lader(m) {
      const bst = String((this._S(m.batState) || {}).state || "").toLowerCase();
      return ["charging", "full", "lader", "fulladet"].includes(bst) || (this._S(m.lader) || {}).state === "on";
    }

    _rad({ id, ikon, l, s, v, veksle, pa, zf }) {
      return `<div class="rad${pa ? " pa" : ""}${zf ? " na" : ""}" role="button" tabindex="0" data-id="${esc(id || "")}"${veksle ? ` data-veksle="1"` : ""}${zf ? ` style="--zf:${esc(zf)}"` : ""}>
        <span class="ik"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
        <span class="tx"><span class="l">${esc(l)}</span>${s ? `<span class="s">${esc(s)}</span>` : ""}</span>
        ${v ? `<span class="v">${esc(v)}</span>` : ""}
      </div>`;
    }

    _seksjon(tittel, hoyre, rader) {
      return rader.length ? `<div class="seksjon"><div class="tittel"><span>${esc(tittel)}</span>${hoyre ? `<span>${esc(hoyre)}</span>` : ""}</div>${rader.join("")}</div>` : "";
    }

    _tegnSeksjoner() {
      if (!this._bygget || !this._hass) return;
      const c = this._c, vis = c.seksjoner;
      const ut = [];

      // Soner i dag
      if (vis.soner && this._hist && this._hist.length) {
        const rader = this._hist.map((x) => {
          const [navn, ikon, farge] = this._sone(x.s);
          const fra = new Date(x.fra), til = x.til ? new Date(x.til) : null;
          return this._rad({ id: c.person, ikon, l: navn, s: `kl ${hm(fra)}–${til ? hm(til) : "nå"}`,
            v: varighet(((til ? til.getTime() : Date.now()) - x.fra) / 60000), zf: farge });
        });
        const ulike = new Set(this._hist.map((x) => x.s)).size;
        ut.push(this._seksjon("Soner i dag", `${ulike} ${ulike === 1 ? "sted" : "steder"}`, rader));
      }

      // Mobil
      const m = this._mobilIds();
      if (vis.mobil && this._pfx) {
        const rader = [];
        const S = (id) => this._S(id);
        const bat = tall(S(m.bat));
        const lader = this._lader(m);
        if (!isNaN(bat)) {
          const n = Math.round(bat / 10) * 10;
          const bi = lader ? `mdi:battery-charging-${Math.max(10, n)}` : n >= 100 ? "mdi:battery" : n < 10 ? "mdi:battery-outline" : `mdi:battery-${n}`;
          rader.push(this._rad({ id: m.bat, ikon: bi, l: "Batteri", s: lader ? (bat >= 100 ? "Fulladet" : "Lader") : "På batteri", v: `${nf(bat)} %` }));
        }
        const conn = S(m.conn);
        if (ok(conn)) {
          const wifi = /wi-?fi/i.test(conn.state), cell = /cell|mobil/i.test(conn.state);
          const ssid = ok(S(m.ssid)) && !/not connected/i.test(S(m.ssid).state) ? S(m.ssid).state : "";
          const tek = conn.attributes["Cellular Technology"] || conn.attributes.cellular_technology || "";
          rader.push(this._rad({ id: m.conn, ikon: wifi ? "mdi:wifi" : cell ? "mdi:signal" : "mdi:access-point-network",
            l: wifi ? "Wi-Fi" : cell ? "Mobildata" : conn.state, s: wifi ? ssid : cell ? tek : "", v: "" }));
        }
        const skritt = tall(S(m.skritt));
        if (!isNaN(skritt)) rader.push(this._rad({ id: m.skritt, ikon: "mdi:walk", l: "Skritt i dag", v: nf(skritt) }));
        let dist = tall(S(m.dist));
        if (!isNaN(dist)) {
          const u = String(S(m.dist).attributes.unit_of_measurement || "").toLowerCase();
          if (u === "m") dist /= 1000;
          rader.push(this._rad({ id: m.dist, ikon: "mdi:map-marker-distance", l: "Distanse", v: `${nf(dist, dist < 10 ? 1 : 0)} km` }));
        }
        const geo = S(m.geo);
        if (ok(geo)) {
          const a = geo.attributes;
          const kort = [a.Name || a.Thoroughfare, a.Locality].filter(Boolean).join(", ");
          rader.push(this._rad({ id: m.geo, ikon: "mdi:map-marker-radius", l: "Sted", s: kort || geo.state.replace(/\n/g, ", "), v: "" }));
        }
        ut.push(this._seksjon("Mobil", "", rader));
      }

      // Søvn
      if (vis.sovn) {
        const rader = [];
        const sw = this._S(c.sovn);
        if (sw) {
          const sover = sw.state === "on";
          const lc = new Date(sw.last_changed);
          const nar = isNaN(lc) ? "" : `${sover ? "Sovnet" : "Våknet"} ${iDag(lc) ? "" : DAG[lc.getDay()] + " "}${hm(lc)}`;
          rader.push(this._rad({ id: c.sovn, ikon: sover ? "mdi:sleep" : "mdi:white-balance-sunny", l: sover ? "Sover" : "Våken",
            s: nar, v: sover && !isNaN(lc) ? varighet((Date.now() - lc.getTime()) / 60000) : "", veksle: true, pa: sover }));
        }
        const tid = this._timer_(m.sovnTid);
        if (tid != null) rader.push(this._rad({ id: m.sovnTid, ikon: "mdi:bed-clock", l: "Søvn i natt", v: varighet(tid * 60) }));
        ut.push(this._seksjon("Søvn", "", rader));
      }

      const boks = this.shadowRoot.querySelector(".seksjoner");
      const html = ut.join("");
      if (html === this._sisteHtml) return;
      this._sisteHtml = html;
      boks.innerHTML = html;
      boks.querySelectorAll(".rad").forEach((el) => {
        const id = el.dataset.id;
        this._trykk(el, () => (el.dataset.veksle ? this._veksle(id) : this._info(id)), () => this._info(id));
      });
    }
  }

  if (!customElements.get("ki-person-card")) customElements.define("ki-person-card", KiPersonCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-person-card"))
    window.customCards.push({ type: "ki-person-card", name: "KI Person",
      description: "Popupen for én person: sted og status, soner i dag, mobil og søvn – samme toppkort som rommene.", preview: true });
  console.info(`%c KI-PERSON %c ${VERSJON} `, "color:#fff;background:#3a3a46", "color:#3a3a46;background:#c9c6ff");
})();

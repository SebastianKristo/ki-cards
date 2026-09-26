/*
 * ki-person-card — «Person» (tilstedeværelse) i ki-designet: et toppkort som rom-popupens
 * (ki-rom-hero-card), tre fliser (skritt, reist i dag, søvnscore), «Søvn i natt», «Soner i dag»
 * og «Mobil» som ki-paneler. Åpnes fra «Mobil, soner og søvn ›» i familiekortets hurtigpopup
 * (bunnarket gir rammen), eller alene i en bubble-card-popup.
 *
 * Sone og «siden» fra person.*, mobil og helse fra telefonens sensorer (prefiks funnet via personens
 * device_trackers, f.eks. sensor.sebastian_iphone_17_pro_*), søvnvinduet fra søvnbryteren
 * (on = sover), «Soner i dag» fra personens historikk.
 *
 * type: custom:ki-person-card
 * person: sebastian            # sebastian | cybele | rune (tabellen under) – eller en hvilken som helst person.*-ID
 * personer: { sebastian: { navn, entity, posisjon, sovn, mobil, farge, sovn_rom } }   # overstyr/utvid tabellen
 * entity / posisjon / sovn / mobil / navn / farge / sovn_rom   # overstyr for valgt person direkte
 *   posisjon: switch/input_boolean (på = hjemme), brukes når person.* er utilgjengelig
 *   sovn:     switch/input_boolean (på = sover)
 *   mobil:    prefikset til mobilsensorene (sensor.ola_iphone_), ellers funnet selv
 *   farge:    avatarens bakgrunn (CSS-farge) når bildet mangler
 * soner: { skole: { navn: Skole, ikon: mdi:school, farge: '#f2b966', bestemt: skolen } }   # nøkkel = zone-objekt-ID
 * bilde: true                  # personens entity_picture i avataren (ellers forbokstaven)
 * header: false                # true = egen topprad med «Tilstedeværelse» og lukkeknapp
 * Mobil-sensorer (med prefiks): battery_level, battery_state, connection_type, ssid, geocoded_location, steps,
 * distance / walking_running_distance, sleep_duration, core_sleep, deep_sleep, rem_sleep, awake, sleep_score.
 */
(() => {
  if (customElements.get('ki-person-card')) return;
  const VERSJON = '2.0.0';
  const BAD = new Set(['unknown', 'unavailable', 'none', '', undefined, null]);
  const esc = (v) => (v == null ? '' : String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const nf = (n, d = 0) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString('nb-NO', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const hm = (d) => { d = d instanceof Date ? d : new Date(d); return isNaN(d) ? '–' : d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }); };
  const varig = (min) => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60), m = min % 60; return h ? (m ? `${h} t ${m} min` : `${h} t`) : `${m} min`; };

  // statusfargene (hex som i ki-rom-hero-card, så de virker uten temaets variabler)
  const C = { green: '#8fd6a0', blue: '#80c3ff', purple: '#b9a6ff', amber: '#f2b966', pink: '#f4a6c8', red: '#f47b74', gray: '#8e8d89' };
  const SOVN_F = '#a9a4ff';
  const PERSONS = {
    sebastian: { navn: 'Sebastian', entity: 'person.sebastian_kristo_jemtland', posisjon: 'switch.sebastian_posisjon_hjemme_borte', sovn: 'switch.homey_logic_sebastian_sovn_vaken', farge: 'oklch(0.55 0.08 40)', mobil: 'sensor.sebastian_iphone_17_pro_' },
    cybele: { navn: 'Cybele', entity: 'person.cybele_kristo', posisjon: 'switch.cybele_posisjon_hjemme_borte', sovn: 'switch.homey_logic_cybele_sovn_vaken', farge: 'oklch(0.5 0.08 350)' },
    rune: { navn: 'Rune', entity: 'person.rune_jemtland', posisjon: 'switch.rune_posisjon_hjemme_borte', sovn: 'switch.homey_logic_rune_sovn_vaken', farge: 'oklch(0.5 0.05 250)' },
  };
  // [navn, ikon, farge, bestemt form]
  const ZONES = {
    home: ['Hjemme', 'mdi:home', C.green, 'hjemmet'], not_home: ['Borte', 'mdi:map-marker-outline', C.purple, 'borte'],
    skole: ['Skole', 'mdi:school', C.amber, 'skolen'], stromstad: ['Strømstad', 'mdi:home-variant', C.amber, 'Strømstad'], toten: ['Toten', 'mdi:home-variant', C.amber, 'Toten'],
    mormor: ['Mormor', 'mdi:home-heart', C.pink, 'mormor'], oslo_revmatologipraksis: ['Revmatologen', 'mdi:hospital-box-outline', C.blue, 'revmatologen'], kor: ['Kor', 'mdi:music-note', C.blue, 'koret'],
  };
  // Material Symbols-navn fra eldre oppsett → mdi
  const MS = { home: 'home', logout: 'map-marker-outline', school: 'school', cottage: 'home-variant', family_home: 'home-heart', medical_services: 'hospital-box-outline', music_note: 'music-note', location_on: 'map-marker', work: 'briefcase', sports_soccer: 'soccer', fitness_center: 'dumbbell', shopping_cart: 'cart' };
  const mdi = (i) => { i = String(i || 'map-marker'); return i.includes(':') ? i : 'mdi:' + (MS[i] || i.replace(/_/g, '-')); };
  const STAGES = [['Våken', '#8e8d89'], ['Lett', 'oklch(0.72 0.1 250)'], ['Dyp', 'oklch(0.55 0.14 275)'], ['REM', 'oklch(0.75 0.13 330)']];
  // En typisk natt – mal for rekkefølgen når bare fase-totalene er kjent.
  const SEQ = [1, 2, 2, 1, 3, 1, 2, 1, 3, 0, 1, 3, 1, 3, 0];
  const WD = ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'];
  const WDL = ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'];
  const slug = (s) => String(s || '').toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
  const dayStart = (off = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
  const CACHE = new Map();

  /** Fordel N blokker på fasene etter minutter (største rest), i malens rekkefølge. */
  function hypnogram(mins, n = SEQ.length) {
    const tot = mins.reduce((p, q) => p + q, 0); if (!tot) return [];
    const raw = mins.map((m) => (m / tot) * n), cnt = raw.map(Math.floor);
    let rest = n - cnt.reduce((p, q) => p + q, 0);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((p, q) => q[0] - p[0]).forEach(([, i]) => { if (rest > 0) { cnt[i]++; rest--; } });
    const left = cnt.slice(), out = [];
    for (const want of SEQ.slice(0, n)) { const k = left[want] > 0 ? want : left.indexOf(Math.max(...left)); left[k]--; out.push(k); }
    return out;
  }

  const CSS = `
    :host { display: block; font-family: inherit; color: var(--gray1000, #f2f1ee); -webkit-tap-highlight-color: transparent; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; }
    ha-icon { display: inline-flex; flex: none; }
    .wrap { display: flex; flex-direction: column; gap: 12px; }
    .trykk { cursor: pointer; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .trykk:active { transform: scale(.97); }
    .num { font-variant-numeric: tabular-nums; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

    /* topprad (header: true) */
    .hode { display: flex; align-items: center; gap: 12px; padding: 4px 0 4px; }
    .hode .t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .hode .t b { font-size: 16px; font-weight: 500; }
    .hode .t span { font-size: 14px; font-weight: 500; opacity: .7; }
    .ring { width: 52px; height: 52px; border-radius: 50%; flex: none; display: grid; place-items: center;
      background: rgba(250,251,252,.1); border: 1px solid rgba(250,251,252,.1); color: var(--gray1000, #f2f1ee); }
    .ring ha-icon { --mdc-icon-size: 26px; }
    .ring.pa { background: var(--active-big, #ee95ff); border-color: transparent; color: var(--black, #000); }
    .lukk { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: var(--gray200, #262629); }
    .lukk ha-icon { --mdc-icon-size: 24px; }

    /* toppkortet – samme form som ki-rom-hero-card */
    .kort { position: relative; height: 184px; border-radius: 24px; overflow: hidden; background: var(--gray200, #262629);
      user-select: none; -webkit-user-select: none; }
    .kort:focus-visible { outline: 2px solid var(--f); outline-offset: 2px; }
    .topp { position: absolute; left: 18px; top: 18px; right: 84px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .navn { font-size: 14px; font-weight: 500; color: var(--gray800, #c9c7c2); max-width: 100%; }
    .pille { height: 26px; max-width: 100%; padding: 0 10px 0 8px; border-radius: 13px; display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 500; white-space: nowrap; background: color-mix(in srgb, var(--f) 18%, transparent); color: var(--f); }
    .pille ha-icon { --mdc-icon-size: 14px; }
    .pille span { overflow: hidden; text-overflow: ellipsis; }
    .bunn { position: absolute; left: 18px; right: 84px; bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .sted { font-size: 40px; font-weight: 300; letter-spacing: -.03em; line-height: 1.05; }
    .sted.lang { font-size: 32px; }
    .sub { font-size: 12px; color: var(--gray600, #8e8d89); }
    .avatar { position: absolute; right: 16px; top: 16px; width: 48px; height: 48px; border-radius: 50%; }
    .avatar .bilde { width: 100%; height: 100%; border-radius: 50%; display: grid; place-items: center; font-size: 20px; font-weight: 500;
      color: var(--gray1000, #f2f1ee); background-size: cover; background-position: center; }
    .avatar .merke { position: absolute; right: -4px; bottom: -4px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
      background: var(--gray200, #262629); color: var(--f); box-shadow: 0 0 0 2px var(--gray200, #262629); }
    .avatar .merke ha-icon { --mdc-icon-size: 13px; }
    .bat { position: absolute; right: 16px; bottom: 16px; width: 48px; height: 92px; border-radius: 24px; background: var(--gray100, rgba(255,255,255,.08));
      overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
    .bat i { display: block; background: color-mix(in srgb, var(--fb) 55%, transparent); transition: height .6s; }
    .bat ha-icon { position: absolute; left: 0; right: 0; top: 10px; margin: auto; --mdc-icon-size: 16px; color: var(--gray1000, #f2f1ee); }

    /* fliser */
    .fliser { display: grid; gap: 8px; }
    .flis { display: flex; flex-direction: column; gap: 12px; padding: 12px; border-radius: 22px; background: var(--gray200, #262629); min-width: 0; text-align: left; }
    .flis .v { font-size: 26px; font-weight: 300; line-height: 1; letter-spacing: -.02em; }
    .flis .v small { font-size: 14px; font-weight: 500; opacity: .7; letter-spacing: 0; margin-left: 2px; }
    .flis .l { font-size: 14px; font-weight: 500; opacity: .7; margin-top: 4px; }
    /* én eller to fliser: liggende, som rom-popupens små fliser */
    .fliser.ligg .flis { flex-direction: row; align-items: center; gap: 12px; min-height: 66px; padding: 7px 16px 7px 7px; }
    .fliser.ligg .flis > div { min-width: 0; }
    .fliser.ligg .flis .v { font-size: 16px; font-weight: 500; letter-spacing: 0; }
    .fliser.ligg .flis .v small { font-size: 14px; }
    .fliser.ligg .flis .l { margin-top: 2px; }

    /* seksjoner */
    .sek { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .sh { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 6px; }
    .sh b { font-size: 16px; font-weight: 500; }
    .sh span { font-size: 14px; font-weight: 500; color: var(--gray800, #c9c7c2); opacity: .9; }
    .panel { border-radius: 24px; background: var(--gray200, #262629); }
    .panel.pad { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

    /* rader i paneler */
    .rad { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 66px; padding: 7px 18px 7px 7px; text-align: left; position: relative; }
    .rad + .rad::before { content: ""; position: absolute; top: 0; left: 71px; right: 18px; height: 1px; background: rgba(250,251,252,.06); }
    .rad .t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .rad .t b { font-size: 14px; font-weight: 500; }
    .rad .t span { font-size: 14px; font-weight: 500; opacity: .7; }
    .rad .h { font-size: 14px; font-weight: 500; opacity: .7; white-space: nowrap; }
    .rad.na .h { opacity: 1; }
    .tom { padding: 18px; font-size: 14px; font-weight: 500; opacity: .7; }

    /* søvn */
    .sov-topp { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
    .sov-tot { font-size: 40px; font-weight: 300; letter-spacing: -.03em; line-height: 1; white-space: nowrap; }
    .sov-tot small { font-size: 14px; font-weight: 500; opacity: .7; letter-spacing: 0; }
    .sov-pille { --f: ${C.green}; }
    .faser { display: flex; height: 40px; gap: 2px; border-radius: 12px; overflow: hidden; }
    .faser span { border-radius: 4px; align-self: flex-end; }
    .forklaring { display: flex; gap: 6px 14px; flex-wrap: wrap; }
    .forklaring span { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; white-space: nowrap; }
    .forklaring i { width: 8px; height: 8px; border-radius: 50%; }
    .forklaring em { font-style: normal; opacity: .7; }
    .uke { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; height: 72px; align-items: end; }
    .uke > div { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 5px; height: 100%; }
    .uke .s { width: 100%; max-width: 26px; border-radius: 6px; background: rgba(250,251,252,.16); min-height: 3px; }
    .uke .s.idag { background: var(--active-big, #ee95ff); }
    .uke small { font-size: 12px; font-weight: 500; color: var(--gray600, #8e8d89); }
    @media (prefers-reduced-motion: reduce) { .trykk, .bat i { transition: none; } }
  `;

  class KiPersonCard extends HTMLElement {
    static getStubConfig(hass) {
      const p = hass && Object.keys(hass.states).find((id) => id.startsWith('person.'));
      return { person: p || 'sebastian' };
    }
    static getConfigForm() {
      return {
        schema: [
          { name: 'person', selector: { entity: { domain: 'person' } } },
          { name: 'navn', selector: { text: {} } },
          { type: 'expandable', name: '', title: 'Entiteter', schema: [
            { name: 'posisjon', selector: { entity: { domain: ['switch', 'input_boolean', 'binary_sensor'] } } },
            { name: 'sovn', selector: { entity: { domain: ['switch', 'input_boolean', 'binary_sensor'] } } },
            { name: 'mobil', selector: { text: {} } },
          ] },
          { type: 'expandable', name: '', title: 'Utseende', schema: [
            { name: 'bilde', selector: { boolean: {} } },
            { name: 'farge', selector: { text: {} } },
            { name: 'header', selector: { boolean: {} } },
          ] },
        ],
        computeLabel: (s) => ({ person: 'Person', navn: 'Navn', posisjon: 'Hjemme/borte-bryter (reserve)', sovn: 'Søvnbryter (på = sover)',
          mobil: 'Prefiks for mobilsensorer (f.eks. sensor.ola_iphone_)', bilde: 'Vis profilbilde', farge: 'Avatarfarge uten bilde', header: 'Egen topprad med lukkeknapp' }[s.name] || s.name),
      };
    }

    setConfig(c) {
      this.config = { person: 'sebastian', personer: null, soner: null, bilde: true, sovn_rom: 'Soverom', header: false, ...(c || {}) };
      this._pfx = null; this._sig = null;
      if (this._hass) this._render();
    }
    set hass(h) {
      this._hass = h;
      if (!this.config) return;
      const sig = this._used ? [...this._used].map((id) => h.states[id]) : null;
      if (sig && this._sig && sig.length === this._sig.length && sig.every((s, i) => s === this._sig[i])) return;
      this._render();
    }
    get hass() { return this._hass; }
    connectedCallback() {
      clearInterval(this._timer);
      this._timer = setInterval(() => { if (this._hass && this.config) this._render(); }, 60e3);
      if (this._hass && this.config) this._render();
    }
    disconnectedCallback() { clearInterval(this._timer); }
    getCardSize() { return 12; }
    getGridOptions() { return { columns: 12, min_columns: 6 }; }

    /* ---------- tilstand ---------- */
    st(id) { if (!id) return undefined; if (this._used) this._used.add(id); return this._hass && this._hass.states[id]; }
    v(id) { const s = this.st(id); return s ? s.state : ''; }
    n(id) { const s = this.st(id); const x = s ? parseFloat(s.state) : NaN; return isNaN(x) ? null : x; }
    at(id, attr, def) { const s = this.st(id); return s && s.attributes[attr] !== undefined ? s.attributes[attr] : def; }
    ok(id) { const s = this.st(id); return !!s && !BAD.has(s.state); }
    fname(id, def = '') { return this.at(id, 'friendly_name', def || id); }
    unit(id) { return this.at(id, 'unit_of_measurement', ''); }
    firstOk(ids) { return ids.find((id) => this.ok(id)) || null; }
    hours(id) { const v = this.n(id); if (v == null) return null; const u = String(this.unit(id)).toLowerCase(); return u === 'min' ? v / 60 : u === 's' ? v / 3600 : u === 'h' || u === 't' ? v : v > 24 ? v / 60 : v; }
    mins(id) { const h = this.hours(id); return h == null ? null : h * 60; }

    /** Asynkrone data med hurtigbuffer: siste kjente verdi nå, nytt svar tegner kortet på nytt. */
    cached(key, ttl, loader, def) {
      const now = Date.now(), c = CACHE.get(key);
      if (c && (c.pending || now - c.t < ttl)) { if (c.pending) c.waiters.add(this); return c.val !== undefined ? c.val : def; }
      const entry = { t: now, pending: true, val: c ? c.val : undefined, waiters: new Set([this]) };
      CACHE.set(key, entry);
      Promise.resolve().then(loader).then((val) => { entry.val = val; }).catch((e) => { console.warn('ki-person-card', key, e); })
        .finally(() => { entry.pending = false; entry.t = Date.now(); for (const w of entry.waiters) if (w.isConnected) w._render(); entry.waiters.clear(); });
      return entry.val !== undefined ? entry.val : def;
    }
    history(ids, hours) {
      if (!this._hass || !this._hass.callWS) return Promise.resolve({});
      const end = new Date(), start = new Date(end - hours * 3600e3);
      return this._hass.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false })
        .then((r) => { const out = {}; for (const id of ids) out[id] = ((r && r[id]) || []).map((p) => ({ t: new Date((p.lu || p.lc || 0) * 1000), v: isNaN(parseFloat(p.s)) ? p.s : parseFloat(p.s) })); return out; });
    }

    /* ---------- oppslag ---------- */
    who() {
      const cfg = this.config, table = { ...PERSONS };
      for (const [k, v] of Object.entries(cfg.personer || {})) table[k] = { ...(table[k] || {}), ...(v || {}) };
      const key = String(cfg.person || 'sebastian');
      let p;
      if (key.startsWith('person.')) { p = Object.values(table).find((x) => x.entity === key); if (!p) p = { navn: String(this.fname(key, key)).split(' ')[0], entity: key }; }
      else p = table[key] || table.sebastian;
      p = { ...p };
      for (const k of ['entity', 'posisjon', 'sovn', 'mobil', 'navn', 'farge', 'sovn_rom']) if (cfg[k]) p[k] = cfg[k];
      p.key = slug(String(p.navn || '').split(' ')[0]) || 'person';
      p.navn = p.navn || this.fname(p.entity, p.key);
      p.farge = p.farge || 'oklch(0.5 0.05 250)';
      p.prefix = this.phonePrefix(p);
      return p;
    }
    phonePrefix(p) {
      if (p.mobil) { const m = String(p.mobil).replace(/^sensor\./, ''); return 'sensor.' + (m.endsWith('_') ? m : m + '_'); }
      const trs = this.at(p.entity, 'device_trackers', []) || [];
      for (const tr of trs) { const o = String(tr).split('.')[1]; if (o && this.st(`sensor.${o}_battery_level`)) return `sensor.${o}_`; }
      if (!this._pfx || this._pfx.k !== p.key) {
        const id = Object.keys(this._hass ? this._hass.states : {}).find((x) => x.startsWith(`sensor.${p.key}_`) && x.endsWith('_battery_level'));
        this._pfx = { k: p.key, v: id ? id.replace(/battery_level$/, '') : null };
      }
      return this._pfx.v;
    }
    zones() {
      const z = { ...ZONES };
      for (const [k, v] of Object.entries(this.config.soner || {})) { const o = z[k] || [k, 'mdi:map-marker', C.blue, k]; const w = v || {}; z[k] = [w.navn || o[0], mdi(w.ikon || o[1]), w.farge || o[2], w.bestemt || w.navn || o[3]]; }
      return z;
    }
    zoneKey(state) {
      if (!state || BAD.has(state)) return null;
      if (state === 'home' || state === 'not_home') return state;
      const states = this._hass ? this._hass.states : {};
      const hit = Object.keys(states).find((id) => id.startsWith('zone.') && (states[id].attributes.friendly_name === state || id === 'zone.' + slug(state)));
      return hit ? hit.split('.')[1] : slug(state);
    }
    /** [navn, ikon, farge, bestemt form] */
    zoneInfo(key, state) {
      const z = this.zones();
      if (z[key]) return [z[key][0], mdi(z[key][1]), z[key][2], z[key][3]];
      const nm = this.fname('zone.' + key, state || key);
      return [nm, mdi(this.at('zone.' + key, 'icon', 'mdi:map-marker')), C.blue, nm];
    }
    zoneName(key) {
      if (key === 'home') return this.fname('zone.home', 'Hjem');
      if (key === 'not_home') return '';
      return this.fname('zone.' + key, this.zoneInfo(key)[0]);
    }

    /* ---------- handlinger ---------- */
    _haptic() {
      this.dispatchEvent(new CustomEvent('haptic', { detail: 'light', bubbles: true, composed: true }));
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* blokkert */ } }
    }
    more(id) { if (id) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
    /** Lukk arket/popupen kortet står i (familiekortet overstyrer denne). */
    closeSheet() {
      this.dispatchEvent(new CustomEvent('kd-close', { detail: {}, bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('ki-lukk', { detail: {}, bubbles: true, composed: true }));
      if (location.hash) history.back();
    }
    _klikk(ev) {
      const el = ev.composedPath().find((x) => x instanceof HTMLElement && x.dataset && (x.dataset.more !== undefined || x.dataset.act));
      if (!el) return;
      ev.stopPropagation();
      this._haptic();
      if (el.dataset.act === 'lukk') { this.closeSheet(); return; }
      this.more(el.dataset.more);
    }

    /* ---------- tegning ---------- */
    _render() {
      if (!this._hass || !this.config) return;
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.addEventListener('click', (e) => this._klikk(e));
        this.shadowRoot.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.dataset && e.target.dataset.more !== undefined && e.target.tagName !== 'BUTTON') { e.preventDefault(); this._klikk(e); } });
      }
      this._used = new Set();
      let html;
      try { html = this._body(); } catch (e) { console.error('ki-person-card', e); html = `<div class="panel tom">Personkortet feilet: ${esc(e.message)}</div>`; }
      this._sig = [...this._used].map((id) => this._hass.states[id]);
      if (html !== this._html) { this._html = html; this.shadowRoot.innerHTML = `<style>${CSS}</style>${html}`; }
    }

    _body() {
      const cfg = this.config, p = this.who(), px = p.prefix || 'sensor.__none_';
      const pst = this.st(p.entity);
      const useSwitch = (!pst || BAD.has(pst.state)) && this.ok(p.posisjon);
      const state = useSwitch ? (this.v(p.posisjon) === 'on' ? 'home' : 'not_home') : pst ? pst.state : '';
      const zkey = this.zoneKey(state);
      const [zl, zi, zc] = zkey ? this.zoneInfo(zkey, state) : ['Ukjent', 'mdi:map-marker-off', C.gray, ''];
      const since = useSwitch ? (this.st(p.posisjon) || {}).last_changed : pst && pst.last_changed;
      const geo = this.at(px + 'geocoded_location', 'Locality') ? this.st(px + 'geocoded_location').attributes : {};
      const sinceD = since ? new Date(since) : null;
      const sinceTxt = sinceD && !isNaN(sinceD) ? `siden ${isToday(sinceD) ? '' : WDL[sinceD.getDay()] + ' '}${hm(sinceD)}` : '';
      const sover = this.v(p.sovn) === 'on';

      // hvor – stort sted nederst, status i pillen
      let sted, pille;
      if (zkey === 'home') {
        const hn = this.fname('zone.home', '');
        sted = geo.Locality || (hn && !/^(home|hjem)$/i.test(hn) ? hn : 'Hjemme');
        pille = ['mdi:home', 'Hjemme', C.green];
      } else if (zkey === 'not_home') {
        const sub = geo['Sub Locality'], loc = geo.Locality;
        sted = sub || loc || (this.ok(px + 'geocoded_location') ? String(this.v(px + 'geocoded_location')).split(/\n|,/)[0] : 'Ukjent sted');
        pille = ['mdi:map-marker-outline', 'Borte' + (sub && loc && sub !== loc ? ' · ' + loc : ''), C.purple];
      } else if (zkey) {
        const zn = this.zoneName(zkey);
        sted = zn && zn !== zl ? zn : (geo.Locality || zl);
        pille = [zi, zl, zc];
      } else { sted = '–'; pille = ['mdi:map-marker-off', 'Ukjent', C.gray]; }
      if (sover) pille = ['mdi:sleep', zkey && zkey !== 'home' ? 'Sover · borte' : 'Sover', SOVN_F];

      // aktivitet
      const steps = this.n(px + 'steps');
      const distId = this.firstOk([px + 'distance', px + 'walking_running_distance']);
      let dist = distId ? this.n(distId) : null;
      if (dist != null) { const u = String(this.unit(distId)).toLowerCase(); if (u === 'm' || (!u && distId.endsWith('_distance') && !distId.includes('walking') && dist > 100)) dist /= 1000; }
      const scoreId = this.firstOk([px + 'sleep_score', `sensor.${p.key}_sovn_score`, `sensor.${p.key}_sleep_score`]);
      const score = scoreId ? Math.round(this.n(scoreId)) : null;

      // søvn
      const stIds = [px + 'awake', px + 'core_sleep', px + 'deep_sleep', px + 'rem_sleep'];
      const stMin = stIds.map((id) => this.mins(id));
      let dur = this.hours(px + 'sleep_duration');
      if (dur == null && stMin[1] != null && stMin[2] != null && stMin[3] != null) dur = (stMin[1] + stMin[2] + stMin[3]) / 60;
      const logH = this.cached(`ki-person-log|${p.entity}|${p.sovn}|${pst && pst.last_changed}|${(this.st(p.sovn) || {}).last_changed}|${dayStart().getTime()}`, 5 * 60e3,
        () => this.history([p.entity, p.sovn].filter(Boolean), (Date.now() - dayStart(-1).getTime() + 6 * 3600e3) / 3600e3), null);
      if (logH) this._logH = logH;
      const H = this._logH || {};
      // søvnvinduet: siste periode bryteren var «on»
      const sw = (H[p.sovn] || []).filter((x) => typeof x.v === 'string' && !BAD.has(x.v));
      let win = null;
      for (let i = 0; i < sw.length; i++) if (sw[i].v === 'on' && (i === 0 || sw[i - 1].v !== 'on')) { const end = sw.slice(i + 1).find((x) => x.v !== 'on'); win = [sw[i].t, end ? end.t : null]; }
      if (!win && sover) { const lc = (this.st(p.sovn) || {}).last_changed; if (lc) win = [new Date(lc), null]; }
      if (dur == null && win) dur = ((win[1] || new Date()) - win[0]) / 3600e3;
      const totMin = dur != null ? Math.round(dur * 60) : null;
      const haveStages = stMin.every((x) => x != null);
      const seq = haveStages ? hypnogram(stMin) : [];
      const good = score != null ? score >= 80 : dur != null && dur >= 7;
      const okNatt = score != null ? score >= 70 : dur != null && dur >= 6;
      const wkRaw = this.cached(`ki-person-wk|${px}sleep_duration|${dayStart().getTime()}|${(this.st(px + 'sleep_duration') || {}).last_changed}`, 30 * 60e3,
        () => (this.st(px + 'sleep_duration') ? this.history([px + 'sleep_duration'], (Date.now() - dayStart(-6).getTime()) / 3600e3) : Promise.resolve({})), null);
      if (wkRaw) this._wk = wkRaw;
      const wkPts = ((this._wk || {})[px + 'sleep_duration'] || []).filter((x) => typeof x.v === 'number');
      const uMul = (() => { const u = String(this.unit(px + 'sleep_duration')).toLowerCase(); return u === 'min' ? 1 / 60 : u === 's' ? 1 / 3600 : 1; })();
      const wk = this.st(px + 'sleep_duration') ? Array.from({ length: 7 }, (_, i) => {
        const d0 = dayStart(i - 6).getTime(), d1 = d0 + 864e5;
        const vals = wkPts.filter((x) => x.t >= d0 && x.t < d1).map((x) => x.v * uMul);
        const v = i === 6 && dur != null ? dur : vals.length ? Math.max(...vals) : 0;
        return { v, d: i === 6 ? 'i natt' : WD[new Date(d0).getDay()] };
      }) : [];
      const wmax = Math.max(0.01, ...wk.map((x) => x.v));

      // mobil
      const bat = this.n(px + 'battery_level');
      const bst = String(this.v(px + 'battery_state')).toLowerCase();
      const charging = ['charging', 'full', 'lader', 'fulladet'].includes(bst) || this.v(`binary_sensor.${px.slice(7)}is_charging`) === 'on';
      const conn = this.v(px + 'connection_type');
      const wifi = /wi-?fi/i.test(conn), cell = /cell|mobil/i.test(conn);
      const netShort = wifi ? 'Wi-Fi' : cell ? 'Mobildata' : conn && !BAD.has(conn) ? conn : '';
      const ssid = this.ok(px + 'ssid') ? this.v(px + 'ssid') : '';
      const tech = this.at(px + 'connection_type', 'Cellular Technology', '') || this.at(px + 'connection_type', 'cellular_technology', '');
      const trackers = this.at(p.entity, 'device_trackers', []) || [];
      const tracker = trackers.find((x) => String(x).includes(px.slice(7, -1))) || trackers[0];
      const trName = tracker ? this.fname(tracker, '') : '';
      const first = String(p.navn).split(' ')[0];
      let model = trName && trName !== tracker ? trName.replace(new RegExp(`^${first}s?\\s+`, 'i'), '').replace(/\s*\(.*\)$/, '').trim() : '';
      if (!model && p.prefix) model = p.prefix.slice(7, -1).replace(new RegExp(`^${p.key}_`), '').split('_').filter(Boolean).map((w) => (w === 'iphone' ? 'iPhone' : w === 'ipad' ? 'iPad' : /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
      const focusId = `binary_sensor.${px.slice(7)}focus`;
      const hasPhone = bat != null || (!!p.prefix && !!this.st(px + 'battery_level'));
      const lav = bat != null && bat < 20;

      // soner i dag: opphold (sone, fra, til) fra historikken
      const t0 = dayStart().getTime(), naa = Date.now();
      const hist = (H[p.entity] || []).filter((x) => typeof x.v === 'string' && !BAD.has(x.v)).map((x) => ({ t: +x.t, k: this.zoneKey(x.v), s: x.v }));
      let opph = [];
      if (hist.length) {
        const før = hist.filter((x) => x.t <= t0).pop();
        let cur = før ? { k: før.k, s: før.s, fra: t0 } : { k: hist[0].k, s: hist[0].s, fra: hist[0].t };
        for (const x of hist.filter((y) => y.t > t0 && y.t > cur.fra)) { if (x.k === cur.k) continue; opph.push({ ...cur, til: x.t }); cur = { k: x.k, s: x.s, fra: x.t }; }
        if (zkey && cur.k !== zkey) { opph.push({ ...cur, til: sinceD && !isNaN(sinceD) ? Math.max(cur.fra, +sinceD) : naa }); cur = { k: zkey, s: state, fra: sinceD && !isNaN(sinceD) ? Math.max(t0, +sinceD) : naa }; }
        opph.push({ ...cur, til: null });
      } else if (zkey) {
        opph.push({ k: zkey, s: state, fra: sinceD && !isNaN(sinceD) ? Math.max(t0, +sinceD) : t0, til: null });
      }
      // svært korte opphold (GPS-hopp) tas bort, og like naboer slås sammen
      opph = opph.filter((o, i, a) => i === a.length - 1 || (o.til - o.fra) >= 3 * 60e3);
      opph = opph.reduce((a, o) => { const l = a[a.length - 1]; if (l && l.k === o.k) l.til = o.til; else a.push({ ...o }); return a; }, []);
      opph = opph.filter((o) => o.til === null || o.til > t0);

      /* ---------- HTML ---------- */
      const e = esc;
      const ic = (i) => `<ha-icon icon="${e(i)}"></ha-icon>`;
      const pic = cfg.bilde !== false && this.at(p.entity, 'entity_picture');
      const picUrl = pic ? String(this._hass.hassUrl ? this._hass.hassUrl(pic) : pic).replace(/'/g, '%27') : '';
      const batLabel = bat != null ? `${nf(bat)} % batteri${charging ? ' · lader' : ''}` : '';
      const sub = [sinceTxt, batLabel].filter(Boolean).join(' · ');
      const batF = lav ? `var(--red, ${C.red})` : charging ? `var(--green, ${C.green})` : 'var(--gray800, #c9c7c2)';
      const batIc = charging ? 'mdi:battery-charging' : lav ? 'mdi:battery-alert-variant-outline' : 'mdi:battery';

      const hode = cfg.header ? `<div class="hode">
          <span class="ring pa">${ic('mdi:account')}</span>
          <div class="t"><b>Tilstedeværelse</b><span>Mobil, sone og søvn</span></div>
          <button class="lukk trykk" data-act="lukk" aria-label="Lukk">${ic('mdi:close')}</button>
        </div>` : '';

      const kort = `<div class="kort trykk" style="--f:${e(pille[2])}" role="button" tabindex="0" data-more="${e(p.entity)}"
          aria-label="${e(`${p.navn}: ${pille[1]}, ${sted}. ${sub}`)}">
          <div class="topp"><span class="navn ell">${e(p.navn)}</span><span class="pille">${ic(pille[0])}<span>${e(pille[1])}</span></span></div>
          <div class="bunn" style="right:${bat != null ? 84 : 18}px"><span class="sted ell${String(sted).length > 11 ? ' lang' : ''}">${e(sted)}</span><span class="sub ell num">${e(sub)}</span></div>
          <div class="avatar" style="--f:${e(zkey ? zc : C.gray)}"><div class="bilde" style="${picUrl ? `background-image:url('${e(picUrl)}')` : `background-color:${e(p.farge)}`}">${picUrl ? '' : e(String(p.navn).trim()[0] || '?')}</div>
            <span class="merke">${ic(zi)}</span></div>
          ${bat != null ? `<button class="bat" style="--fb:${batF}" data-more="${e(px + 'battery_level')}" aria-label="Batteri ${nf(bat)} %"><i style="height:${Math.max(0, Math.min(100, bat))}%"></i>${ic(batIc)}</button>` : ''}
        </div>`;

      const fliser = [steps != null ? ['mdi:walk', nf(Math.round(steps)), '', 'skritt', px + 'steps'] : null,
        dist != null ? ['mdi:map-marker-distance', dist < 10 && Math.round(dist * 10) % 10 ? nf(dist, 1) : nf(Math.round(dist)), 'km', 'reist i dag', distId] : null,
        score != null && !isNaN(score) ? ['mdi:sleep', String(score), '', 'søvnscore', scoreId] : null].filter(Boolean);
      const flisHtml = fliser.length ? `<div class="fliser${fliser.length < 3 ? ' ligg' : ''}" style="grid-template-columns:repeat(${fliser.length},minmax(0,1fr))">${fliser.map(([i, v, u, l, id]) => `
          <button class="flis trykk" data-more="${e(id)}"><span class="ring">${ic(i)}</span>
            <div><div class="v num ell">${e(v)}${u ? `<small>${e(u)}</small>` : ''}</div><div class="l ell">${e(l)}</div></div></button>`).join('')}</div>` : '';

      const harSovn = totMin != null || haveStages || !!win;
      const sovnPille = sover ? ['mdi:sleep', 'Sover nå', SOVN_F] : (score != null || dur != null) ? (good ? ['mdi:check', 'God natt', C.green] : okNatt ? ['mdi:minus', 'Grei natt', C.amber] : ['mdi:alert-outline', 'Urolig natt', C.amber]) : null;
      const sovnHtml = harSovn ? `<section class="sek">
          <div class="sh"><b>Søvn i natt</b><span class="num">${win ? `${hm(win[0])}–${win[1] ? hm(win[1]) : 'nå'}` : ''}</span></div>
          <div class="panel pad trykk" data-more="${e(this.st(px + 'sleep_duration') ? px + 'sleep_duration' : p.sovn || '')}">
            <div class="sov-topp">
              ${totMin != null ? `<div class="sov-tot num">${Math.floor(totMin / 60)}<small> t </small>${totMin % 60}<small> min</small></div>` : '<div></div>'}
              ${sovnPille ? `<span class="pille" style="--f:${sovnPille[2]}">${ic(sovnPille[0])}<span>${e(sovnPille[1])}</span></span>` : ''}
            </div>
            ${seq.length ? `<div class="faser">${seq.map((k, i) => `<span style="flex:${1 + (i % 3) * 0.5};height:${[35, 60, 100, 80][k]}%;background:${STAGES[k][1]};opacity:${k === 0 ? 0.5 : 1}"></span>`).join('')}</div>` : ''}
            ${stMin.some((x) => x != null) ? `<div class="forklaring">${STAGES.map(([l, c], k) => (stMin[k] != null ? `<span><i style="background:${c}"></i>${l}<em class="num">${varig(stMin[k])}</em></span>` : '')).join('')}</div>` : ''}
            ${wk.some((w) => w.v > 0) ? `<div class="uke">${wk.map((w, i) => `<div><span class="s${i === 6 ? ' idag' : ''}" style="height:${Math.round((w.v / wmax) * 100)}%" title="${e(varig(w.v * 60))}"></span><small>${e(w.d)}</small></div>`).join('')}</div>` : ''}
          </div></section>` : '';

      const sonerHtml = opph.length ? `<section class="sek">
          <div class="sh"><b>Soner i dag</b><span>${opph.length === 1 ? '' : `${opph.length} steder`}</span></div>
          <div class="panel">${opph.slice().reverse().map((o) => {
            const [n, i] = this.zoneInfo(o.k, o.s);
            const navn = o.k === 'home' ? 'Hjemme' : o.k === 'not_home' ? 'Borte' : (this.zoneName(o.k) || n);
            const aktiv = o.til === null;
            const tid = o.fra <= t0 && aktiv ? 'hele dagen' : `kl ${o.fra <= t0 ? '00:00' : hm(o.fra)}–${aktiv ? 'nå' : hm(o.til)}`;
            return `<div class="rad${aktiv ? ' na' : ''}"><span class="ring${aktiv ? ' pa' : ''}">${ic(i)}</span>
              <div class="t"><b class="ell">${e(navn)}</b><span class="ell num">${e(tid)}</span></div>
              <span class="h num">${e(varig(((aktiv ? naa : o.til) - Math.max(o.fra, t0)) / 60e3))}</span></div>`;
          }).join('')}</div></section>` : '';

      const rader = [];
      if (hasPhone) {
        rader.push([batIc, 'Batteri', charging ? 'Lader' : bst && !BAD.has(bst) && bst !== 'not charging' ? this.v(px + 'battery_state') : 'På batteri', bat != null ? `${nf(bat)} %` : '–', px + 'battery_level', lav || charging]);
        if (netShort) rader.push([wifi ? 'mdi:wifi' : cell ? 'mdi:signal-cellular-3' : 'mdi:web', netShort, wifi ? (ssid || zl) : cell ? (tech || 'Mobilnett') : '', '', wifi && this.ok(px + 'ssid') ? px + 'ssid' : px + 'connection_type']);
        if (this.ok(px + 'geocoded_location')) {
          const g = this.st(px + 'geocoded_location').attributes;
          const linje = [g['Sub Locality'], g.Locality].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', ') || String(this.v(px + 'geocoded_location')).split('\n')[0];
          rader.push(['mdi:map-marker-radius', 'Sted', linje, g.Country || '', px + 'geocoded_location']);
        }
        if (this.st(focusId)) rader.push(['mdi:minus-circle-outline', 'Fokus', this.v(focusId) === 'on' ? 'På' : 'Av', '', focusId, this.v(focusId) === 'on']);
        if (tracker) rader.push(['mdi:crosshairs-gps', 'Posisjon', this.ok(tracker) ? 'Deles' : 'Deles ikke', '', tracker]);
      }
      const mobilHtml = rader.length ? `<section class="sek">
          <div class="sh"><b>Mobil</b><span class="ell">${e(model || '')}</span></div>
          <div class="panel">${rader.map(([i, t, s, h, id, pa]) => `<button class="rad trykk" data-more="${e(id)}"><span class="ring${pa ? ' pa' : ''}"${pa && lav && id === px + 'battery_level' ? ` style="background:var(--red, ${C.red})"` : ''}>${ic(i)}</span>
              <div class="t"><b class="ell">${e(t)}</b>${s ? `<span class="ell">${e(s)}</span>` : ''}</div>${h ? `<span class="h num">${e(h)}</span>` : ''}</button>`).join('')}</div></section>` : '';

      return `<div class="wrap">${hode}${kort}${flisHtml}${sovnHtml}${sonerHtml}${mobilHtml}</div>`;
    }
  }

  customElements.define('ki-person-card', KiPersonCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === 'ki-person-card'))
    window.customCards.push({ type: 'ki-person-card', name: 'KI Person', preview: true,
      description: 'Tilstedeværelse: sted, aktivitet, søvn i natt, soner i dag og mobil for én person.' });
  console.info(`%c KI-PERSON %c ${VERSJON} `, 'color:#fff;background:#463a40', 'color:#463a40;background:#efc6c9');
})();

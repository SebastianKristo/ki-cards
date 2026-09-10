/* ============================================================================
 * ki-hjem-card  v1.2.3  –  hele simple-tabs-blokken på forsiden, auto fra KI Rom
 *
 *  type: custom:ki-hjem-card          # uten mer config: Hjem-fane + én fane per HA-etasje
 *  hjem:                  # Hjem-fanen (standard på; hjem: false skrur av)
 *    las: lock.dorlas_blatann
 *    garasje: cover.garasje
 *    alarm: { entity: select.alarm_homealarm_state, script: script.x }
 *    kalender: sensor.kalender_oslomet
 *    rom: [stue, inngang, ute]        # store fliser i venstre swipe (standard: første ~60 % av rommene)
 *    rom_hoyre: [pult, kjokken]       # høyre swipe
 *    stov: [ { kind: navigate, ... }, { swipe: {...} } ]
 *    swipe_type: plain               # bruk swipe-card i stedet for css-swipe-card for rom-swipene
 *  etasjer: auto          # standard – én fane per etasje; etasjer: false skrur av
 *  monster: { venstre: [big, small], hoyre: [row, big, row] }   # flismønster per kolonne
 *  etasje_innstillinger: { <etasje_id>: { vis: false, rekkefolge: 2, navn: '1. etg' } }
 *  Alt over kan settes i UI-editoren (rom: vis/størrelse/plassering/rekkefølge/farge).
 *  rom:                   # per-rom-overstyring brukt overalt (auto-faner og fliser)
 *    inngang: { size: small, path: '#gang', farge: var(--yellow) }
 *    do:      { size: row,   farge: var(--blue-dark) }
 *  tabs:                  # eksplisitte faner (foran/etter auto-fanene, se `plasser`)
 *    - title: Hjem
 *      layout: {grid-template-columns: ..., grid-template-areas: ...}
 *      omrader:
 *        stue:
 *          - swipe: { type: plain, cards: [ {kind: las, entity: lock.x}, {kind: garasje, entity: cover.x} ] }
 *          - swipe: { height: 266px, cards: [ {rom: stue}, {rom: inngang}, {rom: ute}, {kind: kalender, entity: sensor.k} ] }
 *          - { kind: alarm, entity: select.x, script: script.x }
 *        kjokken: [ { swipe: { height: 266px, cards: [ {rom: pult}, {rom: kjokken} ] } } ]
 *        stov: [ ... ]
 *    - title: 1. etg
 *      kolonner: { venstre: [ {rom: stue}, {rom: inngang} ], hoyre: [ {rom: do}, {rom: kjokken}, {rom: ute} ] }
 *    - title: Aktuelt
 *      cards: [ ...vanlige kort... ]
 *    - title: Batterier
 *      conditions: [...]
 *      cards: [...]
 *  Elementer i lister: {rom: x} / {kind: ...} = ki-rom-tile-card, {swipe: {...}} = css-swipe-card
 *  (type: plain = custom:swipe-card), {card: {...}} eller alt med `type:` = kortet som det er.
 * ========================================================================== */
(() => {
  const SWIPE_CSS = {
    '--pagination-bullet-active-background-color': 'var(--gray400)',
    '--pagination-bullet-background-color': 'var(--gray200)',
    '--pagination-bullet-border': 'none',
    '--pagination-bullet-distance': '0px',
  };
  const TABS_STYLE = '.tabs-container {\n  padding: 2px !important;\n}\n.tabs {\n  box-sizing: border-box;\n  max-width: 100% !important;\n  padding: 2px !important;\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  border-radius: 999px !important;\n}\n.tab-button {\n  border-radius: 999px !important;\n  font-weight: 500;\n}\n.tab-button.active {\n  background: var(--active-big) !important;\n  color: rgba(70, 58, 64, 0.95) !important;\n  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);\n}\n';
  const FARGER = ['var(--green)', 'var(--blue)', 'var(--yellow)', 'var(--purple)', 'var(--orange)', 'var(--red)', 'var(--pink)'];

  function allOversikt(hass) {
    return Object.values(hass.states)
      .filter((st) => st.entity_id.startsWith('sensor.') && st.entity_id.endsWith('_oversikt') && st.attributes.integrasjon === 'ki_rom' && st.attributes.area_id !== 'totalt')
      .sort((a, b) => (a.attributes.rom || '').localeCompare(b.attributes.rom || '', 'nb'));
  }

  let swipeSeq = 0;
  // ---- et element i en liste -> kortkonfig
  function item(it, romCfg, gap) {
    if (!it) return null;
    if (it.swipe) {
      const sw = it.swipe;
      const cards = (sw.cards || []).map((c) => item(c, romCfg)).filter(Boolean);
      if (sw.type === 'plain') {
        const c = { type: 'custom:swipe-card', cards };
        if (sw.pagination) c.parameters = { pagination: { el: '.swiper-pagination', clickable: true }, ...(sw.parameters || {}) };
        return c;
      }
      // unik cardId per swipe – like id-er gjør at én av dem forsvinner når de lages samtidig
      return { type: 'custom:css-swipe-card', cardId: sw.cardId || ('ki_hjem_swipe_' + (++swipeSeq)), height: sw.height || '266px', pagination: sw.pagination !== false, custom_css: SWIPE_CSS, cards };
    }
    if (it.card) return it.card;
    if (it.type) return it;
    if (it.rom || it.kind) {
      const base = it.rom ? (romCfg[it.rom] || {}) : {};
      return { type: 'custom:ki-rom-tile-card', ...base, ...it };
    }
    return null;
  }

  function stack(list, romCfg, gap = 10) {
    const cards = [];
    (list || []).forEach((it) => {
      const c = item(it, romCfg);
      if (!c) return;
      if (cards.length) cards.push({ type: 'custom:gap-card', height: gap });
      cards.push(c);
    });
    if (!cards.length) return null;
    return cards.length === 1 ? cards[0] : { type: 'vertical-stack', cards };
  }

  function areaTab(tab, romCfg) {
    const layout = { 'grid-gap': '0px', margin: '-12px 0px 0px -4px', ...(tab.layout || {}) };
    const cards = [];
    Object.entries(tab.omrader || {}).forEach(([area, list]) => {
      const c = stack(list, romCfg, tab.gap);
      if (c) cards.push({ ...c, view_layout: { 'grid-area': area } });
    });
    return { type: 'vertical-stack', cards: [{ type: 'custom:layout-card', layout_type: 'custom:grid-layout', layout, cards }], columns: 1 };
  }

  function columnsTab(tab, romCfg) {
    const kol = tab.kolonner || {};
    const names = Object.keys(kol);
    const layout = { 'grid-template-columns': names.map(() => '1fr').join(' '), 'grid-gap': '0px', margin: '-12px 0px 0px -4px', 'grid-template-rows': null, 'grid-template-areas': '"' + names.join(' ') + '"  \n', ...(tab.layout || {}) };
    const cards = names.map((n) => { const c = stack(kol[n], romCfg, tab.gap); return c ? { ...c, view_layout: { 'grid-area': n } } : null; }).filter(Boolean);
    return { type: 'vertical-stack', cards: [{ type: 'custom:layout-card', layout_type: 'custom:grid-layout', layout, cards }], columns: 1 };
  }

  function buildTab(tab, romCfg) {
    const out = { title: tab.title, icon: tab.icon || '' };
    if (tab.conditions) out.conditions = tab.conditions;
    if (tab.badge !== undefined) out.badge = tab.badge;
    if (tab.omrader) out.card = areaTab(tab, romCfg);
    else if (tab.kolonner) out.card = columnsTab(tab, romCfg);
    else if (tab.cards) out.card = { type: 'vertical-stack', cards: tab.cards.map((c) => item(c, romCfg)).filter(Boolean) };
    else if (tab.card) out.card = tab.card;
    return out;
  }

  // ---- rom fra ki-rom, filtrert og sortert (rekkefolge i rom: { x: { rekkefolge: 1 } })
  function rooms(hass, cfg) {
    const romCfg = cfg.rom || {};
    return allOversikt(hass)
      .map((st) => st.attributes)
      .filter((a) => !(cfg.hopp_over || []).includes(a.area_id) && !(romCfg[a.area_id] && romCfg[a.area_id].skjul))
      .sort((x, y) => ((romCfg[x.area_id] || {}).rekkefolge ?? 50) - ((romCfg[y.area_id] || {}).rekkefolge ?? 50) || (x.rom || '').localeCompare(y.rom || '', 'nb'));
  }

  const DEFAULT_MONSTER = { venstre: ['big', 'small'], hoyre: ['row', 'big', 'row'] };

  // fordel rom i to kolonner etter flismønsteret (venstre: big, small … hoyre: row, big, row …)
  function columnsFor(list, cfg, offset = 0) {
    const romCfg = cfg.rom || {};
    const monster = { ...DEFAULT_MONSTER, ...(cfg.monster || {}) };
    const kol = { venstre: [], hoyre: [] };
    let i = offset;
    list.forEach((a) => {
      const o = romCfg[a.area_id] || {};
      const side = o.kolonne || (i % 2 ? 'hoyre' : 'venstre');
      const pat = monster[side] || ['big'];
      const size = o.size || pat[kol[side].length % pat.length];
      kol[side].push({ rom: a.area_id, size, farge: o.farge || FARGER[i % FARGER.length] });
      i++;
    });
    return kol;
  }

  // ---- auto: én fane per etasje
  function autoFloorTabs(hass, cfg) {
    const floors = new Map();
    rooms(hass, cfg).forEach((a) => {
      const key = a.etasje_id || '__uten';
      if (!floors.has(key)) floors.set(key, { navn: a.etasje || cfg.uten_etasje_navn || 'Andre', niva: a.etasje_niva ?? 999, rom: [] });
      floors.get(key).rom.push(a);
    });
    const fc = cfg.etasje_innstillinger || {};
    const list = [...floors.entries()]
      .filter(([k]) => (fc[k] || {}).vis !== false)
      .map(([k, f]) => ({ ...f, key: k, ord: (fc[k] || {}).rekkefolge ?? (f.niva === 999 ? 999 : f.niva) }))
      .sort((x, y) => (x.ord - y.ord) || x.navn.localeCompare(y.navn, 'nb'));
    return list.map((f) => ({ title: (fc[f.key] || {}).navn || f.navn, kolonner: columnsFor(f.rom, cfg) }));
  }

  // ---- auto: Hjem-fanen med samme layout som før ("stue kjokken" / "stue stov")
  //  hjem: { las: lock.x, garasje: cover.x, alarm: { entity, script }, kalender: sensor.x,
  //          rom: [stue, inngang, ute] (venstre swipe), rom_hoyre: [pult, kjokken], stov: [ ...fliser ] }
  function autoHjemTab(hass, cfg) {
    const h = typeof cfg.hjem === 'object' && cfg.hjem ? cfg.hjem : {};
    const romCfg = cfg.rom || {};
    const alle = rooms(hass, cfg).map((a) => a.area_id);
    const finnes = (r) => hass.states['sensor.' + r + '_oversikt'] || alle.includes(r);
    const venstreRom = (h.rom || alle.slice(0, Math.max(2, Math.ceil(alle.length * 0.6)))).filter(finnes);
    const hoyreRom = (h.rom_hoyre || alle.filter((r) => !venstreRom.includes(r))).filter(finnes);
    const tile = (r, i) => ({ rom: r, size: 'big', farge: (romCfg[r] || {}).farge || FARGER[i % FARGER.length] });

    const topp = [];
    if (h.las) topp.push({ kind: 'las', entity: h.las, path: h.las_path || '#dor' });
    if (h.garasje) topp.push({ kind: 'garasje', entity: h.garasje, path: h.garasje_path || '#garasje' });

    const store = venstreRom.map(tile);
    if (h.kalender) store.push({ kind: 'kalender', entity: h.kalender, path: h.kalender_path || '#kalender' });

    const stue = [];
    if (topp.length) stue.push({ swipe: { type: 'plain', cards: topp } });
    if (store.length) stue.push({ swipe: { type: h.swipe_type || 'css', height: '266px', pagination: true, cards: store } });
    if (h.alarm) stue.push({ kind: 'alarm', ...(typeof h.alarm === 'string' ? { entity: h.alarm } : h.alarm), path: (h.alarm && h.alarm.path) || '#alarm' });

    const omrader = { stue };
    if (hoyreRom.length) omrader.kjokken = [{ swipe: { type: h.swipe_type || 'css', height: '266px', pagination: true, cards: hoyreRom.map((r, i) => tile(r, i + venstreRom.length)) } }];
    if (h.stov && h.stov.length) omrader.stov = h.stov;

    const areas = omrader.stov ? '"stue kjokken"\n"stue stov"\n"stue stov"\n' : (omrader.kjokken ? '"stue kjokken"\n' : '"stue"\n');
    return {
      title: h.title || 'Hjem',
      layout: { 'grid-template-columns': 'repeat(auto-fit, minmax(160px, 1fr))', 'grid-template-rows': 'auto', 'grid-template-areas': areas, ...(h.layout || {}) },
      omrader,
    };
  }

  function generate(hass, cfg) {
    swipeSeq = 0;
    const romCfg = cfg.rom || {};
    const explicit = (cfg.tabs || []).map((t) => buildTab(t, romCfg));
    const hasHjem = explicit.some((t) => (t.title || '').toLowerCase() === 'hjem');
    let tabs = explicit;
    // Hjem-fanen er standard på (hjem: false skrur av); egen «Hjem» i tabs vinner
    if (cfg.hjem !== false && !hasHjem) tabs = [buildTab(autoHjemTab(hass, cfg), romCfg), ...explicit];
    if (cfg.etasjer !== false && cfg.etasjer !== 'manuell') {
      const auto = autoFloorTabs(hass, cfg).map((t) => buildTab(t, romCfg));
      const idx = tabs.findIndex((t) => (t.title || '').toLowerCase() === 'hjem');
      const pos = cfg.plasser === 'foran' ? 0 : (typeof cfg.plasser === 'number' ? cfg.plasser : idx + 1);
      tabs = [...tabs.slice(0, pos), ...auto, ...tabs.slice(pos)];
    }
    return {
      type: 'custom:simple-tabs',
      'pre-load': true, alignment: cfg.alignment || 'start',
      container_padding: '10px', container_background: 'transparent',
      'background-color': 'transparent', 'border-color': 'transparent',
      'text-color': 'rgba(255, 255, 255, 0.72)', 'hover-color': 'rgba(255, 255, 255, 0.95)',
      tabs,
      card_mod: { style: TABS_STYLE },
    };
  }

  // card_mod virker ikke på kort laget via card-helpers -> legg stilen rett i simple-tabs sin shadowRoot
  function injectTabsStyle(el, tries = 0) {
    const sr = el && el.shadowRoot;
    if (sr) {
      if (!sr.querySelector('style[data-ki-hjem]')) { const st = document.createElement('style'); st.dataset.kiHjem = '1'; st.textContent = TABS_STYLE; sr.appendChild(st); }
      return;
    }
    if (tries < 40) setTimeout(() => injectTabsStyle(el, tries + 1), 50);
  }

  // swipe-card (plain): prikker under kortet i samme stil som css-swipe-card
  const SWIPE_STYLE = '.swiper-container, .swiper { padding-bottom: 18px; } .swiper-pagination { bottom: 0 !important; } .swiper-pagination-bullet { background: var(--gray200) !important; opacity: 1 !important; width: 8px; height: 8px; margin: 0 4px !important; } .swiper-pagination-bullet-active { background: var(--gray400) !important; }';

  function walkShadow(node, fn, depth = 0) {
    if (!node || depth > 25) return;
    if (node.shadowRoot) { fn(node); node.shadowRoot.querySelectorAll('*').forEach((n) => walkShadow(n, fn, depth + 1)); }
    node.querySelectorAll && node.querySelectorAll('*').forEach((n) => { if (n.shadowRoot) walkShadow(n, fn, depth + 1); });
  }
  function injectSwipeStyle(root, tries = 0) {
    walkShadow(root, (el) => {
      if (el.localName !== 'swipe-card') return;
      const sr = el.shadowRoot;
      if (sr && !sr.querySelector('style[data-ki-hjem]')) { const st = document.createElement('style'); st.dataset.kiHjem = '1'; st.textContent = SWIPE_STYLE; sr.appendChild(st); }
    });
    if (tries < 30) setTimeout(() => injectSwipeStyle(root, tries + 1), 300);
  }

  const SIZES = [{ value: 'big', label: 'Stor med klimaknapp' }, { value: 'big_plain', label: 'Stor uten klimaknapp' }, { value: 'small', label: 'Medium' }, { value: 'row', label: 'Liten (rad)' }];
  const FARGEVALG = ['var(--green)', 'var(--blue)', 'var(--blue-dark)', 'var(--yellow)', 'var(--orange)', 'var(--red)', 'var(--purple)', 'var(--pink)', 'var(--gray1000)'].map((v) => ({ value: v, label: v.replace('var(--', '').replace(')', '') }));

  class KiHjemEditor extends HTMLElement {
    setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this._render(); }
    set hass(hass) { this._hass = hass; this._render(); }

    _floors() {
      const m = new Map();
      allOversikt(this._hass).forEach((st) => { const a = st.attributes; const k = a.etasje_id || '__uten'; if (!m.has(k)) m.set(k, { key: k, navn: a.etasje || 'Andre', niva: a.etasje_niva ?? 999, rom: [] }); m.get(k).rom.push(a); });
      return [...m.values()].sort((x, y) => x.niva - y.niva);
    }

    _schema() {
      const roomOpts = allOversikt(this._hass).map((st) => ({ value: st.attributes.area_id, label: st.attributes.rom || st.attributes.area_id }));
      const s = [
        { name: 'h_hjem', type: 'constant', label: 'Hjem-fanen' },
        { name: 'hjem_vis', selector: { boolean: {} } },
        { name: 'hjem_las', selector: { entity: { domain: 'lock' } } },
        { name: 'hjem_garasje', selector: { entity: { domain: 'cover' } } },
        { name: 'hjem_alarm', selector: { entity: { domain: ['select', 'alarm_control_panel'] } } },
        { name: 'hjem_alarm_script', selector: { entity: { domain: 'script' } } },
        { name: 'hjem_kalender', selector: { entity: { domain: 'sensor' } } },
        { name: 'hjem_rom', selector: { select: { multiple: true, mode: 'list', options: roomOpts } } },
        { name: 'hjem_rom_hoyre', selector: { select: { multiple: true, mode: 'list', options: roomOpts } } },
        { name: 'h_etasjer', type: 'constant', label: 'Etasjer' },
        { name: 'etasjer_vis', selector: { boolean: {} } },
      ];
      this._floors().forEach((f) => {
        s.push({ name: 'f_' + f.key, type: 'constant', label: '— ' + f.navn + ' —' });
        s.push({ name: 'et_' + f.key + '_vis', selector: { boolean: {} } });
        s.push({ name: 'et_' + f.key + '_rekkefolge', selector: { number: { min: 0, max: 99, mode: 'box' } } });
        s.push({ name: 'et_' + f.key + '_navn', selector: { text: {} } });
        f.rom.forEach((a) => {
          const r = a.area_id;
          s.push({ name: 'r_' + r, type: 'constant', label: a.rom || r });
          s.push({ name: 'rom_' + r + '_vis', selector: { boolean: {} } });
          s.push({ name: 'rom_' + r + '_size', selector: { select: { mode: 'dropdown', options: SIZES } } });
          s.push({ name: 'rom_' + r + '_kolonne', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Automatisk' }, { value: 'venstre', label: 'Venstre' }, { value: 'hoyre', label: 'Høyre' }] } } });
          s.push({ name: 'rom_' + r + '_rekkefolge', selector: { number: { min: 0, max: 99, mode: 'box' } } });
          s.push({ name: 'rom_' + r + '_farge', selector: { select: { mode: 'dropdown', custom_value: true, options: FARGEVALG } } });
          s.push({ name: 'rom_' + r + '_path', selector: { text: {} } });
        });
      });
      return s;
    }

    _data() {
      const c = this._config; const h = (typeof c.hjem === 'object' && c.hjem) || {};
      const d = {
        hjem_vis: c.hjem !== false, hjem_las: h.las, hjem_garasje: h.garasje,
        hjem_alarm: typeof h.alarm === 'string' ? h.alarm : (h.alarm || {}).entity, hjem_alarm_script: (h.alarm || {}).script,
        hjem_kalender: h.kalender, hjem_rom: h.rom || [], hjem_rom_hoyre: h.rom_hoyre || [],
        etasjer_vis: c.etasjer !== false,
      };
      const fc = c.etasje_innstillinger || {}; const rc = c.rom || {};
      this._floors().forEach((f) => {
        d['et_' + f.key + '_vis'] = (fc[f.key] || {}).vis !== false;
        d['et_' + f.key + '_rekkefolge'] = (fc[f.key] || {}).rekkefolge;
        d['et_' + f.key + '_navn'] = (fc[f.key] || {}).navn;
        f.rom.forEach((a) => {
          const o = rc[a.area_id] || {};
          d['rom_' + a.area_id + '_vis'] = !o.skjul;
          d['rom_' + a.area_id + '_size'] = o.size || 'big';
          d['rom_' + a.area_id + '_kolonne'] = o.kolonne || 'auto';
          d['rom_' + a.area_id + '_rekkefolge'] = o.rekkefolge;
          d['rom_' + a.area_id + '_farge'] = o.farge;
          d['rom_' + a.area_id + '_path'] = o.path;
        });
      });
      return d;
    }

    _toConfig(v) {
      const out = { type: 'custom:ki-hjem-card' };
      const prev = this._config || {};
      if (prev.tabs) out.tabs = prev.tabs;
      if (prev.monster) out.monster = prev.monster;
      if (prev.hopp_over) out.hopp_over = prev.hopp_over;
      const hOld = (typeof prev.hjem === 'object' && prev.hjem) || {};
      if (v.hjem_vis === false) out.hjem = false;
      else {
        const h = { ...hOld };
        delete h.las; delete h.garasje; delete h.alarm; delete h.kalender; delete h.rom; delete h.rom_hoyre;
        if (v.hjem_las) h.las = v.hjem_las;
        if (v.hjem_garasje) h.garasje = v.hjem_garasje;
        if (v.hjem_alarm) h.alarm = v.hjem_alarm_script ? { entity: v.hjem_alarm, script: v.hjem_alarm_script } : v.hjem_alarm;
        if (v.hjem_kalender) h.kalender = v.hjem_kalender;
        if (v.hjem_rom && v.hjem_rom.length) h.rom = v.hjem_rom;
        if (v.hjem_rom_hoyre && v.hjem_rom_hoyre.length) h.rom_hoyre = v.hjem_rom_hoyre;
        if (Object.keys(h).length) out.hjem = h;
      }
      if (v.etasjer_vis === false) out.etasjer = false;
      const fc = {}; const rc = {};
      this._floors().forEach((f) => {
        const e = {};
        if (v['et_' + f.key + '_vis'] === false) e.vis = false;
        if (v['et_' + f.key + '_rekkefolge'] !== undefined && v['et_' + f.key + '_rekkefolge'] !== null && v['et_' + f.key + '_rekkefolge'] !== '') e.rekkefolge = Number(v['et_' + f.key + '_rekkefolge']);
        if (v['et_' + f.key + '_navn']) e.navn = v['et_' + f.key + '_navn'];
        if (Object.keys(e).length) fc[f.key] = e;
        f.rom.forEach((a) => {
          const r = a.area_id; const o = { ...((prev.rom || {})[r] || {}) };
          delete o.skjul; delete o.size; delete o.kolonne; delete o.rekkefolge; delete o.farge; delete o.path;
          if (v['rom_' + r + '_vis'] === false) o.skjul = true;
          if (v['rom_' + r + '_size'] && v['rom_' + r + '_size'] !== 'big') o.size = v['rom_' + r + '_size'];
          if (v['rom_' + r + '_kolonne'] && v['rom_' + r + '_kolonne'] !== 'auto') o.kolonne = v['rom_' + r + '_kolonne'];
          const rk = v['rom_' + r + '_rekkefolge'];
          if (rk !== undefined && rk !== null && rk !== '') o.rekkefolge = Number(rk);
          if (v['rom_' + r + '_farge']) o.farge = v['rom_' + r + '_farge'];
          if (v['rom_' + r + '_path']) o.path = v['rom_' + r + '_path'];
          if (Object.keys(o).length) rc[r] = o;
        });
      });
      // rom som ikke er på noen etasje i listen (f.eks. skjult fra ki-rom) beholdes
      Object.entries(prev.rom || {}).forEach(([r, o]) => { if (!(r in rc) && !allOversikt(this._hass).some((st) => st.attributes.area_id === r)) rc[r] = o; });
      if (Object.keys(fc).length) out.etasje_innstillinger = fc;
      if (Object.keys(rc).length) out.rom = rc;
      return out;
    }

    _render() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (sc) => {
          const n = sc.name;
          const m = {
            hjem_vis: 'Vis Hjem-fanen', hjem_las: 'Dørlås', hjem_garasje: 'Garasjeport', hjem_alarm: 'Alarm (entitet)', hjem_alarm_script: 'Alarm av/på-skript',
            hjem_kalender: 'Kalender-sensor', hjem_rom: 'Rom i venstre swipe', hjem_rom_hoyre: 'Rom i høyre swipe', etasjer_vis: 'Vis etasje-faner',
          };
          if (m[n]) return m[n];
          if (n.startsWith('et_')) return { vis: 'Vis etasje', rekkefolge: 'Rekkefølge', navn: 'Fanenavn' }[n.split('_').pop()] || n;
          if (n.startsWith('rom_')) return { vis: 'Vis rom', size: 'Størrelse', kolonne: 'Plassering', rekkefolge: 'Rekkefølge', farge: 'Farge', path: 'Popup-hash' }[n.split('_').pop()] || n;
          return sc.label || n;
        };
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const out = this._toConfig(ev.detail.value || {});
          this._config = out;
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
          this._render();
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      const schema = this._schema();
      if (JSON.stringify(schema) !== this._lastSchema) { this._lastSchema = JSON.stringify(schema); this._form.schema = schema; }
      const data = this._data();
      if (JSON.stringify(data) !== this._lastData) { this._lastData = JSON.stringify(data); this._form.data = data; }
    }
  }

  class KiHjemCard extends HTMLElement {
    static getConfigElement() { return document.createElement('ki-hjem-editor'); }
    static getStubConfig() { return {}; }
    setConfig(config) { this._config = config; this._sig = null; if (!this._root) { this._root = document.createElement('div'); this.appendChild(this._root); } }
    set hass(hass) {
      this._hass = hass;
      const ovs = allOversikt(hass).map((st) => st.entity_id + ':' + (st.attributes.etasje_id || '') + ':' + (st.attributes.rom || '')).join(',');
      const sig = JSON.stringify(this._config) + '|' + ovs;
      if (sig !== this._sig) { this._sig = sig; this._rebuild(); return; }
      if (this._card) this._card.hass = hass;
    }
    async _rebuild() {
      try {
        const helpers = await window.loadCardHelpers();
        const el = await helpers.createCardElement(generate(this._hass, this._config));
        el.hass = this._hass;
        this._root.innerHTML = ''; this._root.appendChild(el); this._card = el;
        injectTabsStyle(el);
        injectSwipeStyle(this._root);
      } catch (err) {
        this._root.innerHTML = '<div style="padding:16px;border-radius:24px;background:var(--gray200);color:var(--gray1000);font-size:14px">KI Hjem: ' + err.message + '</div>';
      }
    }
    getCardSize() { return this._card && this._card.getCardSize ? this._card.getCardSize() : 8; }
  }

  if (!customElements.get('ki-hjem-editor')) customElements.define('ki-hjem-editor', KiHjemEditor);
  if (!customElements.get('ki-hjem-card')) customElements.define('ki-hjem-card', KiHjemCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'ki-hjem-card', name: 'KI Hjem', description: 'Hele fane-blokken på forsiden (Hjem / etasjer / Aktuelt) bygget fra KI Rom', preview: false });
})();

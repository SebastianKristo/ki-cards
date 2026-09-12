/* ============================================================================
 * ki-hjem-card  v1.5.0  –  hele simple-tabs-blokken på forsiden, auto fra KI Rom
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
 *  etasje_innstillinger: { <etasje_id>: { vis: false, rekkefolge: 2, navn: '1. etg',
 *                            flytt_til: ute } }   # hele etasjen legges i en annen fane
 *  rom: { garasje: { etasje: ute } }              # ett rom flyttes til en annen etasjefane
 *  aktuelt: { tv: media_player.stue_tv, stovsuger: vacuum.x, vaskemaskin: sensor.x, oppvaskmaskin: sensor.x,
 *             ekstra: [...],                     # ferdige kort som alltid vises
 *             sesong: [ { fra: '11-01', til: '03-01', kind: navigate, ikon: mdi:pine-tree,
 *                         main_text: Jul, path: '#jul' } ] }   # vises bare i perioden
 *  batterier: true              # eller { terskel: 30, monster: 'sensor.*_battery_plus' }
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
    const ids = (window.KI && window.KI.romOversiktIds) ? window.KI.romOversiktIds(hass)
      : Object.keys(hass.states).filter((id) => id.startsWith('sensor.') && id.endsWith('_oversikt'));
    return ids.map((id) => hass.states[id])
      .filter((st) => st && st.attributes.integrasjon === 'ki_rom' && st.attributes.area_id !== 'totalt')
      .sort((a, b) => (a.attributes.rom || '').localeCompare(b.attributes.rom || '', 'nb'));
  }

  let swipeSeq = 0;
  let curHass = null;
  // ---- et element i en liste -> kortkonfig
  function item(it, romCfg, gap, inSwipe = false) {
    if (!it) return null;
    if (it.swipe) {
      const sw = it.swipe;
      const cards = (sw.cards || []).map((c) => item(c, romCfg, gap, true)).filter(Boolean);
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
      const cfg = { type: 'custom:ki-rom-tile-card', ...base, ...it };
      if (typeof cfg.navn === 'string') cfg.navn = cfg.navn.replace(/\\n|\n/g, '<br>');
      // spesialfliser (kalender, lås, alarm …) legges rett inn som button-card-konfig: css-swipe-card
      // mister hele swipen hvis kalender-flisen kommer via wrapperen
      const KI = window.KI || {};
      if ((it.kind || 'rom') !== 'rom' && KI.romTileConfig && curHass) {
        try { const raw = KI.romTileConfig(curHass, cfg); if (raw) return raw; } catch (e) { /* fall tilbake til wrapper */ }
      }
      return cfg;
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

  /* Hvilken etasjefane rommet skal ligge i: rom-innstillingen først, så en hel
     etasje som er flyttet, ellers etasjen fra Home Assistant. */
  function etasjeFor(a, cfg) {
    const rc = (cfg.rom || {})[a.area_id] || {};
    if (rc.etasje) return String(rc.etasje);
    const fc = cfg.etasje_innstillinger || {};
    const egen = a.etasje_id || '__uten';
    const flyttet = (fc[egen] || {}).flytt_til;
    return flyttet ? String(flyttet) : egen;
  }

  // ---- auto: én fane per etasje
  function autoFloorTabs(hass, cfg) {
    const floors = new Map();
    const alle = rooms(hass, cfg);
    /* navnene på etasjene vi kjenner, slik at en flyttet etasje får riktig fanetittel */
    const navnFor = new Map();
    alle.forEach((a) => { if (a.etasje_id) navnFor.set(a.etasje_id, { navn: a.etasje, niva: a.etasje_niva ?? 999 }); });
    alle.forEach((a) => {
      const key = etasjeFor(a, cfg);
      const kjent = navnFor.get(key);
      if (!floors.has(key)) floors.set(key, {
        navn: (kjent && kjent.navn) || a.etasje || cfg.uten_etasje_navn || 'Rom',
        niva: (kjent && kjent.niva) ?? (a.etasje_niva ?? 999), rom: [],
      });
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

  // ---- Aktuelt-fanen: TV, støvsuger (bare når den vasker), vaskemaskin/oppvaskmaskin (bare når de går)
  const VACC = '@keyframes vacc {\n    0% { transform: rotate(0deg) translate(0); }\n    20% { transform: rotate(-5deg) translate(-3px, 3px); }\n    40% { transform: rotate(-12deg) translate(-3px, -3px); }\n    60% { transform: translate(3px, 3px); }\n    80% { transform: rotate(12deg) translate(3px, -3px); }\n    100% { transform: rotate(0deg) translate(0); }\n}\n';
  /* «fra» og «til» er MM-DD (eller YYYY-MM-DD). Perioden kan gå over nyttår:
     11-01 til 03-01 betyr fra 1. november til 1. mars. */
  function iPerioden(fra, til, nå = new Date()) {
    const tall = (x) => {
      const d = String(x || '').match(/(\d{1,2})[-./](\d{1,2})$/);
      return d ? Number(d[1]) * 100 + Number(d[2]) : null;
    };
    const f = tall(fra), t = tall(til);
    const i_dag = (nå.getMonth() + 1) * 100 + nå.getDate();
    if (f === null && t === null) return true;
    if (f === null) return i_dag <= t;
    if (t === null) return i_dag >= f;
    return f <= t ? (i_dag >= f && i_dag <= t) : (i_dag >= f || i_dag <= t);
  }

  function aktueltTab(cfg) {
    const a = (typeof cfg.aktuelt === 'object' && cfg.aktuelt) || {};
    const cards = [];
    if (a.tv) cards.push({
      type: 'custom:button-card', template: 'universal_sensor', entity: a.tv,
      tap_action: { action: 'navigate', navigation_path: a.tv_path || '?tab=tv#media' },
      variables: {
        sub_text: a.tv_navn || 'TV',
        main_text: '[[[ const a = entity.attributes; const appMap = ' + JSON.stringify(a.app_navn || { 'NRK TV': 'NRK', 'TV 2 Play': 'TV 2', Telia: 'Telia Play', 'HBO Max': 'HBO', 'Apple TV': 'Apple TV+' }) + '; if (a.app_name) return appMap[a.app_name] || a.app_name; return a.source || "TV"; ]]]',
        icon: 'mdi:television-classic', background_color: 'var(--gray200)', text_color: 'var(--gray1000)',
      },
    });
    if (a.stovsuger) cards.push({
      type: 'conditional', conditions: [{ condition: 'state', entity: a.stovsuger, state: 'cleaning' }],
      card: {
        type: 'custom:button-card', template: 'universal_sensor', entity: a.stovsuger,
        tap_action: { action: 'navigate', navigation_path: a.stovsuger_path || '#rolf' },
        extra_styles: VACC,
        state: [{ value: 'cleaning', styles: { icon: [{ animation: 'vacc 2s ease 0s infinite normal forwards' }] } }],
        variables: { sub_text: a.stovsuger_navn || 'Rolf', main_text: 'Vasker', icon: 'mdi:robot-vacuum', background_color: 'var(--gray200)', text_color: 'var(--gray1000)' },
      },
    });
    const maskin = (ent, navn, icon, path, template) => ({
      type: 'conditional', conditions: [{ condition: 'state', entity: ent, state: 'on' }],
      card: {
        type: 'custom:button-card', template, entity: ent,
        tap_action: { action: 'navigate', navigation_path: path },
        variables: { sub_text: navn, main_text: '[[[ return entity.state ]]]', icon, background_color: 'var(--gray200)', text_color: 'var(--gray1000)', show_bar: true, bar_value: '[[[ return entity.state ]]]', bar_color: 'var(--gray1000)' },
      },
    });
    if (a.vaskemaskin) cards.push(maskin(a.vaskemaskin, 'Vaskemaskin', 'mdi:washing-machine', a.vaskemaskin_path || '#bad_nede', 'universal_sensor'));
    if (a.oppvaskmaskin) cards.push(maskin(a.oppvaskmaskin, 'Oppvaskmaskin', 'mdi:dishwasher', a.oppvaskmaskin_path || '#kjokken', 'universal_bar'));
    (a.ekstra || []).forEach((c) => cards.push(c));
    /* sesongkort: jul, vanning, brøyting … vises bare mellom to datoer */
    (a.sesong || []).forEach((x) => {
      if (!iPerioden(x.fra, x.til)) return;
      if (x.entity && x.vis_nar && curHass) {
        const st = curHass.states[x.entity];
        if (!st || st.state !== String(x.vis_nar)) return;
      }
      const kort = x.card || x.type ? (x.card || x) : item({ kind: x.kind || 'navigate', ...x }, cfg.rom || {});
      if (kort) cards.push(kort);
    });
    if (!cards.length) return null;
    return { title: a.title || 'Aktuelt', icon: '', card: { type: 'vertical-stack', cards: [{ type: 'grid', square: false, columns: 2, cards }] } };
  }

  // ---- Batterier-fanen: vises bare når noe er lavt
  function batterierTab(cfg) {
    const b = typeof cfg.batterier === 'object' && cfg.batterier ? cfg.batterier : {};
    const terskel = b.terskel ?? 30;
    const monster = b.monster || 'sensor.*_battery_plus';
    const lav = b.lav_monster || '_battery_plus_low';
    return {
      title: b.title || 'Batterier', icon: '', badge: '',
      conditions: [{ template: "{{ (states | selectattr('entity_id', 'search', '" + lav + "') | selectattr('state', 'eq', 'on') | list) | length > 0 }}" }],
      card: {
        type: 'custom:auto-entities',
        card: { type: 'grid', columns: 2, square: false }, card_param: 'cards',
        filter: { include: [{ entity_id: monster, state: '< ' + terskel, options: { type: 'custom:button-card', template: b.template || 'sensor_battery' } }], exclude: [] },
        sort: { method: 'state', numeric: true },
      },
    };
  }

  function generate(hass, cfg) {
    swipeSeq = 0;
    curHass = hass;
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
    const titles = tabs.map((t) => (t.title || '').toLowerCase());
    if (cfg.aktuelt && !titles.includes('aktuelt')) { const t = aktueltTab(cfg); if (t) tabs.push(t); }
    if (cfg.batterier && !titles.includes('batterier')) tabs.push(batterierTab(cfg));
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
    let found = 0;
    walkShadow(root, (el) => {
      if (el.localName !== 'swipe-card') return;
      const sr = el.shadowRoot;
      if (!sr) return;
      found++;
      if (!sr.querySelector('style[data-ki-hjem]')) { const st = document.createElement('style'); st.dataset.kiHjem = '1'; st.textContent = SWIPE_STYLE; sr.appendChild(st); }
    });
    if (!found && tries < 12) setTimeout(() => injectSwipeStyle(root, tries + 1), 500);
  }

  const SIZES = [{ value: 'big', label: 'Stor med klimaknapp' }, { value: 'big_plain', label: 'Stor uten klimaknapp' }, { value: 'small', label: 'Medium' }, { value: 'row', label: 'Liten (rad)' }];
  const FARGEVALG = ['var(--green)', 'var(--blue)', 'var(--blue-dark)', 'var(--yellow)', 'var(--orange)', 'var(--red)', 'var(--purple)', 'var(--pink)', 'var(--gray1000)'].map((v) => ({ value: v, label: v.replace('var(--', '').replace(')', '') }));

  class KiHjemEditor extends HTMLElement {
    setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this._render(); }
    set hass(hass) { this._hass = hass; this._render(); }

    _floors() {
      const m = new Map();
      const cfg2 = this._config || {};
      allOversikt(this._hass).forEach((st) => {
        const a = st.attributes; const k = etasjeFor(a, cfg2);
        if (!m.has(k)) m.set(k, { key: k, navn: a.etasje || 'Rom', niva: a.etasje_niva ?? 999, rom: [] });
        m.get(k).rom.push(a);
      });
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
        { name: 'h_aktuelt', type: 'constant', label: 'Aktuelt-fanen (tom = skjult)' },
        { name: 'aktuelt_tv', selector: { entity: { domain: 'media_player' } } },
        { name: 'aktuelt_stovsuger', selector: { entity: { domain: 'vacuum' } } },
        { name: 'aktuelt_vaskemaskin', selector: { entity: { domain: ['sensor', 'binary_sensor'] } } },
        { name: 'aktuelt_oppvaskmaskin', selector: { entity: { domain: ['sensor', 'binary_sensor'] } } },
        { name: 'h_batterier', type: 'constant', label: 'Batterier-fanen' },
        { name: 'batterier_vis', selector: { boolean: {} } },
        { name: 'batterier_terskel', selector: { number: { min: 1, max: 100, mode: 'box', unit_of_measurement: '%' } } },
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
          s.push({ name: 'rom_' + r + '_navn', selector: { text: {} } });
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
        aktuelt_tv: (c.aktuelt || {}).tv, aktuelt_stovsuger: (c.aktuelt || {}).stovsuger,
        aktuelt_vaskemaskin: (c.aktuelt || {}).vaskemaskin, aktuelt_oppvaskmaskin: (c.aktuelt || {}).oppvaskmaskin,
        batterier_vis: !!c.batterier, batterier_terskel: (typeof c.batterier === 'object' && c.batterier && c.batterier.terskel) || 30,
      };
      const fc = c.etasje_innstillinger || {}; const rc = c.rom || {};
      this._floors().forEach((f) => {
        d['et_' + f.key + '_vis'] = (fc[f.key] || {}).vis !== false;
        d['et_' + f.key + '_rekkefolge'] = (fc[f.key] || {}).rekkefolge;
        d['et_' + f.key + '_navn'] = (fc[f.key] || {}).navn;
        f.rom.forEach((a) => {
          const o = rc[a.area_id] || {};
          d['rom_' + a.area_id + '_vis'] = !o.skjul;
          d['rom_' + a.area_id + '_navn'] = o.navn;
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
      const ak = { ...((typeof prev.aktuelt === 'object' && prev.aktuelt) || {}) };
      delete ak.tv; delete ak.stovsuger; delete ak.vaskemaskin; delete ak.oppvaskmaskin;
      if (v.aktuelt_tv) ak.tv = v.aktuelt_tv;
      if (v.aktuelt_stovsuger) ak.stovsuger = v.aktuelt_stovsuger;
      if (v.aktuelt_vaskemaskin) ak.vaskemaskin = v.aktuelt_vaskemaskin;
      if (v.aktuelt_oppvaskmaskin) ak.oppvaskmaskin = v.aktuelt_oppvaskmaskin;
      if (Object.keys(ak).length) out.aktuelt = ak;
      if (v.batterier_vis) out.batterier = (v.batterier_terskel && Number(v.batterier_terskel) !== 30) ? { terskel: Number(v.batterier_terskel) } : true;
      const fc = {}; const rc = {};
      this._floors().forEach((f) => {
        const e = {};
        if (v['et_' + f.key + '_vis'] === false) e.vis = false;
        if (v['et_' + f.key + '_rekkefolge'] !== undefined && v['et_' + f.key + '_rekkefolge'] !== null && v['et_' + f.key + '_rekkefolge'] !== '') e.rekkefolge = Number(v['et_' + f.key + '_rekkefolge']);
        if (v['et_' + f.key + '_navn']) e.navn = v['et_' + f.key + '_navn'];
        if (Object.keys(e).length) fc[f.key] = e;
        f.rom.forEach((a) => {
          const r = a.area_id; const o = { ...((prev.rom || {})[r] || {}) };
          delete o.skjul; delete o.size; delete o.kolonne; delete o.rekkefolge; delete o.farge; delete o.path; delete o.navn;
          if (v['rom_' + r + '_vis'] === false) o.skjul = true;
          if (v['rom_' + r + '_navn']) o.navn = v['rom_' + r + '_navn'];
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

    // ---- plasserings-UI: to kolonner per etasje, flytt rom med piler
    _renderLayout() {
      if (!this._layout) {
        this._layout = document.createElement('div');
        this._layout.style.cssText = 'margin:0 0 16px 0;font-family:var(--paper-font-body1_-_font-family)';
        this._layout.addEventListener('click', (ev) => {
          const b = ev.target.closest('button[data-rom]'); if (!b) return;
          this._flytt(b.dataset.rom, b.dataset.dir, b.dataset.etasje);
        });
        this.insertBefore(this._layout, this.firstChild);
      }
      const cfg = this._config || {};
      const SIZE_TXT = { big: 'Stor', big_plain: 'Stor u/klima', small: 'Medium', row: 'Liten' };
      const chip = (t, etasje) => `<div style="display:flex;align-items:center;gap:4px;background:var(--secondary-background-color);border-radius:10px;padding:6px 8px;margin:4px 0">
          <span style="flex:1;font-size:13px"><b>${t.label}</b><br><span style="opacity:.6;font-size:11px">${SIZE_TXT[t.size] || t.size}</span></span>
          <button data-rom="${t.rom}" data-dir="opp" data-etasje="${etasje}" title="Opp">▲</button>
          <button data-rom="${t.rom}" data-dir="ned" data-etasje="${etasje}" title="Ned">▼</button>
          <button data-rom="${t.rom}" data-dir="bytt" data-etasje="${etasje}" title="Bytt kolonne">◀▶</button>
        </div>`;
      const floors = this._floors().filter((f) => ((cfg.etasje_innstillinger || {})[f.key] || {}).vis !== false);
      let html = '<div style="font-weight:500;margin-bottom:4px">Plassering av rom</div><div style="font-size:12px;opacity:.7;margin-bottom:8px">▲▼ flytter innen kolonnen, ◀▶ bytter kolonne. Størrelse endres i feltene under.</div>';
      floors.forEach((f) => {
        const rom = f.rom.filter((a) => !((cfg.rom || {})[a.area_id] || {}).skjul).sort((x, y) => ((cfg.rom || {})[x.area_id]?.rekkefolge ?? 50) - ((cfg.rom || {})[y.area_id]?.rekkefolge ?? 50) || (x.rom || '').localeCompare(y.rom || '', 'nb'));
        const kol = columnsFor(rom, cfg);
        const label = (t) => { const o = (cfg.rom || {})[t.rom] || {}; const a = f.rom.find((x) => x.area_id === t.rom) || {}; return (o.navn || a.rom || t.rom).replace(/<br>|\\n/g, ' '); };
        html += `<div style="font-size:13px;font-weight:500;margin:10px 0 4px">${((cfg.etasje_innstillinger || {})[f.key] || {}).navn || f.navn}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>${kol.venstre.map((t) => chip({ ...t, label: label(t) }, f.key)).join('') || '<div style="opacity:.5;font-size:12px">tom</div>'}</div>
            <div>${kol.hoyre.map((t) => chip({ ...t, label: label(t) }, f.key)).join('') || '<div style="opacity:.5;font-size:12px">tom</div>'}</div>
          </div>`;
      });
      this._layout.innerHTML = html;
      this._layout.querySelectorAll('button').forEach((b) => { b.style.cssText = 'border:none;background:var(--primary-color);color:var(--text-primary-color);border-radius:6px;padding:2px 5px;font-size:11px;cursor:pointer'; });
    }

    _flytt(rom, dir, etasjeKey) {
      const cfg = JSON.parse(JSON.stringify(this._config || {}));
      cfg.rom = cfg.rom || {};
      const f = this._floors().find((x) => x.key === etasjeKey); if (!f) return;
      const liste = f.rom.filter((a) => !(cfg.rom[a.area_id] || {}).skjul).sort((x, y) => (cfg.rom[x.area_id]?.rekkefolge ?? 50) - (cfg.rom[y.area_id]?.rekkefolge ?? 50) || (x.rom || '').localeCompare(y.rom || '', 'nb'));
      const kol = columnsFor(liste, cfg);
      // lås nåværende plassering eksplisitt (kolonne + rekkefølge) så flyttingen blir forutsigbar
      const cols = { venstre: kol.venstre.map((t) => t.rom), hoyre: kol.hoyre.map((t) => t.rom) };
      const side = cols.venstre.includes(rom) ? 'venstre' : 'hoyre';
      const idx = cols[side].indexOf(rom);
      if (dir === 'opp' && idx > 0) { cols[side].splice(idx, 1); cols[side].splice(idx - 1, 0, rom); }
      if (dir === 'ned' && idx < cols[side].length - 1) { cols[side].splice(idx, 1); cols[side].splice(idx + 1, 0, rom); }
      if (dir === 'bytt') { cols[side].splice(idx, 1); cols[side === 'venstre' ? 'hoyre' : 'venstre'].splice(Math.min(idx, cols[side === 'venstre' ? 'hoyre' : 'venstre'].length), 0, rom); }
      let n = 1;
      ['venstre', 'hoyre'].forEach((k) => cols[k].forEach((r) => { cfg.rom[r] = { ...(cfg.rom[r] || {}), kolonne: k, rekkefolge: n++ }; }));
      this._config = cfg;
      this._lastData = null;
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
      this._render();
    }

    _render() {
      if (!this._hass || !this._config) return;
      this._renderLayout();
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (sc) => {
          const n = sc.name;
          const m = {
            hjem_vis: 'Vis Hjem-fanen', hjem_las: 'Dørlås', hjem_garasje: 'Garasjeport', hjem_alarm: 'Alarm (entitet)', hjem_alarm_script: 'Alarm av/på-skript',
            hjem_kalender: 'Kalender-sensor', hjem_rom: 'Rom i venstre swipe', hjem_rom_hoyre: 'Rom i høyre swipe', etasjer_vis: 'Vis etasje-faner',
            aktuelt_tv: 'TV', aktuelt_stovsuger: 'Støvsuger (vises når den vasker)', aktuelt_vaskemaskin: 'Vaskemaskin (tid igjen-sensor)', aktuelt_oppvaskmaskin: 'Oppvaskmaskin (tid igjen-sensor)',
            batterier_vis: 'Vis Batterier-fanen ved lavt batteri', batterier_terskel: 'Terskel',
          };
          if (m[n]) return m[n];
          if (n.startsWith('et_')) return { vis: 'Vis etasje', rekkefolge: 'Rekkefølge', navn: 'Fanenavn' }[n.split('_').pop()] || n;
          if (n.startsWith('rom_')) return { vis: 'Vis rom', navn: 'Navn (<br> eller \\n = linjeskift)', size: 'Størrelse', kolonne: 'Plassering', rekkefolge: 'Rekkefølge', farge: 'Farge', path: 'Popup-hash' }[n.split('_').pop()] || n;
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
    setConfig(config) { this._config = config; this._cfgStr = JSON.stringify(config); this._sig = null; this._lastList = null; if (!this._root) { this._root = document.createElement('div'); this.appendChild(this._root); } }
    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      const list = allOversikt(hass);
      const same = this._lastList && list.length === this._lastList.length && list.every((st, i) => st === this._lastList[i]);
      if (same && this._card) { this._forward(hass); return; }
      this._lastList = list;
      const ovs = list.map((st) => st.entity_id + ':' + (st.attributes.etasje_id || '') + ':' + (st.attributes.rom || '')).join(',');
      /* datoen er med i signaturen slik at sesongkortene dukker opp og forsvinner ved midnatt */
      const dag = new Date().toISOString().slice(0, 10);
      const sig = this._cfgStr + '|' + ovs + '|' + dag;
      if (sig !== this._sig) { this._sig = sig; this._rebuild(); return; }
      if (this._card) this._forward(hass);
    }
    _forward(hass) {
      this._pendingHass = hass;
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; const h = this._pendingHass; this._pendingHass = null; if (h && this._card) this._card.hass = h; });
    }
    async _rebuild() {
      try {
        const helpers = await window.loadCardHelpers();
        const el = await helpers.createCardElement(generate(this._hass, this._config));
        el.hass = this._hass;
        this._root.innerHTML = ''; this._root.appendChild(el); this._card = el;
        injectTabsStyle(el);
        if (JSON.stringify(this._config).includes('plain')) injectSwipeStyle(this._root);
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

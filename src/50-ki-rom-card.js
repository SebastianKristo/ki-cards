/* ============================================================================
 * ki-rom-card  v1.14.0  –  auto-bygd rom-popup fra KI Rom-integrasjonen
 *
 *  type: custom:ki-rom-card
 *  rom: stue                      # area_id – eller liste: [stue, kjokken] – eller alle (+ ekskluder_rom: [garasje, bod])
 *  media_layout: swipe            # flere spillere: swipe (standard) | liste
 *  klima_layout: swipe            # flere klimaenheter: swipe (standard) | liste
 *  klima_ekstra:                  # ta med enheter som ikke ligger i klima-lista, f.eks. panelovner
 *    - climate.panelovn_stue
 *    - { entity: switch.panelovn_gang, effekt: sensor.panelovn_gang_power }
 *  gap: 8                         # px mellom kortene
 *  scener_ekstra: [script.stue_lys_mer_lys, scene.stue_nede_alt_av]   # i tillegg til de med rommet som område
 *  skjul: [light.kjokken_spot_1, switch.x]                             # enheter som ikke skal vises
 *  seksjoner:                     # alle true som standard
 *    header: true
 *    gardiner: true
 *    scener: true
 *    lys: true
 *    enheter: true
 *    klima: true
 *    media: true
 *    sensorer: true
 *  bunn_gap: 200          # mellomrom nederst; settes selv når noen seksjoner mangler
 *  temperatur: sensor.x           # overstyr (ellers første temp-sensor i rommet, ellers sensor.hus_temperature)
 *  reserve_temperatur / reserve_fuktighet: sensor.x   # annen reserve enn hus-sensorene
 *  fuktighet: sensor.x
 *  rom_tall: auto                 # KI Energis number.ki_rom_<rom>_temp brukes hvis den finnes
 *  teller_suffix: _teller         # input_number.<klima>_teller brukes hvis den finnes
 *  farger: [var(--active-big), var(--blue), var(--purple), var(--green)]
 *  tilpass: false                 # skjul «Tilpass rommet»-knappen nederst og tannhjulet i toppen
 *  topp: klassisk                 # gammel topp i stedet for ki-rom-hero-card
 *  topp_hoyde: 184                # høyden på toppkortet (px)
 *
 *  «Tilpass rommet» (nederst i popupen) lar hver bruker skjule/vise enheter, sortere,
 *  gi nytt navn til og skjule seksjoner og scener, legge til scener/skript og velge
 *  temperatur-/fuktsensor. Lagres per bruker i HA (KI.udSave, nøkkel ki_rom):
 *    { <rom>: { skjul: [], vis: [], temp, fukt,
 *               scener: { skjul, rekkefolge, navn: {}, ekstra: [] },
 *               fliser: { skjul, vis, rekkefolge, navn: {} } } }
 *  ki-rom-tile-card leser temp/fukt herfra, så flisa på forsiden viser samme sensor.
 *
 *  type: custom:ki-rom-popups     # lager én bubble-card pop-up per rom (#<area_id>)
 *  farger: { stue: var(--green), kjokken: var(--red) }
 *  seksjoner: {...}
 *  hopp_over: [garasje]
 *  rom: { stue: { seksjoner: { media: false } } }   # per-rom overstyring
 * ========================================================================== */
(() => {
  const T = (s) => '[[[ ' + s + ' ]]]';
  const GRAY_HDR = 'var(--gray10000)';
  const PALETTE = ['var(--active-big)', 'var(--blue)', 'var(--purple)', 'var(--green)', 'var(--orange)', 'var(--red)'];
  const DEFAULT_SECTIONS = {
    header: true, gardiner: true, scener: true, lys: true,
    enheter: true, klima: true, media: true, sensorer: true,
  };

  const objId = (e) => e.split('.')[1];

  // seksjoner: {lys:false} | ['lys','klima'] | toppnivå media: false
  function normalizeSections(config) {
    const out = { ...DEFAULT_SECTIONS };
    const sek = config.seksjoner;
    if (Array.isArray(sek)) {
      Object.keys(out).forEach((k) => { out[k] = sek.includes(k); });
    } else if (sek && typeof sek === 'object') {
      Object.keys(sek).forEach((k) => { if (k in out) out[k] = sek[k] !== false && sek[k] !== 'false' && sek[k] !== 0; });
    }
    Object.keys(out).forEach((k) => { if (config[k] === false) out[k] = false; });
    return out;
  }
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  /* Brukerens rekkefølge først, så resten i standardrekkefølge. */
  function ordered(all, rek) {
    const r = (rek || []).filter((x) => all.includes(x));
    return [...r, ...all.filter((x) => !r.includes(x))].filter((x, i, a) => a.indexOf(x) === i);
  }

  function stripRoom(name, room) {
    if (!name) return name;
    let n = name;
    const rooms = (Array.isArray(room) ? room : [room]).filter(Boolean).map((r) => r.toLowerCase());
    rooms.forEach((r) => {
      if (n.toLowerCase().startsWith(r + ' ')) n = n.slice(r.length + 1);
      if (n.toLowerCase().endsWith(' ' + r)) n = n.slice(0, -(r.length + 1));
    });
    return cap(n.trim()) || name;
  }

  function friendly(hass, e, room) {
    const st = hass.states[e];
    return stripRoom((st && st.attributes.friendly_name) || objId(e).replace(/_/g, ' '), room);
  }

  // ---------------------------------------------------------------- byggeklosser
  const headerTitle = (name, icon) => ({
    type: 'custom:button-card',
    view_layout: { 'grid-area': 'one' },
    name, icon, show_icon: true,
    styles: {
      grid: [{ 'grid-template-areas': '"i n"' }, { 'grid-template-columns': 'min-content 1fr' }],
      icon: [{ color: 'var(--gray1000)' }, { width: '22px' }, { 'padding-right': '12px' }, { 'padding-left': '12px' }],
      card: [{ background: 'none' }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }],
      name: [{ color: 'var(--gray1000)' }, { 'font-size': '16px' }, { 'font-weight': 500 }, { 'justify-self': 'start' }, { 'align-self': 'center' }],
    },
  });

  const headerCounter = (nameTpl) => ({
    type: 'custom:button-card',
    name: nameTpl,
    view_layout: { 'grid-area': 'three' },
    styles: {
      card: [{ background: 'none' }, { padding: '8px 0px' }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }],
      name: [{ color: 'var(--gray600)' }, { 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'end' }, { 'align-self': 'end' }],
    },
  });

  const expander = (titleCards, cards, cols = '150px 0px') => ({
    type: 'custom:expander-card',
    'child-margin-top': '0px',
    padding: '6px',
    'title-card-button-overlay': false,
    'title-card-clickable': true,
    'expander-card-background': 'var(--gray200)',
    'button-background': 'none',
    'expander-card-background-expanded': 'var(--gray200)',
    'header-color': GRAY_HDR,
    'child-padding': '12px',
    'title-card': {
      type: 'custom:layout-card',
      layout_type: 'custom:grid-layout',
      layout: { 'grid-template-columns': cols, 'grid-template-rows': '46px', 'grid-template-areas': '"one two three"  \n' },
      cards: titleCards,
    },
    cards,
  });

  /* Samme sensor kan ligge både på en bryter og i effekt_andre – da må den bare telles én gang. */
  const unike = (ids) => [...new Set((ids || []).filter(Boolean))];

  const sumWattTemplate = (ids) =>
    T('const ids = ' + JSON.stringify(ids) + '; const total = ids.reduce((s, e) => { const st = states[e]; if (!st) return s; const v = parseFloat(st.state); return isNaN(v) ? s : s + v; }, 0); return total.toFixed(0) + " W";');

  const activeCountTemplate = (ids, aktiv, stille, state = 'on') =>
    T('const sensors = ' + JSON.stringify(ids) + '; let active = 0; sensors.forEach(s => { if (states[s] && states[s].state === "' + state + '") active++; }); return active + " ' + aktiv + ' - " + (sensors.length - active) + " ' + stille + '";');

  const universalGrid = {
    grid: [
      { 'grid-template-areas': T('const subText = variables.sub_text == null ? "" : String(variables.sub_text).trim(); const hasSubText = subText !== ""; if (variables.size === "small") { return hasSubText ? \'"i l" "i n"\' : \'"i l"\'; } if (hasSubText) { return variables.alt_text ? \'"i i" "n n" "l alt"\' : \'"i i" "n n" "l l"\'; } return variables.alt_text ? \'"i alt" "l l"\' : \'"i i" "l l"\';') },
      { 'grid-template-columns': T('return variables.size === "small" ? "76px 1fr" : "1fr 1fr";') },
    ],
    custom_fields: { mode: [{ display: 'none' }] },
  };

  // ------------------------------------------------------------ seksjoner
  const FALLBACK_TEMP = 'sensor.hus_temperature';
  const FALLBACK_HUM = 'sensor.hus_fuktighet';

  /* Toppkortet: ki-rom-hero-card med tannhjul som åpner «Tilpass rommet».
     `topp: klassisk` gir den gamle button-card-toppen. */
  function sectionHeader(hass, ov, cfg, roomName) {
    const has = (e) => e && hass.states[e];
    const temp = cfg.temperatur || ov.temperatur[0] || (has(cfg.reserve_temperatur || FALLBACK_TEMP) ? (cfg.reserve_temperatur || FALLBACK_TEMP) : null);
    const hum = cfg.fuktighet || ov.fuktighet[0] || (has(cfg.reserve_fuktighet || FALLBACK_HUM) ? (cfg.reserve_fuktighet || FALLBACK_HUM) : null);
    const clim = ov.klima[0] && ov.klima[0].entity;
    if (cfg.topp !== 'klassisk') {
      const idOf = (x) => (typeof x === 'string' ? x : x && x.entity);
      const hero = {
        type: 'custom:ki-rom-hero-card',
        navn: roomName,
        lys: ov.lys.map(idOf).filter(Boolean),
        tannhjul: cfg.tilpass !== false,
      };
      const omr = ov.rooms[0] && ov.rooms[0].area_id;
      if (omr) hero.omrade = omr;
      if (temp) hero.temperatur = temp;
      if (hum) hero.fukt = hum;
      if (clim) hero.klima = clim;
      if (cfg.topp_hoyde) hero.hoyde = cfg.topp_hoyde;
      return hero;
    }
    const custom = {};
    if (clim) {
      custom.btn1 = {
        card: {
          type: 'custom:paper-buttons-row',
          styles: { display: 'flex', 'flex-direction': 'column', 'flex-wrap': 'wrap', 'border-radius': '30px' },
          buttons: [
            { icon: 'mdi:chevron-up', ripple: 'none', entity: clim, tap_action: { action: 'none' }, hold_action: { action: 'more-info' }, styles: { icon: { color: 'var(--gray100)' }, button: { background: 'var(--gray100)', 'border-radius': '50% 50% 0 0', width: '38px', height: '38px', 'z-index': 1 } } },
            { name: "{{ state_attr('" + clim + "', 'temperature') | round(0) }}°", ripple: 'none', entity: clim, tap_action: { action: 'none' }, hold_action: { action: 'more-info' }, styles: { name: { color: 'var(--gray100)' }, button: { background: 'var(--gray100)', 'border-radius': 0 } } },
          ],
        },
      };
    }
    if (temp) {
      custom.graph = {
        card: {
          type: 'custom:mini-graph-card',
          entities: [{ entity: temp, color: '#ffffff' }],
          line_width: 0, height: 60,
          show: { icon: false, name: false, state: false, legend: false, labels: false },
          card_mod: { style: 'ha-card {border-style: none;background:none;}\n' },
        },
      };
    }
    custom.temp = temp
      ? T('return Number(states["' + temp + '"].state).toFixed(1) + "°" + ' +
          (hum ? '"<span style=\\"font-size: 14px\\">" + Number(states["' + hum + '"].state).toFixed(1) + "%</span>"' : '""'))
      : '';
    return {
      type: 'custom:button-card',
      name: roomName,
      /* Langt trykk på toppen åpner temperatursensoren bak tallet. */
      ...(temp ? { hold_action: { action: 'more-info', entity: temp } } : {}),
      styles: {
        grid: [{ 'grid-template-areas': '"temp btn1" "n btn1"' }, { 'grid-template-columns': '1fr min-content' }, { 'grid-template-rows': '65% 1fr' }],
        card: [{ height: '160px' }, { padding: '6px' }, { 'margin-top': '12px' }],
        name: [{ 'justify-self': 'start' }, { 'align-self': 'start' }, { 'font-size': '14px' }, { 'padding-left': '20px' }],
        custom_fields: {
          graph: [{ position: 'absolute' }, { width: '100%' }, { left: 0 }, { bottom: 0 }],
          temp: [{ 'justify-self': 'start' }, { 'align-self': 'end' }, { 'font-size': '2.6em' }, { 'font-weight': 300 }, { 'padding-left': '20px' }],
        },
      },
      custom_fields: custom,
    };
  }

  const coverSlider = (e, area) => ({
    type: 'custom:my-slider-v2', view_layout: { 'grid-area': area }, entity: e,
    mode: 'position', allowTapping: false, allowSliding: true, vertical: false, flipped: false,
    styles: {
      container: [{ overflow: 'visible' }, { 'margin-top': '12px' }],
      card: [{ background: 'var(--gray100)' }, { 'border-radius': '4px' }, { height: '8px' }],
      progress: [{ background: 'var(--active-big)' }, { 'border-radius': '4px' }],
      thumb: [{ width: '18px' }, { height: '18px' }, { top: '-5px' }, { 'margin-right': '-4px' }, { 'border-radius': '50%' }, { background: 'var(--gray1000)' }],
      track: [{ background: 'none' }],
    },
  });
  const coverPct = (e, size) => ({
    type: 'custom:button-card', view_layout: { 'grid-area': 'three' }, entity: e,
    name: T('return 100-Math.floor(entity.attributes.current_position) + "%"'), show_icon: false,
    hold_action: { action: 'more-info' },
    styles: { card: [{ background: 'none' }, { padding: '8px 0px' }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': size }, { 'font-weight': 500 }, { 'justify-self': 'end' }] },
  });
  const coverLabel = (e, name, pad) => ({
    type: 'custom:button-card', view_layout: { 'grid-area': 'one' }, name, entity: e,
    tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' }, show_icon: false,
    styles: { card: [{ background: 'none' }, { padding: pad }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'start' }] },
  });
  const presetBtn = (e, label, pos, first) => ({
    type: 'custom:button-card', name: label, show_icon: false,
    tap_action: { action: 'perform-action', perform_action: 'cover.set_cover_position', target: { entity_id: e }, data: { position: pos } },
    hold_action: { action: 'more-info', entity: e },
    styles: { card: [{ padding: '8px 14px' }, ...(first ? [{ 'margin-bottom': '6px' }] : []), { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }] },
  });

  function sectionGardiner(hass, ov, roomName) {
    if (!ov.gardiner.length) return null;
    const groups = ov.gardiner.filter((e) => Array.isArray((hass.states[e] || {}).attributes?.entity_id));
    const master = groups[0] || ov.gardiner[0];
    const singles = ov.gardiner.filter((e) => e !== master);
    const masterName = friendly(hass, master, roomName);
    const labelW = Math.max(100, Math.min(140, masterName.length * 9 + 30)) + 'px';

    const rows = singles.map((e) => ({
      type: 'custom:layout-card', layout_type: 'custom:grid-layout',
      layout: { 'grid-template-columns': '90px 1fr 50px', 'grid-template-rows': '30px', 'grid-template-areas': '"one two three"  \n' },
      cards: [coverLabel(e, friendly(hass, e, roomName), '8px'), coverSlider(e, 'two'), coverPct(e, '14px')],
    }));

    return {
      type: 'custom:expander-card', 'child-margin-top': '0px', padding: '6px 0',
      'title-card-button-overlay': false, 'title-card-clickable': false,
      'expander-card-background': 'var(--gray200)', 'button-background': 'none',
      'expander-card-background-expanded': 'var(--gray200)', 'header-color': GRAY_HDR, 'child-padding': '18px 12px',
      'title-card': {
        type: 'custom:layout-card', layout_type: 'custom:grid-layout',
        layout: { 'grid-template-columns': labelW + ' 1fr 50px', 'grid-template-rows': '46px', 'grid-template-areas': '"one two three"  \n' },
        cards: [coverLabel(master, masterName, '8px 14px'), coverSlider(master, 'two'), coverPct(master, 'z4px')],
      },
      cards: [{
        type: 'grid', square: false, columns: 1,
        cards: [
          { type: 'grid', square: false, columns: 5, cards: [presetBtn(master, '0%', 100, true), presetBtn(master, '25%', 75), presetBtn(master, '50%', 50), presetBtn(master, '75%', 25), presetBtn(master, '100%', 0)] },
          ...rows,
        ],
      }],
    };
  }

  const ICON_GUESS = [
    [/mer.?lys|sterkere/i, 'mdi:lightbulb-on-outline'], [/mindre|svakere/i, 'mdi:lightbulb-outline'],
    [/film/i, 'mdi:movie-open'], [/natt|kveld/i, 'mdi:lightbulb-night-outline'],
    [/av$|lys.?av|alt.?av/i, 'mdi:lightbulb-off-outline'], [/natta|sov/i, 'mdi:sleep'],
  ];

  /* Lysscenene fra KI Lys for dette rommet – knappene ligger som button-entiteter */
  function lysScener(hass, ov) {
    const norm = (x) => String(x || '').toLowerCase().replace(/[^a-zæøå0-9]+/g, '');
    const omr = new Set((ov.rooms || []).map((r) => r.area_id).filter(Boolean));
    const navn = new Set((ov.rooms || []).map((r) => norm(r.rom)).filter(Boolean));

    /* Kandidater: enkeltrom og soner fra KI Lys som hører hjemme i dette kortet */
    const kandidater = [];
    Object.keys(hass.states).forEach((id) => {
      if (!id.startsWith('sensor.')) return;
      const a = hass.states[id].attributes || {};
      // ki_lys ble slått inn i ki_rom; entitetene beholder markøren, men vi
      // godtar begge så kortet virker uansett hvilken versjon som er installert
      if ((a.integrasjon !== 'ki_lys' && a.integrasjon !== 'ki_rom') || a.ki_type !== 'oversikt') return;
      const omrader = (a.area_ids && a.area_ids.length ? a.area_ids : [a.area_id]).filter(Boolean);
      let treff;
      if (!omr.size && !navn.size) treff = true;
      else if (omrader.length) treff = omrader.every((x) => omr.has(x));   // sonen må ligge i kortet
      else treff = a.rom && navn.has(norm(a.rom));
      if (treff) kandidater.push({ a, omrader });
    });
    if (!kandidater.length) return [];

    /* Dekker en sone nøyaktig rommene kortet viser, er det den som gjelder –
       ellers tas alle som passer inni. */
    const eksakt = kandidater.filter((k) => k.omrader.length === omr.size
      && k.omrader.every((x) => omr.has(x)) && omr.size > 0);
    const valgte = eksakt.length ? eksakt : kandidater;

    const ut = [];
    const sett = new Set();
    valgte.forEach(({ a }) => (a.scener || []).forEach((sc) => {
      if (sc && sc.entity && hass.states[sc.entity] && !sett.has(sc.entity)) {
        sett.add(sc.entity);
        ut.push({ entity: sc.entity, navn: sc.navn, ikon: sc.ikon });
      }
    }));
    return ut;
  }

  const sceneIcon = (hass, e, ikon) => {
    const st = hass.states[e] || { attributes: {} };
    const kind = e.split('.')[0];
    let icon = ikon || st.attributes.icon;
    if (!icon) {
      const hit = ICON_GUESS.find(([re]) => re.test(objId(e)));
      icon = hit ? hit[1] : (kind === 'scene' ? 'mdi:palette-outline'
        : kind === 'button' ? 'mdi:lightbulb-group' : 'mdi:script-text-outline');
    }
    return icon;
  };

  /* Alle scenene raden KAN vise – også de brukeren har skjult – i brukerens rekkefølge.
     US er brukerens valg for rommet: { skjul, rekkefolge, navn, ekstra }. */
  function sceneItems(hass, ov, roomName, ekstra, cfg, US = {}) {
    const seen = new Set();
    const items = [];
    const fraLys = (cfg && cfg.lysscener === false) ? [] : lysScener(hass, ov);
    const add = (raw, extra) => {
      const e = typeof raw === 'string' ? raw : raw && raw.entity;
      if (!e || seen.has(e) || !/^(script|scene|button)\./.test(e)) return;
      if (extra && !hass.states[e]) return;
      seen.add(e);
      const navn = raw && raw.navn;
      const def = navn || cap(friendly(hass, e, roomName).replace(/^Lys /, ''));
      items.push({ e, key: e, kind: e.split('.')[0], def, icon: sceneIcon(hass, e, raw && raw.ikon), extra: !!extra });
    };
    [...fraLys, ...ov.skript, ...ov.scener, ...(ekstra || [])].forEach((raw) => add(raw, false));
    [].concat(US.ekstra || []).forEach((e) => add(e, true));
    const skjul = new Set(US.skjul || []);
    const navn = US.navn || {};
    return ordered(items.map((x) => x.key), US.rekkefolge)
      .map((k) => items.find((x) => x.key === k))
      .map((x) => ({ ...x, name: navn[x.key] || x.def, hid: skjul.has(x.key) }));
  }

  function sectionScener(hass, ov, roomName, ekstra, cfg, US) {
    const items = sceneItems(hass, ov, roomName, ekstra, cfg, US).filter((x) => !x.hid);
    if (!items.length) return null;
    const buttons = items.map(({ e, kind, name, icon }) => ({
      /* entity gir langt trykk = mer-info. «icon_name» og ikke «icon_name_state»: med
         entitet ville tilstanden (et tidsstempel for scener) blitt vist under navnet. */
      icon, layout: 'icon_name', name, entity: e,
      hold_action: { action: 'more-info' },
      tap_action: kind === 'script'
        ? { action: 'call-service', service: e }
        : kind === 'button'
          ? { action: 'call-service', service: 'button.press', target: { entity_id: e } }
          : { action: 'call-service', service: 'scene.turn_on', target: { entity_id: e }, data: { transition: 1 } },
      styles: {
        name: { color: 'var(--gray800)' },
        button: { padding: '12px', width: '76px', height: '76px', 'flex-basis': 1, 'flex-shrink': 0, display: 'flex', 'background-color': 'var(--gray200)', 'border-radius': '24px', color: 'var(--white)' },
        icon: { '--mdc-icon-size': '26px', color: 'var(--gray800)' },
      },
    }));
    return {
      type: 'custom:paper-buttons-row',
      styles: { gap: '8px', 'justify-content': 'flex-start', overflow: 'scroll', margin: 0, 'padding-left': 0, width: '100%' },
      extra_styles: '::-webkit-scrollbar {\n  display: none;\n}\n',
      preset: 'button',
      buttons,
    };
  }

  function sectionLys(hass, ov, roomName, title) {
    if (!ov.lys.length) return null;
    const cards = ov.lys.map((e) => {
      const modes = (hass.states[e] || {}).attributes?.supported_color_modes || [];
      const onoff = !modes.length || (modes.length === 1 && modes[0] === 'onoff');
      const c = { type: 'custom:mysmart-light-control', entity: e, show_brightness: true, live_update: true };
      if (onoff) c.force_toggle_mode = true;
      return c;
    });
    return expander(
      [headerTitle(title || 'Lys', 'mdi:lamp'), headerCounter(activeCountTemplate(ov.lys, 'på', 'av'))],
      cards, '100px 0px'
    );
  }

  const switchCard = (hass, e, powerSensor, name, color) => ({
    type: 'custom:button-card', template: 'universal_action', entity: e,
    tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
    variables: {
      size: 'small', icon: null,
      sub_text: powerSensor
        ? T('if (entity.state === "on") { const w = states["' + powerSensor + '"]; const val = w && !isNaN(w.state) ? Math.round(w.state) : null; return val !== null ? "På · " + val + " W" : "På"; } if (entity.state === "off") return "Av"; return entity.state;')
        : T('if (entity.state === "on") return "På"; if (entity.state === "off") return "Av"; return entity.state;'),
      main_text: name, background_color: 'var(--gray100)',
      state_rule_1_value: 'on', state_rule_1_main_text: name,
      state_rule_1_background_color: color, state_rule_1_text_color: 'var(--black)',
    },
    styles: universalGrid,
  });

  const fanCard = (hass, e, name) => ({
    type: 'custom:button-card', template: 'sensor_small', entity: e, triggers_update: [e],
    tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' },
    variables: { label: name, icon: null, background: 'var(--gray100)', text: 'var(--gray1000)' },
    custom_fields: {
      tap: '',
      btn: {
        card: {
          type: 'custom:paper-buttons-row',
          styles: { 'justify-content': 'flex-end', gap: '4px' },
          buttons: ['decrease_speed', 'increase_speed'].map((svc, i) => ({
            layout: 'icon', icon: i ? 'mdi:plus' : 'mdi:minus', entity: e, hold_action: { action: 'more-info' },
            tap_action: { action: 'call-service', service: 'fan.' + svc, service_data: { entity_id: e } },
            styles: {
              button: { 'flex-basis': 1, 'flex-shrink': 0, 'background-color': T('return entity.state === "on" ? "rgba(0,0,0, 0.1)" : "var(--gray200)";'), height: '34px', width: '34px', 'border-radius': '50%', border: '1px solid rgba(0,0,0, 0.1)' },
              icon: { color: T('return entity.state === "on" ? "var(--black)" : "var(--gray1000)";') },
            },
          })),
        },
      },
    },
    state: [
      { value: 'on', name: T('const pct = entity.attributes.percentage; return pct ? "På · " + pct + "%" : "På";'), styles: { card: [{ background: 'var(--blue)' }], name: [{ color: 'var(--black)' }], label: [{ color: 'var(--black)' }], icon: [{ color: 'var(--black)' }], img_cell: [{ background: 'rgba(40, 40, 42, 0.1)' }] } },
      { value: 'off', name: 'Av', styles: { card: [{ background: 'var(--gray100)' }] } },
    ],
    styles: {
      grid: [{ 'grid-template-areas': '"i l btn" "i n btn"' }, { 'grid-template-columns': '76px 1fr auto' }, { 'grid-template-rows': '1fr 1fr' }],
      label: [{ 'justify-self': 'start' }, { 'align-self': 'end' }],
      name: [{ 'justify-self': 'start' }, { 'align-self': 'start' }],
      custom_fields: { btn: [{ 'justify-self': 'end' }, { 'align-self': 'center' }] },
    },
  });

  function sectionEnheter(hass, ov, roomName, palette, cfg, title) {
    const flyttet = new Set([].concat((cfg && cfg.klima_ekstra) || [])
      .map((x) => (typeof x === 'string' ? x : x && x.entity)).filter(Boolean));
    /* Viftene ligger under Klima, ikke her. En vifte er noe man styrer sammen med
       varmen, ikke en bryter på linje med stikkontakter.
       Effektsummen over regner fortsatt med viftene, siden de trekker strøm i rommet
       selv om de vises et annet sted. */
    ov = { ...ov, brytere: ov.brytere.filter((d) => !flyttet.has(d.entity)), vifter: ov.vifter.filter((d) => !flyttet.has(d.entity)) };
    if (!ov.brytere.length) return null;
    const wIds = unike(ov.brytere.map((d) => d.effekt).concat(ov.effekt_andre || []));
    const cards = ov.brytere.map((d, i) =>
      switchCard(hass, d.entity, d.effekt, friendly(hass, d.entity, roomName), palette[i % palette.length]));
    return expander(
      [headerTitle(title || 'Enheter', 'mdi:radio'), headerCounter(wIds.length ? sumWattTemplate(wIds) : '')],
      [{ square: false, type: 'grid', columns: 1, cards }]
    );
  }

  /* «Kjøkken» -> «kjokken». Samme regel som KI Energi bruker for entitetsnavnet. */
  function romSlug(navn) {
    return String(navn || '').toLowerCase()
      .replace(/ø|ö/g, 'o').replace(/æ|ä|å/g, 'a')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  /* KI Energi lager number.ki_rom_<rom>_temp per rom. Den setter alle varmekildene i
     rommet på én gang og leser tilbake det som faktisk er satt. */
  /* Fant vi ikke rommet, si fra én gang – da ser du om det er navnet som ikke stemmer,
     eller om KI Energi mangler. */
  function kiRomBom(hass, prøvd, alle) {
    if (kiRomBom._sagt) return null;
    kiRomBom._sagt = 1;
    if (alle && alle.length) {
      console.info('ki-cards: fant ingen romtemperatur for', (prøvd || []).filter(Boolean),
        '— disse finnes:', alle,
        '(match skjer på klimaentiteten i attributtet «kilder», ellers på romnavnet)');
    } else {
      console.info('ki-cards: ingen number.ki_rom_*_temp i det hele tatt. '
        + 'Krever KI Energi 2.16 eller nyere, og at sonene har et rom-felt.');
    }
    return null;
  }

  /* Finn KI Energis romtall. Navnematching er skjør — «Soverom» på flisa kan hete
     «Soverom barn» i sonen — så vi matcher først på selve klimaenheten, som romtallet
     lister i attributtet `kilder`. Navnet brukes bare som reserve. */
  function kiRomTall(hass, klimaListe, ...navn) {
    const alle = Object.keys(hass.states)
      .filter((x) => x.startsWith('number.ki_rom_') && x.endsWith('_temp'));
    const ønsket = [].concat(klimaListe || []).filter(Boolean);

    for (const id of alle) {
      const kilder = (hass.states[id].attributes || {}).kilder || [];
      const mine = [];
      for (const k of kilder) {
        const c = k && k.klima;
        for (const e of (typeof c === 'string' ? [c] : (c || []))) if (e) mine.push(e);
      }
      if (ønsket.some((e) => mine.includes(e))) return id;
    }

    for (const n of navn) {
      const id = 'number.ki_rom_' + romSlug(n) + '_temp';
      if (n && hass.states[id]) return id;
    }
    return kiRomBom(hass, navn, alle);
  }

  function climateCard(hass, e, powerSensor, hum, name, tellerSuffix, romTall) {
    const teller = 'input_number.' + objId(e) + tellerSuffix;
    const kiId = romTall && hass.states[romTall] ? romTall : null;
    const hasTeller = !kiId && !!hass.states[teller];
    const kiSteg = kiId ? (Number(hass.states[kiId].attributes.step) || 0.5) : 1;
    const active = powerSensor
      ? 'parseFloat(states["' + powerSensor + '"].state) > 10'
      : '(entity.attributes.hvac_action === "heating")';
    const colorTpl = T('return ' + active + ' ? "black" : "var(--gray1000)";');
    const bgTpl = T('return ' + active + ' ? "rgba(var(--highlight))" : "var(--gray100)";');
    const stepAction = (dir) => kiId
      ? { action: 'call-service', service: 'number.set_value', target: { entity_id: [kiId] },
          data: { value: "{{ (states('" + kiId + "') | float(21)) " + (dir > 0 ? '+' : '-') + ' ' + kiSteg + ' }}' } }
      : hasTeller
      // entity_id må ligge i target. I data ble den ignorert, og kallet feilet med
      // «must contain at least one of entity_id, device_id, area_id…».
      // increment/decrement tar heller ingen `amount`.
      ? { action: 'call-service', service: 'input_number.' + (dir > 0 ? 'increment' : 'decrement'),
          target: { entity_id: [teller] } }
      : { action: 'call-service', service: 'climate.set_temperature', data: { entity_id: e, temperature: "{{ (state_attr('" + e + "','temperature') | float(20)) " + (dir > 0 ? '+' : '-') + ' 1 }}' } };
    // Leses alltid tilbake fra kilden vi skriver til, så tallet viser det som er satt
    const valueTpl = kiId
      ? T('const v = states["' + kiId + '"]; return v && !isNaN(parseFloat(v.state)) ? Math.round(parseFloat(v.state)) + "°" : "–";')
      : hasTeller
      ? T('return Math.round(states["' + teller + '"].state) + "°";')
      : T('return Math.round(entity.attributes.temperature) + "°";');
    const btn = (icon, radius, height, border, action, nameTpl) => {
      /* entity gir langt trykk = mer-info; tap_action none så en knapp uten handling
         (tallet i midten) ikke faller tilbake på paper-buttons-rows standard toggle. */
      const b = { ripple: 'none', entity: e, tap_action: { action: 'none' }, hold_action: { action: 'more-info' }, styles: { button: { background: bgTpl, 'border-radius': radius, width: '46px', height, 'z-index': 1, 'border-width': border, 'border-style': 'solid', 'border-color': 'var(--gray400)' } } };
      if (icon) { b.icon = icon; b.name = false; b.styles.icon = { color: colorTpl }; }
      else { b.name = nameTpl; b.icon = false; b.styles.name = { color: colorTpl }; }
      if (action) b.tap_action = action;
      return b;
    };
    return {
      type: 'custom:button-card', name, entity: e,
      variables: { power_sensor: powerSensor, humidity_sensor: hum },
      show_icon: false, show_label: true,
      tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' },
      label: powerSensor ? T('var effekt = states["' + powerSensor + '"].state; return Math.round(effekt) + " W";') : T('return entity.attributes.hvac_action === "heating" ? "Varmer" : "Hviler";'),
      state: [{
        operator: 'template', value: T('return ' + active + ';'),
        styles: { card: [{ background: 'var(--active-big)' }], name: [{ color: 'var(--black)' }], label: [{ color: 'var(--black)' }], custom_fields: { temp: [{ color: 'var(--black)' }] } },
      }],
      custom_fields: {
        temp: T('var temp = entity.attributes.current_temperature; ' + (hum ? 'var hum = states["' + hum + '"].state; ' : 'var hum = null; ') +
          'return parseFloat(temp).toFixed(0) + "°" + (hum === null ? "" : "<span style=\\"font-size:14px;line-height:1.5em;font-weight:400;opacity:0.7;margin-left:2px;\\">" + parseFloat(hum).toFixed(0) + "%</span>");'),
        btn1: {
          card: {
            type: 'custom:paper-buttons-row',
            styles: { display: 'flex', 'flex-direction': 'column', 'flex-wrap': 'wrap' },
            buttons: [
              btn('mdi:chevron-up', '40px 40px 0 0', '30px', '1px 1px 0 1px', stepAction(1)),
              btn(null, 0, '52px', '0 1px 0 1px', null, valueTpl),
              btn('mdi:chevron-down', '0 0 40px 40px', '30px', '0 1px 1px 1px', stepAction(-1)),
            ],
          },
        },
      },
      styles: {
        card: [{ height: '160px' }, { padding: '4px' }, { overflow: 'visible' }, { background: 'var(--gray100)' }],
        grid: [{ 'grid-template-areas': '"n btn1" "l btn1" "temp btn1"' }, { 'grid-template-rows': 'min-content min-content 1fr' }, { 'grid-template-columns': '1fr min-content' }],
        icon: [{ width: '28px' }, { color: 'var(--black)' }],
        img_cell: [{ 'justify-self': 'end' }, { background: 'var(--green)' }, { 'border-radius': '100%' }, { 'align-self': 'start' }, { width: '60px' }, { height: '60px' }],
        name: [{ 'justify-self': 'start' }, { 'text-align': 'left' }, { 'font-size': '14px' }, { color: 'var(--gray1000)' }, { opacity: '0.7' }, { padding: '14px 0 0 20px' }],
        label: [{ 'justify-self': 'start' }, { 'text-align': 'left' }, { 'font-size': '14px' }, { color: 'var(--gray1000)' }, { opacity: '0.5' }, { padding: '0 0 0 20px' }],
        custom_fields: {
          btn1: [{ 'align-self': 'end' }, { 'justify-self': 'end' }],
          temp: [{ 'justify-self': 'start' }, { 'align-self': 'end' }, { 'font-size': '2em' }, { 'font-weight': 300 }, { color: 'var(--gray1000)' }, { 'line-height': '1.5em' }, { padding: '0 0 4px 20px' }],
        },
      },
    };
  }

  function sectionKlima(hass, ov, cfg, roomName, title) {
    /* Panelovner og andre varmekilder kan legges til med klima_ekstra – enten som
       climate-entitet eller som bryter med egen effektsensor. */
    const ekstra = [].concat(cfg.klima_ekstra || [])
      .map((x) => (typeof x === 'string' ? { entity: x } : x))
      .filter((d) => d && d.entity && hass.states[d.entity] && !(ov.skjult && ov.skjult.has(d.entity)))
      .map((d) => ({ ...d, effekt: d.effekt || finnEffekt(hass, d.entity) }));
    const enheter = [...ov.klima, ...ekstra.filter((d) => !ov.klima.some((k) => k.entity === d.entity))];
    /* Viftene hører hjemme her. De kommer sist, etter varmekildene: man ser etter
       temperaturen først, og vifta er justeringen. */
    const vifter = (ov.vifter || []).filter((d) => !enheter.some((k) => k.entity === d.entity));
    if (!enheter.length && !vifter.length) return null;
    const hum = cfg.fuktighet || ov.fuktighet[0] || (hass.states[cfg.reserve_fuktighet || FALLBACK_HUM] ? (cfg.reserve_fuktighet || FALLBACK_HUM) : null);
    const wIds = unike([...enheter, ...vifter].map((d) => d.effekt));
    const cards = enheter.map((d) => (d.entity.startsWith('climate.')
      ? climateCard(hass, d.entity, d.effekt, hum, friendly(hass, d.entity, roomName), cfg.teller_suffix,
          cfg.rom_tall === false ? null
            : (typeof cfg.rom_tall === 'string' ? cfg.rom_tall : kiRomTall(hass, [d.entity], roomName, cfg.rom)))
      : switchCard(hass, d.entity, d.effekt, friendly(hass, d.entity, roomName), 'var(--orange)')));
    let body;
    if (cards.length === 1 || cfg.klima_layout === 'liste') {
      body = [{ square: false, type: 'grid', columns: 1, cards }];
    } else {
      body = [{
        type: 'custom:css-swipe-card', cardId: 'ki_rom_klima_' + (ov.prefix || 'x') + '_' + (++klimaSwipeSeq),
        height: cfg.klima_hoyde || '186px', pagination: true,
        custom_css: { '--pagination-bullet-active-background-color': 'var(--gray400)', '--pagination-bullet-background-color': 'var(--gray100)', '--pagination-bullet-border': 'none', '--pagination-bullet-distance': '0px' },
        cards,
      }];
    }

    /* Viftene står i en egen liste under ovnene, ikke inne i sveipekortet.
       Sveipet er til for å bla mellom flere av samme slag — panelovner. En vifte er
       noe annet, og blandet inn ville den forsvunnet bak et sveip man ikke visste om.
       Er det ingen ovner, er lista alt som vises. */
    if (vifter.length) {
      /* Luft mellom ovnene og viftene. Uten den klistrer viftekortet seg til
         undersiden av ovnen, og de ser ut som ett element. Samme avstand som mellom
         mediekortene lenger nede. */
      body = (enheter.length ? body.concat([{ type: 'custom:gap-card', height: 8 }]) : [])
        .concat([{
          square: false, type: 'grid', columns: 1,
          cards: vifter.map((d) => fanCard(hass, d.entity, friendly(hass, d.entity, roomName))),
        }]);
    }

    return expander(
      [headerTitle(title || 'Klima', 'mdi:thermostat'), headerCounter(wIds.length ? sumWattTemplate(wIds) : '')],
      body
    );
  }
  let klimaSwipeSeq = 0;

  // 160 px-kort i samme stil som klima-kortene: navn, "artist – tittel", albumbilde i sirkelen,
  // kontrollrad nederst (av/på · forrige · play/pause · neste · …). Grønt når det spiller.
  const mediaCard = (e, name) => {
    const ctlBtn = (icon, service, size, big) => ({
      layout: 'icon', icon, ripple: 'none', entity: e, hold_action: { action: 'more-info' },
      tap_action: { action: 'call-service', service, target: { entity_id: e } },
      styles: {
        button: {
          width: size, height: size, 'flex-shrink': 0, 'border-radius': '50%',
          background: T('return entity.state === "playing" ? "rgba(0,0,0,0.12)" : "' + (big ? 'var(--gray200)' : 'transparent') + '";'),
        },
        icon: { '--mdc-icon-size': big ? '26px' : '20px', color: T('return entity.state === "playing" ? "var(--black)" : "var(--gray1000)";') },
      },
    });
    return {
      type: 'custom:button-card', entity: e, name, show_icon: true, show_label: true, show_entity_picture: false,
      icon: T('return entity.attributes.device_class === "tv" ? "mdi:television" : "mdi:speaker";'),
      tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' },
      label: T('const a = entity.attributes; const st = entity.state; if (st === "playing" || st === "paused") { const t = a.media_title || a.media_channel || a.app_name || a.source || ""; const ar = a.media_artist || a.media_series_title || ""; const txt = ar && t ? ar + " – " + t : (t || "Spiller"); return (st === "paused" ? "Pause · " : "") + txt; } if (st === "off") return "Av"; if (st === "standby") return "Standby"; if (st === "unavailable") return "Utilgjengelig"; return a.app_name || a.source || "Klar";'),
      state: [
        { value: 'playing', styles: { card: [{ background: 'var(--active-big)' }], name: [{ color: 'var(--black)' }], label: [{ color: 'var(--black)' }], icon: [{ color: 'var(--black)' }], img_cell: [{ background: 'rgba(0, 0, 0, 0.12)' }] } },
        { value: 'paused', styles: { card: [{ background: 'var(--gray300)' }] } },
      ],
      custom_fields: {
        art: T('const p = entity.attributes.entity_picture; return (p && (entity.state === "playing" || entity.state === "paused")) ? "<img src=\\"" + p + "\\" style=\\"width:60px;height:60px;border-radius:50%;object-fit:cover;display:block\\">" : "";'),
        ctl: {
          card: {
            type: 'custom:paper-buttons-row',
            styles: { 'justify-content': 'space-between', 'align-items': 'center', width: '100%', gap: '4px' },
            buttons: [
              ctlBtn('mdi:power', 'media_player.toggle', '36px'),
              ctlBtn('mdi:skip-previous', 'media_player.media_previous_track', '36px'),
              { ...ctlBtn("{% if is_state('" + e + "', 'playing') %}mdi:pause{% else %}mdi:play{% endif %}", 'media_player.media_play_pause', '52px', true) },
              ctlBtn('mdi:skip-next', 'media_player.media_next_track', '36px'),
              { layout: 'icon', icon: 'mdi:dots-horizontal', ripple: 'none', entity: e, tap_action: { action: 'more-info' }, styles: { button: { width: '36px', height: '36px', 'flex-shrink': 0, 'border-radius': '50%', background: 'transparent' }, icon: { '--mdc-icon-size': '20px', color: T('return entity.state === "playing" ? "var(--black)" : "var(--gray1000)";') } } },
            ],
          },
        },
      },
      styles: {
        card: [{ height: '160px' }, { padding: '4px' }, { overflow: 'visible' }, { background: 'var(--gray100)' }],
        grid: [{ 'grid-template-areas': '"n i" "l i" "ctl ctl"' }, { 'grid-template-rows': 'min-content 1fr min-content' }, { 'grid-template-columns': '1fr min-content' }],
        icon: [{ width: '28px' }, { color: 'var(--gray1000)' }],
        img_cell: [{ 'justify-self': 'end' }, { 'align-self': 'start' }, { background: 'rgba(250, 251, 252, 0.1)' }, { 'border-radius': '100%' }, { width: '60px' }, { height: '60px' }, { position: 'relative' }],
        name: [{ 'justify-self': 'start' }, { 'text-align': 'left' }, { 'font-size': '14px' }, { color: 'var(--gray1000)' }, { opacity: '0.7' }, { padding: '14px 0 0 20px' }],
        label: [{ 'justify-self': 'start' }, { 'align-self': 'start' }, { 'text-align': 'left' }, { 'font-size': '17px' }, { 'font-weight': 500 }, { color: 'var(--gray1000)' }, { 'line-height': '1.3em' }, { padding: '4px 12px 0 20px' }, { overflow: 'hidden' }, { 'text-overflow': 'ellipsis' }, { display: '-webkit-box' }, { '-webkit-line-clamp': 2 }, { '-webkit-box-orient': 'vertical' }, { 'max-width': '100%' }],
        custom_fields: {
          art: [{ position: 'absolute' }, { top: '4px' }, { right: '4px' }, { 'pointer-events': 'none' }],
          ctl: [{ 'justify-self': 'stretch' }, { 'align-self': 'end' }, { padding: '0 8px 6px 8px' }],
        },
      },
    };
  };

  const volumeRow = (e) => ({
    type: 'custom:layout-card', layout_type: 'custom:grid-layout',
    layout: { 'grid-template-columns': '90px 1fr 50px', 'grid-template-areas': '"one two three"\n' },
    cards: [
      { type: 'custom:button-card', view_layout: { 'grid-area': 'one' }, name: 'Volum', show_icon: false, hold_action: { action: 'more-info', entity: e }, styles: { card: [{ background: 'none' }, { padding: '6px 12px' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'start' }] } },
      { type: 'custom:my-slider-v2', view_layout: { 'grid-area': 'two' }, entity: e, mode: 'volume', allowTapping: true, allowSliding: true, styles: { container: [{ overflow: 'visible' }, { 'margin-top': '10px' }], card: [{ background: 'var(--gray100)' }, { 'border-radius': '4px' }, { height: '8px' }], progress: [{ background: 'var(--active-big)' }, { 'border-radius': '4px' }], thumb: [{ width: '18px' }, { height: '18px' }, { top: '-5px' }, { 'margin-right': '-4px' }, { 'border-radius': '50%' }, { background: 'var(--gray1000)' }], track: [{ background: 'none' }] } },
      { type: 'custom:button-card', view_layout: { 'grid-area': 'three' }, entity: e, name: T('return Math.floor((entity.attributes.volume_level || 0) * 100) + "%"'), show_icon: false, hold_action: { action: 'more-info' }, styles: { card: [{ background: 'none' }, { padding: '6px 0' }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'end' }] } },
    ],
  });

  let mediaSwipeSeq = 0;
  function sectionMedia(hass, ov, roomName, cfg = {}, title) {
    if (!ov.media.length) return null;
    const page = (e) => ({ type: 'vertical-stack', cards: [mediaCard(e, friendly(hass, e, roomName)), volumeRow(e)] });
    let cards;
    if (ov.media.length === 1 || cfg.media_layout === 'liste') {
      cards = [];
      ov.media.forEach((e, i) => { if (i) cards.push({ type: 'custom:gap-card', height: 14 }); cards.push(...page(e).cards); });
    } else {
      // flere spillere: én side per spiller i en swipe (prikker under), ryddigere enn alt under hverandre
      cards = [{
        type: 'custom:css-swipe-card', cardId: 'ki_rom_media_' + (ov.prefix || 'x') + '_' + (++mediaSwipeSeq),
        height: cfg.media_hoyde || '224px', pagination: true,
        custom_css: { '--pagination-bullet-active-background-color': 'var(--gray400)', '--pagination-bullet-background-color': 'var(--gray100)', '--pagination-bullet-border': 'none', '--pagination-bullet-distance': '0px' },
        cards: ov.media.map(page),
      }];
    }
    return expander(
      [headerTitle(title || 'Media', 'mdi:speaker'), headerCounter(activeCountTemplate(ov.media, 'spiller', 'av', 'playing'))],
      cards
    );
  }

  const SENSOR_STYLE = {
    door: ['Åpen', 'Lukket', 'var(--green)'], window: ['Åpen', 'Lukket', 'var(--green)'],
    opening: ['Åpen', 'Lukket', 'var(--green)'], garage_door: ['Åpen', 'Lukket', 'var(--green)'],
    motion: ['Okkupert', 'Stille', 'var(--purple)'], occupancy: ['Okkupert', 'Stille', 'var(--purple)'],
    presence: ['Okkupert', 'Stille', 'var(--purple)'], moving: ['Bevegelse', 'Stille', 'var(--blue)'],
    vibration: ['Vibrerer', 'Stille', 'var(--blue)'], sound: ['Lyd', 'Stille', 'var(--blue)'],
  };

  const binarySensorCard = (e, name, klasse) => {
    const [on, off, color] = SENSOR_STYLE[klasse] || ['Aktiv', 'Stille', 'var(--blue)'];
    return {
      type: 'custom:button-card', template: 'universal_action', entity: e,
      tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' },
      variables: {
        size: 'small', icon: null,
        sub_text: T('if (entity.state === "on") return "' + on + '"; if (entity.state === "off") return "' + off + '"; return entity.state;'),
        main_text: name, background_color: 'var(--gray100)',
        state_rule_1_value: 'on', state_rule_1_main_text: name,
        state_rule_1_background_color: color, state_rule_1_text_color: 'var(--black)',
      },
      styles: universalGrid,
    };
  };

  const luxCard = (e, name) => ({
    type: 'custom:button-card', template: 'universal_action', entity: e,
    tap_action: { action: 'more-info' }, hold_action: { action: 'more-info' },
    variables: {
      size: 'small', icon: null,
      sub_text: T('return Number(entity.state).toFixed(1) + " lx";'),
      main_text: name, background_color: 'var(--gray100)',
      state_rule_1_condition: true, state_rule_1_main_text: name,
      state_rule_1_background_color: 'var(--orange)', state_rule_1_text_color: 'var(--black)',
    },
    styles: universalGrid,
  });

  function sectionSensorer(hass, ov, roomName, title) {
    if (!ov.sensorer.length && !ov.lysniva.length) return null;
    const ids = ov.sensorer.map((s) => s.entity);
    const cards = [
      ...ov.sensorer.map((s) => binarySensorCard(s.entity, friendly(hass, s.entity, roomName), s.klasse)),
      ...ov.lysniva.map((e) => luxCard(e, ov.lysniva.length > 1 ? friendly(hass, e, roomName) : 'Lys')),
    ];
    return expander(
      [headerTitle(title || 'Sensorer', 'mdi:motion-sensor'), headerCounter(ids.length ? activeCountTemplate(ids, 'aktiv', 'stille') : '')],
      [{ square: false, type: 'grid', columns: 1, cards }], '130px 0px'
    );
  }

  // ------------------------------------------------------------ generator
  const LIST_KEYS = ['lys', 'media', 'brytere', 'vifter', 'klima', 'gardiner', 'sensorer', 'skript', 'scener', 'temperatur', 'fuktighet', 'lysniva', 'effekt', 'effekt_andre'];

  /* Enhetsregisteret: hvilken fysisk enhet hver entitet hører til.
     Hentes én gang, og kortene tegnes på nytt når det er klart. */
  let REG = null, REG_HENTES = false;
  const REG_VENTER = new Set();
  function hentRegister(hass, kort) {
    if (kort) REG_VENTER.add(kort);
    if (REG || REG_HENTES || !hass || !hass.callWS) return;
    REG_HENTES = true;
    hass.callWS({ type: 'config/entity_registry/list' }).then((liste) => {
      REG = {};
      (liste || []).forEach((e) => { if (e.entity_id) REG[e.entity_id] = e.device_id || null; });
      REG_HENTES = false;
      REG_VENTER.forEach((k) => { try { k._dirty = true; if (k._hass) { k.hass = k._hass; } } catch (feil) { /* kortet er borte */ } });
      REG_VENTER.clear();
    }).catch(() => { REG = {}; REG_HENTES = false; });
  }

  /* Er sensoren en brukbar effektsensor – watt, ikke kilowattimer? */
  function erEffekt(st) {
    if (!st) return false;
    const enhet = String(st.attributes.unit_of_measurement || '');
    if (/wh$/i.test(enhet)) return false;                       // energi, ikke effekt
    if (String(st.attributes.device_class || '') === 'power') return true;
    return /^w$|^kw$|watt/i.test(enhet);
  }

  /* Finner effektsensoren til en bryter.
     1) samme fysiske enhet i enhetsregisteret, 2) kjente navnemønstre,
     3) sensor som starter med samme slug og måler watt. */
  function finnEffekt(hass, entity) {
    const slug = String(entity).split('.')[1];
    if (!slug) return null;

    const enhetId = REG && REG[entity];
    if (enhetId) {
      const paaEnheten = Object.keys(REG).filter((id) => REG[id] === enhetId && id.startsWith('sensor.'));
      /* foretrekk den som ser ut som en «nå»-måling framfor døgn-/totaltall */
      const sortert = paaEnheten.sort((a, b) => {
        const poeng = (x) => (/(_power|_effekt|_watt|_current_power)/i.test(x) ? 0 : 1)
          + (/(daily|dag|total|energy|energi|maned|month)/i.test(x) ? 2 : 0);
        return poeng(a) - poeng(b);
      });
      for (const id of sortert) if (erEffekt(hass.states[id])) return id;
    }

    const kandidater = [
      `sensor.${slug}_power`, `sensor.${slug}_effekt`, `sensor.${slug}_current_power_w`,
      `sensor.${slug}_power_w`, `sensor.${slug}_watt`, `sensor.${slug}_forbruk_na`,
      `sensor.${slug}_strom`, `sensor.${slug}_stromforbruk`,
    ];
    for (const id of kandidater) if (erEffekt(hass.states[id])) return id;

    /* siste utvei: en sensor med samme slug foran seg som måler watt */
    const treff = Object.keys(hass.states)
      .filter((id) => id.startsWith(`sensor.${slug}_`) && erEffekt(hass.states[id]))
      .sort((a, b) => a.length - b.length);
    return treff[0] || null;
  }

  /* Parer bryter og effektsensor: eksplisitt `effekt_par` i kortet først,
     så det integrasjonen har paret, til slutt navnegjetting. */
  function parEffekt(hass, ov, cfg) {
    const par = cfg.effekt_par || {};
    const brukt = new Set();
    [...(ov.brytere || []), ...(ov.vifter || [])].forEach((d) => {
      if (!d || typeof d !== 'object') return;
      if (par[d.entity] !== undefined) { d.effekt = par[d.entity] === false ? null : par[d.entity]; }
      else {
        const st = d.effekt ? hass.states[d.effekt] : null;
        const brukbar = st && String(st.attributes.device_class || '') === 'power';
        if (!brukbar) { const funnet = finnEffekt(hass, d.entity); if (funnet) d.effekt = funnet; }
      }
      /* samme sensor skal ikke havne på to enheter */
      if (d.effekt && brukt.has(d.effekt)) d.effekt = null;
      if (d.effekt) brukt.add(d.effekt);
    });
    /* det som nå er paret, fjernes fra «andre» så totalen ikke dobles */
    if (Array.isArray(ov.effekt_andre)) ov.effekt_andre = ov.effekt_andre.filter((id) => !brukt.has(id));
    if (Array.isArray(ov.effekt)) ov.effekt = ov.effekt.filter((id) => !brukt.has(typeof id === 'string' ? id : id.entity));
  }

  function mergeOversikt(ovStates, skjul) {
    const hide = new Set([].concat(skjul || []));
    const ov = {};
    LIST_KEYS.forEach((k) => { ov[k] = []; });
    ov.rooms = [];
    ovStates.forEach((st) => {
      const a = st.attributes;
      LIST_KEYS.forEach((k) => { (a[k] || []).forEach((x) => { const id = typeof x === 'string' ? x : x.entity; if (hide.has(id)) return; if (!ov[k].some((y) => (typeof y === 'string' ? y : y.entity) === id)) ov[k].push(x); }); });
      ov.rooms.push({ ...a, prefix: st.entity_id.replace(/^sensor\./, '').replace(/_oversikt$/, '') });
    });
    ov.prefix = ov.rooms[0].prefix;
    ov.skjult = hide;
    ov.rom = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' '))).join(' + ');
    return ov;
  }

  /* ---------------------------------------------------------- brukervalg («Tilpass rommet»)
   * Lagres per bruker i HA (KI.udSave) under nøkkelen ki_rom:
   *   { <rom>: { skjul: [entity], vis: [entity], temp: sensor, fukt: sensor,
   *             scener: { skjul, rekkefolge, navn: {id: tekst}, ekstra: [scene/script] },
   *             fliser: { skjul, vis, rekkefolge, navn: {seksjon: tekst} } } }
   * <rom> er area_id (flere rom: «stue+kjokken»). ki-rom-tile-card leser temp/fukt herfra. */
  const UD_KEY = 'ki_rom';
  const DEFAULT_ORDER = ['header', 'gardiner', 'scener', 'lys', 'enheter', 'klima', 'media', 'sensorer'];
  const romKey = (cfg) => [].concat(cfg.rom || cfg.entity || []).filter(Boolean).join('+');
  function udAll(hass) {
    const K = window.KI || {};
    const v = K.ud && hass ? K.ud(hass, UD_KEY) : null;
    return v && typeof v === 'object' ? v : {};
  }
  function userRom(hass, cfg) {
    const r = udAll(hass)[romKey(cfg)];
    return r && typeof r === 'object' ? r : {};
  }
  /* skjul fra kortets config + brukerens skjul, minus det brukeren har valgt å vise */
  function effSkjul(cfg, U) {
    const vis = new Set(U.vis || []);
    return [...new Set([].concat(cfg.skjul || [], U.skjul || []))].filter((x) => !vis.has(x));
  }
  /* Brukerens temperatur-/fuktsensor går foran alt annet – så lenge den finnes. */
  function medSensorvalg(hass, cfg, U) {
    const ut = { ...cfg };
    if (U.temp && hass.states[U.temp]) ut.temperatur = U.temp;
    if (U.fukt && hass.states[U.fukt]) ut.fuktighet = U.fukt;
    return ut;
  }
  /* Seksjonene i brukerens rekkefølge, med skjult-flagg og eget navn. */
  function seksjonModell(cfg, U) {
    const UF = U.fliser || {};
    const skjul = new Set(UF.skjul || []);
    const vis = new Set(UF.vis || []);
    const navn = UF.navn || {};
    const def = (cfg.rekkefolge || DEFAULT_ORDER).filter((k) => k in DEFAULT_SECTIONS);
    return ordered(def, UF.rekkefolge).map((k) => ({
      key: k, navn: navn[k] || '',
      hid: skjul.has(k) || (!cfg.seksjoner[k] && !vis.has(k)),
    }));
  }

  function generate(hass, ovStates, cfg0, U = {}) {
    const cfg = medSensorvalg(hass, cfg0, U);
    const ov = mergeOversikt(Array.isArray(ovStates) ? ovStates : [ovStates], effSkjul(cfg, U));
    parEffekt(hass, ov, cfg);
    const roomNames = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' ')));
    const roomName = roomNames.length === 1 ? (cfg.navn || roomNames[0]) : roomNames;
    const sek = seksjonModell(cfg, U);
    const tittel = {};
    sek.forEach((x) => { tittel[x.key] = x.navn || undefined; });
    const builders = {
      // én header uansett antall rom: første temperatur-/fuktsensor og første klima (eller overstyring i cfg)
      header: () => sectionHeader(hass, ov, cfg, tittel.header || cfg.navn || (Array.isArray(roomName) ? roomName.join(' + ') : roomName)),
      gardiner: () => sectionGardiner(hass, ov, roomName),
      scener: () => sectionScener(hass, ov, roomName, cfg.scener_ekstra, cfg, U.scener || {}),
      lys: () => sectionLys(hass, ov, roomName, tittel.lys),
      enheter: () => sectionEnheter(hass, ov, roomName, cfg.farger || PALETTE, cfg, tittel.enheter),
      klima: () => sectionKlima(hass, ov, cfg, roomName, tittel.klima),
      media: () => sectionMedia(hass, ov, roomName, cfg, tittel.media),
      sensorer: () => sectionSensorer(hass, ov, roomName, tittel.sensorer),
    };
    const s = {};
    const order = sek.map((x) => { s[x.key] = !x.hid; return x.key; });
    const cards = [];
    /* Vi teller seksjonene som faktisk GA et kort, ikke de som er slått på. Et rom kan
       ha «Vis media» på uten å ha en eneste høyttaler, og da er kortet like kort som om
       seksjonen var av — det er høyden som avgjør, ikke innstillingen. */
    let bygd = 0;
    order.forEach((k) => {
      if (!s[k] || !builders[k]) return;
      const c = builders[k]();
      if (c) { cards.push(c); bygd++; }
    });

    /* Er ikke alle seksjonene med, blir kortet kort, og i en popup står det da og
       flyter midt på skjermen. Et høyt mellomrom nederst skyver innholdet opp til
       toppen, der det hører hjemme.
       `bunn_gap` overstyrer høyden, `bunn_gap: 0` slår det av. */
    const alle = Object.keys(DEFAULT_SECTIONS).length;
    const bunn = cfg.bunn_gap !== undefined ? Number(cfg.bunn_gap)
      : (bygd < alle ? 200 : 0);
    cards.push(bunn > 0 ? { type: 'custom:gap-card', height: bunn }
                        : { type: 'custom:gap-card' });
    return cards;
  }

  // ------------------------------------------------------------ modell for «Tilpass rommet»
  const SEK_INFO = {
    header: ['Topp', 'mdi:thermometer'], gardiner: ['Gardiner', 'mdi:curtains'],
    scener: ['Scener', 'mdi:palette-outline'], lys: ['Lys', 'mdi:lamp'], enheter: ['Enheter', 'mdi:radio'],
    klima: ['Klima', 'mdi:thermostat'], media: ['Media', 'mdi:speaker'], sensorer: ['Sensorer', 'mdi:motion-sensor'],
  };
  /* Seksjoner uten overskrift i popupen kan ikke få nytt navn. */
  const KAN_NAVN = new Set(['header', 'lys', 'enheter', 'klima', 'media', 'sensorer']);
  const KLASSE_IKON = {
    door: 'mdi:door', window: 'mdi:window-closed-variant', opening: 'mdi:window-closed-variant', garage_door: 'mdi:garage',
    motion: 'mdi:motion-sensor', occupancy: 'mdi:account', presence: 'mdi:account', moving: 'mdi:run',
    vibration: 'mdi:vibrate', sound: 'mdi:volume-high',
  };
  const DOMENE_IKON = {
    light: 'mdi:lightbulb', switch: 'mdi:power-socket-eu', fan: 'mdi:fan', climate: 'mdi:radiator',
    cover: 'mdi:curtains', media_player: 'mdi:speaker', binary_sensor: 'mdi:motion-sensor', sensor: 'mdi:eye',
  };
  function entIkon(hass, e, klasse) {
    const st = hass.states[e];
    const a = (st && st.attributes) || {};
    if (a.icon) return a.icon;
    if (e.startsWith('media_player.') && a.device_class === 'tv') return 'mdi:television';
    if (e.startsWith('sensor.') && a.device_class === 'illuminance') return 'mdi:brightness-5';
    return KLASSE_IKON[klasse || a.device_class] || DOMENE_IKON[e.split('.')[0]] || 'mdi:help-circle-outline';
  }
  const TILSTAND = { on: 'På', off: 'Av', open: 'Åpen', closed: 'Lukket', opening: 'Åpner', closing: 'Lukker', playing: 'Spiller', paused: 'Pause', idle: 'Klar', standby: 'Standby', heat: 'Varme', cool: 'Kjøling', auto: 'Auto', unavailable: 'Utilgjengelig', unknown: 'Ukjent' };
  function entTilstand(hass, e, klasse) {
    const st = hass.states[e];
    if (!st) return 'Finnes ikke';
    const a = st.attributes || {};
    if (e.startsWith('binary_sensor.') && SENSOR_STYLE[klasse || a.device_class] && (st.state === 'on' || st.state === 'off')) {
      const [p, a2] = SENSOR_STYLE[klasse || a.device_class];
      return st.state === 'on' ? p : a2;
    }
    if (e.startsWith('climate.') && a.current_temperature != null) return (TILSTAND[st.state] || st.state) + ' · ' + a.current_temperature + '°';
    if (e.startsWith('cover.') && a.current_position != null) return (TILSTAND[st.state] || st.state) + ' · ' + a.current_position + ' %';
    if (!isNaN(parseFloat(st.state)) && a.unit_of_measurement) return st.state + ' ' + a.unit_of_measurement;
    return TILSTAND[st.state] || st.state;
  }

  /* Alle entitetene rommet KAN vise, gruppert som i popupen, med skjult-flagg. */
  function entitetGrupper(hass, ovStates, cfg, U) {
    const ov = mergeOversikt(Array.isArray(ovStates) ? ovStates : [ovStates], []);
    const roomNames = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' ')));
    const roomName = roomNames.length === 1 ? (cfg.navn || roomNames[0]) : roomNames;
    const skjul = new Set(effSkjul(cfg, U));
    const tittel = {};
    seksjonModell(cfg, U).forEach((x) => { tittel[x.key] = x.navn; });
    const idOf = (x) => (typeof x === 'string' ? x : x && x.entity);
    const flyttet = [].concat(cfg.klima_ekstra || []).map(idOf).filter((e) => e && hass.states[e]);
    const flyttSet = new Set(flyttet);
    const klasse = {};
    (ov.sensorer || []).forEach((x) => { if (x && x.entity) klasse[x.entity] = x.klasse; });
    const g = [
      ['gardiner', ov.gardiner.map(idOf)],
      ['lys', ov.lys.map(idOf)],
      ['enheter', ov.brytere.map(idOf).filter((e) => !flyttSet.has(e))],
      ['klima', [...ov.klima.map(idOf), ...flyttet, ...ov.vifter.map(idOf).filter((e) => !flyttSet.has(e))]],
      ['media', ov.media.map(idOf)],
      ['sensorer', [...ov.sensorer.map(idOf), ...ov.lysniva.map(idOf)]],
    ];
    return g.map(([key, ids]) => ({
      key, tittel: tittel[key] || SEK_INFO[key][0], ikon: SEK_INFO[key][1],
      items: [...new Set(ids.filter(Boolean))].map((id) => ({
        id, navn: friendly(hass, id, roomName), ikon: entIkon(hass, id, klasse[id]),
        sub: entTilstand(hass, id, klasse[id]), hid: skjul.has(id),
        pa: ['on', 'open', 'playing', 'heat'].includes((hass.states[id] || {}).state),
      })),
    })).filter((x) => x.items.length);
  }

  /* Kandidatene til temperatur/fukt: brukerens valg, config, rommets egne og reserven. */
  function sensorValg(hass, ovStates, cfg, U) {
    const ov = mergeOversikt(Array.isArray(ovStates) ? ovStates : [ovStates], []);
    const has = (e) => e && hass.states[e];
    const r = (k) => {
      const [cfgKey, ovKey, resKey, fb, uKey] = k === 'temp'
        ? ['temperatur', 'temperatur', 'reserve_temperatur', FALLBACK_TEMP, 'temp']
        : ['fuktighet', 'fuktighet', 'reserve_fuktighet', FALLBACK_HUM, 'fukt'];
      const res = cfg[resKey] || fb;
      const auto = cfg[cfgKey] || ov[ovKey][0] || (has(res) ? res : null);
      const valgt = has(U[uKey]) ? U[uKey] : null;
      const liste = [...new Set([valgt, cfg[cfgKey], ...ov[ovKey], res].filter(has))];
      return { liste, cur: valgt || auto, valgt };
    };
    return { temp: r('temp'), fukt: r('fukt'), roomName: ov.rooms.map((x) => x.rom || x.prefix).join(' ') };
  }

  /* Alle temperatur- eller fuktsensorer i HA, rommets egne først. */
  function alleSensorer(hass, k, q, ord) {
    const w = String(ord || '').toLowerCase().split(/\s+/)[0] || '#';
    const qq = String(q || '').toLowerCase();
    const navn = (id) => String((hass.states[id].attributes || {}).friendly_name || id);
    const ok = (id) => {
      if (!id.startsWith('sensor.')) return false;
      const a = hass.states[id].attributes || {};
      const u = String(a.unit_of_measurement || '');
      return k === 'temp' ? (a.device_class === 'temperature' || /°\s*[cf]/i.test(u))
        : (a.device_class === 'humidity' || (u === '%' && /fukt|humid/i.test(id + ' ' + navn(id))));
    };
    const rel = (id) => (id.includes(w) || navn(id).toLowerCase().includes(w) ? 1 : 0);
    return Object.keys(hass.states).filter(ok)
      .filter((id) => !qq || (id + ' ' + navn(id)).toLowerCase().includes(qq))
      .sort((a, b) => rel(b) - rel(a) || navn(a).localeCompare(navn(b), 'nb'));
  }

  // Finn oversikt-sensor for et rom (area_id, entity-prefix eller entity id)
  // rom -> entity_id huskes: full gjennomgang av hass.states ved hver oppdatering gjorde Android treg
  const ROM_CACHE = new Map();
  function findOne(hass, rom) {
    if (!rom) return null;
    const cached = ROM_CACHE.get(rom);
    if (cached && hass.states[cached]) return hass.states[cached];
    let st = hass.states[rom] || hass.states['sensor.' + rom + '_oversikt'] || null;
    if (!st) st = Object.values(hass.states).find((x) => x.entity_id.endsWith('_oversikt') && x.attributes.integrasjon === 'ki_rom' && x.attributes.area_id === rom) || null;
    if (st) ROM_CACHE.set(rom, st.entity_id);
    return st;
  }

  // liste over alle oversikt-sensorer: skann hass.states maks hvert 30. sekund
  let OV_IDS = null, OV_TS = 0;
  function oversiktIds(hass) {
    const now = Date.now();
    if (!OV_IDS || now - OV_TS > 30000 || OV_IDS.some((id) => !hass.states[id])) {
      OV_IDS = Object.values(hass.states).filter((st) => st.entity_id.startsWith('sensor.') && st.entity_id.endsWith('_oversikt') && st.attributes.integrasjon === 'ki_rom').map((st) => st.entity_id);
      OV_TS = now;
    }
    return OV_IDS;
  }
  window.KI = window.KI || {};
  window.KI.romFindOne = findOne;
  window.KI.romOversiktIds = oversiktIds;
  // Returnerer liste av oversikt-tilstander (ett eller flere rom), eller null hvis noe mangler
  function findOversikt(hass, cfg) {
    let roms = [].concat(cfg.entity || [], cfg.rom || []).filter(Boolean);
    if (roms.includes('alle')) {
      const eks = new Set([].concat(cfg.ekskluder_rom || []));
      roms = allOversikt(hass).map((st) => st.attributes.area_id).filter((r) => !eks.has(r));
    }
    if (!roms.length) return null;
    const out = roms.map((r) => findOne(hass, r));
    return out.every(Boolean) ? out : null;
  }

  function roomEntityIds(hass, roms, cfg = {}) {
    const ids = new Set();
    let list = [].concat(roms || []);
    if (list.includes('alle')) { const eks = new Set([].concat(cfg.ekskluder_rom || [])); list = allOversikt(hass).map((st) => st.attributes.area_id).filter((r) => !eks.has(r)); }
    list.forEach((r) => {
      const st = findOne(hass, r); if (!st) return;
      LIST_KEYS.forEach((k) => (st.attributes[k] || []).forEach((x) => ids.add(typeof x === 'string' ? x : x.entity)));
    });
    return [...ids].sort();
  }

  function allOversikt(hass) {
    return oversiktIds(hass).map((id) => hass.states[id])
      .filter((st) => st && st.attributes.area_id !== 'totalt')
      .sort((a, b) => (a.attributes.rom || '').localeCompare(b.attributes.rom || '', 'nb'));
  }

  // ------------------------------------------------------------ ki-rom-card
  // ------------------------------------------------------------ editor (velg rom + seksjoner i UI)
  const SECTION_LABELS = {
    header: 'Vis header (temperatur, graf, måltemp)', gardiner: 'Vis gardiner / markise', scener: 'Vis scener og skript',
    lys: 'Vis lys', enheter: 'Vis enheter (brytere)', klima: 'Vis klima (varme og vifter)', media: 'Vis media', sensorer: 'Vis sensorer',
  };
  const LABELS = {
    rom: 'Rom (velg ett eller flere)', rom_modus: 'Romvalg', ekskluder_rom: 'Rom som ikke skal med', navn: 'Visningsnavn (valgfritt)', temperatur: 'Temperatursensor (overstyr)', fuktighet: 'Fuktighetssensor (overstyr)',
    teller_suffix: 'Suffiks for input_number-teller', gap: 'Avstand mellom kort (px)',
    scener_ekstra: 'Legg til skript/scener som skal vises i raden',
    skjul: 'Skjul enheter fra kortet',
  };

  class KiRomCardEditor extends HTMLElement {
    setConfig(config) { this._config = { ...config }; this._render(); }
    set hass(hass) { this._hass = hass; this._render(); }

    _rooms() {
      return allOversikt(this._hass).map((st) => ({ value: st.attributes.area_id, label: st.attributes.rom || st.attributes.area_id }));
    }

    _entityToggles() {
      const c = this._config || {};
      const ids = roomEntityIds(this._hass, c.rom, c);
      const label = (e) => { const st = this._hass.states[e]; return ((st && st.attributes.friendly_name) || e) + '  (' + e + ')'; };
      const order = ['light', 'switch', 'fan', 'climate', 'cover', 'media_player', 'binary_sensor', 'sensor', 'script', 'scene'];
      return ids
        .map((e, i) => ({ e, i }))
        .sort((a, b) => order.indexOf(a.e.split('.')[0]) - order.indexOf(b.e.split('.')[0]) || a.e.localeCompare(b.e))
        .map(({ e }) => ({ name: 'ent_' + e.replace(/\./g, '__'), label: label(e), selector: { boolean: {} } }));
    }

    _schema() {
      const alle = [].concat((this._config || {}).rom || []).includes('alle');
      return [
        { name: 'rom_modus', selector: { select: { mode: 'dropdown', options: [{ value: 'velg', label: 'Velg rom som skal med' }, { value: 'alle', label: 'Alle rom – velg bort de som ikke skal med' }] } } },
        ...(alle
          ? [{ name: 'ekskluder_rom', selector: { select: { mode: 'list', multiple: true, options: this._rooms() } } }]
          : [{ name: 'rom', required: true, selector: { select: { mode: 'list', multiple: true, options: this._rooms() } } }]),
        { name: 'navn', selector: { text: {} } },
        ...Object.keys(DEFAULT_SECTIONS).map((k) => ({ name: 'sek_' + k, selector: { boolean: {} } })),
        { name: 'scener_ekstra', selector: { entity: { domain: ['script', 'scene'], multiple: true } } },
        { name: 'h_ent', type: 'constant', label: 'Enheter i kortet (skru av for å fjerne)' },
        ...this._entityToggles(),
        { name: 'temperatur', selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
        { name: 'fuktighet', selector: { entity: { domain: 'sensor', device_class: 'humidity' } } },
        { name: 'teller_suffix', selector: { text: {} } },
        { name: 'gap', selector: { number: { min: 0, max: 40, mode: 'box', unit_of_measurement: 'px' } } },
      ];
    }

    _data() {
      const c = this._config || {};
      const sek = normalizeSections(c);
      const alle = [].concat(c.rom || []).includes('alle');
      const skjul = new Set([].concat(c.skjul || []));
      const d = {
        rom_modus: alle ? 'alle' : 'velg', ekskluder_rom: [].concat(c.ekskluder_rom || []),
        rom: [].concat(c.rom || []).filter((r) => r !== 'alle'), navn: c.navn, temperatur: c.temperatur, fuktighet: c.fuktighet,
        teller_suffix: c.teller_suffix || '_teller', gap: c.gap === undefined ? 8 : c.gap,
        scener_ekstra: (c.scener_ekstra || []).map((x) => (typeof x === 'string' ? x : x.entity)).filter(Boolean),
        skjul: [].concat(c.skjul || []),
      };
      Object.keys(DEFAULT_SECTIONS).forEach((k) => { d['sek_' + k] = sek[k]; });
      roomEntityIds(this._hass, c.rom, c).forEach((e) => { d['ent_' + e.replace(/\./g, '__')] = !skjul.has(e); });
      return d;
    }

    _render() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (s) => LABELS[s.name] || SECTION_LABELS[s.name.replace(/^sek_/, '')] || s.name;
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const v = ev.detail.value || {};
          const seksjoner = {};
          Object.keys(DEFAULT_SECTIONS).forEach((k) => { if (v['sek_' + k] === false) seksjoner[k] = false; });
          const alle = v.rom_modus === 'alle';
          const roms = alle ? ['alle'] : [].concat(v.rom || []).filter(Boolean);
          const out = { type: 'custom:ki-rom-card', rom: roms.length === 1 ? roms[0] : roms };
          if (alle && Array.isArray(v.ekskluder_rom) && v.ekskluder_rom.length) out.ekskluder_rom = v.ekskluder_rom;
          if (v.navn) out.navn = v.navn;
          if (Object.keys(seksjoner).length) out.seksjoner = seksjoner;
          if (Array.isArray(v.scener_ekstra) && v.scener_ekstra.length) out.scener_ekstra = v.scener_ekstra;
          const skjul = Object.keys(v).filter((k) => k.startsWith('ent_') && v[k] === false).map((k) => k.slice(4).replace(/__/g, '.'));
          if (skjul.length) out.skjul = skjul;
          if (v.temperatur) out.temperatur = v.temperatur;
          if (v.fuktighet) out.fuktighet = v.fuktighet;
          if (v.teller_suffix && v.teller_suffix !== '_teller') out.teller_suffix = v.teller_suffix;
          if (v.gap !== undefined && v.gap !== null && v.gap !== 8) out.gap = v.gap;
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

  /* Skjult popup: bygg i ledig tid, så den er klar når den åpnes. */
  function enqueueBuild(kort) {
    if (kort._iKo) return;
    kort._iKo = true;
    const kjor = window.requestIdleCallback || ((f) => setTimeout(f, 250));
    kjor(() => {
      kort._iKo = false;
      if (kort._dirty && kort._lastOv && kort.isConnected && !kort._building) { kort._dirty = false; kort._rebuild(kort._lastOv); }
    });
  }

  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const haptic = (t = 'selection') => {
    try { window.dispatchEvent(new CustomEvent('haptic', { detail: t, bubbles: true, composed: true })); } catch (e) { /* ok */ }
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* ok */ }
  };
  /* Tap = handling, hold = mer-info. KI.bindPress fra basen når den finnes. */
  const bindPress = (el, tap, hold) => {
    if (window.KI && window.KI.bindPress) return window.KI.bindPress(el, tap, hold);
    el.addEventListener('click', tap);
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); if (hold) hold(); });
  };
  /* Tomme lister og objekter ut, så lagret data holder seg liten. */
  function rydd(o) {
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) rydd(v);
      if (v == null || v === '' || (Array.isArray(v) && !v.length) || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete o[k];
    });
    return o;
  }

  /* Stilen til «Tilpass rommet» – ki-cards sitt designspråk (DESIGN.md): flate --gray200-kort,
     24/22 px radius, 52 px ikonsirkler, 14 px/500, ingen skygger. */
  const TILPASS_CSS = `
    :host { display:block; }
    *, *::before, *::after { box-sizing:border-box; min-width:0; }
    button { font:inherit; color:inherit; border:none; background:none; padding:0; margin:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
    ha-icon { --mdc-icon-size:22px; display:inline-flex; }
    .press { transition: transform .08s ease, filter .15s ease; }
    .press:active { transform: scale(.97); filter: brightness(1.08); }
    .ic { width:52px; height:52px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center;
      background:rgba(250,251,252,.1); border:1px solid rgba(250,251,252,.1); color:var(--gray1000); }
    .ic ha-icon { --mdc-icon-size:26px; }
    .knapp { display:flex; align-items:center; gap:12px; width:100%; height:66px; padding:0 20px 0 7px; border-radius:22px;
      background:var(--gray200); color:var(--gray1000); text-align:left; user-select:none; }
    .knapp .txt { flex:1; display:flex; flex-direction:column; gap:2px; }
    .n { font-size:14px; font-weight:500; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .s { font-size:14px; font-weight:500; line-height:1.25; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .knapp .n { font-size:16px; }
    .knapp > ha-icon { opacity:.5; }

    .wrap { display:flex; flex-direction:column; gap:var(--ki-rom-gap, 8px); color:var(--gray1000); user-select:none;
      -webkit-tap-highlight-color:transparent;
      padding-bottom:calc(var(--kd-dokk-h, 90px) + 96px + env(safe-area-inset-bottom)); }
    .intro { padding:18px 20px; border-radius:24px; background:var(--gray200); }
    .intro .h { font-size:30px; font-weight:500; line-height:1.1; }
    .intro .s { white-space:normal; margin-top:6px; }
    .panel { border-radius:24px; background:var(--gray200); padding:4px 12px 12px; display:flex; flex-direction:column; }
    .ph { display:flex; align-items:center; gap:12px; min-height:46px; padding:0 2px; }
    .ph .t { flex:1; font-size:16px; font-weight:500; }
    .ph .alt { font-size:14px; font-weight:500; color:var(--gray600, var(--gray800)); white-space:nowrap; }
    .rows { display:flex; flex-direction:column; gap:6px; }
    .row { display:flex; align-items:center; gap:8px; min-height:66px; padding:7px 7px; border-radius:22px; background:var(--gray100); }
    .row .txt { flex:1; display:flex; flex-direction:column; gap:2px; padding-left:4px; }
    .row.on .ic { background:var(--active-big, #ee95ff); border-color:transparent; color:var(--black, #000); }
    .row.hid .ic, .row.hid .txt, .row.hid input { opacity:.4; }
    .row.hid .n, .row.hid input { text-decoration:line-through; }
    .row.ent { cursor:pointer; }
    .rb { width:40px; height:40px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center;
      background:var(--gray200); color:var(--gray1000); }
    .rb[disabled] { opacity:.25; pointer-events:none; }
    .rb.eye { background:var(--gray200); color:var(--gray1000); }
    .row.hid .rb.eye { background:none; border:1px dashed var(--gray400); color:var(--gray600, var(--gray800)); }
    .rb.del { color:var(--red, #e5484d); }
    input.nm { flex:1; height:40px; border-radius:999px; border:none; outline:none; padding:0 14px;
      background:var(--gray200); color:var(--gray1000); font:inherit; font-size:14px; font-weight:500; }
    input.nm::placeholder, input.sok::placeholder { color:var(--gray1000); opacity:.45; }
    .tom { font-size:14px; font-weight:500; opacity:.5; padding:6px 4px; }
    .sens { display:flex; flex-direction:column; gap:10px; padding:4px 2px 8px; }
    .sens + .sens { border-top:1px solid rgba(250,251,252,.06); padding-top:12px; }
    .sh { display:flex; align-items:center; gap:10px; }
    .sh .t { flex:1; font-size:14px; font-weight:500; opacity:.7; }
    .pill { display:flex; align-items:center; gap:6px; height:36px; padding:0 14px; border-radius:999px;
      background:var(--gray100); font-size:14px; font-weight:500; white-space:nowrap; }
    .pill ha-icon { --mdc-icon-size:18px; }
    .pill.sel { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    .chips { display:flex; flex-wrap:wrap; gap:6px; }
    .chips.scroll { max-height:260px; overflow-y:auto; overscroll-behavior:contain; }
    .chip { display:flex; align-items:center; gap:6px; max-width:100%; height:36px; padding:0 14px; border-radius:999px;
      background:var(--gray100); font-size:14px; font-weight:500; }
    .chip ha-icon { --mdc-icon-size:18px; flex:none; }
    .chip .l { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chip .v { opacity:.7; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .chip.sel { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    .chip.sel .v { opacity:.8; }
    input.sok { width:100%; height:46px; border-radius:999px; border:none; outline:none; padding:0 18px;
      background:var(--gray100); color:var(--gray1000); font:inherit; font-size:14px; font-weight:500; }
    .mer { font-size:14px; font-weight:500; opacity:.5; }
    .add { display:flex; align-items:center; justify-content:center; gap:8px; height:46px; margin-top:8px; border-radius:999px;
      background:var(--gray100); font-size:14px; font-weight:500; }
    .add.sel { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    .addbox { display:flex; flex-direction:column; gap:8px; margin-top:8px; }

    .bar { position:fixed; left:12px; right:12px; z-index:30; max-width:560px; margin:0 auto;
      bottom:calc(var(--kd-dokk-h, 90px) + 6px + env(safe-area-inset-bottom));
      display:flex; align-items:center; gap:8px; padding:8px 8px 8px 8px; border-radius:999px;
      background:var(--gray200); border:1px solid rgba(250,251,252,.1);
      -webkit-backdrop-filter:blur(18px); backdrop-filter:blur(18px); box-shadow:none; }
    .bar .ic { width:46px; height:46px; }
    .bar .txt { flex:1; display:flex; flex-direction:column; gap:1px; padding-left:2px; }
    .bar .b { height:46px; padding:0 18px; border-radius:999px; background:var(--gray100); font-size:14px; font-weight:500; flex:none; }
    .bar .b.ok { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    @media (max-width:380px) { .bar .txt .s { display:none; } }
    @media (prefers-reduced-motion: reduce) { .press { transition:none; } .press:active { transform:none; } }
  `;

  class KiRomCard extends HTMLElement {
    static getConfigElement() { return document.createElement('ki-rom-card-editor'); }
    static getStubConfig(hass) {
      const first = hass ? allOversikt(hass)[0] : null;
      return { rom: first ? first.attributes.area_id : 'stue' };
    }

    setConfig(config) {
      if (!config.rom && !config.entity) throw new Error('ki-rom-card: angi rom: <area_id> (eller liste med rom) eller entity: sensor.<rom>_oversikt');
      this._config = {
        teller_suffix: '_teller',
        ...config,
        seksjoner: normalizeSections(config),
      };
      this._rawConfig = config;
      this._signature = null;
      this._children = [];
      this._lastOv = null;
      this._dirty = true;
      this._udSig = null;
      this._st = this._st || {};
      if (!this._root) {
        this._root = document.createElement('div');
        /* Tannhjulet i toppkortet (ki-rom-hero-card) ber om «Tilpass rommet». */
        this._root.addEventListener('ki-rom-tilpass', (ev) => {
          if (this._config && this._config.tilpass === false) return;
          ev.preventDefault();
          ev.stopPropagation();
          this._setEdit(true);
        });
        this._root.style.display = 'flex';
        this._root.style.flexDirection = 'column';
        this.appendChild(this._root);
      }
      const gap = this._config.gap === undefined ? 8 : this._config.gap;
      this._root.style.gap = typeof gap === 'number' ? gap + 'px' : String(gap);
      this._gapCss = this._root.style.gap;
      if (this._edit) this._renderEdit();
    }

    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      if (!REG) hentRegister(hass, this);   // paring mot fysisk enhet krever registeret
      // Ytelse: sammenlign state-objektene på referanse (HA lager nytt objekt bare når entiteten endres)
      // i stedet for å JSON-serialisere attributtene ved hver hass-oppdatering.
      const ov = findOversikt(hass, this._config);
      if (!ov) { this._showError('KI Rom: fant ikke sensor.<rom>_oversikt for «' + [].concat(this._config.rom || this._config.entity).join(', ') + '» – er ki-rom ≥ 1.1 installert?'); return; }
      const changed = !this._lastOv || ov.length !== this._lastOv.length || ov.some((o, i) => o !== this._lastOv[i] && JSON.stringify(o.attributes) !== JSON.stringify(this._lastOv[i].attributes));
      /* Brukerens valg (skjul, rekkefølge, sensorer …) kom fra HA eller ble endret.
         Mens «Tilpass rommet» er åpent venter vi – popupen bygges når brukeren trykker Ferdig. */
      const udEndret = !this._edit && this._udSig !== null && JSON.stringify(userRom(hass, this._config)) !== this._udSig;
      if (changed || udEndret || this._dirty) {
        this._lastOv = ov;
        this._dirty = true;
        if (this._visible !== false) { this._dirty = false; this._rebuild(ov); return; }
        enqueueBuild(this); // skjult popup: bygg i ledig tid så den er klar når den åpnes
        return;
      }
      if (this._visible === false) { this._pendingHass = hass; return; }
      this._forward(hass);
    }

    // send hass videre maks én gang per animasjonsramme
    _forward(hass) {
      this._pendingHass = hass;
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        const h = this._pendingHass; this._pendingHass = null;
        if (h) this._children.forEach((c) => { c.hass = h; });
      });
    }

    connectedCallback() {
      if (!this._io && 'IntersectionObserver' in window) {
        this._io = new IntersectionObserver((entries) => {
          const vis = entries.some((e) => e.isIntersecting);
          if (vis === this._visible) return;
          this._visible = vis;
          if (!vis) return;
          if (this._dirty && this._lastOv) { this._dirty = false; this._rebuild(this._lastOv); }
          else if (!this._children.length && this._lastOv && !this._building) this._rebuild(this._lastOv);
          else if (this._pendingHass) this._forward(this._pendingHass);
        }, { rootMargin: '300px' });
        this._io.observe(this);
      }
      /* Brukervalgene lagres av dette kortet, et annet rom-kort eller en annen fane. */
      if (!this._udLytter) {
        this._udLytter = (ev) => {
          if (!ev.detail || ev.detail.key !== UD_KEY || !this._hass) return;
          if (this._edit) { this._renderEdit(); return; }
          this.hass = this._hass;
        };
        window.addEventListener('ki-ud', this._udLytter);
      }
      // sikkerhetsnett: er kortet fortsatt tomt etter 3 s, bygg uansett
      setTimeout(() => { if (this.isConnected && !this._children.length && this._lastOv && !this._building) { this._dirty = false; this._rebuild(this._lastOv); } }, 3000);
    }
    disconnectedCallback() {
      if (this._io) { this._io.disconnect(); this._io = null; }
      this._visible = undefined;
      if (this._udLytter) { window.removeEventListener('ki-ud', this._udLytter); this._udLytter = null; }
    }

    _showError(msg) {
      if (this._root.dataset.error === msg) return;
      this._root.dataset.error = msg;
      this._root.innerHTML = '<div style="padding:16px;border-radius:24px;background:var(--gray200);color:var(--gray1000);font-size:14px">' + msg + '</div>';
      this._children = [];
    }

    async _rebuild(ov) {
      if (this._building) { this._pending = ov; return; }
      this._building = true;
      try {
        const helpers = await window.loadCardHelpers();
        const U = userRom(this._hass, this._config);
        this._udSig = JSON.stringify(U);
        const configs = generate(this._hass, ov, this._config, U);
        const els = [];
        for (const c of configs) {
          const el = await helpers.createCardElement(c);
          el.hass = this._hass;
          els.push(el);
        }
        this._root.innerHTML = '';
        delete this._root.dataset.error;
        els.forEach((el) => this._root.appendChild(el));
        /* «Tilpass rommet» nederst – før mellomrommet som skyver innholdet opp. */
        if (this._config.tilpass !== false) {
          const gapEl = els[els.length - 1];
          this._root.insertBefore(this._tilpassKnapp(), gapEl || null);
        }
        this._children = els;
        this._pendingHass = null;
      } catch (err) {
        this._showError('KI Rom: ' + err.message);
      } finally {
        this._building = false;
        if (this._pending) { const p = this._pending; this._pending = null; this._rebuild(p); }
      }
    }

    _tilpassKnapp() {
      const host = document.createElement('div');
      host.className = 'ki-rom-tilpass';
      const sr = host.attachShadow({ mode: 'open' });
      sr.innerHTML = '<style>' + TILPASS_CSS + '</style>'
        + '<button class="knapp press" type="button"><span class="ic"><ha-icon icon="mdi:tune-variant"></ha-icon></span>'
        + '<span class="txt"><span class="n">Tilpass rommet</span><span class="s">Skjul, sorter og velg sensorer</span></span>'
        + '<ha-icon icon="mdi:chevron-right"></ha-icon></button>';
      sr.querySelector('button').addEventListener('click', () => { haptic('light'); this._setEdit(true); });
      return host;
    }

    // ---------------------------------------------------------- «Tilpass rommet»
    _setEdit(on) {
      this._edit = !!on;
      this._st = {};
      if (on) {
        this._root.style.display = 'none';
        this._renderEdit();
        try { this.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* ok */ }
      } else {
        if (this._ed) { this._ed.remove(); this._ed = null; }
        this._root.style.display = 'flex';
        /* Bygg på nytt hvis noe ble endret mens vi redigerte. */
        if (this._hass && JSON.stringify(userRom(this._hass, this._config)) !== this._udSig) {
          this._dirty = true; this.hass = this._hass;
        }
        try { this.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { /* ok */ }
      }
    }

    /* Endrer brukerens rad for rommet og lagrer den per bruker i HA. */
    _lagre(fn) {
      const K = window.KI || {};
      const alle = JSON.parse(JSON.stringify(udAll(this._hass)));
      const key = romKey(this._config);
      const rad = alle[key] && typeof alle[key] === 'object' ? alle[key] : {};
      fn(rad);
      rydd(rad);
      if (Object.keys(rad).length) alle[key] = rad; else delete alle[key];
      haptic();
      if (K.udSave) K.udSave(this._hass, UD_KEY, alle);
      else this._renderEdit();
    }

    _ovListe() { return findOversikt(this._hass, this._config) || this._lastOv; }

    _entHide(id) {
      const hid = effSkjul(this._config, userRom(this._hass, this._config)).includes(id);
      const fraCfg = [].concat(this._config.skjul || []).includes(id);
      this._lagre((r) => {
        r.skjul = (r.skjul || []).filter((x) => x !== id);
        r.vis = (r.vis || []).filter((x) => x !== id);
        /* Skjult i kortets config: vis-lista overstyrer. Ellers: brukerens skjul-liste. */
        if (fraCfg) { if (hid) r.vis.push(id); } else if (!hid) r.skjul.push(id);
      });
    }

    _sekHide(k) {
      const m = seksjonModell(this._config, userRom(this._hass, this._config)).find((x) => x.key === k);
      if (!m) return;
      this._lagre((r) => {
        const g = r.fliser = r.fliser || {};
        g.skjul = (g.skjul || []).filter((x) => x !== k);
        g.vis = (g.vis || []).filter((x) => x !== k);
        if (!m.hid) g.skjul.push(k);
        else if (!this._config.seksjoner[k]) g.vis.push(k);
      });
    }

    _flytt(kind, key, d) {
      const U = userRom(this._hass, this._config);
      const liste = kind === 'fliser'
        ? seksjonModell(this._config, U).map((x) => x.key)
        : this._sceneListe(U).map((x) => x.key);
      const i = liste.indexOf(key), j = i + d;
      if (i < 0 || j < 0 || j >= liste.length) return;
      [liste[i], liste[j]] = [liste[j], liste[i]];
      this._lagre((r) => { r[kind] = r[kind] || {}; r[kind].rekkefolge = liste; });
    }

    _navn(kind, key, v, def) {
      const t = String(v || '').trim().slice(0, 30);
      this._lagre((r) => {
        const g = r[kind] = r[kind] || {};
        g.navn = { ...(g.navn || {}) };
        if (!t || t === def) delete g.navn[key]; else g.navn[key] = t;
      });
    }

    _sceneListe(U) {
      const ovs = this._ovListe();
      if (!ovs) return [];
      const ov = mergeOversikt(ovs, []);
      const roomNames = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' ')));
      const roomName = roomNames.length === 1 ? (this._config.navn || roomNames[0]) : roomNames;
      return sceneItems(this._hass, ov, roomName, this._config.scener_ekstra, this._config, U.scener || {});
    }

    _scHide(key) {
      const x = this._sceneListe(userRom(this._hass, this._config)).find((y) => y.key === key);
      this._lagre((r) => {
        const g = r.scener = r.scener || {};
        g.skjul = (g.skjul || []).filter((y) => y !== key);
        if (x && !x.hid) g.skjul.push(key);
      });
    }

    _scDel(key) {
      this._lagre((r) => {
        const g = r.scener = r.scener || {};
        ['ekstra', 'skjul', 'rekkefolge'].forEach((k) => { g[k] = (g[k] || []).filter((y) => y !== key); });
        if (g.navn) delete g.navn[key];
      });
    }

    _scAdd(id) {
      this._lagre((r) => {
        const g = r.scener = r.scener || {};
        g.ekstra = [...(g.ekstra || []).filter((y) => y !== id), id];
        g.skjul = (g.skjul || []).filter((y) => y !== id);
      });
    }

    _sensPick(k, id) {
      this._lagre((r) => { if (r[k] === id) delete r[k]; else r[k] = id; });
    }

    _nullstill() {
      this._lagre((r) => { Object.keys(r).forEach((k) => delete r[k]); });
    }

    _verdi(id, k) {
      const st = this._hass.states[id];
      const v = st ? parseFloat(st.state) : NaN;
      if (isNaN(v)) return '–';
      return k === 'fukt' ? Math.round(v) + ' %' : v.toFixed(1).replace('.', ',') + '°';
    }

    _chip(k, id, cur, valgt) {
      const st = this._hass.states[id];
      const navn = (st && st.attributes.friendly_name) || id;
      return '<button type="button" class="chip press' + (id === cur ? ' sel' : '') + '" data-act="sens" data-k="' + k + '" data-id="' + esc(id) + '" data-more="' + esc(id) + '">'
        + (id === valgt ? '<ha-icon icon="mdi:pin"></ha-icon>' : '')
        + '<span class="l">' + esc(navn) + '</span><span class="v">' + esc(this._verdi(id, k)) + '</span></button>';
    }

    _sensListe(k) {
      const sv = this._sv;
      const r = sv[k];
      const mer = alleSensorer(this._hass, k, this._st.sensQ, sv.roomName).filter((id) => !r.liste.includes(id));
      return (mer.slice(0, 60).map((id) => this._chip(k, id, r.cur, r.valgt)).join('') || '<span class="tom">Ingen treff</span>')
        + (mer.length > 60 ? '<span class="mer">' + (mer.length - 60) + ' til – søk for å snevre inn</span>' : '');
    }

    _scKandidater() {
      const have = new Set(this._sceneListe(userRom(this._hass, this._config)).map((x) => x.key));
      const q = String(this._st.scQ || '').toLowerCase();
      const w = String(romKey(this._config)).split('+')[0].toLowerCase();
      const navn = (id) => String((this._hass.states[id].attributes || {}).friendly_name || id);
      const rel = (id) => (id.includes(w) || navn(id).toLowerCase().includes(w) ? 1 : 0);
      return Object.keys(this._hass.states)
        .filter((id) => /^(scene|script)\./.test(id) && !have.has(id) && (!q || (id + ' ' + navn(id)).toLowerCase().includes(q)))
        .sort((a, b) => rel(b) - rel(a) || (b.startsWith('scene.') - a.startsWith('scene.')) || navn(a).localeCompare(navn(b), 'nb'));
    }

    _scListe() {
      const c = this._scKandidater();
      const navn = (id) => String((this._hass.states[id].attributes || {}).friendly_name || id);
      return (c.slice(0, 40).map((id) => '<button type="button" class="chip press" data-act="scadd" data-id="' + esc(id) + '" data-more="' + esc(id) + '">'
        + '<ha-icon icon="' + (id.startsWith('script.') ? 'mdi:script-text-outline' : 'mdi:palette-outline') + '"></ha-icon>'
        + '<span class="l">' + esc(navn(id)) + '</span></button>').join('') || '<span class="tom">Ingen scener eller skript funnet</span>')
        + (c.length > 40 ? '<span class="mer">' + (c.length - 40) + ' til – søk for å snevre inn</span>' : '');
    }

    /* Rad i redigeringspanelet for seksjoner og scener: navn, flytt, skjul (+ fjern). */
    _edRad(kind, x, i, n) {
      const rb = (act, d, icon, tip, dis, cls) => '<button type="button" class="rb press' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-kind="' + kind + '" data-key="' + esc(x.key) + '"'
        + (d ? ' data-d="' + d + '"' : '') + ' title="' + tip + '" aria-label="' + tip + '"' + (dis ? ' disabled' : '') + '><ha-icon icon="' + icon + '"></ha-icon></button>';
      const felt = x.kanNavn
        ? '<input class="nm" data-kind="' + kind + '" data-key="' + esc(x.key) + '" value="' + esc(x.navn) + '" placeholder="' + esc(x.def) + '" data-def="' + esc(x.def) + '" maxlength="30" enterkeyhint="done" autocomplete="off">'
        : '<span class="txt"><span class="n">' + esc(x.navn) + '</span></span>';
      return '<div class="row' + (x.hid ? ' hid' : '') + '"' + (x.more ? ' data-hold="' + esc(x.more) + '"' : '') + '>'
        + '<span class="ic"><ha-icon icon="' + esc(x.icon) + '"></ha-icon></span>' + felt
        + rb('flytt', '-1', 'mdi:arrow-up', 'Flytt opp', i === 0)
        + rb('flytt', '1', 'mdi:arrow-down', 'Flytt ned', i === n - 1)
        + rb(kind === 'fliser' ? 'sekhide' : 'schide', '', x.hid ? 'mdi:eye-off-outline' : 'mdi:eye-outline', x.hid ? 'Vis' : 'Skjul', false, 'eye')
        + (x.extra ? rb('scdel', '', 'mdi:trash-can-outline', 'Fjern', false, 'del') : '')
        + '</div>';
    }

    _renderEdit() {
      if (!this._edit || !this._hass) return;
      const ovs = this._ovListe();
      if (!ovs) return;
      if (!this._ed) {
        this._ed = document.createElement('div');
        this._ed.className = 'ki-rom-rediger';
        this._ed.attachShadow({ mode: 'open' });
        this.appendChild(this._ed);
      }
      const cfg = this._config;
      const hass = this._hass;
      const U = userRom(hass, cfg);
      const st = this._st;
      const sv = this._sv = sensorValg(hass, ovs, cfg, U);
      const grupper = entitetGrupper(hass, ovs, cfg, U);
      const roomName = ovs.map((o) => o.attributes.rom || o.attributes.area_id).join(' + ');

      // --- temperatur og fukt
      const sensRad = (k, tittel, ikon) => {
        const r = sv[k];
        const open = st.sensAll === k;
        return '<div class="sens"><div class="sh"><ha-icon icon="' + ikon + '"></ha-icon><span class="t">' + tittel + '</span>'
          + '<button type="button" class="pill press' + (open ? ' sel' : '') + '" data-act="sensall" data-k="' + k + '"><ha-icon icon="' + (open ? 'mdi:chevron-up' : 'mdi:magnify') + '"></ha-icon>' + (open ? 'Lukk' : 'Alle sensorer') + '</button></div>'
          + '<div class="chips">' + (r.liste.map((id) => this._chip(k, id, r.cur, r.valgt)).join('') || '<span class="tom">Ingen forslag i rommet – søk i alle sensorer</span>') + '</div>'
          + (open ? '<input class="sok" data-sok="sens" placeholder="Søk etter sensor …" autocomplete="off" value="' + esc(st.sensQ || '') + '">'
            + '<div class="chips scroll" data-liste="sens">' + this._sensListe(k) + '</div>' : '')
          + '</div>';
      };
      const sensPanel = '<section class="panel"><div class="ph"><ha-icon icon="mdi:thermometer"></ha-icon><span class="t">Temperatur og fukt</span>'
        + '<span class="alt">' + (U.temp || U.fukt ? 'Eget valg' : 'Automatisk') + '</span></div>'
        + sensRad('temp', 'Temperatur fra', 'mdi:thermometer') + sensRad('fukt', 'Fukt fra', 'mdi:water-percent') + '</section>';

      // --- seksjoner (de store flisene/kategoriene i popupen)
      const sek = seksjonModell(cfg, U);
      const sekPanel = '<section class="panel"><div class="ph"><ha-icon icon="mdi:view-grid-outline"></ha-icon><span class="t">Seksjoner</span>'
        + '<span class="alt">' + sek.filter((x) => !x.hid).length + ' av ' + sek.length + ' vises</span></div><div class="rows">'
        + sek.map((x, i) => {
          const def = x.key === 'header' ? (cfg.navn || roomName) : SEK_INFO[x.key][0];
          return this._edRad('fliser', { key: x.key, icon: SEK_INFO[x.key][1], navn: x.navn || (KAN_NAVN.has(x.key) ? '' : def), def, hid: x.hid, kanNavn: KAN_NAVN.has(x.key) }, i, sek.length);
        }).join('') + '</div></section>';

      // --- scener
      const scener = this._sceneListe(U);
      const scPanel = '<section class="panel"><div class="ph"><ha-icon icon="mdi:palette-outline"></ha-icon><span class="t">Scener</span>'
        + '<span class="alt">' + scener.filter((x) => !x.hid).length + ' av ' + scener.length + ' vises</span></div><div class="rows">'
        + (scener.map((x, i) => this._edRad('scener', { key: x.key, icon: x.icon, navn: x.name === x.def ? '' : x.name, def: x.def, hid: x.hid, extra: x.extra, kanNavn: true, more: x.key }, i, scener.length)).join('')
          || '<span class="tom">Ingen scener ennå</span>') + '</div>'
        + '<button type="button" class="add press' + (st.scAdd ? ' sel' : '') + '" data-act="scaddtog"><ha-icon icon="' + (st.scAdd ? 'mdi:chevron-up' : 'mdi:plus') + '"></ha-icon>' + (st.scAdd ? 'Lukk' : 'Legg til scene eller skript') + '</button>'
        + (st.scAdd ? '<div class="addbox"><input class="sok" data-sok="sc" placeholder="Søk etter scene eller skript …" autocomplete="off" value="' + esc(st.scQ || '') + '">'
          + '<div class="chips scroll" data-liste="sc">' + this._scListe() + '</div></div>' : '')
        + '</section>';

      // --- entitetene, gruppert som i popupen
      const entPanel = grupper.map((g) => '<section class="panel"><div class="ph"><ha-icon icon="' + g.ikon + '"></ha-icon><span class="t">' + esc(g.tittel) + '</span>'
        + '<span class="alt">' + g.items.filter((x) => !x.hid).length + ' av ' + g.items.length + ' vises</span></div><div class="rows">'
        + g.items.map((x) => '<div class="row ent press' + (x.hid ? ' hid' : '') + (x.pa ? ' on' : '') + '" data-ent="' + esc(x.id) + '" role="button" tabindex="0" aria-label="' + (x.hid ? 'Vis ' : 'Skjul ') + esc(x.navn) + '">'
          + '<span class="ic"><ha-icon icon="' + esc(x.ikon) + '"></ha-icon></span>'
          + '<span class="txt"><span class="n">' + esc(x.navn) + '</span><span class="s">' + esc(x.hid ? 'Skjult' : x.sub) + '</span></span>'
          + '<span class="rb eye"><ha-icon icon="' + (x.hid ? 'mdi:eye-off-outline' : 'mdi:eye-outline') + '"></ha-icon></span></div>').join('')
        + '</div></section>').join('');

      const bar = '<div class="bar"><span class="ic"><ha-icon icon="mdi:tune-variant"></ha-icon></span>'
        + '<span class="txt"><span class="n">Tilpass rommet</span><span class="s">Gjelder bare deg</span></span>'
        + '<button type="button" class="b press" data-act="reset">Nullstill</button>'
        + '<button type="button" class="b ok press" data-act="ferdig">Ferdig</button></div>';

      const sr = this._ed.shadowRoot;
      sr.innerHTML = '<style>' + TILPASS_CSS + '</style><div class="wrap" style="--ki-rom-gap:' + esc(this._gapCss || '8px') + '">'
        + '<div class="intro"><div class="h">Tilpass ' + esc(roomName) + '</div><div class="s">Trykk på en rad for å skjule eller vise den. Hold inne for detaljer. Valgene lagres på brukeren din og følger deg til alle enheter.</div></div>'
        + sensPanel + sekPanel + scPanel + entPanel + '</div>' + bar;
      this._bind(sr);
    }

    _bind(root) {
      const more = (id) => { if (id && window.KI && window.KI.moreInfo) window.KI.moreInfo(this, id); else if (id) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); };
      root.querySelectorAll('[data-ent]').forEach((el) => {
        const id = el.dataset.ent;
        bindPress(el, () => this._entHide(id), () => { haptic('medium'); more(id); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._entHide(id); } });
      });
      root.querySelectorAll('[data-hold]').forEach((el) => {
        let t = null;
        const stopp = () => clearTimeout(t);
        el.addEventListener('pointerdown', (e) => { if (e.target.closest('button,input')) return; t = setTimeout(() => { haptic('medium'); more(el.dataset.hold); }, 500); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => el.addEventListener(n, stopp));
      });
      root.querySelectorAll('button[data-act]').forEach((el) => {
        const d = el.dataset;
        const tap = () => {
          switch (d.act) {
            case 'sens': this._sensPick(d.k, d.id); break;
            case 'sensall': this._st.sensAll = this._st.sensAll === d.k ? null : d.k; this._st.sensQ = ''; haptic(); this._renderEdit(); break;
            case 'sekhide': this._sekHide(d.key); break;
            case 'schide': this._scHide(d.key); break;
            case 'flytt': this._flytt(d.kind, d.key, Number(d.d)); break;
            case 'scdel': this._scDel(d.key); break;
            case 'scaddtog': this._st.scAdd = !this._st.scAdd; this._st.scQ = ''; haptic(); this._renderEdit(); break;
            case 'scadd': this._scAdd(d.id); break;
            case 'reset': this._nullstill(); break;
            case 'ferdig': haptic('light'); this._setEdit(false); break;
            default:
          }
        };
        /* Chips i søkelistene: trykk = velg, hold = mer-info. */
        if (d.more) bindPress(el, tap, () => { haptic('medium'); more(d.more); });
        else el.addEventListener('click', tap);
      });
      root.querySelectorAll('input.nm').forEach((el) => {
        el.addEventListener('change', () => this._navn(el.dataset.kind, el.dataset.key, el.value, el.dataset.def));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
      });
      root.querySelectorAll('input.sok').forEach((el) => {
        el.addEventListener('input', () => {
          const sens = el.dataset.sok === 'sens';
          if (sens) this._st.sensQ = el.value; else this._st.scQ = el.value;
          clearTimeout(this._sokT);
          this._sokT = setTimeout(() => {
            const liste = root.querySelector('[data-liste="' + el.dataset.sok + '"]');
            if (!liste) return;
            liste.innerHTML = sens ? this._sensListe(this._st.sensAll) : this._scListe();
            this._bind(liste);
          }, 120);
        });
      });
    }

    getCardSize() { return this._children.reduce((n, c) => n + (c.getCardSize ? c.getCardSize() : 3), 0) || 6; }
  }

  // ------------------------------------------------------------ ki-rom-popups
  const POPUP_STYLES = (color) =>
    '.bubble-pop-up-container {\n  --vertical-stack-card-gap: 0px!important;\n} #header-container > div > div {\n  background: var(--gray200)!important;\n}      \n' +
    '#header-container > button {background: none;}    \n' +
    '.icon-container {background-color:' + color + '!important;} \n' +
    '.icon-container > ha-icon {color:var(--black)!important;opacity:1!important} \n' +
    '.bubble-icon {\n  --mdc-icon-size: 24px !important;\n}';

  class KiRomPopups extends HTMLElement {
    static getStubConfig() { return { farger: { stue: 'var(--green)' } }; }

    setConfig(config) {
      this._config = { hash_prefix: '#', farger: {}, hopp_over: [], rom: {}, ...config };
      this._signature = null;
      this._children = [];
      this._lastOv = null;
      this._dirty = true;
      if (!this._root) { this._root = document.createElement('div'); this.appendChild(this._root); }
    }

    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      const list = allOversikt(hass).filter((st) => !this._config.hopp_over.includes(st.attributes.area_id));
      const sig = list.map((st) => st.entity_id + ':' + (st.attributes.rom || '') + ':' + (st.attributes.ikon || '')).join(',');
      if (sig !== this._signature) { this._signature = sig; this._rebuild(list); return; }
      this._children.forEach((c) => { c.hass = hass; });
    }

    async _rebuild(list) {
      const helpers = await window.loadCardHelpers();
      const els = [];
      for (const st of list) {
        const aid = st.attributes.area_id;
        const per = this._config.rom[aid] || {};
        const color = per.farge || this._config.farger[aid] || 'var(--gray1000)';
        const cardCfg = {
          type: 'custom:ki-rom-card', rom: aid,
          seksjoner: { ...(this._config.seksjoner || {}), ...(per.seksjoner || {}) },
          ...(this._config.teller_suffix ? { teller_suffix: this._config.teller_suffix } : {}),
          ...(per.temperatur ? { temperatur: per.temperatur } : {}),
          ...(per.fuktighet ? { fuktighet: per.fuktighet } : {}),
        };
        const cfg = {
          type: 'custom:bubble-card', card_type: 'pop-up',
          name: per.navn || st.attributes.rom || aid,
          icon: per.ikon || st.attributes.ikon || 'mdi:home-outline',
          state: null, hash: (per.hash || this._config.hash_prefix + aid), is_sidebar_hidden: true,
          margin_top_mobile: '50px', margin_top_desktop: '50px', card_layout: 'large',
          styles: POPUP_STYLES(color),
          bg_blur: '20', shadow_opacity: '20', bg_opacity: '88', button_type: 'name',
          sub_button: { main: [], bottom: [] }, slider_fill_orientation: 'left', slider_value_position: 'right',
          cards: [cardCfg],
        };
        try {
          const el = await helpers.createCardElement(cfg);
          el.hass = this._hass;
          els.push(el);
        } catch (err) { console.warn('ki-rom-popups: kunne ikke lage popup for', aid, err); }
      }
      this._root.innerHTML = '';
      els.forEach((el) => this._root.appendChild(el));
      this._children = els;
    }

    getCardSize() { return 1; }
  }

  if (!customElements.get('ki-rom-card-editor')) customElements.define('ki-rom-card-editor', KiRomCardEditor);
  if (!customElements.get('ki-rom-card')) customElements.define('ki-rom-card', KiRomCard);
  if (!customElements.get('ki-rom-popups')) customElements.define('ki-rom-popups', KiRomPopups);

  window.customCards = window.customCards || [];
  window.customCards.push(
    { type: 'ki-rom-card', name: 'KI Rom', description: 'Auto-bygd rom-popup fra KI Rom-integrasjonen (velg rom i editoren)', preview: false },
    { type: 'ki-rom-popups', name: 'KI Rom popups', description: 'Én bubble-card pop-up per rom, automatisk', preview: false },
  );
  console.info('%c KI-ROM-CARD %c 1.14.0 ', 'background:#1e2327;color:#fff;border-radius:4px 0 0 4px', 'background:#4caf50;color:#000;border-radius:0 4px 4px 0');
})();

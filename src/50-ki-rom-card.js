/* ============================================================================
 * ki-rom-card  v1.10.0  –  auto-bygd rom-popup fra KI Rom-integrasjonen
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
 *  temperatur: sensor.x           # overstyr (ellers første temp-sensor i rommet, ellers sensor.hus_temperature)
 *  reserve_temperatur / reserve_fuktighet: sensor.x   # annen reserve enn hus-sensorene
 *  fuktighet: sensor.x
 *  teller_suffix: _teller         # input_number.<klima>_teller brukes hvis den finnes
 *  farger: [var(--active-big), var(--blue), var(--purple), var(--green)]
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

  function sectionHeader(hass, ov, cfg, roomName) {
    const has = (e) => e && hass.states[e];
    const temp = cfg.temperatur || ov.temperatur[0] || (has(cfg.reserve_temperatur || FALLBACK_TEMP) ? (cfg.reserve_temperatur || FALLBACK_TEMP) : null);
    const hum = cfg.fuktighet || ov.fuktighet[0] || (has(cfg.reserve_fuktighet || FALLBACK_HUM) ? (cfg.reserve_fuktighet || FALLBACK_HUM) : null);
    const clim = ov.klima[0] && ov.klima[0].entity;
    const custom = {};
    if (clim) {
      custom.btn1 = {
        card: {
          type: 'custom:paper-buttons-row',
          styles: { display: 'flex', 'flex-direction': 'column', 'flex-wrap': 'wrap', 'border-radius': '30px' },
          buttons: [
            { icon: 'mdi:chevron-up', ripple: 'none', styles: { icon: { color: 'var(--gray100)' }, button: { background: 'var(--gray100)', 'border-radius': '50% 50% 0 0', width: '38px', height: '38px', 'z-index': 1 } } },
            { name: "{{ state_attr('" + clim + "', 'temperature') | round(0) }}°", ripple: 'none', styles: { name: { color: 'var(--gray100)' }, button: { background: 'var(--gray100)', 'border-radius': 0 } } },
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
    styles: { card: [{ background: 'none' }, { padding: '8px 0px' }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': size }, { 'font-weight': 500 }, { 'justify-self': 'end' }] },
  });
  const coverLabel = (e, name, pad) => ({
    type: 'custom:button-card', view_layout: { 'grid-area': 'one' }, name, entity: e,
    tap_action: { action: 'more-info' }, show_icon: false,
    styles: { card: [{ background: 'none' }, { padding: pad }, { overflow: 'visible' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'start' }] },
  });
  const presetBtn = (e, label, pos, first) => ({
    type: 'custom:button-card', name: label, show_icon: false,
    tap_action: { action: 'perform-action', perform_action: 'cover.set_cover_position', target: { entity_id: e }, data: { position: pos } },
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

  function sectionScener(hass, ov, roomName, ekstra) {
    const seen = new Set();
    const items = [];
    [...ov.skript, ...ov.scener, ...(ekstra || [])].forEach((raw) => {
      const e = typeof raw === 'string' ? raw : raw && raw.entity;
      if (!e || seen.has(e) || !/^(script|scene)\./.test(e)) return;
      seen.add(e);
      items.push({ e, kind: e.split('.')[0], navn: raw && raw.navn, ikon: raw && raw.ikon });
    });
    if (!items.length) return null;
    const buttons = items.map(({ e, kind, navn, ikon }) => {
      const st = hass.states[e] || { attributes: {} };
      const name = navn || cap(friendly(hass, e, roomName).replace(/^Lys /, ''));
      let icon = ikon || st.attributes.icon;
      if (!icon) {
        const hit = ICON_GUESS.find(([re]) => re.test(objId(e)));
        icon = hit ? hit[1] : (kind === 'scene' ? 'mdi:palette-outline' : 'mdi:script-text-outline');
      }
      return {
        icon, layout: 'icon_name_state', name,
        tap_action: kind === 'script'
          ? { action: 'call-service', service: e }
          : { action: 'call-service', service: 'scene.turn_on', target: { entity_id: e }, data: { transition: 1 } },
        styles: {
          name: { color: 'var(--gray800)' },
          button: { padding: '12px', width: '76px', height: '76px', 'flex-basis': 1, 'flex-shrink': 0, display: 'flex', 'background-color': 'var(--gray200)', 'border-radius': '24px', color: 'var(--white)' },
          icon: { '--mdc-icon-size': '26px', color: 'var(--gray800)' },
        },
      };
    });
    return {
      type: 'custom:paper-buttons-row',
      styles: { gap: '8px', 'justify-content': 'flex-start', overflow: 'scroll', margin: 0, 'padding-left': 0, width: '100%' },
      extra_styles: '::-webkit-scrollbar {\n  display: none;\n}\n',
      preset: 'button',
      buttons,
    };
  }

  function sectionLys(hass, ov, roomName) {
    if (!ov.lys.length) return null;
    const cards = ov.lys.map((e) => {
      const modes = (hass.states[e] || {}).attributes?.supported_color_modes || [];
      const onoff = !modes.length || (modes.length === 1 && modes[0] === 'onoff');
      const c = { type: 'custom:mysmart-light-control', entity: e, show_brightness: true, live_update: true };
      if (onoff) c.force_toggle_mode = true;
      return c;
    });
    return expander(
      [headerTitle('Lys', 'mdi:lamp'), headerCounter(activeCountTemplate(ov.lys, 'på', 'av'))],
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
            layout: 'icon', icon: i ? 'mdi:plus' : 'mdi:minus',
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

  function sectionEnheter(hass, ov, roomName, palette, cfg) {
    const flyttet = new Set([].concat((cfg && cfg.klima_ekstra) || [])
      .map((x) => (typeof x === 'string' ? x : x && x.entity)).filter(Boolean));
    ov = { ...ov, brytere: ov.brytere.filter((d) => !flyttet.has(d.entity)), vifter: ov.vifter.filter((d) => !flyttet.has(d.entity)) };
    if (!ov.brytere.length && !ov.vifter.length) return null;
    const wIds = unike([...ov.brytere, ...ov.vifter].map((d) => d.effekt).concat(ov.effekt_andre || []));
    const cards = [
      ...ov.brytere.map((d, i) => switchCard(hass, d.entity, d.effekt, friendly(hass, d.entity, roomName), palette[i % palette.length])),
      ...ov.vifter.map((d) => fanCard(hass, d.entity, friendly(hass, d.entity, roomName))),
    ];
    return expander(
      [headerTitle('Enheter', 'mdi:radio'), headerCounter(wIds.length ? sumWattTemplate(wIds) : '')],
      [{ square: false, type: 'grid', columns: 1, cards }]
    );
  }

  function climateCard(hass, e, powerSensor, hum, name, tellerSuffix) {
    const teller = 'input_number.' + objId(e) + tellerSuffix;
    const hasTeller = !!hass.states[teller];
    const active = powerSensor
      ? 'parseFloat(states["' + powerSensor + '"].state) > 10'
      : '(entity.attributes.hvac_action === "heating")';
    const colorTpl = T('return ' + active + ' ? "black" : "var(--gray1000)";');
    const bgTpl = T('return ' + active + ' ? "rgba(var(--highlight))" : "var(--gray100)";');
    const stepAction = (dir) => hasTeller
      ? { action: 'call-service', service: 'input_number.' + (dir > 0 ? 'increment' : 'decrement'), data: { entity_id: teller, amount: 1 } }
      : { action: 'call-service', service: 'climate.set_temperature', data: { entity_id: e, temperature: "{{ (state_attr('" + e + "','temperature') | float(20)) " + (dir > 0 ? '+' : '-') + ' 1 }}' } };
    const valueTpl = hasTeller
      ? T('return Math.round(states["' + teller + '"].state) + "°";')
      : T('return Math.round(entity.attributes.temperature) + "°";');
    const btn = (icon, radius, height, border, action, nameTpl) => {
      const b = { ripple: 'none', styles: { button: { background: bgTpl, 'border-radius': radius, width: '46px', height, 'z-index': 1, 'border-width': border, 'border-style': 'solid', 'border-color': 'var(--gray400)' } } };
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

  function sectionKlima(hass, ov, cfg, roomName) {
    /* Panelovner og andre varmekilder kan legges til med klima_ekstra – enten som
       climate-entitet eller som bryter med egen effektsensor. */
    const ekstra = [].concat(cfg.klima_ekstra || [])
      .map((x) => (typeof x === 'string' ? { entity: x } : x))
      .filter((d) => d && d.entity && hass.states[d.entity])
      .map((d) => ({ ...d, effekt: d.effekt || finnEffekt(hass, d.entity) }));
    const enheter = [...ov.klima, ...ekstra.filter((d) => !ov.klima.some((k) => k.entity === d.entity))];
    if (!enheter.length) return null;
    const hum = cfg.fuktighet || ov.fuktighet[0] || (hass.states[cfg.reserve_fuktighet || FALLBACK_HUM] ? (cfg.reserve_fuktighet || FALLBACK_HUM) : null);
    const wIds = unike(enheter.map((d) => d.effekt));
    const cards = enheter.map((d) => (d.entity.startsWith('climate.')
      ? climateCard(hass, d.entity, d.effekt, hum, friendly(hass, d.entity, roomName), cfg.teller_suffix)
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
    return expander(
      [headerTitle('Klima', 'mdi:thermostat'), headerCounter(wIds.length ? sumWattTemplate(wIds) : '')],
      body
    );
  }
  let klimaSwipeSeq = 0;

  // 160 px-kort i samme stil som klima-kortene: navn, "artist – tittel", albumbilde i sirkelen,
  // kontrollrad nederst (av/på · forrige · play/pause · neste · …). Grønt når det spiller.
  const mediaCard = (e, name) => {
    const ctlBtn = (icon, service, size, big) => ({
      layout: 'icon', icon, ripple: 'none',
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
      { type: 'custom:button-card', view_layout: { 'grid-area': 'one' }, name: 'Volum', show_icon: false, styles: { card: [{ background: 'none' }, { padding: '6px 12px' }, { '--mdc-ripple-press-opacity': 0 }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'start' }] } },
      { type: 'custom:my-slider-v2', view_layout: { 'grid-area': 'two' }, entity: e, mode: 'volume', allowTapping: true, allowSliding: true, styles: { container: [{ overflow: 'visible' }, { 'margin-top': '10px' }], card: [{ background: 'var(--gray100)' }, { 'border-radius': '4px' }, { height: '8px' }], progress: [{ background: 'var(--active-big)' }, { 'border-radius': '4px' }], thumb: [{ width: '18px' }, { height: '18px' }, { top: '-5px' }, { 'margin-right': '-4px' }, { 'border-radius': '50%' }, { background: 'var(--gray1000)' }], track: [{ background: 'none' }] } },
      { type: 'custom:button-card', view_layout: { 'grid-area': 'three' }, entity: e, name: T('return Math.floor((entity.attributes.volume_level || 0) * 100) + "%"'), show_icon: false, styles: { card: [{ background: 'none' }, { padding: '6px 0' }], name: [{ 'font-size': '14px' }, { 'font-weight': 500 }, { 'justify-self': 'end' }] } },
    ],
  });

  let mediaSwipeSeq = 0;
  function sectionMedia(hass, ov, roomName, cfg = {}) {
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
      [headerTitle('Media', 'mdi:speaker'), headerCounter(activeCountTemplate(ov.media, 'spiller', 'av', 'playing'))],
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

  function sectionSensorer(hass, ov, roomName) {
    if (!ov.sensorer.length && !ov.lysniva.length) return null;
    const ids = ov.sensorer.map((s) => s.entity);
    const cards = [
      ...ov.sensorer.map((s) => binarySensorCard(s.entity, friendly(hass, s.entity, roomName), s.klasse)),
      ...ov.lysniva.map((e) => luxCard(e, ov.lysniva.length > 1 ? friendly(hass, e, roomName) : 'Lys')),
    ];
    return expander(
      [headerTitle('Sensorer', 'mdi:motion-sensor'), headerCounter(ids.length ? activeCountTemplate(ids, 'aktiv', 'stille') : '')],
      [{ square: false, type: 'grid', columns: 1, cards }], '130px 0px'
    );
  }

  // ------------------------------------------------------------ generator
  const LIST_KEYS = ['lys', 'media', 'brytere', 'vifter', 'klima', 'gardiner', 'sensorer', 'skript', 'scener', 'temperatur', 'fuktighet', 'lysniva', 'effekt', 'effekt_andre'];

  /* Finner effektsensoren til en bryter når integrasjonen ikke har paret dem.
     Prøver kjente navnemønstre på samme slug: switch.fryseskap -> sensor.fryseskap_power. */
  function finnEffekt(hass, entity) {
    const slug = String(entity).split('.')[1];
    if (!slug) return null;
    const kandidater = [
      `sensor.${slug}_power`, `sensor.${slug}_effekt`, `sensor.${slug}_current_power_w`,
      `sensor.${slug}_power_w`, `sensor.${slug}_watt`, `sensor.${slug}_forbruk_na`,
    ];
    for (const id of kandidater) {
      const st = hass.states[id];
      if (st && String(st.attributes.device_class || '') === 'power') return id;
      if (st && /^w$|watt/i.test(String(st.attributes.unit_of_measurement || ''))) return id;
    }
    return null;
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
    ov.rom = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' '))).join(' + ');
    return ov;
  }

  function generate(hass, ovStates, cfg) {
    const ov = mergeOversikt(Array.isArray(ovStates) ? ovStates : [ovStates], cfg.skjul);
    parEffekt(hass, ov, cfg);
    const roomNames = ov.rooms.map((r) => r.rom || cap(r.prefix.replace(/_/g, ' ')));
    const roomName = roomNames.length === 1 ? (cfg.navn || roomNames[0]) : roomNames;
    const s = cfg.seksjoner;
    const order = cfg.rekkefolge || ['header', 'gardiner', 'scener', 'lys', 'enheter', 'klima', 'media', 'sensorer'];
    const builders = {
      // én header uansett antall rom: første temperatur-/fuktsensor og første klima (eller overstyring i cfg)
      header: () => sectionHeader(hass, ov, cfg, cfg.navn || (Array.isArray(roomName) ? roomName.join(' + ') : roomName)),
      gardiner: () => sectionGardiner(hass, ov, roomName),
      scener: () => sectionScener(hass, ov, roomName, cfg.scener_ekstra),
      lys: () => sectionLys(hass, ov, roomName),
      enheter: () => sectionEnheter(hass, ov, roomName, cfg.farger || PALETTE, cfg),
      klima: () => sectionKlima(hass, ov, cfg, roomName),
      media: () => sectionMedia(hass, ov, roomName, cfg),
      sensorer: () => sectionSensorer(hass, ov, roomName),
    };
    const cards = [];
    order.forEach((k) => { if (s[k] && builders[k]) { const c = builders[k](); if (c) cards.push(c); } });
    cards.push({ type: 'custom:gap-card' });
    return cards;
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
    lys: 'Vis lys', enheter: 'Vis enheter (brytere, vifter)', klima: 'Vis klima', media: 'Vis media', sensorer: 'Vis sensorer',
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
      if (!this._root) {
        this._root = document.createElement('div');
        this._root.style.display = 'flex';
        this._root.style.flexDirection = 'column';
        this.appendChild(this._root);
      }
      const gap = this._config.gap === undefined ? 8 : this._config.gap;
      this._root.style.gap = typeof gap === 'number' ? gap + 'px' : String(gap);
    }

    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      // Ytelse: sammenlign state-objektene på referanse (HA lager nytt objekt bare når entiteten endres)
      // i stedet for å JSON-serialisere attributtene ved hver hass-oppdatering.
      const ov = findOversikt(hass, this._config);
      if (!ov) { this._showError('KI Rom: fant ikke sensor.<rom>_oversikt for «' + [].concat(this._config.rom || this._config.entity).join(', ') + '» – er ki-rom ≥ 1.1 installert?'); return; }
      const changed = !this._lastOv || ov.length !== this._lastOv.length || ov.some((o, i) => o !== this._lastOv[i] && JSON.stringify(o.attributes) !== JSON.stringify(this._lastOv[i].attributes));
      if (changed || this._dirty) {
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
      // sikkerhetsnett: er kortet fortsatt tomt etter 3 s, bygg uansett
      setTimeout(() => { if (this.isConnected && !this._children.length && this._lastOv && !this._building) { this._dirty = false; this._rebuild(this._lastOv); } }, 3000);
    }
    disconnectedCallback() { if (this._io) { this._io.disconnect(); this._io = null; } this._visible = undefined; }

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
        const configs = generate(this._hass, ov, this._config);
        const els = [];
        for (const c of configs) {
          const el = await helpers.createCardElement(c);
          el.hass = this._hass;
          els.push(el);
        }
        this._root.innerHTML = '';
        delete this._root.dataset.error;
        els.forEach((el) => this._root.appendChild(el));
        this._children = els;
        this._pendingHass = null;
      } catch (err) {
        this._showError('KI Rom: ' + err.message);
      } finally {
        this._building = false;
        if (this._pending) { const p = this._pending; this._pending = null; this._rebuild(p); }
      }
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
  console.info('%c KI-ROM-CARD %c 1.7.0 ', 'background:#1e2327;color:#fff;border-radius:4px 0 0 4px', 'background:#4caf50;color:#000;border-radius:0 4px 4px 0');
})();

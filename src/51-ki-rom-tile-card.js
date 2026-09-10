/* ============================================================================
 * ki-rom-tile-card  v1.0.0  –  romflis til forsiden, auto-konfigurert fra KI Rom
 *
 *  type: custom:ki-rom-tile-card
 *  kind: rom                    # rom | las | alarm | garasje | kalender | gjoremal | navigate
 *  rom: stue                    # area_id (kind: rom)
 *  size: big                    # big (246px m/ termostat) | big_plain (246px uten) | small (142px) | row (66px pille)
 *  farge: var(--green)          # farge på ikon-sirkelen
 *  ikon: mdi:sofa               # standard: rommets ikon i HA
 *  navn: Stue                   # standard: romnavn
 *  path: '#stue'                # standard: '#<area_id>'
 *  teller: input_number.x       # standard: input_number.<første klima>_teller hvis den finnes
 *  varsel: binary_sensor.x      # "!"-merke når denne er on (standard: første dør/vindu i rommet)
 *
 *  kind: las      entity: lock.x           path: '#dor'
 *  kind: alarm    entity: select.x         path: '#alarm'   script: script.x (av/på-knapp)
 *  kind: garasje  entity: cover.x          path: '#garasje'
 *  kind: kalender entity: sensor.kalender  path: '#kalender'
 *  kind: gjoremal entity: sensor.todo_cnt  path: '#gjoremal'  sub_text: 2 ferdige
 *  kind: navigate ikon/main_text/sub_text/path
 * ========================================================================== */
(() => {
  const T = (s) => '[[[ ' + s + ' ]]]';
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const FALLBACK_TEMP = 'sensor.hus_temperature';
  const FALLBACK_HUM = 'sensor.hus_fuktighet';
  const DOOR_CLASSES = ['door', 'window', 'opening', 'garage_door'];

  function findOne(hass, rom) {
    if (!rom) return null;
    if (hass.states[rom]) return hass.states[rom];
    if (hass.states['sensor.' + rom + '_oversikt']) return hass.states['sensor.' + rom + '_oversikt'];
    return Object.values(hass.states).find((st) => st.entity_id.endsWith('_oversikt') && st.attributes.integrasjon === 'ki_rom' && st.attributes.area_id === rom) || null;
  }
  function allOversikt(hass) {
    return Object.values(hass.states)
      .filter((st) => st.entity_id.startsWith('sensor.') && st.entity_id.endsWith('_oversikt') && st.attributes.integrasjon === 'ki_rom' && st.attributes.area_id !== 'totalt')
      .sort((a, b) => (a.attributes.rom || '').localeCompare(b.attributes.rom || '', 'nb'));
  }

  const universalGrid = {
    grid: [
      { 'grid-template-areas': T('const subText = variables.sub_text == null ? "" : String(variables.sub_text).trim(); const hasSubText = subText !== ""; if (variables.size === "small") { return hasSubText ? \'"i l" "i n"\' : \'"i l"\'; } if (hasSubText) { return variables.alt_text ? \'"i i" "n n" "l alt"\' : \'"i i" "n n" "l l"\'; } return variables.alt_text ? \'"i alt" "l l"\' : \'"i i" "l l"\';') },
      { 'grid-template-columns': T('return variables.size === "small" ? "76px 1fr" : "1fr 1fr";') },
    ],
    custom_fields: { mode: [{ display: 'none' }] },
  };

  const tempTpl = (temp, hum) => T(
    'var temp = states["' + temp + '"] ? states["' + temp + '"].state : NaN; ' +
    (hum ? 'var hum = states["' + hum + '"] ? states["' + hum + '"].state : NaN; ' : 'var hum = NaN; ') +
    'return parseFloat(temp).toFixed(0) + "°" + (isNaN(parseFloat(hum)) ? "" : "<span style=\\"font-size:14px;line-height:1.5em;font-weight:400;opacity:0.7;margin-left:2px;\\">" + parseFloat(hum).toFixed(0) + "%</span>");'
  );

  // termostat-stepper (btn1) – input_number-teller hvis den finnes, ellers climate.set_temperature
  function stepper(hass, clim, teller) {
    const has = teller && hass.states[teller];
    const act = (dir) => has
      ? { action: 'call-service', service: 'input_number.' + (dir > 0 ? 'increment' : 'decrement'), target: { entity_id: [teller] }, data: { amount: 1 } }
      : { action: 'call-service', service: 'climate.set_temperature', data: { entity_id: clim, temperature: "{{ (state_attr('" + clim + "','temperature') | float(20)) " + (dir > 0 ? '+' : '-') + ' 1 }}' } };
    const name = has ? "{{ states('" + teller + "') | round(0) }}°" : "{{ state_attr('" + clim + "', 'temperature') | round(0) }}°";
    const btn = (radius, h, border) => ({ background: 'var(--gray200)', 'border-radius': radius, width: '46px', height: h, 'z-index': 1, 'border-width': border, 'border-style': 'solid', 'border-color': 'var(--gray400)' });
    return {
      card: {
        type: 'custom:paper-buttons-row',
        styles: { display: 'flex', 'flex-direction': 'column', 'flex-wrap': 'wrap' },
        buttons: [
          { icon: 'mdi:chevron-up', ripple: 'none', name: false, tap_action: act(1), styles: { icon: { color: 'var(--gray1000)' }, button: btn('40px 40px 0 0', '30px', '1px 1px 0 1px') } },
          { name, ripple: 'none', icon: false, styles: { name: { color: 'var(--gray1000)' }, button: btn(0, '22px', '0 1px 0 1px') } },
          { icon: 'mdi:chevron-down', ripple: 'none', name: false, tap_action: act(-1), styles: { icon: { color: 'var(--gray1000)' }, button: btn('0 0 40px 40px', '30px', '0 1px 1px 1px') } },
        ],
      },
    };
  }

  // ------------------------------------------------------------ romflis
  function roomTile(hass, cfg) {
    const ov = findOne(hass, cfg.rom);
    if (!ov) return null;
    const a = ov.attributes;
    const has = (e) => e && hass.states[e];
    const temp = cfg.temperatur || a.temperatur[0] || (has(FALLBACK_TEMP) ? FALLBACK_TEMP : null);
    const hum = cfg.fuktighet || a.fuktighet[0] || (has(FALLBACK_HUM) ? FALLBACK_HUM : null);
    const clim = cfg.klima || (a.klima[0] && a.klima[0].entity);
    const teller = cfg.teller || (clim ? 'input_number.' + clim.split('.')[1] + (cfg.teller_suffix || '_teller') : null);
    const name = cfg.navn || a.rom || cap(cfg.rom);
    const icon = cfg.ikon || a.ikon || 'mdi:home-outline';
    const path = cfg.path || ('#' + a.area_id);
    const color = cfg.farge || 'var(--green)';
    const varsel = cfg.varsel === false ? null : (cfg.varsel || ((a.sensorer || []).find((s) => DOOR_CLASSES.includes(s.klasse)) || {}).entity);
    const size = { medium: 'small', stor: 'big', stor_uten: 'big_plain', liten: 'row' }[cfg.size] || cfg.size || 'big';

    if (size === 'row') {
      return {
        type: 'custom:button-card', icon, label: name,
        trigger_update: [temp, hum].filter(Boolean),
        tap_action: { action: 'navigate', navigation_path: path },
        name: T('const t = states["' + temp + '"]; const h = ' + (hum ? 'states["' + hum + '"]' : 'null') + '; return (t ? parseFloat(t.state).toFixed(1) : "-") + "°" + (h ? " · " + parseFloat(h.state).toFixed(0) + "%" : "");'),
        show_label: true,
        styles: {
          card: [{ padding: 0 }, { overflow: 'visible' }],
          grid: [{ 'grid-template-areas': '"i l" "i n"' }, { 'grid-template-columns': '76px 1fr min-content' }, { 'grid-template-rows': '1fr 1fr' }],
          img_cell: [{ 'justify-self': 'start' }, { 'align-self': 'start' }, { background: color }, { margin: '4px 4px' }, { padding: '14px' }, { 'border-radius': '50%' }, { width: '30px' }, { height: '30px' }],
          icon: [{ width: '30px' }, { height: '30px' }, { color: 'var(--black)' }],
          label: [{ 'justify-self': 'start' }, { 'align-self': 'end' }, { 'font-size': '16px' }, { 'font-weight': 500 }, { color: 'var(--gray1000)' }, { padding: '1px 0' }],
          name: [{ 'justify-self': 'start' }, { 'align-self': 'start' }, { 'font-size': '14px' }, { color: 'var(--gray1000)' }, { opacity: '0.7' }, { padding: '1px 0' }],
        },
      };
    }

    const big = size === 'big' || size === 'big_plain';
    const withClim = size === 'big' && clim;
    const custom = { error: T('return "!"'), temp: temp ? tempTpl(temp, hum) : '' };
    if (withClim) custom.btn1 = stepper(hass, clim, teller);
    const card = {
      type: 'custom:button-card', icon, name: T('return ' + JSON.stringify(name)),
      entity: cfg.entity || ov.entity_id,
      triggers_update: [ov.entity_id, temp, hum, teller, varsel].filter(Boolean),
      tap_action: { action: 'navigate', navigation_path: path },
      state: varsel
        ? [{ operator: 'template', value: T('return states["' + varsel + '"] && states["' + varsel + '"].state === "on"'), styles: { custom_fields: { error: [{ display: 'block' }] } } }]
        : null,
      custom_fields: custom,
      styles: {
        card: [{ padding: '4px' }, { height: big ? '246px' : '142px' }, { overflow: 'visible' }],
        grid: [{ 'grid-template-areas': '"n n i" ". . btn1" ". . btn1" "temp temp btn1"' }, { 'grid-template-rows': '1fr min-content min-content min-content' }, { 'grid-template-columns': '1fr min-content min-content' }],
        icon: [{ width: '28px' }, { color: 'var(--black)' }],
        img_cell: [{ 'justify-self': 'end' }, { background: color }, { 'border-radius': '100%' }, { 'align-self': 'start' }, { width: '60px' }, { height: '60px' }],
        name: [{ 'justify-self': 'start' }, { 'align-self': 'start' }, { 'text-align': 'left' }, { 'font-size': '1em' }, { 'font-weight': 500 }, { color: 'var(--gray1000)' }, { padding: '14px' }],
        custom_fields: {
          error: [{ position: 'absolute' }, { padding: '2px' }, { right: '0px' }, { top: '-2px' }, { background: 'var(--red)' }, { width: '20px' }, { height: '20px' }, { 'border-radius': '50%' }, { display: 'none' }, { 'line-height': '20px' }, { 'font-weight': 900 }, { color: 'var(--white)' }],
          btn1: [{ 'align-self': 'end' }, { 'justify-self': 'end' }],
          temp: [{ 'justify-self': 'start' }, { 'font-size': withClim ? '2.2em' : '2.6em' }, { 'line-height': '1em' }, { 'font-weight': 300 }, { color: 'var(--gray1000)' }, { padding: '0 0 14px 14px' }],
        },
      },
    };
    return card;
  }

  // ------------------------------------------------------------ spesialfliser
  const iconBtn = (entity, icon, onState, tap) => ({
    card: {
      type: 'custom:button-card', entity, icon, show_name: false, show_state: false, show_label: false, tap_action: tap,
      styles: {
        card: [{ width: '58px' }, { height: '58px' }, { 'border-radius': '50%' }, { background: T('return entity.state === "' + onState + '" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";') }, { border: '1px solid rgba(250, 251, 252, 0.1)' }, { 'box-shadow': 'none' }, { padding: 0 }, { margin: 0 }],
        icon: [{ width: '30px' }, { height: '30px' }, { color: T('return entity.state === "' + onState + '" ? "var(--black)" : "var(--gray1000)";') }],
      },
    },
  });
  const navStyles = (withBtn) => ({
    ...universalGrid,
    ...(withBtn ? { card: [{ position: 'relative' }], custom_fields: { icon_btn: [{ position: 'absolute' }, { top: '4px' }, { left: '4px' }, { 'z-index': 2 }], mode: [{ display: 'none' }] } } : {}),
  });

  function lasTile(cfg) {
    const e = cfg.entity;
    return {
      type: 'custom:button-card', template: 'universal_navigate', entity: e, show_icon: false,
      tap_action: { action: 'navigate', navigation_path: cfg.path || '#dor' },
      variables: { size: 'small', icon: 'mdi:key', sub_text: cfg.sub_text || 'Dørlås', main_text: 'Låst', state_rule_1_value: 'unlocked', state_rule_1_main_text: 'Ulåst', state_rule_1_background_color: cfg.farge || 'var(--green)', state_rule_1_text_color: 'var(--black)' },
      custom_fields: { icon_btn: iconBtn(e, cfg.ikon || 'mdi:key', 'unlocked', { action: 'toggle' }) },
      styles: navStyles(true),
    };
  }

  function alarmTile(cfg) {
    const e = cfg.entity;
    const tap = cfg.script ? { action: 'perform-action', perform_action: cfg.script, target: {} } : { action: 'more-info' };
    return {
      type: 'custom:button-card', template: 'universal_navigate', entity: e,
      tap_action: { action: 'navigate', navigation_path: cfg.path || '#alarm' },
      variables: { size: 'small', icon: 'mdi:shield', sub_text: cfg.sub_text || 'Alarm', main_text: cfg.off_text || 'Dearmert', state_rule_1_value: cfg.on_state || 'armed', state_rule_1_icon: 'mdi:shield-off', state_rule_1_main_text: cfg.on_text || 'Armert', state_rule_1_background_color: cfg.farge || 'var(--active-big)', state_rule_1_text_color: 'var(--black)' },
      custom_fields: { icon_btn: iconBtn(e, cfg.ikon || 'mdi:shield', cfg.on_state || 'armed', tap) },
      styles: navStyles(true),
    };
  }

  function garasjeTile(cfg) {
    const e = cfg.entity;
    const path = cfg.path || '#garasje';
    return {
      type: 'custom:button-card', entity: e, template: 'universal_sensor',
      tap_action: { action: 'toggle' }, double_tap_action: { action: 'navigate', navigation_path: path }, hold_action: { action: 'navigate', navigation_path: path },
      variables: {
        size: 'small',
        img_cell_background: T('if (entity.state === "open") return "rgba(var(--highlight_active))"; return "rgba(250, 251, 252, 0.1)";'),
        sub_text: cfg.sub_text || 'Garasjeport',
        icon: T('if (entity.state === "open") return "mdi:garage-open"; return "mdi:garage";'),
        background_color: T('if (entity.state === "open") return "' + (cfg.farge || 'var(--green)') + '"; return "var(--gray100)";'),
        text_color: T('if (entity.state === "open") return "var(--gray100)"; return "var(--gray1000)";'),
        main_text: T('if (entity.state === "open") return "Åpen"; if (entity.state === "closed") return "Lukket"; return entity.state;'),
        badge_condition: T('return entity.state === "open";'), badge_text: '!', badge_color: 'var(--red)',
      },
    };
  }

  function kalenderTile(cfg) {
    const c = (v) => [{ color: v }];
    return {
      type: 'custom:button-card', entity: cfg.entity, show_icon: false, show_name: false,
      tap_action: { action: 'navigate', navigation_path: cfg.path || '#kalender' },
      state: [{
        operator: 'template', value: T('return entity.attributes.events && entity.attributes.events[0] && new Date(entity.attributes.events[0].start).toDateString() === new Date().toDateString()'),
        styles: { card: [{ background: 'var(--active-big)' }], custom_fields: { arrow: [{ 'border-top': '2px solid var(--gray000)' }], day: c('var(--gray000)'), time: c('var(--gray000)'), date: c('var(--gray000)'), event: c('var(--gray000)') } },
      }],
      styles: {
        grid: [{ 'grid-template-areas': '"day" "date" "arrow" "time" "event"' }, { 'grid-template-columns': '1fr' }, { 'grid-template-rows': 'min-content 1fr 1fr min-content min-content' }],
        card: [{ padding: '20px' }, { height: cfg.height || '245px' }],
        custom_fields: {
          arrow: [{ 'border-top': '2px solid var(--gray800)' }, { width: '20px' }, { 'align-self': 'end' }],
          day: [{ color: 'var(--gray800)' }, { 'justify-self': 'start' }, { 'align-self': 'start' }],
          time: [{ color: 'var(--gray800)' }, { 'justify-self': 'start' }, { 'align-self': 'end' }, { 'font-size': '1em' }, { 'font-weight': 500 }, { padding: '12px 0 6px 0' }],
          date: [{ color: 'var(--gray800)' }, { 'justify-self': 'start' }, { 'align-self': 'start' }, { 'font-size': '2em' }, { 'line-height': '1em' }, { 'font-weight': 300 }, { 'text-transform': 'uppercase' }],
          event: [{ color: 'var(--gray800)' }, { 'justify-self': 'start' }, { 'text-align': 'left' }, { width: 'calc(100% - 20px)' }, { 'text-overflow': 'ellipsis' }],
        },
      },
      custom_fields: {
        arrow: ' ',
        day: T('const ev = entity.attributes.events && entity.attributes.events[0]; return ev ? helpers.formatDateWeekday(ev.start) : "";'),
        date: T('const ev = entity.attributes.events && entity.attributes.events[0]; return ev ? helpers.formatDateShort(ev.start) : "Ingen";'),
        time: T('const ev = entity.attributes.events && entity.attributes.events[0]; if (!ev) return ""; return ev.start.includes("T") ? helpers.formatTime24h(ev.start) + " · " + helpers.formatTime24h(ev.end) : "Hele dagen";'),
        event: T('const ev = entity.attributes.events && entity.attributes.events[0]; return ev ? ev.summary : "Ingen hendelser";'),
      },
    };
  }

  function gjoremalTile(cfg) {
    return {
      type: 'custom:button-card', entity: cfg.entity, template: 'universal_sensor',
      tap_action: { action: 'navigate', navigation_path: cfg.path || '#gjoremal' },
      variables: {
        size: 'small', img_cell_background: 'rgba(250, 251, 252, 0.1)',
        sub_text: cfg.sub_text || '', icon: cfg.ikon || 'mdi:hammer-screwdriver',
        background_color: 'var(--gray100)', text_color: 'var(--gray1000)',
        main_text: T('return entity.state + " gjøremål"'),
      },
    };
  }

  function navigateTile(cfg) {
    return {
      type: 'custom:button-card', template: 'universal_navigate',
      ...(cfg.entity ? { entity: cfg.entity } : {}),
      tap_action: { action: 'navigate', navigation_path: cfg.path || '#' },
      variables: { size: 'small', icon: cfg.ikon || 'mdi:arrow-right', sub_text: cfg.sub_text || null, main_text: cfg.main_text || cfg.navn || '' },
      styles: navStyles(false),
    };
  }

  function generate(hass, cfg) {
    switch (cfg.kind || 'rom') {
      case 'rom': return roomTile(hass, cfg);
      case 'las': return lasTile(cfg);
      case 'alarm': return alarmTile(cfg);
      case 'garasje': return garasjeTile(cfg);
      case 'kalender': return kalenderTile(cfg);
      case 'gjoremal': return gjoremalTile(cfg);
      case 'navigate': return navigateTile(cfg);
      default: return null;
    }
  }

  // ------------------------------------------------------------ editor
  const LABELS = {
    kind: 'Type', rom: 'Rom', size: 'Størrelse', farge: 'Farge (CSS, f.eks. var(--green))', ikon: 'Ikon', navn: 'Navn',
    path: 'Popup-hash / sti', teller: 'Termostat-teller (input_number)', varsel: '«!»-varsel når denne er på', entity: 'Entitet',
    script: 'Skript for av/på-knappen (alarm)', sub_text: 'Undertekst', main_text: 'Hovedtekst',
  };
  const KINDS = [
    { value: 'rom', label: 'Rom (fra KI Rom)' }, { value: 'las', label: 'Dørlås' }, { value: 'alarm', label: 'Alarm' },
    { value: 'garasje', label: 'Garasjeport' }, { value: 'kalender', label: 'Kalender' }, { value: 'gjoremal', label: 'Gjøremål' }, { value: 'navigate', label: 'Naviger' },
  ];

  class KiRomTileEditor extends HTMLElement {
    setConfig(config) { this._config = { ...config }; this._render(); }
    set hass(hass) { this._hass = hass; this._render(); }
    _schema() {
      const kind = this._config.kind || 'rom';
      const s = [{ name: 'kind', selector: { select: { mode: 'dropdown', options: KINDS } } }];
      if (kind === 'rom') {
        s.push(
          { name: 'rom', required: true, selector: { select: { mode: 'dropdown', options: allOversikt(this._hass).map((st) => ({ value: st.attributes.area_id, label: st.attributes.rom || st.attributes.area_id })) } } },
          { name: 'size', selector: { select: { mode: 'dropdown', options: [{ value: 'big', label: 'Stor med klimaknapp' }, { value: 'big_plain', label: 'Stor uten klimaknapp' }, { value: 'small', label: 'Medium (142 px)' }, { value: 'row', label: 'Liten (66 px rad)' }] } } },
          { name: 'teller', selector: { entity: { domain: 'input_number' } } },
          { name: 'varsel', selector: { entity: { domain: 'binary_sensor' } } },
        );
      } else if (kind !== 'navigate') {
        const dom = { las: 'lock', alarm: ['select', 'alarm_control_panel'], garasje: 'cover', kalender: 'sensor', gjoremal: 'sensor' }[kind];
        s.push({ name: 'entity', required: true, selector: { entity: { domain: dom } } });
        if (kind === 'alarm') s.push({ name: 'script', selector: { entity: { domain: 'script' } } });
        if (kind === 'gjoremal' || kind === 'las' || kind === 'alarm' || kind === 'garasje') s.push({ name: 'sub_text', selector: { text: {} } });
      } else {
        s.push({ name: 'main_text', selector: { text: {} } }, { name: 'sub_text', selector: { text: {} } });
      }
      s.push({ name: 'navn', selector: { text: {} } }, { name: 'ikon', selector: { icon: {} } }, { name: 'farge', selector: { text: {} } }, { name: 'path', selector: { text: {} } });
      return s;
    }
    _render() {
      if (!this._hass || !this._config) return;
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (sc) => LABELS[sc.name] || sc.name;
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const v = { ...ev.detail.value };
          const out = { type: 'custom:ki-rom-tile-card' };
          Object.keys(v).forEach((k) => { if (v[k] !== undefined && v[k] !== null && v[k] !== '') out[k] = v[k]; });
          this._config = out;
          this._lastSchema = null;
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
          this._render();
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      const schema = this._schema();
      if (JSON.stringify(schema) !== this._lastSchema) { this._lastSchema = JSON.stringify(schema); this._form.schema = schema; }
      const { type, ...data } = this._config;
      if (JSON.stringify(data) !== this._lastData) { this._lastData = JSON.stringify(data); this._form.data = data; }
    }
  }

  // ------------------------------------------------------------ kortet
  class KiRomTileCard extends HTMLElement {
    static getConfigElement() { return document.createElement('ki-rom-tile-editor'); }
    static getStubConfig(hass) { const f = hass ? allOversikt(hass)[0] : null; return { kind: 'rom', rom: f ? f.attributes.area_id : 'stue', size: 'big' }; }

    setConfig(config) {
      if ((config.kind || 'rom') === 'rom' && !config.rom) throw new Error('ki-rom-tile-card: angi rom: <area_id>');
      if (['las', 'alarm', 'garasje', 'kalender', 'gjoremal'].includes(config.kind) && !config.entity) throw new Error('ki-rom-tile-card: angi entity');
      this._config = config;
      this._sig = null;
      if (!this._root) { this._root = document.createElement('div'); this.style.display = 'block'; this.appendChild(this._root); }
      const kind = config.kind || 'rom';
      const size = { medium: 'small', stor: 'big', stor_uten: 'big_plain', liten: 'row' }[config.size] || config.size || 'big';
      const h = kind === 'rom' ? ({ big: 246, big_plain: 246, small: 142, row: 66 }[size] || 246) : (kind === 'kalender' ? 245 : 66);
      this._root.style.minHeight = h + 'px';
    }

    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      const cfg = this._config;
      let extra = '';
      if ((cfg.kind || 'rom') === 'rom') {
        const ov = findOne(hass, cfg.rom);
        if (!ov) { this._error('KI Rom: fant ikke sensor.<rom>_oversikt for «' + cfg.rom + '»'); return; }
        extra = JSON.stringify(ov.attributes);
        // teller-eksistens påvirker generert konfig
        const clim = cfg.klima || (ov.attributes.klima[0] && ov.attributes.klima[0].entity);
        const teller = cfg.teller || (clim ? 'input_number.' + clim.split('.')[1] + (cfg.teller_suffix || '_teller') : null);
        extra += '|' + (teller && hass.states[teller] ? 1 : 0);
      }
      const sig = JSON.stringify(cfg) + '|' + extra;
      if (sig !== this._sig) { this._sig = sig; this._rebuild(); return; }
      if (this._card) this._card.hass = hass;
    }

    _error(msg) {
      if (this._root.dataset.error === msg) return;
      this._root.dataset.error = msg; this._card = null;
      this._root.innerHTML = '<div style="padding:16px;border-radius:24px;background:var(--gray200);color:var(--gray1000);font-size:14px">' + msg + '</div>';
    }

    async _rebuild() {
      try {
        const helpers = await window.loadCardHelpers();
        const conf = generate(this._hass, this._config);
        if (!conf) { this._error('KI Rom: ukjent kind «' + this._config.kind + '»'); return; }
        const el = await helpers.createCardElement(conf);
        el.hass = this._hass;
        this._root.innerHTML = ''; delete this._root.dataset.error;
        this._root.appendChild(el); this._card = el;
      } catch (err) { this._error('KI Rom: ' + err.message); }
    }

    getCardSize() { return this._card && this._card.getCardSize ? this._card.getCardSize() : 3; }
  }

  // eksponer generatoren så ki-hjem-card kan legge fliser rett inn som button-card-konfig
  window.KI = window.KI || {};
  window.KI.romTileConfig = generate;

  if (!customElements.get('ki-rom-tile-editor')) customElements.define('ki-rom-tile-editor', KiRomTileEditor);
  if (!customElements.get('ki-rom-tile-card')) customElements.define('ki-rom-tile-card', KiRomTileCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'ki-rom-tile-card', name: 'KI Rom flis', description: 'Romflis til forsiden (temperatur, termostat) fra KI Rom, pluss dørlås/alarm/garasje/kalender/gjøremål', preview: false });
})();

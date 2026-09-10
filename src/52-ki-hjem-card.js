/* ============================================================================
 * ki-hjem-card  v1.0.0  –  hele simple-tabs-blokken på forsiden, auto fra KI Rom
 *
 *  type: custom:ki-hjem-card
 *  etasjer: auto          # lager én fane per HA-etasje (rom sortert, to kolonner, size: big)
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

  // ---- et element i en liste -> kortkonfig
  function item(it, romCfg, gap) {
    if (!it) return null;
    if (it.swipe) {
      const sw = it.swipe;
      const cards = (sw.cards || []).map((c) => item(c, romCfg)).filter(Boolean);
      if (sw.type === 'plain') return { type: 'custom:swipe-card', cards };
      return { type: 'custom:css-swipe-card', cardId: sw.cardId || 'swipe_dashboard1', height: sw.height || '266px', pagination: sw.pagination !== false, custom_css: SWIPE_CSS, cards };
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

  // ---- auto: én fane per etasje
  function autoFloorTabs(hass, cfg) {
    const romCfg = cfg.rom || {};
    const floors = new Map();
    allOversikt(hass).forEach((st) => {
      const a = st.attributes;
      if ((cfg.hopp_over || []).includes(a.area_id)) return;
      if (romCfg[a.area_id] && romCfg[a.area_id].skjul) return;
      const key = a.etasje_id || '__uten';
      if (!floors.has(key)) floors.set(key, { navn: a.etasje || cfg.uten_etasje_navn || 'Rom', niva: a.etasje_niva ?? 999, rom: [] });
      floors.get(key).rom.push(a.area_id);
    });
    const list = [...floors.values()].sort((x, y) => (x.niva - y.niva) || x.navn.localeCompare(y.navn, 'nb'));
    return list.map((f) => {
      const venstre = [], hoyre = [];
      f.rom.forEach((r, i) => {
        const o = romCfg[r] || {};
        const tile = { rom: r, size: o.size || 'big', farge: o.farge || FARGER[i % FARGER.length] };
        (o.kolonne === 'hoyre' || (!o.kolonne && i % 2)) ? hoyre.push(tile) : venstre.push(tile);
      });
      return { title: f.navn, kolonner: { venstre, hoyre } };
    });
  }

  function generate(hass, cfg) {
    const romCfg = cfg.rom || {};
    const explicit = (cfg.tabs || []).map((t) => buildTab(t, romCfg));
    let tabs = explicit;
    if (cfg.etasjer === 'auto' || cfg.etasjer === true) {
      const auto = autoFloorTabs(hass, cfg).map((t) => buildTab(t, romCfg));
      const pos = cfg.plasser === 'foran' ? 0 : (typeof cfg.plasser === 'number' ? cfg.plasser : Math.min(1, explicit.length));
      tabs = [...explicit.slice(0, pos), ...auto, ...explicit.slice(pos)];
    }
    return {
      type: 'custom:simple-tabs',
      'pre-load': true, alignment: cfg.alignment || 'start', container_padding: '10px',
      'background-color': 'transparent', 'border-color': 'transparent',
      'text-color': 'rgba(255, 255, 255, 0.72)', 'hover-color': 'rgba(255, 255, 255, 0.95)',
      container_background: 'transparent',
      tabs,
      card_mod: { style: TABS_STYLE },
    };
  }

  class KiHjemCard extends HTMLElement {
    static getStubConfig() { return { etasjer: 'auto' }; }
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
      } catch (err) {
        this._root.innerHTML = '<div style="padding:16px;border-radius:24px;background:var(--gray200);color:var(--gray1000);font-size:14px">KI Hjem: ' + err.message + '</div>';
      }
    }
    getCardSize() { return this._card && this._card.getCardSize ? this._card.getCardSize() : 8; }
  }

  if (!customElements.get('ki-hjem-card')) customElements.define('ki-hjem-card', KiHjemCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'ki-hjem-card', name: 'KI Hjem', description: 'Hele fane-blokken på forsiden (Hjem / etasjer / Aktuelt) bygget fra KI Rom', preview: false });
})();

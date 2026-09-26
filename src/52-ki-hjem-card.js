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
 *  Tilpass Hjem (langt trykk på fanerada, eller tilpass_knapp: true) – hver bruker velger selv, lagret
 *  i HA per bruker (frontend user data «ki_hjem»). Verdiene under er standardene brukeren starter fra:
 *    romkort: stor | middels | liten      # størrelsen på romflisene i etasjefanene
 *    klimaknapp: false                    # uten +/– for settpunkt på de store flisene
 *    bunn: -120                           # avstand under kortet i px (negativ trekker neste kort opp); kan settes i Tilpass Hjem
 *    fane_bredde: standard | kompakt | full
 *    fane_hoyde: standard | lav | middels | hoy | ekstra
 *    fane_rekkefolge: [hjem, 'etg:forste', aktuelt]   # nøkler: hjem, etg:<etasje_id>, aktuelt, batterier, fane:<tittel>
 *    skjul: ['etg:kjeller', 'sek:alarm']  # skjulte faner og seksjoner (sek:topp|rom|alarm|hoyre|stov)
 *    seksjoner: [rom, topp, alarm]        # rekkefølgen i venstre kolonne på Hjem-fanen
 *    alle_rom: false                      # fanen «Alle rom» (alle rommene samlet) – av som standard
 *    tilpass: false                       # slår av panelet
 *  Panelet åpnes også fra ki-floating-navbar: «…» → «Tilpass Hjem» sender window-hendelsen
 *  `ki-hjem-tilpass` ({detail:{apen:true|false}}). Kortet teller seg i window.__kiHjem og sender
 *  `ki-hjem-registrert` når det kobles til/fra, så navbaren vet om valget skal vises.
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
  /* ---- «Tilpass Hjem»: brukerens valg. Konfigurasjonen er standarden; det brukeren velger
     i panelet ligger i `cfg.__u` (fra KI.ud(hass, 'ki_hjem')) og vinner.
     Formen på det som lagres:
       { rekkefolge: [nøkkel …], skjul: [nøkkel | 'sek:<del>' | 'flis:<id>' …], etasjer: { <etasje_id|hjem>: [area_id …] },
         hjem_hoyre: [area_id …] (rommene i Hjem-fanens høyre swipe), alle_rom: bool,
         seksjoner: ['topp','rom','alarm'], romkort: 'stor'|'middels'|'liten', klimaknapp: bool,
         fane: { bredde: 'standard'|'kompakt'|'full', hoyde: 'standard'|'lav'|'middels'|'hoy'|'ekstra' } } */
  const FANE_H = { lav: 30, middels: 38, hoy: 46, 'høy': 46, ekstra: 56 };
  const ROMKORT = { stor: 'big', middels: 'small', liten: 'row' };
  const SEK_V = ['topp', 'rom', 'alarm'];
  const SEK_NAVN = { topp: 'Lås og garasje', rom: 'Rom', alarm: 'Alarm', hoyre: 'Rom til høyre', stov: 'Fliser' };
  const bruker = (cfg) => (cfg && cfg.__u) || {};
  function prefs(cfg) {
    const u = bruker(cfg), f = u.fane || {};
    return {
      romkort: u.romkort || cfg.romkort || null,
      klima: u.klimaknapp != null ? u.klimaknapp !== false : cfg.klimaknapp !== false,
      hoyde: String(f.hoyde || cfg.fane_hoyde || 'standard').toLowerCase(),
      bredde: String(f.bredde || cfg.fane_bredde || 'standard').toLowerCase(),
      /* Avstand under hele kortet (px, kan være negativ): trekker neste kort (f.eks. søppel) opp. */
      bunn: Number(u.bunn != null ? u.bunn : (cfg.bunn || 0)) || 0,
    };
  }
  /* Skjulte faner og seksjoner. Har brukeren valgt noe, er det brukerens liste som gjelder
     (den ble fylt med konfigurasjonens skjulte da panelet ble brukt første gang). */
  function skjulte(cfg) {
    const u = bruker(cfg);
    if (Array.isArray(u.skjul)) return medAlle(new Set(u.skjul), cfg);
    const s = new Set(cfg.skjul || []);
    Object.entries(cfg.etasje_innstillinger || {}).forEach(([k, v]) => { if (v && v.vis === false) s.add('etg:' + k); });
    return medAlle(s, cfg);
  }
  /* «Alle rom»-fanen er av til brukeren (eller alle_rom: true) slår den på – også for brukere som
     alt har en skjul-liste fra før fanen fantes. */
  function visAlle(cfg) { const u = bruker(cfg); return u.alle_rom != null ? !!u.alle_rom : !!cfg.alle_rom; }
  function medAlle(s, cfg) { if (visAlle(cfg)) s.delete('alle'); else s.add('alle'); return s; }
  /* Flisstørrelsen etter valgene: brukerens romkort gjelder alle rom, konfigurasjonens bare
     rom uten egen størrelse. Klimaknappen av gjør «stor» til «stor uten». */
  function flisStr(size, cfg, egen) {
    const u = bruker(cfg), p = prefs(cfg);
    let s = size;
    if (u.romkort) { if (ROMKORT[u.romkort]) s = ROMKORT[u.romkort]; }   // «monster» = som mønsteret
    else if (!egen && cfg.romkort && ROMKORT[cfg.romkort]) s = ROMKORT[cfg.romkort];
    s = { medium: 'small', stor: 'big', stor_uten: 'big_plain', liten: 'row' }[s] || s || 'big';
    if (!p.klima && s === 'big') s = 'big_plain';
    return s;
  }
  /* Fanerada i simple-tabs: høyde og bredde. Legges i en egen stil i shadowRoot ved siden
     av TABS_STYLE, så den kan byttes uten å bygge kortet på nytt. */
  function faneCss(cfg) {
    const p = prefs(cfg), h = FANE_H[p.hoyde];
    let css = '';
    if (h) css += '.tab-button { height:' + h + 'px !important; min-height:' + h + 'px !important; padding-top:0 !important; padding-bottom:0 !important; line-height:1 !important; }\n';
    if (p.bredde === 'kompakt') css += '.tab-button { padding-left:12px !important; padding-right:12px !important; }\n';
    /* Plass til Tilpass-knappen til høyre på rada. */
    if (cfg.tilpass_knapp && cfg.tilpass !== false) css += '.tabs-container { padding-right:48px !important; }\n';
    if (p.bredde === 'full') css += '.tabs { width:100% !important; display:flex !important; } .tab-button { flex:1 1 0 !important; min-width:0 !important; justify-content:center; text-align:center; }\n';
    return css;
  }

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
      const size = flisStr(o.size || pat[kol[side].length % pat.length], cfg, !!o.size);
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

  // ---- auto: én fane per etasje (se alleFaner)
  /* Alle etasjene, også skjulte og tomme, i rekkefølge. Rommene brukeren har valgt for en
     etasje i «Tilpass Hjem» vinner over etasjen i Home Assistant (og står i valgt rekkefølge). */
  function floorList(hass, cfg) {
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
    const E = bruker(cfg).etasjer || {};
    const byId = new Map(alle.map((a) => [a.area_id, a]));
    const valgt = new Set();
    Object.keys(E).forEach((k) => { if (k !== 'hjem' && Array.isArray(E[k]) && floors.has(k)) E[k].forEach((id) => valgt.add(id)); });
    floors.forEach((f, k) => {
      f.rom = Array.isArray(E[k]) ? E[k].map((id) => byId.get(id)).filter(Boolean)
        : f.rom.filter((a) => !valgt.has(a.area_id));
    });
    const fc = cfg.etasje_innstillinger || {};
    return [...floors.entries()]
      .map(([k, f]) => ({ ...f, key: k, ord: (fc[k] || {}).rekkefolge ?? (f.niva === 999 ? 999 : f.niva) }))
      .sort((x, y) => (x.ord - y.ord) || x.navn.localeCompare(y.navn, 'nb'));
  }

  function seksjonsRekke(cfg) {
    const r = (bruker(cfg).seksjoner || cfg.seksjoner || SEK_V).filter((k, i, a) => SEK_V.includes(k) && a.indexOf(k) === i);
    SEK_V.forEach((k) => { if (!r.includes(k)) r.push(k); });
    return r;
  }

  /* Flisene i Hjem-fanens «stov»-kolonne, hver med en fast nøkkel (flis:<…>) som brukeren kan
     skjule i «Tilpass Hjem». Nøkkelen bygges av innholdet, ikke plassen, så den tåler omsortering. */
  const KIND_NAVN = { navigate: 'Flis', gjoremal: 'Gjøremål', kalender: 'Kalender', las: 'Dørlås', garasje: 'Garasjeport', alarm: 'Alarm', rom: 'Rom' };
  const KIND_IKON = { gjoremal: 'mdi:checkbox-marked-circle-outline', kalender: 'mdi:calendar-month-outline', las: 'mdi:lock-outline', garasje: 'mdi:garage', alarm: 'mdi:shield-home-outline', rom: 'mdi:sofa-outline' };
  function stovFliser(h) {
    const brukt = new Set();
    return ((h && Array.isArray(h.stov)) ? h.stov : []).map((t, i) => {
      t = t || {};
      const sw = t.swipe ? (t.swipe.cards || []) : null;
      const x = sw ? (sw[0] || {}) : t;
      let key = 'flis:' + String(t.id || x.main_text || x.navn || x.rom || x.entity || x.path || x.kind || x.type || i).toLowerCase();
      while (brukt.has(key)) key += '+';
      brukt.add(key);
      const st = x.entity && curHass && curHass.states[x.entity];
      let navn = String(x.main_text || x.navn || x.rom || (x.kind && x.kind !== 'navigate' && KIND_NAVN[x.kind]) || (st && st.attributes.friendly_name) || x.entity || 'Flis').replace(/<br>|\\n|\n/g, ' ');
      if (sw && sw.length > 1) navn += ' + ' + (sw.length - 1) + ' til';
      return { key, navn, ikon: x.ikon || x.icon || KIND_IKON[x.kind] || 'mdi:card-outline', sveip: !!sw, t };
    });
  }

  // ---- auto: Hjem-fanen med samme layout som før ("stue kjokken" / "stue stov")
  //  hjem: { las: lock.x, garasje: cover.x, alarm: { entity, script }, kalender: sensor.x,
  //          rom: [stue, inngang, ute] (venstre swipe), rom_hoyre: [pult, kjokken], stov: [ ...fliser ] }
  function autoHjemTab(hass, cfg) {
    const h = typeof cfg.hjem === 'object' && cfg.hjem ? cfg.hjem : {};
    const romCfg = cfg.rom || {};
    const alle = rooms(hass, cfg).map((a) => a.area_id);
    const finnes = (r) => hass.states['sensor.' + r + '_oversikt'] || alle.includes(r);
    let venstreRom = (h.rom || alle.slice(0, Math.max(2, Math.ceil(alle.length * 0.6)))).filter(finnes);
    let hoyreRom = (h.rom_hoyre || alle.filter((r) => !venstreRom.includes(r))).filter(finnes);
    /* Rommene brukeren har valgt for Hjem-fanen: fordelt som standarden, ~60 % til venstre. */
    const valgtHjem = (bruker(cfg).etasjer || {}).hjem, valgtH = bruker(cfg).hjem_hoyre;
    if (Array.isArray(valgtHjem)) {
      const l = valgtHjem.filter(finnes);
      /* Har brukeren valgt side for rommene (Tilpass Hjem → Hjem → Venstre/Høyre), gjelder det;
         ellers som standarden, ~60 % til venstre. */
      if (Array.isArray(valgtH)) { venstreRom = l.filter((r) => !valgtH.includes(r)); hoyreRom = l.filter((r) => valgtH.includes(r)); }
      else { const n = Math.max(2, Math.ceil(l.length * 0.6)); venstreRom = l.slice(0, n); hoyreRom = l.slice(n); }
    }
    const skj = skjulte(cfg);
    const tile = (r, i) => ({ rom: r, size: flisStr('big', { ...cfg, romkort: null, __u: { ...bruker(cfg), romkort: null } }, true), farge: (romCfg[r] || {}).farge || FARGER[i % FARGER.length] });

    const topp = [];
    if (h.las) topp.push({ kind: 'las', entity: h.las, path: h.las_path || '#dor' });
    if (h.garasje) topp.push({ kind: 'garasje', entity: h.garasje, path: h.garasje_path || '#garasje' });

    const store = venstreRom.map(tile);
    if (h.kalender) store.push({ kind: 'kalender', entity: h.kalender, path: h.kalender_path || '#kalender' });

    /* Venstre kolonne i den rekkefølgen brukeren (eller `seksjoner:`) har valgt. */
    const deler = {
      topp: () => (topp.length ? { swipe: { type: 'plain', cards: topp } } : null),
      rom: () => (store.length ? { swipe: { type: h.swipe_type || 'css', height: '266px', pagination: true, cards: store } } : null),
      alarm: () => (h.alarm ? { kind: 'alarm', ...(typeof h.alarm === 'string' ? { entity: h.alarm } : h.alarm), path: (h.alarm && h.alarm.path) || '#alarm' } : null),
    };
    const stue = [];
    seksjonsRekke(cfg).forEach((k) => { if (skj.has('sek:' + k)) return; const d = deler[k](); if (d) stue.push(d); });

    const omrader = { stue };
    if (hoyreRom.length && !skj.has('sek:hoyre')) omrader.kjokken = [{ swipe: { type: h.swipe_type || 'css', height: '266px', pagination: true, cards: hoyreRom.map((r, i) => tile(r, i + venstreRom.length)) } }];
    const fliser = stovFliser(h), synlige = fliser.filter((f) => !skj.has(f.key)).map((f) => f.t);
    if (synlige.length && !skj.has('sek:stov')) omrader.stov = synlige;

    const areas = omrader.stov ? '"stue kjokken"\n"stue stov"\n"stue stov"\n' : (omrader.kjokken ? '"stue kjokken"\n' : '"stue"\n');
    return {
      title: h.title || 'Hjem',
      _rom: [...venstreRom, ...hoyreRom],
      _hoyre: hoyreRom.slice(),
      _fliser: fliser,
      _deler: [...SEK_V.filter((k) => k !== 'topp' || topp.length).filter((k) => k !== 'alarm' || h.alarm), 'hoyre', ...(h.stov && h.stov.length ? ['stov'] : [])],
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

  /* Alle fanene kortet kan vise, med en fast nøkkel hver: hjem, etg:<etasje_id>, aktuelt,
     batterier, fane:<tittel>. Nøkkelen er det brukerens rekkefølge og skjulte faner peker på. */
  function alleFaner(hass, cfg) {
    swipeSeq = 0;
    curHass = hass;
    const romCfg = cfg.rom || {};
    const brukt = new Set();
    const nokkel = (tittel) => {
      const n = String(tittel || '').toLowerCase();
      let k = ['hjem', 'aktuelt', 'batterier'].includes(n) ? n : 'fane:' + n;
      while (brukt.has(k)) k += '+';
      brukt.add(k);
      return k;
    };
    const explicit = (cfg.tabs || []).map((t) => ({ key: nokkel(t.title), navn: t.title || 'Fane', tab: buildTab(t, romCfg) }));
    const hasHjem = explicit.some((t) => t.key === 'hjem');
    let tabs = explicit;
    // Hjem-fanen er standard på (hjem: false skrur av); egen «Hjem» i tabs vinner
    if (cfg.hjem !== false && !hasHjem) {
      const h = autoHjemTab(hass, cfg);
      tabs = [{ key: 'hjem', navn: h.title, auto: true, rom: h._rom, hoyre: h._hoyre, fliser: h._fliser, deler: h._deler, tab: buildTab(h, romCfg) }, ...explicit];
    }
    let etter = tabs.findIndex((t) => t.key === 'hjem') + 1;
    if (cfg.etasjer !== false && cfg.etasjer !== 'manuell') {
      const fc = cfg.etasje_innstillinger || {};
      const auto = floorList(hass, cfg).map((f) => {
        const title = (fc[f.key] || {}).navn || f.navn;
        return { key: 'etg:' + f.key, etg: f.key, navn: title, rom: f.rom.map((a) => a.area_id),
          tab: f.rom.length ? buildTab({ title, kolonner: columnsFor(f.rom, cfg) }, romCfg) : null };
      });
      const idx = tabs.findIndex((t) => t.key === 'hjem');
      const pos = cfg.plasser === 'foran' ? 0 : (typeof cfg.plasser === 'number' ? cfg.plasser : idx + 1);
      tabs = [...tabs.slice(0, pos), ...auto, ...tabs.slice(pos)];
      etter = pos + auto.length;
    }
    /* «Alle rom»: alle rommene samlet i én fane (som kd-dokkens «Alle»). Av til brukeren slår den på;
       en skjult fane bygges ikke (generate filtrerer den bort før kortene lages). */
    const alleR = rooms(hass, cfg);
    if (alleR.length && !tabs.some((t) => t.key === 'alle')) {
      const title = cfg.alle_rom_navn || 'Alle rom';
      tabs.splice(Math.max(0, Math.min(etter, tabs.length)), 0, { key: 'alle', navn: title, rom: alleR.map((a) => a.area_id), alle: true,
        tab: visAlle(cfg) ? buildTab({ title, kolonner: columnsFor(alleR, cfg) }, romCfg) : null });
    }
    const keys = tabs.map((t) => t.key);
    if (cfg.aktuelt && !keys.includes('aktuelt')) { const t = aktueltTab(cfg); if (t) tabs.push({ key: 'aktuelt', navn: t.title, tab: t }); }
    if (cfg.batterier && !keys.includes('batterier')) { const t = batterierTab(cfg); tabs.push({ key: 'batterier', navn: t.title, tab: t }); }
    return tabs;
  }

  /* Brukerens rekkefølge. Faner den ikke kjenner (en ny etasje) blir stående der de er. */
  function ordne(faner, cfg) {
    const rek = bruker(cfg).rekkefolge || cfg.fane_rekkefolge;
    if (!Array.isArray(rek) || !rek.length) return faner;
    const kjent = faner.filter((f) => rek.includes(f.key)).sort((a, b) => rek.indexOf(a.key) - rek.indexOf(b.key));
    let i = 0;
    return faner.map((f) => (rek.includes(f.key) ? kjent[i++] : f));
  }

  function generate(hass, cfg, ut) {
    const faner = ordne(alleFaner(hass, cfg), cfg);
    const skj = skjulte(cfg);
    let vis = faner.filter((f) => f.tab && !skj.has(f.key));
    if (!vis.length) vis = faner.filter((f) => f.tab).slice(0, 1);
    if (ut) ut.faner = faner;
    const tabs = vis.map((f) => f.tab);
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
  function injectTabsStyle(el, tries = 0, cfg = null) {
    const sr = el && el.shadowRoot;
    if (sr) {
      if (!sr.querySelector('style[data-ki-hjem]')) { const st = document.createElement('style'); st.dataset.kiHjem = '1'; st.textContent = TABS_STYLE; sr.appendChild(st); }
      if (cfg) settFaneMal(el, cfg);
      /* Samme glidende pille og dra-funksjon som i ki-tabs-card. Den settes inn i
         simple-tabs sin shadowRoot, ikke i fila — en lapp i den minifiserte koden
         ville forsvunnet ved neste oppdatering av kortet. */
      if (KI.pillefaner) KI.pillefaner(el);
      return;
    }
    if (tries < 40) setTimeout(() => injectTabsStyle(el, tries + 1, cfg), 50);
  }
  /* Høyde og bredde på fanerada (Tilpass Hjem → Faner). Egen stil etter TABS_STYLE, så den
     vinner, og kan byttes uten ny oppbygging. Pilla (KI.pillefaner) måler knappene med
     ResizeObserver og følger etter av seg selv. */
  function settFaneMal(el, cfg) {
    const sr = el && el.shadowRoot;
    if (!sr) return;
    let st = sr.querySelector('style[data-ki-hjem-mal]');
    if (!st) { st = document.createElement('style'); st.dataset.kiHjemMal = '1'; sr.appendChild(st); }
    const css = faneCss(cfg);
    if (st.textContent !== css) st.textContent = css;
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

  /* ---------------------------------------------------------------- editor
   * Deklarativ: hvert felt eier sin egen sti i konfigurasjonen, og lesing og
   * skriving skjer rett på den. Et nytt felt legges dermed til på ett sted, i
   * stedet for i skjema, lesing, lagring og etikettliste som før.
   *
   * Like viktig: skrivingen skjer på en kopi av konfigurasjonen. Alt editoren
   * ikke kjenner — nye nøkler, ting du har satt for hånd — blir stående av seg
   * selv. Den gamle versjonen bygget konfigurasjonen opp fra bunnen ved hver
   * endring og måtte derfor liste opp alt den skulle bevare.
   */

  // les/skriv på «hjem.alarm.script»-form. Tomme verdier fjernes, og objekter som
  // blir tomme ryddes bort, så konfigurasjonen ikke fylles med blanke nøkler.
  function les(obj, vei) {
    return String(vei).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function skriv(obj, vei, verdi) {
    const deler = String(vei).split('.');
    const siste = deler.pop();
    let o = obj;
    for (const k of deler) {
      if (typeof o[k] !== 'object' || o[k] === null) o[k] = {};
      o = o[k];
    }
    const tom = verdi === undefined || verdi === null || verdi === ''
      || (Array.isArray(verdi) && !verdi.length);
    if (tom) delete o[siste]; else o[siste] = verdi;
    // rydd tomme foreldre
    for (let i = deler.length - 1; i >= 0; i--) {
      const foreldre = deler.slice(0, i).reduce((x, k) => x[k], obj);
      const navn = deler[i];
      const v = foreldre[navn];
      if (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) delete foreldre[navn];
    }
    return obj;
  }

  const F = {
    tekst: (vei, etikett, hjelp) => ({ vei, etikett, hjelp, selector: { text: {} } }),
    ent: (vei, etikett, domain) => ({ vei, etikett, selector: { entity: domain ? { domain } : {} } }),
    ikon: (vei, etikett) => ({ vei, etikett, selector: { icon: {} } }),
    tall: (vei, etikett, min, max) => ({ vei, etikett,
      selector: { number: { min, max, mode: 'box' } },
      skriv: (cfg, v) => skriv(cfg, vei, v === '' || v === null || v === undefined ? undefined : Number(v)) }),
    valg: (vei, etikett, options, standard) => ({ vei, etikett,
      selector: { select: { mode: 'dropdown', options } },
      les: (cfg) => les(cfg, vei) || standard,
      /* Standardverdien lagres som ingenting. For etasjefeltet er standarden «__ha»,
         altså «følg området» — og da skal nøkkelen ut av konfigurasjonen, ikke settes
         til strengen «__ha». */
      skriv: (cfg, v) => skriv(cfg, vei, v === standard ? undefined : v) }),
    /* Bryter der «på» er standard og lagres som ingenting. `nei` er verdien som
       skrives når den slås av — `false` for hjem/etasjer, `true` for rom.skjul. */
    /* Av/på-bryter på en vei som også kan holde et HELT objekt.
     *
     * Den gamle skrev `undefined` når bryteren sto på, og `skriv` sletter da veien.
     * For `hjem` — som er et objekt med lås, alarm, kalender, rom og `stov` — betød
     * det at ett trykk i editoren slettet hele oppsettet. Det er nettopp det som
     * skjedde: `hjem.stov` forsvant ved hver lagring.
     *
     * Nå røres et objekt aldri når bryteren står på: «på» er standarden, og da skal
     * konfigurasjonen bare la veien være som den er. Slår man den AV, settes `nei`
     * (vanligvis `false`), og det erstatter objektet med vilje — det er den eneste
     * gangen man faktisk har bedt om det. */
    bryter: (vei, etikett, { nei = false, snudd = false } = {}) => ({ vei, etikett,
      selector: { boolean: {} },
      les: (cfg) => les(cfg, vei) !== nei,
      skriv: (cfg, v) => {
        if (v) {
          const naa = les(cfg, vei);
          /* Er verdien allerede et objekt eller en liste, er den «på» og skal stå.
             Bare en eksplisitt `false` fjernes, så standarden gjelder igjen. */
          if (naa && typeof naa === 'object') return cfg;
          return skriv(cfg, vei, undefined);
        }
        return skriv(cfg, vei, nei);
      } }),
  };

  class KiHjemEditor extends HTMLElement {
    setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this._render(); }
    /* `set hass` fyres hver gang EN tilstand i huset endrer seg — mange ganger i
       minuttet. Bygget vi skjemaet på nytt hver gang, ble et ha-form-felt byttet ut
       mens man skrev i det, og siste tegn gikk tapt. Det er grunnen til at
       `#alarm::laser` ble lagret som `#alarm::lase`.
       Første gang må vi bygge; etterpå sendes hass bare videre til feltene, som er
       det de trenger for entitetsvelgerne. */
    set hass(hass) {
      const forst = !this._hass;
      this._hass = hass;
      if (forst) { this._render(); return; }
      for (const el of this._feltEl || []) el.hass = hass;
    }

    _endre(endring) {
      const ut = JSON.parse(JSON.stringify(this._config || {}));
      ut.type = ut.type || 'custom:ki-hjem-card';
      endring(ut);
      this._config = ut;
      this.dispatchEvent(new CustomEvent('config-changed',
        { detail: { config: ut }, bubbles: true, composed: true }));
      this._render();
    }

    // ------------------------------------------------------------- grupper
    _grupper() {
      const cfg = this._config || {};
      const rom = () => allOversikt(this._hass).map((st) => ({
        value: st.attributes.area_id, label: st.attributes.rom || st.attributes.area_id }));
      const g = [];

      g.push({ id: 'hjem', tittel: 'Hjem-fanen', niva: 0, felt: [
        F.bryter('hjem', 'Vis Hjem-fanen'),
        F.ent('hjem.las', 'Dørlås', 'lock'),
        F.tekst('hjem.las_path', 'Popup for dørlås'),
        F.ent('hjem.garasje', 'Garasjeport', 'cover'),
        F.tekst('hjem.garasje_path', 'Popup for garasje'),
        { vei: 'hjem.alarm', etikett: 'Alarm', selector: { entity: { domain: ['alarm_control_panel', 'select'] } },
          les: (c) => { const a = les(c, 'hjem.alarm'); return typeof a === 'string' ? a : (a || {}).entity; },
          skriv: (c, v) => { const s = les(c, 'hjem.alarm.script');
            if (!v) return skriv(c, 'hjem.alarm', undefined);
            return skriv(c, 'hjem.alarm', s ? { entity: v, script: s } : v); } },
        { vei: 'hjem.alarm.script', etikett: 'Alarm av/på-skript', selector: { entity: { domain: 'script' } },
          les: (c) => (les(c, 'hjem.alarm') || {}).script,
          skriv: (c, v) => { const a = les(c, 'hjem.alarm');
            const e = typeof a === 'string' ? a : (a || {}).entity;
            if (!e) return c;
            return skriv(c, 'hjem.alarm', v ? { entity: e, script: v } : e); } },
        F.ent('hjem.kalender', 'Kalender-sensor', 'sensor'),
        { vei: 'hjem.rom', etikett: 'Rom i venstre swipe',
          selector: { select: { multiple: true, options: rom() } } },
        { vei: 'hjem.rom_hoyre', etikett: 'Rom i høyre swipe',
          selector: { select: { multiple: true, options: rom() } } },
      ] });

      g.push({ id: 'aktuelt', tittel: 'Aktuelt-fanen', niva: 0, felt: [
        F.ent('aktuelt.tv', 'TV', 'media_player'),
        F.ent('aktuelt.stovsuger', 'Støvsuger', 'vacuum'),
        F.ent('aktuelt.vaskemaskin', 'Vaskemaskin (tid igjen)', ['sensor', 'binary_sensor']),
        F.ent('aktuelt.oppvaskmaskin', 'Oppvaskmaskin (tid igjen)', ['sensor', 'binary_sensor']),
      ] });

      g.push({ id: 'batterier', tittel: 'Batterier-fanen', niva: 0, felt: [
        { vei: 'batterier', etikett: 'Vis ved lavt batteri', selector: { boolean: {} },
          les: (c) => !!les(c, 'batterier'),
          skriv: (c, v) => { if (!v) return skriv(c, 'batterier', undefined);
            const t = (typeof c.batterier === 'object' && c.batterier && c.batterier.terskel) || null;
            c.batterier = t ? { terskel: t } : true; return c; } },
        { vei: 'batterier.terskel', etikett: 'Terskel (%)', selector: { number: { min: 1, max: 100, mode: 'box' } },
          les: (c) => (typeof c.batterier === 'object' && c.batterier && c.batterier.terskel) || 30,
          skriv: (c, v) => { if (!les(c, 'batterier')) return c;
            const n = Number(v);
            c.batterier = (n && n !== 30) ? { terskel: n } : true; return c; } },
      ] });

      g.push({ id: 'etasjer', tittel: 'Etasjer', niva: 0, felt: [
        F.bryter('etasjer', 'Vis etasje-faner'),
      ] });

      /* Standardene i «Tilpass Hjem». Hver bruker kan endre dem selv i panelet (langt
         trykk på fanerada); det lagres per bruker og vinner over disse. */
      g.push({ id: 'tilpass', tittel: 'Tilpass Hjem', niva: 0, felt: [
        F.bryter('tilpass', 'Langt trykk på fanene åpner «Tilpass Hjem»'),
        { vei: 'tilpass_knapp', etikett: 'Egen knapp til høyre på fanerada', selector: { boolean: {} },
          les: (c) => !!c.tilpass_knapp, skriv: (c, v) => skriv(c, 'tilpass_knapp', v ? true : undefined) },
        F.valg('romkort', 'Romfliser i etasjene', [
          { value: 'monster', label: 'Etter flismønsteret' }, { value: 'stor', label: 'Stor' },
          { value: 'middels', label: 'Middels' }, { value: 'liten', label: 'Liten' }], 'monster'),
        F.bryter('klimaknapp', 'Klimaknapp på de store romflisene'),
        { vei: 'alle_rom', etikett: 'Fanen «Alle rom» (alle rommene samlet)', selector: { boolean: {} },
          les: (c) => !!c.alle_rom, skriv: (c, v) => skriv(c, 'alle_rom', v ? true : undefined) },
        F.valg('fane_bredde', 'Fanebredde', [
          { value: 'standard', label: 'Standard' }, { value: 'kompakt', label: 'Kompakt' },
          { value: 'full', label: 'Full bredde' }], 'standard'),
        F.valg('fane_hoyde', 'Fanehøyde', [
          { value: 'standard', label: 'Standard' }, { value: 'lav', label: 'Lav' },
          { value: 'middels', label: 'Middels' }, { value: 'hoy', label: 'Høy' },
          { value: 'ekstra', label: 'Ekstra høy' }], 'standard'),
      ] });

      for (const f of this._floors()) {
        g.push({ id: 'f_' + f.key, tittel: f.navn, niva: 1, felt: [
          F.bryter(`etasje_innstillinger.${f.key}.vis`, 'Vis etasjen'),
          F.tekst(`etasje_innstillinger.${f.key}.navn`, 'Fanenavn'),
          F.tall(`etasje_innstillinger.${f.key}.rekkefolge`, 'Rekkefølge', 1, 99),
        ] });
        for (const a of f.rom) {
          const r = a.area_id;
          g.push({
            id: 'r_' + r, tittel: a.rom || r, niva: 2,
            sammendrag: (c) => {
              const o = (c.rom || {})[r] || {};
              return [o.skjul ? 'skjult' : '', o.size && o.size !== 'big' ? o.size : '',
                o.kolonne || ''].filter(Boolean).join(' · ');
            },
            felt: [
              F.bryter(`rom.${r}.skjul`, 'Vis rommet', { nei: true }),
              F.tekst(`rom.${r}.navn`, 'Navn (<br> gir linjeskift)'),
              F.ikon(`rom.${r}.ikon`, 'Ikon (tomt = rommets ikon i HA)'),
              F.ent(`rom.${r}.temperatur`, 'Temperatursensor', 'sensor'),
              F.ent(`rom.${r}.fuktighet`, 'Fuktighetssensor', 'sensor'),
              /* Etasjen rommet vises under. Overstyringen `rom.<id>.etasje` fantes i
                 kortet fra før, men bare i YAML — nå er den et nedtrekk med etasjene som
                 faktisk finnes, pluss «Uten etasje». «Som i Home Assistant» lagrer
                 ingenting, så rommet følger områdets egen etasje. */
              F.valg(`rom.${r}.etasje`, 'Etasje', this._etasjeValg(), '__ha'),
              F.valg(`rom.${r}.size`, 'Størrelse', [
                { value: 'big', label: 'Stor med klimaknapp' }, { value: 'big_plain', label: 'Stor uten' },
                { value: 'small', label: 'Medium' }, { value: 'row', label: 'Liten rad' }], 'big'),
              F.valg(`rom.${r}.kolonne`, 'Plassering', [
                { value: 'auto', label: 'Automatisk' }, { value: 'venstre', label: 'Venstre' },
                { value: 'hoyre', label: 'Høyre' }], 'auto'),
              F.tall(`rom.${r}.rekkefolge`, 'Rekkefølge', 1, 99),
              F.tekst(`rom.${r}.farge`, 'Farge, f.eks. var(--green)'),
              F.tekst(`rom.${r}.path`, 'Popup-hash'),
              { vei: `rom.${r}.varsel`, etikett: 'Vis «!»-merke', selector: { boolean: {} },
                les: (c) => (((c.rom || {})[r] || {}).varsel) !== false,
                skriv: (c, v) => { const o = les(c, `rom.${r}.varsel`);
                  return skriv(c, `rom.${r}.varsel`, v ? (typeof o === 'string' ? o : undefined) : false); } },
              { vei: `rom.${r}.varsel_ent`, etikett: '«!» når denne er på',
                selector: { entity: { domain: ['binary_sensor', 'input_boolean', 'switch'] } },
                les: (c) => { const o = ((c.rom || {})[r] || {}).varsel; return typeof o === 'string' ? o : undefined; },
                skriv: (c, v) => (((c.rom || {})[r] || {}).varsel === false ? c : skriv(c, `rom.${r}.varsel`, v)) },
            ],
          });
        }
      }

      g.push({ id: 'sesong', tittel: 'Sesongfliser i Aktuelt', niva: 0, liste: {
        vei: 'aktuelt.sesong',
        nytt: () => ({ fra: '11-01', til: '03-01', kind: 'navigate', main_text: 'Ny sesong' }),
        navn: (f) => `${f.main_text || f.navn || f.entity || 'Sesong'} (${f.fra || '?'} – ${f.til || '?'})`,
        skjema: (f) => [
          { name: 'fra', selector: { text: {} } }, { name: 'til', selector: { text: {} } },
          ...this._stovSkjema(f),
        ],
        knapp: '+ Legg til sesongflis',
        enkel: true,        // ingen swipe-grupper i sesonglista
      } });

      g.push({ id: 'stov', tittel: 'Fliser i Hjem-fanen', niva: 0, liste: {
        vei: 'hjem.stov',
        nytt: () => ({ kind: 'navigate', main_text: 'Ny flis', ikon: 'mdi:card-outline' }),
        navn: (f) => this._flisNavn(f),
      } });

      return g;
    }

    // --------------------------------------------------- flistyper (hjem.stov)
    _stovTyper() {
      return [
        { value: 'navigate', label: 'Fri flis (egen tekst, ikon og popup)' },
        { value: 'gjoremal', label: 'Gjøremål' }, { value: 'kalender', label: 'Kalender' },
        { value: 'las', label: 'Dørlås' }, { value: 'garasje', label: 'Garasjeport' },
        { value: 'alarm', label: 'Alarm' }, { value: 'rom', label: 'Rom' },
      ];
    }

    _stovSkjema(flis) {
      const k = flis.kind || 'navigate';
      const ut = [{ name: 'kind', selector: { select: { mode: 'dropdown', options: this._stovTyper() } } }];
      if (k === 'rom') {
        ut.push({ name: 'rom', selector: { text: {} } },
          { name: 'size', selector: { select: { mode: 'dropdown', options: [
            { value: 'big', label: 'Stor med klimaknapp' }, { value: 'big_plain', label: 'Stor uten' },
            { value: 'small', label: 'Medium' }, { value: 'row', label: 'Liten rad' }] } } });
      } else if (k === 'navigate') {
        ut.push({ name: 'main_text', selector: { text: {} } },
          { name: 'sub_text', selector: { text: {} } }, { name: 'entity', selector: { entity: {} } });
      } else {
        const dom = { las: 'lock', alarm: ['select', 'alarm_control_panel'], garasje: 'cover',
          kalender: 'sensor', gjoremal: 'sensor' }[k];
        ut.push({ name: 'entity', selector: { entity: dom ? { domain: dom } : {} } },
          { name: 'sub_text', selector: { text: {} } });
      }
      ut.push({ name: 'ikon', selector: { icon: {} } }, { name: 'farge', selector: { text: {} } },
        { name: 'path', selector: { text: {} } });
      return ut;
    }

    // ------------------------------------------------------------- tegning
    _stil() {
      const st = document.createElement('style');
      st.textContent = `
        .del { border-radius:12px; background:var(--secondary-background-color, rgba(128,128,128,.08));
          margin-bottom:6px; overflow:hidden; }
        .del[data-niva="2"] { margin:4px 0 4px 12px; background:rgba(128,128,128,.06); }
        summary { cursor:pointer; padding:10px 14px; font-size:14px; font-weight:600;
          list-style:none; display:flex; align-items:center; gap:8px; }
        summary::-webkit-details-marker { display:none; }
        summary::after { content:"›"; margin-left:auto; opacity:.5; transition:transform .2s; font-size:18px; }
        details[open] > summary::after { transform:rotate(90deg); }
        .del[data-niva="2"] summary { font-weight:500; font-size:13.5px; padding:8px 12px; }
        .sum { margin-left:auto; margin-right:6px; font-size:12px; opacity:.55; font-weight:400; }
        .innhold { padding:0 12px 12px; }
        .frad { display:flex; align-items:center; gap:6px; padding:6px 12px; }
        .frad .nr { width:18px; text-align:right; opacity:.5; font-size:12px; }
        .frad .navn { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis;
          white-space:nowrap; font-size:13.5px; }
        .frad button, .legg { border:0; cursor:pointer; color:inherit; font-size:12px;
          background:var(--secondary-background-color, rgba(128,128,128,.2)); }
        .frad button { width:30px; height:30px; border-radius:8px; }
        .frad button[disabled] { opacity:.3; cursor:default; }
        .frad button.bort { color:var(--error-color, #e0524a); }
        .legg { margin:6px 12px 12px; padding:8px 14px; border-radius:10px; font-size:13px; }
        .fform { padding:0 12px 10px 36px; }
      `;
      return st;
    }

    _boks(gr) {
      if (this._bokser[gr.id]) return this._bokser[gr.id];
      const d = document.createElement('details');
      d.className = 'del';
      d.dataset.niva = String(gr.niva || 0);
      if (gr.id === 'hjem') d.open = true;
      const sum = document.createElement('summary');
      const tit = document.createElement('span');
      const meta = document.createElement('span');
      meta.className = 'sum';
      sum.appendChild(tit); sum.appendChild(meta);
      const innhold = document.createElement('div');
      innhold.className = 'innhold';
      d.appendChild(sum); d.appendChild(innhold);
      this._skall.appendChild(d);
      return (this._bokser[gr.id] = { d, tit, meta, innhold, f: null, sist: '' });
    }

    _tegnFelt(gr, b) {
      const cfg = this._config || {};
      if (!b.f) {
        b.f = document.createElement('ha-form');
        (this._feltEl = this._feltEl || []).push(b.f);
        b.f.computeLabel = (sc) => (gr.felt.find((x) => x.vei === sc.name) || {}).etikett || sc.name;
        b.f.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const v = ev.detail.value || {};
          this._endre((ut) => {
            for (const felt of gr.felt) {
              if (!(felt.vei in v)) continue;
              if (felt.skriv) felt.skriv(ut, v[felt.vei]);
              else skriv(ut, felt.vei, v[felt.vei]);
            }
          });
        });
        b.innhold.appendChild(b.f);
      }
      const skjema = gr.felt.map((x) => ({ name: x.vei, selector: x.selector }));
      const n = JSON.stringify(skjema);
      if (n !== b.sist) { b.sist = n; b.f.schema = skjema; }
      b.f.hass = this._hass;
      const data = {};
      for (const felt of gr.felt) data[felt.vei] = felt.les ? felt.les(cfg) : les(cfg, felt.vei);
      b.f.data = data;
    }

    /* Liste av fliser. Et element er enten en flis, eller en `swipe`-gruppe med egne
       kort inni — og da tegner vi lista på nytt ett nivå ned. Uten dette kunne swipe-
       gruppene i `hjem.stov` bare redigeres i YAML. */
    _flisListe(vert, lesL, lagreL, dybde) {
      const rader = lesL();

      rader.forEach((el, i) => {
        const erSwipe = el && typeof el.swipe === 'object' && el.swipe;
        const rad = document.createElement('div');
        rad.className = 'frad';
        if (dybde) rad.style.paddingLeft = (12 + dybde * 16) + 'px';
        const nr = document.createElement('span'); nr.className = 'nr'; nr.textContent = String(i + 1);
        const navn = document.createElement('span'); navn.className = 'navn';
        navn.textContent = erSwipe
          ? `Swipe-gruppe (${(el.swipe.cards || []).length} kort)`
          : this._flisNavn(el || {});
        const opp = document.createElement('button'); opp.textContent = '▲'; opp.disabled = i === 0;
        const ned = document.createElement('button'); ned.textContent = '▼'; ned.disabled = i === rader.length - 1;
        const bort = document.createElement('button'); bort.textContent = '✕'; bort.className = 'bort';
        bort.title = 'Fjern';
        opp.addEventListener('click', () => { const l = lesL(); [l[i - 1], l[i]] = [l[i], l[i - 1]]; lagreL(l); });
        ned.addEventListener('click', () => { const l = lesL(); [l[i + 1], l[i]] = [l[i], l[i + 1]]; lagreL(l); });
        bort.addEventListener('click', () => { const l = lesL(); l.splice(i, 1); lagreL(l); });
        rad.append(nr, navn, opp, ned, bort);
        vert.appendChild(rad);

        const boks = document.createElement('div');
        boks.className = 'fform';
        if (dybde) boks.style.paddingLeft = (36 + dybde * 16) + 'px';

        if (erSwipe) {
          // gruppens egne innstillinger
          const f = document.createElement('ha-form');
          (this._feltEl = this._feltEl || []).push(f);
          f.hass = this._hass;
          f.schema = [{ name: 'height', selector: { text: {} } },
            { name: 'type', selector: { select: { mode: 'dropdown', options: [
              { value: 'css', label: 'Med paginering' }, { value: 'plain', label: 'Enkel' }] } } }];
          f.data = { height: el.swipe.height, type: el.swipe.type || 'css' };
          f.computeLabel = (sc) => ({ height: 'Høyde, f.eks. 85px', type: 'Swipe-type' }[sc.name] || sc.name);
          f.addEventListener('value-changed', (ev) => {
            ev.stopPropagation();
            const l = lesL();
            l[i] = { ...l[i], swipe: { ...l[i].swipe, ...(ev.detail.value || {}) } };
            for (const k of Object.keys(l[i].swipe)) if (l[i].swipe[k] === '' || l[i].swipe[k] === undefined) delete l[i].swipe[k];
            lagreL(l);
          });
          boks.appendChild(f);
          vert.appendChild(boks);

          // kortene inni gruppen
          this._flisListe(vert,
            () => (lesL()[i].swipe.cards || []).map((x) => ({ ...x })),
            (kort) => { const l = lesL(); l[i] = { ...l[i], swipe: { ...l[i].swipe, cards: kort } }; lagreL(l); },
            (dybde || 0) + 1);
          return;
        }

        const f = document.createElement('ha-form');

        (this._feltEl = this._feltEl || []).push(f);
        f.hass = this._hass;
        f.schema = this._stovSkjema(el || {});
        f.data = el || {};
        f.computeLabel = (sc) => this._flisEtikett(sc.name);
        f.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const l = lesL();
          l[i] = { ...l[i], ...(ev.detail.value || {}) };
          for (const k of Object.keys(l[i])) if (l[i][k] === '' || l[i][k] === undefined) delete l[i][k];
          lagreL(l);
        });
        boks.appendChild(f);
        vert.appendChild(boks);
      });
    }

    _flisNavn(f) {
      return f.main_text || f.navn || f.rom || f.entity
        || (this._stovTyper().find((x) => x.value === (f.kind || 'navigate')) || {}).label || 'Flis';
    }

    _flisEtikett(n) {
      return { kind: 'Type', rom: 'Rom', size: 'Størrelse', entity: 'Entitet', main_text: 'Tittel',
        sub_text: 'Undertekst', ikon: 'Ikon', farge: 'Farge, f.eks. var(--green)',
        path: 'Popup-hash eller sti, f.eks. #ruter', fra: 'Vises fra (MM-DD)',
        til: 'Vises til (MM-DD)' }[n] || n;
    }

    _tegnListe(gr, b) {
      const L = gr.liste;
      const lesL = () => {
        const v = les(this._config || {}, L.vei);
        return Array.isArray(v) ? v.map((x) => JSON.parse(JSON.stringify(x))) : [];
      };
      const lagreL = (ny) => this._endre((ut) => skriv(ut, L.vei, ny.length ? ny : undefined));
      b.innhold.innerHTML = '';

      if (L.enkel) {
        // enkel liste (sesongfliser): ingen swipe-grupper her
        lesL().forEach((el, i) => {
          const rader = lesL();
          const rad = document.createElement('div');
          rad.className = 'frad';
          const nr = document.createElement('span'); nr.className = 'nr'; nr.textContent = String(i + 1);
          const navn = document.createElement('span'); navn.className = 'navn'; navn.textContent = L.navn(el);
          const opp = document.createElement('button'); opp.textContent = '▲'; opp.disabled = i === 0;
          const ned = document.createElement('button'); ned.textContent = '▼'; ned.disabled = i === rader.length - 1;
          const bort = document.createElement('button'); bort.textContent = '✕'; bort.className = 'bort';
          opp.addEventListener('click', () => { const l = lesL(); [l[i - 1], l[i]] = [l[i], l[i - 1]]; lagreL(l); });
          ned.addEventListener('click', () => { const l = lesL(); [l[i + 1], l[i]] = [l[i], l[i + 1]]; lagreL(l); });
          bort.addEventListener('click', () => { const l = lesL(); l.splice(i, 1); lagreL(l); });
          rad.append(nr, navn, opp, ned, bort);
          b.innhold.appendChild(rad);
          const boks = document.createElement('div');
          boks.className = 'fform';
          const f = document.createElement('ha-form');
          (this._feltEl = this._feltEl || []).push(f);
          f.hass = this._hass;
          f.schema = L.skjema(el);
          f.data = el;
          f.computeLabel = (sc) => this._flisEtikett(sc.name);
          f.addEventListener('value-changed', (ev) => {
            ev.stopPropagation();
            const l = lesL();
            l[i] = { ...l[i], ...(ev.detail.value || {}) };
            for (const k of Object.keys(l[i])) if (l[i][k] === '' || l[i][k] === undefined) delete l[i][k];
            lagreL(l);
          });
          boks.appendChild(f);
          b.innhold.appendChild(boks);
        });
      } else {
        this._flisListe(b.innhold, lesL, lagreL, 0);
      }

      const knapper = document.createElement('div');
      const legg = document.createElement('button');
      legg.className = 'legg';
      legg.textContent = L.knapp || '+ Legg til flis';
      legg.addEventListener('click', () => lagreL([...lesL(), L.nytt()]));
      knapper.appendChild(legg);
      if (!L.enkel) {
        const gruppe = document.createElement('button');
        gruppe.className = 'legg';
        gruppe.textContent = '+ Legg til swipe-gruppe';
        gruppe.addEventListener('click', () => lagreL([...lesL(),
          { swipe: { height: '85px', cards: [{ kind: 'navigate', main_text: 'Ny flis' }] } }]));
        knapper.appendChild(gruppe);
      }
      b.innhold.appendChild(knapper);
    }

    /* Etasjene til nedtrekket per rom.
     *
     * Bygges fra `_floors()` — nøyaktig de gruppene editoren alt viser — pluss nøklene
     * i `etasje_innstillinger`, slik at en etasje du har gitt navn eller rekkefølge også
     * er der selv om ingen rom står i den akkurat nå.
     *
     * Første utgave leste `etasje_id` fra rommene på egen hånd. Det ga samme liste når
     * attributtene er som forventet, men er et annet kodeløp enn gruppene: er lista tom
     * mens gruppene finnes, har du ingen måte å se hvorfor. Nå er det umulig at de er
     * uenige.
     */
    _etasjeValg() {
      const sett = new Map();
      for (const f of this._floors()) {
        sett.set(String(f.key), { niva: f.niva ?? 999, label: f.navn || String(f.key) });
      }
      const ei = (this._config || {}).etasje_innstillinger || {};
      for (const [k, v] of Object.entries(ei)) {
        const naa = sett.get(k) || { niva: 999, label: k };
        sett.set(k, { niva: (v && v.rekkefolge) ?? naa.niva, label: (v && v.navn) || naa.label });
      }
      /* «forste_etasje» blir «Forste etasje» når ingen har gitt den et navn — en rå
         nøkkel i et nedtrekk er ikke til å forstå. Og `__uten` heter alltid «Uten
         etasje»: `_floors()` gir den navnet til det første rommet uten etasje, som blir
         direkte misvisende. */
      const pynt = (k) => String(k).replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
      const ut = [...sett.entries()]
        .sort((x, y) => x[1].niva - y[1].niva)
        .map(([value, v]) => ({
          value,
          label: value === '__uten' ? 'Uten etasje'
            : (v.label && v.label !== value && v.label !== 'Rom' ? v.label : pynt(value)),
        }));
      return [{ value: '__ha', label: 'Som i Home Assistant' }, ...ut];
    }

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
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
      this._render();
    }

    _render() {
      if (!this._hass || !this._config) return;
      this._feltEl = [];
      this._renderLayout();
      if (!this._skall) {
        this._skall = document.createElement('div');
        this._skall.appendChild(this._stil());
        this.appendChild(this._skall);
        this._bokser = {};
      }
      const grupper = this._grupper();
      const brukt = new Set();
      for (const gr of grupper) {
        brukt.add(gr.id);
        const b = this._boks(gr);
        b.tit.textContent = gr.tittel;
        b.meta.textContent = gr.sammendrag ? gr.sammendrag(this._config)
          : (gr.liste ? `${(les(this._config, gr.liste.vei) || []).length || 'ingen'}` : '');
        if (gr.liste) this._tegnListe(gr, b); else this._tegnFelt(gr, b);
      }
      for (const id of Object.keys(this._bokser)) {
        if (brukt.has(id)) continue;
        this._bokser[id].d.remove();
        delete this._bokser[id];
      }
    }
  }


  /* ---------------------------------------------------------------- Tilpass Hjem
   * Panelet ligger over navigasjonslinja (samme avstand som kd-dokka), i et eget element
   * på <body> med egen shadowRoot — fast posisjon virker da også når en forelder har
   * transform, og stilen lekker ingen veier. Designspråket: flat --gray200-flate, 24 px
   * hjørner, --gray100 innvendig, 14 px/500, aktivt valg fylt med --active-big.
   * INGEN backticks i kommentarene i denne CSS-en — den er en mal-streng. */
  const TP_CSS = `
    :host { all:initial; }
    *, *::before, *::after { box-sizing:border-box; }
    .bak { position:fixed; inset:0; z-index:9998; background:rgba(0,0,0,.35);
      animation:tp-inn .18s ease-out; }
    /* Rett over navigasjonslinja (--kd-dokk-h settes av ki-floating-navbar / kd-dokka og måles fra
       bunnen av vinduet, altså medregnet safe-area nederst). Toppen holder seg under statuslinja. */
    .panel { position:fixed; z-index:9999; left:50%; transform:translateX(-50%);
      bottom:calc(var(--kd-dokk-h, 90px) + 6px);
      width:min(440px, calc(100vw - 24px));
      max-height:calc(100vh - var(--kd-dokk-h, 90px) - 24px - env(safe-area-inset-top, 0px));
      max-height:calc(100dvh - var(--kd-dokk-h, 90px) - 24px - env(safe-area-inset-top, 0px));
      display:flex; flex-direction:column; border-radius:24px; overflow:hidden;
      background:var(--gray200, #1f1f22); color:var(--gray1000, #f2f2f2);
      font-family:var(--ki-font, inherit); font-size:14px; font-weight:500;
      -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none;
      animation:tp-opp .24s cubic-bezier(.2,.8,.2,1); }
    @keyframes tp-inn { from { opacity:0; } }
    @keyframes tp-opp { from { opacity:0; transform:translateX(-50%) translateY(14px); } }
    .topp { display:flex; align-items:center; gap:8px; padding:14px 14px 10px 18px; flex:none; }
    .tittel { flex:1; font-size:20px; font-weight:500; }
    .knapp { border:0; font:inherit; font-size:14px; font-weight:500; cursor:pointer; height:36px;
      padding:0 16px; border-radius:999px; background:var(--gray100, #151517); color:inherit; }
    .knapp.ferdig { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    .innhold { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 10px 14px; scrollbar-width:none; }
    .innhold::-webkit-scrollbar { display:none; }
    .hd { padding:14px 8px 6px; opacity:.7; }
    .liste { display:grid; grid-template-columns:minmax(0, 1fr); gap:4px; }
    .rad-wrap { border-radius:18px; background:var(--gray100, #151517); }
    .rad { min-height:52px; display:flex; align-items:center; gap:4px; padding:0 4px 0 14px; }
    .rad.av .ri, .rad.av .rt { opacity:.45; }
    .ri { --mdc-icon-size:20px; flex:none; margin-right:8px; opacity:.85; }
    .rt { flex:1; min-width:0; display:flex; flex-direction:column; }
    .rn, .ru { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ru { opacity:.7; font-size:12px; }
    .ib { border:0; background:transparent; color:inherit; cursor:pointer; width:38px; height:38px;
      flex:none; border-radius:999px; display:grid; place-items:center; padding:0;
      --mdc-icon-size:20px; opacity:.7; transition:transform .12s cubic-bezier(.2,.8,.2,1); }
    .ib.pa { opacity:1; }
    .ib[disabled] { opacity:.2; pointer-events:none; }
    .chips { display:flex; flex-wrap:wrap; gap:6px; padding:2px 10px 12px; }
    .rad-wrap > .chips { padding-top:0; }
    .chip { border:0; font:inherit; font-size:14px; font-weight:500; cursor:pointer; height:36px;
      padding:0 14px; border-radius:999px; background:var(--gray100, #151517); color:inherit;
      display:inline-flex; align-items:center; gap:6px; --mdc-icon-size:18px;
      transition:transform .12s cubic-bezier(.2,.8,.2,1); }
    .rad-wrap .chip { background:var(--gray200, #1f1f22); }
    .chip.pa { background:var(--active-big, #ee95ff); color:var(--black, #000); }
    .chip:active, .ib:active, .knapp:active { transform:scale(.94); }
    .gruppe { border-radius:18px; background:var(--gray100, #151517); padding:10px 0 0; }
    .gruppe .chip { background:var(--gray200, #1f1f22); }
    .gruppe .chip.pa { background:var(--active-big, #ee95ff); }
    .etikett { padding:0 14px 8px; opacity:.7; }
    .rad-wrap > .etikett { padding:2px 14px 6px; font-size:12px; }
    .hint { padding:8px 8px 0; font-size:12px; opacity:.7; }
    @media (prefers-reduced-motion: reduce) { .bak, .panel { animation:none; } }
  `;
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* Temavariablene panelet bruker. Hentes fra kortet, så et tema som bare er satt på
     visningen (ikke på <html>) også gjelder panelet på <body>. */
  const TEMA = ['--gray000', '--gray100', '--gray200', '--gray400', '--gray800', '--gray1000', '--active-big', '--active-small', '--black', '--kd-dokk-h'];

  class KiHjemCard extends HTMLElement {
    static getConfigElement() { return document.createElement('ki-hjem-editor'); }
    static getStubConfig() { return {}; }
    setConfig(config) {
      this._config = config; this._cfgStr = JSON.stringify(config); this._sig = null; this._lastList = null;
      if (!this._root) { this._root = document.createElement('div'); this.appendChild(this._root); }
      if (this._hass) this.hass = this._hass;
    }
    connectedCallback() {
      /* Meld fra til navbaren (ki-floating-navbar) at «Tilpass Hjem» finnes på siden, og lytt på
         «…» → «Tilpass Hjem» derfra. */
      if (!this._reg) {
        this._reg = true;
        const W = window;
        W.__kiHjem = (W.__kiHjem || 0) + 1;
        (W.__kiHjemKort = W.__kiHjemKort || new Set()).add(this);
        W.dispatchEvent(new CustomEvent('ki-hjem-registrert', { detail: { antall: W.__kiHjem } }));
      }
      if (!this._tpLytter) {
        this._tpLytter = (e) => {
          const apen = !e.detail || e.detail.apen !== false;
          if (!apen) { this._lukkTilpass(); return; }
          /* Flere Hjem-kort på siden: bare det første synlige svarer. */
          const alle = [...(window.__kiHjemKort || [])];
          const meg = alle.find((k) => k.isConnected && k.getClientRects().length) || alle[0];
          if (meg !== this) return;
          if (!this._tpApen) this._apneTilpass();
        };
      }
      window.addEventListener('ki-hjem-tilpass', this._tpLytter);
      if (!this._udLytter) {
        this._udLytter = (e) => {
          if (!e.detail || e.detail.key !== 'ki_hjem') return;
          this._udKlar = true;
          if (this._card) settFaneMal(this._card, this._effCfg());
          this._knapp();
          /* Signaturen tar med brukerens valg (unntatt fanemålene, som alt er satt over):
             bygges bare på nytt når noe i innholdet faktisk er endret. */
          if (this._hass) { this._lastList = null; this.hass = this._hass; }
          if (this._tpApen) this._tegnTilpass();
        };
      }
      window.addEventListener('ki-ud', this._udLytter);
    }
    disconnectedCallback() {
      if (this._udLytter) window.removeEventListener('ki-ud', this._udLytter);
      if (this._tpLytter) window.removeEventListener('ki-hjem-tilpass', this._tpLytter);
      if (this._reg) {
        this._reg = false;
        const W = window;
        W.__kiHjem = Math.max(0, (W.__kiHjem || 1) - 1);
        if (W.__kiHjemKort) W.__kiHjemKort.delete(this);
        W.dispatchEvent(new CustomEvent('ki-hjem-registrert', { detail: { antall: W.__kiHjem } }));
      }
      this._lukkTilpass();
    }
    _u() { const K = window.KI; return (K && K.ud && this._hass) ? (K.ud(this._hass, 'ki_hjem') || {}) : {}; }
    _effCfg() { return { ...(this._config || {}), __u: this._u() }; }
    /* «Avstand under»: margen må ligge på elementet HA legger rundt kortet (hui-card i nyere HA),
       ellers blir den liggende inni innpakningen og flytter ingenting. */
    _settBunn() {
      const b = prefs(this._effCfg()).bunn;
      const v = b ? b + 'px' : '';
      const p = this.parentElement;
      const mål = p && /^hui-card$|^hui-.*-card-wrapper$/.test(p.localName) ? p : this;
      if (this._bunnMål && this._bunnMål !== mål) this._bunnMål.style.marginBottom = '';
      this._bunnMål = mål;
      if (mål.style.marginBottom !== v) mål.style.marginBottom = v;
    }
    set hass(hass) {
      if (!hass || !hass.states) return; // css-swipe-card setter hass=undefined før den selv har fått hass
      this._hass = hass;
      if (this._config) this._settBunn();
      /* Venter på brukerens valg før første oppbygging (maks 1,5 s), ellers ble kortet
         bygget to ganger ved åpning og hoppet fra standardoppsettet til brukerens. */
      const K = window.KI;
      if (!this._udKlar && K && K.udLoad) {
        if (K._ud && K._ud.ki_hjem) this._udKlar = true;
        else {
          if (!this._udVent) {
            this._udVent = true;
            const ferdig = () => { if (this._udKlar) return; this._udKlar = true; if (this._hass) this.hass = this._hass; };
            K.udLoad(hass, 'ki_hjem').then(ferdig, ferdig);
            setTimeout(ferdig, 1500);
          }
          return;
        }
      }
      const list = allOversikt(hass);
      const same = this._lastList && list.length === this._lastList.length && list.every((st, i) => st === this._lastList[i]);
      if (same && this._card) { this._forward(hass); return; }
      this._lastList = list;
      const ovs = list.map((st) => st.entity_id + ':' + (st.attributes.etasje_id || '') + ':' + (st.attributes.rom || '')).join(',');
      /* datoen er med i signaturen slik at sesongkortene dukker opp og forsvinner ved midnatt */
      const dag = new Date().toISOString().slice(0, 10);
      const u = { ...this._u() }; delete u.fane;
      const sig = this._cfgStr + '|' + ovs + '|' + dag + '|' + JSON.stringify(u);
      if (sig !== this._sig) { this._sig = sig; this._rebuild(); return; }
      if (this._card) this._forward(hass);
    }
    _forward(hass) {
      this._pendingHass = hass;
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; const h = this._pendingHass; this._pendingHass = null; if (h && this._card) this._card.hass = h; });
    }
    async _rebuild() {
      const nr = (this._byggNr = (this._byggNr || 0) + 1);
      try {
        const helpers = await window.loadCardHelpers();
        if (nr !== this._byggNr) return;
        const cfg = this._effCfg(), ut = {};
        const el = await helpers.createCardElement(generate(this._hass, cfg, ut));
        if (nr !== this._byggNr) return;
        this._faner = ut.faner || [];
        /* Fanen man sto i skal stå valgt også etter en ny oppbygging (et valg i panelet). */
        const aktiv = this._aktivFane();
        el.hass = this._hass;
        this._root.innerHTML = ''; this._root.appendChild(el); this._card = el;
        injectTabsStyle(el, 0, cfg);
        if (aktiv) this._velgFane(el, aktiv);
        this._kobleHold(el);
        this._knapp();
        if (JSON.stringify(this._config).includes('plain')) injectSwipeStyle(this._root);
        if (this._tpApen) this._tegnTilpass();
      } catch (err) {
        this._root.innerHTML = '<div style="padding:16px;border-radius:24px;background:var(--gray200);color:var(--gray1000);font-size:14px">KI Hjem: ' + esc(err.message) + '</div>';
      }
    }
    _aktivFane() {
      const sr = this._card && this._card.shadowRoot;
      const a = sr && sr.querySelector('.tab-button.active');
      return a ? a.textContent.trim() : null;
    }
    _velgFane(el, tittel, n = 0) {
      const sr = el.shadowRoot;
      const bs = sr ? [...sr.querySelectorAll('.tab-button')] : [];
      if (!bs.length) { if (n < 30) setTimeout(() => this._velgFane(el, tittel, n + 1), 50); return; }
      const b = bs.find((x) => x.textContent.trim() === tittel);
      if (b && !b.classList.contains('active')) b.click();
    }

    /* Langt trykk på en fane åpner panelet. Lytterne ligger på simple-tabs selv; hendelsene
       fra knappene i shadowRoot bobler ut hit. Klikket som følger et langt trykk fanges i
       capture-fasen, før simple-tabs rekker å bytte fane. */
    _kobleHold(el) {
      if (el._kiHold) return;
      el._kiHold = true;
      const erFane = (e) => e.composedPath().some((n) => n.classList && n.classList.contains('tab-button'));
      let t = null, x = 0, y = 0, holdt = false;
      const stopp = () => { clearTimeout(t); t = null; };
      el.addEventListener('pointerdown', (e) => {
        holdt = false;
        if (!this._config || this._config.tilpass === false || !erFane(e)) return;
        x = e.clientX; y = e.clientY; stopp();
        t = setTimeout(() => { t = null; holdt = true; this._apneTilpass(); }, 600);
      });
      el.addEventListener('pointermove', (e) => { if (t && Math.hypot(e.clientX - x, e.clientY - y) > 8) stopp(); });
      el.addEventListener('pointerup', stopp);
      el.addEventListener('pointercancel', stopp);
      el.addEventListener('click', (e) => { if (holdt) { holdt = false; e.stopPropagation(); e.preventDefault(); } }, true);
      el.addEventListener('contextmenu', (e) => { if (this._config.tilpass !== false && erFane(e)) e.preventDefault(); });
    }

    /* tilpass_knapp: true gir en liten rund knapp til høyre på fanerada. */
    _knapp() {
      const c = this._config || {};
      if (!c.tilpass_knapp || c.tilpass === false) {
        if (this._knappEl) { this._knappEl.remove(); this._knappEl = null; }
        return;
      }
      if (!this._knappEl) {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Tilpass Hjem');
        b.title = 'Tilpass Hjem';
        b.innerHTML = '<ha-icon icon="mdi:tune-variant"></ha-icon>';
        b.style.cssText = 'position:absolute;right:10px;top:10px;z-index:2;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:transparent;color:rgba(255,255,255,.72);display:grid;place-items:center;cursor:pointer;padding:0;--mdc-icon-size:18px;-webkit-tap-highlight-color:transparent;transition:transform .12s cubic-bezier(.2,.8,.2,1)';
        b.addEventListener('pointerdown', () => { b.style.transform = 'scale(.94)'; });
        b.addEventListener('pointerup', () => { b.style.transform = ''; });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
        b.addEventListener('click', () => this._apneTilpass());
        this.style.position = 'relative';
        this.appendChild(b);
        this._knappEl = b;
      }
      /* Samme høyde og linje som fanerada. Den måles litt etter hverandre, fordi simple-tabs
         tegner rada asynkront og skrifta kan komme senere. */
      const plasser = () => {
        const sr = this._card && this._card.shadowRoot, t = sr && sr.querySelector('.tabs');
        if (!t || !this._knappEl) return;
        const rr = this.getBoundingClientRect(), tr = t.getBoundingClientRect();
        if (!tr.height) return;
        this._knappEl.style.top = Math.round(tr.top - rr.top) + 'px';
        this._knappEl.style.height = this._knappEl.style.width = Math.round(tr.height) + 'px';
      };
      [60, 300, 900].forEach((ms) => setTimeout(plasser, ms));
    }

    _apneTilpass() {
      if (!this._config || this._config.tilpass === false) return;
      window.KI && window.KI.fire && window.KI.fire(this, 'haptic', 'medium');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* ok */ }
      if (!this._tp) {
        const tp = document.createElement('div');
        tp.className = 'ki-hjem-tilpass';
        const sr = tp.attachShadow({ mode: 'open' });
        sr.innerHTML = `<style>${TP_CSS}</style><div class="bak" data-op="lukk"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="Tilpass Hjem">
            <div class="topp"><span class="tittel">Tilpass Hjem</span>
              <button class="knapp" data-op="nullstill">Nullstill</button>
              <button class="knapp ferdig" data-op="lukk">Ferdig</button></div>
            <div class="innhold"></div>
          </div>`;
        sr.addEventListener('click', (e) => {
          const b = e.target.closest && e.target.closest('[data-op]');
          if (b) this._op(b.dataset.op, b.dataset.k, b.dataset.x);
        });
        /* Temaet fra kortet (se TEMA over) og skrifta. */
        const cs = getComputedStyle(this);
        TEMA.forEach((v) => { const val = cs.getPropertyValue(v); if (val && val.trim()) tp.style.setProperty(v, val.trim()); });
        tp.style.setProperty('--ki-font', cs.fontFamily);
        document.body.appendChild(tp);
        this._tp = tp;
      }
      this._tpApen = true;
      this._tpEsc = this._tpEsc || ((e) => { if (e.key === 'Escape') this._lukkTilpass(); });
      document.addEventListener('keydown', this._tpEsc);
      this._tegnTilpass();
    }
    _lukkTilpass() {
      if (this._tp) this._tp.remove();
      this._tp = null; this._tpApen = false; this._tpRom = null;
      if (this._tpEsc) document.removeEventListener('keydown', this._tpEsc);
    }

    _tegnTilpass() {
      if (!this._tp || !this._hass) return;
      const boks = this._tp.shadowRoot.querySelector('.innhold');
      const rull = boks.scrollTop;
      const cfg = this._effCfg(), u = bruker(cfg), p = prefs(cfg), skj = skjulte(cfg);
      const faner = this._faner || [];
      const alleRom = rooms(this._hass, cfg);
      const navn = (id) => { const a = alleRom.find((x) => x.area_id === id); return (a && a.rom) || id; };
      const ib = (op, k, ikon, tittel, av, pa) => `<button class="ib ${pa ? 'pa' : ''}" data-op="${op}" data-k="${esc(k)}" title="${tittel}" aria-label="${tittel}" ${av ? 'disabled' : ''}><ha-icon icon="${ikon}"></ha-icon></button>`;
      const chip = (on, op, k, x, tekst, ikon) => `<button class="chip ${on ? 'pa' : ''}" data-op="${op}" data-k="${esc(k)}" data-x="${esc(x)}" aria-pressed="${on}">${ikon ? `<ha-icon icon="${ikon}"></ha-icon>` : ''}${esc(tekst)}</button>`;
      const ikonFor = (f) => (f.key === 'hjem' ? 'mdi:home-outline' : f.alle ? 'mdi:view-grid-outline' : f.etg !== undefined ? 'mdi:stairs' : f.key === 'aktuelt' ? 'mdi:lightning-bolt-outline' : f.key === 'batterier' ? 'mdi:battery-low' : 'mdi:tab');
      const romChips = (on, op, k) => alleRom.map((a) => chip(on(a.area_id), op, k, a.area_id, a.rom || a.area_id)).join('');

      /* Faner og etasjer (kd: «Etasjer»): rekkefølge, vis/skjul og hvilke rom som ligger i hver
         etasje. Hjem-fanen velger i tillegg side (venstre/høyre swipe) for rommene. */
      const fRader = faner.map((f, i) => {
        const av = skj.has(f.key);
        const kanRom = f.etg !== undefined || (f.key === 'hjem' && f.auto);
        const apen = kanRom && this._tpRom === f.key;
        const under = kanRom ? (f.rom.length ? f.rom.map(navn).join(', ') : 'Ingen rom')
          : f.alle ? 'Alle rommene samlet' : f.key === 'aktuelt' ? 'Vises når noe er i gang' : f.key === 'batterier' ? 'Vises ved lavt batteri' : '';
        let valg = '';
        if (apen && f.key === 'hjem') {
          const H = f.hoyre || [], V = f.rom.filter((r) => !H.includes(r));
          valg = `<div class="etikett">Venstre swipe</div><div class="chips">${romChips((id) => V.includes(id), 'hjemrom', 'venstre')}</div>
            <div class="etikett">Høyre swipe</div><div class="chips">${romChips((id) => H.includes(id), 'hjemrom', 'hoyre')}</div>`;
        } else if (apen) valg = `<div class="chips">${romChips((id) => f.rom.includes(id), 'rom', f.key)}</div>`;
        return `<div class="rad-wrap"><div class="rad ${av ? 'av' : ''}">
            <ha-icon class="ri" icon="${ikonFor(f)}"></ha-icon>
            <span class="rt"><span class="rn">${esc(f.navn)}</span>${under ? `<span class="ru">${esc(under)}</span>` : ''}</span>
            ${kanRom ? ib('apne', f.key, apen ? 'mdi:chevron-up' : 'mdi:pencil-outline', 'Velg rom', false, apen) : ''}
            ${ib('opp', f.key, 'mdi:arrow-up', 'Flytt opp', i === 0)}
            ${ib('ned', f.key, 'mdi:arrow-down', 'Flytt ned', i === faner.length - 1)}
            ${ib('skjul', f.key, av ? 'mdi:eye-off-outline' : 'mdi:eye-outline', av ? 'Vis' : 'Skjul', false, !av)}
          </div>${valg}</div>`;
      }).join('');
      /* Rom som ikke ligger i noen etasjefane (fjernet fra alle) – så de ikke blir borte ubemerket. */
      const iEtg = new Set();
      faner.forEach((f) => { if (f.etg !== undefined) f.rom.forEach((r) => iEtg.add(r)); });
      const uten = faner.some((f) => f.etg !== undefined) ? alleRom.filter((a) => !iEtg.has(a.area_id)) : [];
      const utenHint = uten.length ? `<div class="hint">Ikke i noen etasje: ${esc(uten.map((a) => a.rom || a.area_id).join(', '))}. Trykk blyanten på en etasje for å legge dem til.</div>` : '';

      /* Hjem-fanen (kd: «Seksjoner» og «Fliser – venstre/høyre kolonne»). */
      let sek = '';
      const hj = faner.find((f) => f.key === 'hjem' && f.auto);
      if (hj && hj.deler && hj.deler.length > 1) {
        const SEK_IKON = { topp: 'mdi:lock-outline', rom: 'mdi:sofa-outline', alarm: 'mdi:shield-home-outline', hoyre: 'mdi:view-column-outline', stov: 'mdi:view-grid-outline' };
        const rek = seksjonsRekke(cfg).filter((k) => hj.deler.includes(k));
        const rader = [...rek, ...hj.deler.filter((k) => !SEK_V.includes(k))].map((k) => {
          const av = skj.has('sek:' + k), i = rek.indexOf(k), flytt = i >= 0 && rek.length > 1;
          return `<div class="rad-wrap"><div class="rad ${av ? 'av' : ''}">
            <ha-icon class="ri" icon="${SEK_IKON[k] || 'mdi:card-outline'}"></ha-icon>
            <span class="rt"><span class="rn">${esc(SEK_NAVN[k] || k)}</span><span class="ru">${SEK_V.includes(k) ? 'Venstre kolonne' : 'Høyre kolonne'}</span></span>
            ${flytt ? ib('sek-opp', k, 'mdi:arrow-up', 'Flytt opp', i === 0) + ib('sek-ned', k, 'mdi:arrow-down', 'Flytt ned', i === rek.length - 1) : ''}
            ${ib('sek-skjul', k, av ? 'mdi:eye-off-outline' : 'mdi:eye-outline', av ? 'Vis' : 'Skjul', false, !av)}
          </div></div>`;
        }).join('');
        sek = `<div class="hd">Seksjoner i ${esc(hj.navn)}</div><div class="liste">${rader}</div>`;
      }
      let fl = '';
      if (hj && hj.fliser && hj.fliser.length) {
        const stovAv = skj.has('sek:stov');
        fl = `<div class="hd">Fliser i ${esc(hj.navn)}</div><div class="liste">${hj.fliser.map((x) => {
          const av = skj.has(x.key);
          return `<div class="rad-wrap"><div class="rad ${av || stovAv ? 'av' : ''}">
            <ha-icon class="ri" icon="${esc(x.ikon)}"></ha-icon>
            <span class="rt"><span class="rn">${esc(x.navn)}</span>${x.sveip ? '<span class="ru">Sveipbar</span>' : ''}</span>
            ${ib('skjul', x.key, av ? 'mdi:eye-off-outline' : 'mdi:eye-outline', av ? 'Vis' : 'Skjul', false, !av)}
          </div></div>`;
        }).join('')}</div>`;
      }

      const romkort = u.romkort || cfg.romkort || 'monster';
      boks.innerHTML = `
        <div class="hd">Fanerada</div>
        <div class="gruppe">
          <div class="etikett">Bredde</div><div class="chips">
            ${[['standard', 'Standard'], ['kompakt', 'Kompakt'], ['full', 'Full']].map(([v, t]) => chip(p.bredde === v, 'fane', 'bredde', v, t)).join('')}</div>
          <div class="etikett">Høyde</div><div class="chips">
            ${[['standard', 'Standard'], ['lav', 'Lav'], ['middels', 'Middels'], ['hoy', 'Høy'], ['ekstra', 'Ekstra']].map(([v, t]) => chip(p.hoyde === v || (v === 'hoy' && p.hoyde === 'høy'), 'fane', 'hoyde', v, t)).join('')}</div>
        </div>
        ${sek}
        ${fl}
        <div class="hd">Faner og etasjer</div><div class="liste">${fRader}</div>
        ${utenHint}
        <div class="hd">Avstand under</div>
        <div class="gruppe"><div class="chips">
          ${[0, -40, -80, -120, -160, -200, -260, -320].map((v) => chip(p.bunn === v, 'bunn', '', String(v), v === 0 ? 'Ingen' : String(v).replace('-', '−') + ' px')).join('')}
        </div><div class="chips">
          ${chip(false, 'bunn-fin', '-10', '', '−10', 'mdi:arrow-up')}${chip(false, 'bunn-fin', '10', '', '+10', 'mdi:arrow-down')}
          <span class="etikett" style="align-self:center;padding:0 6px">Nå: ${p.bunn} px</span>
        </div></div>
        <div class="hd">Romkort</div>
        <div class="gruppe"><div class="chips">
          ${[['monster', 'Blandet'], ['stor', 'Stor'], ['middels', 'Middels'], ['liten', 'Liten']].map(([v, t]) => chip(romkort === v, 'romkort', '', v, t)).join('')}
          ${chip(p.klima, 'klima', '', '', 'Klimaknapp', 'mdi:thermostat')}
        </div></div>`;
      boks.scrollTop = rull;
    }

    _op(op, k, x) {
      if (op === 'lukk') { this._lukkTilpass(); return; }
      if (op === 'apne') { this._tpRom = this._tpRom === k ? null : k; this._tegnTilpass(); return; }
      const K = window.KI || {};
      const cfg = this._effCfg();
      const u = JSON.parse(JSON.stringify(bruker(cfg)));
      const bytt = (arr, a, d) => { const i = arr.indexOf(a), j = i + d; if (i < 0 || j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };
      const skjul = (nokkel) => { const s = skjulte(cfg); if (s.has(nokkel)) s.delete(nokkel); else s.add(nokkel); u.skjul = [...s]; };
      if (op === 'nullstill') { Object.keys(u).forEach((n) => delete u[n]); this._tpRom = null; }
      else if (op === 'opp' || op === 'ned') {
        const keys = (this._faner || []).map((f) => f.key);
        if (!bytt(keys, k, op === 'opp' ? -1 : 1)) return;
        u.rekkefolge = keys;
      } else if (op === 'skjul') {
        if (k === 'alle') u.alle_rom = !visAlle(cfg);
        else skjul(k);
      } else if (op === 'hjemrom') {
        /* Hjem-fanens rom: x legges i (eller tas ut av) venstre/høyre swipe. Dagens fordeling
           skrives ut, så resten blir stående der de er. */
        const f = (this._faner || []).find((y) => y.key === 'hjem');
        if (!f) return;
        const H = (f.hoyre || []).slice(), V = f.rom.filter((r) => !H.includes(r));
        const [inn, ut] = k === 'hoyre' ? [H, V] : [V, H];
        const i = inn.indexOf(x);
        if (i >= 0) inn.splice(i, 1);
        else { const j = ut.indexOf(x); if (j >= 0) ut.splice(j, 1); inn.push(x); }
        u.etasjer = { ...(u.etasjer || {}), hjem: [...V, ...H] };
        u.hjem_hoyre = H;
      } else if (op === 'rom') {
        const f = (this._faner || []).find((y) => y.key === k);
        if (!f) return;
        const etg = k === 'hjem' ? 'hjem' : f.etg;
        const list = f.rom.slice(), i = list.indexOf(x);
        if (i >= 0) list.splice(i, 1); else list.push(x);
        u.etasjer = { ...(u.etasjer || {}), [etg]: list };
      } else if (op === 'sek-opp' || op === 'sek-ned') {
        const hj = (this._faner || []).find((f) => f.key === 'hjem' && f.auto);
        const rek = seksjonsRekke(cfg).filter((s) => !hj || hj.deler.includes(s));
        if (!bytt(rek, k, op === 'sek-opp' ? -1 : 1)) return;
        u.seksjoner = [...rek, ...SEK_V.filter((s) => !rek.includes(s))];
      } else if (op === 'sek-skjul') skjul('sek:' + k);
      else if (op === 'romkort') u.romkort = x;
      else if (op === 'bunn') u.bunn = Number(x) || 0;
      else if (op === 'bunn-fin') u.bunn = Math.max(-600, Math.min(200, prefs(cfg).bunn + Number(k)));
      else if (op === 'klima') u.klimaknapp = !prefs(cfg).klima;
      else if (op === 'fane') u.fane = { ...(u.fane || {}), [k]: x };
      else return;
      K.fire && K.fire(this, 'haptic', 'selection');
      if (K.udSave) K.udSave(this._hass, 'ki_hjem', u);
    }
    getCardSize() { return this._card && this._card.getCardSize ? this._card.getCardSize() : 8; }
  }

  if (!customElements.get('ki-hjem-editor')) customElements.define('ki-hjem-editor', KiHjemEditor);
  if (!customElements.get('ki-hjem-card')) customElements.define('ki-hjem-card', KiHjemCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'ki-hjem-card', name: 'KI Hjem', description: 'Hele fane-blokken på forsiden (Hjem / etasjer / Aktuelt) bygget fra KI Rom', preview: false });
})();

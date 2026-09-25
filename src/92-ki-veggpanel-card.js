/*
 * ki-veggpanel-card — hele veggpanelet for stua, som ett kort.
 *
 * Tegnet etter DESIGN.md (mysmarthome): mørk bunn, gray200-kort med radius 24, lyse
 * ikonsirkler med tynn kant, navn i 14/500 med 70 % opasitet, store tall i vekt 300,
 * aktivfargen for det som er på. Trykk gjør handlingen, langt trykk åpner entiteten,
 * og alt som kan dras (lysstyrke, gardiner, strømprisen) kan leses og styres med fingeren.
 *
 * Oppbygning:  toppstripe  |  venstre: prosa, familie, scener
 *                          |  midten: media, klima, strøm
 *                          |  høyre: lys, markise og gardiner
 *
 * type: custom:ki-veggpanel-card
 * topp:                         # alle valgfrie, standard = oppsettet i stua
 *   vaer: weather.forecast_home
 *   hjemme: sensor.antall_personer_hjemme
 *   las: lock.dorlas_blatann
 *   alarm: alarm_control_panel.alarm
 *   stovsuger: vacuum.sir_sweeps_a_lot
 *   innstillinger: "#settings"
 *   vaer_trykk / hjemme_trykk / las_trykk / alarm_trykk / stovsuger_trykk: "#popup"  (ellers mer-info)
 * prosa:   { …ki-prosa-card }     # kortene monteres slik de er
 * familie: { …family-status-card }
 * media:   { …ki-media-card }
 * scener:
 *   - { navn: Filmkveld, ikon: mdi:movie-open, tap_action: {…}, aktiv: switch.x }
 * klima: [climate.stue_oljefyr, climate.stue_panelovn]
 * strom: { pris: sensor.…, effekt: sensor.strommaler_effekt, trykk: "#strom" }
 * lys:   { gruppe: light.stue, lamper: [light.a, { entity: light.b, navn: Leselampe }] }
 * skjerm: true            # fyller skjermen; hver kolonne ruller for seg (false = vanlig høyde)
 * luft_topp: 40             # px som trekkes fra skjermhøyden (margen i visningen)
 * luft_bunn: 110            # plass nederst til den flytende navbaren
 * dekker:
 *   - { navn: Markise, ikon: mdi:awning-outline, hoved: cover.markise,
 *       deler: [{ navn: Venstre, entity: cover.markise_venstre }, …], invertert: true }
 * dekker_visning: kompakt   # kompakt (rad med opp/stopp/ned per dekke) | full (segment, dra og forhåndsvalg)
 *
 * tema: varm               # varm (standard): formen fra iPad-skissen – størrelser, avrundinger, oppsett
 *                           # mysmarthome: formen fra før
 * farger: dashbord          # dashbord (standard): dashbordets egne farger, uendret
 *                           # varm: den ravgule, nesten svarte paletten fra skissen
 *
 * Nytt i 1.3:
 * klima:                    # styres gjennom KI Energi når integrasjonen finnes
 *   - { entity: climate.stue_oljefyr, navn: Oljefyr, sone: stue_oljefyr }   # sone gjettes ellers
 * overstyring_min: 120      # hvor lenge en manuell temperatur gjelder
 * plex:                     # «Nytt i Plex» – plakater i en rad
 *   sensorer: [sensor.…_recently_added_movie, sensor.…_recently_added_show]
 *   antall: 12
 * strom: false              # skjul strømkortet
 *
 * Nytt i 1.2:
 * meny:                     # sidemeny til venstre – erstatter den flytende navbaren
 *   - { ikon: mdi:sofa-outline, sti: /dashboard-stue/stue, navn: Stue }        # aktiv når stien er åpen
 *   - { ikon: mdi:robot-vacuum, sti: "#rolf", navn: Støvsuger,
 *       varsel: { entity: binary_sensor.sir_sweeps_a_lot_water_box_attached, state: "off" } }
 *   - { ikon: mdi:tune-variant, sti: "#settings", navn: Innstillinger, nederst: true }
 * strom:
 *   fast: sensor.norgespris_pris_na   # fastpris vises stort, spotprisen ved siden av
 *   fast_navn: Norgespris nå
 * lys:
 *   visning: rader          # rader (standard) | fliser
 * natt:                     # nattskjerm: stor, dempet klokke når panelet har stått urørt
 *   entity: switch.nattmodus          # vises bare når denne er på (utelatt = alltid etter pause)
 *   etter: 90                         # sekunder uten trykk
 *   vekking: sensor.soverom_vekking_neste_alarm
 *   kort: true              # animert nattkort øverst i midten mens nattmodus er på (false = av)
 *   kort_plass: bred        # bred: over midten og høyre | midt | venstre
 *   morgen_til: 9           # «God morgen»-kortet står fra nattmodus slås av om morgenen til kl. 9
 * klokke:                   # handlinger på klokka øverst til venstre
 *   tap_action: { action: navigate, navigation_path: /config }
 *   hold_action: { action: perform-action, perform_action: input_boolean.toggle, target: { entity_id: input_boolean.kiosk_mode } }
 * buss: { retninger: […] }   # ki-entur-card under varmen
 * levende: true             # farger fra lysene og varmen (false = bare dashbordets aksent)
 *   skjul: [plex]           # kort som legges bort mens nattmodus er på
 *   handlinger:
 *     - { navn: Nattlys, ikon: mdi:lightbulb-night-outline, tap_action: {…} }
 */
(() => {
  const VERSJON = "1.10.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const komma = (v, d = 0) => (isNaN(v) ? "–" : Number(v).toLocaleString("nb-NO", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const TIME = 3600000;

  const STD = {
    topp: {
      vaer: "weather.forecast_home", hjemme: "sensor.antall_personer_hjemme", las: "lock.dorlas_blatann",
      alarm: "alarm_control_panel.alarm", stovsuger: "vacuum.sir_sweeps_a_lot", innstillinger: "#settings",
      vaer_trykk: "#weather", alarm_trykk: "#alarm",
    },
    klima: [],
    scener: [],
    dekker: [],
  };

  const VAER = {
    "clear-night": ["Klar himmel", "mdi:weather-night"], sunny: ["Sol", "mdi:weather-sunny"],
    partlycloudy: ["Delvis skyet", "mdi:weather-partly-cloudy"], cloudy: ["Skyet", "mdi:weather-cloudy"],
    rainy: ["Regn", "mdi:weather-rainy"], pouring: ["Kraftig regn", "mdi:weather-pouring"],
    snowy: ["Snø", "mdi:weather-snowy"], "snowy-rainy": ["Sludd", "mdi:weather-snowy-rainy"],
    fog: ["Tåke", "mdi:weather-fog"], windy: ["Vind", "mdi:weather-windy"], "windy-variant": ["Vind", "mdi:weather-windy-variant"],
    lightning: ["Torden", "mdi:weather-lightning"], "lightning-rainy": ["Torden og regn", "mdi:weather-lightning-rainy"],
    hail: ["Hagl", "mdi:weather-hail"], exceptional: ["Ekstremvær", "mdi:alert"],
  };
  const LAS = { locked: "Låst", unlocked: "Ulåst", open: "Åpen", jammed: "Fastkjørt", locking: "Låser …", unlocking: "Låser opp …" };
  const ALARM = { disarmed: "Alarm av", armed_home: "Hjemme", armed_away: "Borte", armed_night: "Natt",
    armed_vacation: "Ferie", triggered: "Utløst!", arming: "Aktiverer …", pending: "Venter …" };
  const STOV = { docked: "Støvsuger ladet", cleaning: "Støvsuger går", returning: "Støvsuger på vei hjem", idle: "Støvsuger venter",
    paused: "Støvsuger på pause", error: "Støvsuger feil" };

  /* Temaet «varm», fra iPad-skissen: nesten svart bunn, kort i #1b1b1d med en
     hårfin kant, rolige grånyanser for tekst, og én varm, ravgul aksent for det som
     er på. Fargene settes som dashbordets egne variabler på rammen, så de innebygde
     kortene (prosa, familie, media) arver dem og ser ut som resten. */
  /* Temaet «varm», fra iPad-skissen. Delt i to:
     FORM – størrelser, avrundinger, avstander og oppsett. Gjelder med tema: varm.
     FARGER – den ravgule, nesten svarte paletten. Gjelder bare med farger: varm.
     Uten farger: varm beholder panelet dashbordets egne farger (--gray*, --active-big). */
  const TEMA_VARM = `
    .ramme.tema-varm { --str: 21px; gap: 16px; }
    .tema-varm .vp { gap: 16px; }
    .tema-varm .kol3 { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .tema-varm .kol { gap: 16px; }
    .tema-varm .kort { border-radius: 28px; padding: 18px; }
    .tema-varm .navn { font-size: 13px; font-weight: 400; opacity: 1; }
    .tema-varm .status { font-size: 16px; font-weight: 500; }
    .tema-varm .ik { width: 44px; height: 44px; }
    .tema-varm .hode { grid-template-columns: 44px minmax(0, 1fr) auto; }
    .tema-varm .klokke b { font-size: 76px; letter-spacing: -.04em; line-height: .9; }
    .tema-varm .klokke i { font-size: 18px; }
    .tema-varm .klokke small { font-size: 14px; opacity: 1; }
    .tema-varm .pille { height: 40px; padding: 0 14px 0 11px; border-radius: 20px; font-size: 14px; }
    .tema-varm .meny { width: 64px; border-radius: 32px; padding: 12px 0; gap: 4px; }
    .tema-varm .mk { width: 44px; height: 44px; border-radius: 22px; }
    .tema-varm .mk ha-icon { opacity: 1; }
    .tema-varm .mk .prikk { top: 8px; right: 8px; }
    .tema-varm .scener { gap: 10px; }
    .tema-varm .scene { min-height: 56px; padding: 0 14px 0 8px; gap: 12px; border-radius: 20px; }
    .tema-varm .scene .ik { width: 40px; height: 40px; }
    .tema-varm .sstatus { opacity: 1; }
    .tema-varm .scene.kjort { animation: vp-kjort-varm .5s ease; }
    .tema-varm .sone { grid-template-columns: 44px minmax(0, 1fr) auto; gap: 8px 10px; min-height: 72px; padding: 10px 0; }
    .tema-varm .sone .su { font-size: 12px; opacity: 1; }
    .tema-varm .still { grid-template-columns: 40px 64px 40px; gap: 4px; }
    .tema-varm .still b { font-size: 26px; letter-spacing: -.02em; }
    .tema-varm .still b sup { font-size: 15px; opacity: 1; top: 1px; }
    .tema-varm .lysliste { gap: 6px; }
    .tema-varm .lrad { grid-template-columns: 22px minmax(0, 1fr) auto 48px; gap: 12px; min-height: 42px; padding: 0 10px 0 14px; border-radius: 16px; }
    .tema-varm .lrad .lb { display: block; }
    .tema-varm .lrad .ln { font-size: 14px; opacity: .8; }
    .tema-varm .lrad.pa .ln { opacity: 1; }
    .tema-varm .lrad .lv { font-size: 13px; opacity: 1; min-width: 40px; }
    .tema-varm .bryter { width: 40px; height: 24px; }
    .tema-varm .bryter::after { width: 18px; height: 18px; top: 3px; left: 3px; }
    .tema-varm .bryter.pa::after { left: 19px; }
    .tema-varm .knapp { height: 36px; padding: 0 14px; border-radius: 18px; font-size: 13px; font-weight: 500; }
    .tema-varm .hint { opacity: 1; }
    .tema-varm .plakat .bilde { border-radius: 18px; }
    .tema-varm .pil { opacity: 1; }
    .tema-varm .drad .hode { grid-template-columns: 44px minmax(0, 1fr); }
    .tema-varm .drad .liten { font-size: 15px; font-weight: 500; }
    .tema-varm .drad .tre { display: flex; gap: 8px; }
    .tema-varm .drad .rund { width: 40px; height: 40px; }
  `;

  const FARGER_VARM = `
    .tema-varm.farger-varm .sone { border-top: 1px solid rgba(255,255,255,.06); }
    .ramme.tema-varm.farger-varm { --v-kort: #1b1b1d; --v-kant: rgba(255,255,255,.05); --v-inn: #232326; --v-inn2: #262629; --v-inn3: #29292c; --v-tekst: #f2f1ee; --v-demp: #8e8d89; --v-demp2: #a9a7a2; --v-svak: #6d6c69; --v-amber: oklch(0.82 0.12 75); --v-oransje: oklch(0.8 0.12 60); --gray000: #0f0f10; --gray100: var(--v-inn); --gray200: var(--v-kort); --gray800: var(--v-demp); --gray1000: var(--v-tekst); --active-big: var(--v-amber); --active-small: var(--v-amber); --black: #1a1a1a; --orange: var(--v-oransje); --prosa-tekst: #c9c7c2; --prosa-pille: var(--v-inn); --prosa-pille-tekst: var(--v-tekst); color: var(--v-tekst); }
    .tema-varm.farger-varm .kort { background: var(--v-kort); border: 1px solid var(--v-kant); }
    .tema-varm.farger-varm .navn { color: var(--v-demp); }
    .tema-varm.farger-varm .ik { background: var(--v-inn2); border: 0; color: var(--v-demp2); }
    .tema-varm.farger-varm .ik ha-icon { --mdc-icon-size: 22px; }
    .tema-varm.farger-varm .ik.fylt { background: var(--v-amber); color: #1a1a1a; box-shadow: 0 0 24px oklch(0.82 0.12 75 / .35); }
    .tema-varm.farger-varm .ik.varm { background: var(--v-oransje); color: #1a1a1a; }
    .tema-varm.farger-varm .klokke small { color: var(--v-demp); }
    .tema-varm.farger-varm .pille { background: var(--v-kort); border: 1px solid var(--v-kant); }
    .tema-varm.farger-varm .pille ha-icon { --mdc-icon-size: 19px; color: var(--v-demp2); }
    .tema-varm.farger-varm .pille.fylt { background: var(--v-amber); color: #1a1a1a; }
    .tema-varm.farger-varm .pille.fylt ha-icon { color: #1a1a1a; }
    .tema-varm.farger-varm .meny { background: var(--v-kort); border: 1px solid var(--v-kant); }
    .tema-varm.farger-varm .mk { color: var(--v-demp); }
    .tema-varm.farger-varm .mk ha-icon { --mdc-icon-size: 22px; }
    .tema-varm.farger-varm .mk.aktiv { background: #2c2c2f; color: var(--v-tekst); }
    .tema-varm.farger-varm .mk .prikk { border-color: var(--v-kort); }
    .tema-varm.farger-varm .scene { background: var(--v-inn); }
    .tema-varm.farger-varm .scene .ik { background: #2e2e31; color: #e6e4df; }
    .tema-varm.farger-varm .scene .ik ha-icon { --mdc-icon-size: 20px; }
    .tema-varm.farger-varm .scene.aktiv { background: oklch(0.82 0.12 75 / .14); color: var(--v-tekst); box-shadow: inset 0 0 0 1px oklch(0.82 0.12 75 / .35); }
    .tema-varm.farger-varm .scene.aktiv .ik { background: var(--v-amber); color: #1a1a1a; }
    .tema-varm.farger-varm .sstatus { color: var(--v-demp); }
    40% { background: oklch(0.82 0.12 75 / .3); }
    .tema-varm.farger-varm .sone .su { color: var(--v-demp); }
    .tema-varm.farger-varm .sone .su b { color: var(--v-demp2); }
    .tema-varm.farger-varm .still .rund { background: var(--v-inn2); }
    .tema-varm.farger-varm .still b sup { color: var(--v-demp); }
    .tema-varm.farger-varm .mpille { background: oklch(0.82 0.12 75 / .16); color: oklch(0.9 0.08 80); }
    .tema-varm.farger-varm .mpille button { background: oklch(0.82 0.12 75 / .25); }
    .tema-varm.farger-varm .rund { background: var(--v-inn2); }
    .tema-varm.farger-varm .lrad { background: #212124; }
    .tema-varm.farger-varm .lrad.pa { background: #26241f; }
    .tema-varm.farger-varm .lrad.lys { color: var(--v-tekst); }
    .tema-varm.farger-varm .lrad > .fyll { background: linear-gradient(90deg, oklch(0.82 0.12 75 / .10), oklch(0.82 0.12 75 / .24)); }
    .tema-varm.farger-varm .lrad > .fyll.kant { border-right: 2px solid oklch(0.82 0.12 75 / .7); }
    .tema-varm.farger-varm .lrad .lb { color: #5d5c5a; }
    .tema-varm.farger-varm .lrad.pa .lb { color: var(--v-amber); filter: drop-shadow(0 0 6px oklch(0.82 0.12 75 / .6)); }
    .tema-varm.farger-varm .lrad .lv { color: var(--v-svak); }
    .tema-varm.farger-varm .lrad.pa .lv { color: oklch(0.9 0.08 80); }
    .tema-varm.farger-varm .bryter { background: #38383b; }
    .tema-varm.farger-varm .bryter::after { background: #bdbbb6; }
    .tema-varm.farger-varm .bryter.pa, .tema-varm.farger-varm .lrad.pa .bryter { background: var(--v-amber); }
    .tema-varm.farger-varm .bryter.pa::after { background: #1a1a1a; }
    .tema-varm.farger-varm .knapp { background: var(--v-inn3); color: var(--v-tekst); }
    .tema-varm.farger-varm .hint { color: var(--v-svak); }
    .tema-varm.farger-varm .plakat .bilde { background: var(--v-inn); }
    .tema-varm.farger-varm .pil { color: var(--v-svak); }
    .tema-varm.farger-varm .drad .rund ha-icon { --mdc-icon-size: 20px; }
    .tema-varm.farger-varm .drad + .drad { border-top-color: rgba(255,255,255,.06); }
    @keyframes vp-kjort-varm { 40% { background: oklch(0.82 0.12 75 / .3); } }
`;

  /* Farge per menypunkt: kjente sider får sin egen (strøm gul, klima oransje, Tesla rød …),
     resten går rundt i paletten. `farge:` på punktet overstyrer. */
  const MENYFARGER = [
    [/innstill|settings|tune/i, "var(--blue, #6f9fe0)"],
    [/kart|map|posisjon/i, "var(--green, #6fcf8e)"],
    [/buss|bus|entur|ruter|kollektiv/i, "var(--red, #e5646a)"],
    [/strom|strøm|energi|power/i, "var(--yellow, #f2c94c)"], [/klima|varme|thermo/i, "var(--orange, #f2a33c)"],
    [/tesla|bil|car/i, "var(--red, #e5646a)"], [/media|musikk|music|tv/i, "var(--pink, #ff8ac0)"],
    [/server|nett|network/i, "var(--blue, #6f9fe0)"], [/data|pc|desktop|comput/i, "var(--teal, #40c8e0)"],
    [/plante|hage|sprout|garden/i, "var(--green, #6fcf8e)"], [/søvn|sovn|sleep|natt/i, "var(--purple, #b39cf0)"],
    [/3d|printer/i, "var(--cyan, #5fd3c4)"], [/rolf|støvsuger|vacuum|robot/i, "var(--teal, #40c8e0)"],
    [/vann|water|basseng|pool/i, "var(--blue, #6f9fe0)"], [/alarm|sikker|shield/i, "var(--red, #e5646a)"],
  ];
  const PALETT = ["var(--blue, #6f9fe0)", "var(--green, #6fcf8e)", "var(--orange, #f2a33c)", "var(--purple, #b39cf0)",
    "var(--pink, #ff8ac0)", "var(--teal, #40c8e0)", "var(--yellow, #f2c94c)", "var(--red, #e5646a)"];
  function menyFarge(x, i) {
    const tekst = `${x.navn || ""} ${x.sti || ""} ${x.ikon || x.icon || ""}`;
    const treff = MENYFARGER.find(([m]) => m.test(tekst));
    return treff ? treff[1] : PALETT[i % PALETT.length];
  }

  /* Ikon per lampe ut fra navnet, når lampa ikke har et eget ikon. */
  const LAMPEIKON = [
    [/stålampe|stalampe|gulvlampe|floor/i, "mdi:floor-lamp"], [/taklampe|tak(?!list)|ceiling/i, "mdi:ceiling-light"],
    [/taklist|led|list|strip/i, "mdi:led-strip-variant"], [/spisebord|pendel|dining/i, "mdi:ceiling-light-multiple"],
    [/peis|fire/i, "mdi:fireplace"], [/sofabord|bordlampe|table|nattbord/i, "mdi:lamp"],
    [/skjenk|kommode|hylle|shelf/i, "mdi:lamp-outline"], [/vindu|window/i, "mdi:window-shutter-open"],
    [/spot|downlight/i, "mdi:light-recessed"], [/ute|hage|garden|terrasse|veranda/i, "mdi:outdoor-lamp"],
  ];
  function lampeIkon(navn, pa) {
    const t = LAMPEIKON.find(([m]) => m.test(navn || ""));
    return t ? t[1] : pa ? "mdi:lightbulb" : "mdi:lightbulb-outline";
  }

  const CSS = `
    :host { display: block; }
    * { box-sizing: border-box; min-width: 0; }
    .vp {
      color: var(--gray1000, #fafbfc); font-family: inherit;
      display: grid; gap: 16px; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
    }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    ha-icon { --mdc-icon-size: 22px; }

    /* toppstripe */
    .topp { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-height: 72px; }
    button.klokke { text-align: left; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    button.klokke:active { opacity: .75; }
    .klokke { display: flex; align-items: flex-end; gap: 16px; margin-right: auto; }
    .klokke b { font-size: 68px; font-weight: 300; letter-spacing: -3px; line-height: .85; font-variant-numeric: tabular-nums; }
    .klokke span { display: grid; gap: 2px; padding-bottom: 2px; }
    .klokke i { font-style: normal; font-size: 17px; font-weight: 500; }
    .klokke small { font-size: 14px; font-weight: 500; opacity: .7; }
    .pille { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 12px; border-radius: 999px;
      background: var(--gray200); font-size: 15px; font-weight: 500; white-space: nowrap; transition: transform .14s cubic-bezier(.2,1.3,.3,1), background .25s; }
    .pille ha-icon { --mdc-icon-size: 20px; }
    .pille:active { transform: scale(.95); }
    .pille.fylt { background: var(--active-big); color: var(--black); }
    .pille.rund { width: 44px; padding: 0; justify-content: center; }

    /* ramme: sidemeny + panelet */
    .ramme { display: flex; gap: 20px; color: var(--gray1000, #fafbfc); -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
    .ramme > .vp { flex: 1; min-width: 0; }
    .ramme.skjerm { height: var(--vp-h); }
    .meny { flex: none; width: 68px; display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 8px 0; border-radius: 24px; background: var(--gray200); }
    .meny .fyllrom { flex: 1; }
    .mk { position: relative; width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center;
      transition: background .2s, transform .14s cubic-bezier(.2,1.3,.3,1); }
    .mk ha-icon { --mdc-icon-size: 24px; opacity: .85; }
    .mk:active { transform: scale(.92); }
    .mk.aktiv { background: var(--active-big); color: var(--black); }
    .mk.aktiv ha-icon { opacity: 1; }
    .mk .prikk { position: absolute; top: 11px; right: 11px; width: 10px; height: 10px; border-radius: 50%;
      background: var(--red, #e5646a); border: 2px solid var(--gray200); }

    /* kolonner */
    .kol3 { display: grid; grid-template-columns: 340px minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
    .kol { display: grid; gap: 16px; align-content: start; }
    /* Skjermmodus: panelet fyller høyden, og hver kolonne ruller for seg – så ingenting
       havner under navbaren, og det lange (lys, gardiner) ikke skyver resten ned. */
    .vp.skjerm { height: 100%; grid-template-rows: auto minmax(0, 1fr); }
    .vp.skjerm .kol3 { min-height: 0; height: 100%; align-items: stretch; }
    /* Kolonnene fyller høyden, og ett kort i hver vokser til bunnen – så det ikke står
       tomrom under. Ruller en kolonne likevel (lite vindu), gjør den det uten maske:
       masken og containment gjorde kolonnen til en egen stabel, og familiedialogen
       (position: fixed) havnet bak midtkolonnen. */
    .vp.skjerm .kol { display: flex; flex-direction: column; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
      padding-bottom: var(--vp-bunn); scrollbar-width: none; }
    .vp.skjerm .kol > * { flex: none; }
    .vp.skjerm .kol > .vokser { flex: 1 1 auto; display: flex; flex-direction: column; min-height: min-content; }
    .vp.skjerm .vokser > .kort { flex: 1 1 auto; display: flex; flex-direction: column; }
    .vp.skjerm .vokser .scener { flex: 1; grid-auto-rows: 1fr; }
    .vp.skjerm .vokser .lysliste { flex: 1; grid-auto-rows: minmax(52px, 1fr); }
    .vp.skjerm .vokser .plex { flex: 1; align-items: center; }
    .vp.skjerm .kol::-webkit-scrollbar { display: none; }
    @media (max-width: 1000px) { .ramme.skjerm { height: auto; } .vp.skjerm { height: auto; } .vp.skjerm .kol { overflow: visible; -webkit-mask-image: none; } .kol3 { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .kol.midt { grid-column: 1 / -1; order: -1; } }
    @media (max-width: 700px) { .kol3 { grid-template-columns: minmax(0, 1fr); } .kol.midt { order: 0; }
      .ramme { flex-direction: column; } .meny { width: auto; flex-direction: row; overflow-x: auto; padding: 6px; scrollbar-width: none; } .meny .fyllrom { display: none; } .mk { flex: none; } }

    .kort { background: var(--gray200); border-radius: 24px; padding: 16px; display: grid; gap: 12px; }
    .vert { display: block; }
    .vert > * { display: block; }
    .hode { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 12px; align-items: center; text-align: left; }
    .ik { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
      background: rgba(250,251,252,.1); border: 1px solid rgba(250,251,252,.1); }
    .ik ha-icon { --mdc-icon-size: 24px; }
    .ik.fylt { background: var(--active-big); border-color: transparent; color: var(--black); }
    .ik.varm { background: var(--orange); border-color: transparent; color: var(--black); }
    .navn { font-size: 14px; font-weight: 500; opacity: .7; }
    .status { font-size: 18px; font-weight: 300; line-height: 1.2; }
    .liten { font-size: 14px; font-weight: 500; }

    .shode { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .sstatus { font-size: 12px; font-weight: 500; opacity: .6; }
    .lrad .lb { --mdc-icon-size: 20px; display: block; opacity: .75; }
    .lrad.pa .lb { opacity: 1; }
    .hint { font-size: 11px; opacity: .5; text-align: center; }
    .pil { --mdc-icon-size: 20px; opacity: .45; }
    /* Kolonnene står på faste plasser, så nattkortet kan legge seg over to av dem. */
    .kol3 > .kol.venstre { grid-column: 1; grid-row: 1 / span 2; }
    .kol3 > .kol.midt { grid-column: 2; grid-row: 1 / span 2; }
    .kol3 > .kol.hoyre { grid-column: 3; grid-row: 1 / span 2; }
    .kol3 { grid-template-rows: minmax(0, 1fr); }
    .kol3.med-natt { grid-template-rows: auto minmax(0, 1fr); }
    .kol3.med-natt > .kol.midt, .kol3.med-natt > .kol.hoyre { grid-row: 2; }
    #nattkort:empty { display: none; }
    #nattkort.plass-bred { grid-column: 2 / 4; grid-row: 1; }
    #nattkort.plass-midt { grid-column: 2; grid-row: 1; }
    #nattkort.plass-venstre { grid-column: 1; grid-row: 1; }
    .kol3.med-natt.natt-venstre > .kol.venstre { grid-row: 2; }
    .kol3.med-natt.natt-midt > .kol.hoyre { grid-row: 1 / span 2; }
    @media (max-width: 1000px) { .kol3 > .kol, .kol3.med-natt > .kol { grid-column: auto; grid-row: auto; }
      #nattkort.plass-bred, #nattkort.plass-midt, #nattkort.plass-venstre { grid-column: 1 / -1; grid-row: auto; } }
    #nattkort .nattkort { min-height: 176px; height: 100%; }
    #nattkort.plass-bred .nk-innhold { max-width: 70%; }
    .nk-lukk { position: absolute; top: 12px; right: 12px; z-index: 2; width: 34px; height: 34px; border-radius: 17px;
      background: rgba(255,255,255,.16); color: inherit; display: grid; place-items: center; }
    .nk-lukk ha-icon { --mdc-icon-size: 18px; }
    /* morgenkortet: soloppgang */
    .nattkort.morgen { color: #3a2412; background: linear-gradient(170deg, #ffd9a8 0%, #ffc28a 38%, #f7a582 70%, #d98c9c 100%); }
    .nattkort.morgen .nb { background: rgba(255,255,255,.4); }
    .nattkort.morgen .nb.ok ha-icon { color: #2f7a45; }
    .nattkort.morgen .nb.obs ha-icon { color: #b0501e; }
    .nattkort.morgen .nk-knapp { background: rgba(255,255,255,.45); color: #3a2412; }
    .nattkort.morgen .nk-lukk { background: rgba(255,255,255,.4); }
    .sol { position: absolute; right: 56px; bottom: -34px; width: 110px; height: 110px; border-radius: 50%;
      background: radial-gradient(circle at 50% 45%, #fff6d6, #ffd36b 55%, #ffb347 100%);
      box-shadow: 0 0 60px 20px rgba(255,200,90,.55); animation: nk-opp 2.4s cubic-bezier(.2,.8,.2,1) both, nk-pust 5s ease-in-out 2.4s infinite; }
    @keyframes nk-opp { from { transform: translateY(70px); } }
    @keyframes nk-pust { 50% { box-shadow: 0 0 80px 30px rgba(255,200,90,.6); } }
    .straale { position: absolute; right: 108px; bottom: 20px; width: 3px; height: 150px; border-radius: 2px; transform-origin: 50% 100%;
      background: linear-gradient(to top, rgba(255,240,200,.55), rgba(255,240,200,0)); animation: nk-straale 6s ease-in-out infinite; }
    @keyframes nk-straale { 50% { opacity: .45; } }
    .fugl { position: absolute; width: 16px; height: 6px; border-top: 2px solid rgba(90,50,40,.55); border-radius: 50% 50% 0 0;
      animation: nk-fly 18s linear infinite; }
    .fugl::after { content: ""; position: absolute; left: 8px; top: -2px; width: 8px; height: 6px; border-top: 2px solid rgba(90,50,40,.55); border-radius: 50% 50% 0 0; }
    @keyframes nk-fly { from { transform: translateX(-40px) translateY(0); } 50% { transform: translateX(50cqw) translateY(-12px); } to { transform: translateX(calc(100cqw + 40px)) translateY(4px); } }

    /* levende farger: varmen og lysene får farge fra det de faktisk gjør */
    .levende .sone .ik.varm { background: linear-gradient(145deg, #ffb347, #ff6f3c); color: #2a1206; box-shadow: 0 0 22px rgba(255,120,60,.45); }
    .levende .sone .ik.varm ha-icon { animation: vp-flamme 1.6s ease-in-out infinite; }
    @keyframes vp-flamme { 50% { transform: translateY(-2px) scale(1.06); } }
    .levende .sone .ik.kald { background: linear-gradient(145deg, #7fc4ff, #4b7bff); color: #0b1a33; }
    .levende .sone .still b { background: var(--vp-temp, none); -webkit-background-clip: text; background-clip: text; }
    .levende .sone .still b.farget { color: transparent; }
    .temp-stolpe { grid-column: 2 / -1; height: 4px; border-radius: 2px; background: rgba(255,255,255,.08); position: relative; overflow: hidden; margin-top: -4px; }
    .temp-stolpe i { position: absolute; inset: 0 auto 0 0; border-radius: 2px; background: linear-gradient(90deg, #4b9bff, #ffb347 70%, #ff6f3c); }
    .levende .lrad.farge > .fyll { background: linear-gradient(90deg, color-mix(in srgb, var(--lysfarge) 45%, transparent), color-mix(in srgb, var(--lysfarge) 85%, transparent)); }
    .levende .lrad.farge.pa { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lysfarge) 45%, transparent), 0 0 18px color-mix(in srgb, var(--lysfarge) 22%, transparent); }
    .levende .lrad.farge .lb { color: var(--lysfarge); filter: drop-shadow(0 0 6px var(--lysfarge)); }
    .levende .lrad.farge.lys .lb { color: #1a1206; filter: none; }
    .levende .lrad.farge.lys { color: #1a1206; }
    .levende .hode .ik.fylt.lysglod { background: var(--lysglod, var(--active-big)); box-shadow: 0 0 24px color-mix(in srgb, var(--lysglod-farge, #ffd27a) 55%, transparent); }

    /* Plex: stor plakat med bakgrunnsbilde, byttes hvert 10. sekund og kan sveipes */
    .vp.skjerm .vokser > .plexhero { flex: 1 1 auto; }
    .plexhero { position: relative; overflow: hidden; border-radius: 28px; min-height: 190px; height: 100%; color: #fff;
      background: #151515; touch-action: pan-y; cursor: pointer; }
    .plexhero .bak { position: absolute; inset: 0; background-size: cover; background-position: center; transition: opacity .8s ease; opacity: 0; transform: scale(1.04); }
    .plexhero .bak.vis { opacity: 1; animation: vp-ken 12s ease-out both; }
    @keyframes vp-ken { from { transform: scale(1.12); } to { transform: scale(1.02); } }
    .plexhero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.05) 100%); }
    .plexhero .ph-inn { position: absolute; left: 18px; right: 18px; bottom: 30px; z-index: 1; display: grid; gap: 3px; }
    .plexhero .ph-merke { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #e5a00d; }
    .plexhero .ph-merke ha-icon { --mdc-icon-size: 16px; }
    .plexhero .ph-tittel { font-size: 22px; font-weight: 500; line-height: 1.15; text-shadow: 0 1px 8px rgba(0,0,0,.5);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .plexhero .ph-under { font-size: 13px; opacity: .85; }
    .plexhero .prikker { position: absolute; left: 18px; bottom: 12px; z-index: 1; display: flex; gap: 4px; }
    .plexhero .prikker i { width: 6px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.55); transition: width .3s; }
    .plexhero .prikker i.aktiv { width: 14px; background: rgba(255,255,255,.95); }
    .plexhero .tomt { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 4px; padding: 16px; z-index: 1; font-size: 13px; opacity: .8; }
    /* Sidemenyen i farger: hvert ikon i sin farge på en svak tone av samme farge; den
       aktive siden fylles helt og gløder. Varselprikken er fortsatt rød. */
    /* Rolig til vanlig: bare siden som er åpen, får fargen sin – og punktene nederst
       (innstillinger), som alltid har den. */
    .levende .meny .mk.alltid { color: var(--mf); background: color-mix(in srgb, var(--mf) 13%, transparent); }
    .levende .meny .mk ha-icon { opacity: 1; }
    .levende .meny .mk:hover { background: color-mix(in srgb, var(--mf) 18%, transparent); color: var(--mf); }
    .levende .meny .mk.aktiv { background: var(--mf); color: var(--black, #161618);
      box-shadow: 0 0 18px color-mix(in srgb, var(--mf) 55%, transparent); }
    .levende .meny { gap: 8px; }
    /* nattkortet */
    .nattkort { position: relative; overflow: hidden; isolation: isolate; border-radius: 28px; min-height: 210px;
      color: #eef0ff; background: linear-gradient(160deg, #161a36 0%, #231f4a 55%, #35295a 100%);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); animation: nk-inn .6s cubic-bezier(.2,.9,.3,1); }
    @keyframes nk-inn { from { opacity: 0; transform: translateY(8px) scale(.985); } }
    .himmel { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .himmel .stj { position: absolute; border-radius: 50%; background: #fff; box-shadow: 0 0 6px rgba(255,255,255,.8);
      animation: nk-blink ease-in-out infinite; }
    @keyframes nk-blink { 0%, 100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.15); } }
    .maane { position: absolute; right: 34px; top: 26px; width: 58px; height: 58px; border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #fffbe8, #f3e7b5 70%);
      box-shadow: 0 0 28px 6px rgba(255,241,190,.35), 0 0 80px 20px rgba(160,150,255,.18);
      animation: nk-sveve 7s ease-in-out infinite; }
    .maane .skygge { position: absolute; width: 50px; height: 50px; border-radius: 50%; top: -6px; left: 16px;
      background: #241f4b; opacity: .92; }
    @keyframes nk-sveve { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .sky { position: absolute; height: 26px; border-radius: 999px; background: rgba(210,210,255,.10); filter: blur(2px); }
    .sky::before, .sky::after { content: ""; position: absolute; border-radius: 50%; background: inherit; }
    .sky::before { width: 34px; height: 34px; left: 14px; top: -16px; }
    .sky::after { width: 26px; height: 26px; left: 40px; top: -10px; }
    .sky.s1 { width: 110px; top: 118px; left: -120px; animation: nk-drive 38s linear infinite; }
    .sky.s2 { width: 80px; top: 70px; left: -90px; opacity: .7; animation: nk-drive 52s linear infinite; animation-delay: -20s; }
    @keyframes nk-drive { to { transform: translateX(calc(100cqw + 260px)); } }
    .nattkort { container-type: inline-size; }
    .skudd { position: absolute; top: 18px; left: 60%; width: 90px; height: 2px; border-radius: 2px; opacity: 0;
      background: linear-gradient(90deg, rgba(255,255,255,0), #fff); transform: rotate(-22deg);
      animation: nk-skudd 9s ease-in infinite; animation-delay: 3s; }
    @keyframes nk-skudd { 0%, 88% { opacity: 0; transform: translate(0, 0) rotate(-22deg); }
      90% { opacity: 1; } 100% { opacity: 0; transform: translate(-160px, 64px) rotate(-22deg); } }
    .nk-innhold { position: relative; padding: 18px 20px; display: grid; gap: 6px; max-width: calc(100% - 90px); }
    .nk-etikett { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; opacity: .75; }
    .nk-etikett ha-icon { --mdc-icon-size: 16px; }
    .nk-tittel { font-size: 30px; font-weight: 300; letter-spacing: -.02em; line-height: 1.1; }
    .nk-under { font-size: 14px; font-weight: 500; opacity: .75; }
    .nk-bitar { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .nb { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px 0 8px; border-radius: 14px;
      background: rgba(255,255,255,.1); font-size: 12.5px; font-weight: 500; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    .nb ha-icon { --mdc-icon-size: 15px; }
    .nb.ok ha-icon { color: #9fe0b0; }
    .nb.obs ha-icon { color: #ffd38a; }
    .nk-knapper { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .nk-knapp { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px 0 11px; border-radius: 19px;
      background: rgba(255,255,255,.14); color: #fff; font-size: 13.5px; font-weight: 500; transition: transform .14s cubic-bezier(.2,1.3,.3,1), background .2s; }
    .nk-knapp ha-icon { --mdc-icon-size: 18px; }
    .nk-knapp:active { transform: scale(.94); }
    .nk-knapp.av { background: #f3e7b5; color: #231f4b; }
    @media (prefers-reduced-motion: reduce) { .nattkort *, .nattkort { animation: none !important; } }
    /* scener */
    .scener { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .scene { display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 9px 12px 9px 9px; border-radius: 22px;
      background: var(--gray100); text-align: left; font-size: 15px; font-weight: 500;
      transition: background .25s, transform .14s cubic-bezier(.2,1.3,.3,1); }
    .scene:active { transform: scale(.96); }
    .scene .ik { flex: none; }
    .scene.aktiv { background: var(--active-big); color: var(--black); }
    .scene.aktiv .ik { background: rgba(0,0,0,.1); border-color: rgba(0,0,0,.08); }
    .scene.kjort { animation: vp-kjort .5s ease; }
    @keyframes vp-kjort { 40% { background: var(--active-big); color: var(--black); } }

    /* varme (1.3): ett kort, én rad per sone, KI Energi bak */
    .varme { display: grid; gap: 0; }
    .sone { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 0; }
    .sone + .sone { border-top: 1px solid rgba(250,251,252,.08); }
    .sone .ik.varm { background: var(--orange); border-color: transparent; color: var(--black); }
    .sone .sn { font-size: 15px; font-weight: 500; }
    .sone .su { font-size: 13px; font-weight: 500; opacity: .7; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sone .su b { font-weight: 500; opacity: 1; color: var(--gray1000); }
    .still { display: grid; grid-template-columns: 40px 92px 40px; align-items: center; gap: 2px; }
    .still .rund { width: 40px; height: 40px; }
    .still .rund ha-icon { --mdc-icon-size: 20px; }
    .still b { text-align: center; font-size: 32px; font-weight: 300; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1; }
    .still b sup { font-size: 16px; opacity: .7; vertical-align: top; position: relative; top: 3px; }
    .still.venter b { opacity: .55; }
    .manuell { grid-column: 2 / -1; display: flex; align-items: center; gap: 8px; margin-top: -2px; }
    .mpille { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 6px 0 12px; border-radius: 999px;
      background: var(--active-big); color: var(--black); font-size: 12.5px; font-weight: 500; }
    .mpille button { width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,.12); display: grid; place-items: center; }
    .mpille ha-icon { --mdc-icon-size: 14px; }
    .kilder { font-size: 12px; font-weight: 500; opacity: .55; }
    /* Plex */
    .plex { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
      margin: 0 -16px; padding: 0 16px 2px; -webkit-mask-image: linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 24px), transparent); }
    .plex::-webkit-scrollbar { display: none; }
    .plakat { flex: none; width: 108px; scroll-snap-align: start; display: grid; gap: 6px; text-align: left; }
    .plakat .bilde { position: relative; width: 108px; height: 160px; border-radius: 16px; overflow: hidden; background: var(--gray100);
      display: grid; place-items: center; }
    .plakat .bilde img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .plakat .bilde .merke { position: absolute; left: 6px; top: 6px; padding: 2px 7px; border-radius: 999px; font-size: 10.5px; font-weight: 500;
      background: rgba(20,20,22,.72); color: #fff; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    .plakat .pt { font-size: 13px; font-weight: 500; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .plakat .pu { font-size: 12px; font-weight: 500; opacity: .6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .plakat:active .bilde { transform: scale(.97); }
    /* klima */
    .klima { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .termo { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; }
    .termo b { text-align: center; white-space: nowrap; font-size: clamp(34px, 3.4vw, 46px); font-weight: 300; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
    .termo b sup { font-size: 22px; font-weight: 300; opacity: .7; vertical-align: top; position: relative; top: 6px; margin-left: 1px; }
    .rund { width: 48px; height: 48px; border-radius: 50%; background: var(--gray100); display: grid; place-items: center; transition: transform .12s; }
    .rund:active { transform: scale(.9); }
    .termo.venter b { opacity: .55; }
    .termo .rund { width: 44px; height: 44px; }

    /* strøm */
    .tallrad { display: flex; justify-content: space-between; align-items: end; gap: 12px; }
    .tall { font-size: 30px; font-weight: 300; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .tall small { font-size: 14px; font-weight: 500; opacity: .7; }
    .soyler { position: relative; height: 96px; display: flex; align-items: flex-end; gap: 3px; touch-action: pan-y; }
    .soyler.peker { touch-action: none; }
    .soyler i { flex: 1; border-radius: 3px; min-height: 3px; transition: opacity .15s;
      background: color-mix(in srgb, var(--gray1000, #fafbfc) 22%, transparent); }
    .soyler i.billig { background: var(--blue, #8ab4f8); }
    .soyler i.naa { background: var(--active-big); }
    .soyler i.forbi { opacity: .4; }
    .soyler.peker i { opacity: .35; }
    .soyler.peker i.valgt { opacity: 1; }
    .lapp { position: absolute; top: -6px; transform: translate(-50%, -100%); padding: 6px 10px; border-radius: 12px;
      background: var(--gray1000); color: var(--gray200); white-space: nowrap; pointer-events: none; display: grid; text-align: center; }
    .lapp b { font-size: 16px; font-weight: 500; }
    .lapp span { font-size: 11px; opacity: .8; }
    .akse { display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; opacity: .7; }
    .strom3 { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 18px; align-items: end; text-align: left; }
    .strom3 .hoyre { text-align: right; }
    .strom3 .tall.lite { font-size: 22px; }
    .forklaring { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; font-weight: 500; opacity: .8; }
    .forklaring span { display: flex; align-items: center; gap: 6px; }
    .forklaring i { width: 10px; height: 10px; border-radius: 3px; }

    /* lys som rader: hele raden er knappen, bryteren viser tilstanden, dra sidelengs dimmer */
    /* Lysradene: hele raden er glideren. Fyllet er lysstyrken, trykk slår av og på,
       dra sidelengs dimmer. Før var glideren en 3 px strek under navnet – vanskelig å
       treffe med en finger på et veggpanel. */
    .lysliste { display: grid; gap: 6px; }
    .lrad { position: relative; overflow: hidden; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto 48px; gap: 10px;
      align-items: center; min-height: 52px; padding: 0 8px 0 14px; border-radius: 16px; background: var(--gray100);
      text-align: left; touch-action: pan-y; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .lrad:active { transform: scale(.985); }
    .lrad > .fyll { position: absolute; inset: 0 auto 0 0; background: var(--active-big); transition: width .25s ease; pointer-events: none; }
    .lrad.drar > .fyll { transition: none; }
    .lrad > :not(.fyll) { position: relative; }
    .lrad .ln { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .75; }
    .lrad.pa .ln { opacity: 1; }
    .lrad .lv { font-size: 14px; font-weight: 500; opacity: .75; font-variant-numeric: tabular-nums; text-align: right; }
    .lrad.lys { color: var(--black); }
    .lrad .bryter { justify-self: end; }
    .lrad.pa .bryter { background: rgba(0,0,0,.18); }
    .knapp { height: 44px; padding: 0 16px; border-radius: 999px; background: var(--gray100); font-size: 14px; font-weight: 500;
      transition: transform .12s; }
    .knapp:active { transform: scale(.94); }

    /* dekker, kompakt: én rad per dekke med opp / stopp / ned */
    .drad { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
    .drad + .drad { border-top: 1px solid rgba(250,251,252,.06); padding-top: 12px; }
    .drad .hode { grid-template-columns: 46px minmax(0, 1fr); }
    .tre { display: flex; gap: 6px; }
    .tre .rund { width: 44px; height: 44px; }

    /* nattskjerm */
    .natt { position: fixed; inset: 0; z-index: 9; background: #0b0b0c; color: #a7a29c; display: none;
      flex-direction: column; justify-content: space-between; padding: 40px 48px; }
    .natt.vis { display: flex; animation: vp-inn .6s ease; }
    @keyframes vp-inn { from { opacity: 0; } }
    .natt .nt { display: flex; justify-content: space-between; font-size: 16px; font-weight: 500; color: #8d8984; }
    .natt .nt span, .natt .ns span { display: flex; align-items: center; gap: 8px; }
    .natt .nm { display: grid; justify-items: center; gap: 18px; }
    .natt .nk { font-size: min(220px, 26vw); font-weight: 300; line-height: .85; letter-spacing: -.045em; font-variant-numeric: tabular-nums; }
    .natt .nd { font-size: 24px; color: #7a7671; }
    .natt .ns { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; font-size: 17px; color: #8d8984; margin-top: 8px; }
    .natt .nb { display: grid; gap: 18px; justify-items: center; }
    .natt .nh { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .natt .nh button { height: 56px; padding: 0 24px; border-radius: 999px; border: 1px solid #26252a; background: #151517;
      color: #a7a29c; font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 10px; }
    .natt .nh button:active { transform: scale(.95); }
    .natt small { font-size: 14px; color: #7a7671; }

    /* lys: fliser to i bredden. Fyllet viser lysstyrken; dra sidelengs for å dimme. */
    .lysgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .lflis { position: relative; overflow: hidden; display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 10px;
      align-items: center; min-height: 64px; padding: 10px 12px 10px 10px; border-radius: 20px; background: var(--gray100);
      text-align: left; touch-action: pan-y; transition: transform .14s cubic-bezier(.2,1.3,.3,1); }
    .lflis:active { transform: scale(.97); }
    .lflis .fyll { position: absolute; inset: 0 auto 0 0; background: var(--active-big); transition: width .25s ease; pointer-events: none; }
    .lflis.drar .fyll { transition: none; }
    .lflis > :not(.fyll) { position: relative; }
    .lflis .lik { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
      background: rgba(250,251,252,.1); border: 1px solid rgba(250,251,252,.1); }
    .lflis .lik ha-icon { --mdc-icon-size: 21px; }
    .lflis .lt { display: grid; min-width: 0; }
    .lflis .ln { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lflis .lv { font-size: 13px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; }
    .lflis.pa { color: var(--black); }
    .lflis.pa .lik { background: rgba(0,0,0,.1); border-color: rgba(0,0,0,.08); }
    .lflis.pa.helt { background: var(--active-big); }
    /* segment for markise/gardiner */
    .seg { display: inline-flex; gap: 4px; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; justify-self: start; }
    .seg button { height: 34px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500; opacity: .72; }
    .seg button.valgt { background: var(--active-big); color: var(--black); opacity: 1; }
    /* lys (gammel rad) */
    .lampe { display: grid; grid-template-columns: minmax(0, 1fr) auto 50px; gap: 6px 10px; align-items: center; text-align: left; }
    .lampe .ln { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lampe .lv { font-size: 15px; font-weight: 500; opacity: .7; font-variant-numeric: tabular-nums; }
    .bryter { grid-row: span 2; justify-self: end; width: 44px; height: 26px; border-radius: 999px; position: relative;
      background: rgba(250,251,252,.12); transition: background .2s; }
    .bryter::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
      background: var(--gray1000); transition: left .2s cubic-bezier(.2,1.3,.3,1), background .2s; }
    .bryter.pa { background: var(--active-big); }
    .bryter.pa::after { left: 21px; background: var(--black); }
    .dra { grid-column: 1 / 3; position: relative; height: 22px; display: flex; align-items: center; touch-action: none; cursor: ew-resize; }
    .dra::before { content: ""; position: absolute; left: 0; right: 0; height: 8px; border-radius: 4px; background: var(--gray100); }
    .dra i { position: absolute; left: 0; height: 8px; border-radius: 4px; background: var(--active-big); }
    .dra b { position: absolute; width: 20px; height: 20px; margin-left: -10px; border-radius: 50%; background: var(--gray1000);
      box-shadow: 0 1px 4px rgba(0,0,0,.4); transition: transform .12s; }
    .dra.drar b { transform: scale(1.2); }
    .dra.av i, .dra.av b { opacity: .25; }

    /* dekker */
    .del { display: grid; grid-template-columns: 64px minmax(0, 1fr) 44px; gap: 10px; align-items: center; font-size: 14px; font-weight: 500; }
    .del .dn { opacity: .7; }
    .del .dv { text-align: right; font-variant-numeric: tabular-nums; }
    .del .dra { grid-column: auto; }
    .preset { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
    .preset button { height: 44px; border-radius: 999px; background: var(--gray100); font-size: 14px; font-weight: 500;
      transition: background .2s, transform .12s; }
    .preset button:active { transform: scale(.93); }
    .preset button.valgt { background: var(--active-big); color: var(--black); }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `;

  class KiVeggpanelCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._sist = {};      // tilstandsobjekter vi sist tegnet fra, per del
      this._opt = {};       // optimistiske verdier mens vi venter på svar
      this._barn = {};      // monterte kort (prosa, familie, media)
    }

    static getStubConfig() { return {}; }
    getCardSize() { return 14; }

    setConfig(c) {
      this._c = {
        ...STD, ...c,
        topp: { ...STD.topp, ...(c.topp || {}) },
        strom: c.strom === false ? false : { effekt: "sensor.strommaler_effekt", trykk: "#strom", ...(c.strom || {}) },
      };
      // Med sidemeny ligger innstillingene der, og navbaren nederst trengs ikke.
      if (Array.isArray(c.meny) && c.meny.length && !(c.topp && "innstillinger" in c.topp)) this._c.topp.innstillinger = false;
      this._bygget = false;
      if (this._hass) this._tegnAlt();
    }

    set hass(h) {
      this._hass = h;
      for (const k of Object.values(this._barn)) if (k) k.hass = h;
      this._tegnAlt();
    }

    connectedCallback() {
      clearInterval(this._ur);
      this._ur = setInterval(() => { this._klokke(); this._tegnNatt(); this._tegnNattkort(); }, 15000);
      this._sistRort = Date.now();
      this._rort = (e) => {
        // Trykk på selve nattskjermen håndteres av klikket (vekk / handling), så et trykk
        // som vekker panelet ikke også treffer knappen som ligger under.
        const n = this.shadowRoot && this.shadowRoot.getElementById("natt");
        if (n && n.classList.contains("vis") && e && e.composedPath && e.composedPath().includes(n)) return;
        this._sistRort = Date.now(); this._tegnNatt();
      };
      window.addEventListener("pointerdown", this._rort, true);
      this._hashLytter = () => { this._sist.meny = null; this._tegnMeny(); };
      window.addEventListener("location-changed", this._hashLytter);
      window.addEventListener("popstate", this._hashLytter);
    }

    disconnectedCallback() {
      clearInterval(this._plexUr);
      clearInterval(this._ur);
      window.removeEventListener("pointerdown", this._rort, true);
      window.removeEventListener("location-changed", this._hashLytter);
      window.removeEventListener("popstate", this._hashLytter);
    }

    /* ---------- hjelpere ---------- */
    _st(id) { return id && this._hass ? this._hass.states[id] : undefined; }
    _ids(liste) { return (liste || []).map((x) => (typeof x === "string" ? { entity: x } : x)).filter((x) => x && x.entity); }

    _haptikk(t = "light") {
      try { window.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true })); } catch (e) { /* eldre */ }
      if (navigator.vibrate) { try { navigator.vibrate(t === "selection" ? 5 : t === "medium" ? 12 : 8); } catch (e) { /* blokkert */ } }
    }

    _mer(id) {
      if (!id) return;
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: id };
      this.dispatchEvent(ev);
    }

    _gaTil(sti) {
      if (!sti) return;
      if (sti.startsWith("#")) { window.location.hash = sti; return; }
      history.pushState(null, "", sti);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }

    /* Handling i HA-form: navigate, toggle, more-info, perform-action/call-service, url. */
    _handling(a, standardId) {
      if (!a) return;
      const id = a.entity || (a.target && a.target.entity_id) || standardId;
      switch (a.action) {
        case "navigate": return this._gaTil(a.navigation_path);
        case "url": return window.open(a.url_path);
        case "toggle": return this._hass.callService("homeassistant", "toggle", { entity_id: id });
        case "more-info": return this._mer(id);
        case "perform-action":
        case "call-service": {
          const [d, s] = String(a.perform_action || a.service || "").split(".");
          if (d && s) this._hass.callService(d, s, a.data || a.service_data || {}, a.target);
          return;
        }
        default:
          this.dispatchEvent(new CustomEvent("hass-action", { bubbles: true, composed: true,
            detail: { config: { tap_action: a, entity: standardId }, action: "tap" } }));
      }
    }

    /* ---------- bygging ---------- */
    _bygg() {
      const r = this.shadowRoot;
      const skjerm = this._c.skjerm !== false;
      const meny = Array.isArray(this._c.meny) && this._c.meny.length > 0;
      /* Med sidemenyen finnes ingen flytende navbar å gi plass til, så ingen luft nederst. */
      const luft = Number(this._c.luft_topp ?? 40), bunn = Number(this._c.luft_bunn ?? (meny ? 0 : 110));
      const bunnPx = bunn;
      r.innerHTML = `<style>${CSS}${TEMA_VARM}${FARGER_VARM}</style>
        <div class="ramme ${skjerm ? "skjerm" : ""} ${this._c.levende !== false ? "levende" : ""} tema-${esc(String(this._c.tema || "varm").toLowerCase())} farger-${esc(String(this._c.farger || "dashbord").toLowerCase())}" style="--vp-h:calc(100dvh - ${luft}px);--vp-bunn:${bunnPx}px">
        ${meny ? `<nav class="meny" id="meny" aria-label="Meny"></nav>` : ""}
        <div class="vp ${skjerm ? "skjerm" : ""}">
          <div class="topp" id="topp"></div>
          <div class="kol3">
            ${(this._c.natt || {}).kort !== false ? `<div id="nattkort" class="plass-${esc((this._c.natt || {}).kort_plass || "bred")}"></div>` : ""}
            <div class="kol venstre">

              ${this._c.prosa ? `<div class="vert" id="v-prosa"></div>` : ""}
              ${this._c.familie ? `<div class="vert" id="v-familie"></div>` : ""}
              <div id="scener"></div>
            </div>
            <div class="kol midt">

              ${this._c.media ? `<div class="vert" id="v-media"></div>` : ""}
              <div id="klima"></div>
              ${this._c.buss ? `<div class="vert" id="v-buss"></div>` : ""}
              <div id="plex"></div>
              <div id="strom"></div>
            </div>
            <div class="kol hoyre">
              <div id="lys"></div>
              <div id="dekker"></div>
            </div>
          </div>
        </div>
        </div>
        ${this._c.natt ? `<div class="natt" id="natt" data-tap="vekk"></div>` : ""}`;
      this._sist = {};
      this._barn = {};
      for (const [navn, std] of [["prosa", "custom:ki-prosa-card"], ["familie", "custom:family-status-card"], ["media", "custom:ki-media-card"], ["buss", "custom:ki-entur-card"]]) {
        const konf = this._c[navn];
        if (!konf) continue;
        this._monter(navn, { type: std, ...konf });
      }
      this._markerVokser();
      if (!this._lyttere) this._koble();
      this._bygget = true;
    }

    /* Ett kort per kolonne vokser til bunnen: scenene til venstre, det nederste i midten,
       lysene til høyre. `vokser: { venstre, midt, hoyre }` overstyrer med id-ene. */
    _markerVokser() {
      const c = this._c, r = this.shadowRoot;
      const midt = c.plex ? "plex" : (c.strom !== false ? "strom" : "klima");
      const valg = { venstre: "scener", midt, hoyre: c.lys ? "lys" : "dekker", ...(c.vokser || {}) };
      for (const id of Object.values(valg)) {
        const el = r.getElementById(id);
        if (el) el.classList.add("vokser");
      }
    }

    async _monter(navn, konf) {
      const vert = this.shadowRoot.getElementById(`v-${navn}`);
      if (!vert) return;
      try {
        const hjelp = await window.loadCardHelpers();
        const el = hjelp.createCardElement(konf);
        el.hass = this._hass;
        vert.innerHTML = "";
        vert.appendChild(el);
        this._barn[navn] = el;
      } catch (e) {
        vert.innerHTML = `<div class="kort"><span class="navn">Fant ikke ${esc(konf.type)}</span></div>`;
      }
    }

    /* Én lytter for trykk og hold på hele kortet. Elementene bærer data-tap / data-hold. */
    _koble() {
      this._lyttere = true;
      const r = this.shadowRoot;
      let timer = null, holdt = false;
      r.addEventListener("pointerdown", (e) => {
        const el = e.composedPath().find((n) => n && n.dataset && (n.dataset.hold || n.dataset.tap || n.dataset.holdhandling));
        holdt = false;
        clearTimeout(timer);
        if (!el || !(el.dataset.hold || el.dataset.holdhandling)) return;
        timer = setTimeout(() => {
          holdt = true;
          this._haptikk("medium");
          if (el.dataset.holdhandling === "klokke") this._klokkeHandling("hold");
          else this._mer(el.dataset.hold);
        }, 500);
      });
      const avbryt = () => clearTimeout(timer);
      r.addEventListener("pointerup", avbryt);
      r.addEventListener("pointercancel", avbryt);
      r.addEventListener("contextmenu", (e) => { if (e.composedPath().some((n) => n && n.dataset && (n.dataset.hold || n.dataset.holdhandling))) e.preventDefault(); });
      r.addEventListener("click", (e) => {
        if (holdt) { holdt = false; e.stopPropagation(); return; }
        const el = e.composedPath().find((n) => n && n.dataset && n.dataset.tap);
        if (!el) return;
        this._trykk(el);
      });
      // dra: lysstyrke og dekker
      r.addEventListener("pointerdown", (e) => {
        const dra = e.composedPath().find((n) => n && n.classList && n.classList.contains("dra"));
        if (!dra) return;
        clearTimeout(timer);
        e.preventDefault();
        dra.setPointerCapture(e.pointerId);
        dra.classList.add("drar");
        const flytt = (ev) => this._draTil(dra, ev);
        const slipp = (ev) => {
          dra.removeEventListener("pointermove", flytt);
          dra.removeEventListener("pointerup", slipp);
          dra.removeEventListener("pointercancel", slipp);
          dra.classList.remove("drar");
          this._draSlipp(dra, ev);
        };
        dra.addEventListener("pointermove", flytt);
        dra.addEventListener("pointerup", slipp);
        dra.addEventListener("pointercancel", slipp);
        this._draTil(dra, e);
      });
      // lysflisene: dra sidelengs for å dimme. Et trykk er fortsatt av/på; først når
      // fingeren har flyttet seg 10 px sidelengs, blir det dimming.
      r.addEventListener("pointerdown", (e) => {
        const fl = e.composedPath().find((n) => n && n.classList && (n.classList.contains("lflis") || n.classList.contains("lrad")));
        if (!fl || !fl.dataset.dimm) return;
        const x0 = e.clientX, y0 = e.clientY;
        let drar = false;
        const flytt = (ev) => {
          if (!drar) {
            if (Math.abs(ev.clientY - y0) > 12 && Math.abs(ev.clientY - y0) > Math.abs(ev.clientX - x0)) { slutt(); return; }
            if (Math.abs(ev.clientX - x0) < 10) return;
            drar = true; clearTimeout(timer); fl.classList.add("drar");
            try { fl.setPointerCapture(ev.pointerId); } catch (x) { /* ok */ }
          }
          const rr = fl.getBoundingClientRect();
          const v = Math.round(Math.max(1, Math.min(100, ((ev.clientX - rr.left) / (rr.width || 1)) * 100)));
          fl._verdi = v;
          const fy = fl.querySelector(".fyll"); if (fy) fy.style.width = `${v}%`;
          const lv = fl.querySelector(".lv"); if (lv) lv.textContent = `${v} %`;
          fl.classList.add("pa");
          const br = fl.querySelector(".bryter"); if (br) br.classList.add("pa");
        };
        const slutt = () => {
          fl.removeEventListener("pointermove", flytt);
          fl.removeEventListener("pointerup", slutt);
          fl.removeEventListener("pointercancel", slutt);
          if (!drar) return;
          fl.classList.remove("drar");
          holdt = true;                       // klikket som følger, er ikke et trykk
          const id = fl.dataset.id, v = fl._verdi;
          this._haptikk("light");
          this._opt[id] = { state: "on", pst: v, t: Date.now() };
          this._hass.callService("light", "turn_on", { entity_id: id, brightness_pct: v });
        };
        fl.addEventListener("pointermove", flytt);
        fl.addEventListener("pointerup", slutt);
        fl.addEventListener("pointercancel", slutt);
      });
      // strømprisen: fingeren over søylene
      r.addEventListener("pointerdown", (e) => { const s = e.composedPath().find((n) => n && n.classList && n.classList.contains("soyler")); if (s) this._pris(s, e, true); });
      const slippPris = () => { if (this._prisPek != null) { this._prisPek = null; this._sist.strom = null; this._tegnStrom(); } };
      r.addEventListener("pointermove", (e) => {
        const s = e.composedPath().find((n) => n && n.classList && n.classList.contains("soyler"));
        if (s && (e.pointerType === "mouse" || e.buttons)) this._pris(s, e, false);
        else if (!s && e.pointerType === "mouse") slippPris();
      });
      r.addEventListener("pointerup", slippPris);
      r.addEventListener("pointercancel", slippPris);
    }

    _trykk(el) {
      const t = el.dataset.tap, id = el.dataset.id;
      if (t === "gaa") { this._haptikk("light"); this._gaTil(el.dataset.sti); return; }
      if (t === "mer") { this._mer(id); return; }
      if (t === "veksle") {
        this._haptikk("light");
        const st = this._st(id);
        this._opt[id] = { state: st && st.state === "on" ? "off" : "on", t: Date.now() };
        this._hass.callService("homeassistant", "toggle", { entity_id: id });
        this._tegnAlt(true);
        return;
      }
      if (t === "scene") {
        const s = (this._c.scener || [])[Number(el.dataset.i)];
        if (!s) return;
        this._haptikk("light");
        el.classList.remove("kjort"); void el.offsetWidth; el.classList.add("kjort");
        this._handling(s.tap_action || (s.entity ? { action: "toggle" } : null), s.entity);
        // Scener har ingen tilstand. Den siste du kjørte, står som aktiv til du velger en annen.
        this._sisteScene = s.navn || s.name || "";
        this._sist.scener = null;
        this._tegnScener();
        return;
      }
      if (t === "temp") { this._justerTemp(id, Number(el.dataset.steg)); return; }
      if (t === "klokke") { this._haptikk("light"); this._klokkeHandling("tap"); return; }
      if (t === "morgenlukk") {
        this._haptikk("light");
        try { localStorage.setItem("ki-veggpanel-morgen-lukket", new Date().toDateString()); } catch (e) { /* privat modus */ }
        this._nkSig = null; this._sist.nattkort = null;
        this._tegnNattkort();
        return;
      }
      if (t === "plexgaa") {
        this._haptikk("light");
        const k = this._c.plex || {};
        const x = (this._plexListe || [])[this._plexI || 0];
        if (k.trykk) this._gaTil(k.trykk);
        else if (x && x.lenke) window.open(x.lenke);
        else if (x) this._mer(x.id);
        return;
      }
      if (t === "auto") {
        this._haptikk("light");
        delete this._opt[id];
        this._hass.callService("ki_energi", "fjern_overstyring", { sone: el.dataset.sone });
        return;
      }
      if (t === "plex") {
        this._haptikk("light");
        const lenke = el.dataset.lenke;
        if (lenke) window.open(lenke);
        else this._mer(el.dataset.id);
        return;
      }
      if (t === "gruppe") {
        this._haptikk("light");
        const k = this._c.lys || {};
        const ids = this._ids(k.lamper).map((x) => x.entity);
        const noenPa = ids.some((x) => this._optFor(x, "state", (this._st(x) || {}).state) === "on")
          || (!ids.length && (this._st(k.gruppe) || {}).state === "on");
        const mal = k.gruppe ? [k.gruppe] : ids;
        for (const x of ids) this._opt[x] = { state: noenPa ? "off" : "on", t: Date.now() };
        this._hass.callService("light", noenPa ? "turn_off" : "turn_on", { entity_id: mal });
        this._sist.lys = null;
        this._tegnLys();
        return;
      }
      if (t === "dekke") {
        this._haptikk("light");
        const d = (this._c.dekker || [])[Number(el.dataset.i)];
        if (!d) return;
        const ids = d.hoved ? [d.hoved] : (d.deler || []).map((x) => x.entity);
        const tjeneste = { opp: "open_cover", stopp: "stop_cover", ned: "close_cover" }[el.dataset.cmd];
        if (tjeneste && ids.length) this._hass.callService("cover", tjeneste, { entity_id: ids });
        return;
      }
      if (t === "vekk") { this._sistRort = Date.now(); this._tegnNatt(); return; }
      if (t === "natthandling") {
        const h = ((this._c.natt || {}).handlinger || [])[Number(el.dataset.i)];
        if (!h) return;
        this._haptikk("light");
        this._handling(h.tap_action || (h.entity ? { action: "toggle" } : null), h.entity);
        return;
      }
      if (t === "dekkeseg") {
        this._haptikk("selection");
        this._dekkeValgt = Number(el.dataset.i);
        this._sist.dekker = null;
        this._tegnDekker();
        return;
      }
      if (t === "preset") {
        this._haptikk("light");
        const d = (this._c.dekker || [])[Number(el.dataset.i)];
        const verdi = Number(el.dataset.v);
        const inv = d.invertert !== false;
        const ids = (d.deler || []).map((x) => x.entity).concat(d.deler && d.deler.length ? [] : [d.hoved]);
        for (const e of ids) this._opt[e] = { pos: inv ? 100 - verdi : verdi, t: Date.now() };
        this._hass.callService("cover", "set_cover_position", { entity_id: ids, position: inv ? 100 - verdi : verdi });
        this._sist.dekker = null;
        this._tegnDekker();
      }
    }

    /* − og +: trykkene samles i 0,8 s og sendes som ett kall, så termostaten ikke får
       fem kall på rad – og tallet står på det du har trykket deg fram til imens. */
    _justerTemp(id, steg) {
      const st = this._st(id); if (!st) return;
      this._haptikk("selection");
      const x = this._ids(this._c.klima).find((k) => k.entity === id) || { entity: id };
      const sone = this._st("sensor.ki_laster") ? this._kiSone(x) : null;
      const o = this._opt[id];
      const start = sone && sone.overstyrt && sone.overstyrt_temp != null ? Number(sone.overstyrt_temp) : Number(st.attributes.temperature) || 20;
      const fra = o && o.temp != null ? o.temp : start;
      const trinn = Number(st.attributes.target_temp_step) || 0.5;
      const min = Number(st.attributes.min_temp) || 5, max = Number(st.attributes.max_temp) || 35;
      const ny = Math.min(max, Math.max(min, Math.round((fra + steg * trinn) / trinn) * trinn));
      this._opt[id] = { temp: ny, t: Date.now() };
      this._tempTimer = this._tempTimer || {};
      clearTimeout(this._tempTimer[id]);
      /* Trykkene samles i 0,8 s. Med KI Energi blir det én manuell overstyring for
         sonen; uten går det rett til termostaten. */
      this._tempTimer[id] = setTimeout(() => {
        if (sone) {
          this._hass.callService("ki_energi", "overstyr",
            { sone: sone.key, temp: ny, minutter: Number(this._c.overstyring_min) || 120 });
        } else {
          this._hass.callService("climate", "set_temperature", { entity_id: id, temperature: ny });
        }
      }, 800);
      this._sist.klima = null;
      this._tegnKlima();
    }

    _draTil(dra, e) {
      const r = dra.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
      dra._verdi = Math.round(f * 100);
      const i = dra.querySelector("i"), b = dra.querySelector("b");
      if (i) i.style.width = `${dra._verdi}%`;
      if (b) b.style.left = `${dra._verdi}%`;
      const vis = dra.parentElement && dra.parentElement.querySelector(".lv, .dv");
      if (vis) vis.textContent = `${dra._verdi} %`;
    }

    _draSlipp(dra) {
      const id = dra.dataset.id, v = dra._verdi;
      if (id == null || v == null) return;
      this._haptikk("light");
      if (dra.dataset.slag === "lys") {
        this._opt[id] = { state: v > 0 ? "on" : "off", pst: v, t: Date.now() };
        if (v === 0) this._hass.callService("light", "turn_off", { entity_id: id });
        else this._hass.callService("light", "turn_on", { entity_id: id, brightness_pct: v });
      } else {
        const inv = dra.dataset.inv === "1";
        const pos = inv ? 100 - v : v;
        this._opt[id] = { pos, t: Date.now() };
        this._hass.callService("cover", "set_cover_position", { entity_id: id, position: pos });
      }
    }

    /* Optimistisk verdi: gjelder til entiteten er enig, eller i 6 s. */
    _optFor(id, felt, faktisk, lik) {
      const o = this._opt[id];
      if (!o || o[felt] === undefined) return faktisk;
      if ((lik ? lik(o[felt], faktisk) : o[felt] === faktisk) || Date.now() - o.t > 6000) { delete this._opt[id]; return faktisk; }
      return o[felt];
    }

    /* ---------- tegning ---------- */
    _tegnAlt(tving = false) {
      if (!this._hass || !this._c) return;
      if (!this._bygget) this._bygg();
      if (tving) this._sist = {};
      this._tegnMeny();
      this._tegnTopp();
      this._tegnNattkort();
      this._tegnScener();
      this._tegnKlima();
      this._tegnPlex();
      this._tegnStrom();
      this._tegnLys();
      this._tegnDekker();
      this._tegnNatt();
    }

    /* Tegner en del bare når en av entitetene den bruker, har fått et nytt tilstandsobjekt. */
    _endret(del, ids) {
      const naa = ids.map((id) => this._st(id));
      const f = this._sist[del];
      if (f && f.length === naa.length && f.every((x, i) => x === naa[i])) return false;
      this._sist[del] = naa;
      return true;
    }

    /* Klokka: trykk går til innstillingene (/config), hold slår kioskmodus av og på.
       Begge kan byttes med klokke.tap_action / klokke.hold_action i vanlig HA-form. */
    _klokkeHandling(hva) {
      const k = this._c.klokke || {};
      const std = hva === "hold"
        ? { action: "perform-action", perform_action: "input_boolean.toggle", target: { entity_id: "input_boolean.kiosk_mode" } }
        : { action: "navigate", navigation_path: "/config" };
      const h = k[`${hva}_action`] || std;
      if (h.action === "none") return;
      this._handling(h, h.entity || (h.target && h.target.entity_id));
    }

    _klokke() {
      const r = this.shadowRoot;
      if (!r) return;
      const d = new Date();
      const tid = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      const dag = d.toLocaleDateString("nb-NO", { weekday: "long" });
      const Dag = dag.charAt(0).toUpperCase() + dag.slice(1);
      const dato = d.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
      const el = r.getElementById("klokke");
      if (el) el.innerHTML = `<b>${tid}</b><span><i>${Dag}</i><small>${dato}</small></span>`;
      const nk = r.getElementById("nk"); if (nk) nk.textContent = tid;
      const nd = r.getElementById("nd"); if (nd) nd.textContent = `${Dag} ${dato}`;
    }

    /* Sidemenyen. Et punkt er aktivt når stien er siden som er åpen (eller hashen, for popups).
       varsel: { entity, state } – eller bare en entitet, som varsler når den er «on». */
    _tegnMeny() {
      const m = this._c.meny;
      const vert = this.shadowRoot.getElementById("meny");
      if (!vert || !Array.isArray(m)) return;
      const varsler = m.map((x) => (x.varsel && (x.varsel.entity || x.varsel)) || null);
      const naa = location.pathname + "|" + location.hash;
      if (!this._endret("meny", varsler.filter(Boolean)) && this._menySti === naa) return;
      this._menySti = naa;
      let fyllt = false;
      vert.innerHTML = m.map((x, i) => {
        const sti = x.sti || (x.tap_action && x.tap_action.navigation_path) || "";
        const aktiv = x.aktiv === true || (sti && (sti.startsWith("#") ? location.hash === sti : location.pathname === sti.split("#")[0]));
        let varsel = false;
        if (x.varsel) {
          const id = x.varsel.entity || x.varsel;
          const s = this._st(id);
          const vil = x.varsel.state !== undefined ? String(x.varsel.state) : "on";
          varsel = !!s && s.state === vil;
        }
        const skille = x.nederst && !fyllt ? (fyllt = true, `<span class="fyllrom"></span>`) : "";
        const farge = x.farge || menyFarge(x, i);
        // Punktene nederst (innstillinger) har alltid fargen sin; de andre bare når siden er åpen.
        const alltid = x.alltid_farge !== undefined ? !!x.alltid_farge : !!x.nederst;
        return `${skille}<button class="mk ${aktiv ? "aktiv" : ""} ${alltid ? "alltid" : ""}" style="--mf:${esc(farge)}" data-tap="gaa" data-sti="${esc(sti)}"
          ${x.entity ? `data-hold="${esc(x.entity)}"` : ""} aria-label="${esc(x.navn || sti)}${varsel ? " – varsel" : ""}"
          ${aktiv ? `aria-current="page"` : ""}>
          <ha-icon icon="${esc(x.ikon || x.icon || "mdi:circle-outline")}"></ha-icon>${varsel ? `<span class="prikk"></span>` : ""}</button>`;
      }).join("");
    }

    /* Nattskjermen: vises når natt.entity er på (eller alltid, uten entity) og panelet
       har stått urørt i natt.etter sekunder. Et trykk på skjermen vekker panelet. */
    _tegnNatt() {
      const n = this._c && this._c.natt;
      const el = this.shadowRoot && this.shadowRoot.getElementById("natt");
      if (!n || !el || !this._hass) return;
      const s = n.entity ? this._st(n.entity) : null;
      const pa = n.entity ? !!s && s.state === "on" : true;
      const urort = (Date.now() - (this._sistRort || Date.now())) / 1000 >= Number(n.etter ?? 90);
      const vis = pa && urort;
      if (!vis) { el.classList.remove("vis"); this._nattTegnet = false; return; }
      const t = this._c.topp;
      const ids = [n.entity, n.vekking, t.las, t.alarm, t.vaer, t.hjemme];
      if (this._endret("natt", ids) || !this._nattTegnet) {
        const bit = [];
        const l = this._st(t.las);
        if (l) bit.push(`<span><ha-icon icon="${l.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant"}"
          style="--mdc-icon-size:18px;color:${l.state === "locked" ? "#6f9a72" : "#c56b62"}"></ha-icon>${esc(LAS[l.state] || "Lås")}</span>`);
        const a = this._st(t.alarm);
        if (a) bit.push(`<span><ha-icon icon="${a.state === "disarmed" ? "mdi:shield-off-outline" : "mdi:shield-check"}" style="--mdc-icon-size:18px"></ha-icon>${esc(ALARM[a.state] || a.state)}</span>`);
        const v = this._st(t.vaer);
        if (v) { const [tekst] = VAER[v.state] || [v.state]; const g = v.attributes.temperature;
          bit.push(`<span>${g != null ? Math.round(g) + "° · " : ""}${esc(tekst)}</span>`); }
        const h = this._st(t.hjemme);
        if (h) bit.push(`<span>${esc(h.state)} hjemme</span>`);
        let vekk = "";
        const vk = this._st(n.vekking);
        if (vk && !["unknown", "unavailable", ""].includes(vk.state)) {
          const d = new Date(vk.state);
          const tekst = isNaN(d) ? vk.state : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
          vekk = `<span><ha-icon icon="mdi:alarm" style="--mdc-icon-size:18px"></ha-icon>Vekking ${esc(tekst)}</span>`;
        }
        const hl = (n.handlinger || []).map((x, i) => `<button data-tap="natthandling" data-i="${i}">
          <ha-icon icon="${esc(x.ikon || x.icon || "mdi:gesture-tap")}" style="--mdc-icon-size:20px"></ha-icon>${esc(x.navn || x.name || "")}</button>`).join("");
        el.innerHTML = `<div class="nt"><span><ha-icon icon="mdi:weather-night" style="--mdc-icon-size:18px"></ha-icon>${esc(n.tittel || "Nattmodus")}</span>${vekk}</div>
          <div class="nm"><div class="nk" id="nk"></div><div class="nd" id="nd"></div><div class="ns">${bit.join("")}</div></div>
          <div class="nb">${hl ? `<div class="nh">${hl}</div>` : ""}<small>Trykk hvor som helst for å vekke panelet</small></div>`;
        this._nattTegnet = true;
        this._klokke();
      }
      el.classList.add("vis");
    }

    _tegnTopp() {
      const t = this._c.topp;
      if (!this._endret("topp", [t.vaer, t.hjemme, t.las, t.alarm, t.stovsuger, (this._c.natt || {}).entity])) return;
      const pille = (ikon, tekst, { id, sti, fylt, farge, tap = sti ? "gaa" : "mer" } = {}) =>
        `<button class="pille ${fylt ? "fylt" : ""}" data-tap="${tap}" ${sti ? `data-sti="${esc(sti)}"` : ""}
          ${id ? `data-id="${esc(id)}" data-hold="${esc(id)}"` : ""}>
          <ha-icon icon="${ikon}" ${farge && !fylt ? `style="color:${farge}"` : ""}></ha-icon><span>${esc(tekst)}</span></button>`;
      const deler = [];
      const v = this._st(t.vaer);
      if (v) {
        const [tekst, ikon] = VAER[v.state] || [v.state, "mdi:weather-cloudy"];
        const g = v.attributes.temperature;
        deler.push(pille(ikon, `${g != null ? Math.round(g) + "° · " : ""}${tekst}`, { id: t.vaer, sti: t.vaer_trykk, farge: "var(--yellow)" }));
      }
      const h = this._st(t.hjemme);
      if (h) deler.push(pille("mdi:account-multiple", `${h.state} hjemme`, { id: t.hjemme, sti: t.hjemme_trykk }));
      const l = this._st(t.las);
      if (l) deler.push(pille(l.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant", LAS[l.state] || "Lås",
        { id: t.las, sti: t.las_trykk, farge: l.state === "locked" ? "var(--green)" : "var(--red)", fylt: l.state === "jammed" }));
      const a = this._st(t.alarm);
      if (a) deler.push(pille(a.state === "disarmed" ? "mdi:shield-off-outline" : "mdi:shield-check", ALARM[a.state] || a.state,
        { id: t.alarm, sti: t.alarm_trykk, fylt: a.state === "triggered" }));
      const s = this._st(t.stovsuger);
      if (s) deler.push(pille("mdi:robot-vacuum", STOV[s.state] || s.state, { id: t.stovsuger, sti: t.stovsuger_trykk, fylt: s.state === "cleaning" }));
      const nm = this._c.natt && this._c.natt.entity ? this._st(this._c.natt.entity) : null;
      if (nm && nm.state === "on") deler.unshift(pille("mdi:weather-night", "Nattmodus", { id: this._c.natt.entity, fylt: true }));
      if (t.innstillinger) deler.push(`<button class="pille rund" data-tap="gaa" data-sti="${esc(t.innstillinger)}" aria-label="Innstillinger"><ha-icon icon="mdi:cog-outline"></ha-icon></button>`);
      this.shadowRoot.getElementById("topp").innerHTML = `<button class="klokke" id="klokke" data-tap="klokke" data-holdhandling="klokke"
        aria-label="Klokke – trykk for innstillinger, hold for kioskmodus"></button>${deler.join("")}`;
      this._klokke();
    }

    /* Nattkortet: mens nattmodus er på, står et animert kort øverst i midten – stjerner som
       blinker, månen som svever, skyer som driver og et stjerneskudd av og til. Det sier
       at nattmodus er på, siden når, når vekkingen går, om huset er låst og hvor mange lys
       som står på, med knapper for nattens handlinger og for å slå nattmodus av.
       Kort som ikke trengs om natta (Plex som standard), legges bort så lenge.
       Kortet tegnes bare på nytt når noe det viser endrer seg, så animasjonen ikke hakker. */
    _tegnNattkort() {
      const n = this._c.natt || {};
      const vert = this.shadowRoot.getElementById("nattkort");
      const st = n.entity ? this._st(n.entity) : null;
      const pa = !!st && st.state === "on";
      const naa = new Date(), time = naa.getHours() + naa.getMinutes() / 60;
      const morgenTil = Number(n.morgen_til ?? 9);
      const idag = naa.toDateString();
      /* God morgen: nattmodus er slått av i dag etter kl. 4, klokka er før morgen_til, og
         kortet er ikke krysset ut i dag. Utkryssingen huskes per dag i nettleseren. */
      let krysset = null;
      try { krysset = localStorage.getItem("ki-veggpanel-morgen-lukket"); } catch (e) { /* privat modus */ }
      const avIdag = st && !pa && st.last_changed && new Date(st.last_changed).toDateString() === idag && new Date(st.last_changed).getHours() >= 4;
      const morgen = !pa && avIdag && time < morgenTil && krysset !== idag && n.morgen !== false;
      const vis = pa || morgen;
      const skjul = [].concat(n.skjul !== undefined ? n.skjul : ["plex"]);
      for (const id of skjul) {
        const el = this.shadowRoot.getElementById(id);
        if (el) el.style.display = pa ? "none" : "";
      }
      const ramme = this.shadowRoot.querySelector(".ramme");
      if (ramme) ramme.classList.toggle("nattmodus", pa);
      const kol3 = this.shadowRoot.querySelector(".kol3");
      const plass = n.kort_plass || "bred";
      if (kol3) {
        kol3.classList.toggle("med-natt", !!vert && vis);
        kol3.classList.toggle("natt-venstre", plass === "venstre");
        kol3.classList.toggle("natt-midt", plass === "midt");
      }
      if (!vert) return;
      const t = this._c.topp || {};
      const lamper = this._ids((this._c.lys || {}).lamper);
      const sig = [vis, morgen, Math.floor(time)].join("|");
      if (!this._endret("nattkort", [n.entity, n.vekking, t.las, t.alarm, t.vaer, ...lamper.map((x) => x.entity)]) && this._nkSig === sig) return;
      this._nkSig = sig;
      if (!vis) { vert.innerHTML = ""; return; }
      const kl = (d) => d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      const siden = st && st.last_changed ? kl(new Date(st.last_changed)) : "";
      const h = naa.getHours();
      const tittel = morgen ? "God morgen" : n.tittel || (h >= 20 || h < 4 ? "God natt" : h < 10 ? "God morgen" : "Nattmodus er på");
      const bit = [];
      const l = this._st(t.las);
      if (l) bit.push(`<span class="nb ${l.state === "locked" ? "ok" : "obs"}"><ha-icon icon="${l.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant"}"></ha-icon>${esc(LAS[l.state] || "Lås")}</span>`);
      const a = this._st(t.alarm);
      if (a) bit.push(`<span class="nb"><ha-icon icon="${a.state === "disarmed" ? "mdi:shield-off-outline" : "mdi:shield-moon"}"></ha-icon>${esc(ALARM[a.state] || a.state)}</span>`);
      if (morgen) {
        const v = this._st(t.vaer);
        if (v) { const [tekst, ik] = VAER[v.state] || [v.state, "mdi:weather-partly-cloudy"]; const g = v.attributes.temperature;
          bit.unshift(`<span class="nb"><ha-icon icon="${ik}"></ha-icon>${g != null ? Math.round(g) + "° · " : ""}${esc(tekst)}</span>`); }
      }
      const paLys = lamper.filter((x) => (this._st(x.entity) || {}).state === "on").length;
      if (lamper.length && !morgen) bit.push(`<span class="nb ${paLys ? "obs" : "ok"}"><ha-icon icon="${paLys ? "mdi:lightbulb-on" : "mdi:lightbulb-off-outline"}"></ha-icon>${paLys ? `${paLys} lys på` : "Alle lys av"}</span>`);
      const vk = this._st(n.vekking);
      let vekk = "";
      if (!morgen && vk && !["unknown", "unavailable", ""].includes(vk.state)) {
        const d = new Date(vk.state);
        vekk = isNaN(d) ? vk.state : kl(d);
      }
      const under = morgen ? (siden ? `nattmodus av ${siden}` : "")
        : [siden ? `på siden ${siden}` : "", vekk ? `vekking ${vekk}` : ""].filter(Boolean).join(" · ");
      if (morgen) {
        const straaler = [-50, -30, -10, 10, 30, 50].map((g, i) => `<i class="straale" style="transform:rotate(${g}deg);animation-delay:-${i * 0.8}s"></i>`).join("");
        const fugler = [[30, 0], [44, -6], [22, -12]].map(([y, d], i) => `<i class="fugl" style="top:${y}px;animation-delay:${d - i * 2}s"></i>`).join("");
        vert.innerHTML = `<div class="nattkort morgen">
          <div class="himmel" aria-hidden="true">${straaler}<span class="sol"></span>${fugler}</div>
          <button class="nk-lukk" data-tap="morgenlukk" aria-label="Lukk"><ha-icon icon="mdi:close"></ha-icon></button>
          <div class="nk-innhold">
            <div class="nk-etikett"><ha-icon icon="mdi:weather-sunset-up"></ha-icon>Morgen</div>
            <div class="nk-tittel">${esc(tittel)}</div>
            ${under ? `<div class="nk-under">${esc(under)}</div>` : ""}
            ${bit.length ? `<div class="nk-bitar">${bit.join("")}</div>` : ""}
          </div></div>`;
        return;
      }
      const stjerner = Array.from({ length: 26 }, (_, i) => {
        const x = (i * 37 + 11) % 100, y = (i * 53 + 7) % 62, r = i % 5 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.1;
        return `<i class="stj" style="left:${x}%;top:${y}%;width:${r}px;height:${r}px;animation-delay:-${((i * 0.73) % 4).toFixed(2)}s;animation-duration:${(2.6 + (i % 4) * 0.7).toFixed(1)}s"></i>`;
      }).join("");
      const hl = (n.handlinger || []).map((x, i) => `<button class="nk-knapp" data-tap="natthandling" data-i="${i}">
          <ha-icon icon="${esc(x.ikon || "mdi:gesture-tap")}"></ha-icon>${esc(x.navn || "")}</button>`).join("");
      vert.innerHTML = `<div class="nattkort" data-hold="${esc(n.entity)}">
        <div class="himmel" aria-hidden="true">
          ${stjerner}
          <span class="skudd"></span>
          <span class="maane"><span class="skygge"></span></span>
          <span class="sky s1"></span><span class="sky s2"></span>
        </div>
        <div class="nk-innhold">
          <div class="nk-etikett"><ha-icon icon="mdi:weather-night"></ha-icon>Nattmodus</div>
          <div class="nk-tittel">${esc(tittel)}</div>
          ${under ? `<div class="nk-under">${esc(under)}</div>` : ""}
          ${bit.length ? `<div class="nk-bitar">${bit.join("")}</div>` : ""}
          <div class="nk-knapper">${hl}
            <button class="nk-knapp av" data-tap="veksle" data-id="${esc(n.entity)}"><ha-icon icon="mdi:weather-sunny"></ha-icon>Slå av</button>
          </div>
        </div>
      </div>`;
    }

    _tegnScener() {
      const sc = this._c.scener || [];
      const vert = this.shadowRoot.getElementById("scener");
      if (!sc.length) { vert.innerHTML = ""; return; }
      if (!this._endret("scener", sc.map((s) => s.aktiv || s.entity).filter(Boolean))) return;
      const siste = this._sisteScene;
      vert.innerHTML = `<div class="kort"><div class="shode"><span class="navn">${esc(this._c.scener_tittel || "Scener")}</span>
        ${siste ? `<span class="sstatus">Aktiv: ${esc(siste)}</span>` : ""}</div><div class="scener">
        ${sc.map((s, i) => {
          const aktivId = s.aktiv || null;
          const aktiv = aktivId ? this._optFor(aktivId, "state", (this._st(aktivId) || {}).state) === "on"
            : !!siste && (s.navn || s.name) === siste;
          const hold = s.entity || aktivId || (s.tap_action && s.tap_action.target && [].concat(s.tap_action.target.entity_id)[0]) || "";
          return `<button class="scene ${aktiv ? "aktiv" : ""}" data-tap="scene" data-i="${i}" ${hold ? `data-hold="${esc(hold)}"` : ""}>
            <span class="ik"><ha-icon icon="${esc(s.ikon || s.icon || "mdi:palette-outline")}"></ha-icon></span>${esc(s.navn || s.name || "")}</button>`;
        }).join("")}</div></div>`;
    }

    /* KI Energi, når den finnes: sensor.ki_laster har én rad per sone med målet motoren
       har satt, settpunktet, rommets temperatur og om sonen er manuelt overstyrt. */
    _kiSone(x) {
      const L = this._st("sensor.ki_laster");
      const rader = (L && Array.isArray(L.attributes.laster)) ? L.attributes.laster : [];
      return rader.find((r) => (x.sone && r.key === x.sone)
        || (Array.isArray(r.entiteter) && r.entiteter.includes(x.entity))
        || r.key === String(x.entity).replace(/^climate\./, "")) || null;
    }

    /* Varme i stua: ett kort med én rad per sone.
     *
     * Med KI Energi er det motoren som styrer, og − og + gir en manuell overstyring
     * gjennom ki_energi.overstyr – den gjelder i `overstyring_min` (standard to timer),
     * og raden sier til når. «Auto» gir styringen tilbake med en gang. Uten KI Energi
     * går − og + rett til termostaten som før. */
    _tegnKlima() {
      const ids = this._ids(this._c.klima);
      const vert = this.shadowRoot.getElementById("klima");
      if (!ids.length) { vert.innerHTML = ""; return; }
      if (!this._endret("klima", [...ids.map((x) => x.entity), "sensor.ki_laster", "sensor.ki_energi_status"])) return;
      const ki = !!this._st("sensor.ki_laster");
      let manuelle = 0, varmer = 0;
      const rader = ids.map((x) => {
        const st = this._st(x.entity);
        if (!st) return "";
        const a = st.attributes;
        const sone = ki ? this._kiSone(x) : null;
        const rom = sone && sone.naa != null ? Number(sone.naa) : Number(a.current_temperature);
        const settpunkt = Number(a.temperature);
        const kiMal = sone && sone.mal != null ? Number(sone.mal) : null;
        const overstyrt = !!(sone && sone.overstyrt);
        if (overstyrt) manuelle++;
        const vis = this._optFor(x.entity, "temp", overstyrt && sone.overstyrt_temp != null ? Number(sone.overstyrt_temp) : settpunkt,
          (o, f) => Math.abs(o - f) < 0.01);
        const venter = this._opt[x.entity] && this._opt[x.entity].temp != null;
        const erVarm = a.hvac_action === "heating";
        if (erVarm) varmer++;
        const hva = { heating: "varmer", idle: "venter", off: "av", cooling: "kjøler" }[a.hvac_action] || (st.state === "off" ? "av" : "på");
        const deler = [];
        if (!isNaN(rom)) deler.push(`rommet <b>${komma(rom, 1)}°</b>`);
        if (sone && !overstyrt && kiMal != null) deler.push(`KI vil ha ${komma(kiMal, 1)}°`);
        deler.push(hva);
        const til = sone && sone.overstyrt_til ? new Date(sone.overstyrt_til) : null;
        const kl = til && !isNaN(til) ? til.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }) : "";
        return `<div class="sone">
          <button class="ik ${erVarm ? "varm" : !isNaN(rom) && !isNaN(vis) && rom < vis - 0.7 ? "kald" : ""}" data-tap="mer" data-id="${esc(x.entity)}" data-hold="${esc(x.entity)}">
            <ha-icon icon="${esc(x.ikon || (/panel|ovn|radiator/i.test(x.entity) ? "mdi:radiator" : "mdi:fire"))}"></ha-icon></button>
          <button style="text-align:left" data-tap="mer" data-id="${esc(x.entity)}" data-hold="${esc(x.entity)}">
            <div class="sn">${esc(x.navn || a.friendly_name || x.entity)}</div>
            <div class="su">${deler.join(" · ")}</div></button>
          <div class="still ${venter ? "venter" : ""}">
            <button class="rund" data-tap="temp" data-id="${esc(x.entity)}" data-steg="-1" aria-label="Senk"><ha-icon icon="mdi:minus"></ha-icon></button>
            <b>${isNaN(vis) ? "–" : komma(vis, 1)}<sup>°</sup></b>
            <button class="rund" data-tap="temp" data-id="${esc(x.entity)}" data-steg="1" aria-label="Øk"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>
          ${this._c.levende !== false && !isNaN(rom) && !isNaN(vis) ? (() => {
            // Stolpen viser rommet mot målet: 4 grader under er tom, målet er 80 %.
            const f = Math.max(0.04, Math.min(1, (rom - (vis - 4)) / 5));
            return `<div class="temp-stolpe" title="Rommet ${komma(rom, 1)}° mot ${komma(vis, 1)}°"><i style="width:${(f * 100).toFixed(0)}%"></i></div>`;
          })() : ""}
          ${overstyrt ? `<div class="manuell"><span class="mpille">Manuelt${kl ? ` til ${kl}` : ""}
            <button data-tap="auto" data-id="${esc(x.entity)}" data-sone="${esc(sone.key)}" aria-label="Tilbake til auto"><ha-icon icon="mdi:close"></ha-icon></button></span></div>` : ""}
        </div>`;
      }).join("");
      const under = ki
        ? (manuelle ? `${manuelle} manuelt overstyrt` : varmer ? `KI Energi styrer · ${varmer} varmer` : "KI Energi styrer")
        : (varmer ? `${varmer} varmer` : "Ingen varmer nå");
      vert.innerHTML = `<div class="kort">
        <button class="hode" data-tap="gaa" data-sti="${esc(this._c.klima_trykk || "#klima")}" ${ki ? `data-hold="sensor.ki_energi_status"` : ""}>
          <span class="ik ${varmer ? "varm" : ""}"><ha-icon icon="mdi:home-thermometer-outline"></ha-icon></span>
          <span><div class="navn">Varme</div><div class="status">${esc(under)}</div></span><span></span></button>
        <div class="varme">${rader}</div></div>`;
    }

    /* Timeprisene for i dag, som i ki-strompris-card: raw_today (Nord Pool),
       prices_today (objektliste) eller today (tall). */
    /* Prisene som kroner per time for i dag.
     *
     * To ting i 1.0 ga «152,48 kr/kWh»: sensoren oppgir øre, og siden 1. oktober 2025
     * er Nord Pool-prisene per kvarter – 96 søyler i stedet for 24. Nå regnes øre om
     * til kroner (enheten sier «øre», eller prisene er urimelig høye for kroner), og
     * kvarterene slås sammen til timer, så søylene er til å lese. */
    _priser(id) {
      const raa = this._raaPriser(id);
      if (!raa || !raa.length) return raa;
      const s = this._st(id);
      const enhet = String((s && s.attributes.unit_of_measurement) || "").toLowerCase();
      const median = [...raa.map((x) => x.v)].sort((a, b) => a - b)[Math.floor(raa.length / 2)];
      const ore = enhet.includes("øre") || enhet.includes("ore") || (!enhet.includes("kr") && !enhet.includes("nok") && median > 20);
      const skala = ore || (this._c.strom && this._c.strom.ore) ? 0.01 : 1;
      this._prisSkala = skala;
      const timer = new Map();
      for (const x of raa) {
        const d = new Date(x.t); d.setMinutes(0, 0, 0);
        const k = d.getTime();
        if (!timer.has(k)) timer.set(k, []);
        timer.get(k).push(x.v * skala);
      }
      return [...timer.entries()].sort((a, b) => a[0] - b[0])
        .map(([t, v]) => ({ t, v: v.reduce((a, b) => a + b, 0) / v.length }));
    }

    _raaPriser(id) {
      const s = this._st(id); if (!s) return null;
      const a = s.attributes;
      const liste = (obj, dagOff) => {
        if (Array.isArray(obj) && obj.length && typeof obj[0] === "object" && obj[0] !== null) {
          return obj.map((p) => ({ t: new Date(p.start || p.startsAt || p.time || p.hour).getTime(),
            v: Number(p.value !== undefined ? p.value : p.price !== undefined ? p.price : p.total) }));
        }
        if (Array.isArray(obj) && obj.length && typeof obj[0] !== "object") {
          const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + dagOff);
          const steg = TIME * (24 / obj.length);
          return obj.map((v, i) => ({ t: d.getTime() + i * steg, v: Number(v) }));
        }
        return [];
      };
      const idag = liste(a.raw_today || a.prices_today || a.today_raw, 0);
      const iDag = idag.length ? idag : liste(a.today, 0);
      if (!iDag.length) return null;
      // I morgen kommer rundt kl. 13; da blir grafen «neste 24 timer» i stedet for resten av dagen.
      const imorgen = a.tomorrow_valid === false ? [] : liste(a.raw_tomorrow || a.prices_tomorrow || a.tomorrow_raw, 1);
      return iDag.concat(imorgen.length ? imorgen : liste(a.tomorrow_valid === false ? null : a.tomorrow, 1));
    }

    _prisKilde() {
      if (this._c.strom && this._c.strom.pris) return this._c.strom.pris;
      if (this._autoPris && this._st(this._autoPris)) return this._autoPris;
      const S = this._hass.states;
      this._autoPris = Object.keys(S).find((id) => id.startsWith("sensor.") && Array.isArray(S[id].attributes.raw_today));
      return this._autoPris;
    }

    _pris(s, e, ned) {
      const r = s.getBoundingClientRect();
      const n = s.querySelectorAll("i").length;
      if (!n) return;
      const i = Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - r.left) / (r.width || 1)) * n)));
      if (ned) { try { s.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } }
      if (this._prisPek === i) return;
      this._prisPek = i;
      if (ned) this._haptikk("selection");
      this._sist.strom = null;
      this._tegnStrom();
    }

/* «Nytt i Plex»: plakatene fra Plex-sensorene (upcoming-media-formatet), nyeste
       først, i en rad som rulles sidelengs. Trykk åpner i Plex-appen når sensoren gir
       en lenke, ellers sensoren. */
    /* Nytt i Plex: én stor plakat med bakgrunnsbildet (fanart), tittel og undertekst, som
       byttes hvert 10. sekund og kan sveipes – som swipe-kortet i dashbordet. Leser sensorenes
       data-liste slik malen dashboard_plex gjør (data[1], data[2] …). Finnes ingenting, sier
       kortet hvorfor: sensor mangler, ingen data, eller tom liste. */
    _tegnPlex() {
      const k = this._c.plex;
      const vert = this.shadowRoot.getElementById("plex");
      if (!vert) return;
      if (!k) { vert.innerHTML = ""; return; }
      const sensorer = [].concat(k.sensorer || k.sensor || k.entity || []).filter(Boolean);
      if (!this._endret("plex", sensorer) && vert.innerHTML) return;
      const alle = [], grunner = [];
      for (const id of sensorer) {
        const st = this._st(id);
        if (!st) { grunner.push(`${id} finnes ikke`); continue; }
        let data = st.attributes.data;
        if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { data = null; } }
        if (!Array.isArray(data)) { grunner.push(`${id} har ingen data-liste`); continue; }
        const film = /movie|film/.test(id);
        data.forEach((d, i) => {
          if (!d || typeof d !== "object" || d.title_default !== undefined || !d.title) return;
          const t = new Date(d.airdate || d.aired || d.added || 0).getTime();
          const aar = d.release ? String(d.release).replace(/\$\w+,?\s*/g, "").trim() : "";
          alle.push({ id, tittel: d.title,
            under: film ? [aar, d.runtime ? `${d.runtime} min` : ""].filter(Boolean).join(" · ") || "Film"
              : [d.number, d.episode].filter(Boolean).join(" · ") || "Serie",
            bilde: d.fanart || d.poster || "", lenke: d.deep_link || "", t: isNaN(t) ? 0 : t, nr: i, film });
        });
        if (!data.some((d) => d && d.title && d.title_default === undefined)) grunner.push(`${id} er tom`);
      }
      alle.sort((a, b) => (b.t - a.t) || (a.nr - b.nr));
      this._plexListe = alle.slice(0, Number(k.antall) || 6);
      if ((this._plexI || 0) >= this._plexListe.length) this._plexI = 0;
      if (!this._plexListe.length) {
        vert.innerHTML = `<div class="plexhero"><div class="tomt"><ha-icon icon="mdi:plex" style="--mdc-icon-size:28px;color:#e5a00d"></ha-icon>
          <b>Ingenting nytt i Plex</b><span>${esc(grunner.join(" · ") || "ingen sensorer satt opp")}</span></div></div>`;
        return;
      }
      vert.innerHTML = `<div class="plexhero" data-tap="plexgaa" ${sensorer[0] ? `data-hold="${esc(sensorer[0])}"` : ""}>
        ${this._plexListe.map((x, i) => `<div class="bak ${i === (this._plexI || 0) ? "vis" : ""}" style="background-image:url('${esc(x.bilde)}')"></div>`).join("")}
        <div class="ph-inn">
          <div class="ph-merke"><ha-icon icon="mdi:plex"></ha-icon>${esc(k.navn || "Nytt i Plex")}</div>
          <div class="ph-tittel"></div><div class="ph-under"></div>
        </div>
        <div class="prikker">${this._plexListe.map((_, i) => `<i class="${i === (this._plexI || 0) ? "aktiv" : ""}"></i>`).join("")}</div>
      </div>`;
      this._plexVis(this._plexI || 0);
      // bytte hvert 10. sekund, og sveip med fingeren
      clearInterval(this._plexUr);
      if (this._plexListe.length > 1) this._plexUr = setInterval(() => this._plexVis((this._plexI + 1) % this._plexListe.length), Number(k.intervall) || 10000);
      const hero = vert.querySelector(".plexhero");
      let x0 = null;
      hero.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
      hero.addEventListener("pointerup", (e) => {
        if (x0 == null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) < 40 || this._plexListe.length < 2) return;
        this._plexSveipet = true;
        this._haptikk("selection");
        const n = this._plexListe.length;
        this._plexVis(((this._plexI || 0) + (dx < 0 ? 1 : -1) + n) % n);
        clearInterval(this._plexUr);
        this._plexUr = setInterval(() => this._plexVis((this._plexI + 1) % n), Number(k.intervall) || 10000);
      });
      hero.addEventListener("click", (e) => { if (this._plexSveipet) { this._plexSveipet = false; e.stopPropagation(); } }, true);
    }

    _plexVis(i) {
      this._plexI = i;
      const vert = this.shadowRoot.getElementById("plex");
      const x = (this._plexListe || [])[i];
      if (!vert || !x) return;
      vert.querySelectorAll(".bak").forEach((b, j) => b.classList.toggle("vis", j === i));
      vert.querySelectorAll(".prikker i").forEach((p, j) => p.classList.toggle("aktiv", j === i));
      const t = vert.querySelector(".ph-tittel"), u = vert.querySelector(".ph-under");
      if (t) t.textContent = x.tittel;
      const dager = x.t ? Math.floor((Date.now() - x.t) / 864e5) : null;
      if (u) u.textContent = [x.under, dager == null ? "" : dager <= 0 ? "lagt til i dag" : dager === 1 ? "i går" : `${dager} d siden`].filter(Boolean).join(" · ");
    }

    _tegnStrom() {
      const c = this._c.strom;
      if (c === false || c.vis === false || this._c.strom_av) {
        const el = this.shadowRoot.getElementById("strom"); if (el) el.innerHTML = "";
        return;
      }
      const kilde = this._prisKilde();
      if (!this._endret("strom", [kilde, c.effekt, c.fast])) return;
      const vert = this.shadowRoot.getElementById("strom");
      const alle = (this._priser(kilde) || []).filter((x) => !isNaN(x.v));
      const eff = this._st(c.effekt);
      const naa = Date.now();
      const iNaa = alle.findIndex((x, i) => x.t <= naa && (i === alle.length - 1 || alle[i + 1].t > naa));
      const spotNaa = iNaa >= 0 ? alle[iNaa].v : Number((this._st(kilde) || {}).state) * (this._prisSkala || 1);
      /* Vinduet: de neste 24 timene når morgendagens priser finnes (etter ca. kl. 13),
         ellers hele i dag med det som er forbi, dempet. */
      const fremover = iNaa >= 0 && alle.length - iNaa >= 12;
      const p = fremover ? alle.slice(iNaa, iNaa + 24) : alle.slice(0, 24);
      const jNaa = fremover ? 0 : iNaa;
      // de tre billigste timene på rad som ikke er passert
      let billig = -1, best = Infinity;
      for (let i = Math.max(0, jNaa); i + 2 < p.length; i++) {
        const sum = p[i].v + p[i + 1].v + p[i + 2].v;
        if (sum < best) { best = sum; billig = i; }
      }
      const maks = Math.max(...p.map((x) => x.v), 0.01);
      const tt = (t) => String(new Date(t).getHours()).padStart(2, "0");
      const pek = this._prisPek;
      let lapp = "";
      if (pek != null && p[pek]) {
        lapp = `<div class="lapp" style="left:${((pek + 0.5) / p.length) * 100}%"><b>${komma(p[pek].v, 2)} kr</b>
          <span>kl. ${tt(p[pek].t)}–${tt(p[pek].t + TIME)}</span></div>`;
      }
      const effekt = eff ? Number(eff.state) : NaN;
      // fastpris (Norgespris) vises stort når den er satt; spotprisen står da ved siden av
      const fs = this._st(c.fast);
      let fast = fs ? Number(fs.state) : NaN;
      if (fs) {
        const enh = String(fs.attributes.unit_of_measurement || "").toLowerCase();
        if (enh.includes("øre") || enh.includes("ore") || fast > 20) fast /= 100;
      }
      const harFast = !isNaN(fast);
      const hovedNavn = harFast ? (c.fast_navn || "Norgespris nå") : "Strøm nå";
      const hovedVerdi = harFast ? fast : spotNaa;
      // aksen: hver fjerde time, første er «Nå» i fremover-visning
      const akse = [];
      for (let i = 0; i < p.length; i += 4) akse.push(i === 0 && fremover ? "Nå" : tt(p[i].t));
      if (p.length) akse.push(tt(p[p.length - 1].t));
      vert.innerHTML = `<div class="kort">
        <button class="strom3" data-tap="gaa" data-sti="${esc(c.trykk || "")}" ${kilde ? `data-hold="${esc(harFast ? c.fast : kilde)}"` : ""}>
          <span><div class="navn">${esc(hovedNavn)}</div><div class="tall">${komma(hovedVerdi, 2)} <small>kr/kWh</small></div></span>
          ${harFast && !isNaN(spotNaa) ? `<span><div class="navn">Spot</div><div class="tall lite">${komma(spotNaa, 2)} <small>kr</small></div></span>` : "<span></span>"}
          ${!isNaN(effekt) ? `<span class="hoyre"><div class="navn">Effekt</div><div class="tall">${komma(effekt, 0)} <small>W</small></div></span>` : "<span></span>"}
        </button>
        ${p.length ? `<div class="soyler ${pek != null ? "peker" : ""}">
          ${p.map((x, i) => `<i class="${i === jNaa ? "naa" : billig >= 0 && i >= billig && i < billig + 3 ? "billig" : ""} ${i < jNaa ? "forbi" : ""} ${i === pek ? "valgt" : ""}"
            style="height:${Math.max(3, (x.v / maks) * 100).toFixed(1)}%"></i>`).join("")}
          ${lapp}</div>
        <div class="akse">${akse.map((a) => `<span>${a}</span>`).join("")}</div>
        <div class="forklaring">
          ${billig >= 0 ? `<span><i style="background:var(--blue,#8ab4f8)"></i>Billigst ${tt(p[billig].t)}–${tt(p[billig + 2].t + TIME)}</span>` : ""}
          <span><i style="background:color-mix(in srgb,var(--gray1000,#fafbfc) 22%,transparent)"></i>Spotpris ${fremover ? `neste ${p.length} t` : "i dag"}</span>
        </div>` : ""}
      </div>`;
    }

    _tegnLys() {
      const k = this._c.lys;
      const vert = this.shadowRoot.getElementById("lys");
      if (!k) { vert.innerHTML = ""; return; }
      const lamper = this._ids(k.lamper);
      if (!this._endret("lys", [k.gruppe, ...lamper.map((x) => x.entity)])) return;
      const g = this._st(k.gruppe);
      const pa = lamper.filter((x) => this._optFor(x.entity, "state", (this._st(x.entity) || {}).state) === "on").length;
      const noenPa = lamper.length ? pa > 0 : !!g && g.state === "on";
      const rader = k.visning !== "fliser";
      const info = lamper.map((x) => {
        const st = this._st(x.entity);
        if (!st) return null;
        const erPa = this._optFor(x.entity, "state", st.state) === "on";
        const modi = st.attributes.supported_color_modes;
        const kanDimmes = Array.isArray(modi) ? !modi.every((m) => m === "onoff") : st.attributes.brightness != null;
        const faktiskPst = st.attributes.brightness ? Math.round(st.attributes.brightness / 2.55) : erPa ? 100 : 0;
        const pst = erPa ? this._optFor(x.entity, "pst", faktiskPst, (o, f) => Math.abs(o - f) <= 2) : 0;
        const navn = x.navn || st.attributes.friendly_name || x.entity;
        /* Lampas egen farge: rgb når den har det, ellers en varm tone ut fra fargetemperaturen. */
        let farge = null;
        const at = st.attributes;
        if (erPa && Array.isArray(at.rgb_color)) farge = `rgb(${at.rgb_color.join(",")})`;
        else if (erPa && at.color_temp_kelvin) { const kk = Math.max(2000, Math.min(6500, at.color_temp_kelvin)); const f = (kk - 2000) / 4500;
          farge = `rgb(255,${Math.round(170 + 70 * f)},${Math.round(90 + 150 * f)})`; }
        else if (erPa) farge = "rgb(255,196,120)";
        return { x, st, erPa, kanDimmes, pst, navn, farge };
      }).filter(Boolean);
      const fargerPa = info.filter((i) => i.farge).map((i) => i.farge);
      const glod = fargerPa.length && this._c.levende !== false
        ? `style="--lysglod:linear-gradient(145deg, ${fargerPa[0]}, ${fargerPa[fargerPa.length - 1]});--lysglod-farge:${fargerPa[0]}"` : "";
      const hode = rader
        ? `<div class="hode" style="grid-template-columns:46px minmax(0,1fr) auto">
            <span class="ik ${noenPa ? "fylt lysglod" : ""}" ${glod}><ha-icon icon="${esc(k.ikon || "mdi:lightbulb-group")}"></ha-icon></span>
            <button style="text-align:left" data-tap="mer" data-id="${esc(k.gruppe || "")}" ${k.gruppe ? `data-hold="${esc(k.gruppe)}"` : ""}>
              <div class="navn">${esc(k.navn || "Lys i stua")}</div><div class="status">${lamper.length ? `${pa} av ${lamper.length} på` : (noenPa ? "På" : "Av")}</div></button>
            <button class="knapp" data-tap="gruppe" aria-label="${noenPa ? "Slå av alle" : "Slå på alle"}">${noenPa ? "Slå av" : "Slå på"}</button>
          </div>`
        : `<button class="hode" data-tap="${k.gruppe ? "veksle" : "mer"}" data-id="${esc(k.gruppe || "")}" ${k.gruppe ? `data-hold="${esc(k.gruppe)}"` : ""}>
          <span class="ik ${pa ? "fylt" : ""}"><ha-icon icon="${esc(k.ikon || "mdi:lightbulb-group")}"></ha-icon></span>
          <span><div class="navn">${esc(k.navn || "Lys i stua")}</div><div class="status">${lamper.length ? `${pa} av ${lamper.length} på` : (g && g.state === "on" ? "På" : "Av")}</div></span><span></span></button>`;
      const liste = rader
        ? `<div class="lysliste">${info.map(({ x, erPa, kanDimmes, pst, navn, farge }) =>
            `<button class="lrad ${erPa ? "pa" : ""} ${erPa && (!kanDimmes || pst >= 55) ? "lys" : ""} ${farge ? "farge" : ""}" ${farge ? `style="--lysfarge:${farge}"` : ""} data-tap="veksle"
              data-id="${esc(x.entity)}" data-hold="${esc(x.entity)}" ${kanDimmes ? `data-dimm="1"` : ""}
              aria-pressed="${erPa}" aria-label="${esc(navn)}">
              <span class="fyll ${kanDimmes && erPa && pst < 100 ? "kant" : ""}" style="width:${erPa ? (kanDimmes ? pst : 100) : 0}%"></span>
              <ha-icon class="lb" icon="${esc(x.ikon || lampeIkon(navn, erPa))}"></ha-icon>
              <span class="ln">${esc(navn)}</span>
              <span class="lv">${erPa ? (kanDimmes ? `${pst} %` : "På") : "Av"}</span>
              <span class="bryter ${erPa ? "pa" : ""}"></span>
            </button>`).join("")}</div>`
        : `<div class="lysgrid">${info.map(({ x, st, erPa, kanDimmes, pst, navn }) => {
            const helt = erPa && (!kanDimmes || pst >= 99);
            return `<button class="lflis ${erPa ? "pa" : ""} ${helt ? "helt" : ""}" data-tap="veksle" data-id="${esc(x.entity)}"
              data-hold="${esc(x.entity)}" ${kanDimmes ? `data-dimm="1"` : ""} aria-label="${esc(navn)}">
            ${kanDimmes ? `<span class="fyll" style="width:${erPa ? pst : 0}%"></span>` : ""}
            <span class="lik"><ha-icon icon="${esc(x.ikon || st.attributes.icon || (erPa ? "mdi:lightbulb-on" : "mdi:lightbulb-outline"))}"></ha-icon></span>
            <span class="lt"><span class="ln">${esc(navn)}</span>
              <span class="lv">${erPa ? (kanDimmes ? `${pst} %` : "På") : "Av"}</span></span>
          </button>`;
          }).join("")}</div>`;
      const hint = rader && info.some((i) => i.kanDimmes) && this._c.lys.hint !== false
        ? `<div class="hint">Trykk for å slå av/på · dra for lysstyrke</div>` : "";
      vert.innerHTML = `<div class="kort">${hode}${liste}${hint}</div>`;
    }

    _tegnDekker() {
      const dk = this._c.dekker || [];
      const vert = this.shadowRoot.getElementById("dekker");
      if (!dk.length) { vert.innerHTML = ""; return; }
      const alle = dk.flatMap((d) => [d.hoved, ...(d.deler || []).map((x) => x.entity)]).filter(Boolean);
      if (!this._endret("dekker", alle)) return;
      if (this._c.dekker_visning !== "full") {
        /* Kompakt: én rad per dekke – status til venstre, opp/stopp/ned til høyre. Trykk på
           navnet åpner entiteten (med posisjonsglideren), langt trykk likeså. */
        vert.innerHTML = `<div class="kort">${dk.map((d, i) => {
          const inv = d.invertert !== false;
          const deler = (d.deler && d.deler.length ? d.deler : [{ entity: d.hoved }]).filter((x) => this._st(x.entity));
          const pos = (id) => { const st = this._st(id); return st ? Math.round(st.attributes.current_position || 0) : 0; };
          const snittPos = deler.length ? Math.round(deler.reduce((s, x) => s + pos(x.entity), 0) / deler.length) : 0;
          const hoved = this._st(d.hoved);
          const beveg = hoved && (hoved.state === "opening" || hoved.state === "closing");
          const v = inv ? 100 - snittPos : snittPos;
          let tekst = inv ? (v <= 2 ? "Oppe" : v >= 98 ? "Nede" : `${v} % nede`) : (v >= 98 ? "Åpen" : v <= 2 ? "Lukket" : `${v} % åpen`);
          if (!deler.length && hoved) tekst = { open: "Åpen", closed: "Lukket" }[hoved.state] || hoved.state;
          if (beveg) tekst = hoved.state === "opening" ? (inv ? "Går opp …" : "Åpner …") : (inv ? "Går ned …" : "Lukker …");
          const id = d.hoved || (deler[0] && deler[0].entity) || "";
          const k = (cmd, ikon, navn) => `<button class="rund" data-tap="dekke" data-i="${i}" data-cmd="${cmd}" aria-label="${esc(d.navn || "")} ${navn}"><ha-icon icon="${ikon}"></ha-icon></button>`;
          return `<div class="drad">
            <button class="hode" data-tap="mer" data-id="${esc(id)}" data-hold="${esc(id)}">
              <span class="ik"><ha-icon icon="${esc(d.ikon || "mdi:blinds")}"></ha-icon></span>
              <span><div class="navn">${esc(d.navn || "")}</div><div class="liten">${esc(tekst)}</div></span></button>
            <div class="tre">${k("opp", d.ikon_opp || (inv ? "mdi:chevron-up" : "mdi:arrow-expand-horizontal"), inv ? "opp" : "åpne")}${k("stopp", "mdi:stop", "stopp")}${k("ned", d.ikon_ned || (inv ? "mdi:chevron-down" : "mdi:arrow-collapse-horizontal"), inv ? "ned" : "lukk")}</div>
          </div>`;
        }).join("")}</div>`;
        return;
      }
      /* Flere dekker (markise, gardiner) deler ett kort med et segment øverst, i stedet
         for å stå under hverandre – høyre kolonne ble lenger enn skjermen. */
      const valgt = Math.min(this._dekkeValgt || 0, dk.length - 1);
      const seg = dk.length > 1 ? `<div class="seg">${dk.map((d, i) =>
        `<button class="${i === valgt ? "valgt" : ""}" data-tap="dekkeseg" data-i="${i}">${esc(d.navn || `Nr. ${i + 1}`)}</button>`).join("")}</div>` : "";
      vert.innerHTML = dk.map((d, i) => {
        if (i !== valgt) return "";
        const inv = d.invertert !== false;
        const vis = (id) => {
          const st = this._st(id);
          const pos = this._optFor(id, "pos", st ? Math.round(st.attributes.current_position || 0) : 0, (o, f) => Math.abs(o - f) <= 2);
          return inv ? 100 - pos : pos;
        };
        const deler = (d.deler && d.deler.length ? d.deler : [{ navn: "", entity: d.hoved }]).filter((x) => this._st(x.entity));
        const snitt = deler.length ? Math.round(deler.reduce((s, x) => s + vis(x.entity), 0) / deler.length) : 0;
        const tekst = inv ? (snitt <= 2 ? "Oppe" : snitt >= 98 ? "Nede" : `${snitt} % nede`) : (snitt >= 98 ? "Åpen" : snitt <= 2 ? "Lukket" : `${snitt} % åpen`);
        return `<div class="kort">${seg}
          <button class="hode" data-tap="mer" data-id="${esc(d.hoved || deler[0] && deler[0].entity)}" data-hold="${esc(d.hoved || deler[0] && deler[0].entity)}">
            <span class="ik"><ha-icon icon="${esc(d.ikon || "mdi:blinds")}"></ha-icon></span>
            <span><div class="navn">${esc(d.navn || "")}</div><div class="status">${tekst}</div></span><span></span></button>
          ${deler.map((x) => {
            const v = vis(x.entity);
            return `<div class="del"><span class="dn">${esc(x.navn || "")}</span>
              <div class="dra" data-slag="dekke" data-inv="${inv ? 1 : 0}" data-id="${esc(x.entity)}"><i style="width:${v}%"></i><b style="left:${v}%"></b></div>
              <span class="dv">${v} %</span></div>`;
          }).join("")}
          <div class="preset">${[0, 25, 50, 75, 100].map((v) =>
            `<button class="${Math.abs(snitt - v) <= 5 ? "valgt" : ""}" data-tap="preset" data-i="${i}" data-v="${v}">${v} %</button>`).join("")}</div>
        </div>`;
      }).join("");
    }
  }

  if (!customElements.get("ki-veggpanel-card")) customElements.define("ki-veggpanel-card", KiVeggpanelCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-veggpanel-card"))
    window.customCards.push({ type: "ki-veggpanel-card", name: "KI Veggpanel",
      description: "Hele veggpanelet for et rom som ett kort: toppstripe, scener, media, klima, strøm, lys og gardiner.", preview: false });
  console.info(`%c KI-VEGGPANEL %c ${VERSJON} `, "color:#fff;background:#463a40", "color:#463a40;background:#efc6c9");
})();

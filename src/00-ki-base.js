/* ki-cards – felles grunnlag. Lastes først i bundle. */
window.KI = window.KI || {};
(function (KI) {
  KI.VERSION = "5.23.0";

  KI.css = `
    :host { display:block; min-width:0; max-width:100%; }
    *, *::before, *::after { box-sizing:border-box; min-width:0; }
    .card {
      border-radius: 22px;
      max-width:100%; overflow:hidden;
      background: var(--ki-bg, var(--gray200));
      color: var(--gray1000);
      font-family: inherit;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .press { cursor:pointer; transition: transform .08s ease, filter .15s ease; }
    .press:active { transform: scale(.985); filter: brightness(1.08); }
    .icon-wrap {
      width: 40px; height: 40px; border-radius: 50%;
      display:flex; align-items:center; justify-content:center;
      background: var(--gray100); color: var(--gray1000);
      flex: none;
    }
    .icon-wrap.on { background: var(--active-big); color: rgba(70,58,64,.95); }
    ha-icon { --mdc-icon-size: 22px; }
    .name { font-size:14px; font-weight:500; line-height:1.2; }
    .label { font-size:12px; font-weight:500; opacity:.65; line-height:1.2; margin-top:2px; }
    .state { font-size:13px; font-weight:500; opacity:.7; white-space:nowrap; }
    .state.on { opacity:1; }
    .section { font-size:13px; font-weight:600; opacity:.55; padding:4px 2px 2px; color:var(--gray1000); }
    .chip { font-size:12px; font-weight:500; padding:4px 10px; border-radius:999px; background:var(--gray100); color:var(--gray1000); opacity:.6; white-space:nowrap; }
    .chip.on { background:var(--active-big); color:rgba(70,58,64,.95); opacity:1; }
    .chip.warn { background:var(--yellow); color:var(--black); opacity:1; }
    .chip.bad { background:var(--red); color:#fff; opacity:1; }
    .btn { display:flex; align-items:center; justify-content:center; gap:8px; height:46px; border-radius:16px; padding:0 16px;
      background:var(--gray100); color:var(--gray1000); font-size:14px; font-weight:600; --mdc-icon-size:20px; cursor:pointer; }
    .btn.primary { background:var(--active-big); color:rgba(70,58,64,.95); }
    .btn.danger { background:var(--red); color:#fff; }
    .sw { width:44px; height:26px; border-radius:13px; background:var(--gray100); position:relative; flex:none; transition:background .2s; cursor:pointer; }
    .sw.on { background:var(--active-big); }
    .sw.disabled { opacity:.3; pointer-events:none; }
    .sw i { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform .2s; }
    .sw.on i { transform:translateX(18px); }
    .empty { font-size:13px; opacity:.6; padding:10px 12px; line-height:1.5; }
    .group { background:var(--gray100); border-radius:16px; padding:6px; display:grid; gap:4px; }
    .group .section { padding:6px 10px 2px; }
    .kv { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:40px; padding:0 10px; }
    .kv .k { font-size:13px; font-weight:500; opacity:.85; }
    .kv .v { font-size:13px; opacity:.6; font-variant-numeric:tabular-nums; }
    .disclosure { display:flex; align-items:center; justify-content:space-between; min-height:44px; padding:0 4px 0 12px; border-radius:14px; cursor:pointer; }
    .disclosure ha-icon { opacity:.5; transition:transform .2s; --mdc-icon-size:22px; }
    .disclosure.open ha-icon { transform:rotate(180deg); }
    .empty code { font-size:12px; opacity:.85; }
    input[type=time] { font:inherit; font-size:14px; font-weight:500; color:var(--gray1000); background:var(--gray100);
      border:0; border-radius:10px; padding:6px 10px; color-scheme:dark; min-width:0; }
    input[type=time]:focus-visible { outline:2px solid var(--active-big); }
    @media (prefers-reduced-motion: reduce) { .press { transition:none; } }
  `;

  /* Felles stil for "pro"-kortene – samme språk som ki-energi-card / ki-klima-pro-card */
  KI.pro = `
    :host { display:block; min-width:0; max-width:100%; }
    *, *::before, *::after { box-sizing:border-box; min-width:0; }
    .wrap { display:flex; flex-direction:column; gap:10px; color:var(--gray1000, var(--primary-text-color)); max-width:100%; overflow:hidden; }
    .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
    .hero { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px; background:var(--gray200); border-radius:24px; padding:16px; }
    .ring { position:relative; width:88px; height:88px; cursor:pointer; }
    .ring svg { width:88px; height:88px; transform:rotate(-90deg); }
    .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
    .ring-spor { stroke:rgba(128,128,128,.24); }
    .ring-fyll { stroke:var(--green,#4caf50); transition:stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1); }
    .ring-fyll.gul { stroke:var(--yellow,#f2c94c); } .ring-fyll.rod { stroke:var(--red,#f44336); } .ring-fyll.aktiv { stroke:var(--active-big); } .ring-fyll.av { stroke:rgba(128,128,128,.5); }
    .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
    .ring-tall span { font-size:13px; opacity:.6; margin-left:1px; }
    .ring-tall.liten { font-size:19px; }
    .hero-navn { font-size:19px; font-weight:600; }
    .hero-forklaring { font-size:13.5px; opacity:.72; line-height:1.4; margin-top:3px; }
    .merke { font-size:11px; font-weight:600; padding:2px 7px; border-radius:75px; background:rgba(128,128,128,.28); vertical-align:middle; }
    .merke.gul { background:rgba(242,201,76,.35); } .merke.rod { background:rgba(244,67,54,.3); }
    .switch { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:4px; padding:4px;
      border-radius:75px; background:var(--gray200); }
    .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
      cursor:pointer; opacity:.6; white-space:nowrap; min-width:0;
      transition:background .18s ease, opacity .18s ease; }
    .switch-valg.aktiv { background:var(--active-small, var(--active-big)); color:var(--gray100,#fafbfc); opacity:1; }
    /* Faner og «Avansert» på samme linje, så det ikke blir to brede brytere over hverandre */
    .fanelinje { display:flex; align-items:center; gap:8px; }
    .fanelinje .switch { flex:1; min-width:0; }
    .knapp-avansert { display:inline-flex; align-items:center; gap:7px; height:46px; padding:0 16px;
      border-radius:75px; background:var(--gray200); color:var(--gray1000); border:0; font-family:inherit;
      font-size:14px; font-weight:500; cursor:pointer; opacity:.6; flex:none;
      transition:background .18s ease, opacity .18s ease, color .18s ease; }
    .knapp-avansert ha-icon { --mdc-icon-size:20px; }
    .knapp-avansert.aktiv { background:var(--active-small, var(--active-big)); color:var(--gray100,#fafbfc); opacity:1; }
    .knapp-avansert:focus-visible { outline:2px solid var(--active-big); outline-offset:2px; }
    @media (max-width:420px) { .knapp-avansert span { display:none; } .knapp-avansert { padding:0 14px; } }
    .blokk { background:var(--gray200); border-radius:24px; padding:8px 14px 14px; }
    .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px; font-size:13px; font-weight:600; opacity:.55; padding:8px 4px; }
    .blokk-sub { font-weight:500; text-align:right; }
    .tall-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .tall { background:rgba(128,128,128,.12); border-radius:16px; padding:10px 6px; text-align:center; }
    .tall b { display:block; font-size:18px; font-variant-numeric:tabular-nums; } .tall span { font-size:11.5px; opacity:.6; }
    .spor { height:10px; border-radius:6px; background:rgba(128,128,128,.24); overflow:hidden; margin:10px 0 6px; position:relative; }
    .fyll { height:100%; background:var(--active-big); transition:width .5s ease; }
    .fyll.gul { background:var(--yellow); } .fyll.rod { background:var(--red); } .fyll.gronn { background:var(--green); }
    .spor .strek { position:absolute; top:0; bottom:0; width:2px; background:var(--gray1000); opacity:.45; }
    .under { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; opacity:.6; }
    .notat { font-size:12.5px; opacity:.6; padding:8px 2px 0; line-height:1.4; }
    .last { border-radius:18px; background:rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
    .last:last-child { margin-bottom:0; }
    .last-hode { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px; padding:10px; cursor:pointer; }
    .last-hode.med-bryter { grid-template-columns:14px 1fr auto auto; }
    .last-navn { font-size:14.5px; font-weight:500; }
    .last-forklaring { font-size:12.5px; opacity:.62; line-height:1.35; }
    .last-verdi { font-size:13.5px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }
    .last-verdi small { display:block; font-size:11px; font-weight:500; opacity:.55; }
    .last-kropp { display:none; padding:0 10px 10px; }
    .last.apen .last-kropp { display:block; }
    .last-fakta { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; opacity:.85; padding-bottom:8px; }
    .last-fakta span { background:rgba(128,128,128,.16); padding:3px 9px; border-radius:75px; }
    .last-fakta span.b-nei { opacity:.45; text-decoration:line-through; }
    .b-ok { background:rgba(76,175,80,.25) !important; } .b-advarsel { background:rgba(252,109,9,.25) !important; } .b-feil { background:rgba(244,67,54,.25) !important; }
    .prikk { width:10px; height:10px; border-radius:50%; background:rgba(128,128,128,.4); }
    .p-ok { background:var(--green,#4caf50); } .p-advarsel { background:var(--yellow,#f2c94c); } .p-feil { background:var(--red,#f44336); } .p-aktiv { background:var(--active-big); }
    .rad { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 2px; }
    .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
    .rad-navn { font-size:14.5px; } .rad-sub { font-size:12px; opacity:.55; line-height:1.3; }
    .rad-verdi { font-size:13.5px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
    .rad.dim { opacity:.45; }
    .bryter { width:46px; height:28px; min-width:46px; border-radius:75px; background:rgba(128,128,128,.28); cursor:pointer; position:relative; transition:background .18s ease; }
    .bryter.on { background:var(--active-big); }
    .bryter span { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition:transform .18s ease; }
    .bryter.on span { transform:translateX(18px); } .bryter.mangler { opacity:.35; pointer-events:none; }
    .knapper { display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; }
    .knapp { flex:1; min-width:120px; text-align:center; padding:11px 14px; border-radius:75px; font-size:14px; font-weight:600; cursor:pointer; background:rgba(128,128,128,.18); }
    .knapp.primar { background:var(--active-big); color:rgba(70,58,64,.95); } .knapp.fjern { background:rgba(244,67,54,.22); }
    .knapp.press:active { filter:brightness(1.1); }
    .dager { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; padding:2px 0 6px; }
    .dag { height:38px; border-radius:12px; background:rgba(128,128,128,.14); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; opacity:.5; cursor:pointer; }
    .dag.on { background:var(--yellow); color:var(--black); opacity:1; }
    .dag.idag { box-shadow:inset 0 0 0 2px rgba(255,255,255,.4); }
    input[type=time] { font:inherit; font-size:14px; font-weight:600; color:var(--gray1000); background:rgba(128,128,128,.18); border:0; border-radius:10px; padding:6px 10px; color-scheme:dark; min-width:0; width:92px; text-align:center; }
    input[type=time]::-webkit-calendar-picker-indicator { display:none; }
    input[type=time]:focus-visible { outline:2px solid var(--active-big); }
    input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none; background:linear-gradient(to right, var(--active-big) 0 var(--p), rgba(128,128,128,.24) var(--p) 100%); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; cursor:grab; }
    input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
    .slider-rad { display:grid; grid-template-columns:110px 1fr 64px; align-items:center; gap:10px; padding:9px 2px; }
    .slider-rad + .slider-rad, .rad + .slider-rad, .slider-rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
    .tom { font-size:13px; opacity:.6; padding:10px 4px; line-height:1.5; }
    /* stepper: navn + verdi over, [−] spor [+] under */
    .stp { padding:9px 2px; } .stp + .stp, .rad + .stp, .stp + .rad { border-top:1px solid rgba(128,128,128,.14); }
    .stp-topp { display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
    .stp-navn { font-size:14.5px; } .stp-sub { font-size:12px; opacity:.55; }
    .stp-verdi { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
    .stp-rad { display:grid; grid-template-columns:34px 1fr 34px; align-items:center; gap:10px; margin-top:8px; }
    .steg { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; cursor:pointer; background:rgba(128,128,128,.18); user-select:none; -webkit-user-select:none; }
    .steg:active { transform:scale(.93); }
    .stp-spor { position:relative; height:34px; border-radius:17px; background:rgba(128,128,128,.16); overflow:hidden; cursor:pointer; touch-action:none; }
    .stp-fyll { position:absolute; inset:0 auto 0 0; background:var(--active-big); border-radius:17px; transition:width .12s; }
    .stp-fyll.gul { background:var(--yellow); } .stp-fyll.rod { background:var(--red); }
    .stp-merker { position:absolute; inset:0; display:flex; justify-content:space-between; align-items:center; padding:0 12px; font-size:11px; opacity:.55; pointer-events:none; font-variant-numeric:tabular-nums; }
    .stp-tick { position:absolute; top:0; bottom:0; width:2px; background:var(--gray1000); opacity:.35; pointer-events:none; }
    /* graf */
    .graf { width:100%; height:auto; display:block; overflow:visible; }
    .graf .akse { stroke:rgba(128,128,128,.25); stroke-width:1; }
    .graf .rute { stroke:rgba(128,128,128,.12); stroke-width:1; stroke-dasharray:2 3; }
    .graf .linje { fill:none; stroke:var(--active-big); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; }
    .graf .flate { fill:var(--active-big); opacity:.15; }
    .graf .terskel { stroke:var(--yellow); stroke-width:1.5; stroke-dasharray:4 4; }
    .graf .sover { fill:var(--active-big); opacity:.22; }
    .graf .sover.gronn { fill:var(--green); }
    .graf text { font-size:10px; fill:currentColor; opacity:.55; }
    .graf .naa { stroke:var(--gray1000); stroke-width:1; opacity:.5; }
    .tegnforklaring { display:flex; gap:12px; flex-wrap:wrap; font-size:11.5px; opacity:.65; padding:6px 2px 0; }
    .tegnforklaring i { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:4px; vertical-align:-1px; }
    /* animasjoner */
    @keyframes ki-pust { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
    @keyframes ki-zzz { 0% { opacity:0; transform:translate(0,0) scale(.7); } 25% { opacity:1; } 100% { opacity:0; transform:translate(10px,-22px) scale(1.15); } }
    @keyframes ki-blink { 0%,100% { opacity:1; } 50% { opacity:.25; } }
    .pust { animation:ki-pust 4s ease-in-out infinite; }
    .zzz { position:absolute; left:100%; top:-6px; pointer-events:none; font-weight:700; font-size:12px; color:var(--active-big); }
    .zzz span { position:absolute; left:0; top:0; animation:ki-zzz 3s ease-out infinite; }
    .zzz span:nth-child(2) { animation-delay:1s; } .zzz span:nth-child(3) { animation-delay:2s; }
    .blink { animation:ki-blink 1.4s ease-in-out infinite; }
    .avatar { position:relative; width:40px; height:40px; border-radius:50%; background:rgba(128,128,128,.18); display:flex; align-items:center; justify-content:center; --mdc-icon-size:22px; flex:none; }
    .avatar.sover { background:var(--active-big); color:rgba(70,58,64,.95); }
    .avatar.vaken { background:rgba(242,201,76,.35); }
    .avatar.feil { background:rgba(244,67,54,.3); }
    @media (prefers-reduced-motion: reduce) { .ring-fyll, .fyll, .bryter, .bryter span, .stp-fyll { transition:none; } .pust, .zzz span, .blink { animation:none; } .zzz { display:none; } }
  `;
  KI.ringHtml = (pct, txt, cls, entity) => { const o = 2 * Math.PI * 43; return `<div class="ring" ${entity ? `data-more="${entity}"` : ""}>
    <svg viewBox="0 0 100 100"><circle class="ring-spor" cx="50" cy="50" r="43"></circle>
    <circle class="ring-fyll ${cls || ""}" cx="50" cy="50" r="43" style="stroke-dasharray:${o};stroke-dashoffset:${o * (1 - Math.max(0, Math.min(100, pct)) / 100)}"></circle></svg>
    <div class="ring-tall ${String(txt).length > 3 ? "liten" : ""}">${txt}</div></div>`; };
  KI.sliderHtml = (hass, id, name, opts = {}) => { const s = hass.states[id]; if (!s) return ""; const a = s.attributes;
    const min = opts.min ?? a.min ?? 0, max = opts.max ?? a.max ?? 100, step = opts.step ?? a.step ?? 1, v = parseFloat(s.state);
    const unit = opts.unit ?? (a.unit_of_measurement ? " " + a.unit_of_measurement : ""); const pct = ((v - min) / (max - min)) * 100;
    return `<div class="slider-rad"><span class="rad-navn" data-more="${id}">${name}</span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${pct}%" data-range="${id}" data-unit="${unit}" data-min="${min}" data-max="${max}">
      <span class="rad-verdi" data-out="${id}">${v}${unit}</span></div>`; };
  /* Stepper-kontroll for number-entiteter: KI.stepperHtml(hass, id, "Terskel", { unit:" %", sub:"…", tick: 80 }) */
  KI.stepperHtml = (hass, id, name, opts = {}) => { const s = hass.states[id]; if (!s) return ""; const a = s.attributes;
    const min = opts.min ?? a.min ?? 0, max = opts.max ?? a.max ?? 100, step = opts.step ?? a.step ?? 1, v = parseFloat(s.state);
    const unit = opts.unit ?? (a.unit_of_measurement ? " " + a.unit_of_measurement : ""); const pct = ((v - min) / (max - min)) * 100;
    const fmt = (x) => (opts.fmt ? opts.fmt(x) : x + unit);
    return `<div class="stp" data-stp="${id}" data-min="${min}" data-max="${max}" data-step="${step}" data-unit="${unit}">
      <div class="stp-topp"><div><div class="stp-navn" data-more="${id}" style="cursor:pointer">${name}</div>${opts.sub ? `<div class="stp-sub">${opts.sub}</div>` : ""}</div><div class="stp-verdi" data-out="${id}">${fmt(v)}</div></div>
      <div class="stp-rad"><div class="steg" data-dir="-1">−</div>
        <div class="stp-spor"><div class="stp-fyll ${opts.tone || ""}" style="width:${pct}%"></div>${opts.tick !== undefined ? `<div class="stp-tick" style="left:${((opts.tick - min) / (max - min)) * 100}%"></div>` : ""}<div class="stp-merker"><span>${fmt(min)}</span><span>${fmt(max)}</span></div></div>
        <div class="steg" data-dir="1">+</div></div></div>`; };
  KI.wireSteppers = (card, root) => {
    const h = card._hass;
    root.querySelectorAll(".stp[data-stp]").forEach(box => {
      const id = box.dataset.stp, min = +box.dataset.min, max = +box.dataset.max, step = +box.dataset.step, unit = box.dataset.unit;
      const dec = step < 1 ? String(step).split(".")[1].length : 0;
      const fyll = box.querySelector(".stp-fyll"), out = box.querySelector(".stp-verdi"), spor = box.querySelector(".stp-spor");
      let v = parseFloat(h.states[id].state), timer = null;
      const show = () => { fyll.style.width = ((v - min) / (max - min)) * 100 + "%"; out.textContent = v.toFixed(dec) + unit; };
      const commit = () => { clearTimeout(timer); timer = setTimeout(() => h.callService(id.split(".")[0], "set_value", { entity_id: id, value: v }), 350); };
      const set = (x) => { v = Math.min(max, Math.max(min, Math.round(x / step) * step)); v = +v.toFixed(dec); show(); commit(); };
      box.querySelectorAll(".steg").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); set(v + (+b.dataset.dir) * step); }));
      const fromX = (e) => { const r = spor.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; set(min + (x / r.width) * (max - min)); };
      let drag = false;
      spor.addEventListener("pointerdown", e => { e.stopPropagation(); drag = true; spor.setPointerCapture(e.pointerId); fromX(e); });
      spor.addEventListener("pointermove", e => { if (drag) fromX(e); });
      spor.addEventListener("pointerup", () => { drag = false; }); spor.addEventListener("pointercancel", () => { drag = false; });
      spor.addEventListener("click", e => e.stopPropagation());
    });
  };
  /* Historikk for grafer: KI.history(hass, [ids], timer) → { id: [[ts, state], …] } (cachet i 5 min) */
  KI._hist = {};
  KI.history = async (hass, ids, hours = 24) => {
    const key = ids.join(",") + hours; const now = Date.now(); const c = KI._hist[key];
    if (c && now - c.t < 5 * 60000) return c.data;
    if (c && c.p) return c.p;
    const start = new Date(now - hours * 3600000).toISOString();
    const p = hass.callApi("GET", `history/period/${start}?filter_entity_id=${ids.join(",")}&minimal_response&no_attributes`)
      .then(res => { const data = {}; (res || []).forEach(arr => { if (arr.length) data[arr[0].entity_id] = arr.map(x => [new Date(x.last_changed || x.last_updated).getTime(), x.state]); });
        KI._hist[key] = { t: Date.now(), data }; return data; })
      .catch(() => { KI._hist[key] = { t: Date.now(), data: {} }; return {}; });
    KI._hist[key] = { t: 0, p }; return p;
  };
  /* Graf: sannsynlighet (linje) + soveperioder (bånd) + terskel, siste N timer */
  KI.sovnGraf = (probSeries, sleepSeries, thr, hours = 24, W = 320, H = 96) => {
    const now = Date.now(), t0 = now - hours * 3600000, L = 4, R = 4, T = 6, B = 16;
    const x = (t) => L + ((Math.max(t0, Math.min(now, t)) - t0) / (now - t0)) * (W - L - R);
    const y = (v) => T + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - T - B);
    const bands = []; let on = null;
    (sleepSeries || []).forEach(([t, s]) => { if (s === "on" && on === null) on = t; if (s !== "on" && on !== null) { bands.push([on, t]); on = null; } });
    if (on !== null) bands.push([on, now]);
    const pts = (probSeries || []).map(([t, s]) => [t, parseFloat(s)]).filter(p => isFinite(p[1]));
    if (pts.length) pts.push([now, pts[pts.length - 1][1]]);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const area = pts.length ? `${path} L${x(now).toFixed(1)},${y(0)} L${x(pts[0][0]).toFixed(1)},${y(0)} Z` : "";
    const hoursTicks = []; for (let h = 0; h <= hours; h += hours / 4) { const t = t0 + h * 3600000; hoursTicks.push(`<text x="${x(t).toFixed(1)}" y="${H - 3}" text-anchor="${h === 0 ? "start" : h === hours ? "end" : "middle"}">${new Date(t).getHours().toString().padStart(2, "0")}</text>`); }
    return `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      ${bands.map(([a, b]) => `<rect class="sover" x="${x(a).toFixed(1)}" y="${T}" width="${Math.max(1, x(b) - x(a)).toFixed(1)}" height="${H - T - B}" rx="3"></rect>`).join("")}
      ${[25, 50, 75].map(v => `<line class="rute" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"></line>`).join("")}
      <line class="akse" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"></line>
      ${thr !== undefined ? `<line class="terskel" x1="${L}" x2="${W - R}" y1="${y(thr)}" y2="${y(thr)}"></line>` : ""}
      ${area ? `<path class="flate" d="${area}"></path><path class="linje" d="${path}"></path>` : `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">ingen historikk ennå</text>`}
      ${hoursTicks.join("")}
    </svg>`;
  };

  /* Kobler opp data-more / data-toggle / data-press / data-range / data-time / .last-hode i et pro-kort */
  KI.wirePro = (card, root) => {
    const h = card._hass;
    root.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", e => { e.stopPropagation(); KI.moreInfo(card, el.dataset.more); }));
    root.querySelectorAll("[data-toggle]").forEach(el => { const run = (e) => { e && e.stopPropagation(); KI.toggle(h, el.dataset.toggle); }; el.addEventListener("click", run); KI.key(el, run); });
    root.querySelectorAll("[data-press]").forEach(el => { const run = (e) => { e && e.stopPropagation(); if (el.dataset.confirm && !window.confirm(el.dataset.confirm)) return; KI.press(h, el.dataset.press); }; el.addEventListener("click", run); KI.key(el, run); });
    root.querySelectorAll("input[data-range]").forEach(inp => {
      const out = root.querySelector(`[data-out="${inp.dataset.range}"]`); const min = +inp.dataset.min, max = +inp.dataset.max;
      inp.addEventListener("input", () => { out.textContent = inp.value + inp.dataset.unit; inp.style.setProperty("--p", ((inp.value - min) / (max - min)) * 100 + "%"); });
      inp.addEventListener("change", () => h.callService(inp.dataset.range.split(".")[0], "set_value", { entity_id: inp.dataset.range, value: parseFloat(inp.value) }));
      inp.addEventListener("click", e => e.stopPropagation());
    });
    root.querySelectorAll("input[data-time]").forEach(inp => { inp.addEventListener("click", e => e.stopPropagation());
      inp.addEventListener("change", () => { if (inp.value) h.callService(inp.dataset.time.split(".")[0], "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" }); }); });
    root.querySelectorAll(".last-hode[data-open]").forEach(el => el.addEventListener("click", () => { const k = el.dataset.open; card._apen = card._apen === k ? null : k; card._lastKey = null; card._maybeRender(); }));
    // Bare pillene som faktisk har data-view skal endre visningen. Fanepillene
    // (data-tab) traff også denne lytteren og satte _view til undefined.
    root.querySelectorAll("[data-view]").forEach(el => el.addEventListener("click", () => {
      card._view = el.dataset.view; card._lastKey = null; card._maybeRender(); }));
    KI.wireSteppers(card, root);
  };

  KI.fire = (el, type, detail) =>
    el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  KI.moreInfo = (el, entityId) => KI.fire(el, "hass-more-info", { entityId });
  KI.toggle = (hass, entityId) =>
    hass.callService("homeassistant", "toggle", { entity_id: entityId });

  /* Tap = kort trykk, hold = >500 ms. Hindrer dobbel-utløsning på touch. */
  KI.bindPress = (el, onTap, onHold) => {
    let timer = null, held = false, active = false, touch = false;
    const start = (e) => {
      if (e.type === "touchstart") touch = true;
      if (e.type === "mousedown" && (touch || e.button !== 0)) return;
      active = true; held = false;
      timer = setTimeout(() => { held = true; onHold && onHold(); }, 500);
    };
    const end = (e) => {
      if (e.type === "mouseup" && touch) return;
      if (!active) return;
      active = false; clearTimeout(timer);
      if (!held) onTap && onTap();
      if (e.cancelable) e.preventDefault();
    };
    const cancel = () => { active = false; clearTimeout(timer); };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end);
    el.addEventListener("touchmove", cancel, { passive: true });
    el.addEventListener("mousedown", start);
    el.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", cancel);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };

  KI.glob = (pattern, str) => {
    if (!pattern) return true;
    const re = new RegExp("^" + pattern.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return re.test(str);
  };

  KI.friendly = (hass, id, fallback) => {
    const s = hass && hass.states[id];
    return (s && s.attributes.friendly_name) || fallback || id;
  };

  /* Finn entiteter etter attributter, f.eks. KI.find(hass, "binary_sensor", { integrasjon:"ki_sovn", type:"person" }) */
  KI.find = (hass, domain, attrs) => {
    if (!hass) return [];
    return Object.keys(hass.states).filter(id => {
      if (domain && !id.startsWith(domain + ".")) return false;
      const a = hass.states[id].attributes || {};
      return Object.keys(attrs).every(k => a[k] === attrs[k]);
    }).sort();
  };
  /* Navigerer uten å laste dashbordet på nytt: bygger mål-URL-en, bytter den med
     history og varsler både HA-ruteren og popup-kort som lytter på hashchange.
     `window.location.hash = …` unngås – i companion-appen gir det full innlasting. */
  /* Henter en fane som ble bedt om rett før kortet ble bygget. Gyldig i 6 sekunder,
     så et gammelt trykk ikke overstyrer et nytt valg. */
  KI.hentFane = (gyldige) => {
    const v = KI.ventendeFane;
    if (!v || Date.now() - v.tid > 6000) return null;
    if (gyldige && !gyldige.includes(v.fane)) return null;
    KI.ventendeFane = null;
    return v.fane;
  };

  /* «#alarm::laser» åpner popupen #alarm og ber kortet inni om å vise fanen
     «laser». Fane-delen fjernes før navigeringen, så bubble-card ser bare hashen
     sin. Alle kort som allerede navigerer via KI.navigate får dette gratis. */
  KI.navigate = (sti) => {
    if (!sti || sti === "#") return;
    let fane = null;
    if (String(sti).includes("::")) {
      const [f, ...rest] = String(sti).split("::").reverse();
      fane = f; sti = rest.reverse().join("::");
    }
    if (fane) {
      KI.ventendeFane = { hash: String(sti), fane, tid: Date.now() };
      setTimeout(() => window.dispatchEvent(new CustomEvent("ki-fane",
        { detail: { hash: String(sti), fane } })), 0);
    }
    const gammel = window.location.hash;
    let url = null;
    try { url = new URL(sti, window.location.origin + window.location.pathname + window.location.search); } catch (e) { /* tom */ }
    if (url) {
      const ny = url.pathname + url.search + url.hash;
      if (ny !== window.location.pathname + window.location.search + window.location.hash)
        window.history.pushState(null, "", ny);
    }
    window.dispatchEvent(new Event("location-changed"));
    try { window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: gammel, newURL: window.location.href })); }
    catch (e) { window.dispatchEvent(new Event("hashchange")); }
  };
  /* Noen kort navigerer gjennom button-card sin egen `navigate`-handling i stedet for
     KI.navigate. Da havner hele «#alarm::laser» i adressefeltet, og bubble-card kjenner
     ikke igjen hashen. Vi fanger det globalt: rydd hashen og meld fra om fanen. */
  if (!KI._faneVakt) {
    KI._faneVakt = () => {
      const h = window.location.hash || "";
      if (!h.includes("::")) return;
      const [ren, fane] = [h.slice(0, h.indexOf("::")), h.slice(h.indexOf("::") + 2)];
      window.history.replaceState(null, "", ren || window.location.pathname);
      window.dispatchEvent(new Event("location-changed"));
      try { window.dispatchEvent(new HashChangeEvent("hashchange")); }
      catch (e) { window.dispatchEvent(new Event("hashchange")); }
      if (!fane) return;
      // Popupen bygger kortet først etter at hashen er satt, så en hendelse her ville
      // kommet før det finnes noen lytter. Vi legger den igjen, og kortet plukker den
      // opp når det kobles til.
      KI.ventendeFane = { hash: ren, fane, tid: Date.now() };
      setTimeout(() => window.dispatchEvent(new CustomEvent("ki-fane",
        { detail: { hash: ren, fane } })), 0);
    };
    window.addEventListener("hashchange", KI._faneVakt);
    window.addEventListener("location-changed", KI._faneVakt);
    KI._faneVakt();
  }

  KI.go = (c) => { if (c.navigation_path) KI.navigate(c.navigation_path); else if (c.hash) KI.navigate(c.hash); };
  KI.press = (hass, entityId) => hass.callService("button", "press", { entity_id: entityId });
  KI.key = (el, fn) => el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  KI.hhmm = (v) => (v && v !== "unknown" && v !== "unavailable") ? String(v).slice(0, 5) : "--:--";
  KI.rel = (iso) => {
    if (!iso) return ""; const d = new Date(iso); if (isNaN(d)) return "";
    const m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "nå"; if (m < 60) return `${m} min`; const h = Math.floor(m / 60);
    if (h < 24) return `${h} t${m % 60 ? " " + (m % 60) + " min" : ""}`; return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  };
  KI.clock = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }); };
  KI.esc = (s) => String(s ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  KI.createCard = async (config) => {
    const helpers = await window.loadCardHelpers();
    return helpers.createCardElement(config);
  };

  KI.register = (type, name, description) => {
    const documentationURL = "https://github.com/SebastianKristo/ki-cards#" + type;
    window.customCards = window.customCards || [];
    window.customCards.push({ type, name, description, preview: false, documentationURL });
  };

  /* Basisklasse: renderer på nytt bare når _key() endrer seg. */
  KI.Card = class extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._lastKey = null; }
    setConfig(config) {
      if (!config) throw new Error("Mangler config");
      this._config = config; this._lastKey = null;
      if (this._hass) this._maybeRender();
    }
    set hass(hass) { this._hass = hass; this._maybeRender(); this._passHass && this._passHass(hass); }
    get hass() { return this._hass; }
    st(id) { return this._hass ? this._hass.states[id] : undefined; }
    on(id) { const s = this.st(id); return !!s && s.state === "on"; }
    val(id) { const s = this.st(id); return s ? s.state : "—"; }
    _maybeRender() {
      const k = this._key();
      if (k === this._lastKey) return;
      this._lastKey = k; this._render();
    }
    _key() { return ""; }
    _render() {}
    getCardSize() { return 1; }
  };

  console.info(`%c KI-CARDS %c v${KI.VERSION} `, "color:#fff;background:#463a40;font-weight:600", "color:#463a40;background:#f5c542");
  /* ------------------------------------------------------------------ pillefaner
   *
   * Legger den glidende pilla, dra-funksjonen og trykkeffekten fra ki-tabs-card på en
   * fanerad som ikke er vår egen — `simple-tabs` bruker `.tabs` og `.tab-button`.
   *
   * Vi rører ikke tredjepartsfila: elementet og stilen settes inn i dens shadowRoot, slik
   * ki-hjem-card alt gjør med CSS. En lapp i den minifiserte fila ville forsvunnet ved
   * neste oppdatering av kortet.
   */
  KI.pillefaner = (vert, valg = {}) => {
    const rad = valg.rad || "\.tabs";
    const knapp = valg.knapp || "\.tab-button";
    const aktiv = valg.aktiv || "active";

    /* Velgeren uten escaping, brukt både i stilen og i oppslagene under. */
    const kn = knapp.replace(/\\/g, "");
    const start = (sr) => {
      const r = sr.querySelector(rad.replace(/\\/g, ""));
      if (!r) return false;

      /* Flagget hindrer dobbel oppsett på SAMME rad. Men noen kort beholder rada og
         bytter bare innmaten — da er pilla slettet mens flagget står igjen, og uten
         denne sjekken ble den aldri satt inn på nytt. Resultatet var en fanerad helt
         uten markering, siden stilen slår av kortets egen bakgrunn. */
      if (r.dataset.kiPille && r.querySelector(".ki-pille")) return false;
      r.dataset.kiPille = "1";

      if (!sr.querySelector("style[data-ki-pille]")) {
        const st = document.createElement("style");
        st.dataset.kiPille = "1";
        st.textContent = `
          ${rad.replace(/\\/g, "")} { position:relative; }
          /* Pilla er usynlig til første ekte måling er gjort.
             Måles den før skrifta er byttet fra reservefonten, er fanen en annen
             bredde, og pilla sto et øyeblikk for bred og uten innrykk før den rettet
             seg. Å vise ingenting i det halve sekundet er bedre enn å vise noe feil.
             Kortets egen aktivbakgrunn står så lenge, siden ki-pille-klar settes
             samtidig. INGEN backticks her — dette er inne i en mal-streng. */
          .ki-pille { opacity:0; }
          .ki-pille.klar { opacity:1; }
          .ki-pille { position:absolute; top:2px; bottom:2px; left:0; border-radius:999px;
            background:var(--active-big); box-shadow:0 1px 6px rgba(0,0,0,.35);
            transform:translateX(var(--x,0px)); width:var(--w,0px);
            transition:transform .28s cubic-bezier(.2,.8,.2,1), width .28s cubic-bezier(.2,.8,.2,1);
            pointer-events:none; z-index:0; }
          .ki-pille.drar { transition:none; }
          /* touch-action none på knappene: rada er ofte rullbar sidelengs
             (simple-tabs har overflow-x:auto), og da tolker nettleseren et horisontalt
             drag som en rulling, tar over gesten og sender oss pointercancel.
             Det var grunnen til at dra ikke virket i etasjevelgeren.
             Bare knappene, ikke hele rada — rulling med finger utenfor en fane skal
             fortsatt virke når det er flere faner enn det er plass til. */
          ${kn} { position:relative; z-index:1; touch-action:none;
            transition:transform .12s cubic-bezier(.2,.8,.2,1), color .15s; }
          ${kn}:active { transform:scale(.94); }
          /* Kortets egen aktivbakgrunn slås av — men FØRST når pilla faktisk har
             fått bredde. Uten den betingelsen sto alt umerket hvis pilla av en eller
             annen grunn ikke ble plassert: vi hadde skrudd av det gamle uten å sette
             noe i stedet. */
          .ki-pille-klar ${kn}.${aktiv} { background:transparent !important;
            box-shadow:none !important; }
          @media (prefers-reduced-motion: reduce) {
            .ki-pille { transition:none; }
            ${kn}:active { transform:none; }
          }`;
        sr.appendChild(st);
      }

      const pille = document.createElement("span");
      pille.className = "ki-pille";
      r.insertBefore(pille, r.firstChild);

      /* Kort som tegner hele markupen på nytt ved klikk får en HELT NY rad, og pilla
         ville da stått ferdig i endeposisjonen uten å gli — nettopp det animasjonen
         skal vise.
         Vi husker forrige plassering på vertselementet og starter derfra, så
         overgangen blir den samme som når rada overlever. */
      const husk = vert._kiPilleSist;
      if (husk) {
        /* Sett forrige plass UTEN overgang, så pilla står der den sto før tegningen.
           Klassen fjernes ikke her — det gjør `flytt(false)` under, i neste bilde, og
           da glir den derfra til den nye fanen. */
        pille.classList.add("drar");
        pille.style.setProperty("--x", husk.x);
        pille.style.setProperty("--w", husk.w);
      }

      /* Animerer BARE når den aktive fanen faktisk har endret seg.
       *
       * De sene målingene på 120 og 400 ms retter bredden når skrifta er ferdig lastet.
       * Gjøres de animert, ser en ren korreksjon ut som en bevegelse — pilla var for
       * bred et øyeblikk og krympet synlig etterpå. Det skal skje stille.
       * Et fanebytte skal derimot gli, og det kjennes på at målet er et annet. */
      /* Etter en ny tegning står pilla på forrige plass fra `husk`. Da ER det et
         bytte, selv om vi ikke har sett den forrige fanen i DENNE oppkoblingen —
         derfor starter vi på et tomt objekt og ikke på fanen selv. */
      let sisteFane = vert._kiPilleSist ? {} : null;
      /* Skrifta avgjør fanebredden, og den lastes etter at kortet er tegnet.
         Viser vi pilla på første måling, er den målt mot reservefonten — for bred og
         uten innrykk — og retter seg et halvt sekund senere. Det er nettopp blinket
         man ser. Derfor venter vi på at skrifta er ferdig.
         Finnes ikke API-et, viser vi med en gang: bedre enn aldri. */
      let fontKlar = !(document.fonts && document.fonts.ready);
      if (!fontKlar) document.fonts.ready.then(() => { fontKlar = true; flytt(true); });

      const flytt = (uten) => {
        const a = r.querySelector(kn + "." + aktiv);
        if (!a) { pille.style.setProperty("--w", "0px"); return; }
        const bytte = sisteFane !== null && sisteFane !== a;
        sisteFane = a;
        pille.classList.toggle("drar", !!uten || !bytte);
        /* offsetLeft/offsetWidth, IKKE getBoundingClientRect.
         *
         * Rektangelet regner med transformer. En popup som glir inn med scale gir
         * derfor en skalert bredde, og pilla ble målt mot et mellomstadium — for bred
         * og uten innrykk — før den rettet seg når animasjonen var ferdig. Det var
         * blinket, ikke fontlastingen.
         *
         * offsetLeft er avstanden til forelderens KANT, mens `left:0` måles fra
         * innsiden av ramma. `clientLeft` er nøyaktig den rammebredden. */
        const kant = r.clientLeft || 0;
        pille.style.setProperty("--x", (a.offsetLeft - kant) + "px");
        pille.style.setProperty("--w", a.offsetWidth + "px");
        vert._kiPilleSist = { x: pille.style.getPropertyValue("--x"),
                              w: pille.style.getPropertyValue("--w") };
        /* Først nå tør vi slå av kortets egen bakgrunn. */
        /* Først når vi har en ekte bredde tør vi vise pilla og slå av kortets egen
           bakgrunn. De to henger sammen: skjer det ene uten det andre, står enten
           ingenting merket, eller begge deler samtidig. */
        const harMaal = a.offsetWidth > 0 && fontKlar;
        r.classList.toggle("ki-pille-klar", harMaal);
        pille.classList.toggle("klar", harMaal);
      };

      /* Kortet bytter aktiv klasse selv; vi følger med i stedet for å ta over valget. */
      const mo = new MutationObserver(() => flytt(false));
      mo.observe(r, { attributes: true, subtree: true, attributeFilter: ["class"] });
      r.addEventListener("scroll", () => flytt(true), { passive: true });
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => flytt(true));
        ro.observe(r);
        /* Også hver knapp: rada kan ha samme bredde mens en fane inni vokser når
           skrifta byttes fra reservefonten. */
        for (const b of r.querySelectorAll(kn)) ro.observe(b);
      }

      /* Flere målinger ved oppstart. Ett bilde er ikke nok når kortet fortsatt legger
         ut, skrifta ikke er byttet, eller en popup glir inn mens vi måler — da ble
         pilla riktig først etter et fanebytte.
         `uten` styrer om overgangen er av: FØRSTE gang skal pilla bare stå på plass,
         men etter en ny tegning har vi en forrige posisjon å gli FRA — og da var
         `flytt(true)` grunnen til at den hoppet i stedet. */
      const stille = !husk;
      requestAnimationFrame(() => {
        /* Ett bilde etter at forrige plass er satt: nå glir den dit den skal.
           Første gang finnes ingen forrige plass, og da settes den stille. */
        flytt(stille);
        requestAnimationFrame(() => flytt(stille));
      });
      /* De sene målingene retter bredden når skrifta er byttet. De MÅ animeres — med
         `flytt(true)` slo 120 ms-målingen av overgangen midt i glidningen, og pilla
         hoppet resten av veien. */
      setTimeout(() => flytt(false), 120);
      setTimeout(() => flytt(false), 400);

      /* `av: false` betyr ingen sperret fane; utelates den, er det `tom` som før. */
      const avKlasse = valg.av === undefined ? "tom" : valg.av;

      /* Dra: pilla følger fingeren, og knappen under slippet klikkes. Vi kaller kortets
         egen click i stedet for å sette tilstand selv — da virker deep-link, minne og
         haptikk som før. */
      let ned = 0, startX = 0, drar = false;
      r.addEventListener("pointerdown", (e) => {
        const b = e.target.closest && e.target.closest(kn);
        if (!b) return;
        ned = e.clientX;
        startX = parseFloat(pille.style.getPropertyValue("--x")) || 0;
        drar = false;
        /* Fang pekeren med en gang. Gjorde vi det først ved bevegelse, rakk rada å
           starte sin egen rulling, og vi mistet resten av gesten. */
        try { b.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      });
      const flyttMed = (e) => {
        if (!ned) return;
        const dx = e.clientX - ned;
        if (!drar && Math.abs(dx) < 6) return;
        drar = true;
        pille.classList.add("drar");
        const maks = r.scrollWidth - pille.offsetWidth - 4;
        pille.style.setProperty("--x", Math.max(2, Math.min(maks, startX + dx)) + "px");
      };
      r.addEventListener("pointermove", flyttMed);
      const slipp = (e) => {
        if (!ned) return;
        const vardrar = drar;
        ned = 0; drar = false;
        pille.classList.remove("drar");
        if (!vardrar) return;
        const rk = r.getBoundingClientRect();
        const x = e.clientX - rk.left + r.scrollLeft;
        let best = null, av = Infinity;
        for (const b of r.querySelectorAll(kn)) {
          /* En fane som er slått av skal ikke kunne dras til — «I morgen» før
             morgendagens priser er klare, for eksempel. Uten dette ville dra landet
             på den, og klikket blitt avvist uten at brukeren forsto hvorfor.
             `av: false` slår sperren av: da er den dempede fanen trykkbar, og da skal
             den kunne dras til også — ellers gjør de to gestene ulike ting. */
          if (b.hasAttribute("disabled") || (avKlasse && b.classList.contains(avKlasse))) continue;
          const m = b.offsetLeft + b.offsetWidth / 2;
          if (Math.abs(m - x) < av) { av = Math.abs(m - x); best = b; }
        }
        if (best && !best.classList.contains(aktiv)) best.click();
        else flytt(false);
      };
      /* Med pekerfangst går move/up til KNAPPEN, ikke til rada — derfor må lytterne
         ligge der også. Uten dette kom bevegelsen aldri fram. */
      for (const b of r.querySelectorAll(kn)) {
        b.addEventListener("pointermove", flyttMed);
        b.addEventListener("pointerup", slipp);
        b.addEventListener("pointercancel", slipp);
      }
      r.addEventListener("pointerup", slipp);
      r.addEventListener("pointercancel", slipp);
      return true;
    };

    /* Kortet bygger shadowRoot asynkront, så vi prøver til det er der. */
    let n = 0;
    const prov = () => {
      const sr = vert && vert.shadowRoot;
      if (sr && start(sr)) { vakt(sr); return; }
      if (n++ < 60) setTimeout(prov, 50);
    };

    /* Kortet kan tegne fanerada på nytt når som helst — Lit-baserte kort som
     * simple-tabs gjør det ved hver oppdatering. Da er både pilla og lytterne våre
     * borte, og uten dette ble de aldri satt tilbake: pilla hoppet mellom fanene i
     * stedet for å gli, og dra virket ikke i det hele tatt.
     *
     * Vakta ser på hele shadowRoot og kobler på igjen når pilla mangler. `start()`
     * gjør ingenting når alt er på plass, så det koster ikke noe å spørre.
     */
    const vakt = (sr) => {
      if (vert._kiPilleVakt || !window.MutationObserver) return;
      vert._kiPilleVakt = new MutationObserver(() => {
        const r = sr.querySelector(rad.replace(/\\/g, ""));
        if (r && !r.querySelector(".ki-pille")) start(sr);
      });
      vert._kiPilleVakt.observe(sr, { childList: true, subtree: true });
    };

    prov();
  };
})(window.KI);

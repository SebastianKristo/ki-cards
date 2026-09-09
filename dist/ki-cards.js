/* ki-cards v2.6.0 – https://github.com/SebastianKristo/ki-cards – bygget 2026-09-09 */
import { LitElement, html, css, } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
window.KI = window.KI || {};
window.KI.define = (n, c) => { if (customElements.get(n)) console.warn("ki-cards: " + n + " er allerede definert – hopper over"); else customElements.define(n, c); };

/* ===== 00-ki-base ===== */
try {
/* ki-cards – felles grunnlag. Lastes først i bundle. */
window.KI = window.KI || {};
(function (KI) {
  KI.VERSION = "2.6.0";

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
    .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px; background:var(--gray200); }
    .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500; cursor:pointer; opacity:.6; transition:background .18s ease, opacity .18s ease; }
    .switch-valg.aktiv { background:var(--active-small, var(--active-big)); color:var(--gray100,#fafbfc); opacity:1; }
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
    root.querySelectorAll(".switch-valg").forEach(el => el.addEventListener("click", () => { card._view = el.dataset.view; card._lastKey = null; card._maybeRender(); }));
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
  KI.navigate = (path) => { window.history.pushState(null, "", path); window.dispatchEvent(new Event("location-changed")); };
  KI.go = (c) => { if (c.navigation_path) KI.navigate(c.navigation_path); else if (c.hash) window.location.hash = c.hash; };
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
})(window.KI);
} catch (e) { console.error("ki-cards: 00-ki-base feilet", e); }

/* ===== 10-ki-toggle-card ===== */
try {
/* ki-toggle-card – erstatter template_toggle_card (large) og template_toggle_card_small (row) */
(function (KI) {
  class SkToggleCard extends KI.Card {
    static getStubConfig() { return { entity: "input_boolean.example", size: "row" }; }
    _cfg() {
      const c = this._config;
      return {
        entity: c.entity, name: c.name, label: c.label, icon: c.icon,
        size: c.size || "row",                 // "row" | "tile"
        background: c.background || "var(--gray200)",
        state_on: c.state_on ?? "På", state_off: c.state_off ?? "Av",
        show_state: c.show_state !== false,
        tap: c.tap_action || "toggle", hold: c.hold_action || "more-info",
      };
    }
    _key() { const c = this._cfg(); const s = this.st(c.entity); return JSON.stringify([c, s && s.state, s && s.attributes.friendly_name, s && s.attributes.icon]); }
    _render() {
      const c = this._cfg(); const s = this.st(c.entity);
      const on = this.on(c.entity);
      const name = c.name || KI.friendly(this._hass, c.entity);
      const icon = c.icon === null ? null : (c.icon || (s && s.attributes.icon) || "mdi:toggle-switch");
      const stateTxt = on ? c.state_on : c.state_off;
      const tile = c.size === "tile";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background}; display:flex; gap:12px; align-items:center;
          padding:${tile ? "14px 14px 12px" : "8px 14px 8px 8px"}; min-height:${tile ? "96px" : "56px"};
          ${tile ? "flex-direction:column; align-items:flex-start; justify-content:space-between;" : ""} }
        .txt { flex:1; min-width:0; }
        .txt .name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tile-bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dot { width:10px; height:10px; border-radius:50%; background:var(--gray400); flex:none; }
        .dot.on { background:var(--green); }
        ${!icon && !tile ? ".card{padding-left:16px}" : ""}
        ${s ? "" : ".card{opacity:.5}"}
      </style>
      <div class="card press" role="switch" aria-checked="${on}" tabindex="0">
        ${tile ? `
          ${icon ? `<div class="icon-wrap ${on ? "on" : ""}"><ha-icon icon="${icon}"></ha-icon></div>` : ""}
          <div class="tile-bottom">
            <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
            ${c.show_state ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : ""}
          </div>` : `
          ${icon ? `<div class="icon-wrap ${on ? "on" : ""}"><ha-icon icon="${icon}"></ha-icon></div>` : ""}
          <div class="txt"><div class="name">${name}</div>${c.label ? `<div class="label">${c.label}</div>` : ""}</div>
          ${c.show_state ? `<div class="state ${on ? "on" : ""}">${stateTxt}</div>` : ""}
          <div class="dot ${on ? "on" : ""}"></div>`}
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      const act = (a) => {
        if (a === "toggle") KI.toggle(this._hass, c.entity);
        else if (a === "more-info") KI.moreInfo(this, c.entity);
      };
      KI.bindPress(el, () => act(c.tap), () => act(c.hold));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(c.tap); } });
    }
    getCardSize() { return this._config.size === "tile" ? 2 : 1; }
  }
  window.KI.define("ki-toggle-card", SkToggleCard);
  KI.register("ki-toggle-card", "KI Toggle", "Bryterkort i rad- eller flisformat");
})(window.KI);
} catch (e) { console.error("ki-cards: 10-ki-toggle-card feilet", e); }

/* ===== 11-ki-toggle-list-card ===== */
try {
/* ki-toggle-list-card – auto-entities-lignende liste av ki-toggle-card */
(function (KI) {
  class SkToggleListCard extends KI.Card {
    static getStubConfig() { return { include: [{ entity_id: "automation.*" }] }; }
    _matches() {
      const c = this._config; const inc = c.include || []; const exc = c.exclude || [];
      const hit = (rule, id) => {
        const s = this._hass.states[id];
        if (rule.domain && id.split(".")[0] !== rule.domain) return false;
        if (rule.entity_id && !KI.glob(rule.entity_id, id)) return false;
        if (rule.state && s.state !== rule.state) return false;
        return true;
      };
      let ids = Object.keys(this._hass.states).filter(id => inc.some(r => hit(r, id)) && !exc.some(r => hit(r, id)));
      const sort = c.sort || "name";
      const fn = sort === "domain"
        ? (a, b) => a.localeCompare(b)
        : (a, b) => KI.friendly(this._hass, a).localeCompare(KI.friendly(this._hass, b), "nb");
      ids.sort(fn);
      return ids;
    }
    _key() { if (!this._hass) return ""; const ids = this._matches(); return JSON.stringify([this._config, ids, ids.map(i => this._hass.states[i].state)]); }
    _render() {
      const ids = this._matches(); const item = this._config.item || {};
      const gap = this._config.gap ?? 8;
      this.shadowRoot.innerHTML = `<style>:host{display:block} .list{display:grid;gap:${gap}px}
        .empty{font-size:13px;opacity:.55;padding:6px 4px}</style><div class="list"></div>`;
      const list = this.shadowRoot.querySelector(".list");
      if (!ids.length) { list.innerHTML = `<div class="empty">${this._config.empty || "Ingenting å vise"}</div>`; return; }
      this._children = ids.map(id => {
        const el = document.createElement("ki-toggle-card");
        el.setConfig({ size: "row", icon: null, background: "var(--gray200)", ...item, entity: id });
        el.hass = this._hass; list.appendChild(el); return el;
      });
    }
    _passHass(h) { (this._children || []).forEach(el => el.hass = h); }
    getCardSize() { return (this._children || []).length || 1; }
  }
  window.KI.define("ki-toggle-list-card", SkToggleListCard);
  KI.register("ki-toggle-list-card", "KI Toggle List", "Automatisk liste av brytere fra filter");
})(window.KI);
} catch (e) { console.error("ki-cards: 11-ki-toggle-list-card feilet", e); }

/* ===== 12-ki-tabs-card ===== */
try {
/* ki-tabs-card – faner med kort i hver fane.
   style: pills (piller) | dropdown (én pille som åpner meny) | auto (piller, dropdown når de ikke får plass – standard)
   sticky: true holder fanelinja øverst når innholdet scroller. */
(function (KI) {
  class SkTabsCard extends KI.Card {
    static getStubConfig() { return { tabs: [{ title: "Fane 1", cards: [] }] }; }
    setConfig(config) {
      if (!config.tabs || !config.tabs.length) throw new Error("tabs mangler");
      this._active = config.default || 0;
      this._config = config; this._built = false; this._menuOpen = false;
      if (this._hass) this._build();
    }
    set hass(h) { this._hass = h; if (!this._built) this._build(); (this._panels || []).forEach(p => p.hass = h); }
    get hass() { return this._hass; }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); if (this._docClick) document.removeEventListener("click", this._docClick, true); }

    async _build() {
      this._built = true;
      const c = this._config; const tabs = c.tabs; const style = c.style || "auto";
      const sticky = !!c.sticky;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        :host { overflow:visible; }
        .wrap { display:flex; flex-direction:column; gap:${c.gap ?? 12}px; max-width:100%; }
        .bar { display:flex; justify-content:${c.align || "center"}; position:relative; z-index:5; max-width:100%;
          ${sticky ? "position:sticky; top:0; padding:6px 0 8px; margin:-6px 0 -8px; background:var(--ki-tabs-bg, var(--gray000, #000)); border-radius:0 0 18px 18px;" : ""} }
        .tabs { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
        .tab, .dd { border:0; background:transparent; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
          padding:9px 20px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:6px; white-space:nowrap;
          transition:background .15s, color .15s; --mdc-icon-size:18px; }
        .tab:hover, .dd:hover { color:rgba(255,255,255,.95); }
        .tab.active, .dd { background:var(--active-big); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }
        .tab:focus-visible, .dd:focus-visible, .item:focus-visible { outline:2px solid var(--active-big); outline-offset:2px; }
        .dd .chev { transition:transform .15s; --mdc-icon-size:20px; margin-right:-6px; }
        .dd.open .chev { transform:rotate(180deg); }
        .menu { position:absolute; top:calc(100% + 6px); ${c.align === "flex-start" ? "left:0;" : c.align === "flex-end" ? "right:0;" : "left:50%; transform:translateX(-50%);"}
          min-width:220px; max-width:calc(100vw - 32px); background:var(--gray200); color:var(--gray1000); border-radius:18px; padding:6px;
          box-shadow:0 12px 32px rgba(0,0,0,.45); display:none; z-index:20; }
        .menu.open { display:grid; gap:2px; }
        .item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; font-size:14px; font-weight:500; cursor:pointer; --mdc-icon-size:20px; }
        .item:hover { background:var(--gray100); }
        .item.active { background:var(--active-big); color:rgba(70,58,64,.95); }
        .item .n { flex:1; }
        .item .cnt { font-size:12px; opacity:.55; }
        .measure { position:absolute; visibility:hidden; pointer-events:none; left:0; top:0; }
        .panel { display:none; min-width:0; max-width:100%; } .panel.active { display:block; }
        .stack { display:grid; gap:8px; min-width:0; }
        @media (prefers-reduced-motion: reduce) { .tab, .dd, .dd .chev { transition:none; } }
      </style>
      <div class="wrap">
        <div class="bar">
          <div class="tabs pills" role="tablist">
            ${tabs.map((t, i) => `<button class="tab ${i === this._active ? "active" : ""}" role="tab" data-i="${i}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          <div class="tabs pills measure" aria-hidden="true">
            ${tabs.map(t => `<button class="tab">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          <button class="dd" aria-haspopup="listbox" aria-expanded="false"></button>
          <div class="menu" role="listbox">
            ${tabs.map((t, i) => `<div class="item ${i === this._active ? "active" : ""}" role="option" tabindex="0" data-i="${i}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}<span class="n">${KI.esc(t.title || "")}</span></div>`).join("")}
          </div>
        </div>
        ${tabs.map((t, i) => `<div class="panel ${i === this._active ? "active" : ""}" data-i="${i}"><div class="stack"></div></div>`).join("")}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.addEventListener("click", () => this._select(+b.dataset.i)));
      r.querySelectorAll(".item").forEach(el => { const go = () => { this._select(+el.dataset.i); this._toggleMenu(false); }; el.addEventListener("click", go); KI.key(el, go); });
      r.querySelector(".dd").addEventListener("click", e => { e.stopPropagation(); this._toggleMenu(); });
      this._docClick = (e) => { if (this._menuOpen && !e.composedPath().includes(this)) this._toggleMenu(false); };
      document.addEventListener("click", this._docClick, true);

      this._mode = style;
      if (style === "auto") {
        const apply = () => {
          const bar = r.querySelector(".bar"), m = r.querySelector(".measure");
          if (!bar || !m) return;
          const fits = m.scrollWidth <= bar.clientWidth - 4;
          this._setMode(fits ? "pills" : "dropdown");
        };
        this._ro = new ResizeObserver(apply); this._ro.observe(r.querySelector(".bar"));
        requestAnimationFrame(apply);
      } else this._setMode(style);
      this._renderDd();

      this._panels = [];
      for (let i = 0; i < tabs.length; i++) {
        const t = tabs[i]; const cards = t.cards || (t.card ? [t.card] : []);
        const host = r.querySelector(`.panel[data-i="${i}"] .stack`);
        for (const cc of cards) {
          try { const el = await KI.createCard(cc); el.hass = this._hass; host.appendChild(el); this._panels.push(el); }
          catch (e) { host.innerHTML += `<div class="empty">Kunne ikke laste kort: ${KI.esc(e.message)}</div>`; }
        }
      }
    }
    _setMode(mode) {
      const r = this.shadowRoot; const pills = r.querySelector(".tabs.pills:not(.measure)"), dd = r.querySelector(".dd");
      pills.style.display = mode === "pills" ? "" : "none";
      dd.style.display = mode === "dropdown" ? "" : "none";
      if (mode !== "dropdown") this._toggleMenu(false);
    }
    _renderDd() {
      const t = this._config.tabs[this._active] || {};
      const dd = this.shadowRoot.querySelector(".dd");
      dd.innerHTML = `${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>`;
    }
    _toggleMenu(open) {
      this._menuOpen = open === undefined ? !this._menuOpen : open;
      const r = this.shadowRoot;
      r.querySelector(".menu").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").setAttribute("aria-expanded", String(this._menuOpen));
    }
    _select(i) {
      this._active = i; const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".item").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", +p.dataset.i === i));
      this._renderDd();
      KI.fire(this, "ki-tab-changed", { index: i });
    }
    getCardSize() { return 4; }
  }
  window.KI.define("ki-tabs-card", SkTabsCard);
  KI.register("ki-tabs-card", "KI Tabs", "Faner som piller eller nedtrekksmeny, med kort i hver fane");
})(window.KI);
} catch (e) { console.error("ki-cards: 12-ki-tabs-card feilet", e); }

/* ===== 13-ki-section-card ===== */
try {
/* ki-section-card – liten seksjonstittel */
(function (KI) {
  class SkSectionCard extends KI.Card {
    static getStubConfig() { return { title: "Seksjon" }; }
    _key() { return this._config.title; }
    _render() {
      this.shadowRoot.innerHTML = `<style>${KI.css}</style><div class="section">${this._config.title || ""}</div>`;
    }
  }
  window.KI.define("ki-section-card", SkSectionCard);
  KI.register("ki-section-card", "KI Section", "Seksjonsoverskrift");
})(window.KI);
} catch (e) { console.error("ki-cards: 13-ki-section-card feilet", e); }

/* ===== 14-ki-slider-card ===== */
try {
/* ki-slider-card – etikett | slider | verdi, for input_number / number */
(function (KI) {
  class SkSliderCard extends KI.Card {
    static getStubConfig() { return { entity: "input_number.example", unit: "" }; }
    _key() { const s = this.st(this._config.entity); return JSON.stringify([this._config, s && s.state, s && s.attributes]); }
    _render() {
      const c = this._config; const s = this.st(c.entity);
      const a = (s && s.attributes) || {};
      const min = c.min ?? a.min ?? 0, max = c.max ?? a.max ?? 100, step = c.step ?? a.step ?? 1;
      const v = s ? parseFloat(s.state) : min;
      const dec = c.decimals ?? (step < 1 ? 1 : 0);
      const unit = c.unit ?? (a.unit_of_measurement ? " " + a.unit_of_measurement : "");
      const fmt = (x) => x.toFixed(dec) + unit;
      const name = c.name || KI.friendly(this._hass, c.entity);
      const pct = ((v - min) / (max - min)) * 100;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .row { display:grid; grid-template-columns:${c.label_width || "106px"} 1fr ${c.value_width || "80px"}; align-items:center; height:46px; }
        .lbl { padding:0 14px; cursor:pointer; }
        .valtxt { font-size:14px; font-weight:500; text-align:right; }
        input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:4px; margin:0; outline:none;
          background: linear-gradient(to right, var(--active-big) 0 var(--p), var(--gray200) var(--p) 100%); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; cursor:grab; }
        input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--gray1000); border:0; }
        input[type=range]:focus-visible { box-shadow:0 0 0 2px var(--active-big); }
      </style>
      <div class="row">
        <div class="lbl name">${name}</div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${pct}%">
        <div class="valtxt">${fmt(v)}</div>
      </div>`;
      const inp = this.shadowRoot.querySelector("input"), out = this.shadowRoot.querySelector(".valtxt");
      inp.addEventListener("input", () => { const x = parseFloat(inp.value); out.textContent = fmt(x); inp.style.setProperty("--p", ((x - min) / (max - min)) * 100 + "%"); });
      inp.addEventListener("change", () => {
        const domain = c.entity.split(".")[0];
        this._hass.callService(domain, "set_value", { entity_id: c.entity, value: parseFloat(inp.value) });
      });
      this.shadowRoot.querySelector(".lbl").addEventListener("click", () => KI.moreInfo(this, c.entity));
    }
  }
  window.KI.define("ki-slider-card", SkSliderCard);
  KI.register("ki-slider-card", "KI Slider", "Etikett, slider og verdi for tall-entiteter");
})(window.KI);
} catch (e) { console.error("ki-cards: 14-ki-slider-card feilet", e); }

/* ===== 15-ki-action-card ===== */
try {
/* ki-action-card – handlingsknapp (erstatter template_trigger_card) */
(function (KI) {
  class SkActionCard extends KI.Card {
    static getStubConfig() { return { name: "Kjør", icon: "mdi:play-circle", action: { service: "automation.trigger", target: { entity_id: "automation.example" } } }; }
    _key() { return JSON.stringify(this._config); }
    _render() {
      const c = this._config;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray100)"}; display:flex; align-items:center; gap:12px; padding:8px 14px 8px 8px; min-height:56px; }
        .name { flex:1; }
        .chev { opacity:.45; }
      </style>
      <div class="card press" role="button" tabindex="0">
        ${c.icon ? `<div class="icon-wrap"><ha-icon icon="${c.icon}"></ha-icon></div>` : ""}
        <div class="name">${c.name || ""}</div>
        <ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>
      </div>`;
      const run = async () => {
        if (c.confirm && !window.confirm(c.confirm)) return;
        const a = c.action || {}; const [dom, svc] = (a.service || a.perform_action || "").split(".");
        if (!dom || !svc) return;
        await this._hass.callService(dom, svc, a.data || {}, a.target);
      };
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, run);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
    }
  }
  window.KI.define("ki-action-card", SkActionCard);
  KI.register("ki-action-card", "KI Action", "Knapp som kjører en tjeneste, med valgfri bekreftelse");
})(window.KI);
} catch (e) { console.error("ki-cards: 15-ki-action-card feilet", e); }

/* ===== 20-ki-vekking-card ===== */
try {
/* ki-vekking-card – vekkealarm fra ki_sovn (type vekking). mode: list (innstillinger/popup) | tile (oversikt)
   Finner alarmen selv (prefix fra sensor.*_vekking_neste_alarm) – eller sett prefix: soverom_vekking. */
(function (KI) {
  const DAGER = [
    ["mandag", "Ma", "Mandag"], ["tirsdag", "Ti", "Tirsdag"], ["onsdag", "On", "Onsdag"], ["torsdag", "To", "Torsdag"],
    ["fredag", "Fr", "Fredag"], ["lordag", "Lø", "Lørdag"], ["sondag", "Sø", "Søndag"],
  ];
  const idag = () => { const j = new Date().getDay(); return DAGER[j === 0 ? 6 : j - 1][0]; };

  class KiVekkingCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = !!c.expanded; super.setConfig(c); }

    /* Finn prefix: config → markør-attributt → gammelt navnemønster */
    _prefix() {
      const c = this._config;
      if (c.prefix) return c.prefix;
      if (c.entity && this.st(c.entity)) return this.st(c.entity).attributes.prefix || c.entity.replace(/^sensor\./, "").replace(/_neste_alarm$/, "");
      const hit = KI.find(this._hass, "sensor", { integrasjon: "ki_sovn", type: "vekking" })[0];
      if (hit) return this.st(hit).attributes.prefix;
      const old = Object.keys(this._hass ? this._hass.states : {}).find(id => /^sensor\..*_vekking_neste_alarm$/.test(id));
      return old ? old.slice(7, -12) : null;
    }
    _ids(p) {
      return {
        master: `switch.${p}_aktiv`, natt: `switch.${p}_nattlampe`, vekk: `switch.${p}_vekk_person`, bare: `switch.${p}_bare_hvis_sover`,
        fade: `number.${p}_fade_opp`, off: `number.${p}_av_etter`, neste: `sensor.${p}_neste_alarm`, kjorer: `binary_sensor.${p}_kjorer`,
        test: `button.${p}_test`, stopp: `button.${p}_stopp`,
        dayOn: (d) => `switch.${p}_${d}_aktiv`, dayTime: (d) => `time.${p}_${d}`,
      };
    }
    _all(e) { return [e.master, e.natt, e.vekk, e.bare, e.fade, e.off, e.neste, e.kjorer, ...DAGER.flatMap(([d]) => [e.dayOn(d), e.dayTime(d)])]; }
    _key() {
      const p = this._prefix(); if (!p) return JSON.stringify([this._config, "none"]);
      const e = this._ids(p); const n = this.st(e.neste);
      return JSON.stringify([this._config, this._open, p, this._all(e).map(id => { const s = this.st(id); return s ? [s.state, s.attributes.min, s.attributes.max] : null; }),
        n && n.attributes, (this.st(e.kjorer) || {}).attributes, (n && n.attributes.betingelser || []).map(id => this.val(id))]);
    }

    _info(e) {
      const n = this.st(e.neste); const a = (n && n.attributes) || {};
      const masterOn = this.on(e.master); const running = this.on(e.kjorer); const fase = (this.st(e.kjorer) || { attributes: {} }).attributes.fase;
      const tid = n ? n.state : null; const dag = a.neste_dag || "";
      const d = idag();
      const today = this.on(e.dayOn(d)) && masterOn ? KI.hhmm(this.val(e.dayTime(d))) : null;
      let status;
      if (running) status = fase === "fader" ? "Fader opp lyset …" : "Lyset er på";
      else if (!masterOn) status = "Skrudd av";
      else if (!tid || tid === "Av") status = "Ingen dager valgt";
      else status = a.neste_tidspunkt && new Date(a.neste_tidspunkt).toDateString() === new Date().toDateString() ? `I dag kl. ${tid}` : `${dag} kl. ${tid}`;
      return { ok: !!n, a, masterOn, running, fase, tid: tid && tid !== "Av" ? tid : "--:--", dag, status, today, skip: a.hopper_over, person: a.person, personSover: a.person_sover };
    }

    _render() {
      const c = this._config; const p = this._prefix();
      if (!p) {
        this.shadowRoot.innerHTML = `<style>${KI.css}</style><div class="card"><div class="empty">Fant ingen vekkealarm fra <b>KI Søvn &amp; Vekking</b>.<br>Legg til «Vekkealarm» i integrasjonen, eller sett <code>prefix: soverom_vekking</code>.</div></div>`;
        return;
      }
      const e = this._ids(p); const s = this._info(e);
      if (c.mode === "tile") return this._renderTile(e, s);
      const name = c.name || KI.friendly(this._hass, e.neste, "Vekkealarm").replace(/ neste alarm$/i, "");
      const chips = [];
      if (s.running) chips.push(`<span class="chip on">${s.fase === "fader" ? "fader" : "lyser"}</span>`);
      if (s.masterOn && s.skip === "betingelser") chips.push(`<span class="chip warn">hopper over – betingelser</span>`);
      if (s.masterOn && s.skip === "våken") chips.push(`<span class="chip warn">hopper over – våken</span>`);
      if (s.person) chips.push(`<span class="chip ${s.personSover ? "on" : ""}">${KI.friendly(this._hass, s.person).replace(/ (søvn )?sover$/i, "")} ${s.personSover ? "sover" : s.personSover === false ? "er våken" : ""}</span>`);
      const conds = s.a.betingelser || [];

      const open = this._open;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px; display:grid; gap:8px; }
        .head { display:flex; align-items:center; gap:12px; min-height:52px; padding-right:6px; }
        .head .main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer; }
        .head .txt { flex:1; min-width:0; } .head .name { font-size:15px; }
        .hero { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 10px 6px; }
        .time { font-size:46px; font-weight:600; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; ${s.masterOn ? "" : "opacity:.35;"} }
        .when { font-size:13px; opacity:.6; margin-top:4px; }
        .chips { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
        .days { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; padding:0 4px 4px; }
        .day { height:40px; border-radius:12px; background:var(--gray100); display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:600; opacity:.5; cursor:pointer; }
        .day.on { background:var(--yellow); color:var(--black); opacity:1; }
        .day.today { box-shadow:inset 0 0 0 2px rgba(255,255,255,.4); }
        .trows { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; padding:2px 4px; }
        .trow { display:flex; align-items:center; justify-content:space-between; gap:8px; height:38px; padding:0 4px 0 10px; }
        .trow.dim { opacity:.4; } .trow .name { font-size:13px; }
        .trow input[type=time] { width:88px; text-align:center; }
        .trow input[type=time]::-webkit-calendar-picker-indicator { display:none; }
        .cond { display:flex; align-items:center; justify-content:space-between; min-height:40px; padding:0 10px; cursor:pointer; }
        .actions { display:grid; grid-template-columns:${s.running ? "1fr 1fr" : "1fr"}; gap:8px; }
      </style>
      <div class="card">
        <div class="head">
          <div class="main" data-more="${e.neste}">
            <div class="icon-wrap ${s.masterOn ? "on" : ""}"><ha-icon icon="${c.icon || (s.running ? "mdi:weather-sunny" : "mdi:alarm")}"></ha-icon></div>
            <div class="txt"><div class="name">${KI.esc(name)}</div><div class="label">${KI.esc(s.status)}</div></div>
          </div>
          <div class="sw ${s.masterOn ? "on" : ""}" data-toggle="${e.master}" role="switch" aria-checked="${s.masterOn}" tabindex="0"><i></i></div>
        </div>
        <div class="hero">
          <div><div class="time">${s.tid}</div><div class="when">${s.masterOn && s.dag ? `Neste: ${KI.esc(s.dag)}` : "Ingen alarm planlagt"}</div></div>
          <div class="chips">${chips.join("")}</div>
        </div>

        <div class="group">
          <div class="section">Ukeplan</div>
          <div class="days">${DAGER.map(([d, k, full]) => `<div class="day ${this.on(e.dayOn(d)) ? "on" : ""} ${d === idag() ? "today" : ""}" data-toggle="${e.dayOn(d)}" title="${full}" role="switch" aria-checked="${this.on(e.dayOn(d))}" tabindex="0">${k}</div>`).join("")}</div>
          <div class="trows">${DAGER.map(([d, , full]) => `<div class="trow ${this.on(e.dayOn(d)) ? "" : "dim"}"><span class="name">${full}</span><input type="time" data-time="${e.dayTime(d)}" value="${KI.hhmm(this.val(e.dayTime(d)))}" aria-label="${full}"></div>`).join("")}</div>
        </div>

        <div class="disclosure ${open ? "open" : ""}" role="button" tabindex="0"><span class="name">Lys, person og betingelser</span><ha-icon icon="mdi:chevron-down"></ha-icon></div>
        ${open ? `
        <div class="group">
          <div class="section">Lys</div>
          <ki-slider-card data-slider="${e.fade}" data-name="Fade opp"></ki-slider-card>
          <ki-slider-card data-slider="${e.off}" data-name="Av etter"></ki-slider-card>
          ${this.st(e.natt) ? `<ki-toggle-card data-toggle-card="${e.natt}" data-name="Nattlampe" data-label="Ta med i vekkingen" data-icon="mdi:lightbulb-night"></ki-toggle-card>` : ""}
        </div>
        ${s.person ? `<div class="group"><div class="section">Person</div>
          <ki-toggle-card data-toggle-card="${e.vekk}" data-name="Vekk person" data-label="Marker som våken når lyset er oppe" data-icon="mdi:account-alert"></ki-toggle-card>
          <ki-toggle-card data-toggle-card="${e.bare}" data-name="Bare hvis sover" data-label="Hopp over alarmen hvis personen er våken" data-icon="mdi:sleep"></ki-toggle-card>
        </div>` : ""}
        ${conds.length ? `<div class="group"><div class="section">Betingelser – må være på</div>
          ${conds.map(id => `<div class="cond" data-more="${id}"><span class="name">${KI.esc((c.condition_names || {})[id] || KI.friendly(this._hass, id))}</span><span class="chip ${this.on(id) ? "on" : "bad"}">${this.on(id) ? "På" : "Av"}</span></div>`).join("")}
        </div>` : ""}` : ""}

        ${c.test === false ? "" : `<div class="actions">
          ${s.running ? `<div class="btn danger press" data-press="${e.stopp}" tabindex="0"><ha-icon icon="mdi:stop-circle"></ha-icon>Stopp</div>` : ""}
          <div class="btn press" data-press="${e.test}" data-confirm="1" tabindex="0"><ha-icon icon="mdi:play-circle"></ha-icon>${s.running ? "Kjører …" : "Test vekkesekvensen"}</div>
        </div>`}
      </div>`;
      this._wire(c);
    }

    _wire(c) {
      const r = this.shadowRoot; const h = this._hass;
      r.querySelectorAll("[data-toggle]").forEach(el => { const id = el.dataset.toggle; const run = () => KI.toggle(h, id); KI.bindPress(el, run, () => KI.moreInfo(this, id)); KI.key(el, run); });
      r.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", () => KI.moreInfo(this, el.dataset.more)));
      r.querySelectorAll("[data-press]").forEach(el => {
        const run = () => { if (el.dataset.confirm && !window.confirm(c.test_confirm || "Kjøre vekkesekvensen nå? Lysene fader opp og slukkes etter innstilt tid.")) return; KI.press(h, el.dataset.press); };
        KI.bindPress(el, run); KI.key(el, run);
      });
      r.querySelectorAll("input[type=time]").forEach(inp => inp.addEventListener("change", () => {
        if (inp.value) h.callService("time", "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" });
      }));
      this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { el.setConfig({ entity: el.dataset.slider, name: el.dataset.name, label_width: "96px", value_width: "64px" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("ki-toggle-card").forEach(el => { el.setConfig({ entity: el.dataset.toggleCard, name: el.dataset.name, label: el.dataset.label, icon: el.dataset.icon, background: "transparent" }); el.hass = h; this._subs.push(el); });
      const d = r.querySelector(".disclosure"); if (d) { const t = () => { this._open = !this._open; this._lastKey = null; this._maybeRender(); }; d.addEventListener("click", t); KI.key(d, t); }
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }

    _renderTile(e, s) {
      const c = this._config;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .big { font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; ${s.masterOn ? "" : "opacity:.4;"} }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${s.masterOn ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:alarm"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Vekking")}</div><div class="label">${KI.esc(s.status)}</div></div><div class="big">${s.tid}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => KI.toggle(this._hass, e.master)); KI.key(el, () => KI.go(c));
    }
    getCardSize() { return this._config.mode === "tile" ? 2 : this._open ? 10 : 6; }
  }
  window.KI.define("ki-vekking-card", KiVekkingCard);
  KI.register("ki-vekking-card", "KI Vekking", "Vekkealarm fra KI Søvn & Vekking: neste alarm, ukedager med tider, lys, person og betingelser");
})(window.KI);
} catch (e) { console.error("ki-cards: 20-ki-vekking-card feilet", e); }

/* ===== 30-ki-planter-card ===== */
try {
/* ki-planter-card – vanning av planter. mode: list (popup) | tile (oversikt)
   Finner plantene selv fra ki_planter (binary_sensor.<plante>_trenger_vann). sted: begrenser til ett sted.
   Gammel YAML-pakke støttes fortsatt via plants: [{ id, name, ... }] med input_datetime/input_number. */
(function (KI) {
  const DAG = 86400000;
  const fmtDato = (d) => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  const fmtTid = (d) => d.toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  class KiPlanterCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? null; super.setConfig(c); }

    _plants() {
      const c = this._config; const h = this._hass; if (!h) return [];
      if (c.plants) return c.plants.map(p => ({
        id: p.id, name: p.name || p.id, latin: p.latin || "", icon: p.icon || "mdi:sprout", tip: p.tip || "", legacy: true,
        last: p.last || `input_datetime.plante_${p.id}_sist_vannet`, interval: p.interval || `input_number.plante_${p.id}_intervall`,
      }));
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_planter", type: "plante" });
      if (c.sted) { const q = String(c.sted).toLowerCase(); ids = ids.filter(id => String(h.states[id].attributes.sted || "").toLowerCase().includes(q)); }
      if (c.include) ids = ids.filter(id => c.include.some(g => KI.glob(g, id)));
      return ids.map(id => { const a = h.states[id].attributes; const base = id.replace(/^binary_sensor\./, "").replace(/_trenger_vann$/, "");
        return { id: a.plante_id, name: a.navn, latin: a.latin || "", icon: a.ikon || "mdi:sprout", tip: a.tips || "", entity: id, sted: a.sted,
          last: `datetime.${base}_sist_vannet`, interval: `number.${base}_intervall`, water: `button.${base}_vannet_na` }; });
    }
    _info(p) {
      let interval, last;
      if (p.legacy) {
        const ls = this.st(p.last), is = this.st(p.interval);
        interval = is ? parseFloat(is.state) : 7;
        last = ls && ls.state && ls.state !== "unknown" ? new Date(ls.state.replace(" ", "T")) : null;
      } else {
        const a = (this.st(p.entity) || { attributes: {} }).attributes;
        interval = a.intervall_dager || 7; last = a.sist_vannet ? new Date(a.sist_vannet) : null;
        if (a.grunn === "tørr jord") return { interval, last, left: 0, pct: 100, txt: `Tørr jord ${Math.round(a.fuktighet)} %`, tone: "red" };
      }
      if (!last || isNaN(last)) return { interval, last: null, left: null, pct: 0, txt: "Ikke vannet ennå", tone: "red" };
      const elapsed = (Date.now() - last.getTime()) / DAG; const left = Math.ceil(interval - elapsed);
      const pct = Math.min(100, Math.max(0, (elapsed / interval) * 100));
      let txt, tone = "green";
      if (left > 1) txt = `Om ${left} dager`; else if (left === 1) txt = "I morgen";
      else if (left === 0) { txt = "Vann i dag"; tone = "yellow"; } else { txt = `${-left} ${-left === 1 ? "dag" : "dager"} over tiden`; tone = "red"; }
      if (tone === "green" && pct >= 70) tone = "yellow";
      return { interval, last, left, pct, txt, tone };
    }
    _key() {
      const hour = Math.floor(Date.now() / 3600000);
      return JSON.stringify([this._config, this._open, hour, this._plants().map(p => [p, this.val(p.last), this.val(p.interval), p.entity && (this.st(p.entity) || {}).attributes])]);
    }
    _vannet(p) {
      if (!p.legacy) return KI.press(this._hass, p.water);
      const d = new Date(); const pad = n => String(n).padStart(2, "0");
      return this._hass.callService("input_datetime", "set_datetime", { entity_id: p.last, datetime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00` });
    }

    _render() {
      const c = this._config; const plants = this._plants(); const infos = plants.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(plants, infos);
      const due = infos.filter(s => s.left !== null && s.left <= 0).length;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px 8px 10px; }
        .row { display:flex; align-items:center; gap:12px; min-height:48px; padding-right:6px; cursor:pointer; }
        .txt { flex:1; min-width:0; } .txt .latin { font-style:italic; }
        .due { text-align:right; } .due .state { display:block; } .due .when { font-size:12px; opacity:.5; }
        .due.red .state { color:var(--red); opacity:1; } .due.yellow .state { color:var(--yellow); opacity:1; }
        .icon-wrap.red { background:var(--red); color:#fff; } .icon-wrap.yellow { background:var(--yellow); color:var(--black); }
        .bar { height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 0; overflow:hidden; }
        .bar i { display:block; height:100%; border-radius:2px; transition:width .3s; }
        .bar i.green { background:var(--green); } .bar i.yellow { background:var(--yellow); } .bar i.red { background:var(--red); }
        .body { padding:12px 6px 4px; display:none; } .body.open { display:block; }
        .stack { display:grid; gap:8px; }
        .tip { font-size:13px; line-height:1.45; opacity:.7; padding:2px 8px 10px; }
        .meta { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; font-size:12px; opacity:.55; padding:0 8px 10px; }
        .summary { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:2px 6px 8px; }
        .summary .n { font-size:13px; opacity:.6; }
        .summary .btn { height:38px; font-size:13px; }
        @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
      </style>
      <div class="list">
        ${plants.length && c.summary !== false ? `<div class="summary"><div class="n">${due ? `${due} plante${due > 1 ? "r" : ""} trenger vann` : "Alle planter er vannet"}</div>
          ${due > 1 && !plants[0].legacy ? `<div class="btn primary press" data-all="1" tabindex="0"><ha-icon icon="mdi:watering-can"></ha-icon>Alle vannet</div>` : ""}</div>` : ""}
        ${plants.length ? plants.map((p, i) => { const s = infos[i]; const open = this._open === i;
          return `<div class="card">
            <div class="row" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0">
              <div class="icon-wrap ${s.tone === "green" ? "" : s.tone}" style="width:44px;height:44px"><ha-icon icon="${p.icon}"></ha-icon></div>
              <div class="txt"><div class="name">${KI.esc(p.name)}</div>${p.latin ? `<div class="label latin">${KI.esc(p.latin)}</div>` : ""}</div>
              <div class="due ${s.tone}"><span class="state">${s.txt}</span><span class="when">${s.last ? "vannet " + fmtDato(s.last) : ""}</span></div>
            </div>
            <div class="bar"><i class="${s.tone}" style="width:${s.pct}%"></i></div>
            <div class="body ${open ? "open" : ""}">
              ${p.tip ? `<div class="tip">${KI.esc(p.tip)}</div>` : ""}
              <div class="group">
                <div class="kv"><span class="k">Sist vannet</span><span class="v">${s.last ? fmtTid(s.last) : "—"}</span></div>
                ${s.last ? `<div class="kv"><span class="k">Neste vanning</span><span class="v">${fmtDato(new Date(s.last.getTime() + s.interval * DAG))}</span></div>` : ""}
                <ki-slider-card data-slider="${i}"></ki-slider-card>
              </div>
              <div class="btn primary press" data-water="${i}" role="button" tabindex="0" style="margin-top:8px"><ha-icon icon="mdi:watering-can"></ha-icon>Vannet nå</div>
            </div>
          </div>`; }).join("")
        : `<div class="card"><div class="empty">Fant ingen planter fra <b>KI Planter</b>.<br>Legg til integrasjonen med et sted og plantene dine – kortet finner dem selv.</div></div>`}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".row").forEach(el => { const i = +el.dataset.i; const t = () => { this._open = this._open === i ? null : i; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, t, () => KI.moreInfo(this, plants[i].entity || plants[i].last)); KI.key(el, t); });
      r.querySelectorAll("[data-water]").forEach(el => { const p = plants[+el.dataset.water];
        const run = () => { if (c.confirm && !window.confirm(`Registrere ${p.name} som vannet nå?`)) return; this._vannet(p); }; KI.bindPress(el, run); KI.key(el, run); });
      const all = r.querySelector("[data-all]");
      if (all) { const run = () => { if (c.confirm && !window.confirm("Registrere alle som trenger vann som vannet nå?")) return;
        plants.forEach((p, i) => { if (infos[i].left !== null && infos[i].left <= 0) this._vannet(p); }); }; KI.bindPress(all, run); KI.key(all, run); }
      this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { const p = plants[+el.dataset.slider];
        el.setConfig({ entity: p.interval, name: "Intervall", unit: " d", min: 1, max: p.legacy ? 45 : 60, step: 1, label_width: "90px", value_width: "56px" }); el.hass = this._hass; this._subs.push(el); });
    }

    _renderTile(plants, infos) {
      const c = this._config;
      const due = infos.filter(s => s.left !== null && s.left <= 0).length;
      const next = infos.map((s, i) => ({ s, p: plants[i] })).filter(x => x.s.left !== null).sort((a, b) => a.s.left - b.s.left)[0];
      const tone = due ? "red" : (next && next.s.left <= 1 ? "yellow" : "green");
      const label = !plants.length ? "Ingen planter" : due ? `${due} trenger vann` : next ? `${next.p.name}: ${next.s.txt.toLowerCase()}` : "Ingen registrert";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; } .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.green { background:var(--green); } .dots i.yellow { background:var(--yellow); } .dots i.red { background:var(--red); }
        .label.red { color:var(--red); opacity:1; }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${tone === "red" ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:flower-outline"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Planter")}</div><div class="label ${tone}">${KI.esc(label)}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone}"></i>`).join("")}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => plants[0] && KI.moreInfo(this, plants[0].entity || plants[0].last)); KI.key(el, () => KI.go(c));
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }
    getCardSize() { return this._config.mode === "tile" ? 2 : Math.max(1, this._plants().length) * 2; }
  }
  window.KI.define("ki-planter-card", KiPlanterCard);
  KI.register("ki-planter-card", "KI Planter", "Vanning av planter fra KI Planter: status, intervall og «vannet nå» (mode: list / tile)");
})(window.KI);
} catch (e) { console.error("ki-cards: 30-ki-planter-card feilet", e); }

/* ===== 31-ki-sovn-card ===== */
try {
/* ki-sovn-card – søvnstatus per person fra ki_sovn. mode: list | tile. Finner personene selv. */
(function (KI) {
  const OBS = { hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga" };

  class KiSovnCard extends KI.Card {
    static getStubConfig() { return { mode: "list" }; }
    setConfig(c) { this._open = c.expanded ?? null; this._cfgOpen = false; super.setConfig(c); }

    _persons() {
      const c = this._config; const h = this._hass; if (!h) return [];
      const mk = (id, p = {}) => {
        const a = (h.states[id] || { attributes: {} }).attributes;
        const prefix = p.prefix || a.prefix || id.replace(/^binary_sensor\./, "").replace(/_sover$/, "");
        return { entity: id, name: p.name || a.navn || KI.friendly(h, id).replace(/ (søvn )?sover$/i, ""), prefix,
          switch: p.switch || a.bryter || null, bedtime: p.bedtime || "", setSover: `button.${prefix}_sett_sover`, setVaaken: `button.${prefix}_sett_vaken` };
      };
      if (c.persons) return c.persons.map(p => mk(p.entity || `binary_sensor.${(p.slug || p.name).toLowerCase()}_sovn_sover`, p));
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_sovn", type: "person" });
      if (!ids.length) ids = Object.keys(h.states).filter(id => /^binary_sensor\..*_sovn_sover$/.test(id) && h.states[id].attributes.sannsynlighet !== undefined).sort();
      return ids.map(id => mk(id));
    }
    _info(p) {
      const st = this.st(p.entity);
      if (!st) return { ok: false, sover: false, pct: 0, txt: "Ikke satt opp", tone: "red", obs: [], sub: "Fant ikke " + p.entity };
      const a = st.attributes; const sover = st.state === "on"; const pending = a["venter_på"] || null;
      const pct = Math.round(a.sannsynlighet ?? 0);
      const txt = pending === "sovner" ? "Sovner" : pending === "våkner" ? "Våkner" : sover ? "Sover" : "Våken";
      const since = a.siden ? "siden " + KI.clock(a.siden) : "";
      const obs = Object.keys(OBS).map(k => ({ label: OBS[k], v: a["obs_" + k] })).filter(o => o.v !== undefined);
      const sub = [since, p.bedtime ? `legger seg ${p.bedtime}` : ""].filter(Boolean).join(" · ");
      return { ok: true, sover, pending, pct, txt, tone: pending ? "yellow" : sover ? "on" : "off", obs, puls: a.obs_puls_glattet ?? null, why: a["årsak"] || "", sub };
    }
    _key() {
      const ps = this._persons();
      return JSON.stringify([this._config, this._open, this._cfgOpen, ps.map(p => { const s = this.st(p.entity);
        const ids = Object.keys(this._hass.states).filter(id => id.includes(`.${p.prefix}_`)); return [p, s && s.state, s && s.attributes, ids.map(id => this.val(id))]; })]);
    }

    _render() {
      const c = this._config; const persons = this._persons(); const infos = persons.map(p => this._info(p));
      if (c.mode === "tile") return this._renderTile(persons, infos);
      const sovende = infos.filter(s => s.sover).length;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .list { display:grid; gap:8px; }
        .card { --ki-bg:${c.background || "var(--gray200)"}; padding:8px; }
        .row { display:flex; align-items:center; gap:12px; min-height:52px; padding-right:6px; }
        .main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer; }
        .avatar { width:44px; height:44px; border-radius:50%; background:var(--gray100); display:flex; align-items:center; justify-content:center; flex:none; --mdc-icon-size:22px; }
        .avatar.on { background:var(--active-big); color:rgba(70,58,64,.95); }
        .avatar.yellow { background:var(--yellow); color:var(--black); }
        .avatar.red { background:var(--red); color:#fff; }
        .txt { flex:1; min-width:0; } .txt .name { font-size:15px; }
        .txt .label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .txt .label.red { color:var(--red); opacity:1; }
        .right { display:flex; align-items:center; gap:10px; }
        .pill { display:flex; flex-direction:column; align-items:flex-end; line-height:1.15; }
        .pill .s { font-size:14px; font-weight:600; } .pill .s.yellow { color:var(--yellow); } .pill .s.off { opacity:.6; }
        .pill .p { font-size:11px; opacity:.5; font-variant-numeric:tabular-nums; }
        .bar { position:relative; height:4px; border-radius:2px; background:var(--gray100); margin:6px 8px 2px; }
        .bar i { display:block; height:100%; border-radius:2px; background:var(--gray400); transition:width .4s; }
        .bar i.on { background:var(--active-big); } .bar i.yellow { background:var(--yellow); }
        .bar b { position:absolute; top:-3px; width:2px; height:10px; border-radius:1px; background:var(--gray1000); opacity:.35; }
        .body { display:none; padding:10px 2px 2px; } .body.open { display:grid; gap:8px; }
        .chips { display:flex; flex-wrap:wrap; gap:6px; padding:0 4px; }
        .chip.no { opacity:.45; text-decoration:line-through; } .chip.num { opacity:1; font-variant-numeric:tabular-nums; }
        .why { font-size:12px; opacity:.55; padding:0 6px; }
        .times { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; padding:4px 6px 8px; }
        .tm { display:flex; flex-direction:column; gap:4px; font-size:11px; opacity:.85; } .tm span { opacity:.7; padding-left:2px; } .tm input { width:100%; }
        .summary { display:flex; justify-content:space-between; align-items:center; padding:2px 8px 8px; font-size:13px; opacity:.6; }
        @media (prefers-reduced-motion: reduce) { .bar i { transition:none; } }
      </style>
      <div class="list">
        ${persons.length && c.summary !== false ? `<div class="summary"><span>${sovende === 0 ? "Alle er våkne" : sovende === persons.length ? "Alle sover" : `${sovende} av ${persons.length} sover`}</span></div>` : ""}
        ${persons.length ? persons.map((p, i) => { const s = infos[i]; const open = this._open === i; const thr = this._thr(p);
          return `<div class="card">
            <div class="row">
              <div class="main" data-i="${i}" role="button" aria-expanded="${open}" tabindex="0">
                <div class="avatar ${s.tone === "off" ? "" : s.tone}"><ha-icon icon="${!s.ok ? "mdi:help" : s.sover ? "mdi:sleep" : "mdi:white-balance-sunny"}"></ha-icon></div>
                <div class="txt"><div class="name">${KI.esc(p.name)}</div><div class="label ${s.ok ? "" : "red"}">${KI.esc(s.sub)}</div></div>
              </div>
              <div class="right">
                <div class="pill"><span class="s ${s.tone}">${s.txt}${s.pending ? " …" : ""}</span>${s.ok ? `<span class="p">${s.pct} %</span>` : ""}</div>
                <div class="sw ${s.sover ? "on" : ""} ${s.ok ? "" : "disabled"}" data-sw="${i}" role="switch" aria-checked="${s.sover}" tabindex="0" title="${s.sover ? "Sett våken" : "Sett sover"}"><i></i></div>
              </div>
            </div>
            ${s.ok ? `<div class="bar"><i class="${s.tone === "off" ? "" : s.tone}" style="width:${s.pct}%"></i><b style="left:${thr}%"></b></div>` : ""}
            <div class="body ${open ? "open" : ""}">
              ${s.ok ? `<div class="chips">${s.obs.map(o => `<span class="chip ${o.v === true ? "on" : o.v === false ? "no" : ""}">${o.label}</span>`).join("")}
                ${s.puls !== null ? `<span class="chip num">${s.puls} bpm</span>` : ""}</div>
                ${s.why ? `<div class="why">Sist endret: ${KI.esc(s.why)}</div>` : ""}` : `<div class="empty">Personen finnes ikke i <b>KI Søvn &amp; Vekking</b>. Sjekk Innstillinger → Enheter og tjenester → KI Søvn &amp; Vekking, og at enheten heter «${KI.esc(p.name)} søvn».</div>`}
              ${s.ok && c.settings !== false ? this._settingsHtml(p, s, i) : ""}
            </div>
          </div>`; }).join("")
        : `<div class="card"><div class="empty">Fant ingen personer fra <b>KI Søvn &amp; Vekking</b>.<br>Legg til «Person – søvndeteksjon» i integrasjonen – kortet finner dem selv.</div></div>`}
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".main").forEach(el => { const i = +el.dataset.i; const t = () => { this._open = this._open === i ? null : i; this._cfgOpen = false; this._lastKey = null; this._maybeRender(); };
        KI.bindPress(el, t, () => KI.moreInfo(this, persons[i].entity)); KI.key(el, t); });
      r.querySelectorAll(".sw").forEach(el => { const p = persons[+el.dataset.sw]; const s = infos[+el.dataset.sw];
        const run = () => { if (this.st(p.setSover)) KI.press(this._hass, s.sover ? p.setVaaken : p.setSover); else if (p.switch) KI.toggle(this._hass, p.switch); };
        KI.bindPress(el, run, () => KI.moreInfo(this, p.switch || p.entity)); KI.key(el, run); });
      const d = r.querySelector(".disclosure"); if (d) { const t = () => { this._cfgOpen = !this._cfgOpen; this._lastKey = null; this._maybeRender(); }; d.addEventListener("click", t); KI.key(d, t); }
      this._wireSettings();
    }
    _thr(p) { const s = this.st(`number.${p.prefix}_terskel`); return s ? parseFloat(s.state) : (this._config.threshold ?? 80); }

    _settingsHtml(p, s, i) {
      const x = p.prefix; if (!this.st(`number.${x}_terskel`)) return "";
      const open = this._cfgOpen;
      const t = (id, lbl) => this.st(id) ? `<label class="tm"><span>${lbl}</span><input type="time" data-time="${id}" value="${KI.hhmm(this.val(id))}"></label>` : "";
      const sl = (id, name) => this.st(id) ? `<ki-slider-card data-slider="${id}" data-name="${name}"></ki-slider-card>` : "";
      const tg = (id, name, label, icon) => this.st(id) ? `<ki-toggle-card data-toggle-card="${id}" data-name="${name}" data-label="${label}" data-icon="${icon}"></ki-toggle-card>` : "";
      const hasHr = s.puls !== null || s.obs.some(o => o.label === "lav puls");
      return `<div class="disclosure ${open ? "open" : ""}" role="button" tabindex="0"><span class="name">Innstillinger</span><ha-icon icon="mdi:chevron-down"></ha-icon></div>
      ${open ? `
        <div class="group"><div class="section">Tider</div>
          <div class="times">${t(`time.${x}_sovevindu_start`, "Sovevindu fra")}${t(`time.${x}_sovevindu_slutt`, "Sovevindu til")}${t(`time.${x}_morgen_fra`, "Morgen fra")}</div></div>
        <div class="group"><div class="section">Terskler</div>
          ${sl(`number.${x}_terskel`, "Terskel")}${sl(`number.${x}_forsinkelse_sovner`, "Sovner etter")}${sl(`number.${x}_forsinkelse_vakner`, "Våkner etter")}
          ${sl(`number.${x}_hold_i_rommet`, "Hold i rommet")}${sl(`number.${x}_borte_fra_rommet_vaken`, "Borte = våken")}${sl(`number.${x}_dor_lukket_i`, "Dør lukket i")}
          ${hasHr ? sl(`number.${x}_puls_sover`, "Puls sover") + sl(`number.${x}_puls_vaken`, "Puls våken") : ""}</div>
        <div class="group"><div class="section">Regler</div>
          ${tg(`switch.${x}_dor_om_natta_ok`, "Dør om natta", "Do-turer vekker ikke", "mdi:door-open")}
          ${tg(`switch.${x}_automatisk`, "Automatisk", "Styrer søvnbryteren", "mdi:auto-fix")}</div>` : ""}`;
    }
    _wireSettings() {
      const r = this.shadowRoot; const h = this._hass; this._subs = [];
      r.querySelectorAll("ki-slider-card").forEach(el => { el.setConfig({ entity: el.dataset.slider, name: el.dataset.name, label_width: "112px", value_width: "64px" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("ki-toggle-card").forEach(el => { el.setConfig({ entity: el.dataset.toggleCard, name: el.dataset.name, label: el.dataset.label, icon: el.dataset.icon, background: "transparent" }); el.hass = h; this._subs.push(el); });
      r.querySelectorAll("input[type=time]").forEach(inp => inp.addEventListener("change", () => { if (inp.value) h.callService("time", "set_value", { entity_id: inp.dataset.time, time: inp.value + ":00" }); }));
    }
    _passHass(h) { (this._subs || []).forEach(el => el.hass = h); }

    _renderTile(persons, infos) {
      const c = this._config;
      const sovende = persons.filter((p, i) => infos[i].sover).map(p => p.name);
      const pi = infos.findIndex(s => s.pending);
      const label = pi >= 0 ? `${persons[pi].name} ${infos[pi].txt.toLowerCase()} …` : !persons.length ? "Ingen personer" : sovende.length === 0 ? "Alle er våkne" : sovende.length === persons.length ? "Alle sover" : sovende.join(", ") + " sover";
      this.shadowRoot.innerHTML = `<style>${KI.css}
        .card { --ki-bg:${c.background || "var(--gray200)"}; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 14px 12px; min-height:96px; }
        .bottom { display:flex; width:100%; justify-content:space-between; align-items:flex-end; gap:8px; }
        .dots { display:flex; gap:4px; padding-bottom:3px; } .dots i { width:8px; height:8px; border-radius:50%; background:var(--gray400); }
        .dots i.on { background:var(--active-big); } .dots i.yellow { background:var(--yellow); }
      </style>
      <div class="card press" role="button" tabindex="0">
        <div class="icon-wrap ${sovende.length ? "on" : ""}"><ha-icon icon="${c.icon || "mdi:sleep"}"></ha-icon></div>
        <div class="bottom"><div><div class="name">${KI.esc(c.name || "Søvn")}</div><div class="label">${KI.esc(label)}</div></div>
          <div class="dots">${infos.map(s => `<i class="${s.tone === "off" ? "" : s.tone}" title="${s.txt}"></i>`).join("")}</div></div>
      </div>`;
      const el = this.shadowRoot.querySelector(".card");
      KI.bindPress(el, () => KI.go(c), () => persons[0] && KI.moreInfo(this, persons[0].entity)); KI.key(el, () => KI.go(c));
    }
    getCardSize() { return this._config.mode === "tile" ? 2 : Math.max(1, this._persons().length) * 2; }
  }
  window.KI.define("ki-sovn-card", KiSovnCard);
  KI.register("ki-sovn-card", "KI Søvn", "Søvnstatus per person fra KI Søvn & Vekking");
})(window.KI);
} catch (e) { console.error("ki-cards: 31-ki-sovn-card feilet", e); }

/* ===== 40-ki-sovn-pro-card ===== */
try {
/* ki-sovn-pro-card – søvn for husstanden i ki-energi/klima-pro-stil. Finner personene fra ki_sovn selv. */
(function (KI) {
  const OBS = { hjemme: "hjemme", sovevindu: "sovevindu", i_rommet: "i rommet", "dør_lukket": "dør lukket",
    "vindu_åpent": "vindu åpent", puls_lav: "lav puls", "puls_høy": "høy puls", i_senga: "i senga" };

  class KiSovnProCard extends KI.Card {
    static getStubConfig() { return { title: "Søvn og vekking" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _persons() {
      const c = this._config, h = this._hass; if (!h) return [];
      let ids = c.persons ? c.persons.map(p => p.entity || p) : KI.find(h, "binary_sensor", { integrasjon: "ki_sovn", type: "person" });
      if (!ids.length) ids = Object.keys(h.states).filter(id => /^binary_sensor\..*_sovn_sover$/.test(id)).sort();
      return ids.map((id, i) => { const a = (h.states[id] || { attributes: {} }).attributes; const p = (c.persons && typeof c.persons[i] === "object") ? c.persons[i] : {};
        const prefix = a.prefix || id.replace(/^binary_sensor\./, "").replace(/_sover$/, "");
        return { entity: id, prefix, name: p.name || a.navn || KI.friendly(h, id).replace(/ (søvn )?sover$/i, ""), bedtime: p.bedtime || "", bryter: a.bryter,
          setSover: `button.${prefix}_sett_sover`, setVaaken: `button.${prefix}_sett_vaken` }; });
    }
    _info(p) {
      const st = this.st(p.entity); if (!st) return { ok: false, tone: "feil", txt: "Ikke satt opp", sub: "finnes ikke i integrasjonen", pct: 0, obs: [] };
      const a = st.attributes, sover = st.state === "on", pending = a["venter_på"] || null, pct = Math.round(a.sannsynlighet ?? 0);
      const txt = pending === "sovner" ? "Sovner …" : pending === "våkner" ? "Våkner …" : sover ? "Sover" : "Våken";
      const sub = [a.siden ? "siden " + KI.clock(a.siden) : "", p.bedtime ? "legger seg " + p.bedtime : ""].filter(Boolean).join(" · ");
      return { ok: true, sover, pending, pct, txt, sub, tone: pending ? "advarsel" : sover ? "aktiv" : "nøytral", why: a["årsak"] || "", puls: a.obs_puls_glattet ?? null,
        obs: Object.keys(OBS).map(k => ({ l: OBS[k], v: a["obs_" + k] })).filter(o => o.v !== undefined) };
    }
    _vekking() { const c = this._config; if (c.vekking === false) return []; return c.vekking_prefix ? [c.vekking_prefix] : KI.vekkingPrefixes(this._hass); }
    _key() { const ps = this._persons(); const vk = this._vekking(); return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 60000), ps.map(p => { const s = this.st(p.entity);
      return [p, s && s.state, s && s.attributes, Object.keys(this._hass.states).filter(id => id.includes(`.${p.prefix}_`)).map(id => this.val(id))]; }),
      vk.map(p => Object.keys(this._hass.states).filter(id => id.includes(`.${p}_`)).map(id => [this.val(id), this.st(id).attributes]))]); }

    _render() {
      const c = this._config, persons = this._persons(), infos = persons.map(p => this._info(p));
      const n = persons.length, sov = infos.filter(s => s.sover).length, pend = infos.find(s => s.pending);
      const navn = !n ? "Ingen personer" : sov === 0 ? "Alle er våkne" : sov === n ? "Alle sover" : `${sov} av ${n} sover`;
      const forkl = pend ? `${persons[infos.indexOf(pend)].name} ${pend.txt.toLowerCase()}` : infos.map((s, i) => s.ok ? `${persons[i].name}: ${s.txt.toLowerCase()}${s.sub.startsWith("siden") ? " " + s.sub.split(" · ")[0] : ""}` : `${persons[i].name}: ikke satt opp`).join(" · ");
      const ringCls = !n ? "av" : sov === n ? "aktiv" : sov ? "gul" : "av";
      const vks = this._vekking().map(p => KI.vekkingInfo(this, p));
      const vkTxt = vks.filter(v => v.n).map(v => v.running ? `${v.name}: ${v.navn.toLowerCase()}` : v.masterOn && v.tid ? `Vekking ${v.navn.replace(/^I dag/, "i dag").replace(/^([A-ZÆØÅ])/, m => m.toLowerCase())}${v.igjen ? " (om " + v.igjen + ")" : ""}` : "Vekking av").join(" · ");
      this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero"><div class="${sov ? "pust" : ""}">${KI.ringHtml(n ? (sov / n) * 100 : 0, `${sov}<span>/${n}</span>`, ringCls, persons[0] && persons[0].entity)}</div>
          <div><div class="hero-navn">${KI.esc(navn)}</div><div class="hero-forklaring">${KI.esc(forkl)}${vkTxt ? `<br>${KI.esc(vkTxt)}` : ""}</div></div></div>
        <div class="switch" role="tablist"><div class="switch-valg ${this._view === "enkel" ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${this._view === "avansert" ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        <div class="blokk"><div class="blokk-hode"><span>Personer</span><span class="blokk-sub">${n ? "trykk for detaljer" : ""}</span></div>
          ${n ? persons.map((p, i) => this._person(p, infos[i])).join("") : `<div class="tom">Fant ingen personer fra <b>KI Søvn &amp; Vekking</b>. Legg til «Person – søvndeteksjon» i integrasjonen.</div>`}
        </div>
        ${n && c.graf !== false ? `<div class="blokk"><div class="blokk-hode"><span>Siste ${c.hours || 24} timer</span><span class="blokk-sub">hvem sov når</span></div>${this._natt(persons, infos, c.hours || 24)}</div>` : ""}
        ${vks.filter(v => v.n).map(v => KI.vekkingBlocks(this, v, this._view === "avansert", c)).join("")}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
      this._loadHist(persons);
    }
    /* Tidslinje per person: bånd der personen sov */
    _natt(persons, infos, hours) {
      const W = 320, rowH = 22, L = 70, now = Date.now(), t0 = now - hours * 3600000;
      const x = (t) => L + ((Math.max(t0, Math.min(now, t)) - t0) / (now - t0)) * (W - L - 4);
      const rows = persons.map((p, i) => { const h = ((this._hist || {})[p.prefix] || {})[p.entity] || [];
        const bands = []; let on = null; h.forEach(([t, st]) => { if (st === "on" && on === null) on = t; if (st !== "on" && on !== null) { bands.push([on, t]); on = null; } }); if (on !== null) bands.push([on, now]);
        const y = 6 + i * rowH; const tot = bands.reduce((a, [s, e]) => a + (e - s), 0) / 3600000;
        return `<text x="0" y="${y + 13}">${KI.esc(p.name)}</text><rect x="${L}" y="${y + 3}" width="${W - L - 4}" height="12" rx="6" fill="rgba(128,128,128,.14)"></rect>
          ${bands.map(([a, b]) => `<rect class="sover gronn" style="opacity:.85" x="${x(a).toFixed(1)}" y="${y + 3}" width="${Math.max(2, x(b) - x(a)).toFixed(1)}" height="12" rx="6"></rect>`).join("")}
          <text x="${W}" y="${y + 13}" text-anchor="end" style="opacity:.8">${tot ? (tot >= 1 ? tot.toFixed(1) + " t" : Math.round(tot * 60) + " min") : ""}</text>`; });
      const H = 6 + persons.length * rowH + 14;
      const ticks = []; for (let h = 0; h <= hours; h += hours / 4) { const t = t0 + h * 3600000; ticks.push(`<text x="${x(t).toFixed(1)}" y="${H - 2}" text-anchor="${h === 0 ? "start" : h === hours ? "end" : "middle"}">${new Date(t).getHours().toString().padStart(2, "0")}</text>`); }
      return `<svg class="graf" viewBox="0 0 ${W} ${H}" style="height:${H}px">${rows.join("")}${ticks.join("")}</svg>`;
    }
    _loadHist(persons) {
      if (!persons.length || this._config.graf === false) return;
      const ids = persons.flatMap(p => [p.entity, `sensor.${p.prefix}_sannsynlighet`]);
      const before = this._histStamp;
      KI.history(this._hass, ids, this._config.hours || 24).then(data => {
        const stamp = JSON.stringify(Object.keys(data).map(k => [k, data[k].length]));
        this._hist = {}; persons.forEach(p => { this._hist[p.prefix] = { [p.entity]: data[p.entity], [`sensor.${p.prefix}_sannsynlighet`]: data[`sensor.${p.prefix}_sannsynlighet`] }; });
        if (stamp !== before) { this._histStamp = stamp; this._lastKey = null; this._maybeRender(); }
      });
    }
    _person(p, s) {
      const open = this._apen === p.entity, x = p.prefix, adv = this._view === "avansert";
      const toggleId = this.st(p.setSover) ? (s.sover ? p.setVaaken : p.setSover) : null;
      const bryter = toggleId ? `<div class="bryter ${s.sover ? "on" : ""}" data-press="${toggleId}" role="switch" aria-checked="${s.sover}" tabindex="0"><span></span></div>`
        : p.bryter ? `<div class="bryter ${s.sover ? "on" : ""}" data-toggle="${p.bryter}" role="switch" tabindex="0"><span></span></div>` : `<div class="bryter mangler"><span></span></div>`;
      const t = (id, lbl) => this.st(id) ? `<div class="rad"><span class="rad-navn">${lbl}</span><input type="time" data-time="${id}" value="${KI.hhmm(this.val(id))}"></div>` : "";
      const sw = (id, lbl, sub) => this.st(id) ? `<div class="rad"><div><div class="rad-navn">${lbl}</div><div class="rad-sub">${sub}</div></div><div class="bryter ${this.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>` : "";
      const sl = (id, lbl, sub, o = {}) => KI.stepperHtml(this._hass, id, lbl, { sub, ...o });
      const thr = this.st(`number.${x}_terskel`) ? parseFloat(this.val(`number.${x}_terskel`)) : 80;
      const hist = (this._hist || {})[p.prefix] || {};
      return `<div class="last ${open ? "apen" : ""}">
        <div class="last-hode med-bryter" data-open="${p.entity}" style="grid-template-columns:40px 1fr auto auto">
          <div class="avatar ${s.sover ? "sover pust" : s.ok ? "vaken" : "feil"} ${s.pending ? "blink" : ""}"><ha-icon icon="${!s.ok ? "mdi:help" : s.sover ? "mdi:sleep" : "mdi:white-balance-sunny"}"></ha-icon>${s.sover ? `<div class="zzz"><span>z</span><span>z</span><span>z</span></div>` : ""}</div>
          <div><div class="last-navn">${KI.esc(p.name)}</div><div class="last-forklaring">${KI.esc(s.sub)}</div></div>
          <div class="last-verdi">${s.txt}${s.ok ? `<small>${s.pct} %</small>` : ""}</div>
          ${bryter}
        </div>
        <div class="last-kropp">
          ${s.ok ? `<div class="spor"><div class="fyll ${s.tone === "advarsel" ? "gul" : s.sover ? "" : "gronn"}" style="width:${s.pct}%;${s.sover || s.pending ? "" : "opacity:.5"}"></div><div class="strek" style="left:${thr}%"></div></div>
            <div class="under"><span>sannsynlighet ${s.pct} %</span><span>terskel ${thr} %</span></div>
            ${KI.sovnGraf(hist[`sensor.${x}_sannsynlighet`], hist[p.entity], thr, this._config.hours || 24)}
            <div class="tegnforklaring"><span><i style="background:var(--active-big);opacity:.4"></i>sov</span><span><i style="background:var(--active-big)"></i>sannsynlighet</span><span><i style="background:var(--yellow)"></i>terskel</span></div>
            <div class="last-fakta" style="padding-top:8px">${s.obs.map(o => `<span class="${o.v === true ? "b-ok" : o.v === false ? "b-nei" : ""}">${o.l}</span>`).join("")}${s.puls !== null ? `<span>${s.puls} bpm</span>` : ""}</div>
            ${s.why ? `<div class="notat" style="padding-top:0">Sist endret: ${KI.esc(s.why)}</div>` : ""}
            ${adv ? `<div class="blokk-hode"><span>Tider</span></div>${t(`time.${x}_sovevindu_start`, "Sovevindu fra")}${t(`time.${x}_sovevindu_slutt`, "Sovevindu til")}${t(`time.${x}_morgen_fra`, "Morgen fra")}
              <div class="blokk-hode"><span>Terskler</span></div>${sl(`number.${x}_terskel`, "Terskel", "Sannsynlighet som regnes som «sover»", { tick: s.pct, tone: s.pct >= thr ? "" : "gul" })}${sl(`number.${x}_forsinkelse_sovner`, "Sovner etter", "Over terskel så lenge før «sover»")}${sl(`number.${x}_forsinkelse_vakner`, "Våkner etter", "Under terskel så lenge før «våken»")}${sl(`number.${x}_hold_i_rommet`, "Hold i rommet", "Etter siste bevegelse")}${sl(`number.${x}_borte_fra_rommet_vaken`, "Borte = våken", "Borte fra rommet så lenge")}${sl(`number.${x}_dor_lukket_i`, "Dør lukket i", "Før døra teller som stengt")}${s.puls !== null ? sl(`number.${x}_puls_sover`, "Puls sover", "Glattet puls under dette", { tick: s.puls }) + sl(`number.${x}_puls_vaken`, "Puls våken", "Puls over dette", { tick: s.puls }) : ""}
              <div class="blokk-hode"><span>Regler</span></div>${sw(`switch.${x}_dor_om_natta_ok`, "Dør om natta OK", "Do-turer vekker ikke")}${sw(`switch.${x}_automatisk`, "Automatisk", "Styrer søvnbryteren")}` : ""}`
          : `<div class="tom">Personen finnes ikke i KI Søvn &amp; Vekking. Sjekk at oppføringen «${KI.esc(p.name)}» finnes og har entiteten <code>${p.entity}</code>.</div>`}
        </div></div>`;
    }
    getCardSize() { return 3 + this._persons().length * 2; }
  }
  window.KI.define("ki-sovn-pro-card", KiSovnProCard);
  KI.register("ki-sovn-pro-card", "KI Søvn Pro", "Søvn og vekking i ett kort: status per person, sannsynlighet, observasjoner, innstillinger og vekkealarm(er)");
})(window.KI);
} catch (e) { console.error("ki-cards: 40-ki-sovn-pro-card feilet", e); }

/* ===== 41-ki-vekking-pro-card ===== */
try {
/* ki-vekking-pro-card – vekkealarm i ki-energi/klima-pro-stil. Finner alarmen fra ki_sovn (type vekking) selv; prefix: for å velge. */
(function (KI) {
  const DAGER = [["mandag", "Ma", "Mandag"], ["tirsdag", "Ti", "Tirsdag"], ["onsdag", "On", "Onsdag"], ["torsdag", "To", "Torsdag"], ["fredag", "Fr", "Fredag"], ["lordag", "Lø", "Lørdag"], ["sondag", "Sø", "Søndag"]];
  const idag = () => { const j = new Date().getDay(); return DAGER[j === 0 ? 6 : j - 1][0]; };

  /* Samler status for én vekkealarm (brukes av ki-vekking-pro-card og ki-sovn-pro-card) */
  KI.vekkingInfo = (card, p) => {
    const e = { master: `switch.${p}_aktiv`, natt: `switch.${p}_nattlampe`, vekk: `switch.${p}_vekk_person`, bare: `switch.${p}_bare_hvis_sover`, fade: `number.${p}_fade_opp`, off: `number.${p}_av_etter`,
      neste: `sensor.${p}_neste_alarm`, kjorer: `binary_sensor.${p}_kjorer`, test: `button.${p}_test`, stopp: `button.${p}_stopp`, dayOn: d => `switch.${p}_${d}_aktiv`, dayTime: d => `time.${p}_${d}` };
    const n = card.st(e.neste), a = (n && n.attributes) || {};
    const masterOn = card.on(e.master), running = card.on(e.kjorer), fase = (card.st(e.kjorer) || { attributes: {} }).attributes.fase;
    const tid = n && n.state !== "Av" ? n.state : null;
    const when = a.neste_tidspunkt ? new Date(a.neste_tidspunkt) : null;
    const igjenMin = when ? Math.max(0, Math.round((when - Date.now()) / 60000)) : null;
    const igjen = igjenMin === null ? "" : igjenMin >= 60 ? `${Math.floor(igjenMin / 60)} t ${igjenMin % 60} min` : `${igjenMin} min`;
    const erIdag = when && when.toDateString() === new Date().toDateString();
    const navn = running ? (fase === "fader" ? "Fader opp lyset" : "Lyset er på") : !masterOn ? "Vekking er av" : !tid ? "Ingen dager valgt" : `${erIdag ? "I dag" : a.neste_dag} kl. ${tid}`;
    const skip = masterOn && a.hopper_over ? (a.hopper_over === "betingelser" ? "Hoppes over: en betingelse er av." : "Hoppes over: personen er våken.") : "";
    const person = a.person ? `${KI.friendly(card._hass, a.person).replace(/ (søvn )?sover$/i, "")} ${a.person_sover ? "sover" : a.person_sover === false ? "er våken" : ""}` : "";
    const forkl = running ? `Startet ${a.sist_kjort ? KI.clock(a.sist_kjort) : ""} · fader ${card.val(e.fade)} min, av etter ${card.val(e.off)} min` : [skip, igjen ? `om ${igjen}` : "", person].filter(Boolean).join(" · ") || "Sett ukedager og tider under.";
    const ringPct = igjenMin === null ? 0 : Math.max(0, Math.min(100, 100 - (igjenMin / (24 * 60)) * 100));
    const ringCls = running ? "gul" : !masterOn ? "av" : skip ? "rod" : "aktiv";
    return { p, e, a, n, masterOn, running, fase, tid, igjen, navn, forkl, skip, person, ringPct, ringCls, name: a.navn || p };
  };
  /* Blokkene (uten hero/switch) for én vekkealarm */
  KI.vekkingBlocks = (card, v, adv, c = {}) => {
    const { e, a, masterOn, running } = v; const conds = a.betingelser || [];
    const sw = (id, lbl, sub) => card.st(id) ? `<div class="rad"><div><div class="rad-navn">${lbl}</div>${sub ? `<div class="rad-sub">${sub}</div>` : ""}</div><div class="bryter ${card.on(id) ? "on" : ""}" data-toggle="${id}" tabindex="0"><span></span></div></div>` : "";
    return `<div class="blokk">
        <div class="blokk-hode"><span>${KI.esc(c.vekking_title || "Vekking" + (v.name && v.name !== "Vekking" ? " · " + v.name : ""))}</span><span class="blokk-sub">${running ? "kjører" : masterOn ? (v.tid ? `neste ${v.tid}` : "på") : "av"}</span></div>
        ${sw(e.master, "Aktiv", v.forkl && !running ? v.forkl : "Hovedbryter for alle dager")}
        <div class="blokk-hode"><span>Ukeplan</span><span class="blokk-sub">trykk en dag for å slå av/på</span></div>
        <div class="dager">${DAGER.map(([d, k, full]) => `<div class="dag ${card.on(e.dayOn(d)) ? "on" : ""} ${d === idag() ? "idag" : ""}" data-toggle="${e.dayOn(d)}" title="${full}" role="switch" tabindex="0">${k}</div>`).join("")}</div>
        ${DAGER.map(([d, , full]) => `<div class="rad ${card.on(e.dayOn(d)) ? "" : "dim"}"><span class="rad-navn">${full}</span><input type="time" data-time="${e.dayTime(d)}" value="${KI.hhmm(card.val(e.dayTime(d)))}"></div>`).join("")}
        ${c.test === false ? "" : `<div class="knapper">
          ${running ? `<div class="knapp fjern press" data-press="${e.stopp}" tabindex="0">Stopp og slukk</div>` : ""}
          <div class="knapp ${running ? "" : "primar"} press" data-press="${e.test}" data-confirm="${c.test_confirm || "Kjøre vekkesekvensen nå?"}" tabindex="0">${running ? "Kjører …" : "Test vekkesekvensen"}</div></div>`}
      </div>
      ${adv ? `<div class="blokk"><div class="blokk-hode"><span>Lys</span><span class="blokk-sub">${(a.lys || []).length} lys</span></div>
        ${KI.stepperHtml(card._hass, e.fade, "Fade opp", { sub: "Minutter fra svakt til fullt lys" })}${KI.stepperHtml(card._hass, e.off, "Av etter", { sub: "Minutter før lyset slukkes" })}${sw(e.natt, "Nattlampe", "Ta med i vekkingen")}
        ${(a.lys || []).length ? `<div class="last-fakta" style="padding-top:8px">${a.lys.map(id => `<span data-more="${id}" style="cursor:pointer">${KI.esc(KI.friendly(card._hass, id))}</span>`).join("")}</div>` : ""}</div>
      ${a.person ? `<div class="blokk"><div class="blokk-hode"><span>Person</span><span class="blokk-sub">${KI.esc(v.person)}</span></div>
        ${sw(e.vekk, "Vekk person", "Marker som våken når lyset er oppe")}${sw(e.bare, "Bare hvis sover", "Hopp over alarmen hvis personen er våken")}</div>` : ""}
      ${conds.length ? `<div class="blokk"><div class="blokk-hode"><span>Betingelser</span><span class="blokk-sub">alle må være på</span></div>
        ${conds.map(id => `<div class="rad" data-more="${id}" style="cursor:pointer"><span class="rad-navn">${KI.esc((c.condition_names || {})[id] || KI.friendly(card._hass, id))}</span><span class="last-fakta" style="padding:0"><span class="${card.on(id) ? "b-ok" : "b-feil"}">${card.on(id) ? "På" : "Av"}</span></span></div>`).join("")}</div>` : ""}
      ${a.sist_kjort || a.sist_hoppet_over ? `<div class="blokk"><div class="blokk-hode"><span>Logg</span></div>
        ${a.sist_kjort ? `<div class="rad"><span class="rad-navn">Sist kjørt</span><span class="rad-verdi">${new Date(a.sist_kjort).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>` : ""}
        ${a.sist_hoppet_over ? `<div class="rad"><span class="rad-navn">Sist hoppet over</span><span class="rad-verdi">${KI.esc(a.sist_hoppet_over)}</span></div>` : ""}</div>` : ""}` : ""}`;
  };
  KI.vekkingPrefixes = (hass) => { const ids = KI.find(hass, "sensor", { integrasjon: "ki_sovn", type: "vekking" }); if (ids.length) return ids.map(id => hass.states[id].attributes.prefix);
    return Object.keys(hass ? hass.states : {}).filter(id => /^sensor\..*_vekking_neste_alarm$/.test(id)).map(id => id.slice(7, -12)); };

  class KiVekkingProCard extends KI.Card {
    static getStubConfig() { return { title: "Vekking" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _prefix() {
      const c = this._config; if (c.prefix) return c.prefix;
      const hit = KI.find(this._hass, "sensor", { integrasjon: "ki_sovn", type: "vekking" })[0]; if (hit) return this.st(hit).attributes.prefix;
      const old = Object.keys(this._hass ? this._hass.states : {}).find(id => /^sensor\..*_vekking_neste_alarm$/.test(id)); return old ? old.slice(7, -12) : null;
    }
    _ids(p) { return { master: `switch.${p}_aktiv`, natt: `switch.${p}_nattlampe`, vekk: `switch.${p}_vekk_person`, bare: `switch.${p}_bare_hvis_sover`, fade: `number.${p}_fade_opp`, off: `number.${p}_av_etter`,
      neste: `sensor.${p}_neste_alarm`, kjorer: `binary_sensor.${p}_kjorer`, test: `button.${p}_test`, stopp: `button.${p}_stopp`, dayOn: d => `switch.${p}_${d}_aktiv`, dayTime: d => `time.${p}_${d}` }; }
    _key() { const p = this._prefix(); if (!p) return JSON.stringify([this._config, "none"]); const e = this._ids(p);
      const ids = [e.master, e.natt, e.vekk, e.bare, e.fade, e.off, e.neste, e.kjorer, ...DAGER.flatMap(([d]) => [e.dayOn(d), e.dayTime(d)])];
      const n = this.st(e.neste); return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 60000), ids.map(id => this.val(id)), n && n.attributes, (this.st(e.kjorer) || {}).attributes, ((n && n.attributes.betingelser) || []).map(id => this.val(id))]); }

    _render() {
      const c = this._config, p = this._prefix();
      if (!p) { this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap"><div class="blokk"><div class="tom">Fant ingen vekkealarm fra <b>KI Søvn &amp; Vekking</b>. Legg til «Vekkealarm» i integrasjonen, eller sett <code>prefix:</code>.</div></div></div>`; return; }
      const v = KI.vekkingInfo(this, p), adv = this._view === "avansert";
      this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero">${KI.ringHtml(v.ringPct, v.tid && v.masterOn ? v.tid : "Av", v.ringCls, v.e.neste)}
          <div><div class="hero-navn">${KI.esc(v.navn)}${v.running ? ` <span class="merke gul">kjører</span>` : ""}</div><div class="hero-forklaring">${KI.esc(v.forkl)}</div></div></div>
        <div class="switch" role="tablist"><div class="switch-valg ${!adv ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${adv ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        ${KI.vekkingBlocks(this, v, adv, c)}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
    }
    getCardSize() { return 8; }
  }
  window.KI.define("ki-vekking-pro-card", KiVekkingProCard);
  KI.register("ki-vekking-pro-card", "KI Vekking Pro", "Vekkealarm: neste alarm, ukeplan, lys, person, betingelser og logg");
})(window.KI);
} catch (e) { console.error("ki-cards: 41-ki-vekking-pro-card feilet", e); }

/* ===== 42-ki-planter-pro-card ===== */
try {
/* ki-planter-pro-card – planter i ki-energi/klima-pro-stil. Finner plantene fra ki_planter selv; sted: filtrerer. */
(function (KI) {
  const DAG = 86400000;
  const fmtDato = d => d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  class KiPlanterProCard extends KI.Card {
    static getStubConfig() { return { title: "Planter" }; }
    setConfig(c) { this._view = c.view || "enkel"; this._apen = null; super.setConfig(c); }
    _plants() {
      const c = this._config, h = this._hass; if (!h) return [];
      let ids = KI.find(h, "binary_sensor", { integrasjon: "ki_planter", type: "plante" });
      if (c.sted) { const q = String(c.sted).toLowerCase(); ids = ids.filter(id => String(h.states[id].attributes.sted || "").toLowerCase().includes(q)); }
      return ids.map(id => { const a = h.states[id].attributes, b = id.replace(/^binary_sensor\./, "").replace(/_trenger_vann$/, "");
        const last = a.sist_vannet ? new Date(a.sist_vannet) : null, iv = a.intervall_dager || 7;
        const left = last ? Math.ceil(iv - (Date.now() - last) / DAG) : null, pct = last ? Math.min(100, Math.max(0, (Date.now() - last) / DAG / iv * 100)) : 100;
        const due = h.states[id].state === "on"; const fukt = a.fuktighet ?? null;
        let tone = due ? "feil" : left === 0 || pct >= 70 ? "advarsel" : "ok";
        let txt = a.grunn === "tørr jord" ? `Tørr jord ${fukt !== null ? Math.round(fukt) + " %" : ""}` : left === null ? "Ikke vannet" : due ? (left < 0 ? `${-left} ${-left === 1 ? "dag" : "dager"} over` : "Vann i dag") : left > 1 ? `Om ${left} dager` : left === 1 ? "I morgen" : (fukt !== null ? `Fuktig ${Math.round(fukt)} %` : "Vann i dag");
        return { entity: id, id: a.plante_id, name: a.navn, latin: a.latin || "", icon: a.ikon, tip: a.tips || "", sted: a.sted, stedPrefix: a.sted_prefix, last, iv, left, pct, tone, txt, due,
          sesong: a.sesong, dagl: a.daglengde_timer, fukt, fuktMin: a.fuktighet_min, fuktSensor: a.fuktighet_sensor, ivVekst: a.intervall_vekst, ivHoy: a.intervall_hoysommer, ivVinter: a.intervall_vinter,
          water: `button.${b}_vannet_na`, interval: `number.${b}_intervall`, intervalV: `number.${b}_intervall_vinter`, intervalH: `number.${b}_intervall_hoysommer`, fuktMinEnt: `number.${b}_fuktighet_min`, auto: `switch.${b}_auto_registrer`, sist: `datetime.${b}_sist_vannet` }; });
    }
    _key() { return JSON.stringify([this._config, this._view, this._apen, Math.floor(Date.now() / 3600000), this._plants().map(p => [p.entity, (this.st(p.entity) || {}).attributes, this.val(p.interval)])]); }
    _render() {
      const c = this._config, ps = this._plants(), due = ps.filter(p => p.due), adv = this._view === "avansert";
      const steder = [...new Set(ps.map(p => p.stedPrefix))];
      const navn = !ps.length ? "Ingen planter" : due.length === 0 ? "Alle er vannet" : `${due.length} av ${ps.length} trenger vann`;
      const next = ps.filter(p => p.left !== null && p.left > 0).sort((a, b) => a.left - b.left)[0];
      const forkl = due.length ? due.map(p => p.name).join(", ") + " trenger vann" + (next ? ` · neste: ${next.name} ${next.txt.toLowerCase()}` : "") : next ? `Neste: ${next.name} ${next.txt.toLowerCase()}` : "Legg til planter i KI Planter.";
      const okPct = ps.length ? ((ps.length - due.length) / ps.length) * 100 : 0;
      this.shadowRoot.innerHTML = `<style>${KI.pro}</style><div class="wrap">
        ${c.title ? `<div class="card-title">${KI.esc(c.title)}</div>` : ""}
        <div class="hero">${KI.ringHtml(okPct, `${ps.length - due.length}<span>/${ps.length}</span>`, !ps.length ? "av" : due.length ? "rod" : "", ps[0] && ps[0].entity)}
          <div><div class="hero-navn">${KI.esc(navn)}</div><div class="hero-forklaring">${KI.esc(forkl)}</div></div></div>
        <div class="switch" role="tablist"><div class="switch-valg ${!adv ? "aktiv" : ""}" data-view="enkel">Enkel</div><div class="switch-valg ${adv ? "aktiv" : ""}" data-view="avansert">Avansert</div></div>
        <div class="blokk"><div class="blokk-hode"><span>Planter</span><span class="blokk-sub">${ps[0] && ps[0].sesong ? ({ vinter: "❄ vinterhvile", vekst: "🌱 vekstsesong", "høysommer": "☀ høysommer", sommer: "☀ sommer" }[ps[0].sesong] || ps[0].sesong) + (ps[0].dagl ? ` · ${ps[0].dagl} t dag` : "") : ""}</span></div>
          ${ps.length ? ps.map(p => this._plant(p, adv)).join("") : `<div class="tom">Fant ingen planter fra <b>KI Planter</b>. Legg til integrasjonen med et sted og plantene dine.</div>`}
          ${due.length > 1 && steder.length === 1 ? `<div class="knapper"><div class="knapp primar press" data-press="button.${steder[0]}_alle_vannet" data-confirm="Registrere alle som trenger vann som vannet nå?" tabindex="0">Alle vannet</div></div>` : ""}
        </div>
        ${adv && steder.length ? steder.map(sp => { const sw = `switch.${sp}_varsling`, cnt = this.st(`sensor.${sp}_trenger_vann`); return `<div class="blokk"><div class="blokk-hode"><span>Varsling</span><span class="blokk-sub">${cnt ? KI.friendly(this._hass, `sensor.${sp}_trenger_vann`).replace(/ trenger vann$/i, "") : ""}</span></div>
          ${this.st(sw) ? `<div class="rad"><div><div class="rad-navn">Varsel når planter trenger vann</div><div class="rad-sub">${cnt && cnt.attributes.sist_varslet ? "sist varslet " + new Date(cnt.attributes.sist_varslet).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "klokkeslett settes i integrasjonen"}</div></div><div class="bryter ${this.on(sw) ? "on" : ""}" data-toggle="${sw}" tabindex="0"><span></span></div></div>` : ""}
          <div class="knapper"><div class="knapp press" data-press="button.${sp}_send_varsel" tabindex="0">Send varsel nå</div></div></div>`; }).join("") : ""}
      </div>`;
      KI.wirePro(this, this.shadowRoot);
    }
    _plant(p, adv) {
      const open = this._apen === p.entity;
      return `<div class="last ${open ? "apen" : ""}">
        <div class="last-hode" data-open="${p.entity}">
          <div class="prikk p-${p.tone}"></div>
          <div><div class="last-navn">${KI.esc(p.name)}</div><div class="last-forklaring">${KI.esc(p.latin || (p.last ? "vannet " + fmtDato(p.last) : ""))}</div></div>
          <div class="last-verdi">${p.txt}${p.last ? `<small>vannet ${fmtDato(p.last)}</small>` : ""}</div>
        </div>
        <div class="last-kropp">
          <div class="spor"><div class="fyll ${p.tone === "feil" ? "rod" : p.tone === "advarsel" ? "gul" : "gronn"}" style="width:${p.pct}%"></div></div>
          <div class="under"><span>${p.last ? "sist " + p.last.toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "ikke vannet ennå"}</span><span>${p.last ? "neste " + fmtDato(new Date(p.last.getTime() + p.iv * DAG)) : ""}</span></div>
          <div class="last-fakta" style="padding-top:8px"><span>hver ${Math.round(p.iv)}. dag nå</span>${p.ivVekst ? `<span>🌱 ${p.ivVekst} d</span>` : ""}${p.ivHoy ? `<span>☀ ${p.ivHoy} d</span>` : ""}${p.ivVinter ? `<span>❄ ${p.ivVinter} d</span>` : ""}${p.fukt !== null ? `<span class="${p.fukt < p.fuktMin ? "b-feil" : "b-ok"}" data-more="${p.fuktSensor}" style="cursor:pointer">fuktighet ${Math.round(p.fukt)} %</span>` : p.fuktSensor ? `<span>fuktsensor utilgjengelig</span>` : ""}</div>
          ${p.tip ? `<div class="notat">${KI.esc(p.tip)}</div>` : ""}
          ${adv ? KI.stepperHtml(this._hass, p.interval, "🌱 Vekstsesong", { unit: " d", sub: "Daglengde 10–17 t" }) + KI.stepperHtml(this._hass, p.intervalH, "☀ Høysommer", { unit: " d", sub: "Over 17 t dag · 0 = som vekstsesong" }) + KI.stepperHtml(this._hass, p.intervalV, "❄ Vinterhvile", { unit: " d", sub: "Under 10 t dag · 0 = som vekstsesong" })
            + (this.st(p.fuktMinEnt) ? KI.stepperHtml(this._hass, p.fuktMinEnt, "Tørr under", { unit: " %", tick: p.fukt ?? undefined }) : "")
            + (this.st(p.auto) ? `<div class="rad"><div><div class="rad-navn">Auto-registrer</div><div class="rad-sub">Vanning registreres når fuktigheten hopper opp</div></div><div class="bryter ${this.on(p.auto) ? "on" : ""}" data-toggle="${p.auto}" tabindex="0"><span></span></div></div>` : "")
            + `<div class="rad" data-more="${p.sist}" style="cursor:pointer"><span class="rad-navn">Sist vannet</span><span class="rad-verdi">rediger ›</span></div>` : ""}
          <div class="knapper"><div class="knapp primar press" data-press="${p.water}" ${this._config.confirm ? `data-confirm="Registrere ${KI.esc(p.name)} som vannet nå?"` : ""} tabindex="0">Vannet nå</div></div>
        </div></div>`;
    }
    getCardSize() { return 3 + this._plants().length; }
  }
  window.KI.define("ki-planter-pro-card", KiPlanterProCard);
  KI.register("ki-planter-pro-card", "KI Planter Pro", "Planter: status, neste vanning, tips, intervall og varsling");
})(window.KI);
} catch (e) { console.error("ki-cards: 42-ki-planter-pro-card feilet", e); }

/* ===== family-status-card ===== */
try {

/* ------------------------------------------------------------------ */
/*  family-status-card                                                */
/*  Hilsen + familiemedlemmers hjemme/borte-status med badge-ikoner   */
/*  basert på sone. Trykk på et bilde åpner en popup der man setter   */
/*  hjemme/borte og våken/sover. Fullt konfigurerbar via GUI-editor.  */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG = {
  greeting: "👋 Hei!",
  greeting_navigation_path: "/config",
  greeting_hold_entity: "",
  greeting_font_size: 22,
  greeting_color: "var(--gray1000)",
  navigation_path: "#personer",
  avatar_size: 50,
  badge_size: 20,
  persons_gap: 12,
  card_padding: "12px 8px",
  show_names: true,
  name_font_size: 11,
  name_color: "var(--gray1000)",
  home_icon: "mdi:lighthouse",
  home_color: "var(--blue)",
  default_icon: "mdi:airplane",
  default_color: "var(--blue)",
  // Popup
  dialog_background: "",
  dialog_track_color: "",
  dialog_text_color: "",
  dialog_active_color: "",
  dialog_active_text_color: "",
  dialog_inactive_text_color: "",
  home_active_color: "",
  home_active_text_color: "",
  away_active_color: "var(--blue, #4a90e2)",
  away_active_text_color: "var(--white, #ffffff)",
  awake_active_color: "var(--orange, #f2a33c)",
  awake_active_text_color: "var(--black, #101010)",
  asleep_active_color: "var(--purple, #6f6bd8)",
  asleep_active_text_color: "var(--white, #ffffff)",
  haptic: true,
  haptic_tap: "light",
  haptic_hold: "medium",
  tap_behavior: "dialog", // "dialog" | "toggle"
  dialog_home_icon: "mdi:home",
  dialog_away_icon: "mdi:home-export-outline",
  dialog_awake_icon: "mdi:white-balance-sunny",
  dialog_asleep_icon: "mdi:moon-waning-crescent",
  home_label: "Hjemme",
  away_label: "Borte",
  awake_label: "Våken",
  asleep_label: "Sover",
  done_label: "Ferdig",
  persons: [],
  locations: [],
  profiles: [],
  debug: false,
};

// Gjør tall om til px, men behold verdier som allerede har en enhet
// (bakoverkompatibelt med eldre konfigurasjoner som brukte f.eks. "1.4em").
function toCssSize(value, fallbackPx) {
  if (value === undefined || value === null || value === "") {
    return `${fallbackPx}px`;
  }
  if (typeof value === "number") return `${value}px`;
  if (/^[0-9.]+$/.test(String(value))) return `${value}px`;
  return String(value);
}

class FamilyStatusCard extends LitElement {
  static get properties() {
    return { hass: {}, config: {}, _dialogIndex: {} };
  }

  constructor() {
    super();
    this._dialogIndex = null;
    this._openedAt = 0;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onResize = () => this.requestUpdate();
  }

  setConfig(config) {
    if (!config.persons || !Array.isArray(config.persons) || config.persons.length === 0) {
      throw new Error("Legg til minst én person under 'persons' i konfigurasjonen.");
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._pressTimer = null;
  }

  static getConfigElement() {
    return document.createElement("family-status-card-editor");
  }

  static getStubConfig() {
    return {
      greeting: "👋 Hei!",
      greeting_navigation_path: "/config",
      greeting_font_size: 22,
      greeting_color: "var(--gray1000)",
      navigation_path: "#personer",
      avatar_size: 50,
      badge_size: 20,
      persons_gap: 12,
      show_names: true,
      name_font_size: 11,
      name_color: "var(--gray1000)",
      home_icon: "mdi:lighthouse",
      home_color: "var(--blue)",
      default_icon: "mdi:airplane",
      default_color: "var(--blue)",
      tap_behavior: "dialog",
      persons: [{ person: "", presence_switch: "", sleep_switch: "", display_name: "" }],
      locations: [{ zone: "zone.home", icon: "mdi:home", color: "var(--green)" }],
    };
  }

  getCardSize() {
    return 1;
  }

  /**
   * Finner første profil som matcher enheten. En profil matcher på
   * user_agent (delstreng), user (navn på innlogget bruker) og/eller
   * min_width/max_width i piksler. Alle oppgitte kriterier må stemme.
   */
  _activeProfile() {
    const profiles = this.config.profiles;
    if (!Array.isArray(profiles)) return null;
    const ua = (navigator.userAgent || "").toLowerCase();
    const model = (this._model || "").toLowerCase();
    const width = window.innerWidth;
    const userName = (this.hass?.user?.name || "").toLowerCase();

    return (
      profiles.find((p) => {
        if (!p) return false;
        const hasRule =
          p.model ||
          p.user_agent ||
          p.user ||
          p.min_width !== undefined ||
          p.max_width !== undefined;
        if (!hasRule) return false;
        if (p.model && !model.includes(String(p.model).toLowerCase())) return false;
        if (p.user_agent && !ua.includes(String(p.user_agent).toLowerCase())) return false;
        if (p.user && !userName.startsWith(String(p.user).toLowerCase())) return false;
        if (p.min_width !== undefined && width < Number(p.min_width)) return false;
        if (p.max_width !== undefined && width > Number(p.max_width)) return false;
        return true;
      }) || null
    );
  }

  /** Basiskonfigurasjonen med eventuell profil lagt oppå. */
  get cfg() {
    const profile = this._activeProfile();
    if (!profile) return this.config;
    const { name, user, user_agent, model, min_width, max_width, ...overrides } = profile;
    return { ...this.config, ...overrides };
  }

  /** Fornavnet til den innloggede brukeren, f.eks. "Sebastian". */
  _firstName() {
    const full = this.hass?.user?.name || "";
    return full.trim().split(/\s+/)[0] || "";
  }

  /** Bytter ut {name}, {user} og {first_name} i hilsenen med fornavnet. */
  _greetingText() {
    const text = this.cfg.greeting || "";
    return text.replace(/\{(name|user|first_name)\}/g, this._firstName());
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._onResize);
    // Client hints gir det faktiske modellnavnet på Android, der user agent
    // bare rapporterer "K". Ikke tilgjengelig på iOS/Safari.
    if (this._model === undefined && navigator.userAgentData?.getHighEntropyValues) {
      this._model = "";
      navigator.userAgentData
        .getHighEntropyValues(["model"])
        .then((data) => {
          this._model = data.model || "";
          this.requestUpdate();
        })
        .catch(() => {});
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("resize", this._onResize);
  }

  _fire(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  /**
   * Sender et "haptic"-event som Home Assistant-appen fanger opp. I vanlig
   * nettleser faller vi tilbake på navigator.vibrate, men aldri i appen –
   * da ville det vibrert to ganger.
   */
  _haptic(type) {
    if (this.cfg.haptic === false) return;
    this._fire("haptic", type);
    const inApp = !!(window.externalApp || window.webkit?.messageHandlers?.externalBus);
    if (inApp || !navigator.vibrate) return;
    const ms = {
      selection: 5,
      light: 10,
      medium: 20,
      heavy: 35,
      success: 15,
      warning: 25,
      failure: 40,
    };
    navigator.vibrate(ms[type] || 10);
  }

  _navigate(path) {
    if (!path) return;
    if (path.startsWith("#")) {
      window.location.hash = path;
      return;
    }
    history.pushState(null, "", path);
    this._fire("location-changed", { replace: false });
  }

  /**
   * Finner sonen som matcher personens nåværende tilstand.
   * Matcher mot sonens friendly_name, entity_id, eller slug for å tåle
   * ulike varianter.
   */
  _resolveStatus(personConfig) {
    const cfg = this.cfg;
    const presenceState = personConfig.presence_switch
      ? this.hass.states[personConfig.presence_switch]
      : null;
    const isHome = presenceState && presenceState.state === "on";

    if (isHome) {
      return { icon: cfg.home_icon, color: cfg.home_color };
    }

    const personState = this.hass.states[personConfig.person];
    const currentValue = personState ? personState.state : null;

    const match = (cfg.locations || []).find((l) => {
      if (!currentValue) return false;
      if (l.zone) {
        const zoneEntity = this.hass.states[l.zone];
        const zoneFriendlyName = zoneEntity?.attributes?.friendly_name;
        const zoneSlug = l.zone.replace("zone.", "");
        return currentValue === zoneFriendlyName || currentValue === zoneSlug || currentValue === l.zone;
      }
      if (l.name) {
        return currentValue === l.name;
      }
      return false;
    });

    if (match) {
      return { icon: match.icon, color: match.color };
    }
    return { icon: cfg.default_icon, color: cfg.default_color };
  }

  _isOn(entityId) {
    if (!entityId) return false;
    const state = this.hass.states[entityId];
    return !!state && state.state === "on";
  }

  /** Slår en entitet av/på uavhengig av om det er switch eller input_boolean. */
  _setEntity(entityId, turnOn) {
    if (!entityId) return;
    this._haptic("selection");
    if (this._isOn(entityId) === turnOn) return;
    this.hass.callService("homeassistant", turnOn ? "turn_on" : "turn_off", {
      entity_id: entityId,
    });
  }

  _togglePresence(personConfig) {
    if (!personConfig.presence_switch) return;
    this.hass.callService("homeassistant", "toggle", {
      entity_id: personConfig.presence_switch,
    });
  }

  _openDialog(index) {
    this._dialogIndex = index;
    this._openedAt = Date.now();
    window.addEventListener("keydown", this._onKeyDown);
  }

  /**
   * Touch-enheter sender et "ghost click" rett etter pointerup, på det som nå
   * ligger under fingeren. Uten denne sperren treffer det backdrop-en og
   * lukker dialogen med én gang den er åpnet.
   */
  _onBackdropClick(ev) {
    if (ev.target !== ev.currentTarget) return;
    if (Date.now() - this._openedAt < 600) return;
    this._closeDialog();
  }

  _closeDialog() {
    this._dialogIndex = null;
    window.removeEventListener("keydown", this._onKeyDown);
  }

  _onKeyDown(ev) {
    if (ev.key === "Escape") this._closeDialog();
  }

  /** Langt trykk: personens egen hold_navigation_path, ellers kortets navigation_path. */
  _onPointerDown(personConfig) {
    this._pressTimer = window.setTimeout(() => {
      this._pressTimer = null;
      this._haptic(this.cfg.haptic_hold);
      this._navigate((personConfig && personConfig.hold_navigation_path) || this.cfg.navigation_path);
    }, 500);
  }

  _onPointerUp(personConfig, index) {
    if (this._pressTimer) {
      window.clearTimeout(this._pressTimer);
      this._pressTimer = null;
      this._haptic(this.cfg.haptic_tap);
      if (this.cfg.tap_behavior === "toggle") {
        this._togglePresence(personConfig);
      } else {
        this._openDialog(index);
      }
    }
  }

  _onPointerCancel() {
    if (this._pressTimer) {
      window.clearTimeout(this._pressTimer);
      this._pressTimer = null;
    }
  }

  _onGreetingPointerDown() {
    this._greetingTimer = window.setTimeout(() => {
      this._greetingTimer = null;
      const entity = this.cfg.greeting_hold_entity;
      if (entity) {
        this._haptic(this.cfg.haptic_hold);
        this.hass.callService("homeassistant", "toggle", { entity_id: entity });
      }
    }, 500);
  }

  _onGreetingPointerUp() {
    if (this._greetingTimer) {
      window.clearTimeout(this._greetingTimer);
      this._greetingTimer = null;
      this._haptic(this.cfg.haptic_tap);
      this._navigate(this.cfg.greeting_navigation_path);
    }
  }

  _onGreetingPointerCancel() {
    if (this._greetingTimer) {
      window.clearTimeout(this._greetingTimer);
      this._greetingTimer = null;
    }
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const cfg = this.cfg;
    const hostStyle = `
      --fsc-avatar-size: ${toCssSize(cfg.avatar_size, 50)};
      --fsc-badge-size: ${toCssSize(cfg.badge_size, 20)};
      --fsc-badge-icon-size: ${Math.round(Number(cfg.badge_size ?? 20) * 0.6)}px;
      --fsc-persons-gap: ${toCssSize(cfg.persons_gap, 12)};
      --fsc-card-padding: ${cfg.card_padding || "12px 8px"};
      --fsc-greeting-size: ${toCssSize(cfg.greeting_font_size, 22)};
      --fsc-greeting-color: ${cfg.greeting_color || "var(--gray1000)"};
      --fsc-name-size: ${toCssSize(cfg.name_font_size, 11)};
      --fsc-name-color: ${cfg.name_color || "var(--gray1000)"};
    `;

    return html`
      <ha-card style=${hostStyle}>
        <div class="row">
          <div
            class="greeting"
            @pointerdown=${() => this._onGreetingPointerDown()}
            @pointerup=${() => this._onGreetingPointerUp()}
            @pointerleave=${() => this._onGreetingPointerCancel()}
            @contextmenu=${(e) => e.preventDefault()}
          >
            ${this._greetingText()}
          </div>
          <div class="persons">
            ${cfg.persons.map((p, i) => this._renderPerson(p, i))}
          </div>
        </div>
        ${this._dialogIndex !== null ? this._renderDialog() : ""}
        ${cfg.debug ? this._renderDebug() : ""}
      </ha-card>
    `;
  }

  _renderDebug() {
    const profile = this._activeProfile();
    return html`
      <div class="debug">
        <div><b>Bredde:</b> ${window.innerWidth} px</div>
        <div><b>Modell:</b> ${this._model || "ikke tilgjengelig"}</div>
        <div><b>Bruker:</b> ${this.hass?.user?.name || "ukjent"}</div>
        <div><b>Profil:</b> ${profile ? profile.name || "uten navn" : "standard"}</div>
        <div class="ua">${navigator.userAgent}</div>
      </div>
    `;
  }

  _renderPerson(personConfig, index) {
    const state = this.hass.states[personConfig.person];
    const picture = state?.attributes?.entity_picture || "";
    const fallbackName = state?.attributes?.friendly_name || personConfig.person || "Ukjent";
    const displayName = personConfig.display_name || fallbackName;
    const status = this._resolveStatus(personConfig);
    const showNames = this.cfg.show_names !== false;

    return html`
      <div class="person">
        <div
          class="avatar-wrap"
          title=${fallbackName}
          @pointerdown=${() => this._onPointerDown(personConfig)}
          @pointerup=${() => this._onPointerUp(personConfig, index)}
          @pointerleave=${() => this._onPointerCancel()}
          @contextmenu=${(e) => e.preventDefault()}
        >
          <div class="avatar" style=${picture ? `background-image:url(${picture})` : ""}></div>
          <div class="badge" style="background:${status.color}">
            <ha-icon icon=${status.icon}></ha-icon>
          </div>
        </div>
        ${showNames ? html`<div class="person-name">${displayName}</div>` : ""}
      </div>
    `;
  }

  /* ---------------------------- POPUP ---------------------------- */

  _renderDialog() {
    const cfg = this.cfg;
    const personConfig = cfg.persons[this._dialogIndex];
    if (!personConfig) return "";

    const state = this.hass.states[personConfig.person];
    const picture = state?.attributes?.entity_picture || "";
    const name =
      personConfig.display_name ||
      state?.attributes?.friendly_name ||
      personConfig.person ||
      "Ukjent";

    const isHome = this._isOn(personConfig.presence_switch);
    const isAsleep = this._isOn(personConfig.sleep_switch);

    const cssVar = (name, value) => (value ? `${name}: ${value};` : "");
    const segStyle = (bg, text) =>
      [
        bg ? `background: ${bg};` : "",
        text ? `color: ${text};` : "",
      ].join(" ");
    const dialogStyle = [
      cssVar("--fsc-dialog-bg", cfg.dialog_background),
      cssVar("--fsc-dialog-track", cfg.dialog_track_color),
      cssVar("--fsc-dialog-text", cfg.dialog_text_color),
      cssVar("--fsc-dialog-active", cfg.dialog_active_color),
      cssVar("--fsc-dialog-active-text", cfg.dialog_active_text_color),
      cssVar("--fsc-dialog-inactive-text", cfg.dialog_inactive_text_color),
    ].join(" ");

    return html`
      <div class="backdrop" @click=${(e) => this._onBackdropClick(e)}>
        <div
          class="dialog"
          role="dialog"
          aria-label=${name}
          style=${dialogStyle}
          @click=${(e) => e.stopPropagation()}
        >
          <div
            class="dialog-avatar"
            style=${picture ? `background-image:url(${picture})` : ""}
          ></div>
          <div class="dialog-name">${name}</div>

          ${personConfig.presence_switch
            ? html`
                <div class="segment">
                  <button
                    class="seg ${isHome ? "active" : ""}"
                    style=${isHome
                      ? segStyle(cfg.home_active_color, cfg.home_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.presence_switch, true)}
                  >
                    <ha-icon icon=${cfg.dialog_home_icon}></ha-icon>
                    <span>${cfg.home_label}</span>
                  </button>
                  <button
                    class="seg ${!isHome ? "active" : ""}"
                    style=${!isHome
                      ? segStyle(cfg.away_active_color, cfg.away_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.presence_switch, false)}
                  >
                    <ha-icon icon=${cfg.dialog_away_icon}></ha-icon>
                    <span>${cfg.away_label}</span>
                  </button>
                </div>
              `
            : ""}
          ${personConfig.sleep_switch
            ? html`
                <div class="segment">
                  <button
                    class="seg ${!isAsleep ? "active" : ""}"
                    style=${!isAsleep
                      ? segStyle(cfg.awake_active_color, cfg.awake_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.sleep_switch, false)}
                  >
                    <ha-icon icon=${cfg.dialog_awake_icon}></ha-icon>
                    <span>${cfg.awake_label}</span>
                  </button>
                  <button
                    class="seg ${isAsleep ? "active" : ""}"
                    style=${isAsleep
                      ? segStyle(cfg.asleep_active_color, cfg.asleep_active_text_color)
                      : ""}
                    @click=${() => this._setEntity(personConfig.sleep_switch, true)}
                  >
                    <ha-icon icon=${cfg.dialog_asleep_icon}></ha-icon>
                    <span>${cfg.asleep_label}</span>
                  </button>
                </div>
              `
            : ""}

          <button
            class="done"
            @click=${() => {
              this._haptic(this.cfg.haptic_tap);
              this._closeDialog();
            }}
          >
            ${cfg.done_label}
          </button>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        box-shadow: none;
        background: none;
        border: none;
      }
      .row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: var(--fsc-card-padding, 12px 8px);
        gap: 8px;
      }
      .greeting {
        font-size: var(--fsc-greeting-size, 22px);
        font-weight: 600;
        color: var(--fsc-greeting-color, var(--gray1000));
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        touch-action: manipulation;
        -webkit-touch-callout: none;
      }
      .persons {
        display: flex;
        gap: var(--fsc-persons-gap, 12px);
        align-items: flex-start;
      }
      .person {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .avatar-wrap {
        position: relative;
        width: var(--fsc-avatar-size, 50px);
        height: var(--fsc-avatar-size, 50px);
        cursor: pointer;
        user-select: none;
        touch-action: manipulation;
        -webkit-touch-callout: none;
      }
      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: var(--gray200, var(--secondary-background-color));
      }
      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: var(--fsc-badge-size, 20px);
        height: var(--fsc-badge-size, 20px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.3);
      }
      .badge ha-icon {
        --mdc-icon-size: var(--fsc-badge-icon-size, 12px);
        color: white;
      }
      .person-name {
        font-size: var(--fsc-name-size, 11px);
        color: var(--fsc-name-color, var(--gray1000));
        opacity: 0.8;
        text-align: center;
        max-width: calc(var(--fsc-avatar-size, 50px) + 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ---------------------------- DEBUG ---------------------------- */
      .debug {
        margin: 0 8px 8px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--gray100, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        font-size: 12px;
        line-height: 1.6;
      }
      .debug .ua {
        margin-top: 6px;
        opacity: 0.7;
        word-break: break-all;
      }

      /* ---------------------------- POPUP ---------------------------- */
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        animation: fsc-fade 160ms ease-out;
      }
      .dialog {
        position: relative;
        width: min(340px, 100%);
        margin-top: 44px;
        padding: 60px 20px 20px;
        border-radius: 28px;
        background: var(
          --fsc-dialog-bg,
          var(--gray000, var(--ha-card-background, var(--card-background-color)))
        );
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fsc-pop 180ms cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .dialog-avatar {
        position: absolute;
        top: -44px;
        left: 50%;
        transform: translateX(-50%);
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        background-color: var(--gray200, var(--secondary-background-color));
      }
      .dialog-name {
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
        margin-bottom: 4px;
      }
      .segment {
        display: flex;
        gap: 6px;
        padding: 5px;
        border-radius: 999px;
        background: var(--fsc-dialog-track, var(--gray100, var(--secondary-background-color)));
      }
      .seg {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px 8px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--fsc-dialog-inactive-text, var(--gray800, var(--secondary-text-color)));
        font-family: inherit;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 140ms ease, color 140ms ease;
      }
      .seg ha-icon {
        --mdc-icon-size: 20px;
        flex: none;
      }
      .seg span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .seg.active {
        background: var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
        color: var(--fsc-dialog-active-text, var(--black, var(--primary-text-color)));
        font-weight: 600;
      }
      .seg:focus-visible {
        outline: 2px solid var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
        outline-offset: 2px;
      }
      .done {
        margin-top: 8px;
        padding: 16px;
        border: none;
        border-radius: 999px;
        background: var(--fsc-dialog-active, var(--active-big, var(--primary-color)));
        color: var(--fsc-dialog-active-text, var(--black, var(--primary-text-color)));
        font-family: inherit;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
      }
      .done:focus-visible {
        outline: 2px solid var(--fsc-dialog-text, var(--gray1000, var(--primary-text-color)));
        outline-offset: 2px;
      }
      @keyframes fsc-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes fsc-pop {
        from {
          opacity: 0;
          transform: scale(0.94);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .dialog {
          animation: none;
        }
      }
    `;
  }
}

window.KI.define("family-status-card", FamilyStatusCard);

/* ------------------------------------------------------------------ */
/*  GUI-editor                                                        */
/* ------------------------------------------------------------------ */

class FamilyStatusCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {} };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /* ------------------------- oppdateringer ------------------------- */

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _update(field, value) {
    this._config = { ...this._config, [field]: value };
    this._fireChanged();
  }

  _updateNumber(field, value) {
    const num = Number(value);
    this._update(field, Number.isFinite(num) && value !== "" ? num : value);
  }

  _updateList(list, index, field, value) {
    const items = [...(this._config[list] || [])];
    items[index] = { ...items[index], [field]: value };
    this._update(list, items);
  }

  _removeFromList(list, index) {
    this._update(
      list,
      (this._config[list] || []).filter((_, i) => i !== index)
    );
  }

  _addToList(list, item) {
    this._update(list, [...(this._config[list] || []), item]);
  }

  /** Tomme felter fjernes helt fra profilen, slik at verdien arves. */
  _updateProfile(index, field, value) {
    const profiles = [...(this._config.profiles || [])];
    const profile = { ...profiles[index] };
    if (value === "" || value === null || value === undefined) {
      delete profile[field];
    } else {
      profile[field] = value;
    }
    profiles[index] = profile;
    this._update("profiles", profiles);
  }

  _updateProfileNumber(index, field, value) {
    if (value === "") return this._updateProfile(index, field, "");
    const num = Number(value);
    this._updateProfile(index, field, Number.isFinite(num) ? num : value);
  }

  /* --------------------------- byggeklosser ------------------------ */

  _text(label, field, value = null) {
    return html`
      <ha-textfield
        label=${label}
        .value=${value !== null ? value : this._config[field] || ""}
        @input=${(e) => this._update(field, e.target.value)}
      ></ha-textfield>
    `;
  }

  _number(label, field, fallback) {
    return html`
      <ha-textfield
        type="number"
        suffix="px"
        label=${label}
        .value=${this._config[field] ?? fallback}
        @input=${(e) => this._updateNumber(field, e.target.value)}
      ></ha-textfield>
    `;
  }

  _color(label, field) {
    const value = this._config[field] || "";
    return html`
      <div class="color-field">
        <div
          class="swatch"
          style=${value ? `background: ${value}` : ""}
          title=${value || "Arver fra temaet"}
        ></div>
        <ha-textfield
          label=${label}
          .value=${value}
          @input=${(e) => this._update(field, e.target.value)}
        ></ha-textfield>
      </div>
    `;
  }

  _icon(label, field) {
    return html`
      <ha-icon-picker
        label=${label}
        .hass=${this.hass}
        .value=${this._config[field] || ""}
        @value-changed=${(e) => this._update(field, e.detail.value)}
      ></ha-icon-picker>
    `;
  }

  _switch(label, field, defaultOn = true) {
    const checked = defaultOn ? this._config[field] !== false : !!this._config[field];
    return html`
      <div class="switch-row">
        <ha-switch
          .checked=${checked}
          @change=${(e) => this._update(field, e.target.checked)}
        ></ha-switch>
        <span>${label}</span>
      </div>
    `;
  }

  _select(label, field, options, fallback) {
    return html`
      <ha-select
        label=${label}
        naturalMenuWidth
        fixedMenuPosition
        .value=${this._config[field] || fallback}
        @closed=${(e) => e.stopPropagation()}
        @selected=${(e) => this._update(field, e.target.value)}
      >
        ${options.map(
          (o) => html`<mwc-list-item .value=${o.value}>${o.label}</mwc-list-item>`
        )}
      </ha-select>
    `;
  }

  _labelRow(iconField, iconLabel, textField, textLabel, colorField, colorLabel) {
    return html`
      <div class="field-row three">
        ${this._icon(iconLabel, iconField)} ${this._text(textLabel, textField)}
        ${this._color(colorLabel, colorField)}
      </div>
    `;
  }

  _personLabel(p, i) {
    if (p.display_name) return p.display_name;
    const state = this.hass?.states?.[p.person];
    return state?.attributes?.friendly_name || `Person ${i + 1}`;
  }

  _zoneLabel(l, i) {
    const state = this.hass?.states?.[l.zone];
    return state?.attributes?.friendly_name || l.zone || `Sone ${i + 1}`;
  }

  /* ------------------------------ render --------------------------- */

  render() {
    if (!this._config) return html``;
    const cfg = this._config;
    const hapticTypes = [
      { value: "selection", label: "Selection – nesten umerkelig" },
      { value: "light", label: "Light – lett" },
      { value: "medium", label: "Medium" },
      { value: "heavy", label: "Heavy – kraftig" },
      { value: "success", label: "Success" },
      { value: "warning", label: "Warning" },
      { value: "failure", label: "Failure" },
    ];

    return html`
      <div class="editor">
        <!-- HILSEN -->
        <ha-expansion-panel outlined expanded>
          <div slot="header" class="header">
            <ha-icon icon="mdi:hand-wave"></ha-icon>
            <span>Hilsen</span>
          </div>
          <div class="body">
            ${this._text("Tekst", "greeting")}
            <div class="hint">
              Skriv {name} der fornavnet til den innloggede brukeren skal stå.
            </div>
            <div class="field-row">
              ${this._number("Skriftstørrelse", "greeting_font_size", 22)}
              ${this._color("Farge", "greeting_color")}
            </div>
            ${this._text("Naviger til ved trykk", "greeting_navigation_path")}
            <ha-entity-picker
              label="Veksle ved langt trykk (valgfri)"
              .hass=${this.hass}
              .value=${cfg.greeting_hold_entity || ""}
              .includeDomains=${["input_boolean", "switch"]}
              @value-changed=${(e) => this._update("greeting_hold_entity", e.detail.value)}
            ></ha-entity-picker>
          </div>
        </ha-expansion-panel>

        <!-- PERSONER -->
        <ha-expansion-panel outlined expanded>
          <div slot="header" class="header">
            <ha-icon icon="mdi:account-group"></ha-icon>
            <span>Personer</span>
            <span class="count">${(cfg.persons || []).length}</span>
          </div>
          <div class="body">
            ${(cfg.persons || []).map(
              (p, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${this._personLabel(p, i)}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("persons", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-entity-picker
                    label="Person-entitet"
                    .hass=${this.hass}
                    .value=${p.person || ""}
                    .includeDomains=${["person"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "person", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-entity-picker
                    label="Hjemme/borte-entitet"
                    .hass=${this.hass}
                    .value=${p.presence_switch || ""}
                    .includeDomains=${["switch", "input_boolean"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "presence_switch", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-entity-picker
                    label="Søvn-entitet (valgfri)"
                    .hass=${this.hass}
                    .value=${p.sleep_switch || ""}
                    .includeDomains=${["switch", "input_boolean"]}
                    @value-changed=${(e) =>
                      this._updateList("persons", i, "sleep_switch", e.detail.value)}
                  ></ha-entity-picker>
                  <ha-textfield
                    label="Visningsnavn (valgfri)"
                    .value=${p.display_name || ""}
                    @input=${(e) =>
                      this._updateList("persons", i, "display_name", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Naviger til ved langt trykk (valgfri, f.eks. #helse)"
                    .value=${p.hold_navigation_path || ""}
                    @input=${(e) =>
                      this._updateList("persons", i, "hold_navigation_path", e.target.value)}
                  ></ha-textfield>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() =>
                this._addToList("persons", {
                  person: "",
                  presence_switch: "",
                  sleep_switch: "",
                  display_name: "",
                  hold_navigation_path: "",
                })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til person
            </mwc-button>
          </div>
        </ha-expansion-panel>

        <!-- SONER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:map-marker-radius"></ha-icon>
            <span>Soner</span>
            <span class="count">${(cfg.locations || []).length}</span>
          </div>
          <div class="body">
            ${(cfg.locations || []).map(
              (l, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${this._zoneLabel(l, i)}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("locations", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-entity-picker
                    label="Sone"
                    .hass=${this.hass}
                    .value=${l.zone || ""}
                    .includeDomains=${["zone"]}
                    @value-changed=${(e) =>
                      this._updateList("locations", i, "zone", e.detail.value)}
                  ></ha-entity-picker>
                  <div class="field-row">
                    <ha-icon-picker
                      label="Ikon"
                      .hass=${this.hass}
                      .value=${l.icon || ""}
                      @value-changed=${(e) =>
                        this._updateList("locations", i, "icon", e.detail.value)}
                    ></ha-icon-picker>
                    <div class="color-field">
                      <div class="swatch" style=${l.color ? `background: ${l.color}` : ""}></div>
                      <ha-textfield
                        label="Farge"
                        .value=${l.color || ""}
                        @input=${(e) =>
                          this._updateList("locations", i, "color", e.target.value)}
                      ></ha-textfield>
                    </div>
                  </div>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() =>
                this._addToList("locations", {
                  zone: "",
                  icon: "mdi:map-marker",
                  color: "var(--blue)",
                })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til sone
            </mwc-button>
            <div class="hint">
              Kortet matcher personens tilstand mot sonens visningsnavn,
              entity_id eller slug.
            </div>
          </div>
        </ha-expansion-panel>

        <!-- UTSEENDE -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:palette-outline"></ha-icon>
            <span>Utseende</span>
          </div>
          <div class="body">
            <div class="field-row">
              ${this._number("Avatar-størrelse", "avatar_size", 50)}
              ${this._number("Badge-størrelse", "badge_size", 20)}
            </div>
            <div class="field-row">
              ${this._number("Mellomrom mellom personer", "persons_gap", 12)}
              ${this._text("Kantavstand", "card_padding")}
            </div>
            <div class="hint">
              Kantavstand skrives som CSS, f.eks. 12px 8px. Øk den om badgen
              blir klippet på smale skjermer.
            </div>
            ${this._switch("Vis navn under bildet", "show_names")}
            ${cfg.show_names !== false
              ? html`
                  <div class="field-row">
                    ${this._number("Skriftstørrelse navn", "name_font_size", 11)}
                    ${this._color("Farge navn", "name_color")}
                  </div>
                `
              : ""}

            <div class="subheading">Badge når hjemme</div>
            <div class="field-row">
              ${this._icon("Ikon", "home_icon")} ${this._color("Farge", "home_color")}
            </div>
            <div class="subheading">Badge når ingen sone treffer</div>
            <div class="field-row">
              ${this._icon("Ikon", "default_icon")} ${this._color("Farge", "default_color")}
            </div>
          </div>
        </ha-expansion-panel>

        <!-- HANDLINGER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:gesture-tap"></ha-icon>
            <span>Handlinger</span>
          </div>
          <div class="body">
            ${this._select(
              "Kort trykk på en person",
              "tap_behavior",
              [
                { value: "dialog", label: "Åpne popup" },
                { value: "toggle", label: "Veksle hjemme/borte direkte" },
              ],
              "dialog"
            )}
            ${this._text("Naviger til ved langt trykk på en person", "navigation_path")}

            <div class="subheading">Vibrasjon</div>
            ${this._switch("Vibrasjonsrespons ved trykk og hold", "haptic")}
            ${cfg.haptic !== false
              ? html`
                  <div class="field-row">
                    ${this._select("Ved trykk", "haptic_tap", hapticTypes, "light")}
                    ${this._select("Ved hold", "haptic_hold", hapticTypes, "medium")}
                  </div>
                  <div class="hint">
                    På iOS virker vibrasjon bare i Home Assistant-appen, ikke i
                    Safari.
                  </div>
                `
              : ""}
          </div>
        </ha-expansion-panel>

        <!-- POPUP -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:card-account-details-outline"></ha-icon>
            <span>Popup</span>
          </div>
          <div class="body">
            <div class="subheading">Valgknapper</div>
            ${this._labelRow(
              "dialog_home_icon",
              "Ikon hjemme",
              "home_label",
              "Tekst hjemme",
              "home_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_away_icon",
              "Ikon borte",
              "away_label",
              "Tekst borte",
              "away_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_awake_icon",
              "Ikon våken",
              "awake_label",
              "Tekst våken",
              "awake_active_color",
              "Aktiv farge"
            )}
            ${this._labelRow(
              "dialog_asleep_icon",
              "Ikon sover",
              "asleep_label",
              "Tekst sover",
              "asleep_active_color",
              "Aktiv farge"
            )}

            <div class="subheading">Tekstfarge på aktiv knapp</div>
            <div class="field-row">
              ${this._color("Hjemme", "home_active_text_color")}
              ${this._color("Borte", "away_active_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Våken", "awake_active_text_color")}
              ${this._color("Sover", "asleep_active_text_color")}
            </div>

            <div class="subheading">Dialogen</div>
            <div class="field-row">
              ${this._color("Bakgrunn", "dialog_background")}
              ${this._color("Tekst", "dialog_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Bakgrunn valgrad", "dialog_track_color")}
              ${this._color("Inaktiv tekst", "dialog_inactive_text_color")}
            </div>
            <div class="field-row">
              ${this._color("Aktiv standardfarge", "dialog_active_color")}
              ${this._color("Aktiv standardtekst", "dialog_active_text_color")}
            </div>
            ${this._text("Tekst på lukkeknappen", "done_label")}
            <div class="hint">
              Tomme felter arver fra temaet: gray000, gray100, gray800,
              gray1000, active-big og black. Hex-verdier må stå i fnutter i
              YAML, ellers leses # som kommentar.
            </div>
          </div>
        </ha-expansion-panel>

        <!-- PROFILER -->
        <ha-expansion-panel outlined>
          <div slot="header" class="header">
            <ha-icon icon="mdi:cellphone-cog"></ha-icon>
            <span>Profiler</span>
            <span class="count">${(cfg.profiles || []).length}</span>
          </div>
          <div class="body">
            <div class="hint">
              En profil overstyrer innstillingene over når den matcher enheten.
              Alle kriteriene du fyller ut må stemme, og første treff vinner.
              Tomme felter arves fra standardoppsettet.
            </div>
            ${(cfg.profiles || []).map(
              (p, i) => html`
                <div class="item">
                  <div class="item-header">
                    <span>${p.name || `Profil ${i + 1}`}</span>
                    <mwc-icon-button @click=${() => this._removeFromList("profiles", i)}>
                      <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </mwc-icon-button>
                  </div>
                  <ha-textfield
                    label="Navn på profilen"
                    .value=${p.name || ""}
                    @input=${(e) => this._updateProfile(i, "name", e.target.value)}
                  ></ha-textfield>

                  <div class="subheading">Matcher når</div>
                  <ha-textfield
                    label="Modell (Android, f.eks. Pixel 9 Pro Fold)"
                    .value=${p.model || ""}
                    @input=${(e) => this._updateProfile(i, "model", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Enhet (del av user agent, f.eks. iPhone)"
                    .value=${p.user_agent || ""}
                    @input=${(e) => this._updateProfile(i, "user_agent", e.target.value)}
                  ></ha-textfield>
                  <ha-textfield
                    label="Innlogget bruker (fornavn)"
                    .value=${p.user || ""}
                    @input=${(e) => this._updateProfile(i, "user", e.target.value)}
                  ></ha-textfield>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Minste bredde"
                      .value=${p.min_width ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "min_width", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Største bredde"
                      .value=${p.max_width ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "max_width", e.target.value)}
                    ></ha-textfield>
                  </div>

                  <div class="subheading">Overstyrer</div>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Avatar-størrelse"
                      .value=${p.avatar_size ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "avatar_size", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Badge-størrelse"
                      .value=${p.badge_size ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "badge_size", e.target.value)}
                    ></ha-textfield>
                  </div>
                  <div class="field-row">
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Mellomrom"
                      .value=${p.persons_gap ?? ""}
                      @input=${(e) => this._updateProfileNumber(i, "persons_gap", e.target.value)}
                    ></ha-textfield>
                    <ha-textfield
                      type="number"
                      suffix="px"
                      label="Skriftstørrelse hilsen"
                      .value=${p.greeting_font_size ?? ""}
                      @input=${(e) =>
                        this._updateProfileNumber(i, "greeting_font_size", e.target.value)}
                    ></ha-textfield>
                  </div>
                  <ha-textfield
                    label="Kantavstand"
                    .value=${p.card_padding || ""}
                    @input=${(e) => this._updateProfile(i, "card_padding", e.target.value)}
                  ></ha-textfield>
                </div>
              `
            )}
            <mwc-button
              outlined
              @click=${() => this._addToList("profiles", { name: "Ny profil", model: "" })}
            >
              <ha-icon icon="mdi:plus"></ha-icon>Legg til profil
            </mwc-button>
            ${this._switch("Vis feilsøkingsinfo i kortet", "debug", false)}
            <div class="hint">
              Feilsøkingsinfoen viser bredde, modell, bruker og hvilken profil
              som traff — åpne dashbordet på enheten og les av verdiene der.
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      ha-expansion-panel {
        border-radius: 12px;
        --expansion-panel-summary-padding: 0 14px;
        --expansion-panel-content-padding: 0;
        overflow: hidden;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .header ha-icon {
        color: var(--secondary-text-color);
        --mdc-icon-size: 20px;
      }
      .count {
        margin-left: auto;
        font-size: 12px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }
      .body {
        padding: 4px 14px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .subheading {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        opacity: 0.6;
        margin-top: 6px;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-items: end;
      }
      .field-row.three {
        grid-template-columns: 1fr 1fr 1fr;
      }
      @media (max-width: 560px) {
        .field-row,
        .field-row.three {
          grid-template-columns: 1fr;
        }
      }
      .field-row > * {
        min-width: 0;
      }
      .color-field {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .color-field ha-textfield {
        flex: 1;
        min-width: 0;
      }
      .swatch {
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background-image: linear-gradient(45deg, var(--divider-color) 25%, transparent 25%),
          linear-gradient(-45deg, var(--divider-color) 25%, transparent 25%);
        background-size: 8px 8px;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 2px 0;
      }
      ha-textfield,
      ha-select,
      ha-icon-picker,
      ha-entity-picker {
        display: block;
        width: 100%;
      }
      .item {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--card-background-color);
      }
      .item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 600;
      }
      .item-header span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      mwc-icon-button {
        --mdc-icon-button-size: 34px;
        flex: none;
        color: var(--error-color, red);
      }
      mwc-button {
        align-self: flex-start;
      }
      mwc-button ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 6px;
      }
      .hint {
        font-size: 12px;
        line-height: 1.45;
        opacity: 0.7;
      }
    `;
  }
}

window.KI.define("family-status-card-editor", FamilyStatusCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "family-status-card",
  name: "Family Status Card",
  description:
    "Hilsen + familiemedlemmers hjemme/borte-status med tilpassbare soner, navn og størrelser. Trykk på en person åpner en popup for hjemme/borte og våken/sover.",
});
} catch (e) { console.error("ki-cards: family-status-card feilet", e); }

/* ===== ki-alarm-card ===== */
try {
/**
 * ki-alarm-card.js  —  v1.0.0
 *
 * Alarmsentral for Home Assistant, i samme designspråk som ki-energi-card.
 *   • Statuspanel som skifter farge og ikon etter alarmtilstand
 *   • Fire modusknapper (Av / Hjemme / Borte / Natt)
 *   • Soner med sensorfliser: dører, vinduer, bevegelse, låser
 *   • Kodetastatur som overlegg i kortet — koden holdes bare i nettleseren
 *     og sendes rett til alarm_disarm. Ingen input_text, ingen skript.
 *   • Full GUI-editor for soner, sensorer, ikoner og farger.
 *
 * Legges i /config/www/ki-alarm-card.js og registreres som
 * JavaScript Module: /local/ki-alarm-card.js
 */

const KI_ALARM_VERSION = "1.2.1";

console.info(
  `%c KI-ALARM-CARD %c ${KI_ALARM_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e5484d;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ─────────────────────────────────────────────────────────────── tilstand ── */

const TILSTAND = {
  disarmed: {
    tittel: "Deaktivert",
    ikon: "mdi:shield-off-outline",
    farge: "hvile",
  },
  armed_home: { tittel: "Aktivert – hjemme", ikon: "mdi:shield-home", farge: "sikret" },
  armed_away: { tittel: "Aktivert – borte", ikon: "mdi:shield-lock", farge: "sikret" },
  armed_night: { tittel: "Aktivert – natt", ikon: "mdi:shield-moon", farge: "sikret" },
  armed_vacation: {
    tittel: "Aktivert – ferie",
    ikon: "mdi:shield-airplane",
    farge: "sikret",
  },
  arming: { tittel: "Aktiverer", ikon: "mdi:shield-sync-outline", farge: "venter" },
  pending: { tittel: "Nedtelling", ikon: "mdi:shield-alert-outline", farge: "venter" },
  triggered: { tittel: "Alarm utløst", ikon: "mdi:alarm-light", farge: "utlost" },
};

const MODUSER = [
  { id: "disarmed", tekst: "Av", ikon: "mdi:shield-off-outline", tjeneste: "alarm_disarm" },
  {
    id: "armed_home",
    tekst: "Hjemme",
    ikon: "mdi:shield-home-outline",
    tjeneste: "alarm_arm_home",
  },
  {
    id: "armed_away",
    tekst: "Borte",
    ikon: "mdi:shield-lock-outline",
    tjeneste: "alarm_arm_away",
  },
  {
    id: "armed_night",
    tekst: "Natt",
    ikon: "mdi:shield-moon-outline",
    tjeneste: "alarm_arm_night",
  },
];

const FARGER = [
  { navn: "Rød", verdi: "var(--red)" },
  { navn: "Oransje", verdi: "var(--orange)" },
  { navn: "Gul", verdi: "var(--yellow)" },
  { navn: "Grønn", verdi: "var(--green)" },
  { navn: "Blå", verdi: "var(--blue)" },
  { navn: "Lilla", verdi: "var(--purple)" },
  { navn: "Rosa", verdi: "var(--pink)" },
  { navn: "Grå", verdi: "var(--gray800)" },
];

const SONETYPER = [
  ["opening", "Åpning (dør/vindu)"],
  ["motion", "Bevegelse"],
  ["lock", "Lås"],
];

/** Er sensoren i avviksstatus? Låser er «avvik» når de ikke er låst. */
const erAktiv = (hass, item, kind) => {
  const s = hass.states[item.entity];
  if (!s) return null;
  if (kind === "lock") return s.state !== "locked";
  return s.state === "on";
};

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const STANDARD_KONFIG = () => ({
  type: "custom:ki-alarm-card",
  entity: "alarm_control_panel.alarm",
  code_length: 4,
  arm_requires_code: false,
  zones: [
    {
      title: "Dører",
      icon: "mdi:door",
      color: "var(--red)",
      kind: "opening",
      active_text: "Åpen",
      idle_text: "Lukket",
      items: [
        { entity: "binary_sensor.inngangsdor", name: "Inngang" },
        { entity: "binary_sensor.verandador", name: "Veranda" },
      ],
    },
    {
      title: "Vinduer",
      icon: "mdi:window-closed-variant",
      color: "var(--orange)",
      kind: "opening",
      active_text: "Åpent",
      idle_text: "Lukket",
      items: [
        { entity: "binary_sensor.kjokken_vindu", name: "Kjøkken" },
        { entity: "binary_sensor.cybele_soverom_vindu", name: "Cybele soverom" },
        { entity: "binary_sensor.rune_kontorvindu", name: "Rune kontor" },
        { entity: "binary_sensor.rune_soveromsvindu", name: "Rune soverom" },
        { entity: "binary_sensor.soveromsvindu_venstre", name: "Soverom venstre" },
        { entity: "binary_sensor.soveromsvindu_hoyre", name: "Soverom høyre" },
      ],
    },
    {
      title: "Bevegelse",
      icon: "mdi:motion-sensor",
      color: "var(--blue)",
      kind: "motion",
      active_text: "Bevegelse",
      idle_text: "Stille",
      items: [
        {
          entity: "binary_sensor.trappegang_bevegelsessensor_occupancy",
          name: "Trappegang",
        },
        { entity: "binary_sensor.bad_bevegelsesensor_motion", name: "Bad" },
        { entity: "binary_sensor.pult_aqara_fp2_motion", name: "Pult" },
        { entity: "binary_sensor.stue_g6_turret_motion", name: "Stue" },
        {
          entity: "binary_sensor.mellomgang_g5_turret_ultra_motion",
          name: "Mellomgang",
        },
        {
          entity: "binary_sensor.everything_presence_lite_occupancy",
          name: "Tilstedeværelse",
        },
      ],
    },
    {
      title: "Dørlåser",
      icon: "mdi:lock",
      color: "var(--red)",
      kind: "lock",
      active_text: "Ulåst",
      idle_text: "Låst",
      items: [
        {
          entity: "lock.dorlas_blatann",
          name: "Dørlås",
          battery: "sensor.dorlas_wifi_battery_2",
        },
      ],
    },
  ],
});

/* ───────────────────────────────────────────────────────────────── kortet ── */

class KiAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._kode = "";
    this._tastaturApent = false;
    this._ventendeModus = null; // hvilken tjeneste koden skal brukes til
    this._feil = false;
    this._ok = false;
    this._skjulteSoner = new Set();
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-alarm-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    if (!config.entity || !config.entity.startsWith("alarm_control_panel.")) {
      throw new Error("ki-alarm-card: 'entity' må være et alarm_control_panel");
    }
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.zones) this._config.zones = [];
    this._signatur = "";
    this._bygget = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._tegn();
  }

  getCardSize() {
    return 6 + (this._config.zones || []).length * 2;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiAlarmCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => this._klikk(e));
    this._bygget = true;
  }

  /* --------------------------------------------------------------- data -- */

  _panel() {
    return this._hass.states[this._config.entity];
  }

  _sonedata() {
    return (this._config.zones || []).map((z) => {
      const items = (z.items || []).map((it) => {
        const aktiv = erAktiv(this._hass, it, z.kind);
        const s = this._hass.states[it.entity];
        return {
          ...it,
          aktiv,
          mangler: !s,
          navn: it.name || (s ? s.attributes.friendly_name : it.entity),
        };
      });
      const antallAktive = items.filter((i) => i.aktiv === true).length;
      return { ...z, items, antallAktive, totalt: items.length };
    });
  }

  _hindringer(soner) {
    // Åpninger og ulåste låser hindrer aktivering. Bevegelse gjør det ikke.
    const navn = [];
    soner.forEach((z) => {
      if (z.kind === "motion") return;
      z.items.forEach((i) => {
        if (i.aktiv === true) navn.push(i.navn);
      });
    });
    return navn;
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const p = this._panel();
    const soner = this._sonedata();

    const sign = JSON.stringify([
      p ? p.state : null,
      p ? p.last_changed : null,
      soner.map((z) => z.items.map((i) => i.aktiv)),
      this._tastaturApent,
      this._kode.length,
      this._feil,
      this._ok,
      [...this._skjulteSoner],
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    const tilstand = p && TILSTAND[p.state] ? TILSTAND[p.state] : null;
    const farge = tilstand ? tilstand.farge : "hvile";
    const hindringer = this._hindringer(soner);

    this._rot.innerHTML = `
      ${this._heroHtml(p, tilstand, farge, soner, hindringer)}
      ${
        this._tastaturApent
          ? this._tastaturHtml()
          : `${this._modusHtml(p)}
             ${soner.map((z, zi) => this._soneHtml(z, zi)).join("")}`
      }
    `;
  }

  _heroHtml(p, tilstand, farge, soner, hindringer) {
    const tittel = tilstand ? tilstand.tittel : "Ukjent tilstand";
    const ikon = tilstand ? tilstand.ikon : "mdi:shield-outline";

    let under;
    if (p && p.state === "triggered") {
      under = "Sjekk hva som utløste alarmen";
    } else if (hindringer.length) {
      under = `Ikke sikret: ${hindringer.join(", ")}`;
    } else if (p && p.state === "disarmed") {
      under = "Alt er lukket og låst";
    } else if (p && p.last_changed) {
      const t = new Date(p.last_changed).toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      under = `Aktivert kl. ${t}`;
    } else {
      under = "Alt er sikret";
    }

    const chips = soner
      .map(
        (z) => `
        <div class="chip">
          <div class="chip-navn">${esc(z.title)}</div>
          <div class="chip-tall">${z.totalt - z.antallAktive}<span>/${
          z.totalt
        }</span></div>
        </div>`
      )
      .join("");

    return `
      <section class="hero ${farge}" data-handling="mer-info">
        <div class="hero-hode">
          <span class="hero-ikon"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
          <span class="hero-tekst">
            <span class="hero-tittel">${esc(tittel)}</span>
            <span class="hero-under">${esc(under)}</span>
          </span>
        </div>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </section>
    `;
  }

  _modusHtml(p) {
    const naa = p ? p.state : "";
    const knapper = MODUSER.map((m) => {
      const aktiv = naa === m.id;
      return `
        <button type="button"
          class="modus ${aktiv ? "aktiv" : ""} ${m.id === "disarmed" ? "av" : ""}"
          data-handling="modus" data-modus="${m.id}">
          <ha-icon icon="${esc(m.ikon)}"></ha-icon>
          <span>${esc(m.tekst)}</span>
        </button>`;
    }).join("");
    return `<div class="moduser">${knapper}</div>`;
  }

  _soneHtml(z, zi) {
    const skjult = this._skjulteSoner.has(String(zi));
    const status =
      z.antallAktive === 0
        ? `Alt ${z.idle_text ? z.idle_text.toLowerCase() : "i orden"}`
        : `${z.antallAktive} ${
            z.antallAktive === 1
              ? (z.active_text || "avvik").toLowerCase()
              : (z.active_text || "avvik").toLowerCase() + "e"
          }`;

    // Avvik først, deretter opprinnelig rekkefølge
    const sortert = z.items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => (b.it.aktiv === true) - (a.it.aktiv === true) || a.i - b.i);

    const fliser = sortert
      .map(({ it }) => {
        const batteri =
          it.battery && this._hass.states[it.battery]
            ? ` · ${this._hass.states[it.battery].state}%`
            : "";
        const under = it.mangler
          ? "Ikke tilgjengelig"
          : (it.aktiv ? z.active_text || "Aktiv" : z.idle_text || "I orden") + batteri;
        return `
          <button type="button" class="flis ${it.aktiv ? "varsel" : ""} ${
          it.mangler ? "mangler" : ""
        }"
            style="--flis-farge:${esc(z.color || "var(--red)")}"
            data-handling="flis" data-entity="${esc(it.entity)}"
            data-kind="${esc(z.kind || "opening")}">
            <span class="flis-ikon"><ha-icon icon="${esc(
              it.icon || z.icon || "mdi:checkbox-blank-circle-outline"
            )}"></ha-icon></span>
            <span class="flis-tekst">
              <span class="flis-navn">${esc(it.navn)}</span>
              <span class="flis-under">${esc(under)}</span>
            </span>
          </button>`;
      })
      .join("");

    return `
      <section class="sone">
        <header class="sone-hode" data-handling="brytsone" data-sone="${zi}">
          <span class="sone-ikon" style="--sone-farge:${esc(
            z.color || "var(--red)"
          )}"><ha-icon icon="${esc(z.icon || "mdi:shield")}"></ha-icon></span>
          <h3>${esc(z.title)}</h3>
          <span class="sone-status ${z.antallAktive ? "avvik" : ""}">${esc(
      status
    )}</span>
          <ha-icon class="sone-pil ${skjult ? "" : "ned"}"
            icon="mdi:chevron-down"></ha-icon>
        </header>
        ${skjult ? "" : `<div class="fliser">${fliser}</div>`}
      </section>`;
  }

  _tastaturHtml() {
    const lengde = parseInt(this._config.code_length) || 4;
    let prikker = "";
    for (let i = 0; i < lengde; i++) {
      prikker += `<span class="prikk ${i < this._kode.length ? "fylt" : ""}"></span>`;
    }
    const taster = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
      .map((t) => `<button type="button" class="tast" data-handling="tast" data-tegn="${t}">${t}</button>`)
      .join("");

    let tittel = "Tast koden";
    let under = "Lukk med krysset for å gå tilbake";
    if (this._feil) {
      tittel = "Feil kode";
      under = "Prøv på nytt";
    } else if (this._ok) {
      tittel = "Alarmen er deaktivert";
      under = "";
    }

    return `
      <div class="tastatur ${this._feil ? "feil" : ""} ${this._ok ? "ok" : ""}">
        <button type="button" class="lukk" data-handling="lukk-tastatur"
          aria-label="Lukk tastatur">
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
        <div class="tast-hode">
          <div class="tast-tittel">${esc(tittel)}</div>
          <div class="tast-under">${esc(under)}</div>
          <div class="prikker">${prikker}</div>
        </div>
        <div class="tastrad">
          ${taster}
          <button type="button" class="tast tom" disabled></button>
          <button type="button" class="tast" data-handling="tast" data-tegn="0">0</button>
          <button type="button" class="tast ikon" data-handling="slett">
            <ha-icon icon="mdi:backspace-outline"></ha-icon>
          </button>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ handling -- */

  _klikk(e) {
    const el = e.target.closest("[data-handling]");
    if (!el) return;
    const h = el.dataset.handling;

    if (h === "stopp") {
      e.stopPropagation();
      return;
    }
    if (h === "mer-info") return this._merInfo(this._config.entity);
    if (h === "flis") {
      if (el.dataset.kind === "lock") {
        const s = this._hass.states[el.dataset.entity];
        if (s) {
          this._hass.callService(
            "lock",
            s.state === "locked" ? "unlock" : "lock",
            { entity_id: el.dataset.entity }
          );
          return;
        }
      }
      return this._merInfo(el.dataset.entity);
    }
    if (h === "brytsone") {
      const id = el.dataset.sone;
      if (this._skjulteSoner.has(id)) this._skjulteSoner.delete(id);
      else this._skjulteSoner.add(id);
      this._signatur = "";
      return this._tegn();
    }
    if (h === "modus") return this._velgModus(el.dataset.modus);
    if (h === "tast") return this._tast(el.dataset.tegn);
    if (h === "slett") {
      this._kode = this._kode.slice(0, -1);
      this._feil = false;
      this._signatur = "";
      return this._tegn();
    }
    if (h === "lukk-tastatur") return this._lukkTastatur();
  }

  _merInfo(entityId) {
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  _velgModus(modusId) {
    const m = MODUSER.find((x) => x.id === modusId);
    if (!m) return;
    const p = this._panel();
    if (p && p.state === modusId) return; // allerede i denne modusen

    const krever =
      modusId === "disarmed" ? true : !!this._config.arm_requires_code;

    if (krever) {
      this._ventendeModus = m.tjeneste;
      this._kode = "";
      this._feil = false;
      this._ok = false;
      this._tastaturApent = true;
      this._signatur = "";
      this._tegn();
      this._rullTil();
      return;
    }
    this._kall(m.tjeneste, null);
  }

  /** Sørger for at tastaturet er synlig, uansett hvor kortet står i popupen. */
  _rullTil() {
    requestAnimationFrame(() => {
      try {
        this.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch (e) {
        try {
          this.scrollIntoView(true);
        } catch (e2) {
          /* ignorer */
        }
      }
    });
  }

  _tast(tegn) {
    const lengde = parseInt(this._config.code_length) || 4;
    if (this._kode.length >= lengde) return;
    this._feil = false;
    this._kode += tegn;
    this._signatur = "";
    this._tegn();
    if (this._kode.length === lengde) {
      const kode = this._kode;
      // Kort pause så siste prikk rekker å tegnes
      setTimeout(() => this._kall(this._ventendeModus || "alarm_disarm", kode), 180);
    }
  }

  async _kall(tjeneste, kode) {
    const data = { entity_id: this._config.entity };
    if (kode) data.code = kode;
    try {
      await this._hass.callService("alarm_control_panel", tjeneste, data);
      this._kode = "";
      if (this._tastaturApent) {
        this._ok = true;
        this._feil = false;
        this._signatur = "";
        this._tegn();
        setTimeout(() => this._lukkTastatur(), 1400);
      }
    } catch (err) {
      this._kode = "";
      this._feil = true;
      this._ok = false;
      this._signatur = "";
      this._tegn();
      setTimeout(() => {
        this._feil = false;
        this._signatur = "";
        this._tegn();
      }, 2500);
    }
  }

  _lukkTastatur() {
    this._tastaturApent = false;
    this._ventendeModus = null;
    this._kode = "";
    this._feil = false;
    this._ok = false;
    this._signatur = "";
    this._tegn();
  }
}

KiAlarmCard.styles = `
  :host { display: block; }
  .rot {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    position: relative;
    display: block;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- hero ---------- */
  .hero {
    border-radius: 26px;
    padding: 20px;
    margin-bottom: 12px;
    cursor: pointer;
    color: var(--gray100, #fff);
    background: var(--active-big, var(--primary-color));
  }
  .hero.hvile {
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .hero.venter { background: var(--orange, #f5a623); animation: ki-puls 1.6s ease-in-out infinite; }
  .hero.utlost { background: var(--red, #e5484d); animation: ki-puls .9s ease-in-out infinite; }
  @keyframes ki-puls { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.22); } }

  .hero-hode { display: flex; align-items: center; gap: 16px; }
  .hero-ikon {
    flex: 0 0 auto;
    width: 58px; height: 58px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .14);
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: 30px;
  }
  .hero-tekst { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .hero-tittel { font-size: 22px; font-weight: 600; line-height: 1.2; }
  .hero-under { font-size: 14px; font-weight: 500; opacity: .8; }
  .chips {
    display: flex; gap: 6px;
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .hero.hvile .chips { border-top-color: rgba(0, 0, 0, .12); }
  .chip { flex: 1; text-align: center; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall { font-size: 19px; font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; }
  .chip-tall span { font-size: 12px; font-weight: 600; opacity: .6; }

  /* ---------- modusknapper ---------- */
  .moduser { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .modus {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; height: 92px; border-radius: 22px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray800, var(--secondary-text-color));
    font-size: 13px; font-weight: 600;
    --mdc-icon-size: 26px;
    transition: background .25s ease, color .25s ease;
  }
  .modus.aktiv { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fff); }
  .modus.aktiv.av { background: var(--gray1000, var(--primary-text-color)); color: var(--gray200, #222); }
  .modus:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  /* ---------- soner ---------- */
  .sone + .sone { margin-top: 18px; }
  .sone-hode {
    display: flex; align-items: center; gap: 10px;
    padding: 0 6px 10px; cursor: pointer;
  }
  .sone-ikon {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--sone-farge, var(--gray800));
    --mdc-icon-size: 16px;
  }
  .sone-hode h3 {
    margin: 0; flex: 1;
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .sone-status { font-size: 12px; font-weight: 600; opacity: .55; color: var(--gray1000, var(--primary-text-color)); }
  .sone-status.avvik { opacity: 1; color: var(--orange, #f5a623); }
  .sone-pil { --mdc-icon-size: 18px; opacity: .45; color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease; }
  .sone-pil.ned { transform: rotate(0deg); }

  .fliser { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .flis {
    display: grid; grid-template-columns: 44px 1fr;
    align-items: center; gap: 10px;
    padding: 10px 12px 10px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    transition: background .2s ease, color .2s ease;
  }
  .flis.varsel { background: var(--flis-farge, var(--red)); color: var(--gray100, #fff); }
  .flis.mangler { opacity: .45; }
  .flis:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .flis-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    --mdc-icon-size: 21px;
    justify-self: end;
  }
  .flis.varsel .flis-ikon { background: rgba(250, 251, 252, .16); }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn {
    font-size: 14px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .flis-under { font-size: 12px; font-weight: 500; opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ---------- kodetastatur ---------- */
  .tastatur {
    position: relative;
    background: var(--gray200, var(--card-background-color));
    border-radius: 26px;
    padding: 28px 18px 22px;
    display: flex; flex-direction: column; gap: 18px;
    max-width: 340px;
    margin: 0 auto;
  }
  .tastatur.feil { animation: ki-rist .4s ease; }
  @keyframes ki-rist {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-9px); }
    75% { transform: translateX(9px); }
  }
  .tast-hode { text-align: center; display: flex; flex-direction: column; gap: 4px; }
  .tast-tittel { font-size: 17px; font-weight: 600; color: var(--gray1000, var(--primary-text-color)); }
  .tastatur.feil .tast-tittel { color: var(--red, #e5484d); }
  .tastatur.ok .tast-tittel { color: var(--green, #30a46c); }
  .tast-under { font-size: 12px; font-weight: 500; opacity: .6; color: var(--gray1000, var(--primary-text-color)); }
  .prikker { display: flex; gap: 14px; justify-content: center; margin-top: 10px; }
  .prikk {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(128, 128, 128, .5);
    box-sizing: border-box;
    transition: background .15s ease, border-color .15s ease;
  }
  .prikk.fylt { background: var(--gray1000, var(--primary-text-color)); border-color: var(--gray1000, var(--primary-text-color)); }
  .tastatur.feil .prikk.fylt { background: var(--red, #e5484d); border-color: var(--red, #e5484d); }
  .tastatur.ok .prikk.fylt { background: var(--green, #30a46c); border-color: var(--green, #30a46c); }

  .tastrad {
    display: grid;
    grid-template-columns: repeat(3, 68px);
    justify-content: center;
    gap: 16px;
  }
  .tast {
    width: 68px; height: 68px;
    aspect-ratio: 1 / 1;
    padding: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, .18);
    color: var(--gray1000, var(--primary-text-color));
    font-size: 24px; font-weight: 500;
    --mdc-icon-size: 22px;
    display: flex; align-items: center; justify-content: center;
    transition: filter .12s ease;
  }
  .tast:active { filter: brightness(1.35); }
  .tast.tom { background: transparent; pointer-events: none; }
  .tast:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }
  .lukk {
    position: absolute;
    top: 14px; right: 14px;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .18);
    color: var(--gray1000, var(--primary-text-color));
    display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: 26px;
    padding: 0;
  }
  .lukk:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  @media (max-width: 420px) {
    .fliser { grid-template-columns: 1fr; }
    .hero-tittel { font-size: 20px; }
    .modus { height: 84px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero.venter, .hero.utlost, .tastatur.feil { animation: none; }
    .sone-pil, .flis, .modus { transition: none; }
  }
`;

/* ───────────────────────────────────────────────────────────────── editor ── */

class KiAlarmCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.zones) this._config.zones = STANDARD_KONFIG().zones;
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange, type = "text") {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = type;
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _avkryssing(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "avkryss";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = !!verdi;
    inp.addEventListener("change", () => onChange(inp.checked));
    wrap.appendChild(inp);
    const s = document.createElement("span");
    s.textContent = label;
    wrap.appendChild(s);
    return wrap;
  }

  _velger(label, valg, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement("select");
    valg.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.value = verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    wrap.appendChild(sel);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      if (domener) p.includeDomains = domener;
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _fargefelt(verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>Farge ved avvik</span>`;
    const rad = document.createElement("div");
    rad.className = "fargerad";
    const prikk = document.createElement("i");
    prikk.className = "prikk";
    prikk.style.background = verdi || "var(--red)";
    const sel = document.createElement("select");
    FARGER.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.verdi;
      o.textContent = f.navn;
      sel.appendChild(o);
    });
    sel.value = FARGER.some((f) => f.verdi === verdi) ? verdi : FARGER[0].verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    rad.appendChild(prikk);
    rad.appendChild(sel);
    wrap.appendChild(rad);
    return wrap;
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiAlarmCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Alarmpanel</h4>";
    gen.appendChild(
      this._entitetsfelt(
        "Alarmpanel",
        this._config.entity,
        (v) => {
          this._config.entity = v;
          this._endret();
        },
        ["alarm_control_panel"]
      )
    );
    gen.appendChild(
      this._tekstfelt(
        "Antall siffer i koden",
        this._config.code_length || 4,
        (v) => {
          this._config.code_length = parseInt(v) || 4;
          this._endret();
        },
        "number"
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Krev kode også ved aktivering",
        this._config.arm_requires_code,
        (v) => {
          this._config.arm_requires_code = v;
          this._endret();
        }
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Koden tastes i kortet og sendes rett til alarmpanelet. Den lagres ikke i Home Assistant.";
    gen.appendChild(h);
    rot.appendChild(gen);

    /* Soner */
    this._config.zones.forEach((z, zi) => this._tegnSone(rot, z, zi));

    rot.appendChild(
      this._knapp("+ Ny sone", "hovedknapp", () => {
        this._config.zones.push({
          title: "Ny sone",
          icon: "mdi:shield",
          color: "var(--red)",
          kind: "opening",
          active_text: "Åpen",
          idle_text: "Lukket",
          items: [],
        });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnSone(rot, z, zi) {
    const boks = document.createElement("div");
    boks.className = "boks";

    const topp = document.createElement("div");
    topp.className = "sonetopp";
    const t = document.createElement("h4");
    t.textContent = z.title || "Uten navn";
    topp.appendChild(t);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (zi > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.zones.splice(zi, 1);
          this._config.zones.splice(zi - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (zi < this._config.zones.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.zones.splice(zi, 1);
          this._config.zones.splice(zi + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett sone", "mini fare", () => {
        this._config.zones.splice(zi, 1);
        this._endret();
        this._tegn();
      })
    );
    topp.appendChild(verktoy);
    boks.appendChild(topp);

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Overskrift", z.title, (v) => {
        z.title = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._ikonfelt(z.icon, (v) => {
        z.icon = v;
        this._endret();
      })
    );
    boks.appendChild(r1);

    const r2 = document.createElement("div");
    r2.className = "tokol";
    r2.appendChild(
      this._velger("Sensortype", SONETYPER, z.kind || "opening", (v) => {
        z.kind = v;
        this._endret();
      })
    );
    r2.appendChild(
      this._fargefelt(z.color, (v) => {
        z.color = v;
        this._endret();
        this._tegn();
      })
    );
    boks.appendChild(r2);

    const r3 = document.createElement("div");
    r3.className = "tokol";
    r3.appendChild(
      this._tekstfelt("Tekst ved avvik", z.active_text, (v) => {
        z.active_text = v;
        this._endret();
      })
    );
    r3.appendChild(
      this._tekstfelt("Tekst når i orden", z.idle_text, (v) => {
        z.idle_text = v;
        this._endret();
      })
    );
    boks.appendChild(r3);

    (z.items || []).forEach((it, ii) => {
      const noekkel = `${zi}:${ii}`;
      const d = document.createElement("details");
      d.className = "rad";
      d.open = this._apne.has(noekkel);
      d.addEventListener("toggle", () => {
        if (d.open) this._apne.add(noekkel);
        else this._apne.delete(noekkel);
      });
      const s = document.createElement("summary");
      s.textContent = it.name || it.entity || "Ny sensor";
      d.appendChild(s);

      const kropp = document.createElement("div");
      kropp.className = "radkropp";
      kropp.appendChild(
        this._entitetsfelt(
          "Sensor",
          it.entity,
          (v) => {
            it.entity = v;
            this._endret();
            this._tegn();
          },
          z.kind === "lock" ? ["lock"] : ["binary_sensor", "sensor"]
        )
      );
      const rad = document.createElement("div");
      rad.className = "tokol";
      rad.appendChild(
        this._tekstfelt("Visningsnavn", it.name, (v) => {
          it.name = v;
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(
        this._ikonfelt(it.icon, (v) => {
          if (v) it.icon = v;
          else delete it.icon;
          this._endret();
        })
      );
      kropp.appendChild(rad);
      kropp.appendChild(
        this._entitetsfelt(
          "Batterisensor (valgfritt)",
          it.battery,
          (v) => {
            if (v) it.battery = v;
            else delete it.battery;
            this._endret();
          },
          ["sensor"]
        )
      );
      kropp.appendChild(
        this._knapp("Slett sensor", "mini fare", () => {
          z.items.splice(ii, 1);
          this._apne.delete(noekkel);
          this._endret();
          this._tegn();
        })
      );
      d.appendChild(kropp);
      boks.appendChild(d);
    });

    boks.appendChild(
      this._knapp("+ Legg til sensor", "hovedknapp liten", () => {
        if (!z.items) z.items = [];
        z.items.push({ entity: "", name: "" });
        this._apne.add(`${zi}:${z.items.length - 1}`);
        this._endret();
        this._tegn();
      })
    );

    rot.appendChild(boks);
  }
}

KiAlarmCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
  .felt input, .felt select {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px;
    width: 100%; box-sizing: border-box;
  }
  .avkryss { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text-color); cursor: pointer; }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .fargerad { display: flex; align-items: center; gap: 8px; }
  .prikk { width: 14px; height: 14px; border-radius: 50%; display: inline-block; flex: 0 0 auto; }
  .sonetopp { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 5px 9px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  details.rad { border: 1px solid var(--divider-color); border-radius: 10px; padding: 8px 10px; }
  .radkropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

window.KI.define("ki-alarm-card", KiAlarmCard);
window.KI.define("ki-alarm-card-editor", KiAlarmCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-alarm-card",
  name: "KI Alarm",
  description: "Alarmsentral med soner, sensorstatus og kodetastatur.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-alarm-card feilet", e); }

/* ===== ki-energi-card-strom ===== */
try {
/**
 * ki-energi-card-strom.js  —  v1.0.0
 *
 * Energioversikt for Home Assistant.
 *   • To seksjoner: "Kategorier" (tverrgående, f.eks. oppvarming, belysning)
 *     og "Kurser" (sikringskurser per rom). Overlapp mellom dem er tilsiktet —
 *     en panelovn ligger både i Oppvarming og i Stue-kursen.
 *   • Hver seksjon sorteres synkende etter forbruk.
 *   • Brytere for kr/kWh, i dag/måned og prismodell.
 *   • Full GUI-editor: legg til/fjern seksjoner og rader, velg entiteter,
 *     ikon og farge.
 *
 * Legges i /config/www/ki-energi-card-strom.js og registreres som
 * JavaScript Module: /local/ki-energi-card-strom.js
 */

const KI_ENERGI_VERSION = "1.2.0";

console.info(
  `%c KI-ENERGI-CARD %c ${KI_ENERGI_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#f5a623;color:#1c1c1e;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── helpers ── */

const FARGER = [
  { navn: "Gul", verdi: "var(--yellow)" },
  { navn: "Oransje", verdi: "var(--orange)" },
  { navn: "Rød", verdi: "var(--red)" },
  { navn: "Rosa", verdi: "var(--pink)" },
  { navn: "Lilla", verdi: "var(--purple)" },
  { navn: "Blå", verdi: "var(--blue)" },
  { navn: "Grønn", verdi: "var(--green)" },
  { navn: "Grå", verdi: "var(--gray800)" },
];

const num = (hass, id) => {
  if (!id || !hass || !hass.states[id]) return null;
  const v = parseFloat(hass.states[id].state);
  return isNaN(v) ? null : v;
};

const fmt = (v, enhet) => {
  if (v === null) return "–";
  const des = v < 10 ? 2 : v < 100 ? 1 : 0;
  return (
    v.toLocaleString("nb-NO", {
      minimumFractionDigits: des,
      maximumFractionDigits: des,
    }) +
    " " +
    enhet
  );
};

/**
 * Finner kostnadsentiteten for gjeldende prismodell.
 * Rekkefølge når Norgespris er valgt:
 *   1. eksplisitt utfylt alt-entitet
 *   2. hovedentiteten + endelsen fra `alt_suffix`, hvis den finnes i HA
 *   3. hovedentiteten (fallback, så kortet aldri blir tomt)
 */
const finnKostnad = (hass, base, altBase, alt, suffix) => {
  if (!alt) return base;
  if (altBase) return altBase;
  if (suffix && base) {
    const kandidat = base + suffix;
    if (hass && hass.states[kandidat]) return kandidat;
  }
  return base;
};

/** Velger riktig entitet for en rad ut fra enhet/periode/prismodell. */
const velgEntitet = (rad, enhet, periode, alt, hass, suffix) => {
  if (enhet === "kwh") {
    return periode === "month" ? rad.energy_monthly : rad.energy_daily;
  }
  const base = periode === "month" ? rad.cost_monthly : rad.cost_daily;
  const altBase = periode === "month" ? rad.cost_monthly_alt : rad.cost_daily_alt;
  return finnKostnad(hass, base, altBase, alt, suffix);
};

/** Samme logikk for de valgfrie totalsensorene. */
const velgTotal = (totals, enhet, periode, alt, hass, suffix) => {
  if (!totals) return null;
  if (enhet === "kwh") {
    return periode === "month" ? totals.energy_monthly : totals.energy_daily;
  }
  const base = periode === "month" ? totals.cost_monthly : totals.cost_daily;
  const altBase =
    periode === "month" ? totals.cost_monthly_alt : totals.cost_daily_alt;
  return finnKostnad(hass, base, altBase, alt, suffix);
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-energi-card-strom",
  title: "Energi",
  price_entity: "sensor.totalpris_inkludert_grid_el_company_og_stromstotte",
  price_entity_alt: "sensor.norgespris_pris_na",
  alt_suffix: "_norgespris",
  default_unit: "kr",
  default_period: "day",
  default_price: "alt",
  groups: [
    {
      title: "Kategorier",
      subtitle: "På tvers av rom",
      items: [
        {
          name: "Oppvarming",
          icon: "mdi:heating-coil",
          color: "var(--red)",
          cost_daily: "sensor.um_daily_cost_oppvarming_kurs",
          cost_monthly: "sensor.um_monthly_cost_oppvarming_kurs",
          energy_daily: "sensor.oppvarming_energy_daily",
          energy_monthly: "sensor.oppvarming_energy_monthly",
        },
        {
          name: "Belysning",
          icon: "mdi:lamp",
          color: "var(--yellow)",
          cost_daily: "sensor.um_daily_cost_lights",
          cost_monthly: "sensor.um_monthly_cost_lights",
          energy_daily: "sensor.lys_energy_daily",
          energy_monthly: "sensor.lys_energy_monthly",
        },
        {
          name: "Hvitvarer",
          icon: "mdi:fridge",
          color: "var(--blue)",
          cost_daily: "sensor.um_daily_cost_hvitvarer",
          cost_monthly: "sensor.um_monthly_cost_hvitvarer",
          energy_daily: "sensor.hvitvarer_energy_daily",
          energy_monthly: "sensor.hvitvarer_energy_monthly",
        },
        {
          name: "Data og nettverk",
          icon: "mdi:nas",
          color: "var(--gray800)",
          cost_daily: "sensor.um_daily_cost_data",
          cost_monthly: "sensor.um_monthly_cost_data",
          energy_daily: "sensor.data_energy_daily",
          energy_monthly: "sensor.data_energy_monthly",
        },
      ],
    },
    {
      title: "Kurser",
      subtitle: "Per sikringskurs",
      items: [
        {
          name: "Varmtvannsbereder",
          icon: "mdi:water-boiler",
          color: "var(--orange)",
          cost_daily: "sensor.um_daily_cost_varmtvannsbereder_kurs",
          cost_monthly: "sensor.um_monthly_cost_varmtvannsbereder_kurs",
          energy_daily: "sensor.varmtvannsbereder_kurs_energy_daily",
          energy_monthly: "sensor.varmtvannsbereder_kurs_energy_monthly",
        },
        {
          name: "Stue",
          icon: "mdi:sofa",
          color: "var(--orange)",
          cost_daily: "sensor.um_daily_cost_stue_kurs",
          cost_monthly: "sensor.um_monthly_cost_stue_kurs",
          energy_daily: "sensor.stue_kurs_energy_daily",
          energy_monthly: "sensor.stue_kurs_energy_monthly",
        },
        {
          name: "Kjøkken",
          icon: "mdi:knife",
          color: "var(--green)",
          cost_daily: "sensor.um_daily_cost_kjokken_kurs",
          cost_monthly: "sensor.um_monthly_cost_kjokken_kurs",
          energy_daily: "sensor.kjokken_kurs_energy_daily",
          energy_monthly: "sensor.kjokken_kurs_energy_monthly",
        },
        {
          name: "Soverom og bad",
          icon: "mdi:bed-double-outline",
          color: "var(--purple)",
          cost_daily: "sensor.um_daily_cost_soverom_og_bad_kurs",
          cost_monthly: "sensor.um_monthly_cost_soverom_og_bad_kurs",
          energy_daily: "sensor.soverom_og_bad_kurs_energy_daily",
          energy_monthly: "sensor.soverom_og_bad_kurs_energy_monthly",
        },
        {
          name: "Vaskegang og do",
          icon: "mdi:washing-machine",
          color: "var(--pink)",
          cost_daily: "sensor.um_daily_cost_vaskegang_kurs",
          cost_monthly: "sensor.um_monthly_cost_vaskegang_kurs",
          energy_daily: "sensor.vaskegang_og_do_kurs_energy_daily",
          energy_monthly: "sensor.vaskegang_og_do_kurs_energy_monthly",
        },
        {
          name: "Gang og bod",
          icon: "mdi:door",
          color: "var(--blue)",
          cost_daily: "sensor.um_daily_cost_gang_og_bod_kurs",
          cost_monthly: "sensor.um_monthly_cost_gang_og_bod_kurs",
          energy_daily: "sensor.gang_og_bod_kurs_energy_daily",
          energy_monthly: "sensor.gang_og_bod_kurs_energy_monthly",
        },
      ],
    },
  ],
});

/* ──────────────────────────────────────────────────────────────── kortet ── */

class KiEnergiCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._enhet = "kr";
    this._periode = "day";
    this._alt = false;
    this._bygget = false;
    this._signatur = "";
    this._apne = new Set();
  }

  static getConfigElement() {
    return document.createElement("ki-energi-card-strom-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    if (!config.groups || !Array.isArray(config.groups)) {
      throw new Error("ki-energi-card-strom: 'groups' mangler i konfigurasjonen");
    }
    this._config = JSON.parse(JSON.stringify(config));
    this._enhet = config.default_unit === "kwh" ? "kwh" : "kr";
    this._periode = config.default_period === "month" ? "month" : "day";
    this._alt = config.default_price === "alt";
    this._bygget = false;
    this._signatur = "";
    this._apne = new Set();
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._oppdater();
  }

  getCardSize() {
    const rader = (this._config.groups || []).reduce(
      (n, g) => n + (g.items || []).length,
      0
    );
    return 4 + Math.ceil(rader / 2);
  }

  /* ---------------------------------------------------------- struktur -- */

  _bygg() {
    const harAlt = (this._config.groups || []).some((g) =>
      (g.items || []).some((i) => i.cost_daily_alt || i.cost_monthly_alt)
    );
    this._harAlt =
      harAlt || !!this._config.alt_suffix || !!this._config.price_entity_alt;

    this.shadowRoot.innerHTML = `
      <style>${KiEnergiCard.styles}</style>
      <ha-card>
        <section class="hero" id="hero">
          <div class="hero-top">
            <span class="hero-periode" id="heroPeriode"></span>
            <button class="pris-pille" id="prisPille" type="button"></button>
          </div>
          <div class="hero-sum" id="heroSum"></div>
          <div class="hero-bunn" id="heroBunn"></div>
        </section>

        <div class="brytere">
          <div class="pille" id="enhetPille">
            <button type="button" data-verdi="kr">Kroner</button>
            <button type="button" data-verdi="kwh">kWh</button>
          </div>
          <div class="pille" id="periodePille">
            <button type="button" data-verdi="day">I dag</button>
            <button type="button" data-verdi="month">Måneden</button>
          </div>
        </div>

        <div class="grupper" id="grupper"></div>
      </ha-card>
    `;

    const sr = this.shadowRoot;

    sr.getElementById("enhetPille").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      this._enhet = b.dataset.verdi;
      this._signatur = "";
      this._oppdater();
    });

    sr.getElementById("periodePille").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      this._periode = b.dataset.verdi;
      this._signatur = "";
      this._oppdater();
    });

    const prisPille = sr.getElementById("prisPille");
    if (this._harAlt) {
      prisPille.addEventListener("click", () => {
        this._alt = !this._alt;
        this._signatur = "";
        this._oppdater();
      });
    } else {
      prisPille.classList.add("statisk");
    }

    // Seksjonsskall bygges én gang; radene tegnes på nytt ved endring,
    // siden underkategorier kan felles ut og inn.
    const grupper = sr.getElementById("grupper");
    (this._config.groups || []).forEach((g, gi) => {
      const seksjon = document.createElement("section");
      seksjon.className = "gruppe";
      seksjon.innerHTML = `
        <header class="gruppe-topp">
          <h3>${this._esc(g.title || "Uten navn")}</h3>
          <div class="gruppe-hoyre">
            ${
              g.subtitle
                ? `<span class="gruppe-under">${this._esc(g.subtitle)}</span>`
                : ""
            }
            <span class="gruppe-sum" id="gsum-${gi}"></span>
          </div>
        </header>
        <div class="rader" id="rader-${gi}"></div>
      `;
      grupper.appendChild(seksjon);
    });

    grupper.addEventListener("click", (e) => {
      const el = e.target.closest("[data-sti]");
      if (!el) return;
      if (el.dataset.barn === "1") {
        if (this._apne.has(el.dataset.sti)) this._apne.delete(el.dataset.sti);
        else this._apne.add(el.dataset.sti);
        this._signatur = "";
        this._oppdater();
      } else if (el.dataset.entity) {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });

    this._bygget = true;
  }

  _esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  }

  _merInfo(gi, ii) {
    const rad = this._config.groups[gi].items[ii];
    const id = velgEntitet(
      rad,
      this._enhet,
      this._periode,
      this._alt,
      this._hass,
      this._config.alt_suffix
    );
    if (!id) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId: id };
    this.dispatchEvent(ev);
  }

  /** Entiteten som gjelder for et element med gjeldende bryterstilling. */
  _entFor(it) {
    return velgEntitet(
      it,
      this._enhet,
      this._periode,
      this._alt,
      this._hass,
      this._config.alt_suffix
    );
  }

  /**
   * Verdien til et element: egen sensor hvis den finnes, ellers summen av
   * underkategoriene. Slik kan «Panelovner» ha verdi uten egen sensor.
   */
  _verdi(it) {
    const egen = num(this._hass, this._entFor(it));
    if (egen !== null) return egen;
    const barn = it.children || [];
    if (!barn.length) return null;
    let sum = null;
    barn.forEach((b) => {
      const v = this._verdi(b);
      if (v !== null) sum = (sum || 0) + v;
    });
    return sum;
  }

  /** Tegner én rad, og under den barna hvis raden er felt ut. */
  _radHtml(it, sti, niva, topp, sum) {
    const enhetTekst = this._enhet === "kwh" ? "kWh" : "kr";
    const v = this._verdi(it);
    const barn = (it.children || []).filter(Boolean);
    const harBarn = barn.length > 0;
    const apen = this._apne.has(sti);
    const farge = it.color || "var(--gray800)";
    const ent = this._entFor(it);

    const andel = sum > 0 && v !== null ? (v / sum) * 100 : 0;
    const bredde = topp > 0 && v !== null ? (v / topp) * 100 : 0;

    let barnHtml = "";
    if (harBarn && apen) {
      const verdier = barn.map((b) => this._verdi(b));
      const gyldige = verdier.filter((x) => x !== null);
      const bSum = gyldige.reduce((a, b2) => a + b2, 0);
      const bTopp = gyldige.length ? Math.max(...gyldige) : 0;
      const rangert = barn
        .map((b, i) => ({ b, v: verdier[i], i }))
        .sort((a, b2) => {
          if (a.v === null && b2.v === null) return a.i - b2.i;
          if (a.v === null) return 1;
          if (b2.v === null) return -1;
          return b2.v - a.v;
        });
      barnHtml = `<div class="barn">${rangert
        .map((r) =>
          this._radHtml(
            r.b,
            `${sti}-${r.i}`,
            Math.min(niva + 1, 2),
            bTopp,
            bSum
          )
        )
        .join("")}</div>`;
    }

    return `
      <div class="radgruppe">
        <button type="button" class="rad n${niva} ${v === null ? "tom" : ""} ${
      apen ? "apen" : ""
    }"
          style="--rad-farge:${this._esc(farge)}"
          data-sti="${this._esc(sti)}"
          data-barn="${harBarn ? "1" : "0"}"
          data-entity="${this._esc(ent || "")}">
          <span class="ikon"><ha-icon icon="${this._esc(
            it.icon || "mdi:flash"
          )}"></ha-icon></span>
          <span class="midt">
            <span class="linje">
              <span class="navn">${this._esc(it.name || "Uten navn")}</span>
              <span class="verdi">${this._esc(fmt(v, enhetTekst))}</span>
            </span>
            <span class="linje">
              <span class="spor"><i style="width:${bredde.toFixed(1)}%"></i></span>
              <span class="andel">${
                v === null ? "" : andel.toFixed(0) + " %"
              }</span>
            </span>
          </span>
          ${
            harBarn
              ? `<span class="pil"><ha-icon icon="mdi:chevron-down"></ha-icon></span>`
              : ""
          }
        </button>
        ${barnHtml}
      </div>`;
  }

  /* ------------------------------------------------------------ verdier -- */

  _oppdater() {
    const hass = this._hass;
    if (!hass || !this._bygget) return;

    const enhetTekst = this._enhet === "kwh" ? "kWh" : "kr";
    const sr = this.shadowRoot;

    // Les alle verdier (inkludert summer fra underkategorier)
    const data = (this._config.groups || []).map((g) =>
      (g.items || []).map((it) => this._verdi(it))
    );

    const sign = JSON.stringify([
      data,
      this._enhet,
      this._periode,
      this._alt,
      [...this._apne].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    // Brytere
    sr.querySelectorAll("#enhetPille button").forEach((b) =>
      b.classList.toggle("aktiv", b.dataset.verdi === this._enhet)
    );
    sr.querySelectorAll("#periodePille button").forEach((b) =>
      b.classList.toggle("aktiv", b.dataset.verdi === this._periode)
    );

    // Rader, per gruppe
    let hovedgruppe = null;
    (this._config.groups || []).forEach((g, gi) => {
      const verdier = data[gi];
      const gyldige = verdier.filter((v) => v !== null);
      const sum = gyldige.reduce((a, b) => a + b, 0);
      const topp = gyldige.length ? Math.max(...gyldige) : 0;

      const gsum = sr.getElementById(`gsum-${gi}`);
      if (gsum) gsum.textContent = fmt(sum, enhetTekst);

      const rangert = verdier
        .map((v, ii) => ({ v, ii }))
        .sort((a, b) => {
          if (a.v === null && b.v === null) return a.ii - b.ii;
          if (a.v === null) return 1;
          if (b.v === null) return -1;
          return b.v - a.v;
        });

      const vert = sr.getElementById(`rader-${gi}`);
      if (vert) {
        vert.innerHTML = rangert
          .map((r) =>
            this._radHtml((g.items || [])[r.ii], `${gi}-${r.ii}`, 0, topp, sum)
          )
          .join("");
      }

      if (gi === 0) {
        const best = rangert.find((r) => r.v !== null);
        hovedgruppe = {
          sum,
          best: best ? g.items[best.ii] : null,
          verdi: best ? best.v : 0,
        };
      }
    });

    // Hero
    const totalId = velgTotal(
      this._config.totals,
      this._enhet,
      this._periode,
      this._alt,
      hass,
      this._config.alt_suffix
    );
    const totalFraSensor = num(hass, totalId);
    const totalVerdi =
      totalFraSensor !== null
        ? totalFraSensor
        : hovedgruppe
        ? hovedgruppe.sum
        : 0;

    sr.getElementById("heroPeriode").textContent =
      this._periode === "month" ? "Denne måneden" : "I dag";

    sr.getElementById("heroSum").innerHTML = `${this._esc(
      totalVerdi.toLocaleString("nb-NO", {
        minimumFractionDigits: totalVerdi < 100 ? 2 : 0,
        maximumFractionDigits: totalVerdi < 100 ? 2 : 0,
      })
    )}<span>${enhetTekst}</span>`;

    const prisId = this._alt
      ? this._config.price_entity_alt
      : this._config.price_entity;
    const pris = num(hass, prisId);
    const prisTekst =
      pris === null
        ? ""
        : ` · ${pris.toLocaleString("nb-NO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} kr/kWh`;
    sr.getElementById("prisPille").textContent =
      (this._alt ? "Norgespris" : "Spotpris") + prisTekst;

    const bunn = sr.getElementById("heroBunn");
    if (hovedgruppe && hovedgruppe.best && hovedgruppe.sum > 0) {
      const p = ((hovedgruppe.verdi / hovedgruppe.sum) * 100).toFixed(0);
      let tekst = `Størst: ${hovedgruppe.best.name} står for ${p} % av forbruket`;

      // Når totalen kommer fra hovedmåleren, si hvor mye kategoriene dekker.
      // Resten er forbruk som ikke er fordelt på noen kategori.
      if (totalFraSensor !== null && totalFraSensor > 0) {
        const dekning = (hovedgruppe.sum / totalFraSensor) * 100;
        if (dekning < 99.5) {
          tekst += ` · sporet ${dekning.toFixed(0)} % av totalen`;
        }
      }
      bunn.textContent = tekst;
    } else {
      bunn.textContent = "Venter på sensordata";
    }
  }
}

KiEnergiCard.styles = `
  :host { display: block; }
  ha-card {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---- hero ---- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 22px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .hero-periode { font-size: 13px; font-weight: 600; opacity: .75; }
  .pris-pille {
    background: rgba(0, 0, 0, .16);
    color: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 11px;
    white-space: nowrap;
  }
  .pris-pille.statisk { pointer-events: none; }
  .pris-pille:focus-visible { outline: 2px solid var(--gray100, #fff); outline-offset: 2px; }
  .hero-sum {
    font-size: 34px;
    font-weight: 700;
    line-height: 1.15;
    margin: 4px 0 2px;
    font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 17px; font-weight: 600; opacity: .75; margin-left: 5px; }
  .hero-bunn { font-size: 13px; opacity: .8; }

  /* ---- brytere ---- */
  .brytere {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  .pille {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background: var(--gray200, var(--card-background-color));
    border-radius: 16px;
    padding: 4px;
    height: 44px;
    box-sizing: border-box;
  }
  .pille button {
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .5;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    opacity: 1;
  }
  .pille button:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }

  /* ---- grupper ---- */
  .gruppe + .gruppe { margin-top: 20px; }
  .gruppe-topp {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 0 6px 8px;
  }
  .gruppe-topp h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .gruppe-hoyre { display: flex; align-items: baseline; gap: 10px; }
  .gruppe-under { font-size: 12px; opacity: .5; color: var(--gray1000, var(--primary-text-color)); }
  .gruppe-sum {
    font-size: 13px;
    font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .75;
    font-variant-numeric: tabular-nums;
  }
  .rader { display: flex; flex-direction: column; gap: 8px; }
  .radgruppe { display: flex; flex-direction: column; gap: 8px; }
  .barn {
    display: flex; flex-direction: column; gap: 6px;
    padding-left: 16px;
    border-left: 2px solid rgba(128, 128, 128, .22);
    margin-left: 20px;
  }
  .pil {
    --mdc-icon-size: 20px;
    opacity: .4;
    color: var(--gray1000, var(--primary-text-color));
    transition: transform .2s ease;
    align-self: center;
  }
  .rad.apen .pil { transform: rotate(180deg); opacity: .8; }
  .rad.apen { background: var(--gray400, rgba(128, 128, 128, .22)); }

  /* nivåer: mindre og tettere jo dypere */
  .rad.n1 { height: 62px; border-radius: 15px; padding: 10px 12px 10px 6px; }
  .rad.n1 .ikon { width: 36px; height: 36px; }
  .rad.n1 .ikon ha-icon { --mdc-icon-size: 19px; }
  .rad.n1 .navn, .rad.n1 .verdi { font-size: 14px; }
  .rad.n2 { height: 54px; border-radius: 13px; }
  .rad.n2 .ikon { width: 30px; height: 30px; }
  .rad.n2 .ikon ha-icon { --mdc-icon-size: 16px; }
  .rad.n2 .navn, .rad.n2 .verdi { font-size: 13px; }
  .rad.n2 .spor { height: 5px; }

  /* ---- rad ---- */
  .rad {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) auto;
    align-items: center;
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px;
    padding: 12px 14px 12px 8px;
    text-align: left;
    color: var(--gray1000, var(--primary-text-color));
  }
  .rad:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .rad.tom { opacity: .45; }
  .ikon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .12);
    color: var(--rad-farge, var(--gray800));
    --mdc-icon-size: 24px;
  }
  .midt { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
  .linje { display: flex; align-items: center; gap: 8px; }
  .navn {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .verdi { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .spor {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(0, 0, 0, .13);
    overflow: hidden;
  }
  .spor i {
    display: block;
    height: 100%;
    width: 0;
    border-radius: 3px;
    background: var(--rad-farge, var(--gray800));
    transition: width .4s ease;
  }
  .andel {
    font-size: 11px;
    font-weight: 700;
    opacity: .55;
    min-width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 420px) {
    .brytere { gap: 6px; }
    .pille { padding: 3px; gap: 3px; }
    .pille button { font-size: 12px; }
    .hero-sum { font-size: 30px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .spor i, .pille button { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

const FELTER = [
  { key: "cost_daily", label: "Kostnad i dag (kr)" },
  { key: "cost_monthly", label: "Kostnad denne måneden (kr)" },
  { key: "energy_daily", label: "Forbruk i dag (kWh)" },
  { key: "energy_monthly", label: "Forbruk denne måneden (kWh)" },
  { key: "cost_daily_alt", label: "Kostnad i dag – Norgespris" },
  { key: "cost_monthly_alt", label: "Kostnad denne måneden – Norgespris" },
];

class KiEnergiCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickers();
  }

  async _lastPickers() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({
        type: "entities",
        entities: [],
      });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.groups) this._config.groups = STANDARD_KONFIG().groups;
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    const ev = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(ev);
  }

  /* -- små byggeklosser -- */

  _tekstfelt(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = verdi || "";
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = ["sensor"];
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt bred";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _fargefelt(verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>Farge</span>`;
    const rad = document.createElement("div");
    rad.className = "fargerad";
    const sel = document.createElement("select");
    FARGER.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.verdi;
      o.textContent = f.navn;
      sel.appendChild(o);
    });
    const egen = document.createElement("option");
    egen.value = "__egen__";
    egen.textContent = "Egendefinert…";
    sel.appendChild(egen);

    const kjent = FARGER.some((f) => f.verdi === verdi);
    sel.value = kjent ? verdi : "__egen__";

    const fri = document.createElement("input");
    fri.type = "text";
    fri.placeholder = "f.eks. #ff9500";
    fri.value = kjent ? "" : verdi || "";
    fri.hidden = kjent;

    const prikk = document.createElement("i");
    prikk.className = "prikk";
    prikk.style.background = verdi || "var(--gray800)";

    sel.addEventListener("change", () => {
      if (sel.value === "__egen__") {
        fri.hidden = false;
        fri.focus();
      } else {
        fri.hidden = true;
        onChange(sel.value);
      }
    });
    fri.addEventListener("change", () => onChange(fri.value.trim()));

    rad.appendChild(prikk);
    rad.appendChild(sel);
    rad.appendChild(fri);
    wrap.appendChild(rad);
    return wrap;
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  /* -- hovedtegning -- */

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiEnergiCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = `<h4>Generelt</h4>`;
    gen.appendChild(
      this._tekstfelt("Tittel", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    gen.appendChild(
      this._entitetsfelt(
        "Spotpris nå",
        this._config.price_entity,
        (v) => {
          this._config.price_entity = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._entitetsfelt(
        "Norgespris nå",
        this._config.price_entity_alt,
        (v) => {
          this._config.price_entity_alt = v;
          this._endret();
        }
      )
    );

    gen.appendChild(
      this._tekstfelt(
        "Endelse for Norgespris-sensorer (f.eks. _norgespris)",
        this._config.alt_suffix,
        (v) => {
          if (v) this._config.alt_suffix = v;
          else delete this._config.alt_suffix;
          this._endret();
        }
      )
    );
    const suffikshjelp = document.createElement("p");
    suffikshjelp.className = "hjelp";
    suffikshjelp.textContent =
      "Med endelse fylt ut finner kortet Norgespris-sensorene selv, så lenge de heter det samme som spotpris-sensorene pluss endelsen. Rader der du fyller ut feltene manuelt overstyrer dette.";
    gen.appendChild(suffikshjelp);

    const valg = document.createElement("div");
    valg.className = "trekol";
    valg.appendChild(
      this._velger(
        "Viser først",
        [
          ["kr", "Kroner"],
          ["kwh", "kWh"],
        ],
        this._config.default_unit || "kr",
        (v) => {
          this._config.default_unit = v;
          this._endret();
        }
      )
    );
    valg.appendChild(
      this._velger(
        "Periode",
        [
          ["day", "I dag"],
          ["month", "Måned"],
        ],
        this._config.default_period || "day",
        (v) => {
          this._config.default_period = v;
          this._endret();
        }
      )
    );
    valg.appendChild(
      this._velger(
        "Prismodell",
        [
          ["alt", "Norgespris"],
          ["main", "Spotpris"],
        ],
        this._config.default_price || "alt",
        (v) => {
          this._config.default_price = v;
          this._endret();
        }
      )
    );
    gen.appendChild(valg);
    rot.appendChild(gen);

    /* Totalsensorer */
    const tot = document.createElement("details");
    tot.className = "boks";
    tot.innerHTML = `<summary>Totalsensorer (valgfritt)</summary>
      <p class="hjelp">Uten disse regnes totalen som summen av første seksjon,
      slik at enheter som ligger i både kategori og kurs ikke telles dobbelt.</p>`;
    if (!this._config.totals) this._config.totals = {};
    [
      ["cost_daily", "Kostnad i dag – spotpris"],
      ["cost_monthly", "Kostnad denne måneden – spotpris"],
      ["cost_daily_alt", "Kostnad i dag – Norgespris"],
      ["cost_monthly_alt", "Kostnad denne måneden – Norgespris"],
      ["energy_daily", "Forbruk i dag"],
      ["energy_monthly", "Forbruk denne måneden"],
    ].forEach(([k, l]) => {
      tot.appendChild(
        this._entitetsfelt(l, this._config.totals[k], (v) => {
          this._config.totals[k] = v;
          this._endret();
        })
      );
    });
    rot.appendChild(tot);

    /* Seksjoner */
    this._config.groups.forEach((g, gi) => this._tegnGruppe(rot, g, gi));

    const legg = this._knapp("+ Ny seksjon", "hovedknapp", () => {
      this._config.groups.push({ title: "Ny seksjon", items: [] });
      this._endret();
      this._tegn();
    });
    rot.appendChild(legg);
  }

  _velger(label, valg, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement("select");
    valg.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.value = verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    wrap.appendChild(sel);
    return wrap;
  }

  /**
   * Én rad i editoren. Kalles rekursivt for underkategorier, slik at
   * Oppvarming kan ha Panelovner, som igjen har hver enkelt ovn.
   */
  _tegnRad(liste, it, ii, noekkel, dybde) {
    const d = document.createElement("details");
    d.className = "rad dybde" + dybde;
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });

    const s = document.createElement("summary");
    const antBarn = (it.children || []).length;
    s.innerHTML = `<i class="prikk" style="background:${
      it.color || "var(--gray800)"
    }"></i><span>${it.name || "Uten navn"}</span>${
      antBarn ? `<em>${antBarn}</em>` : ""
    }`;
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "radkropp";

    const rad1 = document.createElement("div");
    rad1.className = "tokol";
    rad1.appendChild(
      this._tekstfelt("Navn", it.name, (v) => {
        it.name = v;
        this._endret();
        this._tegn();
      })
    );
    rad1.appendChild(
      this._ikonfelt(it.icon, (v) => {
        it.icon = v;
        this._endret();
      })
    );
    kropp.appendChild(rad1);
    kropp.appendChild(
      this._fargefelt(it.color, (v) => {
        it.color = v;
        this._endret();
        this._tegn();
      })
    );

    const harBarn = (it.children || []).length > 0;
    if (harBarn) {
      const p = document.createElement("p");
      p.className = "hjelp";
      p.textContent =
        "Har underkategorier. Egne sensorer er valgfrie — uten dem summeres barna.";
      kropp.appendChild(p);
    }

    FELTER.forEach((f) => {
      kropp.appendChild(
        this._entitetsfelt(f.label, it[f.key], (v) => {
          if (v) it[f.key] = v;
          else delete it[f.key];
          this._endret();
        })
      );
    });

    // Underkategorier
    const ub = document.createElement("div");
    ub.className = "underboks";
    ub.innerHTML = `<div class='undertittel'>Underkategorier${
      dybde >= 1 ? " (siste nivå)" : ""
    }</div>`;
    (it.children || []).forEach((barn, bi) => {
      ub.appendChild(
        this._tegnRad(it.children, barn, bi, `${noekkel}:${bi}`, dybde + 1)
      );
    });
    if (dybde < 2) {
      ub.appendChild(
        this._knapp("+ Legg til underkategori", "hovedknapp liten", () => {
          if (!it.children) it.children = [];
          it.children.push({
            name: "Ny underkategori",
            icon: it.icon || "mdi:flash",
            color: it.color,
          });
          this._apne.add(`${noekkel}:${it.children.length - 1}`);
          this._endret();
          this._tegn();
        })
      );
    }
    kropp.appendChild(ub);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    verktoy.appendChild(
      this._knapp("Dupliser", "mini", () => {
        liste.splice(ii + 1, 0, JSON.parse(JSON.stringify(it)));
        this._endret();
        this._tegn();
      })
    );
    verktoy.appendChild(
      this._knapp("Slett", "mini fare", () => {
        liste.splice(ii, 1);
        this._apne.delete(noekkel);
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(verktoy);

    d.appendChild(kropp);
    return d;
  }

  _tegnGruppe(rot, g, gi) {
    const boks = document.createElement("div");
    boks.className = "boks gruppe";

    const topp = document.createElement("div");
    topp.className = "gruppetopp";
    const h = document.createElement("h4");
    h.textContent = g.title || "Uten navn";
    topp.appendChild(h);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (gi > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.groups.splice(gi, 1);
          this._config.groups.splice(gi - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (gi < this._config.groups.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.groups.splice(gi, 1);
          this._config.groups.splice(gi + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett seksjon", "mini fare", () => {
        this._config.groups.splice(gi, 1);
        this._endret();
        this._tegn();
      })
    );
    topp.appendChild(verktoy);
    boks.appendChild(topp);

    const navnrad = document.createElement("div");
    navnrad.className = "tokol";
    navnrad.appendChild(
      this._tekstfelt("Overskrift", g.title, (v) => {
        g.title = v;
        this._endret();
        this._tegn();
      })
    );
    navnrad.appendChild(
      this._tekstfelt("Undertekst", g.subtitle, (v) => {
        g.subtitle = v;
        this._endret();
      })
    );
    boks.appendChild(navnrad);

    (g.items || []).forEach((it, ii) => {
      boks.appendChild(this._tegnRad(g.items, it, ii, `${gi}:${ii}`, 0));
    });

    boks.appendChild(
      this._knapp("+ Legg til rad", "hovedknapp liten", () => {
        if (!g.items) g.items = [];
        g.items.push({
          name: "Ny rad",
          icon: "mdi:flash",
          color: "var(--blue)",
        });
        this._apne.add(`${gi}:${g.items.length - 1}`);
        this._endret();
        this._tegn();
      })
    );

    rot.appendChild(boks);
  }
}

KiEnergiCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); }
  .felt input[type="text"], .felt select {
    font: inherit;
    font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 8px 10px;
    width: 100%;
    box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .trekol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .fargerad { display: flex; align-items: center; gap: 8px; }
  .prikk {
    width: 14px; height: 14px; border-radius: 50%;
    display: inline-block; flex: 0 0 auto;
  }
  .gruppetopp { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini {
    background: transparent;
    color: var(--primary-text-color);
    font-size: 12px;
    padding: 5px 9px;
  }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  details.rad {
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 10px;
  }
  details.rad summary { display: flex; align-items: center; gap: 8px; }
  details.rad summary em {
    font-style: normal; font-size: 11px; font-weight: 700;
    padding: 2px 7px; border-radius: 8px;
    background: var(--divider-color); color: var(--secondary-text-color);
  }
  details.rad.dybde1 { border-style: dashed; }
  details.rad.dybde2 { border-style: dotted; }
  .radkropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  @media (max-width: 500px) {
    .tokol, .trekol { grid-template-columns: 1fr; }
  }
`;

window.KI.define("ki-energi-card-strom", KiEnergiCard);
window.KI.define("ki-energi-card-strom-editor", KiEnergiCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energi-card-strom",
  name: "KI Energi",
  description:
    "Energiforbruk gruppert i kategorier og kurser, sortert etter størst forbruk.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-energi-card-strom feilet", e); }

/* ===== ki-energi-card ===== */
try {
/**
 * ki-energi-card.js
 * Frontend for KI-energimotoren (pyscript ki_energi.py).
 *
 *  Enkel     : status med timebudsjett, forklaring, laster og bereder
 *  Avansert  : prognose, overstyring, statistikk, innstillinger, beslutningslogg
 *
 * Kopier til /config/www/ki-energi-card.js og legg til som ressurs:
 *   URL:  /local/ki-energi-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-energi-card
 */

const KI_ENERGI_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-ENERGI-CARD %c ${KI_ENERGI_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#4caf50;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const SONE_TEKST = {
  gronn: "God margin",
  gul: "Nærmer seg grensen",
  oransje: "Liten margin",
  rod: "Fare for ny topp",
  kritisk: "Kritisk",
  fallback: "Trygg fallback",
  av: "Motoren er av",
};

const HANDLING = {
  normal: { tekst: "Normal", klasse: "ok" },
  senket: { tekst: "Senket", klasse: "advarsel" },
  utsatt: { tekst: "Utsatt", klasse: "advarsel" },
  "på": { tekst: "På", klasse: "ok" },
  av: { tekst: "Av", klasse: "nøytral" },
  utilgjengelig: { tekst: "Utilgjengelig", klasse: "feil" },
};

const escE = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfE = (v, d) => { const n = Number(v); return isFinite(n) ? n.toFixed(d).replace(".", ",") : "–"; };

class KiEnergiCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-energi-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-energi-card" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._apneSoner = new Set();
  }

  setConfig(config) {
    this._config = Object.assign({
      title: "",
      default_view: "enkel",
      remember_view: true,
      status: "sensor.ki_energi_status",
      laster: "sensor.ki_laster",
      bereder: "sensor.ki_bereder",
      logg: "sensor.ki_beslutningslogg",
      tau: "sensor.ki_tidskonstanter",
    }, config || {});
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 24 : 12; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-energi-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-energi-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|";
    for (const id of this._watched) {
      const s = hass.states[id];
      sig += (s ? s.state + (s.last_updated || "") : "-") + ",";
    }
    if (sig !== this._sig) { this._sig = sig; this._update(); }
  }

  /* ------------------------------------------------------------ */

  _build() {
    const c = this._config;
    this._watched = new Set([c.status, c.laster, c.bereder, c.logg, c.tau,
      "input_boolean.ki_energi_hovedbryter", "input_boolean.ki_skyggemodus",
      "input_boolean.ki_dynamisk_grense", "input_boolean.ki_prediktiv_forvarming",
      "input_boolean.ki_laering_tau", "input_boolean.ki_solkompensasjon",
      "input_boolean.ki_nattsenk_okonomi", "input_boolean.ki_bereder_styring",
      "input_boolean.ki_legionella_aktiv", "input_boolean.ki_handkle_styring",
      "input_boolean.ki_energi_varsler",
      "input_number.ki_maks_time_kwh", "input_number.ki_mal_snitt_kwh",
      "input_number.ki_komfort_vekt", "input_number.ki_shed_gulv_maks",
      "input_number.ki_shed_panel_maks",
      "input_number.ki_stat_unngatte_topper", "input_number.ki_stat_shed_hendelser",
      "input_number.ki_stat_flyttet_kwh", "input_number.ki_stat_spart_kwh",
      "input_text.ki_varsel_mottakere",
      "sensor.nettleie_elvia_kapasitetstrinn", "sensor.nettleie_elvia_margin_til_neste_trinn",
      "sensor.nettleie_elvia_toppforbruk", "sensor.nettleie_elvia_toppforbruk_2",
      "sensor.nettleie_elvia_toppforbruk_3",
      "sensor.ki_uregulert_effekt", "sensor.ki_styrt_effekt", "sensor.strommaler_effekt",
    ]);

    this.shadowRoot.innerHTML = `<style>${KiEnergiCard.styles}</style>
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escE(c.title)}</div>` : ""}
          <div id="hero"></div>
          <div class="switch" role="tablist">
            <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
            <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
          </div>
          <div id="budsjett"></div>
          <div id="laster"></div>
          <div class="avansert-kun">
            <div id="topper"></div>
            <div id="tau"></div>
            <div id="statistikk"></div>
            <div id="innstillinger"></div>
            <div id="logg"></div>
          </div>
        </div>
      </ha-card>`;

    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _st(id) { return this._hass.states[id]; }
  _attr(id, n, d) { const s = this._st(id); return s && s.attributes[n] !== undefined ? s.attributes[n] : d; }

  /* ------------------------------------------------------------ */

  _update() {
    if (!this._hass || !this._built) return;
    this._renderHero();
    this._renderBudsjett();
    this._renderLaster();
    if (this._view === "avansert") {
      this._renderTopper();
      this._renderTau();
      this._renderStatistikk();
      this._renderInnstillinger();
      this._renderLogg();
    }
  }

  _renderHero() {
    const s = this._st(this._config.status);
    const sone = s ? s.state : "ukjent";
    const forklaring = this._attr(this._config.status, "forklaring", "Venter på motoren …");
    const skygge = this._attr(this._config.status, "skyggemodus", false);
    const forbrukt = Number(this._attr(this._config.status, "forbrukt_kwh", NaN));
    const grense = Number(this._attr(this._config.status, "grense_kwh", NaN));
    const pct = isFinite(forbrukt) && isFinite(grense) && grense > 0
      ? Math.max(0, Math.min(100, (forbrukt / grense) * 100)) : 0;
    const omkrets = 2 * Math.PI * 43;

    this._root.getElementById("hero").innerHTML = `
      <div class="hero" data-sone="${escE(sone)}">
        <div class="ring" data-action="more" data-entity="${escE(this._config.status)}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-spor" cx="50" cy="50" r="43"></circle>
            <circle class="ring-fyll" cx="50" cy="50" r="43"
              style="stroke-dasharray:${omkrets};stroke-dashoffset:${omkrets * (1 - pct / 100)}"></circle>
          </svg>
          <div class="ring-tall">${isFinite(pct) ? Math.round(pct) : "–"}<span>%</span></div>
        </div>
        <div class="hero-tekst">
          <div class="hero-navn">${escE(SONE_TEKST[sone] || sone)}${skygge ? ' <span class="merke">skygge</span>' : ""}</div>
          <div class="hero-forklaring">${escE(forklaring)}</div>
        </div>
      </div>`;
  }

  _renderBudsjett() {
    const a = (n, d) => this._attr(this._config.status, n, d);
    const igjen = Number(a("igjen_kwh", NaN));
    const min = a("minutter_igjen", "–");
    const tillatt = Number(a("tillatt_effekt_kw", NaN));
    const forventet = Number(a("forventet_effekt_kw", NaN));
    const uregulert = Number(a("uregulert_kw", NaN));
    const u60 = Number(a("uregulert_60_kw", NaN));
    const ledig = Number(a("ledig_kw", NaN));
    const grensegrunn = a("grense_grunn", "");
    const usikker = a("usikkert_grunnlag", false);
    const bredde = isFinite(forventet) && isFinite(tillatt) && tillatt > 0
      ? Math.max(0, Math.min(100, (forventet / tillatt) * 100)) : 0;

    this._root.getElementById("budsjett").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Timebudsjett</span><span class="blokk-sub">${min} min igjen av timen</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(igjen, 2)}</b><span>kWh igjen</span></div>
          <div class="tall"><b>${nfE(tillatt, 2)}</b><span>kW tillatt nå</span></div>
          <div class="tall"><b>${nfE(forventet, 2)}</b><span>kW forventet</span></div>
        </div>
        <div class="spor"><div class="fyll" style="width:${bredde}%"></div></div>
        <div class="under">
          <span>Uregulert nå ${nfE(uregulert, 2)} kW · om en time ${nfE(u60, 2)} kW</span>
          <span>${isFinite(ledig) ? nfE(ledig, 2) + " kW ledig" : ""}</span>
        </div>
        ${grensegrunn ? `<div class="notat">${escE(grensegrunn)}</div>` : ""}
        ${usikker ? `<div class="notat advarsel-tekst">Timesmåleren mangler — motoren regner på øyeblikkseffekt</div>` : ""}
      </div>`;
  }

  _renderLaster() {
    const liste = this._attr(this._config.laster, "laster", []) || [];
    const enkel = this._view !== "avansert";
    const vist = enkel ? liste.filter((l) => l.handling !== "normal" || (l.naa !== null && l.mal !== null)) : liste;

    const rader = vist.map((l) => {
      const h = HANDLING[l.handling] || { tekst: l.handling || "–", klasse: "nøytral" };
      const apen = this._apneSoner.has(l.key);
      const temp = l.naa !== null && l.naa !== undefined
        ? `${nfE(l.naa, 1)}° → ${l.settpunkt !== null && l.settpunkt !== undefined ? nfE(l.settpunkt, 1) : nfE(l.mal, 1)}°`
        : `${nfE(l.effekt, 2)} kW`;
      return `
        <div class="last ${apen ? "apen" : ""}" data-key="${escE(l.key)}">
          <div class="last-hode" data-action="apne" data-key="${escE(l.key)}">
            <div class="prikk p-${h.klasse}"></div>
            <div class="last-tekst">
              <div class="last-navn">${escE(l.navn)}${l.overstyrt ? ' <span class="merke">manuell</span>' : ""}</div>
              <div class="last-forklaring">${escE(l.forklaring || "")}</div>
            </div>
            <div class="last-verdi">${escE(temp)}</div>
          </div>
          <div class="last-kropp">
            <div class="last-fakta">
              <span>Prioritet ${escE(l.prio)}</span>
              <span>${escE(l.type)}</span>
              <span>${nfE(l.effekt, 2)} kW</span>
              <span class="badge b-${h.klasse}">${escE(h.tekst)}</span>
            </div>
            ${l.type !== "bryter" ? `
              <div class="overstyr">
                <div class="ov-tittel">Overstyr midlertidig</div>
                <div class="ov-rad">
                  <div class="steg" data-action="ov-temp" data-key="${escE(l.key)}" data-dir="-1">−</div>
                  <div class="ov-verdi" data-ov="${escE(l.key)}">${nfE(l.mal, 1)}</div>
                  <div class="steg" data-action="ov-temp" data-key="${escE(l.key)}" data-dir="1">+</div>
                  <div class="ov-knapp" data-action="ov-sett" data-key="${escE(l.key)}" data-min="120">2 t</div>
                  <div class="ov-knapp" data-action="ov-sett" data-key="${escE(l.key)}" data-min="360">6 t</div>
                  ${l.overstyrt ? `<div class="ov-knapp fjern" data-action="ov-fjern" data-key="${escE(l.key)}">Fjern</div>` : ""}
                </div>
              </div>` : ""}
          </div>
        </div>`;
    }).join("");

    this._root.getElementById("laster").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Laster</span><span class="blokk-sub">Sortert etter prioritet i motoren</span></div>
        ${rader || '<div class="notat">Ingen laster rapportert ennå.</div>'}
      </div>`;
  }

  _renderTopper() {
    const t = ["sensor.nettleie_elvia_toppforbruk", "sensor.nettleie_elvia_toppforbruk_2", "sensor.nettleie_elvia_toppforbruk_3"]
      .map((id) => Number((this._st(id) || {}).state));
    const trinn = (this._st("sensor.nettleie_elvia_kapasitetstrinn") || {}).state || "–";
    const margin = (this._st("sensor.nettleie_elvia_margin_til_neste_trinn") || {}).state;
    const snitt = t.every(isFinite) ? (t[0] + t[1] + t[2]) / 3 : NaN;
    const b = this._st(this._config.bereder);
    const ba = b ? b.attributes : {};

    this._root.getElementById("topper").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Månedens topper</span><span class="blokk-sub">${escE(trinn)}</span></div>
        <div class="tall-rutenett">
          ${t.map((v, i) => `<div class="tall"><b>${nfE(v, 2)}</b><span>topp ${i + 1}</span></div>`).join("")}
        </div>
        <div class="under"><span>Snitt ${nfE(snitt, 2)} kWh — dette er tallet Elvia fakturerer etter</span>
          <span>${margin !== undefined ? "Margin " + escE(margin) : ""}</span></div>
      </div>
      <div class="blokk">
        <div class="blokk-hode"><span>Varmtvann</span><span class="blokk-sub">${escE(b ? b.state : "–")}</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(ba.minutter_i_dag, 0)}</b><span>min i dag</span></div>
          <div class="tall"><b>${nfE(ba.mangler_minutter, 0)}</b><span>min igjen</span></div>
          <div class="tall"><b>${nfE(ba.dager_siden_legionella, 0)}</b><span>d siden legionella</span></div>
        </div>
        <div class="notat">${escE(ba.forklaring || "")}</div>
        <div class="hurtig">
          <div class="mini" data-action="tjeneste" data-domene="pyscript" data-tjeneste="ki_legionella_na">Kjør legionella nå</div>
          <div class="mini" data-action="more" data-entity="switch.varmtvannsbereder">Åpne berederen</div>
        </div>
      </div>`;
  }

  _renderTau() {
    const soner = this._attr(this._config.tau, "soner", {}) || {};
    const rader = Object.entries(soner).map(([navn, v]) => `
      <div class="rad rad-les">
        <div class="rad-navn">${escE(navn)}</div>
        <div class="rad-verdi">${v.tau_timer ? nfE(v.tau_timer, 1) + " t" : "–"} · ${v.grader_per_time ? nfE(v.grader_per_time, 1) + " °C/t" : "–"} <span class="svak">(${v.malinger || 0})</span></div>
      </div>`).join("");
    this._root.getElementById("tau").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Innlærte tidskonstanter</span><span class="blokk-sub">Tidskonstant · oppvarming · målinger</span></div>
        ${rader || '<div class="notat">Motoren har ikke lært nok ennå. Tallene kommer etter noen døgn.</div>'}
      </div>`;
  }

  _renderStatistikk() {
    const g = (id) => Number((this._st(id) || {}).state);
    this._root.getElementById("statistikk").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Denne måneden</span><span class="blokk-sub">Estimat, ikke måling</span></div>
        <div class="tall-rutenett">
          <div class="tall"><b>${nfE(g("input_number.ki_stat_unngatte_topper"), 0)}</b><span>unngåtte topper</span></div>
          <div class="tall"><b>${nfE(g("input_number.ki_stat_shed_hendelser"), 0)}</b><span>utkoblinger</span></div>
          <div class="tall"><b>${nfE(g("input_number.ki_stat_flyttet_kwh"), 2)}</b><span>kWh flyttet</span></div>
        </div>
        <div class="notat">Flyttet energi er varme som ble utsatt til senere i timen eller døgnet. Tallene nullstilles den 1.</div>
      </div>`;
  }

  _renderInnstillinger() {
    const brytere = [
      ["input_boolean.ki_energi_hovedbryter", "Energimotor", "Hovedbryter"],
      ["input_boolean.ki_skyggemodus", "Skyggemodus", "Regner og logger, styrer ingenting"],
      ["input_boolean.ki_dynamisk_grense", "Dynamisk grense", "Regner mot snittet av tre topper"],
      ["input_boolean.ki_prediktiv_forvarming", "Prediktiv forvarming", "Starter tidlig ut fra målt oppvarmingsrate"],
      ["input_boolean.ki_laering_tau", "Lær tidskonstanter", "Måler treghet per sone"],
      ["input_boolean.ki_solkompensasjon", "Solkompensasjon", "Trekker fra solvarme i stua"],
      ["input_boolean.ki_nattsenk_okonomi", "Økonomisk nattsenking", "Senker bare når det lønner seg"],
      ["input_boolean.ki_bereder_styring", "Styr bereder", ""],
      ["input_boolean.ki_legionella_aktiv", "Legionellasikring", "Kan aldri blokkeres av sparing"],
      ["input_boolean.ki_handkle_styring", "Styr håndklevarmer", ""],
      ["input_boolean.ki_energi_varsler", "Varsler", ""],
    ];
    const rader = brytere.map(([id, navn, sub]) => {
      const st = this._st(id);
      const on = st && st.state === "on";
      return `
        <div class="rad">
          <div class="rad-tekst">
            <div class="rad-navn">${escE(navn)}</div>
            ${sub ? `<div class="rad-sub">${escE(sub)}</div>` : ""}
          </div>
          <div class="bryter ${on ? "on" : ""} ${st ? "" : "mangler"}" data-action="veksle" data-entity="${id}"><span></span></div>
        </div>`;
    }).join("");

    const mottakere = (this._st("input_text.ki_varsel_mottakere") || {}).state || "";
    this._root.getElementById("innstillinger").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Innstillinger</span></div>
        ${rader}
        <div class="ov-tittel" style="padding-top:12px">Varselmottakere</div>
        <input class="tekst" type="text" data-action="ingen" id="mottakere" value="${escE(mottakere)}"
               placeholder="notify.mobile_app_...">
        <div class="notat">Kommaseparert. Endringen lagres når du forlater feltet.</div>
      </div>`;
  }

  _renderLogg() {
    const linjer = this._attr(this._config.logg, "linjer", []) || [];
    const html = linjer.slice(0, 25).map((l) => `
      <div class="logg-linje">
        <div class="logg-topp">
          <span class="logg-tid">${escE(String(l.tid || "").slice(11, 16))}</span>
          <span class="badge b-${l.sone === "gronn" ? "ok" : l.sone === "gul" ? "advarsel" : "feil"}">${escE(l.sone)}</span>
          ${l.skygge ? '<span class="merke">skygge</span>' : ""}
          <span class="logg-tall">${nfE(l.forbrukt, 2)} / ${nfE(l.grense, 2)} kWh</span>
        </div>
        <div class="logg-tekst">${escE(l.forklaring || "")}</div>
        ${(l.tiltak || []).length ? `<ul class="logg-tiltak">${l.tiltak.map((t) => `<li>${escE(t)}</li>`).join("")}</ul>` : ""}
      </div>`).join("");
    this._root.getElementById("logg").innerHTML = `
      <div class="blokk">
        <div class="blokk-hode"><span>Beslutningslogg</span><span class="blokk-sub">Siste avgjørelser</span></div>
        ${html || '<div class="notat">Ingen beslutninger logget ennå.</div>'}
      </div>`;
  }

  /* ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "more") {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    } else if (a === "apne") {
      const k = el.dataset.key;
      if (this._apneSoner.has(k)) this._apneSoner.delete(k); else this._apneSoner.add(k);
      this._renderLaster();
    } else if (a === "veksle") {
      const st = this._st(el.dataset.entity);
      if (!st) return;
      this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: el.dataset.entity });
    } else if (a === "ov-temp") {
      const felt = this._root.querySelector(`[data-ov="${el.dataset.key}"]`);
      if (!felt) return;
      const v = Number(String(felt.textContent).replace(",", ".")) + Number(el.dataset.dir) * 0.5;
      felt.textContent = nfE(v, 1);
    } else if (a === "ov-sett") {
      const felt = this._root.querySelector(`[data-ov="${el.dataset.key}"]`);
      if (!felt) return;
      this._hass.callService("pyscript", "ki_overstyr", {
        sone: el.dataset.key,
        temp: Number(String(felt.textContent).replace(",", ".")),
        minutter: Number(el.dataset.min),
      });
    } else if (a === "ov-fjern") {
      this._hass.callService("pyscript", "ki_fjern_overstyring", { sone: el.dataset.key });
    } else if (a === "tjeneste") {
      this._hass.callService(el.dataset.domene, el.dataset.tjeneste, {});
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n && n.id === "mottakere");
    if (!el) return;
    this._hass.callService("input_text", "set_value", {
      entity_id: "input_text.ki_varsel_mottakere",
      value: el.value.slice(0, 255),
    });
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) this._lagreView(this._view);
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
    this._update();
  }

  /* ------------------------------------------------------------ */

  static get styles() {
    return `
      :host { display:block; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0; }
      .wrap { display:flex; flex-direction:column; gap:10px; color: var(--gray1000, var(--primary-text-color)); }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      .hero { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:16px; }
      .ring { position:relative; width:88px; height:88px; cursor:pointer; }
      .ring svg { width:88px; height:88px; transform: rotate(-90deg); }
      .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
      .ring-spor { stroke: rgba(128,128,128,.24); }
      .ring-fyll { stroke: var(--green, #4caf50); transition: stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1); }
      .hero[data-sone="gul"] .ring-fyll { stroke: var(--yellow, #f2c94c); }
      .hero[data-sone="oransje"] .ring-fyll { stroke: var(--orange, #fc6d09); }
      .hero[data-sone="rod"] .ring-fyll,
      .hero[data-sone="kritisk"] .ring-fyll { stroke: var(--red, #f44336); }
      .hero[data-sone="fallback"] .ring-fyll,
      .hero[data-sone="av"] .ring-fyll { stroke: rgba(128,128,128,.5); }
      .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
      .ring-tall span { font-size:13px; opacity:.6; margin-left:1px; }
      .hero-navn { font-size:19px; font-weight:600; }
      .hero-forklaring { font-size:13.5px; opacity:.72; line-height:1.4; margin-top:3px; }
      .merke { font-size:11px; font-weight:600; padding:2px 7px; border-radius:75px;
        background: rgba(128,128,128,.28); vertical-align:middle; }

      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; opacity:.6; transition: background .18s ease, opacity .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 14px; }
      .blokk + .blokk { margin-top:10px; }
      .avansert-kun > div + div { margin-top:10px; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px; }
      .blokk-sub { font-weight:500; text-align:right; }

      .tall-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .tall { background: rgba(128,128,128,.12); border-radius:16px; padding:10px 6px; text-align:center; }
      .tall b { display:block; font-size:18px; font-variant-numeric:tabular-nums; }
      .tall span { font-size:11.5px; opacity:.6; }
      .spor { height:10px; border-radius:6px; background: rgba(128,128,128,.24); overflow:hidden; margin:10px 0 6px; }
      .fyll { height:100%; background: var(--active-big, var(--primary-color)); transition: width .5s ease; }
      .under { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; opacity:.6; }
      .notat { font-size:12.5px; opacity:.6; padding:8px 2px 0; line-height:1.4; }
      .advarsel-tekst { color: var(--orange, #fc6d09); opacity:.9; }
      .svak { opacity:.5; }

      .last { border-radius:18px; background: rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
      .last-hode { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px;
        padding:10px; cursor:pointer; }
      .last-navn { font-size:14.5px; font-weight:500; }
      .last-forklaring { font-size:12.5px; opacity:.62; line-height:1.35; }
      .last-verdi { font-size:13.5px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .last-kropp { display:none; padding:0 10px 10px; }
      .last.apen .last-kropp { display:block; }
      .last-fakta { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; opacity:.7; padding-bottom:8px; }
      .last-fakta span { background: rgba(128,128,128,.16); padding:3px 9px; border-radius:75px; }
      .badge { font-weight:600; opacity:1; }
      .b-ok { background: rgba(76,175,80,.25) !important; }
      .b-advarsel { background: rgba(252,109,9,.25) !important; }
      .b-feil { background: rgba(244,67,54,.25) !important; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .p-ok { background: var(--green, #4caf50); }
      .p-advarsel { background: var(--orange, #fc6d09); }
      .p-feil { background: var(--red, #f44336); }
      .p-nøytral { background: rgba(128,128,128,.45); }

      .overstyr { border-top:1px solid rgba(128,128,128,.16); padding-top:8px; }
      .ov-tittel { font-size:12px; font-weight:600; opacity:.5; padding-bottom:6px; }
      .ov-rad { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .steg { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        font-size:19px; cursor:pointer; background: rgba(128,128,128,.18); user-select:none; }
      .ov-verdi { min-width:52px; text-align:center; font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .ov-knapp { padding:8px 14px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.18); }
      .ov-knapp.fjern { background: rgba(244,67,54,.22); }

      .rad { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-navn { font-size:14.5px; }
      .rad-sub { font-size:12px; opacity:.55; line-height:1.3; }
      .rad-verdi { font-size:13.5px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
      .bryter { width:46px; height:28px; min-width:46px; border-radius:75px; background: rgba(128,128,128,.28);
        cursor:pointer; position:relative; transition: background .18s ease; }
      .bryter.on { background: var(--active-big, var(--primary-color)); }
      .bryter span { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%;
        background:#fff; transition: transform .18s ease; }
      .bryter.on span { transform: translateX(18px); }
      .bryter.mangler { opacity:.35; }

      .tekst { width:100%; box-sizing:border-box; font-family:inherit; font-size:14px;
        color: var(--gray1000, var(--primary-text-color)); background: rgba(128,128,128,.16);
        border:none; border-radius:16px; padding:11px 14px; }

      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); }

      .logg-linje { padding:10px 2px; }
      .logg-linje + .logg-linje { border-top:1px solid rgba(128,128,128,.14); }
      .logg-topp { display:flex; align-items:center; gap:8px; font-size:12px; }
      .logg-tid { font-weight:600; font-variant-numeric:tabular-nums; }
      .logg-topp .badge { padding:2px 8px; border-radius:75px; }
      .logg-tall { margin-left:auto; opacity:.6; font-variant-numeric:tabular-nums; }
      .logg-tekst { font-size:13px; opacity:.8; margin-top:4px; line-height:1.4; }
      .logg-tiltak { margin:6px 0 0; padding-left:18px; font-size:12.5px; opacity:.62; line-height:1.45; }

      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
      @media (max-width: 400px) {
        .hero { grid-template-columns:78px 1fr; gap:10px; padding:12px; }
        .ring, .ring svg { width:74px; height:74px; }
        .tall b { font-size:16px; }
      }
    `;
  }
}

window.KI.define("ki-energi-card", KiEnergiCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const EN_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "status", selector: { entity: { domain: "sensor" } } },
  { name: "laster", selector: { entity: { domain: "sensor" } } },
  { name: "bereder", selector: { entity: { domain: "sensor" } } },
  { name: "logg", selector: { entity: { domain: "sensor" } } },
  { name: "tau", selector: { entity: { domain: "sensor" } } },
  { name: "default_view", selector: { select: { mode: "dropdown", options: [
    { value: "enkel", label: "Enkel" }, { value: "avansert", label: "Avansert" }] } } },
  { name: "remember_view", selector: { boolean: {} } },
];

const EN_LABELS = {
  title: "Tittel (valgfri)", status: "Statussensor", laster: "Lastsensor",
  bereder: "Berdersensor", logg: "Loggsensor", tau: "Tidskonstantsensor",
  default_view: "Standardvisning", remember_view: "Husk valgt visning",
};

class KiEnergiCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  setConfig(config) {
    this._config = Object.assign({
      status: "sensor.ki_energi_status", laster: "sensor.ki_laster",
      bereder: "sensor.ki_bereder", logg: "sensor.ki_beslutningslogg",
      tau: "sensor.ki_tidskonstanter", default_view: "enkel", remember_view: true,
    }, config || {});
    this._render();
  }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EN_SCHEMA;
      this._form.computeLabel = (s) => EN_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

window.KI.define("ki-energi-card-editor", KiEnergiCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energi-card",
  name: "KI Energi",
  description: "Timebudsjett, laster, beslutningslogg og innstillinger for KI-energimotoren",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-energi-card feilet", e); }

/* ===== ki-energy-card ===== */
try {
/**
 * ki-energy-card.js
 * ---------------------------------------------------------------
 * Homey Energy-stil energikort for Home Assistant.
 * Ingen avhengigheter — tegner egen SVG-graf fra historikk-API-et.
 *
 * Plassering:  /config/www/ki-energy-card.js
 * Ressurs:     /local/ki-energy-card.js  (type: JavaScript Module)
 * ---------------------------------------------------------------
 */

const NBSP = "\u00A0";

class KIEnergyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._expanded = false;
    this._history = null;
    this._historyFetchedAt = 0;
    this._signature = "";
    this._uid = "ki" + Math.random().toString(36).slice(2, 8);
  }

  // ------------------------------------------------------------
  //  Konfigurasjon
  // ------------------------------------------------------------
  setConfig(config) {
    if (!config.power || !config.power.entity) {
      throw new Error("ki-energy-card: 'power.entity' (effektsensor i W) er påkrevd");
    }
    this._config = {
      title: "Energy",
      currency: "kr",
      top_count: 3,
      stats: [],
      chips: [],
      consumers: [],
      ...config,
    };
    this._history = null;
    this._signature = "";
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  static getStubConfig() {
    return {
      type: "custom:ki-energy-card",
      power: { entity: "sensor.strommaler_effekt" },
      stats: [],
      chips: [],
      consumers: [],
    };
  }

  getCardSize() {
    return 14;
  }

  // ------------------------------------------------------------
  //  hass-oppdatering
  // ------------------------------------------------------------
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    const sig = this._buildSignature();
    const trengerHistorikk = Date.now() - this._historyFetchedAt > 60000;

    if (trengerHistorikk) this._fetchHistory();
    if (sig !== this._signature) {
      this._signature = sig;
      this._render();
    }
  }

  _buildSignature() {
    const ids = this._trackedEntities();
    return ids.map((id) => (this._hass.states[id] || {}).state).join("|") + "|" + this._expanded;
  }

  _trackedEntities() {
    const c = this._config;
    const ids = [c.power.entity];
    if (c.power.energy) ids.push(c.power.energy);
    if (c.power.cost) ids.push(c.power.cost);
    (c.stats || []).forEach((s) => ids.push(s.entity));
    (c.chips || []).forEach((s) => ids.push(s.entity));
    (c.consumers || []).forEach((s) => {
      ids.push(s.entity);
      if (s.cost) ids.push(s.cost);
    });
    if (c.water) {
      ids.push(c.water.entity);
      if (c.water.cost) ids.push(c.water.cost);
    }
    return ids.filter(Boolean);
  }

  // ------------------------------------------------------------
  //  Historikk for grafen
  // ------------------------------------------------------------
  async _fetchHistory() {
    this._historyFetchedAt = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const ids = [this._config.power.entity];
    if (this._config.water && this._config.water.entity) ids.push(this._config.water.entity);

    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: new Date().toISOString(),
        minimal_response: true,
        no_attributes: true,
        entity_ids: ids,
      });
      this._history = {};
      for (const id of ids) {
        const rows = res[id] || [];
        this._history[id] = rows
          .map((r) => ({
            t: new Date(r.lu ? r.lu * 1000 : r.last_updated).getTime(),
            v: parseFloat(r.s !== undefined ? r.s : r.state),
          }))
          .filter((p) => !isNaN(p.v));
      }
      this._signature = "";
      this._render();
    } catch (e) {
      // Historikk kan feile (recorder utilgjengelig) — kortet vises uten graf
      this._history = this._history || {};
    }
  }

  // ------------------------------------------------------------
  //  Hjelpere
  // ------------------------------------------------------------
  _st(id) {
    return this._hass && this._hass.states[id] ? this._hass.states[id] : null;
  }

  _num(id) {
    const s = this._st(id);
    if (!s) return NaN;
    const v = parseFloat(s.state);
    return isNaN(v) ? NaN : v;
  }

  _fmtNum(v, dec) {
    if (isNaN(v)) return "–";
    return v.toLocaleString("nb-NO", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }

  /** Viser kWh, men faller til Wh under 1 kWh — som i Homey */
  _fmtEnergy(v) {
    if (isNaN(v)) return { tall: "–", enhet: "kWh" };
    if (Math.abs(v) < 1) return { tall: this._fmtNum(Math.round(v * 1000), 0), enhet: "Wh" };
    return { tall: this._fmtNum(v, 1), enhet: "kWh" };
  }

  _fmtAkse(v) {
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
    return String(Math.round(v));
  }

  _niceMax(v) {
    if (!(v > 0)) return 1;
    const eksp = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / eksp;
    const nf = f <= 1 ? 1 : f <= 1.4 ? 1.4 : f <= 2 ? 2 : f <= 2.8 ? 2.8 : f <= 4 ? 4 : f <= 7 ? 7 : 10;
    return nf * eksp;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  // ------------------------------------------------------------
  //  Toppforbrukere
  // ------------------------------------------------------------
  _consumers() {
    return (this._config.consumers || [])
      .map((c) => {
        const s = this._st(c.entity);
        const kwh = this._num(c.entity);
        return {
          entity: c.entity,
          navn: c.name || (s && s.attributes.friendly_name) || c.entity,
          ikon: c.icon || (s && s.attributes.icon) || "mdi:flash",
          kwh: isNaN(kwh) ? 0 : kwh,
          kr: c.cost ? this._num(c.cost) : NaN,
        };
      })
      .filter((c) => c.kwh > 0)
      .sort((a, b) => b.kwh - a.kwh);
  }

  // ------------------------------------------------------------
  //  SVG-graf
  // ------------------------------------------------------------
  _chart(entityId, farge, enhetsetikett) {
    const W = 1000;
    const H = 300;
    const padL = 92;
    const padR = 24;
    const padT = 18;
    const padB = 52;

    const rows = (this._history && this._history[entityId]) || [];
    const dagStart = new Date();
    dagStart.setHours(0, 0, 0, 0);
    const t0 = dagStart.getTime();
    const t24 = t0 + 86400000;
    const naa = Date.now();

    // Nedsampling til 5-minutters bøtter
    const bøtter = new Array(288).fill(null);
    let siste = NaN;
    for (const p of rows) {
      const i = Math.floor((p.t - t0) / 300000);
      if (i < 0 || i > 287) continue;
      bøtter[i] = bøtter[i] === null ? p.v : Math.max(bøtter[i], p.v);
    }
    // Fyll hull framover (sensoren rapporterer kun ved endring)
    const punkter = [];
    for (let i = 0; i < 288; i++) {
      const tid = t0 + i * 300000;
      if (tid > naa) break;
      if (bøtter[i] !== null) siste = bøtter[i];
      if (!isNaN(siste)) punkter.push({ i, v: siste });
    }

    const maksVerdi = punkter.reduce((m, p) => Math.max(m, p.v), 0);
    const yMaks = this._niceMax(maksVerdi * 1.1);

    const x = (i) => padL + (i / 287) * (W - padL - padR);
    const y = (v) => H - padB - (v / yMaks) * (H - padT - padB);
    const bunn = H - padB;

    // Rutenett
    let rutenett = "";
    const yLinjer = 4;
    for (let n = 0; n <= yLinjer; n++) {
      const v = (yMaks / yLinjer) * n;
      const yy = y(v);
      rutenett += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" class="grid"/>`;
      rutenett += `<text x="${padL - 14}" y="${yy + 6}" class="ylab">${this._fmtAkse(v)}</text>`;
    }
    for (let t = 0; t <= 24; t += 6) {
      const xx = x((t / 24) * 287);
      if (t > 0 && t < 24) rutenett += `<line x1="${xx}" y1="${padT}" x2="${xx}" y2="${bunn}" class="grid vgrid"/>`;
      rutenett += `<text x="${xx}" y="${bunn + 34}" class="xlab">${t % 24}:00</text>`;
    }

    if (!punkter.length) {
      return `<svg viewBox="0 0 ${W} ${H}" class="chart">${rutenett}
        <text x="${W / 2}" y="${H / 2}" class="tom">Ingen historikk</text></svg>`;
    }

    const linje = punkter.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const første = punkter[0];
    const sisteP = punkter[punkter.length - 1];
    const areal =
      `M ${x(første.i).toFixed(1)},${bunn} ` +
      punkter.map((p) => `L ${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ") +
      ` L ${x(sisteP.i).toFixed(1)},${bunn} Z`;

    const naaX = x(((naa - t0) / (t24 - t0)) * 287);
    const gid = `${this._uid}-grad-${entityId.replace(/\W/g, "")}`;

    return `
      <svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="${farge}" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="${farge}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${rutenett}
        <path d="${areal}" fill="url(#${gid})"/>
        <polyline points="${linje}" fill="none" stroke="${farge}" stroke-width="2.5"
                  stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="${naaX}" y1="${padT}" x2="${naaX}" y2="${bunn}" class="naa"/>
        <circle cx="${x(sisteP.i).toFixed(1)}" cy="${y(sisteP.v).toFixed(1)}" r="8"
                fill="${farge}" stroke="var(--card-background-color, #16181D)" stroke-width="3"/>
        <text x="${padL - 14}" y="${padT + 4}" class="ylab enhet">${enhetsetikett}</text>
      </svg>`;
  }

  // ------------------------------------------------------------
  //  Render
  // ------------------------------------------------------------
  _render() {
    if (!this._hass || !this._config) return;
    const c = this._config;
    const blå = c.color || "#4A9EFF";

    // --- Topprad ---
    const stats = (c.stats || [])
      .map((s) => {
        const { tall, enhet } = this._fmtEnergy(this._num(s.entity));
        return `<div class="stat" data-entity="${s.entity}">
                  <div class="stat-verdi">${tall}${NBSP}<span class="stat-enhet">${enhet}</span></div>
                  <div class="stat-etikett">${s.label || ""}</div>
                </div>`;
      })
      .join("");

    // --- Brikker ---
    const chips = (c.chips || [])
      .map((ch) => {
        const st = this._st(ch.entity);
        let under = st ? st.state : "–";
        if (ch.states && st && ch.states[st.state] !== undefined) under = ch.states[st.state];
        else if (st && ch.unit !== false) {
          const u = ch.unit || st.attributes.unit_of_measurement;
          if (u) under = `${this._fmtNum(parseFloat(st.state), u === "%" ? 0 : u === "W" ? 0 : 1)}${NBSP}${u}`;
        }
        return `<div class="chip" data-entity="${ch.entity}">
                  <ha-icon icon="${ch.icon || "mdi:flash"}" style="color:${ch.color || blå}"></ha-icon>
                  <div class="chip-tekst">
                    <div class="chip-navn">${ch.name || ch.entity}</div>
                    <div class="chip-under">${under}</div>
                  </div>
                </div>`;
      })
      .join("");

    // --- Strøm ---
    const kost = c.power.cost ? this._num(c.power.cost) : NaN;
    const energi = this._fmtEnergy(c.power.energy ? this._num(c.power.energy) : NaN);
    const strømGraf = this._chart(c.power.entity, blå, "W");

    // --- Toppforbrukere ---
    const alle = this._consumers();
    const antall = this._expanded ? alle.length : Math.min(c.top_count, alle.length);
    const maks = alle.length ? alle[0].kwh : 1;
    const medaljer = ["#F0A93B", "#E3D33F", "#7ED321"];

    const rader = alle
      .slice(0, antall)
      .map((f, i) => {
        const pct = Math.max(4, Math.min(100, Math.round((f.kwh / maks) * 100)));
        const badge = medaljer[i] || "#5B8DEF";
        return `<div class="rad" data-entity="${f.entity}">
          <div class="rad-ikon">
            <ha-icon icon="${f.ikon}"></ha-icon>
            <span class="badge" style="background:${badge}">${i + 1}</span>
          </div>
          <div class="rad-tekst">
            <div class="rad-navn">${f.navn}</div>
            <div class="rad-kwh">${this._fmtNum(f.kwh, 1)}${NBSP}kWh</div>
          </div>
          <div class="pill">${isNaN(f.kr) ? "–" : this._fmtNum(f.kr, 2)}${NBSP}${c.currency}</div>
          <div class="bar"><div class="bar-fyll" style="width:${pct}%"></div></div>
        </div>`;
      })
      .join("");

    const visAlt =
      alle.length > c.top_count
        ? `<button class="visalt" id="visalt">${this._expanded ? "Vis mindre" : "Vis alt"}</button>`
        : "";

    // --- Vann (valgfritt) ---
    let vann = "";
    if (c.water && c.water.entity) {
      const vKost = c.water.cost ? this._num(c.water.cost) : NaN;
      const vVerdi = this._num(c.water.entity);
      vann = `
        <div class="seksjon">
          <h2>Vann</h2>
          <div class="pill stor">${isNaN(vKost) ? "0,00" : this._fmtNum(vKost, 2)}${NBSP}${c.currency}</div>
        </div>
        <div class="panel">
          <div class="panel-topp">
            <ha-icon icon="mdi:water" style="color:${c.water.color || blå}"></ha-icon>
            <span class="panel-verdi" style="color:${c.water.color || blå}">${this._fmtNum(vVerdi, 0)}<span class="panel-enhet">${NBSP}L</span></span>
            <span class="panel-etikett">Forbrukt</span>
          </div>
          ${this._chart(c.water.entity, c.water.color || blå, "L")}
        </div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card>
        <div class="topp">
          ${c.title ? `<h1>${c.title}</h1>` : ""}
          <div class="stats">${stats}</div>
        </div>

        <div class="chips">${chips}</div>

        <div class="seksjon">
          <h2>Strøm</h2>
          <div class="pill stor">${isNaN(kost) ? "–" : this._fmtNum(kost, 2)}${NBSP}${c.currency}</div>
        </div>

        <div class="panel">
          <div class="panel-topp" data-entity="${c.power.energy || c.power.entity}">
            <ha-icon icon="mdi:lightning-bolt" style="color:${blå}"></ha-icon>
            <span class="panel-verdi" style="color:${blå}">${energi.tall}<span class="panel-enhet">${NBSP}${energi.enhet}</span></span>
            <span class="panel-etikett">Importert</span>
          </div>
          ${strømGraf}
        </div>

        <div class="seksjon"><h2>Toppforbrukere</h2></div>
        <div class="panel liste">
          ${rader || `<div class="tomliste">Ingen forbruk registrert i dag</div>`}
          ${visAlt}
        </div>

        ${vann}
      </ha-card>`;

    // Klikk-håndtering
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((el) => {
      el.addEventListener("click", () => this._moreInfo(el.dataset.entity));
    });
    const knapp = this.shadowRoot.getElementById("visalt");
    if (knapp) {
      knapp.addEventListener("click", () => {
        this._expanded = !this._expanded;
        this._signature = "";
        this._render();
      });
    }
  }

  // ------------------------------------------------------------
  //  Stil
  // ------------------------------------------------------------
  _styles() {
    return `
      :host { --ki-panel: var(--ki-panel-color, #23262E);
              --ki-blue: #4A9EFF;
              --ki-pill-bg: #1B2434;
              --ki-muted: #9096A0;
              --ki-track: #3A3F49; }

      ha-card {
        background: var(--card-background-color, #16181D);
        border-radius: 24px;
        padding: 18px 16px 22px;
        overflow: hidden;
      }

      h1 { margin: 0 0 14px; font-size: 40px; font-weight: 800; letter-spacing: -0.5px;
           color: var(--primary-text-color, #fff); }
      h2 { margin: 0; font-size: 30px; font-weight: 700; color: var(--primary-text-color, #fff); }

      .stats { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
      .stat { text-align: center; cursor: pointer; padding: 4px 0; }
      .stat-verdi { font-size: 21px; font-weight: 700; color: var(--primary-text-color, #fff); }
      .stat-enhet { font-size: 15px; font-weight: 600; }
      .stat-etikett { font-size: 14px; color: var(--ki-muted); margin-top: 1px; }

      .chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
      .chip { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 12px;
              background: var(--ki-panel); border-radius: 16px; padding: 14px 16px; cursor: pointer; }
      .chip ha-icon { --mdc-icon-size: 32px; }
      .chip-navn { font-size: 18px; font-weight: 700; color: var(--primary-text-color, #fff); }
      .chip-under { font-size: 16px; color: var(--ki-muted); margin-top: 1px; }

      .seksjon { display: flex; align-items: center; justify-content: space-between;
                 margin: 26px 4px 10px; gap: 12px; }

      .pill { background: var(--ki-pill-bg); color: var(--ki-blue); border-radius: 12px;
              padding: 8px 14px; font-weight: 700; font-size: 20px; white-space: nowrap; }
      .pill.stor { font-size: 22px; }

      .panel { background: var(--ki-panel); border-radius: 20px; padding: 16px 12px 8px; }
      .panel.liste { padding: 6px 16px 14px; }
      .panel-topp { display: flex; align-items: baseline; gap: 8px; padding: 4px 6px 10px; cursor: pointer; }
      .panel-topp ha-icon { --mdc-icon-size: 26px; align-self: center; }
      .panel-verdi { font-size: 30px; font-weight: 700; }
      .panel-enhet { font-size: 18px; font-weight: 600; }
      .panel-etikett { font-size: 16px; color: var(--ki-muted); margin-left: -2px;
                       align-self: flex-end; width: 100%; }
      .panel-topp { flex-wrap: wrap; }

      .chart { width: 100%; height: 230px; display: block; }
      .grid { stroke: #2C3038; stroke-width: 1; }
      .vgrid { stroke-dasharray: 0; }
      .naa { stroke: #6B7280; stroke-width: 1.5; }
      .ylab { fill: var(--ki-muted); font-size: 20px; text-anchor: end; font-family: inherit; }
      .ylab.enhet { font-size: 18px; }
      .xlab { fill: var(--ki-muted); font-size: 20px; text-anchor: middle; font-family: inherit; }
      .tom { fill: var(--ki-muted); font-size: 22px; text-anchor: middle; font-family: inherit; }

      .rad { display: grid;
             grid-template-columns: 56px 1fr auto;
             grid-template-areas: "ikon tekst pill" "bar bar bar";
             align-items: center; column-gap: 14px; padding: 14px 0 8px; cursor: pointer; }
      .rad-ikon { grid-area: ikon; position: relative; width: 48px; height: 44px; }
      .rad-ikon ha-icon { --mdc-icon-size: 36px; color: #E8EAEE; }
      .badge { position: absolute; bottom: 0; left: 22px; width: 22px; height: 22px;
               border-radius: 50%; color: #14161A; font-size: 13px; font-weight: 700;
               line-height: 22px; text-align: center; }
      .rad-tekst { grid-area: tekst; min-width: 0; }
      .rad-navn { font-size: 21px; font-weight: 700; color: var(--primary-text-color, #fff);
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rad-kwh { font-size: 17px; color: var(--ki-muted); margin-top: 2px; }
      .rad .pill { grid-area: pill; }
      .bar { grid-area: bar; height: 5px; border-radius: 3px; background: var(--ki-track);
             margin-top: 14px; overflow: hidden; }
      .bar-fyll { height: 100%; border-radius: 3px;
                  background: linear-gradient(90deg, #7ED321 0%, #E3D33F 55%, #F0A93B 100%); }

      .visalt { width: 100%; margin-top: 10px; padding: 18px 0; border: none; cursor: pointer;
                background: var(--ki-pill-bg); color: var(--ki-blue); border-radius: 16px;
                font-size: 21px; font-weight: 700; font-family: inherit; }
      .visalt:hover { filter: brightness(1.15); }
      .tomliste { padding: 24px 4px; color: var(--ki-muted); font-size: 17px; text-align: center; }
    `;
  }
}

window.KI.define("ki-energy-card", KIEnergyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-energy-card",
  name: "KI Energy Card",
  description: "Energioversikt i Homey Energy-stil med graf og toppforbrukere",
  preview: false,
});

console.info("%c KI-ENERGY-CARD %c v1.0.0 ", "background:#4A9EFF;color:#fff;font-weight:700", "");
} catch (e) { console.error("ki-cards: ki-energy-card feilet", e); }

/* ===== ki-helse-card ===== */
try {
/**
 * ki-helse-card.js  —  v1.0.0
 *
 * Helsedata fra Home Assistant Companion (iPhone/Apple Watch), i samme
 * designspråk som de øvrige KI-kortene.
 *
 *   • Hero med dagens aktivitet
 *   • Seksjoner: aktivitet, hjerte og pust, søvn, kropp
 *   • Søvnseksjonen tegner fasene som en stablet stolpe
 *   • Full GUI-editor med automatisk oppdaging ut fra enhetsprefiks
 *
 * Kortet viser tallene slik de kommer fra Apple Health. Det tolker dem ikke
 * og setter ingen mål eller grenseverdier.
 *
 * Legges i /config/www/ki-helse-card.js og registreres som
 * JavaScript Module: /local/ki-helse-card.js
 */

const KI_HELSE_VERSION = "1.0.1";

console.info(
  `%c KI-HELSE-CARD %c ${KI_HELSE_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e5484d;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── verktøy ── */

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const tall = (hass, id) => {
  if (!id || !hass || !hass.states[id]) return null;
  const v = parseFloat(hass.states[id].state);
  return isNaN(v) ? null : v;
};

const enhetFor = (hass, id) => {
  const s = id && hass ? hass.states[id] : null;
  return s && s.attributes ? s.attributes.unit_of_measurement || "" : "";
};

/** Timer som «7 t 12 min», ellers tall med enhet. */
const fmtVerdi = (hass, id) => {
  const s = id ? hass.states[id] : null;
  if (!s) return "–";
  const v = parseFloat(s.state);
  const e = enhetFor(hass, id);
  if (isNaN(v)) return s.state;

  if (e === "h" || e === "t") {
    const timer = Math.floor(v);
    const min = Math.round((v - timer) * 60);
    if (timer === 0) return `${min} min`;
    return min ? `${timer} t ${min} min` : `${timer} t`;
  }
  if (e === "min") {
    if (v >= 60) {
      const timer = Math.floor(v / 60);
      const rest = Math.round(v % 60);
      return rest ? `${timer} t ${rest} min` : `${timer} t`;
    }
    return `${Math.round(v)} min`;
  }

  let des = 0;
  if (Math.abs(v) < 10) des = 1;
  if (e === "%" || e === "bpm" || e === "" ) des = Math.abs(v) < 10 ? 1 : 0;
  if (e === "km" || e === "kg" || e === "°C") des = 1;
  if (e === "m" && Math.abs(v) < 10) des = 2;
  const t = v.toLocaleString("nb-NO", {
    minimumFractionDigits: des,
    maximumFractionDigits: des,
  });
  return e ? `${t} ${e}` : t;
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-helse-card",
  title: "",
  prefix: "sensor.sebastian_iphone_17_pro_",
  hero: {
    main: "sensor.sebastian_iphone_17_pro_steps",
    main_label: "Skritt i dag",
    chips: [
      { entity: "sensor.sebastian_iphone_17_pro_active_energy", name: "Aktiv" },
      { entity: "sensor.sebastian_iphone_17_pro_exercise_time", name: "Trening" },
      {
        entity: "sensor.sebastian_iphone_17_pro_walking_running_distance",
        name: "Distanse",
      },
    ],
  },
  sections: [
    {
      title: "Aktivitet",
      color: "var(--green)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_health_steps", name: "Skritt (Health)", icon: "mdi:shoe-print" },
        { entity: "sensor.sebastian_iphone_17_pro_distance", name: "Distanse", icon: "mdi:map-marker-distance" },
        { entity: "sensor.sebastian_iphone_17_pro_flights_climbed", name: "Etasjer", icon: "mdi:stairs-up" },
        { entity: "sensor.sebastian_iphone_17_pro_floors_ascended", name: "Opp", icon: "mdi:arrow-up-bold" },
        { entity: "sensor.sebastian_iphone_17_pro_floors_descended", name: "Ned", icon: "mdi:arrow-down-bold" },
        { entity: "sensor.sebastian_iphone_17_pro_average_active_pace", name: "Snittfart", icon: "mdi:speedometer" },
        { entity: "sensor.sebastian_iphone_17_pro_active_energy", name: "Aktiv energi", icon: "mdi:fire" },
        { entity: "sensor.sebastian_iphone_17_pro_resting_energy", name: "Hvileenergi", icon: "mdi:sleep" },
      ],
    },
    {
      title: "Hjerte og pust",
      color: "var(--red)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_heart_rate", name: "Puls", icon: "mdi:heart-pulse" },
        { entity: "sensor.sebastian_iphone_17_pro_resting_heart_rate", name: "Hvilepuls", icon: "mdi:heart" },
        { entity: "sensor.sebastian_iphone_17_pro_walking_heart_rate_average", name: "Gangpuls", icon: "mdi:walk" },
        { entity: "sensor.sebastian_iphone_17_pro_heart_rate_variability", name: "HRV", icon: "mdi:sine-wave" },
        { entity: "sensor.sebastian_iphone_17_pro_vo2_max", name: "VO2 maks", icon: "mdi:lungs" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_oxygen", name: "Oksygen", icon: "mdi:water-percent" },
        { entity: "sensor.sebastian_iphone_17_pro_respiratory_rate", name: "Pustefrekvens", icon: "mdi:weather-windy" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_pressure_systolic", name: "Blodtrykk over", icon: "mdi:gauge" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_pressure_diastolic", name: "Blodtrykk under", icon: "mdi:gauge-low" },
      ],
    },
    {
      title: "Søvn",
      color: "var(--purple)",
      type: "sleep",
      total: "sensor.sebastian_iphone_17_pro_sleep_duration",
      in_bed: "sensor.sebastian_iphone_17_pro_in_bed",
      phases: [
        { entity: "sensor.sebastian_iphone_17_pro_deep_sleep", name: "Dyp", color: "var(--purple)" },
        { entity: "sensor.sebastian_iphone_17_pro_core_sleep", name: "Kjerne", color: "var(--blue)" },
        { entity: "sensor.sebastian_iphone_17_pro_rem_sleep", name: "REM", color: "var(--green)" },
        { entity: "sensor.sebastian_iphone_17_pro_awake", name: "Våken", color: "var(--orange)" },
      ],
    },
    {
      title: "Kropp",
      color: "var(--blue)",
      items: [
        { entity: "sensor.sebastian_iphone_17_pro_weight", name: "Vekt", icon: "mdi:scale-bathroom" },
        { entity: "sensor.sebastian_iphone_17_pro_height", name: "Høyde", icon: "mdi:human-male-height" },
        { entity: "sensor.sebastian_iphone_17_pro_lean_body_mass", name: "Mager masse", icon: "mdi:arm-flex" },
        { entity: "sensor.sebastian_iphone_17_pro_body_fat_percentage", name: "Fettprosent", icon: "mdi:percent" },
        { entity: "sensor.sebastian_iphone_17_pro_body_temperature", name: "Kroppstemp", icon: "mdi:thermometer" },
        { entity: "sensor.sebastian_iphone_17_pro_basal_body_temperature", name: "Basaltemp", icon: "mdi:thermometer-low" },
        { entity: "sensor.sebastian_iphone_17_pro_blood_glucose", name: "Blodsukker", icon: "mdi:water-opacity" },
        { entity: "sensor.sebastian_iphone_17_pro_water", name: "Vann", icon: "mdi:cup-water" },
      ],
    },
  ],
});

/** Suffiks brukt av «Finn entiteter automatisk». */
const SUFFIKS = {
  hero_main: "steps",
  chips: ["active_energy", "exercise_time", "walking_running_distance"],
  Aktivitet: [
    ["health_steps", "Skritt (Health)", "mdi:shoe-print"],
    ["distance", "Distanse", "mdi:map-marker-distance"],
    ["flights_climbed", "Etasjer", "mdi:stairs-up"],
    ["floors_ascended", "Opp", "mdi:arrow-up-bold"],
    ["floors_descended", "Ned", "mdi:arrow-down-bold"],
    ["average_active_pace", "Snittfart", "mdi:speedometer"],
    ["active_energy", "Aktiv energi", "mdi:fire"],
    ["resting_energy", "Hvileenergi", "mdi:sleep"],
  ],
  "Hjerte og pust": [
    ["heart_rate", "Puls", "mdi:heart-pulse"],
    ["resting_heart_rate", "Hvilepuls", "mdi:heart"],
    ["walking_heart_rate_average", "Gangpuls", "mdi:walk"],
    ["heart_rate_variability", "HRV", "mdi:sine-wave"],
    ["vo2_max", "VO2 maks", "mdi:lungs"],
    ["blood_oxygen", "Oksygen", "mdi:water-percent"],
    ["respiratory_rate", "Pustefrekvens", "mdi:weather-windy"],
    ["blood_pressure_systolic", "Blodtrykk over", "mdi:gauge"],
    ["blood_pressure_diastolic", "Blodtrykk under", "mdi:gauge-low"],
  ],
  Kropp: [
    ["weight", "Vekt", "mdi:scale-bathroom"],
    ["height", "Høyde", "mdi:human-male-height"],
    ["lean_body_mass", "Mager masse", "mdi:arm-flex"],
    ["body_fat_percentage", "Fettprosent", "mdi:percent"],
    ["body_temperature", "Kroppstemp", "mdi:thermometer"],
    ["basal_body_temperature", "Basaltemp", "mdi:thermometer-low"],
    ["blood_glucose", "Blodsukker", "mdi:water-opacity"],
    ["water", "Vann", "mdi:cup-water"],
  ],
  sleep: {
    total: "sleep_duration",
    in_bed: "in_bed",
    phases: [
      ["deep_sleep", "Dyp", "var(--purple)"],
      ["core_sleep", "Kjerne", "var(--blue)"],
      ["rem_sleep", "REM", "var(--green)"],
      ["awake", "Våken", "var(--orange)"],
    ],
  },
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiHelseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._skjulte = new Set();
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-helse-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.sections) this._config.sections = [];
    this._signatur = "";
    this._bygget = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._tegn();
  }

  getCardSize() {
    return 10;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiHelseCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) return;
      if (el.dataset.handling === "bolk") {
        const i = el.dataset.bolk;
        if (this._skjulte.has(i)) this._skjulte.delete(i);
        else this._skjulte.add(i);
        this._signatur = "";
        this._tegn();
      } else if (el.dataset.handling === "mer-info" && el.dataset.entity) {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });
    this._bygget = true;
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const hass = this._hass;
    const cfg = this._config;

    const fulgte = [];
    if (cfg.hero) {
      if (cfg.hero.main) fulgte.push(cfg.hero.main);
      (cfg.hero.chips || []).forEach((c) => fulgte.push(c.entity));
    }
    (cfg.sections || []).forEach((s) => {
      (s.items || []).forEach((i) => fulgte.push(i.entity));
      (s.phases || []).forEach((f) => fulgte.push(f.entity));
      if (s.total) fulgte.push(s.total);
      if (s.in_bed) fulgte.push(s.in_bed);
    });

    const sign = JSON.stringify([
      fulgte.map((e) => (e && hass.states[e] ? hass.states[e].state : null)),
      [...this._skjulte].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._heroHtml()}
      ${(cfg.sections || [])
        .map((s, i) =>
          s.type === "sleep" ? this._sovnHtml(s, i) : this._bolkHtml(s, i)
        )
        .join("")}
    `;
  }

  _tittelHtml() {
    const t = this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(this._config.title_icon || "mdi:heart-pulse")}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _heroHtml() {
    const hass = this._hass;
    const h = this._config.hero || {};
    if (!h.main || !hass.states[h.main]) return "";
    const v = tall(hass, h.main);

    const chips = (h.chips || [])
      .filter((c) => c.entity && hass.states[c.entity])
      .map(
        (c) => `
        <div class="chip">
          <div class="chip-navn">${esc(c.name || "")}</div>
          <div class="chip-tall">${esc(fmtVerdi(hass, c.entity))}</div>
        </div>`
      )
      .join("");

    return `
      <section class="hero" data-handling="mer-info" data-entity="${esc(h.main)}">
        <div class="hero-topp">${esc(h.main_label || "I dag")}</div>
        <div class="hero-sum">${
          v === null
            ? esc(hass.states[h.main].state)
            : esc(v.toLocaleString("nb-NO", { maximumFractionDigits: 0 }))
        }<span>${esc(enhetFor(hass, h.main))}</span></div>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </section>`;
  }

  _bolkHtml(s, i) {
    const hass = this._hass;
    const skjult = this._skjulte.has(String(i));
    const synlige = (s.items || []).filter((it) => it.entity && hass.states[it.entity]);
    if (!synlige.length) return "";

    return `
      <section class="bolk">
        <header class="bolk-hode" data-handling="bolk" data-bolk="${i}">
          <span class="bolk-prikk" style="background:${esc(
            s.color || "var(--gray800)"
          )}"></span>
          <h3>${esc(s.title)}</h3>
          <span class="bolk-antall">${synlige.length}</span>
          <ha-icon class="bolk-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="fliser">
                ${synlige
                  .map(
                    (it) => `
                  <button type="button" class="flis" data-handling="mer-info"
                    data-entity="${esc(it.entity)}"
                    style="--flis-farge:${esc(it.color || s.color || "var(--gray800)")}">
                    <span class="flis-ikon"><ha-icon icon="${esc(
                      it.icon || "mdi:heart-outline"
                    )}"></ha-icon></span>
                    <span class="flis-tekst">
                      <span class="flis-navn">${esc(it.name || it.entity)}</span>
                      <span class="flis-verdi">${esc(fmtVerdi(hass, it.entity))}</span>
                    </span>
                  </button>`
                  )
                  .join("")}
              </div>`
        }
      </section>`;
  }

  _sovnHtml(s, i) {
    const hass = this._hass;
    const skjult = this._skjulte.has(String(i));
    const faser = (s.phases || [])
      .map((f) => ({ ...f, v: tall(hass, f.entity) }))
      .filter((f) => f.v !== null);
    const total = tall(hass, s.total);
    if (!faser.length && total === null) return "";

    const sum = faser.reduce((a, b) => a + b.v, 0) || 1;

    return `
      <section class="bolk">
        <header class="bolk-hode" data-handling="bolk" data-bolk="${i}">
          <span class="bolk-prikk" style="background:${esc(
            s.color || "var(--purple)"
          )}"></span>
          <h3>${esc(s.title)}</h3>
          <span class="bolk-antall">${
            total !== null ? esc(fmtVerdi(hass, s.total)) : ""
          }</span>
          <ha-icon class="bolk-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="sovn">
                ${
                  faser.length
                    ? `<div class="stolpe">
                        ${faser
                          .map(
                            (f) =>
                              `<i style="width:${((f.v / sum) * 100).toFixed(
                                1
                              )}%;background:${esc(f.color || "var(--purple)")}"></i>`
                          )
                          .join("")}
                      </div>`
                    : ""
                }
                <div class="sovn-tekst">
                  ${faser
                    .map(
                      (f) => `
                    <button type="button" class="sovn-del" data-handling="mer-info"
                      data-entity="${esc(f.entity)}">
                      <span class="prikk" style="background:${esc(
                        f.color || "var(--purple)"
                      )}"></span>
                      ${esc(f.name)} <b>${esc(fmtVerdi(hass, f.entity))}</b>
                    </button>`
                    )
                    .join("")}
                </div>
                ${
                  s.in_bed && hass.states[s.in_bed]
                    ? `<button type="button" class="sovn-linje" data-handling="mer-info"
                        data-entity="${esc(s.in_bed)}">
                        <span>I sengen</span><b>${esc(
                          fmtVerdi(hass, s.in_bed)
                        )}</b>
                      </button>`
                    : ""
                }
              </div>`
        }
      </section>`;
  }
}

KiHelseCard.styles = `
  :host { display: block; }
  .rot { background: transparent; border: none; box-shadow: none; padding: 0; display: block; }
  .rot * { box-sizing: border-box; min-width: 0; }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad { display: flex; align-items: center; gap: 12px; padding: 0 4px 14px; }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px; flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1; font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }

  /* ---------- hero ---------- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 24px; padding: 18px 20px; margin-bottom: 18px;
    cursor: pointer;
  }
  .hero-topp { font-size: 13px; font-weight: 600; opacity: .75; }
  .hero-sum {
    font-size: 34px; font-weight: 700; line-height: 1.15;
    margin: 4px 0 2px; font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 16px; font-weight: 600; opacity: .7; margin-left: 6px; }
  .chips {
    display: flex; gap: 6px; margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .chip { flex: 1; text-align: center; min-width: 0; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall {
    font-size: 15px; font-weight: 700; line-height: 1.4;
    font-variant-numeric: tabular-nums;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ---------- bolker ---------- */
  .bolk + .bolk { margin-top: 18px; }
  .bolk-hode {
    display: flex; align-items: center; gap: 10px;
    padding: 0 6px 10px; cursor: pointer;
  }
  .bolk-prikk { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
  .bolk-hode h3 {
    margin: 0; flex: 1; font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-antall {
    font-size: 12px; font-weight: 700; opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-pil {
    --mdc-icon-size: 18px; opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease;
  }
  .bolk-pil.ned { transform: rotate(0deg); }

  /* ---------- fliser ---------- */
  .fliser { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 8px; }
  .flis {
    display: grid; grid-template-columns: 42px minmax(0, 1fr);
    align-items: center; gap: 10px;
    padding: 11px 13px 11px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .flis-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--flis-farge, var(--gray800));
    --mdc-icon-size: 20px; justify-self: end;
  }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn {
    font-size: 12px; font-weight: 600; opacity: .55;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .flis-verdi {
    font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ---------- søvn ---------- */
  .sovn {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .stolpe {
    display: flex; height: 12px; border-radius: 6px; overflow: hidden;
    background: rgba(0, 0, 0, .16);
  }
  .stolpe i { display: block; height: 100%; transition: width .4s ease; }
  .sovn-tekst { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 14px; }
  .sovn-del {
    display: flex; align-items: center; gap: 7px;
    background: none; padding: 0;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .sovn-del b { font-weight: 700; }
  .prikk { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
  .sovn-linje {
    display: flex; justify-content: space-between; width: 100%;
    margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(128, 128, 128, .2);
    background: none;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .sovn-linje b { font-weight: 700; }

  @media (max-width: 430px) {
    .hero-sum { font-size: 30px; }
    .fliser { grid-template-columns: 1fr 1fr; }
    .flis { grid-template-columns: 36px minmax(0, 1fr); padding-left: 4px; }
    .flis-ikon { width: 34px; height: 34px; --mdc-icon-size: 18px; }
    .flis-verdi { font-size: 15px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stolpe i, .bolk-pil { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

class KiHelseCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.sections) this._config.sections = [];
    if (!this._config.hero) this._config.hero = {};
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      if (domener) p.includeDomains = domener;
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  /**
   * Bygger hele oppsettet på nytt ut fra prefikset. Nyttig når kortet skal
   * over på en annen telefon eller en annen server.
   */
  _oppdag() {
    if (!this._hass) return;
    const pre = this._config.prefix || "";
    if (!pre) {
      this._svar = "Fyll inn prefiks først, f.eks. sensor.min_iphone_";
      this._tegn();
      return;
    }
    const finnes = (suff) => (this._hass.states[pre + suff] ? pre + suff : null);
    let n = 0;

    const hoved = finnes(SUFFIKS.hero_main);
    if (hoved) {
      this._config.hero.main = hoved;
      this._config.hero.main_label = this._config.hero.main_label || "Skritt i dag";
      n++;
    }
    this._config.hero.chips = SUFFIKS.chips
      .map((s) => {
        const e = finnes(s);
        if (!e) return null;
        n++;
        return {
          entity: e,
          name: { active_energy: "Aktiv", exercise_time: "Trening", walking_running_distance: "Distanse" }[s],
        };
      })
      .filter(Boolean);

    const seksjoner = [];
    ["Aktivitet", "Hjerte og pust"].forEach((tittel) => {
      const items = SUFFIKS[tittel]
        .map(([s, navn, ikon]) => {
          const e = finnes(s);
          if (!e) return null;
          n++;
          return { entity: e, name: navn, icon: ikon };
        })
        .filter(Boolean);
      if (items.length)
        seksjoner.push({
          title: tittel,
          color: tittel === "Aktivitet" ? "var(--green)" : "var(--red)",
          items,
        });
    });

    const faser = SUFFIKS.sleep.phases
      .map(([s, navn, farge]) => {
        const e = finnes(s);
        if (!e) return null;
        n++;
        return { entity: e, name: navn, color: farge };
      })
      .filter(Boolean);
    if (faser.length || finnes(SUFFIKS.sleep.total)) {
      seksjoner.push({
        title: "Søvn",
        color: "var(--purple)",
        type: "sleep",
        total: finnes(SUFFIKS.sleep.total) || undefined,
        in_bed: finnes(SUFFIKS.sleep.in_bed) || undefined,
        phases: faser,
      });
    }

    const kropp = SUFFIKS.Kropp.map(([s, navn, ikon]) => {
      const e = finnes(s);
      if (!e) return null;
      n++;
      return { entity: e, name: navn, icon: ikon };
    }).filter(Boolean);
    if (kropp.length)
      seksjoner.push({ title: "Kropp", color: "var(--blue)", items: kropp });

    this._config.sections = seksjoner;
    this._svar = `Fant ${n} entiteter og satte opp ${seksjoner.length} seksjoner.`;
    this._endret();
    this._tegn();
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiHelseCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    /* Generelt */
    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tr = document.createElement("div");
    tr.className = "tokol";
    tr.appendChild(
      this._tekstfelt("Overskrift", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    tr.appendChild(
      this._ikonfelt(this._config.title_icon, (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tr);
    gen.appendChild(
      this._tekstfelt(
        "Enhetsprefiks",
        this._config.prefix,
        (v) => {
          this._config.prefix = v;
          this._endret();
        }
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Alt foran suffikset, f.eks. sensor.sebastian_iphone_17_pro_ — brukes av knappen under.";
    gen.appendChild(h);
    gen.appendChild(
      this._knapp("Bygg opp fra prefiks", "hovedknapp", () => this._oppdag())
    );
    if (this._svar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._svar;
      gen.appendChild(sv);
    }
    rot.appendChild(gen);

    /* Hero */
    const hero = document.createElement("div");
    hero.className = "boks";
    hero.innerHTML = "<h4>Toppkort</h4>";
    hero.appendChild(
      this._entitetsfelt("Hovedtall", this._config.hero.main, (v) => {
        this._config.hero.main = v;
        this._endret();
      })
    );
    hero.appendChild(
      this._tekstfelt("Etikett", this._config.hero.main_label, (v) => {
        this._config.hero.main_label = v;
        this._endret();
      })
    );
    const cb = document.createElement("div");
    cb.className = "underboks";
    cb.innerHTML = "<div class='undertittel'>Små tall under</div>";
    (this._config.hero.chips || []).forEach((c, ci) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Entitet", c.entity, (v) => {
          c.entity = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._tekstfelt("Navn", c.name, (v) => {
          c.name = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          this._config.hero.chips.splice(ci, 1);
          this._endret();
          this._tegn();
        })
      );
      cb.appendChild(rad);
    });
    cb.appendChild(
      this._knapp("+ Legg til", "hovedknapp liten", () => {
        if (!this._config.hero.chips) this._config.hero.chips = [];
        this._config.hero.chips.push({ entity: "", name: "" });
        this._endret();
        this._tegn();
      })
    );
    hero.appendChild(cb);
    rot.appendChild(hero);

    /* Seksjoner */
    this._config.sections.forEach((s, si) => this._tegnSeksjon(rot, s, si));
    rot.appendChild(
      this._knapp("+ Ny seksjon", "hovedknapp", () => {
        this._config.sections.push({ title: "Ny seksjon", color: "var(--blue)", items: [] });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnSeksjon(rot, s, si) {
    const noekkel = "s" + si;
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const sum = document.createElement("summary");
    sum.textContent = `${s.title || "Seksjon"}${s.type === "sleep" ? " (søvn)" : ""}`;
    d.appendChild(sum);

    const kropp = document.createElement("div");
    kropp.className = "kropp";
    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Tittel", s.title, (v) => {
        s.title = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._tekstfelt("Farge", s.color, (v) => {
        s.color = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    if (s.type === "sleep") {
      kropp.appendChild(
        this._entitetsfelt("Total søvn", s.total, (v) => {
          s.total = v;
          this._endret();
        })
      );
      kropp.appendChild(
        this._entitetsfelt("I sengen", s.in_bed, (v) => {
          s.in_bed = v;
          this._endret();
        })
      );
      const fb = document.createElement("div");
      fb.className = "underboks";
      fb.innerHTML = "<div class='undertittel'>Søvnfaser</div>";
      (s.phases || []).forEach((f, fi) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Entitet", f.entity, (v) => {
            f.entity = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._tekstfelt("Navn", f.name, (v) => {
            f.name = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            s.phases.splice(fi, 1);
            this._endret();
            this._tegn();
          })
        );
        fb.appendChild(rad);
      });
      fb.appendChild(
        this._knapp("+ Legg til fase", "hovedknapp liten", () => {
          if (!s.phases) s.phases = [];
          s.phases.push({ entity: "", name: "", color: "var(--purple)" });
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(fb);
    } else {
      const ib = document.createElement("div");
      ib.className = "underboks";
      ib.innerHTML = "<div class='undertittel'>Verdier</div>";
      (s.items || []).forEach((it, ii) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Entitet", it.entity, (v) => {
            it.entity = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._tekstfelt("Navn", it.name, (v) => {
            it.name = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._ikonfelt(it.icon, (v) => {
            it.icon = v;
            this._endret();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            s.items.splice(ii, 1);
            this._endret();
            this._tegn();
          })
        );
        ib.appendChild(rad);
      });
      ib.appendChild(
        this._knapp("+ Legg til verdi", "hovedknapp liten", () => {
          if (!s.items) s.items = [];
          s.items.push({ entity: "", name: "", icon: "mdi:heart-outline" });
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(ib);
    }

    kropp.appendChild(
      this._knapp("Slett seksjon", "mini fare", () => {
        this._config.sections.splice(si, 1);
        this._endret();
        this._tegn();
      })
    );
    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiHelseCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .kropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

window.KI.define("ki-helse-card", KiHelseCard);
window.KI.define("ki-helse-card-editor", KiHelseCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-helse-card",
  name: "KI Helse",
  description: "Aktivitet, hjerte, søvn og kropp fra Apple Health.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-helse-card feilet", e); }

/* ===== ki-k2-card ===== */
try {
/**
 * ki-k2-card.js
 * Creality K2 — printer, CFS, vifter og energi i ett kort med to visninger.
 *
 *  Enkel     : kamera/forhåndsvisning, status med fremdriftsring, styreknapper,
 *              temperaturer og filamentslots
 *  Avansert  : alt over + temperaturmål, vifter, utskriftstuning, posisjon,
 *              energi og kostnad, systeminfo
 *
 * Kopier til /config/www/ki-k2-card.js og legg til som ressurs:
 *   URL:  /local/ki-k2-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-k2-card
 */

const KI_K2_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-K2-CARD %c ${KI_K2_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#fc6d09;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const STATUS_NO = {
  idle: "Klar", standby: "Klar", ready: "Klar",
  printing: "Skriver ut", running: "Skriver ut", busy: "Opptatt",
  paused: "Pauset", pausing: "Pauser",
  complete: "Ferdig", completed: "Ferdig", finished: "Ferdig",
  stopped: "Stoppet", cancelled: "Avbrutt", canceled: "Avbrutt",
  error: "Feil", offline: "Frakoblet", unavailable: "Utilgjengelig", unknown: "Ukjent",
  preheating: "Forvarmer", heating: "Varmer",
};

const AKTIV = ["printing", "running", "busy", "paused", "pausing", "preheating", "heating"];

const escK = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfK = (v, dec) => { const n = Number(v); return isFinite(n) ? n.toFixed(dec).replace(".", ",") : "–"; };

/** Sekunder eller "H:MM:SS" → "2 t 14 min" */
function varighet(raw) {
  if (raw === undefined || raw === null || raw === "") return "–";
  let sek = Number(raw);
  if (!isFinite(sek)) {
    const d = String(raw).split(":").map(Number);
    if (d.length === 3 && d.every((x) => isFinite(x))) sek = d[0] * 3600 + d[1] * 60 + d[2];
    else if (d.length === 2 && d.every((x) => isFinite(x))) sek = d[0] * 60 + d[1];
    else return String(raw);
  }
  if (sek < 0) return "–";
  if (sek < 60) return `${Math.round(sek)} sek`;
  const min = Math.round(sek / 60);
  if (min < 60) return `${min} min`;
  const t = Math.floor(min / 60);
  const r = min % 60;
  if (t < 24) return r ? `${t} t ${r} min` : `${t} t`;
  return `${Math.floor(t / 24)} d ${t % 24} t`;
}

/** "#FF0000", "FF0000" eller "255,0,0" → gyldig css-farge */
function fargeAv(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i.test(s)) return s.length > 7 ? s.slice(0, 7) : s;
  if (/^([0-9a-f]{6,8})$/i.test(s)) return "#" + s.slice(0, 6);
  if (/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(s)) return `rgb(${s})`;
  if (/^[a-z]+$/i.test(s) && s !== "unknown" && s !== "unavailable") return s;
  return null;
}

class KiK2Card extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-k2-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-k2-card", default_view: "enkel" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._media = "kamera";
    this._bekreft = false;
    this._pending = {};
    this._timers = {};
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "creality_k2",
        title: "",
        default_view: "enkel",
        remember_view: true,
        show_media: true,
        show_cfs: true,
        show_energi: true,
        romvifte: "fan.baderomsvifte",
        homey_flow: "button.homey_flows_02_creality_k2_bryter",
        cfs_slots: 4,
      },
      config || {}
    );
    this._p = this._config.prefix || "creality_k2";
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 24 : 14; }

  s(n) { return `sensor.${this._p}_${n}`; }
  nu(n) { return `number.${this._p}_${n}`; }
  bt(n) { return `button.${this._p}_${n}`; }
  fa(n) { return `fan.${this._p}_${n}`; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-k2-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-k2-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|" + this._media + "|";
    for (const id of this._watched) sig += ((hass.states[id] || {}).state || "-") + ",";
    if (sig !== this._sig) { this._sig = sig; this._update(); }
    if (this._mediaEl) this._mediaEl.hass = hass;
  }

  /* ------------------------------------------------------------ *
   * Bygg
   * ------------------------------------------------------------ */

  _build() {
    this._watched = new Set();
    const c = this._config;

    this.shadowRoot.innerHTML = `<style>${KiK2Card.styles}</style>
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escK(c.title)}</div>` : ""}
          ${this._statusHtml()}
          ${c.show_media ? this._mediaHtml() : ""}
          ${this._knapperHtml()}
          ${this._switchHtml()}
          ${this._tempHtml()}
          ${c.show_cfs ? this._cfsHtml() : ""}
          <div class="avansert-kun">
            ${this._vifterHtml()}
            ${this._tuningHtml()}
            ${c.show_energi ? this._energiHtml() : ""}
            ${this._systemHtml()}
          </div>
        </div>
      </ha-card>`;

    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._root.addEventListener("input", (e) => this._onInput(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _statusHtml() {
    ["print_status", "print_progress", "print_time_left", "print_job_time", "working_layer", "total_layers", "current_object"]
      .forEach((x) => this._watched.add(this.s(x)));
    return `
      <div class="status" id="status">
        <div class="ring" data-action="more" data-entity="${this.s("print_progress")}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-spor" cx="50" cy="50" r="43"></circle>
            <circle class="ring-fyll" id="ring-fyll" cx="50" cy="50" r="43"></circle>
          </svg>
          <div class="ring-tall" id="ring-tall">–</div>
        </div>
        <div class="status-tekst">
          <div class="status-navn" id="status-navn">–</div>
          <div class="status-jobb" id="status-jobb">–</div>
          <div class="status-detalj" id="status-detalj">–</div>
        </div>
      </div>`;
  }

  _mediaHtml() {
    return `
      <div class="media">
        <div class="media-bytt">
          <div class="media-valg" data-action="media" data-media="kamera">Kamera</div>
          <div class="media-valg" data-action="media" data-media="preview">Modell</div>
        </div>
        <div class="media-flate" id="media-flate"></div>
      </div>`;
  }

  _knapperHtml() {
    const knapper = [
      { key: "pause",  icon: "mdi:pause",        navn: "Pause",  ent: this.bt("pause_print"),  type: "button" },
      { key: "resume", icon: "mdi:play",         navn: "Fortsett", ent: this.bt("resume_print"), type: "button" },
      { key: "stop",   icon: "mdi:stop",         navn: "Stopp",  ent: this.bt("stop_print"),   type: "button", bekreft: true },
      { key: "light",  icon: "mdi:lightbulb",    navn: "Lys",    ent: `light.${this._p}_light`, type: "light" },
      { key: "power",  icon: "mdi:power",        navn: "Strøm",  ent: `switch.${this._p}`,      type: "switch", bekreft: true },
      { key: "home",   icon: "mdi:home-import-outline", navn: "Home", ent: this.bt("home_xy_then_z"), type: "button", avansert: true },
    ];
    return `
      <div class="knapper">
        ${knapper.map((k) => {
          this._watched.add(k.ent);
          return `
            <div class="knapp k-${k.key} ${k.avansert ? "avansert-kun" : ""}"
                 data-action="btn" data-key="${k.key}" data-type="${k.type}" data-entity="${k.ent}"
                 data-bekreft="${k.bekreft ? "1" : ""}" tabindex="0" role="button">
              <div class="knapp-sirkel"><ha-icon icon="${k.icon}"></ha-icon></div>
              <div class="knapp-navn">${escK(k.navn)}</div>
            </div>`;
        }).join("")}
      </div>`;
  }

  _switchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _tempHtml() {
    const t = [
      { navn: "Dyse",    icon: "mdi:printer-3d-nozzle-heat", nå: this.s("nozzle_temperature"),  mål: this.nu("nozzle_target"),  maks: this.s("max_nozzle_temperature") },
      { navn: "Plate",   icon: "mdi:heating-coil",           nå: this.s("bed_temperature"),     mål: this.nu("bed_target"),     maks: this.s("max_bed_temperature") },
      { navn: "Kammer",  icon: "mdi:home-thermometer",       nå: this.s("chamber_temperature"), mål: this.nu("chamber_target"), maks: this.s("max_chamber_temperature") },
    ];
    t.forEach((x) => { this._watched.add(x.nå); this._watched.add(x.mål); });
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Temperatur</span><span class="blokk-sub" id="temp-sub"></span></div>
        <div class="temp-rutenett">
          ${t.map((x) => `
            <div class="temp" data-action="more" data-entity="${x.nå}">
              <ha-icon icon="${x.icon}"></ha-icon>
              <div class="temp-navn">${escK(x.navn)}</div>
              <div class="temp-verdi"><span data-bind="num" data-entity="${x.nå}" data-dec="0" data-unit="°">–</span><span class="temp-mal" data-bind="mal" data-entity="${x.mål}"></span></div>
            </div>`).join("")}
        </div>
        <div class="avansert-kun">
          ${t.map((x) => `
            <div class="slider-rad">
              <div class="slider-topp">
                <div class="slider-navn" data-action="more" data-entity="${x.mål}">${escK(x.navn)} — mål</div>
                <div class="slider-verdi" data-bind="num" data-entity="${x.mål}" data-dec="0" data-unit=" °C">–</div>
              </div>
              <input class="slider" type="range" data-bind="range" data-domain="number" data-entity="${x.mål}">
            </div>`).join("")}
        </div>
      </div>`;
  }

  _cfsHtml() {
    const n = Math.min(4, Math.max(1, Number(this._config.cfs_slots) || 4));
    const aktiv = this.s("active_filament_slot");
    this._watched.add(aktiv);
    ["cfs_box_1_temperature", "cfs_box_1_humidity", "cfs_external_filament", "cfs_external_color", "cfs_external_remaining", "filament_status"]
      .forEach((x) => this._watched.add(this.s(x)));

    let slots = "";
    for (let i = 1; i <= n; i++) {
      const f = this.s(`cfs_box_1_slot_${i}_filament`);
      const c = this.s(`cfs_box_1_slot_${i}_color`);
      const r = this.s(`cfs_box_1_slot_${i}_remaining`);
      [f, c, r].forEach((x) => this._watched.add(x));
      slots += `
        <div class="slot" data-slot="${i}" data-action="more" data-entity="${f}">
          <div class="slot-farge" data-bind="farge" data-entity="${c}"><span class="slot-nr">${i}</span></div>
          <div class="slot-navn" data-bind="tekst" data-entity="${f}">–</div>
          <div class="slot-spor"><div class="slot-fyll" data-bind="pct" data-entity="${r}"></div></div>
          <div class="slot-pct" data-bind="num" data-entity="${r}" data-dec="0" data-unit=" %">–</div>
        </div>`;
    }

    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Filament (CFS)</span><span class="blokk-sub" id="cfs-sub">–</span></div>
        <div class="slots">${slots}</div>
        <div class="avansert-kun">
          <div class="rad rad-les" data-action="more" data-entity="${this.s("cfs_external_filament")}">
            <div class="prikk" data-bind="farge-prikk" data-entity="${this.s("cfs_external_color")}"></div>
            <div class="rad-navn">Ekstern spole</div>
            <div class="rad-verdi"><span data-bind="tekst" data-entity="${this.s("cfs_external_filament")}">–</span> · <span data-bind="num" data-entity="${this.s("cfs_external_remaining")}" data-dec="0" data-unit=" %">–</span></div>
          </div>
          <div class="rad rad-les" data-action="more" data-entity="${this.s("filament_status")}">
            <div class="prikk"></div>
            <div class="rad-navn">Filamentstatus</div>
            <div class="rad-verdi" data-bind="tekst" data-entity="${this.s("filament_status")}">–</div>
          </div>
        </div>
      </div>`;
  }

  _vifterHtml() {
    const vifter = [
      { ent: this.fa("model_fan"), navn: "Modellvifte", icon: "mdi:fan" },
      { ent: this.fa("side_fan"),  navn: "Sidevifte",   icon: "mdi:fan" },
      { ent: this.fa("case_fan"),  navn: "Kabinettvifte", icon: "mdi:fan-chevron-up" },
    ];
    if (this._config.romvifte) vifter.push({ ent: this._config.romvifte, navn: "Baderomsvifte", icon: "mdi:air-filter", rom: true });
    vifter.forEach((v) => this._watched.add(v.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Vifter</span><span class="blokk-sub">Baderomsvifta lufter ut damp fra utskriften</span></div>
        ${vifter.map((v) => `
          <div class="rad">
            <div class="rad-ikon ${v.rom ? "rom" : ""}" data-bind="vifte-ikon" data-entity="${v.ent}"><ha-icon icon="${v.icon}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${v.ent}">${escK(v.navn)}</div>
            <div class="rad-verdi" data-bind="vifte" data-entity="${v.ent}">–</div>
            <div class="bryter" data-toggle="${v.ent}" data-entity="${v.ent}" data-action="fan" tabindex="0" role="switch"><span class="bryter-kule"></span></div>
          </div>`).join("")}
      </div>`;
  }

  _tuningHtml() {
    const rader = [
      { ent: this.s("print_speed"),          navn: "Hastighet",       dec: 0, unit: " mm/s" },
      { ent: this.s("real_time_flow"),       navn: "Flyt nå",         dec: 1, unit: " mm³/s" },
      { ent: this.s("flow_rate"),            navn: "Flytrate",        dec: 0, unit: " %" },
      { ent: this.s("used_material_length"), navn: "Brukt materiale", dec: 1, unit: " m" },
      { ent: this.s("object_count"),         navn: "Objekter",        dec: 0, unit: "" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    ["position_x", "position_y", "position_z"].forEach((x) => this._watched.add(this.s(x)));
    this._watched.add(this.nu("print_tuning"));

    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Utskrift</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="num" data-entity="${r.ent}" data-dec="${r.dec}" data-unit="${escK(r.unit)}">–</div>
          </div>`).join("")}
        <div class="slider-rad">
          <div class="slider-topp">
            <div class="slider-navn" data-action="more" data-entity="${this.nu("print_tuning")}">Tuning</div>
            <div class="slider-verdi" data-bind="num" data-entity="${this.nu("print_tuning")}" data-dec="0" data-unit="">–</div>
          </div>
          <input class="slider" type="range" data-bind="range" data-domain="number" data-entity="${this.nu("print_tuning")}">
        </div>
        <div class="posisjon">
          <div class="pos"><span>X</span><b data-bind="num" data-entity="${this.s("position_x")}" data-dec="1" data-unit="">–</b></div>
          <div class="pos"><span>Y</span><b data-bind="num" data-entity="${this.s("position_y")}" data-dec="1" data-unit="">–</b></div>
          <div class="pos"><span>Z</span><b data-bind="num" data-entity="${this.s("position_z")}" data-dec="2" data-unit="">–</b></div>
        </div>
      </div>`;
  }

  _energiHtml() {
    const p = this._p;
    const rader = [
      { ent: `sensor.${p}_power`,   navn: "Effekt nå",     dec: 0, unit: " W" },
      { ent: `sensor.${p}_energy_hourly`, navn: "Denne timen", dec: 2, unit: " kWh" },
      { ent: `sensor.${p}_energy_daily`,  navn: "I dag",       dec: 2, unit: " kWh" },
      { ent: `sensor.${p}_energy_monthly`,navn: "Denne måneden", dec: 2, unit: " kWh" },
      { ent: `sensor.um_daily_cost_${p}_norgespris`, navn: "Kostnad i dag", dec: 2, unit: " kr" },
      { ent: `sensor.um_monthly_cost_${p}_norgespris`, navn: "Kostnad denne måneden", dec: 2, unit: " kr" },
      { ent: `sensor.cost_hour_${p}_norgespris`, navn: "Kostnad denne timen", dec: 2, unit: " kr" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Energi</span><span class="blokk-sub">Norgespris</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="num" data-entity="${r.ent}" data-dec="${r.dec}" data-unit="${escK(r.unit)}">–</div>
          </div>`).join("")}
      </div>`;
  }

  _systemHtml() {
    const rader = [
      { ent: this.s("model"),  navn: "Modell" },
      { ent: this.s("system"), navn: "System" },
      { ent: this.s("print_control"), navn: "Print control" },
    ];
    rader.forEach((r) => this._watched.add(r.ent));
    const flow = this._config.homey_flow;
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>System</span></div>
        ${rader.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="prikk usynlig"></div>
            <div class="rad-navn">${escK(r.navn)}</div>
            <div class="rad-verdi" data-bind="tekst" data-entity="${r.ent}">–</div>
          </div>`).join("")}
        <div class="hurtig">
          <div class="mini" data-action="btn" data-type="button" data-entity="${this.bt("reconnect")}">Koble til på nytt</div>
          ${flow ? `<div class="mini" data-action="btn" data-type="button" data-entity="${flow}">Homey: bryter</div>` : ""}
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ *
   * Oppdatering
   * ------------------------------------------------------------ */

  _update() {
    const h = this._hass;
    if (!h || !this._built) return;

    this._root.querySelectorAll("[data-bind]").forEach((el) => {
      const st = h.states[el.dataset.entity];
      const k = el.dataset.bind;

      if (k === "num") {
        el.textContent = st ? nfK(st.state, Number(el.dataset.dec ?? 0)) + (el.dataset.unit || "") : "–";
      } else if (k === "tekst") {
        const v = st ? st.state : null;
        el.textContent = !v || v === "unknown" || v === "unavailable" || v === "None" ? "–" : v;
      } else if (k === "mal") {
        const m = st ? Number(st.state) : NaN;
        el.textContent = isFinite(m) && m > 0 ? ` / ${Math.round(m)}°` : "";
      } else if (k === "pct") {
        const v = st ? Math.max(0, Math.min(100, Number(st.state))) : 0;
        el.style.width = (isFinite(v) ? v : 0) + "%";
      } else if (k === "farge" || k === "farge-prikk") {
        const f = st ? fargeAv(st.state) : null;
        el.style.background = f || "rgba(128,128,128,.30)";
        el.classList.toggle("tom", !f);
      } else if (k === "range") {
        if (!st) { el.disabled = true; return; }
        el.disabled = false;
        el.min = st.attributes.min ?? 0;
        el.max = st.attributes.max ?? 100;
        el.step = st.attributes.step ?? 1;
        if (this._root.activeElement !== el && this._pending[el.dataset.entity] === undefined) el.value = st.state;
      } else if (k === "vifte") {
        if (!st) { el.textContent = "–"; return; }
        const pct = st.attributes.percentage;
        el.textContent = st.state === "on" ? (pct !== undefined && pct !== null ? `${Math.round(pct)} %` : "På") : "Av";
      } else if (k === "vifte-ikon") {
        el.classList.toggle("spinner", !!st && st.state === "on");
      }
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      el.classList.toggle("on", !!st && st.state === "on");
      el.classList.toggle("mangler", !st);
    });

    this._updateStatus();
    this._updateKnapper();
    this._updateCfs();
    if (this._config.show_media) this._mountMedia();
  }

  _updateStatus() {
    const h = this._hass;
    const st = h.states[this.s("print_status")];
    const raw = st ? String(st.state).toLowerCase() : "";
    const navn = STATUS_NO[raw] || (st ? st.state : "–");
    const aktiv = AKTIV.includes(raw);

    const boks = this._root.getElementById("status");
    boks.dataset.tilstand = raw === "paused" ? "pauset" : raw === "error" ? "feil" : aktiv ? "aktiv" : "rolig";

    const pro = Number((h.states[this.s("print_progress")] || {}).state);
    const pct = isFinite(pro) ? Math.max(0, Math.min(100, pro)) : 0;
    const omkrets = 2 * Math.PI * 43;
    const ring = this._root.getElementById("ring-fyll");
    ring.style.strokeDasharray = `${omkrets}`;
    ring.style.strokeDashoffset = `${omkrets * (1 - pct / 100)}`;
    this._root.getElementById("ring-tall").textContent = isFinite(pro) ? `${Math.round(pct)}%` : "–";

    this._root.getElementById("status-navn").textContent = navn;

    const obj = h.states[this.s("current_object")];
    const jobb = obj && obj.state && !["unknown", "unavailable", "None", ""].includes(obj.state) ? obj.state : aktiv ? "Utskrift pågår" : "Ingen jobb";
    this._root.getElementById("status-jobb").textContent = jobb;

    const igjen = h.states[this.s("print_time_left")];
    const lag = h.states[this.s("working_layer")];
    const totalt = h.states[this.s("total_layers")];
    const del = [];
    if (aktiv && igjen) del.push(`${varighet(igjen.state)} igjen`);
    if (lag && totalt && isFinite(Number(totalt.state)) && Number(totalt.state) > 0) del.push(`Lag ${lag.state}/${totalt.state}`);
    if (!aktiv) {
      const jobbtid = h.states[this.s("print_job_time")];
      if (jobbtid && raw !== "idle") del.push(`Brukte ${varighet(jobbtid.state)}`);
    }
    this._root.getElementById("status-detalj").textContent = del.join("  ·  ") || "Klar til utskrift";

    const tempSub = this._root.getElementById("temp-sub");
    if (tempSub) tempSub.textContent = aktiv ? "Under utskrift" : "";
  }

  _updateKnapper() {
    const h = this._hass;
    const raw = String((h.states[this.s("print_status")] || {}).state || "").toLowerCase();
    const skriver = ["printing", "running", "busy"].includes(raw);
    const pauset = raw === "paused";
    const aktiv = AKTIV.includes(raw);

    const sett = (key, mulig) => {
      const el = this._root.querySelector(`.knapp.k-${key}`);
      if (el) el.classList.toggle("inaktiv", !mulig);
    };
    sett("pause", skriver);
    sett("resume", pauset);
    sett("stop", aktiv);
    sett("home", !aktiv);

    ["light", "power"].forEach((key) => {
      const el = this._root.querySelector(`.knapp.k-${key}`);
      if (!el) return;
      const st = h.states[el.dataset.entity];
      el.classList.toggle("på", !!st && st.state === "on");
      el.classList.toggle("mangler", !st);
    });
  }

  _updateCfs() {
    const sub = this._root.getElementById("cfs-sub");
    if (!sub) return;
    const a = this._hass.states[this.s("active_filament_slot")];
    const boks = this._hass.states[this.s("cfs_box_1_temperature")];
    const fukt = this._hass.states[this.s("cfs_box_1_humidity")];
    const del = [];
    if (boks) del.push(`${nfK(boks.state, 0)} °C`);
    if (fukt) del.push(`${nfK(fukt.state, 0)} % RF`);
    sub.textContent = del.join(" · ");

    const nr = a ? parseInt(a.state, 10) : NaN;
    this._root.querySelectorAll(".slot").forEach((el) => {
      el.classList.toggle("aktiv", isFinite(nr) && Number(el.dataset.slot) === nr);
    });
  }

  async _mountMedia() {
    const flate = this._root.getElementById("media-flate");
    if (!flate) return;
    this._root.querySelectorAll(".media-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.media === this._media));
    if (flate.dataset.type === this._media) return;

    try {
      const helpers = await window.loadCardHelpers();
      const conf = this._media === "kamera"
        ? { type: "picture-entity", entity: `camera.${this._p}_printer_camera`, camera_view: "live", show_state: false, show_name: false }
        : { type: "picture-entity", entity: `image.${this._p}_current_print_preview`, show_state: false, show_name: false };
      const el = helpers.createCardElement(conf);
      el.hass = this._hass;
      flate.innerHTML = "";
      flate.appendChild(el);
      flate.dataset.type = this._media;
      this._mediaEl = el;
    } catch (e) {
      flate.textContent = "Kunne ikke laste bildet.";
    }
  }

  /* ------------------------------------------------------------ *
   * Interaksjon
   * ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "more") {
      this._moreInfo(el.dataset.entity);
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "media") {
      this._media = el.dataset.media;
      this._mountMedia();
      this._haptic("selection");
    } else if (a === "fan") {
      const st = this._hass.states[el.dataset.entity];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("fan", st.state === "on" ? "turn_off" : "turn_on", { entity_id: el.dataset.entity });
    } else if (a === "btn") {
      this._trykk(el);
    }
  }

  _trykk(el) {
    if (el.classList.contains("inaktiv") || el.classList.contains("mangler")) return;
    const id = el.dataset.entity;
    const type = el.dataset.type;

    if (el.dataset.bekreft === "1" && this._bekreft !== id) {
      this._bekreft = id;
      el.classList.add("bekreft");
      this._haptic("warning");
      clearTimeout(this._bekreftTimer);
      this._bekreftTimer = setTimeout(() => {
        this._bekreft = false;
        this._root.querySelectorAll(".bekreft").forEach((n) => n.classList.remove("bekreft"));
      }, 4000);
      return;
    }
    clearTimeout(this._bekreftTimer);
    this._bekreft = false;
    el.classList.remove("bekreft");
    this._haptic("medium");

    if (type === "button") this._hass.callService("button", "press", { entity_id: id });
    else if (type === "light") {
      const st = this._hass.states[id];
      this._hass.callService("light", st && st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    } else if (type === "switch") {
      const st = this._hass.states[id];
      this._hass.callService("switch", st && st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    }
  }

  _onInput(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    this._pending[el.dataset.entity] = Number(el.value);
    const vis = this._root.querySelector(`[data-bind="num"][data-entity="${el.dataset.entity}"]`);
    if (vis) vis.textContent = nfK(el.value, Number(vis.dataset.dec ?? 0)) + (vis.dataset.unit || "");
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    const id = el.dataset.entity;
    const verdi = Number(el.value);
    clearTimeout(this._timers[id]);
    this._timers[id] = setTimeout(() => {
      delete this._pending[id];
      this._hass.callService("number", "set_value", { entity_id: id, value: verdi });
    }, 300);
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) { this._lagreView(this._view); this._haptic("selection"); }
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
  }

  _moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }
  _haptic(type) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  /* ------------------------------------------------------------ *
   * Stil
   * ------------------------------------------------------------ */

  static get styles() {
    return `
      :host { display:block; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0; }
      .wrap { display:flex; flex-direction:column; gap:10px; color: var(--gray1000, var(--primary-text-color)); }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Status */
      .status { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:16px; }
      .ring { position:relative; width:88px; height:88px; cursor:pointer; }
      .ring svg { width:88px; height:88px; transform: rotate(-90deg); }
      .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
      .ring-spor { stroke: rgba(128,128,128,.24); }
      .ring-fyll { stroke: var(--gray1000, var(--primary-text-color));
        transition: stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1), stroke .3s ease; }
      .status[data-tilstand="aktiv"] .ring-fyll { stroke: var(--green, #4caf50); }
      .status[data-tilstand="pauset"] .ring-fyll { stroke: var(--orange, #fc6d09); }
      .status[data-tilstand="feil"] .ring-fyll { stroke: var(--red, #f44336); }
      .ring-tall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:19px; font-weight:600; font-variant-numeric:tabular-nums; }
      .status-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .status-jobb { font-size:14px; opacity:.8; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .status-detalj { font-size:13px; opacity:.6; margin-top:2px; }

      /* Media */
      .media { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px; }
      .media-bytt { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:2px 2px 8px; }
      .media-valg { text-align:center; padding:7px 0; border-radius:75px; font-size:13px; cursor:pointer; opacity:.6;
        background: rgba(128,128,128,.16); }
      .media-valg.aktiv { background: rgba(128,128,128,.30); opacity:1; font-weight:600; }
      .media-flate { border-radius:18px; overflow:hidden; min-height:120px; background: rgba(0,0,0,.2); }
      .media-flate ha-card { background:none; border:none; box-shadow:none; }

      /* Knapper */
      .knapper { display:flex; justify-content:space-between; gap:6px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:12px 10px; }
      .knapp { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; }
      .knapp-sirkel { width:54px; height:54px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.18); transition: background .18s ease, color .18s ease; }
      .knapp-sirkel ha-icon { --mdc-icon-size:26px; }
      .knapp-navn { font-size:12px; opacity:.7; }
      .knapp:active .knapp-sirkel { transform: scale(.94); }
      .knapp.inaktiv { opacity:.32; pointer-events:none; }
      .knapp.mangler { opacity:.25; pointer-events:none; }
      .k-pause .knapp-sirkel { background: rgba(252,109,9,.90); color:#fff; }
      .k-resume .knapp-sirkel { background: rgba(76,175,80,.90); color:#fff; }
      .k-stop .knapp-sirkel { background: rgba(244,67,54,.95); color:#fff; }
      .k-light.på .knapp-sirkel { background: rgba(255,235,59,.95); color:#000; }
      .k-power.på .knapp-sirkel { background: var(--active-big, var(--primary-color)); color: var(--gray100,#fafbfc); }
      .knapp.bekreft .knapp-sirkel { outline:3px solid var(--gray1000, var(--primary-text-color)); outline-offset:2px; }
      .knapp.bekreft .knapp-navn::after { content:" — trykk igjen"; }

      /* Visningsbryter */
      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; opacity:.6; transition: background .18s ease, opacity .18s ease, color .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      /* Blokk */
      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 14px; }
      .blokk + .blokk { margin-top:10px; }
      .avansert-kun > .blokk:first-child { margin-top:0; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline; gap:10px;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px 8px; }
      .blokk-sub { font-weight:500; text-align:right; }

      /* Temperatur */
      .temp-rutenett { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .temp { background: rgba(128,128,128,.12); border-radius:18px; padding:12px 8px; text-align:center; cursor:pointer; }
      .temp ha-icon { --mdc-icon-size:22px; opacity:.8; }
      .temp-navn { font-size:12px; opacity:.65; margin-top:2px; }
      .temp-verdi { font-size:17px; font-weight:600; font-variant-numeric:tabular-nums; margin-top:2px; }
      .temp-mal { font-size:13px; opacity:.55; font-weight:500; }

      /* Slots */
      .slots { display:flex; flex-direction:column; gap:8px; }
      .slot { display:grid; grid-template-columns:38px 1fr 90px 48px; align-items:center; gap:10px;
        padding:6px 8px; border-radius:16px; cursor:pointer; background: rgba(128,128,128,.10); }
      .slot.aktiv { background: rgba(128,128,128,.22); box-shadow: inset 0 0 0 2px var(--active-big, var(--primary-color)); }
      .slot-farge { width:34px; height:34px; border-radius:10px; position:relative;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); }
      .slot-nr { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:#fff; text-shadow:0 0 3px rgba(0,0,0,.7); }
      .slot-navn { font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .slot-spor { height:7px; border-radius:4px; background: rgba(128,128,128,.26); overflow:hidden; }
      .slot-fyll { height:100%; width:0%; border-radius:4px; background: var(--gray1000, var(--primary-text-color)); opacity:.75;
        transition: width .5s ease; }
      .slot-pct { font-size:13px; font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }

      /* Rader */
      .rad { display:grid; grid-template-columns:36px 1fr auto auto; align-items:center; gap:10px; padding:8px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-les { grid-template-columns:14px 1fr auto; cursor:pointer; }
      .rad-ikon { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.14); }
      .rad-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .rad-ikon.spinner ha-icon { animation: snurr 2.4s linear infinite; }
      @keyframes snurr { to { transform: rotate(360deg); } }
      .rad-navn { font-size:14.5px; cursor:pointer; }
      .rad-verdi { font-size:14px; font-weight:600; opacity:.85; font-variant-numeric:tabular-nums; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .prikk.usynlig { background:none; }

      .bryter { width:46px; height:28px; border-radius:75px; background: rgba(128,128,128,.28); cursor:pointer;
        position:relative; transition: background .18s ease; }
      .bryter.on { background: var(--active-big, var(--primary-color)); }
      .bryter-kule { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%;
        background:#fff; transition: transform .18s ease; }
      .bryter.on .bryter-kule { transform: translateX(18px); }

      /* Slider */
      .slider-rad { padding:10px 2px 4px; }
      .slider-topp { display:flex; justify-content:space-between; align-items:baseline; }
      .slider-navn { font-size:14.5px; font-weight:500; cursor:pointer; }
      .slider-verdi { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; margin:12px 0 4px;
        border-radius:4px; background: rgba(128,128,128,.28); outline:none; }
      .slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; border:none; }
      .slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; border:none;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; }

      /* Posisjon */
      .posisjon { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
      .pos { background: rgba(128,128,128,.12); border-radius:14px; padding:8px; text-align:center; }
      .pos span { font-size:12px; opacity:.6; margin-right:6px; }
      .pos b { font-size:14px; font-variant-numeric:tabular-nums; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); }
      .mini:active { transform: scale(.98); }

      .mangler { opacity:.4; }
      [tabindex]:focus-visible { outline:2px solid var(--active-big, var(--primary-color)); outline-offset:2px; }
      @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important; } }
      @media (max-width: 400px) {
        .status { grid-template-columns:80px 1fr; gap:10px; padding:12px; }
        .ring, .ring svg { width:76px; height:76px; }
        .knapp-sirkel { width:46px; height:46px; }
        .knapp-sirkel ha-icon { --mdc-icon-size:22px; }
        .slot { grid-template-columns:34px 1fr 60px 44px; }
      }
    `;
  }
}

window.KI.define("ki-k2-card", KiK2Card);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const K2_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  { name: "romvifte", selector: { entity: { domain: ["fan", "switch"] } } },
  { name: "homey_flow", selector: { entity: { domain: "button" } } },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { name: "cfs_slots", selector: { number: { min: 1, max: 4, mode: "slider" } } },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_media", selector: { boolean: {} } },
    { name: "show_cfs", selector: { boolean: {} } },
    { name: "show_energi", selector: { boolean: {} } },
  ] },
];

const K2_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  romvifte: "Romvifte",
  homey_flow: "Homey-flow (valgfri)",
  default_view: "Standardvisning",
  cfs_slots: "Antall CFS-slots",
  remember_view: "Husk valgt visning",
  show_media: "Vis kamera og modell",
  show_cfs: "Vis filament",
  show_energi: "Vis energi",
};

class KiK2CardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) {
    this._config = Object.assign(
      { prefix: "creality_k2", default_view: "enkel", remember_view: true,
        show_media: true, show_cfs: true, show_energi: true, cfs_slots: 4 },
      config || {}
    );
    this._render();
  }

  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }

  _render() {
    if (!this._form) {
      this.shadowRoot.innerHTML = `<style>
        .info { font-size:13px; opacity:.7; padding:10px 2px 0; line-height:1.45; }
        code { background: rgba(128,128,128,.18); padding:1px 5px; border-radius:5px; }
      </style>`;
      this._form = document.createElement("ha-form");
      this._form.schema = K2_SCHEMA;
      this._form.computeLabel = (s) => K2_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = "Alle printerentiteter bygges fra prefikset, f.eks. <code>creality_k2</code> → <code>sensor.creality_k2_print_status</code>. Energisensorene følger <code>sensor.creality_k2_energy_daily</code> og <code>sensor.um_daily_cost_creality_k2_norgespris</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

window.KI.define("ki-k2-card-editor", KiK2CardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-k2-card",
  name: "KI Creality K2",
  description: "3D-printer med status, kamera, filament, vifter og energi",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-k2-card feilet", e); }

/* ===== ki-kamera-card ===== */
try {
/**
 * ki-kamera-card.js  —  v1.0.0
 *
 * Kameraoversikt i samme designspråk som ki-energi-card og ki-alarm-card.
 *   • Kildebryter: Frigate (advanced-camera-card + hendelsesgalleri) eller
 *     Vanlig (rå kamerastrøm, f.eks. UniFi high resolution channel)
 *   • Kamerapiller med ikon, horisontalt rullbare
 *   • Hendelsesfane som samler alle Frigate-kameraene
 *   • Full GUI-editor
 *
 * De eksisterende kortene dine brukes videre — dette kortet monterer
 * custom:advanced-camera-card og custom:mysmart-frigate-gallery inni seg.
 *
 * Legges i /config/www/ki-kamera-card.js og registreres som
 * JavaScript Module: /local/ki-kamera-card.js
 */

const KI_KAMERA_VERSION = "1.8.0";

console.info(
  `%c KI-KAMERA-CARD %c ${KI_KAMERA_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#3b82f6;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* ──────────────────────────────────────────────────────── oppsett/presets ── */

/**
 * Presets for Alle-visningen. `omrader` er grid-template-areas, ett felt per
 * kamera i rekkefølgen de står i konfigurasjonen (a, b, c, d, e …).
 * Kameraer utover feltene legges til som fullbreddes rader nederst.
 */
const OPPSETT = {
  mosaikk: {
    navn: "Mosaikk",
    ikon: "mdi:view-quilt-outline",
    kolonner: "1fr 1fr",
    rader: "1fr 1fr 1fr",
    ratio: "1 / 1",
    omrader: ['"a b"', '"a c"', '"d e"'],
  },
  hoved: {
    navn: "Hovedkamera",
    ikon: "mdi:view-dashboard-outline",
    kolonner: "1fr 1fr",
    // Ingen fast høyde på beholderen: hver celle får 16:9, så hovedkameraet
    // fyller hele bredden i full høyde i stedet for å presses inn i en rad.
    celleRatio: "16 / 9",
    omrader: ['"a a"', '"b c"', '"d e"'],
  },
  rutenett: {
    navn: "Rutenett",
    ikon: "mdi:view-grid-outline",
    kolonner: "1fr 1fr",
    celleRatio: "16 / 9",
    auto: true,
  },
  liste: {
    navn: "Liste",
    ikon: "mdi:view-sequential-outline",
    kolonner: "1fr",
    celleRatio: "16 / 9",
    auto: true,
  },
};

const FELTNAVN = "abcdefghijklmnop".split("");

const STANDARD_KONFIG = () => ({
  type: "custom:ki-kamera-card",
  title: "Kamera",
  title_icon: "mdi:cctv",
  grid_layout: "mosaikk",
  fill_screen: true,
  fill_offset: 210,
  privacy_invert: true,
  logbook_hours: 24,
  logbook_limit: 60,
  show_layout_switcher: true,
  default_source: "frigate",
  show_events: true,
  events_limit: 12,
  events_columns: 2,
  events_height: "500px",
  cameras: [
    {
      name: "Inngang",
      icon: "mdi:doorbell-video",
      plain: "camera.ringeklokke_g6_entry_high_resolution_channel",
      frigate: ["camera.ringeklokke", "camera.ringeklokke_pakke"],
      privacy: "switch.ringeklokke_g6_entry_privacy_mode",
      motion: "binary_sensor.ringeklokke_g6_entry_motion",
      last_motion: "sensor.ringeklokke_g6_entry_last_motion_detected",
      logbook: [
        "binary_sensor.ringeklokke_g6_entry_doorbell",
        "binary_sensor.ringeklokke_g6_entry_motion",
        "binary_sensor.ringeklokke_g6_entry_person_detected",
        "binary_sensor.ringeklokke_g6_entry_car_alarm_detected",
        "switch.ringeklokke_g6_entry_package_detection",
        "switch.ringeklokke_g6_entry_animal_detection",
        "switch.ringeklokke_g6_entry_speaking_detection",
      ],
    },
    {
      name: "Mellomgang",
      icon: "mdi:stairs",
      plain: "camera.mellomgang_g5_turret_ultra_high_resolution_channel",
      frigate: ["camera.mellomgang"],
      privacy: "switch.mellomgang_g5_turret_ultra_privacy_mode",
      motion: "binary_sensor.mellomgang_g5_turret_ultra_motion",
      last_motion: "sensor.mellomgang_g5_turret_ultra_last_motion_detected",
      logbook: [
        "binary_sensor.mellomgang_g5_turret_ultra_motion",
        "binary_sensor.mellomgang_g5_turret_ultra_person_detected",
      ],
    },
    {
      name: "Pakke",
      icon: "mdi:package-variant-closed",
      plain: "camera.ringeklokke_g6_entry_package_camera",
      frigate: ["camera.ringeklokke_pakke"],
      privacy: "switch.ringeklokke_g6_entry_privacy_mode",
      logbook: [
        "binary_sensor.ringeklokke_g6_entry_package_detected",
        "switch.ringeklokke_g6_entry_package_detection",
      ],
    },
    {
      name: "Veranda",
      icon: "mdi:flower",
      plain: "camera.veranda_g6_bullet_high_resolution_channel",
      frigate: ["camera.veranda"],
      privacy: "switch.veranda_g6_bullet_privacy_mode",
      motion: "binary_sensor.veranda_g6_bullet_motion",
      last_motion: "sensor.veranda_g6_bullet_last_motion_detected",
      logbook: [
        "binary_sensor.veranda_g6_bullet_motion",
        "binary_sensor.veranda_g6_bullet_person_detected",
      ],
    },
    {
      name: "Stue",
      icon: "mdi:sofa",
      plain: "camera.stue_g6_turret_high_resolution_channel",
      frigate: ["camera.stue"],
      privacy: "switch.stue_g6_turret_privacy_mode",
      motion: "binary_sensor.stue_g6_turret_motion",
      last_motion: "sensor.stue_g6_turret_last_motion_detected",
      logbook: [
        "binary_sensor.stue_g6_turret_motion",
        "binary_sensor.stue_g6_turret_person_detected",
      ],
    },
  ],
});

/** «for 4 min siden», «i dag 09:12», «12. mai 14:03» */
const siden = (iso) => {
  if (!iso || iso === "unknown" || iso === "unavailable") return "Aldri";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Ukjent";
  const sek = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sek < 60) return "Nå nettopp";
  if (sek < 3600) return `${Math.floor(sek / 60)} min siden`;
  const klokke = d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  if (sek < 86400) return `${Math.floor(sek / 3600)} t siden · ${klokke}`;
  return (
    d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" }) + " " + klokke
  );
};

/* ─────────────────────────────────────────────── kortkonfigurasjoner ── */

/** Frigate-visning for ett kamera — samme oppsett som i det gamle dashbordet. */
const frigateKort = (entiteter) => ({
  type: "custom:advanced-camera-card",
  cameras: entiteter.map((e) => ({ camera_entity: e })),
  menu: {
    style: "hidden",
    buttons: {
      iris: { enabled: true },
      cameras: { enabled: false },
      substreams: { enabled: false },
      live: { enabled: true },
      download: { enabled: true },
      media_player: { enabled: false },
      clips: { enabled: false },
      snapshots: { enabled: false },
      timeline: { enabled: false },
      expand: { enabled: false },
    },
  },
  status_bar: {},
  media_viewer: {
    draggable: true,
    zoomable: true,
    lazy_load: true,
    snapshot_click_plays_clip: true,
  },
});

const galleriKort = (entiteter, cfg) => ({
  type: "custom:mysmart-frigate-gallery",
  title: "Hendelser",
  entities: entiteter,
  limit: cfg.events_limit || 12,
  columns: cfg.events_columns || 2,
  card_height: cfg.events_height || "500px",
});

const stromKort = (entitet, live) => ({
  type: "picture-entity",
  entity: entitet,
  camera_view: live ? "live" : "auto",
  show_state: false,
  show_name: false,
});


/* ────────────────────────────────────────────────────────────── tidslinje ── */

/** Oversetter tilstand til norsk, ut fra domene og device_class. */
const tilstandTekst = (hass, entityId, state) => {
  const s = hass.states[entityId];
  const dc = s && s.attributes ? s.attributes.device_class : null;
  const domene = (entityId || "").split(".")[0];
  const på = state === "on";

  if (domene === "binary_sensor") {
    if (dc === "motion" || dc === "occupancy") return på ? "Oppdaget" : "Klar";
    if (dc === "sound") return på ? "Lyd" : "Stille";
    if (dc === "door" || dc === "window" || dc === "opening")
      return på ? "Åpen" : "Lukket";
    if (dc === "problem") return på ? "Problem" : "OK";
    return på ? "Oppdaget" : "Klar";
  }
  if (domene === "switch" || domene === "light" || domene === "input_boolean") {
    return på ? "På" : "Av";
  }
  if (state === "unavailable") return "Utilgjengelig";
  if (state === "unknown") return "Ukjent";
  return state;
};

/** Ikon for en linje: fra loggen, fra entiteten, eller etter device_class. */
const linjeIkon = (hass, entityId, state, fraLogg) => {
  if (fraLogg) return fraLogg;
  const s = hass.states[entityId];
  if (s && s.attributes && s.attributes.icon) return s.attributes.icon;
  const dc = s && s.attributes ? s.attributes.device_class : null;
  const domene = (entityId || "").split(".")[0];
  const på = state === "on";
  if (dc === "motion" || dc === "occupancy") return på ? "mdi:motion-sensor" : "mdi:motion-sensor-off";
  if (dc === "sound") return "mdi:account-voice";
  if (dc === "door") return på ? "mdi:door-open" : "mdi:door-closed";
  if (entityId.includes("doorbell")) return "mdi:doorbell";
  if (entityId.includes("package")) return "mdi:package-variant-closed";
  if (entityId.includes("animal")) return "mdi:paw";
  if (entityId.includes("car")) return "mdi:car";
  if (entityId.includes("person")) return "mdi:account";
  if (entityId.includes("privacy")) return på ? "mdi:eye-off" : "mdi:eye";
  if (domene === "switch") return "mdi:toggle-switch-outline";
  return "mdi:information-outline";
};

/** «Område ▸ Enhet» under tittelen, hentet fra HAs registre. */
const opphav = (hass, entityId) => {
  const deler = [];
  try {
    const e = hass.entities ? hass.entities[entityId] : null;
    const d = e && e.device_id && hass.devices ? hass.devices[e.device_id] : null;
    const omrId = (e && e.area_id) || (d && d.area_id);
    const omr = omrId && hass.areas ? hass.areas[omrId] : null;
    if (omr && omr.name) deler.push(omr.name);
    if (d && d.name_by_user) deler.push(d.name_by_user);
    else if (d && d.name) deler.push(d.name);
  } catch (err) {
    /* registrene finnes ikke i eldre frontend */
  }
  return deler;
};

const klokke = (naar) => {
  const d = new Date(typeof naar === "number" ? naar * 1000 : naar);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const dagTekst = (naar) => {
  const d = new Date(typeof naar === "number" ? naar * 1000 : naar);
  const i_dag = new Date();
  const igaar = new Date(Date.now() - 86400000);
  const lik = (a, b) => a.toDateString() === b.toDateString();
  if (lik(d, i_dag)) return "I dag";
  if (lik(d, igaar)) return "I går";
  return d.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiKameraCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._kilde = "frigate";
    this._valgt = "hendelser";
    this._oppsett = "mosaikk";
    this._menyApen = false;
    this._cache = new Map();
    this._loggCache = new Map();
    this._montert = null;
    this._loggKort = null;
  }

  static getConfigElement() {
    return document.createElement("ki-kamera-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.cameras) this._config.cameras = [];
    this._oppsett = OPPSETT[config.grid_layout] ? config.grid_layout : "mosaikk";
    this._menyApen = false;
    this._kilde = config.default_source === "vanlig" ? "vanlig" : "frigate";
    // Startfanen må følge kilden — Direkte har ingen hendelsesfane
    this._valgt = this._forsteTilgjengelige();
    this._cache.clear();
    this._loggCache.clear();
    this._montert = null;
    this._loggKort = null;
    this._loggNoekkel = undefined;
    this._bygget = false;
  }

  set hass(hass) {
    const forste = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    // Nestede kort får hass videreformidlet uten at noe bygges på nytt,
    // ellers ville livestrømmen startet om ved hver tilstandsendring.
    if (this._montert) this._montert.hass = hass;
    if (this._loggKort) this._loggKort.hass = hass;
    if (forste) this._oppdater();
    else this._tegnDetaljer();
  }

  getCardSize() {
    return 12;
  }

  disconnectedCallback() {
    if (this._obs) this._obs.disconnect();
  }

  connectedCallback() {
    if (this._obs && this._rot) this._obs.observe(this._rot);
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiKameraCard.styles}</style>`;
    const rot = document.createElement("ha-card");
    rot.className = "rot";
    rot.innerHTML = `
      <div class="tittelrad" id="tittelrad"></div>
      <div class="kilde" id="kilde"></div>
      <div class="piller" id="piller"></div>
      <div class="innhold" id="innhold"></div>
      <div class="detaljer" id="detaljer"></div>
      <div class="logg" id="logg"></div>
    `;
    this.shadowRoot.appendChild(rot);
    this._rot = rot;

    // Brede skjermer (nettbrett, foldbare) får høydestyrt rutenett i stedet
    // for sideforhold per celle, slik at det fyller skjermen som på mobil.
    if (window.ResizeObserver) {
      this._obs = new ResizeObserver((e) => {
        const b = e[0] ? e[0].contentRect.width : 0;
        const bred = b >= (this._config.fill_breakpoint || 700);
        if (bred === this._bred) return;
        this._bred = bred;
        if (this._valgt === "alle") {
          this._montertNoekkel = null;
          this._visInnhold();
        }
      });
      this._obs.observe(rot);
    }

    rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) {
        if (this._menyApen) {
          this._menyApen = false;
          this._tegnPiller();
        }
        return;
      }
      if (
        this._menyApen &&
        el.dataset.handling !== "oppsett" &&
        el.dataset.handling !== "oppsett-meny"
      ) {
        this._menyApen = false;
      }
      if (el.dataset.handling === "kilde") {
        if (this._kilde === el.dataset.verdi) return;
        this._kilde = el.dataset.verdi;
        if (this._kilde === "vanlig") {
          // Direkte åpner alltid i oversikten
          this._valgt = "alle";
        } else if (!this._erTilgjengelig(this._valgt)) {
          this._valgt = this._forsteTilgjengelige();
        }
        this._oppdater();
      } else if (el.dataset.handling === "kamera") {
        if (this._valgt === el.dataset.verdi) return;
        this._valgt = el.dataset.verdi;
        this._oppdater();
      } else if (el.dataset.handling === "oppsett-meny") {
        this._menyApen = !this._menyApen;
        this._tegnPiller();
      } else if (el.dataset.handling === "oppsett") {
        this._menyApen = false;
        if (this._oppsett === el.dataset.verdi) {
          this._tegnPiller();
          return;
        }
        this._oppsett = el.dataset.verdi;
        this._oppdater();
      } else if (el.dataset.handling === "personvern") {
        this._hass.callService("switch", "toggle", {
          entity_id: el.dataset.entity,
        });
      } else if (el.dataset.handling === "mer-info") {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });

    this._bygget = true;
  }

  /* ------------------------------------------------------------ utvalg -- */

  _kameraer() {
    return (this._config.cameras || []).map((c, i) => ({
      ...c,
      id: String(i),
      harFrigate: !!(c.frigate && c.frigate.length),
      harVanlig: !!c.plain,
    }));
  }

  _erTilgjengelig(id) {
    if (id === "hendelser") return this._kilde === "frigate" && this._config.show_events !== false;
    if (id === "alle") return this._kilde === "vanlig";
    if (id === "logg") return this._alleLogg().length > 0;
    const k = this._kameraer().find((x) => x.id === id);
    if (!k) return false;
    return this._kilde === "frigate" ? k.harFrigate : k.harVanlig;
  }

  _forsteTilgjengelige() {
    if (this._kilde === "vanlig") return "alle";
    if (this._config.show_events !== false && this._alleFrigate().length) {
      return "hendelser";
    }
    const k = this._kameraer().find((x) => this._erTilgjengelig(x.id));
    return k ? k.id : "";
  }

  _alleLogg() {
    const ut = [];
    this._kameraer().forEach((k) =>
      (k.logbook || []).forEach((e) => {
        if (e && !ut.includes(e)) ut.push(e);
      })
    );
    return ut;
  }

  _alleFrigate() {
    const ut = [];
    this._kameraer().forEach((k) =>
      (k.frigate || []).forEach((e) => {
        if (!ut.includes(e)) ut.push(e);
      })
    );
    return ut;
  }

  /* ------------------------------------------------------------- tegne -- */

  _oppdater() {
    this._tegnPiller();
    this._visInnhold();
    this._tegnDetaljer();
    this._visLogg();
  }

  /**
   * Aktivitetslogg for kameraet. Bare i kameraets egen fane, og bare når
   * kameraet har logbook-entiteter satt opp.
   */
  async _visLogg() {
    const vert = this._rot && this._rot.querySelector("#logg");
    if (!vert) return;

    const k =
      this._valgt === "logg"
        ? null
        : this._kameraer().find((x) => x.id === this._valgt);
    const entiteter = k && k.logbook ? k.logbook.filter(Boolean) : [];
    const noekkel = entiteter.length ? `${k.id}|${entiteter.join(",")}` : "";

    if (this._loggNoekkel === noekkel) return;
    this._loggNoekkel = noekkel;

    if (!noekkel) {
      vert.innerHTML = "";
      this._loggKort = null;
      return;
    }

    let el = this._loggCache.get(noekkel);
    if (!el) {
      el = this._lagTidslinje(entiteter);
      if (el) this._loggCache.set(noekkel, el);
    }

    vert.innerHTML = "";
    this._loggKort = el || null;
    if (el) {
      el.hass = this._hass;
      const tittel = document.createElement("div");
      tittel.className = "loggtittel";
      tittel.textContent = "Aktivitet";
      vert.appendChild(tittel);
      vert.appendChild(el);
    }
  }

  /**
   * Personvernbryter, bevegelse og siste bevegelse.
   * Vises bare når ett bestemt kamera er valgt — ikke i Alle eller Hendelser.
   */
  _tegnDetaljer() {
    const vert = this._rot && this._rot.querySelector("#detaljer");
    if (!vert || !this._hass) return;

    const k = this._kameraer().find((x) => x.id === this._valgt);
    if (!k) {
      if (vert.innerHTML) vert.innerHTML = "";
      this._detaljSignatur = "";
      return;
    }

    const s = (id) => (id ? this._hass.states[id] : null);
    const pv = s(k.privacy);
    const bev = s(k.motion);
    const sist = s(k.last_motion);

    const sign = JSON.stringify([
      k.id,
      pv ? pv.state : null,
      bev ? bev.state : null,
      sist ? sist.state : null,
    ]);
    if (sign === this._detaljSignatur) return;
    this._detaljSignatur = sign;

    const fliser = [];

    if (pv) {
      // Med privacy_invert betyr "on" at kameraet filmer, ikke at det er avslått
      const invertert = this._config.privacy_invert !== false;
      const skjult = (pv.state === "on") !== invertert;
      fliser.push(`
        <button type="button" class="flis ${skjult ? "varsel" : ""}"
          data-handling="personvern" data-entity="${esc(k.privacy)}">
          <span class="flis-ikon">
            <ha-icon icon="${skjult ? "mdi:eye-off" : "mdi:eye"}"></ha-icon>
          </span>
          <span class="flis-tekst">
            <span class="flis-navn">Personvern</span>
            <span class="flis-under">${skjult ? "Kamera av" : "Kamera på"}</span>
          </span>
        </button>`);
    }

    if (bev) {
      const på = bev.state === "on";
      fliser.push(`
        <button type="button" class="flis ${på ? "aktiv" : ""}"
          data-handling="mer-info" data-entity="${esc(k.motion)}">
          <span class="flis-ikon"><ha-icon icon="mdi:motion-sensor"></ha-icon></span>
          <span class="flis-tekst">
            <span class="flis-navn">Bevegelse</span>
            <span class="flis-under">${på ? "Registrerer nå" : "Stille"}</span>
          </span>
        </button>`);
    }

    if (sist) {
      fliser.push(`
        <button type="button" class="flis"
          data-handling="mer-info" data-entity="${esc(k.last_motion)}">
          <span class="flis-ikon"><ha-icon icon="mdi:history"></ha-icon></span>
          <span class="flis-tekst">
            <span class="flis-navn">Siste bevegelse</span>
            <span class="flis-under">${esc(siden(sist.state))}</span>
          </span>
        </button>`);
    }

    vert.innerHTML = fliser.length
      ? `<div class="fliser">${fliser.join("")}</div>`
      : "";
  }

  _tegnPiller() {
    const tittel = this._config.title === undefined ? "Kamera" : this._config.title;
    const trad = this._rot.querySelector("#tittelrad");
    if (tittel) {
      const antall = this._kameraer().filter((k) =>
        this._kilde === "frigate" ? k.harFrigate : k.harVanlig
      ).length;
      // Ikonet blir menyknapp i Alle-visningen, ellers bare et ikon
      const kanBytte =
        this._valgt === "alle" &&
        this._config.show_layout_switcher !== false &&
        this._kameraer().filter((k) => k.harVanlig).length > 1;

      const meny = this._menyApen
        ? `<div class="meny">
            ${Object.entries(OPPSETT)
              .map(
                ([id, o]) => `
              <button type="button" class="menyvalg ${
                this._oppsett === id ? "aktiv" : ""
              }" data-handling="oppsett" data-verdi="${id}">
                <ha-icon icon="${esc(o.ikon)}"></ha-icon>
                <span>${esc(o.navn)}</span>
                ${this._oppsett === id ? '<ha-icon class="hake" icon="mdi:check"></ha-icon>' : ""}
              </button>`
              )
              .join("")}
          </div>`
        : "";

      trad.innerHTML = `
        <span class="tittel-ikon ${kanBytte ? "klikkbar" : ""} ${
        this._menyApen ? "apen" : ""
      }" ${kanBytte ? 'data-handling="oppsett-meny" role="button" tabindex="0"' : ""}>
          <ha-icon icon="${esc(this._config.title_icon || "mdi:cctv")}"></ha-icon>
          ${kanBytte ? '<ha-icon class="karet" icon="mdi:chevron-down"></ha-icon>' : ""}
        </span>
        <h2>${esc(tittel)}</h2>
        <span class="tittel-antall">${antall} kamera${antall === 1 ? "" : "er"}</span>
        ${meny}`;
      trad.style.display = "";
    } else {
      trad.innerHTML = "";
      trad.style.display = "none";
      this._menyApen = false;
    }

    const kilde = this._rot.querySelector("#kilde");
    kilde.innerHTML = `
      <div class="pille">
        <button type="button" data-handling="kilde" data-verdi="vanlig"
          class="${this._kilde === "vanlig" ? "aktiv" : ""}">Direkte</button>
        <button type="button" data-handling="kilde" data-verdi="frigate"
          class="${this._kilde === "frigate" ? "aktiv" : ""}">Frigate</button>
      </div>`;

    const faner = [];
    if (this._kilde === "frigate" && this._config.show_events !== false) {
      faner.push({ id: "hendelser", navn: "Hendelser", ikon: "mdi:motion-play" });
    }
    if (this._kilde === "vanlig") {
      faner.push({ id: "alle", navn: "Alle", ikon: "mdi:view-grid-outline" });
    }
    this._kameraer().forEach((k) => {
      if (this._erTilgjengelig(k.id)) {
        faner.push({ id: k.id, navn: k.name, ikon: k.icon || "mdi:cctv" });
      }
    });
    if (this._erTilgjengelig("logg")) {
      faner.push({ id: "logg", navn: "Logg", ikon: "mdi:format-list-bulleted" });
    }

    this._rot.querySelector("#piller").innerHTML = faner
      .map(
        (f) => `
        <button type="button" class="fane ${this._valgt === f.id ? "aktiv" : ""}"
          data-handling="kamera" data-verdi="${esc(f.id)}">
          <ha-icon icon="${esc(f.ikon)}"></ha-icon>
          <span>${esc(f.navn)}</span>
        </button>`
      )
      .join("");

  }

  async _visInnhold() {
    const vert = this._rot.querySelector("#innhold");
    const noekkel = `${this._kilde}|${this._valgt}|${this._oppsett}|${
      this._bred ? "bred" : "smal"
    }`;

    if (this._montertNoekkel === noekkel && this._montert) return;
    this._montertNoekkel = noekkel;

    let el = this._cache.get(noekkel);
    if (!el) {
      el = await this._byggInnhold();
      if (el) this._cache.set(noekkel, el);
    }

    vert.innerHTML = "";
    this._montert = el || null;
    if (el) {
      el.hass = this._hass;
      vert.appendChild(el);
    } else {
      vert.innerHTML = `<div class="tomt">Ingen kamerakilde er satt opp for dette valget.</div>`;
    }
  }

  async _byggInnhold() {
    const cfg = this._config;

    if (this._valgt === "logg") {
      const e = this._alleLogg();
      if (!e.length) return null;
      return this._lagTidslinje(e);
    }

    if (this._kilde === "frigate") {
      if (this._valgt === "hendelser") {
        const alle = this._alleFrigate();
        if (!alle.length) return null;
        return this._lagKort(galleriKort(alle, cfg));
      }
      const k = this._kameraer().find((x) => x.id === this._valgt);
      if (!k || !k.harFrigate) return null;
      return this._lagKort({
        type: "vertical-stack",
        cards: [frigateKort(k.frigate), galleriKort(k.frigate, cfg)],
      });
    }

    // Direkte strøm
    if (this._valgt === "alle") {
      const med = this._kameraer().filter((k) => k.harVanlig);
      if (!med.length) return null;
      return this._byggRutenett(med);
    }
    const k = this._kameraer().find((x) => x.id === this._valgt);
    if (!k || !k.harVanlig) return null;
    return this._lagKort(stromKort(k.plain, true));
  }

  /**
   * Rutenett av stillbilder. Egne <img> i stedet for nestede kort, slik at
   * cellene kan spenne over flere rader og bildene fylle dem helt.
   */
  _byggRutenett(kameraer) {
    const preset = OPPSETT[this._oppsett] || OPPSETT.rutenett;
    const fyll = !!this._bred && this._config.fill_screen !== false;
    const avstand = this._config.fill_offset || 210;

    const vert = document.createElement("div");
    vert.className = "rutenett" + (fyll ? " fyll" : "");
    vert.style.gridTemplateColumns = preset.kolonner;

    if (fyll && preset.auto) {
      const rader = Math.ceil(kameraer.length / preset.kolonner.split(" ").length);
      vert.style.gridTemplateRows = `repeat(${rader}, minmax(0, 1fr))`;
      vert.style.height = `calc(100vh - ${avstand}px)`;
      vert.style.height = `calc(100dvh - ${avstand}px)`;
      vert.style.minHeight = "320px";
    }

    if (!preset.auto && preset.omrader) {
      // Kameraer utover feltene i preset-et får hver sin fullbreddes rad
      const antallFelt = preset.omrader.join(" ").match(/[a-p]/g);
      const unike = [...new Set(antallFelt || [])];
      const ekstra = kameraer.slice(unike.length);
      const kolonnetall = preset.kolonner.split(" ").length;
      const ekstraRader = ekstra.map((_, i) =>
        `"${Array(kolonnetall).fill(FELTNAVN[unike.length + i]).join(" ")}"`
      );
      const antRader = preset.omrader.length + ekstraRader.length;
      vert.style.gridTemplateAreas = [...preset.omrader, ...ekstraRader].join(" ");

      if (fyll) {
        // Fyll tilgjengelig skjermhøyde; radene deler den likt
        vert.style.gridTemplateRows = `repeat(${antRader}, minmax(0, 1fr))`;
        vert.style.height = `calc(100vh - ${avstand}px)`;
        vert.style.height = `calc(100dvh - ${avstand}px)`;
        vert.style.minHeight = "320px";
      } else if (preset.celleRatio) {
        // Radene styres av cellenes eget sideforhold
        vert.style.gridTemplateRows = "";
      } else {
        vert.style.gridTemplateRows =
          preset.rader +
          (ekstraRader.length ? " " + ekstraRader.map(() => "1fr").join(" ") : "");
        if (preset.ratio && !ekstraRader.length) vert.style.aspectRatio = preset.ratio;
      }
    }

    const bilder = [];
    kameraer.forEach((k, i) => {
      const celle = document.createElement("button");
      celle.type = "button";
      celle.className = "celle";
      if (!preset.auto) celle.style.gridArea = FELTNAVN[i];
      if (preset.celleRatio && !fyll) celle.style.aspectRatio = preset.celleRatio;
      celle.dataset.handling = "kamera";
      celle.dataset.verdi = k.id;

      const img = document.createElement("img");
      img.alt = k.name || "";
      img.loading = "lazy";
      img.dataset.entity = k.plain;
      celle.appendChild(img);
      bilder.push(img);

      const merke = document.createElement("span");
      merke.className = "celle-navn";
      merke.textContent = k.name || "";
      celle.appendChild(merke);

      const prikk = document.createElement("span");
      prikk.className = "celle-prikk";
      prikk.dataset.motion = k.motion || "";
      celle.appendChild(prikk);

      vert.appendChild(celle);
    });

    const oppdater = (hass) => {
      if (!hass) return;
      bilder.forEach((img) => {
        const s = hass.states[img.dataset.entity];
        const bilde = s && s.attributes ? s.attributes.entity_picture : null;
        if (bilde && img.getAttribute("src") !== bilde) img.setAttribute("src", bilde);
        const celle = img.parentElement;
        const pv = celle.querySelector(".celle-prikk");
        const m = pv && pv.dataset.motion ? hass.states[pv.dataset.motion] : null;
        celle.classList.toggle("bevegelse", !!m && m.state === "on");
        celle.classList.toggle("borte", !s || s.state === "unavailable");
      });
    };

    Object.defineProperty(vert, "hass", {
      set(v) {
        oppdater(v);
      },
      configurable: true,
    });
    oppdater(this._hass);
    return vert;
  }

  /**
   * Tidslinje bygget på HAs logbook-data, tegnet selv slik at den følger
   * designspråket. Henter på nytt når en av entitetene endrer tilstand.
   */
  _lagTidslinje(entiteter) {
    const kort = this;
    const vert = document.createElement("div");
    vert.className = "tidslinje";
    vert.innerHTML = `<div class="tl-laster">Henter aktivitet …</div>`;

    let sisteSignatur = "";
    let henter = false;

    const tegn = (linjer, hass) => {
      if (!linjer.length) {
        vert.innerHTML = `<div class="tl-tom">Ingen aktivitet i perioden.</div>`;
        return;
      }
      let html = "";
      let forrigeDag = "";
      linjer.forEach((l) => {
        const dag = dagTekst(l.when);
        if (dag !== forrigeDag) {
          html += `<div class="tl-dag">${esc(dag)}</div>`;
          forrigeDag = dag;
        }
        const aktiv = l.state === "on";
        const navn = l.name || l.entity_id;
        const sti = opphav(hass, l.entity_id);
        html += `
          <button type="button" class="tl-rad ${aktiv ? "aktiv" : ""}"
            data-handling="mer-info" data-entity="${esc(l.entity_id)}">
            <span class="tl-tid">${esc(klokke(l.when))}</span>
            <span class="tl-ikon">
              <ha-icon icon="${esc(
                linjeIkon(hass, l.entity_id, l.state, l.icon)
              )}"></ha-icon>
            </span>
            <span class="tl-tekst">
              <span class="tl-tittel">${esc(navn)} <i>→</i> ${esc(
          tilstandTekst(hass, l.entity_id, l.state)
        )}</span>
              ${
                sti.length
                  ? `<span class="tl-sti">${sti.map(esc).join(" ▸ ")}</span>`
                  : ""
              }
            </span>
          </button>`;
      });
      vert.innerHTML = html;
    };

    const hent = async (hass) => {
      if (!hass || henter || !entiteter.length) return;
      henter = true;
      const timer = kort._config.logbook_hours || 24;
      const grense = kort._config.logbook_limit || 60;
      const slutt = new Date();
      const start = new Date(slutt.getTime() - timer * 3600 * 1000);
      try {
        let data;
        try {
          data = await hass.callWS({
            type: "logbook/get_events",
            start_time: start.toISOString(),
            end_time: slutt.toISOString(),
            entity_ids: entiteter,
          });
        } catch (e) {
          // Eldre frontend: fall tilbake på REST
          data = await hass.callApi(
            "GET",
            `logbook/${start.toISOString()}?end_time=${slutt.toISOString()}&entity=${entiteter.join(
              ","
            )}`
          );
        }
        const linjer = (data || [])
          .filter((r) => r.entity_id && r.state !== undefined)
          .sort((a, b) => (b.when || 0) - (a.when || 0))
          .slice(0, grense);
        tegn(linjer, hass);
      } catch (err) {
        console.error("ki-kamera-card: klarte ikke å hente logg", err);
        vert.innerHTML = `<div class="tl-tom">Fikk ikke hentet aktiviteten.</div>`;
      } finally {
        henter = false;
      }
    };

    Object.defineProperty(vert, "hass", {
      set(hass) {
        // Hent bare når en av de fulgte entitetene faktisk har endret seg
        const sign = entiteter
          .map((e) => {
            const s = hass.states[e];
            return s ? s.last_changed : "-";
          })
          .join("|");
        if (sign === sisteSignatur) return;
        sisteSignatur = sign;
        hent(hass);
      },
      configurable: true,
    });

    vert.hass = this._hass;
    return vert;
  }

  async _lagKort(config) {
    try {
      const helpers = await window.loadCardHelpers();
      const el = await helpers.createCardElement(config);
      el.hass = this._hass;
      const skall = document.createElement("div");
      skall.className = "skall";
      skall.appendChild(el);
      // hass må videreformidles til det ekte kortet
      Object.defineProperty(skall, "hass", {
        set(v) {
          el.hass = v;
        },
        configurable: true,
      });
      return skall;
    } catch (err) {
      console.error("ki-kamera-card: klarte ikke å lage kort", config, err);
      return null;
    }
  }
}

KiKameraCard.styles = `
  :host { display: block; }
  .rot {
    background: transparent; border: none; box-shadow: none;
    padding: 0; display: block;
  }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad {
    display: flex; align-items: center; gap: 12px;
    padding: 0 4px 14px;
  }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px;
    flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1;
    font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }
  .tittel-antall {
    font-size: 12px; font-weight: 600; opacity: .5;
    color: var(--gray1000, var(--primary-text-color));
    white-space: nowrap;
  }

  /* ---------- kildebryter ---------- */
  .kilde { margin-bottom: 12px; }
  .pille {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
    background: var(--gray200, var(--card-background-color));
    border-radius: 16px; padding: 4px; height: 44px; box-sizing: border-box;
  }
  .pille button {
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    opacity: .5; border-radius: 12px;
    font-size: 13px; font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff); opacity: 1;
  }
  .pille button:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }

  /* ---------- kamerapiller ---------- */
  .piller {
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 4px;
    margin-bottom: 14px;
    scrollbar-width: none;
  }
  .piller::-webkit-scrollbar { display: none; }
  .fane {
    display: flex; align-items: center; gap: 7px;
    flex: 0 0 auto;
    padding: 9px 15px 9px 12px;
    border-radius: 16px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    opacity: .55;
    --mdc-icon-size: 18px;
    transition: background .18s ease, opacity .18s ease, color .18s ease;
  }
  .fane.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    opacity: 1;
  }
  .fane:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 2px; }

  /* ---------- oppsettsmeny ---------- */
  .tittelrad { position: relative; }
  .tittel-ikon.klikkbar {
    cursor: pointer;
    width: auto; min-width: 38px;
    padding: 0 6px 0 8px;
    gap: 1px;
    border-radius: 19px;
    transition: background .18s ease;
  }
  .tittel-ikon.klikkbar:hover { background: var(--gray400, rgba(128,128,128,.25)); }
  .tittel-ikon.apen {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
  }
  .tittel-ikon .karet { --mdc-icon-size: 15px; opacity: .6; }
  .tittel-ikon.apen .karet { opacity: 1; transform: rotate(180deg); }

  .meny {
    position: absolute;
    top: 44px; left: 0;
    z-index: 20;
    min-width: 190px;
    padding: 6px;
    border-radius: 18px;
    background: var(--gray200, var(--card-background-color));
    box-shadow: 0 14px 38px rgba(0, 0, 0, .45);
    display: flex; flex-direction: column; gap: 2px;
  }
  .menyvalg {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 13px;
    background: transparent;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    text-align: left;
    --mdc-icon-size: 18px;
  }
  .menyvalg span { flex: 1; }
  .menyvalg:hover { background: rgba(128, 128, 128, .18); }
  .menyvalg.aktiv { color: var(--active-big, var(--primary-color)); }
  .menyvalg .hake { --mdc-icon-size: 16px; }

  /* ---------- mosaikk ---------- */
  .rutenett { display: grid; gap: 8px; width: 100%; }
  .rutenett.fyll { gap: 10px; }
  .rutenett.fyll .celle { min-height: 0; height: 100%; }
  .celle {
    position: relative;
    padding: 0;
    border-radius: 18px;
    overflow: hidden;
    background: var(--gray200, #222);
    min-height: 90px;
    aspect-ratio: auto;
  }
  .celle img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .celle::after {
    content: "";
    position: absolute; inset: 0;
    border-radius: 18px;
    box-shadow: inset 0 0 0 2px transparent;
    transition: box-shadow .25s ease;
    pointer-events: none;
  }
  .celle.bevegelse::after { box-shadow: inset 0 0 0 2px var(--blue, #3b82f6); }
  .celle.borte img { opacity: .25; }
  .celle-navn {
    position: absolute; left: 10px; bottom: 9px;
    font-size: 12px; font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0, 0, 0, .8);
    pointer-events: none;
  }
  .celle-prikk {
    position: absolute; right: 10px; top: 10px;
    width: 8px; height: 8px; border-radius: 50%;
    background: transparent;
    transition: background .25s ease;
  }
  .celle.bevegelse .celle-prikk { background: var(--blue, #3b82f6); }

  /* ---------- tidslinje ---------- */
  .tidslinje {
    position: relative;
    background: var(--gray200, var(--card-background-color));
    border-radius: 22px;
    padding: 6px 14px 10px;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
  }
  .tidslinje * { box-sizing: border-box; min-width: 0; }
  .tl-laster, .tl-tom {
    padding: 26px 8px;
    text-align: center;
    font-size: 14px;
    color: var(--gray800, var(--secondary-text-color));
  }
  .tl-dag {
    font-size: 12px; font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    opacity: .45;
    color: var(--gray1000, var(--primary-text-color));
    padding: 14px 0 8px 78px;
  }
  .tl-rad {
    position: relative;
    display: grid;
    grid-template-columns: 62px 44px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 10px 0;
    background: none;
    text-align: left;
    color: var(--gray1000, var(--primary-text-color));
    border-radius: 12px;
  }
  /* koblingslinjen mellom ikonene */
  .tl-rad::before {
    content: "";
    position: absolute;
    left: 95px;
    top: 0; bottom: 0;
    width: 1px;
    background: rgba(128, 128, 128, .28);
  }
  .tl-rad:first-of-type::before { top: 50%; }
  .tl-rad:last-of-type::before { bottom: 50%; }
  .tl-tid {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--gray800, var(--secondary-text-color));
    opacity: .8;
    white-space: nowrap;
  }
  .tl-ikon {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(128, 128, 128, .22);
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px;
  }
  .tl-rad.aktiv .tl-ikon {
    background: var(--yellow, #d6a41a);
    color: var(--black, #1c1c1e);
  }
  .tl-tekst {
    display: flex; flex-direction: column; gap: 3px;
    min-width: 0; max-width: 100%; overflow: hidden;
  }
  .tl-tittel {
    font-size: 15px; font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: normal;
  }
  .tl-tittel i { font-style: normal; opacity: .45; padding: 0 3px; }
  .tl-sti {
    font-size: 13px;
    max-width: 100%;
    color: var(--gray800, var(--secondary-text-color));
    opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .tl-rad + .tl-rad .tl-tekst {
    border-top: 1px solid rgba(128, 128, 128, .14);
    padding-top: 10px;
    margin-top: -10px;
  }

  /* ---------- aktivitetslogg ---------- */
  .logg { display: block; margin-top: 18px; }
  .loggtittel {
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    padding: 0 6px 8px;
  }
  .logg .skall {
    border-radius: 22px;
    overflow: hidden;
    background: var(--gray200, var(--card-background-color));
  }

  /* ---------- innhold ---------- */
  .innhold { display: block; }
  .skall { display: block; }
  .skall ha-card,
  .skall > * {
    --ha-card-border-width: 0;
    --ha-card-box-shadow: none;
  }
  .innhold hui-picture-entity-card, .innhold .skall {
    border-radius: 22px;
    overflow: hidden;
  }
  /* ---------- detaljfliser ---------- */
  .detaljer { display: block; }
  .fliser {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
    margin-top: 12px;
  }
  .flis {
    display: grid; grid-template-columns: 44px 1fr;
    align-items: center; gap: 10px;
    padding: 10px 12px 10px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    transition: background .2s ease, color .2s ease;
  }
  .flis.varsel { background: var(--red, #e5484d); color: var(--gray100, #fff); }
  .flis.aktiv { background: var(--blue, #3b82f6); color: var(--gray100, #fff); }
  .flis:focus-visible { outline: 2px solid var(--active-big, var(--primary-color)); outline-offset: 1px; }
  .flis-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    --mdc-icon-size: 21px;
    justify-self: end;
  }
  .flis.varsel .flis-ikon, .flis.aktiv .flis-ikon { background: rgba(250, 251, 252, .16); }
  .flis-tekst { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .flis-navn { font-size: 14px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flis-under { font-size: 12px; font-weight: 500; opacity: .7;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .tomt {
    padding: 28px 18px;
    border-radius: 22px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray800, var(--secondary-text-color));
    font-size: 14px; text-align: center;
  }

  @media (max-width: 430px) {
    .tidslinje { padding: 4px 10px 8px; }
    .tl-rad { grid-template-columns: 48px 36px minmax(0, 1fr); gap: 9px; }
    .tl-rad::before { left: 75px; }
    .tl-ikon { width: 36px; height: 36px; --mdc-icon-size: 18px; }
    .tl-tid { font-size: 11px; }
    .tl-tittel { font-size: 14px; }
    .tl-sti { font-size: 12px; }
    .tl-dag { padding-left: 57px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pille button, .fane { transition: none; }
  }
`;

/* ───────────────────────────────────────────────────────────────── editor ── */

class KiKameraCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.cameras) this._config.cameras = STANDARD_KONFIG().cameras;
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange, type = "text") {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = type;
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _avkryssing(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "avkryss";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = verdi !== false;
    inp.addEventListener("change", () => onChange(inp.checked));
    wrap.appendChild(inp);
    const s = document.createElement("span");
    s.textContent = label;
    wrap.appendChild(s);
    return wrap;
  }

  _velger(label, valg, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement("select");
    valg.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.value = verdi;
    sel.addEventListener("change", () => onChange(sel.value));
    wrap.appendChild(sel);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = domener || ["camera"];
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiKameraCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tittelrad = document.createElement("div");
    tittelrad.className = "tokol";
    tittelrad.appendChild(
      this._tekstfelt(
        "Overskrift (tom = skjul)",
        this._config.title === undefined ? "Kamera" : this._config.title,
        (v) => {
          this._config.title = v;
          this._endret();
        }
      )
    );
    tittelrad.appendChild(
      this._ikonfelt(this._config.title_icon || "mdi:cctv", (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tittelrad);
    gen.appendChild(
      this._velger(
        "Oppsett i Alle-visningen",
        Object.entries(OPPSETT).map(([id, o]) => [id, o.navn]),
        this._config.grid_layout || "mosaikk",
        (v) => {
          this._config.grid_layout = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Fyll skjermhøyden på brede skjermer",
        this._config.fill_screen,
        (v) => {
          this._config.fill_screen = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._tekstfelt(
        "Plass til annet innhold (px)",
        this._config.fill_offset || 210,
        (v) => {
          this._config.fill_offset = parseInt(v) || 210;
          this._endret();
        },
        "number"
      )
    );
    gen.appendChild(
      this._avkryssing(
        "Vis oppsettsvelger i kortet",
        this._config.show_layout_switcher,
        (v) => {
          this._config.show_layout_switcher = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._velger(
        "Kilde ved åpning",
        [
          ["frigate", "Frigate"],
          ["vanlig", "Direkte strøm"],
        ],
        this._config.default_source || "frigate",
        (v) => {
          this._config.default_source = v;
          this._endret();
        }
      )
    );
    gen.appendChild(
      this._avkryssing("Vis samlet hendelsesfane", this._config.show_events, (v) => {
        this._config.show_events = v;
        this._endret();
      })
    );
    gen.appendChild(
      this._avkryssing(
        "Inverter personvernbryter (på = kamera filmer)",
        this._config.privacy_invert,
        (v) => {
          this._config.privacy_invert = v;
          this._endret();
        }
      )
    );
    const rad = document.createElement("div");
    rad.className = "trekol";
    rad.appendChild(
      this._tekstfelt(
        "Hendelser",
        this._config.events_limit || 12,
        (v) => {
          this._config.events_limit = parseInt(v) || 12;
          this._endret();
        },
        "number"
      )
    );
    rad.appendChild(
      this._tekstfelt(
        "Kolonner",
        this._config.events_columns || 2,
        (v) => {
          this._config.events_columns = parseInt(v) || 2;
          this._endret();
        },
        "number"
      )
    );
    rad.appendChild(
      this._tekstfelt("Høyde", this._config.events_height || "500px", (v) => {
        this._config.events_height = v;
        this._endret();
      })
    );
    gen.appendChild(rad);
    gen.appendChild(
      this._tekstfelt(
        "Timer i aktivitetsloggen",
        this._config.logbook_hours || 24,
        (v) => {
          this._config.logbook_hours = parseInt(v) || 24;
          this._endret();
        },
        "number"
      )
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Frigate-visningen bruker advanced-camera-card og mysmart-frigate-gallery. Direkte-visningen bruker kameraentiteten rå, uten deteksjon.";
    gen.appendChild(h);
    rot.appendChild(gen);

    this._config.cameras.forEach((c, ci) => this._tegnKamera(rot, c, ci));

    rot.appendChild(
      this._knapp("+ Nytt kamera", "hovedknapp", () => {
        this._config.cameras.push({ name: "Nytt kamera", icon: "mdi:cctv", frigate: [] });
        this._endret();
        this._tegn();
      })
    );
  }

  _tegnKamera(rot, c, ci) {
    const noekkel = String(ci);
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = c.name || "Uten navn";
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "kropp";

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Navn", c.name, (v) => {
        c.name = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._ikonfelt(c.icon, (v) => {
        c.icon = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    kropp.appendChild(
      this._entitetsfelt("Direkte strøm (UniFi e.l.)", c.plain, (v) => {
        if (v) c.plain = v;
        else delete c.plain;
        this._endret();
      }, ["camera"])
    );

    const sensorboks = document.createElement("div");
    sensorboks.className = "underboks";
    sensorboks.innerHTML =
      "<div class='undertittel'>Vises bare i kameraets egen fane</div>";
    sensorboks.appendChild(
      this._entitetsfelt(
        "Personvernmodus",
        c.privacy,
        (v) => {
          if (v) c.privacy = v;
          else delete c.privacy;
          this._endret();
        },
        ["switch"]
      )
    );
    sensorboks.appendChild(
      this._entitetsfelt(
        "Bevegelsessensor",
        c.motion,
        (v) => {
          if (v) c.motion = v;
          else delete c.motion;
          this._endret();
        },
        ["binary_sensor"]
      )
    );
    sensorboks.appendChild(
      this._entitetsfelt(
        "Siste bevegelse",
        c.last_motion,
        (v) => {
          if (v) c.last_motion = v;
          else delete c.last_motion;
          this._endret();
        },
        ["sensor"]
      )
    );
    kropp.appendChild(sensorboks);

    const loggboks = document.createElement("div");
    loggboks.className = "underboks";
    loggboks.innerHTML = "<div class='undertittel'>Aktivitetslogg</div>";
    (c.logbook || []).forEach((e, ei) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt(
          "Entitet",
          e,
          (v) => {
            if (v) c.logbook[ei] = v;
            else c.logbook.splice(ei, 1);
            this._endret();
            this._tegn();
          },
          ["binary_sensor", "sensor", "switch", "event", "camera"]
        )
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          c.logbook.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      loggboks.appendChild(rad);
    });
    loggboks.appendChild(
      this._knapp("+ Legg til i loggen", "hovedknapp liten", () => {
        if (!c.logbook) c.logbook = [];
        c.logbook.push("");
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(loggboks);

    const fri = document.createElement("div");
    fri.className = "underboks";
    fri.innerHTML = "<div class='undertittel'>Frigate-kameraer</div>";
    (c.frigate || []).forEach((e, ei) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Frigate-kamera", e, (v) => {
          if (v) c.frigate[ei] = v;
          else c.frigate.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          c.frigate.splice(ei, 1);
          this._endret();
          this._tegn();
        })
      );
      fri.appendChild(rad);
    });
    fri.appendChild(
      this._knapp("+ Legg til Frigate-kamera", "hovedknapp liten", () => {
        if (!c.frigate) c.frigate = [];
        c.frigate.push("");
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(fri);

    const verktoy = document.createElement("div");
    verktoy.className = "verktoy";
    if (ci > 0)
      verktoy.appendChild(
        this._knapp("↑", "mini", () => {
          const [x] = this._config.cameras.splice(ci, 1);
          this._config.cameras.splice(ci - 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    if (ci < this._config.cameras.length - 1)
      verktoy.appendChild(
        this._knapp("↓", "mini", () => {
          const [x] = this._config.cameras.splice(ci, 1);
          this._config.cameras.splice(ci + 1, 0, x);
          this._endret();
          this._tegn();
        })
      );
    verktoy.appendChild(
      this._knapp("Slett kamera", "mini fare", () => {
        this._config.cameras.splice(ci, 1);
        this._apne.delete(noekkel);
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(verktoy);

    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiKameraCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .kropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input, .felt select {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px;
    width: 100%; box-sizing: border-box;
  }
  .avkryss { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text-color); cursor: pointer; }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .trekol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color);
    border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  .verktoy { display: flex; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol, .trekol { grid-template-columns: 1fr; } }
`;

window.KI.define("ki-kamera-card", KiKameraCard);
window.KI.define("ki-kamera-card-editor", KiKameraCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-kamera-card",
  name: "KI Kamera",
  description: "Kameraoversikt med bryter mellom Frigate og direkte strøm.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-kamera-card feilet", e); }

/* ===== ki-klima-card ===== */
try {
/**
 * ki-klima-card.js
 * Klimastyring for KI-pakken (ki_klimastyring.yaml) — ett kort, to visninger.
 *
 *  Enkel     : hovedbryter, effektvakt, modus, soner med settpunkt
 *  Avansert  : alt over + unntak, effektgrenser, måltidsvinduer, tider,
 *              finjustering og diagnostikk
 *
 * Kopier til /config/www/ki-klima-card.js og legg til som ressurs:
 *   URL:  /local/ki-klima-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-klima-card
 */

const KI_KLIMA_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-KLIMA-CARD %c ${KI_KLIMA_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#4a9eff;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

/* ------------------------------------------------------------------ *
 * Datamodell — soner, tallfelt og tider. Alt bygges fra prefix (ki).
 * ------------------------------------------------------------------ */

const ZONER = [
  { key: "stue_panelovn",     navn: "Stue panelovn",     gruppe: "Stue",       icon: "mdi:radiator",     styr: "styr_stue_panelovn",       dag: "temp_stue_dag",              natt: "temp_stue_natt" },
  { key: "stue_oljefyr",      navn: "Stue oljefyr",      gruppe: "Stue",       icon: "mdi:fire",         styr: "styr_stue_oljefyr",        dag: "temp_stue_dag",              natt: "temp_stue_natt", notat: "Deler settpunkt med panelovnen" },
  { key: "trappegang",        navn: "Trappegang",        gruppe: "Trappegang", icon: "mdi:stairs",       styr: "styr_trappegang_panelovn", dag: "temp_trappegang_dag",        natt: "temp_trappegang_natt" },
  { key: "kjokken_panelovn",  navn: "Kjøkken panelovn",  gruppe: "Kjøkken",    icon: "mdi:countertop",   styr: "styr_kjokken_panelovn",    dag: "temp_kjokken_panelovn_dag",  natt: "temp_kjokken_panelovn_natt" },
  { key: "kjokken_gulvvarme", navn: "Kjøkken gulvvarme", gruppe: "Kjøkken",    icon: "mdi:heating-coil", styr: "styr_kjokken_gulvvarme",   fast: "temp_kjokken" },
  { key: "cybele",            navn: "Cybele panelovn",   gruppe: "Soverom",    icon: "mdi:bed",          styr: "styr_cybele_panelovn",     dag: "temp_cybele_dag",            natt: "temp_cybele_natt" },
  { key: "sebastian",         navn: "Sebastian panelovn",gruppe: "Soverom",    icon: "mdi:bed-king",     styr: "styr_sebastian_panelovn",  dag: "temp_sebastian_dag",         natt: "temp_sebastian_natt" },
  { key: "bad",               navn: "Bad gulvvarme",     gruppe: "Bad og do",  icon: "mdi:shower",       styr: "styr_bad_gulvvarme",       fast: "temp_bad" },
  { key: "do",                navn: "Do gulvvarme",      gruppe: "Bad og do",  icon: "mdi:toilet",       styr: "styr_do_gulvvarme",        fast: "temp_do" },
  { key: "gardiner",          navn: "Gardiner",          gruppe: "Annet",      icon: "mdi:curtains",     styr: "styr_gardiner" },
];

const UNNTAK = [
  { id: "temp_helg",           navn: "Helg",           icon: "mdi:calendar-weekend", enhet: " °C", dec: 1 },
  { id: "temp_helg_gulvvarme", navn: "Helg gulvvarme", icon: "mdi:heating-coil",     enhet: " °C", dec: 1 },
  { id: "temp_sommer",         navn: "Sommer",         icon: "mdi:weather-sunny",    enhet: " °C", dec: 1 },
];

const EFFEKT_TALL = [
  { id: "effektgrense_kwh",     navn: "Effektgrense",    icon: "mdi:flash",          enhet: " kWh", dec: 1 },
  { id: "effekt_hysterese_kwh", navn: "Hysterese",       icon: "mdi:swap-vertical",  enhet: " kWh", dec: 1 },
  { id: "reserve_frokost_kwh",  navn: "Reserve frokost", icon: "mdi:coffee",         enhet: " kWh", dec: 1 },
  { id: "reserve_middag_kwh",   navn: "Reserve middag",  icon: "mdi:silverware-fork-knife", enhet: " kWh", dec: 1 },
];

const JUSTERING = [
  { id: "stagger_minutter",      navn: "Stagger mellom soner", icon: "mdi:timer-outline",   enhet: " min",    dec: 0 },
  { id: "natt_senk_ute_grense",  navn: "Natt-senk utegrense",  icon: "mdi:thermometer-low", enhet: " °C",     dec: 1 },
  { id: "preheat_min_per_grad",  navn: "Preheat per grad",     icon: "mdi:fire-circle",     enhet: " min/°C", dec: 0 },
  { id: "preheat_kuldetillegg",  navn: "Preheat kuldetillegg", icon: "mdi:snowflake",       enhet: " min",    dec: 0 },
  { id: "gardin_start_maned",    navn: "Gardiner fra",         icon: "mdi:curtains",        enhet: ". måned", dec: 0 },
  { id: "gardin_slutt_maned",    navn: "Gardiner til",         icon: "mdi:curtains-closed", enhet: ". måned", dec: 0 },
];

const TIDER_DOGN = [
  { id: "tid_dag_start", navn: "Dag starter",  icon: "mdi:weather-sunny" },
  { id: "tid_natt_start", navn: "Natt starter", icon: "mdi:weather-night" },
];

const TIDER_PERSON = [
  { id: "cybele_dag",              navn: "Cybele dag",        icon: "mdi:account-clock" },
  { id: "cybele_natt",             navn: "Cybele natt",       icon: "mdi:account-clock" },
  { id: "sebastian_vekking",       navn: "Sebastian vekking", icon: "mdi:alarm" },
  { id: "sebastian_vekking_helg",  navn: "Vekking helg",      icon: "mdi:alarm-snooze" },
  { id: "sebastian_natt",          navn: "Sebastian natt",    icon: "mdi:sleep" },
];

const TIDER_MALTID = [
  { id: "frokost_start", navn: "Frokost fra", icon: "mdi:clock-start" },
  { id: "frokost_slutt", navn: "Frokost til", icon: "mdi:clock-end" },
  { id: "middag_start",  navn: "Middag fra",  icon: "mdi:clock-start" },
  { id: "middag_slutt",  navn: "Middag til",  icon: "mdi:clock-end" },
];

const TIDER_HELG = [
  { id: "helg_varsel_tid",   navn: "Helgevarsel",   icon: "mdi:bell-outline" },
  { id: "helg_sporsmal_tid", navn: "Helgespørsmål", icon: "mdi:help-circle-outline" },
  { id: "helg_frist_tid",    navn: "Helgefrist",    icon: "mdi:timer-sand" },
];

/* ------------------------------------------------------------------ *
 * Hjelpere
 * ------------------------------------------------------------------ */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const nf = (v, dec) => {
  const n = Number(v);
  if (!isFinite(n)) return "–";
  return n.toFixed(dec).replace(".", ",");
};

/* ------------------------------------------------------------------ *
 * Kortet
 * ------------------------------------------------------------------ */

class KiKlimaCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("ki-klima-card-editor");
  }

  static getStubConfig() {
    return { type: "custom:ki-klima-card", default_view: "enkel" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._pending = {};
    this._timers = {};
    this._apen = new Set();
    this._seksjoner = new Set(["soner"]);
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "ki",
        title: "",
        default_view: "enkel",
        remember_view: true,
        show_gauge: true,
        show_hurtigvalg: true,
        show_diagnostikk: true,
        show_historikk: true,
        ute_sensor: "",
        sone_sensorer: {},
      },
      config || {}
    );
    this._p = this._config.prefix || "ki";
    this._view = this._lesLagretView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() {
    return this._view === "avansert" ? 22 : 12;
  }

  /* ---- entitets-ID-byggere ---- */
  b(n) { return `input_boolean.${this._p}_${n}`; }
  n(n) { return `input_number.${this._p}_${n}`; }
  t(n) { return `input_datetime.${this._p}_${n}`; }
  s(n) { return `sensor.${this._p}_${n}`; }
  bs(n) { return `binary_sensor.${this._p}_${n}`; }

  _lesLagretView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-klima-card:view"); } catch (e) { return null; }
  }

  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-klima-card:view", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    const sig = this._signatur(hass);
    if (sig !== this._sig) {
      this._sig = sig;
      this._update();
    }
    if (this._historyEl) this._historyEl.hass = hass;
  }

  _signatur(hass) {
    let out = this._view + "|";
    for (const id of this._watched) {
      const st = hass.states[id];
      out += (st ? st.state : "-") + ",";
    }
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Bygg DOM én gang
   * ---------------------------------------------------------------- */

  _build() {
    this._watched = new Set();
    const c = this._config;

    const html = `
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${esc(c.title)}</div>` : ""}
          ${this._masterHtml()}
          ${c.show_gauge ? this._gaugeHtml() : ""}
          ${this._viewSwitchHtml()}
          ${c.show_hurtigvalg ? this._modusHtml() : ""}
          ${this._sonerHtml()}
          <div class="avansert-kun">
            ${this._seksjon("unntak", "mdi:calendar-star", "Unntak", "Helg og sommer", this._tallListe(UNNTAK))}
            ${this._seksjon("effekt", "mdi:flash", "Effektvakt", "Grenser og reserver", this._tallListe(EFFEKT_TALL) + this._underTittel("Måltidsvinduer") + this._tidListe(TIDER_MALTID))}
            ${this._seksjon("tider", "mdi:clock-outline", "Tider", "Døgnrytme og varsler",
              this._underTittel("Hele huset") + this._tidListe(TIDER_DOGN) +
              this._underTittel("Personlig") + this._tidListe(TIDER_PERSON) +
              this._underTittel("Helgemodus") + this._tidListe(TIDER_HELG))}
            ${this._seksjon("justering", "mdi:tune-vertical", "Finjustering", "Lastfordeling og preheat", this._tallListe(JUSTERING))}
            ${c.show_diagnostikk ? this._seksjon("diagnostikk", "mdi:stethoscope", "Diagnostikk", "Hva KI ser akkurat nå", this._diagnostikkHtml()) : ""}
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.innerHTML = `<style>${KiKlimaCard.styles}</style>${html}`;
    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._built = true;
    this._settView(this._view, false);
  }

  /* ---- delkomponenter ---- */

  _masterHtml() {
    const ent = this.b("klima_hovedbryter");
    this._watched.add(ent);
    this._watched.add(this.s("klima_status"));
    if (this._config.ute_sensor) this._watched.add(this._config.ute_sensor);
    return `
      <div class="master" data-toggle="${ent}" data-action="toggle" data-entity="${ent}" tabindex="0" role="button">
        <div class="master-ikon"><ha-icon id="master-icon" icon="mdi:robot"></ha-icon></div>
        <div class="master-tekst">
          <div class="master-navn">KI Klima</div>
          <div class="master-status" id="master-status">–</div>
        </div>
        <div class="master-ute" id="master-ute"></div>
      </div>`;
  }

  _gaugeHtml() {
    ["estimert_timesforbruk", "effektiv_effektgrense"].forEach((x) => this._watched.add(this.s(x)));
    this._watched.add(this.bs("effekt_over_grense"));
    this._watched.add(this.n("shed_niva"));
    return `
      <div class="gauge" id="gauge" data-action="more" data-entity="${this.s("estimert_timesforbruk")}">
        <div class="gauge-topp">
          <span class="gauge-tittel">Forbruk denne timen</span>
          <span class="gauge-verdi" id="gauge-verdi">–</span>
        </div>
        <div class="gauge-spor"><div class="gauge-fyll" id="gauge-fyll"></div></div>
        <div class="gauge-bunn">
          <span id="gauge-tekst">–</span>
          <span class="gauge-merke" id="gauge-shed"></span>
        </div>
      </div>`;
  }

  _viewSwitchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _modusHtml() {
    const chips = [
      { ent: this.b("helgemodus"),          icon: "mdi:calendar-weekend",   navn: "Helgemodus", type: "toggle" },
      { ent: this.b("sommermodus"),         icon: "mdi:weather-sunny",      navn: "Sommermodus", type: "toggle" },
      { ent: this.b("sebastian_ferie"),     icon: "mdi:beach",              navn: "Ferie", type: "toggle" },
      { ent: this.b("helg_senk_gulvvarme"), icon: "mdi:heating-coil",       navn: "Helg senk gulv", type: "toggle", avansert: true },
      { ent: this.bs("alle_borte"),         icon: "mdi:home-export-outline",navn: "Tilstedeværelse", type: "les", på: "Alle borte", av: "Noen hjemme" },
    ];
    const html = chips
      .map((c) => {
        this._watched.add(c.ent);
        const kls = ["chip", c.type === "les" ? "chip-les" : "", c.avansert ? "avansert-kun" : ""].filter(Boolean).join(" ");
        const act = c.type === "les" ? "more" : "toggle";
        return `
          <div class="${kls}" data-toggle="${c.ent}" data-entity="${c.ent}" data-action="${act}"
               data-on-label="${esc(c.på || "På")}" data-off-label="${esc(c.av || "Av")}" tabindex="0" role="button">
            <div class="chip-ikon"><ha-icon icon="${c.icon}"></ha-icon></div>
            <div class="chip-tekst">
              <div class="chip-navn">${esc(c.navn)}</div>
              <div class="chip-sub" data-toggle-label>–</div>
            </div>
          </div>`;
      })
      .join("");
    return `<div class="rutenett">${html}</div>`;
  }

  _sonerHtml() {
    let ut = "";
    let forrigeGruppe = null;
    for (const z of ZONER) {
      const styr = this.b(z.styr);
      this._watched.add(styr);
      const felt = [];
      if (z.dag) felt.push({ id: z.dag, navn: "Dag", icon: "mdi:weather-sunny", enhet: " °C", dec: 1 });
      if (z.natt) felt.push({ id: z.natt, navn: "Natt", icon: "mdi:weather-night", enhet: " °C", dec: 1 });
      if (z.fast) felt.push({ id: z.fast, navn: "Settpunkt", icon: "mdi:thermometer", enhet: " °C", dec: 1 });
      felt.forEach((f) => this._watched.add(this.n(f.id)));
      const maling = this._config.sone_sensorer && this._config.sone_sensorer[z.key];
      if (maling) this._watched.add(maling);

      if (z.gruppe !== forrigeGruppe) {
        ut += `<div class="gruppe">${esc(z.gruppe)}</div>`;
        forrigeGruppe = z.gruppe;
      }

      ut += `
        <div class="sone" data-sone="${z.key}">
          <div class="sone-hode" data-action="expand" data-sone="${z.key}" tabindex="0" role="button">
            <div class="sone-ikon"><ha-icon icon="${z.icon}"></ha-icon></div>
            <div class="sone-tekst">
              <div class="sone-navn">${esc(z.navn)}</div>
              <div class="sone-sub" data-sone-sum="${z.key}">–</div>
            </div>
            <div class="ki-pill" data-toggle="${styr}" data-entity="${styr}" data-action="toggle"
                 data-on-label="KI" data-off-label="Manuell" tabindex="0" role="switch">
              <span data-toggle-label>–</span>
            </div>
            ${felt.length ? `<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>` : `<span class="chev-tom"></span>`}
          </div>
          ${felt.length ? `<div class="sone-kropp">
              ${z.notat ? `<div class="notat">${esc(z.notat)}</div>` : ""}
              ${maling ? `<div class="maling" data-bind="maling" data-entity="${maling}">–</div>` : ""}
              ${this._tallListe(felt)}
            </div>` : ""}
        </div>`;
    }

    const alle = ZONER.map((z) => this.b(z.styr)).join(" ");
    return `
      <div class="seksjon apen" data-seksjon="soner">
        <div class="seksjon-hode" data-action="accordion" data-seksjon="soner" tabindex="0" role="button">
          <div class="seksjon-ikon"><ha-icon icon="mdi:home-thermometer"></ha-icon></div>
          <div class="seksjon-tekst">
            <div class="seksjon-navn">Soner</div>
            <div class="seksjon-sub" id="sone-teller">–</div>
          </div>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </div>
        <div class="seksjon-kropp">
          <div class="hurtig avansert-kun">
            <div class="mini" data-action="alle" data-alle="on" data-entities="${alle}">Slå KI på i alle soner</div>
            <div class="mini" data-action="alle" data-alle="off" data-entities="${alle}">Sett alle til manuell</div>
          </div>
          ${ut}
        </div>
      </div>`;
  }

  _seksjon(key, icon, navn, sub, innhold) {
    return `
      <div class="seksjon" data-seksjon="${key}">
        <div class="seksjon-hode" data-action="accordion" data-seksjon="${key}" tabindex="0" role="button">
          <div class="seksjon-ikon"><ha-icon icon="${icon}"></ha-icon></div>
          <div class="seksjon-tekst">
            <div class="seksjon-navn">${esc(navn)}</div>
            <div class="seksjon-sub">${esc(sub)}</div>
          </div>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </div>
        <div class="seksjon-kropp">${innhold}</div>
      </div>`;
  }

  _underTittel(t) {
    return `<div class="undertittel">${esc(t)}</div>`;
  }

  _tallListe(liste) {
    return liste
      .map((f) => {
        const ent = f.id.startsWith("input_number.") ? f.id : this.n(f.id);
        this._watched.add(ent);
        return `
          <div class="rad">
            <div class="rad-ikon"><ha-icon icon="${f.icon || "mdi:tune"}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${ent}">${esc(f.navn)}</div>
            <div class="stepper">
              <div class="steg" data-action="step" data-dir="-1" data-entity="${ent}" tabindex="0" role="button" aria-label="Ned">−</div>
              <div class="steg-verdi" data-bind="num" data-entity="${ent}" data-dec="${f.dec ?? 1}" data-unit="${esc(f.enhet || "")}">–</div>
              <div class="steg" data-action="step" data-dir="1" data-entity="${ent}" tabindex="0" role="button" aria-label="Opp">+</div>
            </div>
          </div>`;
      })
      .join("");
  }

  _tidListe(liste) {
    return liste
      .map((f) => {
        const ent = this.t(f.id);
        this._watched.add(ent);
        return `
          <div class="rad">
            <div class="rad-ikon"><ha-icon icon="${f.icon}"></ha-icon></div>
            <div class="rad-navn" data-action="more" data-entity="${ent}">${esc(f.navn)}</div>
            <input class="tid" type="time" data-bind="time" data-entity="${ent}">
          </div>`;
      })
      .join("");
  }

  _diagnostikkHtml() {
    const rader = [
      { ent: this.s("klima_status"), navn: "Status", icon: "mdi:information-outline" },
      { ent: this.s("estimert_timesforbruk"), navn: "Prognose timen", icon: "mdi:counter", dec: 2, enhet: " kWh" },
      { ent: this.s("effektiv_effektgrense"), navn: "Effektiv grense", icon: "mdi:speedometer", dec: 2, enhet: " kWh" },
      { ent: this.n("shed_niva"), navn: "Utkoblingsnivå", icon: "mdi:stairs-down", dec: 0 },
      { ent: this.bs("effekt_over_grense"), navn: "Over grense", icon: "mdi:flash-alert" },
      { ent: this.bs("alle_borte"), navn: "Alle borte", icon: "mdi:home-export-outline" },
    ];
    const html = rader
      .map((r) => {
        this._watched.add(r.ent);
        return `
          <div class="rad rad-les" data-action="more" data-entity="${r.ent}">
            <div class="rad-ikon"><ha-icon icon="${r.icon}"></ha-icon></div>
            <div class="rad-navn">${esc(r.navn)}</div>
            <div class="rad-verdi" data-bind="raw" data-entity="${r.ent}" data-dec="${r.dec ?? ""}" data-unit="${esc(r.enhet || "")}">–</div>
          </div>`;
      })
      .join("");
    return html + (this._config.show_historikk ? `<div class="historikk" id="historikk"></div>` : "");
  }

  /* ---------------------------------------------------------------- *
   * Oppdatering
   * ---------------------------------------------------------------- */

  _update() {
    const h = this._hass;
    if (!h || !this._built) return;

    this._root.querySelectorAll("[data-bind]").forEach((el) => {
      const st = h.states[el.dataset.entity];
      const kind = el.dataset.bind;
      if (kind === "num") {
        const dec = Number(el.dataset.dec ?? 1);
        el.textContent = st ? nf(st.state, dec) + (el.dataset.unit || "") : "–";
        el.classList.toggle("mangler", !st);
      } else if (kind === "time") {
        const v = st ? String(st.state).slice(0, 5) : "";
        if (el.value !== v && this._root.activeElement !== el) el.value = v;
        el.disabled = !st;
      } else if (kind === "maling") {
        el.textContent = st ? `Måler nå ${nf(st.state, 1)} °C` : "";
      } else if (kind === "raw") {
        if (!st) { el.textContent = "–"; return; }
        const dec = el.dataset.dec;
        let v = st.state;
        if (dec !== "" && dec !== undefined && isFinite(Number(v))) v = nf(v, Number(dec));
        if (v === "on") v = "Ja";
        if (v === "off") v = "Nei";
        el.textContent = v + (el.dataset.unit || "");
      }
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      const on = !!st && st.state === "on";
      el.classList.toggle("on", on);
      el.classList.toggle("mangler", !st);
      const lbl = el.querySelector("[data-toggle-label]");
      if (lbl) lbl.textContent = on ? el.dataset.onLabel || "På" : el.dataset.offLabel || "Av";
    });

    this._updateMaster();
    this._updateGauge();
    this._updateSoner();
    if (this._config.show_diagnostikk && this._config.show_historikk && this._view === "avansert") this._mountHistorikk();
  }

  _updateMaster() {
    const h = this._hass;
    const st = h.states[this.b("klima_hovedbryter")];
    const on = st && st.state === "on";
    const ikon = this._root.getElementById("master-icon");
    const status = this._root.getElementById("master-status");
    if (ikon) ikon.setAttribute("icon", on ? "mdi:robot" : "mdi:robot-off");
    if (status) {
      if (!on) status.textContent = "KI er slått av — soner styres manuelt";
      else {
        const s = h.states[this.s("klima_status")];
        status.textContent = s ? s.state : "Aktiv";
      }
    }
    const ute = this._root.getElementById("master-ute");
    if (ute) {
      const u = this._config.ute_sensor ? h.states[this._config.ute_sensor] : null;
      ute.innerHTML = u ? `<ha-icon icon="mdi:thermometer"></ha-icon><span>${nf(u.state, 1)}°</span>` : "";
    }
  }

  _updateGauge() {
    if (!this._config.show_gauge) return;
    const h = this._hass;
    const g = this._root.getElementById("gauge");
    if (!g) return;
    const forbruk = Number((h.states[this.s("estimert_timesforbruk")] || {}).state);
    const grense = Number((h.states[this.s("effektiv_effektgrense")] || {}).state);
    const over = (h.states[this.bs("effekt_over_grense")] || {}).state === "on";
    const shed = parseInt((h.states[this.n("shed_niva")] || {}).state, 10);

    const gyldig = isFinite(forbruk) && isFinite(grense) && grense > 0;
    const pct = gyldig ? Math.max(0, Math.min(100, (forbruk / grense) * 100)) : 0;

    const fyll = this._root.getElementById("gauge-fyll");
    fyll.style.width = pct + "%";
    const niva = over || pct >= 100 ? "kritisk" : pct >= 80 ? "hoy" : "ok";
    g.dataset.niva = niva;

    this._root.getElementById("gauge-verdi").textContent = gyldig ? `${nf(forbruk, 2)} kWh` : "–";
    this._root.getElementById("gauge-tekst").textContent = gyldig
      ? `${Math.round(pct)} % av ${nf(grense, 2)} kWh`
      : "Mangler effektsensorer";
    const merke = this._root.getElementById("gauge-shed");
    merke.textContent = isFinite(shed) && shed > 0 ? `Utkobling nivå ${shed}` : over ? "Over grense" : "";
  }

  _updateSoner() {
    const h = this._hass;
    let aktive = 0;
    for (const z of ZONER) {
      const st = h.states[this.b(z.styr)];
      if (st && st.state === "on") aktive++;
      const sum = this._root.querySelector(`[data-sone-sum="${z.key}"]`);
      if (!sum) continue;
      const del = [];
      if (z.dag) del.push(`Dag ${this._verdi(z.dag)}°`);
      if (z.natt) del.push(`Natt ${this._verdi(z.natt)}°`);
      if (z.fast) del.push(`${this._verdi(z.fast)}°`);
      if (z.key === "gardiner") {
        const a = this._verdi("gardin_start_maned", 0);
        const b = this._verdi("gardin_slutt_maned", 0);
        del.push(`Sesong ${a}.–${b}. måned`);
      }
      sum.textContent = del.join("  ·  ");
    }
    const teller = this._root.getElementById("sone-teller");
    if (teller) teller.textContent = `${aktive} av ${ZONER.length} soner styres av KI`;
  }

  _verdi(id, dec = 1) {
    const st = this._hass.states[this.n(id)];
    return st ? nf(st.state, dec) : "–";
  }

  async _mountHistorikk() {
    const slot = this._root.getElementById("historikk");
    if (!slot || slot.dataset.mounted) return;
    slot.dataset.mounted = "1";
    try {
      const helpers = await window.loadCardHelpers();
      const el = helpers.createCardElement({
        type: "history-graph",
        hours_to_show: 12,
        entities: [this.s("estimert_timesforbruk"), this.s("effektiv_effektgrense")],
      });
      el.hass = this._hass;
      slot.appendChild(el);
      this._historyEl = el;
    } catch (e) {
      slot.textContent = "Historikk kunne ikke lastes.";
    }
  }

  /* ---------------------------------------------------------------- *
   * Interaksjon
   * ---------------------------------------------------------------- */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "toggle") {
      const id = el.dataset.entity;
      const st = this._hass.states[id];
      if (!st) return;
      const domain = id.split(".")[0];
      if (domain === "input_boolean") {
        this._haptic("light");
        this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
      } else {
        this._moreInfo(id);
      }
      ev.stopPropagation();
    } else if (a === "more") {
      this._moreInfo(el.dataset.entity);
      ev.stopPropagation();
    } else if (a === "step") {
      this._step(el.dataset.entity, Number(el.dataset.dir));
      ev.stopPropagation();
    } else if (a === "expand") {
      const sone = this._root.querySelector(`.sone[data-sone="${el.dataset.sone}"]`);
      if (sone && sone.querySelector(".sone-kropp")) {
        sone.classList.toggle("apen");
        this._haptic("selection");
      }
    } else if (a === "accordion") {
      const sek = this._root.querySelector(`.seksjon[data-seksjon="${el.dataset.seksjon}"]`);
      if (sek) {
        sek.classList.toggle("apen");
        this._haptic("selection");
        if (el.dataset.seksjon === "diagnostikk") this._mountHistorikk();
      }
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "alle") {
      const ids = el.dataset.entities.split(" ");
      this._haptic("medium");
      this._hass.callService("input_boolean", el.dataset.alle === "on" ? "turn_on" : "turn_off", { entity_id: ids });
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "time");
    if (!el || !el.value) return;
    const [t, m] = el.value.split(":");
    this._hass.callService("input_datetime", "set_datetime", {
      entity_id: el.dataset.entity,
      time: `${t}:${m}:00`,
    });
  }

  _step(id, dir) {
    const st = this._hass.states[id];
    if (!st) return;
    const step = Number(st.attributes.step ?? 0.5) || 0.5;
    const min = Number(st.attributes.min ?? -100);
    const max = Number(st.attributes.max ?? 1000);
    const naa = this._pending[id] !== undefined ? this._pending[id] : Number(st.state);
    const ny = Math.min(max, Math.max(min, Number((naa + dir * step).toFixed(4))));
    if (ny === naa) return;
    this._pending[id] = ny;
    this._haptic("light");

    this._root.querySelectorAll(`[data-bind="num"][data-entity="${id}"]`).forEach((el) => {
      el.textContent = nf(ny, Number(el.dataset.dec ?? 1)) + (el.dataset.unit || "");
      el.classList.add("endres");
    });

    clearTimeout(this._timers[id]);
    this._timers[id] = setTimeout(() => {
      const verdi = this._pending[id];
      delete this._pending[id];
      this._root.querySelectorAll(`[data-bind="num"][data-entity="${id}"]`).forEach((el) => el.classList.remove("endres"));
      this._hass.callService("input_number", "set_value", { entity_id: id, value: verdi });
    }, 500);
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) {
      this._lagreView(this._view);
      this._haptic("selection");
    }
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
    if (this._view === "avansert" && this._config.show_historikk) this._mountHistorikk();
  }

  _moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  _haptic(type) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  /* ---------------------------------------------------------------- *
   * Stil — følger designsystemet i resten av dashbordet
   * ---------------------------------------------------------------- */

  static get styles() {
    return `
      :host { display:block; }
      ha-card {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .wrap { display:flex; flex-direction:column; gap:10px; }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; color:var(--gray1000, var(--primary-text-color)); }

      /* Avansert-innhold skjules i enkel visning */
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Hovedbryter */
      .master {
        display:grid; grid-template-columns:66px 1fr auto; align-items:center;
        gap:10px; height:78px; padding:0 16px 0 4px;
        border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .master.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .master-ikon {
        width:62px; height:62px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .master.on .master-ikon { background: rgba(40,40,42,.12); }
      .master-ikon ha-icon { --mdc-icon-size:30px; }
      .master-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .master-status { font-size:13px; opacity:.72; line-height:1.3; margin-top:2px;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .master-ute { display:flex; align-items:center; gap:4px; font-size:15px; opacity:.8; white-space:nowrap; }
      .master-ute ha-icon { --mdc-icon-size:18px; }

      /* Effektmåler */
      .gauge {
        background: var(--gray200, var(--secondary-background-color));
        border-radius:24px; padding:14px 18px 12px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .gauge-topp { display:flex; justify-content:space-between; align-items:baseline; }
      .gauge-tittel { font-size:14px; opacity:.7; }
      .gauge-verdi { font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; }
      .gauge-spor { height:10px; border-radius:6px; margin:10px 0 8px; overflow:hidden;
        background: rgba(128,128,128,.22); }
      .gauge-fyll { height:100%; width:0%; border-radius:6px; background: var(--green, #4caf50);
        transition: width .5s cubic-bezier(.2,.7,.3,1), background .3s ease; }
      .gauge[data-niva="hoy"] .gauge-fyll { background: var(--orange, #ff9800); }
      .gauge[data-niva="kritisk"] .gauge-fyll { background: var(--red, #f44336); }
      .gauge-bunn { display:flex; justify-content:space-between; font-size:13px; opacity:.7; }
      .gauge-merke { font-weight:600; opacity:1; color: var(--orange, #ff9800); }
      .gauge[data-niva="kritisk"] .gauge-merke { color: var(--red, #f44336); }

      /* Visningsbryter */
      .switch {
        display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px;
        background: var(--gray200, var(--secondary-background-color));
        border-radius:75px;
      }
      .switch-valg {
        text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; color: var(--gray1000, var(--primary-text-color)); opacity:.6;
        transition: background .18s ease, opacity .18s ease, color .18s ease;
      }
      .switch-valg.aktiv {
        background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1;
      }

      /* Modus-chips */
      .rutenett { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .chip {
        display:grid; grid-template-columns:58px 1fr; align-items:center; gap:8px;
        height:66px; padding-left:4px; border-radius:75px; cursor:pointer; overflow:hidden;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .chip.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chip.chip-les.on { background: var(--orange, #ff9800); color: var(--black, #101010); }
      .chip-ikon {
        width:58px; height:58px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .chip.on .chip-ikon { background: rgba(40,40,42,.12); }
      .chip-ikon ha-icon { --mdc-icon-size:24px; }
      .chip-tekst { padding-right:10px; min-width:0; }
      .chip-navn { font-size:15px; font-weight:500; line-height:1.2;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .chip-sub { font-size:13px; opacity:.7; line-height:1.3; }

      /* Seksjoner (trekkspill) */
      .seksjon {
        background: var(--gray200, var(--secondary-background-color));
        border-radius:24px; overflow:hidden;
      }
      .seksjon + .seksjon { margin-top:10px; }
      .avansert-kun .seksjon:first-child { margin-top:0; }
      .seksjon-hode {
        display:grid; grid-template-columns:66px 1fr 28px; align-items:center;
        height:66px; padding-right:12px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .seksjon-ikon {
        width:58px; height:58px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10);
      }
      .seksjon-ikon ha-icon { --mdc-icon-size:24px; }
      .seksjon-navn { font-size:16px; font-weight:500; }
      .seksjon-sub { font-size:13px; opacity:.7; }
      .seksjon-kropp { display:none; padding:2px 14px 14px; }
      .seksjon.apen .seksjon-kropp { display:block; }
      .seksjon.apen .seksjon-hode .chev { transform: rotate(180deg); }
      .chev { --mdc-icon-size:22px; opacity:.5; transition: transform .2s ease; }

      .undertittel {
        font-size:13px; font-weight:600; opacity:.55; letter-spacing:.2px;
        padding:14px 6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .gruppe {
        font-size:13px; font-weight:600; opacity:.55;
        padding:14px 6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .gruppe:first-child { padding-top:6px; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:6px 0 2px; }
      .mini {
        text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); color: var(--gray1000, var(--primary-text-color));
      }
      .mini:active { transform: scale(.98); }

      /* Sone */
      .sone { border-radius:18px; background: rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
      .sone-hode {
        display:grid; grid-template-columns:48px 1fr auto 24px; align-items:center; gap:8px;
        padding:8px 10px 8px 6px; cursor:pointer;
        color: var(--gray1000, var(--primary-text-color));
      }
      .sone-ikon {
        width:44px; height:44px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.16);
      }
      .sone-ikon ha-icon { --mdc-icon-size:22px; }
      .sone-navn { font-size:15px; font-weight:500; line-height:1.2; }
      .sone-sub { font-size:12.5px; opacity:.65; font-variant-numeric:tabular-nums; }
      .ki-pill {
        font-size:12px; font-weight:600; padding:6px 12px; border-radius:75px; cursor:pointer;
        background: rgba(128,128,128,.20); color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .ki-pill.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chev-tom { width:24px; }
      .sone-kropp { display:none; padding:0 8px 10px 8px; }
      .sone.apen .sone-kropp { display:block; }
      .sone.apen .sone-hode .chev { transform: rotate(180deg); }
      .notat { font-size:12.5px; opacity:.6; padding:2px 6px 6px; }
      .maling { font-size:13px; opacity:.75; padding:2px 6px 8px; font-variant-numeric:tabular-nums; }

      /* Rader med stepper eller tid */
      .rad {
        display:grid; grid-template-columns:40px 1fr auto; align-items:center; gap:8px;
        padding:6px 4px; color: var(--gray1000, var(--primary-text-color));
      }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-ikon { width:36px; height:36px; border-radius:50%;
        display:flex; align-items:center; justify-content:center; background: rgba(128,128,128,.14); }
      .rad-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .rad-navn { font-size:14.5px; cursor:pointer; }
      .rad-verdi { font-size:14.5px; font-weight:600; font-variant-numeric:tabular-nums; opacity:.9; }
      .rad-les { cursor:pointer; }

      .stepper { display:flex; align-items:center; gap:2px;
        background: rgba(128,128,128,.16); border-radius:75px; padding:2px; }
      .steg {
        width:34px; height:34px; border-radius:50%; cursor:pointer; user-select:none;
        display:flex; align-items:center; justify-content:center;
        font-size:20px; font-weight:500; line-height:1;
        background: rgba(128,128,128,.18);
      }
      .steg:active { transform: scale(.92); }
      .steg-verdi {
        min-width:72px; text-align:center; font-size:15px; font-weight:600;
        font-variant-numeric:tabular-nums;
      }
      .steg-verdi.endres { opacity:.6; }
      .steg-verdi.mangler { opacity:.35; }

      .tid {
        font-family:inherit; font-size:15px; font-weight:600;
        color: var(--gray1000, var(--primary-text-color));
        background: rgba(128,128,128,.16); border:none; border-radius:75px;
        padding:8px 14px; text-align:center;
      }
      .tid::-webkit-calendar-picker-indicator { opacity:.5; }

      .historikk { margin-top:10px; }
      .historikk ha-card { background: rgba(128,128,128,.10); border-radius:18px; }

      .mangler { opacity:.4; }

      [tabindex]:focus-visible {
        outline:2px solid var(--active-big, var(--primary-color));
        outline-offset:2px;
      }
      @media (prefers-reduced-motion: reduce) {
        * { transition:none !important; }
      }
      @media (max-width: 380px) {
        .rutenett { grid-template-columns:1fr; }
        .steg-verdi { min-width:62px; }
      }
    `;
  }
}

window.KI.define("ki-klima-card", KiKlimaCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { name: "ute_sensor", selector: { entity: { domain: "sensor" } } },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_gauge", selector: { boolean: {} } },
    { name: "show_hurtigvalg", selector: { boolean: {} } },
    { name: "show_diagnostikk", selector: { boolean: {} } },
    { name: "show_historikk", selector: { boolean: {} } },
  ] },
];

const EDITOR_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  default_view: "Standardvisning",
  ute_sensor: "Utetemperatur (valgfri)",
  remember_view: "Husk valgt visning",
  show_gauge: "Vis effektmåler",
  show_hurtigvalg: "Vis modusknapper",
  show_diagnostikk: "Vis diagnostikk",
  show_historikk: "Vis historikkgraf",
};

class KiKlimaCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "ki",
        default_view: "enkel",
        remember_view: true,
        show_gauge: true,
        show_hurtigvalg: true,
        show_diagnostikk: true,
        show_historikk: true,
      },
      config || {}
    );
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this.shadowRoot.innerHTML = `<style>
        .info { font-size:13px; opacity:.7; padding:10px 2px 0; line-height:1.45; }
        code { background: rgba(128,128,128,.18); padding:1px 5px; border-radius:5px; }
      </style>`;
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = "Faktiske romtemperaturer kan legges til per sone i YAML med <code>sone_sensorer</code>, f.eks. <code>stue_panelovn: sensor.stue_temperatur</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

window.KI.define("ki-klima-card-editor", KiKlimaCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-klima-card",
  name: "KI Klima",
  description: "Klimastyring med enkel og avansert visning, effektvakt og sonestyring",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-klima-card feilet", e); }

/* ===== ki-klima-pro-card ===== */
try {
/**
 * ki-klima-pro-card.js  (v2 — for custom integration «KI Energi»)
 * Ett kort for hele KI-klima- og energisystemet.
 *
 * Kortet snakker bare med entitetene integrasjonen lager. Gamle
 * input_boolean/input_number/input_datetime-navn fra YAML-pakken oversettes
 * automatisk til switch/number/time/datetime, så alle gamle referanser i
 * kortet virker uendret.
 *
 *   Oversikt      status, timebudsjett, graf, modus, varmtvann
 *   Soner         måltemperatur, KI/manuell, overstyring med utløp
 *   Energi        dynamisk grense, månedens topper, grafer, statistikk
 *   Varmtvann     legionellastatus og tvungen syklus
 *   Tanker        hva motoren tenker akkurat nå + beslutningslogg
 *   Oppsett       alle brytere, tider, tidskonstanter, diagnostikk
 *
 * Kopier til /config/www/ki-klima-pro-card.js og legg til som ressurs:
 *   URL:  /local/ki-klima-pro-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Config:  type: custom:ki-klima-pro-card
 */

const KI_PRO_VERSJON = "2.6.0";

console.info(
  `%c KI-KLIMA-PRO-CARD %c ${KI_PRO_VERSJON} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#4caf50;color:#fff;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const FANER = [
  { id: "oversikt", navn: "Oversikt", icon: "mdi:view-dashboard" },
  { id: "soner", navn: "Soner", icon: "mdi:home-thermometer" },
  { id: "energi", navn: "Energi", icon: "mdi:flash" },
  { id: "varmtvann", navn: "Vann og bad", icon: "mdi:water-boiler" },
  { id: "tanker", navn: "Tanker", icon: "mdi:head-cog" },
  { id: "oppsett", navn: "Oppsett", icon: "mdi:tune" },
  { id: "avansert", navn: "Avansert", icon: "mdi:wrench-cog" },
];

// Entitetene motoren bruker per sone. Brukes bare til diagnostikk i kortet,
// så manglende sensorer blir synlige uten å måtte grave i pyscript-fila.
const SONE_ENTITETER = {
  stue_panelovn: ["climate.stue_panelovn", "sensor.stue_panelovn_current_power", "sensor.stue_panelovn_control_signal"],
  stue_oljefyr: ["climate.stue_oljefyr", "sensor.stue_oljefyr_current_power", "sensor.stue_oljefyr_control_signal"],
  trappegang: ["climate.trappegang_panelovn", "sensor.trappegang_panelovn_current_power", "sensor.trappegang_panelovn_control_signal"],
  kjokken_panelovn: ["climate.kjokken_panelovn", "sensor.kjokken_panelovn_current_power", "sensor.kjokken_panelovn_control_signal"],
  cybele: ["climate.cybele_panelovn", "sensor.cybele_panelovn_current_power", "sensor.cybele_panelovn_control_signal"],
  sebastian: ["climate.sebastian_panelovn", "sensor.sebastian_panelovn_stikkontakt_power", "sensor.panelovn_temperature"],
  kjokken_gulv: ["climate.kjokken_gulvvarme", "sensor.kjokken_gulvvarme_power", "sensor.kjokken_gulvvarme_air_temperature"],
  bad_gulv: ["climate.bad_gulvvarme", "sensor.bad_gulvvarme_power", "sensor.bad_gulvvarme_temperature"],
  vaskegang_gulv: ["climate.vaskegang_gulvvarme", "sensor.vaskegang_gulvvarme_power", "sensor.vaskegang_gulvvarme_air_temperature"],
  do_gulv: ["climate.do_gulvvarme", "sensor.do_gulvvarme_power", "sensor.do_gulvvarme_room_temperature"],
};

const TIMESMALER_KANDIDATER = ["sensor.ki_time_energi"];

// Oversetting fra pakkens gamle helper-domener til integrasjonens entiteter.
const DATO_TID = new Set(["ki_vvb_siste_godkjente_syklus", "ki_vvb_oppvarming_startet",
  "ki_vvb_boost_til", "ki_hjemkomst_planlagt"]);
const mapId = (id) => {
  if (!id || typeof id !== "string") return id;
  const [dom, obj] = id.split(".");
  if (dom === "input_boolean") return `switch.${obj}`;
  if (dom === "input_number") return `number.${obj}`;
  if (dom === "input_text") return `text.${obj}`;
  if (dom === "input_datetime") return `${DATO_TID.has(obj) ? "datetime" : "time"}.${obj}`;
  return id;
};
// Tjenester fra pyscript/script-tiden → integrasjonens tjenester
const TJENESTER = {
  "pyscript.ki_overstyr": ["ki_energi", "overstyr"],
  "pyscript.ki_fjern_overstyring": ["ki_energi", "fjern_overstyring"],
  "pyscript.ki_nullstill_laering": ["ki_energi", "nullstill_laering"],
  "script.ki_vvb_boost": ["ki_energi", "vvb_boost"],
  "script.ki_vvb_avbryt_boost": ["ki_energi", "vvb_avbryt_boost"],
  "script.ki_vvb_tving_syklus_na": ["ki_energi", "vvb_tving_syklus"],
  "script.ki_sett_standardverdier": ["ki_energi", "sett_standardverdier"],
};

const SONE_TEKST = {
  gronn: "God margin", gul: "Nærmer seg grensen", oransje: "Liten margin",
  rod: "Fare for ny topp", kritisk: "Kritisk", fallback: "Trygg fallback",
  av: "Motoren er av",
};

const HANDLING = {
  normal: { tekst: "Normal", k: "ok" },
  senket: { tekst: "Senket", k: "advarsel" },
  vindu: { tekst: "Vindu åpent", k: "feil" },
  manuell: { tekst: "Manuell", k: "noytral" },
  utilgjengelig: { tekst: "Utilgjengelig", k: "feil" },
  utsatt: { tekst: "Utsatt", k: "advarsel" },
  "på": { tekst: "På", k: "ok" },
  av: { tekst: "Av", k: "noytral" },
};

// Settpunkt-helpere per sonenøkkel, slik motoren bruker dem
const SONE_HELPERE = {
  stue_panelovn: [["ki_temp_stue_dag", "Dag"], ["ki_temp_stue_natt", "Natt"]],
  stue_oljefyr: [["ki_temp_stue_dag", "Dag"], ["ki_temp_stue_natt", "Natt"]],
  trappegang: [["ki_temp_trappegang_dag", "Dag"], ["ki_temp_trappegang_natt", "Natt"]],
  kjokken_panelovn: [["ki_temp_kjokken_panelovn_dag", "Dag"], ["ki_temp_kjokken_panelovn_natt", "Natt"]],
  cybele: [["ki_temp_cybele_dag", "Dag"], ["ki_temp_cybele_natt", "Natt"], ["ki_temp_cybele_borte", "Borte"]],
  sebastian: [["ki_temp_sebastian_dag", "Dag"], ["ki_temp_sebastian_natt", "Natt"]],
  kjokken_gulv: [["ki_temp_kjokken", "Settpunkt"]],
  bad_gulv: [["ki_temp_bad", "Settpunkt"]],
  vaskegang_gulv: [["ki_temp_vaskegang", "Settpunkt"]],
  do_gulv: [["ki_temp_do", "Settpunkt"]],
};

const SONE_STYR = {
  stue_panelovn: "ki_styr_stue_panelovn", stue_oljefyr: "ki_styr_stue_oljefyr",
  trappegang: "ki_styr_trappegang_panelovn", kjokken_panelovn: "ki_styr_kjokken_panelovn",
  cybele: "ki_styr_cybele_panelovn", sebastian: "ki_styr_sebastian_panelovn",
  kjokken_gulv: "ki_styr_kjokken_gulvvarme", bad_gulv: "ki_styr_bad_gulvvarme",
  vaskegang_gulv: "ki_styr_vaskegang_gulvvarme", do_gulv: "ki_styr_do_gulvvarme",
};

// Forklaringer bak spørsmålstegnene. Kort, konkret, og om hva som faktisk
// skjer — ikke en omskriving av navnet på feltet.
// Ikon per blokkoverskrift. Settes inn automatisk i _tegn().
const HODE_IKON = {
  "Vurdering per sone": "mdi:home-thermometer", "Varsler": "mdi:bell-outline", "Varmtvann": "mdi:water-boiler",
  "Varmtvann, avansert": "mdi:water-boiler-alert", "Timebudsjett": "mdi:timer-sand", "Tiltak akkurat nå": "mdi:lightning-bolt",
  "Tider": "mdi:clock-outline", "Terskler for fargesonene": "mdi:palette", "Soner": "mdi:floor-plan",
  "Slik tenker motoren nå": "mdi:head-cog", "Siste 12 timer": "mdi:chart-line", "Prognose og reserver": "mdi:chart-timeline-variant",
  "Prisstyring": "mdi:cash-clock", "Motorens råtilstand": "mdi:code-json", "Moduser og unntak": "mdi:tune-variant",
  "Modus": "mdi:toggle-switch-outline", "Legionella": "mdi:bacteria-outline", "Innlærte tidskonstanter": "mdi:school-outline",
  "Håndklevarmer": "mdi:radiator", "Hvem styrer ovnene": "mdi:account-cog", "Helgevarsler": "mdi:bag-suitcase",
  "Handlinger": "mdi:gesture-tap-button", "Handling": "mdi:gesture-tap", "Grenser": "mdi:speedometer",
  "Gardiner stue": "mdi:curtains", "Forventet effekt": "mdi:chart-bell-curve", "Entiteter per sone": "mdi:link-variant",
  "Effekt siste 6 timer": "mdi:chart-areaspline", "Dynamisk grense": "mdi:arrow-expand-vertical", "Dusjvinduer": "mdi:shower-head",
  "Diagnostikk": "mdi:stethoscope", "Denne måneden": "mdi:calendar-month", "Brytere": "mdi:toggle-switch",
  "Beslutningslogg": "mdi:text-box-outline", "Tarifftabell": "mdi:table", "Motor": "mdi:engine", "Varme og komfort": "mdi:radiator",
  "Helg og sommer": "mdi:calendar-weekend", "Vann og bad": "mdi:shower", "Varslinger": "mdi:bell-ring-outline",
  "Dag og natt": "mdi:theme-light-dark", "Cybele": "mdi:account", "Sebastian": "mdi:account-school", "Stue og vindu": "mdi:sofa",
  "Leggetid": "mdi:bed", "Elbil": "mdi:ev-station",
};

const HJELP = {
  venter_svar: "Søndag morgen spør systemet om dere kommer hjem. Fram til du svarer, eller til svarfristen går ut, står dette på «Ja». Svarer du ikke, avsluttes helgemodus automatisk ved fristen, slik at huset er varmt når dere kommer.",
  beredskap: "En sjekk før du lar motoren overta: at den rapporterer status, at den har funnet en timesmåler, at tidskonstantene har nok målinger bak seg, og at ingen ovner står avslått. «Lærer fortsatt» betyr at den fungerer, men at nattsenkingsvurderingene ennå bygger på standardverdier.",
  skyggemodus: "Motoren regner ut alt og skriver til loggen, men rører ingen ovner. Slik kan du lese beslutningene i noen uker og se om du er enig før huset merker dem. Varmtvann, håndklevarmer og gardiner styres uansett.",
  dynamisk_grense: "Elvia fakturerer etter snittet av de tre høyeste døgnmaksene fra tre ulike dager. Motoren måler hver hele klokketime selv, husker døgnmaks per dato, og regner ut hvor høyt DAGENS døgnmaks kan bli uten at snittet passerer ønsket trinn (minus reserve). Timer opp til dagens allerede registrerte døgnmaks koster ingenting ekstra og senker ingen ovner. Den absolutte timegrensen gjelder alltid i tillegg. Registrerte tall og prognoser holdes adskilt.",
  tariff: "Øvre grense i kW → fastledd kr/mnd inkl. avgifter, f.eks. «2:150,5:250,10:420». Nøyaktig på grensen regnes som trinnet over. Snitt over siste grense = ukjent trinn (motoren finner ikke på satser, og styrer da etter absolutt grense).",
  tillatt_effekt: "Gjenstående kWh delt på gjenstående tid av timen. Verdien er kuttet ved timegrensen og regner aldri med mindre enn et kvarter igjen — ellers ville de siste minuttene av en rolig time gitt et vanvittig høyt tall som ovnene uansett ikke rekker å bruke.",
  uregulert: "Alt huset bruker som motoren ikke styrer: komfyr, oppvaskmaskin, elektronikk, lading. Regnes som total effekt minus summen av det den styrer. Dette er grunnlaget for hele prognosen.",
  tidskonstant: "Hvor lenge rommet holder på overtemperaturen sin. Måles ved å se hvor fort det kjøles ned når varmen er av. Lang tidskonstant betyr at nattsenking sjelden lønner seg, fordi gjenoppvarmingen skjer til dyrere dagtariff.",
  komfortvekt: "Hvor tungt et temperaturavvik veier mot prioriteten når budsjettet fordeles. Høyt tall gjør at et kaldt rom med lav prioritet likevel går foran et rom som allerede er varmt.",
  shed: "Hvor mange grader motoren får senke når budsjettet ikke strekker til. Gulvvarme tåler mer enn panelovner, fordi tregheten gjør at det ikke merkes i rommet på kort sikt.",
  vvb_terskel: "Hvor mange watt som må til før en oppvarming regnes som reell. Står den for lavt, telles standby som en fullført syklus, og legionellasikringen blir bekreftet på falskt grunnlag.",
  vvb_billige: "Marginalprisen er energipris pluss energiledd. Under Norgespris er energiprisen flat, så det er bare nettleiens dag- og nattskille som skiller timene — rangeringen faller derfor naturlig ned på natt og helg.",
  vvb_handling: "Berederen har ingen temperatursensor. Systemet bekrefter legionellasikring ved å se et fullført på→av-forløp, som betyr at termostaten nådde settpunktet. Det forutsetter at termostaten fysisk står på 65–70 °C — det kan ikke Home Assistant kontrollere. Energimotoren skriver aldri til berederen; den reserverer bare effekt.",
  vvb_syklus: "Berederen har ingen temperatursensor, men den har en termostat. Når bryteren står på og effekten faller til null, har termostaten koblet ut fordi vannet har nådd settpunktet. Det kalles metning, og er en direkte måling av at berederen er ferdig — også for legionella, forutsatt at termostaten fysisk står på 65–70 grader. Et ødelagt element gir samme signatur, så systemet krever at den HAR trukket effekt først. Har den aldri gjort det, er det en feil og ikke metning.",
  gardiner: "I fyringssesongen lukkes gardinene når sola er nede for å begrense varmetapet gjennom glassveggen, og åpnes på dagen for gratis solvarme. Er det bitende kaldt holdes de lukket også på dagen. Utenfor sesongen styres de bare i sommermodus, da som solskjerming.",
  handkle: "Klimastyringen eier denne bryteren. Når «KI styrer» er av, slås håndklevarmeren på igjen automatisk hver gang den går av — den er da ment å stå på konstant. Slå på KI-styring for å bruke tidsvinduene i stedet.",
  overtakelse: "Motoren er den eneste som skriver til ovnene. Bryteren er det motsatte av skyggemodus: på betyr at den faktisk setter settpunkt, av betyr at den bare regner og logger. Soner med «KI styrer» av røres aldri uansett.",
  lagring: "Innlærte lastprofiler, tidskonstanter, overstyringer og beslutningslogg lagres i Home Assistants .storage-mappe og overlever omstart og oppdatering av integrasjonen.",
  malekilde: "Forbruk denne timen måles direkte mot strømmålerens energiregister — motoren husker verdien ved timeskiftet og trekker fra. Svarer ikke registeret, brukes et anslag fra øyeblikkseffekt, som er merkbart mindre presist.",
  handlinger: "Entiteter og husets data endres under Innstillinger → Integrasjoner → KI Energi → Konfigurer. Nullstilling av tidskonstanter betyr at motoren må lære huset på nytt, og at nattsenkingen faller tilbake på standardverdier i mellomtiden — bruk det bare hvis tallene ser åpenbart feil ut.",
  leggetid: "Starter kveldssenkingen i rommet med én gang, i stedet for å vente til fast leggetid. Rommet varmes opp igjen til vanlig vekketid. Trykk igjen for å avbryte.",
  standardverdier: "Setter alle innstillinger tilbake til de anbefalte utgangsverdiene. Entiteter og husets data ligger i integrasjonens konfigurasjon og røres ikke.",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = (v, d = 1) => { const n = Number(v); return isFinite(n) ? n.toFixed(d).replace(".", ",") : "–"; };

class KiKlimaProCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-klima-pro-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-klima-pro-card" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._bygd = false;
    this._sig = "";
    this._fane = "oversikt";
    this._apne = new Set();
    this._hist = null;
    this._histTid = 0;
    this._hjelpApen = new Set();
    this._kollaps = this._lesKollaps();
    this._ov = {};
  }

  setConfig(config) {
    this._config = Object.assign({ title: "", default_tab: "oversikt", remember_tab: true }, config || {});
    this._fane = this._lesFane() || this._config.default_tab;
    this._bygd = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return 20; }

  _lesFane() {
    if (this._config && this._config.remember_tab === false) return null;
    try { return window.localStorage.getItem("ki-klima-pro:fane"); } catch (e) { return null; }
  }
  _lesKollaps() {
    try { return JSON.parse(window.localStorage.getItem("ki-klima-pro:kollaps") || "{}"); } catch (e) { return {}; }
  }
  _lagreKollaps() {
    try { window.localStorage.setItem("ki-klima-pro:kollaps", JSON.stringify(this._kollaps || {})); } catch (e) { /* ignorer */ }
  }

  // 24-timers linje med markører for klokkeslett-entiteter. [[id, etikett, klasse?], ...]
  _tidslinje(punkter, spenn = []) {
    const min = (id) => {
      const st = this._st(id); if (!st) return null;
      const m = /^(\d{1,2}):(\d{2})/.exec(st.state); return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const naa = new Date(); const naaMin = naa.getHours() * 60 + naa.getMinutes();
    const pct = (m) => (m / 1440 * 100).toFixed(2);
    const sp = spenn.map(([fraId, tilId, kl]) => {
      const a = min(fraId), b = min(tilId); if (a == null || b == null) return "";
      if (b >= a) return `<div class="tl-spenn ${kl || ""}" style="left:${pct(a)}%;width:${pct(b - a)}%"></div>`;
      return `<div class="tl-spenn ${kl || ""}" style="left:${pct(a)}%;width:${pct(1440 - a)}%"></div>
              <div class="tl-spenn ${kl || ""}" style="left:0;width:${pct(b)}%"></div>`;
    }).join("");
    const mk = punkter.map(([id, etikett, kl], i) => {
      const m = min(id); if (m == null) return "";
      const kl_ = ["over", "under", "over2"][i % 3];
      return `<div class="tl-mark ${kl || ""}" style="left:${pct(m)}%" title="${esc(etikett)} ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}">
        <i></i><span class="${kl_}">${esc(etikett)} ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}</span></div>`;
    }).join("");
    return `<div class="tidslinje">
      <div class="tl-spor">${sp}${mk}<div class="tl-naa" style="left:${pct(naaMin)}%"></div></div>
      <div class="tl-akse"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
    </div>`;
  }

  // Døgnplan: én rad per person/ting, 24-timers bånd med fargede spenn og markører. Klarere enn én linje.
  // rader: [{navn, spenn:[[fraId, tilId, klasse, tekst]], mark:[[id, tekst, klasse]]}]
  _dognplan(rader) {
    const min = (id) => {
      const st = this._st(id); if (!st) return null;
      const m = /^(\d{1,2}):(\d{2})/.exec(st.state); return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const naa = new Date(); const naaMin = naa.getHours() * 60 + naa.getMinutes();
    const pct = (m) => (m / 1440 * 100).toFixed(2);
    const kl = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const rad = (r) => {
      const sp = (r.spenn || []).map(([fraId, tilId, k, tekst]) => {
        const a = min(fraId), b = min(tilId); if (a == null || b == null) return "";
        const boks = (l, w, t) => `<div class="dp-spenn ${k || ""}" style="left:${pct(l)}%;width:${pct(w)}%" title="${esc(t)}"><span>${esc(t)}</span></div>`;
        const t = `${tekst || ""} ${kl(a)}–${kl(b)}`.trim();
        if (b >= a) return boks(a, b - a, t);
        return boks(a, 1440 - a, t) + boks(0, b, t);
      }).join("");
      const mk = (r.mark || []).map(([id, tekst, k]) => {
        const m = min(id); if (m == null) return "";
        return `<div class="dp-mark ${k || ""}" style="left:${pct(m)}%" title="${esc(tekst)} ${kl(m)}"><i></i><span>${esc(tekst)} ${kl(m)}</span></div>`;
      }).join("");
      return `<div class="dp-rad"><div class="dp-navn">${esc(r.navn)}</div>
        <div class="dp-spor">${sp}${mk}<div class="dp-naa" style="left:${pct(naaMin)}%"></div></div></div>`;
    };
    return `<div class="dognplan">${rader.map(rad).join("")}
      <div class="dp-rad dp-akse"><div class="dp-navn"></div><div class="dp-spor"><span>00</span><span>03</span><span>06</span><span>09</span><span>12</span><span>15</span><span>18</span><span>21</span><span>24</span></div></div>
    </div>`;
  }

  // 12-månedersstripe der [fra .. til] er markert (kan gå over nyttår).
  _manedStripe(fraId, tilId, etikett) {
    const fra = Math.round(this._n(fraId)), til = Math.round(this._n(tilId));
    const naa = new Date().getMonth() + 1;
    const inne = (m) => isFinite(fra) && isFinite(til) && (fra <= til ? (m >= fra && m <= til) : (m >= fra || m <= til));
    const venter = this._mndValg && this._mndValg.fraId === fraId ? this._mndValg.fra : null;
    return `<div class="mstripe">
      ${["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"].map((b, i) =>
        `<div class="mnd ${inne(i + 1) ? "inne" : ""} ${i + 1 === naa ? "naa" : ""} ${venter === i + 1 ? "venter" : ""}"
              data-handling="mnd" data-fra="${fraId}" data-til="${tilId}" data-mnd="${i + 1}"><span>${b}</span></div>`).join("")}
    </div><div class="stripeforklaring"><span><i class="s-valgt"></i>${esc(etikett || "Aktiv")}</span>
      <span>${venter ? `Start satt til måned ${venter} — trykk sluttmåned` : "Trykk startmåned, så sluttmåned"}</span></div>`;
  }

  // Sammenleggbar underseksjon inne i en blokk. Husker posisjonen som blokkene.
  _sub(id, tittel, innhold, apenStandard = false, ekstra = "") {
    const apen = this._kollaps[id] !== undefined ? this._kollaps[id] : apenStandard;
    return `<div class="sub-seksjon ${apen ? "" : "lukket"}">
      <div class="subhode" data-handling="subkollaps" data-id="${esc(id)}"><span>${tittel}</span>${ekstra}<ha-icon class="kollapsikon" icon="mdi:chevron-down"></ha-icon></div>
      <div class="subkropp">${innhold}</div>
    </div>`;
  }

  _lagreFane(v) {
    if (this._config.remember_tab === false) return;
    try { window.localStorage.setItem("ki-klima-pro:fane", v); } catch (e) { /* ignorer */ }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._bygd) this._bygg();
    let sig = this._fane + "|" + (this._underfane || "") + "|";
    for (const id of this._fulgt) sig += ((hass.states[mapId(id)] || {}).state || "-") + ",";
    if (sig !== this._sig) {
      this._sig = sig;
      // Står markøren i et inputfelt (klokkeslett), venter vi med å tegne på nytt til feltet
      // er forlatt — ellers lukkes velgeren hver gang en sensor oppdateres.
      const aktiv = this._rot && this._rot.activeElement;
      if (aktiv && (aktiv.tagName === "INPUT" || aktiv.tagName === "TEXTAREA" || aktiv.tagName === "SELECT")) { this._ventTegn = true; return; }
      this._tegn();
    }
  }

  // Spørsmålstegn som folder ut en forklaring.
  _hj(id) {
    return HJELP[id] ? `<span class="hjelp" data-handling="hjelp" data-id="${id}">?</span>` : "";
  }
  _hjTekst(id) {
    return this._hjelpApen && this._hjelpApen.has(id)
      ? `<div class="hjelptekst">${esc(HJELP[id])}</div>` : "";
  }

  _st(id) { return this._hass.states[mapId(id)]; }

  // Alle tjenestekall går her, så domener og entitets-ID-er oversettes ett sted.
  _kall(domene, tjeneste, data = {}) {
    const n = TJENESTER[`${domene}.${tjeneste}`];
    if (n) [domene, tjeneste] = n;
    if (domene === "input_boolean") domene = "switch";
    else if (domene === "input_number") { domene = "number"; tjeneste = "set_value"; }
    else if (domene === "input_text") { domene = "text"; tjeneste = "set_value"; }
    else if (domene === "input_datetime") {
      const obj = String(data.entity_id || "").split(".")[1];
      domene = DATO_TID.has(obj) ? "datetime" : "time";
      tjeneste = "set_value";
      if (domene === "time") data = { entity_id: data.entity_id, time: data.time };
      else data = { entity_id: data.entity_id, datetime: data.datetime || data.timestamp };
    }
    if (data.entity_id) data = Object.assign({}, data, { entity_id: mapId(data.entity_id) });
    return this._hass.callService(domene, tjeneste, data);
  }
  _s(id, d = "–") { const s = this._st(id); return s && !["unknown", "unavailable"].includes(s.state) ? s.state : d; }
  _n(id, d = NaN) { const s = this._st(id); const v = s ? Number(s.state) : NaN; return isFinite(v) ? v : d; }
  _a(id, navn, d) { const s = this._st(id); return s && s.attributes[navn] !== undefined ? s.attributes[navn] : d; }
  _pa(id) { const s = this._st(id); return !!s && s.state === "on"; }

  /* ------------------------------------------------------------ */

  _bygg() {
    this._fulgt = new Set([
      "sensor.ki_energi_status", "sensor.ki_laster", "sensor.ki_beslutningslogg",
      "sensor.ki_bereder", "sensor.ki_tidskonstanter", "sensor.ki_klima_status",
      "sensor.ki_uregulert_effekt", "sensor.ki_styrt_effekt", "sensor.ki_hvitevarer_effekt",
      "sensor.ki_prognose", "sensor.ki_besparelse",
      "sensor.strommaler_effekt", "sensor.ki_time_energi",
      "sensor.ki_estimert_timesforbruk",
      "sensor.outdoor_meter_temperature",
      "sensor.nettleie_elvia_kapasitetstrinn", "sensor.nettleie_elvia_margin_til_neste_trinn",
      "sensor.nettleie_elvia_toppforbruk", "sensor.nettleie_elvia_toppforbruk_2",
      "sensor.nettleie_elvia_toppforbruk_3",
      "sensor.ki_vvb_legionella_status", "sensor.ki_vvb_dager_siden_siste_syklus",
      "sensor.varmtvannsbereder_power", "switch.varmtvannsbereder",
      "binary_sensor.ki_vvb_oppvarming_aktiv", "binary_sensor.ki_vvb_legionella_ok",
      "input_boolean.ki_vvb_tvungen_syklus_aktiv", "input_boolean.ki_vvb_kritisk_varslet",
      "input_boolean.ki_vvb_prisstyring", "input_boolean.ki_vvb_alltid_pa",
      "binary_sensor.ki_vvb_billig_time_na", "binary_sensor.ki_vvb_boost_aktiv",
      "binary_sensor.ki_vvb_mettet", "binary_sensor.ki_vvb_i_vindu",
      "binary_sensor.ki_vvb_ferdig_i_vinduet", "binary_sensor.ki_vvb_ingen_respons",
      "binary_sensor.ki_vvb_legionella_forfalt", "sensor.ki_vvb_oppvarming_minutter",
      "input_boolean.ki_vvb_har_trukket_effekt", "input_boolean.ki_vvb_folg_spotpris",
      "input_datetime.ki_vvb_siste_godkjente_syklus",
      "binary_sensor.ki_vvb_bor_varme", "sensor.ki_vvb_forklaring",
      "sensor.ki_vvb_billige_timer",
      "input_boolean.ki_energi_hovedbryter", "input_boolean.ki_skyggemodus",
      "sensor.ki_overgang_klar",
      "input_boolean.ki_hjemkomst_aktiv", "input_datetime.ki_hjemkomst_planlagt",
      "input_boolean.ki_nattsenk_aktiv", "input_boolean.ki_sommer_auto", "input_boolean.ki_helg_auto",
      "input_boolean.ki_vvb_legionella_aktiv", "input_number.ki_stat_spart_kr",
      "input_number.ki_stat_komfortavvik", "input_number.ki_trinn_kostnad_diff",
      "input_number.ki_helg_auto_timer", "input_number.ki_sommer_start_maned",
      "input_number.ki_sommer_slutt_maned", "input_number.ki_sommer_ute_grense",
      "input_number.ki_gardin_ute_grense", "input_number.ki_temp_helg_bad",
      "input_datetime.ki_hjemkomst_tid", "input_datetime.ki_cybele_borte_fra",
      "input_datetime.ki_cybele_borte_til", "input_boolean.ki_helgemodus",
      "input_boolean.ki_sommermodus", "input_boolean.ki_sebastian_ferie",
      "input_boolean.ki_helg_senk_gulvvarme", "binary_sensor.ki_alle_borte",
      "input_boolean.ki_dynamisk_grense", "input_boolean.ki_prediktiv_forvarming",
      "input_boolean.ki_laering_tau", "input_boolean.ki_solkompensasjon",
      "input_boolean.ki_nattsenk_okonomi", "input_boolean.ki_energi_varsler",
      "input_boolean.ki_styr_gardiner", "input_boolean.ki_styr_hanklevarmer",
      "switch.hanklevarmer", "sensor.hanklevarmer_power",
      "input_number.ki_maks_time_kwh", "input_number.ki_mal_snitt_kwh",
      "input_number.ki_min_time_kwh", "input_number.ki_reserve_uregulert_kwh",
      "input_number.ki_komfort_vekt", "input_number.ki_shed_gulv_maks",
      "input_number.ki_shed_panel_maks", "input_number.ki_natt_senk_ute_grense",
      "input_number.ki_stue_reduksjon", "input_number.ki_stat_unngatte_topper",
      "input_number.ki_stat_shed_hendelser", "input_number.ki_stat_flyttet_kwh",
      "sensor.ki_bereder", "sensor.ki_hanklevarmer", "sensor.ki_gardiner", "sensor.ki_vvb_billige_timer",
      "input_number.ki_gardin_slutt_maned", "input_datetime.ki_gardin_apne_tidligst", "input_datetime.ki_gardin_lukk_senest",
      "sensor.ki_nettleie", "input_text.ki_tariff_tabell", "input_number.ki_mal_trinn_kw", "input_number.ki_reserve_topp_kwh",
      "input_boolean.ki_tillat_dyrere_trinn",
      "input_boolean.ki_elbil_natt", "input_number.ki_elbil_effekt_kw", "input_datetime.ki_elbil_fra", "input_datetime.ki_elbil_til",
      "input_boolean.ki_vindu_stopp", "input_number.ki_vindu_forsinkelse_min", "input_number.ki_vindu_temp",
      "input_boolean.ki_helg_spor_torsdag", "input_boolean.ki_helg_spor_fredag",
      "input_boolean.ki_varsel_effekt", "input_boolean.ki_varsel_helg", "input_boolean.ki_varsel_hjemkomst",
      "input_boolean.ki_varsel_sommer", "input_boolean.ki_varsel_vvb", "input_boolean.ki_varsel_hanklevarmer",
      "input_datetime.ki_tid_dag_start", "input_datetime.ki_tid_natt_start",
      "input_datetime.ki_cybele_dag", "input_datetime.ki_cybele_natt",
      "input_datetime.ki_sebastian_vekking", "input_datetime.ki_sebastian_vekking_helg",
      "input_datetime.ki_sebastian_natt", "input_datetime.ki_stue_reduksjon_fra",
      "input_number.ki_sone_gul", "input_number.ki_sone_oransje", "input_number.ki_sone_rod",
      "input_number.ki_reserve_frokost_kwh", "input_number.ki_reserve_middag_kwh",
      "input_number.ki_gardin_start_maned",
      "input_number.ki_gardin_slutt_maned", "input_number.ki_hanklevarmer_maks_pa_tid",
      "input_number.ki_vvb_metning_terskel_w", "input_number.ki_vvb_maks_min_uten_effekt",
      "input_number.ki_vvb_maks_oppvarming_min", "input_number.ki_vvb_maks_dager",
      "input_number.ki_vvb_intervall_dager", "input_number.vvb_billigste_timer_dogn",
      "input_datetime.ki_vvb_vindu_start", "input_datetime.ki_vvb_klar_innen",
      "input_number.ki_vvb_effekt_kw", "input_number.ki_vvb_boost_minutter",
      "input_number.ki_temp_helg", "input_number.ki_temp_helg_gulvvarme",
      "input_number.ki_temp_sommer",
      "input_datetime.ki_frokost_start", "input_datetime.ki_frokost_slutt",
      "input_datetime.ki_middag_start", "input_datetime.ki_middag_slutt",
      "input_datetime.ki_helg_varsel_tid", "input_datetime.ki_helg_varsel_tid_torsdag", "input_datetime.ki_helg_sporsmal_tid",
      "input_datetime.ki_helg_frist_tid",
      "input_datetime.ki_hanklevarmer_morgen_start", "input_datetime.ki_hanklevarmer_morgen_slutt",
      "input_datetime.ki_hanklevarmer_kveld_start", "input_datetime.ki_hanklevarmer_kveld_slutt",
      "sensor.strommaler_imported_energy", "sensor.ki_beslutningslogg",
      "input_boolean.ki_helg_venter_svar",
    ]);
    TIMESMALER_KANDIDATER.forEach((id) => this._fulgt.add(id));
    Object.values(SONE_STYR).forEach((n) => this._fulgt.add(`input_boolean.${n}`));
    Object.values(SONE_HELPERE).flat().forEach(([n]) => this._fulgt.add(`input_number.${n}`));

    this.shadowRoot.innerHTML = `<style>${KiKlimaProCard.stil}</style>
      <ha-card><div class="wrap">
        ${this._config.title ? `<div class="tittel">${esc(this._config.title)}</div>` : ""}
        <div id="hero"></div>
        <div class="faner">${FANER.map((f) => `
          <div class="fane" data-handling="fane" data-fane="${f.id}">
            <ha-icon icon="${f.icon}"></ha-icon><span>${f.navn}</span>
          </div>`).join("")}</div>
        <div id="innhold"></div>
      </div></ha-card>`;

    this._rot = this.shadowRoot;
    this._rot.addEventListener("click", (e) => this._klikk(e));
    this._rot.addEventListener("change", (e) => this._endre(e));
    this._rot.addEventListener("focusout", () => {
      if (this._ventTegn) { this._ventTegn = false; setTimeout(() => this._tegn(), 250); }
    });
    this._bygd = true;
  }

  /* ------------------------------------------------------------ */

  _tegn() {
    if (!this._hass || !this._bygd) return;
    this._rot.querySelectorAll(".fane").forEach((el) => el.classList.toggle("aktiv", el.dataset.fane === this._fane));
    this._tegnHero();
    const ut = { oversikt: "_oversikt", soner: "_soner", energi: "_energi",
                 varmtvann: "_varmtvann", tanker: "_tanker", oppsett: "_oppsett",
                 avansert: "_avansert" }[this._fane];
    this._rot.getElementById("innhold").innerHTML = this[ut]();
    this._rot.querySelectorAll(".hode > span:first-child").forEach((sp) => {
      if (sp.querySelector("ha-icon")) return;
      const tittel = (sp.childNodes[0] && sp.childNodes[0].textContent || "").trim();
      const ikon = HODE_IKON[tittel];
      if (ikon) sp.insertAdjacentHTML("afterbegin", `<ha-icon class="hodeikon" icon="${ikon}"></ha-icon>`);
    });
    // Sammenleggbare blokker: alle faner unntatt Oversikt. Husker posisjonen per overskrift.
    if (this._fane !== "oversikt") {
      this._rot.querySelectorAll("#innhold .blokk").forEach((bl) => {
        const hode = bl.querySelector(":scope > .hode");
        if (!hode || hode.dataset.handling) return;
        const sp = hode.querySelector("span:first-child");
        const id = this._fane + ":" + ((sp && sp.textContent) || "").replace(/\?/g, "").trim();
        hode.dataset.handling = "kollaps"; hode.dataset.id = id;
        hode.insertAdjacentHTML("beforeend", `<ha-icon class="kollapsikon" icon="mdi:chevron-down"></ha-icon>`);
        if (this._kollaps[id] === false) bl.classList.add("lukket");
      });
    }
    if (["oversikt", "energi", "soner"].includes(this._fane)) this._hentHistorikk();
  }

  get _hytte() { return this._a("sensor.ki_energi_status", "hustype", "bolig") === "fritidsbolig"; }
  _l(tekst) {
    // Etiketter som betyr noe annet på hytta
    if (!this._hytte) return tekst;
    return ({ "Helgemodus": "Tom hytte (frostsikring)", "Hjemkomst": "Ankomst", "Start hjemkomst": "Start ankomst",
              "Avslutt hjemkomst": "Avslutt ankomst", "Forventet hjemkomst": "Ankomst fredag kl.", "Helgetemperatur": "Frosttemperatur",
              "Helg gulvvarme": "Frost gulvvarme", "Helg bad": "Frost bad", "Helg automatisk ved fravær": "Frostsikring når hytta er tom",
              "Torsdag/fredag etter lengre fravær": "Uansett ukedag, etter «Helg auto etter»-timer",
              "Helg senk gulvvarme": "Frost senk gulvvarme", "Alle borte": "Hytta tom" })[tekst] || tekst;
  }

  _tegnHero() {
    const sone = this._s("sensor.ki_energi_status", "ukjent");
    const forklaring = this._a("sensor.ki_energi_status", "forklaring", "Venter på motoren …");
    const skygge = this._a("sensor.ki_energi_status", "skyggemodus", false);
    const forbrukt = Number(this._a("sensor.ki_energi_status", "forbrukt_kwh", NaN));
    const grense = Number(this._a("sensor.ki_energi_status", "grense_kwh", NaN));
    const pct = isFinite(forbrukt) && isFinite(grense) && grense > 0
      ? Math.max(0, Math.min(100, (forbrukt / grense) * 100)) : 0;
    const o = 2 * Math.PI * 43;
    const ute = this._n("sensor.outdoor_meter_temperature");

    this._rot.getElementById("hero").innerHTML = `
      <div class="hero" data-sone="${esc(sone)}">
        <div class="ring" data-handling="mer" data-entity="sensor.ki_energi_status">
          <svg viewBox="0 0 100 100">
            <circle class="spor" cx="50" cy="50" r="43"></circle>
            <circle class="fyll" cx="50" cy="50" r="43"
              style="stroke-dasharray:${o};stroke-dashoffset:${o * (1 - pct / 100)}"></circle>
          </svg>
          <div class="ringtall">${Math.round(pct)}<span>%</span></div>
        </div>
        <div class="herotekst">
          <div class="heronavn">${esc(SONE_TEKST[sone] || sone)}
            ${skygge ? '<span class="merke">skygge</span>' : ""}${this._hytte ? '<span class="merke">hytte</span>' : ""}</div>
          <div class="heroforklaring">${esc(forklaring)}</div>
          <div class="herolinje">
            <span>${esc(this._s("sensor.ki_klima_status", "Klima ukjent"))}</span>
            ${isFinite(ute) ? `<span><ha-icon icon="mdi:thermometer"></ha-icon>${nf(ute, 1)}°</span>` : ""}
          </div>
        </div>
        <div class="heroknapp" data-handling="hero" title="${this._heroApen ? "Skjul" : "Slik tenker motoren"}"><ha-icon icon="${this._heroApen ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></div>
        ${this._heroApen ? this._heroDetaljer() : ""}
      </div>`;
  }

  // Hurtigknapper: «leggetid» per soverom. Sover-profiler først, så resten.
  _leggetidBlokk() {
    const laster = (this._a("sensor.ki_laster", "laster", []) || []).filter((l) => l.profil === "sebastian" || l.profil === "cybele");
    if (!laster.length) return "";
    const sortert = [...laster].sort((x, y) => String(x.navn).localeCompare(String(y.navn)));
    const aktive = sortert.filter((l) => l.leggetid);
    return `
      <div class="blokk">
        <div class="hode"><span>Leggetid${this._hj("leggetid")}</span><span class="sub">${aktive.length ? aktive.map((l) => esc(l.navn)).join(", ") + " senket" : "Trykk når noen legger seg"}</span></div>
        ${this._hjTekst("leggetid")}
        <div class="hurtig">
          ${sortert.map((l) => `<div class="mini ${l.leggetid ? "aktiv" : ""}" data-handling="leggetid" data-key="${esc(l.key)}" data-avbryt="${l.leggetid ? 1 : 0}">
            <ha-icon icon="${l.leggetid ? "mdi:weather-sunny" : "mdi:bed"}"></ha-icon>${esc(l.navn)}${l.leggetid ? " · avbryt" : ""}</div>`).join("")}
        </div>
      </div>`;
  }

  _heroDetaljer() {
    const a = (n, d) => this._a("sensor.ki_energi_status", n, d);
    const tanker = a("tankegang", []) || [];
    const laster = this._a("sensor.ki_laster", "laster", []) || [];
    const senket = laster.filter((l) => l.handling === "senket");
    const ov = laster.filter((l) => l.overstyrt);
    const moduser = [
      ["input_boolean.ki_helgemodus", "Helg"], ["input_boolean.ki_sommermodus", "Sommer"],
      ["input_boolean.ki_hjemkomst_aktiv", "Hjemkomst"], ["input_boolean.ki_skyggemodus", "Skygge"],
      ["binary_sensor.ki_alle_borte", "Alle borte"], ["input_boolean.ki_sebastian_ferie", "Ferie"],
    ].filter(([id]) => this._pa(id)).map(([, n]) => n);
    const prog = (n) => nf(Number(this._a("sensor.ki_prognose", n, NaN)), 1);
    const vvb = this._s("sensor.ki_bereder", "–");
    const gard = this._st("sensor.ki_gardiner");
    const hank = this._s("sensor.ki_hanklevarmer", "");
    const min = Number(a("minutter_igjen", NaN));
    return `
      <div class="herodetaljer">
        <div class="undertittel">Slik tenker motoren nå</div>
        ${tanker.length ? tanker.map((t) => `<div class="tanke">${esc(t)}</div>`).join("")
          : `<div class="tanke">${esc(a("forklaring", "Venter på motoren …"))}</div>`}
        <div class="undertittel" style="padding-top:12px">Sammendrag</div>
        <div class="fakta">
          <span><ha-icon icon="mdi:timer-sand"></ha-icon>${isFinite(min) ? min + " min igjen av timen" : "–"}</span>
          <span><ha-icon icon="mdi:flash"></ha-icon>${nf(Number(a("forbrukt_kwh", NaN)), 2)} / ${nf(Number(a("grense_kwh", NaN)), 2)} kWh</span>
          <span><ha-icon icon="mdi:chart-timeline-variant"></ha-icon>${prog("om_15_min_kw")} → ${prog("om_60_min_kw")} kW</span>
          <span><ha-icon icon="mdi:home-thermometer"></ha-icon>${senket.length ? senket.length + " sone" + (senket.length > 1 ? "r" : "") + " senket" : "ingen senket"}</span>
          ${laster.filter((l) => l.handling === "vindu").map((l) => `<span class="badge b-feil"><ha-icon icon="mdi:window-open-variant"></ha-icon>${esc(l.navn)}: ${esc(l.vindu_navn || "vindu åpent")}</span>`).join("")}
          ${ov.length ? `<span><ha-icon icon="mdi:hand-back-right"></ha-icon>${ov.length} overstyrt</span>` : ""}
          <span><ha-icon icon="mdi:water-boiler"></ha-icon>${esc(vvb)}</span>
          ${hank ? `<span><ha-icon icon="mdi:radiator"></ha-icon>Håndklevarmer ${hank === "pa" ? "på" : "av"}</span>` : ""}
          ${gard && gard.state !== "ikke_konfigurert" ? `<span><ha-icon icon="mdi:curtains"></ha-icon>Gardiner ${esc(gard.state === "av" ? "manuelt" : gard.state)}</span>` : ""}
          ${moduser.length ? `<span><ha-icon icon="mdi:tune-variant"></ha-icon>${moduser.join(" · ")}</span>` : ""}
        </div>
        ${senket.length ? `<div class="fakta" style="padding-top:2px">${senket.map((l) => `<span class="badge b-advarsel">${esc(l.navn)} ${l.settpunkt != null ? nf(l.settpunkt, 1) + "°" : ""}</span>`).join("")}</div>` : ""}
      </div>`;
  }

  /* ---------------------------- Oversikt ---------------------- */

  _oversikt() {
    const a = (n, d) => this._a("sensor.ki_energi_status", n, d);
    const modus = [
      ["input_boolean.ki_helgemodus", this._l("Helgemodus"), "mdi:bag-suitcase", true],
      ["input_boolean.ki_sommermodus", "Sommermodus", "mdi:white-balance-sunny", true],
      ["input_boolean.ki_hjemkomst_aktiv", this._l("Hjemkomst"), "mdi:home-import-outline", true],
      ["input_boolean.ki_sebastian_ferie", "Ferie", "mdi:school-outline", true],
      ["binary_sensor.ki_alle_borte", "Alle borte", "mdi:home-export-outline", false],
    ];
    const prog = (n) => nf(Number(this._a("sensor.ki_prognose", n, NaN)), 1);
    const progTekst = this._a("sensor.ki_prognose", "forklaring", "");
    const senkede = (this._a("sensor.ki_laster", "laster", []) || [])
      .filter((l) => l.handling === "senket");

    return `
      ${this._overtakelse(true)}
      ${this._leggetidBlokk()}
      ${this._budsjettBlokk(a)}
      <div class="blokk">
        <div class="hode"><span>Forventet effekt</span><span class="sub">Uregulert + varmtvann + planlagt varme</span></div>
        <div class="tallrad fire">
          <div class="tall"><b>${prog("om_15_min_kw")}</b><span>kW om 15 min</span></div>
          <div class="tall"><b>${prog("om_30_min_kw")}</b><span>kW om 30 min</span></div>
          <div class="tall"><b>${prog("om_60_min_kw")}</b><span>kW om 1 t</span></div>
          <div class="tall"><b>${prog("om_120_min_kw")}</b><span>kW om 2 t</span></div>
        </div>
        ${progTekst ? `<div class="notat">${esc(progTekst)}</div>` : ""}
      </div>
      <div class="blokk">
        <div class="hode"><span>Siste 12 timer</span><span class="sub">Forbruk per time mot grensen</span></div>
        <div id="graf-time" class="graf">${this._grafPlassholder()}</div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Modus</span></div>
        <div class="rutenett">${modus.map(([id, navn, ikon, kanSlas]) => {
          const på = this._pa(id);
          return `<div class="chip ${på ? "pa" : ""} ${this._st(id) ? "" : "mangler"}"
            data-handling="${kanSlas ? "veksle" : "mer"}" data-entity="${id}">
            <div class="chipikon"><ha-icon icon="${ikon}"></ha-icon></div>
            <div><div class="chipnavn">${navn}</div><div class="chipsub">${på ? "På" : "Av"}</div></div>
          </div>`;
        }).join("")}</div>
      </div>
      ${senkede.length ? `
      <div class="blokk">
        <div class="hode"><span>Tiltak akkurat nå</span><span class="sub">${senkede.length} sone(r) senket</span></div>
        ${senkede.map((l) => `<div class="rad rad-les">
          <div class="prikk p-advarsel"></div>
          <div class="radtekst"><div class="radnavn">${esc(l.navn)}</div>
            <div class="radsub">${esc(l.forklaring || "")}</div></div>
          <div class="radverdi">${nf(l.settpunkt, 1)}°</div></div>`).join("")}
      </div>` : ""}
      ${this._vvbKort(true)}`;
  }

  _overtakelse(kompakt) {
    const skygge = this._pa("input_boolean.ki_skyggemodus");
    const motorPa = this._pa("input_boolean.ki_energi_hovedbryter");
    const styrer = motorPa && !skygge;
    const klar = this._s("sensor.ki_overgang_klar", "ukjent");
    const hindringer = this._a("sensor.ki_overgang_klar", "hindringer", []) || [];
    const finnes = !!this._st("input_boolean.ki_skyggemodus");
    const klasse = klar === "Klar" ? "ok" : klar === "Lærer fortsatt" ? "advarsel" : "feil";
    const modus = this._a("sensor.ki_energi_status", "modus", this._s("sensor.ki_klima_status", ""));

    return `
      <div class="blokk">
        <div class="hode"><span>Hvem styrer ovnene</span>
          <span class="sub">${styrer ? "Energimotoren" : skygge ? "Skyggemodus" : "Av"} · ${esc(modus)}</span></div>
        <div class="rad">
          <div class="prikk p-${styrer ? "ok" : "noytral"}"></div>
          <div class="radtekst">
            <div class="radnavn">Motoren styrer ovnene${finnes ? "" : ' <span class="merke">mangler</span>'}${this._hj("overtakelse")}</div>
            <div class="radsub">${styrer
              ? "Skriver settpunkt til alle soner som står på «KI styrer»."
              : "Regner og logger, men rører ingen ovner. Slå av skyggemodus for å la den styre."}</div>
          </div>
          <div class="bryter ${styrer ? "on" : ""} ${finnes ? "" : "mangler"}"
               data-handling="veksle" data-entity="input_boolean.ki_skyggemodus"><span></span></div>
        </div>
        ${this._hjTekst("overtakelse")}
        ${!kompakt || !styrer ? `
        <div class="rad rad-les" data-handling="mer" data-entity="sensor.ki_overgang_klar">
          <div class="prikk p-${klasse}"></div>
          <div class="radtekst"><div class="radnavn">Beredskap: ${esc(klar)}${this._hj("beredskap")}</div>
            <div class="radsub">${hindringer.length
              ? hindringer.length + " ting å være klar over"
              : "Ingenting i veien"}</div></div>
        </div>
        ${this._hjTekst("beredskap")}` : ""}
        ${hindringer.length && !kompakt ? `<ul class="tiltak">${
          hindringer.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${!motorPa ? `<div class="varsel">Energimotoren er slått av under Oppsett. Ingenting styres.</div>` : ""}
      </div>`;
  }

  _budsjettBlokk(a) {
    const igjen = Number(a("igjen_kwh", NaN));
    const tillatt = Number(a("tillatt_effekt_kw", NaN));
    const forventet = Number(a("forventet_effekt_kw", NaN));
    const min = a("minutter_igjen", "–");
    const uregulert = Number(a("uregulert_kw", NaN));
    const vvb = Number(a("vvb_reservert_kw", NaN));
    const ledig = Number(a("ledig_kw", NaN));
    const kilde = a("malekilde", "");
    const bredde = isFinite(forventet) && isFinite(tillatt) && tillatt > 0
      ? Math.max(0, Math.min(100, (forventet / tillatt) * 100)) : 0;
    return `
      <div class="blokk">
        <div class="hode"><span>Timebudsjett${this._hj("tillatt_effekt")}</span><span class="sub">${min} min igjen${kilde ? " · " + esc(kilde) : ""}</span></div>
        ${this._hjTekst("tillatt_effekt")}
        <div class="tallrad">
          <div class="tall"><b>${nf(igjen, 2)}</b><span>kWh igjen</span></div>
          <div class="tall"><b>${nf(tillatt, 2)}</b><span>kW tillatt</span></div>
          <div class="tall"><b>${nf(forventet, 2)}</b><span>kW forventet</span></div>
        </div>
        <div class="spor2"><div class="fyll2" style="width:${bredde}%"></div></div>
        <div class="under">
          <span>Uregulert ${nf(uregulert, 2)} kW${this._hj("uregulert")} · varmtvann ${nf(vvb, 2)} kW</span>
          <span>${isFinite(ledig) ? nf(ledig, 2) + " kW ledig" : ""}</span>
        </div>
        ${this._hjTekst("uregulert")}
        ${this._a("sensor.ki_energi_status", "tak_aktivt", false)
          ? `<div class="notat">Regnestykket ga høyere tillatt effekt enn timegrensen,
             fordi det er få minutter igjen av timen. Verdien er derfor kuttet ned til
             grensen — ovnene rekker ikke å nyttiggjøre seg en kortvarig topp uten at
             varmen renner over i neste time.</div>` : ""}
      </div>`;
  }

  /* ---------------------------- Soner ------------------------- */

  _soner() {
    const laster = (this._a("sensor.ki_laster", "laster", []) || []).filter((l) => l.type !== "bryter");
    if (!laster.length) return `<div class="blokk"><div class="notat">Motoren har ikke rapportert soner ennå.</div></div>`;

    return `<div class="blokk">
      <div class="hode"><span>Soner</span><span class="sub">Trykk for settpunkt og overstyring</span></div>
      ${laster.map((l) => {
        const h = HANDLING[l.handling] || { tekst: l.handling, k: "noytral" };
        const apen = this._apne.has(l.key);
        const styr = l.styr || (SONE_STYR[l.key] ? `input_boolean.${SONE_STYR[l.key]}` : null);
        const på = styr ? this._pa(styr) : false;
        const felt = (l.helpere && l.helpere.length) ? l.helpere : (SONE_HELPERE[l.key] || []);
        const ovVerdi = this._ov[l.key] !== undefined ? this._ov[l.key] : (l.mal ?? 21);
        return `
        <div class="sone ${apen ? "apen" : ""}">
          <div class="sonehode" data-handling="apne" data-key="${esc(l.key)}">
            <div class="prikk p-${h.k}"></div>
            <div class="radtekst">
              <div class="radnavn">${esc(l.navn)}${l.overstyrt ? ' <span class="merke">manuell</span>' : ""}</div>
              <div class="radsub">${esc(l.forklaring || "")}</div>
            </div>
            <div class="sonetemp">
              <b>${l.naa !== null && l.naa !== undefined ? nf(l.naa, 1) + "°" : "–"}</b>
              <span>mål ${l.settpunkt ?? l.mal ?? "–"}°</span>
            </div>
          </div>
          <div class="sonekropp">
            <div class="fakta">
              <span class="badge b-${h.k}">${esc(h.tekst)}</span>
              <span>Prioritet ${l.prio}</span><span>${esc(l.type)}</span>
              <span>plan ${nf(l.effekt, 2)} kW</span>
            </div>
            ${apen ? this._soneDetaljer(l) : ""}
            ${styr ? `<div class="rad">
              <div class="radtekst"><div class="radnavn">KI styrer sonen</div>
                <div class="radsub">Av = motoren rører den ikke</div></div>
              <div class="bryter ${på ? "on" : ""}" data-handling="veksle" data-entity="${styr}"><span></span></div>
            </div>` : ""}
            ${felt.map(([n, navn]) => this._stepperRad(`input_number.${n}`, navn, 1, " °C")).join("")}
            <div class="ovblokk">
              <div class="undertittel">Overstyr midlertidig</div>
              <div class="ovrad">
                <div class="steg" data-handling="ov" data-key="${esc(l.key)}" data-dir="-1">−</div>
                <div class="ovverdi">${nf(ovVerdi, 1)}</div>
                <div class="steg" data-handling="ov" data-key="${esc(l.key)}" data-dir="1">+</div>
                <div class="knapp" data-handling="ovsett" data-key="${esc(l.key)}" data-min="120">2 t</div>
                <div class="knapp" data-handling="ovsett" data-key="${esc(l.key)}" data-min="360">6 t</div>
                ${l.overstyrt ? `<div class="knapp rod" data-handling="ovfjern" data-key="${esc(l.key)}">Fjern</div>` : ""}
              </div>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  // Live effekt/temperatur for sonen, og en liten historikkgraf i en underseksjon.
  _soneDetaljer(l) {
    const ents = l.entiteter || [];
    const eff = ents.filter((e) => e.startsWith("sensor.") && /power|effekt|_w$/i.test(e));
    const clim = ents.filter((e) => e.startsWith("climate."));
    const tempEnt = ents.find((e) => e.startsWith("sensor.") && /temp/i.test(e)) || null;
    const effW = eff.reduce((s, e) => { const v = this._n(e); return isFinite(v) ? s + v : s; }, 0);
    const temp = tempEnt ? this._n(tempEnt) : (clim.length ? Number(this._a(clim[0], "current_temperature", NaN)) : NaN);
    const sett = clim.length ? Number(this._a(clim[0], "temperature", NaN)) : NaN;
    const id = "sone:" + l.key;
    this._soneGrafer = this._soneGrafer || {};
    this._soneGrafer[l.key] = { eff, temp: tempEnt || clim[0] || null };
    return `
      <div class="tallrad" style="margin:6px 0 8px">
        <div class="tall"><b>${eff.length ? nf(effW, 0) : "–"}</b><span>W nå${eff.length > 1 ? " (" + eff.length + " ovner)" : ""}</span></div>
        <div class="tall"><b>${isFinite(temp) ? nf(temp, 1) + "°" : "–"}</b><span>rom</span></div>
        <div class="tall"><b>${isFinite(sett) ? nf(sett, 1) + "°" : "–"}</b><span>settpunkt${clim.length > 1 ? " (" + clim.length + ")" : ""}</span></div>
      </div>
      ${this._sub(id, "Siste 6 timer", `<div id="graf-sone-${esc(l.key)}" class="graf">${this._grafPlassholder()}</div>
        <div class="tegnforklaring"><span><i class="l1"></i>Effekt (W)</span><span><i class="l2"></i>Temperatur (°C)</span></div>`)}`;
  }

  // Tallfelt som rullevelger (native <select>: hjul på iPhone/Android, nedtrekk på desktop).
  _stepperRad(entity, navn, dec, enhet) {
    const st = this._st(entity);
    const a = st ? st.attributes : {};
    const steg = Number(a.step ?? (dec === 0 ? 1 : dec === 1 ? 0.5 : 0.05));
    const min = Number(a.min ?? 0), maks = Number(a.max ?? 100);
    const naa = st ? Number(st.state) : NaN;
    const desimaler = Math.max(dec, steg < 1 ? String(steg).split(".")[1]?.length || 0 : 0);
    const valg = [];
    const antall = Math.min(2000, Math.round((maks - min) / steg));
    let harNaa = false;
    for (let i = 0; i <= antall; i++) {
      const v = Number((min + i * steg).toFixed(6));
      if (isFinite(naa) && Math.abs(v - naa) < steg / 2) harNaa = true;
      valg.push(`<option value="${v}" ${isFinite(naa) && Math.abs(v - naa) < steg / 2 ? "selected" : ""}>${nf(v, desimaler)}${enhet}</option>`);
    }
    if (isFinite(naa) && !harNaa) valg.unshift(`<option value="${naa}" selected>${nf(naa, desimaler)}${enhet}</option>`);
    return `<div class="rad kompakt">
      <div class="radtekst"><div class="radnavn">${esc(navn)}</div></div>
      <select class="velger ${st ? "" : "mangler"}" data-entity="${entity}">${valg.join("")}</select>
    </div>`;
  }

  // Klokkeslett med av/på-bryter i samme rad.
  _tidBryterRad(tidEntity, bryterEntity, navn) {
    const st = this._st(tidEntity);
    const pa = this._pa(bryterEntity);
    return `<div class="rad">
      <div class="radtekst"><div class="radnavn">${esc(navn)}</div></div>
      <input class="tid ${pa ? "" : "dempet"}" type="time" data-entity="${tidEntity}" value="${st ? String(st.state).slice(0, 5) : ""}">
      <div class="bryter ${pa ? "on" : ""}" data-handling="veksle" data-entity="${bryterEntity}"><span></span></div>
    </div>`;
  }

  // To klokkeslett i én kompakt rad: «Dag 06:30 · Natt 22:30».
  _tidPar(navnA, idA, navnB, idB) {
    const v = (id) => { const st = this._st(id); return st ? String(st.state).slice(0, 5) : ""; };
    return `<div class="rad tidpar">
      <label><span>${esc(navnA)}</span><input class="tid" type="time" data-entity="${idA}" value="${v(idA)}"></label>
      <label><span>${esc(navnB)}</span><input class="tid" type="time" data-entity="${idB}" value="${v(idB)}"></label>
    </div>`;
  }

  _tidKort(id) { const st = this._st(id); return st ? String(st.state).slice(0, 5) : "–"; }

  _tidRad(entity, navn) {
    const st = this._st(entity);
    return `<div class="rad">
      <div class="radtekst"><div class="radnavn">${esc(navn)}</div></div>
      <input class="tid" type="time" data-entity="${entity}" value="${st ? String(st.state).slice(0, 5) : ""}">
    </div>`;
  }

  /* ---------------------------- Energi ------------------------ */

  _energi() {
    const grunn = this._a("sensor.ki_energi_status", "grense_grunn", "");
    const grense = Number(this._a("sensor.ki_energi_status", "grense_kwh", NaN));
    const N = (k, d) => this._a("sensor.ki_nettleie", k, d);
    const kr = (v) => (v == null ? "ukjent" : nf(v, 0) + " kr");
    const datoKort = (d) => (d ? d.slice(8, 10) + "." + d.slice(5, 7) + "." : "ukjent dato");
    const toppRad = (t) => `<div class="rad rad-les">
        <div class="prikk p-${t.prognose ? "advarsel" : t.kilde === "ekstern" ? "noytral" : "ok"}"></div>
        <div class="radtekst"><div class="radnavn">${datoKort(t.dato)}${t.prognose ? ' <span class="merke">prognose</span>' : ""}${t.kilde === "ekstern" ? ' <span class="merke">ekstern</span>' : ""}</div>
          <div class="radsub">${t.time ? "kl. " + t.time + ":00 · " : ""}${esc(t.kvalitet || "")}</div></div>
        <div class="radverdi kort">${nf(t.kwh, 2)} kWh</div></div>`;
    const kv = N("datakvalitet", "");
    const kvK = kv === "god" ? "ok" : kv === "delvis" ? "advarsel" : "feil";
    const nettleie = this._st("sensor.ki_nettleie") ? `
      <div class="blokk">
        <div class="hode"><span>Dynamisk grense${this._hj("dynamisk_grense")}</span>
          <span class="sub">${kr(N("registrert_trinn_kr", null))}/mnd${N("registrert_trinn_til", null) ? " · neste trinn ved " + nf(N("registrert_trinn_til"), 0) + " kW" : ""}</span></div>
        ${this._hjTekst("dynamisk_grense")}
        <div class="stor">${nf(grense, 2)} <small>kWh denne timen</small></div>
        <div class="konklusjon">${esc(N("hvorfor", grunn))}</div>
        <div class="tallrad">
          <div class="tall"><b>${N("dagens_maks_kwh", null) != null ? nf(N("dagens_maks_kwh"), 2) : "–"}</b><span>døgnmaks i dag${N("dagens_maks_time", null) ? " kl. " + N("dagens_maks_time") : ""}</span></div>
          <div class="tall"><b>${N("registrert_snitt", null) != null ? nf(N("registrert_snitt"), 2) : "–"}</b><span>snitt topp 3 (registrert)</span></div>
          <div class="tall"><b>${N("forventet_time_kwh", null) != null ? nf(N("forventet_time_kwh"), 2) : "–"}</b><span>forventet denne timen</span></div>
        </div>
        <div class="fakta" style="padding:8px 0 4px">
          <span class="badge b-${kvK}">data ${esc(kv || "–")}</span>
          <span>reserve ${nf(N("reserve_kwh", 0), 2)} kWh</span>
          <span>${N("dager_igjen", "–")} dager igjen</span>
          ${N("mal_tapt", false) ? '<span class="badge b-advarsel">mål passert</span>' : ""}
          ${N("tariff_ukjent", false) ? '<span class="badge b-feil">tariff ukjent</span>' : ""}
          ${N("tillat_dyrere_trinn", false) ? '<span class="badge b-advarsel">dyrere trinn tillatt</span>' : ""}
        </div>
        ${this._sub("energi:topp3", "Topp tre denne måneden", `
          ${this._dognGraf()}
          <div class="undertittel" style="padding-top:8px">Registrert</div>
          ${(N("topp_tre", []) || []).map(toppRad).join("") || '<div class="notat">Ingen fullførte dager ennå.</div>'}
          ${N("forventet_topp_tre", null) ? `
          <div class="undertittel" style="padding-top:10px">Hvis denne timen ender på ${nf(N("forventet_time_kwh"), 2)} kWh — prognose</div>
          ${(N("forventet_topp_tre", []) || []).map(toppRad).join("")}
          <div class="under"><span>Snitt ${nf(N("forventet_snitt", NaN), 2)} → ${kr(N("forventet_trinn_kr", null))}/mnd</span>
            <span>${N("okning_fastledd_kr", null) == null ? "økning ukjent" : N("okning_fastledd_kr") > 0 ? "+" + nf(N("okning_fastledd_kr"), 0) + " kr fastledd" : N("redusert_margin", false) ? "samme trinn, mindre rom" : N("hoyere_dognmaks", false) ? "ny døgnmaks, uendret topp 3" : "ingen endring"}</span></div>` : ""}`,
          false, `<span class="sub">${(N("topp_tre", []) || []).map((t) => nf(t.kwh, 2)).join(" / ") || "–"} kWh</span>`)}
        <div class="notat">${(N("datakvalitet_grunner", []) || []).map(esc).join(". ")}${(N("datakvalitet_grunner", []) || []).length ? ". " : ""}${(N("reserve_grunner", []) || []).map(esc).join(", ")}</div>
      </div>` : "";

    return `
      ${nettleie}
      <div class="blokk">
        <div class="hode"><span>Effekt siste 6 timer</span><span class="sub">Uregulert mot styrt</span></div>
        <div id="graf-effekt" class="graf">${this._grafPlassholder()}</div>
        <div class="tegnforklaring">
          <span><i class="l1"></i>Uregulert</span><span><i class="l2"></i>Styrt varme</span>
          <span class="live"><i class="pulser"></i>Nå ${nf(this._n("sensor.ki_uregulert_effekt") / 1000, 2)} + ${nf(this._n("sensor.ki_styrt_effekt") / 1000, 2)} kW</span>
          <span class="grafles">Dra over grafen for å lese av</span>
        </div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Grenser${this._hj("shed")}${this._hj("komfortvekt")}</span></div>
        ${this._stepperRad("input_number.ki_maks_time_kwh", "Absolutt timegrense", 2, " kWh")}
        ${this._stepperRad("input_number.ki_mal_trinn_kw", "Ønsket trinn: snitt under", 1, " kW")}
        ${this._stepperRad("input_number.ki_reserve_topp_kwh", "Reserve mot neste trinn", 2, " kWh")}
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Tillat dyrere trinn</div>
            <div class="radsub">På = komfort foran fastledd; bare den absolutte grensen gjelder</div></div>
          <div class="bryter ${this._pa("input_boolean.ki_tillat_dyrere_trinn") ? "on" : ""}" data-handling="veksle" data-entity="input_boolean.ki_tillat_dyrere_trinn"><span></span></div>
        </div>
        ${this._stepperRad("input_number.ki_min_time_kwh", "Laveste timegrense", 1, " kWh")}
        ${this._stepperRad("input_number.ki_reserve_uregulert_kwh", "Reserve uregulert", 2, " kWh")}
        ${this._stepperRad("input_number.ki_shed_gulv_maks", "Maks senking gulvvarme", 1, " °C")}
        ${this._stepperRad("input_number.ki_shed_panel_maks", "Maks senking panelovn", 1, " °C")}
        ${this._stepperRad("input_number.ki_komfort_vekt", "Komfortvekt", 0, "")}
        ${this._hjTekst("komfortvekt")}
        ${this._hjTekst("shed")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Denne måneden</span><span class="sub">Estimat, ikke måling</span></div>
        <div class="tallrad">
          <div class="tall"><b>${nf(this._n("input_number.ki_stat_unngatte_topper"), 0)}</b><span>unngåtte topper</span></div>
          <div class="tall"><b>${nf(this._n("input_number.ki_stat_shed_hendelser"), 0)}</b><span>utkoblinger</span></div>
          <div class="tall"><b>${nf(this._n("input_number.ki_stat_flyttet_kwh"), 2)}</b><span>kWh flyttet</span></div>
        </div>
        <div class="tallrad" style="margin-top:8px">
          <div class="tall"><b>${nf(this._n("sensor.ki_besparelse"), 0)}</b><span>kr spart (est.)</span></div>
          <div class="tall"><b>${nf(this._a("sensor.ki_besparelse", "spart_nettleie_kr", NaN), 0)}</b><span>kr nettleie</span></div>
          <div class="tall"><b>${nf(this._n("input_number.ki_stat_komfortavvik"), 1)}</b><span>°C·t komfortavvik</span></div>
        </div>
        <div class="under"><span>Neste trinn koster ${nf(this._a("sensor.ki_besparelse", "trinn_diff_kr", NaN), 0)} kr/mnd mer (fra tarifftabellen)</span></div>
        <div class="notat">${esc(this._a("sensor.ki_besparelse", "merknad", "Uten kontrollgruppe er «uten KI-styring» alltid et estimat."))}</div>
      </div>`;
  }

  /* ---------------------------- Varmtvann --------------------- */

  _varmtvann() {
    const u = this._underfane || "bereder";
    const faner = [["bereder", "Bereder", "mdi:water-boiler"], ["handkle", "Håndklevarmer", "mdi:radiator"]];
    return `<div class="underfaner">${faner.map(([id, navn, ikon]) => `
        <div class="underfane ${u === id ? "aktiv" : ""}" data-handling="underfane" data-id="${id}">
          <ha-icon icon="${ikon}"></ha-icon><span>${navn}</span></div>`).join("")}</div>`
      + (u === "handkle" ? this._handkleKort() : this._vvbKort(false));
  }

  _dato(iso) {
    if (!iso) return "–";
    const d = new Date(iso);
    if (isNaN(d)) return "–";
    const dag = ["søn", "man", "tir", "ons", "tor", "fre", "lør"][d.getDay()];
    const mnd = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"][d.getMonth()];
    const kl = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const i_dag = new Date(); const diff = Math.round((d - new Date(i_dag.getFullYear(), i_dag.getMonth(), i_dag.getDate())) / 86400000);
    const naar = diff === 0 ? "i dag" : diff === 1 ? "i morgen" : diff === -1 ? "i går" : `${dag} ${d.getDate()}. ${mnd}`;
    return `${naar} kl. ${kl}`;
  }

  _gardinKort() {
    const st = this._st("sensor.ki_gardiner");
    const a = (k, d) => this._a("sensor.ki_gardiner", k, d);
    const styr = this._pa("input_boolean.ki_styr_gardiner");
    const tilstand = st ? st.state : "ukjent";
    const klasse = !styr ? "noytral" : tilstand === "lukket" ? "advarsel" : tilstand === "apen" ? "ok" : "noytral";
    const navn = tilstand === "ikke_konfigurert" ? "Ingen gardin valgt" : !styr ? "KI-styring av"
      : tilstand === "lukket" ? "Lukket" : tilstand === "apen" ? "Åpen" : "Ingen styring nå";
    return `
      <div class="blokk">
        <div class="hode"><span>Gardiner stue${this._hj("gardiner")}</span>
          <span class="sub">${a("i_sesong", false) ? "Sesong " + esc(a("sesong", "")) : "Utenfor sesong"}</span></div>
        ${this._hjTekst("gardiner")}
        <div class="rad rad-les" data-handling="mer" data-entity="${esc(a("cover", "sensor.ki_gardiner") || "sensor.ki_gardiner")}">
          <div class="prikk p-${klasse}"></div>
          <div class="radtekst"><div class="radnavn">${navn}</div>
            <div class="radsub">${esc(a("forklaring", "–"))}${a("neste", "") ? " · " + esc(a("neste", "")) : ""}</div></div>
          <div class="radverdi">${esc(a("faktisk", "") || "")}</div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">KI styrer gardinene</div>
            <div class="radsub">Lukkes når sola er nede i fyringssesongen, skjermer mot sol om sommeren</div></div>
          <div class="bryter ${styr ? "on" : ""} ${this._st("input_boolean.ki_styr_gardiner") ? "" : "mangler"}"
               data-handling="veksle" data-entity="input_boolean.ki_styr_gardiner"><span></span></div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Følg sola</div>
            <div class="radsub">På = åpnes først når sola er oppe. Av = bare klokkeslettene under.</div></div>
          <div class="bryter ${this._pa("input_boolean.ki_gardin_folg_sol") ? "on" : ""}"
               data-handling="veksle" data-entity="input_boolean.ki_gardin_folg_sol"><span></span></div>
        </div>
        <div class="undertittel" style="padding-top:10px">Klokkeslett</div>
        ${this._tidRad("input_datetime.ki_gardin_apne_tidligst", "Åpne tidligst")}
        ${this._tidRad("input_datetime.ki_gardin_lukk_senest", "Lukk senest")}
        <div class="undertittel" style="padding-top:10px">Sesong</div>
        ${this._manedStripe("input_number.ki_gardin_start_maned", "input_number.ki_gardin_slutt_maned", "Gardinsesong")}
        ${this._dognplan([{ navn: "Gardiner", spenn: [["input_datetime.ki_gardin_apne_tidligst", "input_datetime.ki_gardin_lukk_senest", "dag", "Kan være åpne"]] }])}
        ${this._stepperRad("input_number.ki_gardin_start_maned", "Fra måned", 0, "")}
        ${this._stepperRad("input_number.ki_gardin_slutt_maned", "Til og med måned", 0, "")}
        ${this._stepperRad("input_number.ki_gardin_ute_grense", "Hold lukket på dagen under", 0, " °C")}
        <div class="notat">Utenfor sesongen styres gardinene bare i sommermodus (solskjerming når sola står høyt og det er over 22 °C).</div>
      </div>`;
  }

  _handkleKort() {
    const a = (k, d) => this._a("sensor.ki_hanklevarmer", k, d);
    const konfigurert = !!a("bryter", "");
    const ent = a("bryter", "switch.hanklevarmer");
    const styr = this._pa("input_boolean.ki_styr_hanklevarmer");
    const pa = this._s("sensor.ki_hanklevarmer", "av") === "pa";
    const effekt = Number(a("effekt_w", NaN));
    const maks = Number(a("maks_min", this._n("input_number.ki_hanklevarmer_maks_pa_tid")));
    const minutter = Number(a("minutter_pa", 0));
    const naerMaks = pa && isFinite(maks) && minutter > maks * 0.8;
    const iVindu = !!a("i_vindu", false);

    return `
      <div class="blokk">
        <div class="hode"><span>Håndklevarmer${this._hj("handkle")}</span>
          <span class="sub">${!konfigurert ? "Ikke satt opp" : pa ? "På" + (minutter ? " i " + minutter + " min" : "") : "Av"}</span></div>
        ${this._hjTekst("handkle")}
        <div class="rad rad-les" data-handling="mer" data-entity="${esc(ent)}">
          <div class="prikk p-${naerMaks ? "advarsel" : pa ? "ok" : "noytral"}"></div>
          <div class="radtekst">
            <div class="radnavn">${!konfigurert ? "Ingen håndklevarmer valgt" : pa ? "Varmer nå" : "Står av"}</div>
            <div class="radsub">${esc(a("forklaring", "Velg bryter under Konfigurer → Utstyr"))}</div>
          </div>
          <div class="radverdi">${isFinite(effekt) ? nf(effekt, 0) + " W" : "–"}</div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Bryteren nå</div>
            <div class="radsub">${styr ? (iVindu ? "I dusjvindu — styres av KI" : "Manuell bruk slås av etter maks på-tid") : "Slås på igjen automatisk"}</div></div>
          <div class="bryter ${pa ? "on" : ""} ${konfigurert ? "" : "mangler"}"
               data-handling="bryter" data-entity="${esc(ent)}"><span></span></div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">KI styrer håndklevarmeren</div>
            <div class="radsub">Av = står på konstant</div></div>
          <div class="bryter ${styr ? "on" : ""} ${this._st("input_boolean.ki_styr_hanklevarmer") ? "" : "mangler"}"
               data-handling="veksle" data-entity="input_boolean.ki_styr_hanklevarmer"><span></span></div>
        </div>
        ${naerMaks ? `<div class="varsel">Har stått på i ${minutter} minutter.
          Sikkerhetsavstengingen slår inn ved ${nf(maks, 0)} minutter.</div>` : ""}
      </div>
      <div class="blokk">
        <div class="hode"><span>Dusjvinduer</span><span class="sub">${esc(a("morgen", ""))} · ${esc(a("kveld", ""))}</span></div>
        ${this._dognplan([
          { navn: "Håndklevarmer", spenn: [["input_datetime.ki_hanklevarmer_morgen_start", "input_datetime.ki_hanklevarmer_morgen_slutt", "ok", "Morgen"],
                                          ["input_datetime.ki_hanklevarmer_kveld_start", "input_datetime.ki_hanklevarmer_kveld_slutt", "ok", "Kveld"]] },
        ])}
        <div class="undertittel">Morgen</div>
        ${this._tidRad("input_datetime.ki_hanklevarmer_morgen_start", "Fra")}
        ${this._tidRad("input_datetime.ki_hanklevarmer_morgen_slutt", "Til")}
        <div class="undertittel" style="padding-top:10px">Kveld</div>
        ${this._tidRad("input_datetime.ki_hanklevarmer_kveld_start", "Fra")}
        ${this._tidRad("input_datetime.ki_hanklevarmer_kveld_slutt", "Til")}
        <div class="undertittel" style="padding-top:10px">Sikkerhet</div>
        ${this._stepperRad("input_number.ki_hanklevarmer_maks_pa_tid", "Slå av etter", 0, " min")}
        <div class="notat">Utenfor vinduene kan den slås på manuelt; da slås den av igjen etter maks på-tid. I rød effektsone utsettes starten noen minutter.</div>
      </div>`;
  }

  // Søylediagram: døgnmaks per dato denne måneden, topp tre uthevet, mål og grense som linjer.
  _dognGraf() {
    const N = (k, d) => this._a("sensor.ki_nettleie", k, d);
    const dager = N("dogn_maned", []) || [];
    const eksterne = (N("topp_tre", []) || []).filter((t) => t.kilde === "ekstern");
    const iDag = new Date();
    const antall = new Date(iDag.getFullYear(), iDag.getMonth() + 1, 0).getDate();
    const perDag = {};
    dager.forEach((d) => { perDag[Number(d.dato.slice(8, 10))] = d; });
    const mal = Number(N("mal_kw", NaN)), hard = Number(N("hard_kwh", NaN)), grense = Number(N("grense_kwh", NaN));
    const verdier = dager.map((d) => d.kwh).concat(eksterne.map((t) => t.kwh)).filter(isFinite);
    const maks = Math.max(1, ...verdier, isFinite(hard) ? hard : 0, isFinite(mal) ? mal : 0) * 1.08;
    const hoyde = (v) => (100 * v / maks).toFixed(1);
    if (!dager.length && !eksterne.length) return '<div class="notat">Grafen fylles etter hvert som dager fullføres.</div>';
    return `<div class="dogngraf">
      ${isFinite(mal) ? `<div class="dg-linje mal" style="bottom:${hoyde(mal)}%"><span>mål ${nf(mal, 1)}</span></div>` : ""}
      ${isFinite(grense) ? `<div class="dg-linje grense" style="bottom:${hoyde(grense)}%"><span>grense ${nf(grense, 2)}</span></div>` : ""}
      <div class="dg-soyler">
        ${eksterne.map((t) => `<div class="dg-dag ekstern" title="ekstern, ukjent dato: ${nf(t.kwh, 2)} kWh">
            <div class="dg-soyle" style="height:${hoyde(t.kwh)}%"></div><span>?</span></div>`).join("")}
        ${Array.from({ length: antall }, (_, i) => i + 1).map((dag) => {
          const d = perDag[dag];
          const k = !d ? "" : d.topp ? "topp" : d.kvalitet === "estimert" ? "est" : "";
          const erIDag = dag === iDag.getDate();
          return `<div class="dg-dag ${k} ${erIDag ? "idag" : ""}" title="${dag}. — ${d ? nf(d.kwh, 2) + " kWh kl. " + d.time + " (" + d.kvalitet + (d.manglende_timer ? ", " + d.manglende_timer + " t mangler" : "") + ")" : "ingen data"}">
            <div class="dg-soyle" style="height:${d ? hoyde(d.kwh) : 0}%"></div>
            ${d && d.manglende_timer ? '<i class="dg-hull"></i>' : ""}
            <span>${dag % 5 === 0 || dag === 1 ? dag : ""}</span></div>`;
        }).join("")}
      </div>
    </div>
    <div class="stripeforklaring"><span><i class="s-valgt"></i>Topp tre</span><span><i class="s-pris"></i>Andre dager</span><span><i class="s-est"></i>Estimert</span><span><i class="s-ekst"></i>Ekstern (uten dato)</span><span>Ramme = i dag · prikk = timer mangler</span></div>`;
  }

  _prisStripe() {
    const d = this._a("sensor.ki_vvb_billige_timer", "doegn", []) || [];
    if (!d.length) return '<div class="notat">Ingen døgndata ennå.</div>';
    const priser = d.map((x) => x.pris).filter((p) => p != null && isFinite(p));
    const maks = priser.length ? Math.max(...priser) : 0;
    const min = priser.length ? Math.min(...priser) : 0;
    const harPris = priser.length > 0;
    const span = Math.max(maks - min, 0.01);
    return `
      <div class="stripe">
        ${d.map((x) => {
          const h = harPris && x.pris != null ? 25 + 75 * ((x.pris - min) / span) : 55;
          const kl = x.valgt ? "valgt" : x.vindu ? "vindu" : "";
          return `<div class="time ${kl} ${x.naa ? "naa" : ""}" title="${String(x.t).padStart(2, "0")}:00${x.pris != null ? " · " + nf(x.pris, 2) : ""}">
            <div class="soyle" style="height:${h.toFixed(0)}%"></div>
            <span>${x.t % 3 === 0 ? String(x.t).padStart(2, "0") : ""}</span></div>`;
        }).join("")}
      </div>
      <div class="stripeforklaring">
        <span><i class="s-valgt"></i>Berederen kjører</span>
        <span><i class="s-vindu"></i>Vindu</span>
        ${harPris ? `<span><i class="s-pris"></i>Pris ${nf(min, 2)}–${nf(maks, 2)}</span>` : "<span>Ingen prisdata</span>"}
      </div>`;
  }

  _vvbKort(kort) {
    const a = (k, d) => this._a("sensor.ki_bereder", k, d);
    const konfigurert = !!a("bryter", "");
    const status = this._s("sensor.ki_vvb_legionella_status", "ukjent");
    const dager = this._n("sensor.ki_vvb_dager_siden_siste_syklus");
    const effekt = Number(a("effekt_w", NaN));
    const bryterPa = !!a("bryter_pa", false);
    const varmer = !!a("varmer", false);
    const tvungen = this._pa("input_boolean.ki_vvb_tvungen_syklus_aktiv");
    const kritisk = this._pa("input_boolean.ki_vvb_kritisk_varslet");
    const reservert = Number(a("reservert_kw", NaN));
    const vvbGrunn = this._s("sensor.ki_vvb_forklaring", a("forklaring", ""));
    const klasse = kritisk ? "feil" : tvungen ? "advarsel" : varmer ? "ok" : "noytral";
    const bryter = a("bryter", "switch.varmtvannsbereder");

    // Legionella
    const legAktiv = a("legionella_aktiv", true);
    const sikret = !!a("sikret", false);
    const forfalt = !!a("forfalt", false);
    const hard = Number(a("hard_frist_dager", 7));
    const intervall = Number(a("intervall_dager", 3));
    const pct = isFinite(dager) && hard > 0 ? Math.max(0, Math.min(100, (dager / hard) * 100)) : 0;
    const legKlasse = !legAktiv ? "noytral" : forfalt ? "feil" : sikret ? "ok" : "advarsel";
    const legTekst = !legAktiv ? "Legionellasikring er av" : forfalt ? "Forfalt — tvinges på"
      : sikret ? "Sikret" : "Bør kjøres snart";

    const hoved = `
      <div class="blokk">
        <div class="hode"><span>Varmtvann</span><span class="sub">${esc(status)}</span></div>
        <div class="rad rad-les" data-handling="mer" data-entity="${esc(bryter)}">
          <div class="prikk p-${klasse}"></div>
          <div class="radtekst"><div class="radnavn">${!konfigurert ? "Ikke satt opp" : varmer ? "Varmer nå" : bryterPa ? "Bryter på, trekker ikke effekt" : "Står stille"}</div>
            <div class="radsub">${esc(vvbGrunn)}</div></div>
          <div class="radverdi">${isFinite(effekt) ? nf(effekt, 0) + " W" : "–"}</div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Bryteren nå</div>
            <div class="radsub">${bryterPa ? "På" : "Av"} · vindu ${esc(a("vindu", ""))}</div></div>
          <div class="bryter ${bryterPa ? "on" : ""} ${konfigurert ? "" : "mangler"}"
               data-handling="bryter" data-entity="${esc(bryter)}"><span></span></div>
        </div>
        ${kritisk ? `<div class="varsel">Berederen svarer ikke på tvungen start. Sjekk sikring, kontaktor og element fysisk.</div>` : ""}
        ${kort ? `<div class="rad rad-les" data-handling="fane" data-fane="varmtvann">
          <div class="prikk p-${legKlasse}"></div>
          <div class="radtekst"><div class="radnavn">Legionella: ${legTekst}</div>
            <div class="radsub">Sist sikret ${this._dato(a("siste_syklus", null))} · frist ${this._dato(a("neste_frist", null))}</div></div>
        </div>` : ""}
      </div>`;

    const leg = `
      <div class="blokk">
        <div class="hode"><span>Legionella${this._hj("vvb_syklus")}</span>
          <span class="badge b-${legKlasse}">${legTekst}</span></div>
        ${this._hjTekst("vvb_syklus")}
        <div class="bar"><div class="bar-fyll f-${legKlasse}" style="width:${pct.toFixed(0)}%"></div>
          <div class="bar-mark" style="left:${hard > 0 ? Math.min(100, (intervall / hard) * 100).toFixed(0) : 0}%"></div></div>
        <div class="bar-tekst"><span>${isFinite(dager) ? nf(dager, 1) + " d siden" : "–"}</span><span>ønsket hver ${nf(intervall, 0)} d</span><span>frist ${nf(hard, 0)} d</span></div>
        <div class="rad rad-les" data-handling="mer" data-entity="datetime.ki_vvb_siste_godkjente_syklus">
          <div class="prikk p-${sikret ? "ok" : "noytral"}"></div>
          <div class="radtekst"><div class="radnavn">Sist sikret (metning)</div>
            <div class="radsub">Termostaten koblet ut etter full oppvarming</div></div>
          <div class="radverdi brytbar">${this._dato(a("siste_syklus", null))}</div>
        </div>
        <div class="rad rad-les">
          <div class="prikk p-${forfalt ? "feil" : "noytral"}"></div>
          <div class="radtekst"><div class="radnavn">Neste frist</div>
            <div class="radsub">Etter dette tvinges berederen på uansett pris</div></div>
          <div class="radverdi brytbar">${this._dato(a("neste_frist", null))}</div>
        </div>
        <div class="tallrad" style="margin-top:8px">
          <div class="tall"><b>${nf(reservert, 2)}</b><span>kW reservert</span></div>
          <div class="tall"><b>${nf(this._n("sensor.ki_vvb_oppvarming_minutter"), 0)}</b><span>min varmet</span></div>
          <div class="tall"><b>${this._pa("binary_sensor.ki_vvb_mettet") ? "Ja" : "Nei"}</b><span>mettet nå</span></div>
        </div>
        ${this._sub("vvb:detaljer", "Metning, vindu og sikring", `
        <div class="rad rad-les" data-handling="mer" data-entity="binary_sensor.ki_vvb_mettet">
          <div class="prikk p-${this._pa("binary_sensor.ki_vvb_mettet") ? "ok"
            : this._pa("binary_sensor.ki_vvb_ingen_respons") ? "feil" : "noytral"}"></div>
          <div class="radtekst"><div class="radnavn">Metning</div>
            <div class="radsub">${this._pa("binary_sensor.ki_vvb_mettet")
              ? "Termostaten har koblet ut — vannet er på settpunkt"
              : this._pa("binary_sensor.ki_vvb_ingen_respons")
                ? "Bryteren står på uten at effekten stiger — sannsynlig feil"
                : this._pa("input_boolean.ki_vvb_har_trukket_effekt")
                  ? "Har trukket effekt denne runden, venter på utkobling"
                  : "Ingen effekt registrert denne runden"}</div></div>
        </div>
        <div class="rad rad-les" data-handling="mer" data-entity="binary_sensor.ki_vvb_i_vindu">
          <div class="prikk p-${this._pa("binary_sensor.ki_vvb_i_vindu") ? "ok" : "noytral"}"></div>
          <div class="radtekst"><div class="radnavn">Oppvarmingsvindu</div>
            <div class="radsub">${this._pa("binary_sensor.ki_vvb_ferdig_i_vinduet")
              ? "Ferdig for i natt" : this._pa("binary_sensor.ki_vvb_i_vindu")
                ? "Åpent nå" : "Lukket"}</div></div>
        </div>
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Legionellasikring</div>
            <div class="radsub">Av = ingen tvungen syklus, bare vindu og pris</div></div>
          <div class="bryter ${legAktiv ? "on" : ""}"
               data-handling="veksle" data-entity="input_boolean.ki_vvb_legionella_aktiv"><span></span></div>
        </div>
        <div class="hurtig">
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="vvb_tving_syklus">Kjør syklus nå</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="${this._pa("binary_sensor.ki_vvb_boost_aktiv") ? "vvb_avbryt_boost" : "vvb_boost"}">${this._pa("binary_sensor.ki_vvb_boost_aktiv") ? "Avbryt boost" : "Boost varmtvann"}</div>
        </div>`)}
      </div>`;

    if (kort) return hoved;
    const hovedOgLeg = hoved + leg;

    const timer = this._a("sensor.ki_vvb_billige_timer", "timer", []) || [];
    const metode = this._a("sensor.ki_vvb_billige_timer", "metode", "");
    const billigNa = this._pa("binary_sensor.ki_vvb_billig_time_na");
    const boost = this._pa("binary_sensor.ki_vvb_boost_aktiv");

    return hovedOgLeg + `
      <div class="blokk">
        <div class="hode"><span>Prisstyring${this._hj("vvb_billige")}</span><span class="sub">${billigNa ? "Billig time nå" : "Venter"}</span></div>
        ${this._hjTekst("vvb_billige")}
        <div class="konklusjon">${esc(this._s("sensor.ki_vvb_forklaring", "–"))}</div>
        ${this._prisStripe()}
        <div class="notat">${esc(metode)}${
          this._a("sensor.ki_vvb_billige_timer", "antall_kandidater", 0) > 24
            ? " Prisdata kommer i kvartersoppløsning, så flere oppføringer per time slås sammen."
            : ""}</div>
        ${this._stepperRad("input_number.vvb_billigste_timer_dogn", "Antall billige timer", 0, " t")}
        ${this._stepperRad("input_number.ki_vvb_intervall_dager", "Ønsket legionellaintervall", 0, " d")}
        ${this._stepperRad("input_number.ki_vvb_maks_dager", "Hard frist", 0, " d")}
        ${this._tidRad("input_datetime.ki_vvb_klar_innen", "Ferdig innen")}
        ${this._tidRad("input_datetime.ki_vvb_vindu_start", "Vindu starter")}
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Prisstyring</div>
            <div class="radsub">Av = berederen står som den står</div></div>
          <div class="bryter ${this._pa("input_boolean.ki_vvb_prisstyring") ? "on" : ""}"
               data-handling="veksle" data-entity="input_boolean.ki_vvb_prisstyring"><span></span></div>
        </div>
        ${this._a("sensor.ki_vvb_billige_timer", "norgespris", false) ? `
        <div class="rad rad-les"><div class="prikk p-ok"></div>
          <div class="radtekst"><div class="radnavn">Norgespris aktiv</div>
            <div class="radsub">Strømprisen er lik hele døgnet. Berederen legges i vinduet med billigste nettleie (natt/helg) — spotpris trengs ikke.</div></div></div>` : `
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Følg spotpris</div>
            <div class="radsub">${this._a("sensor.ki_vvb_billige_timer", "har_priser", false) ? "Velger de billigste enkelttimene fram til fristen" : "Ingen prisdata — velg spotprissensor under Konfigurer, ellers brukes vinduet"}</div></div>
          <div class="bryter ${this._pa("input_boolean.ki_vvb_folg_spotpris") ? "on" : ""}"
               data-handling="veksle" data-entity="input_boolean.ki_vvb_folg_spotpris"><span></span></div>
        </div>`}
        <div class="rad">
          <div class="radtekst"><div class="radnavn">Alltid på</div>
            <div class="radsub">Overstyrer automatikken helt</div></div>
          <div class="bryter ${this._pa("input_boolean.ki_vvb_alltid_pa") ? "on" : ""}"
               data-handling="veksle" data-entity="input_boolean.ki_vvb_alltid_pa"><span></span></div>
        </div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Handling${this._hj("vvb_handling")}</span></div>
        ${this._hjTekst("vvb_handling")}
        <div class="hurtig">
          <div class="mini" data-handling="tjeneste" data-domene="script" data-tjeneste="${boost ? "ki_vvb_avbryt_boost" : "ki_vvb_boost"}">${boost ? "Avbryt boost" : "Boost nå"}</div>
          <div class="mini" data-handling="tjeneste" data-domene="script" data-tjeneste="ki_vvb_tving_syklus_na">Tving syklus nå</div>
        </div>
      </div>`;
  }

  /* ---------------------------- Tanker ------------------------ */

  _tanker() {
    const a = (n, d) => this._a("sensor.ki_energi_status", n, d);
    const laster = this._a("sensor.ki_laster", "laster", []) || [];
    const logg = this._a("sensor.ki_beslutningslogg", "linjer", []) || [];
    const tau = this._a("sensor.ki_tidskonstanter", "soner", {}) || {};

    const resonnement = [
      ["Grensen denne timen", `${nf(Number(a("grense_kwh", NaN)), 2)} kWh`, a("grense_grunn", "")],
      ["Brukt så langt", `${nf(Number(a("forbrukt_kwh", NaN)), 2)} kWh`, `Kilde: ${esc(a("malekilde", "ukjent"))}`],
      ["Tillatt snitt resten av timen", `${nf(Number(a("tillatt_effekt_kw", NaN)), 2)} kW`,
        `${a("minutter_igjen", "–")} minutter igjen`],
      ["Uregulert last nå", `${nf(Number(a("uregulert_kw", NaN)), 2)} kW`,
        `Om en time: ${nf(Number(a("uregulert_60_kw", NaN)), 2)} kW (innlært profil)`],
      ["Varmtvann", `${nf(Number(a("vvb_reservert_kw", NaN)), 2)} kW`, a("vvb_grunn", "")],
      ["Solbidrag stue", `${nf(Number(a("solfaktor", 0)), 2)}`, "0 = ingen sol, 1 = full klar sol på fasaden"],
      ["Ledig til varme", `${nf(Number(a("ledig_kw", NaN)), 2)} kW`, "Etter reserver og prioriterte laster"],
    ];

    return `
      <div class="blokk">
        <div class="hode"><span>Slik tenker motoren nå</span></div>
        <div class="konklusjon">${esc(a("forklaring", "–"))}</div>
        ${resonnement.map(([navn, verdi, sub]) => `
          <div class="rad">
            <div class="radtekst"><div class="radnavn">${esc(navn)}</div>
              <div class="radsub">${esc(sub)}</div></div>
            <div class="radverdi">${esc(verdi)}</div>
          </div>`).join("")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Vurdering per sone</span><span class="sub">Sortert som motoren prioriterer</span></div>
        ${laster.map((l) => {
          const h = HANDLING[l.handling] || { tekst: l.handling, k: "noytral" };
          return `<div class="rad rad-les">
            <div class="prikk p-${h.k}"></div>
            <div class="radtekst"><div class="radnavn">${esc(l.navn)} <span class="badge b-${h.k}">${esc(h.tekst)}</span>${l.leggetid ? ' <span class="badge b-noytral">leggetid</span>' : ""}</div>
              <div class="radsub">${esc(l.forklaring || "")}</div></div>
            <div class="radverdi kort">${nf(l.effekt, 2)} kW</div></div>`;
        }).join("")}
      </div>
      ${Object.keys(tau).length ? `
      <div class="blokk">
        <div class="hode"><span>Innlærte tidskonstanter${this._hj("tidskonstant")}</span><span class="sub">Treghet · oppvarming · målinger</span></div>
        ${this._hjTekst("tidskonstant")}
        ${Object.entries(tau).map(([navn, v]) => `
          <div class="rad rad-les">
            <div class="radtekst"><div class="radnavn">${esc(navn)}</div>
              <div class="radsub">${v.malinger || 0} målinger${v.malinger < 20 ? " — lærer fortsatt" : ""}</div></div>
            <div class="radverdi">${v.tau_timer ? nf(v.tau_timer, 1) + " t" : "–"} · ${v.grader_per_time ? nf(v.grader_per_time, 1) + " °C/t" : "–"}</div>
          </div>`).join("")}
        <div class="notat">Tidskonstanten er hvor lenge rommet holder på overtemperaturen.
          Lang tidskonstant betyr at nattsenking sjelden lønner seg, fordi gjenoppvarmingen
          skjer til dyrere dagtariff.</div>
      </div>` : ""}
      <div class="blokk">
        <div class="hode"><span>Beslutningslogg</span><span class="sub">${logg.length} oppføringer</span></div>
        ${logg.length ? logg.slice(0, 30).map((l) => `
          <div class="logg">
            <div class="loggtopp">
              <span class="loggtid">${esc(String(l.tid || "").slice(11, 16))}</span>
              <span class="badge b-${l.sone === "gronn" ? "ok" : l.sone === "gul" ? "advarsel" : "feil"}">${esc(l.sone)}</span>
              ${l.skygge ? '<span class="merke">skygge</span>' : ""}
              <span class="loggtall">${nf(l.forbrukt, 2)} / ${nf(l.grense, 2)} kWh</span>
            </div>
            <div class="loggtekst">${esc(l.forklaring || "")}</div>
            ${(l.tiltak || []).length ? `<ul class="tiltak">${l.tiltak.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          </div>`).join("") : '<div class="notat">Ingen beslutninger logget ennå. Motoren logger bare når den gjør noe, eller når det blir trangt.</div>'}
      </div>`;
  }

  /* ---------------------------- Oppsett ----------------------- */

  _oppsett() {
    const grupper = [
      ["Motor", [
        ["input_boolean.ki_energi_hovedbryter", "Energimotor", "Hovedbryter for hele integrasjonen"],
        ["input_boolean.ki_skyggemodus", "Skyggemodus", "Regner og logger, styrer ingenting", "skyggemodus"],
        ["input_boolean.ki_dynamisk_grense", "Dynamisk grense", "Regner mot snittet av tre topper"],
        ["input_boolean.ki_laering_tau", "Lær tidskonstanter", "Måler hvor fort hver sone varmer og kjøler"],
      ]],
      ["Varme og komfort", [
        ["input_boolean.ki_prediktiv_forvarming", "Prediktiv forvarming", "Starter ut fra målt oppvarmingsrate"],
        ["input_boolean.ki_solkompensasjon", "Solkompensasjon", "Trekker fra solvarme i stua"],
        ["input_boolean.ki_vindu_stopp", "Vindu åpent stopper varme", "Sonen settes ned når et vindu/dør står åpent"],
        ["input_boolean.ki_nattsenk_aktiv", "Nattsenking", "Av = ingen soner senkes om natten"],
        ["input_boolean.ki_nattsenk_okonomi", "Økonomisk nattsenking", "Senker bare når sparingen slår gjenoppvarmingen"],
        ["input_boolean.ki_styr_gardiner", "Styr gardiner", "Se egen blokk lenger ned"],
      ]],
      ["Helg og sommer", [
        ["input_boolean.ki_helg_auto", this._l("Helg automatisk ved fravær"), this._l("Torsdag/fredag etter lengre fravær")],
        ["input_boolean.ki_helg_senk_gulvvarme", this._l("Helg senk gulvvarme"), "Gulvvarmen senkes også i helgemodus"],
        ["input_boolean.ki_sommer_auto", "Sommermodus automatisk", "Etter måned og utetemperatur"],
      ]],
      ["Elbil", [
        ["input_boolean.ki_elbil_natt", "Elbil lader om natten", "Laderen er ikke smart — motoren holder av effekt i ladevinduet"],
      ]],
      ["Vann og bad", [
        ["input_boolean.ki_vvb_prisstyring", "VVB prisstyring", "Velger de billigste timene"],
        ["input_boolean.ki_vvb_alltid_pa", "VVB alltid på", "Kobler ut prisstyringen"],
        ["input_boolean.ki_vvb_legionella_aktiv", "Legionellasikring", "Kan ikke blokkeres av sparing når den er på"],
        ["input_boolean.ki_styr_hanklevarmer", "Styr håndklevarmer", "Dusjvinduer og sikkerhetsavstenging"],
      ]],
    ];
    const bryterRad = ([id, navn, sub, hjelp]) => {
      const st = this._st(id);
      return `<div class="rad">
        <div class="radtekst"><div class="radnavn">${esc(navn)}${st ? "" : ' <span class="merke">mangler</span>'}${hjelp ? this._hj(hjelp) : ""}</div>
          ${sub ? `<div class="radsub">${esc(sub)}</div>` : ""}</div>
        <div class="bryter ${st && st.state === "on" ? "on" : ""} ${st ? "" : "mangler"}"
             data-handling="veksle" data-entity="${id}"><span></span></div>
      </div>${hjelp ? this._hjTekst(hjelp) : ""}`;
    };
    const varsler = [
      ["input_boolean.ki_varsel_effekt", "Effektgrense", "Når en time ender over grensen"],
      ["input_boolean.ki_varsel_helg", "Helg", "Fredagsspørsmål, søndagsspørsmål og helg satt automatisk"],
      ["input_boolean.ki_varsel_hjemkomst", "Hjemkomst", "Når oppvarmingen starter uten svar"],
      ["input_boolean.ki_varsel_sommer", "Sommermodus", "Når den slås av/på automatisk"],
      ["input_boolean.ki_varsel_vvb", "Varmtvann", "Lang oppvarming. Feil og forfalt legionella varsles alltid"],
      ["input_boolean.ki_varsel_hanklevarmer", "Håndklevarmer", "Sikkerhetsavstenging"],
    ];
    const varslerPa = this._pa("input_boolean.ki_energi_varsler");
    const diag = [
      ["sensor.ki_uregulert_effekt", "Uregulert effekt"],
      ["sensor.ki_styrt_effekt", "Styrt effekt"],
      ["sensor.strommaler_effekt", "Total effekt"],
      ["sensor.strommaler_imported_energy", "Energiregister"],
      ["sensor.outdoor_meter_temperature", "Utetemperatur"],
      ["sensor.ki_energi_status", "Motorstatus"],
    ];
    // Timesmåleren kan hete flere ting. Vis den som finnes, ikke de som ikke gjør det.
    const maler = TIMESMALER_KANDIDATER.filter((id) => this._st(id));
    const brukt = this._a("sensor.ki_energi_status", "malekilde", "");

    return `
      ${this._overtakelse(false)}
      ${grupper.map(([tittel, liste]) => `
      <div class="blokk">
        <div class="hode"><span>${tittel}</span></div>
        ${liste.map(bryterRad).join("")}
      </div>`).join("")}
      <div class="blokk">
        <div class="hode"><span>Varslinger</span>
          <span class="sub"><div class="bryter ${varslerPa ? "on" : ""}" data-handling="veksle" data-entity="input_boolean.ki_energi_varsler"><span></span></div></span></div>
        <div class="notat" style="padding-top:0">Hovedbryteren over slår alt av. Mottakere velges under Konfigurer → Hus og varsler.</div>
        <div class="${varslerPa ? "" : "dempet"}">${varsler.map(bryterRad).join("")}</div>
        <div class="notat">Kritiske feil (berederen svarer ikke, legionellafrist passert) sendes uansett.</div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Tider</span><span class="sub">Døgnet i huset</span></div>
        ${this._dognplan([
          { navn: "Huset", spenn: [["input_datetime.ki_tid_dag_start", "input_datetime.ki_tid_natt_start", "dag", "Dag"]] },
          { navn: "Cybele", spenn: [["input_datetime.ki_cybele_dag", "input_datetime.ki_cybele_natt", "c", "Våken"],
                                    ["input_datetime.ki_cybele_borte_fra", "input_datetime.ki_cybele_borte_til", "borte", "Borte"]] },
          { navn: "Sebastian", spenn: [["input_datetime.ki_sebastian_vekking", "input_datetime.ki_sebastian_natt", "s", "Våken"]] },
          { navn: "Stue", mark: [["input_datetime.ki_stue_reduksjon_fra", "Reduksjon fra", "advarsel"]] },
        ])}
        <div class="stripeforklaring"><span>Strek = nå · varmen holdes oppe i de fargede båndene</span></div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Dag og natt</span><span class="sub">${this._tidKort("input_datetime.ki_tid_dag_start")}–${this._tidKort("input_datetime.ki_tid_natt_start")}</span></div>
        ${this._tidPar("Dag starter", "input_datetime.ki_tid_dag_start", "Natt starter", "input_datetime.ki_tid_natt_start")}
        ${this._stepperRad("input_number.ki_natt_senk_ute_grense", "Nattsenk kun under", 0, " °C")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Cybele</span><span class="sub">${this._tidKort("input_datetime.ki_cybele_dag")}–${this._tidKort("input_datetime.ki_cybele_natt")}</span></div>
        ${this._tidPar("Opp", "input_datetime.ki_cybele_dag", "Legger seg", "input_datetime.ki_cybele_natt")}
        ${this._tidPar("Borte fra", "input_datetime.ki_cybele_borte_fra", "Hjemme igjen", "input_datetime.ki_cybele_borte_til")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Sebastian</span><span class="sub">${this._tidKort("input_datetime.ki_sebastian_vekking")}–${this._tidKort("input_datetime.ki_sebastian_natt")}</span></div>
        ${this._tidPar("Vekking", "input_datetime.ki_sebastian_vekking", "Vekking helg", "input_datetime.ki_sebastian_vekking_helg")}
        ${this._tidRad("input_datetime.ki_sebastian_natt", "Legger seg")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Elbil</span><span class="sub">${this._tidKort("input_datetime.ki_elbil_fra")}–${this._tidKort("input_datetime.ki_elbil_til")}</span></div>
        ${this._dognplan([{ navn: "Lading", spenn: [["input_datetime.ki_elbil_fra", "input_datetime.ki_elbil_til", "s", "Elbil"]] }])}
        ${this._tidPar("Lader fra", "input_datetime.ki_elbil_fra", "Til", "input_datetime.ki_elbil_til")}
        ${this._stepperRad("input_number.ki_elbil_effekt_kw", "Ladeeffekt", 1, " kW")}
        <div class="notat">5 A på tre faser (400 V) ≈ 3,5 kW, på én fase (230 V) ≈ 1,2 kW. Når lastprofilen har lært natten, teller halvparten.</div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Stue og vindu</span></div>
        ${this._tidRad("input_datetime.ki_stue_reduksjon_fra", "Stue reduksjon fra")}
        ${this._stepperRad("input_number.ki_stue_reduksjon", "Stue reduksjon", 1, " °C")}
        ${this._stepperRad("input_number.ki_vindu_forsinkelse_min", "Vindu: vent før senking", 0, " min")}
        ${this._stepperRad("input_number.ki_vindu_temp", "Vindu: hold temperatur", 1, " °C")}
      </div>
      <div class="blokk">
        <div class="hode"><span>Diagnostikk</span><span class="sub">Rå tilstand</span></div>
        ${diag.map(([id, navn]) => {
          const st = this._st(id);
          return `<div class="rad rad-les" data-handling="mer" data-entity="${id}">
            <div class="prikk p-${st ? "ok" : "feil"}"></div>
            <div class="radtekst"><div class="radnavn">${esc(navn)}</div>
              <div class="radsub">${esc(id)}</div></div>
            <div class="radverdi">${st ? esc(st.state) : "finnes ikke"}</div></div>`;
        }).join("")}
        <div class="rad rad-les" ${maler.length ? `data-handling="mer" data-entity="${maler[0]}"` : ""}>
          <div class="prikk p-${maler.length ? "ok" : "advarsel"}"></div>
          <div class="radtekst"><div class="radnavn">Timesmåler i bruk${this._hj("malekilde")}</div>
            <div class="radsub">${maler.length
              ? esc(maler.join(", "))
              : "Ingen utility_meter funnet — motoren måler timen selv mot energiregisteret"}</div></div>
          <div class="radverdi">${maler.length ? esc(this._s(maler[0])) : "egen måling"}</div>
        </div>
        ${this._hjTekst("malekilde")}
        ${(() => {
          const ok = this._a("sensor.ki_energi_status", "lagring_ok", null);
          const hvor = this._a("sensor.ki_energi_status", "lagring", "ukjent");
          const profil = this._a("sensor.ki_energi_status", "profil_oppforinger", 0);
          const tau = this._a("sensor.ki_energi_status", "tau_soner", 0);
          return `<div class="rad rad-les" data-handling="mer" data-entity="sensor.ki_energi_status">
            <div class="prikk p-${ok === true ? "ok" : ok === false ? "feil" : "advarsel"}"></div>
            <div class="radtekst"><div class="radnavn">Lagring av læring${this._hj("lagring")}</div>
              <div class="radsub">${esc(hvor)} · ${profil} profiloppføringer · ${tau} soner</div></div>
          </div>
          ${this._hjTekst("lagring")}`;
        })()}
        ${brukt ? `<div class="notat">Motoren rapporterer at den bruker: ${esc(brukt)}</div>` : ""}
        <div class="hurtig">
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="fjern_overstyring">Fjern alle overstyringer</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="tick">Kjør motoren nå</div>
        </div>
      </div>`;
  }

  /* ---------------------------- Avansert ---------------------- */

  _avansert() {
    const attr = (this._st("sensor.ki_energi_status") || {}).attributes || {};
    const skjul = ["friendly_name", "icon", "forklaring", "endringer", "laster", "linjer"];
    const rader = [];
    for (const k of Object.keys(attr)) {
      if (skjul.includes(k)) continue;
      let v = attr[k];
      if (typeof v === "object") v = JSON.stringify(v);
      if (typeof v === "boolean") v = v ? "ja" : "nei";
      rader.push([k, String(v)]);
    }

    const lasterAlle = (this._a("sensor.ki_laster", "laster", []) || []).filter((l) => l.type !== "bryter");
    const entMap = {};
    lasterAlle.forEach((l) => { entMap[l.key] = l.entiteter && l.entiteter.length ? l.entiteter : (SONE_ENTITETER[l.key] || []); });
    const soner = Object.keys(entMap).length ? Object.keys(entMap) : Object.keys(SONE_ENTITETER);

    return `
      <div class="blokk">
        <div class="hode"><span>Terskler for fargesonene</span>
          <span class="sub">Prosent av tillatt effekt</span></div>
        ${this._stepperRad("input_number.ki_sone_gul", "Gul fra", 0, " %")}
        ${this._stepperRad("input_number.ki_sone_oransje", "Oransje fra", 0, " %")}
        ${this._stepperRad("input_number.ki_sone_rod", "Rød fra", 0, " %")}
        <div class="notat">Motoren senker først når den ikke får plass i budsjettet.
          Fargene styrer varsling og hvor tidlig varmtvannet må vike, ikke selve
          utkoblingen.</div>
      </div>

      <div class="blokk">
        <div class="hode"><span>Prognose og reserver</span>
          <span class="sub">Brukes til motoren har lært profilen</span></div>
        ${this._stepperRad("input_number.ki_reserve_uregulert_kwh", "Reserve uregulert last", 2, " kW")}
        ${this._stepperRad("input_number.ki_reserve_frokost_kwh", "Reserve frokost", 1, " kW")}
        ${this._stepperRad("input_number.ki_reserve_middag_kwh", "Reserve middag", 1, " kW")}
        <div class="undertittel" style="padding-top:10px">Måltidsvinduer</div>
        ${this._dognplan([{ navn: "Måltider", spenn: [["input_datetime.ki_frokost_start", "input_datetime.ki_frokost_slutt", "ok", "Frokost"], ["input_datetime.ki_middag_start", "input_datetime.ki_middag_slutt", "ok", "Middag"]] }])}
        ${this._tidRad("input_datetime.ki_frokost_start", "Frokost fra")}
        ${this._tidRad("input_datetime.ki_frokost_slutt", "Frokost til")}
        ${this._tidRad("input_datetime.ki_middag_start", "Middag fra")}
        ${this._tidRad("input_datetime.ki_middag_slutt", "Middag til")}
        <div class="notat">Måltidsreservene brukes bare til lastprofilen har nok målinger for
          timen. Etter det vet motoren selv hva komfyren pleier å trekke.</div>
      </div>

      <div class="blokk">
        <div class="hode"><span>Moduser og unntak</span></div>
        ${this._stepperRad("input_number.ki_temp_helg", this._l("Helgetemperatur"), 1, " °C")}
        ${this._stepperRad("input_number.ki_temp_helg_gulvvarme", this._l("Helg gulvvarme"), 1, " °C")}
        ${this._stepperRad("input_number.ki_temp_helg_bad", this._l("Helg bad"), 1, " °C")}
        ${this._stepperRad("input_number.ki_temp_sommer", "Sommertemperatur", 1, " °C")}
        ${this._manedStripe("input_number.ki_sommer_start_maned", "input_number.ki_sommer_slutt_maned", "Sommermodus")}
        ${this._stepperRad("input_number.ki_sommer_start_maned", "Sommer fra måned", 0, "")}
        ${this._stepperRad("input_number.ki_sommer_slutt_maned", "Sommer til måned", 0, "")}
        ${this._stepperRad("input_number.ki_sommer_ute_grense", "Sommer når ute over", 0, " °C")}
        ${this._stepperRad("input_number.ki_helg_auto_timer", "Helg auto etter", 0, " t borte")}
        <div class="notat">Forvarming bruker motorens målte oppvarmingsrate per sone. Sonene
          starter så sent som mulig innenfor budsjettet, og gulvvarme aldri senere enn 45
          minutter før fristen.</div>
      </div>

      <div class="blokk">
        <div class="hode"><span>Helgevarsler</span><span class="sub">Torsdag, fredag og søndag</span></div>
        <div class="notat" style="padding-top:0">${this._hytte
          ? "«Skal dere på hytta i helgen?» sendes torsdag og fredag når hytta er tom. Svarer dere ja, holdes frostsikringen til oppvarmingen må starte for å være ferdig til ankomsttiden fredag."
          : "«Skal dere bort i helgen?» sendes torsdag og fredag, bare hvis dere er hjemme. Svarer dere ja, settes sparemodus i det siste person drar."}</div>
        ${this._dognplan([
          { navn: "Torsdag", mark: [["input_datetime.ki_helg_varsel_tid_torsdag", "Spør", "noytral"]] },
          { navn: "Fredag", mark: [["input_datetime.ki_helg_varsel_tid", "Spør", "noytral"]] },
          { navn: "Søndag", spenn: [["input_datetime.ki_helg_sporsmal_tid", "input_datetime.ki_helg_frist_tid", "advarsel", "Svarfrist"],
                                    ["input_datetime.ki_helg_frist_tid", "input_datetime.ki_hjemkomst_tid", "dag", "Oppvarming"]],
            mark: [["input_datetime.ki_hjemkomst_tid", "Hjemme", "ok"]] },
        ])}
        ${this._tidBryterRad("input_datetime.ki_helg_varsel_tid_torsdag", "input_boolean.ki_helg_spor_torsdag", "Spør torsdag")}
        ${this._tidBryterRad("input_datetime.ki_helg_varsel_tid", "input_boolean.ki_helg_spor_fredag", "Spør fredag")}
        ${this._tidRad("input_datetime.ki_helg_sporsmal_tid", "Spørsmål søndag")}
        ${this._tidRad("input_datetime.ki_helg_frist_tid", "Svarfrist søndag")}
        ${this._tidRad("input_datetime.ki_hjemkomst_tid", this._l("Forventet hjemkomst"))}
        <div class="hurtig">
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="helg_sporsmal">Send spørsmålet nå</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="hjemkomst">${this._l("Start hjemkomst")}</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi" data-tjeneste="hjemkomst_ferdig">${this._l("Avslutt hjemkomst")}</div>
        </div>
        <div class="rad rad-les" data-handling="mer" data-entity="input_boolean.ki_helg_venter_svar">
          <div class="prikk p-${this._pa("input_boolean.ki_helg_venter_svar") ? "advarsel" : "noytral"}"></div>
          <div class="radtekst"><div class="radnavn">Venter på svar${this._hj("venter_svar")}</div></div>
          <div class="radverdi">${this._pa("input_boolean.ki_helg_venter_svar") ? "Ja" : "Nei"}</div>
        </div>
        ${this._hjTekst("venter_svar")}
      </div>

      ${this._gardinKort()}

      <div class="blokk">
        <div class="hode"><span>Varmtvann, avansert${this._hj("vvb_terskel")}</span></div>
        ${this._hjTekst("vvb_terskel")}
        ${this._stepperRad("input_number.ki_vvb_metning_terskel_w", "Effektgrense for utkoblet termostat", 0, " W")}
        ${this._stepperRad("input_number.ki_vvb_maks_min_uten_effekt", "Maks minutter uten effekt etter start", 0, " min")}
        ${this._stepperRad("input_number.ki_vvb_maks_oppvarming_min", "Maks sammenhengende oppvarming", 0, " min")}
        ${this._stepperRad("input_number.ki_vvb_maks_dager", "Hard legionellafrist", 0, " d")}
        ${this._stepperRad("input_number.ki_vvb_effekt_kw", "Antatt effekt", 1, " kW")}
        ${this._stepperRad("input_number.ki_vvb_boost_minutter", "Boost varighet", 0, " min")}
        ${this._stepperRad("input_number.ki_vvb_metning_minutter", "Minutter null effekt før mettet", 0, " min")}
        <div class="notat">Terskelen avgjør hva som regnes som en reell oppvarming.
          Står den for lavt, telles standby som en syklus og legionellasikringen blir
          bekreftet på falskt grunnlag.</div>
      </div>

      <div class="blokk">
        <div class="hode"><span>Tarifftabell${this._hj("tariff")}</span><span class="sub">kW → kr/mnd</span></div>
        ${this._hjTekst("tariff")}
        <div class="rad"><input class="tekst" type="text" data-entity="input_text.ki_tariff_tabell"
          value="${esc(this._s("input_text.ki_tariff_tabell", ""))}" placeholder="2:150,5:250,10:420,15:585,20:755"></div>
        <div class="fakta">${((this._a("sensor.ki_nettleie", "tabell", []) || [])).map(([g, k], i, a) =>
          `<span class="badge ${this._a("sensor.ki_nettleie", "registrert_trinn_kr", null) === k ? "b-ok" : ""}">${i ? a[i - 1][0] : 0}–${g} kW: ${k} kr</span>`).join("")}</div>
      </div>
      <div class="blokk">
        <div class="hode"><span>Motorens råtilstand</span>
          <span class="sub">Alt sensoren rapporterer</span></div>
        ${rader.map(([k, v]) => `<div class="rad">
          <div class="radtekst"><div class="radnavn">${esc(k)}</div></div>
          <div class="radverdi brytbar">${esc(v)}</div></div>`).join("")}
      </div>

      <div class="blokk">
        <div class="hode"><span>Entiteter per sone</span>
          <span class="sub">Rødt = motoren finner den ikke</span></div>
        ${soner.map((k) => {
          const liste = entMap[k] || SONE_ENTITETER[k] || [];
          const mangler = liste.filter((id) => !this._st(id));
          return `<div class="sone ${this._apne.has("e-" + k) ? "apen" : ""}">
            <div class="sonehode" data-handling="apne" data-key="e-${k}">
              <div class="prikk p-${mangler.length ? "feil" : "ok"}"></div>
              <div class="radtekst"><div class="radnavn">${esc(k)}</div>
                <div class="radsub">${mangler.length
                  ? mangler.length + " entitet(er) mangler"
                  : "alle på plass"}</div></div>
            </div>
            <div class="sonekropp">
              ${liste.map((id) => {
                const st = this._st(id);
                return `<div class="rad rad-les" data-handling="mer" data-entity="${id}">
                  <div class="prikk p-${st ? "ok" : "feil"}"></div>
                  <div class="radtekst"><div class="radsub">${esc(id)}</div></div>
                  <div class="radverdi brytbar">${st ? esc(st.state) : "mangler"}</div></div>`;
              }).join("")}
            </div>
          </div>`;
        }).join("")}
      </div>

      <div class="blokk">
        <div class="hode"><span>Handlinger${this._hj("handlinger")}</span></div>
        ${this._hjTekst("handlinger")}
        <div class="hurtig">
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi"
               data-tjeneste="tick">Kjør motoren nå</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi"
               data-tjeneste="fjern_overstyring">Fjern alle overstyringer</div>
          <div class="mini" data-handling="laering" data-hva="tau">Nullstill tidskonstanter</div>
          <div class="mini" data-handling="laering" data-hva="profil">Nullstill lastprofil</div>
          <div class="mini" data-handling="tjeneste" data-domene="ki_energi"
               data-tjeneste="sett_standardverdier">Sett standardverdier${this._hj("standardverdier")}</div>
        </div>
        ${this._hjTekst("standardverdier")}
      </div>`;
  }

  /* ---------------------------- Grafer ------------------------ */

  _grafPlassholder() {
    return `<div class="grafvent">Henter historikk …</div>`;
  }

  async _hentHistorikk() {
    const naa = Date.now();
    if (this._hist && naa - this._histTid < 120000) { this._tegnGrafer(); return; }
    // Timesmåleren kan hete flere ting, og sensor.ki_forbruk_time finnes ikke
    // hos alle. Finn den som er der, ellers står grafen tom uten forklaring.
    this._malerId = null;
    for (const id of TIMESMALER_KANDIDATER) {
      if (this._st(id)) { this._malerId = id; break; }
    }
    const ider = ["sensor.ki_uregulert_effekt", "sensor.ki_styrt_effekt"];
    if (this._malerId) ider.push(this._malerId);
    Object.entries(this._soneGrafer || {}).forEach(([key, g]) => {
      if (!this._apne.has(key)) return;
      g.eff.forEach((e) => { if (!ider.includes(e)) ider.push(e); });
      if (g.temp && !ider.includes(g.temp)) ider.push(g.temp);
    });
    const nokkel = ider.join(",");
    if (this._hist && this._histNokkel !== nokkel) this._hist = null;
    try {
      const start = new Date(naa - 12 * 3600 * 1000).toISOString();
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start,
        end_time: new Date(naa).toISOString(),
        entity_ids: ider,
        minimal_response: true,
        no_attributes: true,
      });
      this._hist = res || {};
      this._histTid = naa;
      this._histNokkel = nokkel;
      this._tegnGrafer();
    } catch (e) {
      const el = this._rot.querySelector(".graf");
      if (el) el.innerHTML = `<div class="grafvent">Fant ikke historikk (${esc(e.message || e)})</div>`;
    }
  }

  _serie(id, timer) {
    const rå = (this._hist || {})[id] || [];
    const fra = Date.now() / 1000 - timer * 3600;
    return rå.map((p) => ({ t: p.lu || p.last_updated, v: Number(p.s ?? p.state) }))
             .filter((p) => isFinite(p.v) && p.t >= fra);
  }

  _tegnGrafer() {
    Object.entries(this._soneGrafer || {}).forEach(([key, g]) => {
      const el = this._rot.getElementById("graf-sone-" + key);
      if (!el) return;
      const eff = g.eff.map((e) => this._serie(e, 6));
      // summer ovnene: bruk første som tidsakse, legg til siste kjente verdi fra de andre
      let sum = eff[0] || [];
      if (eff.length > 1) {
        const alle = eff.flat().map((p) => p.t).sort((a, b) => a - b);
        sum = alle.map((t) => ({ t, v: eff.reduce((s, ser) => { let v = 0; for (const p of ser) { if (p.t <= t) v = p.v; else break; } return s + v; }, 0) }));
      }
      const tempAttr = g.temp && g.temp.startsWith("climate.");
      const temp = g.temp && !tempAttr ? this._serie(g.temp, 6) : [];
      const serier = [];
      if (sum.length) serier.push({ punkter: sum, klasse: "l1", navn: "Effekt" });
      if (temp.length) serier.push({ punkter: temp, klasse: "l2", navn: "Temp", akse2: true });
      el.innerHTML = serier.length
        ? this._svg(serier, { enhet: "" }) + `<div class="skrubb" hidden><div class="skrubblinje"></div><div class="skrubbtekst"></div></div>`
        : `<div class="grafvent">Ingen historikk ennå${tempAttr ? " (temperatur ligger som attributt på termostaten og lagres ikke som egen serie)" : ""}</div>`;
      this._monterSkrubb(el, serier.map((s) => ({ punkter: s.punkter, navn: s.navn })), "");
    });
    const timeGraf = this._rot.getElementById("graf-time");
    if (timeGraf) {
      if (!this._malerId) {
        timeGraf.innerHTML = `<div class="grafvent">Fant ingen timesmåler å tegne.
          Motoren måler timen selv, men den målingen lagres ikke i historikken.</div>`;
      } else {
        const s = this._serie(this._malerId, 12);
        const grense = Number(this._a("sensor.ki_energi_status", "grense_kwh", NaN));
        timeGraf.innerHTML = s.length
          ? this._svg([{ punkter: s, klasse: "l1" }], { grense, enhet: " kWh" })
          : `<div class="grafvent">Ingen historikk for ${esc(this._malerId)} ennå</div>`;
      }
    }
    const effGraf = this._rot.getElementById("graf-effekt");
    if (effGraf) {
      const naa = Date.now() / 1000;
      const live = (id, s) => { const v = this._n(id); if (isFinite(v)) s.push({ t: naa, v: v / 1000 }); return s; };
      const a = live("sensor.ki_uregulert_effekt", this._serie("sensor.ki_uregulert_effekt", 6).map((p) => ({ t: p.t, v: p.v / 1000 })));
      const b = live("sensor.ki_styrt_effekt", this._serie("sensor.ki_styrt_effekt", 6).map((p) => ({ t: p.t, v: p.v / 1000 })));
      effGraf.innerHTML = (a.length || b.length)
        ? this._svg([{ punkter: a, klasse: "l1", navn: "Uregulert" }, { punkter: b, klasse: "l2", navn: "Styrt" }], { enhet: " kW" })
          + `<div class="skrubb" hidden><div class="skrubblinje"></div><div class="skrubbtekst"></div></div>`
        : `<div class="grafvent">Ingen historikk ennå — sensorene er nye</div>`;
      this._monterSkrubb(effGraf, [{ punkter: a, navn: "Uregulert" }, { punkter: b, navn: "Styrt" }], " kW");
    }
  }

  // Avlesing med finger/mus: viser tid og verdi der man peker.
  _monterSkrubb(el, serier, enhet) {
    const alle = serier.flatMap((s) => s.punkter);
    if (!alle.length) return;
    const t0 = Math.min(...alle.map((p) => p.t)), t1 = Math.max(...alle.map((p) => p.t));
    const boks = el.querySelector(".skrubb"), linje = el.querySelector(".skrubblinje"), tekst = el.querySelector(".skrubbtekst");
    if (!boks) return;
    const verdiVed = (s, t) => { let v = null; for (const p of s.punkter) { if (p.t <= t) v = p.v; else break; } return v; };
    const vis = (ev) => {
      const r = el.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const t = t0 + f * (t1 - t0);
      const d = new Date(t * 1000);
      const deler = serier.map((s) => { const v = verdiVed(s, t); return v == null ? "" : `${s.navn} ${nf(v, 2)}${enhet}`; }).filter(Boolean);
      boks.hidden = false;
      linje.style.left = `${(f * 100).toFixed(1)}%`;
      tekst.style.left = f > 0.6 ? "auto" : `calc(${(f * 100).toFixed(1)}% + 6px)`;
      tekst.style.right = f > 0.6 ? `calc(${((1 - f) * 100).toFixed(1)}% + 6px)` : "auto";
      tekst.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · ${deler.join(" · ")}`;
      ev.preventDefault();
    };
    el.addEventListener("pointerdown", (ev) => { el.setPointerCapture(ev.pointerId); vis(ev); });
    el.addEventListener("pointermove", (ev) => { if (ev.buttons || ev.pointerType === "touch") vis(ev); });
    const skjul = () => { boks.hidden = true; };
    el.addEventListener("pointerup", skjul); el.addEventListener("pointercancel", skjul); el.addEventListener("pointerleave", skjul);
  }

  _svg(serier, opt = {}) {
    const B = 340, H = 90, pad = 4;
    const alle = serier.flatMap((s) => s.punkter);
    if (!alle.length) return `<div class="grafvent">Ingen data</div>`;
    const t0 = Math.min(...alle.map((p) => p.t));
    const t1 = Math.max(...alle.map((p) => p.t));
    const prim = serier.filter((s) => !s.akse2).flatMap((s) => s.punkter);
    let vMax = Math.max(...prim.map((p) => p.v), opt.grense || 0);
    const vMin = Math.min(0, ...prim.map((p) => p.v));
    if (vMax === vMin) vMax = vMin + 1;
    const x = (t) => pad + ((t - t0) / Math.max(t1 - t0, 1)) * (B - 2 * pad);
    const y = (v) => H - pad - ((v - vMin) / (vMax - vMin)) * (H - 2 * pad);
    // sekundær akse (f.eks. temperatur) skaleres for seg selv
    const sek = serier.filter((s) => s.akse2).flatMap((s) => s.punkter);
    let s2Max = sek.length ? Math.max(...sek.map((p) => p.v)) + 0.5 : 1, s2Min = sek.length ? Math.min(...sek.map((p) => p.v)) - 0.5 : 0;
    if (s2Max === s2Min) s2Max = s2Min + 1;
    const y2 = (v) => H - pad - ((v - s2Min) / (s2Max - s2Min)) * (H - 2 * pad);

    const linjer = serier.filter((s) => s.punkter.length).map((s) =>
      `<polyline class="${s.klasse}" points="${s.punkter.map((p) => `${x(p.t).toFixed(1)},${(s.akse2 ? y2 : y)(p.v).toFixed(1)}`).join(" ")}"></polyline>`
    ).join("");
    const grenselinje = isFinite(opt.grense) && opt.grense > 0
      ? `<line class="grense" x1="${pad}" x2="${B - pad}" y1="${y(opt.grense)}" y2="${y(opt.grense)}"></line>` : "";

    return `<svg viewBox="0 0 ${B} ${H}" preserveAspectRatio="none">${grenselinje}${linjer}</svg>
      <div class="grafakse"><span>${nf(vMax, 1)}${opt.enhet || ""}</span><span>${nf(vMin, 1)}${opt.enhet || ""}</span></div>`;
  }

  /* ---------------------------- Interaksjon ------------------- */

  _klikk(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.handling);
    if (!el) return;
    const h = el.dataset.handling;

    if (h === "fane") {
      this._fane = el.dataset.fane;
      this._lagreFane(this._fane);
      this._tegn();
    } else if (h === "underfane") {
      this._underfane = el.dataset.id;
      this._tegn();
    } else if (h === "hero") {
      this._heroApen = !this._heroApen;
      this._tegnHero();
    } else if (h === "mnd") {
      const m = Number(el.dataset.mnd);
      if (this._mndValg && this._mndValg.fraId === el.dataset.fra) {
        this._kall("input_number", "set_value", { entity_id: el.dataset.fra, value: this._mndValg.fra });
        this._kall("input_number", "set_value", { entity_id: el.dataset.til, value: m });
        this._mndValg = null;
      } else {
        this._mndValg = { fraId: el.dataset.fra, fra: m };
        this._tegn();
      }
    } else if (h === "subkollaps") {
      const sek = el.closest(".sub-seksjon");
      const lukket = sek && sek.classList.toggle("lukket");
      this._kollaps[el.dataset.id] = !lukket;
      this._lagreKollaps();
      if (this._fane === "soner") this._hentHistorikk();
    } else if (h === "kollaps") {
      const bl = el.closest(".blokk");
      const lukket = bl && bl.classList.toggle("lukket");
      this._kollaps[el.dataset.id] = !lukket;
      this._lagreKollaps();
    } else if (h === "prio") {
      this._kall("ki_energi", "sett_prio", { sone: el.dataset.key, prio: Number(el.dataset.prio) });
    } else if (h === "leggetid") {
      this._kall("ki_energi", "leggetid", { sone: el.dataset.key, avbryt: el.dataset.avbryt === "1" });
    } else if (h === "mer") {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: mapId(el.dataset.entity) }, bubbles: true, composed: true }));
    } else if (h === "veksle") {
      const st = this._st(el.dataset.entity);
      if (!st) return;
      this._kall(el.dataset.entity.split(".")[0], st.state === "on" ? "turn_off" : "turn_on",
        { entity_id: el.dataset.entity });
    } else if (h === "bryter") {
      const st = this._st(el.dataset.entity);
      if (!st) return;
      this._kall("switch", st.state === "on" ? "turn_off" : "turn_on",
        { entity_id: el.dataset.entity });
    } else if (h === "apne") {
      const k = el.dataset.key;
      if (this._apne.has(k)) this._apne.delete(k); else this._apne.add(k);
      this._tegn();
    } else if (h === "tall") {
      this._juster(el.dataset.entity, Number(el.dataset.dir));
    } else if (h === "ov") {
      const k = el.dataset.key;
      const laster = this._a("sensor.ki_laster", "laster", []) || [];
      const l = laster.find((x) => x.key === k);
      const naa = this._ov[k] !== undefined ? this._ov[k] : (l ? l.mal : 21);
      this._ov[k] = Math.round((naa + Number(el.dataset.dir) * 0.5) * 2) / 2;
      this._tegn();
    } else if (h === "ovsett") {
      const k = el.dataset.key;
      if (this._ov[k] === undefined) return;
      this._kall("ki_energi", "overstyr",
        { sone: k, temp: this._ov[k], minutter: Number(el.dataset.min) });
      delete this._ov[k];
    } else if (h === "ovfjern") {
      this._kall("ki_energi", "fjern_overstyring", { sone: el.dataset.key });
    } else if (h === "tjeneste") {
      this._kall(el.dataset.domene, el.dataset.tjeneste, {});
    } else if (h === "hjelp") {
      const id = el.dataset.id;
      if (this._hjelpApen.has(id)) this._hjelpApen.delete(id); else this._hjelpApen.add(id);
      this._tegn();
    } else if (h === "laering") {
      this._kall("ki_energi", "nullstill_laering", { hva: el.dataset.hva });
    }
  }

  _juster(id, dir) {
    const st = this._st(id);
    if (!st) return;
    const steg = Number(st.attributes.step ?? 0.5) || 0.5;
    const min = Number(st.attributes.min ?? -100);
    const maks = Number(st.attributes.max ?? 1000);
    const v = Math.min(maks, Math.max(min, Number((Number(st.state) + dir * steg).toFixed(4))));
    this._kall("input_number", "set_value", { entity_id: id, value: v });
  }

  _endre(ev) {
    const tall = ev.composedPath().find((n) => n && (n.type === "number" || n.tagName === "SELECT") && n.dataset && n.dataset.entity);
    if (tall) {
      const v = Number(String(tall.value).replace(",", "."));
      if (isFinite(v)) this._kall("input_number", "set_value", { entity_id: tall.dataset.entity, value: v });
      return;
    }
    const tekst = ev.composedPath().find((n) => n && n.type === "text" && n.dataset && n.dataset.entity);
    if (tekst) {
      this._kall("input_text", "set_value", { entity_id: tekst.dataset.entity, value: tekst.value });
      return;
    }
    const el = ev.composedPath().find((n) => n && n.type === "time");
    if (!el) return;
    if (el.value) {
      const [t, m] = el.value.split(":");
      this._kall("input_datetime", "set_datetime",
        { entity_id: el.dataset.entity, time: `${t}:${m}:00` });
    }
  }

  /* ---------------------------- Stil -------------------------- */

  static get stil() {
    return `
      :host { display:block; overflow-x:hidden; }
      * { box-sizing:border-box; min-width:0; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0;
        max-width:100%; overflow:hidden; }
      .wrap { display:flex; flex-direction:column; gap:10px; color: var(--gray1000, var(--primary-text-color)); }
      .tittel { font-size:20px; font-weight:600; padding:2px 6px 0; }

      .hero { display:grid; grid-template-columns:96px 1fr; align-items:center; gap:14px;
        background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:16px; }
      .ring { position:relative; width:88px; height:88px; cursor:pointer; }
      .ring svg { width:88px; height:88px; transform: rotate(-90deg); }
      .ring circle { fill:none; stroke-width:8; stroke-linecap:round; }
      .spor { stroke: rgba(128,128,128,.24); }
      .fyll { stroke: var(--green, #4caf50); transition: stroke-dashoffset .6s cubic-bezier(.2,.7,.3,1); }
      .hero[data-sone="gul"] .fyll { stroke: var(--yellow, #f2c94c); }
      .hero[data-sone="oransje"] .fyll { stroke: var(--orange, #fc6d09); }
      .hero[data-sone="rod"] .fyll, .hero[data-sone="kritisk"] .fyll { stroke: var(--red, #f44336); }
      .hero[data-sone="av"] .fyll, .hero[data-sone="fallback"] .fyll { stroke: rgba(128,128,128,.5); }
      .ringtall { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; }
      .ringtall span { font-size:13px; opacity:.6; }
      .heronavn { font-size:19px; font-weight:600; }
      .heroforklaring { font-size:13.5px; opacity:.75; line-height:1.4; margin-top:3px; }
      .herolinje { display:flex; gap:12px; font-size:12.5px; opacity:.6; margin-top:6px; }
      .herolinje ha-icon { --mdc-icon-size:15px; vertical-align:-3px; }
      .merke { font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:75px;
        background: rgba(128,128,128,.3); vertical-align:middle; }

      .faner { display:flex; gap:4px; padding:4px; border-radius:20px; overflow-x:auto;
        background: var(--gray200, var(--secondary-background-color)); scrollbar-width:none;
        max-width:100%; overscroll-behavior-x:contain; -webkit-overflow-scrolling:touch; }
      .faner::-webkit-scrollbar { display:none; }
      .underfaner { display:flex; gap:6px; margin:2px 0 10px; }
      .underfane { flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
        padding:9px 10px; border-radius:75px; font-size:13px; font-weight:600; cursor:pointer;
        background: rgba(128,128,128,.14); opacity:.7; }
      .underfane ha-icon { --mdc-icon-size:17px; }
      .underfane.aktiv { opacity:1; background: rgba(128,128,128,.28); }
      .bar { position:relative; height:8px; border-radius:75px; background: rgba(128,128,128,.18); margin:10px 0 6px; overflow:visible; }
      .bar-fyll { height:100%; border-radius:75px; background: var(--green, #4caf50); transition: width .4s; }
      .bar-fyll.f-advarsel { background: var(--orange, #fc6d09); }
      .bar-fyll.f-feil { background: var(--red, #f44336); }
      .bar-fyll.f-noytral { background: rgba(128,128,128,.4); }
      .bar-mark { position:absolute; top:-3px; width:2px; height:14px; background: rgba(128,128,128,.7); border-radius:2px; }
      .bar-tekst { display:flex; justify-content:space-between; font-size:11.5px; opacity:.6; padding-bottom:8px; }
      .b-noytral { background: rgba(128,128,128,.2); }
      .fane { flex:1 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px;
        padding:8px 12px; border-radius:16px; font-size:11.5px; cursor:pointer; opacity:.55;
        white-space:nowrap; transition: background .18s, opacity .18s; }
      .fane ha-icon { --mdc-icon-size:20px; }
      .fane.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; font-weight:600; }

      .blokk { background: var(--gray200, var(--secondary-background-color));
        border-radius:24px; padding:8px 14px 14px; max-width:100%; overflow:hidden; }
      .blokk + .blokk { margin-top:10px; }
      .hode { display:flex; justify-content:space-between; align-items:center; gap:10px;
        font-size:14.5px; font-weight:600; opacity:.7; padding:8px 4px; min-width:0; }
      .hode > span:first-child { display:flex; align-items:center; gap:6px; min-width:0; flex:1 1 auto; }
      .hodeikon { --mdc-icon-size:18px; opacity:.9; flex:0 0 auto; }
      .sub { font-weight:500; text-align:right; font-size:12.5px; flex:0 1 auto; min-width:0;
        overflow-wrap:anywhere; max-width:60%; }
      .dempet { opacity:.4; pointer-events:none; }
      .hero { position:relative; }
      .heroknapp { position:absolute; top:10px; right:10px; cursor:pointer; opacity:.5; width:28px; height:28px;
        display:flex; align-items:center; justify-content:center; border-radius:50%; background: rgba(128,128,128,.14); }
      .heroknapp ha-icon { --mdc-icon-size:20px; }
      .herotekst { padding-right:26px; }
      .kollapsikon { --mdc-icon-size:20px; opacity:.6; transition: transform .2s; flex:0 0 auto; }
      .hode[data-handling="kollaps"] { cursor:pointer; user-select:none; }
      .blokk.lukket > *:not(.hode) { display:none; }
      .blokk.lukket .kollapsikon { transform: rotate(-90deg); }
      .blokk.lukket { padding-bottom:8px; }
      .hode .sub .bryter { margin:0; }
      .mini.aktiv { background: rgba(76,175,80,.25); }
      .mini ha-icon { --mdc-icon-size:15px; vertical-align:-3px; margin-right:4px; }
      .tidslinje { padding:30px 4px 6px; }
      .tl-spor { position:relative; height:44px; border-radius:8px; background: rgba(128,128,128,.14); overflow:visible; }
      .tl-spenn { position:absolute; top:12px; height:20px; border-radius:5px; background: rgba(128,128,128,.28); }
      .tl-spenn.dag { background: rgba(242,201,76,.35); }
      .tl-spenn.borte { background: rgba(128,128,128,.45); top:18px; height:8px; }
      .tl-mark { position:absolute; top:0; height:44px; width:0; }
      .tl-mark i { position:absolute; left:-1px; top:4px; width:2px; height:36px; background: currentColor; border-radius:2px; opacity:.9; }
      .tl-mark span { position:absolute; left:4px; font-size:10.5px; font-weight:600; white-space:nowrap; opacity:.85;
        transform: translateX(-50%); left:0; }
      .tl-mark span.over { top:-15px; } .tl-mark span.over2 { top:-28px; } .tl-mark span.under { bottom:-15px; }
      .tl-mark.ok { color: var(--green, #4caf50); } .tl-mark.noytral { color: rgba(128,128,128,.9); }
      .tl-mark.advarsel { color: var(--orange, #fc6d09); } .tl-mark.c { color: var(--purple, #9c27b0); } .tl-mark.s { color: var(--active-big, var(--primary-color)); }
      .tl-naa { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background: var(--primary-text-color); opacity:.5; }
      .tl-akse { display:flex; justify-content:space-between; font-size:10px; opacity:.5; padding-top:18px; font-variant-numeric:tabular-nums; }
      .tidpar { gap:8px; }
      .tidpar label { flex:1 1 0; min-width:0; display:flex; align-items:center; justify-content:space-between; gap:6px; }
      .tidpar label span { font-size:13px; font-weight:500; opacity:.85; }
      .tid.dempet { opacity:.4; }
      .sonetemp { flex:0 0 auto; }
      .sonekropp .stepper, .rad .stepper { flex:0 0 auto; }
      .stegverdi { min-width:64px; }
      .rad.kompakt { padding:4px 2px; }
      select.velger { font-family:inherit; font-size:14px; font-weight:600; color:inherit;
        background: rgba(128,128,128,.16); border:0; border-radius:75px; padding:6px 28px 6px 12px;
        -webkit-appearance:none; appearance:none; text-align:right; max-width:50%; min-width:96px; cursor:pointer;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='%23888' stroke-width='2'/></svg>");
        background-repeat:no-repeat; background-position:right 10px center; }
      select.velger:focus { outline:none; box-shadow:0 0 0 2px rgba(128,128,128,.35); }
      select.velger.mangler { opacity:.35; pointer-events:none; }
      select.velger option { color: initial; }
      .stepper { padding:1px; gap:1px; }
      .steg { width:26px; height:26px; font-size:16px; }
      input.stegverdi { width:58px; min-width:0; border:0; background:transparent; color:inherit; font:inherit;
        font-weight:600; font-size:13.5px; text-align:right; padding:0 2px; -moz-appearance:textfield; }
      input.stegverdi::-webkit-outer-spin-button, input.stegverdi::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
      input.stegverdi:focus { outline:none; background: rgba(128,128,128,.14); border-radius:8px; }
      .stepper .enhet { font-size:11px; opacity:.6; padding-right:4px; min-width:18px; }
      .radverdi.kort { white-space:nowrap; flex:0 0 auto; max-width:none; overflow:visible; }
      .sub-seksjon { margin-top:6px; border-top:1px solid rgba(128,128,128,.14); }
      .subhode { display:flex; align-items:center; gap:8px; padding:8px 2px; cursor:pointer; user-select:none;
        font-size:13px; font-weight:600; opacity:.75; }
      .subhode > span:first-child { flex:1 1 auto; }
      .subhode .sub { flex:0 1 auto; font-weight:500; opacity:.8; }
      .sub-seksjon.lukket .subkropp { display:none; }
      .sub-seksjon.lukket .kollapsikon { transform: rotate(-90deg); }
      .dogngraf { position:relative; height:120px; margin:26px 0 4px; }
      .dg-soyler { position:absolute; inset:0; display:flex; align-items:flex-end; gap:2px; }
      .dg-dag { flex:1 1 0; min-width:0; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; position:relative; }
      .dg-soyle { width:100%; border-radius:3px 3px 0 0; background: rgba(128,128,128,.32); min-height:0; }
      .dg-dag.topp .dg-soyle { background: var(--green, #4caf50); }
      .dg-dag.est .dg-soyle { background: repeating-linear-gradient(45deg, rgba(128,128,128,.5) 0 3px, rgba(128,128,128,.2) 3px 6px); }
      .dg-dag.ekstern .dg-soyle { background: repeating-linear-gradient(45deg, rgba(128,128,128,.35) 0 3px, transparent 3px 6px); border:1px dashed rgba(128,128,128,.6); }
      .dg-dag.idag .dg-soyle { outline:2px solid var(--primary-text-color); outline-offset:-2px; }
      .dg-dag span { font-size:9px; opacity:.55; height:12px; line-height:12px; }
      .dg-hull { position:absolute; top:-8px; width:5px; height:5px; border-radius:50%; background: var(--orange, #fc6d09); }
      .dg-linje { position:absolute; left:0; right:0; height:0; border-top:1px dashed rgba(128,128,128,.7); z-index:1; pointer-events:none; }
      .dg-linje.mal { border-color: var(--red, #f44336); }
      .dg-linje span { position:absolute; right:0; top:-14px; font-size:10px; opacity:.7; }
      .dg-linje.grense span { top:2px; }
      .s-est { background: repeating-linear-gradient(45deg, rgba(128,128,128,.5) 0 3px, rgba(128,128,128,.2) 3px 6px); }
      .s-ekst { border:1px dashed rgba(128,128,128,.7); }
      .dognplan { padding:8px 0 2px; }
      .dp-rad { display:grid; grid-template-columns:72px 1fr; align-items:center; gap:8px; height:34px; }
      .dp-navn { font-size:12px; font-weight:600; opacity:.75; text-align:right; padding-right:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dp-spor { position:relative; height:26px; border-radius:6px; background: rgba(128,128,128,.12);
        background-image: repeating-linear-gradient(90deg, rgba(128,128,128,.18) 0 1px, transparent 1px 12.5%); }
      .dp-spenn { position:absolute; top:3px; height:20px; border-radius:5px; background: rgba(128,128,128,.35); overflow:hidden; }
      .dp-spenn span { font-size:10.5px; font-weight:600; line-height:20px; padding:0 6px; white-space:nowrap; opacity:.9; }
      .dp-spenn.dag, .dp-spenn.ok { background: rgba(76,175,80,.4); }
      .dp-spenn.c { background: rgba(156,39,176,.4); } .dp-spenn.s { background: rgba(33,150,243,.4); }
      .dp-spenn.borte { background: rgba(128,128,128,.55); top:9px; height:8px; } .dp-spenn.borte span { display:none; }
      .dp-spenn.advarsel { background: rgba(252,109,9,.4); }
      .dp-mark { position:absolute; top:0; height:26px; width:0; }
      .dp-mark i { position:absolute; left:-1.5px; top:2px; width:3px; height:22px; border-radius:2px; background: currentColor; }
      .dp-mark span { position:absolute; left:5px; top:5px; font-size:10.5px; font-weight:600; white-space:nowrap; }
      .dp-mark.ok { color: var(--green, #4caf50); } .dp-mark.noytral { color: rgba(128,128,128,.95); } .dp-mark.advarsel { color: var(--orange, #fc6d09); }
      .dp-naa { position:absolute; top:-3px; bottom:-3px; width:2px; margin-left:-1px; background: var(--primary-text-color); opacity:.55; }
      .dp-akse { height:16px; } .dp-akse .dp-spor { background:none; height:14px; display:flex; justify-content:space-between; font-size:9.5px; opacity:.5; font-variant-numeric:tabular-nums; }
      .dp-akse .dp-spor span { width:0; }
      .mnd { cursor:pointer; height:30px; font-size:10px; }
      .mnd.venter { outline:2px dashed var(--orange, #fc6d09); outline-offset:-2px; }
      .s-dag { background: rgba(242,201,76,.5); } .s-borte { background: rgba(128,128,128,.4); }
      .mstripe { display:grid; grid-template-columns:repeat(12,1fr); gap:3px; padding:8px 0 2px; }
      .mnd { height:26px; border-radius:6px; background: rgba(128,128,128,.14); display:flex; align-items:center; justify-content:center; font-size:10.5px; opacity:.85; }
      .mnd.inne { background: var(--green, #4caf50); color:#fff; }
      .mnd.naa { outline:2px solid var(--primary-text-color); outline-offset:-2px; }
      .skrubb { position:absolute; inset:0; pointer-events:none; }
      .skrubblinje { position:absolute; top:0; bottom:6px; width:1px; background: var(--primary-text-color); opacity:.6; }
      .skrubbtekst { position:absolute; top:4px; font-size:11px; padding:3px 7px; border-radius:8px; white-space:nowrap;
        background: var(--card-background-color, #fff); box-shadow:0 1px 4px rgba(0,0,0,.2); font-variant-numeric:tabular-nums; }
      .graf { touch-action:none; cursor:crosshair; }
      .tegnforklaring .live { margin-left:auto; font-variant-numeric:tabular-nums; }
      .tegnforklaring .grafles { flex-basis:100%; opacity:.5; font-size:11px; }
      .pulser { display:inline-block; width:8px; height:8px; border-radius:50%; background: var(--green, #4caf50); margin-right:4px;
        animation: kipuls 1.6s ease-in-out infinite; }
      @keyframes kipuls { 0%,100% { opacity:1; } 50% { opacity:.3; } }
      .herodetaljer { grid-column:1 / -1; border-top:1px solid rgba(128,128,128,.18); padding-top:10px; }
      .tanke { font-size:13.5px; line-height:1.5; padding:3px 0 3px 12px; position:relative; overflow-wrap:anywhere; }
      .tanke::before { content:""; position:absolute; left:0; top:11px; width:5px; height:5px; border-radius:50%;
        background: rgba(128,128,128,.6); }
      .fakta ha-icon { --mdc-icon-size:14px; vertical-align:-3px; margin-right:3px; }
      .stripe { display:grid; grid-template-columns:repeat(24, 1fr); gap:2px; height:64px; align-items:end;
        padding:6px 0 0; }
      .time { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; min-width:0; }
      .time .soyle { width:100%; border-radius:3px 3px 0 0; background: rgba(128,128,128,.28); }
      .time.vindu .soyle { background: rgba(128,128,128,.45); }
      .time.valgt .soyle { background: var(--green, #4caf50); }
      .time.naa .soyle { outline:2px solid var(--primary-text-color); outline-offset:-2px; }
      .time span { font-size:9px; opacity:.55; height:12px; line-height:12px; font-variant-numeric:tabular-nums; }
      .stripeforklaring { display:flex; flex-wrap:wrap; gap:10px; font-size:11.5px; opacity:.65; padding:2px 0 10px; }
      .stripeforklaring i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
      .s-valgt { background: var(--green, #4caf50); } .s-vindu { background: rgba(128,128,128,.45); } .s-pris { background: rgba(128,128,128,.28); }
      .notat { font-size:12.5px; opacity:.6; padding:8px 2px 0; line-height:1.45;
        overflow-wrap:anywhere; }
      .stor { font-size:30px; font-weight:600; padding:4px 2px; font-variant-numeric:tabular-nums; }
      .stor small { font-size:14px; font-weight:500; opacity:.55; }
      .konklusjon { font-size:14.5px; line-height:1.5; padding:4px 2px 10px;
        overflow-wrap:anywhere; }
      .varsel { margin-top:10px; padding:10px 12px; border-radius:14px; font-size:13px;
        background: rgba(244,67,54,.18); }

      .tallrad { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .tallrad.fire { grid-template-columns:repeat(4,1fr); }
      .tall { background: rgba(128,128,128,.12); border-radius:16px; padding:10px 6px; text-align:center; }
      .tall b { display:block; font-size:18px; font-variant-numeric:tabular-nums; }
      .tall span { font-size:11px; opacity:.6; }
      .spor2 { height:10px; border-radius:6px; background: rgba(128,128,128,.24);
        overflow:hidden; margin:10px 0 6px; }
      .fyll2 { height:100%; background: var(--active-big, var(--primary-color)); transition: width .5s ease; }
      .under { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; opacity:.6; }

      .rutenett { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .chip { display:grid; grid-template-columns:50px 1fr; align-items:center; gap:8px; height:60px;
        padding-left:4px; border-radius:75px; cursor:pointer; background: rgba(128,128,128,.12);
        transition: background .18s, color .18s; }
      .chip.pa { background: var(--active-big, var(--primary-color)); color: var(--gray100,#fafbfc); }
      .chipikon { width:50px; height:50px; border-radius:50%; display:flex; align-items:center;
        justify-content:center; background: rgba(128,128,128,.16); }
      .chipikon ha-icon { --mdc-icon-size:22px; }
      .chipnavn { font-size:14px; font-weight:500; }
      .chipsub { font-size:12px; opacity:.65; }

      .rad { display:flex; align-items:center; gap:10px; padding:9px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-les { cursor:pointer; }
      .radtekst { flex:1 1 auto; min-width:0; }
      .radnavn { font-size:14.5px; font-weight:500; overflow-wrap:anywhere; }
      .radsub { font-size:12.5px; opacity:.6; line-height:1.35; overflow-wrap:anywhere; }
      .radverdi { font-size:13.5px; font-weight:600; opacity:.85; flex:0 1 auto;
        font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right;
        overflow:hidden; text-overflow:ellipsis; max-width:50%; min-width:0; }
      /* Lange verdier, som råattributter og entitets-ID-er, skal brekke i
         stedet for å presse kortet ut i bredden. */
      .radverdi.brytbar { white-space:normal; overflow-wrap:anywhere;
        text-overflow:clip; max-width:60%; }
      .hjelplinje { font-size:12px; font-weight:600; opacity:.5; padding:10px 2px 2px; }
      .hjelp { display:inline-flex; align-items:center; justify-content:center;
        width:17px; height:17px; min-width:17px; border-radius:50%; cursor:pointer;
        font-size:11px; font-weight:700; margin-left:6px; vertical-align:1px;
        background: rgba(128,128,128,.28); opacity:.8; user-select:none; }
      .hjelp:active { transform: scale(.9); }
      .hjelptekst { font-size:12.5px; line-height:1.5; opacity:.75; overflow-wrap:anywhere;
        margin:2px 0 8px; padding:10px 12px; border-radius:14px;
        background: rgba(128,128,128,.12); }
      .prikk { width:10px; height:10px; min-width:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .p-ok { background: var(--green, #4caf50); }
      .p-advarsel { background: var(--orange, #fc6d09); }
      .p-feil { background: var(--red, #f44336); }
      .p-noytral { background: rgba(128,128,128,.45); }
      .badge { font-size:11px; font-weight:600; padding:2px 8px; border-radius:75px;
        background: rgba(128,128,128,.2); }
      .b-ok { background: rgba(76,175,80,.25); }
      .b-advarsel { background: rgba(252,109,9,.25); }
      .b-feil { background: rgba(244,67,54,.25); }

      .sone { border-radius:18px; background: rgba(128,128,128,.10); margin-bottom:6px; overflow:hidden; }
      .sonehode { display:flex; align-items:center; gap:10px; padding:10px; cursor:pointer; }
      .sonetemp { text-align:right; white-space:nowrap; }
      .sonetemp b { font-size:16px; font-variant-numeric:tabular-nums; }
      .sonetemp span { display:block; font-size:11.5px; opacity:.55; }
      .sonekropp { display:none; padding:0 10px 10px; }
      .sone.apen .sonekropp { display:block; }
      .fakta { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; opacity:.75;
        padding-bottom:6px; max-width:100%; }
      .fakta span:not(.badge) { background: rgba(128,128,128,.16); padding:3px 9px; border-radius:75px; }

      .stepper { display:flex; align-items:center; gap:2px; background: rgba(128,128,128,.16);
        border-radius:75px; padding:2px; }
      .steg { width:32px; height:32px; border-radius:50%; display:flex; align-items:center;
        justify-content:center; font-size:19px; cursor:pointer; user-select:none;
        background: rgba(128,128,128,.18); }
      .steg:active { transform: scale(.93); }
      .stegverdi { min-width:74px; text-align:center; font-size:14.5px; font-weight:600;
        font-variant-numeric:tabular-nums; }
      .stepper.mangler { opacity:.35; pointer-events:none; }

      .ovblokk { border-top:1px solid rgba(128,128,128,.16); margin-top:6px; padding-top:8px; }
      .undertittel { font-size:12.5px; font-weight:600; opacity:.55; padding-bottom:6px; }
      .heronavn, .heroforklaring, .herolinje { min-width:0; overflow-wrap:anywhere; }
      .herotekst { min-width:0; }
      .tall b { overflow-wrap:anywhere; }
      .ovrad { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .ovverdi { min-width:50px; text-align:center; font-size:15px; font-weight:600;
        font-variant-numeric:tabular-nums; }
      .knapp { padding:8px 14px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.18); }
      .knapp.rod { background: rgba(244,67,54,.22); }

      .bryter { width:46px; height:28px; min-width:46px; border-radius:75px; cursor:pointer;
        position:relative; background: rgba(128,128,128,.28); transition: background .18s; }
      .bryter.on { background: var(--active-big, var(--primary-color)); }
      .bryter span { position:absolute; top:3px; left:3px; width:22px; height:22px;
        border-radius:50%; background:#fff; transition: transform .18s; }
      .bryter.on span { transform: translateX(18px); }
      .bryter.mangler { opacity:.3; pointer-events:none; }

      .tid, .tekst { font-family:inherit; font-size:14.5px; font-weight:600;
        color: var(--gray1000, var(--primary-text-color)); background: rgba(128,128,128,.16);
        border:none; border-radius:75px; padding:9px 14px; text-align:center; }
      .tekst { width:100%; box-sizing:border-box; text-align:left; border-radius:16px; font-weight:400; }

      .graf { position:relative; height:96px; margin:4px 0 2px; }
      .graf svg { width:100%; height:90px; }
      .graf polyline { fill:none; stroke-width:2; vector-effect:non-scaling-stroke; }
      .graf .l1 { stroke: var(--active-big, var(--primary-color)); }
      .graf .l2 { stroke: var(--orange, #fc6d09); }
      .graf .grense { stroke: var(--red, #f44336); stroke-width:1; stroke-dasharray:4 4;
        vector-effect:non-scaling-stroke; }
      .grafakse { position:absolute; top:0; right:2px; height:90px; display:flex;
        flex-direction:column; justify-content:space-between; font-size:10.5px; opacity:.45; }
      .grafvent { display:flex; align-items:center; justify-content:center; height:90px;
        font-size:12.5px; opacity:.5; text-align:center; padding:0 12px;
        overflow-wrap:anywhere; line-height:1.4; }
      .tegnforklaring { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:12px; opacity:.6; padding-top:4px; }
      .tegnforklaring i { display:inline-block; width:12px; height:3px; border-radius:2px;
        margin-right:5px; vertical-align:middle; }
      .tegnforklaring .l1 { background: var(--active-big, var(--primary-color)); }
      .tegnforklaring .l2 { background: var(--orange, #fc6d09); }

      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px;
        cursor:pointer; background: rgba(128,128,128,.16); }

      .logg { padding:10px 2px; }
      .logg + .logg { border-top:1px solid rgba(128,128,128,.14); }
      .loggtopp { display:flex; align-items:center; gap:8px; font-size:12px; }
      .loggtid { font-weight:600; font-variant-numeric:tabular-nums; }
      .loggtall { margin-left:auto; opacity:.6; font-variant-numeric:tabular-nums; }
      .loggtekst { font-size:13px; opacity:.8; margin-top:4px; line-height:1.4;
        overflow-wrap:anywhere; }
      .tiltak { margin:6px 0 0; padding-left:18px; font-size:12.5px; opacity:.62;
        line-height:1.45; overflow-wrap:anywhere; }

      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
      @media (max-width: 400px) {
        .hero { grid-template-columns:78px 1fr; gap:10px; padding:12px; }
        .steg { width:28px; height:28px; font-size:17px; }
        .stegverdi { min-width:56px; font-size:13.5px; }
        .ring, .ring svg { width:74px; height:74px; }
        .fane span { display:none; }
        .fane { flex:1; padding:10px 8px; }
        .rutenett { grid-template-columns:1fr; }
      }
    `;
  }
}

window.KI.define("ki-klima-pro-card", KiKlimaProCard);

/* ------------------------------------------------------------------ */

class KiKlimaProCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  setConfig(config) {
    this._config = Object.assign({ default_tab: "oversikt", remember_tab: true }, config || {});
    this._tegn();
  }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _tegn() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = [
        { name: "title", selector: { text: {} } },
        { name: "default_tab", selector: { select: { mode: "dropdown", options:
          FANER.map((f) => ({ value: f.id, label: f.navn })) } } },
        { name: "remember_tab", selector: { boolean: {} } },
      ];
      this._form.computeLabel = (s) => ({ title: "Tittel (valgfri)",
        default_tab: "Standardfane", remember_tab: "Husk valgt fane" }[s.name] || s.name);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true }));
      });
      this.shadowRoot.appendChild(this._form);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

window.KI.define("ki-klima-pro-card-editor", KiKlimaProCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-klima-pro-card",
  name: "KI Klima Pro",
  description: "Hele klima- og energisystemet: status, soner, energi, varmtvann, motorens resonnement og logg",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-klima-pro-card feilet", e); }

/* ===== ki-ruter-card ===== */
try {
/**
 * ki-ruter-card.js  —  v1.0.0
 *
 * Kollektivavganger fra Entur-sensorer, med avviksvarsler fra Ruter.
 *
 *   • Avgangstavle per holdeplass: linjenummer, destinasjon, klokkeslett
 *     og nedtelling. Forsinkelser vises i oransje.
 *   • Nedtellingen oppdateres hvert tiende sekund uten å vente på HA
 *   • Avviksbanner øverst når det er meldinger, med linjer som chips
 *   • Full GUI-editor med automatisk oppdaging av transport-sensorer
 *
 * Legges i /config/www/ki-ruter-card.js og registreres som
 * JavaScript Module: /local/ki-ruter-card.js
 */

const KI_RUTER_VERSION = "1.0.0";

console.info(
  `%c KI-RUTER-CARD %c ${KI_RUTER_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#e11d48;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── verktøy ── */

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** «12:34» fra ISO-tid, klokkeslett eller Date. */
const klokke = (v) => {
  if (!v) return "";
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
};

/** Minutter til avgang, regnet ut fra tidspunktet hvis mulig. */
const minutterTil = (v) => {
  if (!v) return null;
  let d;
  if (typeof v === "string" && /^\d{1,2}:\d{2}/.test(v)) {
    const [t, m] = v.split(":").map(Number);
    d = new Date();
    d.setHours(t, m, 0, 0);
    // Passert med mer enn seks timer betyr sannsynligvis i morgen
    if (d.getTime() - Date.now() < -6 * 3600000) d.setDate(d.getDate() + 1);
  } else {
    d = new Date(v);
  }
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 60000);
};

const nedtelling = (min) => {
  if (min === null) return "";
  if (min <= 0) return "nå";
  if (min < 60) return `${min} min`;
  const t = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${t} t ${r} min` : `${t} t`;
};

/** Skiller «21 Helsfyr» i linjenummer og destinasjon. */
const delRute = (rute) => {
  const s = String(rute || "").trim();
  const m = s.match(/^([0-9]+[A-Za-z]?)\s+(.*)$/);
  if (m) return { linje: m[1], mal: m[2] };
  return { linje: "", mal: s };
};

/**
 * Leser avgangene ut av en Entur-sensor. Integrasjonen legger den første
 * avgangen i umerkede attributter og resten som route_1, due_at_1 osv.
 */
const forsinkMin = (v, enhet) => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  if (enhet === "min") return n;
  if (enhet === "s") return n / 60;
  // auto: Entur oppgir sekunder, men noen oppsett bruker minutter.
  // Verdier på 60 og over tolkes som sekunder.
  return Math.abs(n) >= 60 ? n / 60 : n;
};

const lesAvganger = (s, maks, forsinkEnhet) => {
  if (!s || !s.attributes) return [];
  const a = s.attributes;
  const ut = [];

  const legg = (rute, tid, forsinkelse, sanntid) => {
    if (!rute && !tid) return;
    ut.push({
      ...delRute(rute),
      rute,
      tid,
      forsinkelse: forsinkMin(forsinkelse, forsinkEnhet),
      sanntid: sanntid !== false,
    });
  };

  legg(a.route, a.due_at || a.next_due_at, a.delay, a.real_time);
  for (let i = 1; i <= 12; i++) {
    if (a[`route_${i}`] === undefined && a[`due_at_${i}`] === undefined) continue;
    legg(a[`route_${i}`], a[`due_at_${i}`], a[`delay_${i}`], a[`real_time_${i}`]);
  }

  // Første avgang kan mangle tid; da står den i selve tilstanden
  if (ut.length && !ut[0].tid && s.state && s.state !== "unknown") ut[0].tid = s.state;

  return ut
    .filter((x) => x.tid)
    .map((x) => ({ ...x, min: a.next_due_in !== undefined && ut.indexOf(x) === 0
        ? parseInt(a.next_due_in)
        : minutterTil(x.tid) }))
    .filter((x) => x.min === null || x.min >= -2)
    .slice(0, maks || 4);
};

const IKON_MODUS = {
  bus: "mdi:bus",
  tram: "mdi:tram",
  metro: "mdi:subway-variant",
  rail: "mdi:train",
  train: "mdi:train",
  water: "mdi:ferry",
  ferry: "mdi:ferry",
  air: "mdi:airplane",
};

const STANDARD_KONFIG = () => ({
  type: "custom:ki-ruter-card",
  title: "Kollektiv",
  title_icon: "mdi:bus-clock",
  max_departures: 4,
  delay_unit: "auto",
  stops: [
    { entity: "sensor.transport_majorstuen", name: "Majorstuen", icon: "mdi:subway-variant" },
    { entity: "sensor.transport_smestad", name: "Smestad", icon: "mdi:subway-variant" },
    { entity: "sensor.transport_bislett", name: "Bislett", icon: "mdi:tram" },
    { entity: "sensor.transport_homansbyen", name: "Homansbyen", icon: "mdi:tram" },
    { entity: "sensor.transport_hovseter", name: "Hovseter", icon: "mdi:subway-variant" },
  ],
  disruptions: {
    summary: "sensor.ruter_disruption_summary",
    lines: [
      { entity: "sensor.ruter_disruption_rut_line_1", name: "1" },
      { entity: "sensor.ruter_disruption_rut_line_2", name: "2" },
      { entity: "sensor.ruter_disruption_rut_line_12", name: "12" },
      { entity: "sensor.ruter_disruption_rut_line_13", name: "13" },
      { entity: "sensor.ruter_disruption_rut_line_15", name: "15" },
      { entity: "sensor.ruter_disruption_rut_line_19", name: "19" },
      { entity: "sensor.ruter_disruption_rut_line_45", name: "45" },
      { entity: "sensor.ruter_disruption_rut_line_46", name: "46" },
    ],
  },
});

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiRuterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apneStopp = new Set();
    this._visAvvik = false;
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-ruter-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.stops) this._config.stops = [];
    if (!this._config.disruptions) this._config.disruptions = {};
    this._signatur = "";
    this._bygget = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._tegn();
  }

  getCardSize() {
    return 4 + (this._config.stops || []).length * 2;
  }

  connectedCallback() {
    // Nedtellingen må gå selv om HA ikke sender nye tilstander
    this._timer = setInterval(() => {
      this._signatur = "";
      if (this._hass && this._bygget) this._tegn();
    }, 10000);
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiRuterCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => {
      const el = e.target.closest("[data-handling]");
      if (!el) return;
      const h = el.dataset.handling;
      if (h === "avvik") {
        this._visAvvik = !this._visAvvik;
        this._signatur = "";
        this._tegn();
      } else if (h === "stopp") {
        const i = el.dataset.stopp;
        if (this._apneStopp.has(i)) this._apneStopp.delete(i);
        else this._apneStopp.add(i);
        this._signatur = "";
        this._tegn();
      } else if (h === "mer-info" && el.dataset.entity) {
        const ev = new Event("hass-more-info", { bubbles: true, composed: true });
        ev.detail = { entityId: el.dataset.entity };
        this.dispatchEvent(ev);
      }
    });
    this._bygget = true;
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const hass = this._hass;
    const cfg = this._config;
    const maks = cfg.max_departures || 4;

    const stopp = (cfg.stops || [])
      .map((st) => {
        const s = st.entity ? hass.states[st.entity] : null;
        return {
          ...st,
          navn: st.name || (s ? s.attributes.friendly_name : st.entity),
          avganger: lesAvganger(s, maks, cfg.delay_unit || "auto"),
          mangler: !s,
        };
      })
      .filter((st) => !st.mangler || st.entity);

    const d = cfg.disruptions || {};
    const sum = d.summary ? hass.states[d.summary] : null;
    const antAvvik = sum ? parseInt(sum.state) || 0 : 0;

    const sign = JSON.stringify([
      stopp.map((s) => s.avganger.map((a) => [a.rute, a.tid, a.min, a.forsinkelse])),
      antAvvik,
      (d.lines || []).map((l) => (hass.states[l.entity] ? hass.states[l.entity].state : null)),
      this._visAvvik,
      [...this._apneStopp].sort(),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._avvikHtml(sum, antAvvik)}
      ${this._linjerHtml()}
      ${stopp.map((st, i) => this._stoppHtml(st, i)).join("")}
    `;
  }

  _tittelHtml() {
    const t = this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(this._config.title_icon || "mdi:bus-clock")}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _avvikHtml(sum, ant) {
    if (!sum) return "";
    if (ant <= 0) {
      return `
        <div class="avvik ok" data-handling="mer-info" data-entity="${esc(
          this._config.disruptions.summary
        )}">
          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
          <span>Ingen meldte avvik</span>
        </div>`;
    }

    const tekst = [
      sum.attributes.markdown_active,
      sum.attributes.markdown_planned,
    ]
      .filter(Boolean)
      .join("\n")
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*/g, "")
      .trim();

    return `
      <div class="avvik varsel">
        <button type="button" class="avvik-hode" data-handling="avvik">
          <ha-icon icon="mdi:alert"></ha-icon>
          <span>${ant} ${ant === 1 ? "avvik" : "avvik"} i kollektivtrafikken</span>
          <ha-icon class="avvik-pil ${this._visAvvik ? "ned" : ""}"
            icon="mdi:chevron-down"></ha-icon>
        </button>
        ${
          this._visAvvik && tekst
            ? `<div class="avvik-tekst">${esc(tekst)}</div>`
            : ""
        }
      </div>`;
  }

  _linjerHtml() {
    const hass = this._hass;
    const linjer = (this._config.disruptions.lines || []).filter(
      (l) => l.entity && hass.states[l.entity]
    );
    if (!linjer.length) return "";

    return `
      <div class="linjer">
        ${linjer
          .map((l) => {
            const s = hass.states[l.entity];
            const n = parseInt(s.state) || 0;
            return `
            <button type="button" class="linje ${n > 0 ? "varsel" : ""}"
              data-handling="mer-info" data-entity="${esc(l.entity)}">
              ${esc(l.name || s.attributes.friendly_name || "")}
              ${n > 0 ? `<em>${n}</em>` : ""}
            </button>`;
          })
          .join("")}
      </div>`;
  }

  _stoppHtml(st, i) {
    const skjult = this._apneStopp.has(String(i));
    const ikon =
      st.icon ||
      IKON_MODUS[(st.mode || "").toLowerCase()] ||
      "mdi:bus";

    const neste = st.avganger[0];

    const rader = st.avganger
      .map((a) => {
        const forsinket = a.forsinkelse !== null && a.forsinkelse > 0.5;
        const naa = a.min !== null && a.min <= 1;
        return `
        <div class="avgang ${naa ? "naa" : ""}">
          <span class="linjenr" style="--linje-farge:${esc(
            st.color || "var(--active-big)"
          )}">${esc(a.linje || "–")}</span>
          <span class="mal">${esc(a.mal || a.rute || "")}</span>
          <span class="tider">
            <span class="ned">${esc(nedtelling(a.min))}</span>
            <span class="klokke">${esc(klokke(a.tid))}${
          forsinket ? `<em>+${Math.round(a.forsinkelse)}</em>` : ""
        }</span>
          </span>
        </div>`;
      })
      .join("");

    return `
      <section class="stopp">
        <header class="stopp-hode" data-handling="stopp" data-stopp="${i}">
          <span class="stopp-ikon"><ha-icon icon="${esc(ikon)}"></ha-icon></span>
          <span class="stopp-navn">
            ${esc(st.navn)}
            ${st.walk ? `<em>${esc(st.walk)} min å gå</em>` : ""}
          </span>
          <span class="stopp-neste">${
            neste ? esc(nedtelling(neste.min)) : st.mangler ? "Mangler" : "Ingen"
          }</span>
          <ha-icon class="stopp-pil ${skjult ? "" : "ned"}" icon="mdi:chevron-down"></ha-icon>
        </header>
        ${
          skjult
            ? ""
            : `<div class="avganger" data-handling="mer-info"
                data-entity="${esc(st.entity || "")}">
                ${rader || `<div class="ingen">Ingen avganger å vise</div>`}
              </div>`
        }
      </section>`;
  }
}

KiRuterCard.styles = `
  :host { display: block; }
  .rot { background: transparent; border: none; box-shadow: none; padding: 0; display: block; }
  .rot * { box-sizing: border-box; min-width: 0; }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad { display: flex; align-items: center; gap: 12px; padding: 0 4px 14px; }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px; flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1; font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }

  /* ---------- avvik ---------- */
  .avvik { border-radius: 18px; margin-bottom: 10px; overflow: hidden; }
  .avvik.ok {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; cursor: pointer;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 600;
    --mdc-icon-size: 19px;
  }
  .avvik.ok ha-icon { color: var(--green, #30a46c); }
  .avvik.varsel { background: var(--red, #e5484d); color: #fff; }
  .avvik-hode {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 13px 16px; background: none; color: inherit;
    font-size: 14px; font-weight: 600; text-align: left;
    --mdc-icon-size: 20px;
  }
  .avvik-hode > span { flex: 1; }
  .avvik-pil { transform: rotate(-90deg); transition: transform .2s ease; }
  .avvik-pil.ned { transform: rotate(0deg); }
  .avvik-tekst {
    padding: 0 16px 16px; font-size: 13px; line-height: 1.55;
    white-space: pre-wrap; opacity: .95;
  }

  /* ---------- linjechips ---------- */
  .linjer { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
  .linje {
    display: flex; align-items: center; gap: 5px;
    min-width: 38px; padding: 7px 11px;
    border-radius: 11px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 700;
    opacity: .55;
  }
  .linje.varsel {
    background: var(--orange, #f5a623); color: var(--black, #1c1c1e); opacity: 1;
  }
  .linje em {
    font-style: normal; font-size: 10px; font-weight: 700;
    background: rgba(0, 0, 0, .22); padding: 1px 5px; border-radius: 6px;
  }

  /* ---------- holdeplass ---------- */
  .stopp + .stopp { margin-top: 14px; }
  .stopp-hode {
    display: flex; align-items: center; gap: 11px;
    padding: 0 6px 9px; cursor: pointer;
  }
  .stopp-ikon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 18px; flex: 0 0 auto;
  }
  .stopp-navn {
    flex: 1; display: flex; flex-direction: column; gap: 1px;
    font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
    overflow: hidden;
  }
  .stopp-navn em {
    font-style: normal; font-size: 11px; font-weight: 500; opacity: .5;
  }
  .stopp-neste {
    font-size: 13px; font-weight: 700; opacity: .6;
    color: var(--gray1000, var(--primary-text-color));
    white-space: nowrap;
  }
  .stopp-pil {
    --mdc-icon-size: 18px; opacity: .4;
    color: var(--gray1000, var(--primary-text-color));
    transform: rotate(-90deg); transition: transform .2s ease;
  }
  .stopp-pil.ned { transform: rotate(0deg); }

  .avganger {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 4px 14px; cursor: pointer;
  }
  .avgang {
    display: grid; grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center; gap: 12px;
    padding: 11px 0;
    color: var(--gray1000, var(--primary-text-color));
  }
  .avgang + .avgang { border-top: 1px solid rgba(128, 128, 128, .16); }
  .linjenr {
    display: flex; align-items: center; justify-content: center;
    height: 30px; border-radius: 9px;
    background: var(--linje-farge, var(--active-big));
    color: var(--gray100, #fff);
    font-size: 14px; font-weight: 700;
  }
  .mal {
    font-size: 15px; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tider { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .ned {
    font-size: 15px; font-weight: 700;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .avgang.naa .ned { color: var(--green, #30a46c); }
  .klokke {
    font-size: 12px; font-weight: 500; opacity: .55;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .klokke em {
    font-style: normal; font-weight: 700;
    color: var(--orange, #f5a623); margin-left: 4px; opacity: 1;
  }
  .ingen { padding: 16px 0; font-size: 13px; opacity: .55; text-align: center;
    color: var(--gray1000, var(--primary-text-color)); }

  @media (max-width: 400px) {
    .avgang { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; }
    .mal { font-size: 14px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stopp-pil, .avvik-pil { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

class KiRuterCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.stops) this._config.stops = [];
    if (!this._config.disruptions) this._config.disruptions = {};
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange, type = "text") {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = type;
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = ["sensor"];
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  /** Finner holdeplass-sensorer og avvikslinjer i denne installasjonen. */
  _oppdag() {
    if (!this._hass) return;
    const alle = Object.keys(this._hass.states);

    // Hovedsensorene, ikke plattformene — de har ikke «_platform_» i navnet
    const stopp = alle
      .filter((id) => id.startsWith("sensor.transport_") && !id.includes("_platform_"))
      .sort();
    const nye = stopp.filter(
      (id) => !this._config.stops.some((s) => s.entity === id)
    );
    nye.forEach((id) => {
      const s = this._hass.states[id];
      this._config.stops.push({
        entity: id,
        name: (s.attributes.friendly_name || id)
          .replace(/^Transport\s+/i, "")
          .trim(),
        icon: "mdi:bus",
      });
    });

    const linjer = alle
      .filter((id) => /disruption.*_line_/.test(id))
      .sort((a, b) => {
        const n = (x) => parseInt((x.match(/_line_(\d+)/) || [])[1] || 0);
        return n(a) - n(b);
      });
    if (!this._config.disruptions.lines || !this._config.disruptions.lines.length) {
      this._config.disruptions.lines = linjer.map((id) => ({
        entity: id,
        name: (id.match(/_line_(\w+)/) || [])[1] || "",
      }));
    }
    if (!this._config.disruptions.summary) {
      const s = alle.find((id) => /disruption_summary$/.test(id));
      if (s) this._config.disruptions.summary = s;
    }

    this._svar = `La til ${nye.length} holdeplasser (${stopp.length} funnet totalt) og ${linjer.length} linjer.`;
    this._endret();
    this._tegn();
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiRuterCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tr = document.createElement("div");
    tr.className = "tokol";
    tr.appendChild(
      this._tekstfelt("Overskrift (tom = skjul)", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    tr.appendChild(
      this._ikonfelt(this._config.title_icon, (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tr);
    gen.appendChild(
      this._tekstfelt(
        "Avganger per holdeplass",
        this._config.max_departures || 4,
        (v) => {
          this._config.max_departures = parseInt(v) || 4;
          this._endret();
        },
        "number"
      )
    );
    const fv = document.createElement("label");
    fv.className = "felt";
    fv.innerHTML = "<span>Enhet på forsinkelse</span>";
    const sel = document.createElement("select");
    [["auto", "Gjett automatisk"], ["s", "Sekunder"], ["min", "Minutter"]].forEach(
      ([v, t]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = t;
        sel.appendChild(o);
      }
    );
    sel.value = this._config.delay_unit || "auto";
    sel.addEventListener("change", () => {
      this._config.delay_unit = sel.value;
      this._endret();
    });
    fv.appendChild(sel);
    gen.appendChild(fv);

    gen.appendChild(
      this._knapp("Finn holdeplasser automatisk", "hovedknapp", () => this._oppdag())
    );
    const h = document.createElement("p");
    h.className = "hjelp";
    h.textContent =
      "Legger til alle sensor.transport_* som ikke er plattformsensorer, og alle avvikslinjer.";
    gen.appendChild(h);
    if (this._svar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._svar;
      gen.appendChild(sv);
    }
    rot.appendChild(gen);

    /* Holdeplasser */
    const sb = document.createElement("div");
    sb.className = "boks";
    sb.innerHTML = "<h4>Holdeplasser</h4>";
    this._config.stops.forEach((st, si) => {
      const rad = document.createElement("div");
      rad.className = "stopprad";
      rad.appendChild(
        this._entitetsfelt("Sensor", st.entity, (v) => {
          st.entity = v;
          this._endret();
        })
      );
      const r2 = document.createElement("div");
      r2.className = "trekol";
      r2.appendChild(
        this._tekstfelt("Navn", st.name, (v) => {
          st.name = v;
          this._endret();
        })
      );
      r2.appendChild(this._ikonfelt(st.icon, (v) => {
        st.icon = v;
        this._endret();
      }));
      r2.appendChild(
        this._tekstfelt("Gangtid (min)", st.walk, (v) => {
          if (v) st.walk = parseInt(v);
          else delete st.walk;
          this._endret();
        }, "number")
      );
      rad.appendChild(r2);
      const verktoy = document.createElement("div");
      verktoy.className = "verktoy";
      if (si > 0)
        verktoy.appendChild(
          this._knapp("↑", "mini", () => {
            const [x] = this._config.stops.splice(si, 1);
            this._config.stops.splice(si - 1, 0, x);
            this._endret();
            this._tegn();
          })
        );
      if (si < this._config.stops.length - 1)
        verktoy.appendChild(
          this._knapp("↓", "mini", () => {
            const [x] = this._config.stops.splice(si, 1);
            this._config.stops.splice(si + 1, 0, x);
            this._endret();
            this._tegn();
          })
        );
      verktoy.appendChild(
        this._knapp("Slett", "mini fare", () => {
          this._config.stops.splice(si, 1);
          this._endret();
          this._tegn();
        })
      );
      rad.appendChild(verktoy);
      sb.appendChild(rad);
    });
    sb.appendChild(
      this._knapp("+ Legg til holdeplass", "hovedknapp liten", () => {
        this._config.stops.push({ entity: "", name: "", icon: "mdi:bus" });
        this._endret();
        this._tegn();
      })
    );
    rot.appendChild(sb);

    /* Avvik */
    const ab = document.createElement("div");
    ab.className = "boks";
    ab.innerHTML = "<h4>Avvik</h4>";
    ab.appendChild(
      this._entitetsfelt("Sammendrag", this._config.disruptions.summary, (v) => {
        this._config.disruptions.summary = v;
        this._endret();
      })
    );
    const lb = document.createElement("div");
    lb.className = "underboks";
    lb.innerHTML = "<div class='undertittel'>Linjer</div>";
    (this._config.disruptions.lines || []).forEach((l, li) => {
      const rad = document.createElement("div");
      rad.className = "entrad";
      rad.appendChild(
        this._entitetsfelt("Sensor", l.entity, (v) => {
          l.entity = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._tekstfelt("Vises som", l.name, (v) => {
          l.name = v;
          this._endret();
        })
      );
      rad.appendChild(
        this._knapp("×", "mini fare", () => {
          this._config.disruptions.lines.splice(li, 1);
          this._endret();
          this._tegn();
        })
      );
      lb.appendChild(rad);
    });
    lb.appendChild(
      this._knapp("+ Legg til linje", "hovedknapp liten", () => {
        if (!this._config.disruptions.lines) this._config.disruptions.lines = [];
        this._config.disruptions.lines.push({ entity: "", name: "" });
        this._endret();
        this._tegn();
      })
    );
    ab.appendChild(lb);
    rot.appendChild(ab);
  }
}

KiRuterCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input, .felt select {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .trekol { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .stopprad {
    border: 1px solid var(--divider-color); border-radius: 10px;
    padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  .verktoy { display: flex; gap: 6px; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 6px 10px; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  @media (max-width: 500px) { .tokol, .trekol { grid-template-columns: 1fr; } }
`;

window.KI.define("ki-ruter-card", KiRuterCard);
window.KI.define("ki-ruter-card-editor", KiRuterCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-ruter-card",
  name: "KI Ruter",
  description: "Kollektivavganger fra Entur med avviksvarsler.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-ruter-card feilet", e); }

/* ===== ki-stromregning-card ===== */
try {
/**
 * ki-stromregning-card.js  —  v1.0.0
 *
 * Strømregning, nettleie og Norgespris i samme designspråk som
 * ki-energi-card, ki-alarm-card og ki-kamera-card.
 *
 *   • Periodebryter: denne måneden / forrige måned
 *   • Regningsspesifikasjon med linjer, fortegn og sum
 *   • Forbruksfordeling dagtariff mot natt/helg
 *   • Norgespris: aktiv nå, prisforskjell mot spot, besparelse
 *   • Kapasitetsledd hos Elvia: trinn, margin til neste, toppforbruk
 *   • Knapp for fakturaverifiserings-rapport
 *   • Full GUI-editor
 *
 * Legges i /config/www/ki-stromregning-card.js og registreres som
 * JavaScript Module: /local/ki-stromregning-card.js
 */

const KI_STROM_VERSION = "1.1.0";

console.info(
  `%c KI-STROMREGNING-CARD %c ${KI_STROM_VERSION} `,
  "background:#2b2b2e;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px",
  "background:#30a46c;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px"
);

/* ────────────────────────────────────────────────────────────── verktøy ── */

const esc = (s) =>
  String(s === undefined || s === null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const tall = (hass, id) => {
  if (!id || !hass || !hass.states[id]) return null;
  const v = parseFloat(hass.states[id].state);
  return isNaN(v) ? null : v;
};

const enhetFor = (hass, id) => {
  const s = id && hass ? hass.states[id] : null;
  return s && s.attributes ? s.attributes.unit_of_measurement || "" : "";
};

/** Formaterer etter enheten på entiteten: kroner, kWh, kW eller rå tekst. */
const fmt = (v, enhet) => {
  if (v === null || v === undefined) return "–";
  const e = (enhet || "").toLowerCase();
  let des = 2;
  if (e.includes("kwh")) des = 1;
  else if (e === "kw") des = 2;
  else if (Math.abs(v) >= 100) des = 0;
  const t = v.toLocaleString("nb-NO", {
    minimumFractionDigits: des,
    maximumFractionDigits: des,
  });
  return enhet ? `${t} ${enhet}` : t;
};

const fmtEnt = (hass, id) => fmt(tall(hass, id), enhetFor(hass, id));

const STANDARD_KONFIG = () => ({
  type: "custom:ki-stromregning-card",
  title: "Strømregning",
  title_icon: "mdi:file-document-outline",
  periods: [
    {
      name: "Denne måneden",
      total: "sensor.manedlig_forbruk_estimert_manedskostnad",
      total_label: "Estimert månedskostnad",
      accumulated: "sensor.manedlig_forbruk_akkumulert_stromkostnad",
      today: "sensor.manedlig_forbruk_dagens_kostnad",
      consumption_day: "sensor.manedlig_forbruk_manedlig_forbruk_dagtariff",
      consumption_night: "sensor.manedlig_forbruk_manedlig_forbruk_natt_helg",
      consumption_total: "sensor.manedlig_forbruk_manedlig_forbruk_totalt",
      lines: [
        {
          name: "Strøm",
          entity: "sensor.manedlig_forbruk_akkumulert_stromkostnad",
          icon: "mdi:flash",
          color: "var(--orange)",
        },
        {
          name: "Nettleie",
          entity: "sensor.manedlig_forbruk_manedlig_nettleie",
          icon: "mdi:transmission-tower",
          color: "var(--blue)",
        },
        {
          name: "Avgifter",
          entity: "sensor.manedlig_forbruk_manedlig_avgifter",
          icon: "mdi:bank-outline",
          color: "var(--gray800)",
        },
        {
          name: "Strømstøtte",
          entity: "sensor.manedlig_forbruk_manedlig_stromstotte",
          icon: "mdi:hand-coin-outline",
          color: "var(--green)",
          sign: -1,
        },
        {
          name: "Norgespris-kompensasjon",
          entity: "sensor.manedlig_forbruk_norgespris_kompensasjon",
          icon: "mdi:cash-refund",
          color: "var(--green)",
          sign: -1,
        },
      ],
    },
    {
      name: "Forrige måned",
      total: "sensor.forrige_maned_forrige_maned_nettleie",
      total_label: "Nettleie forrige måned",
      consumption_day: "sensor.forrige_maned_forrige_maned_forbruk_dagtariff",
      consumption_night: "sensor.forrige_maned_forrige_maned_forbruk_natt_helg",
      consumption_total: "sensor.forrige_maned_forrige_maned_forbruk_totalt",
      report_button: "button.forrige_maned_lag_fakturaverifiserings_rapport",
      lines: [
        {
          name: "Nettleie",
          entity: "sensor.forrige_maned_forrige_maned_nettleie",
          icon: "mdi:transmission-tower",
          color: "var(--blue)",
        },
        {
          name: "Norgespris-kompensasjon",
          entity: "sensor.forrige_maned_forrige_maned_norgespris_kompensasjon",
          icon: "mdi:cash-refund",
          color: "var(--green)",
          sign: -1,
        },
        {
          name: "Toppforbruk",
          entity: "sensor.forrige_maned_forrige_maned_toppforbruk",
          icon: "mdi:speedometer",
          color: "var(--red)",
          no_sum: true,
        },
      ],
    },
  ],
  norgespris: {
    active: "binary_sensor.norgespris_norgespris_aktiv_na",
    price: "sensor.norgespris_total_strompris_norgespris",
    price_raw: "sensor.norgespris_strompris_norgespris_uten_nettleie",
    diff: "sensor.norgespris_prisforskjell_norgespris",
    spot: "sensor.stromstotte_total_strompris_etter_stotte",
    saving: "sensor.manedlig_forbruk_norgespris_besparelse",
    compensation: "sensor.manedlig_forbruk_norgespris_kompensasjon",
    support_active: "binary_sensor.stromstotte_stromstotte_aktiv_na",
    support: "sensor.stromstotte_stromstotte",
    support_left: "sensor.stromstotte_stromstotte_gjenstaende",
  },
  savings: {
    label: "Norgespris-besparelse",
    hour: "sensor.norgespris_besparelse_time",
    day: "sensor.norgespris_besparelse_dag",
    week: "sensor.norgespris_besparelse_uke",
    month: "sensor.norgespris_besparelse_maned",
    year: "sensor.norgespris_besparelse_ar",
  },
  capacity: {
    step: "sensor.nettleie_elvia_kapasitetstrinn",
    next_threshold: "sensor.neste_effektledd_terskel",
    manual_peak: "input_number.effekt_topp_1",
    power_cost: "sensor.effektledd_kostnad",
    fixed_cost: "sensor.fastledd_kostnad",
    estimate: "sensor.stromregning_estimate",
    step_number: "sensor.nettleie_elvia_kapasitetstrinn_nummer",
    interval: "sensor.nettleie_elvia_kapasitetstrinn_intervall",
    margin: "sensor.nettleie_elvia_margin_til_neste_trinn",
    warning: "binary_sensor.nettleie_elvia_kapasitetsvarsel",
    peak_avg: "sensor.nettleie_elvia_snitt_toppforbruk",
    peaks: [
      "sensor.nettleie_elvia_toppforbruk",
      "sensor.nettleie_elvia_toppforbruk_2",
      "sensor.nettleie_elvia_toppforbruk_3",
    ],
    tariff: "sensor.nettleie_elvia_tariff",
    energy_day: "sensor.nettleie_elvia_energiledd_dag",
    energy_night: "sensor.nettleie_elvia_energiledd_natt_helg",
  },
});

/* ────────────────────────────────────────────────── automatisk oppdaging ── */

/**
 * Mønstre for å finne igjen entitetene på en annen HA-server.
 * Hver oppføring er en liste med suffiks som entity_id kan slutte på.
 * Første treff vinner, så de mest spesifikke står først.
 */
const MONSTER = {
  norgespris: {
    active: ["norgespris_aktiv_na"],
    price: ["total_strompris_norgespris"],
    price_raw: ["strompris_norgespris_uten_nettleie"],
    diff: ["prisforskjell_norgespris"],
    spot: ["total_strompris_etter_stotte", "spotpris_etter_stotte"],
    saving: ["norgespris_besparelse"],
    compensation: ["norgespris_kompensasjon"],
    support_active: ["stromstotte_aktiv_na"],
    support: ["stromstotte_stromstotte"],
    support_left: ["stromstotte_gjenstaende"],
  },
  savings: {
    hour: ["norgespris_besparelse_time"],
    day: ["norgespris_besparelse_dag"],
    week: ["norgespris_besparelse_uke"],
    month: ["norgespris_besparelse_maned"],
    year: ["norgespris_besparelse_ar"],
  },
  capacity: {
    step: ["kapasitetstrinn"],
    step_number: ["kapasitetstrinn_nummer"],
    interval: ["kapasitetstrinn_intervall"],
    margin: ["margin_til_neste_trinn"],
    warning: ["kapasitetsvarsel"],
    peak_avg: ["snitt_toppforbruk"],
    tariff: ["_tariff"],
    energy_day: ["energiledd_dag"],
    energy_night: ["energiledd_natt_helg"],
    next_threshold: ["neste_effektledd_terskel"],
    manual_peak: ["effekt_topp_1"],
    power_cost: ["effektledd_kostnad"],
    fixed_cost: ["fastledd_kostnad"],
    estimate: ["stromregning_estimate"],
  },
};

/** Suffiks som ikke skal treffe: unngår at "kapasitetstrinn" tar "…_nummer". */
const finnEntitet = (hass, suffikser, domener) => {
  const alle = Object.keys(hass.states || {});
  for (const suff of suffikser) {
    const treff = alle.filter((id) => {
      if (domener && !domener.includes(id.split(".")[0])) return false;
      return id.endsWith(suff);
    });
    if (treff.length) {
      treff.sort((a, b) => a.length - b.length);
      return treff[0];
    }
  }
  return null;
};

/* ─────────────────────────────────────────────────────────────── kortet ── */

class KiStromregningCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._periode = 0;
    this._signatur = "";
  }

  static getConfigElement() {
    return document.createElement("ki-stromregning-card-editor");
  }

  static getStubConfig() {
    return STANDARD_KONFIG();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.periods || !this._config.periods.length) {
      throw new Error("ki-stromregning-card: 'periods' mangler");
    }
    this._periode = 0;
    this._signatur = "";
    this._bygget = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._bygget) this._bygg();
    this._tegn();
  }

  getCardSize() {
    return 14;
  }

  _bygg() {
    this.shadowRoot.innerHTML = `<style>${KiStromregningCard.styles}</style>`;
    this._rot = document.createElement("ha-card");
    this._rot.className = "rot";
    this.shadowRoot.appendChild(this._rot);
    this._rot.addEventListener("click", (e) => this._klikk(e));
    this._bygget = true;
  }

  _klikk(e) {
    const el = e.target.closest("[data-handling]");
    if (!el) return;
    const h = el.dataset.handling;
    if (h === "periode") {
      const i = parseInt(el.dataset.verdi);
      if (i === this._periode) return;
      this._periode = i;
      this._signatur = "";
      this._tegn();
    } else if (h === "mer-info") {
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: el.dataset.entity };
      this.dispatchEvent(ev);
    } else if (h === "rapport") {
      this._hass.callService("button", "press", { entity_id: el.dataset.entity });
    }
  }

  /* -------------------------------------------------------------- tegne -- */

  _tegn() {
    const hass = this._hass;
    const cfg = this._config;
    const p = cfg.periods[this._periode] || cfg.periods[0];

    const fulgte = [
      p.total,
      p.accumulated,
      p.today,
      p.consumption_day,
      p.consumption_night,
      p.consumption_total,
      ...(p.lines || []).map((l) => l.entity),
      ...Object.values(cfg.norgespris || {}),
      ...Object.values(cfg.savings || {}),
      ...Object.values(cfg.capacity || {}).flat(),
    ].filter((x) => typeof x === "string");

    const sign = JSON.stringify([
      this._periode,
      fulgte.map((e) => (hass.states[e] ? hass.states[e].state : null)),
    ]);
    if (sign === this._signatur) return;
    this._signatur = sign;

    this._rot.innerHTML = `
      ${this._tittelHtml()}
      ${this._heroHtml(p)}
      ${this._periodeHtml()}
      ${this._regningHtml(p)}
      ${this._forbrukHtml(p)}
      ${this._norgesprisHtml()}
      ${this._besparelseHtml()}
      ${this._kapasitetHtml()}
      ${this._rapportHtml(p)}
    `;
  }

  _tittelHtml() {
    const t = this._config.title === undefined ? "Strømregning" : this._config.title;
    if (!t) return "";
    return `
      <div class="tittelrad">
        <span class="tittel-ikon">
          <ha-icon icon="${esc(
            this._config.title_icon || "mdi:file-document-outline"
          )}"></ha-icon>
        </span>
        <h2>${esc(t)}</h2>
      </div>`;
  }

  _heroHtml(p) {
    const hass = this._hass;
    const total = tall(hass, p.total);
    const enhet = enhetFor(hass, p.total) || "kr";
    const akk = tall(hass, p.accumulated);
    const idag = tall(hass, p.today);

    const chips = [];
    if (akk !== null)
      chips.push(["Så langt", fmt(akk, enhetFor(hass, p.accumulated) || "kr")]);
    if (idag !== null)
      chips.push(["I dag", fmt(idag, enhetFor(hass, p.today) || "kr")]);
    const np = this._config.norgespris || {};
    const spare = tall(hass, np.saving);
    if (spare !== null)
      chips.push(["Norgespris", fmt(spare, enhetFor(hass, np.saving) || "kr")]);

    return `
      <section class="hero" data-handling="mer-info" data-entity="${esc(p.total || "")}">
        <div class="hero-topp">${esc(p.total_label || p.name || "")}</div>
        <div class="hero-sum">${
          total === null
            ? "–"
            : `${esc(
                total.toLocaleString("nb-NO", {
                  minimumFractionDigits: Math.abs(total) < 100 ? 2 : 0,
                  maximumFractionDigits: Math.abs(total) < 100 ? 2 : 0,
                })
              )}<span>${esc(enhet)}</span>`
        }</div>
        ${
          chips.length
            ? `<div class="chips">${chips
                .map(
                  (c) => `
              <div class="chip">
                <div class="chip-navn">${esc(c[0])}</div>
                <div class="chip-tall">${esc(c[1])}</div>
              </div>`
                )
                .join("")}</div>`
            : ""
        }
      </section>`;
  }

  _periodeHtml() {
    const p = this._config.periods;
    if (p.length < 2) return "";
    return `
      <div class="pille">
        ${p
          .map(
            (x, i) => `
          <button type="button" data-handling="periode" data-verdi="${i}"
            class="${this._periode === i ? "aktiv" : ""}">${esc(x.name)}</button>`
          )
          .join("")}
      </div>`;
  }

  _regningHtml(p) {
    const hass = this._hass;
    const linjer = (p.lines || []).filter((l) => l.entity);
    if (!linjer.length) return "";

    let sum = 0;
    let harSum = false;
    const rader = linjer
      .map((l) => {
        const v = tall(hass, l.entity);
        const enhet = enhetFor(hass, l.entity) || "kr";
        const fortegn = l.sign === -1 ? -1 : 1;
        if (v !== null && !l.no_sum && enhet.toLowerCase().includes("kr")) {
          sum += v * fortegn;
          harSum = true;
        }
        const vist =
          v === null ? "–" : (fortegn === -1 ? "− " : "") + fmt(Math.abs(v), enhet);
        return `
          <button type="button" class="rad" data-handling="mer-info"
            data-entity="${esc(l.entity)}"
            style="--rad-farge:${esc(l.color || "var(--gray800)")}">
            <span class="rad-ikon"><ha-icon icon="${esc(
              l.icon || "mdi:cash"
            )}"></ha-icon></span>
            <span class="rad-navn">${esc(l.name)}</span>
            <span class="rad-verdi ${fortegn === -1 ? "minus" : ""}">${esc(
          vist
        )}</span>
          </button>`;
      })
      .join("");

    return `
      <section class="bolk">
        <header class="bolk-hode"><h3>Spesifikasjon</h3></header>
        <div class="rader">${rader}</div>
        ${
          harSum
            ? `<div class="sumrad">
                <span>Sum</span>
                <span>${esc(fmt(sum, "kr"))}</span>
              </div>`
            : ""
        }
      </section>`;
  }

  _forbrukHtml(p) {
    const hass = this._hass;
    const dag = tall(hass, p.consumption_day);
    const natt = tall(hass, p.consumption_night);
    const tot = tall(hass, p.consumption_total);
    if (dag === null && natt === null && tot === null) return "";

    const sum = dag !== null && natt !== null ? dag + natt : tot;
    const dagP = sum ? ((dag || 0) / sum) * 100 : 0;
    const nattP = sum ? ((natt || 0) / sum) * 100 : 0;

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Forbruk</h3>
          <span class="bolk-hoyre">${esc(
            fmt(sum, enhetFor(hass, p.consumption_total) || "kWh")
          )}</span>
        </header>
        <div class="forbruk">
          <div class="stolpe">
            <i style="width:${dagP.toFixed(1)}%;background:var(--orange)"></i>
            <i style="width:${nattP.toFixed(1)}%;background:var(--blue)"></i>
          </div>
          <div class="forbruk-tekst">
            <button type="button" class="forbruk-del" data-handling="mer-info"
              data-entity="${esc(p.consumption_day || "")}">
              <span class="prikk" style="background:var(--orange)"></span>
              Dagtariff <b>${esc(fmt(dag, "kWh"))}</b>
              <em>${dagP.toFixed(0)} %</em>
            </button>
            <button type="button" class="forbruk-del" data-handling="mer-info"
              data-entity="${esc(p.consumption_night || "")}">
              <span class="prikk" style="background:var(--blue)"></span>
              Natt/helg <b>${esc(fmt(natt, "kWh"))}</b>
              <em>${nattP.toFixed(0)} %</em>
            </button>
          </div>
        </div>
      </section>`;
  }

  _norgesprisHtml() {
    const hass = this._hass;
    const n = this._config.norgespris || {};
    if (!n.price && !n.diff && !n.active) return "";

    const aktiv = hass.states[n.active];
    const på = aktiv && aktiv.state === "on";
    const diff = tall(hass, n.diff);
    const npPris = tall(hass, n.price);
    const spot = tall(hass, n.spot);
    const stotte = hass.states[n.support_active];

    // Positiv prisforskjell = Norgespris er billigst
    const billigst =
      diff === null ? null : diff > 0 ? "Norgespris" : diff < 0 ? "Spotpris" : "likt";

    const fliser = [];
    if (npPris !== null)
      fliser.push([
        "Norgespris nå",
        fmt(npPris, enhetFor(hass, n.price)),
        n.price,
        på ? "var(--green)" : null,
      ]);
    if (spot !== null)
      fliser.push([
        "Spot etter støtte",
        fmt(spot, enhetFor(hass, n.spot)),
        n.spot,
        !på ? "var(--orange)" : null,
      ]);
    if (diff !== null)
      fliser.push(["Prisforskjell", fmt(Math.abs(diff), enhetFor(hass, n.diff)), n.diff, null]);
    if (tall(hass, n.compensation) !== null)
      fliser.push([
        "Kompensasjon",
        fmt(tall(hass, n.compensation), enhetFor(hass, n.compensation) || "kr"),
        n.compensation,
        null,
      ]);
    if (stotte)
      fliser.push([
        "Strømstøtte",
        stotte.state === "on" ? "Aktiv" : "Ikke aktiv",
        n.support_active,
        null,
      ]);
    if (tall(hass, n.support_left) !== null)
      fliser.push([
        "Gjenstående støtte",
        fmt(tall(hass, n.support_left), enhetFor(hass, n.support_left)),
        n.support_left,
        null,
      ]);

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Norgespris</h3>
          ${
            aktiv
              ? `<span class="merke ${på ? "pa" : ""}">${
                  på ? "Aktiv nå" : "Ikke aktiv"
                }</span>`
              : ""
          }
        </header>
        ${
          billigst && billigst !== "likt"
            ? `<div class="notis ${
                billigst === "Norgespris" ? "god" : "advarsel"
              }">${esc(billigst)} er billigst akkurat nå${
                diff !== null
                  ? ` — ${esc(fmt(Math.abs(diff), enhetFor(hass, n.diff)))} i forskjell`
                  : ""
              }</div>`
            : ""
        }
        <div class="fliser">
          ${fliser
            .map(
              (f) => `
            <button type="button" class="flis ${f[3] ? "uthevet" : ""}"
              style="--flis-farge:${esc(f[3] || "var(--gray800)")}"
              data-handling="mer-info" data-entity="${esc(f[2] || "")}">
              <span class="flis-navn">${esc(f[0])}</span>
              <span class="flis-verdi">${esc(f[1])}</span>
            </button>`
            )
            .join("")}
        </div>
      </section>`;
  }

  _besparelseHtml() {
    const hass = this._hass;
    const b = this._config.savings || {};
    const perioder = [
      ["hour", "Time"],
      ["day", "Dag"],
      ["week", "Uke"],
      ["month", "Måned"],
      ["year", "År"],
    ].filter(([k]) => b[k] && hass.states[b[k]]);
    if (!perioder.length) return "";

    // Positiv besparelse = Norgespris lønner seg
    const aar = tall(hass, b.year);
    const retning = aar === null ? 0 : aar > 0 ? 1 : aar < 0 ? -1 : 0;

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>${esc(b.label || "Besparelse")}</h3>
          ${
            retning !== 0
              ? `<span class="merke ${retning > 0 ? "pa" : "varsel"}">${
                  retning > 0 ? "Norgespris lønner seg" : "Spotpris lønner seg"
                }</span>`
              : ""
          }
        </header>
        <div class="spar">
          ${perioder
            .map(([k, navn]) => {
              const v = tall(hass, b[k]);
              const pos = v !== null && v > 0;
              const neg = v !== null && v < 0;
              return `
              <button type="button" class="spar-del ${pos ? "pluss" : ""} ${
                neg ? "minus" : ""
              }" data-handling="mer-info" data-entity="${esc(b[k])}">
                <span class="spar-navn">${esc(navn)}</span>
                <span class="spar-verdi">${
                  v === null
                    ? "–"
                    : esc(
                        (v > 0 ? "+" : v < 0 ? "−" : "") +
                          fmt(Math.abs(v), enhetFor(hass, b[k]) || "kr")
                      )
                }</span>
              </button>`;
            })
            .join("")}
        </div>
      </section>`;
  }

  _kapasitetHtml() {
    const hass = this._hass;
    const k = this._config.capacity || {};
    if (!k.step && !k.margin) return "";

    const trinn = hass.states[k.step];
    const nr = hass.states[k.step_number];
    const intervall = hass.states[k.interval];
    const margin = tall(hass, k.margin);
    const varsel = hass.states[k.warning];
    const snitt = tall(hass, k.peak_avg);

    // Plasser snittet inne i trinnets intervall, når det lar seg lese
    let plassering = null;
    if (intervall && snitt !== null) {
      const t = String(intervall.state).match(/(\d+[.,]?\d*)/g);
      if (t && t.length >= 2) {
        const fra = parseFloat(t[0].replace(",", "."));
        const til = parseFloat(t[1].replace(",", "."));
        if (til > fra) plassering = Math.min(100, Math.max(0, ((snitt - fra) / (til - fra)) * 100));
      }
    }

    const topper = (k.peaks || [])
      .map((e, i) => {
        const v = tall(hass, e);
        if (v === null) return "";
        return `
          <button type="button" class="topp" data-handling="mer-info" data-entity="${esc(e)}">
            <span class="topp-nr">${i + 1}</span>
            <span class="topp-verdi">${esc(fmt(v, enhetFor(hass, e) || "kW"))}</span>
          </button>`;
      })
      .join("");

    return `
      <section class="bolk">
        <header class="bolk-hode">
          <h3>Kapasitetsledd</h3>
          ${
            varsel && varsel.state === "on"
              ? `<span class="merke varsel">Nær neste trinn</span>`
              : ""
          }
        </header>
        <div class="kap">
          <div class="kap-topp">
            <div>
              <div class="kap-trinn">${esc(
                trinn ? trinn.state : nr ? `Trinn ${nr.state}` : "–"
              )}</div>
              ${
                intervall
                  ? `<div class="kap-intervall">${esc(intervall.state)}</div>`
                  : ""
              }
            </div>
            <div class="kap-hoyre">
              ${
                snitt !== null
                  ? `<div class="kap-snitt">${esc(
                      fmt(snitt, enhetFor(hass, k.peak_avg) || "kW")
                    )}</div><div class="kap-merk">snitt topp</div>`
                  : ""
              }
            </div>
          </div>
          ${
            plassering !== null
              ? `<div class="stolpe kap-stolpe">
                  <i style="width:${plassering.toFixed(1)}%;background:${
                  varsel && varsel.state === "on" ? "var(--red)" : "var(--green)"
                }"></i>
                </div>`
              : ""
          }
          ${
            margin !== null || tall(hass, k.next_threshold) !== null
              ? `<div class="kap-margin">${
                  margin !== null
                    ? esc(fmt(margin, enhetFor(hass, k.margin) || "kW")) +
                      " igjen til neste trinn"
                    : ""
                }${
                  margin !== null && tall(hass, k.next_threshold) !== null ? " · " : ""
                }${
                  tall(hass, k.next_threshold) !== null
                    ? "terskel " +
                      esc(
                        fmt(
                          tall(hass, k.next_threshold),
                          enhetFor(hass, k.next_threshold) || "kW"
                        )
                      )
                    : ""
                }</div>`
              : ""
          }
          ${topper ? `<div class="topper">${topper}</div>` : ""}
          ${this._kostnadslinjer(k)}
        </div>
      </section>`;
  }

  /** Fastledd, effektledd og estimat — det som lå i strom_billig_settings. */
  _kostnadslinjer(k) {
    const hass = this._hass;
    const felt = [
      ["fixed_cost", "Fastledd"],
      ["power_cost", "Effektledd"],
      ["manual_peak", "Registrert topp"],
      ["estimate", "Estimert regning"],
    ].filter(([f]) => k[f] && hass.states[k[f]]);
    if (!felt.length) return "";
    return `
      <div class="kap-linjer">
        ${felt
          .map(
            ([f, navn]) => `
          <button type="button" class="kap-linje" data-handling="mer-info"
            data-entity="${esc(k[f])}">
            <span>${esc(navn)}</span>
            <b>${esc(fmtEnt(hass, k[f]))}</b>
          </button>`
          )
          .join("")}
      </div>`;
  }

  _rapportHtml(p) {
    const id = p.report_button || this._config.report_button;
    if (!id || !this._hass.states[id]) return "";
    return `
      <button type="button" class="rapport" data-handling="rapport" data-entity="${esc(
        id
      )}">
        <ha-icon icon="mdi:file-check-outline"></ha-icon>
        <span>Lag fakturaverifiserings-rapport</span>
      </button>`;
  }
}

KiStromregningCard.styles = `
  :host { display: block; }
  .rot { background: transparent; border: none; box-shadow: none; padding: 0; display: block; }
  .rot * { box-sizing: border-box; min-width: 0; }
  button { font: inherit; cursor: pointer; border: none; }

  /* ---------- overskrift ---------- */
  .tittelrad { display: flex; align-items: center; gap: 12px; padding: 0 4px 14px; }
  .tittel-ikon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    --mdc-icon-size: 21px; flex: 0 0 auto;
  }
  .tittelrad h2 {
    margin: 0; flex: 1;
    font-size: 22px; font-weight: 600;
    color: var(--gray1000, var(--primary-text-color));
  }

  /* ---------- hero ---------- */
  .hero {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff);
    border-radius: 24px; padding: 18px 20px;
    margin-bottom: 12px; cursor: pointer;
  }
  .hero-topp { font-size: 13px; font-weight: 600; opacity: .75; }
  .hero-sum {
    font-size: 34px; font-weight: 700; line-height: 1.15;
    margin: 4px 0 2px; font-variant-numeric: tabular-nums;
  }
  .hero-sum span { font-size: 17px; font-weight: 600; opacity: .75; margin-left: 5px; }
  .chips {
    display: flex; gap: 6px; margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .18);
  }
  .chip { flex: 1; text-align: center; }
  .chip-navn { font-size: 11px; font-weight: 600; opacity: .7; }
  .chip-tall { font-size: 15px; font-weight: 700; line-height: 1.4; font-variant-numeric: tabular-nums; }

  /* ---------- periodebryter ---------- */
  .pille {
    display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
    gap: 4px; background: var(--gray200, var(--card-background-color));
    border-radius: 16px; padding: 4px; height: 44px; margin-bottom: 20px;
  }
  .pille button {
    background: transparent; color: var(--gray1000, var(--primary-text-color));
    opacity: .5; border-radius: 12px; font-size: 13px; font-weight: 600;
    transition: background .18s ease, opacity .18s ease;
  }
  .pille button.aktiv {
    background: var(--active-big, var(--primary-color));
    color: var(--gray100, #fff); opacity: 1;
  }

  /* ---------- bolker ---------- */
  .bolk + .bolk { margin-top: 20px; }
  .bolk-hode {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 0 6px 10px;
  }
  .bolk-hode h3 {
    margin: 0; font-size: 15px; font-weight: 700;
    color: var(--gray1000, var(--primary-text-color));
  }
  .bolk-hoyre {
    font-size: 13px; font-weight: 700; opacity: .6;
    color: var(--gray1000, var(--primary-text-color));
    font-variant-numeric: tabular-nums;
  }
  .merke {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 10px;
    background: rgba(128, 128, 128, .22);
    color: var(--gray1000, var(--primary-text-color));
  }
  .merke.pa { background: var(--green, #30a46c); color: #fff; }
  .merke.varsel { background: var(--red, #e5484d); color: #fff; }

  /* ---------- spesifikasjon ---------- */
  .rader { display: flex; flex-direction: column; gap: 8px; }
  .rad {
    display: grid; grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center; gap: 12px;
    padding: 11px 14px 11px 6px;
    border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .rad-ikon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, .12);
    color: var(--rad-farge, var(--gray800));
    --mdc-icon-size: 21px; justify-self: end;
  }
  .rad-navn {
    font-size: 15px; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .rad-verdi { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rad-verdi.minus { color: var(--green, #30a46c); }
  .sumrad {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 10px; padding: 14px 16px;
    border-radius: 18px;
    background: var(--gray1000, var(--primary-text-color));
    color: var(--gray200, #222);
    font-size: 16px; font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* ---------- forbruk ---------- */
  .forbruk {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .stolpe {
    display: flex; height: 10px; border-radius: 5px; overflow: hidden;
    background: rgba(0, 0, 0, .16);
  }
  .stolpe i { display: block; height: 100%; transition: width .4s ease; }
  .forbruk-tekst { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 12px; }
  .forbruk-del {
    display: flex; align-items: center; gap: 7px;
    background: none; padding: 0;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .forbruk-del b { font-weight: 700; }
  .forbruk-del em { font-style: normal; opacity: .5; font-weight: 600; }
  .prikk { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }

  /* ---------- fliser ---------- */
  .notis {
    padding: 11px 14px; border-radius: 14px; margin-bottom: 8px;
    font-size: 13px; font-weight: 600;
    background: rgba(128, 128, 128, .16);
    color: var(--gray1000, var(--primary-text-color));
  }
  .notis.god { background: rgba(48, 164, 108, .18); }
  .notis.advarsel { background: rgba(245, 166, 35, .18); }
  .fliser { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
  .flis {
    display: flex; flex-direction: column; gap: 3px;
    padding: 13px 15px; border-radius: 18px; text-align: left;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    border-left: 3px solid transparent;
  }
  .flis.uthevet { border-left-color: var(--flis-farge, var(--green)); }
  .flis-navn { font-size: 12px; font-weight: 600; opacity: .6; }
  .flis-verdi { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- kapasitet ---------- */
  .kap {
    background: var(--gray200, var(--card-background-color));
    border-radius: 18px; padding: 16px;
  }
  .kap-topp { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .kap-trinn { font-size: 20px; font-weight: 700; color: var(--gray1000, var(--primary-text-color)); }
  .kap-intervall { font-size: 12px; opacity: .6; margin-top: 2px; color: var(--gray1000, var(--primary-text-color)); }
  .kap-hoyre { text-align: right; }
  .kap-snitt { font-size: 18px; font-weight: 700; color: var(--gray1000, var(--primary-text-color)); font-variant-numeric: tabular-nums; }
  .kap-merk { font-size: 11px; font-weight: 600; opacity: .5; color: var(--gray1000, var(--primary-text-color)); }
  .kap-stolpe { margin-top: 14px; }
  .kap-margin { font-size: 12px; font-weight: 600; opacity: .6; margin-top: 8px; color: var(--gray1000, var(--primary-text-color)); }
  .topper { display: flex; gap: 8px; margin-top: 14px; }
  .topp {
    flex: 1; display: flex; align-items: center; gap: 8px;
    padding: 9px 11px; border-radius: 13px;
    background: rgba(0, 0, 0, .14);
    color: var(--gray1000, var(--primary-text-color));
  }
  .topp-nr {
    width: 19px; height: 19px; border-radius: 50%;
    background: rgba(128, 128, 128, .3);
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
  }
  .topp-verdi { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- besparelse ---------- */
  .spar { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
  .spar-del {
    display: flex; flex-direction: column; gap: 3px;
    padding: 12px 10px; border-radius: 16px; text-align: center;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
  }
  .spar-navn { font-size: 11px; font-weight: 600; opacity: .55; }
  .spar-verdi { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .spar-del.pluss .spar-verdi { color: var(--green, #30a46c); }
  .spar-del.minus .spar-verdi { color: var(--red, #e5484d); }

  /* ---------- kostnadslinjer ---------- */
  .kap-linjer {
    display: flex; flex-direction: column; gap: 1px;
    margin-top: 14px; padding-top: 12px;
    border-top: 1px solid rgba(128, 128, 128, .2);
  }
  .kap-linje {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; padding: 8px 2px;
    background: none;
    color: var(--gray1000, var(--primary-text-color));
    font-size: 13px; font-weight: 500;
  }
  .kap-linje b { font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---------- rapportknapp ---------- */
  .rapport {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; margin-top: 20px; padding: 15px;
    border-radius: 18px;
    background: var(--gray200, var(--card-background-color));
    color: var(--gray1000, var(--primary-text-color));
    font-size: 14px; font-weight: 600;
    --mdc-icon-size: 20px;
  }
  .rapport:active { filter: brightness(1.2); }

  @media (max-width: 430px) {
    .hero-sum { font-size: 30px; }
    .topper { flex-direction: column; }
  }
  @media (prefers-reduced-motion: reduce) {
    .stolpe i, .pille button { transition: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────── editor ── */

const FLISFELT = {
  norgespris: [
    ["active", "Aktiv nå", ["binary_sensor"]],
    ["price", "Total strømpris (Norgespris)", ["sensor"]],
    ["price_raw", "Strømpris uten nettleie", ["sensor"]],
    ["diff", "Prisforskjell", ["sensor"]],
    ["spot", "Spotpris etter støtte", ["sensor"]],
    ["saving", "Besparelse", ["sensor"]],
    ["compensation", "Kompensasjon", ["sensor"]],
    ["support_active", "Strømstøtte aktiv", ["binary_sensor"]],
    ["support", "Strømstøtte", ["sensor"]],
    ["support_left", "Gjenstående støtte", ["sensor"]],
  ],
  savings: [
    ["hour", "Besparelse time", ["sensor"]],
    ["day", "Besparelse dag", ["sensor"]],
    ["week", "Besparelse uke", ["sensor"]],
    ["month", "Besparelse måned", ["sensor"]],
    ["year", "Besparelse år", ["sensor"]],
  ],
  capacity: [
    ["step", "Kapasitetstrinn", ["sensor"]],
    ["next_threshold", "Neste effektledd-terskel", ["sensor"]],
    ["manual_peak", "Manuell topp", ["input_number", "sensor"]],
    ["power_cost", "Effektledd-kostnad", ["sensor"]],
    ["fixed_cost", "Fastledd-kostnad", ["sensor"]],
    ["estimate", "Strømregning estimat", ["sensor"]],
    ["step_number", "Trinnummer", ["sensor"]],
    ["interval", "Trinnintervall", ["sensor"]],
    ["margin", "Margin til neste trinn", ["sensor"]],
    ["warning", "Kapasitetsvarsel", ["binary_sensor"]],
    ["peak_avg", "Snitt toppforbruk", ["sensor"]],
    ["tariff", "Tariff", ["sensor"]],
    ["energy_day", "Energiledd dag", ["sensor"]],
    ["energy_night", "Energiledd natt/helg", ["sensor"]],
  ],
};

class KiStromregningCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._apne = new Set();
    this._pickere = false;
    this._lastPickere();
  }

  async _lastPickere() {
    if (customElements.get("ha-entity-picker")) {
      this._pickere = true;
      return;
    }
    try {
      const helpers = await window.loadCardHelpers();
      const kort = await helpers.createCardElement({ type: "entities", entities: [] });
      await kort.constructor.getConfigElement();
      this._pickere = !!customElements.get("ha-entity-picker");
    } catch (e) {
      this._pickere = false;
    }
    this._tegn();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.periods) this._config.periods = STANDARD_KONFIG().periods;
    if (!this._config.norgespris) this._config.norgespris = {};
    if (!this._config.capacity) this._config.capacity = {};
    if (!this._config.savings) this._config.savings = {};
    this._tegn();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._tegnet) this._tegn();
    else
      this.shadowRoot
        .querySelectorAll("ha-entity-picker, ha-icon-picker")
        .forEach((el) => (el.hass = hass));
  }

  _endret() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _tekstfelt(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "felt";
    wrap.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = verdi === undefined || verdi === null ? "" : verdi;
    inp.addEventListener("change", () => onChange(inp.value.trim()));
    wrap.appendChild(inp);
    return wrap;
  }

  _avkryssing(label, verdi, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "avkryss";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = !!verdi;
    inp.addEventListener("change", () => onChange(inp.checked));
    wrap.appendChild(inp);
    const s = document.createElement("span");
    s.textContent = label;
    wrap.appendChild(s);
    return wrap;
  }

  _entitetsfelt(label, verdi, onChange, domener) {
    if (this._pickere) {
      const p = document.createElement("ha-entity-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = label;
      p.includeDomains = domener || ["sensor"];
      p.allowCustomEntity = true;
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt(label, verdi, onChange);
  }

  _ikonfelt(verdi, onChange) {
    if (this._pickere && customElements.get("ha-icon-picker")) {
      const p = document.createElement("ha-icon-picker");
      p.hass = this._hass;
      p.value = verdi || "";
      p.label = "Ikon";
      p.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        onChange(e.detail.value);
      });
      const wrap = document.createElement("div");
      wrap.className = "felt";
      wrap.appendChild(p);
      return wrap;
    }
    return this._tekstfelt("Ikon", verdi, onChange);
  }

  _knapp(tekst, klasse, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = klasse;
    b.textContent = tekst;
    b.addEventListener("click", onClick);
    return b;
  }

  _tegn() {
    if (!this._config) return;
    this._tegnet = true;
    this.shadowRoot.innerHTML = `<style>${KiStromregningCardEditor.styles}</style>`;
    const rot = document.createElement("div");
    rot.className = "editor";
    this.shadowRoot.appendChild(rot);

    const gen = document.createElement("div");
    gen.className = "boks";
    gen.innerHTML = "<h4>Generelt</h4>";
    const tr = document.createElement("div");
    tr.className = "tokol";
    tr.appendChild(
      this._tekstfelt("Overskrift (tom = skjul)", this._config.title, (v) => {
        this._config.title = v;
        this._endret();
      })
    );
    tr.appendChild(
      this._ikonfelt(this._config.title_icon, (v) => {
        this._config.title_icon = v;
        this._endret();
      })
    );
    gen.appendChild(tr);

    const oppdag = document.createElement("div");
    oppdag.className = "oppdag";
    oppdag.appendChild(
      this._knapp("Finn entiteter automatisk", "hovedknapp", () => this._oppdag())
    );
    const hjelp = document.createElement("p");
    hjelp.className = "hjelp";
    hjelp.textContent =
      "Leter opp entiteter etter navnemønster i denne HA-installasjonen og fyller ut feltene som er tomme. Nyttig når kortet flyttes til en annen server.";
    oppdag.appendChild(hjelp);
    if (this._oppdagSvar) {
      const sv = document.createElement("p");
      sv.className = "hjelp svar";
      sv.textContent = this._oppdagSvar;
      oppdag.appendChild(sv);
    }
    gen.appendChild(oppdag);
    rot.appendChild(gen);

    this._config.periods.forEach((p, pi) => this._tegnPeriode(rot, p, pi));
    rot.appendChild(
      this._knapp("+ Ny periode", "hovedknapp", () => {
        this._config.periods.push({ name: "Ny periode", lines: [] });
        this._endret();
        this._tegn();
      })
    );

    this._tegnGruppe(rot, "Norgespris og strømstøtte", "norgespris");
    this._tegnGruppe(rot, "Besparelse over tid", "savings");
    this._tegnGruppe(rot, "Kapasitetsledd og nettleie", "capacity");
  }

  /** Fyller ut tomme entitetsfelt ved å lete etter kjente navnemønstre. */
  _oppdag(overskriv) {
    if (!this._hass) return;
    let funnet = 0;
    let manglet = 0;

    Object.entries(MONSTER).forEach(([gruppe, felt]) => {
      if (!this._config[gruppe]) this._config[gruppe] = {};
      Object.entries(felt).forEach(([navn, suffikser]) => {
        const eksisterende = this._config[gruppe][navn];
        if (eksisterende && this._hass.states[eksisterende] && !overskriv) return;
        const treff = finnEntitet(this._hass, suffikser);
        if (treff) {
          this._config[gruppe][navn] = treff;
          funnet++;
        } else {
          manglet++;
        }
      });
    });

    // Toppforbruk-listen
    if (!this._config.capacity.peaks || !this._config.capacity.peaks.length) {
      const topper = Object.keys(this._hass.states)
        .filter((id) => /toppforbruk(_\d+)?$/.test(id) && !id.includes("snitt"))
        .sort();
      if (topper.length) {
        this._config.capacity.peaks = topper.slice(0, 3);
        funnet += topper.slice(0, 3).length;
      }
    }

    this._oppdagSvar = `Fylte ut ${funnet} felt. ${
      manglet ? manglet + " fant jeg ikke — fyll dem inn manuelt." : "Alt ble funnet."
    }`;
    this._endret();
    this._tegn();
  }

  _tegnGruppe(rot, tittel, noekkel) {
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = tittel;
    d.appendChild(s);
    const kropp = document.createElement("div");
    kropp.className = "kropp";
    FLISFELT[noekkel].forEach(([felt, label, dom]) => {
      kropp.appendChild(
        this._entitetsfelt(
          label,
          this._config[noekkel][felt],
          (v) => {
            if (v) this._config[noekkel][felt] = v;
            else delete this._config[noekkel][felt];
            this._endret();
          },
          dom
        )
      );
    });

    if (noekkel === "capacity") {
      const tb = document.createElement("div");
      tb.className = "underboks";
      tb.innerHTML = "<div class='undertittel'>Toppforbruk</div>";
      const liste = this._config.capacity.peaks || [];
      liste.forEach((e, ei) => {
        const rad = document.createElement("div");
        rad.className = "entrad";
        rad.appendChild(
          this._entitetsfelt("Topp " + (ei + 1), e, (v) => {
            if (v) liste[ei] = v;
            else liste.splice(ei, 1);
            this._endret();
            this._tegn();
          })
        );
        rad.appendChild(
          this._knapp("×", "mini fare", () => {
            liste.splice(ei, 1);
            this._endret();
            this._tegn();
          })
        );
        tb.appendChild(rad);
      });
      tb.appendChild(
        this._knapp("+ Legg til topp", "hovedknapp liten", () => {
          if (!this._config.capacity.peaks) this._config.capacity.peaks = [];
          this._config.capacity.peaks.push("");
          this._endret();
          this._tegn();
        })
      );
      kropp.appendChild(tb);
    }

    d.appendChild(kropp);
    rot.appendChild(d);
  }

  _tegnPeriode(rot, p, pi) {
    const noekkel = "p" + pi;
    const d = document.createElement("details");
    d.className = "boks";
    d.open = this._apne.has(noekkel);
    d.addEventListener("toggle", () => {
      if (d.open) this._apne.add(noekkel);
      else this._apne.delete(noekkel);
    });
    const s = document.createElement("summary");
    s.textContent = p.name || "Periode";
    d.appendChild(s);

    const kropp = document.createElement("div");
    kropp.className = "kropp";

    const r1 = document.createElement("div");
    r1.className = "tokol";
    r1.appendChild(
      this._tekstfelt("Navn", p.name, (v) => {
        p.name = v;
        this._endret();
        this._tegn();
      })
    );
    r1.appendChild(
      this._tekstfelt("Etikett over totalen", p.total_label, (v) => {
        p.total_label = v;
        this._endret();
      })
    );
    kropp.appendChild(r1);

    [
      ["total", "Total (vises stort)"],
      ["accumulated", "Akkumulert så langt"],
      ["today", "Dagens kostnad"],
      ["consumption_day", "Forbruk dagtariff"],
      ["consumption_night", "Forbruk natt/helg"],
      ["consumption_total", "Forbruk totalt"],
    ].forEach(([felt, label]) => {
      kropp.appendChild(
        this._entitetsfelt(label, p[felt], (v) => {
          if (v) p[felt] = v;
          else delete p[felt];
          this._endret();
        })
      );
    });

    kropp.appendChild(
      this._entitetsfelt(
        "Rapportknapp",
        p.report_button,
        (v) => {
          if (v) p.report_button = v;
          else delete p.report_button;
          this._endret();
        },
        ["button", "script"]
      )
    );

    const lb = document.createElement("div");
    lb.className = "underboks";
    lb.innerHTML = "<div class='undertittel'>Linjer i spesifikasjonen</div>";
    (p.lines || []).forEach((l, li) => {
      const ld = document.createElement("details");
      ld.className = "linje";
      const lnoekkel = `${pi}:${li}`;
      ld.open = this._apne.has(lnoekkel);
      ld.addEventListener("toggle", () => {
        if (ld.open) this._apne.add(lnoekkel);
        else this._apne.delete(lnoekkel);
      });
      const ls = document.createElement("summary");
      ls.textContent = l.name || "Ny linje";
      ld.appendChild(ls);

      const lk = document.createElement("div");
      lk.className = "kropp";
      const lr = document.createElement("div");
      lr.className = "tokol";
      lr.appendChild(
        this._tekstfelt("Navn", l.name, (v) => {
          l.name = v;
          this._endret();
          this._tegn();
        })
      );
      lr.appendChild(
        this._ikonfelt(l.icon, (v) => {
          l.icon = v;
          this._endret();
        })
      );
      lk.appendChild(lr);
      lk.appendChild(
        this._entitetsfelt("Entitet", l.entity, (v) => {
          l.entity = v;
          this._endret();
        })
      );
      lk.appendChild(
        this._tekstfelt("Farge", l.color, (v) => {
          l.color = v;
          this._endret();
        })
      );
      lk.appendChild(
        this._avkryssing("Trekkes fra (negativ linje)", l.sign === -1, (v) => {
          if (v) l.sign = -1;
          else delete l.sign;
          this._endret();
        })
      );
      lk.appendChild(
        this._avkryssing("Hold utenfor summen", l.no_sum, (v) => {
          if (v) l.no_sum = true;
          else delete l.no_sum;
          this._endret();
        })
      );
      lk.appendChild(
        this._knapp("Slett linje", "mini fare", () => {
          p.lines.splice(li, 1);
          this._endret();
          this._tegn();
        })
      );
      ld.appendChild(lk);
      lb.appendChild(ld);
    });
    lb.appendChild(
      this._knapp("+ Legg til linje", "hovedknapp liten", () => {
        if (!p.lines) p.lines = [];
        p.lines.push({ name: "Ny linje", icon: "mdi:cash", color: "var(--gray800)" });
        this._endret();
        this._tegn();
      })
    );
    kropp.appendChild(lb);

    kropp.appendChild(
      this._knapp("Slett periode", "mini fare", () => {
        this._config.periods.splice(pi, 1);
        this._endret();
        this._tegn();
      })
    );

    d.appendChild(kropp);
    rot.appendChild(d);
  }
}

KiStromregningCardEditor.styles = `
  .editor { display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
  .boks {
    border: 1px solid var(--divider-color);
    border-radius: 12px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  h4 { margin: 0; font-size: 15px; }
  summary { cursor: pointer; font-size: 14px; font-weight: 600; }
  .kropp { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
  .felt { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--secondary-text-color); flex: 1; }
  .felt input {
    font: inherit; font-size: 14px;
    color: var(--primary-text-color);
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px; width: 100%; box-sizing: border-box;
  }
  .avkryss { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text-color); cursor: pointer; }
  .tokol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .underboks {
    border: 1px dashed var(--divider-color); border-radius: 10px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .undertittel { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
  .linje { border: 1px solid var(--divider-color); border-radius: 10px; padding: 8px 10px; }
  .entrad { display: flex; align-items: flex-end; gap: 8px; }
  button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--divider-color); }
  .mini { background: transparent; color: var(--primary-text-color); font-size: 12px; padding: 7px 10px; align-self: flex-start; }
  .mini.fare { color: var(--error-color, #db4437); border-color: var(--error-color, #db4437); }
  .hovedknapp {
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    border: none; padding: 10px 14px; font-size: 14px; font-weight: 600;
  }
  .hovedknapp.liten { padding: 8px 12px; font-size: 13px; align-self: flex-start; }
  .hjelp { margin: 0; font-size: 12px; color: var(--secondary-text-color); }
  .hjelp.svar { color: var(--primary-color); font-weight: 600; }
  .oppdag {
    display: flex; flex-direction: column; gap: 8px;
    margin-top: 4px; padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }
  @media (max-width: 500px) { .tokol { grid-template-columns: 1fr; } }
`;

window.KI.define("ki-stromregning-card", KiStromregningCard);
window.KI.define("ki-stromregning-card-editor", KiStromregningCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-stromregning-card",
  name: "KI Strømregning",
  description: "Strømregning, nettleie, kapasitetsledd og Norgespris.",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-stromregning-card feilet", e); }

/* ===== ki-vekkealarm-card ===== */
try {
/**
 * ki-vekkealarm-card.js
 * Vekkealarm med gradvis lys — ett kort, to visninger.
 *
 *  Enkel     : hovedbryter med nedtelling til neste alarm, ukedager med
 *              vekketid, nattlampe og testkjøring
 *  Avansert  : alt over + hurtigvalg for uka, lysinnstillinger,
 *              betingelser og automasjonsstatus
 *
 * Kopier til /config/www/ki-vekkealarm-card.js og legg til som ressurs:
 *   URL:  /local/ki-vekkealarm-card.js?v=1.0.0
 *   Type: JavaScript Module
 *
 * Minimum config:
 *   type: custom:ki-vekkealarm-card
 */

const KI_VEKKEALARM_CARD_VERSION = "1.0.0";

console.info(
  `%c KI-VEKKEALARM-CARD %c ${KI_VEKKEALARM_CARD_VERSION} `,
  "background:#28282a;color:#fafbfc;padding:2px 6px;border-radius:6px 0 0 6px;font-weight:600",
  "background:#f2c94c;color:#28282a;padding:2px 6px;border-radius:0 6px 6px 0;font-weight:600"
);

const DAGER = [
  { key: "mandag",  navn: "Mandag",  kort: "Ma", helg: false },
  { key: "tirsdag", navn: "Tirsdag", kort: "Ti", helg: false },
  { key: "onsdag",  navn: "Onsdag",  kort: "On", helg: false },
  { key: "torsdag", navn: "Torsdag", kort: "To", helg: false },
  { key: "fredag",  navn: "Fredag",  kort: "Fr", helg: false },
  { key: "lordag",  navn: "Lørdag",  kort: "Lø", helg: true },
  { key: "sondag",  navn: "Søndag",  kort: "Sø", helg: true },
];

const escV = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nfV = (v, dec) => { const n = Number(v); return isFinite(n) ? n.toFixed(dec).replace(".", ",") : "–"; };

class KiVekkealarmCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ki-vekkealarm-card-editor"); }
  static getStubConfig() { return { type: "custom:ki-vekkealarm-card", default_view: "enkel" }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._sig = "";
    this._bekreft = false;
  }

  setConfig(config) {
    this._config = Object.assign(
      {
        prefix: "alarm",
        title: "",
        default_view: "enkel",
        remember_view: true,
        automation: "automation.soverom_vekkealarm_gradvis_lys",
        nattlampe: "input_boolean.alarm_nattlampe",
        fade: "input_number.alarm_fade_minutter",
        av_etter: "input_number.alarm_av_etter_minutter",
        show_test: true,
        betingelser: [
          { entity: "switch.sebastian_posisjon_hjemme_borte", name: "Sebastian hjemme" },
          { entity: "input_boolean.ki_klima_hovedbryter", name: "Klimastyring" },
        ],
      },
      config || {}
    );
    this._p = this._config.prefix || "alarm";
    this._view = this._lesView() || this._config.default_view || "enkel";
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
  }

  getCardSize() { return this._view === "avansert" ? 18 : 11; }

  b(n) { return `input_boolean.${this._p}_${n}`; }
  t(n) { return `input_datetime.${this._p}_${n}`; }

  _lesView() {
    if (this._config && this._config.remember_view === false) return null;
    try { return window.localStorage.getItem("ki-vekkealarm-card:view"); } catch (e) { return null; }
  }
  _lagreView(v) {
    if (this._config.remember_view === false) return;
    try { window.localStorage.setItem("ki-vekkealarm-card:view", v); } catch (e) { /* ignorer */ }
  }

  connectedCallback() {
    this._tikk = setInterval(() => this._updateNeste(), 30000);
  }
  disconnectedCallback() {
    clearInterval(this._tikk);
    clearTimeout(this._bekreftTimer);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    let sig = this._view + "|";
    for (const id of this._watched) sig += ((hass.states[id] || {}).state || "-") + ",";
    if (sig !== this._sig) { this._sig = sig; this._update(); }
  }

  /* ------------------------------------------------------------ *
   * Bygg
   * ------------------------------------------------------------ */

  _build() {
    this._watched = new Set();
    const c = this._config;

    const html = `
      <ha-card>
        <div class="wrap">
          ${c.title ? `<div class="card-title">${escV(c.title)}</div>` : ""}
          ${this._masterHtml()}
          ${this._switchHtml()}
          ${this._ukeHtml()}
          ${this._nattlampeHtml()}
          <div class="avansert-kun">
            ${this._lysHtml()}
            ${this._betingelserHtml()}
            ${this._automasjonHtml()}
          </div>
          ${c.show_test ? this._testHtml() : ""}
        </div>
      </ha-card>`;

    this.shadowRoot.innerHTML = `<style>${KiVekkealarmCard.styles}</style>${html}`;
    this._root = this.shadowRoot;
    this._root.addEventListener("click", (e) => this._onClick(e));
    this._root.addEventListener("change", (e) => this._onChange(e));
    this._root.addEventListener("input", (e) => this._onInput(e));
    this._built = true;
    this._settView(this._view, false);
  }

  _masterHtml() {
    const ent = this.b("master");
    this._watched.add(ent);
    DAGER.forEach((d) => { this._watched.add(this.b(d.key + "_aktiv")); this._watched.add(this.t(d.key)); });
    return `
      <div class="master" data-toggle="${ent}" data-entity="${ent}" data-action="toggle" tabindex="0" role="button">
        <div class="master-ikon"><ha-icon id="master-icon" icon="mdi:alarm"></ha-icon></div>
        <div class="master-tekst">
          <div class="master-navn" id="master-navn">Vekkealarm</div>
          <div class="master-status" id="master-status">–</div>
        </div>
        <div class="master-nedtell" id="master-nedtell"></div>
      </div>`;
  }

  _switchHtml() {
    return `
      <div class="switch" role="tablist">
        <div class="switch-valg" data-action="view" data-view="enkel" role="tab">Enkel</div>
        <div class="switch-valg" data-action="view" data-view="avansert" role="tab">Avansert</div>
      </div>`;
  }

  _ukeHtml() {
    const rader = DAGER.map((d) => {
      const akt = this.b(d.key + "_aktiv");
      const tid = this.t(d.key);
      return `
        <div class="dag ${d.helg ? "dag-helg" : ""}" data-dag="${d.key}">
          <div class="dag-pill" data-toggle="${akt}" data-entity="${akt}" data-action="toggle" tabindex="0" role="switch" aria-label="${escV(d.navn)}">${d.kort}</div>
          <div class="dag-navn" data-action="more" data-entity="${tid}">${escV(d.navn)}</div>
          <div class="dag-merke" data-merke="${d.key}"></div>
          <input class="tid" type="time" data-bind="time" data-entity="${tid}">
        </div>`;
    }).join("");

    const ukedager = DAGER.filter((d) => !d.helg).map((d) => this.b(d.key + "_aktiv")).join(" ");
    const helg = DAGER.filter((d) => d.helg).map((d) => this.b(d.key + "_aktiv")).join(" ");
    const alle = DAGER.map((d) => this.b(d.key + "_aktiv")).join(" ");

    return `
      <div class="blokk">
        <div class="blokk-hode">
          <span>Ukeplan</span>
          <span class="blokk-sub" id="uke-teller">–</span>
        </div>
        ${rader}
        <div class="hurtig avansert-kun">
          <div class="mini" data-action="sett" data-entities="${ukedager}" data-verdi="on">Ukedager på</div>
          <div class="mini" data-action="sett" data-entities="${helg}" data-verdi="off">Helg av</div>
          <div class="mini" data-action="sett" data-entities="${alle}" data-verdi="off">Alle av</div>
          <div class="mini" data-action="kopier">Kopier mandag til ukedagene</div>
        </div>
      </div>`;
  }

  _nattlampeHtml() {
    const ent = this._config.nattlampe;
    if (!ent) return "";
    this._watched.add(ent);
    return `
      <div class="chip" data-toggle="${ent}" data-entity="${ent}" data-action="toggle" tabindex="0" role="switch">
        <div class="chip-ikon"><ha-icon icon="mdi:lightbulb-night"></ha-icon></div>
        <div class="chip-tekst">
          <div class="chip-navn">Nattlampe</div>
          <div class="chip-sub" data-toggle-label>–</div>
        </div>
      </div>`;
  }

  _lysHtml() {
    const felt = [
      { ent: this._config.fade, navn: "Fade opp", icon: "mdi:brightness-percent", enhet: " min", sub: "Hvor lenge lyset bruker på å nå full styrke" },
      { ent: this._config.av_etter, navn: "Av etter", icon: "mdi:timer-off-outline", enhet: " min", sub: "Tid fra alarmen starter til lyset slukkes" },
    ].filter((f) => f.ent);
    felt.forEach((f) => this._watched.add(f.ent));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Lys</span></div>
        ${felt.map((f) => `
          <div class="slider-rad">
            <div class="slider-topp">
              <div class="slider-ikon"><ha-icon icon="${f.icon}"></ha-icon></div>
              <div class="slider-tekst">
                <div class="slider-navn" data-action="more" data-entity="${f.ent}">${escV(f.navn)}</div>
                <div class="slider-sub">${escV(f.sub)}</div>
              </div>
              <div class="slider-verdi" data-bind="num" data-entity="${f.ent}" data-dec="0" data-unit="${escV(f.enhet)}">–</div>
            </div>
            <input class="slider" type="range" data-bind="range" data-entity="${f.ent}">
          </div>`).join("")}
      </div>`;
  }

  _betingelserHtml() {
    const liste = this._config.betingelser || [];
    if (!liste.length) return "";
    liste.forEach((r) => this._watched.add(r.entity));
    return `
      <div class="blokk">
        <div class="blokk-hode"><span>Betingelser</span><span class="blokk-sub">Alarmen kjører bare når disse er på</span></div>
        ${liste.map((r) => `
          <div class="rad rad-les" data-action="more" data-entity="${r.entity}">
            <div class="prikk" data-prikk="${r.entity}"></div>
            <div class="rad-navn">${escV(r.name || r.entity)}</div>
            <div class="rad-verdi" data-bind="japp" data-entity="${r.entity}">–</div>
          </div>`).join("")}
      </div>`;
  }

  _automasjonHtml() {
    const ent = this._config.automation;
    if (!ent) return "";
    this._watched.add(ent);
    return `
      <div class="chip" data-toggle="${ent}" data-entity="${ent}" data-action="toggle-auto" tabindex="0" role="switch">
        <div class="chip-ikon"><ha-icon icon="mdi:robot"></ha-icon></div>
        <div class="chip-tekst">
          <div class="chip-navn">Automasjonen</div>
          <div class="chip-sub" id="auto-sub">–</div>
        </div>
      </div>`;
  }

  _testHtml() {
    return `
      <div class="test" id="test" data-action="test" tabindex="0" role="button">
        <ha-icon icon="mdi:play-circle"></ha-icon>
        <span id="test-tekst">Test vekkesekvensen</span>
      </div>`;
  }

  /* ------------------------------------------------------------ *
   * Oppdatering
   * ------------------------------------------------------------ */

  _update() {
    const h = this._hass;
    if (!h || !this._built) return;

    this._root.querySelectorAll("[data-bind]").forEach((el) => {
      const st = h.states[el.dataset.entity];
      const kind = el.dataset.bind;
      if (kind === "time") {
        const v = st ? String(st.state).slice(0, 5) : "";
        if (el.value !== v && this._root.activeElement !== el) el.value = v;
        el.disabled = !st;
      } else if (kind === "num") {
        el.textContent = st ? nfV(st.state, Number(el.dataset.dec ?? 0)) + (el.dataset.unit || "") : "–";
      } else if (kind === "range") {
        if (!st) { el.disabled = true; return; }
        el.min = st.attributes.min ?? 0;
        el.max = st.attributes.max ?? 60;
        el.step = st.attributes.step ?? 1;
        if (this._root.activeElement !== el) el.value = st.state;
      } else if (kind === "japp") {
        const on = st && (st.state === "on" || st.state === "home");
        el.textContent = st ? (on ? "På" : "Av") : "Mangler";
        el.classList.toggle("nei", !on);
      }
    });

    this._root.querySelectorAll("[data-prikk]").forEach((el) => {
      const st = h.states[el.dataset.prikk];
      const on = st && (st.state === "on" || st.state === "home");
      el.classList.toggle("gronn", !!on);
      el.classList.toggle("rod", !on);
    });

    this._root.querySelectorAll("[data-toggle]").forEach((el) => {
      const st = h.states[el.dataset.toggle];
      const on = !!st && st.state === "on";
      el.classList.toggle("on", on);
      el.classList.toggle("mangler", !st);
      const lbl = el.querySelector("[data-toggle-label]");
      if (lbl) lbl.textContent = on ? "Tas med i vekkingen" : "Ikke med";
    });

    // Dag-rader dempes når dagen er av, og dagens dato merkes
    const idxIdag = (new Date().getDay() + 6) % 7;
    DAGER.forEach((d, i) => {
      const rad = this._root.querySelector(`.dag[data-dag="${d.key}"]`);
      if (!rad) return;
      const st = h.states[this.b(d.key + "_aktiv")];
      rad.classList.toggle("av", !st || st.state !== "on");
      rad.classList.toggle("idag", i === idxIdag);
      const merke = rad.querySelector(`[data-merke="${d.key}"]`);
      if (merke) merke.textContent = i === idxIdag ? "i dag" : "";
    });

    const teller = this._root.getElementById("uke-teller");
    if (teller) {
      const n = DAGER.filter((d) => (h.states[this.b(d.key + "_aktiv")] || {}).state === "on").length;
      teller.textContent = n === 0 ? "Ingen dager valgt" : `${n} av 7 dager`;
    }

    const auto = this._root.getElementById("auto-sub");
    if (auto) {
      const st = h.states[this._config.automation];
      if (!st) auto.textContent = "Finner ikke automasjonen";
      else {
        const sist = st.attributes.last_triggered;
        auto.textContent = st.state === "on"
          ? sist ? `Aktiv · sist kjørt ${this._relativ(new Date(sist))}` : "Aktiv · aldri kjørt"
          : "Deaktivert";
      }
    }

    this._updateNeste();
  }

  _updateNeste() {
    if (!this._built || !this._hass) return;
    const h = this._hass;
    const master = h.states[this.b("master")];
    const på = master && master.state === "on";
    const ikon = this._root.getElementById("master-icon");
    if (ikon) ikon.setAttribute("icon", på ? "mdi:alarm" : "mdi:alarm-off");

    const status = this._root.getElementById("master-status");
    const nedtell = this._root.getElementById("master-nedtell");
    if (!status) return;

    if (!master) { status.textContent = "Finner ikke alarmbryteren"; nedtell.textContent = ""; return; }
    if (!på) { status.textContent = "Slått av"; nedtell.textContent = ""; return; }

    const neste = this._nesteAlarm();
    if (!neste) {
      status.textContent = "Ingen vekketid satt";
      nedtell.textContent = "";
      return;
    }
    const nå = new Date();
    const dagerFrem = Math.round((new Date(neste.når).setHours(0, 0, 0, 0) - new Date(nå).setHours(0, 0, 0, 0)) / 86400000);
    const nårTekst = dagerFrem === 0 ? "i dag" : dagerFrem === 1 ? "i morgen" : neste.dag.navn.toLowerCase();
    status.textContent = `Neste ${nårTekst} kl. ${neste.tid}`;

    const min = Math.max(0, Math.round((neste.når - nå) / 60000));
    const t = Math.floor(min / 60);
    nedtell.textContent = t >= 24 ? `om ${Math.floor(t / 24)} d` : t > 0 ? `om ${t} t ${min % 60} min` : `om ${min} min`;
  }

  _nesteAlarm() {
    const h = this._hass;
    const nå = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(nå);
      d.setDate(nå.getDate() + i);
      const dag = DAGER[(d.getDay() + 6) % 7];
      const akt = h.states[this.b(dag.key + "_aktiv")];
      if (!akt || akt.state !== "on") continue;
      const tid = h.states[this.t(dag.key)];
      if (!tid) continue;
      const [hh, mm] = String(tid.state).split(":");
      if (hh === "00" && mm === "00") continue;
      const når = new Date(d);
      når.setHours(Number(hh), Number(mm), 0, 0);
      if (når > nå) return { når, dag, tid: `${hh}:${mm}` };
    }
    return null;
  }

  _relativ(dato) {
    const min = Math.round((Date.now() - dato.getTime()) / 60000);
    if (min < 1) return "nå";
    if (min < 60) return `for ${min} min siden`;
    const t = Math.round(min / 60);
    if (t < 24) return `for ${t} t siden`;
    const d = Math.round(t / 24);
    return d === 1 ? "i går" : `for ${d} dager siden`;
  }

  /* ------------------------------------------------------------ *
   * Interaksjon
   * ------------------------------------------------------------ */

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.action);
    if (!el) return;
    const a = el.dataset.action;

    if (a === "toggle") {
      const id = el.dataset.entity;
      const st = this._hass.states[id];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("input_boolean", st.state === "on" ? "turn_off" : "turn_on", { entity_id: id });
    } else if (a === "toggle-auto") {
      const st = this._hass.states[this._config.automation];
      if (!st) return;
      this._haptic("light");
      this._hass.callService("automation", st.state === "on" ? "turn_off" : "turn_on", { entity_id: this._config.automation });
    } else if (a === "more") {
      this._moreInfo(el.dataset.entity);
    } else if (a === "view") {
      this._settView(el.dataset.view, true);
    } else if (a === "sett") {
      this._haptic("medium");
      this._hass.callService("input_boolean", el.dataset.verdi === "on" ? "turn_on" : "turn_off", {
        entity_id: el.dataset.entities.split(" "),
      });
    } else if (a === "kopier") {
      this._kopierMandag();
    } else if (a === "test") {
      this._test();
    }
  }

  _onChange(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind);
    if (!el) return;
    if (el.dataset.bind === "time" && el.value) {
      const [t, m] = el.value.split(":");
      this._hass.callService("input_datetime", "set_datetime", { entity_id: el.dataset.entity, time: `${t}:${m}:00` });
    } else if (el.dataset.bind === "range") {
      this._hass.callService("input_number", "set_value", { entity_id: el.dataset.entity, value: Number(el.value) });
    }
  }

  _onInput(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.bind === "range");
    if (!el) return;
    const vis = this._root.querySelector(`[data-bind="num"][data-entity="${el.dataset.entity}"]`);
    if (vis) vis.textContent = nfV(el.value, 0) + (vis.dataset.unit || "");
  }

  _kopierMandag() {
    const kilde = this._hass.states[this.t("mandag")];
    if (!kilde) return;
    const tid = String(kilde.state).slice(0, 8);
    const mål = DAGER.filter((d) => !d.helg && d.key !== "mandag").map((d) => this.t(d.key));
    this._haptic("medium");
    this._hass.callService("input_datetime", "set_datetime", { entity_id: mål, time: tid });
  }

  _test() {
    const knapp = this._root.getElementById("test");
    const tekst = this._root.getElementById("test-tekst");
    if (!this._bekreft) {
      this._bekreft = true;
      knapp.classList.add("bekreft");
      tekst.textContent = "Trykk igjen for å kjøre nå";
      this._haptic("warning");
      clearTimeout(this._bekreftTimer);
      this._bekreftTimer = setTimeout(() => {
        this._bekreft = false;
        knapp.classList.remove("bekreft");
        tekst.textContent = "Test vekkesekvensen";
      }, 5000);
      return;
    }
    clearTimeout(this._bekreftTimer);
    this._bekreft = false;
    knapp.classList.remove("bekreft");
    tekst.textContent = "Kjører …";
    this._haptic("success");
    this._hass.callService("automation", "trigger", {
      entity_id: this._config.automation,
      skip_condition: true,
    });
    setTimeout(() => { tekst.textContent = "Test vekkesekvensen"; }, 4000);
  }

  _settView(view, lagre) {
    this._view = view === "avansert" ? "avansert" : "enkel";
    if (lagre) { this._lagreView(this._view); this._haptic("selection"); }
    this._root.querySelectorAll(".switch-valg").forEach((el) => el.classList.toggle("aktiv", el.dataset.view === this._view));
    this._root.querySelector(".wrap").dataset.view = this._view;
  }

  _moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }
  _haptic(type) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
  }

  /* ------------------------------------------------------------ *
   * Stil
   * ------------------------------------------------------------ */

  static get styles() {
    return `
      :host { display:block; }
      ha-card { background:transparent; border:none; box-shadow:none; padding:0; }
      .wrap { display:flex; flex-direction:column; gap:10px; }
      .card-title { font-size:20px; font-weight:600; padding:2px 6px 0; color:var(--gray1000, var(--primary-text-color)); }
      .wrap[data-view="enkel"] .avansert-kun { display:none !important; }

      /* Hovedbryter */
      .master {
        display:grid; grid-template-columns:66px 1fr auto; align-items:center; gap:10px;
        height:78px; padding:0 16px 0 4px; border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .master.on { background: var(--yellow, #f2c94c); color: var(--black, #101010); }
      .master-ikon {
        width:62px; height:62px; margin-left:4px; border-radius:50%;
        display:flex; align-items:center; justify-content:center; background: rgba(250,251,252,.10);
      }
      .master.on .master-ikon { background: rgba(40,40,42,.14); }
      .master-ikon ha-icon { --mdc-icon-size:30px; }
      .master-navn { font-size:19px; font-weight:600; line-height:1.2; }
      .master-status { font-size:13px; opacity:.72; margin-top:2px; }
      .master-nedtell { font-size:14px; font-weight:600; opacity:.85; white-space:nowrap; font-variant-numeric:tabular-nums; }

      /* Visningsbryter */
      .switch { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; border-radius:75px;
        background: var(--gray200, var(--secondary-background-color)); }
      .switch-valg { text-align:center; padding:9px 0; border-radius:75px; font-size:15px; font-weight:500;
        cursor:pointer; color: var(--gray1000, var(--primary-text-color)); opacity:.6;
        transition: background .18s ease, opacity .18s ease, color .18s ease; }
      .switch-valg.aktiv { background: var(--active-small, var(--active-big, var(--primary-color)));
        color: var(--gray100, #fafbfc); opacity:1; }

      /* Blokk */
      .blokk { background: var(--gray200, var(--secondary-background-color)); border-radius:24px; padding:8px 14px 12px;
        color: var(--gray1000, var(--primary-text-color)); }
      .blokk + .blokk { margin-top:10px; }
      .blokk-hode { display:flex; justify-content:space-between; align-items:baseline;
        font-size:13px; font-weight:600; opacity:.55; padding:8px 4px 6px; }
      .blokk-sub { font-weight:500; }

      /* Dag-rad */
      .dag { display:grid; grid-template-columns:46px 1fr auto auto; align-items:center; gap:10px; padding:5px 2px; }
      .dag + .dag { border-top:1px solid rgba(128,128,128,.14); }
      .dag.av .dag-navn, .dag.av .tid { opacity:.42; }
      .dag-pill {
        width:44px; height:38px; border-radius:14px; cursor:pointer; user-select:none;
        display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600;
        background: rgba(128,128,128,.18); color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease;
      }
      .dag-pill.on { background: var(--yellow, #f2c94c); color: var(--black, #101010); }
      .dag-navn { font-size:15px; cursor:pointer; }
      .dag.idag .dag-navn { font-weight:600; }
      .dag-merke { font-size:11px; font-weight:600; opacity:.5; text-transform:none; }
      .tid { font-family:inherit; font-size:15px; font-weight:600; color: var(--gray1000, var(--primary-text-color));
        background: rgba(128,128,128,.16); border:none; border-radius:75px; padding:8px 12px; text-align:center; }
      .tid::-webkit-calendar-picker-indicator { opacity:.5; }

      /* Hurtigvalg */
      .hurtig { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px 0 2px; }
      .mini { text-align:center; padding:11px 8px; border-radius:75px; font-size:13px; cursor:pointer;
        background: rgba(128,128,128,.16); color: var(--gray1000, var(--primary-text-color)); }
      .mini:last-child { grid-column:1 / -1; }
      .mini:active { transform: scale(.98); }

      /* Chip */
      .chip { display:grid; grid-template-columns:58px 1fr; align-items:center; gap:8px; height:66px;
        padding-left:4px; border-radius:75px; cursor:pointer;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease; }
      .chip.on { background: var(--active-big, var(--primary-color)); color: var(--gray100, #fafbfc); }
      .chip-ikon { width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(250,251,252,.10); }
      .chip.on .chip-ikon { background: rgba(40,40,42,.12); }
      .chip-ikon ha-icon { --mdc-icon-size:24px; }
      .chip-navn { font-size:15px; font-weight:500; }
      .chip-sub { font-size:13px; opacity:.7; }
      .avansert-kun .chip { margin-top:10px; }

      /* Slider */
      .slider-rad { padding:8px 2px 4px; }
      .slider-rad + .slider-rad { border-top:1px solid rgba(128,128,128,.14); margin-top:6px; }
      .slider-topp { display:grid; grid-template-columns:38px 1fr auto; align-items:center; gap:10px; }
      .slider-ikon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        background: rgba(128,128,128,.14); }
      .slider-ikon ha-icon { --mdc-icon-size:19px; opacity:.85; }
      .slider-navn { font-size:14.5px; font-weight:500; cursor:pointer; }
      .slider-sub { font-size:12px; opacity:.6; line-height:1.3; }
      .slider-verdi { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
      .slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; margin:14px 0 6px;
        border-radius:4px; background: rgba(128,128,128,.28); outline:none; }
      .slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; border:none; }
      .slider::-moz-range-thumb { width:20px; height:20px; border-radius:50%; border:none;
        background: var(--gray1000, var(--primary-text-color)); cursor:pointer; }

      /* Betingelser */
      .rad { display:grid; grid-template-columns:14px 1fr auto; align-items:center; gap:10px; padding:9px 2px; }
      .rad + .rad { border-top:1px solid rgba(128,128,128,.14); }
      .rad-les { cursor:pointer; }
      .rad-navn { font-size:14.5px; }
      .rad-verdi { font-size:14px; font-weight:600; opacity:.85; }
      .rad-verdi.nei { opacity:.55; }
      .prikk { width:10px; height:10px; border-radius:50%; background: rgba(128,128,128,.4); }
      .prikk.gronn { background: var(--green, #4caf50); }
      .prikk.rod { background: var(--red, #f44336); }

      /* Test */
      .test { display:flex; align-items:center; justify-content:center; gap:10px; height:60px; border-radius:75px;
        cursor:pointer; font-size:15px; font-weight:500;
        background: var(--gray200, var(--secondary-background-color));
        color: var(--gray1000, var(--primary-text-color));
        transition: background .18s ease, color .18s ease; }
      .test ha-icon { --mdc-icon-size:24px; }
      .test.bekreft { background: var(--orange, #ff9800); color: var(--black, #101010); }

      .mangler { opacity:.4; }
      [tabindex]:focus-visible { outline:2px solid var(--active-big, var(--primary-color)); outline-offset:2px; }
      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
      @media (max-width: 380px) {
        .dag { grid-template-columns:44px 1fr auto; }
        .dag-merke { display:none; }
        .master-nedtell { font-size:13px; }
      }
    `;
  }
}

window.KI.define("ki-vekkealarm-card", KiVekkealarmCard);

/* ------------------------------------------------------------------ *
 * GUI-editor
 * ------------------------------------------------------------------ */

const VEKKE_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "prefix", selector: { text: {} } },
  { name: "automation", selector: { entity: { domain: "automation" } } },
  { name: "nattlampe", selector: { entity: { domain: "input_boolean" } } },
  { type: "grid", name: "", schema: [
    { name: "fade", selector: { entity: { domain: "input_number" } } },
    { name: "av_etter", selector: { entity: { domain: "input_number" } } },
  ] },
  {
    name: "default_view",
    selector: { select: { mode: "dropdown", options: [
      { value: "enkel", label: "Enkel" },
      { value: "avansert", label: "Avansert" },
    ] } },
  },
  { type: "grid", name: "", schema: [
    { name: "remember_view", selector: { boolean: {} } },
    { name: "show_test", selector: { boolean: {} } },
  ] },
];

const VEKKE_LABELS = {
  title: "Tittel (valgfri)",
  prefix: "Entitetsprefiks",
  automation: "Automasjon",
  nattlampe: "Nattlampe-bryter",
  fade: "Fade opp (minutter)",
  av_etter: "Av etter (minutter)",
  default_view: "Standardvisning",
  remember_view: "Husk valgt visning",
  show_test: "Vis testknapp",
};

class KiVekkealarmCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) {
    this._config = Object.assign(
      { prefix: "alarm", default_view: "enkel", remember_view: true, show_test: true },
      config || {}
    );
    this._render();
  }

  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }

  _render() {
    if (!this._form) {
      this.shadowRoot.innerHTML = `<style>
        .info { font-size:13px; opacity:.7; padding:10px 2px 0; line-height:1.45; }
        code { background: rgba(128,128,128,.18); padding:1px 5px; border-radius:5px; }
      </style>`;
      this._form = document.createElement("ha-form");
      this._form.schema = VEKKE_SCHEMA;
      this._form.computeLabel = (s) => VEKKE_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: Object.assign({}, this._config, ev.detail.value) },
          bubbles: true, composed: true,
        }));
      });
      this.shadowRoot.appendChild(this._form);
      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = "Betingelsene som vises i avansert visning settes i YAML med <code>betingelser</code> — en liste av <code>entity</code> og <code>name</code>.";
      this.shadowRoot.appendChild(info);
    }
    this._form.data = this._config;
    if (this._hass) this._form.hass = this._hass;
  }
}

window.KI.define("ki-vekkealarm-card-editor", KiVekkealarmCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ki-vekkealarm-card",
  name: "KI Vekkealarm",
  description: "Vekkealarm med ukeplan, nedtelling, lysinnstillinger og testkjøring",
  preview: true,
});
} catch (e) { console.error("ki-cards: ki-vekkealarm-card feilet", e); }

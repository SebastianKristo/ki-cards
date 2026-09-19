/* ki-homelab-card – animert serverrack og autokonfigurerte lister.
 *
 *  Finner alt selv via entitetsregisteret (hass.entities / hass.devices), gruppert per integrasjon og enhet:
 *    proxmox_sensors  → node, containere (CT), VM-er, lagring, varsler (stressed/overloaded)
 *    unifi            → ruter, switcher, aksesspunkter, Wi-Fi-nett (med QR-kode), porter, LED, restart
 *    unraid           → CPU, RAM, array, disker, Docker-containere og VM-er
 *    qbittorrent      → ned/opp-hastighet, status, torrenter, alternativ hastighet
 *    speedtestdotnet  → ned/opp/ping (valgfritt)
 *
 *  type: custom:ki-homelab-card
 *  vis: scene          # scene (standard) | nedlasting | gjester | nettverk | lagring
 *  kilde: alle         # gjester: proxmox | unraid | alle
 *  navn: Homelab
 *  skjul: [homarr]     # valgfritt: skjul rader/enheter som inneholder denne teksten
 *  navn_map: { "102": AdGuard, haos_16_3: Home Assistant }   # valgfritt: gi rader et penere navn (vmid eller nøkkel)
 *  tap_action: { action: navigate, navigation_path: "#server" }   # bare scene
 *
 *  Frittstående fil – krever ikke ki-cards.
 */
(() => {
  /* ─────────────── hjelpere ─────────────── */
  const DAARLIG = ["unavailable", "unknown", "", "none", null, undefined];
  const ok = (s) => s && !DAARLIG.includes(s.state);
  const tall = (s) => { if (!ok(s)) return NaN; const v = parseFloat(String(s.state).replace(",", ".")); return isNaN(v) ? NaN : v; };
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const obj = (id) => id.slice(id.indexOf(".") + 1);
  const dom = (id) => id.slice(0, id.indexOf("."));
  const klem = (v, a, b) => Math.min(b, Math.max(a, v));
  const komma = (v, d = 0) => (isNaN(v) ? "--" : v.toFixed(d).replace(".", ","));
  const tittel = (t) => String(t).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

  /** finn første entitet i lista hvis objekt-id eller translation_key passer mønsteret */
  const finn = (liste, re, domene) => {
    const e = liste.find((x) => (!domene || dom(x.entity_id) === domene) && (re.test(obj(x.entity_id)) || (x.translation_key && re.test(x.translation_key))));
    return e ? e.entity_id : undefined;
  };
  const alle = (liste, re, domene) => liste.filter((x) => (!domene || dom(x.entity_id) === domene) && (re.test(obj(x.entity_id)) || (x.translation_key && re.test(x.translation_key)))).map((x) => x.entity_id);

  /** bytes/s fra en hastighetssensor, uansett enhet */
  const byteRate = (s) => {
    const v = tall(s); if (isNaN(v)) return NaN;
    const u = String(s.attributes.unit_of_measurement || "B/s").toLowerCase();
    const f = u.startsWith("gi") ? 1073741824 : u.startsWith("mi") ? 1048576 : u.startsWith("ki") ? 1024 : u.startsWith("g") ? 1e9 : u.startsWith("m") ? 1e6 : u.startsWith("k") ? 1e3 : 1;
    return v * (u.includes("bit") ? f / 8 : f);
  };
  const fartTekst = (b) => {
    if (isNaN(b)) return ["--", ""];
    if (b >= 1e6) return [komma(b / 1e6, b >= 1e8 ? 0 : 1), "MB/s"];
    if (b >= 1e3) return [komma(b / 1e3, 0), "kB/s"];
    return [komma(b, 0), "B/s"];
  };
  const medEnhet = (s, d) => {
    if (!ok(s)) return "--";
    const u = s.attributes.unit_of_measurement || "";
    if (!/^-?\d+([.,]\d+)?$/.test(String(s.state).trim())) return String(s.state) + (u && u !== "%" ? " " + u : "");
    const v = tall(s);
    return (isNaN(v) ? s.state : (d === undefined ? String(v) : komma(v, d)).replace(".", ",")) + (u ? (u === "%" ? " %" : " " + u) : "");
  };

  /* ─────────────── oppdagelse ─────────────── */
  const PLATTFORMER = ["proxmox_sensors", "unifi", "unraid", "qbittorrent", "speedtestdotnet"];

  function oppdag(hass, cfg) {
    const E = hass.entities || {}, D = hass.devices || {};
    const skjul = (cfg.skjul || []).map((s) => String(s).toLowerCase());
    const skjult = (t) => skjul.some((s) => String(t).toLowerCase().includes(s));
    const per = {};
    for (const id in E) {
      const e = E[id]; if (!e || !PLATTFORMER.includes(e.platform)) continue;
      if (e.hidden) continue;
      ((per[e.platform] = per[e.platform] || {})[e.device_id || "_"] = per[e.platform][e.device_id || "_"] || []).push(e);
    }
    const devNavn = (id) => { const d = D[id]; return d ? (d.name_by_user || d.name || "") : ""; };
    const devModell = (id) => { const d = D[id]; return d ? `${d.manufacturer || ""} ${d.model || ""}`.toLowerCase() : ""; };
    const nm = cfg.navn_map || {};
    const R = { proxmox: { noder: [], gjester: [], lagring: [], varsler: [], diskerMap: {}, disker: [], montert: null }, unifi: { enheter: [], wlan: [] }, unraid: null, qbit: null, speedtest: null };

    /* Proxmox */
    for (const [dev, liste] of Object.entries(per.proxmox_sensors || {})) {
      const ids = liste.map((e) => obj(e.entity_id));
      let type = null;
      for (const o of ids) { const m = o.match(/^\d+_(node|ct|lxc|vm|qemu|storage|disks?|mounted_disks)_/); if (m) { type = m[1]; break; } }
      const mod = devModell(dev) + " " + devNavn(dev).toLowerCase();
      if (!type) type = /lxc|container/.test(mod) ? "ct" : /qemu|virtual/.test(mod) ? "vm" : /storage/.test(mod) ? "storage" : /node/.test(mod) ? "node" : "annet";
      if (type === "lxc") type = "ct"; if (type === "qemu") type = "vm";
      // varsler: binærsensorer på som ikke er statuser
      alle(liste, /(stressed|overloaded|overbelast|stress)/, "binary_sensor").forEach((id) => R.proxmox.varsler.push(id));
      // felles prefiks → nøkkel og vmid
      // prefiks regnes bare av id-er med nummer foran (binary_sensor.stressed o.l. ligger på noden uten prefiks)
      const medNr = ids.filter((o) => /^\d+_/.test(o)); const grunnlag = medNr.length ? medNr : ids;
      let pre = grunnlag.reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); }, grunnlag[0] || "");
      pre = pre.slice(0, pre.lastIndexOf("_") + 1);
      const nokkel = pre.replace(/^\d+_(node|ct|lxc|vm|qemu|storage|disks?|mounted_disks)_/, "").replace(/_$/, "");
      const vmid = (nokkel.match(/_(\d{3,})$/) || [])[1];
      const rå = nokkel.replace(/_\d{3,}$/, "");
      let navn = devNavn(dev).replace(/^(\d+\s*[-_:]?\s*)?(lxc|ct|vm|qemu|node|storage)\s*[-_:]?\s*/i, "").replace(/\s*\(\d+\)\s*$/, "").trim() || tittel(rå);
      navn = nm[vmid] || nm[rå] || nm[navn] || navn.replace(/^./, (c) => c.toUpperCase());
      if (skjult(navn) || skjult(rå)) continue;
      const g = {
        id: "px-" + dev, kilde: "proxmox", type, navn, vmid, nokkel: rå,
        status: finn(liste, /(node_)?status$/, "sensor"),
        cpu: finn(liste, /cpu_usage$/, "sensor"),
        mem: finn(liste, /(memory|ram)_usage$/, "sensor"),
        ramBrukt: finn(liste, /ram_used$/, "sensor"), ramTot: finn(liste, /ram_total$/, "sensor"),
        diskBrukt: finn(liste, /disk_used$/, "sensor"), diskTot: finn(liste, /disk_total$/, "sensor"),
        oppetid: finn(liste, /uptime$/, "sensor"),
        rx: finn(liste, /network_rx$/, "sensor"), tx: finn(liste, /network_tx$/, "sensor"),
        load: finn(liste, /load_average_1m$/, "sensor"), swap: finn(liste, /swap_usage$/, "sensor"),
        iowait: finn(liste, /io_wait$/, "sensor"), oppdateringer: finn(liste, /node_updates$/, "sensor"),
        bruk: finn(liste, /_usage$/, "sensor"), brukt: finn(liste, /_used$/, "sensor"), ledig: finn(liste, /_free$/, "sensor"), total: finn(liste, /_total$/, "sensor"),
        knapper: liste.filter((e) => dom(e.entity_id) === "button").map((e) => {
          const o = obj(e.entity_id).slice(pre.length);
          const a = /^start/.test(o) ? "start" : /^stop/.test(o) ? "stopp" : /^(reboot|restart)/.test(o) ? "restart" : /^shutdown/.test(o) ? "av"
            : /^pause|suspend/.test(o) ? "pause" : /^resume/.test(o) ? "fortsett" : /^hibernate/.test(o) ? "dvale" : /^reset/.test(o) ? "reset" : null;
          return a ? { a, id: e.entity_id } : null;
        }).filter(Boolean),
      };
      if (type === "node") R.proxmox.noder.push(g);
      else if (type === "ct" || type === "vm") R.proxmox.gjester.push(g);
      else if (type === "storage") R.proxmox.lagring.push(g);
      else if (type === "mounted_disks") R.proxmox.montert = finn(liste, /./, "sensor");
      else if (type === "disks" || type === "disk" || type === "annet") {
        liste.filter((e) => dom(e.entity_id) === "sensor").forEach((e) => {
          const o = obj(e.entity_id);
          const m = o.match(/(airflow_temperature|temperature|temp|size|health|smart_status|wearout|life_left|power_on_hours)$/); if (!m) return;
          const k = o.slice(0, o.length - m[1].length).replace(/_$/, "").replace(/^\d+_disks?_/, "").replace(/^disks?_/, "");
          const d = (R.proxmox.diskerMap[k] = R.proxmox.diskerMap[k] || { id: "pd-" + k, nokkel: k });
          const f = /temp/.test(m[1]) ? "temp" : m[1] === "size" ? "storrelse" : /health|smart/.test(m[1]) ? "helse" : /wearout|life/.test(m[1]) ? "slitasje" : "timer";
          if (!d[f]) d[f] = e.entity_id;
        });
      }
    }
    // pene disknavn: «pve_samsung_ssd_840_evo_250gb» → «Samsung SSD 840 EVO 250 GB»
    const nodeNokler = R.proxmox.noder.map((n) => n.nokkel).filter(Boolean);
    R.proxmox.disker = Object.values(R.proxmox.diskerMap).filter((d) => !skjult(d.nokkel)).map((d) => {
      let t = d.nokkel.split("_"); if (t.length > 1 && nodeNokler.includes(t[0])) t = t.slice(1);
      d.navn = nm[d.nokkel] || t.map((w) => /^(ssd|hdd|nvme|evo|qvo|pro|wd|wdc|sata|m2)$/i.test(w) ? w.toUpperCase()
        : /^\d+(gb|tb)$/i.test(w) ? w.replace(/(\d+)(gb|tb)/i, (a, n, u) => n + " " + u.toUpperCase()) : w.replace(/^./, (c) => c.toUpperCase())).join(" ");
      return d;
    });
    const rek = { start: 0, restart: 1, stopp: 2, av: 3, pause: 4, fortsett: 5, dvale: 6, reset: 7 };
    [...R.proxmox.gjester, ...R.proxmox.noder].forEach((g) => g.knapper.sort((a, b) => rek[a.a] - rek[b.a]));
    R.proxmox.gjester.sort((a, b) => (a.type === b.type ? 0 : a.type === "vm" ? 1 : -1) || String(a.vmid || a.navn).localeCompare(String(b.vmid || b.navn), "nb", { numeric: true }));

    /* UniFi */
    for (const [dev, liste] of Object.entries(per.unifi || {})) {
      const navn = devNavn(dev) || "UniFi";
      if (skjult(navn)) continue;
      const bilde = finn(liste, /./, "image");
      const wlanKlienter = finn(liste, /(wlan_clients|clients|klienter)$/, "sensor");
      if (bilde || (liste.length <= 4 && finn(liste, /(aktivert|enabled|wlan)/, "switch"))) {
        R.unifi.wlan.push({ id: "wl-" + dev, navn, qr: bilde, klienter: wlanKlienter, bryter: finn(liste, /./, "switch") });
        continue;
      }
      const cpu = finn(liste, /cpu_utili[sz]ation$/, "sensor"), mem = finn(liste, /memory_utili[sz]ation$/, "sensor");
      const restart = finn(liste, /(restart|omstart)$/, "button");
      const portKnapper = liste.filter((e) => /port_(\d+)_power_cycle$/.test(obj(e.entity_id))).map((e) => ({ n: +obj(e.entity_id).match(/port_(\d+)_power_cycle$/)[1], id: e.entity_id, type: "syklus" }));
      const portBrytere = liste.filter((e) => dom(e.entity_id) === "switch" && /port_(\d+)(_poe)?$/.test(obj(e.entity_id))).map((e) => ({ n: +obj(e.entity_id).match(/port_(\d+)(_poe)?$/)[1], id: e.entity_id, type: "bryter" }));
      const led = finn(liste, /./, "light");
      if (!cpu && !mem && !restart && !portKnapper.length && !portBrytere.length && !led) continue; // klienter o.l.
      const latens = alle(liste, /wan_latency$/, "sensor");
      const m = devModell(dev);
      const type = latens.length || /dream|gateway|udm|udr|ucg|uxg|usg|cloud key/.test(m) ? "ruter"
        : portKnapper.length || portBrytere.length || /switch|usw|flex|\bus[- ]?\d/.test(m) ? "switch"
        : /access point|u6|u7|uap|mesh|nanohd|lite|pro ap|in-wall/.test(m) ? "ap" : "enhet";
      R.unifi.enheter.push({
        id: "uf-" + dev, navn, type, modell: (D[dev] && D[dev].model) || "",
        tracker: finn(liste, /./, "device_tracker"), cpu, mem,
        temp: finn(liste, /temperat/, "sensor"), oppetid: finn(liste, /(uptime|oppetid)$/, "sensor"),
        klienter: finn(liste, /(clients|klienter)$/, "sensor"), latens, led, restart,
        oppdatering: finn(liste, /./, "update"),
        porter: (portBrytere.length ? portBrytere : portKnapper).sort((a, b) => a.n - b.n),
      });
    }
    const typeRek = { ruter: 0, switch: 1, ap: 2, enhet: 3 };
    R.unifi.enheter.sort((a, b) => typeRek[a.type] - typeRek[b.type] || a.navn.localeCompare(b.navn, "nb"));

    /* Unraid */
    const ur = Object.entries(per.unraid || {});
    if (ur.length) {
      const liste = ur.flatMap(([, l]) => l);
      const serverNavn = devNavn(ur[0][0]) || "Unraid";
      const fn = (id) => { const s = hass.states[id]; return (s && s.attributes.friendly_name) || obj(id); };
      const kortNavn = (id) => { let t = fn(id); for (const [d] of ur) { const n = devNavn(d); if (n && t.toLowerCase().startsWith(n.toLowerCase())) t = t.slice(n.length); } return t.replace(/^[\s:–-]+/, "").trim() || tittel(obj(id)); };
      const system = /(array|parity|spin|share|mover|service|notification|flash|ups|plugin|fan|zfs|disk\d|cache)/;
      const brytere = liste.filter((e) => dom(e.entity_id) === "switch" && !e.entity_category && !system.test(obj(e.entity_id)));
      const disker = {};
      liste.filter((e) => dom(e.entity_id) === "sensor").forEach((e) => {
        const m = obj(e.entity_id).match(/(disk\d+|parity\d*|cache[a-z0-9]*)_(usage|temperature|temp)$/);
        if (m) { (disker[m[1]] = disker[m[1]] || { navn: m[1] })[m[2] === "usage" ? "bruk" : "temp"] = e.entity_id; }
      });
      R.unraid = {
        navn: serverNavn,
        cpu: finn(liste, /cpu_(usage|utili[sz]ation)$/, "sensor"),
        ram: finn(liste, /(ram|memory)_(usage|utili[sz]ation|used_percent|percent)$/, "sensor"),
        temp: finn(liste, /cpu_temp(erature)?$/, "sensor"),
        oppetid: finn(liste, /uptime$/, "sensor"),
        arrayBruk: finn(liste, /array_(usage|utili[sz]ation)$/, "sensor"),
        arrayStatus: finn(liste, /array_(state|status)$/, "sensor") || finn(liste, /array_(started|state)$/, "binary_sensor"),
        disker: Object.values(disker).sort((a, b) => a.navn.localeCompare(b.navn, "nb", { numeric: true })),
        gjester: brytere.filter((e) => !skjult(kortNavn(e.entity_id))).map((e) => {
          const vm = /(^|_)vm(_|$)/.test(obj(e.entity_id)) || /vm/.test(e.translation_key || "");
          const n = kortNavn(e.entity_id);
          const slug = obj(e.entity_id).split("_").pop();
          const restart = liste.find((x) => dom(x.entity_id) === "button" && obj(x.entity_id).includes(slug) && /restart/.test(obj(x.entity_id)));
          const oppd = liste.find((x) => dom(x.entity_id) === "binary_sensor" && obj(x.entity_id).includes(slug) && /update/.test(obj(x.entity_id)));
          return { id: "ur-" + e.entity_id, kilde: "unraid", type: vm ? "vm" : "docker", navn: nm[n] || n.replace(/^./, (c) => c.toUpperCase()), bryter: e.entity_id, restart: restart && restart.entity_id, oppdatering: oppd && oppd.entity_id };
        }).sort((a, b) => a.navn.localeCompare(b.navn, "nb")),
      };
    }

    /* qBittorrent */
    const qb = Object.values(per.qbittorrent || {}).flat();
    if (qb.length) R.qbit = {
      ned: finn(qb, /download_speed$/, "sensor"), opp: finn(qb, /upload_speed$/, "sensor"),
      status: finn(qb, /(current_)?status$/, "sensor"), aktive: finn(qb, /active_torrents$/, "sensor"),
      alle: finn(qb, /all_torrents$/, "sensor"), alt: finn(qb, /./, "switch"),
    };
    const st = Object.values(per.speedtestdotnet || {}).flat();
    if (st.length) R.speedtest = { ned: finn(st, /download$/, "sensor"), opp: finn(st, /upload$/, "sensor"), ping: finn(st, /ping$/, "sensor") };
    return R;
  }

  /* ─────────────── stil ─────────────── */
  const STIL = `
    :host { display:block; }
    .sokrad { display:flex; align-items:center; gap:10px; background:var(--gray100);
    border-radius:999px; padding:0 8px 0 16px; height:44px; --mdc-icon-size:19px;
    margin-bottom:8px; color:var(--gray1000); }
  .sokrad > ha-icon { opacity:.5; }
  .sokrad input { flex:1; min-width:0; border:0; background:none; color:inherit;
    font:inherit; font-size:15px; outline:none; }
  .sokrad input::placeholder { color:currentColor; opacity:.4; }
  .sokrad button { width:30px; height:30px; flex:none; border:0; border-radius:50%;
    background:rgba(128,128,128,.18); color:inherit; cursor:pointer; display:flex;
    align-items:center; justify-content:center; --mdc-icon-size:16px; }

  .tom { padding:16px 20px; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); color:var(--gray1000); font-size:14px; opacity:.8; }

    /* scene */
    .hl { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; color:#e8f1ff;
      background:linear-gradient(165deg,#141a22 0%,#18202b 55%,#1c2533 100%); -webkit-tap-highlight-color:transparent; outline:none; }
    .hl.trykk { cursor:pointer; } .hl.trykk:active { transform:scale(.985); }
    .hl:focus-visible { box-shadow:0 0 0 2px var(--active-big,#f5c542); }
    .glod { position:absolute; inset:0; z-index:-1; transition:opacity 1.2s;
      background:radial-gradient(70% 100% at 80% 110%, rgba(64,170,255,.30) 0%, transparent 62%); }
    .hl.laster .glod { background:radial-gradient(70% 100% at 80% 110%, rgba(90,230,200,.34) 0%, transparent 62%); }
    .hl.varsel .glod { background:radial-gradient(70% 100% at 80% 110%, rgba(255,90,70,.34) 0%, transparent 62%); }
    .tekst { position:absolute; left:20px; top:18px; bottom:14px; display:flex; flex-direction:column; z-index:2; max-width:44%; min-width:0; }
    .n { font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pille { align-self:flex-start; margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:999px;
      font-size:12px; font-weight:500; background:rgba(91,227,138,.2); white-space:nowrap; --mdc-icon-size:14px; max-width:100%; overflow:hidden; }
    .pille.gul { background:rgba(255,179,74,.28); } .pille.rod { background:rgba(255,80,70,.4); animation:rist 4s ease-in-out infinite; }
    @keyframes rist { 0%,90%,100% { transform:none; } 92% { transform:translateX(-2px); } 94% { transform:translateX(2px); } 96% { transform:translateX(-1px); } }
    .stor { margin-top:auto; font-size:2em; line-height:1.2em; font-weight:300; white-space:nowrap; }
    .stor small { font-size:14px; font-weight:300; margin-left:4px; opacity:.85; }
    .sub { font-size:13px; opacity:.62; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .scene { position:absolute; right:0; bottom:0; width:60%; max-width:300px; height:100%; }
    .scene svg { position:absolute; right:0; bottom:0; width:100%; height:100%; overflow:visible; }
    .scene text { font-family:inherit; }

    .ramme { fill:#0e1217; stroke:#2b333e; stroke-width:1.5; }
    .enhet { fill:#232a33; stroke:#303945; stroke-width:1; transition:stroke .4s; }
    .blank .innhold { display:none; } .vent { display:none; } .blank .vent { display:inline; }
    .av .innhold { opacity:.35; }
    .sky { fill:#dfe9f5; transition:fill .6s; } .hl.offline .sky { fill:#5b6573; }
    .t-ping { font-size:8px; font-weight:600; fill:#e8f1ff; opacity:.8; }
    .kabel { fill:none; stroke:rgba(255,255,255,.08); stroke-width:3; stroke-linecap:round; }
    .flyt { fill:none; stroke:#5ad1ff; stroke-width:3; stroke-linecap:round; stroke-dasharray:3 6; opacity:0; animation:flyt var(--flyt-tid,1.2s) linear infinite; }
    .hl.online .flyt { opacity:1; }
    .hl.laster .flyt { stroke:#5ae6c8; }
    @keyframes flyt { to { stroke-dashoffset:-18; } }
    .pil { fill:#5ae6c8; opacity:0; }
    .hl.laster .pil { animation:pil 1.1s linear infinite; } .hl.laster .p2 { animation-delay:.37s; } .hl.laster .p3 { animation-delay:.74s; }
    @keyframes pil { 0% { opacity:0; transform:translateY(-4px); } 30% { opacity:1; } 100% { opacity:0; transform:translateY(14px); } }
    .lysbar { fill:#d6ecff; filter:drop-shadow(0 0 3px rgba(150,210,255,.9)); animation:pust 4s ease-in-out infinite; }
    .av .lysbar { fill:#ff6b5a; filter:drop-shadow(0 0 3px rgba(255,100,80,.9)); }
    @keyframes pust { 0%,100% { opacity:.75; } 50% { opacity:1; } }
    .led { fill:#5be38a; } .av .led { fill:#ff5a4a; }
    .pl { fill:#3a4452; } .hl.online .pl.paa { fill:#5be38a; animation:blink var(--bt,1.3s) steps(2,end) infinite; }
    .pl.paa.o { fill:#ffb34a !important; }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.25; } }
    .seg { fill:#303945; transition:fill .5s; } .seg.paa { fill:#e57000; } .seg.paa.h { fill:#ff5a4a; }
    .pve-merke { font-size:7px; font-weight:700; fill:#e57000; letter-spacing:.5px; }
    .ur-merke { font-size:6.5px; font-weight:700; fill:#f15a2c; letter-spacing:.5px; }
    .vifte { transform-box:fill-box; transform-origin:center; animation:snurr var(--vifte-tid,2s) linear infinite; }
    .av .vifte { animation-play-state:paused; }
    @keyframes snurr { to { transform:rotate(360deg); } }
    .g-pve .enhet { stroke:#303945; } .hl.pve-varsel .g-pve .enhet { stroke:#ff5a4a; animation:varselkant 1.2s ease-in-out infinite; }
    @keyframes varselkant { 0%,100% { stroke-opacity:1; } 50% { stroke-opacity:.2; } }
    .bay { fill:#1a2028; stroke:#39424e; stroke-width:1; }
    .dl { fill:#5be38a; animation:blink var(--dt,2.2s) steps(2,end) infinite; }
    .hl.laster .dl { --dt:.35s; fill:#5ae6c8; }
    .dl.varm { fill:#ffb34a; }
    .fyllbak { fill:#303945; } .fyll { fill:#f15a2c; transition:width 1.4s cubic-bezier(.3,.8,.3,1); }

    /* lister */
    .liste { display:grid; gap:8px; }
    .rad { border-radius:var(--ha-card-border-radius,24px); background:var(--ki-rad-bg, var(--gray200)); color:var(--gray1000); overflow:hidden; transition:background .3s; }
    .topp { display:grid; grid-template-columns:76px minmax(0,1fr) auto; align-items:center; min-height:66px; cursor:pointer; -webkit-tap-highlight-color:transparent; user-select:none; }
    .topp:active { opacity:.8; }
    .ik { position:relative; width:56px; height:56px; margin:4px; border-radius:50%; background:rgba(250,251,252,.1); border:1px solid rgba(250,251,252,.1);
      display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
    .ik ha-icon { --mdc-icon-size:26px; }
    .prikk { position:absolute; right:3px; top:3px; width:11px; height:11px; border-radius:50%; background:var(--gray600,#777); box-shadow:0 0 0 2px var(--ki-rad-bg, var(--gray200)); }
    .prikk.gronn { background:var(--green,#5be38a); } .prikk.rod { background:var(--red,#ff5a4a); } .prikk.gul { background:var(--orange,#ffb34a); }
    .prikk.gronn::after { content:""; position:absolute; inset:0; border-radius:50%; background:inherit; animation:ring 2.4s ease-out infinite; }
    @keyframes ring { 0% { transform:scale(1); opacity:.7; } 100% { transform:scale(2.4); opacity:0; } }
    .midt { min-width:0; padding-right:8px; }
    .l { font-size:16px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .d { font-size:14px; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
    .hoyre { display:flex; align-items:center; gap:10px; padding-right:16px; }
    .ring { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; font-size:10px; font-weight:600;
      background:conic-gradient(var(--rc,var(--green)) calc(var(--p,0) * 1%), rgba(250,251,252,.12) 0); position:relative; }
    .ring::before { content:""; position:absolute; inset:4px; border-radius:50%; background:var(--ki-rad-bg, var(--gray200)); }
    .ring span { position:relative; }
    .pilned { --mdc-icon-size:20px; opacity:.5; transition:transform .35s cubic-bezier(.3,1.4,.5,1); }
    .rad.apen .pilned { transform:rotate(180deg); }
    .panel { display:grid; grid-template-rows:0fr; transition:grid-template-rows .35s ease; }
    .rad.apen .panel { grid-template-rows:1fr; }
    .panel > div { overflow:hidden; }
    .innmat { padding:0 12px 12px; display:grid; gap:8px; }
    .chips { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:8px; }
    .chip { background:var(--gray100); border-radius:16px; padding:8px 12px; min-width:0; }
    .chip b { display:block; font-size:15px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chip i { font-style:normal; font-size:12px; opacity:.65; }
    .knapper { display:grid; grid-template-columns:repeat(auto-fit,minmax(62px,1fr)); gap:8px; }
    .kn { background:var(--gray100); border-radius:16px; padding:10px 4px 8px; display:flex; flex-direction:column; align-items:center; gap:4px;
      font-size:11px; font-weight:500; cursor:pointer; border:none; color:inherit; font-family:inherit; transition:transform .15s; }
    .kn:active { transform:scale(.94); }
    .kn ha-icon { --mdc-icon-size:22px; }
    .kn.gronn ha-icon { color:var(--green); } .kn.oransje ha-icon { color:var(--orange); } .kn.rod ha-icon { color:var(--red); }
    .kn.paa { background:var(--active-big); color:var(--black); } .kn.paa ha-icon { color:var(--black); }
    .porter { display:grid; grid-template-columns:repeat(auto-fill,minmax(40px,1fr)); gap:6px; }
    .port { background:var(--gray100); border-radius:10px; padding:9px 0; text-align:center; font-size:12px; cursor:pointer; border:none; color:inherit; font-family:inherit; }
    .port.paa { background:var(--blue); color:var(--black); }
    .port.jobber { animation:blink .5s steps(2,end) infinite; }
    .qr { justify-self:center; width:min(220px,70%); aspect-ratio:1; border-radius:14px; background:#fff; padding:10px; box-sizing:border-box; }
    .qr img { width:100%; height:100%; object-fit:contain; display:block; }
    .strek { height:6px; border-radius:3px; background:rgba(250,251,252,.12); overflow:hidden; margin:0 16px 12px 16px; }
    .strek i { display:block; height:100%; border-radius:3px; background:var(--green); transition:width 1s ease; }
    .overskrift { font-size:14px; opacity:.7; padding:4px 4px 0; }

    /* nedlasting */
    .nd { position:relative; height:180px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; color:#e8f1ff; cursor:pointer;
      background:linear-gradient(165deg,#12191f 0%,#16211f 55%,#1a2a28 100%); -webkit-tap-highlight-color:transparent; }
    .nd:active { transform:scale(.985); }
    .nd .glod { background:radial-gradient(70% 100% at 72% 40%, rgba(90,230,200,.0) 0%, transparent 60%); transition:background 1.2s; }
    .nd.laster .glod { background:radial-gradient(60% 90% at 72% 38%, rgba(90,230,200,.30) 0%, transparent 62%); }
    .nd.begrenset .glod { background:radial-gradient(60% 90% at 72% 38%, rgba(255,179,74,.22) 0%, transparent 62%); }
    .nd.av { background:linear-gradient(165deg,#1c2130,#232838); }
    .nd .pille { background:rgba(232,241,255,.12); } .nd.laster .pille { background:rgba(90,230,200,.24); } .nd.begrenset .pille { background:rgba(255,179,74,.28); }
    .peer { fill:#1f2833; stroke:#3b4757; stroke-width:1.2; transition:stroke .6s, fill .6s; }
    .peer.ned { stroke:#5ae6c8; fill:#1c3a36; } .peer.opp { stroke:#ffb34a; fill:#3a2e1c; } .peer.ned.opp { stroke:#b8f0e4; }
    .peer.ned, .peer.opp { animation:peerpuls 2.4s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
    @keyframes peerpuls { 0%,100% { transform:scale(1); } 50% { transform:scale(1.25); } }
    .spor { stroke:rgba(255,255,255,.07); stroke-width:1.2; fill:none; }
    .strom { fill:none; stroke-width:2.2; stroke-linecap:round; stroke-dasharray:2 9; opacity:0; transition:opacity .6s; }
    .strom.ned { stroke:#5ae6c8; animation:flyt var(--ned-tid,1.2s) linear infinite; }
    .strom.opp { stroke:#ffb34a; animation:flyt var(--opp-tid,1.4s) linear infinite; }
    .strom.paa { opacity:1; }
    .hub { fill:#1b2530; stroke:#3b4757; stroke-width:1.5; transition:stroke .6s; } .nd.laster .hub { stroke:#5ae6c8; }
    .hubring { fill:none; stroke:#5ae6c8; stroke-width:1.5; opacity:0; transform-box:fill-box; transform-origin:center; }
    .nd.laster .hubring { animation:hubring 2s ease-out infinite; }
    @keyframes hubring { 0% { opacity:.7; transform:scale(1); } 100% { opacity:0; transform:scale(1.9); } }
    .hubpil { fill:#e8f1ff; } .nd.laster .hubpil { animation:hubpil 1.1s ease-in-out infinite; fill:#5ae6c8; }
    @keyframes hubpil { 0%,100% { transform:translateY(-1.5px); } 50% { transform:translateY(1.5px); } }
    .t-hub { font-size:8px; font-weight:600; fill:#e8f1ff; }
    .graf-ned { fill:url(#gn); stroke:#5ae6c8; stroke-width:1.4; vector-effect:non-scaling-stroke; transition:d .8s; }
    .graf-opp { fill:none; stroke:#ffb34a; stroke-width:1.2; stroke-dasharray:3 2; vector-effect:non-scaling-stroke; }
    .graf-akse { stroke:rgba(255,255,255,.08); stroke-width:1; }
    .t-graf { font-size:7px; fill:#e8f1ff; opacity:.5; }
    .skilpadde { opacity:0; transition:opacity .5s; } .nd.begrenset .skilpadde { opacity:1; }

    /* lagring */
    .lg { display:grid; gap:8px; }
    .ar { position:relative; height:196px; border-radius:var(--ha-card-border-radius,24px); overflow:hidden; isolation:isolate; color:#e8f1ff;
      background:linear-gradient(165deg,#161a22 0%,#1b202b 55%,#221f2b 100%); }
    .ar .glod { background:radial-gradient(70% 100% at 78% 110%, rgba(241,90,44,.26) 0%, transparent 62%); }
    .ar.stoppet .glod { background:radial-gradient(70% 100% at 78% 110%, rgba(255,90,70,.36) 0%, transparent 62%); }
    .ar .pille { background:rgba(91,227,138,.2); } .ar.stoppet .pille { background:rgba(255,80,70,.4); }
    .ar .scene { width:62%; max-width:320px; }
    .ror-ytre { fill:#10151c; stroke:#2f3a47; stroke-width:1.2; transition:stroke .6s; }
    .ror-ytre.varm { stroke:#ffb34a; animation:varselkant 1.8s ease-in-out infinite; } .ror-ytre.het { stroke:#ff5a4a; animation:varselkant 1s ease-in-out infinite; }
    .vaeske { transition:transform 1.6s cubic-bezier(.3,.8,.3,1); animation:stig 1.6s cubic-bezier(.3,.8,.3,1); }
    @keyframes stig { from { transform:translateY(124px); } }
    .bolgetopp { animation:skvulp 3s ease-in-out infinite; }
    @keyframes skvulp { 0%,100% { transform:translateX(0); } 50% { transform:translateX(-6px); } }
    .t-ror { font-size:8.5px; font-weight:600; fill:#e8f1ff; } .t-temp { font-size:7.5px; fill:#e8f1ff; opacity:.6; }
    .t-temp.varm { fill:#ffb34a; opacity:1; } .t-temp.het { fill:#ff5a4a; opacity:1; }
    .t-pst { font-size:7px; font-weight:600; fill:#0e1217; }
    .lg-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .fl { background:var(--gray200); color:var(--gray1000); border-radius:var(--ha-card-border-radius,24px); padding:14px 16px 16px; display:grid; gap:10px;
      cursor:pointer; min-width:0; -webkit-tap-highlight-color:transparent; }
    .fl:active { transform:scale(.97); }
    .fl .hode { display:flex; align-items:center; gap:10px; min-width:0; }
    .fl .hode .ik { width:40px; height:40px; margin:0; flex:none; } .fl .hode .ik ha-icon { --mdc-icon-size:22px; }
    .fl .hode span { font-size:14px; font-weight:500; opacity:.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .smult { justify-self:center; position:relative; width:108px; height:108px; }
    .smult svg { width:100%; height:100%; transform:rotate(-90deg); }
    .smult .bak { fill:none; stroke:rgba(250,251,252,.1); stroke-width:10; }
    .smult .bue { fill:none; stroke-width:10; stroke-linecap:round; stroke-dasharray:264; transition:stroke-dashoffset 1.2s cubic-bezier(.3,.8,.3,1), stroke .6s; animation:tegn 1.3s cubic-bezier(.3,.8,.3,1); }
    @keyframes tegn { from { stroke-dashoffset:264; } }
    .smult .midt2 { position:absolute; inset:0; display:grid; place-content:center; text-align:center; }
    .smult b { font-size:26px; font-weight:300; line-height:1; } .smult b small { font-size:13px; opacity:.7; margin-left:1px; }
    .smult i { font-style:normal; font-size:11px; opacity:.6; margin-top:3px; }
    .fl .bunn { font-size:12px; opacity:.7; text-align:center; line-height:1.45; min-width:0; }
    .fl .bunn div { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .fl.bred { grid-column:1 / -1; grid-template-columns:auto 1fr; align-items:center; gap:12px; padding:12px 16px; }
    .fl.bred .bunn { text-align:left; font-size:14px; opacity:.9; }
    @media (prefers-reduced-motion: reduce) { * { animation:none !important; transition:none !important; } }
    @media (max-width:380px) { .scene { width:56%; } .tekst { max-width:44%; } }
  `;

  /* ─────────────── scene-SVG ─────────────── */
  const PORTER = 12, BAYS = 5, SEG = 10;
  const SVG = `<svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <path class="sky" d="M122 24 h36 a8 8 0 0 0 0-16 a11 11 0 0 0-20-4 a8 8 0 0 0-14 5 a7.5 7.5 0 0 0-2 15z"/>
    <text class="t-ping" x="114" y="17" text-anchor="end"></text>
    <path class="kabel" d="M140 25 V44"/><path class="flyt" d="M140 25 V44"/>
    <path class="pil" d="M137 27 l3 3 3-3z"/><path class="pil p2" d="M137 27 l3 3 3-3z"/><path class="pil p3" d="M137 27 l3 3 3-3z"/>
    <rect class="ramme" x="80" y="40" width="116" height="138" rx="6"/>
    <!-- ruter -->
    <g class="g-gw"><rect class="enhet" x="86" y="46" width="104" height="17" rx="3"/>
      <g class="innhold"><rect class="lysbar" x="96" y="53.5" width="46" height="2" rx="1"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${152 + i * 7}" y="51" width="5" height="4" rx=".8" fill="#141a20"/>`).join("")}
        <circle class="led" cx="92" cy="54.5" r="1.8"/></g>
      <g class="vent">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${100 + i * 10}" y="53" width="6" height="3" rx="1" fill="#1a2028"/>`).join("")}</g></g>
    <!-- switch -->
    <g class="g-sw"><rect class="enhet" x="86" y="66" width="104" height="17" rx="3"/>
      <g class="innhold">${Array.from({ length: PORTER }, (_, i) => `<circle class="pl" data-i="${i}" cx="${96 + i * 7.6}" cy="74.5" r="1.9" style="--bt:${(0.6 + ((i * 37) % 11) / 10).toFixed(2)}s;animation-delay:-${((i * 0.29) % 1.3).toFixed(2)}s"/>`).join("")}
        <circle class="led" cx="186" cy="74.5" r="1.4"/></g>
      <g class="vent">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${100 + i * 10}" y="73" width="6" height="3" rx="1" fill="#1a2028"/>`).join("")}</g></g>
    <!-- Proxmox -->
    <g class="g-pve"><rect class="enhet" x="86" y="86" width="104" height="34" rx="3"/>
      <g class="innhold"><text class="pve-merke" x="92" y="98">PVE</text>
        ${Array.from({ length: SEG }, (_, i) => `<rect class="seg" data-i="${i}" x="${92 + i * 5.6}" y="104" width="4" height="9" rx="1"/>`).join("")}
        <circle cx="172" cy="103" r="12" fill="#161b21"/>
        <g class="vifte"><circle cx="172" cy="103" r="12" fill="none"/>
          <path d="M172 103 q-2-9 5-10 q1 6-5 10 M172 103 q9-2 10 5 q-6 1-10-5 M172 103 q2 9-5 10 q-1-6 5-10 M172 103 q-9 2-10-5 q6-1 10 5" fill="#8a96a6"/></g>
        <circle cx="172" cy="103" r="2.2" fill="#161b21"/>
        <circle class="led" cx="152" cy="94" r="1.6"/></g>
      <g class="vent">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${100 + i * 10}" y="101" width="6" height="3" rx="1" fill="#1a2028"/>`).join("")}</g></g>
    <!-- Unraid -->
    <g class="g-ur"><rect class="enhet" x="86" y="123" width="104" height="50" rx="3"/>
      <g class="innhold">
        ${Array.from({ length: BAYS }, (_, i) => `<rect class="bay" x="${92 + i * 12.5}" y="128" width="10" height="28" rx="2"/>
          <circle class="dl" data-i="${i}" cx="${97 + i * 12.5}" cy="151" r="1.6" style="--dt:${(1.4 + ((i * 53) % 13) / 10).toFixed(2)}s;animation-delay:-${((i * 0.41) % 1.7).toFixed(2)}s"/>`).join("")}
        <text class="ur-merke" x="172" y="136" text-anchor="middle">UNRAID</text>
        <text class="t-array" x="172" y="150" text-anchor="middle" font-size="9" font-weight="600" fill="#e8f1ff"></text>
        <rect class="fyllbak" x="92" y="162" width="92" height="4" rx="2"/><rect class="fyll" x="92" y="162" width="0" height="4" rx="2"/>
        <circle class="led" cx="186" cy="129" r="1.4"/></g>
      <g class="vent">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${100 + i * 10}" y="146" width="6" height="3" rx="1" fill="#1a2028"/>`).join("")}</g></g>
  </svg>`;

  const HANDLING = {
    start: ["mdi:play", "Start", "gronn", false], restart: ["mdi:restart", "Restart", "oransje", true], stopp: ["mdi:stop", "Stopp", "", true],
    av: ["mdi:power", "Av", "rod", true], pause: ["mdi:pause", "Pause", "", false], fortsett: ["mdi:play-pause", "Fortsett", "", false],
    dvale: ["mdi:moon-waning-crescent", "Dvale", "", false], reset: ["mdi:restart-alert", "Reset", "rod", true],
  };

  /* ─────────────── kortet ─────────────── */
  class KiHomelabCard extends HTMLElement {
    static getStubConfig() { return { vis: "scene" }; }
    static getConfigForm() {
      return {
        schema: [
          { name: "vis", selector: { select: { mode: "dropdown", options: [
            { value: "scene", label: "Animert rack" }, { value: "nedlasting", label: "Nedlastinger (animert)" }, { value: "gjester", label: "Containere og VM-er" },
            { value: "nettverk", label: "UniFi-enheter og Wi-Fi" }, { value: "lagring", label: "Lagring" }] } } },
          { name: "kilde", selector: { select: { mode: "dropdown", options: [{ value: "alle", label: "Alle" }, { value: "proxmox", label: "Proxmox" }, { value: "unraid", label: "Unraid" }] } } },
          { name: "navn", selector: { text: {} } },
          { name: "tap_action", selector: { ui_action: {} } },
        ],
        computeLabel: (s) => ({ vis: "Visning", kilde: "Kilde (containere og VM-er)", navn: "Navn", tap_action: "Trykk (animert rack)" }[s.name] || s.name),
      };
    }
    setConfig(c) {
      this._c = { vis: "scene", kilde: "alle", navn: "Homelab", ...(c || {}) };
      this._R = null; this._bygget = false; this._apne = this._apne || new Set(); this._nokler = "";
      if (this._hass) this._oppdater();
    }
    set hass(h) {
      const forrige = this._hass; this._hass = h; if (!this._c) return;
      const n = Object.keys(h.entities || {}).length;
      if (!this._R || n !== this._antall || Date.now() - (this._tid || 0) > 60000) { this._R = oppdag(h, this._c); this._antall = n; this._tid = Date.now(); this._ids = null; }
      if (forrige && this._ids && this._ids.every((id) => forrige.states[id] === h.states[id])) return;
      this._oppdater();
    }
    getCardSize() { return this._c && ["scene", "nedlasting"].includes(this._c.vis) ? 4 : 6; }
    getGridOptions() { return { columns: 12, rows: this._c && ["scene", "nedlasting"].includes(this._c.vis) ? 3 : "auto", min_rows: 2 }; }
    disconnectedCallback() { clearInterval(this._graftimer); this._graftimer = null; }
    connectedCallback() { if (this._c && this._c.vis === "nedlasting" && this._bygget && !this._graftimer) this._graftimer = setInterval(() => this._tegnGraf(), 15000); }

    /** oppdater bare elementer merket data-u, så CSS-overganger og animasjoner fortsetter */
    _patch(rot, html) {
      const t = document.createElement("template"); t.innerHTML = html;
      const nye = {}; t.content.querySelectorAll("[data-u]").forEach((el) => { nye[el.dataset.u] = el; });
      rot.querySelectorAll("[data-u]").forEach((el) => {
        const n = nye[el.dataset.u]; if (!n) return;
        for (const a of n.attributes) if (el.getAttribute(a.name) !== a.value) el.setAttribute(a.name, a.value);
        for (const a of [...el.attributes]) if (!n.hasAttribute(a.name)) el.removeAttribute(a.name);
        if (el.innerHTML !== n.innerHTML) el.innerHTML = n.innerHTML;
      });
    }

    /* felles */
    get s() { const h = this._hass; return (id) => (id ? h.states[id] : undefined); }
    _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }
    _trykkeknapp(id, bekreft) {
      if (bekreft && !confirm(bekreft)) return;
      this._hass.callService("button", "press", { entity_id: id }); navigator.vibrate && navigator.vibrate(10);
    }
    _veksle(id) { this._hass.callService("homeassistant", "toggle", { entity_id: id }); navigator.vibrate && navigator.vibrate(10); }
    _rot() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: "open" });
        this.shadowRoot.addEventListener("click", (e) => this._klikk(e));
      }
      return this.shadowRoot;
    }
    _klikk(e) {
      const el = e.composedPath().find((x) => x.dataset && (x.dataset.a || x.dataset.apne)); if (!el) return;
      if (el.dataset.apne) {
        const id = el.dataset.apne, rad = el.closest(".rad");
        if (this._apne.has(id)) this._apne.delete(id); else this._apne.add(id);
        rad && rad.classList.toggle("apen", this._apne.has(id)); navigator.vibrate && navigator.vibrate(8); return;
      }
      const [a, id, ekstra] = el.dataset.a.split("|");
      if (a === "knapp") this._trykkeknapp(id, ekstra);
      else if (a === "veksle") this._veksle(id);
      else if (a === "mer") this._mer(id);
      else if (a === "port") { el.classList.add("jobber"); setTimeout(() => el.classList.remove("jobber"), 4000); this._trykkeknapp(id, ekstra); }
      else if (a === "scene") this._sceneTrykk();
      else if (a === "ned") this._mer(this._R.qbit && this._R.qbit.ned);
      e.stopPropagation();
    }

    _oppdater() {
      const v = this._c.vis;
      if (v === "gjester") this._gjester();
      else if (v === "nettverk") this._nettverk();
      else if (v === "lagring") this._lagring();
      else if (v === "nedlasting") this._nedlasting();
      else this._scene();
    }

    /* ── scene ── */
    _sceneTrykk() {
      const a = this._c.tap_action; if (!a || a.action === "none") return;
      if (a.action === "navigate" && a.navigation_path) { history.pushState(null, "", a.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); }
      else if (a.action === "more-info") this._mer(a.entity);
      else this.dispatchEvent(new CustomEvent("hass-action", { detail: { config: { tap_action: a }, action: "tap" }, bubbles: true, composed: true }));
    }
    _scene() {
      const R = this._R, s = this.s, c = this._c, rot = this._rot();
      if (!this._bygget || this._modus !== "scene") {
        rot.innerHTML = `<style>${STIL}</style><div class="hl ${c.tap_action && c.tap_action.action !== "none" ? "trykk" : ""}" data-a="scene" role="img" tabindex="0">
          <div class="glod"></div><div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
          <div class="stor"></div><div class="sub"></div></div><div class="scene">${SVG}</div></div>`;
        this._bygget = true; this._modus = "scene";
      }
      const $ = (q) => rot.querySelector(q), $$ = (q) => rot.querySelectorAll(q), kort = $(".hl");
      const ids = [];
      const bruk = (id) => { if (id) ids.push(id); return s(id); };

      // nett
      const gw = R.unifi.enheter.find((e) => e.type === "ruter"), sw = R.unifi.enheter.filter((e) => e.type === "switch");
      const gwT = gw && bruk(gw.tracker);
      const pinger = gw ? gw.latens.map((id) => tall(bruk(id))).filter((v) => !isNaN(v)) : [];
      let ping = pinger.length ? Math.min(...pinger) : NaN;
      if (isNaN(ping) && R.speedtest) ping = tall(bruk(R.speedtest.ping));
      const online = gw ? !(gwT && gwT.state === "not_home") : true;
      // proxmox
      const node = R.proxmox.noder[0];
      const nodeCpu = node ? tall(bruk(node.cpu)) : NaN;
      const nodeOn = node ? !(ok(bruk(node.status)) && /off|stop/i.test(s(node.status).state)) : false;
      const pveVarsler = R.proxmox.varsler.filter((id) => { const x = bruk(id); return x && x.state === "on"; });
      const gjester = R.proxmox.gjester.concat(R.unraid ? R.unraid.gjester : []);
      let kjorer = 0, stoppet = 0;
      gjester.forEach((g) => {
        const st = g.kilde === "proxmox" ? bruk(g.status) : bruk(g.bryter);
        if (!ok(st)) return;
        if (/^(running|on|started)$/i.test(st.state)) kjorer++; else stoppet++;
      });
      // unraid
      const U = R.unraid;
      const uCpu = U ? tall(bruk(U.cpu)) : NaN, arr = U ? tall(bruk(U.arrayBruk)) : NaN;
      const arrSt = U && bruk(U.arrayStatus);
      const arrayOk = !arrSt || /started|on|normal|ok/i.test(arrSt.state);
      // qbit
      const Q = R.qbit, ned = Q ? byteRate(bruk(Q.ned)) : NaN, opp = Q ? byteRate(bruk(Q.opp)) : NaN;
      const laster = ned > 50000;
      this._ids = ids.concat(gw ? [gw.tracker] : []);

      // klasser
      kort.classList.toggle("online", online);
      kort.classList.toggle("offline", !online);
      kort.classList.toggle("laster", laster && online);
      kort.classList.toggle("pve-varsel", pveVarsler.length > 0);
      const varsel = !online || pveVarsler.length > 0 || !arrayOk || (node && !nodeOn);
      kort.classList.toggle("varsel", varsel);
      $(".g-gw").classList.toggle("blank", !gw); $(".g-gw").classList.toggle("av", !online);
      $(".g-sw").classList.toggle("blank", !sw.length);
      $(".g-pve").classList.toggle("blank", !node); $(".g-pve").classList.toggle("av", !!node && !nodeOn);
      $(".g-ur").classList.toggle("blank", !U); $(".g-ur").classList.toggle("av", !!U && !arrayOk);

      // fart på dataflyt: raskere med mer trafikk, litt tregere med høy ping
      const trafikk = isNaN(ned) ? 0 : ned;
      kort.style.setProperty("--flyt-tid", (laster ? klem(1.2 - Math.log10(trafikk / 5e4 + 1) * 0.5, 0.25, 1.2) : klem(0.9 + (isNaN(ping) ? 0 : ping) / 60, 0.9, 2.4)).toFixed(2) + "s");
      $(".t-ping").textContent = !online ? "offline" : isNaN(ping) ? "" : Math.round(ping) + " ms";
      // switchporter: antall lysende følger klienter
      let klienter = 0; sw.forEach((e) => { const k = tall(bruk(e.klienter)); if (!isNaN(k)) klienter += k; });
      const gwKl = gw ? tall(bruk(gw.klienter)) : NaN;
      if (!klienter && !isNaN(gwKl)) klienter = gwKl;
      const aktivePorter = sw.length ? klem(Math.round(klienter) || Math.ceil(PORTER / 2), 1, PORTER) : 0;
      $$(".pl").forEach((p, i) => { p.classList.toggle("paa", i < aktivePorter); p.classList.toggle("o", i === 0 && laster); });
      // proxmox CPU-segmenter og vifte
      const segN = isNaN(nodeCpu) ? 0 : Math.ceil(klem(nodeCpu, 0, 100) / 10);
      $$(".seg").forEach((r, i) => { r.classList.toggle("paa", i < segN); r.classList.toggle("h", i < segN && i >= 8); });
      kort.style.setProperty("--vifte-tid", (isNaN(nodeCpu) ? 2 : klem(2.4 - nodeCpu / 40, 0.35, 2.4)).toFixed(2) + "s");
      // unraid disker og array
      const disker = U ? U.disker : [];
      $$(".dl").forEach((d, i) => {
        const dk = disker[i]; const t = dk ? tall(bruk(dk.temp)) : NaN;
        d.style.display = U && (disker.length === 0 || i < disker.length) ? "" : "none";
        d.classList.toggle("varm", t >= 45);
      });
      $(".t-array").textContent = isNaN(arr) ? "" : Math.round(arr) + " %";
      $(".fyll").setAttribute("width", isNaN(arr) ? 0 : (klem(arr, 0, 100) / 100 * 92).toFixed(1));

      // tekst
      $(".n").textContent = c.navn;
      let pt, ik, kl = "";
      if (!online) { pt = "Internett nede"; ik = "mdi:web-off"; kl = "rod"; }
      else if (pveVarsler.length) { pt = "Proxmox under press"; ik = "mdi:alert-octagon"; kl = "rod"; }
      else if (node && !nodeOn) { pt = "Node offline"; ik = "mdi:server-network-off"; kl = "rod"; }
      else if (!arrayOk) { pt = "Array stoppet"; ik = "mdi:harddisk-remove"; kl = "rod"; }
      else if (stoppet) { pt = `${stoppet} stoppet`; ik = "mdi:alert-circle-outline"; kl = "gul"; }
      else if (laster) { pt = "Laster ned"; ik = "mdi:download"; }
      else { pt = "Alt kjører"; ik = "mdi:check-circle"; }
      const pille = $(".pille"); pille.className = "pille " + kl;
      pille.querySelector("ha-icon").setAttribute("icon", ik); pille.querySelector(".pt").textContent = pt;
      if (laster && online) { const [v, u] = fartTekst(ned); $(".stor").innerHTML = `↓ ${v}<small>${u}</small>`; }
      else if (gjester.length) $(".stor").innerHTML = `${kjorer}<small>av ${kjorer + stoppet} kjører</small>`;
      else if (!isNaN(nodeCpu)) $(".stor").innerHTML = `${Math.round(nodeCpu)}<small>% CPU</small>`;
      else $(".stor").innerHTML = isNaN(ping) ? "--" : `${Math.round(ping)}<small>ms</small>`;
      const deler = [];
      if (!isNaN(ping) && online) deler.push(`Ping ${Math.round(ping)} ms`);
      if (!isNaN(nodeCpu)) deler.push(`PVE ${Math.round(nodeCpu)} %`);
      if (!isNaN(uCpu) && isNaN(nodeCpu)) deler.push(`Unraid ${Math.round(uCpu)} %`);
      if (laster && !isNaN(opp)) { const [v, u] = fartTekst(opp); deler.push(`↑ ${v} ${u}`); }
      $(".sub").textContent = deler.join("  ·  ");
      kort.setAttribute("aria-label", `${c.navn}: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }

    /* ── liste-rammeverk ── */
    _liste(rader, tomTekst) {
      const rot = this._rot();
      const alle = rader.length;

      /* Søket filtrerer på navnet og undertittelen, som er der applikasjonsnavnet står —
         «Plex», «Docker», «CT 104». Det ligger her og ikke i hver visning, så Proxmox,
         Unraid, nettverk og lagring får det med samme oppførsel. */
      const sok = (this._sok || "").trim().toLowerCase();
      if (sok) {
        rader = rader.filter((r) => (`${r.l} ${r.d || ""}`).toLowerCase().includes(sok));
      }

      const visSok = this._c.sok !== false && (alle >= (Number(this._c.sok_fra) || 8) || sok);
      const nokler = this._c.vis + "|" + (visSok ? "s" : "") + sok + "|"
        + rader.map((r) => r.id).join(",");

      if (!this._bygget || this._modus !== this._c.vis || nokler !== this._nokler) {
        const felt = visSok ? `<label class="sokrad">
            <ha-icon icon="mdi:magnify"></ha-icon>
            <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                   placeholder="Søk blant ${alle}" value="${esc(this._sok || "")}" />
            ${sok ? `<button data-tomsok="1" aria-label="Tøm"><ha-icon icon="mdi:close"></ha-icon></button>` : ""}
          </label>` : "";
        const innhold = rader.length
          ? `<div class="liste">${rader.map((r) => this._radHtml(r)).join("")}</div>`
          : `<div class="tom">${esc(sok ? `Ingen treff på «${this._sok}».` : tomTekst)}</div>`;
        rot.innerHTML = `<style>${STIL}</style>` + felt + innhold;
        this._bygget = true; this._modus = this._c.vis; this._nokler = nokler;

        /* Søkefeltet tegnes bare når nøkkelen endrer seg, og tastetrykk endrer den.
           Derfor settes markøren tilbake: uten det hopper den til slutten. */
        const inp = rot.querySelector(".sokrad input");
        if (inp) {
          inp.addEventListener("input", (e) => {
            const pos = e.target.selectionStart;
            this._sok = e.target.value;
            this._tegn();
            const ny = this._rot().querySelector(".sokrad input");
            if (ny) { ny.focus(); try { ny.setSelectionRange(pos, pos); } catch (x) { /* ok */ } }
          });
          if (this._sokFokus) { this._sokFokus = false; inp.focus(); }
        }
        const tom = rot.querySelector("[data-tomsok]");
        if (tom) tom.addEventListener("click", () => { this._sok = ""; this._tegn(); });
      } else {
        rader.forEach((r) => {
          const el = rot.querySelector(`.rad[data-id="${r.id}"]`); if (!el) return;
          const ny = document.createElement("template"); ny.innerHTML = this._radHtml(r);
          const n = ny.content.firstElementChild;
          // bytt bare innholdet som endrer seg – panel og åpen-status beholdes
          ["topp", "strek"].forEach((k) => { const a = el.querySelector("." + k), b = n.querySelector("." + k); if (a && b && a.outerHTML !== b.outerHTML) a.replaceWith(b); });
          const ai = el.querySelector(".innmat"), bi = n.querySelector(".innmat");
          if (ai && bi && ai.innerHTML !== bi.innerHTML) ai.innerHTML = bi.innerHTML;
        });
      }
    }
    _radHtml(r) {
      const apen = this._apne.has(r.id);
      return `<div class="rad ${apen ? "apen" : ""}" data-id="${r.id}">
        <div class="topp" data-apne="${r.panel ? r.id : ""}" ${r.panel ? "" : `data-a="mer|${r.mer || ""}"`}>
          <div class="ik"><ha-icon icon="${r.ikon}"></ha-icon>${r.prikk ? `<i class="prikk ${r.prikk}"></i>` : ""}</div>
          <div class="midt"><div class="l">${esc(r.l)}</div><div class="d">${esc(r.d || "")}</div></div>
          <div class="hoyre">${r.hoyre || ""}${r.panel ? `<ha-icon class="pilned" icon="mdi:chevron-down"></ha-icon>` : ""}</div></div>
        ${r.strek !== undefined ? `<div class="strek"><i style="width:${klem(r.strek, 0, 100)}%;background:${r.strek >= 90 ? "var(--red)" : r.strek >= 75 ? "var(--orange)" : "var(--green)"}"></i></div>` : ""}
        ${r.panel ? `<div class="panel"><div><div class="innmat">${r.panel}</div></div></div>` : ""}</div>`;
    }
    _ring(p, farge) {
      if (isNaN(p)) return "";
      const f = farge || (p >= 85 ? "var(--red)" : p >= 60 ? "var(--orange)" : "var(--green)");
      return `<div class="ring" style="--p:${klem(p, 0, 100).toFixed(0)};--rc:${f}"><span>${Math.round(p)}</span></div>`;
    }
    _chip(verdi, etikett, id) { return verdi === "--" || verdi === undefined ? "" : `<div class="chip" ${id ? `data-a="mer|${id}"` : ""}><b>${esc(verdi)}</b><i>${esc(etikett)}</i></div>`; }
    _knapper(liste) {
      return liste.length ? `<div class="knapper">${liste.map((k) => {
        const [ik, navn, farge, farlig] = HANDLING[k.a] || ["mdi:gesture-tap", k.a, "", false];
        return `<button class="kn ${farge}" data-a="knapp|${k.id}|${farlig ? `${navn} ${esc(k.hvem || "")}?` : ""}"><ha-icon icon="${ik}"></ha-icon>${navn}</button>`;
      }).join("")}</div>` : "";
    }

    /* ── gjester ── */
    _gjester() {
      const R = this._R, s = this.s, kilde = this._c.kilde, ids = [], rader = [];
      const bruk = (id) => { if (id) ids.push(id); return s(id); };
      if (kilde !== "unraid") {
        R.proxmox.noder.forEach((g) => {
          const st = bruk(g.status), cpu = tall(bruk(g.cpu)), mem = tall(bruk(g.mem));
          const on = ok(st) && /online|running/i.test(st.state);
          rader.push({ id: g.id, ikon: "mdi:server-network", prikk: on ? "gronn" : "rod", l: g.navn || "Node",
            d: [`Node`, !isNaN(mem) ? `minne ${Math.round(mem)} %` : "", ok(bruk(g.load)) ? `load ${s(g.load).state}` : ""].filter(Boolean).join(" · "),
            hoyre: this._ring(cpu),
            panel: `<div class="chips">${this._chip(medEnhet(bruk(g.oppetid)), "Oppetid", g.oppetid)}${this._chip(medEnhet(bruk(g.swap), 0), "Swap", g.swap)}${this._chip(medEnhet(bruk(g.iowait), 1), "IO wait", g.iowait)}${this._chip(medEnhet(bruk(g.oppdateringer)), "Oppdateringer", g.oppdateringer)}</div>`
              + this._knapper(g.knapper.map((k) => ({ ...k, hvem: "hele noden" }))) });
        });
        R.proxmox.gjester.forEach((g) => {
          const st = bruk(g.status), cpu = tall(bruk(g.cpu));
          const tilst = ok(st) ? st.state.toLowerCase() : "ukjent";
          const kjorer = tilst === "running";
          const ram = ok(bruk(g.ramBrukt)) ? medEnhet(s(g.ramBrukt), 1) + (ok(bruk(g.ramTot)) ? " av " + medEnhet(s(g.ramTot), 1) : "") : "";
          rader.push({ id: g.id, ikon: g.type === "vm" ? "mdi:monitor" : "mdi:cube-outline",
            prikk: kjorer ? "gronn" : tilst === "paused" ? "gul" : "rod",
            l: g.navn, d: [g.type === "vm" ? "VM" : "CT", g.vmid, kjorer ? ram : { stopped: "stoppet", paused: "pauset" }[tilst] || tilst].filter(Boolean).join(" · "),
            hoyre: kjorer ? this._ring(cpu) : "",
            panel: `<div class="chips">${this._chip(medEnhet(bruk(g.oppetid)), "Oppetid", g.oppetid)}${this._chip(ram || undefined, "RAM", g.ramBrukt)}${this._chip(ok(bruk(g.diskBrukt)) ? medEnhet(s(g.diskBrukt), 1) + (ok(bruk(g.diskTot)) ? " av " + medEnhet(s(g.diskTot), 1) : "") : undefined, "Disk", g.diskBrukt)}${this._chip(ok(bruk(g.rx)) ? medEnhet(s(g.rx)) + " / " + medEnhet(bruk(g.tx)) : undefined, "Nett ned / opp", g.rx)}</div>`
              + this._knapper(g.knapper.filter((k) => (kjorer ? k.a !== "start" && k.a !== "fortsett" : ["start", "fortsett"].includes(k.a) || tilst === "paused")).map((k) => ({ ...k, hvem: g.navn }))) });
        });
      }
      if (kilde !== "proxmox" && R.unraid) {
        const U = R.unraid;
        if (kilde === "unraid" || R.proxmox.noder.length === 0) {
          const cpu = tall(bruk(U.cpu)), ram = tall(bruk(U.ram));
          rader.push({ id: "ur-server", ikon: "mdi:nas", prikk: "gronn", l: U.navn, d: ["Unraid", !isNaN(ram) ? `minne ${Math.round(ram)} %` : "", ok(bruk(U.temp)) ? medEnhet(s(U.temp), 0) : ""].filter(Boolean).join(" · "), hoyre: this._ring(cpu), mer: U.cpu });
        } else if (U.gjester.length) rader.push({ id: "ur-skille", ikon: "mdi:nas", l: U.navn, d: `${U.gjester.length} containere og VM-er i Unraid`, mer: U.cpu, hoyre: this._ring(tall(bruk(U.cpu))) });
        U.gjester.forEach((g) => {
          const st = bruk(g.bryter), on = st && st.state === "on", oppd = g.oppdatering && bruk(g.oppdatering) && s(g.oppdatering).state === "on";
          rader.push({ id: g.id, ikon: g.type === "vm" ? "mdi:monitor" : "mdi:docker", prikk: on ? "gronn" : "rod", l: g.navn,
            d: [g.type === "vm" ? "VM" : "Docker", on ? "kjører" : "stoppet", oppd ? "oppdatering klar" : ""].filter(Boolean).join(" · "),
            panel: `<div class="knapper"><button class="kn ${on ? "paa" : ""}" data-a="veksle|${g.bryter}"><ha-icon icon="mdi:power"></ha-icon>${on ? "Kjører" : "Start"}</button>
              ${g.restart && on ? `<button class="kn oransje" data-a="knapp|${g.restart}|Restart ${esc(g.navn)}?"><ha-icon icon="mdi:restart"></ha-icon>Restart</button>` : ""}
              <button class="kn" data-a="mer|${g.bryter}"><ha-icon icon="mdi:information-outline"></ha-icon>Detaljer</button></div>` });
        });
      }
      this._ids = ids; this._liste(rader, "Fant ingen Proxmox- eller Unraid-gjester. Sjekk at integrasjonene Proxmox Extended Sensors eller Unraid er satt opp.");
    }

    /* ── nettverk ── */
    _nettverk() {
      const R = this._R, s = this.s, ids = [], rader = [];
      const bruk = (id) => { if (id) ids.push(id); return s(id); };
      const IKON = { ruter: "mdi:router-network", switch: "mdi:switch", ap: "mdi:access-point", enhet: "mdi:lan" };
      R.unifi.enheter.forEach((e) => {
        const t = bruk(e.tracker), on = !t || t.state !== "not_home";
        const cpu = tall(bruk(e.cpu)), mem = tall(bruk(e.mem)), kl = tall(bruk(e.klienter));
        const pinger = e.latens.map((id) => ({ id, v: tall(bruk(id)), n: (s(id) && s(id).attributes.friendly_name || obj(id)).replace(/.*?(google|cloudflare|microsoft).*/i, "$1") }));
        const oppd = e.oppdatering && bruk(e.oppdatering) && s(e.oppdatering).state === "on";
        const led = e.led && bruk(e.led);
        const gyldige = pinger.map((p) => p.v).filter((v) => !isNaN(v));
        const d = [e.modell || e.type, on ? (!isNaN(kl) ? `${Math.round(kl)} klienter` : "") : "offline",
          on && gyldige.length ? `${Math.round(Math.min(...gyldige))} ms` : "", oppd ? "oppdatering klar" : ""].filter(Boolean);
        const porter = e.porter.length ? `<div class="overskrift">${e.porter[0].type === "bryter" ? "Porter – trykk for å slå av/på" : "Porter – trykk for å strømsykle"}</div>
          <div class="porter">${e.porter.map((p) => p.type === "bryter"
            ? `<button class="port ${bruk(p.id) && s(p.id).state === "on" ? "paa" : ""}" data-a="veksle|${p.id}">P${p.n}</button>`
            : `<button class="port" data-a="port|${p.id}|Strømsykle port ${p.n} på ${esc(e.navn)}?">P${p.n}</button>`).join("")}</div>` : "";
        rader.push({ id: e.id, ikon: on ? IKON[e.type] : "mdi:wifi-off", prikk: on ? "gronn" : "rod", l: e.navn, d: d.join(" · "),
          hoyre: on ? this._ring(cpu) : "",
          panel: `<div class="chips">${this._chip(medEnhet(bruk(e.oppetid)), "Oppetid", e.oppetid)}${this._chip(isNaN(mem) ? undefined : Math.round(mem) + " %", "Minne", e.mem)}${this._chip(medEnhet(bruk(e.temp), 0), "Temperatur", e.temp)}
              ${pinger.map((p) => this._chip(isNaN(p.v) ? undefined : Math.round(p.v) + " ms", "Ping " + tittel(p.n), p.id)).join("")}</div>
            <div class="knapper">${led ? `<button class="kn ${led.state === "on" ? "paa" : ""}" data-a="veksle|${e.led}"><ha-icon icon="mdi:led-outline"></ha-icon>LED</button>` : ""}
              ${e.oppdatering ? `<button class="kn ${oppd ? "oransje" : ""}" data-a="mer|${e.oppdatering}"><ha-icon icon="mdi:update"></ha-icon>${oppd ? "Oppdater" : "Fastvare"}</button>` : ""}
              ${e.restart ? `<button class="kn oransje" data-a="knapp|${e.restart}|Restart ${esc(e.navn)}?"><ha-icon icon="mdi:restart"></ha-icon>Restart</button>` : ""}
              ${e.tracker ? `<button class="kn" data-a="mer|${e.tracker}"><ha-icon icon="mdi:information-outline"></ha-icon>Detaljer</button>` : ""}</div>${porter}` });
      });
      R.unifi.wlan.forEach((w) => {
        const br = bruk(w.bryter), on = !br || br.state === "on", kl = tall(bruk(w.klienter)), qr = w.qr && bruk(w.qr);
        rader.push({ id: w.id, ikon: on ? "mdi:wifi" : "mdi:wifi-off", prikk: on ? "gronn" : "rod", l: w.navn,
          d: ["Wi-Fi", on ? (!isNaN(kl) ? `${Math.round(kl)} klienter` : "på") : "av"].join(" · "),
          panel: (qr && qr.attributes.entity_picture ? `<div class="qr" data-a="mer|${w.qr}"><img src="${esc(qr.attributes.entity_picture)}" alt="QR-kode for ${esc(w.navn)}"></div>` : "")
            + (w.bryter ? `<div class="knapper"><button class="kn ${on ? "paa" : ""}" data-a="veksle|${w.bryter}"><ha-icon icon="mdi:wifi"></ha-icon>${on ? "På" : "Av"}</button></div>` : "") });
      });
      this._ids = ids; this._liste(rader, "Fant ingen UniFi-enheter. Sjekk at UniFi Network-integrasjonen er satt opp.");
    }

    /* ── nedlasting ── */
    _nedlasting() {
      const Q = this._R.qbit, s = this.s, c = this._c, rot = this._rot();
      if (!Q) { rot.innerHTML = `<style>${STIL}</style><div class="tom">Fant ikke qBittorrent. Sjekk at qBittorrent-integrasjonen er satt opp.</div>`; this._bygget = true; this._modus = "nedlasting"; this._ids = []; return; }
      const C = [126, 62], R0 = 46, N = 7;
      const peers = Array.from({ length: N }, (_, i) => {
        const v = (-150 + i * (300 / (N - 1))) * Math.PI / 180, r = R0 + ((i * 37) % 9) - 4;
        return [C[0] + Math.sin(v) * r, C[1] - Math.cos(v) * r * 0.92];
      });
      if (!this._bygget || this._modus !== "nedlasting") {
        const linjer = peers.map(([x, y], i) => `<path class="spor" d="M${x.toFixed(1)} ${y.toFixed(1)} L${C[0]} ${C[1]}"/>
            <path class="strom ned" data-i="${i}" d="M${x.toFixed(1)} ${y.toFixed(1)} L${C[0]} ${C[1]}" style="animation-delay:-${(i * 0.23).toFixed(2)}s"/>
            <path class="strom opp" data-i="${i}" d="M${C[0]} ${C[1]} L${x.toFixed(1)} ${y.toFixed(1)}" style="animation-delay:-${(i * 0.31).toFixed(2)}s"/>`).join("");
        rot.innerHTML = `<style>${STIL}</style><div class="nd" data-a="ned" role="img" tabindex="0">
          <div class="glod"></div><div class="tekst"><div class="n"></div><span class="pille"><ha-icon></ha-icon><span class="pt"></span></span>
          <div class="stor"></div><div class="sub"></div></div>
          <div class="scene"><svg viewBox="0 0 200 180" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
            <defs><linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ae6c8" stop-opacity=".45"/><stop offset="1" stop-color="#5ae6c8" stop-opacity="0"/></linearGradient></defs>
            ${linjer}
            ${peers.map(([x, y], i) => `<circle class="peer" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" style="animation-delay:-${(i * 0.37).toFixed(2)}s"/>`).join("")}
            <circle class="hubring" cx="${C[0]}" cy="${C[1]}" r="17"/>
            <rect class="hub" x="${C[0] - 16}" y="${C[1] - 16}" width="32" height="32" rx="10"/>
            <g class="hubpil"><path d="M${C[0] - 1.6} ${C[1] - 9} h3.2 v7 h3.6 l-5.2 5.6 -5.2-5.6 h3.6z"/></g>
            <path d="M${C[0] - 8} ${C[1] + 5} v3.5 h16 v-3.5" fill="none" stroke="#e8f1ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <text class="t-hub" x="${C[0]}" y="${C[1] + 28}" text-anchor="middle"></text>
            <g class="skilpadde" transform="translate(${C[0] + 11} ${C[1] - 24})"><circle r="6" fill="#ffb34a"/><path d="M-3 1 q3-5 6 0 z M-3.5 1 h7" fill="#3a2e1c" stroke="#3a2e1c" stroke-width=".8"/></g>
            <line class="graf-akse" x1="6" y1="170" x2="194" y2="170"/>
            <path class="graf-ned" d=""/><path class="graf-opp" d=""/>
            <text class="t-graf" x="6" y="124">siste 30 min</text><text class="t-graf t-maks" x="194" y="124" text-anchor="end"></text>
          </svg></div></div>`;
        this._bygget = true; this._modus = "nedlasting"; this._hist = this._hist || { ned: [], opp: [] };
        this._hentHistorikk();
        clearInterval(this._graftimer); this._graftimer = setInterval(() => this._tegnGraf(), 15000);
      }
      const $ = (q) => rot.querySelector(q), $$ = (q) => rot.querySelectorAll(q), kort = $(".nd");
      const nedS = s(Q.ned), oppS = s(Q.opp), st = s(Q.status), alt = s(Q.alt);
      this._ids = [Q.ned, Q.opp, Q.status, Q.aktive, Q.alle, Q.alt].filter(Boolean);
      const ned = byteRate(nedS), opp = byteRate(oppS), av = !ok(nedS);
      const laster = ned > 10000, deler = opp > 10000, begrenset = !!alt && alt.state === "on";
      const aktive = tall(s(Q.aktive)), alleT = tall(s(Q.alle));
      kort.classList.toggle("laster", laster && !av); kort.classList.toggle("deler", deler && !av);
      kort.classList.toggle("begrenset", begrenset && !av); kort.classList.toggle("av", av);
      const tid = (b) => klem(1.6 - Math.log10(b / 1e4 + 1) * 0.45, 0.3, 1.6).toFixed(2) + "s";
      kort.style.setProperty("--ned-tid", tid(ned || 0)); kort.style.setProperty("--opp-tid", tid(opp || 0));
      const antall = (b) => (b > 10000 ? klem(Math.ceil(Math.log2(b / 2e4 + 1)) + 1, 1, N) : 0);
      const nN = av ? 0 : antall(ned), oN = av ? 0 : antall(opp);
      $$(".strom.ned").forEach((l, i) => l.classList.toggle("paa", i < nN));
      $$(".strom.opp").forEach((l, i) => l.classList.toggle("paa", N - 1 - i < oN));
      $$(".peer").forEach((p, i) => { p.classList.toggle("ned", i < nN); p.classList.toggle("opp", N - 1 - i < oN); });
      $(".t-hub").textContent = isNaN(aktive) ? "" : `${Math.round(aktive)} aktive`;
      // historikk: legg til nåverdien
      const naa = Date.now();
      if (!isNaN(ned)) this._leggTil("ned", naa, ned); if (!isNaN(opp)) this._leggTil("opp", naa, opp);
      this._tegnGraf();
      // tekst
      $(".n").textContent = c.navn && c.navn !== "Homelab" ? c.navn : "Nedlastinger";
      const stTxt = ok(st) ? String(st.state).toLowerCase() : "";
      let pt, ik;
      if (av) { pt = "Frakoblet"; ik = "mdi:lan-disconnect"; }
      else if (begrenset && (laster || deler)) { pt = "Begrenset fart"; ik = "mdi:tortoise"; }
      else if (laster && deler) { pt = "Laster ned og deler"; ik = "mdi:swap-vertical"; }
      else if (laster) { pt = "Laster ned"; ik = "mdi:download"; }
      else if (deler || /seed/.test(stTxt)) { pt = "Deler"; ik = "mdi:upload"; }
      else { pt = "Hviler"; ik = "mdi:sleep"; }
      $(".pille ha-icon").setAttribute("icon", ik); $(".pt").textContent = pt;
      if (av) $(".stor").innerHTML = "--";
      else { const [v, u] = fartTekst(ned); $(".stor").innerHTML = `↓ ${v}<small>${u}</small>`; }
      const [ov, ou] = fartTekst(opp);
      $(".sub").textContent = [av ? "" : `↑ ${ov} ${ou}`, !isNaN(aktive) ? `${Math.round(aktive)}${!isNaN(alleT) ? " av " + Math.round(alleT) : ""} aktive` : ""].filter(Boolean).join("  ·  ");
      kort.setAttribute("aria-label", `Nedlastinger: ${pt}. ${$(".stor").textContent}. ${$(".sub").textContent}`);
    }
    _leggTil(k, t, v) {
      const a = this._hist[k], siste = a[a.length - 1];
      if (siste && siste[1] === v && t - siste[0] < 60000) return;
      a.push([t, v]); const grense = Date.now() - 31 * 60000; while (a.length > 2 && a[1][0] < grense) a.shift();
    }
    async _hentHistorikk() {
      const Q = this._R.qbit; if (!Q || !this._hass.callWS || this._hentet) return; this._hentet = true;
      try {
        const start = new Date(Date.now() - 30 * 60000).toISOString();
        const r = await this._hass.callWS({ type: "history/history_during_period", start_time: start, entity_ids: [Q.ned, Q.opp].filter(Boolean), minimal_response: true, no_attributes: true, significant_changes_only: false });
        const fra = (id, k) => {
          const rader = r[id] || [], naa = this.s(id); if (!rader.length) return;
          const f = byteRate({ state: "1", attributes: (naa && naa.attributes) || {} });
          const pkt = rader.map((x) => [((x.lu || x.lc || 0) * 1000) || Date.parse(x.last_updated || x.last_changed), parseFloat(x.s ?? x.state) * f]).filter((x) => !isNaN(x[1]) && x[0]);
          this._hist[k] = pkt.concat(this._hist[k].filter((x) => x[0] > (pkt.length ? pkt[pkt.length - 1][0] : 0)));
        };
        fra(Q.ned, "ned"); fra(Q.opp, "opp"); this._tegnGraf();
      } catch (e) { /* historikk er valgfritt – grafen bygger seg opp av seg selv */ }
    }
    _tegnGraf() {
      const rot = this.shadowRoot; if (!rot || !this._hist) return;
      const gn = rot.querySelector(".graf-ned"), go = rot.querySelector(".graf-opp"); if (!gn) return;
      const naa = Date.now(), fra = naa - 30 * 60000, X0 = 6, W = 188, Y0 = 170, H = 40;
      const alle = this._hist.ned.concat(this._hist.opp).filter((p) => p[0] >= fra - 60000).map((p) => p[1]);
      const maks = Math.max(1, ...alle);
      const punkter = (a) => {
        const inn = a.filter((p) => p[0] >= fra); const før = a.filter((p) => p[0] < fra).pop();
        const liste = (før ? [[fra, før[1]]] : []).concat(inn);
        if (liste.length) liste.push([naa, liste[liste.length - 1][1]]);
        // trappetrinn: verdien gjelder til neste måling
        const ut = []; liste.forEach((p, i) => { const x = X0 + ((p[0] - fra) / (naa - fra)) * W, y = Y0 - (p[1] / maks) * H;
          if (i) ut.push([x, ut[ut.length - 1][1]]); ut.push([x, y]); });
        return ut;
      };
      const pn = punkter(this._hist.ned), po = punkter(this._hist.opp);
      gn.setAttribute("d", pn.length ? `M${pn[0][0].toFixed(1)} ${Y0} ` + pn.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + ` L${pn[pn.length - 1][0].toFixed(1)} ${Y0} Z` : "");
      go.setAttribute("d", po.length ? po.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") : "");
      const [v, u] = fartTekst(maks); rot.querySelector(".t-maks").textContent = alle.length ? `topp ${v} ${u}` : "";
    }

    /* ── lagring ── */
    _farge(p) { return p >= 90 ? "var(--red,#ff5a4a)" : p >= 75 ? "var(--orange,#ffb34a)" : "var(--green,#5be38a)"; }
    _smult(uid, p, midt, under, farge) {
      const off = isNaN(p) ? 264 : 264 * (1 - klem(p, 0, 100) / 100);
      return `<div class="smult"><svg viewBox="0 0 100 100"><circle class="bak" cx="50" cy="50" r="42"/>
          <circle class="bue" data-u="${uid}-bue" cx="50" cy="50" r="42" style="stroke-dashoffset:${off.toFixed(1)};stroke:${farge}"/></svg>
        <div class="midt2"><b data-u="${uid}-v">${midt}</b><i>${esc(under)}</i></div></div>`;
    }
    _lagring() {
      const R = this._R, s = this.s, ids = [], rot = this._rot();
      const bruk = (id) => { if (id) ids.push(id); return s(id); };
      const deler = [];
      /* Unraid-array: diskene som glassrør med væske */
      if (R.unraid) {
        const U = R.unraid, p = tall(bruk(U.arrayBruk)), st = bruk(U.arrayStatus);
        const startet = !ok(st) || /on|start|normal|ok/i.test(st.state);
        const disker = U.disker, n = Math.max(1, disker.length);
        const sp = Math.min(30, 186 / n), w = Math.min(20, sp - 7), x0 = 196 - n * sp;
        let varmest = NaN;
        const ror = disker.map((dk, i) => {
          const pb = tall(bruk(dk.bruk)), t = tall(bruk(dk.temp)), par = /parity/.test(dk.navn), cache = /cache/.test(dk.navn);
          if (!isNaN(t)) varmest = isNaN(varmest) ? t : Math.max(varmest, t);
          const x = x0 + i * sp + (sp - w) / 2, fyll = par ? 1 : isNaN(pb) ? 0 : klem(pb, 0, 100) / 100;
          const farge = par ? "url(#skravur)" : cache ? "#5ad1ff" : this._farge(pb).replace(/var\(--\w+,(#\w+)\)/, "$1");
          const kort = par ? "P" : cache ? "C" : dk.navn.replace(/^disk/i, "D");
          const tk = t >= 50 ? "het" : t >= 45 ? "varm" : "";
          return `<g data-a="mer|${dk.bruk || dk.temp}" style="cursor:pointer">
            <defs><clipPath id="rc${i}"><rect x="${x.toFixed(1)}" y="22" width="${w.toFixed(1)}" height="124" rx="${(w / 2).toFixed(1)}"/></clipPath></defs>
            <rect class="ror-ytre ${tk}" data-u="ror${i}" x="${x.toFixed(1)}" y="22" width="${w.toFixed(1)}" height="124" rx="${(w / 2).toFixed(1)}"/>
            <g clip-path="url(#rc${i})"><g class="vaeske" data-u="v${i}" style="transform:translateY(${((1 - fyll) * 124).toFixed(1)}px);animation-delay:${(i * 0.08).toFixed(2)}s">
              <path class="bolgetopp" d="M${(x - 8).toFixed(1)} 24 q3-3 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 V160 H${(x - 8).toFixed(1)}z" fill="${farge}" opacity=".95" style="animation-delay:-${(i * 0.6).toFixed(1)}s"/>
            </g></g>
            ${!par && !isNaN(pb) && w >= 14 ? `<text class="t-pst" data-u="p${i}" x="${(x + w / 2).toFixed(1)}" y="140" text-anchor="middle">${Math.round(pb)}</text>` : ""}
            <text class="t-ror" x="${(x + w / 2).toFixed(1)}" y="160" text-anchor="middle">${esc(kort)}</text>
            <text class="t-temp ${tk}" data-u="t${i}" x="${(x + w / 2).toFixed(1)}" y="172" text-anchor="middle">${isNaN(t) ? "" : Math.round(t) + "°"}</text></g>`;
        }).join("");
        const antDisker = disker.filter((d) => !/parity|cache/.test(d.navn)).length;
        deler.push(`<div class="ar ${startet ? "" : "stoppet"}"><div class="glod"></div>
          <div class="tekst"><div class="n">${esc(U.navn)} – array</div>
            <span class="pille" data-u="ar-pille"><ha-icon icon="${startet ? "mdi:check-circle" : "mdi:harddisk-remove"}"></ha-icon><span>${startet ? "Startet" : "Stoppet"}</span></span>
            <div class="stor" data-u="ar-stor">${isNaN(p) ? "--" : Math.round(p)}<small>% brukt</small></div>
            <div class="sub" data-u="ar-sub">${[antDisker ? `${antDisker} disker` : "", !isNaN(varmest) ? `varmest ${Math.round(varmest)} °C` : ""].filter(Boolean).join("  ·  ")}</div></div>
          <div class="scene"><svg viewBox="0 0 200 190" preserveAspectRatio="xMaxYMax meet">
            <defs><pattern id="skravur" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#8a96a6"/><rect width="3" height="6" fill="#6c7788"/></pattern></defs>
            ${ror}</svg></div></div>`);
      }
      /* Proxmox-lagring, fysiske disker og monterte disker som fliser */
      const fliser = [];
      R.proxmox.lagring.forEach((g) => {
        const p = tall(bruk(g.bruk));
        const bruktT = ok(bruk(g.brukt)) ? medEnhet(s(g.brukt), 1) + (ok(bruk(g.total)) ? " av " + medEnhet(s(g.total), 1) : "") : "";
        fliser.push(`<div class="fl" data-a="mer|${g.bruk || g.brukt}">
          <div class="hode"><div class="ik"><ha-icon icon="mdi:database"></ha-icon></div><span>${esc(g.navn)}</span></div>
          ${this._smult(g.id, p, isNaN(p) ? "--" : `${Math.round(p)}<small>%</small>`, "brukt", this._farge(p))}
          <div class="bunn" data-u="${g.id}-b"><div>${esc(bruktT)}</div><div>${ok(bruk(g.ledig)) ? esc(medEnhet(s(g.ledig), 1)) + " ledig" : ""}</div></div></div>`);
      });
      R.proxmox.disker.forEach((d) => {
        const t = tall(bruk(d.temp)), helse = bruk(d.helse), slit = tall(bruk(d.slitasje));
        const p = isNaN(t) ? NaN : klem((t - 20) / 40 * 100, 0, 100);
        const farge = t >= 50 ? "var(--red,#ff5a4a)" : t >= 45 ? "var(--orange,#ffb34a)" : "var(--blue,#5ad1ff)";
        fliser.push(`<div class="fl" data-a="mer|${d.temp || d.storrelse}">
          <div class="hode"><div class="ik"><ha-icon icon="mdi:harddisk"></ha-icon></div><span>${esc(d.navn)}</span></div>
          ${this._smult(d.id, p, isNaN(t) ? "--" : `${Math.round(t)}<small>°C</small>`, "temperatur", farge)}
          <div class="bunn" data-u="${d.id}-b"><div>${ok(bruk(d.storrelse)) ? esc(medEnhet(s(d.storrelse))) : ""}</div>
            <div>${ok(helse) ? "Helse: " + esc(helse.state) : !isNaN(slit) ? `Slitasje ${Math.round(slit)} %` : ""}</div></div></div>`);
      });
      if (R.proxmox.montert) {
        const m = bruk(R.proxmox.montert);
        fliser.push(`<div class="fl bred" data-a="mer|${R.proxmox.montert}"><div class="ik"><ha-icon icon="mdi:harddisk-plus"></ha-icon></div>
          <div class="bunn" data-u="montert"><div>Monterte disker: ${ok(m) ? esc(m.state) : "--"}</div></div></div>`);
      }
      if (fliser.length) deler.push(`<div class="lg-grid">${fliser.join("")}</div>`);
      this._ids = ids;
      const html = deler.length ? `<div class="lg">${deler.join("")}</div>` : `<div class="tom">Fant ingen lagring. Sjekk at Proxmox Extended Sensors eller Unraid er satt opp.</div>`;
      const nokler = "lagring|" + (R.unraid ? R.unraid.disker.map((d) => d.navn).join(",") : "") + "|" + R.proxmox.lagring.map((g) => g.id).join(",") + "|" + R.proxmox.disker.map((d) => d.id).join(",") + "|" + !!R.proxmox.montert;
      if (!this._bygget || this._modus !== "lagring" || nokler !== this._nokler) {
        rot.innerHTML = `<style>${STIL}</style>${html}`; this._bygget = true; this._modus = "lagring"; this._nokler = nokler;
      } else {
        this._patch(rot, html);
        const ar = rot.querySelector(".ar"); if (ar) ar.classList.toggle("stoppet", /class="ar stoppet"/.test(html));
      }
    }
  }

  if (!customElements.get("ki-homelab-card")) customElements.define("ki-homelab-card", KiHomelabCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((k) => k.type === "ki-homelab-card"))
    window.customCards.push({ type: "ki-homelab-card", name: "KI Homelab", description: "Animert serverrack og autokonfigurerte lister fra Proxmox, UniFi, Unraid og qBittorrent", preview: true });
})();

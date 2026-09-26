/* ki-floating-navbar – flytende navigasjonslinje nederst på skjermen.
 *
 * Drop-in-erstatning for mysmart-floating-navbar: samme utseende og samme config, bytt bare
 * `type: custom:mysmart-floating-navbar` til `type: custom:ki-floating-navbar`.
 *
 * type: custom:ki-floating-navbar
 * items:
 *   - name: Hjem
 *     icon: mdi:home
 *     tap_action: { action: navigate, navigation_path: /lovelace/hjem }
 *   - name: Strøm
 *     icon: mdi:flash
 *     tap_action: { action: navigate, navigation_path: "#strom" }   # popup (hash) – trykk igjen lukker
 *     badge_entity: binary_sensor.strom_varsel                     # rød prikk når on / > 0
 *   - name: Mer
 *     icon: mdi:menu
 *     sub_items: [ { name: Innstillinger, icon: mdi:cog, tap_action: { action: navigate, navigation_path: /config } } ]
 *   # ellers som før: badge_template, active_template, active, users: [navn], hide_name, id
 *   # tap_action: navigate | url | call-service | perform-action | fire-dom-event | toggle-menu
 *   #             | toggle (entity) | more-info (entity) | ki-navbar-edit (åpner «Tilpass navbar»)
 *   #             | ki-hjem-tilpass (åpner «Tilpass Hjem» i ki-hjem-card på siden)
 * styles: { background, blur, color, active_color, width, icon_size, button_padding, z_index, margin_left, spacer_height }
 *
 * Nytt (alle valgfrie):
 *   indicator: both            # both (glasslinse + prikk) | lens | dot | none
 *   drag: true                 # dra fingeren langs linjen – linsen følger, slipp aktiverer
 *   customize: true            # langt trykk på linjen åpner «Tilpass navbar»
 *   edit_entry: auto           # «Tilpass navbar» nederst i menyen bak prikkene (standard når linjen
 *                              # har en meny; true = alltid, lager «Mer» om nødvendig; false = aldri)
 *   hjem_meny: true            # «Tilpass Hjem» nederst i menyen når et ki-hjem-card er på siden
 *   shrink_on_scroll: false    # standard for «Krymp ved scrolling» (brukeren kan overstyre)
 *   nav_id: default            # egen nøkkel hvis du har flere ulike navbarer
 *
 * «Menyen» (de tre prikkene): den første config-knappen med sub_items (helst en med
 * mdi:dots-horizontal). Innholdet kan brukeren endre i «Tilpass navbar»: flytte knapper inn
 * og ut, endre rekkefølge, skjule og legge til egne. Uten en slik knapp lages en «Mer» først
 * når noe flyttes dit.
 *
 * Brukerens valg lagres per bruker i HA (KI.udSave, nøkkel "ki_navbar"):
 *   { <nav_id>: { order:[id]          rekkefølgen i linjen
 *                 menu:[id]           rekkefølgen i menyen
 *                 hidden:[id]         skjult (også underknapper)
 *                 more:[id]           linjeknapper flyttet inn i menyen
 *                 out:[id]            menyknapper flyttet ut i linjen
 *                 custom:[{id,name,icon,tap_action,place:"bar"|"menu"}],
 *                 names:"show"|"hide", shrink:bool, width:"auto"|"full"|"fixed", width_px:num,
 *                 storrelse:"s"|"m"|"l"|"xl" } }
 * Id-er: item.id, ellers "n:"+navn, (underknapper) "p:"+navigation_path, ellers "i:"+ikon.
 * Config er standarden; det som står her overstyrer. «Nullstill» sletter <nav_id>.
 * (Den gamle nøkkelen `size` ignoreres – størrelsene var mindre enn config og krympet linjen.)
 * Menyen får nederst, under en skillelinje, «Tilpass navbar» og «Tilpass Hjem» (som i kd-dokken).
 * «Tilpass Hjem» sender window-hendelsen `ki-hjem-tilpass` ({ detail: { apen: true } }); ki-hjem-card
 * lytter og åpner panelet sitt. Kortet melder seg i `window.__kiHjem` (antall på siden) og sender
 * `ki-hjem-registrert` når det kommer og går, så menyvalget bare vises når det virker.
 * Linjen gjemmes (opasitet 0, ikke klikkbar) mens <html> har klassen ki-popup-apen / etter
 * window-hendelsen ki-popup {detail:{apen:true}} – f.eks. personpopupene i family-status-card.
 * Setter --kd-dokk-h på <html> (avstand fra bunnen av vinduet til toppen av linjen), så
 * andre paneler kan legge seg rett over den.
 */
(function () {
  const W = window;
  W.KI = W.KI || {};
  const KI = W.KI;
  const TYPE = "ki-floating-navbar";
  const UD_KEY = "ki_navbar";

  const defineEl = (n, c) => {
    if (typeof KI.define === "function") KI.define(n, c);
    else if (!customElements.get(n)) customElements["define"](n, c);
  };

  /* Lit fra Home Assistant (KI.lit fra bundelen), med samme oppslag som reserve når fila
     lastes alene. */
  const medLit = KI.lit || ((kjor) => {
    const kandidater = ["ha-panel-lovelace", "hui-view", "hui-masonry-view", "home-assistant", "ha-card"];
    const hent = () => {
      for (const navn of kandidater) {
        const el = customElements.get(navn);
        if (!el) continue;
        let p = Object.getPrototypeOf(el);
        for (let i = 0; i < 6 && p; i++) {
          if (p.prototype && p.prototype.html && p.prototype.css) return p;
          p = Object.getPrototypeOf(p);
        }
      }
      return null;
    };
    const start = () => {
      const L = hent();
      if (!L) return false;
      try { kjor(L, L.prototype.html, L.prototype.css); } catch (e) { console.error("ki-cards: " + TYPE + " feilet", e); }
      return true;
    };
    if (start()) return;
    let n = 0;
    const t = setInterval(() => { if (start() || ++n > 120) clearInterval(t); }, 100);
  });

  /* Brukerlagring: KI.ud* når ki-cards-basen finnes, ellers localStorage. */
  const lsGet = () => { try { return JSON.parse(W.localStorage.getItem(UD_KEY) || "{}") || {}; } catch (e) { return {}; } };
  const ud = {
    get: (hass) => (typeof KI.ud === "function" ? KI.ud(hass, UD_KEY) : (ud._ls || (ud._ls = lsGet()))) || {},
    load: (hass) => (typeof KI.udLoad === "function" ? KI.udLoad(hass, UD_KEY) : Promise.resolve(ud.get(hass))),
    save: (hass, v) => {
      if (typeof KI.udSave === "function") return KI.udSave(hass, UD_KEY, v);
      ud._ls = v || {};
      try { W.localStorage.setItem(UD_KEY, JSON.stringify(ud._ls)); } catch (e) { /* privat modus */ }
      W.dispatchEvent(new CustomEvent("ki-ud", { detail: { key: UD_KEY, value: ud._ls } }));
      return Promise.resolve();
    },
  };

  const haptic = (t) => {
    try { W.dispatchEvent(new CustomEvent("haptic", { detail: t, bubbles: true, composed: true })); } catch (e) { /* eldre */ }
    try { if (navigator.vibrate) navigator.vibrate(t === "selection" ? 6 : t === "heavy" ? 22 : 12); } catch (e) { /* ikke støttet */ }
  };

  const without = (arr, id) => (Array.isArray(arr) ? arr : []).filter((x) => x !== id);
  const clone = (o) => JSON.parse(JSON.stringify(o === undefined ? null : o));

  /* «Middels» er det klassiske mysmart-utseendet (12 px polstring, 24 px ikon). «Standard» er config. */
  const SIZES = {
    s: { pad: "8px", icon: "20px", l: "Liten" },
    m: { pad: "12px", icon: "24px", l: "Middels" },
    l: { pad: "16px", icon: "28px", l: "Stor" },
    xl: { pad: "20px", icon: "32px", l: "Ekstra stor" },
  };

  const ADD_TYPES = [
    { v: "popup", l: "Popup", ph: "#strom" },
    { v: "navigate", l: "Side", ph: "/lovelace/hjem" },
    { v: "url", l: "Lenke", ph: "https://…" },
    { v: "toggle", l: "Bryter", ph: "light.stue" },
    { v: "more-info", l: "Info", ph: "sensor.temperatur" },
  ];

  const tapFor = (type, target) => {
    const t = String(target || "").trim();
    if (type === "navigate") return { action: "navigate", navigation_path: t.startsWith("/") ? t : "/" + t };
    if (type === "popup") return { action: "navigate", navigation_path: t.startsWith("#") ? t : "#" + t };
    if (type === "url") return { action: "url", url_path: t };
    if (type === "toggle") return { action: "toggle", entity: t };
    if (type === "more-info") return { action: "more-info", entity: t };
    return { action: "none" };
  };

  medLit((LitElement, html, css) => {
    const nothing = html``;

    /* =================================================================== kortet */
    class KiFloatingNavbar extends LitElement {
      static get properties() {
        return {
          hass: { attribute: false },
          _config: { state: true },
          _navItems: { state: true },
          _openMenu: { state: true },
          _currentHash: { state: true },
          _currentPath: { state: true },
          _editOpen: { state: true },
          _form: { state: true },
          _shrunk: { state: true },
          _dragIdx: { state: true },
          _udRev: { state: true },
          _popupApen: { state: true },
        };
      }

      static getConfigElement() { return document.createElement(TYPE + "-editor"); }
      static getStubConfig() {
        return {
          items: [
            { name: "Hjem", icon: "mdi:home", tap_action: { action: "navigate", navigation_path: "/lovelace/0" } },
            { name: "Strøm", icon: "mdi:flash", tap_action: { action: "navigate", navigation_path: "#strom" } },
            { name: "Lys", icon: "mdi:lightbulb-group", tap_action: { action: "navigate", navigation_path: "#lys" } },
            { name: "Meny", icon: "mdi:menu", tap_action: { action: "toggle-menu" } },
          ],
          styles: {},
        };
      }

      constructor() {
        super();
        this._openMenu = null;
        this._editOpen = false;
        this._form = null;
        this._shrunk = false;
        this._dragIdx = null;
        this._udRev = 0;
        this._currentHash = W.location.hash;
        this._currentPath = W.location.pathname;
        this._dockH = 0;
        this._noClickUntil = 0;
        this._bNav = this._handleBrowserEvents.bind(this);
        this._bOutside = this._handleClickOutside.bind(this);
        this._bUd = (e) => { if (e && e.detail && e.detail.key === UD_KEY) this._udRev++; };
        this._bHjem = () => { this._udRev++; };
        /* family-status-card (m.fl.) melder fra når en popup er åpen: linjen gjemmes så lenge
           (klassen ki-popup-apen på <html> + window-hendelsen ki-popup {apen}). */
        this._popupApen = false;
        this._bPopup = (e) => {
          const apen = e && e.detail && typeof e.detail.apen === "boolean" ? e.detail.apen
            : document.documentElement.classList.contains("ki-popup-apen");
          this._popupApen = apen;
          if (apen) this._openMenu = null;
        };
        this._bScroll = this._onScroll.bind(this);
        this._bResize = () => { this._syncLens(true); this._measureDock(); };
        this._tick = this._tick.bind(this);
        this._clickGuard = { handleEvent: (e) => { if (Date.now() < this._noClickUntil) { e.stopPropagation(); e.preventDefault(); } }, capture: true };
      }

      connectedCallback() {
        super.connectedCallback();
        W.addEventListener("hashchange", this._bNav);
        W.addEventListener("location-changed", this._bNav);
        W.addEventListener("popstate", this._bNav);
        W.addEventListener("ki-ud", this._bUd);
        W.addEventListener("ki-hjem-registrert", this._bHjem);
        W.addEventListener("ki-popup", this._bPopup);
        this._popupApen = document.documentElement.classList.contains("ki-popup-apen");
        W.addEventListener("scroll", this._bScroll, { passive: true, capture: true });
        W.addEventListener("resize", this._bResize);
        document.addEventListener("click", this._bOutside);
        if (this.hass) ud.load(this.hass).then(() => this._udRev++);
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        W.removeEventListener("hashchange", this._bNav);
        W.removeEventListener("location-changed", this._bNav);
        W.removeEventListener("popstate", this._bNav);
        W.removeEventListener("ki-ud", this._bUd);
        W.removeEventListener("ki-hjem-registrert", this._bHjem);
        W.removeEventListener("ki-popup", this._bPopup);
        W.removeEventListener("scroll", this._bScroll, { capture: true });
        W.removeEventListener("resize", this._bResize);
        document.removeEventListener("click", this._bOutside);
        if (this._ro) { this._ro.disconnect(); this._ro = null; }
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
        clearTimeout(this._holdT);
        if (this._dockSet) { document.documentElement.style.removeProperty("--kd-dokk-h"); this._dockSet = false; }
      }

      setConfig(config) {
        if (!config || !Array.isArray(config.items)) throw new Error("You need to define a list of items");
        this._config = config;
        const seen = {};
        const uniq = (id) => { if (seen[id]) return id + "#" + (++seen[id]); seen[id] = 1; return id; };
        this._navItems = config.items.map((item, index) =>
          ({ ...item, id: uniq(item.id || (item.name ? "n:" + item.name : item.icon ? "i:" + item.icon : "x:" + index)) }));
        // Menyen bak de tre prikkene: helst prikkeknappen med sub_items, ellers første med sub_items,
        // ellers en prikkeknapp uten egen handling.
        const dots = (it) => it.icon === "mdi:dots-horizontal";
        const menu = this._navItems.find((it) => Array.isArray(it.sub_items) && dots(it))
          || this._navItems.find((it) => Array.isArray(it.sub_items))
          || this._navItems.find((it) => dots(it) && !it.sub_items && (!it.tap_action || it.tap_action.action === "none"));
        this._menuId = menu ? menu.id : null;
        this._subs = menu ? (menu.sub_items || []).filter((s) => s && typeof s === "object").map((s, j) => {
          const path = s.tap_action && s.tap_action.navigation_path;
          return { ...s, id: uniq(s.id || (s.name ? "n:" + s.name : path ? "p:" + path : s.icon ? "i:" + s.icon : "s:" + j)) };
        }) : [];
      }

      getCardSize() { return 1; }
      getGridOptions() { return { columns: "full", rows: 1 }; }

      willUpdate(changed) {
        if (this._currentPath !== W.location.pathname) this._currentPath = W.location.pathname;
        if (this._currentHash !== W.location.hash) this._currentHash = W.location.hash;
        if (changed.has("_config") && this._config) {
          const s = this._config.styles || {};
          if (s.z_index) this.style.setProperty("--z-index", s.z_index);
          if (s.margin_left) this.style.setProperty("--margin-left", s.margin_left);
          this.style.setProperty("--spacer-height", s.spacer_height || "80px");
        }
        if (changed.has("hass") && this.hass && !this._udAsked) {
          this._udAsked = true;
          ud.load(this.hass).then(() => this._udRev++);
        }
      }

      updated() {
        const c = this.renderRoot.querySelector(".navbar-container");
        if (c && this._roEl !== c) {
          if (this._ro) this._ro.disconnect();
          this._roEl = c;
          if (W.ResizeObserver) {
            this._ro = new ResizeObserver(() => { this._syncLens(true); this._measureDock(); });
            this._ro.observe(c);
          }
        }
        this._syncLens(false);
        this._measureDock();
      }

      /* ---------------------------------------------------------- navigasjon */
      _handleBrowserEvents() {
        this._openMenu = null;
        setTimeout(() => {
          this._currentPath = W.location.pathname;
          this._currentHash = W.location.hash;
          this.requestUpdate();
        }, 50);
      }

      _handleClickOutside(e) {
        if (!this._openMenu) return;
        if (!e.composedPath().includes(this)) this._openMenu = null;
      }

      _isPreview() { return this.closest("hui-card-preview") !== null; }

      _evaluateBadge(item) {
        if (!this.hass) return false;
        if (item.badge_template) {
          try { return new Function("states", "user", "hass", "return " + item.badge_template)(this.hass.states, this.hass.user, this.hass); }
          catch (e) { return false; }
        }
        if (item.badge_entity) {
          const s = this.hass.states[item.badge_entity];
          if (!s) return false;
          return s.state === "on" || Number(s.state) > 0;
        }
        return false;
      }

      _checkUserVisibility(item) {
        if (!item.users) return true;
        if (!this.hass || !this.hass.user) return true;
        const me = String(this.hass.user.name || "").toLowerCase();
        return [].concat(item.users).some((u) => String(u).toLowerCase() === me);
      }

      _isActive(item) {
        // Når en meny er åpen er bare menyknappen aktiv (som før).
        if (this._openMenu) return item.id === this._openMenu;
        return this._matches(item);
      }

      _matches(item) {
        if (item.active === true) return true;
        if (item.active_template) {
          try {
            return !!new Function("states", "user", "hass", "path", "hash", "return " + item.active_template)(
              this.hass && this.hass.states, this.hass && this.hass.user, this.hass, this._currentPath, this._currentHash);
          } catch (e) { return false; }
        }
        if (item.sub_items) return item.sub_items.some((s) => this._matches(s));
        const a = item.tap_action;
        if (a && a.navigation_path) {
          const path = String(a.navigation_path).split("::")[0];
          if (path.includes("#")) return this._currentHash !== "" && path.endsWith(this._currentHash);
          return this._currentPath.replace(/\/$/, "") === path.replace(/\/$/, "");
        }
        return false;
      }

      _hashHit(item) {
        if (this._openMenu) return item.id === this._openMenu;
        if (item.sub_items) return item.sub_items.some((s) => this._hashHit(s));
        const p = item.tap_action && item.tap_action.navigation_path;
        return !!p && String(p).includes("#") && this._matches(item);
      }

      _navigate(path) {
        if (!path) return;
        const ren = String(path).split("::")[0];
        const varsle = () => {
          W.dispatchEvent(new Event("hashchange"));
          W.dispatchEvent(new Event("location-changed", { bubbles: true, composed: true }));
        };
        if (ren.includes("#")) {
          const targetHash = ren.substring(ren.indexOf("#"));
          if (this._currentHash === targetHash) {
            // Allerede åpen: fjern hashen (lukker popupen), som før.
            W.history.pushState(null, "", W.location.pathname + W.location.search);
            this._currentHash = "";
            varsle();
            return;
          }
          this._currentHash = targetHash;
        }
        if (typeof KI.navigate === "function") KI.navigate(path);
        else { W.history.pushState(null, "", path); varsle(); }
      }

      _handleAction(item) {
        if (!item) return;
        if (item.sub_items) {
          this._openMenu = this._openMenu === item.id ? null : item.id;
          return;
        }
        this._openMenu = null;
        const a = item.tap_action;
        if (!a) return;
        const entity = a.entity || item.entity;
        switch (a.action) {
          case "navigate": this._navigate(a.navigation_path); break;
          case "call-service":
          case "perform-action": {
            const svc = a.perform_action || a.service;
            if (!svc || !this.hass) break;
            const [domain, service] = svc.split(".");
            this.hass.callService(domain, service, a.service_data || a.data, a.target);
            break;
          }
          case "fire-dom-event": {
            const ev = new Event("ll-custom", { bubbles: true, composed: true });
            ev.detail = a;
            this.dispatchEvent(ev);
            break;
          }
          case "toggle-menu": this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })); break;
          case "url": if (a.url_path) W.open(a.url_path); break;
          case "toggle": if (entity && this.hass) this.hass.callService("homeassistant", "toggle", { entity_id: entity }); break;
          case "more-info": if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true })); break;
          case "ki-navbar-edit": this._openEditor(); break;
          case "ki-hjem-tilpass":
            haptic("medium");
            W.dispatchEvent(new CustomEvent("ki-hjem-tilpass", { detail: { apen: true } }));
            break;
          default: break;
        }
      }

      /* ---------------------------------------------------------- brukervalg */
      _navId() { return (this._config && this._config.nav_id) || "default"; }
      _prefs() { const all = ud.get(this.hass); return (all && all[this._navId()]) || {}; }
      _savePrefs(p) {
        const all = { ...(ud.get(this.hass) || {}) };
        if (p) { p = { ...p }; delete p.size; } // gammel størrelsesnøkkel (ga for liten linje)
        if (p && Object.keys(p).length) all[this._navId()] = p; else delete all[this._navId()];
        ud.save(this.hass, all);
        this._udRev++;
      }
      _setPref(k, v) {
        const p = { ...this._prefs() };
        if (v === undefined || v === null) delete p[k]; else p[k] = v;
        this._savePrefs(p);
      }

      /* Hvor hver knapp havner: { bar:[…], menu:[…], hidden:[…], menuItem }.
         bar er linjen i brukerens rekkefølge (med config-menyknappen), menu innholdet bak prikkene. */
      _model() {
        const p = this._prefs();
        const hidden = new Set(p.hidden || []), more = new Set(p.more || []), out = new Set(p.out || []);
        const own = (Array.isArray(p.custom) ? p.custom : []).map((c) => ({ ...c, _own: true, _def: c.place === "menu" ? "menu" : "bar" }));
        const entries = [
          ...(this._navItems || []).map((it) => ({ ...it, _def: "bar" })),
          ...(this._subs || []).map((it) => ({ ...it, _def: "menu", _sub: true })),
          ...own,
        ].filter((it) => this._checkUserVisibility(it));
        const menuId = this._menuId;
        const place = (it) => {
          if (it.id === menuId) return "bar";
          if (hidden.has(it.id)) return "hidden";
          if (it.sub_items) return "bar"; // undermenyer kan ikke ligge inne i menyen
          if (more.has(it.id)) return "menu";
          if (out.has(it.id)) return "bar";
          return it._def;
        };
        const sortBy = (list, ids, base) => {
          const pos = new Map((Array.isArray(ids) ? ids : []).map((id, i) => [id, i]));
          const keyed = list.map((it, i) => ({ it, i, k: pos.has(it.id) ? pos.get(it.id) : 1e4 + base(it) + i }));
          // Menyknapper flyttet ut uten egen plass i rekkefølgen havner rett før prikkene.
          const mk = keyed.find((o) => o.it.id === menuId);
          keyed.forEach((o) => { if (mk && !pos.has(o.it.id) && o.it._def === "menu") o.k = mk.k - 0.5 + o.i * 1e-6; });
          return keyed.sort((x, y) => x.k - y.k).map((o) => o.it);
        };
        const bar = sortBy(entries.filter((it) => place(it) === "bar"), p.order, () => 0);
        // Standardrekkefølge i menyen: config-underknappene først, så det som er flyttet inn.
        const menu = sortBy(entries.filter((it) => place(it) === "menu"), p.menu, (it) => (it._def === "menu" ? 0 : 5000));
        const hid = entries.filter((it) => place(it) === "hidden");
        return { bar, menu, hidden: hid, menuItem: menuId ? bar.find((it) => it.id === menuId) || null : null };
      }

      _barItems() {
        const m = this._model();
        const subs = [...m.menu];
        /* Nederst i menyen, under en skillelinje: «Tilpass navbar» og «Tilpass Hjem» (som i kd-dokken).
           Standard bare når linjen har en meny; edit_entry: true gir dem alltid (og lager «Mer»). */
        const c = this._config;
        const harMeny = !!this._menuId || subs.length > 0;
        const hale = [];
        if (c.edit_entry === true || (c.edit_entry !== false && harMeny))
          hale.push({ id: "__edit", name: "Tilpass navbar", icon: "mdi:tune-variant", tap_action: { action: "ki-navbar-edit" }, _hale: true });
        if (c.hjem_meny !== false && (harMeny || c.edit_entry === true) && (W.__kiHjem || 0) > 0)
          hale.push({ id: "__hjem", name: "Tilpass Hjem", icon: "mdi:view-dashboard-edit-outline", tap_action: { action: "ki-hjem-tilpass" }, _hale: true });
        if (hale.length && subs.length) subs.push({ id: "__skille", _skille: true });
        subs.push(...hale);
        const bar = [];
        m.bar.forEach((it) => {
          if (it.id !== this._menuId) { bar.push(it); return; }
          if (subs.length) bar.push({ ...it, sub_items: subs, _more: true });
        });
        if (!this._menuId && subs.length) bar.push({ id: "__more", name: "Mer", icon: "mdi:dots-horizontal", sub_items: subs, _more: true });
        return bar;
      }

      _effStyles() {
        const s = this._config.styles || {};
        const p = this._prefs();
        const size = SIZES[p.storrelse];
        return {
          bg: s.background || "#ffffff",
          blur: s.blur || "10px",
          color: s.color || "#454545",
          active: s.active_color || "#000000",
          width: p.width === "auto" ? "auto" : (p.width === "full" || p.width === "fixed") ? "100%" : (s.width || "100%"),
          icon: size ? size.icon : (s.icon_size || "24px"),
          pad: size ? size.pad : (s.button_padding || "6px"),
        };
      }

      _namesMode() { const n = this._prefs().names; return n === "show" || n === "hide" ? n : null; }
      _showName(item) {
        if (!item.name) return false;
        const m = this._namesMode();
        if (m === "hide") return false;
        if (m === "show") return true;
        return !item.hide_name;
      }
      _shrinkOn() { const p = this._prefs(); return p.shrink === undefined ? !!this._config.shrink_on_scroll : !!p.shrink; }

      /* ---------------------------------------------------------- tegning */
      render() {
        if (!this._config || !this._navItems) return nothing;
        const st = this._effStyles();
        const p = this._prefs();
        const items = this._barItems();
        this._items = items;
        const isPreview = this._isPreview();
        const ind = this._config.indicator || "both";
        const flags = items.map((item) => this._isActive(item));
        // Linsen: en åpen popup (hash) vinner over siden den ligger på.
        // Er en popup (hash) åpen, trengs ikke glasslinsen bak – popupen ligger uansett over.
        // lens_popup: true gir den gamle oppførselen (linsen flytter seg til popup-knappen).
        const popupIdx = items.findIndex((item, i) => flags[i] && this._hashHit(item));
        let activeIdx = popupIdx >= 0 ? (this._config.lens_popup ? popupIdx : -1) : flags.indexOf(true);
        this._activeIdx = activeIdx < 0 ? null : activeIdx;
        const wCls = p.width === "full" ? "w-full" : p.width === "fixed" ? "w-fixed" : "";
        const wPx = Math.max(200, Math.min(1200, Number(p.width_px) || 420));
        const last = items.length - 1;

        return html`
          <div class="floating-layer ${isPreview ? "preview-mode" : ""} ${this._shrunk && !isPreview ? "shrunk" : ""} ${wCls} ${this._popupApen && !isPreview ? "popup-skjult" : ""}"
            @transitionend=${() => this._measureDock()}
            style="
              --navbar-bg: ${st.bg};
              --navbar-blur: ${st.blur};
              --navbar-color: ${st.color};
              --navbar-active-color: ${st.active};
              --navbar-width: ${st.width};
              --icon-size: ${st.icon};
              --button-padding: ${st.pad};
              --ki-fixed-w: ${wPx}px;
            ">
            <div class="navbar-container ${ind === "lens" || ind === "none" ? "no-dot" : ""} ${ind === "dot" || ind === "none" ? "no-lens" : ""} ${this._dragIdx !== null ? "dragging" : ""}"
              @pointerdown=${this._pDown} @pointermove=${this._pMove} @pointerup=${this._pUp}
              @pointercancel=${this._pCancel} @lostpointercapture=${this._pCancel}
              @contextmenu=${(e) => e.preventDefault()} @click=${this._clickGuard}>
              <div class="lens"><div class="lens-glass"></div></div>
              ${items.map((item, idx) => {
                const isActive = flags[idx];
                const showBadge = this._evaluateBadge(item);
                const isMenuOpen = this._openMenu === item.id;
                return html`
                  <div class="nav-item-wrapper">
                    ${item.sub_items && isMenuOpen ? html`
                      <div class="sub-menu ${idx === last && last > 0 ? "end" : ""}">
                        ${item.sub_items.map((sub) => {
                          if (sub._skille) return html`<div class="sub-menu-sep" role="separator"></div>`;
                          if (!this._checkUserVisibility(sub)) return nothing;
                          const subActive = !sub.sub_items && this._matches(sub);
                          return html`
                            <div class="sub-menu-item ${!sub.name ? "icon-only" : ""} ${subActive ? "active" : ""} ${sub._hale ? "hale" : ""}"
                              @click=${(e) => { e.stopPropagation(); this._handleAction(sub); }}>
                              <ha-icon icon="${sub.icon}"></ha-icon>
                              ${sub.name ? html`<span>${sub.name}</span>` : ""}
                            </div>`;
                        })}
                      </div>` : ""}
                    <div class="nav-item ${isActive ? "active" : ""} ${this._dragIdx === idx ? "hover" : ""}"
                      role="button" tabindex="0" aria-label=${item.name || item.icon || ""}
                      @click=${() => this._handleAction(item)}
                      @keydown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._handleAction(item); } }}>
                      <div class="icon-container">
                        <ha-icon icon="${item.icon}"></ha-icon>
                        ${showBadge ? html`<div class="badge"></div>` : ""}
                      </div>
                      ${this._showName(item) ? html`<span class="title">${item.name}</span>` : ""}
                    </div>
                  </div>`;
              })}
            </div>
          </div>
          ${this._editOpen ? this._renderPanel() : ""}
        `;
      }

      /* ---------------------------------------------------------- glasslinsen */
      _rects() {
        const c = this.renderRoot.querySelector(".navbar-container");
        if (!c) return null;
        const cr = c.getBoundingClientRect();
        // Linjen kan være skalert (krymp ved scrolling): mål i skjermpiksler, tegn i linjens egne.
        const k = c.offsetWidth ? cr.width / c.offsetWidth : 1;
        const els = [...c.querySelectorAll(":scope > .nav-item-wrapper > .nav-item")];
        return {
          c, cr, k,
          r: els.map((el) => {
            const r = el.getBoundingClientRect();
            const bw = el.offsetWidth || r.width / k, bh = el.offsetHeight || r.height / k;
            const cx = (r.left - cr.left + r.width / 2) / k, cy = (r.top - cr.top + r.height / 2) / k;
            const w = bw + 16, h = bh + 4;
            return { cx, x: cx - w / 2, y: cy - h / 2, w, h };
          }),
        };
      }

      _syncLens(instant) {
        if (this._dragging) return;
        const lens = this.renderRoot && this.renderRoot.querySelector(".lens");
        if (!lens) return;
        const m = this._rects();
        const i = this._activeIdx;
        if (!m || i === null || i === undefined || !m.r[i] || !m.cr.width) {
          lens.classList.remove("on");
          this._lensShown = false;
          return;
        }
        const t = m.r[i];
        const snap = instant || !this._lensShown || !this._ls;
        this._spring(t.x, t.w, t.y, t.h, snap && !this._raf);
        lens.classList.add("on");
        this._lensShown = true;
      }

      _spring(tx, tw, ty, th, instant) {
        const s = this._ls || (this._ls = { x: tx, w: tw, y: ty, h: th, vx: 0, vw: 0 });
        s.tx = tx; s.tw = tw; s.ty = ty; s.th = th;
        if (instant) {
          s.x = tx; s.w = tw; s.y = ty; s.h = th; s.vx = 0; s.vw = 0;
          this._paintLens();
          return;
        }
        if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._tick); }
      }

      _tick(t) {
        const s = this._ls;
        if (!s) { this._raf = null; return; }
        const dt = Math.min(0.034, Math.max(0.001, (t - this._last) / 1000));
        this._last = t;
        // Fjær: litt underdempet når den glir til en knapp (spretter), strammere under dra.
        const k = this._dragging ? 900 : 320, c = this._dragging ? 52 : 23;
        for (let n = 0; n < 3; n++) {
          const h = dt / 3;
          s.vx += (k * (s.tx - s.x) - c * s.vx) * h; s.x += s.vx * h;
          s.vw += (k * (s.tw - s.w) - c * s.vw) * h; s.w += s.vw * h;
        }
        s.y += (s.ty - s.y) * 0.35; s.h += (s.th - s.h) * 0.35;
        const ro = Math.abs(s.tx - s.x) < 0.3 && Math.abs(s.vx) < 3 && Math.abs(s.tw - s.w) < 0.3 && Math.abs(s.vw) < 3;
        if (ro && !this._dragging) {
          s.x = s.tx; s.w = s.tw; s.y = s.ty; s.h = s.th; s.vx = 0; s.vw = 0;
          this._paintLens();
          this._raf = null;
          return;
        }
        this._paintLens();
        this._raf = requestAnimationFrame(this._tick);
      }

      _paintLens() {
        const el = this.renderRoot && this.renderRoot.querySelector(".lens");
        const s = this._ls;
        if (!el || !s) return;
        // Strekk i fartsretningen og klem litt i høyden mens linsen er i bevegelse.
        const sp = Math.min(1, Math.abs(s.vx) / 1600);
        const extra = sp * 26;
        const sy = 1 - sp * 0.16;
        el.style.width = (s.w + extra).toFixed(2) + "px";
        el.style.height = s.h.toFixed(2) + "px";
        el.style.transform = "translate3d(" + (s.x - extra / 2).toFixed(2) + "px," + s.y.toFixed(2) + "px,0) scaleY(" + sy.toFixed(3) + ")";
      }

      /* ---------------------------------------------------------- dra / langt trykk */
      _pDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.composedPath().some((n) => n.classList && n.classList.contains("sub-menu"))) return;
        this._g = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false, held: false, el: e.currentTarget };
        clearTimeout(this._holdT);
        if (this._config.customize !== false) {
          this._holdT = setTimeout(() => {
            const g = this._g;
            if (!g || g.drag) return;
            g.held = true;
            this._noClickUntil = Date.now() + 800;
            haptic("heavy");
            this._openEditor();
          }, 550);
        }
      }

      _pMove(e) {
        const g = this._g;
        if (!g || g.id !== e.pointerId) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.drag) {
          if (g.held) return;
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { clearTimeout(this._holdT); this._g = null; return; }
          if (Math.abs(dx) > 8 && this._config.drag !== false && (this._items || []).length > 1) {
            g.drag = true;
            clearTimeout(this._holdT);
            try { g.el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
            this._dragStart(e.clientX);
          } else if (Math.hypot(dx, dy) > 10) clearTimeout(this._holdT);
          return;
        }
        if (e.cancelable) e.preventDefault();
        this._dragMove(e.clientX);
      }

      _pUp(e) {
        clearTimeout(this._holdT);
        const g = this._g;
        if (!g || g.id !== e.pointerId) return;
        this._g = null;
        if (!g.drag) return;
        this._noClickUntil = Date.now() + 450;
        this._dragEnd(true);
      }

      _pCancel(e) {
        clearTimeout(this._holdT);
        const g = this._g;
        if (!g || (e && e.pointerId !== undefined && g.id !== e.pointerId)) return;
        this._g = null;
        if (g.drag) this._dragEnd(false);
      }

      _nearest(m, x) {
        let best = 0, d = Infinity;
        m.r.forEach((r, i) => { const dd = Math.abs(r.cx - x); if (dd < d) { d = dd; best = i; } });
        return best;
      }

      _dragStart(clientX) {
        this._dragging = true;
        this._openMenu = null;
        const lens = this.renderRoot.querySelector(".lens");
        if (lens) lens.classList.add("on", "drag");
        const m = this._rects();
        if (m && !this._lensShown) {
          const i = this._nearest(m, (clientX - m.cr.left) / m.k);
          this._spring(m.r[i].x, m.r[i].w, m.r[i].y, m.r[i].h, true);
        }
        this._lensShown = true;
        this._dragIdx = null;
        this._dragMove(clientX);
      }

      _dragMove(clientX) {
        const m = this._rects();
        if (!m || !m.r.length) return;
        const x = (clientX - m.cr.left) / m.k;
        const i = this._nearest(m, x);
        if (i !== this._dragIdx) { this._dragIdx = i; haptic("selection"); }
        const t = m.r[i];
        const first = m.r[0], lastR = m.r[m.r.length - 1];
        const tx = Math.max(first.x, Math.min(lastR.x + lastR.w - t.w, x - t.w / 2));
        this._spring(tx, t.w, t.y, t.h, false);
      }

      _dragEnd(commit) {
        this._dragging = false;
        const lens = this.renderRoot.querySelector(".lens");
        if (lens) lens.classList.remove("drag");
        const i = this._dragIdx;
        this._dragIdx = null;
        if (commit && i !== null && this._items && this._items[i]) {
          haptic("light");
          this._handleAction(this._items[i]);
        }
        this.updateComplete.then(() => this._syncLens(false));
      }

      /* ---------------------------------------------------------- krymp ved scrolling */
      _onScroll(e) {
        if (!this._shrinkOn() || this._editOpen) { if (this._shrunk && !this._shrinkOn()) this._shrunk = false; return; }
        const tgt = e.target;
        if (tgt && tgt !== document && tgt.nodeType === 1 && (tgt === this || (e.composedPath && e.composedPath().includes(this)))) return;
        const y = tgt === document || !tgt || tgt === document.documentElement || tgt === document.body
          ? (W.scrollY || document.documentElement.scrollTop || 0) : (tgt.scrollTop || 0);
        if (this._scrollTgt !== tgt) { this._scrollTgt = tgt; this._lastY = y; return; }
        const d = y - this._lastY;
        if (y < 40) { if (this._shrunk) this._shrunk = false; this._lastY = y; return; }
        if (d > 12) { if (!this._shrunk) this._shrunk = true; this._lastY = y; }
        else if (d < -12) { if (this._shrunk) this._shrunk = false; this._lastY = y; }
        clearTimeout(this._shrinkT);
        this._shrinkT = setTimeout(() => this._measureDock(), 380);
      }

      /* ---------------------------------------------------------- --kd-dokk-h */
      _measureDock() {
        const c = this.renderRoot && this.renderRoot.querySelector(".navbar-container");
        if (!c || !this.isConnected) return;
        const r = c.getBoundingClientRect();
        if (!r.height) return;
        const v = Math.max(0, Math.round(W.innerHeight - r.top));
        if (v !== this._dockH) {
          this._dockH = v;
          const pnl = this.renderRoot.querySelector(".ki-panel");
          if (pnl) pnl.style.setProperty("--dock", v + "px");
        }
        if (!this._isPreview()) {
          document.documentElement.style.setProperty("--kd-dokk-h", v + "px");
          this._dockSet = true;
        }
      }

      /* ---------------------------------------------------------- «Tilpass navbar» */
      _openEditor() {
        this._openMenu = null;
        this._shrunk = false;
        this._form = null;
        this._editOpen = true;
      }
      _closeEditor() { this._editOpen = false; this._form = null; haptic("light"); }

      /* ---- flytting: where = "bar" (linjen) | "menu" (bak prikkene) */
      _editPrefs(fn) {
        const p = { ...this._prefs() };
        fn(p);
        ["order", "menu", "hidden", "more", "out", "custom"].forEach((k) => { if (Array.isArray(p[k]) && !p[k].length) delete p[k]; });
        this._savePrefs(p);
      }
      _move(where, id, dir) {
        const ids = this._model()[where].map((i) => i.id);
        const i = ids.indexOf(id), j = i + dir;
        if (i < 0 || j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        haptic("selection");
        this._setPref(where === "bar" ? "order" : "menu", ids);
      }
      /* Linjens rekkefølge med id lagt til: rett før prikkene når de står sist, ellers til slutt. */
      _barOrderWith(m, id) {
        const ids = m.bar.map((i) => i.id).filter((x) => x !== id);
        const k = this._menuId ? ids.indexOf(this._menuId) : -1;
        if (k >= 0 && k === ids.length - 1) ids.splice(k, 0, id); else ids.push(id);
        return ids;
      }
      _toMenu(id) {
        const m = this._model();
        const it = m.bar.find((i) => i.id === id);
        if (!it || it.id === this._menuId || it.sub_items) return;
        haptic("light");
        this._editPrefs((p) => {
          p.out = without(p.out, id);
          if (it._def !== "menu") p.more = [...without(p.more, id), id];
          p.menu = [...m.menu.map((i) => i.id), id];
          if (p.order) p.order = without(p.order, id);
        });
      }
      _toBar(id) {
        const m = this._model();
        const it = m.menu.find((i) => i.id === id);
        if (!it) return;
        haptic("light");
        this._editPrefs((p) => {
          p.more = without(p.more, id);
          if (it._def !== "bar") p.out = [...without(p.out, id), id];
          p.order = this._barOrderWith(m, id);
          if (p.menu) p.menu = without(p.menu, id);
        });
      }
      _hide(id, on) {
        haptic("light");
        this._editPrefs((p) => { p.hidden = on ? [...without(p.hidden, id), id] : without(p.hidden, id); });
      }
      _delete(id) {
        haptic("medium");
        this._editPrefs((p) => {
          p.custom = (p.custom || []).filter((c) => c.id !== id);
          ["order", "menu", "hidden", "more", "out"].forEach((k) => { if (p[k]) p[k] = without(p[k], id); });
        });
      }
      _addItem() {
        const f = this._form || {};
        const target = String(f.target || "").trim();
        if (!target) { this._form = { ...f, err: "Fyll inn mål" }; return; }
        const m = this._model();
        const id = "u:" + Date.now().toString(36);
        const place = f.place === "menu" ? "menu" : "bar";
        const item = { id, name: String(f.name || "").trim() || undefined, icon: String(f.icon || "").trim() || "mdi:star-outline", tap_action: tapFor(f.type || "popup", target), place };
        if (!item.name) delete item.name;
        haptic("success");
        this._form = null;
        this._editPrefs((p) => {
          p.custom = [...(p.custom || []), item];
          if (place === "bar" && (this._menuId || (p.order && p.order.length))) p.order = this._barOrderWith(m, id);
          if (place === "menu" && p.menu && p.menu.length) p.menu = [...m.menu.map((i) => i.id), id];
        });
      }
      _reset() {
        haptic("warning");
        this._form = null;
        this._savePrefs({});
      }

      _label(it) {
        if (it.name) return it.name;
        if (it.id === this._menuId) return "Tre prikker";
        const a = it.tap_action || {};
        return a.navigation_path || a.entity || it.entity || a.url_path || it.icon || "Uten navn";
      }

      _renderPanel() {
        const p = this._prefs();
        const m = this._model();
        const namesOn = this._namesMode() ? this._namesMode() === "show" : this._items && this._items.some((i) => this._showName(i));
        const pill = (cur, v, l, fn) => html`<button class="pill ${cur === v ? "on" : ""}" @click=${() => { haptic("selection"); fn(v); }}>${l}</button>`;
        const sw = (on, fn, label) => html`<button class="sw ${on ? "on" : ""}" role="switch" aria-checked=${on ? "true" : "false"} aria-label=${label} @click=${() => { haptic("light"); fn(!on); }}></button>`;
        const dock = this._dockH || 100;
        const row = (it, i, where, n) => {
          const isMenu = it.id === this._menuId;
          const tag = isMenu ? "Menyen · " + m.menu.length : it._own ? "Egen" : it.sub_items ? "Undermeny" : "";
          return html`
            <div class="p-row ${where === "hidden" ? "dim" : ""}" data-id=${it.id}>
              <ha-icon class="p-ico" icon=${it.icon || "mdi:circle-outline"}></ha-icon>
              <div class="p-name"><span>${this._label(it)}</span>${tag ? html`<em>${tag}</em>` : ""}</div>
              ${where === "hidden" ? "" : html`
                <button class="ib" aria-label="Flytt opp" ?disabled=${i === 0} @click=${() => this._move(where, it.id, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
                <button class="ib" aria-label="Flytt ned" ?disabled=${i === n - 1} @click=${() => this._move(where, it.id, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
                ${where === "bar"
                  ? html`<button class="ib rem" aria-label="Flytt bak de tre prikkene" ?disabled=${isMenu || !!it.sub_items} @click=${() => this._toMenu(it.id)}><ha-icon icon="mdi:minus-circle"></ha-icon></button>`
                  : html`<button class="ib addc" aria-label="Legg i navbaren" @click=${() => this._toBar(it.id)}><ha-icon icon="mdi:plus-circle"></ha-icon></button>`}`}
              ${it._own
                ? html`<button class="ib" aria-label="Slett" @click=${() => this._delete(it.id)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>`
                : where === "hidden"
                  ? html`<button class="ib on" aria-label="Vis igjen" @click=${() => this._hide(it.id, false)}><ha-icon icon="mdi:eye-outline"></ha-icon></button>`
                  : html`<button class="ib" aria-label="Skjul" ?disabled=${isMenu} @click=${() => this._hide(it.id, true)}><ha-icon icon="mdi:eye-off-outline"></ha-icon></button>`}
            </div>`;
        };
        return html`
          <div class="ki-backdrop" @click=${() => this._closeEditor()}></div>
          <div class="ki-panel" style="--dock:${dock}px" @click=${(e) => e.stopPropagation()}
            @pointerdown=${(e) => e.stopPropagation()}>
            <div class="p-head">
              <div class="p-title">Tilpass navbar</div>
              <button class="ib" aria-label="Lukk" @click=${() => this._closeEditor()}><ha-icon icon="mdi:close"></ha-icon></button>
            </div>

            <div class="p-sec">I navbaren</div>
            <div class="p-list sec-bar">
              ${m.bar.length ? m.bar.map((it, i) => row(it, i, "bar", m.bar.length)) : html`<div class="p-empty">Ingen – alt ligger bak de tre prikkene</div>`}
            </div>
            <div class="p-sec">Bak de tre prikkene</div>
            <div class="p-list sec-menu">
              ${m.menu.length ? m.menu.map((it, i) => row(it, i, "menu", m.menu.length))
                : html`<div class="p-empty">Tom – trykk <ha-icon icon="mdi:minus-circle"></ha-icon> på en knapp for å flytte den hit</div>`}
            </div>
            ${m.hidden.length ? html`
              <div class="p-sec">Skjult</div>
              <div class="p-list sec-hidden">${m.hidden.map((it, i) => row(it, i, "hidden", m.hidden.length))}</div>` : ""}

            <div class="p-sec">Ny knapp</div>
            ${this._form ? this._renderAdd() : html`
              <button class="btn add" @click=${() => { haptic("light"); this._form = { type: "popup", name: "", icon: "", target: "", place: "bar" }; }}>
                <ha-icon icon="mdi:plus"></ha-icon> Legg til knapp
              </button>`}

            <div class="p-sec">Visning</div>
            <div class="p-row set"><span>Vis navn</span>${sw(namesOn, (v) => this._setPref("names", v ? "show" : "hide"), "Vis navn")}</div>
            <div class="p-row set"><span>Krymp ved scrolling</span>${sw(this._shrinkOn(), (v) => { this._setPref("shrink", v); if (!v) this._shrunk = false; }, "Krymp ved scrolling")}</div>
            <div class="p-lbl">Bredde</div>
            <div class="pills">
              ${pill(p.width || "", "", "Standard", (v) => this._setPref("width", v || undefined))}
              ${pill(p.width || "", "auto", "Tilpass", (v) => this._setPref("width", v))}
              ${pill(p.width || "", "full", "Full", (v) => this._setPref("width", v))}
              ${pill(p.width || "", "fixed", "Fast", (v) => this._setPref("width", v))}
            </div>
            ${p.width === "fixed" ? html`
              <div class="p-row set">
                <input class="range" type="range" min="240" max="900" step="10" .value=${String(Number(p.width_px) || 420)}
                  @change=${(e) => this._setPref("width_px", Number(e.target.value))}
                  @input=${(e) => { const l = this.renderRoot.querySelector(".ki-fixed-w-val"); if (l) l.textContent = e.target.value + " px"; }}>
                <span class="ki-fixed-w-val">${Number(p.width_px) || 420} px</span>
              </div>` : ""}
            <div class="p-lbl">Størrelse</div>
            <div class="pills wrap">
              ${pill(SIZES[p.storrelse] ? p.storrelse : "", "", "Standard", () => this._setPref("storrelse", undefined))}
              ${Object.keys(SIZES).map((k) => pill(p.storrelse, k, SIZES[k].l, (v) => this._setPref("storrelse", v)))}
            </div>

            <div class="p-foot">
              <button class="btn" ?disabled=${!Object.keys(p).length} @click=${() => this._reset()}>Nullstill</button>
              <button class="btn pri" @click=${() => this._closeEditor()}>Ferdig</button>
            </div>
          </div>`;
      }

      _renderAdd() {
        const f = this._form;
        const set = (k, v) => { this._form = { ...this._form, [k]: v, err: null }; };
        const type = ADD_TYPES.find((t) => t.v === f.type) || ADD_TYPES[0];
        const entityType = f.type === "toggle" || f.type === "more-info";
        const hasIconPicker = !!customElements.get("ha-icon-picker");
        const hasEntityPicker = entityType && !!customElements.get("ha-entity-picker");
        const ids = entityType && !hasEntityPicker && this.hass ? Object.keys(this.hass.states).sort() : [];
        return html`
          <div class="p-add">
            <div class="pills">
              ${ADD_TYPES.map((t) => html`<button class="pill ${type.v === t.v ? "on" : ""}" @click=${() => { haptic("selection"); set("type", t.v); }}>${t.l}</button>`)}
            </div>
            ${hasEntityPicker
              ? html`<ha-entity-picker .hass=${this.hass} .value=${f.target || ""} allow-custom-entity @value-changed=${(e) => set("target", e.detail.value)}></ha-entity-picker>`
              : html`<input class="txt tgt" list="ki-nav-ent" placeholder=${type.ph} .value=${f.target || ""} @input=${(e) => { this._form.target = e.target.value; }}>
                  ${ids.length ? html`<datalist id="ki-nav-ent">${ids.map((i) => html`<option value=${i}></option>`)}</datalist>` : ""}`}
            <input class="txt nm" placeholder="Navn (valgfritt)" .value=${f.name || ""} @input=${(e) => { this._form.name = e.target.value; }}>
            ${hasIconPicker
              ? html`<ha-icon-picker .hass=${this.hass} .value=${f.icon || ""} label="Ikon" @value-changed=${(e) => set("icon", e.detail.value)}></ha-icon-picker>`
              : html`<div class="ico-in"><ha-icon icon=${f.icon || "mdi:star-outline"}></ha-icon>
                  <input class="txt ic" placeholder="Ikon, f.eks. mdi:lightbulb" .value=${f.icon || ""} @change=${(e) => set("icon", e.target.value)}></div>`}
            <div class="pills place">
              <button class="pill ${f.place !== "menu" ? "on" : ""}" @click=${() => { haptic("selection"); set("place", "bar"); }}>I navbaren</button>
              <button class="pill ${f.place === "menu" ? "on" : ""}" @click=${() => { haptic("selection"); set("place", "menu"); }}>Bak de tre prikkene</button>
            </div>
            ${f.err ? html`<div class="err">${f.err}</div>` : ""}
            <div class="p-foot">
              <button class="btn" @click=${() => { this._form = null; }}>Avbryt</button>
              <button class="btn pri" @click=${() => this._addItem()}>Legg til</button>
            </div>
          </div>`;
      }

      static get styles() {
        return css`
          :host {
            display: block;
            width: 100%;
            height: var(--spacer-height, 80px);
            background: transparent;
            margin-left: var(--margin-left, 0px);
            transition: margin-left 0.3s ease;
          }
          @media (max-width: 870px) {
            :host { margin-left: 0px !important; }
          }
          .floating-layer {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            transform-origin: 50% 100%;
            transition: transform 0.35s cubic-bezier(.2,.8,.2,1);
            width: auto;
            max-width: 600px;
            z-index: var(--z-index, 6);
          }
          .floating-layer.w-full { width: calc(100vw - 24px); max-width: none; }
          .floating-layer.w-fixed { width: var(--ki-fixed-w, 420px); max-width: calc(100vw - 24px); }
          .floating-layer.shrunk { transform: translateX(-50%) scale(0.86); }
          /* Skjult mens en popup er åpen (ki-popup). Bare opasitet: størrelsen og --kd-dokk-h står. */
          .floating-layer { transition: transform 0.35s cubic-bezier(.2,.8,.2,1), opacity 0.18s ease; }
          .floating-layer.popup-skjult { opacity: 0; pointer-events: none; }
          .floating-layer.popup-skjult * { pointer-events: none !important; }
          .navbar-container {
            position: relative;
            display: flex;
            align-items: center;
            background: var(--navbar-bg);
            backdrop-filter: blur(var(--navbar-blur));
            -webkit-backdrop-filter: blur(var(--navbar-blur));
            border-radius: 35px;
            padding: 10px 16px;
            width: var(--navbar-width);
            box-shadow: 0px 4px 20px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.2);
            box-sizing: border-box;
            touch-action: pan-y;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
          }
          .floating-layer.preview-mode {
            position: absolute;
            bottom: 0; left: 0;
            transform: none;
            width: 100%; max-width: 100%;
          }
          :host-context(hui-card-preview) {
            z-index: 1 !important;
            margin-left: 0 !important;
            height: auto;
            display: block;
            position: relative;
          }
          .nav-item-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            flex: 1;
          }
          .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--navbar-color);
            transition: all 0.2s ease;
            padding: var(--button-padding);
            border-radius: 12px;
            outline: none;
          }
          .nav-item:hover { opacity: 1; background-color: rgba(255,255,255,0.1); }
          .nav-item:focus-visible { box-shadow: 0 0 0 2px var(--navbar-active-color); }
          .nav-item.active, .nav-item.hover {
            color: var(--navbar-active-color);
            opacity: 1;
            transform: scale(1.05);
          }
          .dragging .nav-item.active:not(.hover) { color: var(--navbar-color); transform: none; }
          .nav-item.active::after {
            content: ''; position: absolute; bottom: 2px;
            width: 4px; height: 4px;
            background: var(--navbar-active-color);
            border-radius: 50%;
          }
          .no-dot .nav-item.active::after, .dragging .nav-item.active::after { display: none; }
          ha-icon { --mdc-icon-size: var(--icon-size); }
          .title {
            font-size: 10px; margin-top: 4px; font-weight: 500;
            max-height: 14px; overflow: hidden; white-space: nowrap;
            transition: max-height .3s ease, opacity .2s ease, margin .3s ease;
          }
          .shrunk .title { max-height: 0; opacity: 0; margin-top: 0; }
          .icon-container { position: relative; display: flex; align-items: center; justify-content: center; }
          .badge {
            position: absolute; top: -2px; right: -2px;
            width: 8px; height: 8px;
            background-color: var(--error-color);
            border-radius: 50%;
            border: 1px solid var(--navbar-bg);
          }

          /* Glasslinsen bak den aktive knappen */
          .lens {
            position: absolute; left: 0; top: 0; width: 0; height: 0;
            pointer-events: none; opacity: 0;
            transition: opacity .25s ease;
            will-change: transform, width;
            transform-origin: 50% 50%;
          }
          .lens.on { opacity: 1; }
          .no-lens .lens:not(.drag) { opacity: 0; }
          .lens-glass {
            width: 100%; height: 100%;
            box-sizing: border-box;
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.08)),
              color-mix(in srgb, var(--navbar-active-color) 9%, transparent);
            border: 1px solid rgba(255,255,255,.38);
            box-shadow: inset 0 1px 1px rgba(255,255,255,.55), inset 0 -1px 2px rgba(0,0,0,.06), 0 2px 10px rgba(0,0,0,.07);
            -webkit-backdrop-filter: blur(4px) saturate(1.6);
            backdrop-filter: blur(4px) saturate(1.6);
            transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, background .25s ease;
          }
          .lens.drag .lens-glass {
            transform: scale(1.14);
            background: linear-gradient(180deg, rgba(255,255,255,.42), rgba(255,255,255,.12)),
              color-mix(in srgb, var(--navbar-active-color) 6%, transparent);
            box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -1px 3px rgba(0,0,0,.08), 0 8px 22px rgba(0,0,0,.14);
          }

          .sub-menu {
            position: absolute; bottom: 75px; left: 50%;
            transform: translateX(-50%);
            background: var(--navbar-bg);
            border-radius: 16px;
            padding: 8px;
            box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
            display: flex; flex-direction: column; gap: 6px;
            animation: fadeUp 0.2s ease-out;
            z-index: 1000;
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(var(--navbar-blur));
            -webkit-backdrop-filter: blur(var(--navbar-blur));
          }
          .sub-menu.end { left: auto; right: -8px; transform: none; animation-name: fadeUpEnd; }
          .sub-menu-item {
            display: flex; align-items: center; gap: 12px;
            padding: 10px 12px;
            border-radius: 8px; cursor: pointer;
            white-space: nowrap;
            color: var(--navbar-color);
          }
          .sub-menu-item.icon-only { justify-content: center; }
          .sub-menu-item.hale { opacity: .72; }
          .sub-menu-sep { height: 1px; margin: 0 10px; background: currentColor; color: var(--navbar-color); opacity: .14; }
          .sub-menu-item:hover { background: rgba(0,0,0,0.05); color: var(--navbar-active-color); }
          .sub-menu-item span { font-size: 14px; font-weight: 500; }
          .sub-menu-item.active {
            color: var(--navbar-active-color);
            background: rgba(0,0,0,0.05);
            font-weight: bold;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
          @keyframes fadeUpEnd {
            from { opacity: 0; transform: translate(0, 10px); }
            to { opacity: 1; transform: translate(0, 0); }
          }

          /* «Tilpass navbar» – ki-cards-panel (DESIGN.md) */
          .ki-backdrop {
            position: fixed; inset: 0;
            z-index: calc(var(--z-index, 6) + 1);
            background: rgba(0,0,0,.18);
            animation: kiFade .2s ease-out;
          }
          .ki-panel {
            position: fixed; left: 50%;
            bottom: calc(var(--dock, 100px) + 12px);
            transform: translateX(-50%);
            width: min(440px, calc(100vw - 24px));
            max-height: calc(100vh - var(--dock, 100px) - 36px - env(safe-area-inset-top, 0px));
            max-height: calc(100dvh - var(--dock, 100px) - 36px - env(safe-area-inset-top, 0px));
            overflow-y: auto; overscroll-behavior: contain;
            box-sizing: border-box;
            z-index: calc(var(--z-index, 6) + 2);
            padding: 16px;
            border-radius: 24px;
            background: color-mix(in srgb, var(--gray100, var(--card-background-color, #f4f4f6)) 88%, transparent);
            -webkit-backdrop-filter: blur(24px) saturate(1.6);
            backdrop-filter: blur(24px) saturate(1.6);
            border: 1px solid rgba(255,255,255,.12);
            box-shadow: 0 10px 40px rgba(0,0,0,.18);
            color: var(--gray1000, var(--primary-text-color, #1c1c1e));
            font-size: 14px; font-weight: 500;
            -webkit-tap-highlight-color: transparent;
            animation: kiUp .32s cubic-bezier(.2,.9,.3,1.15);
          }
          .ki-panel * { box-sizing: border-box; }
          .ki-panel ha-icon { --mdc-icon-size: 20px; }
          .p-head { display: flex; align-items: center; justify-content: space-between; margin: 0 0 6px 4px; }
          .p-title { font-size: 20px; font-weight: 500; }
          .p-sec { font-size: 14px; font-weight: 500; opacity: .7; margin: 14px 4px 8px; }
          .p-lbl { font-size: 14px; font-weight: 500; opacity: .7; margin: 12px 4px 6px; }
          .p-list { display: flex; flex-direction: column; gap: 6px; }
          .p-row {
            display: flex; align-items: center; gap: 6px;
            min-height: 48px; padding: 6px 6px 6px 12px;
            border-radius: 18px;
            background: var(--gray200, rgba(127,127,127,.14));
          }
          .p-row.set { justify-content: space-between; padding-right: 10px; margin-bottom: 6px; }
          .p-row.dim .p-ico, .p-row.dim .p-name span { opacity: .45; }
          .p-ico { flex: none; margin-right: 4px; }
          .p-name { flex: 1; min-width: 0; display: flex; flex-direction: column; }
          .p-name span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .p-name em { font-style: normal; font-size: 12px; opacity: .6; }
          .ib {
            flex: none; width: 32px; height: 32px; padding: 0;
            border: 0; border-radius: 50%;
            display: grid; place-items: center;
            background: var(--gray100, rgba(127,127,127,.12));
            color: inherit; cursor: pointer;
            transition: transform .08s ease, background .15s ease;
          }
          .ib ha-icon { --mdc-icon-size: 18px; }
          .ib:active { transform: scale(.92); }
          .ib.on { background: var(--active-big, #ee95ff); color: var(--black, #000); }
          .ib.rem { color: var(--red, #e5484d); }
          .ib.addc { color: var(--green, #30a46c); }
          .ib.rem ha-icon, .ib.addc ha-icon { --mdc-icon-size: 22px; }
          .ib:disabled { opacity: .3; cursor: default; }
          .p-head .ib { background: var(--gray200, rgba(127,127,127,.14)); }
          .btn {
            border: 0; border-radius: 999px; padding: 11px 18px;
            font: inherit; font-size: 14px; font-weight: 500;
            background: var(--gray200, rgba(127,127,127,.14)); color: inherit; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          }
          .btn:disabled { opacity: .4; cursor: default; }
          .btn.pri { background: var(--active-big, #ee95ff); color: var(--black, #000); }
          .btn.add { width: 100%; margin-top: 8px; }
          .pills {
            display: flex; gap: 4px; padding: 4px;
            border-radius: 999px;
            background: var(--gray200, rgba(127,127,127,.14));
          }
          .pill {
            flex: 1; min-width: 0; border: 0; background: none; color: inherit;
            border-radius: 999px; padding: 8px 4px;
            font: inherit; font-size: 13px; font-weight: 500;
            white-space: nowrap; cursor: pointer;
            transition: background .2s ease;
          }
          .pills.wrap .pill { flex: 1 1 auto; padding: 8px 6px; }
          .p-empty { font-size: 13px; opacity: .6; padding: 10px 12px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
          .p-empty ha-icon { --mdc-icon-size: 16px; color: var(--red, #e5484d); }
          .pill.on { background: var(--active-big, #ee95ff); color: var(--black, #000); }
          .sw {
            flex: none; position: relative; width: 48px; height: 28px; padding: 0;
            border: 0; border-radius: 999px; cursor: pointer;
            background: var(--gray100, rgba(127,127,127,.25));
            transition: background .2s ease;
          }
          .sw::after {
            content: ""; position: absolute; top: 3px; left: 3px;
            width: 22px; height: 22px; border-radius: 50%;
            background: var(--gray1000, #fff); opacity: .85;
            transition: transform .25s cubic-bezier(.34,1.56,.64,1);
          }
          .sw.on { background: var(--active-big, #ee95ff); }
          .sw.on::after { transform: translateX(20px); background: var(--black, #000); opacity: .8; }
          .p-add {
            display: flex; flex-direction: column; gap: 8px;
            margin-top: 8px; padding: 10px;
            border-radius: 24px;
            background: var(--gray200, rgba(127,127,127,.14));
          }
          .p-add .pills { background: var(--gray100, rgba(127,127,127,.12)); }
          .txt {
            width: 100%; border: 0; outline: none;
            border-radius: 14px; padding: 12px 14px;
            font: inherit; font-size: 14px; font-weight: 500;
            background: var(--gray100, rgba(127,127,127,.12)); color: inherit;
          }
          .ico-in { display: flex; align-items: center; gap: 8px; }
          .ico-in ha-icon { flex: none; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: var(--gray100, rgba(127,127,127,.12)); }
          .err { color: var(--red, var(--error-color, #e5484d)); font-size: 13px; padding: 0 4px; }
          .range { flex: 1; accent-color: var(--active-big, #ee95ff); }
          .p-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
          .p-add .p-foot { margin-top: 2px; }
          @keyframes kiUp {
            from { opacity: 0; transform: translate(-50%, 16px) scale(.97); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
          @keyframes kiFade { from { opacity: 0; } to { opacity: 1; } }
        `;
      }
    }
    defineEl(TYPE, KiFloatingNavbar);

    /* =================================================================== GUI-editor */
    const E_ACTIONS = [
      { v: "navigate", l: "Gå til side" },
      { v: "popup", l: "Åpne popup (#)" },
      { v: "url", l: "Åpne lenke" },
      { v: "toggle", l: "Slå av/på" },
      { v: "more-info", l: "Vis detaljer" },
      { v: "service", l: "Kjør handling" },
      { v: "toggle-menu", l: "HA-sidemeny" },
      { v: "edit", l: "Tilpass navbar" },
      { v: "hjem", l: "Tilpass Hjem" },
      { v: "submenu", l: "Undermeny" },
      { v: "none", l: "Ingen" },
    ];
    const STYLE_FIELDS = [
      ["background", "Bakgrunn", "#ffffff"], ["blur", "Uskarphet", "10px"],
      ["color", "Farge", "#454545"], ["active_color", "Aktiv farge", "#000000"],
      ["width", "Bredde", "100%"], ["icon_size", "Ikonstørrelse", "24px"],
      ["button_padding", "Knappepolstring", "6px"], ["z_index", "z-index", "6"],
      ["margin_left", "Venstremarg (desktop)", "0px"], ["spacer_height", "Avstand nederst", "80px"],
    ];

    const actionOf = (it) => {
      if (it.sub_items) return "submenu";
      const a = it.tap_action || {};
      switch (a.action) {
        case "navigate": return String(a.navigation_path || "").startsWith("#") ? "popup" : "navigate";
        case "url": return "url";
        case "toggle": return "toggle";
        case "more-info": return "more-info";
        case "call-service": case "perform-action": return "service";
        case "toggle-menu": return "toggle-menu";
        case "ki-navbar-edit": return "edit";
        case "ki-hjem-tilpass": return "hjem";
        case "fire-dom-event": return "other";
        case undefined: case "none": return "none";
        default: return "other";
      }
    };

    class KiFloatingNavbarEditor extends LitElement {
      static get properties() { return { hass: { attribute: false }, _config: { state: true }, _open: { state: true } }; }
      constructor() { super(); this._open = null; }
      setConfig(config) { this._config = clone(config || {}); if (!Array.isArray(this._config.items)) this._config.items = []; }

      _emit(cfg) {
        this._config = cfg;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      }
      _edit(fn) { const c = clone(this._config); fn(c); this._emit(c); }
      /* path: [i] eller [i, j] (underknapp) */
      _get(c, path) { return path.length === 1 ? c.items[path[0]] : c.items[path[0]].sub_items[path[1]]; }
      _list(c, path) { return path.length === 1 ? c.items : c.items[path[0]].sub_items; }
      _setField(path, key, val) {
        this._edit((c) => {
          const it = this._get(c, path);
          if (val === "" || val === undefined || val === null || val === false) delete it[key]; else it[key] = val;
        });
      }
      _setTap(path, patch) {
        this._edit((c) => {
          const it = this._get(c, path);
          it.tap_action = { ...(it.tap_action || {}), ...patch };
          Object.keys(it.tap_action).forEach((k) => { if (it.tap_action[k] === "" || it.tap_action[k] === undefined) delete it.tap_action[k]; });
        });
      }
      _setType(path, type) {
        this._edit((c) => {
          const it = this._get(c, path);
          const old = it.tap_action || {};
          const oldT = old.navigation_path || old.url_path || old.entity || "";
          if (type === "submenu") { delete it.tap_action; if (!it.sub_items) it.sub_items = []; return; }
          delete it.sub_items;
          if (type === "navigate") it.tap_action = { action: "navigate", navigation_path: String(oldT).startsWith("/") ? oldT : "" };
          else if (type === "popup") it.tap_action = { action: "navigate", navigation_path: String(oldT).startsWith("#") ? oldT : "#" };
          else if (type === "url") it.tap_action = { action: "url", url_path: old.url_path || "" };
          else if (type === "toggle" || type === "more-info") it.tap_action = { action: type, entity: old.entity || "" };
          else if (type === "service") it.tap_action = { action: "perform-action", perform_action: old.perform_action || old.service || "" };
          else if (type === "toggle-menu") it.tap_action = { action: "toggle-menu" };
          else if (type === "edit") it.tap_action = { action: "ki-navbar-edit" };
          else if (type === "hjem") it.tap_action = { action: "ki-hjem-tilpass" };
          else it.tap_action = { action: "none" };
          Object.keys(it.tap_action).forEach((k) => { if (it.tap_action[k] === "") delete it.tap_action[k]; });
        });
      }
      _moveItem(path, dir) {
        this._edit((c) => {
          const l = this._list(c, path), i = path[path.length - 1], j = i + dir;
          if (j < 0 || j >= l.length) return;
          [l[i], l[j]] = [l[j], l[i]];
          if (path.length === 1 && this._open !== null) {
            const [oi] = String(this._open).split(".").map(Number);
            if (oi === i) this._open = String(j); else if (oi === j) this._open = String(i);
          }
        });
      }
      _delItem(path) {
        this._edit((c) => { this._list(c, path).splice(path[path.length - 1], 1); });
        if (path.length === 1) this._open = null;
      }
      _addItem(parent) {
        this._edit((c) => {
          const it = { name: "Ny", icon: "mdi:star-outline", tap_action: { action: "navigate", navigation_path: "/" } };
          if (parent === undefined) { c.items.push(it); this._open = String(c.items.length - 1); }
          else { const p = c.items[parent]; p.sub_items = p.sub_items || []; p.sub_items.push(it); }
        });
      }
      _setStyle(key, val) {
        this._edit((c) => {
          c.styles = { ...(c.styles || {}) };
          if (val === "" || val === undefined) delete c.styles[key]; else c.styles[key] = val;
          if (!Object.keys(c.styles).length) delete c.styles;
        });
      }
      _setTop(key, val, def) {
        this._edit((c) => { if (val === def || val === "" || val === undefined) delete c[key]; else c[key] = val; });
      }

      _txt(label, val, fn, ph) {
        return html`<label class="f"><span>${label}</span>
          <input .value=${val == null ? "" : String(val)} placeholder=${ph || ""} @change=${(e) => fn(e.target.value.trim())}></label>`;
      }
      _icon(val, fn) {
        if (customElements.get("ha-icon-picker"))
          return html`<ha-icon-picker class="f" .hass=${this.hass} .value=${val || ""} label="Ikon" @value-changed=${(e) => fn(e.detail.value)}></ha-icon-picker>`;
        return this._txt("Ikon", val, fn, "mdi:home");
      }
      _entity(label, val, fn) {
        if (customElements.get("ha-entity-picker"))
          return html`<ha-entity-picker class="f" .hass=${this.hass} .value=${val || ""} .label=${label} allow-custom-entity @value-changed=${(e) => fn(e.detail.value)}></ha-entity-picker>`;
        return this._txt(label, val, fn, "light.stue");
      }

      _actionFields(it, path) {
        const t = actionOf(it);
        const a = it.tap_action || {};
        const opts = E_ACTIONS.filter((o) => (o.v !== "submenu" || path.length === 1));
        return html`
          <label class="f"><span>Handling</span>
            <select @change=${(e) => this._setType(path, e.target.value)}>
              ${opts.map((o) => html`<option value=${o.v} ?selected=${o.v === t}>${o.l}</option>`)}
              ${t === "other" ? html`<option value="other" selected>Annet (YAML: ${a.action})</option>` : ""}
            </select></label>
          ${t === "navigate" ? this._txt("Sti", a.navigation_path, (v) => this._setTap(path, { navigation_path: v }), "/lovelace/hjem") : ""}
          ${t === "popup" ? this._txt("Popup-hash", a.navigation_path, (v) => this._setTap(path, { navigation_path: v && !v.startsWith("#") ? "#" + v : v }), "#strom") : ""}
          ${t === "url" ? this._txt("URL", a.url_path, (v) => this._setTap(path, { url_path: v }), "https://…") : ""}
          ${t === "toggle" || t === "more-info" ? this._entity("Entitet", a.entity, (v) => this._setTap(path, { entity: v })) : ""}
          ${t === "service" ? html`
            ${this._txt("Handling (domene.tjeneste)", a.perform_action || a.service, (v) => this._setTap(path, a.service && !a.perform_action ? { service: v } : { perform_action: v }), "light.toggle")}
            ${this._txt("Data (JSON)", a.data || a.service_data ? JSON.stringify(a.data || a.service_data) : "", (v) => {
              let d; try { d = v ? JSON.parse(v) : undefined; } catch (e) { return; }
              this._setTap(path, a.service_data && !a.data ? { service_data: d } : { data: d });
            }, '{"entity_id": "light.stue"}')}` : ""}
        `;
      }

      _itemRow(it, path, count) {
        const key = path.join(".");
        const open = this._open === key || (path.length === 2 && this._openSub === key);
        const i = path[path.length - 1];
        const toggle = () => {
          if (path.length === 1) this._open = open ? null : key;
          else { this._openSub = open ? null : key; this.requestUpdate(); }
        };
        return html`
          <div class="it ${open ? "open" : ""} ${path.length === 2 ? "sub" : ""}">
            <div class="it-h" @click=${toggle}>
              <ha-icon icon=${it.icon || "mdi:circle-outline"}></ha-icon>
              <span class="nm">${it.name || it.icon || "Uten navn"}${it.sub_items ? html` <em>· ${it.sub_items.length} under</em>` : ""}</span>
              <button class="ib" title="Opp" ?disabled=${i === 0} @click=${(e) => { e.stopPropagation(); this._moveItem(path, -1); }}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
              <button class="ib" title="Ned" ?disabled=${i === count - 1} @click=${(e) => { e.stopPropagation(); this._moveItem(path, 1); }}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
              <button class="ib" title="Slett" @click=${(e) => { e.stopPropagation(); this._delItem(path); }}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
              <ha-icon class="chev" icon=${open ? "mdi:chevron-up" : "mdi:chevron-down"}></ha-icon>
            </div>
            ${open ? html`
              <div class="it-b">
                ${this._txt("Navn", it.name, (v) => this._setField(path, "name", v))}
                ${this._icon(it.icon, (v) => this._setField(path, "icon", v))}
                ${this._actionFields(it, path)}
                ${path.length === 1 ? html`
                  <label class="chk"><input type="checkbox" .checked=${!!it.hide_name} @change=${(e) => this._setField(path, "hide_name", e.target.checked)}> Skjul navn</label>
                  ${this._entity("Badge-entitet", it.badge_entity, (v) => this._setField(path, "badge_entity", v))}
                  ${this._txt("Bare for brukere (kommaseparert)", (it.users || []).join(", "), (v) => this._setField(path, "users", v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined), "Sebastian, Kari")}
                  <details class="adv"><summary>Avansert</summary>
                    ${this._txt("badge_template (JS)", it.badge_template, (v) => this._setField(path, "badge_template", v), "states['sensor.x'].state > 0")}
                    ${this._txt("active_template (JS)", it.active_template, (v) => this._setField(path, "active_template", v), "path.startsWith('/lovelace/rom')")}
                  </details>` : ""}
                ${it.sub_items ? html`
                  <div class="subs">
                    <div class="lbl">Undermeny</div>
                    ${it.sub_items.map((s, j) => this._itemRow(s, [path[0], j], it.sub_items.length))}
                    <button class="btn" @click=${() => this._addItem(path[0])}><ha-icon icon="mdi:plus"></ha-icon> Legg til underknapp</button>
                  </div>` : ""}
              </div>` : ""}
          </div>`;
      }

      render() {
        if (!this._config) return nothing;
        const c = this._config;
        const s = c.styles || {};
        const items = c.items || [];
        return html`
          <div class="ed">
            <div class="h">Knapper</div>
            ${items.map((it, i) => this._itemRow(it, [i], items.length))}
            <button class="btn" @click=${() => this._addItem()}><ha-icon icon="mdi:plus"></ha-icon> Legg til knapp</button>

            <div class="h">Funksjoner</div>
            <label class="f"><span>Aktiv-markering</span>
              <select @change=${(e) => this._setTop("indicator", e.target.value, "both")}>
                ${[["both", "Glasslinse + prikk"], ["lens", "Glasslinse"], ["dot", "Prikk"], ["none", "Ingen"]].map(([v, l]) =>
                  html`<option value=${v} ?selected=${(c.indicator || "both") === v}>${l}</option>`)}
              </select></label>
            <label class="chk"><input type="checkbox" .checked=${c.drag !== false} @change=${(e) => this._setTop("drag", e.target.checked, true)}> Dra fingeren langs linjen for å velge</label>
            <label class="chk"><input type="checkbox" .checked=${c.customize !== false} @change=${(e) => this._setTop("customize", e.target.checked, true)}> Langt trykk åpner «Tilpass navbar»</label>
            <label class="chk"><input type="checkbox" .checked=${c.edit_entry !== false} @change=${(e) => this._setTop("edit_entry", e.target.checked ? undefined : false, undefined)}> «Tilpass navbar» nederst i menyen</label>
            <label class="chk"><input type="checkbox" .checked=${c.hjem_meny !== false} @change=${(e) => this._setTop("hjem_meny", e.target.checked ? undefined : false, undefined)}> «Tilpass Hjem» nederst i menyen (når Hjem-kortet er på siden)</label>
            <label class="chk"><input type="checkbox" .checked=${!!c.shrink_on_scroll} @change=${(e) => this._setTop("shrink_on_scroll", e.target.checked, false)}> Krymp ved scrolling (standard)</label>
            ${this._txt("Navbar-ID (for brukervalg)", c.nav_id, (v) => this._setTop("nav_id", v, "default"), "default")}

            <div class="h">Stil</div>
            <div class="grid">
              ${STYLE_FIELDS.map(([k, l, ph]) => this._txt(l, s[k], (v) => this._setStyle(k, v), ph))}
            </div>
          </div>`;
      }

      static get styles() {
        return css`
          .ed { display: flex; flex-direction: column; gap: 8px; }
          .h { font-size: 15px; font-weight: 500; margin: 12px 0 2px; }
          .it { border: 1px solid var(--divider-color, rgba(127,127,127,.3)); border-radius: 12px; overflow: hidden; }
          .it.sub { border-radius: 10px; }
          .it-h { display: flex; align-items: center; gap: 6px; padding: 6px 8px 6px 12px; cursor: pointer; }
          .it-h > ha-icon:first-child { --mdc-icon-size: 20px; margin-right: 4px; }
          .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; }
          .nm em { font-style: normal; opacity: .6; font-weight: 400; }
          .chev { --mdc-icon-size: 20px; opacity: .6; }
          .ib { width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; display: grid; place-items: center; }
          .ib:hover { background: rgba(127,127,127,.15); }
          .ib:disabled { opacity: .3; cursor: default; }
          .ib ha-icon { --mdc-icon-size: 18px; }
          .it-b { display: flex; flex-direction: column; gap: 8px; padding: 4px 12px 12px; }
          .f { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
          .f > span { opacity: .7; }
          .f input, .f select {
            font: inherit; font-size: 14px; padding: 9px 10px; border-radius: 8px;
            border: 1px solid var(--divider-color, rgba(127,127,127,.35));
            background: var(--card-background-color, transparent); color: var(--primary-text-color);
          }
          ha-icon-picker.f, ha-entity-picker.f { display: block; }
          .chk { display: flex; align-items: center; gap: 8px; font-size: 14px; }
          .adv summary { cursor: pointer; font-size: 13px; opacity: .7; margin: 2px 0 6px; }
          .adv { display: flex; flex-direction: column; gap: 8px; }
          .subs { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 10px; background: rgba(127,127,127,.08); }
          .lbl { font-size: 12px; opacity: .7; }
          .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border-radius: 999px;
            border: 1px dashed var(--divider-color, rgba(127,127,127,.4)); background: none; color: inherit; font: inherit; font-size: 14px; cursor: pointer; }
          .btn ha-icon { --mdc-icon-size: 18px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        `;
      }
    }
    defineEl(TYPE + "-editor", KiFloatingNavbarEditor);

    if (typeof KI.register === "function") KI.register(TYPE, "KI Flytende navbar", "Flytende navigasjonslinje med glasslinse, dra-for-å-velge og «Tilpass navbar» per bruker");
    else {
      W.customCards = W.customCards || [];
      if (!W.customCards.some((k) => k.type === TYPE)) W.customCards.push({ type: TYPE, name: "KI Flytende navbar", description: "Flytende navigasjonslinje", preview: false });
    }
  });
})();

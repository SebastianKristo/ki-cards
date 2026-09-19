/* ki-tabs-card – faner med kort i hver fane.
   style: pills (piller) | scroll (rullbar fanerad) | dropdown (pille som åpner meny)
          | auto (piller når de får plass, ellers scroll – standard)
   tittel: 'Strømpriser' setter en overskrift til venstre på samme linje som fanene.
   sticky: true holder fanelinja øverst når innholdet scroller (gjennomsiktig med blur, eller bg: <farge>). */
(function (KI) {
  /* `align` tar både norske ord og CSS-verdier. «venstre» er lettere å huske enn
     «flex-start», og den som alt har skrevet flex-start skal ikke måtte endre noe. */
  const KI_JUST = (v) => ({
    venstre: "flex-start", midten: "center", midt: "center", senter: "center",
    hoyre: "flex-end", høyre: "flex-end",
    left: "flex-start", center: "center", right: "flex-end",
  }[String(v || "").toLowerCase()] || v || "center");

  class SkTabsCard extends KI.Card {
    static getStubConfig() { return { tabs: [{ title: "Fane 1", cards: [] }] }; }
    static getConfigElement() { return document.createElement("ki-tabs-card-editor"); }
    static getStubConfig() {
      return { align: "center",
        tabs: [{ title: "Fane 1", cards: [] }, { title: "Fane 2", cards: [] }] };
    }

    setConfig(config) {
      if (!config.tabs || !config.tabs.length) throw new Error("tabs mangler");
      this._active = config.default || 0;
      this._config = config; this._built = false; this._menuOpen = false;
      if (this._hass) this._build();
    }
    set hass(h) { this._hass = h; if (!this._built) this._build(); (this._panels || []).forEach(p => p.hass = h); }
    get hass() { return this._hass; }
    disconnectedCallback() {
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._ro) this._ro.disconnect();
      if (this._docClick) document.removeEventListener("click", this._docClick, true);
      if (this._lukk) { window.removeEventListener("resize", this._flytt); window.removeEventListener("scroll", this._lukk, true); }
      if (this._esc) document.removeEventListener("keydown", this._esc);
      this._menuOpen = false; this.classList.remove("ki-meny-apen");
    }

    async _build() {
      this._built = true;
      const c = this._config; const tabs = c.tabs; const style = c.style || "auto";
      const sticky = !!c.sticky;
      this.shadowRoot.innerHTML = `<style>${KI.css}
        :host { overflow:visible; position:relative; }
        :host(.ki-meny-apen) { z-index:99; }
        .wrap { display:flex; flex-direction:column; gap:${c.gap ?? 12}px; max-width:100%; }
        .bar { display:flex; align-items:center; justify-content:${c.tittel ? "space-between" : KI_JUST(c.align)};
          gap:10px; position:relative; z-index:6; max-width:100%;
          ${sticky ? `position:sticky; top:0; padding:6px 0 8px; margin:-6px 0 -8px; border-radius:0 0 18px 18px;
            background:${c.bg || "var(--ki-tabs-bg, transparent)"}; ${c.bg ? "" : "backdrop-filter:blur(14px) saturate(1.2); -webkit-backdrop-filter:blur(14px) saturate(1.2);"}` : ""} }
        .tabs { display:inline-flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px; max-width:100%; }
        /* rullbar rad: piller i full bredde, sveipbar, med fade og pil-hint i kantene */
        .scroller { position:relative; display:none; width:100%; min-width:0; }
        .bar.scroll { justify-content:stretch; }
        .bar.scroll .scroller { display:block; }
        .spor { display:flex; gap:4px; padding:2px; border:1px solid rgba(255,255,255,.3); border-radius:999px;
          overflow-x:auto; overflow-y:hidden; scroll-behavior:smooth; scrollbar-width:none; -webkit-overflow-scrolling:touch;
          scroll-snap-type:x proximity; overscroll-behavior-x:contain; }
        .spor::-webkit-scrollbar { display:none; }
        .spor .tab { scroll-snap-align:center; flex:0 0 auto; }
        /* kantene toner ut selve pillene med en maske – ingen mørk boks over innholdet */
        .scroller.mer-h .spor { mask-image:linear-gradient(to right, #000 calc(100% - 46px), transparent 100%);
          -webkit-mask-image:linear-gradient(to right, #000 calc(100% - 46px), transparent 100%); }
        .scroller.mer-v .spor { mask-image:linear-gradient(to right, transparent 0, #000 46px);
          -webkit-mask-image:linear-gradient(to right, transparent 0, #000 46px); }
        .scroller.mer-v.mer-h .spor { mask-image:linear-gradient(to right, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%);
          -webkit-mask-image:linear-gradient(to right, transparent 0, #000 46px, #000 calc(100% - 46px), transparent 100%); }
        .tab, .dd { border:0; background:transparent; color:rgba(255,255,255,.72); font:inherit; font-size:14px; font-weight:500;
          padding:9px 20px; border-radius:999px; cursor:pointer; display:flex; align-items:center; gap:6px; white-space:nowrap;
          transition:background .15s, color .15s; --mdc-icon-size:18px; }
        /* En fane uten tittel er bare et ikon. Med 20 px padding på hver side ble den
           unødig bred; her blir den rund og like høy som de andre. */
        .tab.kun-ikon { padding:9px 11px; gap:0; }
        /* utenfor: true tar fanen ut av pillegruppa og gir den egen kant, slik
           tannhjulet i bassengkortet står. Det skiller «en annen slags side» fra de
           likeverdige fanene, og det er nettopp forskjellen når fanen er et vedlegg
           til resten og ikke et alternativ på linje med dem. */
        /* Rada har allerede gap 10 px, så egen margin ga 18 px til sammen og fikk
           knappen til å se løsrevet ut. Negativ margin trekker den inn til 4 px: rett
           utenfor rammen, ikke et eget element lenger borte.
           INGEN backticks i denne kommentaren — CSS-en er en mal-streng. */
        .tab.utenfor { flex:0 0 auto; margin-left:-6px; width:40px; height:40px;
          padding:0; justify-content:center; border-radius:50%;
          border:1px solid rgba(255,255,255,.3); --mdc-icon-size:20px;
          transition:background .15s, color .15s, transform .25s cubic-bezier(.2,.8,.2,1); }
        .tab.utenfor.active { transform:scale(1.04); }
        .bar.scroll .tab.utenfor { margin-left:-6px; }
        /* Panelet glir inn fra den siden man kom fra. Retningen er poenget: uten den
           ser det ut som innholdet bare blinker, og man mister følelsen av hvor i rada
           man er. */
        .panel.inn-hoyre { animation:ki-tab-hoyre .22s cubic-bezier(.2,.8,.2,1); }
        .panel.inn-venstre { animation:ki-tab-venstre .22s cubic-bezier(.2,.8,.2,1); }
        @keyframes ki-tab-hoyre {
          from { opacity:0; transform:translateX(14px); }
          to { opacity:1; transform:none; }
        }
        @keyframes ki-tab-venstre {
          from { opacity:0; transform:translateX(-14px); }
          to { opacity:1; transform:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .panel.inn-hoyre, .panel.inn-venstre { animation:none; }
        }
        .tab:hover, .dd:hover { color:rgba(255,255,255,.95); }

        /* Den aktive fyllingen er ett element som GLIR mellom fanene, ikke en bakgrunn
           som skrus av og på. Det er det som gjør at man kan dra i den: pilla følger
           fingeren og lander på fanen du slipper over.
           Fanene ligger over pilla, så teksten er lesbar mens den glir under. */
        .tabs, .spor { position:relative; }
        .pille { position:absolute; top:2px; bottom:2px; left:0; border-radius:999px;
          background:var(--active-big); box-shadow:0 1px 6px rgba(0,0,0,.35);
          transform:translateX(var(--x, 0px)); width:var(--w, 0px);
          transition:transform .28s cubic-bezier(.2,.8,.2,1), width .28s cubic-bezier(.2,.8,.2,1);
          pointer-events:none; z-index:0; }
        .pille.drar { transition:none; }
        .tab, .dd { position:relative; z-index:1; }
        .tab.active { color:rgba(70,58,64,.95); }
        .dd { background:var(--active-big); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }

        /* Trykk: fanen synker litt, og pilla med den. Uten dette er det ingen respons
           i øyeblikket man trykker — bare et resultat et kvart sekund senere. */
        .tab { transition:transform .12s cubic-bezier(.2,.8,.2,1), color .15s; }
        .tab:active { transform:scale(.94); }
        .pille.trykk { transform:translateX(var(--x, 0px)) scaleX(.97); }
        @media (prefers-reduced-motion: reduce) {
          .pille { transition:none; }
          .tab:active { transform:none; }
        }
        .tab:focus-visible, .dd:focus-visible, .item:focus-visible { outline:2px solid var(--active-big); outline-offset:2px; }
        .dd .chev { transition:transform .15s; --mdc-icon-size:20px; margin-right:-6px; }
        .dd.open .chev { transform:rotate(180deg); }
        .menu { position:fixed; left:0; top:0; min-width:220px; max-width:calc(100vw - 32px); max-height:min(60vh, 420px); overflow-y:auto;
          background:var(--gray200); color:var(--gray1000); border-radius:18px; padding:6px;
          box-shadow:0 12px 32px rgba(0,0,0,.5); display:none; z-index:999; -webkit-overflow-scrolling:touch; }
        .menu.open { display:grid; gap:2px; }
        .item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; font-size:14px; font-weight:500; cursor:pointer; --mdc-icon-size:20px; }
        .item:hover { background:var(--gray100); }
        .item.active { background:var(--active-big); color:rgba(70,58,64,.95); }
        .item .n { flex:1; }
        .item .cnt { font-size:12px; opacity:.55; }
        .measure { position:absolute; visibility:hidden; pointer-events:none; left:0; top:0; }
        .tittel { font-size:${c.tittel_storrelse || "16px"}; font-weight:500; color:var(--gray1000); flex:0 1 auto;
          min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-left:2px; }
        .panel { display:none; min-width:0; max-width:100%; } .panel.active { display:block; }
        .stack { display:grid; gap:8px; min-width:0; }
        @media (prefers-reduced-motion: reduce) { .tab, .dd, .dd .chev { transition:none; } }
      </style>
      <div class="wrap">
        <div class="bar">
          ${c.tittel ? `<div class="tittel">${KI.esc(c.tittel)}</div>` : ""}
          <div class="tabs pills" role="tablist"><span class="pille"></span>
            ${tabs.map((t, i) => t.utenfor ? "" : `<button class="tab ${i === this._active ? "active" : ""} ${t.title ? "" : "kun-ikon"}" role="tab" data-i="${i}" ${t.title ? "" : `aria-label="${KI.esc(t.aria || t.icon || "Fane")}"`}>${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          ${tabs.map((t, i) => t.utenfor ? `<button class="tab utenfor ${i === this._active ? "active" : ""}" role="tab" data-i="${i}" aria-label="${KI.esc(t.aria || t.title || t.icon || "Fane")}" title="${KI.esc(t.aria || t.title || "")}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : KI.esc(t.title || "")}</button>` : "").join("")}
          <div class="scroller">
            <div class="spor" role="tablist"><span class="pille"></span>
              ${tabs.map((t, i) => t.utenfor ? "" : `<button class="tab ${i === this._active ? "active" : ""} ${t.title ? "" : "kun-ikon"}" role="tab" data-i="${i}" ${t.title ? "" : `aria-label="${KI.esc(t.aria || t.icon || "Fane")}"`}>${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
            </div>
          </div>
          <div class="tabs pills measure" aria-hidden="true">
            ${tabs.filter((t) => !t.utenfor).map(t => `<button class="tab ${t.title ? "" : "kun-ikon"}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
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

      /* Dra-håndtering på begge faneradene, og pilla plasseres når bredden er kjent.
         `requestAnimationFrame` fordi offsetWidth er 0 før første layout, og pilla da
         ville fått bredde null og stått usynlig til første fanebytte. */
      for (const rad of r.querySelectorAll(".tabs.pills, .spor")) this._koblDra(rad);
      requestAnimationFrame(() => this._flyttPille(this._active, true));

      /* Fanebredden endrer seg når skrifta er ferdig lastet og når kortet endrer
         størrelse. Uten disse to sto pilla igjen på gammel bredde — målt mot
         reservefonten, som er smalere enn den ekte. */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._flyttPille(this._active, true));
      }
      if (this._ro) this._ro.disconnect();
      if (window.ResizeObserver) {
        this._ro = new ResizeObserver(() => this._flyttPille(this._active, true));
        const rad = r.querySelector(".tabs.pills") || r.querySelector(".spor");
        if (rad) this._ro.observe(rad);
      }
      const spor = r.querySelector(".spor"), scroller = r.querySelector(".scroller");
      const kanter = () => {
        if (!spor) return;
        const mer = spor.scrollWidth - spor.clientWidth;
        scroller.classList.toggle("mer-v", spor.scrollLeft > 4);
        scroller.classList.toggle("mer-h", spor.scrollLeft < mer - 4);
      };
      this._kanter = kanter;
      if (spor) {
        spor.addEventListener("scroll", kanter, { passive: true });
        /* vannrett museskroll på hjul, som i en fanerad */
        spor.addEventListener("wheel", e => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          const mer = spor.scrollWidth - spor.clientWidth; if (mer <= 0) return;
          e.preventDefault(); spor.scrollLeft += e.deltaY;
        }, { passive: false });
      }
      r.querySelectorAll(".item").forEach(el => { const go = () => { this._select(+el.dataset.i); this._toggleMenu(false); }; el.addEventListener("click", go); KI.key(el, go); });
      r.querySelector(".dd").addEventListener("click", e => { e.stopPropagation(); this._toggleMenu(); });
      this._docClick = (e) => { if (this._menuOpen && !e.composedPath().includes(this)) this._toggleMenu(false); };
      document.addEventListener("click", this._docClick, true);

      this._mode = style;
      if (style === "auto") {
        const smal = c.dropdown_under ?? 0;   // sett f.eks. 360 for å falle til nedtrekk på svært smale skjermer
        const apply = () => {
          const bar = r.querySelector(".bar"), m = r.querySelector(".measure");
          if (!bar || !m) return;
          const fits = m.scrollWidth <= bar.clientWidth - 4;
          this._setMode(fits ? "pills" : (smal && bar.clientWidth < smal ? "dropdown" : "scroll"));
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
      if (this._mode === mode && this._modeSatt) return;
      this._mode = mode; this._modeSatt = true;
      const r = this.shadowRoot; const pills = r.querySelector(".tabs.pills:not(.measure)"), dd = r.querySelector(".dd");
      pills.style.display = mode === "pills" ? "" : "none";
      dd.style.display = mode === "dropdown" ? "" : "none";
      r.querySelector(".bar").classList.toggle("scroll", mode === "scroll");
      if (mode !== "dropdown") this._toggleMenu(false);
      if (mode === "scroll") requestAnimationFrame(() => { this._rullTil(this._active); this._kanter && this._kanter(); });
    }
    /* hold den valgte fanen synlig i den rullbare raden */
    _rullTil(i) {
      const spor = this.shadowRoot.querySelector(".spor");
      const b = spor && spor.querySelector(`.tab[data-i="${i}"]`);
      if (!spor || !b || !spor.clientWidth) return;
      const mal = b.offsetLeft - (spor.clientWidth - b.offsetWidth) / 2;
      spor.scrollTo({ left: Math.max(0, mal), behavior: this._modeSatt ? "smooth" : "auto" });
    }
    _renderDd() {
      const t = this._config.tabs[this._active] || {};
      const dd = this.shadowRoot.querySelector(".dd");
      dd.innerHTML = `${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>`;
    }
    /* Menyen ligger i fast posisjon og plasseres etter knappen, så den ikke
       klippes av kort under eller av foreldre med overflow:hidden. */
    _plasserMeny() {
      const r = this.shadowRoot, dd = r.querySelector(".dd"), menu = r.querySelector(".menu");
      if (!dd || !menu) return;
      const b = dd.getBoundingClientRect();
      menu.style.visibility = "hidden"; menu.style.display = "grid";
      const mb = menu.getBoundingClientRect();
      menu.style.display = ""; menu.style.visibility = "";
      const marg = 12;
      let venstre = b.left + b.width / 2 - mb.width / 2;
      venstre = Math.min(Math.max(marg, venstre), Math.max(marg, window.innerWidth - mb.width - marg));
      const under = window.innerHeight - b.bottom - marg;
      const over = b.top - marg;
      const nedenfor = under >= Math.min(mb.height, 200) || under >= over;
      menu.style.left = Math.round(venstre) + "px";
      menu.style.top = nedenfor ? Math.round(b.bottom + 6) + "px" : "auto";
      menu.style.bottom = nedenfor ? "auto" : Math.round(window.innerHeight - b.top + 6) + "px";
      menu.style.maxHeight = "min(" + Math.max(160, Math.round(nedenfor ? under : over)) + "px, 60vh)";
    }
    _toggleMenu(open) {
      this._menuOpen = open === undefined ? !this._menuOpen : open;
      const r = this.shadowRoot;
      if (this._menuOpen) this._plasserMeny();
      r.querySelector(".menu").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").classList.toggle("open", this._menuOpen);
      r.querySelector(".dd").setAttribute("aria-expanded", String(this._menuOpen));
      this.classList.toggle("ki-meny-apen", this._menuOpen);
      if (this._menuOpen) {
        if (!this._lukk) {
          this._lukk = () => this._toggleMenu(false);
          this._flytt = () => { if (this._menuOpen) this._plasserMeny(); };
        }
        window.addEventListener("resize", this._flytt);
        window.addEventListener("scroll", this._lukk, true);
        document.addEventListener("keydown", this._esc = this._esc || ((e) => { if (e.key === "Escape") this._toggleMenu(false); }));
      } else if (this._lukk) {
        window.removeEventListener("resize", this._flytt);
        window.removeEventListener("scroll", this._lukk, true);
        if (this._esc) document.removeEventListener("keydown", this._esc);
      }
    }
    /* Flytter pilla til en fane. Kalles etter hver tegning og ved hvert valg. */
    _flyttPille(i, uten = false) {
      const r = this.shadowRoot;
      for (const rad of r.querySelectorAll(".tabs.pills, .spor")) {
        const pille = rad.querySelector(".pille");
        const knapp = rad.querySelector(`.tab[data-i="${i}"]`);
        if (!pille) continue;
        if (!knapp) { pille.style.setProperty("--w", "0px"); continue; }
        pille.classList.toggle("drar", uten);

        /* Målt med getBoundingClientRect, ikke offsetLeft.
         *
         * `offsetLeft` måles fra forelderens KANT, mens `position:absolute; left:0`
         * måles fra innsiden av padding-en. Rada har 1 px ramme og 2 px padding, så
         * pilla lå tre piksler for langt til venstre — nok til at «Kalender» stakk ut
         * på høyre side.
         *
         * Rektangelet tar med ramme, padding og eventuell skalering, så det stemmer
         * uansett hva stilen gjør. */
        const rk = rad.getBoundingClientRect();
        const kk = knapp.getBoundingClientRect();
        const stil = getComputedStyle(rad);
        const venstre = parseFloat(stil.borderLeftWidth) || 0;
        pille.style.setProperty("--x", (kk.left - rk.left - venstre) + "px");
        pille.style.setProperty("--w", kk.width + "px");
      }
    }

    /* Dra: pilla følger fingeren, og fanen under den blir valgt når du slipper.
     *
     * Vi flytter pilla fritt mens du drar — ikke fane for fane — fordi det er det som
     * gjør at den føles festet til fingeren. Den snapper til nærmeste fane først ved
     * slipp. Et lite utslag teller som trykk, ikke som dra, ellers ville et vanlig
     * trykk med litt skjelv blitt tolket som en dratt bevegelse. */
    _koblDra(rad) {
      const pille = rad.querySelector(".pille");
      if (!pille) return;
      let drar = false, start = 0, startX = 0, bredde = 0;

      const fanen = (klientX) => {
        const kasse = rad.getBoundingClientRect();
        const x = klientX - kasse.left + rad.scrollLeft;
        let best = null, avstand = Infinity;
        for (const b of rad.querySelectorAll(".tab[data-i]")) {
          const midt = b.offsetLeft + b.offsetWidth / 2;
          const d = Math.abs(midt - x);
          if (d < avstand) { avstand = d; best = +b.dataset.i; }
        }
        return best;
      };

      rad.addEventListener("pointerdown", (e) => {
        const b = e.target.closest && e.target.closest(".tab[data-i]");
        if (!b) return;
        start = e.clientX;
        startX = parseFloat(pille.style.getPropertyValue("--x")) || 0;
        bredde = pille.offsetWidth;
        drar = false;
        pille.classList.add("trykk");
      });

      rad.addEventListener("pointermove", (e) => {
        if (!start) return;
        const dx = e.clientX - start;
        if (!drar && Math.abs(dx) < 6) return;      // skjelv er ikke en dra
        drar = true;
        pille.classList.remove("trykk");
        pille.classList.add("drar");
        const maks = rad.scrollWidth - bredde - 4;
        pille.style.setProperty("--x", Math.max(2, Math.min(maks, startX + dx)) + "px");
        rad.setPointerCapture && e.pointerId !== undefined
          && rad.setPointerCapture(e.pointerId);
      });

      const slipp = (e) => {
        if (!start) return;
        pille.classList.remove("trykk", "drar");
        const valgt = drar ? fanen(e.clientX) : null;
        start = 0;
        if (valgt !== null && valgt !== undefined && valgt !== this._active) {
          this._select(valgt);
        } else {
          this._flyttPille(this._active);           // snapp tilbake
        }
        drar = false;
      };
      rad.addEventListener("pointerup", slipp);
      rad.addEventListener("pointercancel", slipp);
      rad.addEventListener("scroll", () => this._flyttPille(this._active, true));
    }

    _select(i) {
      const forrige = this._active;
      this._active = i; const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".item").forEach(b => b.classList.toggle("active", +b.dataset.i === i));
      r.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", +p.dataset.i === i));

      /* Glideretningen følger hvilken vei du gikk i rada. Animasjonen fjernes etterpå,
         ellers spilles den ikke om igjen neste gang samme fane velges. */
      const panel = r.querySelector(`.panel[data-i="${i}"]`);
      if (panel && forrige !== i && forrige !== undefined) {
        const klasse = i > forrige ? "inn-hoyre" : "inn-venstre";
        panel.classList.remove("inn-hoyre", "inn-venstre");
        void panel.offsetWidth;                       // tvinger omstart av animasjonen
        panel.classList.add(klasse);
        panel.addEventListener("animationend",
          () => panel.classList.remove(klasse), { once: true });
      }
      this._flyttPille(i);
      this._renderDd();
      if (this._mode === "scroll") this._rullTil(i);
      /* andre kort kan følge fanevalget – sendes både oppover og på window */
      const t = (this._config.tabs || [])[i] || {};
      const detalj = { index: i, title: t.title || "", id: this._config.id || "" };
      KI.fire(this, "ki-tab-changed", detalj);
      window.dispatchEvent(new CustomEvent("ki-tab-changed", { detail: detalj }));
    }
    getCardSize() { return 4; }
  }

  /* ------------------------------------------------------------------ editor
   *
   * To ting den gjør som en `ha-form` ikke kan:
   *
   *  1. Fanene kan legges til, fjernes og flyttes. Rekkefølgen er en del av designet,
   *     og å redigere en liste i YAML for å bytte to faner er unødig tungt.
   *
   *  2. Kortene i hver fane redigeres med Home Assistants egen kortvelger og editor —
   *     `hui-card-element-editor`, den samme som brukes i en vanlig visning.
   *
   * Det andre er verdt en advarsel: den editoren er intern i HA og ikke et offentlig
   * API. Finnes den ikke, faller vi tilbake til YAML for kortene i stedet for å vise et
   * tomt felt. Fanene kan redigeres uansett.
   */
  class SkTabsEditor extends HTMLElement {
    setConfig(c) {
      this._c = JSON.parse(JSON.stringify(c || {}));
      this._valgt = this._valgt ?? 0;
      this._r();
    }

    /* `set hass` fyres hver gang EN tilstand i huset endrer seg — mange ganger i
       minuttet. Den bygde hele editoren på nytt hver gang, med nye ha-form- og
       kortelementer, og det var derfor den hakket mens man skrev.
       Nå sendes hass bare videre til underelementene, som er det de faktisk trenger. */
    set hass(h) {
      const forst = !this._h;
      this._h = h;
      if (forst) { this._r(); return; }
      for (const el of this._underEl || []) el.hass = h;
    }

    _ut() {
      KI.fire(this, "config-changed", { config: this._c });
      this._r();
    }
    _tabs() { return (this._c.tabs = this._c.tabs || []); }

    _flytt(i, d) {
      const t = this._tabs(), j = i + d;
      if (j < 0 || j >= t.length) return;
      [t[i], t[j]] = [t[j], t[i]];
      if (this._valgt === i) this._valgt = j;
      else if (this._valgt === j) this._valgt = i;
      this._ut();
    }
    _slett(i) {
      const t = this._tabs();
      if (t.length <= 1) return;                 // ett kort uten faner gir ingen mening
      t.splice(i, 1);
      this._valgt = Math.max(0, Math.min(this._valgt, t.length - 1));
      this._ut();
    }
    _nyFane() {
      this._tabs().push({ title: `Fane ${this._tabs().length + 1}`, cards: [] });
      this._valgt = this._tabs().length - 1;
      this._ut();
    }

    _r() {
      if (!this._h || !this._c) return;
      this._underEl = [];
      const t = this._tabs();
      const v = Math.max(0, Math.min(this._valgt || 0, t.length - 1));
      this._valgt = v;

      if (!this._bygd) {
        this.attachShadow({ mode: "open" });
        this._bygd = true;
      }
      const rot = this.shadowRoot;
      rot.innerHTML = `<style>
        :host { display:block; }
        .liste { display:grid; gap:6px; margin-bottom:12px; }
        .fane { display:flex; align-items:center; gap:8px; padding:8px 8px 8px 12px;
          border-radius:14px; background:var(--secondary-background-color); }
        .fane.valgt { outline:2px solid var(--primary-color); }
        .navn { flex:1; min-width:0; cursor:pointer; overflow:hidden;
          text-overflow:ellipsis; white-space:nowrap; }
        .navn small { opacity:.6; margin-left:8px; }
        .ikn { border:0; background:none; color:var(--primary-text-color); cursor:pointer;
          padding:4px; border-radius:50%; display:flex; --mdc-icon-size:20px; opacity:.75; }
        .ikn:hover { opacity:1; background:rgba(128,128,128,.18); }
        .ikn[disabled] { opacity:.25; cursor:default; }
        .legg { width:100%; padding:10px; border-radius:14px; border:1px dashed
          var(--divider-color); background:none; color:var(--primary-text-color);
          cursor:pointer; font:inherit; }
        h4 { margin:14px 0 6px; font-size:15px; }
        .merk { font-size:13px; opacity:.7; line-height:1.5; }
        .felt { display:grid; gap:8px; margin-bottom:8px; }
      </style>
      <h4>Kortet</h4>
      <div class="felt" id="kortform2"></div>
      <h4>Faner</h4>
      <div class="liste">${t.map((x, i) => `
        <div class="fane ${i === v ? "valgt" : ""}">
          <span class="navn" data-velg="${i}">${KI.esc(x.title || "")
            || `<em>uten tittel</em>`}<small>${(x.cards || (x.card ? [x.card] : [])).length} kort</small></span>
          <button class="ikn" data-opp="${i}" ${i === 0 ? "disabled" : ""}
            title="Flytt opp"><ha-icon icon="mdi:arrow-up"></ha-icon></button>
          <button class="ikn" data-ned="${i}" ${i === t.length - 1 ? "disabled" : ""}
            title="Flytt ned"><ha-icon icon="mdi:arrow-down"></ha-icon></button>
          <button class="ikn" data-slett="${i}" ${t.length <= 1 ? "disabled" : ""}
            title="Fjern"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
        </div>`).join("")}</div>
      <button class="legg" data-ny="1">+ Legg til fane</button>
      <h4>Fanen «${KI.esc(t[v] && t[v].title || "")}»</h4>
      <div class="felt" id="faneform"></div>
      <h4>Kort i fanen</h4>
      <div id="kort"></div>`;

      rot.querySelectorAll("[data-velg]").forEach((el) =>
        el.addEventListener("click", () => { this._valgt = +el.dataset.velg; this._r(); }));
      /* Alle knappene under bygger fanelista på nytt, som er billig. Det dyre er
         ha-form og kortredigererne, og de røres bare når valgt fane faktisk endres. */
      rot.querySelectorAll("[data-opp]").forEach((el) =>
        el.addEventListener("click", () => this._flytt(+el.dataset.opp, -1)));
      rot.querySelectorAll("[data-ned]").forEach((el) =>
        el.addEventListener("click", () => this._flytt(+el.dataset.ned, 1)));
      rot.querySelectorAll("[data-slett]").forEach((el) =>
        el.addEventListener("click", () => this._slett(+el.dataset.slett)));
      rot.querySelector("[data-ny]").addEventListener("click", () => this._nyFane());

      this._kortform2(rot.querySelector("#kortform2"));
      this._faneform(rot.querySelector("#faneform"), t[v] || {});
      this._kortform(rot.querySelector("#kort"), v);
      this._sistBygd = v;
    }

    /* Innstillinger for hele kortet, ikke for én fane. */
    _kortform2(vert) {
      if (!vert) return;
      const f = document.createElement("ha-form");
      f.hass = this._h;
      f.data = { align: this._c.align || "midten", tittel: this._c.tittel || "" };
      f.schema = [
        { name: "align", selector: { select: { mode: "dropdown", options: [
          { value: "venstre", label: "Venstre" },
          { value: "midten", label: "Midten" },
          { value: "hoyre", label: "Høyre" }] } } },
        { name: "tittel", selector: { text: {} } },
      ];
      const navn = { align: "Plassering av fanerada", tittel: "Tittel til venstre (valgfri)" };
      f.computeLabel = (x) => navn[x.name] || x.name;
      f.addEventListener("value-changed", (e) => {
        Object.assign(this._c, e.detail.value);
        if (!this._c.tittel) delete this._c.tittel;
        KI.fire(this, "config-changed", { config: this._c });
      });
      (this._underEl = this._underEl || []).push(f);
      vert.appendChild(f);
    }

    _faneform(vert, fane) {
      const f = document.createElement("ha-form");
      f.hass = this._h;
      f.data = { title: fane.title || "", icon: fane.icon || "", aria: fane.aria || "" };
      f.schema = [
        { name: "title", selector: { text: {} } },
        { name: "icon", selector: { icon: {} } },
        { name: "aria", selector: { text: {} } },
      ];
      const navn = { title: "Tittel (tom = bare ikon)", icon: "Ikon",
                     aria: "Skjermlesertekst (for faner uten tittel)" };
      f.computeLabel = (x) => navn[x.name] || x.name;
      (this._underEl = this._underEl || []).push(f);
      f.addEventListener("value-changed", (e) => {
        Object.assign(this._tabs()[this._valgt], e.detail.value);
        /* Tomme strenger fjernes, ellers står `icon: ""` igjen i YAML-en og ser ut som
           en innstilling man har gjort. */
        for (const k of ["title", "icon", "aria"]) {
          if (!this._tabs()[this._valgt][k]) delete this._tabs()[this._valgt][k];
        }
        KI.fire(this, "config-changed", { config: this._c });
      });
      vert.appendChild(f);
    }

    _kortform(vert, i) {
      const fane = this._tabs()[i] || {};
      const kort = fane.cards || (fane.card ? [fane.card] : []);
      const ed = document.createElement("hui-card-element-editor");
      if (!customElements.get("hui-card-element-editor")) {
        vert.innerHTML = `<p class="merk">Home Assistant-versjonen din tilbyr ikke
          kortredigereren her. Kortene i fanen redigeres i YAML — bytt til YAML-visning
          med de tre prikkene øverst. Fanene over kan redigeres som vanlig.</p>`;
        return;
      }
      /* Én kortvelger per kort, pluss en tom for å legge til. Vi holder oss til HAs egen
         editor i stedet for å bygge en kortvelger selv: den kjenner alle korttyper,
         også de som installeres senere. */
      kort.forEach((k, ki) => {
        const rad = document.createElement("div");
        rad.style.cssText = "display:flex;gap:8px;align-items:flex-start;margin-bottom:8px";
        const e = document.createElement("hui-card-element-editor");
        e.hass = this._h; e.lovelace = this._lovelace; e.value = k;
        e.style.flex = "1";
        (this._underEl = this._underEl || []).push(e);
        e.addEventListener("config-changed", (ev) => {
          ev.stopPropagation();
          const liste = this._tabs()[i].cards || [];
          liste[ki] = ev.detail.config;
          this._tabs()[i].cards = liste;
          delete this._tabs()[i].card;
          KI.fire(this, "config-changed", { config: this._c });
        });
        const slett = document.createElement("button");
        slett.className = "ikn";
        slett.innerHTML = `<ha-icon icon="mdi:delete-outline"></ha-icon>`;
        slett.addEventListener("click", () => {
          (this._tabs()[i].cards || []).splice(ki, 1);
          this._ut();
        });
        rad.append(e, slett);
        vert.appendChild(rad);
      });

      const ny = document.createElement("button");
      ny.className = "legg";
      ny.textContent = "+ Legg til kort";
      ny.addEventListener("click", () => {
        const liste = this._tabs()[i].cards || [];
        liste.push({ type: "markdown", content: "Nytt kort" });
        this._tabs()[i].cards = liste;
        delete this._tabs()[i].card;
        this._ut();
      });
      vert.appendChild(ny);
      ed.remove();
    }
  }
  if (!customElements.get("ki-tabs-card-editor")) {
    customElements.define("ki-tabs-card-editor", SkTabsEditor);
  }

  customElements.define("ki-tabs-card", SkTabsCard);
  KI.register("ki-tabs-card", "KI Tabs", "Faner som piller, rullbar rad eller nedtrekksmeny, med kort i hver fane");
})(window.KI);

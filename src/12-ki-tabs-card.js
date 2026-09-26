/* ki-tabs-card – faner med kort i hver fane.
   style: pills (piller) | scroll (rullbar fanerad) | dropdown (pille som åpner meny)
          | auto (piller når de får plass, ellers scroll – standard)
   tittel: 'Strømpriser' setter en overskrift til venstre på samme linje som fanene.
   sticky: true holder fanelinja øverst når innholdet scroller (gjennomsiktig med blur, eller bg: <farge>).
   default: fanen kortet åpner på – enten nummeret (0 er den første) eller tittelen på fanen.
   ikon_naar: på en fane – bytt ikon ut fra hvilken fane som er valgt. Nøkkelen er tittelen
              (eller nummeret) på den valgte fanen, verdien det ikonet fanen skal vise da:
                - icon: mdi:gift-outline
                  utenfor: true
                  ikon_naar: { Kalender: mdi:calendar-month }
   kort_naar: på en fane – bytt INNHOLD ut fra hvilken fane som er valgt, med samme
              nøkler som ikon_naar:
                - icon: mdi:gift-outline
                  utenfor: true
                  ikon_naar: { Kalender: mdi:calendar-month }
                  kort_naar:
                    Kalender:
                      - type: custom:ki-kalender-card
                  cards: [ … post og bursdager ellers … ]
   rad_hoyde: hele fanens høyde i px. fane_hoyde er luft over og under teksten, og under den
              luften ligger fortsatt teksten selv – vil du LAVERE enn det, er det rad_hoyde.
   fane_hoyde / fane_bredde tar også ferdige størrelser (samme valg som «Tilpass Hjem»):
     fane_hoyde: lav | middels | hoy | ekstra     (hele fanens høyde 30 / 38 / 46 / 56 px)
     fane_bredde: standard | kompakt | full       (kompakt = smalere piller, full = rada i full bredde)
   Et tall betyr det samme som før (luft i px / minste fanebredde i px).
   Langt trykk på en fane åpner «Tilpass faner», der hver bruker velger høyde og bredde selv.
   Valget lagres per bruker i Home Assistant (KI.udSave(hass, "ki_tabs", …)), per kort:
   nøkkelen er `id:` hvis kortet har det, ellers fanetitlene. tilpass: false slår av langt trykk. */
(function (KI) {
  /* `align` tar både norske ord og CSS-verdier. «venstre» er lettere å huske enn
     «flex-start», og den som alt har skrevet flex-start skal ikke måtte endre noe. */
  const KI_JUST = (v) => ({
    venstre: "flex-start", midten: "center", midt: "center", senter: "center",
    hoyre: "flex-end", høyre: "flex-end",
    left: "flex-start", center: "center", right: "flex-end",
  }[String(v || "").toLowerCase()] || v || "center");

  /* Ferdige fanestørrelser. Høyden er hele fanen, som rad_hoyde. De samme ordene brukes i
     ki-hjem-card, så en bruker kjenner dem igjen fra «Tilpass Hjem». */
  const FANE_H = { lav: 30, middels: 38, hoy: 46, "høy": 46, ekstra: 56 };
  const FANE_B = ["standard", "kompakt", "full"];
  KI.faneMal = KI.faneMal || { hoyde: FANE_H, bredde: FANE_B };
  const hoydeOrd = (v) => (typeof v === "string" && FANE_H[v.toLowerCase()] ? v.toLowerCase().replace("ø", "o") : null);
  const breddeOrd = (v) => (typeof v === "string" && FANE_B.includes(v.toLowerCase()) ? v.toLowerCase() : null);

  class SkTabsCard extends KI.Card {
    static getStubConfig() { return { tabs: [{ title: "Fane 1", cards: [] }] }; }
    static getConfigElement() { return document.createElement("ki-tabs-card-editor"); }
    static getStubConfig() {
      return { align: "center",
        tabs: [{ title: "Fane 1", cards: [] }, { title: "Fane 2", cards: [] }] };
    }

    /* Fanen kortet åpner på.
     *
     * `default` kan være nummeret eller tittelen. Tittelen er den som holder når du
     * flytter om på fanene senere - et nummer peker da plutselig på en annen fane.
     * Peker verdien ingen steder, åpner kortet på den første i stedet for på ingen. */
    static startfane(config) {
      const tabs = config.tabs || [];
      const v = config.default;
      if (v === undefined || v === null || v === "") return 0;
      if (typeof v === "number" || /^\d+$/.test(String(v))) {
        return Math.max(0, Math.min(Number(v), tabs.length - 1));
      }
      const leting = String(v).trim().toLowerCase();
      const i = tabs.findIndex((t) => String((t && (t.title || t.aria)) || "").trim().toLowerCase() === leting);
      return i >= 0 ? i : 0;
    }

    setConfig(config) {
      if (!config.tabs || !config.tabs.length) throw new Error("tabs mangler");
      this._active = SkTabsCard.startfane(config);
      this._config = config; this._built = false; this._menuOpen = false;
      if (this._hass) this._build();
    }
    set hass(h) {
      this._hass = h;
      if (!this._built) this._build();
      else if (!this._udLest && KI.ud) { this._udLest = true; KI.ud(h, "ki_tabs"); }
      (this._panels || []).forEach(p => p.hass = h);
    }
    get hass() { return this._hass; }
    connectedCallback() {
      /* Brukerens egne fanemål kan endres i et annet kort (eller på en annen enhet
         som lagrer). Da settes bare variablene på nytt — ingen ny tegning. */
      if (!this._udLytter) {
        this._udLytter = (e) => {
          if (!e.detail || e.detail.key !== "ki_tabs" || !this._built) return;
          this._mal();
          if (this._tilpassApen) this._tegnTilpass();
        };
      }
      window.addEventListener("ki-ud", this._udLytter);
    }
    disconnectedCallback() {
      if (this._udLytter) window.removeEventListener("ki-ud", this._udLytter);
      this._lukkTilpass();
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._hro) { this._hro.disconnect(); this._hro = null; }
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
      /* px/em/rem eller et tall (som blir px). Et tall alene er den vanligste
         skrivemåten i YAML, og å kreve enhet ville bare gitt feilsøking. */
      this._mal(true);

      this.shadowRoot.innerHTML = `<style>${KI.css}
        :host { overflow:visible; position:relative; }
        :host(.ki-meny-apen) { z-index:99; }
        .wrap { display:flex; flex-direction:column; gap:${c.gap ?? 12}px; max-width:100%; }
        .tabs { width:var(--ki-rad-bredde, auto); max-width:100%; }
        .tabs .tab { flex:var(--ki-fane-flex, 0 0 auto); }
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
        /* Målene styres av variabler, med dagens verdier som standard. Kortet finner
           fortsatt plassen selv; fane_hoyde og fane_bredde overstyrer bare når man vil
           ha noe annet enn det innholdet krever.
           INGEN backticks her — dette er inne i en mal-streng. */
        .tab, .dd { border:0; background:transparent; color:rgba(255,255,255,.72); font:inherit;
          font-size:var(--ki-fane-tekst, 14px); font-weight:500;
          padding:var(--ki-fane-py, 9px) var(--ki-fane-px, 20px);
          min-width:var(--ki-fane-bredde, auto);
          /* Er rad_hoyde satt, er det høyden som gjelder: loddrett luft nulles ut, og
             linjehøyden settes til 1 så teksten ikke drar fanen høyere enn du ba om. */
          height:var(--ki-fane-h, auto);
          padding-top:var(--ki-fane-h-py, var(--ki-fane-py, 9px));
          padding-bottom:var(--ki-fane-h-py, var(--ki-fane-py, 9px));
          line-height:var(--ki-fane-lh, normal);
          border-radius:999px; cursor:pointer; display:flex; align-items:center;
          justify-content:center; gap:6px; white-space:nowrap;
          transition:background .15s, color .15s; --mdc-icon-size:18px; }
        /* En fane uten tittel er bare et ikon. Med 20 px padding på hver side ble den
           unødig bred; her blir den rund og like høy som de andre. */
        .tab.kun-ikon { padding:var(--ki-fane-h-py, 9px) 11px; gap:0; }
        /* utenfor: true tar fanen ut av pillegruppa og gir den egen kant, slik
           tannhjulet i bassengkortet står. Det skiller «en annen slags side» fra de
           likeverdige fanene, og det er nettopp forskjellen når fanen er et vedlegg
           til resten og ikke et alternativ på linje med dem. */
        /* Rada har allerede gap 10 px, så egen margin ga 18 px til sammen og fikk
           knappen til å se løsrevet ut. Negativ margin trekker den inn til 4 px: rett
           utenfor rammen, ikke et eget element lenger borte.
           INGEN backticks i denne kommentaren — CSS-en er en mal-streng. */
        .tab.utenfor { flex:0 0 auto; margin-left:-6px; width:var(--ki-utenfor, 40px); height:var(--ki-utenfor, 40px);
          padding:0; justify-content:center; border-radius:50%;
          border:1px solid rgba(255,255,255,.3); --mdc-icon-size:20px;
          transition:background .15s, color .15s, transform .25s cubic-bezier(.2,.8,.2,1); }
        /* Fanen utenfor gruppa får fyllingen SELV. Pilla glir bare inne i pillegruppa
           og kan ikke nå hit, og siden den er markeringen ellers, sto denne fanen helt
           umerket når den var valgt. Den hadde bakgrunnen fra .tab.active før pilla
           kom, og mistet den da den regelen ble fjernet. */
        .tab.utenfor.active { transform:scale(1.04); background:var(--active-big);
          color:rgba(70,58,64,.95); border-color:transparent;
          box-shadow:0 1px 6px rgba(0,0,0,.35); }
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
        /* Samme som i KI.pillefaner: pilla holdes skjult til skrifta er lastet, så
           den ikke vises et øyeblikk med feil bredde. */
        .pille { opacity:0; }
        .pille.klar { opacity:1; }
        .pille { position:absolute; top:2px; bottom:2px; left:0; border-radius:999px;
          background:var(--active-big); box-shadow:0 1px 6px rgba(0,0,0,.35);
          translate:var(--x, 0px) 0; width:var(--w, 0px);
          scale:var(--sx, 1) var(--sy, 1);
          transition:translate .5s cubic-bezier(.34,1.35,.64,1), width .5s cubic-bezier(.34,1.35,.64,1),
            scale .35s cubic-bezier(.34,1.8,.64,1), opacity .2s;
          pointer-events:none; z-index:0; }
        /* Plassering og form er to egne egenskaper (translate og scale). Lå plasseringen
           i transform, ville strekken også skalert forflytningen, og pilla drev av sted
           mens den ble strukket. Bevegelsen er den fra fanevelgeren i Liquid Glass (kd):
           fjær som overskyter litt ved bytte, fingeren styrer under dra, og en stivere
           fjær når den snapper inn etter slipp. */
        .pille.stille { transition:opacity .2s; }
        .pille.drar { transition:translate .12s cubic-bezier(.3,1.3,.6,1), width .12s ease-out,
            scale .18s cubic-bezier(.2,.8,.3,1); }
        .pille.snapp { transition:translate .55s cubic-bezier(.34,1.56,.64,1), width .55s cubic-bezier(.34,1.56,.64,1),
            scale .45s cubic-bezier(.34,1.8,.64,1), opacity .2s; }
        /* Strekk i fartsretningen når pilla glir til en ny fane (mer jo lenger den går),
           og en liten landing når den ble dratt dit med fingeren. */
        .pille.glid { animation:ki-pille-glid .52s ease-out; }
        .pille.land { animation:ki-pille-land .42s cubic-bezier(.2,.9,.25,1); }
        @keyframes ki-pille-glid {
          0% { scale:1 1; } 35% { scale:calc(1 + .14 * var(--d, 1)) calc(1 - .06 * var(--d, 1)); }
          70% { scale:.98 1.02; } 100% { scale:1 1; } }
        @keyframes ki-pille-land {
          0% { scale:1.1 .9; } 45% { scale:.97 1.04; } 75% { scale:1.02 .99; } 100% { scale:1 1; } }
        .tab, .dd { position:relative; z-index:1; }
        .tab.active { color:rgba(70,58,64,.95); }
        .dd { background:var(--active-big); color:rgba(70,58,64,.95); box-shadow:0 1px 6px rgba(0,0,0,.35); }

        /* Trykk: fanen synker litt, og pilla med den. Uten dette er det ingen respons
           i øyeblikket man trykker — bare et resultat et kvart sekund senere. */
        .tab { transition:transform .12s cubic-bezier(.2,.8,.2,1), color .15s; }
        .tab:active { transform:scale(.94); }
        @media (prefers-reduced-motion: reduce) {
          .pille, .pille.drar, .pille.snapp { transition:opacity .2s; scale:none; }
          .pille.glid, .pille.land { animation:none; }
          .tab:active { transform:none; }
        }
        /* Fanene i pillegruppa: sidelengs drag er vårt (pilla), loddrett ruller siden.
           Uten dette tar nettleseren noen ganger over et sidelengs drag på touch og
           sender pointercancel midt i. Den rullbare rada får beholde sin egen rulling.
           Langt trykk åpner «Tilpass faner», så ingen tekstmarkering eller meny. */
        .tabs.pills .tab { touch-action:pan-y; }
        .tab { -webkit-touch-callout:none; -webkit-user-select:none; user-select:none; }
        /* Målerada skal alltid ha innholdets bredde. Med full bredde ville den målt
           like bred som rada og kortet trodd at fanene aldri får plass. */
        .tabs.measure { width:auto; }
        .tabs.measure .tab { flex:0 0 auto; }
        /* Tilpass faner: lite panel ved rada. Flat --gray200-flate, 24 px, 14 px/500. */
        .tp-bak { position:fixed; inset:0; z-index:998; background:rgba(0,0,0,.25); }
        .tp { position:fixed; z-index:999; left:0; top:0; width:min(360px, calc(100vw - 32px));
          background:var(--gray200); color:var(--gray1000); border-radius:24px; padding:14px;
          display:grid; gap:12px; font-size:14px; font-weight:500; box-sizing:border-box; }
        .tp-topp { display:flex; align-items:center; gap:8px; }
        .tp-tittel { flex:1; font-size:16px; font-weight:500; }
        .tp-knapp { border:0; font:inherit; font-size:14px; font-weight:500; cursor:pointer;
          height:34px; padding:0 14px; border-radius:999px; background:var(--gray100); color:var(--gray1000); }
        .tp-knapp.ferdig { background:var(--active-big); color:var(--black, #000); }
        .tp-rad { display:grid; gap:6px; }
        .tp-etikett { opacity:.7; }
        .tp-chips { display:flex; flex-wrap:wrap; gap:6px; }
        .tp-chip { border:0; font:inherit; font-size:14px; font-weight:500; cursor:pointer;
          height:34px; padding:0 14px; border-radius:999px; background:var(--gray100);
          color:var(--gray1000); transition:transform .12s cubic-bezier(.2,.8,.2,1); }
        .tp-chip:active, .tp-knapp:active { transform:scale(.94); }
        .tp-chip.pa { background:var(--active-big); color:var(--black, #000); }
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
        /* fast_hoyde: paneldelen holder høyden til den høyeste fanen, så popupen
           ikke endrer størrelse når man bytter. Uten den hopper innholdet under —
           og i en popup flytter hele flata seg. */
        .paneler { min-height:var(--ki-panel-h, auto);
          transition:min-height .25s cubic-bezier(.2,.8,.2,1); }
        .stack { display:grid; gap:8px; min-width:0; }
        @media (prefers-reduced-motion: reduce) { .tab, .dd, .dd .chev { transition:none; } }
      </style>
      <div class="wrap">
        <div class="bar">
          ${c.tittel ? `<div class="tittel">${KI.esc(c.tittel)}</div>` : ""}
          <div class="tabs pills" role="tablist"><span class="pille"></span>
            ${tabs.map((t, i) => t.utenfor ? "" : `<button class="tab ${i === this._active ? "active" : ""} ${t.title ? "" : "kun-ikon"}" role="tab" data-i="${i}" ${t.title ? "" : `aria-label="${KI.esc(t.aria || t.icon || "Fane")}"`}>${this._ikon(t, i) ? `<ha-icon icon="${this._ikon(t, i)}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          ${tabs.map((t, i) => t.utenfor ? `<button class="tab utenfor ${i === this._active ? "active" : ""}" role="tab" data-i="${i}" aria-label="${KI.esc(t.aria || t.title || t.icon || "Fane")}" title="${KI.esc(t.aria || t.title || "")}">${this._ikon(t, i) ? `<ha-icon icon="${this._ikon(t, i)}"></ha-icon>` : KI.esc(t.title || "")}</button>` : "").join("")}
          <div class="scroller">
            <div class="spor" role="tablist"><span class="pille"></span>
              ${tabs.map((t, i) => t.utenfor ? "" : `<button class="tab ${i === this._active ? "active" : ""} ${t.title ? "" : "kun-ikon"}" role="tab" data-i="${i}" ${t.title ? "" : `aria-label="${KI.esc(t.aria || t.icon || "Fane")}"`}>${this._ikon(t, i) ? `<ha-icon icon="${this._ikon(t, i)}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
            </div>
          </div>
          <div class="tabs pills measure" aria-hidden="true">
            ${tabs.filter((t) => !t.utenfor).map(t => `<button class="tab ${t.title ? "" : "kun-ikon"}">${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ""}${KI.esc(t.title || "")}</button>`).join("")}
          </div>
          <button class="dd" aria-haspopup="listbox" aria-expanded="false"></button>
          <div class="menu" role="listbox">
            ${tabs.map((t, i) => `<div class="item ${i === this._active ? "active" : ""}" role="option" tabindex="0" data-i="${i}">${this._ikon(t, i) ? `<ha-icon icon="${this._ikon(t, i)}"></ha-icon>` : ""}<span class="n">${KI.esc(t.title || "")}</span></div>`).join("")}
          </div>
        </div>
        <div class="paneler">${tabs.map((t, i) => `<div class="panel ${i === this._active ? "active" : ""}" data-i="${i}"><div class="stack"></div></div>`).join("")}</div>
      </div>`;
      const r = this.shadowRoot;
      r.querySelectorAll(".tab[data-i]").forEach(b => b.addEventListener("click", () => {
        /* Klikket som kommer etter et langt trykk skal ikke også bytte fane. */
        if (this._holdt) { this._holdt = false; return; }
        this._select(+b.dataset.i);
      }));
      r.querySelectorAll(".tabs.pills, .spor").forEach((rad) => rad.addEventListener("contextmenu", (e) => {
        if (this._config.tilpass !== false && e.target.closest && e.target.closest(".tab")) e.preventDefault();
      }));

      /* Dra-håndtering på begge faneradene, og pilla plasseres når bredden er kjent.
         `requestAnimationFrame` fordi offsetWidth er 0 før første layout, og pilla da
         ville fått bredde null og stått usynlig til første fanebytte. */
      for (const rad of r.querySelectorAll(".tabs.pills, .spor")) this._koblDra(rad);

      /* Måling ved oppstart er vanskeligere enn den ser ut.
       *
       * Ett `requestAnimationFrame` er ikke nok: kortet kan fortsatt være i ferd med å
       * legge ut, skrifta er ikke byttet fra reservefonten, og i en popup animeres
       * hele flata inn mens vi måler. Pilla ble derfor riktig først etter et fanebytte
       * — som er nøyaktig det du så.
       *
       * Vi måler flere ganger: to bilder på rad, og igjen etter 120 og 400 ms. Det er
       * billig, det er usynlig når målingen alt er riktig, og det dekker både treg
       * fontlasting og en popup som glir inn. */
      /* Skrifta avgjør fanebredden og lastes etter tegningen. Se kommentaren i
         KI.pillefaner: vises pilla før det, er den målt mot reservefonten. */
      this._fontKlar = !(document.fonts && document.fonts.ready);
      if (!this._fontKlar) {
        document.fonts.ready.then(() => {
          this._fontKlar = true;
          this._flyttPille(this._active, true);
        });
      }
      /* Fast høyde: paneldelen får høyden til den høyeste fanen, så popupen ikke
         endrer størrelse ved fanebytte. Høyden måles etter hvert som kortene laster,
         og vi beholder den største vi har sett — et kort som laster sent ville ellers
         gjort flata kortere igjen. */
      if (this._config.fast_hoyde) {
        const boks = r.querySelector(".paneler");
        this._maksH = 0;
        const mål = () => {
          if (!boks) return;
          for (const pa of r.querySelectorAll(".panel")) {
            const h = pa.scrollHeight;
            if (h > this._maksH) this._maksH = h;
          }
          if (this._maksH) boks.style.setProperty("--ki-panel-h", this._maksH + "px");
        };
        if (this._hro) this._hro.disconnect();
        if (window.ResizeObserver) {
          this._hro = new ResizeObserver(mål);
          for (const pa of r.querySelectorAll(".panel")) this._hro.observe(pa);
        }
        setTimeout(mål, 100);
        setTimeout(mål, 600);
      }

      const mal = () => this._flyttPille(this._active, true);
      requestAnimationFrame(() => { mal(); requestAnimationFrame(mal); });
      setTimeout(mal, 120);
      setTimeout(mal, 400);

      /* Fanebredden endrer seg når skrifta er ferdig lastet og når kortet endrer
         størrelse. Uten disse to sto pilla igjen på gammel bredde — målt mot
         reservefonten, som er smalere enn den ekte. */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._flyttPille(this._active, true));
      }
      if (this._ro) this._ro.disconnect();
      if (window.ResizeObserver) {
        this._ro = new ResizeObserver(() => this._flyttPille(this._active, true));
        /* Vi ser på rada OG på hver enkelt fane. Rada kan ha samme bredde mens en fane
           inni vokser — for eksempel når skrifta byttes — og da fikk pilla gammel
           bredde uten at noe varslet oss. */
        const rad = r.querySelector(".tabs.pills") || r.querySelector(".spor");
        if (rad) this._ro.observe(rad);
        for (const b of r.querySelectorAll(".tab[data-i]")) this._ro.observe(b);
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
        this._tilpassAuto = apply;
        requestAnimationFrame(apply);
      } else this._setMode(style);
      this._renderDd();

      this._panels = [];
      for (let i = 0; i < tabs.length; i++) await this._byggPanel(i);
    }

    /* ------------------------------------------------------------ fanemål
     *
     * Kortets egne mål (fane_hoyde, rad_hoyde, fane_bredde …) er standarden. Brukerens
     * valg i «Tilpass faner» ligger oppå: { hoyde: "middels", bredde: "full" } per kort
     * under nøkkelen «ki_tabs». «standard» betyr kortets egne tall, uten forhåndsvalg.
     * Alt settes som variabler på vertselementet — ingen ny tegning, så pilla og det
     * valgte panelet står der de står. */
    _udNokkel() {
      const c = this._config || {};
      return c.id ? String(c.id) : "faner:" + (c.tabs || []).map((t) => (t && (t.title || t.aria || t.icon)) || "").join("|");
    }
    _brukerMal() {
      const alle = (KI.ud && this._hass) ? KI.ud(this._hass, "ki_tabs") : null;
      return (alle && alle[this._udNokkel()]) || {};
    }
    _faneValg() {
      const c = this._config || {}, u = this._brukerMal();
      const h = u.hoyde ? (u.hoyde === "standard" ? null : hoydeOrd(u.hoyde)) : hoydeOrd(c.fane_hoyde);
      const b = u.bredde ? (u.bredde === "standard" ? null : breddeOrd(u.bredde)) : breddeOrd(c.fane_bredde);
      return { h, b };
    }
    _mal(forst) {
      const c = this._config;
      /* px/em/rem eller et tall (som blir px). Et tall alene er den vanligste
         skrivemåten i YAML, og å kreve enhet ville bare gitt feilsøking. */
      const enhet = (v) => (v === undefined || v === null || v === "" ? null
        : (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))) ? v + "px" : String(v));
      const { h, b } = this._faneValg();
      /* Et ord i fane_hoyde / fane_bredde er et forhåndsvalg, ikke et tall. */
      const py = hoydeOrd(c.fane_hoyde) ? null : c.fane_hoyde;
      const minB = breddeOrd(c.fane_bredde) ? null : c.fane_bredde;
      const radH = h ? FANE_H[h] : c.rad_hoyde;
      const full = b === "full" || c.rad_bredde === "full";
      const vars = [
        ["--ki-fane-py", h ? null : enhet(py)],
        /* Hele høyden, ikke luften rundt teksten. Med bare padding å skru på stopper
           fanen ved tekstens egen linjehøyde: fane_hoyde: 1 gir fortsatt ~20 px, og det
           var ikke til å komme under. rad_hoyde setter høyden direkte og lar teksten
           sentreres i den. */
        ["--ki-fane-h", enhet(radH)],
        ["--ki-fane-h-py", radH ? "0px" : null],
        ["--ki-fane-lh", radH ? "1" : null],
        ["--ki-fane-px", b === "kompakt" ? "12px" : enhet(c.fane_sidepadding)],
        ["--ki-fane-bredde", enhet(minB)],
        ["--ki-fane-tekst", enhet(c.fane_tekst)],
        ["--ki-rad-bredde", full ? "100%" : enhet(c.rad_bredde)],
        ["--ki-fane-flex", (b === "full" || c.fane_lik) ? "1 1 0" : null],
        /* Den runde fanen utenfor gruppa følger rada: fanehøyden + ramme og innrykk. */
        ["--ki-utenfor", h ? (FANE_H[h] + 6) + "px" : null],
      ];
      for (const [k, v] of vars) {
        if (v) this.style.setProperty(k, v); else this.style.removeProperty(k);
      }
      if (forst) return;
      requestAnimationFrame(() => {
        if (this._tilpassAuto) this._tilpassAuto();
        this._flyttPille(this._active, true);
        if (this._tilpassApen) this._plasserTilpass();
      });
    }

    /* ------------------------------------------------------- Tilpass faner */
    _apneTilpass() {
      if (this._config.tilpass === false) return;
      KI.fire(this, "haptic", "medium");
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* ok */ }
      const r = this.shadowRoot;
      this._lukkTilpass();
      const bak = document.createElement("div");
      bak.className = "tp-bak";
      bak.addEventListener("click", () => this._lukkTilpass());
      const tp = document.createElement("div");
      tp.className = "tp";
      tp.setAttribute("role", "dialog");
      tp.setAttribute("aria-label", "Tilpass faner");
      tp.addEventListener("click", (e) => {
        const el = e.target.closest && e.target.closest("[data-tp]");
        if (el) this._tilpassValg(el.dataset.tp);
      });
      r.appendChild(bak); r.appendChild(tp);
      this._tp = tp; this._tpBak = bak; this._tilpassApen = true;
      this.classList.add("ki-meny-apen");
      this._tpEsc = this._tpEsc || ((e) => { if (e.key === "Escape") this._lukkTilpass(); });
      document.addEventListener("keydown", this._tpEsc);
      this._tegnTilpass();
      this._plasserTilpass();
    }
    _lukkTilpass() {
      if (this._tp) this._tp.remove();
      if (this._tpBak) this._tpBak.remove();
      this._tp = this._tpBak = null;
      if (this._tpEsc) document.removeEventListener("keydown", this._tpEsc);
      if (this._tilpassApen && !this._menuOpen) this.classList.remove("ki-meny-apen");
      this._tilpassApen = false;
    }
    _tegnTilpass() {
      if (!this._tp) return;
      const { h, b } = this._faneValg();
      const chip = (on, arg, tekst) => `<button class="tp-chip ${on ? "pa" : ""}" data-tp="${arg}" aria-pressed="${on}">${tekst}</button>`;
      this._tp.innerHTML = `
        <div class="tp-topp"><span class="tp-tittel">Tilpass faner</span>
          <button class="tp-knapp" data-tp="nullstill">Nullstill</button>
          <button class="tp-knapp ferdig" data-tp="lukk">Ferdig</button></div>
        <div class="tp-rad"><span class="tp-etikett">Bredde</span><div class="tp-chips">
          ${[["standard", "Standard"], ["kompakt", "Kompakt"], ["full", "Full"]].map(([v, t]) => chip((b || "standard") === v, "bredde|" + v, t)).join("")}
        </div></div>
        <div class="tp-rad"><span class="tp-etikett">Høyde</span><div class="tp-chips">
          ${[["standard", "Standard"], ["lav", "Lav"], ["middels", "Middels"], ["hoy", "Høy"], ["ekstra", "Ekstra"]].map(([v, t]) => chip((h || "standard") === v, "hoyde|" + v, t)).join("")}
        </div></div>`;
    }
    /* Under rada når det er plass, ellers over. Fast posisjon, så foreldre med
       overflow:hidden ikke klipper panelet — samme grep som nedtrekksmenyen. */
    _plasserTilpass() {
      const tp = this._tp, bar = this.shadowRoot.querySelector(".bar");
      if (!tp || !bar) return;
      const b = bar.getBoundingClientRect(), t = tp.getBoundingClientRect(), marg = 16;
      const venstre = Math.min(Math.max(marg, b.left + b.width / 2 - t.width / 2), Math.max(marg, window.innerWidth - t.width - marg));
      const under = window.innerHeight - b.bottom - marg >= t.height + 8 || b.top < t.height + 8 + marg;
      tp.style.left = Math.round(venstre) + "px";
      tp.style.top = under ? Math.round(b.bottom + 8) + "px" : Math.round(b.top - t.height - 8) + "px";
    }
    _tilpassValg(arg) {
      if (arg === "lukk") { this._lukkTilpass(); return; }
      const alle = { ...((KI.ud && KI.ud(this._hass, "ki_tabs")) || {}) }, n = this._udNokkel();
      if (arg === "nullstill") delete alle[n];
      else {
        const [k, v] = String(arg).split("|");
        alle[n] = { ...(alle[n] || {}), [k]: v };
      }
      KI.fire(this, "haptic", "selection");
      if (KI.udSave) KI.udSave(this._hass, "ki_tabs", alle);
      else { this._mal(); this._tegnTilpass(); }
    }

    /* Hvilken nøkkel i kort_naar/ikon_naar som treffer akkurat nå. Tom streng betyr
       ingen – da gjelder fanens vanlige innhold. */
    _naarNokkel(kart, i) {
      if (!kart) return "";
      /* Hvilken fane det «står på».
       *
       * Trykker du på selve knappen, er DEN valgt - og da ville oppslaget sett på seg
       * selv og falt tilbake på standardinnholdet, altså post og bursdager igjen. Så
       * lenge du står inne i den, gjelder fanen du kom fra. */
      const pek = (i !== undefined && this._active === i) ? this._forrige : this._active;
      if (pek === undefined || pek === null) return "";
      const valgt = (this._config.tabs || [])[pek] || {};
      const tittel = String(valgt.title || "").trim().toLowerCase();
      for (const nokkel of Object.keys(kart)) {
        const n = String(nokkel).trim().toLowerCase();
        if (n === tittel || (/^\d+$/.test(n) && Number(n) === pek)) return nokkel;
      }
      return "";
    }

    _kortFor(t, i) {
      const nokkel = this._naarNokkel(t && t.kort_naar, i);
      if (nokkel) {
        const v = t.kort_naar[nokkel];
        return Array.isArray(v) ? v : (v && v.cards) || (v ? [v] : []);
      }
      return (t && (t.cards || (t.card ? [t.card] : []))) || [];
    }

    /* Bygger innholdet i ett panel. Er det allerede bygget med samme nøkkel, gjøres
       ingenting - ellers ville hvert fanebytte kastet og laget kortene på nytt, og et
       kort som henter noe (kalenderen) ville hentet det om igjen hver gang. */
    async _byggPanel(i) {
      const t = (this._config.tabs || [])[i];
      const panel = this.shadowRoot.querySelector(`.panel[data-i="${i}"]`);
      const host = panel && panel.querySelector(".stack");
      if (!t || !host) return;
      const nokkel = this._naarNokkel(t.kort_naar, i) || "-";
      if (panel.dataset.bygget === nokkel) return;
      panel.dataset.bygget = nokkel;
      this._panels = (this._panels || []).filter((el) => !host.contains(el));
      host.innerHTML = "";
      for (const cc of this._kortFor(t, i)) {
        try { const el = await KI.createCard(cc); el.hass = this._hass; host.appendChild(el); this._panels.push(el); }
        catch (e) { host.innerHTML += `<div class="empty">Kunne ikke laste kort: ${KI.esc(e.message)}</div>`; }
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
    /* Flytter pilla til en fane. Kalles etter hver tegning og ved hvert valg.
     * `uten`: en måling eller korreksjon, ingen animasjon. Et bytte glir med fjær og
     * strekk; rett etter et slipp snapper den inn med en stivere fjær og en landing. */
    _flyttPille(i, uten = false) {
      const r = this.shadowRoot;
      /* Samme regel som i KI.pillefaner: en korreksjon av bredden skal ikke se ut som
         en bevegelse. Vi animerer bare når målet er en annen fane — eller når pilla
         skal snappe inn etter et slipp. */
      const fra = this._sistePille;
      const bytte = fra !== undefined && fra !== i;
      this._sistePille = i;
      const na = performance.now();
      const snapp = na < (this._snappTil || 0);
      if (!bytte && !snapp) uten = true;
      for (const rad of r.querySelectorAll(".tabs.pills, .spor")) {
        const pille = rad.querySelector(".pille");
        const knapp = rad.querySelector(`.tab[data-i="${i}"]`);
        if (!pille) continue;
        /* Er den valgte fanen utenfor denne rada — en `utenfor: true`-fane — skjules
           pilla. Ellers ville den blitt stående på fanen man kom fra, som om to var
           valgt samtidig. */
        if (!knapp) { pille.style.setProperty("--w", "0px"); continue; }
        if (rad._dra && rad._dra.drar) continue;      // fingeren styrer
        if (uten) {
          /* En korreksjon midt i en glidning skal ikke slå av overgangen — da hopper
             pilla resten av veien. Den retter bare målet. */
          if (na >= (this._animTil || 0)) { pille.classList.add("stille"); pille.classList.remove("snapp"); }
        } else {
          pille.classList.remove("stille");
          pille.classList.toggle("snapp", snapp);
          this._animTil = na + 650;
          clearTimeout(pille._snappT);
          if (snapp) pille._snappT = setTimeout(() => pille.classList.remove("snapp"), 650);
        }
        pille.classList.remove("drar");
        if (bytte && !uten && pille.animate) {
          pille.style.setProperty("--d", String(Math.min(3, Math.abs(i - fra))));
          pille.classList.remove("glid", "land");
          void pille.offsetWidth;
          pille.classList.add(snapp ? "land" : "glid");
        }

        /* offsetLeft/offsetWidth, ikke rektangelet: det regner med transformer, og en
           popup som glir inn med scale gir da en skalert bredde. `clientLeft` er
           rammebredden, som er forskjellen mellom offsetLeft og `left:0`. */
        const venstre = rad.clientLeft || 0;
        pille.style.setProperty("--x", (knapp.offsetLeft - venstre) + "px");
        pille.style.setProperty("--w", knapp.offsetWidth + "px");
        pille.classList.toggle("klar", knapp.offsetWidth > 0 && this._fontKlar !== false);
      }
    }

    /* Dra: bevegelsen fra fanevelgeren i Liquid Glass (kd), uten glasset.
     *
     * Etter 6 px sidelengs følger pilla fingeren fritt — ikke fane for fane — løftet
     * litt og strukket etter farten. Bredden glir mellom fanene den passerer, endene
     * gir etter som en gummistrikk, og det vibrerer når den krysser en fane. Ved slipp
     * snapper den med fjær inn på nærmeste fane, som blir valgt. Et lite utslag teller
     * som trykk; loddrett bevegelse overlates til siden. Langt trykk åpner «Tilpass
     * faner». */
    _koblDra(rad) {
      const pille = rad.querySelector(".pille");
      if (!pille || rad._draKoblet) return;
      rad._draKoblet = true;
      const na = () => performance.now();
      const redusert = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      const form = (sx, sy) => { pille.style.setProperty("--sx", sx); pille.style.setProperty("--sy", sy); };
      /* Pekeren i radas koordinater (samme som --x), også når rada er skalert eller rullet. */
      const iRad = (x) => {
        const q = rad.getBoundingClientRect(), f = rad.offsetWidth ? (q.width / rad.offsetWidth) || 1 : 1;
        return (x - q.left) / f - (rad.clientLeft || 0) + rad.scrollLeft;
      };
      let holdT = null;
      const avslutt = () => {
        const d = rad._dra; rad._dra = null;
        if (d) clearTimeout(d.ro);
        form(1, 1); pille.classList.remove("drar");
        return d;
      };
      /* Teksten følger pilla mens man drar: fanen under den får den aktive fargen. */
      const farg = (d, j) => {
        d.g.forEach((q, idx) => {
          q.b.style.color = idx === j ? d.paa : (q.i === this._active ? d.av : "");
        });
      };
      const avfarg = (d) => { if (d && d.g) d.g.forEach((q) => { q.b.style.color = ""; }); };

      rad.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
        const b = e.target.closest && e.target.closest(".tab[data-i]");
        if (!b) return;
        rad._dra = { id: e.pointerId, x0: e.clientX, y0: e.clientY, fraAktiv: +b.dataset.i === this._active,
          drar: false, lx: e.clientX, lt: na(), s: 0, j: -1, off: 0 };
        /* Trykk: pilla synker litt med fanen, så noe skjer i det øyeblikket man trykker. */
        if (!redusert()) form(0.97, 1);
        /* Langt trykk (uten dra) åpner «Tilpass faner». */
        clearTimeout(holdT);
        this._holdt = false;
        if (this._config.tilpass !== false) {
          holdT = setTimeout(() => {
            const d = rad._dra;
            if (!d || d.drar) return;
            avslutt();
            this._holdt = true;
            this._apneTilpass();
          }, 600);
        }
      });

      rad.addEventListener("pointermove", (e) => {
        const d = rad._dra;
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
        if (!d.drar) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { clearTimeout(holdT); avslutt(); return; }
          if (Math.abs(dx) < 6) return;                 // skjelv er ikke en dra
          clearTimeout(holdT);
          const kant = rad.clientLeft || 0;
          d.g = [...rad.querySelectorAll(".tab[data-i]")].filter((b) => b.offsetWidth > 0)
            .map((b) => ({ b, i: +b.dataset.i, w: b.offsetWidth, c: b.offsetLeft - kant + b.offsetWidth / 2 }));
          if (!d.g.length) { avslutt(); return; }
          d.drar = true;
          try { rad.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
          /* Tar man i pilla, holder den grepet der fingeren tok; ellers hopper den til fingeren. */
          if (d.fraAktiv) {
            const x = parseFloat(pille.style.getPropertyValue("--x")) || 0;
            d.off = iRad(d.x0) - (x + pille.offsetWidth / 2);
          }
          pille.classList.remove("stille", "snapp", "glid", "land");
          pille.classList.add("drar");
          d.j = d.g.findIndex((o) => o.i === this._active);
          const a = d.g[d.j], annen = d.g.find((o) => o.i !== this._active);
          d.paa = a ? getComputedStyle(a.b).color : "";
          d.av = annen ? getComputedStyle(annen.b).color : "";
        }
        const g = d.g, n = g.length;
        const raa = iRad(e.clientX) - d.off;
        const c = Math.max(g[0].c, Math.min(g[n - 1].c, raa));
        const o = raa - c;
        const gummi = o / (1 + Math.abs(o) / 40) * 0.35;      // gummistrikk i endene (maks ~14 px)
        let k = 0;
        while (k < n - 2 && c > g[k + 1].c) k++;
        const A = g[k], B = g[Math.min(n - 1, k + 1)];
        const t = B.c === A.c ? 0 : (c - A.c) / (B.c - A.c);
        const w = A.w + (B.w - A.w) * t;
        pille.style.setProperty("--x", (c + gummi - w / 2) + "px");
        pille.style.setProperty("--w", w + "px");
        /* Strekk etter farten, løftet litt mens den holdes; slapper av når fingeren står stille. */
        const tid = na(), v = Math.abs(e.clientX - d.lx) / Math.max(8, tid - d.lt);
        d.lx = e.clientX; d.lt = tid;
        d.s = d.s * 0.6 + Math.min(0.18, v * 0.12) * 0.4;
        const ekstra = Math.min(0.12, Math.abs(gummi) / Math.max(20, w) * 0.8);
        if (!redusert()) form((1.04 + d.s + ekstra).toFixed(3), (1.06 - d.s * 0.55 - ekstra * 0.5).toFixed(3));
        clearTimeout(d.ro);
        d.ro = setTimeout(() => { if (rad._dra === d) { d.s = 0; if (!redusert()) form(1.04, 1.06); } }, 90);
        /* Nærmeste fane; vibrasjon når pilla krysser en ny. */
        let j = 0, best = Infinity;
        g.forEach((q, idx) => { const dd = Math.abs(q.c - c); if (dd < best) { best = dd; j = idx; } });
        if (j !== d.j) { d.j = j; farg(d, j); if (window.KI && window.KI.haptic) window.KI.haptic("selection"); }
      });

      const slipp = (e) => {
        clearTimeout(holdT);
        const d = rad._dra;
        if (!d || e.pointerId !== d.id) return;
        avslutt();
        if (!d.drar) return;                          // vanlig trykk: klikket gjør jobben
        this._draSlutt = na();
        this._snappTil = na() + 450;
        const valgt = e.type === "pointerup" && d.g[d.j] ? d.g[d.j].i : null;
        if (valgt !== null && valgt !== this._active) this._select(valgt);
        else this._flyttPille(this._active);           // fjærer tilbake
        avfarg(d);
      };
      rad.addEventListener("pointerup", slipp);
      rad.addEventListener("pointercancel", slipp);
      rad.addEventListener("lostpointercapture", slipp);
      /* Klikket nettleseren sender etter et drag skal ikke også velge en fane. */
      rad.addEventListener("click", (e) => {
        if (na() - (this._draSlutt || 0) < 400) { e.stopImmediatePropagation(); e.preventDefault(); }
      }, true);
      rad.addEventListener("scroll", () => this._flyttPille(this._active, true));
    }

    /* Ikonet fanen skal vise NÅ.
     *
     * ikon_naar lar en fane bytte ikon etter hvilken fane som er valgt – den lille
     * knappen utenfor rada kan da vise noe som hører til det du står i. Nøkkelen er
     * tittelen på den valgte fanen (uten hensyn til store bokstaver), eller nummeret. */
    _ikon(t, i) {
      const nokkel = this._naarNokkel(t && t.ikon_naar, i);
      if (!nokkel) return t && t.icon;
      const ikon = t.ikon_naar[nokkel];
      return (typeof ikon === "string" ? ikon : (ikon && ikon.icon)) || t.icon;
    }

    /* Oppdaterer de fanene som bytter ikon. Rada tegnes ikke på nytt ved fanebytte –
       bare klassene settes – så ikonene må settes her. */
    _oppdaterIkoner() {
      const tabs = this._config.tabs || [];
      this.shadowRoot.querySelectorAll(".tab[data-i], .item[data-i]").forEach((b) => {
        const t = tabs[+b.dataset.i];
        if (!t || !t.ikon_naar) return;
        const ikon = b.querySelector("ha-icon");
        const ny = this._ikon(t, +b.dataset.i);
        if (ikon && ny && ikon.getAttribute("icon") !== ny) ikon.setAttribute("icon", ny);
      });
    }

    _select(i) {
      const forrige = this._active;
      /* Fanen du kom fra. Den bestemmer hva ikon_naar og kort_naar peker på mens du
         står i en fane som selv bytter innhold. */
      if (forrige !== i) this._forrige = forrige;
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
      this._oppdaterIkoner();
      /* Faner som bytter innhold etter hvor du står, bygges om når valget endrer seg. */
      (this._config.tabs || []).forEach((t, j) => { if (t.kort_naar) this._byggPanel(j); });
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
    /* Sammenligning som tåler at Home Assistant stokker om nøkkelrekkefølgen.
       `{a:1,b:2}` og `{b:2,a:1}` er samme konfigurasjon, men ulike strenger — og en
       vanlig JSON-sammenligning ville sagt at noe var endret. */
    _fast(o) {
      if (o === null || typeof o !== "object") return JSON.stringify(o);
      if (Array.isArray(o)) return "[" + o.map((x) => this._fast(x)).join(",") + "]";
      return "{" + Object.keys(o).sort()
        .map((k) => JSON.stringify(k) + ":" + this._fast(o[k])).join(",") + "}";
    }

    setConfig(c) {
      const tekst = this._fast(c || {});

      /* Home Assistant kaller setConfig på nytt etter HVER endring vi sender.
       *
       * Bygget vi editoren om da, lukket «Mål» og «Utseende» seg hver gang man dro i
       * en glidebryter — man måtte åpne seksjonen på nytt for hvert steg.
       *
       * Kommer konfigurasjonen tilbake uendret fra det vi nettopp sendte, er det vårt
       * eget ekko, og da rører vi ingenting. Er den endret utenfra — YAML-fanen, en
       * annen editor — bygger vi som før. */
      /* Redigerer man et kort, skal editoren ALDRI bygges om. Hver tast sender en
         endring, og en ombygging midt i ville lukket redigereren — man måtte åpne den
         på nytt for hver bokstav. */
      if (this._redigerer) { this._c = JSON.parse(JSON.stringify(c || {})); return; }
      if (this._sisteUt === tekst) { this._c = JSON.parse(JSON.stringify(c || {})); return; }

      this._c = JSON.parse(tekst);
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
      /* Fanelista er endret — da SKAL editoren bygges om, ellers står den gamle lista.
         Vi merker likevel ekkoet, så `setConfig` ikke bygger den om en gang til. */
      this._sisteUt = this._fast(this._c);
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
      /* En ombygging fjerner redigereren fra DOM-en; da skal flagget følge med. */
      this._redigerer = null;
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

        /* Fanen utvides der den står, med sitt eget innhold under — i stedet for at
           alt lå i egne seksjoner langt nede på siden. */
        .fanekort { border-radius:14px; background:var(--secondary-background-color);
          overflow:hidden; }
        .fanekort.apen { outline:2px solid var(--primary-color); }
        .fanekort .fane { background:none; border-radius:0; }
        .faneinnhold { padding:0 12px 12px; }
        .kortoverskrift { font-size:14px; font-weight:500; margin:10px 0 6px; }
        .kortrad { display:flex; align-items:center; gap:6px; padding:10px 6px 10px 12px;
          border-radius:12px; background:rgba(128,128,128,.14); margin-bottom:8px; }
        .kortrad .nr { opacity:.5; font-size:13px; min-width:16px; }
        .kortrad .korttype { flex:1; min-width:0; overflow:hidden;
          text-overflow:ellipsis; white-space:nowrap; font-size:14px; }

      </style>
      <h4>Kortet</h4>
      <div class="felt" id="kortform2"></div>
      <h4>Faner</h4>
      <div class="liste">${t.map((x, i) => {
        const kort = x.cards || (x.card ? [x.card] : []);
        const apen = i === v;
        return `
        <div class="fanekort ${apen ? "apen" : ""}">
          <div class="fane">
            <span class="navn" data-velg="${i}">${KI.esc(x.title || "")
              || `<em>uten tittel</em>`}<small>${kort.length} kort</small></span>
            <button class="ikn" data-opp="${i}" ${i === 0 ? "disabled" : ""}
              title="Flytt opp"><ha-icon icon="mdi:arrow-up"></ha-icon></button>
            <button class="ikn" data-ned="${i}" ${i === t.length - 1 ? "disabled" : ""}
              title="Flytt ned"><ha-icon icon="mdi:arrow-down"></ha-icon></button>
            <button class="ikn" data-slett="${i}" ${t.length <= 1 ? "disabled" : ""}
              title="Fjern"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
            <button class="ikn" data-velg="${i}" title="${apen ? "Lukk" : "Åpne"}">
              <ha-icon icon="mdi:chevron-${apen ? "up" : "down"}"></ha-icon></button>
          </div>
          ${apen ? `<div class="faneinnhold">
            <div class="felt" id="faneform"></div>
            <div class="kortliste">
              <div class="kortoverskrift">Kort</div>
              <div id="kort"></div>
            </div>
          </div>` : ""}
        </div>`; }).join("")}</div>
      <button class="legg" data-ny="1">+ Legg til fane</button>`;

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

      /* Kortlista: flytt, rediger og fjern der kortet står. Tidligere lå alle
         kortredigererne utbrettet under hverandre, og med fire kort i en fane fylte de
         hele skjermen. Nå åpnes ett om gangen. */
      this._kortform2(rot.querySelector("#kortform2"));
      const ff = rot.querySelector("#faneform");
      if (ff) this._faneform(ff, t[v] || {});
      const kf = rot.querySelector("#kort");
      if (kf) this._kortform(kf, v);
      this._sistBygd = v;
    }

    /* Fanene som kan velges som startfane, med en «Første fane»-rad øverst for
       den som ikke bryr seg om hvilken det er. */
    _fanevalg() {
      const valg = [{ value: "", label: "Første fane" }];
      this._tabs().forEach((t, i) => {
        const navn = (t && (t.title || t.aria)) || `Fane ${i + 1}`;
        valg.push({ value: String(navn), label: String(navn) });
      });
      return valg;
    }

    /* Verdien skjemaet skal vise: tittelen på fanen `default` peker på. */
    _startvalg() {
      const t = this._tabs();
      const v = this._c.default;
      if (v === undefined || v === null || v === "") return "";
      let i = -1;
      if (typeof v === "number" || /^\d+$/.test(String(v))) i = Number(v);
      else i = t.findIndex((x) => String((x && (x.title || x.aria)) || "").trim().toLowerCase()
        === String(v).trim().toLowerCase());
      const fane = t[i];
      return fane ? String(fane.title || fane.aria || `Fane ${i + 1}`) : "";
    }

    /* Innstillinger for hele kortet, ikke for én fane. */
    _kortform2(vert) {
      if (!vert) return;
      const f = document.createElement("ha-form");
      f.hass = this._h;
      f.data = { align: this._c.align || "midten", tittel: this._c.tittel || "",
        /* fane_hoyde / fane_bredde kan være et tall ELLER et forhåndsvalg (ord).
           Tallfeltet får bare tall; ordet vises i sitt eget nedtrekk. */
        fane_hoyde: hoydeOrd(this._c.fane_hoyde) ? 9 : (this._c.fane_hoyde ?? 9),
        fane_sidepadding: this._c.fane_sidepadding ?? 20,
        fane_bredde: breddeOrd(this._c.fane_bredde) ? 0 : (this._c.fane_bredde ?? 0),
        fane_tekst: this._c.fane_tekst ?? 14,
        hoyde_valg: hoydeOrd(this._c.fane_hoyde) || "standard",
        bredde_valg: breddeOrd(this._c.fane_bredde) || "standard",
        tilpass: this._c.tilpass !== false,
        rad_hoyde: this._c.rad_hoyde ?? 0,
        fane_lik: !!this._c.fane_lik, rad_bredde: this._c.rad_bredde || "",
        tittel_storrelse: this._c.tittel_storrelse || "", gap: this._c.gap ?? 12,
        bg: this._c.bg || "", style: this._c.style || "auto",
        sticky: !!this._c.sticky, dropdown_under: !!this._c.dropdown_under,
        fast_hoyde: !!this._c.fast_hoyde,
        /* Lagres som tittelen på fanen, ikke som nummeret: flytter du om på fanene
           senere, peker et nummer plutselig på en annen. Fanen velges i lista under. */
        default: this._startvalg() };
      /* Alle valgene kortet faktisk leser, ikke bare to. Feltene er gruppert som i
         simple-tabs' editor: utseende først, så oppførsel — det er den rekkefølgen man
         leter i når man skal endre noe. */
      f.schema = [
        { name: "utseende", type: "expandable", flatten: true, icon: "mdi:palette",
          schema: [
            { name: "align", selector: { select: { mode: "dropdown", options: [
              { value: "venstre", label: "Venstre" },
              { value: "midten", label: "Midten" },
              { value: "hoyre", label: "Høyre" }] } } },
            { name: "tittel", selector: { text: {} } },
            { name: "tittel_storrelse", selector: { text: {} } },
            { name: "gap", selector: { number: { min: 0, max: 48, mode: "slider" } } },
            { name: "bg", selector: { text: {} } },
          ] },
        { name: "mal", type: "expandable", flatten: true, icon: "mdi:ruler",
          schema: [
            { name: "hoyde_valg", selector: { select: { mode: "dropdown", options: [
              { value: "standard", label: "Standard (tallene under)" }, { value: "lav", label: "Lav (30 px)" },
              { value: "middels", label: "Middels (38 px)" }, { value: "hoy", label: "Høy (46 px)" },
              { value: "ekstra", label: "Ekstra høy (56 px)" }] } } },
            { name: "bredde_valg", selector: { select: { mode: "dropdown", options: [
              { value: "standard", label: "Standard" }, { value: "kompakt", label: "Kompakt" },
              { value: "full", label: "Full bredde" }] } } },
            { name: "rad_hoyde", selector: { number: { min: 0, max: 72, mode: "slider" } } },
            { name: "fane_hoyde", selector: { number: { min: 0, max: 28, mode: "slider" } } },
            { name: "fane_sidepadding", selector: { number: { min: 4, max: 60, mode: "slider" } } },
            { name: "fane_bredde", selector: { number: { min: 0, max: 240, mode: "slider" } } },
            { name: "fane_tekst", selector: { number: { min: 10, max: 24, mode: "slider" } } },
            { name: "fane_lik", selector: { boolean: {} } },
            { name: "rad_bredde", selector: { text: {} } },
          ] },
        { name: "oppforsel", type: "expandable", flatten: true, icon: "mdi:cog-outline",
          schema: [
            { name: "style", selector: { select: { mode: "dropdown", options: [
              { value: "auto", label: "Automatisk" },
              { value: "pills", label: "Piller" },
              { value: "scroll", label: "Rullbar rad" },
              { value: "dropdown", label: "Nedtrekksmeny" }] } } },
            { name: "default", selector: { select: { mode: "dropdown", options: this._fanevalg() } } },
            { name: "sticky", selector: { boolean: {} } },
            { name: "fast_hoyde", selector: { boolean: {} } },
            { name: "dropdown_under", selector: { boolean: {} } },
            { name: "tilpass", selector: { boolean: {} } },
          ] },
      ];
      const navn = { utseende: "Utseende", oppforsel: "Oppførsel", mal: "Mål",
        rad_hoyde: "Høyde på fanene (px, 0 = følg innholdet)",
        fane_hoyde: "Luft over og under teksten (px)",
        fane_sidepadding: "Bredde på sidene (px)",
        fane_bredde: "Minste fanebredde (px, 0 = auto)",
        fane_tekst: "Tekststørrelse (px)",
        fane_lik: "Like brede faner",
        rad_bredde: "Bredde på rada (px, % eller «full»)",
        align: "Plassering av fanerada", tittel: "Tittel til venstre (valgfri)",
        tittel_storrelse: "Tittelstørrelse (f.eks. 1.4em)",
        gap: "Avstand under rada (px)", bg: "Bakgrunn når rada er festet",
        style: "Form", sticky: "Fest rada øverst ved rulling",
        default: "Fanen kortet åpner på",
        fast_hoyde: "Lås høyden til den høyeste fanen",
        dropdown_under: "Nedtrekk under rada i stedet for over",
        hoyde_valg: "Fanehøyde (ferdig valg – overstyrer tallene)",
        bredde_valg: "Fanebredde (ferdig valg)",
        tilpass: "Langt trykk på en fane åpner «Tilpass faner» (per bruker)" };
      f.computeLabel = (x) => navn[x.name] || x.name;
      f.addEventListener("value-changed", (e) => {
        const inn = { ...e.detail.value };
        const hv = inn.hoyde_valg, bv = inn.bredde_valg, tp = inn.tilpass;
        delete inn.hoyde_valg; delete inn.bredde_valg; delete inn.tilpass;
        Object.assign(this._c, inn);
        /* Et forhåndsvalg vinner over tallfeltet, og skrives som ordet. «Standard»
           betyr tallene — da brukes det som står i tallfeltet (og standardtallet
           ryddes bort under, som før). */
        if (hv && hv !== "standard") this._c.fane_hoyde = hv;
        if (bv && bv !== "standard") this._c.fane_bredde = bv;
        if (tp === false) this._c.tilpass = false; else delete this._c.tilpass;
        /* Tomme og standardverdier ut av YAML-en. Ellers står `bg: ""` og
           `sticky: false` igjen og ser ut som noe man har valgt. */
        for (const k of ["tittel", "tittel_storrelse", "bg", "default"]) {
          if (!this._c[k]) delete this._c[k];
        }
        for (const k of ["sticky", "dropdown_under", "fast_hoyde"]) {
          if (!this._c[k]) delete this._c[k];
        }
        if (this._c.style === "auto") delete this._c.style;
        if (this._c.gap === 12 || this._c.gap === undefined) delete this._c.gap;
        /* Målene skrives bare når de avviker fra det kortet gjør selv. */
        if (this._c.fane_hoyde === 9) delete this._c.fane_hoyde;
        if (!this._c.rad_hoyde) delete this._c.rad_hoyde;
        if (this._c.fane_sidepadding === 20) delete this._c.fane_sidepadding;
        if (!this._c.fane_bredde) delete this._c.fane_bredde;
        if (this._c.fane_tekst === 14) delete this._c.fane_tekst;
        if (!this._c.fane_lik) delete this._c.fane_lik;
        if (!this._c.rad_bredde) delete this._c.rad_bredde;

        /* Skjemaet får verdiene tilbake. Vi sletter standardverdier fra
           konfigurasjonen, og uten dette ville feltene stått igjen med det brukeren
           skrev mens `data` sa noe annet — en divergens som før eller siden viser seg
           som et felt som spretter tilbake. */
        f.data = { ...e.detail.value };
        this._send();
      });
      (this._underEl = this._underEl || []).push(f);
      vert.appendChild(f);
    }

    /* Ett sted som sender endringen ut, og som husker hva vi sendte — så `setConfig`
       kan kjenne igjen sitt eget ekko. */
    _send() {
      this._sisteUt = this._fast(this._c);
      KI.fire(this, "config-changed", { config: this._c });
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
        this._send();
      });
      vert.appendChild(f);
    }

    /* Ett kort per fane, redigert med Home Assistants egen kortredigerer.
     *
     * Tidligere hadde editoren sin egen liste med opp, ned, rediger og slett per kort.
     * Det var å bygge om igjen noe HA allerede gjør bedre: legger du et
     * `vertical-stack` i fanen, får du HAs kortvelger, dra-og-slipp og forhåndsvisning
     * — alt vi ellers måtte etterligne.
     *
     * Kortet støtter fortsatt `cards:` som liste i YAML. Editoren pakker den inn i et
     * vertical-stack når du redigerer, og sier fra at den gjør det.
     */
    /* Ett kort per fane, listet som i Home Assistants egne stabel-editorer.
     *
     * Blyanten åpner HAs kortdialog i fullskjerm i stedet for å brette editoren ut
     * inne i vår. Det gir forhåndsvisning ved siden av, «Vis koderedigering», og den
     * samme flyten man kjenner fra resten av HA.
     *
     * Dialogen er intern i frontenden og kan endre seg. Derfor faller vi tilbake på
     * den innebygde editoren hvis den ikke lar seg åpne — da mister man dialogen,
     * ikke muligheten til å redigere.
     */
    _kortform(vert, i) {
      const fane = this._tabs()[i] || {};
      const liste = fane.cards || [];
      const kort = fane.card
        || (liste.length === 1 ? liste[0]
          : liste.length ? { type: "vertical-stack", cards: liste } : null);

      const lagre = (ny) => {
        this._tabs()[i].card = ny;
        delete this._tabs()[i].cards;
        this._send();
        this._r();
      };

      if (!kort) {
        const legg = document.createElement("button");
        legg.className = "legg";
        legg.textContent = "+ Legg til kort";
        legg.addEventListener("click", () =>
          lagre({ type: "vertical-stack", cards: [] }));
        vert.appendChild(legg);
        return;
      }

      if (liste.length > 1) {
        const merk = document.createElement("p");
        merk.className = "merk";
        merk.textContent = "Fanen har flere kort fra YAML. De vises her som ett "
          + "vertical-stack, og lagres slik når du endrer noe.";
        vert.appendChild(merk);
      }

      const rad = document.createElement("div");
      rad.className = "kortrad";
      rad.innerHTML = `<span class="nr">1</span>
        <span class="korttype">${KI.esc(this._korttype(kort))}</span>`;

      const blyant = document.createElement("button");
      blyant.className = "ikn";
      blyant.title = "Rediger kortet";
      blyant.innerHTML = `<ha-icon icon="mdi:pencil"></ha-icon>`;
      blyant.addEventListener("click", () => this._apneDialog(kort, lagre, vert, i));
      rad.appendChild(blyant);

      const slett = document.createElement("button");
      slett.className = "ikn";
      slett.title = "Fjern kortet";
      slett.innerHTML = `<ha-icon icon="mdi:delete-outline"></ha-icon>`;
      slett.addEventListener("click", () => {
        delete this._tabs()[i].card;
        delete this._tabs()[i].cards;
        this._send();
        this._r();
      });
      rad.appendChild(slett);

      vert.appendChild(rad);
    }

    /* Lesbart navn på et kort: `custom:ki-varsling-card` blir «Ki varsling card»,
       slik HA selv skriver dem. */
    _korttype(k) {
      const t = String((k && k.type) || "ukjent").replace(/^custom:/, "");
      const ord = t.replace(/[-_]/g, " ").trim();
      return ord.charAt(0).toUpperCase() + ord.slice(1);
    }

    /* Bretter ut Home Assistants kortredigerer under rada.
     *
     * Jeg forsøkte `hui-dialog-edit-card` i tre utgaver. Dialogen ÅPNET seg, men det
     * den sendte tilbake ved lagring kom aldri fram — API-et er internt og har byttet
     * form mellom versjoner, og jeg klarte ikke å treffe det uten å gjette.
     *
     * `hui-card-element-editor` er den samme redigereren HA bruker inne i sine egne
     * stabel-editorer. Den sender `config-changed` direkte til oss, uten mellomledd
     * som kan endre seg. Mindre pen enn en fullskjermdialog — men den lagrer.
     */
    _apneDialog(kort, lagre, vert, i) {
      if (this._redigerer) {
        this._redigerer.remove();
        this._redigerer = null;
        return;
      }
      if (!customElements.get("hui-card-element-editor")) {
        const merk = document.createElement("p");
        merk.className = "merk";
        merk.textContent = "Kortredigereren er ikke tilgjengelig her. "
          + "Bruk YAML-visningen med de tre prikkene øverst.";
        vert.appendChild(merk);
        return;
      }
      const e = document.createElement("hui-card-element-editor");
      e.hass = this._h;
      e.lovelace = this._lovelace || { config: { views: [] }, editMode: true };
      e.value = kort;
      e.addEventListener("config-changed", (ev) => {
        ev.stopPropagation();
        /* Vi lagrer, men tegner IKKE om: gjør vi det, byttes editoren ut mens man
           holder på i den, og markøren og åpne seksjoner går tapt. */
        this._tabs()[i].card = ev.detail.config;
        delete this._tabs()[i].cards;
        this._send();
      });
      (this._underEl = this._underEl || []).push(e);
      this._redigerer = e;
      vert.appendChild(e);
    }



  }
  if (!customElements.get("ki-tabs-card-editor")) {
    customElements.define("ki-tabs-card-editor", SkTabsEditor);
  }

  customElements.define("ki-tabs-card", SkTabsCard);
  KI.register("ki-tabs-card", "KI Tabs", "Faner som piller, rullbar rad eller nedtrekksmeny, med kort i hver fane");
})(window.KI);

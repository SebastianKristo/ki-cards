/* ki-container-card – mange containere, gruppert og søkbare.
 *
 * Erstatter en flat liste med 43 brytere. Containerne grupperes etter funksjon, du ser
 * hvor mange som kjører i hver gruppe, og du kan søke når du vet navnet.
 *
 * type: custom:ki-container-card
 * prefiks: switch.d_day_darling_container_
 * kjorer: sensor.d_day_darling_docker_total_cpu    # valgfri, bare til toppen
 * oppdateringer: sensor.d_day_darling_container_updates_available
 * grupper:
 *   - navn: Media
 *     ikon: mdi:play-circle-outline
 *     containere: [binhex_plexpass, binhex_jellyfin, ...]
 * resten: Annet          # gruppa som tar det som ikke er nevnt (false skjuler dem)
 * navn_kort: {binhex_plexpass: Plex}   # penere navn enn entitets-id-en
 */
const KI_CONT_VERSJON = "1.0.0";

const KI_CONT_STIL = `
  :host { display:block; max-width:100%; overflow-x:clip; --myk:cubic-bezier(.2,.8,.2,1); }
  *, *::before, *::after { box-sizing:border-box; min-width:0; }
  .kort { display:grid; gap:8px; color:var(--gray1000); }

  /* ---- toppen: hvor mange kjører, og søk ---- */
  .topp { background:var(--gray200); border-radius:24px; padding:14px 16px;
    display:grid; gap:12px; }
  .tall { display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
  .tall b { font-size:30px; font-weight:600; letter-spacing:-.03em; line-height:1;
    font-variant-numeric:tabular-nums; }
  .tall span { font-size:13px; opacity:.6; }
  .tall .oppd { font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:999px;
    background:var(--orange,#f0a952); color:var(--black,#1b1b1b); }
  .sok { display:flex; align-items:center; gap:10px; background:var(--gray100);
    border-radius:75px; padding:0 14px; height:42px; --mdc-icon-size:19px; }
  .sok input { flex:1; min-width:0; border:0; background:none; color:var(--gray1000);
    font:inherit; font-size:14.5px; outline:none; }
  .sok input::placeholder { color:var(--gray1000); opacity:.45; }
  .sok button { border:0; background:none; color:var(--gray1000); opacity:.5;
    cursor:pointer; display:flex; padding:0; }

  /* ---- gruppene ---- */
  .gruppe { display:grid; gap:6px; }
  .ghode { display:flex; align-items:center; gap:10px; padding:10px 6px 2px;
    cursor:pointer; --mdc-icon-size:18px; }
  .ghode .gn { flex:1; min-width:0; font-size:14px; font-weight:600;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ghode .gt { font-size:12px; opacity:.55; font-variant-numeric:tabular-nums; }
  .ghode ha-icon.pil { opacity:.5; transition:transform .2s var(--myk); }
  .gruppe.lukket .ghode ha-icon.pil { transform:rotate(-90deg); }
  .gruppe.lukket .rader { display:none; }
  .rader { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; }

  .rad { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:18px;
    background:var(--gray200); width:100%; text-align:left; cursor:pointer; min-width:0;
    border:0; color:var(--gray1000); font:inherit; transition:background .2s; }
  .rad .prikk { width:9px; height:9px; border-radius:50%; flex:none;
    background:color-mix(in srgb, var(--gray1000) 26%, transparent); }
  .rad.pa .prikk { background:var(--green,#5ad18b); box-shadow:0 0 8px var(--green,#5ad18b); }
  .rad.borte .prikk { background:var(--orange,#f0a952); }
  .rad .n { flex:1; min-width:0; font-size:13.5px; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap; }
  .rad.pa .n { font-weight:600; }
  .rad .oppd { width:7px; height:7px; border-radius:50%; flex:none;
    background:var(--orange,#f0a952); }
  .rad:active { transform:scale(.985); }

  .tom { font-size:13.5px; opacity:.65; padding:14px 16px; line-height:1.55;
    background:var(--gray200); border-radius:24px; }
  .tom code { font-size:12.5px; }
  @media (prefers-reduced-motion: reduce) { .rad, .ghode ha-icon.pil { transition:none; } }
`;

const kiCoEsc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* «binhex_official_metube» blir «Binhex official metube» når du ikke har gitt det navn */
const kiCoNavn = (nokkel) => String(nokkel).replace(/[_-]+/g, " ")
  .replace(/^./, (c) => c.toUpperCase());

class KiContainerCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._lukket = {}; this._sok = ""; }
  static getStubConfig() { return { prefiks: "switch.d_day_darling_container_" }; }
  getCardSize() { return 12; }

  setConfig(c) {
    if (!c || !c.prefiks) throw new Error("ki-container-card: 'prefiks' må settes");
    this._c = { resten: "Annet", grupper: [], navn_kort: {}, ...c };
  }

  set hass(h) {
    const g = this._h; this._h = h;
    if (!this._c) return;
    const sig = JSON.stringify(this._alle().map((x) => [x.nokkel, x.tilstand, x.oppdatering]));
    if (sig !== this._sig) { this._sig = sig; this._tegn(); }
    else if (!g) this._tegn();
  }

  /* Alle containere som finnes, funnet ut fra prefikset. Ingen liste å vedlikeholde:
     starter du en ny container på Unraid, er den her ved neste oppdatering. */
  _alle() {
    if (!this._h) return [];
    const c = this._c;
    const ut = [];
    for (const id of Object.keys(this._h.states)) {
      if (!id.startsWith(c.prefiks)) continue;
      const nokkel = id.slice(c.prefiks.length);
      const st = this._h.states[id];
      // oppdateringsentiteten heter det samme med _update bak
      const oppd = this._h.states[`update.${id.split(".")[1]}_update`]
        || this._h.states[id.replace(/^switch\./, "update.") + "_update"];
      ut.push({
        id, nokkel,
        navn: c.navn_kort[nokkel] || (st.attributes && st.attributes.friendly_name
          && !/^D-Day/.test(st.attributes.friendly_name) ? st.attributes.friendly_name
          : kiCoNavn(nokkel)),
        tilstand: st.state,
        oppdatering: !!(oppd && oppd.state === "on"),
      });
    }
    return ut.sort((a, b) => a.navn.localeCompare(b.navn, "nb"));
  }

  _grupper() {
    const c = this._c;
    const alle = this._alle();
    const sok = this._sok.trim().toLowerCase();
    const treff = (x) => !sok || x.navn.toLowerCase().includes(sok) || x.nokkel.toLowerCase().includes(sok);

    // Søker du, er gruppene i veien: da vises treffene i én liste
    if (sok) {
      const funnet = alle.filter(treff);
      // Ingen treff: returner tom liste, ellers står det et gruppehode med «0/0» og
      // «ingen treff»-meldingen dukker aldri opp.
      if (!funnet.length) return [];
      return [{ navn: `Treff på «${this._sok.trim()}»`, ikon: "mdi:magnify",
        id: "__sok", containere: funnet, apen: true }];
    }

    const brukt = new Set();
    const ut = [];
    for (const [i, g] of (c.grupper || []).entries()) {
      const liste = [];
      for (const n of (g.containere || [])) {
        const x = alle.find((y) => y.nokkel === n);
        if (x) { liste.push(x); brukt.add(n); }
      }
      if (liste.length) {
        ut.push({ navn: g.navn || `Gruppe ${i + 1}`, ikon: g.ikon || "mdi:folder-outline",
          id: `g${i}`, containere: liste });
      }
    }
    if (c.resten !== false) {
      const rest = alle.filter((x) => !brukt.has(x.nokkel));
      if (rest.length) {
        ut.push({ navn: c.resten || "Annet", ikon: "mdi:dots-horizontal",
          id: "__rest", containere: rest });
      }
    }
    return ut;
  }

  _tegn() {
    const c = this._c;
    const alle = this._alle();
    if (!alle.length) {
      this.shadowRoot.innerHTML = `<style>${KI_CONT_STIL}</style>
        <div class="kort"><div class="tom">
          Finner ingen containere med prefikset <code>${kiCoEsc(c.prefiks)}</code>.
          Sjekk hva bryterne dine faktisk heter i Utviklerverktøy.
        </div></div>`;
      return;
    }

    const paa = alle.filter((x) => x.tilstand === "on").length;
    const borte = alle.filter((x) => ["unavailable", "unknown"].includes(x.tilstand)).length;
    const oppd = alle.filter((x) => x.oppdatering).length;
    /* To kilder til «hvor mange oppdateringer»: update-entitetene vi finner selv, og
       Unraids egen teller. De er ikke alltid enige — ikke alle containere har en
       update-entitet — så vi viser den høyeste. Å vise 1 når serveren sier 3 er verre
       enn å vise 3. */
    const oppdSensor = c.oppdateringer && this._h.states[c.oppdateringer];
    const fraSensor = oppdSensor && !isNaN(parseFloat(oppdSensor.state))
      ? parseInt(oppdSensor.state, 10) : 0;
    const oppdTall = Math.max(oppd, fraSensor);

    const grupper = this._grupper();

    this.shadowRoot.innerHTML = `<style>${KI_CONT_STIL}</style>
      <div class="kort">
        <div class="topp">
          <div class="tall">
            <b>${paa}</b><span>av ${alle.length} kjører</span>
            ${borte ? `<span>· ${borte} uten svar</span>` : ""}
            ${oppdTall ? `<span class="oppd">${oppdTall} oppdatering${
              oppdTall === 1 ? "" : "er"}</span>` : ""}
          </div>
          <label class="sok">
            <ha-icon icon="mdi:magnify"></ha-icon>
            <input type="text" placeholder="Søk i ${alle.length} containere"
                   value="${kiCoEsc(this._sok)}" />
            ${this._sok ? `<button data-tom="1" aria-label="Tøm søket">
              <ha-icon icon="mdi:close"></ha-icon></button>` : ""}
          </label>
        </div>

        ${grupper.map((g) => {
          const kj = g.containere.filter((x) => x.tilstand === "on").length;
          const lukket = g.apen ? false : !!this._lukket[g.id];
          return `<div class="gruppe ${lukket ? "lukket" : ""}">
            <div class="ghode" data-gruppe="${kiCoEsc(g.id)}">
              <ha-icon icon="${kiCoEsc(g.ikon)}"></ha-icon>
              <span class="gn">${kiCoEsc(g.navn)}</span>
              <span class="gt">${kj}/${g.containere.length}</span>
              <ha-icon class="pil" icon="mdi:chevron-down"></ha-icon>
            </div>
            <div class="rader">${g.containere.map((x) => `
              <button class="rad ${x.tilstand === "on" ? "pa" : ""} ${
                ["unavailable", "unknown"].includes(x.tilstand) ? "borte" : ""}"
                data-id="${kiCoEsc(x.id)}" title="${kiCoEsc(x.nokkel)}">
                <span class="prikk"></span>
                <span class="n">${kiCoEsc(x.navn)}</span>
                ${x.oppdatering ? `<span class="oppd" title="Ny versjon"></span>` : ""}
              </button>`).join("")}</div>
          </div>`;
        }).join("")}

        ${grupper.length ? "" : `<div class="tom">Ingen treff på «${
          kiCoEsc(this._sok)}».</div>`}
      </div>`;

    const felt = this.shadowRoot.querySelector(".sok input");
    if (felt) {
      felt.addEventListener("input", (e) => {
        this._sok = e.target.value;
        const pos = e.target.selectionStart;
        this._tegn();
        const nytt = this.shadowRoot.querySelector(".sok input");
        if (nytt) { nytt.focus(); try { nytt.setSelectionRange(pos, pos); } catch (err) { /* ok */ } }
      });
    }
    const tom = this.shadowRoot.querySelector("[data-tom]");
    if (tom) tom.addEventListener("click", () => { this._sok = ""; this._tegn(); });

    for (const h of this.shadowRoot.querySelectorAll("[data-gruppe]")) {
      h.addEventListener("click", () => {
        const id = h.dataset.gruppe;
        this._lukket[id] = !this._lukket[id];
        this._tegn();
      });
    }
    /* Kort trykk veksler containeren, langt trykk åpner more-info. Å starte og stoppe
       er det man gjør oftest, så det skal være det raskeste. */
    for (const b of this.shadowRoot.querySelectorAll("[data-id]")) {
      let lang = false, t = null;
      const id = b.dataset.id;
      b.addEventListener("pointerdown", () => {
        lang = false;
        t = setTimeout(() => {
          lang = true;
          this.dispatchEvent(new CustomEvent("hass-more-info",
            { detail: { entityId: id }, bubbles: true, composed: true }));
        }, 500);
      });
      const slipp = () => clearTimeout(t);
      for (const n of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(n, slipp);
      b.addEventListener("click", () => {
        if (lang) { lang = false; return; }
        this._h.callService("switch", "toggle", { entity_id: id });
      });
    }
  }
}

customElements.define("ki-container-card", KiContainerCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-container-card"))
  window.customCards.push({ type: "ki-container-card", name: "KI Containere",
    description: "Docker-containere gruppert, med søk og status", preview: true });

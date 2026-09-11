/* ki-porter-card – switch-porter med aktivitet, av/på eller strømsykling.
 * Del av ki-cards-bundelen.
 *
 * type: custom:ki-porter-card
 * tittel: Porter
 * prefiks: button.havets_24_poe_250w_port_       # + nummer + etterfiks
 * etterfiks: _power_cycle
 * antall: 24
 * handling: trykk        # trykk (button.press) | veksle (switch)
 * kolonner: 6
 * porter: [{navn: P1, entity: switch.x}]        # eller eksplisitt liste
 */
const KI_PORTER_VERSJON = "1.0.0";

const KI_PORTER_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); }
  * { box-sizing:border-box; }
  .kort { border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); color:var(--gray1000); padding:14px; }
  .tit { font-size:13px; font-weight:600; opacity:.55; padding:0 4px 10px; }
  .rutenett { display:grid; gap:6px; }
  .port { position:relative; border:0; background:var(--gray100); color:var(--gray1000); font:inherit; font-size:12px; font-weight:600;
    border-radius:12px; padding:12px 0 10px; cursor:pointer; overflow:hidden;
    transition:transform .12s var(--fjaer), background .25s, color .25s; }
  .port:active { transform:scale(.92); }
  .port.pa { background:var(--blue,#6ec6ff); color:var(--black,#000); }
  .port i { display:block; width:6px; height:6px; border-radius:50%; margin:5px auto 0; background:currentColor; opacity:.25; }
  .port.pa i { opacity:1; animation:portblink 1.8s steps(1,end) infinite; }
  @keyframes portblink { 0%,65% { opacity:1; } 66%,100% { opacity:.25; } }
  .port.kjorer::after { content:""; position:absolute; inset:0; border-radius:12px;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); animation:portsveip .9s ease-out 2; }
  @keyframes portsveip { from { transform:translateX(-100%); } to { transform:translateX(100%); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiPorterEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiPorterCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { antall: 8, prefiks: "switch.port_" }; }
  getCardSize() { return 3; }
  setConfig(c) {
    if (!c || (!c.porter && !c.prefiks)) throw new Error("Sett porter: eller prefiks:");
    this._c = { kolonner: 6, handling: "trykk", etterfiks: "", ...c };
    this._porter = c.porter || Array.from({ length: c.antall || 8 }, (_, i) =>
      ({ navn: "P" + (i + 1), entity: `${c.prefiks}${i + 1}${this._c.etterfiks}` }));
    this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; if (!this._c) return;
    if (!g || !this._bygget || this._porter.some((p) => g.states[p.entity] !== h.states[p.entity])) this._oppdater();
  }
  _bygg() {
    const c = this._c;
    this.shadowRoot.innerHTML = `<style>${KI_PORTER_STIL}</style>
      <div class="kort">
        ${c.tittel ? `<div class="tit">${kiPorterEsc(c.tittel)}</div>` : ""}
        <div class="rutenett" style="grid-template-columns:repeat(${c.kolonner}, minmax(0,1fr))">
          ${this._porter.map((p, i) => `<button class="port" data-p="${i}" title="${kiPorterEsc(p.entity)}">${kiPorterEsc(p.navn)}<i></i></button>`).join("")}
        </div>
      </div>`;
    this.shadowRoot.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
      const p = this._porter[+b.dataset.p], dom = p.entity.split(".")[0];
      if (navigator.vibrate) navigator.vibrate(8);
      if (c.bekreft && !window.confirm(c.bekreft.replace("{port}", p.navn))) return;
      if (dom === "button") {
        this._h.callService("button", "press", { entity_id: p.entity });
        b.classList.remove("kjorer"); void b.offsetWidth; b.classList.add("kjorer");
        setTimeout(() => b.classList.remove("kjorer"), 1900);
      } else this._h.callService("homeassistant", "toggle", { entity_id: p.entity });
    }));
    this._bygget = true;
  }
  _oppdater() {
    if (!this._c || !this._h) return;
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot;
    this._porter.forEach((p, i) => {
      const el = r.querySelector(`[data-p="${i}"]`); if (!el) return;
      const s = this._h.states[p.entity];
      el.classList.toggle("pa", !!s && s.state === "on");
      el.style.opacity = s ? "" : ".35";
    });
  }
}
if (!customElements.get("ki-porter-card")) customElements.define("ki-porter-card", KiPorterCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-porter-card")) window.customCards.push({ type: "ki-porter-card", name: "KI Porter", description: "Switch-porter med aktivitet, av/på eller strømsykling", preview: true });

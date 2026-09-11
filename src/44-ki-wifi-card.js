/* ki-wifi-card – SSID med QR-kode, klienter og av/på. Del av ki-cards-bundelen.
 *
 * type: custom:ki-wifi-card
 * navn: Utehavet
 * qr: image.utehavet_qr_kode
 * klienter: sensor.utehavet_klienter
 * bryter: switch.utehavet_aktivert
 */
const KI_WIFI_VERSJON = "1.0.0";

const KI_WIFI_STIL = `
  :host { display:block; --fjaer:cubic-bezier(.3,1.35,.5,1); --myk:cubic-bezier(.2,.8,.2,1); }
  * { box-sizing:border-box; }
  .kort { position:relative; border-radius:var(--ha-card-border-radius,24px); background:var(--gray200); color:var(--gray1000);
    overflow:hidden; isolation:isolate; padding:18px; display:grid; gap:14px; grid-template-columns:1fr min-content;
    grid-template-areas:"topp qr" "info qr"; align-items:start; transition:background .5s var(--myk); }
  .kort.av { background:var(--gray200); }
  .topp { grid-area:topp; display:flex; align-items:center; gap:10px; min-width:0; }
  .topp h3 { margin:0; font-size:17px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .status { font-size:12px; font-weight:600; padding:3px 10px; border-radius:999px; background:var(--gray100); flex:none; }
  .kort.pa .status { background:var(--green,#7ee081); color:var(--black,#000); }
  .kort.av .status { background:var(--red,#e8657a); color:#fff; }
  .info { grid-area:info; display:flex; align-items:flex-end; gap:16px; }
  .klient { display:flex; align-items:baseline; gap:6px; }
  .klient .tall { font-size:2.2em; line-height:1em; font-weight:300; font-variant-numeric:tabular-nums; }
  .klient .lab { font-size:13px; opacity:.6; }
  .bryt { position:relative; width:50px; height:30px; border-radius:15px; background:var(--gray100); cursor:pointer; flex:none;
    transition:background .35s; }
  .kort.pa .bryt { background:var(--green,#7ee081); }
  .bryt i { position:absolute; top:5px; left:5px; width:20px; height:20px; border-radius:50%; background:var(--gray1000);
    transition:transform .4s var(--fjaer); }
  .kort.pa .bryt i { transform:translateX(20px); background:var(--black,#000); }
  .qr { grid-area:qr; position:relative; width:104px; height:104px; border-radius:16px; overflow:hidden; background:#fff;
    display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .2s var(--fjaer), filter .4s; }
  .qr:active { transform:scale(.96); }
  .qr img { width:94%; height:94%; object-fit:contain; }
  .kort.av .qr { filter:grayscale(1) opacity(.45); }
  .qr .glans { position:absolute; top:-60%; left:-120%; width:55%; height:220%; transform:rotate(18deg);
    background:linear-gradient(to right, rgba(255,255,255,0), rgba(120,190,255,.55), rgba(255,255,255,0)); }
  .kort.pa .qr .glans { animation:qrsveip 4.5s ease-in-out 1s infinite; }
  @keyframes qrsveip { 0% { left:-120%; } 55%,100% { left:150%; } }
  .ringer { position:absolute; left:-40px; bottom:-70px; width:220px; height:220px; pointer-events:none; z-index:-1; }
  .ringer i { position:absolute; inset:0; border-radius:50%; border:2px solid var(--green,#7ee081); opacity:0; }
  .kort.pa .ringer i { animation:wifiut 3.4s ease-out infinite; }
  .kort.pa .ringer i:nth-child(2) { animation-delay:1.1s; } .kort.pa .ringer i:nth-child(3) { animation-delay:2.2s; }
  @keyframes wifiut { 0% { transform:scale(.25); opacity:.35; } 100% { transform:scale(1); opacity:0; } }
  .feil { padding:16px; border-radius:22px; background:var(--gray200); font-size:14px; opacity:.8; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; } }
`;

const kiWifiEsc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

class KiWifiCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static getStubConfig() { return { navn: "SSID" }; }
  getCardSize() { return 3; }
  setConfig(c) {
    if (!c) throw new Error("Mangler konfigurasjon");
    this._c = { navn: "Wi-Fi", ...c }; this._bygget = false; this._oppdater();
  }
  set hass(h) {
    const g = this._h; this._h = h; const c = this._c; if (!c) return;
    const ids = [c.qr, c.klienter, c.bryter].filter(Boolean);
    if (!g || !this._bygget || ids.some((id) => g.states[id] !== h.states[id])) this._oppdater();
  }
  _st(id) { return id && this._h ? this._h.states[id] : undefined; }
  _mer(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })); }

  _bygg() {
    const c = this._c;
    this.shadowRoot.innerHTML = `<style>${KI_WIFI_STIL}</style>
      <div class="kort">
        <div class="ringer"><i></i><i></i><i></i></div>
        <div class="topp"><h3>${kiWifiEsc(c.navn)}</h3><span class="status">–</span></div>
        <div class="info">
          <div class="klient"><span class="tall">–</span><span class="lab">klienter</span></div>
          ${c.bryter ? `<div class="bryt" role="switch" tabindex="0" aria-label="Slå ${kiWifiEsc(c.navn)} av eller på"><i></i></div>` : ""}
        </div>
        <div class="qr" role="button" tabindex="0" aria-label="QR-kode for ${kiWifiEsc(c.navn)}"><div class="glans"></div></div>
      </div>`;
    const r = this.shadowRoot;
    r.querySelector(".qr").addEventListener("click", () => this._mer(c.qr));
    const b = r.querySelector(".bryt");
    if (b) {
      const veksle = () => { if (navigator.vibrate) navigator.vibrate(10); this._h.callService("homeassistant", "toggle", { entity_id: c.bryter }); };
      b.addEventListener("click", veksle);
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); veksle(); } });
    }
    this._bygget = true;
  }
  _oppdater() {
    const c = this._c, h = this._h; if (!c || !h) return;
    if (!this._bygget) this._bygg();
    const r = this.shadowRoot, kort = r.querySelector(".kort");
    const b = this._st(c.bryter), pa = c.bryter ? !!b && b.state === "on" : true;
    kort.classList.toggle("pa", pa); kort.classList.toggle("av", !pa);
    r.querySelector(".status").textContent = c.bryter ? (pa ? "Aktivert" : "Av") : "SSID";
    const k = this._st(c.klienter);
    r.querySelector(".tall").textContent = k && !["unavailable", "unknown"].includes(k.state) ? k.state : "–";
    const bilde = this._st(c.qr) && this._st(c.qr).attributes.entity_picture;
    const qr = r.querySelector(".qr");
    if (bilde && qr.dataset.bilde !== bilde) {
      qr.dataset.bilde = bilde;
      qr.innerHTML = `<div class="glans"></div><img src="${bilde}" alt="QR-kode">`;
    }
    const br = r.querySelector(".bryt"); if (br) br.setAttribute("aria-checked", String(pa));
  }
}
if (!customElements.get("ki-wifi-card")) customElements.define("ki-wifi-card", KiWifiCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((k) => k.type === "ki-wifi-card")) window.customCards.push({ type: "ki-wifi-card", name: "KI Wi-Fi", description: "SSID med QR-kode, klienter og av/på", preview: true });

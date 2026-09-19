/* Bygger HVERT kort i bundelen med en minimal hass, og melder fra om noe kaster.
 *
 * `verifiser-styles.js` leser `styles`-getteren, men mange kort bygger CSS inne i
 * `_build` eller `_tegn`. En backtick i en kommentar der lukker mal-strengen, og kortet
 * kaster først når det faktisk tegnes — som i dashbordet, ikke i byggeloggen.
 *
 * Dette skrittet fanger nettopp det: et kort som ikke kan settes opp og tegnes.
 */
const { parseHTML } = require("/home/claude/node_modules/linkedom");
const fs = require("fs");
const fil = process.argv[2];

const dom = parseHTML("<!doctype html><html><body></body></html>");
global.document = dom.document; global.HTMLElement = dom.HTMLElement;
global.CustomEvent = dom.CustomEvent; global.Event = dom.Event;
global.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
global.requestAnimationFrame = () => {};
global.setInterval = () => 1; global.clearInterval = () => {};
/* Kortene får en synkron setTimeout så oppstart ikke henger, men vi tar vare på den
   ekte først: ventinga til slutt MÅ være ekte, ellers kjører den før promise-
   avvisningene er levert, og sjekken melder «ok» på en ødelagt bundel. */
const ekteTimeout = setTimeout;
global.setTimeout = (f) => { try { f(); } catch (e) {} return 1; };
global.location = { hash: "" };
global.navigator = { language: "nb" };

const html = (s, ...v) => String.raw({ raw: s }, ...v);
const css = (s, ...v) => ({ cssText: String.raw({ raw: s }, ...v), toString() { return this.cssText; } });
class Lit extends dom.HTMLElement { requestUpdate() {} static get properties() { return {}; } }
Lit.prototype.html = html; Lit.prototype.css = css;

const reg = { "ha-panel-lovelace": class extends Lit {}, "hui-view": class extends Lit {} };
global.customElements = { define: (n, c) => { reg[n] = c; }, get: (n) => reg[n],
  whenDefined: () => Promise.resolve() };
const stille = () => {};
const ekte = console.error;
global.console = { log: stille, warn: stille, info: stille, debug: stille, error: stille };
global.window = { customCards: [], addEventListener() {}, dispatchEvent() {},
  location: { hash: "" }, localStorage: { getItem: () => null, setItem() {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  loadCardHelpers: async () => ({ createCardElement: () => dom.document.createElement("div") }) };

try { new Function(fs.readFileSync(fil, "utf8"))(); }
catch (e) { global.console = { ...console, error: ekte }; ekte("  bundelen kastet: " + e.message); process.exit(1); }

const hass = { states: {}, entities: {}, devices: {}, callService() {}, callWS: async () => ({}),
  formatEntityState: (s) => (s && s.state) || "", localize: (k) => k, language: "nb" };

const problemer = [];
let antall = 0;
const tikk = () => new Promise((r) => ekteTimeout(r, 0));

/* `_build` er asynkron i flere kort, så en mal-feil kommer som en ubehandlet
   promise-avvisning og ikke i try/catch-en under. Vi fanger dem her i stedet. */
let naa = "";
process.on("unhandledRejection", (e) => {
  const m = (e && e.message) || String(e);
  if (/\)\.[\w-]+ is not a function/.test(m) || /Unexpected (token|identifier)/.test(m)) {
    problemer.push(`${naa}: ${m}`);
  }
});
(async () => {
for (const [navn, K] of Object.entries(reg)) {
  if (!navn.startsWith("ki-") && !navn.startsWith("family")) continue;
  if (navn.endsWith("-editor")) continue;
  if (typeof K !== "function" || typeof K.getStubConfig !== "function") continue;
  /* Kort som bygger inn ANDRE kort trenger hele kortmaskineriet, og det har vi ikke
     her. De hoppes over i stedet for å melde feil vi ikke kan gjøre noe med. */
  if (["ki-sikkerhet-card"].includes(navn)) continue;
  naa = navn;
  try {
    const el = dom.document.createElement("div");
    Object.setPrototypeOf(el, K.prototype);
    const sr = dom.document.createElement("div");
    /* linkedom gir ikke getElementById på et vanlig element, men HA gir det på en
       shadow root. Uten shimmen melder riggen feil på kort som er helt i orden. */
    sr.getElementById = (id) => sr.querySelector("#" + id);
    el.attachShadow = () => sr;
    Object.defineProperty(el, "shadowRoot", { get: () => sr, configurable: true });
    el.setConfig(JSON.parse(JSON.stringify(K.getStubConfig())));
    el.hass = hass;
    antall++;
    /* Ekte tikk etter HVERT kort: da rekker en asynkron byggefeil å bli levert mens
       `naa` fortsatt peker på riktig kort. Uten den fikk feilen navnet til kortet som
       tilfeldigvis ble behandlet da avvisningen kom. */
    await tikk();
  } catch (e) {
    /* Manglende entiteter er forventet her; vi leter etter kort som ikke kan BYGGES. */
    /* Vi leter etter ÉN ting: en mal-streng som er lukket for tidlig. Den gir alltid
       «... is not a function» der navnet til venstre er en CSS-klasse eller et
       HTML-fragment, fordi backticken har gjort resten av malen til et tagget kall.
       Manglende entiteter og annet oppsett kaster andre meldinger, og dem bryr vi oss
       ikke om her. */
    if (/\)\.[\w-]+ is not a function/.test(e.message) || /Unexpected (token|identifier)/.test(e.message)) {
      problemer.push(`${navn}: ${e.message}`);
    }
  }
}
/* Vent én runde på microtasks, så asynkrone byggefeil rekker å bli fanget. */
await tikk();
global.console = { ...console, error: ekte };
if (problemer.length) {
  ekte("  " + problemer.length + " kort kan ikke bygges:");
  for (const p of problemer) ekte("    " + p.slice(0, 140));
  process.exit(1);
}
ekte(`  bygging ok (${antall} kort)`);
})();

/* Laster en bygget ki-cards.js og leser `styles` på hvert registrerte kort.
 *
 * Bakgrunn: en backtick inne i en css-mal — typisk i en kommentar som skriver et
 * klassenavn med backticks rundt — lukker malen midt i. Resultatet er fortsatt gyldig
 * JavaScript, så `node --check` sier ingenting. Feilen viser seg først i frontend, som
 * «css(...).tall is not a function», og kortet registreres aldri.
 */
const { parseHTML } = require("/home/claude/node_modules/linkedom");
const fs = require("fs");
const fil = process.argv[2];
const dom = parseHTML("<!doctype html><html><body></body></html>");
global.document = dom.document; global.HTMLElement = dom.HTMLElement;
global.CustomEvent = dom.CustomEvent; global.Event = dom.Event;
const html = (s, ...v) => String.raw({ raw: s }, ...v);
const css = (s, ...v) => ({ cssText: String.raw({ raw: s }, ...v), toString() { return this.cssText; } });
class Lit extends dom.HTMLElement { requestUpdate() {} static get properties() { return {}; } }
Lit.prototype.html = html; Lit.prototype.css = css;
const reg = { "ha-panel-lovelace": class extends Lit {}, "hui-view": class extends Lit {} };
global.customElements = { define: (n, c) => { reg[n] = c; }, get: (n) => reg[n],
  whenDefined: () => Promise.resolve() };
const feil = [];
const ekte = console.error;
global.console = { log() {}, warn() {}, info() {}, debug() {}, error: (...a) => feil.push(a.map(String).join(" ")) };
global.window = { customCards: [], addEventListener() {}, dispatchEvent() {}, location: { hash: "" },
  localStorage: { getItem: () => null, setItem() {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }) };
global.location = { hash: "" };
global.setInterval = () => 1; global.clearInterval = () => {};
global.setTimeout = (f) => { try { f(); } catch (e) {} return 1; };
global.ResizeObserver = class { observe() {} disconnect() {} };
try { new Function(fs.readFileSync(fil, "utf8"))(); }
catch (e) { feil.push("bundelen kastet: " + e.message); }
const kort = Object.keys(reg).filter((n) => n.startsWith("ki-") || n.startsWith("family"));
const problemer = feil.filter((x) => /feilet|is not a function|kastet/.test(x));
for (const n of kort) {
  try { const s = reg[n].styles; if (s) String(s); }
  catch (e) { problemer.push(`styles feiler på ${n}: ${e.message}`); }
}
global.console = { ...console, error: ekte };
if (problemer.length) {
  ekte("  " + problemer.length + " problem(er):");
  for (const p of problemer.slice(0, 10)) ekte("    " + p.slice(0, 140));
  process.exit(1);
}
ekte(`  styles ok på ${kort.length} kort`);

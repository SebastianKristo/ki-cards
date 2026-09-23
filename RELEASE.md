# ki-cards 5.57.0

## Nytt kort: `ki-basseng-hero-card`

Et animert bassengkort i samme stil som de andre hero-kortene, lagt inn i bundelen som
`src/91-ki-basseng-hero-card.js` — det trenger ikke lenger installeres som egen ressurs.

```yaml
type: custom:ki-basseng-hero-card
varmepumpe: climate.basseng_bassengvarmepumpe
pumpe: switch.bassengpumpe
lys: light.bassenglys
stillemodus: switch.baseng_basengvarmepumpe_stillemodus
ute: sensor.outdoor_meter_temperature
tap_action: { action: navigate, navigation_path: "#badebasseng" }
```

Scenen viser bassenget fra siden:

- vannflaten bølger, og farge og høyde følger vanntemperaturen (fra kaldt til varmt, 18–30 °)
- bobler stiger når sirkulasjonspumpa går
- varmepumpa snurrer og blåser varme bølger når den varmer — saktere i stillemodus
- damp stiger fra vannet når det varmes
- bassenglyset lyser opp vannet nedenfra
- står varmepumpa i auto, blinker et gult varsel, siden den kan kjøle i auto

Alle entitetene har standardverdier for ditt oppsett, så `type:` alene holder.

Kortet er tatt inn uendret og registrerer seg gjennom `KI.define` som resten. En eldre kopi
installert som egen ressurs kolliderer derfor ikke, men hoppes over med en advarsel i konsollen.
Kortet har fått ikon i `brand/` og en rad i kort-tabellen i README.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass — ett mer enn før. Kortet er
i tillegg tegnet i alle tilstandene til varmepumpa: varme (med pumpe, lys og stillemodus), auto, av og
utilgjengelig — riktig tilstandsklasse på scenen hver gang, og ingen `NaN` eller `undefined` i
markeringen.

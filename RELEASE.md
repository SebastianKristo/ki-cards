# ki-cards 8.91.0

Bygget oppå 8.90.0 fra GitHub.

## ki-kart-card 1.2.0: kartet fyller skjermen — også i høyden

Etter første titt på iPaden:

- **Høyden** regnes nå ut fra der kartet faktisk starter til bunnen av skjermen (minus `bunn:`, 20 px), i
  stedet for en fast luft på 170 px. Popupens topp er høyere enn det, så brikkene med personene ble kuttet
  nederst. Høyden måles på nytt etter at popupen har glidd inn, og når vinduet endrer størrelse.
- **Ingen samling i tall.** Kartkortet samlet personer som står nær hverandre til en boble med «3». Nå får
  hver person og bilen sitt eget merke (`samle: true` gir samlingen tilbake).
- **Sonebrikkene** øverst starter til høyre for zoomknappene, som de dekket.

**Bredden** styres av popupen: `examples/kart-popup.yaml` har nå `width_desktop: 94%`, så popupen går nesten
kant til kant på iPaden.

### Kontrollert

Begge byggesjekkene kjørt. Kartkortet i stor visning: kartkortet får `cluster: false`, tre soner øverst og fire
brikker nederst; popupen er gyldig YAML med `width_desktop: 94%`.
